// Station Breach Playtest Script - 100 iterations
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = path.join(__dirname, 'index.html');
const ITERATIONS_LOG = path.join(__dirname, 'ITERATIONS.md');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function playtest() {
    console.log('Starting Station Breach playtest...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`file://${GAME_PATH}`);
    await sleep(2000);

    const harnessExists = await page.evaluate(() => typeof window.harness !== 'undefined');
    if (!harnessExists) {
        console.error('ERROR: Harness not found!');
        await browser.close();
        return;
    }

    console.log('Harness found, starting playtest...');

    let iterationLog = '# Station Breach (LittleJS) - Playtest Log\n\n';
    iterationLog += `Started: ${new Date().toISOString()}\n\n`;

    let totalKills = 0;
    let totalDeaths = 0;
    let totalVictories = 0;
    let bugsFound = [];

    for (let iter = 1; iter <= 100; iter++) {
        console.log(`\n=== Iteration ${iter}/100 ===`);

        // Force start
        await page.evaluate(() => window.harness.debug.forceStart());
        await sleep(300);

        let stepCount = 0;
        let iterKills = 0;
        let startTime = Date.now();
        let lastEnemyCount = 0;

        // Get initial enemy count
        let state = await page.evaluate(() => window.harness.getState());
        lastEnemyCount = state.enemies ? state.enemies.length : 0;

        // Play until game over or victory (max 100 steps for speed)
        while (stepCount < 100) {
            stepCount++;

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover' || phase === 'victory') {
                if (phase === 'gameover') totalDeaths++;
                if (phase === 'victory') totalVictories++;
                break;
            }

            state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track kills
            if (state.enemies) {
                const killsThisStep = lastEnemyCount - state.enemies.length;
                if (killsThisStep > 0) {
                    iterKills += killsThisStep;
                    totalKills += killsThisStep;
                }
                lastEnemyCount = state.enemies.length;
            }

            // Decide action based on state
            let action = { keys: [] };
            let duration = 150;

            if (state.enemies && state.enemies.length > 0) {
                // Find nearest enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;

                for (const enemy of state.enemies) {
                    const dx = enemy.x - state.player.x;
                    const dy = enemy.y - state.player.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                }

                if (nearestEnemy && nearestDist < 20) {
                    const dx = nearestEnemy.x - state.player.x;
                    const dy = nearestEnemy.y - state.player.y;

                    // Move toward enemy if far, back up if too close
                    if (nearestDist > 4) {
                        if (dx > 0.5) action.keys.push('d');
                        if (dx < -0.5) action.keys.push('a');
                        if (dy > 0.5) action.keys.push('w');
                        if (dy < -0.5) action.keys.push('s');
                    } else if (nearestDist < 2) {
                        // Too close, back up
                        if (dx > 0) action.keys.push('a');
                        else action.keys.push('d');
                        if (dy > 0) action.keys.push('s');
                        else action.keys.push('w');
                    }

                    // Always shoot
                    action.keys.push('Space');
                    duration = 100;
                } else {
                    // Explore
                    const dir = Math.floor(Math.random() * 4);
                    action.keys.push(['w', 's', 'a', 'd'][dir]);
                    duration = 200;
                }
            } else {
                // No enemies, explore
                const dir = Math.floor(Math.random() * 4);
                action.keys.push(['w', 's', 'a', 'd'][dir]);
                if (Math.random() > 0.7) action.keys.push('e');
                duration = 200;
            }

            // Reload if low ammo
            if (state.player.ammo <= 2) {
                action.keys.push('r');
            }

            // Execute
            await page.evaluate(
                ({action, duration}) => window.harness.execute(action, duration),
                { action, duration }
            );

            await sleep(20);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  Iteration ${iter}: ${iterKills} kills, ${stepCount} steps, ${duration}s`);

        // Log every 10 iterations
        if (iter % 10 === 0 || iter === 1) {
            iterationLog += `## Iterations ${Math.max(1, iter-9)}-${iter}\n`;
            iterationLog += `- Kills this batch: ~${totalKills}\n`;
            iterationLog += `- Deaths: ${totalDeaths}, Victories: ${totalVictories}\n\n`;
        }

        // Screenshot every 25 iterations
        if (iter % 25 === 0) {
            await page.screenshot({ path: path.join(__dirname, `iter-${iter}.png`) });
        }
    }

    // Final summary
    iterationLog += `\n## Final Summary\n`;
    iterationLog += `- Total iterations: 100\n`;
    iterationLog += `- Total kills: ${totalKills}\n`;
    iterationLog += `- Total deaths: ${totalDeaths}\n`;
    iterationLog += `- Total victories: ${totalVictories}\n`;
    iterationLog += `\nCompleted: ${new Date().toISOString()}\n`;

    fs.writeFileSync(ITERATIONS_LOG, iterationLog);
    console.log(`\nPlaytest complete! Log saved to ITERATIONS.md`);
    console.log(`Total: ${totalKills} kills, ${totalDeaths} deaths, ${totalVictories} victories`);

    await browser.close();
}

playtest().catch(console.error);
