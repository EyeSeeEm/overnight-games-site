const { chromium } = require('playwright');

async function testRoomTransitions() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();

  let errors = [];
  let transitions = 0;

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

  // Start the game
  await page.click('canvas');
  await page.keyboard.press('Space');
  await page.waitForTimeout(2000);

  console.log('=== ROOM TRANSITION TEST ===\n');

  // Get initial room position
  let initialRoom = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));
  console.log(`Starting room: (${initialRoom.x}, ${initialRoom.y})`);

  // Test many room transitions
  for (let attempt = 0; attempt < 50; attempt++) {
    // Find an open door and transition through it
    const result = await page.evaluate(async () => {
      // Clear enemies to open doors (simulate room clear)
      enemies = enemies.filter(e => !e.alive);

      // Find open doors
      const openDoors = doors.filter(d => d.open);
      if (openDoors.length === 0) {
        // Force doors open
        doors.forEach(d => d.open = true);
      }

      // Get current position
      return {
        roomX: currentRoom.x,
        roomY: currentRoom.y,
        openDoors: doors.filter(d => d.open).length,
        playerPos: { x: player.x, y: player.y }
      };
    });

    // Move toward a door
    const directions = ['w', 's', 'a', 'd'];
    const dir = directions[attempt % 4];

    // Move in a direction for a while
    await page.keyboard.down(dir);
    await page.waitForTimeout(600);
    await page.keyboard.up(dir);
    await page.waitForTimeout(100);

    // Check if we transitioned
    const newRoom = await page.evaluate(() => ({ x: currentRoom.x, y: currentRoom.y }));

    if (newRoom.x !== initialRoom.x || newRoom.y !== initialRoom.y) {
      transitions++;
      console.log(`Transition ${transitions}: (${initialRoom.x},${initialRoom.y}) -> (${newRoom.x},${newRoom.y})`);
      initialRoom = newRoom;
    }

    // Check for errors after each movement
    if (errors.length > 0) {
      console.log('ERROR during room transition!');
      await page.screenshot({ path: '/workspace/screenshots/agent-2/room-error.png' });
      break;
    }
  }

  // Also test rapid transitions back and forth
  console.log('\n=== RAPID BACK-FORTH TEST ===');
  for (let i = 0; i < 10; i++) {
    // Force transition through different doors
    await page.evaluate(() => {
      doors.forEach(d => d.open = true);
    });

    // Move through doors rapidly
    for (const dir of ['w', 's', 'a', 'd']) {
      await page.keyboard.down(dir);
      await page.waitForTimeout(400);
      await page.keyboard.up(dir);
      await page.waitForTimeout(50);
    }

    if (errors.length > 0) {
      console.log('ERROR during rapid transition!');
      break;
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Total transitions: ${transitions}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nALL TESTS PASSED - NO ERRORS');
  }

  await page.screenshot({ path: '/workspace/screenshots/agent-2/room-transition-test.png' });
  await browser.close();
  return errors.length === 0;
}

testRoomTransitions().catch(err => console.error('Test script error:', err));
