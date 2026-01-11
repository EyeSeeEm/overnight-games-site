const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(4000);
    
    // Use the existing gameState API which is already defined in the code
    let state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('Initial state:', JSON.stringify(state, null, 2));
    
    if (!state) {
        console.log('ERROR: Game did not load');
        await browser.close();
        return;
    }
    
    // Focus the game
    await page.click('canvas');
    await page.waitForTimeout(200);
    
    // Movement test - press keys and capture movement
    console.log('\nTesting movement (WASD)...');
    
    // Try moving right
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    
    // Try moving down  
    await page.keyboard.down('s');
    await page.waitForTimeout(500);
    await page.keyboard.up('s');
    
    // Check if any state changed (enemies might have been killed if close)
    state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('After movement:', JSON.stringify(state, null, 2));
    
    // Try to shoot by holding mouse button
    console.log('\nTesting shooting...');
    const ammoStart = state.playerAmmo;
    
    await page.mouse.move(500, 400);
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    
    state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('After shooting:', JSON.stringify(state, null, 2));
    console.log('Ammo changed:', ammoStart !== state.playerAmmo, `(${ammoStart} -> ${state.playerAmmo})`);
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('\nScreenshot saved to screenshot.png');
    
    // Play for a bit more
    console.log('\nPlaying for 10 seconds...');
    for (let i = 0; i < 100; i++) {
        const keys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(keys[i % 4]);
        await page.mouse.move(300 + Math.random() * 200, 200 + Math.random() * 200);
        await page.mouse.down();
        await page.waitForTimeout(50);
        await page.mouse.up();
        await page.keyboard.up(keys[i % 4]);
        await page.waitForTimeout(50);
    }
    
    state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('\nFinal state:', JSON.stringify(state, null, 2));
    
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Final screenshot saved');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
