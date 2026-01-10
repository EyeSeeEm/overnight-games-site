// STATION BREACH - Twin-Stick Shooter
// Alien Breed inspired survival horror

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
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

// Game state
let player;
let enemies;
let bullets;
let enemyBullets;
let items;
let walls;
let doors;
let keycards = { green: false, blue: false, yellow: false, red: false };
let credits = 0;
let currentWeapon = 0;
let weapons = [];
let gameState = 'menu';
let currentDeck = 1;
let selfDestructTimer = 0;
let selfDestructActive = false;

// Weapon definitions
const WEAPONS = [
    { name: 'Pistol', damage: 15, fireRate: 250, magSize: 12, reloadTime: 1200, ammoType: '9mm', spread: 3, infinite: true },
    { name: 'Shotgun', damage: 8, pellets: 6, fireRate: 800, magSize: 8, reloadTime: 2500, ammoType: 'shells', spread: 25 },
    { name: 'SMG', damage: 10, fireRate: 80, magSize: 40, reloadTime: 1800, ammoType: '9mm', spread: 8 },
    { name: 'Assault', damage: 20, fireRate: 150, magSize: 30, reloadTime: 2000, ammoType: 'rifle', spread: 5 }
];

// Ammo reserves
let ammo = { '9mm': 300, 'shells': 64, 'rifle': 180 };

// Current magazine
let magazine = [12, 8, 40, 30];

// Enemy definitions
const ENEMY_TYPES = {
    drone: { hp: 20, damage: 10, speed: 120, color: 0x88ff88, size: 12 },
    spitter: { hp: 30, damage: 15, speed: 80, color: 0xffff44, size: 16, ranged: true },
    lurker: { hp: 40, damage: 20, speed: 200, color: 0xff44ff, size: 14 },
    brute: { hp: 100, damage: 30, speed: 60, color: 0xff4444, size: 24 }
};

// UI elements
let healthBar, shieldBar, ammoText, weaponText, creditText, keycardDisplay, timerText;
let lastFired = 0;
let reloading = false;
let reloadTimer = 0;
let screenShake = 0;
let messageText, messageTimer = 0;

// Player stats
let playerStats = {
    maxHp: 100,
    hp: 100,
    maxShield: 0,
    shield: 0,
    speed: 180,
    sprintSpeed: 270
};

function preload() {
    // Create textures programmatically
    createTextures(this);
}

function createTextures(scene) {
    // Player texture
    let gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x4488ff);
    gfx.fillRect(0, 0, 24, 24);
    gfx.fillStyle(0xffffff);
    gfx.fillRect(12, 8, 12, 8);
    gfx.generateTexture('player', 24, 24);
    gfx.destroy();

    // Bullet texture
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffff00);
    gfx.fillRect(0, 0, 8, 4);
    gfx.generateTexture('bullet', 8, 4);
    gfx.destroy();

    // Enemy bullet texture
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x00ff00);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('enemyBullet', 8, 8);
    gfx.destroy();

    // Wall texture
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x4a4a4a);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(1, 0x666666);
    gfx.strokeRect(0, 0, 32, 32);
    gfx.generateTexture('wall', 32, 32);
    gfx.destroy();

    // Door textures
    ['green', 'blue', 'yellow', 'red', 'normal'].forEach((color, i) => {
        gfx = scene.make.graphics({ x: 0, y: 0, add: false });
        const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000, normal: 0x888888 };
        gfx.fillStyle(0x333333);
        gfx.fillRect(0, 0, 32, 48);
        gfx.fillStyle(colors[color]);
        gfx.fillRect(0, 0, 32, 4);
        gfx.fillRect(0, 44, 32, 4);
        gfx.generateTexture('door_' + color, 32, 48);
        gfx.destroy();
    });

    // Item textures
    // Health pickup
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xff4444);
    gfx.fillRect(4, 0, 8, 16);
    gfx.fillRect(0, 4, 16, 8);
    gfx.generateTexture('health', 16, 16);
    gfx.destroy();

    // Ammo pickup
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffaa00);
    gfx.fillRect(0, 0, 16, 16);
    gfx.fillStyle(0x000000);
    gfx.fillRect(4, 4, 8, 8);
    gfx.generateTexture('ammo', 16, 16);
    gfx.destroy();

    // Credit pickup
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffdd00);
    gfx.fillCircle(8, 8, 8);
    gfx.fillStyle(0xaa8800);
    gfx.fillCircle(8, 8, 4);
    gfx.generateTexture('credit', 16, 16);
    gfx.destroy();

    // Keycard textures
    ['green', 'blue', 'yellow', 'red'].forEach(color => {
        gfx = scene.make.graphics({ x: 0, y: 0, add: false });
        const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000 };
        gfx.fillStyle(colors[color]);
        gfx.fillRect(0, 0, 20, 12);
        gfx.fillStyle(0xffffff);
        gfx.fillRect(2, 2, 8, 8);
        gfx.generateTexture('keycard_' + color, 20, 12);
        gfx.destroy();
    });

    // Terminal texture
    gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x00ffff);
    gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x000000);
    gfx.fillRect(4, 4, 24, 16);
    gfx.generateTexture('terminal', 32, 32);
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

    // Create player
    player = this.physics.add.sprite(400, 500, 'player');
    player.setCollideWorldBounds(true);
    player.setDepth(10);

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

    // Mouse input for shooting and aiming
    this.input.on('pointerdown', () => {
        if (gameState === 'menu') {
            startGame(this);
        }
    });

    // Collisions
    this.physics.add.collider(player, walls);
    this.physics.add.collider(enemies, walls);
    this.physics.add.collider(bullets, walls, (bullet) => bullet.destroy());
    this.physics.add.collider(enemyBullets, walls, (bullet) => bullet.destroy());
    this.physics.add.overlap(bullets, enemies, bulletHitEnemy, null, this);
    this.physics.add.overlap(enemyBullets, player, enemyBulletHitPlayer, null, this);
    this.physics.add.overlap(player, enemies, playerTouchEnemy, null, this);
    this.physics.add.overlap(player, items, collectItem, null, this);
    this.physics.add.overlap(player, doors, checkDoor, null, this);

    // Create UI
    createUI(this);

    // Expose for testing
    if (typeof window !== 'undefined') {
        window.getGameState = () => ({ screen: gameState, deck: currentDeck, credits, keycards });
        window.getPlayer = () => playerStats;
        window.getEnemies = () => enemies.getChildren().length;
    }
}

function createUI(scene) {
    // Health bar background
    scene.add.rectangle(110, 20, 200, 16, 0x333333).setScrollFactor(0).setDepth(100);
    healthBar = scene.add.rectangle(10, 12, 200, 16, 0xff4444).setScrollFactor(0).setDepth(101).setOrigin(0, 0);

    // Shield bar
    scene.add.rectangle(110, 40, 150, 12, 0x333333).setScrollFactor(0).setDepth(100);
    shieldBar = scene.add.rectangle(35, 34, 0, 12, 0x4488ff).setScrollFactor(0).setDepth(101).setOrigin(0, 0);

    // Weapon and ammo display
    weaponText = scene.add.text(10, 560, 'PISTOL', { fontSize: '16px', fill: '#fff' }).setScrollFactor(0).setDepth(100);
    ammoText = scene.add.text(10, 580, '12/12 | 300', { fontSize: '14px', fill: '#fff' }).setScrollFactor(0).setDepth(100);

    // Credits
    creditText = scene.add.text(700, 580, '$0', { fontSize: '16px', fill: '#ffdd00' }).setScrollFactor(0).setDepth(100);

    // Keycard display
    keycardDisplay = scene.add.text(650, 20, '', { fontSize: '12px', fill: '#fff' }).setScrollFactor(0).setDepth(100);

    // Timer (for self-destruct)
    timerText = scene.add.text(400, 20, '', { fontSize: '24px', fill: '#ff0000' }).setScrollFactor(0).setDepth(100).setOrigin(0.5);

    // Message text
    messageText = scene.add.text(400, 100, '', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0).setDepth(100).setOrigin(0.5);

    // Menu text
    scene.menuText = scene.add.text(400, 250, 'STATION BREACH\n\nClick to Start\n\n[WASD] Move\n[Mouse] Aim & Shoot\n[R] Reload\n[Q] Switch Weapon\n[E] Interact', {
        fontSize: '20px',
        fill: '#fff',
        align: 'center'
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5);
}

function startGame(scene) {
    if (gameState !== 'menu') return;
    gameState = 'game';
    scene.menuText.setVisible(false);

    // Reset player
    playerStats.hp = playerStats.maxHp;
    playerStats.shield = playerStats.maxShield;
    credits = 0;
    currentDeck = 1;
    keycards = { green: false, blue: false, yellow: false, red: false };
    currentWeapon = 0;
    magazine = [12, 8, 40, 30];
    ammo = { '9mm': 300, 'shells': 64, 'rifle': 180 };

    // Generate level
    generateDeck(scene, 1);
}

function generateDeck(scene, deck) {
    // Clear existing
    walls.clear(true, true);
    doors.clear(true, true);
    enemies.clear(true, true);
    items.clear(true, true);

    currentDeck = deck;

    // Create border walls
    for (let x = 0; x < 800; x += 32) {
        walls.create(x + 16, 16, 'wall');
        walls.create(x + 16, 584, 'wall');
    }
    for (let y = 32; y < 584; y += 32) {
        walls.create(16, y + 16, 'wall');
        walls.create(784, y + 16, 'wall');
    }

    // Create internal walls based on deck
    createDeckLayout(scene, deck);

    // Spawn enemies
    spawnEnemies(scene, deck);

    // Spawn items
    spawnItems(scene, deck);

    // Reset player position
    player.setPosition(400, 500);

    showMessage('DECK ' + deck);
}

function createDeckLayout(scene, deck) {
    if (deck === 1) {
        // Cargo bay layout - corridors
        for (let x = 100; x < 300; x += 32) {
            walls.create(x, 200, 'wall');
            walls.create(x, 400, 'wall');
        }
        for (let x = 500; x < 700; x += 32) {
            walls.create(x, 200, 'wall');
            walls.create(x, 400, 'wall');
        }
        // Green door to next deck
        let door = doors.create(400, 48, 'door_green');
        door.doorType = 'green';
        door.nextDeck = 2;
    } else if (deck === 2) {
        // Engineering - more complex
        for (let x = 200; x < 400; x += 32) {
            walls.create(x, 150, 'wall');
        }
        for (let y = 150; y < 350; y += 32) {
            walls.create(400, y, 'wall');
        }
        for (let x = 400; x < 600; x += 32) {
            walls.create(x, 350, 'wall');
        }
        // Blue door
        let door = doors.create(400, 48, 'door_blue');
        door.doorType = 'blue';
        door.nextDeck = 3;
    } else if (deck === 3) {
        // Labs
        for (let x = 150; x < 350; x += 32) {
            walls.create(x, 250, 'wall');
        }
        for (let x = 450; x < 650; x += 32) {
            walls.create(x, 250, 'wall');
        }
        // Yellow door
        let door = doors.create(400, 48, 'door_yellow');
        door.doorType = 'yellow';
        door.nextDeck = 4;
    } else if (deck === 4) {
        // Command - boss area
        for (let x = 200; x < 350; x += 32) {
            walls.create(x, 300, 'wall');
        }
        for (let x = 450; x < 600; x += 32) {
            walls.create(x, 300, 'wall');
        }
        // Escape pod (win condition)
        let escapePod = doors.create(400, 100, 'door_normal');
        escapePod.doorType = 'escape';
        escapePod.isEscape = true;

        // Start self-destruct
        if (!selfDestructActive) {
            selfDestructActive = true;
            selfDestructTimer = 600; // 10 minutes in seconds
        }
    }
}

function spawnEnemies(scene, deck) {
    const counts = {
        1: { drone: 8, spitter: 4 },
        2: { drone: 6, spitter: 4, lurker: 4, brute: 2 },
        3: { drone: 5, spitter: 5, lurker: 5, brute: 3 },
        4: { drone: 8, spitter: 4, lurker: 6, brute: 4 }
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
    let gfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(def.color);
    gfx.fillCircle(def.size, def.size, def.size);
    gfx.generateTexture('enemy_' + type + '_' + Date.now(), def.size * 2, def.size * 2);

    let enemy = enemies.create(x, y, 'enemy_' + type + '_' + Date.now());
    enemy.enemyType = type;
    enemy.hp = def.hp;
    enemy.damage = def.damage;
    enemy.speed = def.speed;
    enemy.ranged = def.ranged || false;
    enemy.lastAttack = 0;
    enemy.attackCooldown = enemy.ranged ? 2000 : 1000;
    enemy.state = 'patrol';
    enemy.patrolAngle = Math.random() * Math.PI * 2;
    gfx.destroy();
}

function spawnItems(scene, deck) {
    // Health pickups
    for (let i = 0; i < 3; i++) {
        let x = Phaser.Math.Between(100, 700);
        let y = Phaser.Math.Between(100, 500);
        let item = items.create(x, y, 'health');
        item.itemType = 'health';
        item.value = 25;
    }

    // Ammo pickups
    for (let i = 0; i < 4; i++) {
        let x = Phaser.Math.Between(100, 700);
        let y = Phaser.Math.Between(100, 500);
        let item = items.create(x, y, 'ammo');
        item.itemType = 'ammo';
    }

    // Credit pickups
    for (let i = 0; i < 5; i++) {
        let x = Phaser.Math.Between(100, 700);
        let y = Phaser.Math.Between(100, 500);
        let item = items.create(x, y, 'credit');
        item.itemType = 'credit';
        item.value = Phaser.Math.Between(10, 30);
    }

    // Keycard based on deck
    if (deck === 1) {
        let keycard = items.create(200, 150, 'keycard_green');
        keycard.itemType = 'keycard';
        keycard.keycardColor = 'green';
    } else if (deck === 2) {
        let keycard = items.create(600, 200, 'keycard_blue');
        keycard.itemType = 'keycard';
        keycard.keycardColor = 'blue';
    } else if (deck === 3) {
        let keycard = items.create(400, 400, 'keycard_yellow');
        keycard.itemType = 'keycard';
        keycard.keycardColor = 'yellow';
    }
}

function update(time, delta) {
    if (gameState === 'menu') return;

    if (gameState === 'gameover' || gameState === 'win') {
        if (this.cursors.start.isDown) {
            gameState = 'menu';
            this.menuText.setVisible(true);
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

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
    }

    player.setVelocity(vx, vy);

    // Aim at mouse
    let pointer = this.input.activePointer;
    let angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
    player.rotation = angle;

    // Shooting
    if (pointer.isDown && !reloading && time > lastFired) {
        shoot(this, time, angle);
    }

    // Reload
    if (this.cursors.reload.isDown && !reloading) {
        startReload(time);
    }

    if (reloading && time > reloadTimer) {
        finishReload();
    }

    // Switch weapon
    if (Phaser.Input.Keyboard.JustDown(this.cursors.switchWeapon)) {
        currentWeapon = (currentWeapon + 1) % WEAPONS.length;
        showMessage(WEAPONS[currentWeapon].name);
    }

    // Update enemies
    enemies.getChildren().forEach(enemy => {
        updateEnemy(this, enemy, time);
    });

    // Clean up bullets
    bullets.getChildren().forEach(bullet => {
        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
            bullet.destroy();
        }
    });

    enemyBullets.getChildren().forEach(bullet => {
        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
            bullet.destroy();
        }
    });

    // Self-destruct timer
    if (selfDestructActive) {
        selfDestructTimer -= delta / 1000;
        if (selfDestructTimer <= 0) {
            gameOver(this, 'Station exploded!');
        }
        let mins = Math.floor(selfDestructTimer / 60);
        let secs = Math.floor(selfDestructTimer % 60);
        timerText.setText(mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0'));
        if (selfDestructTimer < 60) {
            timerText.setColor('#ff0000');
        }
    }

    // Update UI
    updateUI();

    // Message timer
    if (messageTimer > 0) {
        messageTimer -= delta;
        if (messageTimer <= 0) {
            messageText.setText('');
        }
    }

    // Screen shake
    if (screenShake > 0) {
        this.cameras.main.shake(50, screenShake * 0.001);
        screenShake -= delta * 0.1;
    }

    // Check game over
    if (playerStats.hp <= 0) {
        gameOver(this, 'You died!');
    }
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
    screenShake += weapon.damage * 0.5;

    if (weapon.pellets) {
        // Shotgun spread
        for (let i = 0; i < weapon.pellets; i++) {
            let spreadAngle = angle + Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread, weapon.spread));
            createBullet(scene, spreadAngle, weapon.damage);
        }
    } else {
        let spreadAngle = angle + Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread, weapon.spread));
        createBullet(scene, spreadAngle, weapon.damage);
    }
}

function createBullet(scene, angle, damage) {
    let bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.rotation = angle;
    bullet.damage = damage;
    let speed = 600;
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
}

function startReload(time) {
    const weapon = WEAPONS[currentWeapon];
    if (weapon.infinite) {
        magazine[currentWeapon] = weapon.magSize;
        return;
    }

    if (ammo[weapon.ammoType] <= 0) {
        showMessage('No ammo!');
        return;
    }

    reloading = true;
    reloadTimer = time + weapon.reloadTime;
    showMessage('Reloading...');
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

    showMessage('Reloaded!');
}

function updateEnemy(scene, enemy, time) {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, player.x, player.y);

    if (dist < 300) {
        enemy.state = 'chase';
    } else if (dist > 400) {
        enemy.state = 'patrol';
    }

    if (enemy.state === 'patrol') {
        // Random movement
        enemy.setVelocity(
            Math.cos(enemy.patrolAngle) * enemy.speed * 0.3,
            Math.sin(enemy.patrolAngle) * enemy.speed * 0.3
        );

        // Occasionally change direction
        if (Math.random() < 0.01) {
            enemy.patrolAngle = Math.random() * Math.PI * 2;
        }
    } else if (enemy.state === 'chase') {
        let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

        if (enemy.ranged && dist > 150) {
            // Ranged enemy keeps distance
            enemy.setVelocity(Math.cos(angle) * enemy.speed * 0.5, Math.sin(angle) * enemy.speed * 0.5);

            // Shoot at player
            if (time > enemy.lastAttack + enemy.attackCooldown) {
                enemy.lastAttack = time;
                let bullet = enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.damage = enemy.damage;
                bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
            }
        } else if (!enemy.ranged) {
            // Melee enemy chases
            enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
        } else {
            // Too close, retreat
            enemy.setVelocity(-Math.cos(angle) * enemy.speed, -Math.sin(angle) * enemy.speed);
        }
    }
}

function bulletHitEnemy(bullet, enemy) {
    enemy.hp -= bullet.damage;
    bullet.destroy();

    // Knockback
    let angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
    enemy.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);

    if (enemy.hp <= 0) {
        // Drop loot
        if (Math.random() < 0.3) {
            let item = items.create(enemy.x, enemy.y, 'credit');
            item.itemType = 'credit';
            item.value = Phaser.Math.Between(5, 15);
        }
        if (Math.random() < 0.2) {
            let item = items.create(enemy.x, enemy.y, 'health');
            item.itemType = 'health';
            item.value = 15;
        }
        enemy.destroy();
    }
}

function enemyBulletHitPlayer(player, bullet) {
    takeDamage(bullet.damage);
    bullet.destroy();
}

function playerTouchEnemy(player, enemy) {
    if (enemy.lastAttack === undefined || Date.now() - enemy.lastAttack > enemy.attackCooldown) {
        takeDamage(enemy.damage);
        enemy.lastAttack = Date.now();
    }
}

function takeDamage(amount) {
    if (playerStats.shield > 0) {
        let shieldDamage = Math.min(playerStats.shield, amount);
        playerStats.shield -= shieldDamage;
        amount -= shieldDamage;
    }
    playerStats.hp -= amount;
    screenShake += amount * 2;
}

function collectItem(player, item) {
    if (item.itemType === 'health') {
        playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + item.value);
        showMessage('+' + item.value + ' HP');
    } else if (item.itemType === 'ammo') {
        const weapon = WEAPONS[currentWeapon];
        if (!weapon.infinite) {
            ammo[weapon.ammoType] += 30;
            showMessage('+30 ' + weapon.ammoType);
        }
    } else if (item.itemType === 'credit') {
        credits += item.value;
        showMessage('+$' + item.value);
    } else if (item.itemType === 'keycard') {
        keycards[item.keycardColor] = true;
        showMessage(item.keycardColor.toUpperCase() + ' KEYCARD');
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
    shieldBar.width = playerStats.maxShield > 0 ? (playerStats.shield / playerStats.maxShield) * 150 : 0;

    const weapon = WEAPONS[currentWeapon];
    weaponText.setText(weapon.name.toUpperCase());

    if (weapon.infinite) {
        ammoText.setText(magazine[currentWeapon] + '/' + weapon.magSize + ' | INF');
    } else {
        ammoText.setText(magazine[currentWeapon] + '/' + weapon.magSize + ' | ' + ammo[weapon.ammoType]);
    }

    creditText.setText('$' + credits);

    let keycardStr = '';
    if (keycards.green) keycardStr += '[G]';
    if (keycards.blue) keycardStr += '[B]';
    if (keycards.yellow) keycardStr += '[Y]';
    if (keycards.red) keycardStr += '[R]';
    keycardDisplay.setText('DECK ' + currentDeck + ' ' + keycardStr);
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
    messageText.setText('ESCAPED!\n\nYou survived Station Breach!\n\nPress Z for menu');
}
