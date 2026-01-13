const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function playtest(iterations = 200) {
    console.log('Starting Binding of Isaac playtest...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();
    await page.goto('file:///workspace/games/night-6/binding-of-isaac/phaser/index.html');
    await page.waitForTimeout(2000);

    // Verify harness
    const hasHarness = await page.evaluate(() => typeof window.harness !== 'undefined');
    if (!hasHarness) {
        console.error('ERROR: No harness!');
        await browser.close();
        return;
    }
    console.log('Harness detected.');

    await page.evaluate(() => window.harness.debug.forceStart());

    let deaths = 0, victories = 0;
    const bugLog = [];
    const logs = [];

    for (let iter = 1; iter <= iterations; iter++) {
        console.log(`\n=== Iteration ${iter} ===`);
        let steps = 0;
        let phase = 'playing';
        let killsThisRun = 0;
        let roomsVisited = new Set();
        const iterLog = { iter, steps: [] };

        while (phase === 'playing' && steps < 500) {
            steps++;

            const state = await page.evaluate(() => window.harness.getState());
            if (!state || !state.player) {
                bugLog.push({ iter, step: steps, bug: 'No player state' });
                break;
            }

            const player = state.player;
            const enemies = state.enemies || [];
            const room = state.currentRoom || '0,0';
            roomsVisited.add(room);

            // Decision making
            let action;
            let decision = '';

            if (enemies.length > 0) {
                // Fight: Target nearest enemy
                const target = enemies.reduce((a, b) => {
                    const distA = Math.hypot(a.x - player.x, a.y - player.y);
                    const distB = Math.hypot(b.x - player.x, b.y - player.y);
                    return distA < distB ? a : b;
                });

                const dx = target.x - player.x;
                const dy = target.y - player.y;
                const dist = Math.hypot(dx, dy);
                const keys = [];

                // Move: Get into range but not too close
                if (dist > 120) {
                    if (dx > 30) keys.push('d');
                    else if (dx < -30) keys.push('a');
                    if (dy > 30) keys.push('s');
                    else if (dy < -30) keys.push('w');
                } else if (dist < 60) {
                    // Back away
                    if (dx > 0) keys.push('a');
                    else keys.push('d');
                    if (dy > 0) keys.push('w');
                    else keys.push('s');
                }

                // Fire at enemy
                if (Math.abs(dx) > Math.abs(dy)) {
                    keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
                } else {
                    keys.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
                }

                action = { keys };
                decision = `Fight ${target.type} at dist ${Math.round(dist)}`;
            } else if (!state.roomCleared) {
                // Room not cleared but no enemies - wait for spawns
                const keys = [['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight']][Math.floor(Math.random() * 4)];
                action = { keys };
                decision = 'Waiting for spawns';
            } else {
                // Room cleared - explore! Move toward doors
                // Try to find new rooms by going to edges
                const directions = [
                    { keys: ['w'], check: player.y < 100 },  // Near top
                    { keys: ['s'], check: player.y > 400 },  // Near bottom
                    { keys: ['a'], check: player.x < 100 },  // Near left
                    { keys: ['d'], check: player.x > 700 }   // Near right
                ];

                // Move toward edge we're closest to
                if (player.x > 400) {
                    action = { keys: ['d'] };
                    decision = 'Exploring right';
                } else if (player.x < 400) {
                    action = { keys: ['a'] };
                    decision = 'Exploring left';
                } else if (player.y > 248) {
                    action = { keys: ['s'] };
                    decision = 'Exploring down';
                } else {
                    action = { keys: ['w'] };
                    decision = 'Exploring up';
                }
            }

            // Log step (every 25)
            if (steps % 25 === 0) {
                iterLog.steps.push({
                    step: steps,
                    room,
                    player: { hearts: player.hearts, x: Math.round(player.x), y: Math.round(player.y) },
                    enemies: enemies.length,
                    decision
                });
            }

            // Execute action
            try {
                await page.evaluate(
                    ({ a, d }) => window.harness.execute(a, d),
                    { a: action, d: 100 }
                );
            } catch (e) {
                bugLog.push({ iter, step: steps, bug: 'Execute failed: ' + e.message });
                break;
            }

            // Check new phase
            try {
                phase = await page.evaluate(() => window.harness.getPhase());
            } catch (e) {
                break;
            }

            // Count kills
            const newState = await page.evaluate(() => window.harness.getState());
            if (newState && newState.enemies) {
                const killed = enemies.length - newState.enemies.length;
                if (killed > 0) killsThisRun += killed;
            }

            // Log progress every 100 steps
            if (steps % 100 === 0) {
                console.log(`  Step ${steps}: Hearts=${player.hearts}, Room=${room}, Enemies=${enemies.length}, Kills=${killsThisRun}`);
            }
        }

        // Handle outcome
        iterLog.outcome = phase;
        iterLog.kills = killsThisRun;
        iterLog.rooms = roomsVisited.size;

        if (phase === 'gameover') {
            deaths++;
            console.log(`  DEATH at step ${steps}. Kills: ${killsThisRun}, Rooms: ${roomsVisited.size}`);
        } else if (phase === 'victory') {
            victories++;
            console.log(`  VICTORY! Kills: ${killsThisRun}, Rooms: ${roomsVisited.size}`);
        } else {
            console.log(`  Timeout at step ${steps}. Kills: ${killsThisRun}, Rooms: ${roomsVisited.size}`);
        }

        logs.push(iterLog);

        // Restart
        try {
            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(200);
        } catch (e) {
            console.log('  Restart failed, relaunching...');
            await page.goto('file:///workspace/games/night-6/binding-of-isaac/phaser/index.html');
            await page.waitForTimeout(2000);
            await page.evaluate(() => window.harness.debug.forceStart());
        }

        // Checkpoint every 25 iterations
        if (iter % 25 === 0) {
            const winRate = Math.round((victories / iter) * 100);
            console.log(`\n=== CHECKPOINT: ${iter} iterations ===`);
            console.log(`Deaths: ${deaths}, Victories: ${victories}, Win Rate: ${winRate}%`);

            const logDir = path.join(__dirname, 'playtest-logs');
            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

            fs.writeFileSync(path.join(logDir, `checkpoint-${iter}.json`), JSON.stringify({
                iterations: iter, deaths, victories, winRate, bugs: bugLog.slice(-10)
            }, null, 2));
        }
    }

    await browser.close();

    // Save full logs
    const logDir = path.join(__dirname, 'playtest-logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    fs.writeFileSync(path.join(logDir, 'playtest-full.json'), JSON.stringify(logs, null, 2));

    // Final report
    console.log('\n========== FINAL RESULTS ==========');
    console.log(`Iterations: ${iterations}`);
    console.log(`Deaths: ${deaths}, Victories: ${victories}`);
    console.log(`Win Rate: ${Math.round((victories/iterations)*100)}%`);
    console.log(`Bugs found: ${bugLog.length}`);

    fs.writeFileSync(path.join(logDir, 'playtest-final.json'), JSON.stringify({
        game: 'binding-of-isaac',
        iterations, deaths, victories,
        winRate: Math.round((victories/iterations)*100),
        bugs: bugLog,
        timestamp: new Date().toISOString()
    }, null, 2));

    return { iterations, deaths, victories, bugs: bugLog };
}

// Run with 25 iterations first to test
playtest(25).then(results => {
    console.log('\nPlaytest complete:', results);
}).catch(e => {
    console.error('Playtest error:', e);
});
