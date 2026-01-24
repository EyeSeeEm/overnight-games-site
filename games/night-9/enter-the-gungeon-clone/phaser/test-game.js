const { chromium } = require('playwright');

async function testGame() {
    console.log('Launching browser...');
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    let errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
            console.log('ERROR:', msg.text());
        }
    });
    page.on('pageerror', err => {
        errors.push(err.message);
        console.log('PAGE ERROR:', err.message);
    });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-9/enter-the-gungeon-clone/phaser/index.html');
    await page.waitForTimeout(3000);

    // Take menu screenshot
    await page.screenshot({ path: 'screenshot-menu.png' });
    console.log('Menu screenshot saved');

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Take gameplay screenshot
    await page.screenshot({ path: 'screenshot-gameplay.png' });
    console.log('Gameplay screenshot saved');

    // Test movement and shooting
    console.log('Testing gameplay...');
    for (let i = 0; i < 40; i++) {
        const keys = ['w', 'a', 's', 'd'];
        const moveKey = keys[i % 4];

        await page.keyboard.down(moveKey);
        await page.mouse.click(400 + (i % 3) * 100, 300 + (i % 2) * 100);
        await page.waitForTimeout(80);
        await page.keyboard.up(moveKey);

        // Test dodge roll occasionally
        if (i % 10 === 0) {
            await page.keyboard.press('Space');
        }
    }

    await page.screenshot({ path: 'screenshot-action.png' });
    console.log('Action screenshot saved');

    // Test debug overlay
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-debug.png' });
    console.log('Debug screenshot saved');

    // Test blank
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-blank.png' });
    console.log('Blank effect screenshot saved');

    // Final screenshot
    await page.screenshot({ path: 'screenshot.png' });

    await browser.close();

    if (errors.length > 0) {
        console.log(`\nCompleted with ${errors.length} error(s)`);
        errors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));
    } else {
        console.log('\nTest completed successfully!');
    }
}

testGame().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
