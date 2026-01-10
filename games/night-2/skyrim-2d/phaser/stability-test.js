const { chromium } = require('playwright');

async function stabilityTest() {
  console.log('60-second stability test for Frostfall...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5177', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    console.log('Game started. Running for 60 seconds with random actions...');

    const startTime = Date.now();
    let errors = 0;
    let kills = 0;
    let zonesVisited = new Set(['riverwood']);

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
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
      } else if (state.screen === 'inventory') {
        await page.keyboard.press('Tab');
      } else if (state.screen === 'dialogue') {
        await page.keyboard.press('3'); // Close dialogue
        await page.waitForTimeout(200);
        await page.keyboard.press('Escape');
      } else if (state.screen === 'game') {
        zonesVisited.add(state.zone);

        // Check for dead enemies (track kills)
        const deadCount = state.enemies.filter(e => e.hp <= 0).length;

        // Random action
        const action = Math.random();

        if (state.player.hp < 50) {
          // Use potion
          await page.keyboard.press('1');
        }

        if (action < 0.4) {
          // Move in random direction
          const dir = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
          await page.keyboard.down(dir);
          await page.waitForTimeout(200);
          await page.keyboard.up(dir);
        } else if (action < 0.6) {
          // Sprint
          await page.keyboard.down('Shift');
          const dir = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
          await page.keyboard.down(dir);
          await page.waitForTimeout(300);
          await page.keyboard.up(dir);
          await page.keyboard.up('Shift');
        } else if (action < 0.8) {
          // Attack
          const x = 320 + (Math.random() - 0.5) * 200;
          const y = 240 + (Math.random() - 0.5) * 200;
          await page.mouse.click(x, y);
        } else if (action < 0.9) {
          // Try to interact
          await page.keyboard.press('e');
        } else {
          // Open/close inventory
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          await page.keyboard.press('Tab');
        }

        // Check for kills after action
        const newState = await page.evaluate(() => window.gameState);
        if (newState && newState.screen === 'game') {
          const newDeadCount = newState.enemies.filter(e => e.hp <= 0).length;
          if (newDeadCount > deadCount) {
            kills += (newDeadCount - deadCount);
          }
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
    console.log('Enemies killed:', kills);
    console.log('Zones visited:', [...zonesVisited].join(', '));
    console.log('Final screen:', finalState?.screen);
    console.log('Final zone:', finalState?.zone);
    console.log('Final HP:', finalState?.player?.hp);
    console.log('Final gold:', finalState?.player?.gold);
    console.log('Final level:', finalState?.player?.level);

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
