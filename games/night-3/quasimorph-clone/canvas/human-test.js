const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME = 'quasimorph-clone-canvas';
const ITERATION = process.argv[2] || '01';
const SCREENSHOT_DIR = `/workspace/screenshots/agent-2/${GAME}/iter-${ITERATION}`;

async function humanPlay() {
  // Create screenshot directory
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('file:///workspace/games/night-3/quasimorph-clone/canvas/index.html');
  await page.waitForTimeout(2000);

  // Click to focus and start game
  await page.click('canvas');
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  const log = [];

  // Human-like gameplay for 60 seconds
  // Turn-based: move, then press Space to end turn
  // Strategy: explore by moving in a direction, shoot enemies (F to fire), check items (E to interact)

  const actions = [
    // Move exploration - try to cover the map systematically
    { keys: ['w', 'w'], desc: 'Move north 2x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['d', 'd', 'd'], desc: 'Move east 3x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['s', 's'], desc: 'Move south 2x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['f'], desc: 'Attempt to fire weapon' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['a', 'a', 'a'], desc: 'Move west 3x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['e'], desc: 'Try to interact/loot' },
    { keys: ['w', 'w', 'w'], desc: 'Move north 3x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['d', 'd'], desc: 'Move east 2x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['f', 'f'], desc: 'Fire twice' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['s', 's', 's', 's'], desc: 'Move south 4x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['g'], desc: 'Throw grenade if available' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['a', 'a', 'a', 'a'], desc: 'Move west 4x' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['w', 'w'], desc: 'Move north' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['d', 'd', 'd', 'd'], desc: 'Explore east corridor' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['e'], desc: 'Try to interact' },
    { keys: ['f'], desc: 'Fire' },
    { keys: ['Space'], desc: 'End turn' },
    { keys: ['s', 's', 's'], desc: 'Move south to explore' },
    { keys: ['Space'], desc: 'End turn' },
  ];

  let screenshotNum = 0;
  const startTime = Date.now();

  // Take initial screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/00s.png` });
  log.push({ time: 0, action: 'Game started', screenshot: '00s.png' });

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    // Execute keys
    for (const key of action.keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }

    await page.waitForTimeout(300);

    // Take screenshot every ~10 seconds
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed >= (screenshotNum + 1) * 10) {
      screenshotNum++;
      const filename = `${screenshotNum * 10}s.png`;
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}` });
      log.push({ time: elapsed, action: action.desc, screenshot: filename });
    }
  }

  // Continue random purposeful exploration until 60 seconds
  while ((Date.now() - startTime) < 60000) {
    // Alternate between movement and ending turns
    const moveDir = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
    const moveCount = 1 + Math.floor(Math.random() * 3);

    for (let m = 0; m < moveCount; m++) {
      await page.keyboard.press(moveDir);
      await page.waitForTimeout(100);
    }

    // Occasionally shoot or interact
    if (Math.random() < 0.3) {
      await page.keyboard.press('f');
      await page.waitForTimeout(100);
    }
    if (Math.random() < 0.2) {
      await page.keyboard.press('e');
      await page.waitForTimeout(100);
    }

    // End turn
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Screenshot every 10 seconds
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (elapsed >= (screenshotNum + 1) * 10 && screenshotNum < 6) {
      screenshotNum++;
      const filename = `${screenshotNum * 10}s.png`;
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${filename}` });
      log.push({ time: elapsed, action: 'Exploration', screenshot: filename });
    }
  }

  // Final screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/60s-final.png` });
  log.push({ time: 60, action: 'Final state', screenshot: '60s-final.png' });

  // Save log
  fs.writeFileSync(`${SCREENSHOT_DIR}/log.json`, JSON.stringify(log, null, 2));

  console.log(`Iteration ${ITERATION} complete. Screenshots saved to ${SCREENSHOT_DIR}`);
  console.log('Actions logged:', log.length);

  await browser.close();
}

humanPlay().catch(console.error);
