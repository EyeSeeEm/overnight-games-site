// Fast playtest - fewer steps per iteration, more iterations
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function fastPlaytest(iterations = 100) {
    console.log(`Starting fast playtest (${iterations} iterations)...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.harness.debug.forceStart());
    await page.waitForTimeout(300);

    let totalKills = 0;
    let totalDeaths = 0;
    let results = [];

    for (let i = 1; i <= iterations; i++) {
        let kills = 0;
        let lastEnemies = 0;
        let died = false;

        // Quick 100-step run
        for (let step = 0; step < 100; step++) {
            const state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            const enemies = state.enemies || [];
            const visible = enemies.filter(e => e.visible);

            // Track kills
            if (enemies.length < lastEnemies) {
                kills += lastEnemies - enemies.length;
            }
            lastEnemies = enemies.length;

            // Simple action: move + shoot if enemy visible
            let action;
            if (visible.length > 0) {
                const e = visible[0];
                const sx = 640 + (e.x - state.camera.x);
                const sy = 360 + (e.y - state.camera.y);
                action = { keys: [], click: { x: sx, y: sy } };
            } else {
                const dirs = [['w'], ['d'], ['s'], ['a'], ['w','d'], ['s','a']];
                action = { keys: dirs[step % 6] };
            }

            await page.evaluate(
                ({ a, d }) => window.harness.execute(a, d),
                { a: action, d: 150 }
            );

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') {
                died = true;
                break;
            }
            if (phase === 'victory') break;
        }

        totalKills += kills;
        if (died) totalDeaths++;
        results.push({ iter: i, kills, died });

        if (i % 10 === 0) {
            console.log(`  Iter ${i}: Total kills=${totalKills}, Deaths=${totalDeaths}`);
        }

        // Restart
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(100);
    }

    await browser.close();

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Iterations: ${iterations}`);
    console.log(`Total kills: ${totalKills}`);
    console.log(`Total deaths: ${totalDeaths}`);
    console.log(`Avg kills/iter: ${(totalKills/iterations).toFixed(2)}`);

    fs.writeFileSync(
        path.join(__dirname, 'fast-results.json'),
        JSON.stringify({ iterations, totalKills, totalDeaths, results }, null, 2)
    );
}

fastPlaytest(parseInt(process.argv[2]) || 100).catch(console.error);
