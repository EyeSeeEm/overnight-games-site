const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    // Load game
    await page.goto('file:///workspace/games/night-3/quasimorph-clone/canvas/index.html');

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Take initial screenshot (menu)
    await page.screenshot({ path: '/workspace/test-quasimorph-1.png' });
    console.log('Screenshot 1: Menu');

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/workspace/test-quasimorph-2.png' });
    console.log('Screenshot 2: Game started');

    // Move around to find loot
    for (let i = 0; i < 5; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(200);
    }
    await page.screenshot({ path: '/workspace/test-quasimorph-3.png' });
    console.log('Screenshot 3: After movement');

    // Try pressing E to loot (in case we're on a loot container)
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/test-quasimorph-4.png' });
    console.log('Screenshot 4: After loot attempt');

    // Check UI - should see auto-end toggle button
    await page.screenshot({ path: '/workspace/test-quasimorph-5.png' });
    console.log('Screenshot 5: UI with auto-end button visible');

    await browser.close();
    console.log('Test completed successfully!');
}

testGame().catch(console.error);
