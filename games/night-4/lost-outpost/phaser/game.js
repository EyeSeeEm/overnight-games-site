// Lost Outpost - Top-down survival horror shooter
// Phaser 3 implementation

// Constants
const TILE_SIZE = 32;
const MAX_LEVELS = 10;

// Character selection
const CHARACTERS = {
    jameson: {
        name: 'JAMESON',
        title: 'Space Marine',
        health: 100,
        speed: 200,
        color: 0x4444AA,
        bonusDamage: 0
    },
    lee: {
        name: 'LEE',
        title: 'Veteran Soldier',
        health: 80,
        speed: 220,
        color: 0x44AA44,
        bonusDamage: 10
    }
};

// Shop items configuration
const SHOP_ITEMS = {
    healthPack: { name: 'Medi-Pack', cost: 500, effect: 'health', value: 50, description: 'Restores 50 HP' },
    ammoCrate: { name: 'Ammo Crate', cost: 300, effect: 'ammo', value: 100, description: '+100 ammo' },
    armorUpgrade: { name: 'Armor Plating', cost: 2000, effect: 'maxHealth', value: 25, description: '+25 Max HP' },
    speedBoost: { name: 'Leg Servos', cost: 1500, effect: 'speed', value: 20, description: '+10% Speed' },
    damageBoost: { name: 'FMJ Rounds', cost: 2500, effect: 'damage', value: 5, description: '+5 Base Damage' }
};

// Weapon attachments
const ATTACHMENTS = {
    laserSight: { name: 'Laser Sight', cost: 1000, effect: 'spread', value: -0.02, description: 'Better accuracy' },
    extendedMag: { name: 'Extended Mag', cost: 1500, effect: 'clipSize', value: 10, description: '+10 clip size' },
    rapidFire: { name: 'Rapid Fire', cost: 2000, effect: 'fireRate', value: -20, description: 'Faster fire rate' }
};

// Story logs
const PDA_LOGS = [
    { id: 1, title: 'Emergency Alert', text: 'Breach detected in sectors 4-7. All personnel evacuate immediately.' },
    { id: 2, title: 'Research Note', text: 'Specimen behavior erratic. Recommend termination of project Alpha.' },
    { id: 3, title: 'Last Message', text: 'If anyone finds this... they came from below. Dont let them out.' },
    { id: 4, title: 'Security Log', text: 'Keycard access revoked for all non-essential personnel. Code Red.' },
    { id: 5, title: 'Distress Call', text: 'This is Lee. Ship crashed on surface. Hostiles everywhere. Need extraction.' }
];

const COLORS = {
    metal: '#2a2a2a',
    metalLight: '#3a3a3a',
    floor: '#1a1a1a',
    wall: '#333',
    door: '#4a4a4a',
    warning: '#FFD700',
    alien: '#00FF00',
    blood: '#00FF00',
    health: '#E53935',
    ammo: '#FFD700',
    credits: '#00BFFF',
    flashlight: '#FFFFCC',
    laser: '#FF0000'
};

// Boot Scene - Load assets
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Create simple graphics-based textures
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player texture
        const playerG = this.make.graphics({x: 0, y: 0, add: false});
        playerG.fillStyle(0x4444AA);
        playerG.fillCircle(16, 16, 14);
        playerG.fillStyle(0x666666);
        playerG.fillRect(14, 0, 4, 16);
        playerG.generateTexture('player', 32, 32);

        // Alien texture
        const alienG = this.make.graphics({x: 0, y: 0, add: false});
        alienG.fillStyle(0x228B22);
        alienG.fillCircle(16, 16, 12);
        alienG.fillStyle(0xFF0000);
        alienG.fillCircle(12, 12, 3);
        alienG.fillCircle(20, 12, 3);
        alienG.generateTexture('alien', 32, 32);

        // Large alien texture
        const bigAlienG = this.make.graphics({x: 0, y: 0, add: false});
        bigAlienG.fillStyle(0x1B5E20);
        bigAlienG.fillCircle(24, 24, 20);
        bigAlienG.fillStyle(0xFF0000);
        bigAlienG.fillCircle(16, 16, 4);
        bigAlienG.fillCircle(32, 16, 4);
        bigAlienG.generateTexture('alienBig', 48, 48);

        // Laser alien texture (purple/blue)
        const laserAlienG = this.make.graphics({x: 0, y: 0, add: false});
        laserAlienG.fillStyle(0x6A1B9A);
        laserAlienG.fillCircle(16, 16, 12);
        laserAlienG.fillStyle(0x00FF00);
        laserAlienG.fillCircle(12, 12, 4);
        laserAlienG.fillCircle(20, 12, 4);
        laserAlienG.lineStyle(2, 0x00FF00);
        laserAlienG.strokeCircle(16, 16, 14);
        laserAlienG.generateTexture('alienLaser', 32, 32);

        // Small alien texture
        const smallAlienG = this.make.graphics({x: 0, y: 0, add: false});
        smallAlienG.fillStyle(0x4CAF50);
        smallAlienG.fillCircle(8, 8, 6);
        smallAlienG.fillStyle(0xFF0000);
        smallAlienG.fillCircle(6, 6, 2);
        smallAlienG.fillCircle(10, 6, 2);
        smallAlienG.generateTexture('alienSmall', 16, 16);

        // Alien projectile
        const alienBulletG = this.make.graphics({x: 0, y: 0, add: false});
        alienBulletG.fillStyle(0x00FF00);
        alienBulletG.fillCircle(4, 4, 4);
        alienBulletG.generateTexture('alienBullet', 8, 8);

        // Blood particle
        const bloodG = this.make.graphics({x: 0, y: 0, add: false});
        bloodG.fillStyle(0x00FF00);
        bloodG.fillCircle(4, 4, 4);
        bloodG.generateTexture('bloodParticle', 8, 8);

        // Explosion particle
        const explosionG = this.make.graphics({x: 0, y: 0, add: false});
        explosionG.fillStyle(0xFF6600);
        explosionG.fillCircle(8, 8, 8);
        explosionG.generateTexture('explosionParticle', 16, 16);

        // Boss alien texture
        const bossG = this.make.graphics({x: 0, y: 0, add: false});
        bossG.fillStyle(0x8B0000);
        bossG.fillCircle(40, 40, 35);
        bossG.fillStyle(0x1B5E20);
        bossG.fillCircle(40, 40, 28);
        bossG.fillStyle(0xFF0000);
        bossG.fillCircle(30, 30, 6);
        bossG.fillCircle(50, 30, 6);
        bossG.fillCircle(40, 45, 4);
        bossG.lineStyle(3, 0xFF0000);
        bossG.strokeCircle(40, 40, 38);
        bossG.generateTexture('alienBoss', 80, 80);

        // Bullet texture
        const bulletG = this.make.graphics({x: 0, y: 0, add: false});
        bulletG.fillStyle(0xFFFF00);
        bulletG.fillRect(0, 0, 8, 4);
        bulletG.generateTexture('bullet', 8, 4);

        // Wall tile
        const wallG = this.make.graphics({x: 0, y: 0, add: false});
        wallG.fillStyle(0x333333);
        wallG.fillRect(0, 0, 32, 32);
        wallG.lineStyle(1, 0x222222);
        wallG.strokeRect(0, 0, 32, 32);
        wallG.generateTexture('wall', 32, 32);

        // Floor tile
        const floorG = this.make.graphics({x: 0, y: 0, add: false});
        floorG.fillStyle(0x1a1a1a);
        floorG.fillRect(0, 0, 32, 32);
        floorG.fillStyle(0x151515);
        floorG.fillRect(0, 0, 16, 16);
        floorG.fillRect(16, 16, 16, 16);
        floorG.generateTexture('floor', 32, 32);

        // Health pack
        const healthG = this.make.graphics({x: 0, y: 0, add: false});
        healthG.fillStyle(0xE53935);
        healthG.fillRect(8, 4, 8, 16);
        healthG.fillRect(4, 8, 16, 8);
        healthG.generateTexture('healthPack', 24, 24);

        // Ammo pack
        const ammoG = this.make.graphics({x: 0, y: 0, add: false});
        ammoG.fillStyle(0xFFD700);
        ammoG.fillRect(4, 0, 16, 20);
        ammoG.fillStyle(0xCC9900);
        ammoG.fillRect(8, 4, 8, 12);
        ammoG.generateTexture('ammoPack', 24, 24);

        // Credits
        const creditsG = this.make.graphics({x: 0, y: 0, add: false});
        creditsG.fillStyle(0x00BFFF);
        creditsG.fillCircle(8, 8, 8);
        creditsG.fillStyle(0x00FFFF);
        creditsG.fillCircle(8, 8, 4);
        creditsG.generateTexture('credit', 16, 16);

        // Keycard
        const keycardG = this.make.graphics({x: 0, y: 0, add: false});
        keycardG.fillStyle(0xFF6600);
        keycardG.fillRect(0, 4, 24, 16);
        keycardG.fillStyle(0xFFCC00);
        keycardG.fillRect(4, 8, 4, 8);
        keycardG.generateTexture('keycard', 24, 24);

        // Door
        const doorG = this.make.graphics({x: 0, y: 0, add: false});
        doorG.fillStyle(0x555555);
        doorG.fillRect(0, 0, 64, 32);
        doorG.fillStyle(0xFF6600);
        doorG.fillRect(28, 4, 8, 24);
        doorG.generateTexture('door', 64, 32);

        // Terminal
        const termG = this.make.graphics({x: 0, y: 0, add: false});
        termG.fillStyle(0x333333);
        termG.fillRect(0, 0, 32, 32);
        termG.fillStyle(0x00FF00);
        termG.fillRect(4, 4, 24, 16);
        termG.fillStyle(0x006600);
        termG.fillRect(8, 8, 16, 4);
        termG.fillRect(8, 14, 12, 2);
        termG.generateTexture('terminal', 32, 32);
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Title
        this.add.text(centerX, 150, 'LOST OUTPOST', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            color: '#00FFFF',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#004444',
                blur: 4,
                fill: true
            }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(centerX, 220, 'A Survival Horror Shooter', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.text(centerX, 350, '[ START MISSION ]', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#00FF00'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#FFFF00'));
        startBtn.on('pointerout', () => startBtn.setColor('#00FF00'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Instructions
        this.add.text(centerX, 480, 'WASD - Move\nMouse - Aim\nLeft Click - Shoot\nR - Reload\nSpace - Interact', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#666666',
            align: 'center'
        }).setOrigin(0.5);

        // Version
        this.add.text(centerX, 600, 'v1.0 - Space Marines Never Die', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#444444'
        }).setOrigin(0.5);

        // Flicker effect
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                this.cameras.main.flash(100, 0, 50, 50);
            },
            loop: true
        });
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.player = null;
        this.aliens = null;
        this.bullets = null;
        this.pickups = null;
        this.walls = null;
        this.doors = null;
        this.terminals = null;

        this.gameState = {
            health: 100,
            maxHealth: 100,
            ammo: 300,
            maxAmmo: 500,
            clip: 30,
            clipSize: 30,
            credits: 0,
            xp: 0,
            rank: 1,
            lives: 3,
            kills: 0,
            hasKeycard: false,
            currentWeapon: 'rifle',
            level: 1,
            character: 'jameson', // Selected character
            bonusDamage: 0,       // From upgrades
            bonusSpeed: 0,        // From upgrades
            logsFound: [],        // Collected PDA logs
            attachments: {},      // Weapon attachments owned
            shopOpen: false,      // Shop UI state
            levelComplete: false, // Level win condition
            totalKills: 0,        // Campaign total
            campaignComplete: false
        };

        this.weapons = {
            rifle: { name: 'ASSAULT RIFLE', damage: 10, fireRate: 150, clipSize: 30, spread: 0.05, rankRequired: 0 },
            smg: { name: 'SMG', damage: 6, fireRate: 80, clipSize: 50, spread: 0.1, rankRequired: 5 },
            shotgun: { name: 'SHOTGUN', damage: 25, fireRate: 600, clipSize: 8, spread: 0.3, pellets: 5, rankRequired: 11 },
            pulseRifle: { name: 'PULSE RIFLE', damage: 15, fireRate: 200, clipSize: 40, spread: 0.02, rankRequired: 16 },
            grenadeLauncher: { name: 'CHINA LAKE', damage: 50, fireRate: 1000, clipSize: 6, spread: 0.1, explosive: true, rankRequired: 20 },
            flamethrower: { name: 'FLAMETHROWER', damage: 3, fireRate: 30, clipSize: 100, spread: 0.15, flame: true, rankRequired: 23 },
            vulcan: { name: 'VULCAN', damage: 8, fireRate: 50, clipSize: 200, spread: 0.08, rankRequired: 26 }
        };

        this.lastFired = 0;
        this.isReloading = false;
        this.bossSpawned = false;
    }

    create() {
        // Load saved state if exists
        const savedState = this.registry.get('savedState');
        if (savedState) {
            this.gameState.credits = savedState.credits;
            this.gameState.xp = savedState.xp;
            this.gameState.rank = savedState.rank;
            this.gameState.level = savedState.level;
            this.gameState.totalKills = savedState.totalKills;
            this.gameState.maxHealth = savedState.maxHealth;
            this.gameState.health = savedState.maxHealth;
            this.gameState.bonusDamage = savedState.bonusDamage;
            this.gameState.bonusSpeed = savedState.bonusSpeed;
            this.gameState.attachments = savedState.attachments;
            this.gameState.logsFound = savedState.logsFound;
            this.gameState.character = savedState.character;
        }

        // Create level
        this.createLevel();

        // Setup player
        this.createPlayer();

        // Setup enemies
        this.createEnemies();

        // Setup pickups
        this.createPickups();

        // Setup bullets group
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image
        });

        // Setup alien bullets group
        this.alienBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.aliens, this.walls);
        this.physics.add.collider(this.aliens, this.aliens);
        this.physics.add.collider(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.bullets, this.aliens, this.bulletHitAlien, null, this);
        this.physics.add.overlap(this.player, this.aliens, this.playerHit, null, this);
        this.physics.add.collider(this.alienBullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.alienBullets, this.player, this.alienBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.terminals, this.nearTerminal, null, this);
        this.physics.add.collider(this.player, this.doors, this.playerAtDoor, null, this);
        this.physics.add.collider(this.aliens, this.doors);
        this.physics.add.overlap(this.player, this.exitZone, this.playerAtExit, null, this);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            interact: Phaser.Input.Keyboard.KeyCodes.SPACE,
            weaponSwitch: Phaser.Input.Keyboard.KeyCodes.Q,
            pause: Phaser.Input.Keyboard.KeyCodes.P
        });

        // Available weapons (unlocked by rank)
        this.unlockedWeapons = ['rifle'];
        this.isPaused = false;

        // Create HUD
        this.createHUD();

        // Create darkness/flashlight effect
        this.createLighting();

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);

        // Enemy AI timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateAlienAI,
            callbackScope: this,
            loop: true
        });

        // Spawn timer
        this.time.addEvent({
            delay: 8000,
            callback: this.spawnAlien,
            callbackScope: this,
            loop: true
        });
    }

    createLevel() {
        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();
        this.terminals = this.physics.add.staticGroup();

        // Generate tile-based level
        const levelWidth = 40;
        const levelHeight = 30;

        // Track wall positions (allows removal for corridors)
        this.wallMap = {};

        // Create floor tiles
        for (let x = 0; x < levelWidth; x++) {
            for (let y = 0; y < levelHeight; y++) {
                this.add.image(x * TILE_SIZE, y * TILE_SIZE, 'floor').setOrigin(0);
            }
        }

        // Create border walls in map
        for (let x = 0; x < levelWidth; x++) {
            this.wallMap[`${x},0`] = true;
            this.wallMap[`${x},${levelHeight - 1}`] = true;
        }
        for (let y = 0; y < levelHeight; y++) {
            this.wallMap[`0,${y}`] = true;
            this.wallMap[`${levelWidth - 1},${y}`] = true;
        }

        // Create rooms with openings for corridors
        // Room 1: Start room - opening on right side at y=8
        this.createRoom(5, 5, 8, 6, [{ side: 'right', y: 7 }, { side: 'right', y: 8 }, { side: 'right', y: 9 }]);

        // Room 2: Top right - opening on left at y=8
        this.createRoom(20, 3, 10, 8, [{ side: 'left', y: 7 }, { side: 'left', y: 8 }, { side: 'left', y: 9 }]);

        // Room 3: Bottom left - openings on top and right
        this.createRoom(5, 18, 10, 8, [
            { side: 'top', x: 9 }, { side: 'top', x: 10 }, { side: 'top', x: 11 },
            { side: 'right', y: 21 }, { side: 'right', y: 22 }, { side: 'right', y: 23 }
        ]);

        // Room 4: Bottom right - openings on left and top
        this.createRoom(22, 16, 12, 10, [
            { side: 'left', y: 21 }, { side: 'left', y: 22 }, { side: 'left', y: 23 },
            { side: 'top', x: 27 }, { side: 'top', x: 28 }, { side: 'top', x: 29 }
        ]);

        // Create corridors connecting rooms
        // Horizontal corridor from Room 1 to Room 2 (at y=7,8,9)
        this.createCorridor(13, 7, 8, 'horizontal', 3);

        // Vertical corridor from top area down to Room 3 (at x=9,10,11)
        this.createCorridor(9, 11, 8, 'vertical', 3);

        // Horizontal corridor from Room 3 to Room 4 (at y=21,22,23)
        this.createCorridor(15, 21, 8, 'horizontal', 3);

        // Vertical corridor from Room 2 area down to Room 4 (at x=27,28,29)
        this.createCorridor(27, 11, 6, 'vertical', 3);

        // Now create actual wall sprites from the map
        for (const key in this.wallMap) {
            if (this.wallMap[key]) {
                const [x, y] = key.split(',').map(Number);
                this.walls.create(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'wall');
            }
        }

        // Add terminals
        this.terminals.create(8 * TILE_SIZE, 7 * TILE_SIZE, 'terminal');
        this.terminals.create(25 * TILE_SIZE, 5 * TILE_SIZE, 'terminal');

        // Add doors in corridors
        this.createDoor(16, 8, false); // Unlocked door in horizontal corridor
        this.createDoor(10, 15, true);  // Locked door in vertical corridor (needs keycard)

        // Level exit zone (bottom right room)
        this.add.rectangle(30 * TILE_SIZE, 22 * TILE_SIZE, 64, 64, 0x00FF00, 0.3);
        this.exitZone = this.add.zone(30 * TILE_SIZE, 22 * TILE_SIZE, 64, 64);
        this.physics.add.existing(this.exitZone, true);

        // Exit marker
        this.add.text(30 * TILE_SIZE, 22 * TILE_SIZE, 'EXIT', {
            fontSize: '12px', fontFamily: 'Arial', color: '#00FF00'
        }).setOrigin(0.5);

        // Verify connectivity
        this.verifyConnectivity();
    }

    verifyConnectivity() {
        // Flood fill from player start to verify exit is reachable
        const levelWidth = 40;
        const levelHeight = 30;
        const startX = 9;
        const startY = 8;
        const exitX = 30;
        const exitY = 22;

        const visited = new Set();
        const queue = [[startX, startY]];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const [cx, cy] = queue.shift();

            const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const [nx, ny] of neighbors) {
                const key = `${nx},${ny}`;
                if (nx >= 0 && nx < levelWidth && ny >= 0 && ny < levelHeight &&
                    !visited.has(key) && !this.wallMap[key]) {
                    visited.add(key);
                    queue.push([nx, ny]);
                }
            }
        }

        if (!visited.has(`${exitX},${exitY}`)) {
            console.warn('Level connectivity issue detected! Creating emergency path...');
            this.createEmergencyPath(startX, startY, exitX, exitY);
        } else {
            console.log('Level connectivity verified: All areas reachable');
        }
    }

    createEmergencyPath(x1, y1, x2, y2) {
        // Create direct path if level generation fails
        // Clear horizontal path first
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${x},${y1 + dy}`;
                delete this.wallMap[key];
                // Remove wall sprites
                this.walls.getChildren().forEach(wall => {
                    if (Math.abs(wall.x - x * TILE_SIZE - 16) < 2 &&
                        Math.abs(wall.y - (y1 + dy) * TILE_SIZE - 16) < 2) {
                        wall.destroy();
                    }
                });
            }
        }
        // Then vertical
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            for (let dx = -1; dx <= 1; dx++) {
                const key = `${x2 + dx},${y}`;
                delete this.wallMap[key];
                this.walls.getChildren().forEach(wall => {
                    if (Math.abs(wall.x - (x2 + dx) * TILE_SIZE - 16) < 2 &&
                        Math.abs(wall.y - y * TILE_SIZE - 16) < 2) {
                        wall.destroy();
                    }
                });
            }
        }
    }

    createDoor(x, y, locked) {
        const door = this.doors.create(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'door');
        door.setData('locked', locked);
        door.setData('open', false);

        if (locked) {
            door.setTint(0xFF6600); // Orange tint for locked
        }
    }

    createRoom(x, y, width, height, openings = []) {
        // Build set of opening positions
        const openingSet = new Set();
        openings.forEach(o => {
            if (o.side === 'top') openingSet.add(`top,${o.x}`);
            else if (o.side === 'bottom') openingSet.add(`bottom,${o.x}`);
            else if (o.side === 'left') openingSet.add(`left,${o.y}`);
            else if (o.side === 'right') openingSet.add(`right,${o.y}`);
        });

        // Top and bottom walls
        for (let i = 0; i <= width; i++) {
            const wx = x + i;
            if (!openingSet.has(`top,${wx}`)) {
                this.wallMap[`${wx},${y}`] = true;
            }
            if (!openingSet.has(`bottom,${wx}`)) {
                this.wallMap[`${wx},${y + height}`] = true;
            }
        }
        // Left and right walls
        for (let j = 0; j <= height; j++) {
            const wy = y + j;
            if (!openingSet.has(`left,${wy}`)) {
                this.wallMap[`${x},${wy}`] = true;
            }
            if (!openingSet.has(`right,${wy}`)) {
                this.wallMap[`${x + width},${wy}`] = true;
            }
        }
    }

    createCorridor(x, y, length, direction, width = 3) {
        const halfWidth = Math.floor(width / 2);

        if (direction === 'horizontal') {
            for (let i = 0; i < length; i++) {
                // Clear corridor floor
                for (let w = 0; w < width; w++) {
                    delete this.wallMap[`${x + i},${y + w}`];
                }
                // Add corridor walls
                this.wallMap[`${x + i},${y - 1}`] = true;
                this.wallMap[`${x + i},${y + width}`] = true;
            }
        } else { // vertical
            for (let i = 0; i < length; i++) {
                // Clear corridor floor
                for (let w = 0; w < width; w++) {
                    delete this.wallMap[`${x + w},${y + i}`];
                }
                // Add corridor walls
                this.wallMap[`${x - 1},${y + i}`] = true;
                this.wallMap[`${x + width},${y + i}`] = true;
            }
        }
    }

    createPlayer() {
        this.player = this.physics.add.sprite(9 * TILE_SIZE, 8 * TILE_SIZE, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDrag(800);
        this.player.body.setSize(20, 20);
    }

    createEnemies() {
        this.aliens = this.physics.add.group();

        // Initial spawns
        const spawnPoints = [
            { x: 25, y: 7 },
            { x: 28, y: 6 },
            { x: 8, y: 22 },
            { x: 12, y: 20 },
            { x: 26, y: 20 }
        ];

        spawnPoints.forEach(pos => {
            const alien = this.aliens.create(pos.x * TILE_SIZE, pos.y * TILE_SIZE, 'alien');
            alien.setData('health', 30);
            alien.setData('damage', 10);
            alien.setData('speed', 80);
            alien.setDrag(500);
            alien.body.setSize(20, 20);
        });
    }

    createPickups() {
        this.pickups = this.physics.add.group();

        // Scatter pickups
        const pickupTypes = [
            { type: 'health', texture: 'healthPack', x: 10, y: 7 },
            { type: 'ammo', texture: 'ammoPack', x: 23, y: 6 },
            { type: 'credit', texture: 'credit', x: 7, y: 20 },
            { type: 'credit', texture: 'credit', x: 8, y: 20 },
            { type: 'credit', texture: 'credit', x: 9, y: 20 },
            { type: 'ammo', texture: 'ammoPack', x: 25, y: 22 },
            { type: 'keycard', texture: 'keycard', x: 28, y: 8 }
        ];

        pickupTypes.forEach(p => {
            const pickup = this.pickups.create(p.x * TILE_SIZE, p.y * TILE_SIZE, p.texture);
            pickup.setData('type', p.type);
        });
    }

    createHUD() {
        // Fixed HUD elements
        this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

        // Health bar background
        this.hudContainer.add(this.add.rectangle(120, 20, 200, 20, 0x333333).setScrollFactor(0));
        // Health bar
        this.healthBar = this.add.rectangle(20, 20, 200, 16, 0xE53935).setScrollFactor(0).setOrigin(0, 0.5);
        this.hudContainer.add(this.healthBar);

        // Health text
        this.healthText = this.add.text(120, 20, '100/100', {
            fontSize: '14px', fontFamily: 'Arial', color: '#fff'
        }).setScrollFactor(0).setOrigin(0.5);
        this.hudContainer.add(this.healthText);

        // Ammo display
        this.ammoText = this.add.text(120, 50, '30 | 300', {
            fontSize: '20px', fontFamily: 'Arial', color: '#FFD700'
        }).setScrollFactor(0).setOrigin(0, 0.5);
        this.hudContainer.add(this.ammoText);

        // Credits display
        this.creditsText = this.add.text(480, 20, 'CREDITS: 0', {
            fontSize: '18px', fontFamily: 'Arial', color: '#00BFFF'
        }).setScrollFactor(0).setOrigin(0.5);
        this.hudContainer.add(this.creditsText);

        // Rank display
        this.rankText = this.add.text(300, 20, 'RANK 1 | XP: 0', {
            fontSize: '16px', fontFamily: 'Arial', color: '#00FF00'
        }).setScrollFactor(0);
        this.hudContainer.add(this.rankText);

        // Lives display
        this.livesText = this.add.text(940, 20, 'LIVES: 3', {
            fontSize: '18px', fontFamily: 'Arial', color: '#FF0000'
        }).setScrollFactor(0).setOrigin(1, 0);
        this.hudContainer.add(this.livesText);

        // Weapon display
        this.weaponText = this.add.text(20, 70, 'ASSAULT RIFLE', {
            fontSize: '14px', fontFamily: 'Arial', color: '#888888'
        }).setScrollFactor(0);
        this.hudContainer.add(this.weaponText);

        // Message display
        this.messageText = this.add.text(480, 320, '', {
            fontSize: '24px', fontFamily: 'Arial', color: '#FFFF00'
        }).setScrollFactor(0).setOrigin(0.5);
        this.hudContainer.add(this.messageText);

        // Keycard indicator
        this.keycardText = this.add.text(600, 20, '', {
            fontSize: '14px', fontFamily: 'Arial', color: '#FF6600'
        }).setScrollFactor(0);
        this.hudContainer.add(this.keycardText);

        // Kill counter
        this.killsText = this.add.text(700, 20, 'KILLS: 0', {
            fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setScrollFactor(0);
        this.hudContainer.add(this.killsText);

        // Pause overlay
        this.pauseOverlay = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.7)
            .setScrollFactor(0).setDepth(300).setVisible(false);
        this.pauseText = this.add.text(480, 320, 'PAUSED\n\nPress P to resume', {
            fontSize: '32px', fontFamily: 'Arial', color: '#00FFFF', align: 'center'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(301).setVisible(false);

        // Level indicator
        this.levelText = this.add.text(480, 50, 'LEVEL ' + this.gameState.level, {
            fontSize: '14px', fontFamily: 'Arial', color: '#888888'
        }).setScrollFactor(0).setOrigin(0.5);
        this.hudContainer.add(this.levelText);

        // Motion tracker (radar)
        this.createMotionTracker();
    }

    createMotionTracker() {
        const radarX = 880;
        const radarY = 80;
        const radarSize = 50;

        // Radar background
        this.radarBg = this.add.circle(radarX, radarY, radarSize, 0x001100, 0.8).setScrollFactor(0);
        this.radarBg.setStrokeStyle(2, 0x00FF00);
        this.hudContainer.add(this.radarBg);

        // Radar sweep line
        this.radarSweep = this.add.graphics().setScrollFactor(0);
        this.hudContainer.add(this.radarSweep);

        // Radar dots container
        this.radarDots = this.add.container(radarX, radarY).setScrollFactor(0);
        this.hudContainer.add(this.radarDots);

        this.radarAngle = 0;
    }

    createLighting() {
        // Create darkness mask
        this.darkness = this.add.graphics();
        this.darkness.setScrollFactor(0);
        this.darkness.setDepth(100);
    }

    update(time, delta) {
        // Handle pause
        if (Phaser.Input.Keyboard.JustDown(this.cursors.pause)) {
            this.togglePause();
        }

        if (this.isPaused || !this.player.active) return;

        this.handleMovement();
        this.handleAiming();
        this.handleShooting(time);
        this.handleReload();
        this.handleWeaponSwitch();
        this.updateHUD();
        this.updateLighting();
        this.updateRadar();
        this.checkGameOver();
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.pauseOverlay.setVisible(true);
            this.pauseText.setVisible(true);
        } else {
            this.physics.resume();
            this.pauseOverlay.setVisible(false);
            this.pauseText.setVisible(false);
        }
    }

    handleMovement() {
        const speed = 200;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown) vx = -speed;
        if (this.cursors.right.isDown) vx = speed;
        if (this.cursors.up.isDown) vy = -speed;
        if (this.cursors.down.isDown) vy = speed;

        this.player.setVelocity(vx, vy);
    }

    handleAiming() {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            worldPoint.x, worldPoint.y
        );
        this.player.setRotation(angle + Math.PI / 2);
    }

    handleShooting(time) {
        if (this.input.activePointer.isDown && !this.isReloading) {
            const weapon = this.weapons[this.gameState.currentWeapon];

            if (time > this.lastFired + weapon.fireRate && this.gameState.clip > 0) {
                this.lastFired = time;
                this.gameState.clip--;
                this.shoot();
            }
        }
    }

    shoot() {
        const weapon = this.weapons[this.gameState.currentWeapon];
        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
            bullet.setData('damage', weapon.damage);

            const spread = (Math.random() - 0.5) * weapon.spread;
            const angle = this.player.rotation - Math.PI / 2 + spread;

            bullet.setRotation(angle);
            this.physics.velocityFromRotation(angle, 600, bullet.body.velocity);

            // Auto-destroy after distance
            this.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }

        // Muzzle flash effect
        this.cameras.main.flash(30, 255, 200, 100);
    }

    handleReload() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload) && !this.isReloading) {
            if (this.gameState.clip < this.weapons[this.gameState.currentWeapon].clipSize && this.gameState.ammo > 0) {
                this.isReloading = true;
                this.showMessage('RELOADING...');

                this.time.delayedCall(1500, () => {
                    const neededAmmo = this.weapons[this.gameState.currentWeapon].clipSize - this.gameState.clip;
                    const ammoToLoad = Math.min(neededAmmo, this.gameState.ammo);
                    this.gameState.clip += ammoToLoad;
                    this.gameState.ammo -= ammoToLoad;
                    this.isReloading = false;
                    this.showMessage('RELOADED');
                });
            }
        }
    }

    handleWeaponSwitch() {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weaponSwitch) && !this.isReloading) {
            // Update unlocked weapons based on rank
            this.updateUnlockedWeapons();

            if (this.unlockedWeapons.length > 1) {
                const currentIndex = this.unlockedWeapons.indexOf(this.gameState.currentWeapon);
                const nextIndex = (currentIndex + 1) % this.unlockedWeapons.length;
                this.gameState.currentWeapon = this.unlockedWeapons[nextIndex];

                // Reset clip to new weapon's size
                const weapon = this.weapons[this.gameState.currentWeapon];
                this.gameState.clipSize = weapon.clipSize;
                this.gameState.clip = Math.min(this.gameState.clip, weapon.clipSize);

                this.showMessage(weapon.name);
            }
        }
    }

    updateUnlockedWeapons() {
        this.unlockedWeapons = [];
        for (const [key, weapon] of Object.entries(this.weapons)) {
            if (this.gameState.rank >= weapon.rankRequired) {
                this.unlockedWeapons.push(key);
            }
        }
    }

    bulletHitWall(bullet, wall) {
        bullet.destroy();
    }

    bulletHitAlien(bullet, alien) {
        const damage = bullet.getData('damage');
        const health = alien.getData('health') - damage;
        alien.setData('health', health);

        // Blood splat effect
        alien.setTint(0xFF0000);
        this.time.delayedCall(50, () => alien.clearTint());

        bullet.destroy();

        if (health <= 0) {
            this.killAlien(alien);
        }
    }

    alienBulletHitPlayer(bullet, player) {
        const damage = bullet.getData('damage') || 15;
        this.gameState.health -= damage;

        // Damage effect
        this.cameras.main.shake(100, 0.01);
        this.cameras.main.flash(100, 0, 255, 0);

        bullet.destroy();

        if (this.gameState.health <= 0) {
            this.playerDeath();
        }
    }

    alienShoot(alien) {
        if (!alien.active || !this.player.active) return;

        const bullet = this.alienBullets.create(alien.x, alien.y, 'alienBullet');
        bullet.setData('damage', 15);

        const angle = Phaser.Math.Angle.Between(
            alien.x, alien.y, this.player.x, this.player.y
        );

        this.physics.velocityFromRotation(angle, 300, bullet.body.velocity);

        // Auto-destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    bossShoot(boss) {
        if (!boss.active || !this.player.active) return;

        // Shoot in 8 directions
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const bullet = this.alienBullets.create(boss.x, boss.y, 'alienBullet');
            bullet.setData('damage', 20);
            bullet.setScale(1.5);

            this.physics.velocityFromRotation(angle, 250, bullet.body.velocity);

            this.time.delayedCall(2500, () => {
                if (bullet.active) bullet.destroy();
            });
        }

        // Screen shake for boss attack
        this.cameras.main.shake(100, 0.01);
    }

    killAlien(alien) {
        // Blood splatter effect
        this.createBloodSplatter(alien.x, alien.y);

        // Drop credits
        for (let i = 0; i < 3; i++) {
            const credit = this.pickups.create(
                alien.x + Phaser.Math.Between(-20, 20),
                alien.y + Phaser.Math.Between(-20, 20),
                'credit'
            );
            credit.setData('type', 'credit');
        }

        // XP and kills (more for bigger enemies)
        const type = alien.getData('type');
        let xpGain = 100;
        if (type === 'big') xpGain = 200;
        else if (type === 'laser') xpGain = 150;
        else if (type === 'small') xpGain = 50;

        this.gameState.xp += xpGain;
        this.gameState.kills++;

        // Check rank up
        if (this.gameState.xp >= this.gameState.rank * 1000) {
            this.gameState.rank++;
            this.showMessage('RANK UP! ' + this.gameState.rank);
            this.cameras.main.flash(500, 0, 255, 0);
        }

        // Spawn boss after 20 kills
        if (this.gameState.kills === 20 && !this.bossSpawned) {
            this.spawnBoss();
        }

        alien.destroy();
    }

    spawnBoss() {
        this.bossSpawned = true;
        this.showMessage('WARNING: BOSS INCOMING!');
        this.cameras.main.shake(500, 0.02);

        const boss = this.aliens.create(25 * TILE_SIZE, 20 * TILE_SIZE, 'alienBoss');
        boss.setData('health', 500);
        boss.setData('damage', 30);
        boss.setData('speed', 40);
        boss.setData('type', 'boss');
        boss.setData('lastShot', 0);
        boss.setDrag(300);
        boss.body.setSize(60, 60);
    }

    createBloodSplatter(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-10, 10),
                y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(2, 6),
                0x00FF00
            );

            // Fade out and destroy
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.5,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    playerHit(player, alien) {
        const damage = alien.getData('damage');
        this.gameState.health -= damage;

        // Knockback
        const angle = Phaser.Math.Angle.Between(alien.x, alien.y, player.x, player.y);
        this.physics.velocityFromRotation(angle, 200, player.body.velocity);

        // Damage effect
        this.cameras.main.shake(100, 0.01);
        this.cameras.main.flash(100, 255, 0, 0);

        // Push alien away
        alien.setVelocity(-Math.cos(angle) * 100, -Math.sin(angle) * 100);

        if (this.gameState.health <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        this.gameState.lives--;
        this.showMessage('YOU DIED!');

        if (this.gameState.lives <= 0) {
            this.time.delayedCall(2000, () => {
                this.scene.start('MenuScene');
            });
        } else {
            this.gameState.health = this.gameState.maxHealth;
            this.player.setPosition(9 * TILE_SIZE, 8 * TILE_SIZE);
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        switch (type) {
            case 'health':
                this.gameState.health = Math.min(this.gameState.maxHealth, this.gameState.health + 25);
                this.showMessage('+25 HEALTH');
                break;
            case 'ammo':
                this.gameState.ammo = Math.min(this.gameState.maxAmmo, this.gameState.ammo + 50);
                this.showMessage('+50 AMMO');
                break;
            case 'credit':
                this.gameState.credits += 100;
                break;
            case 'keycard':
                this.gameState.hasKeycard = true;
                this.showMessage('KEYCARD ACQUIRED');
                break;
        }

        pickup.destroy();
    }

    nearTerminal(player, terminal) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact) && !this.gameState.shopOpen) {
            this.openShop();
        }
    }

    openShop() {
        this.gameState.shopOpen = true;
        this.physics.pause();

        // Create shop overlay
        this.shopContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(400);

        // Background
        this.shopContainer.add(this.add.rectangle(480, 320, 700, 500, 0x111111, 0.95).setScrollFactor(0));
        this.shopContainer.add(this.add.rectangle(480, 320, 700, 500).setStrokeStyle(2, 0x00FF00).setScrollFactor(0));

        // Title
        this.shopContainer.add(this.add.text(480, 100, 'SUPPLY TERMINAL', {
            fontSize: '28px', fontFamily: 'Arial', color: '#00FF00'
        }).setOrigin(0.5).setScrollFactor(0));

        // Credits display
        this.shopCreditsText = this.add.text(480, 140, 'CREDITS: ' + this.gameState.credits, {
            fontSize: '18px', fontFamily: 'Arial', color: '#00BFFF'
        }).setOrigin(0.5).setScrollFactor(0);
        this.shopContainer.add(this.shopCreditsText);

        // Shop items
        let y = 180;
        this.shopButtons = [];
        Object.keys(SHOP_ITEMS).forEach((key, i) => {
            const item = SHOP_ITEMS[key];
            const canAfford = this.gameState.credits >= item.cost;

            const btn = this.add.text(300, y + i * 50, `[${item.name}] - ${item.cost}c`, {
                fontSize: '16px', fontFamily: 'Arial',
                color: canAfford ? '#00FF00' : '#666666'
            }).setScrollFactor(0).setInteractive();

            const desc = this.add.text(650, y + i * 50, item.description, {
                fontSize: '14px', fontFamily: 'Arial', color: '#888888'
            }).setScrollFactor(0).setOrigin(1, 0);

            btn.on('pointerdown', () => this.buyShopItem(key));
            btn.on('pointerover', () => canAfford && btn.setColor('#FFFF00'));
            btn.on('pointerout', () => btn.setColor(canAfford ? '#00FF00' : '#666666'));

            this.shopButtons.push(btn);
            this.shopContainer.add(btn);
            this.shopContainer.add(desc);
        });

        // Close button
        const closeBtn = this.add.text(480, 480, '[ CLOSE ]', {
            fontSize: '20px', fontFamily: 'Arial', color: '#FF6600'
        }).setOrigin(0.5).setScrollFactor(0).setInteractive();
        closeBtn.on('pointerdown', () => this.closeShop());
        closeBtn.on('pointerover', () => closeBtn.setColor('#FFFF00'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#FF6600'));
        this.shopContainer.add(closeBtn);
    }

    buyShopItem(itemKey) {
        const item = SHOP_ITEMS[itemKey];
        if (this.gameState.credits < item.cost) {
            this.showMessage('NOT ENOUGH CREDITS');
            return;
        }

        this.gameState.credits -= item.cost;

        switch (item.effect) {
            case 'health':
                this.gameState.health = Math.min(this.gameState.maxHealth, this.gameState.health + item.value);
                break;
            case 'ammo':
                this.gameState.ammo = Math.min(this.gameState.maxAmmo, this.gameState.ammo + item.value);
                break;
            case 'maxHealth':
                this.gameState.maxHealth += item.value;
                this.gameState.health += item.value;
                break;
            case 'speed':
                this.gameState.bonusSpeed += item.value;
                break;
            case 'damage':
                this.gameState.bonusDamage += item.value;
                break;
        }

        this.shopCreditsText.setText('CREDITS: ' + this.gameState.credits);
        this.showMessage('PURCHASED: ' + item.name);
    }

    closeShop() {
        this.gameState.shopOpen = false;
        this.shopContainer.destroy();
        this.physics.resume();
    }

    playerAtDoor(player, door) {
        if (door.getData('open')) return;

        const locked = door.getData('locked');

        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
            if (locked && !this.gameState.hasKeycard) {
                this.showMessage('DOOR LOCKED - KEYCARD REQUIRED');
                this.cameras.main.flash(100, 255, 100, 0);
            } else {
                // Open the door
                door.setData('open', true);
                door.destroy(); // Remove the door
                this.showMessage('DOOR OPENED');

                if (locked) {
                    this.gameState.hasKeycard = false; // Use the keycard
                }
            }
        }
    }

    playerAtExit(player, exitZone) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
            this.levelComplete();
        }
    }

    levelComplete() {
        if (this.gameState.levelComplete) return;
        this.gameState.levelComplete = true;
        this.physics.pause();

        this.cameras.main.flash(500, 0, 255, 0);

        // Calculate bonuses
        const killBonus = this.gameState.kills * 10;
        const levelBonus = this.gameState.level * 100;
        const totalBonus = 500 + killBonus + levelBonus;
        this.gameState.credits += totalBonus;
        this.gameState.totalKills += this.gameState.kills;

        // Create level complete overlay
        this.levelCompleteContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(500);

        // Background
        this.levelCompleteContainer.add(this.add.rectangle(480, 320, 600, 450, 0x000000, 0.95).setScrollFactor(0));
        this.levelCompleteContainer.add(this.add.rectangle(480, 320, 600, 450).setStrokeStyle(3, 0x00FF00).setScrollFactor(0));

        // Title
        this.levelCompleteContainer.add(this.add.text(480, 150, 'LEVEL ' + this.gameState.level + ' COMPLETE!', {
            fontSize: '32px', fontFamily: 'Arial', color: '#00FF00'
        }).setOrigin(0.5).setScrollFactor(0));

        // Stats
        this.levelCompleteContainer.add(this.add.text(480, 220, 'Enemies Killed: ' + this.gameState.kills, {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setOrigin(0.5).setScrollFactor(0));

        this.levelCompleteContainer.add(this.add.text(480, 250, 'Kill Bonus: +' + killBonus + 'c', {
            fontSize: '16px', fontFamily: 'Arial', color: '#FFD700'
        }).setOrigin(0.5).setScrollFactor(0));

        this.levelCompleteContainer.add(this.add.text(480, 280, 'Level Bonus: +' + levelBonus + 'c', {
            fontSize: '16px', fontFamily: 'Arial', color: '#FFD700'
        }).setOrigin(0.5).setScrollFactor(0));

        this.levelCompleteContainer.add(this.add.text(480, 320, 'Total Earned: +' + totalBonus + 'c', {
            fontSize: '20px', fontFamily: 'Arial', color: '#00BFFF'
        }).setOrigin(0.5).setScrollFactor(0));

        this.levelCompleteContainer.add(this.add.text(480, 360, 'Rank: ' + this.gameState.rank + ' | XP: ' + this.gameState.xp, {
            fontSize: '16px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0));

        // Check if campaign complete
        if (this.gameState.level >= MAX_LEVELS) {
            this.levelCompleteContainer.add(this.add.text(480, 410, 'CAMPAIGN COMPLETE!', {
                fontSize: '28px', fontFamily: 'Arial', color: '#FFFF00'
            }).setOrigin(0.5).setScrollFactor(0));

            this.levelCompleteContainer.add(this.add.text(480, 450, 'Total Kills: ' + this.gameState.totalKills, {
                fontSize: '18px', fontFamily: 'Arial', color: '#FF6600'
            }).setOrigin(0.5).setScrollFactor(0));

            const menuBtn = this.add.text(480, 500, '[ RETURN TO MENU ]', {
                fontSize: '22px', fontFamily: 'Arial', color: '#FF6600'
            }).setOrigin(0.5).setScrollFactor(0).setInteractive();
            menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
            menuBtn.on('pointerover', () => menuBtn.setColor('#FFFF00'));
            menuBtn.on('pointerout', () => menuBtn.setColor('#FF6600'));
            this.levelCompleteContainer.add(menuBtn);
        } else {
            const nextBtn = this.add.text(480, 420, '[ NEXT LEVEL ]', {
                fontSize: '24px', fontFamily: 'Arial', color: '#00FF00'
            }).setOrigin(0.5).setScrollFactor(0).setInteractive();
            nextBtn.on('pointerdown', () => this.startNextLevel());
            nextBtn.on('pointerover', () => nextBtn.setColor('#FFFF00'));
            nextBtn.on('pointerout', () => nextBtn.setColor('#00FF00'));
            this.levelCompleteContainer.add(nextBtn);
        }
    }

    startNextLevel() {
        // Save persistent state
        const savedState = {
            credits: this.gameState.credits,
            xp: this.gameState.xp,
            rank: this.gameState.rank,
            level: this.gameState.level + 1,
            totalKills: this.gameState.totalKills,
            maxHealth: this.gameState.maxHealth,
            bonusDamage: this.gameState.bonusDamage,
            bonusSpeed: this.gameState.bonusSpeed,
            attachments: this.gameState.attachments,
            logsFound: this.gameState.logsFound,
            character: this.gameState.character
        };

        this.registry.set('savedState', savedState);
        this.scene.restart();
    }

    updateAlienAI() {
        const currentTime = this.time.now;

        this.aliens.getChildren().forEach(alien => {
            if (!alien.active) return;

            const distance = Phaser.Math.Distance.Between(
                alien.x, alien.y, this.player.x, this.player.y
            );

            const type = alien.getData('type');
            const angle = Phaser.Math.Angle.Between(
                alien.x, alien.y, this.player.x, this.player.y
            );

            if (type === 'boss') {
                // Boss alien - charges and shoots in bursts
                if (distance < 600) {
                    alien.setRotation(angle);
                    const speed = alien.getData('speed');

                    // Always chase player
                    alien.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );

                    // Shoot in multiple directions every 3 seconds
                    const lastShot = alien.getData('lastShot') || 0;
                    if (currentTime - lastShot > 3000) {
                        alien.setData('lastShot', currentTime);
                        this.bossShoot(alien);
                    }
                }
            } else if (type === 'laser') {
                // Laser aliens stay at range and shoot
                if (distance < 500) {
                    alien.setRotation(angle);

                    if (distance < 150) {
                        // Too close, run away
                        alien.setVelocity(
                            Math.cos(angle) * -60,
                            Math.sin(angle) * -60
                        );
                    } else if (distance > 250) {
                        // Too far, get closer
                        alien.setVelocity(
                            Math.cos(angle) * 50,
                            Math.sin(angle) * 50
                        );
                    } else {
                        // Good range, stop and shoot
                        alien.setVelocity(0, 0);
                    }

                    // Shoot every 2 seconds
                    const lastShot = alien.getData('lastShot') || 0;
                    if (currentTime - lastShot > 2000 && distance < 350) {
                        alien.setData('lastShot', currentTime);
                        this.alienShoot(alien);
                    }
                }
            } else {
                // Melee aliens chase player
                if (distance < 400) {
                    const speed = alien.getData('speed');
                    alien.setVelocity(
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed
                    );
                    alien.setRotation(angle);
                }
            }
        });
    }

    spawnAlien() {
        // Spawn at random edge
        const side = Phaser.Math.Between(0, 3);
        let x, y;

        switch (side) {
            case 0: x = Phaser.Math.Between(100, 1100); y = 100; break;
            case 1: x = 1100; y = Phaser.Math.Between(100, 800); break;
            case 2: x = Phaser.Math.Between(100, 1100); y = 800; break;
            case 3: x = 100; y = Phaser.Math.Between(100, 800); break;
        }

        // Random alien type
        const roll = Math.random();
        let alien, type;

        if (roll < 0.15) {
            // Big alien (15%)
            alien = this.aliens.create(x, y, 'alienBig');
            alien.setData('health', 60);
            alien.setData('damage', 20);
            alien.setData('speed', 60);
            alien.setData('type', 'big');
            alien.body.setSize(36, 36);
        } else if (roll < 0.30) {
            // Laser alien (15%)
            alien = this.aliens.create(x, y, 'alienLaser');
            alien.setData('health', 25);
            alien.setData('damage', 5);
            alien.setData('speed', 50);
            alien.setData('type', 'laser');
            alien.setData('lastShot', 0);
            alien.body.setSize(20, 20);
        } else if (roll < 0.50) {
            // Small alien (20%)
            alien = this.aliens.create(x, y, 'alienSmall');
            alien.setData('health', 15);
            alien.setData('damage', 5);
            alien.setData('speed', 120);
            alien.setData('type', 'small');
            alien.body.setSize(12, 12);
        } else {
            // Normal alien (50%)
            alien = this.aliens.create(x, y, 'alien');
            alien.setData('health', 30);
            alien.setData('damage', 10);
            alien.setData('speed', 80);
            alien.setData('type', 'normal');
            alien.body.setSize(20, 20);
        }

        alien.setDrag(500);
    }

    updateHUD() {
        // Health
        const healthPercent = this.gameState.health / this.gameState.maxHealth;
        this.healthBar.setScale(healthPercent, 1);
        this.healthText.setText(`${this.gameState.health}/${this.gameState.maxHealth}`);

        // Ammo
        this.ammoText.setText(`${this.gameState.clip} | ${this.gameState.ammo}`);

        // Credits
        this.creditsText.setText(`CREDITS: ${this.gameState.credits}`);

        // Rank
        this.rankText.setText(`RANK ${this.gameState.rank} | XP: ${this.gameState.xp}`);

        // Lives
        this.livesText.setText(`LIVES: ${this.gameState.lives}`);

        // Weapon name
        const weapon = this.weapons[this.gameState.currentWeapon];
        this.weaponText.setText(weapon.name);

        // Keycard
        this.keycardText.setText(this.gameState.hasKeycard ? 'KEYCARD' : '');

        // Kills
        this.killsText.setText(`KILLS: ${this.gameState.kills}`);
    }

    updateLighting() {
        // Simple vignette effect for atmosphere
        this.darkness.clear();

        // Create dark gradient from edges
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Outer darkness ring
        this.darkness.fillStyle(0x000000, 0.5);
        this.darkness.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Clear center area (where player looks)
        this.darkness.fillStyle(0x000000, 0);
        this.darkness.fillCircle(centerX, centerY, 250);

        // Medium darkness ring
        this.darkness.lineStyle(80, 0x000000, 0.3);
        this.darkness.strokeCircle(centerX, centerY, 200);
    }

    updateRadar() {
        const radarX = 880;
        const radarY = 80;
        const radarScale = 0.06;

        // Clear old dots
        this.radarDots.removeAll(true);

        // Add enemy dots
        this.aliens.getChildren().forEach(alien => {
            const dx = (alien.x - this.player.x) * radarScale;
            const dy = (alien.y - this.player.y) * radarScale;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 40) {
                const dot = this.add.circle(dx, dy, 2, 0x00FF00).setScrollFactor(0);
                this.radarDots.add(dot);
            }
        });

        // Center dot (player)
        const playerDot = this.add.circle(0, 0, 4, 0xFFFFFF).setScrollFactor(0);
        this.radarDots.add(playerDot);

        // Sweep animation
        this.radarAngle += 0.05;
        this.radarSweep.clear();
        this.radarSweep.lineStyle(2, 0x00FF00, 0.5);
        this.radarSweep.beginPath();
        this.radarSweep.moveTo(radarX, radarY);
        this.radarSweep.lineTo(
            radarX + Math.cos(this.radarAngle) * 40,
            radarY + Math.sin(this.radarAngle) * 40
        );
        this.radarSweep.strokePath();
    }

    checkGameOver() {
        if (this.gameState.lives <= 0) {
            this.showMessage('GAME OVER');
        }
    }

    showMessage(text) {
        this.messageText.setText(text);
        this.time.delayedCall(2000, () => {
            this.messageText.setText('');
        });
    }
}

// Config (must be after class definitions)
const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 640,
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

// Start game
const game = new Phaser.Game(config);
