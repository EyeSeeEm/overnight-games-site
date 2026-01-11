const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/enter-the-gungeon-clone/phaser/index.html');
    await page.waitForTimeout(2000);
    
    // Start game
    console.log('Starting game...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    
    // Check there are enemies
    const enemies = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene ? scene.enemies.getLength() : -1;
    });
    console.log('Initial enemies:', enemies);
    
    // Shoot at enemies
    console.log('Fighting enemies...');
    await page.mouse.move(400, 300);
    for (let i = 0; i < 100; i++) {
        await page.mouse.down();
        await page.keyboard.down(['w', 'a', 's', 'd'][i % 4]);
        await page.waitForTimeout(50);
        await page.mouse.up();
        await page.keyboard.up(['w', 'a', 's', 'd'][i % 4]);
    }
    
    // Check enemies after fighting
    const enemiesLeft = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return {
            enemies: scene ? scene.enemies.getLength() : -1,
            roomCleared: scene ? scene.roomCleared : null,
            doorsOpen: scene ? scene.doorsOpen : null
        };
    });
    console.log('After fighting:', JSON.stringify(enemiesLeft, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
