// Playtest script for System Shock 2D: Whispers of M.A.R.I.A.
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
    fs.writeFileSync(ITERATIONS_LOG, `# Iterations Log: system-shock-2d (Canvas)\n\n`);
    fs.appendFileSync(ITERATIONS_LOG, `Started: ${new Date().toISOString()}\n\n`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    let victories = 0;
    let losses = 0;
    let totalKills = 0;
    let totalDecks = 0;
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
            const maxSteps = 300;

            // Take start screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-start.png`) });
            }

            while (state.gameState === 'playing' && stepCount < maxSteps) {
                stepCount++;

                // Get current state
                const player = state.player;
                const enemies = state.enemies || [];
                const items = state.items || [];

                let action = { keys: [] };
                let mouseAction = null;
                let duration = 300;

                // Find nearest enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;
                for (const enemy of enemies) {
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                }

                // Find nearest item
                let nearestItem = null;
                let nearestItemDist = Infinity;
                for (const item of items) {
                    const dx = item.x - player.x;
                    const dy = item.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestItemDist) {
                        nearestItemDist = dist;
                        nearestItem = item;
                    }
                }

                // Strategy: Combat + exploration
                if (nearestEnemy && nearestDist < 300) {
                    // Combat mode - aim and shoot
                    const dx = nearestEnemy.x - player.x;
                    const dy = nearestEnemy.y - player.y;

                    // Calculate mouse position to aim at enemy (relative to screen center)
                    action.click = {
                        x: 400 + dx,
                        y: 300 + dy
                    };

                    // Strafe while shooting
                    if (nearestDist < 100) {
                        // Too close - back away and dodge
                        if (dx > 0) action.keys.push('a');
                        else action.keys.push('d');

                        // Dodge occasionally
                        if (stepCount % 5 === 0) {
                            action.keys.push(' '); // Space for dodge
                        }
                    } else if (nearestDist > 200) {
                        // Move closer
                        if (dx > 0) action.keys.push('d');
                        else action.keys.push('a');
                        if (dy > 0) action.keys.push('s');
                        else action.keys.push('w');
                    }

                    if (stepCount % 20 === 0) {
                        log(`  Step ${stepCount}: Combat - enemy at dist ${Math.round(nearestDist)}, HP: ${player.health}`);
                    }
                } else if (nearestItem && nearestItemDist < 50) {
                    // Pick up item - items are auto-pickup on collision, just move toward them
                    const dx = nearestItem.x - player.x;
                    const dy = nearestItem.y - player.y;
                    if (dx > 5) action.keys.push('d');
                    else if (dx < -5) action.keys.push('a');
                    if (dy > 5) action.keys.push('s');
                    else if (dy < -5) action.keys.push('w');

                    if (stepCount % 10 === 0) {
                        log(`  Step ${stepCount}: Moving to item`);
                    }
                } else {
                    // Exploration mode - move around
                    const directions = [
                        { keys: ['w'], name: 'up' },
                        { keys: ['d'], name: 'right' },
                        { keys: ['s'], name: 'down' },
                        { keys: ['a'], name: 'left' },
                        { keys: ['w', 'd'], name: 'up-right' },
                        { keys: ['s', 'd'], name: 'down-right' },
                        { keys: ['s', 'a'], name: 'down-left' },
                        { keys: ['w', 'a'], name: 'up-left' }
                    ];

                    // Change direction occasionally
                    const dir = directions[(stepCount + iter) % directions.length];
                    action.keys = dir.keys;
                    duration = 400;
                }

                // Reload periodically
                if (stepCount % 15 === 0) {
                    action.keys.push('r');
                }

                // Quick heal if low
                if (player.health < 50 && stepCount % 10 === 0) {
                    action.keys.push('q');
                }

                // Execute action using harness interface
                await page.evaluate(
                    ({ action, duration }) => window.harness.execute(action, duration),
                    { action, duration }
                );

                // Get new state
                state = await page.evaluate(() => window.harness.getState());
            }

            // Take end screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-end.png`) });
            }

            // Final state
            const final = await page.evaluate(() => window.harness.getState());

            if (final.gameState === 'victory') {
                victories++;
                log(`  VICTORY! Deck: ${final.currentDeck}, Kills: ${final.stats?.enemiesKilled || 0}`);
            } else if (final.gameState === 'gameover') {
                losses++;
                log(`  DEATH on Deck ${final.currentDeck}. Health: ${final.player?.health || 0}, Kills: ${final.stats?.enemiesKilled || 0}`);
            } else {
                log(`  TIMEOUT after ${maxSteps} steps. Deck: ${final.currentDeck}, HP: ${final.player?.health}`);
            }

            totalKills += final.stats?.enemiesKilled || 0;
            totalDecks = Math.max(totalDecks, final.currentDeck || 1);

        } catch (error) {
            log(`  ERROR: ${error.message}`);
            errors++;
        }

        await page.waitForTimeout(100);
    }

    log(`\n\n## Summary`);
    log(`- Iterations: ${iterations}`);
    log(`- Victories: ${victories}`);
    log(`- Deaths: ${losses}`);
    log(`- Timeouts: ${iterations - victories - losses - errors}`);
    log(`- Errors: ${errors}`);
    log(`- Total Kills: ${totalKills}`);
    log(`- Max Deck Reached: ${totalDecks}`);
    log(`\nCompleted: ${new Date().toISOString()}`);

    await browser.close();
    return { iterations, victories, losses, totalKills, totalDecks, errors };
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
