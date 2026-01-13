// Playtest script for Isolation Protocol (Subterrain Clone)
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
    fs.writeFileSync(ITERATIONS_LOG, `# Iterations Log: subterrain (Canvas)\n\n`);
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
            const maxSteps = 150;
            let lastSector = state.currentSector;
            let kills = 0;

            // Take start screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-start.png`) });
            }

            while (state.gameState === 'playing' && stepCount < maxSteps) {
                stepCount++;

                const player = state.player;
                const enemies = state.enemies;
                const sector = state.currentSector;

                // Log sector changes
                if (sector !== lastSector) {
                    log(`  Step ${stepCount}: Entered ${sector}`);
                    lastSector = sector;
                }

                // Decision making
                let action = { keys: [] };
                let duration = 300;

                // Priority 1: Fight nearby enemies
                if (enemies.length > 0) {
                    const nearest = enemies.reduce((a, b) => {
                        const distA = Math.hypot(a.x - player.x, a.y - player.y);
                        const distB = Math.hypot(b.x - player.x, b.y - player.y);
                        return distA < distB ? a : b;
                    });

                    const dist = Math.hypot(nearest.x - player.x, nearest.y - player.y);

                    if (stepCount === 1 || stepCount % 20 === 0) {
                        log(`  Step ${stepCount}: Fighting ${nearest.type}, dist=${Math.floor(dist)}`);
                    }

                    // Move toward enemy
                    if (nearest.x < player.x - 20) action.keys.push('a');
                    else if (nearest.x > player.x + 20) action.keys.push('d');
                    if (nearest.y < player.y - 20) action.keys.push('w');
                    else if (nearest.y > player.y + 20) action.keys.push('s');

                    // Attack if close
                    if (dist < 60) {
                        // Calculate screen position for click
                        const screenX = nearest.x - state.camera.x;
                        const screenY = nearest.y - state.camera.y;
                        action.click = { x: screenX, y: screenY };
                        duration = 400;
                    }
                } else {
                    // No enemies - explore
                    // Try to find unexplored sectors
                    if (sector === 'hub') {
                        // Go to storage first
                        action.keys.push('s');
                    } else if (sector === 'storage' && state.containers === 0) {
                        // Go back to hub
                        action.keys.push('w');
                    } else if (state.containers > 0) {
                        // Explore sector - move randomly
                        const dir = Math.floor(Math.random() * 4);
                        action.keys.push(['w', 's', 'a', 'd'][dir]);
                    } else {
                        // Try to interact
                        action.keys.push('e');
                    }
                }

                // Check survival needs
                if (player.hunger > 60 || player.thirst > 60) {
                    // Use quick slot 1 or 2
                    action.keys.push(player.hunger > player.thirst ? '1' : '2');
                }

                // Execute action
                await page.evaluate(
                    ({ action, duration }) => window.harness.execute(action, duration),
                    { action, duration }
                );

                // Get new state
                const prevEnemyCount = state.enemies.length;
                state = await page.evaluate(() => window.harness.getState());

                // Track kills
                if (state.enemies.length < prevEnemyCount) {
                    kills += prevEnemyCount - state.enemies.length;
                }

                // Check for death
                if (state.player.health <= 0) break;
            }

            // Take end screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-end.png`) });
            }

            // Final state
            const final = await page.evaluate(() => window.harness.getState());

            if (final.gameState === 'victory') {
                victories++;
                log(`  VICTORY! Time: ${final.gameTime} min, Infection: ${Math.floor(final.globalInfection)}%`);
            } else if (final.gameState === 'gameover') {
                deaths++;
                log(`  DIED. Health: ${Math.floor(final.player.health)}, Infection: ${Math.floor(final.player.infection)}, Global: ${Math.floor(final.globalInfection)}%`);
            } else {
                log(`  TIMEOUT after ${maxSteps} steps`);
            }

            log(`  Kills: ${kills}, Sectors: ${final.stats.sectorsVisited}, Sector: ${final.currentSector}`);
            totalKills += kills;

        } catch (error) {
            log(`  ERROR: ${error.message}`);
            errors++;
        }

        await page.waitForTimeout(100);
    }

    log(`\n\n## Summary`);
    log(`- Iterations: ${iterations}`);
    log(`- Victories: ${victories}`);
    log(`- Deaths: ${deaths}`);
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
