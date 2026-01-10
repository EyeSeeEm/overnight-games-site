const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testGame() {
    const screenshotDir = '/workspace/screenshots/agent-1/alien-breed-mix-phaser';
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
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/phaser/index.html');
    await page.waitForTimeout(3000);

    // Wait for game to fully load
    await page.waitForFunction(() => window.gameState && window.gameState().state === 'playing', { timeout: 10000 }).catch(() => {});

    // Enable debug mode
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${screenshotDir}/iter-07-debug.png` });
    console.log('Captured: Debug mode');

    // Combat test
    console.log('Starting combat test...');
    await page.mouse.move(640, 360);
    await page.mouse.down();

    for (let i = 0; i < 50; i++) {
        const dir = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(dir);

        const angle = (i / 8) * Math.PI * 2;
        await page.mouse.move(640 + Math.cos(angle) * 200, 360 + Math.sin(angle) * 200);

        await page.waitForTimeout(60);
        await page.keyboard.up(dir);

        if (i % 15 === 0) {
            await page.screenshot({ path: `${screenshotDir}/iter-08-combat-${i}.png` });
        }
    }

    await page.mouse.up();
    await page.screenshot({ path: `${screenshotDir}/iter-09-after-combat.png` });
    console.log('Combat test complete');

    // Extended play
    for (let round = 0; round < 3; round++) {
        const dirs = ['w', 'd', 's', 'a'];
        await page.keyboard.down(dirs[round % 4]);
        await page.mouse.down();

        for (let i = 0; i < 30; i++) {
            const angle = (i / 6) * Math.PI * 2;
            await page.mouse.move(640 + Math.cos(angle) * 250, 360 + Math.sin(angle) * 250);
            await page.waitForTimeout(50);
        }

        await page.mouse.up();
        await page.keyboard.up(dirs[round % 4]);
    }

    await page.screenshot({ path: `${screenshotDir}/iter-10-final.png` });
    console.log('Test complete!');

    await browser.close();
}

testGame().catch(console.error);
