const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/enter-the-gungeon-clone/phaser/index.html');
    await page.waitForTimeout(2000);
    
    // Start game
    console.log('Starting game...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    
    // Play - shoot and move to kill enemies
    console.log('Playing for 10 seconds...');
    await page.mouse.move(350, 250); // Aim at enemy spawn area
    for (let i = 0; i < 100; i++) {
        await page.mouse.down();
        await page.keyboard.down(['w', 'a', 's', 'd'][i % 4]);
        await page.waitForTimeout(80);
        await page.mouse.up();
        await page.keyboard.up(['w', 'a', 's', 'd'][i % 4]);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved to screenshot.png');
    
    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGame().catch(console.error);
