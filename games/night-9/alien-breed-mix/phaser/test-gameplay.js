const { chromium } = require('playwright');

async function testGameplay() {
    console.log('Launching browser for gameplay test...');
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
    await page.goto('file:///workspace/games/night-9/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Play for 30 frames with various inputs
    console.log('Testing gameplay (30 frames)...');
    for (let i = 0; i < 30; i++) {
        const keys = ['w', 'a', 's', 'd'];
        const key = keys[i % 4];

        // Move
        await page.keyboard.down(key);

        // Aim and shoot
        await page.mouse.move(
            640 + Math.cos(i * 0.5) * 200,
            360 + Math.sin(i * 0.5) * 200
        );
        await page.mouse.down();
        await page.waitForTimeout(50);
        await page.mouse.up();

        // Take frame screenshot
        await page.screenshot({ path: `frame-${i.toString().padStart(3, '0')}.png` });

        await page.keyboard.up(key);
        await page.waitForTimeout(30);
    }

    // Try opening a door
    console.log('Testing door interaction...');
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Take action screenshot
    await page.screenshot({ path: 'screenshot-combat.png' });
    console.log('Combat screenshot saved');

    // Show debug overlay
    await page.keyboard.press('q');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'screenshot-final.png' });

    await browser.close();

    if (errors.length > 0) {
        console.log(`\nCompleted with ${errors.length} error(s)`);
    } else {
        console.log('\nTest completed successfully with no errors!');
    }
}

testGameplay().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
