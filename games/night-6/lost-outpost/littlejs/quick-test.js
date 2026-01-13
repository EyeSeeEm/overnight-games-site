const { chromium } = require('playwright');
const path = require('path');

async function test() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('CONSOLE:', msg.text()));

    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await new Promise(r => setTimeout(r, 2000));

    // Force start
    await page.evaluate(() => window.harness.debug.forceStart());
    await new Promise(r => setTimeout(r, 500));

    // Get initial state
    let state = await page.evaluate(() => window.harness.getState());
    console.log('Initial state:', JSON.stringify(state, null, 2));

    // Try shooting with Space
    console.log('Executing Space key for 500ms...');
    await page.evaluate(
        ({action, duration}) => window.harness.execute(action, duration),
        { action: { keys: ['Space'] }, duration: 500 }
    );

    state = await page.evaluate(() => window.harness.getState());
    console.log('After Space:', JSON.stringify({
        ammo: state.player?.ammo,
        kills: state.kills,
        enemies: state.enemies?.length
    }));

    // Try with movement + space
    console.log('Executing d + Space for 500ms...');
    await page.evaluate(
        ({action, duration}) => window.harness.execute(action, duration),
        { action: { keys: ['d', 'Space'] }, duration: 500 }
    );

    state = await page.evaluate(() => window.harness.getState());
    console.log('After d+Space:', JSON.stringify({
        ammo: state.player?.ammo,
        kills: state.kills,
        playerX: state.player?.x
    }));

    await browser.close();
}

test().catch(console.error);
