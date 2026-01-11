// Zero Sievert Clone - Extraction Shooter
// Phaser 3 Implementation

const CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    TILE_SIZE: 32,

    // Player stats
    PLAYER_SPEED: 150,
    SPRINT_MULT: 1.6,
    AIM_SPEED_MULT: 0.5,
    DODGE_DURATION: 300,
    DODGE_COOLDOWN: 1500,

    // Combat
    BULLET_SPEED: 800,

    // Status effects
    BLEEDING_DPS: 2,
    HEAVY_BLEEDING_DPS: 5,
    RADIATION_HP_REDUCTION: 5,

    // Stamina
    STAMINA_MAX: 100,
    STAMINA_DRAIN: 15,
    STAMINA_REGEN: 8
};

// Weapon definitions
const WEAPONS = {
    pm_pistol: {
        name: 'PM Pistol',
        category: 'pistol',
        damage: 18,
        fireRate: 300,
        magSize: 8,
        range: 200,
        spread: 8,
        reloadTime: 1500,
        penetration: 10,
        weight: 0.7
    },
    skorpion: {
        name: 'Skorpion',
        category: 'smg',
        damage: 14,
        fireRate: 100,
        magSize: 20,
        range: 150,
        spread: 12,
        reloadTime: 2000,
        penetration: 5,
        weight: 1.3
    },
    pump_shotgun: {
        name: 'Pump Shotgun',
        category: 'shotgun',
        damage: 8,
        pellets: 8,
        fireRate: 1000,
        magSize: 6,
        range: 100,
        spread: 25,
        reloadTime: 3000,
        penetration: 0,
        weight: 3.2
    },
    ak74: {
        name: 'AK-74',
        category: 'rifle',
        damage: 28,
        fireRate: 130,
        magSize: 30,
        range: 280,
        spread: 6,
        reloadTime: 2500,
        penetration: 40,
        weight: 3.5
    },
    sks: {
        name: 'SKS',
        category: 'dmr',
        damage: 45,
        fireRate: 400,
        magSize: 10,
        range: 350,
        spread: 3,
        reloadTime: 2200,
        penetration: 50,
        weight: 3.8
    }
};

// Enemy definitions
const ENEMIES = {
    bandit_scout: {
        name: 'Bandit Scout',
        hp: 60,
        damage: 12,
        speed: 80,
        range: 180,
        fireRate: 800,
        visionRange: 200,
        visionAngle: 90,
        xp: 10,
        color: 0x8B4513
    },
    bandit: {
        name: 'Bandit',
        hp: 80,
        damage: 15,
        speed: 60,
        range: 150,
        fireRate: 400,
        visionRange: 180,
        visionAngle: 100,
        xp: 15,
        color: 0x654321
    },
    ghoul: {
        name: 'Ghoul',
        hp: 50,
        damage: 12,
        speed: 120,
        range: 30,
        visionRange: 150,
        visionAngle: 120,
        xp: 15,
        melee: true,
        color: 0x556B2F
    },
    wolf: {
        name: 'Wolf',
        hp: 40,
        damage: 15,
        speed: 140,
        range: 25,
        visionRange: 200,
        visionAngle: 90,
        xp: 8,
        melee: true,
        color: 0x696969
    },
    boar: {
        name: 'Boar',
        hp: 80,
        damage: 20,
        speed: 100,
        range: 20,
        visionRange: 120,
        visionAngle: 60,
        xp: 10,
        melee: true,
        charges: true,
        color: 0x8B4513
    }
};

// Loot definitions
const LOOT_TABLES = {
    wooden_box: {
        common: [
            { type: 'bandage', quantity: [1, 3], weight: 40 },
            { type: 'ammo_9mm', quantity: [10, 30], weight: 35 },
            { type: 'rubles', quantity: [50, 200], weight: 25 }
        ],
        uncommon: [
            { type: 'medkit', quantity: [1, 1], weight: 50 },
            { type: 'ammo_762', quantity: [15, 30], weight: 50 }
        ]
    },
    weapon_box: {
        common: [
            { type: 'ammo_9mm', quantity: [20, 50], weight: 40 },
            { type: 'ammo_762', quantity: [20, 40], weight: 40 },
            { type: 'ammo_12ga', quantity: [10, 20], weight: 20 }
        ],
        uncommon: [
            { type: 'weapon_skorpion', quantity: [1, 1], weight: 30 },
            { type: 'weapon_pump_shotgun', quantity: [1, 1], weight: 30 },
            { type: 'repair_kit', quantity: [1, 1], weight: 40 }
        ],
        rare: [
            { type: 'weapon_ak74', quantity: [1, 1], weight: 50 },
            { type: 'weapon_sks', quantity: [1, 1], weight: 50 }
        ]
    },
    medical_box: {
        common: [
            { type: 'bandage', quantity: [2, 4], weight: 50 },
            { type: 'painkillers', quantity: [1, 2], weight: 50 }
        ],
        uncommon: [
            { type: 'medkit', quantity: [1, 2], weight: 60 },
            { type: 'antirad', quantity: [1, 2], weight: 40 }
        ],
        rare: [
            { type: 'surgery_kit', quantity: [1, 1], weight: 100 }
        ]
    }
};

// Items
const ITEMS = {
    bandage: { name: 'Bandage', weight: 0.1, healAmount: 0, curesStatus: ['bleeding'], useTime: 2000 },
    medkit: { name: 'Medkit', weight: 0.3, healAmount: 50, curesStatus: ['bleeding', 'heavy_bleeding'], useTime: 4000 },
    painkillers: { name: 'Painkillers', weight: 0.05, healAmount: 10, curesStatus: ['pain'], useTime: 1000 },
    antirad: { name: 'Anti-Rad Pills', weight: 0.05, healAmount: 0, reducesRadiation: 20, useTime: 1500 },
    surgery_kit: { name: 'Surgery Kit', weight: 0.5, healAmount: 0, curesStatus: ['fracture', 'heavy_bleeding'], useTime: 8000 },
    repair_kit: { name: 'Repair Kit', weight: 0.5, repairs: 30 },
    ration: { name: 'Ration', weight: 0.3, reducesHunger: 40, useTime: 3000 },
    ammo_9mm: { name: '9mm Ammo', weight: 0.01 },
    ammo_762: { name: '7.62 Ammo', weight: 0.02 },
    ammo_12ga: { name: '12ga Shells', weight: 0.03 },
    rubles: { name: 'Rubles', weight: 0 }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate textures
        this.generateTextures();
        this.scene.start('MenuScene');
    }

    generateTextures() {
        const g = this.make.graphics({ add: false });

        // Player texture
        g.clear();
        g.fillStyle(0x4169E1);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x6495ED);
        g.fillCircle(16, 14, 8);
        // Direction indicator
        g.fillStyle(0xFFFFFF);
        g.fillRect(16, 4, 4, 12);
        g.generateTexture('player', 32, 32);

        // Enemy textures
        Object.entries(ENEMIES).forEach(([key, enemy]) => {
            g.clear();
            g.fillStyle(enemy.color);
            g.fillCircle(16, 16, 12);
            if (enemy.melee) {
                g.fillStyle(0xFF0000);
                g.fillRect(22, 10, 6, 12);
            }
            g.generateTexture(`enemy_${key}`, 32, 32);
        });

        // Bullet
        g.clear();
        g.fillStyle(0xFFFF00);
        g.fillCircle(4, 4, 3);
        g.generateTexture('bullet', 8, 8);

        // Enemy bullet
        g.clear();
        g.fillStyle(0xFF4444);
        g.fillCircle(4, 4, 3);
        g.generateTexture('enemy_bullet', 8, 8);

        // Loot container textures
        g.clear();
        g.fillStyle(0x8B4513);
        g.fillRect(0, 0, 24, 20);
        g.fillStyle(0xDEB887);
        g.fillRect(2, 2, 20, 16);
        g.generateTexture('wooden_box', 24, 20);

        g.clear();
        g.fillStyle(0x2F4F4F);
        g.fillRect(0, 0, 28, 22);
        g.fillStyle(0x708090);
        g.fillRect(2, 2, 24, 18);
        g.fillStyle(0xFF0000);
        g.fillRect(10, 8, 8, 6);
        g.generateTexture('weapon_box', 28, 22);

        g.clear();
        g.fillStyle(0xFFFFFF);
        g.fillRect(0, 0, 24, 18);
        g.fillStyle(0xFF0000);
        g.fillRect(10, 2, 4, 14);
        g.fillRect(5, 6, 14, 4);
        g.generateTexture('medical_box', 24, 18);

        // Extraction zone
        g.clear();
        g.lineStyle(3, 0x00FF00, 0.8);
        g.strokeCircle(40, 40, 36);
        g.lineStyle(2, 0x00FF00, 0.4);
        g.strokeCircle(40, 40, 28);
        g.generateTexture('extraction', 80, 80);

        // Tiles
        // Ground
        g.clear();
        g.fillStyle(0x3D5C3D);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x4A6B4A);
        for (let i = 0; i < 5; i++) {
            g.fillRect(Math.random() * 28, Math.random() * 28, 4, 4);
        }
        g.generateTexture('grass', 32, 32);

        // Dirt
        g.clear();
        g.fillStyle(0x5C4033);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x6B4E3D);
        for (let i = 0; i < 4; i++) {
            g.fillRect(Math.random() * 28, Math.random() * 28, 5, 3);
        }
        g.generateTexture('dirt', 32, 32);

        // Wall
        g.clear();
        g.fillStyle(0x505050);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x404040);
        g.fillRect(0, 0, 32, 4);
        g.fillRect(0, 28, 32, 4);
        g.generateTexture('wall', 32, 32);

        // Building floor
        g.clear();
        g.fillStyle(0x606060);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x505050);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);

        // Tree
        g.clear();
        g.fillStyle(0x228B22);
        g.fillCircle(16, 12, 14);
        g.fillStyle(0x1E7B1E);
        g.fillCircle(12, 10, 8);
        g.fillCircle(20, 14, 8);
        g.fillStyle(0x8B4513);
        g.fillRect(13, 22, 6, 10);
        g.generateTexture('tree', 32, 32);

        // Rock
        g.clear();
        g.fillStyle(0x696969);
        g.fillCircle(16, 18, 12);
        g.fillStyle(0x808080);
        g.fillCircle(14, 16, 6);
        g.generateTexture('rock', 32, 32);

        // Radiation zone
        g.clear();
        g.fillStyle(0x7CFC00, 0.3);
        g.fillCircle(24, 24, 24);
        g.fillStyle(0xFFFF00);
        g.fillTriangle(24, 8, 16, 28, 32, 28);
        g.fillStyle(0x000000);
        g.fillCircle(24, 20, 4);
        g.generateTexture('radiation', 48, 48);

        // Crosshair
        g.clear();
        g.lineStyle(2, 0xFF0000);
        g.moveTo(0, 12);
        g.lineTo(8, 12);
        g.moveTo(16, 12);
        g.lineTo(24, 12);
        g.moveTo(12, 0);
        g.lineTo(12, 8);
        g.moveTo(12, 16);
        g.lineTo(12, 24);
        g.strokeCircle(12, 12, 6);
        g.generateTexture('crosshair', 24, 24);

        // Muzzle flash
        g.clear();
        g.fillStyle(0xFFFF00);
        g.fillCircle(8, 8, 6);
        g.fillStyle(0xFFAA00);
        g.fillCircle(8, 8, 4);
        g.generateTexture('muzzle_flash', 16, 16);

        g.destroy();
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');

        // Title
        this.add.text(400, 100, 'ZERO SIEVERT', {
            fontSize: '48px',
            fontFamily: 'Courier New',
            color: '#00FF00',
            stroke: '#004400',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(400, 150, 'CLONE', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#888888'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(400, 200, 'Extraction Shooter', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#666666'
        }).setOrigin(0.5);

        // Menu options
        const startBtn = this.add.text(400, 320, '[ NEW RAID ]', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00AA00'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#00FF00'));
        startBtn.on('pointerout', () => startBtn.setColor('#00AA00'));
        startBtn.on('pointerdown', () => {
            this.scene.start('LoadoutScene');
        });

        // Controls
        this.add.text(400, 420, 'CONTROLS', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#888888'
        }).setOrigin(0.5);

        const controls = [
            'WASD - Move    |    SHIFT - Sprint',
            'Mouse - Aim    |    LMB - Shoot',
            'R - Reload     |    SPACE - Dodge',
            'E - Interact   |    TAB - Inventory',
            '1-4 - Quick Use Items'
        ];

        controls.forEach((line, i) => {
            this.add.text(400, 450 + i * 22, line, {
                fontSize: '12px',
                fontFamily: 'Courier New',
                color: '#555555'
            }).setOrigin(0.5);
        });

        // Load save data
        this.loadGame();
    }

    loadGame() {
        const saved = localStorage.getItem('zeroSievertClone');
        if (saved) {
            this.registry.set('saveData', JSON.parse(saved));
        } else {
            this.registry.set('saveData', this.getDefaultSave());
        }
    }

    getDefaultSave() {
        return {
            player: {
                level: 1,
                xp: 0,
                rubles: 5000,
                maxHp: 100,
                perks: []
            },
            stash: [
                { type: 'weapon_pm_pistol', quantity: 1 },
                { type: 'ammo_9mm', quantity: 50 },
                { type: 'bandage', quantity: 5 },
                { type: 'medkit', quantity: 2 }
            ],
            statistics: {
                raidsCompleted: 0,
                raidsTotal: 0,
                enemiesKilled: 0,
                lootValue: 0
            },
            zonesUnlocked: ['forest']
        };
    }
}

class LoadoutScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadoutScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');
        const saveData = this.registry.get('saveData');

        // Title
        this.add.text(400, 40, 'PREPARE FOR RAID', {
            fontSize: '32px',
            fontFamily: 'Courier New',
            color: '#00FF00'
        }).setOrigin(0.5);

        // Player info
        this.add.text(50, 80, `Rubles: ${saveData.player.rubles}`, {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#FFD700'
        });

        this.add.text(50, 100, `Level: ${saveData.player.level}`, {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#888888'
        });

        // Stash
        this.add.text(50, 140, 'STASH:', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00AA00'
        });

        // Selected loadout
        this.loadout = {
            primaryWeapon: 'pm_pistol',
            ammo: { '9mm': 50 },
            items: ['bandage', 'bandage', 'medkit']
        };

        // Display stash items
        let y = 170;
        saveData.stash.forEach((item, i) => {
            const itemName = item.type.replace('weapon_', '').replace('ammo_', '');
            this.add.text(60, y, `${itemName} x${item.quantity}`, {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#888888'
            });
            y += 20;
        });

        // Current loadout display
        this.add.text(450, 140, 'LOADOUT:', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00AA00'
        });

        const weapon = WEAPONS[this.loadout.primaryWeapon];
        this.add.text(460, 170, `Weapon: ${weapon.name}`, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#888888'
        });

        this.add.text(460, 190, `Ammo: 9mm x50`, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#888888'
        });

        this.add.text(460, 210, `Items: Bandage x2, Medkit x1`, {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#888888'
        });

        // Zone selection
        this.add.text(400, 320, 'SELECT ZONE:', {
            fontSize: '18px',
            fontFamily: 'Courier New',
            color: '#00FF00'
        }).setOrigin(0.5);

        const forestBtn = this.add.text(400, 360, '[ FOREST - Easy ]', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#00AA00'
        }).setOrigin(0.5).setInteractive();

        forestBtn.on('pointerover', () => forestBtn.setColor('#00FF00'));
        forestBtn.on('pointerout', () => forestBtn.setColor('#00AA00'));
        forestBtn.on('pointerdown', () => {
            this.startRaid('forest');
        });

        // Deploy button
        const deployBtn = this.add.text(400, 500, '>>> DEPLOY <<<', {
            fontSize: '28px',
            fontFamily: 'Courier New',
            color: '#00FF00'
        }).setOrigin(0.5).setInteractive();

        deployBtn.on('pointerover', () => deployBtn.setColor('#FFFFFF'));
        deployBtn.on('pointerout', () => deployBtn.setColor('#00FF00'));
        deployBtn.on('pointerdown', () => {
            this.startRaid('forest');
        });

        // Back button
        const backBtn = this.add.text(50, 550, '< Back', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#666666'
        }).setInteractive();

        backBtn.on('pointerover', () => backBtn.setColor('#888888'));
        backBtn.on('pointerout', () => backBtn.setColor('#666666'));
        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    startRaid(zone) {
        this.registry.set('currentZone', zone);
        this.registry.set('loadout', this.loadout);
        this.scene.start('GameScene');
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Zone size
        this.zoneWidth = 1600;
        this.zoneHeight = 1600;

        // Set world bounds
        this.physics.world.setBounds(0, 0, this.zoneWidth, this.zoneHeight);

        // Camera setup
        this.cameras.main.setBounds(0, 0, this.zoneWidth, this.zoneHeight);

        // Generate zone
        this.generateZone();

        // Create player
        this.createPlayer();

        // Create enemies
        this.enemies = this.physics.add.group();
        this.spawnEnemies();

        // Bullets
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // Create extraction zones
        this.createExtractionZones();

        // Create loot containers
        this.createLootContainers();

        // Create radiation zones
        this.createRadiationZones();

        // Setup collisions
        this.setupCollisions();

        // Create HUD
        this.createHUD();

        // Input
        this.setupInput();

        // Crosshair
        this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(100);

        // Game state
        this.raidTime = 0;
        this.isExtracting = false;
        this.extractionTimer = 0;
        this.extractionDuration = 5000;
        this.isPaused = false;
        this.inventory = [];
        this.inventoryOpen = false;

        // Status effects
        this.statusEffects = {
            bleeding: false,
            heavyBleeding: false,
            radiation: 0,
            pain: false
        };

        // Start raid timer
        this.raidStartTime = Date.now();

        // Particle emitter for blood
        this.bloodParticles = [];

        // Screen flash for damage
        this.damageOverlay = this.add.rectangle(400, 300, 800, 600, 0xFF0000, 0)
            .setScrollFactor(0)
            .setDepth(90);

        // Update save data
        const saveData = this.registry.get('saveData');
        saveData.statistics.raidsTotal++;
        this.registry.set('saveData', saveData);
    }

    generateZone() {
        // Create tile layer
        this.groundTiles = this.add.group();
        this.walls = this.physics.add.staticGroup();
        this.obstacles = this.physics.add.staticGroup();

        // Fill with grass
        for (let x = 0; x < this.zoneWidth; x += 32) {
            for (let y = 0; y < this.zoneHeight; y += 32) {
                const tile = this.add.image(x + 16, y + 16,
                    Math.random() > 0.3 ? 'grass' : 'dirt');
                this.groundTiles.add(tile);
            }
        }

        // Generate buildings
        this.generateBuildings();

        // Generate trees and rocks
        this.generateNature();

        // Create boundary walls
        for (let x = 0; x < this.zoneWidth; x += 32) {
            this.walls.create(x + 16, 16, 'wall');
            this.walls.create(x + 16, this.zoneHeight - 16, 'wall');
        }
        for (let y = 32; y < this.zoneHeight - 32; y += 32) {
            this.walls.create(16, y + 16, 'wall');
            this.walls.create(this.zoneWidth - 16, y + 16, 'wall');
        }
    }

    generateBuildings() {
        // Generate 3-5 buildings
        const buildingCount = Phaser.Math.Between(3, 5);
        const buildings = [];

        for (let i = 0; i < buildingCount; i++) {
            let attempts = 0;
            let placed = false;

            while (!placed && attempts < 50) {
                const width = Phaser.Math.Between(4, 8) * 32;
                const height = Phaser.Math.Between(4, 6) * 32;
                const x = Phaser.Math.Between(100, this.zoneWidth - width - 100);
                const y = Phaser.Math.Between(100, this.zoneHeight - height - 100);

                // Check overlap
                let overlaps = false;
                for (const b of buildings) {
                    if (Phaser.Geom.Rectangle.Overlaps(
                        new Phaser.Geom.Rectangle(x - 50, y - 50, width + 100, height + 100),
                        b
                    )) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    this.createBuilding(x, y, width, height);
                    buildings.push(new Phaser.Geom.Rectangle(x, y, width, height));
                    placed = true;
                }

                attempts++;
            }
        }

        this.buildings = buildings;
    }

    createBuilding(x, y, width, height) {
        // Floor
        for (let fx = x; fx < x + width; fx += 32) {
            for (let fy = y; fy < y + height; fy += 32) {
                this.add.image(fx + 16, fy + 16, 'floor');
            }
        }

        // Walls
        const doorSide = Phaser.Math.Between(0, 3);
        const doorPos = Phaser.Math.Between(1, 2);

        for (let wx = x; wx < x + width; wx += 32) {
            // Top wall
            if (doorSide !== 0 || (wx - x) / 32 !== doorPos) {
                this.walls.create(wx + 16, y + 16, 'wall');
            }
            // Bottom wall
            if (doorSide !== 2 || (wx - x) / 32 !== doorPos) {
                this.walls.create(wx + 16, y + height - 16, 'wall');
            }
        }

        for (let wy = y + 32; wy < y + height - 32; wy += 32) {
            // Left wall
            if (doorSide !== 3 || (wy - y) / 32 !== doorPos) {
                this.walls.create(x + 16, wy + 16, 'wall');
            }
            // Right wall
            if (doorSide !== 1 || (wy - y) / 32 !== doorPos) {
                this.walls.create(x + width - 16, wy + 16, 'wall');
            }
        }
    }

    generateNature() {
        // Trees
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(50, this.zoneWidth - 50);
            const y = Phaser.Math.Between(50, this.zoneHeight - 50);

            if (!this.isInsideBuilding(x, y)) {
                const tree = this.obstacles.create(x, y, 'tree');
                tree.setCircle(10, 6, 12);
            }
        }

        // Rocks
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(50, this.zoneWidth - 50);
            const y = Phaser.Math.Between(50, this.zoneHeight - 50);

            if (!this.isInsideBuilding(x, y)) {
                const rock = this.obstacles.create(x, y, 'rock');
                rock.setCircle(10, 6, 8);
            }
        }
    }

    isInsideBuilding(x, y) {
        if (!this.buildings) return false;
        for (const b of this.buildings) {
            if (b.contains(x, y)) return true;
        }
        return false;
    }

    createPlayer() {
        const loadout = this.registry.get('loadout');
        const saveData = this.registry.get('saveData');

        // Spawn at edge
        const spawnX = 100;
        const spawnY = Phaser.Math.Between(200, this.zoneHeight - 200);

        this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.setCircle(12, 4, 4);

        // Player stats
        this.player.maxHp = saveData.player.maxHp;
        this.player.hp = this.player.maxHp;
        this.player.stamina = CONFIG.STAMINA_MAX;
        this.player.maxStamina = CONFIG.STAMINA_MAX;

        // Weapon
        this.player.weapon = { ...WEAPONS[loadout.primaryWeapon] };
        this.player.weapon.currentAmmo = this.player.weapon.magSize;
        this.player.weapon.reserveAmmo = loadout.ammo['9mm'] || 50;

        // Inventory
        this.player.inventory = loadout.items.map(item => ({ type: item, quantity: 1 }));

        // Combat state
        this.player.lastShot = 0;
        this.player.isReloading = false;
        this.player.reloadStartTime = 0;
        this.player.iframes = 0;
        this.player.dodgeCooldown = 0;
        this.player.isDodging = false;
        this.player.dodgeTime = 0;
        this.player.dodgeDir = { x: 0, y: 0 };

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);
    }

    spawnEnemies() {
        // Spawn bandits
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(200, this.zoneWidth - 200);
            const y = Phaser.Math.Between(200, this.zoneHeight - 200);

            if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 300) {
                const type = Math.random() > 0.5 ? 'bandit' : 'bandit_scout';
                this.spawnEnemy(x, y, type);
            }
        }

        // Spawn ghouls
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(200, this.zoneWidth - 200);
            const y = Phaser.Math.Between(200, this.zoneHeight - 200);

            if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 300) {
                this.spawnEnemy(x, y, 'ghoul');
            }
        }

        // Spawn wildlife
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(100, this.zoneWidth - 100);
            const y = Phaser.Math.Between(100, this.zoneHeight - 100);

            if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 400) {
                const type = Math.random() > 0.6 ? 'boar' : 'wolf';
                this.spawnEnemy(x, y, type);
            }
        }
    }

    spawnEnemy(x, y, type) {
        const enemyData = ENEMIES[type];
        const enemy = this.physics.add.sprite(x, y, `enemy_${type}`);

        enemy.setCircle(12, 4, 4);
        enemy.type = type;
        enemy.hp = enemyData.hp;
        enemy.maxHp = enemyData.hp;
        enemy.damage = enemyData.damage;
        enemy.speed = enemyData.speed;
        enemy.range = enemyData.range;
        enemy.visionRange = enemyData.visionRange;
        enemy.visionAngle = enemyData.visionAngle;
        enemy.xp = enemyData.xp;
        enemy.melee = enemyData.melee || false;
        enemy.charges = enemyData.charges || false;
        enemy.fireRate = enemyData.fireRate || 1000;
        enemy.lastShot = 0;
        enemy.lastAttack = 0;

        enemy.state = 'patrol';
        enemy.patrolTarget = this.getRandomPatrolPoint(x, y);
        enemy.alertTimer = 0;
        enemy.angle = Math.random() * Math.PI * 2;
        enemy.isCharging = false;

        this.enemies.add(enemy);
    }

    getRandomPatrolPoint(x, y) {
        return {
            x: x + Phaser.Math.Between(-150, 150),
            y: y + Phaser.Math.Between(-150, 150)
        };
    }

    createExtractionZones() {
        this.extractionZones = this.physics.add.staticGroup();

        // Create 3 extraction points at different edges
        const positions = [
            { x: this.zoneWidth - 80, y: Phaser.Math.Between(200, this.zoneHeight - 200) },
            { x: Phaser.Math.Between(200, this.zoneWidth - 200), y: this.zoneHeight - 80 },
            { x: Phaser.Math.Between(200, this.zoneWidth - 200), y: 80 }
        ];

        positions.forEach((pos, i) => {
            const zone = this.extractionZones.create(pos.x, pos.y, 'extraction');
            zone.setCircle(36, 4, 4);
            zone.extractionId = i;
        });
    }

    createLootContainers() {
        this.lootContainers = this.physics.add.staticGroup();

        // Wooden boxes scattered around
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(100, this.zoneWidth - 100);
            const y = Phaser.Math.Between(100, this.zoneHeight - 100);

            const container = this.lootContainers.create(x, y, 'wooden_box');
            container.lootType = 'wooden_box';
            container.looted = false;
        }

        // Weapon boxes in buildings
        if (this.buildings) {
            this.buildings.forEach(b => {
                if (Math.random() > 0.5) {
                    const x = b.x + Phaser.Math.Between(40, b.width - 40);
                    const y = b.y + Phaser.Math.Between(40, b.height - 40);
                    const container = this.lootContainers.create(x, y, 'weapon_box');
                    container.lootType = 'weapon_box';
                    container.looted = false;
                }
            });
        }

        // Medical boxes
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(100, this.zoneWidth - 100);
            const y = Phaser.Math.Between(100, this.zoneHeight - 100);

            const container = this.lootContainers.create(x, y, 'medical_box');
            container.lootType = 'medical_box';
            container.looted = false;
        }
    }

    createRadiationZones() {
        this.radiationZones = [];

        for (let i = 0; i < 4; i++) {
            const x = Phaser.Math.Between(200, this.zoneWidth - 200);
            const y = Phaser.Math.Between(200, this.zoneHeight - 200);
            const radius = Phaser.Math.Between(60, 120);

            const zone = this.add.image(x, y, 'radiation');
            zone.setScale(radius / 24);
            zone.setAlpha(0.5);

            this.radiationZones.push({ x, y, radius });
        }
    }

    setupCollisions() {
        // Player collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.obstacles);

        // Enemy collisions
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.obstacles);
        this.physics.add.collider(this.enemies, this.enemies);

        // Bullet collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.collider(this.bullets, this.obstacles, this.bulletHitWall, null, this);

        // Enemy bullet collisions
        this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.collider(this.enemyBullets, this.walls, this.bulletHitWall, null, this);

        // Melee enemy collision with player
        this.physics.add.overlap(this.player, this.enemies, this.enemyMeleePlayer, null, this);

        // Extraction zone
        this.physics.add.overlap(this.player, this.extractionZones, this.inExtractionZone, null, this);
    }

    createHUD() {
        // Health bar background
        this.add.rectangle(120, 30, 204, 24, 0x333333).setScrollFactor(0).setDepth(80);
        // Health bar
        this.healthBar = this.add.rectangle(20, 20, 200, 20, 0x00FF00)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(81);
        // Health text
        this.healthText = this.add.text(120, 30, '', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#FFFFFF'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(82);

        // Stamina bar
        this.add.rectangle(120, 55, 154, 14, 0x333333).setScrollFactor(0).setDepth(80);
        this.staminaBar = this.add.rectangle(45, 50, 150, 10, 0x00AAFF)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(81);

        // Weapon info
        this.weaponText = this.add.text(20, 560, '', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#FFFFFF'
        }).setScrollFactor(0).setDepth(80);

        // Ammo info
        this.ammoText = this.add.text(20, 580, '', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#AAAAAA'
        }).setScrollFactor(0).setDepth(80);

        // Zone/time info
        this.zoneText = this.add.text(780, 20, '', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#888888'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(80);

        // Extraction info
        this.extractionText = this.add.text(400, 100, '', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00FF00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(80).setVisible(false);

        // Status effects
        this.statusText = this.add.text(20, 80, '', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#FF4444'
        }).setScrollFactor(0).setDepth(80);

        // Interaction prompt
        this.interactPrompt = this.add.text(400, 400, '[E] Loot', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#FFFF00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(80).setVisible(false);

        // Minimap
        this.createMinimap();

        // Inventory UI (hidden by default)
        this.createInventoryUI();

        // Kill feed
        this.killFeed = [];
        this.killFeedContainer = this.add.container(780, 80).setScrollFactor(0).setDepth(80);
    }

    createMinimap() {
        const mapSize = 120;
        const mapX = 680;
        const mapY = 480;

        // Background
        this.minimapBg = this.add.rectangle(mapX, mapY, mapSize, mapSize, 0x000000, 0.7)
            .setScrollFactor(0)
            .setDepth(80);

        // Player dot
        this.minimapPlayer = this.add.circle(mapX, mapY, 3, 0x00FF00)
            .setScrollFactor(0)
            .setDepth(82);

        // Enemy dots
        this.minimapEnemies = this.add.group();

        // Extraction dots
        this.minimapExtractions = this.add.group();
        this.extractionZones.getChildren().forEach(zone => {
            const dot = this.add.circle(0, 0, 4, 0x00FF00)
                .setScrollFactor(0)
                .setDepth(81);
            dot.linkedZone = zone;
            this.minimapExtractions.add(dot);
        });

        this.minimapData = { x: mapX, y: mapY, size: mapSize };
    }

    createInventoryUI() {
        this.inventoryContainer = this.add.container(400, 300).setScrollFactor(0).setDepth(100).setVisible(false);

        // Background
        const bg = this.add.rectangle(0, 0, 400, 300, 0x1a1a1a, 0.95);
        this.inventoryContainer.add(bg);

        // Title
        const title = this.add.text(0, -130, 'INVENTORY', {
            fontSize: '20px',
            fontFamily: 'Courier New',
            color: '#00FF00'
        }).setOrigin(0.5);
        this.inventoryContainer.add(title);

        // Close hint
        const closeHint = this.add.text(0, 130, 'Press TAB to close', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#666666'
        }).setOrigin(0.5);
        this.inventoryContainer.add(closeHint);

        this.inventoryItems = [];
    }

    setupInput() {
        // Keyboard
        this.keys = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D'),
            shift: this.input.keyboard.addKey('SHIFT'),
            space: this.input.keyboard.addKey('SPACE'),
            r: this.input.keyboard.addKey('R'),
            e: this.input.keyboard.addKey('E'),
            tab: this.input.keyboard.addKey('TAB'),
            esc: this.input.keyboard.addKey('ESC'),
            one: this.input.keyboard.addKey('ONE'),
            two: this.input.keyboard.addKey('TWO'),
            three: this.input.keyboard.addKey('THREE'),
            four: this.input.keyboard.addKey('FOUR')
        };

        // Mouse
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && !this.inventoryOpen) {
                this.shoot();
            }
        });

        // Tab for inventory
        this.keys.tab.on('down', () => {
            this.toggleInventory();
        });

        // E for interact
        this.keys.e.on('down', () => {
            this.tryInteract();
        });

        // Hide cursor
        this.input.setDefaultCursor('none');
    }

    update(time, delta) {
        if (this.isPaused || this.inventoryOpen) return;

        const dt = delta / 1000;

        // Update raid time
        this.raidTime = Date.now() - this.raidStartTime;

        // Update player
        this.updatePlayer(time, dt);

        // Update enemies
        this.updateEnemies(time, dt);

        // Update crosshair
        this.crosshair.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);

        // Update HUD
        this.updateHUD();

        // Update minimap
        this.updateMinimap();

        // Check extraction
        this.checkExtraction(dt);

        // Update status effects
        this.updateStatusEffects(dt);

        // Check radiation zones
        this.checkRadiation();

        // Check for nearby loot
        this.checkNearbyLoot();

        // Cleanup off-screen bullets
        this.cleanupBullets();
    }

    updatePlayer(time, dt) {
        // Handle dodge
        if (this.player.isDodging) {
            this.player.dodgeTime -= dt * 1000;
            if (this.player.dodgeTime <= 0) {
                this.player.isDodging = false;
                this.player.setAlpha(1);
            } else {
                this.player.setVelocity(
                    this.player.dodgeDir.x * 400,
                    this.player.dodgeDir.y * 400
                );
                this.player.setAlpha(0.5);
                return;
            }
        }

        // Update cooldowns
        if (this.player.dodgeCooldown > 0) {
            this.player.dodgeCooldown -= dt * 1000;
        }
        if (this.player.iframes > 0) {
            this.player.iframes -= dt * 1000;
            this.player.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.5);
        } else {
            this.player.setAlpha(1);
        }

        // Movement
        let vx = 0;
        let vy = 0;

        if (this.keys.w.isDown) vy = -1;
        if (this.keys.s.isDown) vy = 1;
        if (this.keys.a.isDown) vx = -1;
        if (this.keys.d.isDown) vx = 1;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        // Calculate speed
        let speed = CONFIG.PLAYER_SPEED;
        const isSprinting = this.keys.shift.isDown && this.player.stamina > 0;
        const isAiming = this.input.activePointer.rightButtonDown();

        if (isSprinting && (vx !== 0 || vy !== 0)) {
            speed *= CONFIG.SPRINT_MULT;
            this.player.stamina -= CONFIG.STAMINA_DRAIN * dt;
        } else if (isAiming) {
            speed *= CONFIG.AIM_SPEED_MULT;
        }

        // Stamina regen
        if (!isSprinting && this.player.stamina < this.player.maxStamina) {
            this.player.stamina += CONFIG.STAMINA_REGEN * dt;
            this.player.stamina = Math.min(this.player.stamina, this.player.maxStamina);
        }

        this.player.setVelocity(vx * speed, vy * speed);

        // Dodge roll
        if (Phaser.Input.Keyboard.JustDown(this.keys.space) &&
            this.player.dodgeCooldown <= 0 &&
            (vx !== 0 || vy !== 0)) {
            this.player.isDodging = true;
            this.player.dodgeTime = CONFIG.DODGE_DURATION;
            this.player.dodgeCooldown = CONFIG.DODGE_COOLDOWN;
            this.player.dodgeDir = { x: vx, y: vy };
            this.player.iframes = CONFIG.DODGE_DURATION;
        }

        // Rotation towards mouse
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX,
            this.input.activePointer.worldY
        );
        this.player.setRotation(angle + Math.PI / 2);

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
            this.startReload();
        }

        // Check reload completion
        if (this.player.isReloading) {
            if (Date.now() - this.player.reloadStartTime >= this.player.weapon.reloadTime) {
                this.completeReload();
            }
        }

        // Auto-fire if holding mouse
        if (this.input.activePointer.leftButtonDown()) {
            this.shoot();
        }

        // Quick use items
        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.useQuickSlot(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.useQuickSlot(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.useQuickSlot(2);
        if (Phaser.Input.Keyboard.JustDown(this.keys.four)) this.useQuickSlot(3);
    }

    shoot() {
        if (this.player.isReloading) return;
        if (this.player.weapon.currentAmmo <= 0) {
            this.startReload();
            return;
        }

        const now = Date.now();
        if (now - this.player.lastShot < this.player.weapon.fireRate) return;

        this.player.lastShot = now;
        this.player.weapon.currentAmmo--;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX,
            this.input.activePointer.worldY
        );

        // Calculate spread
        const isMoving = this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0;
        const isAiming = this.input.activePointer.rightButtonDown();
        let spread = this.player.weapon.spread;
        if (isAiming) spread *= 0.4;
        if (isMoving) spread *= 1.3;

        // Fire pellets for shotgun, single bullet for others
        const pellets = this.player.weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spreadAngle = angle + Phaser.Math.DegToRad(
                Phaser.Math.FloatBetween(-spread / 2, spread / 2)
            );

            const bullet = this.bullets.create(
                this.player.x + Math.cos(angle) * 20,
                this.player.y + Math.sin(angle) * 20,
                'bullet'
            );

            bullet.setVelocity(
                Math.cos(spreadAngle) * CONFIG.BULLET_SPEED,
                Math.sin(spreadAngle) * CONFIG.BULLET_SPEED
            );

            bullet.damage = this.player.weapon.damage;
            bullet.range = this.player.weapon.range;
            bullet.startX = bullet.x;
            bullet.startY = bullet.y;
            bullet.penetration = this.player.weapon.penetration;
        }

        // Muzzle flash
        const flash = this.add.image(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            'muzzle_flash'
        );
        flash.setRotation(angle);
        this.time.delayedCall(50, () => flash.destroy());

        // Screen shake
        this.cameras.main.shake(30, 0.002);
    }

    startReload() {
        if (this.player.isReloading) return;
        if (this.player.weapon.reserveAmmo <= 0) return;
        if (this.player.weapon.currentAmmo === this.player.weapon.magSize) return;

        this.player.isReloading = true;
        this.player.reloadStartTime = Date.now();
    }

    completeReload() {
        const needed = this.player.weapon.magSize - this.player.weapon.currentAmmo;
        const available = Math.min(needed, this.player.weapon.reserveAmmo);

        this.player.weapon.currentAmmo += available;
        this.player.weapon.reserveAmmo -= available;
        this.player.isReloading = false;
    }

    updateEnemies(time, dt) {
        this.enemies.getChildren().forEach(enemy => {
            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );

            // Check if player is visible
            const angleToPlayer = Phaser.Math.Angle.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - enemy.angle));
            const canSeePlayer = distToPlayer < enemy.visionRange &&
                                 angleDiff < Phaser.Math.DegToRad(enemy.visionAngle / 2) &&
                                 this.hasLineOfSight(enemy, this.player);

            switch (enemy.state) {
                case 'patrol':
                    if (canSeePlayer) {
                        enemy.state = 'combat';
                        enemy.alertTimer = 5000;
                    } else {
                        // Move towards patrol point
                        const distToTarget = Phaser.Math.Distance.Between(
                            enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y
                        );

                        if (distToTarget < 20) {
                            enemy.patrolTarget = this.getRandomPatrolPoint(enemy.x, enemy.y);
                        }

                        const angle = Phaser.Math.Angle.Between(
                            enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y
                        );
                        enemy.angle = angle;
                        enemy.setVelocity(
                            Math.cos(angle) * enemy.speed * 0.5,
                            Math.sin(angle) * enemy.speed * 0.5
                        );
                    }
                    break;

                case 'combat':
                    enemy.angle = angleToPlayer;
                    enemy.alertTimer -= dt * 1000;

                    if (enemy.alertTimer <= 0 && !canSeePlayer) {
                        enemy.state = 'patrol';
                        enemy.patrolTarget = this.getRandomPatrolPoint(enemy.x, enemy.y);
                    } else if (enemy.melee) {
                        // Melee enemy - charge at player
                        if (enemy.charges && distToPlayer < 150 && !enemy.isCharging) {
                            enemy.isCharging = true;
                            enemy.chargeDir = {
                                x: Math.cos(angleToPlayer),
                                y: Math.sin(angleToPlayer)
                            };
                            this.time.delayedCall(1000, () => {
                                enemy.isCharging = false;
                            });
                        }

                        if (enemy.isCharging) {
                            enemy.setVelocity(
                                enemy.chargeDir.x * enemy.speed * 2,
                                enemy.chargeDir.y * enemy.speed * 2
                            );
                        } else if (distToPlayer > enemy.range) {
                            enemy.setVelocity(
                                Math.cos(angleToPlayer) * enemy.speed,
                                Math.sin(angleToPlayer) * enemy.speed
                            );
                        } else {
                            enemy.setVelocity(0, 0);
                        }
                    } else {
                        // Ranged enemy
                        if (distToPlayer > enemy.range * 0.8) {
                            enemy.setVelocity(
                                Math.cos(angleToPlayer) * enemy.speed,
                                Math.sin(angleToPlayer) * enemy.speed
                            );
                        } else if (distToPlayer < enemy.range * 0.4) {
                            // Back up
                            enemy.setVelocity(
                                -Math.cos(angleToPlayer) * enemy.speed * 0.5,
                                -Math.sin(angleToPlayer) * enemy.speed * 0.5
                            );
                        } else {
                            enemy.setVelocity(0, 0);
                        }

                        // Shoot
                        if (canSeePlayer && distToPlayer < enemy.range &&
                            time - enemy.lastShot > enemy.fireRate) {
                            this.enemyShoot(enemy, angleToPlayer);
                            enemy.lastShot = time;
                        }
                    }
                    break;
            }

            // Update rotation
            enemy.setRotation(enemy.angle + Math.PI / 2);
        });
    }

    hasLineOfSight(from, to) {
        const line = new Phaser.Geom.Line(from.x, from.y, to.x, to.y);
        let blocked = false;

        this.walls.getChildren().forEach(wall => {
            if (Phaser.Geom.Intersects.LineToRectangle(line, wall.getBounds())) {
                blocked = true;
            }
        });

        return !blocked;
    }

    enemyShoot(enemy, angle) {
        const bullet = this.enemyBullets.create(
            enemy.x + Math.cos(angle) * 16,
            enemy.y + Math.sin(angle) * 16,
            'enemy_bullet'
        );

        // Add some spread
        const spread = Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-5, 5));

        bullet.setVelocity(
            Math.cos(angle + spread) * 400,
            Math.sin(angle + spread) * 400
        );

        bullet.damage = enemy.damage;
    }

    bulletHitEnemy(bullet, enemy) {
        // Calculate damage with distance falloff
        const dist = Phaser.Math.Distance.Between(
            bullet.startX, bullet.startY, bullet.x, bullet.y
        );

        let damage = bullet.damage;
        const falloffStart = bullet.range * 0.6;
        if (dist > falloffStart) {
            const falloff = (dist - falloffStart) / (bullet.range * 0.4);
            damage *= (1 - falloff * 0.5);
        }

        enemy.hp -= Math.floor(damage);
        bullet.destroy();

        // Damage flash
        enemy.setTint(0xFF0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Blood particle
        this.createBloodParticle(enemy.x, enemy.y);

        // Check death
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    bulletHitWall(bullet) {
        bullet.destroy();
    }

    enemyBulletHitPlayer(bullet, player) {
        if (this.player.iframes > 0 || this.player.isDodging) {
            bullet.destroy();
            return;
        }

        this.damagePlayer(bullet.damage);
        bullet.destroy();
    }

    enemyMeleePlayer(player, enemy) {
        if (!enemy.melee) return;
        if (this.player.iframes > 0 || this.player.isDodging) return;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (dist > enemy.range + 15) return;

        const now = Date.now();
        if (now - enemy.lastAttack < 1000) return;

        enemy.lastAttack = now;
        this.damagePlayer(enemy.damage);

        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200
        );
    }

    damagePlayer(damage) {
        this.player.hp -= damage;
        this.player.iframes = 500;

        // Screen flash
        this.damageOverlay.setAlpha(0.3);
        this.tweens.add({
            targets: this.damageOverlay,
            alpha: 0,
            duration: 200
        });

        // Screen shake
        this.cameras.main.shake(100, 0.01);

        // Chance to cause bleeding
        if (Math.random() < 0.3) {
            if (this.statusEffects.bleeding) {
                this.statusEffects.heavyBleeding = true;
                this.statusEffects.bleeding = false;
            } else {
                this.statusEffects.bleeding = true;
            }
        }

        // Check death
        if (this.player.hp <= 0) {
            this.playerDeath();
        }
    }

    killEnemy(enemy) {
        // Add to kill feed
        this.addKillFeed(enemy.type);

        // Drop loot
        this.dropEnemyLoot(enemy);

        // XP
        const saveData = this.registry.get('saveData');
        saveData.statistics.enemiesKilled++;

        enemy.destroy();
    }

    dropEnemyLoot(enemy) {
        // Small chance to drop items
        if (Math.random() < 0.3) {
            const loot = this.lootContainers.create(enemy.x, enemy.y, 'wooden_box');
            loot.lootType = 'wooden_box';
            loot.looted = false;
            loot.setScale(0.7);
        }
    }

    createBloodParticle(x, y) {
        for (let i = 0; i < 5; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(2, 4),
                0x8B0000
            );

            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.5,
                duration: 1000,
                onComplete: () => particle.destroy()
            });
        }
    }

    addKillFeed(enemyType) {
        const text = this.add.text(0, 0, `Killed ${ENEMIES[enemyType].name}`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#FF4444'
        }).setOrigin(1, 0);

        this.killFeedContainer.add(text);
        this.killFeed.push(text);

        // Shift existing entries down
        this.killFeed.forEach((entry, i) => {
            entry.setY(i * 16);
        });

        // Remove old entries
        if (this.killFeed.length > 5) {
            const old = this.killFeed.shift();
            old.destroy();
            this.killFeed.forEach((entry, i) => {
                entry.setY(i * 16);
            });
        }

        // Fade out after delay
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: text,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    const idx = this.killFeed.indexOf(text);
                    if (idx > -1) this.killFeed.splice(idx, 1);
                    text.destroy();
                }
            });
        });
    }

    inExtractionZone(player, zone) {
        if (!this.isExtracting) {
            this.isExtracting = true;
            this.extractionTimer = 0;
        }
    }

    checkExtraction(dt) {
        if (this.isExtracting) {
            // Check if still in zone
            let inZone = false;
            this.extractionZones.getChildren().forEach(zone => {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, zone.x, zone.y
                );
                if (dist < 40) inZone = true;
            });

            if (!inZone) {
                this.isExtracting = false;
                this.extractionText.setVisible(false);
                return;
            }

            this.extractionTimer += dt * 1000;

            const remaining = Math.ceil((this.extractionDuration - this.extractionTimer) / 1000);
            this.extractionText.setText(`EXTRACTING... ${remaining}s`);
            this.extractionText.setVisible(true);

            if (this.extractionTimer >= this.extractionDuration) {
                this.extractSuccess();
            }
        }
    }

    extractSuccess() {
        // Save loot
        const saveData = this.registry.get('saveData');
        saveData.statistics.raidsCompleted++;

        // Add collected loot to stash
        this.player.inventory.forEach(item => {
            const existing = saveData.stash.find(s => s.type === item.type);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                saveData.stash.push({ ...item });
            }
        });

        localStorage.setItem('zeroSievertClone', JSON.stringify(saveData));

        this.scene.start('ExtractionScene', { success: true, loot: this.player.inventory });
    }

    playerDeath() {
        const saveData = this.registry.get('saveData');
        localStorage.setItem('zeroSievertClone', JSON.stringify(saveData));

        this.scene.start('ExtractionScene', { success: false });
    }

    updateStatusEffects(dt) {
        if (this.statusEffects.bleeding) {
            this.player.hp -= CONFIG.BLEEDING_DPS * dt;
        }
        if (this.statusEffects.heavyBleeding) {
            this.player.hp -= CONFIG.HEAVY_BLEEDING_DPS * dt;
        }

        if (this.player.hp <= 0) {
            this.playerDeath();
        }
    }

    checkRadiation() {
        for (const zone of this.radiationZones) {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, zone.x, zone.y
            );
            if (dist < zone.radius) {
                this.statusEffects.radiation += 0.1;
            }
        }
    }

    checkNearbyLoot() {
        let nearLoot = null;
        let nearDist = 50;

        this.lootContainers.getChildren().forEach(container => {
            if (container.looted) return;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, container.x, container.y
            );

            if (dist < nearDist) {
                nearDist = dist;
                nearLoot = container;
            }
        });

        this.nearbyLoot = nearLoot;
        this.interactPrompt.setVisible(nearLoot !== null);
    }

    tryInteract() {
        if (this.nearbyLoot && !this.nearbyLoot.looted) {
            this.lootContainer(this.nearbyLoot);
        }
    }

    lootContainer(container) {
        container.looted = true;
        container.setAlpha(0.5);

        const table = LOOT_TABLES[container.lootType];
        if (!table) return;

        // Generate loot
        const loot = [];

        // Common items
        if (table.common) {
            const item = Phaser.Utils.Array.GetRandom(table.common);
            const qty = Array.isArray(item.quantity)
                ? Phaser.Math.Between(item.quantity[0], item.quantity[1])
                : item.quantity;
            loot.push({ type: item.type, quantity: qty });
        }

        // Uncommon (30% chance)
        if (table.uncommon && Math.random() < 0.3) {
            const item = Phaser.Utils.Array.GetRandom(table.uncommon);
            const qty = Array.isArray(item.quantity)
                ? Phaser.Math.Between(item.quantity[0], item.quantity[1])
                : item.quantity;
            loot.push({ type: item.type, quantity: qty });
        }

        // Rare (10% chance)
        if (table.rare && Math.random() < 0.1) {
            const item = Phaser.Utils.Array.GetRandom(table.rare);
            const qty = Array.isArray(item.quantity)
                ? Phaser.Math.Between(item.quantity[0], item.quantity[1])
                : item.quantity;
            loot.push({ type: item.type, quantity: qty });
        }

        // Add to inventory
        loot.forEach(item => {
            const existing = this.player.inventory.find(i => i.type === item.type);
            if (existing) {
                existing.quantity += item.quantity;
            } else {
                this.player.inventory.push(item);
            }
        });

        // Show loot notification
        this.showLootNotification(loot);
    }

    showLootNotification(loot) {
        const text = loot.map(item => {
            const name = item.type.replace('_', ' ');
            return `+${item.quantity} ${name}`;
        }).join('\n');

        const notification = this.add.text(this.player.x, this.player.y - 40, text, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#FFFF00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notification,
            y: notification.y - 30,
            alpha: 0,
            duration: 2000,
            onComplete: () => notification.destroy()
        });
    }

    useQuickSlot(slot) {
        const item = this.player.inventory[slot];
        if (!item) return;

        const itemData = ITEMS[item.type];
        if (!itemData) return;

        // Heal
        if (itemData.healAmount > 0) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + itemData.healAmount);
        }

        // Cure status
        if (itemData.curesStatus) {
            itemData.curesStatus.forEach(status => {
                if (status === 'bleeding') this.statusEffects.bleeding = false;
                if (status === 'heavy_bleeding') this.statusEffects.heavyBleeding = false;
            });
        }

        // Reduce radiation
        if (itemData.reducesRadiation) {
            this.statusEffects.radiation = Math.max(0,
                this.statusEffects.radiation - itemData.reducesRadiation);
        }

        // Consume item
        item.quantity--;
        if (item.quantity <= 0) {
            this.player.inventory.splice(slot, 1);
        }
    }

    toggleInventory() {
        this.inventoryOpen = !this.inventoryOpen;
        this.inventoryContainer.setVisible(this.inventoryOpen);

        if (this.inventoryOpen) {
            this.updateInventoryUI();
        }
    }

    updateInventoryUI() {
        // Clear old items
        this.inventoryItems.forEach(item => item.destroy());
        this.inventoryItems = [];

        // Show current inventory
        let y = -90;
        this.player.inventory.forEach((item, i) => {
            const name = item.type.replace(/_/g, ' ');
            const text = this.add.text(-180, y, `${i + 1}. ${name} x${item.quantity}`, {
                fontSize: '14px',
                fontFamily: 'Courier New',
                color: '#FFFFFF'
            });
            this.inventoryContainer.add(text);
            this.inventoryItems.push(text);
            y += 20;
        });
    }

    updateHUD() {
        // Health
        const hpPercent = this.player.hp / this.player.maxHp;
        this.healthBar.setScale(hpPercent, 1);
        this.healthBar.setFillStyle(hpPercent > 0.3 ? 0x00FF00 : 0xFF0000);
        this.healthText.setText(`${Math.ceil(this.player.hp)}/${this.player.maxHp}`);

        // Stamina
        const staminaPercent = this.player.stamina / this.player.maxStamina;
        this.staminaBar.setScale(staminaPercent, 1);

        // Weapon
        const weapon = this.player.weapon;
        this.weaponText.setText(weapon.name);

        const reloadText = this.player.isReloading ? ' [RELOADING]' : '';
        this.ammoText.setText(`${weapon.currentAmmo}/${weapon.magSize} | ${weapon.reserveAmmo}${reloadText}`);

        // Zone info
        const minutes = Math.floor(this.raidTime / 60000);
        const seconds = Math.floor((this.raidTime % 60000) / 1000);
        this.zoneText.setText(`Forest | ${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Status effects
        const statusList = [];
        if (this.statusEffects.bleeding) statusList.push('BLEEDING');
        if (this.statusEffects.heavyBleeding) statusList.push('HEAVY BLEED');
        if (this.statusEffects.radiation > 0) statusList.push(`RAD: ${Math.floor(this.statusEffects.radiation)}`);
        this.statusText.setText(statusList.join(' | '));
    }

    updateMinimap() {
        const map = this.minimapData;
        const scale = map.size / this.zoneWidth;

        // Player position
        const playerMapX = map.x - map.size / 2 + this.player.x * scale;
        const playerMapY = map.y - map.size / 2 + this.player.y * scale;
        this.minimapPlayer.setPosition(playerMapX, playerMapY);

        // Extraction zones
        this.minimapExtractions.getChildren().forEach(dot => {
            const zone = dot.linkedZone;
            const zoneMapX = map.x - map.size / 2 + zone.x * scale;
            const zoneMapY = map.y - map.size / 2 + zone.y * scale;
            dot.setPosition(zoneMapX, zoneMapY);
        });
    }

    cleanupBullets() {
        this.bullets.getChildren().forEach(bullet => {
            const dist = Phaser.Math.Distance.Between(
                bullet.startX, bullet.startY, bullet.x, bullet.y
            );
            if (dist > bullet.range) {
                bullet.destroy();
            }
        });

        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.x < 0 || bullet.x > this.zoneWidth ||
                bullet.y < 0 || bullet.y > this.zoneHeight) {
                bullet.destroy();
            }
        });
    }
}

class ExtractionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExtractionScene' });
    }

    init(data) {
        this.success = data.success;
        this.loot = data.loot || [];
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');

        if (this.success) {
            this.add.text(400, 100, 'EXTRACTION SUCCESSFUL', {
                fontSize: '36px',
                fontFamily: 'Courier New',
                color: '#00FF00'
            }).setOrigin(0.5);

            // Show loot
            this.add.text(400, 180, 'LOOT SECURED:', {
                fontSize: '18px',
                fontFamily: 'Courier New',
                color: '#AAAAAA'
            }).setOrigin(0.5);

            let y = 220;
            this.loot.forEach(item => {
                const name = item.type.replace(/_/g, ' ');
                this.add.text(400, y, `${name} x${item.quantity}`, {
                    fontSize: '14px',
                    fontFamily: 'Courier New',
                    color: '#FFFFFF'
                }).setOrigin(0.5);
                y += 20;
            });
        } else {
            this.add.text(400, 150, 'YOU DIED', {
                fontSize: '48px',
                fontFamily: 'Courier New',
                color: '#FF0000'
            }).setOrigin(0.5);

            this.add.text(400, 220, 'All equipped gear lost', {
                fontSize: '16px',
                fontFamily: 'Courier New',
                color: '#888888'
            }).setOrigin(0.5);
        }

        // Continue button
        const continueBtn = this.add.text(400, 450, '[ Continue ]', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            color: '#00AA00'
        }).setOrigin(0.5).setInteractive();

        continueBtn.on('pointerover', () => continueBtn.setColor('#00FF00'));
        continueBtn.on('pointerout', () => continueBtn.setColor('#00AA00'));
        continueBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, LoadoutScene, GameScene, ExtractionScene]
};

// Initialize game
const game = new Phaser.Game(config);
