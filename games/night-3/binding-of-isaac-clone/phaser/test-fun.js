const { chromium } = require('playwright');

async function test() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/phaser/index.html');
    await page.waitForTimeout(3000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Enable debug
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    // Move and shoot
    for (let i = 0; i < 40; i++) {
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);
        
        const shootKey = ['i', 'k', 'j', 'l'][i % 4];
        await page.keyboard.press(shootKey);
        
        await page.waitForTimeout(80);
        await page.keyboard.up(moveKey);
    }

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Captured screenshot.png');
    await browser.close();
}

test().catch(console.error);
