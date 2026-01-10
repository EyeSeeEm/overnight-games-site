// Isolation Protocol - Subterrain Clone
// Phaser 3 Implementation

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// Colors
const COLORS = {
    BG: 0x0a0808,
    FLOOR_DARK: 0x2a2828,
    FLOOR_LIGHT: 0x3a3838,
    FLOOR_PATTERN: 0x323030,
    WALL: 0x1a1818,
    WALL_LIGHT: 0x2a2625,
    DOOR: 0x3a4a3a,
    BLOOD: 0x6a2020,
    BLOOD_GREEN: 0x305a30,
    PLAYER: 0x5a6a6a,
    SHAMBLER: 0x6a5848,
    CRAWLER: 0x5a4838,
    SPITTER: 0x4a6a4a,
    SPITTER_ACID: 0x6aaa5a,
    BRUTE: 0x7a5848,
    COCOON: 0xaa6a30,
    MUZZLE: 0xffaa44,
    HEALTH_BAR: 0xaa3030,
    HUNGER_BAR: 0xaa6a30,
    THIRST_BAR: 0x3070aa,
    FATIGUE_BAR: 0x6a6a6a,
    INFECTION_BAR: 0x30aa40,
    GLOBAL_INF: 0xff4444
};

const TILE = {
    FLOOR: 0, WALL: 1,
    DOOR_HUB: 10, DOOR_STORAGE: 11, DOOR_MEDICAL: 12, DOOR_RESEARCH: 13, DOOR_ESCAPE: 14,
    WORKBENCH: 20, BED: 21, STORAGE_LOCKER: 22, POWER_PANEL: 23,
    MEDICAL_STATION: 24, RESEARCH_TERMINAL: 25, ESCAPE_POD: 26, CONTAINER: 30
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }

    create() {
        this.createTextures();
        this.scene.start('Game');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Floor tile with diamond pattern
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.FLOOR_PATTERN);
        g.beginPath();
        g.moveTo(TILE_SIZE / 2, 0);
        g.lineTo(TILE_SIZE, TILE_SIZE / 2);
        g.lineTo(TILE_SIZE / 2, TILE_SIZE);
        g.lineTo(0, TILE_SIZE / 2);
        g.closePath();
        g.fillPath();
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.WALL_LIGHT);
        g.fillRect(0, 0, TILE_SIZE, 3);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door tile
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x3a5a3a);
        g.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.fillStyle(COLORS.DOOR);
        g.fillRect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16);
        g.generateTexture('door', TILE_SIZE, TILE_SIZE);

        // Container
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x5a5048);
        g.fillRect(6, 8, TILE_SIZE - 12, TILE_SIZE - 12);
        g.fillStyle(0x4a4038);
        g.fillRect(8, 10, TILE_SIZE - 16, 6);
        g.generateTexture('container', TILE_SIZE, TILE_SIZE);

        // Facilities
        // Workbench
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x5a4a3a);
        g.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.fillStyle(0x6a5a4a);
        g.fillRect(6, 6, TILE_SIZE - 12, 6);
        g.generateTexture('workbench', TILE_SIZE, TILE_SIZE);

        // Bed
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x3a3a5a);
        g.fillRect(4, 2, TILE_SIZE - 8, TILE_SIZE - 4);
        g.fillStyle(0x4a4a6a);
        g.fillRect(6, 4, TILE_SIZE - 12, 10);
        g.generateTexture('bed', TILE_SIZE, TILE_SIZE);

        // Medical Station
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x5a6a6a);
        g.fillRect(2, 4, TILE_SIZE - 4, TILE_SIZE - 8);
        g.fillStyle(0xaa3030);
        g.fillRect(12, 8, 8, 16);
        g.fillRect(8, 12, 16, 8);
        g.generateTexture('medical', TILE_SIZE, TILE_SIZE);

        // Escape Pod
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x4a5a4a);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x6aaa6a);
        g.fillCircle(16, 16, 6);
        g.generateTexture('escapePod', TILE_SIZE, TILE_SIZE);

        // Player
        g.clear();
        g.fillStyle(COLORS.PLAYER);
        g.fillRect(4, 6, 24, 20);
        g.fillStyle(0x8a9a98);
        g.fillRect(8, 8, 16, 12);
        g.fillStyle(0x444444);
        g.fillRect(24, 12, 8, 6);
        g.generateTexture('player', TILE_SIZE, TILE_SIZE);

        // Enemies
        // Shambler
        g.clear();
        g.fillStyle(COLORS.SHAMBLER);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x8a6858);
        g.fillRect(8, 6, 16, 14);
        g.generateTexture('shambler', TILE_SIZE, TILE_SIZE);

        // Crawler
        g.clear();
        g.fillStyle(COLORS.CRAWLER);
        g.fillRect(2, 8, 28, 16);
        g.fillStyle(0x6a5848);
        g.fillRect(6, 10, 10, 12);
        g.fillRect(16, 10, 10, 12);
        g.generateTexture('crawler', TILE_SIZE, TILE_SIZE);

        // Spitter
        g.clear();
        g.fillStyle(COLORS.SPITTER);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(COLORS.SPITTER_ACID);
        g.fillCircle(16, 12, 6);
        g.generateTexture('spitter', TILE_SIZE, TILE_SIZE);

        // Brute
        g.clear();
        g.fillStyle(0x5a3828);
        g.fillRect(0, 0, 40, 40);
        g.fillStyle(COLORS.BRUTE);
        g.fillRect(4, 4, 32, 32);
        g.fillStyle(0x5a3828);
        g.fillRect(8, 6, 24, 12);
        g.generateTexture('brute', 40, 40);

        // Cocoon
        g.clear();
        g.fillStyle(0xcc8a40);
        g.fillCircle(24, 24, 22);
        g.fillStyle(COLORS.COCOON);
        g.fillCircle(24, 24, 18);
        g.lineStyle(2, 0xaa5a20);
        for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5;
            g.lineBetween(24, 24, 24 + Math.cos(angle) * 16, 24 + Math.sin(angle) * 16);
        }
        g.generateTexture('cocoon', 48, 48);

        // Blood splatter
        g.clear();
        g.fillStyle(COLORS.BLOOD);
        g.fillCircle(16, 16, 14);
        g.fillCircle(24, 20, 10);
        g.fillCircle(10, 22, 8);
        g.generateTexture('blood', TILE_SIZE, TILE_SIZE);

        // Blood green
        g.clear();
        g.fillStyle(COLORS.BLOOD_GREEN);
        g.fillCircle(16, 16, 14);
        g.fillCircle(24, 20, 10);
        g.fillCircle(10, 22, 8);
        g.generateTexture('bloodGreen', TILE_SIZE, TILE_SIZE);

        // Projectile
        g.clear();
        g.fillStyle(COLORS.MUZZLE);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Acid projectile
        g.clear();
        g.fillStyle(COLORS.SPITTER_ACID);
        g.fillCircle(5, 5, 5);
        g.generateTexture('acid', 10, 10);

        g.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    create() {
        this.initGameState();
        this.generateSectors();
        this.loadSector('hub');
        this.createPlayer();
        this.createUI();
        this.setupInput();
        this.startTimers();

        window.gameState = {
            game: this.gameData,
            player: this.playerData,
            enemies: this.enemies
        };
    }

    initGameState() {
        this.gameData = {
            state: 'playing',
            currentSector: 'hub',
            time: 0,
            realTime: 0,
            globalInfection: 0,
            hasKeycard: false,
            tier2Unlocked: false,
            poweredSectors: { hub: true, storage: false, medical: false, research: false, escape: false }
        };

        this.playerData = {
            health: 100, maxHealth: 100,
            hunger: 0, thirst: 0, fatigue: 0, infection: 0,
            stamina: 100, maxStamina: 100,
            weapon: 'fists', ammo: 0,
            inventory: [
                { type: 'food', name: 'Canned Food', count: 2 },
                { type: 'water', name: 'Water Bottle', count: 2 }
            ]
        };

        // Stats tracking
        this.stats = {
            killCount: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            critCount: 0,
            containersLooted: 0,
            itemsUsed: 0,
            sectorsVisited: new Set(['hub']),
            maxKillStreak: 0
        };

        // Kill streak system
        this.killStreak = 0;
        this.killStreakTimer = 0;

        // Visual effects state
        this.damageFlashAlpha = 0;
        this.lowHealthPulse = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Debug mode
        this.debugMode = false;

        this.enemies = [];
        this.containers = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.particles = [];
        this.bloodGroup = null;
    }

    generateSectors() {
        this.sectors = {
            hub: { width: 15, height: 15, tiles: [], spawnX: 7, spawnY: 7, name: 'Central Hub' },
            storage: { width: 20, height: 20, tiles: [], spawnX: 10, spawnY: 2, name: 'Storage Wing' },
            medical: { width: 20, height: 20, tiles: [], spawnX: 10, spawnY: 2, name: 'Medical Bay' },
            research: { width: 25, height: 25, tiles: [], spawnX: 12, spawnY: 2, name: 'Research Lab' },
            escape: { width: 15, height: 15, tiles: [], spawnX: 7, spawnY: 12, name: 'Escape Pod' }
        };

        for (const [name, sector] of Object.entries(this.sectors)) {
            this.generateSectorTiles(name, sector);
        }
    }

    generateSectorTiles(name, sector) {
        const w = sector.width;
        const h = sector.height;

        for (let y = 0; y < h; y++) {
            sector.tiles[y] = [];
            for (let x = 0; x < w; x++) {
                if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
                    sector.tiles[y][x] = TILE.WALL;
                } else {
                    sector.tiles[y][x] = TILE.FLOOR;
                }
            }
        }

        // Add internal walls
        const numWalls = Math.floor((w * h) / 60);
        for (let i = 0; i < numWalls; i++) {
            const x = 2 + Math.floor(Math.random() * (w - 4));
            const y = 2 + Math.floor(Math.random() * (h - 4));
            const horizontal = Math.random() < 0.5;
            const length = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < length; j++) {
                const wx = horizontal ? x + j : x;
                const wy = horizontal ? y : y + j;
                if (wx > 0 && wx < w - 1 && wy > 0 && wy < h - 1) {
                    sector.tiles[wy][wx] = TILE.WALL;
                }
            }
        }

        // Add doors
        if (name === 'hub') {
            sector.tiles[h - 1][Math.floor(w / 2)] = TILE.DOOR_STORAGE;
            sector.tiles[Math.floor(h / 2)][w - 1] = TILE.DOOR_MEDICAL;
            sector.tiles[Math.floor(h / 2)][0] = TILE.DOOR_RESEARCH;
            sector.tiles[0][Math.floor(w / 2)] = TILE.DOOR_ESCAPE;
            sector.tiles[3][3] = TILE.WORKBENCH;
            sector.tiles[3][w - 4] = TILE.BED;
        } else {
            sector.tiles[0][Math.floor(w / 2)] = TILE.DOOR_HUB;
        }

        if (name === 'medical') {
            sector.tiles[h - 4][Math.floor(w / 2)] = TILE.MEDICAL_STATION;
        }
        if (name === 'escape') {
            sector.tiles[Math.floor(h / 2)][Math.floor(w / 2)] = TILE.ESCAPE_POD;
        }

        // Add containers
        if (name !== 'hub') {
            const numContainers = name === 'storage' ? 10 : 6;
            for (let i = 0; i < numContainers; i++) {
                for (let attempts = 0; attempts < 20; attempts++) {
                    const x = 2 + Math.floor(Math.random() * (w - 4));
                    const y = 2 + Math.floor(Math.random() * (h - 4));
                    if (sector.tiles[y][x] === TILE.FLOOR) {
                        sector.tiles[y][x] = TILE.CONTAINER;
                        this.containers.push({
                            sector: name, x, y, looted: false,
                            lootType: this.getLootType(name)
                        });
                        break;
                    }
                }
            }
        }
    }

    getLootType(sectorName) {
        if (sectorName === 'storage') {
            const r = Math.random();
            if (r < 0.3) return 'food';
            if (r < 0.6) return 'water';
            return 'scrap';
        } else if (sectorName === 'medical') {
            return Math.random() < 0.5 ? 'medkit' : 'antidote';
        } else if (sectorName === 'research') {
            const r = Math.random();
            if (r < 0.3) return 'electronics';
            if (r < 0.5) return 'dataChip';
            if (r < 0.7) return 'keycard';
            return 'scrap';
        }
        return 'scrap';
    }

    loadSector(name) {
        // Track sector visit
        const isNewSector = !this.stats.sectorsVisited.has(name);
        this.stats.sectorsVisited.add(name);

        // Clear existing
        if (this.mapGroup) this.mapGroup.destroy(true);
        if (this.enemyGroup) this.enemyGroup.destroy(true);
        if (this.bloodGroup) this.bloodGroup.destroy(true);
        if (this.projectileGroup) this.projectileGroup.destroy(true);

        this.mapGroup = this.add.group();
        this.enemyGroup = this.add.group();
        this.bloodGroup = this.add.group();
        this.projectileGroup = this.add.group();
        this.enemies = [];
        this.projectiles = [];

        // Show sector transition message if entering new sector
        if (isNewSector && this.sectors[name]) {
            this.time.delayedCall(100, () => {
                this.createFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'ENTERING: ' + this.sectors[name].name.toUpperCase(), '#aaaaff', 18);
            });
        }

        const sector = this.sectors[name];
        this.gameData.currentSector = name;

        // Render tiles
        for (let y = 0; y < sector.height; y++) {
            for (let x = 0; x < sector.width; x++) {
                const tile = sector.tiles[y][x];
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                let texture = 'floor';
                if (tile === TILE.WALL) texture = 'wall';
                else if (tile >= TILE.DOOR_HUB && tile <= TILE.DOOR_ESCAPE) texture = 'door';
                else if (tile === TILE.CONTAINER) texture = 'container';
                else if (tile === TILE.WORKBENCH) texture = 'workbench';
                else if (tile === TILE.BED) texture = 'bed';
                else if (tile === TILE.MEDICAL_STATION) texture = 'medical';
                else if (tile === TILE.ESCAPE_POD) texture = 'escapePod';

                const sprite = this.add.image(px, py, texture);
                this.mapGroup.add(sprite);
            }
        }

        // Darkness for unpowered sectors
        if (!this.gameData.poweredSectors[name]) {
            this.darkness = this.add.rectangle(
                sector.width * TILE_SIZE / 2,
                sector.height * TILE_SIZE / 2,
                sector.width * TILE_SIZE,
                sector.height * TILE_SIZE,
                0x000000, 0.4
            );
        } else if (this.darkness) {
            this.darkness.destroy();
            this.darkness = null;
        }

        // Spawn enemies
        if (name !== 'hub') {
            this.spawnEnemies(name);
        }

        // Position player
        if (this.player) {
            this.player.x = sector.spawnX * TILE_SIZE + TILE_SIZE / 2;
            this.player.y = sector.spawnY * TILE_SIZE + TILE_SIZE / 2;
        }

        // Camera bounds and follow
        this.cameras.main.setBounds(0, 0, sector.width * TILE_SIZE, sector.height * TILE_SIZE);

        // Re-establish camera follow after sector load for smooth tracking
        if (this.player) {
            this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
            // Immediately center on player
            this.cameras.main.centerOn(this.player.x, this.player.y);
        }
    }

    spawnEnemies(sectorName) {
        const sector = this.sectors[sectorName];
        let types, count;

        if (sectorName === 'storage') {
            types = ['shambler', 'shambler', 'crawler'];
            count = 3;
        } else if (sectorName === 'medical') {
            types = ['shambler', 'spitter', 'spitter'];
            count = 3;
        } else if (sectorName === 'research') {
            types = ['crawler', 'spitter', 'brute'];
            count = 3;
        } else if (sectorName === 'escape') {
            types = ['shambler', 'crawler', 'spitter', 'brute'];
            count = 4;
        }

        for (let i = 0; i < count; i++) {
            for (let attempts = 0; attempts < 30; attempts++) {
                const x = 3 + Math.floor(Math.random() * (sector.width - 6));
                const y = 3 + Math.floor(Math.random() * (sector.height - 6));

                if (Math.abs(x - sector.spawnX) + Math.abs(y - sector.spawnY) > 5) {
                    if (sector.tiles[y][x] === TILE.FLOOR) {
                        this.createEnemy(types[i % types.length], x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                        break;
                    }
                }
            }
        }

        // Add cocoon in harder sectors
        if (sectorName === 'research' || sectorName === 'escape') {
            for (let attempts = 0; attempts < 20; attempts++) {
                const x = 3 + Math.floor(Math.random() * (sector.width - 6));
                const y = 3 + Math.floor(Math.random() * (sector.height - 6));
                if (sector.tiles[y][x] === TILE.FLOOR) {
                    this.createEnemy('cocoon', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                    break;
                }
            }
        }
    }

    createEnemy(type, x, y) {
        const stats = {
            shambler: { hp: 30, damage: 10, speed: 50, attackRate: 1500, range: 250 },
            crawler: { hp: 20, damage: 8, speed: 120, attackRate: 1000, range: 200 },
            spitter: { hp: 25, damage: 15, speed: 40, attackRate: 2500, range: 300, ranged: true },
            brute: { hp: 80, damage: 25, speed: 30, attackRate: 2000, range: 200 },
            cocoon: { hp: 50, damage: 0, speed: 0, attackRate: 60000, range: 150 }
        };

        const s = stats[type];
        const texture = type === 'cocoon' ? 'cocoon' : type;

        const enemy = this.add.sprite(x, y, texture);
        enemy.type = type;
        enemy.hp = s.hp;
        enemy.maxHp = s.hp;
        enemy.damage = s.damage;
        enemy.speed = s.speed;
        enemy.attackRate = s.attackRate;
        enemy.lastAttack = 0;
        enemy.range = s.range;
        enemy.ranged = s.ranged || false;
        enemy.state = 'idle';
        enemy.infection = type === 'spitter' ? 10 : 5;

        this.enemyGroup.add(enemy);
        this.enemies.push(enemy);
    }

    createPlayer() {
        const sector = this.sectors[this.gameData.currentSector];
        this.player = this.add.sprite(
            sector.spawnX * TILE_SIZE + TILE_SIZE / 2,
            sector.spawnY * TILE_SIZE + TILE_SIZE / 2,
            'player'
        );
        this.player.setDepth(10);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    createUI() {
        this.uiCamera = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.uiCamera.setScroll(0, 0);

        this.uiGroup = this.add.container(0, 0);
        this.uiGroup.setScrollFactor(0);
        this.uiGroup.setDepth(100);

        // Survival bars background
        const barBg = this.add.rectangle(70, 80, 150, 140, 0x1a1414, 0.8);
        barBg.setScrollFactor(0);
        this.uiGroup.add(barBg);

        // Bar labels and values
        this.healthText = this.add.text(10, 15, 'HP: 100', { fontSize: '12px', color: '#aa3030' });
        this.hungerText = this.add.text(10, 35, 'HUN: 0', { fontSize: '10px', color: '#aa6a30' });
        this.thirstText = this.add.text(10, 50, 'THI: 0', { fontSize: '10px', color: '#3070aa' });
        this.fatigueText = this.add.text(10, 65, 'FAT: 0', { fontSize: '10px', color: '#6a6a6a' });
        this.infectionText = this.add.text(10, 85, 'INF: 0', { fontSize: '12px', color: '#30aa40' });

        [this.healthText, this.hungerText, this.thirstText, this.fatigueText, this.infectionText].forEach(t => {
            t.setScrollFactor(0);
            this.uiGroup.add(t);
        });

        // Global infection
        this.globalText = this.add.text(GAME_WIDTH - 140, GAME_HEIGHT - 45, 'GLOBAL: 0.0%', { fontSize: '14px', color: '#ff4444' });
        this.globalText.setScrollFactor(0);
        this.uiGroup.add(this.globalText);

        // Sector name
        this.sectorText = this.add.text(GAME_WIDTH / 2, 15, 'Central Hub', { fontSize: '14px', color: '#aaaaaa' });
        this.sectorText.setOrigin(0.5, 0);
        this.sectorText.setScrollFactor(0);
        this.uiGroup.add(this.sectorText);

        // Time
        this.timeText = this.add.text(GAME_WIDTH - 100, 15, 'Day 1 00:00', { fontSize: '12px', color: '#888888' });
        this.timeText.setScrollFactor(0);
        this.uiGroup.add(this.timeText);

        // Quick slots
        const slotBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, 200, 40, 0x1a1414, 0.8);
        slotBg.setScrollFactor(0);
        this.uiGroup.add(slotBg);

        this.slotTexts = [];
        const slots = ['[1]Food', '[2]Water', '[3]Med', '[4]Anti'];
        slots.forEach((label, i) => {
            const x = GAME_WIDTH / 2 - 80 + i * 48;
            const t = this.add.text(x, GAME_HEIGHT - 38, label, { fontSize: '10px', color: '#888888' });
            t.setScrollFactor(0);
            this.uiGroup.add(t);
            this.slotTexts.push(t);
        });

        // Instructions
        this.add.text(10, GAME_HEIGHT - 15, 'WASD:Move Click:Attack E:Interact 1-4:Items Q:Debug', { fontSize: '9px', color: '#666666' }).setScrollFactor(0);

        // Visual effects overlays
        this.damageOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0);
        this.damageOverlay.setScrollFactor(0).setDepth(90);

        this.lowHealthOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x330000, 0);
        this.lowHealthOverlay.setScrollFactor(0).setDepth(89);

        this.infectionOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x003300, 0);
        this.infectionOverlay.setScrollFactor(0).setDepth(88);

        // Kill streak display
        this.killStreakText = this.add.text(GAME_WIDTH / 2, 80, '', { fontSize: '18px', color: '#ffaa00', fontStyle: 'bold' });
        this.killStreakText.setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Debug overlay
        this.debugText = this.add.text(GAME_WIDTH - 200, 50, '', { fontSize: '10px', color: '#00ff00', backgroundColor: '#000000aa' });
        this.debugText.setScrollFactor(0).setDepth(150).setVisible(false);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D')
        };
        this.eKey = this.input.keyboard.addKey('E');
        this.qKey = this.input.keyboard.addKey('Q');
        this.keys1to4 = [
            this.input.keyboard.addKey('ONE'),
            this.input.keyboard.addKey('TWO'),
            this.input.keyboard.addKey('THREE'),
            this.input.keyboard.addKey('FOUR')
        ];

        this.input.on('pointerdown', () => this.attack());
    }

    startTimers() {
        // Game time timer (1 second = 1 minute)
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameData.state !== 'playing') return;
                this.gameData.realTime += 1;
                this.gameData.time = this.gameData.realTime;
                this.gameData.globalInfection = Math.min(100, this.gameData.realTime * 0.1);

                // Decay meters
                this.playerData.hunger = Math.min(100, this.playerData.hunger + 0.1);
                this.playerData.thirst = Math.min(100, this.playerData.thirst + 0.2);
                this.playerData.fatigue = Math.min(100, this.playerData.fatigue + 0.067);

                // Infection in unpowered sector
                if (!this.gameData.poweredSectors[this.gameData.currentSector]) {
                    this.playerData.infection = Math.min(100, this.playerData.infection + 0.5);
                }

                // Health effects
                if (this.playerData.hunger >= 75 || this.playerData.thirst >= 75) {
                    this.playerData.health -= 0.5;
                }
                if (this.playerData.infection >= 75) {
                    this.playerData.health -= 1;
                }

                // Check lose conditions
                if (this.playerData.health <= 0) {
                    this.gameOver('You died.');
                }
                if (this.playerData.infection >= 100) {
                    this.gameOver('The infection consumed you.');
                }
                if (this.gameData.globalInfection >= 100) {
                    this.gameOver('The facility is lost.');
                }
            },
            loop: true
        });
    }

    update(time, delta) {
        if (this.gameData.state !== 'playing') return;

        // Debug toggle
        if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
            this.debugMode = !this.debugMode;
            this.debugText.setVisible(this.debugMode);
        }

        this.updatePlayer();
        this.updateEnemies();
        this.updateProjectiles();
        this.updateUI();
        this.checkItemUse();
        this.checkInteraction();
        this.updateVisualEffects(delta);
        this.updateFloatingTexts(delta);
        this.updateParticles(delta);
        this.updateKillStreak(delta);
        this.updateDebugOverlay();
    }

    updatePlayer() {
        let vx = 0, vy = 0;
        const speed = 150;

        if (this.wasd.w.isDown || this.cursors.up.isDown) vy = -speed;
        if (this.wasd.s.isDown || this.cursors.down.isDown) vy = speed;
        if (this.wasd.a.isDown || this.cursors.left.isDown) vx = -speed;
        if (this.wasd.d.isDown || this.cursors.right.isDown) vx = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        const dt = this.game.loop.delta / 1000;
        const newX = this.player.x + vx * dt;
        const newY = this.player.y + vy * dt;

        if (!this.checkCollision(newX, this.player.y)) {
            this.player.x = newX;
        }
        if (!this.checkCollision(this.player.x, newY)) {
            this.player.y = newY;
        }

        // Rotate toward mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y,
            pointer.worldX, pointer.worldY);
        this.player.rotation = angle;

        // Check door transitions
        this.checkDoorTransition();
    }

    checkCollision(x, y) {
        const sector = this.sectors[this.gameData.currentSector];
        const hw = 12, hh = 10;

        const left = Math.floor((x - hw) / TILE_SIZE);
        const right = Math.floor((x + hw) / TILE_SIZE);
        const top = Math.floor((y - hh) / TILE_SIZE);
        const bottom = Math.floor((y + hh) / TILE_SIZE);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (ty < 0 || ty >= sector.height || tx < 0 || tx >= sector.width) return true;
                if (sector.tiles[ty][tx] === TILE.WALL) return true;
            }
        }
        return false;
    }

    checkDoorTransition() {
        const sector = this.sectors[this.gameData.currentSector];
        const tx = Math.floor(this.player.x / TILE_SIZE);
        const ty = Math.floor(this.player.y / TILE_SIZE);

        if (ty < 0 || ty >= sector.height || tx < 0 || tx >= sector.width) return;

        const tile = sector.tiles[ty][tx];
        const doorMap = {
            [TILE.DOOR_HUB]: 'hub',
            [TILE.DOOR_STORAGE]: 'storage',
            [TILE.DOOR_MEDICAL]: 'medical',
            [TILE.DOOR_RESEARCH]: 'research',
            [TILE.DOOR_ESCAPE]: 'escape'
        };

        if (doorMap[tile] && doorMap[tile] !== this.gameData.currentSector) {
            const newSector = doorMap[tile];
            if (newSector === 'escape' && !this.gameData.hasKeycard) return;
            this.loadSector(newSector);
        }
    }

    attack() {
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

        // Melee attack
        const range = 40;
        const attackX = this.player.x + Math.cos(angle) * range;
        const attackY = this.player.y + Math.sin(angle) * range;

        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
            if (dist < enemy.width + 20) {
                this.damageEnemy(enemy, 8);
            }
        });

        // Attack effect
        const flash = this.add.circle(attackX, attackY, 10, 0xffffff, 0.5);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    damageEnemy(enemy, damage) {
        // Critical hit system (15% chance, 2x damage)
        const isCrit = Math.random() < 0.15;
        if (isCrit) {
            damage *= 2;
            this.stats.critCount++;
        }

        enemy.hp -= damage;
        this.stats.totalDamageDealt += damage;

        // Flash red
        enemy.setTint(isCrit ? 0xffff00 : 0xff0000);
        this.time.delayedCall(100, () => enemy.clearTint());

        // Floating damage number
        this.createFloatingText(
            enemy.x, enemy.y - 20,
            damage.toString() + (isCrit ? '!' : ''),
            isCrit ? '#ffff00' : '#ff4444',
            isCrit ? 18 : 14
        );

        // Screen shake on hit
        this.triggerScreenShake(isCrit ? 6 : 3);

        if (enemy.hp <= 0) {
            this.killEnemy(enemy, isCrit);
        }
    }

    killEnemy(enemy, wasCrit) {
        this.stats.killCount++;

        // Kill streak
        this.killStreak++;
        this.killStreakTimer = 3000; // 3 second timer
        if (this.killStreak > this.stats.maxKillStreak) {
            this.stats.maxKillStreak = this.killStreak;
        }

        // Kill streak messages
        if (this.killStreak >= 3) {
            const streakMessages = { 3: 'TRIPLE KILL!', 4: 'QUAD KILL!', 5: 'RAMPAGE!', 6: 'MASSACRE!' };
            const msg = streakMessages[Math.min(this.killStreak, 6)] || 'UNSTOPPABLE!';
            this.createFloatingText(GAME_WIDTH / 2, 120, msg, '#ffaa00', 22);
        }

        // Blood splatter with more particles for crits
        const isGreen = enemy.type === 'spitter';
        const blood = this.add.image(enemy.x, enemy.y, isGreen ? 'bloodGreen' : 'blood');
        blood.setAlpha(0.8);
        this.bloodGroup.add(blood);

        // Extra blood particles for crits
        if (wasCrit) {
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 10 + Math.random() * 20;
                const extraBlood = this.add.image(
                    enemy.x + Math.cos(angle) * dist,
                    enemy.y + Math.sin(angle) * dist,
                    isGreen ? 'bloodGreen' : 'blood'
                );
                extraBlood.setAlpha(0.6).setScale(0.5 + Math.random() * 0.3);
                this.bloodGroup.add(extraBlood);
            }
        }

        // Death burst particles
        this.createDeathBurst(enemy.x, enemy.y, isGreen ? 0x305a30 : 0x6a2020);

        // Item drop chance (20%)
        if (Math.random() < 0.2) {
            this.dropItem(enemy.x, enemy.y);
        }

        enemy.destroy();
        this.enemies = this.enemies.filter(e => e !== enemy);
    }

    createDeathBurst(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 50 + Math.random() * 50;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 500,
                maxLife: 500,
                color,
                size: 4 + Math.random() * 4
            });
        }
        this.triggerScreenShake(8);
    }

    dropItem(x, y) {
        const types = ['scrap', 'cloth', 'chemicals'];
        const type = types[Math.floor(Math.random() * types.length)];
        const item = { type, name: type, count: 1 };
        const existing = this.playerData.inventory.find(i => i.type === item.type);
        if (existing) existing.count++;
        else this.playerData.inventory.push(item);
        this.createFloatingText(x, y - 30, '+' + type.toUpperCase(), '#88ff88', 12);
    }

    updateEnemies() {
        const time = this.time.now;

        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Cocoon spawning
            if (enemy.type === 'cocoon') {
                if (time - enemy.lastAttack > enemy.attackRate) {
                    enemy.lastAttack = time;
                    // Spawn shambler
                    const angle = Math.random() * Math.PI * 2;
                    this.createEnemy('shambler', enemy.x + Math.cos(angle) * 50, enemy.y + Math.sin(angle) * 50);
                }
                // Infection aura
                if (dist < enemy.range) {
                    this.playerData.infection += 0.02;
                }
                return;
            }

            // Detection
            if (dist < enemy.range) {
                enemy.state = 'chase';
            } else if (dist > enemy.range * 1.5) {
                enemy.state = 'idle';
            }

            if (enemy.state === 'chase') {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                const dt = this.game.loop.delta / 1000;

                // Spitters keep distance
                if (enemy.ranged && dist < 150) {
                    enemy.x -= Math.cos(angle) * enemy.speed * dt;
                    enemy.y -= Math.sin(angle) * enemy.speed * dt;
                } else if (!enemy.ranged || dist > 200) {
                    enemy.x += Math.cos(angle) * enemy.speed * dt;
                    enemy.y += Math.sin(angle) * enemy.speed * dt;
                }

                // Attack
                if (time - enemy.lastAttack > enemy.attackRate) {
                    if (enemy.ranged && dist < 300) {
                        enemy.lastAttack = time;
                        const projAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        const proj = this.add.sprite(enemy.x, enemy.y, 'acid');
                        proj.vx = Math.cos(projAngle) * 200;
                        proj.vy = Math.sin(projAngle) * 200;
                        proj.damage = enemy.damage;
                        proj.infection = enemy.infection;
                        this.projectileGroup.add(proj);
                        this.projectiles.push(proj);
                    } else if (!enemy.ranged && dist < 40) {
                        enemy.lastAttack = time;
                        this.damagePlayer(enemy.damage, enemy.infection);
                    }
                }
            }
        });
    }

    updateProjectiles() {
        const dt = this.game.loop.delta / 1000;

        this.projectiles.forEach(proj => {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            // Hit player
            const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
            if (dist < 20) {
                this.damagePlayer(proj.damage, proj.infection || 0);
                proj.destroy();
                this.projectiles = this.projectiles.filter(p => p !== proj);
            }

            // Out of bounds
            if (proj.x < 0 || proj.y < 0 || proj.x > 1000 || proj.y > 1000) {
                proj.destroy();
                this.projectiles = this.projectiles.filter(p => p !== proj);
            }
        });
    }

    checkItemUse() {
        const itemTypes = ['food', 'water', 'medkit', 'antidote'];
        this.keys1to4.forEach((key, i) => {
            if (Phaser.Input.Keyboard.JustDown(key)) {
                this.useItem(itemTypes[i]);
            }
        });
    }

    useItem(type) {
        const idx = this.playerData.inventory.findIndex(i => i.type === type);
        if (idx < 0) return;

        this.stats.itemsUsed++;
        let feedback = '';

        switch (type) {
            case 'food':
                this.playerData.hunger = Math.max(0, this.playerData.hunger - 30);
                feedback = 'HUNGER -30';
                break;
            case 'water':
                this.playerData.thirst = Math.max(0, this.playerData.thirst - 40);
                feedback = 'THIRST -40';
                break;
            case 'medkit':
                this.playerData.health = Math.min(100, this.playerData.health + 30);
                feedback = '+30 HP';
                this.createHealingParticles();
                break;
            case 'antidote':
                this.playerData.infection = Math.max(0, this.playerData.infection - 30);
                feedback = 'INFECTION -30';
                this.createCureParticles();
                break;
        }

        // Floating text feedback
        if (feedback) {
            this.createFloatingText(this.player.x, this.player.y - 40, feedback, '#88ff88', 14);
        }

        if (this.playerData.inventory[idx].count > 1) {
            this.playerData.inventory[idx].count--;
        } else {
            this.playerData.inventory.splice(idx, 1);
        }
    }

    checkInteraction() {
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            const sector = this.sectors[this.gameData.currentSector];
            const tx = Math.floor(this.player.x / TILE_SIZE);
            const ty = Math.floor(this.player.y / TILE_SIZE);

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const cx = tx + dx;
                    const cy = ty + dy;
                    if (cy < 0 || cy >= sector.height || cx < 0 || cx >= sector.width) continue;

                    const tile = sector.tiles[cy][cx];

                    if (tile === TILE.CONTAINER) {
                        this.lootContainer(cx, cy);
                    } else if (tile === TILE.BED && this.playerData.fatigue > 0) {
                        this.playerData.fatigue = Math.max(0, this.playerData.fatigue - 30);
                        this.gameData.realTime += 60;
                    } else if (tile === TILE.MEDICAL_STATION && this.gameData.poweredSectors.medical) {
                        this.playerData.health = Math.min(100, this.playerData.health + 20);
                    } else if (tile === TILE.ESCAPE_POD && this.gameData.hasKeycard && this.gameData.poweredSectors.escape) {
                        this.victory();
                    }
                }
            }
        }
    }

    lootContainer(x, y) {
        const container = this.containers.find(c => c.sector === this.gameData.currentSector && c.x === x && c.y === y && !c.looted);
        if (!container) return;

        container.looted = true;
        this.stats.containersLooted++;

        if (container.lootType === 'keycard') {
            this.gameData.hasKeycard = true;
            this.createFloatingText(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE, 'KEYCARD FOUND!', '#ffff00', 16);
        } else {
            const item = { type: container.lootType, name: container.lootType, count: 1 };
            const existing = this.playerData.inventory.find(i => i.type === item.type);
            if (existing) existing.count++;
            else this.playerData.inventory.push(item);
            this.createFloatingText(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE, '+' + container.lootType.toUpperCase(), '#88ff88', 12);
        }

        // Loot sparkle effect
        this.createLootSparkle(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);

        this.sectors[this.gameData.currentSector].tiles[y][x] = TILE.FLOOR;

        // Reload sector visuals
        this.loadSector(this.gameData.currentSector);
    }

    updateUI() {
        this.healthText.setText(`HP: ${Math.floor(this.playerData.health)}`);
        this.hungerText.setText(`HUN: ${Math.floor(this.playerData.hunger)}`);
        this.thirstText.setText(`THI: ${Math.floor(this.playerData.thirst)}`);
        this.fatigueText.setText(`FAT: ${Math.floor(this.playerData.fatigue)}`);
        this.infectionText.setText(`INF: ${Math.floor(this.playerData.infection)}`);

        this.globalText.setText(`GLOBAL: ${this.gameData.globalInfection.toFixed(1)}%`);
        this.sectorText.setText(this.sectors[this.gameData.currentSector].name);

        const hours = Math.floor(this.gameData.time / 60);
        const mins = this.gameData.time % 60;
        this.timeText.setText(`Day 1 ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);

        // Update slot colors
        const itemTypes = ['food', 'water', 'medkit', 'antidote'];
        this.slotTexts.forEach((t, i) => {
            const has = this.playerData.inventory.find(it => it.type === itemTypes[i]);
            t.setColor(has ? '#88aa88' : '#555555');
        });
    }

    // Helper methods for visual effects and feedback
    damagePlayer(damage, infection = 0) {
        this.playerData.health -= damage;
        this.playerData.infection += infection;
        this.stats.totalDamageTaken += damage;

        // Damage flash
        this.damageFlashAlpha = 0.4;

        // Floating damage text
        this.createFloatingText(this.player.x, this.player.y - 30, '-' + damage, '#ff4444', 14);

        // Screen shake
        this.triggerScreenShake(5);
    }

    createFloatingText(x, y, text, color, size) {
        const floatText = this.add.text(x, y, text, {
            fontSize: size + 'px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(120);

        this.floatingTexts.push({
            obj: floatText,
            life: 1000,
            maxLife: 1000,
            vy: -30
        });
    }

    triggerScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }

    createHealingParticles() {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 20;
            this.particles.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                vx: 0,
                vy: -20 - Math.random() * 20,
                life: 800,
                maxLife: 800,
                color: 0x44ff44,
                size: 3 + Math.random() * 3
            });
        }
    }

    createCureParticles() {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 20;
            this.particles.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                vx: 0,
                vy: -20 - Math.random() * 20,
                life: 800,
                maxLife: 800,
                color: 0x44ffff,
                size: 3 + Math.random() * 3
            });
        }
    }

    createLootSparkle(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 30,
                vy: Math.sin(angle) * 30,
                life: 400,
                maxLife: 400,
                color: 0xffff44,
                size: 3
            });
        }
    }

    updateVisualEffects(delta) {
        const dt = delta / 1000;

        // Damage flash decay
        if (this.damageFlashAlpha > 0) {
            this.damageFlashAlpha = Math.max(0, this.damageFlashAlpha - dt * 2);
            this.damageOverlay.setAlpha(this.damageFlashAlpha);
        }

        // Low health pulsing vignette
        if (this.playerData.health < 30) {
            this.lowHealthPulse += dt * 4;
            const pulseAlpha = 0.2 + Math.sin(this.lowHealthPulse) * 0.1;
            this.lowHealthOverlay.setAlpha(pulseAlpha);
        } else {
            this.lowHealthOverlay.setAlpha(0);
        }

        // Infection visual effect
        if (this.playerData.infection > 50) {
            const infAlpha = (this.playerData.infection - 50) / 100 * 0.3;
            this.infectionOverlay.setAlpha(infAlpha);
        } else {
            this.infectionOverlay.setAlpha(0);
        }

        // Screen shake using Phaser's built-in shake (doesn't interfere with follow)
        if (this.screenShake.intensity > 0) {
            // Use camera offset instead of setScroll to not break follow
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.cameras.main.setFollowOffset(-shakeX, -shakeY);
            this.screenShake.intensity = Math.max(0, this.screenShake.intensity - dt * 30);
        } else {
            // Reset offset when shake is done
            this.cameras.main.setFollowOffset(0, 0);
        }
    }

    updateFloatingTexts(delta) {
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.life -= delta;
            ft.obj.y += ft.vy * (delta / 1000);
            ft.obj.setAlpha(ft.life / ft.maxLife);

            if (ft.life <= 0) {
                ft.obj.destroy();
                return false;
            }
            return true;
        });
    }

    updateParticles(delta) {
        const dt = delta / 1000;

        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= delta;

            return p.life > 0;
        });

        // Draw particles (simple circles)
        // Note: In Phaser we'd use graphics or particle emitters
        // For simplicity, we'll use tween'd circles
    }

    updateKillStreak(delta) {
        if (this.killStreakTimer > 0) {
            this.killStreakTimer -= delta;
            if (this.killStreakTimer <= 0) {
                this.killStreak = 0;
            }
        }

        // Update kill streak display
        if (this.killStreak >= 2) {
            this.killStreakText.setText(`${this.killStreak}x STREAK`);
            this.killStreakText.setVisible(true);
        } else {
            this.killStreakText.setVisible(false);
        }
    }

    updateDebugOverlay() {
        if (!this.debugMode) return;

        const debugInfo = [
            `KILLS: ${this.stats.killCount}`,
            `DMG DEALT: ${this.stats.totalDamageDealt}`,
            `DMG TAKEN: ${this.stats.totalDamageTaken}`,
            `CRITS: ${this.stats.critCount}`,
            `CONTAINERS: ${this.stats.containersLooted}`,
            `ITEMS USED: ${this.stats.itemsUsed}`,
            `SECTORS: ${this.stats.sectorsVisited.size}/5`,
            `MAX STREAK: ${this.stats.maxKillStreak}`,
            `STREAK: ${this.killStreak}`,
            `---`,
            `HP: ${Math.floor(this.playerData.health)}`,
            `HUN: ${Math.floor(this.playerData.hunger)}`,
            `THI: ${Math.floor(this.playerData.thirst)}`,
            `FAT: ${Math.floor(this.playerData.fatigue)}`,
            `INF: ${Math.floor(this.playerData.infection)}`,
            `GLOBAL: ${this.gameData.globalInfection.toFixed(1)}%`,
            `ENEMIES: ${this.enemies.length}`,
            `KEYCARD: ${this.gameData.hasKeycard ? 'YES' : 'NO'}`
        ];

        this.debugText.setText(debugInfo.join('\n'));
    }

    gameOver(reason) {
        this.gameData.state = 'gameover';

        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x200000, 0.9);
        overlay.setScrollFactor(0);
        overlay.setDepth(200);

        // Calculate performance rating
        let rating = 'VICTIM';
        const score = this.stats.killCount * 10 + this.stats.containersLooted * 5 - this.stats.totalDamageTaken;
        if (score >= 100) rating = 'SURVIVOR';
        else if (score >= 50) rating = 'FIGHTER';
        else if (score >= 20) rating = 'STRUGGLER';

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'GAME OVER', { fontSize: '32px', color: '#aa3030' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, reason, { fontSize: '16px', color: '#886060' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `Rating: ${rating}`, { fontSize: '20px', color: '#ffaa00' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);

        // Stats display
        const statsY = GAME_HEIGHT / 2 + 10;
        const statsText = [
            `Kills: ${this.stats.killCount}  |  Crits: ${this.stats.critCount}  |  Max Streak: ${this.stats.maxKillStreak}`,
            `Damage Dealt: ${this.stats.totalDamageDealt}  |  Damage Taken: ${this.stats.totalDamageTaken}`,
            `Containers: ${this.stats.containersLooted}  |  Items Used: ${this.stats.itemsUsed}  |  Sectors: ${this.stats.sectorsVisited.size}/5`,
            `Survived: ${Math.floor(this.gameData.time / 60)}h ${this.gameData.time % 60}m  |  Global: ${this.gameData.globalInfection.toFixed(1)}%`
        ];

        statsText.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, statsY + i * 18, line, { fontSize: '11px', color: '#888888' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(201);
        });

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'Press SPACE to restart', { fontSize: '14px', color: '#666666' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    }

    victory() {
        this.gameData.state = 'victory';

        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x002000, 0.9);
        overlay.setScrollFactor(0);
        overlay.setDepth(200);

        // Calculate efficiency rating
        const efficiency = (100 - this.gameData.globalInfection) + this.stats.killCount * 2 - this.stats.totalDamageTaken / 10;
        let rating = 'D';
        if (efficiency >= 120) rating = 'S';
        else if (efficiency >= 100) rating = 'A';
        else if (efficiency >= 80) rating = 'B';
        else if (efficiency >= 60) rating = 'C';

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, 'ESCAPED!', { fontSize: '32px', color: '#30aa30' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, `Efficiency Rating: ${rating}`, { fontSize: '22px', color: '#ffff00' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `Time: ${Math.floor(this.gameData.time / 60)}h ${this.gameData.time % 60}m`, { fontSize: '16px', color: '#60aa60' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);

        // Stats display
        const statsY = GAME_HEIGHT / 2;
        const statsText = [
            `Kills: ${this.stats.killCount}  |  Crits: ${this.stats.critCount}  |  Max Streak: ${this.stats.maxKillStreak}`,
            `Damage Dealt: ${this.stats.totalDamageDealt}  |  Damage Taken: ${this.stats.totalDamageTaken}`,
            `Containers: ${this.stats.containersLooted}  |  Items Used: ${this.stats.itemsUsed}  |  Sectors: ${this.stats.sectorsVisited.size}/5`,
            `Final Health: ${Math.floor(this.playerData.health)}  |  Infection: ${Math.floor(this.playerData.infection)}%`,
            `Global Infection: ${this.gameData.globalInfection.toFixed(1)}%`
        ];

        statsText.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, statsY + i * 18, line, { fontSize: '11px', color: '#88aa88' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(201);
        });

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, 'Press SPACE to play again', { fontSize: '14px', color: '#666666' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    }
}

const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BG,
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
