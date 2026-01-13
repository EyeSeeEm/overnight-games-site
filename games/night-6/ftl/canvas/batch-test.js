// FTL Clone - Batch Test Script (200 iterations with JSON logging)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 200;
const STEP_DURATION = 300;

const LOGS_DIR = path.join(__dirname, 'playtest-logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

async function runTest() {
    console.log('Starting FTL Clone batch test...\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    const gamePath = `file://${path.resolve(__dirname, 'index.html')}`;

    await page.goto(gamePath);
    await page.waitForTimeout(2000);

    // Stats tracking
    let totalShipsDestroyed = 0;
    let totalSectorsReached = 0;
    let totalJumps = 0;
    let totalDeaths = 0;
    let maxSector = 0;
    let successfulIterations = 0;

    for (let iter = 0; iter < ITERATIONS; iter++) {
        const iterLog = {
            game: 'ftl',
            iteration: iter + 1,
            started: new Date().toISOString(),
            outcome: null,
            shipsDestroyed: 0,
            jumps: 0,
            sector: 1,
            duration: 0
        };
        const iterStart = Date.now();

        try {
            console.log(`\n=== Iteration ${iter + 1}/${ITERATIONS} ===`);

            // Force start game
            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let shipsThisRun = 0;
            let jumpsThisRun = 0;
            let steps = 0;

            while (steps < MAX_STEPS_PER_ITERATION) {
                const state = await page.evaluate(() => window.harness.getState());
                const phase = await page.evaluate(() => window.harness.getPhase());

                if (phase === 'gameover') {
                    console.log(`  Death at sector ${state.sector}`);
                    totalDeaths++;
                    break;
                }

                if (phase === 'victory') {
                    console.log(`  Victory! Completed all sectors`);
                    totalSectorsReached += 8;
                    maxSector = 8;
                    successfulIterations++;
                    break;
                }

                // Handle different game states
                if (state.gameState === 'sectorMap') {
                    // Find a node to jump to
                    const availableNodes = state.sectorMap?.nodes?.filter(n => n.canJump) || [];

                    if (availableNodes.length > 0 && state.fuel > 0) {
                        // Prefer combat nodes for testing, then exit, then others
                        let targetNode = availableNodes.find(n => n.type === 'combat');
                        if (!targetNode) targetNode = availableNodes.find(n => n.type === 'exit');
                        if (!targetNode) targetNode = availableNodes[0];

                        await page.evaluate(
                            ({ nodeIndex }) => window.harness.execute({ jump: { nodeIndex } }, 300),
                            { nodeIndex: targetNode.index }
                        );
                        jumpsThisRun++;
                        totalJumps++;
                    } else if (state.fuel <= 0) {
                        console.log('  Out of fuel!');
                        break;
                    } else {
                        // No available jumps - wait
                        await page.waitForTimeout(200);
                    }
                } else if (state.gameState === 'combat') {
                    // Combat strategy
                    if (state.combatPaused) {
                        // Unpause
                        await page.evaluate(() => window.harness.execute({ togglePause: true }, 100));
                    }

                    // Select weapon if not selected
                    if (state.selectedWeapon === null) {
                        await page.evaluate(() => window.harness.execute({ selectWeapon: 0 }, 100));
                    }

                    // Fire at enemy shields or weapons
                    const enemyRooms = state.enemy?.rooms || [];
                    const shieldsRoom = enemyRooms.findIndex(r => r.system === 'shields');
                    const weaponsRoom = enemyRooms.findIndex(r => r.system === 'weapons');
                    const targetRoomIndex = shieldsRoom >= 0 ? shieldsRoom : (weaponsRoom >= 0 ? weaponsRoom : 0);

                    // Check if weapon is charged
                    const weapon = state.player?.weapons?.[state.selectedWeapon || 0];
                    if (weapon?.charged) {
                        await page.evaluate(
                            ({ roomIndex }) => window.harness.execute({ targetRoom: roomIndex }, 200),
                            { roomIndex: targetRoomIndex }
                        );
                    }

                    // Let combat run for a bit
                    await page.evaluate(() => window.harness.execute({}, 500));

                    // Check if enemy destroyed
                    const newState = await page.evaluate(() => window.harness.getState());
                    if (!newState.enemy && state.enemy) {
                        shipsThisRun++;
                        totalShipsDestroyed++;
                        console.log(`  Ship destroyed! (${shipsThisRun} this run)`);
                    }
                } else if (state.gameState === 'store') {
                    // Buy fuel if low
                    if (state.fuel < 5) {
                        const fuelItem = state.store?.items?.find(i => i.type === 'fuel' && i.affordable);
                        if (fuelItem) {
                            await page.evaluate(
                                ({ index }) => window.harness.execute({ buyItem: index }, 200),
                                { index: fuelItem.index }
                            );
                        }
                    }

                    // Buy repairs if needed
                    if (state.player?.hull < state.player?.maxHull * 0.5) {
                        const repairItem = state.store?.items?.find(i => i.type === 'repair' && i.affordable);
                        if (repairItem) {
                            await page.evaluate(
                                ({ index }) => window.harness.execute({ buyItem: index }, 200),
                                { index: repairItem.index }
                            );
                        }
                    }

                    // Leave store
                    await page.evaluate(() => window.harness.execute({ leaveStore: true }, 300));
                }

                steps++;

                // Track max sector
                if (state.sector > maxSector) {
                    maxSector = state.sector;
                    totalSectorsReached = Math.max(totalSectorsReached, state.sector);
                }

                // Safety check for stuck state
                if (steps % 50 === 0) {
                    console.log(`  Step ${steps}, Sector ${state.sector}, Ships: ${shipsThisRun}, Jumps: ${jumpsThisRun}`);
                }
            }

            console.log(`  Iteration ${iter + 1} complete: ${shipsThisRun} ships, ${jumpsThisRun} jumps`);
            successfulIterations++;

            // Save iteration log
            const finalState = await page.evaluate(() => window.harness.getState());
            iterLog.shipsDestroyed = shipsThisRun;
            iterLog.jumps = jumpsThisRun;
            iterLog.sector = finalState.sector || 1;
            iterLog.outcome = 'timeout';
            iterLog.duration = Date.now() - iterStart;

            // Reload page periodically to prevent memory issues
            if ((iter + 1) % 25 === 0) {
                console.log(`  Checkpoint ${iter + 1}: Ships=${totalShipsDestroyed}, Jumps=${totalJumps}, Deaths=${totalDeaths}, MaxSector=${maxSector}`);
                console.log('  Reloading page...');
                await page.reload();
                await page.waitForTimeout(2000);
            }

        } catch (err) {
            console.error(`  Error in iteration ${iter + 1}:`, err.message);
            iterLog.outcome = 'error';
            iterLog.duration = Date.now() - iterStart;

            // Try to recover
            try {
                await page.reload();
                await page.waitForTimeout(2000);
            } catch (e) {
                console.error('  Failed to recover, restarting browser...');
                // Save summary before exit
                fs.writeFileSync(
                    path.join(LOGS_DIR, 'summary.json'),
                    JSON.stringify({
                        iterations: iter,
                        totalShipsDestroyed,
                        totalJumps,
                        totalDeaths,
                        maxSector,
                        successfulIterations,
                        completed: new Date().toISOString(),
                        error: 'Browser crashed'
                    }, null, 2)
                );
                await browser.close();
                return {
                    totalShipsDestroyed,
                    totalSectorsReached,
                    totalJumps,
                    totalDeaths,
                    maxSector,
                    successfulIterations,
                    completedIterations: iter
                };
            }
        }

        // Always save iteration log
        fs.writeFileSync(
            path.join(LOGS_DIR, `iter-${String(iter + 1).padStart(3, '0')}.json`),
            JSON.stringify(iterLog, null, 2)
        );
    }

    await browser.close();

    return {
        totalShipsDestroyed,
        totalSectorsReached,
        totalJumps,
        totalDeaths,
        maxSector,
        successfulIterations,
        completedIterations: ITERATIONS
    };
}

// Run test
runTest().then(results => {
    console.log('\n========================================');
    console.log('BATCH TEST RESULTS');
    console.log('========================================');
    console.log(`Total Ships Destroyed: ${results.totalShipsDestroyed}`);
    console.log(`Total Jumps: ${results.totalJumps}`);
    console.log(`Total Deaths: ${results.totalDeaths}`);
    console.log(`Max Sector Reached: ${results.maxSector}`);
    console.log(`Successful Iterations: ${results.successfulIterations}/${results.completedIterations}`);
    console.log(`Average Ships/Iteration: ${(results.totalShipsDestroyed / results.completedIterations).toFixed(2)}`);
    console.log('========================================');

    // Save summary
    fs.writeFileSync(
        path.join(LOGS_DIR, 'summary.json'),
        JSON.stringify({
            iterations: results.completedIterations,
            totalShipsDestroyed: results.totalShipsDestroyed,
            totalJumps: results.totalJumps,
            totalDeaths: results.totalDeaths,
            maxSector: results.maxSector,
            successfulIterations: results.successfulIterations,
            avgShipsPerIter: results.totalShipsDestroyed / results.completedIterations,
            completed: new Date().toISOString()
        }, null, 2)
    );
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
