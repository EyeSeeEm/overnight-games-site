const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 900, height: 700 });

    page.on('pageerror', err => console.error('Page error:', err.message));

    await page.goto('file:///workspace/games/night-3/dune2/phaser/index.html');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshot-1.png' });

    const state = await page.evaluate(() => ({
        credits: window.gameState.credits,
        buildings: window.buildings.length,
        units: window.units.length,
        gameState: window.gameState.gameState
    }));

    console.log('Game State:', JSON.stringify(state, null, 2));
    await browser.close();
    console.log('Test complete!');
}

testGame().catch(console.error);
