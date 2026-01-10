const { chromium } = require('playwright');
const fs = require('fs');

async function testFeatures() {
    const screenshotDir = './screenshots/feature-test';
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

    // Start game
    await page.click('canvas');
    await page.waitForTimeout(500);

    // Enable debug mode
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    await page.screenshot({ path: `${screenshotDir}/00-start.png` });

    // TEST: Weapon Switching (Q key)
    console.log('\nTEST: Weapon Switching');
    console.log('TRIED: Press Q to switch weapons');

    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/01-weapon-switch.png` });

    await page.keyboard.press('q');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/02-weapon-switch-2.png` });

    // Explore map to find features
    console.log('\nExploring map to find terminals, doors, and pickups...');

    async function exploreAndShoot(duration, label) {
        const start = Date.now();
        let frame = 0;
        while (Date.now() - start < duration) {
            const dir = ['w', 'a', 's', 'd'][frame % 4];
            await page.keyboard.down(dir);

            // Sweep aim and shoot
            await page.mouse.down();
            const angle = (frame / 10) * Math.PI * 2;
            await page.mouse.move(640 + Math.cos(angle) * 200, 360 + Math.sin(angle) * 200);
            await page.waitForTimeout(50);
            await page.mouse.up();

            await page.keyboard.up(dir);

            // Capture periodically
            if (frame % 40 === 0 && frame > 0) {
                await page.screenshot({ path: `${screenshotDir}/${label}-${frame}.png` });
            }
            frame++;
        }
    }

    await exploreAndShoot(15000, '03-explore');
    await page.screenshot({ path: `${screenshotDir}/04-after-explore.png` });

    // TEST: Interaction (E key) - try to interact with anything nearby
    console.log('\nTEST: Interaction (E key)');
    console.log('TRIED: Press E to interact with terminals/doors');

    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('e');
        await page.waitForTimeout(200);
    }
    await page.screenshot({ path: `${screenshotDir}/05-after-interact.png` });

    // TEST: Medkit usage (H key)
    console.log('\nTEST: Medkit Usage (H key)');
    await page.keyboard.press('h');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${screenshotDir}/06-medkit.png` });

    // Continue playing to test combat
    console.log('\nExtended combat test...');
    await exploreAndShoot(20000, '07-combat');
    await page.screenshot({ path: `${screenshotDir}/08-final.png` });

    console.log('\n=== FEATURE TEST COMPLETE ===');

    await browser.close();
}

testFeatures().catch(console.error);
