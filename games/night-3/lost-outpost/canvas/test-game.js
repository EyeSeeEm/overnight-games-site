const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    page.on('pageerror', err => console.error('Page error:', err.message));

    console.log('=== LOST OUTPOST EXPANDED TEST ===\n');

    await page.goto('file:///workspace/games/night-3/lost-outpost/canvas/index.html');
    await page.waitForTimeout(2000);

    // Click to focus
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Move around and explore
    console.log('Testing movement...');
    await page.keyboard.down('w');
    await page.waitForTimeout(300);
    await page.keyboard.up('w');
    await page.keyboard.down('d');
    await page.waitForTimeout(300);
    await page.keyboard.up('d');

    // Shoot towards enemies
    console.log('Testing shooting...');
    await page.mouse.move(600, 300);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();

    // Move more to find enemies
    for (let i = 0; i < 10; i++) {
        const key = ['w','a','s','d'][i % 4];
        await page.keyboard.down(key);
        await page.mouse.move(500 + Math.random() * 300, 300 + Math.random() * 200);
        await page.mouse.down();
        await page.waitForTimeout(150);
        await page.mouse.up();
        await page.keyboard.up(key);
    }

    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: '/workspace/games/night-3/lost-outpost/canvas/screenshot.png' });
    console.log('Screenshot saved to screenshot.png');

    // Check game state
    const state = await page.evaluate(() => ({
        playerHP: window.player?.hp,
        playerLives: window.player?.lives,
        playerCredits: window.player?.credits,
        playerRank: window.player?.rank,
        currentWeapon: window.player?.currentWeapon,
        weapons: window.player?.weapons ? Object.keys(window.player.weapons) : [],
        wave: window.gameState?.wave,
        enemies: window.enemies?.length,
        items: window.items?.length,
        gameState: window.gameState?.state,
        killCount: window.gameState?.killCount
    }));

    console.log('\nGame State:', JSON.stringify(state, null, 2));

    await browser.close();
    console.log('\nTest complete!');
}

testGame().catch(console.error);
