const { chromium } = require('playwright');
const path = require('path');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await page.waitForTimeout(3000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Move and shoot
    for (let i = 0; i < 20; i++) {
        const dir = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(dir);
        const shoot = ['i', 'j', 'k', 'l'][i % 4];
        await page.keyboard.press(shoot);
        await page.waitForTimeout(150);
        await page.keyboard.up(dir);
    }

    // Capture screenshot
    await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
    console.log('Screenshot captured!');

    await browser.close();
}

testGame().catch(console.error);
