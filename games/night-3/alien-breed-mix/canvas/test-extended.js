const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testExtended(iterNum) {
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

  // Play for 60+ seconds with varied input
  const keys = ['w', 'a', 's', 'd'];

  for (let sec = 0; sec < 70; sec++) {
    // Move in different directions
    const moveKey = keys[sec % 4];
    await page.keyboard.down(moveKey);

    // Shoot at enemies
    await page.mouse.move(640 + Math.cos(sec * 0.5) * 300, 360 + Math.sin(sec * 0.5) * 250);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();

    await page.keyboard.up(moveKey);

    // Occasionally reload
    if (sec % 12 === 0) {
      await page.keyboard.press('r');
    }

    // Occasionally switch weapons
    if (sec % 20 === 0) {
      await page.keyboard.press('q');
    }

    // Sprint sometimes
    if (sec % 8 === 0) {
      await page.keyboard.down('Shift');
      await page.keyboard.down('w');
      await page.waitForTimeout(500);
      await page.keyboard.up('w');
      await page.keyboard.up('Shift');
    }

    // Screenshot every 10 seconds
    if (sec % 10 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(sec).padStart(2,'0')}s.png`) });
    }

    await page.waitForTimeout(700);
  }

  // Final screenshot
  await page.screenshot({ path: path.join(screenshotDir, '70s-final.png') });

  await browser.close();
  console.log(`Iteration ${iterNum} complete. Screenshots saved to ${screenshotDir}`);
}

testExtended(process.argv[2] || 10);
