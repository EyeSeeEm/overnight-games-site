/**
 * Playwright Test Runner for Iteration System v2
 *
 * This script runs an automated test session and produces a recording.
 *
 * Usage:
 *   node run-test.js --type general_playtest --duration 15000 --iteration 1
 *   node run-test.js --type bug_repro --target ISSUE-001 --iteration 2
 *   node run-test.js --type feature_test --target "new-enemy-spider" --iteration 3
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
};

const config = {
  type: getArg('type', 'general_playtest'),
  target: getArg('target', null),
  iteration: parseInt(getArg('iteration', '1'), 10),
  duration: parseInt(getArg('duration', '15000'), 10),
  screenshotInterval: parseInt(getArg('screenshot-interval', '3000'), 10),
  agentId: getArg('agent', 'test-runner')
};

const GAME_PATH = path.resolve(__dirname, '..', 'index.html');
const RECORDINGS_PATH = path.resolve(__dirname, 'recordings');

async function runTest() {
  console.log('[TestRunner] Starting test:', config);

  // Ensure recordings directory exists
  if (!fs.existsSync(RECORDINGS_PATH)) {
    fs.mkdirSync(RECORDINGS_PATH, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  const recordingName = `iter-${String(config.iteration).padStart(3, '0')}-${config.type}`;
  const recordingPath = path.join(RECORDINGS_PATH, `${recordingName}.json`);
  const screenshotDir = path.join(RECORDINGS_PATH, recordingName);

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    // Load game
    const gameUrl = `file://${GAME_PATH}`;
    console.log('[TestRunner] Loading game:', gameUrl);
    await page.goto(gameUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for game to initialize
    await page.waitForTimeout(2000);

    // Inject test recorder if not already loaded
    const hasRecorder = await page.evaluate(() => !!window.testRecorder);
    if (!hasRecorder) {
      const recorderScript = fs.readFileSync(path.join(__dirname, 'test-recorder.js'), 'utf-8');
      await page.evaluate(recorderScript);
    }

    // Start recording
    await page.evaluate((cfg) => {
      window.testRecorder.start({
        type: cfg.type,
        target: cfg.target,
        iteration: cfg.iteration,
        agent_id: cfg.agentId
      });
    }, config);

    // Take initial screenshot
    let screenshotCount = 0;
    const takeScreenshot = async (label) => {
      screenshotCount++;
      const filename = `screenshot-${String(screenshotCount).padStart(3, '0')}-${label}.png`;
      const filepath = path.join(screenshotDir, filename);
      await page.screenshot({ path: filepath });
      await page.evaluate(({fn, obs}) => {
        window.testRecorder.screenshot(fn, obs);
      }, {fn: filename, obs: `Screenshot: ${label}`});
      console.log('[TestRunner] Screenshot:', filename);
      return filename;
    };

    await takeScreenshot('initial');

    // Check if game has debug commands
    const hasDebug = await page.evaluate(() => !!window.debug);

    // Start the game if on menu screen
    const gameState = await page.evaluate(() => window.debug?.getState?.()?.gameState || window.gameState?.()?.state);
    if (gameState === 'menu' || gameState === 'title') {
      console.log('[TestRunner] Game on menu screen, pressing Enter to start...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      // Check if we need another press
      const newState = await page.evaluate(() => window.debug?.getState?.()?.gameState || window.gameState?.()?.state);
      if (newState === 'menu' || newState === 'title') {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    }
    console.log('[TestRunner] Debug commands available:', hasDebug);

    // Run test based on type
    if (config.type === 'general_playtest') {
      await runGeneralPlaytest(page, config.duration, takeScreenshot);
    } else if (config.type === 'bug_repro') {
      await runBugRepro(page, config.target, takeScreenshot);
    } else if (config.type === 'feature_test') {
      await runFeatureTest(page, config.target, takeScreenshot);
    }

    // Take final screenshot
    await takeScreenshot('final');

    // End recording and get JSON
    const recording = await page.evaluate(() => {
      return window.testRecorder.end({
        success: true,
        summary: 'Test completed',
        issues_found: [],
        issues_verified_fixed: []
      });
    });

    // Save recording
    fs.writeFileSync(recordingPath, JSON.stringify(recording, null, 2));
    console.log('[TestRunner] Recording saved:', recordingPath);

    // Print summary
    console.log('\n=== Test Complete ===');
    console.log('Type:', config.type);
    console.log('Duration:', recording.metadata.duration_ms, 'ms');
    console.log('Steps:', recording.steps.length);
    console.log('Screenshots:', screenshotCount);
    console.log('Recording:', recordingPath);

  } catch (error) {
    console.error('[TestRunner] Error:', error.message);

    // Try to save partial recording
    try {
      const partialRecording = await page.evaluate(() => {
        return window.testRecorder.end({
          success: false,
          summary: 'Test failed with error',
          issues_found: ['TEST_RUNNER_ERROR'],
          issues_verified_fixed: []
        });
      });
      fs.writeFileSync(recordingPath, JSON.stringify(partialRecording, null, 2));
      console.log('[TestRunner] Partial recording saved:', recordingPath);
    } catch (e) {
      console.error('[TestRunner] Could not save recording:', e.message);
    }
  } finally {
    await browser.close();
  }
}

/**
 * General playtest - play the game like a human would
 * Enter the Gungeon controls: WASD movement, mouse aim/click fire, Space dodge roll
 */
async function runGeneralPlaytest(page, duration, takeScreenshot) {
  console.log('[TestRunner] Running general playtest for', duration, 'ms');

  const startTime = Date.now();
  const moveKeys = ['w', 'a', 's', 'd'];
  let actionCount = 0;

  // Get canvas center for mouse positioning
  const canvasBox = await page.locator('#gameCanvas').boundingBox();
  const canvasCenter = {
    x: canvasBox.x + canvasBox.width / 2,
    y: canvasBox.y + canvasBox.height / 2
  };

  while (Date.now() - startTime < duration) {
    // Determine action type: 60% move, 25% fire, 15% dodge roll
    const roll = Math.random();
    let intent, actionName;

    if (roll < 0.6) {
      // Movement
      const moveKey = moveKeys[Math.floor(Math.random() * 4)];
      intent = `Move ${moveKey.toUpperCase()} to explore/position`;
      actionName = `move_${moveKey}`;

      const holdDuration = 300 + Math.random() * 500;
      await page.keyboard.down(moveKey);
      await page.waitForTimeout(holdDuration);
      await page.keyboard.up(moveKey);

    } else if (roll < 0.85) {
      // Fire at random direction
      intent = 'Fire at enemies';
      actionName = 'fire';

      // Move mouse to random position around canvas center and click
      const targetX = canvasCenter.x + (Math.random() - 0.5) * 300;
      const targetY = canvasCenter.y + (Math.random() - 0.5) * 200;
      await page.mouse.move(targetX, targetY);
      await page.mouse.down();
      await page.waitForTimeout(200 + Math.random() * 300);
      await page.mouse.up();

    } else {
      // Dodge roll
      intent = 'Dodge roll to avoid bullets';
      actionName = 'dodge_roll';

      // Press space while holding a direction
      const moveKey = moveKeys[Math.floor(Math.random() * 4)];
      await page.keyboard.down(moveKey);
      await page.keyboard.press(' ');
      await page.waitForTimeout(500); // Roll duration
      await page.keyboard.up(moveKey);
    }

    // Record step
    await page.evaluate(({i, a}) => {
      const state = window.debug ? window.debug.getState() : { note: 'no debug' };
      window.testRecorder.step({
        intent: i,
        action: { type: a },
        observation: JSON.stringify(state).substring(0, 200)
      });
    }, {i: intent, a: actionName});

    actionCount++;

    // Periodic screenshots
    if (actionCount % 10 === 0) {
      await takeScreenshot(`action-${actionCount}`);
    }

    // Small pause between actions
    await page.waitForTimeout(50);
  }

  console.log('[TestRunner] Completed', actionCount, 'actions');
}

/**
 * Bug reproduction - try to trigger a specific bug
 */
async function runBugRepro(page, issueId, takeScreenshot) {
  console.log('[TestRunner] Attempting bug repro for:', issueId);

  // Record that we're starting bug repro
  await page.evaluate((id) => {
    window.testRecorder.step({
      intent: `Attempting to reproduce ${id}`,
      observation: 'Starting bug repro sequence'
    });
  }, issueId);

  // For now, run a short general playtest
  // In real usage, this would read the issue file and follow specific steps
  await runGeneralPlaytest(page, 10000, takeScreenshot);

  await page.evaluate((id) => {
    window.testRecorder.step({
      intent: `Check if ${id} is reproducible`,
      observation: 'Bug repro attempt complete - manual verification needed'
    });
  }, issueId);
}

/**
 * Feature test - test a specific new feature
 */
async function runFeatureTest(page, featureName, takeScreenshot) {
  console.log('[TestRunner] Testing feature:', featureName);

  await page.evaluate((f) => {
    window.testRecorder.step({
      intent: `Testing feature: ${f}`,
      observation: 'Starting feature test'
    });
  }, featureName);

  // Run a playtest focused on finding/using the feature
  await runGeneralPlaytest(page, 10000, takeScreenshot);

  await page.evaluate((f) => {
    window.testRecorder.step({
      intent: `Verify feature ${f} works correctly`,
      observation: 'Feature test complete - manual verification needed'
    });
  }, featureName);
}

// Run the test
runTest().catch(console.error);
