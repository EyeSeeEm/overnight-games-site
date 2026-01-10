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

  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(screenshotDir, '00s-title.png') });
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);

  for (let phase = 0; phase < 6; phase++) {
    const moveKey = ['w', 'a', 's', 'd'][phase % 4];
    await page.keyboard.down(moveKey);
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press(['i', 'j', 'k', 'l'][i % 4]);
      await page.waitForTimeout(150);
    }
    await page.keyboard.up(moveKey);
    await page.screenshot({ path: path.join(screenshotDir, `${(phase+1)*5}s.png`) });
  }

  await page.screenshot({ path: path.join(screenshotDir, '30s-final.png') });
  await browser.close();
  console.log(`Test complete: ${screenshotDir}`);
}

testIteration('/workspace/games/night-3/binding-of-isaac-clone/phaser', 1).catch(console.error);
