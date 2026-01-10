const { chromium } = require('playwright');

async function stabilityTest() {
  console.log('60-second stability test for Caribbean Admiral...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });

  page.on('pageerror', err => console.log('Page error:', err.message));

  try {
    await page.goto('http://localhost:5175', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Get canvas bounds
    const canvasBounds = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    });

    async function clickCanvas(x, y) {
      await page.mouse.click(canvasBounds.left + x, canvasBounds.top + y);
    }

    // Start game
    await clickCanvas(512, 375);
    await page.waitForTimeout(500);

    console.log('Game started. Running for 60 seconds with random actions...');

    const startTime = Date.now();
    let errors = 0;
    let trades = 0;
    let combats = 0;

    while (Date.now() - startTime < 60000) {
      const state = await page.evaluate(() => window.gameState);

      if (!state) {
        errors++;
        console.log('Error: game state null');
        continue;
      }

      // Handle different screens
      switch (state.screen) {
        case 'title':
          await clickCanvas(512, 375);
          break;

        case 'map':
          if (state.sailing) {
            // Wait for sailing
            await page.waitForTimeout(500);
          } else {
            // Random action: enter port or sail
            if (Math.random() < 0.3) {
              // Enter port
              await clickCanvas(920, 25);
            } else {
              // Sail to random connected port
              const ports = {
                Nassau: [[150, 420], [480, 320], [320, 150]], // Havana, Tortuga, San Juan
                Havana: [[200, 280], [450, 480]], // Nassau, Port Royal
                'Port Royal': [[150, 420], [750, 400], [480, 320]], // Havana, Kingston, Tortuga
                Kingston: [[450, 480], [850, 200], [480, 320]], // Port Royal, Cartagena, Tortuga
                Tortuga: [[200, 280], [450, 480], [320, 150], [850, 200]], // Nassau, Port Royal, San Juan, Cartagena
                'San Juan': [[200, 280], [480, 320], [850, 200]], // Nassau, Tortuga, Cartagena
                Cartagena: [[750, 400], [480, 320], [320, 150]] // Kingston, Tortuga, San Juan
              };
              const destinations = ports[state.currentPort] || [[480, 320]];
              const dest = destinations[Math.floor(Math.random() * destinations.length)];
              await clickCanvas(dest[0], dest[1]);
            }
          }
          break;

        case 'port':
          // Random action: trade, repair, buy ship, or set sail
          const action = Math.random();
          if (action < 0.4) {
            // Trade
            await clickCanvas(300, 180);
            trades++;
          } else if (action < 0.5) {
            // Repair
            await clickCanvas(512, 180);
          } else if (action < 0.55) {
            // Buy ship
            await clickCanvas(720, 180);
          } else {
            // Set sail
            await clickCanvas(512, 560);
          }
          break;

        case 'trade':
          // Random buy or sell
          if (Math.random() < 0.6 && state.gold > 100) {
            // Buy random good
            const y = 175 + Math.floor(Math.random() * 10) * 40;
            await clickCanvas(250, y);
          } else if (state.player.ships[0].cargo.length > 0) {
            // Sell
            await clickCanvas(780, 175);
          }
          // Sometimes go back
          if (Math.random() < 0.2) {
            await clickCanvas(512, 580);
          }
          break;

        case 'combat':
          combats++;
          // Random combat action
          const combatAction = Math.random();
          if (combatAction < 0.6) {
            // Attack
            await clickCanvas(175, 380);
          } else if (combatAction < 0.8) {
            // Defend
            await clickCanvas(355, 380);
          } else if (combatAction < 0.9 && state.player.powder > 0) {
            // Use powder
            await clickCanvas(550, 380);
          } else {
            // Flee
            await clickCanvas(745, 380);
          }
          break;
      }

      await page.waitForTimeout(200 + Math.random() * 300);
    }

    // Final state
    const finalState = await page.evaluate(() => window.gameState);
    await page.screenshot({ path: 'stability-screenshot.png' });

    console.log('\n=== STABILITY TEST COMPLETE ===');
    console.log('Duration: 60 seconds');
    console.log('Errors:', errors);
    console.log('Trades completed:', trades);
    console.log('Combats encountered:', combats);
    console.log('Final screen:', finalState?.screen);
    console.log('Final port:', finalState?.currentPort);
    console.log('Final gold:', finalState?.gold);
    console.log('Ships:', finalState?.player?.ships?.length);
    console.log('Battles won:', finalState?.stats?.battlesWon);

    return errors === 0;
  } catch (err) {
    console.error('Stability test error:', err.message);
    await page.screenshot({ path: 'stability-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

stabilityTest().then(pass => {
  console.log(pass ? '\nSTABILITY TEST PASSED' : '\nSTABILITY TEST FAILED');
  process.exit(pass ? 0 : 1);
});
