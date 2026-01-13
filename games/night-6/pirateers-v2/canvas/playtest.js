// Pirateers Clone - Playtest Script
// Agent 2 - Night 6

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 600;
const STEP_DURATION = 100;

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
    if (state.gameState === 'menu' || state.gameState === 'gameover' || state.gameState === 'dayend') {
        return { keys: ['Enter'], reason: 'Start/Restart/Next' };
    }

    if (!state.player) {
        return { keys: [], reason: 'Waiting for player' };
    }

    const player = state.player;
    const enemies = state.enemies || [];

    // Find closest enemy
    let closestEnemy = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
        const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
        if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
        }
    }

    // Priority 1: If no enemies, patrol
    if (!closestEnemy) {
        return { keys: ['w'], reason: 'No enemies - patrolling' };
    }

    const keys = [];
    const angleToEnemy = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
    const playerAngle = player.angle;
    const forwardToEnemy = normalizeAngle(angleToEnemy - playerAngle);

    // Priority 2: Flee if very low health
    if (player.armor < 20 && closestDist < 300) {
        // Turn away from enemy
        if (forwardToEnemy > 0) {
            keys.push('a'); // Turn left (away)
        } else {
            keys.push('d'); // Turn right (away)
        }
        keys.push('w'); // Speed up
        return { keys, reason: `Fleeing (HP: ${player.armor})` };
    }

    // Priority 3: Close range combat - fire constantly while circling
    if (closestDist < 350) {
        // Always fire when in range - broadside fires both sides
        keys.push(' ');

        // Circle around enemy - turn toward them and move forward
        // This will put them on our broadside naturally
        if (Math.abs(forwardToEnemy) > 0.3) {
            keys.push(forwardToEnemy > 0 ? 'd' : 'a');
        }

        // Keep moving for broadside positioning
        keys.push('w');

        return {
            keys,
            reason: `Combat: ${closestEnemy.type} at ${Math.round(closestDist)}, firing!`
        };
    }

    // Priority 4: Move toward closest enemy
    // Turn to face enemy
    if (Math.abs(forwardToEnemy) > 0.3) {
        keys.push(forwardToEnemy > 0 ? 'd' : 'a');
    }
    keys.push('w');

    return { keys, reason: `Hunting: ${closestEnemy.type} at ${Math.round(closestDist)}` };
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

async function playtest() {
    log('Starting Pirateers Clone Playtest');
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
        let totalGold = 0;
        let totalDays = 0;

        while (completedIterations < ITERATIONS) {
            log(`\n=== ITERATION ${completedIterations + 1} ===`);

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let steps = 0;
            let lastArmor = 100;
            let lastEnemyCount = 0;
            let kills = 0;
            let iterGold = 0;

            while (steps < MAX_STEPS_PER_ITERATION) {
                let state;
                try {
                    state = await page.evaluate(() => window.harness.getState());
                } catch (e) {
                    log(`[ERROR] ${e.message}`);
                    break;
                }

                if (state.gameState === 'gameover') {
                    log(`Died at step ${steps}, armor was ${lastArmor}`);
                    log(`Final: Kills=${kills}, Gold=${state.gold}`);
                    totalKills += kills;
                    totalGold += state.gold - iterGold;
                    break;
                }

                if (state.gameState === 'dayend') {
                    log(`Day ${state.dayNumber} complete! Gold: ${state.gold}, Enemies left: ${state.enemies.length}`);
                    totalDays++;

                    // Start next day
                    await page.evaluate(
                        ({action, duration}) => window.harness.execute(action, duration),
                        { action: { keys: ['Enter'] }, duration: 300 }
                    );
                    await page.waitForTimeout(200);
                    continue;
                }

                // Track kills
                const currentEnemyCount = state.enemies ? state.enemies.length : 0;
                if (lastEnemyCount > currentEnemyCount) {
                    kills += (lastEnemyCount - currentEnemyCount);
                    log(`Kill! Total this run: ${kills}`);
                }
                lastEnemyCount = currentEnemyCount;

                // Track gold
                if (state.gold > iterGold) {
                    log(`Collected gold: ${state.gold - iterGold}g, total: ${state.gold}`);
                    iterGold = state.gold;
                }

                // Track damage
                if (state.player && state.player.armor < lastArmor - 10) {
                    log(`Took damage: ${lastArmor} -> ${state.player.armor}`);
                    lastArmor = state.player.armor;
                } else if (state.player) {
                    lastArmor = state.player.armor;
                }

                const decision = decideAction(state);

                try {
                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { keys: decision.keys }, duration: STEP_DURATION }
                    );
                } catch (e) {
                    log(`[ERROR] Execute: ${e.message}`);
                    break;
                }

                steps++;

                if (steps % 100 === 0) {
                    const s = await page.evaluate(() => window.harness.getState());
                    log(`Step ${steps}: Day=${s.dayNumber}, Armor=${s.player?.armor || 0}, Gold=${s.gold}, Enemies=${s.enemies?.length || 0}, Kills=${kills}`);
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
        log(`Total Gold: ${totalGold}`);
        log(`Total Days Survived: ${totalDays}`);
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
