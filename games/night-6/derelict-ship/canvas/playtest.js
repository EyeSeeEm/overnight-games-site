// Playtest script for Derelict - Survival Horror
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS_LOG = path.join(__dirname, 'ITERATIONS.md');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Log to iterations file
function log(msg) {
    console.log(msg);
    fs.appendFileSync(ITERATIONS_LOG, msg + '\n');
}

async function playtest(iterations = 100) {
    // Initialize log
    fs.writeFileSync(ITERATIONS_LOG, `# Iterations Log: derelict-ship (Canvas)\n\n`);
    fs.appendFileSync(ITERATIONS_LOG, `Started: ${new Date().toISOString()}\n\n`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    let bugsFound = 0;
    let bugsFixed = 0;
    let successfulRuns = 0;
    let totalEnemiesKilled = 0;
    let totalDeaths = 0;

    for (let iter = 1; iter <= iterations; iter++) {
        log(`\n## Iteration ${iter}`);

        try {
            await page.goto(GAME_PATH, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Force start the game
            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let state = await page.evaluate(() => window.harness.getState());
            let stepCount = 0;
            const maxSteps = 150;
            let lastX = 0, lastY = 0;
            let stuckCounter = 0;

            // Screenshot at start
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-start.png`) });
            }

            while (state.gameState === 'playing' && stepCount < maxSteps) {
                stepCount++;

                const player = state.player;
                const enemies = state.enemies.filter(e => e.revealed);
                const items = state.items;
                const camera = state.camera || { x: 0, y: 0 };

                let action = { keys: [] };
                let duration = 300;

                // Check if stuck
                if (player && Math.abs(player.x - lastX) < 2 && Math.abs(player.y - lastY) < 2) {
                    stuckCounter++;
                } else {
                    stuckCounter = 0;
                }
                lastX = player?.x || 0;
                lastY = player?.y || 0;

                // If stuck, try random direction
                if (stuckCounter > 3) {
                    const dirs = [['w'], ['s'], ['a'], ['d'], ['w', 'd'], ['s', 'a']];
                    action = { keys: dirs[Math.floor(Math.random() * dirs.length)] };
                    duration = 400;
                    stuckCounter = 0;
                }
                // Critical O2 - use item
                else if (player.oxygen < 30 && player.inventory.some(i => i?.includes('o2'))) {
                    const o2Slot = player.inventory.findIndex(i => i?.includes('o2'));
                    if (o2Slot >= 0) {
                        action = { keys: [(o2Slot + 1).toString()] };
                        duration = 100;
                    }
                }
                // Low health - use medkit
                else if (player.health < 35 && player.inventory.some(i => i?.includes('medkit'))) {
                    const medSlot = player.inventory.findIndex(i => i?.includes('medkit'));
                    if (medSlot >= 0) {
                        action = { keys: [(medSlot + 1).toString()] };
                        duration = 100;
                    }
                }
                // Enemy nearby - fight!
                else if (enemies.length > 0) {
                    let nearest = null;
                    let nearestDist = Infinity;

                    for (const e of enemies) {
                        const dist = Math.hypot(e.x - player.x, e.y - player.y);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearest = e;
                        }
                    }

                    if (nearest && nearestDist < 100) {
                        // Attack!
                        const screenX = nearest.x - camera.x;
                        const screenY = nearest.y - camera.y;
                        action = { click: { x: screenX, y: screenY } };
                        duration = 600;
                        if (stepCount % 10 === 1) {
                            log(`  Step ${stepCount}: Fighting ${nearest.type}, dist=${nearestDist.toFixed(0)}`);
                        }
                    } else if (nearest && nearestDist < 250) {
                        // Move toward enemy
                        const dx = nearest.x - player.x;
                        const dy = nearest.y - player.y;
                        const keys = [];
                        if (dy < -15) keys.push('w');
                        if (dy > 15) keys.push('s');
                        if (dx < -15) keys.push('a');
                        if (dx > 15) keys.push('d');
                        action = { keys: keys.length > 0 ? keys : ['d'] };
                        duration = 350;
                    } else {
                        // Explore
                        const dir = stepCount % 8;
                        const dirs = [['d'], ['d', 's'], ['s'], ['a', 's'], ['a'], ['a', 'w'], ['w'], ['d', 'w']];
                        action = { keys: dirs[dir] };
                        duration = 400;
                    }
                }
                // Collect items
                else if (items.length > 0) {
                    let nearest = null;
                    let nearestDist = Infinity;

                    for (const item of items) {
                        const dist = Math.hypot(item.x - player.x, item.y - player.y);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearest = item;
                        }
                    }

                    if (nearest) {
                        const dx = nearest.x - player.x;
                        const dy = nearest.y - player.y;
                        const keys = [];
                        if (Math.abs(dy) > 10) keys.push(dy < 0 ? 'w' : 's');
                        if (Math.abs(dx) > 10) keys.push(dx < 0 ? 'a' : 'd');
                        action = { keys: keys.length > 0 ? keys : [] };
                        duration = 300;
                    }
                }
                // Explore and find doors
                else {
                    const dir = (stepCount + iter) % 8;
                    const dirs = [['d'], ['d', 's'], ['s'], ['a', 's'], ['a'], ['a', 'w'], ['w'], ['d', 'w']];
                    action = { keys: dirs[dir] };
                    duration = 500;

                    // Try interact periodically
                    if (stepCount % 8 === 0) {
                        action.keys = ['e'];
                        duration = 200;
                    }
                }

                // Execute
                await page.evaluate(
                    ({ action, duration }) => window.harness.execute(action, duration),
                    { action, duration }
                );

                state = await page.evaluate(() => window.harness.getState());

                if (state.gameState !== 'playing') break;
            }

            // Screenshot at end
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-end.png`) });
            }

            const finalState = await page.evaluate(() => window.harness.getState());

            if (finalState.gameState === 'victory') {
                successfulRuns++;
                log(`  VICTORY in ${stepCount} steps!`);
            } else if (finalState.gameState === 'gameover') {
                totalDeaths++;
                log(`  DIED after ${stepCount} steps. HP=${finalState.player?.health?.toFixed(0)}, O2=${finalState.player?.oxygen?.toFixed(0)}`);
            } else {
                log(`  TIMEOUT after ${maxSteps} steps`);
            }

            const kills = finalState.stats?.enemiesKilled || 0;
            totalEnemiesKilled += kills;
            log(`  Kills: ${kills}, Rooms: ${finalState.stats?.roomsExplored || 0}, Sector: ${finalState.sector + 1}`);

        } catch (error) {
            log(`  ERROR: ${error.message}`);
            bugsFound++;
        }

        await page.waitForTimeout(100);
    }

    // Summary
    log(`\n\n## Summary`);
    log(`- Iterations: ${iterations}`);
    log(`- Victories: ${successfulRuns}`);
    log(`- Deaths: ${totalDeaths}`);
    log(`- Timeouts: ${iterations - successfulRuns - totalDeaths - bugsFound}`);
    log(`- Errors: ${bugsFound}`);
    log(`- Total Kills: ${totalEnemiesKilled}`);
    log(`\nCompleted: ${new Date().toISOString()}`);

    await browser.close();

    return { iterations, successfulRuns, totalDeaths, totalEnemiesKilled, bugsFound };
}

if (require.main === module) {
    const count = parseInt(process.argv[2]) || 100;
    playtest(count).then(r => {
        console.log('\nResults:', r);
        process.exit(0);
    }).catch(e => {
        console.error('Failed:', e);
        process.exit(1);
    });
}

module.exports = { playtest };
