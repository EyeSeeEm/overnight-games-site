const { chromium } = require('playwright');
const fs = require('fs');

const ITERATION = process.argv[2] || '01';
const SCREENSHOT_DIR = `/workspace/screenshots/agent-5/skyrim-2d-canvas/iter-${ITERATION}`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log(`Starting iteration ${ITERATION}...`);
    await page.goto('file:///workspace/games/night-3/skyrim-2d/canvas/index.html');
    await sleep(2000);
    await page.click('canvas');
    await sleep(500);

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

        // RPG-style exploration
        // Move with WASD
        const moveKey = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
        await page.keyboard.down(moveKey);
        await sleep(200 + Math.random() * 300);
        await page.keyboard.up(moveKey);

        // Attack with Space occasionally
        if (Math.random() > 0.7) {
            await page.keyboard.press('Space');
            await sleep(200);
        }

        // Interact with E occasionally
        if (Math.random() > 0.8) {
            await page.keyboard.press('e');
            await sleep(300);
        }

        // Use hotbar abilities (1-9)
        if (Math.random() > 0.9) {
            await page.keyboard.press(String(Math.floor(Math.random() * 9) + 1));
        }

        await sleep(100);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/60s-final.png` });
    console.log('Captured 60s-final.png');
    await page.screenshot({ path: '/workspace/games/night-3/skyrim-2d/canvas/screenshot.png' });
    await browser.close();
    console.log(`Iteration ${ITERATION} complete!`);
}

test().catch(console.error);
