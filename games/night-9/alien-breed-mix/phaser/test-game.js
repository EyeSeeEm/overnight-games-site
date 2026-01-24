const { chromium } = require('playwright');

async function testGame() {
    console.log('Launching browser...');
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-9/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);

    // Take menu screenshot
    await page.screenshot({ path: 'screenshot-menu.png' });
    console.log('Menu screenshot saved');

    // Click to start
    await page.click('canvas');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Take gameplay screenshot
    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Gameplay screenshot saved');

    // Test movement and shooting
    for (let i = 0; i < 20; i++) {
        const key = ['w', 'a', 's', 'd', ' '][i % 5];
        await page.keyboard.down(key);
        await page.mouse.move(640 + Math.random() * 200, 360 + Math.random() * 200);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.keyboard.up(key);
    }

    await page.screenshot({ path: 'screenshot-action.png' });
    console.log('Action screenshot saved');

    // Test Q key debug overlay
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-debug.png' });
    console.log('Debug screenshot saved');

    await browser.close();
    console.log('Test complete!');
}

testGame().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
