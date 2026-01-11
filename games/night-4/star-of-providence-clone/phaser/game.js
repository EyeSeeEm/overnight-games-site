// Star of Providence Clone - Bullet Hell Roguelike
// Built with Phaser 3

// ==================== CONSTANTS ====================
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROOM_WIDTH = 640;
const ROOM_HEIGHT = 480;

// Ship config
const SHIP_CONFIG = {
    normalSpeed: 250,
    focusSpeed: 100,
    dashDistance: 120,
    dashDuration: 100,
    dashCooldown: 500,
    dashIFrames: 150,
    hitboxRadius: 4,
    spriteSize: 24
};

// Health config
const HEALTH_CONFIG = {
    startingHP: 4,
    maxHP: 12,
    startingShields: 0,
    invincibilityTime: 1000
};

// Multiplier config
const MULTIPLIER_CONFIG = {
    min: 1.0,
    max: 3.0,
    gainPerKill: 0.05,
    lossOnHit: 1.0
};

// Floor themes
const FLOOR_THEMES = {
    1: { name: 'Excavation', bgColor: 0x0a0808, borderColor: 0x442211 },
    2: { name: 'Archives', bgColor: 0x080a0f, borderColor: 0x112244 },
    3: { name: 'Maintenance', bgColor: 0x0a0f0a, borderColor: 0x224422 },
    4: { name: 'Bellows', bgColor: 0x0f0808, borderColor: 0x442222 },
    5: { name: 'Sanctum', bgColor: 0x0a0a0a, borderColor: 0x333333 },
    6: { name: 'Forbidden', bgColor: 0x08080f, borderColor: 0x220044 }
};

// Weapons data
const WEAPONS = {
    PEASHOOTER: {
        name: 'Peashooter',
        damage: 5,
        maxAmmo: Infinity,
        fireRate: 100,
        velocity: 720,
        color: 0xFFFF00,
        size: 4
    },
    VULCAN: {
        name: 'Vulcan',
        damage: 15,
        maxAmmo: 500,
        fireRate: 80,
        velocity: 600,
        color: 0xFF6600,
        size: 6
    },
    LASER: {
        name: 'Laser',
        damage: 115,
        maxAmmo: 100,
        fireRate: 667,
        velocity: 1200,
        color: 0x00FFFF,
        size: 8,
        piercing: true
    },
    FIREBALL: {
        name: 'Fireball',
        damage: 80,
        maxAmmo: 90,
        fireRate: 833,
        velocity: 360,
        color: 0xFF4400,
        size: 16,
        explosive: true
    },
    TRIPLE: {
        name: 'Triple Shot',
        damage: 8,
        maxAmmo: 300,
        fireRate: 150,
        velocity: 600,
        color: 0x00FF00,
        size: 5,
        spread: 3
    },
    CHARGE: {
        name: 'Charge',
        damage: 11,
        maxAmmo: 1250,
        fireRate: 80,
        velocity: 600,
        color: 0xFF00FF,
        size: 6,
        chargeable: true,
        maxCharge: 1000,
        chargeMultiplier: 5
    },
    REVOLVER: {
        name: 'Revolver',
        damage: 28,
        maxAmmo: 250,
        fireRate: 133,
        velocity: 540,
        color: 0xFFFFFF,
        size: 5,
        clipSize: 6,
        reloadTime: 750
    },
    SWORD: {
        name: 'Sword',
        damage: 70,
        maxAmmo: 125,
        fireRate: 533,
        velocity: 0,
        color: 0xCCCCFF,
        size: 24,
        melee: true,
        coneAngle: 90,
        range: 80
    },
    RAILGUN: {
        name: 'Railgun',
        damage: 125,
        maxAmmo: 70,
        fireRate: 1000,
        velocity: 180,
        color: 0x8800FF,
        size: 12,
        piercing: true,
        penetrateAll: true
    }
};

// Enemy types
const ENEMIES = {
    GHOST: {
        name: 'Ghost',
        hp: 50,
        debris: 10,
        speed: 80,
        behavior: 'chase',
        color: 0xAAAAFF,
        size: 20,
        attackCooldown: 2000,
        attackType: 'aimed'
    },
    DRONE: {
        name: 'Drone',
        hp: 70,
        debris: 30,
        speed: 150,
        behavior: 'dash',
        color: 0x888888,
        size: 18,
        attackCooldown: 1500,
        attackType: 'spread'
    },
    TURRET: {
        name: 'Turret',
        hp: 90,
        debris: 25,
        speed: 0,
        behavior: 'stationary',
        color: 0x666666,
        size: 24,
        attackCooldown: 1000,
        attackType: 'burst'
    },
    SEEKER: {
        name: 'Seeker',
        hp: 120,
        debris: 37,
        speed: 100,
        behavior: 'wander',
        color: 0xFFAA00,
        size: 22,
        attackCooldown: 1800,
        attackType: 'spread'
    },
    SWARMER: {
        name: 'Swarmer',
        hp: 12,
        debris: 0,
        speed: 200,
        behavior: 'chase',
        color: 0xFF0000,
        size: 10,
        attackCooldown: Infinity,
        attackType: 'none'
    },
    CRAZY_GHOST: {
        name: 'Crazy Ghost',
        hp: 100,
        debris: 7,
        speed: 120,
        behavior: 'target_position',
        color: 0x8888FF,
        size: 18,
        attackCooldown: Infinity,
        attackType: 'explosion_death',
        explodeOnDeath: true
    },
    HERMIT: {
        name: 'Hermit',
        hp: 125,
        debris: 75,
        speed: 40,
        behavior: 'avoid',
        color: 0x446644,
        size: 26,
        attackCooldown: 3000,
        attackType: 'spawn_ghost'
    },
    PYROMANCER: {
        name: 'Pyromancer',
        hp: 110,
        debris: 80,
        speed: 60,
        behavior: 'wander',
        color: 0xFF6600,
        size: 22,
        attackCooldown: 2000,
        attackType: 'fireball'
    },
    CRYOMANCER: {
        name: 'Cryomancer',
        hp: 100,
        debris: 55,
        speed: 60,
        behavior: 'wander',
        color: 0x66CCFF,
        size: 22,
        attackCooldown: 2500,
        attackType: 'icicle'
    },
    BLOB: {
        name: 'Blob',
        hp: 150,
        debris: 55,
        speed: 80,
        behavior: 'bounce',
        color: 0x44FF44,
        size: 28,
        attackCooldown: Infinity,
        attackType: 'none',
        splitsOnDeath: true
    },
    BUMPER: {
        name: 'Bumper',
        hp: 120,
        debris: 50,
        speed: 150,
        behavior: 'bounce',
        color: 0xFFAA44,
        size: 20,
        attackCooldown: Infinity,
        attackType: 'ring_death',
        pushableByBullets: true
    }
};

// Weapon keywords
const KEYWORDS = {
    HOMING: {
        name: 'Homing',
        damageModifier: 1.0,
        effect: 'projectiles track enemies'
    },
    TRIPLE: {
        name: 'Triple',
        damageModifier: 0.5,
        effect: 'fires 3 projectiles'
    },
    HIGH_CALIBER: {
        name: 'High-Caliber',
        damageModifier: 3.5,
        fireRateModifier: 3.25,
        effect: 'slower but stronger'
    },
    GATLING: {
        name: 'Gatling',
        damageModifier: 0.5,
        fireRateModifier: 0.4,
        effect: 'faster but weaker'
    },
    FREEZE: {
        name: 'Freeze',
        damageModifier: 1.0,
        effect: 'slows enemies'
    },
    PIERCING: {
        name: 'Piercing',
        damageModifier: 1.0,
        effect: 'passes through enemies'
    }
};

// Shop items
const SHOP_ITEMS = {
    HP_RESTORE: { name: 'Health Pack', price: 100, effect: 'hp', value: 2, icon: '❤️' },
    MAX_HP: { name: 'Max HP Up', price: 300, effect: 'maxHp', value: 1, icon: '💗' },
    SHIELD: { name: 'Shield', price: 150, effect: 'shield', value: 1, icon: '🛡️' },
    AMMO: { name: 'Ammo Refill', price: 80, effect: 'ammo', value: 0.5, icon: '🔫' },
    BOMB: { name: 'Bomb', price: 200, effect: 'bomb', value: 1, icon: '💣' },
    DAMAGE_UP: { name: 'Damage +5%', price: 400, effect: 'damage', value: 0.05, icon: '⚔️' }
};

// Upgrade options
const UPGRADES = {
    ARTIFACT: { name: 'Artifact', description: 'Powerful weapon with 4 keywords', effect: 'artifact' },
    AUTOBOMB: { name: 'Autobomb', description: 'Auto-use bomb when hit', effect: 'autobomb' },
    BLINK: { name: 'Blink', description: 'Dash teleports through walls', effect: 'blink' },
    DISCOUNT: { name: 'Discount', description: 'Shop prices -34%', effect: 'discount' },
    FORTUNE: { name: 'Fortune', description: 'Better pickup drops', effect: 'fortune' },
    RESERVES: { name: 'Reserves', description: '+10% damage', effect: 'reserves' }
};

// Room types for procedural generation
const ROOM_TYPES = {
    NORMAL: { enemyCount: { min: 3, max: 8 }, pickupChance: 0.3 },
    ELITE: { enemyCount: { min: 2, max: 4 }, eliteOnly: true, reward: 'weapon' },
    SHOP: { enemyCount: 0, hasShop: true },
    UPGRADE: { enemyCount: 0, hasUpgrade: true },
    TREASURE: { enemyCount: 0, hasTreasure: true },
    BOSS: { enemyCount: 1, isBoss: true }
};

// Boss data
const BOSSES = {
    CHAMBERLORD: {
        name: 'Chamberlord',
        hp: 1500,
        debris: 500,
        color: 0xFF00FF,
        size: 64,
        phases: [
            { hpThreshold: 1.0, attackPattern: 'spread_ring' },
            { hpThreshold: 0.5, attackPattern: 'spiral' },
            { hpThreshold: 0.25, attackPattern: 'barrage' }
        ]
    },
    GUARDIAN: {
        name: 'Guardian',
        hp: 1400,
        debris: 500,
        color: 0x8888FF,
        size: 64,
        phases: [
            { hpThreshold: 1.0, attackPattern: 'mace_smash' },
            { hpThreshold: 0.5, attackPattern: 'lance_ghosts' },
            { hpThreshold: 0.25, attackPattern: 'radial_burst' }
        ]
    },
    GRINDER: {
        name: 'Grinder',
        hp: 1600,
        debris: 500,
        color: 0x888888,
        size: 56,
        phases: [
            { hpThreshold: 1.0, attackPattern: 'charge' },
            { hpThreshold: 0.5, attackPattern: 'spawn_saws' },
            { hpThreshold: 0.25, attackPattern: 'ring_burst' }
        ]
    },
    RINGLEADER: {
        name: 'Ringleader',
        hp: 2000,
        debris: 500,
        color: 0xFFFF88,
        size: 48,
        phases: [
            { hpThreshold: 1.0, attackPattern: 'summon_ghosts' },
            { hpThreshold: 0.5, attackPattern: 'circle_formation' },
            { hpThreshold: 0.25, attackPattern: 'rotating_ring' }
        ]
    }
};

// ==================== MAIN SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.gameState = 'menu';
        this.currentFloor = 1;
        this.currentRoom = 0;
        this.roomsCleared = 0;
        this.totalRooms = 8;

        // Shop/upgrade state
        this.inShop = false;
        this.inUpgrade = false;
        this.shopMenuIndex = 0;
        this.upgradeMenuIndex = 0;
        this.availableShopItems = [];
        this.availableUpgrades = [];

        // Floor map for minimap
        this.floorMap = [];
        this.playerRoomX = 0;
        this.playerRoomY = 0;

        // Player upgrades
        this.playerUpgrades = [];
    }

    preload() {
        // Generate textures
        this.createShipTexture();
        this.createBulletTextures();
        this.createEnemyTextures();
        this.createPickupTextures();
    }

    create() {
        // Create player
        this.createPlayer();

        // Create groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.particles = this.physics.add.group();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D',
            focus: 'SHIFT',
            fire: 'SPACE',
            bomb: 'X',
            dash: 'Z'
        });

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.playerHit, null, this);
        this.physics.add.overlap(this.enemies, this.player, this.playerContactEnemy, null, this);
        this.physics.add.overlap(this.pickups, this.player, this.collectPickup, null, this);

        // Timers
        this.lastFireTime = 0;
        this.bossSpawnTimer = 0;

        // Input for menu
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.gameState === 'menu') {
                this.startGame();
            } else if (this.gameState === 'gameover') {
                this.restartGame();
            } else if (this.gameState === 'victory') {
                this.nextFloor();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });

        // Pause on Escape
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameState === 'playing') {
                if (this.inShop) {
                    this.closeShop();
                } else if (this.inUpgrade) {
                    this.closeUpgrade();
                } else {
                    this.pauseGame();
                }
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        });

        // Shop/Upgrade navigation
        this.input.keyboard.on('keydown-W', () => {
            if (this.inShop) {
                this.shopMenuIndex = Math.max(0, this.shopMenuIndex - 1);
            } else if (this.inUpgrade) {
                this.upgradeMenuIndex = Math.max(0, this.upgradeMenuIndex - 1);
            }
        });
        this.input.keyboard.on('keydown-S', () => {
            if (this.inShop) {
                this.shopMenuIndex = Math.min(this.availableShopItems.length - 1, this.shopMenuIndex + 1);
            } else if (this.inUpgrade) {
                this.upgradeMenuIndex = Math.min(this.availableUpgrades.length - 1, this.upgradeMenuIndex + 1);
            }
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.inShop) {
                this.purchaseShopItem();
            } else if (this.inUpgrade) {
                this.selectUpgrade();
            }
        });

        // Interact key for entering shop/upgrade
        this.input.keyboard.on('keydown-E', () => {
            if (this.gameState === 'playing' && !this.inShop && !this.inUpgrade) {
                if (this.currentRoomType === 'SHOP') {
                    this.openShop();
                } else if (this.currentRoomType === 'UPGRADE') {
                    this.openUpgrade();
                }
            }
        });

        // Room bounds
        this.roomBounds = {
            left: (GAME_WIDTH - ROOM_WIDTH) / 2,
            right: (GAME_WIDTH + ROOM_WIDTH) / 2,
            top: 60,
            bottom: 60 + ROOM_HEIGHT
        };
    }

    createShipTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Ship body
        g.fillStyle(0x00FF88);
        g.fillTriangle(12, 0, 0, 24, 24, 24);
        g.fillStyle(0x00AA55);
        g.fillTriangle(12, 4, 4, 20, 20, 20);

        // Cockpit
        g.fillStyle(0x88FFFF);
        g.fillCircle(12, 10, 4);

        g.generateTexture('ship', 24, 24);
        g.destroy();
    }

    createBulletTextures() {
        // Player bullet
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFFF00);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet_player', 8, 8);
        g.destroy();

        // Enemy bullet small
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFF4444);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet_enemy', 8, 8);
        g.destroy();

        // Enemy bullet large
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFF6644);
        g.fillCircle(8, 8, 8);
        g.generateTexture('bullet_large', 16, 16);
        g.destroy();
    }

    createEnemyTextures() {
        for (const [key, enemy] of Object.entries(ENEMIES)) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            const size = enemy.size;
            g.fillStyle(enemy.color);
            g.fillCircle(size / 2, size / 2, size / 2);
            g.fillStyle(0x000000, 0.3);
            g.fillCircle(size / 2, size / 2 + 2, size / 3);
            g.generateTexture('enemy_' + key.toLowerCase(), size, size);
            g.destroy();
        }

        // Boss texture
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFF00FF);
        g.fillCircle(32, 32, 32);
        g.fillStyle(0xAA00AA);
        g.fillCircle(32, 32, 24);
        g.fillStyle(0xFF00FF);
        g.fillCircle(32, 20, 8);
        g.fillCircle(20, 40, 6);
        g.fillCircle(44, 40, 6);
        g.generateTexture('boss', 64, 64);
        g.destroy();
    }

    createPickupTextures() {
        // Health
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFF0000);
        g.fillCircle(8, 6, 5);
        g.fillCircle(14, 6, 5);
        g.fillTriangle(3, 8, 11, 18, 19, 8);
        g.generateTexture('pickup_health', 22, 20);
        g.destroy();

        // Ammo
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFAA00);
        g.fillRect(2, 0, 8, 16);
        g.fillStyle(0xFFDD00);
        g.fillRect(4, 2, 4, 4);
        g.generateTexture('pickup_ammo', 12, 16);
        g.destroy();

        // Debris
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFFF00);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xFFAA00);
        g.fillCircle(6, 6, 3);
        g.generateTexture('pickup_debris', 12, 12);
        g.destroy();

        // Weapon
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x00FFFF);
        g.fillRect(0, 6, 20, 8);
        g.fillStyle(0x00AAAA);
        g.fillRect(14, 4, 6, 12);
        g.generateTexture('pickup_weapon', 20, 20);
        g.destroy();

        // Bomb
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x333333);
        g.fillCircle(10, 12, 10);
        g.fillStyle(0xFF8800);
        g.fillRect(8, 0, 4, 6);
        g.generateTexture('pickup_bomb', 20, 22);
        g.destroy();

        // Shield
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x0088FF);
        g.fillRect(3, 0, 10, 16);
        g.fillTriangle(3, 16, 8, 22, 13, 16);
        g.fillStyle(0x00CCFF);
        g.fillRect(5, 2, 6, 10);
        g.generateTexture('pickup_shield', 16, 22);
        g.destroy();

        // Key
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFDD00);
        g.fillCircle(6, 6, 6);
        g.fillRect(5, 10, 2, 10);
        g.fillRect(5, 14, 6, 2);
        g.fillRect(5, 18, 4, 2);
        g.generateTexture('pickup_key', 12, 22);
        g.destroy();
    }

    createPlayer() {
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'ship');
        this.player.setCollideWorldBounds(true);

        // Player stats
        this.player.hp = HEALTH_CONFIG.startingHP;
        this.player.maxHP = HEALTH_CONFIG.startingHP;
        this.player.shields = HEALTH_CONFIG.startingShields;
        this.player.debris = 0;
        this.player.multiplier = 1.0;
        this.player.bombs = 2;
        this.player.maxBombs = 6;
        this.player.damageBonus = 0;
        this.player.score = 0;
        this.player.enemiesKilled = 0;
        this.player.bossesKilled = 0;

        // Weapon
        this.player.currentWeapon = { ...WEAPONS.PEASHOOTER };
        this.player.ammo = Infinity;

        // Dash state
        this.player.isDashing = false;
        this.player.isInvincible = false;
        this.player.dashCooldown = 0;

        // Hitbox (tiny for bullet hell)
        this.player.body.setCircle(SHIP_CONFIG.hitboxRadius,
            SHIP_CONFIG.spriteSize / 2 - SHIP_CONFIG.hitboxRadius,
            SHIP_CONFIG.spriteSize / 2 - SHIP_CONFIG.hitboxRadius);
    }

    startGame() {
        this.gameState = 'playing';
        this.currentFloor = 1;
        this.currentRoom = 1;
        this.roomsCleared = 0;
        this.totalRooms = 8;
        this.currentRoomType = 'START';
        this.generateFloorMap();
        this.spawnRoom();
    }

    restartGame() {
        // Reset player
        this.player.hp = HEALTH_CONFIG.startingHP;
        this.player.maxHP = HEALTH_CONFIG.startingHP;
        this.player.shields = 0;
        this.player.debris = 0;
        this.player.multiplier = 1.0;
        this.player.bombs = 2;
        this.player.damageBonus = 0;
        this.player.currentWeapon = { ...WEAPONS.PEASHOOTER };
        this.player.ammo = Infinity;
        this.player.x = GAME_WIDTH / 2;
        this.player.y = GAME_HEIGHT - 100;
        this.player.isInvincible = false;
        this.player.isDashing = false;

        // Clear bullets and enemies
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);

        this.startGame();
    }

    pauseGame() {
        this.gameState = 'paused';
        this.physics.pause();
    }

    resumeGame() {
        this.gameState = 'playing';
        this.physics.resume();
        // Clear pause overlay
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = null;
        }
    }

    nextFloor() {
        this.currentFloor++;
        this.currentRoom = 1;
        this.roomsCleared = 0;
        this.totalRooms = 8 + this.currentFloor * 2;

        // Clear bullets
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.pickups.clear(true, true);

        // Reset player position
        this.player.x = GAME_WIDTH / 2;
        this.player.y = GAME_HEIGHT - 100;

        this.gameState = 'playing';
        this.spawnRoom();
    }

    spawnRoom() {
        // Room transition effect
        const transition = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1);
        this.tweens.add({
            targets: transition,
            alpha: 0,
            duration: 500,
            onComplete: () => transition.destroy()
        });

        this.enemies.clear(true, true);
        this.enemyBullets.clear(true, true);

        // Mark current room as visited
        if (this.floorMap[this.playerRoomY] && this.floorMap[this.playerRoomY][this.playerRoomX]) {
            this.floorMap[this.playerRoomY][this.playerRoomX].visited = true;
            this.currentRoomType = this.floorMap[this.playerRoomY][this.playerRoomX].type;
        }

        // Handle special room types
        if (this.currentRoomType === 'SHOP' || this.currentRoomType === 'UPGRADE') {
            // Empty room, player can interact
            return;
        }

        if (this.currentRoomType === 'TREASURE') {
            // Spawn pickups
            for (let i = 0; i < 5; i++) {
                this.spawnPickup(
                    GAME_WIDTH / 2 + Phaser.Math.Between(-100, 100),
                    GAME_HEIGHT / 2 + Phaser.Math.Between(-50, 50),
                    ['health', 'ammo', 'bomb', 'weapon', 'shield'][i]
                );
            }
            this.floorMap[this.playerRoomY][this.playerRoomX].cleared = true;
            return;
        }

        // Boss room every 8 rooms or boss room type
        const isBossRoom = this.currentRoom % 8 === 0 || this.currentRoomType === 'BOSS';

        if (isBossRoom) {
            // Boss warning
            const warningText = this.add.text(GAME_WIDTH / 2, 150, 'WARNING: BOSS APPROACHING', {
                fontSize: '24px',
                fontFamily: 'Courier',
                color: '#FF0000'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: warningText,
                alpha: 0,
                duration: 2000,
                onComplete: () => warningText.destroy()
            });
            // Delay boss spawn for dramatic effect
            this.time.delayedCall(1500, () => this.spawnBoss());
        } else {
            // Normal room - spawn enemies
            const enemyCount = 3 + Math.floor(this.currentFloor * 0.5) + Math.floor(this.currentRoom * 0.3);
            const enemyTypes = Object.keys(ENEMIES);

            for (let i = 0; i < enemyCount; i++) {
                const type = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
                const x = Phaser.Math.Between(this.roomBounds.left + 50, this.roomBounds.right - 50);
                const y = Phaser.Math.Between(this.roomBounds.top + 30, this.roomBounds.top + 200);
                this.spawnEnemy(type, x, y);
            }
        }
    }

    spawnEnemy(type, x, y) {
        const data = ENEMIES[type];
        const enemy = this.enemies.create(x, y, 'enemy_' + type.toLowerCase());

        enemy.enemyType = type;
        enemy.hp = data.hp * (1 + (this.currentFloor - 1) * 0.2);
        enemy.maxHP = enemy.hp;
        enemy.debris = data.debris;
        enemy.speed = data.speed;
        enemy.behavior = data.behavior;
        enemy.attackCooldown = data.attackCooldown;
        enemy.attackType = data.attackType;
        enemy.lastAttack = 0;
        enemy.wanderAngle = Math.random() * Math.PI * 2;
        enemy.dashTarget = null;

        enemy.body.setCircle(data.size / 2);

        return enemy;
    }

    spawnBoss() {
        // Select random boss type
        const bossTypes = Object.keys(BOSSES);
        const selectedBossType = bossTypes[Phaser.Math.Between(0, bossTypes.length - 1)];
        const bossData = BOSSES[selectedBossType];

        const boss = this.enemies.create(GAME_WIDTH / 2, 150, 'boss');

        boss.isBoss = true;
        boss.bossType = selectedBossType;
        boss.hp = bossData.hp * (1 + (this.currentFloor - 1) * 0.3);
        boss.maxHP = boss.hp;
        boss.debris = bossData.debris;
        boss.phase = 0;
        boss.patternTimer = 0;
        boss.attackAngle = 0;

        // Scale visual
        boss.setTint(bossData.color);
        boss.body.setCircle(bossData.size / 2);
        boss.setScale(bossData.size / 64);
    }

    update(time, delta) {
        if (this.gameState === 'menu') {
            this.renderMenu();
            return;
        }

        if (this.gameState === 'gameover') {
            this.renderGameOver();
            return;
        }

        if (this.gameState === 'victory') {
            this.renderVictory();
            return;
        }

        if (this.gameState === 'paused') {
            this.renderPause();
            return;
        }

        // Handle shop/upgrade overlays
        if (this.inShop) {
            this.renderShop();
            this.renderHUD();
            return;
        }
        if (this.inUpgrade) {
            this.renderUpgrade();
            this.renderHUD();
            return;
        }

        // Update player
        this.updatePlayer(time, delta);

        // Update enemies
        this.updateEnemies(time, delta);

        // Update bullets
        this.updateBullets(delta);

        // Update pickups
        this.updatePickups(delta);

        // Check room cleared
        this.checkRoomCleared();

        // Render HUD
        this.renderHUD();
    }

    updatePlayer(time, delta) {
        // Dash cooldown
        if (this.player.dashCooldown > 0) {
            this.player.dashCooldown -= delta;
        }

        // Skip movement during dash
        if (this.player.isDashing) return;

        // Movement
        const isFocused = this.keys.focus.isDown;
        const speed = isFocused ? SHIP_CONFIG.focusSpeed : SHIP_CONFIG.normalSpeed;

        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.keys.a.isDown) vx = -1;
        if (this.cursors.right.isDown || this.keys.d.isDown) vx = 1;
        if (this.cursors.up.isDown || this.keys.w.isDown) vy = -1;
        if (this.cursors.down.isDown || this.keys.s.isDown) vy = 1;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }

        this.player.setVelocity(vx * speed, vy * speed);

        // Clamp to room
        this.player.x = Phaser.Math.Clamp(this.player.x, this.roomBounds.left + 16, this.roomBounds.right - 16);
        this.player.y = Phaser.Math.Clamp(this.player.y, this.roomBounds.top + 16, this.roomBounds.bottom - 16);

        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keys.dash) && this.player.dashCooldown <= 0) {
            this.performDash(vx, vy);
        }

        // Charge weapon handling
        if (this.player.currentWeapon.chargeable) {
            if (this.keys.fire.isDown) {
                this.player.chargeTime = (this.player.chargeTime || 0) + delta;
                this.player.chargeTime = Math.min(this.player.chargeTime, this.player.currentWeapon.maxCharge);
            } else if (this.player.chargeTime > 0) {
                this.fireChargeWeapon(time);
                this.player.chargeTime = 0;
            }
        } else if (this.keys.fire.isDown && time - this.lastFireTime > this.player.currentWeapon.fireRate) {
            this.fireWeapon(time);
        }

        // Bomb
        if (Phaser.Input.Keyboard.JustDown(this.keys.bomb) && this.player.bombs > 0) {
            this.useBomb();
        }
    }

    performDash(vx, vy) {
        // Default direction up if not moving
        if (vx === 0 && vy === 0) {
            vy = -1;
        }

        this.player.isDashing = true;
        this.player.isInvincible = true;
        this.player.dashCooldown = SHIP_CONFIG.dashCooldown;

        const magnitude = Math.sqrt(vx * vx + vy * vy);
        const dashVx = (vx / magnitude) * SHIP_CONFIG.dashDistance;
        const dashVy = (vy / magnitude) * SHIP_CONFIG.dashDistance;

        this.tweens.add({
            targets: this.player,
            x: Phaser.Math.Clamp(this.player.x + dashVx, this.roomBounds.left + 16, this.roomBounds.right - 16),
            y: Phaser.Math.Clamp(this.player.y + dashVy, this.roomBounds.top + 16, this.roomBounds.bottom - 16),
            duration: SHIP_CONFIG.dashDuration,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.player.isDashing = false;
                this.time.delayedCall(SHIP_CONFIG.dashIFrames - SHIP_CONFIG.dashDuration, () => {
                    this.player.isInvincible = false;
                });
            }
        });

        // Dash trail effect
        for (let i = 0; i < 5; i++) {
            const ghost = this.add.sprite(this.player.x, this.player.y, 'ship');
            ghost.setAlpha(0.5 - i * 0.1);
            ghost.setTint(0x00FFFF);
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: 200,
                onComplete: () => ghost.destroy()
            });
        }
    }

    fireWeapon(time) {
        // Handle melee weapons separately
        if (this.player.currentWeapon.melee) {
            this.fireMeleeWeapon(time);
            return;
        }

        // Handle revolver clip reload
        if (this.player.currentWeapon.clipSize && this.player.clipAmmo !== undefined) {
            if (this.player.clipAmmo <= 0) {
                if (!this.player.isReloading) {
                    this.player.isReloading = true;
                    this.time.delayedCall(this.player.currentWeapon.reloadTime, () => {
                        this.player.clipAmmo = this.player.currentWeapon.clipSize;
                        this.player.isReloading = false;
                    });
                }
                return;
            }
            this.player.clipAmmo--;
        }

        this.lastFireTime = time;
        const weapon = this.player.currentWeapon;

        // Consume ammo
        if (weapon.maxAmmo !== Infinity) {
            this.player.ammo--;
            if (this.player.ammo <= 0) {
                this.player.currentWeapon = { ...WEAPONS.PEASHOOTER };
                this.player.ammo = Infinity;
                this.player.clipAmmo = undefined;
            }
        }

        const damage = weapon.damage * (1 + this.player.damageBonus);

        if (weapon.spread) {
            // Triple shot
            for (let i = -1; i <= 1; i++) {
                const angle = -Math.PI / 2 + (i * 0.2);
                this.createPlayerBullet(
                    this.player.x,
                    this.player.y - 10,
                    Math.cos(angle) * weapon.velocity,
                    Math.sin(angle) * weapon.velocity,
                    damage,
                    weapon
                );
            }
        } else {
            this.createPlayerBullet(
                this.player.x,
                this.player.y - 10,
                0,
                -weapon.velocity,
                damage,
                weapon
            );
        }
    }

    createPlayerBullet(x, y, vx, vy, damage, weapon) {
        const bullet = this.playerBullets.create(x, y, 'bullet_player');
        bullet.setVelocity(vx, vy);
        bullet.damage = damage;
        bullet.piercing = weapon.piercing || false;
        bullet.explosive = weapon.explosive || false;
        bullet.setTint(weapon.color);
        bullet.setScale(weapon.size / 8);

        // Muzzle flash
        const flash = this.add.circle(x, y, 8, weapon.color, 0.8);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 50,
            onComplete: () => flash.destroy()
        });
    }

    fireChargeWeapon(time) {
        this.lastFireTime = time;
        const weapon = this.player.currentWeapon;
        const chargeRatio = this.player.chargeTime / weapon.maxCharge;
        const bulletCount = Math.max(1, Math.floor(chargeRatio * weapon.chargeMultiplier));

        // Consume ammo based on charge
        if (weapon.maxAmmo !== Infinity) {
            this.player.ammo -= bulletCount;
            if (this.player.ammo <= 0) {
                this.player.currentWeapon = { ...WEAPONS.PEASHOOTER };
                this.player.ammo = Infinity;
            }
        }

        const damage = weapon.damage * (1 + chargeRatio * 2) * (1 + this.player.damageBonus);

        // Fire burst of bullets
        for (let i = 0; i < bulletCount; i++) {
            const spreadAngle = (i - (bulletCount - 1) / 2) * 0.1;
            const angle = -Math.PI / 2 + spreadAngle;
            this.time.delayedCall(i * 50, () => {
                this.createPlayerBullet(
                    this.player.x,
                    this.player.y - 10,
                    Math.cos(angle) * weapon.velocity,
                    Math.sin(angle) * weapon.velocity,
                    damage,
                    weapon
                );
            });
        }
    }

    fireMeleeWeapon(time) {
        this.lastFireTime = time;
        const weapon = this.player.currentWeapon;

        // Consume ammo
        if (weapon.maxAmmo !== Infinity) {
            this.player.ammo--;
            if (this.player.ammo <= 0) {
                this.player.currentWeapon = { ...WEAPONS.PEASHOOTER };
                this.player.ammo = Infinity;
            }
        }

        const damage = weapon.damage * (1 + this.player.damageBonus);

        // Create melee arc effect
        const arc = this.add.arc(this.player.x, this.player.y - 20, weapon.range,
            Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), false, weapon.color, 0.5);
        this.tweens.add({
            targets: arc,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            onComplete: () => arc.destroy()
        });

        // Damage enemies in cone
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < weapon.range) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const angleDeg = Phaser.Math.RadToDeg(angle) + 90;
                if (angleDeg > -weapon.coneAngle / 2 && angleDeg < weapon.coneAngle / 2) {
                    this.damageEnemy(enemy, damage);
                }
            }
        });

        // Clear nearby bullets
        this.enemyBullets.children.iterate(bullet => {
            if (!bullet) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, bullet.x, bullet.y);
            if (dist < weapon.range * 0.5) {
                bullet.destroy();
            }
        });
    }

    useBomb() {
        this.player.bombs--;

        // Clear all enemy bullets
        this.enemyBullets.clear(true, true);

        // Damage all enemies
        this.enemies.children.iterate(enemy => {
            if (enemy) {
                this.damageEnemy(enemy, 50);
            }
        });

        // Multiplier penalty
        this.player.multiplier = Math.max(1.0, this.player.multiplier - 1.0);

        // Visual effect
        const bombEffect = this.add.circle(this.player.x, this.player.y, 10, 0xFFFFFF, 0.8);
        this.tweens.add({
            targets: bombEffect,
            radius: 300,
            alpha: 0,
            duration: 500,
            onComplete: () => bombEffect.destroy()
        });
    }

    updateEnemies(time, delta) {
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            if (enemy.isBoss) {
                this.updateBoss(enemy, time, delta);
            } else {
                this.updateNormalEnemy(enemy, time, delta);
            }
        });
    }

    updateNormalEnemy(enemy, time, delta) {
        // Process slow timer
        if (enemy.slowTimer > 0) {
            enemy.slowTimer -= delta;
            if (enemy.slowTimer <= 0) {
                enemy.clearTint();
            }
        }
        const slowMultiplier = enemy.slowTimer > 0 ? 0.5 : 1.0;

        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Movement behavior
        switch (enemy.behavior) {
            case 'chase':
                if (dist > 50) {
                    enemy.setVelocity(
                        (dx / dist) * enemy.speed * slowMultiplier,
                        (dy / dist) * enemy.speed * slowMultiplier
                    );
                } else {
                    enemy.setVelocity(0, 0);
                }
                break;

            case 'dash':
                if (!enemy.dashTarget) {
                    if (Math.random() < 0.02) {
                        enemy.dashTarget = { x: this.player.x, y: this.player.y };
                    } else {
                        enemy.setVelocity(0, 0);
                    }
                } else {
                    const tdx = enemy.dashTarget.x - enemy.x;
                    const tdy = enemy.dashTarget.y - enemy.y;
                    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                    if (tdist < 20) {
                        enemy.dashTarget = null;
                    } else {
                        enemy.setVelocity(
                            (tdx / tdist) * enemy.speed * 2,
                            (tdy / tdist) * enemy.speed * 2
                        );
                    }
                }
                break;

            case 'wander':
                enemy.wanderAngle += (Math.random() - 0.5) * 0.2;
                enemy.setVelocity(
                    Math.cos(enemy.wanderAngle) * enemy.speed,
                    Math.sin(enemy.wanderAngle) * enemy.speed * 0.5
                );
                // Bounce off walls
                if (enemy.x < this.roomBounds.left + 30 || enemy.x > this.roomBounds.right - 30) {
                    enemy.wanderAngle = Math.PI - enemy.wanderAngle;
                }
                if (enemy.y < this.roomBounds.top + 30 || enemy.y > this.roomBounds.top + 250) {
                    enemy.wanderAngle = -enemy.wanderAngle;
                }
                break;

            case 'stationary':
                enemy.setVelocity(0, 0);
                break;

            case 'avoid':
                // Run away from player
                if (dist < 200) {
                    enemy.setVelocity(
                        -(dx / dist) * enemy.speed,
                        -(dy / dist) * enemy.speed
                    );
                } else {
                    enemy.setVelocity(0, 0);
                }
                break;

            case 'target_position':
                // Move to player's position then stop
                if (!enemy.targetPos) {
                    enemy.targetPos = { x: this.player.x, y: this.player.y };
                }
                const tdx = enemy.targetPos.x - enemy.x;
                const tdy = enemy.targetPos.y - enemy.y;
                const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                if (tdist > 20) {
                    enemy.setVelocity(
                        (tdx / tdist) * enemy.speed,
                        (tdy / tdist) * enemy.speed
                    );
                } else {
                    // Reached target, explode if appropriate
                    if (ENEMIES[enemy.enemyType]?.explodeOnDeath) {
                        this.killEnemy(enemy);
                    } else {
                        enemy.targetPos = null;
                    }
                }
                break;

            case 'bounce':
                // Initialize velocity if not set
                if (!enemy.bounceInitialized) {
                    const angle = Math.random() * Math.PI * 2;
                    enemy.setVelocity(
                        Math.cos(angle) * enemy.speed,
                        Math.sin(angle) * enemy.speed
                    );
                    enemy.bounceInitialized = true;
                }
                // Bounce off walls
                if (enemy.x < this.roomBounds.left + 30 || enemy.x > this.roomBounds.right - 30) {
                    enemy.body.velocity.x *= -1;
                    enemy.x = Phaser.Math.Clamp(enemy.x, this.roomBounds.left + 31, this.roomBounds.right - 31);
                }
                if (enemy.y < this.roomBounds.top + 30 || enemy.y > this.roomBounds.top + 250) {
                    enemy.body.velocity.y *= -1;
                    enemy.y = Phaser.Math.Clamp(enemy.y, this.roomBounds.top + 31, this.roomBounds.top + 249);
                }
                break;
        }

        // Attack
        if (time - enemy.lastAttack > enemy.attackCooldown && enemy.attackType !== 'none') {
            enemy.lastAttack = time;
            this.enemyAttack(enemy);
        }

        // Clamp to room
        enemy.x = Phaser.Math.Clamp(enemy.x, this.roomBounds.left + 20, this.roomBounds.right - 20);
        enemy.y = Phaser.Math.Clamp(enemy.y, this.roomBounds.top + 20, this.roomBounds.top + 280);
    }

    updateBoss(boss, time, delta) {
        const bossData = BOSSES[boss.bossType];

        // Update phase
        const hpPercent = boss.hp / boss.maxHP;
        const oldPhase = boss.phase;
        if (hpPercent < 0.25 && boss.phase < 2) {
            boss.phase = 2;
        } else if (hpPercent < 0.5 && boss.phase < 1) {
            boss.phase = 1;
        }

        // Phase change effect
        if (boss.phase !== oldPhase) {
            // Screen shake
            this.cameras.main.shake(500, 0.02);

            // Flash effect
            const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0.5);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 300,
                onComplete: () => flash.destroy()
            });

            // Clear some bullets as mercy
            this.enemyBullets.children.iterate(bullet => {
                if (bullet && Math.random() < 0.5) {
                    bullet.destroy();
                }
            });
        }

        // Movement varies by boss
        switch (boss.bossType) {
            case 'CHAMBERLORD':
            case 'GUARDIAN':
                // Side to side movement
                const targetX = GAME_WIDTH / 2 + Math.sin(time / 1000) * 150;
                boss.x = Phaser.Math.Linear(boss.x, targetX, 0.02);
                break;
            case 'GRINDER':
                // Faster, more aggressive movement
                if (!boss.chargeTarget) {
                    boss.chargeTarget = { x: this.player.x, y: Math.min(this.player.y - 50, 250) };
                }
                const dx = boss.chargeTarget.x - boss.x;
                const dy = boss.chargeTarget.y - boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 10) {
                    boss.x += (dx / dist) * 3;
                    boss.y += (dy / dist) * 3;
                } else {
                    boss.chargeTarget = null;
                }
                break;
            case 'RINGLEADER':
                // Stays back, moves slowly
                const targetX2 = GAME_WIDTH / 2 + Math.sin(time / 2000) * 100;
                boss.x = Phaser.Math.Linear(boss.x, targetX2, 0.01);
                boss.y = Phaser.Math.Linear(boss.y, 120, 0.01);
                break;
        }

        // Attack pattern
        boss.patternTimer += delta;

        const phase = bossData.phases[boss.phase];
        const attackInterval = boss.phase === 2 ? 50 : (boss.phase === 1 ? 100 : 500);

        if (boss.patternTimer > attackInterval) {
            boss.patternTimer = 0;
            boss.attackAngle += 0.1 + boss.phase * 0.05;

            switch (phase?.attackPattern) {
                case 'spread_ring':
                case 'mace_smash':
                    this.bossSpreadAttack(boss, 5 + boss.phase * 2);
                    break;
                case 'spiral':
                case 'lance_ghosts':
                    this.bossSpiralAttack(boss);
                    break;
                case 'barrage':
                case 'radial_burst':
                    this.bossSpiralAttack(boss);
                    if (Math.random() < 0.15) {
                        this.bossSpreadAttack(boss, 8);
                    }
                    break;
                case 'charge':
                    this.bossSpreadAttack(boss, 3);
                    boss.chargeTarget = null; // Retarget
                    break;
                case 'spawn_saws':
                case 'ring_burst':
                    this.bossRingAttack(boss, 12);
                    break;
                case 'summon_ghosts':
                    if (this.enemies.countActive() < 10 && Math.random() < 0.02) {
                        this.spawnEnemy('GHOST', boss.x + Phaser.Math.Between(-50, 50), boss.y + 50);
                    }
                    this.bossSpiralAttack(boss);
                    break;
                case 'circle_formation':
                case 'rotating_ring':
                    this.bossRingAttack(boss, 8 + boss.phase * 2);
                    break;
            }
        }
    }

    bossRingAttack(boss, count) {
        for (let i = 0; i < count; i++) {
            const angle = boss.attackAngle + (Math.PI * 2 / count) * i;
            this.createEnemyBullet(
                boss.x,
                boss.y + 30,
                Math.cos(angle) * 180,
                Math.sin(angle) * 180
            );
        }
    }

    bossSpreadAttack(boss, count) {
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        const spread = Math.PI * 0.4;

        for (let i = 0; i < count; i++) {
            const angle = angleToPlayer - spread / 2 + (spread / (count - 1)) * i;
            this.createEnemyBullet(
                boss.x,
                boss.y + 30,
                Math.cos(angle) * 250,
                Math.sin(angle) * 250,
                true
            );
        }
    }

    bossSpiralAttack(boss) {
        const bullets = 3;
        for (let i = 0; i < bullets; i++) {
            const angle = boss.attackAngle + (Math.PI * 2 / bullets) * i;
            this.createEnemyBullet(
                boss.x,
                boss.y + 30,
                Math.cos(angle) * 200,
                Math.sin(angle) * 200
            );
        }
    }

    enemyAttack(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const angle = Math.atan2(dy, dx);

        switch (enemy.attackType) {
            case 'aimed':
                this.createEnemyBullet(
                    enemy.x,
                    enemy.y,
                    Math.cos(angle) * 200,
                    Math.sin(angle) * 200
                );
                break;

            case 'spread':
                for (let i = -1; i <= 1; i++) {
                    const spreadAngle = angle + i * 0.3;
                    this.createEnemyBullet(
                        enemy.x,
                        enemy.y,
                        Math.cos(spreadAngle) * 180,
                        Math.sin(spreadAngle) * 180
                    );
                }
                break;

            case 'burst':
                for (let i = 0; i < 3; i++) {
                    this.time.delayedCall(i * 100, () => {
                        if (enemy.active) {
                            this.createEnemyBullet(
                                enemy.x,
                                enemy.y,
                                Math.cos(angle) * 220,
                                Math.sin(angle) * 220
                            );
                        }
                    });
                }
                break;

            case 'fireball':
                // Large slow projectile
                const fireball = this.createEnemyBullet(
                    enemy.x,
                    enemy.y,
                    Math.cos(angle) * 120,
                    Math.sin(angle) * 120,
                    true
                );
                if (fireball) fireball.setTint(0xFF4400);
                break;

            case 'icicle':
                // Slow falling projectile
                this.createEnemyBullet(
                    this.player.x + Phaser.Math.Between(-30, 30),
                    this.roomBounds.top + 20,
                    0,
                    100
                );
                break;

            case 'spawn_ghost':
                // Spawn a ghost minion
                if (this.enemies.countActive() < 15) {
                    this.spawnEnemy('GHOST', enemy.x, enemy.y);
                }
                break;

            case 'ring':
                // Ring of bullets
                for (let i = 0; i < 8; i++) {
                    const ringAngle = (Math.PI * 2 / 8) * i;
                    this.createEnemyBullet(
                        enemy.x,
                        enemy.y,
                        Math.cos(ringAngle) * 150,
                        Math.sin(ringAngle) * 150
                    );
                }
                break;
        }
    }

    createEnemyBullet(x, y, vx, vy, large = false) {
        const bullet = this.enemyBullets.create(x, y, large ? 'bullet_large' : 'bullet_enemy');
        bullet.setVelocity(vx, vy);
        return bullet;
    }

    updateBullets(delta) {
        // Update player bullets
        this.playerBullets.children.iterate(bullet => {
            if (!bullet) return;

            // Remove off-screen
            if (bullet.y < 0 || bullet.y > GAME_HEIGHT ||
                bullet.x < 0 || bullet.x > GAME_WIDTH) {
                bullet.destroy();
                return;
            }

            // Homing behavior
            if (bullet.isHoming) {
                let nearestEnemy = null;
                let nearestDist = Infinity;
                this.enemies.children.iterate(enemy => {
                    if (!enemy) return;
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                if (nearestEnemy && nearestDist < 300) {
                    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, nearestEnemy.x, nearestEnemy.y);
                    const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
                    const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angle, 0.05);
                    const speed = Math.sqrt(bullet.body.velocity.x ** 2 + bullet.body.velocity.y ** 2);
                    bullet.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
                }
            }
        });

        // Update enemy bullets
        this.enemyBullets.children.iterate(bullet => {
            if (!bullet) return;

            // Remove off-screen
            if (bullet.y < 0 || bullet.y > GAME_HEIGHT ||
                bullet.x < 0 || bullet.x > GAME_WIDTH) {
                bullet.destroy();
            }
        });
    }

    updatePickups(delta) {
        this.pickups.children.iterate(pickup => {
            if (!pickup) return;

            // Floating animation
            pickup.y += Math.sin(this.time.now / 200 + pickup.x) * 0.3;

            // Lifetime
            pickup.lifetime -= delta;
            if (pickup.lifetime <= 0) {
                pickup.destroy();
            } else if (pickup.lifetime < 2000) {
                pickup.setAlpha(pickup.lifetime / 2000);
            }
        });
    }

    bulletHitEnemy(bullet, enemy) {
        if (!bullet.piercing) {
            bullet.destroy();
        }

        // Explosion effect
        if (bullet.explosive) {
            const explosion = this.add.circle(bullet.x, bullet.y, 5, 0xFF4400, 0.8);
            this.tweens.add({
                targets: explosion,
                radius: 40,
                alpha: 0,
                duration: 200,
                onComplete: () => explosion.destroy()
            });

            // Damage nearby enemies
            this.enemies.children.iterate(e => {
                if (e && Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y) < 50) {
                    this.damageEnemy(e, bullet.damage * 0.5);
                }
            });
        }

        this.damageEnemy(enemy, bullet.damage);
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Flash white
        enemy.setTint(0xFFFFFF);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Show damage number
        const damageText = this.add.text(enemy.x, enemy.y - 20, Math.floor(damage).toString(), {
            fontSize: '12px',
            fontFamily: 'Courier',
            color: '#FFFF00'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: damageText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 500,
            onComplete: () => damageText.destroy()
        });

        // Apply freeze effect if applicable
        if (this.player.currentWeapon.name === 'Cryomancer' || Math.random() < 0.05) {
            enemy.slowTimer = 2000;
            enemy.setTint(0x66CCFF);
        }

        // Show HP bar briefly
        if (!enemy.isBoss) {
            const hpBarBg = this.add.rectangle(enemy.x, enemy.y - 15, 30, 4, 0x440000);
            const hpBarFill = this.add.rectangle(
                enemy.x - 15 + (15 * (enemy.hp / enemy.maxHP)),
                enemy.y - 15,
                30 * Math.max(0, enemy.hp / enemy.maxHP),
                3,
                0xFF0000
            );
            this.time.delayedCall(300, () => {
                if (hpBarBg) hpBarBg.destroy();
                if (hpBarFill) hpBarFill.destroy();
            });
        }

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        const enemyData = ENEMIES[enemy.enemyType];

        // Special death effects
        if (enemyData?.explodeOnDeath) {
            // Explosion on death - spawn bullets
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.createEnemyBullet(
                    enemy.x,
                    enemy.y,
                    Math.cos(angle) * 150,
                    Math.sin(angle) * 150
                );
            }
            // Visual explosion
            const explosion = this.add.circle(enemy.x, enemy.y, 10, 0xFF8844, 0.8);
            this.tweens.add({
                targets: explosion,
                radius: 60,
                alpha: 0,
                duration: 300,
                onComplete: () => explosion.destroy()
            });
        }

        if (enemyData?.splitsOnDeath) {
            // Spawn smaller enemies
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 / 4) * i;
                const newX = enemy.x + Math.cos(angle) * 30;
                const newY = enemy.y + Math.sin(angle) * 30;
                this.spawnEnemy('SWARMER', newX, newY);
            }
        }

        if (enemy.attackType === 'ring_death') {
            // Ring of bullets on death
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.createEnemyBullet(
                    enemy.x,
                    enemy.y,
                    Math.cos(angle) * 120,
                    Math.sin(angle) * 120
                );
            }
        }

        // Death particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const particle = this.add.circle(
                enemy.x,
                enemy.y,
                4,
                enemy.isBoss ? 0xFF00FF : enemyData?.color || 0xFFFFFF
            );
            this.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * 50,
                y: enemy.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        // Spawn debris
        if (enemy.debris > 0) {
            const debrisCount = Math.ceil(enemy.debris / 10);
            for (let i = 0; i < debrisCount; i++) {
                const pickup = this.pickups.create(
                    enemy.x + Phaser.Math.Between(-20, 20),
                    enemy.y + Phaser.Math.Between(-20, 20),
                    'pickup_debris'
                );
                pickup.pickupType = 'debris';
                pickup.value = Math.floor((enemy.debris / debrisCount) * this.player.multiplier);
                pickup.lifetime = 10000;
            }
        }

        // Random drops
        if (Math.random() < 0.1) {
            this.spawnPickup(enemy.x, enemy.y, 'health');
        }
        if (Math.random() < 0.08) {
            this.spawnPickup(enemy.x, enemy.y, 'ammo');
        }
        if (Math.random() < 0.02) {
            this.spawnPickup(enemy.x, enemy.y, 'bomb');
        }
        if (Math.random() < 0.03 && !enemy.isBoss) {
            this.spawnPickup(enemy.x, enemy.y, 'weapon');
        }
        if (Math.random() < 0.02) {
            this.spawnPickup(enemy.x, enemy.y, 'shield');
        }
        // Rare key drop from tough enemies
        if (Math.random() < 0.01 && enemy.hp >= 100) {
            this.spawnPickup(enemy.x, enemy.y, 'key');
        }

        // Update multiplier
        this.player.multiplier = Math.min(
            MULTIPLIER_CONFIG.max,
            this.player.multiplier + MULTIPLIER_CONFIG.gainPerKill
        );

        // Update score and kill counts
        const baseScore = enemy.debris * 10;
        this.player.score += Math.floor(baseScore * this.player.multiplier);
        this.player.enemiesKilled++;
        if (enemy.isBoss) {
            this.player.bossesKilled++;
            this.player.score += 10000 * this.currentFloor;
        }

        enemy.destroy();
    }

    spawnPickup(x, y, type) {
        let texture, value;

        switch (type) {
            case 'health':
                texture = 'pickup_health';
                value = 1;
                break;
            case 'ammo':
                texture = 'pickup_ammo';
                value = 0.25;
                break;
            case 'bomb':
                texture = 'pickup_bomb';
                value = 1;
                break;
            case 'weapon':
                texture = 'pickup_weapon';
                const weaponTypes = Object.keys(WEAPONS).filter(w => w !== 'PEASHOOTER');
                value = weaponTypes[Phaser.Math.Between(0, weaponTypes.length - 1)];
                break;
            case 'shield':
                texture = 'pickup_shield';
                value = 1;
                break;
            case 'key':
                texture = 'pickup_key';
                value = 1;
                break;
        }

        const pickup = this.pickups.create(x, y, texture);
        pickup.pickupType = type;
        pickup.value = value;
        pickup.lifetime = 15000;
    }

    collectPickup(pickup, player) {
        switch (pickup.pickupType) {
            case 'health':
                this.player.hp = Math.min(this.player.hp + pickup.value, this.player.maxHP);
                break;
            case 'ammo':
                if (this.player.currentWeapon.maxAmmo !== Infinity) {
                    this.player.ammo = Math.min(
                        this.player.ammo + Math.floor(this.player.currentWeapon.maxAmmo * pickup.value),
                        this.player.currentWeapon.maxAmmo
                    );
                }
                break;
            case 'bomb':
                this.player.bombs = Math.min(this.player.bombs + pickup.value, this.player.maxBombs);
                break;
            case 'weapon':
                this.player.currentWeapon = { ...WEAPONS[pickup.value] };
                this.player.ammo = this.player.currentWeapon.maxAmmo;
                // Initialize clip for clip-based weapons
                if (this.player.currentWeapon.clipSize) {
                    this.player.clipAmmo = this.player.currentWeapon.clipSize;
                    this.player.isReloading = false;
                } else {
                    this.player.clipAmmo = undefined;
                }
                this.player.chargeTime = 0;
                // Weapon pickup notification
                const weaponText = this.add.text(this.player.x, this.player.y - 30,
                    'Got ' + this.player.currentWeapon.name + '!', {
                    fontSize: '14px',
                    fontFamily: 'Courier',
                    color: '#00FFFF'
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: weaponText,
                    alpha: 0,
                    y: this.player.y - 60,
                    duration: 1000,
                    onComplete: () => weaponText.destroy()
                });
                break;
            case 'debris':
                this.player.debris += pickup.value;
                break;
            case 'shield':
                this.player.shields++;
                break;
            case 'key':
                this.player.keys = (this.player.keys || 0) + 1;
                break;
        }

        pickup.destroy();
    }

    playerHit(bullet, player) {
        if (this.player.isInvincible) return;

        bullet.destroy();
        this.takeDamage(1);
    }

    playerContactEnemy(enemy, player) {
        if (this.player.isInvincible || this.player.isDashing) return;
        this.takeDamage(1);
    }

    takeDamage(damage) {
        // Shields absorb first
        if (this.player.shields > 0) {
            this.player.shields -= damage;
            if (this.player.shields < 0) {
                this.player.hp += this.player.shields;
                this.player.shields = 0;
            }
        } else {
            this.player.hp -= damage;
        }

        // Multiplier penalty
        this.player.multiplier = Math.max(1.0, this.player.multiplier - MULTIPLIER_CONFIG.lossOnHit);

        // Invincibility frames
        this.player.isInvincible = true;
        this.time.delayedCall(HEALTH_CONFIG.invincibilityTime, () => {
            this.player.isInvincible = false;
        });

        // Flash effect
        this.player.setTint(0xFF0000);
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });

        // Screen shake (scales with damage)
        this.cameras.main.shake(100 + damage * 50, 0.01 + damage * 0.005);

        // Damage indicator on screen edge
        const damageIndicator = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0xFF0000, 0.3
        );
        this.tweens.add({
            targets: damageIndicator,
            alpha: 0,
            duration: 200,
            onComplete: () => damageIndicator.destroy()
        });

        // Check death
        if (this.player.hp <= 0) {
            this.gameState = 'gameover';
            // Death explosion
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 / 20) * i;
                const particle = this.add.circle(
                    this.player.x, this.player.y,
                    6, 0x00FF88
                );
                this.tweens.add({
                    targets: particle,
                    x: this.player.x + Math.cos(angle) * 100,
                    y: this.player.y + Math.sin(angle) * 100,
                    alpha: 0,
                    scale: 0.2,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }
        }
    }

    checkRoomCleared() {
        if (this.enemies.countActive() === 0 && this.gameState === 'playing') {
            this.roomsCleared++;
            this.currentRoom++;

            // Bomb recharge every 3 rooms
            if (this.roomsCleared % 3 === 0) {
                this.player.bombs = Math.min(this.player.bombs + 1, this.player.maxBombs);
            }

            // Show room cleared notification
            const clearedText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ROOM CLEARED!', {
                fontSize: '24px',
                fontFamily: 'Courier',
                color: '#00FF00'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: clearedText,
                alpha: 0,
                y: GAME_HEIGHT / 2 - 50,
                duration: 800,
                onComplete: () => clearedText.destroy()
            });

            if (this.currentRoom > this.totalRooms) {
                // Floor complete
                this.gameState = 'victory';
            } else {
                // Next room after delay
                this.time.delayedCall(1500, () => {
                    if (this.gameState === 'playing') {
                        this.spawnRoom();
                    }
                });
            }
        }
    }

    // ==================== FLOOR MAP GENERATION ====================
    generateFloorMap() {
        const size = 5;
        this.floorMap = [];
        for (let y = 0; y < size; y++) {
            this.floorMap[y] = [];
            for (let x = 0; x < size; x++) {
                this.floorMap[y][x] = { type: null, cleared: false, visited: false };
            }
        }

        // Place start room at bottom center
        this.playerRoomX = Math.floor(size / 2);
        this.playerRoomY = size - 1;
        this.floorMap[this.playerRoomY][this.playerRoomX] = { type: 'START', cleared: true, visited: true };

        // Generate path to boss
        let currentX = this.playerRoomX;
        let currentY = this.playerRoomY;

        while (currentY > 0) {
            // Move up or sideways
            const moves = [];
            if (currentY > 0) moves.push({ dx: 0, dy: -1 });
            if (currentX > 0 && !this.floorMap[currentY][currentX - 1].type) moves.push({ dx: -1, dy: 0 });
            if (currentX < size - 1 && !this.floorMap[currentY][currentX + 1].type) moves.push({ dx: 1, dy: 0 });

            const move = moves[Math.floor(Math.random() * moves.length)];
            currentX += move.dx;
            currentY += move.dy;

            if (currentY === 0) {
                this.floorMap[currentY][currentX] = { type: 'BOSS', cleared: false, visited: false };
            } else {
                this.floorMap[currentY][currentX] = { type: 'NORMAL', cleared: false, visited: false };
            }
        }

        // Add special rooms
        const emptySpots = [];
        for (let y = 1; y < size - 1; y++) {
            for (let x = 0; x < size; x++) {
                if (!this.floorMap[y][x].type) {
                    // Check if adjacent to path
                    const hasNeighbor =
                        (y > 0 && this.floorMap[y - 1][x].type) ||
                        (y < size - 1 && this.floorMap[y + 1][x].type) ||
                        (x > 0 && this.floorMap[y][x - 1].type) ||
                        (x < size - 1 && this.floorMap[y][x + 1].type);
                    if (hasNeighbor) {
                        emptySpots.push({ x, y });
                    }
                }
            }
        }

        // Shuffle and place special rooms
        for (let i = emptySpots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [emptySpots[i], emptySpots[j]] = [emptySpots[j], emptySpots[i]];
        }

        if (emptySpots.length > 0) {
            this.floorMap[emptySpots[0].y][emptySpots[0].x] = { type: 'SHOP', cleared: true, visited: false };
        }
        if (emptySpots.length > 1) {
            this.floorMap[emptySpots[1].y][emptySpots[1].x] = { type: 'UPGRADE', cleared: true, visited: false };
        }
        if (emptySpots.length > 2) {
            this.floorMap[emptySpots[2].y][emptySpots[2].x] = { type: 'TREASURE', cleared: true, visited: false };
        }
    }

    // ==================== SHOP SYSTEM ====================
    openShop() {
        this.inShop = true;
        this.shopMenuIndex = 0;
        this.physics.pause();

        // Generate shop items
        const itemKeys = Object.keys(SHOP_ITEMS);
        this.availableShopItems = [];
        for (let i = 0; i < 4; i++) {
            const key = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            const item = { ...SHOP_ITEMS[key], key };
            // Apply discount if player has it
            if (this.playerUpgrades.includes('discount')) {
                item.price = Math.floor(item.price * 0.66);
            }
            this.availableShopItems.push(item);
        }
    }

    closeShop() {
        this.inShop = false;
        this.physics.resume();
        if (this.shopOverlay) {
            this.shopOverlay.destroy();
            this.shopOverlay = null;
        }
    }

    purchaseShopItem() {
        const item = this.availableShopItems[this.shopMenuIndex];
        if (!item || this.player.debris < item.price) return;

        this.player.debris -= item.price;

        switch (item.effect) {
            case 'hp':
                this.player.hp = Math.min(this.player.hp + item.value, this.player.maxHP);
                break;
            case 'maxHp':
                this.player.maxHP += item.value;
                this.player.hp += item.value;
                break;
            case 'shield':
                this.player.shields += item.value;
                break;
            case 'ammo':
                if (this.player.currentWeapon.maxAmmo !== Infinity) {
                    this.player.ammo = Math.min(
                        this.player.ammo + Math.floor(this.player.currentWeapon.maxAmmo * item.value),
                        this.player.currentWeapon.maxAmmo
                    );
                }
                break;
            case 'bomb':
                this.player.bombs = Math.min(this.player.bombs + item.value, this.player.maxBombs);
                break;
            case 'damage':
                this.player.damageBonus += item.value;
                break;
        }

        // Remove purchased item
        this.availableShopItems.splice(this.shopMenuIndex, 1);
        this.shopMenuIndex = Math.min(this.shopMenuIndex, this.availableShopItems.length - 1);

        if (this.availableShopItems.length === 0) {
            this.closeShop();
        }
    }

    renderShop() {
        if (!this.shopOverlay) {
            this.shopOverlay = this.add.container(0, 0);
        } else {
            this.shopOverlay.removeAll(true);
        }

        // Background
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 350, 0x000000, 0.9);
        bg.setStrokeStyle(2, 0x00FFFF);
        this.shopOverlay.add(bg);

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 150, 'SHOP', {
            fontSize: '32px', fontFamily: 'Courier', color: '#00FFFF'
        }).setOrigin(0.5);
        this.shopOverlay.add(title);

        // Player debris
        const debrisText = this.add.text(GAME_WIDTH / 2, 185, 'Debris: $' + this.player.debris, {
            fontSize: '16px', fontFamily: 'Courier', color: '#FFFF00'
        }).setOrigin(0.5);
        this.shopOverlay.add(debrisText);

        // Items
        this.availableShopItems.forEach((item, i) => {
            const y = 230 + i * 50;
            const selected = i === this.shopMenuIndex;
            const affordable = this.player.debris >= item.price;

            const itemText = this.add.text(GAME_WIDTH / 2, y,
                `${selected ? '>' : ' '} ${item.name} - $${item.price}`, {
                fontSize: '18px',
                fontFamily: 'Courier',
                color: selected ? (affordable ? '#00FF00' : '#FF0000') : '#AAAAAA'
            }).setOrigin(0.5);
            this.shopOverlay.add(itemText);
        });

        // Instructions
        const inst = this.add.text(GAME_WIDTH / 2, 450, 'W/S: Navigate | ENTER: Buy | ESC: Exit', {
            fontSize: '12px', fontFamily: 'Courier', color: '#888888'
        }).setOrigin(0.5);
        this.shopOverlay.add(inst);
    }

    // ==================== UPGRADE SYSTEM ====================
    openUpgrade() {
        this.inUpgrade = true;
        this.upgradeMenuIndex = 0;
        this.physics.pause();

        // Generate 3 random upgrades not already owned
        const availableKeys = Object.keys(UPGRADES).filter(k => !this.playerUpgrades.includes(k.toLowerCase()));
        this.availableUpgrades = [];
        for (let i = 0; i < Math.min(3, availableKeys.length); i++) {
            const idx = Math.floor(Math.random() * availableKeys.length);
            const key = availableKeys.splice(idx, 1)[0];
            this.availableUpgrades.push({ ...UPGRADES[key], key });
        }
    }

    closeUpgrade() {
        this.inUpgrade = false;
        this.physics.resume();
        if (this.upgradeOverlay) {
            this.upgradeOverlay.destroy();
            this.upgradeOverlay = null;
        }
    }

    selectUpgrade() {
        const upgrade = this.availableUpgrades[this.upgradeMenuIndex];
        if (!upgrade) return;

        this.playerUpgrades.push(upgrade.effect);

        // Apply upgrade effects
        switch (upgrade.effect) {
            case 'reserves':
                this.player.damageBonus += 0.1;
                break;
            case 'autobomb':
                this.player.hasAutobomb = true;
                break;
            case 'blink':
                this.player.hasBlink = true;
                break;
            case 'discount':
                // Applied when shopping
                break;
            case 'fortune':
                this.player.hasFortune = true;
                break;
            case 'artifact':
                // Give powerful weapon
                this.player.currentWeapon = { ...WEAPONS.RAILGUN };
                this.player.ammo = this.player.currentWeapon.maxAmmo * 2;
                break;
        }

        this.closeUpgrade();
        // Mark room as used
        this.floorMap[this.playerRoomY][this.playerRoomX].cleared = true;
        this.currentRoomType = null;
    }

    renderUpgrade() {
        if (!this.upgradeOverlay) {
            this.upgradeOverlay = this.add.container(0, 0);
        } else {
            this.upgradeOverlay.removeAll(true);
        }

        // Background
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 450, 350, 0x000000, 0.9);
        bg.setStrokeStyle(2, 0xFF00FF);
        this.upgradeOverlay.add(bg);

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 150, 'CHOOSE UPGRADE', {
            fontSize: '28px', fontFamily: 'Courier', color: '#FF00FF'
        }).setOrigin(0.5);
        this.upgradeOverlay.add(title);

        // Upgrades
        this.availableUpgrades.forEach((upgrade, i) => {
            const y = 220 + i * 70;
            const selected = i === this.upgradeMenuIndex;

            const nameText = this.add.text(GAME_WIDTH / 2, y, `${selected ? '>' : ' '} ${upgrade.name}`, {
                fontSize: '20px', fontFamily: 'Courier', color: selected ? '#00FF00' : '#AAAAAA'
            }).setOrigin(0.5);
            this.upgradeOverlay.add(nameText);

            const descText = this.add.text(GAME_WIDTH / 2, y + 22, upgrade.description, {
                fontSize: '14px', fontFamily: 'Courier', color: '#888888'
            }).setOrigin(0.5);
            this.upgradeOverlay.add(descText);
        });

        // Instructions
        const inst = this.add.text(GAME_WIDTH / 2, 450, 'W/S: Navigate | ENTER: Select | ESC: Exit', {
            fontSize: '12px', fontFamily: 'Courier', color: '#888888'
        }).setOrigin(0.5);
        this.upgradeOverlay.add(inst);
    }

    // ==================== MINIMAP ====================
    renderMinimap() {
        const mapX = GAME_WIDTH - 80;
        const mapY = 100;
        const cellSize = 12;

        for (let y = 0; y < this.floorMap.length; y++) {
            for (let x = 0; x < this.floorMap[y].length; x++) {
                const room = this.floorMap[y][x];
                if (!room.type) continue;

                const rx = mapX + x * cellSize;
                const ry = mapY + y * cellSize;

                let color = 0x333333;
                if (room.visited) {
                    switch (room.type) {
                        case 'START': color = 0x00FF00; break;
                        case 'BOSS': color = 0xFF0000; break;
                        case 'SHOP': color = 0x00FFFF; break;
                        case 'UPGRADE': color = 0xFF00FF; break;
                        case 'TREASURE': color = 0xFFFF00; break;
                        default: color = room.cleared ? 0x666666 : 0x444488;
                    }
                }

                const cell = this.add.rectangle(rx, ry, cellSize - 2, cellSize - 2, color);
                this.hudContainer.add(cell);

                // Player position
                if (x === this.playerRoomX && y === this.playerRoomY) {
                    const playerDot = this.add.circle(rx, ry, 3, 0xFFFFFF);
                    this.hudContainer.add(playerDot);
                }
            }
        }
    }

    renderMenu() {
        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a12).setDepth(-1);

        // Title
        if (!this.menuText) {
            this.menuText = this.add.text(GAME_WIDTH / 2, 150, 'STAR OF PROVIDENCE', {
                fontSize: '40px',
                fontFamily: 'Courier',
                color: '#00FF88'
            }).setOrigin(0.5);

            this.menuSubtext = this.add.text(GAME_WIDTH / 2, 220, 'Bullet Hell Roguelike', {
                fontSize: '20px',
                fontFamily: 'Courier',
                color: '#AAAAAA'
            }).setOrigin(0.5);

            this.menuControls = this.add.text(GAME_WIDTH / 2, 350, [
                'CONTROLS:',
                '',
                'Arrow Keys / WASD - Move',
                'SHIFT - Focus (slow movement)',
                'SPACE - Fire',
                'Z - Dash (invincible)',
                'X - Bomb (clears bullets)',
                '',
                'Press SPACE to Start'
            ], {
                fontSize: '14px',
                fontFamily: 'Courier',
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5);
        }
    }

    renderGameOver() {
        if (!this.gameOverText) {
            this.gameOverText = this.add.text(GAME_WIDTH / 2, 200, 'GAME OVER', {
                fontSize: '48px',
                fontFamily: 'Courier',
                color: '#FF0000'
            }).setOrigin(0.5);

            this.gameOverStats = this.add.text(GAME_WIDTH / 2, 320, '', {
                fontSize: '16px',
                fontFamily: 'Courier',
                color: '#FFFFFF',
                align: 'center'
            }).setOrigin(0.5);
        }
        this.gameOverStats.setText([
            'FINAL SCORE: ' + this.player.score.toLocaleString(),
            '',
            'Floor: ' + this.currentFloor,
            'Rooms Cleared: ' + this.roomsCleared,
            'Enemies Killed: ' + this.player.enemiesKilled,
            'Bosses Defeated: ' + this.player.bossesKilled,
            'Debris Collected: ' + this.player.debris,
            '',
            'Press SPACE to Restart'
        ]);
    }

    renderPause() {
        if (!this.pauseOverlay) {
            this.pauseOverlay = this.add.container(0, 0);

            // Semi-transparent background
            const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
            this.pauseOverlay.add(bg);

            const pauseText = this.add.text(GAME_WIDTH / 2, 200, 'PAUSED', {
                fontSize: '48px',
                fontFamily: 'Courier',
                color: '#FFFFFF'
            }).setOrigin(0.5);
            this.pauseOverlay.add(pauseText);

            const statsText = this.add.text(GAME_WIDTH / 2, 300, [
                'Floor: ' + this.currentFloor,
                'Room: ' + this.currentRoom + '/' + this.totalRooms,
                'HP: ' + this.player.hp + '/' + this.player.maxHP,
                'Debris: ' + this.player.debris,
                '',
                'Press SPACE or ESC to Resume'
            ], {
                fontSize: '16px',
                fontFamily: 'Courier',
                color: '#AAAAAA',
                align: 'center'
            }).setOrigin(0.5);
            this.pauseOverlay.add(statsText);
        }
    }

    renderVictory() {
        if (!this.victoryText) {
            this.victoryText = this.add.text(GAME_WIDTH / 2, 200, 'FLOOR CLEARED!', {
                fontSize: '40px',
                fontFamily: 'Courier',
                color: '#00FF00'
            }).setOrigin(0.5);

            this.victoryStats = this.add.text(GAME_WIDTH / 2, 300, '', {
                fontSize: '18px',
                fontFamily: 'Courier',
                color: '#FFFFFF',
                align: 'center'
            }).setOrigin(0.5);
        }

        this.victoryStats.setText([
            'Floor ' + this.currentFloor + ' Complete!',
            'Debris: ' + this.player.debris,
            '',
            '+2 HP Bonus!',
            '',
            'Press SPACE for Next Floor'
        ]);

        // Floor clear bonus
        if (!this.bonusApplied) {
            this.bonusApplied = true;
            this.player.maxHP += 2;
            this.player.hp = Math.min(this.player.hp + 2, this.player.maxHP);
        }
    }

    renderHUD() {
        // Clear previous HUD
        if (this.hudContainer) {
            this.hudContainer.destroy();
        }

        this.hudContainer = this.add.container(0, 0);

        // Background bars
        const topBar = this.add.rectangle(GAME_WIDTH / 2, 25, GAME_WIDTH, 50, 0x000000, 0.8);
        const bottomBar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 25, GAME_WIDTH, 50, 0x000000, 0.8);
        this.hudContainer.add([topBar, bottomBar]);

        // HP
        for (let i = 0; i < this.player.maxHP; i++) {
            const heart = this.add.circle(30 + i * 20, 25, 8, i < this.player.hp ? 0xFF0000 : 0x440000);
            this.hudContainer.add(heart);
        }

        // Shields
        for (let i = 0; i < this.player.shields; i++) {
            const shield = this.add.rectangle(30 + this.player.maxHP * 20 + 20 + i * 20, 25, 14, 14, 0x0088FF);
            this.hudContainer.add(shield);
        }

        // Bombs
        const bombText = this.add.text(GAME_WIDTH - 120, 15, 'BOMBS: ' + this.player.bombs, {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: '#FFAA00'
        });
        this.hudContainer.add(bombText);

        // Weapon & Ammo
        let weaponStatus = this.player.currentWeapon.name;
        if (this.player.ammo !== Infinity) {
            weaponStatus += ' [' + this.player.ammo + ']';
        }
        // Show clip status for revolver
        if (this.player.clipAmmo !== undefined) {
            weaponStatus += ' (' + this.player.clipAmmo + '/' + this.player.currentWeapon.clipSize + ')';
        }
        if (this.player.isReloading) {
            weaponStatus += ' RELOADING';
        }
        const weaponText = this.add.text(20, GAME_HEIGHT - 35, weaponStatus, {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: '#00FFFF'
        });
        this.hudContainer.add(weaponText);

        // Charge indicator
        if (this.player.currentWeapon.chargeable && this.player.chargeTime > 0) {
            const chargePercent = this.player.chargeTime / this.player.currentWeapon.maxCharge;
            const chargeBar = this.add.rectangle(
                this.player.x,
                this.player.y - 30,
                40 * chargePercent,
                4,
                0xFF00FF
            );
            this.hudContainer.add(chargeBar);
        }

        // Keys display
        if (this.player.keys > 0) {
            const keyText = this.add.text(GAME_WIDTH - 200, 15, 'KEYS: ' + this.player.keys, {
                fontSize: '14px',
                fontFamily: 'Courier',
                color: '#FFDD00'
            });
            this.hudContainer.add(keyText);
        }

        // Floor & Room with enemy count
        const enemyCount = this.enemies.countActive();
        const floorText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35,
            'Floor ' + this.currentFloor + ' - Room ' + this.currentRoom + '/' + this.totalRooms +
            (enemyCount > 0 ? ' [' + enemyCount + ' enemies]' : ''), {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: enemyCount > 0 ? '#FFAAAA' : '#AAFFAA'
        }).setOrigin(0.5, 0);
        this.hudContainer.add(floorText);

        // Score
        const scoreText = this.add.text(GAME_WIDTH / 2, 15, 'SCORE: ' + this.player.score.toLocaleString(), {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: '#FFFFFF'
        }).setOrigin(0.5, 0);
        this.hudContainer.add(scoreText);

        // Debris & Multiplier
        const debrisText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 35,
            'x' + this.player.multiplier.toFixed(2) + '  $' + this.player.debris, {
            fontSize: '14px',
            fontFamily: 'Courier',
            color: '#FFFF00'
        }).setOrigin(1, 0);
        this.hudContainer.add(debrisText);

        // Room bounds visualization with floor theme
        const theme = FLOOR_THEMES[Math.min(this.currentFloor, 6)] || FLOOR_THEMES[1];
        const roomBorder = this.add.rectangle(
            GAME_WIDTH / 2,
            (this.roomBounds.top + this.roomBounds.bottom) / 2,
            ROOM_WIDTH,
            ROOM_HEIGHT,
            0x000000, 0
        ).setStrokeStyle(2, theme.borderColor);
        this.hudContainer.add(roomBorder);

        // Invincibility indicator
        if (this.player.isInvincible) {
            const blink = Math.floor(this.time.now / 100) % 2;
            if (blink) {
                this.player.setAlpha(0.5);
            } else {
                this.player.setAlpha(1);
            }
        } else {
            this.player.setAlpha(1);
        }

        // Focus indicator
        if (this.keys.focus.isDown) {
            const focusIndicator = this.add.circle(this.player.x, this.player.y, SHIP_CONFIG.hitboxRadius, 0xFFFFFF, 0.8);
            this.hudContainer.add(focusIndicator);
        }

        // Boss HP bar
        this.enemies.children.iterate(enemy => {
            if (enemy && enemy.isBoss) {
                const bossData = BOSSES[enemy.bossType];
                const hpPercent = enemy.hp / enemy.maxHP;

                // Boss name
                const bossName = this.add.text(GAME_WIDTH / 2, 55, bossData?.name || 'BOSS', {
                    fontSize: '16px',
                    fontFamily: 'Courier',
                    color: '#FF00FF'
                }).setOrigin(0.5);
                this.hudContainer.add(bossName);

                // HP bar background
                const barBg = this.add.rectangle(GAME_WIDTH / 2, 75, 300, 12, 0x440044);
                this.hudContainer.add(barBg);

                // HP bar fill
                const barFill = this.add.rectangle(
                    GAME_WIDTH / 2 - 150 + (150 * hpPercent),
                    75,
                    300 * hpPercent,
                    10,
                    hpPercent > 0.5 ? 0xFF00FF : (hpPercent > 0.25 ? 0xFF8800 : 0xFF0000)
                );
                this.hudContainer.add(barFill);

                // Phase indicator
                const phaseText = this.add.text(GAME_WIDTH / 2 + 160, 75, 'P' + (enemy.phase + 1), {
                    fontSize: '12px',
                    fontFamily: 'Courier',
                    color: '#FFFFFF'
                }).setOrigin(0, 0.5);
                this.hudContainer.add(phaseText);
            }
        });

        // Dash cooldown indicator
        if (this.player.dashCooldown > 0) {
            const cooldownPercent = this.player.dashCooldown / SHIP_CONFIG.dashCooldown;
            const cooldownBar = this.add.rectangle(
                this.player.x,
                this.player.y + 20,
                20 * (1 - cooldownPercent),
                3,
                0x00FFFF
            );
            this.hudContainer.add(cooldownBar);
        }

        // Minimap
        if (this.floorMap && this.floorMap.length > 0) {
            this.renderMinimap();
        }

        // Room type prompt
        if (this.currentRoomType === 'SHOP') {
            const promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'Press E to enter SHOP', {
                fontSize: '18px', fontFamily: 'Courier', color: '#00FFFF'
            }).setOrigin(0.5);
            this.hudContainer.add(promptText);
        } else if (this.currentRoomType === 'UPGRADE') {
            const promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'Press E to choose UPGRADE', {
                fontSize: '18px', fontFamily: 'Courier', color: '#FF00FF'
            }).setOrigin(0.5);
            this.hudContainer.add(promptText);
        } else if (this.currentRoomType === 'TREASURE') {
            const promptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'TREASURE ROOM!', {
                fontSize: '18px', fontFamily: 'Courier', color: '#FFFF00'
            }).setOrigin(0.5);
            this.hudContainer.add(promptText);
        }

        // Player upgrades display
        if (this.playerUpgrades.length > 0) {
            const upgradeText = this.add.text(20, 60, 'Upgrades: ' + this.playerUpgrades.join(', '), {
                fontSize: '10px', fontFamily: 'Courier', color: '#FF00FF'
            });
            this.hudContainer.add(upgradeText);
        }
    }
}

// ==================== GAME CONFIG ====================
const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: GameScene
};

// Start game
const game = new Phaser.Game(config);
