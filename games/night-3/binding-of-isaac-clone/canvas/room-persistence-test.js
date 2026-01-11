const { chromium } = require('playwright');

async function testRoomPersistence() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();

  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
  await page.waitForTimeout(1000);
  await page.click('canvas');
  await page.keyboard.press('Space');
  await page.waitForTimeout(2000);

  console.log('=== ROOM PERSISTENCE TEST ===\n');

  // Move to another room
  console.log('Step 1: Move to adjacent room...');
  await page.evaluate(() => { doors.forEach(d => d.open = true); });
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  await page.waitForTimeout(200);

  const room1 = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`  Now in room: (${room1.x}, ${room1.y})`);

  // Clear enemies and get obstacle count
  const initialState = await page.evaluate(() => {
    enemies = [];
    const obsCount = obstacles.length;
    // Destroy one poop if it exists
    const poop = obstacles.find(o => o.type === 'poop');
    if (poop) {
      const idx = obstacles.indexOf(poop);
      obstacles.splice(idx, 1);
    }
    // Add a blood stain
    bloodStains.push({ x: 500, y: 300, size: 20 });
    return {
      initialObstacles: obsCount,
      afterDestroyObstacles: obstacles.length,
      bloodStains: bloodStains.length
    };
  });
  console.log(`  Initial obstacles: ${initialState.initialObstacles}`);
  console.log(`  After destroying poop: ${initialState.afterDestroyObstacles}`);
  console.log(`  Blood stains added: ${initialState.bloodStains}`);

  // Move back to start room
  console.log('\nStep 2: Return to start room...');
  await page.evaluate(() => { doors.forEach(d => d.open = true); });
  await page.keyboard.down('s');
  await page.waitForTimeout(600);
  await page.keyboard.up('s');
  await page.waitForTimeout(200);

  const room2 = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`  Now in room: (${room2.x}, ${room2.y})`);

  // Return to the first room
  console.log('\nStep 3: Return to cleared room...');
  await page.evaluate(() => { doors.forEach(d => d.open = true); });
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  await page.waitForTimeout(200);

  const room3 = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  const finalState = await page.evaluate(() => ({
    x: currentRoom.x,
    y: currentRoom.y,
    obstacles: obstacles.length,
    bloodStains: bloodStains.length,
    enemies: enemies.length
  }));

  console.log(`  Now in room: (${finalState.x}, ${finalState.y})`);
  console.log(`  Obstacles count: ${finalState.obstacles} (expected: ${initialState.afterDestroyObstacles})`);
  console.log(`  Blood stains: ${finalState.bloodStains} (expected: ${initialState.bloodStains})`);
  console.log(`  Enemies: ${finalState.enemies} (expected: 0 - room should stay cleared)`);

  // Verify persistence
  const obstaclesMatch = finalState.obstacles === initialState.afterDestroyObstacles;
  const bloodStainsMatch = finalState.bloodStains === initialState.bloodStains;
  const noEnemies = finalState.enemies === 0;

  console.log('\n=== RESULTS ===');
  console.log(`Obstacles persisted: ${obstaclesMatch ? 'PASS' : 'FAIL'}`);
  console.log(`Blood stains persisted: ${bloodStainsMatch ? 'PASS' : 'FAIL'}`);
  console.log(`Room stayed cleared: ${noEnemies ? 'PASS' : 'FAIL'}`);
  console.log(`Errors: ${errors.length === 0 ? 'NONE' : errors.join(', ')}`);

  const allPassed = obstaclesMatch && bloodStainsMatch && noEnemies && errors.length === 0;
  console.log(`\nOVERALL: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  await page.screenshot({ path: '/workspace/screenshots/agent-2/room-persistence-test.png' });
  await browser.close();
  return allPassed;
}

testRoomPersistence().catch(err => console.error('Test error:', err));
