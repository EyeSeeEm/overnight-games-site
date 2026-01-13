// Tower Wizard Clone - Playtest Script
// Agent 2 - Night 6

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 300;
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
    if (state.gameState === 'menu') {
        return { keys: ['Enter'], reason: 'Start game' };
    }

    // Priority 1: Ascend if possible
    if (state.canAscend) {
        return { keys: ['a'], reason: 'Ascending tower!' };
    }

    // Priority 2: Summon spirit if can afford
    if (state.magic >= state.spiritCost) {
        return { keys: ['s'], reason: `Summoning spirit (cost: ${state.spiritCost})` };
    }

    // Priority 3: Assign unassigned spirits
    if (state.spirits > 0) {
        // Prefer cloudlings (auto magic)
        if (state.unlockedRooms.includes('orb')) {
            return { keys: ['1'], reason: 'Assigning to cloudlings' };
        }
        if (state.unlockedRooms.includes('study')) {
            return { keys: ['2'], reason: 'Assigning to tomes' };
        }
    }

    // Priority 4: Buy upgrade if can afford
    const upgradeCost = Math.floor(100 * Math.pow(2, state.upgrades.wizardMagic));
    if (state.magic >= upgradeCost && state.upgrades.wizardMagic < 5) {
        return { keys: ['u'], reason: 'Buying magic upgrade' };
    }

    // Priority 5: Click orb for magic
    return { keys: [' '], reason: 'Clicking orb for magic' };
}

async function playtest() {
    log('Starting Tower Wizard Clone Playtest');
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
        let totalMagic = 0;
        let totalSpirits = 0;
        let maxTowerLevel = 0;

        while (completedIterations < ITERATIONS) {
            log(`\n=== ITERATION ${completedIterations + 1} ===`);

            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let steps = 0;
            let lastMagic = 0;
            let lastSpirits = 0;
            let lastLevel = 1;

            while (steps < MAX_STEPS_PER_ITERATION) {
                let state;
                try {
                    state = await page.evaluate(() => window.harness.getState());
                } catch (e) {
                    log(`[ERROR] ${e.message}`);
                    break;
                }

                // Track progress
                if (state.lifetimeMagic > lastMagic * 2 && lastMagic > 0) {
                    log(`Magic doubled: ${lastMagic.toFixed(0)} -> ${state.lifetimeMagic.toFixed(0)}`);
                    lastMagic = state.lifetimeMagic;
                } else if (lastMagic === 0) {
                    lastMagic = state.lifetimeMagic;
                }

                if (state.stats.spiritsSummoned > lastSpirits) {
                    log(`Summoned spirit! Total: ${state.stats.spiritsSummoned}`);
                    lastSpirits = state.stats.spiritsSummoned;
                }

                if (state.towerLevel > lastLevel) {
                    log(`ASCENDED! Tower level: ${state.towerLevel}`);
                    lastLevel = state.towerLevel;
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

                if (steps % 50 === 0) {
                    const s = await page.evaluate(() => window.harness.getState());
                    log(`Step ${steps}: Magic=${s.lifetimeMagic.toFixed(0)}, Spirits=${s.totalSpirits}, Tower=${s.towerLevel}, Cloudlings=${s.assignments.cloudlings}`);
                }
            }

            // End of iteration stats
            const finalState = await page.evaluate(() => window.harness.getState());
            totalMagic += finalState.lifetimeMagic;
            totalSpirits += finalState.totalSpirits;
            if (finalState.towerLevel > maxTowerLevel) {
                maxTowerLevel = finalState.towerLevel;
            }

            completedIterations++;
            flushLog();
        }

        log('\n========== SUMMARY ==========');
        log(`Iterations: ${completedIterations}`);
        log(`Total Magic Earned: ${totalMagic.toFixed(0)}`);
        log(`Total Spirits: ${totalSpirits}`);
        log(`Max Tower Level: ${maxTowerLevel}`);
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
