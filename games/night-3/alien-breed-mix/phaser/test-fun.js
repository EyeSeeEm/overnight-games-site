const { chromium } = require('playwright');

async function test() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Enable debug
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    // Move and shoot
    for (let i = 0; i < 80; i++) {
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);
        
        // Aim sweep
        const angle = (i / 10) * Math.PI * 2;
        await page.mouse.move(640 + Math.cos(angle) * 200, 360 + Math.sin(angle) * 200);
        await page.mouse.down();
        await page.waitForTimeout(60);
        await page.mouse.up();
        
        await page.keyboard.up(moveKey);
    }

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Captured screenshot.png');
    await browser.close();
}

test().catch(console.error);
