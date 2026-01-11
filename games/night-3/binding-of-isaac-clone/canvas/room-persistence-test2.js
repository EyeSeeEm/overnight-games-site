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

  // Get start room position
  const startRoom = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`Start room: (${startRoom.x}, ${startRoom.y})`);

  // Force move to a normal room
  console.log('\nStep 1: Transition to adjacent room...');
  const transitioned = await page.evaluate(() => {
    // Find a door that leads to a normal room
    for (const door of doors) {
      const adjX = currentRoom.x + door.direction.x;
      const adjY = currentRoom.y + door.direction.y;
      if (floorMap[adjY] && floorMap[adjY][adjX] && floorMap[adjY][adjX].type === 'normal') {
        // Force transition
        door.open = true;
        transitionRoom(door.direction);
        return { success: true, newRoom: { x: currentRoom.x, y: currentRoom.y } };
      }
    }
    // Try any door
    if (doors.length > 0) {
      doors[0].open = true;
      transitionRoom(doors[0].direction);
      return { success: true, newRoom: { x: currentRoom.x, y: currentRoom.y } };
    }
    return { success: false };
  });

  if (!transitioned.success) {
    console.log('Could not transition to another room');
    await browser.close();
    return false;
  }

  console.log(`  Transitioned to room: (${transitioned.newRoom.x}, ${transitioned.newRoom.y})`);
  await page.waitForTimeout(200);

  // Get initial state of this room
  const initialState = await page.evaluate(() => {
    return {
      room: { x: currentRoom.x, y: currentRoom.y },
      obstacleCount: obstacles.length,
      obstacleTypes: obstacles.map(o => o.type),
      enemyCount: enemies.length,
      cleared: floorMap[currentRoom.y][currentRoom.x].cleared
    };
  });
  console.log(`  Obstacles: ${initialState.obstacleCount} (${initialState.obstacleTypes.join(', ') || 'none'})`);
  console.log(`  Enemies: ${initialState.enemyCount}`);
  console.log(`  Room cleared: ${initialState.cleared}`);

  // Clear the room - kill all enemies and destroy one obstacle
  console.log('\nStep 2: Clear the room...');
  const afterClear = await page.evaluate(() => {
    // Kill all enemies
    enemies.forEach(e => {
      e.health = 0;
      e.die();
    });
    enemies = enemies.filter(e => e.alive);

    // Destroy first destructible obstacle (poop)
    const poop = obstacles.find(o => o.type === 'poop');
    if (poop) {
      const idx = obstacles.indexOf(poop);
      obstacles.splice(idx, 1);
    }

    // Add blood stains from combat
    bloodStains.push({ x: 500, y: 300, size: 20 });
    bloodStains.push({ x: 520, y: 320, size: 15 });

    // Mark room as cleared
    floorMap[currentRoom.y][currentRoom.x].cleared = true;
    doors.forEach(d => d.open = true);

    return {
      obstacleCount: obstacles.length,
      bloodStainCount: bloodStains.length,
      enemyCount: enemies.length
    };
  });
  console.log(`  Obstacles after clearing: ${afterClear.obstacleCount}`);
  console.log(`  Blood stains: ${afterClear.bloodStainCount}`);
  console.log(`  Enemies: ${afterClear.enemyCount}`);

  // Transition back to start
  console.log('\nStep 3: Return to start room...');
  await page.evaluate(() => {
    for (const door of doors) {
      const adjX = currentRoom.x + door.direction.x;
      const adjY = currentRoom.y + door.direction.y;
      if (adjX === 4 && adjY === 4) {
        transitionRoom(door.direction);
        return;
      }
    }
    // Just go back if no direct path
    transitionRoom({ x: -doors[0].direction.x, y: -doors[0].direction.y });
  });
  await page.waitForTimeout(200);

  const backAtStart = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`  Now at: (${backAtStart.x}, ${backAtStart.y})`);

  // Return to the cleared room
  console.log('\nStep 4: Return to the cleared room...');
  await page.evaluate((target) => {
    for (const door of doors) {
      const adjX = currentRoom.x + door.direction.x;
      const adjY = currentRoom.y + door.direction.y;
      if (adjX === target.x && adjY === target.y) {
        door.open = true;
        transitionRoom(door.direction);
        return;
      }
    }
  }, transitioned.newRoom);
  await page.waitForTimeout(200);

  // Verify state is preserved
  const finalState = await page.evaluate(() => ({
    room: { x: currentRoom.x, y: currentRoom.y },
    obstacleCount: obstacles.length,
    bloodStainCount: bloodStains.length,
    enemyCount: enemies.length,
    roomCleared: floorMap[currentRoom.y][currentRoom.x].cleared
  }));

  console.log(`  Back at room: (${finalState.room.x}, ${finalState.room.y})`);
  console.log(`  Obstacles: ${finalState.obstacleCount} (expected: ${afterClear.obstacleCount})`);
  console.log(`  Blood stains: ${finalState.bloodStainCount} (expected: ${afterClear.bloodStainCount})`);
  console.log(`  Enemies: ${finalState.enemyCount} (expected: 0)`);
  console.log(`  Room cleared: ${finalState.roomCleared}`);

  // Verify
  const correctRoom = finalState.room.x === transitioned.newRoom.x && finalState.room.y === transitioned.newRoom.y;
  const obstaclesPersisted = finalState.obstacleCount === afterClear.obstacleCount;
  const bloodPersisted = finalState.bloodStainCount === afterClear.bloodStainCount;
  const noNewEnemies = finalState.enemyCount === 0;

  console.log('\n=== RESULTS ===');
  console.log(`Correct room: ${correctRoom ? 'PASS' : 'FAIL'}`);
  console.log(`Obstacles persisted: ${obstaclesPersisted ? 'PASS' : 'FAIL'}`);
  console.log(`Blood stains persisted: ${bloodPersisted ? 'PASS' : 'FAIL'}`);
  console.log(`Room stayed clear: ${noNewEnemies ? 'PASS' : 'FAIL'}`);
  console.log(`Errors: ${errors.length === 0 ? 'NONE' : errors.join(', ')}`);

  const allPassed = correctRoom && obstaclesPersisted && bloodPersisted && noNewEnemies && errors.length === 0;
  console.log(`\nOVERALL: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  await page.screenshot({ path: '/workspace/screenshots/agent-2/room-persistence-test2.png' });
  await browser.close();
  return allPassed;
}

testRoomPersistence().catch(err => console.error('Test error:', err));
