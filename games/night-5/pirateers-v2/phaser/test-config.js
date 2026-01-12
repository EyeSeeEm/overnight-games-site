/**
 * Test Config - Pirateers Naval Combat
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
        console.error('[PirateersConfig] ERROR: test-harness-base.js must be loaded before test-config.js');
        return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER: Key simulation
    // ═══════════════════════════════════════════════════════════════════════════

    const _heldKeys = new Set();
    let scene = null;

    function getScene() {
        if (!scene && window.game && window.game.scene) {
            scene = window.game.scene.scenes[0];
        }
        return scene;
    }

    function pressKey(key) {
        const s = getScene();
        if (!s || !s.input || !s.input.keyboard) return;

        const keyMap = {
            'w': 'W', 'a': 'A', 's': 'S', 'd': 'D',
            'e': 'E', 'space': 'SPACE', 'shift': 'SHIFT',
            'arrowup': 'up', 'arrowdown': 'down', 'arrowleft': 'left', 'arrowright': 'right'
        };

        const mappedKey = keyMap[key.toLowerCase()] || key.toUpperCase();

        // For cursor keys
        if (['up', 'down', 'left', 'right'].includes(mappedKey)) {
            if (s.cursors) s.cursors[mappedKey].isDown = true;
        } else if (s.keys && s.keys[mappedKey]) {
            s.keys[mappedKey].isDown = true;
        }

        _heldKeys.add(key.toLowerCase());
    }

    function releaseKey(key) {
        const s = getScene();
        if (!s || !s.input || !s.input.keyboard) return;

        const keyMap = {
            'w': 'W', 'a': 'A', 's': 'S', 'd': 'D',
            'e': 'E', 'space': 'SPACE', 'shift': 'SHIFT',
            'arrowup': 'up', 'arrowdown': 'down', 'arrowleft': 'left', 'arrowright': 'right'
        };

        const mappedKey = keyMap[key.toLowerCase()] || key.toUpperCase();

        if (['up', 'down', 'left', 'right'].includes(mappedKey)) {
            if (s.cursors) s.cursors[mappedKey].isDown = false;
        } else if (s.keys && s.keys[mappedKey]) {
            s.keys[mappedKey].isDown = false;
        }

        _heldKeys.delete(key.toLowerCase());
    }

    function releaseAllKeys() {
        for (const key of _heldKeys) {
            releaseKey(key);
        }
        _heldKeys.clear();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: getGameInfo()
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.getGameInfo = function() {
        return {
            name: 'Pirateers - Naval Combat Adventure',
            genre: 'action-adventure',

            actions: {
                moveDir: {
                    description: 'Move ship in direction (WASD)',
                    parameters: ['direction'] // 'forward', 'backward', 'left', 'right'
                },
                turnDir: {
                    description: 'Turn ship left or right',
                    parameters: ['direction'] // 'left', 'right'
                },
                setSpeed: {
                    description: 'Set ship speed',
                    parameters: ['speed'] // 0-1 normalized
                },
                stop: {
                    description: 'Stop ship movement',
                    parameters: []
                },
                fireCannons: {
                    description: 'Fire broadside cannons',
                    parameters: []
                },
                fireSpecial: {
                    description: 'Fire special weapon',
                    parameters: ['weapon'] // 'fireballs', 'megashot', etc.
                },
                dock: {
                    description: 'Dock at nearby port (E key)',
                    parameters: []
                },
                selectWeapon: {
                    description: 'Select weapon slot',
                    parameters: ['slot'] // 1-4
                }
            },

            entityTypes: {
                enemies: ['merchant', 'pirate', 'navy_sloop', 'navy_frigate', 'pirate_captain', 'ghost_ship'],
                pickups: ['gold', 'rum', 'spices', 'silk', 'goldBars', 'gems'],
                structures: ['island', 'port', 'fort'],
                interactables: ['port']
            },

            recommendedStepMs: 500,

            winCondition: 'Defeat the Kraken after collecting all Neptune\'s Eye pieces',
            loseCondition: 'Ship armor reaches 0 (lose 25% cargo, return to base)',

            testableScenarios: [
                'Ship movement (WASD/Arrows)',
                'Broadside cannon fire (Space)',
                'Destroying enemy ships',
                'Collecting gold and cargo',
                'Docking at ports',
                'Trading at ports',
                'Ship upgrades',
                'Day/night cycle',
                'Quest completion',
                'Boss fight (Kraken)'
            ]
        };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: getVision()
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.getVision = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const enemies = window.getEnemies ? window.getEnemies() : [];
        const pickups = window.getPickups ? window.getPickups() : [];
        const ports = window.getPorts ? window.getPorts() : [];
        const islands = window.getIslands ? window.getIslands() : [];
        const gameStateInfo = window.getGameState ? window.getGameState() : null;
        const playerStats = window.getPlayerStats ? window.getPlayerStats() : null;
        const weapons = window.getWeapons ? window.getWeapons() : null;

        const canvas = document.querySelector('canvas');
        const viewport = {
            x: player ? player.x - 480 : 0,
            y: player ? player.y - 320 : 0,
            width: canvas ? canvas.width : 960,
            height: canvas ? canvas.height : 640
        };

        // Player state
        let playerVision = null;
        if (player && playerStats) {
            playerVision = {
                x: player.x,
                y: player.y,
                angle: player.angle,
                speed: player.shipData ? player.shipData.speed : 0,
                maxSpeed: player.shipData ? player.shipData.maxSpeed : 150,
                armor: playerStats.currentArmor,
                maxArmor: playerStats.maxArmor,
                invulnerable: player.shipData ? player.shipData.invulnerable : false,
                cannonReady: player.shipData ? player.shipData.cannonCooldown <= 0 : false
            };
        }

        // Visible entities
        const visibleEntities = [];

        // Enemies
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const data = enemy.enemyData;
            visibleEntities.push({
                id: data.id,
                type: 'enemy',
                subtype: data.type,
                x: enemy.x,
                y: enemy.y,
                angle: enemy.angle,
                health: data.hp,
                maxHealth: data.maxHp,
                state: data.state,
                distance: player ? Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) : 0
            });
        }

        // Pickups
        for (const pickup of pickups) {
            if (!pickup.active) continue;
            const data = pickup.pickupData;
            visibleEntities.push({
                id: data.id,
                type: 'pickup',
                subtype: data.type,
                x: pickup.x,
                y: pickup.y,
                value: data.value,
                lifetime: data.lifetime,
                distance: player ? Phaser.Math.Distance.Between(player.x, player.y, pickup.x, pickup.y) : 0
            });
        }

        // Ports
        for (const port of ports) {
            visibleEntities.push({
                id: port.id,
                type: 'port',
                subtype: port.type,
                x: port.x,
                y: port.y,
                name: port.name,
                nearPlayer: port.nearPlayer,
                distance: player ? Phaser.Math.Distance.Between(player.x, player.y, port.x, port.y) : 0
            });
        }

        // Islands
        for (const island of islands) {
            visibleEntities.push({
                id: island.id,
                type: 'island',
                x: island.x,
                y: island.y,
                radius: island.radius,
                distance: player ? Phaser.Math.Distance.Between(player.x, player.y, island.x, island.y) : 0
            });
        }

        // UI state
        const ui = {};
        if (gameStateInfo) {
            ui.gold = gameStateInfo.gold;
            ui.day = gameStateInfo.day;
            ui.cargoCount = gameStateInfo.cargo ? gameStateInfo.cargo.length : 0;
            ui.state = gameStateInfo.state;
        }
        if (playerStats) {
            ui.armor = playerStats.currentArmor;
            ui.maxArmor = playerStats.maxArmor;
        }

        // Available actions
        const availableActions = ['stop', 'moveDir', 'turnDir', 'setSpeed'];
        if (playerVision && playerVision.cannonReady) {
            availableActions.push('fireCannons');
        }
        if (weapons) {
            if (weapons.fireballs.equipped && weapons.fireballs.charges > 0) {
                availableActions.push('fireSpecial:fireballs');
            }
        }

        // Check if near port
        const nearbyPort = ports.find(p => p.nearPlayer);
        if (nearbyPort) {
            availableActions.push('dock');
        }

        // Context
        const context = {
            day: gameStateInfo ? gameStateInfo.day : 1,
            gold: gameStateInfo ? gameStateInfo.gold : 0,
            cargo: gameStateInfo ? gameStateInfo.cargo : [],
            nearPort: nearbyPort ? nearbyPort.name : null,
            enemyCount: enemies.filter(e => e.active).length,
            pickupCount: pickups.filter(p => p.active).length
        };

        return {
            viewport: viewport,
            player: playerVision,
            visibleEntities: visibleEntities,
            ui: ui,
            availableActions: availableActions,
            scene: gameStateInfo ? gameStateInfo.state : 'unknown',
            context: context
        };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: _executeAction()
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._executeAction = function(action) {
        switch (action.type) {

            case 'moveDir': {
                releaseAllKeys();
                const dirMap = {
                    'forward': 'w', 'up': 'w', 'north': 'w',
                    'backward': 's', 'down': 's', 'south': 's',
                    'left': 'a', 'west': 'a',
                    'right': 'd', 'east': 'd'
                };

                // For ship: W/S control speed, A/D control turning
                if (action.direction === 'forward' || action.direction === 'up') {
                    pressKey('w');
                } else if (action.direction === 'backward' || action.direction === 'down') {
                    pressKey('s');
                }
                break;
            }

            case 'turnDir': {
                if (action.direction === 'left') {
                    pressKey('a');
                } else if (action.direction === 'right') {
                    pressKey('d');
                }
                break;
            }

            case 'setSpeed': {
                const player = window.getPlayer();
                if (player && player.shipData) {
                    player.shipData.targetSpeed = player.shipData.maxSpeed * (action.speed || 0);
                }
                break;
            }

            case 'stop': {
                releaseAllKeys();
                const player = window.getPlayer();
                if (player && player.shipData) {
                    player.shipData.targetSpeed = 0;
                }
                break;
            }

            case 'fireCannons': {
                pressKey('space');
                setTimeout(() => releaseKey('space'), 100);
                window.testHarness.logEvent('action_fire_cannons', {});
                break;
            }

            case 'fireSpecial': {
                const weapons = window.getWeapons();
                if (weapons && action.weapon) {
                    // Select weapon first
                    const slotMap = { fireballs: '2', megashot: '3', shield: '4' };
                    // Fire with shift
                    pressKey('shift');
                    setTimeout(() => releaseKey('shift'), 100);
                }
                window.testHarness.logEvent('action_fire_special', { weapon: action.weapon });
                break;
            }

            case 'dock': {
                pressKey('e');
                setTimeout(() => releaseKey('e'), 100);
                window.testHarness.logEvent('action_dock', {});
                break;
            }

            case 'selectWeapon': {
                const slotKeys = { 1: 'ONE', 2: 'TWO', 3: 'THREE', 4: 'FOUR' };
                const key = slotKeys[action.slot];
                if (key) {
                    const s = getScene();
                    if (s && s.keys && s.keys[key]) {
                        s.keys[key].isDown = true;
                        setTimeout(() => { s.keys[key].isDown = false; }, 50);
                    }
                }
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
                console.warn(`[PirateersConfig] Unknown action type: ${action.type}`);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: Testing Utilities
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.spawnForTesting = function(type, subtype, x, y) {
        if (type === 'enemy' && window.debugCommands && window.debugCommands.spawnEnemy) {
            window.debugCommands.spawnEnemy(subtype, x, y);
            return `test_enemy_${Date.now()}`;
        }
        throw new Error(`Cannot spawn type: ${type}`);
    };

    window.testHarness.clearRoom = function() {
        if (window.debugCommands && window.debugCommands.clearRoom) {
            window.debugCommands.clearRoom();
        }
    };

    window.testHarness.setPlayerPosition = function(x, y) {
        if (window.debugCommands && window.debugCommands.teleport) {
            window.debugCommands.teleport(x, y);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // IMPLEMENT: Checkpoint Serialization
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness._serializeGameState = function() {
        if (window.debugCommands && window.debugCommands.saveState) {
            return window.debugCommands.saveState();
        }
        return null;
    };

    window.testHarness._deserializeGameState = function(state) {
        if (window.debugCommands && window.debugCommands.loadState) {
            window.debugCommands.loadState(state);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME-SPECIFIC INVARIANTS
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.addInvariant('playerArmorValid', {
        check: function() {
            const stats = window.getPlayerStats ? window.getPlayerStats() : null;
            if (!stats) return true;
            return stats.currentArmor >= 0 && stats.currentArmor <= stats.maxArmor;
        },
        message: function() {
            const stats = window.getPlayerStats ? window.getPlayerStats() : null;
            if (!stats) return 'No player stats';
            return `Player armor ${stats.currentArmor} out of range [0, ${stats.maxArmor}]`;
        }
    });

    window.testHarness.addInvariant('goldNonNegative', {
        check: function() {
            const state = window.getGameState ? window.getGameState() : null;
            return !state || state.gold >= 0;
        },
        message: 'Gold is negative'
    });

    window.testHarness.addInvariant('playerInBounds', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.x >= 0 && player.x <= 3000 && player.y >= 0 && player.y <= 3000;
        },
        message: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return 'No player';
            return `Player out of bounds at (${player.x}, ${player.y})`;
        }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME-SPECIFIC VISUAL CHECKS
    // ═══════════════════════════════════════════════════════════════════════════

    window.testHarness.addVisualCheck(function(vision) {
        const checks = [];

        if (vision.player) {
            checks.push({
                id: 'ship_visible',
                question: 'Is the player ship visible on screen with sails?',
                context: `Ship at (${Math.round(vision.player.x)}, ${Math.round(vision.player.y)})`
            });

            checks.push({
                id: 'armor_display',
                question: `Does the armor bar show approximately ${Math.round(vision.player.armor / vision.player.maxArmor * 100)}% health?`,
                context: `Armor: ${vision.player.armor}/${vision.player.maxArmor}`
            });
        }

        if (vision.ui) {
            checks.push({
                id: 'gold_display',
                question: `Does the gold counter show ${vision.ui.gold}?`,
                context: 'Check left sidebar'
            });

            checks.push({
                id: 'day_display',
                question: `Does the day counter show Day ${vision.ui.day}?`,
                context: 'Check top of left sidebar'
            });
        }

        const enemies = (vision.visibleEntities || []).filter(e => e.type === 'enemy');
        if (enemies.length > 0) {
            checks.push({
                id: 'enemies_visible',
                question: `Are ${enemies.length} enemy ships visible with health bars?`,
                context: `Types: ${enemies.map(e => e.subtype).join(', ')}`
            });
        }

        const ports = (vision.visibleEntities || []).filter(e => e.type === 'port');
        const nearPort = ports.find(p => p.nearPlayer);
        if (nearPort) {
            checks.push({
                id: 'dock_prompt',
                question: 'Is the "Press E to dock" prompt visible?',
                context: `Near port: ${nearPort.name}`
            });
        }

        return checks;
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT HOOKS
    // ═══════════════════════════════════════════════════════════════════════════

    // Watch for game state changes
    let lastGameState = null;
    setInterval(function() {
        const state = window.getGameState ? window.getGameState() : null;
        if (state && state.state !== lastGameState) {
            window.testHarness.logEvent('game_state_changed', {
                from: lastGameState,
                to: state.state
            });
            lastGameState = state.state;
        }
    }, 100);

    // Watch for gold changes
    let lastGold = null;
    setInterval(function() {
        const state = window.getGameState ? window.getGameState() : null;
        if (state && lastGold !== null && state.gold !== lastGold) {
            window.testHarness.logEvent('gold_changed', {
                from: lastGold,
                to: state.gold,
                diff: state.gold - lastGold
            });
        }
        if (state) lastGold = state.gold;
    }, 100);

    // Watch for day changes
    let lastDay = null;
    setInterval(function() {
        const state = window.getGameState ? window.getGameState() : null;
        if (state && lastDay !== null && state.day !== lastDay) {
            window.testHarness.logEvent('day_changed', {
                from: lastDay,
                to: state.day
            });
        }
        if (state) lastDay = state.day;
    }, 100);

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('[PirateersConfig] Pirateers test configuration loaded');

    // Auto-verify harness on load
    setTimeout(function() {
        const result = window.testHarness.verifyHarness();
        if (result.allPassed) {
            console.log('[PirateersConfig] Harness verification PASSED');
        } else {
            console.warn('[PirateersConfig] Harness verification FAILED:');
            for (const check of result.checks) {
                if (!check.passed) {
                    console.warn(`  - ${check.name}: ${check.error}`);
                }
            }
        }
    }, 1000);

})();
