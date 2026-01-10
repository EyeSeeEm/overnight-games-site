const { chromium } = require('playwright');
const fs = require('fs');

async function testDoors() {
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

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Enable debug mode
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(300);

    console.log('Testing room transitions...');

    // Go SOUTH - hold S for a long time
    console.log('Moving south to door...');
    await page.keyboard.down('s');
    for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(100);
        if (i % 10 === 0) {
            await page.screenshot({ path: `${screenshotDir}/door-south-${i}.png` });
        }
    }
    await page.keyboard.up('s');
    await page.screenshot({ path: `${screenshotDir}/door-south-final.png` });
    console.log('South movement complete');

    // Check if we transitioned
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/after-south.png` });

    // If still in same room, try other directions
    console.log('Moving north...');
    await page.keyboard.down('w');
    for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(100);
    }
    await page.keyboard.up('w');
    await page.screenshot({ path: `${screenshotDir}/door-north-final.png` });

    console.log('Moving east...');
    await page.keyboard.down('d');
    for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(100);
    }
    await page.keyboard.up('d');
    await page.screenshot({ path: `${screenshotDir}/door-east-final.png` });

    console.log('Moving west...');
    await page.keyboard.down('a');
    for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(100);
    }
    await page.keyboard.up('a');
    await page.screenshot({ path: `${screenshotDir}/door-west-final.png` });

    console.log('Door test complete');
    await browser.close();
}

testDoors().catch(console.error);
