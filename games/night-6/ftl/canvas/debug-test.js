// FTL Clone - Debug Test Script
const { chromium } = require('playwright');
const path = require('path');

async function runTest() {
    console.log('Starting FTL Clone debug test...\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    const gamePath = 'file://' + path.resolve(__dirname, 'index.html');

    await page.goto(gamePath);
    await page.waitForTimeout(2000);

    // Start game
    console.log('Starting game...');
    await page.evaluate(() => window.harness.debug.forceStart());
    await page.waitForTimeout(500);

    // Check initial state
    let state = await page.evaluate(() => window.harness.getState());
    console.log('Initial state:', state.gameState);
    console.log('Fuel:', state.fuel);
    console.log('Player hull:', state.player ? state.player.hull : 'N/A');

    // Check sector map nodes
    if (state.sectorMap) {
        console.log('\nSector map nodes:');
        for (const node of state.sectorMap.nodes) {
            console.log('  Node ' + node.index + ': ' + node.type + ' (canJump: ' + node.canJump + ', current: ' + node.current + ')');
        }
    }

    // Try to jump to first available combat node
    const combatNode = state.sectorMap ? state.sectorMap.nodes.find(n => n.canJump && n.type === 'combat') : null;
    if (combatNode) {
        console.log('\nJumping to combat node ' + combatNode.index);
        await page.evaluate((nodeIndex) => window.harness.execute({ jump: { nodeIndex: nodeIndex } }, 500), combatNode.index);
        await page.waitForTimeout(500);

        state = await page.evaluate(() => window.harness.getState());
        console.log('After jump - state:', state.gameState);
    } else {
        console.log('No combat node available, trying any jumpable node');
        const anyNode = state.sectorMap ? state.sectorMap.nodes.find(n => n.canJump) : null;
        if (anyNode) {
            await page.evaluate((nodeIndex) => window.harness.execute({ jump: { nodeIndex: nodeIndex } }, 500), anyNode.index);
            await page.waitForTimeout(500);
            state = await page.evaluate(() => window.harness.getState());
            console.log('After jump - state:', state.gameState);
        }
    }

    // If in combat, show enemy info and try to fight
    if (state.gameState === 'combat') {
        console.log('\n--- IN COMBAT ---');
        console.log('Combat paused:', state.combatPaused);
        console.log('Enemy:', state.enemy);
        console.log('Player weapons:', state.player ? state.player.weapons : 'N/A');

        // Unpause combat
        console.log('\nUnpausing combat...');
        await page.evaluate(() => window.harness.execute({ togglePause: true }, 100));
        await page.waitForTimeout(200);

        state = await page.evaluate(() => window.harness.getState());
        console.log('Combat paused after toggle:', state.combatPaused);

        // Select weapon
        console.log('\nSelecting weapon 0...');
        await page.evaluate(() => window.harness.execute({ selectWeapon: 0 }, 100));
        await page.waitForTimeout(100);

        state = await page.evaluate(() => window.harness.getState());
        console.log('Selected weapon:', state.selectedWeapon);
        console.log('Weapon 0 charge:', state.player ? state.player.weapons[0] : 'N/A');

        // Set target room first
        console.log('\nSetting target to shields room (index 0)...');
        await page.evaluate(() => window.harness.execute({ targetRoom: 0 }, 100));

        // Wait for weapon to charge and fire
        console.log('\nWaiting for weapon to charge and fire...');
        for (let i = 0; i < 40; i++) {
            await page.evaluate(() => window.harness.execute({ targetRoom: 0 }, 1000));
            state = await page.evaluate(() => window.harness.getState());

            if (state.gameState !== 'combat') {
                console.log('Combat ended - state:', state.gameState);
                break;
            }

            const weapon = state.player ? state.player.weapons[0] : null;
            if (weapon) {
                console.log('  Step ' + (i+1) + ': weapon charge ' + (weapon.chargePercent * 100).toFixed(0) + '%' +
                           ', player hull: ' + state.player.hull +
                           ', enemy hull: ' + (state.enemy ? state.enemy.hull : 'gone') +
                           ', enemy shields: ' + (state.enemy ? state.enemy.shields : '0'));
            }

            if (!state.enemy) {
                console.log('  Enemy destroyed!');
                break;
            }

            if (state.player && state.player.hull <= 0) {
                console.log('  Player destroyed!');
                break;
            }
        }
    }

    // Final state
    state = await page.evaluate(() => window.harness.getState());
    console.log('\nFinal state:', state.gameState);
    console.log('Player hull:', state.player ? state.player.hull : 'N/A');

    await browser.close();
    console.log('\nDebug test complete.');
}

runTest().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
