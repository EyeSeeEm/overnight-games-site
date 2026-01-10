const { chromium } = require('playwright');
const fs = require('fs');

async function testCombat() {
    const screenshotDir = './screenshots/combat-test';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Enable debug mode
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    await page.screenshot({ path: `${screenshotDir}/00-start.png` });
    console.log('Game started');

    // Hold mouse down and move toward center of screen
    // This simulates holding the fire button
    console.log('Starting combat test - holding mouse button down...');

    await page.mouse.move(640, 360);
    await page.mouse.down();

    // Move and shoot for 20 seconds with mouse held down
    for (let i = 0; i < 100; i++) {
        // Move player in random direction
        const moveKey = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
        await page.keyboard.down(moveKey);

        // Aim in a sweeping pattern to hit enemies
        const angle = (i / 10) * Math.PI * 2;
        const aimX = 640 + Math.cos(angle) * 200;
        const aimY = 360 + Math.sin(angle) * 200;
        await page.mouse.move(aimX, aimY);

        await page.waitForTimeout(100);
        await page.keyboard.up(moveKey);

        if (i % 20 === 0) {
            await page.screenshot({ path: `${screenshotDir}/01-combat-${i}.png` });
            console.log(`Combat frame ${i}`);
        }
    }

    await page.mouse.up();
    await page.screenshot({ path: `${screenshotDir}/02-after-combat.png` });
    console.log('Combat phase complete');

    // Move around more to find enemies and keep shooting
    console.log('Extended exploration with shooting...');

    for (let round = 0; round < 5; round++) {
        // Move in one direction
        const dirs = ['w', 'd', 's', 'a'];
        await page.keyboard.down(dirs[round % 4]);

        // Shoot while moving
        await page.mouse.down();
        for (let i = 0; i < 40; i++) {
            const angle = (i / 8) * Math.PI * 2;
            await page.mouse.move(640 + Math.cos(angle) * 250, 360 + Math.sin(angle) * 250);
            await page.waitForTimeout(50);
        }
        await page.mouse.up();

        await page.keyboard.up(dirs[round % 4]);
        await page.screenshot({ path: `${screenshotDir}/03-explore-${round}.png` });
        console.log(`Exploration round ${round}`);
    }

    await page.screenshot({ path: `${screenshotDir}/04-final.png` });
    console.log('Test complete');

    await browser.close();
}

testCombat().catch(console.error);
