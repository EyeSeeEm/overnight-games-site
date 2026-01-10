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

    await page.goto('file:///workspace/games/night-3/zero-sievert-clone/phaser/index.html');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshot-01-menu.png' });
    console.log('Screenshot 1: Menu');

    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-02-game.png' });
    console.log('Screenshot 2: Game started');

    // Movement test
    for (let i = 0; i < 20; i++) {
        await page.keyboard.down('w');
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('w');
    await page.screenshot({ path: 'screenshot-03-moved.png' });
    console.log('Screenshot 3: Moved');

    // Shoot test
    await page.mouse.move(800, 400);
    await page.mouse.click(800, 400);
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'screenshot-04-shoot.png' });
    console.log('Screenshot 4: Shot');

    // Gameplay
    for (let i = 0; i < 30; i++) {
        const keys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(keys[i % 4]);
        await page.mouse.click(600 + Math.random() * 200, 300 + Math.random() * 200);
        await page.waitForTimeout(50);
        await page.keyboard.up(keys[i % 4]);
    }
    await page.screenshot({ path: 'screenshot-05-gameplay.png' });
    console.log('Screenshot 5: Gameplay');

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
