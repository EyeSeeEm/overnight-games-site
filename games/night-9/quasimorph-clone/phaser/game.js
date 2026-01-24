// Quasimorph Clone - Turn-Based Tactical Extraction Roguelike
// Built with Phaser 3

const CONFIG = {
    width: 800,
    height: 600,
    tileSize: 32,
    viewTiles: { x: 25, y: 19 },
    visionRange: 6,

    // AP costs
    apCosts: {
        move: 1,
        shoot: 1,
        reload: 1,
        melee: 1,
        useItem: 1
    },

    // Corruption thresholds
    corruptionLevels: [
        { threshold: 0, name: 'Normal', transformChance: 0, color: 0x2a3a4a },
        { threshold: 200, name: 'Unease', transformChance: 0.1, color: 0x3a3a4a },
        { threshold: 400, name: 'Spreading', transformChance: 0.25, color: 0x4a2a3a },
        { threshold: 600, name: 'Critical', transformChance: 0.5, color: 0x5a1a2a },
        { threshold: 800, name: 'Rapture', transformChance: 1.0, color: 0x6a0a1a },
        { threshold: 1000, name: 'Breach', transformChance: 1.0, color: 0x7a000a }
    ],

    // Weapons
    weapons: {
        knife: { name: 'Knife', ap: 1, range: 1, accuracy: 90, damage: [20, 30], ammoType: null, durability: 100, silent: true },
        pistol: { name: 'Pistol', ap: 1, range: 6, accuracy: 75, damage: [15, 20], ammoType: '9mm', durability: 50 },
        smg: { name: 'SMG', ap: 1, range: 5, accuracy: 60, damage: [10, 15], ammoType: '9mm', durability: 40, burst: 3 },
        shotgun: { name: 'Shotgun', ap: 2, range: 3, accuracy: 80, damage: [25, 40], ammoType: '12g', durability: 30 }
    },

    // Enemies
    enemies: {
        guard: { name: 'Guard', hp: 50, ap: 2, weapon: 'pistol', behavior: 'patrol', color: 0x4466aa },
        soldier: { name: 'Soldier', hp: 75, ap: 2, weapon: 'smg', behavior: 'aggressive', color: 0x446644 },
        possessed: { name: 'Possessed', hp: 80, ap: 3, damage: [15, 25], behavior: 'hunt', color: 0x8844aa, corrupted: true },
        bloater: { name: 'Bloater', hp: 150, ap: 1, damage: [30, 50], behavior: 'slow', color: 0x88aa44, corrupted: true, explodes: true },
        stalker: { name: 'Stalker', hp: 60, ap: 4, damage: [10, 20], behavior: 'ambush', color: 0xaa4488, corrupted: true }
    }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.createLoadingBar();
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x1a3a2a, 0.8);
        progressBox.fillRect(width/2 - 160, height/2 - 25, 320, 50);

        const loadingText = this.add.text(width/2, height/2 - 50, 'INITIALIZING SYSTEMS...', {
            font: '16px Courier New',
            fill: '#2aff2a'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x2aff2a, 1);
            progressBar.fillRect(width/2 - 150, height/2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player sprite
        const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        playerGfx.fillStyle(0x2a6a4a);
        playerGfx.fillRect(4, 4, 24, 24);
        playerGfx.fillStyle(0x1a4a3a);
        playerGfx.fillRect(8, 8, 16, 16);
        playerGfx.fillStyle(0x4aaa6a);
        playerGfx.fillRect(10, 6, 4, 4);
        playerGfx.fillRect(18, 6, 4, 4);
        playerGfx.fillStyle(0x3a8a5a);
        playerGfx.fillRect(12, 20, 8, 6);
        playerGfx.generateTexture('player', 32, 32);

        // Floor tile
        const floorGfx = this.make.graphics({ x: 0, y: 0, add: false });
        floorGfx.fillStyle(0x1a1a2a);
        floorGfx.fillRect(0, 0, 32, 32);
        floorGfx.fillStyle(0x252535);
        floorGfx.fillRect(1, 1, 30, 30);
        floorGfx.lineStyle(1, 0x3a3a4a);
        floorGfx.strokeRect(0, 0, 32, 32);
        floorGfx.generateTexture('floor', 32, 32);

        // Metal floor variant
        const metalGfx = this.make.graphics({ x: 0, y: 0, add: false });
        metalGfx.fillStyle(0x2a2a3a);
        metalGfx.fillRect(0, 0, 32, 32);
        for (let i = 0; i < 4; i++) {
            metalGfx.fillStyle(0x3a3a4a);
            metalGfx.fillRect(i * 8 + 2, 2, 4, 28);
        }
        metalGfx.lineStyle(1, 0x4a4a5a);
        metalGfx.strokeRect(0, 0, 32, 32);
        metalGfx.generateTexture('metal', 32, 32);

        // Wall tile
        const wallGfx = this.make.graphics({ x: 0, y: 0, add: false });
        wallGfx.fillStyle(0x3a3a4a);
        wallGfx.fillRect(0, 0, 32, 32);
        wallGfx.fillStyle(0x4a4a5a);
        wallGfx.fillRect(2, 2, 28, 4);
        wallGfx.fillStyle(0x2a2a3a);
        wallGfx.fillRect(2, 26, 28, 4);
        wallGfx.lineStyle(2, 0x5a5a6a);
        wallGfx.strokeRect(0, 0, 32, 32);
        wallGfx.generateTexture('wall', 32, 32);

        // Door tile
        const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
        doorGfx.fillStyle(0x4a6a5a);
        doorGfx.fillRect(0, 0, 32, 32);
        doorGfx.fillStyle(0x3a5a4a);
        doorGfx.fillRect(4, 8, 24, 16);
        doorGfx.fillStyle(0x6a8a7a);
        doorGfx.fillRect(12, 12, 8, 8);
        doorGfx.lineStyle(2, 0x2a4a3a);
        doorGfx.strokeRect(0, 0, 32, 32);
        doorGfx.generateTexture('door', 32, 32);

        // Extraction point
        const extractGfx = this.make.graphics({ x: 0, y: 0, add: false });
        extractGfx.fillStyle(0x1a3a1a);
        extractGfx.fillRect(0, 0, 32, 32);
        extractGfx.fillStyle(0x2aaa2a);
        extractGfx.fillCircle(16, 16, 12);
        extractGfx.fillStyle(0x1a6a1a);
        extractGfx.fillCircle(16, 16, 8);
        extractGfx.fillStyle(0x4aff4a);
        extractGfx.fillCircle(16, 16, 4);
        extractGfx.generateTexture('extract', 32, 32);

        // Crate/Loot
        const crateGfx = this.make.graphics({ x: 0, y: 0, add: false });
        crateGfx.fillStyle(0x5a4a3a);
        crateGfx.fillRect(4, 8, 24, 20);
        crateGfx.fillStyle(0x6a5a4a);
        crateGfx.fillRect(6, 10, 20, 16);
        crateGfx.lineStyle(2, 0x8a7a6a);
        crateGfx.strokeRect(4, 8, 24, 20);
        crateGfx.fillStyle(0xaaaa4a);
        crateGfx.fillRect(14, 14, 4, 8);
        crateGfx.generateTexture('crate', 32, 32);

        // Enemy base
        const enemyGfx = this.make.graphics({ x: 0, y: 0, add: false });
        enemyGfx.fillStyle(0x8a4444);
        enemyGfx.fillRect(6, 6, 20, 20);
        enemyGfx.fillStyle(0xaa6666);
        enemyGfx.fillRect(10, 8, 4, 4);
        enemyGfx.fillRect(18, 8, 4, 4);
        enemyGfx.fillStyle(0x6a2222);
        enemyGfx.fillRect(10, 18, 12, 4);
        enemyGfx.generateTexture('enemy', 32, 32);

        // Corrupted enemy
        const corruptedGfx = this.make.graphics({ x: 0, y: 0, add: false });
        corruptedGfx.fillStyle(0x6a2a6a);
        corruptedGfx.fillRect(4, 4, 24, 24);
        corruptedGfx.fillStyle(0xaa4aaa);
        corruptedGfx.fillTriangle(8, 4, 16, 12, 24, 4);
        corruptedGfx.fillStyle(0xff66ff);
        corruptedGfx.fillCircle(12, 14, 3);
        corruptedGfx.fillCircle(20, 14, 3);
        corruptedGfx.fillStyle(0x4a1a4a);
        corruptedGfx.fillRect(10, 20, 12, 6);
        corruptedGfx.generateTexture('corrupted', 32, 32);

        // Fog of war
        const fogGfx = this.make.graphics({ x: 0, y: 0, add: false });
        fogGfx.fillStyle(0x000000);
        fogGfx.fillRect(0, 0, 32, 32);
        fogGfx.generateTexture('fog', 32, 32);

        // Partially visible fog
        const dimGfx = this.make.graphics({ x: 0, y: 0, add: false });
        dimGfx.fillStyle(0x000000, 0.6);
        dimGfx.fillRect(0, 0, 32, 32);
        dimGfx.generateTexture('dim', 32, 32);

        // Bullet
        const bulletGfx = this.make.graphics({ x: 0, y: 0, add: false });
        bulletGfx.fillStyle(0xffff44);
        bulletGfx.fillCircle(4, 4, 3);
        bulletGfx.generateTexture('bullet', 8, 8);

        // Blood splat
        const bloodGfx = this.make.graphics({ x: 0, y: 0, add: false });
        bloodGfx.fillStyle(0x8a2222);
        bloodGfx.fillCircle(16, 16, 6);
        bloodGfx.fillCircle(10, 12, 4);
        bloodGfx.fillCircle(22, 18, 3);
        bloodGfx.generateTexture('blood', 32, 32);

        // Muzzle flash
        const flashGfx = this.make.graphics({ x: 0, y: 0, add: false });
        flashGfx.fillStyle(0xffaa44);
        flashGfx.fillCircle(8, 8, 6);
        flashGfx.fillStyle(0xffff88);
        flashGfx.fillCircle(8, 8, 3);
        flashGfx.generateTexture('flash', 16, 16);
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.cameras.main.setBackgroundColor(0x0a0a0f);

        // Title
        this.add.text(width/2, 100, 'QUASIMORPH', {
            font: 'bold 48px Courier New',
            fill: '#2aff2a',
            stroke: '#1a6a1a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 150, 'EXTRACTION PROTOCOL', {
            font: '20px Courier New',
            fill: '#4aaa4a'
        }).setOrigin(0.5);

        // Corruption warning
        const warningBox = this.add.rectangle(width/2, 280, 500, 120, 0x1a0a0a);
        warningBox.setStrokeStyle(2, 0x8a2a2a);

        this.add.text(width/2, 250, 'WARNING: DIMENSIONAL BREACH DETECTED', {
            font: '14px Courier New',
            fill: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(width/2, 280, 'Station corrupted. Deploy mercenary clone.\nExtract valuable data and specimens.\nCorruption rises each turn.\nIf you die, you lose everything.', {
            font: '12px Courier New',
            fill: '#aaaaaa',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.rectangle(width/2, 420, 200, 50, 0x1a3a2a);
        startBtn.setStrokeStyle(2, 0x2aff2a);
        startBtn.setInteractive({ useHandCursor: true });

        const startText = this.add.text(width/2, 420, 'DEPLOY CLONE', {
            font: 'bold 18px Courier New',
            fill: '#2aff2a'
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => {
            startBtn.setFillStyle(0x2a5a4a);
        });
        startBtn.on('pointerout', () => {
            startBtn.setFillStyle(0x1a3a2a);
        });
        startBtn.on('pointerdown', () => {
            this.scene.start('MissionScene');
        });

        // Controls info
        this.add.text(width/2, 520, 'CONTROLS', {
            font: 'bold 14px Courier New',
            fill: '#4aaa4a'
        }).setOrigin(0.5);

        this.add.text(width/2, 560, 'WASD/Arrow Keys: Move | Click: Shoot | R: Reload | ENTER: End Turn | Q: Debug', {
            font: '11px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);

        // Flicker effect
        this.time.addEvent({
            delay: 100,
            callback: () => {
                warningBox.setAlpha(0.8 + Math.random() * 0.2);
            },
            loop: true
        });

        // Keyboard to start game
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MissionScene');
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('MissionScene');
        });
    }
}

// Main Mission Scene
class MissionScene extends Phaser.Scene {
    constructor() {
        super('MissionScene');
    }

    create() {
        this.initGameState();
        this.generateStation();
        this.createPlayer();
        this.spawnEnemies();
        this.createFogOfWar();
        this.createUI();
        this.setupInput();
        this.updateFogOfWar();

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    initGameState() {
        this.turn = 1;
        this.corruption = 0;
        this.playerTurn = true;
        this.gameOver = false;
        this.debugMode = false;
        this.score = 0;

        this.player = null;
        this.enemies = [];
        this.lootItems = [];
        this.bullets = [];
        this.bloodSplats = [];

        this.mapWidth = 40;
        this.mapHeight = 30;
        this.map = [];
        this.fogMap = [];
        this.visibilityMap = [];

        this.floatingTexts = [];
    }

    generateStation() {
        // Initialize map with walls
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            this.fogMap[y] = [];
            this.visibilityMap[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = { type: 'wall', sprite: null };
                this.fogMap[y][x] = 2; // 0 = visible, 1 = dim, 2 = hidden
                this.visibilityMap[y][x] = false;
            }
        }

        // Create rooms
        this.rooms = [];
        const roomTypes = ['storage', 'barracks', 'medical', 'armory'];

        // Create 10-12 rooms
        const numRooms = 10 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numRooms; i++) {
            let attempts = 0;
            while (attempts < 50) {
                const roomW = 5 + Math.floor(Math.random() * 6);
                const roomH = 4 + Math.floor(Math.random() * 5);
                const roomX = 1 + Math.floor(Math.random() * (this.mapWidth - roomW - 2));
                const roomY = 1 + Math.floor(Math.random() * (this.mapHeight - roomH - 2));

                if (this.canPlaceRoom(roomX, roomY, roomW, roomH)) {
                    this.carveRoom(roomX, roomY, roomW, roomH);
                    this.rooms.push({
                        x: roomX,
                        y: roomY,
                        w: roomW,
                        h: roomH,
                        type: roomTypes[Math.floor(Math.random() * roomTypes.length)],
                        cx: Math.floor(roomX + roomW/2),
                        cy: Math.floor(roomY + roomH/2)
                    });
                    break;
                }
                attempts++;
            }
        }

        // Ensure at least one room exists
        if (this.rooms.length === 0) {
            // Create a fallback room in the center
            const roomX = 10, roomY = 10, roomW = 8, roomH = 6;
            this.carveRoom(roomX, roomY, roomW, roomH);
            this.rooms.push({
                x: roomX, y: roomY, w: roomW, h: roomH,
                type: 'storage',
                cx: Math.floor(roomX + roomW/2),
                cy: Math.floor(roomY + roomH/2)
            });
        }

        // Connect rooms with corridors
        for (let i = 1; i < this.rooms.length; i++) {
            this.connectRooms(this.rooms[i-1], this.rooms[i]);
        }

        // Place doors at room entrances
        this.placeDoors();

        // Place extraction point in the last room
        const lastRoom = this.rooms[this.rooms.length - 1];
        if (lastRoom) {
            this.extractionPoint = { x: lastRoom.cx, y: lastRoom.cy };
        } else {
            this.extractionPoint = { x: 14, y: 13 };
        }

        // Mark extraction point on map
        this.markExtractionPoint();

        // Place loot in rooms
        this.placeLoot();

        // Create tile sprites
        this.tileLayer = this.add.container(0, 0);
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.map[y][x];
                let texture = 'wall';

                if (tile.type === 'floor') {
                    texture = Math.random() > 0.7 ? 'metal' : 'floor';
                } else if (tile.type === 'door') {
                    texture = 'door';
                } else if (tile.type === 'extract') {
                    texture = 'extract';
                }

                const sprite = this.add.sprite(x * CONFIG.tileSize, y * CONFIG.tileSize, texture);
                sprite.setOrigin(0);
                tile.sprite = sprite;
                this.tileLayer.add(sprite);
            }
        }
    }

    canPlaceRoom(x, y, w, h) {
        // Check if area is all walls (with 1 tile border)
        for (let dy = -1; dy <= h; dy++) {
            for (let dx = -1; dx <= w; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (tx < 0 || tx >= this.mapWidth || ty < 0 || ty >= this.mapHeight) return false;
                if (this.map[ty][tx].type !== 'wall') return false;
            }
        }
        return true;
    }

    carveRoom(x, y, w, h) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.map[y + dy][x + dx].type = 'floor';
            }
        }
    }

    connectRooms(room1, room2) {
        let x = room1.cx;
        let y = room1.cy;

        // Horizontal then vertical
        while (x !== room2.cx) {
            if (this.map[y][x].type === 'wall') {
                this.map[y][x].type = 'floor';
            }
            x += (room2.cx > x) ? 1 : -1;
        }
        while (y !== room2.cy) {
            if (this.map[y][x].type === 'wall') {
                this.map[y][x].type = 'floor';
            }
            y += (room2.cy > y) ? 1 : -1;
        }
    }

    placeDoors() {
        // Find corridor-to-room transitions and place doors
        for (let y = 1; y < this.mapHeight - 1; y++) {
            for (let x = 1; x < this.mapWidth - 1; x++) {
                if (this.map[y][x].type === 'floor') {
                    // Check for door-worthy positions (narrow passages)
                    const horizontal = this.map[y][x-1].type === 'wall' && this.map[y][x+1].type === 'wall';
                    const vertical = this.map[y-1][x].type === 'wall' && this.map[y+1][x].type === 'wall';

                    if ((horizontal || vertical) && Math.random() < 0.3) {
                        this.map[y][x].type = 'door';
                        this.map[y][x].open = false;
                    }
                }
            }
        }
    }

    markExtractionPoint() {
        // Mark extraction point
        if (this.extractionPoint && this.map[this.extractionPoint.y] && this.map[this.extractionPoint.y][this.extractionPoint.x]) {
            this.map[this.extractionPoint.y][this.extractionPoint.x].type = 'extract';
        }
    }

    placeLoot() {
        this.rooms.forEach(room => {
            const numItems = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numItems; i++) {
                const lx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const ly = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

                if (this.map[ly][lx].type === 'floor') {
                    let lootType;
                    const roll = Math.random();

                    switch (room.type) {
                        case 'medical':
                            lootType = roll < 0.5 ? 'medkit' : 'bandage';
                            break;
                        case 'armory':
                            lootType = roll < 0.33 ? 'pistol' : (roll < 0.66 ? 'smg' : 'shotgun');
                            break;
                        case 'storage':
                            lootType = roll < 0.4 ? '9mm' : (roll < 0.7 ? '12g' : 'cigarettes');
                            break;
                        default:
                            lootType = roll < 0.3 ? 'bandage' : (roll < 0.6 ? '9mm' : 'cigarettes');
                    }

                    const loot = this.add.sprite(lx * CONFIG.tileSize, ly * CONFIG.tileSize, 'crate');
                    loot.setOrigin(0);
                    loot.lootType = lootType;
                    loot.tileX = lx;
                    loot.tileY = ly;
                    this.lootItems.push(loot);
                }
            }
        });
    }

    createPlayer() {
        const startRoom = this.rooms[0];
        this.player = this.add.sprite(
            startRoom.cx * CONFIG.tileSize,
            startRoom.cy * CONFIG.tileSize,
            'player'
        );
        this.player.setOrigin(0);
        this.player.setDepth(10);

        this.player.tileX = startRoom.cx;
        this.player.tileY = startRoom.cy;

        this.player.hp = 100;
        this.player.maxHp = 100;
        this.player.ap = 2;
        this.player.maxAp = 2;
        this.player.stance = 'walk'; // walk or run
        this.player.bleeding = false;

        // Inventory
        this.player.weapons = [
            { ...CONFIG.weapons.knife, currentDurability: 100 },
            null
        ];
        this.player.currentWeapon = 0;
        this.player.ammo = { '9mm': 20, '12g': 0 };
        this.player.items = ['bandage', 'bandage'];
        this.player.quickSlots = ['bandage', null];
    }

    spawnEnemies() {
        this.enemies = [];

        // Spawn enemies in rooms (not the first room)
        for (let i = 1; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const numEnemies = 1 + Math.floor(Math.random() * 2);

            for (let e = 0; e < numEnemies; e++) {
                const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

                if (this.map[ey][ex].type === 'floor' && !this.getEnemyAt(ex, ey)) {
                    const type = Math.random() < 0.7 ? 'guard' : 'soldier';
                    this.createEnemy(ex, ey, type);
                }
            }
        }
    }

    createEnemy(x, y, type) {
        const config = CONFIG.enemies[type];
        const isCorrupted = config.corrupted;

        const enemy = this.add.sprite(
            x * CONFIG.tileSize,
            y * CONFIG.tileSize,
            isCorrupted ? 'corrupted' : 'enemy'
        );
        enemy.setOrigin(0);
        enemy.setDepth(9);
        enemy.setTint(config.color);

        enemy.tileX = x;
        enemy.tileY = y;
        enemy.type = type;
        enemy.hp = config.hp;
        enemy.maxHp = config.hp;
        enemy.ap = config.ap;
        enemy.behavior = config.behavior;
        enemy.alerted = false;
        enemy.visible = false;
        enemy.isCorrupted = isCorrupted;

        if (config.weapon) {
            enemy.weapon = { ...CONFIG.weapons[config.weapon] };
        } else {
            enemy.damage = config.damage;
        }

        this.enemies.push(enemy);
        return enemy;
    }

    createFogOfWar() {
        this.fogLayer = this.add.container(0, 0);
        this.fogLayer.setDepth(20);

        this.fogSprites = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.fogSprites[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const fog = this.add.sprite(x * CONFIG.tileSize, y * CONFIG.tileSize, 'fog');
                fog.setOrigin(0);
                this.fogSprites[y][x] = fog;
                this.fogLayer.add(fog);
            }
        }
    }

    updateFogOfWar() {
        // Reset visibility
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                this.visibilityMap[y][x] = false;
            }
        }

        // Cast rays from player
        const px = this.player.tileX;
        const py = this.player.tileY;

        for (let angle = 0; angle < 360; angle += 2) {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);

            for (let dist = 0; dist <= CONFIG.visionRange; dist++) {
                const tx = Math.round(px + dx * dist);
                const ty = Math.round(py + dy * dist);

                if (tx < 0 || tx >= this.mapWidth || ty < 0 || ty >= this.mapHeight) break;

                this.visibilityMap[ty][tx] = true;
                this.fogMap[ty][tx] = 0;

                if (this.map[ty][tx].type === 'wall') break;
                if (this.map[ty][tx].type === 'door' && !this.map[ty][tx].open) break;
            }
        }

        // Update fog sprites
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const fog = this.fogSprites[y][x];
                if (this.visibilityMap[y][x]) {
                    fog.setVisible(false);
                } else if (this.fogMap[y][x] === 0) {
                    fog.setVisible(true);
                    fog.setTexture('dim');
                } else {
                    fog.setVisible(true);
                    fog.setTexture('fog');
                }
            }
        }

        // Update enemy visibility
        this.enemies.forEach(enemy => {
            enemy.visible = this.visibilityMap[enemy.tileY][enemy.tileX];
            enemy.setVisible(enemy.visible);
        });

        // Update loot visibility
        this.lootItems.forEach(loot => {
            loot.setVisible(this.visibilityMap[loot.tileY][loot.tileX]);
        });

        // Update minimap
        this.updateMinimap();
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        const { width, height } = this.cameras.main;

        // Top-left: Inventory panel
        this.createInventoryUI();

        // Top bar: Turn and corruption
        this.createTopBar();

        // Bottom-left: Health and AP
        this.createStatusBar();

        // Bottom-right: Quick slots and corruption meter
        this.createQuickSlots();

        // Enemy turn indicator (hidden by default)
        this.enemyTurnIndicator = this.add.container(width/2, 80);
        this.enemyTurnIndicator.setScrollFactor(0);
        this.enemyTurnIndicator.setDepth(150);

        const indicatorBg = this.add.rectangle(0, 0, 200, 40, 0x8a2222, 0.9);
        indicatorBg.setStrokeStyle(2, 0xff4444);
        const indicatorText = this.add.text(0, 0, 'ENEMY TURN', {
            font: 'bold 18px Courier New',
            fill: '#ff4444'
        }).setOrigin(0.5);

        this.enemyTurnIndicator.add([indicatorBg, indicatorText]);
        this.enemyTurnIndicator.setVisible(false);

        // Debug overlay
        this.createDebugOverlay();

        // Minimap
        this.createMinimap();

        // CRT scanline effect
        this.createScanlineEffect();
    }

    createInventoryUI() {
        const panel = this.add.container(10, 10);

        // Background
        const bg = this.add.rectangle(0, 0, 180, 80, 0x1a1a2a, 0.9);
        bg.setOrigin(0);
        bg.setStrokeStyle(1, 0x3a5a4a);
        panel.add(bg);

        // Header
        const header = this.add.text(5, 3, 'I INVENTORY', {
            font: '10px Courier New',
            fill: '#4aaa4a'
        });
        panel.add(header);

        // Weapon slots
        for (let i = 0; i < 2; i++) {
            const slotBg = this.add.rectangle(10 + i * 80, 25, 70, 45, 0x2a3a3a);
            slotBg.setOrigin(0);
            slotBg.setStrokeStyle(1, 0x4a6a5a);
            panel.add(slotBg);

            const slotKey = this.add.text(15 + i * 80, 55, i === 0 ? 'S' : 'R', {
                font: '10px Courier New',
                fill: '#666666'
            });
            panel.add(slotKey);
        }

        // Weapon name text
        this.weaponText = this.add.text(15, 30, 'Knife', {
            font: '11px Courier New',
            fill: '#aaaaaa'
        });
        panel.add(this.weaponText);

        // Ammo counter
        this.ammoText = this.add.text(15, 43, '---', {
            font: '10px Courier New',
            fill: '#aaaa44'
        });
        panel.add(this.ammoText);

        this.uiContainer.add(panel);
    }

    createTopBar() {
        const { width } = this.cameras.main;

        // Top center bar
        const topBar = this.add.container(width/2, 10);

        const barBg = this.add.rectangle(0, 0, 400, 30, 0x1a1a2a, 0.9);
        barBg.setStrokeStyle(1, 0x3a5a4a);
        topBar.add(barBg);

        // Turn counter
        this.turnText = this.add.text(-180, 0, 'TURN: 1', {
            font: '12px Courier New',
            fill: '#4aaa4a'
        }).setOrigin(0, 0.5);
        topBar.add(this.turnText);

        // Corruption meter
        this.corruptionText = this.add.text(-50, 0, 'CORRUPTION:', {
            font: '12px Courier New',
            fill: '#aa4444'
        }).setOrigin(0, 0.5);
        topBar.add(this.corruptionText);

        // Corruption bar
        const corrBarBg = this.add.rectangle(80, 0, 100, 16, 0x2a1a1a);
        corrBarBg.setStrokeStyle(1, 0x5a2a2a);
        topBar.add(corrBarBg);

        this.corruptionBar = this.add.rectangle(31, 0, 0, 14, 0x8a2222);
        this.corruptionBar.setOrigin(0, 0.5);
        topBar.add(this.corruptionBar);

        this.corruptionValue = this.add.text(135, 0, '0', {
            font: 'bold 12px Courier New',
            fill: '#ff4444'
        }).setOrigin(0, 0.5);
        topBar.add(this.corruptionValue);

        this.uiContainer.add(topBar);
    }

    createStatusBar() {
        const { height } = this.cameras.main;

        const statusPanel = this.add.container(10, height - 80);

        // Background
        const bg = this.add.rectangle(0, 0, 250, 70, 0x1a1a2a, 0.9);
        bg.setOrigin(0);
        bg.setStrokeStyle(1, 0x3a5a4a);
        statusPanel.add(bg);

        // HP bar
        const hpLabel = this.add.text(10, 10, 'HP:', {
            font: '12px Courier New',
            fill: '#44aa44'
        });
        statusPanel.add(hpLabel);

        const hpBarBg = this.add.rectangle(45, 12, 150, 16, 0x1a2a1a);
        hpBarBg.setOrigin(0);
        hpBarBg.setStrokeStyle(1, 0x2a4a2a);
        statusPanel.add(hpBarBg);

        this.hpBar = this.add.rectangle(46, 13, 148, 14, 0x44aa44);
        this.hpBar.setOrigin(0);
        statusPanel.add(this.hpBar);

        this.hpText = this.add.text(200, 12, '100/100', {
            font: '10px Courier New',
            fill: '#44aa44'
        });
        statusPanel.add(this.hpText);

        // AP bar
        const apLabel = this.add.text(10, 35, 'AP:', {
            font: '12px Courier New',
            fill: '#4444aa'
        });
        statusPanel.add(apLabel);

        this.apContainer = this.add.container(45, 37);
        statusPanel.add(this.apContainer);

        this.updateAPDisplay();

        // Stance indicator
        this.stanceText = this.add.text(10, 55, 'STANCE: WALK', {
            font: '10px Courier New',
            fill: '#aaaaaa'
        });
        statusPanel.add(this.stanceText);

        this.uiContainer.add(statusPanel);
    }

    createQuickSlots() {
        const { width, height } = this.cameras.main;

        const quickPanel = this.add.container(width - 200, height - 80);

        // Background
        const bg = this.add.rectangle(0, 0, 190, 70, 0x1a1a2a, 0.9);
        bg.setOrigin(0);
        bg.setStrokeStyle(1, 0x3a5a4a);
        quickPanel.add(bg);

        // Quick slots
        for (let i = 0; i < 2; i++) {
            const slotBg = this.add.rectangle(10 + i * 45, 10, 40, 40, 0x2a3a3a);
            slotBg.setOrigin(0);
            slotBg.setStrokeStyle(1, 0x4a6a5a);
            quickPanel.add(slotBg);

            const slotNum = this.add.text(42 + i * 45, 45, String(i + 1), {
                font: '10px Courier New',
                fill: '#666666'
            });
            quickPanel.add(slotNum);
        }

        // Quick slot items text
        this.quickSlotText = this.add.text(15, 25, 'Band', {
            font: '10px Courier New',
            fill: '#aaaaaa'
        });
        quickPanel.add(this.quickSlotText);

        // Corruption level name
        this.corruptionLevelText = this.add.text(105, 15, 'NORMAL', {
            font: 'bold 12px Courier New',
            fill: '#4a8a4a'
        });
        quickPanel.add(this.corruptionLevelText);

        // Score
        this.scoreText = this.add.text(105, 35, 'SCORE: 0', {
            font: '10px Courier New',
            fill: '#aaaa44'
        });
        quickPanel.add(this.scoreText);

        this.uiContainer.add(quickPanel);
    }

    createDebugOverlay() {
        this.debugOverlay = this.add.container(10, 100);
        this.debugOverlay.setScrollFactor(0);
        this.debugOverlay.setDepth(200);
        this.debugOverlay.setVisible(false);

        const bg = this.add.rectangle(0, 0, 200, 180, 0x000000, 0.8);
        bg.setOrigin(0);
        bg.setStrokeStyle(1, 0x4aaa4a);
        this.debugOverlay.add(bg);

        const header = this.add.text(5, 5, 'DEBUG (Q to toggle)', {
            font: 'bold 12px Courier New',
            fill: '#4aff4a'
        });
        this.debugOverlay.add(header);

        this.debugText = this.add.text(5, 25, '', {
            font: '10px Courier New',
            fill: '#aaffaa',
            lineSpacing: 2
        });
        this.debugOverlay.add(this.debugText);
    }

    createMinimap() {
        const { width } = this.cameras.main;
        const minimapSize = 100;
        const scale = minimapSize / Math.max(this.mapWidth, this.mapHeight);

        this.minimapContainer = this.add.container(width - 110, 50);
        this.minimapContainer.setScrollFactor(0);
        this.minimapContainer.setDepth(90);

        // Background
        const bg = this.add.rectangle(0, 0, minimapSize + 4, minimapSize + 4, 0x000000, 0.7);
        bg.setOrigin(0);
        bg.setStrokeStyle(1, 0x3a5a4a);
        this.minimapContainer.add(bg);

        // Minimap graphics
        this.minimapGfx = this.add.graphics();
        this.minimapGfx.setPosition(2, 2);
        this.minimapContainer.add(this.minimapGfx);

        // Player dot
        this.minimapPlayer = this.add.circle(0, 0, 3, 0x44ff44);
        this.minimapContainer.add(this.minimapPlayer);

        this.minimapScale = scale;
    }

    updateMinimap() {
        if (!this.minimapGfx) return;

        this.minimapGfx.clear();

        // Draw explored areas
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.fogMap[y][x] < 2) {
                    const tile = this.map[y][x];
                    let color = 0x222233;

                    if (tile.type === 'floor' || tile.type === 'door') {
                        color = 0x333344;
                    } else if (tile.type === 'extract') {
                        color = 0x44ff44;
                    }

                    this.minimapGfx.fillStyle(color);
                    this.minimapGfx.fillRect(
                        x * this.minimapScale,
                        y * this.minimapScale,
                        Math.max(1, this.minimapScale),
                        Math.max(1, this.minimapScale)
                    );
                }
            }
        }

        // Draw visible enemies
        this.enemies.forEach(enemy => {
            if (enemy.visible) {
                this.minimapGfx.fillStyle(enemy.isCorrupted ? 0xff44ff : 0xff4444);
                this.minimapGfx.fillCircle(
                    enemy.tileX * this.minimapScale + this.minimapScale/2,
                    enemy.tileY * this.minimapScale + this.minimapScale/2,
                    2
                );
            }
        });

        // Update player position
        this.minimapPlayer.setPosition(
            2 + this.player.tileX * this.minimapScale + this.minimapScale/2,
            2 + this.player.tileY * this.minimapScale + this.minimapScale/2
        );
    }

    createScanlineEffect() {
        // CRT scanline overlay for retro feel
        const { width, height } = this.cameras.main;

        this.scanlineGfx = this.add.graphics();
        this.scanlineGfx.setScrollFactor(0);
        this.scanlineGfx.setDepth(500);
        this.scanlineGfx.setAlpha(0.08);

        for (let y = 0; y < height; y += 2) {
            this.scanlineGfx.lineStyle(1, 0x000000);
            this.scanlineGfx.lineBetween(0, y, width, y);
        }
    }

    updateUI() {
        // Update weapon display
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (weapon) {
            this.weaponText.setText(weapon.name);
            if (weapon.ammoType) {
                this.ammoText.setText(`${this.player.ammo[weapon.ammoType]} ${weapon.ammoType}`);
            } else {
                this.ammoText.setText('---');
            }
        }

        // Update turn
        this.turnText.setText(`TURN: ${this.turn}`);

        // Update corruption
        const corrPercent = Math.min(this.corruption / 1000, 1);
        this.corruptionBar.width = 98 * corrPercent;
        this.corruptionValue.setText(String(Math.floor(this.corruption)));

        // Update corruption level text
        let levelName = 'NORMAL';
        let levelColor = '#4a8a4a';
        for (let i = CONFIG.corruptionLevels.length - 1; i >= 0; i--) {
            if (this.corruption >= CONFIG.corruptionLevels[i].threshold) {
                levelName = CONFIG.corruptionLevels[i].name.toUpperCase();
                const c = CONFIG.corruptionLevels[i].color;
                levelColor = '#' + c.toString(16).padStart(6, '0');
                break;
            }
        }
        this.corruptionLevelText.setText(levelName);
        this.corruptionLevelText.setColor(levelColor);

        // Update HP
        const hpPercent = this.player.hp / this.player.maxHp;
        this.hpBar.width = 148 * hpPercent;
        this.hpText.setText(`${this.player.hp}/${this.player.maxHp}`);

        if (hpPercent < 0.3) {
            this.hpBar.setFillStyle(0xaa4444);
            this.hpText.setColor('#aa4444');
        } else if (hpPercent < 0.6) {
            this.hpBar.setFillStyle(0xaaaa44);
            this.hpText.setColor('#aaaa44');
        } else {
            this.hpBar.setFillStyle(0x44aa44);
            this.hpText.setColor('#44aa44');
        }

        // Update AP
        this.updateAPDisplay();

        // Update stance
        this.stanceText.setText(`STANCE: ${this.player.stance.toUpperCase()}`);

        // Update score
        this.scoreText.setText(`SCORE: ${this.score}`);

        // Update quick slots
        if (this.player.quickSlots[0]) {
            this.quickSlotText.setText(this.player.quickSlots[0].substring(0, 4));
        }

        // Update debug if visible
        if (this.debugMode) {
            this.updateDebugDisplay();
        }
    }

    updateAPDisplay() {
        this.apContainer.removeAll(true);

        for (let i = 0; i < this.player.maxAp; i++) {
            const apPip = this.add.rectangle(i * 25, 0, 20, 16,
                i < this.player.ap ? 0x4444aa : 0x222244
            );
            apPip.setOrigin(0);
            apPip.setStrokeStyle(1, 0x5555bb);
            this.apContainer.add(apPip);
        }
    }

    updateDebugDisplay() {
        const text = [
            `Pos: (${this.player.tileX}, ${this.player.tileY})`,
            `HP: ${this.player.hp}/${this.player.maxHp}`,
            `AP: ${this.player.ap}/${this.player.maxAp}`,
            `Enemies: ${this.enemies.length}`,
            `Turn: ${this.turn}`,
            `Corruption: ${Math.floor(this.corruption)}`,
            `State: ${this.playerTurn ? 'PLAYER' : 'ENEMY'}`,
            `Score: ${this.score}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugText.setText(text);
    }

    setupInput() {
        // WASD / Arrow keys for movement
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // R for reload
        this.input.keyboard.on('keydown-R', () => {
            if (this.playerTurn && !this.gameOver) {
                this.reloadWeapon();
            }
        });

        // Enter for end turn
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.playerTurn && !this.gameOver) {
                this.endPlayerTurn();
            }
        });

        // Q for debug overlay
        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            this.debugOverlay.setVisible(this.debugMode);
            if (this.debugMode) this.updateDebugDisplay();
        });

        // 1 and 2 for quick slots
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.playerTurn && !this.gameOver) {
                this.useQuickSlot(0);
            }
        });

        this.input.keyboard.on('keydown-TWO', () => {
            if (this.playerTurn && !this.gameOver) {
                this.useQuickSlot(1);
            }
        });

        // Tab to switch weapons
        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            if (this.playerTurn && !this.gameOver) {
                this.switchWeapon();
            }
        });

        // G for grenade mode
        this.grenadeMode = false;
        this.input.keyboard.on('keydown-G', () => {
            if (this.playerTurn && !this.gameOver) {
                // Check if player has grenades
                const hasGrenade = this.player.items.includes('grenade') ||
                                   this.player.quickSlots.includes('grenade');
                if (hasGrenade) {
                    this.grenadeMode = !this.grenadeMode;
                    this.showFloatingText(this.player.x + 16, this.player.y,
                        this.grenadeMode ? 'GRENADE MODE' : 'SHOOT MODE', '#ffaa44');
                } else {
                    this.showFloatingText(this.player.x + 16, this.player.y, 'No grenades!', '#ff4444');
                }
            }
        });

        // C for stance change
        this.input.keyboard.on('keydown-C', () => {
            if (this.playerTurn && !this.gameOver) {
                if (this.player.stance === 'walk') {
                    this.player.stance = 'run';
                    this.player.maxAp = 3;
                    this.showFloatingText(this.player.x + 16, this.player.y, 'RUN STANCE', '#44aaff');
                } else {
                    this.player.stance = 'walk';
                    this.player.maxAp = 2;
                    this.showFloatingText(this.player.x + 16, this.player.y, 'WALK STANCE', '#44aa44');
                }
                this.updateUI();
            }
        });

        // Click to shoot or throw grenade
        this.input.on('pointerdown', (pointer) => {
            if (this.playerTurn && !this.gameOver) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const tileX = Math.floor(worldPoint.x / CONFIG.tileSize);
                const tileY = Math.floor(worldPoint.y / CONFIG.tileSize);

                if (this.grenadeMode) {
                    this.throwGrenade(tileX, tileY);
                } else {
                    this.handleClick(tileX, tileY);
                }
            }
        });

        // Movement handling
        this.moveDelay = 0;
    }

    throwGrenade(targetX, targetY) {
        if (this.player.ap < 1) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No AP!', '#ff4444');
            return;
        }

        // Check range (6 tiles max)
        const dist = Math.abs(targetX - this.player.tileX) + Math.abs(targetY - this.player.tileY);
        if (dist > 6) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'Too far!', '#ffaa44');
            return;
        }

        // Remove grenade from inventory
        let removed = false;
        const qsIndex = this.player.quickSlots.indexOf('grenade');
        if (qsIndex >= 0) {
            this.player.quickSlots[qsIndex] = this.player.items.shift() || null;
            removed = true;
        } else {
            const itemIndex = this.player.items.indexOf('grenade');
            if (itemIndex >= 0) {
                this.player.items.splice(itemIndex, 1);
                removed = true;
            }
        }

        if (!removed) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No grenades!', '#ff4444');
            return;
        }

        this.player.ap -= 1;
        this.grenadeMode = false;

        // Grenade explosion
        this.grenadeExplosion(targetX, targetY);
        this.updateUI();

        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endPlayerTurn());
        }
    }

    grenadeExplosion(x, y) {
        // Visual explosion
        const explosion = this.add.circle(x * CONFIG.tileSize + 16, y * CONFIG.tileSize + 16, 64, 0xff6644, 0.6);
        explosion.setDepth(15);
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // Damage in 2 tile radius
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= 2 && tx >= 0 && tx < this.mapWidth && ty >= 0 && ty < this.mapHeight) {
                    const damage = 40 - dist * 10;

                    // Damage enemies
                    const enemy = this.getEnemyAt(tx, ty);
                    if (enemy) {
                        enemy.hp -= damage;
                        this.showFloatingText(enemy.x + 16, enemy.y, `-${damage}`, '#ff4444');
                        if (enemy.hp <= 0) {
                            this.killEnemy(enemy);
                        } else {
                            enemy.alerted = true;
                        }
                    }

                    // Damage player if in range
                    if (this.player.tileX === tx && this.player.tileY === ty) {
                        this.damagePlayer(damage);
                    }
                }
            }
        }
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Handle movement input
        if (this.playerTurn && this.player.ap > 0) {
            this.moveDelay -= delta;
            if (this.moveDelay <= 0) {
                let dx = 0, dy = 0;

                if (this.cursors.left.isDown || this.wasd.left.isDown) dx = -1;
                else if (this.cursors.right.isDown || this.wasd.right.isDown) dx = 1;
                else if (this.cursors.up.isDown || this.wasd.up.isDown) dy = -1;
                else if (this.cursors.down.isDown || this.wasd.down.isDown) dy = 1;

                if (dx !== 0 || dy !== 0) {
                    this.movePlayer(dx, dy);
                    this.moveDelay = 150;
                }
            }
        }

        // Update floating texts
        this.updateFloatingTexts(delta);
    }

    movePlayer(dx, dy) {
        if (this.player.ap < CONFIG.apCosts.move) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No AP!', '#ff4444');
            return;
        }

        const newX = this.player.tileX + dx;
        const newY = this.player.tileY + dy;

        // Check bounds
        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) return;

        const tile = this.map[newY][newX];

        // Check walkability
        if (tile.type === 'wall') return;

        // Handle doors
        if (tile.type === 'door' && !tile.open) {
            tile.open = true;
            tile.sprite.setTexture('floor');
            this.updateFogOfWar();
            return; // Opening door is free
        }

        // Check for enemies
        if (this.getEnemyAt(newX, newY)) return;

        // Move player
        this.player.tileX = newX;
        this.player.tileY = newY;
        this.player.x = newX * CONFIG.tileSize;
        this.player.y = newY * CONFIG.tileSize;

        this.player.ap -= CONFIG.apCosts.move;

        // Check for loot pickup
        this.checkLootPickup();

        // Check for extraction
        if (tile.type === 'extract') {
            this.extract();
            return;
        }

        // Alert nearby enemies
        this.alertNearbyEnemies();

        // Update fog
        this.updateFogOfWar();
        this.updateUI();

        // Auto-end turn if no AP
        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endPlayerTurn());
        }
    }

    handleClick(tileX, tileY) {
        // Check if clicking on an enemy in range
        const enemy = this.getEnemyAt(tileX, tileY);

        if (enemy && enemy.visible) {
            this.attackEnemy(enemy);
        }
    }

    attackEnemy(enemy) {
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (!weapon) return;

        if (this.player.ap < weapon.ap) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No AP!', '#ff4444');
            return;
        }

        // Check range
        const dist = Math.abs(enemy.tileX - this.player.tileX) + Math.abs(enemy.tileY - this.player.tileY);
        if (dist > weapon.range) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'Out of range!', '#ffaa44');
            return;
        }

        // Check line of sight
        if (!this.hasLineOfSight(this.player.tileX, this.player.tileY, enemy.tileX, enemy.tileY)) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No LOS!', '#ffaa44');
            return;
        }

        // Check ammo
        if (weapon.ammoType && this.player.ammo[weapon.ammoType] <= 0) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No ammo!', '#ff4444');
            return;
        }

        this.player.ap -= weapon.ap;

        // Use ammo
        if (weapon.ammoType) {
            this.player.ammo[weapon.ammoType]--;
        }

        // Reduce durability
        weapon.currentDurability--;

        // Check for weapon jam (at 0 durability, 50% chance)
        if (weapon.currentDurability <= 0 && Math.random() < 0.5) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'JAMMED!', '#ff8844');
            this.updateUI();
            return;
        }

        // Calculate cover bonus for enemy
        const coverBonus = this.calculateCover(enemy.tileX, enemy.tileY, this.player.tileX, this.player.tileY);
        const effectiveAccuracy = weapon.accuracy - coverBonus;

        // Calculate hit
        const hitRoll = Math.random() * 100;
        const hit = hitRoll < effectiveAccuracy;

        // Muzzle flash and bullet tracer for ranged weapons
        if (weapon.name !== 'Knife') {
            this.showMuzzleFlash();
            this.showBulletTracer(this.player.tileX, this.player.tileY, enemy.tileX, enemy.tileY);
        }

        if (hit) {
            const damage = weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1));

            // Burst weapons
            let totalDamage = damage;
            if (weapon.burst) {
                for (let i = 1; i < weapon.burst; i++) {
                    if (Math.random() * 100 < weapon.accuracy - i * 10) {
                        totalDamage += weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1));
                    }
                }
            }

            enemy.hp -= totalDamage;
            this.showFloatingText(enemy.x + 16, enemy.y, `-${totalDamage}`, '#ff4444');
            this.createBloodSplat(enemy.tileX, enemy.tileY);

            // Flash enemy red
            this.tweens.add({
                targets: enemy,
                alpha: 0.5,
                duration: 100,
                yoyo: true
            });

            if (enemy.hp <= 0) {
                this.killEnemy(enemy);
            } else {
                enemy.alerted = true;
            }
        } else {
            this.showFloatingText(enemy.x + 16, enemy.y, 'MISS', '#aaaaaa');
        }

        this.updateUI();

        // Auto-end turn if no AP
        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endPlayerTurn());
        }
    }

    showMuzzleFlash() {
        const flash = this.add.sprite(this.player.x + 16, this.player.y + 16, 'flash');
        flash.setDepth(15);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    showBulletTracer(fromX, fromY, toX, toY) {
        const startX = fromX * CONFIG.tileSize + 16;
        const startY = fromY * CONFIG.tileSize + 16;
        const endX = toX * CONFIG.tileSize + 16;
        const endY = toY * CONFIG.tileSize + 16;

        const line = this.add.graphics();
        line.lineStyle(2, 0xffff44, 0.8);
        line.lineBetween(startX, startY, endX, endY);
        line.setDepth(14);

        this.tweens.add({
            targets: line,
            alpha: 0,
            duration: 150,
            onComplete: () => line.destroy()
        });
    }

    hasLineOfSight(x1, y1, x2, y2) {
        // Bresenham line algorithm
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (x !== x2 || y !== y2) {
            // Skip starting position
            if (x !== x1 || y !== y1) {
                if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false;
                const tile = this.map[y][x];
                if (tile.type === 'wall') return false;
                if (tile.type === 'door' && !tile.open) return false;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        return true;
    }

    calculateCover(targetX, targetY, shooterX, shooterY) {
        // Check for cover near target, between shooter and target
        let coverBonus = 0;
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        // Determine direction from shooter to target
        const dirX = Math.sign(targetX - shooterX);
        const dirY = Math.sign(targetY - shooterY);

        // Check if there's a wall in the direction the shot is coming from
        const checkX = targetX - dirX;
        const checkY = targetY - dirY;

        if (checkX >= 0 && checkX < this.mapWidth && checkY >= 0 && checkY < this.mapHeight) {
            const tile = this.map[checkY][checkX];
            if (tile.type === 'wall' || (tile.type === 'door' && !tile.open)) {
                coverBonus = 25; // Half cover
            }
        }

        // Check adjacent walls for full cover bonus
        for (const [dx, dy] of dirs) {
            const cx = targetX + dx;
            const cy = targetY + dy;
            if (cx >= 0 && cx < this.mapWidth && cy >= 0 && cy < this.mapHeight) {
                const tile = this.map[cy][cx];
                if (tile.type === 'wall') {
                    // Wall is between shooter and this position?
                    if ((dx === -dirX || dy === -dirY) && coverBonus < 25) {
                        coverBonus = 25;
                    }
                }
            }
        }

        return coverBonus;
    }

    createBloodSplat(x, y) {
        const blood = this.add.sprite(x * CONFIG.tileSize, y * CONFIG.tileSize, 'blood');
        blood.setOrigin(0);
        blood.setAlpha(0.7);
        blood.setDepth(1);
        this.bloodSplats.push(blood);
    }

    killEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        // Check for bloater explosion
        if (CONFIG.enemies[enemy.type].explodes) {
            this.bloaterExplosion(enemy.tileX, enemy.tileY);
        }

        // Add score
        this.score += enemy.isCorrupted ? 50 : 25;
        this.showFloatingText(enemy.x + 16, enemy.y, `+${enemy.isCorrupted ? 50 : 25}`, '#ffff44');

        enemy.destroy();
        this.updateUI();
    }

    bloaterExplosion(x, y) {
        // Damage in 2 tile radius
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= 2) {
                    this.createBloodSplat(tx, ty);

                    // Damage player if in range
                    if (this.player.tileX === tx && this.player.tileY === ty) {
                        const damage = 30 - dist * 10;
                        this.damagePlayer(damage);
                    }
                }
            }
        }

        // Visual effect
        const explosion = this.add.circle(x * CONFIG.tileSize + 16, y * CONFIG.tileSize + 16, 64, 0x88aa44, 0.5);
        explosion.setDepth(15);
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
    }

    reloadWeapon() {
        if (this.player.ap < CONFIG.apCosts.reload) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No AP!', '#ff4444');
            return;
        }

        const weapon = this.player.weapons[this.player.currentWeapon];
        if (!weapon || !weapon.ammoType) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'Cannot reload', '#aaaaaa');
            return;
        }

        // Just show reload message (simplified - no magazine system in MVP)
        this.player.ap -= CONFIG.apCosts.reload;
        this.showFloatingText(this.player.x + 16, this.player.y, 'Reloaded', '#44aa44');
        this.updateUI();

        // Auto-end turn if no AP
        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endPlayerTurn());
        }
    }

    switchWeapon() {
        if (this.player.weapons[1]) {
            this.player.currentWeapon = this.player.currentWeapon === 0 ? 1 : 0;
            this.updateUI();
        }
    }

    useQuickSlot(slot) {
        const item = this.player.quickSlots[slot];
        if (!item) return;

        if (this.player.ap < CONFIG.apCosts.useItem) {
            this.showFloatingText(this.player.x + 16, this.player.y, 'No AP!', '#ff4444');
            return;
        }

        this.player.ap -= CONFIG.apCosts.useItem;

        switch (item) {
            case 'bandage':
                this.player.hp = Math.min(this.player.hp + 10, this.player.maxHp);
                this.player.bleeding = false;
                this.showFloatingText(this.player.x + 16, this.player.y, '+10 HP', '#44aa44');
                break;
            case 'medkit':
                this.player.hp = Math.min(this.player.hp + 30, this.player.maxHp);
                this.showFloatingText(this.player.x + 16, this.player.y, '+30 HP', '#44ff44');
                break;
            case 'cigarettes':
                this.corruption = Math.max(0, this.corruption - 25);
                this.showFloatingText(this.player.x + 16, this.player.y, '-25 Corr', '#aa44aa');
                break;
        }

        // Remove item from slot
        this.player.quickSlots[slot] = this.player.items.shift() || null;
        this.updateUI();

        // Auto-end turn if no AP
        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endPlayerTurn());
        }
    }

    checkLootPickup() {
        for (let i = this.lootItems.length - 1; i >= 0; i--) {
            const loot = this.lootItems[i];
            if (loot.tileX === this.player.tileX && loot.tileY === this.player.tileY) {
                this.pickupLoot(loot);
                this.lootItems.splice(i, 1);
                loot.destroy();
            }
        }
    }

    pickupLoot(loot) {
        const type = loot.lootType;
        let message = '';

        switch (type) {
            case '9mm':
                this.player.ammo['9mm'] += 12;
                message = '+12 9mm';
                this.score += 5;
                break;
            case '12g':
                this.player.ammo['12g'] += 6;
                message = '+6 12g';
                this.score += 5;
                break;
            case 'bandage':
                this.player.items.push('bandage');
                if (!this.player.quickSlots[0]) this.player.quickSlots[0] = 'bandage';
                else if (!this.player.quickSlots[1]) this.player.quickSlots[1] = 'bandage';
                message = '+Bandage';
                this.score += 10;
                break;
            case 'medkit':
                this.player.items.push('medkit');
                if (!this.player.quickSlots[0]) this.player.quickSlots[0] = 'medkit';
                else if (!this.player.quickSlots[1]) this.player.quickSlots[1] = 'medkit';
                message = '+Medkit';
                this.score += 20;
                break;
            case 'cigarettes':
                this.player.items.push('cigarettes');
                if (!this.player.quickSlots[0]) this.player.quickSlots[0] = 'cigarettes';
                else if (!this.player.quickSlots[1]) this.player.quickSlots[1] = 'cigarettes';
                message = '+Cigarettes';
                this.score += 10;
                break;
            case 'pistol':
                if (!this.player.weapons[1]) {
                    this.player.weapons[1] = { ...CONFIG.weapons.pistol, currentDurability: 50 };
                    message = '+Pistol';
                    this.score += 30;
                } else {
                    this.player.ammo['9mm'] += 8;
                    message = '+8 9mm (full)';
                    this.score += 10;
                }
                break;
            case 'smg':
                if (!this.player.weapons[1]) {
                    this.player.weapons[1] = { ...CONFIG.weapons.smg, currentDurability: 40 };
                    message = '+SMG';
                    this.score += 40;
                } else {
                    this.player.ammo['9mm'] += 15;
                    message = '+15 9mm (full)';
                    this.score += 15;
                }
                break;
            case 'shotgun':
                if (!this.player.weapons[1]) {
                    this.player.weapons[1] = { ...CONFIG.weapons.shotgun, currentDurability: 30 };
                    message = '+Shotgun';
                    this.score += 50;
                } else {
                    this.player.ammo['12g'] += 4;
                    message = '+4 12g (full)';
                    this.score += 10;
                }
                break;
        }

        this.showFloatingText(this.player.x + 16, this.player.y, message, '#ffff44');
        this.updateUI();
    }

    alertNearbyEnemies() {
        this.enemies.forEach(enemy => {
            const dist = Math.abs(enemy.tileX - this.player.tileX) + Math.abs(enemy.tileY - this.player.tileY);
            if (dist <= 5) {
                enemy.alerted = true;
            }
        });
    }

    endPlayerTurn() {
        if (!this.playerTurn) return;

        this.playerTurn = false;

        // Handle bleeding
        if (this.player.bleeding) {
            this.damagePlayer(1);
        }

        this.time.delayedCall(100, () => this.startEnemyTurn());
    }

    startEnemyTurn() {
        // Show enemy turn indicator
        this.enemyTurnIndicator.setVisible(true);

        // Process each enemy sequentially
        let delay = 0;
        this.enemies.forEach((enemy, index) => {
            this.time.delayedCall(delay, () => {
                if (enemy.alerted || this.visibilityMap[enemy.tileY][enemy.tileX]) {
                    this.processEnemyTurn(enemy);
                }
            });
            delay += 300;
        });

        // End enemy turn
        this.time.delayedCall(delay + 200, () => {
            this.enemyTurnIndicator.setVisible(false);
            this.endEnemyTurn();
        });
    }

    processEnemyTurn(enemy) {
        enemy.alerted = true;

        const dist = Math.abs(enemy.tileX - this.player.tileX) + Math.abs(enemy.tileY - this.player.tileY);

        // Check if can attack
        if (dist <= (enemy.weapon ? enemy.weapon.range : 1)) {
            this.enemyAttack(enemy);
        } else {
            // Move toward player
            this.enemyMoveToward(enemy);
        }
    }

    enemyMoveToward(enemy) {
        const dx = Math.sign(this.player.tileX - enemy.tileX);
        const dy = Math.sign(this.player.tileY - enemy.tileY);

        // Try to move (prioritize axis with larger distance)
        let moved = false;
        const xDist = Math.abs(this.player.tileX - enemy.tileX);
        const yDist = Math.abs(this.player.tileY - enemy.tileY);

        if (xDist >= yDist && dx !== 0) {
            moved = this.tryMoveEnemy(enemy, dx, 0);
        }
        if (!moved && dy !== 0) {
            moved = this.tryMoveEnemy(enemy, 0, dy);
        }
        if (!moved && dx !== 0) {
            moved = this.tryMoveEnemy(enemy, dx, 0);
        }

        if (moved) {
            this.updateFogOfWar();
        }
    }

    tryMoveEnemy(enemy, dx, dy) {
        const newX = enemy.tileX + dx;
        const newY = enemy.tileY + dy;

        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) return false;

        const tile = this.map[newY][newX];
        if (tile.type === 'wall') return false;
        if (tile.type === 'door' && !tile.open) {
            tile.open = true;
            tile.sprite.setTexture('floor');
            return true;
        }
        if (this.getEnemyAt(newX, newY)) return false;
        if (newX === this.player.tileX && newY === this.player.tileY) return false;

        enemy.tileX = newX;
        enemy.tileY = newY;
        enemy.x = newX * CONFIG.tileSize;
        enemy.y = newY * CONFIG.tileSize;

        return true;
    }

    enemyAttack(enemy) {
        let damage;
        let hitChance;

        if (enemy.weapon) {
            damage = enemy.weapon.damage[0] + Math.floor(Math.random() * (enemy.weapon.damage[1] - enemy.weapon.damage[0] + 1));
            hitChance = enemy.weapon.accuracy;
        } else {
            damage = enemy.damage[0] + Math.floor(Math.random() * (enemy.damage[1] - enemy.damage[0] + 1));
            hitChance = 75;
        }

        // Show attack indicator on enemy
        if (enemy.visible) {
            this.tweens.add({
                targets: enemy,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 100,
                yoyo: true
            });
        }

        if (Math.random() * 100 < hitChance) {
            this.damagePlayer(damage);

            // Chance to cause bleeding for corrupted enemies
            if (enemy.isCorrupted && Math.random() < 0.3) {
                this.player.bleeding = true;
                this.showFloatingText(this.player.x + 16, this.player.y - 20, 'BLEEDING!', '#aa2222');
            }
        } else {
            this.showFloatingText(this.player.x + 16, this.player.y, 'MISS', '#666666');
        }
    }

    damagePlayer(damage) {
        this.player.hp -= damage;
        this.showFloatingText(this.player.x + 16, this.player.y, `-${damage}`, '#ff4444');

        // Flash screen red
        this.cameras.main.flash(100, 100, 0, 0);

        // Screen shake based on damage
        const shakeIntensity = Math.min(0.01 + damage * 0.0005, 0.02);
        this.cameras.main.shake(200, shakeIntensity);

        // Flash player sprite
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        // Low HP warning effect
        if (this.player.hp <= 30 && this.player.hp > 0) {
            this.showLowHPWarning();
        }

        if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.playerDeath();
        }

        this.updateUI();
    }

    showLowHPWarning() {
        const { width, height } = this.cameras.main;

        // Red vignette flash
        const vignette = this.add.graphics();
        vignette.setScrollFactor(0);
        vignette.setDepth(400);

        // Draw red edges
        vignette.fillStyle(0x880000, 0.4);
        vignette.fillRect(0, 0, width, 30);
        vignette.fillRect(0, height - 30, width, 30);
        vignette.fillRect(0, 0, 30, height);
        vignette.fillRect(width - 30, 0, 30, height);

        this.tweens.add({
            targets: vignette,
            alpha: 0,
            duration: 500,
            onComplete: () => vignette.destroy()
        });

        // Show warning text
        if (!this.lowHPText) {
            this.lowHPText = this.add.text(width/2, 60, 'CRITICAL DAMAGE!', {
                font: 'bold 14px Courier New',
                fill: '#ff4444'
            }).setOrigin(0.5);
            this.lowHPText.setScrollFactor(0);
            this.lowHPText.setDepth(401);
            this.lowHPText.setAlpha(0);
        }

        this.tweens.add({
            targets: this.lowHPText,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 500
        });
    }

    endEnemyTurn() {
        // Increment turn
        this.turn++;

        // Increase corruption
        this.corruption += 10 + Math.floor(this.turn / 5) * 2;

        // Check for transformations
        this.checkCorruptionTransforms();

        // Apply corruption visual effects
        this.applyCorruptionEffects();

        // Reset player AP
        this.player.ap = this.player.stance === 'run' ? 3 : 2;
        this.player.maxAp = this.player.ap;

        this.playerTurn = true;
        this.updateUI();
    }

    checkCorruptionTransforms() {
        // Find transform chance based on corruption level
        let transformChance = 0;
        for (let i = CONFIG.corruptionLevels.length - 1; i >= 0; i--) {
            if (this.corruption >= CONFIG.corruptionLevels[i].threshold) {
                transformChance = CONFIG.corruptionLevels[i].transformChance;
                break;
            }
        }

        if (transformChance <= 0) return;

        // Check each non-corrupted enemy for transformation
        this.enemies.forEach(enemy => {
            if (!enemy.isCorrupted && Math.random() < transformChance * 0.1) {
                this.transformEnemy(enemy);
            }
        });

        // Spawn additional corrupted enemies at high corruption
        if (this.corruption >= 600 && Math.random() < 0.2) {
            this.spawnCorruptedEnemy();
        }
    }

    transformEnemy(enemy) {
        const types = ['possessed', 'bloater', 'stalker'];
        const newType = types[Math.floor(Math.random() * types.length)];
        const config = CONFIG.enemies[newType];

        enemy.type = newType;
        enemy.hp = config.hp;
        enemy.maxHp = config.hp;
        enemy.ap = config.ap;
        enemy.behavior = config.behavior;
        enemy.damage = config.damage;
        enemy.isCorrupted = true;
        enemy.weapon = null;
        enemy.setTexture('corrupted');
        enemy.setTint(config.color);

        if (enemy.visible) {
            this.showFloatingText(enemy.x + 16, enemy.y, 'TRANSFORMED!', '#aa44aa');

            // Visual effect
            this.tweens.add({
                targets: enemy,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 200,
                yoyo: true
            });
        }
    }

    spawnCorruptedEnemy() {
        // Find a valid spawn location far from player
        for (let attempt = 0; attempt < 20; attempt++) {
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

            const distToPlayer = Math.abs(x - this.player.tileX) + Math.abs(y - this.player.tileY);

            if (this.map[y][x].type === 'floor' && !this.getEnemyAt(x, y) && distToPlayer > 5) {
                const types = ['possessed', 'stalker'];
                const type = types[Math.floor(Math.random() * types.length)];
                const enemy = this.createEnemy(x, y, type);
                enemy.alerted = true;
                this.updateFogOfWar();
                break;
            }
        }
    }

    applyCorruptionEffects() {
        // Apply screen tint based on corruption
        let tint = 0x2a3a4a;
        for (let i = CONFIG.corruptionLevels.length - 1; i >= 0; i--) {
            if (this.corruption >= CONFIG.corruptionLevels[i].threshold) {
                tint = CONFIG.corruptionLevels[i].color;
                break;
            }
        }

        // Apply tint to all floor tiles
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.map[y][x].type !== 'wall' && this.map[y][x].sprite) {
                    this.map[y][x].sprite.setTint(tint);
                }
            }
        }

        // Screen shake at high corruption
        if (this.corruption >= 600) {
            this.cameras.main.shake(100, 0.002);
        }
    }

    extract() {
        this.gameOver = true;

        // Calculate final score
        const survivalBonus = Math.floor((1000 - this.corruption) / 10);
        const finalScore = this.score + survivalBonus;

        // Show extraction screen
        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
        overlay.setScrollFactor(0);
        overlay.setDepth(200);

        const text = this.add.text(width/2, height/2 - 60, 'EXTRACTION SUCCESSFUL', {
            font: 'bold 32px Courier New',
            fill: '#2aff2a'
        }).setOrigin(0.5);
        text.setScrollFactor(0);
        text.setDepth(201);

        const scoreText = this.add.text(width/2, height/2, [
            `Loot Score: ${this.score}`,
            `Survival Bonus: ${survivalBonus}`,
            `Final Score: ${finalScore}`,
            '',
            `Turns: ${this.turn}`,
            `Corruption: ${Math.floor(this.corruption)}`
        ].join('\n'), {
            font: '16px Courier New',
            fill: '#aaffaa',
            align: 'center'
        }).setOrigin(0.5);
        scoreText.setScrollFactor(0);
        scoreText.setDepth(201);

        const restartBtn = this.add.text(width/2, height/2 + 100, 'CLICK TO DEPLOY AGAIN', {
            font: '18px Courier New',
            fill: '#4aaa4a'
        }).setOrigin(0.5);
        restartBtn.setScrollFactor(0);
        restartBtn.setDepth(201);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    playerDeath() {
        this.gameOver = true;

        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);
        overlay.setScrollFactor(0);
        overlay.setDepth(200);

        const text = this.add.text(width/2, height/2 - 40, 'CLONE LOST', {
            font: 'bold 32px Courier New',
            fill: '#ff4444'
        }).setOrigin(0.5);
        text.setScrollFactor(0);
        text.setDepth(201);

        const subText = this.add.text(width/2, height/2 + 10, [
            'All equipment lost.',
            '',
            `Survived ${this.turn} turns`,
            `Score: ${this.score}`
        ].join('\n'), {
            font: '16px Courier New',
            fill: '#aa6666',
            align: 'center'
        }).setOrigin(0.5);
        subText.setScrollFactor(0);
        subText.setDepth(201);

        const restartBtn = this.add.text(width/2, height/2 + 100, 'CLICK TO DEPLOY NEW CLONE', {
            font: '18px Courier New',
            fill: '#aa4444'
        }).setOrigin(0.5);
        restartBtn.setScrollFactor(0);
        restartBtn.setDepth(201);
        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            font: 'bold 12px Courier New',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        floatText.setDepth(50);
        floatText.life = 1000;
        floatText.startY = y;
        this.floatingTexts.push(floatText);
    }

    updateFloatingTexts(delta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.life -= delta;
            text.y = text.startY - (1000 - text.life) * 0.03;
            text.alpha = text.life / 1000;

            if (text.life <= 0) {
                text.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    getEnemyAt(x, y) {
        return this.enemies.find(e => e.tileX === x && e.tileY === y);
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#0a0a0f',
    scene: [BootScene, MenuScene, MissionScene]
};

// Start game
const game = new Phaser.Game(config);
