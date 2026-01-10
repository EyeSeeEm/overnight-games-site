// Quasimorph Clone - Turn-based Tactical Extraction Horror
// Built with Phaser 3

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 608;

// Tile types
const TILE = {
    FLOOR: 0,
    WALL: 1,
    DOOR_CLOSED: 2,
    DOOR_OPEN: 3,
    COVER_HALF: 4,
    COVER_FULL: 5,
    VENT: 6,
    EXTRACTION: 7,
    HAZARD_FIRE: 8,
    LOOT: 9
};

// Colors matching Quasimorph palette - darker with rust/brown tones
const COLORS = {
    BG: 0x080810,
    FLOOR_DARK: 0x1c1c28,
    FLOOR_LIGHT: 0x2a2834,
    FLOOR_GRATE: 0x242430,
    FLOOR_LINE: 0x3a3848,
    WALL: 0x4a4038,
    WALL_DARK: 0x3a3028,
    WALL_EDGE: 0x5a5048,
    WALL_HAZARD_YELLOW: 0xc8a828,
    WALL_HAZARD_BLACK: 0x282018,
    DOOR: 0x4a6a4a,
    DOOR_OPEN: 0x2a4a2a,
    COVER: 0x5a5048,
    COVER_DARK: 0x3a3028,
    EXTRACTION: 0x2a7a4a,
    EXTRACTION_GLOW: 0x3aaa5a,
    FIRE: 0xff7722,
    FIRE_GLOW: 0xffaa44,
    FIRE_CORE: 0xffdd66,
    BLOOD: 0x4a1018,
    BLOOD_FRESH: 0x6a2028,
    BLOOD_DARK: 0x280810,

    // UI Colors - green terminal style
    UI_BG: 0x0a0a14,
    UI_BORDER: 0x4a8a6a,
    UI_TEXT: 0x8ac8aa,
    UI_HEALTH: 0x4a8a6a,
    UI_HEALTH_LOW: 0xaa4a4a,
    UI_CORRUPTION: 0x8a2a4a,
    UI_AP: 0x6a8aaa,

    // Entity colors
    PLAYER: 0x6a8a6a,
    PLAYER_ARMOR: 0x4a6a5a,
    PLAYER_VISOR: 0x88ccaa,
    ENEMY_HUMAN: 0x6a5848,
    ENEMY_HUMAN_ARMOR: 0x4a3828,
    ENEMY_CORRUPT: 0x7a2a3a,
    ENEMY_CORRUPT_FLESH: 0xaa4a5a,
    ENEMY_HORROR: 0x5a2a6a,
    ENEMY_HORROR_GLOW: 0x8a4a9a,

    // Effects
    MUZZLE_FLASH: 0xffaa44,
    BULLET_TRAIL: 0xffcc66,
    FOW_DARK: 0x000000,
    FOW_DIM: 0x080810
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

        // Floor tiles - metal grate pattern
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.4);
        for (let i = 0; i <= TILE_SIZE; i += 4) {
            g.lineBetween(i, 0, i, TILE_SIZE);
            g.lineBetween(0, i, TILE_SIZE, i);
        }
        g.lineStyle(1, COLORS.FLOOR_GRATE, 0.2);
        g.lineBetween(0, 0, TILE_SIZE, 0);
        g.lineBetween(0, 0, 0, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Wall tile with hazard stripes
        g.clear();
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.WALL_DARK);
        g.fillRect(0, 0, TILE_SIZE, 2);
        g.fillStyle(COLORS.WALL_EDGE);
        g.fillRect(0, TILE_SIZE - 3, TILE_SIZE, 3);
        g.fillStyle(COLORS.WALL_HAZARD_YELLOW);
        for (let i = 0; i < 8; i++) {
            g.fillRect(i * 8, 3, 4, 4);
        }
        g.fillStyle(COLORS.WALL_HAZARD_BLACK);
        for (let i = 0; i < 8; i++) {
            g.fillRect(i * 8 + 4, 3, 4, 4);
        }
        g.fillStyle(COLORS.WALL_DARK);
        g.fillRect(8, 12, 16, 12);
        g.lineStyle(1, COLORS.WALL_EDGE, 0.5);
        g.strokeRect(8, 12, 16, 12);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door closed
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.3);
        for (let i = 0; i <= TILE_SIZE; i += 4) {
            g.lineBetween(i, 0, i, TILE_SIZE);
            g.lineBetween(0, i, TILE_SIZE, i);
        }
        g.fillStyle(0x3a4a3a);
        g.fillRect(2, 4, TILE_SIZE - 4, TILE_SIZE - 8);
        g.fillStyle(COLORS.DOOR);
        g.fillRect(4, 6, 10, TILE_SIZE - 12);
        g.fillRect(18, 6, 10, TILE_SIZE - 12);
        g.fillStyle(0x2a3a2a);
        g.fillRect(14, 6, 4, TILE_SIZE - 12);
        g.fillStyle(0x6a8a6a);
        g.fillRect(6, 12, 6, 8);
        g.fillRect(20, 12, 6, 8);
        g.generateTexture('door_closed', TILE_SIZE, TILE_SIZE);

        // Door open
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.3);
        for (let i = 0; i <= TILE_SIZE; i += 4) {
            g.lineBetween(i, 0, i, TILE_SIZE);
            g.lineBetween(0, i, TILE_SIZE, i);
        }
        g.fillStyle(COLORS.DOOR_OPEN);
        g.fillRect(0, 0, 4, TILE_SIZE);
        g.fillRect(TILE_SIZE - 4, 0, 4, TILE_SIZE);
        g.fillStyle(COLORS.DOOR);
        g.fillRect(0, 4, 3, TILE_SIZE - 8);
        g.fillRect(TILE_SIZE - 3, 4, 3, TILE_SIZE - 8);
        g.generateTexture('door_open', TILE_SIZE, TILE_SIZE);

        // Cover (crate)
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.2);
        for (let i = 0; i <= TILE_SIZE; i += 4) {
            g.lineBetween(i, 0, i, TILE_SIZE);
            g.lineBetween(0, i, TILE_SIZE, i);
        }
        g.fillStyle(COLORS.COVER);
        g.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.fillStyle(COLORS.COVER_DARK);
        g.fillRect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12);
        g.lineStyle(2, COLORS.COVER);
        g.lineBetween(4, 10, TILE_SIZE - 4, 10);
        g.lineBetween(4, 22, TILE_SIZE - 4, 22);
        g.fillStyle(0x6a6058);
        g.fillRect(4, 4, TILE_SIZE - 8, 2);
        g.generateTexture('cover', TILE_SIZE, TILE_SIZE);

        // Extraction zone
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.EXTRACTION);
        g.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
        g.fillStyle(0x1a5a3a);
        g.fillRect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12);
        g.fillStyle(COLORS.EXTRACTION_GLOW);
        g.fillTriangle(16, 8, 10, 18, 22, 18);
        g.fillRect(12, 16, 8, 8);
        g.fillStyle(0x4aaa6a);
        g.fillRect(2, 2, 4, 2);
        g.fillRect(2, 2, 2, 4);
        g.fillRect(TILE_SIZE - 6, 2, 4, 2);
        g.fillRect(TILE_SIZE - 4, 2, 2, 4);
        g.fillRect(2, TILE_SIZE - 4, 4, 2);
        g.fillRect(2, TILE_SIZE - 6, 2, 4);
        g.fillRect(TILE_SIZE - 6, TILE_SIZE - 4, 4, 2);
        g.fillRect(TILE_SIZE - 4, TILE_SIZE - 6, 2, 4);
        g.generateTexture('extraction', TILE_SIZE, TILE_SIZE);

        // Loot container
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.2);
        for (let i = 0; i <= TILE_SIZE; i += 4) {
            g.lineBetween(i, 0, i, TILE_SIZE);
            g.lineBetween(0, i, TILE_SIZE, i);
        }
        g.fillStyle(0x4a5a4a);
        g.fillRect(5, 8, TILE_SIZE - 10, TILE_SIZE - 12);
        g.fillStyle(0x5a6a5a);
        g.fillRect(4, 6, TILE_SIZE - 8, 6);
        g.fillStyle(0x6aaa6a);
        g.fillRect(12, 8, 8, 3);
        g.fillStyle(0x3a4a3a);
        g.fillRect(14, 14, 4, 8);
        g.generateTexture('loot', TILE_SIZE, TILE_SIZE);

        // Fire hazard
        g.clear();
        g.fillStyle(COLORS.FLOOR_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.FIRE);
        g.fillCircle(16, 22, 12);
        g.fillCircle(10, 18, 8);
        g.fillCircle(22, 18, 8);
        g.fillStyle(COLORS.FIRE_GLOW);
        g.fillCircle(16, 16, 8);
        g.fillCircle(12, 14, 6);
        g.fillCircle(20, 14, 6);
        g.fillStyle(COLORS.FIRE_CORE);
        g.fillCircle(16, 12, 4);
        g.fillCircle(14, 10, 3);
        g.fillCircle(18, 10, 3);
        g.generateTexture('fire', TILE_SIZE, TILE_SIZE);

        // Blood splatter
        g.clear();
        g.fillStyle(COLORS.BLOOD_DARK);
        g.fillCircle(12, 14, 10);
        g.fillCircle(20, 18, 8);
        g.fillStyle(COLORS.BLOOD);
        g.fillCircle(10, 12, 7);
        g.fillCircle(18, 16, 6);
        g.fillCircle(24, 10, 4);
        g.fillStyle(COLORS.BLOOD_FRESH);
        g.fillCircle(14, 14, 4);
        g.fillCircle(8, 18, 3);
        g.generateTexture('blood', TILE_SIZE, TILE_SIZE);

        // Player sprite
        g.clear();
        g.fillStyle(COLORS.PLAYER_ARMOR);
        g.fillRect(8, 8, 16, 18);
        g.fillRect(4, 10, 6, 8);
        g.fillRect(22, 10, 6, 8);
        g.fillStyle(COLORS.PLAYER);
        g.fillRect(10, 4, 12, 10);
        g.fillStyle(COLORS.PLAYER_ARMOR);
        g.fillRect(10, 4, 12, 4);
        g.fillStyle(COLORS.PLAYER_VISOR);
        g.fillRect(11, 6, 10, 4);
        g.fillStyle(0x3a3a3a);
        g.fillRect(24, 12, 8, 3);
        g.fillRect(26, 10, 4, 6);
        g.fillStyle(0x2a2a2a);
        g.fillRect(24, 14, 2, 2);
        g.generateTexture('player', TILE_SIZE, TILE_SIZE);

        // Human enemy
        g.clear();
        g.fillStyle(COLORS.ENEMY_HUMAN_ARMOR);
        g.fillRect(8, 8, 16, 18);
        g.fillRect(4, 10, 6, 8);
        g.fillRect(22, 10, 6, 8);
        g.fillStyle(COLORS.ENEMY_HUMAN);
        g.fillRect(10, 4, 12, 10);
        g.fillStyle(0x2a2018);
        g.fillRect(10, 4, 12, 5);
        g.fillStyle(0x1a1810);
        g.fillRect(12, 8, 8, 4);
        g.fillStyle(0x3a3028);
        g.fillRect(22, 12, 8, 3);
        g.generateTexture('enemy_human', TILE_SIZE, TILE_SIZE);

        // Corrupted enemy
        g.clear();
        g.fillStyle(COLORS.ENEMY_CORRUPT);
        g.fillRect(6, 6, 20, 22);
        g.fillStyle(COLORS.ENEMY_CORRUPT_FLESH);
        g.fillCircle(10, 10, 6);
        g.fillCircle(22, 12, 5);
        g.fillCircle(14, 20, 7);
        g.fillStyle(0xffaaaa);
        g.fillCircle(8, 8, 2);
        g.fillCircle(14, 9, 2);
        g.fillCircle(20, 11, 2);
        g.fillStyle(0x220000);
        g.fillCircle(8, 8, 1);
        g.fillCircle(14, 9, 1);
        g.fillCircle(20, 11, 1);
        g.fillStyle(0x4a1a2a);
        g.fillTriangle(2, 14, 6, 18, 0, 22);
        g.fillTriangle(30, 14, 26, 18, 32, 22);
        g.fillTriangle(4, 26, 10, 24, 6, 32);
        g.fillTriangle(28, 26, 22, 24, 26, 32);
        g.generateTexture('enemy_corrupt', TILE_SIZE, TILE_SIZE);

        // Horror enemy
        g.clear();
        g.fillStyle(COLORS.ENEMY_HORROR);
        g.fillCircle(16, 16, 14);
        g.fillStyle(COLORS.ENEMY_HORROR_GLOW);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0x9a6aaa);
        g.fillCircle(16, 14, 6);
        g.fillStyle(0xddaadd);
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const ex = 16 + Math.cos(angle) * 10;
            const ey = 16 + Math.sin(angle) * 10;
            g.fillCircle(ex, ey, 3);
        }
        g.fillStyle(0x220022);
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const ex = 16 + Math.cos(angle) * 10;
            const ey = 16 + Math.sin(angle) * 10;
            g.fillCircle(ex, ey, 1);
        }
        g.lineStyle(3, COLORS.ENEMY_HORROR);
        g.lineBetween(4, 20, 0, 32);
        g.lineBetween(28, 20, 32, 32);
        g.lineBetween(8, 28, 4, 32);
        g.lineBetween(24, 28, 28, 32);
        g.generateTexture('enemy_horror', TILE_SIZE, TILE_SIZE);

        // FOW tiles
        g.clear();
        g.fillStyle(COLORS.FOW_DARK);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('fow_dark', TILE_SIZE, TILE_SIZE);

        g.clear();
        g.fillStyle(COLORS.FOW_DIM);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('fow_dim', TILE_SIZE, TILE_SIZE);

        // Bullet
        g.clear();
        g.fillStyle(COLORS.BULLET_TRAIL);
        g.fillRect(0, 2, 8, 4);
        g.fillStyle(COLORS.MUZZLE_FLASH);
        g.fillRect(6, 0, 4, 8);
        g.generateTexture('bullet', 10, 8);

        // Selection highlight
        g.clear();
        g.lineStyle(2, COLORS.UI_BORDER, 1);
        g.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
        g.generateTexture('select', TILE_SIZE, TILE_SIZE);

        g.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    create() {
        this.initGameState();
        this.generateMap();
        this.createUI();
        this.setupInput();
        this.updateFOW();

        window.gameState = this.gameState;
        window.game = this.game;

        // Debug mode toggle (press backtick)
        this.debugMode = false;
        this.debugText = null;
        this.input.keyboard.on('keydown-BACKQUOTE', () => {
            this.debugMode = !this.debugMode;
            this.updateDebugOverlay();
        });

        // Pulsing extraction zone glow
        this.createExtractionGlow();
    }

    createExtractionGlow() {
        if (!this.extractionPos) return;

        const ex = this.extractionPos.x * TILE_SIZE + TILE_SIZE / 2;
        const ey = this.extractionPos.y * TILE_SIZE + TILE_SIZE / 2;

        this.extractionGlow = this.add.circle(ex, ey, TILE_SIZE, 0x4aaa6a, 0);
        this.extractionGlow.setDepth(-1);

        this.tweens.add({
            targets: this.extractionGlow,
            alpha: 0.4,
            scale: 1.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updateDebugOverlay() {
        if (this.debugText) {
            this.debugText.destroy();
            this.debugBg?.destroy();
            this.debugText = null;
            this.debugBg = null;
        }

        if (!this.debugMode) return;

        const gs = this.gameState;
        const p = gs.player;
        const enemies = gs.enemies.filter(e => e.hp > 0);

        const debugInfo = [
            `=== DEBUG ===`,
            `Turn: ${gs.turn} | Phase: ${gs.phase}`,
            `Player: (${p.x}, ${p.y})`,
            `HP: ${p.hp}/${p.maxHp} | AP: ${p.ap}/${p.maxAp}`,
            `Weapon: ${p.weapon.name}`,
            `Ammo: ${p.weapon.ammo}/${p.weapon.maxAmmo}`,
            `Corruption: ${gs.corruption}`,
            `Enemies: ${enemies.length}`,
            `Kills: ${gs.killCount || 0}`,
            `Damage Dealt: ${gs.totalDamageDealt || 0}`,
            `Damage Taken: ${gs.totalDamageTaken || 0}`,
            `Kill Streak: ${gs.killStreak || 0}`,
            `Crits: ${gs.critCount || 0}`
        ].join('\n');

        this.debugBg = this.add.rectangle(145, 170, 260, 240, 0x000000, 0.85);
        this.debugBg.setDepth(1000);

        this.debugText = this.add.text(20, 55, debugInfo, {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#00ff00'
        });
        this.debugText.setDepth(1001);
    }

    initGameState() {
        this.gameState = {
            turn: 1,
            phase: 'player',
            corruption: 0,
            maxCorruption: 1000,
            // Tracking stats
            killCount: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            critCount: 0,
            shotsHit: 0,
            shotsMissed: 0,
            killStreak: 0,
            killStreakTimer: 0,
            maxKillStreak: 0,
            floor: 1,
            player: {
                x: 3,
                y: 9,
                hp: 100,
                maxHp: 100,
                ap: 3,
                maxAp: 3,
                weapon: {
                    name: 'Combat Rifle',
                    damage: [30, 40],
                    accuracy: 70,
                    range: 8,
                    apCost: 1,
                    ammo: 20,
                    maxAmmo: 20
                },
                items: [
                    { name: 'Medkit', count: 2 },
                    { name: 'Grenade', count: 1 }
                ],
                stance: 'walk'
            },
            enemies: [],
            lootContainers: [],
            bloodSplatters: []
        };

        this.tiles = [];
        this.fowTiles = [];
        this.entitySprites = {};
        this.visibleTiles = new Set();
        this.exploredTiles = new Set();
    }

    generateMap() {
        this.mapContainer = this.add.container(0, 0);
        this.entityContainer = this.add.container(0, 0);
        this.effectContainer = this.add.container(0, 0);
        this.fowContainer = this.add.container(0, 0);
        this.highlightContainer = this.add.container(0, 0);

        this.map = this.generateStation();

        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.tiles[y] = [];
            this.fowTiles[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = this.map[y][x];
                let texture = 'floor';

                switch (tile) {
                    case TILE.WALL: texture = 'wall'; break;
                    case TILE.DOOR_CLOSED: texture = 'door_closed'; break;
                    case TILE.DOOR_OPEN: texture = 'door_open'; break;
                    case TILE.COVER_HALF:
                    case TILE.COVER_FULL: texture = 'cover'; break;
                    case TILE.EXTRACTION: texture = 'extraction'; break;
                    case TILE.LOOT: texture = 'loot'; break;
                    case TILE.HAZARD_FIRE: texture = 'fire'; break;
                }

                const sprite = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, texture);
                this.mapContainer.add(sprite);
                this.tiles[y][x] = sprite;

                const fow = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'fow_dark');
                fow.setAlpha(1);
                this.fowContainer.add(fow);
                this.fowTiles[y][x] = fow;
            }
        }

        this.gameState.bloodSplatters.forEach(pos => {
            const blood = this.add.image(pos.x * TILE_SIZE + TILE_SIZE / 2, pos.y * TILE_SIZE + TILE_SIZE / 2, 'blood');
            blood.setAlpha(0.7);
            this.mapContainer.add(blood);
        });

        const p = this.gameState.player;
        this.playerSprite = this.add.image(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, 'player');
        this.entityContainer.add(this.playerSprite);

        this.gameState.enemies.forEach((enemy, i) => {
            const texture = enemy.type === 'human' ? 'enemy_human' :
                           enemy.type === 'corrupt' ? 'enemy_corrupt' : 'enemy_horror';
            const sprite = this.add.image(enemy.x * TILE_SIZE + TILE_SIZE / 2, enemy.y * TILE_SIZE + TILE_SIZE / 2, texture);
            this.entityContainer.add(sprite);
            this.entitySprites[`enemy_${i}`] = sprite;
        });

        this.selectionCursor = this.add.image(0, 0, 'select');
        this.selectionCursor.setVisible(false);
        this.highlightContainer.add(this.selectionCursor);
    }

    generateStation() {
        const map = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                map[y][x] = TILE.WALL;
            }
        }

        const rooms = [];
        const roomCount = 6;

        for (let i = 0; i < roomCount; i++) {
            const room = this.generateRoom(map, rooms);
            if (room) rooms.push(room);
        }

        for (let i = 1; i < rooms.length; i++) {
            this.connectRooms(map, rooms[i - 1], rooms[i]);
        }

        this.addDoors(map, rooms);

        rooms.forEach(room => {
            const coverCount = Math.floor(Math.random() * 3) + 1;
            for (let c = 0; c < coverCount; c++) {
                const cx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const cy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
                if (map[cy][cx] === TILE.FLOOR) {
                    map[cy][cx] = TILE.COVER_HALF;
                }
            }
        });

        rooms.forEach((room, i) => {
            if (i > 0 && Math.random() < 0.5) {
                const lx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const ly = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
                if (map[ly][lx] === TILE.FLOOR) {
                    map[ly][lx] = TILE.LOOT;
                    this.gameState.lootContainers.push({ x: lx, y: ly, looted: false });
                }
            }
        });

        const lastRoom = rooms[rooms.length - 1];
        const ex = lastRoom.x + Math.floor(lastRoom.w / 2);
        const ey = lastRoom.y + Math.floor(lastRoom.h / 2);
        map[ey][ex] = TILE.EXTRACTION;
        this.extractionPos = { x: ex, y: ey };

        for (let i = 0; i < 8; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const bx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const by = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[by][bx] === TILE.FLOOR) {
                this.gameState.bloodSplatters.push({ x: bx, y: by });
            }
        }

        rooms.forEach((room, i) => {
            if (i > 0) {
                const enemyCount = Math.floor(Math.random() * 2) + 1;
                for (let e = 0; e < enemyCount; e++) {
                    const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                    const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
                    if (map[ey][ex] === TILE.FLOOR) {
                        const type = Math.random() < 0.7 ? 'human' : 'corrupt';
                        this.gameState.enemies.push({
                            x: ex, y: ey,
                            type: type,
                            hp: type === 'human' ? 50 : 80,
                            maxHp: type === 'human' ? 50 : 80,
                            ap: 2,
                            maxAp: 2,
                            damage: type === 'human' ? [10, 15] : [15, 25],
                            range: type === 'human' ? 6 : 1,
                            behavior: 'patrol',
                            alertLevel: 0
                        });
                    }
                }
            }
        });

        const startRoom = rooms[0];
        this.gameState.player.x = startRoom.x + Math.floor(startRoom.w / 2);
        this.gameState.player.y = startRoom.y + Math.floor(startRoom.h / 2);

        return map;
    }

    generateRoom(map, existingRooms) {
        const minSize = 4;
        const maxSize = 8;

        for (let attempts = 0; attempts < 50; attempts++) {
            const w = minSize + Math.floor(Math.random() * (maxSize - minSize));
            const h = minSize + Math.floor(Math.random() * (maxSize - minSize));
            const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
            const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

            let valid = true;
            for (const room of existingRooms) {
                if (x < room.x + room.w + 1 && x + w + 1 > room.x &&
                    y < room.y + room.h + 1 && y + h + 1 > room.y) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                for (let ry = y; ry < y + h; ry++) {
                    for (let rx = x; rx < x + w; rx++) {
                        map[ry][rx] = TILE.FLOOR;
                    }
                }
                return { x, y, w, h };
            }
        }
        return null;
    }

    connectRooms(map, roomA, roomB) {
        let x = roomA.x + Math.floor(roomA.w / 2);
        let y = roomA.y + Math.floor(roomA.h / 2);
        const targetX = roomB.x + Math.floor(roomB.w / 2);
        const targetY = roomB.y + Math.floor(roomB.h / 2);

        while (x !== targetX) {
            map[y][x] = TILE.FLOOR;
            x += x < targetX ? 1 : -1;
        }
        while (y !== targetY) {
            map[y][x] = TILE.FLOOR;
            y += y < targetY ? 1 : -1;
        }
    }

    addDoors(map, rooms) {
        rooms.forEach(room => {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (room.y > 0 && map[room.y - 1][x] === TILE.FLOOR && map[room.y][x] === TILE.FLOOR) {
                    let isCorr = (x === room.x || map[room.y - 1][x - 1] === TILE.WALL) &&
                                (x === room.x + room.w - 1 || map[room.y - 1][x + 1] === TILE.WALL);
                    if (isCorr && Math.random() < 0.5) {
                        map[room.y][x] = TILE.DOOR_CLOSED;
                    }
                }
            }
        });
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);

        const g = this.add.graphics();
        this.uiContainer.add(g);

        g.fillStyle(COLORS.UI_BG, 0.9);
        g.fillRect(8, 8, 200, 90);
        g.lineStyle(2, COLORS.UI_BORDER);
        g.strokeRect(8, 8, 200, 90);

        g.fillStyle(COLORS.UI_BG, 0.9);
        g.fillRect(GAME_WIDTH - 148, 8, 140, 90);
        g.lineStyle(2, COLORS.UI_BORDER);
        g.strokeRect(GAME_WIDTH - 148, 8, 140, 90);

        g.fillStyle(COLORS.UI_BG, 0.9);
        g.fillRect(8, GAME_HEIGHT - 98, 280, 90);
        g.lineStyle(2, COLORS.UI_BORDER);
        g.strokeRect(8, GAME_HEIGHT - 98, 280, 90);

        g.fillStyle(COLORS.UI_BG, 0.9);
        g.fillRect(GAME_WIDTH - 178, GAME_HEIGHT - 98, 170, 90);
        g.lineStyle(2, COLORS.UI_BORDER);
        g.strokeRect(GAME_WIDTH - 178, GAME_HEIGHT - 98, 170, 90);

        const textStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#8ac8aa' };
        const labelStyle = { fontFamily: 'monospace', fontSize: '10px', color: '#6a9a8a' };

        this.add.text(16, 12, 'I INVENTORY', labelStyle);
        this.weaponText = this.add.text(16, 30, '', textStyle);
        this.ammoText = this.add.text(16, 48, '', textStyle);
        this.itemsText = this.add.text(16, 66, '', textStyle);

        this.add.text(GAME_WIDTH - 140, 12, 'C CLASS', labelStyle);
        this.classText = this.add.text(GAME_WIDTH - 140, 30, 'ASSAULT', textStyle);
        this.stanceText = this.add.text(GAME_WIDTH - 140, 48, '', textStyle);

        this.add.text(16, GAME_HEIGHT - 94, 'H HEALTH MONITOR', labelStyle);
        this.turnText = this.add.text(16, GAME_HEIGHT - 76, '', textStyle);
        this.healthText = this.add.text(16, GAME_HEIGHT - 58, '', textStyle);
        this.apText = this.add.text(16, GAME_HEIGHT - 40, '', textStyle);
        this.phaseText = this.add.text(16, GAME_HEIGHT - 22, '', textStyle);

        this.add.text(GAME_WIDTH - 170, GAME_HEIGHT - 94, 'CORRUPTION', { ...labelStyle, color: '#aa6a8a' });
        this.corruptionText = this.add.text(GAME_WIDTH - 170, GAME_HEIGHT - 70, '', { ...textStyle, color: '#cc8aaa' });
        this.corruptionBar = this.add.graphics();
        this.uiContainer.add(this.corruptionBar);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'WASD: Move | Click: Attack | Space: End Turn | R: Reload',
            { ...labelStyle, color: '#6a8a8a' }).setOrigin(0.5, 1);

        this.updateUI();
    }

    updateUI() {
        const p = this.gameState.player;
        const gs = this.gameState;

        this.weaponText.setText(`[S] ${p.weapon.name}`);
        this.ammoText.setText(`    ${p.weapon.ammo}/${p.weapon.maxAmmo}`);
        this.itemsText.setText(`[F] ${p.items.map(i => `${i.name}x${i.count}`).join(' ')}`);

        this.stanceText.setText(`Stance: ${p.stance.toUpperCase()}`);

        this.turnText.setText(`Turn: ${gs.turn}`);

        const healthPct = p.hp / p.maxHp;
        const healthBars = Math.floor(healthPct * 20);
        const healthBar = '|'.repeat(healthBars) + '-'.repeat(20 - healthBars);
        this.healthText.setText(`HP: ${p.hp}/${p.maxHp} [${healthBar}]`);

        const apBar = '='.repeat(p.ap) + '-'.repeat(p.maxAp - p.ap);
        this.apText.setText(`AP: ${p.ap}/${p.maxAp} [${apBar}]`);

        this.phaseText.setText(`Phase: ${gs.phase.toUpperCase()}`);

        this.corruptionText.setText(`${gs.corruption}`);

        this.corruptionBar.clear();
        const corrPct = gs.corruption / gs.maxCorruption;
        this.corruptionBar.fillStyle(0x2a1a2a);
        this.corruptionBar.fillRect(GAME_WIDTH - 170, GAME_HEIGHT - 50, 150, 16);
        this.corruptionBar.fillStyle(COLORS.UI_CORRUPTION);
        this.corruptionBar.fillRect(GAME_WIDTH - 170, GAME_HEIGHT - 50, 150 * corrPct, 16);
        this.corruptionBar.lineStyle(1, 0x6a3a4a);
        this.corruptionBar.strokeRect(GAME_WIDTH - 170, GAME_HEIGHT - 50, 150, 16);

        let corrLevel = 'NORMAL';
        if (gs.corruption >= 800) corrLevel = 'RAPTURE';
        else if (gs.corruption >= 600) corrLevel = 'CRITICAL';
        else if (gs.corruption >= 400) corrLevel = 'SPREADING';
        else if (gs.corruption >= 200) corrLevel = 'UNEASE';

        if (!this.corrLevelText) {
            this.corrLevelText = this.add.text(GAME_WIDTH - 170, GAME_HEIGHT - 28, '',
                { fontFamily: 'monospace', fontSize: '10px', color: '#aa6a8a' });
        }
        this.corrLevelText.setText(corrLevel);

        // Enemies remaining counter
        const enemiesRemaining = gs.enemies.filter(e => e.hp > 0).length;
        if (!this.enemiesText) {
            this.enemiesText = this.add.text(GAME_WIDTH - 140, 68, '',
                { fontFamily: 'monospace', fontSize: '11px', color: '#cc8888' });
        }
        this.enemiesText.setText(`Hostiles: ${enemiesRemaining}`);

        // Kill streak display
        if (!this.streakText) {
            this.streakText = this.add.text(GAME_WIDTH / 2, 30, '',
                { fontFamily: 'monospace', fontSize: '14px', color: '#ff8800' });
            this.streakText.setOrigin(0.5);
        }
        if (gs.killStreak >= 2) {
            this.streakText.setText(`${gs.killStreak}x KILL STREAK`);
            this.streakText.setVisible(true);
        } else {
            this.streakText.setVisible(false);
        }
    }

    setupInput() {
        this.wasd = {
            w: this.input.keyboard.addKey('W'),
            a: this.input.keyboard.addKey('A'),
            s: this.input.keyboard.addKey('S'),
            d: this.input.keyboard.addKey('D')
        };
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.rKey = this.input.keyboard.addKey('R');

        this.wasd.w.on('down', () => this.tryMove(0, -1));
        this.wasd.a.on('down', () => this.tryMove(-1, 0));
        this.wasd.s.on('down', () => this.tryMove(0, 1));
        this.wasd.d.on('down', () => this.tryMove(1, 0));

        this.spaceKey.on('down', () => this.endPlayerTurn());
        this.rKey.on('down', () => this.reloadWeapon());

        this.input.on('pointerdown', (pointer) => {
            const tx = Math.floor(pointer.x / TILE_SIZE);
            const ty = Math.floor(pointer.y / TILE_SIZE);
            this.handleClick(tx, ty);
        });

        this.input.on('pointermove', (pointer) => {
            const tx = Math.floor(pointer.x / TILE_SIZE);
            const ty = Math.floor(pointer.y / TILE_SIZE);
            this.updateSelection(tx, ty);
        });
    }

    tryMove(dx, dy) {
        if (this.gameState.phase !== 'player') return;
        if (this.gameState.player.ap < 1) return;

        const p = this.gameState.player;
        const newX = p.x + dx;
        const newY = p.y + dy;

        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;

        const tile = this.map[newY][newX];
        if (tile === TILE.WALL || tile === TILE.COVER_HALF || tile === TILE.COVER_FULL) return;

        const enemyAtPos = this.gameState.enemies.find(e => e.x === newX && e.y === newY && e.hp > 0);
        if (enemyAtPos) return;

        if (tile === TILE.DOOR_CLOSED) {
            this.map[newY][newX] = TILE.DOOR_OPEN;
            this.tiles[newY][newX].setTexture('door_open');

            // Door opening dust particles
            const doorX = newX * TILE_SIZE + TILE_SIZE / 2;
            const doorY = newY * TILE_SIZE + TILE_SIZE / 2;
            for (let i = 0; i < 8; i++) {
                const dust = this.add.circle(
                    doorX + (Math.random() - 0.5) * 20,
                    doorY + (Math.random() - 0.5) * 20,
                    2, 0x888866
                );
                this.tweens.add({
                    targets: dust,
                    x: dust.x + (Math.random() - 0.5) * 30,
                    y: dust.y + Math.random() * 20,
                    alpha: 0,
                    scale: 0.3,
                    duration: 600 + Math.random() * 300,
                    onComplete: () => dust.destroy()
                });
            }
            this.showFloatingText(newX, newY - 0.5, 'DOOR OPEN', 0x6a8a6a);

            this.updateFOW();
            return;
        }

        p.x = newX;
        p.y = newY;
        p.ap -= 1;

        this.tweens.add({
            targets: this.playerSprite,
            x: p.x * TILE_SIZE + TILE_SIZE / 2,
            y: p.y * TILE_SIZE + TILE_SIZE / 2,
            duration: 100,
            ease: 'Linear'
        });

        if (tile === TILE.EXTRACTION) {
            this.extractionSuccess();
            return;
        }

        if (tile === TILE.LOOT) {
            this.lootContainer(newX, newY);
        }

        if (tile === TILE.HAZARD_FIRE) {
            p.hp -= 10;
            this.showDamageNumber(newX, newY, 10, 0xff4400);
        }

        this.updateFOW();
        this.updateUI();
        this.checkAutoEndTurn();
    }

    handleClick(tx, ty) {
        if (this.gameState.phase !== 'player') return;
        if (!this.visibleTiles.has(`${tx},${ty}`)) return;

        const enemy = this.gameState.enemies.find(e => e.x === tx && e.y === ty && e.hp > 0);
        if (enemy) {
            this.attackEnemy(enemy);
            return;
        }

        const p = this.gameState.player;
        const loot = this.gameState.lootContainers.find(l => l.x === tx && l.y === ty && !l.looted);
        if (loot && Math.abs(p.x - tx) <= 1 && Math.abs(p.y - ty) <= 1) {
            this.lootContainer(tx, ty);
        }
    }

    attackEnemy(enemy) {
        const p = this.gameState.player;
        const weapon = p.weapon;

        if (p.ap < weapon.apCost) return;
        if (weapon.ammo <= 0) return;

        const dist = Math.abs(p.x - enemy.x) + Math.abs(p.y - enemy.y);
        if (dist > weapon.range) return;

        if (!this.hasLineOfSight(p.x, p.y, enemy.x, enemy.y)) return;

        p.ap -= weapon.apCost;
        weapon.ammo -= 1;

        let accuracy = weapon.accuracy;
        if (dist > weapon.range / 2) accuracy -= 10;

        const cover = this.getCoverValue(enemy.x, enemy.y, p.x, p.y);
        accuracy -= cover * 15;

        const roll = Math.random() * 100;

        this.showBulletTrail(p.x, p.y, enemy.x, enemy.y);

        if (roll < accuracy) {
            let damage = weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1));

            // Critical hit system (15% chance, 2x damage)
            const CRIT_CHANCE = 15;
            const CRIT_MULT = 2.0;
            let isCrit = false;
            if (Math.random() * 100 < CRIT_CHANCE) {
                damage = Math.floor(damage * CRIT_MULT);
                isCrit = true;
                this.gameState.critCount++;
            }

            enemy.hp -= damage;
            this.gameState.totalDamageDealt += damage;
            this.gameState.shotsHit++;

            // Show damage (red for normal, yellow for crit)
            if (isCrit) {
                this.showDamageNumber(enemy.x, enemy.y, damage, 0xffcc00);
                this.showFloatingText(enemy.x, enemy.y - 0.5, 'CRITICAL!', 0xffaa00);
                this.cameras.main.shake(150, 0.02);
            } else {
                this.showDamageNumber(enemy.x, enemy.y, damage, 0xff4444);
                this.cameras.main.shake(100, 0.01);
            }

            this.alertEnemies(p.x, p.y, 8);

            if (enemy.hp <= 0) {
                this.killEnemy(enemy);
            } else {
                const sprite = this.getEnemySprite(enemy);
                if (sprite) {
                    this.tweens.add({
                        targets: sprite,
                        alpha: 0.2,
                        yoyo: true,
                        duration: 50,
                        repeat: 2
                    });
                }
            }

            this.gameState.corruption += 5;
        } else {
            this.showMissText(enemy.x, enemy.y);
            this.gameState.shotsMissed++;
            // Combat tip on miss
            if (Math.random() < 0.3) {
                const tips = [
                    'Use cover for better accuracy',
                    'Get closer for hit bonus',
                    'Try flanking enemies'
                ];
                this.showFloatingText(p.x, p.y - 1, tips[Math.floor(Math.random() * tips.length)], 0x888888);
            }
        }

        this.updateUI();
        this.checkAutoEndTurn();
    }

    reloadWeapon() {
        if (this.gameState.phase !== 'player') return;
        if (this.gameState.player.ap < 1) return;

        const weapon = this.gameState.player.weapon;
        if (weapon.ammo >= weapon.maxAmmo) return;

        this.gameState.player.ap -= 1;
        weapon.ammo = weapon.maxAmmo;

        // Reload visual effect - shell ejection particles
        const p = this.gameState.player;
        const px = p.x * TILE_SIZE + TILE_SIZE / 2;
        const py = p.y * TILE_SIZE + TILE_SIZE / 2;

        for (let i = 0; i < 4; i++) {
            this.time.delayedCall(i * 80, () => {
                const shell = this.add.rectangle(
                    px + 10, py,
                    4, 2, 0xccaa44
                );
                this.tweens.add({
                    targets: shell,
                    x: px + 20 + Math.random() * 15,
                    y: py + 10 + Math.random() * 10,
                    angle: 180 + Math.random() * 180,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => shell.destroy()
                });
            });
        }

        this.showFloatingText(p.x, p.y - 0.5, 'RELOADING...', 0x88aacc);

        this.updateUI();
        this.checkAutoEndTurn();
    }

    lootContainer(x, y) {
        const container = this.gameState.lootContainers.find(l => l.x === x && l.y === y);
        if (!container || container.looted) return;

        container.looted = true;

        // Loot collection sparkle effect
        const lootX = x * TILE_SIZE + TILE_SIZE / 2;
        const lootY = y * TILE_SIZE + TILE_SIZE / 2;
        for (let i = 0; i < 12; i++) {
            const sparkle = this.add.circle(lootX, lootY, 2, 0xffcc00);
            const angle = (i / 12) * Math.PI * 2;
            this.tweens.add({
                targets: sparkle,
                x: lootX + Math.cos(angle) * 25,
                y: lootY + Math.sin(angle) * 25,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                onComplete: () => sparkle.destroy()
            });
        }

        const lootTypes = ['ammo', 'medkit', 'grenade'];
        const loot = lootTypes[Math.floor(Math.random() * lootTypes.length)];

        if (loot === 'ammo') {
            this.gameState.player.weapon.ammo = Math.min(
                this.gameState.player.weapon.ammo + 10,
                this.gameState.player.weapon.maxAmmo
            );
            this.showFloatingText(x, y, '+10 AMMO', 0x88cc88);
        } else if (loot === 'medkit') {
            const existing = this.gameState.player.items.find(i => i.name === 'Medkit');
            if (existing) existing.count++;
            else this.gameState.player.items.push({ name: 'Medkit', count: 1 });
            this.showFloatingText(x, y, '+1 MEDKIT', 0x88cc88);
        } else {
            const existing = this.gameState.player.items.find(i => i.name === 'Grenade');
            if (existing) existing.count++;
            else this.gameState.player.items.push({ name: 'Grenade', count: 1 });
            this.showFloatingText(x, y, '+1 GRENADE', 0x88cc88);
        }

        this.map[y][x] = TILE.FLOOR;
        this.tiles[y][x].setTexture('floor');
        this.updateUI();
    }

    killEnemy(enemy) {
        const idx = this.gameState.enemies.indexOf(enemy);
        const sprite = this.entitySprites[`enemy_${idx}`];

        // Death burst animation
        if (sprite) {
            // Create death particles
            for (let i = 0; i < 8; i++) {
                const particle = this.add.circle(
                    enemy.x * TILE_SIZE + TILE_SIZE / 2,
                    enemy.y * TILE_SIZE + TILE_SIZE / 2,
                    3, 0xff4444
                );
                const angle = (i / 8) * Math.PI * 2;
                this.tweens.add({
                    targets: particle,
                    x: particle.x + Math.cos(angle) * 30,
                    y: particle.y + Math.sin(angle) * 30,
                    alpha: 0,
                    scale: 0.3,
                    duration: 400,
                    onComplete: () => particle.destroy()
                });
            }

            this.tweens.add({
                targets: sprite,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 200,
                onComplete: () => sprite.destroy()
            });
        }

        // Screen shake on kill
        this.cameras.main.shake(120, 0.015);

        // Blood splatter
        this.gameState.bloodSplatters.push({ x: enemy.x, y: enemy.y });
        const blood = this.add.image(enemy.x * TILE_SIZE + TILE_SIZE / 2, enemy.y * TILE_SIZE + TILE_SIZE / 2, 'blood');
        blood.setAlpha(0.8);
        this.mapContainer.add(blood);

        // Kill count and streak
        this.gameState.killCount++;
        this.gameState.killStreak++;
        this.gameState.killStreakTimer = 180;

        if (this.gameState.killStreak > this.gameState.maxKillStreak) {
            this.gameState.maxKillStreak = this.gameState.killStreak;
        }

        // Kill streak feedback
        if (this.gameState.killStreak >= 3) {
            const streakTexts = ['TRIPLE KILL!', 'QUAD KILL!', 'RAMPAGE!', 'UNSTOPPABLE!'];
            const streakIdx = Math.min(this.gameState.killStreak - 3, streakTexts.length - 1);
            this.showFloatingText(enemy.x, enemy.y - 0.7, streakTexts[streakIdx], 0xff8800);
        }

        // Item drops (30% ammo, 15% health)
        if (Math.random() < 0.3) {
            this.gameState.player.weapon.ammo = Math.min(
                this.gameState.player.weapon.ammo + 5,
                this.gameState.player.weapon.maxAmmo
            );
            this.showFloatingText(enemy.x, enemy.y, '+5 AMMO', 0x88cc88);
        }
        if (Math.random() < 0.15) {
            const item = Math.random() < 0.5 ? 'Medkit' : 'Bandage';
            const existing = this.gameState.player.items.find(i => i.name === item);
            if (existing) existing.count++;
            else this.gameState.player.items.push({ name: item, count: 1 });
            this.showFloatingText(enemy.x, enemy.y + 0.3, `+1 ${item.toUpperCase()}`, 0x88ccaa);
        }

        this.gameState.corruption += 10;
        this.updateDebugOverlay();
    }

    showBulletTrail(x1, y1, x2, y2) {
        const startX = x1 * TILE_SIZE + TILE_SIZE / 2;
        const startY = y1 * TILE_SIZE + TILE_SIZE / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        // Enhanced muzzle flash
        const muzzleFlash = this.add.circle(
            startX + Math.cos(angle) * 15,
            startY + Math.sin(angle) * 15,
            10, 0xffcc44
        );
        muzzleFlash.setAlpha(0.9);
        this.tweens.add({
            targets: muzzleFlash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => muzzleFlash.destroy()
        });

        // Directional sparks
        for (let i = 0; i < 4; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
            const spark = this.add.circle(
                startX + Math.cos(angle) * 12,
                startY + Math.sin(angle) * 12,
                2, 0xffaa22
            );
            this.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(sparkAngle) * 20,
                y: spark.y + Math.sin(sparkAngle) * 20,
                alpha: 0,
                duration: 150,
                onComplete: () => spark.destroy()
            });
        }

        // Bullet projectile
        const bullet = this.add.image(startX, startY, 'bullet');
        bullet.setRotation(angle);

        this.tweens.add({
            targets: bullet,
            x: x2 * TILE_SIZE + TILE_SIZE / 2,
            y: y2 * TILE_SIZE + TILE_SIZE / 2,
            duration: 100,
            ease: 'Linear',
            onComplete: () => bullet.destroy()
        });

        this.effectContainer.add(bullet);
    }

    showDamageNumber(x, y, damage, color) {
        const text = this.add.text(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE,
            `-${damage}`,
            { fontFamily: 'monospace', fontSize: '14px', color: `#${color.toString(16).padStart(6, '0')}` }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });

        this.effectContainer.add(text);
    }

    showMissText(x, y) {
        const text = this.add.text(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE,
            'MISS',
            { fontFamily: 'monospace', fontSize: '12px', color: '#888888' }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: text.y - 20,
            alpha: 0,
            duration: 600,
            onComplete: () => text.destroy()
        });

        this.effectContainer.add(text);
    }

    showFloatingText(x, y, message, color) {
        const text = this.add.text(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE,
            message,
            { fontFamily: 'monospace', fontSize: '11px', color: `#${color.toString(16).padStart(6, '0')}` }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: text.y - 25,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });

        this.effectContainer.add(text);
    }

    alertEnemies(x, y, radius) {
        this.gameState.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;
            const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
            if (dist <= radius) {
                enemy.behavior = 'hunt';
                enemy.alertLevel = 3;
            }
        });
    }

    getEnemySprite(enemy) {
        const idx = this.gameState.enemies.indexOf(enemy);
        return this.entitySprites[`enemy_${idx}`];
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (x !== x2 || y !== y2) {
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }

            if (x === x2 && y === y2) break;

            const tile = this.map[y]?.[x];
            if (tile === TILE.WALL || tile === TILE.DOOR_CLOSED || tile === TILE.COVER_FULL) {
                return false;
            }
        }
        return true;
    }

    getCoverValue(targetX, targetY, attackerX, attackerY) {
        const dx = Math.sign(attackerX - targetX);
        const dy = Math.sign(attackerY - targetY);

        let coverValue = 0;

        if (dx !== 0) {
            const checkTile = this.map[targetY]?.[targetX + dx];
            if (checkTile === TILE.COVER_HALF) coverValue = Math.max(coverValue, 1);
            if (checkTile === TILE.COVER_FULL) coverValue = Math.max(coverValue, 2);
        }
        if (dy !== 0) {
            const checkTile = this.map[targetY + dy]?.[targetX];
            if (checkTile === TILE.COVER_HALF) coverValue = Math.max(coverValue, 1);
            if (checkTile === TILE.COVER_FULL) coverValue = Math.max(coverValue, 2);
        }

        return coverValue;
    }

    updateSelection(tx, ty) {
        // Clear previous hover info
        if (this.hoverInfo) {
            this.hoverInfo.destroy();
            this.hoverInfo = null;
        }
        if (this.hoverBg) {
            this.hoverBg.destroy();
            this.hoverBg = null;
        }

        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
            this.selectionCursor.setVisible(false);
            return;
        }

        if (!this.visibleTiles.has(`${tx},${ty}`)) {
            this.selectionCursor.setVisible(false);
            return;
        }

        this.selectionCursor.setPosition(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2);
        this.selectionCursor.setVisible(true);

        const enemy = this.gameState.enemies.find(e => e.x === tx && e.y === ty && e.hp > 0);
        if (enemy) {
            this.selectionCursor.setTint(0xff4444);

            // Calculate and display hit chance
            const p = this.gameState.player;
            const weapon = p.weapon;
            const dist = Math.abs(p.x - enemy.x) + Math.abs(p.y - enemy.y);

            let hitChance = weapon.accuracy;
            if (dist > weapon.range / 2) hitChance -= 10;
            const cover = this.getCoverValue(enemy.x, enemy.y, p.x, p.y);
            hitChance -= cover * 15;
            hitChance = Math.max(0, Math.min(100, hitChance));

            const inRange = dist <= weapon.range && this.hasLineOfSight(p.x, p.y, enemy.x, enemy.y);

            // Display enemy info
            const typeNames = { human: 'HOSTILE', corrupt: 'CORRUPTED', horror: 'HORROR' };
            const infoText = [
                `${typeNames[enemy.type] || enemy.type.toUpperCase()}`,
                `HP: ${enemy.hp}/${enemy.maxHp}`,
                inRange ? `HIT: ${hitChance}%` : 'OUT OF RANGE'
            ].join('\n');

            const infoX = tx * TILE_SIZE + TILE_SIZE + 5;
            const infoY = ty * TILE_SIZE - 10;

            this.hoverBg = this.add.rectangle(infoX + 40, infoY + 20, 90, 50, 0x000000, 0.8);
            this.hoverBg.setDepth(500);

            this.hoverInfo = this.add.text(infoX, infoY, infoText, {
                fontFamily: 'monospace',
                fontSize: '10px',
                color: inRange ? '#ff8888' : '#888888'
            });
            this.hoverInfo.setDepth(501);
        } else {
            this.selectionCursor.clearTint();
        }
    }

    checkAutoEndTurn() {
        if (this.gameState.player.ap <= 0) {
            this.time.delayedCall(300, () => this.endPlayerTurn());
        }
    }

    endPlayerTurn() {
        if (this.gameState.phase !== 'player') return;

        this.gameState.phase = 'enemy';
        this.updateUI();

        this.processEnemyTurns();
    }

    processEnemyTurns() {
        const enemies = this.gameState.enemies.filter(e => e.hp > 0);
        let delay = 0;

        enemies.forEach((enemy) => {
            this.time.delayedCall(delay, () => {
                this.processEnemyTurn(enemy);
            });
            delay += 300;
        });

        this.time.delayedCall(delay + 200, () => {
            this.startNewTurn();
        });
    }

    processEnemyTurn(enemy) {
        enemy.ap = enemy.maxAp;
        const p = this.gameState.player;

        const canSeePlayer = this.visibleTiles.has(`${enemy.x},${enemy.y}`) &&
                            this.hasLineOfSight(enemy.x, enemy.y, p.x, p.y);

        if (canSeePlayer) {
            enemy.behavior = 'hunt';
            enemy.alertLevel = 5;
        }

        while (enemy.ap > 0) {
            if (enemy.behavior === 'hunt' && canSeePlayer) {
                const dist = Math.abs(enemy.x - p.x) + Math.abs(enemy.y - p.y);

                if (dist <= enemy.range && this.hasLineOfSight(enemy.x, enemy.y, p.x, p.y)) {
                    this.enemyAttack(enemy);
                    enemy.ap -= 1;
                } else {
                    this.moveEnemyToward(enemy, p.x, p.y);
                    enemy.ap -= 1;
                }
            } else {
                if (Math.random() < 0.3) {
                    const dx = Math.floor(Math.random() * 3) - 1;
                    const dy = Math.floor(Math.random() * 3) - 1;
                    this.moveEnemy(enemy, dx, dy);
                }
                enemy.ap -= 1;
            }
        }

        if (enemy.alertLevel > 0) enemy.alertLevel--;
        if (enemy.alertLevel === 0) enemy.behavior = 'patrol';
    }

    enemyAttack(enemy) {
        const p = this.gameState.player;

        if (enemy.range > 1) {
            this.showBulletTrail(enemy.x, enemy.y, p.x, p.y);
        }

        const accuracy = 60;
        if (Math.random() * 100 < accuracy) {
            const damage = enemy.damage[0] + Math.floor(Math.random() * (enemy.damage[1] - enemy.damage[0] + 1));
            p.hp -= damage;
            this.gameState.totalDamageTaken += damage;
            this.showDamageNumber(p.x, p.y, damage, 0xff8888);

            this.cameras.main.shake(150, 0.015);

            // Damage flash effect (red tint overlay)
            this.showDamageFlash();

            this.tweens.add({
                targets: this.playerSprite,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => this.playerSprite.clearTint()
            });

            this.gameState.corruption += 3;

            // Update low health vignette
            this.updateLowHealthVignette();

            if (p.hp <= 0) {
                this.gameOver();
            }
        } else {
            this.showMissText(p.x, p.y);
        }

        this.updateUI();
        this.updateDebugOverlay();
    }

    showDamageFlash() {
        if (!this.damageFlashOverlay) {
            this.damageFlashOverlay = this.add.rectangle(
                GAME_WIDTH / 2, GAME_HEIGHT / 2,
                GAME_WIDTH, GAME_HEIGHT,
                0xff0000, 0
            );
            this.damageFlashOverlay.setDepth(900);
        }

        this.tweens.add({
            targets: this.damageFlashOverlay,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            onComplete: () => {
                this.damageFlashOverlay.setAlpha(0);
            }
        });
    }

    updateLowHealthVignette() {
        const healthPct = this.gameState.player.hp / this.gameState.player.maxHp;

        if (!this.healthVignette) {
            this.healthVignette = this.add.graphics();
            this.healthVignette.setDepth(899);
        }

        this.healthVignette.clear();

        if (healthPct < 0.3) {
            const alpha = (0.3 - healthPct) / 0.3 * 0.4;
            this.healthVignette.fillStyle(0xff0000, alpha);
            // Draw vignette edges
            this.healthVignette.fillRect(0, 0, GAME_WIDTH, 40);
            this.healthVignette.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
            this.healthVignette.fillRect(0, 0, 40, GAME_HEIGHT);
            this.healthVignette.fillRect(GAME_WIDTH - 40, 0, 40, GAME_HEIGHT);
        }
    }

    moveEnemyToward(enemy, targetX, targetY) {
        // Smart AI: Evaluate best move position
        const validMoves = [];
        const directions = [[0,0], [1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,1], [1,-1], [-1,-1]];

        for (const [dx, dy] of directions) {
            const newX = enemy.x + dx;
            const newY = enemy.y + dy;

            if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) continue;

            const tile = this.map[newY]?.[newX];
            if (tile === TILE.WALL || tile === TILE.DOOR_CLOSED ||
                tile === TILE.COVER_HALF || tile === TILE.COVER_FULL) continue;

            const blocked = this.gameState.enemies.some(e =>
                e !== enemy && e.hp > 0 && e.x === newX && e.y === newY
            );
            if (blocked) continue;

            if (this.gameState.player.x === newX && this.gameState.player.y === newY) continue;

            validMoves.push([dx, dy, newX, newY]);
        }

        if (validMoves.length === 0) return;

        // Score each move
        let bestMove = validMoves[0];
        let bestScore = -Infinity;

        const optimalDist = enemy.range > 1 ? enemy.range - 1 : 1;

        for (const [dx, dy, newX, newY] of validMoves) {
            let score = 0;

            // Distance to player
            const newDist = Math.abs(newX - targetX) + Math.abs(newY - targetY);
            score -= Math.abs(newDist - optimalDist) * 2;

            // Prefer cover
            const hasCoverNearby = directions.some(([cx, cy]) => {
                const checkTile = this.map[newY + cy]?.[newX + cx];
                return checkTile === TILE.COVER_HALF || checkTile === TILE.COVER_FULL;
            });
            if (hasCoverNearby) score += 5;

            // Flanking bonus
            const playerAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
            const moveAngle = Math.atan2(newY - enemy.y, newX - enemy.x);
            const angleDiff = Math.abs(playerAngle - moveAngle);
            if (angleDiff > Math.PI / 4 && angleDiff < 3 * Math.PI / 4) {
                score += 3; // Flanking
            }

            // Line of sight to player
            if (this.hasLineOfSight(newX, newY, targetX, targetY)) {
                score += 2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = [dx, dy, newX, newY];
            }
        }

        const [dx, dy] = bestMove;
        if (dx !== 0 || dy !== 0) {
            this.moveEnemy(enemy, dx, dy);
        }
    }

    moveEnemy(enemy, dx, dy) {
        const newX = enemy.x + dx;
        const newY = enemy.y + dy;

        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return false;

        const tile = this.map[newY][newX];
        if (tile === TILE.WALL || tile === TILE.DOOR_CLOSED ||
            tile === TILE.COVER_HALF || tile === TILE.COVER_FULL) return false;

        const blocked = this.gameState.enemies.some(e =>
            e !== enemy && e.hp > 0 && e.x === newX && e.y === newY
        );
        if (blocked) return false;

        if (this.gameState.player.x === newX && this.gameState.player.y === newY) return false;

        enemy.x = newX;
        enemy.y = newY;

        const idx = this.gameState.enemies.indexOf(enemy);
        const sprite = this.entitySprites[`enemy_${idx}`];
        if (sprite) {
            this.tweens.add({
                targets: sprite,
                x: newX * TILE_SIZE + TILE_SIZE / 2,
                y: newY * TILE_SIZE + TILE_SIZE / 2,
                duration: 150,
                ease: 'Linear'
            });
        }

        return true;
    }

    startNewTurn() {
        this.gameState.turn++;
        this.gameState.phase = 'player';
        this.gameState.player.ap = this.gameState.player.maxAp;

        this.gameState.corruption += 2;

        // Kill streak timer decay
        if (this.gameState.killStreakTimer > 0) {
            this.gameState.killStreakTimer--;
            if (this.gameState.killStreakTimer <= 0) {
                this.gameState.killStreak = 0;
            }
        }

        if (this.gameState.corruption >= 400) {
            this.checkEnemyTransformation();
        }

        this.applyCorruptionEffects();

        // Turn indicator floating text
        const p = this.gameState.player;
        this.showFloatingText(p.x, p.y - 1, `TURN ${this.gameState.turn}`, 0x6a8a8a);

        this.updateFOW();
        this.updateUI();
        this.updateDebugOverlay();
    }

    checkEnemyTransformation() {
        const transformChance = this.gameState.corruption >= 800 ? 0.5 :
                               this.gameState.corruption >= 600 ? 0.25 :
                               this.gameState.corruption >= 400 ? 0.1 : 0;

        this.gameState.enemies.forEach((enemy, idx) => {
            if (enemy.type === 'human' && enemy.hp > 0 && Math.random() < transformChance) {
                enemy.type = 'corrupt';
                enemy.hp = 80;
                enemy.maxHp = 80;
                enemy.damage = [15, 25];
                enemy.range = 1;
                enemy.behavior = 'hunt';

                const sprite = this.entitySprites[`enemy_${idx}`];
                if (sprite) {
                    this.tweens.add({
                        targets: sprite,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        duration: 200,
                        yoyo: true,
                        onComplete: () => sprite.setTexture('enemy_corrupt')
                    });
                }

                this.showFloatingText(enemy.x, enemy.y, 'TRANSFORMED!', 0xff4466);
            }
        });
    }

    applyCorruptionEffects() {
        const corruption = this.gameState.corruption;

        if (corruption >= 600) {
            this.cameras.main.setBackgroundColor(0x1a0a0a);
        } else if (corruption >= 400) {
            this.cameras.main.setBackgroundColor(0x120808);
        } else if (corruption >= 200) {
            this.cameras.main.setBackgroundColor(0x0c0608);
        }
    }

    updateFOW() {
        this.visibleTiles.clear();
        const p = this.gameState.player;
        const visionRange = 8;

        for (let angle = 0; angle < 360; angle += 2) {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);

            for (let dist = 0; dist <= visionRange; dist++) {
                const tx = Math.floor(p.x + dx * dist);
                const ty = Math.floor(p.y + dy * dist);

                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;

                this.visibleTiles.add(`${tx},${ty}`);
                this.exploredTiles.add(`${tx},${ty}`);

                const tile = this.map[ty][tx];
                if (tile === TILE.WALL || tile === TILE.DOOR_CLOSED) break;
            }
        }

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const key = `${x},${y}`;
                const fow = this.fowTiles[y][x];

                if (this.visibleTiles.has(key)) {
                    fow.setAlpha(0);
                } else if (this.exploredTiles.has(key)) {
                    fow.setAlpha(0.7);
                } else {
                    fow.setAlpha(1);
                }
            }
        }

        this.gameState.enemies.forEach((enemy, idx) => {
            const sprite = this.entitySprites[`enemy_${idx}`];
            if (sprite) {
                const visible = this.visibleTiles.has(`${enemy.x},${enemy.y}`);
                sprite.setVisible(visible && enemy.hp > 0);
            }
        });
    }

    extractionSuccess() {
        this.gameState.phase = 'extraction';

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);

        // Victory particles
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = GAME_HEIGHT + 20;
            const particle = this.add.circle(x, y, 3, 0x4aaa6a);
            this.tweens.add({
                targets: particle,
                y: -20,
                x: x + (Math.random() - 0.5) * 100,
                alpha: 0,
                duration: 2000 + Math.random() * 1000,
                onComplete: () => particle.destroy()
            });
        }

        this.add.text(GAME_WIDTH / 2, 80, 'EXTRACTION SUCCESSFUL', {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#4a8a6a'
        }).setOrigin(0.5);

        // Calculate efficiency rating
        const gs = this.gameState;
        const totalShots = gs.shotsHit + gs.shotsMissed;
        const accuracy = totalShots > 0 ? Math.round((gs.shotsHit / totalShots) * 100) : 0;
        const efficiency = Math.max(0, 100 - gs.turn - Math.floor(gs.totalDamageTaken / 10) + gs.killCount * 5);
        const rating = efficiency >= 80 ? 'S' : efficiency >= 60 ? 'A' : efficiency >= 40 ? 'B' : efficiency >= 20 ? 'C' : 'D';

        const statsText = [
            `Turns: ${gs.turn}`,
            `Kills: ${gs.killCount}`,
            `Damage Dealt: ${gs.totalDamageDealt}`,
            `Damage Taken: ${gs.totalDamageTaken}`,
            `Accuracy: ${accuracy}%`,
            `Critical Hits: ${gs.critCount}`,
            `Max Kill Streak: ${gs.maxKillStreak}`,
            `Corruption: ${gs.corruption}`
        ].join('\n');

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, statsText, {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#8ac8aa',
            align: 'center'
        }).setOrigin(0.5);

        // Rating display
        const ratingColors = { S: '#ffcc00', A: '#4aaa6a', B: '#6a8aaa', C: '#aa8a6a', D: '#aa6a6a' };
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, `RATING: ${rating}`, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: ratingColors[rating]
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Press SPACE to deploy new clone', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#6a9a8a'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    gameOver() {
        this.gameState.phase = 'gameover';

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x100000, 0.9);

        // Death particles
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                GAME_WIDTH / 2 + (Math.random() - 0.5) * 200,
                GAME_HEIGHT / 2 + (Math.random() - 0.5) * 100,
                4, 0xaa2222
            );
            this.tweens.add({
                targets: particle,
                y: particle.y + 100,
                alpha: 0,
                scale: 0.2,
                duration: 1500 + Math.random() * 1000,
                onComplete: () => particle.destroy()
            });
        }

        this.add.text(GAME_WIDTH / 2, 80, 'CLONE TERMINATED', {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#aa4444'
        }).setOrigin(0.5);

        // Calculate stats
        const gs = this.gameState;
        const totalShots = gs.shotsHit + gs.shotsMissed;
        const accuracy = totalShots > 0 ? Math.round((gs.shotsHit / totalShots) * 100) : 0;

        const statsText = [
            `Survived: ${gs.turn} turns`,
            `Kills: ${gs.killCount}`,
            `Damage Dealt: ${gs.totalDamageDealt}`,
            `Damage Taken: ${gs.totalDamageTaken}`,
            `Accuracy: ${accuracy}%`,
            `Critical Hits: ${gs.critCount}`,
            `Max Kill Streak: ${gs.maxKillStreak}`,
            `Corruption: ${gs.corruption}`
        ].join('\n');

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, statsText, {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#cc8888',
            align: 'center'
        }).setOrigin(0.5);

        // Death rating
        const rating = gs.killCount >= 10 ? 'VALIANT' :
                      gs.killCount >= 5 ? 'WORTHY' :
                      gs.killCount >= 2 ? 'ACCEPTABLE' : 'DISAPPOINTING';
        const ratingColors = {
            'VALIANT': '#ffcc00',
            'WORTHY': '#aa8866',
            'ACCEPTABLE': '#888888',
            'DISAPPOINTING': '#664444'
        };

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, rating, {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: ratingColors[rating]
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Press SPACE to deploy new clone', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#aa6666'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
}

const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: COLORS.BG,
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
