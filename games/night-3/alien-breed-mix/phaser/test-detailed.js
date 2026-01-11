const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);
    
    // Add detailed state tracker
    await page.evaluate(() => {
        window.getDetailedState = () => {
            const scene = window.game.scene.getScene('GameScene');
            if (!scene || !scene.player) return null;
            return {
                ammo: scene.player.ammo,
                weapon: scene.player.currentWeapon,
                weapons: scene.player.weapons,
                weaponAmmo: scene.player.weaponAmmo,
                reloading: scene.player.reloading,
                x: Math.round(scene.player.x),
                y: Math.round(scene.player.y),
                enemies: scene.enemies ? scene.enemies.countActive() : 0
            };
        };
    });
    
    // Initial state
    let state = await page.evaluate(() => window.getDetailedState());
    console.log('Initial:', JSON.stringify(state, null, 2));
    
    // Start shooting (need to enable shooting)
    await page.click('canvas');
    await page.waitForTimeout(100);
    
    // Hold down mouse to shoot
    console.log('\nShooting...');
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    
    state = await page.evaluate(() => window.getDetailedState());
    console.log('After shooting:', JSON.stringify(state, null, 2));
    
    // Movement test
    console.log('\nMoving player...');
    const pos1 = await page.evaluate(() => window.getDetailedState());
    
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    
    const pos2 = await page.evaluate(() => window.getDetailedState());
    console.log('Position changed:', pos1.x !== pos2.x || pos1.y !== pos2.y, 
                `(${pos1.x},${pos1.y}) -> (${pos2.x},${pos2.y})`);
    
    // Capture screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
