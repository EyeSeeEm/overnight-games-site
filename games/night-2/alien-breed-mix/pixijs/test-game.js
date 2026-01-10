const { chromium } = require('playwright');

async function testGame() {
  console.log('Testing Station Breach (alien-breed-mix)...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });

  try {
    console.log('Navigating to game...');
    await page.goto('http://localhost:5174', { timeout: 15000 });

    // Wait longer for PixiJS to initialize
    console.log('Waiting for game initialization...');
    await page.waitForTimeout(3000);

    // Check if canvas exists
    const hasCanvas = await page.evaluate(() => !!document.querySelector('canvas'));
    console.log('Canvas exists:', hasCanvas);

    if (!hasCanvas) {
      console.log('No canvas found - checking for errors...');
      await page.screenshot({ path: 'error-screenshot.png' });
      return false;
    }

    // Check game state
    const state = await page.evaluate(() => window.gameState);
    console.log('Game state exists:', !!state);

    if (!state) {
      console.log('No game state - game may have failed to initialize');
      await page.screenshot({ path: 'error-screenshot.png' });
      return false;
    }

    console.log('Player HP:', state?.player?.hp);
    console.log('Player ammo:', state?.player?.ammo);
    console.log('Enemies count:', state?.enemies?.length);
    console.log('Wave:', state?.wave);

    // Test movement
    console.log('\nTesting movement...');
    const initialX = state?.player?.x || state?.player?.sprite?.x;

    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');

    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');

    // Test shooting
    console.log('Testing shooting...');
    await page.mouse.move(600, 300);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();

    const stateAfter = await page.evaluate(() => window.gameState);
    const afterX = stateAfter?.player?.x || stateAfter?.player?.sprite?.x;
    const afterY = stateAfter?.player?.y || stateAfter?.player?.sprite?.y;
    console.log('Player position after:', afterX?.toFixed(0), afterY?.toFixed(0));
    console.log('Ammo after shooting:', stateAfter?.player?.ammo);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot saved');

    // Verify core mechanics
    console.log('\n=== TEST RESULTS ===');
    let allPass = true;

    const tests = [
      ['Canvas renders', hasCanvas],
      ['Game state exposed', !!state],
      ['Player exists', !!state?.player],
      ['Player has HP', state?.player?.hp > 0],
      ['Enemies spawned', state?.enemies?.length > 0],
      ['Movement works', Math.abs((afterX || 0) - initialX) > 1],
      ['Shooting works', (stateAfter?.player?.ammo || 0) < (state?.player?.ammo || 0)]
    ];

    for (const [name, pass] of tests) {
      console.log(pass ? 'PASS:' : 'FAIL:', name);
      if (!pass) allPass = false;
    }

    console.log('\n' + (allPass ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED'));
    return allPass;
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testGame().then(pass => process.exit(pass ? 0 : 1));
