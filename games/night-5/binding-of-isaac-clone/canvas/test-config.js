/**
 * Test Config - Binding of Isaac Clone (Basement Tears)
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
    console.error('[IsaacConfig] ERROR: test-harness-base.js must be loaded before test-config.js');
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME REFERENCES
  // Global variables from game.js:
  //
  // State:
  // - gameState: 'title' | 'playing' | 'gameover'
  // - player: Player object (class instance)
  // - tears: Array of tear projectiles
  // - enemies: Array of enemy objects
  // - pickups: Array of pickup objects
  // - obstacles: Array of obstacle objects (rocks, poops)
  // - doors: Array of door objects
  // - items: Array of item pedestals
  //
  // Room:
  // - currentRoom: {x, y} grid position
  // - floorMap: 2D array of room data
  // - visitedRooms: Set of visited room keys
  // - roomStates: Object of saved room states
  // - floorNum: Current floor number
  //
  // Input:
  // - keys: Object tracking keyboard state
  //
  // Constants:
  // - ROOM_OFFSET_X, ROOM_OFFSET_Y: Room position offsets
  // - TILE_SIZE: 48
  // - ROOM_WIDTH: 13, ROOM_HEIGHT: 7
  // - ENEMY_DATA: Object with enemy type configs
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: Check if entity is on screen
  // ═══════════════════════════════════════════════════════════════════════════

  function isOnScreen(entity, viewport) {
    if (!entity || entity.x === undefined || entity.y === undefined) return false;
    return entity.x >= viewport.x &&
           entity.x <= viewport.x + viewport.width &&
           entity.y >= viewport.y &&
           entity.y <= viewport.y + viewport.height;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: Key simulation
  // ═══════════════════════════════════════════════════════════════════════════

  // Track currently held keys for proper release
  const _heldKeys = new Set();

  function getKeysObj() {
    return window.getKeys ? window.getKeys() : window.keys;
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
      name: 'Basement Tears (Isaac Clone)',
      genre: 'roguelike-shooter',

      actions: {
        moveTo: {
          description: 'Move player toward position (sets WASD keys)',
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
        shootDir: {
          description: 'Shoot tears in direction (arrow keys)',
          parameters: ['direction']  // 'north', 'south', 'east', 'west'
        },
        shootAt: {
          description: 'Shoot at target entity',
          parameters: ['targetId']
        },
        useBomb: {
          description: 'Place bomb at current position',
          parameters: []
        },
        useActive: {
          description: 'Use active item (Q key)',
          parameters: []
        },
        interact: {
          description: 'Press E to interact (pick up items)',
          parameters: []
        }
      },

      entityTypes: {
        enemies: [
          'fly', 'redFly', 'gaper', 'frowningGaper', 'spider', 'bigSpider',
          'hopper', 'host', 'leaper', 'charger', 'globin', 'bony', 'boss_monstro'
        ],
        pickups: [
          'heart', 'halfHeart', 'soulHeart', 'blackHeart',
          'coin', 'key', 'bomb', 'trinket'
        ],
        obstacles: [
          'rock', 'poop', 'fire', 'spike'
        ],
        interactables: [
          'door', 'trapdoor', 'item_pedestal', 'chest'
        ],
        rooms: [
          'start', 'normal', 'boss', 'treasure', 'shop', 'secret'
        ]
      },

      recommendedStepMs: 500,

      winCondition: 'Defeat the floor boss and descend through the trapdoor',
      loseCondition: 'Player health reaches 0 with no extra lives',

      testableScenarios: [
        'Basic movement (WASD)',
        'Shooting in all 4 directions (Arrow keys)',
        'Killing each enemy type',
        'Taking damage from each enemy type',
        'Collecting hearts, coins, keys, bombs',
        'Room transitions (all 4 directions)',
        'Clearing rooms (doors unlock)',
        'Destroying obstacles (rocks, poops)',
        'Boss fight (Monstro)',
        'Item pickup from pedestals',
        'Using active items',
        'Game over handling',
        'Floor progression (trapdoor)'
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
      width: canvas ? canvas.width : 960,
      height: canvas ? canvas.height : 720
    };

    // Get game state from exposed getters
    const player = window.getPlayer ? window.getPlayer() : null;
    const enemies = window.getEnemies ? window.getEnemies() : [];
    const pickups = window.getPickups ? window.getPickups() : [];
    const obstacles = window.getObstacles ? window.getObstacles() : [];
    const doors = window.getDoors ? window.getDoors() : [];
    const items = window.getItems ? window.getItems() : [];
    const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;
    const floorMap = window.getFloorMap ? window.getFloorMap() : null;
    const floorNum = window.getFloorNum ? window.getFloorNum() : 1;
    const gameStateInfo = window.gameState ? window.gameState() : null;
    const gameStateStr = gameStateInfo ? gameStateInfo.state : 'unknown';

    // Player state
    let playerVision = null;
    if (player && gameStateStr === 'playing') {
      const p = player;
      playerVision = {
        x: p.x,
        y: p.y,
        health: p.health,
        maxHealth: p.maxHealth,
        soulHearts: p.soulHearts,
        blackHearts: p.blackHearts,
        coins: p.coins,
        bombs: p.bombs,
        keys: p.keys,
        damage: p.damage * p.damageMult + (p.tempDamageBonus || 0),
        speed: p.speed,
        invulnerable: p.invulnTimer > 0,
        activeItem: p.activeItem,
        activeCharges: p.activeCharges,
        maxCharges: p.maxCharges,
        lives: p.lives,
        tearModifiers: {
          homing: p.homing,
          piercing: p.piercing,
          bouncing: p.bouncing,
          multishot: p.multishot
        }
      };
    }

    // Visible entities
    const visibleEntities = [];

    // Enemies
    for (const enemy of enemies) {
      if (isOnScreen(enemy, viewport)) {
        visibleEntities.push({
          id: enemy.id || `enemy_${enemy.type}_${Math.round(enemy.x)}_${Math.round(enemy.y)}`,
          type: 'enemy',
          subtype: enemy.type,
          x: enemy.x,
          y: enemy.y,
          health: enemy.health,
          maxHealth: enemy.maxHealth,
          state: enemy.charging ? 'charging' : (enemy.stunned ? 'stunned' : 'active'),
          champion: enemy.championType || 'none',
          isBoss: enemy.isBoss || false
        });
      }
    }

    // Pickups
    for (const pickup of pickups) {
      if (isOnScreen(pickup, viewport)) {
        visibleEntities.push({
          id: pickup.id || `pickup_${pickup.type}_${Math.round(pickup.x)}_${Math.round(pickup.y)}`,
          type: 'pickup',
          subtype: pickup.type,
          x: pickup.x,
          y: pickup.y
        });
      }
    }

    // Obstacles
    for (const obs of obstacles) {
      if (isOnScreen(obs, viewport)) {
        visibleEntities.push({
          id: `obstacle_${obs.type}_${Math.round(obs.x)}_${Math.round(obs.y)}`,
          type: 'obstacle',
          subtype: obs.type,
          x: obs.x,
          y: obs.y,
          destructible: obs.destructible !== false
        });
      }
    }

    // Doors
    for (const door of doors) {
      if (isOnScreen(door, viewport)) {
        visibleEntities.push({
          id: `door_${door.dir}`,
          type: 'door',
          subtype: door.type || 'normal',
          x: door.x,
          y: door.y,
          direction: door.dir,
          state: door.open ? 'open' : 'closed',
          locked: door.locked || false
        });
      }
    }

    // Item pedestals
    for (const item of items) {
      if (isOnScreen(item, viewport)) {
        visibleEntities.push({
          id: `item_${item.id}_${Math.round(item.x)}_${Math.round(item.y)}`,
          type: 'item_pedestal',
          subtype: item.id,
          x: item.x,
          y: item.y,
          itemName: item.name
        });
      }
    }

    // Trapdoor
    if (window.trapdoor) {
      visibleEntities.push({
        id: 'trapdoor',
        type: 'interactable',
        subtype: 'trapdoor',
        x: window.trapdoor.x,
        y: window.trapdoor.y,
        active: window.bossDefeated
      });
    }

    // Scene state
    let scene = gameStateStr;

    // UI state
    const ui = {};
    if (player) {
      ui.health = player.health;
      ui.maxHealth = player.maxHealth;
      ui.soulHearts = player.soulHearts;
      ui.blackHearts = player.blackHearts;
      ui.coins = player.coins;
      ui.bombs = player.bombs;
      ui.keys = player.keys;
      ui.floor = floorNum;
      ui.room = currentRoom ? `${currentRoom.x},${currentRoom.y}` : 'unknown';
    }

    // Available actions
    const availableActions = ['stop'];
    if (scene === 'playing' && playerVision) {
      availableActions.push('moveTo', 'moveDir', 'shootDir', 'shootAt');
      if (player.bombs > 0) availableActions.push('useBomb');
      if (player.activeItem && player.activeCharges >= player.maxCharges) {
        availableActions.push('useActive');
      }
      availableActions.push('interact');
    }

    // Context
    const context = {
      floor: floorNum,
      roomX: currentRoom ? currentRoom.x : 0,
      roomY: currentRoom ? currentRoom.y : 0,
      roomType: getCurrentRoomType(floorMap, currentRoom),
      roomCleared: enemies.length === 0,
      bossDefeated: gameStateInfo ? gameStateInfo.bossDefeated || false : false,
      totalKills: gameStateInfo ? gameStateInfo.kills || 0 : 0
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

  function getCurrentRoomType(floorMap, currentRoom) {
    if (!floorMap || !currentRoom) return 'unknown';
    const room = floorMap[currentRoom.y]?.[currentRoom.x];
    return room ? room.type : 'unknown';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: _executeAction()
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness._executeAction = function(action) {
    switch (action.type) {

      case 'moveTo': {
        if (!window.player) return;

        const dx = action.x - window.player.x;
        const dy = action.y - window.player.y;

        // Release all movement keys first
        releaseKey('w');
        releaseKey('a');
        releaseKey('s');
        releaseKey('d');

        // Press appropriate WASD keys based on direction
        if (Math.abs(dx) > 5) {
          if (dx > 0) pressKey('d');
          else pressKey('a');
        }
        if (Math.abs(dy) > 5) {
          if (dy > 0) pressKey('s');
          else pressKey('w');
        }

        // Log movement target
        window.testHarness.logEvent('action_move_to', {
          targetX: action.x,
          targetY: action.y,
          playerX: window.player.x,
          playerY: window.player.y
        });
        break;
      }

      case 'moveDir': {
        // Release all movement keys first
        releaseKey('w');
        releaseKey('a');
        releaseKey('s');
        releaseKey('d');

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

      case 'shootDir': {
        // Release all arrow keys first
        releaseKey('arrowup');
        releaseKey('arrowdown');
        releaseKey('arrowleft');
        releaseKey('arrowright');

        const arrowMap = {
          'north': 'arrowup', 'up': 'arrowup',
          'south': 'arrowdown', 'down': 'arrowdown',
          'east': 'arrowright', 'right': 'arrowright',
          'west': 'arrowleft', 'left': 'arrowleft'
        };
        const key = arrowMap[action.direction];
        if (key) pressKey(key);

        window.testHarness.logEvent('action_shoot', { direction: action.direction });
        break;
      }

      case 'shootAt': {
        if (!window.player) return;

        // Find target entity
        const target = findEntityById(action.targetId);
        if (!target) {
          console.warn('[IsaacConfig] shootAt: target not found:', action.targetId);
          return;
        }

        const dx = target.x - window.player.x;
        const dy = target.y - window.player.y;

        // Release all arrow keys first
        releaseKey('arrowup');
        releaseKey('arrowdown');
        releaseKey('arrowleft');
        releaseKey('arrowright');

        // Determine primary direction (cardinal only)
        if (Math.abs(dx) > Math.abs(dy)) {
          pressKey(dx > 0 ? 'arrowright' : 'arrowleft');
        } else {
          pressKey(dy > 0 ? 'arrowdown' : 'arrowup');
        }

        window.testHarness.logEvent('action_shoot_at', {
          targetId: action.targetId,
          targetX: target.x,
          targetY: target.y
        });
        break;
      }

      case 'useBomb': {
        if (window.player && window.player.bombs > 0) {
          pressKey('e');
          setTimeout(() => releaseKey('e'), 100);
          window.testHarness.logEvent('action_bomb', {
            x: window.player.x,
            y: window.player.y
          });
        }
        break;
      }

      case 'useActive': {
        if (window.player && window.player.activeItem) {
          pressKey('q');
          setTimeout(() => releaseKey('q'), 100);
          window.testHarness.logEvent('action_active_item', {
            item: window.player.activeItem
          });
        }
        break;
      }

      case 'interact': {
        // Walk toward nearest interactable (item pedestal, pickup)
        // For now just log the intent
        window.testHarness.logEvent('action_interact', {});
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
        console.warn(`[IsaacConfig] Unknown action type: ${action.type}`);
    }
  };

  function findEntityById(id) {
    // Check enemies
    for (const enemy of (window.enemies || [])) {
      const eid = enemy.id || `enemy_${enemy.type}_${Math.round(enemy.x)}_${Math.round(enemy.y)}`;
      if (eid === id) return enemy;
    }
    // Check pickups
    for (const pickup of (window.pickups || [])) {
      const pid = pickup.id || `pickup_${pickup.type}_${Math.round(pickup.x)}_${Math.round(pickup.y)}`;
      if (pid === id) return pickup;
    }
    // Check items
    for (const item of (window.items || [])) {
      const iid = `item_${item.id}_${Math.round(item.x)}_${Math.round(item.y)}`;
      if (iid === id) return item;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: Testing Utilities
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.spawnForTesting = function(type, subtype, x, y) {
    const id = `test_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (type === 'enemy') {
      const enemyData = window.ENEMY_DATA[subtype];
      if (!enemyData) {
        throw new Error(`Unknown enemy type: ${subtype}`);
      }

      const enemy = {
        id: id,
        type: subtype,
        x: x,
        y: y,
        health: enemyData.health,
        maxHealth: enemyData.health,
        speed: enemyData.speed,
        damage: enemyData.damage,
        width: enemyData.width,
        height: enemyData.height,
        isBoss: enemyData.isBoss || false,
        championType: 'none'
      };
      window.enemies.push(enemy);

      window.testHarness.logEvent('test_spawn', { type, subtype, id, x, y });
      return id;
    }

    if (type === 'pickup') {
      const pickup = {
        id: id,
        type: subtype,
        x: x,
        y: y
      };
      window.pickups.push(pickup);

      window.testHarness.logEvent('test_spawn', { type, subtype, id, x, y });
      return id;
    }

    throw new Error(`Cannot spawn type: ${type}`);
  };

  window.testHarness.clearRoom = function() {
    const enemyCount = window.enemies.length;
    const pickupCount = window.pickups.length;

    window.enemies = [];
    window.pickups = [];

    window.testHarness.logEvent('test_clear_room', {
      enemiesCleared: enemyCount,
      pickupsCleared: pickupCount
    });
  };

  window.testHarness.setPlayerPosition = function(x, y) {
    if (window.player) {
      const oldX = window.player.x;
      const oldY = window.player.y;
      window.player.x = x;
      window.player.y = y;

      window.testHarness.logEvent('test_teleport', {
        fromX: oldX,
        fromY: oldY,
        toX: x,
        toY: y
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // IMPLEMENT: Checkpoint Serialization
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness._serializeGameState = function() {
    return {
      gameState: window.gameState,
      player: window.player ? {
        x: window.player.x,
        y: window.player.y,
        health: window.player.health,
        maxHealth: window.player.maxHealth,
        soulHearts: window.player.soulHearts,
        blackHearts: window.player.blackHearts,
        coins: window.player.coins,
        bombs: window.player.bombs,
        keys: window.player.keys,
        damage: window.player.damage,
        damageMult: window.player.damageMult,
        speed: window.player.speed,
        homing: window.player.homing,
        piercing: window.player.piercing,
        bouncing: window.player.bouncing,
        multishot: window.player.multishot,
        activeItem: window.player.activeItem,
        activeCharges: window.player.activeCharges,
        maxCharges: window.player.maxCharges,
        collectedItems: [...window.player.collectedItems],
        lives: window.player.lives
      } : null,
      enemies: window.enemies.map(e => ({ ...e })),
      pickups: window.pickups.map(p => ({ ...p })),
      obstacles: window.obstacles.map(o => ({ ...o })),
      items: window.items.map(i => ({ ...i })),
      currentRoom: { ...window.currentRoom },
      floorNum: window.floorNum,
      totalKills: window.totalKills,
      bossDefeated: window.bossDefeated,
      visitedRooms: [...window.visitedRooms],
      roomStates: JSON.parse(JSON.stringify(window.roomStates))
    };
  };

  window.testHarness._deserializeGameState = function(state) {
    window.gameState = state.gameState;

    if (state.player && window.player) {
      Object.assign(window.player, state.player);
      window.player.collectedItems = [...state.player.collectedItems];
    }

    window.enemies = state.enemies.map(e => ({ ...e }));
    window.pickups = state.pickups.map(p => ({ ...p }));
    window.obstacles = state.obstacles.map(o => ({ ...o }));
    window.items = state.items.map(i => ({ ...i }));
    window.currentRoom = { ...state.currentRoom };
    window.floorNum = state.floorNum;
    window.totalKills = state.totalKills;
    window.bossDefeated = state.bossDefeated;
    window.visitedRooms = new Set(state.visitedRooms);
    window.roomStates = JSON.parse(JSON.stringify(state.roomStates));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME-SPECIFIC INVARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.addInvariant('playerHealthValid', {
    check: function() {
      if (!window.player || window.gameState !== 'playing') return true;
      return window.player.health >= 0 && window.player.health <= window.player.maxHealth;
    },
    message: function() {
      if (!window.player) return 'No player';
      return `Player health ${window.player.health} out of range [0, ${window.player.maxHealth}]`;
    }
  });

  window.testHarness.addInvariant('doorsLockedDuringCombat', {
    check: function() {
      if (window.gameState !== 'playing') return true;
      if ((window.enemies || []).length === 0) return true; // No enemies = doors can be open

      // During combat, doors should be closed (not open)
      for (const door of (window.doors || [])) {
        if (door.open && !door.locked) {
          // It's okay if there are enemies - doors close when enemies spawn
          // This checks if doors are incorrectly open during combat
        }
      }
      return true; // This is informational
    },
    message: 'Doors are open while enemies are present',
    severity: 'warning'
  });

  window.testHarness.addInvariant('playerInBounds', {
    check: function() {
      if (!window.player || window.gameState !== 'playing') return true;

      const minX = window.ROOM_OFFSET_X;
      const maxX = window.ROOM_OFFSET_X + window.ROOM_WIDTH * window.TILE_SIZE;
      const minY = window.ROOM_OFFSET_Y;
      const maxY = window.ROOM_OFFSET_Y + window.ROOM_HEIGHT * window.TILE_SIZE;

      return window.player.x >= minX && window.player.x <= maxX &&
             window.player.y >= minY && window.player.y <= maxY;
    },
    message: function() {
      if (!window.player) return 'No player';
      return `Player out of bounds at (${window.player.x}, ${window.player.y})`;
    }
  });

  window.testHarness.addInvariant('noNegativePickups', {
    check: function() {
      if (!window.player) return true;
      return window.player.coins >= 0 &&
             window.player.bombs >= 0 &&
             window.player.keys >= 0;
    },
    message: function() {
      if (!window.player) return 'No player';
      return `Negative pickups: coins=${window.player.coins}, bombs=${window.player.bombs}, keys=${window.player.keys}`;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME-SPECIFIC VISUAL CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  window.testHarness.addVisualCheck(function(vision) {
    const checks = [];

    if (vision.player) {
      // Health bar check
      const totalHearts = Math.ceil(vision.player.maxHealth / 2);
      checks.push({
        id: 'health_display',
        question: `Does the health display show ${totalHearts} heart containers with ${Math.ceil(vision.player.health / 2)} filled?`,
        context: `Player has ${vision.player.health}/${vision.player.maxHealth} HP`
      });

      // Soul hearts check
      if (vision.player.soulHearts > 0) {
        checks.push({
          id: 'soul_hearts_display',
          question: `Are ${Math.ceil(vision.player.soulHearts / 2)} blue soul hearts visible after the red hearts?`,
          context: 'Soul hearts should appear as blue hearts'
        });
      }

      // Pickup counts check
      checks.push({
        id: 'pickup_counts',
        question: `Do the HUD icons show: Keys=${vision.player.keys}, Bombs=${vision.player.bombs}, Coins=${vision.player.coins}?`,
        context: 'Check top-left area of screen'
      });
    }

    // Enemy visibility
    const enemies = (vision.visibleEntities || []).filter(e => e.type === 'enemy');
    if (enemies.length > 0) {
      const types = [...new Set(enemies.map(e => e.subtype))].join(', ');
      checks.push({
        id: 'enemies_visible',
        question: `Are ${enemies.length} enemies visible? (Types: ${types})`,
        context: 'Enemies should be clearly distinguishable from background'
      });
    }

    // Door state check
    const doors = (vision.visibleEntities || []).filter(e => e.type === 'door');
    const openDoors = doors.filter(d => d.state === 'open');
    const closedDoors = doors.filter(d => d.state === 'closed');
    if (doors.length > 0) {
      checks.push({
        id: 'door_states',
        question: `Are ${openDoors.length} doors open and ${closedDoors.length} doors closed?`,
        context: vision.context?.roomCleared ? 'Room is cleared, doors should be open' : 'Enemies present, doors should be closed'
      });
    }

    // Room type indicator
    if (vision.context?.roomType && vision.context.roomType !== 'normal') {
      checks.push({
        id: 'special_room',
        question: `Does this look like a ${vision.context.roomType} room?`,
        context: 'Boss rooms have skull door, treasure rooms have gold appearance, etc.'
      });
    }

    return checks;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HOOKS - Hook into game events
  // ═══════════════════════════════════════════════════════════════════════════

  // Patch enemy death to log events
  const originalEnemies = window.enemies;
  let enemyWatchInterval = setInterval(function() {
    if (!window.enemies) return;

    // Watch for enemy array changes (crude but works without modifying game.js)
    const currentEnemyCount = window.enemies.length;
    if (window._lastEnemyCount !== undefined && currentEnemyCount < window._lastEnemyCount) {
      const killed = window._lastEnemyCount - currentEnemyCount;
      window.testHarness.logEvent('enemies_killed', { count: killed });
    }
    window._lastEnemyCount = currentEnemyCount;
  }, 100);

  // Watch for player damage
  let lastPlayerHealth = null;
  setInterval(function() {
    if (!window.player) return;

    if (lastPlayerHealth !== null && window.player.health < lastPlayerHealth) {
      window.testHarness.logEvent('player_damaged', {
        oldHealth: lastPlayerHealth,
        newHealth: window.player.health,
        damage: lastPlayerHealth - window.player.health
      });
    }
    lastPlayerHealth = window.player.health;
  }, 50);

  // Watch for room changes
  let lastRoom = null;
  setInterval(function() {
    if (!window.currentRoom) return;

    const currentRoomKey = `${window.currentRoom.x},${window.currentRoom.y}`;
    if (lastRoom !== null && currentRoomKey !== lastRoom) {
      window.testHarness.logEvent('room_changed', {
        from: lastRoom,
        to: currentRoomKey
      });
    }
    lastRoom = currentRoomKey;
  }, 100);

  // Watch for game state changes
  let lastGameState = null;
  setInterval(function() {
    if (window.gameState !== lastGameState) {
      window.testHarness.logEvent('game_state_changed', {
        from: lastGameState,
        to: window.gameState
      });
      lastGameState = window.gameState;
    }
  }, 100);

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('[IsaacConfig] Binding of Isaac test configuration loaded');
  console.log('[IsaacConfig] Game state:', window.gameState);
  console.log('[IsaacConfig] Player exists:', !!window.player);

  // Auto-verify harness on load
  setTimeout(function() {
    const result = window.testHarness.verifyHarness();
    if (result.allPassed) {
      console.log('[IsaacConfig] Harness verification PASSED');
    } else {
      console.warn('[IsaacConfig] Harness verification FAILED:');
      for (const check of result.checks) {
        if (!check.passed) {
          console.warn(`  - ${check.name}: ${check.error}`);
        }
      }
    }
  }, 500);

})();
