const { chromium } = require('playwright');
const fs = require('fs');

async function test() {
    const dir = '/workspace/screenshots/agent-1/isaac-canvas';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 960, height: 720 });

    console.log('Loading game...');
    await page.goto('file:///workspace/games/night-3/binding-of-isaac-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    // Start game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Enable debug
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(200);

    await page.screenshot({ path: `${dir}/iter-01-start.png` });
    console.log('Starting room');

    // Move and shoot
    for (let i = 0; i < 50; i++) {
        const moveKey = ['w', 'a', 's', 'd'][i % 4];
        await page.keyboard.down(moveKey);
        
        // Shoot in direction of movement
        const shootKey = ['i', 'k', 'j', 'l'][i % 4];
        await page.keyboard.press(shootKey);
        
        await page.waitForTimeout(80);
        await page.keyboard.up(moveKey);
    }

    await page.screenshot({ path: `${dir}/iter-02-combat.png` });
    console.log('Combat test done');

    await browser.close();
}

test().catch(console.error);
