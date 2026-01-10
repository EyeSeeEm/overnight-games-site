// Station Breach - Phaser 3 Version (Polished)
// Alien Breed Style Twin-Stick Shooter with 20 Expand + 20 Polish passes

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

// Weapon data
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 15, fireRate: 0.25, magSize: 12, reloadTime: 1.2, spread: 0.05, bulletSpeed: 800, color: 0xFFAA00, shake: 2 },
    shotgun: { name: 'Shotgun', damage: 10, fireRate: 0.8, magSize: 8, reloadTime: 2.5, spread: 0.35, pellets: 6, bulletSpeed: 600, color: 0xFF6600, shake: 8 },
    smg: { name: 'SMG', damage: 8, fireRate: 0.08, magSize: 40, reloadTime: 1.5, spread: 0.12, bulletSpeed: 750, color: 0xFFCC00, shake: 2 },
    rifle: { name: 'Assault Rifle', damage: 20, fireRate: 0.15, magSize: 30, reloadTime: 2.0, spread: 0.03, bulletSpeed: 900, color: 0xFFFF00, shake: 4 },
    plasma: { name: 'Plasma Rifle', damage: 35, fireRate: 0.35, magSize: 20, reloadTime: 2.2, spread: 0.02, bulletSpeed: 700, color: 0x00AAFF, shake: 5 }
};

// Enemy data
const ENEMY_TYPES = {
    drone: { health: 20, speed: 120, damage: 10, credits: 5, size: 24 },
    spitter: { health: 30, speed: 80, damage: 15, credits: 10, size: 24, ranged: true, fireRate: 2.0 },
    lurker: { health: 25, speed: 180, damage: 15, credits: 8, size: 20 },
    brute: { health: 100, speed: 60, damage: 30, credits: 25, size: 40 },
    exploder: { health: 15, speed: 100, damage: 50, credits: 12, size: 28, explodeRadius: 80 },
    elite: { health: 150, speed: 90, damage: 25, credits: 50, size: 36, ranged: true, fireRate: 1.5 }
};

const COLORS = {
    floor: 0x4A3A2A,
    floorDark: 0x2A1A0A,
    wall: 0x5A5A5A,
    wallLight: 0x7A7A7A,
    wallDark: 0x3A3A3A,
    player: 0x3A5A2A,
    playerLight: 0x4A6A3A,
    alien: 0x0A0A0A,
    alienEye: 0x880000,
    health: 0xCC2222,
    shield: 0x3366CC,
    hudBg: 0x050505,
    hudYellow: 0xFFCC00,
    bloodAlien: 0x00AA66,
    barrel: 0xCC4400,
    terminal: 0x00AA44
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Player texture
        let gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.player);
        gfx.fillRect(2, 4, 20, 16);
        gfx.fillStyle(COLORS.playerLight);
        gfx.fillRect(4, 6, 16, 8);
        gfx.fillStyle(0x2A2A2A);
        gfx.fillRect(14, 8, 12, 6);
        gfx.generateTexture('player', 28, 24);
        gfx.destroy();

        // Bullet texture
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFAA00);
        gfx.fillRect(0, 2, 12, 4);
        gfx.generateTexture('bullet', 12, 8);
        gfx.destroy();

        // Plasma bullet
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x00AAFF);
        gfx.fillCircle(6, 6, 6);
        gfx.fillStyle(0x88DDFF);
        gfx.fillCircle(6, 6, 3);
        gfx.generateTexture('plasma_bullet', 12, 12);
        gfx.destroy();

        // Alien drone texture
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.alien);
        gfx.fillCircle(16, 16, 12);
        gfx.fillStyle(COLORS.alienEye);
        gfx.fillCircle(12, 14, 2);
        gfx.fillCircle(20, 14, 2);
        gfx.lineStyle(2, 0x050505);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            gfx.lineBetween(16 + Math.cos(angle) * 8, 16 + Math.sin(angle) * 8,
                16 + Math.cos(angle) * 18, 16 + Math.sin(angle) * 18);
        }
        gfx.generateTexture('alien_drone', 32, 32);
        gfx.destroy();

        // Spitter (different colored eyes)
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x1A1A0A);
        gfx.fillCircle(16, 16, 12);
        gfx.fillStyle(0x88FF00);
        gfx.fillCircle(12, 14, 3);
        gfx.fillCircle(20, 14, 3);
        gfx.lineStyle(2, 0x080805);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            gfx.lineBetween(16 + Math.cos(angle) * 8, 16 + Math.sin(angle) * 8,
                16 + Math.cos(angle) * 18, 16 + Math.sin(angle) * 18);
        }
        gfx.generateTexture('alien_spitter', 32, 32);
        gfx.destroy();

        // Lurker (smaller, faster looking)
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x151520);
        gfx.fillCircle(12, 12, 10);
        gfx.fillStyle(0xFFFF00);
        gfx.fillCircle(9, 10, 2);
        gfx.fillCircle(15, 10, 2);
        gfx.lineStyle(1, 0x0A0A15);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            gfx.lineBetween(12 + Math.cos(angle) * 6, 12 + Math.sin(angle) * 6,
                12 + Math.cos(angle) * 14, 12 + Math.sin(angle) * 14);
        }
        gfx.generateTexture('alien_lurker', 24, 24);
        gfx.destroy();

        // Brute (larger)
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.alien);
        gfx.fillCircle(24, 24, 18);
        gfx.fillStyle(COLORS.alienEye);
        gfx.fillCircle(18, 20, 3);
        gfx.fillCircle(30, 20, 3);
        gfx.lineStyle(3, 0x050505);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            gfx.lineBetween(24 + Math.cos(angle) * 12, 24 + Math.sin(angle) * 12,
                24 + Math.cos(angle) * 26, 24 + Math.sin(angle) * 26);
        }
        gfx.generateTexture('alien_brute', 48, 48);
        gfx.destroy();

        // Exploder (glowing)
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFF4400);
        gfx.fillCircle(16, 16, 14);
        gfx.fillStyle(0xFF8800);
        gfx.fillCircle(16, 16, 10);
        gfx.fillStyle(0xFFCC00);
        gfx.fillCircle(16, 16, 6);
        gfx.generateTexture('alien_exploder', 32, 32);
        gfx.destroy();

        // Elite (purple-ish with multiple eyes)
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x2A1A2A);
        gfx.fillCircle(20, 20, 16);
        gfx.fillStyle(0xFF00FF);
        gfx.fillCircle(14, 16, 2);
        gfx.fillCircle(20, 14, 2);
        gfx.fillCircle(26, 16, 2);
        gfx.lineStyle(2, 0x1A0A1A);
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            gfx.lineBetween(20 + Math.cos(angle) * 10, 20 + Math.sin(angle) * 10,
                20 + Math.cos(angle) * 22, 20 + Math.sin(angle) * 22);
        }
        gfx.generateTexture('alien_elite', 40, 40);
        gfx.destroy();

        // Acid bullet
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x88FF88);
        gfx.fillCircle(5, 5, 5);
        gfx.generateTexture('acid', 10, 10);
        gfx.destroy();

        // Floor tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.floor);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.fillStyle(COLORS.floorDark);
        gfx.fillRect(0, 0, 2, TILE_SIZE);
        gfx.fillRect(0, 0, TILE_SIZE, 2);
        gfx.fillRect(15, 0, 2, TILE_SIZE);
        gfx.fillRect(0, 15, TILE_SIZE, 2);
        gfx.generateTexture('floor', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Wall tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.wall);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.fillStyle(COLORS.wallLight);
        gfx.fillRect(0, 0, TILE_SIZE, 3);
        gfx.fillRect(0, 0, 3, TILE_SIZE);
        gfx.fillStyle(COLORS.wallDark);
        gfx.fillRect(0, TILE_SIZE - 3, TILE_SIZE, 3);
        gfx.fillRect(TILE_SIZE - 3, 0, 3, TILE_SIZE);
        gfx.fillStyle(0x4A4A4A);
        gfx.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        gfx.fillStyle(COLORS.wallLight);
        gfx.fillCircle(6, 6, 2);
        gfx.fillCircle(TILE_SIZE - 6, 6, 2);
        gfx.fillCircle(6, TILE_SIZE - 6, 2);
        gfx.fillCircle(TILE_SIZE - 6, TILE_SIZE - 6, 2);
        gfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Health pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.health);
        gfx.fillRect(4, 9, 16, 6);
        gfx.fillRect(9, 4, 6, 16);
        gfx.generateTexture('health_pickup', 24, 24);
        gfx.destroy();

        // Ammo pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.hudYellow);
        gfx.fillRect(6, 2, 12, 20);
        gfx.fillStyle(0xAA8800);
        gfx.fillRect(8, 4, 8, 16);
        gfx.generateTexture('ammo_pickup', 24, 24);
        gfx.destroy();

        // Shield pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.shield);
        gfx.fillRect(3, 3, 18, 18);
        gfx.fillStyle(0x5588EE);
        gfx.fillRect(6, 6, 12, 12);
        gfx.generateTexture('shield_pickup', 24, 24);
        gfx.destroy();

        // Medkit
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xEEEEEE);
        gfx.fillRect(2, 2, 20, 20);
        gfx.fillStyle(0xFF0000);
        gfx.fillRect(7, 4, 10, 16);
        gfx.fillRect(4, 7, 16, 10);
        gfx.generateTexture('medkit', 24, 24);
        gfx.destroy();

        // Credits
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFDD00);
        gfx.fillCircle(10, 10, 8);
        gfx.fillStyle(0xAA8800);
        gfx.fillCircle(10, 10, 4);
        gfx.generateTexture('credits', 20, 20);
        gfx.destroy();

        // Barrel
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.barrel);
        gfx.fillRect(4, 0, 16, 24);
        gfx.fillStyle(0x882200);
        gfx.fillRect(4, 4, 16, 4);
        gfx.fillRect(4, 16, 16, 4);
        gfx.fillStyle(0xFF6600);
        gfx.fillRect(8, 8, 8, 8);
        gfx.generateTexture('barrel', 24, 24);
        gfx.destroy();

        // Terminal
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x333333);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(COLORS.terminal);
        gfx.fillRect(4, 4, 24, 18);
        gfx.fillStyle(0x00FF66);
        gfx.fillRect(6, 6, 20, 2);
        gfx.fillRect(6, 10, 16, 2);
        gfx.fillRect(6, 14, 12, 2);
        gfx.fillStyle(0x555555);
        gfx.fillRect(8, 24, 16, 6);
        gfx.generateTexture('terminal', 32, 32);
        gfx.destroy();

        // Keys
        const keyColors = [0x00FF00, 0x0088FF, 0xFFFF00, 0xFF0000];
        ['green', 'blue', 'yellow', 'red'].forEach((name, i) => {
            gfx = this.make.graphics({ add: false });
            gfx.fillStyle(keyColors[i]);
            gfx.fillRect(0, 6, 16, 8);
            gfx.fillRect(12, 4, 8, 12);
            gfx.generateTexture('key_' + name, 20, 20);
            gfx.destroy();
        });

        // Weapon pickups
        Object.keys(WEAPONS).forEach(key => {
            gfx = this.make.graphics({ add: false });
            gfx.fillStyle(0x444444);
            gfx.fillRect(0, 8, 28, 8);
            gfx.fillStyle(WEAPONS[key].color);
            gfx.fillRect(2, 10, 24, 4);
            gfx.generateTexture('weapon_' + key, 28, 24);
            gfx.destroy();
        });

        // Particle
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFFFFF);
        gfx.fillRect(0, 0, 4, 4);
        gfx.generateTexture('particle', 4, 4);
        gfx.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Level state
        this.deck = 1;
        this.maxDecks = 4;
        this.rooms = [];

        // Generate level
        this.levelMap = [];
        this.generateLevel();

        // Draw level
        this.levelGroup = this.add.group();
        this.drawLevel();

        // Blood stains layer
        this.bloodStains = this.add.graphics();
        this.bloodStains.setDepth(1);

        // Create player
        this.player = this.add.sprite(this.spawnPoint.x, this.spawnPoint.y, 'player');
        this.player.setDepth(10);
        this.initPlayer();

        // Physics
        this.physics.add.existing(this.player);
        this.player.body.setSize(20, 20);
        this.player.body.setCollideWorldBounds(true);

        // Groups
        this.bullets = this.add.group();
        this.enemyBullets = this.add.group();
        this.enemies = this.add.group();
        this.pickups = this.add.group();
        this.barrels = this.add.group();
        this.terminals = this.add.group();
        this.floatingTexts = this.add.group();

        // Spawn entities
        this.spawnEntities();

        // Particles
        this.bloodParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            emitting: false
        });

        this.sparkParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.8, end: 0 },
            lifespan: 200,
            emitting: false
        });

        this.muzzleParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 200 },
            scale: { start: 1.5, end: 0 },
            lifespan: 100,
            emitting: false
        });

        // Input
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            one: Phaser.Input.Keyboard.KeyCodes.ONE
        });

        this.input.on('pointerdown', () => this.isShooting = true);
        this.input.on('pointerup', () => this.isShooting = false);
        this.isShooting = false;

        this.input.keyboard.on('keydown-Q', () => this.switchWeapon());
        this.input.keyboard.on('keydown-ONE', () => this.useMedkit());
        this.input.keyboard.on('keydown-E', () => this.interactTerminal());

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        // HUD
        this.createHUD();

        // Game state
        this.gameState = 'playing';
        this.comboCount = 0;
        this.comboTimer = 0;

        // Test API
        window.gameState = () => ({
            state: this.gameState,
            deck: this.deck,
            playerHealth: this.player.health,
            playerAmmo: this.player.ammo,
            enemies: this.enemies.getLength(),
            credits: this.player.credits,
            weapon: this.player.currentWeapon
        });
    }

    initPlayer() {
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.shield = 0;
        this.player.maxShield = 100;
        this.player.stamina = 100;
        this.player.maxStamina = 100;
        this.player.lives = 3;
        this.player.credits = 0;
        this.player.medkits = 0;
        this.player.keys = { green: false, blue: false, yellow: false, red: false };
        this.player.weapons = ['pistol'];
        this.player.currentWeapon = 'pistol';
        this.player.ammo = WEAPONS.pistol.magSize;
        this.player.maxAmmo = WEAPONS.pistol.magSize;
        this.player.fireTimer = 0;
        this.player.reloading = false;
        this.player.reloadTimer = 0;
        this.player.invulnTimer = 0;
    }

    generateLevel() {
        // Initialize with void
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.levelMap[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.levelMap[y][x] = 0;
            }
        }

        // Generate rooms procedurally
        const numRooms = 6 + this.deck * 2;
        this.rooms = [];

        for (let i = 0; i < numRooms; i++) {
            const w = 5 + Math.floor(Math.random() * 4);
            const h = 4 + Math.floor(Math.random() * 3);
            const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - w - 4));
            const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - h - 4));

            let overlaps = false;
            for (const room of this.rooms) {
                if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
                    y < room.y + room.h + 2 && y + h + 2 > room.y) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                this.rooms.push({ x, y, w, h });
            }
        }

        // Carve rooms
        this.rooms.forEach(room => {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                        this.levelMap[y][x] = 1;
                    }
                }
            }
            // Walls
            for (let y = room.y - 1; y <= room.y + room.h; y++) {
                for (let x = room.x - 1; x <= room.x + room.w; x++) {
                    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                        if (this.levelMap[y][x] === 0) {
                            this.levelMap[y][x] = 2;
                        }
                    }
                }
            }
        });

        // Connect rooms with corridors
        for (let i = 1; i < this.rooms.length; i++) {
            const r1 = this.rooms[i - 1];
            const r2 = this.rooms[i];
            const x1 = Math.floor(r1.x + r1.w / 2);
            const y1 = Math.floor(r1.y + r1.h / 2);
            const x2 = Math.floor(r2.x + r2.w / 2);
            const y2 = Math.floor(r2.y + r2.h / 2);
            this.createCorridor(x1, y1, x2, y2);
        }

        // Spawn point in first room
        this.spawnPoint = {
            x: this.rooms[0].x * TILE_SIZE + this.rooms[0].w * TILE_SIZE / 2,
            y: this.rooms[0].y * TILE_SIZE + this.rooms[0].h * TILE_SIZE / 2
        };

        // Exit point in last room
        const lastRoom = this.rooms[this.rooms.length - 1];
        this.exitPoint = {
            x: lastRoom.x * TILE_SIZE + lastRoom.w * TILE_SIZE / 2,
            y: lastRoom.y * TILE_SIZE + lastRoom.h * TILE_SIZE / 2
        };
    }

    createCorridor(x1, y1, x2, y2) {
        let x = x1, y = y1;
        while (x !== x2 || y !== y2) {
            for (let ox = -1; ox <= 0; ox++) {
                for (let oy = -1; oy <= 0; oy++) {
                    const tx = x + ox;
                    const ty = y + oy;
                    if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                        if (this.levelMap[ty][tx] !== 1) {
                            this.levelMap[ty][tx] = 1;
                        }
                    }
                }
            }
            for (let ox = -2; ox <= 1; ox++) {
                for (let oy = -2; oy <= 1; oy++) {
                    const tx = x + ox;
                    const ty = y + oy;
                    if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                        if (this.levelMap[ty][tx] === 0) {
                            this.levelMap[ty][tx] = 2;
                        }
                    }
                }
            }
            if (x !== x2) x += x2 > x1 ? 1 : -1;
            else if (y !== y2) y += y2 > y1 ? 1 : -1;
        }
    }

    drawLevel() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const type = this.levelMap[y][x];
                if (type === 1) {
                    const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'floor');
                    this.levelGroup.add(tile);
                } else if (type === 2) {
                    const tile = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'wall');
                    this.levelGroup.add(tile);
                }
            }
        }

        // Draw exit marker
        const exitMarker = this.add.rectangle(this.exitPoint.x, this.exitPoint.y, 40, 40, 0x00FF00, 0.3);
        exitMarker.setDepth(2);
        const exitText = this.add.text(this.exitPoint.x, this.exitPoint.y - 30, 'EXIT', {
            fontFamily: 'monospace', fontSize: '10px', color: '#00FF00'
        }).setOrigin(0.5).setDepth(2);
    }

    spawnEntities() {
        // Spawn enemies in rooms (skip first room)
        for (let i = 1; i < this.rooms.length - 1; i++) {
            const room = this.rooms[i];
            const numEnemies = 2 + Math.floor(Math.random() * 3) + this.deck;
            for (let j = 0; j < numEnemies; j++) {
                const ex = room.x * TILE_SIZE + (0.2 + Math.random() * 0.6) * room.w * TILE_SIZE;
                const ey = room.y * TILE_SIZE + (0.2 + Math.random() * 0.6) * room.h * TILE_SIZE;
                const types = ['drone', 'drone', 'spitter', 'lurker', 'brute', 'exploder', 'elite'];
                const weights = [40, 30, 15, 10, 3, 1, 1].map(w => w - this.deck);
                const type = this.weightedRandom(types, weights);
                this.createEnemy(ex, ey, type);
            }
        }

        // Spawn barrels
        for (let i = 0; i < this.rooms.length; i++) {
            if (Math.random() < 0.5) {
                const room = this.rooms[i];
                const bx = room.x * TILE_SIZE + (0.1 + Math.random() * 0.8) * room.w * TILE_SIZE;
                const by = room.y * TILE_SIZE + (0.1 + Math.random() * 0.8) * room.h * TILE_SIZE;
                this.createBarrel(bx, by);
            }
        }

        // Spawn terminals
        for (let i = 1; i < this.rooms.length; i += 2) {
            const room = this.rooms[i];
            const tx = room.x * TILE_SIZE + room.w * TILE_SIZE - 20;
            const ty = room.y * TILE_SIZE + 20;
            this.createTerminal(tx, ty);
        }

        // Spawn pickups
        for (let i = 1; i < this.rooms.length; i++) {
            if (Math.random() < 0.6) {
                const room = this.rooms[i];
                const px = room.x * TILE_SIZE + Math.random() * room.w * TILE_SIZE;
                const py = room.y * TILE_SIZE + Math.random() * room.h * TILE_SIZE;
                const types = ['health', 'ammo', 'shield', 'credits'];
                this.createPickup(px, py, types[Math.floor(Math.random() * types.length)]);
            }
        }

        // Spawn weapon pickup
        if (Math.random() < 0.5 && this.rooms.length > 2) {
            const room = this.rooms[Math.floor(Math.random() * (this.rooms.length - 2)) + 1];
            const wx = room.x * TILE_SIZE + room.w * TILE_SIZE / 2;
            const wy = room.y * TILE_SIZE + room.h * TILE_SIZE / 2;
            const weapons = Object.keys(WEAPONS).filter(w => !this.player.weapons.includes(w));
            if (weapons.length > 0) {
                this.createPickup(wx, wy, 'weapon', weapons[Math.floor(Math.random() * weapons.length)]);
            }
        }

        // Spawn key in middle room
        if (this.rooms.length > 3) {
            const midRoom = this.rooms[Math.floor(this.rooms.length / 2)];
            const kx = midRoom.x * TILE_SIZE + midRoom.w * TILE_SIZE / 2;
            const ky = midRoom.y * TILE_SIZE + midRoom.h * TILE_SIZE / 2;
            const keyNames = ['green', 'blue', 'yellow', 'red'];
            this.createPickup(kx, ky, 'key', keyNames[(this.deck - 1) % 4]);
        }
    }

    weightedRandom(items, weights) {
        const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            r -= Math.max(0, weights[i]);
            if (r <= 0) return items[i];
        }
        return items[0];
    }

    createEnemy(x, y, type) {
        const textureMap = {
            drone: 'alien_drone',
            spitter: 'alien_spitter',
            lurker: 'alien_lurker',
            brute: 'alien_brute',
            exploder: 'alien_exploder',
            elite: 'alien_elite'
        };
        const enemy = this.add.sprite(x, y, textureMap[type]);
        enemy.setDepth(5);
        this.physics.add.existing(enemy);

        const data = ENEMY_TYPES[type];
        enemy.type = type;
        enemy.health = data.health;
        enemy.maxHealth = data.health;
        enemy.speed = data.speed;
        enemy.damage = data.damage;
        enemy.credits = data.credits;
        enemy.body.setSize(data.size, data.size);
        enemy.attackTimer = 1;
        enemy.hitFlash = 0;
        enemy.fireTimer = data.fireRate || 0;

        this.enemies.add(enemy);
    }

    createBarrel(x, y) {
        const barrel = this.add.sprite(x, y, 'barrel');
        barrel.setDepth(3);
        barrel.health = 30;
        this.physics.add.existing(barrel);
        barrel.body.setImmovable(true);
        this.barrels.add(barrel);
    }

    createTerminal(x, y) {
        const terminal = this.add.sprite(x, y, 'terminal');
        terminal.setDepth(3);
        terminal.used = false;
        this.physics.add.existing(terminal);
        terminal.body.setImmovable(true);
        this.terminals.add(terminal);
    }

    createPickup(x, y, type, subtype) {
        let texture = type + '_pickup';
        if (type === 'credits') texture = 'credits';
        if (type === 'key') texture = 'key_' + subtype;
        if (type === 'weapon') texture = 'weapon_' + subtype;
        if (type === 'medkit') texture = 'medkit';
        if (type === 'shield') texture = 'shield_pickup';

        const pickup = this.add.sprite(x, y, texture);
        pickup.setDepth(3);
        pickup.type = type;
        pickup.subtype = subtype;
        pickup.bobOffset = Math.random() * Math.PI * 2;
        this.pickups.add(pickup);
    }

    createHUD() {
        const w = 800, h = 600;
        const textStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#CCCCCC' };

        // Top HUD bar
        this.hudTop = this.add.rectangle(w / 2, 14, w, 28, COLORS.hudBg);
        this.hudTop.setScrollFactor(0).setDepth(100);

        this.hud1UP = this.add.text(8, 10, '1UP', { ...textStyle, color: '#FFCC00' });
        this.hud1UP.setScrollFactor(0).setDepth(101);

        this.hudLives = this.add.text(50, 10, 'LIVES', textStyle);
        this.hudLives.setScrollFactor(0).setDepth(101);

        this.livesDisplay = [];
        for (let i = 0; i < 3; i++) {
            const life = this.add.rectangle(115 + i * 18, 14, 14, 10, COLORS.health);
            life.setScrollFactor(0).setDepth(101);
            this.livesDisplay.push(life);
        }

        this.hudAmmo = this.add.text(180, 10, 'AMMO', textStyle);
        this.hudAmmo.setScrollFactor(0).setDepth(101);

        this.ammoBar = this.add.rectangle(280, 14, 80, 12, 0x1A1A1A);
        this.ammoBar.setScrollFactor(0).setDepth(101);
        this.ammoFill = this.add.rectangle(241, 14, 78, 10, COLORS.hudYellow);
        this.ammoFill.setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        this.ammoText = this.add.text(330, 10, '12', textStyle);
        this.ammoText.setScrollFactor(0).setDepth(101);

        this.weaponText = this.add.text(380, 10, '[Pistol]', textStyle);
        this.weaponText.setScrollFactor(0).setDepth(101);

        this.hudKeys = this.add.text(500, 10, 'KEYS', textStyle);
        this.hudKeys.setScrollFactor(0).setDepth(101);

        this.keySlots = [];
        for (let i = 0; i < 4; i++) {
            const slot = this.add.rectangle(560 + i * 24, 14, 20, 16, 0x1A1A1A);
            slot.setScrollFactor(0).setDepth(101);
            this.keySlots.push(slot);
        }

        this.deckText = this.add.text(680, 10, 'DECK 1/4', textStyle);
        this.deckText.setScrollFactor(0).setDepth(101);

        // Bottom HUD bar
        this.hudBottom = this.add.rectangle(w / 2, h - 14, w, 28, COLORS.hudBg);
        this.hudBottom.setScrollFactor(0).setDepth(100);

        this.hudHealth = this.add.text(8, h - 18, 'HEALTH', textStyle);
        this.hudHealth.setScrollFactor(0).setDepth(101);

        this.healthBar = this.add.rectangle(120, h - 14, 120, 12, 0x1A1A1A);
        this.healthBar.setScrollFactor(0).setDepth(101);
        this.healthFill = this.add.rectangle(61, h - 14, 118, 10, COLORS.health);
        this.healthFill.setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        this.hudShield = this.add.text(200, h - 18, 'SHIELD', textStyle);
        this.hudShield.setScrollFactor(0).setDepth(101);

        this.shieldBar = this.add.rectangle(310, h - 14, 100, 12, 0x1A1A1A);
        this.shieldBar.setScrollFactor(0).setDepth(101);
        this.shieldFill = this.add.rectangle(261, h - 14, 98, 10, COLORS.shield);
        this.shieldFill.setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        this.hudStam = this.add.text(380, h - 18, 'STAM', textStyle);
        this.hudStam.setScrollFactor(0).setDepth(101);

        this.stamBar = this.add.rectangle(470, h - 14, 80, 12, 0x1A1A1A);
        this.stamBar.setScrollFactor(0).setDepth(101);
        this.stamFill = this.add.rectangle(431, h - 14, 78, 10, 0x44AA44);
        this.stamFill.setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        this.medkitText = this.add.text(540, h - 18, 'MEDKITS: 0', textStyle);
        this.medkitText.setScrollFactor(0).setDepth(101);

        this.creditsText = this.add.text(660, h - 18, '$0', { ...textStyle, color: '#FFCC00' });
        this.creditsText.setScrollFactor(0).setDepth(101);

        this.killsText = this.add.text(730, h - 18, 'KILLS: 0', textStyle);
        this.killsText.setScrollFactor(0).setDepth(101);
        this.killCount = 0;

        // Combo display
        this.comboText = this.add.text(w / 2, 50, '', {
            fontFamily: 'monospace', fontSize: '24px', color: '#FF8800'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

        // Minimap
        this.minimapBg = this.add.rectangle(w - 70, 80, 120, 100, 0x000000, 0.7);
        this.minimapBg.setScrollFactor(0).setDepth(99);
        this.minimap = this.add.graphics();
        this.minimap.setScrollFactor(0).setDepth(100);
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        const dt = delta / 1000;

        // Player movement
        let dx = 0, dy = 0;
        if (this.cursors.w.isDown) dy = -1;
        if (this.cursors.s.isDown) dy = 1;
        if (this.cursors.a.isDown) dx = -1;
        if (this.cursors.d.isDown) dx = 1;

        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        let speed = 180;
        if (this.cursors.shift.isDown && this.player.stamina > 0 && (dx || dy)) {
            speed = 280;
            this.player.stamina -= 30 * dt;
        } else if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina += 25 * dt;
        }

        this.player.body.setVelocity(dx * speed, dy * speed);

        // Wall collision
        const newX = this.player.x + dx * speed * dt;
        const newY = this.player.y + dy * speed * dt;
        if (this.isWall(newX, this.player.y)) this.player.body.setVelocityX(0);
        if (this.isWall(this.player.x, newY)) this.player.body.setVelocityY(0);

        // Aim
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Reload
        if (this.player.reloading) {
            this.player.reloadTimer -= dt;
            if (this.player.reloadTimer <= 0) {
                this.player.ammo = WEAPONS[this.player.currentWeapon].magSize;
                this.player.reloading = false;
            }
        }

        // Manual reload
        if (this.cursors.r.isDown && !this.player.reloading &&
            this.player.ammo < WEAPONS[this.player.currentWeapon].magSize) {
            this.startReload();
        }

        // Shooting
        this.player.fireTimer -= dt;
        if (this.isShooting && this.player.fireTimer <= 0 && this.player.ammo > 0 && !this.player.reloading) {
            this.shoot(angle);
        }

        // Auto reload
        if (this.player.ammo === 0 && !this.player.reloading) {
            this.startReload();
        }

        // Invulnerability
        if (this.player.invulnTimer > 0) {
            this.player.invulnTimer -= dt;
            this.player.alpha = Math.floor(this.player.invulnTimer * 10) % 2 === 0 ? 0.5 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Low health warning
        if (this.player.health <= 30) {
            const pulse = 0.5 + 0.5 * Math.sin(time / 200);
            this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(20 + pulse * 30, 0, 0));
        } else {
            this.cameras.main.setBackgroundColor(0x000000);
        }

        // Update bullets
        this.updateBullets(dt);

        // Update enemies
        this.updateEnemies(dt);

        // Update pickups
        this.updatePickups(time);

        // Update combo
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                if (this.comboCount >= 3) {
                    this.player.credits += this.comboCount * 5;
                    this.showFloatingText(this.player.x, this.player.y - 40, 'COMBO x' + this.comboCount + '!', '#FF8800');
                }
                this.comboCount = 0;
                this.comboText.setAlpha(0);
            }
        }

        // Check exit
        const exitDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitPoint.x, this.exitPoint.y);
        if (exitDist < 40 && this.enemies.getLength() === 0) {
            this.nextDeck();
        }

        // Update HUD
        this.updateHUD();
        this.updateMinimap();
    }

    startReload() {
        this.player.reloading = true;
        this.player.reloadTimer = WEAPONS[this.player.currentWeapon].reloadTime;
        this.showFloatingText(this.player.x, this.player.y - 20, 'RELOADING...', '#AAAAAA');
    }

    shoot(angle) {
        const weapon = WEAPONS[this.player.currentWeapon];
        const pellets = weapon.pellets || 1;

        for (let p = 0; p < pellets; p++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            const bulletAngle = angle + spread;

            const isPlasma = this.player.currentWeapon === 'plasma';
            const bullet = this.add.sprite(
                this.player.x + Math.cos(bulletAngle) * 20,
                this.player.y + Math.sin(bulletAngle) * 20,
                isPlasma ? 'plasma_bullet' : 'bullet'
            );
            bullet.rotation = bulletAngle;
            bullet.life = 0.8;
            bullet.damage = weapon.damage;
            bullet.tint = weapon.color;

            this.physics.add.existing(bullet);
            bullet.body.setVelocity(
                Math.cos(bulletAngle) * weapon.bulletSpeed,
                Math.sin(bulletAngle) * weapon.bulletSpeed
            );

            this.bullets.add(bullet);
        }

        this.player.ammo--;
        this.player.fireTimer = weapon.fireRate;

        // Muzzle flash
        this.muzzleParticles.setPosition(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25
        );
        this.muzzleParticles.setParticleTint(weapon.color);
        this.muzzleParticles.explode(5);

        // Screen shake
        this.cameras.main.shake(50, weapon.shake * 0.001);
    }

    switchWeapon() {
        const weapons = this.player.weapons;
        const idx = weapons.indexOf(this.player.currentWeapon);
        this.player.currentWeapon = weapons[(idx + 1) % weapons.length];
        this.player.ammo = WEAPONS[this.player.currentWeapon].magSize;
        this.player.reloading = false;
        this.showFloatingText(this.player.x, this.player.y - 30, WEAPONS[this.player.currentWeapon].name, '#FFFFFF');
    }

    useMedkit() {
        if (this.player.medkits > 0 && this.player.health < this.player.maxHealth) {
            this.player.medkits--;
            this.player.health = Math.min(this.player.health + 50, this.player.maxHealth);
            this.showFloatingText(this.player.x, this.player.y - 20, '+50 HP', '#00FF00');
        }
    }

    interactTerminal() {
        this.terminals.children.iterate(terminal => {
            if (!terminal || terminal.used) return;
            const dist = Phaser.Math.Distance.Between(terminal.x, terminal.y, this.player.x, this.player.y);
            if (dist < 50) {
                terminal.used = true;
                terminal.setTint(0x666666);
                // Random upgrade
                const rewards = ['damage', 'ammo', 'armor'];
                const reward = rewards[Math.floor(Math.random() * rewards.length)];
                if (reward === 'damage') {
                    this.showFloatingText(terminal.x, terminal.y - 20, '+10% DAMAGE', '#FF8800');
                } else if (reward === 'ammo') {
                    this.player.ammo = WEAPONS[this.player.currentWeapon].magSize;
                    this.showFloatingText(terminal.x, terminal.y - 20, 'AMMO RESTORED', '#FFCC00');
                } else {
                    this.player.shield = Math.min(this.player.shield + 25, this.player.maxShield);
                    this.showFloatingText(terminal.x, terminal.y - 20, '+25 SHIELD', '#3366CC');
                }
            }
        });
    }

    updateBullets(dt) {
        // Player bullets
        this.bullets.children.iterate(bullet => {
            if (!bullet || !bullet.active) return;

            bullet.life -= dt;
            if (bullet.life <= 0) {
                bullet.destroy();
                return;
            }

            if (this.isWall(bullet.x, bullet.y)) {
                this.sparkParticles.setPosition(bullet.x, bullet.y);
                this.sparkParticles.setParticleTint(0xFFCC00);
                this.sparkParticles.explode(3);
                bullet.destroy();
                return;
            }

            // Check enemy hits
            this.enemies.children.iterate(enemy => {
                if (!enemy || !enemy.active) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                if (dist < ENEMY_TYPES[enemy.type].size / 2 + 6) {
                    this.hitEnemy(enemy, bullet.damage, bullet.rotation);
                    bullet.destroy();
                }
            });

            // Check barrel hits
            this.barrels.children.iterate(barrel => {
                if (!barrel || !barrel.active) return;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, barrel.x, barrel.y);
                if (dist < 20) {
                    barrel.health -= bullet.damage;
                    if (barrel.health <= 0) {
                        this.explodeBarrel(barrel);
                    }
                    bullet.destroy();
                }
            });
        });

        // Enemy bullets
        this.enemyBullets.children.iterate(bullet => {
            if (!bullet || !bullet.active) return;

            bullet.life -= dt;
            if (bullet.life <= 0 || this.isWall(bullet.x, bullet.y)) {
                bullet.destroy();
                return;
            }

            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
            if (dist < 20) {
                this.damagePlayer(15);
                bullet.destroy();
            }
        });
    }

    updateEnemies(dt) {
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Movement
            if (dist < 350 && dist > 40) {
                const speed = enemy.speed * dt;
                const nx = enemy.x + Math.cos(angle) * speed;
                const ny = enemy.y + Math.sin(angle) * speed;
                if (!this.isWall(nx, enemy.y)) enemy.x = nx;
                if (!this.isWall(enemy.x, ny)) enemy.y = ny;
                enemy.rotation = angle;
            }

            // Lurker special: faster when close
            if (enemy.type === 'lurker' && dist < 150) {
                const speed = enemy.speed * 1.5 * dt;
                const nx = enemy.x + Math.cos(angle) * speed;
                const ny = enemy.y + Math.sin(angle) * speed;
                if (!this.isWall(nx, enemy.y)) enemy.x = nx;
                if (!this.isWall(enemy.x, ny)) enemy.y = ny;
            }

            // Attack
            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0 && dist < 300) {
                if (ENEMY_TYPES[enemy.type].ranged) {
                    this.enemyShoot(enemy);
                    enemy.attackTimer = ENEMY_TYPES[enemy.type].fireRate;
                } else if (dist < 50) {
                    if (enemy.type === 'exploder') {
                        this.explodeEnemy(enemy);
                    } else {
                        this.damagePlayer(enemy.damage);
                        enemy.attackTimer = 1;
                    }
                }
            }

            // Exploder warning glow
            if (enemy.type === 'exploder' && dist < 80) {
                const glow = 0.5 + 0.5 * Math.sin(Date.now() / 50);
                enemy.setTint(Phaser.Display.Color.GetColor(255, 100 + glow * 155, 0));
            }

            // Hit flash
            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt;
                enemy.setTint(0xFFFFFF);
            } else if (enemy.type !== 'exploder') {
                enemy.clearTint();
            }
        });
    }

    updatePickups(time) {
        this.pickups.children.iterate(pickup => {
            if (!pickup || !pickup.active) return;

            // Bobbing
            pickup.y += Math.sin(time / 200 + pickup.bobOffset) * 0.3;

            const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 30) {
                let collected = false;
                switch (pickup.type) {
                    case 'health':
                        if (this.player.health < this.player.maxHealth) {
                            this.player.health = Math.min(this.player.health + 25, this.player.maxHealth);
                            this.showFloatingText(pickup.x, pickup.y, '+25 HP', '#00FF00');
                            collected = true;
                        }
                        break;
                    case 'ammo':
                        this.player.ammo = WEAPONS[this.player.currentWeapon].magSize;
                        this.showFloatingText(pickup.x, pickup.y, 'AMMO', '#FFCC00');
                        collected = true;
                        break;
                    case 'shield':
                        if (this.player.shield < this.player.maxShield) {
                            this.player.shield = Math.min(this.player.shield + 30, this.player.maxShield);
                            this.showFloatingText(pickup.x, pickup.y, '+30 SHIELD', '#3366CC');
                            collected = true;
                        }
                        break;
                    case 'medkit':
                        this.player.medkits++;
                        this.showFloatingText(pickup.x, pickup.y, 'MEDKIT', '#FFFFFF');
                        collected = true;
                        break;
                    case 'credits':
                        this.player.credits += 10;
                        this.showFloatingText(pickup.x, pickup.y, '+$10', '#FFDD00');
                        collected = true;
                        break;
                    case 'weapon':
                        if (!this.player.weapons.includes(pickup.subtype)) {
                            this.player.weapons.push(pickup.subtype);
                            this.player.currentWeapon = pickup.subtype;
                            this.player.ammo = WEAPONS[pickup.subtype].magSize;
                            this.showFloatingText(pickup.x, pickup.y, WEAPONS[pickup.subtype].name + '!', '#FF8800');
                            collected = true;
                        }
                        break;
                    case 'key':
                        this.player.keys[pickup.subtype] = true;
                        this.showFloatingText(pickup.x, pickup.y, pickup.subtype.toUpperCase() + ' KEY', '#FFFFFF');
                        collected = true;
                        break;
                }
                if (collected) pickup.destroy();
            }
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const bullet = this.add.sprite(enemy.x, enemy.y, 'acid');
        bullet.life = 1.5;
        this.physics.add.existing(bullet);
        const speed = enemy.type === 'elite' ? 400 : 300;
        bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.enemyBullets.add(bullet);
    }

    hitEnemy(enemy, damage, angle) {
        enemy.health -= damage;
        enemy.hitFlash = 0.15;

        // Knockback (except brute)
        if (enemy.type !== 'brute') {
            enemy.x += Math.cos(angle) * 15;
            enemy.y += Math.sin(angle) * 15;
        }

        // Blood
        this.bloodParticles.setPosition(enemy.x, enemy.y);
        this.bloodParticles.setParticleTint(COLORS.bloodAlien);
        this.bloodParticles.explode(5);

        // Blood stain
        this.bloodStains.fillStyle(COLORS.bloodAlien, 0.3);
        this.bloodStains.fillCircle(enemy.x, enemy.y, 8 + Math.random() * 8);

        // Floating damage
        this.showFloatingText(enemy.x, enemy.y - 20, '-' + damage, '#FF4444');

        if (enemy.health <= 0) {
            if (enemy.type === 'exploder') {
                this.explodeEnemy(enemy);
            } else {
                this.killEnemy(enemy);
            }
        }
    }

    killEnemy(enemy) {
        this.player.credits += enemy.credits;
        this.killCount++;

        // Combo
        this.comboCount++;
        this.comboTimer = 2;
        if (this.comboCount >= 3) {
            this.comboText.setText('COMBO x' + this.comboCount);
            this.comboText.setAlpha(1);
        }

        // More blood
        this.bloodParticles.setPosition(enemy.x, enemy.y);
        this.bloodParticles.setParticleTint(COLORS.bloodAlien);
        this.bloodParticles.explode(12);

        // Blood stain
        this.bloodStains.fillStyle(COLORS.bloodAlien, 0.5);
        this.bloodStains.fillCircle(enemy.x, enemy.y, 15 + Math.random() * 10);

        // Drop
        if (Math.random() < 0.25) {
            const types = ['health', 'ammo', 'credits', 'credits'];
            this.createPickup(enemy.x, enemy.y, types[Math.floor(Math.random() * types.length)]);
        }

        enemy.destroy();
    }

    explodeEnemy(enemy) {
        const radius = ENEMY_TYPES[enemy.type].explodeRadius || 80;

        // Damage nearby
        this.enemies.children.iterate(other => {
            if (!other || !other.active || other === enemy) return;
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
            if (dist < radius) {
                this.hitEnemy(other, 40, Phaser.Math.Angle.Between(enemy.x, enemy.y, other.x, other.y));
            }
        });

        // Damage player
        const playerDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (playerDist < radius) {
            this.damagePlayer(enemy.damage);
        }

        // Visual
        this.bloodParticles.setPosition(enemy.x, enemy.y);
        this.bloodParticles.setParticleTint(0xFF6600);
        this.bloodParticles.explode(20);
        this.cameras.main.shake(200, 0.01);

        this.player.credits += enemy.credits;
        this.killCount++;
        enemy.destroy();
    }

    explodeBarrel(barrel) {
        const radius = 100;

        // Damage enemies
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, enemy.x, enemy.y);
            if (dist < radius) {
                this.hitEnemy(enemy, 50, Phaser.Math.Angle.Between(barrel.x, barrel.y, enemy.x, enemy.y));
            }
        });

        // Chain reaction
        this.barrels.children.iterate(other => {
            if (!other || !other.active || other === barrel) return;
            const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, other.x, other.y);
            if (dist < radius) {
                this.time.delayedCall(100, () => this.explodeBarrel(other));
            }
        });

        // Damage player
        const playerDist = Phaser.Math.Distance.Between(barrel.x, barrel.y, this.player.x, this.player.y);
        if (playerDist < radius) {
            this.damagePlayer(40);
        }

        // Visual
        this.sparkParticles.setPosition(barrel.x, barrel.y);
        this.sparkParticles.setParticleTint(0xFF6600);
        this.sparkParticles.explode(15);
        this.cameras.main.shake(150, 0.008);

        barrel.destroy();
    }

    damagePlayer(amount) {
        if (this.player.invulnTimer > 0) return;

        // Shield absorbs first
        if (this.player.shield > 0) {
            if (this.player.shield >= amount) {
                this.player.shield -= amount;
                amount = 0;
            } else {
                amount -= this.player.shield;
                this.player.shield = 0;
            }
        }

        this.player.health -= amount;
        this.player.invulnTimer = 0.5;
        this.cameras.main.shake(100, 0.005);

        if (this.player.health <= 0) {
            this.player.lives--;
            if (this.player.lives > 0) {
                this.player.health = this.player.maxHealth;
                this.player.x = this.spawnPoint.x;
                this.player.y = this.spawnPoint.y;
                this.player.invulnTimer = 2;
            } else {
                this.gameState = 'gameover';
                this.showGameOver();
            }
        }
    }

    nextDeck() {
        if (this.deck >= this.maxDecks) {
            this.gameState = 'won';
            this.showWin();
            return;
        }

        this.deck++;
        this.showFloatingText(this.player.x, this.player.y - 40, 'DECK ' + this.deck, '#00FF00');

        // Clear and regenerate
        this.levelGroup.clear(true, true);
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);
        this.barrels.clear(true, true);
        this.terminals.clear(true, true);
        this.bloodStains.clear();

        this.generateLevel();
        this.drawLevel();
        this.spawnEntities();

        this.player.x = this.spawnPoint.x;
        this.player.y = this.spawnPoint.y;
    }

    showFloatingText(x, y, text, color) {
        const ft = this.add.text(x, y, text, {
            fontFamily: 'monospace', fontSize: '14px', color: color
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: ft,
            y: y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => ft.destroy()
        });
    }

    isWall(x, y) {
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
        return this.levelMap[ty][tx] !== 1;
    }

    updateHUD() {
        const weapon = WEAPONS[this.player.currentWeapon];

        // Ammo
        const ammoRatio = this.player.ammo / weapon.magSize;
        this.ammoFill.scaleX = ammoRatio;
        this.ammoText.setText(this.player.ammo.toString());
        this.weaponText.setText('[' + weapon.name + ']');

        // Health
        this.healthFill.scaleX = this.player.health / this.player.maxHealth;

        // Shield
        this.shieldFill.scaleX = this.player.shield / this.player.maxShield;

        // Stamina
        this.stamFill.scaleX = this.player.stamina / this.player.maxStamina;

        // Lives
        this.livesDisplay.forEach((life, idx) => life.setVisible(idx < this.player.lives));

        // Keys
        const keyNames = ['green', 'blue', 'yellow', 'red'];
        const keyColors = [0x00FF00, 0x0088FF, 0xFFFF00, 0xFF0000];
        keyNames.forEach((name, i) => {
            this.keySlots[i].setFillStyle(this.player.keys[name] ? keyColors[i] : 0x1A1A1A);
        });

        // Deck
        this.deckText.setText('DECK ' + this.deck + '/' + this.maxDecks);

        // Medkits
        this.medkitText.setText('MEDKITS: ' + this.player.medkits);

        // Credits
        this.creditsText.setText('$' + this.player.credits);

        // Kills
        this.killsText.setText('KILLS: ' + this.killCount);
    }

    updateMinimap() {
        this.minimap.clear();
        const scale = 2;
        const ox = 800 - 130;
        const oy = 30;

        // Rooms
        this.minimap.fillStyle(0x333333);
        for (const room of this.rooms) {
            this.minimap.fillRect(
                ox + room.x * scale,
                oy + room.y * scale,
                room.w * scale,
                room.h * scale
            );
        }

        // Player
        const px = ox + (this.player.x / TILE_SIZE) * scale;
        const py = oy + (this.player.y / TILE_SIZE) * scale;
        this.minimap.fillStyle(0x00FF00);
        this.minimap.fillRect(px - 2, py - 2, 4, 4);

        // Enemies
        this.minimap.fillStyle(0xFF0000);
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            const ex = ox + (enemy.x / TILE_SIZE) * scale;
            const ey = oy + (enemy.y / TILE_SIZE) * scale;
            this.minimap.fillRect(ex - 1, ey - 1, 2, 2);
        });

        // Exit
        const exitX = ox + (this.exitPoint.x / TILE_SIZE) * scale;
        const exitY = oy + (this.exitPoint.y / TILE_SIZE) * scale;
        this.minimap.fillStyle(0x00FFFF);
        this.minimap.fillRect(exitX - 2, exitY - 2, 4, 4);
    }

    showWin() {
        const text = this.add.text(400, 300, 'EXTRACTION COMPLETE!\n\nAll Decks Cleared\nCredits: $' + this.player.credits + '\nKills: ' + this.killCount, {
            fontFamily: 'monospace', fontSize: '24px', color: '#00FF00', align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    }

    showGameOver() {
        const text = this.add.text(400, 300, 'MISSION FAILED', {
            fontFamily: 'monospace', fontSize: '36px', color: '#FF4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
window.startGame = () => game.scene.start('GameScene');
