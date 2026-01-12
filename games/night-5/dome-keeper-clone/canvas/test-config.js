// Test configuration for Dome Keeper Clone
window.testConfig = {
    gameName: 'dome-keeper-clone',

    // Action mappings for this game
    actions: {
        moveDir: {
            type: 'keyboard',
            keyMap: {
                'north': 'w',
                'south': 's',
                'east': 'd',
                'west': 'a'
            },
            description: 'Move player in direction (mining phase)'
        },
        drill: {
            type: 'keyboard',
            keyMap: {
                'up': 'ArrowUp',
                'down': 'ArrowDown',
                'left': 'ArrowLeft',
                'right': 'ArrowRight'
            },
            description: 'Drill in direction while mining'
        },
        interact: {
            type: 'keyboard',
            key: 'e',
            description: 'Interact/deposit resources'
        },
        returnToDome: {
            type: 'keyboard',
            key: 'r',
            description: 'Quick return to dome (mining phase)'
        },
        toggleShop: {
            type: 'keyboard',
            key: 'Tab',
            description: 'Open/close upgrade shop'
        },
        useJetpack: {
            type: 'keyboard',
            key: ' ',
            description: 'Use jetpack (space)'
        },
        startWave: {
            type: 'custom',
            handler: () => {
                if (typeof startWave === 'function') startWave();
            },
            description: 'Start enemy wave'
        }
    },

    // State getters
    getters: {
        gameState: () => typeof gameState !== 'undefined' ? gameState : 'unknown',
        playerX: () => typeof player !== 'undefined' ? player.x : 0,
        playerY: () => typeof player !== 'undefined' ? player.y : 0,
        playerHealth: () => typeof player !== 'undefined' ? player.health : 0,
        playerCarrying: () => typeof player !== 'undefined' ? player.carrying : {},
        carryTotal: () => {
            if (typeof player === 'undefined') return 0;
            return Object.values(player.carrying).reduce((a, b) => a + b, 0);
        },
        domeHealth: () => typeof dome !== 'undefined' ? dome.health : 0,
        domeMaxHealth: () => typeof dome !== 'undefined' ? dome.maxHealth : 0,
        resources: () => typeof resources !== 'undefined' ? {...resources} : {},
        waveNumber: () => typeof waveNumber !== 'undefined' ? waveNumber : 0,
        waveTimer: () => typeof waveTimer !== 'undefined' ? waveTimer : 0,
        enemyCount: () => typeof enemies !== 'undefined' ? enemies.length : 0,
        upgrades: () => typeof purchasedUpgrades !== 'undefined' ? [...purchasedUpgrades] : [],
        shopOpen: () => typeof shopOpen !== 'undefined' ? shopOpen : false,
        cameraX: () => typeof camera !== 'undefined' ? camera.x : 0,
        cameraY: () => typeof camera !== 'undefined' ? camera.y : 0
    },

    // Validation rules
    validation: {
        playerMoved: (before, after) => {
            return before.playerX !== after.playerX || before.playerY !== after.playerY;
        },
        resourceCollected: (before, after) => {
            return after.carryTotal > before.carryTotal;
        },
        resourceDeposited: (before, after) => {
            const beforeTotal = Object.values(before.resources).reduce((a, b) => a + b, 0);
            const afterTotal = Object.values(after.resources).reduce((a, b) => a + b, 0);
            return afterTotal > beforeTotal;
        },
        enemyKilled: (before, after) => {
            return after.enemyCount < before.enemyCount;
        },
        domeDamaged: (before, after) => {
            return after.domeHealth < before.domeHealth;
        },
        upgradeObtained: (before, after) => {
            return after.upgrades.length > before.upgrades.length;
        },
        waveCompleted: (before, after) => {
            return after.waveNumber > before.waveNumber;
        }
    },

    // Test scenarios
    scenarios: {
        miningBasic: {
            description: 'Test basic mining mechanics',
            steps: [
                { action: 'moveDir', params: { direction: 'south' }, duration: 500 },
                { action: 'drill', params: { direction: 'down' }, duration: 2000 },
                { validate: 'playerMoved' }
            ]
        },
        resourceLoop: {
            description: 'Mine resources and return to dome',
            steps: [
                { action: 'moveDir', params: { direction: 'south' }, duration: 1000 },
                { action: 'drill', params: { direction: 'down' }, duration: 3000 },
                { action: 'returnToDome', duration: 100 },
                { wait: 2000 },
                { action: 'interact', duration: 100 },
                { validate: 'resourceDeposited' }
            ]
        },
        defensePhase: {
            description: 'Survive enemy wave',
            steps: [
                { action: 'startWave', duration: 100 },
                { wait: 10000 },
                { validate: 'waveCompleted' }
            ]
        }
    }
};

// Override harness functions after test-harness-base.js loads
if (window.testHarness) {
    console.log('Test harness config loaded for dome-keeper-clone');

    // Implement getGameInfo
    window.testHarness.getGameInfo = function() {
        return {
            name: 'dome-keeper-clone',
            version: '1.0.0',
            state: typeof gameState !== 'undefined' ? gameState : 'unknown',
            wave: typeof currentWave !== 'undefined' ? currentWave : 0,
            actions: window.testConfig.actions,
            controls: {
                movement: 'WASD',
                drill: 'Arrow Keys',
                interact: 'E',
                returnToDome: 'R',
                shop: 'Tab',
                jetpack: 'Space'
            }
        };
    };

    // Implement getVision
    window.testHarness.getVision = function() {
        // Use getter functions from game.js
        const p = typeof window.getPlayer === 'function' ? window.getPlayer() : null;
        const d = typeof window.getDome === 'function' ? window.getDome() : null;
        const e = typeof window.getEnemies === 'function' ? window.getEnemies() : [];
        const r = typeof window.getResources === 'function' ? window.getResources() : {};
        const cam = typeof window.getCamera === 'function' ? window.getCamera() : { x: 0, y: 0 };
        const waveInfo = typeof window.getCurrentWave === 'function' ? window.getCurrentWave() : 0;
        const gs = typeof window.gameState === 'function' ? window.gameState() : { state: 'unknown', wave: 0 };
        const upgrades = typeof window.getPurchasedUpgrades === 'function' ? window.getPurchasedUpgrades() : [];
        const shopOpen = typeof window.isShopOpen === 'function' ? window.isShopOpen() : false;

        return {
            gameState: gs.state || 'unknown',
            player: p ? {
                x: p.x,
                y: p.y,
                health: p.health,
                maxHealth: p.maxHealth,
                carrying: p.carrying,
                carryCapacity: p.carryCapacity,
                jetpackFuel: p.jetpackFuel,
                maxJetpackFuel: p.maxJetpackFuel
            } : null,
            dome: d ? {
                x: d.x,
                y: d.y,
                health: d.health,
                maxHealth: d.maxHealth
            } : null,
            enemies: e.map(en => ({
                type: en.type,
                x: en.x,
                y: en.y,
                health: en.health
            })),
            resources: r ? { ...r } : {},
            wave: {
                current: waveInfo || gs.wave || 0,
                timer: 0,
                phase: gs.state === 'defending' ? 'active' : 'idle'
            },
            camera: cam ? { x: cam.x, y: cam.y } : { x: 0, y: 0 },
            upgrades: upgrades ? [...upgrades] : [],
            shopOpen: shopOpen
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
        ['w', 'a', 's', 'd', 'e', 'r', 'Tab', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(k => {
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

            case 'drill': {
                releaseKey('ArrowUp');
                releaseKey('ArrowDown');
                releaseKey('ArrowLeft');
                releaseKey('ArrowRight');

                const arrowMap = {
                    'up': 'ArrowUp',
                    'down': 'ArrowDown',
                    'left': 'ArrowLeft',
                    'right': 'ArrowRight'
                };
                const key = arrowMap[action.direction];
                if (key) pressKey(key);
                break;
            }

            case 'interact': {
                pressKey('e');
                setTimeout(() => releaseKey('e'), 100);
                break;
            }

            case 'returnToDome': {
                pressKey('r');
                setTimeout(() => releaseKey('r'), 100);
                break;
            }

            case 'toggleShop': {
                pressKey('Tab');
                setTimeout(() => releaseKey('Tab'), 100);
                break;
            }

            case 'useJetpack': {
                pressKey(' ');
                break;
            }

            case 'stop': {
                releaseAllKeys();
                break;
            }

            case 'startWave': {
                if (typeof startWave === 'function') startWave();
                break;
            }

            default:
                console.warn('Unknown action type:', action.type);
        }
    };
}
