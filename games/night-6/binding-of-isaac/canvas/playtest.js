// Binding of Isaac Clone - Playtest Script
// Agent 2 - Night 6

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS = 200;
const MAX_STEPS_PER_ITERATION = 150; // Reduced to avoid browser timeout
const STEP_DURATION = 100; // Faster steps

// Logging
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

// Room position constants (must match game.js)
const ROOM_OFFSET_X = 88;
const ROOM_OFFSET_Y = 80;
const ROOM_WIDTH = 624;
const ROOM_HEIGHT = 336;
const WALL_THICKNESS = 32;

// Exploration state
let exploreTarget = null;
let exploreSteps = 0;

// AI Decision making
function decideAction(state) {
    // If not playing, press Enter to start
    if (state.gameState === 'menu' || state.gameState === 'gameover' || state.gameState === 'victory') {
        exploreTarget = null;
        exploreSteps = 0;
        return { keys: ['Enter'], reason: 'Start/Restart game' };
    }

    if (!state.player || !state.room) {
        return { keys: [], reason: 'Waiting for game state' };
    }

    const player = state.player;
    const enemies = state.enemies || [];
    const room = state.room;

    // If enemies present, engage in combat
    if (enemies.length > 0) {
        exploreTarget = null;

        // Find nearest active enemy
        let nearestEnemy = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.state !== 'active') continue;
            const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestEnemy = enemy;
            }
        }

        if (nearestEnemy) {
            const dx = nearestEnemy.x - player.x;
            const dy = nearestEnemy.y - player.y;

            // Determine fire direction
            let fireKey = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                fireKey = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
            } else {
                fireKey = dy > 0 ? 'ArrowDown' : 'ArrowUp';
            }

            // Movement - strafe around enemy or approach if too far
            let moveKeys = [];
            if (nearestDist > 150) {
                // Approach
                if (Math.abs(dx) > 20) moveKeys.push(dx > 0 ? 'd' : 'a');
                if (Math.abs(dy) > 20) moveKeys.push(dy > 0 ? 's' : 'w');
            } else if (nearestDist < 80) {
                // Too close, back off while firing
                if (Math.abs(dx) > 10) moveKeys.push(dx > 0 ? 'a' : 'd');
                if (Math.abs(dy) > 10) moveKeys.push(dy > 0 ? 'w' : 's');
            } else {
                // Good distance - strafe perpendicular
                if (Math.random() < 0.5) {
                    moveKeys.push(Math.random() < 0.5 ? 'w' : 's');
                } else {
                    moveKeys.push(Math.random() < 0.5 ? 'a' : 'd');
                }
            }

            return {
                keys: [...moveKeys, fireKey],
                reason: `Combat: firing ${fireKey} at ${nearestEnemy.type} (dist: ${nearestDist.toFixed(0)})`
            };
        }
    }

    // No enemies - AGGRESSIVELY explore to find next room
    const doors = room.doors;

    // Calculate door positions
    const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
    const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;

    const doorPositions = {
        north: { x: centerX, y: ROOM_OFFSET_Y + 20 },
        south: { x: centerX, y: ROOM_OFFSET_Y + ROOM_HEIGHT - 20 },
        east: { x: ROOM_OFFSET_X + ROOM_WIDTH - 20, y: centerY },
        west: { x: ROOM_OFFSET_X + 20, y: centerY }
    };

    // Build list of available doors
    const availableDoors = [];
    if (doors.north) availableDoors.push('north');
    if (doors.south) availableDoors.push('south');
    if (doors.east) availableDoors.push('east');
    if (doors.west) availableDoors.push('west');

    // Pick a target door if we don't have one or after some steps
    if (!exploreTarget || exploreSteps > 20 || !availableDoors.includes(exploreTarget)) {
        if (availableDoors.length > 0) {
            exploreTarget = availableDoors[Math.floor(Math.random() * availableDoors.length)];
            exploreSteps = 0;
        }
    }

    if (exploreTarget && doorPositions[exploreTarget]) {
        const target = doorPositions[exploreTarget];
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        exploreSteps++;

        // Move directly toward door
        let moveKeys = [];

        // More aggressive movement toward door
        if (Math.abs(dx) > 10) {
            moveKeys.push(dx > 0 ? 'd' : 'a');
        }
        if (Math.abs(dy) > 10) {
            moveKeys.push(dy > 0 ? 's' : 'w');
        }

        if (moveKeys.length === 0) {
            // Very close to door - push through
            if (exploreTarget === 'north') moveKeys.push('w');
            else if (exploreTarget === 'south') moveKeys.push('s');
            else if (exploreTarget === 'east') moveKeys.push('d');
            else if (exploreTarget === 'west') moveKeys.push('a');
        }

        return {
            keys: moveKeys,
            reason: `Exploring: heading to ${exploreTarget} door (dist: ${dist.toFixed(0)})`
        };
    }

    // Default: random movement
    const randomMoves = ['w', 'a', 's', 'd'];
    return {
        keys: [randomMoves[Math.floor(Math.random() * randomMoves.length)]],
        reason: 'Random exploration'
    };
}

async function playtest() {
    log('Starting Binding of Isaac Clone Playtest');
    log(`Target: ${ITERATIONS} iterations`);

    let retryCount = 0;
    const MAX_RETRIES = 3;

    // Clear old log
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const context = await browser.newContext({
        viewport: { width: 800, height: 600 }
    });

    const page = await context.newPage();

    // Capture console logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            log(`[CONSOLE ERROR] ${msg.text()}`);
        }
    });

    page.on('pageerror', err => {
        log(`[PAGE ERROR] ${err.message}`);
    });

    try {
        log(`Loading game: ${GAME_PATH}`);
        await page.goto(GAME_PATH);
        await page.waitForTimeout(2000);

        // Check harness exists
        const harnessExists = await page.evaluate(() => !!window.harness);
        if (!harnessExists) {
            throw new Error('Harness not found!');
        }
        log('Harness detected');

        let completedIterations = 0;
        let totalEnemiesKilled = 0;
        let totalRoomsCleared = 0;
        let bugsFound = [];

        while (completedIterations < ITERATIONS) {
            log(`\n=== ITERATION ${completedIterations + 1} ===`);

            // Force start
            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let steps = 0;
            let enemiesKilledThisRun = 0;
            let roomsClearedThisRun = 0;
            let lastRoomKey = '';

            while (steps < MAX_STEPS_PER_ITERATION) {
                // Get state
                let state;
                try {
                    state = await page.evaluate(() => window.harness.getState());
                } catch (e) {
                    log(`[BUG] Error getting state: ${e.message}`);
                    bugsFound.push({ iter: completedIterations + 1, step: steps, bug: `State error: ${e.message}` });
                    break;
                }

                // Check for game over or victory
                if (state.gameState === 'gameover') {
                    log(`Died at step ${steps}. Enemies killed: ${enemiesKilledThisRun}, Rooms cleared: ${roomsClearedThisRun}`);
                    break;
                }

                if (state.gameState === 'victory') {
                    log(`Victory at step ${steps}! Enemies killed: ${enemiesKilledThisRun}, Rooms cleared: ${roomsClearedThisRun}`);
                    break;
                }

                // Track room changes
                if (state.room) {
                    const roomKey = `${state.room.gridX},${state.room.gridY}`;
                    if (roomKey !== lastRoomKey && lastRoomKey !== '') {
                        roomsClearedThisRun++;
                        totalRoomsCleared++;
                        log(`Entered room (${roomKey}), type: ${state.room.type}`);
                    }
                    lastRoomKey = roomKey;
                }

                // Track enemies
                const prevEnemyCount = state.enemies?.length || 0;

                // Decide action
                const decision = decideAction(state);

                // Execute action
                try {
                    await page.evaluate(
                        ({ action, duration }) => window.harness.execute(action, duration),
                        { action: { keys: decision.keys }, duration: STEP_DURATION }
                    );
                } catch (e) {
                    log(`[BUG] Error executing action: ${e.message}`);
                    bugsFound.push({ iter: completedIterations + 1, step: steps, bug: `Execute error: ${e.message}` });
                    break;
                }

                // Check enemies killed
                try {
                    const newState = await page.evaluate(() => window.harness.getState());
                    const newEnemyCount = newState.enemies?.length || 0;
                    if (newEnemyCount < prevEnemyCount) {
                        const killed = prevEnemyCount - newEnemyCount;
                        enemiesKilledThisRun += killed;
                        totalEnemiesKilled += killed;
                    }
                } catch (e) {
                    // Ignore
                }

                steps++;

                // Periodic status
                if (steps % 50 === 0) {
                    log(`Step ${steps}: HP=${state.player?.redHearts || 0}, Enemies=${state.enemies?.length || 0}`);
                }
            }

            if (steps >= MAX_STEPS_PER_ITERATION) {
                log(`Max steps reached. Enemies killed: ${enemiesKilledThisRun}`);
            }

            completedIterations++;
            flushLog();

            // Take screenshot every 10 iterations
            if (completedIterations % 10 === 0) {
                await page.screenshot({ path: path.join(__dirname, `screenshot-iter-${completedIterations}.png`) });
                log(`Screenshot saved: screenshot-iter-${completedIterations}.png`);
            }
        }

        // Summary
        log('\n========== PLAYTEST SUMMARY ==========');
        log(`Completed iterations: ${completedIterations}`);
        log(`Total enemies killed: ${totalEnemiesKilled}`);
        log(`Total rooms cleared: ${totalRoomsCleared}`);
        log(`Bugs found: ${bugsFound.length}`);

        if (bugsFound.length > 0) {
            log('\nBugs:');
            for (const bug of bugsFound) {
                log(`  Iter ${bug.iter}, Step ${bug.step}: ${bug.bug}`);
            }
        }

        log('=======================================');
        flushLog();

        // Final screenshot
        await page.screenshot({ path: path.join(__dirname, 'final-screenshot.png') });

    } catch (error) {
        log(`[FATAL ERROR] ${error.message}`);
        log(error.stack);
        flushLog();
    } finally {
        await browser.close();
    }

    log('Playtest complete');
    flushLog();
}

playtest().catch(console.error);
