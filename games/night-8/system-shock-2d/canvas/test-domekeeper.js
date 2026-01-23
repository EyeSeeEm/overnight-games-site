const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/home/agent/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    
    const page = await browser.newPage();
    await page.goto('file:///workspace/games/night-8/dome-keeper-clone/canvas/index.html');
    await page.waitForTimeout(2000);
    
    // Screenshot start
    await page.screenshot({ path: '/workspace/games/night-8/dome-keeper-clone/canvas/test-start.png' });
    
    // Start game
    await page.click('button');
    await page.waitForTimeout(1000);
    
    await page.click('canvas');
    
    // Mine down
    for (let i = 0; i < 30; i++) {
        await page.keyboard.down('s');
        await page.keyboard.down(' ');
        await page.waitForTimeout(100);
        await page.keyboard.up(' ');
        await page.keyboard.up('s');
    }
    
    await page.screenshot({ path: '/workspace/games/night-8/dome-keeper-clone/canvas/test-mining.png' });
    
    // Mine left and right
    for (let i = 0; i < 10; i++) {
        await page.keyboard.down('a');
        await page.keyboard.down(' ');
        await page.waitForTimeout(100);
        await page.keyboard.up(' ');
        await page.keyboard.up('a');
    }
    
    await page.screenshot({ path: '/workspace/games/night-8/dome-keeper-clone/canvas/test-mining2.png' });
    
    // Enable debug
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/games/night-8/dome-keeper-clone/canvas/test-debug.png' });
    
    await browser.close();
    console.log('Dome Keeper tests completed!');
}

testGame().catch(console.error);
