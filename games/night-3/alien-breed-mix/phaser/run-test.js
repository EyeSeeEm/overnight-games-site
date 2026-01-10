const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testIteration(gamePath, iterNum) {
  // Central screenshot location
  const screenshotDir = `/workspace/screenshots/agent-1/alien-breed-mix-phaser/iter-${String(iterNum).padStart(3,'0')}`;
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(screenshotDir, '00s.png') });
  await page.mouse.click(640, 360);
  await page.waitForTimeout(1000);

  const moveKeys = ['w', 'a', 's', 'd'];

  for (let sec = 0; sec < 60; sec += 5) {
    const moveKey = moveKeys[(sec/5) % 4];
    const targetX = 400 + Math.random() * 400;
    const targetY = 200 + Math.random() * 350;

    await page.mouse.move(targetX, targetY);
    await page.mouse.down();
    await page.keyboard.down(moveKey);

    for (let i = 0; i < 25; i++) {
      await page.mouse.move(targetX + (Math.random() - 0.5) * 200, targetY + (Math.random() - 0.5) * 200);
      await page.waitForTimeout(200);
    }

    await page.keyboard.up(moveKey);
    await page.mouse.up();

    if (sec % 10 === 0) await page.keyboard.press('q');
    if (sec % 15 === 0) await page.keyboard.press('r');
    if (sec % 20 === 0) await page.keyboard.press('e');

    await page.screenshot({ path: path.join(screenshotDir, `${sec+5}s.png`) });
  }

  await page.screenshot({ path: path.join(screenshotDir, '60s-final.png') });
  await browser.close();
  console.log(`Iteration ${iterNum} complete: ${screenshotDir}`);
}

const gamePath = '/workspace/games/night-3/alien-breed-mix/phaser';
const iterNum = parseInt(process.argv[2]) || 1;
testIteration(gamePath, iterNum).catch(console.error);
