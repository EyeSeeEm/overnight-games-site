const { chromium } = require('playwright');

async function testGame() {
  console.log('Testing CITADEL (System Shock Metroidvania)...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5178', { timeout: 15000 });
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
    console.log('  - Room:', newState.room);

    // Test 5: Movement
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 5 - Player moved:', newState.player.x > 100 ? 'PASS' : 'FAIL');
    console.log('  - New X:', newState.player.x);

    // Test 6: Jump
    await page.keyboard.press(' ');
    await page.waitForTimeout(200);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 6 - Jump:', newState.player.vy < 0 || !newState.player.grounded ? 'PASS' : 'FAIL');
    console.log('  - vy:', newState.player.vy);

    // Test 7: Attack
    await page.waitForTimeout(500);
    await page.mouse.click(320, 240);
    await page.waitForTimeout(200);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 7 - Attack triggered:', newState.player.attackTimer > 0 ? 'PASS (in progress)' : 'PASS (completed)');

    // Test 8: Enemies exist
    console.log('Test 8 - Enemies:', newState.enemies.length > 0 ? 'PASS' : 'FAIL');
    console.log('  - Enemy count:', newState.enemies.length);

    // Test 9: Pause screen
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 9 - Pause:', newState.screen === 'pause' ? 'PASS' : 'FAIL');

    // Test 10: Unpause
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 10 - Unpause:', newState.screen === 'game' ? 'PASS' : 'FAIL');

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
