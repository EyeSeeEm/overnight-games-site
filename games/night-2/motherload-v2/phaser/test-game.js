import { chromium } from 'playwright';

async function testGame() {
    console.log('Starting Motherload test...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', err => console.log('Error:', err.message));

    try {
        await page.goto('http://localhost:5176', { timeout: 60000, waitUntil: 'networkidle' });
        console.log('Page loaded');

        await page.waitForSelector('canvas', { timeout: 10000 });
        console.log('Canvas found');

        await page.waitForTimeout(2000);

        // Click to start
        await page.mouse.click(400, 350);
        console.log('Clicked START');

        await page.waitForTimeout(2000);

        // Check game state
        const hasState = await page.evaluate(() => typeof window.gameState !== 'undefined');
        console.log('Game state exists:', hasState);

        if (hasState) {
            const state = await page.evaluate(() => window.gameState);
            console.log('State:', JSON.stringify(state, null, 2));
        }

        // Screenshot
        await page.screenshot({ path: 'test-screenshot.png' });
        console.log('Screenshot saved');

        // Test drilling
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-drill.png' });

        if (hasState) {
            console.log('\n=== TEST PASSED ===');
        }

    } catch (err) {
        console.error('Test error:', err.message);
        await page.screenshot({ path: 'test-error.png' });
    } finally {
        await browser.close();
    }
}

testGame();
