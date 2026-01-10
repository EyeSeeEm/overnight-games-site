const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testCombat(iterNum) {
  const gamePath = '/workspace/games/night-3/alien-breed-mix/canvas';
  const screenshotDir = path.join(gamePath, 'test-runs', `iter-${String(iterNum).padStart(2,'0')}`);
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

  // Extended combat test - 2 minutes of active gameplay
  console.log('Starting extended combat test...');
  let frameNum = 0;

  for (let sec = 0; sec < 120; sec++) {
    // Move toward enemies and shoot
    const moveKey = ['w', 'a', 's', 'd'][sec % 4];

    // Hold move key
    await page.keyboard.down(moveKey);

    // Shoot in multiple directions (hold mouse down)
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      const targetX = 640 + Math.cos(i * 0.6) * 300;
      const targetY = 360 + Math.sin(i * 0.6) * 250;
      await page.mouse.move(targetX, targetY);
      await page.waitForTimeout(50);
    }
    await page.mouse.up();

    // Release move
    await page.keyboard.up(moveKey);

    // Screenshot every 10 seconds
    if (sec % 10 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(frameNum).padStart(3,'0')}-sec${sec}.png`) });
      frameNum++;
    }

    // Occasional reload
    if (sec % 15 === 0) {
      await page.keyboard.press('r');
    }

    // Occasional weapon switch
    if (sec % 20 === 0) {
      await page.keyboard.press('q');
    }
  }

  // Final screenshot
  await page.screenshot({ path: path.join(screenshotDir, `999-final.png`) });

  await browser.close();
  console.log(`Saved ${frameNum} screenshots to ${screenshotDir}`);
}

testCombat(process.argv[2] || 4);
