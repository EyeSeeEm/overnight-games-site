const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    // Load game
    await page.goto('file:///workspace/games/night-3/system-shock-2d/canvas/index.html');

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: '/workspace/test-system-shock-1.png' });
    console.log('Screenshot 1: Initial state');

    // Click to focus and start
    await page.click('canvas');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/test-system-shock-2.png' });
    console.log('Screenshot 2: After click');

    // Move around
    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(200);
    }
    await page.screenshot({ path: '/workspace/test-system-shock-3.png' });
    console.log('Screenshot 3: After movement');

    // Move mouse to change facing direction
    await page.mouse.move(900, 360);
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/test-system-shock-4.png' });
    console.log('Screenshot 4: Facing right');

    // Toggle flashlight
    await page.keyboard.press('f');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/test-system-shock-5.png' });
    console.log('Screenshot 5: Flashlight toggled');

    await browser.close();
    console.log('Test completed successfully!');
}

testGame().catch(console.error);
