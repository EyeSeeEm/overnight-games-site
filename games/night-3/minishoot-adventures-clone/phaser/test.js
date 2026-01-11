const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/minishoot-adventures-clone/phaser/index.html');
    await page.waitForTimeout(3000);
    
    // Check game state
    let state = await page.evaluate(() => window.gameState);
    console.log('Game state after 3s:', JSON.stringify(state, null, 2));
    
    // Play for 5 seconds
    console.log('Playing...');
    for (let i = 0; i < 50; i++) {
        await page.keyboard.down(['w', 'a', 's', 'd'][i % 4]);
        await page.mouse.move(400 + Math.random() * 200 - 100, 300 + Math.random() * 200 - 100);
        await page.mouse.down();
        await page.waitForTimeout(80);
        await page.mouse.up();
        await page.keyboard.up(['w', 'a', 's', 'd'][i % 4]);
    }
    
    state = await page.evaluate(() => window.gameState);
    console.log('Game state after playing:', JSON.stringify(state, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
