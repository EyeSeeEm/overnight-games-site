// FTL Clone - Simple Test Script
const { chromium } = require('playwright');
const path = require('path');

async function runTest() {
    console.log('Starting FTL Clone simple test...\n');

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
    let maxSector = 1;

    for (let iter = 0; iter < 15; iter++) {
        console.log('\n=== Iteration ' + (iter + 1) + ' ===');

        // Restart game fresh
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(500);

        let state = await page.evaluate(() => window.harness.getState());
        console.log('Game state: ' + state.gameState + ', Fuel: ' + state.fuel);

        // Show available nodes
        if (state.sectorMap) {
            const jumpable = state.sectorMap.nodes.filter(n => n.canJump);
            console.log('Jumpable nodes: ' + jumpable.length + ' (' + jumpable.map(n => n.type).join(', ') + ')');
        }

        let shipsThisRun = 0;
        let jumpsThisRun = 0;
        let steps = 0;
        const maxSteps = 50;

        while (steps < maxSteps) {
            state = await page.evaluate(() => window.harness.getState());
            const phase = await page.evaluate(() => window.harness.getPhase());

            if (phase === 'gameover') {
                totalDeaths++;
                console.log('DEATH at sector ' + state.sector);
                break;
            }

            if (phase === 'victory') {
                console.log('VICTORY!');
                break;
            }

            if (state.gameState === 'sectorMap') {
                const jumpable = state.sectorMap ? state.sectorMap.nodes.filter(n => n.canJump) : [];

                if (jumpable.length > 0 && state.fuel > 0) {
                    // Pick a node to jump to
                    let target = jumpable.find(n => n.type === 'combat') ||
                                jumpable.find(n => n.type === 'exit') ||
                                jumpable[0];

                    console.log('  Jumping to ' + target.type + ' node (index ' + target.index + ')');

                    await page.evaluate((idx) => {
                        window.harness.execute({ jump: { nodeIndex: idx } }, 300);
                    }, target.index);

                    jumpsThisRun++;
                    totalJumps++;
                    await page.waitForTimeout(500);
                } else {
                    console.log('  No jumpable nodes or out of fuel (fuel: ' + state.fuel + ')');
                    break;
                }

            } else if (state.gameState === 'combat') {
                console.log('  In combat: hull=' + state.player.hull + ', enemy=' + (state.enemy ? state.enemy.hull : 'none'));

                // Select weapon and set target
                await page.evaluate(() => {
                    window.harness.execute({ selectWeapon: 0, targetRoom: 0 }, 100);
                });

                // Fight for a while
                for (let i = 0; i < 30; i++) {
                    await page.evaluate(() => window.harness.execute({ targetRoom: 0 }, 1000));

                    const combatState = await page.evaluate(() => window.harness.getState());

                    if (combatState.gameState !== 'combat') {
                        if (!combatState.enemy || (state.enemy && !combatState.enemy)) {
                            shipsThisRun++;
                            totalShipsDestroyed++;
                            console.log('  Ship destroyed!');
                        }
                        break;
                    }

                    if (combatState.player.hull <= 0) {
                        console.log('  Player destroyed!');
                        break;
                    }

                    if (!combatState.enemy) {
                        shipsThisRun++;
                        totalShipsDestroyed++;
                        console.log('  Ship destroyed!');
                        break;
                    }
                }

            } else if (state.gameState === 'store') {
                console.log('  In store, leaving...');
                await page.evaluate(() => window.harness.execute({ leaveStore: true }, 200));
                await page.waitForTimeout(200);
            }

            steps++;
            if (state.sector > maxSector) maxSector = state.sector;
        }

        console.log('  Result: ' + shipsThisRun + ' ships, ' + jumpsThisRun + ' jumps');
    }

    await browser.close();

    console.log('\n========================================');
    console.log('FINAL RESULTS');
    console.log('========================================');
    console.log('Ships Destroyed: ' + totalShipsDestroyed);
    console.log('Total Jumps: ' + totalJumps);
    console.log('Deaths: ' + totalDeaths);
    console.log('Max Sector: ' + maxSector);
    console.log('========================================');
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
