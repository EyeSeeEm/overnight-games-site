/**
 * Test Config - Binding of Isaac Clone (Basement Tears)
 * Game-specific test harness configuration for Night 6
 */

(function() {
    'use strict';

    if (!window.testHarness) {
        console.error('[IsaacConfig] test-harness-base.js must be loaded first');
        return;
    }

    // Track held keys
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
                moveTo: { description: 'Move toward position', parameters: ['x', 'y'] },
                moveDir: { description: 'Move in direction', parameters: ['direction'] },
                stop: { description: 'Stop all movement', parameters: [] },
                shootDir: { description: 'Shoot in direction', parameters: ['direction'] },
                useBomb: { description: 'Place bomb', parameters: [] }
            },
            entityTypes: {
                enemies: ['fly', 'redFly', 'gaper', 'spider', 'hopper', 'charger', 'clotty', 'boss_monstro'],
                pickups: ['heart', 'halfHeart', 'soulHeart', 'coin', 'key', 'bomb'],
                obstacles: ['rock', 'poop'],
                rooms: ['start', 'normal', 'boss', 'treasure', 'shop']
            },
            recommendedStepMs: 500
        };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: getVision()
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.getVision = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const enemies = window.getEnemies ? window.getEnemies() : [];
        const pickups = window.getPickups ? window.getPickups() : [];
        const obstacles = window.getObstacles ? window.getObstacles() : [];
        const doors = window.getDoors ? window.getDoors() : [];
        const items = window.getItems ? window.getItems() : [];
        const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;
        const floorNum = window.getFloorNum ? window.getFloorNum() : 1;
        const gameStateInfo = window.gameState ? window.gameState() : null;
        const stateStr = gameStateInfo ? gameStateInfo.state : 'unknown';

        let playerVision = null;
        if (player && stateStr === 'playing') {
            playerVision = {
                x: player.x,
                y: player.y,
                health: player.health,
                maxHealth: player.maxHealth,
                soulHearts: player.soulHearts,
                coins: player.coins,
                bombs: player.bombs,
                keys: player.keys,
                damage: player.damage * player.damageMult,
                speed: player.speed,
                invulnerable: player.invulnTimer > 0
            };
        }

        const visibleEntities = [];

        for (const enemy of enemies) {
            visibleEntities.push({
                id: `enemy_${enemy.type}_${Math.round(enemy.x)}_${Math.round(enemy.y)}`,
                type: 'enemy',
                subtype: enemy.type,
                x: enemy.x,
                y: enemy.y,
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                state: enemy.state,
                isBoss: enemy.isBoss || false
            });
        }

        for (const pickup of pickups) {
            visibleEntities.push({
                id: `pickup_${pickup.type}_${Math.round(pickup.x)}_${Math.round(pickup.y)}`,
                type: 'pickup',
                subtype: pickup.type,
                x: pickup.x,
                y: pickup.y
            });
        }

        for (const obs of obstacles) {
            visibleEntities.push({
                id: `obstacle_${obs.type}_${Math.round(obs.x)}_${Math.round(obs.y)}`,
                type: 'obstacle',
                subtype: obs.type,
                x: obs.x,
                y: obs.y,
                destructible: obs.destructible
            });
        }

        for (const door of doors) {
            visibleEntities.push({
                id: `door_${door.dir}`,
                type: 'door',
                subtype: door.type,
                x: door.x,
                y: door.y,
                direction: door.dir,
                state: door.open ? 'open' : 'closed',
                locked: door.locked
            });
        }

        for (const item of items) {
            visibleEntities.push({
                id: `item_${item.id}_${Math.round(item.x)}_${Math.round(item.y)}`,
                type: 'item_pedestal',
                subtype: item.id,
                x: item.x,
                y: item.y,
                itemName: item.name
            });
        }

        return {
            viewport: { x: 0, y: 0, width: 960, height: 720 },
            player: playerVision,
            visibleEntities: visibleEntities,
            ui: player ? {
                health: player.health,
                maxHealth: player.maxHealth,
                coins: player.coins,
                bombs: player.bombs,
                keys: player.keys,
                floor: floorNum
            } : {},
            scene: stateStr,
            context: {
                floor: floorNum,
                roomX: currentRoom ? currentRoom.x : 0,
                roomY: currentRoom ? currentRoom.y : 0,
                roomCleared: enemies.length === 0,
                bossDefeated: gameStateInfo ? gameStateInfo.bossDefeated : false
            }
        };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: _executeAction()
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._executeAction = function(action) {
        switch (action.type) {
            case 'moveTo': {
                const player = window.getPlayer();
                if (!player) return;

                releaseKey('w'); releaseKey('a'); releaseKey('s'); releaseKey('d');

                const dx = action.x - player.x;
                const dy = action.y - player.y;

                if (Math.abs(dx) > 5) {
                    pressKey(dx > 0 ? 'd' : 'a');
                }
                if (Math.abs(dy) > 5) {
                    pressKey(dy > 0 ? 's' : 'w');
                }
                break;
            }

            case 'moveDir': {
                releaseKey('w'); releaseKey('a'); releaseKey('s'); releaseKey('d');
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
                releaseKey('arrowup'); releaseKey('arrowdown');
                releaseKey('arrowleft'); releaseKey('arrowright');
                const arrowMap = {
                    'north': 'arrowup', 'up': 'arrowup',
                    'south': 'arrowdown', 'down': 'arrowdown',
                    'east': 'arrowright', 'right': 'arrowright',
                    'west': 'arrowleft', 'left': 'arrowleft'
                };
                const key = arrowMap[action.direction];
                if (key) pressKey(key);
                break;
            }

            case 'useBomb': {
                pressKey('e');
                setTimeout(() => releaseKey('e'), 100);
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
                console.warn(`[IsaacConfig] Unknown action: ${action.type}`);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Testing Utilities
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.spawnForTesting = function(type, subtype, x, y) {
        if (type === 'enemy' && window.ENEMY_DATA[subtype]) {
            const Enemy = window.Enemy || function(t, ex, ey) {
                return { type: t, x: ex, y: ey, health: window.ENEMY_DATA[t].health };
            };
            const enemy = new Enemy(subtype, x, y);
            window.getEnemies().push(enemy);
            return `enemy_${subtype}_${x}_${y}`;
        }
        return null;
    };

    window.testHarness.clearRoom = function() {
        const enemies = window.getEnemies();
        enemies.length = 0;
        const doors = window.getDoors();
        doors.forEach(d => d.open = true);
    };

    window.testHarness.setPlayerPosition = function(x, y) {
        const player = window.getPlayer();
        if (player) {
            player.x = x;
            player.y = y;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Checkpoint Serialization
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._serializeGameState = function() {
        const player = window.getPlayer();
        return {
            gameState: window.gameState ? window.gameState().state : 'playing',
            player: player ? {
                x: player.x, y: player.y,
                health: player.health, maxHealth: player.maxHealth,
                coins: player.coins, bombs: player.bombs, keys: player.keys,
                damage: player.damage, speed: player.speed
            } : null,
            floorNum: window.getFloorNum ? window.getFloorNum() : 1,
            currentRoom: window.getCurrentRoom ? { ...window.getCurrentRoom() } : { x: 4, y: 3 }
        };
    };

    window.testHarness._deserializeGameState = function(state) {
        // Minimal restore - full implementation would need more
        console.log('[IsaacConfig] State restore requested:', state);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Game-specific invariants
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.addInvariant('playerHealthValid', {
        check: function() {
            const player = window.getPlayer();
            if (!player) return true;
            return player.health >= 0 && player.health <= player.maxHealth;
        },
        message: 'Player health out of valid range'
    });

    window.testHarness.addInvariant('noNegativePickups', {
        check: function() {
            const player = window.getPlayer();
            if (!player) return true;
            return player.coins >= 0 && player.bombs >= 0 && player.keys >= 0;
        },
        message: 'Player has negative pickup counts'
    });

    console.log('[IsaacConfig] Test configuration loaded');

    // Auto-verify harness
    setTimeout(function() {
        const result = window.testHarness.verifyHarness();
        console.log('[IsaacConfig] Harness verification:', result.allPassed ? 'PASSED' : 'FAILED');
    }, 500);

})();
