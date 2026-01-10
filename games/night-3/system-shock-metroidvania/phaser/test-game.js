const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('Loading game...');
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });

    await page.goto('file:///workspace/games/night-3/system-shock-metroidvania/phaser/index.html');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshot-01-title.png' });
    console.log('Screenshot 1: Title screen');

    // Start game using exposed function
    await page.click('canvas');
    await page.waitForTimeout(300);
    await page.evaluate(() => window.startGame());
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshot-02-start.png' });
    console.log('Screenshot 2: Game started');

    // Move around
    for (let i = 0; i < 20; i++) {
        await page.keyboard.down('d');
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('d');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-03-movement.png' });
    console.log('Screenshot 3: Movement');

    // Attack
    for (let i = 0; i < 30; i++) {
        await page.keyboard.press('j');
        await page.keyboard.down('d');
        await page.waitForTimeout(100);
        await page.keyboard.up('d');
    }
    await page.screenshot({ path: 'screenshot-04-combat.png' });
    console.log('Screenshot 4: Combat');

    // Check game state
    let state = await page.evaluate(() => window.gameState);
    console.log('Game state:', state);

    // Copy final screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
