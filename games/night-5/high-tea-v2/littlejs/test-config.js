/**
 * High Tea v2 - Test Harness Configuration
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
            name: 'High Tea v2',
            version: '1.0.0',
            framework: 'LittleJS',
            description: 'Historical trading strategy game',
            entityTypes: {
                resources: ['silver', 'opium', 'tea'],
                ports: ['Lintin', 'Whampoa', 'Canton', 'Macao', 'Bocca Tigris']
            },
            actions: {
                buyOpium: { params: ['amount'], description: 'Buy opium' },
                buyTea: { params: ['amount'], description: 'Buy tea' },
                acceptOffer: { params: ['offerIndex'], description: 'Accept port offer' },
                shipTea: { params: [], description: 'Ship tea to Britain' },
                startGame: { params: [], description: 'Start the game' }
            },
            states: ['menu', 'playing', 'paused', 'event', 'gameOver', 'victory']
        };
    };

    // =========================================================================
    // GET VISION
    // =========================================================================

    window.testHarness.getVision = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const resources = window.getResources ? window.getResources() : null;
        const gameState = window.getGameState ? window.getGameState() : 'unknown';
        const currentYear = window.getCurrentYear ? window.getCurrentYear() : 1830;
        const mood = window.getMood ? window.getMood() : 0;
        const ships = window.getShips ? window.getShips() : 0;
        const portOffers = window.getPortOffers ? window.getPortOffers() : [];

        const vision = {
            gameState: gameState,
            year: currentYear,
            mood: mood,
            ships: ships,
            resources: resources,
            portOffers: portOffers,
            player: null,
            ui: {}
        };

        if (player) {
            vision.player = {
                silver: player.silver,
                opium: player.opium,
                tea: player.tea,
                ships: player.ships,
                bribeCards: player.bribeCards,
                yearIndex: player.yearIndex,
                monthsRemaining: player.monthsRemaining,
                clipperTimer: player.clipperTimer,
                opiumPrice: player.opiumPrice,
                teaPrice: player.teaPrice,
                totalOpiumSold: player.totalOpiumSold,
                totalTeaShipped: player.totalTeaShipped
            };

            vision.ui = {
                silver: player.silver,
                opium: player.opium,
                tea: player.tea,
                year: currentYear,
                mood: mood + '%',
                ships: ships,
                quota: player.getCurrentQuota ? player.getCurrentQuota() : 60
            };
        }

        return vision;
    };

    // =========================================================================
    // EXECUTE ACTION
    // =========================================================================

    window.testHarness._executeAction = function(action) {
        switch (action.type) {
            case 'buyOpium':
                if (window.buyOpium && action.amount) {
                    window.buyOpium(action.amount);
                }
                break;

            case 'buyTea':
                if (window.buyTea && action.amount) {
                    window.buyTea(action.amount);
                }
                break;

            case 'acceptOffer':
                if (window.acceptOffer && action.offerIndex !== undefined) {
                    window.acceptOffer(action.offerIndex);
                }
                break;

            case 'shipTea':
                if (window.shipTea) {
                    window.shipTea();
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

        return {
            gameState: window.getGameState ? window.getGameState() : null,
            player: player ? {
                silver: player.silver,
                opium: player.opium,
                tea: player.tea,
                ships: player.ships,
                yearIndex: player.yearIndex,
                mood: player.mood
            } : null
        };
    };

    window.testHarness._deserializeGameState = function(state) {
        console.log('State restore requested:', state);
    };

    // =========================================================================
    // TESTING UTILITIES
    // =========================================================================

    window.testHarness.addSilver = function(amount) {
        const player = window.getPlayer ? window.getPlayer() : null;
        if (player) {
            player.silver += amount;
            return true;
        }
        return false;
    };

    window.testHarness.addOpium = function(amount) {
        const player = window.getPlayer ? window.getPlayer() : null;
        if (player) {
            player.opium += amount;
            return true;
        }
        return false;
    };

    // =========================================================================
    // GAME-SPECIFIC INVARIANTS
    // =========================================================================

    window.testHarness.addInvariant('silverNotNegative', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.silver >= 0;
        },
        message: 'Silver cannot be negative'
    });

    window.testHarness.addInvariant('resourcesNotNegative', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.opium >= 0 && player.tea >= 0;
        },
        message: 'Resources cannot be negative'
    });

    window.testHarness.addInvariant('moodValid', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.mood >= 0 && player.mood <= 100;
        },
        message: 'Mood must be between 0 and 100'
    });

    // =========================================================================
    // VISUAL CHECKS
    // =========================================================================

    window.testHarness.addVisualCheck(function(vision) {
        const checks = [];

        if (vision && vision.gameState === 'playing') {
            checks.push({
                id: 'resource_display',
                question: 'Are silver, opium, and tea resources displayed in the UI?',
                context: `Expected: Silver ${vision.ui?.silver}, Opium ${vision.ui?.opium}, Tea ${vision.ui?.tea}`
            });

            checks.push({
                id: 'map_display',
                question: 'Is the Pearl River Delta map visible with ports?',
                context: 'Should show 5 trading ports with risk indicators'
            });

            if (vision.portOffers && vision.portOffers.length > 0) {
                checks.push({
                    id: 'offer_display',
                    question: 'Are port offers displayed on the map?',
                    context: `${vision.portOffers.length} active offers`
                });
            }
        }

        if (vision && vision.gameState === 'menu') {
            checks.push({
                id: 'menu_display',
                question: 'Is the main menu showing title and start prompt?',
                context: 'Should show "HIGH TEA" and "Click to Begin"'
            });
        }

        return checks;
    });

    console.log('[TestHarness] High Tea v2 test-config.js loaded');

})();
