const { chromium } = require('playwright');

async function testGameplay() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('file:///workspace/games/night-3/xcom-classic-clone/canvas/index.html');
    await page.waitForTimeout(2000);

    console.log('=== X-COM CLONE GAMEPLAY TEST ===');

    // Initial state
    let state = await page.evaluate(() => ({
        turn: window.gameState.turn,
        turnNumber: window.gameState.turnNumber,
        state: window.gameState.state,
        selectedName: window.gameState.selectedUnit?.name,
        soldiers: window.soldiers.filter(s => s.isAlive).length,
        aliens: window.aliens.filter(a => a.isAlive).length
    }));
    console.log('Initial:', JSON.stringify(state));

    // Test: Select different soldiers
    for (let i = 1; i <= 3; i++) {
        await page.keyboard.press(i.toString());
        await page.waitForTimeout(200);
    }

    state = await page.evaluate(() => ({
        selectedName: window.gameState.selectedUnit?.name
    }));
    console.log('After selecting soldier 3:', state.selectedName);

    // Test: Kneel
    await page.keyboard.press('k');
    await page.waitForTimeout(200);
    let soldierState = await page.evaluate(() => ({
        stance: window.gameState.selectedUnit?.stance,
        tu: window.gameState.selectedUnit?.tu.current
    }));
    console.log('After kneel:', soldierState);

    // Test: Movement - click on map to move
    await page.mouse.click(400, 200);
    await page.waitForTimeout(500);
    soldierState = await page.evaluate(() => ({
        tu: window.gameState.selectedUnit?.tu.current,
        x: window.gameState.selectedUnit?.x,
        y: window.gameState.selectedUnit?.y
    }));
    console.log('After move:', soldierState);

    // Test: Shoot at alien (if visible)
    await page.keyboard.press('s'); // Snap shot
    await page.waitForTimeout(500);

    state = await page.evaluate(() => ({
        message: window.gameState.message,
        aliens: window.aliens.filter(a => a.isAlive).length
    }));
    console.log('After snap shot:', state);

    // Test: Aimed shot
    await page.keyboard.press('1'); // Select first soldier
    await page.keyboard.press('a'); // Aimed shot
    await page.waitForTimeout(500);

    // Test: Auto shot
    await page.keyboard.press('2');
    await page.keyboard.press('f'); // Auto fire
    await page.waitForTimeout(500);

    // Test: End turn
    await page.keyboard.press('e');
    await page.waitForTimeout(3000); // Wait for alien turn

    state = await page.evaluate(() => ({
        turn: window.gameState.turn,
        turnNumber: window.gameState.turnNumber,
        soldiers: window.soldiers.filter(s => s.isAlive).length,
        aliens: window.aliens.filter(a => a.isAlive).length
    }));
    console.log('After enemy turn:', state);

    // Take final screenshot
    await page.screenshot({ path: 'gameplay-test.png' });

    // Check game state
    const finalState = await page.evaluate(() => ({
        state: window.gameState.state,
        turn: window.gameState.turn,
        turnNumber: window.gameState.turnNumber,
        soldiers: window.soldiers.filter(s => s.isAlive).length,
        aliens: window.aliens.filter(a => a.isAlive).length,
        errors: window.__errors || []
    }));

    console.log('\n=== FINAL STATE ===');
    console.log(JSON.stringify(finalState, null, 2));

    if (errors.length > 0) {
        console.log('\nJS Errors:', errors);
    }

    await browser.close();
    console.log('\n=== TEST COMPLETE ===');
}

testGameplay().catch(console.error);
