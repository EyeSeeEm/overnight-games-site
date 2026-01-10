const { chromium } = require('playwright');

async function stabilityTest() {
  console.log('60-second stability test for CITADEL...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5178', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    console.log('Game started. Running for 60 seconds with random actions...');

    const startTime = Date.now();
    let errors = 0;
    let kills = 0;
    let roomsVisited = new Set(['medical_start']);

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
      } else if (state.screen === 'pause') {
        await page.keyboard.press('Escape');
      } else if (state.screen === 'game') {
        roomsVisited.add(state.room);

        // Track kills
        const livingEnemies = state.enemies.filter(e => e.hp > 0).length;

        // Random action
        const action = Math.random();

        if (action < 0.3) {
          // Move right
          await page.keyboard.down('d');
          await page.waitForTimeout(200);
          await page.keyboard.up('d');
        } else if (action < 0.5) {
          // Move left
          await page.keyboard.down('a');
          await page.waitForTimeout(200);
          await page.keyboard.up('a');
        } else if (action < 0.7) {
          // Jump
          await page.keyboard.press(' ');
        } else if (action < 0.9) {
          // Attack
          await page.mouse.click(320 + (Math.random() - 0.5) * 200, 240);
        } else {
          // Jump + move (platforming)
          await page.keyboard.down('d');
          await page.keyboard.press(' ');
          await page.waitForTimeout(300);
          await page.keyboard.up('d');
        }

        // Check for kills
        const newState = await page.evaluate(() => window.gameState);
        if (newState && newState.screen === 'game') {
          const newLivingEnemies = newState.enemies.filter(e => e.hp > 0).length;
          if (newLivingEnemies < livingEnemies) {
            kills += (livingEnemies - newLivingEnemies);
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
    console.log('Rooms visited:', [...roomsVisited].join(', '));
    console.log('Final screen:', finalState?.screen);
    console.log('Final room:', finalState?.room);
    console.log('Final HP:', finalState?.player?.hp);
    console.log('Abilities:', JSON.stringify(finalState?.player?.abilities));

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
