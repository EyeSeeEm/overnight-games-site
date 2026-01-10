const { chromium } = require('playwright');

async function stabilityTest() {
  console.log('60-second stability test for Motherload...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5176', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    console.log('Game started. Running for 60 seconds with random mining...');

    const startTime = Date.now();
    let errors = 0;
    let minerals = 0;
    let maxDepth = 0;

    while (Date.now() - startTime < 60000) {
      const state = await page.evaluate(() => window.gameState);

      if (!state) {
        errors++;
        console.log('Error: game state null');
        continue;
      }

      // Handle different screens
      if (state.screen === 'title') {
        await page.keyboard.press('Enter');
      } else if (state.screen === 'gameover') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
      } else if (state.screen === 'shop') {
        // Buy random upgrade if we have money
        if (state.player.money > 750) {
          await page.keyboard.press(String(Math.floor(Math.random() * 6) + 1));
        }
        await page.keyboard.press('Escape');
      } else if (state.screen === 'game') {
        // Track stats
        const depth = Math.max(0, state.player.y - 2);
        if (depth > maxDepth) maxDepth = depth;
        if (state.player.cargo.length > minerals) minerals = state.player.cargo.length;

        // Random mining behavior
        const action = Math.random();

        if (state.player.fuel < 2 || state.player.hull < 30) {
          // Go back to surface
          await page.keyboard.down('w');
          await page.waitForTimeout(500);
          await page.keyboard.up('w');
        } else if (state.player.y <= 2 && state.player.cargo.length > 0) {
          // At surface with cargo - sell
          // Move to sell building (x=14-16)
          if (state.player.x < 14) {
            await page.keyboard.down('d');
            await page.waitForTimeout(200);
            await page.keyboard.up('d');
          } else if (state.player.x > 16) {
            await page.keyboard.down('a');
            await page.waitForTimeout(200);
            await page.keyboard.up('a');
          } else {
            await page.keyboard.press('e');
          }
        } else if (state.player.y <= 2 && state.player.fuel < state.player.maxFuel * 0.8) {
          // At surface, need fuel
          if (state.player.x < 2) {
            await page.keyboard.down('d');
            await page.waitForTimeout(100);
            await page.keyboard.up('d');
          } else if (state.player.x > 4) {
            await page.keyboard.down('a');
            await page.waitForTimeout(100);
            await page.keyboard.up('a');
          } else {
            await page.keyboard.press('e');
          }
        } else if (action < 0.6) {
          // Drill down
          await page.keyboard.down('s');
          await page.waitForTimeout(300);
          await page.keyboard.up('s');
        } else if (action < 0.8) {
          // Move sideways
          const dir = Math.random() < 0.5 ? 'a' : 'd';
          await page.keyboard.down(dir);
          await page.waitForTimeout(200);
          await page.keyboard.up(dir);
        } else {
          // Move up
          await page.keyboard.down('w');
          await page.waitForTimeout(200);
          await page.keyboard.up('w');
        }
      }

      await page.waitForTimeout(100);
    }

    // Final state
    const finalState = await page.evaluate(() => window.gameState);
    await page.screenshot({ path: 'stability-screenshot.png' });

    console.log('\n=== STABILITY TEST COMPLETE ===');
    console.log('Duration: 60 seconds');
    console.log('Errors:', errors);
    console.log('Max depth reached:', Math.floor(maxDepth * 32), 'ft');
    console.log('Max cargo at once:', minerals);
    console.log('Final screen:', finalState?.screen);
    console.log('Final money:', finalState?.player?.money);
    console.log('Final stats - Max depth:', finalState?.stats?.maxDepth * 32, 'ft');
    console.log('Final stats - Total earned:', finalState?.stats?.earned);

    return errors === 0;
  } catch (err) {
    console.error('Stability test error:', err.message);
    await page.screenshot({ path: 'stability-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

stabilityTest().then(pass => {
  console.log(pass ? '\nSTABILITY TEST PASSED' : '\nSTABILITY TEST FAILED');
  process.exit(pass ? 0 : 1);
});
