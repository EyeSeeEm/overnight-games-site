const { chromium } = require('playwright');

async function stabilityTest() {
  console.log('60-second stability test for Station Breach...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5174', { timeout: 15000 });
    await page.waitForTimeout(2000);

    console.log('Game loaded. Running for 60 seconds with random inputs...');

    const startTime = Date.now();
    let errors = 0;

    while (Date.now() - startTime < 60000) {
      // Random movement
      const actions = ['w', 'a', 's', 'd'];
      const key = actions[Math.floor(Math.random() * actions.length)];

      await page.keyboard.down(key);
      await page.waitForTimeout(100 + Math.random() * 200);
      await page.keyboard.up(key);

      // Random shooting
      if (Math.random() < 0.3) {
        await page.mouse.move(100 + Math.random() * 600, 100 + Math.random() * 400);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.up();
      }

      // Check game state
      const state = await page.evaluate(() => window.gameState);
      if (!state || !state.player) {
        errors++;
        console.log('Error: game state invalid');
      }

      // Handle game over
      if (state?.gameOver) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'stability-screenshot.png' });

    const finalState = await page.evaluate(() => window.gameState);
    console.log('\n=== STABILITY TEST COMPLETE ===');
    console.log('Duration: 60 seconds');
    console.log('Errors:', errors);
    console.log('Final wave:', finalState?.wave);
    console.log('Final score:', finalState?.score);

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
