// Isolation Protocol - Subterrain Clone
// Built with Phaser 3

const CONFIG = {
    width: 800,
    height: 600,
    tileSize: 32,

    // Player stats
    playerSpeed: 150,
    maxHealth: 100,
    maxHunger: 100,
    maxInfection: 100,

    // Time system (1 real second = 1 game minute)
    timeScale: 1,

    // Sector definitions
    sectors: {
        hub: { name: 'Central Hub', powerCost: 0, size: { w: 15, h: 15 } },
        storage: { name: 'Storage Wing', powerCost: 100, size: { w: 20, h: 20 } },
        medical: { name: 'Medical Bay', powerCost: 150, size: { w: 20, h: 20 } },
        research: { name: 'Research Lab', powerCost: 200, size: { w: 25, h: 25 } },
        escape: { name: 'Escape Pod', powerCost: 300, size: { w: 15, h: 15 } }
    }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player (top-down survivor)
        const playerGfx = this.make.graphics({ add: false });
        playerGfx.fillStyle(0x4a6a8a);
        playerGfx.fillCircle(16, 16, 12);
        playerGfx.fillStyle(0x6a8aaa);
        playerGfx.fillCircle(14, 14, 6);
        playerGfx.fillStyle(0xc9a875);
        playerGfx.fillCircle(16, 12, 5);
        playerGfx.generateTexture('player', 32, 32);

        // Metal floor tile
        const floorGfx = this.make.graphics({ add: false });
        floorGfx.fillStyle(0x2a2a2a);
        floorGfx.fillRect(0, 0, 32, 32);
        floorGfx.lineStyle(1, 0x3a3a3a);
        floorGfx.strokeRect(0, 0, 16, 16);
        floorGfx.strokeRect(16, 0, 16, 16);
        floorGfx.strokeRect(0, 16, 16, 16);
        floorGfx.strokeRect(16, 16, 16, 16);
        floorGfx.fillStyle(0x333333);
        floorGfx.fillCircle(8, 8, 2);
        floorGfx.fillCircle(24, 8, 2);
        floorGfx.fillCircle(8, 24, 2);
        floorGfx.fillCircle(24, 24, 2);
        floorGfx.generateTexture('floor', 32, 32);

        // Wall tile
        const wallGfx = this.make.graphics({ add: false });
        wallGfx.fillStyle(0x1a1a1a);
        wallGfx.fillRect(0, 0, 32, 32);
        wallGfx.fillStyle(0x252525);
        wallGfx.fillRect(2, 2, 28, 28);
        wallGfx.lineStyle(2, 0x333333);
        wallGfx.strokeRect(4, 4, 24, 24);
        wallGfx.generateTexture('wall', 32, 32);

        // Door
        const doorGfx = this.make.graphics({ add: false });
        doorGfx.fillStyle(0x3a4a3a);
        doorGfx.fillRect(0, 8, 32, 16);
        doorGfx.fillStyle(0x44ff44);
        doorGfx.fillRect(14, 12, 4, 8);
        doorGfx.generateTexture('door', 32, 32);

        // Shambler enemy
        const shamblerGfx = this.make.graphics({ add: false });
        shamblerGfx.fillStyle(0x6a4a4a);
        shamblerGfx.fillCircle(16, 16, 14);
        shamblerGfx.fillStyle(0x8a5a5a);
        shamblerGfx.fillCircle(12, 12, 4);
        shamblerGfx.fillCircle(20, 12, 4);
        shamblerGfx.fillStyle(0xaa2222);
        shamblerGfx.fillCircle(16, 20, 6);
        shamblerGfx.generateTexture('shambler', 32, 32);

        // Crawler enemy
        const crawlerGfx = this.make.graphics({ add: false });
        crawlerGfx.fillStyle(0x4a5a4a);
        crawlerGfx.fillRect(4, 12, 24, 12);
        crawlerGfx.fillStyle(0x5a6a5a);
        crawlerGfx.fillRect(0, 14, 8, 4);
        crawlerGfx.fillRect(24, 14, 8, 4);
        crawlerGfx.fillStyle(0xffff00);
        crawlerGfx.fillCircle(10, 16, 2);
        crawlerGfx.fillCircle(22, 16, 2);
        crawlerGfx.generateTexture('crawler', 32, 32);

        // Spitter enemy
        const spitterGfx = this.make.graphics({ add: false });
        spitterGfx.fillStyle(0x4a6a4a);
        spitterGfx.fillCircle(16, 16, 12);
        spitterGfx.fillStyle(0x44aa44);
        spitterGfx.fillCircle(16, 8, 6);
        spitterGfx.fillStyle(0x00ff00);
        spitterGfx.fillCircle(16, 20, 4);
        spitterGfx.generateTexture('spitter', 32, 32);

        // Brute enemy
        const bruteGfx = this.make.graphics({ add: false });
        bruteGfx.fillStyle(0x5a3a3a);
        bruteGfx.fillRect(4, 4, 24, 24);
        bruteGfx.fillStyle(0x7a4a4a);
        bruteGfx.fillRect(0, 8, 8, 16);
        bruteGfx.fillRect(24, 8, 8, 16);
        bruteGfx.fillStyle(0xff0000);
        bruteGfx.fillCircle(12, 12, 3);
        bruteGfx.fillCircle(20, 12, 3);
        bruteGfx.generateTexture('brute', 32, 32);

        // Cocoon
        const cocoonGfx = this.make.graphics({ add: false });
        cocoonGfx.fillStyle(0x4a3a5a);
        cocoonGfx.fillCircle(16, 18, 14);
        cocoonGfx.fillStyle(0x6a4a7a);
        cocoonGfx.fillCircle(16, 14, 8);
        cocoonGfx.fillStyle(0x8a5a9a);
        cocoonGfx.fillCircle(16, 10, 4);
        cocoonGfx.generateTexture('cocoon', 32, 32);

        // Bullet
        const bulletGfx = this.make.graphics({ add: false });
        bulletGfx.fillStyle(0xffff44);
        bulletGfx.fillRect(0, 0, 8, 4);
        bulletGfx.fillStyle(0xffffff);
        bulletGfx.fillRect(0, 1, 4, 2);
        bulletGfx.generateTexture('bullet', 8, 4);

        // Acid projectile
        const acidGfx = this.make.graphics({ add: false });
        acidGfx.fillStyle(0x44ff44);
        acidGfx.fillCircle(5, 5, 5);
        acidGfx.fillStyle(0x88ff88);
        acidGfx.fillCircle(4, 4, 2);
        acidGfx.generateTexture('acid', 10, 10);

        // Container/crate
        const crateGfx = this.make.graphics({ add: false });
        crateGfx.fillStyle(0x5a4a3a);
        crateGfx.fillRect(4, 4, 24, 24);
        crateGfx.lineStyle(2, 0x6a5a4a);
        crateGfx.strokeRect(6, 6, 20, 20);
        crateGfx.fillStyle(0x7a6a5a);
        crateGfx.fillRect(14, 8, 4, 16);
        crateGfx.generateTexture('crate', 32, 32);

        // Workbench
        const benchGfx = this.make.graphics({ add: false });
        benchGfx.fillStyle(0x4a4a5a);
        benchGfx.fillRect(0, 8, 32, 20);
        benchGfx.fillStyle(0x5a5a6a);
        benchGfx.fillRect(2, 10, 28, 16);
        benchGfx.fillStyle(0x888888);
        benchGfx.fillRect(4, 12, 8, 8);
        benchGfx.fillRect(20, 12, 8, 8);
        benchGfx.generateTexture('workbench', 32, 32);

        // Bed
        const bedGfx = this.make.graphics({ add: false });
        bedGfx.fillStyle(0x3a3a4a);
        bedGfx.fillRect(0, 4, 32, 24);
        bedGfx.fillStyle(0x5a5a7a);
        bedGfx.fillRect(2, 6, 28, 20);
        bedGfx.fillStyle(0xaaaacc);
        bedGfx.fillRect(4, 8, 10, 8);
        bedGfx.generateTexture('bed', 32, 32);

        // Medical station
        const medGfx = this.make.graphics({ add: false });
        medGfx.fillStyle(0x5a5a5a);
        medGfx.fillRect(4, 4, 24, 24);
        medGfx.fillStyle(0xffffff);
        medGfx.fillRect(14, 8, 4, 16);
        medGfx.fillRect(8, 14, 16, 4);
        medGfx.generateTexture('medstation', 32, 32);

        // Escape pod
        const podGfx = this.make.graphics({ add: false });
        podGfx.fillStyle(0x3a5a3a);
        podGfx.fillCircle(24, 24, 20);
        podGfx.fillStyle(0x4a7a4a);
        podGfx.fillCircle(24, 24, 14);
        podGfx.fillStyle(0x6aaa6a);
        podGfx.fillCircle(24, 24, 8);
        podGfx.fillStyle(0xaaffaa);
        podGfx.fillCircle(24, 20, 4);
        podGfx.generateTexture('escapepod', 48, 48);

        // Items
        const foodGfx = this.make.graphics({ add: false });
        foodGfx.fillStyle(0xaa6622);
        foodGfx.fillRect(4, 6, 16, 12);
        foodGfx.fillStyle(0xcc8844);
        foodGfx.fillRect(6, 8, 12, 8);
        foodGfx.generateTexture('food', 24, 24);

        const medkitGfx = this.make.graphics({ add: false });
        medkitGfx.fillStyle(0xffffff);
        medkitGfx.fillRect(4, 4, 16, 16);
        medkitGfx.fillStyle(0xff0000);
        medkitGfx.fillRect(10, 6, 4, 12);
        medkitGfx.fillRect(6, 10, 12, 4);
        medkitGfx.generateTexture('medkit', 24, 24);

        const antidoteGfx = this.make.graphics({ add: false });
        antidoteGfx.fillStyle(0x44aa44);
        antidoteGfx.fillRect(8, 4, 8, 16);
        antidoteGfx.fillStyle(0x66cc66);
        antidoteGfx.fillRect(10, 6, 4, 10);
        antidoteGfx.generateTexture('antidote', 24, 24);

        const scrapGfx = this.make.graphics({ add: false });
        scrapGfx.fillStyle(0x888888);
        scrapGfx.fillRect(2, 8, 8, 8);
        scrapGfx.fillRect(12, 4, 8, 12);
        scrapGfx.fillStyle(0xaaaaaa);
        scrapGfx.fillRect(4, 10, 4, 4);
        scrapGfx.generateTexture('scrap', 24, 24);

        const keycardGfx = this.make.graphics({ add: false });
        keycardGfx.fillStyle(0xcc2222);
        keycardGfx.fillRect(2, 6, 20, 12);
        keycardGfx.fillStyle(0xffff00);
        keycardGfx.fillRect(4, 10, 6, 4);
        keycardGfx.generateTexture('keycard', 24, 24);

        // Blood splatter
        const bloodGfx = this.make.graphics({ add: false });
        bloodGfx.fillStyle(0x8a2222);
        bloodGfx.fillCircle(16, 16, 12);
        bloodGfx.fillCircle(8, 20, 6);
        bloodGfx.fillCircle(24, 12, 8);
        bloodGfx.fillStyle(0x6a1111);
        bloodGfx.fillCircle(12, 14, 4);
        bloodGfx.generateTexture('blood', 32, 32);

        // Muzzle flash
        const flashGfx = this.make.graphics({ add: false });
        flashGfx.fillStyle(0xffff88);
        flashGfx.fillCircle(8, 8, 8);
        flashGfx.fillStyle(0xffffff);
        flashGfx.fillCircle(8, 8, 4);
        flashGfx.generateTexture('muzzleflash', 16, 16);
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(0x0a0808);

        this.add.text(width/2, 80, 'ISOLATION PROTOCOL', {
            font: 'bold 28px Courier New',
            fill: '#aa3333',
            stroke: '#1a0808',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 120, 'A Subterrain Clone', {
            font: '14px Courier New',
            fill: '#666666'
        }).setOrigin(0.5);

        // Story text
        const storyBox = this.add.rectangle(width/2, 250, 600, 120, 0x1a1a1a, 0.9);
        storyBox.setStrokeStyle(1, 0x3a3a3a);

        this.add.text(width/2, 250, [
            'The outbreak has overrun the underground facility.',
            'You are the sole survivor. Resources are scarce.',
            'Find the escape pod before the infection consumes everything.',
            '',
            'Time is running out.'
        ].join('\n'), {
            font: '12px Courier New',
            fill: '#888888',
            align: 'center'
        }).setOrigin(0.5);

        // Controls
        this.add.text(width/2, 380, 'WASD - Move | Mouse - Aim | Click - Attack | E - Interact | Tab - Inventory | Q - Debug', {
            font: '11px Courier New',
            fill: '#555555'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.rectangle(width/2, 480, 180, 45, 0x3a1a1a);
        startBtn.setStrokeStyle(2, 0xaa3333);
        startBtn.setInteractive({ useHandCursor: true });

        this.add.text(width/2, 480, 'BEGIN', {
            font: 'bold 18px Courier New',
            fill: '#aa3333'
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setFillStyle(0x5a2a2a));
        startBtn.on('pointerout', () => startBtn.setFillStyle(0x3a1a1a));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.initGameState();
        this.generateSectors();
        this.createPlayer();
        this.loadSector('hub');
        this.createUI();
        this.setupInput();

        // Start time
        this.gameTime = 0;
        this.globalInfection = 0;
    }

    initGameState() {
        // Player stats
        this.health = CONFIG.maxHealth;
        this.hunger = 0;
        this.infection = 0;

        // Inventory (20 slots)
        this.inventory = [
            { type: 'food', name: 'Canned Food', count: 2 },
            { type: 'food', name: 'Water Bottle', count: 2 },
            { type: 'melee', name: 'Shiv', damage: 10, durability: 20 }
        ];

        // Power
        this.totalPower = 500;
        this.powerAllocation = {
            hub: true,
            storage: false,
            medical: false,
            research: false,
            escape: false
        };

        // Progression
        this.hasKeycard = false;
        this.clearedContainers = new Set();
        this.killedEnemies = new Set();

        // Combat
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.items = [];

        this.attackCooldown = 0;
        this.invincible = false;
        this.invincibleTimer = 0;

        this.debugMode = false;
        this.floatingTexts = [];

        this.currentSector = 'hub';
    }

    generateSectors() {
        this.sectorData = {};

        // Generate each sector
        Object.keys(CONFIG.sectors).forEach(sectorId => {
            const sectorConfig = CONFIG.sectors[sectorId];
            this.sectorData[sectorId] = {
                tiles: this.generateSectorTiles(sectorId, sectorConfig),
                enemies: this.generateSectorEnemies(sectorId),
                containers: this.generateSectorContainers(sectorId),
                cleared: false
            };
        });
    }

    generateSectorTiles(sectorId, config) {
        const tiles = [];
        const { w, h } = config.size;

        for (let y = 0; y < h; y++) {
            tiles[y] = [];
            for (let x = 0; x < w; x++) {
                // Walls on border
                if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
                    tiles[y][x] = { type: 'wall', walkable: false };
                } else {
                    tiles[y][x] = { type: 'floor', walkable: true };
                }
            }
        }

        // Add doors based on sector connections
        const doorPositions = this.getDoorPositions(sectorId, w, h);
        doorPositions.forEach(door => {
            tiles[door.y][door.x] = { type: 'door', walkable: true, target: door.target, direction: door.direction };
        });

        // Add sector-specific objects
        this.addSectorObjects(tiles, sectorId, w, h);

        return tiles;
    }

    getDoorPositions(sectorId, w, h) {
        const doors = [];
        const midX = Math.floor(w / 2);
        const midY = Math.floor(h / 2);

        switch (sectorId) {
            case 'hub':
                doors.push({ x: midX, y: 0, target: 'escape', direction: 'north' });
                doors.push({ x: midX, y: h - 1, target: 'storage', direction: 'south' });
                doors.push({ x: 0, y: midY, target: 'research', direction: 'west' });
                doors.push({ x: w - 1, y: midY, target: 'medical', direction: 'east' });
                break;
            case 'storage':
                doors.push({ x: midX, y: 0, target: 'hub', direction: 'north' });
                break;
            case 'medical':
                doors.push({ x: 0, y: midY, target: 'hub', direction: 'west' });
                break;
            case 'research':
                doors.push({ x: w - 1, y: midY, target: 'hub', direction: 'east' });
                break;
            case 'escape':
                doors.push({ x: midX, y: h - 1, target: 'hub', direction: 'south' });
                break;
        }

        return doors;
    }

    addSectorObjects(tiles, sectorId, w, h) {
        switch (sectorId) {
            case 'hub':
                // Workbench
                tiles[3][3] = { type: 'workbench', walkable: false, interactable: true };
                // Bed
                tiles[3][w - 4] = { type: 'bed', walkable: false, interactable: true };
                // Storage locker
                tiles[h - 4][3] = { type: 'crate', walkable: false, interactable: true, id: 'hub_storage' };
                break;

            case 'medical':
                // Medical station
                tiles[Math.floor(h/2)][Math.floor(w/2)] = { type: 'medstation', walkable: false, interactable: true };
                break;

            case 'escape':
                // Escape pod
                tiles[Math.floor(h/2)][Math.floor(w/2)] = { type: 'escapepod', walkable: false, interactable: true };
                break;
        }
    }

    generateSectorEnemies(sectorId) {
        const enemies = [];
        if (sectorId === 'hub') return enemies; // Hub is safe

        const config = CONFIG.sectors[sectorId];
        const { w, h } = config.size;

        let enemyCount = 0;
        let types = [];

        switch (sectorId) {
            case 'storage':
                enemyCount = 4;
                types = ['shambler', 'shambler', 'shambler', 'crawler'];
                break;
            case 'medical':
                enemyCount = 5;
                types = ['shambler', 'shambler', 'spitter', 'spitter', 'crawler'];
                break;
            case 'research':
                enemyCount = 6;
                types = ['crawler', 'crawler', 'spitter', 'brute', 'shambler', 'cocoon'];
                break;
            case 'escape':
                enemyCount = 7;
                types = ['shambler', 'shambler', 'brute', 'brute', 'spitter', 'crawler', 'crawler'];
                break;
        }

        for (let i = 0; i < enemyCount; i++) {
            const type = types[i % types.length];
            enemies.push({
                id: `${sectorId}_enemy_${i}`,
                type,
                x: 3 + Math.floor(Math.random() * (w - 6)),
                y: 3 + Math.floor(Math.random() * (h - 6)),
                alive: true
            });
        }

        return enemies;
    }

    generateSectorContainers(sectorId) {
        const containers = [];
        if (sectorId === 'hub') return containers;

        const config = CONFIG.sectors[sectorId];
        const { w, h } = config.size;

        let containerCount = 0;
        let lootTable = [];

        switch (sectorId) {
            case 'storage':
                containerCount = 8;
                lootTable = ['food', 'food', 'scrap', 'scrap', 'scrap', 'food'];
                break;
            case 'medical':
                containerCount = 5;
                lootTable = ['medkit', 'medkit', 'antidote', 'antidote', 'scrap'];
                break;
            case 'research':
                containerCount = 6;
                lootTable = ['scrap', 'scrap', 'antidote', 'keycard']; // Keycard here!
                break;
            case 'escape':
                containerCount = 3;
                lootTable = ['medkit', 'food', 'scrap'];
                break;
        }

        for (let i = 0; i < containerCount; i++) {
            containers.push({
                id: `${sectorId}_container_${i}`,
                x: 2 + Math.floor(Math.random() * (w - 4)),
                y: 2 + Math.floor(Math.random() * (h - 4)),
                loot: lootTable[i % lootTable.length],
                opened: false
            });
        }

        return containers;
    }

    loadSector(sectorId) {
        this.currentSector = sectorId;
        const sector = this.sectorData[sectorId];
        const config = CONFIG.sectors[sectorId];

        // Clear existing
        if (this.tileGroup) this.tileGroup.clear(true, true);
        if (this.objectGroup) this.objectGroup.clear(true, true);
        this.enemies.forEach(e => e.sprite.destroy());
        this.enemies = [];
        this.items.forEach(i => i.sprite.destroy());
        this.items = [];
        this.bullets.forEach(b => b.destroy());
        this.bullets = [];
        this.enemyBullets.forEach(b => b.destroy());
        this.enemyBullets = [];

        this.tileGroup = this.add.group();
        this.objectGroup = this.add.group();

        // Render tiles
        const { w, h } = config.size;
        const offsetX = (CONFIG.width - w * CONFIG.tileSize) / 2;
        const offsetY = (CONFIG.height - h * CONFIG.tileSize) / 2;

        this.roomOffset = { x: offsetX, y: offsetY };
        this.roomSize = { w, h };

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const tile = sector.tiles[y][x];
                let texture = 'floor';

                if (tile.type === 'wall') texture = 'wall';
                else if (tile.type === 'door') texture = 'door';
                else if (tile.type === 'workbench') texture = 'workbench';
                else if (tile.type === 'bed') texture = 'bed';
                else if (tile.type === 'medstation') texture = 'medstation';
                else if (tile.type === 'escapepod') texture = 'escapepod';
                else if (tile.type === 'crate') texture = 'crate';

                const sprite = this.add.sprite(offsetX + x * CONFIG.tileSize, offsetY + y * CONFIG.tileSize, texture);
                sprite.setOrigin(0);
                sprite.setDepth(tile.type === 'floor' ? 0 : 1);
                this.tileGroup.add(sprite);

                // Darken unpowered sectors
                if (!this.powerAllocation[sectorId] && sectorId !== 'hub') {
                    sprite.setTint(0x444444);
                }
            }
        }

        // Spawn containers
        sector.containers.forEach(container => {
            if (!this.clearedContainers.has(container.id) && !container.opened) {
                const sprite = this.add.sprite(
                    offsetX + container.x * CONFIG.tileSize + CONFIG.tileSize/2,
                    offsetY + container.y * CONFIG.tileSize + CONFIG.tileSize/2,
                    'crate'
                );
                sprite.setDepth(10);
                sprite.containerId = container.id;
                sprite.loot = container.loot;
                this.objectGroup.add(sprite);
            }
        });

        // Spawn enemies
        sector.enemies.forEach(enemyData => {
            if (!this.killedEnemies.has(enemyData.id) && enemyData.alive) {
                this.spawnEnemy(
                    offsetX + enemyData.x * CONFIG.tileSize + CONFIG.tileSize/2,
                    offsetY + enemyData.y * CONFIG.tileSize + CONFIG.tileSize/2,
                    enemyData.type,
                    enemyData.id
                );
            }
        });

        // Position player based on entry direction
        this.positionPlayerForEntry();

        // Show sector name
        this.showFloatingText(CONFIG.width/2, 100, config.name, '#aa3333');
    }

    positionPlayerForEntry() {
        const { x: offX, y: offY } = this.roomOffset;
        const { w, h } = this.roomSize;

        // Default to center
        this.player.x = offX + (w * CONFIG.tileSize) / 2;
        this.player.y = offY + (h * CONFIG.tileSize) / 2;
    }

    spawnEnemy(x, y, type, id) {
        const enemyStats = {
            shambler: { hp: 30, speed: 50, damage: 10, behavior: 'chase' },
            crawler: { hp: 20, speed: 100, damage: 8, behavior: 'chase' },
            spitter: { hp: 25, speed: 30, damage: 15, behavior: 'ranged' },
            brute: { hp: 80, speed: 30, damage: 25, behavior: 'charge' },
            cocoon: { hp: 50, speed: 0, damage: 0, behavior: 'spawn' }
        };

        const stats = enemyStats[type];
        const sprite = this.add.sprite(x, y, type);
        sprite.setDepth(50);

        const enemy = {
            sprite,
            id,
            type,
            hp: stats.hp,
            maxHp: stats.hp,
            speed: stats.speed,
            damage: stats.damage,
            behavior: stats.behavior,
            attackCooldown: 0,
            spawnTimer: 0
        };

        this.enemies.push(enemy);
    }

    createPlayer() {
        this.player = this.add.sprite(CONFIG.width / 2, CONFIG.height / 2, 'player');
        this.player.setDepth(100);
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setDepth(1000);

        const { width, height } = this.cameras.main;

        // Top bar
        const topBar = this.add.rectangle(width/2, 25, width, 50, 0x0a0a0a, 0.9);
        topBar.setStrokeStyle(1, 0x3a3a3a);
        this.uiContainer.add(topBar);

        // Health bar
        const hpBg = this.add.rectangle(100, 15, 150, 12, 0x3a1a1a);
        this.hpBar = this.add.rectangle(26, 15, 148, 10, 0xaa3333);
        this.hpBar.setOrigin(0, 0.5);
        this.hpText = this.add.text(100, 15, '100/100', { font: '9px Courier New', fill: '#ffffff' }).setOrigin(0.5);
        this.uiContainer.add([hpBg, this.hpBar, this.hpText]);

        // Hunger bar
        const hungerBg = this.add.rectangle(100, 35, 150, 12, 0x3a2a1a);
        this.hungerBar = this.add.rectangle(26, 35, 0, 10, 0xaa6633);
        this.hungerBar.setOrigin(0, 0.5);
        this.hungerText = this.add.text(100, 35, 'HUNGER: 0%', { font: '9px Courier New', fill: '#ffaa44' }).setOrigin(0.5);
        this.uiContainer.add([hungerBg, this.hungerBar, this.hungerText]);

        // Infection bar
        const infectBg = this.add.rectangle(280, 15, 150, 12, 0x1a3a1a);
        this.infectBar = this.add.rectangle(206, 15, 0, 10, 0x44aa44);
        this.infectBar.setOrigin(0, 0.5);
        this.infectText = this.add.text(280, 15, 'INFECTION: 0%', { font: '9px Courier New', fill: '#44ff44' }).setOrigin(0.5);
        this.uiContainer.add([infectBg, this.infectBar, this.infectText]);

        // Global infection
        this.globalText = this.add.text(280, 35, 'GLOBAL: 0%', { font: '9px Courier New', fill: '#ff4444' }).setOrigin(0.5);
        this.uiContainer.add(this.globalText);

        // Time
        this.timeText = this.add.text(width - 80, 15, 'TIME: 00:00', { font: '10px Courier New', fill: '#888888' }).setOrigin(0.5);
        this.uiContainer.add(this.timeText);

        // Sector name
        this.sectorText = this.add.text(width - 80, 35, 'CENTRAL HUB', { font: '10px Courier New', fill: '#aaaaaa' }).setOrigin(0.5);
        this.uiContainer.add(this.sectorText);

        // Power indicator
        this.powerText = this.add.text(width/2, 15, 'POWER: 500/500', { font: '10px Courier New', fill: '#44aaff' }).setOrigin(0.5);
        this.uiContainer.add(this.powerText);

        // Bottom bar - weapon
        const bottomBar = this.add.rectangle(width/2, height - 25, width, 50, 0x0a0a0a, 0.9);
        bottomBar.setStrokeStyle(1, 0x3a3a3a);
        this.uiContainer.add(bottomBar);

        this.weaponText = this.add.text(100, height - 25, 'WEAPON: Shiv', { font: '11px Courier New', fill: '#aaaaaa' }).setOrigin(0.5);
        this.uiContainer.add(this.weaponText);

        // Controls hint
        this.add.text(width - 150, height - 25, 'E: Interact | Tab: Inventory', { font: '9px Courier New', fill: '#555555' }).setOrigin(0.5);

        // Debug overlay
        this.debugOverlay = this.add.container(10, 60);
        this.debugOverlay.setDepth(2000);
        this.debugOverlay.setVisible(false);

        const debugBg = this.add.rectangle(0, 0, 180, 150, 0x000000, 0.85);
        debugBg.setOrigin(0);
        debugBg.setStrokeStyle(1, 0x44ff44);
        this.debugOverlay.add(debugBg);

        this.debugText = this.add.text(5, 5, '', { font: '10px Courier New', fill: '#44ff44' });
        this.debugOverlay.add(this.debugText);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });

        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            this.debugOverlay.setVisible(this.debugMode);
        });

        this.input.keyboard.on('keydown-E', () => this.interact());
        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.toggleInventory();
        });
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.handleCombat(delta);
        this.updateEnemies(delta);
        this.updateBullets(delta);
        this.checkDoorTransitions();
        this.updateTime(delta);
        this.updateSurvivalMeters(delta);
        this.updateUI();
        this.updateFloatingTexts(delta);

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Debug
        if (this.debugMode) this.updateDebug();

        // Win/lose checks
        if (this.health <= 0 || this.infection >= 100 || this.globalInfection >= 100) {
            this.gameOver();
        }
    }

    handleMovement(delta) {
        let dx = 0, dy = 0;

        if (this.wasd.left.isDown || this.cursors.left.isDown) dx = -1;
        else if (this.wasd.right.isDown || this.cursors.right.isDown) dx = 1;
        if (this.wasd.up.isDown || this.cursors.up.isDown) dy = -1;
        else if (this.wasd.down.isDown || this.cursors.down.isDown) dy = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Apply speed penalty from hunger
        let speedMod = 1;
        if (this.hunger >= 75) speedMod = 0.75;
        else if (this.hunger >= 50) speedMod = 0.9;

        const newX = this.player.x + dx * CONFIG.playerSpeed * speedMod * delta / 1000;
        const newY = this.player.y + dy * CONFIG.playerSpeed * speedMod * delta / 1000;

        // Check collision
        if (this.canMoveTo(newX, this.player.y)) this.player.x = newX;
        if (this.canMoveTo(this.player.x, newY)) this.player.y = newY;

        // Rotate player to face mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.setRotation(angle + Math.PI / 2);
    }

    canMoveTo(x, y) {
        const { x: offX, y: offY } = this.roomOffset;
        const { w, h } = this.roomSize;

        const tileX = Math.floor((x - offX) / CONFIG.tileSize);
        const tileY = Math.floor((y - offY) / CONFIG.tileSize);

        if (tileX < 0 || tileX >= w || tileY < 0 || tileY >= h) return false;

        const tile = this.sectorData[this.currentSector].tiles[tileY][tileX];
        return tile.walkable;
    }

    handleCombat(delta) {
        if (this.attackCooldown > 0) return;

        if (this.input.activePointer.isDown) {
            this.attack();
        }
    }

    attack() {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        // Get current weapon
        const weapon = this.inventory.find(i => i.type === 'melee' || i.type === 'ranged');

        if (!weapon) {
            // Punch
            this.meleeAttack(angle, 5);
            this.attackCooldown = 500;
        } else if (weapon.type === 'melee') {
            this.meleeAttack(angle, weapon.damage);
            this.attackCooldown = 400;
            weapon.durability--;
            if (weapon.durability <= 0) {
                const idx = this.inventory.indexOf(weapon);
                this.inventory.splice(idx, 1);
                this.showFloatingText(this.player.x, this.player.y - 30, 'Weapon broke!', '#ff4444');
            }
        } else if (weapon.type === 'ranged') {
            this.rangedAttack(angle, weapon.damage);
            this.attackCooldown = 500;
        }

        // Muzzle flash
        const flash = this.add.sprite(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'muzzleflash'
        );
        flash.setDepth(150);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });

        // Screen shake
        this.cameras.main.shake(50, 0.003);
    }

    meleeAttack(angle, damage) {
        // Check enemies in arc
        this.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
            if (dist < 50) {
                const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
                if (angleDiff < 0.8) {
                    this.damageEnemy(enemy, damage);
                }
            }
        });
    }

    rangedAttack(angle, damage) {
        const bullet = this.add.sprite(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'bullet'
        );
        bullet.setRotation(angle);
        bullet.setDepth(80);
        bullet.vx = Math.cos(angle) * 400;
        bullet.vy = Math.sin(angle) * 400;
        bullet.damage = damage;
        this.bullets.push(bullet);
    }

    updateBullets(delta) {
        // Player bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx * delta / 1000;
            bullet.y += bullet.vy * delta / 1000;

            // Check bounds
            if (bullet.x < 0 || bullet.x > CONFIG.width || bullet.y < 0 || bullet.y > CONFIG.height) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // Check enemy hits
            for (const enemy of this.enemies) {
                if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.sprite.x, enemy.sprite.y) < 20) {
                    this.damageEnemy(enemy, bullet.damage);
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Enemy bullets (acid)
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.x += bullet.vx * delta / 1000;
            bullet.y += bullet.vy * delta / 1000;

            // Check bounds
            if (bullet.x < 0 || bullet.x > CONFIG.width || bullet.y < 0 || bullet.y > CONFIG.height) {
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
                continue;
            }

            // Check player hit
            if (!this.invincible && Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y) < 16) {
                this.playerHit(bullet.damage, 10); // Extra infection from acid
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            const dist = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);

            switch (enemy.behavior) {
                case 'chase':
                    if (dist > 30) {
                        const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
                        enemy.sprite.x += Math.cos(angle) * enemy.speed * delta / 1000;
                        enemy.sprite.y += Math.sin(angle) * enemy.speed * delta / 1000;
                    } else if (enemy.attackCooldown <= 0) {
                        this.enemyMeleeAttack(enemy);
                    }
                    break;

                case 'ranged':
                    if (dist > 150) {
                        const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
                        enemy.sprite.x += Math.cos(angle) * enemy.speed * delta / 1000;
                        enemy.sprite.y += Math.sin(angle) * enemy.speed * delta / 1000;
                    } else if (dist < 80) {
                        // Retreat
                        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.sprite.x, enemy.sprite.y);
                        enemy.sprite.x += Math.cos(angle) * enemy.speed * delta / 1000;
                        enemy.sprite.y += Math.sin(angle) * enemy.speed * delta / 1000;
                    }
                    if (enemy.attackCooldown <= 0 && dist < 200) {
                        this.enemyRangedAttack(enemy);
                    }
                    break;

                case 'charge':
                    if (dist < 150 && enemy.attackCooldown <= 0) {
                        // Charge toward player
                        const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
                        enemy.sprite.x += Math.cos(angle) * enemy.speed * 3 * delta / 1000;
                        enemy.sprite.y += Math.sin(angle) * enemy.speed * 3 * delta / 1000;

                        if (dist < 30) {
                            this.enemyMeleeAttack(enemy);
                        }
                    }
                    break;

                case 'spawn':
                    enemy.spawnTimer += delta;
                    if (enemy.spawnTimer > 10000) {
                        // Spawn a shambler
                        this.spawnEnemy(enemy.sprite.x + 30, enemy.sprite.y, 'shambler', `spawned_${Date.now()}`);
                        enemy.spawnTimer = 0;
                    }
                    break;
            }

            // Contact damage check
            if (!this.invincible && dist < 20 && enemy.behavior !== 'spawn') {
                this.playerHit(enemy.damage, 5);
            }
        });
    }

    enemyMeleeAttack(enemy) {
        if (!this.invincible) {
            this.playerHit(enemy.damage, 5);
        }
        enemy.attackCooldown = 1500;
    }

    enemyRangedAttack(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, this.player.x, this.player.y);
        const bullet = this.add.sprite(enemy.sprite.x, enemy.sprite.y, 'acid');
        bullet.setDepth(80);
        bullet.vx = Math.cos(angle) * 150;
        bullet.vy = Math.sin(angle) * 150;
        bullet.damage = enemy.damage;
        this.enemyBullets.push(bullet);
        enemy.attackCooldown = 2500;
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Flash
        enemy.sprite.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.sprite.active) enemy.sprite.clearTint();
        });

        // Damage number
        this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 20, `-${damage}`, '#ffff44');

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Blood splatter
        const blood = this.add.sprite(enemy.sprite.x, enemy.sprite.y, 'blood');
        blood.setDepth(5);
        blood.setAlpha(0.7);

        // Mark as killed
        this.killedEnemies.add(enemy.id);

        // Remove from array
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) this.enemies.splice(idx, 1);

        // Destroy sprite
        enemy.sprite.destroy();

        this.showFloatingText(enemy.sprite.x, enemy.sprite.y, 'KILLED', '#44ff44');
    }

    playerHit(damage, infectionGain) {
        if (this.invincible) return;

        this.health -= damage;
        this.infection = Math.min(100, this.infection + infectionGain);

        this.invincible = true;
        this.invincibleTimer = 1000;

        // Visual feedback
        this.cameras.main.flash(100, 255, 0, 0);
        this.cameras.main.shake(100, 0.01);

        // Flicker player
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4
        });

        this.showFloatingText(this.player.x, this.player.y - 30, `-${damage}`, '#ff4444');
    }

    checkDoorTransitions() {
        const { x: offX, y: offY } = this.roomOffset;
        const { w, h } = this.roomSize;
        const tiles = this.sectorData[this.currentSector].tiles;

        const tileX = Math.floor((this.player.x - offX) / CONFIG.tileSize);
        const tileY = Math.floor((this.player.y - offY) / CONFIG.tileSize);

        if (tileX >= 0 && tileX < w && tileY >= 0 && tileY < h) {
            const tile = tiles[tileY][tileX];
            if (tile.type === 'door') {
                // Check if sector is powered
                if (!this.powerAllocation[tile.target] && tile.target !== 'hub') {
                    this.showFloatingText(this.player.x, this.player.y - 30, 'SECTOR UNPOWERED', '#ff4444');
                    return;
                }

                // Check keycard for escape pod
                if (tile.target === 'escape' && !this.hasKeycard) {
                    this.showFloatingText(this.player.x, this.player.y - 30, 'NEED KEYCARD', '#ff4444');
                    return;
                }

                this.loadSector(tile.target);
            }
        }
    }

    interact() {
        // Check containers
        this.objectGroup.children.entries.forEach(obj => {
            if (obj.containerId) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
                if (dist < 40) {
                    this.openContainer(obj);
                }
            }
        });

        // Check special objects
        const { x: offX, y: offY } = this.roomOffset;
        const tileX = Math.floor((this.player.x - offX) / CONFIG.tileSize);
        const tileY = Math.floor((this.player.y - offY) / CONFIG.tileSize);
        const tiles = this.sectorData[this.currentSector].tiles;

        // Check adjacent tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = tileX + dx;
                const ty = tileY + dy;
                if (tx >= 0 && tx < this.roomSize.w && ty >= 0 && ty < this.roomSize.h) {
                    const tile = tiles[ty][tx];

                    if (tile.type === 'bed') {
                        this.useBed();
                    } else if (tile.type === 'workbench') {
                        this.showFloatingText(this.player.x, this.player.y - 30, 'Crafting not implemented', '#888888');
                    } else if (tile.type === 'medstation' && this.powerAllocation.medical) {
                        this.useMedStation();
                    } else if (tile.type === 'escapepod' && this.hasKeycard) {
                        this.win();
                    }
                }
            }
        }
    }

    openContainer(obj) {
        this.clearedContainers.add(obj.containerId);

        // Add loot to inventory
        const loot = obj.loot;
        let name = loot;
        if (loot === 'food') name = 'Canned Food';
        else if (loot === 'medkit') name = 'Medkit';
        else if (loot === 'antidote') name = 'Antidote';
        else if (loot === 'scrap') name = 'Scrap Metal';
        else if (loot === 'keycard') {
            name = 'Red Keycard';
            this.hasKeycard = true;
            this.showFloatingText(obj.x, obj.y - 30, 'KEYCARD FOUND!', '#ff4444');
        }

        // Find existing stack or add new
        const existing = this.inventory.find(i => i.name === name && i.count < 5);
        if (existing) {
            existing.count++;
        } else if (this.inventory.length < 20) {
            this.inventory.push({ type: loot, name, count: 1 });
        }

        this.showFloatingText(obj.x, obj.y, `+${name}`, '#44aaff');
        obj.destroy();
    }

    useBed() {
        // Rest - time passes, but fatigue would be reduced
        this.gameTime += 60; // 1 hour
        this.hunger = Math.min(100, this.hunger + 5);
        this.health = Math.min(100, this.health + 10);
        this.showFloatingText(this.player.x, this.player.y - 30, 'Rested +10 HP', '#44ff44');
    }

    useMedStation() {
        this.health = Math.min(100, this.health + 30);
        this.infection = Math.max(0, this.infection - 20);
        this.showFloatingText(this.player.x, this.player.y - 30, 'Healed! Infection reduced!', '#44ff44');
    }

    toggleInventory() {
        // Use food/medkit from inventory
        const food = this.inventory.find(i => i.type === 'food');
        if (food && this.hunger > 20) {
            food.count--;
            if (food.count <= 0) {
                const idx = this.inventory.indexOf(food);
                this.inventory.splice(idx, 1);
            }
            this.hunger = Math.max(0, this.hunger - 30);
            this.showFloatingText(this.player.x, this.player.y - 30, '-30 Hunger', '#ffaa44');
            return;
        }

        const medkit = this.inventory.find(i => i.type === 'medkit');
        if (medkit && this.health < 80) {
            medkit.count--;
            if (medkit.count <= 0) {
                const idx = this.inventory.indexOf(medkit);
                this.inventory.splice(idx, 1);
            }
            this.health = Math.min(100, this.health + 30);
            this.showFloatingText(this.player.x, this.player.y - 30, '+30 Health', '#44ff44');
            return;
        }

        const antidote = this.inventory.find(i => i.type === 'antidote');
        if (antidote && this.infection > 20) {
            antidote.count--;
            if (antidote.count <= 0) {
                const idx = this.inventory.indexOf(antidote);
                this.inventory.splice(idx, 1);
            }
            this.infection = Math.max(0, this.infection - 30);
            this.showFloatingText(this.player.x, this.player.y - 30, '-30 Infection', '#44ff44');
        }
    }

    updateTime(delta) {
        // 1 real second = 1 game minute
        this.gameTime += delta / 1000;

        // Global infection increases
        this.globalInfection += 0.1 * delta / 1000;

        // Infection from unpowered sector
        if (!this.powerAllocation[this.currentSector] && this.currentSector !== 'hub') {
            this.infection += 0.5 * delta / 1000;
        }
    }

    updateSurvivalMeters(delta) {
        // Hunger increases over time
        this.hunger = Math.min(100, this.hunger + 0.1 * delta / 1000);

        // Health drain from high hunger
        if (this.hunger >= 100) {
            this.health -= 5 * delta / 1000;
        } else if (this.hunger >= 75) {
            this.health -= 1 * delta / 1000;
        }

        // Health drain from high infection
        if (this.infection >= 75) {
            this.health -= 2 * delta / 1000;
        }
    }

    updateUI() {
        // Health
        this.hpBar.width = 148 * (this.health / CONFIG.maxHealth);
        this.hpText.setText(`${Math.floor(this.health)}/${CONFIG.maxHealth}`);

        // Hunger
        this.hungerBar.width = 148 * (this.hunger / CONFIG.maxHunger);
        this.hungerText.setText(`HUNGER: ${Math.floor(this.hunger)}%`);

        // Infection
        this.infectBar.width = 148 * (this.infection / CONFIG.maxInfection);
        this.infectText.setText(`INFECTION: ${Math.floor(this.infection)}%`);

        // Global
        this.globalText.setText(`GLOBAL: ${Math.floor(this.globalInfection)}%`);
        if (this.globalInfection > 75) this.globalText.setColor('#ff0000');
        else if (this.globalInfection > 50) this.globalText.setColor('#ff4444');

        // Time
        const hours = Math.floor(this.gameTime / 60);
        const mins = Math.floor(this.gameTime % 60);
        this.timeText.setText(`TIME: ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);

        // Sector
        this.sectorText.setText(CONFIG.sectors[this.currentSector].name.toUpperCase());

        // Power
        const usedPower = Object.keys(this.powerAllocation)
            .filter(s => this.powerAllocation[s])
            .reduce((sum, s) => sum + CONFIG.sectors[s].powerCost, 0);
        this.powerText.setText(`POWER: ${this.totalPower - usedPower}/${this.totalPower}`);

        // Weapon
        const weapon = this.inventory.find(i => i.type === 'melee' || i.type === 'ranged');
        this.weaponText.setText(`WEAPON: ${weapon ? weapon.name : 'Fists'}`);
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            font: 'bold 11px Courier New',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(3000);

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

    updateDebug() {
        const text = [
            `DEBUG (Q to toggle)`,
            `Pos: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
            `HP: ${Math.floor(this.health)}/${CONFIG.maxHealth}`,
            `Hunger: ${Math.floor(this.hunger)}%`,
            `Infection: ${Math.floor(this.infection)}%`,
            `Global: ${Math.floor(this.globalInfection)}%`,
            `Sector: ${this.currentSector}`,
            `Enemies: ${this.enemies.length}`,
            `Has Keycard: ${this.hasKeycard}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugText.setText(text);
    }

    win() {
        this.scene.start('WinScene', {
            time: this.gameTime,
            infection: this.globalInfection
        });
    }

    gameOver() {
        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);
        overlay.setDepth(5000);

        let cause = 'You died.';
        if (this.infection >= 100) cause = 'The infection consumed you.';
        else if (this.globalInfection >= 100) cause = 'The facility is lost.';

        this.add.text(width/2, height/2 - 50, 'GAME OVER', {
            font: 'bold 32px Courier New',
            fill: '#aa3333'
        }).setOrigin(0.5).setDepth(5001);

        this.add.text(width/2, height/2, cause, {
            font: '14px Courier New',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(5001);

        this.add.text(width/2, height/2 + 50, 'Click to restart', {
            font: '12px Courier New',
            fill: '#555555'
        }).setOrigin(0.5).setDepth(5001);

        this.input.once('pointerdown', () => this.scene.restart());
    }
}

// Win Scene
class WinScene extends Phaser.Scene {
    constructor() { super('WinScene'); }

    init(data) {
        this.finalTime = data.time || 0;
        this.finalInfection = data.infection || 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(0x0a0808);

        this.add.text(width/2, 100, 'ESCAPED', {
            font: 'bold 48px Courier New',
            fill: '#44aa44',
            stroke: '#1a3a1a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 180, 'You made it to the escape pod.', {
            font: '16px Courier New',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        const hours = Math.floor(this.finalTime / 60);
        const mins = Math.floor(this.finalTime % 60);

        this.add.text(width/2, 250, `Time: ${hours}h ${mins}m`, {
            font: '14px Courier New',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(width/2, 280, `Global Infection: ${Math.floor(this.finalInfection)}%`, {
            font: '14px Courier New',
            fill: '#ff6666'
        }).setOrigin(0.5);

        const restartBtn = this.add.rectangle(width/2, 380, 180, 45, 0x1a3a1a);
        restartBtn.setStrokeStyle(2, 0x44aa44);
        restartBtn.setInteractive({ useHandCursor: true });

        this.add.text(width/2, 380, 'PLAY AGAIN', {
            font: 'bold 16px Courier New',
            fill: '#44aa44'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#0a0808',
    scene: [BootScene, MenuScene, GameScene, WinScene]
};

// Start game
const game = new Phaser.Game(config);
