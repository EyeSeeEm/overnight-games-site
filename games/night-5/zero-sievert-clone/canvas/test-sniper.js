const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
    const page = await browser.newPage();
    await page.goto('file:///workspace/games/night-6/zero-sievert-clone/canvas/index.html');
    await page.waitForTimeout(1500);

    // Start game
    await page.evaluate(() => window.startGame());
    await page.waitForTimeout(500);

    // Test armor system
    const initial = await page.evaluate(() => ({
        health: window.getPlayer().health,
        armor: window.getPlayer().armor
    }));
    console.log('Initial state:', initial);

    // Give player armor
    await page.evaluate(() => {
        window.getPlayer().armor = 50;
    });

    const withArmor = await page.evaluate(() => ({
        health: window.getPlayer().health,
        armor: window.getPlayer().armor
    }));
    console.log('With armor:', withArmor);

    // Take damage
    await page.evaluate(() => {
        window.getPlayer().takeDamage(20, 0, 0);
    });

    const afterDamage = await page.evaluate(() => ({
        health: window.getPlayer().health,
        armor: window.getPlayer().armor
    }));
    console.log('After 20 damage:', afterDamage);

    // Take screenshot showing armor bar
    await page.screenshot({ path: 'test-armor.png' });

    // Verify armor reduced damage and was damaged
    const armorWorked = afterDamage.health > 80 && afterDamage.armor < 50;
    console.log('Test result:', armorWorked ? 'PASS - Armor reduces damage!' : 'FAIL - Armor not working');

    await browser.close();
})();
