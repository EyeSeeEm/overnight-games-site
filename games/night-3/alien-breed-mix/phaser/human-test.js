const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testGame() {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Clear old screenshots
    const oldFiles = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
    oldFiles.forEach(f => fs.unlinkSync(path.join(screenshotsDir, f)));

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

    let frame = 0;

    // Human-like gameplay test
    console.log('Testing movement and combat...');

    for (let i = 0; i < 30; i++) {
        const dir = ['w', 'd', 's', 'a'][i % 4];
        await page.keyboard.down(dir);
        await page.mouse.move(640 + Math.cos(i * 0.3) * 200, 360 + Math.sin(i * 0.3) * 200);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frame++).padStart(3, '0')}.png`) });
        await page.mouse.up();
        await page.keyboard.up(dir);
        await page.waitForTimeout(50);
    }

    // Capture final screenshot
    await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
    console.log(`Captured ${frame} frames + final screenshot`);

    await browser.close();
}

testGame().catch(console.error);
