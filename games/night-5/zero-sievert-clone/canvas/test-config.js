// Test configuration for Zero Sievert Clone
window.testConfig = {
    gameName: 'zero-sievert-clone',

    // Action mappings
    actions: {
        moveDir: {
            type: 'keyboard',
            keyMap: {
                'north': 'w',
                'south': 's',
                'east': 'd',
                'west': 'a'
            },
            description: 'Move player in direction'
        },
        shoot: {
            type: 'mouse',
            button: 'left',
            description: 'Fire weapon'
        },
        aim: {
            type: 'mouse',
            button: 'right',
            description: 'Aim down sights'
        },
        reload: {
            type: 'keyboard',
            key: 'r',
            description: 'Reload weapon'
        },
        dodge: {
            type: 'keyboard',
            key: ' ',
            description: 'Dodge roll'
        },
        sprint: {
            type: 'keyboard',
            key: 'shift',
            description: 'Sprint'
        },
        interact: {
            type: 'keyboard',
            key: 'e',
            description: 'Interact/Loot'
        },
        startGame: {
            type: 'custom',
            handler: () => {
                if (typeof window.startGame === 'function') window.startGame();
            },
            description: 'Start new game'
        }
    },

    // State getters
    getters: {
        gameState: () => {
            const gs = typeof window.gameState === 'function' ? window.gameState() : { state: 'unknown' };
            return gs.state;
        },
        playerX: () => {
            const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
            return p ? p.x : 0;
        },
        playerY: () => {
            const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
            return p ? p.y : 0;
        },
        playerHealth: () => {
            const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
            return p ? p.health : 0;
        },
        playerAmmo: () => {
            const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
            return p ? p.ammo : 0;
        },
        playerStamina: () => {
            const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
            return p ? p.stamina : 0;
        },
        playerRubles: () => {
            const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
            return p ? p.rubles : 0;
        },
        enemyCount: () => {
            const e = typeof window.getEnemies === 'function' ? window.getEnemies() : [];
            return e.length;
        },
        bulletCount: () => {
            const b = typeof window.getBullets === 'function' ? window.getBullets() : [];
            return b.length;
        }
    }
};

// Override harness functions
if (window.testHarness) {
    console.log('Test harness config loaded for zero-sievert-clone');

    // Implement getGameInfo
    window.testHarness.getGameInfo = function() {
        return {
            name: 'zero-sievert-clone',
            version: '1.0.0',
            state: typeof window.gameState === 'function' ? window.gameState().state : 'unknown',
            actions: window.testConfig.actions,
            controls: {
                movement: 'WASD',
                aim: 'Mouse',
                shoot: 'LMB',
                aimDownSights: 'RMB',
                dodge: 'Space',
                reload: 'R',
                interact: 'E',
                sprint: 'Shift'
            }
        };
    };

    // Implement getVision
    window.testHarness.getVision = function() {
        const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
        const e = typeof window.getEnemies === 'function' ? window.getEnemies() : [];
        const b = typeof window.getBullets === 'function' ? window.getBullets() : [];
        const loot = typeof window.getLootContainers === 'function' ? window.getLootContainers() : [];
        const extract = typeof window.getExtractionPoints === 'function' ? window.getExtractionPoints() : [];
        const gs = typeof window.gameState === 'function' ? window.gameState() : { state: 'unknown' };

        return {
            gameState: gs.state,
            player: p ? {
                x: p.x,
                y: p.y,
                angle: p.angle,
                health: p.health,
                maxHealth: p.maxHealth,
                stamina: p.stamina,
                maxStamina: p.maxStamina,
                ammo: p.ammo,
                maxAmmo: p.maxAmmo,
                reloading: p.reloading,
                dodging: p.dodging,
                isSprinting: p.isSprinting,
                isAiming: p.isAiming,
                rubles: p.rubles,
                weapon: p.weapon ? p.weapon.name : null
            } : null,
            enemies: e.map(en => ({
                type: en.type,
                x: en.x,
                y: en.y,
                health: en.health,
                maxHealth: en.maxHealth,
                state: en.state
            })),
            bullets: b.length,
            lootContainers: loot.filter(l => !l.looted).length,
            extractionPoints: extract.map(ep => ({
                x: ep.x,
                y: ep.y,
                isExtracting: ep.isExtracting,
                progress: ep.extractTimer / ep.extractTime
            }))
        };
    };

    // Key simulation helpers
    function pressKey(key) {
        const lowerKey = key.toLowerCase();
        const keys = typeof window.getKeys === 'function' ? window.getKeys() : null;
        if (keys) {
            keys[lowerKey] = true;
        }
        window.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
    }

    function releaseKey(key) {
        const lowerKey = key.toLowerCase();
        const keys = typeof window.getKeys === 'function' ? window.getKeys() : null;
        if (keys) {
            keys[lowerKey] = false;
        }
        window.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true }));
    }

    function releaseAllKeys() {
        ['w', 'a', 's', 'd', 'e', 'r', 'shift', ' '].forEach(k => {
            releaseKey(k);
        });
    }

    // Implement _executeAction
    window.testHarness._executeAction = function(action) {
        switch (action.type) {
            case 'moveDir': {
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

            case 'shoot': {
                // Simulate mouse click
                const canvas = document.getElementById('gameCanvas');
                if (canvas) {
                    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
                    setTimeout(() => {
                        canvas.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));
                    }, 50);
                }
                break;
            }

            case 'reload': {
                pressKey('r');
                setTimeout(() => releaseKey('r'), 100);
                break;
            }

            case 'dodge': {
                pressKey(' ');
                setTimeout(() => releaseKey(' '), 100);
                break;
            }

            case 'sprint': {
                pressKey('shift');
                break;
            }

            case 'interact': {
                pressKey('e');
                setTimeout(() => releaseKey('e'), 100);
                break;
            }

            case 'stop': {
                releaseAllKeys();
                break;
            }

            case 'startGame': {
                if (typeof window.startGame === 'function') window.startGame();
                break;
            }

            default:
                console.warn('Unknown action type:', action.type);
        }
    };
}
