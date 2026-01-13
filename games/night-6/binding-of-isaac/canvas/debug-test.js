// Quick debug test for Binding of Isaac Clone
const { chromium } = require('playwright');

const GAME_PATH = `file://${__dirname}/index.html`;

async function debugTest() {
    console.log('Starting debug test...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.goto(GAME_PATH);
    await page.waitForTimeout(2000);

    // Force start
    await page.evaluate(() => window.harness.debug.forceStart());
    await page.waitForTimeout(500);

    // Get initial state
    let state = await page.evaluate(() => window.harness.getState());
    console.log('Initial state:', JSON.stringify(state, null, 2));

    // Try moving north for a while
    console.log('\nMoving north toward door...');
    for (let i = 0; i < 30; i++) {
        await page.evaluate(
            ({ action, duration }) => window.harness.execute(action, duration),
            { action: { keys: ['w'] }, duration: 200 }
        );

        state = await page.evaluate(() => window.harness.getState());
        console.log(`Step ${i}: player=(${state.player.x.toFixed(0)}, ${state.player.y.toFixed(0)}), room=(${state.room.gridX},${state.room.gridY}), doors=${JSON.stringify(state.room.doors)}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('\nScreenshot saved to debug-screenshot.png');

    // Check room info
    console.log('\nFinal state:', JSON.stringify(state, null, 2));

    await browser.close();
    console.log('Debug test complete');
}

debugTest().catch(console.error);
