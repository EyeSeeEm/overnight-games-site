const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testMechanics(iterNum) {
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

  // Click to start game
  await page.click('canvas');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, '00-start.png') });

  // Test WASD movement and shooting
  console.log('Testing movement and shooting...');
  for (let i = 0; i < 20; i++) {
    await page.keyboard.down('w');
    await page.mouse.click(800, 400); // Shoot towards right
    await page.waitForTimeout(50);
    await page.keyboard.up('w');
    await page.keyboard.down('d');
    await page.mouse.click(900, 300);
    await page.waitForTimeout(50);
    await page.keyboard.up('d');
  }
  await page.screenshot({ path: path.join(screenshotDir, '05-after-movement.png') });

  // Test reload
  console.log('Testing reload...');
  await page.keyboard.press('r');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(screenshotDir, '06-reloading.png') });
  await page.waitForTimeout(2000); // Wait for reload
  await page.screenshot({ path: path.join(screenshotDir, '07-after-reload.png') });

  // Test combat - move around and shoot
  console.log('Testing combat...');
  for (let sec = 0; sec < 30; sec++) {
    // Move around
    const directions = ['w', 'a', 's', 'd'];
    for (let i = 0; i < 5; i++) {
      const dir = directions[Math.floor(Math.random() * 4)];
      await page.keyboard.down(dir);
      await page.waitForTimeout(100);
      await page.keyboard.up(dir);

      // Shoot rapidly
      await page.mouse.click(640 + Math.random() * 200 - 100, 360 + Math.random() * 200 - 100);
    }

    // Screenshot every 5 seconds
    if (sec % 5 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(sec + 10).padStart(2,'0')}-combat.png`) });
    }
  }

  // Test weapon switch
  console.log('Testing weapon switch...');
  await page.keyboard.press('q');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotDir, '40-weapon-switch.png') });

  // Test sprint
  console.log('Testing sprint...');
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForTimeout(2000);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await page.screenshot({ path: path.join(screenshotDir, '42-after-sprint.png') });

  // Continue playing to try to progress decks
  console.log('Extended play for deck progression...');
  for (let sec = 0; sec < 60; sec++) {
    const dirs = ['w', 'a', 's', 'd'];
    const dir = dirs[sec % 4];
    await page.keyboard.down(dir);
    await page.mouse.click(640 + (Math.random() - 0.5) * 400, 360 + (Math.random() - 0.5) * 300);
    await page.waitForTimeout(100);
    await page.keyboard.up(dir);
    await page.mouse.click(640 + (Math.random() - 0.5) * 400, 360 + (Math.random() - 0.5) * 300);

    if (sec % 10 === 0) {
      await page.screenshot({ path: path.join(screenshotDir, `${String(sec + 50).padStart(3,'0')}-extended.png`) });
    }
  }

  // Final screenshot
  await page.screenshot({ path: path.join(screenshotDir, '999-final.png') });

  await browser.close();
  console.log(`Saved screenshots to ${screenshotDir}`);
}

testMechanics(process.argv[2] || 3);
