const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function humanPlayTest() {
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

    let frameNum = 0;

    // Human-like play: deliberate movement toward objectives
    // Phase 1: Initial exploration - move right and down to find enemies
    console.log('Phase 1: Exploring right...');
    for (let i = 0; i < 10; i++) {
        await page.keyboard.down('d'); // Move right deliberately
        await page.mouse.move(800 + i * 10, 400); // Aim ahead
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });
        await page.mouse.up();
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('d');

    // Phase 2: Move down into rooms, shooting
    console.log('Phase 2: Moving down into rooms...');
    for (let i = 0; i < 10; i++) {
        await page.keyboard.down('s');
        await page.mouse.move(640, 500 + i * 5);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });
        await page.mouse.up();
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('s');

    // Phase 3: Combat engagement - strafe and shoot
    console.log('Phase 3: Combat - strafing...');
    for (let i = 0; i < 15; i++) {
        const strafe = i % 2 === 0 ? 'a' : 'd';
        await page.keyboard.down(strafe);
        await page.mouse.move(640 + Math.sin(i) * 100, 360);
        await page.mouse.down();
        await page.waitForTimeout(80);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });
        await page.mouse.up();
        await page.keyboard.up(strafe);
        await page.waitForTimeout(30);
    }

    // Phase 4: Sprint to explore more area
    console.log('Phase 4: Sprint exploration...');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 10; i++) {
        const dir = ['w', 'd', 's', 'a'][i % 4];
        await page.keyboard.down(dir);
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });
        await page.keyboard.up(dir);
    }
    await page.keyboard.up('Shift');

    // Phase 5: Weapon switch and continued combat
    console.log('Phase 5: Weapon switching...');
    await page.keyboard.press('q'); // Switch weapon
    await page.waitForTimeout(200);
    for (let i = 0; i < 10; i++) {
        await page.keyboard.down('w');
        await page.mouse.move(640, 300);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });
        await page.mouse.up();
        await page.keyboard.up('w');
        await page.waitForTimeout(50);
    }

    // Phase 6: Reload and continue
    console.log('Phase 6: Reload mechanic...');
    await page.keyboard.press('r');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });

    // Final phase: More exploration
    console.log('Phase 7: Final exploration...');
    for (let i = 0; i < 14; i++) {
        const dirs = [['w', 'd'], ['s', 'd'], ['s', 'a'], ['w', 'a']];
        const [d1, d2] = dirs[i % 4];
        await page.keyboard.down(d1);
        await page.keyboard.down(d2);
        await page.mouse.move(640 + Math.cos(i * 0.5) * 200, 360 + Math.sin(i * 0.5) * 200);
        await page.mouse.down();
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(screenshotsDir, `frame-${String(frameNum++).padStart(3, '0')}.png`) });
        await page.mouse.up();
        await page.keyboard.up(d1);
        await page.keyboard.up(d2);
        await page.waitForTimeout(30);
    }

    console.log(`Captured ${frameNum} frames`);
    await browser.close();

    console.log('\nTest complete! Review screenshots in:', screenshotsDir);
}

humanPlayTest().catch(console.error);
