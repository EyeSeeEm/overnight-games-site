const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/phaser/index.html');
    await page.waitForTimeout(3000);
    
    // Check state
    let state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('Initial state:', JSON.stringify(state, null, 2));
    
    // Start playing
    await page.click('canvas');
    await page.waitForTimeout(500);
    
    // Move around
    console.log('Testing movement...');
    for (let i = 0; i < 10; i++) {
        await page.keyboard.down(['w', 'a', 's', 'd'][i % 4]);
        await page.waitForTimeout(100);
        await page.keyboard.up(['w', 'a', 's', 'd'][i % 4]);
    }
    
    // Test shooting in different directions
    console.log('Testing tear shooting...');
    for (let dir of ['i', 'j', 'k', 'l']) {
        await page.keyboard.down(dir);
        await page.waitForTimeout(300);
        await page.keyboard.up(dir);
        await page.waitForTimeout(100);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved');
    
    // Check state after gameplay
    state = await page.evaluate(() => window.gameState ? window.gameState() : null);
    console.log('\nFinal state:', JSON.stringify(state, null, 2));
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
