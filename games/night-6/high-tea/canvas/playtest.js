// Playtest script for High Tea
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const GAME_PATH = `file://${__dirname}/index.html`;
const ITERATIONS_LOG = path.join(__dirname, 'ITERATIONS.md');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function log(msg) {
    console.log(msg);
    fs.appendFileSync(ITERATIONS_LOG, msg + '\n');
}

async function playtest(iterations = 100) {
    fs.writeFileSync(ITERATIONS_LOG, `# Iterations Log: high-tea (Canvas)\n\n`);
    fs.appendFileSync(ITERATIONS_LOG, `Started: ${new Date().toISOString()}\n\n`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    let victories = 0;
    let losses = 0;
    let totalTea = 0;
    let errors = 0;

    for (let iter = 1; iter <= iterations; iter++) {
        log(`\n## Iteration ${iter}`);

        try {
            await page.goto(GAME_PATH, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Force start
            await page.evaluate(() => window.harness.debug.forceStart());
            await page.waitForTimeout(500);

            let state = await page.evaluate(() => window.harness.getState());
            let stepCount = 0;
            const maxSteps = 200;

            // Take start screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-start.png`) });
            }

            while (state.gameState === 'playing' && stepCount < maxSteps) {
                stepCount++;

                // Strategy: buy opium, accept offers, buy tea when silver is high
                let action = {};
                let duration = 500;

                // Priority 1: Accept offers if we have opium and ships
                if (state.activeOffers.length > 0 && state.opium >= 5 && state.availableShips > 0) {
                    const bestOffer = state.activeOffers.reduce((a, b) =>
                        a.total > b.total ? a : b
                    );
                    if (state.opium >= bestOffer.quantity) {
                        action.acceptOffer = true;
                        if (stepCount % 10 === 0) {
                            log(`  Step ${stepCount}: Accepting offer at ${bestOffer.port} for ${bestOffer.total} silver`);
                        }
                    }
                }

                // Priority 2: Buy opium if we have silver and low stock
                if (state.silver >= state.opiumPrice * 10 && state.opium < 30) {
                    action.buy = { resource: 'opium', amount: 10 };
                }

                // Priority 3: Buy tea if approaching clipper time and need quota
                if (state.clipperTimer < 20 && state.tea < state.quota - state.teaShipped) {
                    const teaNeeded = state.quota - state.teaShipped - state.tea;
                    if (teaNeeded > 0 && state.silver >= state.teaPrice * 10) {
                        action.buy = { resource: 'tea', amount: Math.min(10, teaNeeded) };
                    }
                }

                // Execute action
                await page.evaluate(
                    ({ action, duration }) => window.harness.execute(action, duration),
                    { action, duration }
                );

                // Get new state
                state = await page.evaluate(() => window.harness.getState());
            }

            // Take end screenshot
            if (iter <= 3 || iter % 25 === 0) {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `iter-${iter}-end.png`) });
            }

            // Final state
            const final = await page.evaluate(() => window.harness.getState());

            if (final.gameState === 'victory') {
                victories++;
                log(`  VICTORY! Years: ${final.year - 1830 + 1}, Tea: ${final.stats.totalTeaShipped}, Opium: ${final.stats.totalOpiumSold}`);
            } else if (final.gameState === 'gameover') {
                losses++;
                log(`  LOSS at year ${final.year}. Tea: ${final.stats.totalTeaShipped}, Mood: ${final.mood}, Silver: ${final.silver}`);
            } else {
                log(`  TIMEOUT after ${maxSteps} steps. Year: ${final.year}, Tea: ${final.stats.totalTeaShipped}`);
            }

            totalTea += final.stats?.totalTeaShipped || 0;

        } catch (error) {
            log(`  ERROR: ${error.message}`);
            errors++;
        }

        await page.waitForTimeout(100);
    }

    log(`\n\n## Summary`);
    log(`- Iterations: ${iterations}`);
    log(`- Victories: ${victories}`);
    log(`- Losses: ${losses}`);
    log(`- Timeouts: ${iterations - victories - losses - errors}`);
    log(`- Errors: ${errors}`);
    log(`- Total Tea Shipped: ${totalTea}`);
    log(`\nCompleted: ${new Date().toISOString()}`);

    await browser.close();
    return { iterations, victories, losses, totalTea, errors };
}

if (require.main === module) {
    const count = parseInt(process.argv[2]) || 100;
    playtest(count).then(r => {
        console.log('\nResults:', r);
        process.exit(0);
    }).catch(e => {
        console.error('Failed:', e);
        process.exit(1);
    });
}

module.exports = { playtest };
