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

    await page.goto('file:///workspace/games/night-3/enter-the-gungeon-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    console.log('Game started');

    // Move and shoot
    for (let i = 0; i < 15; i++) {
        const moves = ['w', 'd', 's', 'a'];
        await page.keyboard.down(moves[i % 4]);
        await page.waitForTimeout(100);

        // Shoot
        await page.mouse.move(640 + Math.random() * 200 - 100, 360 + Math.random() * 200 - 100);
        await page.mouse.down();
        await page.waitForTimeout(50);
        await page.mouse.up();

        await page.keyboard.up(moves[i % 4]);
        await page.waitForTimeout(50);
    }

    // Dodge roll
    await page.keyboard.press('Shift');
    await page.waitForTimeout(300);

    // Take screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png');

    // More gameplay
    for (let i = 0; i < 15; i++) {
        await page.keyboard.down('w');
        await page.mouse.click(640, 300);
        await page.waitForTimeout(80);
        await page.keyboard.up('w');
    }

    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
