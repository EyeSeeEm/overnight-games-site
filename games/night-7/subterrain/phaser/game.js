// Isolation Protocol - Subterrain Clone
// Survival horror with exploration and crafting
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player (32x32)
        g.fillStyle(0x4488aa);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0xddccaa);
        g.fillCircle(16, 8, 6);
        g.fillStyle(0x336688);
        g.fillRect(4, 12, 6, 12);
        g.fillRect(22, 12, 6, 12);
        g.generateTexture('player', 32, 32);
        g.clear();

        // Shambler enemy
        g.fillStyle(0x556644);
        g.fillRect(6, 4, 20, 24);
        g.fillStyle(0x88aa77);
        g.fillCircle(16, 8, 7);
        g.fillStyle(0xff4444);
        g.fillCircle(12, 6, 2);
        g.fillCircle(20, 6, 2);
        g.generateTexture('shambler', 32, 32);
        g.clear();

        // Crawler enemy
        g.fillStyle(0x445533);
        g.fillRect(4, 16, 24, 12);
        g.fillStyle(0x667744);
        g.fillRect(8, 18, 16, 8);
        g.fillStyle(0xff2222);
        g.fillRect(10, 20, 4, 2);
        g.fillRect(18, 20, 4, 2);
        g.generateTexture('crawler', 32, 32);
        g.clear();

        // Spitter enemy
        g.fillStyle(0x448844);
        g.fillRect(8, 6, 16, 20);
        g.fillStyle(0x66aa66);
        g.fillCircle(16, 10, 6);
        g.fillStyle(0xaaff44);
        g.fillCircle(16, 24, 4);
        g.generateTexture('spitter', 32, 32);
        g.clear();

        // Brute enemy (larger)
        g.fillStyle(0x664422);
        g.fillRect(4, 4, 40, 40);
        g.fillStyle(0x885533);
        g.fillCircle(24, 16, 12);
        g.fillStyle(0xff4444);
        g.fillCircle(18, 12, 3);
        g.fillCircle(30, 12, 3);
        g.generateTexture('brute', 48, 48);
        g.clear();

        // Cocoon
        g.fillStyle(0x446644);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x668866);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xaaff88);
        g.fillCircle(16, 16, 5);
        g.generateTexture('cocoon', 32, 32);
        g.clear();

        // Floor tile
        g.fillStyle(0x222228);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x333338);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);
        g.clear();

        // Wall tile
        g.fillStyle(0x444450);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x555560);
        g.fillRect(2, 2, 28, 14);
        g.generateTexture('wall', 32, 32);
        g.clear();

        // Door
        g.fillStyle(0x554433);
        g.fillRect(0, 8, 32, 16);
        g.fillStyle(0x776655);
        g.fillRect(4, 10, 24, 12);
        g.fillStyle(0xffdd44);
        g.fillCircle(24, 16, 3);
        g.generateTexture('door', 32, 32);
        g.clear();

        // Crate/container
        g.fillStyle(0x665544);
        g.fillRect(4, 8, 24, 20);
        g.fillStyle(0x887766);
        g.fillRect(6, 10, 20, 8);
        g.generateTexture('crate', 32, 32);
        g.clear();

        // Workbench
        g.fillStyle(0x443322);
        g.fillRect(0, 8, 32, 20);
        g.fillStyle(0x665544);
        g.fillRect(2, 10, 28, 16);
        g.fillStyle(0xaaaaaa);
        g.fillRect(6, 12, 8, 6);
        g.fillRect(18, 12, 8, 6);
        g.generateTexture('workbench', 32, 32);
        g.clear();

        // Bed
        g.fillStyle(0x333355);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x555577);
        g.fillRect(6, 6, 20, 10);
        g.generateTexture('bed', 32, 32);
        g.clear();

        // Medical station
        g.fillStyle(0x446688);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xffffff);
        g.fillRect(14, 8, 4, 16);
        g.fillRect(8, 14, 16, 4);
        g.generateTexture('medical_station', 32, 32);
        g.clear();

        // Escape pod
        g.fillStyle(0x888888);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x44ff44);
        g.fillCircle(16, 16, 8);
        g.fillStyle(0xffffff);
        g.fillTriangle(16, 8, 10, 20, 22, 20);
        g.generateTexture('escape_pod', 32, 32);
        g.clear();

        // Items
        // Food
        g.fillStyle(0x886644);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0xaa8866);
        g.fillRect(6, 10, 20, 12);
        g.generateTexture('food', 32, 32);
        g.clear();

        // Medkit
        g.fillStyle(0xffffff);
        g.fillRect(6, 6, 20, 20);
        g.fillStyle(0xff4444);
        g.fillRect(14, 8, 4, 16);
        g.fillRect(8, 14, 16, 4);
        g.generateTexture('medkit', 32, 32);
        g.clear();

        // Antidote
        g.fillStyle(0x44ff44);
        g.fillRect(10, 4, 12, 24);
        g.fillStyle(0xffffff);
        g.fillRect(12, 0, 8, 4);
        g.generateTexture('antidote', 32, 32);
        g.clear();

        // Keycard
        g.fillStyle(0xff4444);
        g.fillRect(4, 10, 24, 12);
        g.fillStyle(0xffffff);
        g.fillRect(6, 12, 8, 8);
        g.generateTexture('keycard', 32, 32);
        g.clear();

        // Scrap
        g.fillStyle(0x888888);
        g.fillRect(4, 8, 10, 16);
        g.fillRect(16, 12, 12, 8);
        g.generateTexture('scrap', 32, 32);
        g.clear();

        // Bullet
        g.fillStyle(0xffff44);
        g.fillRect(0, 0, 4, 8);
        g.generateTexture('bullet', 4, 8);
        g.clear();

        // Acid projectile
        g.fillStyle(0x88ff44);
        g.fillCircle(6, 6, 6);
        g.generateTexture('acid', 12, 12);
        g.clear();

        // Muzzle flash
        g.fillStyle(0xffff88);
        g.fillCircle(8, 8, 8);
        g.generateTexture('muzzle', 16, 16);
        g.clear();

        g.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x0a0a0f);

        this.add.text(cx, 100, 'ISOLATION PROTOCOL', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#44ff44',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, 150, 'A Subterrain Clone', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#448844'
        }).setOrigin(0.5);

        const instructions = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Attack/Shoot',
            'E - Interact/Pickup',
            'TAB - Inventory',
            '1-3 - Quick Use Items',
            '',
            'Survive the infection.',
            'Find the Red Keycard.',
            'Escape before its too late.',
            '',
            'Global infection rises constantly.',
            'At 100% - Game Over!',
            '',
            'Click to begin'
        ];

        this.add.text(cx, 380, instructions.join('\n'), {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#888888',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Constants
        this.TILE_SIZE = 32;
        this.ROOM_WIDTH = 20;
        this.ROOM_HEIGHT = 15;

        // Sector definitions
        this.SECTORS = {
            hub: { name: 'Central Hub', power: 0, x: 1, y: 1 },
            storage: { name: 'Storage Wing', power: 100, x: 1, y: 2 },
            medical: { name: 'Medical Bay', power: 150, x: 2, y: 1 },
            research: { name: 'Research Lab', power: 200, x: 0, y: 1 },
            escape: { name: 'Escape Pod', power: 300, x: 1, y: 0 }
        };

        // Player stats
        this.player = {
            hp: 100, maxHp: 100,
            hunger: 0, // 0-100, higher = worse
            infection: 0, // 0-100
            hasKeycard: false,
            weapon: 'fists',
            ammo: 0,
            inventory: [
                { type: 'food', name: 'Canned Food', count: 2 },
                { type: 'medkit', name: 'Medkit', count: 1 }
            ]
        };

        // Game state
        this.currentSector = 'hub';
        this.globalInfection = 0;
        this.gameTime = 0;
        this.powerBudget = 500;
        this.poweredSectors = { hub: true };
        this.gameOver = false;

        // Room persistence - store state for each sector
        this.sectorStates = {};
        Object.keys(this.SECTORS).forEach(id => {
            this.sectorStates[id] = {
                enemies: [],
                items: [],
                containers: [],
                initialized: false
            };
        });

        // Groups
        this.wallGroup = this.add.group();
        this.enemyGroup = this.physics.add.group();
        this.itemGroup = this.physics.add.group();
        this.bulletGroup = this.physics.add.group();
        this.enemyBulletGroup = this.physics.add.group();

        // Create player
        this.playerSprite = this.physics.add.sprite(
            this.ROOM_WIDTH * this.TILE_SIZE / 2,
            this.ROOM_HEIGHT * this.TILE_SIZE / 2,
            'player'
        );
        this.playerSprite.setCollideWorldBounds(true);
        this.playerSprite.setDepth(10);
        this.playerSprite.body.setSize(20, 20);

        // Load initial sector
        this.loadSector('hub');

        // Create UI
        this.createUI();

        // Input
        this.setupInput();

        // Collisions
        this.physics.add.overlap(this.bulletGroup, this.enemyGroup, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.playerSprite, this.enemyBulletGroup, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.playerSprite, this.enemyGroup, this.touchEnemy, null, this);
        this.physics.add.overlap(this.playerSprite, this.itemGroup, this.nearItem, null, this);

        // Game timers
        this.time.addEvent({
            delay: 1000,
            callback: () => this.updateGameTime(),
            loop: true
        });

        // Attack cooldown
        this.canAttack = true;
        this.attackCooldown = 500;

        // Interaction text
        this.interactText = this.add.text(400, 500, '', {
            fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.nearbyItem = null;
        this.nearbyObject = null;
    }

    loadSector(sectorId, spawnDirection = null) {
        // Save current sector state
        if (this.currentSector) {
            this.saveSectorState();
        }

        this.currentSector = sectorId;
        const sector = this.SECTORS[sectorId];

        // Clear existing
        this.wallGroup.clear(true, true);
        this.enemyGroup.clear(true, true);
        this.itemGroup.clear(true, true);
        this.bulletGroup.clear(true, true);
        this.enemyBulletGroup.clear(true, true);

        // Generate room layout
        this.generateRoom(sectorId);

        // Load or initialize sector state
        if (!this.sectorStates[sectorId].initialized) {
            this.initializeSector(sectorId);
        } else {
            this.restoreSectorState(sectorId);
        }

        // Position player based on entry direction
        if (spawnDirection === 'top') {
            this.playerSprite.setPosition(this.ROOM_WIDTH * this.TILE_SIZE / 2, (this.ROOM_HEIGHT - 2) * this.TILE_SIZE);
        } else if (spawnDirection === 'bottom') {
            this.playerSprite.setPosition(this.ROOM_WIDTH * this.TILE_SIZE / 2, 2 * this.TILE_SIZE);
        } else if (spawnDirection === 'left') {
            this.playerSprite.setPosition((this.ROOM_WIDTH - 2) * this.TILE_SIZE, this.ROOM_HEIGHT * this.TILE_SIZE / 2);
        } else if (spawnDirection === 'right') {
            this.playerSprite.setPosition(2 * this.TILE_SIZE, this.ROOM_HEIGHT * this.TILE_SIZE / 2);
        }

        this.updateUI();
    }

    generateRoom(sectorId) {
        // Create floor and walls
        for (let y = 0; y < this.ROOM_HEIGHT; y++) {
            for (let x = 0; x < this.ROOM_WIDTH; x++) {
                // Floor
                this.add.image(x * this.TILE_SIZE + 16, y * this.TILE_SIZE + 16, 'floor');

                // Walls on edges
                if (x === 0 || x === this.ROOM_WIDTH - 1 || y === 0 || y === this.ROOM_HEIGHT - 1) {
                    // Leave gaps for doors
                    const midX = Math.floor(this.ROOM_WIDTH / 2);
                    const midY = Math.floor(this.ROOM_HEIGHT / 2);

                    let isDoor = false;

                    // Check for doors based on sector connections
                    const sectorPos = this.SECTORS[sectorId];

                    if (y === 0 && x >= midX - 1 && x <= midX + 1) {
                        // Top door
                        const aboveSector = Object.keys(this.SECTORS).find(s =>
                            this.SECTORS[s].x === sectorPos.x && this.SECTORS[s].y === sectorPos.y - 1);
                        if (aboveSector) isDoor = true;
                    }
                    if (y === this.ROOM_HEIGHT - 1 && x >= midX - 1 && x <= midX + 1) {
                        // Bottom door
                        const belowSector = Object.keys(this.SECTORS).find(s =>
                            this.SECTORS[s].x === sectorPos.x && this.SECTORS[s].y === sectorPos.y + 1);
                        if (belowSector) isDoor = true;
                    }
                    if (x === 0 && y >= midY - 1 && y <= midY + 1) {
                        // Left door
                        const leftSector = Object.keys(this.SECTORS).find(s =>
                            this.SECTORS[s].x === sectorPos.x - 1 && this.SECTORS[s].y === sectorPos.y);
                        if (leftSector) isDoor = true;
                    }
                    if (x === this.ROOM_WIDTH - 1 && y >= midY - 1 && y <= midY + 1) {
                        // Right door
                        const rightSector = Object.keys(this.SECTORS).find(s =>
                            this.SECTORS[s].x === sectorPos.x + 1 && this.SECTORS[s].y === sectorPos.y);
                        if (rightSector) isDoor = true;
                    }

                    if (!isDoor) {
                        const wall = this.physics.add.staticImage(x * this.TILE_SIZE + 16, y * this.TILE_SIZE + 16, 'wall');
                        this.wallGroup.add(wall);
                    }
                }
            }
        }

        // Add static objects based on sector
        this.addSectorObjects(sectorId);
    }

    addSectorObjects(sectorId) {
        switch (sectorId) {
            case 'hub':
                // Workbench, bed, power panel
                this.add.image(5 * this.TILE_SIZE, 4 * this.TILE_SIZE, 'workbench').setDepth(5);
                this.add.image(15 * this.TILE_SIZE, 4 * this.TILE_SIZE, 'bed').setDepth(5);
                break;
            case 'medical':
                this.add.image(10 * this.TILE_SIZE, 6 * this.TILE_SIZE, 'medical_station').setDepth(5);
                break;
            case 'escape':
                const pod = this.add.image(10 * this.TILE_SIZE, 7 * this.TILE_SIZE, 'escape_pod').setDepth(5).setScale(2);
                pod.isEscapePod = true;
                break;
        }
    }

    initializeSector(sectorId) {
        const state = this.sectorStates[sectorId];
        state.initialized = true;

        // Spawn enemies based on sector
        const enemySpawns = {
            hub: [],
            storage: [
                { type: 'shambler', x: 5, y: 5 },
                { type: 'shambler', x: 12, y: 8 },
                { type: 'crawler', x: 8, y: 10 }
            ],
            medical: [
                { type: 'shambler', x: 6, y: 6 },
                { type: 'spitter', x: 14, y: 8 },
                { type: 'crawler', x: 10, y: 10 }
            ],
            research: [
                { type: 'shambler', x: 5, y: 5 },
                { type: 'crawler', x: 10, y: 7 },
                { type: 'spitter', x: 15, y: 9 },
                { type: 'brute', x: 10, y: 12 }
            ],
            escape: [
                { type: 'brute', x: 8, y: 6 },
                { type: 'brute', x: 12, y: 6 },
                { type: 'shambler', x: 5, y: 10 },
                { type: 'shambler', x: 15, y: 10 },
                { type: 'spitter', x: 10, y: 12 }
            ]
        };

        // Spawn enemies
        (enemySpawns[sectorId] || []).forEach(spawn => {
            this.spawnEnemy(spawn.x, spawn.y, spawn.type);
        });

        // Spawn items based on sector
        const itemSpawns = {
            hub: [],
            storage: [
                { type: 'food', x: 4, y: 4 },
                { type: 'food', x: 16, y: 6 },
                { type: 'scrap', x: 8, y: 12 },
                { type: 'scrap', x: 14, y: 10 }
            ],
            medical: [
                { type: 'medkit', x: 5, y: 4 },
                { type: 'medkit', x: 15, y: 10 },
                { type: 'antidote', x: 10, y: 12 }
            ],
            research: [
                { type: 'keycard', x: 15, y: 5 },
                { type: 'scrap', x: 5, y: 10 },
                { type: 'antidote', x: 12, y: 8 }
            ],
            escape: [
                { type: 'medkit', x: 5, y: 5 },
                { type: 'food', x: 15, y: 5 }
            ]
        };

        // Spawn items
        (itemSpawns[sectorId] || []).forEach(spawn => {
            this.spawnItem(spawn.x, spawn.y, spawn.type);
        });

        // Save initial state
        this.saveSectorState();
    }

    saveSectorState() {
        const state = this.sectorStates[this.currentSector];
        state.enemies = [];
        state.items = [];

        // Save enemy positions and health
        this.enemyGroup.getChildren().forEach(enemy => {
            state.enemies.push({
                type: enemy.enemyType,
                x: enemy.x / this.TILE_SIZE,
                y: enemy.y / this.TILE_SIZE,
                hp: enemy.hp
            });
        });

        // Save item positions
        this.itemGroup.getChildren().forEach(item => {
            state.items.push({
                type: item.itemType,
                x: item.x / this.TILE_SIZE,
                y: item.y / this.TILE_SIZE
            });
        });
    }

    restoreSectorState(sectorId) {
        const state = this.sectorStates[sectorId];

        // Restore enemies
        state.enemies.forEach(enemyData => {
            const enemy = this.spawnEnemy(enemyData.x, enemyData.y, enemyData.type);
            enemy.hp = enemyData.hp;
        });

        // Restore items
        state.items.forEach(itemData => {
            this.spawnItem(itemData.x, itemData.y, itemData.type);
        });
    }

    spawnEnemy(tileX, tileY, type) {
        const enemy = this.enemyGroup.create(
            tileX * this.TILE_SIZE,
            tileY * this.TILE_SIZE,
            type === 'brute' ? 'brute' : type
        );

        enemy.enemyType = type;
        enemy.setDepth(8);

        switch (type) {
            case 'shambler':
                enemy.hp = 30;
                enemy.damage = 10;
                enemy.speed = 30;
                enemy.body.setSize(24, 24);
                break;
            case 'crawler':
                enemy.hp = 20;
                enemy.damage = 8;
                enemy.speed = 60;
                enemy.body.setSize(20, 16);
                break;
            case 'spitter':
                enemy.hp = 25;
                enemy.damage = 15;
                enemy.speed = 20;
                enemy.body.setSize(24, 24);
                enemy.canShoot = true;
                enemy.shootCooldown = 0;
                break;
            case 'brute':
                enemy.hp = 80;
                enemy.damage = 25;
                enemy.speed = 20;
                enemy.body.setSize(36, 36);
                break;
        }

        enemy.maxHp = enemy.hp;
        return enemy;
    }

    spawnItem(tileX, tileY, type) {
        const item = this.itemGroup.create(
            tileX * this.TILE_SIZE,
            tileY * this.TILE_SIZE,
            type
        );
        item.itemType = type;
        item.setDepth(5);
        item.body.setSize(24, 24);
        return item;
    }

    createUI() {
        // Health bar
        this.add.rectangle(100, 20, 150, 16, 0x333333).setScrollFactor(0).setDepth(50);
        this.hpBar = this.add.rectangle(28, 20, 144, 12, 0xff4444).setScrollFactor(0).setDepth(51);
        this.hpBar.setOrigin(0, 0.5);

        this.add.text(28, 20, 'HP', { fontSize: '10px', fontFamily: 'monospace', color: '#ffffff' })
            .setScrollFactor(0).setDepth(52);

        // Hunger bar
        this.add.rectangle(100, 40, 150, 12, 0x333333).setScrollFactor(0).setDepth(50);
        this.hungerBar = this.add.rectangle(28, 40, 0, 8, 0xff8844).setScrollFactor(0).setDepth(51);
        this.hungerBar.setOrigin(0, 0.5);

        this.add.text(28, 40, 'Hunger', { fontSize: '8px', fontFamily: 'monospace', color: '#ffffff' })
            .setScrollFactor(0).setDepth(52);

        // Infection bar
        this.add.rectangle(100, 56, 150, 12, 0x333333).setScrollFactor(0).setDepth(50);
        this.infectionBar = this.add.rectangle(28, 56, 0, 8, 0x44ff44).setScrollFactor(0).setDepth(51);
        this.infectionBar.setOrigin(0, 0.5);

        this.add.text(28, 56, 'Infection', { fontSize: '8px', fontFamily: 'monospace', color: '#ffffff' })
            .setScrollFactor(0).setDepth(52);

        // Global infection
        this.globalText = this.add.text(650, 20, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ff4444'
        }).setScrollFactor(0).setDepth(50);

        // Sector name
        this.sectorText = this.add.text(400, 560, '', {
            fontSize: '16px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

        // Weapon
        this.weaponText = this.add.text(650, 560, '', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffff44'
        }).setScrollFactor(0).setDepth(50);

        this.updateUI();
    }

    updateUI() {
        if (!this.hpBar || !this.hungerBar || !this.infectionBar) return;

        // HP
        this.hpBar.width = 144 * (this.player.hp / this.player.maxHp);

        // Hunger (0 = good, 100 = bad)
        this.hungerBar.width = 144 * (this.player.hunger / 100);

        // Infection
        this.infectionBar.width = 144 * (this.player.infection / 100);

        // Global
        this.globalText.setText(`Global: ${Math.floor(this.globalInfection)}%`);

        // Sector
        const sector = this.SECTORS[this.currentSector];
        const powered = this.poweredSectors[this.currentSector] ? '[POWERED]' : '[DARK]';
        this.sectorText.setText(`${sector.name} ${powered}`);

        // Weapon
        const weaponName = this.player.weapon === 'fists' ? 'Fists' :
            this.player.weapon === 'pistol' ? `Pistol [${this.player.ammo}]` : 'Fists';
        this.weaponText.setText(weaponName);
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            tab: Phaser.Input.Keyboard.KeyCodes.TAB
        });

        // Attack
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.attack();
            }
        });

        // Interact
        this.input.keyboard.on('keydown-E', () => this.interact());

        // Quick use
        this.input.keyboard.on('keydown-ONE', () => this.quickUse('food'));
        this.input.keyboard.on('keydown-TWO', () => this.quickUse('medkit'));
        this.input.keyboard.on('keydown-THREE', () => this.quickUse('antidote'));

        // Collisions
        this.physics.add.collider(this.playerSprite, this.wallGroup);
    }

    update(time, delta) {
        if (this.gameOver) return;

        this.handleMovement();
        this.updateEnemies(delta);
        this.checkSectorTransitions();
        this.checkNearbyObjects();
    }

    handleMovement() {
        const speed = 150;
        let vx = 0, vy = 0;

        if (this.keys.w.isDown) vy -= speed;
        if (this.keys.s.isDown) vy += speed;
        if (this.keys.a.isDown) vx -= speed;
        if (this.keys.d.isDown) vx += speed;

        // Hunger penalty
        if (this.player.hunger >= 50) {
            const penalty = this.player.hunger >= 75 ? 0.75 : 0.9;
            vx *= penalty;
            vy *= penalty;
        }

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.playerSprite.setVelocity(vx, vy);

        // Face mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.playerSprite.x, this.playerSprite.y,
            pointer.x, pointer.y
        );
        this.playerSprite.setRotation(angle + Math.PI / 2);
    }

    attack() {
        if (!this.canAttack) return;

        this.canAttack = false;

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.playerSprite.x, this.playerSprite.y,
            pointer.x, pointer.y
        );

        if (this.player.weapon === 'pistol' && this.player.ammo > 0) {
            // Shoot bullet toward mouse
            this.player.ammo--;

            const bullet = this.bulletGroup.create(this.playerSprite.x, this.playerSprite.y, 'bullet');
            bullet.damage = 15;
            this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
            bullet.setRotation(angle + Math.PI / 2);
            bullet.setDepth(15);

            // Muzzle flash
            const flash = this.add.image(
                this.playerSprite.x + Math.cos(angle) * 20,
                this.playerSprite.y + Math.sin(angle) * 20,
                'muzzle'
            ).setDepth(20);
            this.time.delayedCall(50, () => flash.destroy());

            // Screen shake
            this.cameras.main.shake(50, 0.005);

            this.attackCooldown = 300;
        } else {
            // Melee attack
            const attackRange = 40;
            const damage = 10;

            this.enemyGroup.getChildren().forEach(enemy => {
                if (!enemy || !enemy.active) return;

                const dist = Phaser.Math.Distance.Between(
                    this.playerSprite.x, this.playerSprite.y,
                    enemy.x, enemy.y
                );

                if (dist < attackRange) {
                    const angleToEnemy = Phaser.Math.Angle.Between(
                        this.playerSprite.x, this.playerSprite.y,
                        enemy.x, enemy.y
                    );

                    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - angleToEnemy));
                    if (angleDiff < Math.PI / 2) {
                        this.damageEnemy(enemy, damage);
                    }
                }
            });

            this.attackCooldown = 500;
        }

        this.time.delayedCall(this.attackCooldown, () => {
            this.canAttack = true;
        });

        this.updateUI();
    }

    bulletHitEnemy(bullet, enemy) {
        this.damageEnemy(enemy, bullet.damage);
        bullet.destroy();
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Flash white
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy && enemy.active) enemy.clearTint();
        });

        // Damage text
        const dmgText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ff4444'
        }).setDepth(100);

        this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 20,
            alpha: 0,
            duration: 500,
            onComplete: () => dmgText.destroy()
        });

        if (enemy.hp <= 0) {
            enemy.destroy();
        }
    }

    updateEnemies(delta) {
        const children = this.enemyGroup.getChildren();
        if (!children) return;

        children.forEach(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.playerSprite.x, this.playerSprite.y
            );

            // Detection range
            if (dist < 200) {
                if (enemy.canShoot && enemy.enemyType === 'spitter') {
                    // Spitter behavior - keep distance and shoot
                    if (dist < 100) {
                        // Back away
                        const angle = Phaser.Math.Angle.Between(
                            this.playerSprite.x, this.playerSprite.y,
                            enemy.x, enemy.y
                        );
                        enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                    } else {
                        enemy.setVelocity(0, 0);
                    }

                    // Shoot
                    if (enemy.shootCooldown <= 0) {
                        this.enemyShoot(enemy);
                        enemy.shootCooldown = 2500;
                    } else {
                        enemy.shootCooldown -= delta;
                    }
                } else {
                    // Chase player
                    const angle = Phaser.Math.Angle.Between(
                        enemy.x, enemy.y,
                        this.playerSprite.x, this.playerSprite.y
                    );
                    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                }
            } else {
                enemy.setVelocity(0, 0);
            }
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            this.playerSprite.x, this.playerSprite.y
        );

        const acid = this.enemyBulletGroup.create(enemy.x, enemy.y, 'acid');
        acid.damage = enemy.damage;
        acid.infection = 10;
        this.physics.velocityFromRotation(angle, 150, acid.body.velocity);
        acid.setDepth(12);
    }

    enemyHitPlayer(player, projectile) {
        this.takeDamage(projectile.damage, projectile.infection || 5);
        projectile.destroy();
    }

    touchEnemy(player, enemy) {
        this.takeDamage(enemy.damage, 5);

        // Push back
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    takeDamage(damage, infectionGain = 0) {
        this.player.hp -= damage;
        this.player.infection = Math.min(100, this.player.infection + infectionGain);

        // Screen flash
        const flash = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3).setDepth(200);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        this.cameras.main.shake(100, 0.01);

        if (this.player.hp <= 0) {
            this.die('You succumbed to your wounds.');
        }

        if (this.player.infection >= 100) {
            this.die('The infection consumed you.');
        }

        this.updateUI();
    }

    checkNearbyObjects() {
        let nearText = '';
        this.nearbyItem = null;
        this.nearbyObject = null;

        // Check items
        this.itemGroup.getChildren().forEach(item => {
            if (!item || !item.active) return;

            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                item.x, item.y
            );

            if (dist < 40) {
                this.nearbyItem = item;
                const name = item.itemType === 'keycard' ? 'Red Keycard' :
                    item.itemType === 'food' ? 'Food' :
                        item.itemType === 'medkit' ? 'Medkit' :
                            item.itemType === 'antidote' ? 'Antidote' :
                                item.itemType === 'scrap' ? 'Scrap' : 'Item';
                nearText = `[E] Pick up ${name}`;
            }
        });

        // Check sector-specific objects
        const sector = this.currentSector;
        const px = this.playerSprite.x / this.TILE_SIZE;
        const py = this.playerSprite.y / this.TILE_SIZE;

        if (sector === 'hub') {
            if (Math.abs(px - 5) < 2 && Math.abs(py - 4) < 2) {
                nearText = '[E] Use Workbench';
                this.nearbyObject = 'workbench';
            }
            if (Math.abs(px - 15) < 2 && Math.abs(py - 4) < 2) {
                nearText = '[E] Rest (heals hunger)';
                this.nearbyObject = 'bed';
            }
        }

        if (sector === 'medical' && Math.abs(px - 10) < 2 && Math.abs(py - 6) < 2) {
            if (this.poweredSectors['medical']) {
                nearText = '[E] Use Medical Station';
                this.nearbyObject = 'medical';
            } else {
                nearText = 'Medical Station (No Power)';
            }
        }

        if (sector === 'escape' && Math.abs(px - 10) < 2 && Math.abs(py - 7) < 2) {
            if (this.player.hasKeycard && this.poweredSectors['escape']) {
                nearText = '[E] ESCAPE!';
                this.nearbyObject = 'escape';
            } else if (!this.player.hasKeycard) {
                nearText = 'Escape Pod (Need Red Keycard)';
            } else {
                nearText = 'Escape Pod (No Power)';
            }
        }

        this.interactText.setText(nearText);
    }

    interact() {
        if (this.nearbyItem) {
            this.pickupItem(this.nearbyItem);
            return;
        }

        if (this.nearbyObject === 'bed') {
            this.player.hunger = Math.max(0, this.player.hunger - 30);
            this.globalInfection += 5;
            this.showMessage('You rested. Hunger decreased.');
            this.updateUI();
        }

        if (this.nearbyObject === 'medical') {
            this.player.hp = this.player.maxHp;
            this.player.infection = Math.max(0, this.player.infection - 30);
            this.showMessage('Healed at Medical Station!');
            this.updateUI();
        }

        if (this.nearbyObject === 'escape') {
            this.victory();
        }
    }

    pickupItem(item) {
        const type = item.itemType;

        if (type === 'keycard') {
            this.player.hasKeycard = true;
            this.showMessage('Got Red Keycard!');
        } else {
            const existing = this.player.inventory.find(i => i.type === type);
            if (existing) {
                existing.count++;
            } else {
                const names = {
                    food: 'Canned Food',
                    medkit: 'Medkit',
                    antidote: 'Antidote',
                    scrap: 'Scrap'
                };
                this.player.inventory.push({ type: type, name: names[type] || type, count: 1 });
            }
            this.showMessage(`Picked up ${type}!`);
        }

        item.destroy();
        this.updateUI();
    }

    quickUse(type) {
        const item = this.player.inventory.find(i => i.type === type && i.count > 0);
        if (!item) return;

        if (type === 'food') {
            this.player.hunger = Math.max(0, this.player.hunger - 30);
            this.showMessage('Ate food. Hunger decreased.');
        } else if (type === 'medkit') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
            this.showMessage('+30 HP');
        } else if (type === 'antidote') {
            this.player.infection = Math.max(0, this.player.infection - 30);
            this.showMessage('Infection decreased!');
        }

        item.count--;
        if (item.count <= 0) {
            const idx = this.player.inventory.indexOf(item);
            this.player.inventory.splice(idx, 1);
        }

        this.updateUI();
    }

    checkSectorTransitions() {
        const px = this.playerSprite.x / this.TILE_SIZE;
        const py = this.playerSprite.y / this.TILE_SIZE;
        const sectorPos = this.SECTORS[this.currentSector];
        const midX = Math.floor(this.ROOM_WIDTH / 2);
        const midY = Math.floor(this.ROOM_HEIGHT / 2);

        // Top exit
        if (py < 1 && Math.abs(px - midX) < 2) {
            const targetSector = Object.keys(this.SECTORS).find(s =>
                this.SECTORS[s].x === sectorPos.x && this.SECTORS[s].y === sectorPos.y - 1);
            if (targetSector) {
                this.loadSector(targetSector, 'top');
            }
        }

        // Bottom exit
        if (py > this.ROOM_HEIGHT - 2 && Math.abs(px - midX) < 2) {
            const targetSector = Object.keys(this.SECTORS).find(s =>
                this.SECTORS[s].x === sectorPos.x && this.SECTORS[s].y === sectorPos.y + 1);
            if (targetSector) {
                this.loadSector(targetSector, 'bottom');
            }
        }

        // Left exit
        if (px < 1 && Math.abs(py - midY) < 2) {
            const targetSector = Object.keys(this.SECTORS).find(s =>
                this.SECTORS[s].x === sectorPos.x - 1 && this.SECTORS[s].y === sectorPos.y);
            if (targetSector) {
                this.loadSector(targetSector, 'left');
            }
        }

        // Right exit
        if (px > this.ROOM_WIDTH - 2 && Math.abs(py - midY) < 2) {
            const targetSector = Object.keys(this.SECTORS).find(s =>
                this.SECTORS[s].x === sectorPos.x + 1 && this.SECTORS[s].y === sectorPos.y);
            if (targetSector) {
                this.loadSector(targetSector, 'right');
            }
        }
    }

    updateGameTime() {
        if (this.gameOver) return;

        this.gameTime++;

        // Global infection rises
        this.globalInfection = Math.min(100, this.globalInfection + 0.1);

        // Hunger rises
        this.player.hunger = Math.min(100, this.player.hunger + 0.1);

        // Unpowered sector infection
        if (!this.poweredSectors[this.currentSector]) {
            this.player.infection = Math.min(100, this.player.infection + 0.05);
        }

        // Hunger damage
        if (this.player.hunger >= 75) {
            this.player.hp = Math.max(0, this.player.hp - 0.1);
        }

        // Infection damage
        if (this.player.infection >= 75) {
            this.player.hp = Math.max(0, this.player.hp - 0.2);
        }

        // Check deaths
        if (this.player.hp <= 0) {
            this.die('You died from starvation or infection.');
        }

        if (this.globalInfection >= 100) {
            this.die('Global infection reached 100%. The facility is lost.');
        }

        this.updateUI();
    }

    nearItem(player, item) {
        // Handled in checkNearbyObjects
    }

    showMessage(text) {
        const msg = this.add.text(400, 200, text, {
            fontSize: '18px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: msg,
            y: 180,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    die(reason) {
        this.gameOver = true;
        this.physics.pause();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(300);

        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'monospace', color: '#ff4444',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 280, reason, {
            fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa',
            wordWrap: { width: 600 }, align: 'center'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 350, `Global Infection: ${Math.floor(this.globalInfection)}%`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 450, 'Click to try again', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setDepth(301);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    victory() {
        this.gameOver = true;
        this.physics.pause();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(300);

        this.add.text(400, 200, 'ESCAPED!', {
            fontSize: '56px', fontFamily: 'monospace', color: '#44ff44',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 280, 'You escaped the facility!', {
            fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 340, `Global Infection: ${Math.floor(this.globalInfection)}%`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 370, `Time Survived: ${Math.floor(this.gameTime / 60)}m ${this.gameTime % 60}s`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 450, 'Click to play again', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setDepth(301);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

// Phaser configuration - MUST be at end of file
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0a0a0f',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene],
    pixelArt: true
};

const game = new Phaser.Game(config);
