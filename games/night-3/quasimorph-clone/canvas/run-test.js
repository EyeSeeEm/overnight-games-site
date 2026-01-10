const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const gamePath = '/workspace/games/night-3/quasimorph-clone/canvas';
const iterNum = process.argv[2] || '01';

async function testIteration() {
  const screenshotDir = path.join(gamePath, 'test-runs', `iter-${iterNum}`);
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(2000);

  // Take initial screenshot (title screen)
  await page.screenshot({ path: path.join(screenshotDir, '00s-title.png') });

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Screenshot after game starts
  await page.screenshot({ path: path.join(screenshotDir, '01s-start.png') });

  // Aggressive exploration and combat - 40 seconds
  const moveKeys = ['w','a','s','d'];
  let frameNum = 0;

  for (let second = 0; second < 40; second++) {
    // Move aggressively
    const dir = moveKeys[Math.floor(Math.random() * 4)];
    await page.keyboard.press(dir);
    await page.waitForTimeout(50);
    await page.keyboard.press(dir);
    await page.waitForTimeout(50);

    // End turn to let corruption build
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Try shooting in various directions
    await page.mouse.click(640 + (Math.random() - 0.5) * 300, 360 + (Math.random() - 0.5) * 200);
    await page.waitForTimeout(50);

    // Change stance occasionally
    if (second % 10 === 0) {
      await page.keyboard.press(String((second / 10) % 3 + 1));
    }

    // Screenshot every 5 seconds
    if (second % 5 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(second).padStart(2, '0')}s.png`) });
    }

    await page.waitForTimeout(300);
  }

  // Final screenshot
  await page.screenshot({ path: path.join(screenshotDir, '40s-final.png') });

  await browser.close();
  console.log(`Iteration ${iterNum} complete. Screenshots saved to ${screenshotDir}`);
}

testIteration().catch(console.error);
