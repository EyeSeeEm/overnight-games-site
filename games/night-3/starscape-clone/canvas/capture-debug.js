const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

async function captureDebugScreenshot() {
    const screenshotDir = `/workspace/screenshots/agent-3/starscape-clone-canvas/`;
    await fs.mkdir(screenshotDir, { recursive: true });

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    await page.goto(`file://${path.resolve(__dirname, 'index.html')}`);
    await page.waitForTimeout(2000);

    // Start game and enable debug
    await page.click('canvas');
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    await page.keyboard.press('q');
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${screenshotDir}/iter-final-debug.png` });
    console.log(`Screenshot saved to ${screenshotDir}/iter-final-debug.png`);

    await browser.close();
}

captureDebugScreenshot().catch(console.error);
