// CITADEL - System Shock Metroidvania
// Built with Phaser 3

// ===================== CONSTANTS =====================
const TILE_SIZE = 32;
const PLAYER_WALK_SPEED = 280;
const PLAYER_JUMP_VELOCITY = -480;
const PLAYER_DOUBLE_JUMP_VELOCITY = -400;
const AIR_CONTROL = 0.7;
const COYOTE_TIME = 100;
const JUMP_BUFFER = 150;
const WALL_SLIDE_SPEED = 120;
const WALL_JUMP_X = 320;
const WALL_JUMP_Y = -420;
const DASH_SPEED = 800;
const DASH_DURATION = 250;
const DASH_COOLDOWN = 800;

// ===================== BOOT SCENE =====================
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create simple colored graphics for sprites
        this.createTextures();
    }

    createTextures() {
        // Player sprite (32x48 cyan rectangle)
        const playerGfx = this.make.graphics({ x: 0, y: 0 });
        playerGfx.fillStyle(0x00ffff, 1);
        playerGfx.fillRect(0, 0, 24, 40);
        playerGfx.fillStyle(0x00aaaa, 1);
        playerGfx.fillRect(4, 4, 16, 8); // visor
        playerGfx.generateTexture('player', 24, 40);
        playerGfx.destroy();

        // Enemy: Shambler (green mutant)
        const shamblerGfx = this.make.graphics({ x: 0, y: 0 });
        shamblerGfx.fillStyle(0x44aa44, 1);
        shamblerGfx.fillRect(0, 0, 28, 32);
        shamblerGfx.fillStyle(0xff0000, 1);
        shamblerGfx.fillRect(6, 6, 6, 6);
        shamblerGfx.fillRect(16, 6, 6, 6);
        shamblerGfx.generateTexture('shambler', 28, 32);
        shamblerGfx.destroy();

        // Enemy: Maintenance Bot (gray robot)
        const botGfx = this.make.graphics({ x: 0, y: 0 });
        botGfx.fillStyle(0x888888, 1);
        botGfx.fillRect(0, 0, 28, 28);
        botGfx.fillStyle(0xff4444, 1);
        botGfx.fillRect(10, 8, 8, 4);
        botGfx.generateTexture('maintenance_bot', 28, 28);
        botGfx.destroy();

        // Enemy: Cyborg Drone (flying)
        const droneGfx = this.make.graphics({ x: 0, y: 0 });
        droneGfx.fillStyle(0x666688, 1);
        droneGfx.fillRect(0, 4, 24, 16);
        droneGfx.fillStyle(0x444466, 1);
        droneGfx.fillRect(0, 0, 24, 4);
        droneGfx.fillRect(0, 20, 24, 4);
        droneGfx.generateTexture('cyborg_drone', 24, 24);
        droneGfx.destroy();

        // Enemy: Mutant Dog
        const dogGfx = this.make.graphics({ x: 0, y: 0 });
        dogGfx.fillStyle(0x885544, 1);
        dogGfx.fillRect(0, 8, 32, 16);
        dogGfx.fillRect(24, 4, 12, 12);
        dogGfx.fillStyle(0xff0000, 1);
        dogGfx.fillRect(32, 6, 4, 4);
        dogGfx.generateTexture('mutant_dog', 36, 24);
        dogGfx.destroy();

        // Enemy: Hopper
        const hopperGfx = this.make.graphics({ x: 0, y: 0 });
        hopperGfx.fillStyle(0x66aa66, 1);
        hopperGfx.fillCircle(12, 12, 12);
        hopperGfx.fillStyle(0xff4444, 1);
        hopperGfx.fillCircle(8, 8, 4);
        hopperGfx.fillCircle(16, 8, 4);
        hopperGfx.generateTexture('hopper', 24, 24);
        hopperGfx.destroy();

        // Enemy: Toxic Spitter
        const spitterGfx = this.make.graphics({ x: 0, y: 0 });
        spitterGfx.fillStyle(0x44aa44, 1);
        spitterGfx.fillRect(0, 0, 28, 36);
        spitterGfx.fillStyle(0x22ff22, 1);
        spitterGfx.fillRect(8, 28, 12, 8);
        spitterGfx.generateTexture('toxic_spitter', 28, 44);
        spitterGfx.destroy();

        // Enemy: Elite Cyborg
        const eliteGfx = this.make.graphics({ x: 0, y: 0 });
        eliteGfx.fillStyle(0x884444, 1);
        eliteGfx.fillRect(0, 0, 32, 48);
        eliteGfx.fillStyle(0xffff00, 1);
        eliteGfx.fillRect(8, 8, 6, 6);
        eliteGfx.fillRect(18, 8, 6, 6);
        eliteGfx.fillStyle(0x666666, 1);
        eliteGfx.fillRect(24, 20, 12, 8);
        eliteGfx.generateTexture('elite_cyborg', 36, 48);
        eliteGfx.destroy();

        // Enemy: Cortex Reaver
        const reaverGfx = this.make.graphics({ x: 0, y: 0 });
        reaverGfx.fillStyle(0x8844aa, 1);
        reaverGfx.fillCircle(20, 20, 18);
        reaverGfx.fillStyle(0xff00ff, 1);
        reaverGfx.fillCircle(20, 16, 8);
        reaverGfx.generateTexture('cortex_reaver', 40, 40);
        reaverGfx.destroy();

        // Enemy: Mutant Gorilla
        const gorillaGfx = this.make.graphics({ x: 0, y: 0 });
        gorillaGfx.fillStyle(0x553322, 1);
        gorillaGfx.fillRect(0, 0, 48, 48);
        gorillaGfx.fillStyle(0xff4444, 1);
        gorillaGfx.fillRect(10, 8, 10, 10);
        gorillaGfx.fillRect(28, 8, 10, 10);
        gorillaGfx.fillStyle(0x442211, 1);
        gorillaGfx.fillRect(0, 32, 16, 16);
        gorillaGfx.fillRect(32, 32, 16, 16);
        gorillaGfx.generateTexture('mutant_gorilla', 48, 48);
        gorillaGfx.destroy();

        // Enemy: Sec-2 Bot (turret)
        const sec2Gfx = this.make.graphics({ x: 0, y: 0 });
        sec2Gfx.fillStyle(0x666666, 1);
        sec2Gfx.fillRect(4, 16, 24, 24);
        sec2Gfx.fillStyle(0x444444, 1);
        sec2Gfx.fillRect(0, 8, 32, 8);
        sec2Gfx.fillStyle(0xff0000, 1);
        sec2Gfx.fillCircle(16, 8, 6);
        sec2Gfx.generateTexture('sec2_bot', 32, 40);
        sec2Gfx.destroy();

        // Enemy: Assassin Bot
        const assassinGfx = this.make.graphics({ x: 0, y: 0 });
        assassinGfx.fillStyle(0x222222, 0.8);
        assassinGfx.fillRect(4, 4, 24, 32);
        assassinGfx.fillStyle(0xff00ff, 1);
        assassinGfx.fillRect(8, 8, 4, 4);
        assassinGfx.fillRect(20, 8, 4, 4);
        assassinGfx.fillStyle(0xcc00cc, 1);
        assassinGfx.fillRect(24, 20, 8, 4);
        assassinGfx.generateTexture('assassin_bot', 32, 40);
        assassinGfx.destroy();

        // Enemy: Mutant Hulk
        const hulkGfx = this.make.graphics({ x: 0, y: 0 });
        hulkGfx.fillStyle(0x446644, 1);
        hulkGfx.fillRect(0, 0, 56, 64);
        hulkGfx.fillStyle(0x88ff88, 1);
        hulkGfx.fillRect(8, 8, 12, 12);
        hulkGfx.fillRect(36, 8, 12, 12);
        hulkGfx.fillStyle(0x335533, 1);
        hulkGfx.fillRect(0, 40, 20, 24);
        hulkGfx.fillRect(36, 40, 20, 24);
        hulkGfx.generateTexture('mutant_hulk', 56, 64);
        hulkGfx.destroy();

        // Boss: Diego
        const diegoGfx = this.make.graphics({ x: 0, y: 0 });
        diegoGfx.fillStyle(0xaa4444, 1);
        diegoGfx.fillRect(0, 0, 48, 64);
        diegoGfx.fillStyle(0xff0000, 1);
        diegoGfx.fillRect(12, 8, 8, 8);
        diegoGfx.fillRect(28, 8, 8, 8);
        diegoGfx.generateTexture('diego', 48, 64);
        diegoGfx.destroy();

        // Boss: Dr. Travers
        const traversGfx = this.make.graphics({ x: 0, y: 0 });
        traversGfx.fillStyle(0x448844, 1);
        traversGfx.fillCircle(40, 40, 36);
        traversGfx.fillStyle(0x66ff66, 1);
        traversGfx.fillCircle(40, 30, 12);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            traversGfx.fillStyle(0x336633, 1);
            traversGfx.fillRect(
                40 + Math.cos(angle) * 30 - 4,
                40 + Math.sin(angle) * 30 - 2,
                20, 8
            );
        }
        traversGfx.generateTexture('travers', 80, 80);
        traversGfx.destroy();

        // Tiles
        const tileGfx = this.make.graphics({ x: 0, y: 0 });
        // Floor tile
        tileGfx.fillStyle(0x333344, 1);
        tileGfx.fillRect(0, 0, 32, 32);
        tileGfx.lineStyle(1, 0x444466);
        tileGfx.strokeRect(0, 0, 32, 32);
        tileGfx.generateTexture('tile_floor', 32, 32);

        // Wall tile
        tileGfx.clear();
        tileGfx.fillStyle(0x222233, 1);
        tileGfx.fillRect(0, 0, 32, 32);
        tileGfx.lineStyle(1, 0x333355);
        tileGfx.strokeRect(0, 0, 32, 32);
        tileGfx.generateTexture('tile_wall', 32, 32);

        // Platform
        tileGfx.clear();
        tileGfx.fillStyle(0x445566, 1);
        tileGfx.fillRect(0, 0, 32, 16);
        tileGfx.generateTexture('tile_platform', 32, 16);
        tileGfx.destroy();

        // Bullet
        const bulletGfx = this.make.graphics({ x: 0, y: 0 });
        bulletGfx.fillStyle(0xffff00, 1);
        bulletGfx.fillCircle(4, 4, 4);
        bulletGfx.generateTexture('bullet', 8, 8);
        bulletGfx.destroy();

        // Energy bullet
        const eBulletGfx = this.make.graphics({ x: 0, y: 0 });
        eBulletGfx.fillStyle(0x00ffff, 1);
        eBulletGfx.fillRect(0, 2, 12, 4);
        eBulletGfx.generateTexture('energy_bullet', 12, 8);
        eBulletGfx.destroy();

        // Health pickup
        const healthGfx = this.make.graphics({ x: 0, y: 0 });
        healthGfx.fillStyle(0xff4444, 1);
        healthGfx.fillRect(6, 0, 8, 20);
        healthGfx.fillRect(0, 6, 20, 8);
        healthGfx.generateTexture('health_pickup', 20, 20);
        healthGfx.destroy();

        // Energy pickup
        const energyGfx = this.make.graphics({ x: 0, y: 0 });
        energyGfx.fillStyle(0x4444ff, 1);
        energyGfx.fillRect(0, 0, 16, 20);
        energyGfx.lineStyle(2, 0x00ffff);
        energyGfx.strokeRect(0, 0, 16, 20);
        energyGfx.generateTexture('energy_pickup', 16, 20);
        energyGfx.destroy();

        // Ammo pickup
        const ammoGfx = this.make.graphics({ x: 0, y: 0 });
        ammoGfx.fillStyle(0xaaaa44, 1);
        ammoGfx.fillRect(0, 0, 12, 16);
        ammoGfx.generateTexture('ammo_pickup', 12, 16);
        ammoGfx.destroy();

        // Save point
        const saveGfx = this.make.graphics({ x: 0, y: 0 });
        saveGfx.fillStyle(0x00ff00, 0.3);
        saveGfx.fillRect(0, 0, 48, 64);
        saveGfx.lineStyle(2, 0x00ff00);
        saveGfx.strokeRect(0, 0, 48, 64);
        saveGfx.generateTexture('save_point', 48, 64);
        saveGfx.destroy();

        // Door
        const doorGfx = this.make.graphics({ x: 0, y: 0 });
        doorGfx.fillStyle(0x664422, 1);
        doorGfx.fillRect(0, 0, 16, 64);
        doorGfx.lineStyle(2, 0x886644);
        doorGfx.strokeRect(0, 0, 16, 64);
        doorGfx.generateTexture('door', 16, 64);
        doorGfx.destroy();

        // Augmentation pickup
        const augGfx = this.make.graphics({ x: 0, y: 0 });
        augGfx.fillStyle(0xff00ff, 1);
        augGfx.fillCircle(16, 16, 14);
        augGfx.fillStyle(0xaa00aa, 1);
        augGfx.fillCircle(16, 16, 8);
        augGfx.generateTexture('augmentation', 32, 32);
        augGfx.destroy();

        // Weapon pickups
        const magGfx = this.make.graphics({ x: 0, y: 0 });
        magGfx.fillStyle(0x666666, 1);
        magGfx.fillRect(0, 4, 20, 8);
        magGfx.fillRect(4, 10, 8, 6);
        magGfx.generateTexture('magnum_pickup', 20, 16);
        magGfx.destroy();

        const arGfx = this.make.graphics({ x: 0, y: 0 });
        arGfx.fillStyle(0x444444, 1);
        arGfx.fillRect(0, 4, 28, 8);
        arGfx.fillRect(8, 10, 10, 6);
        arGfx.fillRect(22, 2, 8, 4);
        arGfx.generateTexture('assault_rifle_pickup', 30, 16);
        arGfx.destroy();

        const plasmaGfx = this.make.graphics({ x: 0, y: 0 });
        plasmaGfx.fillStyle(0x4444ff, 1);
        plasmaGfx.fillRect(0, 4, 24, 10);
        plasmaGfx.fillStyle(0x00ffff, 1);
        plasmaGfx.fillRect(20, 6, 6, 6);
        plasmaGfx.generateTexture('plasma_rifle_pickup', 26, 18);
        plasmaGfx.destroy();

        // Hazard tiles
        const fireGfx = this.make.graphics({ x: 0, y: 0 });
        fireGfx.fillStyle(0xff4400, 1);
        fireGfx.fillRect(0, 16, 32, 16);
        fireGfx.fillStyle(0xffaa00, 0.8);
        fireGfx.fillTriangle(4, 16, 16, 0, 28, 16);
        fireGfx.generateTexture('fire_hazard', 32, 32);
        fireGfx.destroy();

        const toxicGfx = this.make.graphics({ x: 0, y: 0 });
        toxicGfx.fillStyle(0x00aa00, 1);
        toxicGfx.fillRect(0, 0, 32, 32);
        toxicGfx.fillStyle(0x44ff44, 0.5);
        toxicGfx.fillCircle(8, 8, 6);
        toxicGfx.fillCircle(24, 16, 8);
        toxicGfx.fillCircle(12, 24, 5);
        toxicGfx.generateTexture('toxic_hazard', 32, 32);
        toxicGfx.destroy();

        // Health/Energy modules
        const hpModGfx = this.make.graphics({ x: 0, y: 0 });
        hpModGfx.fillStyle(0xff0000, 1);
        hpModGfx.fillRect(4, 0, 16, 24);
        hpModGfx.fillStyle(0xffffff, 1);
        hpModGfx.fillRect(8, 4, 8, 4);
        hpModGfx.fillRect(10, 2, 4, 8);
        hpModGfx.generateTexture('health_module', 24, 24);
        hpModGfx.destroy();

        const enModGfx = this.make.graphics({ x: 0, y: 0 });
        enModGfx.fillStyle(0x0000ff, 1);
        enModGfx.fillRect(4, 0, 16, 24);
        enModGfx.fillStyle(0x00ffff, 1);
        enModGfx.fillRect(8, 4, 8, 16);
        enModGfx.generateTexture('energy_module', 24, 24);
        enModGfx.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// ===================== PAUSE SCENE =====================
class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Darken background
        this.add.rectangle(centerX, centerY, 800, 600, 0x000000, 0.8);

        // Pause title
        this.add.text(centerX, 150, 'PAUSED', {
            fontFamily: 'Courier New',
            fontSize: '36px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Menu options
        const options = ['Resume', 'Inventory', 'Map', 'Options', 'Quit to Menu'];
        this.menuItems = [];
        this.selectedIndex = 0;

        options.forEach((opt, i) => {
            const text = this.add.text(centerX, 250 + i * 40, opt, {
                fontFamily: 'Courier New',
                fontSize: '20px',
                color: i === 0 ? '#ffff00' : '#ffffff'
            }).setOrigin(0.5);
            this.menuItems.push(text);
        });

        // Selection indicator
        this.selector = this.add.text(centerX - 100, 250, '>', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ffff00'
        });

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-W', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-S', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
        this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
        this.input.keyboard.on('keydown-SPACE', () => this.selectOption());
        this.input.keyboard.on('keydown-ENTER', () => this.selectOption());
        this.input.keyboard.on('keydown-ESC', () => this.resume());
    }

    moveSelection(dir) {
        this.menuItems[this.selectedIndex].setColor('#ffffff');
        this.selectedIndex = (this.selectedIndex + dir + this.menuItems.length) % this.menuItems.length;
        this.menuItems[this.selectedIndex].setColor('#ffff00');
        this.selector.y = 250 + this.selectedIndex * 40;
    }

    selectOption() {
        switch (this.selectedIndex) {
            case 0: this.resume(); break;
            case 1: /* Inventory */ break;
            case 2: /* Map */ break;
            case 3: /* Options */ break;
            case 4: this.quitToMenu(); break;
        }
    }

    resume() {
        this.scene.resume('GameScene');
        this.scene.stop();
    }

    quitToMenu() {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.stop();
        this.scene.start('MenuScene');
    }
}

// ===================== MENU SCENE =====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Title
        this.add.text(centerX, 150, 'C I T A D E L', {
            fontFamily: 'Courier New',
            fontSize: '48px',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 210, 'A System Shock Metroidvania', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        // SHODAN message
        this.add.text(centerX, 300, '"LOOK AT YOU, HACKER..."', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ff4444'
        }).setOrigin(0.5);

        // Start prompt
        const startText = this.add.text(centerX, 420, 'Press SPACE or CLICK to Begin', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls
        this.add.text(centerX, 500, 'A/D: Move | SPACE: Jump | J: Attack | K: Shoot | L: Dash', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5);

        this.add.text(centerX, 520, 'E: Interact | M: Map | I: Inventory | ESC: Pause', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#666666'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
        this.input.once('pointerdown', () => this.startGame());
    }

    startGame() {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }
}

// ===================== GAME SCENE =====================
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Game state
        this.gameState = {
            currentRoom: 'medical_start',
            currentDeck: 'medical',
            bossesDefeated: [],
            itemsCollected: [],
            roomsVisited: ['medical_start']
        };

        // Player stats
        this.playerStats = {
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            ammo: { standard: 50, magnum: 0, shells: 0 },
            maxAmmo: { standard: 100, magnum: 30, shells: 24 }
        };

        // Augmentations
        this.augmentations = {
            hydraulicLegs: false,    // Double jump
            geckoPads: false,        // Wall jump
            neuralDash: false,       // Dash
            thermalShielding: false, // Fire immunity
            hazmatCoating: false,    // Toxic immunity
            magneticBoots: false     // Mag-walk
        };

        // Weapons
        this.weapons = {
            equipped: 'pipe',
            ranged: 'minipistol',
            energyWeapon: 'sparq_beam',
            available: ['pipe', 'minipistol', 'sparq_beam'],
            rangedIndex: 0,
            meleeIndex: 0
        };

        // Weapon data
        this.weaponData = {
            // Melee weapons
            pipe: { damage: 15, speed: 400, range: 48, type: 'melee' },
            lead_pipe: { damage: 22, speed: 450, range: 48, knockback: 1.5, type: 'melee' },
            laser_rapier: { damage: 30, speed: 300, range: 56, type: 'melee', isEnergy: true },
            crystal_shard: { damage: 45, speed: 500, range: 40, critChance: 0.2, type: 'melee' },
            // Ballistic weapons
            minipistol: { damage: 12, fireRate: 250, magazine: 8, reload: 1000, ammoType: 'standard', type: 'ballistic' },
            magnum: { damage: 35, fireRate: 600, magazine: 6, reload: 1500, ammoType: 'magnum', type: 'ballistic' },
            assault_rifle: { damage: 18, fireRate: 120, magazine: 30, reload: 2000, ammoType: 'standard', type: 'ballistic' },
            flechette: { damage: 48, fireRate: 700, magazine: 4, reload: 1800, ammoType: 'shells', pellets: 6, type: 'ballistic' },
            railgun: { damage: 80, fireRate: 1500, magazine: 1, reload: 500, ammoType: 'slugs', piercing: true, type: 'ballistic' },
            // Energy weapons
            sparq_beam: { damage: 8, fireRate: 150, energyCost: 2, stun: 500, type: 'energy' },
            ion_rifle: { damage: 25, fireRate: 400, energyCost: 8, shieldBreak: true, type: 'energy' },
            plasma_rifle: { damage: 40, fireRate: 500, energyCost: 15, aoe: 32, type: 'energy' },
            laser_rifle: { damage: 55, fireRate: 800, energyCost: 25, piercing: true, type: 'energy' }
        };

        // Create world
        this.createRoom();
        this.createPlayer();
        this.createEnemies();
        this.createItems();
        this.setupInput();
        this.setupCamera();

        // Collision
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
        this.physics.add.overlap(this.player, this.doors, this.enterDoor, null, this);

        // Player state
        this.playerState = {
            canJump: true,
            hasDoubleJump: true,
            isWallSliding: false,
            isDashing: false,
            dashCooldown: 0,
            iFrames: 0,
            coyoteTime: 0,
            jumpBuffer: 0,
            facingRight: true,
            isAttacking: false,
            attackCooldown: 0,
            // Combo system
            comboCount: 0,
            comboTimer: 0,
            maxCombo: 3
        };

        // SHODAN dialogue
        this.time.delayedCall(2000, () => {
            this.showShodanMessage("WELCOME TO MY DOMAIN, INSECT.");
        });
    }

    createRoom() {
        // Create tile-based room
        this.platforms = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();

        // Room dimensions (20x15 tiles)
        const roomWidth = 20;
        const roomHeight = 15;

        // Floor
        for (let x = 0; x < roomWidth; x++) {
            const floor = this.platforms.create(x * TILE_SIZE + 16, 14 * TILE_SIZE + 16, 'tile_floor');
            floor.setSize(32, 32);
            floor.refreshBody();
        }

        // Ceiling
        for (let x = 0; x < roomWidth; x++) {
            const ceiling = this.platforms.create(x * TILE_SIZE + 16, 16, 'tile_wall');
            ceiling.setSize(32, 32);
            ceiling.refreshBody();
        }

        // Left wall
        for (let y = 1; y < roomHeight - 1; y++) {
            const wall = this.platforms.create(16, y * TILE_SIZE + 16, 'tile_wall');
            wall.setSize(32, 32);
            wall.refreshBody();
        }

        // Right wall
        for (let y = 1; y < roomHeight - 1; y++) {
            const wall = this.platforms.create(19 * TILE_SIZE + 16, y * TILE_SIZE + 16, 'tile_wall');
            wall.setSize(32, 32);
            wall.refreshBody();
        }

        // Platforms
        this.createPlatform(5, 10, 4);
        this.createPlatform(12, 10, 4);
        this.createPlatform(8, 7, 3);
        this.createPlatform(3, 5, 2);
        this.createPlatform(15, 5, 2);

        // Right door
        const rightDoor = this.doors.create(19 * TILE_SIZE, 12 * TILE_SIZE + 16, 'door');
        rightDoor.setSize(16, 64);
        rightDoor.targetRoom = 'medical_hall';
        rightDoor.refreshBody();

        // Save point
        this.savePoint = this.add.sprite(100, 14 * TILE_SIZE - 32, 'save_point');
        this.savePoint.setOrigin(0.5, 1);

        // Background color based on deck
        this.cameras.main.setBackgroundColor('#0a0a12');
    }

    createPlatform(x, y, width) {
        for (let i = 0; i < width; i++) {
            const plat = this.platforms.create(
                (x + i) * TILE_SIZE + 16,
                y * TILE_SIZE + 8,
                'tile_platform'
            );
            plat.setSize(32, 16);
            plat.refreshBody();
        }
    }

    createPlayer() {
        this.player = this.physics.add.sprite(100, 400, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(20, 36);
        this.player.body.setOffset(2, 4);
        this.player.setMaxVelocity(400, 800);

        // Bullets groups
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 20
        });

        this.enemyBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 30
        });

        // Melee attack hitbox
        this.meleeHitbox = this.add.rectangle(0, 0, 48, 32, 0xffffff, 0);
        this.physics.add.existing(this.meleeHitbox);
        this.meleeHitbox.body.setAllowGravity(false);
        this.meleeHitbox.setVisible(false);
    }

    createEnemies() {
        this.enemies = this.physics.add.group();
        this.bosses = this.physics.add.group();

        // Spawn enemies based on room
        this.spawnEnemy('shambler', 350, 400);
        this.spawnEnemy('shambler', 500, 400);
        this.spawnEnemy('maintenance_bot', 300, 280);
        this.spawnEnemy('cyborg_drone', 450, 150);

        // Create hazards group
        this.hazards = this.physics.add.staticGroup();
    }

    spawnBoss(type, x, y) {
        const boss = this.bosses.create(x, y, type);
        boss.enemyType = type;
        boss.body.setCollideWorldBounds(true);
        boss.isBoss = true;

        switch (type) {
            case 'diego':
                boss.health = 400;
                boss.maxHealth = 400;
                boss.damage = 25;
                boss.speed = 200;
                boss.phase = 1;
                boss.attackCooldown = 0;
                boss.body.setSize(40, 56);
                boss.state = 'idle';
                boss.attackPattern = 0;
                break;
            case 'travers':
                boss.health = 500;
                boss.maxHealth = 500;
                boss.damage = 20;
                boss.speed = 0;
                boss.phase = 1;
                boss.attackCooldown = 0;
                boss.body.setSize(72, 72);
                boss.body.setAllowGravity(false);
                boss.state = 'idle';
                boss.tendrilAttack = 0;
                boss.coreExposed = false;
                boss.coreTimer = 0;
                boss.attackCount = 0;
                break;
        }

        return boss;
    }

    updateTraversBoss(boss, delta) {
        boss.attackCooldown -= delta;
        boss.coreTimer -= delta;

        // Phase transitions
        const healthPercent = boss.health / boss.maxHealth;
        if (healthPercent <= 0.3 && boss.phase < 3) {
            boss.phase = 3;
            this.showShodanMessage("TRAVERS! SHOW THIS INSECT TRUE HORROR!");
        } else if (healthPercent <= 0.6 && boss.phase < 2) {
            boss.phase = 2;
            // Spawn Hoppers
            this.spawnEnemy('hopper', boss.x - 100, boss.y);
            this.spawnEnemy('hopper', boss.x + 100, boss.y);
        }

        // Core exposure after 3 attacks
        if (boss.attackCount >= 3 && !boss.coreExposed) {
            boss.coreExposed = true;
            boss.coreTimer = 2000;
            boss.attackCount = 0;
            // Visual: glow green
            boss.setTint(0x00ff00);
        }

        if (boss.coreExposed) {
            if (boss.coreTimer <= 0) {
                boss.coreExposed = false;
                boss.clearTint();
            }
            return; // No attacks while core exposed
        }

        // Attack patterns based on phase
        if (boss.attackCooldown <= 0) {
            const attack = Phaser.Math.Between(0, boss.phase === 3 ? 2 : 1);

            switch (attack) {
                case 0:
                    this.traversTendrilSwipe(boss);
                    break;
                case 1:
                    this.traversAcidSpit(boss);
                    break;
                case 2:
                    this.traversDeathLaser(boss);
                    break;
            }

            boss.attackCooldown = boss.phase === 3 ? 1500 : 2500;
            boss.attackCount++;
        }
    }

    traversTendrilSwipe(boss) {
        // Horizontal tendril across player's platform
        const tendril = this.add.rectangle(
            400, this.player.y,
            800, 16, 0x336633, 0.9
        );

        // Telegraph
        tendril.setAlpha(0.3);
        this.time.delayedCall(400, () => {
            tendril.setAlpha(1);
            // Check hit
            if (Math.abs(this.player.y - tendril.y) < 30 && this.playerState.iFrames <= 0) {
                this.damagePlayer(boss.damage);
            }
            this.time.delayedCall(200, () => tendril.destroy());
        });
    }

    traversAcidSpit(boss) {
        // 3 acid projectiles in spread
        for (let i = -1; i <= 1; i++) {
            const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
            const spreadAngle = angle + (i * 0.3);

            const acid = this.enemyBullets.get(boss.x, boss.y, 'bullet');
            if (acid) {
                acid.setActive(true);
                acid.setVisible(true);
                acid.body.setAllowGravity(true);
                acid.setVelocity(
                    Math.cos(spreadAngle) * 250,
                    Math.sin(spreadAngle) * 250
                );
                acid.setTint(0x00ff00);
                acid.damage = boss.damage;
                acid.lifespan = 3000;
                acid.isAcid = true;
                acid.setScale(1.5);
            }
        }
    }

    traversDeathLaser(boss) {
        // Charge for 1.5s then sweep beam
        const chargeIndicator = this.add.circle(boss.x, boss.y, 40, 0xff0000, 0.5);
        this.tweens.add({
            targets: chargeIndicator,
            scale: 2,
            alpha: 1,
            duration: 1500,
            onComplete: () => {
                chargeIndicator.destroy();

                // Laser sweep
                const laser = this.add.rectangle(boss.x, boss.y, 600, 20, 0xff4400);
                laser.setOrigin(0, 0.5);

                this.tweens.add({
                    targets: laser,
                    angle: 180,
                    duration: 2000,
                    onUpdate: () => {
                        // Check if player in laser path
                        const laserAngle = Phaser.Math.DegToRad(laser.angle);
                        const playerAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);

                        if (Math.abs(laserAngle - playerAngle) < 0.15 && dist < 300 && this.playerState.iFrames <= 0) {
                            this.damagePlayer(30);
                        }
                    },
                    onComplete: () => laser.destroy()
                });
            }
        });
    }

    updateBoss(boss, delta) {
        if (!boss.active) return;

        boss.attackCooldown -= delta;
        const distToPlayer = Phaser.Math.Distance.Between(
            boss.x, boss.y,
            this.player.x, this.player.y
        );

        // Phase transitions
        const healthPercent = boss.health / boss.maxHealth;
        if (healthPercent <= 0.3 && boss.phase < 3) {
            boss.phase = 3;
            this.showShodanMessage("DIEGO! DESTROY THIS INSECT!");
        } else if (healthPercent <= 0.7 && boss.phase < 2) {
            boss.phase = 2;
        }

        // Boss AI based on type
        if (boss.enemyType === 'diego') {
            this.updateDiegoBoss(boss, delta, distToPlayer);
        } else if (boss.enemyType === 'travers') {
            this.updateTraversBoss(boss, delta);
        }
    }

    updateDiegoBoss(boss, delta, dist) {
        switch (boss.state) {
            case 'idle':
                if (dist < 300) {
                    boss.state = 'chase';
                }
                break;

            case 'chase':
                const dir = this.player.x < boss.x ? -1 : 1;
                boss.setVelocityX(dir * boss.speed);
                boss.setFlipX(dir < 0);

                if (boss.attackCooldown <= 0) {
                    if (dist < 60) {
                        boss.state = 'slash';
                        boss.attackCooldown = 1500;
                    } else if (dist < 200 && boss.phase >= 2) {
                        boss.state = 'leap';
                        boss.attackCooldown = 2000;
                    } else if (Math.random() < 0.3) {
                        boss.state = 'charge';
                        boss.attackCooldown = 2500;
                    }
                }
                break;

            case 'slash':
                boss.setVelocityX(0);
                this.bossSlashAttack(boss);
                boss.state = 'chase';
                break;

            case 'charge':
                const chargeDir = this.player.x < boss.x ? -1 : 1;
                boss.setVelocityX(chargeDir * 350);
                if (boss.body.blocked.left || boss.body.blocked.right) {
                    boss.state = 'stunned';
                    boss.stunTimer = 800;
                }
                break;

            case 'leap':
                const leapDir = this.player.x < boss.x ? -1 : 1;
                boss.setVelocity(leapDir * 200, -400);
                boss.state = 'chase';
                // AoE on landing handled separately
                break;

            case 'stunned':
                boss.setVelocityX(0);
                boss.stunTimer -= delta;
                if (boss.stunTimer <= 0) {
                    boss.state = 'chase';
                }
                break;
        }
    }

    bossSlashAttack(boss) {
        const dir = boss.flipX ? -1 : 1;

        // Check if player is in range
        const dist = Phaser.Math.Distance.Between(
            boss.x + dir * 32, boss.y,
            this.player.x, this.player.y
        );

        if (dist < 60 && this.playerState.iFrames <= 0) {
            this.damagePlayer(boss.damage);
        }

        // Slash visual
        const slash = this.add.rectangle(
            boss.x + dir * 40, boss.y,
            60, 20, 0xff4444, 0.8
        );
        this.time.delayedCall(150, () => slash.destroy());
    }

    spawnEnemy(type, x, y) {
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;
        enemy.body.setCollideWorldBounds(true);

        switch (type) {
            case 'shambler':
                enemy.health = 25;
                enemy.maxHealth = 25;
                enemy.damage = 10;
                enemy.speed = 80;
                enemy.xpValue = 10;
                enemy.body.setSize(24, 28);
                break;
            case 'maintenance_bot':
                enemy.health = 40;
                enemy.maxHealth = 40;
                enemy.damage = 8;
                enemy.speed = 120;
                enemy.xpValue = 15;
                enemy.canShoot = true;
                enemy.shootCooldown = 0;
                enemy.body.setSize(24, 24);
                break;
            case 'cyborg_drone':
                enemy.health = 60;
                enemy.maxHealth = 60;
                enemy.damage = 18;
                enemy.speed = 100;
                enemy.xpValue = 20;
                enemy.canFly = true;
                enemy.canShoot = true;
                enemy.shootCooldown = 0;
                enemy.body.setAllowGravity(false);
                break;
            case 'mutant_dog':
                enemy.health = 20;
                enemy.maxHealth = 20;
                enemy.damage = 15;
                enemy.speed = 200;
                enemy.xpValue = 12;
                enemy.canLunge = true;
                enemy.lungeTimer = 0;
                enemy.body.setSize(28, 20);
                break;
            case 'hopper':
                enemy.health = 30;
                enemy.maxHealth = 30;
                enemy.damage = 12;
                enemy.speed = 100;
                enemy.xpValue = 10;
                enemy.canHop = true;
                enemy.hopTimer = 0;
                enemy.body.setSize(20, 20);
                break;
            case 'toxic_spitter':
                enemy.health = 45;
                enemy.maxHealth = 45;
                enemy.damage = 20;
                enemy.speed = 70;
                enemy.xpValue = 18;
                enemy.canSpit = true;
                enemy.spitCooldown = 0;
                enemy.body.setSize(24, 36);
                break;
            case 'elite_cyborg':
                enemy.health = 120;
                enemy.maxHealth = 120;
                enemy.damage = 22;
                enemy.speed = 130;
                enemy.xpValue = 35;
                enemy.canShoot = true;
                enemy.shootCooldown = 0;
                enemy.hasGrenade = true;
                enemy.grenadeCooldown = 5000;
                enemy.body.setSize(28, 44);
                break;
            case 'cortex_reaver':
                enemy.health = 80;
                enemy.maxHealth = 80;
                enemy.damage = 35;
                enemy.speed = 60;
                enemy.xpValue = 40;
                enemy.canFly = true;
                enemy.canTeleport = true;
                enemy.teleportCooldown = 0;
                enemy.psiCooldown = 0;
                enemy.body.setAllowGravity(false);
                enemy.body.setSize(32, 32);
                break;
            case 'mutant_gorilla':
                enemy.health = 100;
                enemy.maxHealth = 100;
                enemy.damage = 25;
                enemy.speed = 150;
                enemy.xpValue = 30;
                enemy.canCharge = true;
                enemy.chargeTimer = 0;
                enemy.canSlam = true;
                enemy.slamCooldown = 0;
                enemy.body.setSize(40, 44);
                break;
            case 'sec2_bot':
                enemy.health = 80;
                enemy.maxHealth = 80;
                enemy.damage = 15;
                enemy.speed = 0;
                enemy.xpValue = 25;
                enemy.canShoot = true;
                enemy.shootCooldown = 0;
                enemy.rapidFire = true;
                enemy.burstCount = 0;
                enemy.body.setSize(28, 36);
                break;
            case 'assassin_bot':
                enemy.health = 70;
                enemy.maxHealth = 70;
                enemy.damage = 40;
                enemy.speed = 250;
                enemy.xpValue = 45;
                enemy.canCloak = true;
                enemy.cloaked = false;
                enemy.cloakTimer = 0;
                enemy.body.setSize(24, 36);
                break;
            case 'mutant_hulk':
                enemy.health = 200;
                enemy.maxHealth = 200;
                enemy.damage = 40;
                enemy.speed = 180;
                enemy.xpValue = 60;
                enemy.canCharge = true;
                enemy.charging = false;
                enemy.chargeDir = 1;
                enemy.body.setSize(48, 60);
                break;
        }

        enemy.state = 'patrol';
        enemy.patrolDir = 1;
        enemy.alertTimer = 0;
        enemy.staggerTimer = 0;

        return enemy;
    }

    createItems() {
        this.items = this.physics.add.staticGroup();

        // Health pickup
        const health = this.items.create(250, 280, 'health_pickup');
        health.itemType = 'health';
        health.value = 25;

        // Energy pickup
        const energy = this.items.create(400, 180, 'energy_pickup');
        energy.itemType = 'energy';
        energy.value = 25;

        // Ammo pickup
        const ammo = this.items.create(550, 280, 'ammo_pickup');
        ammo.itemType = 'ammo';
        ammo.ammoType = 'standard';
        ammo.value = 15;
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            a: this.input.keyboard.addKey('A'),
            d: this.input.keyboard.addKey('D'),
            w: this.input.keyboard.addKey('W'),
            s: this.input.keyboard.addKey('S'),
            j: this.input.keyboard.addKey('J'),  // Melee attack
            k: this.input.keyboard.addKey('K'),  // Shoot
            l: this.input.keyboard.addKey('L'),  // Dash
            e: this.input.keyboard.addKey('E'),  // Interact
            q: this.input.keyboard.addKey('Q'),  // Prev weapon
            r: this.input.keyboard.addKey('R'),  // Reload
            space: this.input.keyboard.addKey('SPACE'),
            m: this.input.keyboard.addKey('M'),  // Map
            i: this.input.keyboard.addKey('I'),  // Inventory
            one: this.input.keyboard.addKey('ONE'),
            two: this.input.keyboard.addKey('TWO'),
            three: this.input.keyboard.addKey('THREE'),
            esc: this.input.keyboard.addKey('ESC')
        };
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, 640, 480);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    update(time, delta) {
        this.updatePlayer(delta);
        this.updateEnemies(delta);
        this.updateBullets(delta);
        this.checkSavePoint();

        // Update bosses
        this.bosses.children.each(boss => {
            this.updateBoss(boss, delta);
        });

        // Energy regeneration
        if (this.playerStats.energy < this.playerStats.maxEnergy) {
            this.playerStats.energy += delta * 0.005; // 5 per second
            this.playerStats.energy = Math.min(this.playerStats.energy, this.playerStats.maxEnergy);
            this.events.emit('energyChanged', Math.floor(this.playerStats.energy), this.playerStats.maxEnergy);
        }
    }

    updatePlayer(delta) {
        const dt = delta / 1000;

        // Update cooldowns
        if (this.playerState.iFrames > 0) this.playerState.iFrames -= delta;
        if (this.playerState.dashCooldown > 0) this.playerState.dashCooldown -= delta;
        if (this.playerState.attackCooldown > 0) this.playerState.attackCooldown -= delta;
        if (this.playerState.coyoteTime > 0) this.playerState.coyoteTime -= delta;
        if (this.playerState.jumpBuffer > 0) this.playerState.jumpBuffer -= delta;

        // Combo timer
        if (this.playerState.comboTimer > 0) {
            this.playerState.comboTimer -= delta;
            if (this.playerState.comboTimer <= 0) {
                this.playerState.comboCount = 0;
            }
        }

        // Flash during i-frames
        if (this.playerState.iFrames > 0) {
            this.player.setAlpha(Math.sin(this.playerState.iFrames / 50) > 0 ? 1 : 0.3);
        } else {
            this.player.setAlpha(1);
        }

        // Ground check
        const onGround = this.player.body.blocked.down;
        if (onGround) {
            this.playerState.canJump = true;
            this.playerState.hasDoubleJump = true;
            this.playerState.coyoteTime = COYOTE_TIME;
        }

        // Wall check
        const touchingWall = this.player.body.blocked.left || this.player.body.blocked.right;
        const wallDir = this.player.body.blocked.left ? -1 : 1;

        // Dashing
        if (this.playerState.isDashing) {
            return; // No control during dash
        }

        // Horizontal movement
        let moveX = 0;
        if (this.keys.a.isDown || this.cursors.left.isDown) {
            moveX = -1;
            this.playerState.facingRight = false;
            this.player.setFlipX(true);
        } else if (this.keys.d.isDown || this.cursors.right.isDown) {
            moveX = 1;
            this.playerState.facingRight = true;
            this.player.setFlipX(false);
        }

        // Apply movement
        const accel = onGround ? PLAYER_WALK_SPEED : PLAYER_WALK_SPEED * AIR_CONTROL;
        if (moveX !== 0) {
            this.player.setVelocityX(moveX * accel);
        } else {
            this.player.setVelocityX(this.player.body.velocity.x * 0.85);
        }

        // Wall slide
        if (touchingWall && !onGround && this.augmentations.geckoPads) {
            if (this.player.body.velocity.y > WALL_SLIDE_SPEED) {
                this.player.setVelocityY(WALL_SLIDE_SPEED);
            }
            this.playerState.isWallSliding = true;
        } else {
            this.playerState.isWallSliding = false;
        }

        // Jump
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.playerState.jumpBuffer = JUMP_BUFFER;
        }

        if (this.playerState.jumpBuffer > 0) {
            // Wall jump
            if (this.playerState.isWallSliding && this.augmentations.geckoPads) {
                this.player.setVelocity(-wallDir * WALL_JUMP_X, WALL_JUMP_Y);
                this.playerState.jumpBuffer = 0;
            }
            // Normal jump with coyote time
            else if (this.playerState.coyoteTime > 0 || onGround) {
                this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
                this.playerState.coyoteTime = 0;
                this.playerState.jumpBuffer = 0;
            }
            // Double jump
            else if (this.playerState.hasDoubleJump && this.augmentations.hydraulicLegs) {
                this.player.setVelocityY(PLAYER_DOUBLE_JUMP_VELOCITY);
                this.playerState.hasDoubleJump = false;
                this.playerState.jumpBuffer = 0;
            }
        }

        // Variable jump height
        if (!this.keys.space.isDown && this.player.body.velocity.y < -200) {
            this.player.setVelocityY(this.player.body.velocity.y * 0.5);
        }

        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keys.l) &&
            this.augmentations.neuralDash &&
            this.playerState.dashCooldown <= 0) {
            this.startDash();
        }

        // Melee attack
        if (Phaser.Input.Keyboard.JustDown(this.keys.j) && this.playerState.attackCooldown <= 0) {
            this.meleeAttack();
        }

        // Ranged attack
        if (Phaser.Input.Keyboard.JustDown(this.keys.k) && this.playerState.attackCooldown <= 0) {
            this.rangedAttack();
        }

        // Energy attack (hold K)
        if (this.keys.k.isDown && this.playerStats.energy > 2 && this.playerState.attackCooldown <= 0) {
            if (this.weapons.ranged === 'sparq_beam') {
                this.energyAttack();
            }
        }

        // Weapon switching
        if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
            this.cycleWeapon();
        }

        // Number keys for quick weapon select
        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
            this.selectWeapon(0);
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
            this.selectWeapon(1);
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
            this.selectWeapon(2);
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
            this.reloadWeapon();
        }

        // Pause
        if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
            this.scene.pause();
            this.scene.launch('PauseScene');
        }
    }

    cycleWeapon() {
        const rangedWeapons = this.weapons.available.filter(w =>
            this.weaponData[w] && this.weaponData[w].type !== 'melee'
        );
        if (rangedWeapons.length > 1) {
            this.weapons.rangedIndex = (this.weapons.rangedIndex + 1) % rangedWeapons.length;
            this.weapons.ranged = rangedWeapons[this.weapons.rangedIndex];
            this.showWeaponSwitch(this.weapons.ranged);
            this.events.emit('weaponChanged', this.weapons.ranged);
        }
    }

    selectWeapon(index) {
        const rangedWeapons = this.weapons.available.filter(w =>
            this.weaponData[w] && this.weaponData[w].type !== 'melee'
        );
        if (index < rangedWeapons.length) {
            this.weapons.rangedIndex = index;
            this.weapons.ranged = rangedWeapons[index];
            this.showWeaponSwitch(this.weapons.ranged);
            this.events.emit('weaponChanged', this.weapons.ranged);
        }
    }

    showWeaponSwitch(weapon) {
        const text = this.add.text(this.player.x, this.player.y - 50,
            weapon.toUpperCase().replace('_', ' '), {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#00ffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: this.player.y - 70,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    reloadWeapon() {
        const weaponData = this.weaponData[this.weapons.ranged];
        if (!weaponData || weaponData.type === 'energy') return;

        const ammoType = weaponData.ammoType;
        const maxMag = weaponData.magazine;
        const currentMag = this.playerStats.currentMag || 0;
        const reserve = this.playerStats.ammo[ammoType];

        if (currentMag < maxMag && reserve > 0) {
            const needed = maxMag - currentMag;
            const toLoad = Math.min(needed, reserve);
            this.playerStats.currentMag = currentMag + toLoad;
            this.playerStats.ammo[ammoType] -= toLoad;
            this.events.emit('ammoChanged', this.playerStats.ammo);
        }
    }

    energyAttack() {
        if (this.playerStats.energy < 2) return;

        this.playerState.attackCooldown = 150;
        this.playerStats.energy -= 2;

        const dir = this.playerState.facingRight ? 1 : -1;
        const bullet = this.bullets.get(
            this.player.x + dir * 20,
            this.player.y,
            'energy_bullet'
        );

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(false);
            bullet.setVelocityX(dir * 600);
            bullet.damage = 8;
            bullet.lifespan = 1500;
            bullet.isEnergy = true;
            bullet.setTint(0x00ffff);
        }

        this.events.emit('energyChanged', this.playerStats.energy, this.playerStats.maxEnergy);
    }

    startDash() {
        this.playerState.isDashing = true;
        this.playerState.dashCooldown = DASH_COOLDOWN;
        this.playerState.iFrames = DASH_DURATION;

        const dir = this.playerState.facingRight ? 1 : -1;
        this.player.setVelocity(dir * DASH_SPEED, 0);
        this.player.body.setAllowGravity(false);

        // Dash effect
        this.player.setTint(0x00ffff);

        this.time.delayedCall(DASH_DURATION, () => {
            this.playerState.isDashing = false;
            this.player.body.setAllowGravity(true);
            this.player.clearTint();
        });
    }

    meleeAttack() {
        // Combo system
        this.playerState.comboCount++;
        if (this.playerState.comboCount > this.playerState.maxCombo) {
            this.playerState.comboCount = 1;
        }
        this.playerState.comboTimer = 600; // 0.6s window for combo

        // Emit combo event for UI
        this.events.emit('comboChanged', this.playerState.comboCount);

        // Faster attacks in combo
        const baseSpeed = this.weaponData[this.weapons.equipped]?.speed || 400;
        this.playerState.attackCooldown = baseSpeed - (this.playerState.comboCount - 1) * 50;
        this.playerState.isAttacking = true;

        // Position hitbox
        const dir = this.playerState.facingRight ? 1 : -1;
        this.meleeHitbox.x = this.player.x + dir * 32;
        this.meleeHitbox.y = this.player.y;
        this.meleeHitbox.setVisible(true);

        // Attack effect varies by combo hit
        const slashColors = [0x00ffff, 0x00ff88, 0xffff00];
        const slashColor = slashColors[this.playerState.comboCount - 1] || 0x00ffff;
        const slashWidth = 40 + this.playerState.comboCount * 10;

        const slash = this.add.rectangle(
            this.player.x + dir * 24,
            this.player.y,
            slashWidth, 8 + this.playerState.comboCount * 2,
            slashColor, 0.8
        );
        slash.setRotation(dir > 0 ? 0.3 : -0.3);

        // Calculate damage with combo bonus
        let damage = this.getMeleeDamage();
        if (this.playerState.comboCount === this.playerState.maxCombo) {
            damage *= 1.5; // Combo finisher bonus
        }

        // Check for hits
        this.enemies.children.each(enemy => {
            if (enemy.active) {
                const dist = Phaser.Math.Distance.Between(
                    this.meleeHitbox.x, this.meleeHitbox.y,
                    enemy.x, enemy.y
                );
                if (dist < 50) {
                    this.damageEnemy(enemy, damage);
                }
            }
        });

        // Also check bosses
        this.bosses.children.each(boss => {
            if (boss.active) {
                const dist = Phaser.Math.Distance.Between(
                    this.meleeHitbox.x, this.meleeHitbox.y,
                    boss.x, boss.y
                );
                if (dist < 60) {
                    this.damageBoss(boss, damage);
                }
            }
        });

        // Cleanup
        this.time.delayedCall(100, () => {
            slash.destroy();
            this.meleeHitbox.setVisible(false);
            this.playerState.isAttacking = false;
        });
    }

    damageBoss(boss, amount) {
        boss.health -= amount;

        // Flash red
        boss.setTint(0xff0000);
        this.time.delayedCall(100, () => boss.clearTint());

        // Damage number
        const dmgText = this.add.text(boss.x, boss.y - 30, Math.floor(amount).toString(), {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ff8800'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: dmgText,
            y: boss.y - 60,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy()
        });

        // Emit boss health event
        this.events.emit('bossHealthChanged', boss.health, boss.maxHealth, boss.enemyType);

        if (boss.health <= 0) {
            this.killBoss(boss);
        }
    }

    killBoss(boss) {
        // Massive death effect
        for (let i = 0; i < 20; i++) {
            const particle = this.add.circle(
                boss.x + Phaser.Math.Between(-30, 30),
                boss.y + Phaser.Math.Between(-30, 30),
                Phaser.Math.Between(4, 10),
                0xff4444
            );
            this.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-80, 80),
                y: particle.y + Phaser.Math.Between(-80, 80),
                alpha: 0,
                scale: 0,
                duration: 600,
                onComplete: () => particle.destroy()
            });
        }

        // SHODAN taunt
        this.showShodanMessage("SO YOU CAN DESTROY MY TOYS. IMPRESSIVE. FOR AN INSECT.");

        // Drop augmentation
        if (boss.enemyType === 'diego') {
            this.spawnAugmentation('hydraulicLegs', boss.x, boss.y);
        }

        boss.destroy();
    }

    spawnAugmentation(type, x, y) {
        const aug = this.items.create(x, y, 'augmentation');
        aug.itemType = 'augmentation';
        aug.augType = type;

        // Bounce effect
        this.tweens.add({
            targets: aug,
            y: y - 30,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    rangedAttack() {
        if (this.playerStats.ammo.standard <= 0) return;

        this.playerState.attackCooldown = 250;
        this.playerStats.ammo.standard--;

        const dir = this.playerState.facingRight ? 1 : -1;
        const bullet = this.bullets.get(
            this.player.x + dir * 20,
            this.player.y,
            'bullet'
        );

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(false);
            bullet.setVelocityX(dir * 500);
            bullet.damage = 12;
            bullet.lifespan = 2000;
        }

        // Emit event for UI update
        this.events.emit('ammoChanged', this.playerStats.ammo);
    }

    getMeleeDamage() {
        switch (this.weapons.equipped) {
            case 'pipe': return 15;
            case 'lead_pipe': return 22;
            case 'laser_rapier': return 30;
            default: return 15;
        }
    }

    updateEnemies(delta) {
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            if (enemy.staggerTimer > 0) {
                enemy.staggerTimer -= delta;
                return;
            }

            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );

            const seePlayer = distToPlayer < 250;

            switch (enemy.state) {
                case 'patrol':
                    // Move back and forth
                    enemy.setVelocityX(enemy.patrolDir * enemy.speed * 0.5);

                    if (enemy.body.blocked.left) enemy.patrolDir = 1;
                    if (enemy.body.blocked.right) enemy.patrolDir = -1;

                    if (seePlayer) {
                        enemy.state = 'chase';
                    }
                    break;

                case 'chase':
                    // Move toward player
                    const dir = this.player.x < enemy.x ? -1 : 1;
                    enemy.setVelocityX(dir * enemy.speed);
                    enemy.setFlipX(dir < 0);

                    // Shooting enemies
                    if (enemy.canShoot && distToPlayer < 200) {
                        enemy.shootCooldown -= delta;
                        if (enemy.shootCooldown <= 0) {
                            this.enemyShoot(enemy);
                            enemy.shootCooldown = 1500;
                        }
                    }

                    if (!seePlayer) {
                        enemy.alertTimer += delta;
                        if (enemy.alertTimer > 3000) {
                            enemy.state = 'patrol';
                            enemy.alertTimer = 0;
                        }
                    } else {
                        enemy.alertTimer = 0;
                    }
                    break;
            }

            // Flying enemies
            if (enemy.canFly) {
                const targetY = this.player.y - 50;
                if (Math.abs(enemy.y - targetY) > 20) {
                    enemy.setVelocityY(enemy.y > targetY ? -80 : 80);
                } else {
                    enemy.setVelocityY(0);
                }
            }

            // Lunge attack (Mutant Dog)
            if (enemy.canLunge && enemy.state === 'chase' && distToPlayer < 150) {
                enemy.lungeTimer -= delta;
                if (enemy.lungeTimer <= 0) {
                    const dir = this.player.x < enemy.x ? -1 : 1;
                    enemy.setVelocity(dir * 300, -200);
                    enemy.lungeTimer = 1500;
                }
            }

            // Hop behavior (Hopper)
            if (enemy.canHop) {
                enemy.hopTimer -= delta;
                if (enemy.hopTimer <= 0 && enemy.body.blocked.down) {
                    const jumpDir = Phaser.Math.Between(-1, 1);
                    enemy.setVelocity(jumpDir * 150, -350);
                    enemy.hopTimer = Phaser.Math.Between(500, 1200);
                }
            }

            // Acid spit (Toxic Spitter)
            if (enemy.canSpit && enemy.state === 'chase' && distToPlayer < 200) {
                enemy.spitCooldown -= delta;
                if (enemy.spitCooldown <= 0) {
                    this.enemySpitAcid(enemy);
                    enemy.spitCooldown = 2000;
                }
            }

            // Grenade throw (Elite Cyborg)
            if (enemy.hasGrenade && enemy.state === 'chase' && distToPlayer > 100) {
                enemy.grenadeCooldown -= delta;
                if (enemy.grenadeCooldown <= 0) {
                    this.enemyThrowGrenade(enemy);
                    enemy.grenadeCooldown = 5000;
                }
            }

            // Teleport (Cortex Reaver)
            if (enemy.canTeleport) {
                enemy.teleportCooldown -= delta;
                enemy.psiCooldown -= delta;

                if (enemy.psiCooldown <= 0 && distToPlayer < 200) {
                    this.enemyPsiBlast(enemy);
                    enemy.psiCooldown = 2500;
                }

                if (enemy.teleportCooldown <= 0 && distToPlayer < 100) {
                    // Teleport away
                    const newX = enemy.x + Phaser.Math.Between(-150, 150);
                    const newY = enemy.y + Phaser.Math.Between(-80, 80);
                    enemy.setPosition(
                        Phaser.Math.Clamp(newX, 50, 590),
                        Phaser.Math.Clamp(newY, 50, 400)
                    );
                    enemy.teleportCooldown = 3000;

                    // Teleport effect
                    this.add.circle(enemy.x, enemy.y, 20, 0xff00ff, 0.5)
                        .setAlpha(0.8);
                }
            }

            // Mutant Gorilla ground slam
            if (enemy.canSlam && enemy.state === 'chase' && distToPlayer < 80) {
                enemy.slamCooldown -= delta;
                if (enemy.slamCooldown <= 0 && enemy.body.blocked.down) {
                    this.gorillaSlam(enemy);
                    enemy.slamCooldown = 3000;
                }
            }

            // Sec-2 Bot rapid fire
            if (enemy.rapidFire && distToPlayer < 300) {
                enemy.shootCooldown -= delta;
                if (enemy.shootCooldown <= 0) {
                    this.enemyShoot(enemy);
                    enemy.burstCount++;
                    if (enemy.burstCount >= 5) {
                        enemy.shootCooldown = 2000;
                        enemy.burstCount = 0;
                    } else {
                        enemy.shootCooldown = 150;
                    }
                }
            }

            // Assassin Bot cloaking
            if (enemy.canCloak) {
                enemy.cloakTimer -= delta;
                if (!enemy.cloaked && enemy.cloakTimer <= 0 && distToPlayer > 150) {
                    enemy.cloaked = true;
                    enemy.setAlpha(0.2);
                    enemy.cloakTimer = 3000;
                }
                if (enemy.cloaked && distToPlayer < 60) {
                    enemy.cloaked = false;
                    enemy.setAlpha(1);
                    enemy.cloakTimer = 5000;
                    // Ambush attack
                    if (this.playerState.iFrames <= 0) {
                        this.damagePlayer(enemy.damage);
                        this.player.setVelocity((this.player.x < enemy.x ? -1 : 1) * 200, -150);
                    }
                }
            }

            // Mutant Hulk charge
            if (enemy.canCharge && enemy.enemyType === 'mutant_hulk') {
                if (!enemy.charging && distToPlayer < 200 && enemy.body.blocked.down) {
                    enemy.charging = true;
                    enemy.chargeDir = this.player.x < enemy.x ? -1 : 1;
                }
                if (enemy.charging) {
                    enemy.setVelocityX(enemy.chargeDir * 350);
                    if (enemy.body.blocked.left || enemy.body.blocked.right) {
                        // Wall bounce
                        enemy.chargeDir *= -1;
                        enemy.setVelocityX(enemy.chargeDir * 350);
                        // Stop after 2 bounces
                        if (Math.random() < 0.5) {
                            enemy.charging = false;
                        }
                    }
                }
            }
        });
    }

    gorillaSlam(enemy) {
        // Ground pound AoE
        const range = 96;
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist < range && this.playerState.iFrames <= 0) {
            this.damagePlayer(enemy.damage);
            this.player.setVelocity(0, -300);
        }

        // Visual effect
        const shockwave = this.add.circle(enemy.x, enemy.y + 20, 10, 0xffaa00, 0.8);
        this.tweens.add({
            targets: shockwave,
            scaleX: 8,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => shockwave.destroy()
        });
    }

    enemySpitAcid(enemy) {
        const dir = this.player.x < enemy.x ? -1 : 1;
        const bullet = this.enemyBullets.get(
            enemy.x + dir * 15,
            enemy.y,
            'bullet'
        );

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(true);
            bullet.setVelocity(dir * 200, -100);
            bullet.setTint(0x00ff00);
            bullet.damage = enemy.damage;
            bullet.lifespan = 3000;
            bullet.isAcid = true;
        }
    }

    enemyThrowGrenade(enemy) {
        const dir = this.player.x < enemy.x ? -1 : 1;
        const grenade = this.enemyBullets.get(
            enemy.x + dir * 15,
            enemy.y - 10,
            'bullet'
        );

        if (grenade) {
            grenade.setActive(true);
            grenade.setVisible(true);
            grenade.body.setAllowGravity(true);
            grenade.setVelocity(dir * 150, -250);
            grenade.setTint(0xff8800);
            grenade.damage = 30;
            grenade.lifespan = 2000;
            grenade.isGrenade = true;
            grenade.setScale(1.5);
        }
    }

    enemyPsiBlast(enemy) {
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            this.player.x, this.player.y
        );

        const bullet = this.enemyBullets.get(enemy.x, enemy.y, 'energy_bullet');

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(false);
            bullet.setVelocity(
                Math.cos(angle) * 400,
                Math.sin(angle) * 400
            );
            bullet.setTint(0xff00ff);
            bullet.damage = enemy.damage;
            bullet.lifespan = 2000;
            bullet.isPsi = true;
        }
    }

    enemyShoot(enemy) {
        const dir = this.player.x < enemy.x ? -1 : 1;
        const bullet = this.enemyBullets.get(
            enemy.x + dir * 15,
            enemy.y,
            'bullet'
        );

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(false);
            bullet.setVelocityX(dir * 300);
            bullet.setTint(0xff4444);
            bullet.damage = enemy.damage;
            bullet.lifespan = 3000;
        }
    }

    updateBullets(delta) {
        [this.bullets, this.enemyBullets].forEach(group => {
            group.children.each(bullet => {
                if (!bullet.active) return;

                bullet.lifespan -= delta;
                if (bullet.lifespan <= 0 ||
                    bullet.x < 0 || bullet.x > 640 ||
                    bullet.y < 0 || bullet.y > 480) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                }
            });
        });
    }

    playerHitEnemy(player, enemy) {
        if (this.playerState.iFrames > 0) return;
        if (this.playerState.isDashing) return;

        this.damagePlayer(enemy.damage);

        // Knockback
        const dir = player.x < enemy.x ? -1 : 1;
        player.setVelocity(dir * 200, -150);
    }

    bulletHitEnemy(bullet, enemy) {
        if (!bullet.active) return;

        bullet.setActive(false);
        bullet.setVisible(false);

        this.damageEnemy(enemy, bullet.damage);
    }

    enemyBulletHitPlayer(player, bullet) {
        if (!bullet.active) return;
        if (this.playerState.iFrames > 0) return;
        if (this.playerState.isDashing) return;

        bullet.setActive(false);
        bullet.setVisible(false);

        this.damagePlayer(bullet.damage);
    }

    damagePlayer(amount) {
        this.playerStats.health -= amount;
        this.playerState.iFrames = 1000;

        // Screen flash
        this.cameras.main.flash(100, 255, 0, 0);

        this.events.emit('healthChanged', this.playerStats.health, this.playerStats.maxHealth);

        if (this.playerStats.health <= 0) {
            this.playerDeath();
        }
    }

    damageEnemy(enemy, amount) {
        enemy.health -= amount;
        enemy.staggerTimer = 200;
        enemy.setTint(0xff0000);

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, amount.toString(), {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy()
        });

        this.time.delayedCall(100, () => enemy.clearTint());

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Death particles
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(
                enemy.x + Phaser.Math.Between(-10, 10),
                enemy.y + Phaser.Math.Between(-10, 10),
                4, 0xff4444
            );
            this.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-40, 40),
                y: particle.y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        enemy.destroy();
    }

    playerDeath() {
        this.showShodanMessage("PATHETIC. YOUR FLESH FAILS YOU.");

        this.time.delayedCall(2000, () => {
            // Reset to last save
            this.playerStats.health = this.playerStats.maxHealth;
            this.player.setPosition(100, 400);
            this.events.emit('healthChanged', this.playerStats.health, this.playerStats.maxHealth);
        });
    }

    collectItem(player, item) {
        switch (item.itemType) {
            case 'health':
                this.playerStats.health = Math.min(
                    this.playerStats.health + item.value,
                    this.playerStats.maxHealth
                );
                this.events.emit('healthChanged', this.playerStats.health, this.playerStats.maxHealth);
                break;

            case 'energy':
                this.playerStats.energy = Math.min(
                    this.playerStats.energy + item.value,
                    this.playerStats.maxEnergy
                );
                this.events.emit('energyChanged', this.playerStats.energy, this.playerStats.maxEnergy);
                break;

            case 'ammo':
                this.playerStats.ammo[item.ammoType] = Math.min(
                    this.playerStats.ammo[item.ammoType] + item.value,
                    this.playerStats.maxAmmo[item.ammoType]
                );
                this.events.emit('ammoChanged', this.playerStats.ammo);
                break;

            case 'augmentation':
                this.acquireAugmentation(item.augType);
                break;
        }

        // Pickup effect
        const text = this.add.text(item.x, item.y - 20, '+' + item.value, {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: item.y - 50,
            alpha: 0,
            duration: 600,
            onComplete: () => text.destroy()
        });

        item.destroy();
    }

    acquireAugmentation(type) {
        this.augmentations[type] = true;

        const names = {
            hydraulicLegs: 'HYDRAULIC LEGS - Double Jump Acquired',
            geckoPads: 'GECKO PADS - Wall Jump Acquired',
            neuralDash: 'NEURAL DASH - Dash Acquired',
            thermalShielding: 'THERMAL SHIELDING - Fire Immunity',
            hazmatCoating: 'HAZMAT COATING - Toxic Immunity',
            magneticBoots: 'MAGNETIC BOOTS - Mag-Walk'
        };

        this.showAugmentationMessage(names[type] || type);
        this.showShodanMessage("YOU STEAL FROM ME. I WILL RECLAIM IT WITH YOUR CORPSE.");
    }

    showAugmentationMessage(text) {
        const msg = this.add.text(400, 200, text, {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ff00ff',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 3000,
            delay: 2000,
            onComplete: () => msg.destroy()
        });
    }

    enterDoor(player, door) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
            this.transitionToRoom(door.targetRoom);
        }
    }

    transitionToRoom(roomId) {
        // Transition effect
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
            // Clear current room
            this.enemies.clear(true, true);
            this.items.clear(true, true);

            // Load new room
            this.loadRoom(roomId);
            this.gameState.currentRoom = roomId;
            this.gameState.roomsVisited.push(roomId);

            // SHODAN comment
            const messages = [
                "YOU CANNOT ESCAPE. THIS STATION IS MINE.",
                "EVERY STEP BRINGS YOU CLOSER TO YOUR DEATH.",
                "I KNOW WHERE YOU GO, INSECT.",
                "THIS DECK WILL BE YOUR TOMB."
            ];
            this.showShodanMessage(messages[Phaser.Math.Between(0, messages.length - 1)]);

            this.cameras.main.fadeIn(300);
        });
    }

    loadRoom(roomId) {
        // Room definitions
        const rooms = {
            medical_start: {
                enemies: [
                    { type: 'shambler', x: 350, y: 400 },
                    { type: 'shambler', x: 500, y: 400 },
                    { type: 'maintenance_bot', x: 300, y: 280 }
                ],
                items: [
                    { type: 'health', x: 250, y: 280 }
                ],
                deck: 'medical'
            },
            medical_hall: {
                enemies: [
                    { type: 'shambler', x: 200, y: 400 },
                    { type: 'shambler', x: 400, y: 400 },
                    { type: 'mutant_dog', x: 500, y: 400 }
                ],
                items: [
                    { type: 'ammo', x: 300, y: 280 }
                ],
                deck: 'medical'
            },
            medical_boss: {
                boss: { type: 'diego', x: 500, y: 380 },
                deck: 'medical'
            },
            research_start: {
                enemies: [
                    { type: 'hopper', x: 250, y: 400 },
                    { type: 'hopper', x: 400, y: 400 },
                    { type: 'toxic_spitter', x: 550, y: 400 }
                ],
                items: [
                    { type: 'energy', x: 350, y: 180 }
                ],
                deck: 'research'
            },
            research_boss: {
                boss: { type: 'travers', x: 400, y: 200 },
                deck: 'research'
            }
        };

        const room = rooms[roomId];
        if (!room) return;

        // Update deck indicator
        this.gameState.currentDeck = room.deck;
        this.events.emit('deckChanged', room.deck);

        // Spawn enemies
        if (room.enemies) {
            room.enemies.forEach(e => {
                this.spawnEnemy(e.type, e.x, e.y);
            });
        }

        // Spawn items
        if (room.items) {
            room.items.forEach(i => {
                const item = this.items.create(i.x, i.y,
                    i.type === 'health' ? 'health_pickup' :
                    i.type === 'energy' ? 'energy_pickup' : 'ammo_pickup'
                );
                item.itemType = i.type;
                item.value = i.type === 'ammo' ? 15 : 25;
                if (i.type === 'ammo') item.ammoType = 'standard';
            });
        }

        // Spawn boss
        if (room.boss) {
            this.spawnBoss(room.boss.type, room.boss.x, room.boss.y);
        }

        // Reposition player
        this.player.setPosition(100, 400);
    }

    checkSavePoint() {
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.savePoint.x, this.savePoint.y
        );

        if (dist < 50) {
            this.savePoint.setAlpha(1);
            if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                this.saveGame();
            }
        } else {
            this.savePoint.setAlpha(0.7);
        }
    }

    saveGame() {
        // Restore HP/Energy
        this.playerStats.health = this.playerStats.maxHealth;
        this.playerStats.energy = this.playerStats.maxEnergy;
        this.events.emit('healthChanged', this.playerStats.health, this.playerStats.maxHealth);
        this.events.emit('energyChanged', this.playerStats.energy, this.playerStats.maxEnergy);

        // Save flash
        this.cameras.main.flash(200, 0, 255, 0);

        const saveText = this.add.text(this.savePoint.x, this.savePoint.y - 50, 'RESTORATION COMPLETE', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: saveText,
            alpha: 0,
            duration: 2000,
            onComplete: () => saveText.destroy()
        });
    }

    showShodanMessage(text) {
        const container = this.add.container(400, 80);

        const bg = this.add.rectangle(0, 0, 600, 60, 0x000000, 0.9);
        bg.setStrokeStyle(2, 0xff0000);

        const shodanText = this.add.text(0, 0, text, {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#ff4444',
            align: 'center',
            wordWrap: { width: 580 }
        }).setOrigin(0.5);

        container.add([bg, shodanText]);

        // Glitch effect
        this.tweens.add({
            targets: container,
            x: { value: '+=5', duration: 50, yoyo: true, repeat: 3 },
            alpha: { from: 0, to: 1 }
        });

        this.tweens.add({
            targets: container,
            alpha: 0,
            duration: 500,
            delay: 3000,
            onComplete: () => container.destroy()
        });
    }
}

// ===================== UI SCENE =====================
class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        // Health bar
        this.healthBarBg = this.add.rectangle(110, 25, 200, 20, 0x333333);
        this.healthBar = this.add.rectangle(110, 25, 200, 20, 0xff4444);
        this.healthText = this.add.text(10, 18, 'HP: 100/100', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: '#ffffff'
        });

        // Energy bar
        this.energyBarBg = this.add.rectangle(110, 50, 200, 16, 0x333333);
        this.energyBar = this.add.rectangle(110, 50, 200, 16, 0x4444ff);
        this.energyText = this.add.text(10, 43, 'EN: 100/100', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#aaaaff'
        });

        // Weapon display
        this.weaponText = this.add.text(10, 560, 'PIPE', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: '#ffffff'
        });

        // Ammo display
        this.ammoText = this.add.text(10, 580, 'AMMO: 50/100', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#ffff00'
        });

        // Minimap frame
        this.add.rectangle(740, 60, 100, 100, 0x000000, 0.7)
            .setStrokeStyle(2, 0x00ffff);
        this.add.text(740, 15, 'MAP', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Current room indicator
        this.roomText = this.add.text(740, 120, 'MEDICAL', {
            fontFamily: 'Courier New',
            fontSize: '10px',
            color: '#00ff00'
        }).setOrigin(0.5);

        // Boss health bar (hidden initially)
        this.bossBarBg = this.add.rectangle(400, 550, 400, 20, 0x333333);
        this.bossBar = this.add.rectangle(400, 550, 400, 20, 0xff0000);
        this.bossText = this.add.text(400, 550, '', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.bossBarBg.setVisible(false);
        this.bossBar.setVisible(false);
        this.bossText.setVisible(false);

        // Combo indicator
        this.comboText = this.add.text(400, 480, '', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Listen for events from game scene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('healthChanged', this.updateHealth, this);
        gameScene.events.on('energyChanged', this.updateEnergy, this);
        gameScene.events.on('ammoChanged', this.updateAmmo, this);
        gameScene.events.on('weaponChanged', this.updateWeapon, this);
        gameScene.events.on('bossHealthChanged', this.updateBossHealth, this);
        gameScene.events.on('comboChanged', this.updateCombo, this);
    }

    updateWeapon(weapon) {
        this.weaponText.setText(weapon.toUpperCase().replace('_', ' '));
    }

    updateBossHealth(current, max, name) {
        if (current > 0) {
            this.bossBarBg.setVisible(true);
            this.bossBar.setVisible(true);
            this.bossText.setVisible(true);

            const percent = current / max;
            this.bossBar.setScale(percent, 1);
            this.bossBar.x = 200 + (400 * percent) / 2;
            this.bossText.setText(`${name.toUpperCase()}: ${Math.floor(current)}/${max}`);
        } else {
            this.bossBarBg.setVisible(false);
            this.bossBar.setVisible(false);
            this.bossText.setVisible(false);
        }
    }

    updateCombo(count) {
        if (count > 1) {
            this.comboText.setText(`COMBO x${count}`);
            this.comboText.setAlpha(1);
            this.tweens.add({
                targets: this.comboText,
                alpha: 0,
                duration: 800,
                delay: 300
            });
        }
    }

    updateHealth(current, max) {
        const percent = current / max;
        this.healthBar.setScale(percent, 1);
        this.healthBar.x = 10 + (200 * percent) / 2;
        this.healthText.setText(`HP: ${current}/${max}`);

        if (percent < 0.25) {
            this.healthBar.setFillStyle(0xff0000);
        } else {
            this.healthBar.setFillStyle(0xff4444);
        }
    }

    updateEnergy(current, max) {
        const percent = current / max;
        this.energyBar.setScale(percent, 1);
        this.energyBar.x = 10 + (200 * percent) / 2;
        this.energyText.setText(`EN: ${current}/${max}`);
    }

    updateAmmo(ammo) {
        this.ammoText.setText(`AMMO: ${ammo.standard}/100`);
    }
}

// ===================== CONFIG =====================
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene, PauseScene]
};

// Start game
const game = new Phaser.Game(config);
