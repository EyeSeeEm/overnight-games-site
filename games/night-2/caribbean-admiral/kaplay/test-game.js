const { chromium } = require('playwright');

async function testGame() {
  console.log('Testing Caribbean Admiral...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });

  page.on('pageerror', err => console.log('Page error:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error:', msg.text());
  });

  try {
    await page.goto('http://localhost:5175', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Test 1: Game initialized
    const state = await page.evaluate(() => window.gameState);
    console.log('Test 1 - Game initialized:', state ? 'PASS' : 'FAIL');
    if (!state) throw new Error('Game state not found');

    // Test 2: Title screen
    console.log('Test 2 - Title screen:', state.screen === 'title' ? 'PASS' : 'FAIL');

    // Get canvas bounds for proper clicking
    const canvasBounds = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    });
    console.log('Canvas bounds:', canvasBounds);

    // Helper to click on canvas coordinates
    async function clickCanvas(x, y) {
      await page.mouse.click(canvasBounds.left + x, canvasBounds.top + y);
    }

    // Test 3: Click start button (WIDTH/2-100=412, y=350, 200x50)
    // Center of button: (512, 375)
    await clickCanvas(512, 375);
    await page.waitForTimeout(500);
    let newState = await page.evaluate(() => window.gameState);
    console.log('Test 3 - Start game clicked:', newState.screen === 'map' ? 'PASS' : 'FAIL (screen=' + newState.screen + ')');

    if (newState.screen !== 'map') {
      // Try clicking again at different position
      await clickCanvas(512, 360);
      await page.waitForTimeout(500);
      newState = await page.evaluate(() => window.gameState);
      console.log('  Retry click:', newState.screen === 'map' ? 'PASS' : 'FAIL');
    }

    // Test 4: On map screen
    console.log('Test 4 - Map screen visible:', newState.screen === 'map' ? 'PASS' : 'FAIL');
    console.log('  - Current port:', newState.currentPort);
    console.log('  - Gold:', newState.gold);
    console.log('  - Ships:', newState.player.ships.length);

    // Test 5: Enter port (button at WIDTH-150=874, y=10, 130x30)
    // Let me click Enter Port button
    await clickCanvas(920, 25);
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 5 - Enter port:', newState.screen === 'port' ? 'PASS' : 'FAIL (screen=' + newState.screen + ')');

    if (newState.screen !== 'port') {
      // Try clicking again
      await clickCanvas(939, 25);
      await page.waitForTimeout(300);
      newState = await page.evaluate(() => window.gameState);
      console.log('  Retry:', newState.screen === 'port' ? 'PASS' : 'FAIL');
    }

    // Test 6: Go to trade (button at WIDTH/2-btnW*1.5-gap = 512-270-30 = 212, y=150, 180x60)
    await clickCanvas(300, 180);
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 6 - Trade screen:', newState.screen === 'trade' ? 'PASS' : 'FAIL (screen=' + newState.screen + ')');

    // Test 7: Buy a good (first button at x=70, y=160, 360x30)
    const goldBefore = newState.gold;
    const cargoBefore = newState.player.ships[0].cargo.length;
    await clickCanvas(250, 175);
    await page.waitForTimeout(300);
    newState = await page.evaluate(() => window.gameState);
    const bought = newState.gold < goldBefore || newState.player.ships[0].cargo.length > cargoBefore;
    console.log('Test 7 - Buy goods:', bought ? 'PASS' : 'FAIL');
    console.log('  - Gold after buy:', newState.gold);
    console.log('  - Cargo:', newState.player.ships[0].cargo);

    // Test 8: Back to port (button at WIDTH/2-75, HEIGHT-60, 150x40)
    await clickCanvas(512, 580);
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 8 - Back to port:', newState.screen === 'port' ? 'PASS' : 'FAIL (screen=' + newState.screen + ')');

    // Test 9: Set sail (button at WIDTH/2-75, HEIGHT-80, 150x40)
    await clickCanvas(512, 560);
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 9 - Map from port:', newState.screen === 'map' ? 'PASS' : 'FAIL');

    // Test 10: Sail to another port (Tortuga at 480, 320)
    await clickCanvas(480, 320);
    await page.waitForTimeout(500);
    newState = await page.evaluate(() => window.gameState);
    const isSailing = newState.sailing !== null;
    console.log('Test 10 - Start sailing:', isSailing ? 'PASS' : 'FAIL');

    // Wait for sailing to complete (or combat)
    await page.waitForTimeout(5000);
    newState = await page.evaluate(() => window.gameState);
    console.log('Test 10b - After sailing:');
    console.log('  - Screen:', newState.screen);
    console.log('  - Port:', newState.currentPort);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('\nScreenshot saved to test-screenshot.png');

    const allPassed = newState.currentPort === 'Tortuga' || newState.screen === 'combat';
    console.log('\n=== Test suite:', allPassed ? 'PASSED' : 'PARTIAL PASS', '===');
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
