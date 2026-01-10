const { chromium } = require('playwright');
const fs = require('fs');

async function testFix() {
    const screenshotDir = '/workspace/screenshots/agent-1/binding-of-isaac-phaser';
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
    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/phaser/index.html');
    await page.waitForTimeout(3000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Enable debug
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(300);

    await page.screenshot({ path: `${screenshotDir}/01-start.png` });
    console.log('Starting room');

    // Go south to find enemies
    console.log('Moving south...');
    await page.keyboard.down('s');
    await page.waitForTimeout(2000);
    await page.keyboard.up('s');
    await page.screenshot({ path: `${screenshotDir}/02-south.png` });

    // Go east
    console.log('Moving east...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.screenshot({ path: `${screenshotDir}/03-east.png` });

    // Combat
    console.log('Combat...');
    for (let i = 0; i < 30; i++) {
        const shootKey = ['i', 'j', 'k', 'l'][i % 4];
        await page.keyboard.press(shootKey);
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);
        await page.waitForTimeout(60);
        await page.keyboard.up(moveKey);
    }
    await page.screenshot({ path: `${screenshotDir}/04-combat.png` });

    console.log('Test complete');
    await browser.close();
}

testFix().catch(console.error);
