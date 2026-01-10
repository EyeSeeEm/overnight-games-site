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

    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/phaser/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    console.log('Game started');

    // Move and shoot
    for (let i = 0; i < 15; i++) {
        // Move
        const moves = ['w', 'd', 's', 'a'];
        await page.keyboard.down(moves[i % 4]);
        await page.waitForTimeout(100);

        // Shoot
        const shots = ['i', 'l', 'k', 'j'];
        await page.keyboard.down(shots[i % 4]);
        await page.waitForTimeout(100);
        await page.keyboard.up(shots[i % 4]);

        await page.keyboard.up(moves[i % 4]);
        await page.waitForTimeout(50);
    }

    // Combat sequence - shoot while moving
    for (let round = 0; round < 10; round++) {
        // Move toward room edge to find door
        await page.keyboard.down('d');
        await page.keyboard.down('l');
        await page.waitForTimeout(200);
        await page.keyboard.up('l');
        await page.keyboard.up('d');

        await page.keyboard.down('w');
        await page.keyboard.down('i');
        await page.waitForTimeout(200);
        await page.keyboard.up('i');
        await page.keyboard.up('w');
    }

    // Try transitioning through doors
    for (let i = 0; i < 5; i++) {
        await page.keyboard.down('d');
        await page.waitForTimeout(300);
        await page.keyboard.up('d');

        await page.keyboard.down('l');
        await page.waitForTimeout(100);
        await page.keyboard.up('l');
    }

    // More shooting
    for (let i = 0; i < 20; i++) {
        const dirs = ['i', 'k', 'j', 'l'];
        await page.keyboard.down(dirs[i % 4]);
        await page.waitForTimeout(80);
        await page.keyboard.up(dirs[i % 4]);
    }

    // Try placing a bomb
    await page.keyboard.press('e');
    await page.waitForTimeout(500);

    // Move away from bomb
    await page.keyboard.down('s');
    await page.waitForTimeout(300);
    await page.keyboard.up('s');

    // Wait for bomb to explode
    await page.waitForTimeout(1500);

    // Take screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    // Continue gameplay
    for (let turn = 0; turn < 10; turn++) {
        const moves = ['w', 'a', 's', 'd'];
        await page.keyboard.down(moves[turn % 4]);
        await page.keyboard.down(['i', 'l', 'k', 'j'][turn % 4]);
        await page.waitForTimeout(150);
        await page.keyboard.up(['i', 'l', 'k', 'j'][turn % 4]);
        await page.keyboard.up(moves[turn % 4]);
    }

    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Created additional screenshot');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
