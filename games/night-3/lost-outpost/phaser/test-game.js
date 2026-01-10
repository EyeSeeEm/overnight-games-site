const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    page.on('pageerror', err => console.error('Page error:', err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('Console error:', msg.text());
    });

    console.log('=== LOST OUTPOST PHASER TEST ===\n');

    await page.goto('file:///workspace/games/night-3/lost-outpost/phaser/index.html');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshot-1.png' });
    console.log('Screenshot 1: Initial state');

    // Click to focus
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Move around with WASD
    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');

    await page.screenshot({ path: 'screenshot-2.png' });
    console.log('Screenshot 2: After moving');

    // Shoot - click at position
    await page.mouse.click(500, 200);
    await page.waitForTimeout(100);
    await page.mouse.click(500, 200);
    await page.waitForTimeout(100);
    await page.mouse.click(500, 200);

    await page.screenshot({ path: 'screenshot-3.png' });
    console.log('Screenshot 3: After shooting');

    // Check game state
    const state = await page.evaluate(() => ({
        playerHP: window.player?.hp,
        playerLives: window.player?.lives,
        playerCredits: window.player?.credits,
        playerRank: window.player?.rank,
        ammo: window.player?.weapon?.ammo,
        clip: window.player?.weapon?.clip,
        enemies: window.enemies?.length,
        items: window.items?.length,
        gameState: window.gameState?.state
    }));

    console.log('\nGame State:', JSON.stringify(state, null, 2));

    await browser.close();
    console.log('\nTest complete!');
}

testGame().catch(console.error);
