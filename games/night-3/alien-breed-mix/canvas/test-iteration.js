const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testIteration(iterNum) {
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

  // Take title screen screenshot
  await page.screenshot({ path: path.join(screenshotDir, '00s-title.png') });

  // Click to start game
  await page.click('canvas');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '01s-start.png') });

  const keys = ['w','a','s','d','w','w','d','d','s','a'];

  // Play for 30 seconds with input and screenshots
  for (let sec = 0; sec < 30; sec++) {
    // Random movement
    for (let i = 0; i < 10; i++) {
      const key = keys[(sec * 10 + i) % keys.length];
      await page.keyboard.down(key);
      await page.waitForTimeout(50);
      await page.keyboard.up(key);
    }

    // Shoot at enemies
    await page.mouse.click(800, 400);
    await page.mouse.click(700, 350);
    await page.mouse.click(600, 300);

    // Take screenshot every 2 seconds
    if (sec % 2 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(sec+2).padStart(2,'0')}s.png`) });
    }

    await page.waitForTimeout(500);
  }

  // Final gameplay screenshot
  await page.screenshot({ path: path.join(screenshotDir, '30s-final.png') });

  await browser.close();
  console.log(`Saved screenshots to ${screenshotDir}`);
}

testIteration(process.argv[2] || 1);
