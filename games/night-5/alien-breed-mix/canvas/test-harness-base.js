/**
 * Test Harness Base - Core Infrastructure
 *
 * This file provides the base test harness that all games share.
 * Games must include this file FIRST, then their own test-config.js
 * which overrides the stub functions with game-specific implementations.
 *
 * Usage in game's index.html:
 *   <script src="test-harness-base.js"></script>
 *   <script src="test-config.js"></script>
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════════

  const VISUAL_CHECK_INTERVAL = 5000; // ms - force visual check every 5 seconds
  const DEFAULT_STEP_DURATION = 500;  // ms
  const FRAME_TIME = 16.67;           // ~60fps

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL STATE
  // ═══════════════════════════════════════════════════════════════════════════

  const _state = {
    totalGameTime: 0,
    lastVisualCheckTime: 0,
    eventLog: [],
    errors: [],
    invariants: {},
    checkpoints: new Map(),
    visualChecks: [],
    coverage: {
      enemyTypesKilled: new Set(),
      itemTypesCollected: new Set(),
      roomTypesVisited: new Set(),
      actionsUsed: new Set(),
      levelsCompleted: new Set()
    },
    initialized: false
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR CAPTURE
  // ═══════════════════════════════════════════════════════════════════════════

  window.onerror = function(message, source, lineno, colno, error) {
    const errorInfo = {
      message: message,
      source: source,
      line: lineno,
      column: colno,
      stack: error ? error.stack : null
    };
    _state.errors.push(errorInfo);
    logEvent('error', errorInfo);
    return false; // Don't suppress the error
  };

  window.onunhandledrejection = function(event) {
    const errorInfo = {
      message: event.reason ? event.reason.message : 'Unhandled Promise rejection',
      stack: event.reason ? event.reason.stack : null
    };
    _state.errors.push(errorInfo);
    logEvent('error', errorInfo);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  function logEvent(type, data) {
    const event = {
      t: _state.totalGameTime,
      type: type,
      data: data || {}
    };
    _state.eventLog.push(event);

    // Track coverage based on event type
    if (type === 'enemy_killed' && data.enemyType) {
      _state.coverage.enemyTypesKilled.add(data.enemyType);
    }
    if (type === 'item_picked_up' && data.itemType) {
      _state.coverage.itemTypesCollected.add(data.itemType);
    }
    if (type === 'room_entered' && data.roomType) {
      _state.coverage.roomTypesVisited.add(data.roomType);
    }
    if (type === 'level_completed' && data.level !== undefined) {
      _state.coverage.levelsCompleted.add(data.level);
    }

    return event;
  }

  function getEvents(filter) {
    if (!filter || filter.length === 0) {
      return [..._state.eventLog];
    }
    return _state.eventLog.filter(e => filter.includes(e.type));
  }

  function clearEvents() {
    _state.eventLog = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVARIANT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  function addInvariant(name, config) {
    _state.invariants[name] = {
      check: config.check,
      message: config.message || name,
      severity: config.severity || 'error'
    };
  }

  function removeInvariant(name) {
    delete _state.invariants[name];
  }

  function checkInvariants() {
    const results = {
      passed: [],
      failed: []
    };

    for (const [name, invariant] of Object.entries(_state.invariants)) {
      try {
        const passed = invariant.check();
        if (passed) {
          results.passed.push(name);
        } else {
          results.failed.push({
            name: name,
            message: typeof invariant.message === 'function'
              ? invariant.message()
              : invariant.message,
            severity: invariant.severity
          });
        }
      } catch (e) {
        results.failed.push({
          name: name,
          message: `Invariant check threw error: ${e.message}`,
          severity: 'error'
        });
      }
    }

    return results;
  }

  // Built-in invariants
  addInvariant('screenNotBlank', {
    check: function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return true; // No canvas = not our problem
      return !isCanvasSingleColor(canvas);
    },
    message: 'Screen appears to be blank or single color'
  });

  addInvariant('noNaNPositions', {
    check: function() {
      try {
        const vision = window.testHarness.getVision();
        if (vision.player) {
          if (isNaN(vision.player.x) || isNaN(vision.player.y)) return false;
        }
        for (const entity of vision.visibleEntities || []) {
          if (isNaN(entity.x) || isNaN(entity.y)) return false;
        }
        return true;
      } catch (e) {
        return true; // Can't check if getVision not implemented
      }
    },
    message: 'Found NaN in entity positions'
  });

  addInvariant('noErrors', {
    check: function() {
      return _state.errors.length === 0;
    },
    message: function() {
      return `${_state.errors.length} JavaScript error(s) occurred`;
    },
    severity: 'error'
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VISUAL CHECK SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  function addVisualCheck(checkFn) {
    _state.visualChecks.push(checkFn);
  }

  function generateVisualCheckPrompt() {
    const checks = [];
    let vision;

    try {
      vision = window.testHarness.getVision();
    } catch (e) {
      vision = null;
    }

    // Base checks
    checks.push({
      id: 'screen_rendering',
      question: 'Is the game screen rendering correctly (not black, not corrupted)?',
      context: 'Check for visual artifacts, missing textures, or rendering errors'
    });

    if (vision && vision.player) {
      checks.push({
        id: 'player_visible',
        question: `Is the player visible at approximately (${Math.round(vision.player.x)}, ${Math.round(vision.player.y)})?`,
        context: `Player should have ${vision.player.health}/${vision.player.maxHealth} health`
      });
    }

    if (vision && vision.visibleEntities && vision.visibleEntities.length > 0) {
      const enemies = vision.visibleEntities.filter(e => e.type === 'enemy');
      if (enemies.length > 0) {
        checks.push({
          id: 'enemies_visible',
          question: `Are ${enemies.length} enemies visible on screen?`,
          context: `Enemy types: ${[...new Set(enemies.map(e => e.subtype))].join(', ')}`
        });
      }
    }

    if (vision && vision.ui) {
      checks.push({
        id: 'ui_correct',
        question: 'Does the UI display match the expected values?',
        context: `Expected UI state: ${JSON.stringify(vision.ui)}`
      });
    }

    // Run game-specific visual checks
    for (const checkFn of _state.visualChecks) {
      try {
        const additionalChecks = checkFn(vision);
        if (additionalChecks && additionalChecks.length) {
          checks.push(...additionalChecks);
        }
      } catch (e) {
        // Ignore failed custom checks
      }
    }

    return {
      instruction: 'VISUAL VERIFICATION REQUIRED. Analyze the screenshot and answer EACH check. Do NOT proceed without answering.',
      checks: checks,
      respondFormat: {
        screenOK: 'boolean - overall screen looks correct',
        checksResults: 'array of {check: id, result: "pass"|"fail"|"unclear", note?: string}',
        concerns: 'string describing any visual concerns, or null if none'
      }
    };
  }

  function describePosition(x, y) {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'unknown position';

    const w = canvas.width;
    const h = canvas.height;

    let horizontal = 'center';
    if (x < w * 0.33) horizontal = 'left';
    else if (x > w * 0.67) horizontal = 'right';

    let vertical = 'middle';
    if (y < h * 0.33) vertical = 'top';
    else if (y > h * 0.67) vertical = 'bottom';

    return `${vertical}-${horizontal} (${Math.round(x)}, ${Math.round(y)})`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREENSHOT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  function getScreenshot() {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.warn('testHarness.getScreenshot: No canvas found');
      return null;
    }
    try {
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('testHarness.getScreenshot: Failed to capture', e);
      return null;
    }
  }

  function isCanvasSingleColor(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample pixels at different locations
      const samples = [
        0, // top-left
        (Math.floor(canvas.width / 2) + Math.floor(canvas.height / 2) * canvas.width) * 4, // center
        (canvas.width - 1 + (canvas.height - 1) * canvas.width) * 4, // bottom-right
        (Math.floor(canvas.width / 2)) * 4, // top-center
        ((canvas.height - 1) * canvas.width + Math.floor(canvas.width / 2)) * 4 // bottom-center
      ];

      const firstR = data[0], firstG = data[1], firstB = data[2];

      for (const idx of samples) {
        if (data[idx] !== firstR || data[idx + 1] !== firstG || data[idx + 2] !== firstB) {
          return false;
        }
      }
      return true;
    } catch (e) {
      return false; // Can't check, assume not single color
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECKPOINT SYSTEM (stubs - games must implement serialization)
  // ═══════════════════════════════════════════════════════════════════════════

  function saveCheckpoint(name) {
    // Base implementation - games should override _serializeGameState
    try {
      const state = window.testHarness._serializeGameState();
      _state.checkpoints.set(name, {
        gameState: state,
        harnessState: {
          totalGameTime: _state.totalGameTime,
          eventLog: [..._state.eventLog],
          coverage: {
            enemyTypesKilled: new Set(_state.coverage.enemyTypesKilled),
            itemTypesCollected: new Set(_state.coverage.itemTypesCollected),
            roomTypesVisited: new Set(_state.coverage.roomTypesVisited),
            actionsUsed: new Set(_state.coverage.actionsUsed),
            levelsCompleted: new Set(_state.coverage.levelsCompleted)
          }
        },
        timestamp: Date.now()
      });
      logEvent('checkpoint_saved', { name: name });
      return name;
    } catch (e) {
      console.error('saveCheckpoint failed:', e);
      return null;
    }
  }

  function loadCheckpoint(name) {
    const checkpoint = _state.checkpoints.get(name);
    if (!checkpoint) {
      console.warn('Checkpoint not found:', name);
      return false;
    }

    try {
      window.testHarness._deserializeGameState(checkpoint.gameState);
      _state.totalGameTime = checkpoint.harnessState.totalGameTime;
      _state.eventLog = [...checkpoint.harnessState.eventLog];
      _state.coverage = {
        enemyTypesKilled: new Set(checkpoint.harnessState.coverage.enemyTypesKilled),
        itemTypesCollected: new Set(checkpoint.harnessState.coverage.itemTypesCollected),
        roomTypesVisited: new Set(checkpoint.harnessState.coverage.roomTypesVisited),
        actionsUsed: new Set(checkpoint.harnessState.coverage.actionsUsed),
        levelsCompleted: new Set(checkpoint.harnessState.coverage.levelsCompleted)
      };
      logEvent('checkpoint_loaded', { name: name });
      return true;
    } catch (e) {
      console.error('loadCheckpoint failed:', e);
      return false;
    }
  }

  function listCheckpoints() {
    return Array.from(_state.checkpoints.keys());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BREAK CONDITION EVALUATION
  // ═══════════════════════════════════════════════════════════════════════════

  function evaluateBreakCondition(condition, stepStartTime, stepEvents) {
    if (!condition) return { shouldBreak: false };

    // Handle OR conditions
    if (condition.or) {
      for (const c of condition.or) {
        const result = evaluateSingleCondition(c, stepStartTime, stepEvents);
        if (result.shouldBreak) return result;
      }
      return { shouldBreak: false };
    }

    // Handle AND conditions
    if (condition.and) {
      const results = condition.and.map(c => evaluateSingleCondition(c, stepStartTime, stepEvents));
      if (results.every(r => r.shouldBreak)) {
        return { shouldBreak: true, reason: results.map(r => r.reason).join(' AND ') };
      }
      return { shouldBreak: false };
    }

    // Handle custom function
    if (condition.custom && typeof condition.custom === 'function') {
      try {
        if (condition.custom()) {
          return { shouldBreak: true, reason: 'Custom condition met' };
        }
      } catch (e) {
        console.error('Custom break condition threw:', e);
      }
      return { shouldBreak: false };
    }

    // Single condition string
    if (condition.condition) {
      return evaluateSingleCondition(condition.condition, stepStartTime, stepEvents);
    }

    return { shouldBreak: false };
  }

  function evaluateSingleCondition(conditionStr, stepStartTime, stepEvents) {
    try {
      const vision = window.testHarness.getVision();

      // playerDied
      if (conditionStr === 'playerDied') {
        if (!vision.player || vision.player.health <= 0) {
          return { shouldBreak: true, reason: 'Player died' };
        }
      }

      // allEnemiesKilled
      if (conditionStr === 'allEnemiesKilled') {
        const enemies = (vision.visibleEntities || []).filter(e => e.type === 'enemy');
        if (enemies.length === 0) {
          return { shouldBreak: true, reason: 'All enemies killed' };
        }
      }

      // roomCleared
      if (conditionStr === 'roomCleared') {
        if (stepEvents.some(e => e.type === 'room_cleared')) {
          return { shouldBreak: true, reason: 'Room cleared' };
        }
      }

      // enemyKilled:ID
      if (conditionStr.startsWith('enemyKilled:')) {
        const targetId = conditionStr.split(':')[1];
        if (stepEvents.some(e => e.type === 'enemy_killed' && e.data.id === targetId)) {
          return { shouldBreak: true, reason: `Enemy ${targetId} killed` };
        }
      }

      // playerReached:X,Y
      if (conditionStr.startsWith('playerReached:')) {
        const [x, y] = conditionStr.split(':')[1].split(',').map(Number);
        if (vision.player) {
          const dist = Math.sqrt(Math.pow(vision.player.x - x, 2) + Math.pow(vision.player.y - y, 2));
          if (dist < 20) {
            return { shouldBreak: true, reason: `Player reached (${x}, ${y})` };
          }
        }
      }

      // eventOccurred:TYPE
      if (conditionStr.startsWith('eventOccurred:')) {
        const eventType = conditionStr.split(':')[1];
        if (stepEvents.some(e => e.type === eventType)) {
          return { shouldBreak: true, reason: `Event ${eventType} occurred` };
        }
      }

      // timeElapsed:MS (relative to step start)
      if (conditionStr.startsWith('timeElapsed:')) {
        const targetMs = parseInt(conditionStr.split(':')[1]);
        if (_state.totalGameTime - stepStartTime >= targetMs) {
          return { shouldBreak: true, reason: `${targetMs}ms elapsed` };
        }
      }

    } catch (e) {
      console.error('Break condition evaluation error:', e);
    }

    return { shouldBreak: false };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN STEP FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════

  function step(config) {
    const startTime = _state.totalGameTime;
    const duration = config.duration || DEFAULT_STEP_DURATION;
    const actions = config.actions || [];
    const logEvents = config.logEvents || null; // null = all events
    const breakOn = config.breakOn || null;
    const shouldCheckInvariants = config.checkInvariants !== false;
    const captureScreenshot = config.captureScreenshot || false;

    // Clear step-specific events
    const stepStartEventIndex = _state.eventLog.length;

    // Track action for coverage
    for (const action of actions) {
      _state.coverage.actionsUsed.add(action.type);
    }

    // Execute actions
    for (const action of actions) {
      try {
        window.testHarness._executeAction(action);
        logEvent('action_executed', { action: action });
      } catch (e) {
        logEvent('action_failed', { action: action, error: e.message });
      }
    }

    // Simulate time passing (frame by frame)
    let elapsed = 0;
    let stoppedEarly = false;
    let stopReason = null;

    while (elapsed < duration) {
      const frameTime = Math.min(FRAME_TIME, duration - elapsed);

      // Advance game time
      try {
        window.testHarness._advanceTime(frameTime);
      } catch (e) {
        // Game might not implement _advanceTime - that's OK
      }

      _state.totalGameTime += frameTime;
      elapsed += frameTime;

      // Check break conditions
      if (breakOn) {
        const stepEvents = _state.eventLog.slice(stepStartEventIndex);
        const breakResult = evaluateBreakCondition(breakOn, startTime, stepEvents);
        if (breakResult.shouldBreak) {
          stoppedEarly = true;
          stopReason = breakResult.reason;
          break;
        }
      }
    }

    // Get step events
    let stepEvents = _state.eventLog.slice(stepStartEventIndex);
    if (logEvents && logEvents.length > 0) {
      stepEvents = stepEvents.filter(e => logEvents.includes(e.type));
    }

    // Check invariants
    let invariantResults = { passed: [], failed: [] };
    if (shouldCheckInvariants) {
      invariantResults = checkInvariants();
    }

    // Visual check logic
    const timeSinceVisualCheck = _state.totalGameTime - _state.lastVisualCheckTime;
    const visualCheckRequired = timeSinceVisualCheck >= VISUAL_CHECK_INTERVAL ||
                                 invariantResults.failed.length > 0;

    let screenshot = null;
    let visualCheckPrompt = null;

    if (visualCheckRequired || captureScreenshot) {
      screenshot = getScreenshot();
      if (visualCheckRequired) {
        visualCheckPrompt = generateVisualCheckPrompt();
        _state.lastVisualCheckTime = _state.totalGameTime;
      }
    }

    // Get current vision
    let vision;
    try {
      vision = window.testHarness.getVision();
    } catch (e) {
      vision = { error: e.message };
    }

    // Build result
    const result = {
      events: stepEvents,
      vision: vision,
      actualDuration: elapsed,
      stoppedEarly: stoppedEarly,
      stopReason: stopReason,
      invariants: invariantResults,
      ok: invariantResults.failed.length === 0 && _state.errors.length === 0,
      errors: _state.errors.map(e => e.message)
    };

    if (visualCheckRequired) {
      result.VISUAL_CHECK_REQUIRED = true;
      result.visualCheckPrompt = visualCheckPrompt;
    }

    if (screenshot) {
      result.screenshot = screenshot;
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELF-VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  function verifyHarness() {
    const checks = [];

    // Check getVision is implemented
    try {
      const vision = window.testHarness.getVision();
      checks.push({
        name: 'getVision',
        passed: vision && typeof vision === 'object',
        error: vision && typeof vision === 'object' ? null : 'getVision did not return an object'
      });
    } catch (e) {
      checks.push({
        name: 'getVision',
        passed: false,
        error: e.message
      });
    }

    // Check getGameInfo is implemented
    try {
      const info = window.testHarness.getGameInfo();
      checks.push({
        name: 'getGameInfo',
        passed: info && info.name && info.actions,
        error: info && info.name ? null : 'getGameInfo missing required fields'
      });
    } catch (e) {
      checks.push({
        name: 'getGameInfo',
        passed: false,
        error: e.message
      });
    }

    // Check screenshot works
    try {
      const ss = getScreenshot();
      checks.push({
        name: 'getScreenshot',
        passed: ss === null || (typeof ss === 'string' && ss.startsWith('data:image/png')),
        error: null
      });
    } catch (e) {
      checks.push({
        name: 'getScreenshot',
        passed: false,
        error: e.message
      });
    }

    // Check event logging works
    try {
      const testEvent = logEvent('harness_test', { test: true });
      checks.push({
        name: 'logEvent',
        passed: testEvent && testEvent.type === 'harness_test',
        error: null
      });
      // Remove test event
      _state.eventLog = _state.eventLog.filter(e => e.type !== 'harness_test');
    } catch (e) {
      checks.push({
        name: 'logEvent',
        passed: false,
        error: e.message
      });
    }

    // Check _executeAction exists
    try {
      const hasExecute = typeof window.testHarness._executeAction === 'function';
      checks.push({
        name: '_executeAction',
        passed: hasExecute,
        error: hasExecute ? null : '_executeAction is not a function'
      });
    } catch (e) {
      checks.push({
        name: '_executeAction',
        passed: false,
        error: e.message
      });
    }

    return {
      allPassed: checks.every(c => c.passed),
      checks: checks,
      timestamp: Date.now()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════

  function getCoverage() {
    let gameInfo;
    try {
      gameInfo = window.testHarness.getGameInfo();
    } catch (e) {
      gameInfo = { entityTypes: {}, actions: {} };
    }

    const allEnemyTypes = gameInfo.entityTypes?.enemies || [];
    const allItemTypes = gameInfo.entityTypes?.pickups || [];
    const allRoomTypes = gameInfo.entityTypes?.rooms || [];
    const allActions = Object.keys(gameInfo.actions || {});

    const enemyTypesKilled = Array.from(_state.coverage.enemyTypesKilled);
    const itemTypesCollected = Array.from(_state.coverage.itemTypesCollected);
    const roomTypesVisited = Array.from(_state.coverage.roomTypesVisited);
    const actionsUsed = Array.from(_state.coverage.actionsUsed);

    // Calculate overall coverage
    let totalItems = allEnemyTypes.length + allItemTypes.length + allRoomTypes.length + allActions.length;
    let coveredItems = enemyTypesKilled.length + itemTypesCollected.length + roomTypesVisited.length + actionsUsed.length;
    let overallCoverage = totalItems > 0 ? (coveredItems / totalItems) * 100 : 0;

    return {
      enemyTypesKilled: enemyTypesKilled,
      enemyTypesNotKilled: allEnemyTypes.filter(t => !_state.coverage.enemyTypesKilled.has(t)),
      itemTypesCollected: itemTypesCollected,
      itemTypesNotCollected: allItemTypes.filter(t => !_state.coverage.itemTypesCollected.has(t)),
      roomTypesVisited: roomTypesVisited,
      roomTypesNotVisited: allRoomTypes.filter(t => !_state.coverage.roomTypesVisited.has(t)),
      actionsUsed: actionsUsed,
      actionsNotUsed: allActions.filter(t => !_state.coverage.actionsUsed.has(t)),
      levelsCompleted: Array.from(_state.coverage.levelsCompleted),
      overallCoverage: Math.round(overallCoverage)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUB FUNCTIONS (games MUST override these)
  // ═══════════════════════════════════════════════════════════════════════════

  function stubNotImplemented(name) {
    return function() {
      throw new Error(`testHarness.${name}() must be implemented by the game's test-config.js`);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT TO WINDOW
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness = {
    // Main step function
    step: step,

    // Information
    getVision: stubNotImplemented('getVision'),
    getGameInfo: stubNotImplemented('getGameInfo'),
    getEventTypes: function() {
      return {
        combat: ['bullet_fired', 'bullet_hit', 'damage_dealt', 'damage_taken', 'enemy_killed', 'player_died'],
        movement: ['player_moved', 'player_reached_target', 'collision'],
        progression: ['room_cleared', 'door_opened', 'room_entered', 'level_completed'],
        items: ['item_picked_up', 'item_used'],
        state: ['health_changed', 'scene_changed'],
        errors: ['error', 'warning', 'render_issue'],
        harness: ['checkpoint_saved', 'checkpoint_loaded', 'action_executed', 'action_failed']
      };
    },
    getCoverage: getCoverage,

    // Screenshots
    getScreenshot: getScreenshot,

    // Checkpoints
    saveCheckpoint: saveCheckpoint,
    loadCheckpoint: loadCheckpoint,
    listCheckpoints: listCheckpoints,

    // Harness health
    verifyHarness: verifyHarness,

    // Testing utilities (stubs)
    spawnForTesting: stubNotImplemented('spawnForTesting'),
    clearRoom: stubNotImplemented('clearRoom'),
    setPlayerPosition: stubNotImplemented('setPlayerPosition'),

    // Event system (for game to use)
    logEvent: logEvent,
    getEvents: getEvents,
    clearEvents: clearEvents,

    // Invariants (for game to use)
    addInvariant: addInvariant,
    removeInvariant: removeInvariant,
    _checkInvariants: checkInvariants,

    // Visual checks (for game to use)
    addVisualCheck: addVisualCheck,

    // Internal state (read-only access)
    get _totalGameTime() { return _state.totalGameTime; },
    get _eventLog() { return _state.eventLog; },
    get _errors() { return _state.errors; },

    // Internal functions (for game to override)
    _executeAction: stubNotImplemented('_executeAction'),
    _advanceTime: function(ms) { /* default: no-op */ },
    _serializeGameState: stubNotImplemented('_serializeGameState'),
    _deserializeGameState: stubNotImplemented('_deserializeGameState'),

    // Utilities
    _describePosition: describePosition,
    _isCanvasSingleColor: isCanvasSingleColor
  };

  // Mark as initialized
  _state.initialized = true;
  console.log('[TestHarness] Base harness loaded. Game must provide test-config.js');

})();
