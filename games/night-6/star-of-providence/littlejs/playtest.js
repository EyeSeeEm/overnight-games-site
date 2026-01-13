// Star of Providence Playtest Script
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function playtest() {
    console.log('Starting Star of Providence playtest...');

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

    let iterationLog = '# Star of Providence (LittleJS) - Playtest Log\n\n';
    iterationLog += `Started: ${new Date().toISOString()}\n\n`;

    let totalKills = 0;
    let totalDeaths = 0;
    let highScore = 0;
    let maxWave = 0;

    for (let iter = 1; iter <= 100; iter++) {
        console.log(`\n=== Iteration ${iter}/100 ===`);

        await page.evaluate(() => window.harness.debug.forceStart());
        await sleep(300);

        let stepCount = 0;
        let lastEnemyCount = 0;
        let state = await page.evaluate(() => window.harness.getState());
        lastEnemyCount = state.enemies ? state.enemies.length : 0;

        while (stepCount < 150) {
            stepCount++;

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') {
                totalDeaths++;
                break;
            }

            state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track kills
            const currentEnemies = state.enemies ? state.enemies.length : 0;
            if (currentEnemies < lastEnemyCount) {
                totalKills += (lastEnemyCount - currentEnemies);
            }
            lastEnemyCount = currentEnemies;

            // Track high score and max wave
            if (state.score > highScore) highScore = state.score;
            if (state.wave > maxWave) maxWave = state.wave;

            // Decide action
            let action = { keys: ['Space'] }; // Always shoot
            let duration = 80;

            // Dodge enemy bullets - move to less dense area
            if (state.enemyBullets > 10) {
                // Many bullets, use focus mode and try to dodge
                action.keys.push('Shift');

                // Random dodging
                const dodgeDir = Math.random();
                if (dodgeDir < 0.25) action.keys.push('a');
                else if (dodgeDir < 0.5) action.keys.push('d');
                else if (dodgeDir < 0.75) action.keys.push('w');
                else action.keys.push('s');

                duration = 60;
            } else if (state.enemies && state.enemies.length > 0) {
                // Move toward enemies to attack
                const nearest = state.enemies.reduce((a, b) => {
                    const distA = Math.sqrt((a.x - state.player.x)**2 + (a.y - state.player.y)**2);
                    const distB = Math.sqrt((b.x - state.player.x)**2 + (b.y - state.player.y)**2);
                    return distA < distB ? a : b;
                });

                const dx = nearest.x - state.player.x;
                const dy = nearest.y - state.player.y;

                // Stay in lower half, aim upward
                if (state.player.y > 10) {
                    action.keys.push('s'); // Move down to safer position
                }

                // Horizontal tracking
                if (dx > 0.5) action.keys.push('d');
                else if (dx < -0.5) action.keys.push('a');

                duration = 100;
            } else {
                // No enemies, wait in safe position
                if (state.player.y > 5) action.keys.push('s');
                duration = 150;
            }

            await page.evaluate(
                ({action, duration}) => window.harness.execute(action, duration),
                { action, duration }
            );

            await sleep(10);
        }

        console.log(`  Iter ${iter}: Wave ${state.wave || 0}, Score ${state.score || 0}, ${stepCount} steps`);

        if (iter % 10 === 0) {
            iterationLog += `## Iterations ${iter-9}-${iter}\n`;
            iterationLog += `- Max Wave: ${maxWave}, High Score: ${highScore}\n`;
            iterationLog += `- Total Kills: ${totalKills}, Deaths: ${totalDeaths}\n\n`;
        }

        if (iter % 25 === 0) {
            await page.screenshot({ path: path.join(__dirname, `iter-${iter}.png`) });
        }
    }

    iterationLog += `\n## Final Summary\n`;
    iterationLog += `- Total iterations: 100\n`;
    iterationLog += `- Total kills: ${totalKills}\n`;
    iterationLog += `- Deaths: ${totalDeaths}\n`;
    iterationLog += `- High Score: ${highScore}\n`;
    iterationLog += `- Max Wave Reached: ${maxWave}\n`;
    iterationLog += `\nCompleted: ${new Date().toISOString()}\n`;

    fs.writeFileSync(path.join(__dirname, 'ITERATIONS.md'), iterationLog);
    console.log(`\nPlaytest complete!`);
    console.log(`Total kills: ${totalKills}, Deaths: ${totalDeaths}, High Score: ${highScore}, Max Wave: ${maxWave}`);

    await browser.close();
}

playtest().catch(console.error);
