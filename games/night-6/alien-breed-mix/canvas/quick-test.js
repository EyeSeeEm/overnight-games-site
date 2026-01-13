// Quick diagnostic test
const { chromium } = require('playwright');
const path = require('path');

async function quickTest() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await page.waitForTimeout(2000);

    // Force start
    await page.evaluate(() => window.harness.debug.forceStart());
    await page.waitForTimeout(500);

    let state = await page.evaluate(() => window.harness.getState());
    console.log('Initial state:');
    console.log('  Player:', state.player ? `HP=${state.player.health}, x=${Math.round(state.player.x)}, y=${Math.round(state.player.y)}` : 'null');
    console.log('  Enemies:', state.enemies?.length || 0);
    console.log('  Pickups:', state.pickups?.length || 0);
    console.log('  Doors:', state.doors?.length || 0);
    console.log('  Phase:', state.gameState);

    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'diagnostic-start.png') });

    // Explore for 20 seconds
    console.log('\nExploring...');
    for (let i = 0; i < 40; i++) {
        // Move in different directions
        const dirs = [['w'], ['d'], ['s'], ['a'], ['w','d'], ['s','d']];
        const dir = dirs[i % dirs.length];

        await page.evaluate(
            ({action, duration}) => window.harness.execute(action, duration),
            { action: { keys: dir }, duration: 500 }
        );

        state = await page.evaluate(() => window.harness.getState());

        if (i % 10 === 0) {
            console.log(`  Step ${i}: x=${Math.round(state.player?.x || 0)}, y=${Math.round(state.player?.y || 0)}, enemies=${state.enemies?.length}, visible=${state.enemies?.filter(e=>e.visible).length}`);
        }

        // Take screenshot at key points
        if (i === 10 || i === 20 || i === 30) {
            await page.screenshot({ path: path.join(__dirname, 'screenshots', `diagnostic-step${i}.png`) });
        }

        // Check for visible enemies and fight
        const visible = state.enemies?.filter(e => e.visible) || [];
        if (visible.length > 0) {
            console.log(`  Found ${visible.length} visible enemies!`);
            // Fight
            for (let j = 0; j < 10; j++) {
                const e = visible[0];
                const screenX = 640 + (e.x - state.camera.x);
                const screenY = 360 + (e.y - state.camera.y);
                await page.evaluate(
                    ({action, duration}) => window.harness.execute(action, duration),
                    { action: { click: { x: screenX, y: screenY } }, duration: 200 }
                );
            }
            await page.screenshot({ path: path.join(__dirname, 'screenshots', `diagnostic-combat.png`) });
        }
    }

    state = await page.evaluate(() => window.harness.getState());
    console.log('\nFinal state:');
    console.log('  Player:', state.player ? `HP=${state.player.health}, x=${Math.round(state.player.x)}, y=${Math.round(state.player.y)}` : 'null');
    console.log('  Enemies total:', state.enemies?.length || 0);
    console.log('  Enemies visible:', state.enemies?.filter(e=>e.visible).length || 0);
    console.log('  Phase:', state.gameState);

    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'diagnostic-end.png') });

    await browser.close();
    console.log('\nDiagnostic complete!');
}

quickTest().catch(console.error);
