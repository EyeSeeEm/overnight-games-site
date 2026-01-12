/**
 * Brotato Clone - Test Harness Configuration
 *
 * Game-specific implementations for the test harness.
 */

(function() {
    'use strict';

    // =========================================================================
    // GAME INFO
    // =========================================================================

    window.testHarness.getGameInfo = function() {
        return {
            name: 'Brotato Clone',
            version: '1.0.0',
            framework: 'LittleJS',
            description: 'Top-down arena roguelike survivor',
            entityTypes: {
                enemies: ['babyAlien', 'chaser', 'charger', 'spitter', 'bruiser', 'healer', 'pursuer', 'looter'],
                pickups: ['xp', 'material', 'health'],
                weapons: ['pistol', 'smg', 'shotgun', 'sniper', 'knife', 'sword', 'fist', 'spear', 'lightningShiv', 'flamethrower']
            },
            actions: {
                move: { params: ['direction'], description: 'Move player in direction' },
                moveDir: { params: ['direction'], description: 'Move player using cardinal direction' },
                moveTo: { params: ['x', 'y'], description: 'Move player toward position' },
                selectCharacter: { params: ['characterId'], description: 'Select character to play' },
                clickShopItem: { params: ['index'], description: 'Purchase shop item' },
                selectUpgrade: { params: ['index'], description: 'Select level up upgrade' },
                startNextWave: { params: [], description: 'Start the next wave from shop' },
                rerollShop: { params: [], description: 'Reroll shop items' }
            },
            states: ['menu', 'characterSelect', 'waveCombat', 'levelUp', 'shop', 'gameOver', 'victory', 'paused']
        };
    };

    // =========================================================================
    // GET VISION
    // =========================================================================

    window.testHarness.getVision = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const enemies = window.getEnemies ? window.getEnemies() : [];
        const projectiles = window.getProjectiles ? window.getProjectiles() : [];
        const pickups = window.getPickups ? window.getPickups() : [];
        const gameState = window.getGameState ? window.getGameState() : 'unknown';
        const currentWave = window.getCurrentWave ? window.getCurrentWave() : 0;
        const waveTimer = window.getWaveTimer ? window.getWaveTimer() : 0;

        const vision = {
            gameState: gameState,
            wave: currentWave,
            waveTimer: Math.ceil(waveTimer),
            player: null,
            visibleEntities: [],
            ui: {}
        };

        // Player info
        if (player) {
            vision.player = {
                x: player.pos ? player.pos.x : player.x,
                y: player.pos ? player.pos.y : player.y,
                health: player.hp,
                maxHealth: player.getMaxHp(),
                level: player.level,
                xp: player.xp,
                xpToNext: player.getXpToNextLevel(),
                materials: player.materials,
                weapons: player.weapons.map(w => ({
                    id: w.id,
                    tier: w.tier
                })),
                items: player.items.map(i => i.id),
                stats: {
                    damage: player.getStat('damage'),
                    attackSpeed: player.getStat('attackSpeed'),
                    speed: player.getStat('speed'),
                    armor: player.getStat('armor'),
                    dodge: player.getStat('dodge'),
                    critChance: player.getStat('critChance')
                }
            };

            vision.ui = {
                hp: `${Math.floor(player.hp)}/${player.getMaxHp()}`,
                level: player.level,
                materials: player.materials,
                wave: currentWave,
                timer: Math.ceil(waveTimer)
            };
        }

        // Enemies
        for (const enemy of enemies) {
            vision.visibleEntities.push({
                type: 'enemy',
                subtype: enemy.type,
                id: enemy.id,
                x: enemy.pos ? enemy.pos.x : enemy.x,
                y: enemy.pos ? enemy.pos.y : enemy.y,
                health: enemy.hp,
                maxHealth: enemy.maxHp
            });
        }

        // Projectiles
        for (const proj of projectiles) {
            vision.visibleEntities.push({
                type: 'projectile',
                subtype: proj.friendly ? 'player' : 'enemy',
                x: proj.pos ? proj.pos.x : proj.x,
                y: proj.pos ? proj.pos.y : proj.y,
                damage: proj.damage.amount
            });
        }

        // Pickups
        for (const pickup of pickups) {
            vision.visibleEntities.push({
                type: 'pickup',
                subtype: pickup.type,
                x: pickup.pos ? pickup.pos.x : pickup.x,
                y: pickup.pos ? pickup.pos.y : pickup.y,
                amount: pickup.amount
            });
        }

        return vision;
    };

    // =========================================================================
    // EXECUTE ACTION
    // =========================================================================

    window.testHarness._executeAction = function(action) {
        const player = window.getPlayer ? window.getPlayer() : null;
        const gameState = window.getGameState ? window.getGameState() : null;

        switch (action.type) {
            case 'move':
            case 'moveDir':
                // Simulate key press for movement
                const dirKeys = {
                    'north': 'KeyW',
                    'south': 'KeyS',
                    'east': 'KeyD',
                    'west': 'KeyA',
                    'northeast': ['KeyW', 'KeyD'],
                    'northwest': ['KeyW', 'KeyA'],
                    'southeast': ['KeyS', 'KeyD'],
                    'southwest': ['KeyS', 'KeyA']
                };
                const keys = dirKeys[action.direction];
                if (keys) {
                    if (Array.isArray(keys)) {
                        keys.forEach(k => window.keysPressed && (window.keysPressed[k] = true));
                    } else {
                        window.keysPressed && (window.keysPressed[keys] = true);
                    }
                }
                break;

            case 'stopMove':
                // Clear all movement keys
                if (window.keysPressed) {
                    ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(k => {
                        window.keysPressed[k] = false;
                    });
                }
                break;

            case 'moveTo':
                // Move toward target position
                if (player && action.x !== undefined && action.y !== undefined) {
                    const dx = action.x - player.x;
                    const dy = action.y - player.y;

                    if (window.keysPressed) {
                        window.keysPressed['KeyW'] = dy < -10;
                        window.keysPressed['KeyS'] = dy > 10;
                        window.keysPressed['KeyA'] = dx < -10;
                        window.keysPressed['KeyD'] = dx > 10;
                    }
                }
                break;

            case 'selectCharacter':
                if (window.selectCharacter && action.characterId) {
                    window.selectCharacter(action.characterId);
                }
                break;

            case 'clickShopItem':
                if (gameState === 'shop' && action.index !== undefined) {
                    // Simulate shop click
                    const shopItems = window.shopItems;
                    if (shopItems && shopItems[action.index]) {
                        window.purchaseShopItem && window.purchaseShopItem(action.index);
                    }
                }
                break;

            case 'selectUpgrade':
                if (gameState === 'levelUp' && action.index !== undefined) {
                    const levelUpOptions = window.levelUpOptions;
                    if (levelUpOptions && levelUpOptions[action.index]) {
                        window.applyUpgrade && window.applyUpgrade(levelUpOptions[action.index]);
                        window.pendingLevelUps && window.pendingLevelUps--;
                        if (window.pendingLevelUps > 0) {
                            window.levelUpOptions = window.generateLevelUpOptions();
                        } else {
                            // Return to combat
                            window.gameState = 'waveCombat';
                        }
                    }
                }
                break;

            case 'startNextWave':
                if (gameState === 'shop' && window.startNextWave) {
                    window.startNextWave();
                }
                break;

            case 'rerollShop':
                if (gameState === 'shop' && window.rerollShop) {
                    window.rerollShop();
                }
                break;

            default:
                console.warn('Unknown action type:', action.type);
        }

        window.testHarness.logEvent('action_executed', { action: action });
    };

    // =========================================================================
    // ADVANCE TIME
    // =========================================================================

    window.testHarness._advanceTime = function(ms) {
        // LittleJS handles its own game loop, but we can track time
        // The game updates at 60fps in the engineUpdate
    };

    // =========================================================================
    // SERIALIZE/DESERIALIZE GAME STATE
    // =========================================================================

    window.testHarness._serializeGameState = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const enemies = window.getEnemies ? window.getEnemies() : [];

        return {
            gameState: window.getGameState ? window.getGameState() : null,
            wave: window.getCurrentWave ? window.getCurrentWave() : 0,
            waveTimer: window.getWaveTimer ? window.getWaveTimer() : 0,
            player: player ? {
                x: player.x,
                y: player.y,
                hp: player.hp,
                xp: player.xp,
                level: player.level,
                materials: player.materials,
                baseStats: { ...player.baseStats },
                weapons: player.weapons.map(w => ({ ...w })),
                items: player.items.map(i => ({ ...i }))
            } : null,
            enemyCount: enemies.length
        };
    };

    window.testHarness._deserializeGameState = function(state) {
        // Restoring full game state would require more infrastructure
        // For now, just log that this was attempted
        console.log('State restore requested:', state);
    };

    // =========================================================================
    // TESTING UTILITIES
    // =========================================================================

    window.testHarness.spawnForTesting = function(entityType, config) {
        if (entityType === 'enemy' && window.debugCommands) {
            window.debugCommands.spawnEnemy(
                config.subtype || 'babyAlien',
                config.x,
                config.y
            );
            return true;
        }
        return false;
    };

    window.testHarness.clearRoom = function() {
        if (window.debugCommands) {
            window.debugCommands.clearRoom();
            return true;
        }
        return false;
    };

    window.testHarness.setPlayerPosition = function(x, y) {
        const player = window.getPlayer ? window.getPlayer() : null;
        if (player) {
            player.x = x;
            player.y = y;
            return true;
        }
        return false;
    };

    // =========================================================================
    // GAME-SPECIFIC INVARIANTS
    // =========================================================================

    window.testHarness.addInvariant('playerInBounds', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            const x = player.pos ? player.pos.x : player.x;
            const y = player.pos ? player.pos.y : player.y;
            return x >= 0 && x <= 1200 && y >= 0 && y <= 900;
        },
        message: 'Player is out of arena bounds'
    });

    window.testHarness.addInvariant('validWaveNumber', {
        check: function() {
            const wave = window.getCurrentWave ? window.getCurrentWave() : 0;
            return wave >= 0 && wave <= 21;
        },
        message: 'Invalid wave number'
    });

    window.testHarness.addInvariant('playerHealthValid', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return !isNaN(player.hp) && player.hp <= player.getMaxHp();
        },
        message: 'Player health is invalid'
    });

    // =========================================================================
    // VISUAL CHECKS
    // =========================================================================

    window.testHarness.addVisualCheck(function(vision) {
        const checks = [];

        if (vision && vision.gameState === 'waveCombat') {
            checks.push({
                id: 'wave_display',
                question: `Does the wave display show "WAVE ${vision.wave}" with a countdown timer?`,
                context: `Expected timer: ${vision.waveTimer} seconds remaining`
            });

            if (vision.visibleEntities) {
                const enemies = vision.visibleEntities.filter(e => e.type === 'enemy');
                if (enemies.length > 0) {
                    checks.push({
                        id: 'enemy_rendering',
                        question: `Are ${enemies.length} enemies visible with distinct colors?`,
                        context: `Enemy types: ${[...new Set(enemies.map(e => e.subtype))].join(', ')}`
                    });
                }
            }
        }

        if (vision && vision.gameState === 'shop') {
            checks.push({
                id: 'shop_display',
                question: 'Is the shop screen showing items for purchase with prices?',
                context: `Player has ${vision.player?.materials || 0} materials`
            });
        }

        return checks;
    });

    console.log('[TestHarness] Brotato test-config.js loaded');

})();
