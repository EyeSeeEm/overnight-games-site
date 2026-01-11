const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);
    
    // Check initial state
    const state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('Initial state:', JSON.stringify(state, null, 2));
    
    if (!state) {
        console.log('ERROR: Game did not load properly');
        await browser.close();
        return;
    }
    
    // Play the game
    console.log('\nPlaying game...');
    await page.click('canvas');
    
    // Movement test
    for (let i = 0; i < 20; i++) {
        const keys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(keys[i % 4]);
        await page.mouse.click(400 + Math.random() * 200 - 100, 300 + Math.random() * 200 - 100);
        await page.waitForTimeout(100);
        await page.keyboard.up(keys[i % 4]);
    }
    
    // Take screenshot during gameplay
    await page.screenshot({ path: 'screenshot-gameplay-test.png' });
    console.log('Gameplay screenshot saved');
    
    // Check state after gameplay
    const state2 = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('\nState after gameplay:', JSON.stringify(state2, null, 2));
    
    // Switch weapon with Q
    console.log('\nTesting weapon switch...');
    await page.keyboard.press('q');
    await page.waitForTimeout(200);
    
    const state3 = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('After weapon switch:', JSON.stringify(state3, null, 2));
    
    // Manual reload
    console.log('\nTesting reload...');
    await page.keyboard.press('r');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-reloading.png' });
    console.log('Reload screenshot saved');
    
    await page.waitForTimeout(2000);
    const state4 = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('After reload:', JSON.stringify(state4, null, 2));
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
