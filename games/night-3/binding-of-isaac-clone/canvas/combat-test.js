const { chromium } = require('playwright');
const fs = require('fs');

async function testCombat() {
    const screenshotDir = '/workspace/screenshots/agent-1/binding-of-isaac-canvas';

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    await page.keyboard.press('Backquote');
    await page.waitForTimeout(300);

    console.log('Moving to find enemies...');

    // Go south to a room with enemies
    await page.keyboard.down('s');
    await page.waitForTimeout(2000);
    await page.keyboard.up('s');

    await page.screenshot({ path: `${screenshotDir}/combat-01-enter-room.png` });
    console.log('Entered enemy room');

    // Combat - shoot and move
    console.log('Combat test...');
    for (let round = 0; round < 5; round++) {
        // Shoot in all directions while dodging
        for (let i = 0; i < 20; i++) {
            const shootKey = ['i', 'j', 'k', 'l'][i % 4];
            await page.keyboard.press(shootKey);

            const moveKey = ['w', 'a', 's', 'd'][Math.floor(i / 5) % 4];
            await page.keyboard.down(moveKey);
            await page.waitForTimeout(50);
            await page.keyboard.up(moveKey);
        }

        await page.screenshot({ path: `${screenshotDir}/combat-02-round-${round}.png` });
    }

    await page.screenshot({ path: `${screenshotDir}/combat-03-after.png` });
    console.log('Combat phase 1 complete');

    // Explore more rooms
    console.log('Exploring more rooms...');
    const directions = ['d', 'w', 'a', 's'];
    for (let dir of directions) {
        await page.keyboard.down(dir);
        await page.waitForTimeout(1500);
        await page.keyboard.up(dir);

        // Clear room
        for (let i = 0; i < 30; i++) {
            await page.keyboard.press(['i', 'j', 'k', 'l'][i % 4]);
            await page.waitForTimeout(60);
        }

        await page.screenshot({ path: `${screenshotDir}/combat-04-explore-${dir}.png` });
    }

    await page.screenshot({ path: `${screenshotDir}/combat-05-final.png` });
    console.log('Combat test complete');

    await browser.close();
}

testCombat().catch(console.error);
