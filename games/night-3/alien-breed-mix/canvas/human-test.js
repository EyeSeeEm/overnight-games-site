const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function humanLikeTest(iteration) {
    const screenshotDir = `/workspace/screenshots/agent-1/alien-breed-mix-canvas/iter-${iteration.toString().padStart(2, '0')}`;
    fs.mkdirSync(screenshotDir, { recursive: true });

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    try {
        await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
        await page.waitForTimeout(2000);

        // Take initial screenshot
        await page.screenshot({ path: path.join(screenshotDir, '00s.png') });

        // Start game - click canvas and press space
        await page.click('canvas');
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);

        // Human-like gameplay: move with purpose, aim at enemies, explore
        const actions = [
            // Move into the level, explore rooms
            { keys: ['w', 'w', 'w'], duration: 800, desc: 'Move forward into room' },
            { keys: ['d'], duration: 500, desc: 'Turn right' },
            { keys: ['w', 'd'], duration: 600, desc: 'Move diagonally' },
            { shoot: true, desc: 'Shoot at enemies' },
            { keys: ['w'], duration: 1000, desc: 'Continue forward' },
            { shoot: true, desc: 'Shoot' },
            { keys: ['a'], duration: 500, desc: 'Strafe left' },
            { keys: ['w'], duration: 800, desc: 'Move forward' },
            { keys: ['d', 'w'], duration: 600, desc: 'Move right-forward' },
            { shoot: true, desc: 'Engage enemies' },
            { keys: ['s'], duration: 300, desc: 'Back off' },
            { shoot: true, desc: 'Keep shooting' },
            { keys: ['w', 'w'], duration: 1000, desc: 'Push forward' },
            { keys: ['e'], duration: 100, desc: 'Try interact (door/terminal)' },
            { keys: ['w'], duration: 500, desc: 'Move through door' },
            { shoot: true, desc: 'Clear room' },
            { keys: ['a', 'w'], duration: 700, desc: 'Explore left' },
            { shoot: true, desc: 'Combat' },
            { keys: ['d', 'd'], duration: 800, desc: 'Move right' },
            { keys: ['w'], duration: 600, desc: 'Advance' },
        ];

        let elapsed = 0;
        const screenshotTimes = [10, 20, 30, 40, 50, 60];
        let screenshotIndex = 0;

        for (let cycle = 0; cycle < 6; cycle++) {
            for (const action of actions) {
                if (action.shoot) {
                    // Click to shoot at center-ish of screen (toward enemies)
                    const x = 640 + (Math.random() - 0.5) * 200;
                    const y = 360 + (Math.random() - 0.5) * 150;
                    await page.mouse.click(x, y);
                    await page.waitForTimeout(100);
                    await page.mouse.click(x + 20, y - 10);
                    await page.waitForTimeout(100);
                } else if (action.keys) {
                    for (const key of action.keys) {
                        await page.keyboard.down(key);
                    }
                    await page.waitForTimeout(action.duration || 300);
                    for (const key of action.keys) {
                        await page.keyboard.up(key);
                    }
                }

                elapsed += (action.duration || 200) / 1000;

                // Take screenshots at intervals
                while (screenshotIndex < screenshotTimes.length && elapsed >= screenshotTimes[screenshotIndex]) {
                    await page.screenshot({
                        path: path.join(screenshotDir, `${screenshotTimes[screenshotIndex]}s.png`)
                    });
                    screenshotIndex++;
                }

                if (elapsed >= 60) break;
            }
            if (elapsed >= 60) break;
        }

        // Final screenshot
        await page.screenshot({ path: path.join(screenshotDir, '60s-final.png') });

        console.log(`Iteration ${iteration} complete. Screenshots saved to ${screenshotDir}`);

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

const iteration = parseInt(process.argv[2]) || 1;
humanLikeTest(iteration);
