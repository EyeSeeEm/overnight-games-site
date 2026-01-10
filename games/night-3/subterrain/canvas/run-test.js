const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const gamePath = '/workspace/games/night-3/subterrain/canvas';
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

  await page.screenshot({ path: path.join(screenshotDir, '00s-start.png') });

  const moveKeys = ['w','a','s','d'];

  for (let second = 0; second < 30; second++) {
    // Move around
    const dir = moveKeys[Math.floor(Math.random() * 4)];
    await page.keyboard.press(dir);
    await page.waitForTimeout(50);
    await page.keyboard.press(dir);
    await page.waitForTimeout(50);

    // Try interact (E)
    if (second % 5 === 0) {
      await page.keyboard.press('e');
      await page.waitForTimeout(100);
    }

    // Try using items (1-4)
    if (second % 8 === 0) {
      await page.keyboard.press(String((second / 8) % 4 + 1));
    }

    // Shoot occasionally
    await page.mouse.click(640 + (Math.random() - 0.5) * 200, 360 + (Math.random() - 0.5) * 150);
    await page.waitForTimeout(50);

    if (second % 10 === 0 && second > 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${second}s.png`) });
    }

    await page.waitForTimeout(250);
  }

  await page.screenshot({ path: path.join(screenshotDir, '30s-final.png') });
  await browser.close();
  console.log(`Iteration ${iterNum} complete. Screenshots saved to ${screenshotDir}`);
}

testIteration().catch(console.error);
