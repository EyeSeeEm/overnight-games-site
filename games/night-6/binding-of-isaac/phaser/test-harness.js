const { chromium } = require('playwright');

async function test() {
    console.log('Launching browser...');
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    console.log('Browser launched');

    const page = await browser.newPage();
    console.log('Page created');

    const gamePath = '/workspace/games/night-6/binding-of-isaac/phaser/index.html';
    console.log('Loading:', gamePath);
    await page.goto('file://' + gamePath);
    console.log('Page loaded');

    await page.waitForTimeout(3000);

    const hasHarness = await page.evaluate(() => typeof window.harness !== 'undefined');
    console.log('Has harness:', hasHarness);

    if (hasHarness) {
        await page.evaluate(() => window.harness.debug.forceStart());
        console.log('Game started');
        await page.waitForTimeout(500);

        const state = await page.evaluate(() => window.harness.getState());
        console.log('Player position:', state.player?.x, state.player?.y);
        console.log('Player health:', state.player?.health);
        console.log('Enemies:', state.enemies?.length);
        console.log('Game phase:', state.gamePhase || state.gameState);

        // Try one action
        console.log('Executing action...');
        await page.evaluate(({a, d}) => window.harness.execute(a, d), { a: { keys: ['d', 'ArrowRight'] }, d: 300 });

        const newState = await page.evaluate(() => window.harness.getState());
        console.log('New position:', newState.player?.x, newState.player?.y);
    } else {
        console.log('ERROR: No harness found');
    }

    await browser.close();
    console.log('Done');
}

test().catch(e => console.error('Error:', e.message));
