const { chromium } = require('playwright');

async function captureExcitingScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
  await page.waitForTimeout(2000);

  // Start game
  await page.mouse.click(640, 360);
  await page.waitForTimeout(1000);

  // Play actively for a few seconds to get some action
  await page.mouse.move(800, 400);
  await page.mouse.down();

  // Move around shooting
  await page.keyboard.down('d');
  for (let i = 0; i < 30; i++) {
    await page.mouse.move(600 + Math.random() * 300, 300 + Math.random() * 200);
    await page.waitForTimeout(100);
  }
  await page.keyboard.up('d');

  await page.keyboard.down('w');
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(500 + Math.random() * 400, 250 + Math.random() * 250);
    await page.waitForTimeout(100);
  }
  await page.keyboard.up('w');
  await page.mouse.up();

  // Capture the exciting moment
  await page.screenshot({ path: '/workspace/games/night-3/alien-breed-mix/canvas/screenshot.png' });
  console.log('Captured screenshot.png');

  await browser.close();
}

captureExcitingScreenshot().catch(console.error);
