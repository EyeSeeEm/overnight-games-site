// Lost Outpost - Phaser 3 Version (EXPANDED)
// Top-down survival horror shooter inspired by Alien Breed
// 20 Expand Passes + 20 Polish Passes

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 35;

const COLORS = {
    FLOOR: 0x1a1a1a, FLOOR_HEX: 0x1f1f1f, FLOOR_GRATE: 0x252525,
    WALL: 0x333333, WALL_HIGHLIGHT: 0x444444, WALL_SHADOW: 0x1a1a1a,
    HAZARD_YELLOW: 0xccaa00, HAZARD_BLACK: 0x111111,
    DOOR: 0x444455, DOOR_LOCKED: 0x553333,
    UI_BG: 0x0a1a1a, UI_BORDER: 0x0a4a4a, UI_TEXT: 0x00cccc, UI_TEXT_DIM: 0x006666,
    HEALTH_BG: 0x330000, HEALTH: 0xcc0000, ARMOR: 0x0066cc, AMMO: 0x00cc00,
    PLAYER: 0x446688, ALIEN: 0x44aa44, ALIEN_EYES: 0xff0000,
    BULLET: 0xffff00, PLASMA: 0x00ffff, FIRE: 0xff6600, MUZZLE_FLASH: 0xffaa00,
    ACID: 0x88ff00, EXPLOSION: 0xff4400, BLOOD: 0x448844
};

const TERRAIN = {
    FLOOR: 0, WALL: 1, DOOR: 2, TERMINAL: 3, VENT: 4,
    HAZARD_FLOOR: 5, CRATE: 6, BARREL: 7, EXPLOSIVE_BARREL: 8,
    ACID_POOL: 9, TELEPORTER: 10, SHOP: 11
};

// EXPAND: Multiple weapon types
const WEAPONS = {
    assault_rifle: { name: 'Assault Rifle', damage: 10, fireRate: 8, spread: 0.05, projectiles: 1, speed: 500, clipSize: 30, reloadTime: 1.5, color: COLORS.BULLET },
    shotgun: { name: 'Shotgun', damage: 8, fireRate: 1.5, spread: 0.3, projectiles: 6, speed: 400, clipSize: 8, reloadTime: 2.0, color: COLORS.BULLET },
    plasma_rifle: { name: 'Plasma Rifle', damage: 25, fireRate: 3, spread: 0.02, projectiles: 1, speed: 600, clipSize: 20, reloadTime: 2.5, color: COLORS.PLASMA },
    smg: { name: 'SMG', damage: 6, fireRate: 15, spread: 0.1, projectiles: 1, speed: 450, clipSize: 45, reloadTime: 1.2, color: COLORS.BULLET },
    flamethrower: { name: 'Flamethrower', damage: 3, fireRate: 30, spread: 0.2, projectiles: 1, speed: 300, clipSize: 100, reloadTime: 3.0, color: COLORS.FIRE, piercing: true }
};

// EXPAND: More enemy types
const ENEMY_TYPES = {
    scorpion: { hp: 30, speed: 60, damage: 15, xp: 50, color: 0x44aa44, size: 10 },
    scorpion_small: { hp: 15, speed: 80, damage: 8, xp: 25, color: 0x338833, size: 8 },
    arachnid: { hp: 80, speed: 40, damage: 25, xp: 100, color: 0x226622, size: 16 },
    facehugger: { hp: 10, speed: 120, damage: 20, xp: 30, color: 0x556655, size: 6 },
    spitter: { hp: 40, speed: 50, damage: 0, xp: 75, color: 0x448844, size: 12, ranged: true },
    brute: { hp: 150, speed: 30, damage: 40, xp: 150, color: 0x225522, size: 20 },
    queen: { hp: 500, speed: 20, damage: 50, xp: 500, color: 0x115511, size: 30, boss: true }
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.gameState = 'playing';
        this.tick = 0;
        this.wave = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.killCount = 0;
        this.screenFlash = 0;
        this.ambientFlicker = 0;

        // Player data (EXPAND: More stats)
        this.playerData = {
            hp: 100, maxHp: 100,
            armor: 0, maxArmor: 50,
            lives: 3,
            credits: 0,
            rank: 1, xp: 0, xpToNext: 1000,
            currentWeapon: 'assault_rifle',
            weapons: {
                assault_rifle: { ammo: 90, clip: 30 }
            },
            cooldown: 0,
            invincible: 0,
            speedBoost: 0,
            damageBoost: 0,
            recoil: 0,
            reloading: false,
            reloadTime: 0
        };

        // Create graphics
        this.mapGraphics = this.add.graphics();
        this.flashlightGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();

        // Arrays
        this.map = [];
        this.enemies = [];
        this.items = [];
        this.bullets = [];
        this.particles = [];
        this.decals = [];
        this.floatingTexts = [];
        this.teleporters = [];

        // Generate level
        this.generateLevel();

        // Create player
        this.player = this.add.graphics();
        this.player.x = 640;
        this.player.y = 544;
        this.playerAngle = 0;

        // Set up camera
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        this.cameras.main.startFollow({ x: this.player.x, y: this.player.y }, true, 0.1, 0.1);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR,
            five: Phaser.Input.Keyboard.KeyCodes.FIVE
        });

        this.input.on('pointermove', (pointer) => {
            this.mouseX = pointer.worldX;
            this.mouseY = pointer.worldY;
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.mouseDown = true;
        });

        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) this.mouseDown = false;
        });

        this.mouseX = this.player.x;
        this.mouseY = this.player.y;
        this.mouseDown = false;

        // Create UI
        this.createUI();
        this.drawMap();

        // Expose for testing
        window.player = this.playerData;
        window.gameState = { state: this.gameState, wave: this.wave };
        const self = this;
        Object.defineProperty(window, 'enemies', { get: () => self.enemies, configurable: true });
        Object.defineProperty(window, 'items', { get: () => self.items, configurable: true });
    }

    generateLevel() {
        this.map = [];
        this.teleporters = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.map[y][x] = { terrain: TERRAIN.FLOOR, variant: (x + y) % 2 };
            }
        }

        // Border walls
        for (let x = 0; x < MAP_WIDTH; x++) {
            this.map[0][x] = { terrain: TERRAIN.WALL, variant: 0 };
            this.map[MAP_HEIGHT - 1][x] = { terrain: TERRAIN.WALL, variant: 0 };
        }
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y][0] = { terrain: TERRAIN.WALL, variant: 0 };
            this.map[y][MAP_WIDTH - 1] = { terrain: TERRAIN.WALL, variant: 0 };
        }

        // Main corridors
        const corridors = [
            { x1: 1, y1: 15, x2: MAP_WIDTH - 2, y2: 19 },
            { x1: 10, y1: 1, x2: 14, y2: MAP_HEIGHT - 2 },
            { x1: 25, y1: 1, x2: 29, y2: MAP_HEIGHT - 2 }
        ];

        for (const c of corridors) {
            for (let y = c.y1; y <= c.y2; y++) {
                for (let x = c.x1; x <= c.x2; x++) {
                    if (this.map[y] && this.map[y][x]) {
                        this.map[y][x] = { terrain: TERRAIN.FLOOR, variant: (x + y) % 2 };
                    }
                }
            }
        }

        // Rooms
        const rooms = [
            { x: 2, y: 2, w: 7, h: 7 },
            { x: 31, y: 2, w: 7, h: 7 },
            { x: 2, y: 26, w: 7, h: 7 },
            { x: 31, y: 26, w: 7, h: 7 },
            { x: 16, y: 2, w: 8, h: 6 },
            { x: 16, y: 27, w: 8, h: 6 },
            { x: 16, y: 12, w: 8, h: 10 }
        ];

        for (const room of rooms) {
            for (let dy = 0; dy < room.h; dy++) {
                for (let dx = 0; dx < room.w; dx++) {
                    const y = room.y + dy;
                    const x = room.x + dx;
                    if (this.map[y] && this.map[y][x]) {
                        this.map[y][x] = { terrain: TERRAIN.FLOOR, variant: (x + y) % 2 };
                    }
                }
            }
        }

        // Hazard floor stripes
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (x % 5 < 2) {
                if (this.map[15]) this.map[15][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
                if (this.map[19]) this.map[19][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
            }
        }

        // EXPAND: Add acid pools
        const acidPositions = [{ x: 4, y: 5 }, { x: 34, y: 5 }, { x: 4, y: 29 }, { x: 34, y: 29 }];
        for (const pos of acidPositions) {
            if (this.map[pos.y] && this.map[pos.y][pos.x]) {
                this.map[pos.y][pos.x] = { terrain: TERRAIN.ACID_POOL, variant: 0 };
            }
        }

        // EXPAND: Add explosive barrels
        const barrelPositions = [
            { x: 18, y: 4 }, { x: 22, y: 4 }, { x: 18, y: 30 }, { x: 22, y: 30 },
            { x: 5, y: 17 }, { x: 34, y: 17 }
        ];
        for (const pos of barrelPositions) {
            if (this.map[pos.y] && this.map[pos.y][pos.x]) {
                this.map[pos.y][pos.x] = { terrain: TERRAIN.EXPLOSIVE_BARREL, variant: 0 };
            }
        }

        // EXPAND: Add teleporters
        this.teleporters = [
            { x: 5, y: 5, targetX: 34, targetY: 29 },
            { x: 34, y: 5, targetX: 5, targetY: 29 },
            { x: 5, y: 29, targetX: 34, targetY: 5 },
            { x: 34, y: 29, targetX: 5, targetY: 5 }
        ];
        for (const tp of this.teleporters) {
            if (this.map[tp.y] && this.map[tp.y][tp.x]) {
                this.map[tp.y][tp.x] = { terrain: TERRAIN.TELEPORTER, variant: 0 };
            }
        }

        // EXPAND: Add shop terminal
        this.map[17][20] = { terrain: TERRAIN.SHOP, variant: 0 };

        // Add doors
        this.map[17][9] = { terrain: TERRAIN.DOOR, variant: 1, locked: false };
        this.map[17][30] = { terrain: TERRAIN.DOOR, variant: 1, locked: true };
        this.map[8][12] = { terrain: TERRAIN.DOOR, variant: 0, locked: false };
        this.map[26][12] = { terrain: TERRAIN.DOOR, variant: 0, locked: false };

        // Add vents
        const ventPositions = [
            { x: 3, y: 3 }, { x: 36, y: 3 }, { x: 3, y: 31 }, { x: 36, y: 31 },
            { x: 20, y: 3 }, { x: 20, y: 31 }
        ];
        for (const pos of ventPositions) {
            if (this.map[pos.y] && this.map[pos.y][pos.x]) {
                this.map[pos.y][pos.x] = { terrain: TERRAIN.VENT, variant: 0 };
            }
        }

        // Crates
        const cratePositions = [
            { x: 6, y: 4 }, { x: 33, y: 4 }, { x: 6, y: 28 }, { x: 33, y: 28 },
            { x: 12, y: 17 }, { x: 27, y: 17 }
        ];
        for (const pos of cratePositions) {
            if (this.map[pos.y] && this.map[pos.y][pos.x]) {
                this.map[pos.y][pos.x] = { terrain: TERRAIN.CRATE, variant: 0 };
            }
        }

        // Spawn enemies based on wave
        this.spawnWave();

        // Spawn items - more items for more exciting gameplay
        this.items = [];
        // Ammo scattered around
        this.items.push({ x: 150, y: 150, type: 'ammo', amount: 30 });
        this.items.push({ x: 1100, y: 150, type: 'ammo', amount: 30 });
        this.items.push({ x: 150, y: 950, type: 'ammo', amount: 30 });
        this.items.push({ x: 1100, y: 950, type: 'ammo', amount: 30 });
        this.items.push({ x: 640, y: 300, type: 'ammo', amount: 60 }); // Center ammo cache

        // Health packs
        this.items.push({ x: 600, y: 150, type: 'health', amount: 25 });
        this.items.push({ x: 200, y: 550, type: 'health', amount: 25 });
        this.items.push({ x: 1000, y: 550, type: 'health', amount: 25 });
        this.items.push({ x: 600, y: 900, type: 'health', amount: 50 }); // Big health pack

        // Credits (for shop)
        this.items.push({ x: 150, y: 600, type: 'credits', amount: 500 });
        this.items.push({ x: 1100, y: 600, type: 'credits', amount: 500 });
        this.items.push({ x: 640, y: 800, type: 'credits', amount: 1000 }); // Bonus credits

        // Armor
        this.items.push({ x: 600, y: 600, type: 'armor', amount: 20 });
        this.items.push({ x: 400, y: 200, type: 'armor', amount: 20 });
        this.items.push({ x: 900, y: 700, type: 'armor', amount: 30 });

        this.items.push({ x: 400, y: 300, type: 'keycard', color: 'yellow' });

        // EXPAND: Weapon pickups - more weapons available
        this.items.push({ x: 550, y: 170, type: 'weapon', weapon: 'shotgun' });
        this.items.push({ x: 700, y: 550, type: 'weapon', weapon: 'plasma_rifle' });
        this.items.push({ x: 250, y: 800, type: 'weapon', weapon: 'smg' });
        this.items.push({ x: 1050, y: 250, type: 'weapon', weapon: 'flamethrower' });

        // EXPAND: Power-ups - more scattered around
        this.items.push({ x: 300, y: 500, type: 'speedboost' });
        this.items.push({ x: 500, y: 200, type: 'damageboost' });
        this.items.push({ x: 800, y: 400, type: 'speedboost' });
        this.items.push({ x: 350, y: 750, type: 'damageboost' });

        this.bullets = [];
        this.particles = [];
        this.decals = [];
        this.floatingTexts = [];
    }

    // EXPAND: Wave spawning system
    spawnWave() {
        this.enemies = [];
        const waveConfig = this.getWaveConfig(this.wave);

        for (const spawn of waveConfig) {
            for (let i = 0; i < spawn.count; i++) {
                const spawnPoints = [
                    { x: 4, y: 4 }, { x: 35, y: 4 }, { x: 4, y: 30 }, { x: 35, y: 30 },
                    { x: 20, y: 4 }, { x: 20, y: 30 }
                ];
                const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                const stats = ENEMY_TYPES[spawn.type];

                this.enemies.push({
                    x: sp.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 50,
                    y: sp.y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 50,
                    type: spawn.type,
                    hp: stats.hp, maxHp: stats.hp,
                    speed: stats.speed,
                    damage: stats.damage,
                    xp: stats.xp,
                    color: stats.color,
                    size: stats.size,
                    state: 'patrol',
                    attackCooldown: 0,
                    angle: Math.random() * Math.PI * 2,
                    ranged: stats.ranged || false,
                    boss: stats.boss || false,
                    hitFlash: 0
                });

                // POLISH: Spawn particles
                for (let j = 0; j < 10; j++) {
                    this.particles.push({
                        x: sp.x * TILE_SIZE + TILE_SIZE / 2,
                        y: sp.y * TILE_SIZE + TILE_SIZE / 2,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        type: 'spawn',
                        life: 0.5
                    });
                }
            }
        }
    }

    getWaveConfig(wave) {
        // More enemies per wave for more action
        const configs = [
            [{ type: 'scorpion', count: 6 }, { type: 'scorpion_small', count: 4 }], // More exciting start
            [{ type: 'scorpion', count: 6 }, { type: 'scorpion_small', count: 4 }, { type: 'facehugger', count: 3 }],
            [{ type: 'scorpion', count: 5 }, { type: 'facehugger', count: 6 }, { type: 'spitter', count: 2 }],
            [{ type: 'arachnid', count: 3 }, { type: 'scorpion', count: 5 }, { type: 'scorpion_small', count: 4 }],
            [{ type: 'spitter', count: 3 }, { type: 'scorpion', count: 6 }, { type: 'facehugger', count: 4 }],
            [{ type: 'brute', count: 2 }, { type: 'scorpion', count: 6 }, { type: 'spitter', count: 2 }],
            [{ type: 'scorpion', count: 8 }, { type: 'facehugger', count: 8 }, { type: 'arachnid', count: 2 }],
            [{ type: 'arachnid', count: 4 }, { type: 'spitter', count: 4 }, { type: 'brute', count: 1 }],
            [{ type: 'brute', count: 3 }, { type: 'arachnid', count: 4 }, { type: 'scorpion', count: 4 }],
            [{ type: 'queen', count: 1 }, { type: 'brute', count: 2 }, { type: 'scorpion', count: 6 }]
        ];
        return configs[Math.min(wave - 1, configs.length - 1)];
    }

    drawMap() {
        this.mapGraphics.clear();

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = this.map[y][x];
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                this.drawTile(tile, screenX, screenY, x, y);
            }
        }
    }

    drawTile(tile, screenX, screenY, tileX, tileY) {
        switch (tile.terrain) {
            case TERRAIN.FLOOR:
                this.mapGraphics.fillStyle(tile.variant === 0 ? COLORS.FLOOR : COLORS.FLOOR_HEX);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(COLORS.FLOOR_GRATE);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, 8, 1);
                this.mapGraphics.fillRect(screenX + 20, screenY + 20, 8, 1);
                break;

            case TERRAIN.HAZARD_FLOOR:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                for (let i = 0; i < 8; i++) {
                    this.mapGraphics.fillStyle(COLORS.HAZARD_YELLOW);
                    this.mapGraphics.fillRect(screenX + i * 8, screenY + 2, 4, TILE_SIZE - 4);
                    this.mapGraphics.fillStyle(COLORS.HAZARD_BLACK);
                    this.mapGraphics.fillRect(screenX + i * 8 + 4, screenY + 2, 4, TILE_SIZE - 4);
                }
                break;

            case TERRAIN.WALL:
                this.mapGraphics.fillStyle(COLORS.WALL);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(COLORS.WALL_HIGHLIGHT);
                this.mapGraphics.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
                this.mapGraphics.fillRect(screenX + 2, screenY + 2, 2, TILE_SIZE - 4);
                this.mapGraphics.fillStyle(COLORS.WALL_SHADOW);
                this.mapGraphics.fillRect(screenX + 2, screenY + TILE_SIZE - 4, TILE_SIZE - 4, 2);
                this.mapGraphics.fillRect(screenX + TILE_SIZE - 4, screenY + 2, 2, TILE_SIZE - 4);
                if ((tileX + tileY) % 3 === 0) {
                    this.mapGraphics.fillStyle(COLORS.FLOOR_GRATE);
                    this.mapGraphics.fillRect(screenX + 8, screenY + 12, 16, 8);
                }
                break;

            case TERRAIN.DOOR:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(tile.locked ? COLORS.DOOR_LOCKED : COLORS.DOOR);
                if (tile.variant === 0) {
                    this.mapGraphics.fillRect(screenX, screenY + 10, TILE_SIZE, 12);
                } else {
                    this.mapGraphics.fillRect(screenX + 10, screenY, 12, TILE_SIZE);
                }
                this.mapGraphics.fillStyle(tile.locked ? 0xff0000 : 0x00ff00);
                this.mapGraphics.fillRect(screenX + 14, screenY + 14, 4, 4);
                break;

            case TERRAIN.VENT:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x1a1a1a);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                this.mapGraphics.fillStyle(0x333333);
                for (let i = 0; i < 4; i++) {
                    this.mapGraphics.fillRect(screenX + 6 + i * 6, screenY + 4, 2, TILE_SIZE - 8);
                }
                break;

            case TERRAIN.CRATE:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x5a4a30);
                this.mapGraphics.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                this.mapGraphics.fillStyle(0x4a3a20);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, 2);
                this.mapGraphics.fillRect(screenX + 4, screenY + TILE_SIZE - 8, TILE_SIZE - 8, 2);
                break;

            case TERRAIN.EXPLOSIVE_BARREL:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0xcc3333);
                this.mapGraphics.fillCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12);
                this.mapGraphics.fillStyle(COLORS.HAZARD_YELLOW);
                this.mapGraphics.fillRect(screenX + 10, screenY + 10, 12, 12);
                break;

            case TERRAIN.ACID_POOL:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x88ff00, 0.7);
                this.mapGraphics.fillEllipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 28, 24);
                break;

            case TERRAIN.TELEPORTER:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x00ffff, 0.4);
                this.mapGraphics.fillCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12);
                this.mapGraphics.lineStyle(2, 0x00ffff);
                this.mapGraphics.strokeCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 10);
                break;

            case TERRAIN.SHOP:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x444466);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                break;
        }
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        // Top-left: Rank/XP, Lives, Wave, Combo
        const topLeftBg = this.add.graphics();
        topLeftBg.fillStyle(COLORS.UI_BG, 1);
        topLeftBg.fillRect(10, 10, 140, 70);
        topLeftBg.lineStyle(2, COLORS.UI_BORDER);
        topLeftBg.strokeRect(10, 10, 140, 70);
        this.uiContainer.add(topLeftBg);

        this.rankText = this.add.text(18, 16, 'RANK 1', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cccc'
        });
        this.uiContainer.add(this.rankText);

        this.xpText = this.add.text(18, 30, 'XP: 0/1000', {
            fontSize: '10px', fontFamily: 'Arial', color: '#006666'
        });
        this.uiContainer.add(this.xpText);

        this.waveText = this.add.text(18, 44, 'WAVE 1', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cccc'
        });
        this.uiContainer.add(this.waveText);

        this.comboText = this.add.text(18, 58, '', {
            fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffff00'
        });
        this.uiContainer.add(this.comboText);

        this.livesText = this.add.text(100, 16, '', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#cc0000'
        });
        this.uiContainer.add(this.livesText);

        // Bottom-center: Health, Armor, Credits
        const bottomCenterBg = this.add.graphics();
        bottomCenterBg.fillStyle(COLORS.UI_BG, 1);
        bottomCenterBg.fillRect(200, this.scale.height - 60, 260, 50);
        bottomCenterBg.lineStyle(2, COLORS.UI_BORDER);
        bottomCenterBg.strokeRect(200, this.scale.height - 60, 260, 50);
        this.uiContainer.add(bottomCenterBg);

        this.healthBar = this.add.graphics();
        this.uiContainer.add(this.healthBar);

        this.creditsText = this.add.text(380, this.scale.height - 35, '$0', {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cccc'
        });
        this.uiContainer.add(this.creditsText);

        // Bottom-right: Weapon and Ammo
        const bottomRightBg = this.add.graphics();
        bottomRightBg.fillStyle(COLORS.UI_BG, 1);
        bottomRightBg.fillRect(this.scale.width - 160, this.scale.height - 70, 150, 60);
        bottomRightBg.lineStyle(2, COLORS.UI_BORDER);
        bottomRightBg.strokeRect(this.scale.width - 160, this.scale.height - 70, 150, 60);
        this.uiContainer.add(bottomRightBg);

        this.ammoText = this.add.text(this.scale.width - 150, this.scale.height - 55, '30 | 90', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cc00'
        });
        this.uiContainer.add(this.ammoText);

        this.weaponNameText = this.add.text(this.scale.width - 150, this.scale.height - 35, 'Assault Rifle', {
            fontSize: '10px', fontFamily: 'Arial', color: '#006666'
        });
        this.uiContainer.add(this.weaponNameText);

        this.weaponSlotsText = this.add.text(this.scale.width - 150, this.scale.height - 65, '1', {
            fontSize: '9px', fontFamily: 'Arial', color: '#00ffff'
        });
        this.uiContainer.add(this.weaponSlotsText);

        // Power-up indicators
        this.speedBoostText = this.add.text(10, this.scale.height - 30, '', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00ffff'
        });
        this.speedBoostText.setScrollFactor(0).setDepth(101);

        this.damageBoostText = this.add.text(10, this.scale.height - 15, '', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ff4400'
        });
        this.damageBoostText.setScrollFactor(0).setDepth(101);
    }

    updateUI() {
        this.rankText.setText(`RANK ${this.playerData.rank}`);
        this.xpText.setText(`XP: ${this.playerData.xp}/${this.playerData.xpToNext}`);
        this.waveText.setText(`WAVE ${this.wave}`);

        // Lives as hearts
        let livesStr = '';
        for (let i = 0; i < this.playerData.lives; i++) livesStr += '\u2665';
        this.livesText.setText(livesStr);

        // Combo
        if (this.combo > 0) {
            this.comboText.setText(`COMBO x${this.combo}`);
        } else {
            this.comboText.setText('');
        }

        // Health and armor bars
        this.healthBar.clear();
        this.healthBar.fillStyle(COLORS.HEALTH_BG, 1);
        this.healthBar.fillRect(210, this.scale.height - 52, 150, 12);
        this.healthBar.fillStyle(COLORS.HEALTH, 1);
        this.healthBar.fillRect(210, this.scale.height - 52, 150 * (this.playerData.hp / this.playerData.maxHp), 12);

        // Armor bar
        this.healthBar.fillStyle(0x001133, 1);
        this.healthBar.fillRect(210, this.scale.height - 38, 150, 8);
        this.healthBar.fillStyle(COLORS.ARMOR, 1);
        this.healthBar.fillRect(210, this.scale.height - 38, 150 * (this.playerData.armor / this.playerData.maxArmor), 8);

        this.creditsText.setText(`$${this.playerData.credits}`);

        // Ammo
        const weapon = WEAPONS[this.playerData.currentWeapon];
        const weaponData = this.playerData.weapons[this.playerData.currentWeapon];
        if (this.playerData.reloading) {
            this.ammoText.setText('RELOAD');
            this.ammoText.setColor('#ff8800');
        } else {
            this.ammoText.setText(`${weaponData?.clip || 0} | ${weaponData?.ammo || 0}`);
            this.ammoText.setColor('#00cc00');
        }
        this.weaponNameText.setText(weapon?.name || 'No Weapon');

        // Weapon slots
        const weaponKeys = Object.keys(this.playerData.weapons);
        let slotsStr = '';
        for (let i = 0; i < weaponKeys.length && i < 5; i++) {
            slotsStr += weaponKeys[i] === this.playerData.currentWeapon ? `[${i + 1}] ` : `${i + 1} `;
        }
        this.weaponSlotsText.setText(slotsStr);

        // Power-up indicators
        if (this.playerData.speedBoost > 0) {
            this.speedBoostText.setText(`SPEED: ${Math.ceil(this.playerData.speedBoost)}s`);
        } else {
            this.speedBoostText.setText('');
        }
        if (this.playerData.damageBoost > 0) {
            this.damageBoostText.setText(`DMG x2: ${Math.ceil(this.playerData.damageBoost)}s`);
        } else {
            this.damageBoostText.setText('');
        }
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        const dt = delta / 1000;
        this.tick++;
        this.ambientFlicker = Math.sin(this.tick * 0.1) * 0.05;

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateBullets(dt);
        this.updateParticles(dt);
        this.updateFloatingTexts(dt);
        this.updateUI();

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.combo = 0;
        }

        // Screen flash decay
        if (this.screenFlash > 0) this.screenFlash -= dt * 5;
        if (this.playerData.recoil > 0) this.playerData.recoil *= 0.8;

        // Check wave completion
        if (this.enemies.length === 0 && this.gameState === 'playing') {
            this.wave++;
            window.gameState.wave = this.wave;
            if (this.wave > 10) {
                this.gameState = 'victory';
                window.gameState.state = 'victory';
                this.showVictory();
            } else {
                this.spawnWave();
                this.floatingTexts.push({
                    x: this.player.x, y: this.player.y - 50,
                    text: `WAVE ${this.wave}`,
                    color: '#00ffff',
                    size: 24,
                    life: 2
                });
            }
        }

        // Check lose condition
        if (this.playerData.hp <= 0) {
            this.playerData.lives--;
            if (this.playerData.lives <= 0) {
                this.gameState = 'gameover';
                window.gameState.state = 'gameover';
                this.showGameOver();
            } else {
                this.playerData.hp = this.playerData.maxHp;
                this.player.x = 640;
                this.player.y = 544;
                this.playerData.invincible = 2;
                this.screenFlash = 1;
            }
        }

        // Redraw dynamic elements
        this.drawDynamicElements();
        this.cameras.main.centerOn(this.player.x, this.player.y);
    }

    updatePlayer(dt) {
        let dx = 0, dy = 0;

        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        // EXPAND: Speed boost effect
        const speed = 120 * (this.playerData.speedBoost > 0 ? 1.5 : 1);
        if (this.playerData.speedBoost > 0) this.playerData.speedBoost -= dt;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;

            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            if (this.canMove(newX, this.player.y, 20, 20)) this.player.x = newX;
            if (this.canMove(this.player.x, newY, 20, 20)) this.player.y = newY;

            // POLISH: Footstep particles
            if (this.tick % 10 === 0) {
                this.particles.push({
                    x: this.player.x, y: this.player.y + 10,
                    vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
                    type: 'dust', life: 0.3
                });
            }
        }

        // Update mouse position from active pointer (always track, not just on event)
        const pointer = this.input.activePointer;
        this.mouseX = pointer.worldX;
        this.mouseY = pointer.worldY;

        // Aim at mouse
        this.playerAngle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);

        // Check tile interactions
        const tileX = Math.floor(this.player.x / TILE_SIZE);
        const tileY = Math.floor(this.player.y / TILE_SIZE);
        const tile = this.map[tileY]?.[tileX];

        // EXPAND: Acid damage
        if (tile?.terrain === TERRAIN.ACID_POOL && this.playerData.invincible <= 0) {
            this.playerData.hp -= 10 * dt;
            if (this.tick % 5 === 0) {
                this.particles.push({
                    x: this.player.x, y: this.player.y,
                    vx: (Math.random() - 0.5) * 50, vy: -Math.random() * 50,
                    type: 'acid', life: 0.3
                });
            }
        }

        // EXPAND: Teleporter
        if (tile?.terrain === TERRAIN.TELEPORTER) {
            for (const tp of this.teleporters) {
                if (Math.floor(tp.x) === tileX && Math.floor(tp.y) === tileY) {
                    this.player.x = tp.targetX * TILE_SIZE + TILE_SIZE / 2;
                    this.player.y = tp.targetY * TILE_SIZE + TILE_SIZE / 2;
                    this.screenFlash = 0.5;
                    for (let i = 0; i < 20; i++) {
                        this.particles.push({
                            x: this.player.x, y: this.player.y,
                            vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                            type: 'teleport', life: 0.5
                        });
                    }
                    break;
                }
            }
        }

        // Weapon switching
        const weaponKeys = Object.keys(this.playerData.weapons);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.one) && weaponKeys[0]) {
            this.playerData.currentWeapon = weaponKeys[0];
            this.playerData.reloading = false;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.two) && weaponKeys[1]) {
            this.playerData.currentWeapon = weaponKeys[1];
            this.playerData.reloading = false;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.three) && weaponKeys[2]) {
            this.playerData.currentWeapon = weaponKeys[2];
            this.playerData.reloading = false;
        }

        // Shooting
        const weapon = WEAPONS[this.playerData.currentWeapon];
        const weaponData = this.playerData.weapons[this.playerData.currentWeapon];

        if (this.mouseDown && this.playerData.cooldown <= 0 && !this.playerData.reloading) {
            if (weaponData && weaponData.clip > 0) {
                this.shoot();
                this.playerData.cooldown = 1 / weapon.fireRate;
                weaponData.clip--;
                this.playerData.recoil = 5;

                if (weaponData.clip === 0 && weaponData.ammo > 0) {
                    this.startReload();
                }
            } else if (weaponData && weaponData.ammo > 0) {
                this.startReload();
            }
        }

        if (this.playerData.cooldown > 0) this.playerData.cooldown -= dt;

        // Reload key
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload) && weaponData &&
            !this.playerData.reloading && weaponData.clip < weapon.clipSize && weaponData.ammo > 0) {
            this.startReload();
        }

        if (this.playerData.reloading) {
            this.playerData.reloadTime -= dt;
            if (this.playerData.reloadTime <= 0) {
                const needed = weapon.clipSize - weaponData.clip;
                const reload = Math.min(needed, weaponData.ammo);
                weaponData.clip += reload;
                weaponData.ammo -= reload;
                this.playerData.reloading = false;
            }
        }

        // EXPAND: Damage boost decay
        if (this.playerData.damageBoost > 0) this.playerData.damageBoost -= dt;

        // Interact with items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 24) {
                this.pickupItem(item);
                this.items.splice(i, 1);
            }
        }

        if (this.playerData.invincible > 0) this.playerData.invincible -= dt;
    }

    startReload() {
        const weapon = WEAPONS[this.playerData.currentWeapon];
        this.playerData.reloading = true;
        this.playerData.reloadTime = weapon.reloadTime;
    }

    shoot() {
        const weapon = WEAPONS[this.playerData.currentWeapon];
        const damageMultiplier = this.playerData.damageBoost > 0 ? 2 : 1;

        for (let i = 0; i < weapon.projectiles; i++) {
            const spread = weapon.spread;
            const angle = this.playerAngle + (Math.random() - 0.5) * spread;

            this.bullets.push({
                x: this.player.x + Math.cos(this.playerAngle) * 15,
                y: this.player.y + Math.sin(this.playerAngle) * 15,
                vx: Math.cos(angle) * weapon.speed,
                vy: Math.sin(angle) * weapon.speed,
                damage: weapon.damage * damageMultiplier,
                owner: 'player',
                life: 2,
                color: weapon.color,
                piercing: weapon.piercing || false
            });
        }

        // Muzzle flash
        this.particles.push({
            x: this.player.x + Math.cos(this.playerAngle) * 20,
            y: this.player.y + Math.sin(this.playerAngle) * 20,
            type: 'muzzle',
            life: 0.1,
            size: weapon.projectiles > 1 ? 12 : 8
        });

        // POLISH: Shell casing
        if (!weapon.piercing) {
            this.particles.push({
                x: this.player.x, y: this.player.y,
                vx: Math.cos(this.playerAngle + Math.PI / 2) * 50 + (Math.random() - 0.5) * 20,
                vy: Math.sin(this.playerAngle + Math.PI / 2) * 50 - 30,
                type: 'shell', life: 0.5
            });
        }

        this.cameras.main.shake(50, weapon.projectiles > 1 ? 0.004 : 0.002);
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

            // POLISH: Hit flash decay
            if (enemy.hitFlash > 0) enemy.hitFlash -= dt * 5;

            if (enemy.state === 'patrol') {
                enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3 * dt;
                enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3 * dt;

                if (Math.random() < 0.01) {
                    enemy.angle += (Math.random() - 0.5) * Math.PI;
                }

                if (dist < (enemy.boss ? 300 : 150)) {
                    enemy.state = 'chase';
                    // POLISH: Detection visual
                    this.particles.push({
                        x: enemy.x, y: enemy.y - 20,
                        type: 'alert', life: 0.5
                    });
                }
            } else if (enemy.state === 'chase') {
                const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                enemy.angle = angle;

                // EXPAND: Ranged enemies
                if (enemy.ranged && dist > 100 && dist < 250 && enemy.attackCooldown <= 0) {
                    this.bullets.push({
                        x: enemy.x, y: enemy.y,
                        vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200,
                        damage: 15, owner: 'enemy', life: 2, color: COLORS.ACID
                    });
                    enemy.attackCooldown = 2;
                } else if (!enemy.ranged || dist < 100) {
                    const newX = enemy.x + Math.cos(angle) * enemy.speed * dt;
                    const newY = enemy.y + Math.sin(angle) * enemy.speed * dt;

                    if (this.canMove(newX, enemy.y, enemy.size * 2, enemy.size * 2)) enemy.x = newX;
                    if (this.canMove(enemy.x, newY, enemy.size * 2, enemy.size * 2)) enemy.y = newY;
                }

                // Melee attack
                if (dist < enemy.size + 15 && enemy.attackCooldown <= 0 && this.playerData.invincible <= 0 && !enemy.ranged) {
                    let damage = enemy.damage;
                    if (this.playerData.armor > 0) {
                        const armorAbsorb = Math.min(this.playerData.armor, damage * 0.5);
                        this.playerData.armor -= armorAbsorb;
                        damage -= armorAbsorb;
                    }
                    this.playerData.hp -= damage;
                    enemy.attackCooldown = 1;
                    this.cameras.main.shake(100, 0.008);
                    this.screenFlash = 0.3;

                    for (let i = 0; i < 8; i++) {
                        this.particles.push({
                            x: this.player.x, y: this.player.y,
                            vx: (Math.random() - 0.5) * 150, vy: (Math.random() - 0.5) * 150,
                            type: 'blood', life: 0.5
                        });
                    }
                }

                if (dist > (enemy.boss ? 500 : 300)) {
                    enemy.state = 'patrol';
                }
            }

            if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

            // Keep in bounds
            const tileX = Math.floor(enemy.x / TILE_SIZE);
            const tileY = Math.floor(enemy.y / TILE_SIZE);
            if (tileX < 1 || tileX >= MAP_WIDTH - 1 || tileY < 1 || tileY >= MAP_HEIGHT - 1) {
                enemy.angle += Math.PI;
            }
        }
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.life -= dt;

            // POLISH: Smoke trail for fire bullets
            if (bullet.color === COLORS.FIRE && this.tick % 2 === 0) {
                this.particles.push({
                    x: bullet.x, y: bullet.y,
                    vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
                    type: 'smoke', life: 0.3
                });
            }

            const tileX = Math.floor(bullet.x / TILE_SIZE);
            const tileY = Math.floor(bullet.y / TILE_SIZE);
            if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
                this.bullets.splice(i, 1);
                continue;
            }

            const tile = this.map[tileY]?.[tileX];

            // EXPAND: Explosive barrels
            if (tile?.terrain === TERRAIN.EXPLOSIVE_BARREL) {
                this.explodeBarrel(tileX, tileY);
                this.bullets.splice(i, 1);
                continue;
            }

            if (tile && (tile.terrain === TERRAIN.WALL || tile.terrain === TERRAIN.CRATE)) {
                this.particles.push({ x: bullet.x, y: bullet.y, type: 'spark', life: 0.2 });
                this.bullets.splice(i, 1);
                continue;
            }

            // Player bullet hitting enemy
            if (bullet.owner === 'player') {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.size + 5) {
                        enemy.hp -= bullet.damage;
                        enemy.state = 'chase';
                        enemy.hitFlash = 1;

                        // POLISH: Damage numbers
                        this.floatingTexts.push({
                            x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y - 20,
                            text: Math.floor(bullet.damage).toString(),
                            color: '#ffff00', size: bullet.damage > 20 ? 16 : 12,
                            life: 0.8, vy: -50
                        });

                        for (let k = 0; k < 4; k++) {
                            this.particles.push({
                                x: enemy.x, y: enemy.y,
                                vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
                                type: 'alienblood', life: 0.4
                            });
                        }

                        // POLISH: Blood decal
                        this.decals.push({
                            x: enemy.x + (Math.random() - 0.5) * 10,
                            y: enemy.y + (Math.random() - 0.5) * 10,
                            size: 5 + Math.random() * 5,
                            color: COLORS.BLOOD, alpha: 0.6
                        });

                        if (enemy.hp <= 0) {
                            // EXPAND: Combo system
                            this.combo++;
                            this.comboTimer = 3;
                            const xpGain = enemy.xp * (1 + this.combo * 0.1);
                            this.playerData.xp += xpGain;
                            this.playerData.credits += Math.floor(Math.random() * 50) + 10;
                            this.killCount++;

                            // Rank up
                            if (this.playerData.xp >= this.playerData.xpToNext) {
                                this.playerData.rank++;
                                this.playerData.xp -= this.playerData.xpToNext;
                                this.playerData.xpToNext = Math.floor(this.playerData.xpToNext * 1.5);
                                this.screenFlash = 0.5;
                                this.floatingTexts.push({
                                    x: this.player.x, y: this.player.y - 40,
                                    text: 'RANK UP!', color: '#00ffff', size: 20, life: 1.5
                                });
                            }

                            // Death particles
                            for (let k = 0; k < (enemy.boss ? 30 : 10); k++) {
                                this.particles.push({
                                    x: enemy.x, y: enemy.y,
                                    vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                                    type: enemy.boss ? 'explosion' : 'alienblood',
                                    life: enemy.boss ? 0.8 : 0.5
                                });
                            }

                            // Item drop
                            if (Math.random() < 0.3) {
                                this.items.push({
                                    x: enemy.x, y: enemy.y,
                                    type: Math.random() < 0.5 ? 'ammo' : 'health',
                                    amount: Math.random() < 0.5 ? 15 : 10
                                });
                            }

                            this.enemies.splice(j, 1);
                        }

                        if (!bullet.piercing) {
                            this.bullets.splice(i, 1);
                        }
                        break;
                    }
                }
            }

            // Enemy bullet hitting player
            if (bullet.owner === 'enemy') {
                if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y) < 15 &&
                    this.playerData.invincible <= 0) {
                    let damage = bullet.damage;
                    if (this.playerData.armor > 0) {
                        const armorAbsorb = Math.min(this.playerData.armor, damage * 0.5);
                        this.playerData.armor -= armorAbsorb;
                        damage -= armorAbsorb;
                    }
                    this.playerData.hp -= damage;
                    this.cameras.main.shake(80, 0.005);
                    this.screenFlash = 0.3;
                    this.bullets.splice(i, 1);
                    continue;
                }
            }

            if (bullet.life <= 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    // EXPAND: Explosive barrel function
    explodeBarrel(tileX, tileY) {
        const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
        const cy = tileY * TILE_SIZE + TILE_SIZE / 2;

        this.map[tileY][tileX] = { terrain: TERRAIN.FLOOR, variant: 0 };
        this.drawMap();

        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
                type: 'explosion', life: 0.6
            });
        }

        this.cameras.main.shake(150, 0.015);

        // Damage nearby enemies
        for (const enemy of this.enemies) {
            const dist = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
            if (dist < 100) {
                enemy.hp -= 50 * (1 - dist / 100);
                enemy.hitFlash = 1;
            }
        }

        // Damage player
        const playerDist = Phaser.Math.Distance.Between(cx, cy, this.player.x, this.player.y);
        if (playerDist < 100 && this.playerData.invincible <= 0) {
            this.playerData.hp -= 30 * (1 - playerDist / 100);
            this.screenFlash = 0.5;
        }

        // Chain reaction
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = tileX + dx;
                const ny = tileY + dy;
                if (this.map[ny]?.[nx]?.terrain === TERRAIN.EXPLOSIVE_BARREL) {
                    this.time.delayedCall(100, () => this.explodeBarrel(nx, ny));
                }
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.vx !== undefined) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.95;
                p.vy *= 0.95;
                if (p.type === 'shell') p.vy += 200 * dt;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Limit decals
        if (this.decals.length > 100) {
            this.decals.splice(0, 10);
        }
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            if (ft.vy) ft.y += ft.vy * dt;

            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    pickupItem(item) {
        const weaponData = this.playerData.weapons[this.playerData.currentWeapon];

        // POLISH: Pickup particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: item.x, y: item.y,
                vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
                type: 'pickup', life: 0.3
            });
        }

        switch (item.type) {
            case 'ammo':
                if (weaponData) weaponData.ammo = Math.min(300, weaponData.ammo + item.amount);
                break;
            case 'health':
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + item.amount);
                break;
            case 'armor':
                this.playerData.armor = Math.min(this.playerData.maxArmor, this.playerData.armor + item.amount);
                break;
            case 'credits':
                this.playerData.credits += item.amount;
                break;
            case 'keycard':
                for (let y = 0; y < MAP_HEIGHT; y++) {
                    for (let x = 0; x < MAP_WIDTH; x++) {
                        if (this.map[y][x].terrain === TERRAIN.DOOR && this.map[y][x].locked) {
                            this.map[y][x].locked = false;
                        }
                    }
                }
                this.drawMap();
                this.floatingTexts.push({
                    x: this.player.x, y: this.player.y - 30,
                    text: 'DOORS UNLOCKED', color: '#ffff00', size: 14, life: 1.5
                });
                break;
            case 'weapon':
                if (!this.playerData.weapons[item.weapon]) {
                    this.playerData.weapons[item.weapon] = {
                        ammo: WEAPONS[item.weapon].clipSize * 3,
                        clip: WEAPONS[item.weapon].clipSize
                    };
                    this.floatingTexts.push({
                        x: this.player.x, y: this.player.y - 30,
                        text: `GOT ${WEAPONS[item.weapon].name.toUpperCase()}`,
                        color: '#00ff00', size: 14, life: 1.5
                    });
                }
                break;
            case 'speedboost':
                this.playerData.speedBoost = 10;
                this.floatingTexts.push({
                    x: this.player.x, y: this.player.y - 30,
                    text: 'SPEED BOOST!', color: '#00ffff', size: 14, life: 1
                });
                break;
            case 'damageboost':
                this.playerData.damageBoost = 10;
                this.floatingTexts.push({
                    x: this.player.x, y: this.player.y - 30,
                    text: 'DAMAGE BOOST!', color: '#ff0000', size: 14, life: 1
                });
                break;
        }
    }

    canMove(x, y, w, h) {
        const margin = 2;
        const tiles = [
            { x: Math.floor((x - w / 2 + margin) / TILE_SIZE), y: Math.floor((y - h / 2 + margin) / TILE_SIZE) },
            { x: Math.floor((x + w / 2 - margin) / TILE_SIZE), y: Math.floor((y - h / 2 + margin) / TILE_SIZE) },
            { x: Math.floor((x - w / 2 + margin) / TILE_SIZE), y: Math.floor((y + h / 2 - margin) / TILE_SIZE) },
            { x: Math.floor((x + w / 2 - margin) / TILE_SIZE), y: Math.floor((y + h / 2 - margin) / TILE_SIZE) }
        ];

        for (const tile of tiles) {
            if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) return false;
            const t = this.map[tile.y][tile.x];
            if (t.terrain === TERRAIN.WALL || t.terrain === TERRAIN.CRATE ||
                t.terrain === TERRAIN.EXPLOSIVE_BARREL || (t.terrain === TERRAIN.DOOR && t.locked)) {
                return false;
            }
        }
        return true;
    }

    drawDynamicElements() {
        this.flashlightGraphics.clear();

        // POLISH: Screen flash
        if (this.screenFlash > 0) {
            this.flashlightGraphics.fillStyle(0xffffff, this.screenFlash * 0.3);
            this.flashlightGraphics.fillRect(
                this.cameras.main.scrollX,
                this.cameras.main.scrollY,
                this.scale.width,
                this.scale.height
            );
        }

        // Draw decals
        for (const decal of this.decals) {
            this.flashlightGraphics.fillStyle(decal.color, decal.alpha);
            this.flashlightGraphics.fillCircle(decal.x, decal.y, decal.size);
        }

        // Draw items
        for (const item of this.items) {
            const pulse = Math.sin(this.tick * 0.1) * 0.3 + 0.7;

            switch (item.type) {
                case 'ammo':
                    this.flashlightGraphics.fillStyle(0x00c800, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(COLORS.AMMO, 1);
                    this.flashlightGraphics.fillRect(item.x - 6, item.y - 4, 12, 8);
                    break;

                case 'health':
                    this.flashlightGraphics.fillStyle(0xc80000, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(0xcc0000, 1);
                    this.flashlightGraphics.fillRect(item.x - 6, item.y - 2, 12, 4);
                    this.flashlightGraphics.fillRect(item.x - 2, item.y - 6, 4, 12);
                    break;

                case 'armor':
                    this.flashlightGraphics.fillStyle(0x0064c8, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(COLORS.ARMOR, 1);
                    this.flashlightGraphics.fillTriangle(
                        item.x, item.y - 8,
                        item.x + 6, item.y,
                        item.x - 6, item.y
                    );
                    break;

                case 'credits':
                    this.flashlightGraphics.fillStyle(0xc8c800, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(0xcccc00, 1);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 6);
                    break;

                case 'keycard':
                    this.flashlightGraphics.fillStyle(0xc8c800, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 15);
                    this.flashlightGraphics.fillStyle(0xccaa00, 1);
                    this.flashlightGraphics.fillRect(item.x - 8, item.y - 5, 16, 10);
                    break;

                case 'weapon':
                    this.flashlightGraphics.fillStyle(0x6464ff, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 15);
                    this.flashlightGraphics.fillStyle(0x666688, 1);
                    this.flashlightGraphics.fillRect(item.x - 10, item.y - 3, 20, 6);
                    break;

                case 'speedboost':
                    this.flashlightGraphics.fillStyle(0x00ffff, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(0x00ffff, 1);
                    this.flashlightGraphics.fillTriangle(
                        item.x - 4, item.y - 6,
                        item.x + 6, item.y,
                        item.x - 4, item.y + 6
                    );
                    break;

                case 'damageboost':
                    this.flashlightGraphics.fillStyle(0xff0000, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(0xff4400, 1);
                    this.flashlightGraphics.fillRect(item.x - 6, item.y - 3, 12, 6);
                    break;
            }
        }

        // Draw bullets
        for (const bullet of this.bullets) {
            this.flashlightGraphics.fillStyle(bullet.color, 1);
            this.flashlightGraphics.fillCircle(bullet.x, bullet.y, bullet.color === COLORS.PLASMA ? 4 : 3);
            this.flashlightGraphics.fillStyle(bullet.color, 0.5);
            this.flashlightGraphics.fillCircle(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02, 2);
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            // Shadow
            this.flashlightGraphics.fillStyle(0x000000, 0.4);
            this.flashlightGraphics.fillEllipse(enemy.x, enemy.y + enemy.size, enemy.size * 2, enemy.size * 0.8);

            // POLISH: Hit flash effect
            const flashColor = enemy.hitFlash > 0 ? 0xffffff : enemy.color;
            this.flashlightGraphics.fillStyle(flashColor, 1);

            if (enemy.boss) {
                this.flashlightGraphics.fillEllipse(enemy.x, enemy.y, enemy.size * 2, enemy.size * 1.6);
                // Crown
                this.flashlightGraphics.fillStyle(0xffcc00, 1);
                this.flashlightGraphics.fillTriangle(
                    enemy.x - 15, enemy.y - enemy.size,
                    enemy.x - 10, enemy.y - enemy.size - 10,
                    enemy.x, enemy.y - enemy.size
                );
                this.flashlightGraphics.fillTriangle(
                    enemy.x, enemy.y - enemy.size,
                    enemy.x + 10, enemy.y - enemy.size - 10,
                    enemy.x + 15, enemy.y - enemy.size
                );
            } else if (enemy.type === 'arachnid' || enemy.type === 'brute') {
                this.flashlightGraphics.fillEllipse(enemy.x, enemy.y, enemy.size * 2, enemy.size * 1.6);
                // Legs
                this.flashlightGraphics.lineStyle(enemy.type === 'brute' ? 4 : 2, flashColor);
                for (let i = 0; i < 4; i++) {
                    const legAngle = enemy.angle + (i * Math.PI / 2) - Math.PI / 4;
                    this.flashlightGraphics.lineBetween(
                        enemy.x, enemy.y,
                        enemy.x + Math.cos(legAngle) * enemy.size * 1.2,
                        enemy.y + Math.sin(legAngle) * enemy.size * 1.2
                    );
                }
            } else if (enemy.type === 'spitter') {
                this.flashlightGraphics.fillEllipse(enemy.x, enemy.y, enemy.size * 2, enemy.size * 1.4);
                this.flashlightGraphics.fillStyle(COLORS.ACID, 1);
                this.flashlightGraphics.fillCircle(enemy.x - Math.cos(enemy.angle) * 5, enemy.y - Math.sin(enemy.angle) * 5, 5);
            } else {
                this.flashlightGraphics.fillEllipse(enemy.x, enemy.y, enemy.size * 2, enemy.size * 1.6);
                // Tail
                this.flashlightGraphics.lineStyle(enemy.size * 0.3, flashColor);
                const tailX = enemy.x - Math.cos(enemy.angle) * enemy.size;
                const tailY = enemy.y - Math.sin(enemy.angle) * enemy.size;
                this.flashlightGraphics.lineBetween(enemy.x, enemy.y, tailX, tailY);
            }

            // Eyes
            this.flashlightGraphics.fillStyle(COLORS.ALIEN_EYES, 1);
            const eyeOffset = enemy.size * 0.5;
            this.flashlightGraphics.fillCircle(enemy.x + Math.cos(enemy.angle) * eyeOffset - 2, enemy.y + Math.sin(enemy.angle) * eyeOffset - 2, enemy.boss ? 4 : 2);
            this.flashlightGraphics.fillCircle(enemy.x + Math.cos(enemy.angle) * eyeOffset + 2, enemy.y + Math.sin(enemy.angle) * eyeOffset + 2, enemy.boss ? 4 : 2);

            // Health bar
            if (enemy.hp < enemy.maxHp) {
                const barWidth = enemy.size * 2.4;
                this.flashlightGraphics.fillStyle(0x330000, 1);
                this.flashlightGraphics.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth, 4);
                this.flashlightGraphics.fillStyle(enemy.boss ? 0xff8800 : 0xcc0000, 1);
                this.flashlightGraphics.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth * (enemy.hp / enemy.maxHp), 4);
            }
        }

        // Draw particles
        for (const p of this.particles) {
            switch (p.type) {
                case 'muzzle':
                    this.flashlightGraphics.fillStyle(COLORS.MUZZLE_FLASH, p.life * 10);
                    this.flashlightGraphics.fillCircle(p.x, p.y, p.size || 6);
                    break;
                case 'blood':
                    this.flashlightGraphics.fillStyle(0xc80000, p.life * 2);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'alienblood':
                    this.flashlightGraphics.fillStyle(0x448844, p.life * 2.5);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'spark':
                    this.flashlightGraphics.fillStyle(0xffc864, p.life * 5);
                    this.flashlightGraphics.fillRect(p.x - 2, p.y - 2, 4, 4);
                    break;
                case 'shell':
                    this.flashlightGraphics.fillStyle(0xc8b464, p.life * 2);
                    this.flashlightGraphics.fillRect(p.x - 2, p.y - 1, 4, 2);
                    break;
                case 'smoke':
                    this.flashlightGraphics.fillStyle(0x646464, p.life);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 5);
                    break;
                case 'explosion':
                    this.flashlightGraphics.fillStyle(0xff6400 + Math.floor(Math.random() * 0x6400), p.life);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 5 + (1 - p.life) * 10);
                    break;
                case 'spawn':
                    this.flashlightGraphics.fillStyle(0x64ff64, p.life * 2);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'acid':
                    this.flashlightGraphics.fillStyle(0x88ff00, p.life * 3);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'teleport':
                    this.flashlightGraphics.fillStyle(0x00ffff, p.life * 2);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'dust':
                    this.flashlightGraphics.fillStyle(0x646450, p.life * 2);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 2);
                    break;
                case 'pickup':
                    this.flashlightGraphics.fillStyle(0xffffff, p.life * 3);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'alert':
                    // Would need text for this, skip for now
                    this.flashlightGraphics.fillStyle(0xff0000, p.life * 2);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 4);
                    break;
            }
        }

        // Draw floating texts
        for (const ft of this.floatingTexts) {
            // Can't draw text in graphics, would need Text objects
        }

        // Draw player
        this.player.clear();

        if (this.playerData.invincible > 0 && Math.floor(this.playerData.invincible * 10) % 2 === 0) {
            return;
        }

        // Shadow
        this.player.fillStyle(0x000000, 0.4);
        this.player.fillEllipse(0, 8, 20, 8);

        // Body with rotation
        const cos = Math.cos(this.playerAngle);
        const sin = Math.sin(this.playerAngle);

        // Color based on boosts
        let playerColor = COLORS.PLAYER;
        if (this.playerData.damageBoost > 0) playerColor = 0xff6666;
        else if (this.playerData.speedBoost > 0) playerColor = 0x66ffff;

        this.player.fillStyle(playerColor, 1);
        this.drawRotatedRect(this.player, 0, 0, 16, 20, this.playerAngle);

        // Weapon
        this.player.fillStyle(0x555555, 1);
        const weaponX = cos * (10 - this.playerData.recoil);
        const weaponY = sin * (10 - this.playerData.recoil);

        if (this.playerData.currentWeapon === 'shotgun') {
            this.drawRotatedRect(this.player, weaponX, weaponY, 18, 8, this.playerAngle);
        } else if (this.playerData.currentWeapon === 'flamethrower') {
            this.drawRotatedRect(this.player, weaponX, weaponY, 20, 10, this.playerAngle);
        } else {
            this.drawRotatedRect(this.player, weaponX, weaponY, 15, 6, this.playerAngle);
        }

        // Visor
        this.player.fillStyle(0x00aaaa, 1);
        const visorX = cos * 4 - sin * 2;
        const visorY = sin * 4 + cos * 2;
        this.player.fillCircle(visorX, visorY, 3);

        // Laser sight
        this.flashlightGraphics.lineStyle(1, 0xff0000, 0.5);
        this.flashlightGraphics.lineBetween(
            this.player.x, this.player.y,
            this.player.x + Math.cos(this.playerAngle) * 200,
            this.player.y + Math.sin(this.playerAngle) * 200
        );

        // Flashlight cone
        this.flashlightGraphics.fillStyle(0xc8c896, 0.1);
        this.flashlightGraphics.beginPath();
        this.flashlightGraphics.moveTo(this.player.x, this.player.y);
        const coneAngle = 0.4;
        const coneLength = 200;
        for (let a = -coneAngle; a <= coneAngle; a += 0.1) {
            const angle = this.playerAngle + a;
            this.flashlightGraphics.lineTo(
                this.player.x + Math.cos(angle) * coneLength,
                this.player.y + Math.sin(angle) * coneLength
            );
        }
        this.flashlightGraphics.closePath();
        this.flashlightGraphics.fillPath();

        // Draw minimap
        this.drawMinimap();
    }

    // POLISH: Minimap
    drawMinimap() {
        const mapSize = 120;
        const mapX = this.cameras.main.scrollX + this.scale.width - mapSize - 10;
        const mapY = this.cameras.main.scrollY + 10;
        const scale = mapSize / (MAP_WIDTH * TILE_SIZE);

        this.flashlightGraphics.fillStyle(0x000000, 0.7);
        this.flashlightGraphics.fillRect(mapX, mapY, mapSize, mapSize * (MAP_HEIGHT / MAP_WIDTH));

        this.flashlightGraphics.lineStyle(1, COLORS.UI_BORDER);
        this.flashlightGraphics.strokeRect(mapX, mapY, mapSize, mapSize * (MAP_HEIGHT / MAP_WIDTH));

        // Walls
        this.flashlightGraphics.fillStyle(0x444444, 1);
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.map[y][x].terrain === TERRAIN.WALL) {
                    this.flashlightGraphics.fillRect(mapX + x * scale * TILE_SIZE, mapY + y * scale * TILE_SIZE, 2, 2);
                }
            }
        }

        // Enemies
        this.flashlightGraphics.fillStyle(0xff0000, 1);
        for (const enemy of this.enemies) {
            this.flashlightGraphics.fillRect(mapX + enemy.x * scale - 1, mapY + enemy.y * scale - 1, enemy.boss ? 4 : 2, enemy.boss ? 4 : 2);
        }

        // Player
        this.flashlightGraphics.fillStyle(0x00ff00, 1);
        this.flashlightGraphics.fillRect(mapX + this.player.x * scale - 2, mapY + this.player.y * scale - 2, 4, 4);
    }

    drawRotatedRect(graphics, x, y, width, height, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hw = width / 2;
        const hh = height / 2;

        const points = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh }
        ];

        const rotated = points.map(p => ({
            x: x + p.x * cos - p.y * sin,
            y: y + p.x * sin + p.y * cos
        }));

        graphics.beginPath();
        graphics.moveTo(rotated[0].x, rotated[0].y);
        for (let i = 1; i < rotated.length; i++) {
            graphics.lineTo(rotated[i].x, rotated[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
    }

    showGameOver() {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        overlay.setDepth(200);

        const gameOverText = this.add.text(this.cameras.main.scrollX + this.scale.width / 2,
            this.cameras.main.scrollY + this.scale.height / 2 - 40, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#cc0000'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(this.cameras.main.scrollX + this.scale.width / 2,
            this.cameras.main.scrollY + this.scale.height / 2,
            `Wave: ${this.wave} | Kills: ${this.killCount} | Rank: ${this.playerData.rank}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#00cccc'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(this.cameras.main.scrollX + this.scale.width / 2,
            this.cameras.main.scrollY + this.scale.height / 2 + 40, 'Press R to Restart', {
            fontSize: '18px', fontFamily: 'Arial', color: '#00cccc'
        }).setOrigin(0.5).setDepth(201);
    }

    showVictory() {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        overlay.setDepth(200);

        const victoryText = this.add.text(this.cameras.main.scrollX + this.scale.width / 2,
            this.cameras.main.scrollY + this.scale.height / 2 - 40, 'VICTORY!', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00ff00'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(this.cameras.main.scrollX + this.scale.width / 2,
            this.cameras.main.scrollY + this.scale.height / 2,
            `All Waves Cleared! | Kills: ${this.killCount} | Rank: ${this.playerData.rank}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#00cccc'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(this.cameras.main.scrollX + this.scale.width / 2,
            this.cameras.main.scrollY + this.scale.height / 2 + 40, 'Press R to Play Again', {
            fontSize: '18px', fontFamily: 'Arial', color: '#00cccc'
        }).setOrigin(0.5).setDepth(201);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    canvas: document.createElement('canvas'),
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

document.body.appendChild(config.canvas);
const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
