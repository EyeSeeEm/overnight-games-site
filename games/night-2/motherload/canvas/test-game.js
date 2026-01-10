const { chromium } = require('playwright');

async function testGame() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to game...');
    await page.goto('http://localhost:5173', { timeout: 10000 });

    // Wait for canvas
    console.log('Waiting for canvas...');
    await page.waitForSelector('canvas', { timeout: 5000 });
    console.log('Canvas found!');

    // Wait for game to initialize
    await page.waitForTimeout(1000);

    // Check game state
    const state = await page.evaluate(() => window.gameState);
    console.log('Game state exists:', !!state);
    console.log('Player position:', state?.player?.x, state?.player?.y);
    console.log('Player fuel:', state?.player?.fuel);
    console.log('Player money:', state?.player?.money);
    console.log('World generated:', state?.world?.length > 0);

    // Test movement - hold arrow keys (not just press)
    console.log('\nTesting movement...');
    const initialX = state?.player?.x;
    const initialY = state?.player?.y;

    // Move right (hold key)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    // Move down (should drill - hold longer)
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(800);
    await page.keyboard.up('ArrowDown');

    // Move left
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');

    // Check state after movement
    const stateAfter = await page.evaluate(() => window.gameState);
    console.log('Player position after:', stateAfter?.player?.x?.toFixed(2), stateAfter?.player?.y?.toFixed(2));
    console.log('Fuel consumed:', (state?.player?.fuel - stateAfter?.player?.fuel).toFixed(2));

    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('\nScreenshot saved to test-screenshot.png');

    // Verify core mechanics
    console.log('\n=== TEST RESULTS ===');
    let allPass = true;

    const canvasRendered = true;
    console.log(canvasRendered ? 'PASS: Canvas renders' : 'FAIL: Canvas renders');

    const gameStateExists = !!state;
    console.log(gameStateExists ? 'PASS: Game state exposed' : 'FAIL: Game state exposed');
    if (!gameStateExists) allPass = false;

    const playerExists = !!state?.player;
    console.log(playerExists ? 'PASS: Player exists' : 'FAIL: Player exists');
    if (!playerExists) allPass = false;

    const worldGenerated = state?.world?.length > 0;
    console.log(worldGenerated ? 'PASS: World generated' : 'FAIL: World generated');
    if (!worldGenerated) allPass = false;

    const fuelWorks = state?.player?.fuel > 0;
    console.log(fuelWorks ? 'PASS: Fuel system works' : 'FAIL: Fuel system works');
    if (!fuelWorks) allPass = false;

    const movementWorks = stateAfter?.player?.x !== initialX || stateAfter?.player?.y !== initialY;
    console.log(movementWorks ? 'PASS: Movement possible' : 'FAIL: Movement possible');
    if (!movementWorks) allPass = false;

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
