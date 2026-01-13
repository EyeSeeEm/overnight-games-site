// Batch test for Brotato - 200 iterations with JSON logging
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LOGS_DIR = path.join(__dirname, 'playtest-logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await page.waitForTimeout(1500);

    let totalKills = 0;
    let totalDeaths = 0;
    let totalGold = 0;
    let maxWave = 1;
    let totalVictories = 0;

    for (let iter = 1; iter <= 200; iter++) {
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(100);

        const iterLog = {
            game: 'brotato',
            iteration: iter,
            started: new Date().toISOString(),
            outcome: null,
            kills: 0,
            wave: 1,
            gold: 0,
            duration: 0
        };
        const iterStart = Date.now();

        let lastEnemyCount = 0;
        let kills = 0;

        for (let step = 0; step < 300; step++) {
            const state = await page.evaluate(() => window.harness.getState());
            const phase = await page.evaluate(() => window.harness.getPhase());

            if (!state.player) break;

            // Track kills
            const enemies = state.enemies || [];
            if (lastEnemyCount > enemies.length) {
                kills += lastEnemyCount - enemies.length;
            }
            lastEnemyCount = enemies.length;

            // Handle different phases
            if (phase === 'shop') {
                // In shop or levelUp - press 1 to pick first option, space to continue
                if (state.gameState === 'levelUp') {
                    await page.evaluate(
                        ({a, d}) => window.harness.execute(a, d),
                        { a: { keys: ['1'] }, d: 100 }
                    );
                } else if (state.shopItems > 0 && state.player.gold >= 25) {
                    // Try to buy first item
                    await page.evaluate(
                        ({a, d}) => window.harness.execute(a, d),
                        { a: { keys: ['1'] }, d: 100 }
                    );
                } else {
                    // Continue to next wave
                    await page.evaluate(
                        ({a, d}) => window.harness.execute(a, d),
                        { a: { keys: [' '] }, d: 100 }
                    );
                }
            } else if (phase === 'playing') {
                // Combat: move toward enemies and auto-attack
                let keys = [];

                if (enemies.length > 0) {
                    // Find closest enemy
                    let closest = enemies[0];
                    let closestDist = Infinity;
                    for (const e of enemies) {
                        const dx = e.x - state.player.x;
                        const dy = e.y - state.player.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closest = e;
                        }
                    }

                    const dx = closest.x - state.player.x;
                    const dy = closest.y - state.player.y;

                    // Move to optimal range (not too close, not too far)
                    if (closestDist > 150) {
                        // Move closer
                        if (dx > 20) keys.push('d');
                        else if (dx < -20) keys.push('a');
                        if (dy > 20) keys.push('s');
                        else if (dy < -20) keys.push('w');
                    } else if (closestDist < 80 && enemies.length > 3) {
                        // Kite if many enemies close
                        if (dx > 0) keys.push('a');
                        else keys.push('d');
                        if (dy > 0) keys.push('w');
                        else keys.push('s');
                    } else {
                        // Circle strafe
                        keys.push(step % 2 === 0 ? 'a' : 'd');
                    }
                } else {
                    // No enemies - random movement
                    keys.push(['w', 'a', 's', 'd'][step % 4]);
                }

                await page.evaluate(
                    ({a, d}) => window.harness.execute(a, d),
                    { a: { keys }, d: 150 }
                );
            }

            if (phase === 'gameover') { totalDeaths++; break; }
            if (phase === 'victory') { totalVictories++; break; }
        }

        const finalState = await page.evaluate(() => window.harness.getState());
        const phase = await page.evaluate(() => window.harness.getPhase());

        totalKills += kills;
        totalGold += finalState.player?.gold || 0;
        maxWave = Math.max(maxWave, finalState.wave || 1);

        // Save iteration log
        iterLog.kills = kills;
        iterLog.wave = finalState.wave || 1;
        iterLog.gold = finalState.player?.gold || 0;
        iterLog.outcome = phase === 'gameover' ? 'death' : phase === 'victory' ? 'victory' : 'timeout';
        iterLog.duration = Date.now() - iterStart;
        fs.writeFileSync(
            path.join(LOGS_DIR, `iter-${String(iter).padStart(3, '0')}.json`),
            JSON.stringify(iterLog, null, 2)
        );

        if (iter % 25 === 0) {
            console.log(`Checkpoint ${iter}: Kills=${totalKills}, Deaths=${totalDeaths}, Victories=${totalVictories}, MaxWave=${maxWave}`);
            // Reload page for stability
            await page.reload();
            await page.waitForTimeout(1500);
        }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Iterations: 200`);
    console.log(`Total kills: ${totalKills}`);
    console.log(`Total deaths: ${totalDeaths}`);
    console.log(`Total victories: ${totalVictories}`);
    console.log(`Max wave reached: ${maxWave}`);
    console.log(`Avg kills/iter: ${(totalKills/200).toFixed(2)}`);

    // Save summary
    fs.writeFileSync(
        path.join(LOGS_DIR, 'summary.json'),
        JSON.stringify({
            iterations: 200,
            totalKills,
            totalDeaths,
            totalVictories,
            maxWave,
            avgKillsPerIter: totalKills / 200,
            completed: new Date().toISOString()
        }, null, 2)
    );

    await browser.close();
})().catch(console.error);
