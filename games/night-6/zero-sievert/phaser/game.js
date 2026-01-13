// Zero Sievert Clone - Phaser 3
// Top-down Extraction Shooter

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const ZONE_WIDTH = 1600;
const ZONE_HEIGHT = 1600;

// Game state
let gamePaused = new URLSearchParams(location.search).has('test');
let gameState = 'playing'; // AUTO-START: Skip menu
        // menu, bunker, raid, dead, extracted
let stats = {
    enemiesKilled: 0,
    containersLooted: 0,
    extractions: 0,
    rubles: 1000,
    totalRubles: 0,
    raids: 0,
    deaths: 0,
    grenadesTossed: 0
};

// Grenade config
const GRENADE_CONFIG = {
    damage: 80,
    radius: 100,
    throwSpeed: 300,
    fuseTime: 2000, // ms
    maxGrenades: 3
};

// Weapons config
const WEAPONS = {
    pm_pistol: { name: 'PM Pistol', damage: 18, fireRate: 300, spread: 8, magSize: 8, range: 200, type: 'pistol' },
    ak74: { name: 'AK-74', damage: 28, fireRate: 100, spread: 6, magSize: 30, range: 300, type: 'rifle' },
    shotgun: { name: 'Pump Shotgun', damage: 10, pellets: 8, fireRate: 800, spread: 25, magSize: 6, range: 150, type: 'shotgun' },
    smg: { name: 'Skorpion', damage: 14, fireRate: 60, spread: 12, magSize: 20, range: 180, type: 'smg' }
};

// Enemy types
const ENEMY_TYPES = {
    bandit_scout: { hp: 60, damage: 15, speed: 80, color: 0x886644, range: 200, fireRate: 800, name: 'Bandit Scout' },
    bandit: { hp: 80, damage: 20, speed: 70, color: 0x664422, range: 180, fireRate: 500, name: 'Bandit' },
    bandit_heavy: { hp: 120, damage: 25, speed: 50, color: 0x443322, range: 150, fireRate: 200, name: 'Bandit Heavy' },
    ghoul: { hp: 50, damage: 12, speed: 120, color: 0x446644, range: 30, fireRate: 1000, name: 'Ghoul', melee: true },
    spitter: { hp: 40, damage: 8, speed: 60, color: 0x448844, range: 250, fireRate: 1500, name: 'Spitter' },
    wolf: { hp: 40, damage: 15, speed: 140, color: 0x888888, range: 25, fireRate: 800, name: 'Wolf', melee: true },
    boar: { hp: 80, damage: 20, speed: 100, color: 0x664444, range: 30, fireRate: 2000, name: 'Boar', melee: true, charges: true }
};

// Loot containers
const CONTAINER_TYPES = {
    wooden_box: { color: 0x8B4513, lootTier: 'common', name: 'Wooden Box' },
    weapon_box: { color: 0x4a5568, lootTier: 'uncommon', name: 'Weapon Box' },
    medical_box: { color: 0xffffff, lootTier: 'medical', name: 'Medical Box' },
    safe: { color: 0x2d3748, lootTier: 'rare', name: 'Safe' }
};

// Loot tables
const LOOT_TABLES = {
    common: [
        { name: 'Rubles', value: [50, 200], chance: 0.4 },
        { name: 'Bandage', value: 1, chance: 0.3 },
        { name: '9mm Ammo', value: [10, 30], chance: 0.3 }
    ],
    uncommon: [
        { name: 'Rubles', value: [100, 500], chance: 0.3 },
        { name: 'Medkit', value: 1, chance: 0.2 },
        { name: '7.62 Ammo', value: [15, 40], chance: 0.25 },
        { name: 'Repair Kit', value: 1, chance: 0.15 },
        { name: 'Attachment', value: 1, chance: 0.1 }
    ],
    medical: [
        { name: 'Bandage', value: [2, 4], chance: 0.4 },
        { name: 'Medkit', value: [1, 2], chance: 0.3 },
        { name: 'Painkillers', value: [1, 3], chance: 0.2 },
        { name: 'Antirad Pills', value: 1, chance: 0.1 }
    ],
    rare: [
        { name: 'Rubles', value: [500, 2000], chance: 0.3 },
        { name: 'Rare Weapon', value: 1, chance: 0.15 },
        { name: 'Armor Piece', value: 1, chance: 0.2 },
        { name: 'Key', value: 1, chance: 0.1 },
        { name: 'Valuable Item', value: [1000, 3000], chance: 0.25 }
    ]
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

        // Background
        this.add.rectangle(400, 300, 800, 600, 0x0a0a0a);

        // Title
        this.add.text(400, 150, 'ZERO SIEVERT', {
            fontSize: '48px',
            fill: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 210, 'Extraction Shooter', {
            fontSize: '20px',
            fill: '#6b7280'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.rectangle(400, 320, 200, 50, 0x22c55e)
            .setInteractive({ useHandCursor: true });
        this.add.text(400, 320, 'START RAID', {
            fontSize: '20px',
            fill: '#000'
        }).setOrigin(0.5);

        startBtn.on('pointerdown', () => {
            this.scene.start('RaidScene');
        });

        // Keyboard support for starting
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Controls
        this.add.text(400, 400, 'WASD: Move | Mouse: Aim | LMB: Shoot | RMB: ADS', {
            fontSize: '13px',
            fill: '#6b7280'
        }).setOrigin(0.5);

        this.add.text(400, 425, 'R: Reload | E: Loot | Space: Dodge | Shift: Sprint', {
            fontSize: '13px',
            fill: '#6b7280'
        }).setOrigin(0.5);

        this.add.text(400, 450, 'G: Grenade | F: Flashlight | 1: Heal', {
            fontSize: '13px',
            fill: '#6b7280'
        }).setOrigin(0.5);

        this.add.text(400, 500, `Rubles: ${stats.rubles}`, {
            fontSize: '18px',
            fill: '#fbbf24'
        }).setOrigin(0.5);

        // Set up harness
        this.setupHarness();
    }

    setupHarness() {
        const scene = this;

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,

            execute: async (action, durationMs) => {
                return new Promise((resolve) => {
                    gamePaused = false;
                    setTimeout(() => {
                        gamePaused = true;
                        resolve();
                    }, durationMs);
                });
            },

            getState: () => ({
                gameState: gameState,
                stats: stats
            }),

            getPhase: () => gameState,

            debug: {
                setHealth: () => {},
                forceStart: () => {
                    scene.scene.start('RaidScene');
                },
                clearEnemies: () => {},
                addRubles: (amount) => { stats.rubles += amount; }
            }
        };
    }
}

class RaidScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RaidScene' });
    }

    create() {
        gameState = 'raid';
        stats.raids++;

        // Initialize raid state
        this.raidLoot = [];
        this.raidRubles = 0;
        this.enemies = [];
        this.bullets = [];
        this.containers = [];
        this.extractionPoints = [];

        // Player state
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.playerStamina = 100;
        this.playerMaxStamina = 100;
        this.isBleeding = false;
        this.bleedTimer = 0;
        this.currentWeapon = { ...WEAPONS.ak74, ammo: 30 };
        this.isReloading = false;
        this.dodgeCooldown = 0;
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.lastFireTime = 0;

        // New status effects
        this.radiation = 0; // 0-100, reduces max HP
        this.radiationDamageTimer = 0;
        this.isADS = false; // Aim down sights
        this.flashlightOn = false;
        this.grenadeCount = GRENADE_CONFIG.maxGrenades;
        this.grenades = []; // Active grenades
        this.damageIndicators = []; // Direction indicators

        // Generate zone
        this.generateZone();

        // Create player
        this.player = this.add.container(200, 200);
        const playerBody = this.add.circle(0, 0, 12, 0x22c55e);
        const playerGun = this.add.rectangle(12, 0, 16, 4, 0x888888);
        this.player.add([playerBody, playerGun]);
        this.player.setDepth(10);

        // Camera setup
        this.cameras.main.setBounds(0, 0, ZONE_WIDTH, ZONE_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Bullet group
        this.bulletGraphics = this.add.graphics();

        // Create UI
        this.createUI();

        // Input setup
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            g: Phaser.Input.Keyboard.KeyCodes.G,
            f: Phaser.Input.Keyboard.KeyCodes.F,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            one: Phaser.Input.Keyboard.KeyCodes.ONE
        });

        // Flashlight graphics
        this.flashlightGraphics = this.add.graphics();
        this.flashlightGraphics.setDepth(5);

        // Damage indicator graphics
        this.damageIndicatorGraphics = this.add.graphics();
        this.damageIndicatorGraphics.setScrollFactor(0);
        this.damageIndicatorGraphics.setDepth(150);

        // Grenade graphics
        this.grenadeGraphics = this.add.graphics();

        // Setup harness
        this.setupHarness();
    }

    generateZone() {
        // Ground
        this.add.rectangle(ZONE_WIDTH/2, ZONE_HEIGHT/2, ZONE_WIDTH, ZONE_HEIGHT, 0x2d3a1a);

        // Generate terrain features
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(50, ZONE_WIDTH - 50);
            const y = Phaser.Math.Between(50, ZONE_HEIGHT - 50);
            const size = Phaser.Math.Between(20, 60);
            // Trees
            this.add.circle(x, y, size, 0x1a2e0a, 0.7);
        }

        // Generate buildings
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(200, ZONE_WIDTH - 200);
            const y = Phaser.Math.Between(200, ZONE_HEIGHT - 200);
            const w = Phaser.Math.Between(80, 150);
            const h = Phaser.Math.Between(60, 120);

            this.add.rectangle(x, y, w, h, 0x3d3d3d).setStrokeStyle(2, 0x555555);

            // Spawn containers inside
            for (let j = 0; j < Phaser.Math.Between(1, 3); j++) {
                this.spawnContainer(
                    x + Phaser.Math.Between(-w/3, w/3),
                    y + Phaser.Math.Between(-h/3, h/3)
                );
            }

            // Spawn enemies near buildings
            for (let j = 0; j < Phaser.Math.Between(2, 4); j++) {
                this.spawnEnemy(
                    x + Phaser.Math.Between(-100, 100),
                    y + Phaser.Math.Between(-100, 100)
                );
            }
        }

        // Spawn additional enemies
        for (let i = 0; i < 15; i++) {
            this.spawnEnemy(
                Phaser.Math.Between(100, ZONE_WIDTH - 100),
                Phaser.Math.Between(100, ZONE_HEIGHT - 100)
            );
        }

        // Spawn outdoor containers
        for (let i = 0; i < 10; i++) {
            this.spawnContainer(
                Phaser.Math.Between(100, ZONE_WIDTH - 100),
                Phaser.Math.Between(100, ZONE_HEIGHT - 100)
            );
        }

        // Create extraction points
        const extractPoints = [
            { x: 50, y: ZONE_HEIGHT / 2 },
            { x: ZONE_WIDTH - 50, y: ZONE_HEIGHT / 2 },
            { x: ZONE_WIDTH / 2, y: 50 },
            { x: ZONE_WIDTH / 2, y: ZONE_HEIGHT - 50 }
        ];

        // Choose 2 random extraction points
        Phaser.Utils.Array.Shuffle(extractPoints);
        for (let i = 0; i < 2; i++) {
            const ep = extractPoints[i];
            const zone = this.add.circle(ep.x, ep.y, 40, 0x22c55e, 0.3);
            zone.setStrokeStyle(3, 0x22c55e);
            this.extractionPoints.push({ x: ep.x, y: ep.y, zone });

            this.add.text(ep.x, ep.y - 50, 'EXTRACT', {
                fontSize: '12px',
                fill: '#22c55e'
            }).setOrigin(0.5);
        }

        // Add radiation zones
        this.radiationZones = [];
        for (let i = 0; i < 4; i++) {
            const rx = Phaser.Math.Between(200, ZONE_WIDTH - 200);
            const ry = Phaser.Math.Between(200, ZONE_HEIGHT - 200);
            const radius = Phaser.Math.Between(60, 120);

            const radZone = this.add.circle(rx, ry, radius, 0x00ff00, 0.15);
            radZone.setStrokeStyle(2, 0x00ff00, 0.5);

            this.radiationZones.push({ x: rx, y: ry, radius: radius });

            // Warning text
            this.add.text(rx, ry, 'RADIATION', {
                fontSize: '10px',
                fill: '#00ff00'
            }).setOrigin(0.5).setAlpha(0.7);
        }
    }

    spawnContainer(x, y) {
        const types = Object.keys(CONTAINER_TYPES);
        const type = types[Phaser.Math.Between(0, types.length - 1)];
        const config = CONTAINER_TYPES[type];

        const container = this.add.rectangle(x, y, 24, 24, config.color);
        container.setStrokeStyle(1, 0x000000);
        container.containerType = type;
        container.looted = false;

        this.containers.push(container);
    }

    spawnEnemy(x, y) {
        const types = Object.keys(ENEMY_TYPES);
        const weights = [30, 25, 10, 15, 10, 5, 5]; // spawn weights
        let roll = Phaser.Math.Between(1, 100);
        let typeIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            roll -= weights[i];
            if (roll <= 0) {
                typeIndex = i;
                break;
            }
        }
        const type = types[typeIndex];
        const config = ENEMY_TYPES[type];

        const enemy = this.add.circle(x, y, 10, config.color);
        enemy.setStrokeStyle(1, 0x000000);
        enemy.enemyType = type;
        enemy.hp = config.hp;
        enemy.maxHp = config.hp;
        enemy.damage = config.damage;
        enemy.speed = config.speed;
        enemy.range = config.range;
        enemy.fireRate = config.fireRate;
        enemy.lastFire = 0;
        enemy.state = 'patrol';
        enemy.alertRange = 250;
        enemy.patrolTarget = { x: x + Phaser.Math.Between(-100, 100), y: y + Phaser.Math.Between(-100, 100) };
        enemy.melee = config.melee || false;
        enemy.charges = config.charges || false;
        enemy.isCharging = false;

        this.enemies.push(enemy);
    }

    createUI() {
        // UI Container
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        // Top bar
        const topBar = this.add.rectangle(400, 20, 780, 35, 0x000000, 0.8);
        this.uiContainer.add(topBar);

        // HP bar
        this.hpBarBg = this.add.rectangle(100, 20, 150, 20, 0x333333);
        this.hpBar = this.add.rectangle(100, 20, 150, 20, 0x22c55e);
        this.hpText = this.add.text(100, 20, '100/100', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        this.uiContainer.add([this.hpBarBg, this.hpBar, this.hpText]);

        // Stamina bar
        this.staminaBarBg = this.add.rectangle(100, 38, 150, 8, 0x333333);
        this.staminaBar = this.add.rectangle(100, 38, 150, 8, 0x3b82f6);
        this.uiContainer.add([this.staminaBarBg, this.staminaBar]);

        // Weapon info
        this.weaponText = this.add.text(300, 15, '', { fontSize: '14px', fill: '#fff' });
        this.uiContainer.add(this.weaponText);

        // Loot value
        this.lootText = this.add.text(500, 15, 'Loot: 0', { fontSize: '14px', fill: '#fbbf24' });
        this.uiContainer.add(this.lootText);

        // Status effects
        this.statusText = this.add.text(650, 15, '', { fontSize: '12px', fill: '#ef4444' });
        this.uiContainer.add(this.statusText);

        // Bottom bar - extraction info
        const bottomBar = this.add.rectangle(400, 580, 780, 30, 0x000000, 0.8);
        this.uiContainer.add(bottomBar);

        this.extractText = this.add.text(400, 580, 'Find extraction point!', {
            fontSize: '14px',
            fill: '#22c55e'
        }).setOrigin(0.5);
        this.uiContainer.add(this.extractText);

        // Interaction prompt
        this.interactPrompt = this.add.text(400, 450, '', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setVisible(false);
        this.uiContainer.add(this.interactPrompt);
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'raid') return;

        const dt = delta / 1000;

        // Update dodge
        if (this.isDodging) {
            this.dodgeTimer -= dt;
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
            }
        }

        // Update dodge cooldown
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= dt;
        }

        // Handle input
        this.handleInput(dt, time);

        // Update bleeding
        if (this.isBleeding) {
            this.bleedTimer -= dt;
            this.playerHP -= 2 * dt;
            if (this.bleedTimer <= 0) {
                this.isBleeding = false;
            }
        }

        // Check death
        if (this.playerHP <= 0) {
            this.handleDeath();
            return;
        }

        // Stamina regen
        if (!this.cursors.shift.isDown) {
            this.playerStamina = Math.min(this.playerMaxStamina, this.playerStamina + 8 * dt);
        }

        // Update radiation
        this.updateRadiation(dt);

        // Update grenades
        this.updateGrenades(dt);

        // Update flashlight
        this.updateFlashlight();

        // Update damage indicators
        this.updateDamageIndicators(dt);

        // Update enemies
        this.updateEnemies(dt, time);

        // Update bullets
        this.updateBullets(dt);

        // Check extraction
        this.checkExtraction();

        // Check interactions
        this.checkInteractions();

        // Update UI
        this.updateUI();
    }

    handleInput(dt, time) {
        let dx = 0, dy = 0;
        let speed = 150;

        // Sprint
        if (this.cursors.shift.isDown && this.playerStamina > 0) {
            speed *= 1.6;
            this.playerStamina -= 15 * dt;
        }

        // Dodge
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.dodgeCooldown <= 0) {
            this.isDodging = true;
            this.dodgeTimer = 0.3;
            this.dodgeCooldown = 1.5;
            speed *= 3;
        }

        // Movement
        if (this.cursors.w.isDown) dy = -1;
        if (this.cursors.s.isDown) dy = 1;
        if (this.cursors.a.isDown) dx = -1;
        if (this.cursors.d.isDown) dx = 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Apply movement
        this.player.x = Phaser.Math.Clamp(this.player.x + dx * speed * dt, 20, ZONE_WIDTH - 20);
        this.player.y = Phaser.Math.Clamp(this.player.y + dy * speed * dt, 20, ZONE_HEIGHT - 20);

        // Aim at mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Shooting
        if (pointer.isDown && !this.isReloading && this.currentWeapon.ammo > 0) {
            if (time - this.lastFireTime > this.currentWeapon.fireRate) {
                this.fire(angle, time);
            }
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.cursors.r) && !this.isReloading) {
            this.reload();
        }

        // Interact
        if (Phaser.Input.Keyboard.JustDown(this.cursors.e)) {
            this.interact();
        }

        // Heal
        if (Phaser.Input.Keyboard.JustDown(this.cursors.one)) {
            this.useHeal();
        }

        // ADS (Aim Down Sights) with right mouse button
        this.isADS = this.input.activePointer.rightButtonDown();

        // Grenade throw
        if (Phaser.Input.Keyboard.JustDown(this.cursors.g) && this.grenadeCount > 0) {
            this.throwGrenade();
        }

        // Flashlight toggle
        if (Phaser.Input.Keyboard.JustDown(this.cursors.f)) {
            this.flashlightOn = !this.flashlightOn;
        }
    }

    fire(angle, time) {
        this.lastFireTime = time;

        if (this.currentWeapon.pellets) {
            // Shotgun - multiple pellets
            for (let i = 0; i < this.currentWeapon.pellets; i++) {
                this.createBullet(angle);
            }
            this.currentWeapon.ammo--;
        } else {
            this.createBullet(angle);
            this.currentWeapon.ammo--;
        }
    }

    createBullet(angle) {
        // ADS reduces spread by 60%
        const spreadMod = this.isADS ? 0.4 : 1.0;
        // Moving increases spread
        const isMoving = this.cursors.w.isDown || this.cursors.a.isDown || this.cursors.s.isDown || this.cursors.d.isDown;
        const moveMod = isMoving ? 1.3 : 1.0;
        // Sprinting doubles spread
        const sprintMod = this.cursors.shift.isDown && this.playerStamina > 0 ? 2.0 : 1.0;

        const spread = (Math.random() - 0.5) * this.currentWeapon.spread * (Math.PI / 180) * spreadMod * moveMod * sprintMod;
        const finalAngle = angle + spread;

        this.bullets.push({
            x: this.player.x + Math.cos(finalAngle) * 20,
            y: this.player.y + Math.sin(finalAngle) * 20,
            vx: Math.cos(finalAngle) * 800,
            vy: Math.sin(finalAngle) * 800,
            damage: this.currentWeapon.damage,
            range: this.currentWeapon.range,
            traveled: 0,
            isPlayer: true
        });
    }

    reload() {
        this.isReloading = true;
        this.time.delayedCall(1500, () => {
            this.currentWeapon.ammo = this.currentWeapon.magSize;
            this.isReloading = false;
        });
    }

    useHeal() {
        // Simple heal
        if (this.playerHP < this.playerMaxHP) {
            this.playerHP = Math.min(this.playerMaxHP, this.playerHP + 25);
            this.isBleeding = false;
        }
    }

    throwGrenade() {
        if (this.grenadeCount <= 0) return;

        this.grenadeCount--;
        stats.grenadesTossed++;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

        const grenade = {
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * GRENADE_CONFIG.throwSpeed,
            vy: Math.sin(angle) * GRENADE_CONFIG.throwSpeed,
            fuseTimer: GRENADE_CONFIG.fuseTime / 1000
        };

        this.grenades.push(grenade);
    }

    updateGrenades(dt) {
        this.grenadeGraphics.clear();

        for (let i = this.grenades.length - 1; i >= 0; i--) {
            const grenade = this.grenades[i];

            // Move grenade with friction
            grenade.x += grenade.vx * dt;
            grenade.y += grenade.vy * dt;
            grenade.vx *= 0.95;
            grenade.vy *= 0.95;

            // Update fuse
            grenade.fuseTimer -= dt;

            // Draw grenade
            const flashRate = grenade.fuseTimer < 0.5 ? 0.1 : 0.3;
            const flash = Math.sin(grenade.fuseTimer / flashRate * Math.PI * 2) > 0;
            this.grenadeGraphics.fillStyle(flash ? 0xff0000 : 0x444444);
            this.grenadeGraphics.fillCircle(grenade.x, grenade.y, 6);

            // Explode
            if (grenade.fuseTimer <= 0) {
                this.explodeGrenade(grenade);
                this.grenades.splice(i, 1);
            }
        }
    }

    explodeGrenade(grenade) {
        // Screen shake
        this.cameras.main.shake(300, 0.03);

        // Visual explosion
        const explosion = this.add.circle(grenade.x, grenade.y, GRENADE_CONFIG.radius, 0xff6600, 0.6);
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // Damage enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dist = Phaser.Math.Distance.Between(grenade.x, grenade.y, enemy.x, enemy.y);
            if (dist < GRENADE_CONFIG.radius) {
                // Damage falloff from center
                const damageMultiplier = 1 - (dist / GRENADE_CONFIG.radius) * 0.5;
                enemy.hp -= GRENADE_CONFIG.damage * damageMultiplier;
                enemy.state = 'combat';

                if (enemy.hp <= 0) {
                    stats.enemiesKilled++;
                    this.raidRubles += Phaser.Math.Between(50, 200);
                    enemy.destroy();
                    this.enemies.splice(i, 1);
                }
            }
        }

        // Self damage if player is too close
        const playerDist = Phaser.Math.Distance.Between(grenade.x, grenade.y, this.player.x, this.player.y);
        if (playerDist < GRENADE_CONFIG.radius && !this.isDodging) {
            const damageMultiplier = 1 - (playerDist / GRENADE_CONFIG.radius) * 0.5;
            this.playerHP -= GRENADE_CONFIG.damage * damageMultiplier * 0.5; // Self damage reduced
            this.addDamageIndicator(Phaser.Math.Angle.Between(this.player.x, this.player.y, grenade.x, grenade.y));
        }
    }

    updateRadiation(dt) {
        // Check if player is in radiation zone
        let inRadiation = false;
        for (const zone of this.radiationZones || []) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
            if (dist < zone.radius) {
                inRadiation = true;
                break;
            }
        }

        if (inRadiation) {
            // Accumulate radiation
            this.radiation = Math.min(100, this.radiation + 5 * dt);
            this.radiationDamageTimer += dt;

            // Radiation reduces effective max HP
            const radMaxHPReduction = this.radiation * 0.5; // Up to 50 HP reduction at max radiation
            const effectiveMaxHP = this.playerMaxHP - radMaxHPReduction;

            // If HP is above effective max, reduce it
            if (this.playerHP > effectiveMaxHP) {
                this.playerHP = effectiveMaxHP;
            }
        }
    }

    updateFlashlight() {
        this.flashlightGraphics.clear();

        if (this.flashlightOn) {
            // Draw flashlight cone
            const pointer = this.input.activePointer;
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

            const coneLength = 200;
            const coneWidth = Math.PI / 6; // 30 degree cone

            this.flashlightGraphics.fillStyle(0xffffaa, 0.15);
            this.flashlightGraphics.beginPath();
            this.flashlightGraphics.moveTo(this.player.x, this.player.y);

            for (let a = angle - coneWidth; a <= angle + coneWidth; a += 0.1) {
                const x = this.player.x + Math.cos(a) * coneLength;
                const y = this.player.y + Math.sin(a) * coneLength;
                this.flashlightGraphics.lineTo(x, y);
            }

            this.flashlightGraphics.closePath();
            this.flashlightGraphics.fillPath();
        }
    }

    addDamageIndicator(angle) {
        this.damageIndicators.push({
            angle: angle,
            timer: 1.0
        });
    }

    updateDamageIndicators(dt) {
        this.damageIndicatorGraphics.clear();

        for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
            const indicator = this.damageIndicators[i];
            indicator.timer -= dt;

            if (indicator.timer <= 0) {
                this.damageIndicators.splice(i, 1);
                continue;
            }

            // Draw red arc in direction of damage
            const alpha = indicator.timer;
            const centerX = SCREEN_WIDTH / 2;
            const centerY = SCREEN_HEIGHT / 2;
            const radius = 100;

            this.damageIndicatorGraphics.lineStyle(8, 0xff0000, alpha);
            this.damageIndicatorGraphics.beginPath();
            this.damageIndicatorGraphics.arc(
                centerX, centerY, radius,
                indicator.angle - 0.3,
                indicator.angle + 0.3,
                false
            );
            this.damageIndicatorGraphics.strokePath();
        }
    }

    updateBullets(dt) {
        this.bulletGraphics.clear();

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dt;

            // Draw bullet
            this.bulletGraphics.fillStyle(bullet.isPlayer ? 0xffff00 : 0xff4444);
            this.bulletGraphics.fillCircle(bullet.x, bullet.y, 3);

            // Check out of bounds or range
            if (bullet.x < 0 || bullet.x > ZONE_WIDTH || bullet.y < 0 || bullet.y > ZONE_HEIGHT ||
                bullet.traveled > bullet.range) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Check hits
            if (bullet.isPlayer) {
                // Check enemy hits
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                    if (dist < 15) {
                        enemy.hp -= bullet.damage;
                        enemy.state = 'combat';
                        this.bullets.splice(i, 1);

                        if (enemy.hp <= 0) {
                            // Drop loot
                            const lootValue = Phaser.Math.Between(50, 200);
                            this.raidRubles += lootValue;
                            stats.enemiesKilled++;

                            enemy.destroy();
                            this.enemies.splice(j, 1);
                        }
                        break;
                    }
                }
            } else {
                // Enemy bullet hitting player
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                if (dist < 15 && !this.isDodging) {
                    this.playerHP -= bullet.damage;

                    // Screen shake on damage
                    this.cameras.main.shake(150, 0.01);

                    // Damage direction indicator
                    const damageAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, bullet.x, bullet.y);
                    this.addDamageIndicator(damageAngle);

                    this.bullets.splice(i, 1);

                    // Chance to bleed
                    if (Math.random() < 0.3) {
                        this.isBleeding = true;
                        this.bleedTimer = 5;
                    }
                }
            }
        }
    }

    updateEnemies(dt, time) {
        for (const enemy of this.enemies) {
            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // State machine
            if (distToPlayer < enemy.alertRange) {
                enemy.state = 'combat';
            }

            switch (enemy.state) {
                case 'patrol':
                    // Move toward patrol target
                    const pDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                    if (pDist < 10) {
                        enemy.patrolTarget = {
                            x: enemy.x + Phaser.Math.Between(-100, 100),
                            y: enemy.y + Phaser.Math.Between(-100, 100)
                        };
                    }
                    const pAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);
                    enemy.x += Math.cos(pAngle) * enemy.speed * 0.3 * dt;
                    enemy.y += Math.sin(pAngle) * enemy.speed * 0.3 * dt;
                    break;

                case 'combat':
                    if (enemy.melee) {
                        // Melee enemies chase and attack
                        if (distToPlayer > enemy.range) {
                            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                            const speed = enemy.charges && distToPlayer < 150 ? enemy.speed * 2 : enemy.speed;
                            enemy.x += Math.cos(angle) * speed * dt;
                            enemy.y += Math.sin(angle) * speed * dt;
                        } else {
                            // Attack
                            if (time - enemy.lastFire > enemy.fireRate) {
                                if (!this.isDodging) {
                                    this.playerHP -= enemy.damage;

                                    // Screen shake on melee damage
                                    this.cameras.main.shake(200, 0.015);

                                    // Damage direction indicator
                                    const damageAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                                    this.addDamageIndicator(damageAngle);

                                    if (Math.random() < 0.2) {
                                        this.isBleeding = true;
                                        this.bleedTimer = 5;
                                    }
                                }
                                enemy.lastFire = time;
                            }
                        }
                    } else {
                        // Ranged enemies
                        if (distToPlayer > enemy.range * 0.8) {
                            // Move closer
                            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                            enemy.x += Math.cos(angle) * enemy.speed * dt;
                            enemy.y += Math.sin(angle) * enemy.speed * dt;
                        } else if (distToPlayer < enemy.range * 0.4) {
                            // Too close, back up
                            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                            enemy.x -= Math.cos(angle) * enemy.speed * 0.5 * dt;
                            enemy.y -= Math.sin(angle) * enemy.speed * 0.5 * dt;
                        }

                        // Shoot
                        if (time - enemy.lastFire > enemy.fireRate && distToPlayer < enemy.range) {
                            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                            const spread = (Math.random() - 0.5) * 0.2;
                            this.bullets.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: Math.cos(angle + spread) * 400,
                                vy: Math.sin(angle + spread) * 400,
                                damage: enemy.damage,
                                range: enemy.range,
                                traveled: 0,
                                isPlayer: false
                            });
                            enemy.lastFire = time;
                        }
                    }
                    break;
            }

            // Keep in bounds
            enemy.x = Phaser.Math.Clamp(enemy.x, 20, ZONE_WIDTH - 20);
            enemy.y = Phaser.Math.Clamp(enemy.y, 20, ZONE_HEIGHT - 20);
        }
    }

    checkInteractions() {
        let nearContainer = null;
        let nearExtract = null;

        // Check containers
        for (const container of this.containers) {
            if (container.looted) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, container.x, container.y);
            if (dist < 40) {
                nearContainer = container;
                break;
            }
        }

        // Check extraction
        for (const ep of this.extractionPoints) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ep.x, ep.y);
            if (dist < 50) {
                nearExtract = ep;
                break;
            }
        }

        // Show prompt
        if (nearContainer) {
            const config = CONTAINER_TYPES[nearContainer.containerType];
            this.interactPrompt.setText(`[E] Loot ${config.name}`);
            this.interactPrompt.setVisible(true);
            this.nearbyInteractable = { type: 'container', obj: nearContainer };
        } else if (nearExtract) {
            this.interactPrompt.setText('[E] EXTRACT');
            this.interactPrompt.setVisible(true);
            this.nearbyInteractable = { type: 'extract', obj: nearExtract };
        } else {
            this.interactPrompt.setVisible(false);
            this.nearbyInteractable = null;
        }
    }

    interact() {
        if (!this.nearbyInteractable) return;

        if (this.nearbyInteractable.type === 'container') {
            const container = this.nearbyInteractable.obj;
            const config = CONTAINER_TYPES[container.containerType];
            const lootTable = LOOT_TABLES[config.lootTier];

            // Generate loot
            for (const loot of lootTable) {
                if (Math.random() < loot.chance) {
                    const value = Array.isArray(loot.value)
                        ? Phaser.Math.Between(loot.value[0], loot.value[1])
                        : loot.value;

                    if (loot.name === 'Rubles' || loot.name === 'Valuable Item') {
                        this.raidRubles += value;
                    } else {
                        this.raidLoot.push({ name: loot.name, quantity: value });
                    }
                }
            }

            container.looted = true;
            container.setAlpha(0.3);
            stats.containersLooted++;
        } else if (this.nearbyInteractable.type === 'extract') {
            this.handleExtraction();
        }
    }

    checkExtraction() {
        // Update extraction distance
        let minDist = Infinity;
        for (const ep of this.extractionPoints) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ep.x, ep.y);
            minDist = Math.min(minDist, dist);
        }
        this.extractText.setText(`Nearest Extract: ${Math.floor(minDist)}m`);
    }

    handleExtraction() {
        gameState = 'extracted';
        stats.extractions++;
        stats.rubles += this.raidRubles;
        stats.totalRubles += this.raidRubles;

        // Show extraction screen
        this.cameras.main.fade(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
            this.scene.start('ExtractScene', {
                rubles: this.raidRubles,
                loot: this.raidLoot,
                kills: stats.enemiesKilled
            });
        });
    }

    handleDeath() {
        gameState = 'dead';
        stats.deaths++;
        // Lose raid loot
        this.raidRubles = 0;
        this.raidLoot = [];

        this.cameras.main.shake(500, 0.02);
        this.cameras.main.fade(1000, 255, 0, 0);
        this.time.delayedCall(1000, () => {
            this.scene.start('DeathScene');
        });
    }

    updateUI() {
        // HP bar
        const hpPercent = this.playerHP / this.playerMaxHP;
        this.hpBar.scaleX = hpPercent;
        this.hpBar.x = 25 + (150 * hpPercent) / 2;
        this.hpBar.fillColor = hpPercent > 0.5 ? 0x22c55e : hpPercent > 0.25 ? 0xfbbf24 : 0xef4444;
        this.hpText.setText(`${Math.ceil(this.playerHP)}/${this.playerMaxHP}`);

        // Stamina bar
        const staminaPercent = this.playerStamina / this.playerMaxStamina;
        this.staminaBar.scaleX = staminaPercent;
        this.staminaBar.x = 25 + (150 * staminaPercent) / 2;

        // Loot
        this.lootText.setText(`Loot: ${this.raidRubles} R`);

        // Status
        let statusStr = '';
        if (this.isBleeding) statusStr += 'BLEEDING ';
        if (this.isDodging) statusStr += 'DODGING ';
        if (this.radiation > 0) statusStr += `RAD:${Math.floor(this.radiation)} `;
        if (this.isADS) statusStr += 'ADS ';
        if (this.flashlightOn) statusStr += 'LIGHT ';
        this.statusText.setText(statusStr);

        // Update weapon text to include grenades
        const reloadText = this.isReloading ? ' [RELOADING]' : '';
        const grenadeText = `| G:${this.grenadeCount}`;
        this.weaponText.setText(`${this.currentWeapon.name} ${this.currentWeapon.ammo}/${this.currentWeapon.magSize}${reloadText} ${grenadeText}`);
    }

    setupHarness() {
        const scene = this;

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,

            execute: async (action, durationMs) => {
                return new Promise((resolve) => {
                    gamePaused = false;

                    // Simulate keys
                    if (action.keys) {
                        action.keys.forEach(key => {
                            const keyCode = key.toLowerCase();
                            if (scene.cursors[keyCode]) {
                                scene.cursors[keyCode].isDown = true;
                            }
                        });
                    }

                    // Mouse position
                    if (action.mouseX !== undefined) {
                        scene.input.activePointer.x = action.mouseX;
                        scene.input.activePointer.y = action.mouseY;
                    }

                    // Mouse click
                    if (action.mouseDown) {
                        scene.input.activePointer.isDown = true;
                    }

                    setTimeout(() => {
                        if (action.keys) {
                            action.keys.forEach(key => {
                                const keyCode = key.toLowerCase();
                                if (scene.cursors[keyCode]) {
                                    scene.cursors[keyCode].isDown = false;
                                }
                            });
                        }
                        if (action.mouseDown) {
                            scene.input.activePointer.isDown = false;
                        }
                        gamePaused = true;
                        resolve();
                    }, durationMs);
                });
            },

            getState: () => ({
                gameState: gameState,
                player: {
                    x: scene.player?.x || 0,
                    y: scene.player?.y || 0,
                    hp: scene.playerHP,
                    maxHp: scene.playerMaxHP,
                    stamina: scene.playerStamina,
                    isBleeding: scene.isBleeding,
                    isDodging: scene.isDodging,
                    radiation: scene.radiation || 0,
                    isADS: scene.isADS || false,
                    flashlightOn: scene.flashlightOn || false,
                    grenadeCount: scene.grenadeCount || 0
                },
                weapon: {
                    name: scene.currentWeapon?.name || '',
                    ammo: scene.currentWeapon?.ammo || 0,
                    isReloading: scene.isReloading
                },
                enemies: (scene.enemies || []).map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.enemyType,
                    hp: e.hp,
                    state: e.state
                })),
                containers: (scene.containers || []).filter(c => !c.looted).length,
                extractionPoints: (scene.extractionPoints || []).map(ep => ({ x: ep.x, y: ep.y })),
                raidLoot: scene.raidRubles || 0,
                stats: stats,
                nearbyInteractable: scene.nearbyInteractable?.type || null
            }),

            getPhase: () => gameState,

            debug: {
                setHealth: (hp) => { scene.playerHP = hp; },
                forceStart: () => {
                    gamePaused = false;
                },
                clearEnemies: () => {
                    scene.enemies?.forEach(e => e.destroy());
                    scene.enemies = [];
                },
                teleportPlayer: (x, y) => {
                    if (scene.player) {
                        scene.player.x = x;
                        scene.player.y = y;
                    }
                },
                addAmmo: () => {
                    if (scene.currentWeapon) {
                        scene.currentWeapon.ammo = scene.currentWeapon.magSize;
                    }
                },
                extract: () => {
                    scene.handleExtraction();
                }
            }
        };
    }
}

class ExtractScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExtractScene' });
    }

    init(data) {
        this.extractData = data;
    }

    create() {
        gameState = 'extracted';

        this.add.rectangle(400, 300, 800, 600, 0x0a0a0a);

        this.add.text(400, 100, 'EXTRACTION SUCCESSFUL', {
            fontSize: '36px',
            fill: '#22c55e'
        }).setOrigin(0.5);

        const data = this.extractData || { rubles: 0, loot: [], kills: 0 };

        this.add.text(400, 200, `Rubles Gained: ${data.rubles}`, {
            fontSize: '24px',
            fill: '#fbbf24'
        }).setOrigin(0.5);

        this.add.text(400, 250, `Enemies Killed: ${stats.enemiesKilled}`, {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 290, `Containers Looted: ${stats.containersLooted}`, {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(400, 350, `Total Rubles: ${stats.rubles}`, {
            fontSize: '20px',
            fill: '#fbbf24'
        }).setOrigin(0.5);

        // Continue button
        const continueBtn = this.add.rectangle(400, 450, 200, 50, 0x22c55e)
            .setInteractive({ useHandCursor: true });
        this.add.text(400, 450, 'CONTINUE', {
            fontSize: '20px',
            fill: '#000'
        }).setOrigin(0.5);

        continueBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Setup harness
        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,
            execute: async (action, durationMs) => {
                return new Promise((resolve) => {
                    setTimeout(resolve, durationMs);
                });
            },
            getState: () => ({ gameState: 'extracted', stats: stats }),
            getPhase: () => 'extracted',
            debug: {
                forceStart: () => { this.scene.start('RaidScene'); }
            }
        };
    }
}

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    create() {
        gameState = 'dead';

        this.add.rectangle(400, 300, 800, 600, 0x1a0a0a);

        this.add.text(400, 150, 'YOU DIED', {
            fontSize: '48px',
            fill: '#ef4444'
        }).setOrigin(0.5);

        this.add.text(400, 250, 'All raid loot lost', {
            fontSize: '20px',
            fill: '#666'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Remaining Rubles: ${stats.rubles}`, {
            fontSize: '18px',
            fill: '#fbbf24'
        }).setOrigin(0.5);

        this.add.text(400, 360, `Total Deaths: ${stats.deaths}`, {
            fontSize: '16px',
            fill: '#888'
        }).setOrigin(0.5);

        // Retry button
        const retryBtn = this.add.rectangle(400, 450, 200, 50, 0xef4444)
            .setInteractive({ useHandCursor: true });
        this.add.text(400, 450, 'TRY AGAIN', {
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5);

        retryBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Setup harness
        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,
            execute: async (action, durationMs) => {
                return new Promise((resolve) => {
                    setTimeout(resolve, durationMs);
                });
            },
            getState: () => ({ gameState: 'dead', stats: stats }),
            getPhase: () => 'gameover',
            debug: {
                forceStart: () => { this.scene.start('RaidScene'); }
            }
        };
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    scene: [BootScene, RaidScene, ExtractScene, DeathScene] // AUTO-START: Skip MenuScene
};

const game = new Phaser.Game(config);
