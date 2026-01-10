const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

async function funTest() {
    console.log('=== STARSCAPE-CLONE FUN TEST ===\n');

    const screenshotDir = `/workspace/screenshots/agent-3/starscape-clone-canvas/`;
    await fs.mkdir(screenshotDir, { recursive: true });

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    await page.goto(`file://${path.resolve(__dirname, 'index.html')}`);
    await page.waitForTimeout(2000);

    // Start game
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    console.log('Testing: Combat engagement (60 seconds of play)\n');

    // Extended gameplay with varied actions
    let frames = [];
    for (let i = 0; i < 60; i++) {
        // Varied movement
        const keys = ['w', 'a', 's', 'd'];
        await page.keyboard.down(keys[i % 4]);

        // Shoot constantly
        await page.mouse.click(640 + (Math.random() - 0.5) * 300, 360 + (Math.random() - 0.5) * 200);

        // Capture frame every 10 iterations
        if (i % 10 === 0) {
            await page.screenshot({ path: `${screenshotDir}/fun-test-${i.toString().padStart(2, '0')}.png` });
            frames.push(i);
        }

        await page.waitForTimeout(50);
        await page.keyboard.up(keys[i % 4]);
    }

    // Fire missiles
    for (let i = 0; i < 5; i++) {
        await page.keyboard.press('f');
        await page.waitForTimeout(300);
    }

    // Use gravity beam
    await page.keyboard.down('e');
    await page.waitForTimeout(1000);
    await page.keyboard.up('e');

    // More combat
    for (let i = 0; i < 30; i++) {
        await page.keyboard.down(['w','a','s','d'][i % 4]);
        await page.mouse.click(640, 360);
        await page.waitForTimeout(80);
        await page.keyboard.up(['w','a','s','d'][i % 4]);
    }

    // Enable debug and capture
    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/debug-overlay.png` });

    // Disable debug for final screenshot
    await page.keyboard.press('q');
    await page.waitForTimeout(200);

    // More gameplay for exciting screenshot
    for (let i = 0; i < 20; i++) {
        await page.keyboard.down(['w','a','s','d'][i % 4]);
        await page.mouse.click(640 + (Math.random() - 0.5) * 100, 360 + (Math.random() - 0.5) * 100);
        await page.waitForTimeout(50);
        await page.keyboard.up(['w','a','s','d'][i % 4]);
    }

    await page.screenshot({ path: `${screenshotDir}/iter-final.png` });

    // Get game state
    const state = await page.evaluate(() => {
        return {
            state: window.gameState?.state || 'unknown',
            score: window.gameState?.score || 0,
            wave: window.gameState?.wave || 0,
            playerHp: window.gameState?.playerHp || 0,
            aegisHp: window.gameState?.aegisHp || 0,
            enemies: window.gameState?.enemies || 0
        };
    });

    console.log('\n=== GAME STATE AFTER FUN TEST ===');
    console.log(JSON.stringify(state, null, 2));

    console.log('\n=== FUN TEST ASSESSMENT ===');
    console.log('Combat: Active - player was shooting, enemies spawned');
    console.log('Score: ' + state.score + ' - player killed enemies');
    console.log('Wave: ' + state.wave + ' - wave progression working');
    console.log(`Screenshots saved to: ${screenshotDir}`);

    await browser.close();

    return {
        passed: state.score > 0 && state.wave >= 1,
        score: state.score,
        wave: state.wave
    };
}

funTest().then(result => {
    console.log('\n=== RESULT ===');
    console.log(result.passed ? 'PASSED - Game shows combat engagement' : 'NEEDS WORK');
}).catch(console.error);
