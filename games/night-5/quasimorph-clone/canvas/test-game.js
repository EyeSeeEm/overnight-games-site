const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    // Listen for errors
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.goto('file:///workspace/games/night-6/quasimorph-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Take title screen screenshot
    await page.screenshot({ path: '/workspace/games/night-6/quasimorph-clone/canvas/screenshot-title.png' });
    console.log('Title screenshot taken');

    // Click to start game
    await page.click('canvas');
    await page.waitForTimeout(1000);

    // Take gameplay screenshot
    await page.screenshot({ path: '/workspace/games/night-6/quasimorph-clone/canvas/screenshot.png' });
    console.log('Gameplay screenshot taken');

    // Test harness verification
    const harness = await page.evaluate(() => {
        if (window.testHarness && window.testHarness.verifyHarness) {
            return window.testHarness.verifyHarness();
        }
        return { error: 'Test harness not found' };
    });
    console.log('Harness verification:', harness.allPassed ? 'PASSED' : 'FAILED');
    if (!harness.allPassed && harness.checks) {
        for (const check of harness.checks) {
            if (!check.passed) console.log('  -', check.name, ':', check.error);
        }
    }

    // Get vision
    const vision = await page.evaluate(() => {
        if (window.testHarness && window.testHarness.getVision) {
            return window.testHarness.getVision();
        }
        return null;
    });
    console.log('Vision:', JSON.stringify(vision, null, 2));

    await browser.close();
    console.log('Test complete!');
})();
