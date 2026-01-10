const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyGame() {
  console.log('=== QUASIMORPH CLONE VERIFICATION TEST ===\n');

  const screenshotDir = '/workspace/screenshots/agent-2/quasimorph-canvas';
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

  // Take initial screenshot
  await page.screenshot({ path: `${screenshotDir}/00-initial.png` });
  console.log('Screenshot 00: Initial state');

  // Click canvas to focus
  await page.click('canvas');
  await page.waitForTimeout(500);

  // Press Space to start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${screenshotDir}/01-game-start.png` });
  console.log('Screenshot 01: Game started');

  // Get game state by injecting debug code
  const getState = async () => {
    return await page.evaluate(() => {
      return {
        turn: typeof turn !== 'undefined' ? turn : -1,
        corruption: typeof corruption !== 'undefined' ? corruption : -1,
        playerHP: typeof player !== 'undefined' ? player.hp : -1,
        playerAP: typeof player !== 'undefined' ? player.ap : -1,
        playerX: typeof player !== 'undefined' ? player.x : -1,
        playerY: typeof player !== 'undefined' ? player.y : -1,
        enemyCount: typeof enemies !== 'undefined' ? enemies.length : -1,
        kills: typeof kills !== 'undefined' ? kills : -1,
        floor: typeof floor !== 'undefined' ? floor : -1,
        stance: typeof player !== 'undefined' ? player.stance : 'unknown',
        gameState: typeof gameState !== 'undefined' ? gameState : 'unknown'
      };
    });
  };

  let state = await getState();
  console.log('\n--- Initial Game State ---');
  console.log(JSON.stringify(state, null, 2));

  // EXPECTATIONS
  console.log('\n=== EXPECTATIONS ===');
  console.log('1. EXPECT: Enemies exist in the game (enemyCount > 0)');
  console.log('2. EXPECT: Player can move (WASD keys)');
  console.log('3. EXPECT: Combat works (clicking enemy shoots)');
  console.log('4. EXPECT: Turn system works (turn counter increases)');
  console.log('5. EXPECT: Corruption increases over time');

  // Exploration loop - move to find enemies
  console.log('\n=== EXPLORATION PHASE ===');
  const directions = ['d', 'd', 'd', 's', 's', 's', 'd', 'd', 's', 's'];

  for (let i = 0; i < directions.length; i++) {
    await page.keyboard.press(directions[i]);
    await page.waitForTimeout(200);
  }
  await page.keyboard.press('Space'); // End turn
  await page.waitForTimeout(500);

  state = await getState();
  console.log(`After exploration: Turn ${state.turn}, Corruption ${state.corruption}, Enemies: ${state.enemyCount}`);
  await page.screenshot({ path: `${screenshotDir}/02-exploration.png` });
  console.log('Screenshot 02: After exploration');

  // Continue exploring
  for (let i = 0; i < 10; i++) {
    const keys = ['w', 'a', 's', 'd'];
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
    await page.keyboard.press('Space'); // End turn
    await page.waitForTimeout(300);
  }

  state = await getState();
  console.log(`\nAfter 10 turns: Turn ${state.turn}, HP ${state.playerHP}, Kills ${state.kills}`);
  await page.screenshot({ path: `${screenshotDir}/03-after-10-turns.png` });
  console.log('Screenshot 03: After 10 turns of exploration');

  // More aggressive exploration
  console.log('\n=== AGGRESSIVE EXPLORATION ===');
  for (let i = 0; i < 20; i++) {
    // Move in a direction for multiple steps
    const dir = ['w', 'a', 's', 'd'][i % 4];
    for (let j = 0; j < 3; j++) {
      await page.keyboard.press(dir);
      await page.waitForTimeout(100);
    }
    await page.keyboard.press('Space'); // End turn
    await page.waitForTimeout(200);

    state = await getState();
    if (state.kills > 0) {
      console.log(`COMBAT! Kills: ${state.kills} at turn ${state.turn}`);
    }
    if (state.playerHP < 100) {
      console.log(`DAMAGE TAKEN! HP: ${state.playerHP} at turn ${state.turn}`);
    }
  }

  await page.screenshot({ path: `${screenshotDir}/04-after-30-turns.png` });
  console.log('Screenshot 04: After 30 turns');

  state = await getState();
  console.log('\n--- Final State ---');
  console.log(JSON.stringify(state, null, 2));

  // REALITY CHECK
  console.log('\n=== REALITY CHECK ===');
  console.log(`1. Enemies exist: ${state.enemyCount > 0 ? 'YES (' + state.enemyCount + ')' : 'NO (BROKEN!)'}`);
  console.log(`2. Turn system: ${state.turn > 0 ? 'WORKING (Turn ' + state.turn + ')' : 'BROKEN'}`);
  console.log(`3. Corruption: ${state.corruption > 0 ? 'WORKING (' + state.corruption + ')' : 'BROKEN'}`);
  console.log(`4. Combat: ${state.kills > 0 ? 'VERIFIED (Kills: ' + state.kills + ')' : 'NOT VERIFIED (0 kills)'}`);
  console.log(`5. Damage taken: ${state.playerHP < 100 ? 'YES (HP: ' + state.playerHP + ')' : 'NOT OBSERVED'}`);

  const allWorking = state.enemyCount > 0 && state.turn > 0 && state.corruption > 0;
  console.log(`\n=== VERDICT: ${allWorking ? 'CORE SYSTEMS WORKING' : 'POTENTIAL ISSUES'} ===`);

  await browser.close();
}

verifyGame().catch(console.error);
