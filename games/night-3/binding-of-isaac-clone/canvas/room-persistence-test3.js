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

  // Step 1: Go north to a normal room
  console.log('Step 1: Go north...');
  await page.evaluate(() => {
    doors.forEach(d => d.open = true);
    const northDoor = doors.find(d => d.direction.y < 0);
    if (northDoor) transitionRoom(northDoor.direction);
  });
  await page.waitForTimeout(300);

  const room1 = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`  Now at: (${room1.x}, ${room1.y})`);

  // Step 2: Get state, clear room, modify obstacles
  console.log('\nStep 2: Clear room and modify state...');
  const beforeMod = await page.evaluate(() => {
    // Kill all enemies
    enemies.forEach(e => {
      e.health = 0;
      e.die();
    });
    enemies = [];

    // Count and potentially destroy an obstacle
    const origCount = obstacles.length;
    const poop = obstacles.find(o => o.type === 'poop');
    if (poop) obstacles.splice(obstacles.indexOf(poop), 1);

    // Add blood stain
    bloodStains.push({ x: 450, y: 280, size: 25 });

    // Mark cleared
    floorMap[currentRoom.y][currentRoom.x].cleared = true;
    doors.forEach(d => d.open = true);

    return {
      originalObstacles: origCount,
      newObstacles: obstacles.length,
      bloodStains: bloodStains.length
    };
  });
  console.log(`  Original obstacles: ${beforeMod.originalObstacles}`);
  console.log(`  After modification: ${beforeMod.newObstacles}`);
  console.log(`  Blood stains: ${beforeMod.bloodStains}`);

  // Step 3: Go back south
  console.log('\nStep 3: Go back south...');
  await page.evaluate(() => {
    const southDoor = doors.find(d => d.direction.y > 0);
    if (southDoor) transitionRoom(southDoor.direction);
  });
  await page.waitForTimeout(300);

  const room2 = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`  Now at: (${room2.x}, ${room2.y})`);

  // Step 4: Go north again
  console.log('\nStep 4: Go north again...');
  await page.evaluate(() => {
    doors.forEach(d => d.open = true);
    const northDoor = doors.find(d => d.direction.y < 0);
    if (northDoor) transitionRoom(northDoor.direction);
  });
  await page.waitForTimeout(300);

  const room3 = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  const afterReturn = await page.evaluate(() => ({
    room: { x: currentRoom.x, y: currentRoom.y },
    obstacles: obstacles.length,
    bloodStains: bloodStains.length,
    enemies: enemies.length
  }));

  console.log(`  Now at: (${afterReturn.room.x}, ${afterReturn.room.y})`);
  console.log(`  Obstacles: ${afterReturn.obstacles} (expected: ${beforeMod.newObstacles})`);
  console.log(`  Blood stains: ${afterReturn.bloodStains} (expected: ${beforeMod.bloodStains})`);
  console.log(`  Enemies: ${afterReturn.enemies} (expected: 0)`);

  // Verify
  const sameRoom = afterReturn.room.x === room1.x && afterReturn.room.y === room1.y;
  const obstaclesPersisted = afterReturn.obstacles === beforeMod.newObstacles;
  const bloodPersisted = afterReturn.bloodStains === beforeMod.bloodStains;
  const noNewEnemies = afterReturn.enemies === 0;

  console.log('\n=== RESULTS ===');
  console.log(`Returned to same room: ${sameRoom ? 'PASS' : 'FAIL'} (${room1.x},${room1.y} -> ${afterReturn.room.x},${afterReturn.room.y})`);
  console.log(`Obstacles persisted: ${obstaclesPersisted ? 'PASS' : 'FAIL'}`);
  console.log(`Blood stains persisted: ${bloodPersisted ? 'PASS' : 'FAIL'}`);
  console.log(`Room stayed clear: ${noNewEnemies ? 'PASS' : 'FAIL'}`);
  console.log(`Errors: ${errors.length === 0 ? 'NONE' : errors.join(', ')}`);

  const allPassed = sameRoom && obstaclesPersisted && bloodPersisted && noNewEnemies && errors.length === 0;
  console.log(`\nOVERALL: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  await page.screenshot({ path: '/workspace/screenshots/agent-2/room-persistence-test3.png' });
  await browser.close();
  return allPassed;
}

testRoomPersistence().catch(err => console.error('Test error:', err));
