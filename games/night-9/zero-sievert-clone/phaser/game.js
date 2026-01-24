// Zone Zero - Zero Sievert Clone - Phaser 3
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a2a1a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// Game state
let player, camera, keys;
let enemies = [];
let bullets = [];
let items = [];
let containers = [];
let decals = [];
let gameState = 'title';
let debugMode = false;
let lastShotTime = 0;
let gameTime = 0;
let killCount = 0;
let lootValue = 0;
let raining = false;
let rainParticles = [];

// Player stats
let playerStats = {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    bleeding: false,
    bleedTimer: 0,
    weapon: 'pm_pistol',
    ammo: { pistol: 24, smg: 60, shotgun: 12, rifle: 60 },
    inventory: []
};

// Weapon definitions
const weapons = {
    pm_pistol: { name: 'PM Pistol', damage: 18, fireRate: 300, ammoType: 'pistol', magSize: 8, spread: 8, range: 200, auto: false },
    skorpion: { name: 'Skorpion', damage: 14, fireRate: 100, ammoType: 'smg', magSize: 20, spread: 12, range: 150, auto: true },
    shotgun: { name: 'Pump Shotgun', damage: 8, fireRate: 800, ammoType: 'shotgun', magSize: 6, spread: 25, range: 100, pellets: 8, auto: false },
    ak74: { name: 'AK-74', damage: 28, fireRate: 150, ammoType: 'rifle', magSize: 30, spread: 6, range: 250, auto: true }
};

// Current weapon state
let currentMag = 8;
let reloading = false;
let reloadTimer = 0;
let mouseDown = false;

// Enemy definitions
const enemyTypes = {
    wolf: { hp: 40, speed: 130, damage: 15, color: 0x5a5a5a, name: 'Wolf', behavior: 'chase', range: 0 },
    boar: { hp: 80, speed: 80, damage: 20, color: 0x6a4a3a, name: 'Boar', behavior: 'charge', range: 0 },
    bandit_melee: { hp: 60, speed: 90, damage: 15, color: 0x8a6a4a, name: 'Bandit', behavior: 'chase', range: 0 },
    bandit_pistol: { hp: 60, speed: 70, damage: 12, color: 0x6a6a4a, name: 'Armed Bandit', behavior: 'ranged', range: 180 },
    bandit_rifle: { hp: 80, speed: 60, damage: 20, color: 0x5a4a4a, name: 'Rifleman', behavior: 'ranged', range: 250 }
};

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE = 280;

// Map generation
let mapTiles = [];
let extractionPoint = null;

function createTextures(scene) {
    let g;

    // Player sprite
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x6a7a6a);
    g.fillRect(6, 4, 12, 18); // Body
    g.fillStyle(0x8a9a8a);
    g.fillRect(8, 2, 8, 4); // Head
    g.fillStyle(0x5a6a5a);
    g.fillRect(4, 8, 4, 10); // Left arm
    g.fillRect(16, 8, 4, 10); // Right arm
    g.fillRect(8, 20, 4, 6); // Left leg
    g.fillRect(12, 20, 4, 6); // Right leg
    g.fillStyle(0x3a3a3a);
    g.fillRect(18, 10, 8, 3); // Gun
    g.generateTexture('player', 26, 26);
    g.destroy();

    // Enemy sprites
    Object.entries(enemyTypes).forEach(([type, data]) => {
        g = scene.make.graphics({ x: 0, y: 0 });
        if (type === 'wolf') {
            g.fillStyle(data.color);
            g.fillEllipse(12, 10, 20, 12);
            g.fillStyle(0x4a4a4a);
            g.fillRect(2, 6, 6, 4); // Head
            g.fillRect(20, 14, 8, 3); // Tail
            g.fillStyle(0xff4444);
            g.fillRect(4, 7, 2, 2); // Eye
        } else if (type === 'boar') {
            g.fillStyle(data.color);
            g.fillEllipse(12, 12, 22, 16);
            g.fillStyle(0x5a3a2a);
            g.fillRect(0, 8, 8, 8);
            g.fillStyle(0xffffff);
            g.fillRect(2, 10, 4, 2);
            g.fillRect(2, 14, 4, 2);
        } else {
            // Bandits
            g.fillStyle(data.color);
            g.fillRect(6, 4, 12, 18);
            g.fillStyle(0x8a7a6a);
            g.fillRect(8, 2, 8, 4);
            g.fillStyle(data.color - 0x101010);
            g.fillRect(4, 8, 4, 10);
            g.fillRect(16, 8, 4, 10);
            if (type !== 'bandit_melee') {
                g.fillStyle(0x2a2a2a);
                g.fillRect(18, 10, 8, 3);
            }
        }
        g.generateTexture(`enemy_${type}`, 28, 28);
        g.destroy();
    });

    // Bullet
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffdd44);
    g.fillCircle(3, 3, 3);
    g.generateTexture('bullet', 6, 6);
    g.destroy();

    // Enemy bullet
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff6644);
    g.fillCircle(3, 3, 3);
    g.generateTexture('enemy_bullet', 6, 6);
    g.destroy();

    // Ground tiles
    // Grass
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x3a5a3a);
    g.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 8; i++) {
        g.fillStyle(0x4a6a4a);
        g.fillRect(Math.random() * 28, Math.random() * 28, 4, 4);
    }
    g.generateTexture('grass', 32, 32);
    g.destroy();

    // Dirt path
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5a4a3a);
    g.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 5; i++) {
        g.fillStyle(0x4a3a2a);
        g.fillRect(Math.random() * 28, Math.random() * 28, 4, 4);
    }
    g.generateTexture('dirt', 32, 32);
    g.destroy();

    // Tree
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2a4a2a);
    g.fillTriangle(16, 0, 0, 24, 32, 24);
    g.fillStyle(0x3a5a3a);
    g.fillTriangle(16, 6, 4, 22, 28, 22);
    g.fillStyle(0x5a3a2a);
    g.fillRect(12, 22, 8, 10);
    g.generateTexture('tree', 32, 32);
    g.destroy();

    // Bush
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x2a5a2a);
    g.fillEllipse(16, 16, 28, 20);
    g.fillStyle(0x3a6a3a);
    g.fillEllipse(10, 12, 12, 10);
    g.fillEllipse(22, 14, 12, 10);
    g.generateTexture('bush', 32, 32);
    g.destroy();

    // Building wall
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5a5a5a);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x4a4a4a);
    g.fillRect(0, 0, 32, 4);
    g.fillRect(0, 28, 32, 4);
    g.fillRect(0, 0, 4, 32);
    g.fillRect(28, 0, 4, 32);
    g.generateTexture('wall', 32, 32);
    g.destroy();

    // Container/crate
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x6a5a4a);
    g.fillRect(2, 2, 28, 28);
    g.fillStyle(0x5a4a3a);
    g.fillRect(4, 4, 24, 24);
    g.fillStyle(0x4a3a2a);
    g.fillRect(14, 4, 4, 24);
    g.fillRect(4, 14, 24, 4);
    g.generateTexture('crate', 32, 32);
    g.destroy();

    // Opened crate
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x5a4a3a);
    g.fillRect(2, 6, 28, 24);
    g.fillStyle(0x4a3a2a);
    g.fillRect(4, 8, 24, 20);
    g.fillStyle(0x3a2a1a);
    g.fillRect(6, 10, 20, 16);
    g.generateTexture('crate_open', 32, 32);
    g.destroy();

    // Extraction point
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x44ff44, 0.3);
    g.fillCircle(24, 24, 24);
    g.lineStyle(3, 0x44ff44);
    g.strokeCircle(24, 24, 20);
    g.strokeCircle(24, 24, 12);
    g.fillStyle(0x44ff44);
    g.fillCircle(24, 24, 4);
    g.generateTexture('extraction', 48, 48);
    g.destroy();

    // Items
    const itemTypes = {
        medkit: 0x44aa44,
        bandage: 0xeeeeee,
        food: 0xaa8844,
        ammo_pistol: 0xaaaa44,
        ammo_smg: 0xaaaa44,
        ammo_shotgun: 0xaa6644,
        ammo_rifle: 0x888844,
        money: 0xffff44,
        weapon_skorpion: 0x5a5a5a,
        weapon_shotgun: 0x6a5a4a,
        weapon_ak74: 0x4a4a4a
    };

    Object.entries(itemTypes).forEach(([type, color]) => {
        g = scene.make.graphics({ x: 0, y: 0 });
        g.fillStyle(color);
        if (type.includes('weapon')) {
            g.fillRect(2, 8, 20, 8);
            g.fillStyle(0x3a3a3a);
            g.fillRect(4, 10, 16, 4);
        } else if (type === 'medkit') {
            g.fillRect(4, 4, 16, 16);
            g.fillStyle(0xffffff);
            g.fillRect(10, 6, 4, 12);
            g.fillRect(6, 10, 12, 4);
        } else if (type === 'bandage') {
            g.fillRect(4, 6, 16, 12);
            g.fillStyle(0xcc4444);
            g.fillRect(8, 10, 8, 4);
        } else if (type === 'money') {
            g.fillCircle(12, 12, 10);
            g.fillStyle(0xcccc00);
            g.fillCircle(12, 12, 7);
        } else {
            g.fillRect(4, 6, 16, 12);
        }
        g.generateTexture(`item_${type}`, 24, 24);
        g.destroy();
    });

    // Blood decal
    g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8a2222);
    g.fillCircle(8, 8, 6);
    g.fillCircle(12, 10, 4);
    g.fillCircle(5, 11, 3);
    g.generateTexture('blood', 16, 16);
    g.destroy();

    // Rain particle
    g = scene.make.graphics({ x: 0, y: 0 });
    g.lineStyle(1, 0x6688aa, 0.5);
    g.lineBetween(0, 0, 2, 8);
    g.generateTexture('rain', 3, 9);
    g.destroy();
}

function preload() {}

function create() {
    createTextures(this);

    // Input
    keys = {
        W: this.input.keyboard.addKey('W'),
        A: this.input.keyboard.addKey('A'),
        S: this.input.keyboard.addKey('S'),
        D: this.input.keyboard.addKey('D'),
        E: this.input.keyboard.addKey('E'),
        F: this.input.keyboard.addKey('F'),
        Q: this.input.keyboard.addKey('Q'),
        R: this.input.keyboard.addKey('R'),
        SPACE: this.input.keyboard.addKey('SPACE'),
        SHIFT: this.input.keyboard.addKey('SHIFT'),
        ONE: this.input.keyboard.addKey('ONE'),
        TWO: this.input.keyboard.addKey('TWO'),
        THREE: this.input.keyboard.addKey('THREE'),
        FOUR: this.input.keyboard.addKey('FOUR')
    };

    keys.Q.on('down', () => { debugMode = !debugMode; });

    // Weapon switching
    keys.ONE.on('down', () => switchWeapon('pm_pistol'));
    keys.TWO.on('down', () => switchWeapon('skorpion'));
    keys.THREE.on('down', () => switchWeapon('shotgun'));
    keys.FOUR.on('down', () => switchWeapon('ak74'));

    // Reload
    keys.R.on('down', () => startReload(this));

    // Groups
    this.enemyGroup = this.physics.add.group();
    this.bulletGroup = this.physics.add.group();
    this.enemyBulletGroup = this.physics.add.group();
    this.itemGroup = this.physics.add.group();
    this.wallGroup = this.physics.add.staticGroup();

    // Player
    player = this.physics.add.sprite(400, 300, 'player');
    player.setCollideWorldBounds(true);
    player.setDepth(10);
    player.visible = false;

    // Camera
    camera = this.cameras.main;

    // Mouse input
    this.input.on('pointerdown', (pointer) => {
        mouseDown = true;
        if (gameState === 'title') {
            startGame(this);
        } else if (gameState === 'playing') {
            shoot(this, pointer);
        } else if (gameState === 'gameover' || gameState === 'extracted') {
            resetGame(this);
        }
    });

    this.input.on('pointerup', () => {
        mouseDown = false;
    });

    this.input.keyboard.on('keydown-SPACE', () => {
        if (gameState === 'title') {
            startGame(this);
        } else if (gameState === 'gameover' || gameState === 'extracted') {
            resetGame(this);
        }
    });

    // Interact
    keys.E.on('down', () => {
        if (gameState === 'playing') {
            interact(this);
        }
    });

    gameState = 'title';
}

function switchWeapon(weaponKey) {
    if (weapons[weaponKey]) {
        playerStats.weapon = weaponKey;
        currentMag = weapons[weaponKey].magSize;
        reloading = false;
    }
}

function startReload(scene) {
    if (reloading) return;
    const weapon = weapons[playerStats.weapon];
    const ammoType = weapon.ammoType;
    if (currentMag >= weapon.magSize) return;
    if (playerStats.ammo[ammoType] <= 0) return;

    reloading = true;
    reloadTimer = 1500; // 1.5s reload
}

function startGame(scene) {
    gameState = 'playing';
    killCount = 0;
    lootValue = 0;
    gameTime = 0;
    raining = Math.random() < 0.3;

    playerStats = {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        bleeding: false,
        bleedTimer: 0,
        weapon: 'pm_pistol',
        ammo: { pistol: 24, smg: 60, shotgun: 12, rifle: 60 },
        inventory: []
    };
    currentMag = 8;
    reloading = false;

    generateMap(scene);
}

function generateMap(scene) {
    // Clear previous
    scene.wallGroup.clear(true, true);
    scene.enemyGroup.clear(true, true);
    scene.itemGroup.clear(true, true);
    scene.bulletGroup.clear(true, true);
    scene.enemyBulletGroup.clear(true, true);
    enemies = [];
    items = [];
    containers = [];
    decals = [];
    rainParticles = [];
    mapTiles = [];

    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;

    scene.physics.world.setBounds(0, 0, worldW, worldH);
    camera.setBounds(0, 0, worldW, worldH);

    // Generate terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        mapTiles[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = Math.random() < 0.15 ? 'dirt' : 'grass';
            mapTiles[y][x] = tile;
            scene.add.image(x * TILE_SIZE + 16, y * TILE_SIZE + 16, tile).setDepth(0);
        }
    }

    // Add trees and bushes
    for (let i = 0; i < 80; i++) {
        const x = Phaser.Math.Between(1, MAP_WIDTH - 2) * TILE_SIZE + 16;
        const y = Phaser.Math.Between(1, MAP_HEIGHT - 2) * TILE_SIZE + 16;
        const type = Math.random() < 0.7 ? 'tree' : 'bush';

        if (type === 'tree') {
            const tree = scene.wallGroup.create(x, y, 'tree');
            tree.setImmovable(true);
            tree.setDepth(3);
        } else {
            scene.add.image(x, y, 'bush').setDepth(2);
        }
    }

    // Add some building structures
    for (let b = 0; b < 3; b++) {
        const bx = Phaser.Math.Between(3, MAP_WIDTH - 8) * TILE_SIZE;
        const by = Phaser.Math.Between(3, MAP_HEIGHT - 8) * TILE_SIZE;
        const bw = Phaser.Math.Between(3, 5);
        const bh = Phaser.Math.Between(3, 4);

        for (let y = 0; y < bh; y++) {
            for (let x = 0; x < bw; x++) {
                if (y === 0 || y === bh - 1 || x === 0 || x === bw - 1) {
                    // Wall
                    const wall = scene.wallGroup.create(bx + x * TILE_SIZE + 16, by + y * TILE_SIZE + 16, 'wall');
                    wall.setImmovable(true);
                    wall.setDepth(3);
                } else {
                    // Floor
                    scene.add.image(bx + x * TILE_SIZE + 16, by + y * TILE_SIZE + 16, 'dirt').setDepth(0);
                }
            }
        }

        // Add crate inside
        const crateX = bx + Phaser.Math.Between(1, bw - 2) * TILE_SIZE + 16;
        const crateY = by + Phaser.Math.Between(1, bh - 2) * TILE_SIZE + 16;
        spawnContainer(scene, crateX, crateY);
    }

    // Add scattered crates
    for (let i = 0; i < 10; i++) {
        const x = Phaser.Math.Between(2, MAP_WIDTH - 3) * TILE_SIZE + 16;
        const y = Phaser.Math.Between(2, MAP_HEIGHT - 3) * TILE_SIZE + 16;
        spawnContainer(scene, x, y);
    }

    // Spawn enemies
    // Wildlife
    for (let i = 0; i < 6; i++) {
        const x = Phaser.Math.Between(3, MAP_WIDTH - 4) * TILE_SIZE + 16;
        const y = Phaser.Math.Between(3, MAP_HEIGHT - 4) * TILE_SIZE + 16;
        spawnEnemy(scene, x, y, Math.random() < 0.6 ? 'wolf' : 'boar');
    }

    // Bandits
    for (let i = 0; i < 8; i++) {
        const x = Phaser.Math.Between(3, MAP_WIDTH - 4) * TILE_SIZE + 16;
        const y = Phaser.Math.Between(3, MAP_HEIGHT - 4) * TILE_SIZE + 16;
        const types = ['bandit_melee', 'bandit_pistol', 'bandit_rifle'];
        spawnEnemy(scene, x, y, types[Phaser.Math.Between(0, 2)]);
    }

    // Player start
    player.setPosition(TILE_SIZE * 3, TILE_SIZE * 3);
    player.visible = true;

    // Extraction point (far from player)
    const exX = Phaser.Math.Between(MAP_WIDTH - 6, MAP_WIDTH - 3) * TILE_SIZE;
    const exY = Phaser.Math.Between(MAP_HEIGHT - 6, MAP_HEIGHT - 3) * TILE_SIZE;
    extractionPoint = { x: exX, y: exY };
    scene.add.image(exX, exY, 'extraction').setDepth(1);

    camera.startFollow(player, true, 0.1, 0.1);

    // Collision
    scene.physics.add.collider(player, scene.wallGroup);
    scene.physics.add.collider(scene.enemyGroup, scene.wallGroup);
    scene.physics.add.collider(scene.bulletGroup, scene.wallGroup, (bullet) => bullet.destroy());
    scene.physics.add.collider(scene.enemyBulletGroup, scene.wallGroup, (bullet) => bullet.destroy());

    scene.physics.add.overlap(scene.bulletGroup, scene.enemyGroup, bulletHitEnemy, null, scene);
    scene.physics.add.overlap(scene.enemyBulletGroup, player, enemyBulletHitPlayer, null, scene);
}

function spawnContainer(scene, x, y) {
    const cont = {
        x: x,
        y: y,
        opened: false,
        sprite: scene.add.image(x, y, 'crate').setDepth(2)
    };
    cont.sprite.containerData = cont;
    containers.push(cont);
}

function spawnEnemy(scene, x, y, type) {
    const data = enemyTypes[type];
    const enemy = scene.enemyGroup.create(x, y, `enemy_${type}`);
    enemy.enemyData = {
        type: type,
        hp: data.hp,
        maxHp: data.hp,
        speed: data.speed,
        damage: data.damage,
        behavior: data.behavior,
        range: data.range,
        state: 'patrol',
        patrolTarget: { x: x + Phaser.Math.Between(-100, 100), y: y + Phaser.Math.Between(-100, 100) },
        lastShot: 0,
        alertTimer: 0,
        facingAngle: Math.random() * Math.PI * 2
    };
    enemy.setDepth(5);
    enemies.push(enemy);
}

function spawnItem(scene, x, y, type) {
    const item = scene.itemGroup.create(x, y, `item_${type}`);
    item.itemType = type;
    item.setDepth(2);
    items.push(item);

    scene.tweens.add({
        targets: item,
        y: y - 3,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}

function shoot(scene, pointer) {
    if (reloading) return;

    const weapon = weapons[playerStats.weapon];
    const now = scene.time.now;

    if (now - lastShotTime < weapon.fireRate) return;
    if (currentMag <= 0) {
        startReload(scene);
        return;
    }

    lastShotTime = now;
    currentMag--;

    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);

    const pellets = weapon.pellets || 1;
    for (let p = 0; p < pellets; p++) {
        const spreadRad = Phaser.Math.DegToRad(weapon.spread);
        const bulletAngle = angle + Phaser.Math.FloatBetween(-spreadRad / 2, spreadRad / 2);

        const bullet = scene.bulletGroup.create(player.x, player.y, 'bullet');
        bullet.setDepth(8);
        bullet.damage = weapon.damage;
        const speed = 400;
        bullet.setVelocity(Math.cos(bulletAngle) * speed, Math.sin(bulletAngle) * speed);

        scene.time.delayedCall(800, () => { if (bullet.active) bullet.destroy(); });
    }

    // Muzzle flash
    const flash = scene.add.circle(player.x + Math.cos(angle) * 20, player.y + Math.sin(angle) * 20, 6, 0xffff00);
    flash.setDepth(15);
    scene.time.delayedCall(40, () => flash.destroy());

    // Screen shake
    camera.shake(50, 0.003);
}

function bulletHitEnemy(bullet, enemy) {
    bullet.destroy();

    const data = enemy.enemyData;
    data.hp -= bullet.damage;
    data.state = 'chase';
    data.alertTimer = 5000;

    enemy.setTint(0xffffff);
    this.time.delayedCall(80, () => {
        if (enemy.active) enemy.clearTint();
    });

    showFloatingText(this, enemy.x, enemy.y - 20, `-${bullet.damage}`, 0xff4444);

    if (data.hp <= 0) {
        killEnemy(this, enemy);
    }
}

function enemyBulletHitPlayer(playerSprite, bullet) {
    bullet.destroy();
    takeDamage(this, bullet.damage || 10);
}

function takeDamage(scene, amount) {
    playerStats.health -= amount;

    // Chance to start bleeding
    if (Math.random() < 0.3) {
        playerStats.bleeding = true;
        playerStats.bleedTimer = 10000; // 10 seconds
    }

    camera.shake(100, 0.01);
    player.setTint(0xff0000);
    scene.time.delayedCall(100, () => player.clearTint());

    showFloatingText(scene, player.x, player.y - 20, `-${amount}`, 0xff0000);

    if (playerStats.health <= 0) {
        playerStats.health = 0;
        gameState = 'gameover';
    }
}

function killEnemy(scene, enemy) {
    // Blood decal
    const blood = scene.add.image(enemy.x, enemy.y, 'blood').setDepth(1).setAlpha(0.7);
    decals.push(blood);

    // Drop loot
    const lootChance = Math.random();
    if (lootChance < 0.4) {
        // Healing (more common)
        const healType = Math.random() < 0.6 ? 'bandage' : 'medkit';
        spawnItem(scene, enemy.x + Phaser.Math.Between(-15, 15), enemy.y + Phaser.Math.Between(-15, 15), healType);
    } else if (lootChance < 0.6) {
        // Ammo
        const ammoTypes = ['ammo_pistol', 'ammo_smg', 'ammo_shotgun', 'ammo_rifle'];
        spawnItem(scene, enemy.x + Phaser.Math.Between(-15, 15), enemy.y + Phaser.Math.Between(-15, 15), ammoTypes[Phaser.Math.Between(0, 3)]);
    } else if (lootChance < 0.75) {
        // Money
        spawnItem(scene, enemy.x + Phaser.Math.Between(-15, 15), enemy.y + Phaser.Math.Between(-15, 15), 'money');
    }

    killCount++;
    enemies = enemies.filter(e => e !== enemy);
    enemy.destroy();
}

function showFloatingText(scene, x, y, text, color) {
    const txt = scene.add.text(x, y, text, {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: `#${color.toString(16).padStart(6, '0')}`
    }).setDepth(20);

    scene.tweens.add({
        targets: txt,
        y: y - 25,
        alpha: 0,
        duration: 600,
        onComplete: () => txt.destroy()
    });
}

function interact(scene) {
    const interactRange = 50;

    // Check items
    items.forEach(item => {
        if (!item.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, item.x, item.y);
        if (dist < interactRange) {
            pickupItem(scene, item);
        }
    });

    // Check containers
    containers.forEach(cont => {
        if (cont.opened) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, cont.x, cont.y);
        if (dist < interactRange) {
            openContainer(scene, cont);
        }
    });

    // Check extraction
    if (extractionPoint) {
        const dist = Phaser.Math.Distance.Between(player.x, player.y, extractionPoint.x, extractionPoint.y);
        if (dist < 40) {
            gameState = 'extracted';
        }
    }
}

function pickupItem(scene, item) {
    const type = item.itemType;

    if (type === 'medkit') {
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 50);
        playerStats.bleeding = false;
        showFloatingText(scene, item.x, item.y, '+50 HP', 0x44ff44);
    } else if (type === 'bandage') {
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 20);
        playerStats.bleeding = false;
        showFloatingText(scene, item.x, item.y, '+20 HP', 0x44ff44);
    } else if (type === 'food') {
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 10);
        showFloatingText(scene, item.x, item.y, '+10 HP', 0x44ff44);
    } else if (type === 'ammo_pistol') {
        playerStats.ammo.pistol += 12;
        showFloatingText(scene, item.x, item.y, '+12 Pistol', 0xffff44);
    } else if (type === 'ammo_smg') {
        playerStats.ammo.smg += 30;
        showFloatingText(scene, item.x, item.y, '+30 SMG', 0xffff44);
    } else if (type === 'ammo_shotgun') {
        playerStats.ammo.shotgun += 8;
        showFloatingText(scene, item.x, item.y, '+8 Shells', 0xffaa44);
    } else if (type === 'ammo_rifle') {
        playerStats.ammo.rifle += 30;
        showFloatingText(scene, item.x, item.y, '+30 Rifle', 0xffff44);
    } else if (type === 'money') {
        const amount = Phaser.Math.Between(50, 200);
        lootValue += amount;
        showFloatingText(scene, item.x, item.y, `+${amount}R`, 0xffff00);
    } else if (type === 'weapon_skorpion') {
        showFloatingText(scene, item.x, item.y, 'Skorpion!', 0x44aaff);
        playerStats.weapon = 'skorpion';
        currentMag = weapons.skorpion.magSize;
    } else if (type === 'weapon_shotgun') {
        showFloatingText(scene, item.x, item.y, 'Shotgun!', 0x44aaff);
        playerStats.weapon = 'shotgun';
        currentMag = weapons.shotgun.magSize;
    } else if (type === 'weapon_ak74') {
        showFloatingText(scene, item.x, item.y, 'AK-74!', 0x44aaff);
        playerStats.weapon = 'ak74';
        currentMag = weapons.ak74.magSize;
    }

    items = items.filter(i => i !== item);
    item.destroy();
}

function openContainer(scene, cont) {
    cont.opened = true;
    cont.sprite.setTexture('crate_open');

    // Spawn loot - prioritize healing items (2:1 ratio)
    const numItems = Phaser.Math.Between(1, 3);
    for (let i = 0; i < numItems; i++) {
        const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(20, 40);

        const roll = Math.random();
        let itemType;

        if (roll < 0.4) {
            // Healing (40%)
            itemType = Math.random() < 0.6 ? 'bandage' : 'medkit';
        } else if (roll < 0.65) {
            // Ammo (25%)
            const ammoTypes = ['ammo_pistol', 'ammo_smg', 'ammo_shotgun', 'ammo_rifle'];
            itemType = ammoTypes[Phaser.Math.Between(0, 3)];
        } else if (roll < 0.85) {
            // Money (20%)
            itemType = 'money';
        } else if (roll < 0.92) {
            // Food (7%)
            itemType = 'food';
        } else {
            // Weapon (8%)
            const weaponTypes = ['weapon_skorpion', 'weapon_shotgun', 'weapon_ak74'];
            itemType = weaponTypes[Phaser.Math.Between(0, 2)];
        }

        spawnItem(scene, cont.x + offsetX, cont.y + offsetY, itemType);
    }

    showFloatingText(scene, cont.x, cont.y - 20, 'Opened!', 0xaaaaaa);
}

function update(time, delta) {
    if (gameState === 'title') {
        drawTitle(this);
        return;
    }

    if (gameState === 'gameover') {
        drawGameOver(this);
        return;
    }

    if (gameState === 'extracted') {
        drawExtracted(this);
        return;
    }

    if (gameState !== 'playing') return;

    gameTime += delta;

    // Reload timer
    if (reloading) {
        reloadTimer -= delta;
        if (reloadTimer <= 0) {
            const weapon = weapons[playerStats.weapon];
            const ammoType = weapon.ammoType;
            const needed = weapon.magSize - currentMag;
            const available = Math.min(needed, playerStats.ammo[ammoType]);
            playerStats.ammo[ammoType] -= available;
            currentMag += available;
            reloading = false;
        }
    }

    // Bleeding
    if (playerStats.bleeding) {
        playerStats.bleedTimer -= delta;
        playerStats.health -= delta * 0.002; // 2 HP/sec
        if (playerStats.bleedTimer <= 0 || playerStats.health <= 0) {
            playerStats.bleeding = false;
        }
        if (playerStats.health <= 0) {
            playerStats.health = 0;
            gameState = 'gameover';
        }
    }

    // Stamina regen
    if (!keys.SHIFT.isDown) {
        playerStats.stamina = Math.min(playerStats.maxStamina, playerStats.stamina + delta * 0.02);
    }

    // Player movement
    let vx = 0, vy = 0;
    let speed = 150;

    if (keys.SHIFT.isDown && playerStats.stamina > 0) {
        speed = 220;
        playerStats.stamina -= delta * 0.03;
    }

    if (keys.W.isDown) vy = -speed;
    if (keys.S.isDown) vy = speed;
    if (keys.A.isDown) vx = -speed;
    if (keys.D.isDown) vx = speed;

    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }

    player.setVelocity(vx, vy);

    // Rotate player toward mouse
    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    player.setRotation(angle + Math.PI / 2);

    // Auto-fire
    if (mouseDown && weapons[playerStats.weapon].auto) {
        shoot(this, pointer);
    }

    // Update enemies
    updateEnemies(this, time, delta, pointer);

    // Rain effect
    if (raining) {
        updateRain(this);
    }

    // Draw UI
    drawGame(this, pointer);
}

function updateEnemies(scene, time, delta, pointer) {
    const playerAngle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);

    enemies.forEach(enemy => {
        if (!enemy.active) return;

        const data = enemy.enemyData;
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

        // Vision cone check - enemy can only see player if they're facing them
        const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - data.facingAngle));
        const canSeePlayer = distToPlayer < 200 && angleDiff < Math.PI / 3;

        // Also check if player can see enemy (for visibility)
        const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        const playerAngleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - playerAngle));
        const playerCanSee = playerAngleDiff < VISION_CONE_ANGLE / 2 && distToPlayer < VISION_RANGE;

        // Set visibility
        enemy.setAlpha(playerCanSee ? 1 : 0.15);

        if (canSeePlayer) {
            data.state = 'chase';
            data.alertTimer = 5000;
        } else if (data.alertTimer > 0) {
            data.alertTimer -= delta;
        } else {
            data.state = 'patrol';
        }

        if (data.state === 'chase') {
            data.facingAngle = angleToPlayer;

            if (data.behavior === 'ranged' && distToPlayer < data.range && distToPlayer > 80) {
                enemy.setVelocity(0, 0);

                if (time - data.lastShot > 1200) {
                    data.lastShot = time;
                    enemyShoot(scene, enemy, angleToPlayer);
                }
            } else if (data.behavior === 'charge' && distToPlayer < 150) {
                // Boar charge
                const chargeSpeed = data.speed * 2;
                enemy.setVelocity(Math.cos(angleToPlayer) * chargeSpeed, Math.sin(angleToPlayer) * chargeSpeed);
            } else {
                enemy.setVelocity(Math.cos(angleToPlayer) * data.speed, Math.sin(angleToPlayer) * data.speed);
            }

            // Melee attack
            if (distToPlayer < 25 && time - data.lastShot > 800) {
                data.lastShot = time;
                takeDamage(scene, data.damage);
            }
        } else {
            // Patrol
            const distToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, data.patrolTarget.x, data.patrolTarget.y);

            if (distToTarget < 20) {
                data.patrolTarget = {
                    x: enemy.x + Phaser.Math.Between(-100, 100),
                    y: enemy.y + Phaser.Math.Between(-100, 100)
                };
            }

            const patrolAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, data.patrolTarget.x, data.patrolTarget.y);
            data.facingAngle = patrolAngle;
            enemy.setVelocity(Math.cos(patrolAngle) * data.speed * 0.3, Math.sin(patrolAngle) * data.speed * 0.3);
        }

        enemy.setRotation(data.facingAngle + Math.PI / 2);
    });
}

function enemyShoot(scene, enemy, angle) {
    const bullet = scene.enemyBulletGroup.create(enemy.x, enemy.y, 'enemy_bullet');
    bullet.setDepth(8);
    bullet.damage = enemy.enemyData.damage;
    const speed = 280;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    scene.time.delayedCall(1500, () => { if (bullet.active) bullet.destroy(); });
}

function updateRain(scene) {
    // Add rain particles
    if (Math.random() < 0.3) {
        const x = camera.scrollX + Phaser.Math.Between(0, 800);
        const y = camera.scrollY - 20;
        const rain = scene.add.image(x, y, 'rain').setDepth(50).setAlpha(0.4);
        rainParticles.push(rain);
    }

    // Move rain
    rainParticles.forEach((rain, i) => {
        rain.y += 8;
        rain.x += 1;
        if (rain.y > camera.scrollY + 620) {
            rain.destroy();
            rainParticles.splice(i, 1);
        }
    });
}

function drawGame(scene, pointer) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    // Vision cone effect
    drawVisionCone(scene, pointer);

    // HUD
    drawHUD(scene);

    // Debug
    if (debugMode) {
        drawDebug(scene);
    }
}

function drawVisionCone(scene, pointer) {
    const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);

    // Draw vision cone indicator
    const lightGraphics = scene.add.graphics();
    lightGraphics.isUI = true;
    lightGraphics.setDepth(4);
    lightGraphics.fillStyle(0xffffff, 0.05);
    lightGraphics.beginPath();
    lightGraphics.moveTo(player.x, player.y);

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const a = angle - VISION_CONE_ANGLE / 2 + (VISION_CONE_ANGLE * i / steps);
        const x = player.x + Math.cos(a) * VISION_RANGE;
        const y = player.y + Math.sin(a) * VISION_RANGE;
        lightGraphics.lineTo(x, y);
    }

    lightGraphics.closePath();
    lightGraphics.fill();
}

function drawHUD(scene) {
    const sx = camera.scrollX;
    const sy = camera.scrollY;

    // HP label and bar
    const hpLabel = scene.add.text(sx + 10, sy + 10, 'HP', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setDepth(100);
    hpLabel.isUI = true;

    const hpBg = scene.add.rectangle(sx + 40, sy + 13, 120, 14, 0x2a2a2a);
    hpBg.setOrigin(0, 0);
    hpBg.setDepth(100);
    hpBg.isUI = true;

    const hpFill = scene.add.rectangle(sx + 40, sy + 13, 120 * (playerStats.health / playerStats.maxHealth), 14, playerStats.bleeding ? 0xaa2222 : 0xcc4444);
    hpFill.setOrigin(0, 0);
    hpFill.setDepth(101);
    hpFill.isUI = true;

    // Stamina bar (green arrows style)
    const staminaLabel = scene.add.text(sx + 10, sy + 30, '>>>', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#44aa44',
        fontStyle: 'bold'
    }).setDepth(100);
    staminaLabel.isUI = true;

    const staminaBg = scene.add.rectangle(sx + 40, sy + 32, 120, 10, 0x2a2a2a);
    staminaBg.setOrigin(0, 0);
    staminaBg.setDepth(100);
    staminaBg.isUI = true;

    const staminaFill = scene.add.rectangle(sx + 40, sy + 32, 120 * (playerStats.stamina / playerStats.maxStamina), 10, 0x44aa44);
    staminaFill.setOrigin(0, 0);
    staminaFill.setDepth(101);
    staminaFill.isUI = true;

    // Bleeding indicator
    if (playerStats.bleeding) {
        const bleedIcon = scene.add.text(sx + 170, sy + 10, 'BLEEDING', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#ff4444'
        }).setDepth(100);
        bleedIcon.isUI = true;
        bleedIcon.setAlpha(0.5 + Math.sin(scene.time.now / 200) * 0.5);
    }

    // Weapon info - bottom left
    const weapon = weapons[playerStats.weapon];
    const weaponText = scene.add.text(sx + 10, sy + 555, `[${weapon.name}]`, {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#aaaaaa'
    }).setDepth(100);
    weaponText.isUI = true;

    const ammoColor = reloading ? '#ffaa44' : '#ffffff';
    const ammoText = scene.add.text(sx + 10, sy + 572, reloading ? 'RELOADING...' : `${currentMag}/${playerStats.ammo[weapon.ammoType]}`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: ammoColor,
        fontStyle: 'bold'
    }).setDepth(100);
    ammoText.isUI = true;

    // Quick slots hint
    const slotsText = scene.add.text(sx + 150, sy + 565, '1:Pistol 2:SMG 3:Shotgun 4:Rifle', {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#666666'
    }).setDepth(100);
    slotsText.isUI = true;

    // Extraction distance - top right
    if (extractionPoint) {
        const distToExt = Phaser.Math.Distance.Between(player.x, player.y, extractionPoint.x, extractionPoint.y);
        const angleToExt = Phaser.Math.Angle.Between(player.x, player.y, extractionPoint.x, extractionPoint.y);
        const dirX = Math.cos(angleToExt) > 0 ? 'E' : 'W';
        const dirY = Math.sin(angleToExt) > 0 ? 'S' : 'N';
        const dir = dirY + dirX;

        const extText = scene.add.text(sx + 620, sy + 10, `EXTRACT: ${Math.floor(distToExt / 32)}m ${dir}`, {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#44ff44'
        }).setDepth(100);
        extText.isUI = true;
    }

    // Loot value
    const lootText = scene.add.text(sx + 620, sy + 30, `Loot: ${lootValue}R`, {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#ffff44'
    }).setDepth(100);
    lootText.isUI = true;

    // Kills
    const killText = scene.add.text(sx + 620, sy + 48, `Kills: ${killCount}`, {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#ff6644'
    }).setDepth(100);
    killText.isUI = true;

    // Time
    const timeMin = Math.floor(gameTime / 60000);
    const timeSec = Math.floor((gameTime % 60000) / 1000);
    const timeText = scene.add.text(sx + 620, sy + 66, `Time: ${timeMin}:${timeSec.toString().padStart(2, '0')}`, {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#aaaaaa'
    }).setDepth(100);
    timeText.isUI = true;

    // Interact prompt
    let nearInteractable = false;
    containers.forEach(c => {
        if (!c.opened && Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y) < 50) {
            nearInteractable = true;
        }
    });
    items.forEach(i => {
        if (i.active && Phaser.Math.Distance.Between(player.x, player.y, i.x, i.y) < 50) {
            nearInteractable = true;
        }
    });
    if (extractionPoint && Phaser.Math.Distance.Between(player.x, player.y, extractionPoint.x, extractionPoint.y) < 50) {
        nearInteractable = true;
    }

    if (nearInteractable) {
        const promptText = scene.add.text(sx + 350, sy + 400, '[E] INTERACT', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#ffff44',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setDepth(100);
        promptText.isUI = true;
    }

    // Controls hint
    const controlsText = scene.add.text(sx + 10, sy + 585, 'WASD:Move SHIFT:Sprint R:Reload E:Interact Q:Debug', {
        fontSize: '8px',
        fontFamily: 'Courier New',
        color: '#444444'
    }).setDepth(100);
    controlsText.isUI = true;
}

function drawDebug(scene) {
    const sx = camera.scrollX;
    const sy = camera.scrollY;

    const debugPanel = scene.add.rectangle(sx + 200, sy + 10, 200, 130, 0x000000, 0.85);
    debugPanel.setOrigin(0, 0);
    debugPanel.setDepth(150);
    debugPanel.isUI = true;

    const weapon = weapons[playerStats.weapon];
    const debugInfo = [
        `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
        `Health: ${Math.floor(playerStats.health)}/${playerStats.maxHealth}`,
        `Stamina: ${Math.floor(playerStats.stamina)}/${playerStats.maxStamina}`,
        `Bleeding: ${playerStats.bleeding}`,
        `Weapon: ${weapon.name}`,
        `Mag: ${currentMag}/${weapon.magSize}`,
        `Enemies: ${enemies.length}`,
        `Kills: ${killCount}`,
        `State: ${gameState}`
    ];

    debugInfo.forEach((line, i) => {
        const txt = scene.add.text(sx + 210, sy + 15 + i * 13, line, {
            fontSize: '10px',
            fontFamily: 'Courier New',
            color: '#44ff44'
        }).setDepth(151);
        txt.isUI = true;
    });
}

function drawTitle(scene) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const title = scene.add.text(400, 140, 'ZONE ZERO', {
        fontSize: '42px',
        fontFamily: 'Courier New',
        color: '#aabb66',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100);
    title.isUI = true;

    const subtitle = scene.add.text(400, 190, 'A Zero Sievert Clone', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#6a7a5a'
    }).setOrigin(0.5).setDepth(100);
    subtitle.isUI = true;

    const flicker = scene.add.text(400, 280, 'Click or Press SPACE to Start Raid', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(100);
    flicker.isUI = true;
    flicker.setAlpha(0.5 + Math.sin(scene.time.now / 200) * 0.5);

    const controls = scene.add.text(400, 380,
        'Controls:\nWASD - Move\nMouse - Aim & Shoot\nR - Reload\nE - Interact / Loot\nSHIFT - Sprint\n1-4 - Switch Weapons\nQ - Debug Mode', {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#888888',
        align: 'center'
    }).setOrigin(0.5).setDepth(100);
    controls.isUI = true;

    const objective = scene.add.text(400, 520,
        'Objective: Explore the zone, loot containers,\nkill enemies, and reach the extraction point!', {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#6a8a6a',
        align: 'center'
    }).setOrigin(0.5).setDepth(100);
    objective.isUI = true;
}

function drawGameOver(scene) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x1a1a1a, 0.9);
    bg.setDepth(200);
    bg.isUI = true;

    const title = scene.add.text(400, 180, 'KIA - KILLED IN ACTION', {
        fontSize: '32px',
        fontFamily: 'Courier New',
        color: '#cc4444',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(201);
    title.isUI = true;

    const stats = scene.add.text(400, 280,
        `Kills: ${killCount}\nLoot Value: ${lootValue}R\nTime: ${Math.floor(gameTime / 60000)}:${Math.floor((gameTime % 60000) / 1000).toString().padStart(2, '0')}\n\nAll loot has been lost.`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#888888',
        align: 'center'
    }).setOrigin(0.5).setDepth(201);
    stats.isUI = true;

    const restart = scene.add.text(400, 420, 'Click or Press SPACE to Try Again', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(201);
    restart.isUI = true;
}

function drawExtracted(scene) {
    scene.children.list.filter(c => c.isUI).forEach(c => c.destroy());

    const bg = scene.add.rectangle(400, 300, 800, 600, 0x1a2a1a, 0.9);
    bg.setDepth(200);
    bg.isUI = true;

    const title = scene.add.text(400, 150, 'EXTRACTION SUCCESSFUL', {
        fontSize: '32px',
        fontFamily: 'Courier New',
        color: '#44ff44',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(201);
    title.isUI = true;

    const finalScore = lootValue + (killCount * 50);

    const stats = scene.add.text(400, 260,
        `RAID SUMMARY\n\nKills: ${killCount} (+${killCount * 50})\nLoot Value: ${lootValue}R\nTime: ${Math.floor(gameTime / 60000)}:${Math.floor((gameTime % 60000) / 1000).toString().padStart(2, '0')}\n\nFINAL SCORE: ${finalScore}`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#aaaaaa',
        align: 'center'
    }).setOrigin(0.5).setDepth(201);
    stats.isUI = true;

    const message = scene.add.text(400, 400,
        'You made it out alive with your loot.\nThe zone waits for your return...', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#6a8a6a',
        align: 'center'
    }).setOrigin(0.5).setDepth(201);
    message.isUI = true;

    const restart = scene.add.text(400, 480, 'Click or Press SPACE to Raid Again', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#44ff44'
    }).setOrigin(0.5).setDepth(201);
    restart.isUI = true;
}

function resetGame(scene) {
    gameState = 'title';
    player.visible = false;

    scene.wallGroup.clear(true, true);
    scene.enemyGroup.clear(true, true);
    scene.itemGroup.clear(true, true);
    scene.bulletGroup.clear(true, true);
    scene.enemyBulletGroup.clear(true, true);

    enemies = [];
    items = [];
    containers = [];
    decals = [];
    rainParticles = [];

    camera.stopFollow();
    camera.setScroll(0, 0);
}
