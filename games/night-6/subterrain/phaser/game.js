// Isolation Protocol - Subterrain Clone
// Phaser 3 Implementation with Harness Interface

const TILE_SIZE = 32;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Game state
let gamePaused = true;
let gameState = 'menu';
let currentSector = 'hub';
let gameTime = 0; // In game minutes
let globalInfection = 0;

// V2 Harness - time-accelerated testing
let harnessTime = 0; // Harness ms counter
let debugLogs = [];
function logEvent(msg) {
    debugLogs.push(`[${harnessTime}ms] ${msg}`);
}

// Player state
let player = {
    x: 400, y: 300,
    health: 100,
    hunger: 0,
    thirst: 0,
    fatigue: 0,
    infection: 0,
    stamina: 100,
    speed: 150,
    damage: 5,
    inventory: [],
    quickSlots: [null, null, null],
    weapon: null,
    hasRedKeycard: false,
    hasDataChip: false
};

// Sector definitions
const SECTORS = {
    hub: { name: 'Central Hub', powerCost: 0, size: { w: 15, h: 15 }, enemies: [], powered: true },
    storage: { name: 'Storage Wing', powerCost: 100, size: { w: 20, h: 20 }, enemies: ['shambler', 'shambler', 'shambler', 'crawler'], powered: false },
    medical: { name: 'Medical Bay', powerCost: 150, size: { w: 20, h: 20 }, enemies: ['shambler', 'shambler', 'spitter', 'spitter'], powered: false },
    research: { name: 'Research Lab', powerCost: 200, size: { w: 25, h: 25 }, enemies: ['crawler', 'crawler', 'spitter', 'spitter', 'brute'], powered: false },
    escape: { name: 'Escape Pod', powerCost: 300, size: { w: 15, h: 15 }, enemies: ['shambler', 'shambler', 'brute', 'brute'], powered: false }
};

// World state persistence
let worldState = {
    sectorStates: {},
    powerUsed: 0,
    maxPower: 500
};

// Enemy definitions
const ENEMY_TYPES = {
    shambler: { hp: 30, damage: 10, speed: 0.5, attackRate: 1500, infection: 5, color: 0x4a6a4a },
    crawler: { hp: 20, damage: 8, speed: 1.2, attackRate: 1000, infection: 5, color: 0x3a5a3a },
    spitter: { hp: 25, damage: 15, speed: 0.4, attackRate: 2500, infection: 10, color: 0x5a7a2a, ranged: true },
    brute: { hp: 80, damage: 25, speed: 0.3, attackRate: 2000, infection: 8, color: 0x8a4a4a },
    cocoon: { hp: 50, damage: 0, speed: 0, attackRate: 0, infection: 1, color: 0x6a2a6a }
};

// Item definitions
const ITEMS = {
    cannedFood: { name: 'Canned Food', type: 'consumable', effect: { hunger: -30 }, stack: 5 },
    waterBottle: { name: 'Water Bottle', type: 'consumable', effect: { thirst: -40 }, stack: 5 },
    mrePack: { name: 'MRE Pack', type: 'consumable', effect: { hunger: -50, thirst: -20 }, stack: 3 },
    coffee: { name: 'Coffee', type: 'consumable', effect: { fatigue: -20 }, stack: 5 },
    medkit: { name: 'Medkit', type: 'consumable', effect: { health: 30 }, stack: 3 },
    antidote: { name: 'Antidote', type: 'consumable', effect: { infection: -30 }, stack: 3 },
    scrapMetal: { name: 'Scrap Metal', type: 'material', stack: 10 },
    cloth: { name: 'Cloth', type: 'material', stack: 10 },
    chemicals: { name: 'Chemicals', type: 'material', stack: 10 },
    electronics: { name: 'Electronics', type: 'material', stack: 10 },
    powerCell: { name: 'Power Cell', type: 'material', stack: 5 },
    shiv: { name: 'Shiv', type: 'weapon', damage: 10, speed: 400, durability: 20 },
    pipeClub: { name: 'Pipe Club', type: 'weapon', damage: 20, speed: 1000, durability: 30 },
    pistol: { name: 'Pistol', type: 'weapon', damage: 15, speed: 500, durability: 100, ranged: true, ammo: 12 },
    redKeycard: { name: 'Red Keycard', type: 'key', unique: true },
    dataChip: { name: 'Data Chip', type: 'key', unique: true }
};

// Crafting recipes
const RECIPES = {
    tier1: {
        shiv: { materials: { scrapMetal: 2 }, time: 10, result: 'shiv' },
        pipeClub: { materials: { scrapMetal: 3 }, time: 15, result: 'pipeClub' }
    },
    tier2: {
        pistol: { materials: { scrapMetal: 5, electronics: 2 }, time: 30, result: 'pistol' },
        antidote: { materials: { chemicals: 3 }, time: 15, result: 'antidote' }
    }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        gameState = 'menu';

        this.add.rectangle(400, 300, 800, 600, 0x0a0a0a);

        this.add.text(400, 150, 'ISOLATION PROTOCOL', {
            fontSize: '48px',
            fill: '#1a8a1a',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 220, 'A Survival Horror Experience', {
            fontSize: '18px',
            fill: '#0a5a0a',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const startBtn = this.add.text(400, 350, '[ START ]', {
            fontSize: '32px',
            fill: '#2a9a2a',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#4afa4a'));
        startBtn.on('pointerout', () => startBtn.setFill('#2a9a2a'));
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        this.add.text(400, 450, 'WASD - Move | Space - Attack | E - Interact', {
            fontSize: '14px',
            fill: '#1a5a1a',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 480, 'Tab - Inventory | M - Map | Shift - Dodge', {
            fontSize: '14px',
            fill: '#1a5a1a',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        gameState = 'playing';
        gamePaused = true;

        this.resetGame();
        this.createWorld();
        this.createPlayer();
        this.createEnemies();
        this.createContainers();
        this.createUI();
        this.setupInput();
        this.setupTimers();

        // Camera setup
        this.cameras.main.setBounds(0, 0,
            SECTORS[currentSector].size.w * TILE_SIZE,
            SECTORS[currentSector].size.h * TILE_SIZE);
        this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

        gamePaused = false;
    }

    resetGame() {
        gameTime = 0;
        globalInfection = 0;
        currentSector = 'hub';

        player = {
            x: 240, y: 240,
            health: 100,
            hunger: 0,
            thirst: 0,
            fatigue: 0,
            infection: 0,
            stamina: 100,
            speed: 150,
            damage: 5,
            inventory: [
                { ...ITEMS.cannedFood, count: 2 },
                { ...ITEMS.waterBottle, count: 2 },
                { ...ITEMS.shiv, count: 1, currentDurability: 20 }
            ],
            quickSlots: [null, null, null],
            weapon: { ...ITEMS.shiv, currentDurability: 20 },
            hasRedKeycard: false,
            hasDataChip: false
        };

        worldState = {
            sectorStates: {},
            powerUsed: 0,
            maxPower: 500
        };

        // Initialize sector states
        for (let sector in SECTORS) {
            worldState.sectorStates[sector] = {
                enemies: [],
                containers: [],
                cleared: false
            };
        }
    }

    createWorld() {
        const sector = SECTORS[currentSector];
        const width = sector.size.w * TILE_SIZE;
        const height = sector.size.h * TILE_SIZE;

        // Floor
        this.add.rectangle(width/2, height/2, width, height, 0x1a1a1a);

        // Grid pattern
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x2a2a2a, 0.3);

        for (let x = 0; x <= sector.size.w; x++) {
            graphics.moveTo(x * TILE_SIZE, 0);
            graphics.lineTo(x * TILE_SIZE, height);
        }
        for (let y = 0; y <= sector.size.h; y++) {
            graphics.moveTo(0, y * TILE_SIZE);
            graphics.lineTo(width, y * TILE_SIZE);
        }
        graphics.strokePath();

        // Walls
        this.walls = this.physics.add.staticGroup();

        // Border walls
        for (let x = 0; x < sector.size.w; x++) {
            this.walls.add(this.add.rectangle(x * TILE_SIZE + 16, 16, TILE_SIZE, TILE_SIZE, 0x3a3a3a));
            this.walls.add(this.add.rectangle(x * TILE_SIZE + 16, height - 16, TILE_SIZE, TILE_SIZE, 0x3a3a3a));
        }
        for (let y = 0; y < sector.size.h; y++) {
            this.walls.add(this.add.rectangle(16, y * TILE_SIZE + 16, TILE_SIZE, TILE_SIZE, 0x3a3a3a));
            this.walls.add(this.add.rectangle(width - 16, y * TILE_SIZE + 16, TILE_SIZE, TILE_SIZE, 0x3a3a3a));
        }

        // Doors based on sector connections
        this.doors = this.physics.add.staticGroup();
        this.createDoors(sector, width, height);

        // Darkness overlay for unpowered sectors
        if (!sector.powered && currentSector !== 'hub') {
            this.darknessOverlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.5);
            this.darknessOverlay.setDepth(100);
        }

        // Special objects based on sector
        this.createSectorObjects(sector, width, height);
    }

    createDoors(sector, width, height) {
        const doorColor = 0x4a7a4a;

        if (currentSector === 'hub') {
            // North to escape
            this.addDoor(width/2, TILE_SIZE + 8, 'escape', 'north', doorColor);
            // South to storage
            this.addDoor(width/2, height - TILE_SIZE - 8, 'storage', 'south', doorColor);
            // East to medical
            this.addDoor(width - TILE_SIZE - 8, height/2, 'medical', 'east', doorColor);
            // West to research
            this.addDoor(TILE_SIZE + 8, height/2, 'research', 'west', doorColor);
        } else if (currentSector === 'storage') {
            this.addDoor(width/2, TILE_SIZE + 8, 'hub', 'north', doorColor);
        } else if (currentSector === 'medical') {
            this.addDoor(TILE_SIZE + 8, height/2, 'hub', 'west', doorColor);
        } else if (currentSector === 'research') {
            this.addDoor(width - TILE_SIZE - 8, height/2, 'hub', 'east', doorColor);
        } else if (currentSector === 'escape') {
            this.addDoor(width/2, height - TILE_SIZE - 8, 'hub', 'south', doorColor);
        }
    }

    addDoor(x, y, targetSector, direction, color) {
        const door = this.add.rectangle(x, y, TILE_SIZE * 2, TILE_SIZE, color);
        door.targetSector = targetSector;
        door.direction = direction;
        this.physics.add.existing(door, true);
        this.doors.add(door);
    }

    createSectorObjects(sector, width, height) {
        // Hub facilities
        if (currentSector === 'hub') {
            // Workbench
            this.workbench = this.add.rectangle(100, 100, 64, 48, 0x6a4a2a);
            this.add.text(100, 100, 'BENCH', { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);
            this.physics.add.existing(this.workbench, true);

            // Bed
            this.bed = this.add.rectangle(width - 100, 100, 64, 48, 0x4a4a6a);
            this.add.text(width - 100, 100, 'BED', { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);
            this.physics.add.existing(this.bed, true);

            // Power panel
            this.powerPanel = this.add.rectangle(width/2, 80, 48, 48, 0x2a2a5a);
            this.add.text(width/2, 80, 'PWR', { fontSize: '10px', fill: '#4af' }).setOrigin(0.5);
            this.physics.add.existing(this.powerPanel, true);

            // Storage locker
            this.storageLocker = this.add.rectangle(width - 100, height - 100, 64, 48, 0x5a5a5a);
            this.add.text(width - 100, height - 100, 'STORE', { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);
            this.physics.add.existing(this.storageLocker, true);
        }

        // Medical station
        if (currentSector === 'medical') {
            this.medStation = this.add.rectangle(width/2, height/2 - 100, 80, 60, 0x2a5a2a);
            this.add.text(width/2, height/2 - 100, 'MEDICAL', { fontSize: '12px', fill: '#4f4' }).setOrigin(0.5);
            this.physics.add.existing(this.medStation, true);
        }

        // Research terminal
        if (currentSector === 'research') {
            this.researchTerminal = this.add.rectangle(width/2, height/2 - 100, 80, 60, 0x2a2a5a);
            this.add.text(width/2, height/2 - 100, 'TERMINAL', { fontSize: '12px', fill: '#44f' }).setOrigin(0.5);
            this.physics.add.existing(this.researchTerminal, true);
        }

        // Escape pod
        if (currentSector === 'escape') {
            this.escapePod = this.add.rectangle(width/2, height/2, 96, 96, 0x5a5a2a);
            this.add.text(width/2, height/2, 'ESCAPE\nPOD', { fontSize: '14px', fill: '#ff4', align: 'center' }).setOrigin(0.5);
            this.physics.add.existing(this.escapePod, true);
        }
    }

    createPlayer() {
        const sector = SECTORS[currentSector];
        const spawnX = player.x || (sector.size.w * TILE_SIZE) / 2;
        const spawnY = player.y || (sector.size.h * TILE_SIZE) / 2;

        this.playerSprite = this.add.rectangle(spawnX, spawnY, 28, 28, 0x4488ff);
        this.physics.add.existing(this.playerSprite);
        this.playerSprite.body.setCollideWorldBounds(true);

        // Player direction indicator
        this.playerDir = this.add.triangle(spawnX, spawnY - 20, 0, 10, 5, 0, 10, 10, 0x44ff44);

        this.physics.add.collider(this.playerSprite, this.walls);

        // Door overlap
        this.physics.add.overlap(this.playerSprite, this.doors, this.handleDoor, null, this);
    }

    createEnemies() {
        this.enemies = this.physics.add.group();

        const sector = SECTORS[currentSector];
        const sectorState = worldState.sectorStates[currentSector];

        // Use saved state if exists
        if (sectorState.enemies && sectorState.enemies.length > 0) {
            sectorState.enemies.forEach(enemyData => {
                if (!enemyData.dead) {
                    this.spawnEnemy(enemyData.type, enemyData.x, enemyData.y, enemyData.hp);
                }
            });
        } else {
            // Fresh spawn
            sector.enemies.forEach((type, i) => {
                const x = 100 + Math.random() * (sector.size.w * TILE_SIZE - 200);
                const y = 100 + Math.random() * (sector.size.h * TILE_SIZE - 200);
                this.spawnEnemy(type, x, y);
                sectorState.enemies.push({ type, x, y, hp: ENEMY_TYPES[type].hp, dead: false, id: i });
            });
        }

        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.playerSprite, this.enemies, this.handleEnemyCollision, null, this);
    }

    spawnEnemy(type, x, y, hp = null) {
        const enemyDef = ENEMY_TYPES[type];
        const size = type === 'brute' ? 48 : (type === 'cocoon' ? 40 : 28);

        const enemy = this.add.rectangle(x, y, size, size, enemyDef.color);
        this.physics.add.existing(enemy);
        enemy.body.setCollideWorldBounds(true);

        enemy.enemyType = type;
        enemy.hp = hp !== null ? hp : enemyDef.hp;
        enemy.maxHp = enemyDef.hp;
        enemy.damage = enemyDef.damage;
        enemy.speed = enemyDef.speed;
        enemy.attackRate = enemyDef.attackRate;
        enemy.infection = enemyDef.infection;
        enemy.lastAttack = 0;
        enemy.ranged = enemyDef.ranged || false;
        enemy.state = 'idle';
        enemy.alertTimer = 0;

        // HP bar
        enemy.hpBar = this.add.rectangle(x, y - size/2 - 8, 30, 4, 0x00ff00);

        this.enemies.add(enemy);
        return enemy;
    }

    createContainers() {
        this.containers = this.physics.add.staticGroup();

        const sector = SECTORS[currentSector];
        const sectorState = worldState.sectorStates[currentSector];

        if (currentSector === 'hub') return; // No loot containers in hub

        // Use saved state or create new
        if (sectorState.containers && sectorState.containers.length > 0) {
            sectorState.containers.forEach(containerData => {
                if (!containerData.looted) {
                    this.createContainer(containerData.x, containerData.y, containerData.loot, containerData.id);
                }
            });
        } else {
            const containerCount = currentSector === 'storage' ? 10 : 6;
            for (let i = 0; i < containerCount; i++) {
                const x = 80 + Math.random() * (sector.size.w * TILE_SIZE - 160);
                const y = 80 + Math.random() * (sector.size.h * TILE_SIZE - 160);
                const loot = this.generateLoot();
                this.createContainer(x, y, loot, i);
                sectorState.containers.push({ x, y, loot, id: i, looted: false });
            }
        }

        this.physics.add.overlap(this.playerSprite, this.containers, this.handleContainer, null, this);
    }

    createContainer(x, y, loot, id) {
        const container = this.add.rectangle(x, y, 32, 32, 0x6a5a4a);
        container.loot = loot;
        container.id = id;
        this.physics.add.existing(container, true);
        this.containers.add(container);

        // Container icon
        this.add.text(x, y, '?', { fontSize: '16px', fill: '#aaa' }).setOrigin(0.5);
    }

    generateLoot() {
        const lootTables = {
            storage: ['cannedFood', 'waterBottle', 'scrapMetal', 'cloth', 'coffee'],
            medical: ['medkit', 'antidote', 'chemicals', 'waterBottle'],
            research: ['electronics', 'powerCell', 'dataChip', 'scrapMetal'],
            escape: ['medkit', 'scrapMetal', 'chemicals']
        };

        const table = lootTables[currentSector] || lootTables.storage;
        const itemKey = table[Math.floor(Math.random() * table.length)];

        // Special key items
        if (currentSector === 'research' && Math.random() < 0.3 && !player.hasRedKeycard) {
            return [{ key: 'redKeycard', count: 1 }];
        }

        return [{ key: itemKey, count: 1 + Math.floor(Math.random() * 2) }];
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(200);

        // Background bars
        const barY = 20;
        const barWidth = 150;

        // Health
        this.add.rectangle(90, barY, barWidth + 4, 18, 0x333333).setScrollFactor(0).setDepth(199);
        this.healthBar = this.add.rectangle(90, barY, barWidth, 14, 0xff4444).setScrollFactor(0).setDepth(200);
        this.add.text(10, barY, 'HP', { fontSize: '12px', fill: '#fff' }).setScrollFactor(0).setDepth(200);

        // Infection
        this.add.rectangle(90, barY + 22, barWidth + 4, 12, 0x333333).setScrollFactor(0).setDepth(199);
        this.infectionBar = this.add.rectangle(90, barY + 22, 0, 8, 0x44ff44).setScrollFactor(0).setDepth(200);
        this.add.text(10, barY + 18, 'INF', { fontSize: '10px', fill: '#4f4' }).setScrollFactor(0).setDepth(200);

        // Hunger
        this.add.rectangle(290, barY, 80, 10, 0x333333).setScrollFactor(0).setDepth(199);
        this.hungerBar = this.add.rectangle(290, barY, 0, 6, 0xff8844).setScrollFactor(0).setDepth(200);
        this.add.text(240, barY - 4, 'HNG', { fontSize: '10px', fill: '#f84' }).setScrollFactor(0).setDepth(200);

        // Thirst
        this.add.rectangle(290, barY + 14, 80, 10, 0x333333).setScrollFactor(0).setDepth(199);
        this.thirstBar = this.add.rectangle(290, barY + 14, 0, 6, 0x4488ff).setScrollFactor(0).setDepth(200);
        this.add.text(240, barY + 10, 'THR', { fontSize: '10px', fill: '#48f' }).setScrollFactor(0).setDepth(200);

        // Fatigue
        this.add.rectangle(290, barY + 28, 80, 10, 0x333333).setScrollFactor(0).setDepth(199);
        this.fatigueBar = this.add.rectangle(290, barY + 28, 0, 6, 0x888888).setScrollFactor(0).setDepth(200);
        this.add.text(240, barY + 24, 'FAT', { fontSize: '10px', fill: '#888' }).setScrollFactor(0).setDepth(200);

        // Global infection
        this.globalInfText = this.add.text(GAME_WIDTH - 120, 20, 'GLOBAL: 0%', {
            fontSize: '14px', fill: '#4f4', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(200);

        // Time
        this.timeText = this.add.text(GAME_WIDTH - 120, 40, 'TIME: 0:00', {
            fontSize: '12px', fill: '#aaa', fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(200);

        // Sector name
        this.sectorText = this.add.text(GAME_WIDTH/2, 20, SECTORS[currentSector].name, {
            fontSize: '16px', fill: '#fff', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        // Quick slots
        for (let i = 0; i < 3; i++) {
            this.add.rectangle(50 + i * 50, GAME_HEIGHT - 40, 40, 40, 0x333333).setScrollFactor(0).setDepth(199);
            this.add.text(50 + i * 50, GAME_HEIGHT - 60, (i + 1).toString(), {
                fontSize: '12px', fill: '#888'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        }

        // Message area
        this.messageText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 80, '', {
            fontSize: '14px', fill: '#fff', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        // Stamina bar
        this.add.rectangle(GAME_WIDTH - 90, GAME_HEIGHT - 30, 104, 14, 0x333333).setScrollFactor(0).setDepth(199);
        this.staminaBar = this.add.rectangle(GAME_WIDTH - 90, GAME_HEIGHT - 30, 100, 10, 0xffff44).setScrollFactor(0).setDepth(200);
        this.add.text(GAME_WIDTH - 150, GAME_HEIGHT - 34, 'STA', { fontSize: '10px', fill: '#ff4' }).setScrollFactor(0).setDepth(200);
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D',
            up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
            space: 'SPACE',
            e: 'E',
            tab: 'TAB',
            m: 'M',
            shift: 'SHIFT',
            one: 'ONE', two: 'TWO', three: 'THREE'
        });

        this.attackCooldown = 0;
        this.dodgeCooldown = 0;
        this.interactCooldown = 0;
    }

    setupTimers() {
        // Time passage (1 real second = 1 game minute)
        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });
    }

    updateGameTime() {
        if (gamePaused || gameState !== 'playing') return;

        gameTime++;

        // Global infection rises
        globalInfection = Math.min(100, globalInfection + 0.1);

        // Survival meter decay
        player.hunger = Math.min(100, player.hunger + 0.1);
        player.thirst = Math.min(100, player.thirst + 0.2);
        player.fatigue = Math.min(100, player.fatigue + 0.067);

        // Unpowered sector infection
        if (currentSector !== 'hub' && !SECTORS[currentSector].powered) {
            player.infection = Math.min(100, player.infection + 0.5);
        }

        // Meter effects
        if (player.hunger >= 75) player.health = Math.max(0, player.health - 1);
        if (player.thirst >= 75) player.health = Math.max(0, player.health - 1);
        if (player.infection >= 75) player.health = Math.max(0, player.health - 2);

        // Check death conditions
        if (player.health <= 0) {
            this.gameOver('health');
        } else if (player.infection >= 100) {
            this.gameOver('infection');
        } else if (globalInfection >= 100) {
            this.gameOver('global');
        }

        // Fatigue collapse
        if (player.fatigue >= 100) {
            player.fatigue = 70;
            this.showMessage('You collapsed from exhaustion!');
            // Fast forward time
            for (let i = 0; i < 120; i++) {
                player.hunger = Math.min(100, player.hunger + 0.1);
                player.thirst = Math.min(100, player.thirst + 0.2);
                globalInfection = Math.min(100, globalInfection + 0.1);
            }
        }
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'playing') return;

        // Handle map screen toggle
        if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
            this.toggleMapScreen();
        }

        // Handle quick slots
        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.useQuickSlot(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.useQuickSlot(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.useQuickSlot(2);

        this.handleMovement();
        this.handleCombat(time);
        this.handleInteraction();
        this.updateEnemies(time);
        this.updateUI();
        this.updateInfectionEffects();

        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;
        if (this.interactCooldown > 0) this.interactCooldown -= delta;

        // Stamina regen
        player.stamina = Math.min(100, player.stamina + delta * 0.005);
    }

    mapScreenVisible = false;

    toggleMapScreen() {
        this.mapScreenVisible = !this.mapScreenVisible;

        if (this.mapScreenVisible) {
            // Create map overlay
            this.mapOverlay = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2);
            this.mapOverlay.setScrollFactor(0);
            this.mapOverlay.setDepth(500);

            // Background
            const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9);
            this.mapOverlay.add(bg);

            // Title
            const title = this.add.text(0, -130, 'FACILITY MAP', {
                fontSize: '20px', fill: '#4f4', fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.mapOverlay.add(title);

            // Sector layout
            const sectorPositions = {
                escape: { x: 0, y: -80 },
                research: { x: -100, y: 0 },
                hub: { x: 0, y: 0 },
                medical: { x: 100, y: 0 },
                storage: { x: 0, y: 80 }
            };

            for (let sector in sectorPositions) {
                const pos = sectorPositions[sector];
                const sectorData = SECTORS[sector];
                const isCurrent = currentSector === sector;
                const isPowered = sectorData.powered;

                const color = isCurrent ? 0x44ff44 : (isPowered ? 0x4488ff : 0x444444);
                const box = this.add.rectangle(pos.x, pos.y, 70, 40, color, 0.8);
                const label = this.add.text(pos.x, pos.y - 8, sector.toUpperCase().slice(0, 6), {
                    fontSize: '10px', fill: '#fff', fontFamily: 'monospace'
                }).setOrigin(0.5);
                const power = this.add.text(pos.x, pos.y + 8, isPowered ? 'ONLINE' : sectorData.powerCost + 'W', {
                    fontSize: '8px', fill: isPowered ? '#4f4' : '#888', fontFamily: 'monospace'
                }).setOrigin(0.5);

                this.mapOverlay.add(box);
                this.mapOverlay.add(label);
                this.mapOverlay.add(power);
            }

            // Draw connections
            const lines = this.add.graphics();
            lines.lineStyle(2, 0x444444);
            lines.moveTo(0, -40); lines.lineTo(0, -60); // hub to escape
            lines.moveTo(0, 40); lines.lineTo(0, 60); // hub to storage
            lines.moveTo(-35, 0); lines.lineTo(-65, 0); // hub to research
            lines.moveTo(35, 0); lines.lineTo(65, 0); // hub to medical
            lines.strokePath();
            this.mapOverlay.add(lines);

            // Power info
            const powerInfo = this.add.text(0, 120, 'Power: ' + worldState.powerUsed + '/' + worldState.maxPower, {
                fontSize: '12px', fill: '#4af', fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.mapOverlay.add(powerInfo);

            const closeHint = this.add.text(0, 140, 'Press M to close', {
                fontSize: '10px', fill: '#888', fontFamily: 'monospace'
            }).setOrigin(0.5);
            this.mapOverlay.add(closeHint);
        } else {
            if (this.mapOverlay) {
                this.mapOverlay.destroy();
                this.mapOverlay = null;
            }
        }
    }

    useQuickSlot(slot) {
        if (player.quickSlots[slot]) {
            this.useItem(player.quickSlots[slot]);
        } else if (player.inventory.length > slot) {
            this.useItem(player.inventory[slot]);
        }
    }

    useItem(item) {
        if (!item || item.type !== 'consumable') return;

        // Apply effects
        if (item.effect) {
            if (item.effect.health) player.health = Math.min(100, player.health + item.effect.health);
            if (item.effect.hunger) player.hunger = Math.max(0, player.hunger + item.effect.hunger);
            if (item.effect.thirst) player.thirst = Math.max(0, player.thirst + item.effect.thirst);
            if (item.effect.fatigue) player.fatigue = Math.max(0, player.fatigue + item.effect.fatigue);
            if (item.effect.infection) player.infection = Math.max(0, player.infection + item.effect.infection);
        }

        // Remove from inventory
        item.count--;
        if (item.count <= 0) {
            player.inventory = player.inventory.filter(i => i !== item);
        }

        this.showMessage('Used ' + item.name);
    }

    infectionOverlay = null;

    updateInfectionEffects() {
        // Create overlay if needed
        if (!this.infectionOverlay) {
            this.infectionOverlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x00ff00, 0);
            this.infectionOverlay.setScrollFactor(0);
            this.infectionOverlay.setDepth(150);
        }

        // Update infection tint
        if (player.infection >= 25) {
            const intensity = Math.min(0.3, (player.infection - 25) / 250);
            this.infectionOverlay.setAlpha(intensity);
        } else {
            this.infectionOverlay.setAlpha(0);
        }

        // Hallucination at high infection
        if (player.infection >= 50 && Math.random() < 0.002) {
            this.createHallucination();
        }
    }

    createHallucination() {
        // Create fake enemy that disappears
        const sector = SECTORS[currentSector];
        const hx = Math.random() * sector.size.w * TILE_SIZE;
        const hy = Math.random() * sector.size.h * TILE_SIZE;

        const halluc = this.add.rectangle(hx, hy, 28, 28, 0x4a6a4a, 0.5);
        halluc.setDepth(90);

        this.tweens.add({
            targets: halluc,
            alpha: 0,
            duration: 500,
            onComplete: () => halluc.destroy()
        });

        this.showMessage('...something moved...');
    }

    handleMovement() {
        let vx = 0, vy = 0;
        const speed = player.speed * this.getSpeedModifier();

        if (this.keys.w.isDown || this.keys.up.isDown) vy = -speed;
        if (this.keys.s.isDown || this.keys.down.isDown) vy = speed;
        if (this.keys.a.isDown || this.keys.left.isDown) vx = -speed;
        if (this.keys.d.isDown || this.keys.right.isDown) vx = speed;

        // Dodge
        if (this.keys.shift.isDown && this.dodgeCooldown <= 0 && player.stamina >= 20 && (vx !== 0 || vy !== 0)) {
            vx *= 3;
            vy *= 3;
            player.stamina -= 20;
            this.dodgeCooldown = 1500;
        }

        this.playerSprite.body.setVelocity(vx, vy);

        // Update direction indicator
        if (vx !== 0 || vy !== 0) {
            this.playerDir.setPosition(
                this.playerSprite.x + (vx > 0 ? 20 : vx < 0 ? -20 : 0),
                this.playerSprite.y + (vy > 0 ? 20 : vy < 0 ? -20 : 0)
            );
            this.playerDir.setRotation(Math.atan2(vy, vx) + Math.PI/2);
        }

        player.x = this.playerSprite.x;
        player.y = this.playerSprite.y;
    }

    getSpeedModifier() {
        let mod = 1;
        if (player.hunger >= 75) mod *= 0.75;
        else if (player.hunger >= 50) mod *= 0.9;
        return mod;
    }

    handleCombat(time) {
        if (this.keys.space.isDown && this.attackCooldown <= 0 && player.stamina >= 10) {
            this.performAttack();
            player.stamina -= 10;
            this.attackCooldown = player.weapon ? player.weapon.speed : 500;
        }
    }

    performAttack() {
        const damage = (player.weapon ? player.weapon.damage : player.damage) * this.getDamageModifier();
        const range = player.weapon && player.weapon.ranged ? 300 : 50;

        // Find enemies in range
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                enemy.x, enemy.y
            );

            if (dist < range) {
                enemy.hp -= damage;

                // Flash effect
                enemy.setFillStyle(0xffffff);
                this.time.delayedCall(100, () => {
                    if (enemy.active) {
                        enemy.setFillStyle(ENEMY_TYPES[enemy.enemyType].color);
                    }
                });

                if (enemy.hp <= 0) {
                    this.killEnemy(enemy);
                }
            }
        });

        // Weapon durability
        if (player.weapon && player.weapon.currentDurability) {
            player.weapon.currentDurability--;
            if (player.weapon.currentDurability <= 0) {
                this.showMessage('Weapon broke!');
                player.weapon = null;
            }
        }
    }

    getDamageModifier() {
        let mod = 1;
        if (player.fatigue >= 75) mod *= 0.6;
        else if (player.fatigue >= 50) mod *= 0.8;
        return mod;
    }

    killEnemy(enemy) {
        logEvent(`Enemy killed: ${enemy.enemyType} in ${currentSector}`);
        // Update world state
        const sectorState = worldState.sectorStates[currentSector];
        const enemyData = sectorState.enemies.find(e =>
            Math.abs(e.x - enemy.x) < 50 && Math.abs(e.y - enemy.y) < 50 && !e.dead
        );
        if (enemyData) {
            enemyData.dead = true;
        }

        // Blood pool (static)
        this.add.circle(enemy.x, enemy.y, 20, 0x440000);

        enemy.hpBar.destroy();
        enemy.destroy();
    }

    handleInteraction() {
        if (!this.keys.e.isDown || this.interactCooldown > 0) return;
        this.interactCooldown = 300;

        // Hub facilities
        if (currentSector === 'hub') {
            const px = this.playerSprite.x;
            const py = this.playerSprite.y;

            // Workbench
            if (this.workbench && Phaser.Math.Distance.Between(px, py, this.workbench.x, this.workbench.y) < 60) {
                this.openCrafting();
                return;
            }

            // Bed
            if (this.bed && Phaser.Math.Distance.Between(px, py, this.bed.x, this.bed.y) < 60) {
                this.useBed();
                return;
            }

            // Power panel
            if (this.powerPanel && Phaser.Math.Distance.Between(px, py, this.powerPanel.x, this.powerPanel.y) < 60) {
                this.openPowerPanel();
                return;
            }
        }

        // Medical station
        if (currentSector === 'medical' && this.medStation) {
            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                this.medStation.x, this.medStation.y
            );
            if (dist < 80 && SECTORS.medical.powered) {
                this.useMedStation();
                return;
            }
        }

        // Research terminal
        if (currentSector === 'research' && this.researchTerminal) {
            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                this.researchTerminal.x, this.researchTerminal.y
            );
            if (dist < 80 && SECTORS.research.powered && player.hasDataChip) {
                this.showMessage('Tier 2 recipes unlocked!');
                return;
            }
        }

        // Escape pod
        if (currentSector === 'escape' && this.escapePod) {
            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                this.escapePod.x, this.escapePod.y
            );
            if (dist < 100) {
                if (!SECTORS.escape.powered) {
                    this.showMessage('Escape Pod requires power!');
                } else if (!player.hasRedKeycard) {
                    this.showMessage('Requires Red Keycard!');
                } else {
                    this.victory();
                }
                return;
            }
        }
    }

    handleDoor(playerSprite, door) {
        if (!this.keys.e.isDown || this.interactCooldown > 0) return;
        this.interactCooldown = 500;

        // Save current position for spawn calculation
        const fromDirection = door.direction;

        // Transition to new sector
        this.transitionToSector(door.targetSector, fromDirection);
    }

    transitionToSector(targetSector, fromDirection) {
        // Save current enemy states
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            const sectorState = worldState.sectorStates[currentSector];
            const enemyData = sectorState.enemies.find(e =>
                Math.abs(e.x - enemy.x) < 50 && Math.abs(e.y - enemy.y) < 50
            );
            if (enemyData) {
                enemyData.hp = enemy.hp;
                enemyData.x = enemy.x;
                enemyData.y = enemy.y;
            }
        });

        currentSector = targetSector;

        // Calculate spawn position based on entry direction
        const sector = SECTORS[targetSector];
        const width = sector.size.w * TILE_SIZE;
        const height = sector.size.h * TILE_SIZE;

        switch (fromDirection) {
            case 'north': player.x = width/2; player.y = height - 80; break;
            case 'south': player.x = width/2; player.y = 80; break;
            case 'east': player.x = 80; player.y = height/2; break;
            case 'west': player.x = width - 80; player.y = height/2; break;
        }

        this.scene.restart();
    }

    handleContainer(playerSprite, container) {
        if (!this.keys.e.isDown || this.interactCooldown > 0) return;
        this.interactCooldown = 300;

        // Give loot
        container.loot.forEach(item => {
            this.addToInventory(item.key, item.count);
        });

        // Mark as looted
        const sectorState = worldState.sectorStates[currentSector];
        const containerData = sectorState.containers.find(c => c.id === container.id);
        if (containerData) containerData.looted = true;

        this.showMessage('Found: ' + container.loot.map(i => ITEMS[i.key]?.name || i.key).join(', '));
        container.destroy();
    }

    addToInventory(itemKey, count) {
        const itemDef = ITEMS[itemKey];
        if (!itemDef) return false;

        // Special key items
        if (itemKey === 'redKeycard') {
            player.hasRedKeycard = true;
            return true;
        }
        if (itemKey === 'dataChip') {
            player.hasDataChip = true;
            return true;
        }

        // Check existing stack
        const existing = player.inventory.find(i => i.name === itemDef.name && i.count < (i.stack || 1));
        if (existing) {
            existing.count = Math.min(existing.stack || 1, existing.count + count);
            return true;
        }

        // New slot
        if (player.inventory.length < 20) {
            player.inventory.push({ ...itemDef, count });
            return true;
        }

        this.showMessage('Inventory full!');
        return false;
    }

    handleEnemyCollision(playerSprite, enemy) {
        const now = this.time.now;

        if (now - enemy.lastAttack > enemy.attackRate) {
            player.health = Math.max(0, player.health - enemy.damage);
            player.infection = Math.min(100, player.infection + enemy.infection);
            enemy.lastAttack = now;
            logEvent(`Player damaged by ${enemy.enemyType}: HP ${player.health}/100, infection ${player.infection}%`);

            // Knockback
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerSprite.x, playerSprite.y);
            playerSprite.body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);

            // Flash
            this.playerSprite.setFillStyle(0xff0000);
            this.time.delayedCall(100, () => {
                this.playerSprite.setFillStyle(0x4488ff);
            });

            if (player.health <= 0) {
                this.gameOver('health');
            }
        }
    }

    updateEnemies(time) {
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                enemy.x, enemy.y
            );

            // Detection
            const detectRange = enemy.enemyType === 'spitter' ? 320 :
                               enemy.enemyType === 'shambler' ? 256 : 192;

            if (dist < detectRange) {
                enemy.state = 'alert';
                enemy.alertTimer = 10000;

                // Move toward player (except cocoon)
                if (enemy.enemyType !== 'cocoon') {
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.playerSprite.x, this.playerSprite.y);
                    const speed = player.speed * enemy.speed;

                    // Spitter keeps distance
                    if (enemy.ranged && dist < 150) {
                        enemy.body.setVelocity(-Math.cos(angle) * speed, -Math.sin(angle) * speed);
                    } else {
                        enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                    }
                }
            } else if (enemy.alertTimer > 0) {
                enemy.alertTimer -= 16;
            } else {
                enemy.state = 'idle';
                enemy.body.setVelocity(0, 0);
            }

            // Update HP bar
            enemy.hpBar.setPosition(enemy.x, enemy.y - (enemy.enemyType === 'brute' ? 32 : 22));
            enemy.hpBar.setSize(30 * (enemy.hp / enemy.maxHp), 4);
        });
    }

    openCrafting() {
        this.showMessage('Crafting: Shiv (2 scrap), Pipe Club (3 scrap)');
        // Simplified crafting - check materials and create
        const scrap = player.inventory.find(i => i.name === 'Scrap Metal');
        if (scrap && scrap.count >= 2) {
            scrap.count -= 2;
            if (scrap.count <= 0) {
                player.inventory = player.inventory.filter(i => i !== scrap);
            }
            this.addToInventory('shiv', 1);
            this.showMessage('Crafted Shiv!');
        }
    }

    useBed() {
        player.fatigue = Math.max(0, player.fatigue - 60);
        // Time passes
        for (let i = 0; i < 240; i++) {
            player.hunger = Math.min(100, player.hunger + 0.1);
            player.thirst = Math.min(100, player.thirst + 0.2);
            globalInfection = Math.min(100, globalInfection + 0.1);
            gameTime++;
        }
        this.showMessage('Rested. Fatigue reduced.');
    }

    openPowerPanel() {
        // Cycle through powering different sectors
        const sectors = ['storage', 'medical', 'research', 'escape'];
        const currentPowered = sectors.filter(s => SECTORS[s].powered);

        // Simple toggle logic
        if (currentPowered.length === 0) {
            SECTORS.storage.powered = true;
            worldState.powerUsed = 100;
            this.showMessage('Storage Wing powered (100/500)');
        } else if (SECTORS.storage.powered && !SECTORS.medical.powered) {
            SECTORS.medical.powered = true;
            worldState.powerUsed = 250;
            this.showMessage('Medical Bay powered (250/500)');
        } else if (SECTORS.medical.powered && !SECTORS.research.powered) {
            SECTORS.research.powered = true;
            worldState.powerUsed = 450;
            this.showMessage('Research Lab powered (450/500)');
        } else if (SECTORS.research.powered && !SECTORS.escape.powered) {
            // Must choose - can't power all
            SECTORS.research.powered = false;
            SECTORS.escape.powered = true;
            worldState.powerUsed = 400;
            this.showMessage('Escape Pod powered! (Research offline)');
        } else {
            // Reset
            sectors.forEach(s => SECTORS[s].powered = false);
            worldState.powerUsed = 0;
            this.showMessage('All sectors powered down');
        }
    }

    useMedStation() {
        if (player.health < 100) {
            player.health = Math.min(100, player.health + 50);
            this.showMessage('Healed at Medical Station');
        } else if (player.infection > 0) {
            player.infection = Math.max(0, player.infection - 50);
            this.showMessage('Infection treated');
        } else {
            this.showMessage('No treatment needed');
        }
    }

    updateUI() {
        // Health bar
        this.healthBar.setSize(150 * (player.health / 100), 14);

        // Infection bar
        this.infectionBar.setSize(150 * (player.infection / 100), 8);

        // Hunger bar
        this.hungerBar.setSize(80 * (player.hunger / 100), 6);

        // Thirst bar
        this.thirstBar.setSize(80 * (player.thirst / 100), 6);

        // Fatigue bar
        this.fatigueBar.setSize(80 * (player.fatigue / 100), 6);

        // Stamina bar
        this.staminaBar.setSize(100 * (player.stamina / 100), 10);

        // Global infection
        this.globalInfText.setText('GLOBAL: ' + Math.floor(globalInfection) + '%');
        if (globalInfection > 50) this.globalInfText.setFill('#ff4');
        if (globalInfection > 75) this.globalInfText.setFill('#f44');

        // Time
        const hours = Math.floor(gameTime / 60);
        const mins = gameTime % 60;
        this.timeText.setText('TIME: ' + hours + ':' + mins.toString().padStart(2, '0'));
    }

    showMessage(text) {
        this.messageText.setText(text);
        this.time.delayedCall(3000, () => {
            if (this.messageText.text === text) {
                this.messageText.setText('');
            }
        });
    }

    gameOver(reason) {
        logEvent(`Game over: ${reason}, HP: ${player.health}, infection: ${player.infection}%, global: ${globalInfection}%`);
        gameState = 'gameover';
        gamePaused = true;

        let message = '';
        switch (reason) {
            case 'health': message = 'You died. The facility claims another victim.'; break;
            case 'infection': message = 'The infection has consumed you.'; break;
            case 'global': message = 'The facility is lost. No one escapes.'; break;
        }

        this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 400, 200, 0x000000, 0.9).setScrollFactor(0).setDepth(300);
        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 40, 'GAME OVER', {
            fontSize: '32px', fill: '#f44', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 10, message, {
            fontSize: '14px', fill: '#fff', fontFamily: 'monospace', wordWrap: { width: 350 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const retry = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 60, '[ RETRY ]', {
            fontSize: '20px', fill: '#4f4', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setInteractive();

        retry.on('pointerdown', () => this.scene.restart());
    }

    victory() {
        gameState = 'victory';
        gamePaused = true;

        this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 400, 200, 0x000000, 0.9).setScrollFactor(0).setDepth(300);
        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 40, 'ESCAPED!', {
            fontSize: '32px', fill: '#4f4', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 10,
            'Time: ' + Math.floor(gameTime/60) + ':' + (gameTime%60).toString().padStart(2,'0') +
            '\nGlobal Infection: ' + Math.floor(globalInfection) + '%', {
            fontSize: '16px', fill: '#fff', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const again = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 70, '[ PLAY AGAIN ]', {
            fontSize: '20px', fill: '#4f4', fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setInteractive();

        again.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);

// V2 Harness interface - time-accelerated
window.harness = {
    pause: () => {
        gamePaused = true;
    },

    resume: () => {
        gamePaused = false;
    },

    isPaused: () => gamePaused,

    execute: async ({ keys: inputKeys = [], duration = 1000, screenshot = false }) => {
        const startTime = Date.now();
        debugLogs = [];

        const scene = game.scene.getScene('GameScene');
        if (!scene || !scene.keys) {
            return {
                screenshot: null,
                logs: [],
                state: window.harness.getState(),
                realTime: Date.now() - startTime
            };
        }

        // Apply key states
        inputKeys.forEach(key => {
            const keyLower = key.toLowerCase();
            if (scene.keys[keyLower]) {
                scene.keys[keyLower].isDown = true;
            }
            // Arrow keys
            if (key === 'ArrowUp' || key === 'up') scene.keys.up.isDown = true;
            if (key === 'ArrowDown' || key === 'down') scene.keys.down.isDown = true;
            if (key === 'ArrowLeft' || key === 'left') scene.keys.left.isDown = true;
            if (key === 'ArrowRight' || key === 'right') scene.keys.right.isDown = true;
        });

        // Run physics ticks synchronously
        const tickMs = 16;
        let elapsed = 0;
        gamePaused = false;

        while (elapsed < duration) {
            harnessTime += tickMs;
            const dtSec = tickMs / 1000;

            // Run update logic manually
            if (gameState === 'playing') {
                scene.handleMovement();

                // Manually apply physics movement
                if (scene.playerSprite && scene.playerSprite.body) {
                    scene.playerSprite.x += scene.playerSprite.body.velocity.x * dtSec;
                    scene.playerSprite.y += scene.playerSprite.body.velocity.y * dtSec;
                    player.x = scene.playerSprite.x;
                    player.y = scene.playerSprite.y;
                }

                scene.updateEnemies(scene.time.now);

                // Stamina regen
                player.stamina = Math.min(100, player.stamina + tickMs * 0.005);

                // Update cooldowns
                if (scene.attackCooldown > 0) scene.attackCooldown -= tickMs;
                if (scene.dodgeCooldown > 0) scene.dodgeCooldown -= tickMs;
                if (scene.interactCooldown > 0) scene.interactCooldown -= tickMs;
            }

            elapsed += tickMs;
        }

        gamePaused = true;

        // Release keys
        Object.values(scene.keys).forEach(k => k.isDown = false);

        return {
            screenshot: screenshot ? (game.canvas ? game.canvas.toDataURL() : null) : null,
            logs: [...debugLogs],
            state: window.harness.getState(),
            realTime: Date.now() - startTime
        };
    },

    getState: () => {
        const scene = game.scene.getScene('GameScene');
        const enemyList = [];

        if (scene && scene.enemies) {
            scene.enemies.children.iterate(enemy => {
                if (enemy && enemy.active) {
                    enemyList.push({
                        type: enemy.enemyType,
                        x: enemy.x,
                        y: enemy.y,
                        hp: enemy.hp,
                        maxHp: enemy.maxHp,
                        state: enemy.state
                    });
                }
            });
        }

        return {
            gameState,
            currentSector,
            gameTime,
            harnessTime,
            globalInfection,
            player: {
                x: player.x,
                y: player.y,
                health: player.health,
                hunger: player.hunger,
                thirst: player.thirst,
                fatigue: player.fatigue,
                infection: player.infection,
                stamina: player.stamina,
                hasRedKeycard: player.hasRedKeycard,
                hasDataChip: player.hasDataChip,
                inventoryCount: player.inventory.length,
                weapon: player.weapon ? player.weapon.name : 'Fists'
            },
            enemies: enemyList,
            power: {
                used: worldState.powerUsed,
                max: worldState.maxPower,
                sectors: {
                    storage: SECTORS.storage.powered,
                    medical: SECTORS.medical.powered,
                    research: SECTORS.research.powered,
                    escape: SECTORS.escape.powered
                }
            }
        };
    },

    getPhase: () => {
        if (gameState === 'menu') return 'menu';
        if (gameState === 'victory') return 'victory';
        if (gameState === 'gameover') return 'gameover';
        return 'playing';
    },

    debug: {
        setHealth: (hp) => { player.health = hp; },
        setInfection: (inf) => { player.infection = inf; },
        setGlobalInfection: (inf) => { globalInfection = inf; },
        setHunger: (h) => { player.hunger = h; },
        setThirst: (t) => { player.thirst = t; },
        setFatigue: (f) => { player.fatigue = f; },
        giveKeycard: () => { player.hasRedKeycard = true; },
        giveDataChip: () => { player.hasDataChip = true; },
        powerSector: (sector) => {
            if (SECTORS[sector]) {
                SECTORS[sector].powered = true;
            }
        },
        restart: () => {
            gameState = 'playing';
            harnessTime = 0;
            debugLogs = [];
            player.health = 100;
            player.hunger = 0;
            player.thirst = 0;
            player.fatigue = 0;
            player.infection = 0;
            player.stamina = 100;
            globalInfection = 0;
        },
        forceStart: () => {
            gameState = 'playing';
            gamePaused = false;
            const menuScene = game.scene.getScene('MenuScene');
            if (menuScene && menuScene.scene.isActive()) {
                menuScene.scene.start('GameScene');
            }
        },
        clearEnemies: () => {
            const scene = game.scene.getScene('GameScene');
            if (scene && scene.enemies) {
                scene.enemies.clear(true, true);
            }
        },
        teleportToSector: (sector) => {
            if (SECTORS[sector]) {
                currentSector = sector;
                const scene = game.scene.getScene('GameScene');
                if (scene) {
                    scene.scene.restart();
                }
            }
        }
    }
};
