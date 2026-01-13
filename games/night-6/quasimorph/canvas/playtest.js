// Playtest script for Quasimorph Clone - Turn-Based Tactical
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
    fs.writeFileSync(ITERATIONS_LOG, `# Iterations Log: quasimorph (Canvas)\n\n`);
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

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let state = await page.evaluate(() => window.harness.getState());
            let turnCount = 0;
            const maxTurns = 100;

            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-start.png`) });
            }

            while (state.gameState === 'playing' && turnCount < maxTurns) {
                turnCount++;
                const player = state.player;
                const visibleEnemies = state.enemies.filter(e => e.visible);

                // Player turn logic
                while (state.currentPhase === 'player' && player.ap > 0 && state.gameState === 'playing') {
                    // Priority 1: Attack visible enemies in range
                    if (visibleEnemies.length > 0 && player.ammo > 0) {
                        let target = null;
                        let minDist = Infinity;

                        for (const e of visibleEnemies) {
                            const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                            if (dist <= 10 && dist < minDist) {
                                minDist = dist;
                                target = e;
                            }
                        }

                        if (target) {
                            // Click on enemy to attack
                            const screenX = target.x * 32 - state.camera.x;
                            const screenY = target.y * 32 - state.camera.y;
                            await page.evaluate(
                                ({ action, duration }) => window.harness.execute(action, duration),
                                { action: { click: { x: screenX + 16, y: screenY + 16 } }, duration: 200 }
                            );
                            log(`  Turn ${turnCount}: Attacking ${target.type} at (${target.x},${target.y})`);
                            state = await page.evaluate(() => window.harness.getState());
                            continue;
                        }
                    }

                    // Priority 2: Reload if needed
                    if (player.ammo === 0 && player.ap >= 1) {
                        await page.evaluate(
                            ({ action, duration }) => window.harness.execute(action, duration),
                            { action: { keys: ['r'] }, duration: 100 }
                        );
                        log(`  Turn ${turnCount}: Reloading`);
                        state = await page.evaluate(() => window.harness.getState());
                        continue;
                    }

                    // Priority 3: Move toward extraction or nearest enemy
                    let targetX, targetY;

                    // Find extraction point (look for it on the map)
                    // For now, move generally toward bottom-right where extraction usually is
                    if (visibleEnemies.length > 0) {
                        const nearest = visibleEnemies.reduce((a, b) => {
                            const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
                            const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
                            return distA < distB ? a : b;
                        });
                        targetX = nearest.x;
                        targetY = nearest.y;
                    } else {
                        // Move toward bottom-right corner (likely extraction)
                        targetX = player.x + 1;
                        targetY = player.y + 1;
                    }

                    // Calculate move tile
                    const dx = Math.sign(targetX - player.x);
                    const dy = Math.sign(targetY - player.y);
                    const moveX = player.x + dx;
                    const moveY = player.y + dy;

                    const screenX = moveX * 32 - state.camera.x;
                    const screenY = moveY * 32 - state.camera.y;

                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { click: { x: screenX + 16, y: screenY + 16 } }, duration: 200 }
                    );

                    state = await page.evaluate(() => window.harness.getState());

                    // Break if can't do more
                    if (state.player.ap <= 0) break;
                }

                // End turn
                if (state.currentPhase === 'player' && state.gameState === 'playing') {
                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { keys: ['Enter'] }, duration: 100 }
                    );
                }

                // Wait for enemy turn
                await page.waitForTimeout(1500);

                state = await page.evaluate(() => window.harness.getState());

                if (state.gameState !== 'playing') break;
            }

            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-end.png`) });
            }

            const final = await page.evaluate(() => window.harness.getState());

            if (final.gameState === 'victory') {
                victories++;
                log(`  VICTORY! Turns: ${final.turnNumber}, Kills: ${final.stats.enemiesKilled}`);
            } else if (final.gameState === 'gameover') {
                deaths++;
                log(`  DIED at turn ${final.turnNumber}. HP: ${final.player?.hp}, Kills: ${final.stats.enemiesKilled}`);
            } else {
                log(`  TIMEOUT after ${maxTurns} turns. Kills: ${final.stats.enemiesKilled}`);
            }

            totalKills += final.stats?.enemiesKilled || 0;

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
