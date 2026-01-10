const { chromium } = require('playwright');

async function captureGameplay() {
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
    await page.waitForTimeout(500);

    // Play aggressively for 5 seconds to create action
    console.log('Creating action scene...');

    // Move into the map and engage enemies
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');

    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');

    // Shoot while moving for dynamic screenshot
    await page.mouse.move(640, 360);
    await page.mouse.down();

    for (let i = 0; i < 30; i++) {
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);

        // Sweep aim
        const angle = (i / 5) * Math.PI * 2;
        await page.mouse.move(640 + Math.cos(angle) * 200, 360 + Math.sin(angle) * 200);

        await page.waitForTimeout(100);
        await page.keyboard.up(moveKey);
    }

    await page.mouse.up();

    // Continue playing briefly
    await page.keyboard.down('w');
    await page.mouse.down();
    await page.mouse.move(700, 300);
    await page.waitForTimeout(300);

    // Capture the screenshot during action
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot captured: screenshot.png');

    await page.mouse.up();
    await page.keyboard.up('w');

    await browser.close();
}

captureGameplay().catch(console.error);
