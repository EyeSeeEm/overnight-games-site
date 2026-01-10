const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testExplore(iterNum) {
  const gamePath = '/workspace/games/night-3/alien-breed-mix/canvas';
  const screenshotDir = `/workspace/screenshots/agent-1/alien-breed-mix-canvas/iter-${String(iterNum).padStart(3,'0')}`;
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(2000);

  // Click to start
  await page.click('canvas');
  await page.waitForTimeout(500);

  // Explore aggressively - move in one direction for longer to exit rooms
  const directions = [
    { key: 'd', x: 900, y: 360 },  // Move right, shoot right
    { key: 's', x: 640, y: 550 },  // Move down, shoot down
    { key: 'a', x: 400, y: 360 },  // Move left, shoot left
    { key: 'w', x: 640, y: 200 },  // Move up, shoot up
  ];

  let dirIndex = 0;
  for (let sec = 0; sec < 90; sec++) {
    const dir = directions[dirIndex];

    // Hold direction key for longer to traverse rooms
    await page.keyboard.down(dir.key);

    // Continuously shoot in movement direction
    await page.mouse.move(dir.x, dir.y);
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();

    await page.keyboard.up(dir.key);

    // Change direction every 15 seconds to explore more of the map
    if (sec % 15 === 14) {
      dirIndex = (dirIndex + 1) % 4;
    }

    // Reload periodically
    if (sec % 10 === 0) {
      await page.keyboard.press('r');
      await page.waitForTimeout(1500);
    }

    // Screenshot every 15 seconds
    if (sec % 15 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(sec).padStart(2,'0')}s.png`) });
    }

    await page.waitForTimeout(200);
  }

  // Final screenshot
  await page.screenshot({ path: path.join(screenshotDir, '90s-final.png') });

  // Get kill count if possible
  const kills = await page.evaluate(() => {
    return typeof killCount !== 'undefined' ? killCount : 'unknown';
  });
  console.log(`Iteration ${iterNum} complete. Kills: ${kills}`);

  await browser.close();
}

testExplore(process.argv[2] || 11);
