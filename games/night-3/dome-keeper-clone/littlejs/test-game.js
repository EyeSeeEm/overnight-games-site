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

    await page.goto('file:///workspace/games/night-3/dome-keeper-clone/littlejs/index.html');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshot-01-title.png' });
    console.log('Screenshot 1: Title screen');

    // Click canvas to focus, then start game
    await page.click('canvas');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot-02-mining.png' });
    console.log('Screenshot 2: Mining phase started');

    // Move down deeper and mine - lots of drilling
    for (let i = 0; i < 100; i++) {
        await page.keyboard.down('s');
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('s');
    await page.screenshot({ path: 'screenshot-03-drilling.png' });
    console.log('Screenshot 3: Deep drilling');

    // Move side to side to find resources
    for (let i = 0; i < 80; i++) {
        const key = i % 2 === 0 ? 'a' : 'd';
        await page.keyboard.down(key);
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('a');
    await page.keyboard.up('d');

    // Check game state
    let state = await page.evaluate(() => window.gameState);
    console.log('Game state after drilling:', state);

    await page.screenshot({ path: 'screenshot-04-resources.png' });
    console.log('Screenshot 4: Looking for resources');

    // Return to dome
    for (let i = 0; i < 100; i++) {
        await page.keyboard.down('w');
        await page.waitForTimeout(50);
    }
    await page.keyboard.up('w');

    state = await page.evaluate(() => window.gameState);
    console.log('Game state after return:', state);
    await page.screenshot({ path: 'screenshot-05-return.png' });
    console.log('Screenshot 5: Returned to dome area');

    // Wait for defense phase (set timer to be very short manually)
    await page.evaluate(() => {
        phaseTimer = 1;
    });
    await page.waitForTimeout(2000);

    state = await page.evaluate(() => window.gameState);
    console.log('Game state after timer:', state);
    await page.screenshot({ path: 'screenshot-06-defense.png' });
    console.log('Screenshot 6: Defense phase');

    // Fire laser at enemies
    if (state.state === 'defense') {
        await page.mouse.move(800, 300);
        await page.mouse.down();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshot-07-laser.png' });
        console.log('Screenshot 7: Firing laser');

        // Sweep laser
        for (let i = 0; i < 30; i++) {
            await page.mouse.move(400 + i * 20, 300);
            await page.waitForTimeout(100);
        }
        await page.mouse.up();

        state = await page.evaluate(() => window.gameState);
        console.log('Game state after combat:', state);
        await page.screenshot({ path: 'screenshot-08-combat.png' });
        console.log('Screenshot 8: After combat');
    }

    // Copy final screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Created screenshot.png for gallery');

    console.log('Test complete!');
    await browser.close();
}

testGame().catch(console.error);
