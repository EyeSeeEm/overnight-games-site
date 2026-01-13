// Batch test for Lost Outpost - 200 iterations with JSON logging
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
    let totalScore = 0;
    let maxLevel = 1;
    let totalXP = 0;

    for (let iter = 1; iter <= 200; iter++) {
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(100);

        const iterLog = {
            game: 'lost-outpost',
            iteration: iter,
            started: new Date().toISOString(),
            outcome: null,
            kills: 0,
            duration: 0
        };
        const iterStart = Date.now();

        let lastEnemyCount = 0;
        let kills = 0;

        for (let step = 0; step < 150; step++) {
            const state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track kills
            const enemies = state.enemies || [];
            if (lastEnemyCount > enemies.length) {
                kills += lastEnemyCount - enemies.length;
            }
            lastEnemyCount = enemies.length;

            // Decision: where to aim and move
            let mouseX = 400, mouseY = 300;
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

                // Aim at enemy (convert world to screen coordinates)
                mouseX = closest.x - state.camera.x;
                mouseY = closest.y - state.camera.y;

                // Move toward enemy if far, strafe if close
                const dx = closest.x - state.player.x;
                const dy = closest.y - state.player.y;

                if (closestDist > 250) {
                    // Move toward
                    if (dx > 30) keys.push('d');
                    else if (dx < -30) keys.push('a');
                    if (dy > 30) keys.push('s');
                    else if (dy < -30) keys.push('w');
                } else if (closestDist < 100) {
                    // Retreat
                    if (dx > 0) keys.push('a');
                    else keys.push('d');
                    if (dy > 0) keys.push('w');
                    else keys.push('s');
                } else {
                    // Strafe
                    keys.push(step % 2 === 0 ? 'a' : 'd');
                }
            } else {
                // No enemies - explore
                keys.push(['w', 'a', 's', 'd'][step % 4]);
            }

            // Reload if low
            if (state.player.ammo <= 5 && state.player.ammoReserve > 0) {
                keys.push('r');
            }

            await page.evaluate(
                ({a, d}) => window.harness.execute(a, d),
                {
                    a: {
                        keys,
                        mouse: { x: mouseX, y: mouseY, down: enemies.length > 0 }
                    },
                    d: 200
                }
            );

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') { totalDeaths++; break; }
            if (phase === 'victory') break;
        }

        const finalState = await page.evaluate(() => window.harness.getState());
        const phase = await page.evaluate(() => window.harness.getPhase());

        totalKills += kills;
        totalXP += finalState.player?.xp || 0;
        totalScore += finalState.player?.credits || 0;
        maxLevel = Math.max(maxLevel, finalState.level || 1);

        // Save iteration log
        iterLog.kills = kills;
        iterLog.outcome = phase === 'gameover' ? 'death' : phase === 'victory' ? 'victory' : 'timeout';
        iterLog.duration = Date.now() - iterStart;
        iterLog.level = finalState.level || 1;
        iterLog.xp = finalState.player?.xp || 0;
        fs.writeFileSync(
            path.join(LOGS_DIR, `iter-${String(iter).padStart(3, '0')}.json`),
            JSON.stringify(iterLog, null, 2)
        );

        if (iter % 25 === 0) {
            console.log(`Checkpoint ${iter}: Kills=${totalKills}, Deaths=${totalDeaths}, MaxLevel=${maxLevel}`);
            // Reload page for stability
            await page.reload();
            await page.waitForTimeout(1500);
        }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Iterations: 200`);
    console.log(`Total kills: ${totalKills}`);
    console.log(`Total deaths: ${totalDeaths}`);
    console.log(`Total XP: ${totalXP}`);
    console.log(`Total credits: ${totalScore}`);
    console.log(`Max level reached: ${maxLevel}`);
    console.log(`Avg kills/iter: ${(totalKills/200).toFixed(2)}`);

    // Save summary
    fs.writeFileSync(
        path.join(LOGS_DIR, 'summary.json'),
        JSON.stringify({
            iterations: 200,
            totalKills,
            totalDeaths,
            totalXP,
            totalCredits: totalScore,
            maxLevel,
            avgKillsPerIter: totalKills / 200,
            completed: new Date().toISOString()
        }, null, 2)
    );

    await browser.close();
})().catch(console.error);
