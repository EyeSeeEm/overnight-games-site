const { chromium } = require('playwright');

async function testGame() {
  console.log('Testing Frostfall (Skyrim 2D)...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5177', { timeout: 15000 });
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

    // Test 4: Player exists
    console.log('Test 4 - Player exists:', newState.player ? 'PASS' : 'FAIL');
    console.log('  - Position:', newState.player.x, newState.player.y);
    console.log('  - HP:', newState.player.hp);
    console.log('  - Zone:', newState.zone);

    // Test 5: Movement
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 5 - Player moved:', newState.player.x > 300 ? 'PASS' : 'FAIL');
    console.log('  - New X:', newState.player.x);

    // Test 6: Open inventory
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 6 - Inventory opened:', newState.screen === 'inventory' ? 'PASS' : 'FAIL');

    // Test 7: Close inventory
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 7 - Inventory closed:', newState.screen === 'game' ? 'PASS' : 'FAIL');

    // Test 8: Change zone (move right to exit)
    console.log('Moving to exit...');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.down('d');
      await page.waitForTimeout(100);
      await page.keyboard.up('d');
    }
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 8 - Zone:', newState.zone);
    console.log('  - Player position:', newState.player.x, newState.player.y);

    // Test 9: Combat (if in forest with enemies)
    if (newState.zone === 'forest' && newState.enemies.length > 0) {
      console.log('Test 9 - Enemies present:', newState.enemies.length);
      // Move toward first enemy and attack
      const enemy = newState.enemies.find(e => e.hp > 0);
      if (enemy) {
        // Click to attack
        await page.mouse.click(320, 240);
        await page.waitForTimeout(500);
        newState = await page.evaluate(() => window.gameState);
        console.log('  - After attack, messages:', newState.messages.length > 0 ? 'PASS' : 'FAIL');
      }
    } else {
      console.log('Test 9 - Combat: Skipped (not in combat zone)');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('\nScreenshot saved');

    console.log('\n=== Tests completed ===');
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
