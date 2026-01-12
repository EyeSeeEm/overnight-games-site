/**
 * Test Config - Station Breach (Alien Breed Mix)
 *
 * Game-specific test harness configuration.
 * Implements all required functions from test-harness-base.js
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY HARNESS IS LOADED
  // ═══════════════════════════════════════════════════════════════════════════

  if (!window.testHarness) {
    console.error('[StationBreachConfig] ERROR: test-harness-base.js must be loaded before test-config.js');
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: Key simulation
  // ═══════════════════════════════════════════════════════════════════════════

  const _heldKeys = new Set();

  function getKeysObj() {
    return window.getKeys ? window.getKeys() : {};
  }

  function pressKey(key) {
    const lowerKey = key.toLowerCase();
    const keys = getKeysObj();
    if (keys) keys[lowerKey] = true;
    _heldKeys.add(lowerKey);
  }

  function releaseKey(key) {
    const lowerKey = key.toLowerCase();
    const keys = getKeysObj();
    if (keys) keys[lowerKey] = false;
    _heldKeys.delete(lowerKey);
  }

  function releaseAllKeys() {
    const keys = getKeysObj();
    for (const key of _heldKeys) {
      if (keys) keys[key] = false;
    }
    _heldKeys.clear();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: getGameInfo()
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.getGameInfo = function() {
    return {
      name: 'Station Breach (Alien Breed Mix)',
      genre: 'top-down-shooter',

      actions: {
        moveTo: {
          description: 'Move player toward position',
          parameters: ['x', 'y']
        },
        moveDir: {
          description: 'Move player in direction',
          parameters: ['direction']  // 'north', 'south', 'east', 'west'
        },
        stop: {
          description: 'Stop all movement',
          parameters: []
        },
        shoot: {
          description: 'Fire weapon',
          parameters: []
        },
        reload: {
          description: 'Reload current weapon',
          parameters: []
        },
        switchWeapon: {
          description: 'Switch to next weapon',
          parameters: []
        },
        interact: {
          description: 'Interact with door/pickup',
          parameters: []
        },
        sprint: {
          description: 'Toggle sprinting',
          parameters: ['enabled']
        },
        useMedkit: {
          description: 'Use medkit',
          parameters: []
        },
        melee: {
          description: 'Melee attack (fallback)',
          parameters: []
        }
      },

      entityTypes: {
        enemies: [
          'drone', 'spitter', 'lurker', 'brute', 'exploder', 'matriarch', 'eliteDrone'
        ],
        pickups: [
          'health', 'credits', 'ammo', 'keycard', 'weapon', 'barrel'
        ],
        doors: [
          'normal', 'green', 'blue', 'yellow', 'red'
        ],
        rooms: [
          'start', 'normal', 'keycard', 'exit'
        ]
      },

      recommendedStepMs: 500,

      winCondition: 'Escape through the final exit before self-destruct timer expires',
      loseCondition: 'Player health reaches 0 or self-destruct timer expires',

      testableScenarios: [
        'Basic movement (WASD)',
        'Mouse aiming and shooting',
        'Killing each enemy type',
        'Taking damage from enemies',
        'Collecting pickups (health, credits, ammo, keycards)',
        'Opening doors (regular and keycard-locked)',
        'Room transitions',
        'Clearing rooms (doors unlock)',
        'Weapon switching and reloading',
        'Sprinting and stamina management',
        'Vision/raycasting system',
        'Self-destruct timer (Deck 4)'
      ]
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: getVision()
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.getVision = function() {
    const canvas = document.getElementById('game');
    const viewport = {
      x: 0,
      y: 0,
      width: canvas ? canvas.width : 1280,
      height: canvas ? canvas.height : 720
    };

    // Get game state from exposed getters
    const player = window.getPlayer ? window.getPlayer() : null;
    const enemies = window.getEnemies ? window.getEnemies() : [];
    const pickups = window.getPickups ? window.getPickups() : [];
    const doors = window.getDoors ? window.getDoors() : [];
    const rooms = window.getRooms ? window.getRooms() : [];
    const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;
    const currentDeck = window.getCurrentDeck ? window.getCurrentDeck() : 1;
    const gameStateStr = window.getGameState ? window.getGameState() : 'unknown';

    // Player state
    let playerVision = null;
    if (player && gameStateStr === 'playing') {
      playerVision = {
        x: player.x,
        y: player.y,
        angle: player.angle,
        health: player.hp,
        maxHealth: player.maxHp,
        shield: player.shield,
        maxShield: player.maxShield,
        stamina: player.stamina,
        maxStamina: player.maxStamina,
        credits: player.credits,
        currentWeapon: player.weaponName,
        currentMag: player.currentMag,
        reloading: player.reloading,
        sprinting: player.sprinting,
        keycards: { ...player.keycards },
        godMode: player.godMode
      };
    }

    // Visible entities
    const visibleEntities = [];

    // Enemies
    for (const enemy of enemies) {
      visibleEntities.push({
        id: enemy.id,
        type: 'enemy',
        subtype: enemy.type,
        x: enemy.x,
        y: enemy.y,
        health: enemy.hp,
        maxHealth: enemy.maxHp,
        state: enemy.stunned ? 'stunned' : (enemy.charging ? 'charging' : (enemy.alerted ? 'alerted' : 'idle'))
      });
    }

    // Pickups
    for (const pickup of pickups) {
      visibleEntities.push({
        id: `pickup_${pickup.type}_${Math.round(pickup.x)}_${Math.round(pickup.y)}`,
        type: 'pickup',
        subtype: pickup.type,
        x: pickup.x,
        y: pickup.y,
        value: pickup.value,
        keycard: pickup.keycard,
        ammoType: pickup.ammoType
      });
    }

    // Doors
    for (const door of doors) {
      visibleEntities.push({
        id: `door_${Math.round(door.x)}_${Math.round(door.y)}`,
        type: 'door',
        subtype: door.keycardRequired || 'normal',
        x: door.x + door.w / 2,
        y: door.y + door.h / 2,
        state: door.open ? 'open' : 'closed',
        keycardRequired: door.keycardRequired
      });
    }

    // Scene state
    let scene = gameStateStr;

    // UI state
    const ui = {};
    if (player) {
      ui.health = player.hp;
      ui.maxHealth = player.maxHp;
      ui.shield = player.shield;
      ui.credits = player.credits;
      ui.deck = currentDeck;
      ui.weapon = player.weaponName;
      ui.ammo = player.currentMag;
      ui.reloading = player.reloading;
    }

    // Available actions
    const availableActions = ['stop'];
    if (scene === 'playing' && playerVision) {
      availableActions.push('moveTo', 'moveDir', 'shoot', 'reload', 'switchWeapon', 'interact', 'sprint', 'melee');
      if (player.medkits > 0) {
        availableActions.push('useMedkit');
      }
    }

    // Context
    const context = {
      deck: currentDeck,
      roomType: currentRoom ? currentRoom.type : 'unknown',
      roomCleared: currentRoom ? currentRoom.cleared : false,
      enemyCount: enemies.length,
      selfDestructActive: window.selfDestructActive || false
    };

    return {
      viewport: viewport,
      player: playerVision,
      visibleEntities: visibleEntities,
      ui: ui,
      availableActions: availableActions,
      scene: scene,
      context: context
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: _executeAction()
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness._executeAction = function(action) {
    const player = window.getPlayer ? window.getPlayer() : null;

    switch (action.type) {

      case 'moveTo': {
        if (!player) return;

        const dx = action.x - player.x;
        const dy = action.y - player.y;

        releaseAllKeys();

        if (Math.abs(dx) > 5) {
          if (dx > 0) pressKey('d');
          else pressKey('a');
        }
        if (Math.abs(dy) > 5) {
          if (dy > 0) pressKey('s');
          else pressKey('w');
        }

        window.testHarness.logEvent('action_move_to', {
          targetX: action.x,
          targetY: action.y
        });
        break;
      }

      case 'moveDir': {
        releaseAllKeys();

        const dirMap = {
          'north': 'w', 'up': 'w',
          'south': 's', 'down': 's',
          'east': 'd', 'right': 'd',
          'west': 'a', 'left': 'a'
        };
        const key = dirMap[action.direction];
        if (key) pressKey(key);
        break;
      }

      case 'stop': {
        releaseAllKeys();
        break;
      }

      case 'shoot': {
        // Simulate mouse down
        const canvas = document.getElementById('game');
        if (canvas) {
          const event = new MouseEvent('mousedown', {
            button: 0,
            clientX: canvas.width / 2 + 100,
            clientY: canvas.height / 2
          });
          canvas.dispatchEvent(event);

          setTimeout(() => {
            const upEvent = new MouseEvent('mouseup', { button: 0 });
            canvas.dispatchEvent(upEvent);
          }, 100);
        }

        window.testHarness.logEvent('action_shoot', {});
        break;
      }

      case 'reload': {
        pressKey('r');
        setTimeout(() => releaseKey('r'), 100);
        window.testHarness.logEvent('action_reload', {});
        break;
      }

      case 'switchWeapon': {
        pressKey('q');
        setTimeout(() => releaseKey('q'), 100);
        window.testHarness.logEvent('action_switch_weapon', {});
        break;
      }

      case 'interact': {
        pressKey(' ');
        setTimeout(() => releaseKey(' '), 100);
        window.testHarness.logEvent('action_interact', {});
        break;
      }

      case 'sprint': {
        if (action.enabled) {
          pressKey('shift');
        } else {
          releaseKey('shift');
        }
        break;
      }

      case 'useMedkit': {
        pressKey('h');
        setTimeout(() => releaseKey('h'), 100);
        window.testHarness.logEvent('action_use_medkit', {});
        break;
      }

      case 'melee': {
        pressKey('v');
        setTimeout(() => releaseKey('v'), 100);
        window.testHarness.logEvent('action_melee', {});
        break;
      }

      case 'pressKey': {
        pressKey(action.key);
        if (action.duration) {
          setTimeout(() => releaseKey(action.key), action.duration);
        }
        break;
      }

      default:
        console.warn(`[StationBreachConfig] Unknown action type: ${action.type}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: Testing Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.spawnForTesting = function(type, subtype, x, y) {
    if (type === 'enemy' && window.debugCommands && window.debugCommands.spawnEnemy) {
      return window.debugCommands.spawnEnemy(subtype, x, y);
    }
    throw new Error(`Cannot spawn type: ${type}`);
  };

  window.testHarness.clearRoom = function() {
    if (window.debugCommands && window.debugCommands.clearRoom) {
      window.debugCommands.clearRoom();
    }
  };

  window.testHarness.setPlayerPosition = function(x, y) {
    const player = window.getPlayer ? window.getPlayer() : null;
    if (player) {
      player.x = x;
      player.y = y;
      window.testHarness.logEvent('test_teleport', { toX: x, toY: y });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: Checkpoint Serialization
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness._serializeGameState = function() {
    const player = window.getPlayer ? window.getPlayer() : null;

    return {
      gameState: window.getGameState ? window.getGameState() : 'unknown',
      player: player ? {
        x: player.x,
        y: player.y,
        hp: player.hp,
        maxHp: player.maxHp,
        shield: player.shield,
        stamina: player.stamina,
        credits: player.credits,
        weapons: [...player.weapons],
        currentWeapon: player.currentWeapon,
        ammo: { ...player.ammo },
        keycards: { ...player.keycards },
        currentMag: player.currentMag
      } : null,
      currentDeck: window.getCurrentDeck ? window.getCurrentDeck() : 1,
      enemies: (window.getEnemies ? window.getEnemies() : []).map(e => ({
        type: e.type,
        x: e.x,
        y: e.y,
        hp: e.hp,
        alerted: e.alerted
      })),
      pickups: (window.getPickups ? window.getPickups() : []).map(p => ({ ...p }))
    };
  };

  window.testHarness._deserializeGameState = function(state) {
    const player = window.getPlayer ? window.getPlayer() : null;

    if (state.player && player) {
      Object.assign(player, state.player);
      player.weapons = [...state.player.weapons];
      player.ammo = { ...state.player.ammo };
      player.keycards = { ...state.player.keycards };
    }

    // Note: Full deserialization would require regenerating level state
    console.log('[StationBreachConfig] State partially restored');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME-SPECIFIC INVARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.addInvariant('playerHealthValid', {
    check: function() {
      const player = window.getPlayer ? window.getPlayer() : null;
      const gameState = window.getGameState ? window.getGameState() : 'unknown';
      if (!player || gameState !== 'playing') return true;
      return player.hp >= 0 && player.hp <= player.maxHp;
    },
    message: function() {
      const player = window.getPlayer ? window.getPlayer() : null;
      if (!player) return 'No player';
      return `Player health ${player.hp} out of range [0, ${player.maxHp}]`;
    }
  });

  window.testHarness.addInvariant('playerInBounds', {
    check: function() {
      const player = window.getPlayer ? window.getPlayer() : null;
      const gameState = window.getGameState ? window.getGameState() : 'unknown';
      if (!player || gameState !== 'playing') return true;

      // Player should be within some reasonable bounds
      return player.x > -1000 && player.x < 10000 &&
             player.y > -1000 && player.y < 10000;
    },
    message: function() {
      const player = window.getPlayer ? window.getPlayer() : null;
      if (!player) return 'No player';
      return `Player out of bounds at (${player.x}, ${player.y})`;
    }
  });

  window.testHarness.addInvariant('noNegativeResources', {
    check: function() {
      const player = window.getPlayer ? window.getPlayer() : null;
      if (!player) return true;
      return player.credits >= 0 && player.stamina >= 0 && player.currentMag >= 0;
    },
    message: function() {
      const player = window.getPlayer ? window.getPlayer() : null;
      if (!player) return 'No player';
      return `Negative resources: credits=${player.credits}, stamina=${player.stamina}, mag=${player.currentMag}`;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME-SPECIFIC VISUAL CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.addVisualCheck(function(vision) {
    const checks = [];

    if (vision.player) {
      checks.push({
        id: 'health_display',
        question: `Does the health bar show ${Math.ceil(vision.player.health)}/${vision.player.maxHealth}?`,
        context: 'Health bar should be in top-left corner'
      });

      checks.push({
        id: 'weapon_display',
        question: `Does the UI show the ${vision.player.currentWeapon} weapon?`,
        context: `Ammo should show ${vision.player.currentMag} rounds`
      });
    }

    const enemies = (vision.visibleEntities || []).filter(e => e.type === 'enemy');
    if (enemies.length > 0) {
      checks.push({
        id: 'enemies_visible',
        question: `Are ${enemies.length} enemies visible on screen?`,
        context: `Types: ${[...new Set(enemies.map(e => e.subtype))].join(', ')}`
      });
    }

    if (vision.context?.deck === 4) {
      checks.push({
        id: 'self_destruct_timer',
        question: 'Is the self-destruct timer visible at the top of the screen?',
        context: 'Timer should show remaining time in MM:SS format'
      });
    }

    return checks;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  // Watch for player damage
  let lastPlayerHealth = null;
  setInterval(function() {
    const player = window.getPlayer ? window.getPlayer() : null;
    if (!player) return;

    if (lastPlayerHealth !== null && player.hp < lastPlayerHealth) {
      window.testHarness.logEvent('player_damaged', {
        oldHealth: lastPlayerHealth,
        newHealth: player.hp,
        damage: lastPlayerHealth - player.hp
      });
    }
    lastPlayerHealth = player.hp;
  }, 50);

  // Watch for game state changes
  let lastGameState = null;
  setInterval(function() {
    const gameState = window.getGameState ? window.getGameState() : null;
    if (gameState !== lastGameState) {
      window.testHarness.logEvent('game_state_changed', {
        from: lastGameState,
        to: gameState
      });
      lastGameState = gameState;
    }
  }, 100);

  // Watch for deck changes
  let lastDeck = null;
  setInterval(function() {
    const currentDeck = window.getCurrentDeck ? window.getCurrentDeck() : null;
    if (currentDeck !== lastDeck && lastDeck !== null) {
      window.testHarness.logEvent('deck_changed', {
        from: lastDeck,
        to: currentDeck
      });
    }
    lastDeck = currentDeck;
  }, 100);

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('[StationBreachConfig] Station Breach test configuration loaded');

  // Auto-verify harness on load
  setTimeout(function() {
    const result = window.testHarness.verifyHarness();
    if (result.allPassed) {
      console.log('[StationBreachConfig] Harness verification PASSED');
    } else {
      console.warn('[StationBreachConfig] Harness verification FAILED:');
      for (const check of result.checks) {
        if (!check.passed) {
          console.warn(`  - ${check.name}: ${check.error}`);
        }
      }
    }
  }, 1000);

})();
