// Playtest script for X-COM Classic Clone
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS_LOG = path.join(__dirname, 'ITERATIONS.md');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function log(msg) {
    console.log(msg);
    fs.appendFileSync(ITERATIONS_LOG, msg + '\n');
}

async function playtest(iterations = 100) {
    fs.writeFileSync(ITERATIONS_LOG, `# Iterations Log: xcom-classic (Canvas)\n\n`);
    fs.appendFileSync(ITERATIONS_LOG, `Started: ${new Date().toISOString()}\n\n`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    let victories = 0;
    let deaths = 0;
    let totalKills = 0;
    let errors = 0;

    for (let iter = 1; iter <= iterations; iter++) {
        log(`\n## Iteration ${iter}`);

        try {
            await page.goto(GAME_PATH, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Force start
            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let state = await page.evaluate(() => window.harness.getState());
            let stepCount = 0;
            const maxSteps = 100;

            // Take start screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-start.png`) });
            }

            while (state.gameState === 'playing' && stepCount < maxSteps) {
                stepCount++;

                const soldiers = state.soldiers;
                const aliens = state.aliens;
                const selected = state.selectedSoldier;

                if (!selected || soldiers.length === 0) {
                    // No soldiers - game should end
                    break;
                }

                // Strategy: attack visible aliens, then advance
                let action = {};
                let duration = 300;

                if (aliens.length > 0) {
                    // Find closest visible alien to selected soldier
                    let closestAlien = null;
                    let closestDist = Infinity;

                    for (const alien of aliens) {
                        const dist = Math.abs(alien.x - selected.x) + Math.abs(alien.y - selected.y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestAlien = alien;
                        }
                    }

                    if (closestAlien && selected.tu >= 15) {
                        // Attack!
                        const clickX = closestAlien.x * 32 + 16;
                        const clickY = closestAlien.y * 32 + 16;
                        action.click = { x: clickX, y: clickY };

                        if (stepCount === 1 || stepCount % 10 === 0) {
                            log(`  Step ${stepCount}: Attacking ${closestAlien.type} at (${closestAlien.x},${closestAlien.y}), dist=${closestDist}`);
                        }
                    } else if (selected.tu >= 8) {
                        // Move toward alien
                        const dx = Math.sign(closestAlien.x - selected.x);
                        const dy = Math.sign(closestAlien.y - selected.y);
                        const moveX = (selected.x + dx) * 32 + 16;
                        const moveY = (selected.y + dy) * 32 + 16;
                        action.click = { x: moveX, y: moveY };
                    } else {
                        // Low TU - end turn or switch soldier
                        action.keys = ['Tab'];
                    }
                } else {
                    // No visible aliens - move forward and end turn
                    if (selected.tu >= 8) {
                        // Move north-east toward enemy spawn
                        const moveX = (selected.x + 1) * 32 + 16;
                        const moveY = (selected.y - 1) * 32 + 16;
                        action.click = { x: moveX, y: moveY };
                    } else {
                        // End turn to find more aliens
                        action.keys = ['Enter'];
                        log(`  Step ${stepCount}: Ending turn`);
                        duration = 1000; // Wait for alien turn
                    }
                }

                // Execute action
                await page.evaluate(
                    ({ action, duration }) => window.harness.execute(action, duration),
                    { action, duration }
                );

                // Get new state
                state = await page.evaluate(() => window.harness.getState());

                // Check for game end
                if (state.gameState !== 'playing') break;
            }

            // Take end screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-end.png`) });
            }

            // Final state
            const final = await page.evaluate(() => window.harness.getState());

            if (final.gameState === 'victory') {
                victories++;
                log(`  VICTORY! Turns: ${final.turnNumber}, Kills: ${final.stats.aliensKilled}, Accuracy: ${final.stats.shotsFired > 0 ? Math.floor(final.stats.shotsHit / final.stats.shotsFired * 100) : 0}%`);
            } else if (final.gameState === 'gameover') {
                deaths++;
                log(`  DEFEAT. Turns: ${final.turnNumber}, Kills: ${final.stats.aliensKilled}, Lost: ${final.stats.soldiersLost}`);
            } else {
                log(`  TIMEOUT after ${maxSteps} steps. Turns: ${final.turnNumber}, Soldiers: ${final.soldiersAlive}, Aliens: ${final.aliensAlive}`);
            }

            totalKills += final.stats?.aliensKilled || 0;

        } catch (error) {
            log(`  ERROR: ${error.message}`);
            errors++;
        }

        await page.waitForTimeout(100);
    }

    log(`\n\n## Summary`);
    log(`- Iterations: ${iterations}`);
    log(`- Victories: ${victories}`);
    log(`- Defeats: ${deaths}`);
    log(`- Timeouts: ${iterations - victories - deaths - errors}`);
    log(`- Errors: ${errors}`);
    log(`- Total Kills: ${totalKills}`);
    log(`\nCompleted: ${new Date().toISOString()}`);

    await browser.close();
    return { iterations, victories, deaths, totalKills, errors };
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
