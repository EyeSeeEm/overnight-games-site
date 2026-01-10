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

    await page.goto('file:///workspace/games/night-3/brotato-clone/phaser/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    console.log('Game started');

    // Move around and play
    for (let i = 0; i < 20; i++) {
        const moves = ['w', 'd', 's', 'a'];
        await page.keyboard.down(moves[i % 4]);
        await page.waitForTimeout(150);
        await page.keyboard.up(moves[i % 4]);
    }

    // Take screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png');

    // More gameplay
    for (let i = 0; i < 15; i++) {
        await page.keyboard.down('w');
        await page.keyboard.down('d');
        await page.waitForTimeout(100);
        await page.keyboard.up('d');
        await page.keyboard.up('w');
    }

    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
