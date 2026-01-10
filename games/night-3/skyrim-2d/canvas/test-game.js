const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 700, height: 550 });

    page.on('pageerror', err => console.error('Page error:', err.message));
    page.on('console', msg => console.log('Console:', msg.text()));

    await page.goto('file:///workspace/games/night-3/skyrim-2d/canvas/index.html');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'screenshot-1.png' });
    console.log('Screenshot 1: Initial game state');

    // Click to focus and start moving
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Move around with WASD
    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');
    await page.screenshot({ path: 'screenshot-2.png' });
    console.log('Screenshot 2: After moving up');

    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');

    await page.keyboard.down('s');
    await page.waitForTimeout(500);
    await page.keyboard.up('s');
    await page.screenshot({ path: 'screenshot-3.png' });
    console.log('Screenshot 3: After moving down');

    // Try attacking
    await page.mouse.click(400, 300);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshot-4.png' });
    console.log('Screenshot 4: After attack');

    // Check game state
    const state = await page.evaluate(() => {
        if (window.player) {
            return {
                playerHP: window.player.hp,
                playerMaxHP: window.player.maxHp,
                playerX: window.player.x,
                playerY: window.player.y,
                playerLevel: window.player.level,
                playerGold: window.player.gold,
                gameRunning: window.gameState ? true : false,
                enemyCount: window.enemies ? window.enemies.length : 0,
                npcCount: window.npcs ? window.npcs.length : 0
            };
        }
        return { error: 'Game state not found' };
    });

    console.log('Game State:', JSON.stringify(state, null, 2));

    await browser.close();
    console.log('Test complete!');
}

testGame().catch(console.error);
