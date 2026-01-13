/**
 * Test Config - Bullet Dungeon (Enter the Gungeon Clone)
 * Game-specific test harness configuration for Night 6
 */

(function() {
    'use strict';

    if (!window.testHarness) {
        console.error('[GungeonConfig] test-harness-base.js must be loaded first');
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
            name: 'Bullet Dungeon (Gungeon Clone)',
            genre: 'bullet-hell-roguelike',
            actions: {
                moveTo: { description: 'Move toward position', parameters: ['x', 'y'] },
                moveDir: { description: 'Move in direction', parameters: ['direction'] },
                stop: { description: 'Stop all movement', parameters: [] },
                aimAt: { description: 'Aim at position', parameters: ['x', 'y'] },
                shoot: { description: 'Fire weapon', parameters: [] },
                dodgeRoll: { description: 'Perform dodge roll', parameters: ['direction'] },
                useBlank: { description: 'Use blank to clear bullets', parameters: [] },
                reload: { description: 'Reload current weapon', parameters: [] },
                interact: { description: 'Interact with nearby object', parameters: [] },
                switchWeapon: { description: 'Switch to weapon slot', parameters: ['slot'] }
            },
            entityTypes: {
                enemies: ['bulletKin', 'bandanaBulletKin', 'shotgunKinBlue', 'shotgunKinRed', 'cardinal', 'shroomer', 'gunNut', 'bookllet'],
                bosses: ['bulletKing', 'gatlingGull', 'beholster'],
                pickups: ['shell', 'heart', 'halfHeart', 'armor', 'key', 'blank', 'ammo', 'item'],
                obstacles: ['pillar', 'crate', 'barrel', 'table'],
                rooms: ['start', 'combat', 'boss', 'treasure', 'shop']
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
        const playerBullets = window.getPlayerBullets ? window.getPlayerBullets() : [];
        const enemyBullets = window.getEnemyBullets ? window.getEnemyBullets() : [];
        const pickups = window.getPickups ? window.getPickups() : [];
        const obstacles = window.getObstacles ? window.getObstacles() : [];
        const doors = window.getDoors ? window.getDoors() : [];
        const chests = window.getChests ? window.getChests() : [];
        const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;
        const floorNum = window.getFloorNum ? window.getFloorNum() : 1;
        const gameStateInfo = window.gameState ? window.gameState() : null;
        const stateStr = gameStateInfo ? gameStateInfo.state : 'unknown';

        let playerVision = null;
        if (player && (stateStr === 'playing' || stateStr === 'bossFight')) {
            const weapon = player.currentWeapon;
            playerVision = {
                x: player.x,
                y: player.y,
                health: player.health,
                maxHealth: player.maxHealth,
                armor: player.armor,
                blanks: player.blanks,
                keys: player.keys,
                shells: player.shells,
                isRolling: player.isRolling,
                isReloading: player.reloading,
                invulnerable: player.invulnTimer > 0,
                currentWeapon: weapon ? {
                    name: weapon.name,
                    ammo: weapon.currentAmmo,
                    maxAmmo: weapon.magazineSize,
                    totalAmmo: weapon.totalAmmo
                } : null,
                weaponCount: player.weapons.length
            };
        }

        const visibleEntities = [];

        // Enemies
        for (const enemy of enemies) {
            const isBoss = enemy.constructor && enemy.constructor.name === 'Boss';
            visibleEntities.push({
                id: `enemy_${enemy.type || 'boss'}_${Math.round(enemy.x)}_${Math.round(enemy.y)}`,
                type: isBoss ? 'boss' : 'enemy',
                subtype: enemy.type || enemy.name,
                x: enemy.x,
                y: enemy.y,
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                isSpawning: enemy.isSpawning || false,
                stunned: enemy.stunTimer > 0
            });
        }

        // Enemy bullets
        for (let i = 0; i < enemyBullets.length; i++) {
            const b = enemyBullets[i];
            visibleEntities.push({
                id: `enemyBullet_${i}`,
                type: 'enemyBullet',
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                damage: b.damage
            });
        }

        // Player bullets
        for (let i = 0; i < playerBullets.length; i++) {
            const b = playerBullets[i];
            visibleEntities.push({
                id: `playerBullet_${i}`,
                type: 'playerBullet',
                x: b.x,
                y: b.y
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
                forSale: pickup.forSale || false,
                price: pickup.price
            });
        }

        // Obstacles
        for (const obs of obstacles) {
            visibleEntities.push({
                id: `obstacle_${obs.type}_${Math.round(obs.x)}_${Math.round(obs.y)}`,
                type: 'obstacle',
                subtype: obs.type,
                x: obs.x,
                y: obs.y,
                destructible: obs.destructible,
                explosive: obs.explosive
            });
        }

        // Doors
        for (const door of doors) {
            visibleEntities.push({
                id: `door_${door.dir}`,
                type: 'door',
                direction: door.dir,
                x: door.x,
                y: door.y,
                open: door.open
            });
        }

        // Chests
        for (const chest of chests) {
            visibleEntities.push({
                id: `chest_${chest.quality}_${Math.round(chest.x)}_${Math.round(chest.y)}`,
                type: 'chest',
                quality: chest.quality,
                x: chest.x,
                y: chest.y,
                locked: chest.locked,
                open: chest.open
            });
        }

        return {
            viewport: { x: 0, y: 0, width: 800, height: 600 },
            player: playerVision,
            visibleEntities: visibleEntities,
            ui: player ? {
                health: player.health,
                maxHealth: player.maxHealth,
                armor: player.armor,
                blanks: player.blanks,
                keys: player.keys,
                shells: player.shells,
                floor: floorNum
            } : {},
            scene: stateStr,
            context: {
                floor: floorNum,
                roomX: currentRoom ? currentRoom.x : 0,
                roomY: currentRoom ? currentRoom.y : 0,
                roomType: currentRoom ? currentRoom.type : 'unknown',
                roomCleared: gameStateInfo ? gameStateInfo.roomCleared : false,
                enemyBulletCount: enemyBullets.length,
                isBossFight: stateStr === 'bossFight'
            }
        };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: _executeAction()
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._executeAction = function(action) {
        const player = window.getPlayer();

        switch (action.type) {
            case 'moveTo': {
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
                    'west': 'a', 'left': 'a',
                    'northwest': ['w', 'a'],
                    'northeast': ['w', 'd'],
                    'southwest': ['s', 'a'],
                    'southeast': ['s', 'd']
                };
                const keys = dirMap[action.direction];
                if (Array.isArray(keys)) {
                    keys.forEach(k => pressKey(k));
                } else if (keys) {
                    pressKey(keys);
                }
                break;
            }

            case 'stop': {
                releaseAllKeys();
                break;
            }

            case 'aimAt': {
                // Note: This would need to simulate mouse movement
                // For testing, we can set mouse position directly if exposed
                break;
            }

            case 'shoot': {
                // Simulate mouse click
                const canvas = document.getElementById('gameCanvas');
                if (canvas) {
                    canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    setTimeout(() => {
                        canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    }, 50);
                }
                break;
            }

            case 'dodgeRoll': {
                // Set movement direction first
                if (action.direction) {
                    window.testHarness._executeAction({ type: 'moveDir', direction: action.direction });
                }
                // Then trigger roll
                pressKey(' ');
                setTimeout(() => releaseKey(' '), 100);
                break;
            }

            case 'useBlank': {
                pressKey('q');
                setTimeout(() => releaseKey('q'), 100);
                break;
            }

            case 'reload': {
                pressKey('r');
                setTimeout(() => releaseKey('r'), 100);
                break;
            }

            case 'interact': {
                pressKey('e');
                setTimeout(() => releaseKey('e'), 100);
                break;
            }

            case 'switchWeapon': {
                const slot = action.slot || 1;
                pressKey(String(slot));
                setTimeout(() => releaseKey(String(slot)), 100);
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
                console.warn(`[GungeonConfig] Unknown action: ${action.type}`);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Testing Utilities
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.spawnForTesting = function(type, subtype, x, y) {
        if (type === 'enemy' && window.ENEMY_DATA && window.ENEMY_DATA[subtype]) {
            // Would need access to Enemy class
            console.log(`[GungeonConfig] Spawn enemy ${subtype} at ${x}, ${y}`);
            return null;
        }
        return null;
    };

    window.testHarness.clearRoom = function() {
        const enemies = window.getEnemies();
        if (enemies) enemies.length = 0;

        const enemyBullets = window.getEnemyBullets();
        if (enemyBullets) enemyBullets.length = 0;

        const doors = window.getDoors();
        if (doors) doors.forEach(d => d.open = true);
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
        const gameStateInfo = window.gameState ? window.gameState() : null;
        const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;

        return {
            gameState: gameStateInfo ? gameStateInfo.state : 'playing',
            player: player ? {
                x: player.x, y: player.y,
                health: player.health, maxHealth: player.maxHealth,
                armor: player.armor, blanks: player.blanks,
                keys: player.keys, shells: player.shells,
                weaponIndex: player.currentWeaponIndex
            } : null,
            floorNum: window.getFloorNum ? window.getFloorNum() : 1,
            currentRoom: currentRoom ? { x: currentRoom.x, y: currentRoom.y, type: currentRoom.type } : null,
            enemyCount: window.getEnemies ? window.getEnemies().length : 0,
            bulletCount: window.getEnemyBullets ? window.getEnemyBullets().length : 0
        };
    };

    window.testHarness._deserializeGameState = function(state) {
        console.log('[GungeonConfig] State restore requested:', state);
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

    window.testHarness.addInvariant('noNegativeResources', {
        check: function() {
            const player = window.getPlayer();
            if (!player) return true;
            return player.shells >= 0 && player.blanks >= 0 && player.keys >= 0;
        },
        message: 'Player has negative resource counts'
    });

    window.testHarness.addInvariant('weaponAmmoValid', {
        check: function() {
            const player = window.getPlayer();
            if (!player) return true;
            const weapon = player.currentWeapon;
            if (!weapon) return true;
            return weapon.currentAmmo >= 0 && weapon.currentAmmo <= weapon.magazineSize;
        },
        message: 'Weapon ammo out of valid range'
    });

    console.log('[GungeonConfig] Test configuration loaded');

    // Auto-verify harness
    setTimeout(function() {
        const result = window.testHarness.verifyHarness();
        console.log('[GungeonConfig] Harness verification:', result.allPassed ? 'PASSED' : 'FAILED');
    }, 500);

})();
