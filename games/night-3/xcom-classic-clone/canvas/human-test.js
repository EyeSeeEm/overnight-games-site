// Human-like gameplay test for X-COM Classic Clone (Canvas)
// Tests turn-based tactical combat with intentional play

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ITERATION = process.argv[2] || '01';
const SCREENSHOT_DIR = `/workspace/screenshots/agent-5/xcom-classic-clone-canvas/iter-${ITERATION}`;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function humanTest() {
    // Create screenshot directory
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

    console.log(`Starting iteration ${ITERATION}...`);

    await page.goto('file:///workspace/games/night-3/xcom-classic-clone/canvas/index.html');
    await sleep(2000);

    // Initial screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/00s.png` });
    console.log('Captured 00s.png');

    const startTime = Date.now();
    let screenshotCount = 1;

    // Turn-based game loop - 60 seconds of play
    while (Date.now() - startTime < 60000) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);

        // Capture screenshots at intervals (10s, 20s, 30s, 40s, 50s)
        if (elapsed >= screenshotCount * 10 && screenshotCount <= 5) {
            await page.screenshot({ path: `${SCREENSHOT_DIR}/${screenshotCount * 10}s.png` });
            console.log(`Captured ${screenshotCount * 10}s.png`);
            screenshotCount++;
        }

        // Human-like turn-based play:
        // 1. Select soldiers and move them forward
        // 2. Try to shoot enemies
        // 3. End turn and repeat

        // Cycle through soldiers with Space
        await page.keyboard.press('Space');
        await sleep(300);

        // Try to shoot any visible enemy (S for snap shot)
        await page.keyboard.press('s');
        await sleep(400);

        // Move the current soldier forward toward the map center
        // Click on tiles ahead of the soldier
        // The map is centered, soldiers start at bottom left landing zone

        // Try different move positions to explore
        const moveX = 400 + Math.floor(Math.random() * 300);
        const moveY = 150 + Math.floor(Math.random() * 200);
        await page.mouse.click(moveX, moveY);
        await sleep(500);

        // Try another snap shot after moving
        await page.keyboard.press('s');
        await sleep(400);

        // Select next soldier
        await page.keyboard.press('Space');
        await sleep(300);

        // Try to shoot
        await page.keyboard.press('s');
        await sleep(400);

        // Move this soldier too
        const moveX2 = 450 + Math.floor(Math.random() * 250);
        const moveY2 = 180 + Math.floor(Math.random() * 180);
        await page.mouse.click(moveX2, moveY2);
        await sleep(500);

        // Try shooting again
        await page.keyboard.press('s');
        await sleep(400);

        // End turn to let aliens act
        await page.keyboard.press('e');
        await sleep(1500); // Wait for alien turn to complete

        // Start next player turn
        // Continue with more soldiers
        for (let i = 0; i < 4; i++) {
            await page.keyboard.press('Space');
            await sleep(200);

            // Shoot if possible
            await page.keyboard.press('s');
            await sleep(300);

            // Try aimed shot if snap missed
            await page.keyboard.press('a');
            await sleep(300);

            // Move toward center of map (where aliens likely are)
            const mx = 500 + Math.floor(Math.random() * 200);
            const my = 200 + Math.floor(Math.random() * 150);
            await page.mouse.click(mx, my);
            await sleep(400);
        }

        // End turn again
        await page.keyboard.press('e');
        await sleep(1500);
    }

    // Final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/60s-final.png` });
    console.log('Captured 60s-final.png');

    // Also save as main screenshot if it looks good
    await page.screenshot({ path: '/workspace/games/night-3/xcom-classic-clone/canvas/screenshot.png' });

    await browser.close();
    console.log(`Iteration ${ITERATION} complete!`);
}

humanTest().catch(console.error);
