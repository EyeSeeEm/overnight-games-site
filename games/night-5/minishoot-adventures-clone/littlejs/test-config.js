/**
 * Minishoot Adventures Clone - Test Harness Configuration
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
            name: 'Minishoot Adventures Clone',
            version: '1.0.0',
            framework: 'LittleJS',
            description: 'Twin-stick shooter adventure with exploration',
            entityTypes: {
                enemies: ['scout', 'grasshopper', 'turret', 'heavy', 'elite'],
                pickups: ['crystal', 'health'],
                bosses: ['guardian']
            },
            actions: {
                move: { params: ['direction'], description: 'Move player in direction' },
                moveDir: { params: ['direction'], description: 'Move player using cardinal direction' },
                moveTo: { params: ['x', 'y'], description: 'Move player toward position' },
                shoot: { params: ['direction'], description: 'Shoot in direction' },
                dash: { params: [], description: 'Use dash ability' },
                supershot: { params: [], description: 'Use supershot ability' },
                allocateSkill: { params: ['skillId'], description: 'Allocate skill point' }
            },
            states: ['menu', 'playing', 'paused', 'gameOver', 'victory']
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
        const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;
        const boss = window.getBoss ? window.getBoss() : null;

        const vision = {
            gameState: gameState,
            currentRoom: currentRoom,
            player: null,
            visibleEntities: [],
            ui: {}
        };

        // Player info
        if (player) {
            vision.player = {
                x: player.pos ? player.pos.x : player.x,
                y: player.pos ? player.pos.y : player.y,
                health: player.health,
                maxHealth: player.maxHealth,
                level: player.level,
                xp: player.xp,
                xpToNext: player.getXpToNextLevel ? player.getXpToNextLevel() : 100,
                crystals: player.crystalCount,
                skillPoints: player.skillPoints,
                skills: player.skills ? { ...player.skills } : {},
                abilities: {
                    dashCooldown: player.dashCooldown,
                    supershotCooldown: player.supershotCooldown
                }
            };

            vision.ui = {
                hp: `${Math.floor(player.health)}/${player.maxHealth}`,
                level: player.level,
                crystals: player.crystalCount,
                skillPoints: player.skillPoints,
                room: currentRoom ? `${currentRoom.x},${currentRoom.y}` : 'unknown'
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

        // Boss
        if (boss && boss.hp > 0) {
            vision.visibleEntities.push({
                type: 'boss',
                subtype: 'guardian',
                id: boss.id,
                x: boss.pos ? boss.pos.x : boss.x,
                y: boss.pos ? boss.pos.y : boss.y,
                health: boss.hp,
                maxHealth: boss.maxHp,
                phase: boss.phase
            });
        }

        // Projectiles
        for (const proj of projectiles) {
            vision.visibleEntities.push({
                type: 'projectile',
                subtype: proj.friendly ? 'player' : 'enemy',
                x: proj.pos ? proj.pos.x : proj.x,
                y: proj.pos ? proj.pos.y : proj.y,
                damage: proj.damage
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
                    const px = player.pos ? player.pos.x : player.x;
                    const py = player.pos ? player.pos.y : player.y;
                    const dx = action.x - px;
                    const dy = action.y - py;

                    if (window.keysPressed) {
                        window.keysPressed['KeyW'] = dy > 10;
                        window.keysPressed['KeyS'] = dy < -10;
                        window.keysPressed['KeyA'] = dx < -10;
                        window.keysPressed['KeyD'] = dx > 10;
                    }
                }
                break;

            case 'shoot':
                // Set shooting direction
                if (player && action.direction) {
                    const shootDirs = {
                        'north': { x: 0, y: 1 },
                        'south': { x: 0, y: -1 },
                        'east': { x: 1, y: 0 },
                        'west': { x: -1, y: 0 },
                        'northeast': { x: 0.707, y: 0.707 },
                        'northwest': { x: -0.707, y: 0.707 },
                        'southeast': { x: 0.707, y: -0.707 },
                        'southwest': { x: -0.707, y: -0.707 }
                    };
                    const dir = shootDirs[action.direction];
                    if (dir && window.setShootDirection) {
                        window.setShootDirection(dir.x, dir.y);
                    }
                }
                break;

            case 'dash':
                if (player && player.dashCooldown <= 0 && window.triggerDash) {
                    window.triggerDash();
                }
                break;

            case 'supershot':
                if (player && player.supershotCooldown <= 0 && window.triggerSupershot) {
                    window.triggerSupershot();
                }
                break;

            case 'allocateSkill':
                if (player && player.skillPoints > 0 && action.skillId && window.allocateSkillPoint) {
                    window.allocateSkillPoint(action.skillId);
                }
                break;

            case 'startGame':
                if (window.startGame) {
                    window.startGame();
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
        // LittleJS handles its own game loop
    };

    // =========================================================================
    // SERIALIZE/DESERIALIZE GAME STATE
    // =========================================================================

    window.testHarness._serializeGameState = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const enemies = window.getEnemies ? window.getEnemies() : [];
        const currentRoom = window.getCurrentRoom ? window.getCurrentRoom() : null;

        return {
            gameState: window.getGameState ? window.getGameState() : null,
            currentRoom: currentRoom,
            player: player ? {
                x: player.pos ? player.pos.x : player.x,
                y: player.pos ? player.pos.y : player.y,
                hp: player.health,
                xp: player.xp,
                level: player.level,
                crystals: player.crystalCount,
                skillPoints: player.skillPoints,
                skills: { ...player.skills }
            } : null,
            enemyCount: enemies.length
        };
    };

    window.testHarness._deserializeGameState = function(state) {
        console.log('State restore requested:', state);
    };

    // =========================================================================
    // TESTING UTILITIES
    // =========================================================================

    window.testHarness.spawnForTesting = function(entityType, config) {
        if (entityType === 'enemy' && window.debugCommands) {
            window.debugCommands.spawnEnemy(
                config.subtype || 'scout',
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
        if (player && player.pos) {
            player.pos.x = x;
            player.pos.y = y;
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
            return x >= 0 && x <= 1280 && y >= 0 && y <= 720;
        },
        message: 'Player is out of bounds'
    });

    window.testHarness.addInvariant('playerHealthValid', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return !isNaN(player.health) && player.health <= player.maxHealth;
        },
        message: 'Player health is invalid'
    });

    window.testHarness.addInvariant('skillPointsValid', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.skillPoints >= 0;
        },
        message: 'Skill points cannot be negative'
    });

    // =========================================================================
    // VISUAL CHECKS
    // =========================================================================

    window.testHarness.addVisualCheck(function(vision) {
        const checks = [];

        if (vision && vision.gameState === 'playing') {
            checks.push({
                id: 'hud_display',
                question: 'Is the HUD showing HP bar, level, crystals, and skill points?',
                context: `Expected: HP ${vision.ui?.hp}, Level ${vision.ui?.level}, Crystals ${vision.ui?.crystals}`
            });

            if (vision.visibleEntities) {
                const enemies = vision.visibleEntities.filter(e => e.type === 'enemy');
                if (enemies.length > 0) {
                    checks.push({
                        id: 'enemy_rendering',
                        question: `Are ${enemies.length} enemies visible with correct colors?`,
                        context: `Enemy types: ${[...new Set(enemies.map(e => e.subtype))].join(', ')}`
                    });
                }

                const boss = vision.visibleEntities.find(e => e.type === 'boss');
                if (boss) {
                    checks.push({
                        id: 'boss_rendering',
                        question: 'Is the boss rendered with health bar and phase indicator?',
                        context: `Boss phase: ${boss.phase}, HP: ${boss.health}/${boss.maxHealth}`
                    });
                }
            }
        }

        if (vision && vision.gameState === 'menu') {
            checks.push({
                id: 'menu_display',
                question: 'Is the main menu showing title and start prompt?',
                context: 'Should show "MINISHOOT ADVENTURES" and "Click to Start"'
            });
        }

        return checks;
    });

    console.log('[TestHarness] Minishoot Adventures test-config.js loaded');

})();
