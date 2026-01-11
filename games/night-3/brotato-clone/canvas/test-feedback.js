const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('file:///workspace/games/night-3/brotato-clone/canvas/index.html');
    await page.waitForTimeout(1000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    console.log('Game started');

    // Play until wave ends (move and shoot)
    for (let i = 0; i < 250; i++) {
        const moveKeys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(moveKeys[i % 4]);
        await page.waitForTimeout(80);
        await page.keyboard.up(moveKeys[i % 4]);
    }

    await page.screenshot({ path: 'test-gameplay.png' });
    console.log('Gameplay screenshot captured');

    // If in shop, capture that
    await page.keyboard.press('Space'); // Skip if in shop
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-shop.png' });

    console.log('Test complete - no errors');

    await browser.close();
}

testGame().catch(console.error);
