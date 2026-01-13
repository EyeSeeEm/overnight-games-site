// Debug test 4 - transition via correct door
const { chromium } = require('playwright');

const GAME_PATH = `file://${__dirname}/index.html`;

async function debugTest() {
    console.log('Starting debug test 4...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.goto(GAME_PATH);
    await page.waitForTimeout(2000);

    await page.evaluate(() => window.harness.debug.forceStart());
    await page.waitForTimeout(500);

    let state = await page.evaluate(() => window.harness.getState());
    console.log('Start room:', state.room.gridX, state.room.gridY);
    console.log('Doors:', JSON.stringify(state.room.doors));

    // Find available door
    const doors = state.room.doors;
    let targetDir = null;
    if (doors.north) targetDir = 'north';
    else if (doors.south) targetDir = 'south';
    else if (doors.east) targetDir = 'east';
    else if (doors.west) targetDir = 'west';

    console.log('\nTarget door:', targetDir);

    if (targetDir) {
        // Move toward door via movement
        const moveKey = { north: 'w', south: 's', east: 'd', west: 'a' }[targetDir];
        console.log(`Moving ${targetDir} using key "${moveKey}"...`);

        for (let i = 0; i < 40; i++) {
            await page.evaluate(
                ({ action, duration }) => window.harness.execute(action, duration),
                { action: { keys: [moveKey] }, duration: 200 }
            );

            state = await page.evaluate(() => window.harness.getState());
            const roomChanged = state.room.gridX !== 4 || state.room.gridY !== 4;

            if (roomChanged) {
                console.log(`Step ${i}: ROOM CHANGED! New room: ${state.room.gridX},${state.room.gridY}`);
                console.log('Enemies in new room:', state.enemies.length);
                break;
            }

            if (i % 10 === 0) {
                console.log(`Step ${i}: player=(${state.player.x.toFixed(0)}, ${state.player.y.toFixed(0)})`);
            }
        }
    }

    await page.screenshot({ path: 'debug-screenshot4.png' });
    console.log('\nScreenshot saved');

    await browser.close();
    console.log('Debug test 4 complete');
}

debugTest().catch(console.error);
