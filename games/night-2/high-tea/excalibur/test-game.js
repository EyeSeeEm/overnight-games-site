import { chromium } from 'playwright';

async function testGame() {
    console.log('Starting Excalibur game test...');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
        console.log('Browser console:', msg.type(), msg.text());
    });

    page.on('pageerror', error => {
        console.log('Page error:', error.message);
    });

    try {
        console.log('Loading game...');
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });

        // Wait longer for Excalibur to boot
        console.log('Waiting for Excalibur...');
        await page.waitForTimeout(5000);

        // Check DOM
        const canvasExists = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return canvas !== null;
        });
        console.log('Canvas exists:', canvasExists);

        // Check if game div has children
        const gameDiv = await page.evaluate(() => {
            const div = document.getElementById('game');
            return div ? div.innerHTML.substring(0, 200) : 'NOT FOUND';
        });
        console.log('Game div content:', gameDiv);

        // Check game state
        const hasGameState = await page.evaluate(() => typeof window.gameState !== 'undefined');
        console.log('Game state exposed:', hasGameState);

        if (hasGameState) {
            const gameState = await page.evaluate(() => window.gameState);
            console.log('State:', JSON.stringify(gameState, null, 2));
        }

        // Take screenshot either way
        await page.screenshot({ path: '/workspace/games/high-tea/excalibur/test-screenshot.png' });
        console.log('Screenshot saved');

        if (canvasExists && hasGameState) {
            console.log('\n=== TEST PASSED ===');
        } else {
            console.log('\n=== TEST STATUS: Canvas or state issue ===');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        await page.screenshot({ path: '/workspace/games/high-tea/excalibur/test-error.png' });
    } finally {
        await browser.close();
    }
}

testGame();
