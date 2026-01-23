/**
 * Test Recorder for Iteration System v2
 *
 * This script helps record test sessions with intent + observation pairs.
 * Designed to be loaded alongside the game for manual or automated testing.
 *
 * Usage:
 *   1. Load this script after game.js
 *   2. Call testRecorder.start({ type: 'bug_repro', target: 'ISSUE-001' })
 *   3. For each action, call testRecorder.step({ intent, action, observation })
 *   4. Call testRecorder.end() to get the recording JSON
 */

window.testRecorder = {
  recording: null,
  startTime: null,

  /**
   * Start a new recording session
   * @param {Object} options
   * @param {string} options.type - 'bug_repro' | 'feature_test' | 'general_playtest'
   * @param {string} options.target - Issue ID or feature name (optional)
   * @param {string} options.iteration - Current iteration number
   */
  start: function(options = {}) {
    this.startTime = Date.now();
    this.recording = {
      metadata: {
        game: 'star-of-providence-clone',
        framework: 'canvas',
        iteration: options.iteration || 0,
        test_type: options.type || 'general_playtest',
        target: options.target || null,
        started_at: new Date().toISOString(),
        duration_ms: 0,
        agent_id: options.agent_id || 'unknown'
      },
      initial_state: {
        used_debug_commands: [],
        game_state: this._captureState()
      },
      steps: [],
      outcome: {
        success: null,
        summary: '',
        issues_found: [],
        issues_verified_fixed: []
      },
      final_state: null
    };
    console.log('[TestRecorder] Started recording:', options.type, options.target || '');
    return this.recording;
  },

  /**
   * Record a debug command usage
   * @param {string} command - Command name
   * @param {Array} args - Command arguments
   */
  recordDebugCommand: function(command, args) {
    if (!this.recording) {
      console.warn('[TestRecorder] No active recording');
      return;
    }
    this.recording.initial_state.used_debug_commands.push({ command, args });
    // Update initial state after debug commands
    this.recording.initial_state.game_state = this._captureState();
  },

  /**
   * Record a test step
   * @param {Object} step
   * @param {string} step.intent - What you're TRYING to do (player perspective)
   * @param {Object} step.action - The action taken (null for observation-only)
   * @param {string} step.observation - What actually happened
   * @param {string} step.screenshot - Screenshot filename (optional)
   */
  step: function(step) {
    if (!this.recording) {
      console.warn('[TestRecorder] No active recording');
      return;
    }
    const elapsed = Date.now() - this.startTime;
    const entry = {
      t: elapsed,
      intent: step.intent || '',
      action: step.action || null,
      duration_ms: step.duration_ms || 0,
      observation: step.observation || ''
    };
    if (step.screenshot) {
      entry.screenshot = step.screenshot;
    }
    this.recording.steps.push(entry);
    console.log('[TestRecorder] Step:', step.intent, '->', step.observation);
    return entry;
  },

  /**
   * Record a screenshot capture
   * @param {string} filename - Screenshot filename
   * @param {string} observation - What the screenshot shows
   */
  screenshot: function(filename, observation) {
    return this.step({
      intent: 'Capture screenshot',
      screenshot: filename,
      observation: observation
    });
  },

  /**
   * End the recording and return the JSON
   * @param {Object} outcome
   * @param {boolean} outcome.success - Did the test pass?
   * @param {string} outcome.summary - Brief description of what happened
   * @param {Array} outcome.issues_found - New issue IDs discovered
   * @param {Array} outcome.issues_verified_fixed - Issues confirmed fixed
   */
  end: function(outcome = {}) {
    if (!this.recording) {
      console.warn('[TestRecorder] No active recording');
      return null;
    }
    this.recording.metadata.duration_ms = Date.now() - this.startTime;
    this.recording.final_state = this._captureState();
    this.recording.outcome = {
      success: outcome.success !== undefined ? outcome.success : null,
      summary: outcome.summary || '',
      issues_found: outcome.issues_found || [],
      issues_verified_fixed: outcome.issues_verified_fixed || []
    };
    console.log('[TestRecorder] Recording complete:',
      this.recording.steps.length, 'steps,',
      this.recording.metadata.duration_ms, 'ms');
    const result = this.recording;
    this.recording = null;
    this.startTime = null;
    return result;
  },

  /**
   * Get recording as JSON string (for saving to file)
   */
  toJSON: function() {
    const rec = this.recording || this._lastRecording;
    return JSON.stringify(rec, null, 2);
  },

  /**
   * Capture current game state
   * Uses window.debugCommands.getState() if available
   */
  _captureState: function() {
    if (window.debugCommands && typeof window.debugCommands.getState === 'function') {
      try {
        return window.debugCommands.getState();
      } catch (e) {
        console.warn('[TestRecorder] getState() failed:', e.message);
      }
    }
    // Fallback: capture what we can see
    return {
      timestamp: Date.now(),
      note: 'window.debugCommands.getState() not available'
    };
  }
};

// Also expose a simple API for Playwright/automated testing
window.testAPI = {
  // Start recording
  startRecording: (type, target, iteration) =>
    window.testRecorder.start({ type, target, iteration }),

  // Execute action and record
  doAction: (intent, action, waitMs = 500) => {
    return new Promise(resolve => {
      // Execute action if debug commands available
      if (action && window.debugCommands) {
        if (action.type === 'moveDir' && action.direction) {
          // Movement would need keyboard simulation
        } else if (action.type === 'debug' && window.debugCommands[action.command]) {
          window.debugCommands[action.command](...(action.args || []));
        }
      }

      // Wait for action to complete
      setTimeout(() => {
        const state = window.testRecorder._captureState();
        const observation = JSON.stringify(state);
        window.testRecorder.step({ intent, action, duration_ms: waitMs, observation });
        resolve(state);
      }, waitMs);
    });
  },

  // End recording and return JSON
  endRecording: (success, summary, issuesFound, issuesFixed) =>
    window.testRecorder.end({ success, summary, issues_found: issuesFound, issues_verified_fixed: issuesFixed }),

  // Get full recording as string
  getRecordingJSON: () => window.testRecorder.toJSON()
};

console.log('[TestRecorder] Loaded for star-of-providence-clone. Use testRecorder.start() to begin recording.');
