// FTL Clone - Final Test Script
const { chromium } = require('playwright');
const path = require('path');

async function runTest() {
    console.log('Starting FTL Clone final test...\n');

    let browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    let page = await browser.newPage();
    const gamePath = 'file://' + path.resolve(__dirname, 'index.html');

    await page.goto(gamePath);
    await page.waitForTimeout(2000);

    let totalShipsDestroyed = 0;
    let totalJumps = 0;
    let totalDeaths = 0;
    let maxSector = 1;
    let completedIterations = 0;

    for (let iter = 0; iter < 30; iter++) {
        try {
            console.log('\n=== Iteration ' + (iter + 1) + ' ===');

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(300);

            let shipsThisRun = 0;
            let jumpsThisRun = 0;
            let steps = 0;

            while (steps < 30) {
                const state = await page.evaluate(() => window.harness.getState());
                const phase = await page.evaluate(() => window.harness.getPhase());

                if (phase === 'gameover') {
                    totalDeaths++;
                    break;
                }

                if (phase === 'victory') {
                    maxSector = 8;
                    break;
                }

                if (state.gameState === 'sectorMap') {
                    const jumpable = state.sectorMap ? state.sectorMap.nodes.filter(n => n.canJump) : [];

                    if (jumpable.length > 0 && state.fuel > 0) {
                        let target = jumpable.find(n => n.type === 'combat') ||
                                    jumpable.find(n => n.type === 'exit') ||
                                    jumpable[0];

                        await page.evaluate((idx) => window.harness.execute({ jump: { nodeIndex: idx } }, 300), target.index);
                        jumpsThisRun++;
                        totalJumps++;
                        await page.waitForTimeout(300);
                    } else {
                        break;
                    }

                } else if (state.gameState === 'combat') {
                    await page.evaluate(() => window.harness.execute({ selectWeapon: 0, targetRoom: 0 }, 100));

                    for (let i = 0; i < 20; i++) {
                        await page.evaluate(() => window.harness.execute({ targetRoom: 0 }, 500));

                        const combatState = await page.evaluate(() => window.harness.getState());

                        if (combatState.gameState !== 'combat' || !combatState.enemy) {
                            if (state.enemy) {
                                shipsThisRun++;
                                totalShipsDestroyed++;
                            }
                            break;
                        }

                        if (combatState.player.hull <= 0) break;
                    }

                } else if (state.gameState === 'store') {
                    await page.evaluate(() => window.harness.execute({ leaveStore: true }, 200));
                }

                steps++;
                if (state.sector > maxSector) maxSector = state.sector;
            }

            console.log('Ships: ' + shipsThisRun + ', Jumps: ' + jumpsThisRun);
            completedIterations++;

            // Reload every 5 iterations
            if ((iter + 1) % 5 === 0) {
                await page.reload();
                await page.waitForTimeout(1500);
            }

        } catch (err) {
            console.log('Error: ' + err.message + ' - restarting browser');
            try { await browser.close(); } catch(e) {}

            browser = await chromium.launch({
                headless: true,
                args: ['--use-gl=angle', '--use-angle=swiftshader']
            });
            page = await browser.newPage();
            await page.goto(gamePath);
            await page.waitForTimeout(2000);
        }
    }

    try { await browser.close(); } catch(e) {}

    console.log('\n========================================');
    console.log('FINAL RESULTS');
    console.log('========================================');
    console.log('Total Ships Destroyed: ' + totalShipsDestroyed);
    console.log('Total Jumps: ' + totalJumps);
    console.log('Total Deaths: ' + totalDeaths);
    console.log('Max Sector: ' + maxSector);
    console.log('Completed Iterations: ' + completedIterations + '/30');
    console.log('========================================');
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
