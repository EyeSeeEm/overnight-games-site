// Enter the Gungeon Playtest Script
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function playtest() {
    console.log('Starting Enter the Gungeon playtest...');

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await sleep(2000);

    const harnessExists = await page.evaluate(() => typeof window.harness !== 'undefined');
    if (!harnessExists) {
        console.error('Harness not found!');
        await browser.close();
        return;
    }

    let log = '# Enter the Gungeon (LittleJS) - Playtest Log\n\n';
    log += `Started: ${new Date().toISOString()}\n\n`;

    let totalKills = 0;
    let totalDeaths = 0;
    let maxFloor = 1;
    let maxRooms = 0;

    for (let iter = 1; iter <= 100; iter++) {
        console.log(`\n=== Iteration ${iter}/100 ===`);

        await page.evaluate(() => window.harness.debug.forceStart());
        await sleep(300);

        let stepCount = 0;
        let state = await page.evaluate(() => window.harness.getState());

        while (stepCount < 200) {
            stepCount++;

            const phase = await page.evaluate(() => window.harness.getPhase());
            if (phase === 'gameover') {
                totalDeaths++;
                break;
            }

            state = await page.evaluate(() => window.harness.getState());
            if (!state.player) break;

            // Track stats
            if (state.floor > maxFloor) maxFloor = state.floor;
            if (state.roomsCleared > maxRooms) maxRooms = state.roomsCleared;

            // AI decision
            let action = { keys: ['Space'], mouse: { x: 400, y: 300 } };
            let duration = 100;

            // Handle dodge roll if lots of bullets
            if (state.enemyBullets > 10 && state.player.blanks > 0) {
                // Use blank
                action.keys = ['q'];
                duration = 100;
            } else if (state.enemyBullets > 5 && Math.random() < 0.3) {
                // Dodge roll
                action.keys = ['Shift', 'd'];
                duration = 200;
            } else if (state.enemies && state.enemies.length > 0) {
                // Find nearest enemy
                let nearest = state.enemies[0];
                let minDist = Infinity;
                for (const e of state.enemies) {
                    const dx = e.x - state.player.x;
                    const dy = e.y - state.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = e;
                    }
                }

                const dx = nearest.x - state.player.x;
                const dy = nearest.y - state.player.y;

                // Aim at enemy (screen coordinates)
                const aimX = 400 + dx * 32;
                const aimY = 300 - dy * 32;
                action.mouse = { x: aimX, y: aimY, click: true };

                // Move and shoot
                action.keys = ['Space'];
                if (minDist > 4) {
                    if (dx > 0.5) action.keys.push('d');
                    if (dx < -0.5) action.keys.push('a');
                    if (dy > 0.5) action.keys.push('w');
                    if (dy < -0.5) action.keys.push('s');
                } else if (minDist < 2) {
                    // Back away
                    if (dx > 0) action.keys.push('a');
                    else action.keys.push('d');
                    if (dy > 0) action.keys.push('s');
                    else action.keys.push('w');
                }

                duration = 80;
            } else if (state.roomCleared) {
                // Move to next room
                action.keys = ['d', 'e'];
                duration = 150;
            } else {
                // Explore
                const dir = Math.floor(Math.random() * 4);
                action.keys = [['w', 's', 'a', 'd'][dir], 'Space'];
                duration = 150;
            }

            // Reload when low
            if (state.player.ammo <= 3 && !state.player.reloading) {
                action.keys.push('r');
            }

            await page.evaluate(
                ({action, duration}) => window.harness.execute(action, duration),
                { action, duration }
            );

            await sleep(10);
        }

        totalKills = state.kills || totalKills;
        console.log(`  Iter ${iter}: Floor ${state.floor || 1}, Room ${state.currentRoom + 1}/${state.totalRooms}, ${state.kills || 0} kills, ${stepCount} steps`);

        if (iter % 10 === 0) {
            log += `## Iterations ${iter-9}-${iter}\n`;
            log += `- Total Kills: ${totalKills}, Deaths: ${totalDeaths}\n`;
            log += `- Max Floor: ${maxFloor}, Max Rooms: ${maxRooms}\n\n`;
        }

        if (iter % 25 === 0) {
            await page.screenshot({ path: path.join(__dirname, `iter-${iter}.png`) });
        }
    }

    log += `\n## Final Summary\n`;
    log += `- Iterations: 100\n`;
    log += `- Total Kills: ${totalKills}\n`;
    log += `- Deaths: ${totalDeaths}\n`;
    log += `- Max Floor: ${maxFloor}\n`;
    log += `- Max Rooms Cleared: ${maxRooms}\n`;
    log += `\nCompleted: ${new Date().toISOString()}\n`;

    fs.writeFileSync(path.join(__dirname, 'ITERATIONS.md'), log);
    console.log(`\nPlaytest complete! Kills: ${totalKills}, Deaths: ${totalDeaths}, Max Floor: ${maxFloor}`);

    await browser.close();
}

playtest().catch(console.error);
