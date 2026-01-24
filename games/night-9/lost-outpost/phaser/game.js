// Lost Outpost - Survival Horror Shooter
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;

// Game constants
const LEVELS = [
    { name: 'Docking Bay Alpha', size: { w: 15, h: 20 }, enemies: { scorpion: 5 }, objective: 'Find keycard and reach elevator', boss: null },
    { name: 'Engineering Deck', size: { w: 25, h: 30 }, enemies: { scorpion: 8, scorpionLaser: 2 }, objective: 'Restore auxiliary power', boss: null },
    { name: 'Medical Bay', size: { w: 30, h: 25 }, enemies: { scorpion: 6, arachnid: 6, scorpionLaser: 3 }, objective: 'Find Dr. Chen\'s research', boss: null },
    { name: 'Cargo Hold', size: { w: 35, h: 30 }, enemies: { scorpion: 12, arachnid: 4, scorpionLaser: 4 }, objective: 'Open blast doors', boss: 'nestGuardian' },
    { name: 'Crash Site', size: { w: 40, h: 40 }, enemies: { scorpion: 999 }, objective: 'Collect 5 supply crates', boss: 'hiveCommander' }
];

const WEAPONS = {
    assaultRifle: { name: 'Assault Rifle', damage: 15, fireRate: 150, magSize: 30, maxAmmo: 300, spread: 0.05, color: 0x888888 },
    smg: { name: 'SMG', damage: 8, fireRate: 80, magSize: 40, maxAmmo: 400, spread: 0.1, color: 0x666666 },
    shotgun: { name: 'Shotgun', damage: 8, fireRate: 600, magSize: 8, maxAmmo: 80, pellets: 6, spread: 0.3, color: 0x996633 },
    flamethrower: { name: 'Flamethrower', damage: 5, fireRate: 50, magSize: 100, maxAmmo: 500, spread: 0.2, color: 0xff6600, flame: true }
};

const ENEMIES = {
    scorpion: { hp: 30, damage: 10, speed: 80, color: 0x44aa44, size: 16, behavior: 'chase', attackRange: 30 },
    scorpionLaser: { hp: 40, damage: 15, speed: 60, color: 0x44ff44, size: 18, behavior: 'ranged', attackRange: 200, fireRate: 2000 },
    arachnid: { hp: 80, damage: 20, speed: 50, color: 0x228822, size: 24, behavior: 'chase', attackRange: 40 }
};

const BOSSES = {
    nestGuardian: { hp: 400, damage: 30, speed: 40, color: 0x116611, size: 48, name: 'Nest Guardian' },
    hiveCommander: { hp: 600, damage: 40, speed: 35, color: 0x005500, size: 64, name: 'Hive Commander' }
};

// Game state
let gameState = {
    hp: 100,
    maxHp: 100,
    lives: 3,
    credits: 500,
    level: 0,
    weapons: ['assaultRifle'],
    currentWeapon: 0,
    ammo: { assaultRifle: 300 },
    currentAmmo: { assaultRifle: 30 },
    keycards: 0,
    objectivesComplete: 0,
    totalObjectives: 1,
    enemiesKilled: 0,
    xp: 0
};

// Phaser scenes
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        let g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player
        g.fillStyle(0x3366aa);
        g.fillRect(4, 2, 8, 12);
        g.fillStyle(0xffcc99);
        g.fillCircle(8, 4, 4);
        g.generateTexture('player', 16, 16);

        // Bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillRect(0, 0, 4, 2);
        g.generateTexture('bullet', 4, 2);

        // Enemy bullet
        g.clear();
        g.fillStyle(0x00ff00);
        g.fillCircle(3, 3, 3);
        g.generateTexture('enemyBullet', 6, 6);

        // Flame particle
        g.clear();
        g.fillStyle(0xff6600, 0.8);
        g.fillCircle(4, 4, 4);
        g.generateTexture('flame', 8, 8);

        // Floor tile (metal grate)
        g.clear();
        g.fillStyle(0x222233);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x1a1a2a);
        for (let i = 0; i < 4; i++) {
            g.fillRect(i * 8, 0, 2, TILE_SIZE);
            g.fillRect(0, i * 8, TILE_SIZE, 2);
        }
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x444455);
        g.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.lineStyle(2, 0x555566);
        g.strokeRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Warning stripe wall
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        for (let i = 0; i < 8; i++) {
            g.fillStyle(i % 2 === 0 ? 0xffcc00 : 0x222222);
            g.fillRect(i * 4, 0, 4, 6);
        }
        g.generateTexture('wallWarning', TILE_SIZE, TILE_SIZE);

        // Door
        g.clear();
        g.fillStyle(0x446688);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x224466);
        g.fillRect(TILE_SIZE / 2 - 2, 0, 4, TILE_SIZE);
        g.generateTexture('door', TILE_SIZE, TILE_SIZE);

        // Door open
        g.clear();
        g.fillStyle(0x111122);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('doorOpen', TILE_SIZE, TILE_SIZE);

        // Keycard
        g.clear();
        g.fillStyle(0x00aaff);
        g.fillRect(0, 2, 12, 8);
        g.fillStyle(0x0088cc);
        g.fillRect(2, 4, 8, 4);
        g.generateTexture('keycard', 12, 12);

        // Health pack
        g.clear();
        g.fillStyle(0xffffff);
        g.fillRect(0, 0, 12, 12);
        g.fillStyle(0xff3333);
        g.fillRect(4, 1, 4, 10);
        g.fillRect(1, 4, 10, 4);
        g.generateTexture('healthPack', 12, 12);

        // Ammo crate
        g.clear();
        g.fillStyle(0x886633);
        g.fillRect(0, 0, 14, 14);
        g.fillStyle(0xffcc00);
        g.fillRect(2, 2, 10, 10);
        g.fillStyle(0x886633);
        g.fillRect(4, 4, 6, 6);
        g.generateTexture('ammoCrate', 14, 14);

        // Supply crate
        g.clear();
        g.fillStyle(0x446688);
        g.fillRect(0, 0, 20, 20);
        g.fillStyle(0x224466);
        g.fillRect(2, 2, 16, 16);
        g.lineStyle(2, 0x00aaff);
        g.strokeRect(4, 4, 12, 12);
        g.generateTexture('supplyCrate', 20, 20);

        // Credits
        g.clear();
        g.fillStyle(0x00ffaa);
        g.fillCircle(5, 5, 5);
        g.fillStyle(0x00cc88);
        g.fillCircle(5, 5, 3);
        g.generateTexture('credits', 10, 10);

        // Enemy textures
        Object.keys(ENEMIES).forEach(key => {
            const e = ENEMIES[key];
            g.clear();
            g.fillStyle(e.color);
            // Scorpion-like body
            g.fillEllipse(e.size / 2, e.size / 2, e.size, e.size * 0.7);
            // Eyes
            g.fillStyle(0xff0000);
            g.fillCircle(e.size * 0.3, e.size * 0.3, 2);
            g.fillCircle(e.size * 0.7, e.size * 0.3, 2);
            // Legs
            g.fillStyle(e.color);
            for (let i = 0; i < 3; i++) {
                g.fillRect(0, e.size * 0.4 + i * 3, 3, 2);
                g.fillRect(e.size - 3, e.size * 0.4 + i * 3, 3, 2);
            }
            g.generateTexture('enemy_' + key, e.size, e.size);
        });

        // Boss textures
        Object.keys(BOSSES).forEach(key => {
            const b = BOSSES[key];
            g.clear();
            g.fillStyle(b.color);
            g.fillEllipse(b.size / 2, b.size / 2, b.size, b.size * 0.8);
            // Multiple eyes
            g.fillStyle(0xff0000);
            for (let i = 0; i < 4; i++) {
                g.fillCircle(b.size * 0.2 + i * (b.size * 0.2), b.size * 0.3, 3);
            }
            // Mandibles
            g.fillStyle(b.color * 0.8);
            g.fillTriangle(b.size / 4, b.size * 0.7, b.size / 4 - 8, b.size, b.size / 4 + 4, b.size * 0.9);
            g.fillTriangle(b.size * 3 / 4, b.size * 0.7, b.size * 3 / 4 - 4, b.size * 0.9, b.size * 3 / 4 + 8, b.size);
            g.generateTexture('boss_' + key, b.size, b.size);
        });

        // Weapon icons
        Object.keys(WEAPONS).forEach(key => {
            const w = WEAPONS[key];
            g.clear();
            g.fillStyle(w.color);
            g.fillRect(0, 4, 20, 8);
            g.fillRect(16, 2, 4, 12);
            g.fillStyle(0x333333);
            g.fillRect(4, 6, 10, 4);
            g.generateTexture('weapon_' + key, 24, 16);
        });

        // Muzzle flash
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xffffff);
        g.fillCircle(6, 6, 3);
        g.generateTexture('muzzleFlash', 12, 12);

        // Flashlight cone (for masking)
        g.clear();
        g.fillStyle(0xffffff);
        g.fillTriangle(0, 0, 200, -80, 200, 80);
        g.generateTexture('flashlightCone', 200, 160);

        // Rock (for planet surface)
        g.clear();
        g.fillStyle(0x554433);
        g.fillEllipse(16, 16, 28, 24);
        g.fillStyle(0x443322);
        g.fillEllipse(12, 12, 12, 10);
        g.generateTexture('rock', 32, 32);

        // Lava vent
        g.clear();
        g.fillStyle(0x331100);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0xff3300);
        g.fillCircle(12, 12, 8);
        g.fillStyle(0xff6600);
        g.fillCircle(12, 12, 4);
        g.generateTexture('lavaVent', 24, 24);

        // Exit marker
        g.clear();
        g.fillStyle(0x00ff00);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x00aa00);
        g.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.fillStyle(0xffffff);
        g.fillTriangle(TILE_SIZE / 2, 8, TILE_SIZE / 2 - 6, TILE_SIZE - 8, TILE_SIZE / 2 + 6, TILE_SIZE - 8);
        g.generateTexture('exit', TILE_SIZE, TILE_SIZE);

        g.destroy();
    }
}

// MenuScene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Dark background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a1015);

        // Border
        const border = this.add.graphics();
        border.lineStyle(4, 0x1a3a4a);
        border.strokeRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20);

        // Title
        this.add.text(GAME_WIDTH / 2, 80, 'LOST OUTPOST', {
            fontSize: '36px',
            fontFamily: 'Arial Black',
            color: '#00aaff',
            stroke: '#003355',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 120, 'Survival Horror', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#446688'
        }).setOrigin(0.5);

        // Controls
        const controls = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'R - Reload',
            'Space - Interact',
            'Q - Debug Overlay'
        ];

        controls.forEach((text, i) => {
            this.add.text(GAME_WIDTH / 2, 180 + i * 24, text, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#668899'
            }).setOrigin(0.5);
        });

        // Start
        this.add.text(GAME_WIDTH / 2, 400, 'PRESS SPACE TO START', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#00ffaa'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.resetGameState();
            this.scene.start('GameScene');
        });
    }

    resetGameState() {
        gameState = {
            hp: 100,
            maxHp: 100,
            lives: 3,
            credits: 500,
            level: 0,
            weapons: ['assaultRifle'],
            currentWeapon: 0,
            ammo: { assaultRifle: 300 },
            currentAmmo: { assaultRifle: 30 },
            keycards: 0,
            objectivesComplete: 0,
            totalObjectives: 1,
            enemiesKilled: 0,
            xp: 0
        };
    }
}

// GameScene - Main gameplay
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.levelData = LEVELS[gameState.level];

        // Camera setup
        this.cameras.main.setBackgroundColor(0x000000);

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.hazards = this.physics.add.staticGroup();

        // Generate level
        this.generateLevel();

        // Create player
        this.createPlayer();

        // Setup camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);

        // Create darkness/lighting
        this.createLighting();

        // Input
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            reload: 'R', interact: 'SPACE', debug: 'Q'
        });

        this.input.on('pointerdown', () => this.isFiring = true);
        this.input.on('pointerup', () => this.isFiring = false);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.walls, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.playerHit, null, this);
        this.physics.add.overlap(this.enemyBullets, this.walls, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.hazards, this.hazardDamage, null, this);

        // HUD
        this.createHUD();

        // State
        this.lastFireTime = 0;
        this.isFiring = false;
        this.debugVisible = false;
        this.lastHazardDamage = 0;

        // Spawn enemies
        this.spawnEnemies();

        // Show level intro
        this.showLevelIntro();
    }

    generateLevel() {
        const mapWidth = this.levelData.size.w;
        const mapHeight = this.levelData.size.h;

        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        // Floor tiles
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'floor').setDepth(0);
            }
        }

        // Walls (border)
        for (let x = 0; x < mapWidth; x++) {
            this.walls.create(x * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, 'wallWarning');
            this.walls.create(x * TILE_SIZE + TILE_SIZE / 2, (mapHeight - 1) * TILE_SIZE + TILE_SIZE / 2, 'wallWarning');
        }
        for (let y = 1; y < mapHeight - 1; y++) {
            this.walls.create(TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
            this.walls.create((mapWidth - 1) * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
        }

        // Internal walls (maze-like corridors)
        const corridorCount = Math.floor(mapWidth * mapHeight / 50);
        for (let i = 0; i < corridorCount; i++) {
            const startX = Phaser.Math.Between(3, mapWidth - 4);
            const startY = Phaser.Math.Between(3, mapHeight - 4);
            const length = Phaser.Math.Between(3, 8);
            const horizontal = Math.random() < 0.5;

            for (let j = 0; j < length; j++) {
                const wx = horizontal ? startX + j : startX;
                const wy = horizontal ? startY : startY + j;
                if (wx > 1 && wx < mapWidth - 2 && wy > 1 && wy < mapHeight - 2) {
                    this.walls.create(wx * TILE_SIZE + TILE_SIZE / 2, wy * TILE_SIZE + TILE_SIZE / 2, 'wall');
                }
            }
        }

        // Planet surface hazards (level 5)
        if (gameState.level === 4) {
            // Add rocks
            for (let i = 0; i < 15; i++) {
                const rx = Phaser.Math.Between(4, mapWidth - 5) * TILE_SIZE;
                const ry = Phaser.Math.Between(4, mapHeight - 5) * TILE_SIZE;
                this.walls.create(rx, ry, 'rock');
            }

            // Add lava vents
            for (let i = 0; i < 8; i++) {
                const lx = Phaser.Math.Between(4, mapWidth - 5) * TILE_SIZE;
                const ly = Phaser.Math.Between(4, mapHeight - 5) * TILE_SIZE;
                const vent = this.hazards.create(lx, ly, 'lavaVent');
                vent.setDepth(1);
            }

            // Supply crates to collect
            gameState.totalObjectives = 5;
            for (let i = 0; i < 5; i++) {
                const cx = Phaser.Math.Between(4, mapWidth - 5) * TILE_SIZE;
                const cy = Phaser.Math.Between(4, mapHeight - 5) * TILE_SIZE;
                const crate = this.pickups.create(cx, cy, 'supplyCrate');
                crate.pickupType = 'objective';
                crate.setDepth(5);
            }
        } else {
            gameState.totalObjectives = 1;
        }

        // Exit
        this.exitX = (mapWidth - 3) * TILE_SIZE;
        this.exitY = (mapHeight - 3) * TILE_SIZE;
        this.exitSprite = this.add.sprite(this.exitX, this.exitY, 'exit').setDepth(1);
        this.exitSprite.setVisible(false);

        // Keycard
        if (gameState.level < 4) {
            const kx = Phaser.Math.Between(mapWidth / 2, mapWidth - 4) * TILE_SIZE;
            const ky = Phaser.Math.Between(mapHeight / 2, mapHeight - 4) * TILE_SIZE;
            const keycard = this.pickups.create(kx, ky, 'keycard');
            keycard.pickupType = 'keycard';
            keycard.setDepth(5);
        }

        // Pickups
        for (let i = 0; i < 5; i++) {
            const px = Phaser.Math.Between(3, mapWidth - 4) * TILE_SIZE;
            const py = Phaser.Math.Between(3, mapHeight - 4) * TILE_SIZE;
            const type = Math.random() < 0.4 ? 'healthPack' : (Math.random() < 0.5 ? 'ammoCrate' : 'credits');
            const pickup = this.pickups.create(px, py, type);
            pickup.pickupType = type;
            pickup.setDepth(5);
        }

        // Weapon pickups (based on level)
        if (gameState.level >= 1 && !gameState.weapons.includes('smg')) {
            const wx = Phaser.Math.Between(mapWidth / 2, mapWidth - 4) * TILE_SIZE;
            const wy = Phaser.Math.Between(3, mapHeight / 2) * TILE_SIZE;
            const weaponPickup = this.pickups.create(wx, wy, 'weapon_smg');
            weaponPickup.pickupType = 'weapon_smg';
            weaponPickup.setDepth(5);
        }
        if (gameState.level >= 2 && !gameState.weapons.includes('shotgun')) {
            const wx = Phaser.Math.Between(3, mapWidth / 2) * TILE_SIZE;
            const wy = Phaser.Math.Between(mapHeight / 2, mapHeight - 4) * TILE_SIZE;
            const weaponPickup = this.pickups.create(wx, wy, 'weapon_shotgun');
            weaponPickup.pickupType = 'weapon_shotgun';
            weaponPickup.setDepth(5);
        }
        if (gameState.level >= 3 && !gameState.weapons.includes('flamethrower')) {
            const wx = Phaser.Math.Between(mapWidth / 2, mapWidth - 4) * TILE_SIZE;
            const wy = Phaser.Math.Between(mapHeight / 2, mapHeight - 4) * TILE_SIZE;
            const weaponPickup = this.pickups.create(wx, wy, 'weapon_flamethrower');
            weaponPickup.pickupType = 'weapon_flamethrower';
            weaponPickup.setDepth(5);
        }
    }

    createPlayer() {
        this.player = this.physics.add.sprite(TILE_SIZE * 3, TILE_SIZE * 3, 'player');
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);

        // Flashlight
        this.flashlight = this.add.sprite(this.player.x, this.player.y, 'flashlightCone');
        this.flashlight.setOrigin(0, 0.5);
        this.flashlight.setAlpha(0.3);
        this.flashlight.setDepth(11);
        this.flashlight.setBlendMode(Phaser.BlendModes.ADD);
    }

    createLighting() {
        // Create darkness overlay
        this.darkness = this.add.graphics();
        this.darkness.setScrollFactor(0);
        this.darkness.setDepth(50);
    }

    updateLighting() {
        this.darkness.clear();
        this.darkness.fillStyle(0x000000, 0.7);
        this.darkness.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Cut out player visibility area
        const playerScreenX = GAME_WIDTH / 2;
        const playerScreenY = GAME_HEIGHT / 2;

        this.darkness.fillStyle(0x000000, 0);
        this.darkness.setBlendMode(Phaser.BlendModes.ERASE);
        this.darkness.fillCircle(playerScreenX, playerScreenY, 120);
        this.darkness.setBlendMode(Phaser.BlendModes.NORMAL);
    }

    spawnEnemies() {
        const enemyTypes = this.levelData.enemies;

        Object.keys(enemyTypes).forEach(type => {
            let count = enemyTypes[type];
            if (count === 999) count = 10; // Infinite spawning level starts with 10

            for (let i = 0; i < count; i++) {
                this.spawnEnemy(type);
            }
        });

        // Boss spawn
        if (this.levelData.boss && gameState.level >= 3) {
            this.spawnBoss(this.levelData.boss);
        }
    }

    spawnEnemy(type) {
        const data = ENEMIES[type];
        const x = Phaser.Math.Between(this.mapWidth / 2, this.mapWidth - 3) * TILE_SIZE;
        const y = Phaser.Math.Between(3, this.mapHeight - 3) * TILE_SIZE;

        const enemy = this.enemies.create(x, y, 'enemy_' + type);
        enemy.enemyType = type;
        enemy.hp = data.hp * (1 + gameState.level * 0.1);
        enemy.damage = data.damage * (1 + gameState.level * 0.1);
        enemy.speed = data.speed;
        enemy.behavior = data.behavior;
        enemy.attackRange = data.attackRange;
        enemy.fireRate = data.fireRate || 0;
        enemy.lastFireTime = 0;
        enemy.setDepth(8);

        return enemy;
    }

    spawnBoss(type) {
        const data = BOSSES[type];
        const x = (this.mapWidth - 5) * TILE_SIZE;
        const y = (this.mapHeight / 2) * TILE_SIZE;

        this.boss = this.enemies.create(x, y, 'boss_' + type);
        this.boss.isBoss = true;
        this.boss.bossType = type;
        this.boss.hp = data.hp;
        this.boss.maxHp = data.hp;
        this.boss.damage = data.damage;
        this.boss.speed = data.speed;
        this.boss.setDepth(9);
        this.boss.lastSpawnTime = 0;

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 40, 200, 12, 0x333333);
        this.bossHpBg.setScrollFactor(0);
        this.bossHpBg.setDepth(100);

        this.bossHpBar = this.add.rectangle(GAME_WIDTH / 2 - 98, GAME_HEIGHT - 40, 196, 8, 0xff3333);
        this.bossHpBar.setOrigin(0, 0.5);
        this.bossHpBar.setScrollFactor(0);
        this.bossHpBar.setDepth(101);

        this.bossNameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 55, data.name, {
            fontSize: '12px',
            color: '#ff6666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    update(time, delta) {
        if (gameState.hp <= 0) {
            this.playerDeath();
            return;
        }

        this.handleMovement();
        this.handleShooting(time);
        this.updateFlashlight();
        this.updateLighting();
        this.updateEnemies(time);
        this.updateHUD();
        this.checkLevelComplete();

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.keys.reload)) {
            this.reload();
        }

        // Debug
        if (Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
            this.debugVisible = !this.debugVisible;
        }

        // Infinite spawning (level 5)
        if (gameState.level === 4 && this.enemies.countActive() < 15) {
            if (Math.random() < 0.02) {
                this.spawnEnemy('scorpion');
            }
        }
    }

    handleMovement() {
        let vx = 0, vy = 0;
        const speed = 150;

        if (this.keys.up.isDown) vy = -speed;
        if (this.keys.down.isDown) vy = speed;
        if (this.keys.left.isDown) vx = -speed;
        if (this.keys.right.isDown) vx = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);
    }

    updateFlashlight() {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        this.flashlight.setPosition(this.player.x, this.player.y);
        this.flashlight.setRotation(angle);
    }

    handleShooting(time) {
        if (!this.isFiring) return;

        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];

        if (time - this.lastFireTime < weapon.fireRate) return;

        if (gameState.currentAmmo[weaponName] <= 0) {
            this.reload();
            return;
        }

        this.lastFireTime = time;
        gameState.currentAmmo[weaponName]--;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = weapon.spread * (Math.random() - 0.5);
            const angle = baseAngle + spread;

            if (weapon.flame) {
                // Flamethrower
                const flame = this.bullets.create(
                    this.player.x + Math.cos(angle) * 20,
                    this.player.y + Math.sin(angle) * 20,
                    'flame'
                );
                flame.damage = weapon.damage;
                flame.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
                flame.setDepth(9);
                this.time.delayedCall(300, () => {
                    if (flame.active) flame.destroy();
                });
            } else {
                const bullet = this.bullets.create(
                    this.player.x + Math.cos(angle) * 16,
                    this.player.y + Math.sin(angle) * 16,
                    'bullet'
                );
                bullet.setRotation(angle);
                bullet.damage = weapon.damage;
                bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
                bullet.setDepth(9);

                this.time.delayedCall(600, () => {
                    if (bullet.active) bullet.destroy();
                });
            }
        }

        // Muzzle flash
        const flash = this.add.sprite(
            this.player.x + Math.cos(baseAngle) * 20,
            this.player.y + Math.sin(baseAngle) * 20,
            'muzzleFlash'
        );
        flash.setDepth(11);
        this.time.delayedCall(50, () => flash.destroy());
    }

    reload() {
        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];
        const needed = weapon.magSize - gameState.currentAmmo[weaponName];
        const available = Math.min(needed, gameState.ammo[weaponName]);

        gameState.currentAmmo[weaponName] += available;
        gameState.ammo[weaponName] -= available;
    }

    updateEnemies(time) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Movement
            if (enemy.behavior === 'chase' || (enemy.behavior === 'ranged' && dist > 150)) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else if (enemy.behavior === 'ranged') {
                enemy.setVelocity(0, 0);
            }

            // Boss behavior
            if (enemy.isBoss) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);

                // Spawn adds
                if (time - enemy.lastSpawnTime > 15000) {
                    enemy.lastSpawnTime = time;
                    for (let i = 0; i < 2; i++) {
                        this.spawnEnemy('scorpion');
                    }
                }

                // Update boss HP bar
                const hpPercent = enemy.hp / enemy.maxHp;
                this.bossHpBar.setScale(hpPercent, 1);
            }

            // Melee damage
            if (dist < enemy.attackRange && !enemy.isBoss) {
                if (!enemy.lastAttackTime || time - enemy.lastAttackTime > 1000) {
                    enemy.lastAttackTime = time;
                    gameState.hp -= enemy.damage;
                    this.playerDamageFlash();
                }
            }

            // Boss melee
            if (enemy.isBoss && dist < 40) {
                if (!enemy.lastAttackTime || time - enemy.lastAttackTime > 1500) {
                    enemy.lastAttackTime = time;
                    gameState.hp -= enemy.damage;
                    this.playerDamageFlash();
                }
            }

            // Ranged attack
            if (enemy.behavior === 'ranged' && dist < 200) {
                if (time - enemy.lastFireTime > enemy.fireRate) {
                    enemy.lastFireTime = time;
                    this.enemyShoot(enemy, angle);
                }
            }
        });
    }

    enemyShoot(enemy, angle) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
        bullet.damage = enemy.damage;
        bullet.setDepth(9);

        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        bullet.destroy();

        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        gameState.enemiesKilled++;
        gameState.xp += enemy.isBoss ? 500 : 50;
        gameState.credits += enemy.isBoss ? 200 : Phaser.Math.Between(10, 30);

        // Check if boss
        if (enemy.isBoss) {
            this.bossDefeated();
        }

        enemy.destroy();
    }

    bossDefeated() {
        if (this.bossHpBg) this.bossHpBg.destroy();
        if (this.bossHpBar) this.bossHpBar.destroy();
        if (this.bossNameText) this.bossNameText.destroy();

        // Show exit
        this.exitSprite.setVisible(true);

        this.showMessage('BOSS DEFEATED!');
    }

    playerHit(player, bullet) {
        gameState.hp -= bullet.damage;
        bullet.destroy();
        this.playerDamageFlash();
    }

    hazardDamage(player, hazard) {
        const time = this.time.now;
        if (time - this.lastHazardDamage > 1000) {
            this.lastHazardDamage = time;
            gameState.hp -= 10;
            this.playerDamageFlash();
        }
    }

    playerDamageFlash() {
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            this.player.clearTint();
        });
    }

    playerDeath() {
        gameState.lives--;

        if (gameState.lives <= 0) {
            this.scene.start('GameOverScene');
        } else {
            // Respawn
            gameState.hp = gameState.maxHp;
            this.player.setPosition(TILE_SIZE * 3, TILE_SIZE * 3);
            this.showMessage('Lives remaining: ' + gameState.lives);
        }
    }

    collectPickup(player, pickup) {
        const weaponName = gameState.weapons[gameState.currentWeapon];

        switch (pickup.pickupType) {
            case 'healthPack':
                gameState.hp = Math.min(gameState.hp + 30, gameState.maxHp);
                this.showMessage('+30 Health');
                break;
            case 'ammoCrate':
                gameState.ammo[weaponName] = Math.min(
                    gameState.ammo[weaponName] + WEAPONS[weaponName].magSize * 2,
                    WEAPONS[weaponName].maxAmmo
                );
                this.showMessage('+Ammo');
                break;
            case 'credits':
                const amount = Phaser.Math.Between(50, 150);
                gameState.credits += amount;
                this.showMessage('+' + amount + ' Credits');
                break;
            case 'keycard':
                gameState.keycards++;
                this.showMessage('Keycard acquired!');
                break;
            case 'objective':
                gameState.objectivesComplete++;
                this.showMessage('Supply crate ' + gameState.objectivesComplete + '/' + gameState.totalObjectives);
                break;
            case 'weapon_smg':
                if (!gameState.weapons.includes('smg')) {
                    gameState.weapons.push('smg');
                    gameState.ammo.smg = WEAPONS.smg.maxAmmo;
                    gameState.currentAmmo.smg = WEAPONS.smg.magSize;
                    this.showMessage('SMG acquired!');
                }
                break;
            case 'weapon_shotgun':
                if (!gameState.weapons.includes('shotgun')) {
                    gameState.weapons.push('shotgun');
                    gameState.ammo.shotgun = WEAPONS.shotgun.maxAmmo;
                    gameState.currentAmmo.shotgun = WEAPONS.shotgun.magSize;
                    this.showMessage('Shotgun acquired!');
                }
                break;
            case 'weapon_flamethrower':
                if (!gameState.weapons.includes('flamethrower')) {
                    gameState.weapons.push('flamethrower');
                    gameState.ammo.flamethrower = WEAPONS.flamethrower.maxAmmo;
                    gameState.currentAmmo.flamethrower = WEAPONS.flamethrower.magSize;
                    this.showMessage('Flamethrower acquired!');
                }
                break;
        }

        pickup.destroy();
    }

    checkLevelComplete() {
        // Check if player reached exit
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitX, this.exitY);

        // Level completion conditions
        let canExit = false;

        if (gameState.level < 4) {
            // Need keycard and all enemies dead (or boss dead)
            canExit = gameState.keycards > 0 && (this.enemies.countActive() === 0 || !this.boss);
        } else {
            // Level 5: collect all objectives
            canExit = gameState.objectivesComplete >= gameState.totalObjectives;
        }

        if (!this.exitSprite.visible && canExit) {
            this.exitSprite.setVisible(true);
            this.showMessage('EXIT UNLOCKED');
        }

        if (dist < 30 && this.exitSprite.visible) {
            this.levelComplete();
        }
    }

    levelComplete() {
        gameState.level++;
        gameState.keycards = 0;
        gameState.objectivesComplete = 0;

        if (gameState.level >= LEVELS.length) {
            this.scene.start('VictoryScene');
        } else {
            this.scene.start('GameScene');
        }
    }

    showMessage(text) {
        const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, text, {
            fontSize: '18px',
            color: '#00ffaa',
            stroke: '#003322',
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 30,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    showLevelIntro() {
        const intro = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'LEVEL ' + (gameState.level + 1) + '\n' + this.levelData.name, {
            fontSize: '24px',
            color: '#00aaff',
            stroke: '#003355',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        const objective = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, this.levelData.objective, {
            fontSize: '14px',
            color: '#668899'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.time.delayedCall(3000, () => {
            intro.destroy();
            objective.destroy();
        });
    }

    createHUD() {
        // Top-left: Lives and XP
        this.livesText = this.add.text(10, 10, 'LIVES: ' + gameState.lives, {
            fontSize: '14px',
            color: '#00ffaa'
        }).setScrollFactor(0).setDepth(100);

        this.xpText = this.add.text(10, 28, 'XP: ' + gameState.xp, {
            fontSize: '12px',
            color: '#668899'
        }).setScrollFactor(0).setDepth(100);

        // Bottom-center: Health bar and credits
        this.healthBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, 150, 12, 0x333333);
        this.healthBarBg.setScrollFactor(0).setDepth(100);

        this.healthBar = this.add.rectangle(GAME_WIDTH / 2 - 73, GAME_HEIGHT - 20, 146, 8, 0x00ff00);
        this.healthBar.setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

        this.creditsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, '0', {
            fontSize: '14px',
            color: '#00ffaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Bottom-right: Weapon and ammo
        this.weaponText = this.add.text(GAME_WIDTH - 100, GAME_HEIGHT - 30, '', {
            fontSize: '12px',
            color: '#668899'
        }).setScrollFactor(0).setDepth(100);

        this.ammoText = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 30, '', {
            fontSize: '14px',
            color: '#00ffaa'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

        // Debug text
        this.debugText = this.add.text(GAME_WIDTH - 10, 10, '', {
            fontSize: '10px',
            color: '#00ff00',
            backgroundColor: '#000000aa'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);
    }

    updateHUD() {
        this.livesText.setText('LIVES: ' + gameState.lives);
        this.xpText.setText('XP: ' + gameState.xp);

        const hpPercent = gameState.hp / gameState.maxHp;
        this.healthBar.setScale(hpPercent, 1);
        if (hpPercent < 0.3) {
            this.healthBar.setFillStyle(0xff3333);
        } else if (hpPercent < 0.6) {
            this.healthBar.setFillStyle(0xffaa00);
        } else {
            this.healthBar.setFillStyle(0x00ff00);
        }

        this.creditsText.setText(gameState.credits.toString());

        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];
        this.weaponText.setText(weapon.name);
        this.ammoText.setText(gameState.currentAmmo[weaponName] + ' | ' + gameState.ammo[weaponName]);

        // Debug
        if (this.debugVisible) {
            this.debugText.setText([
                '=== DEBUG (Q) ===',
                `Player: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
                `HP: ${gameState.hp}/${gameState.maxHp}`,
                `Level: ${gameState.level + 1}/${LEVELS.length}`,
                `Enemies: ${this.enemies.countActive()}`,
                `Keycards: ${gameState.keycards}`,
                `Objectives: ${gameState.objectivesComplete}/${gameState.totalObjectives}`,
                `Kills: ${gameState.enemiesKilled}`,
                `FPS: ${Math.floor(this.game.loop.actualFps)}`
            ].join('\n'));
            this.debugText.setVisible(true);
        } else {
            this.debugText.setVisible(false);
        }
    }
}

// VictoryScene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x001122);

        this.add.text(GAME_WIDTH / 2, 100, 'MISSION COMPLETE', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#00ffaa',
            stroke: '#003322',
            strokeThickness: 4
        }).setOrigin(0.5);

        const stats = [
            `Enemies Killed: ${gameState.enemiesKilled}`,
            `Credits Earned: ${gameState.credits}`,
            `XP Gained: ${gameState.xp}`,
            `Weapons Found: ${gameState.weapons.length}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(GAME_WIDTH / 2, 180 + i * 30, stat, {
                fontSize: '16px',
                color: '#668899'
            }).setOrigin(0.5);
        });

        this.add.text(GAME_WIDTH / 2, 380, 'Press SPACE to play again', {
            fontSize: '16px',
            color: '#00aaff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });
    }
}

// GameOverScene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x110000);

        this.add.text(GAME_WIDTH / 2, 150, 'GAME OVER', {
            fontSize: '40px',
            fontFamily: 'Arial Black',
            color: '#ff3333',
            stroke: '#330000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, `Level ${gameState.level + 1}: ${LEVELS[gameState.level].name}`, {
            fontSize: '18px',
            color: '#aa6666'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 260, `Enemies Killed: ${gameState.enemiesKilled}`, {
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 350, 'Press SPACE to try again', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Phaser config
const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, VictoryScene, GameOverScene]
};

// Start game
const game = new Phaser.Game(config);
