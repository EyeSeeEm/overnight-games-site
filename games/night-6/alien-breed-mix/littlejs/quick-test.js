// Quick test to diagnose issues
const { chromium } = require('playwright');
const path = require('path');

async function quickTest() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await new Promise(r => setTimeout(r, 3000));

    // Force start
    await page.evaluate(() => window.harness.debug.forceStart());
    await new Promise(r => setTimeout(r, 500));

    // Get initial state
    let state = await page.evaluate(() => window.harness.getState());
    console.log('Initial state:', JSON.stringify(state, null, 2));

    // Take screenshot
    await page.screenshot({ path: path.join(__dirname, 'debug-1.png') });
    console.log('Screenshot 1 saved');

    // Try moving
    console.log('Testing movement...');
    await page.evaluate(({action, duration}) => window.harness.execute(action, duration), { action: { keys: ['d'] }, duration: 1000 });
    state = await page.evaluate(() => window.harness.getState());
    console.log('After move right:', state.player?.x);

    // Try shooting
    console.log('Testing shooting...');

    // Get debug info before
    let debug = await page.evaluate(() => window.harness.debug.getDebugInfo());
    console.log('Debug before shooting:', debug);

    await page.evaluate(({action, duration}) => window.harness.execute(action, duration), { action: { keys: ['Space'] }, duration: 500 });

    // Get debug info during (after execute)
    debug = await page.evaluate(() => window.harness.debug.getDebugInfo());
    console.log('Debug after execute:', debug);

    state = await page.evaluate(() => window.harness.getState());
    console.log('After shooting, ammo:', state.player?.ammo);

    // Try force shooting
    console.log('Testing force shoot...');
    await page.evaluate(() => {
        window.harness.debug.forceShoot();
        window.harness.debug.forceShoot();
        window.harness.debug.forceShoot();
    });
    state = await page.evaluate(() => window.harness.getState());
    console.log('After force shoot, ammo:', state.player?.ammo);

    // Screenshot
    await page.screenshot({ path: path.join(__dirname, 'debug-2.png') });
    console.log('Screenshot 2 saved');

    // Check if any enemies in range
    if (state.enemies && state.enemies.length > 0) {
        console.log('Enemies:', state.enemies.length);
        const nearest = state.enemies.reduce((a, b) => {
            const distA = Math.sqrt((a.x - state.player.x)**2 + (a.y - state.player.y)**2);
            const distB = Math.sqrt((b.x - state.player.x)**2 + (b.y - state.player.y)**2);
            return distA < distB ? a : b;
        });
        console.log('Nearest enemy:', nearest);
    }

    await browser.close();
}

quickTest().catch(console.error);
