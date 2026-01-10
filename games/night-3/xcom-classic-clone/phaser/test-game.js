const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('file:///workspace/games/night-3/xcom-classic-clone/phaser/index.html');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshot-1.png' });

    // Test soldier selection
    await page.keyboard.press('2');
    await page.waitForTimeout(300);
    await page.keyboard.press('3');
    await page.waitForTimeout(300);

    // Test kneel
    await page.keyboard.press('k');
    await page.waitForTimeout(300);

    // Test movement
    await page.mouse.click(400, 200);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-2.png' });

    // Test shooting
    await page.keyboard.press('s');
    await page.waitForTimeout(500);

    // End turn
    await page.keyboard.press('e');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshot-3.png' });

    const state = await page.evaluate(() => ({
        turn: window.gameState.turn,
        turnNumber: window.gameState.turnNumber,
        state: window.gameState.state,
        soldiers: window.soldiers.filter(s => s.isAlive).length,
        aliens: window.aliens.filter(a => a.isAlive).length
    }));

    console.log('Game State:', JSON.stringify(state, null, 2));
    console.log('Errors:', errors);

    await browser.close();
    console.log('Test complete!');
}

testGame().catch(console.error);
