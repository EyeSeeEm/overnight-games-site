// Lost Outpost Playtest Script
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function playtest() {
    console.log('Starting Lost Outpost playtest...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await sleep(2000);

    const harnessExists = await page.evaluate(() => typeof window.harness !== 'undefined');
    if (!harnessExists) {
        console.error('Harness not found!');
        await browser.close();
        return;
    }

    let log = '# Lost Outpost (LittleJS) - Playtest Log\n\n';
    log += `Started: ${new Date().toISOString()}\n\n`;

    let totalKills = 0;
    let totalDeaths = 0;
    let highCredits = 0;

    for (let iter = 1; iter <= 100; iter++) {
        console.log(`\n=== Iteration ${iter}/100 ===`);

        await page.evaluate(() => window.harness.debug.forceStart());
        await sleep(300);

        let stepCount = 0;
        let state = await page.evaluate(() => window.harness.getState());
        let lastKills = state.kills || 0;

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
            if (state.kills > lastKills) {
                totalKills += (state.kills - lastKills);
                lastKills = state.kills;
            }

            if (state.credits > highCredits) highCredits = state.credits;

            // AI decision
            let action = { keys: ['Space'] }; // Always shoot
            let duration = 100;

            if (state.enemies && state.enemies.length > 0) {
                // Find nearest alert enemy
                const alertedEnemies = state.enemies.filter(e => e.alerted);
                const target = alertedEnemies.length > 0 ? alertedEnemies[0] : state.enemies[0];

                const dx = target.x - state.player.x;
                const dy = target.y - state.player.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Move toward enemy but maintain distance
                if (dist > 5) {
                    if (dx > 0.5) action.keys.push('d');
                    if (dx < -0.5) action.keys.push('a');
                    if (dy > 0.5) action.keys.push('w');
                    if (dy < -0.5) action.keys.push('s');
                } else if (dist < 2) {
                    // Back up
                    if (dx > 0) action.keys.push('a');
                    else action.keys.push('d');
                    if (dy > 0) action.keys.push('s');
                    else action.keys.push('w');
                }

                duration = 80;
            } else {
                // Explore
                const dir = Math.floor(Math.random() * 4);
                action.keys.push(['w', 's', 'a', 'd'][dir]);
                duration = 150;
            }

            // Reload when low
            if (state.player.ammo <= 5) {
                action.keys.push('r');
            }

            await page.evaluate(
                ({action, duration}) => window.harness.execute(action, duration),
                { action, duration }
            );

            await sleep(10);
        }

        console.log(`  Iter ${iter}: ${state.kills || 0} kills, ${state.credits || 0} credits, ${stepCount} steps`);

        if (iter % 10 === 0) {
            log += `## Iterations ${iter-9}-${iter}\n`;
            log += `- Total Kills: ${totalKills}, Deaths: ${totalDeaths}\n`;
            log += `- High Credits: ${highCredits}\n\n`;
        }

        if (iter % 25 === 0) {
            await page.screenshot({ path: path.join(__dirname, `iter-${iter}.png`) });
        }
    }

    log += `\n## Final Summary\n`;
    log += `- Iterations: 100\n`;
    log += `- Total Kills: ${totalKills}\n`;
    log += `- Deaths: ${totalDeaths}\n`;
    log += `- High Credits: ${highCredits}\n`;
    log += `\nCompleted: ${new Date().toISOString()}\n`;

    fs.writeFileSync(path.join(__dirname, 'ITERATIONS.md'), log);
    console.log(`\nPlaytest complete! Kills: ${totalKills}, Deaths: ${totalDeaths}`);

    await browser.close();
}

playtest().catch(console.error);
