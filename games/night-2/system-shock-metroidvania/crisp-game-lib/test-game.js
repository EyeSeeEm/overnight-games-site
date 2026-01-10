import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple HTTP server with node_modules support
const server = createServer((req, res) => {
    let file = req.url === '/' ? '/index.html' : req.url;
    try {
        // Handle node_modules paths
        let filePath = join(__dirname, file);
        const content = readFileSync(filePath);
        const ext = file.split('.').pop();
        const types = { html: 'text/html', js: 'application/javascript', css: 'text/css' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        res.end(content);
    } catch (e) {
        console.log('File not found:', file, e.message);
        res.writeHead(404);
        res.end('Not found');
    }
});

async function testGame() {
    console.log('Starting CITADEL test...');

    server.listen(5175);
    console.log('Server started on port 5175');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', err => console.log('Error:', err.message));

    try {
        await page.goto('http://localhost:5175', { timeout: 30000 });
        console.log('Page loaded');

        // Wait for crisp-game-lib to load from CDN
        await page.waitForTimeout(5000);

        // Crisp-game-lib needs a click to start
        await page.mouse.click(400, 300);
        console.log('Clicked to start game');

        // Wait for game to initialize
        await page.waitForTimeout(3000);

        // Check for canvas
        const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
        console.log('Canvas found:', hasCanvas);

        // Check game state
        const hasGameState = await page.evaluate(() => typeof window.gameState !== 'undefined');
        console.log('Game state exists:', hasGameState);

        if (hasGameState) {
            const state = await page.evaluate(() => ({
                player: window.gameState.player ? {
                    hp: window.gameState.player.hp,
                    x: window.gameState.player.x,
                    y: window.gameState.player.y
                } : null,
                abilities: window.gameState.abilities,
                currentRoom: window.gameState.currentRoom,
                gamePhase: window.gameState.gamePhase
            }));
            console.log('Game state:', JSON.stringify(state, null, 2));
        }

        // Take screenshot
        await page.screenshot({ path: join(__dirname, 'test-screenshot.png') });
        console.log('Screenshot saved');

        // Simulate key presses to test movement
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        await page.keyboard.press('KeyZ'); // Jump
        await page.waitForTimeout(500);

        // Take action screenshot
        await page.screenshot({ path: join(__dirname, 'test-action.png') });

        if (hasCanvas && hasGameState) {
            console.log('\n=== TEST PASSED ===');
        } else {
            console.log('\n=== TEST INCOMPLETE ===');
        }

    } catch (err) {
        console.error('Test error:', err.message);
        await page.screenshot({ path: join(__dirname, 'test-error.png') });
    } finally {
        await browser.close();
        server.close();
    }
}

testGame();
