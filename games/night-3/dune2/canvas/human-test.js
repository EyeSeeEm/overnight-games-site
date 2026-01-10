// Human-like gameplay test for Dune 2 (Canvas)
// Tests RTS mechanics: building, unit production, combat

const { chromium } = require('playwright');
const fs = require('fs');

const ITERATION = process.argv[2] || '01';
const SCREENSHOT_DIR = `/workspace/screenshots/agent-5/dune2-canvas/iter-${ITERATION}`;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function humanTest() {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    console.log(`Starting iteration ${ITERATION}...`);

    await page.goto('file:///workspace/games/night-3/dune2/canvas/index.html');
    await sleep(2000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/00s.png` });
    console.log('Captured 00s.png');

    const startTime = Date.now();
    let screenshotCount = 1;

    // RTS gameplay loop - 60 seconds
    while (Date.now() - startTime < 60000) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        if (elapsed >= screenshotCount * 10 && screenshotCount <= 5) {
            await page.screenshot({ path: `${SCREENSHOT_DIR}/${screenshotCount * 10}s.png` });
            console.log(`Captured ${screenshotCount * 10}s.png`);
            screenshotCount++;
        }

        // Human-like RTS play:
        // 1. Click on buildings to build (1-7 keys for building menu)
        // 2. Click on units to train (Q-Y keys for unit menu)
        // 3. Select units by clicking on map
        // 4. Move units by right-clicking or clicking destinations

        // Try building (1-7 keys)
        const buildKey = ['1', '2', '3', '4', '5', '6', '7'][Math.floor(Math.random() * 7)];
        await page.keyboard.press(buildKey);
        await sleep(200);

        // Click on map to place building or select
        const mapX = 400 + Math.floor(Math.random() * 400);
        const mapY = 100 + Math.floor(Math.random() * 350);
        await page.mouse.click(mapX, mapY);
        await sleep(300);

        // Try training units (Q-Y keys)
        const unitKey = ['q', 'w', 'e', 'r', 't', 'y'][Math.floor(Math.random() * 6)];
        await page.keyboard.press(unitKey);
        await sleep(200);

        // Click to move/command units
        const destX = 300 + Math.floor(Math.random() * 500);
        const destY = 150 + Math.floor(Math.random() * 300);
        await page.mouse.click(destX, destY);
        await sleep(300);

        // Scroll map occasionally with arrow keys
        if (Math.random() > 0.7) {
            const scrollKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'][Math.floor(Math.random() * 4)];
            await page.keyboard.down(scrollKey);
            await sleep(300);
            await page.keyboard.up(scrollKey);
        }

        await sleep(200);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/60s-final.png` });
    console.log('Captured 60s-final.png');

    await page.screenshot({ path: '/workspace/games/night-3/dune2/canvas/screenshot.png' });

    await browser.close();
    console.log(`Iteration ${ITERATION} complete!`);
}

humanTest().catch(console.error);
