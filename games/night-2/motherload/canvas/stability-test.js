const { chromium } = require('playwright');

async function stabilityTest() {
  console.log('60-second stability test...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Browser error:', msg.text());
  });

  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });

  try {
    await page.goto('http://localhost:5173', { timeout: 10000 });
    await page.waitForSelector('canvas', { timeout: 5000 });

    console.log('Game loaded. Running for 60 seconds with random inputs...');

    const startTime = Date.now();
    let errors = 0;

    while (Date.now() - startTime < 60000) {
      // Random input simulation
      const actions = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const key = actions[Math.floor(Math.random() * actions.length)];

      await page.keyboard.down(key);
      await page.waitForTimeout(200 + Math.random() * 300);
      await page.keyboard.up(key);

      // Check for game over and restart
      const gameOver = await page.evaluate(() => window.gameState?.gameOver);
      if (gameOver) {
        console.log('Game over detected, restarting...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }

      // Check for errors
      const hasError = await page.evaluate(() => {
        const state = window.gameState;
        return !state || !state.player || state.player.x === undefined;
      });

      if (hasError) {
        errors++;
        console.log('Error detected in game state!');
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'stability-screenshot.png' });

    const finalState = await page.evaluate(() => window.gameState);
    console.log('\n=== STABILITY TEST COMPLETE ===');
    console.log('Duration: 60 seconds');
    console.log('Errors: ' + errors);
    console.log('Final player position:', finalState?.player?.x?.toFixed(2), finalState?.player?.y?.toFixed(2));
    console.log('Final depth record:', finalState?.depthRecord, 'ft');

    return errors === 0;
  } catch (err) {
    console.error('Test error:', err.message);
    return false;
  } finally {
    await browser.close();
  }
}

stabilityTest().then(pass => {
  console.log(pass ? 'STABILITY TEST PASSED' : 'STABILITY TEST FAILED');
  process.exit(pass ? 0 : 1);
});
