const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 900, height: 700 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('file:///workspace/games/night-3/dune2/canvas/index.html');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshot-1.png' });

    // Test building - press 1 to select Wind Trap
    await page.keyboard.press('1');
    await page.waitForTimeout(300);

    // Move mouse to place building
    await page.mouse.move(300, 350);
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshot-2.png' });

    // Click to place
    await page.mouse.click(300, 350);
    await page.waitForTimeout(500);

    // Test unit production - press Q for infantry
    await page.keyboard.press('q');
    await page.waitForTimeout(300);
    await page.keyboard.press('q');
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'screenshot-3.png' });

    // Wait for some game time
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshot-4.png' });

    const state = await page.evaluate(() => ({
        credits: window.gameState.credits,
        buildings: window.buildings.length,
        units: window.units.length,
        state: window.gameState.state,
        power: window.gameState.power
    }));

    console.log('Game State:', JSON.stringify(state, null, 2));
    console.log('Errors:', errors);

    await browser.close();
    console.log('Test complete!');
}

testGame().catch(console.error);
