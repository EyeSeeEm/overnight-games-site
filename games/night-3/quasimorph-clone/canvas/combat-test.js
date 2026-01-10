const { chromium } = require('playwright');
const fs = require('fs');

async function combatTest() {
  console.log('=== QUASIMORPH COMBAT VERIFICATION TEST ===\n');

  const screenshotDir = '/workspace/screenshots/agent-2/quasimorph-combat';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file:///workspace/games/night-3/quasimorph-clone/canvas/index.html');
  await page.waitForTimeout(2000);

  // Click canvas to focus
  await page.click('canvas');
  await page.waitForTimeout(500);

  // Press Space to start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);

  // Enable debug mode
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${screenshotDir}/01-debug-on.png` });
  console.log('Debug mode enabled');

  // Helper to get game state
  const getState = async () => {
    return await page.evaluate(() => ({
      turn, corruption, killCount,
      playerHP: player.hp,
      playerX: player.x,
      playerY: player.y,
      playerAP: player.ap,
      enemies: enemies.map(e => ({ x: e.x, y: e.y, type: e.type, hp: e.hp })),
      visibleEnemies: enemies.filter(e => !fogOfWar[e.y]?.[e.x]).map(e => ({ x: e.x, y: e.y, type: e.type, hp: e.hp })),
      cameraX, cameraY, TILE
    }));
  };

  let state = await getState();
  console.log(`Initial: ${state.enemies.length} total enemies, ${state.visibleEnemies.length} visible`);
  console.log(`Player at (${state.playerX}, ${state.playerY})`);

  // Find nearest enemy
  const findNearestEnemy = (enemies, px, py) => {
    let nearest = null;
    let minDist = Infinity;
    for (const e of enemies) {
      const dist = Math.abs(e.x - px) + Math.abs(e.y - py);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return { enemy: nearest, dist: minDist };
  };

  // Navigate toward enemy
  const moveToward = async (targetX, targetY) => {
    const s = await getState();
    const dx = targetX - s.playerX;
    const dy = targetY - s.playerY;

    if (Math.abs(dx) > Math.abs(dy)) {
      await page.keyboard.press(dx > 0 ? 'd' : 'a');
    } else if (dy !== 0) {
      await page.keyboard.press(dy > 0 ? 's' : 'w');
    }
    await page.waitForTimeout(100);
  };

  // Click on enemy to shoot
  const shootEnemy = async (enemy) => {
    const s = await getState();
    const screenX = (enemy.x * s.TILE) - s.cameraX + (s.TILE / 2);
    const screenY = (enemy.y * s.TILE) - s.cameraY + (s.TILE / 2);
    console.log(`Shooting enemy at screen (${Math.round(screenX)}, ${Math.round(screenY)})`);
    await page.mouse.click(screenX, screenY);
    await page.waitForTimeout(300);
  };

  console.log('\n=== EXPLORING TO FIND ENEMIES ===');

  // Explore for 30 turns to find enemies
  for (let i = 0; i < 50; i++) {
    state = await getState();

    // Check for visible enemies
    if (state.visibleEnemies.length > 0) {
      console.log(`Turn ${state.turn}: Found ${state.visibleEnemies.length} visible enemies!`);

      // Try to shoot the nearest visible enemy
      const { enemy } = findNearestEnemy(state.visibleEnemies, state.playerX, state.playerY);
      if (enemy) {
        console.log(`Target: ${enemy.type} at (${enemy.x}, ${enemy.y}) HP: ${enemy.hp}`);

        // Shoot if we have AP
        if (state.playerAP > 0) {
          await shootEnemy(enemy);
          await page.screenshot({ path: `${screenshotDir}/combat-${i.toString().padStart(2,'0')}.png` });

          // Check if we killed it
          const newState = await getState();
          if (newState.killCount > state.killCount) {
            console.log(`KILL! Total kills: ${newState.killCount}`);
          }
        }
      }
    } else {
      // No visible enemies - explore
      const { enemy } = findNearestEnemy(state.enemies, state.playerX, state.playerY);
      if (enemy) {
        await moveToward(enemy.x, enemy.y);
      } else {
        // Random movement
        const dirs = ['w', 'a', 's', 'd'];
        await page.keyboard.press(dirs[Math.floor(Math.random() * 4)]);
        await page.waitForTimeout(100);
      }
    }

    // End turn if no AP
    state = await getState();
    if (state.playerAP <= 0) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
    }

    // Screenshot every 10 iterations
    if (i % 10 === 0) {
      await page.screenshot({ path: `${screenshotDir}/explore-${i.toString().padStart(2,'0')}.png` });
      console.log(`Turn ${state.turn}: HP=${state.playerHP}, Kills=${state.killCount}, Corruption=${state.corruption}`);
    }
  }

  // Final state
  state = await getState();
  await page.screenshot({ path: `${screenshotDir}/final.png` });

  console.log('\n=== FINAL RESULTS ===');
  console.log(`Turns: ${state.turn}`);
  console.log(`HP: ${state.playerHP}`);
  console.log(`Kills: ${state.killCount}`);
  console.log(`Corruption: ${state.corruption}`);
  console.log(`Remaining enemies: ${state.enemies.length}`);

  console.log('\n=== VERDICT ===');
  if (state.killCount > 0) {
    console.log('COMBAT VERIFIED - Player can kill enemies');
  } else {
    console.log('COMBAT NOT VERIFIED - 0 kills');
  }

  await browser.close();
}

combatTest().catch(console.error);
