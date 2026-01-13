// Brotato Playtest Script
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function playtest() {
    console.log('Starting Brotato playtest...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await sleep(2000);

    const harnessExists = await page.evaluate(() => typeof window.harness !== 'undefined');
    if (!harnessExists) {
        console.error('Harness not found!');
        await browser.close();
        return;
    }

    let log = '# Brotato (LittleJS) - Playtest Log\n\n';
    log += `Started: ${new Date().toISOString()}\n\n`;

    let totalKills = 0;
    let totalDeaths = 0;
    let maxWave = 1;
    let maxLevel = 1;

    for (let iter = 1; iter <= 100; iter++) {
        console.log(`\n=== Iteration ${iter}/100 ===`);

        await page.evaluate(() => window.harness.debug.forceStart());
        await sleep(300);

        let stepCount = 0;

        while (stepCount < 300) {
            stepCount++;

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') {
                totalDeaths++;
                break;
            }
            if (phase === 'victory') {
                break;
            }
            if (phase === 'shop') {
                // Skip shop quickly
                await page.evaluate(
                    ({action, duration}) => window.harness.execute(action, duration),
                    { action: { keys: ['Space'] }, duration: 200 }
                );
                await sleep(50);
                continue;
            }

            const state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track stats
            if (state.wave > maxWave) maxWave = state.wave;
            if (state.level > maxLevel) maxLevel = state.level;

            // AI: Kite enemies - move away from nearest enemy
            let action = { keys: [] };
            let duration = 100;

            if (state.enemies && state.enemies.length > 0) {
                // Find center of mass of nearby enemies
                let avgDx = 0, avgDy = 0;
                for (const e of state.enemies) {
                    avgDx += e.x - state.player.x;
                    avgDy += e.y - state.player.y;
                }
                avgDx /= state.enemies.length;
                avgDy /= state.enemies.length;

                // Move away from enemies
                if (avgDx > 0.5) action.keys.push('a');
                if (avgDx < -0.5) action.keys.push('d');
                if (avgDy > 0.5) action.keys.push('s');
                if (avgDy < -0.5) action.keys.push('w');

                duration = 80;
            } else {
                // Random movement to collect pickups
                const dir = Math.floor(Math.random() * 4);
                action.keys.push(['w', 's', 'a', 'd'][dir]);
                duration = 150;
            }

            if (action.keys.length === 0) {
                action.keys.push('d'); // Default move
            }

            await page.evaluate(
                ({action, duration}) => window.harness.execute(action, duration),
                { action, duration }
            );

            await sleep(10);
        }

        const finalState = await page.evaluate(() => window.harness.getState());
        totalKills = finalState.kills || totalKills;
        console.log(`  Iter ${iter}: Wave ${finalState.wave || 1}, Level ${finalState.level || 1}, ${finalState.kills || 0} kills, ${stepCount} steps`);

        if (iter % 10 === 0) {
            log += `## Iterations ${iter-9}-${iter}\n`;
            log += `- Total Kills: ${totalKills}, Deaths: ${totalDeaths}\n`;
            log += `- Max Wave: ${maxWave}, Max Level: ${maxLevel}\n\n`;
        }

        if (iter % 25 === 0) {
            await page.screenshot({ path: path.join(__dirname, `iter-${iter}.png`) });
        }
    }

    log += `\n## Final Summary\n`;
    log += `- Iterations: 100\n`;
    log += `- Total Kills: ${totalKills}\n`;
    log += `- Deaths: ${totalDeaths}\n`;
    log += `- Max Wave: ${maxWave}\n`;
    log += `- Max Level: ${maxLevel}\n`;
    log += `\nCompleted: ${new Date().toISOString()}\n`;

    fs.writeFileSync(path.join(__dirname, 'ITERATIONS.md'), log);
    console.log(`\nPlaytest complete! Kills: ${totalKills}, Deaths: ${totalDeaths}, Max Wave: ${maxWave}`);

    await browser.close();
}

playtest().catch(console.error);
