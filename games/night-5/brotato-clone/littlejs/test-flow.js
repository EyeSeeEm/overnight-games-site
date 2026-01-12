/**
 * Brotato Clone - Game Flow Test
 * Tests complete game flow using debug commands
 */

const { chromium } = require('playwright');

async function testGameFlow() {
    console.log('=== Brotato Clone Game Flow Test ===\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('wave_') || text.includes('level_') || text.includes('game_')) {
            console.log('[Event]', text);
        }
    });

    try {
        await page.goto('file:///workspace/games/night-6/brotato-clone/littlejs/index.html');
        await page.waitForTimeout(2000);

        // Check character select
        console.log('1. Starting from menu...');
        let state = await page.evaluate(() => window.getGameState());
        console.log(`   State: ${state}`);

        // Select character
        console.log('\n2. Selecting character...');
        await page.evaluate(() => window.selectCharacter('wellRounded'));
        await page.waitForTimeout(500);

        state = await page.evaluate(() => ({
            gameState: window.getGameState(),
            wave: window.getCurrentWave(),
            hp: window.getPlayer()?.hp,
            weapons: window.getPlayer()?.weapons?.length
        }));
        console.log(`   State: ${state.gameState}, Wave: ${state.wave}, HP: ${state.hp}, Weapons: ${state.weapons}`);

        // Force end wave by setting timer to 0
        console.log('\n3. Force ending wave 1...');
        await page.evaluate(() => {
            // Directly trigger endWave through setting the timer
            while (window.getGameState() === 'waveCombat') {
                // Simulate game update
                for (let i = 0; i < 100; i++) {
                    if (window.gameUpdate) window.gameUpdate();
                }
            }
        });
        await page.waitForTimeout(100);

        // Alternatively, let's just directly call endWave or manipulate state
        state = await page.evaluate(() => window.getGameState());
        console.log(`   State after forcing: ${state}`);

        // If still in combat, let's manually trigger the end
        if (state === 'waveCombat') {
            console.log('   Still in combat, using skipToWave to test...');
            await page.evaluate(() => {
                // Give XP to trigger level up
                const player = window.getPlayer();
                if (player) {
                    player.addXp(50); // Should trigger level up
                }
            });
            await page.waitForTimeout(500);

            state = await page.evaluate(() => ({
                gameState: window.getGameState(),
                level: window.getPlayer()?.level,
                pendingLevelUps: window.pendingLevelUps
            }));
            console.log(`   After adding XP: State=${state.gameState}, Level=${state.level}, PendingLevelUps=${state.pendingLevelUps}`);
        }

        // Take screenshot
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-flow-1.png' });

        // Test level up selection
        console.log('\n4. Testing level up/shop flow...');

        // Give materials for shop testing
        await page.evaluate(() => {
            const player = window.getPlayer();
            if (player) player.materials += 500;
        });

        // Skip to end of wave using wave timer manipulation
        await page.evaluate(() => {
            // Access the waveTimer from global scope
            window.testForceEndWave = function() {
                // Find and call endWave
                if (window.endWave && typeof window.endWave === 'function') {
                    window.endWave();
                } else {
                    console.log('endWave not directly accessible');
                }
            };
        });

        // Let's check what functions are available
        const funcs = await page.evaluate(() => {
            return {
                getPlayer: typeof window.getPlayer,
                getGameState: typeof window.getGameState,
                startNextWave: typeof window.startNextWave,
                selectCharacter: typeof window.selectCharacter,
                debugCommands: typeof window.debugCommands,
                clearRoom: window.debugCommands ? typeof window.debugCommands.clearRoom : 'N/A'
            };
        });
        console.log('   Available functions:', funcs);

        // Use skip to wave 2
        console.log('\n5. Skipping to wave 2...');
        await page.evaluate(() => {
            window.debugCommands.godMode(true);
            window.debugCommands.skipToWave(2);
        });
        await page.waitForTimeout(500);

        state = await page.evaluate(() => ({
            gameState: window.getGameState(),
            wave: window.getCurrentWave()
        }));
        console.log(`   After skip: State=${state.gameState}, Wave=${state.wave}`);
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-flow-2.png' });

        // Test multiple wave transitions
        console.log('\n6. Testing wave progression...');
        for (let targetWave = 3; targetWave <= 5; targetWave++) {
            await page.evaluate((w) => window.debugCommands.skipToWave(w), targetWave);
            await page.waitForTimeout(200);

            state = await page.evaluate(() => ({
                gameState: window.getGameState(),
                wave: window.getCurrentWave(),
                enemies: window.getEnemies().length
            }));
            console.log(`   Wave ${targetWave}: State=${state.gameState}, Enemies=${state.enemies}`);
        }

        // Test victory condition
        console.log('\n7. Testing victory (wave 20 -> 21)...');
        await page.evaluate(() => {
            window.debugCommands.skipToWave(20);
        });
        await page.waitForTimeout(500);

        state = await page.evaluate(() => ({
            gameState: window.getGameState(),
            wave: window.getCurrentWave()
        }));
        console.log(`   Wave 20: State=${state.gameState}`);

        // Skip to wave 21 which should trigger victory
        await page.evaluate(() => {
            window.debugCommands.skipToWave(21);
        });
        await page.waitForTimeout(500);

        state = await page.evaluate(() => ({
            gameState: window.getGameState(),
            wave: window.getCurrentWave()
        }));
        console.log(`   After wave 21 attempt: State=${state.gameState}, Wave=${state.wave}`);
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-victory.png' });

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Test error:', error);
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-error.png' });
    } finally {
        await browser.close();
    }
}

testGameFlow();
