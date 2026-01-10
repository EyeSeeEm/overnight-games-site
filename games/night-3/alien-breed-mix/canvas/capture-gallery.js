const { chromium } = require('playwright');

async function capture() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Move around and shoot to get action
    for (let i = 0; i < 50; i++) {
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);
        
        // Sweep aim
        const angle = (i / 10) * Math.PI * 2;
        await page.mouse.move(640 + Math.cos(angle) * 200, 360 + Math.sin(angle) * 200);
        await page.mouse.down();
        await page.waitForTimeout(80);
        await page.mouse.up();
        
        await page.keyboard.up(moveKey);
    }

    // Get to an interesting spot
    await page.keyboard.down('d');
    await page.waitForTimeout(800);
    await page.keyboard.up('d');

    // Shoot for action
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
        await page.mouse.move(640 + Math.cos(i * 0.6) * 200, 360 + Math.sin(i * 0.6) * 200);
        await page.waitForTimeout(50);
    }
    await page.mouse.up();

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Captured screenshot.png');
    await browser.close();
}

capture().catch(console.error);
