const { chromium } = require('playwright');

async function captureScreenshot() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/home/agent/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    
    const page = await browser.newPage();
    await page.goto('file:///workspace/games/night-8/dome-keeper-clone/canvas/index.html');
    await page.waitForTimeout(2000);
    
    // Start game
    await page.click('button');
    await page.waitForTimeout(1000);
    
    await page.click('canvas');
    
    // Mine down and collect resources
    for (let i = 0; i < 40; i++) {
        await page.keyboard.down('s');
        await page.keyboard.down(' ');
        await page.waitForTimeout(80);
        await page.keyboard.up(' ');
        await page.keyboard.up('s');
    }
    
    // Mine sideways
    for (let i = 0; i < 15; i++) {
        await page.keyboard.down('d');
        await page.keyboard.down(' ');
        await page.waitForTimeout(80);
        await page.keyboard.up(' ');
        await page.keyboard.up('d');
    }
    
    // More mining
    for (let i = 0; i < 20; i++) {
        await page.keyboard.down('s');
        await page.keyboard.down(' ');
        await page.waitForTimeout(80);
        await page.keyboard.up(' ');
        await page.keyboard.up('s');
    }
    
    // Capture the mining screenshot
    await page.screenshot({ path: '/workspace/games/night-8/dome-keeper-clone/canvas/screenshot.png' });
    console.log('Screenshot captured!');
    
    await browser.close();
}

captureScreenshot().catch(console.error);
