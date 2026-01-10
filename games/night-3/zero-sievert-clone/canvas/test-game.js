const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1024, height: 768 });

    console.log('Loading game...');
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });

    await page.goto('file:///workspace/games/night-3/zero-sievert-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshot-01-title.png' });
    console.log('Screenshot 1: Title screen');

    // Press SPACE to start
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot-02-game.png' });
    console.log('Screenshot 2: After SPACE');

    // Move around
    for (let i = 0; i < 15; i++) {
        await page.keyboard.down('w');
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('w');
    await page.screenshot({ path: 'screenshot-03-moved.png' });
    console.log('Screenshot 3: After moving');

    // Shoot
    await page.mouse.move(700, 400);
    await page.mouse.click(700, 400);
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'screenshot-04-shooting.png' });
    console.log('Screenshot 4: After shooting');

    // Sprint with shift
    await page.keyboard.down('Shift');
    for (let i = 0; i < 30; i++) {
        await page.keyboard.down('d');
        await page.waitForTimeout(30);
    }
    await page.keyboard.up('d');
    await page.keyboard.up('Shift');
    await page.screenshot({ path: 'screenshot-05-sprint.png' });
    console.log('Screenshot 5: After sprint');

    // Gameplay loop
    for (let i = 0; i < 30; i++) {
        const keys = ['w', 'a', 's', 'd'];
        const key = keys[i % 4];
        await page.keyboard.down(key);
        await page.mouse.click(500 + Math.random() * 300, 300 + Math.random() * 200);
        await page.waitForTimeout(50);
        await page.keyboard.up(key);
    }
    await page.screenshot({ path: 'screenshot-06-gameplay.png' });
    console.log('Screenshot 6: Gameplay');

    // Try loot
    await page.keyboard.press('e');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshot-07-loot.png' });
    console.log('Screenshot 7: Loot');

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot-08-final.png' });
    console.log('Screenshot 8: Final');

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
