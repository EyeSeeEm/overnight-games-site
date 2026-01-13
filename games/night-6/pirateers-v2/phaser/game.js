/**
 * Pirateers - Naval Combat Adventure
 * A top-down pirate action game built with Phaser 3
 */

// Game Constants
const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

// Ship Constants
const SHIP_BASE_SPEED = 150;
const SHIP_TURN_RATE = 120; // degrees per second
const SHIP_ACCELERATION = 200;
const SHIP_DECELERATION = 150;
const CANNON_COOLDOWN = 2000;
const CANNON_RANGE = 250;
const CANNONBALL_SPEED = 350;

// Day/Night Constants
const DAY_DURATION = 180000; // 3 minutes in ms

// Colors
const COLORS = {
    water: 0x2E6B8A,
    waterDeep: 0x1E4A5E,
    sand: 0xD4A84B,
    grass: 0x4A8C4A,
    wood: 0x8B4513,
    ui: 0x2C1810,
    gold: 0xFFD700,
    health: 0xC41E3A,
    healthBg: 0x3D1010
};

// Game State
let gameState = 'playing';
        // AUTO-START: Skip menu
        startGame();
        // // 'menu', 'base', 'sailing', 'treasure', 'kraken', 'gameover'
let currentDay = 1;
let dayTimeRemaining = DAY_DURATION;
let gold = 500;
let totalGoldEarned = 0;
let shipsDestroyed = 0;

// Kill streak system (iteration 75)
let killStreak = 0;
let lastKillTime = 0;
const STREAK_TIMEOUT = 8000; // 8 seconds to maintain streak

// Wind system (iteration 76)
let windDirection = 0; // 0-360 degrees
let windSpeed = 1.0; // 0.5 to 1.5 multiplier
let windChangeTimer = 0;
const WIND_CHANGE_INTERVAL = 30000; // Wind changes every 30 seconds

// Statistics tracking
let gameStats = {
    shotsFired: 0,
    cargoCollected: 0,
    timePlayed: 0,
    deathCount: 0,
    merchantsSunk: 0,
    piratesSunk: 0,
    navySunk: 0,
    ghostsSunk: 0,
    damageTaken: 0,
    damageDealt: 0
};

// Session high scores (iteration 98)
let sessionHighScores = {
    highestGold: 0,
    longestDay: 0,
    mostShipsSunk: 0
};

// Achievement system
const ACHIEVEMENTS = {
    first_blood: { name: 'First Blood', desc: 'Sink your first ship', condition: () => shipsDestroyed >= 1 },
    pirate_hunter: { name: 'Pirate Hunter', desc: 'Sink 10 pirate ships', condition: () => gameStats.piratesSunk >= 10 },
    merchant_raider: { name: 'Merchant Raider', desc: 'Sink 20 merchant ships', condition: () => gameStats.merchantsSunk >= 20 },
    fort_destroyer: { name: 'Fort Destroyer', desc: 'Destroy a coastal fort', condition: () => forts.some(f => f.fortData.destroyed) },
    wealthy: { name: 'Wealthy Captain', desc: 'Accumulate 1000 gold', condition: () => totalGoldEarned >= 1000 },
    survivor: { name: 'Survivor', desc: 'Survive to day 5', condition: () => currentDay >= 5 },
    treasure_hunter: { name: 'Treasure Hunter', desc: 'Find 3 treasures', condition: () => treasureMaps.filter(m => m.foundAt).length >= 3 },
    quest_master: { name: 'Quest Master', desc: 'Complete 5 quests', condition: () => completedQuests.length >= 5 }
};
let unlockedAchievements = [];

function checkAchievements() {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!unlockedAchievements.includes(id) && achievement.condition()) {
            unlockedAchievements.push(id);
            showAchievementNotification(achievement);
        }
    }
}

function showAchievementNotification(achievement) {
    showNotification(`🏆 Achievement: ${achievement.name}`, 'gold', 4000);
}

// Ship Type Definitions (from GDD)
const SHIP_TYPES = {
    sloop: {
        name: 'Balanced Sloop',
        description: 'Well-rounded ship for beginners',
        armor: 100,
        speed: 1.0,
        capacity: 10,
        turnRate: 1.0,
        texture: 'ship_player'
    },
    cutter: {
        name: 'Fast Cutter',
        description: 'Quick and agile, but fragile',
        armor: 75,
        speed: 1.3,
        capacity: 8,
        turnRate: 1.2,
        texture: 'ship_player'
    },
    galleon: {
        name: 'Heavy Galleon',
        description: 'Tough and roomy, but slow',
        armor: 150,
        speed: 0.7,
        capacity: 15,
        turnRate: 0.9,
        texture: 'ship_player'
    }
};

// Player Ship
let player = null;
let selectedShipType = 'sloop';
let selectedDifficulty = 'normal';
const DIFFICULTY_MODIFIERS = {
    easy: { enemyHp: 0.7, enemyDamage: 0.6, goldMultiplier: 1.2, playerDamage: 1.2 },
    normal: { enemyHp: 1.0, enemyDamage: 1.0, goldMultiplier: 1.0, playerDamage: 1.0 },
    hard: { enemyHp: 1.4, enemyDamage: 1.5, goldMultiplier: 0.8, playerDamage: 0.8 }
};
let playerStats = {
    armor: 1,
    speed: 1,
    reload: 1,
    cargo: 1,
    firepower: 1,
    currentArmor: 100,
    maxArmor: 100,
    shipType: 'sloop'
};

// Weapons
let weapons = {
    cannons: { equipped: true, charges: Infinity },
    fireballs: { equipped: false, charges: 0 },
    megashot: { equipped: false, charges: 0 },
    oilslick: { equipped: false, charges: 0 },
    ram: { equipped: false, charges: 0 }
};
let currentWeapon = 'cannons';
let ramCooldown = 0; // Battering ram cooldown

// Defensive items
let defensiveItems = {
    tortoise_shield: { charges: 0, active: false, duration: 0, damageReduction: 0.5 },
    energy_cloak: { charges: 0, active: false, duration: 0 }
};

// Cargo
let cargo = [];
let cargoCapacity = 10;
let lootBox = [];

// Quest definitions
const QUEST_TYPES = {
    bounty: {
        name: 'Bounty Hunt',
        description: 'Destroy {count} {target} ships',
        targets: ['pirate', 'navy_sloop', 'merchant'],
        countRange: [2, 5],
        rewardRange: [50, 150]
    },
    pirate_hunt: {
        name: 'Pirate Hunting',
        description: 'Sink {count} pirate ships',
        targets: ['pirate', 'pirate_captain'],
        countRange: [3, 6],
        rewardRange: [80, 200]
    },
    merchant_raid: {
        name: 'Merchant Raid',
        description: 'Attack {count} merchant vessels',
        targets: ['merchant'],
        countRange: [2, 4],
        rewardRange: [40, 120]
    },
    treasure_hunt: {
        name: 'Treasure Hunt',
        description: 'Find treasure at the marked location',
        targets: [],
        countRange: [1, 1],
        rewardRange: [100, 300]
    },
    fort_assault: {
        name: 'Fort Assault',
        description: 'Destroy a {target}',
        targets: ['fort_naval', 'fort_pirate', 'fort_merchant'],
        countRange: [1, 1],
        rewardRange: [150, 350]
    }
};

// Quests
let activeQuests = [];
let completedQuests = [];
let questBoard = []; // Available quests at port

// Neptune's Eye - legendary artifact (5 pieces unlock Kraken fight)
const NEPTUNES_EYE_PIECES = [
    { id: 'lens', name: 'Eye Lens', dropChance: 0.08, source: 'pirate_captain' },
    { id: 'frame', name: 'Golden Frame', dropChance: 0.07, source: 'navy_frigate' },
    { id: 'gem', name: 'Ocean Gem', dropChance: 0.06, source: 'ghost_ship' },
    { id: 'chain', name: 'Anchor Chain', dropChance: 0.10, source: 'fort' },
    { id: 'core', name: 'Kraken Core', dropChance: 0.05, source: 'treasure' }
];
let neptunesPieces = []; // Collected piece IDs

function checkNeptunesPieceDrop(sourceType, x, y) {
    const eligiblePieces = NEPTUNES_EYE_PIECES.filter(p =>
        p.source === sourceType && !neptunesPieces.includes(p.id)
    );

    for (const piece of eligiblePieces) {
        if (Math.random() < piece.dropChance) {
            neptunesPieces.push(piece.id);
            showNotification(`⚡ Neptune's Eye piece found: ${piece.name}!`, 'gold', 5000);
            showNotification(`Pieces: ${neptunesPieces.length}/5`, 'info', 3000);

            // Check if complete
            if (neptunesPieces.length >= 5) {
                showNotification('🌊 Neptune\'s Eye complete! Seek the Kraken!', 'gold', 6000);
                // Start periodic Kraken reminder (iteration 99)
                if (!window.krakenReminderActive) {
                    window.krakenReminderActive = true;
                    setInterval(() => {
                        if (neptunesPieces.length >= 5 && gameState === 'sailing') {
                            const dist = Phaser.Math.Distance.Between(player.x, player.y, KRAKEN_LAIR.x, KRAKEN_LAIR.y);
                            if (dist > 400) {
                                showNotification('The Kraken awaits in the southeast...', 'warning', 3000);
                            }
                        }
                    }, 60000); // Every 60 seconds
                }
            }
            return true;
        }
    }
    return false;
}

// Treasure maps (rare drops)
let treasureMaps = [];

// Kraken lair location (appears when Neptune's Eye is complete)
const KRAKEN_LAIR = { x: 2700, y: 2700, radius: 200 };

// Whirlpool hazards (iteration 81)
let whirlpools = [];
const WHIRLPOOL_COUNT = 3;
const WHIRLPOOL_RADIUS = 80;
const WHIRLPOOL_PULL = 50; // Pull strength

// Entities
let enemies = [];
let projectiles = [];
let pickups = [];
let islands = [];
let ports = [];
let forts = [];
let oilSlicks = [];

// Notification system
let notifications = [];

// Input
let keys = {};
let cursors = null;

// Phaser Game Config
const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.water,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Global game reference
let game = null;
let scene = null;

// ============================================================================
// PRELOAD
// ============================================================================

function preload() {
    // Create textures programmatically
    createTextures(this);
}

function createTextures(scene) {
    // Player ship texture
    const shipGfx = scene.make.graphics({ add: false });
    shipGfx.fillStyle(0x8B4513, 1);
    shipGfx.fillRect(0, 10, 40, 60);
    shipGfx.fillStyle(0xDEB887, 1);
    shipGfx.fillRect(5, 15, 30, 50);
    // Mast
    shipGfx.fillStyle(0x654321, 1);
    shipGfx.fillRect(18, 0, 4, 80);
    // Sail
    shipGfx.fillStyle(0xFFF8DC, 1);
    shipGfx.fillTriangle(20, 10, 35, 30, 20, 50);
    // Cannon ports
    shipGfx.fillStyle(0x2F2F2F, 1);
    shipGfx.fillRect(0, 25, 5, 8);
    shipGfx.fillRect(0, 45, 5, 8);
    shipGfx.fillRect(35, 25, 5, 8);
    shipGfx.fillRect(35, 45, 5, 8);
    shipGfx.generateTexture('ship_player', 40, 80);
    shipGfx.destroy();

    // Enemy ship texture (red sails)
    const enemyGfx = scene.make.graphics({ add: false });
    enemyGfx.fillStyle(0x5A3A1A, 1);
    enemyGfx.fillRect(0, 10, 36, 54);
    enemyGfx.fillStyle(0x8B5A2B, 1);
    enemyGfx.fillRect(4, 14, 28, 46);
    enemyGfx.fillStyle(0x4A3A2A, 1);
    enemyGfx.fillRect(16, 0, 4, 72);
    enemyGfx.fillStyle(0xC41E3A, 1);
    enemyGfx.fillTriangle(18, 8, 32, 26, 18, 44);
    enemyGfx.fillStyle(0x2F2F2F, 1);
    enemyGfx.fillRect(0, 22, 4, 7);
    enemyGfx.fillRect(0, 40, 4, 7);
    enemyGfx.fillRect(32, 22, 4, 7);
    enemyGfx.fillRect(32, 40, 4, 7);
    enemyGfx.generateTexture('ship_enemy', 36, 72);
    enemyGfx.destroy();

    // Navy ship (blue sails)
    const navyGfx = scene.make.graphics({ add: false });
    navyGfx.fillStyle(0x3A3A5A, 1);
    navyGfx.fillRect(0, 8, 44, 64);
    navyGfx.fillStyle(0x5A5A7A, 1);
    navyGfx.fillRect(4, 12, 36, 56);
    navyGfx.fillStyle(0x2A2A4A, 1);
    navyGfx.fillRect(20, 0, 4, 80);
    navyGfx.fillStyle(0x2E5090, 1);
    navyGfx.fillTriangle(22, 6, 40, 28, 22, 50);
    navyGfx.fillStyle(0x1F1F1F, 1);
    navyGfx.fillRect(0, 20, 5, 8);
    navyGfx.fillRect(0, 38, 5, 8);
    navyGfx.fillRect(0, 56, 5, 8);
    navyGfx.fillRect(39, 20, 5, 8);
    navyGfx.fillRect(39, 38, 5, 8);
    navyGfx.fillRect(39, 56, 5, 8);
    navyGfx.generateTexture('ship_navy', 44, 80);
    navyGfx.destroy();

    // Navy Frigate (larger, more powerful)
    const frigateGfx = scene.make.graphics({ add: false });
    frigateGfx.fillStyle(0x2A2A4A, 1);
    frigateGfx.fillRect(0, 5, 56, 90);
    frigateGfx.fillStyle(0x4A4A6A, 1);
    frigateGfx.fillRect(4, 10, 48, 80);
    // Two masts
    frigateGfx.fillStyle(0x1A1A3A, 1);
    frigateGfx.fillRect(20, 0, 5, 100);
    frigateGfx.fillRect(36, 10, 4, 80);
    // Sails
    frigateGfx.fillStyle(0x2E5090, 1);
    frigateGfx.fillTriangle(22, 5, 46, 30, 22, 55);
    frigateGfx.fillTriangle(38, 15, 54, 35, 38, 55);
    // Multiple cannon ports
    frigateGfx.fillStyle(0x1F1F1F, 1);
    for (let i = 0; i < 5; i++) {
        frigateGfx.fillRect(0, 18 + i * 15, 6, 8);
        frigateGfx.fillRect(50, 18 + i * 15, 6, 8);
    }
    frigateGfx.generateTexture('ship_frigate', 56, 100);
    frigateGfx.destroy();

    // Ghost ship (ethereal pirate)
    const ghostGfx = scene.make.graphics({ add: false });
    ghostGfx.fillStyle(0x4A6A8A, 0.7);
    ghostGfx.fillRect(0, 10, 38, 58);
    ghostGfx.fillStyle(0x6A8AAA, 0.6);
    ghostGfx.fillRect(4, 14, 30, 50);
    ghostGfx.fillStyle(0x3A5A7A, 0.7);
    ghostGfx.fillRect(17, 0, 4, 76);
    ghostGfx.fillStyle(0x8AAABB, 0.8);
    ghostGfx.fillTriangle(19, 8, 34, 28, 19, 48);
    ghostGfx.generateTexture('ship_ghost', 38, 76);
    ghostGfx.destroy();

    // Pirate Captain ship (black hull, gold trim, skull flag)
    const captainGfx = scene.make.graphics({ add: false });
    // Black hull
    captainGfx.fillStyle(0x1A1A1A, 1);
    captainGfx.fillRect(0, 8, 48, 74);
    captainGfx.fillStyle(0x2A2A2A, 1);
    captainGfx.fillRect(4, 12, 40, 66);
    // Gold trim
    captainGfx.fillStyle(0xFFD700, 1);
    captainGfx.fillRect(0, 8, 48, 3);
    captainGfx.fillRect(0, 79, 48, 3);
    // Two masts
    captainGfx.fillStyle(0x3A2A1A, 1);
    captainGfx.fillRect(18, 0, 5, 90);
    captainGfx.fillRect(32, 8, 4, 72);
    // Black sails with red tint
    captainGfx.fillStyle(0x4A1A1A, 1);
    captainGfx.fillTriangle(20, 5, 42, 28, 20, 50);
    captainGfx.fillTriangle(34, 12, 48, 30, 34, 48);
    // Skull emblem (simplified)
    captainGfx.fillStyle(0xFFFFFF, 1);
    captainGfx.fillCircle(30, 26, 5);
    // Cannon ports
    captainGfx.fillStyle(0x2F2F2F, 1);
    for (let i = 0; i < 4; i++) {
        captainGfx.fillRect(0, 20 + i * 14, 5, 7);
        captainGfx.fillRect(43, 20 + i * 14, 5, 7);
    }
    captainGfx.generateTexture('ship_captain', 48, 90);
    captainGfx.destroy();

    // Merchant ship (white sails)
    const merchantGfx = scene.make.graphics({ add: false });
    merchantGfx.fillStyle(0x6A5A4A, 1);
    merchantGfx.fillRect(0, 12, 32, 48);
    merchantGfx.fillStyle(0x9A8A7A, 1);
    merchantGfx.fillRect(4, 16, 24, 40);
    merchantGfx.fillStyle(0x5A4A3A, 1);
    merchantGfx.fillRect(14, 0, 4, 68);
    merchantGfx.fillStyle(0xFFFFF0, 1);
    merchantGfx.fillTriangle(16, 8, 28, 24, 16, 40);
    merchantGfx.generateTexture('ship_merchant', 32, 68);
    merchantGfx.destroy();

    // Cannonball
    const ballGfx = scene.make.graphics({ add: false });
    ballGfx.fillStyle(0x2F2F2F, 1);
    ballGfx.fillCircle(6, 6, 6);
    ballGfx.fillStyle(0x4F4F4F, 1);
    ballGfx.fillCircle(4, 4, 3);
    ballGfx.generateTexture('cannonball', 12, 12);
    ballGfx.destroy();

    // Fireball
    const fireGfx = scene.make.graphics({ add: false });
    fireGfx.fillStyle(0xFF4500, 1);
    fireGfx.fillCircle(10, 10, 10);
    fireGfx.fillStyle(0xFFD700, 1);
    fireGfx.fillCircle(10, 10, 6);
    fireGfx.fillStyle(0xFFFFFF, 1);
    fireGfx.fillCircle(10, 10, 3);
    fireGfx.generateTexture('fireball', 20, 20);
    fireGfx.destroy();

    // Island texture
    const islandGfx = scene.make.graphics({ add: false });
    islandGfx.fillStyle(COLORS.sand, 1);
    islandGfx.fillCircle(80, 80, 80);
    islandGfx.fillStyle(COLORS.grass, 1);
    islandGfx.fillCircle(80, 80, 60);
    islandGfx.generateTexture('island', 160, 160);
    islandGfx.destroy();

    // Port texture
    const portGfx = scene.make.graphics({ add: false });
    portGfx.fillStyle(COLORS.wood, 1);
    portGfx.fillRect(0, 0, 60, 40);
    portGfx.fillStyle(0x654321, 1);
    portGfx.fillRect(5, 5, 50, 30);
    portGfx.fillStyle(0xFFD700, 1);
    portGfx.fillRect(25, 15, 10, 10);
    portGfx.generateTexture('port', 60, 40);
    portGfx.destroy();

    // Loot crate
    const crateGfx = scene.make.graphics({ add: false });
    crateGfx.fillStyle(0x8B4513, 1);
    crateGfx.fillRect(0, 0, 20, 20);
    crateGfx.fillStyle(0xFFD700, 1);
    crateGfx.fillRect(3, 3, 14, 14);
    crateGfx.generateTexture('loot_crate', 20, 20);
    crateGfx.destroy();

    // Gold coin
    const coinGfx = scene.make.graphics({ add: false });
    coinGfx.fillStyle(0xFFD700, 1);
    coinGfx.fillCircle(8, 8, 8);
    coinGfx.fillStyle(0xDAA520, 1);
    coinGfx.fillCircle(8, 8, 5);
    coinGfx.generateTexture('gold_coin', 16, 16);
    coinGfx.destroy();

    // Fort texture
    const fortGfx = scene.make.graphics({ add: false });
    fortGfx.fillStyle(0x696969, 1);
    fortGfx.fillRect(0, 0, 80, 80);
    fortGfx.fillStyle(0x808080, 1);
    fortGfx.fillRect(5, 5, 70, 70);
    fortGfx.fillStyle(0x505050, 1);
    fortGfx.fillRect(0, 0, 20, 20);
    fortGfx.fillRect(60, 0, 20, 20);
    fortGfx.fillRect(0, 60, 20, 20);
    fortGfx.fillRect(60, 60, 20, 20);
    fortGfx.generateTexture('fort', 80, 80);
    fortGfx.destroy();
}

// ============================================================================
// CREATE
// ============================================================================

function create() {
    scene = this;

    // Set world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Create water background with depth effect
    createWaterBackground(this);

    // Create islands
    createIslands(this);

    // Create ports
    createPorts(this);

    // Create whirlpool hazards (iteration 81)
    createWhirlpools(this);

    // Create coastal forts
    createForts(this);

    // Create player ship
    createPlayer(this);

    // Setup camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // Zoom control with mouse wheel
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
        const zoomChange = deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomChange, 0.5, 2.0);
        this.cameras.main.zoom = newZoom;
    });

    // Setup input
    cursors = this.input.keyboard.createCursorKeys();
    keys = {
        W: this.input.keyboard.addKey('W'),
        A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'),
        D: this.input.keyboard.addKey('D'),
        Q: this.input.keyboard.addKey('Q'),
        R: this.input.keyboard.addKey('R'),
        T: this.input.keyboard.addKey('T'),
        Y: this.input.keyboard.addKey('Y'),
        SPACE: this.input.keyboard.addKey('SPACE'),
        SHIFT: this.input.keyboard.addKey('SHIFT'),
        E: this.input.keyboard.addKey('E'),
        ESC: this.input.keyboard.addKey('ESC'),
        ONE: this.input.keyboard.addKey('ONE'),
        TWO: this.input.keyboard.addKey('TWO'),
        THREE: this.input.keyboard.addKey('THREE'),
        FOUR: this.input.keyboard.addKey('FOUR'),
        FIVE: this.input.keyboard.addKey('FIVE'),
        B: this.input.keyboard.addKey('B')
    };

    // Create UI
    createUI(this);

    // Create enemy ships
    spawnInitialEnemies(this);

    // Generate initial quest board
    generateQuestBoard();

    // Initialize game state
    gameState = 'sailing';
    dayTimeRemaining = getDayDuration();

    // Expose for test harness
    window.startGame = startGame;
    window.getPlayer = () => player;
    window.getEnemies = () => enemies;
    window.getProjectiles = () => projectiles;
    window.getPickups = () => pickups;
    window.getIslands = () => islands;
    window.getPorts = () => ports;
    window.getGameState = () => ({
        state: gameState,
        day: currentDay,
        gold: gold,
        cargo: cargo,
        quests: activeQuests
    });
    window.getPlayerStats = () => playerStats;
    window.getWeapons = () => weapons;
}

// Ocean wave particles
let oceanWaves = [];

function createWaterBackground(scene) {
    // Create tiled water effect
    const waterGfx = scene.add.graphics();

    // Deep water base
    waterGfx.fillStyle(COLORS.waterDeep, 1);
    waterGfx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Add wave patterns
    waterGfx.fillStyle(COLORS.water, 0.5);
    for (let x = 0; x < WORLD_WIDTH; x += 200) {
        for (let y = 0; y < WORLD_HEIGHT; y += 200) {
            waterGfx.fillCircle(x + Math.random() * 100, y + Math.random() * 100, 80 + Math.random() * 40);
        }
    }

    // Initialize ambient waves
    for (let i = 0; i < 15; i++) {
        spawnOceanWave(scene, true);
    }
}

function spawnOceanWave(scene, initial = false) {
    if (!scene) return;

    // Spawn near camera view with margin
    const camX = scene.cameras?.main?.scrollX || 0;
    const camY = scene.cameras?.main?.scrollY || 0;

    let x, y;
    if (initial) {
        x = camX + Math.random() * GAME_WIDTH * 2;
        y = camY + Math.random() * GAME_HEIGHT * 2;
    } else {
        // Spawn at edge of viewport
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: x = camX - 50; y = camY + Math.random() * GAME_HEIGHT; break;
            case 1: x = camX + GAME_WIDTH + 50; y = camY + Math.random() * GAME_HEIGHT; break;
            case 2: x = camX + Math.random() * GAME_WIDTH; y = camY - 50; break;
            default: x = camX + Math.random() * GAME_WIDTH; y = camY + GAME_HEIGHT + 50;
        }
    }

    const wave = scene.add.ellipse(x, y, 30 + Math.random() * 40, 8 + Math.random() * 6, 0x5599BB, 0.2 + Math.random() * 0.15);
    wave.setDepth(0.5);

    wave.waveData = {
        vx: 5 + Math.random() * 10, // Waves drift east
        vy: Math.random() * 3 - 1.5,
        lifetime: 8000 + Math.random() * 4000,
        spawnTime: Date.now()
    };

    oceanWaves.push(wave);
}

function updateOceanWaves(delta) {
    if (!scene) return;

    const dt = delta / 1000;
    const camX = scene.cameras?.main?.scrollX || 0;
    const camY = scene.cameras?.main?.scrollY || 0;

    for (let i = oceanWaves.length - 1; i >= 0; i--) {
        const wave = oceanWaves[i];
        if (!wave.active) {
            oceanWaves.splice(i, 1);
            continue;
        }

        const data = wave.waveData;

        // Move wave
        wave.x += data.vx * dt;
        wave.y += data.vy * dt;

        // Gentle scale pulse
        const age = Date.now() - data.spawnTime;
        wave.scaleX = 1 + Math.sin(age * 0.002) * 0.1;

        // Check if off-screen
        if (wave.x < camX - 100 || wave.x > camX + GAME_WIDTH + 100 ||
            wave.y < camY - 100 || wave.y > camY + GAME_HEIGHT + 100) {
            wave.destroy();
            oceanWaves.splice(i, 1);
            spawnOceanWave(scene);
        }
    }

    // Maintain wave count
    if (oceanWaves.length < 12 && Math.random() < 0.02) {
        spawnOceanWave(scene);
    }
}

function createIslands(scene) {
    // Create several islands around the map
    const islandPositions = [
        { x: 400, y: 400, size: 1.2 },
        { x: 1500, y: 300, size: 1.0 },
        { x: 2500, y: 500, size: 1.5 },
        { x: 800, y: 1500, size: 0.8 },
        { x: 2200, y: 1400, size: 1.3 },
        { x: 1200, y: 2400, size: 1.1 },
        { x: 2600, y: 2200, size: 1.4 },
        { x: 500, y: 2600, size: 0.9 }
    ];

    islandPositions.forEach((pos, i) => {
        const island = scene.add.sprite(pos.x, pos.y, 'island');
        island.setScale(pos.size);
        island.setDepth(1);
        islands.push({
            sprite: island,
            x: pos.x,
            y: pos.y,
            radius: 80 * pos.size,
            id: `island_${i}`
        });
    });
}

// Whirlpool creation (iteration 81)
function createWhirlpools(scene) {
    const positions = [
        { x: 600, y: 1200 },
        { x: 1800, y: 800 },
        { x: 2000, y: 2000 }
    ];

    positions.forEach((pos, i) => {
        const whirlpool = scene.add.graphics();
        whirlpool.setPosition(pos.x, pos.y);
        whirlpool.setDepth(5);
        whirlpool.rotation = 0;
        whirlpools.push({
            graphics: whirlpool,
            x: pos.x,
            y: pos.y,
            rotation: 0,
            id: `whirlpool_${i}`
        });
    });
}

function updateWhirlpools(delta) {
    if (!scene || !player) return;

    whirlpools.forEach(wp => {
        // Animate rotation
        wp.rotation += delta * 0.002;
        wp.graphics.clear();
        wp.graphics.lineStyle(3, 0x4488AA, 0.6);

        // Draw spiral circles
        for (let r = WHIRLPOOL_RADIUS; r > 10; r -= 15) {
            wp.graphics.strokeCircle(0, 0, r);
        }
        wp.graphics.setRotation(wp.rotation);

        // Pull player if within range
        const dist = Phaser.Math.Distance.Between(player.x, player.y, wp.x, wp.y);
        if (dist < WHIRLPOOL_RADIUS * 2 && dist > 20) {
            const angle = Math.atan2(wp.y - player.y, wp.x - player.x);
            const pullStrength = (WHIRLPOOL_PULL * (1 - dist / (WHIRLPOOL_RADIUS * 2))) * (delta / 1000);
            player.x += Math.cos(angle) * pullStrength;
            player.y += Math.sin(angle) * pullStrength;

            // Damage if in center
            if (dist < 30 && !player.shipData.invulnerable) {
                damagePlayer(5);
                showNotification('Caught in whirlpool!', 'danger', 1500);
            }
        }
    });
}

function createPorts(scene) {
    // Create ports at some islands
    const portData = [
        { islandIdx: 0, name: 'Port Royal', type: 'trade', offsetX: 90, offsetY: 0 },
        { islandIdx: 2, name: 'Tortuga', type: 'pirate', offsetX: 110, offsetY: 20 },
        { islandIdx: 4, name: 'Nassau', type: 'trade', offsetX: 100, offsetY: -10 },
        { islandIdx: 6, name: 'Havana', type: 'shipyard', offsetX: 105, offsetY: 15 }
    ];

    portData.forEach((pd, i) => {
        const island = islands[pd.islandIdx];
        const port = scene.add.sprite(island.x + pd.offsetX, island.y + pd.offsetY, 'port');
        port.setDepth(2);

        // Port name text
        const nameText = scene.add.text(island.x + pd.offsetX, island.y + pd.offsetY - 35, pd.name, {
            fontSize: '12px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(3);

        ports.push({
            sprite: port,
            nameText: nameText,
            x: island.x + pd.offsetX,
            y: island.y + pd.offsetY,
            name: pd.name,
            type: pd.type,
            id: `port_${i}`,
            nearPlayer: false,
            // Trading goods and prices
            goods: generatePortGoods(pd.type),
            prices: generatePortPrices(pd.type)
        });
    });
}

function generatePortGoods(type) {
    const goods = {
        rum: { name: 'Rum', baseValue: 15 },
        spices: { name: 'Spices', baseValue: 25 },
        silk: { name: 'Silk', baseValue: 40 },
        goldBars: { name: 'Gold Bars', baseValue: 75 },
        gems: { name: 'Gems', baseValue: 120 }
    };

    const available = [];
    const goodKeys = Object.keys(goods);
    const count = type === 'trade' ? 4 : 3;

    for (let i = 0; i < count; i++) {
        const key = goodKeys[Math.floor(Math.random() * goodKeys.length)];
        available.push({
            type: key,
            ...goods[key],
            quantity: Math.floor(Math.random() * 10) + 5
        });
    }

    return available;
}

function generatePortPrices(type) {
    // Price multipliers based on port type
    const mult = type === 'pirate' ? 0.8 : type === 'trade' ? 1.0 : 1.1;
    return {
        buyMult: mult + Math.random() * 0.3,
        sellMult: mult - 0.1 + Math.random() * 0.2
    };
}

function createForts(scene) {
    // Create 3 coastal forts at strategic locations
    const fortData = [
        { x: 1800, y: 600, type: 'naval' },
        { x: 600, y: 2000, type: 'pirate' },
        { x: 2400, y: 1800, type: 'merchant' }
    ];

    fortData.forEach((fd, i) => {
        const fortType = FORT_TYPES[fd.type];

        // Create fort graphics (hexagonal structure)
        const fortGfx = scene.add.graphics();
        fortGfx.fillStyle(fortType.color, 1);
        fortGfx.fillCircle(0, 0, 40);
        fortGfx.fillStyle(0x333333, 1);
        fortGfx.fillCircle(0, 0, 25);
        fortGfx.fillStyle(fortType.color, 1);
        fortGfx.fillRect(-5, -30, 10, 25); // Cannon tower
        fortGfx.fillRect(-30, -5, 25, 10);
        fortGfx.fillRect(5, -5, 25, 10);
        fortGfx.fillRect(-5, 5, 10, 25);

        const fortTexture = fortGfx.generateTexture(`fort_${fd.type}`, 80, 80);
        fortGfx.destroy();

        const fort = scene.add.sprite(fd.x, fd.y, `fort_${fd.type}`);
        fort.setDepth(5);

        // Fort name
        const nameText = scene.add.text(fd.x, fd.y - 50, fortType.name, {
            fontSize: '11px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(6);

        // Health bar
        const hpBg = scene.add.rectangle(fd.x, fd.y + 55, 50, 6, 0x333333).setDepth(20);
        const hpBar = scene.add.rectangle(fd.x, fd.y + 55, 50, 6, 0xC41E3A).setDepth(21);

        forts.push({
            sprite: fort,
            nameText: nameText,
            hpBg: hpBg,
            hpBar: hpBar,
            x: fd.x,
            y: fd.y,
            type: fd.type,
            fortData: {
                hp: fortType.hp,
                maxHp: fortType.hp,
                damage: fortType.damage,
                range: fortType.range,
                fireRate: fortType.fireRate,
                goldReward: fortType.goldReward,
                cannonCooldown: 0,
                destroyed: false
            },
            id: `fort_${i}`
        });
    });
}

function updateForts(delta) {
    forts.forEach(fort => {
        if (fort.fortData.destroyed) return;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, fort.x, fort.y);

        // Fort fires at player when in range
        if (dist < fort.fortData.range) {
            fort.fortData.cannonCooldown -= delta;
            if (fort.fortData.cannonCooldown <= 0) {
                // Fire at player
                fireFortCannon(fort);
                fort.fortData.cannonCooldown = fort.fortData.fireRate;
            }
        }

        // Update health bar
        const hpPercent = fort.fortData.hp / fort.fortData.maxHp;
        fort.hpBar.setScale(hpPercent, 1);
    });
}

function fireFortCannon(fort) {
    const angle = Phaser.Math.Angle.Between(fort.x, fort.y, player.x, player.y);

    const ball = scene.physics.add.sprite(fort.x, fort.y, 'cannonball');
    ball.setDepth(15);
    ball.setScale(1.2);

    const speed = 280;
    ball.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
    );

    ball.projectileData = {
        damage: fort.fortData.damage,
        owner: 'fort',
        fortId: fort.id,
        maxRange: fort.fortData.range * 1.5,
        startX: fort.x,
        startY: fort.y
    };

    projectiles.push(ball);
    createMuzzleFlash(scene, fort.x, fort.y, angle);
}

function damageFort(fort, damage) {
    fort.fortData.hp -= damage;
    showDamageNumber(fort.x, fort.y, damage, 'fort');

    if (fort.fortData.hp <= 0) {
        destroyFort(fort);
    }
}

function destroyFort(fort) {
    fort.fortData.destroyed = true;
    fort.sprite.setAlpha(0.3);
    fort.nameText.setColor('#666666');
    fort.hpBg.setVisible(false);
    fort.hpBar.setVisible(false);

    // Reward player
    const fortType = FORT_TYPES[fort.type];
    gold += fortType.goldReward;
    totalGoldEarned += fortType.goldReward;

    // Fort destruction celebration (iteration 92)
    createExplosion(fort.x, fort.y);
    createFortDestructionCelebration(fort);
    shakeScreen(300, 0.008);
    showNotification(`${fortType.name} destroyed! +${fortType.goldReward}g`, 'gold', 3000);

    // Update quest progress for fort assault
    updateQuestProgress('fort_' + fort.type);

    // Check for Neptune's Eye piece drop
    checkNeptunesPieceDrop('fort', fort.x, fort.y);
}

function createPlayer(scene) {
    const shipType = SHIP_TYPES[selectedShipType] || SHIP_TYPES.sloop;

    player = scene.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, shipType.texture);
    player.setCollideWorldBounds(true);
    player.setDepth(10);
    player.setDrag(50);
    player.setAngularDrag(100);

    // Scale based on ship type
    const scales = { sloop: 1.5, cutter: 1.3, galleon: 1.8 };
    player.setScale(scales[selectedShipType] || 1.5);

    // Apply ship type to player stats
    playerStats.shipType = selectedShipType;
    playerStats.maxArmor = shipType.armor + (playerStats.armor - 1) * 25;
    playerStats.currentArmor = playerStats.maxArmor;
    cargoCapacity = shipType.capacity + (playerStats.cargo - 1) * 5;

    // Ship properties
    player.shipData = {
        speed: 0,
        targetSpeed: 0,
        maxSpeed: getMaxSpeed(),
        turnRate: getTurnRate(),
        cannonCooldown: 0,
        invulnerable: false,
        invulnTimer: 0
    };
}

function getMaxSpeed() {
    const shipType = SHIP_TYPES[selectedShipType] || SHIP_TYPES.sloop;
    const baseSpeed = SHIP_BASE_SPEED * shipType.speed;
    const speedBonus = playerStats.speed * 0.15;
    return baseSpeed * (1 + speedBonus);
}

function getTurnRate() {
    const shipType = SHIP_TYPES[selectedShipType] || SHIP_TYPES.sloop;
    const baseTurn = SHIP_TURN_RATE * shipType.turnRate;
    const turnBonus = playerStats.speed * 0.1;
    return baseTurn * (1 + turnBonus);
}

// Ship selection screen
function showShipSelection() {
    gameState = 'ship_select';

    const overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9)
        .setScrollFactor(0).setDepth(500);

    const title = scene.add.text(GAME_WIDTH / 2, 60, 'CHOOSE YOUR SHIP', {
        fontSize: '28px',
        color: '#FFD700',
        fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

    const shipTypes = ['sloop', 'cutter', 'galleon'];
    const shipButtons = [];

    shipTypes.forEach((type, i) => {
        const ship = SHIP_TYPES[type];
        const x = 160 + i * 220;
        const y = GAME_HEIGHT / 2;

        // Ship box
        const box = scene.add.rectangle(x, y, 180, 280, 0x2C1810, 0.9)
            .setScrollFactor(0).setDepth(501).setStrokeStyle(2, 0xFFD700);

        // Ship name
        const name = scene.add.text(x, y - 110, ship.name, {
            fontSize: '16px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(502);

        // Stats
        const stats = [
            `Armor: ${ship.armor}`,
            `Speed: ${Math.round(ship.speed * 100)}%`,
            `Cargo: ${ship.capacity}`,
            `Turn: ${Math.round(ship.turnRate * 100)}%`
        ].join('\n');
        const statsText = scene.add.text(x, y - 20, stats, {
            fontSize: '13px',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(502);

        // Description
        const desc = scene.add.text(x, y + 60, ship.description, {
            fontSize: '11px',
            color: '#AAAAAA',
            align: 'center',
            wordWrap: { width: 160 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(502);

        // Select button
        const btn = scene.add.text(x, y + 110, 'SELECT', {
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#FFD700',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive();

        btn.on('pointerdown', () => {
            selectedShipType = type;
            // Cleanup
            overlay.destroy();
            title.destroy();
            difficultyElements.forEach(el => el.destroy());
            shipButtons.forEach(b => {
                b.box.destroy();
                b.name.destroy();
                b.stats.destroy();
                b.desc.destroy();
                b.btn.destroy();
            });
            // Start game
            startGame();
        });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#FFFF00' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#FFD700' }));

        shipButtons.push({ box, name, stats: statsText, desc, btn });
    });

    // Difficulty selection at bottom
    const difficultyElements = [];
    const diffLabel = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Difficulty:', {
        fontSize: '14px', color: '#FFFFFF'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501);
    difficultyElements.push(diffLabel);

    const difficulties = ['easy', 'normal', 'hard'];
    const diffColors = { easy: '#44FF44', normal: '#FFFFFF', hard: '#FF4444' };
    difficulties.forEach((diff, i) => {
        const diffBtn = scene.add.text(GAME_WIDTH / 2 - 80 + i * 80, GAME_HEIGHT - 30, diff.toUpperCase(), {
            fontSize: '14px',
            color: selectedDifficulty === diff ? '#FFD700' : diffColors[diff],
            fontStyle: selectedDifficulty === diff ? 'bold' : 'normal'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setInteractive();

        diffBtn.on('pointerdown', () => {
            selectedDifficulty = diff;
            // Update all button styles
            difficultyElements.forEach((el, idx) => {
                if (idx > 0) { // Skip the label
                    const d = difficulties[idx - 1];
                    el.setColor(selectedDifficulty === d ? '#FFD700' : diffColors[d]);
                    el.setFontStyle(selectedDifficulty === d ? 'bold' : 'normal');
                }
            });
        });
        difficultyElements.push(diffBtn);
    });
}

function getDayDuration() {
    // Day 1: 2.5 min, scales up to 4 min by day 5+
    const baseMinutes = 2.5;
    const dayBonus = Math.min((currentDay - 1) * 0.3, 1.5);
    return (baseMinutes + dayBonus) * 60 * 1000;
}

// Quest system functions
function generateQuestBoard() {
    questBoard = [];
    const questTypeKeys = Object.keys(QUEST_TYPES);

    // Generate 3-4 quests
    const numQuests = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numQuests; i++) {
        const typeKey = questTypeKeys[Math.floor(Math.random() * questTypeKeys.length)];
        const questType = QUEST_TYPES[typeKey];

        const targetCount = Phaser.Math.Between(questType.countRange[0], questType.countRange[1]);
        const reward = Phaser.Math.Between(questType.rewardRange[0], questType.rewardRange[1]);
        const target = questType.targets.length > 0 ?
            questType.targets[Math.floor(Math.random() * questType.targets.length)] : null;

        // Generate short name for UI
        const shortNames = {
            bounty: 'Bounty',
            pirate_hunt: 'Pirates',
            merchant_raid: 'Raid',
            treasure_hunt: 'Treasure',
            fort_assault: 'Fort'
        };

        // Get target name for description
        const fortNames = {
            fort_naval: 'Naval Fort',
            fort_pirate: 'Pirate Stronghold',
            fort_merchant: 'Trade Fort'
        };
        const targetName = target ? (ENEMY_TYPES[target]?.name || fortNames[target] || target) : '';

        const quest = {
            id: `quest_${Date.now()}_${i}`,
            type: typeKey,
            name: questType.name,
            shortName: shortNames[typeKey] || 'Quest',
            description: questType.description
                .replace('{count}', targetCount)
                .replace('{target}', targetName),
            target: target,
            count: targetCount,
            required: targetCount,
            progress: 0,
            reward: reward,
            expiresDay: currentDay + 3
        };
        questBoard.push(quest);
    }
}

function acceptQuest(questIndex) {
    if (questIndex >= questBoard.length || activeQuests.length >= 3) return false;

    const quest = questBoard.splice(questIndex, 1)[0];
    activeQuests.push(quest);
    showNotification(`Quest accepted: ${quest.name}`, 'success', 2500);
    return true;
}

function updateQuestProgress(enemyType) {
    for (const quest of activeQuests) {
        if (quest.target === enemyType ||
            (quest.type === 'pirate_hunt' && (enemyType === 'pirate' || enemyType === 'pirate_captain'))) {
            quest.progress++;
            if (quest.progress >= quest.required) {
                completeQuest(quest);
            } else {
                showNotification(`Quest progress: ${quest.progress}/${quest.required}`, 'info', 1500);
            }
        }
    }
}

function completeQuest(quest) {
    const idx = activeQuests.indexOf(quest);
    if (idx > -1) {
        activeQuests.splice(idx, 1);
        completedQuests.push(quest.id);
        gold += quest.reward;
        totalGoldEarned += quest.reward;

        // Quest completion celebration (iteration 96)
        showNotification(`QUEST COMPLETE: ${quest.name}!`, 'gold', 3000);
        showNotification(`Reward: +${quest.reward} gold`, 'success', 2500);
        shakeScreen(100, 0.003);
        createQuestCompleteEffect();
    }
}

// Upgrade effect (iteration 97)
function createUpgradeEffect() {
    if (!scene || !player) return;

    // Green rising sparkles
    for (let i = 0; i < 10; i++) {
        const spark = scene.add.circle(
            player.x + Math.random() * 40 - 20,
            player.y + Math.random() * 40 - 20,
            3 + Math.random() * 4,
            0x44FF44
        ).setAlpha(0.8).setDepth(100);

        scene.tweens.add({
            targets: spark,
            y: spark.y - 50 - Math.random() * 30,
            alpha: 0,
            scale: 0.5,
            duration: 500 + Math.random() * 300,
            ease: 'Power2',
            onComplete: () => spark.destroy()
        });
    }

    // Flash player green
    player.setTint(0x44FF44);
    scene.time.delayedCall(200, () => player.clearTint());
}

// Quest completion effect (iteration 96)
function createQuestCompleteEffect() {
    if (!scene || !player) return;

    // Star burst around player
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const star = scene.add.text(
            player.x + Math.cos(angle) * 40,
            player.y + Math.sin(angle) * 40,
            '★',
            { fontSize: '20px', color: '#FFD700' }
        ).setOrigin(0.5).setDepth(100);

        scene.tweens.add({
            targets: star,
            x: player.x + Math.cos(angle) * 80,
            y: player.y + Math.sin(angle) * 80,
            alpha: 0,
            rotation: Math.PI,
            duration: 700,
            ease: 'Power2',
            onComplete: () => star.destroy()
        });
    }
}

function getUpgradeCost(statName) {
    // Each stat has exponentially increasing cost based on level
    const currentLevel = playerStats[statName] || 1;
    const baseCosts = {
        armor: 80,     // Cheaper - defensive
        speed: 100,    // Medium cost
        reload: 120,   // Higher cost - strong impact
        cargo: 60,     // Cheapest - QoL
        firepower: 150 // Most expensive - direct power
    };
    const base = baseCosts[statName] || 100;
    return Math.floor(base * Math.pow(1.5, currentLevel - 1));
}

function createUI(scene) {
    // Create UI layer that ignores main camera zoom
    // UI is rendered in screen space using scrollFactor(0)
    const ui = scene.add.container(0, 0);
    ui.setScrollFactor(0);
    ui.setDepth(1000); // Very high depth to be on top

    // Left sidebar background
    const sidebarBg = scene.add.rectangle(50, GAME_HEIGHT / 2, 100, GAME_HEIGHT, COLORS.ui, 0.85);
    ui.add(sidebarBg);

    // Day counter
    const dayText = scene.add.text(50, 20, `Day ${currentDay}`, {
        fontSize: '18px',
        color: '#FFD700',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    ui.add(dayText);
    scene.dayText = dayText;

    // Gold counter
    const goldIcon = scene.add.text(15, 55, '$', { fontSize: '20px', color: '#FFD700' });
    const goldText = scene.add.text(35, 55, gold.toString(), { fontSize: '18px', color: '#FFFFFF' });
    ui.add(goldIcon);
    ui.add(goldText);
    scene.goldText = goldText;

    // Armor bar
    const armorLabel = scene.add.text(50, 85, 'ARMOR', { fontSize: '10px', color: '#AAAAAA' }).setOrigin(0.5);
    const armorBg = scene.add.rectangle(50, 105, 80, 12, COLORS.healthBg);
    const armorBar = scene.add.rectangle(50, 105, 80, 12, COLORS.health).setOrigin(0.5);
    ui.add(armorLabel);
    ui.add(armorBg);
    ui.add(armorBar);
    scene.armorBar = armorBar;

    // Speed indicator with level text
    const speedLabel = scene.add.text(50, 130, 'SPEED', { fontSize: '10px', color: '#AAAAAA' }).setOrigin(0.5);
    const speedBg = scene.add.rectangle(50, 150, 80, 12, 0x333333);
    const speedBar = scene.add.rectangle(50, 150, 0, 12, 0x4488FF).setOrigin(0.5);
    const speedLevel = scene.add.text(50, 165, 'STOP', { fontSize: '11px', color: '#FF4444', fontStyle: 'bold' }).setOrigin(0.5);
    ui.add(speedLabel);
    ui.add(speedBg);
    ui.add(speedBar);
    ui.add(speedLevel);
    scene.speedBar = speedBar;
    scene.speedLevel = speedLevel;

    // Weapon slots
    scene.weaponSlots = [];
    scene.weaponCharges = [];
    for (let i = 0; i < 4; i++) {
        const slotBg = scene.add.rectangle(50, 200 + i * 60, 70, 50, 0x3D3D3D, 0.8);
        const slotNum = scene.add.text(18, 180 + i * 60, (i + 1).toString(), { fontSize: '12px', color: '#FFD700' });
        ui.add(slotBg);
        ui.add(slotNum);
        scene.weaponSlots.push(slotBg);
    }

    // Weapon labels and charge counts
    const weaponNames = ['Cannons', 'Fireball', 'Megashot', 'Shield'];
    const weaponKeys = ['cannons', 'fireballs', 'megashot', 'oilslick'];
    weaponNames.forEach((name, i) => {
        const text = scene.add.text(50, 193 + i * 60, name, {
            fontSize: '11px',
            color: i === 0 ? '#FFFFFF' : '#666666'
        }).setOrigin(0.5);
        ui.add(text);

        // Charge count display
        const weapon = weapons[weaponKeys[i]];
        const chargeText = i === 0 ? '∞' : (weapon.equipped ? weapon.charges.toString() : '-');
        const charge = scene.add.text(50, 210 + i * 60, chargeText, {
            fontSize: '10px',
            color: '#AAAAAA'
        }).setOrigin(0.5);
        ui.add(charge);
        scene.weaponCharges.push(charge);
    });

    // Cannon cooldown indicator
    const cooldownLabel = scene.add.text(50, 455, 'RELOAD', { fontSize: '10px', color: '#AAAAAA' }).setOrigin(0.5);
    const cooldownBg = scene.add.rectangle(50, 475, 80, 10, 0x333333);
    const cooldownBar = scene.add.rectangle(10, 475, 80, 10, 0x44FF44).setOrigin(0, 0.5);
    ui.add(cooldownLabel);
    ui.add(cooldownBg);
    ui.add(cooldownBar);
    scene.cooldownBar = cooldownBar;

    // Cargo display (bottom)
    const cargoBg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, GAME_WIDTH - 120, 50, COLORS.ui, 0.85);
    ui.add(cargoBg);

    const cargoLabel = scene.add.text(120, GAME_HEIGHT - 45, 'CARGO:', { fontSize: '12px', color: '#AAAAAA' });
    const cargoCount = scene.add.text(180, GAME_HEIGHT - 45, `${cargo.length}/${cargoCapacity}`, { fontSize: '12px', color: '#FFFFFF' });
    ui.add(cargoLabel);
    ui.add(cargoCount);
    scene.cargoCount = cargoCount;

    // Cargo value indicator (iteration 86)
    const cargoValue = scene.add.text(250, GAME_HEIGHT - 45, '($0)', { fontSize: '12px', color: '#FFD700' });
    ui.add(cargoValue);
    scene.cargoValue = cargoValue;

    // Cargo items display
    scene.cargoDisplay = [];
    for (let i = 0; i < 10; i++) {
        const itemSlot = scene.add.rectangle(120 + i * 35, GAME_HEIGHT - 20, 30, 20, 0x4A4A4A, 0.5);
        ui.add(itemSlot);
        scene.cargoDisplay.push(itemSlot);
    }

    // Top bar - Quests
    const topBg = scene.add.rectangle(GAME_WIDTH / 2, 20, GAME_WIDTH - 120, 40, COLORS.ui, 0.85);
    ui.add(topBg);

    const questLabel = scene.add.text(120, 12, 'QUESTS:', { fontSize: '12px', color: '#FFD700' });
    ui.add(questLabel);

    // Day timer (top right)
    const timerText = scene.add.text(GAME_WIDTH - 80, 12, '3:00', { fontSize: '18px', color: '#FFFFFF' });
    ui.add(timerText);
    scene.timerText = timerText;

    // Port interaction prompt (hidden by default)
    const portPrompt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'Press E to dock', {
        fontSize: '20px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);
    ui.add(portPrompt);
    scene.portPrompt = portPrompt;

    // Nearest port distance indicator (iteration 85)
    const nearestPortText = scene.add.text(GAME_WIDTH / 2, 20, '', {
        fontSize: '14px',
        color: '#88CCFF',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5).setVisible(false);
    ui.add(nearestPortText);
    scene.nearestPortText = nearestPortText;

    // Heading indicator (iteration 87)
    const headingText = scene.add.text(GAME_WIDTH / 2, 40, 'N 0\u00B0', {
        fontSize: '12px',
        color: '#AADDAA',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5);
    ui.add(headingText);
    scene.headingText = headingText;

    // Combat status indicator (iteration 88)
    const combatStatus = scene.add.text(GAME_WIDTH - 60, 20, '', {
        fontSize: '14px',
        color: '#FF4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);
    ui.add(combatStatus);
    scene.combatStatus = combatStatus;

    // Quest tracker (top right)
    const questHeader = scene.add.text(GAME_WIDTH - 100, 60, 'QUESTS', {
        fontSize: '12px',
        color: '#FFD700',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    ui.add(questHeader);

    const questText = scene.add.text(GAME_WIDTH - 100, 85, 'No active quests', {
        fontSize: '10px',
        color: '#AAAAAA',
        align: 'center',
        wordWrap: { width: 140 }
    }).setOrigin(0.5, 0);
    ui.add(questText);
    scene.questText = questText;

    // Control hints (fade out after a few seconds)
    const controlHints = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90,
        'WASD/Arrows: Steer  |  SPACE: Fire Cannons  |  E: Dock  |  ESC: Pause  |  B: Return to base', {
        fontSize: '12px',
        color: '#FFFFFF',
        backgroundColor: '#000000AA',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(102);
    ui.add(controlHints);

    // Initialize contextual tips system
    scene.shownTips = new Set();

    // Fade out control hints after 8 seconds
    scene.time.delayedCall(8000, () => {
        scene.tweens.add({
            targets: controlHints,
            alpha: 0,
            duration: 1000,
            onComplete: () => controlHints.destroy()
        });
    });

    // Show contextual tips at key moments
    scene.time.delayedCall(15000, () => showContextualTip('port_nearby', 'Tip: Sail near a port and press E to dock!'));
    scene.time.delayedCall(30000, () => showContextualTip('quest_hint', 'Tip: Visit ports to find quests and earn bonus gold!'));
    scene.time.delayedCall(60000, () => showContextualTip('weapon_hint', 'Tip: Pirate ports sell weapons - find Tortuga!'));

    // Minimap (bottom right)
    const minimapSize = 120;
    const minimapBg = scene.add.rectangle(
        GAME_WIDTH - minimapSize / 2 - 10,
        GAME_HEIGHT - minimapSize / 2 - 60,
        minimapSize,
        minimapSize,
        COLORS.waterDeep,
        0.9
    );
    ui.add(minimapBg);

    // Minimap border
    const minimapBorder = scene.add.rectangle(
        GAME_WIDTH - minimapSize / 2 - 10,
        GAME_HEIGHT - minimapSize / 2 - 60,
        minimapSize,
        minimapSize
    ).setStrokeStyle(2, 0xFFD700);
    ui.add(minimapBorder);

    scene.minimap = {
        x: GAME_WIDTH - minimapSize - 10,
        y: GAME_HEIGHT - minimapSize - 60,
        size: minimapSize,
        scale: minimapSize / WORLD_WIDTH
    };

    // Compass direction indicators
    const compassStyle = { fontSize: '10px', color: '#FFD700', fontStyle: 'bold' };
    const mapCenterX = GAME_WIDTH - minimapSize / 2 - 10;
    const mapCenterY = GAME_HEIGHT - minimapSize / 2 - 60;
    const compassN = scene.add.text(mapCenterX, mapCenterY - minimapSize / 2 - 8, 'N', compassStyle).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    const compassS = scene.add.text(mapCenterX, mapCenterY + minimapSize / 2 + 8, 'S', compassStyle).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    const compassE = scene.add.text(mapCenterX + minimapSize / 2 + 8, mapCenterY, 'E', compassStyle).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    const compassW = scene.add.text(mapCenterX - minimapSize / 2 - 8, mapCenterY, 'W', compassStyle).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    ui.add(compassN);
    ui.add(compassS);
    ui.add(compassE);
    ui.add(compassW);

    // Wind indicator (iteration 76)
    const windLabel = scene.add.text(mapCenterX, mapCenterY + minimapSize / 2 + 25, 'WIND', {
        fontSize: '9px', color: '#88CCFF'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    ui.add(windLabel);
    const windArrow = scene.add.text(mapCenterX, mapCenterY + minimapSize / 2 + 40, '↑', {
        fontSize: '16px', color: '#88CCFF', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    ui.add(windArrow);
    scene.windArrow = windArrow;
    scene.windLabel = windLabel;

    // Minimap player dot
    scene.minimapPlayer = scene.add.circle(0, 0, 3, 0x00FF00).setScrollFactor(0).setDepth(101);

    // Minimap island dots
    scene.minimapIslands = islands.map(island => {
        return scene.add.circle(
            scene.minimap.x + island.x * scene.minimap.scale,
            scene.minimap.y + island.y * scene.minimap.scale,
            4, COLORS.sand
        ).setScrollFactor(0).setDepth(101);
    });

    // Minimap port dots
    scene.minimapPorts = ports.map(port => {
        return scene.add.circle(
            scene.minimap.x + port.x * scene.minimap.scale,
            scene.minimap.y + port.y * scene.minimap.scale,
            3, COLORS.gold
        ).setScrollFactor(0).setDepth(101);
    });

    scene.ui = ui;

    // Night overlay for day/night cycle (fullscreen, starts transparent)
    scene.nightOverlay = scene.add.rectangle(
        WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
        WORLD_WIDTH * 2, WORLD_HEIGHT * 2,
        0x0000AA, 0
    ).setDepth(99);

    // Fog/weather overlay
    scene.fogOverlay = scene.add.rectangle(
        WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
        WORLD_WIDTH * 2, WORLD_HEIGHT * 2,
        0xCCCCCC, 0
    ).setDepth(98);
    scene.weatherState = { fogActive: false, fogIntensity: 0 };
}

// Cargo type definitions with values
const CARGO_TYPES = {
    rum: { name: 'Rum', value: 15, color: 0x8B4513, weight: 20 },
    spices: { name: 'Spices', value: 25, color: 0xD2691E, weight: 15 },
    silk: { name: 'Silk', value: 40, color: 0xDDA0DD, weight: 10 },
    goldBars: { name: 'Gold Bars', value: 75, color: 0xFFD700, weight: 4 },
    gems: { name: 'Gems', value: 120, color: 0xFF69B4, weight: 2 },
    cotton: { name: 'Cotton', value: 12, color: 0xFFFAFA, weight: 22 },
    sugar: { name: 'Sugar', value: 18, color: 0xFFF8DC, weight: 18 },
    tea: { name: 'Tea', value: 22, color: 0x90EE90, weight: 16 },
    tobacco: { name: 'Tobacco', value: 20, color: 0x8B5A2B, weight: 17 },
    weapons: { name: 'Weapons', value: 60, color: 0x708090, weight: 6 }
};

// Weighted cargo selection helper
function getWeightedCargo() {
    const entries = Object.entries(CARGO_TYPES);
    const totalWeight = entries.reduce((sum, [, data]) => sum + data.weight, 0);
    let random = Math.random() * totalWeight;
    for (const [key, data] of entries) {
        random -= data.weight;
        if (random <= 0) return key;
    }
    return 'rum'; // fallback
}

// Enemy type definitions with aggro ranges
const ENEMY_TYPES = {
    merchant: { type: 'merchant', texture: 'ship_merchant', hp: 50, speed: 60, damage: 5, goldMin: 20, goldMax: 40, cargoCount: 3, name: 'Merchant', aggroRange: 400, attackRange: 250 },
    pirate: { type: 'pirate', texture: 'ship_enemy', hp: 100, speed: 100, damage: 15, goldMin: 40, goldMax: 70, cargoCount: 2, name: 'Pirate', aggroRange: 500, attackRange: 300 },
    pirate_captain: { type: 'pirate_captain', texture: 'ship_captain', hp: 180, speed: 90, damage: 22, goldMin: 100, goldMax: 200, cargoCount: 6, name: 'Pirate Captain', special: 'rapidfire', aggroRange: 600, attackRange: 350 },
    navy_sloop: { type: 'navy_sloop', texture: 'ship_navy', hp: 80, speed: 100, damage: 12, goldMin: 30, goldMax: 50, cargoCount: 1, name: 'Navy Sloop', aggroRange: 550, attackRange: 280 },
    navy_frigate: { type: 'navy_frigate', texture: 'ship_frigate', hp: 200, speed: 70, damage: 25, goldMin: 80, goldMax: 150, cargoCount: 4, name: 'Navy Frigate', aggroRange: 650, attackRange: 320 },
    ghost_ship: { type: 'ghost_ship', texture: 'ship_ghost', hp: 120, speed: 120, damage: 20, goldMin: 60, goldMax: 100, cargoCount: 5, name: 'Ghost Ship', aggroRange: 700, attackRange: 350 }
};

// Fort types
const FORT_TYPES = {
    naval: { name: 'Naval Fort', hp: 300, damage: 25, range: 350, fireRate: 2500, color: 0x444488, goldReward: 150 },
    pirate: { name: 'Pirate Stronghold', hp: 250, damage: 20, range: 300, fireRate: 2000, color: 0x664422, goldReward: 120 },
    merchant: { name: 'Trade Fort', hp: 200, damage: 15, range: 280, fireRate: 3000, color: 0x228844, goldReward: 100 }
};

function spawnInitialEnemies(scene) {
    // Spawn variety of ships based on day - scales with progression
    const basicTypes = ['merchant', 'pirate', 'navy_sloop'];
    const advancedTypes = ['navy_frigate', 'ghost_ship', 'pirate_captain'];

    // Enemy count scales with day: 6 on day 1, up to 14 by day 5+
    const enemyCount = Math.min(6 + Math.floor(currentDay * 1.5), 14);
    // Advanced enemy chance increases with day: 10% at day 2, up to 50% at day 6+
    const advancedChance = Math.min(0.1 + (currentDay - 1) * 0.1, 0.5);

    for (let i = 0; i < enemyCount; i++) {
        // More advanced enemies appear later with increasing probability
        let typeKey;
        if (currentDay >= 2 && Math.random() < advancedChance) {
            typeKey = advancedTypes[Math.floor(Math.random() * advancedTypes.length)];
        } else {
            typeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
        }
        const typeData = ENEMY_TYPES[typeKey];
        const x = Math.random() * (WORLD_WIDTH - 400) + 200;
        const y = Math.random() * (WORLD_HEIGHT - 400) + 200;

        // Don't spawn on islands
        let onIsland = false;
        for (const island of islands) {
            const dist = Phaser.Math.Distance.Between(x, y, island.x, island.y);
            if (dist < island.radius + 50) {
                onIsland = true;
                break;
            }
        }
        if (onIsland) {
            i--;
            continue;
        }

        spawnEnemy(scene, x, y, typeData);
    }
}

function spawnEnemy(scene, x, y, typeData) {
    const enemy = scene.physics.add.sprite(x, y, typeData.texture);
    enemy.setDepth(9);
    enemy.setCollideWorldBounds(true);
    enemy.angle = Math.random() * 360;

    // Day scaling for aggro (enemies more aggressive in later days)
    const dayAggroBonus = 1 + (currentDay - 1) * 0.05; // 5% per day

    // Apply difficulty modifiers
    const diffMod = DIFFICULTY_MODIFIERS[selectedDifficulty];
    const scaledHp = Math.floor(typeData.hp * diffMod.enemyHp);
    const scaledDamage = Math.floor(typeData.damage * diffMod.enemyDamage);

    enemy.enemyData = {
        type: typeData.type,
        hp: scaledHp,
        maxHp: scaledHp,
        speed: typeData.speed,
        damage: scaledDamage,
        goldMin: typeData.goldMin,
        goldMax: typeData.goldMax,
        cargoCount: typeData.cargoCount,
        aggroRange: Math.floor((typeData.aggroRange || 500) * dayAggroBonus),
        attackRange: Math.floor((typeData.attackRange || 300) * dayAggroBonus),
        cannonCooldown: 0,
        state: 'patrol', // 'patrol', 'chase', 'attack', 'flee'
        patrolTarget: { x: x + Math.random() * 200 - 100, y: y + Math.random() * 200 - 100 },
        id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Boss spawn warning (iteration 90)
    const bossTypes = ['pirate_captain', 'navy_frigate', 'ghost_ship'];
    if (bossTypes.includes(typeData.type)) {
        showNotification(`${typeData.name} spotted nearby!`, 'danger', 3000);
        shakeScreen(100, 0.002);
    }

    // Health bar
    const hpBg = scene.add.rectangle(x, y - 45, 40, 6, 0x333333).setDepth(20);
    const hpBar = scene.add.rectangle(x, y - 45, 40, 6, 0xC41E3A).setDepth(21);
    enemy.hpBg = hpBg;
    enemy.hpBar = hpBar;

    // Difficulty indicator for bosses (iteration 94)
    const difficultyRatings = {
        'pirate_captain': 2,
        'navy_frigate': 2,
        'ghost_ship': 3
    };
    if (difficultyRatings[typeData.type]) {
        const skulls = '💀'.repeat(difficultyRatings[typeData.type]);
        enemy.difficultyText = scene.add.text(x, y - 55, skulls, {
            fontSize: '10px'
        }).setOrigin(0.5).setDepth(22);
    }

    enemies.push(enemy);
    return enemy;
}

// ============================================================================
// UPDATE
// ============================================================================

let isPaused = false;

function update(time, delta) {
    // Check for pause toggle
    if (Phaser.Input.Keyboard.JustDown(keys.ESC)) {
        togglePause();
    }

    if (isPaused) return;
    if (gameState === 'death') return; // Wait during death screen
    if (gameState !== 'sailing' && gameState !== 'base') return;

    if (gameState === 'sailing') {
        // Update day timer
        updateDayTimer(delta);

        // Update player
        updatePlayer(delta);

        // Update enemies
        updateEnemies(delta);

        // Update forts
        updateForts(delta);

        // Update whirlpool hazards (iteration 81)
        updateWhirlpools(delta);

        // Update enemy info panel
        updateEnemyInfoPanel();

        // Update projectiles
        updateProjectiles(delta);

        // Update pickups
        updatePickups(delta);

        // Update oil slicks
        updateOilSlicks(delta);

        // Check treasure map locations
        checkTreasureLocations();

        // Check port proximity
        checkPortProximity();

        // Update minimap
        updateMinimap();

        // Update ocean waves
        updateOceanWaves(delta);

        // Update UI
        updateUI();

        // Check achievements
        checkAchievements();

        // Check collisions
        checkCollisions();
    }
}

// Pause menu
let pauseOverlay = null;
let pauseMenu = [];

// Enemy info panel
let enemyInfoPanel = null;
let enemyInfoElements = [];

function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        // Create pause overlay
        pauseOverlay = scene.add.rectangle(
            scene.cameras.main.scrollX + GAME_WIDTH / 2,
            scene.cameras.main.scrollY + GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85
        ).setDepth(500).setScrollFactor(0);

        const title = scene.add.text(GAME_WIDTH / 2, 80, 'PAUSED', {
            fontSize: '36px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(501).setScrollFactor(0);
        pauseMenu.push(title);

        const resumeText = scene.add.text(GAME_WIDTH / 2, 130, 'Press ESC to Resume', {
            fontSize: '16px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(501).setScrollFactor(0);
        pauseMenu.push(resumeText);

        // Comprehensive stats panel
        const statsPanel = scene.add.rectangle(GAME_WIDTH / 2, 340, 400, 340, 0x1a0a00, 0.9)
            .setDepth(501).setScrollFactor(0).setStrokeStyle(2, 0x8B4513);
        pauseMenu.push(statsPanel);

        const statsTitle = scene.add.text(GAME_WIDTH / 2, 190, '--- VOYAGE STATISTICS ---', {
            fontSize: '16px', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(502).setScrollFactor(0);
        pauseMenu.push(statsTitle);

        const statsLeft = scene.add.text(GAME_WIDTH / 2 - 180, 220, [
            `Current Day: ${currentDay}`,
            `Gold: $${gold}`,
            `Total Earned: $${totalGoldEarned}`,
            `Cargo Collected: ${gameStats.cargoCollected}`,
            `Current Cargo: ${cargo.length}/${cargoCapacity}`,
            ``,
            `Ships Destroyed: ${shipsDestroyed}`,
            `  - Merchants: ${gameStats.merchantsSunk}`,
            `  - Pirates: ${gameStats.piratesSunk}`,
            `  - Navy: ${gameStats.navySunk}`,
            `  - Ghosts: ${gameStats.ghostsSunk}`
        ].join('\n'), {
            fontSize: '13px', color: '#DDDDDD', lineSpacing: 4
        }).setDepth(502).setScrollFactor(0);
        pauseMenu.push(statsLeft);

        const statsRight = scene.add.text(GAME_WIDTH / 2 + 20, 220, [
            `Shots Fired: ${gameStats.shotsFired}`,
            `Damage Dealt: ${gameStats.damageDealt}`,
            `Damage Taken: ${gameStats.damageTaken}`,
            `Times Sunk: ${gameStats.deathCount}`,
            ``,
            `Player Armor: ${playerStats.armor}`,
            `Player Speed: ${playerStats.speed}`,
            `Player Reload: ${playerStats.reload}`,
            `Player Firepower: ${playerStats.firepower}`,
            `Cargo Capacity: ${cargoCapacity}`
        ].join('\n'), {
            fontSize: '13px', color: '#DDDDDD', lineSpacing: 4
        }).setDepth(502).setScrollFactor(0);
        pauseMenu.push(statsRight);

        // Neptune's Eye progress
        const neptuneTitle = scene.add.text(GAME_WIDTH / 2, 475, `⚡ Neptune's Eye: ${neptunesPieces.length}/5 pieces`, {
            fontSize: '14px',
            color: neptunesPieces.length >= 5 ? '#FFD700' : '#6688FF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(502).setScrollFactor(0);
        pauseMenu.push(neptuneTitle);

        if (neptunesPieces.length > 0) {
            const pieceNames = neptunesPieces.map(id => {
                const piece = NEPTUNES_EYE_PIECES.find(p => p.id === id);
                return piece ? piece.name : id;
            });
            const neptuneText = scene.add.text(GAME_WIDTH / 2, 500, pieceNames.join(' | '), {
                fontSize: '11px', color: '#AAAAAA'
            }).setOrigin(0.5).setDepth(502).setScrollFactor(0);
            pauseMenu.push(neptuneText);
        }
    } else {
        // Remove pause menu
        if (pauseOverlay) {
            pauseOverlay.destroy();
            pauseOverlay = null;
        }
        pauseMenu.forEach(item => item.destroy());
        pauseMenu = [];
    }
}

// End of day warning state (iteration 83)
let dayEndWarningShown = { thirty: false, ten: false };

function updateDayTimer(delta) {
    dayTimeRemaining -= delta;

    if (dayTimeRemaining <= 0) {
        // End of day
        dayEndWarningShown = { thirty: false, ten: false }; // Reset for next day
        endDay();
    }

    // End of day warnings (iteration 83)
    const seconds = Math.max(0, Math.floor(dayTimeRemaining / 1000));
    if (seconds <= 30 && seconds > 10 && !dayEndWarningShown.thirty) {
        dayEndWarningShown.thirty = true;
        showNotification('30 seconds until sunset! Return to port!', 'warning', 3000);
        scene.timerText.setColor('#FFAA00');
    } else if (seconds <= 10 && !dayEndWarningShown.ten) {
        dayEndWarningShown.ten = true;
        showNotification('10 SECONDS! Day ending!', 'danger', 2000);
        scene.timerText.setColor('#FF4444');
        shakeScreen(100, 0.003);
    }

    // Update timer display
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    scene.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
}

function updatePlayer(delta) {
    const dt = delta / 1000;
    const ship = player.shipData;

    // Handle turning (A/D, arrow keys, or Q/R)
    if (keys.A.isDown || cursors.left.isDown || keys.Q.isDown) {
        player.angle -= ship.turnRate * dt;
    }
    if (keys.D.isDown || cursors.right.isDown || keys.R.isDown) {
        player.angle += ship.turnRate * dt;
    }

    // Handle speed (improved acceleration per feedback)
    const accel = SHIP_ACCELERATION * 1.5; // Faster acceleration
    const decel = SHIP_DECELERATION * 2.0; // Faster deceleration

    if (keys.W.isDown || cursors.up.isDown) {
        ship.targetSpeed = Math.min(ship.targetSpeed + accel * dt, ship.maxSpeed);
    } else if (keys.S.isDown || cursors.down.isDown) {
        ship.targetSpeed = Math.max(ship.targetSpeed - accel * dt, 0);
    } else {
        // Natural deceleration
        if (ship.targetSpeed > 0) {
            ship.targetSpeed = Math.max(0, ship.targetSpeed - decel * dt);
        }
    }

    // Apply speed smoothly
    ship.speed = Phaser.Math.Linear(ship.speed, ship.targetSpeed, 0.15);

    // Wind effect on speed (iteration 76)
    const shipHeading = (player.angle - 90 + 360) % 360;
    const windAngleDiff = Math.abs(((shipHeading - windDirection + 180) % 360) - 180);
    // Tailwind (same direction) = bonus, headwind (opposite) = penalty
    let windModifier = 1.0;
    if (windAngleDiff < 45) {
        windModifier = 1.0 + (windSpeed - 1) * 0.3; // Tailwind bonus
    } else if (windAngleDiff > 135) {
        windModifier = 1.0 - (windSpeed - 0.5) * 0.2; // Headwind penalty
    }

    // Move ship
    const rad = Phaser.Math.DegToRad(player.angle - 90);
    const effectiveSpeed = ship.speed * windModifier;
    player.setVelocity(
        Math.cos(rad) * effectiveSpeed,
        Math.sin(rad) * effectiveSpeed
    );

    // Ship wake effect when moving
    if (ship.speed > 30) {
        createWakeParticle(player, rad);
        createSmokeTrail(player, rad, ship.speed);
    }

    // Damage smoke when HP is low (iteration 82)
    const armorPct = playerStats.currentArmor / playerStats.maxArmor;
    if (armorPct < 0.5) {
        createDamageSmoke(player, armorPct);
    }

    // Handle cannon cooldown
    if (ship.cannonCooldown > 0) {
        ship.cannonCooldown -= delta;
    }

    // Handle firing
    if ((keys.SPACE.isDown || scene.input.activePointer.isDown) && ship.cannonCooldown <= 0) {
        fireCannons();
    }

    // Handle special weapon
    if (keys.SHIFT.isDown) {
        fireSpecialWeapon();
    }

    // Handle invulnerability
    if (ship.invulnerable) {
        ship.invulnTimer -= delta;
        if (ship.invulnTimer <= 0) {
            ship.invulnerable = false;
            player.alpha = 1;
        } else {
            player.alpha = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
        }
    }

    // Weapon selection (1-5 for different weapons)
    if (Phaser.Input.Keyboard.JustDown(keys.ONE)) currentWeapon = 'cannons';
    if (Phaser.Input.Keyboard.JustDown(keys.TWO)) currentWeapon = 'fireballs';
    if (Phaser.Input.Keyboard.JustDown(keys.THREE)) currentWeapon = 'megashot';
    if (Phaser.Input.Keyboard.JustDown(keys.FOUR)) currentWeapon = 'oilslick';
    if (Phaser.Input.Keyboard.JustDown(keys.FIVE)) currentWeapon = 'ram';

    // Update ram cooldown
    if (ramCooldown > 0) ramCooldown -= delta;

    // Defensive items (T for Tortoise Shield, Y for Energy Cloak)
    if (Phaser.Input.Keyboard.JustDown(keys.T)) {
        activateDefensiveItem('tortoise_shield');
    }
    if (Phaser.Input.Keyboard.JustDown(keys.Y)) {
        activateDefensiveItem('energy_cloak');
    }

    // Port docking
    if (Phaser.Input.Keyboard.JustDown(keys.E)) {
        tryDockAtPort();
    }

    // Return to base (B key)
    if (Phaser.Input.Keyboard.JustDown(keys.B)) {
        showNotification('Returning to port...', 'warning', 2000);
        scene.time.delayedCall(1500, () => endDay());
    }
}

function fireCannons() {
    const ship = player.shipData;
    const cooldownReduction = playerStats.reload * 0.15;
    const cooldown = CANNON_COOLDOWN * (1 - cooldownReduction);
    ship.cannonCooldown = cooldown;

    const baseDamage = 10 + playerStats.firepower * 5;
    const ballsPerSide = 3 + Math.floor(playerStats.firepower / 3);

    // Speed affects cannon spread: stop = -25%, full = +50%
    const speedPercent = ship.speed / ship.maxSpeed;
    let spreadModifier = 1.0;
    if (speedPercent < 0.1) {
        spreadModifier = 0.75; // Tighter spread when stopped
    } else if (speedPercent > 0.8) {
        spreadModifier = 1.5; // Wider spread at full speed
    } else {
        spreadModifier = 0.75 + speedPercent * 0.75; // Linear interpolation
    }
    const spreadAngle = 30 * spreadModifier;

    // Track shots fired
    gameStats.shotsFired += ballsPerSide * 2;

    // Fire from both sides (broadside)
    [-90, 90].forEach(side => {
        for (let i = 0; i < ballsPerSide; i++) {
            const angleOffset = (i - (ballsPerSide - 1) / 2) * (spreadAngle / ballsPerSide);
            const angle = player.angle + side + angleOffset;
            const rad = Phaser.Math.DegToRad(angle - 90);

            const spawnX = player.x + Math.cos(Phaser.Math.DegToRad(player.angle + side - 90)) * 25;
            const spawnY = player.y + Math.sin(Phaser.Math.DegToRad(player.angle + side - 90)) * 25;

            // Muzzle flash effect
            createMuzzleFlash(spawnX, spawnY);

            const ball = scene.physics.add.sprite(spawnX, spawnY, 'cannonball');
            ball.setDepth(15);
            ball.setVelocity(
                Math.cos(rad) * CANNONBALL_SPEED,
                Math.sin(rad) * CANNONBALL_SPEED
            );
            ball.projectileData = {
                damage: baseDamage,
                owner: 'player',
                type: 'cannon',
                range: CANNON_RANGE,
                traveled: 0
            };
            projectiles.push(ball);
        }
    });

    // Screen shake effect
    shakeScreen(100, 0.003);

    // Log event for harness
    if (window.testHarness) {
        window.testHarness.logEvent('cannons_fired', { damage: baseDamage, balls: ballsPerSide * 2 });
    }
}

// Screen shake utility function
function shakeScreen(duration, intensity) {
    if (!scene || !scene.cameras || !scene.cameras.main) return;
    scene.cameras.main.shake(duration, intensity);
}

// Floating damage number
function showDamageNumber(x, y, damage, forceColor = null) {
    if (!scene) return;

    let color = damage >= 30 ? '#FF4444' : damage >= 15 ? '#FFAA44' : '#FFFFFF';
    if (forceColor) color = typeof forceColor === 'number' ? '#' + forceColor.toString(16).padStart(6, '0') : forceColor;
    const text = scene.add.text(x, y, `-${damage}`, {
        fontSize: damage >= 30 ? '20px' : '16px',
        color: color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    }).setOrigin(0.5).setDepth(50);

    // Float up and fade out
    scene.tweens.add({
        targets: text,
        y: y - 40,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => text.destroy()
    });
}

// Treasure discovery effect (iteration 95)
function createTreasureDiscoveryEffect(x, y, reward) {
    if (!scene) return;

    // Screen shake
    shakeScreen(200, 0.005);

    // Gold explosion particles
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 30 + Math.random() * 40;
        const particle = scene.add.circle(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            5 + Math.random() * 5,
            0xFFD700
        ).setAlpha(0.9).setDepth(100);

        scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * (dist + 50),
            y: y + Math.sin(angle) * (dist + 50) - 30,
            alpha: 0,
            scale: 0.3,
            duration: 800 + Math.random() * 400,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }

    // Big treasure text
    const treasureText = scene.add.text(x, y - 40, 'TREASURE!', {
        fontSize: '32px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#8B4513',
        strokeThickness: 6
    }).setOrigin(0.5).setDepth(101);

    scene.tweens.add({
        targets: treasureText,
        y: y - 100,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => treasureText.destroy()
    });

    // Reward amount
    const rewardText = scene.add.text(x, y, `+${reward}g`, {
        fontSize: '24px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(101);

    scene.tweens.add({
        targets: rewardText,
        y: y - 60,
        alpha: 0,
        duration: 1200,
        delay: 300,
        ease: 'Power2',
        onComplete: () => rewardText.destroy()
    });
}

// Fort destruction celebration (iteration 92)
function createFortDestructionCelebration(fort) {
    if (!scene) return;

    // Multiple explosions over time
    for (let i = 0; i < 4; i++) {
        scene.time.delayedCall(i * 200, () => {
            const offsetX = Math.random() * 60 - 30;
            const offsetY = Math.random() * 60 - 30;
            createExplosion(fort.x + offsetX, fort.y + offsetY);
        });
    }

    // Victory text
    const victoryText = scene.add.text(fort.x, fort.y - 80, 'VICTORY!', {
        fontSize: '28px',
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#FF6600',
        strokeThickness: 5
    }).setOrigin(0.5).setDepth(100);

    scene.tweens.add({
        targets: victoryText,
        y: fort.y - 140,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => victoryText.destroy()
    });
}

// Attack telegraph (iteration 91)
function showAttackTelegraph(enemy) {
    if (!scene || !enemy.active) return;

    // Flash enemy yellow briefly
    enemy.setTint(0xFFFF00);
    scene.time.delayedCall(150, () => {
        if (enemy.active) enemy.clearTint();
    });

    // Exclamation mark above enemy
    const telegraph = scene.add.text(enemy.x, enemy.y - 60, '!', {
        fontSize: '24px',
        color: '#FF0000',
        fontStyle: 'bold',
        stroke: '#FFFF00',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(50);

    scene.tweens.add({
        targets: telegraph,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => telegraph.destroy()
    });
}

// Enemy flee indicator (iteration 79)
function showEnemyFlee(enemy) {
    if (!scene || !enemy.active) return;

    const fleeText = scene.add.text(enemy.x, enemy.y - 40, 'FLEEING!', {
        fontSize: '14px',
        color: '#FFAA00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5).setDepth(50);

    scene.tweens.add({
        targets: fleeText,
        y: enemy.y - 70,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => fleeText.destroy()
    });
}

// Repair animation at port (iteration 78)
function showRepairAnimation(healAmount) {
    if (!scene || !player) return;

    // Green healing particles around player
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        const particle = scene.add.circle(
            player.x + Math.cos(angle) * dist,
            player.y + Math.sin(angle) * dist,
            4 + Math.random() * 3,
            0x44FF44
        ).setAlpha(0.8).setDepth(50);

        scene.tweens.add({
            targets: particle,
            x: player.x,
            y: player.y,
            alpha: 0,
            scale: 0.5,
            duration: 600 + Math.random() * 400,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }

    // Healing text
    const healText = scene.add.text(player.x, player.y - 50, `+${healAmount} HP`, {
        fontSize: '18px',
        color: '#44FF44',
        fontStyle: 'bold',
        stroke: '#006600',
        strokeThickness: 3
    }).setOrigin(0.5).setDepth(51);

    scene.tweens.add({
        targets: healText,
        y: player.y - 90,
        alpha: 0,
        duration: 1200,
        ease: 'Power2',
        onComplete: () => healText.destroy()
    });

    showNotification('Ship repaired!', 'success', 2000);
}

// Critical hit indicator (iteration 77)
function showCriticalHit(x, y) {
    if (!scene) return;

    const text = scene.add.text(x, y - 50, 'CRITICAL!', {
        fontSize: '22px',
        color: '#FFFF00',
        fontStyle: 'bold',
        stroke: '#FF6600',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(51);

    scene.tweens.add({
        targets: text,
        y: y - 80,
        scaleX: 1.3,
        scaleY: 1.3,
        alpha: 0,
        duration: 600,
        ease: 'Back.easeOut',
        onComplete: () => text.destroy()
    });

    // Screen shake for extra impact
    shakeScreen(80, 0.003);
}

// Explosion effect
function createExplosion(x, y) {
    if (!scene) return;

    // Create explosion particles
    const colors = [0xFF4500, 0xFF6600, 0xFFAA00, 0xFFFF00, 0x888888];
    const particles = [];

    for (let i = 0; i < 15; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 12;
        const particle = scene.add.circle(x, y, size, color).setDepth(45);

        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        particles.push({ obj: particle, vx, vy });

        scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0.3,
            duration: 500 + Math.random() * 300,
            ease: 'Power2',
            onUpdate: () => {
                particle.x += vx * 0.016;
                particle.y += vy * 0.016;
            },
            onComplete: () => particle.destroy()
        });
    }

    // Flash effect
    const flash = scene.add.circle(x, y, 40, 0xFFFFFF, 0.8).setDepth(44);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 2,
        duration: 200,
        onComplete: () => flash.destroy()
    });

    // Small screen shake
    shakeScreen(100, 0.004);
}

// Muzzle flash effect
function createMuzzleFlash(x, y) {
    if (!scene) return;

    // Bright orange/yellow flash
    const flash = scene.add.circle(x, y, 10, 0xFFAA00, 0.9).setDepth(46);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 1.5,
        duration: 80,
        onComplete: () => flash.destroy()
    });

    // Small smoke puff
    const smoke = scene.add.circle(x, y, 6, 0x888888, 0.6).setDepth(45);
    scene.tweens.add({
        targets: smoke,
        alpha: 0,
        scale: 2,
        y: y - 10,
        duration: 200,
        onComplete: () => smoke.destroy()
    });
}

// Water splash effect when cannonball hits water
function createSplash(x, y) {
    if (!scene) return;

    // Central splash ring
    const ring = scene.add.circle(x, y, 5, 0x66BBFF, 0.7).setDepth(16);
    scene.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => ring.destroy()
    });

    // Water droplet particles
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 10;
        const droplet = scene.add.circle(
            x + Math.cos(angle) * 3,
            y + Math.sin(angle) * 3,
            2 + Math.random() * 2,
            0x88CCFF,
            0.8
        ).setDepth(17);

        scene.tweens.add({
            targets: droplet,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist - 10,
            alpha: 0,
            scale: 0.3,
            duration: 200 + Math.random() * 150,
            ease: 'Power2',
            onComplete: () => droplet.destroy()
        });
    }
}

// Ship wake particle effect
let wakeTimer = 0;
function createWakeParticle(ship, rad) {
    if (!scene) return;

    // Throttle wake creation
    wakeTimer++;
    if (wakeTimer % 3 !== 0) return;

    // Spawn wake behind ship
    const behindX = ship.x - Math.cos(rad) * 35;
    const behindY = ship.y - Math.sin(rad) * 35;

    const wake = scene.add.ellipse(behindX, behindY, 8, 4, 0xAADDFF, 0.4)
        .setDepth(3)
        .setAngle(ship.angle);

    scene.tweens.add({
        targets: wake,
        alpha: 0,
        scaleX: 2.5,
        scaleY: 1.5,
        duration: 600,
        ease: 'Power1',
        onComplete: () => wake.destroy()
    });
}

// Damage smoke effect (iteration 82)
let damageSmokeTimer = 0;
function createDamageSmoke(ship, armorPct) {
    if (!scene) return;

    // More frequent smoke when more damaged
    damageSmokeTimer++;
    const interval = armorPct < 0.25 ? 3 : 6;
    if (damageSmokeTimer % interval !== 0) return;

    const offsetX = Math.random() * 20 - 10;
    const offsetY = Math.random() * 20 - 10;
    const smoke = scene.add.circle(
        ship.x + offsetX,
        ship.y + offsetY,
        5 + Math.random() * 5,
        armorPct < 0.25 ? 0x444444 : 0x666666
    ).setAlpha(0.6).setDepth(15);

    scene.tweens.add({
        targets: smoke,
        y: smoke.y - 30 - Math.random() * 20,
        alpha: 0,
        scale: 2,
        duration: 800 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => smoke.destroy()
    });
}

// Smoke trail effect for ships
let smokeTimer = 0;
function createSmokeTrail(ship, rad, speed) {
    if (!scene) return;

    // Only create smoke at higher speeds
    if (speed < 80) return;

    // Throttle smoke creation
    smokeTimer++;
    if (smokeTimer % 5 !== 0) return;

    // Spawn smoke near the back of ship (slightly offset from center mast)
    const behindX = ship.x - Math.cos(rad) * 15;
    const behindY = ship.y - Math.sin(rad) * 15;

    const smoke = scene.add.circle(behindX, behindY + (Math.random() - 0.5) * 5, 3 + Math.random() * 3, 0x666666, 0.3)
        .setDepth(4);

    scene.tweens.add({
        targets: smoke,
        alpha: 0,
        scale: 2.5,
        y: behindY - 20 - Math.random() * 10,
        x: behindX + (Math.random() - 0.5) * 15,
        duration: 800 + Math.random() * 400,
        ease: 'Power1',
        onComplete: () => smoke.destroy()
    });
}

function fireSpecialWeapon() {
    if (currentWeapon === 'cannons') return;

    const weapon = weapons[currentWeapon];
    if (!weapon || !weapon.equipped || weapon.charges <= 0) return;

    weapon.charges--;

    if (currentWeapon === 'fireballs') {
        // Fire fireballs forward
        const rad = Phaser.Math.DegToRad(player.angle - 90);
        const ball = scene.physics.add.sprite(player.x, player.y, 'fireball');
        ball.setDepth(15);
        ball.setVelocity(Math.cos(rad) * CANNONBALL_SPEED * 0.8, Math.sin(rad) * CANNONBALL_SPEED * 0.8);
        ball.projectileData = {
            damage: 40,
            owner: 'player',
            type: 'fireball',
            range: CANNON_RANGE * 1.5,
            traveled: 0,
            dot: true // damage over time
        };
        projectiles.push(ball);
        createMuzzleFlash(player.x, player.y);
        gameStats.shotsFired++;
    } else if (currentWeapon === 'megashot') {
        // Fire a single powerful cannonball forward
        const rad = Phaser.Math.DegToRad(player.angle - 90);
        const ball = scene.physics.add.sprite(player.x, player.y, 'cannonball');
        ball.setDepth(15);
        ball.setScale(2); // Larger projectile
        ball.setVelocity(Math.cos(rad) * CANNONBALL_SPEED * 1.2, Math.sin(rad) * CANNONBALL_SPEED * 1.2);
        ball.projectileData = {
            damage: 100, // High damage
            owner: 'player',
            type: 'megashot',
            range: CANNON_RANGE * 2,
            traveled: 0
        };
        projectiles.push(ball);

        // Big muzzle flash and screen shake
        createMuzzleFlash(player.x, player.y);
        createMuzzleFlash(player.x + (Math.random() - 0.5) * 10, player.y + (Math.random() - 0.5) * 10);
        shakeScreen(200, 0.008);
        gameStats.shotsFired++;
    } else if (currentWeapon === 'oilslick') {
        // Drop oil slick behind the ship
        const rad = Phaser.Math.DegToRad(player.angle + 90); // Behind the ship
        const dropX = player.x + Math.cos(rad) * 40;
        const dropY = player.y + Math.sin(rad) * 40;

        const slick = scene.add.ellipse(dropX, dropY, 80, 60, 0x222222, 0.7);
        slick.setDepth(5);
        slick.slickData = {
            lifetime: 8000,
            slowFactor: 0.4, // Slow enemies to 40% speed
            spawnTime: Date.now()
        };
        oilSlicks.push(slick);

        // Visual effect
        scene.tweens.add({
            targets: slick,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.5,
            duration: 500
        });
        showNotification('Oil Slick deployed!', 'warning', 1500);
    } else if (currentWeapon === 'ram') {
        // Battering ram - requires high speed, hits enemies in front
        const shipSpeed = player.shipData.speed;
        const minRamSpeed = player.shipData.maxSpeed * 0.7; // Need 70% speed

        if (shipSpeed < minRamSpeed) {
            weapon.charges++; // Refund charge
            showNotification('Need more speed for ram! (70%+)', 'warning', 2000);
            return;
        }

        if (ramCooldown > 0) {
            weapon.charges++; // Refund charge
            showNotification('Ram cooling down!', 'warning', 1500);
            return;
        }

        // Find enemy in front of ship
        const ramRange = 80;
        const rad = Phaser.Math.DegToRad(player.angle - 90);
        const frontX = player.x + Math.cos(rad) * 30;
        const frontY = player.y + Math.sin(rad) * 30;

        let hitEnemy = null;
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Phaser.Math.Distance.Between(frontX, frontY, enemy.x, enemy.y);
            if (dist < ramRange) {
                hitEnemy = enemy;
                break;
            }
        }

        if (hitEnemy) {
            // Ram damage based on speed
            const ramDamage = Math.floor(60 + (shipSpeed / player.shipData.maxSpeed) * 40);
            damageEnemy(hitEnemy, ramDamage, 'ram');

            // Big impact effect
            createExplosion(hitEnemy.x, hitEnemy.y);
            shakeScreen(300, 0.01);
            showNotification(`RAM! ${ramDamage} damage!`, 'danger', 2000);

            // Push enemy back
            const pushRad = Phaser.Math.DegToRad(player.angle - 90);
            hitEnemy.setVelocity(
                Math.cos(pushRad) * 200,
                Math.sin(pushRad) * 200
            );

            // Player takes some recoil damage
            damagePlayer(10);
        } else {
            weapon.charges++; // Refund if no hit
            showNotification('Missed ram! No target in range.', 'warning', 1500);
        }

        ramCooldown = 3000; // 3 second cooldown
    }
}

// Activate defensive items
function activateDefensiveItem(itemType) {
    const item = defensiveItems[itemType];
    if (!item || item.charges <= 0 || item.active) return;

    item.charges--;
    item.active = true;

    if (itemType === 'tortoise_shield') {
        item.duration = 5000; // 5 seconds
        showNotification('Tortoise Shield active! -50% damage', 'success', 2000);

        // Visual effect - green aura
        const shield = scene.add.circle(player.x, player.y, 40, 0x44FF44, 0.3);
        shield.setDepth(100);
        const updateShield = () => {
            if (item.active && player) {
                shield.setPosition(player.x, player.y);
            } else {
                shield.destroy();
            }
        };
        scene.time.addEvent({ delay: 16, callback: updateShield, repeat: item.duration / 16 });

        scene.time.delayedCall(item.duration, () => {
            item.active = false;
            shield.destroy();
            showNotification('Tortoise Shield ended', 'warning', 1500);
        });
    } else if (itemType === 'energy_cloak') {
        item.duration = 3000; // 3 seconds of invulnerability
        player.shipData.invulnerable = true;
        player.shipData.invulnTimer = item.duration;
        showNotification('Energy Cloak active! Invulnerable!', 'gold', 2000);

        // Visual effect - golden glow
        player.setTint(0xFFD700);
        scene.time.delayedCall(item.duration, () => {
            item.active = false;
            player.shipData.invulnerable = false;
            player.clearTint();
            showNotification('Energy Cloak ended', 'warning', 1500);
        });
    }
}

function updateEnemies(delta) {
    const dt = delta / 1000;

    enemies.forEach(enemy => {
        if (!enemy.active) return;

        const data = enemy.enemyData;
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

        // Update state based on distance (uses per-enemy aggro ranges)
        const attackRange = data.attackRange || 300;
        const aggroRange = data.aggroRange || 500;

        // Morale system (iteration 79) - low HP enemies may flee
        const hpPercent = data.hp / data.maxHp;
        const moraleCheck = hpPercent < 0.3 && data.type !== 'ghost_ship'; // Ghosts don't flee
        if (moraleCheck && !data.fleeing) {
            // 40% chance to flee when critically damaged
            if (Math.random() < 0.4) {
                data.fleeing = true;
                showEnemyFlee(enemy);
            }
        }

        if (data.fleeing) {
            data.state = 'flee';
        } else if (distToPlayer < attackRange) {
            data.state = 'attack';
        } else if (distToPlayer < aggroRange) {
            data.state = data.type === 'merchant' ? 'flee' : 'chase';
        } else {
            data.state = 'patrol';
        }

        // AI behavior
        let targetX, targetY;
        switch (data.state) {
            case 'patrol':
                targetX = data.patrolTarget.x;
                targetY = data.patrolTarget.y;
                if (Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY) < 50) {
                    data.patrolTarget = {
                        x: enemy.x + Math.random() * 400 - 200,
                        y: enemy.y + Math.random() * 400 - 200
                    };
                }
                break;
            case 'chase':
                targetX = player.x;
                targetY = player.y;
                break;
            case 'attack':
                // Circle around player
                const orbitAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                targetX = player.x + Math.cos(orbitAngle + 0.5) * 200;
                targetY = player.y + Math.sin(orbitAngle + 0.5) * 200;
                break;
            case 'flee':
                const fleeAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                targetX = enemy.x + Math.cos(fleeAngle) * 300;
                targetY = enemy.y + Math.sin(fleeAngle) * 300;
                break;
        }

        // Turn toward target
        const targetAngle = Phaser.Math.RadToDeg(Math.atan2(targetY - enemy.y, targetX - enemy.x)) + 90;
        let angleDiff = Phaser.Math.Angle.Wrap(Phaser.Math.DegToRad(targetAngle - enemy.angle));
        enemy.angle += Phaser.Math.Clamp(Phaser.Math.RadToDeg(angleDiff), -60 * dt, 60 * dt);

        // Move (apply oil slick slow if in one)
        const baseSpeed = data.state === 'flee' ? data.speed * 1.2 : data.speed;
        const oilSlowFactor = getOilSlickSlowFactor(enemy.x, enemy.y);
        const speed = baseSpeed * oilSlowFactor;
        const moveRad = Phaser.Math.DegToRad(enemy.angle - 90);
        enemy.setVelocity(Math.cos(moveRad) * speed, Math.sin(moveRad) * speed);

        // Update health bar position and color
        enemy.hpBg.setPosition(enemy.x, enemy.y - 45);
        enemy.hpBar.setPosition(enemy.x, enemy.y - 45);

        // Update difficulty indicator position (iteration 94)
        if (enemy.difficultyText) {
            enemy.difficultyText.setPosition(enemy.x, enemy.y - 55);
        }

        // Color health bar based on HP percentage
        const hpPct = data.hp / data.maxHp;
        if (hpPct > 0.6) {
            enemy.hpBar.setFillStyle(0x44FF44); // Green - healthy
        } else if (hpPct > 0.3) {
            enemy.hpBar.setFillStyle(0xFFAA00); // Orange - damaged
        } else {
            enemy.hpBar.setFillStyle(0xFF4444); // Red - critical
        }

        // Fire at player if in attack state
        if (data.state === 'attack' && data.cannonCooldown <= 0 && distToPlayer < 250) {
            // Attack telegraph (iteration 91)
            if (!data.telegraphing) {
                data.telegraphing = true;
                showAttackTelegraph(enemy);
                scene.time.delayedCall(300, () => {
                    if (enemy.active) {
                        fireEnemyCannons(enemy);
                        data.telegraphing = false;
                    }
                });
            }
            data.cannonCooldown = 2500;
        }
        if (data.cannonCooldown > 0) {
            data.cannonCooldown -= delta;
        }
    });
}

function updateEnemyInfoPanel() {
    // Find closest enemy within range
    let closestEnemy = null;
    let closestDist = 150; // Info display range

    enemies.forEach(enemy => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);
        if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
        }
    });

    // Clear existing panel
    if (enemyInfoElements.length > 0) {
        enemyInfoElements.forEach(el => el.destroy());
        enemyInfoElements = [];
    }
    if (enemyInfoPanel) {
        enemyInfoPanel.destroy();
        enemyInfoPanel = null;
    }

    // Show panel if enemy nearby
    if (closestEnemy && closestEnemy.enemyData) {
        const data = closestEnemy.enemyData;
        const typeConfig = ENEMY_TYPES[data.type] || ENEMY_TYPES.pirate;
        const hpPercent = Math.round((data.hp / data.maxHp) * 100);

        // Panel background (screen-fixed position)
        const panelX = GAME_WIDTH - 170;
        const panelY = 240;

        enemyInfoPanel = scene.add.rectangle(panelX, panelY, 150, 100, 0x1a0a00, 0.9)
            .setDepth(200)
            .setScrollFactor(0)
            .setStrokeStyle(2, 0x8B4513);

        // Title
        const title = scene.add.text(panelX, panelY - 35, typeConfig.name || data.type.toUpperCase(), {
            fontSize: '14px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        enemyInfoElements.push(title);

        // HP bar background
        const hpBgWidth = 120;
        const hpBg = scene.add.rectangle(panelX, panelY - 10, hpBgWidth, 12, 0x3D1010)
            .setDepth(201).setScrollFactor(0);
        enemyInfoElements.push(hpBg);

        // HP bar fill
        const hpFillWidth = (hpPercent / 100) * hpBgWidth;
        const hpColor = hpPercent > 60 ? 0x22AA22 : hpPercent > 30 ? 0xAAAA22 : 0xAA2222;
        const hpFill = scene.add.rectangle(panelX - (hpBgWidth - hpFillWidth) / 2, panelY - 10, hpFillWidth, 10, hpColor)
            .setDepth(202).setScrollFactor(0);
        enemyInfoElements.push(hpFill);

        // HP text
        const hpText = scene.add.text(panelX, panelY - 10, `${Math.round(data.hp)}/${data.maxHp}`, {
            fontSize: '10px', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(203).setScrollFactor(0);
        enemyInfoElements.push(hpText);

        // State indicator
        const stateColors = {
            'patrol': '#88AAFF',
            'chase': '#FFAA44',
            'attack': '#FF4444',
            'flee': '#44FF44'
        };
        const stateText = scene.add.text(panelX, panelY + 15, `State: ${data.state.toUpperCase()}`, {
            fontSize: '11px',
            color: stateColors[data.state] || '#FFFFFF'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        enemyInfoElements.push(stateText);

        // Damage info
        const damageText = scene.add.text(panelX, panelY + 32, `Damage: ${data.damage}`, {
            fontSize: '10px', color: '#AAAAAA'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        enemyInfoElements.push(damageText);
    }
}

// Captain dialogue system
const CAPTAIN_DIALOGUES = {
    pirate_captain: [
        "Prepare to be boarded!",
        "Your gold is mine!",
        "Fire all cannons!",
        "Surrender or die!",
        "No quarter given!"
    ],
    navy_frigate: [
        "Halt in the name of the King!",
        "You're under arrest, pirate!",
        "Stand down immediately!",
        "All hands, battle stations!"
    ],
    ghost_ship: [
        "Join us... forever...",
        "Your soul belongs to the sea...",
        "No escape from the depths..."
    ]
};

function showCaptainDialogue(enemy) {
    const dialogues = CAPTAIN_DIALOGUES[enemy.enemyData.type];
    if (!dialogues || Math.random() > 0.3) return; // 30% chance

    // Don't show too frequently for same enemy
    if (enemy.lastDialogue && Date.now() - enemy.lastDialogue < 15000) return;
    enemy.lastDialogue = Date.now();

    const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
    const text = scene.add.text(enemy.x, enemy.y - 60, dialogue, {
        fontSize: '10px',
        color: '#FFFF00',
        backgroundColor: '#000000AA',
        padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(100);

    // Fade out
    scene.tweens.add({
        targets: text,
        alpha: 0,
        y: enemy.y - 80,
        duration: 2500,
        onComplete: () => text.destroy()
    });
}

function fireEnemyCannons(enemy) {
    const data = enemy.enemyData;
    const typeConfig = ENEMY_TYPES[data.type] || {};

    // Show captain dialogue for special enemies
    showCaptainDialogue(enemy);

    // Pirate Captain rapidfire: fires 3 volleys in quick succession
    if (typeConfig.special === 'rapidfire') {
        for (let volley = 0; volley < 3; volley++) {
            scene.time.delayedCall(volley * 200, () => {
                if (!enemy.active) return;
                fireCannonVolley(enemy, data);
            });
        }
    } else {
        fireCannonVolley(enemy, data);
    }
}

function fireCannonVolley(enemy, data) {
    // Fire toward player from both sides
    [-90, 90].forEach(side => {
        const angle = enemy.angle + side;
        const rad = Phaser.Math.DegToRad(angle - 90);

        const ball = scene.physics.add.sprite(
            enemy.x + Math.cos(Phaser.Math.DegToRad(enemy.angle + side - 90)) * 20,
            enemy.y + Math.sin(Phaser.Math.DegToRad(enemy.angle + side - 90)) * 20,
            'cannonball'
        );
        ball.setDepth(15);
        ball.setVelocity(Math.cos(rad) * CANNONBALL_SPEED * 0.8, Math.sin(rad) * CANNONBALL_SPEED * 0.8);
        ball.projectileData = {
            damage: data.damage,
            owner: 'enemy',
            type: 'cannon',
            range: CANNON_RANGE,
            traveled: 0
        };
        projectiles.push(ball);
    });
}

function updateProjectiles(delta) {
    const dt = delta / 1000;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        if (!proj.active) {
            projectiles.splice(i, 1);
            continue;
        }

        const data = proj.projectileData;
        data.traveled += Math.sqrt(proj.body.velocity.x ** 2 + proj.body.velocity.y ** 2) * dt;

        // Check range
        if (data.traveled > data.range) {
            createSplash(proj.x, proj.y);
            proj.destroy();
            projectiles.splice(i, 1);
            continue;
        }

        // Check collisions
        if (data.owner === 'player') {
            // Check against enemies
            let hitTarget = false;
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                const dist = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y);
                if (dist < 30) {
                    damageEnemy(enemy, data.damage, data.type);
                    proj.destroy();
                    projectiles.splice(i, 1);
                    hitTarget = true;
                    break;
                }
            }
            // Check against forts
            if (!hitTarget) {
                for (const fort of forts) {
                    if (fort.fortData.destroyed) continue;
                    const dist = Phaser.Math.Distance.Between(proj.x, proj.y, fort.x, fort.y);
                    if (dist < 45) {
                        damageFort(fort, data.damage);
                        proj.destroy();
                        projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        } else if (data.owner === 'enemy' || data.owner === 'fort') {
            // Check against player
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, player.x, player.y);
            if (dist < 25 && !player.shipData.invulnerable) {
                damagePlayer(data.damage);
                proj.destroy();
                projectiles.splice(i, 1);
            }
        }
    }
}

function damageEnemy(enemy, damage, type) {
    const data = enemy.enemyData;

    // Critical hit system (iteration 77) - 10% chance for 2x damage
    let isCritical = Math.random() < 0.10;
    let finalDamage = damage;
    if (isCritical) {
        finalDamage = damage * 2;
        showCriticalHit(enemy.x, enemy.y);
    }

    data.hp -= finalDamage;
    gameStats.damageDealt += finalDamage;

    // Update health bar with smooth animation
    const hpPercent = Math.max(0, data.hp / data.maxHp);
    scene.tweens.add({
        targets: enemy.hpBar,
        scaleX: hpPercent,
        duration: 200,
        ease: 'Power2'
    });

    // Flash effect - orange for fire, red for normal
    const flashColor = type === 'fireball' ? 0xFF6600 : 0xFF0000;
    enemy.setTint(flashColor);
    scene.time.delayedCall(100, () => {
        if (enemy.active) enemy.clearTint();
    });

    // Floating damage number (use finalDamage for crits)
    showDamageNumber(enemy.x, enemy.y - 30, finalDamage, isCritical ? 0xFFFF00 : null);

    // Apply burn DOT for fireballs (3 ticks of 8 damage over 3 seconds)
    if (type === 'fireball' && !data.burning) {
        data.burning = true;
        let burnTicks = 3;
        const burnDamage = 8;

        const burnInterval = scene.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!enemy.active || data.hp <= 0) {
                    burnInterval.remove();
                    return;
                }
                data.hp -= burnDamage;
                gameStats.damageDealt += burnDamage;
                showDamageNumber(enemy.x, enemy.y - 30, burnDamage, 0xFF6600);
                enemy.setTint(0xFF6600);
                scene.time.delayedCall(100, () => { if (enemy.active) enemy.clearTint(); });

                // Update HP bar
                const hp = Math.max(0, data.hp / data.maxHp);
                scene.tweens.add({ targets: enemy.hpBar, scaleX: hp, duration: 150 });

                if (data.hp <= 0) {
                    destroyEnemy(enemy);
                }

                burnTicks--;
                if (burnTicks <= 0) {
                    data.burning = false;
                }
            },
            repeat: 2
        });
    }

    // Check death
    if (data.hp <= 0) {
        destroyEnemy(enemy);
    }

    if (window.testHarness) {
        window.testHarness.logEvent('enemy_damaged', { enemyId: data.id, damage, remainingHp: data.hp });
    }
}

function destroyEnemy(enemy) {
    const data = enemy.enemyData;

    // Track by ship type
    if (data.type === 'merchant') gameStats.merchantsSunk++;
    else if (data.type === 'pirate' || data.type === 'pirate_captain') gameStats.piratesSunk++;
    else if (data.type.includes('navy')) gameStats.navySunk++;
    else if (data.type === 'ghost') gameStats.ghostsSunk++;

    // Update quest progress
    updateQuestProgress(data.type);

    // Check for Neptune's Eye piece drop (boss enemies only)
    if (data.type === 'pirate_captain' || data.type === 'navy_frigate' || data.type === 'ghost_ship') {
        checkNeptunesPieceDrop(data.type, enemy.x, enemy.y);
    }

    // Kill streak system (iteration 75)
    const now = Date.now();
    if (now - lastKillTime < STREAK_TIMEOUT) {
        killStreak++;
    } else {
        killStreak = 1;
    }
    lastKillTime = now;

    // Streak bonus multiplier
    let streakBonus = 1;
    let streakText = '';
    if (killStreak >= 5) {
        streakBonus = 2.0;
        streakText = 'RAMPAGE! x2 Gold!';
    } else if (killStreak >= 3) {
        streakBonus = 1.5;
        streakText = 'KILLING SPREE! +50% Gold!';
    } else if (killStreak >= 2) {
        streakBonus = 1.25;
        streakText = 'DOUBLE KILL! +25% Gold!';
    }

    if (streakText) {
        showNotification(streakText, 'gold', 2000);
    }

    // Explosion effect
    createExplosion(enemy.x, enemy.y);

    // Drop gold with day multiplier (10% bonus per day after day 1) and difficulty modifier
    const dayBonus = 1 + (currentDay - 1) * 0.1;
    const diffMod = DIFFICULTY_MODIFIERS[selectedDifficulty];
    const baseGold = Phaser.Math.Between(data.goldMin, data.goldMax);
    const goldAmount = Math.floor(baseGold * dayBonus * diffMod.goldMultiplier * streakBonus);
    spawnPickup(enemy.x, enemy.y, 'gold', goldAmount);

    // Drop cargo with weighted rarity (valuable items rarer)
    for (let i = 0; i < data.cargoCount; i++) {
        const cargoType = getWeightedCargo();
        spawnPickup(
            enemy.x + Math.random() * 60 - 30,
            enemy.y + Math.random() * 60 - 30,
            'cargo',
            cargoType
        );
    }

    // Rare treasure map drop (5% base, +2% for bosses, +1% per day)
    let mapChance = 0.05 + (currentDay - 1) * 0.01;
    if (data.type === 'pirate_captain' || data.type === 'navy_frigate') mapChance += 0.02;
    if (Math.random() < mapChance && treasureMaps.length < 5) {
        const mapX = Math.random() * WORLD_WIDTH;
        const mapY = Math.random() * WORLD_HEIGHT;
        treasureMaps.push({
            id: `map_${Date.now()}`,
            targetX: mapX,
            targetY: mapY,
            reward: Math.floor(200 + currentDay * 50 + Math.random() * 100),
            foundAt: null
        });
        spawnPickup(
            enemy.x + Math.random() * 40 - 20,
            enemy.y + Math.random() * 40 - 20,
            'map',
            treasureMaps.length - 1
        );
        showNotification('Treasure Map dropped!', 'gold', 3000);
    }

    // Ship sinking animation (iteration 80)
    enemy.hpBg.destroy();
    enemy.hpBar.destroy();
    if (enemy.difficultyText) enemy.difficultyText.destroy(); // iteration 94

    // Remove from active enemies immediately
    const idx = enemies.indexOf(enemy);
    if (idx > -1) enemies.splice(idx, 1);

    // Disable collision and play sinking animation
    enemy.body.enable = false;
    scene.tweens.add({
        targets: enemy,
        angle: enemy.angle + (Math.random() > 0.5 ? 45 : -45),
        alpha: 0.3,
        scaleX: enemy.scaleX * 0.7,
        scaleY: enemy.scaleY * 0.7,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => enemy.destroy()
    });

    // Create bubbles while sinking
    for (let i = 0; i < 6; i++) {
        scene.time.delayedCall(i * 200, () => {
            if (!scene) return;
            const bubble = scene.add.circle(
                enemy.x + Math.random() * 30 - 15,
                enemy.y + Math.random() * 30 - 15,
                3 + Math.random() * 4,
                0x88DDFF
            ).setAlpha(0.7).setDepth(10);
            scene.tweens.add({
                targets: bubble,
                y: bubble.y - 30,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => bubble.destroy()
            });
        });
    }

    shipsDestroyed++;

    // Show notification for ship destroyed
    const typeConfig = ENEMY_TYPES[data.type] || {};
    showNotification(`${typeConfig.name || 'Ship'} destroyed! +${goldAmount} gold`, 'success', 2000);

    if (window.testHarness) {
        window.testHarness.logEvent('enemy_killed', {
            enemyId: data.id,
            type: data.type,
            goldDropped: goldAmount
        });
    }

    // Respawn enemy after delay
    scene.time.delayedCall(10000, () => {
        if (enemies.length < 10) {
            const basicTypes = ['merchant', 'pirate', 'navy_sloop'];
            const advancedTypes = ['navy_frigate', 'ghost_ship'];

            let typeKey;
            if (currentDay >= 3 && Math.random() < 0.3) {
                typeKey = advancedTypes[Math.floor(Math.random() * advancedTypes.length)];
            } else {
                typeKey = basicTypes[Math.floor(Math.random() * basicTypes.length)];
            }

            const typeData = ENEMY_TYPES[typeKey];
            const x = Math.random() * WORLD_WIDTH;
            const y = Math.random() * WORLD_HEIGHT;
            spawnEnemy(scene, x, y, typeData);
        }
    });
}

function damagePlayer(damage) {
    if (player.shipData.invulnerable) return;

    // Apply tortoise shield damage reduction
    let finalDamage = damage;
    if (defensiveItems.tortoise_shield.active) {
        finalDamage = Math.floor(damage * defensiveItems.tortoise_shield.damageReduction);
    }

    playerStats.currentArmor -= finalDamage;
    gameStats.damageTaken += finalDamage;

    // Flash effect
    player.setTint(0xFF0000);
    scene.time.delayedCall(100, () => player.clearTint());

    // Screen shake on damage (stronger than cannon fire)
    shakeScreen(150, 0.005);

    // Brief invulnerability
    player.shipData.invulnerable = true;
    player.shipData.invulnTimer = 500;

    if (window.testHarness) {
        window.testHarness.logEvent('player_damaged', { damage, remainingArmor: playerStats.currentArmor });
    }

    // Low armor warning (iteration 74)
    const armorPercent = playerStats.currentArmor / playerStats.maxArmor;
    if (armorPercent <= 0.3 && armorPercent > 0) {
        // Flash screen red for critical warning
        if (!player.lowArmorWarningActive) {
            player.lowArmorWarningActive = true;
            showNotification('⚠ HULL CRITICAL! Return to port!', 'danger', 3000);
            createLowArmorFlash();
        }
    } else if (armorPercent > 0.3) {
        player.lowArmorWarningActive = false;
    }

    // Check death
    if (playerStats.currentArmor <= 0) {
        playerDied();
    }
}

function createLowArmorFlash() {
    if (!scene) return;
    const flash = scene.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0.3);
    flash.setScrollFactor(0);
    flash.setDepth(900);
    scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => flash.destroy()
    });
}

function playerDied() {
    gameStats.deathCount++;

    // Lose 25% of cargo
    const lossCount = Math.floor(cargo.length * 0.25);
    for (let i = 0; i < lossCount; i++) {
        if (cargo.length > 0) {
            cargo.splice(Math.floor(Math.random() * cargo.length), 1);
        }
    }

    // Show death notification
    showDeathNotification(lossCount);

    // Return to base after short delay
    scene.time.delayedCall(2500, () => {
        endDay();
    });

    if (window.testHarness) {
        window.testHarness.logEvent('player_died', { cargoLost: lossCount });
    }
}

// Death notification screen with comprehensive statistics
function showDeathNotification(cargoLost) {
    // Stop player
    gameState = 'death';
    player.setVelocity(0, 0);

    // Create explosion at player location
    createExplosion(player.x, player.y);

    // Dark overlay for readability
    const overlay = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
        .setScrollFactor(0).setDepth(599);

    // Show death message
    const deathText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'SHIP DESTROYED!', {
        fontSize: '36px',
        color: '#FF4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(600);

    // Comprehensive stats display
    const totalSunk = gameStats.merchantsSunk + gameStats.piratesSunk + gameStats.navySunk + gameStats.ghostsSunk;
    const statsContent = [
        `Day ${currentDay} - Death #${gameStats.deathCount}`,
        '',
        `Ships Destroyed: ${totalSunk}`,
        `  Pirates: ${gameStats.piratesSunk}  Navy: ${gameStats.navySunk}`,
        `  Merchants: ${gameStats.merchantsSunk}  Ghosts: ${gameStats.ghostsSunk}`,
        '',
        `Shots Fired: ${gameStats.shotsFired}`,
        `Damage Dealt: ${gameStats.damageDealt}`,
        `Damage Taken: ${gameStats.damageTaken}`,
        '',
        `Gold: ${gold}  |  Cargo Lost: ${cargoLost}`,
        '',
        'Returning to port...'
    ].join('\n');

    const statsText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, statsContent, {
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'center',
        lineSpacing: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(600);

    // Fade out after delay
    scene.time.delayedCall(3500, () => {
        scene.tweens.add({
            targets: [deathText, statsText, overlay],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                deathText.destroy();
                statsText.destroy();
                overlay.destroy();
            }
        });
    });
}

function spawnPickup(x, y, type, value) {
    let texture = 'loot_crate';
    if (type === 'gold') texture = 'gold_coin';
    else if (type === 'map') texture = 'loot_crate'; // Will tint gold

    const pickup = scene.physics.add.sprite(x, y, texture);
    pickup.setDepth(8);

    // Special appearance for treasure maps
    if (type === 'map') {
        pickup.setTint(0xFFD700);
        pickup.setScale(0.8);
    }

    pickup.pickupData = {
        type: type,
        value: value,
        id: `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lifetime: type === 'map' ? 30000 : 10000, // Maps last longer
        spawnTime: Date.now() * Math.random() // Random offset for varied animation
    };

    // Float animation for gold coins and maps
    if (type === 'gold' || type === 'map') {
        scene.tweens.add({
            targets: pickup,
            y: pickup.y - 5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    pickups.push(pickup);
}

function updatePickups(delta) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        if (!pickup.active) {
            pickups.splice(i, 1);
            continue;
        }

        const data = pickup.pickupData;
        data.lifetime -= delta;

        // Floating bob animation for cargo crates
        if (data.type === 'cargo') {
            if (!data.baseY) data.baseY = pickup.y;
            const bobOffset = Math.sin(Date.now() * 0.003 + data.spawnTime) * 3;
            pickup.y = data.baseY + bobOffset;
            // Gentle rotation
            pickup.angle = Math.sin(Date.now() * 0.002 + data.spawnTime) * 5;
        }

        // Fade out near end
        if (data.lifetime < 2000) {
            pickup.alpha = data.lifetime / 2000;
        }

        // Remove if expired
        if (data.lifetime <= 0) {
            pickup.destroy();
            pickups.splice(i, 1);
            continue;
        }

        // Check player collection
        const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, player.x, player.y);
        if (dist < 40) {
            collectPickup(pickup);
            pickups.splice(i, 1);
        }
    }
}

// Gold pickup combo system (iteration 89)
let goldPickupCombo = 0;
let lastGoldPickupTime = 0;
const GOLD_COMBO_TIMEOUT = 2000; // 2 seconds to maintain combo

function collectPickup(pickup) {
    const data = pickup.pickupData;

    if (data.type === 'gold') {
        // Check gold pickup combo (iteration 89)
        const now = Date.now();
        if (now - lastGoldPickupTime < GOLD_COMBO_TIMEOUT) {
            goldPickupCombo++;
        } else {
            goldPickupCombo = 1;
        }
        lastGoldPickupTime = now;

        // Apply combo bonus
        let comboBonus = 0;
        if (goldPickupCombo >= 5) {
            comboBonus = Math.floor(data.value * 0.5);
            if (goldPickupCombo === 5) showNotification('GOLD FRENZY! +50% bonus!', 'gold', 2000);
        } else if (goldPickupCombo >= 3) {
            comboBonus = Math.floor(data.value * 0.25);
            if (goldPickupCombo === 3) showNotification('Gold combo x3! +25%', 'gold', 1500);
        }

        const totalGold = data.value + comboBonus;
        gold += totalGold;
        totalGoldEarned += totalGold;

        // Gold collection sparkles
        createCollectParticles(pickup.x, pickup.y, 0xFFD700, '+$' + totalGold);

        if (window.testHarness) {
            window.testHarness.logEvent('gold_collected', { amount: data.value, total: gold });
        }
    } else if (data.type === 'cargo') {
        if (cargo.length < cargoCapacity) {
            cargo.push({ type: data.value, collected: Date.now() });
            gameStats.cargoCollected++;

            // Cargo collection effect
            createCollectParticles(pickup.x, pickup.y, 0x8B4513, '+' + data.value);

            if (window.testHarness) {
                window.testHarness.logEvent('cargo_collected', { cargoType: data.value, cargoCount: cargo.length });
            }
        } else if (lootBox.length < 20) {
            lootBox.push({ type: data.value, collected: Date.now() });
        }
    } else if (data.type === 'map') {
        // Treasure map collected - mark as picked up
        const mapIndex = data.value;
        if (treasureMaps[mapIndex] && !treasureMaps[mapIndex].collected) {
            treasureMaps[mapIndex].collected = true;
            createCollectParticles(pickup.x, pickup.y, 0xFFD700, 'MAP!');
            showNotification(`Treasure Map acquired! Sail to X:${Math.floor(treasureMaps[mapIndex].targetX)}, Y:${Math.floor(treasureMaps[mapIndex].targetY)}`, 'gold', 5000);
        }
    }

    pickup.destroy();
}

// Check if player found treasure at map location
function checkTreasureLocations() {
    if (!player) return;

    for (const map of treasureMaps) {
        if (!map.collected || map.foundAt) continue;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, map.targetX, map.targetY);
        if (dist < 60) {
            // Found the treasure!
            map.foundAt = Date.now();
            gold += map.reward;
            totalGoldEarned += map.reward;

            // Enhanced treasure discovery effect (iteration 95)
            createTreasureDiscoveryEffect(player.x, player.y, map.reward);
            showNotification(`TREASURE FOUND! +${map.reward} gold!`, 'gold', 4000);

            // Give random defensive item charges
            const itemType = Math.random() < 0.5 ? 'tortoise_shield' : 'energy_cloak';
            defensiveItems[itemType].charges += 2;
            showNotification(`Bonus: +2 ${itemType.replace('_', ' ')}!`, 'success', 3000);

            // Also give random weapon charges
            const weapons_list = ['fireballs', 'megashot', 'oilslick'];
            const weaponType = weapons_list[Math.floor(Math.random() * weapons_list.length)];
            weapons[weaponType].equipped = true;
            weapons[weaponType].charges += 3;
            showNotification(`Bonus: +3 ${weaponType}!`, 'success', 3000);
        }
    }
}

// Update oil slicks - check lifetime and slow enemies
function updateOilSlicks(delta) {
    const now = Date.now();
    for (let i = oilSlicks.length - 1; i >= 0; i--) {
        const slick = oilSlicks[i];
        if (!slick.slickData) continue;

        const elapsed = now - slick.slickData.spawnTime;
        if (elapsed > slick.slickData.lifetime) {
            // Fade out and remove
            scene.tweens.add({
                targets: slick,
                alpha: 0,
                duration: 300,
                onComplete: () => slick.destroy()
            });
            oilSlicks.splice(i, 1);
        }
    }
}

// Check if enemy is in oil slick
function getOilSlickSlowFactor(x, y) {
    for (const slick of oilSlicks) {
        if (!slick.slickData) continue;
        const dist = Phaser.Math.Distance.Between(x, y, slick.x, slick.y);
        if (dist < 50) {
            return slick.slickData.slowFactor;
        }
    }
    return 1.0; // No slow
}

// Pickup collection particles
function createCollectParticles(x, y, color, text) {
    if (!scene) return;

    // Sparkle particles
    for (let i = 0; i < 8; i++) {
        const particle = scene.add.circle(x, y, 4, color).setDepth(47);
        const angle = (i / 8) * Math.PI * 2;
        const dist = 20 + Math.random() * 15;

        scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            alpha: 0,
            scale: 0.2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => particle.destroy()
        });
    }

    // Floating text (e.g., "+50" for gold)
    if (text) {
        const label = scene.add.text(x, y, text, {
            fontSize: '14px',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(48);

        scene.tweens.add({
            targets: label,
            y: y - 30,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => label.destroy()
        });
    }
}

function checkPortProximity() {
    let nearPort = null;

    ports.forEach(port => {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, port.x, port.y);
        const wasNear = port.nearPlayer;
        port.nearPlayer = dist < 100;

        if (port.nearPlayer) {
            nearPort = port;
        }

        // Add/remove port glow indicator
        if (port.nearPlayer && !wasNear) {
            // Create glow ring
            if (!port.glowRing) {
                port.glowRing = scene.add.circle(port.x, port.y, 50, 0xFFD700, 0).setDepth(1);
                port.glowRing.setStrokeStyle(3, 0xFFD700, 0.8);

                // Pulse animation
                scene.tweens.add({
                    targets: port.glowRing,
                    scale: 1.2,
                    alpha: 0.5,
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        } else if (!port.nearPlayer && wasNear && port.glowRing) {
            port.glowRing.destroy();
            port.glowRing = null;
        }
    });

    // Show/hide dock prompt
    if (nearPort) {
        scene.portPrompt.setVisible(true);
        scene.portPrompt.setText(`Press E to dock at ${nearPort.name}`);
    } else {
        scene.portPrompt.setVisible(false);
    }

    // Update nearest port distance indicator (iteration 85)
    if (scene.nearestPortText) {
        let minDist = Infinity;
        let closestPort = null;
        ports.forEach(port => {
            const dist = Phaser.Math.Distance.Between(player.x, player.y, port.x, port.y);
            if (dist < minDist) {
                minDist = dist;
                closestPort = port;
            }
        });

        if (closestPort && minDist > 100) {
            const distUnits = Math.floor(minDist / 50); // Convert to game units
            scene.nearestPortText.setText(`${closestPort.name}: ${distUnits}m`);
            scene.nearestPortText.setVisible(true);
        } else if (closestPort) {
            scene.nearestPortText.setText(`${closestPort.name}: NEARBY`);
            scene.nearestPortText.setVisible(true);
        }
    }
}

function tryDockAtPort() {
    const nearPort = ports.find(p => p.nearPlayer);
    if (nearPort) {
        openPortMenu(nearPort);
    }
}

function openPortMenu(port) {
    // Simple port menu overlay
    gameState = 'port';
    player.setVelocity(0, 0);
    player.shipData.speed = 0;
    player.shipData.targetSpeed = 0;

    // Create menu overlay
    const overlay = scene.add.rectangle(
        scene.cameras.main.scrollX + GAME_WIDTH / 2,
        scene.cameras.main.scrollY + GAME_HEIGHT / 2,
        400, 300, 0x000000, 0.9
    ).setDepth(200);

    const title = scene.add.text(
        scene.cameras.main.scrollX + GAME_WIDTH / 2,
        scene.cameras.main.scrollY + GAME_HEIGHT / 2 - 120,
        port.name,
        { fontSize: '24px', color: '#FFD700', fontStyle: 'bold' }
    ).setOrigin(0.5).setDepth(201);

    // Base options
    let options = [
        { text: 'Trade Goods', action: 'trade' },
        { text: 'View Quests', action: 'quests' },
        { text: 'Repair Ship (100g)', action: 'repair' },
        { text: 'Upgrade Ship', action: 'upgrade' }
    ];

    // Add weapon shop for pirate ports
    if (port.type === 'pirate') {
        options.splice(2, 0, { text: 'Buy Weapons', action: 'weapons' });
    }

    options.push({ text: 'Leave Port', action: 'leave' });

    const buttons = options.map((opt, i) => {
        const btn = scene.add.text(
            scene.cameras.main.scrollX + GAME_WIDTH / 2,
            scene.cameras.main.scrollY + GAME_HEIGHT / 2 - 50 + i * 40,
            opt.text,
            { fontSize: '18px', color: '#FFFFFF' }
        ).setOrigin(0.5).setDepth(201).setInteractive();

        btn.on('pointerover', () => btn.setColor('#FFD700'));
        btn.on('pointerout', () => btn.setColor('#FFFFFF'));
        btn.on('pointerdown', () => handlePortAction(opt.action, port, overlay, title, buttons));

        return btn;
    });

    scene.portMenu = { overlay, title, buttons };
}

function handlePortAction(action, port, overlay, title, buttons) {
    switch (action) {
        case 'repair':
            if (gold >= 100 && playerStats.currentArmor < playerStats.maxArmor) {
                gold -= 100;
                const healAmount = playerStats.maxArmor - playerStats.currentArmor;
                playerStats.currentArmor = playerStats.maxArmor;
                showRepairAnimation(healAmount);
            }
            break;
        case 'trade':
            if (cargo.length === 0) {
                showNotification('No cargo to sell!', 'warning');
                break;
            }
            // Calculate total value and show preview
            let totalValue = 0;
            const cargoSummary = {};
            cargo.forEach(item => {
                const cargoInfo = CARGO_TYPES[item.type];
                const value = cargoInfo ? cargoInfo.value : 20;
                const sellValue = Math.floor(value * (port.prices?.sellMult || 1));
                totalValue += sellValue;
                cargoSummary[item.type] = (cargoSummary[item.type] || 0) + 1;
            });
            // Show what was sold
            const summaryParts = Object.entries(cargoSummary)
                .map(([type, count]) => `${count}x ${CARGO_TYPES[type]?.name || type}`)
                .slice(0, 3);
            showNotification(`Sold ${summaryParts.join(', ')} for ${totalValue}g!`, 'gold', 3000);
            gold += totalValue;
            totalGoldEarned += totalValue;
            cargo = [];
            break;
        case 'quests':
            showQuestMenu(overlay, title, buttons);
            break;
        case 'weapons':
            showWeaponShop(overlay, title, buttons);
            break;
        case 'upgrade':
            // Show upgrade options with scaled costs
            const stats = ['firepower', 'reload', 'speed', 'armor', 'cargo'];
            const statLabels = { firepower: 'Firepower', reload: 'Reload Speed', speed: 'Ship Speed', armor: 'Hull Armor', cargo: 'Cargo Hold' };
            let upgraded = false;
            // Find cheapest affordable upgrade
            for (const stat of stats) {
                const cost = getUpgradeCost(stat);
                if (gold >= cost && playerStats[stat] < 5) { // Max level 5
                    gold -= cost;
                    playerStats[stat]++;
                    showNotification(`${statLabels[stat]} upgraded to level ${playerStats[stat]}! (-${cost}g)`, 'success');
                    createUpgradeEffect(); // iteration 97
                    // Update ship properties based on upgraded stat
                    if (stat === 'speed' && player.shipData) {
                        player.shipData.maxSpeed = getMaxSpeed();
                        player.shipData.turnRate = getTurnRate();
                    }
                    if (stat === 'armor') {
                        const newMax = 100 + (playerStats.armor - 1) * 25;
                        playerStats.maxArmor = newMax;
                        playerStats.currentArmor = newMax; // Full heal on upgrade
                    }
                    upgraded = true;
                    break;
                }
            }
            if (!upgraded) {
                showNotification('Not enough gold or all stats maxed!', 'warning');
            }
            break;
        case 'leave':
            // Close menu
            overlay.destroy();
            title.destroy();
            buttons.forEach(b => b.destroy());
            gameState = 'sailing';
            break;
    }
}

// Quest menu sub-screen
function showQuestMenu(overlay, title, buttons) {
    // Clear port menu elements
    buttons.forEach(b => b.destroy());
    title.setText('QUESTS');

    const camX = scene.cameras.main.scrollX;
    const camY = scene.cameras.main.scrollY;
    const centerX = camX + GAME_WIDTH / 2;
    const centerY = camY + GAME_HEIGHT / 2;

    const questElements = [];

    // Show active quests
    const activeHeader = scene.add.text(centerX, centerY - 100, 'Active Quests', {
        fontSize: '16px', color: '#FFD700'
    }).setOrigin(0.5).setDepth(201);
    questElements.push(activeHeader);

    if (activeQuests.length === 0) {
        const noActive = scene.add.text(centerX, centerY - 70, 'None', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setDepth(201);
        questElements.push(noActive);
    } else {
        activeQuests.forEach((q, i) => {
            const qText = scene.add.text(centerX, centerY - 70 + i * 25,
                `${q.shortName}: ${q.progress}/${q.count} (${q.reward}g)`, {
                fontSize: '14px', color: '#44FF44'
            }).setOrigin(0.5).setDepth(201);
            questElements.push(qText);
        });
    }

    // Show available quests from quest board
    const availHeader = scene.add.text(centerX, centerY + 10, 'Available Quests (click to accept)', {
        fontSize: '16px', color: '#FFD700'
    }).setOrigin(0.5).setDepth(201);
    questElements.push(availHeader);

    if (questBoard.length === 0) {
        const noAvail = scene.add.text(centerX, centerY + 40, 'No quests available', {
            fontSize: '14px', color: '#888888'
        }).setOrigin(0.5).setDepth(201);
        questElements.push(noAvail);
    } else {
        questBoard.forEach((q, i) => {
            const qBtn = scene.add.text(centerX, centerY + 40 + i * 25,
                `${q.name}: ${q.description} (+${q.reward}g)`, {
                fontSize: '12px', color: '#FFFFFF'
            }).setOrigin(0.5).setDepth(201).setInteractive();

            qBtn.on('pointerover', () => qBtn.setColor('#FFD700'));
            qBtn.on('pointerout', () => qBtn.setColor('#FFFFFF'));
            qBtn.on('pointerdown', () => {
                if (acceptQuest(i)) {
                    // Refresh quest menu
                    questElements.forEach(el => el.destroy());
                    backBtn.destroy();
                    showQuestMenu(overlay, title, []);
                }
            });
            questElements.push(qBtn);
        });
    }

    // Back button
    const backBtn = scene.add.text(centerX, centerY + 120, '← Back to Port', {
        fontSize: '16px', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(201).setInteractive();

    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'));
    backBtn.on('pointerout', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerdown', () => {
        questElements.forEach(el => el.destroy());
        backBtn.destroy();
        overlay.destroy();
        title.destroy();
        gameState = 'sailing';
    });
}

// Weapon shop sub-screen
function showWeaponShop(overlay, title, buttons) {
    buttons.forEach(b => b.destroy());
    title.setText('WEAPON SHOP');

    const camX = scene.cameras.main.scrollX;
    const camY = scene.cameras.main.scrollY;
    const centerX = camX + GAME_WIDTH / 2;
    const centerY = camY + GAME_HEIGHT / 2;

    const shopElements = [];

    // Weapon prices
    const weaponStock = [
        { id: 'fireballs', name: 'Fireballs (5x)', price: 80, charges: 5, desc: 'Fire DOT damage' },
        { id: 'megashot', name: 'Mega Shot (3x)', price: 100, charges: 3, desc: 'Huge single blast' },
        { id: 'oilslick', name: 'Oil Slick (3x)', price: 60, charges: 3, desc: 'Slows enemies' },
        { id: 'ram', name: 'Battering Ram (5x)', price: 50, charges: 5, desc: 'High-speed ramming' }
    ];

    // Defensive items
    const defenseStock = [
        { id: 'tortoise_shield', name: 'Tortoise Shield (2x)', price: 120, charges: 2, desc: '50% damage reduction' },
        { id: 'energy_cloak', name: 'Energy Cloak (2x)', price: 150, charges: 2, desc: '3s invulnerability' }
    ];

    const goldText = scene.add.text(centerX, centerY - 110, `Gold: ${gold}`, {
        fontSize: '16px', color: '#FFD700'
    }).setOrigin(0.5).setDepth(201);
    shopElements.push(goldText);

    const weaponHeader = scene.add.text(centerX, centerY - 80, 'Weapons', {
        fontSize: '14px', color: '#FFAA00'
    }).setOrigin(0.5).setDepth(201);
    shopElements.push(weaponHeader);

    weaponStock.forEach((item, i) => {
        const currentCharges = weapons[item.id]?.charges || 0;
        const itemBtn = scene.add.text(centerX, centerY - 55 + i * 22,
            `${item.name} - ${item.price}g [${currentCharges}]`, {
            fontSize: '12px', color: gold >= item.price ? '#FFFFFF' : '#666666'
        }).setOrigin(0.5).setDepth(201).setInteractive();

        itemBtn.on('pointerover', () => itemBtn.setColor('#FFD700'));
        itemBtn.on('pointerout', () => itemBtn.setColor(gold >= item.price ? '#FFFFFF' : '#666666'));
        itemBtn.on('pointerdown', () => {
            if (gold >= item.price) {
                gold -= item.price;
                weapons[item.id] = weapons[item.id] || { equipped: false, charges: 0 };
                weapons[item.id].equipped = true;
                weapons[item.id].charges += item.charges;
                showNotification(`Bought ${item.name}!`, 'success');
                goldText.setText(`Gold: ${gold}`);
                itemBtn.setText(`${item.name} - ${item.price}g [${weapons[item.id].charges}]`);
            }
        });
        shopElements.push(itemBtn);
    });

    const defenseHeader = scene.add.text(centerX, centerY + 40, 'Defensive', {
        fontSize: '14px', color: '#00AAFF'
    }).setOrigin(0.5).setDepth(201);
    shopElements.push(defenseHeader);

    defenseStock.forEach((item, i) => {
        const currentCharges = defensiveItems[item.id]?.charges || 0;
        const itemBtn = scene.add.text(centerX, centerY + 65 + i * 22,
            `${item.name} - ${item.price}g [${currentCharges}]`, {
            fontSize: '12px', color: gold >= item.price ? '#FFFFFF' : '#666666'
        }).setOrigin(0.5).setDepth(201).setInteractive();

        itemBtn.on('pointerover', () => itemBtn.setColor('#FFD700'));
        itemBtn.on('pointerout', () => itemBtn.setColor(gold >= item.price ? '#FFFFFF' : '#666666'));
        itemBtn.on('pointerdown', () => {
            if (gold >= item.price) {
                gold -= item.price;
                defensiveItems[item.id].charges += item.charges;
                showNotification(`Bought ${item.name}!`, 'success');
                goldText.setText(`Gold: ${gold}`);
                itemBtn.setText(`${item.name} - ${item.price}g [${defensiveItems[item.id].charges}]`);
            }
        });
        shopElements.push(itemBtn);
    });

    // Back button
    const backBtn = scene.add.text(centerX, centerY + 120, '← Back to Port', {
        fontSize: '16px', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(201).setInteractive();

    backBtn.on('pointerover', () => backBtn.setColor('#FFD700'));
    backBtn.on('pointerout', () => backBtn.setColor('#FFFFFF'));
    backBtn.on('pointerdown', () => {
        shopElements.forEach(el => el.destroy());
        backBtn.destroy();
        overlay.destroy();
        title.destroy();
        gameState = 'sailing';
    });
}

// Contextual tips system
function showContextualTip(tipId, message) {
    if (!scene || !scene.shownTips) return;
    if (scene.shownTips.has(tipId)) return;
    scene.shownTips.add(tipId);
    showNotification(message, 'info', 5000);
}

// Notification system
function showNotification(message, type = 'info', duration = 3000) {
    if (!scene) return;

    const colors = {
        info: '#FFFFFF',
        success: '#44FF44',
        warning: '#FFAA44',
        danger: '#FF4444',
        gold: '#FFD700'
    };

    const yOffset = 100 + notifications.length * 35;

    const notif = scene.add.text(GAME_WIDTH / 2, yOffset, message, {
        fontSize: '16px',
        color: colors[type] || colors.info,
        backgroundColor: '#000000AA',
        padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(400).setAlpha(0);

    notifications.push(notif);

    // Fade in
    scene.tweens.add({
        targets: notif,
        alpha: 1,
        duration: 200
    });

    // Fade out and remove
    scene.time.delayedCall(duration, () => {
        scene.tweens.add({
            targets: notif,
            alpha: 0,
            y: yOffset - 20,
            duration: 300,
            onComplete: () => {
                const idx = notifications.indexOf(notif);
                if (idx > -1) notifications.splice(idx, 1);
                notif.destroy();
            }
        });
    });
}

function updateMinimap() {
    // Update player position on minimap
    scene.minimapPlayer.setPosition(
        scene.minimap.x + player.x * scene.minimap.scale,
        scene.minimap.y + player.y * scene.minimap.scale
    );

    // Update enemy dots on minimap
    // Clear old enemy dots
    if (scene.minimapEnemies) {
        scene.minimapEnemies.forEach(dot => dot.destroy());
    }
    scene.minimapEnemies = [];

    // Create new enemy dots
    enemies.forEach(enemy => {
        if (!enemy.active) return;
        const color = enemy.enemyData.type === 'merchant' ? 0xFFFFFF :
                      enemy.enemyData.type === 'navy_sloop' ? 0x4488FF : 0xFF4444;
        const dot = scene.add.circle(
            scene.minimap.x + enemy.x * scene.minimap.scale,
            scene.minimap.y + enemy.y * scene.minimap.scale,
            2, color
        ).setScrollFactor(0).setDepth(101);
        scene.minimapEnemies.push(dot);
    });

    // Add fort markers to minimap
    if (scene.minimapForts) {
        scene.minimapForts.forEach(f => f.destroy());
    }
    scene.minimapForts = [];
    forts.forEach(fort => {
        if (fort.fortData.destroyed) return;
        const fortColors = { naval: 0x4444AA, pirate: 0x664422, merchant: 0x228844 };
        const marker = scene.add.rectangle(
            scene.minimap.x + fort.x * scene.minimap.scale,
            scene.minimap.y + fort.y * scene.minimap.scale,
            4, 4, fortColors[fort.type] || 0x888888
        ).setScrollFactor(0).setDepth(101);
        scene.minimapForts.push(marker);
    });

    // Show treasure markers for collected maps
    if (scene.minimapTreasures) {
        scene.minimapTreasures.forEach(t => t.destroy());
    }
    scene.minimapTreasures = [];
    treasureMaps.forEach(map => {
        if (map.collected && !map.foundAt) {
            // Pulsing gold X marker for active treasure locations
            const x = scene.minimap.x + map.targetX * scene.minimap.scale;
            const y = scene.minimap.y + map.targetY * scene.minimap.scale;
            const marker = scene.add.text(x, y, 'X', {
                fontSize: '10px',
                color: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
            marker.setAlpha(0.5 + Math.sin(Date.now() * 0.005) * 0.5);
            scene.minimapTreasures.push(marker);
        }
    });

    // Show Kraken lair marker when Neptune's Eye is complete
    if (scene.minimapKraken) {
        scene.minimapKraken.destroy();
        scene.minimapKraken = null;
    }
    if (neptunesPieces.length >= 5) {
        const x = scene.minimap.x + KRAKEN_LAIR.x * scene.minimap.scale;
        const y = scene.minimap.y + KRAKEN_LAIR.y * scene.minimap.scale;
        scene.minimapKraken = scene.add.text(x, y, '?', {
            fontSize: '12px',
            color: '#FF0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(103);
        scene.minimapKraken.setAlpha(0.6 + Math.sin(Date.now() * 0.008) * 0.4);
    }
}

function updateUI() {
    // Update gold
    scene.goldText.setText(gold.toString());

    // Update armor bar
    const armorPercent = playerStats.currentArmor / playerStats.maxArmor;
    scene.armorBar.setScale(armorPercent, 1);

    // Update speed bar and level text
    const speedPercent = player.shipData.speed / player.shipData.maxSpeed;
    scene.speedBar.setScale(speedPercent, 1);

    // Update speed level indicator (STOP/SLOW/HALF/FULL)
    if (scene.speedLevel) {
        let levelText, levelColor;
        if (speedPercent < 0.05) {
            levelText = 'STOP';
            levelColor = '#FF4444';
        } else if (speedPercent < 0.35) {
            levelText = 'SLOW';
            levelColor = '#FFAA44';
        } else if (speedPercent < 0.65) {
            levelText = 'HALF';
            levelColor = '#FFFF44';
        } else {
            levelText = 'FULL';
            levelColor = '#44FF44';
        }
        scene.speedLevel.setText(levelText);
        scene.speedLevel.setColor(levelColor);
    }

    // Update cargo count
    scene.cargoCount.setText(`${cargo.length}/${cargoCapacity}`);

    // Update cargo value (iteration 86)
    if (scene.cargoValue) {
        let totalValue = 0;
        cargo.forEach(item => {
            const cargoInfo = CARGO_TYPES[item.type];
            totalValue += cargoInfo ? cargoInfo.value : 20;
        });
        scene.cargoValue.setText(`($${totalValue})`);
    }

    // Update heading indicator (iteration 87)
    if (scene.headingText && player) {
        const heading = ((player.angle - 90 + 360) % 360);
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const dirIndex = Math.round(heading / 45) % 8;
        scene.headingText.setText(`${dirs[dirIndex]} ${Math.round(heading)}\u00B0`);
    }

    // Update combat status indicator (iteration 88)
    if (scene.combatStatus && player) {
        const nearbyEnemies = enemies.filter(e => {
            if (!e.active) return false;
            const dist = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
            return dist < 300 && e.enemyData.state === 'attack';
        });
        if (nearbyEnemies.length > 0) {
            scene.combatStatus.setText('IN COMBAT');
            scene.combatStatus.setVisible(true);
        } else {
            scene.combatStatus.setVisible(false);
        }
    }

    // Update weapon charges display
    const weaponKeys = ['cannons', 'fireballs', 'megashot', 'oilslick'];
    weaponKeys.forEach((key, i) => {
        if (scene.weaponCharges && scene.weaponCharges[i]) {
            const weapon = weapons[key];
            if (i === 0) {
                scene.weaponCharges[i].setText('∞');
            } else if (!weapon.equipped) {
                scene.weaponCharges[i].setText('-');
                scene.weaponCharges[i].setColor('#666666');
            } else {
                scene.weaponCharges[i].setText(weapon.charges.toString());
                scene.weaponCharges[i].setColor(weapon.charges > 0 ? '#44FF44' : '#FF4444');
            }
        }
    });

    // Update cargo display
    scene.cargoDisplay.forEach((slot, i) => {
        if (cargo[i]) {
            slot.setFillStyle(COLORS.gold, 0.8);
        } else {
            slot.setFillStyle(0x4A4A4A, 0.5);
        }
    });

    // Update day text
    scene.dayText.setText(`Day ${currentDay}`);

    // Day/night cycle lighting
    updateDayNightCycle();

    // Update cannon cooldown indicator
    if (scene.cooldownBar && player.shipData) {
        const cooldownReduction = playerStats.reload * 0.15;
        const maxCooldown = CANNON_COOLDOWN * (1 - cooldownReduction);
        const cooldownPercent = 1 - Math.max(0, player.shipData.cannonCooldown / maxCooldown);
        scene.cooldownBar.setScale(cooldownPercent, 1);

        // Change color based on ready state
        if (cooldownPercent >= 1) {
            scene.cooldownBar.setFillStyle(0x44FF44); // Green when ready
        } else {
            scene.cooldownBar.setFillStyle(0xFFAA00); // Orange when cooling
        }
    }

    // Update quest tracker
    updateQuestUI();
}

function updateQuestUI() {
    if (!scene.questText) return;

    if (activeQuests.length === 0) {
        scene.questText.setText('No active quests\nVisit a port!');
        return;
    }

    let questLines = [];
    activeQuests.slice(0, 3).forEach(quest => {
        const progress = `${quest.progress || 0}/${quest.count}`;
        const status = (quest.progress >= quest.count) ? '✓' : progress;
        questLines.push(`${quest.shortName}: ${status}`);
    });

    if (activeQuests.length > 3) {
        questLines.push(`+${activeQuests.length - 3} more...`);
    }

    scene.questText.setText(questLines.join('\n'));
}

function checkCollisions() {
    // Check player collision with islands
    islands.forEach(island => {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, island.x, island.y);
        if (dist < island.radius) {
            // Push player away
            const angle = Math.atan2(player.y - island.y, player.x - island.x);
            player.x = island.x + Math.cos(angle) * (island.radius + 10);
            player.y = island.y + Math.sin(angle) * (island.radius + 10);
            player.setVelocity(0, 0);
            player.shipData.speed = 0;
            player.shipData.targetSpeed = 0;
        }
    });
}

// Day/night cycle visual effect
// Wind update function (iteration 76)
function updateWind(delta) {
    windChangeTimer += delta;
    if (windChangeTimer >= WIND_CHANGE_INTERVAL) {
        windChangeTimer = 0;
        // Gradually shift wind direction
        const shift = Phaser.Math.Between(-90, 90);
        windDirection = (windDirection + shift + 360) % 360;
        windSpeed = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        showNotification(`Wind shifting ${getWindDirectionName()}`, 'info', 2000);
    }

    // Update wind arrow rotation
    if (scene && scene.windArrow) {
        scene.windArrow.setAngle(windDirection);
    }
}

function getWindDirectionName() {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(windDirection / 45) % 8;
    return dirs[index];
}

function updateWeather() {
    if (!scene || !scene.fogOverlay) return;

    const weather = scene.weatherState;

    // Initialize rain state if needed
    if (weather.rainActive === undefined) {
        weather.rainActive = false;
        weather.rainDrops = [];
    }

    // Random fog events (5% chance per frame when not foggy, lasts ~30 seconds)
    if (!weather.fogActive && !weather.rainActive && Math.random() < 0.0001) {
        weather.fogActive = true;
        weather.fogIntensity = 0;
        showNotification('Fog rolling in...', 'warning', 2500);
    }

    // Random rain events
    if (!weather.rainActive && !weather.fogActive && Math.random() < 0.00008) {
        weather.rainActive = true;
        showNotification('Storm approaching...', 'warning', 2500);
    }

    // Update fog intensity
    if (weather.fogActive) {
        if (weather.fogIntensity < 0.25) {
            weather.fogIntensity += 0.001;
        } else if (Math.random() < 0.0003) {
            // Random chance to clear fog
            weather.fogActive = false;
            showNotification('Fog clearing', 'info', 2000);
        }
    } else if (weather.fogIntensity > 0) {
        weather.fogIntensity -= 0.002;
    }

    // Update rain
    if (weather.rainActive) {
        // Spawn rain drops
        if (weather.rainDrops.length < 50 && Math.random() < 0.3) {
            const drop = scene.add.rectangle(
                scene.cameras.main.scrollX + Math.random() * GAME_WIDTH,
                scene.cameras.main.scrollY - 10,
                2, 10, 0x8899AA, 0.6
            ).setDepth(150);
            weather.rainDrops.push(drop);
        }

        // Move and cleanup rain drops
        for (let i = weather.rainDrops.length - 1; i >= 0; i--) {
            const drop = weather.rainDrops[i];
            drop.y += 8;
            drop.x -= 2; // Diagonal rain

            if (drop.y > scene.cameras.main.scrollY + GAME_HEIGHT + 20) {
                drop.destroy();
                weather.rainDrops.splice(i, 1);
            }
        }

        // Random chance to clear rain
        if (Math.random() < 0.0002) {
            weather.rainActive = false;
            showNotification('Storm passing', 'info', 2000);
            // Clean up remaining drops
            weather.rainDrops.forEach(d => d.destroy());
            weather.rainDrops = [];
        }
    }

    scene.fogOverlay.setAlpha(Math.max(0, weather.fogIntensity));
}

function updateDayNightCycle() {
    if (!scene || !scene.nightOverlay) return;

    // Update weather effects
    updateWeather();
    updateWind(16.67); // ~60fps delta

    // Calculate time of day (0 = start of day, 1 = end of day)
    const timeProgress = 1 - (dayTimeRemaining / DAY_DURATION);

    // Create a smooth day-night-day cycle
    // 0-0.25: dawn (getting brighter)
    // 0.25-0.5: day (bright)
    // 0.5-0.75: dusk (getting darker)
    // 0.75-1.0: night (dark)

    let darkness = 0;
    if (timeProgress < 0.25) {
        // Dawn - fading from night
        darkness = 0.3 * (1 - timeProgress / 0.25);
    } else if (timeProgress < 0.5) {
        // Day - bright
        darkness = 0;
    } else if (timeProgress < 0.75) {
        // Dusk - getting darker
        darkness = 0.3 * ((timeProgress - 0.5) / 0.25);
    } else {
        // Night - dark
        darkness = 0.3 + 0.2 * ((timeProgress - 0.75) / 0.25);
    }

    scene.nightOverlay.setAlpha(darkness);

    // Tint the overlay based on time
    if (timeProgress < 0.25) {
        scene.nightOverlay.setFillStyle(0xFF8800, darkness); // Orange dawn
    } else if (timeProgress > 0.75) {
        scene.nightOverlay.setFillStyle(0x0000AA, darkness); // Blue night
    } else if (timeProgress > 0.5) {
        scene.nightOverlay.setFillStyle(0xFF4400, darkness); // Red-orange dusk
    } else {
        scene.nightOverlay.setFillStyle(0x000000, darkness);
    }
}

function endDay() {
    // Sell cargo automatically using CARGO_TYPES values
    let cargoGold = 0;
    cargo.forEach(item => {
        const cargoInfo = CARGO_TYPES[item.type];
        const value = cargoInfo ? cargoInfo.value : 20;
        cargoGold += value;
        gold += value;
    });
    cargo = [];

    // Day survival bonus (iteration 84)
    const survivalBonus = 25 * currentDay;
    gold += survivalBonus;
    totalGoldEarned += survivalBonus;

    // Day milestone rewards (iteration 93)
    const milestones = { 3: 100, 5: 200, 7: 300, 10: 500 };
    if (milestones[currentDay]) {
        const bonus = milestones[currentDay];
        gold += bonus;
        totalGoldEarned += bonus;
        showNotification(`Day ${currentDay} Milestone! Bonus: +${bonus}g`, 'gold', 4000);
    }

    // Update session high scores (iteration 98)
    if (gold > sessionHighScores.highestGold) {
        sessionHighScores.highestGold = gold;
        showNotification('NEW HIGH SCORE: Gold!', 'gold', 2000);
    }
    if (currentDay > sessionHighScores.longestDay) {
        sessionHighScores.longestDay = currentDay;
    }
    if (shipsDestroyed > sessionHighScores.mostShipsSunk) {
        sessionHighScores.mostShipsSunk = shipsDestroyed;
    }

    // Restore armor
    playerStats.currentArmor = playerStats.maxArmor;

    // Advance day
    currentDay++;
    dayTimeRemaining = getDayDuration();

    // Reset timer color
    if (scene && scene.timerText) {
        scene.timerText.setColor('#FFFFFF');
    }

    // Show new day notification with bonus info (iteration 84)
    showNotification(`Day ${currentDay} begins! Survival bonus: +${survivalBonus}g`, 'success', 3000);
    if (cargoGold > 0) {
        showNotification(`Cargo sold: +${cargoGold}g`, 'gold', 2500);
    }

    // Reset position to center
    player.setPosition(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    player.setVelocity(0, 0);
    player.shipData.speed = 0;
    player.shipData.targetSpeed = 0;

    // Resume sailing
    gameState = 'sailing';

    if (window.testHarness) {
        window.testHarness.logEvent('day_ended', { day: currentDay, gold: gold });
    }
}

function startGame() {
    // Recreate player with selected ship type
    if (player) {
        player.destroy();
    }
    createPlayer(scene);

    // Update camera to follow new player
    scene.cameras.main.startFollow(player, true, 0.1, 0.1);

    // Update ship data for new type
    player.shipData.maxSpeed = getMaxSpeed();
    player.shipData.turnRate = getTurnRate();

    // Start sailing
    gameState = 'sailing';
    dayTimeRemaining = getDayDuration();

    // Show ship notification
    const shipType = SHIP_TYPES[selectedShipType];
    showNotification(`${shipType.name} ready to sail!`, 'success', 3000);

    // Random gameplay tip (iteration 100)
    const tips = [
        'Fire broadside cannons with SPACE key',
        'Collect all 5 Neptune\'s Eye pieces to fight the Kraken',
        'Visit ports to repair, trade, and upgrade',
        'Watch for boss enemies - they drop valuable loot!',
        'Kill streaks give bonus gold - stay aggressive!',
        'Wind direction affects your speed',
        'Upgrade at shipyard ports for better stats',
        'Accept quests at ports for extra gold'
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    scene.time.delayedCall(4000, () => {
        showNotification(`TIP: ${randomTip}`, 'info', 5000);
    });
}

// ============================================================================
// DEBUG COMMANDS
// ============================================================================

window.debugCommands = {
    skipToLevel: (level) => {
        currentDay = level;
        scene.dayText.setText(`Day ${currentDay}`);
    },
    skipToRoom: (roomId) => {
        // N/A for this game
    },
    skipToBoss: () => {
        // Would teleport to Kraken
        console.log('Kraken boss not yet implemented');
    },
    godMode: (enabled) => {
        player.shipData.invulnerable = enabled;
        if (enabled) {
            player.shipData.invulnTimer = Infinity;
        }
    },
    setHealth: (amount) => {
        playerStats.currentArmor = Math.min(amount, playerStats.maxArmor);
    },
    setMaxHealth: (amount) => {
        playerStats.maxArmor = amount;
        playerStats.currentArmor = Math.min(playerStats.currentArmor, amount);
    },
    giveCoins: (amount) => {
        gold += amount;
        totalGoldEarned += amount;
    },
    giveAmmo: (amount) => {
        // Give special weapon charges
        weapons.fireballs.charges += amount;
        weapons.megashot.charges += amount;
        weapons.shield.charges += amount;
    },
    giveAllWeapons: () => {
        weapons.fireballs = { equipped: true, charges: 10 };
        weapons.megashot = { equipped: true, charges: 10 };
        weapons.oilslick = { equipped: true, charges: 10 };
        weapons.shield = { equipped: true, charges: 5 };
    },
    giveItem: (itemId) => {
        cargo.push({ type: itemId, collected: Date.now() });
    },
    giveAllItems: () => {
        const items = ['rum', 'spices', 'silk', 'goldBars', 'gems'];
        items.forEach(item => {
            if (cargo.length < cargoCapacity) {
                cargo.push({ type: item, collected: Date.now() });
            }
        });
    },
    clearRoom: () => {
        enemies.forEach(enemy => {
            enemy.hpBg.destroy();
            enemy.hpBar.destroy();
            enemy.destroy();
        });
        enemies = [];
    },
    spawnEnemy: (type, x, y) => {
        // Support aliases and full names
        const aliases = { navy: 'navy_sloop', frigate: 'navy_frigate', ghost: 'ghost_ship' };
        const typeKey = aliases[type] || type;
        const typeData = ENEMY_TYPES[typeKey] || ENEMY_TYPES.merchant;
        spawnEnemy(scene, x || player.x + 200, y || player.y, typeData);
    },
    spawnBoss: (type) => {
        console.log('Boss spawning not yet implemented');
    },
    showHitboxes: (enabled) => {
        scene.physics.world.drawDebug = enabled;
    },
    showGrid: (enabled) => {
        // N/A
    },
    slowMotion: (factor) => {
        scene.time.timeScale = factor;
    },
    saveState: () => {
        return {
            gold, currentDay, playerStats: {...playerStats},
            cargo: [...cargo], weapons: {...weapons}
        };
    },
    loadState: (state) => {
        if (state) {
            gold = state.gold;
            currentDay = state.currentDay;
            Object.assign(playerStats, state.playerStats);
            cargo = [...state.cargo];
            Object.assign(weapons, state.weapons);
        }
    },
    teleport: (x, y) => {
        player.setPosition(x, y);
    },
    addTime: (seconds) => {
        dayTimeRemaining += seconds * 1000;
    }
};

// ============================================================================
// INITIALIZE GAME
// ============================================================================

game = new Phaser.Game(config);
