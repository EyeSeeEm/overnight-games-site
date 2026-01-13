// Batch test for Star of Providence - 200 iterations with JSON logging
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
    let maxFloor = 1;

    for (let iter = 1; iter <= 200; iter++) {
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(100);

        const iterLog = {
            game: 'star-of-providence',
            iteration: iter,
            started: new Date().toISOString(),
            outcome: null,
            kills: 0,
            floor: 1,
            score: 0,
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

            // Action: Always shoot, dodge by moving
            let keys = ['Space'];

            // Simple dodge: move away from bullets
            if (state.enemyBullets > 20) {
                // Move to side
                keys.push(step % 2 === 0 ? 'a' : 'd');
            } else if (enemies.length > 0) {
                // Move toward enemies to shoot
                const e = enemies[0];
                if (e.x < state.player.x - 50) keys.push('a');
                else if (e.x > state.player.x + 50) keys.push('d');
                if (state.player.y > 300) keys.push('w');
            }

            // Use dash occasionally
            if (step % 15 === 0 && state.enemyBullets > 30) {
                keys.push('z');
            }

            // Use bomb if lots of bullets and low HP
            if (state.player.hp <= 1 && state.enemyBullets > 40 && state.player.bombs > 0) {
                keys.push('x');
            }

            await page.evaluate(
                ({a, d}) => window.harness.execute(a, d),
                { a: { keys }, d: 150 }
            );

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') { totalDeaths++; break; }
            if (phase === 'victory') break;
        }

        const finalState = await page.evaluate(() => window.harness.getState());
        const phase = await page.evaluate(() => window.harness.getPhase());

        totalKills += kills;
        totalScore += finalState.score || 0;
        maxFloor = Math.max(maxFloor, finalState.floor || 1);

        // Save iteration log
        iterLog.kills = kills;
        iterLog.floor = finalState.floor || 1;
        iterLog.score = finalState.score || 0;
        iterLog.outcome = phase === 'gameover' ? 'death' : phase === 'victory' ? 'victory' : 'timeout';
        iterLog.duration = Date.now() - iterStart;
        fs.writeFileSync(
            path.join(LOGS_DIR, `iter-${String(iter).padStart(3, '0')}.json`),
            JSON.stringify(iterLog, null, 2)
        );

        if (iter % 25 === 0) {
            console.log(`Checkpoint ${iter}: Kills=${totalKills}, Deaths=${totalDeaths}, Score=${totalScore}, MaxFloor=${maxFloor}`);
            // Reload page for stability
            await page.reload();
            await page.waitForTimeout(1500);
        }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Iterations: 200`);
    console.log(`Total kills: ${totalKills}`);
    console.log(`Total deaths: ${totalDeaths}`);
    console.log(`Total score: ${totalScore}`);
    console.log(`Max floor reached: ${maxFloor}`);
    console.log(`Avg kills/iter: ${(totalKills/200).toFixed(2)}`);

    // Save summary
    fs.writeFileSync(
        path.join(LOGS_DIR, 'summary.json'),
        JSON.stringify({
            iterations: 200,
            totalKills,
            totalDeaths,
            totalScore,
            maxFloor,
            avgKillsPerIter: totalKills / 200,
            completed: new Date().toISOString()
        }, null, 2)
    );

    await browser.close();
})().catch(console.error);
