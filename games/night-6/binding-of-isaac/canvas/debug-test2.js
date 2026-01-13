// Debug test 2 - check room connections
const { chromium } = require('playwright');

const GAME_PATH = `file://${__dirname}/index.html`;

async function debugTest() {
    console.log('Starting debug test 2...');

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

    // Check floor structure
    const floorInfo = await page.evaluate(() => {
        const rooms = [];
        for (const [key, room] of currentFloor.rooms) {
            rooms.push({
                key,
                gridX: room.gridX,
                gridY: room.gridY,
                type: room.type,
                doors: room.doors
            });
        }
        return {
            roomCount: currentFloor.rooms.size,
            rooms,
            startRoom: currentFloor.startRoom ? { x: currentFloor.startRoom.gridX, y: currentFloor.startRoom.gridY } : null
        };
    });

    console.log('Floor structure:', JSON.stringify(floorInfo, null, 2));

    // Get current room state
    let state = await page.evaluate(() => window.harness.getState());
    console.log('\nCurrent room:', state.room.gridX, state.room.gridY);
    console.log('Doors:', state.room.doors);

    // Check if room to the north exists
    const northRoomKey = `${state.room.gridX},${state.room.gridY - 1}`;
    console.log('Looking for north room:', northRoomKey);
    const hasNorthRoom = floorInfo.rooms.some(r => r.key === northRoomKey);
    console.log('North room exists:', hasNorthRoom);

    // Try direct transition
    console.log('\nTrying direct transition to north...');
    await page.evaluate(() => {
        if (currentRoom.doors.north) {
            console.log('Calling transitionToRoom north');
            transitionToRoom('north');
        } else {
            console.log('No north door');
        }
    });
    await page.waitForTimeout(200);

    state = await page.evaluate(() => window.harness.getState());
    console.log('After transition - room:', state.room.gridX, state.room.gridY);

    await browser.close();
    console.log('\nDebug test 2 complete');
}

debugTest().catch(console.error);
