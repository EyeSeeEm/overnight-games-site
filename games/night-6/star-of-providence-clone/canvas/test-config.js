/**
 * Test Configuration for Star of Providence Clone
 *
 * This file implements the game-specific test harness functions
 * required by test-harness-base.js
 */

(function() {
  'use strict';

  // Wait for game to be ready
  const waitForGame = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (window.getPlayer && window.getEnemies && window.getGameState) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  waitForGame().then(() => {
    console.log('[TestConfig] Game detected, configuring harness...');

    // ═══════════════════════════════════════════════════════════════════════════
    // GET VISION - Returns current game state for testing
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.getVision = function() {
      const player = window.getPlayer();
      const enemies = window.getEnemies();
      const projectiles = window.getProjectiles();
      const pickups = window.getPickups();
      const gameState = window.getGameState();
      const currentRoom = window.getCurrentRoom();
      const currentFloor = window.getCurrentFloor();
      const floorMap = window.getFloorMap();

      const vision = {
        gameState: gameState,
        player: null,
        visibleEntities: [],
        projectiles: {
          player: [],
          enemy: []
        },
        pickups: [],
        room: null,
        floor: currentFloor,
        ui: {}
      };

      // Player info
      if (player) {
        vision.player = {
          x: player.x,
          y: player.y,
          health: player.hp,
          maxHealth: player.maxHP,
          shields: player.shields,
          maxShields: player.maxShields,
          ammo: player.ammo,
          maxAmmo: player.maxAmmo,
          bombs: player.bombs,
          maxBombs: player.maxBombs,
          debris: player.debris,
          multiplier: player.multiplier,
          weapon: player.currentWeapon ? player.currentWeapon.name : 'Unknown',
          isInvincible: player.isInvincible,
          isDashing: player.isDashing,
          isFocused: player.isFocused
        };

        vision.ui = {
          health: `${player.hp}/${player.maxHP}`,
          shields: `${player.shields}/${player.maxShields}`,
          ammo: player.currentWeapon && player.currentWeapon.maxAmmo !== Infinity
            ? `${Math.floor(player.ammo)}/${player.maxAmmo}`
            : 'INFINITE',
          bombs: `${player.bombs}/${player.maxBombs}`,
          debris: Math.floor(player.debris),
          multiplier: player.multiplier.toFixed(2),
          weapon: player.currentWeapon ? player.currentWeapon.name : 'Unknown',
          floor: currentFloor
        };
      }

      // Enemies
      if (enemies) {
        for (const enemy of enemies) {
          if (enemy.active) {
            vision.visibleEntities.push({
              id: enemy.id,
              type: 'enemy',
              subtype: enemy.name,
              x: enemy.x,
              y: enemy.y,
              health: enemy.hp,
              maxHealth: enemy.maxHP,
              isBoss: enemy.isBoss || false,
              behavior: enemy.behavior
            });
          }
        }
      }

      // Projectiles
      if (projectiles) {
        vision.projectiles.player = (projectiles.player || []).map(p => ({
          x: p.x,
          y: p.y,
          damage: p.damage,
          size: p.size
        }));

        vision.projectiles.enemy = (projectiles.enemy || []).map(p => ({
          x: p.x,
          y: p.y,
          damage: p.damage,
          size: p.size,
          destructible: p.destructible || false
        }));
      }

      // Pickups
      if (pickups) {
        vision.pickups = pickups.map(p => ({
          x: p.x,
          y: p.y,
          type: p.type,
          value: p.value
        }));
      }

      // Room info
      if (currentRoom) {
        vision.room = {
          type: currentRoom.type,
          cleared: currentRoom.cleared,
          enemyCount: vision.visibleEntities.filter(e => e.type === 'enemy').length,
          pickupCount: vision.pickups.length,
          doors: currentRoom.doors ? currentRoom.doors.map(d => ({
            direction: d.direction,
            destination: d.key,
            locked: d.locked
          })) : []
        };
      }

      // Floor map info
      if (floorMap) {
        vision.floorMap = {
          currentRoom: floorMap.currentRoomKey,
          totalRooms: Object.keys(floorMap.rooms).length,
          bossRoom: floorMap.bossRoom,
          visitedRooms: Object.values(floorMap.rooms).filter(r => r.visited).length
        };
      }

      return vision;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GET GAME INFO - Returns static game information
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.getGameInfo = function() {
      return {
        name: 'Star of Providence Clone',
        version: '1.0.0',
        description: 'Top-down bullet-hell roguelike shooter',

        actions: {
          moveDir: {
            description: 'Move in a direction',
            params: { direction: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'] }
          },
          fire: {
            description: 'Fire weapon',
            params: {}
          },
          dash: {
            description: 'Dash in a direction',
            params: { direction: ['north', 'south', 'east', 'west'] }
          },
          bomb: {
            description: 'Use bomb',
            params: {}
          },
          focus: {
            description: 'Toggle focus mode',
            params: { enabled: 'boolean' }
          },
          interact: {
            description: 'Interact with object at position',
            params: { x: 'number', y: 'number' }
          }
        },

        entityTypes: {
          enemies: ['Ghost', 'Drone', 'Turret', 'Seeker', 'Swarmer', 'Pyromancer', 'Blob'],
          bosses: ['Chamberlord', 'Guardian'],
          pickups: ['health', 'shield', 'ammo', 'bomb', 'debris'],
          rooms: ['start', 'normal', 'miniboss', 'boss', 'shop', 'upgrade']
        },

        controls: {
          movement: 'WASD or Arrow Keys',
          fire: 'Space or Left Click',
          dash: 'Z',
          bomb: 'X',
          focus: 'Shift',
          map: 'Tab'
        }
      };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTE ACTION - Executes a test action
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._executeAction = function(action) {
      const player = window.getPlayer();
      if (!player) return;

      switch (action.type) {
        case 'moveDir':
          simulateMovement(action.direction, action.duration || 100);
          break;

        case 'fire':
          simulateKeyPress('Space', action.duration || 100);
          break;

        case 'dash':
          simulateDash(action.direction);
          break;

        case 'bomb':
          simulateKeyPress('KeyX', 50);
          break;

        case 'focus':
          if (action.enabled) {
            window.keys = window.keys || {};
            window.keys['ShiftLeft'] = true;
          } else {
            window.keys = window.keys || {};
            window.keys['ShiftLeft'] = false;
          }
          break;

        case 'setPosition':
          if (typeof action.x === 'number') player.x = action.x;
          if (typeof action.y === 'number') player.y = action.y;
          break;

        case 'setHealth':
          player.hp = Math.min(player.maxHP, Math.max(0, action.value));
          break;

        case 'giveAmmo':
          player.ammo = Math.min(player.maxAmmo, player.ammo + (action.value || 50));
          break;

        case 'useDebugCommand':
          if (window.debugCommands && window.debugCommands[action.command]) {
            window.debugCommands[action.command](...(action.args || []));
          }
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    };

    function simulateMovement(direction, duration) {
      const keyMap = {
        north: 'KeyW',
        south: 'KeyS',
        east: 'KeyD',
        west: 'KeyA',
        northeast: ['KeyW', 'KeyD'],
        northwest: ['KeyW', 'KeyA'],
        southeast: ['KeyS', 'KeyD'],
        southwest: ['KeyS', 'KeyA']
      };

      const keys = keyMap[direction];
      if (!keys) return;

      const keyArray = Array.isArray(keys) ? keys : [keys];

      // Press keys
      keyArray.forEach(key => {
        const event = new KeyboardEvent('keydown', { code: key });
        document.dispatchEvent(event);
      });

      // Release after duration
      setTimeout(() => {
        keyArray.forEach(key => {
          const event = new KeyboardEvent('keyup', { code: key });
          document.dispatchEvent(event);
        });
      }, duration);
    }

    function simulateKeyPress(keyCode, duration) {
      const downEvent = new KeyboardEvent('keydown', { code: keyCode });
      document.dispatchEvent(downEvent);

      setTimeout(() => {
        const upEvent = new KeyboardEvent('keyup', { code: keyCode });
        document.dispatchEvent(upEvent);
      }, duration);
    }

    function simulateDash(direction) {
      // First set movement direction
      if (direction) {
        simulateMovement(direction, 50);
      }

      // Then press dash
      setTimeout(() => {
        simulateKeyPress('KeyZ', 50);
      }, 10);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADVANCE TIME - Advances game simulation
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._advanceTime = function(ms) {
      // The game uses requestAnimationFrame, so we can't directly advance time
      // This is a no-op as the game will continue running
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // SERIALIZATION - Save/Load game state
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._serializeGameState = function() {
      const player = window.getPlayer();
      const enemies = window.getEnemies();
      const currentFloor = window.getCurrentFloor();
      const currentRoom = window.getCurrentRoom();

      return {
        player: player ? {
          x: player.x,
          y: player.y,
          hp: player.hp,
          maxHP: player.maxHP,
          shields: player.shields,
          ammo: player.ammo,
          bombs: player.bombs,
          debris: player.debris,
          multiplier: player.multiplier,
          weapon: player.currentWeapon.name
        } : null,
        enemies: enemies.map(e => ({
          type: e.name,
          x: e.x,
          y: e.y,
          hp: e.hp
        })),
        floor: currentFloor,
        roomType: currentRoom ? currentRoom.type : null
      };
    };

    window.testHarness._deserializeGameState = function(state) {
      const player = window.getPlayer();
      if (!player || !state.player) return;

      player.x = state.player.x;
      player.y = state.player.y;
      player.hp = state.player.hp;
      player.maxHP = state.player.maxHP;
      player.shields = state.player.shields;
      player.ammo = state.player.ammo;
      player.bombs = state.player.bombs;
      player.debris = state.player.debris;
      player.multiplier = state.player.multiplier;

      // Set weapon
      if (state.player.weapon && window.WEAPONS[state.player.weapon]) {
        player.currentWeapon = { ...window.WEAPONS[state.player.weapon] };
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // TESTING UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.spawnForTesting = function(entityType, x, y, options = {}) {
      if (window.ENEMIES && window.ENEMIES[entityType]) {
        window.debugCommands.spawnEnemy(entityType, x, y);
        return true;
      }
      if (window.BOSSES && window.BOSSES[entityType]) {
        window.debugCommands.spawnBoss(entityType);
        return true;
      }
      return false;
    };

    window.testHarness.clearRoom = function() {
      window.debugCommands.clearRoom();
    };

    window.testHarness.setPlayerPosition = function(x, y) {
      const player = window.getPlayer();
      if (player) {
        player.x = x;
        player.y = y;
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME-SPECIFIC INVARIANTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Player should stay within bounds
    window.testHarness.addInvariant('playerInBounds', {
      check: function() {
        const player = window.getPlayer();
        if (!player) return true;
        return player.x >= 0 && player.x <= 800 &&
               player.y >= 100 && player.y <= 500;
      },
      message: 'Player went out of bounds'
    });

    // Health should not go below 0 while playing
    window.testHarness.addInvariant('healthNotNegative', {
      check: function() {
        const player = window.getPlayer();
        if (!player) return true;
        return player.hp >= 0;
      },
      message: 'Player health went negative'
    });

    // Multiplier should stay in valid range
    window.testHarness.addInvariant('multiplierInRange', {
      check: function() {
        const player = window.getPlayer();
        if (!player) return true;
        return player.multiplier >= 1.0 && player.multiplier <= 3.0;
      },
      message: 'Multiplier out of valid range'
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // VISUAL CHECKS
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.addVisualCheck(function(vision) {
      const checks = [];

      // Check for boss fight
      if (vision && vision.visibleEntities) {
        const bosses = vision.visibleEntities.filter(e => e.isBoss);
        if (bosses.length > 0) {
          checks.push({
            id: 'boss_visible',
            question: `Is the boss "${bosses[0].subtype}" visible and animated?`,
            context: `Boss at (${Math.round(bosses[0].x)}, ${Math.round(bosses[0].y)}) with ${bosses[0].health}/${bosses[0].maxHealth} HP`
          });
        }
      }

      // Check room type
      if (vision && vision.room) {
        checks.push({
          id: 'room_type_correct',
          question: `Does the room appear to be a ${vision.room.type} room?`,
          context: `Room should have ${vision.room.enemyCount} enemies and ${vision.room.pickupCount} pickups`
        });
      }

      return checks;
    });

    console.log('[TestConfig] Harness configuration complete');
  });

})();
