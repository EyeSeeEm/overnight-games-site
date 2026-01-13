// Motherload Clone - Playtest Script
// Agent 2 - Night 6

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 500;
const STEP_DURATION = 100;

const logFile = path.join(__dirname, 'playtest-log.txt');
let logBuffer = [];

function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}`;
    console.log(line);
    logBuffer.push(line);
}

function flushLog() {
    fs.appendFileSync(logFile, logBuffer.join('\n') + '\n');
    logBuffer = [];
}

function decideAction(state) {
    if (state.gameState === 'menu' || state.gameState === 'gameover') {
        return { keys: ['Enter'], reason: 'Start/Restart' };
    }

    if (!state.player) {
        return { keys: [], reason: 'Waiting for player' };
    }

    const player = state.player;

    // Priority 1: If at shop, interact
    if (state.currentShop) {
        // If low fuel at fuel station, buy
        if (state.currentShop === 'fuel' && player.fuel < player.maxFuel * 0.5) {
            return { keys: ['Enter'], reason: 'Buying fuel' };
        }
        // If has cargo at processor, sell
        if (state.currentShop === 'processor' && player.cargoCount > 0) {
            return { keys: ['Enter'], reason: 'Selling minerals' };
        }
        // If has cash at upgrades, try upgrade
        if (state.currentShop === 'upgrades' && player.cash >= 750) {
            return { keys: ['Enter'], reason: 'Buying upgrade' };
        }
        // If damaged at repair, repair
        if (state.currentShop === 'repair' && player.hull < player.maxHull) {
            return { keys: ['Enter'], reason: 'Repairing' };
        }
    }

    // Priority 2: Return to surface if low fuel or cargo full
    if (player.fuel < 3 || player.cargoWeight >= player.cargoCapacity - 5) {
        if (player.depth > 50) {
            // Fly up
            return { keys: ['ArrowUp'], reason: `Returning to surface (fuel: ${player.fuel.toFixed(1)}, cargo: ${player.cargoWeight})` };
        } else if (player.depth > 0) {
            // Almost at surface, keep going up
            return { keys: ['ArrowUp'], reason: 'Almost at surface' };
        } else {
            // At surface - go to appropriate shop
            if (player.cargoCount > 0) {
                // Go to processor (right side)
                return { keys: ['ArrowRight'], reason: 'Going to sell minerals' };
            } else if (player.fuel < player.maxFuel * 0.5) {
                // Go to fuel (left side)
                return { keys: ['ArrowLeft'], reason: 'Going to buy fuel' };
            }
        }
    }

    // Priority 3: Drill down and collect minerals
    if (player.grounded && player.depth < 1500) {
        // Random drilling direction
        const roll = Math.random();
        if (roll < 0.5) {
            return { keys: ['ArrowDown'], reason: 'Drilling down' };
        } else if (roll < 0.75) {
            return { keys: ['ArrowLeft'], reason: 'Drilling left' };
        } else {
            return { keys: ['ArrowRight'], reason: 'Drilling right' };
        }
    }

    // Priority 4: If in air, let gravity work or fly a bit
    if (!player.grounded) {
        if (Math.random() < 0.3) {
            return { keys: ['ArrowUp'], reason: 'Adjusting in air' };
        }
        return { keys: [], reason: 'Falling' };
    }

    // Default: drill down
    return { keys: ['ArrowDown'], reason: 'Default: drilling down' };
}

async function playtest() {
    log('Starting Motherload Clone Playtest');
    log(`Target: ${ITERATIONS} iterations`);

    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            log(`[CONSOLE ERROR] ${msg.text()}`);
        }
    });

    try {
        log(`Loading game: ${GAME_PATH}`);
        await page.goto(GAME_PATH);
        await page.waitForTimeout(2000);

        const harnessExists = await page.evaluate(() => !!window.harness);
        if (!harnessExists) {
            throw new Error('Harness not found!');
        }
        log('Harness detected');

        let completedIterations = 0;
        let totalMinerals = 0;
        let totalGold = 0;
        let maxDepth = 0;

        while (completedIterations < ITERATIONS) {
            log(`\n=== ITERATION ${completedIterations + 1} ===`);

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let steps = 0;
            let lastFuel = 10;
            let lastCash = 0;
            let iterMinerals = 0;

            while (steps < MAX_STEPS_PER_ITERATION) {
                let state;
                try {
                    state = await page.evaluate(() => window.harness.getState());
                } catch (e) {
                    log(`[ERROR] ${e.message}`);
                    break;
                }

                if (state.gameState === 'gameover') {
                    log(`Died at step ${steps}, depth was ${Math.floor(state.stats.maxDepth)} ft`);
                    totalMinerals += state.stats.mineralsCollected;
                    totalGold += state.stats.goldEarned;
                    if (state.stats.maxDepth > maxDepth) maxDepth = state.stats.maxDepth;
                    break;
                }

                // Track minerals collected
                if (state.stats && state.stats.mineralsCollected > iterMinerals) {
                    log(`Collected mineral! Total: ${state.stats.mineralsCollected}`);
                    iterMinerals = state.stats.mineralsCollected;
                }

                // Track cash earned
                if (state.player && state.player.cash > lastCash) {
                    log(`Cash: $${lastCash} -> $${state.player.cash}`);
                    lastCash = state.player.cash;
                }

                // Track fuel changes
                if (state.player && Math.abs(state.player.fuel - lastFuel) > 2) {
                    log(`Fuel: ${lastFuel.toFixed(1)} -> ${state.player.fuel.toFixed(1)}`);
                    lastFuel = state.player.fuel;
                }

                const decision = decideAction(state);

                try {
                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { keys: decision.keys }, duration: STEP_DURATION }
                    );
                } catch (e) {
                    log(`[ERROR] Execute: ${e.message}`);
                    break;
                }

                steps++;

                if (steps % 100 === 0) {
                    const s = await page.evaluate(() => window.harness.getState());
                    log(`Step ${steps}: Depth=${Math.floor(s.player?.depth || 0)}ft, Fuel=${s.player?.fuel?.toFixed(1) || 0}, Cash=$${s.player?.cash || 0}, Cargo=${s.player?.cargoCount || 0}, Minerals=${s.stats?.mineralsCollected || 0}`);
                }
            }

            completedIterations++;
            flushLog();

            if (completedIterations % 5 === 0) {
                await page.screenshot({ path: path.join(__dirname, `screenshot-iter-${completedIterations}.png`) });
            }
        }

        log('\n========== SUMMARY ==========');
        log(`Iterations: ${completedIterations}`);
        log(`Total Minerals Collected: ${totalMinerals}`);
        log(`Total Gold Earned: $${totalGold}`);
        log(`Max Depth Reached: ${Math.floor(maxDepth)} ft`);
        log('==============================');
        flushLog();

    } catch (error) {
        log(`[FATAL] ${error.message}`);
        flushLog();
    } finally {
        await browser.close();
    }

    log('Playtest complete');
    flushLog();
}

playtest().catch(console.error);
