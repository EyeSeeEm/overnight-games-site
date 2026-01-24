// Station Breach - Alien Breed Clone
// Phaser 3 Implementation

const TILE_SIZE = 32;
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

// Color palette matching Alien Breed
const COLORS = {
    FLOOR_DARK: 0x2a2a2a,
    FLOOR_METAL: 0x4a4a4a,
    FLOOR_BROWN: 0x5c4a3a,
    WALL: 0x3a3a3a,
    WALL_DETAIL: 0x555555,
    BLOOD_ALIEN: 0x00ff88,
    BLOOD_HUMAN: 0xcc0000,
    WARNING: 0xff8800,
    EMERGENCY: 0xff0000,
    TERMINAL: 0x00ffff,
    HEALTH: 0xff4444,
    SHIELD: 0x4488ff,
    AMMO: 0xffdd00,
    KEYCARD_BLUE: 0x0088ff,
    PLAYER: 0x44aa44,
    DRONE: 0x1a1a1a,
    BRUTE: 0x2a1a1a,
    QUEEN: 0x3a1a3a,
    MUZZLE_FLASH: 0xffaa00,
    BULLET: 0xffff00
};

// Game state
let gameState = {
    currentLevel: 1,
    maxLevel: 3,
    score: 0,
    kills: 0,
    keycards: { blue: false },
    weapons: ['pistol'],
    currentWeapon: 0,
    ammo: { shells: 0, rifle: 0, fuel: 0 },
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 50,
    stamina: 100,
    maxStamina: 100,
    gameTime: 0,
    roomsCleared: new Set(),
    isPaused: false,
    debugMode: false
};

// Weapon definitions
const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: 15,
        fireRate: 250,
        magSize: 12,
        reloadTime: 950,
        projectileSpeed: 800,
        spread: 3,
        range: 500,
        infinite: true,
        ammoType: null,
        screenShake: 2
    },
    shotgun: {
        name: 'Shotgun',
        damage: 8,
        pellets: 6,
        fireRate: 833,
        magSize: 8,
        reloadTime: 2250,
        projectileSpeed: 600,
        spread: 25,
        range: 250,
        infinite: false,
        ammoType: 'shells',
        screenShake: 4
    },
    rifle: {
        name: 'Rifle',
        damage: 20,
        fireRate: 167,
        magSize: 30,
        reloadTime: 1750,
        projectileSpeed: 850,
        spread: 5,
        range: 600,
        infinite: false,
        ammoType: 'rifle',
        screenShake: 1.5
    },
    flamethrower: {
        name: 'Flamethrower',
        damage: 5,
        fireRate: 50,
        magSize: 100,
        reloadTime: 2750,
        projectileSpeed: 400,
        spread: 15,
        range: 200,
        infinite: false,
        ammoType: 'fuel',
        screenShake: 0.5
    }
};

// Enemy definitions
const ENEMIES = {
    drone: {
        hp: 20,
        damage: 10,
        speed: 120,
        detectionRange: 300,
        attackCooldown: 1000,
        size: 24,
        color: COLORS.DRONE,
        score: 10
    },
    brute: {
        hp: 100,
        damage: 30,
        speed: 60,
        chargeSpeed: 250,
        detectionRange: 250,
        attackCooldown: 1500,
        size: 48,
        color: COLORS.BRUTE,
        score: 50
    },
    queen: {
        hp: 500,
        damage: 25,
        speed: 80,
        chargeSpeed: 150,
        detectionRange: 400,
        attackCooldown: 2000,
        size: 96,
        color: COLORS.QUEEN,
        score: 500
    }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 160, height/2 - 25, 320, 50);

        const loadingText = this.add.text(width/2, height/2 - 50, 'LOADING...', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff88, 1);
            progressBar.fillRect(width/2 - 150, height/2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Generate all textures procedurally
        this.createTextures();
    }

    createTextures() {
        // Player texture (green marine)
        this.createPlayerTexture();

        // Enemy textures
        this.createEnemyTextures();

        // Tile textures
        this.createTileTextures();

        // Item textures
        this.createItemTextures();

        // Projectile textures
        this.createProjectileTextures();

        // UI textures
        this.createUITextures();
    }

    createPlayerTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Body (green suit)
        g.fillStyle(0x3a7a3a);
        g.fillCircle(16, 16, 12);

        // Lighter center
        g.fillStyle(0x4a9a4a);
        g.fillCircle(16, 14, 8);

        // Visor
        g.fillStyle(0x88ccff);
        g.fillRect(12, 10, 8, 4);

        // Gun arm direction indicator
        g.fillStyle(0x2a5a2a);
        g.fillRect(20, 14, 10, 4);

        g.generateTexture('player', 32, 32);
        g.destroy();
    }

    createEnemyTextures() {
        // Drone (spider-like alien)
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x1a1a1a);
        g.fillCircle(12, 12, 10);
        // Legs
        g.lineStyle(2, 0x2a2a2a);
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + Math.PI / 4;
            g.beginPath();
            g.moveTo(12, 12);
            g.lineTo(12 + Math.cos(angle) * 12, 12 + Math.sin(angle) * 12);
            g.stroke();
        }
        // Eyes
        g.fillStyle(0xff0000);
        g.fillCircle(9, 9, 2);
        g.fillCircle(15, 9, 2);
        g.generateTexture('drone', 24, 24);
        g.destroy();

        // Brute (larger alien)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x2a1a1a);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0x3a2a2a);
        g.fillCircle(24, 20, 14);
        // Mandibles
        g.fillStyle(0x4a3a3a);
        g.fillTriangle(10, 30, 24, 40, 20, 25);
        g.fillTriangle(38, 30, 24, 40, 28, 25);
        // Eyes
        g.fillStyle(0xff3300);
        g.fillCircle(18, 16, 4);
        g.fillCircle(30, 16, 4);
        g.generateTexture('brute', 48, 48);
        g.destroy();

        // Queen (boss)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x3a1a3a);
        g.fillCircle(48, 48, 40);
        g.fillStyle(0x4a2a4a);
        g.fillCircle(48, 40, 30);
        // Crown-like protrusions
        g.fillStyle(0x5a3a5a);
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI/2 + (i - 2) * 0.4;
            g.fillTriangle(
                48 + Math.cos(angle) * 25, 48 + Math.sin(angle) * 25,
                48 + Math.cos(angle) * 45, 48 + Math.sin(angle) * 45,
                48 + Math.cos(angle + 0.2) * 35, 48 + Math.sin(angle + 0.2) * 35
            );
        }
        // Multiple eyes
        g.fillStyle(0xff00ff);
        g.fillCircle(35, 35, 6);
        g.fillCircle(61, 35, 6);
        g.fillCircle(48, 30, 4);
        g.generateTexture('queen', 96, 96);
        g.destroy();
    }

    createTileTextures() {
        let g;

        // Floor tile (metal grate pattern)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.FLOOR_BROWN);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x4a3a2a);
        g.fillRect(2, 2, 28, 28);
        // Grate lines
        g.lineStyle(1, 0x3a2a1a);
        g.beginPath();
        g.moveTo(8, 0); g.lineTo(8, 32);
        g.moveTo(16, 0); g.lineTo(16, 32);
        g.moveTo(24, 0); g.lineTo(24, 32);
        g.moveTo(0, 8); g.lineTo(32, 8);
        g.moveTo(0, 16); g.lineTo(32, 16);
        g.moveTo(0, 24); g.lineTo(32, 24);
        g.stroke();
        // Rivets
        g.fillStyle(0x5a4a3a);
        g.fillCircle(4, 4, 2);
        g.fillCircle(28, 4, 2);
        g.fillCircle(4, 28, 2);
        g.fillCircle(28, 28, 2);
        g.generateTexture('floor', 32, 32);
        g.destroy();

        // Wall tile
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(COLORS.WALL_DETAIL);
        g.fillRect(2, 2, 28, 12);
        g.fillStyle(0x2a2a2a);
        g.fillRect(4, 16, 24, 12);
        // Metal details
        g.lineStyle(1, 0x4a4a4a);
        g.strokeRect(1, 1, 30, 30);
        g.generateTexture('wall', 32, 32);
        g.destroy();

        // Blue floor (duct area)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x2a3a4a);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x3a4a5a);
        g.fillRect(2, 2, 28, 28);
        g.lineStyle(1, 0x4a5a6a);
        g.beginPath();
        g.moveTo(16, 0); g.lineTo(16, 32);
        g.moveTo(0, 16); g.lineTo(32, 16);
        g.stroke();
        g.generateTexture('floor_blue', 32, 32);
        g.destroy();

        // Door (normal)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x555555);
        g.fillRect(0, 0, 64, 32);
        g.fillStyle(0x666666);
        g.fillRect(4, 4, 24, 24);
        g.fillRect(36, 4, 24, 24);
        g.lineStyle(2, 0x888888);
        g.strokeRect(1, 1, 62, 30);
        g.generateTexture('door', 64, 32);
        g.destroy();

        // Door (blue keycard)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x3355aa);
        g.fillRect(0, 0, 64, 32);
        g.fillStyle(0x4466bb);
        g.fillRect(4, 4, 24, 24);
        g.fillRect(36, 4, 24, 24);
        g.lineStyle(2, COLORS.KEYCARD_BLUE);
        g.strokeRect(1, 1, 62, 30);
        g.generateTexture('door_blue', 64, 32);
        g.destroy();
    }

    createItemTextures() {
        let g;

        // Health pack
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(COLORS.HEALTH);
        g.fillRect(12, 6, 8, 20);
        g.fillRect(6, 12, 20, 8);
        g.generateTexture('health_pack', 32, 32);
        g.destroy();

        // Ammo box
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x4a4a2a);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(COLORS.AMMO);
        g.fillRect(8, 10, 16, 4);
        g.fillStyle(0x3a3a1a);
        g.fillRect(6, 18, 20, 4);
        g.generateTexture('ammo_box', 32, 32);
        g.destroy();

        // Blue keycard
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.KEYCARD_BLUE);
        g.fillRect(4, 8, 24, 16);
        g.fillStyle(0xffffff);
        g.fillRect(8, 12, 8, 8);
        g.lineStyle(1, 0x0066cc);
        g.strokeRect(4, 8, 24, 16);
        g.generateTexture('keycard_blue', 32, 32);
        g.destroy();

        // Weapon pickup
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x666666);
        g.fillRect(4, 12, 24, 8);
        g.fillStyle(0x444444);
        g.fillRect(20, 10, 8, 12);
        g.fillStyle(0x888888);
        g.fillRect(4, 14, 16, 4);
        g.generateTexture('weapon_pickup', 32, 32);
        g.destroy();

        // Crate (destructible)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x6a5a4a);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(2, 0x4a3a2a);
        g.strokeRect(2, 2, 28, 28);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(32, 32);
        g.moveTo(32, 0); g.lineTo(0, 32);
        g.stroke();
        g.generateTexture('crate', 32, 32);
        g.destroy();

        // Barrel (explosive)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x884422);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xaa5533);
        g.fillCircle(16, 14, 10);
        g.fillStyle(COLORS.WARNING);
        g.fillTriangle(16, 8, 10, 20, 22, 20);
        g.generateTexture('barrel', 32, 32);
        g.destroy();
    }

    createProjectileTextures() {
        let g;

        // Bullet
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.BULLET);
        g.fillRect(0, 2, 8, 4);
        g.fillStyle(0xffffff);
        g.fillRect(6, 3, 2, 2);
        g.generateTexture('bullet', 8, 8);
        g.destroy();

        // Shotgun pellet
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffaa00);
        g.fillCircle(3, 3, 3);
        g.generateTexture('pellet', 6, 6);
        g.destroy();

        // Flame particle
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xff6600);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffaa00);
        g.fillCircle(8, 8, 5);
        g.fillStyle(0xffff00);
        g.fillCircle(8, 8, 2);
        g.generateTexture('flame', 16, 16);
        g.destroy();

        // Muzzle flash
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(COLORS.MUZZLE_FLASH);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffffff);
        g.fillCircle(8, 8, 4);
        g.generateTexture('muzzle_flash', 16, 16);
        g.destroy();

        // Acid spit (queen)
        g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x88ff00);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xaaff44);
        g.fillCircle(6, 5, 3);
        g.generateTexture('acid', 12, 12);
        g.destroy();
    }

    createUITextures() {
        // Crosshair
        let g = this.make.graphics({ x: 0, y: 0, add: false });
        g.lineStyle(2, 0x00ff00, 0.8);
        g.strokeCircle(16, 16, 10);
        g.beginPath();
        g.moveTo(16, 0); g.lineTo(16, 8);
        g.moveTo(16, 24); g.lineTo(16, 32);
        g.moveTo(0, 16); g.lineTo(8, 16);
        g.moveTo(24, 16); g.lineTo(32, 16);
        g.stroke();
        g.generateTexture('crosshair', 32, 32);
        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Title background
        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        // Alien mouth effect (like reference)
        const mouth = this.add.graphics();
        mouth.fillStyle(0x1a1a1a);
        mouth.fillEllipse(cx, cy - 50, 300, 400);
        mouth.fillStyle(0x000000);
        mouth.fillEllipse(cx, cy - 30, 200, 300);

        // Teeth
        mouth.fillStyle(0xcccccc);
        for (let i = 0; i < 8; i++) {
            const x = cx - 80 + i * 23;
            mouth.fillTriangle(x, cy - 120, x + 10, cy - 120, x + 5, cy - 60);
            mouth.fillTriangle(x, cy + 60, x + 10, cy + 60, x + 5, cy);
        }

        // Title text
        this.add.text(cx, 80, 'STATION', {
            fontFamily: 'monospace',
            fontSize: '64px',
            fill: '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 140, 'BREACH', {
            fontFamily: 'monospace',
            fontSize: '64px',
            fill: '#888888',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, 200, 'An Alien Breed Clone', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#00ff88'
        }).setOrigin(0.5);

        // Menu options
        const startBtn = this.add.text(cx, cy + 150, '[ START GAME ]', {
            fontFamily: 'monospace',
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        const controlsText = this.add.text(cx, cy + 200, 'WASD: Move | Mouse: Aim | LMB: Shoot | R: Reload | Q: Debug', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        // Button hover effects
        startBtn.on('pointerover', () => startBtn.setFill('#00ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffffff'));
        startBtn.on('pointerdown', () => this.startGame());

        // Press any key
        this.add.text(cx, GAME_HEIGHT - 50, 'Press SPACE or CLICK to start', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#444444'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
        this.input.once('pointerdown', () => this.startGame());
    }

    startGame() {
        // Reset game state
        gameState = {
            currentLevel: 1,
            maxLevel: 3,
            score: 0,
            kills: 0,
            keycards: { blue: false },
            weapons: ['pistol'],
            currentWeapon: 0,
            ammo: { shells: 0, rifle: 0, fuel: 0 },
            health: 100,
            maxHealth: 100,
            shield: 0,
            maxShield: 50,
            stamina: 100,
            maxStamina: 100,
            gameTime: 0,
            roomsCleared: new Set(),
            isPaused: false,
            debugMode: false
        };
        this.scene.start('GameScene');
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game systems
        this.setupWorld();
        this.setupPlayer();
        this.setupWeapons();
        this.setupEnemies();
        this.setupItems();
        this.setupCollisions();
        this.setupControls();
        this.setupCamera();
        this.setupHUD();
        this.setupAudio();

        // Generate level
        this.generateLevel(gameState.currentLevel);

        // Floating text group for pickups
        this.floatingTexts = this.add.group();

        // Last ammo warning time
        this.lastAmmoWarning = 0;

        // Out of ammo message text
        this.outOfAmmoText = null;
    }

    setupWorld() {
        // Physics world bounds will be set per level
        this.physics.world.setBounds(0, 0, 2000, 2000);

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.floors = this.add.group();
        this.doors = this.physics.add.staticGroup();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.items = this.physics.add.group();
        this.destructibles = this.physics.add.group();

        // Room tracking
        this.rooms = [];
        this.currentRoom = null;
    }

    setupPlayer() {
        // Player sprite
        this.player = this.physics.add.sprite(400, 400, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(24, 24);

        // Player stats
        this.player.hp = gameState.health;
        this.player.maxHp = gameState.maxHealth;
        this.player.shield = gameState.shield;
        this.player.speed = 180;
        this.player.sprintSpeed = 270;
        this.player.isSprinting = false;
        this.player.isReloading = false;
        this.player.reloadTimer = null;
        this.player.invulnerable = false;

        // Weapon state
        this.player.currentMag = WEAPONS.pistol.magSize;
        this.player.lastFired = 0;
    }

    setupWeapons() {
        this.currentWeaponData = WEAPONS[gameState.weapons[gameState.currentWeapon]];
    }

    setupEnemies() {
        // Enemy AI update
        this.enemyUpdateTimer = this.time.addEvent({
            delay: 100,
            callback: this.updateEnemyAI,
            callbackScope: this,
            loop: true
        });
    }

    setupItems() {
        // Items will be placed during level generation
    }

    setupCollisions() {
        // Player collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.doors, this.handleDoorCollision, null, this);
        this.physics.add.collider(this.player, this.destructibles);

        // Enemy collisions
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.enemies, this.destructibles);

        // Bullet collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.collider(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.bullets, this.destructibles, this.bulletHitDestructible, null, this);

        // Enemy bullet collisions
        this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.collider(this.enemyBullets, this.walls, this.bulletHitWall, null, this);

        // Item pickups
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

        // Enemy melee damage
        this.physics.add.overlap(this.player, this.enemies, this.enemyMeleePlayer, null, this);
    }

    setupControls() {
        // Keyboard
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            reload: 'R',
            interact: 'E',
            sprint: 'SHIFT',
            switchWeapon: 'Q',
            pause: 'ESC',
            debug: 'Q',
            space: 'SPACE'
        });

        // Mouse
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isFiring = true;
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) {
                this.isFiring = false;
            }
        });

        // Weapon switch with scroll
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (deltaY > 0) {
                this.switchWeapon(1);
            } else {
                this.switchWeapon(-1);
            }
        });

        // Debug toggle
        this.input.keyboard.on('keydown-Q', () => {
            gameState.debugMode = !gameState.debugMode;
            if (this.debugOverlay) {
                this.debugOverlay.setVisible(gameState.debugMode);
            }
        });

        // Reload
        this.input.keyboard.on('keydown-R', () => {
            this.reloadWeapon();
        });

        // Interact/Open doors with space
        this.input.keyboard.on('keydown-SPACE', () => {
            this.tryOpenDoor();
        });

        this.input.keyboard.on('keydown-E', () => {
            this.tryOpenDoor();
        });
    }

    setupCamera() {
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);

        // Crosshair
        this.crosshair = this.add.sprite(0, 0, 'crosshair');
        this.crosshair.setDepth(100);
        this.crosshair.setScrollFactor(0);

        // Create darkness/lighting overlay
        this.setupLighting();
    }

    setupLighting() {
        // Vision parameters
        this.visionRange = 350;
        this.visionAngle = Math.PI / 3; // 60 degrees

        // Create render texture for lighting
        this.lightRT = this.make.renderTexture({
            width: GAME_WIDTH,
            height: GAME_HEIGHT
        }, false);

        // Create the darkness layer as an image
        this.darknessLayer = this.add.image(GAME_WIDTH/2, GAME_HEIGHT/2, this.lightRT.texture);
        this.darknessLayer.setDepth(45);
        this.darknessLayer.setScrollFactor(0);
        this.darknessLayer.setBlendMode(Phaser.BlendModes.MULTIPLY);

        // Create light texture for flashlight effect
        this.createLightTexture();
    }

    createLightTexture() {
        // Create a radial gradient light texture
        const size = 400;
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Draw concentric circles for gradient
        for (let r = size; r > 0; r -= 4) {
            const brightness = Math.floor(255 * (r / size));
            const color = (brightness << 16) | (brightness << 8) | brightness;
            g.fillStyle(color);
            g.fillCircle(size, size, r);
        }

        g.generateTexture('light_cone', size * 2, size * 2);
        g.destroy();

        // Create flashlight cone texture
        const fg = this.make.graphics({ x: 0, y: 0, add: false });
        const coneWidth = 300;
        const coneLength = 400;

        for (let i = 20; i > 0; i--) {
            const brightness = Math.floor(255 * (i / 20));
            const color = (brightness << 16) | (brightness << 8) | brightness;
            fg.fillStyle(color);

            const spread = (20 - i) * 0.02;
            fg.beginPath();
            fg.moveTo(coneWidth/2, coneLength);
            fg.lineTo(coneWidth/2 - coneLength * Math.tan(Math.PI/6 + spread), 0);
            fg.lineTo(coneWidth/2 + coneLength * Math.tan(Math.PI/6 + spread), 0);
            fg.closePath();
            fg.fill();
        }

        fg.generateTexture('flashlight', coneWidth, coneLength);
        fg.destroy();
    }

    updateLighting() {
        // Clear render texture with dark color
        this.lightRT.clear();
        this.lightRT.fill(0x222233); // Slight blue tint for atmosphere

        // Draw ambient light at player position (screen center)
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;

        // Add ambient glow around player
        this.lightRT.draw('light_cone', centerX - 200, centerY - 200);

        // Draw flashlight cone in aiming direction
        const angle = this.player.rotation;
        const flashlightDist = 150;
        const flashX = centerX + Math.cos(angle) * flashlightDist - 150;
        const flashY = centerY + Math.sin(angle) * flashlightDist - 200;

        // We need to rotate the flashlight - for now just use the ambient light
        // The ambient light provides visibility around the player
    }

    setupHUD() {
        // HUD container (fixed to camera)
        this.hudContainer = this.add.container(0, 0);
        this.hudContainer.setScrollFactor(0);
        this.hudContainer.setDepth(50);

        // Top bar background
        const topBar = this.add.rectangle(GAME_WIDTH/2, 20, GAME_WIDTH, 40, 0x000000, 0.7);
        this.hudContainer.add(topBar);

        // 1UP label
        const oneUp = this.add.text(20, 10, '1UP', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ff0000'
        });
        this.hudContainer.add(oneUp);

        // Lives label
        this.add.text(100, 10, 'LIVES', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(50);

        // Health bar
        this.healthBarBg = this.add.rectangle(220, 20, 150, 16, 0x333333);
        this.healthBar = this.add.rectangle(220, 20, 150, 16, COLORS.HEALTH);
        this.healthBarBg.setScrollFactor(0).setDepth(50);
        this.healthBar.setScrollFactor(0).setDepth(50);

        // AMMO label
        this.add.text(350, 10, 'AMMO', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(50);

        // Ammo bar
        this.ammoBarBg = this.add.rectangle(450, 20, 150, 16, 0x333333);
        this.ammoBar = this.add.rectangle(450, 20, 150, 16, COLORS.AMMO);
        this.ammoBarBg.setScrollFactor(0).setDepth(50);
        this.ammoBar.setScrollFactor(0).setDepth(50);

        // KEYS label
        this.add.text(580, 10, 'KEYS', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(50);

        // Keycard indicators
        this.keycardBlue = this.add.rectangle(650, 20, 20, 16, 0x333333);
        this.keycardBlue.setScrollFactor(0).setDepth(50);

        // Score
        this.scoreText = this.add.text(GAME_WIDTH - 150, 10, 'SCORE: 0', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(50);

        // Level indicator
        this.levelText = this.add.text(GAME_WIDTH - 150, 25, 'LEVEL: 1', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#888888'
        }).setScrollFactor(0).setDepth(50);

        // Bottom bar - weapon info
        const bottomBar = this.add.rectangle(100, GAME_HEIGHT - 30, 200, 50, 0x000000, 0.7);
        bottomBar.setScrollFactor(0).setDepth(50);

        this.weaponText = this.add.text(20, GAME_HEIGHT - 45, 'PISTOL', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(50);

        this.ammoText = this.add.text(20, GAME_HEIGHT - 25, '12/12 | INF', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#ffdd00'
        }).setScrollFactor(0).setDepth(50);

        // Door prompt
        this.doorPrompt = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 100, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(50).setVisible(false);

        // Debug overlay
        this.debugOverlay = this.add.text(GAME_WIDTH - 250, 60, '', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#00ff00',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0).setDepth(100).setVisible(false);

        // Minimap
        this.setupMinimap();
    }

    setupMinimap() {
        // Minimap in top-right corner
        this.minimapContainer = this.add.container(GAME_WIDTH - 120, 60);
        this.minimapContainer.setScrollFactor(0);
        this.minimapContainer.setDepth(50);

        // Minimap background
        const minimapBg = this.add.rectangle(0, 0, 100, 100, 0x000000, 0.8);
        minimapBg.setStrokeStyle(2, 0x444444);
        this.minimapContainer.add(minimapBg);

        // Minimap graphics for rooms
        this.minimapGraphics = this.add.graphics();
        this.minimapGraphics.setScrollFactor(0);
        this.minimapGraphics.setDepth(51);
    }

    setupAudio() {
        // Audio would be added here if we had audio files
        // For now, we'll simulate with visual feedback
    }

    generateLevel(levelNum) {
        // Clear existing level
        this.walls.clear(true, true);
        this.floors.clear(true, true);
        this.doors.clear(true, true);
        this.enemies.clear(true, true);
        this.items.clear(true, true);
        this.destructibles.clear(true, true);
        this.rooms = [];

        // Reset keycard for new level
        gameState.keycards.blue = false;

        // Level configurations
        const levelConfigs = {
            1: { rooms: 12, theme: 'cargo', enemies: ['drone'], bossRoom: false },
            2: { rooms: 16, theme: 'engineering', enemies: ['drone', 'brute'], bossRoom: false },
            3: { rooms: 12, theme: 'hive', enemies: ['drone', 'brute'], bossRoom: true }
        };

        const config = levelConfigs[levelNum];

        // Generate rooms in a grid pattern
        this.generateRooms(config);

        // Place player in starting room
        const startRoom = this.rooms[0];
        this.player.setPosition(startRoom.centerX, startRoom.centerY);

        // Update world bounds
        const bounds = this.calculateLevelBounds();
        this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
        this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    generateRooms(config) {
        const roomSize = { min: 8, max: 14 };
        const corridorWidth = 3;

        // Grid-based room placement
        const gridSize = Math.ceil(Math.sqrt(config.rooms));
        const cellSize = 20 * TILE_SIZE;

        let roomId = 0;
        const roomGrid = [];

        for (let gy = 0; gy < gridSize && roomId < config.rooms; gy++) {
            roomGrid[gy] = [];
            for (let gx = 0; gx < gridSize && roomId < config.rooms; gx++) {
                const roomW = Phaser.Math.Between(roomSize.min, roomSize.max);
                const roomH = Phaser.Math.Between(roomSize.min, roomSize.max);

                const roomX = gx * cellSize + TILE_SIZE * 2;
                const roomY = gy * cellSize + TILE_SIZE * 2;

                const room = {
                    id: roomId,
                    x: roomX,
                    y: roomY,
                    width: roomW * TILE_SIZE,
                    height: roomH * TILE_SIZE,
                    centerX: roomX + (roomW * TILE_SIZE) / 2,
                    centerY: roomY + (roomH * TILE_SIZE) / 2,
                    gridX: gx,
                    gridY: gy,
                    cleared: roomId === 0, // Starting room is cleared
                    hasKeycard: false,
                    isExit: false,
                    isBossRoom: false,
                    enemies: [],
                    doors: []
                };

                // Special room assignments
                if (roomId === Math.floor(config.rooms / 2)) {
                    room.hasKeycard = true;
                }
                if (roomId === config.rooms - 1) {
                    if (config.bossRoom) {
                        room.isBossRoom = true;
                    } else {
                        room.isExit = true;
                    }
                }

                this.rooms.push(room);
                roomGrid[gy][gx] = room;

                // Create room geometry
                this.createRoom(room, config.theme);

                roomId++;
            }
        }

        // Connect rooms with corridors
        this.connectRooms(roomGrid, config);

        // Place items and enemies
        this.populateRooms(config);
    }

    createRoom(room, theme) {
        const { x, y, width, height } = room;

        // Floor tiles
        for (let ty = 0; ty < height; ty += TILE_SIZE) {
            for (let tx = 0; tx < width; tx += TILE_SIZE) {
                const floorType = theme === 'hive' ? 'floor_blue' : 'floor';
                const floor = this.add.sprite(x + tx + TILE_SIZE/2, y + ty + TILE_SIZE/2, floorType);
                this.floors.add(floor);
            }
        }

        // Walls
        // Top wall
        for (let tx = 0; tx < width; tx += TILE_SIZE) {
            const wall = this.walls.create(x + tx + TILE_SIZE/2, y - TILE_SIZE/2, 'wall');
            wall.setImmovable(true);
            wall.body.setSize(TILE_SIZE, TILE_SIZE);
        }
        // Bottom wall
        for (let tx = 0; tx < width; tx += TILE_SIZE) {
            const wall = this.walls.create(x + tx + TILE_SIZE/2, y + height + TILE_SIZE/2, 'wall');
            wall.setImmovable(true);
            wall.body.setSize(TILE_SIZE, TILE_SIZE);
        }
        // Left wall
        for (let ty = -TILE_SIZE; ty <= height; ty += TILE_SIZE) {
            const wall = this.walls.create(x - TILE_SIZE/2, y + ty + TILE_SIZE/2, 'wall');
            wall.setImmovable(true);
            wall.body.setSize(TILE_SIZE, TILE_SIZE);
        }
        // Right wall
        for (let ty = -TILE_SIZE; ty <= height; ty += TILE_SIZE) {
            const wall = this.walls.create(x + width + TILE_SIZE/2, y + ty + TILE_SIZE/2, 'wall');
            wall.setImmovable(true);
            wall.body.setSize(TILE_SIZE, TILE_SIZE);
        }

        // Add some crates and barrels
        if (!room.cleared && room.id !== 0) {
            const numObjects = Phaser.Math.Between(1, 4);
            for (let i = 0; i < numObjects; i++) {
                const objX = x + Phaser.Math.Between(TILE_SIZE * 2, width - TILE_SIZE * 2);
                const objY = y + Phaser.Math.Between(TILE_SIZE * 2, height - TILE_SIZE * 2);

                if (Math.random() < 0.7) {
                    const crate = this.destructibles.create(objX, objY, 'crate');
                    crate.hp = 20;
                    crate.setImmovable(true);
                } else {
                    const barrel = this.destructibles.create(objX, objY, 'barrel');
                    barrel.hp = 10;
                    barrel.isExplosive = true;
                    barrel.setImmovable(true);
                }
            }
        }
    }

    connectRooms(roomGrid, config) {
        // Connect adjacent rooms with corridors and doors
        for (let gy = 0; gy < roomGrid.length; gy++) {
            for (let gx = 0; gx < roomGrid[gy].length; gx++) {
                const room = roomGrid[gy][gx];
                if (!room) continue;

                // Connect to right neighbor
                if (gx < roomGrid[gy].length - 1 && roomGrid[gy][gx + 1]) {
                    const neighbor = roomGrid[gy][gx + 1];
                    this.createCorridor(room, neighbor, 'horizontal', config);
                }

                // Connect to bottom neighbor
                if (gy < roomGrid.length - 1 && roomGrid[gy + 1] && roomGrid[gy + 1][gx]) {
                    const neighbor = roomGrid[gy + 1][gx];
                    this.createCorridor(room, neighbor, 'vertical', config);
                }
            }
        }
    }

    createCorridor(room1, room2, direction, config) {
        const corridorWidth = 3 * TILE_SIZE;

        if (direction === 'horizontal') {
            // Horizontal corridor
            const startX = room1.x + room1.width;
            const endX = room2.x;
            const midY = Math.min(room1.centerY, room2.centerY);

            // Create floor for corridor
            for (let tx = startX; tx < endX; tx += TILE_SIZE) {
                for (let ty = -TILE_SIZE; ty <= TILE_SIZE; ty += TILE_SIZE) {
                    const floor = this.add.sprite(tx + TILE_SIZE/2, midY + ty, 'floor');
                    this.floors.add(floor);
                }
            }

            // Remove wall sections where corridor connects
            // Add door in the middle
            const doorX = (startX + endX) / 2;
            const isKeyDoor = room2.hasKeycard || room2.isExit || room2.isBossRoom;
            const doorTexture = isKeyDoor ? 'door_blue' : 'door';

            const door = this.doors.create(doorX, midY, doorTexture);
            door.setImmovable(true);
            door.body.setSize(64, 32);
            door.requiresKey = isKeyDoor;
            door.isOpen = false;
            door.targetRoom = room2;

            room1.doors.push(door);
            room2.doors.push(door);

        } else {
            // Vertical corridor
            const startY = room1.y + room1.height;
            const endY = room2.y;
            const midX = Math.min(room1.centerX, room2.centerX);

            // Create floor for corridor
            for (let ty = startY; ty < endY; ty += TILE_SIZE) {
                for (let tx = -TILE_SIZE; tx <= TILE_SIZE; tx += TILE_SIZE) {
                    const floor = this.add.sprite(midX + tx, ty + TILE_SIZE/2, 'floor');
                    this.floors.add(floor);
                }
            }

            // Add door
            const doorY = (startY + endY) / 2;
            const isKeyDoor = room2.hasKeycard || room2.isExit || room2.isBossRoom;
            const doorTexture = isKeyDoor ? 'door_blue' : 'door';

            const door = this.doors.create(midX, doorY, doorTexture);
            door.setImmovable(true);
            door.body.setSize(32, 64);
            door.requiresKey = isKeyDoor;
            door.isOpen = false;
            door.targetRoom = room2;
            door.setAngle(90);

            room1.doors.push(door);
            room2.doors.push(door);
        }
    }

    populateRooms(config) {
        for (const room of this.rooms) {
            if (room.id === 0) continue; // Skip starting room

            // Add enemies
            if (!room.cleared) {
                const numEnemies = Phaser.Math.Between(3, 6);
                for (let i = 0; i < numEnemies; i++) {
                    const enemyType = Phaser.Math.RND.pick(config.enemies);
                    const ex = room.x + Phaser.Math.Between(TILE_SIZE * 2, room.width - TILE_SIZE * 2);
                    const ey = room.y + Phaser.Math.Between(TILE_SIZE * 2, room.height - TILE_SIZE * 2);

                    const enemy = this.createEnemy(enemyType, ex, ey);
                    enemy.roomId = room.id;
                    room.enemies.push(enemy);
                }
            }

            // Add keycard
            if (room.hasKeycard) {
                const keycard = this.items.create(room.centerX, room.centerY, 'keycard_blue');
                keycard.itemType = 'keycard';
                keycard.keycardColor = 'blue';
                keycard.setDepth(5);
            }

            // Add weapons (level specific)
            if (room.id === 3 && gameState.currentLevel === 1) {
                const weapon = this.items.create(room.centerX + 50, room.centerY, 'weapon_pickup');
                weapon.itemType = 'weapon';
                weapon.weaponType = 'shotgun';
                weapon.setDepth(5);
            }

            if (room.id === 5 && gameState.currentLevel === 2) {
                const weapon = this.items.create(room.centerX + 50, room.centerY, 'weapon_pickup');
                weapon.itemType = 'weapon';
                weapon.weaponType = 'rifle';
                weapon.setDepth(5);
            }

            // Random health/ammo
            if (Math.random() < 0.3) {
                const hx = room.x + Phaser.Math.Between(TILE_SIZE, room.width - TILE_SIZE);
                const hy = room.y + Phaser.Math.Between(TILE_SIZE, room.height - TILE_SIZE);
                const health = this.items.create(hx, hy, 'health_pack');
                health.itemType = 'health';
                health.amount = 25;
                health.setDepth(5);
            }

            if (Math.random() < 0.4) {
                const ax = room.x + Phaser.Math.Between(TILE_SIZE, room.width - TILE_SIZE);
                const ay = room.y + Phaser.Math.Between(TILE_SIZE, room.height - TILE_SIZE);
                const ammo = this.items.create(ax, ay, 'ammo_box');
                ammo.itemType = 'ammo';
                ammo.ammoType = Phaser.Math.RND.pick(['shells', 'rifle', 'fuel']);
                ammo.amount = Phaser.Math.Between(10, 30);
                ammo.setDepth(5);
            }

            // Boss room
            if (room.isBossRoom) {
                const queen = this.createEnemy('queen', room.centerX, room.centerY);
                queen.roomId = room.id;
                queen.isBoss = true;
                room.enemies.push(queen);
            }
        }
    }

    createEnemy(type, x, y) {
        const data = ENEMIES[type];
        const enemy = this.enemies.create(x, y, type);

        enemy.enemyType = type;
        enemy.hp = data.hp;
        enemy.maxHp = data.hp;
        enemy.damage = data.damage;
        enemy.speed = data.speed;
        enemy.detectionRange = data.detectionRange;
        enemy.attackCooldown = data.attackCooldown;
        enemy.lastAttack = 0;
        enemy.isAlerted = false;
        enemy.scoreValue = data.score;

        if (type === 'brute' || type === 'queen') {
            enemy.chargeSpeed = data.chargeSpeed;
            enemy.isCharging = false;
            enemy.chargeTarget = null;
        }

        enemy.body.setSize(data.size * 0.8, data.size * 0.8);

        return enemy;
    }

    calculateLevelBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const room of this.rooms) {
            minX = Math.min(minX, room.x - TILE_SIZE * 3);
            minY = Math.min(minY, room.y - TILE_SIZE * 3);
            maxX = Math.max(maxX, room.x + room.width + TILE_SIZE * 3);
            maxY = Math.max(maxY, room.y + room.height + TILE_SIZE * 3);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    update(time, delta) {
        if (gameState.isPaused) return;

        // Update game time
        gameState.gameTime += delta / 1000;

        // Player input
        this.handlePlayerInput(time);

        // Update player rotation to face mouse
        this.updatePlayerRotation();

        // Update crosshair position
        this.updateCrosshair();

        // Check room transitions
        this.checkRoomTransition();

        // Update HUD
        this.updateHUD();

        // Update debug overlay
        if (gameState.debugMode) {
            this.updateDebugOverlay();
        }

        // Check for firing
        if (this.isFiring) {
            this.fireWeapon(time);
        }

        // Regenerate stamina
        if (!this.player.isSprinting && gameState.stamina < gameState.maxStamina) {
            gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 20 * delta / 1000);
        }

        // Update minimap
        this.updateMinimap();

        // Check door proximity for prompt
        this.checkDoorProximity();

        // Update lighting/darkness
        this.updateLighting();
    }

    handlePlayerInput(time) {
        const speed = this.keys.sprint.isDown && gameState.stamina > 0
            ? this.player.sprintSpeed
            : this.player.speed;

        // Sprint stamina drain
        if (this.keys.sprint.isDown && (this.keys.up.isDown || this.keys.down.isDown ||
            this.keys.left.isDown || this.keys.right.isDown)) {
            this.player.isSprinting = true;
            gameState.stamina = Math.max(0, gameState.stamina - 25 * this.game.loop.delta / 1000);
        } else {
            this.player.isSprinting = false;
        }

        // Movement
        let vx = 0;
        let vy = 0;

        if (this.keys.up.isDown) vy = -speed;
        if (this.keys.down.isDown) vy = speed;
        if (this.keys.left.isDown) vx = -speed;
        if (this.keys.right.isDown) vx = speed;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);
    }

    updatePlayerRotation() {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
        this.player.setRotation(angle);
    }

    updateCrosshair() {
        const pointer = this.input.activePointer;
        this.crosshair.setPosition(pointer.x, pointer.y);
    }

    fireWeapon(time) {
        const weapon = this.currentWeaponData;

        // Check fire rate
        if (time - this.player.lastFired < weapon.fireRate) return;

        // Check if reloading
        if (this.player.isReloading) return;

        // Check ammo
        if (this.player.currentMag <= 0) {
            // Show out of ammo warning (once per second)
            if (time - this.lastAmmoWarning > 1000) {
                this.showFloatingText(this.player.x, this.player.y - 30, 'RELOAD!', '#ff0000');
                this.lastAmmoWarning = time;
            }
            return;
        }

        // Check reserve ammo for non-infinite weapons
        if (!weapon.infinite && this.player.currentMag <= 0) {
            const ammoType = weapon.ammoType;
            if (gameState.ammo[ammoType] <= 0) {
                if (time - this.lastAmmoWarning > 1000) {
                    this.showFloatingText(this.player.x, this.player.y - 30, 'NO AMMO!', '#ff0000');
                    this.lastAmmoWarning = time;
                }
                return;
            }
        }

        this.player.lastFired = time;
        this.player.currentMag--;

        // Get firing direction
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const baseAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );

        // Create bullets based on weapon type
        const weaponName = gameState.weapons[gameState.currentWeapon];

        if (weaponName === 'shotgun') {
            // Shotgun fires multiple pellets
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread, weapon.spread));
                const angle = baseAngle + spread;
                this.createBullet(angle, weapon.projectileSpeed, weapon.damage, 'pellet');
            }
        } else if (weaponName === 'flamethrower') {
            // Flamethrower
            const spread = Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread, weapon.spread));
            const angle = baseAngle + spread;
            this.createBullet(angle, weapon.projectileSpeed, weapon.damage, 'flame');
        } else {
            // Standard bullet
            const spread = Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread/2, weapon.spread/2));
            const angle = baseAngle + spread;
            this.createBullet(angle, weapon.projectileSpeed, weapon.damage, 'bullet');
        }

        // Muzzle flash
        this.showMuzzleFlash();

        // Screen shake (reduced by 50% per GDD feedback)
        this.cameras.main.shake(50, weapon.screenShake * 0.0005);

        // Alert nearby enemies (sound reaction)
        this.alertEnemiesInRange(this.player.x, this.player.y, 400);

        // Auto-reload when empty
        if (this.player.currentMag <= 0) {
            this.reloadWeapon();
        }
    }

    alertEnemiesInRange(x, y, range) {
        // Enemies react to gunfire sounds
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < range && !enemy.isAlerted) {
                enemy.isAlerted = true;
                enemy.lastSoundX = x;
                enemy.lastSoundY = y;
            }
        });
    }

    createBullet(angle, speed, damage, texture) {
        const offsetX = Math.cos(angle) * 20;
        const offsetY = Math.sin(angle) * 20;

        const bullet = this.bullets.create(
            this.player.x + offsetX,
            this.player.y + offsetY,
            texture
        );

        bullet.setRotation(angle);
        bullet.damage = damage;
        bullet.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        // Destroy after range
        this.time.delayedCall(1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    showMuzzleFlash() {
        const flash = this.add.sprite(this.player.x, this.player.y, 'muzzle_flash');
        flash.setRotation(this.player.rotation);
        flash.setDepth(11);

        const offsetX = Math.cos(this.player.rotation) * 20;
        const offsetY = Math.sin(this.player.rotation) * 20;
        flash.setPosition(this.player.x + offsetX, this.player.y + offsetY);

        this.time.delayedCall(50, () => flash.destroy());
    }

    reloadWeapon() {
        if (this.player.isReloading) return;

        const weapon = this.currentWeaponData;
        const weaponName = gameState.weapons[gameState.currentWeapon];

        // Infinite ammo weapons just reload
        if (weapon.infinite) {
            this.player.isReloading = true;
            this.showFloatingText(this.player.x, this.player.y - 30, 'RELOADING...', '#ffff00');

            this.time.delayedCall(weapon.reloadTime, () => {
                this.player.currentMag = weapon.magSize;
                this.player.isReloading = false;
            });
            return;
        }

        // Check reserve ammo
        const ammoType = weapon.ammoType;
        if (gameState.ammo[ammoType] <= 0) {
            this.showFloatingText(this.player.x, this.player.y - 30, 'NO AMMO!', '#ff0000');
            return;
        }

        this.player.isReloading = true;
        this.showFloatingText(this.player.x, this.player.y - 30, 'RELOADING...', '#ffff00');

        this.time.delayedCall(weapon.reloadTime, () => {
            const needed = weapon.magSize - this.player.currentMag;
            const available = gameState.ammo[ammoType];
            const toLoad = Math.min(needed, available);

            this.player.currentMag += toLoad;
            gameState.ammo[ammoType] -= toLoad;
            this.player.isReloading = false;
        });
    }

    switchWeapon(direction) {
        if (gameState.weapons.length <= 1) return;

        gameState.currentWeapon = (gameState.currentWeapon + direction + gameState.weapons.length) % gameState.weapons.length;
        this.currentWeaponData = WEAPONS[gameState.weapons[gameState.currentWeapon]];
        this.player.currentMag = this.currentWeaponData.magSize;
        this.player.isReloading = false;

        this.showFloatingText(this.player.x, this.player.y - 30, this.currentWeaponData.name.toUpperCase(), '#00ffff');
    }

    updateEnemyAI() {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );

            // Check detection
            if (dist < enemy.detectionRange) {
                enemy.isAlerted = true;
            }

            if (!enemy.isAlerted) {
                enemy.setVelocity(0, 0);
                return;
            }

            // Rotate to face player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.setRotation(angle);

            // Movement toward player
            if (enemy.enemyType === 'brute' && enemy.isCharging) {
                // Continue charge
            } else if (dist > 40) {
                const speed = enemy.speed;
                enemy.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
            } else {
                enemy.setVelocity(0, 0);
            }

            // Brute charge logic
            if (enemy.enemyType === 'brute' && !enemy.isCharging && dist < 200 && dist > 80) {
                if (this.time.now - enemy.lastAttack > 3000) {
                    enemy.isCharging = true;
                    enemy.lastAttack = this.time.now;

                    const chargeAngle = angle;
                    enemy.setVelocity(
                        Math.cos(chargeAngle) * enemy.chargeSpeed,
                        Math.sin(chargeAngle) * enemy.chargeSpeed
                    );

                    this.time.delayedCall(1500, () => {
                        enemy.isCharging = false;
                    });
                }
            }

            // Queen special attacks
            if (enemy.enemyType === 'queen' && this.time.now - enemy.lastAttack > enemy.attackCooldown) {
                if (dist < 300) {
                    // Acid spit
                    this.queenAcidSpit(enemy);
                    enemy.lastAttack = this.time.now;
                }
            }
        });
    }

    queenAcidSpit(queen) {
        const angle = Phaser.Math.Angle.Between(queen.x, queen.y, this.player.x, this.player.y);

        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 200, () => {
                if (!queen.active) return;

                const spread = Phaser.Math.DegToRad(Phaser.Math.Between(-10, 10));
                const acid = this.enemyBullets.create(queen.x, queen.y, 'acid');
                acid.damage = 15;
                acid.setVelocity(
                    Math.cos(angle + spread) * 300,
                    Math.sin(angle + spread) * 300
                );

                this.time.delayedCall(2000, () => {
                    if (acid.active) acid.destroy();
                });
            });
        }
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        bullet.destroy();

        // Knockback
        const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        const knockback = bullet.damage * 3;
        enemy.setVelocity(
            Math.cos(angle) * knockback,
            Math.sin(angle) * knockback
        );

        // Blood splatter
        this.createBloodSplatter(enemy.x, enemy.y, COLORS.BLOOD_ALIEN);

        // Death
        if (enemy.hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    bulletHitWall(bullet, wall) {
        // Spark effect
        const spark = this.add.circle(bullet.x, bullet.y, 4, 0xffff00);
        this.time.delayedCall(50, () => spark.destroy());

        bullet.destroy();
    }

    bulletHitDestructible(bullet, obj) {
        obj.hp -= bullet.damage;
        bullet.destroy();

        if (obj.hp <= 0) {
            if (obj.isExplosive) {
                this.explodeBarrel(obj);
            } else {
                // Debris effect
                for (let i = 0; i < 5; i++) {
                    const debris = this.add.rectangle(
                        obj.x + Phaser.Math.Between(-10, 10),
                        obj.y + Phaser.Math.Between(-10, 10),
                        4, 4, 0x6a5a4a
                    );
                    this.time.delayedCall(300, () => debris.destroy());
                }
                obj.destroy();
            }
        }
    }

    explodeBarrel(barrel) {
        // Explosion effect
        const explosion = this.add.circle(barrel.x, barrel.y, 60, 0xff6600, 0.8);
        this.cameras.main.shake(200, 0.01);

        // Damage nearby enemies
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, enemy.x, enemy.y);
            if (dist < 100) {
                enemy.hp -= 80 * (1 - dist/100);
                if (enemy.hp <= 0) {
                    this.enemyDeath(enemy);
                }
            }
        });

        // Damage player if close
        const playerDist = Phaser.Math.Distance.Between(barrel.x, barrel.y, this.player.x, this.player.y);
        if (playerDist < 100) {
            this.damagePlayer(80 * (1 - playerDist/100));
        }

        this.time.delayedCall(100, () => explosion.destroy());
        barrel.destroy();
    }

    enemyBulletHitPlayer(player, bullet) {
        this.damagePlayer(bullet.damage);
        bullet.destroy();
    }

    enemyMeleePlayer(player, enemy) {
        if (player.invulnerable) return;
        if (this.time.now - enemy.lastAttack < enemy.attackCooldown) return;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (dist < 30) {
            this.damagePlayer(enemy.damage);
            enemy.lastAttack = this.time.now;

            // Knockback player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            player.setVelocity(
                Math.cos(angle) * 200,
                Math.sin(angle) * 200
            );
        }
    }

    damagePlayer(amount) {
        if (this.player.invulnerable) return;

        // Shield absorbs first
        if (gameState.shield > 0) {
            const shieldDamage = Math.min(gameState.shield, amount);
            gameState.shield -= shieldDamage;
            amount -= shieldDamage;
        }

        gameState.health -= amount;
        this.player.hp = gameState.health;

        // Red flash
        this.cameras.main.flash(100, 255, 0, 0, false);
        this.cameras.main.shake(100, 0.005);

        // I-frames
        this.player.invulnerable = true;
        this.player.setAlpha(0.5);
        this.time.delayedCall(500, () => {
            this.player.invulnerable = false;
            this.player.setAlpha(1);
        });

        // Death check
        if (gameState.health <= 0) {
            this.playerDeath();
        }
    }

    enemyDeath(enemy) {
        gameState.score += enemy.scoreValue;
        gameState.kills++;

        // Death effect
        this.createBloodSplatter(enemy.x, enemy.y, COLORS.BLOOD_ALIEN);

        // Drop loot
        if (Math.random() < 0.3) {
            const drop = Math.random() < 0.5 ? 'health_pack' : 'ammo_box';
            const item = this.items.create(enemy.x, enemy.y, drop);
            item.itemType = drop === 'health_pack' ? 'health' : 'ammo';
            item.amount = drop === 'health_pack' ? 15 : 15;
            if (item.itemType === 'ammo') {
                item.ammoType = Phaser.Math.RND.pick(['shells', 'rifle', 'fuel']);
            }
            item.setDepth(5);
        }

        // Boss death
        if (enemy.isBoss) {
            this.bossDefeated();
        }

        // Remove from room tracking
        const room = this.rooms.find(r => r.id === enemy.roomId);
        if (room) {
            const idx = room.enemies.indexOf(enemy);
            if (idx > -1) room.enemies.splice(idx, 1);

            // Check if room cleared
            if (room.enemies.length === 0 && !room.cleared) {
                room.cleared = true;
                this.showFloatingText(this.player.x, this.player.y - 50, 'ROOM CLEARED!', '#00ff00');
            }
        }

        enemy.destroy();
    }

    bossDefeated() {
        // Victory!
        this.showFloatingText(this.player.x, this.player.y - 80, 'QUEEN DEFEATED!', '#ff00ff');

        // Unlock exit
        this.time.delayedCall(3000, () => {
            if (gameState.currentLevel >= gameState.maxLevel) {
                this.scene.start('VictoryScene');
            } else {
                gameState.currentLevel++;
                this.generateLevel(gameState.currentLevel);
            }
        });
    }

    playerDeath() {
        this.scene.start('GameOverScene');
    }

    createBloodSplatter(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-15, 15),
                y + Phaser.Math.Between(-15, 15),
                Phaser.Math.Between(2, 5),
                color
            );
            this.time.delayedCall(500, () => particle.destroy());
        }
    }

    collectItem(player, item) {
        let message = '';
        let color = '#ffffff';

        switch (item.itemType) {
            case 'health':
                if (gameState.health < gameState.maxHealth) {
                    const heal = Math.min(item.amount, gameState.maxHealth - gameState.health);
                    gameState.health += heal;
                    message = `+${heal} HEALTH`;
                    color = '#ff4444';
                    item.destroy();
                }
                break;

            case 'ammo':
                gameState.ammo[item.ammoType] += item.amount;
                message = `+${item.amount} ${item.ammoType.toUpperCase()}`;
                color = '#ffdd00';
                item.destroy();
                break;

            case 'keycard':
                gameState.keycards[item.keycardColor] = true;
                message = `${item.keycardColor.toUpperCase()} KEYCARD`;
                color = COLORS.KEYCARD_BLUE;
                item.destroy();
                break;

            case 'weapon':
                if (!gameState.weapons.includes(item.weaponType)) {
                    gameState.weapons.push(item.weaponType);
                    message = `${item.weaponType.toUpperCase()} ACQUIRED`;
                    color = '#00ffff';
                    item.destroy();
                }
                break;
        }

        if (message) {
            this.showFloatingText(player.x, player.y - 30, message, color);
        }
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: floatText,
            y: y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatText.destroy()
        });
    }

    handleDoorCollision(player, door) {
        // Don't block, just note proximity
    }

    tryOpenDoor() {
        // Find nearest door
        let nearestDoor = null;
        let nearestDist = Infinity;

        this.doors.getChildren().forEach(door => {
            if (door.isOpen) return;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                door.x, door.y
            );

            if (dist < nearestDist && dist < 80) {
                nearestDist = dist;
                nearestDoor = door;
            }
        });

        if (!nearestDoor) return;

        // Check keycard requirement
        if (nearestDoor.requiresKey && !gameState.keycards.blue) {
            this.showFloatingText(this.player.x, this.player.y - 30, 'NEED BLUE KEYCARD', '#0088ff');
            return;
        }

        // Open door
        nearestDoor.isOpen = true;
        nearestDoor.body.enable = false;
        nearestDoor.setAlpha(0.3);

        this.showFloatingText(nearestDoor.x, nearestDoor.y - 20, 'DOOR OPENED', '#00ff00');

        // Spawn enemies in target room if not cleared
        if (nearestDoor.targetRoom && !nearestDoor.targetRoom.cleared) {
            const room = nearestDoor.targetRoom;
            room.enemies.forEach(enemy => {
                enemy.isAlerted = true;
            });
        }
    }

    checkDoorProximity() {
        let showPrompt = false;
        let promptText = '';

        this.doors.getChildren().forEach(door => {
            if (door.isOpen) return;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                door.x, door.y
            );

            if (dist < 80) {
                showPrompt = true;
                if (door.requiresKey && !gameState.keycards.blue) {
                    promptText = 'REQUIRES BLUE KEYCARD';
                } else {
                    promptText = 'SPACE to open';
                }
            }
        });

        this.doorPrompt.setVisible(showPrompt);
        this.doorPrompt.setText(promptText);
    }

    checkRoomTransition() {
        // Find current room
        for (const room of this.rooms) {
            if (this.player.x >= room.x && this.player.x <= room.x + room.width &&
                this.player.y >= room.y && this.player.y <= room.y + room.height) {

                if (this.currentRoom !== room) {
                    this.currentRoom = room;

                    // Trigger enemies if first visit
                    if (!room.cleared && room.enemies.length > 0) {
                        room.enemies.forEach(enemy => {
                            enemy.isAlerted = true;
                        });
                    }

                    // Check for exit
                    if (room.isExit && room.cleared) {
                        this.levelComplete();
                    }
                }
                break;
            }
        }
    }

    levelComplete() {
        if (gameState.currentLevel >= gameState.maxLevel) {
            this.scene.start('VictoryScene');
        } else {
            gameState.currentLevel++;
            this.showFloatingText(this.player.x, this.player.y - 50, `LEVEL ${gameState.currentLevel}`, '#00ff00');
            this.time.delayedCall(2000, () => {
                this.generateLevel(gameState.currentLevel);
            });
        }
    }

    updateHUD() {
        // Health bar
        const healthPercent = gameState.health / gameState.maxHealth;
        this.healthBar.setScale(healthPercent, 1);
        this.healthBar.setPosition(220 - 75 * (1 - healthPercent), 20);

        // Ammo bar (magazine)
        const weapon = this.currentWeaponData;
        const ammoPercent = this.player.currentMag / weapon.magSize;
        this.ammoBar.setScale(ammoPercent, 1);
        this.ammoBar.setPosition(450 - 75 * (1 - ammoPercent), 20);

        // Keycard indicators
        this.keycardBlue.setFillStyle(gameState.keycards.blue ? COLORS.KEYCARD_BLUE : 0x333333);

        // Score
        this.scoreText.setText(`SCORE: ${gameState.score}`);
        this.levelText.setText(`LEVEL: ${gameState.currentLevel}`);

        // Weapon info
        const weaponName = gameState.weapons[gameState.currentWeapon];
        this.weaponText.setText(weaponName.toUpperCase());

        const reserveAmmo = weapon.infinite ? 'INF' : gameState.ammo[weapon.ammoType];
        this.ammoText.setText(`${this.player.currentMag}/${weapon.magSize} | ${reserveAmmo}`);
    }

    updateMinimap() {
        this.minimapGraphics.clear();

        const scale = 0.05;
        const offsetX = GAME_WIDTH - 120;
        const offsetY = 60;

        // Draw rooms
        for (const room of this.rooms) {
            const rx = (room.x - this.player.x) * scale;
            const ry = (room.y - this.player.y) * scale;
            const rw = room.width * scale;
            const rh = room.height * scale;

            // Skip if too far from minimap center
            if (Math.abs(rx) > 50 || Math.abs(ry) > 50) continue;

            const color = room.cleared ? 0x444444 : 0x222222;
            this.minimapGraphics.fillStyle(color);
            this.minimapGraphics.fillRect(offsetX + rx, offsetY + ry, rw, rh);

            // Outline
            this.minimapGraphics.lineStyle(1, 0x666666);
            this.minimapGraphics.strokeRect(offsetX + rx, offsetY + ry, rw, rh);
        }

        // Draw enemies as red dots
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            const ex = (enemy.x - this.player.x) * scale;
            const ey = (enemy.y - this.player.y) * scale;

            if (Math.abs(ex) < 50 && Math.abs(ey) < 50) {
                this.minimapGraphics.fillStyle(0xff0000);
                this.minimapGraphics.fillCircle(offsetX + ex, offsetY + ey, 2);
            }
        });

        // Player (always center)
        this.minimapGraphics.fillStyle(0x00ff00);
        this.minimapGraphics.fillTriangle(
            offsetX, offsetY - 4,
            offsetX - 3, offsetY + 3,
            offsetX + 3, offsetY + 3
        );
    }

    updateDebugOverlay() {
        const weapon = this.currentWeaponData;
        const weaponName = gameState.weapons[gameState.currentWeapon];

        const debugInfo = [
            `=== DEBUG (Q to hide) ===`,
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `Health: ${gameState.health}/${gameState.maxHealth}`,
            `Shield: ${gameState.shield}/${gameState.maxShield}`,
            `Stamina: ${Math.round(gameState.stamina)}/${gameState.maxStamina}`,
            ``,
            `Weapon: ${weaponName}`,
            `Mag: ${this.player.currentMag}/${weapon.magSize}`,
            `Reserve: ${weapon.infinite ? 'INF' : gameState.ammo[weapon.ammoType]}`,
            ``,
            `Enemies: ${this.enemies.getChildren().length}`,
            `Level: ${gameState.currentLevel}/${gameState.maxLevel}`,
            `Room: ${this.currentRoom ? this.currentRoom.id : 'N/A'}`,
            `Score: ${gameState.score}`,
            `Kills: ${gameState.kills}`,
            ``,
            `Keycards: Blue=${gameState.keycards.blue}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugOverlay.setText(debugInfo);
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        this.add.text(cx, cy - 150, 'ESCAPED!', {
            fontFamily: 'monospace',
            fontSize: '64px',
            fill: '#00ff88'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 50, `Time: ${Math.floor(gameState.gameTime)}s`, {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy, `Kills: ${gameState.kills}`, {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Score: ${gameState.score}`, {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#ffdd00'
        }).setOrigin(0.5);

        const playAgain = this.add.text(cx, cy + 150, '[ PLAY AGAIN ]', {
            fontFamily: 'monospace',
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        playAgain.on('pointerover', () => playAgain.setFill('#00ff88'));
        playAgain.on('pointerout', () => playAgain.setFill('#ffffff'));
        playAgain.on('pointerdown', () => this.scene.start('MenuScene'));

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        this.add.text(cx, cy - 150, 'MISSION FAILED', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 50, `Survived: ${Math.floor(gameState.gameTime)}s`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy, `Kills: ${gameState.kills}`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Level Reached: ${gameState.currentLevel}`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const retry = this.add.text(cx, cy + 130, '[ RETRY ]', {
            fontFamily: 'monospace',
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        const menu = this.add.text(cx, cy + 180, '[ MAIN MENU ]', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#888888'
        }).setOrigin(0.5).setInteractive();

        retry.on('pointerover', () => retry.setFill('#ff4444'));
        retry.on('pointerout', () => retry.setFill('#ffffff'));
        retry.on('pointerdown', () => {
            gameState.health = 100;
            gameState.shield = 0;
            this.scene.start('GameScene');
        });

        menu.on('pointerover', () => menu.setFill('#ffffff'));
        menu.on('pointerout', () => menu.setFill('#888888'));
        menu.on('pointerdown', () => this.scene.start('MenuScene'));

        this.input.keyboard.once('keydown-SPACE', () => {
            gameState.health = 100;
            gameState.shield = 0;
            this.scene.start('GameScene');
        });
    }
}

// Game Configuration
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
    scene: [BootScene, MenuScene, GameScene, VictoryScene, GameOverScene],
    render: {
        pixelArt: true,
        antialias: false
    }
};

// Create game instance
const game = new Phaser.Game(config);
