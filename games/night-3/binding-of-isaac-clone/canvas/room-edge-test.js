const { chromium } = require('playwright');

async function testEdgeCases() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();

  let errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
  await page.waitForTimeout(1000);
  await page.click('canvas');
  await page.keyboard.press('Space');
  await page.waitForTimeout(2000);

  console.log('=== EDGE CASE TESTS ===\n');

  // Test 1: Try to force invalid room transition
  console.log('Test 1: Attempting to access invalid room coordinates...');
  try {
    const result = await page.evaluate(() => {
      // Try to access rooms that might not exist
      try {
        // Save current state
        const savedX = currentRoom.x;
        const savedY = currentRoom.y;

        // Try transitioning to edges of map
        for (let y = 0; y < 9; y++) {
          for (let x = 0; x < 9; x++) {
            const room = floorMap[y] && floorMap[y][x];
            if (room) {
              // Valid room, try to go there
              currentRoom.x = x;
              currentRoom.y = y;
              visitedRooms.add(x + ',' + y);
              generateRoom(room);
            }
          }
        }

        // Restore
        currentRoom.x = savedX;
        currentRoom.y = savedY;
        generateRoom(floorMap[savedY][savedX]);

        return { success: true, message: 'All rooms traversed without error' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    });
    console.log(`  Result: ${result.success ? 'PASS' : 'FAIL'} - ${result.message}`);
    if (!result.success) errors.push(result.message);
  } catch (e) {
    console.log(`  Result: FAIL - ${e.message}`);
    errors.push(e.message);
  }

  // Test 2: Transition during enemy spawn
  console.log('\nTest 2: Transition with enemies spawning...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      // Spawn enemies
      for (let j = 0; j < 5; j++) {
        enemies.push(new Enemy(
          player.x + 100 + Math.random() * 50,
          player.y + Math.random() * 50,
          'fly'
        ));
      }
      // Force door open
      doors.forEach(d => d.open = true);
    });

    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');
    await page.waitForTimeout(100);

    if (errors.length > 0) break;
  }
  console.log(`  Result: ${errors.length === 0 ? 'PASS' : 'FAIL'}`);

  // Test 3: Transition with tears in flight
  console.log('\nTest 3: Transition with tears in flight...');
  for (let i = 0; i < 5; i++) {
    // Shoot many tears
    for (let j = 0; j < 10; j++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(20);
    }

    // Force door open and transition
    await page.evaluate(() => { doors.forEach(d => d.open = true); });
    await page.keyboard.down('s');
    await page.waitForTimeout(500);
    await page.keyboard.up('s');

    if (errors.length > 0) break;
  }
  console.log(`  Result: ${errors.length === 0 ? 'PASS' : 'FAIL'}`);

  // Test 4: Rapid repeated transitions
  console.log('\nTest 4: Rapid repeated transitions (50x)...');
  for (let i = 0; i < 50; i++) {
    await page.evaluate(() => {
      doors.forEach(d => d.open = true);
      // Randomly clear enemies to allow door opening
      enemies = [];
    });

    const dir = ['w', 's', 'a', 'd'][i % 4];
    await page.keyboard.down(dir);
    await page.waitForTimeout(200);
    await page.keyboard.up(dir);

    if (errors.length > 0) break;
  }
  console.log(`  Result: ${errors.length === 0 ? 'PASS' : 'FAIL'}`);

  console.log('\n=== FINAL RESULTS ===');
  if (errors.length === 0) {
    console.log('ALL EDGE CASE TESTS PASSED');
  } else {
    console.log('ERRORS FOUND:');
    errors.forEach(e => console.log('  - ' + e));
  }

  await page.screenshot({ path: '/workspace/screenshots/agent-2/room-edge-test.png' });
  await browser.close();
  return errors.length === 0;
}

testEdgeCases().catch(err => console.error('Test error:', err));
