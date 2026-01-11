const { chromium } = require('playwright');

async function testFixes() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);
    
    // Get initial state
    const state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('Initial state:', state);
    
    // Test player can move
    console.log('Testing player movement...');
    await page.click('canvas');
    
    const pos1 = await page.evaluate(() => ({
        x: window.game.scene.scenes[1].player.x,
        y: window.game.scene.scenes[1].player.y
    }));
    console.log('Position before:', pos1);
    
    // Move in all directions
    for (let dir of ['w', 'a', 's', 'd']) {
        await page.keyboard.down(dir);
        await page.waitForTimeout(200);
        await page.keyboard.up(dir);
    }
    
    const pos2 = await page.evaluate(() => ({
        x: window.game.scene.scenes[1].player.x,
        y: window.game.scene.scenes[1].player.y
    }));
    console.log('Position after:', pos2);
    
    // Check if player moved
    const moved = pos1.x !== pos2.x || pos1.y !== pos2.y;
    console.log('Player moved:', moved);
    
    // Test weapon switch doesn't auto-reload
    console.log('Testing weapon switch...');
    await page.click('canvas');
    
    // Shoot some bullets to reduce ammo
    for (let i = 0; i < 5; i++) {
        await page.mouse.click(400, 300);
        await page.waitForTimeout(100);
    }
    
    const ammo1 = await page.evaluate(() => window.game.scene.scenes[1].player.ammo);
    console.log('Ammo after shooting:', ammo1);
    
    // Switch weapon and back
    await page.keyboard.press('q');
    await page.waitForTimeout(100);
    
    const weapon1 = await page.evaluate(() => window.game.scene.scenes[1].player.currentWeapon);
    console.log('Weapon after Q:', weapon1);
    
    // Switch back
    await page.keyboard.press('q');
    await page.waitForTimeout(100);
    
    const ammo2 = await page.evaluate(() => window.game.scene.scenes[1].player.ammo);
    const weapon2 = await page.evaluate(() => window.game.scene.scenes[1].player.currentWeapon);
    console.log('Weapon after second Q:', weapon2);
    console.log('Ammo after switching back:', ammo2);
    
    // Check if ammo was preserved (not auto-reloaded)
    const ammoPreserved = ammo2 === ammo1 || ammo2 < 12; // Shouldn't be full 12
    console.log('Ammo preserved (no auto-reload):', ammoPreserved);
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved');
    
    // Test reload animation visibility
    console.log('Testing reload animation...');
    
    // Empty the mag
    for (let i = 0; i < 15; i++) {
        await page.mouse.click(400, 300);
        await page.waitForTimeout(100);
    }
    
    // Check if reload bar is visible
    const reloadVisible = await page.evaluate(() => {
        const scene = window.game.scene.scenes[1];
        return scene.reloadBarBg && scene.reloadBarBg.visible;
    });
    console.log('Reload bar visible during reload:', reloadVisible);
    
    // Wait for reload to complete
    await page.waitForTimeout(2000);
    
    const reloadHidden = await page.evaluate(() => {
        const scene = window.game.scene.scenes[1];
        return !scene.reloadBarBg.visible;
    });
    console.log('Reload bar hidden after reload:', reloadHidden);
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
    console.log('Summary:');
    console.log('- Player can move:', moved);
    console.log('- Weapon switch preserves ammo:', ammoPreserved);
    console.log('- Reload bar shows during reload:', reloadVisible);
    console.log('- Reload bar hides after reload:', reloadHidden);
}

testFixes().catch(console.error);
