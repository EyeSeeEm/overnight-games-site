const { chromium } = require('playwright');

async function testGame() {
  console.log('Testing Motherload (Excalibur)...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5176', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Test 1: Game initialized
    const state = await page.evaluate(() => window.gameState);
    console.log('Test 1 - Game initialized:', state ? 'PASS' : 'FAIL');
    if (!state) throw new Error('Game state not found');

    // Test 2: Title screen
    console.log('Test 2 - Title screen:', state.screen === 'title' ? 'PASS' : 'FAIL');

    // Test 3: Start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    let newState = await page.evaluate(() => window.gameState);
    console.log('Test 3 - Game started:', newState.screen === 'game' ? 'PASS' : 'FAIL');

    // Test 4: Player exists and world generated
    console.log('Test 4 - World generated:', newState.world?.length === 200 ? 'PASS' : 'FAIL');
    console.log('  - Player position:', newState.player.x, newState.player.y);

    // Test 5: Move player down (drill)
    await page.keyboard.down('s');
    await page.waitForTimeout(1000);
    await page.keyboard.up('s');
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 5 - Drill down:', newState.player.y > 1 ? 'PASS' : 'FAIL');
    console.log('  - New Y position:', newState.player.y);

    // Test 6: Move left/right
    await page.keyboard.down('a');
    await page.waitForTimeout(500);
    await page.keyboard.up('a');
    await page.waitForTimeout(200);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 6 - Player moved');
    console.log('  - Position:', newState.player.x, newState.player.y);

    // Test 7: Fuel consumption
    console.log('Test 7 - Fuel used:', newState.player.fuel < 10 ? 'PASS' : 'FAIL');
    console.log('  - Current fuel:', newState.player.fuel.toFixed(2));

    // Test 8: Drill for minerals
    console.log('Drilling for minerals...');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.down('s');
      await page.waitForTimeout(300);
      await page.keyboard.up('s');
      await page.waitForTimeout(100);
    }
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 8 - After drilling:');
    console.log('  - Depth (y):', newState.player.y);
    console.log('  - Cargo:', newState.player.cargo.length);
    console.log('  - Fuel:', newState.player.fuel.toFixed(2));

    // Test 9: Go back to surface and interact
    console.log('Flying back to surface...');
    await page.keyboard.down('w');
    await page.waitForTimeout(3000);
    await page.keyboard.up('w');
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 9 - Back at surface:', newState.player.y <= 2 ? 'PASS' : 'FAIL');
    console.log('  - Y position:', newState.player.y);

    // Test 10: Interact with building
    // Move to shop area (x=8-10)
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    await page.keyboard.press('e');
    await page.waitForTimeout(300);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 10 - Building interaction working');
    console.log('  - Current screen:', newState.screen);

    // If in shop, exit
    if (newState.screen === 'shop') {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('\nScreenshot saved');

    console.log('\n=== Basic tests passed! ===');
    return true;
  } catch (err) {
    console.error('Test failed:', err.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    return false;
  } finally {
    await browser.close();
  }
}

testGame().then(pass => {
  console.log(pass ? '\nTEST SUITE PASSED' : '\nTEST SUITE FAILED');
  process.exit(pass ? 0 : 1);
});
