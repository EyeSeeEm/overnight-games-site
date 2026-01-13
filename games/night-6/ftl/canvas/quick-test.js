// FTL Clone - Quick Test Script
const { chromium } = require('playwright');
const path = require('path');

const ITERATIONS = 20;
const MAX_STEPS_PER_ITERATION = 100;

async function runTest() {
    console.log('Starting FTL Clone quick test...\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    const gamePath = 'file://' + path.resolve(__dirname, 'index.html');

    await page.goto(gamePath);
    await page.waitForTimeout(2000);

    let totalShipsDestroyed = 0;
    let totalJumps = 0;
    let totalDeaths = 0;
    let maxSector = 0;
    let successfulIterations = 0;

    for (let iter = 0; iter < ITERATIONS; iter++) {
        try {
            console.log('\n=== Iteration ' + (iter + 1) + '/' + ITERATIONS + ' ===');

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(300);

            let shipsThisRun = 0;
            let jumpsThisRun = 0;
            let steps = 0;

            while (steps < MAX_STEPS_PER_ITERATION) {
                const state = await page.evaluate(() => window.harness.getState());
                const phase = await page.evaluate(() => window.harness.getPhase());

                if (phase === 'gameover') {
                    console.log('  Death at sector ' + state.sector);
                    totalDeaths++;
                    break;
                }

                if (phase === 'victory') {
                    console.log('  Victory!');
                    break;
                }

                if (state.gameState === 'sectorMap') {
                    const availableNodes = (state.sectorMap && state.sectorMap.nodes) ?
                        state.sectorMap.nodes.filter(n => n.canJump) : [];

                    if (availableNodes.length > 0 && state.fuel > 0) {
                        let targetNode = availableNodes.find(n => n.type === 'combat') ||
                                        availableNodes.find(n => n.type === 'exit') ||
                                        availableNodes[0];

                        await page.evaluate(
                            (nodeIndex) => window.harness.execute({ jump: { nodeIndex: nodeIndex } }, 200),
                            targetNode.index
                        );
                        jumpsThisRun++;
                        totalJumps++;
                    } else {
                        await page.waitForTimeout(100);
                    }
                } else if (state.gameState === 'combat') {
                    if (state.combatPaused) {
                        await page.evaluate(() => window.harness.execute({ togglePause: true }, 50));
                    }

                    if (state.selectedWeapon === null) {
                        await page.evaluate(() => window.harness.execute({ selectWeapon: 0 }, 50));
                    }

                    const enemyRooms = (state.enemy && state.enemy.rooms) ? state.enemy.rooms : [];
                    let targetRoomIndex = enemyRooms.findIndex(r => r.system === 'shields');
                    if (targetRoomIndex < 0) targetRoomIndex = 0;

                    const weapons = (state.player && state.player.weapons) ? state.player.weapons : [];
                    const selectedIdx = state.selectedWeapon || 0;
                    const weapon = weapons[selectedIdx];

                    if (weapon && weapon.charged) {
                        await page.evaluate(
                            (roomIndex) => window.harness.execute({ targetRoom: roomIndex }, 100),
                            targetRoomIndex
                        );
                    }

                    await page.evaluate(() => window.harness.execute({}, 300));

                    const newState = await page.evaluate(() => window.harness.getState());
                    if (!newState.enemy && state.enemy) {
                        shipsThisRun++;
                        totalShipsDestroyed++;
                        console.log('  Ship destroyed!');
                    }
                } else if (state.gameState === 'store') {
                    await page.evaluate(() => window.harness.execute({ leaveStore: true }, 200));
                }

                steps++;

                if (state.sector > maxSector) {
                    maxSector = state.sector;
                }
            }

            console.log('  Ships: ' + shipsThisRun + ', Jumps: ' + jumpsThisRun + ', Sector: ' + maxSector);
            successfulIterations++;

        } catch (err) {
            console.error('  Error: ' + err.message);
            try {
                await page.reload();
                await page.waitForTimeout(1000);
            } catch (e) {
                break;
            }
        }
    }

    await browser.close();

    console.log('\n========================================');
    console.log('RESULTS');
    console.log('========================================');
    console.log('Ships Destroyed: ' + totalShipsDestroyed);
    console.log('Total Jumps: ' + totalJumps);
    console.log('Deaths: ' + totalDeaths);
    console.log('Max Sector: ' + maxSector);
    console.log('Iterations: ' + successfulIterations + '/' + ITERATIONS);
    console.log('========================================');
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
