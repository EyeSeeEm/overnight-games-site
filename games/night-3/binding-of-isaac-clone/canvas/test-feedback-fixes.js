const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
    await page.waitForTimeout(1000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    console.log('Game started');

    // Move around and shoot
    for (let i = 0; i < 50; i++) {
        const moveKeys = ['w', 'a', 's', 'd'];
        const shootKeys = ['i', 'j', 'k', 'l'];
        await page.keyboard.down(moveKeys[i % 4]);
        await page.keyboard.down(shootKeys[i % 4]);
        await page.waitForTimeout(80);
        await page.keyboard.up(moveKeys[i % 4]);
        await page.keyboard.up(shootKeys[i % 4]);
    }

    await page.screenshot({ path: 'test-fixes.png' });
    console.log('Test complete - no errors');

    await browser.close();
}

testGame().catch(console.error);
