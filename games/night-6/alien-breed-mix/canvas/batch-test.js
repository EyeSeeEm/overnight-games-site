// Batch test - optimized for speed
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await page.waitForTimeout(1500);

    let totalKills = 0;
    let totalDeaths = 0;

    for (let iter = 1; iter <= 100; iter++) {
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(100);

        let kills = 0;
        let lastCount = 0;

        for (let step = 0; step < 80; step++) {
            const state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            const enemies = state.enemies || [];
            if (enemies.length < lastCount) kills += lastCount - enemies.length;
            lastCount = enemies.length;

            const visible = enemies.filter(e => e.visible);
            let action;

            if (visible.length > 0) {
                const e = visible[0];
                action = { click: { x: 640 + (e.x - state.camera.x), y: 360 + (e.y - state.camera.y) } };
            } else {
                const dirs = [['w'], ['d'], ['s'], ['a'], ['w','d'], ['s','a']];
                action = { keys: dirs[step % 6] };
            }

            await page.evaluate(({a, d}) => window.harness.execute(a, d), { a: action, d: 150 });

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') { totalDeaths++; break; }
            if (phase === 'victory') break;
        }

        totalKills += kills;
        if (iter % 20 === 0) console.log(`Iter ${iter}: Total kills=${totalKills}, Deaths=${totalDeaths}`);
    }

    console.log('\\n=== FINAL ===');
    console.log(`100 iterations completed`);
    console.log(`Total kills: ${totalKills}`);
    console.log(`Total deaths: ${totalDeaths}`);
    console.log(`Avg kills/iter: ${(totalKills/100).toFixed(2)}`);

    await browser.close();
})().catch(console.error);
