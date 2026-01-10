const { chromium } = require('playwright');
const fs = require('fs');

const ITERATION = process.argv[2] || '01';
const DIR = `/workspace/screenshots/agent-5/lost-outpost-canvas/iter-${ITERATION}`;

async function test() {
    fs.mkdirSync(DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.goto('file:///workspace/games/night-3/lost-outpost/canvas/index.html');
    await page.waitForTimeout(2000);
    await page.click('canvas');
    await page.screenshot({ path: `${DIR}/00s.png` });
    console.log('Captured 00s.png');

    for (let i = 0; i < 60; i++) {
        // Move with WASD
        await page.keyboard.down(['w','a','s','d'][i % 4]);
        await page.waitForTimeout(100);
        await page.keyboard.up(['w','a','s','d'][i % 4]);
        // Click to shoot
        await page.mouse.click(640 + (Math.random() - 0.5) * 400, 360 + (Math.random() - 0.5) * 200);
        // Weapon switch
        if (i % 20 === 0) await page.keyboard.press(['1','2','3'][Math.floor(Math.random()*3)]);
        // Reload
        if (i % 15 === 0) await page.keyboard.press('r');
        if (i % 10 === 0 && i > 0) {
            await page.screenshot({ path: `${DIR}/${i}s.png` });
            console.log(`Captured ${i}s.png`);
        }
        await page.waitForTimeout(900);
    }

    await page.screenshot({ path: `${DIR}/60s-final.png` });
    await page.screenshot({ path: '/workspace/games/night-3/lost-outpost/canvas/screenshot.png' });
    console.log('Done!');
    await browser.close();
}
test().catch(console.error);
