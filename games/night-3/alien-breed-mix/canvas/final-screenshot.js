const { chromium } = require('playwright');

async function captureExcitingGameplay() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(500);

    console.log('Playing aggressively to get action shot...');

    // Move toward enemies and engage
    for (let phase = 0; phase < 3; phase++) {
        // Move in different direction each phase
        const dirs = [['d', 'w'], ['w', 'd'], ['a', 's']];
        await page.keyboard.down(dirs[phase][0]);
        await page.keyboard.down(dirs[phase][1]);

        // Shoot in sweeping pattern
        await page.mouse.down();
        for (let i = 0; i < 25; i++) {
            const angle = (i / 8) * Math.PI * 2;
            await page.mouse.move(640 + Math.cos(angle) * 250, 360 + Math.sin(angle) * 200);
            await page.waitForTimeout(40);
        }
        await page.mouse.up();

        await page.keyboard.up(dirs[phase][0]);
        await page.keyboard.up(dirs[phase][1]);
        await page.waitForTimeout(200);
    }

    // Final burst of action
    await page.mouse.move(700, 350);
    await page.keyboard.down('w');
    await page.mouse.down();
    await page.waitForTimeout(200);

    // Capture during action
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Final screenshot captured!');

    await page.mouse.up();
    await page.keyboard.up('w');

    await browser.close();
}

captureExcitingGameplay().catch(console.error);
