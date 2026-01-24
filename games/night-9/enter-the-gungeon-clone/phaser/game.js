// Enter the Gungeon Clone - Phaser 3
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 16;

// Game constants
const FLOORS = [
    { name: 'Keep of the Lead Lord', rooms: 8, enemyLevel: 1, bossType: 'bulletKing' },
    { name: 'Gungeon Proper', rooms: 10, enemyLevel: 2, bossType: 'beholster' },
    { name: 'The Forge', rooms: 8, enemyLevel: 3, bossType: 'highDragun' }
];

const WEAPONS = {
    peashooter: { name: 'Pea Shooter', damage: 5, fireRate: 250, magSize: 999, spread: 0, type: 'semi', tier: 'D', color: 0x88ff88 },
    m1911: { name: 'M1911', damage: 8, fireRate: 200, magSize: 10, spread: 0.05, type: 'semi', tier: 'C', color: 0xcccccc },
    shotgun: { name: 'Shotgun', damage: 4, fireRate: 600, magSize: 8, pellets: 6, spread: 0.3, type: 'semi', tier: 'C', color: 0x996633 },
    ak47: { name: 'AK-47', damage: 6, fireRate: 100, magSize: 30, spread: 0.1, type: 'auto', tier: 'B', color: 0x8b4513 },
    demonHead: { name: 'Demon Head', damage: 25, fireRate: 800, magSize: 6, spread: 0, type: 'charged', homing: true, tier: 'B', color: 0xff3333 },
    railgun: { name: 'Railgun', damage: 80, fireRate: 1500, magSize: 3, spread: 0, type: 'charged', pierce: true, tier: 'A', color: 0x00ffff },
    machineGun: { name: 'Machine Pistol', damage: 4, fireRate: 80, magSize: 30, spread: 0.15, type: 'auto', tier: 'C', color: 0x666666 },
    crossbow: { name: 'Crossbow', damage: 12, fireRate: 800, magSize: 1, spread: 0, type: 'semi', pierce: true, tier: 'D', color: 0x8b4513 },
    hexagun: { name: 'Hexagun', damage: 10, fireRate: 300, magSize: 6, spread: 0.05, type: 'semi', tier: 'B', color: 0x9900ff },
    vulcan: { name: 'Vulcan', damage: 5, fireRate: 50, magSize: 200, spread: 0.2, type: 'auto', tier: 'A', color: 0x444444 }
};

const ENEMIES = {
    bulletKin: { hp: 15, damage: 1, speed: 60, fireRate: 1500, color: 0xffcc00, bulletSpeed: 150, pattern: 'single' },
    bandanaBullet: { hp: 15, damage: 1, speed: 50, fireRate: 1800, color: 0xff6600, bulletSpeed: 140, pattern: 'spread3' },
    shotgunKin: { hp: 25, damage: 1, speed: 40, fireRate: 2000, color: 0xff3333, bulletSpeed: 120, pattern: 'spread6' },
    veteranBullet: { hp: 20, damage: 1, speed: 70, fireRate: 1200, color: 0x00ff00, bulletSpeed: 180, pattern: 'single' },
    cardinal: { hp: 15, damage: 1, speed: 55, fireRate: 1600, color: 0xff0000, bulletSpeed: 160, pattern: 'cardinal' },
    shroomer: { hp: 20, damage: 1, speed: 45, fireRate: 1400, color: 0xff00ff, bulletSpeed: 130, pattern: 'spiral' },
    gunNut: { hp: 50, damage: 1, speed: 30, fireRate: 2500, color: 0x666666, bulletSpeed: 100, pattern: 'melee', shielded: true },
    gunjurer: { hp: 40, damage: 1, speed: 35, fireRate: 3000, color: 0x9900ff, bulletSpeed: 0, pattern: 'summon' },
    blobulon: { hp: 25, damage: 1, speed: 65, fireRate: 0, color: 0x00ff66, bulletSpeed: 0, pattern: 'chase', splits: true },
    grenadeKin: { hp: 20, damage: 2, speed: 50, fireRate: 2000, color: 0x339933, bulletSpeed: 100, pattern: 'grenade' }
};

const BOSSES = {
    bulletKing: { hp: 600, name: 'Bullet King', color: 0xffd700, size: 48 },
    beholster: { hp: 800, name: 'Beholster', color: 0x0066ff, size: 56 },
    highDragun: { hp: 1500, name: 'High Dragun', color: 0xff3300, size: 64 }
};

// Game state
let gameState = {
    hp: 6,
    maxHp: 6,
    armor: 0,
    blanks: 2,
    keys: 1,
    shells: 0,
    floor: 0,
    room: 0,
    weapons: ['peashooter'],
    currentWeapon: 0,
    ammo: { peashooter: 999 },
    dodgeRollCooldown: 0,
    isDodging: false,
    dodgeDirection: { x: 0, y: 0 },
    invincible: false,
    roomsCleared: 0,
    enemiesKilled: 0,
    activeItem: null,
    activeItemCharge: 0
};

// BootScene - Load assets
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x4488ff);
        g.fillRect(4, 4, 8, 12);
        g.fillStyle(0xffcc99);
        g.fillCircle(8, 4, 4);
        g.generateTexture('player', 16, 16);

        // Player dodging
        g.clear();
        g.fillStyle(0x4488ff, 0.5);
        g.fillEllipse(8, 8, 14, 8);
        g.generateTexture('playerDodge', 16, 16);

        // Bullet (player)
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(3, 3, 3);
        g.generateTexture('bullet', 6, 6);

        // Enemy bullet
        g.clear();
        g.fillStyle(0xff6600);
        g.fillCircle(4, 4, 4);
        g.generateTexture('enemyBullet', 8, 8);

        // Floor tile
        g.clear();
        g.fillStyle(0x333344);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x222233);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(0x555566);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x444455);
        g.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door
        g.clear();
        g.fillStyle(0x886644);
        g.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE);
        g.fillStyle(0x664422);
        g.fillRect(4, 2, 8, TILE_SIZE - 4);
        g.fillRect(TILE_SIZE + 4, 2, 8, TILE_SIZE - 4);
        g.generateTexture('door', TILE_SIZE * 2, TILE_SIZE);

        // Door closed
        g.clear();
        g.fillStyle(0x444444);
        g.fillRect(0, 0, TILE_SIZE * 2, TILE_SIZE);
        g.lineStyle(2, 0x666666);
        g.strokeRect(2, 2, TILE_SIZE * 2 - 4, TILE_SIZE - 4);
        g.generateTexture('doorClosed', TILE_SIZE * 2, TILE_SIZE);

        // Heart
        g.clear();
        g.fillStyle(0xff3333);
        g.fillCircle(5, 6, 5);
        g.fillCircle(11, 6, 5);
        g.fillTriangle(0, 8, 8, 16, 16, 8);
        g.generateTexture('heart', 16, 16);

        // Half heart
        g.clear();
        g.fillStyle(0xff3333);
        g.fillCircle(5, 6, 5);
        g.fillTriangle(0, 8, 8, 16, 8, 8);
        g.fillStyle(0x333333);
        g.fillCircle(11, 6, 5);
        g.fillTriangle(8, 8, 8, 16, 16, 8);
        g.generateTexture('halfHeart', 16, 16);

        // Empty heart
        g.clear();
        g.lineStyle(2, 0xff3333);
        g.strokeCircle(5, 6, 4);
        g.strokeCircle(11, 6, 4);
        g.generateTexture('emptyHeart', 16, 16);

        // Armor
        g.clear();
        g.fillStyle(0x6699ff);
        g.fillRect(2, 4, 12, 10);
        g.fillStyle(0x4477dd);
        g.fillRect(4, 6, 8, 6);
        g.generateTexture('armor', 16, 16);

        // Blank
        g.clear();
        g.fillStyle(0x3399ff);
        g.fillCircle(8, 8, 7);
        g.fillStyle(0x66ccff);
        g.fillCircle(6, 6, 3);
        g.generateTexture('blank', 16, 16);

        // Key
        g.clear();
        g.fillStyle(0xffcc00);
        g.fillCircle(6, 4, 4);
        g.fillRect(4, 4, 4, 10);
        g.fillRect(4, 10, 6, 2);
        g.fillRect(4, 14, 4, 2);
        g.generateTexture('key', 16, 16);

        // Shell (currency)
        g.clear();
        g.fillStyle(0xffdd44);
        g.fillCircle(6, 6, 5);
        g.fillStyle(0xffee88);
        g.fillCircle(5, 5, 2);
        g.generateTexture('shell', 12, 12);

        // Chest
        g.clear();
        g.fillStyle(0x886633);
        g.fillRect(0, 4, 24, 16);
        g.fillStyle(0xaa8844);
        g.fillRect(2, 0, 20, 6);
        g.fillStyle(0xffcc00);
        g.fillRect(10, 8, 4, 4);
        g.generateTexture('chest', 24, 20);

        // Table
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 4, 32, 20);
        g.fillStyle(0x6b3503);
        g.fillRect(2, 22, 4, 6);
        g.fillRect(26, 22, 4, 6);
        g.generateTexture('table', 32, 28);

        // Flipped table
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 8, 32, 8);
        g.fillStyle(0x6b3503);
        g.fillRect(0, 0, 32, 10);
        g.generateTexture('tableFlipped', 32, 16);

        // Barrel
        g.clear();
        g.fillStyle(0x664422);
        g.fillRect(4, 0, 16, 24);
        g.fillStyle(0x886644);
        g.fillRect(6, 2, 12, 4);
        g.fillRect(6, 18, 12, 4);
        g.fillStyle(0x444444);
        g.fillRect(4, 8, 16, 3);
        g.fillRect(4, 14, 16, 3);
        g.generateTexture('barrel', 24, 24);

        // Crate
        g.clear();
        g.fillStyle(0x8b6914);
        g.fillRect(0, 0, 20, 20);
        g.lineStyle(2, 0x5a4510);
        g.strokeRect(1, 1, 18, 18);
        g.lineBetween(0, 10, 20, 10);
        g.lineBetween(10, 0, 10, 20);
        g.generateTexture('crate', 20, 20);

        // Pillar
        g.clear();
        g.fillStyle(0x666677);
        g.fillRect(4, 0, 24, 32);
        g.fillStyle(0x555566);
        g.fillRect(0, 0, 32, 8);
        g.fillRect(0, 24, 32, 8);
        g.generateTexture('pillar', 32, 32);

        // Enemy textures (bullet-shaped)
        Object.keys(ENEMIES).forEach(key => {
            const enemy = ENEMIES[key];
            g.clear();
            g.fillStyle(enemy.color);
            // Bullet body shape
            g.fillRoundedRect(2, 6, 12, 10, 4);
            g.fillCircle(8, 6, 6);
            // Face
            g.fillStyle(0x000000);
            g.fillCircle(5, 5, 2);
            g.fillCircle(11, 5, 2);
            g.generateTexture('enemy_' + key, 16, 16);
        });

        // Boss textures
        Object.keys(BOSSES).forEach(key => {
            const boss = BOSSES[key];
            g.clear();
            g.fillStyle(boss.color);
            if (key === 'bulletKing') {
                // Crown and bullet body
                g.fillRect(boss.size/4, boss.size/2, boss.size/2, boss.size/2);
                g.fillCircle(boss.size/2, boss.size/2, boss.size/3);
                g.fillStyle(0xffff00);
                g.fillRect(boss.size/4, boss.size/4, boss.size/2, boss.size/6);
                g.fillTriangle(boss.size/4, boss.size/4, boss.size/3, boss.size/8, boss.size*2/5, boss.size/4);
                g.fillTriangle(boss.size/2, boss.size/4, boss.size/2, boss.size/8, boss.size*3/5, boss.size/4);
                g.fillTriangle(boss.size*3/4, boss.size/4, boss.size*2/3, boss.size/8, boss.size*3/5, boss.size/4);
            } else if (key === 'beholster') {
                // Big eye with tentacles
                g.fillCircle(boss.size/2, boss.size/2, boss.size/2.5);
                g.fillStyle(0xffffff);
                g.fillCircle(boss.size/2, boss.size/2, boss.size/4);
                g.fillStyle(0xff0000);
                g.fillCircle(boss.size/2, boss.size/2, boss.size/8);
                // Tentacles
                g.fillStyle(boss.color);
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + Math.PI/2;
                    const x = boss.size/2 + Math.cos(angle) * boss.size/3;
                    const y = boss.size/2 + Math.sin(angle) * boss.size/3;
                    g.fillCircle(x, y, 6);
                }
            } else if (key === 'highDragun') {
                // Dragon head
                g.fillRoundedRect(boss.size/6, boss.size/4, boss.size*2/3, boss.size/2, 8);
                g.fillStyle(0xff6600);
                g.fillTriangle(boss.size/6, boss.size/4, 0, 0, boss.size/3, boss.size/4);
                g.fillTriangle(boss.size*5/6, boss.size/4, boss.size, 0, boss.size*2/3, boss.size/4);
                g.fillStyle(0xffff00);
                g.fillCircle(boss.size/3, boss.size/2, 6);
                g.fillCircle(boss.size*2/3, boss.size/2, 6);
                g.fillStyle(0x000000);
                g.fillCircle(boss.size/3, boss.size/2, 3);
                g.fillCircle(boss.size*2/3, boss.size/2, 3);
            }
            g.generateTexture('boss_' + key, boss.size, boss.size);
        });

        // Weapon icons
        Object.keys(WEAPONS).forEach(key => {
            const weapon = WEAPONS[key];
            g.clear();
            g.fillStyle(weapon.color);
            g.fillRect(0, 6, 20, 8);
            g.fillRect(16, 4, 4, 12);
            g.fillStyle(0x333333);
            g.fillRect(6, 8, 8, 4);
            g.generateTexture('weapon_' + key, 24, 16);
        });

        // Ammo pickup
        g.clear();
        g.fillStyle(0x996633);
        g.fillRect(0, 2, 12, 10);
        g.fillStyle(0xffcc00);
        g.fillRect(2, 0, 8, 4);
        g.generateTexture('ammoPickup', 12, 12);

        // Health pickup
        g.clear();
        g.fillStyle(0xff3333);
        g.fillRect(4, 0, 4, 12);
        g.fillRect(0, 4, 12, 4);
        g.generateTexture('healthPickup', 12, 12);

        // Explosion
        g.clear();
        g.fillStyle(0xff6600, 0.8);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xffff00, 0.6);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(16, 16, 5);
        g.generateTexture('explosion', 32, 32);

        // Muzzle flash
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xffffff);
        g.fillCircle(6, 6, 3);
        g.generateTexture('muzzleFlash', 12, 12);

        // Blank effect
        g.clear();
        g.fillStyle(0x66ccff, 0.5);
        g.fillCircle(64, 64, 64);
        g.strokeStyle = 0xffffff;
        g.lineStyle(4, 0xffffff);
        g.strokeCircle(64, 64, 50);
        g.generateTexture('blankEffect', 128, 128);

        g.destroy();
    }
}

// MenuScene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x111122);

        // Title
        this.add.text(GAME_WIDTH / 2, 120, 'ENTER THE GUNGEON', {
            fontSize: '40px',
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 170, 'CLONE', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff6600'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'Space - Dodge Roll',
            'R - Reload',
            'E - Use Blank',
            '1-0 - Switch Weapons',
            'Q - Debug Overlay'
        ];

        instructions.forEach((text, i) => {
            this.add.text(GAME_WIDTH / 2, 240 + i * 28, text, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        // Start prompt
        this.add.text(GAME_WIDTH / 2, 520, 'PRESS SPACE TO ENTER', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.resetGameState();
            this.scene.start('GameScene');
        });
    }

    resetGameState() {
        gameState = {
            hp: 6,
            maxHp: 6,
            armor: 0,
            blanks: 2,
            keys: 1,
            shells: 0,
            floor: 0,
            room: 0,
            weapons: ['peashooter'],
            currentWeapon: 0,
            ammo: { peashooter: 999 },
            dodgeRollCooldown: 0,
            isDodging: false,
            dodgeDirection: { x: 0, y: 0 },
            invincible: false,
            roomsCleared: 0,
            enemiesKilled: 0,
            activeItem: null,
            activeItemCharge: 0
        };
    }
}

// GameScene - Main gameplay
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.roomWidth = 25;
        this.roomHeight = 15;
        this.offsetX = (GAME_WIDTH - this.roomWidth * TILE_SIZE) / 2;
        this.offsetY = 50;

        this.floorData = FLOORS[gameState.floor];

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.objects = this.physics.add.staticGroup();

        // Generate room
        this.generateRoom();

        // Create player
        this.createPlayer();

        // Input
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            dodge: 'SPACE',
            reload: 'R',
            blank: 'E',
            debug: 'Q'
        });

        // Weapon keys
        for (let i = 0; i < 10; i++) {
            this.input.keyboard.on('keydown-' + (i === 0 ? 'ZERO' : 'ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE'.split(' ')[i - 1]), () => {
                if (i < gameState.weapons.length) {
                    gameState.currentWeapon = i;
                }
            });
        }

        // Shooting
        this.input.on('pointerdown', () => {
            this.isFiring = true;
        });
        this.input.on('pointerup', () => {
            this.isFiring = false;
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.playerHit, null, this);
        this.physics.add.overlap(this.enemyBullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.bullets, this.objects, this.bulletHitObject, null, this);
        this.physics.add.collider(this.player, this.objects);
        this.physics.add.collider(this.enemies, this.objects);

        // HUD
        this.createHUD();

        // Debug
        this.debugOverlay = null;
        this.debugVisible = false;

        this.lastFireTime = 0;
        this.isFiring = false;
        this.roomCleared = false;
    }

    createPlayer() {
        const startX = this.offsetX + this.roomWidth * TILE_SIZE / 2;
        const startY = this.offsetY + this.roomHeight * TILE_SIZE - 40;

        this.player = this.physics.add.sprite(startX, startY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
    }

    generateRoom() {
        // Clear existing
        this.walls.clear(true, true);
        this.doors.clear(true, true);
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);
        this.objects.clear(true, true);
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);

        // Floor tiles
        for (let y = 0; y < this.roomHeight; y++) {
            for (let x = 0; x < this.roomWidth; x++) {
                const tx = this.offsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const ty = this.offsetY + y * TILE_SIZE + TILE_SIZE / 2;
                this.add.image(tx, ty, 'floor').setDepth(0);
            }
        }

        // Walls
        for (let x = 0; x < this.roomWidth; x++) {
            this.walls.create(this.offsetX + x * TILE_SIZE + TILE_SIZE / 2, this.offsetY + TILE_SIZE / 2, 'wall');
            this.walls.create(this.offsetX + x * TILE_SIZE + TILE_SIZE / 2, this.offsetY + (this.roomHeight - 1) * TILE_SIZE + TILE_SIZE / 2, 'wall');
        }
        for (let y = 1; y < this.roomHeight - 1; y++) {
            this.walls.create(this.offsetX + TILE_SIZE / 2, this.offsetY + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
            this.walls.create(this.offsetX + (this.roomWidth - 1) * TILE_SIZE + TILE_SIZE / 2, this.offsetY + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
        }

        // Door at top
        const doorX = this.offsetX + this.roomWidth * TILE_SIZE / 2;
        const doorY = this.offsetY + TILE_SIZE / 2;
        this.doorSprite = this.add.image(doorX, doorY, 'doorClosed').setDepth(1);
        this.doorZone = this.physics.add.sprite(doorX, doorY - 8, null);
        this.doorZone.setSize(32, 16);
        this.doorZone.setVisible(false);

        // Room objects (cover)
        this.spawnRoomObjects();

        // Enemies
        if (gameState.room < this.floorData.rooms - 1) {
            this.spawnEnemies();
        }

        this.roomCleared = this.enemies.countActive() === 0;
        this.updateDoors();
    }

    spawnRoomObjects() {
        const objectCount = Phaser.Math.Between(4, 8);

        for (let i = 0; i < objectCount; i++) {
            const x = this.offsetX + Phaser.Math.Between(3, this.roomWidth - 4) * TILE_SIZE;
            const y = this.offsetY + Phaser.Math.Between(3, this.roomHeight - 4) * TILE_SIZE;

            const type = Phaser.Math.Between(0, 3);
            let obj;

            if (type === 0) {
                obj = this.objects.create(x, y, 'pillar');
                obj.objType = 'pillar';
            } else if (type === 1) {
                obj = this.objects.create(x, y, 'crate');
                obj.hp = 20;
                obj.objType = 'crate';
            } else if (type === 2) {
                obj = this.objects.create(x, y, 'barrel');
                obj.hp = 10;
                obj.objType = 'barrel';
                obj.explosive = true;
            } else {
                obj = this.objects.create(x, y, 'table');
                obj.objType = 'table';
                obj.flipped = false;
            }
        }
    }

    spawnEnemies() {
        const enemyCount = 3 + gameState.room + gameState.floor * 2;
        const enemyTypes = this.getEnemyTypesForFloor();

        for (let i = 0; i < enemyCount; i++) {
            const type = Phaser.Utils.Array.GetRandom(enemyTypes);
            const data = ENEMIES[type];

            const x = this.offsetX + Phaser.Math.Between(4, this.roomWidth - 5) * TILE_SIZE;
            const y = this.offsetY + Phaser.Math.Between(3, this.roomHeight - 5) * TILE_SIZE;

            const enemy = this.enemies.create(x, y, 'enemy_' + type);
            enemy.enemyType = type;
            enemy.hp = data.hp;
            enemy.damage = data.damage;
            enemy.speed = data.speed;
            enemy.fireRate = data.fireRate;
            enemy.bulletSpeed = data.bulletSpeed;
            enemy.pattern = data.pattern;
            enemy.shielded = data.shielded || false;
            enemy.splits = data.splits || false;
            enemy.lastFireTime = 0;
            enemy.setDepth(8);
        }
    }

    getEnemyTypesForFloor() {
        if (gameState.floor === 0) {
            return ['bulletKin', 'bandanaBullet', 'shotgunKin', 'cardinal', 'blobulon'];
        } else if (gameState.floor === 1) {
            return ['veteranBullet', 'shotgunKin', 'gunNut', 'gunjurer', 'shroomer'];
        } else {
            return ['veteranBullet', 'gunNut', 'grenadeKin', 'shroomer', 'gunjurer'];
        }
    }

    update(time, delta) {
        if (gameState.hp <= 0) {
            this.scene.start('GameOverScene');
            return;
        }

        this.handleMovement(delta);
        this.handleDodgeRoll(time, delta);
        this.handleShooting(time);
        this.updateEnemies(time);
        this.checkRoomCleared();
        this.checkDoorTransition();
        this.updateHUD();
        this.updateDebug();

        // Blank
        if (Phaser.Input.Keyboard.JustDown(this.keys.blank) && gameState.blanks > 0) {
            this.useBlank();
        }

        // Debug toggle
        if (Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
            this.debugVisible = !this.debugVisible;
        }
    }

    handleMovement(delta) {
        if (gameState.isDodging) return;

        let vx = 0;
        let vy = 0;
        const speed = 180;

        if (this.keys.up.isDown) vy = -speed;
        if (this.keys.down.isDown) vy = speed;
        if (this.keys.left.isDown) vx = -speed;
        if (this.keys.right.isDown) vx = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Face mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.setFlipX(pointer.x < this.player.x);
    }

    handleDodgeRoll(time, delta) {
        if (gameState.dodgeRollCooldown > 0) {
            gameState.dodgeRollCooldown -= delta;
        }

        if (gameState.isDodging) {
            this.player.setVelocity(
                gameState.dodgeDirection.x * 400,
                gameState.dodgeDirection.y * 400
            );

            if (time > gameState.dodgeEndTime) {
                gameState.isDodging = false;
                gameState.invincible = false;
                this.player.setTexture('player');
                this.player.setAlpha(1);
            } else if (time > gameState.dodgeEndTime - 350) {
                // I-frames end halfway through
                gameState.invincible = false;
            }
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.dodge) && gameState.dodgeRollCooldown <= 0) {
            let dx = 0;
            let dy = 0;

            if (this.keys.up.isDown) dy = -1;
            if (this.keys.down.isDown) dy = 1;
            if (this.keys.left.isDown) dx = -1;
            if (this.keys.right.isDown) dx = 1;

            if (dx === 0 && dy === 0) {
                // Dodge toward mouse
                const pointer = this.input.activePointer;
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }

            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            gameState.isDodging = true;
            gameState.invincible = true;
            gameState.dodgeDirection = { x: dx, y: dy };
            gameState.dodgeEndTime = time + 700;
            gameState.dodgeRollCooldown = 1000;

            this.player.setTexture('playerDodge');
            this.player.setAlpha(0.7);
        }
    }

    handleShooting(time) {
        if (!this.isFiring || gameState.isDodging) return;

        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];

        if (time - this.lastFireTime < weapon.fireRate) return;

        // Check ammo
        if (gameState.ammo[weaponName] <= 0) {
            // Auto reload
            this.reload();
            return;
        }

        this.lastFireTime = time;
        gameState.ammo[weaponName]--;

        const pointer = this.input.activePointer;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = weapon.spread * (Math.random() - 0.5);
            const angle = baseAngle + spread;

            const bullet = this.bullets.create(
                this.player.x + Math.cos(angle) * 16,
                this.player.y + Math.sin(angle) * 16,
                'bullet'
            );
            bullet.setRotation(angle);
            bullet.damage = weapon.damage;
            bullet.pierce = weapon.pierce || false;
            bullet.homing = weapon.homing || false;
            bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
            bullet.setDepth(9);

            // Auto-destroy after range
            this.time.delayedCall(800, () => {
                if (bullet.active) bullet.destroy();
            });
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
        gameState.ammo[weaponName] = weapon.magSize;
    }

    updateEnemies(time) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            // Move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (enemy.pattern !== 'melee' || dist > 40) {
                enemy.setVelocity(
                    Math.cos(angle) * enemy.speed,
                    Math.sin(angle) * enemy.speed
                );
            } else {
                enemy.setVelocity(0, 0);
            }

            // Shooting
            if (time - enemy.lastFireTime > enemy.fireRate && enemy.bulletSpeed > 0) {
                enemy.lastFireTime = time;
                this.enemyShoot(enemy, angle);
            }

            // Summoner behavior
            if (enemy.pattern === 'summon' && time - enemy.lastFireTime > enemy.fireRate) {
                enemy.lastFireTime = time;
                this.spawnSingleEnemy('bulletKin', enemy.x + Phaser.Math.Between(-30, 30), enemy.y + Phaser.Math.Between(-30, 30));
            }
        });
    }

    enemyShoot(enemy, angle) {
        switch (enemy.pattern) {
            case 'single':
                this.createEnemyBullet(enemy.x, enemy.y, angle, enemy.bulletSpeed);
                break;
            case 'spread3':
                for (let i = -1; i <= 1; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, angle + i * 0.2, enemy.bulletSpeed);
                }
                break;
            case 'spread6':
                for (let i = -2; i <= 3; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, angle + i * 0.15, enemy.bulletSpeed);
                }
                break;
            case 'cardinal':
                for (let i = 0; i < 4; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, i * Math.PI / 2, enemy.bulletSpeed);
                }
                break;
            case 'spiral':
                const spiralAngle = (Date.now() / 100) % (Math.PI * 2);
                for (let i = 0; i < 4; i++) {
                    this.createEnemyBullet(enemy.x, enemy.y, spiralAngle + i * Math.PI / 2, enemy.bulletSpeed);
                }
                break;
            case 'grenade':
                const grenade = this.createEnemyBullet(enemy.x, enemy.y, angle, enemy.bulletSpeed * 0.8);
                grenade.isGrenade = true;
                this.time.delayedCall(1500, () => {
                    if (grenade.active) {
                        this.createExplosion(grenade.x, grenade.y);
                        grenade.destroy();
                    }
                });
                break;
        }
    }

    createEnemyBullet(x, y, angle, speed) {
        const bullet = this.enemyBullets.create(x, y, 'enemyBullet');
        bullet.setRotation(angle);
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setDepth(9);

        this.time.delayedCall(3000, () => {
            if (bullet.active) bullet.destroy();
        });

        return bullet;
    }

    createExplosion(x, y) {
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.setDepth(15);

        // Damage player if nearby
        const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (dist < 40 && !gameState.invincible) {
            this.damagePlayer(2);
        }

        // Damage enemies nearby
        this.enemies.getChildren().forEach(enemy => {
            const eDist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (eDist < 50) {
                enemy.hp -= 30;
                if (enemy.hp <= 0) {
                    this.killEnemy(enemy);
                }
            }
        });

        this.time.delayedCall(200, () => explosion.destroy());
    }

    spawnSingleEnemy(type, x, y) {
        const data = ENEMIES[type];
        const enemy = this.enemies.create(x, y, 'enemy_' + type);
        enemy.enemyType = type;
        enemy.hp = data.hp;
        enemy.damage = data.damage;
        enemy.speed = data.speed;
        enemy.fireRate = data.fireRate;
        enemy.bulletSpeed = data.bulletSpeed;
        enemy.pattern = data.pattern;
        enemy.lastFireTime = 0;
        enemy.setDepth(8);
    }

    bulletHitEnemy(bullet, enemy) {
        if (enemy.shielded) {
            // Check if hitting from front
            const bulletAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
            const enemyAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const diff = Math.abs(Phaser.Math.Angle.Wrap(bulletAngle - enemyAngle + Math.PI));

            if (diff < Math.PI / 2) {
                bullet.destroy();
                return;
            }
        }

        enemy.hp -= bullet.damage;

        if (!bullet.pierce) {
            bullet.destroy();
        }

        // Damage flash
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

        // Drops
        if (Math.random() < 0.3) {
            const dropType = Math.random() < 0.5 ? 'shell' : (Math.random() < 0.5 ? 'ammoPickup' : 'healthPickup');
            const pickup = this.pickups.create(enemy.x, enemy.y, dropType);
            pickup.pickupType = dropType;
            pickup.setDepth(5);
        }

        // Splitting enemies
        if (enemy.splits) {
            for (let i = 0; i < 2; i++) {
                this.spawnSingleEnemy('bulletKin',
                    enemy.x + Phaser.Math.Between(-20, 20),
                    enemy.y + Phaser.Math.Between(-20, 20)
                );
            }
        }

        enemy.destroy();
    }

    bulletHitWall(bullet) {
        bullet.destroy();
    }

    bulletHitObject(bullet, obj) {
        if (obj.objType === 'pillar') {
            bullet.destroy();
            return;
        }

        if (obj.hp !== undefined) {
            obj.hp -= bullet.damage;
            bullet.destroy();

            if (obj.hp <= 0) {
                if (obj.explosive) {
                    this.createExplosion(obj.x, obj.y);
                }
                obj.destroy();
            }
        }
    }

    playerHit(player, bullet) {
        if (gameState.invincible) return;

        bullet.destroy();
        this.damagePlayer(1);
    }

    damagePlayer(amount) {
        if (gameState.invincible) return;

        if (gameState.armor > 0) {
            gameState.armor -= amount;
            if (gameState.armor < 0) {
                gameState.hp += gameState.armor;
                gameState.armor = 0;
            }
        } else {
            gameState.hp -= amount;
        }

        // I-frames
        gameState.invincible = true;
        this.player.setTint(0xff0000);

        this.time.delayedCall(1000, () => {
            gameState.invincible = false;
            this.player.clearTint();
        });

        // Flash
        this.tweens.add({
            targets: this.player,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 4
        });
    }

    collectPickup(player, pickup) {
        switch (pickup.pickupType) {
            case 'shell':
                gameState.shells += Phaser.Math.Between(1, 5);
                break;
            case 'ammoPickup':
                const weaponName = gameState.weapons[gameState.currentWeapon];
                const weapon = WEAPONS[weaponName];
                gameState.ammo[weaponName] = Math.min(
                    gameState.ammo[weaponName] + Math.floor(weapon.magSize * 0.5),
                    weapon.magSize * 3
                );
                break;
            case 'healthPickup':
                gameState.hp = Math.min(gameState.hp + 2, gameState.maxHp);
                break;
            case 'key':
                gameState.keys++;
                break;
            case 'blank':
                gameState.blanks++;
                break;
        }
        pickup.destroy();
    }

    useBlank() {
        gameState.blanks--;

        // Visual effect
        const blankFx = this.add.sprite(this.player.x, this.player.y, 'blankEffect');
        blankFx.setDepth(20);
        blankFx.setScale(0.5);

        this.tweens.add({
            targets: blankFx,
            scale: 4,
            alpha: 0,
            duration: 500,
            onComplete: () => blankFx.destroy()
        });

        // Clear all enemy bullets
        this.enemyBullets.clear(true, true);

        // Stun enemies briefly
        this.enemies.getChildren().forEach(enemy => {
            enemy.setVelocity(0, 0);
            enemy.lastFireTime = Date.now() + 1000;
        });
    }

    checkRoomCleared() {
        if (!this.roomCleared && this.enemies.countActive() === 0) {
            this.roomCleared = true;
            gameState.roomsCleared++;
            this.updateDoors();

            // Spawn rewards
            if (Math.random() < 0.3) {
                const pickup = this.pickups.create(
                    this.offsetX + this.roomWidth * TILE_SIZE / 2,
                    this.offsetY + this.roomHeight * TILE_SIZE / 2,
                    Math.random() < 0.5 ? 'shell' : 'ammoPickup'
                );
                pickup.pickupType = Math.random() < 0.5 ? 'shell' : 'ammoPickup';
                pickup.setDepth(5);
            }
        }
    }

    updateDoors() {
        if (this.roomCleared) {
            this.doorSprite.setTexture('door');
        } else {
            this.doorSprite.setTexture('doorClosed');
        }
    }

    checkDoorTransition() {
        if (!this.roomCleared) return;

        const doorDist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.doorSprite.x, this.doorSprite.y
        );

        if (doorDist < 30) {
            gameState.room++;

            if (gameState.room >= this.floorData.rooms) {
                // Boss room
                this.scene.start('BossScene');
            } else {
                // Next room
                this.generateRoom();
                this.player.setPosition(
                    this.offsetX + this.roomWidth * TILE_SIZE / 2,
                    this.offsetY + this.roomHeight * TILE_SIZE - 40
                );
            }
        }
    }

    createHUD() {
        // Hearts
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(24 + i * 20, 20, 'heart').setScrollFactor(0).setDepth(100);
            this.hearts.push(heart);
        }

        // Armor
        this.armorIcons = [];
        for (let i = 0; i < 3; i++) {
            const armor = this.add.image(90 + i * 20, 20, 'armor').setScrollFactor(0).setDepth(100).setVisible(false);
            this.armorIcons.push(armor);
        }

        // Blanks
        this.blankIcon = this.add.image(24, 44, 'blank').setScrollFactor(0).setDepth(100);
        this.blankText = this.add.text(40, 36, 'x2', { fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(100);

        // Keys
        this.keyIcon = this.add.image(80, 44, 'key').setScrollFactor(0).setDepth(100);
        this.keyText = this.add.text(96, 36, 'x1', { fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(100);

        // Shells
        this.shellIcon = this.add.image(140, 44, 'shell').setScrollFactor(0).setDepth(100);
        this.shellText = this.add.text(156, 36, '0', { fontSize: '14px', color: '#ffdd44' }).setScrollFactor(0).setDepth(100);

        // Weapon
        this.weaponText = this.add.text(GAME_WIDTH - 150, GAME_HEIGHT - 30, '', {
            fontSize: '14px',
            color: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        // Ammo
        this.ammoText = this.add.text(GAME_WIDTH - 50, GAME_HEIGHT - 30, '', {
            fontSize: '14px',
            color: '#ffcc00'
        }).setScrollFactor(0).setDepth(100);

        // Floor
        this.floorText = this.add.text(GAME_WIDTH / 2, 16, '', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

        // Room counter
        this.roomText = this.add.text(GAME_WIDTH - 80, 16, '', {
            fontSize: '12px',
            color: '#666666'
        }).setScrollFactor(0).setDepth(100);
    }

    updateHUD() {
        // Hearts
        for (let i = 0; i < this.hearts.length; i++) {
            const heartHP = (i + 1) * 2;
            if (gameState.hp >= heartHP) {
                this.hearts[i].setTexture('heart');
            } else if (gameState.hp >= heartHP - 1) {
                this.hearts[i].setTexture('halfHeart');
            } else {
                this.hearts[i].setTexture('emptyHeart');
            }
        }

        // Armor
        for (let i = 0; i < this.armorIcons.length; i++) {
            this.armorIcons[i].setVisible(i < gameState.armor);
        }

        // Blanks
        this.blankText.setText('x' + gameState.blanks);

        // Keys
        this.keyText.setText('x' + gameState.keys);

        // Shells
        this.shellText.setText(gameState.shells.toString());

        // Weapon
        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];
        this.weaponText.setText(weapon.name);

        // Ammo
        const ammo = gameState.ammo[weaponName];
        this.ammoText.setText(ammo + '/' + weapon.magSize);

        // Floor
        this.floorText.setText(this.floorData.name);

        // Room
        this.roomText.setText('Room ' + (gameState.room + 1) + '/' + this.floorData.rooms);
    }

    updateDebug() {
        if (this.debugVisible) {
            if (!this.debugOverlay) {
                this.debugOverlay = this.add.text(GAME_WIDTH - 200, 60, '', {
                    fontSize: '12px',
                    color: '#00ff00',
                    backgroundColor: '#000000aa'
                }).setScrollFactor(0).setDepth(200);
            }

            const weaponName = gameState.weapons[gameState.currentWeapon];
            this.debugOverlay.setText([
                '=== DEBUG (Q to hide) ===',
                `Player: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
                `HP: ${gameState.hp}/${gameState.maxHp}`,
                `Armor: ${gameState.armor}`,
                `Floor: ${gameState.floor + 1}/${FLOORS.length}`,
                `Room: ${gameState.room + 1}/${this.floorData.rooms}`,
                '',
                `Weapon: ${weaponName}`,
                `Ammo: ${gameState.ammo[weaponName]}`,
                `Enemies: ${this.enemies.countActive()}`,
                `Bullets: ${this.bullets.countActive()}`,
                `Enemy Bullets: ${this.enemyBullets.countActive()}`,
                `Dodging: ${gameState.isDodging}`,
                `Invincible: ${gameState.invincible}`,
                `Kills: ${gameState.enemiesKilled}`,
                `FPS: ${Math.floor(this.game.loop.actualFps)}`
            ].join('\n'));
            this.debugOverlay.setVisible(true);
        } else if (this.debugOverlay) {
            this.debugOverlay.setVisible(false);
        }
    }
}

// BossScene
class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    create() {
        this.floorData = FLOORS[gameState.floor];
        const bossData = BOSSES[this.floorData.bossType];

        // Room setup
        this.roomWidth = 20;
        this.roomHeight = 15;
        this.offsetX = (GAME_WIDTH - this.roomWidth * TILE_SIZE) / 2;
        this.offsetY = 60;

        // Floor
        for (let y = 0; y < this.roomHeight; y++) {
            for (let x = 0; x < this.roomWidth; x++) {
                const tx = this.offsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const ty = this.offsetY + y * TILE_SIZE + TILE_SIZE / 2;
                this.add.image(tx, ty, 'floor').setDepth(0);
            }
        }

        // Walls
        this.walls = this.physics.add.staticGroup();
        for (let x = 0; x < this.roomWidth; x++) {
            this.walls.create(this.offsetX + x * TILE_SIZE + TILE_SIZE / 2, this.offsetY + TILE_SIZE / 2, 'wall');
            this.walls.create(this.offsetX + x * TILE_SIZE + TILE_SIZE / 2, this.offsetY + (this.roomHeight - 1) * TILE_SIZE + TILE_SIZE / 2, 'wall');
        }
        for (let y = 1; y < this.roomHeight - 1; y++) {
            this.walls.create(this.offsetX + TILE_SIZE / 2, this.offsetY + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
            this.walls.create(this.offsetX + (this.roomWidth - 1) * TILE_SIZE + TILE_SIZE / 2, this.offsetY + y * TILE_SIZE + TILE_SIZE / 2, 'wall');
        }

        // Boss
        this.boss = this.physics.add.sprite(
            GAME_WIDTH / 2,
            this.offsetY + 80,
            'boss_' + this.floorData.bossType
        );
        this.boss.hp = bossData.hp;
        this.boss.maxHp = bossData.hp;
        this.boss.bossType = this.floorData.bossType;
        this.boss.setDepth(8);
        this.boss.lastAttackTime = 0;
        this.boss.attackPhase = 0;

        // Player
        this.player = this.physics.add.sprite(
            GAME_WIDTH / 2,
            this.offsetY + this.roomHeight * TILE_SIZE - 50,
            'player'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.overlap(this.bullets, this.boss, this.bulletHitBoss, null, this);
        this.physics.add.overlap(this.bullets, this.walls, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.playerHit, null, this);
        this.physics.add.overlap(this.enemyBullets, this.walls, (b) => b.destroy(), null, this);

        // Input
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            dodge: 'SPACE', blank: 'E', debug: 'Q'
        });

        this.input.on('pointerdown', () => this.isFiring = true);
        this.input.on('pointerup', () => this.isFiring = false);

        // HUD
        this.createHUD();

        // Boss intro
        this.add.text(GAME_WIDTH / 2, 30, bossData.name, {
            fontSize: '24px',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.lastFireTime = 0;
        this.isFiring = false;
        this.debugVisible = false;
    }

    update(time, delta) {
        if (gameState.hp <= 0) {
            this.scene.start('GameOverScene');
            return;
        }

        if (this.boss.hp <= 0) {
            this.bossDefeated();
            return;
        }

        this.handleMovement(delta);
        this.handleDodgeRoll(time, delta);
        this.handleShooting(time);
        this.updateBoss(time);
        this.updateHUD();

        if (Phaser.Input.Keyboard.JustDown(this.keys.blank) && gameState.blanks > 0) {
            this.useBlank();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
            this.debugVisible = !this.debugVisible;
            if (this.debugText) this.debugText.setVisible(this.debugVisible);
        }
    }

    handleMovement(delta) {
        if (gameState.isDodging) return;

        let vx = 0, vy = 0;
        const speed = 180;

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

    handleDodgeRoll(time, delta) {
        if (gameState.dodgeRollCooldown > 0) {
            gameState.dodgeRollCooldown -= delta;
        }

        if (gameState.isDodging) {
            this.player.setVelocity(
                gameState.dodgeDirection.x * 400,
                gameState.dodgeDirection.y * 400
            );

            if (time > gameState.dodgeEndTime) {
                gameState.isDodging = false;
                gameState.invincible = false;
                this.player.setTexture('player');
                this.player.setAlpha(1);
            } else if (time > gameState.dodgeEndTime - 350) {
                gameState.invincible = false;
            }
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.dodge) && gameState.dodgeRollCooldown <= 0) {
            let dx = 0, dy = 0;

            if (this.keys.up.isDown) dy = -1;
            if (this.keys.down.isDown) dy = 1;
            if (this.keys.left.isDown) dx = -1;
            if (this.keys.right.isDown) dx = 1;

            if (dx === 0 && dy === 0) {
                const pointer = this.input.activePointer;
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
                dx = Math.cos(angle);
                dy = Math.sin(angle);
            }

            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            gameState.isDodging = true;
            gameState.invincible = true;
            gameState.dodgeDirection = { x: dx, y: dy };
            gameState.dodgeEndTime = time + 700;
            gameState.dodgeRollCooldown = 1000;

            this.player.setTexture('playerDodge');
            this.player.setAlpha(0.7);
        }
    }

    handleShooting(time) {
        if (!this.isFiring || gameState.isDodging) return;

        const weaponName = gameState.weapons[gameState.currentWeapon];
        const weapon = WEAPONS[weaponName];

        if (time - this.lastFireTime < weapon.fireRate) return;
        if (gameState.ammo[weaponName] <= 0) {
            gameState.ammo[weaponName] = weapon.magSize;
            return;
        }

        this.lastFireTime = time;
        gameState.ammo[weaponName]--;

        const pointer = this.input.activePointer;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = weapon.spread * (Math.random() - 0.5);
            const angle = baseAngle + spread;

            const bullet = this.bullets.create(
                this.player.x + Math.cos(angle) * 16,
                this.player.y + Math.sin(angle) * 16,
                'bullet'
            );
            bullet.damage = weapon.damage;
            bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
            bullet.setDepth(9);

            this.time.delayedCall(800, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    updateBoss(time) {
        const bossType = this.boss.bossType;
        const attackInterval = 2000 - gameState.floor * 300;

        if (time - this.boss.lastAttackTime > attackInterval) {
            this.boss.lastAttackTime = time;
            this.boss.attackPhase = (this.boss.attackPhase + 1) % 4;

            this.bossAttack(bossType, this.boss.attackPhase);
        }

        // Boss movement
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        this.boss.setVelocity(Math.cos(angle) * 30, Math.sin(angle) * 30);
    }

    bossAttack(bossType, phase) {
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

        switch (bossType) {
            case 'bulletKing':
                if (phase === 0) {
                    // Throne spin
                    for (let i = 0; i < 16; i++) {
                        const a = (i / 16) * Math.PI * 2;
                        this.createBossBullet(this.boss.x, this.boss.y, a, 120);
                    }
                } else if (phase === 1) {
                    // Spread volley
                    for (let i = -3; i <= 3; i++) {
                        this.createBossBullet(this.boss.x, this.boss.y, angle + i * 0.2, 150);
                    }
                } else if (phase === 2) {
                    // Burst
                    for (let i = 0; i < 24; i++) {
                        const a = (i / 24) * Math.PI * 2;
                        this.createBossBullet(this.boss.x, this.boss.y, a, 100);
                    }
                } else {
                    // Rain
                    for (let i = 0; i < 8; i++) {
                        this.time.delayedCall(i * 100, () => {
                            const a = angle + (Math.random() - 0.5) * 0.5;
                            this.createBossBullet(this.boss.x, this.boss.y, a, 180);
                        });
                    }
                }
                break;

            case 'beholster':
                if (phase === 0) {
                    // Tentacle spray (from 6 directions)
                    for (let t = 0; t < 6; t++) {
                        const tentacleAngle = (t / 6) * Math.PI * 2;
                        const x = this.boss.x + Math.cos(tentacleAngle) * 30;
                        const y = this.boss.y + Math.sin(tentacleAngle) * 30;
                        for (let i = 0; i < 3; i++) {
                            this.time.delayedCall(i * 150, () => {
                                this.createBossBullet(x, y, angle + (Math.random() - 0.5) * 0.3, 140);
                            });
                        }
                    }
                } else if (phase === 1) {
                    // Eye beam (sweep)
                    for (let i = 0; i < 20; i++) {
                        this.time.delayedCall(i * 50, () => {
                            const sweepAngle = angle - 0.5 + (i / 20);
                            this.createBossBullet(this.boss.x, this.boss.y, sweepAngle, 200);
                        });
                    }
                } else if (phase === 2) {
                    // Bullet ring
                    for (let i = 0; i < 20; i++) {
                        const a = (i / 20) * Math.PI * 2;
                        this.createBossBullet(this.boss.x, this.boss.y, a, 130);
                    }
                } else {
                    // Spawn beadies (smaller bullets)
                    for (let i = 0; i < 12; i++) {
                        const a = (i / 12) * Math.PI * 2;
                        this.createBossBullet(this.boss.x, this.boss.y, a, 90);
                    }
                }
                break;

            case 'highDragun':
                if (phase === 0) {
                    // Flame breath sweep
                    for (let i = 0; i < 30; i++) {
                        this.time.delayedCall(i * 40, () => {
                            const sweepAngle = angle - 0.8 + (i / 30) * 1.6;
                            this.createBossBullet(this.boss.x, this.boss.y, sweepAngle, 180);
                        });
                    }
                } else if (phase === 1) {
                    // Knife toss
                    for (let i = 0; i < 8; i++) {
                        const a = angle + (i - 4) * 0.15;
                        this.createBossBullet(this.boss.x, this.boss.y, a, 200);
                    }
                } else if (phase === 2) {
                    // Rocket barrage (homing-ish)
                    for (let i = 0; i < 6; i++) {
                        this.time.delayedCall(i * 200, () => {
                            const a = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
                            this.createBossBullet(this.boss.x, this.boss.y, a, 150);
                        });
                    }
                } else {
                    // Bullet storm
                    for (let i = 0; i < 36; i++) {
                        const a = (i / 36) * Math.PI * 2;
                        this.createBossBullet(this.boss.x, this.boss.y, a, 110);
                    }
                    this.time.delayedCall(300, () => {
                        for (let i = 0; i < 36; i++) {
                            const a = (i / 36) * Math.PI * 2 + Math.PI / 36;
                            this.createBossBullet(this.boss.x, this.boss.y, a, 110);
                        }
                    });
                }
                break;
        }
    }

    createBossBullet(x, y, angle, speed) {
        const bullet = this.enemyBullets.create(x, y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setDepth(9);

        this.time.delayedCall(4000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    bulletHitBoss(bullet, boss) {
        boss.hp -= bullet.damage;
        bullet.destroy();

        boss.setTint(0xffffff);
        this.time.delayedCall(50, () => boss.clearTint());

        this.updateHUD();
    }

    playerHit(player, bullet) {
        if (gameState.invincible) return;

        bullet.destroy();

        if (gameState.armor > 0) {
            gameState.armor--;
        } else {
            gameState.hp--;
        }

        gameState.invincible = true;
        this.player.setTint(0xff0000);

        this.time.delayedCall(1000, () => {
            gameState.invincible = false;
            this.player.clearTint();
        });
    }

    useBlank() {
        gameState.blanks--;
        this.enemyBullets.clear(true, true);
    }

    bossDefeated() {
        // Give rewards
        gameState.blanks = 2;

        // Next floor or victory
        if (gameState.floor >= FLOORS.length - 1) {
            this.scene.start('VictoryScene');
        } else {
            gameState.floor++;
            gameState.room = 0;
            this.scene.start('GameScene');
        }
    }

    createHUD() {
        // Hearts
        this.hearts = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(24 + i * 20, 20, 'heart').setScrollFactor(0).setDepth(100);
            this.hearts.push(heart);
        }

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, 300, 16, 0x333333).setDepth(100);
        this.bossHpBar = this.add.rectangle(GAME_WIDTH / 2 - 148, GAME_HEIGHT - 20, 296, 12, 0xff3333).setOrigin(0, 0.5).setDepth(101);

        // Blanks
        this.blankText = this.add.text(24, 44, 'Blanks: ' + gameState.blanks, { fontSize: '14px', color: '#66ccff' }).setDepth(100);

        // Debug
        this.debugText = this.add.text(GAME_WIDTH - 180, 60, '', {
            fontSize: '12px',
            color: '#00ff00',
            backgroundColor: '#000000aa'
        }).setDepth(200).setVisible(false);
    }

    updateHUD() {
        // Hearts
        for (let i = 0; i < this.hearts.length; i++) {
            const heartHP = (i + 1) * 2;
            if (gameState.hp >= heartHP) {
                this.hearts[i].setTexture('heart');
            } else if (gameState.hp >= heartHP - 1) {
                this.hearts[i].setTexture('halfHeart');
            } else {
                this.hearts[i].setTexture('emptyHeart');
            }
        }

        // Boss HP
        const hpPercent = Math.max(0, this.boss.hp / this.boss.maxHp);
        this.bossHpBar.setScale(hpPercent, 1);

        // Blanks
        this.blankText.setText('Blanks: ' + gameState.blanks);

        // Debug
        if (this.debugVisible) {
            this.debugText.setText([
                '=== BOSS DEBUG ===',
                `Boss HP: ${this.boss.hp}/${this.boss.maxHp}`,
                `Player HP: ${gameState.hp}`,
                `Blanks: ${gameState.blanks}`,
                `Bullets: ${this.enemyBullets.countActive()}`,
                `Invincible: ${gameState.invincible}`
            ].join('\n'));
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

        this.add.text(GAME_WIDTH / 2, 150, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, 'You escaped the Gungeon!', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const stats = [
            `Enemies Killed: ${gameState.enemiesKilled}`,
            `Rooms Cleared: ${gameState.roomsCleared}`,
            `Shells Collected: ${gameState.shells}`,
            `Weapons Found: ${gameState.weapons.length}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(GAME_WIDTH / 2, 280 + i * 30, stat, {
                fontSize: '16px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        this.add.text(GAME_WIDTH / 2, 450, 'Press SPACE to play again', {
            fontSize: '18px',
            color: '#ffffff'
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

        this.add.text(GAME_WIDTH / 2, 200, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ff3333',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 280, `Floor: ${FLOORS[gameState.floor].name}`, {
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 320, `Enemies Killed: ${gameState.enemiesKilled}`, {
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 400, 'Press SPACE to try again', {
            fontSize: '18px',
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
    backgroundColor: '#111111',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, BossScene, VictoryScene, GameOverScene]
};

// Start game
const game = new Phaser.Game(config);
