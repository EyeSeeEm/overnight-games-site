const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testIteration(gamePath, iterNum) {
  const screenshotDir = path.join(gamePath, 'test-runs', `iter-${String(iterNum).padStart(2,'0')}`);
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log(`Loading game from ${gamePath}/index.html`);
  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(screenshotDir, '00s-title.png') });
  console.log('Captured 00s-title.png');

  // Start game
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(screenshotDir, '01s-started.png') });
  console.log('Captured 01s-started.png');

  // Isaac controls: WASD move, IJKL shoot
  for (let phase = 0; phase < 6; phase++) {
    // Move in one direction
    const moveKey = ['w', 'a', 's', 'd'][phase % 4];
    await page.keyboard.down(moveKey);

    // Shoot using IJKL (I=up, J=left, K=down, L=right)
    for (let i = 0; i < 20; i++) {
      const shootKey = ['i', 'j', 'k', 'l'][i % 4];
      await page.keyboard.press(shootKey);
      await page.waitForTimeout(150);
    }

    await page.keyboard.up(moveKey);

    // Try using bomb
    if (phase === 2) {
      await page.keyboard.press('e');
    }

    await page.screenshot({ path: path.join(screenshotDir, `${(phase+1)*5}s.png`) });
    console.log(`Captured ${(phase+1)*5}s.png`);
  }

  await page.screenshot({ path: path.join(screenshotDir, '30s-final.png') });
  console.log('Captured 30s-final.png');

  await browser.close();
  console.log(`Test complete. Screenshots saved to ${screenshotDir}`);
}

const gamePath = '/workspace/games/night-3/binding-of-isaac-clone/canvas';
const iterNum = parseInt(process.argv[2]) || 1;
testIteration(gamePath, iterNum).catch(console.error);
