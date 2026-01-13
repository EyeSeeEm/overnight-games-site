// Zero Sievert Clone - Playtest Script
// Agent 2 - Night 6

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 800;
const STEP_DURATION = 80;

const logFile = path.join(__dirname, 'playtest-log.txt');
let logBuffer = [];

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}`;
    console.log(line);
    logBuffer.push(line);
}

function flushLog() {
    fs.appendFileSync(logFile, logBuffer.join('\n') + '\n');
    logBuffer = [];
}

function decideAction(state) {
    if (state.gameState === 'menu' || state.gameState === 'gameover' || state.gameState === 'extracted') {
        return { keys: ['Enter'], reason: 'Start/Restart game' };
    }

    if (!state.player || !state.extraction) {
        return { keys: [], reason: 'Waiting for game state' };
    }

    const player = state.player;
    const enemies = state.enemies || [];
    const extraction = state.extraction;

    // Priority 1: Run to extraction if low HP
    if (player.hp < 30 || (player.hp < 50 && extraction.distance < 200)) {
        const angle = Math.atan2(extraction.y - player.y, extraction.x - player.x);
        const moveKeys = getMovementKeys(angle);
        return {
            keys: moveKeys,
            mouse: { x: 400 + Math.cos(angle) * 100, y: 300 + Math.sin(angle) * 100, down: false },
            reason: 'Low HP: rushing extraction'
        };
    }

    // Priority 2: Fight nearby enemies
    const nearbyEnemies = enemies.filter(e =>
        Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2) < 250
    );

    if (nearbyEnemies.length > 0) {
        const closest = nearbyEnemies.reduce((a, b) => {
            const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA < distB ? a : b;
        });

        const dist = Math.sqrt((closest.x - player.x) ** 2 + (closest.y - player.y) ** 2);
        const angleToEnemy = Math.atan2(closest.y - player.y, closest.x - player.x);

        // Convert world angle to screen position for mouse
        const screenX = 400 + Math.cos(angleToEnemy) * 150;
        const screenY = 300 + Math.sin(angleToEnemy) * 150;

        // If too close, back up while shooting
        if (dist < 100) {
            const retreatAngle = angleToEnemy + Math.PI;
            const moveKeys = getMovementKeys(retreatAngle);
            return {
                keys: moveKeys,
                mouse: { x: screenX, y: screenY, down: true },
                reason: `Combat: retreating from ${closest.type} at ${Math.round(dist)}`
            };
        }

        // Optimal range - just shoot
        return {
            keys: [],
            mouse: { x: screenX, y: screenY, down: true },
            reason: `Combat: shooting ${closest.type} at ${Math.round(dist)}`
        };
    }

    // Priority 3: Loot nearby containers
    const unlootedContainers = (state.containers || []).filter(c => !c.looted);
    if (unlootedContainers.length > 0) {
        const closestContainer = unlootedContainers.reduce((a, b) => {
            const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA < distB ? a : b;
        });

        const dist = Math.sqrt((closestContainer.x - player.x) ** 2 + (closestContainer.y - player.y) ** 2);

        if (dist < 40) {
            // Close enough to loot
            return { keys: ['e'], reason: 'Looting container' };
        } else if (dist < 200) {
            // Move toward container
            const angle = Math.atan2(closestContainer.y - player.y, closestContainer.x - player.x);
            return { keys: getMovementKeys(angle), reason: `Moving to container (${Math.round(dist)})` };
        }
    }

    // Priority 4: Move toward extraction
    const angle = Math.atan2(extraction.y - player.y, extraction.x - player.x);
    const moveKeys = getMovementKeys(angle);

    // Occasionally sprint
    if (Math.random() < 0.3 && player.stamina > 30) {
        return {
            keys: [...moveKeys, 'Shift'],
            mouse: { x: 400 + Math.cos(angle) * 100, y: 300 + Math.sin(angle) * 100, down: false },
            reason: `Sprinting to extraction (${Math.round(extraction.distance)})`
        };
    }

    return {
        keys: moveKeys,
        mouse: { x: 400 + Math.cos(angle) * 100, y: 300 + Math.sin(angle) * 100, down: false },
        reason: `Moving to extraction (${Math.round(extraction.distance)})`
    };
}

function getMovementKeys(angle) {
    const keys = [];
    const deg = angle * 180 / Math.PI;

    // Convert angle to WASD keys
    if (deg > -135 && deg < -45) keys.push('w');
    if (deg > 45 && deg < 135) keys.push('s');
    if (Math.abs(deg) > 90) keys.push('a');
    if (Math.abs(deg) < 90) keys.push('d');

    return keys;
}

async function playtest() {
    log('Starting Zero Sievert Clone Playtest');
    log(`Target: ${ITERATIONS} iterations`);

    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            log(`[CONSOLE ERROR] ${msg.text()}`);
        }
    });

    try {
        log(`Loading game: ${GAME_PATH}`);
        await page.goto(GAME_PATH);
        await page.waitForTimeout(2000);

        const harnessExists = await page.evaluate(() => !!window.harness);
        if (!harnessExists) {
            throw new Error('Harness not found!');
        }
        log('Harness detected');

        let completedIterations = 0;
        let totalKills = 0;
        let totalExtractions = 0;
        let totalLoot = 0;

        while (completedIterations < ITERATIONS) {
            log(`\n=== ITERATION ${completedIterations + 1} ===`);

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let steps = 0;
            let lastHP = 100;
            let lastKills = 0;

            while (steps < MAX_STEPS_PER_ITERATION) {
                let state;
                try {
                    state = await page.evaluate(() => window.harness.getState());
                } catch (e) {
                    log(`[ERROR] ${e.message}`);
                    break;
                }

                if (state.gameState === 'gameover') {
                    log(`Died at step ${steps}, HP was ${lastHP}`);
                    totalKills += state.stats.enemiesKilled;
                    break;
                }

                if (state.gameState === 'extracted') {
                    log(`Extracted successfully! Kills: ${state.stats.enemiesKilled}, Loot: ${state.player?.lootValue || 0}`);
                    totalKills += state.stats.enemiesKilled;
                    totalExtractions++;
                    totalLoot += state.player?.lootValue || 0;
                    break;
                }

                // Track combat
                if (state.stats && state.stats.enemiesKilled > lastKills) {
                    log(`Kill! Total: ${state.stats.enemiesKilled}`);
                    lastKills = state.stats.enemiesKilled;
                }

                // Track damage
                if (state.player && state.player.hp < lastHP - 10) {
                    log(`Took damage: ${lastHP} -> ${state.player.hp}`);
                    lastHP = state.player.hp;
                } else if (state.player) {
                    lastHP = state.player.hp;
                }

                const decision = decideAction(state);

                try {
                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { keys: decision.keys, mouse: decision.mouse }, duration: STEP_DURATION }
                    );
                } catch (e) {
                    log(`[ERROR] Execute: ${e.message}`);
                    break;
                }

                steps++;

                if (steps % 100 === 0) {
                    const s = await page.evaluate(() => window.harness.getState());
                    log(`Step ${steps}: HP=${s.player?.hp || 0}, Ammo=${s.player?.ammo || 0}, Enemies=${s.enemies?.length || 0}, ExtractDist=${Math.round(s.extraction?.distance || 0)}, Kills=${s.stats?.enemiesKilled || 0}`);
                }
            }

            completedIterations++;
            flushLog();

            if (completedIterations % 5 === 0) {
                await page.screenshot({ path: path.join(__dirname, `screenshot-iter-${completedIterations}.png`) });
            }
        }

        log('\n========== SUMMARY ==========');
        log(`Iterations: ${completedIterations}`);
        log(`Total Kills: ${totalKills}`);
        log(`Successful Extractions: ${totalExtractions}/${completedIterations}`);
        log(`Total Loot Value: ${totalLoot}`);
        log('==============================');
        flushLog();

    } catch (error) {
        log(`[FATAL] ${error.message}`);
        flushLog();
    } finally {
        await browser.close();
    }

    log('Playtest complete');
    flushLog();
}

playtest().catch(console.error);
