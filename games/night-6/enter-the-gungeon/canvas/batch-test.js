// Batch test for Enter the Gungeon - 200 iterations with JSON logging
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
    let totalRoomsCleared = 0;
    let maxFloor = 1;

    for (let iter = 1; iter <= 200; iter++) {
        await page.evaluate(() => window.harness.debug.forceStart());
        await page.waitForTimeout(100);

        const iterLog = {
            game: 'enter-the-gungeon',
            iteration: iter,
            started: new Date().toISOString(),
            outcome: null,
            kills: 0,
            roomsCleared: 0,
            floor: 1,
            duration: 0
        };
        const iterStart = Date.now();

        let lastEnemyCount = 0;
        let kills = 0;
        let roomsCleared = 0;
        let lastRoomCleared = false;

        for (let step = 0; step < 200; step++) {
            const state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track kills
            const enemies = state.enemies || [];
            if (lastEnemyCount > enemies.length) {
                kills += lastEnemyCount - enemies.length;
            }
            lastEnemyCount = enemies.length;

            // Track room clears
            if (state.roomCleared && !lastRoomCleared) {
                roomsCleared++;
            }
            lastRoomCleared = state.roomCleared;

            // Decision: combat or navigation
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

                // Aim at enemy (screen coords)
                mouseX = 400 + (closest.x - state.camera.x);
                mouseY = 300 + (closest.y - state.camera.y);

                // Movement: strafe/dodge
                const dx = closest.x - state.player.x;
                const dy = closest.y - state.player.y;

                if (closestDist < 80) {
                    // Too close, back away
                    if (dx > 0) keys.push('a');
                    else keys.push('d');
                    if (dy > 0) keys.push('w');
                    else keys.push('s');
                    // Dodge roll if many bullets
                    if (state.enemyBullets > 10 && step % 3 === 0) {
                        keys.push(' ');
                    }
                } else if (closestDist > 200) {
                    // Move closer
                    if (dx > 30) keys.push('d');
                    else if (dx < -30) keys.push('a');
                    if (dy > 30) keys.push('s');
                    else if (dy < -30) keys.push('w');
                } else {
                    // Strafe around enemy
                    keys.push(step % 2 === 0 ? 'a' : 'd');
                }

                // Use blank if surrounded
                if (state.enemyBullets > 20 && state.player.blanks > 0 && state.player.hp <= 2) {
                    keys.push('q');
                }

                await page.evaluate(
                    ({a, d}) => window.harness.execute(a, d),
                    {
                        a: {
                            keys,
                            mouse: { x: mouseX, y: mouseY, down: true }
                        },
                        d: 150
                    }
                );
            } else if (state.roomCleared && state.doors && state.doors.length > 0) {
                // Navigate to next room
                const door = state.doors[0];
                const dx = door.x - state.player.x;
                const dy = door.y - state.player.y;

                if (Math.abs(dx) > 20) keys.push(dx > 0 ? 'd' : 'a');
                if (Math.abs(dy) > 20) keys.push(dy > 0 ? 's' : 'w');

                await page.evaluate(
                    ({a, d}) => window.harness.execute(a, d),
                    { a: { keys }, d: 200 }
                );
            } else {
                // Explore room
                keys.push(['w', 'a', 's', 'd'][step % 4]);
                await page.evaluate(
                    ({a, d}) => window.harness.execute(a, d),
                    { a: { keys }, d: 200 }
                );
            }

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') { totalDeaths++; break; }
            if (phase === 'victory') break;
        }

        const finalState = await page.evaluate(() => window.harness.getState());
        const phase = await page.evaluate(() => window.harness.getPhase());

        totalKills += kills;
        totalRoomsCleared += roomsCleared;
        maxFloor = Math.max(maxFloor, finalState.floor || 1);

        // Save iteration log
        iterLog.kills = kills;
        iterLog.roomsCleared = roomsCleared;
        iterLog.floor = finalState.floor || 1;
        iterLog.outcome = phase === 'gameover' ? 'death' : phase === 'victory' ? 'victory' : 'timeout';
        iterLog.duration = Date.now() - iterStart;
        fs.writeFileSync(
            path.join(LOGS_DIR, `iter-${String(iter).padStart(3, '0')}.json`),
            JSON.stringify(iterLog, null, 2)
        );

        if (iter % 25 === 0) {
            console.log(`Checkpoint ${iter}: Kills=${totalKills}, Deaths=${totalDeaths}, Rooms=${totalRoomsCleared}, MaxFloor=${maxFloor}`);
            // Reload page for stability
            await page.reload();
            await page.waitForTimeout(1500);
        }
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Iterations: 200`);
    console.log(`Total kills: ${totalKills}`);
    console.log(`Total deaths: ${totalDeaths}`);
    console.log(`Total rooms cleared: ${totalRoomsCleared}`);
    console.log(`Max floor reached: ${maxFloor}`);
    console.log(`Avg kills/iter: ${(totalKills/200).toFixed(2)}`);

    // Save summary
    fs.writeFileSync(
        path.join(LOGS_DIR, 'summary.json'),
        JSON.stringify({
            iterations: 200,
            totalKills,
            totalDeaths,
            totalRoomsCleared,
            maxFloor,
            avgKillsPerIter: totalKills / 200,
            completed: new Date().toISOString()
        }, null, 2)
    );

    await browser.close();
})().catch(console.error);
