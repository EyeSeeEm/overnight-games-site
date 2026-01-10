const { chromium } = require('playwright');

async function test() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/quasimorph-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Enable debug
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Starting game...');

    // Move around
    for (let i = 0; i < 20; i++) {
        const keys = ['w', 'a', 's', 'd'];
        await page.keyboard.press(keys[i % 4]);
        await page.waitForTimeout(150);
    }

    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Gameplay screenshot captured');

    await browser.close();
}

test().catch(console.error);
