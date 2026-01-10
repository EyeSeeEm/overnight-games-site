const { chromium } = require('playwright');
const fs = require('fs');

async function testGame() {
    const screenshotDir = '/workspace/screenshots/agent-1/binding-of-isaac-canvas';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Enable debug mode
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(300);

    await page.screenshot({ path: `${screenshotDir}/iter-05-debug.png` });
    console.log('Starting room captured');

    // Move to another room to find enemies
    console.log('Exploring to find enemies...');

    // Move up to next room
    await page.keyboard.down('w');
    await page.waitForTimeout(800);
    await page.keyboard.up('w');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/iter-06-room2.png` });

    // Shoot to clear enemies
    console.log('Combat test...');
    for (let i = 0; i < 30; i++) {
        // Shoot in all directions
        const shootKeys = ['i', 'j', 'k', 'l'];
        await page.keyboard.press(shootKeys[i % 4]);
        await page.waitForTimeout(100);

        // Move around
        const moveKeys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(moveKeys[i % 4]);
        await page.waitForTimeout(100);
        await page.keyboard.up(moveKeys[i % 4]);

        if (i % 10 === 0) {
            await page.screenshot({ path: `${screenshotDir}/iter-07-combat-${i}.png` });
        }
    }

    await page.screenshot({ path: `${screenshotDir}/iter-08-after-combat.png` });
    console.log('Combat complete');

    // Try to move to more rooms
    console.log('Exploring more rooms...');
    const explorations = ['d', 's', 'a', 'w'];
    for (let i = 0; i < explorations.length; i++) {
        await page.keyboard.down(explorations[i]);
        await page.waitForTimeout(800);
        await page.keyboard.up(explorations[i]);
        await page.waitForTimeout(500);

        // Shoot to clear
        for (let j = 0; j < 20; j++) {
            await page.keyboard.press(['i', 'j', 'k', 'l'][j % 4]);
            await page.waitForTimeout(80);
        }
    }

    await page.screenshot({ path: `${screenshotDir}/iter-09-explored.png` });
    console.log('Exploration complete');

    await browser.close();
}

testGame().catch(console.error);
