const { chromium } = require('playwright');
const path = require('path');

async function captureGameplay() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    // Move into action and shoot - create exciting scene
    for (let i = 0; i < 15; i++) {
        // Move toward enemies
        await page.keyboard.down('d');
        await page.mouse.move(800, 400);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.keyboard.up('d');
    }

    // Add some movement for variety
    await page.keyboard.down('w');
    await page.keyboard.down('d');
    await page.mouse.move(900, 300);
    await page.mouse.down();
    await page.waitForTimeout(500);

    // Capture with action
    await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
    console.log('Screenshot captured!');

    await page.mouse.up();
    await page.keyboard.up('w');
    await page.keyboard.up('d');

    await browser.close();
}

captureGameplay().catch(console.error);
