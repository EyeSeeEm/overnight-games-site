const { chromium } = require('playwright');
const fs = require('fs');

const ITERATION = process.argv[2] || '01';
const SCREENSHOT_DIR = `/workspace/screenshots/agent-5/dune2-phaser/iter-${ITERATION}`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log(`Starting iteration ${ITERATION}...`);
    await page.goto('file:///workspace/games/night-3/dune2/phaser/index.html');
    await sleep(2000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/00s.png` });
    console.log('Captured 00s.png');

    const startTime = Date.now();
    let sc = 1;

    while (Date.now() - startTime < 60000) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed >= sc * 10 && sc <= 5) {
            await page.screenshot({ path: `${SCREENSHOT_DIR}/${sc * 10}s.png` });
            console.log(`Captured ${sc * 10}s.png`);
            sc++;
        }

        // RTS actions
        await page.keyboard.press(['1','2','3','4','5','6','7'][Math.floor(Math.random()*7)]);
        await sleep(200);
        await page.mouse.click(400 + Math.random()*400, 100 + Math.random()*350);
        await sleep(300);
        await page.keyboard.press(['q','w','e','t'][Math.floor(Math.random()*4)]);
        await sleep(200);
        await page.mouse.click(300 + Math.random()*500, 150 + Math.random()*300);
        await sleep(200);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/60s-final.png` });
    console.log('Captured 60s-final.png');
    await page.screenshot({ path: '/workspace/games/night-3/dune2/phaser/screenshot.png' });
    await browser.close();
    console.log(`Iteration ${ITERATION} complete!`);
}

test().catch(console.error);
