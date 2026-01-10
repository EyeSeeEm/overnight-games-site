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
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    let frame = 0;

    // Human-like gameplay - explore rooms and shoot
    console.log('Testing movement and shooting...');

    // Explore starting room
    for (let i = 0; i < 10; i++) {
        const dir = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(dir);
        // Shoot in a direction
        const shoot = ['i', 'j', 'k', 'l'][i % 4];
        await page.keyboard.press(shoot);
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frame++).padStart(3, '0')}.png`) });
        await page.keyboard.up(dir);
        await page.waitForTimeout(50);
    }

    // Try to go through a door (move up to enter next room)
    console.log('Moving to next room...');
    for (let i = 0; i < 15; i++) {
        await page.keyboard.down('w');
        await page.keyboard.press('i'); // shoot up
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frame++).padStart(3, '0')}.png`) });
        await page.keyboard.up('w');
        await page.waitForTimeout(50);
    }

    // Explore and combat
    console.log('Combat testing...');
    for (let i = 0; i < 15; i++) {
        const dir = ['w', 'd', 's', 'a'][i % 4];
        await page.keyboard.down(dir);
        // Rapid fire shooting
        for (let j = 0; j < 3; j++) {
            await page.keyboard.press(['i', 'j', 'k', 'l'][j % 4]);
            await page.waitForTimeout(50);
        }
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frame++).padStart(3, '0')}.png`) });
        await page.keyboard.up(dir);
        await page.waitForTimeout(50);
    }

    // Capture final screenshot
    await page.screenshot({ path: path.join(__dirname, 'screenshot.png') });
    console.log(`Captured ${frame} frames + final screenshot`);

    await browser.close();
}

testGame().catch(console.error);
