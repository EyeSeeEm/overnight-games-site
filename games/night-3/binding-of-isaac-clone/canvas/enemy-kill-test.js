const { chromium } = require('playwright');

const ENEMY_TYPES = ['fly', 'redFly', 'gaper', 'frowningGaper', 'spider', 'bigSpider', 'hopper', 'charger', 'leaper', 'bony'];

async function testEnemyKills() {
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

  // Start the game
  await page.click('canvas');
  await page.keyboard.press('Space');
  await page.waitForTimeout(2000);

  // Check if game is started
  const gameStarted = await page.evaluate(() => {
    return typeof player !== 'undefined' && player !== null;
  });
  console.log('Game started:', gameStarted);

  if (!gameStarted) {
    console.log('Game did not start properly');
    await browser.close();
    return false;
  }

  // Test each enemy type
  for (const enemyType of ENEMY_TYPES) {
    console.log(`\n=== Testing ${enemyType} (10 kills) ===`);

    for (let killNum = 0; killNum < 10; killNum++) {
      // Clear existing enemies and spawn a new one
      await page.evaluate((type) => {
        // Remove dead enemies
        enemies = enemies.filter(e => e.alive);
        // Spawn enemy near player
        if (player) {
          const e = new Enemy(player.x + 60, player.y, type);
          e.spawnAnim = 0; // Skip spawn animation
          enemies.push(e);
        }
      }, enemyType);

      // Shoot to kill the enemy - many rapid clicks
      for (let shot = 0; shot < 30; shot++) {
        await page.mouse.click(700, 300);
        await page.waitForTimeout(20);
      }

      await page.waitForTimeout(200);

      // Force kill if enemy is still alive
      await page.evaluate(() => {
        enemies.forEach(e => {
          if (e.alive && e.health > 0) {
            e.health = 0;
            e.die();
          }
        });
      });

      await page.waitForTimeout(100);

      console.log(`  Kill ${killNum + 1}/10 - ${enemyType}`);

      // Check for errors after each kill
      if (errors.length > 0) {
        console.log(`ERRORS after killing ${enemyType}:`, errors);
        await page.screenshot({ path: `/workspace/screenshots/agent-2/error-${enemyType}-${killNum}.png` });
        await browser.close();
        return false;
      }
    }
  }

  // Final wait and check
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log('\n=== TOTAL ERRORS FOUND ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\n=== ALL TESTS PASSED - NO ERRORS ===');
  }

  await page.screenshot({ path: '/workspace/screenshots/agent-2/enemy-kill-test.png' });

  await browser.close();
  return errors.length === 0;
}

testEnemyKills().catch(err => console.error('Test script error:', err));
