const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testGame() {
    const screenshotDir = './screenshots/expectation-test';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/alien-breed-mix/canvas/index.html');
    await page.waitForTimeout(2000);

    // Screenshot 0: Title screen
    await page.screenshot({ path: `${screenshotDir}/00-title.png` });
    console.log('Captured: Title screen');

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Enable debug mode
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    // Screenshot 1: Game started with debug
    await page.screenshot({ path: `${screenshotDir}/01-start-debug.png` });
    console.log('Captured: Game start with debug overlay');

    console.log('\n=== CORE MECHANICS TEST ===\n');

    // TEST 1: Movement
    console.log('TEST 1: Player Movement');
    console.log('TRIED: Move player using WASD keys');
    console.log('EXPECTED: Player position changes in debug overlay');

    // Move in each direction
    await page.keyboard.down('w');
    await page.waitForTimeout(500);
    await page.keyboard.up('w');
    await page.screenshot({ path: `${screenshotDir}/02-move-up.png` });

    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    await page.screenshot({ path: `${screenshotDir}/03-move-right.png` });

    await page.keyboard.down('s');
    await page.waitForTimeout(500);
    await page.keyboard.up('s');
    await page.screenshot({ path: `${screenshotDir}/04-move-down.png` });

    await page.keyboard.down('a');
    await page.waitForTimeout(500);
    await page.keyboard.up('a');
    await page.screenshot({ path: `${screenshotDir}/05-move-left.png` });

    console.log('Movement frames captured (02-05)');

    // TEST 2: Sprint
    console.log('\nTEST 2: Sprint');
    console.log('TRIED: Hold Shift while moving');
    console.log('EXPECTED: Stamina decreases in debug overlay');

    await page.keyboard.down('Shift');
    await page.keyboard.down('w');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/06-sprint.png` });
    await page.keyboard.up('w');
    await page.keyboard.up('Shift');
    console.log('Sprint frame captured (06)');

    // TEST 3: Shooting
    console.log('\nTEST 3: Shooting');
    console.log('TRIED: Click to shoot');
    console.log('EXPECTED: Bullets counter increases, muzzle flash visible');

    // Click to shoot multiple times
    for (let i = 0; i < 5; i++) {
        await page.mouse.click(800, 360);
        await page.waitForTimeout(100);
    }
    await page.screenshot({ path: `${screenshotDir}/07-shooting.png` });
    console.log('Shooting frame captured (07)');

    // TEST 4: Reload
    console.log('\nTEST 4: Reload');
    console.log('TRIED: Press R to reload');
    console.log('EXPECTED: Reload indicator appears');

    await page.keyboard.press('r');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${screenshotDir}/08-reload.png` });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${screenshotDir}/09-reload-done.png` });
    console.log('Reload frames captured (08-09)');

    // TEST 5: Explore and find enemies
    console.log('\nTEST 5: Find Enemies');
    console.log('TRIED: Explore the map');
    console.log('EXPECTED: Enemies visible on screen, enemy count > 0 in debug');

    // Explore for 10 seconds
    const directions = ['w', 'd', 's', 'a'];
    for (let i = 0; i < 20; i++) {
        const dir = directions[i % 4];
        await page.keyboard.down(dir);
        await page.waitForTimeout(250);
        await page.keyboard.up(dir);
        // Shoot while moving
        await page.mouse.click(640 + (Math.random() * 200 - 100), 360 + (Math.random() * 200 - 100));
        if (i % 5 === 0) {
            await page.screenshot({ path: `${screenshotDir}/10-explore-${i}.png` });
        }
    }
    await page.screenshot({ path: `${screenshotDir}/11-after-explore.png` });
    console.log('Exploration frames captured (10-X, 11)');

    // TEST 6: Combat - try to kill enemies
    console.log('\nTEST 6: Combat');
    console.log('TRIED: Shoot at enemies');
    console.log('EXPECTED: Kill count increases, enemy health decreases');

    // Intensive combat test - move and shoot
    for (let i = 0; i < 30; i++) {
        // Move toward center/enemies
        const moveKey = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
        await page.keyboard.down(moveKey);

        // Shoot in random direction
        await page.mouse.click(640 + Math.cos(i * 0.5) * 300, 360 + Math.sin(i * 0.5) * 200);
        await page.waitForTimeout(100);
        await page.keyboard.up(moveKey);

        if (i % 10 === 0) {
            await page.screenshot({ path: `${screenshotDir}/12-combat-${i}.png` });
        }
    }
    await page.screenshot({ path: `${screenshotDir}/13-after-combat.png` });
    console.log('Combat frames captured (12-X, 13)');

    // TEST 7: Check game state after 30 seconds of play
    console.log('\nTEST 7: Extended Play');
    console.log('TRIED: Play for 30 more seconds');
    console.log('EXPECTED: Game state changes (kills, health, position)');

    const startTime = Date.now();
    let frameNum = 0;
    while (Date.now() - startTime < 30000) {
        // Random movement
        const moveKey = ['w', 'a', 's', 'd'][Math.floor(Math.random() * 4)];
        await page.keyboard.down(moveKey);
        await page.waitForTimeout(100);

        // Shoot toward center of screen (where enemies likely are)
        await page.mouse.click(640 + (Math.random() * 400 - 200), 360 + (Math.random() * 300 - 150));
        await page.keyboard.up(moveKey);

        // Capture every 5 seconds
        if (frameNum % 50 === 0) {
            await page.screenshot({ path: `${screenshotDir}/14-play-${Math.floor((Date.now() - startTime) / 1000)}s.png` });
        }
        frameNum++;
    }
    await page.screenshot({ path: `${screenshotDir}/15-final.png` });
    console.log('Extended play frames captured');

    console.log('\n=== TEST COMPLETE ===');
    console.log(`Screenshots saved to ${screenshotDir}/`);
    console.log('Review screenshots to verify mechanics');

    await browser.close();
}

testGame().catch(console.error);
