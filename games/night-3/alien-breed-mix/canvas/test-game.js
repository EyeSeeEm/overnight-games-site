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

    await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    console.log('Game started');

    // Move and explore while shooting
    for (let i = 0; i < 20; i++) {
        // Move in directions
        const keys = ['w', 'd', 'w', 'd', 's', 'a', 'w', 'd'];
        await page.keyboard.down(keys[i % keys.length]);
        await page.waitForTimeout(100);
        await page.keyboard.up(keys[i % keys.length]);

        // Shoot toward enemies
        await page.mouse.move(640 + Math.random() * 200 - 100, 360 + Math.random() * 200 - 100);
        await page.mouse.down();
        await page.waitForTimeout(50);
        await page.mouse.up();
    }

    // Sprint and shoot combat sequence
    await page.keyboard.down('Shift');
    for (let i = 0; i < 15; i++) {
        await page.keyboard.press('w');
        await page.mouse.click(640 + Math.random() * 300 - 150, 360 + Math.random() * 300 - 150);
        await page.waitForTimeout(80);
    }
    await page.keyboard.up('Shift');

    // Switch weapons and continue fighting
    await page.keyboard.press('q');
    await page.waitForTimeout(200);

    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('d');
        await page.mouse.click(700, 360);
        await page.waitForTimeout(100);
    }

    // Reload
    await page.keyboard.press('r');
    await page.waitForTimeout(500);

    // More combat
    for (let round = 0; round < 5; round++) {
        const dirs = ['w', 'd', 's', 'a'];
        for (let i = 0; i < 4; i++) {
            await page.keyboard.down(dirs[i]);
            await page.mouse.click(640 + Math.cos(i) * 200, 360 + Math.sin(i) * 200);
            await page.waitForTimeout(80);
            await page.keyboard.up(dirs[i]);
        }

        // Switch weapon occasionally
        if (round % 2 === 0) {
            await page.keyboard.press('q');
            await page.waitForTimeout(100);
        }
    }

    // Take the main screenshot for gallery
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    // More gameplay for additional screenshots
    for (let turn = 0; turn < 15; turn++) {
        const dirs = ['w', 'a', 's', 'd'];
        await page.keyboard.down(dirs[turn % 4]);
        await page.mouse.click(500 + Math.random() * 300, 250 + Math.random() * 200);
        await page.waitForTimeout(60);
        await page.keyboard.up(dirs[turn % 4]);

        // Use medkit occasionally (1 key)
        if (turn === 7) {
            await page.keyboard.press('1');
            await page.waitForTimeout(100);
        }
    }

    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Created additional screenshot');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
