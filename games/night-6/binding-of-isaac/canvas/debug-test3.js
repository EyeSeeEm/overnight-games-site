// Debug test 3 - check floor and transition
const { chromium } = require('playwright');

const GAME_PATH = `file://${__dirname}/index.html`;

async function debugTest() {
    console.log('Starting debug test 3...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.goto(GAME_PATH);
    await page.waitForTimeout(2000);

    // Force start
    await page.evaluate(() => window.harness.debug.forceStart());
    await page.waitForTimeout(500);

    // Get floor info
    const floorInfo = await page.evaluate(() => window.harness.debug.getFloorInfo());
    console.log('Floor info:');
    console.log('Room count:', floorInfo.roomCount);
    for (const room of floorInfo.rooms) {
        console.log(`  ${room.key}: type=${room.type}, doors=${JSON.stringify(room.doors)}`);
    }

    // Get current state
    let state = await page.evaluate(() => window.harness.getState());
    console.log('\nCurrent room:', state.room.gridX, state.room.gridY);
    console.log('Doors:', JSON.stringify(state.room.doors));

    // Try manual transition
    console.log('\nAttempting manual transition to north...');
    await page.evaluate(() => window.harness.debug.transitionRoom('north'));
    await page.waitForTimeout(200);

    state = await page.evaluate(() => window.harness.getState());
    console.log('After transition - room:', state.room.gridX, state.room.gridY);
    console.log('Enemies:', state.enemies.length);

    // If still same room, try east
    if (state.room.gridX === 4 && state.room.gridY === 4) {
        console.log('\nNorth failed, trying east...');
        await page.evaluate(() => window.harness.debug.transitionRoom('east'));
        await page.waitForTimeout(200);
        state = await page.evaluate(() => window.harness.getState());
        console.log('After east transition - room:', state.room.gridX, state.room.gridY);
    }

    await browser.close();
    console.log('\nDebug test 3 complete');
}

debugTest().catch(console.error);
