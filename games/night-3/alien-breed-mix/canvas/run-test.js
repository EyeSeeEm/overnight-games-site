const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testIteration(gamePath, iterNum) {
  // Central screenshot location
  const screenshotDir = `/workspace/screenshots/agent-1/alien-breed-mix-canvas/iter-${String(iterNum).padStart(3,'0')}`;
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(screenshotDir, '00s.png') });

  // Start game
  await page.mouse.click(640, 360);
  await page.waitForTimeout(1000);

  // Combat test - 60+ seconds
  const moveKeys = ['w', 'a', 's', 'd'];

  for (let sec = 0; sec < 60; sec += 5) {
    const moveKey = moveKeys[(sec/5) % 4];

    // Hold mouse and move
    const targetX = 400 + Math.random() * 400;
    const targetY = 200 + Math.random() * 350;
    await page.mouse.move(targetX, targetY);
    await page.mouse.down();
    await page.keyboard.down(moveKey);

    // Shoot while moving for 5 seconds
    for (let i = 0; i < 25; i++) {
      await page.mouse.move(targetX + (Math.random() - 0.5) * 200, targetY + (Math.random() - 0.5) * 200);
      await page.waitForTimeout(200);
    }

    await page.keyboard.up(moveKey);
    await page.mouse.up();

    // Test other controls
    if (sec % 10 === 0) await page.keyboard.press('q'); // switch weapon
    if (sec % 15 === 0) await page.keyboard.press('r'); // reload
    if (sec % 20 === 0) await page.keyboard.press('e'); // interact
    if (sec % 25 === 0) await page.keyboard.press('h'); // use medkit
    if (sec % 30 === 0) await page.keyboard.press('Shift'); // sprint

    await page.screenshot({ path: path.join(screenshotDir, `${sec+5}s.png`) });
  }

  await page.screenshot({ path: path.join(screenshotDir, '60s-final.png') });
  await browser.close();
  console.log(`Iteration ${iterNum} complete: ${screenshotDir}`);
}

const gamePath = '/workspace/games/night-3/alien-breed-mix/canvas';
const iterNum = parseInt(process.argv[2]) || 1;
testIteration(gamePath, iterNum).catch(console.error);
