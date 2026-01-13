// Dome Keeper Clone - Playtest Script
// Agent 2 - Night 6

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 800;
const STEP_DURATION = 80;

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

let digDirection = 's'; // Primary dig direction
let digCounter = 0;
let atDome = false;

function decideAction(state) {
    if (state.gameState === 'menu' || state.gameState === 'gameover' || state.gameState === 'victory') {
        return { keys: ['Enter'], reason: 'Start/Restart game' };
    }

    if (!state.keeper || !state.dome) {
        return { keys: [], reason: 'Waiting for game state' };
    }

    // Defense phase - aim and fire at enemies
    if (state.phase === 'defense' && state.enemies.length > 0) {
        const enemy = state.enemies[0];
        // Aim at center-top of screen where enemies approach
        return {
            keys: [],
            mouse: { x: 400, y: 150, down: true },
            reason: `Defense: firing at ${state.enemies.length} enemies`
        };
    }

    // Mining phase - dig and collect resources
    if (state.phase === 'mining') {
        // Dome is at tile y=5, world y ~= 88. Check within 80 pixels of dome.
        const domeWorldY = 88;
        const isNearDome = state.keeper.y < domeWorldY + 80;

        // If carrying resources and need to deposit
        if (state.keeper.carrying > 0 && (state.phaseTimer < 30 || state.keeper.carrying >= state.keeper.maxCarry - 1)) {
            if (isNearDome) {
                // At dome, deposit with space
                return { keys: [' '], reason: 'Depositing resources at dome' };
            } else {
                // Return to dome - dig up, also move horizontally toward dome center (x ~= 648)
                const domeX = 648;
                const needsLeft = state.keeper.x > domeX + 40;
                const needsRight = state.keeper.x < domeX - 40;

                // Alternate between up and horizontal movement
                digCounter++;
                if (needsLeft && digCounter % 3 === 0) {
                    return { keys: ['a'], reason: `Returning to dome (moving left)` };
                } else if (needsRight && digCounter % 3 === 0) {
                    return { keys: ['d'], reason: `Returning to dome (moving right)` };
                }
                return { keys: ['w'], reason: `Returning to dome (y=${Math.round(state.keeper.y)})` };
            }
        }

        // Primary mining strategy: dig down, avoid flying in sky
        digCounter++;

        // If in the sky area (y < 100), go down
        if (state.keeper.y < 100) {
            return { keys: ['s'], reason: 'Mining: returning underground' };
        }

        // Every 15 steps, change direction for variety but bias down and sideways
        if (digCounter % 15 === 0) {
            const dirs = ['s', 's', 's', 's', 'a', 'a', 'd', 'd']; // Heavy bias toward down, some sideways
            digDirection = dirs[Math.floor(Math.random() * dirs.length)];
        }

        // Occasionally do random to explore
        if (digCounter % 8 === 0 && Math.random() < 0.2) {
            const dirs = ['a', 's', 'd']; // Never random 'w' to avoid sky
            digDirection = dirs[Math.floor(Math.random() * dirs.length)];
        }

        return { keys: [digDirection], reason: `Mining: digging ${digDirection}` };
    }

    // Defense phase, no enemies - wait
    if (state.phase === 'defense') {
        return { keys: [], mouse: { x: 400, y: 200, down: false }, reason: 'Defense: waiting' };
    }

    return { keys: [], reason: 'Idle' };
}

async function playtest() {
    log('Starting Dome Keeper Clone Playtest');
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
        let totalResourcesCollected = 0;
        let totalEnemiesKilled = 0;
        let totalWavesSurvived = 0;

        while (completedIterations < ITERATIONS) {
            log(`\n=== ITERATION ${completedIterations + 1} ===`);

            // Reset AI state
            digDirection = 's';
            digCounter = 0;

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let steps = 0;
            let lastWave = 0;
            let lastPhase = '';

            while (steps < MAX_STEPS_PER_ITERATION) {
                let state;
                try {
                    state = await page.evaluate(() => window.harness.getState());
                } catch (e) {
                    log(`[ERROR] ${e.message}`);
                    break;
                }

                if (state.gameState === 'gameover') {
                    log(`Dome destroyed at wave ${state.waveNumber}`);
                    totalWavesSurvived += state.waveNumber;
                    break;
                }

                if (state.gameState === 'victory') {
                    log(`Victory! Completed all waves`);
                    totalWavesSurvived += 10;
                    break;
                }

                // Track phase changes
                if (state.phase !== lastPhase) {
                    log(`Phase: ${state.phase}, Wave: ${state.waveNumber}`);
                    lastPhase = state.phase;
                }

                // Track wave progress
                if (state.waveNumber > lastWave) {
                    log(`Wave ${state.waveNumber} started, ${state.enemies.length} enemies`);
                    lastWave = state.waveNumber;
                }

                const decision = decideAction(state);

                try {
                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { keys: decision.keys, mouse: decision.mouse }, duration: STEP_DURATION }
                    );
                } catch (e) {
                    log(`[ERROR] Execute: ${e.message}`);
                    break;
                }

                steps++;

                if (steps % 50 === 0) {
                    const s = await page.evaluate(() => window.harness.getState());
                    log(`Step ${steps}: Phase=${s.phase}, Timer=${Math.ceil(s.phaseTimer)}s, Pos=(${Math.round(s.keeper?.x || 0)},${Math.round(s.keeper?.y || 0)}), Carrying=${s.keeper?.carrying || 0}/${s.keeper?.maxCarry || 5}, Deposited=${s.resources.iron}/${s.resources.water}/${s.resources.cobalt}, HP=${s.dome?.hp || 0}`);
                }

                // Log deposit attempts
                if (decision.reason.includes('Depositing')) {
                    log(`Deposit attempt at pos (${Math.round(state.keeper.x)}, ${Math.round(state.keeper.y)})`);
                }
            }

            completedIterations++;
            flushLog();

            if (completedIterations % 10 === 0) {
                await page.screenshot({ path: path.join(__dirname, `screenshot-iter-${completedIterations}.png`) });
            }
        }

        log('\n========== SUMMARY ==========');
        log(`Iterations: ${completedIterations}`);
        log(`Average waves survived: ${(totalWavesSurvived / completedIterations).toFixed(1)}`);
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
