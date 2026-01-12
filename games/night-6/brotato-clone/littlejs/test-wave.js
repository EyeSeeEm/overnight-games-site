/**
 * Brotato Clone - Wave Progression Test
 * Tests that waves end correctly and transition to shop
 */

const { chromium } = require('playwright');

async function testWaveProgression() {
    console.log('=== Brotato Clone Wave Progression Test ===\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('[Game]', msg.text()));

    try {
        await page.goto('file:///workspace/games/night-6/brotato-clone/littlejs/index.html');
        await page.waitForTimeout(2000);

        // Verify test harness
        const harness = await page.evaluate(() => window.testHarness?.verifyHarness?.());
        console.log('Test harness:', harness?.success ? 'OK' : 'FAILED');

        // Start game
        await page.evaluate(() => {
            window.selectCharacter('wellRounded');
        });
        await page.waitForTimeout(500);

        // Check initial state
        let state = await page.evaluate(() => ({
            gameState: window.getGameState(),
            wave: window.getCurrentWave(),
            waveTimer: window.getWaveTimer(),
            enemies: window.getEnemies().length,
            hp: window.getPlayer()?.hp
        }));
        console.log(`\nInitial: State=${state.gameState}, Wave=${state.wave}, Timer=${state.waveTimer?.toFixed(1)}s, Enemies=${state.enemies}`);

        // Enable god mode for testing
        await page.evaluate(() => window.debugCommands.godMode(true));

        // Test wave 1 - should be 20 seconds
        console.log('\n--- Testing Wave 1 (should be 20 seconds) ---');

        // Check every 5 seconds
        for (let t = 5; t <= 30; t += 5) {
            await page.waitForTimeout(5000);

            state = await page.evaluate(() => ({
                gameState: window.getGameState(),
                wave: window.getCurrentWave(),
                waveTimer: window.getWaveTimer(),
                enemies: window.getEnemies().length,
                hp: window.getPlayer()?.hp,
                level: window.getPlayer()?.level,
                materials: window.getPlayer()?.materials,
                pendingLevelUps: window.pendingLevelUps
            }));

            console.log(`Time ${t}s: State=${state.gameState}, Wave=${state.wave}, Timer=${state.waveTimer?.toFixed(1)}, Enemies=${state.enemies}, HP=${state.hp}, Level=${state.level}, Materials=${state.materials}`);

            // Check if wave ended
            if (state.gameState === 'shop' || state.gameState === 'levelUp') {
                console.log('✓ Wave ended correctly! Transitioned to:', state.gameState);
                break;
            }
        }

        // Take screenshot
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-wave-result.png' });
        console.log('\nScreenshot saved to test-wave-result.png');

        // If we're in shop/levelUp, test completing the transition
        state = await page.evaluate(() => window.getGameState());

        if (state === 'levelUp') {
            console.log('\n--- In Level Up screen, selecting first option ---');
            // Click first upgrade option
            await page.mouse.click(200, 260);
            await page.waitForTimeout(500);

            state = await page.evaluate(() => ({
                gameState: window.getGameState(),
                wave: window.getCurrentWave()
            }));
            console.log(`After level up: State=${state.gameState}`);
        }

        if (state === 'shop' || await page.evaluate(() => window.getGameState()) === 'shop') {
            console.log('\n--- In Shop screen ---');
            await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-shop.png' });
            console.log('Shop screenshot saved');

            // Click Start Wave button (around 400, 475)
            await page.mouse.click(400, 475);
            await page.waitForTimeout(1000);

            state = await page.evaluate(() => ({
                gameState: window.getGameState(),
                wave: window.getCurrentWave()
            }));
            console.log(`After clicking Start Wave: State=${state.gameState}, Wave=${state.wave}`);
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Test error:', error);
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-error.png' });
    } finally {
        await browser.close();
    }
}

testWaveProgression();
