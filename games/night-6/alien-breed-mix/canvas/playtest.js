// Playtest script for Station Breach - Improved AI
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GAME_PATH = `file://${path.join(__dirname, 'index.html')}`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const LOGS_DIR = path.join(__dirname, 'playtest-logs');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

async function playtest(iterations = 200) {
    console.log('Starting playtest for Station Breach...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
        await page.goto(GAME_PATH);
        await page.waitForTimeout(2000);

        const harnessAvailable = await page.evaluate(() => typeof window.harness !== 'undefined');
        if (!harnessAvailable) throw new Error('Harness not available!');
        console.log('Harness detected');

        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(500);

        let iteration = 0;
        let totalKills = 0;
        let totalDeaths = 0;
        let totalVictories = 0;
        let bugs = [];
        let lastDir = 0;

        while (iteration < iterations) {
            iteration++;
            console.log(`\n=== Iteration ${iteration} ===`);

            // Initialize iteration log
            const iterLog = {
                game: 'alien-breed-mix',
                iteration: iteration,
                started: new Date().toISOString(),
                steps: [],
                outcome: null,
                kills: 0,
                duration: 0
            };
            const iterStartTime = Date.now();

            // Reset for new run
            let stepCount = 0;
            let killsThisRun = 0;
            let lastEnemyCount = 0;
            const maxSteps = 300;
            let exploreDir = Math.floor(Math.random() * 4);
            let stuckCounter = 0;
            let lastPos = { x: 0, y: 0 };

            // Take start screenshot for first 5 iterations
            if (iteration <= 5) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iteration}-start.png`) });
            }

            let phase = await page.evaluate(() => window.harness.getPhase());

            while (phase === 'playing' && stepCount < maxSteps) {
                stepCount++;
                const state = await page.evaluate(() => window.harness.getState());

                if (!state.player) break;

                const player = state.player;
                const enemies = state.enemies || [];
                const visibleEnemies = enemies.filter(e => e.visible);
                const pickups = state.pickups || [];
                const visiblePickups = pickups.filter(p => p.visible);
                const doors = state.doors || [];

                // Track kills
                if (enemies.length < lastEnemyCount) {
                    killsThisRun += lastEnemyCount - enemies.length;
                }
                lastEnemyCount = enemies.length;

                // Check if stuck
                const moved = Math.abs(player.x - lastPos.x) > 5 || Math.abs(player.y - lastPos.y) > 5;
                if (!moved) {
                    stuckCounter++;
                    if (stuckCounter > 10) {
                        exploreDir = (exploreDir + 1) % 4;
                        stuckCounter = 0;
                    }
                } else {
                    stuckCounter = 0;
                }
                lastPos = { x: player.x, y: player.y };

                let action;
                let duration = 200;

                // PRIORITY 1: Fight visible enemies
                if (visibleEnemies.length > 0) {
                    const nearest = visibleEnemies.reduce((a, b) => {
                        const distA = Math.hypot(a.x - player.x, a.y - player.y);
                        const distB = Math.hypot(b.x - player.x, b.y - player.y);
                        return distA < distB ? a : b;
                    });

                    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
                    const screenX = 640 + (nearest.x - state.camera.x);
                    const screenY = 360 + (nearest.y - state.camera.y);

                    let keys = [];
                    // Strafe while fighting
                    if (dist < 100) {
                        // Too close, back up
                        const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                        if (Math.cos(angle) > 0.3) keys.push('a');
                        if (Math.cos(angle) < -0.3) keys.push('d');
                        if (Math.sin(angle) > 0.3) keys.push('w');
                        if (Math.sin(angle) < -0.3) keys.push('s');
                    } else if (dist > 250) {
                        // Move closer
                        const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                        if (Math.cos(angle) > 0.3) keys.push('d');
                        if (Math.cos(angle) < -0.3) keys.push('a');
                        if (Math.sin(angle) > 0.3) keys.push('s');
                        if (Math.sin(angle) < -0.3) keys.push('w');
                    }

                    action = { keys, click: { x: screenX, y: screenY } };
                    duration = 150;
                }
                // PRIORITY 2: Reload if needed
                else if (player.currentMag === 0 && !player.isReloading) {
                    action = { keys: ['r'] };
                    duration = 100;
                }
                // PRIORITY 3: Open doors
                else if (doors.some(d => d.playerNearby && !d.isOpen)) {
                    action = { keys: ['Space'] };
                    duration = 200;
                }
                // PRIORITY 4: Collect pickups
                else if (visiblePickups.length > 0) {
                    const pickup = visiblePickups[0];
                    const angle = Math.atan2(pickup.y - player.y, pickup.x - player.x);
                    let keys = [];
                    if (Math.cos(angle) > 0.3) keys.push('d');
                    if (Math.cos(angle) < -0.3) keys.push('a');
                    if (Math.sin(angle) > 0.3) keys.push('s');
                    if (Math.sin(angle) < -0.3) keys.push('w');
                    action = { keys };
                    duration = 300;
                }
                // PRIORITY 5: Explore
                else {
                    const exploreDirs = [['w'], ['d'], ['s'], ['a']];
                    const diagDirs = [['w','d'], ['s','d'], ['s','a'], ['w','a']];

                    // Sometimes change direction
                    if (Math.random() < 0.05) {
                        exploreDir = Math.floor(Math.random() * 4);
                    }

                    const keys = Math.random() < 0.3 ? diagDirs[exploreDir] : exploreDirs[exploreDir];
                    action = { keys };
                    duration = 400;
                }

                // Execute action
                await page.evaluate(
                    ({ action, duration }) => window.harness.execute(action, duration),
                    { action, duration }
                );

                phase = await page.evaluate(() => window.harness.getPhase());

                // Log progress every 50 steps
                if (stepCount % 50 === 0) {
                    console.log(`  Step ${stepCount}: HP=${player.health}, Enemies=${enemies.length}, Visible=${visibleEnemies.length}, Kills=${killsThisRun}`);
                }
            }

            totalKills += killsThisRun;
            iterLog.kills = killsThisRun;
            iterLog.duration = Date.now() - iterStartTime;

            // Handle end state
            if (phase === 'gameover') {
                totalDeaths++;
                iterLog.outcome = 'death';
                console.log(`  DEATH at step ${stepCount}. Kills: ${killsThisRun}`);
                if (iteration <= 10) {
                    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iteration}-death.png`) });
                }
                await page.evaluate(() => window.harness.debug.forceStart());
                await page.waitForTimeout(200);
            } else if (phase === 'victory') {
                totalVictories++;
                iterLog.outcome = 'victory';
                console.log(`  VICTORY! Kills: ${killsThisRun}`);
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iteration}-victory.png`) });
                await page.evaluate(() => window.harness.debug.forceStart());
                await page.waitForTimeout(200);
            } else {
                iterLog.outcome = 'timeout';
                console.log(`  Timeout at step ${stepCount}. Kills: ${killsThisRun}`);
                await page.evaluate(() => window.harness.debug.forceStart());
                await page.waitForTimeout(200);
            }

            // Save iteration log
            const logFile = path.join(LOGS_DIR, `iter-${String(iteration).padStart(3, '0')}.json`);
            fs.writeFileSync(logFile, JSON.stringify(iterLog, null, 2));

            // Checkpoint every 25 iterations
            if (iteration % 25 === 0) {
                console.log(`\n--- CHECKPOINT at iteration ${iteration} ---`);
                console.log(`Deaths: ${totalDeaths}, Victories: ${totalVictories}, Total Kills: ${totalKills}`);
                if (totalVictories === 0 && iteration >= 25) {
                    console.log('WARNING: 0 victories! Investigate game balance.');
                }
            }

            // Periodic page reload for stability
            if (iteration % 25 === 0) {
                console.log('  Reloading page for stability...');
                await page.reload();
                await page.waitForTimeout(2000);
                await page.evaluate(() => window.harness.debug.forceStart());
            }
        }

        // Summary
        console.log('\n========== PLAYTEST SUMMARY ==========');
        console.log(`Iterations: ${iterations}`);
        console.log(`Total kills: ${totalKills}`);
        console.log(`Total deaths: ${totalDeaths}`);
        console.log(`Total victories: ${totalVictories}`);
        console.log(`Bugs found: ${bugs.length}`);

        fs.writeFileSync(
            path.join(__dirname, 'playtest-results.json'),
            JSON.stringify({ iterations, totalKills, totalDeaths, totalVictories, bugs }, null, 2)
        );

        return { iterations, totalKills, totalDeaths, totalVictories, bugs };

    } catch (error) {
        console.error('Playtest error:', error);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error.png') });
        throw error;
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    const iterations = parseInt(process.argv[2]) || 100;
    playtest(iterations).then(() => {
        console.log('Playtest complete!');
        process.exit(0);
    }).catch(err => {
        console.error('Playtest failed:', err);
        process.exit(1);
    });
}

module.exports = { playtest };
