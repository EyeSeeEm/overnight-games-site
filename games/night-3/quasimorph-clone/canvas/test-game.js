const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('Loading game...');
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });

    await page.goto('file:///workspace/games/night-3/quasimorph-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    console.log('Game started');

    // Explore and find enemies
    for (let i = 0; i < 15; i++) {
        const keys = ['w', 'd', 'w', 'd', 'w', 'w', 'd', 'd', 'w', 'd', 'w', 's', 'd', 'w', 'd'];
        await page.keyboard.press(keys[i]);
        await page.waitForTimeout(80);
    }

    // End turn to reset AP
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    // More exploration
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(80);
    }
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    for (let i = 0; i < 8; i++) {
        await page.keyboard.press('w');
        await page.waitForTimeout(80);
    }
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);

    // Continue exploring
    for (let round = 0; round < 5; round++) {
        const dirs = ['w', 'd', 'd', 'w', 's', 'd', 'w', 'w'];
        for (let i = 0; i < 8; i++) {
            await page.keyboard.press(dirs[(round + i) % dirs.length]);
            await page.waitForTimeout(50);
        }
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);

        // Try shooting at screen center area (might hit enemy)
        await page.mouse.click(640, 360);
        await page.waitForTimeout(100);
    }

    // Take the main screenshot for gallery
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    // More gameplay for additional screenshots
    for (let turn = 0; turn < 10; turn++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);

        const dirs = ['w', 'a', 's', 'd'];
        for (let m = 0; m < 2; m++) {
            await page.keyboard.press(dirs[Math.floor(Math.random() * 4)]);
            await page.waitForTimeout(50);
        }

        if (Math.random() < 0.4) {
            await page.mouse.click(500 + Math.random() * 300, 250 + Math.random() * 200);
            await page.waitForTimeout(100);
        }
    }
    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Created additional screenshot');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
