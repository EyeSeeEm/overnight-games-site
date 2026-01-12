/**
 * Brotato Clone - New Features Test
 * Tests shop reroll, weapon combining, and life steal
 */

const { chromium } = require('playwright');

async function testNewFeatures() {
    console.log('=== Brotato Clone New Features Test ===\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();

    try {
        await page.goto('file:///workspace/games/night-6/brotato-clone/littlejs/index.html');
        await page.waitForTimeout(2000);

        // Start game and go to shop
        console.log('1. Starting game...');
        await page.evaluate(() => {
            window.selectCharacter('wellRounded');
            window.debugCommands.godMode(true);
            window.debugCommands.giveMaterials(500);
        });
        await page.waitForTimeout(500);

        // Skip to shop
        console.log('2. Skipping to shop...');
        await page.evaluate(() => window.debugCommands.skipToWave(2));
        await page.waitForTimeout(500);

        // Force end wave to go to shop
        await page.evaluate(() => {
            // Force wave end by calling endWave after adding some XP
            window.getPlayer().addXp(100);
        });
        await page.waitForTimeout(1000);

        let state = await page.evaluate(() => ({
            gameState: window.getGameState(),
            materials: window.getPlayer()?.materials
        }));
        console.log(`   State: ${state.gameState}, Materials: ${state.materials}`);

        // Go to shop by using skipToWave which resets state
        await page.evaluate(() => {
            // Set state to shop manually
            window.currentGameState = 'shop';
            window.shopItems = [
                { type: 'weapon', id: 'pistol', tier: 1, price: 35 },
                { type: 'item', id: 'vampireTooth', price: 44 },
                { type: 'weapon', id: 'smg', tier: 2, price: 55 },
                { type: 'item', id: 'energyDrink', price: 25 }
            ];
        });
        await page.waitForTimeout(500);

        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-shop-features.png' });
        console.log('   Shop screenshot saved');

        // Test reroll
        console.log('\n3. Testing shop reroll...');
        let rerollCost = await page.evaluate(() => window.getRerollCost());
        console.log(`   Reroll cost: ${rerollCost} materials`);

        await page.evaluate(() => window.rerollShop());
        await page.waitForTimeout(100);

        let newRerollCost = await page.evaluate(() => window.getRerollCost());
        console.log(`   After reroll, new cost: ${newRerollCost} materials`);
        console.log(`   Reroll cost increased: ${newRerollCost > rerollCost ? 'YES' : 'NO'}`);

        // Test weapon combining
        console.log('\n4. Testing weapon combining...');
        let weapons = await page.evaluate(() => {
            const player = window.getPlayer();
            // First add a pistol tier 1
            player.addWeapon('pistol', 1);
            return player.weapons.map(w => ({ id: w.id, tier: w.tier }));
        });
        console.log(`   Weapons before combining:`, JSON.stringify(weapons));

        await page.evaluate(() => {
            const player = window.getPlayer();
            // Add same pistol tier 1 - should combine to tier 2
            player.addWeapon('pistol', 1);
        });
        await page.waitForTimeout(100);

        weapons = await page.evaluate(() => {
            return window.getPlayer().weapons.map(w => ({ id: w.id, tier: w.tier }));
        });
        console.log(`   Weapons after combining:`, JSON.stringify(weapons));

        const hasTier2Pistol = weapons.some(w => w.id === 'pistol' && w.tier === 2);
        console.log(`   Weapon combined to Tier 2: ${hasTier2Pistol ? 'YES' : 'NO'}`);

        // Test life steal
        console.log('\n5. Testing life steal...');
        await page.evaluate(() => {
            const player = window.getPlayer();
            // Add life steal item
            player.items.push({ id: 'vampireTooth' });
            // Reduce HP
            player.hp = 10;
        });
        await page.waitForTimeout(100);

        let lifeSteal = await page.evaluate(() => window.getPlayer().getStat('lifeSteal'));
        console.log(`   Life steal stat: ${lifeSteal}%`);

        // Start combat to test life steal
        await page.evaluate(() => {
            window.currentGameState = 'waveCombat';
            window.currentWave = 1;
            window.waveTimer = 20;
        });
        await page.waitForTimeout(100);

        let hp = await page.evaluate(() => window.getPlayer().hp);
        console.log(`   HP before combat: ${hp}`);

        // Spawn enemy and wait for life steal to trigger
        await page.evaluate(() => {
            window.debugCommands.spawnEnemy('babyAlien', window.getPlayer().pos.x + 2, window.getPlayer().pos.y);
        });
        await page.waitForTimeout(3000);

        hp = await page.evaluate(() => window.getPlayer().hp);
        console.log(`   HP after combat: ${hp} (may have healed from life steal)`);

        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-combat.png' });
        console.log('   Combat screenshot saved');

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('Test error:', error);
        await page.screenshot({ path: '/workspace/games/night-6/brotato-clone/littlejs/test-error.png' });
    } finally {
        await browser.close();
    }
}

testNewFeatures();
