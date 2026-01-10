import { chromium } from 'playwright';

async function testGame() {
    console.log('Starting CITADEL Canvas test...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', err => console.log('Error:', err.message));

    try {
        await page.goto('http://localhost:5177', { timeout: 60000, waitUntil: 'networkidle' });
        console.log('Page loaded');

        await page.waitForSelector('canvas', { timeout: 10000 });
        console.log('Canvas found');

        await page.waitForTimeout(1000);

        // Take menu screenshot
        await page.screenshot({ path: 'test-menu.png' });
        console.log('Menu screenshot saved');

        // Click START button
        await page.mouse.click(400, 405);
        console.log('Clicked START');

        await page.waitForTimeout(1500);

        // Check game state
        const hasState = await page.evaluate(() => typeof window.gameState !== 'undefined' && window.gameState !== null);
        console.log('Game state exists:', hasState);

        if (hasState) {
            const state = await page.evaluate(() => window.gameState);
            console.log('State:', JSON.stringify(state, null, 2));
        }

        // Take gameplay screenshot
        await page.screenshot({ path: 'test-gameplay.png' });
        console.log('Gameplay screenshot saved');

        // Test movement
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.press('Space'); // Jump
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-move.png' });
        console.log('Movement test done');

        // Test attack
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'test-attack.png' });
        console.log('Attack test done');

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
