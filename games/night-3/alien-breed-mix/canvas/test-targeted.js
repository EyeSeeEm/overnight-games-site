const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testTargeted(iterNum) {
  const gamePath = '/workspace/games/night-3/alien-breed-mix/canvas';
  const screenshotDir = path.join(gamePath, 'test-runs', `iter-${String(iterNum).padStart(2,'0')}`);
  fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Inject kill counter logging
  await page.goto(`file://${gamePath}/index.html`);
  await page.waitForTimeout(2000);

  // Click to start
  await page.click('canvas');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '00-start.png') });

  // Get initial kill count
  const getKills = async () => {
    return await page.evaluate(() => typeof killCount !== 'undefined' ? killCount : 0);
  };

  console.log('Initial kills:', await getKills());

  // Move toward center and shoot
  for (let i = 0; i < 60; i++) {
    // Move in direction of screen center (where enemies likely are)
    await page.keyboard.down('d');
    await page.keyboard.down('s');

    // Hold mouse down and aim in shooting direction
    await page.mouse.move(800 + Math.random() * 200, 400 + Math.random() * 200);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.up();

    await page.keyboard.up('d');
    await page.keyboard.up('s');

    // Check kills periodically
    if (i % 10 === 0) {
      const kills = await getKills();
      console.log(`After ${i}s: ${kills} kills`);
      await page.screenshot({ path: path.join(screenshotDir, `${String(i).padStart(2,'0')}-kills${kills}.png`) });
    }

    // Reload when empty
    if (i % 15 === 0) {
      await page.keyboard.press('r');
      await page.waitForTimeout(1500);
    }
  }

  const finalKills = await getKills();
  console.log(`Final kills: ${finalKills}`);
  await page.screenshot({ path: path.join(screenshotDir, `999-final-kills${finalKills}.png`) });

  await browser.close();
}

testTargeted(process.argv[2] || 5);
