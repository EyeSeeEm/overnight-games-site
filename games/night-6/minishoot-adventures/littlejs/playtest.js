// Minishoot Adventures Playtest Script
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function playtest() {
    console.log('Starting Minishoot Adventures playtest...');

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

    let log = '# Minishoot Adventures (LittleJS) - Playtest Log\n\n';
    log += `Started: ${new Date().toISOString()}\n\n`;

    let totalKills = 0;
    let totalDeaths = 0;
    let maxLevel = 1;

    for (let iter = 1; iter <= 100; iter++) {
        console.log(`\n=== Iteration ${iter}/100 ===`);

        await page.evaluate(() => window.harness.debug.forceStart());
        await sleep(300);

        let stepCount = 0;

        while (stepCount < 250) {
            stepCount++;

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') {
                totalDeaths++;
                break;
            }

            const state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track stats
            if (state.level > maxLevel) maxLevel = state.level;

            // AI: Move and shoot at enemies
            let action = { keys: [] };
            let duration = 100;

            if (state.enemies && state.enemies.length > 0) {
                // Find nearest enemy
                let nearest = state.enemies[0];
                let minDist = Infinity;
                for (const e of state.enemies) {
                    const dx = e.x - state.player.x;
                    const dy = e.y - state.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = e;
                    }
                }

                const dx = nearest.x - state.player.x;
                const dy = nearest.y - state.player.y;

                // Shoot toward enemy
                if (dx > 0.5) action.keys.push('ArrowRight');
                else if (dx < -0.5) action.keys.push('ArrowLeft');
                if (dy > 0.5) action.keys.push('ArrowUp');
                else if (dy < -0.5) action.keys.push('ArrowDown');

                // Kite - move perpendicular or away
                if (minDist < 3) {
                    // Dash away
                    if (Math.random() < 0.3) {
                        action.keys.push('Shift');
                    }
                    // Move away
                    if (dx > 0) action.keys.push('a');
                    else action.keys.push('d');
                    if (dy > 0) action.keys.push('s');
                    else action.keys.push('w');
                } else if (minDist > 8) {
                    // Move closer
                    if (dx > 0.5) action.keys.push('d');
                    else if (dx < -0.5) action.keys.push('a');
                    if (dy > 0.5) action.keys.push('w');
                    else if (dy < -0.5) action.keys.push('s');
                } else {
                    // Strafe
                    if (Math.random() < 0.5) {
                        action.keys.push(Math.random() < 0.5 ? 'a' : 'd');
                    } else {
                        action.keys.push(Math.random() < 0.5 ? 'w' : 's');
                    }
                }

                duration = 80;
            } else {
                // Explore randomly
                const dir = Math.floor(Math.random() * 4);
                action.keys.push(['w', 's', 'a', 'd'][dir]);
                duration = 150;
            }

            if (action.keys.length === 0) {
                action.keys.push('ArrowRight', 'd');
            }

            await page.evaluate(
                ({action, duration}) => window.harness.execute(action, duration),
                { action, duration }
            );

            await sleep(10);
        }

        const finalState = await page.evaluate(() => window.harness.getState());
        totalKills = finalState.kills || totalKills;
        console.log(`  Iter ${iter}: Level ${finalState.level || 1}, ${finalState.kills || 0} kills, ${stepCount} steps`);

        if (iter % 10 === 0) {
            log += `## Iterations ${iter-9}-${iter}\n`;
            log += `- Total Kills: ${totalKills}, Deaths: ${totalDeaths}\n`;
            log += `- Max Level: ${maxLevel}\n\n`;
        }

        if (iter % 25 === 0) {
            await page.screenshot({ path: path.join(__dirname, `iter-${iter}.png`) });
        }
    }

    log += `\n## Final Summary\n`;
    log += `- Iterations: 100\n`;
    log += `- Total Kills: ${totalKills}\n`;
    log += `- Deaths: ${totalDeaths}\n`;
    log += `- Max Level: ${maxLevel}\n`;
    log += `\nCompleted: ${new Date().toISOString()}\n`;

    fs.writeFileSync(path.join(__dirname, 'ITERATIONS.md'), log);
    console.log(`\nPlaytest complete! Kills: ${totalKills}, Deaths: ${totalDeaths}, Max Level: ${maxLevel}`);

    await browser.close();
}

playtest().catch(console.error);
