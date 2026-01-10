const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    // Collect console logs and errors
    const logs = [];
    const errors = [];
    page.on('console', msg => logs.push(msg.text()));
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('file:///workspace/games/night-3/xcom-classic-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'screenshot-1.png' });

    // Test clicking on a soldier (select)
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Test keyboard input - select soldier 2
    await page.keyboard.press('2');
    await page.waitForTimeout(300);

    // Test movement - click on map
    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();

    // Click to move (center-right area of the map)
    await page.mouse.click(box.x + 350, box.y + 150);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-2.png' });

    // Test kneel
    await page.keyboard.press('k');
    await page.waitForTimeout(300);

    // Test cycling through soldiers
    await page.keyboard.press(' ');
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'screenshot-3.png' });

    // Try snap shot at alien
    await page.keyboard.press('s');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-4.png' });

    // End turn
    await page.keyboard.press('e');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshot-5.png' });

    // Get game state
    const state = await page.evaluate(() => {
        return {
            turn: window.gameState.turn,
            turnNumber: window.gameState.turnNumber,
            state: window.gameState.state,
            soldiers: window.soldiers.filter(s => s.isAlive).length,
            aliens: window.aliens.filter(a => a.isAlive).length
        };
    });

    console.log('Game State:', JSON.stringify(state, null, 2));
    console.log('Errors:', errors);

    await browser.close();
    console.log('Test complete!');
}

testGame();
