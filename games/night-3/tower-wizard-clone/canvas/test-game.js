const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1024, height: 768 });

    page.on('pageerror', err => console.error('Page error:', err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('Console error:', msg.text());
    });

    console.log('=== TOWER WIZARD CLONE TEST ===\n');

    await page.goto('file:///workspace/games/night-3/tower-wizard-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshot-1.png' });
    console.log('Screenshot 1: Initial state');

    // Click orb multiple times
    for (let i = 0; i < 20; i++) {
        await page.mouse.click(200, 120);
        await page.waitForTimeout(50);
    }

    await page.screenshot({ path: 'screenshot-2.png' });
    console.log('Screenshot 2: After clicking orb');

    // Check game state
    let state = await page.evaluate(() => ({
        magic: window.game.magic,
        spirits: window.game.spirits,
        towerLevel: window.game.towerLevel,
        cloudlings: window.game.cloudlings
    }));
    console.log('\nGame State after clicks:', JSON.stringify(state, null, 2));

    // Click summon spirit button (right panel)
    const summonX = 1024 - 320 + 150;
    const summonY = 200 + 77;

    for (let i = 0; i < 5; i++) {
        await page.mouse.click(summonX, summonY);
        await page.waitForTimeout(100);
    }

    await page.screenshot({ path: 'screenshot-3.png' });
    console.log('Screenshot 3: After summoning spirits');

    state = await page.evaluate(() => ({
        magic: window.game.magic,
        spirits: window.game.spirits,
        towerLevel: window.game.towerLevel,
        cloudlings: window.game.cloudlings,
        lifetimeMagic: window.game.lifetimeMagic
    }));
    console.log('\nFinal Game State:', JSON.stringify(state, null, 2));

    await browser.close();
    console.log('\nTest complete!');
}

testGame().catch(console.error);
