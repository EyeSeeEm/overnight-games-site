const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    // Listen for errors
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.goto('file:///workspace/games/night-6/alien-breed-mix/canvas/index.html');
    await page.waitForTimeout(2000);

    // Take title screen screenshot
    await page.screenshot({ path: '/workspace/games/night-6/alien-breed-mix/canvas/screenshot-title.png' });
    console.log('Title screenshot taken');

    // Click to start game
    await page.click('canvas');
    await page.waitForTimeout(1000);

    // Take gameplay screenshot
    await page.screenshot({ path: '/workspace/games/night-6/alien-breed-mix/canvas/screenshot.png' });
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
            const v = window.testHarness.getVision();
            return {
                scene: v.scene,
                playerExists: !!v.player,
                playerHealth: v.player ? v.player.health : null,
                enemyCount: v.visibleEntities ? v.visibleEntities.filter(e => e.type === 'enemy').length : 0,
                pickupCount: v.visibleEntities ? v.visibleEntities.filter(e => e.type === 'pickup').length : 0,
                context: v.context
            };
        }
        return null;
    });
    console.log('Vision:', JSON.stringify(vision, null, 2));

    // Test debug commands
    const debugTest = await page.evaluate(() => {
        if (window.debugCommands) {
            window.debugCommands.godMode(true);
            window.debugCommands.giveAllWeapons();
            window.debugCommands.giveCoins(500);
            const player = window.getPlayer();
            return {
                godMode: player.godMode,
                weapons: player.weapons,
                credits: player.credits
            };
        }
        return { error: 'Debug commands not found' };
    });
    console.log('Debug test:', JSON.stringify(debugTest));

    // Test step function
    const stepResult = await page.evaluate(() => {
        if (window.testHarness && window.testHarness.step) {
            return window.testHarness.step({
                actions: [{type: 'moveDir', direction: 'east'}],
                duration: 500
            });
        }
        return { error: 'Step not available' };
    });
    console.log('Step result ok:', stepResult.ok);

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/workspace/games/night-6/alien-breed-mix/canvas/screenshot-after-step.png' });

    await browser.close();
    console.log('Test complete!');
})();
