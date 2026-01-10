const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 700, height: 550 });

    page.on('pageerror', err => console.error('Page error:', err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('Console error:', msg.text());
    });

    console.log('=== SKYRIM 2D PHASER TEST ===\n');

    await page.goto('file:///workspace/games/night-3/skyrim-2d/phaser/index.html');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshot-1.png' });
    console.log('Screenshot 1: Initial state');

    // Click to focus
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Test movement
    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');
    await page.screenshot({ path: 'screenshot-2.png' });
    console.log('Screenshot 2: After moving up');

    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');

    // Test attack
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshot-3.png' });
    console.log('Screenshot 3: After attack');

    // Check state
    const state = await page.evaluate(() => {
        if (window.player && window.gameState) {
            return {
                playerHP: window.player.hp,
                playerGold: window.player.gold,
                playerLevel: window.player.level,
                gameState: window.gameState.state,
                enemies: window.enemies ? window.enemies.length : 0,
                quests: window.gameState.quests ? window.gameState.quests.length : 0
            };
        }
        return { error: 'Game not loaded' };
    });

    console.log('\nGame State:', JSON.stringify(state, null, 2));

    await browser.close();
    console.log('\nTest complete!');
}

testGame().catch(console.error);
