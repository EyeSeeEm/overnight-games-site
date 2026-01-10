const { chromium } = require('playwright');

async function captureGameplay() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 720 });

    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    console.log('Moving to enemy room...');

    // Move south to find enemies
    await page.keyboard.down('s');
    await page.waitForTimeout(2000);
    await page.keyboard.up('s');

    // Play for a bit to show action
    console.log('Creating action scene...');
    for (let i = 0; i < 30; i++) {
        // Move and shoot
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);

        // Shoot rapidly
        const shootKey = ['i', 'j', 'k', 'l'][i % 4];
        await page.keyboard.press(shootKey);

        await page.waitForTimeout(80);
        await page.keyboard.up(moveKey);
    }

    // Final shooting burst for screenshot
    await page.keyboard.press('k'); // shoot down
    await page.waitForTimeout(50);
    await page.keyboard.press('l'); // shoot right
    await page.waitForTimeout(50);

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot captured!');

    await browser.close();
}

captureGameplay().catch(console.error);
