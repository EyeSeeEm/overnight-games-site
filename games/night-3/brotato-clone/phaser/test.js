const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/brotato-clone/phaser/index.html');
    await page.waitForTimeout(2000);
    
    // Start game
    console.log('Starting game...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    
    // Check state
    let state = await page.evaluate(() => window.gameState());
    console.log('Game state:', JSON.stringify(state, null, 2));
    
    // Play for 10 seconds - move and let auto-fire work
    console.log('Playing...');
    for (let i = 0; i < 50; i++) {
        const keys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(keys[i % 4]);
        await page.waitForTimeout(150);
        await page.keyboard.up(keys[i % 4]);
        await page.waitForTimeout(50);
    }
    
    // Check state again
    state = await page.evaluate(() => window.gameState());
    console.log('After playing:', JSON.stringify(state, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
