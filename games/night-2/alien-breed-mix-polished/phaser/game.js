// STATION BREACH - POLISHED VERSION
// Twin-Stick Shooter with maximum juice

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#080810',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game objects
let player, enemies, bullets, enemyBullets, items, walls, doors, particles;
let keycards = { green: false, blue: false, yellow: false, red: false };
let credits = 0;
let currentWeapon = 0;
let gameState = 'menu';
let currentDeck = 1;
let selfDestructTimer = 0;
let selfDestructActive = false;

// Enhanced weapon definitions
const WEAPONS = [
    { name: 'PISTOL', damage: 15, fireRate: 200, magSize: 12, reloadTime: 1000, ammoType: '9mm', spread: 2, color: 0xffff00, infinite: true, shake: 3 },
    { name: 'SHOTGUN', damage: 10, pellets: 8, fireRate: 600, magSize: 8, reloadTime: 2000, ammoType: 'shells', spread: 20, color: 0xff8800, shake: 12 },
    { name: 'SMG', damage: 8, fireRate: 60, magSize: 45, reloadTime: 1500, ammoType: '9mm', spread: 6, color: 0x44ff44, shake: 2 },
    { name: 'PLASMA', damage: 35, fireRate: 300, magSize: 20, reloadTime: 2500, ammoType: 'plasma', spread: 0, color: 0x44ffff, shake: 8 }
];

let ammo = { '9mm': 300, 'shells': 64, 'plasma': 80 };
let magazine = [12, 8, 45, 20];

// Enhanced enemy types
const ENEMY_TYPES = {
    drone: { hp: 25, damage: 8, speed: 140, color: 0x44ff44, glowColor: 0x22aa22, size: 10, value: 10 },
    spitter: { hp: 35, damage: 12, speed: 70, color: 0xffff44, glowColor: 0xaaaa22, size: 14, ranged: true, value: 20 },
    lurker: { hp: 45, damage: 18, speed: 220, color: 0xff44ff, glowColor: 0xaa22aa, size: 12, value: 25 },
    brute: { hp: 120, damage: 25, speed: 50, color: 0xff4444, glowColor: 0xaa2222, size: 22, value: 50 }
};

// UI elements
let healthBar, shieldBar, healthText, ammoText, weaponText, creditText, keycardIcons, timerText;
let lastFired = 0, reloading = false, reloadTimer = 0;
let messageText, messageTimer = 0;
let muzzleFlash, bloodEmitter, sparkEmitter, glowLayer;

// Player stats
let playerStats = {
    maxHp: 100,
    hp: 100,
    maxShield: 25,
    shield: 0,
    speed: 200,
    sprintSpeed: 300,
    invincible: 0
};

function preload() {
    createTextures(this);
}

function createTextures(scene) {
    // Enhanced player texture with glow effect
    let gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    // Glow
    gfx.fillStyle(0x4488ff, 0.3);
    gfx.fillCircle(16, 16, 16);
    // Body
    gfx.fillStyle(0x4488ff);
    gfx.fillRoundedRect(4, 4, 24, 24, 4);
    // Visor
    gfx.fillStyle(0x00ffff);
    gfx.fillRect(20, 10, 10, 12);
    // Highlights
    gfx.fillStyle(0x88ccff);
    gfx.fillRect(6, 6, 16, 4);
    gfx.generateTexture('player', 32, 32);
    gfx.destroy();

    // Enhanced bullet textures
    WEAPONS.forEach((w, i) => {
        gfx = scene.make.graphics({ x: 0, y: 0, add: false });
        gfx.fillStyle(w.color, 0.5);
        gfx.fillCircle(8, 4, 8);
        gfx.fillStyle(w.color);
        gfx.fillRoundedRect(2, 1, 12, 6, 2);
        gfx.fillStyle(0xffffff);
        gfx.fillRect(10, 2, 4, 4);
        gfx.generateTexture('bullet_' + i, 16, 8);
        gfx.destroy();
    });

    // Plasma bullet
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x44ffff, 0.3);
    gfx.fillCircle(8, 8, 10);
    gfx.fillStyle(0x44ffff);
    gfx.fillCircle(8, 8, 6);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(8, 8, 3);
    gfx.generateTexture('plasma', 16, 16);
    gfx.destroy();

    // Enemy bullet with glow
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x00ff44, 0.4);
    gfx.fillCircle(8, 8, 10);
    gfx.fillStyle(0x00ff44);
    gfx.fillCircle(8, 8, 5);
    gfx.fillStyle(0xaaffaa);
    gfx.fillCircle(8, 8, 2);
    gfx.generateTexture('enemyBullet', 16, 16);
    gfx.destroy();

    // Wall texture with detail
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x3a3a4a);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x4a4a5a);
    gfx.fillRect(2, 2, 28, 28);
    gfx.fillStyle(0x2a2a3a);
    gfx.fillRect(0, 0, 32, 2);
    gfx.fillRect(0, 30, 32, 2);
    gfx.fillRect(0, 0, 2, 32);
    gfx.fillRect(30, 0, 2, 32);
    // Panel lines
    gfx.lineStyle(1, 0x5a5a6a);
    gfx.lineBetween(16, 4, 16, 28);
    gfx.lineBetween(4, 16, 28, 16);
    gfx.generateTexture('wall', 32, 32);
    gfx.destroy();

    // Enhanced door textures
    ['green', 'blue', 'yellow', 'red', 'normal'].forEach((color) => {
        gfx = scene.make.graphics({ x: 0, y: 0, add: false });
        const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000, normal: 0x888888 };
        const c = colors[color];
        // Glow
        gfx.fillStyle(c, 0.2);
        gfx.fillRect(-4, -4, 40, 56);
        // Body
        gfx.fillStyle(0x222233);
        gfx.fillRect(0, 0, 32, 48);
        // Trim
        gfx.fillStyle(c);
        gfx.fillRect(0, 0, 32, 6);
        gfx.fillRect(0, 42, 32, 6);
        gfx.fillRect(0, 0, 4, 48);
        gfx.fillRect(28, 0, 4, 48);
        // Center indicator
        gfx.fillStyle(c, 0.5);
        gfx.fillCircle(16, 24, 8);
        gfx.fillStyle(c);
        gfx.fillCircle(16, 24, 4);
        gfx.generateTexture('door_' + color, 40, 56);
        gfx.destroy();
    });

    // Health pickup with pulse
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xff4444, 0.3);
    gfx.fillCircle(10, 10, 12);
    gfx.fillStyle(0xffffff);
    gfx.fillRect(6, 3, 8, 14);
    gfx.fillRect(3, 6, 14, 8);
    gfx.fillStyle(0xff4444);
    gfx.fillRect(7, 4, 6, 12);
    gfx.fillRect(4, 7, 12, 6);
    gfx.generateTexture('health', 20, 20);
    gfx.destroy();

    // Ammo crate
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffaa00, 0.3);
    gfx.fillCircle(10, 10, 12);
    gfx.fillStyle(0x664400);
    gfx.fillRect(2, 2, 16, 16);
    gfx.fillStyle(0xffaa00);
    gfx.fillRect(4, 4, 12, 12);
    gfx.fillStyle(0xffffff);
    gfx.fillRect(8, 6, 4, 8);
    gfx.generateTexture('ammo', 20, 20);
    gfx.destroy();

    // Credit with shine
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffdd00, 0.4);
    gfx.fillCircle(10, 10, 12);
    gfx.fillStyle(0xffdd00);
    gfx.fillCircle(10, 10, 8);
    gfx.fillStyle(0xffffaa);
    gfx.fillCircle(10, 10, 5);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(7, 7, 2);
    gfx.generateTexture('credit', 20, 20);
    gfx.destroy();

    // Keycard textures
    ['green', 'blue', 'yellow', 'red'].forEach(color => {
        gfx = scene.make.graphics({ x: 0, y: 0, add: false });
        const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000 };
        gfx.fillStyle(colors[color], 0.5);
        gfx.fillRect(-2, -2, 28, 18);
        gfx.fillStyle(colors[color]);
        gfx.fillRoundedRect(0, 0, 24, 14, 2);
        gfx.fillStyle(0x222222);
        gfx.fillRect(2, 2, 8, 10);
        gfx.fillStyle(0xffffff);
        gfx.fillRect(4, 4, 4, 6);
        gfx.generateTexture('keycard_' + color, 28, 18);
        gfx.destroy();
    });

    // Particle textures
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('particle', 8, 8);
    gfx.destroy();

    // Blood particle
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x00ff44);
    gfx.fillCircle(3, 3, 3);
    gfx.generateTexture('blood', 6, 6);
    gfx.destroy();

    // Muzzle flash
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffff88, 0.8);
    gfx.fillCircle(16, 16, 16);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(16, 16, 8);
    gfx.generateTexture('muzzleFlash', 32, 32);
    gfx.destroy();
}

function create() {
    // Create groups
    walls = this.physics.add.staticGroup();
    doors = this.physics.add.staticGroup();
    enemies = this.physics.add.group();
    bullets = this.physics.add.group();
    enemyBullets = this.physics.add.group();
    items = this.physics.add.group();

    // Create particle emitters
    particles = this.add.particles(0, 0, 'particle', {
        speed: { min: 50, max: 200 },
        scale: { start: 0.6, end: 0 },
        lifespan: 300,
        blendMode: 'ADD',
        emitting: false
    });

    bloodEmitter = this.add.particles(0, 0, 'blood', {
        speed: { min: 100, max: 300 },
        scale: { start: 1, end: 0.3 },
        lifespan: 500,
        gravityY: 200,
        emitting: false
    });

    sparkEmitter = this.add.particles(0, 0, 'particle', {
        speed: { min: 100, max: 400 },
        scale: { start: 0.4, end: 0 },
        lifespan: 200,
        tint: 0xffaa00,
        blendMode: 'ADD',
        emitting: false
    });

    // Create player
    player = this.physics.add.sprite(400, 500, 'player');
    player.setCollideWorldBounds(true);
    player.setDepth(10);

    // Muzzle flash sprite
    muzzleFlash = this.add.sprite(0, 0, 'muzzleFlash');
    muzzleFlash.setVisible(false);
    muzzleFlash.setDepth(11);
    muzzleFlash.setBlendMode(Phaser.BlendModes.ADD);

    // Input
    this.cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        reload: Phaser.Input.Keyboard.KeyCodes.R,
        interact: Phaser.Input.Keyboard.KeyCodes.E,
        sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        switchWeapon: Phaser.Input.Keyboard.KeyCodes.Q,
        start: Phaser.Input.Keyboard.KeyCodes.Z
    });

    this.input.on('pointerdown', () => {
        if (gameState === 'menu') startGame(this);
    });

    // Collisions
    this.physics.add.collider(player, walls);
    this.physics.add.collider(enemies, walls);
    this.physics.add.collider(bullets, walls, (bullet) => {
        sparkEmitter.emitParticleAt(bullet.x, bullet.y, 5);
        bullet.destroy();
    });
    this.physics.add.collider(enemyBullets, walls, (bullet) => {
        sparkEmitter.emitParticleAt(bullet.x, bullet.y, 3);
        bullet.destroy();
    });
    this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
    this.physics.add.overlap(enemyBullets, player, enemyBulletHitPlayer, null, this);
    this.physics.add.overlap(player, enemies, playerTouchEnemy, null, this);
    this.physics.add.overlap(player, items, collectItem, null, this);
    this.physics.add.overlap(player, doors, checkDoor, null, this);

    // Create enhanced UI
    createUI(this);

    // Expose for testing
    if (typeof window !== 'undefined') {
        window.getGameState = () => ({ screen: gameState, deck: currentDeck, credits, keycards });
        window.getPlayer = () => playerStats;
        window.getEnemies = () => enemies.getChildren().length;
    }
}

function createUI(scene) {
    // Background bars
    scene.add.rectangle(15, 20, 210, 22, 0x111122).setScrollFactor(0).setDepth(99).setOrigin(0, 0.5);
    scene.add.rectangle(15, 45, 160, 16, 0x111122).setScrollFactor(0).setDepth(99).setOrigin(0, 0.5);

    // Health bar with border
    scene.add.rectangle(15, 20, 204, 16, 0x331111).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
    healthBar = scene.add.rectangle(17, 20, 200, 12, 0xff4444).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

    // Shield bar
    scene.add.rectangle(15, 45, 154, 10, 0x112233).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
    shieldBar = scene.add.rectangle(17, 45, 0, 6, 0x4488ff).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

    // Health text
    healthText = scene.add.text(120, 20, '100/100', {
        fontSize: '12px',
        fill: '#fff',
        fontFamily: 'Share Tech Mono'
    }).setScrollFactor(0).setDepth(102).setOrigin(0.5);

    // Weapon display background
    scene.add.rectangle(10, 545, 160, 50, 0x111122, 0.8).setScrollFactor(0).setDepth(99).setOrigin(0, 0);

    weaponText = scene.add.text(20, 555, 'PISTOL', {
        fontSize: '18px',
        fill: '#ffaa00',
        fontFamily: 'Orbitron',
        fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(100);

    ammoText = scene.add.text(20, 578, '12/12 | 300', {
        fontSize: '12px',
        fill: '#aaa',
        fontFamily: 'Share Tech Mono'
    }).setScrollFactor(0).setDepth(100);

    // Credits with icon
    scene.add.rectangle(690, 575, 100, 30, 0x111122, 0.8).setScrollFactor(0).setDepth(99);
    creditText = scene.add.text(695, 568, '$ 0', {
        fontSize: '18px',
        fill: '#ffdd00',
        fontFamily: 'Orbitron'
    }).setScrollFactor(0).setDepth(100);

    // Keycard display
    keycardIcons = {};
    ['green', 'blue', 'yellow', 'red'].forEach((color, i) => {
        const x = 650 + i * 35;
        keycardIcons[color] = scene.add.rectangle(x, 25, 28, 16, 0x333344).setScrollFactor(0).setDepth(100);
    });

    // Timer
    timerText = scene.add.text(400, 25, '', {
        fontSize: '28px',
        fill: '#ff0000',
        fontFamily: 'Orbitron',
        fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5);

    // Message
    messageText = scene.add.text(400, 100, '', {
        fontSize: '20px',
        fill: '#fff',
        fontFamily: 'Orbitron',
        stroke: '#000',
        strokeThickness: 4
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);

    // Deck indicator
    scene.deckText = scene.add.text(400, 580, 'DECK 1', {
        fontSize: '14px',
        fill: '#666',
        fontFamily: 'Share Tech Mono'
    }).setScrollFactor(0).setDepth(100).setOrigin(0.5);

    // Menu
    scene.menuText = scene.add.text(400, 280, '', {
        fontSize: '20px',
        fill: '#fff',
        fontFamily: 'Orbitron',
        align: 'center',
        lineSpacing: 10
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);

    scene.titleText = scene.add.text(400, 150, 'STATION BREACH', {
        fontSize: '48px',
        fill: '#ff3322',
        fontFamily: 'Orbitron',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);

    scene.menuText.setText('Click to Start\n\n[WASD] Move\n[Mouse] Aim & Shoot\n[R] Reload  [Q] Switch Weapon');
}

function startGame(scene) {
    if (gameState !== 'menu') return;
    gameState = 'game';
    scene.menuText.setVisible(false);
    scene.titleText.setVisible(false);

    playerStats = { maxHp: 100, hp: 100, maxShield: 25, shield: 0, speed: 200, sprintSpeed: 300, invincible: 0 };
    credits = 0;
    currentDeck = 1;
    keycards = { green: false, blue: false, yellow: false, red: false };
    currentWeapon = 0;
    magazine = [12, 8, 45, 20];
    ammo = { '9mm': 300, 'shells': 64, 'plasma': 80 };
    selfDestructActive = false;

    generateDeck(scene, 1);
}

function generateDeck(scene, deck) {
    walls.clear(true, true);
    doors.clear(true, true);
    enemies.clear(true, true);
    items.clear(true, true);

    currentDeck = deck;
    scene.deckText.setText('DECK ' + deck);

    // Border walls
    for (let x = 0; x < 800; x += 32) {
        walls.create(x + 16, 16, 'wall');
        walls.create(x + 16, 584, 'wall');
    }
    for (let y = 32; y < 584; y += 32) {
        walls.create(16, y + 16, 'wall');
        walls.create(784, y + 16, 'wall');
    }

    createDeckLayout(scene, deck);
    spawnEnemies(scene, deck);
    spawnItems(scene, deck);

    player.setPosition(400, 500);
    showMessage('DECK ' + deck + ' - CLEAR THE STATION');
}

function createDeckLayout(scene, deck) {
    // More interesting layouts with cover
    if (deck === 1) {
        for (let x = 100; x < 300; x += 32) {
            walls.create(x, 200, 'wall');
            walls.create(x, 400, 'wall');
        }
        for (let x = 500; x < 700; x += 32) {
            walls.create(x, 200, 'wall');
            walls.create(x, 400, 'wall');
        }
        // Cover boxes
        walls.create(400, 300, 'wall');
        walls.create(432, 300, 'wall');

        let door = doors.create(400, 48, 'door_green');
        door.doorType = 'green';
        door.nextDeck = 2;
    } else if (deck === 2) {
        for (let x = 200; x < 400; x += 32) walls.create(x, 150, 'wall');
        for (let y = 150; y < 350; y += 32) walls.create(400, y, 'wall');
        for (let x = 400; x < 600; x += 32) walls.create(x, 350, 'wall');
        // Cover
        walls.create(200, 450, 'wall');
        walls.create(600, 200, 'wall');

        let door = doors.create(400, 48, 'door_blue');
        door.doorType = 'blue';
        door.nextDeck = 3;
    } else if (deck === 3) {
        for (let x = 150; x < 350; x += 32) walls.create(x, 250, 'wall');
        for (let x = 450; x < 650; x += 32) walls.create(x, 250, 'wall');
        walls.create(400, 150, 'wall');
        walls.create(400, 400, 'wall');

        let door = doors.create(400, 48, 'door_yellow');
        door.doorType = 'yellow';
        door.nextDeck = 4;
    } else if (deck === 4) {
        for (let x = 200; x < 350; x += 32) walls.create(x, 300, 'wall');
        for (let x = 450; x < 600; x += 32) walls.create(x, 300, 'wall');

        let escapePod = doors.create(400, 100, 'door_normal');
        escapePod.doorType = 'escape';
        escapePod.isEscape = true;

        if (!selfDestructActive) {
            selfDestructActive = true;
            selfDestructTimer = 300;
            showMessage('SELF-DESTRUCT ACTIVATED!');
        }
    }
}

function spawnEnemies(scene, deck) {
    const counts = {
        1: { drone: 10, spitter: 4 },
        2: { drone: 8, spitter: 5, lurker: 4, brute: 2 },
        3: { drone: 6, spitter: 6, lurker: 6, brute: 3 },
        4: { drone: 10, spitter: 6, lurker: 8, brute: 5 }
    };

    const spawn = counts[deck] || counts[1];

    Object.entries(spawn).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            let x, y, attempts = 0;
            do {
                x = Phaser.Math.Between(100, 700);
                y = Phaser.Math.Between(100, 500);
                attempts++;
            } while (attempts < 50 && Phaser.Math.Distance.Between(x, y, player.x, player.y) < 150);

            createEnemy(scene, x, y, type);
        }
    });
}

function createEnemy(scene, x, y, type) {
    const def = ENEMY_TYPES[type];

    // Create enemy texture dynamically
    let gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    // Glow
    gfx.fillStyle(def.glowColor, 0.4);
    gfx.fillCircle(def.size + 4, def.size + 4, def.size + 4);
    // Body
    gfx.fillStyle(def.color);
    gfx.fillCircle(def.size + 4, def.size + 4, def.size);
    // Eye
    gfx.fillStyle(0x000000);
    gfx.fillCircle(def.size + 6, def.size + 2, def.size / 4);
    gfx.fillStyle(0xff0000);
    gfx.fillCircle(def.size + 6, def.size + 2, def.size / 6);

    const texKey = 'enemy_' + type + '_' + Date.now() + '_' + Math.random();
    gfx.generateTexture(texKey, (def.size + 4) * 2, (def.size + 4) * 2);
    gfx.destroy();

    let enemy = enemies.create(x, y, texKey);
    enemy.enemyType = type;
    enemy.hp = def.hp;
    enemy.maxHp = def.hp;
    enemy.damage = def.damage;
    enemy.speed = def.speed;
    enemy.ranged = def.ranged || false;
    enemy.value = def.value;
    enemy.lastAttack = 0;
    enemy.attackCooldown = enemy.ranged ? 1500 : 800;
    enemy.state = 'patrol';
    enemy.patrolAngle = Math.random() * Math.PI * 2;
}

function spawnItems(scene, deck) {
    // Health
    for (let i = 0; i < 4; i++) {
        let x = Phaser.Math.Between(100, 700);
        let y = Phaser.Math.Between(100, 500);
        let item = items.create(x, y, 'health');
        item.itemType = 'health';
        item.value = 30;
        scene.tweens.add({
            targets: item,
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Ammo
    for (let i = 0; i < 5; i++) {
        let x = Phaser.Math.Between(100, 700);
        let y = Phaser.Math.Between(100, 500);
        let item = items.create(x, y, 'ammo');
        item.itemType = 'ammo';
        scene.tweens.add({
            targets: item,
            y: y - 5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Credits
    for (let i = 0; i < 6; i++) {
        let x = Phaser.Math.Between(100, 700);
        let y = Phaser.Math.Between(100, 500);
        let item = items.create(x, y, 'credit');
        item.itemType = 'credit';
        item.value = Phaser.Math.Between(15, 40);
        scene.tweens.add({
            targets: item,
            angle: 360,
            duration: 2000,
            repeat: -1
        });
    }

    // Keycards
    if (deck === 1) {
        let keycard = items.create(200, 150, 'keycard_green');
        keycard.itemType = 'keycard';
        keycard.keycardColor = 'green';
        scene.tweens.add({ targets: keycard, y: 145, duration: 500, yoyo: true, repeat: -1 });
    } else if (deck === 2) {
        let keycard = items.create(600, 200, 'keycard_blue');
        keycard.itemType = 'keycard';
        keycard.keycardColor = 'blue';
        scene.tweens.add({ targets: keycard, y: 195, duration: 500, yoyo: true, repeat: -1 });
    } else if (deck === 3) {
        let keycard = items.create(400, 400, 'keycard_yellow');
        keycard.itemType = 'keycard';
        keycard.keycardColor = 'yellow';
        scene.tweens.add({ targets: keycard, y: 395, duration: 500, yoyo: true, repeat: -1 });
    }
}

function update(time, delta) {
    if (gameState === 'menu') return;

    if (gameState === 'gameover' || gameState === 'win') {
        if (this.cursors.start.isDown) {
            gameState = 'menu';
            this.menuText.setVisible(true);
            this.titleText.setVisible(true);
            selfDestructActive = false;
        }
        return;
    }

    // Player movement
    let speed = this.cursors.sprint.isDown ? playerStats.sprintSpeed : playerStats.speed;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown) vx = -speed;
    if (this.cursors.right.isDown) vx = speed;
    if (this.cursors.up.isDown) vy = -speed;
    if (this.cursors.down.isDown) vy = speed;

    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }

    player.setVelocity(vx, vy);

    // Aim
    let pointer = this.input.activePointer;
    let angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    player.rotation = angle;

    // Shooting
    if (pointer.isDown && !reloading && time > lastFired) {
        shoot(this, time, angle);
    }

    // Reload
    if (this.cursors.reload.isDown && !reloading) startReload(time);
    if (reloading && time > reloadTimer) finishReload();

    // Switch weapon
    if (Phaser.Input.Keyboard.JustDown(this.cursors.switchWeapon)) {
        currentWeapon = (currentWeapon + 1) % WEAPONS.length;
        showMessage(WEAPONS[currentWeapon].name);
    }

    // Update enemies
    enemies.getChildren().forEach(enemy => updateEnemy(this, enemy, time));

    // Clean bullets
    bullets.getChildren().forEach(bullet => {
        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) bullet.destroy();
    });
    enemyBullets.getChildren().forEach(bullet => {
        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) bullet.destroy();
    });

    // Invincibility
    if (playerStats.invincible > 0) {
        playerStats.invincible -= delta;
        player.alpha = Math.sin(time * 0.02) * 0.3 + 0.7;
    } else {
        player.alpha = 1;
    }

    // Self-destruct
    if (selfDestructActive) {
        selfDestructTimer -= delta / 1000;
        if (selfDestructTimer <= 0) gameOver(this, 'STATION EXPLODED');
        let mins = Math.floor(selfDestructTimer / 60);
        let secs = Math.floor(selfDestructTimer % 60);
        timerText.setText(mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0'));
        timerText.setColor(selfDestructTimer < 60 ? '#ff0000' : '#ff4444');
        if (selfDestructTimer < 30) {
            this.cameras.main.shake(100, 0.002);
        }
    }

    updateUI();

    if (messageTimer > 0) {
        messageTimer -= delta;
        if (messageTimer <= 0) messageText.setText('');
    }

    if (playerStats.hp <= 0) gameOver(this, 'YOU DIED');
}

function shoot(scene, time, angle) {
    const weapon = WEAPONS[currentWeapon];

    if (magazine[currentWeapon] <= 0) {
        startReload(time);
        return;
    }

    lastFired = time + weapon.fireRate;
    magazine[currentWeapon]--;

    // Screen shake
    scene.cameras.main.shake(50, weapon.shake * 0.001);

    // Muzzle flash
    muzzleFlash.setPosition(
        player.x + Math.cos(angle) * 20,
        player.y + Math.sin(angle) * 20
    );
    muzzleFlash.setVisible(true);
    muzzleFlash.setScale(0.5 + weapon.shake * 0.05);
    muzzleFlash.setTint(weapon.color);
    scene.time.delayedCall(50, () => muzzleFlash.setVisible(false));

    // Particles
    particles.setParticleTint(weapon.color);
    particles.emitParticleAt(player.x + Math.cos(angle) * 20, player.y + Math.sin(angle) * 20, 5);

    if (weapon.pellets) {
        for (let i = 0; i < weapon.pellets; i++) {
            let spreadAngle = angle + Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread, weapon.spread));
            createBullet(scene, spreadAngle, weapon.damage);
        }
    } else {
        let spreadAngle = angle + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-weapon.spread, weapon.spread));
        createBullet(scene, spreadAngle, weapon.damage);
    }
}

function createBullet(scene, angle, damage) {
    const weapon = WEAPONS[currentWeapon];
    const tex = weapon.name === 'PLASMA' ? 'plasma' : 'bullet_' + currentWeapon;
    let bullet = bullets.create(player.x + Math.cos(angle) * 25, player.y + Math.sin(angle) * 25, tex);
    bullet.rotation = angle;
    bullet.damage = damage;
    const speed = weapon.name === 'PLASMA' ? 500 : 700;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function startReload(time) {
    const weapon = WEAPONS[currentWeapon];
    if (weapon.infinite) {
        magazine[currentWeapon] = weapon.magSize;
        return;
    }
    if (ammo[weapon.ammoType] <= 0) {
        showMessage('NO AMMO!');
        return;
    }
    reloading = true;
    reloadTimer = time + weapon.reloadTime;
    showMessage('RELOADING...');
}

function finishReload() {
    const weapon = WEAPONS[currentWeapon];
    reloading = false;
    if (weapon.infinite) {
        magazine[currentWeapon] = weapon.magSize;
    } else {
        let needed = weapon.magSize - magazine[currentWeapon];
        let available = Math.min(needed, ammo[weapon.ammoType]);
        magazine[currentWeapon] += available;
        ammo[weapon.ammoType] -= available;
    }
    showMessage('READY!');
}

function updateEnemy(scene, enemy, time) {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

    if (dist < 350) enemy.state = 'chase';
    else if (dist > 450) enemy.state = 'patrol';

    if (enemy.state === 'patrol') {
        enemy.setVelocity(
            Math.cos(enemy.patrolAngle) * enemy.speed * 0.3,
            Math.sin(enemy.patrolAngle) * enemy.speed * 0.3
        );
        if (Math.random() < 0.01) enemy.patrolAngle = Math.random() * Math.PI * 2;
    } else if (enemy.state === 'chase') {
        let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

        if (enemy.ranged && dist > 150) {
            enemy.setVelocity(Math.cos(angle) * enemy.speed * 0.4, Math.sin(angle) * enemy.speed * 0.4);
            if (time > enemy.lastAttack + enemy.attackCooldown) {
                enemy.lastAttack = time;
                let bullet = enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.damage = enemy.damage;
                bullet.setVelocity(Math.cos(angle) * 350, Math.sin(angle) * 350);
            }
        } else if (!enemy.ranged) {
            enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
        } else {
            enemy.setVelocity(-Math.cos(angle) * enemy.speed * 0.5, -Math.sin(angle) * enemy.speed * 0.5);
        }
    }
}

function bulletHitEnemy(bullet, enemy) {
    enemy.hp -= bullet.damage;

    // Blood particles
    bloodEmitter.emitParticleAt(enemy.x, enemy.y, 8);

    // Knockback
    let angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
    enemy.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);

    // Flash white
    enemy.setTint(0xffffff);
    bullet.scene.time.delayedCall(50, () => enemy.clearTint());

    bullet.destroy();

    if (enemy.hp <= 0) {
        // Death explosion
        bloodEmitter.emitParticleAt(enemy.x, enemy.y, 20);

        // Drop loot
        if (Math.random() < 0.4) {
            let item = items.create(enemy.x, enemy.y, 'credit');
            item.itemType = 'credit';
            item.value = enemy.value;
        }
        if (Math.random() < 0.25) {
            let item = items.create(enemy.x, enemy.y, 'health');
            item.itemType = 'health';
            item.value = 20;
        }

        credits += enemy.value;
        enemy.destroy();
    }
}

function enemyBulletHitPlayer(player, bullet) {
    if (playerStats.invincible > 0) {
        bullet.destroy();
        return;
    }
    takeDamage(bullet.damage, bullet.scene);
    bullet.destroy();
}

function playerTouchEnemy(player, enemy) {
    if (playerStats.invincible > 0) return;
    if (enemy.lastAttack === undefined || Date.now() - enemy.lastAttack > enemy.attackCooldown) {
        takeDamage(enemy.damage, player.scene);
        enemy.lastAttack = Date.now();
    }
}

function takeDamage(amount, scene) {
    if (playerStats.shield > 0) {
        let shieldDamage = Math.min(playerStats.shield, amount);
        playerStats.shield -= shieldDamage;
        amount -= shieldDamage;
    }
    playerStats.hp -= amount;
    playerStats.invincible = 500;

    scene.cameras.main.shake(100, 0.01);
    scene.cameras.main.flash(100, 255, 0, 0, 0.3);
}

function collectItem(player, item) {
    if (item.itemType === 'health') {
        playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + item.value);
        showMessage('+' + item.value + ' HP');
    } else if (item.itemType === 'ammo') {
        const weapon = WEAPONS[currentWeapon];
        if (!weapon.infinite) {
            ammo[weapon.ammoType] += 40;
            showMessage('+40 ' + weapon.ammoType.toUpperCase());
        }
    } else if (item.itemType === 'credit') {
        credits += item.value;
        showMessage('+$' + item.value);
    } else if (item.itemType === 'keycard') {
        keycards[item.keycardColor] = true;
        showMessage(item.keycardColor.toUpperCase() + ' KEYCARD ACQUIRED!');
        keycardIcons[item.keycardColor].setFillStyle(
            { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000 }[item.keycardColor]
        );
    }
    item.destroy();
}

function checkDoor(player, door) {
    if (door.doorType === 'escape') {
        victory(player.scene);
        return;
    }

    const required = door.doorType;
    const hasAccess = keycards[required] ||
        (required === 'green' && (keycards.blue || keycards.yellow || keycards.red)) ||
        (required === 'blue' && (keycards.yellow || keycards.red)) ||
        (required === 'yellow' && keycards.red);

    if (hasAccess) {
        generateDeck(player.scene, door.nextDeck);
    } else {
        showMessage('NEED ' + required.toUpperCase() + ' KEYCARD');
    }
}

function updateUI() {
    healthBar.width = (playerStats.hp / playerStats.maxHp) * 200;
    healthBar.setFillStyle(playerStats.hp < 30 ? 0xff2222 : 0xff4444);
    healthText.setText(Math.floor(playerStats.hp) + '/' + playerStats.maxHp);

    shieldBar.width = playerStats.maxShield > 0 ? (playerStats.shield / playerStats.maxShield) * 150 : 0;

    const weapon = WEAPONS[currentWeapon];
    weaponText.setText(weapon.name);
    weaponText.setColor('#' + weapon.color.toString(16).padStart(6, '0'));

    if (weapon.infinite) {
        ammoText.setText(magazine[currentWeapon] + '/' + weapon.magSize + ' | INF');
    } else {
        ammoText.setText(magazine[currentWeapon] + '/' + weapon.magSize + ' | ' + ammo[weapon.ammoType]);
    }

    creditText.setText('$ ' + credits);
}

function showMessage(msg) {
    messageText.setText(msg);
    messageTimer = 2000;
}

function gameOver(scene, reason) {
    gameState = 'gameover';
    messageText.setText('GAME OVER\n\n' + reason + '\n\nPress Z to retry');
}

function victory(scene) {
    gameState = 'win';
    selfDestructActive = false;
    timerText.setText('');
    messageText.setText('ESCAPED!\n\nYou survived Station Breach!\nCredits: $' + credits + '\n\nPress Z for menu');
}
