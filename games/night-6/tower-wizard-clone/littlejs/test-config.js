/**
 * Tower Wizard Clone - Test Harness Configuration
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
            name: 'Tower Wizard Clone',
            version: '1.0.0',
            framework: 'LittleJS',
            description: 'Incremental wizard tower game',
            entityTypes: {
                rooms: ['orb', 'study', 'forest', 'academy', 'dragonNest', 'alchemyLab'],
                spirits: ['cloudling', 'tome', 'druid', 'sage', 'keeper', 'alchemist'],
                resources: ['magic', 'knowledge', 'wood', 'research', 'dragonXP', 'gold']
            },
            actions: {
                clickOrb: { params: [], description: 'Click the magic orb' },
                summonSpirit: { params: [], description: 'Summon a spirit' },
                assignSpirit: { params: ['roomIndex', 'amount'], description: 'Assign spirits to room' },
                unassignSpirit: { params: ['roomIndex', 'amount'], description: 'Unassign spirits from room' },
                upgradeWizardMagic: { params: [], description: 'Upgrade wizard magic power' },
                ascendTower: { params: [], description: 'Ascend the tower' },
                prestige: { params: [], description: 'Perform prestige reset' },
                buyBlessing: { params: ['blessingId'], description: 'Purchase a blessing' }
            },
            states: ['menu', 'playing', 'paused']
        };
    };

    // =========================================================================
    // GET VISION
    // =========================================================================

    window.testHarness.getVision = function() {
        const player = window.getPlayer ? window.getPlayer() : null;
        const resources = window.getResources ? window.getResources() : null;
        const gameState = window.getGameState ? window.getGameState() : 'unknown';
        const towerLevel = window.getTowerLevel ? window.getTowerLevel() : 0;
        const prestigePoints = window.getPrestigePoints ? window.getPrestigePoints() : 0;

        const vision = {
            gameState: gameState,
            towerLevel: towerLevel,
            prestigePoints: prestigePoints,
            resources: resources,
            player: null,
            ui: {}
        };

        if (player) {
            vision.player = {
                magic: player.magic,
                lifetimeMagic: player.lifetimeMagic,
                spirits: player.spirits,
                unassignedSpirits: player.unassignedSpirits,
                towerLevel: player.towerLevel,
                wizardMagicLevel: player.wizardMagicLevel,
                assignments: { ...player.assignments },
                blessings: { ...player.blessings },
                playTime: player.playTime,
                totalClicks: player.totalClicks,
                prestigeCount: player.prestigeCount
            };

            vision.ui = {
                magic: formatNumber(player.magic),
                spirits: `${player.spirits} (${player.unassignedSpirits} free)`,
                towerLevel: player.towerLevel,
                prestigePoints: prestigePoints,
                canAscend: player.canAscend ? player.canAscend() : false,
                canPrestige: player.calculatePrestigePoints ? player.calculatePrestigePoints() > 0 : false
            };
        }

        return vision;
    };

    function formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }

    // =========================================================================
    // EXECUTE ACTION
    // =========================================================================

    window.testHarness._executeAction = function(action) {
        switch (action.type) {
            case 'clickOrb':
                if (window.clickOrb) {
                    window.clickOrb();
                }
                break;

            case 'summonSpirit':
                if (window.summonSpirit) {
                    window.summonSpirit();
                }
                break;

            case 'assignSpirit':
                if (window.assignSpirit && action.roomIndex !== undefined) {
                    window.assignSpirit(action.roomIndex, action.amount || 1);
                }
                break;

            case 'unassignSpirit':
                if (window.unassignSpirit && action.roomIndex !== undefined) {
                    window.unassignSpirit(action.roomIndex, action.amount || 1);
                }
                break;

            case 'upgradeWizardMagic':
                if (window.upgradeWizardMagic) {
                    window.upgradeWizardMagic();
                }
                break;

            case 'ascendTower':
                if (window.ascendTower) {
                    window.ascendTower();
                }
                break;

            case 'prestige':
                if (window.prestige) {
                    window.prestige();
                }
                break;

            case 'buyBlessing':
                if (window.buyBlessing && action.blessingId) {
                    window.buyBlessing(action.blessingId);
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
                magic: player.magic,
                lifetimeMagic: player.lifetimeMagic,
                spirits: player.spirits,
                towerLevel: player.towerLevel,
                prestigePoints: player.prestigePoints
            } : null
        };
    };

    window.testHarness._deserializeGameState = function(state) {
        console.log('State restore requested:', state);
    };

    // =========================================================================
    // TESTING UTILITIES
    // =========================================================================

    window.testHarness.addMagic = function(amount) {
        const player = window.getPlayer ? window.getPlayer() : null;
        if (player) {
            player.magic += amount;
            player.lifetimeMagic += amount;
            return true;
        }
        return false;
    };

    window.testHarness.setTowerLevel = function(level) {
        const player = window.getPlayer ? window.getPlayer() : null;
        if (player) {
            player.towerLevel = level;
            return true;
        }
        return false;
    };

    // =========================================================================
    // GAME-SPECIFIC INVARIANTS
    // =========================================================================

    window.testHarness.addInvariant('magicNotNegative', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.magic >= 0;
        },
        message: 'Magic cannot be negative'
    });

    window.testHarness.addInvariant('spiritsNotNegative', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.spirits >= 0 && player.unassignedSpirits >= 0;
        },
        message: 'Spirits cannot be negative'
    });

    window.testHarness.addInvariant('towerLevelValid', {
        check: function() {
            const player = window.getPlayer ? window.getPlayer() : null;
            if (!player) return true;
            return player.towerLevel >= 1 && player.towerLevel <= 12;
        },
        message: 'Tower level must be between 1 and 12'
    });

    // =========================================================================
    // VISUAL CHECKS
    // =========================================================================

    window.testHarness.addVisualCheck(function(vision) {
        const checks = [];

        if (vision && vision.gameState === 'playing') {
            checks.push({
                id: 'resource_display',
                question: 'Is the resource bar showing magic, spirits, and other resources?',
                context: `Expected: Magic ${vision.ui?.magic}, Spirits ${vision.ui?.spirits}`
            });

            checks.push({
                id: 'orb_display',
                question: 'Is the magic orb visible and clickable?',
                context: 'Should show a glowing purple/pink orb in the center'
            });

            checks.push({
                id: 'tower_display',
                question: 'Is the tower visible with unlocked floors?',
                context: `Tower level: ${vision.towerLevel}`
            });
        }

        if (vision && vision.gameState === 'menu') {
            checks.push({
                id: 'menu_display',
                question: 'Is the main menu showing title and start prompt?',
                context: 'Should show "TOWER WIZARD" and "Click anywhere to start"'
            });
        }

        return checks;
    });

    console.log('[TestHarness] Tower Wizard test-config.js loaded');

})();
