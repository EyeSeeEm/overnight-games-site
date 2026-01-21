// Lost Outpost - Survival Horror Shooter
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Player
        const player = this.add.graphics();
        player.fillStyle(0x4488aa);
        player.fillCircle(16, 16, 14);
        player.fillStyle(0x2266aa);
        player.fillRect(8, 8, 16, 6); // visor
        player.fillStyle(0x666666);
        player.fillRect(14, 0, 4, 10); // gun
        player.generateTexture('player', 32, 32);
        player.destroy();

        // Bullet
        const bullet = this.add.graphics();
        bullet.fillStyle(0xffff44);
        bullet.fillRect(0, 0, 8, 3);
        bullet.generateTexture('bullet', 8, 3);
        bullet.destroy();

        // Shotgun pellet
        const pellet = this.add.graphics();
        pellet.fillStyle(0xffaa44);
        pellet.fillCircle(3, 3, 3);
        pellet.generateTexture('pellet', 6, 6);
        pellet.destroy();

        // Flame
        const flame = this.add.graphics();
        flame.fillStyle(0xff6600);
        flame.fillCircle(8, 8, 6);
        flame.fillStyle(0xffaa00);
        flame.fillCircle(8, 8, 4);
        flame.generateTexture('flame', 16, 16);
        flame.destroy();

        // Enemy: Scorpion
        const scorpion = this.add.graphics();
        scorpion.fillStyle(0x225522);
        scorpion.fillCircle(12, 12, 10);
        scorpion.fillStyle(0x44aa44);
        scorpion.fillCircle(8, 8, 3);
        scorpion.fillCircle(16, 8, 3);
        scorpion.fillStyle(0xff0000);
        scorpion.fillCircle(8, 8, 1);
        scorpion.fillCircle(16, 8, 1);
        scorpion.generateTexture('scorpion', 24, 24);
        scorpion.destroy();

        // Enemy: Scorpion Laser
        const scorpionLaser = this.add.graphics();
        scorpionLaser.fillStyle(0x225588);
        scorpionLaser.fillCircle(12, 12, 10);
        scorpionLaser.fillStyle(0x44aaff);
        scorpionLaser.fillCircle(8, 8, 3);
        scorpionLaser.fillCircle(16, 8, 3);
        scorpionLaser.fillStyle(0x00ff00);
        scorpionLaser.fillCircle(8, 8, 1);
        scorpionLaser.fillCircle(16, 8, 1);
        scorpionLaser.generateTexture('scorpionLaser', 24, 24);
        scorpionLaser.destroy();

        // Enemy: Arachnid
        const arachnid = this.add.graphics();
        arachnid.fillStyle(0x442244);
        arachnid.fillCircle(18, 18, 16);
        arachnid.fillStyle(0x664466);
        arachnid.fillCircle(18, 12, 8);
        arachnid.fillStyle(0xff0000);
        for (let i = 0; i < 4; i++) {
            const x = 10 + (i % 2) * 16;
            const y = 8 + Math.floor(i / 2) * 8;
            arachnid.fillCircle(x, y, 2);
        }
        arachnid.generateTexture('arachnid', 36, 36);
        arachnid.destroy();

        // Boss: Hive Commander
        const boss = this.add.graphics();
        boss.fillStyle(0x443322);
        boss.fillCircle(32, 32, 30);
        boss.fillStyle(0x665544);
        boss.fillCircle(32, 24, 16);
        boss.fillStyle(0xff0000);
        boss.fillCircle(24, 20, 4);
        boss.fillCircle(40, 20, 4);
        boss.fillStyle(0x88ff00);
        boss.fillCircle(32, 32, 8);
        boss.generateTexture('boss', 64, 64);
        boss.destroy();

        // Enemy laser
        const enemyLaser = this.add.graphics();
        enemyLaser.fillStyle(0x00ff00);
        enemyLaser.fillRect(0, 0, 12, 4);
        enemyLaser.generateTexture('enemyLaser', 12, 4);
        enemyLaser.destroy();

        // Floor tile
        const floor = this.add.graphics();
        floor.fillStyle(0x222233);
        floor.fillRect(0, 0, 32, 32);
        floor.fillStyle(0x1a1a2a);
        floor.fillRect(1, 1, 30, 30);
        floor.lineStyle(1, 0x333344);
        floor.strokeRect(0, 0, 32, 32);
        floor.generateTexture('floor', 32, 32);
        floor.destroy();

        // Wall tile
        const wall = this.add.graphics();
        wall.fillStyle(0x444455);
        wall.fillRect(0, 0, 32, 32);
        wall.fillStyle(0x333344);
        wall.fillRect(2, 2, 28, 28);
        wall.lineStyle(1, 0x555566);
        wall.strokeRect(0, 0, 32, 32);
        wall.generateTexture('wall', 32, 32);
        wall.destroy();

        // Door
        const door = this.add.graphics();
        door.fillStyle(0x666644);
        door.fillRect(0, 0, 32, 32);
        door.fillStyle(0xaaaa66);
        door.fillRect(4, 4, 24, 24);
        door.fillStyle(0x44ff44);
        door.fillCircle(24, 16, 4);
        door.generateTexture('door', 32, 32);
        door.destroy();

        // Health pack
        const health = this.add.graphics();
        health.fillStyle(0xffffff);
        health.fillRect(0, 0, 16, 16);
        health.fillStyle(0xff0000);
        health.fillRect(6, 2, 4, 12);
        health.fillRect(2, 6, 12, 4);
        health.generateTexture('health', 16, 16);
        health.destroy();

        // Ammo pack
        const ammo = this.add.graphics();
        ammo.fillStyle(0x888844);
        ammo.fillRect(0, 0, 16, 12);
        ammo.fillStyle(0xcccc66);
        ammo.fillRect(2, 2, 4, 8);
        ammo.fillRect(7, 2, 4, 8);
        ammo.generateTexture('ammoPack', 16, 12);
        ammo.destroy();

        // Key card
        const keycard = this.add.graphics();
        keycard.fillStyle(0x4444ff);
        keycard.fillRoundedRect(0, 0, 20, 12, 2);
        keycard.fillStyle(0xffffff);
        keycard.fillRect(4, 4, 8, 4);
        keycard.generateTexture('keycard', 20, 12);
        keycard.destroy();

        // Flashlight cone (for lighting effect)
        const lightMask = this.add.graphics();
        lightMask.fillStyle(0xffffff, 0.3);
        lightMask.slice(64, 64, 200, Phaser.Math.DegToRad(-30), Phaser.Math.DegToRad(30), false);
        lightMask.fillPath();
        lightMask.generateTexture('flashlight', 264, 128);
        lightMask.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = 400;

        this.add.text(centerX, 100, 'LOST OUTPOST', {
            fontSize: '56px',
            fill: '#44aaff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 160, 'Survival Horror', {
            fontSize: '20px',
            fill: '#448866',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const story = [
            'Haven Station has gone dark.',
            'Responding to a distress signal,',
            'you find an alien infestation.',
            '',
            'Fight through 5 levels.',
            'Find weapons. Survive.',
            'Kill the Hive Commander.'
        ];

        story.forEach((text, i) => {
            this.add.text(centerX, 220 + i * 26, text, {
                fontSize: '16px',
                fill: '#888',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const controls = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'R - Reload',
            '1-4 - Switch Weapons',
            'SPACE - Interact'
        ];

        controls.forEach((text, i) => {
            this.add.text(centerX, 440 + i * 22, text, {
                fontSize: '14px',
                fill: '#666',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 580, '[ BEGIN MISSION ]', {
            fontSize: '28px',
            fill: '#44ff44',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#44ff44'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene', { level: 1 }));

        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene', { level: 1 }));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentLevel = data.level || 1;
    }

    create() {
        // Level data
        this.levelData = [
            { name: 'ARRIVAL', enemies: 5, hasKeycard: true, hasBoss: false },
            { name: 'ENGINEERING', enemies: 14, hasKeycard: true, hasBoss: false },
            { name: 'MEDICAL BAY', enemies: 15, hasKeycard: true, hasBoss: false },
            { name: 'CARGO HOLD', enemies: 20, hasKeycard: true, hasBoss: false },
            { name: 'HIVE CORE', enemies: 10, hasKeycard: false, hasBoss: true }
        ];

        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.credits = 0;
        this.hasKeycard = false;

        // Weapons
        this.weapons = [
            { name: 'Assault Rifle', damage: 15, fireRate: 150, magSize: 30, ammo: 300, spread: 0.05, unlocked: true },
            { name: 'SMG', damage: 8, fireRate: 80, magSize: 45, ammo: 200, spread: 0.1, unlocked: this.currentLevel >= 2 },
            { name: 'Shotgun', damage: 8, pellets: 6, fireRate: 500, magSize: 8, ammo: 50, spread: 0.3, unlocked: this.currentLevel >= 3 },
            { name: 'Flamethrower', damage: 5, fireRate: 50, magSize: 100, ammo: 200, spread: 0.2, flame: true, unlocked: this.currentLevel >= 4 }
        ];
        this.currentWeapon = 0;
        this.currentMag = this.weapons[0].magSize;
        this.lastFire = 0;
        this.reloading = false;

        // Create level
        this.createLevel();

        // Player
        this.player = this.physics.add.sprite(100, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.playerSpeed = 180;

        // Groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Spawn enemies
        this.spawnEnemies();

        // UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

        this.input.on('pointerdown', () => this.shooting = true);
        this.input.on('pointerup', () => this.shooting = false);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.bullets, this.walls, (b) => b.destroy(), null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.doors, this.checkDoor, null, this);

        // Darkness overlay
        this.createDarkness();
    }

    createLevel() {
        const level = this.levelData[this.currentLevel - 1];

        // Room dimensions
        const roomWidth = 25;
        const roomHeight = 19;
        const tileSize = 32;

        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();

        // Generate simple level layout
        for (let y = 0; y < roomHeight; y++) {
            for (let x = 0; x < roomWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;

                // Walls on edges
                if (x === 0 || x === roomWidth - 1 || y === 0 || y === roomHeight - 1) {
                    // Door on right side
                    if (x === roomWidth - 1 && y === Math.floor(roomHeight / 2)) {
                        const door = this.doors.create(worldX, worldY, 'door');
                        door.isExit = true;
                    } else {
                        this.walls.create(worldX, worldY, 'wall');
                    }
                } else {
                    // Floor tiles
                    this.add.sprite(worldX, worldY, 'floor');

                    // Random internal walls
                    if (Math.random() < 0.08 && x > 3 && x < roomWidth - 3) {
                        this.walls.create(worldX, worldY, 'wall');
                    }
                }
            }
        }

        // Spawn keycard if needed
        if (level.hasKeycard) {
            const kx = Phaser.Math.Between(300, 600);
            const ky = Phaser.Math.Between(150, 450);
            const keycard = this.pickups.create(kx, ky, 'keycard');
            keycard.pickupType = 'keycard';
        }

        // Spawn some health and ammo
        for (let i = 0; i < 3; i++) {
            const hx = Phaser.Math.Between(150, 650);
            const hy = Phaser.Math.Between(100, 500);
            const hp = this.pickups.create(hx, hy, 'health');
            hp.pickupType = 'health';
        }

        for (let i = 0; i < 4; i++) {
            const ax = Phaser.Math.Between(150, 650);
            const ay = Phaser.Math.Between(100, 500);
            const am = this.pickups.create(ax, ay, 'ammoPack');
            am.pickupType = 'ammo';
        }
    }

    spawnEnemies() {
        const level = this.levelData[this.currentLevel - 1];
        const count = level.enemies;

        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(300, 700);
            const y = Phaser.Math.Between(100, 500);

            let type;
            const roll = Math.random();

            if (roll < 0.5) {
                type = 'scorpion';
            } else if (roll < 0.75 || this.currentLevel < 2) {
                type = 'scorpionLaser';
            } else {
                type = 'arachnid';
            }

            this.spawnEnemy(x, y, type);
        }

        // Boss on level 5
        if (level.hasBoss) {
            this.spawnBoss();
        }
    }

    spawnEnemy(x, y, type) {
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;
        enemy.lastFire = 0;
        enemy.lastMove = 0;

        switch (type) {
            case 'scorpion':
                enemy.health = 30;
                enemy.speed = 80;
                enemy.damage = 10;
                enemy.ranged = false;
                break;
            case 'scorpionLaser':
                enemy.health = 25;
                enemy.speed = 50;
                enemy.damage = 15;
                enemy.ranged = true;
                enemy.fireRate = 2000;
                break;
            case 'arachnid':
                enemy.health = 60;
                enemy.speed = 60;
                enemy.damage = 20;
                enemy.ranged = false;
                break;
        }

        // Scale by level
        const scale = 1 + (this.currentLevel - 1) * 0.1;
        enemy.health *= scale;
        enemy.damage *= scale;
    }

    spawnBoss() {
        const boss = this.enemies.create(600, 300, 'boss');
        boss.enemyType = 'boss';
        boss.isBoss = true;
        boss.health = 500;
        boss.maxHealth = 500;
        boss.speed = 40;
        boss.damage = 30;
        boss.lastFire = 0;
        boss.lastSpawn = 0;
        boss.phase = 1;

        // Boss health bar
        this.bossHealthBar = this.add.rectangle(400, 50, 300, 20, 0xff4444).setDepth(100);
        this.bossHealthBarBg = this.add.rectangle(400, 50, 300, 20, 0x333333).setDepth(99);
        this.add.text(400, 30, 'HIVE COMMANDER', {
            fontSize: '14px',
            fill: '#ff4444'
        }).setOrigin(0.5).setDepth(100);
    }

    createUI() {
        // Health bar
        this.add.rectangle(100, 570, 150, 20, 0x333333).setDepth(100);
        this.healthBar = this.add.rectangle(100, 570, 150, 20, 0x44ff44).setDepth(101);
        this.add.text(25, 560, 'HP', { fontSize: '12px', fill: '#888' }).setDepth(100);

        // Lives
        this.livesText = this.add.text(20, 20, 'LIVES: 3', {
            fontSize: '16px',
            fill: '#ff4444'
        }).setDepth(100);

        // Level name
        const level = this.levelData[this.currentLevel - 1];
        this.add.text(400, 20, `LEVEL ${this.currentLevel}: ${level.name}`, {
            fontSize: '18px',
            fill: '#44aaff'
        }).setOrigin(0.5).setDepth(100);

        // Weapon info
        this.weaponText = this.add.text(700, 560, '', {
            fontSize: '14px',
            fill: '#fff'
        }).setDepth(100);

        this.ammoText = this.add.text(700, 580, '', {
            fontSize: '14px',
            fill: '#ffaa44'
        }).setDepth(100);

        // Keycard indicator
        this.keycardText = this.add.text(400, 560, '', {
            fontSize: '14px',
            fill: '#4444ff'
        }).setOrigin(0.5).setDepth(100);

        this.updateUI();
    }

    createDarkness() {
        // Simple darkness effect - darken edges
        this.darkness = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.4).setDepth(50);
    }

    update(time, delta) {
        this.handleInput(time);
        this.updateEnemies(time);
        this.updateUI();
    }

    handleInput(time) {
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

        // Aim at mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.setRotation(angle);

        // Shooting
        if (this.shooting && !this.reloading) {
            this.fire(time);
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.reloadKey)) {
            this.reload();
        }

        // Weapon switching
        if (Phaser.Input.Keyboard.JustDown(this.key1)) this.switchWeapon(0);
        if (Phaser.Input.Keyboard.JustDown(this.key2) && this.weapons[1].unlocked) this.switchWeapon(1);
        if (Phaser.Input.Keyboard.JustDown(this.key3) && this.weapons[2].unlocked) this.switchWeapon(2);
        if (Phaser.Input.Keyboard.JustDown(this.key4) && this.weapons[3].unlocked) this.switchWeapon(3);
    }

    fire(time) {
        const weapon = this.weapons[this.currentWeapon];

        if (time - this.lastFire < weapon.fireRate) return;
        if (this.currentMag <= 0) {
            this.reload();
            return;
        }

        this.lastFire = time;
        this.currentMag--;

        const pointer = this.input.activePointer;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const angle = baseAngle + spread;

            const texture = weapon.flame ? 'flame' : (weapon.pellets ? 'pellet' : 'bullet');
            const bullet = this.bullets.create(this.player.x, this.player.y, texture);

            const speed = weapon.flame ? 300 : 500;
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            bullet.damage = weapon.damage;
            bullet.setRotation(angle);

            const lifetime = weapon.flame ? 500 : 2000;
            this.time.delayedCall(lifetime, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    reload() {
        if (this.reloading) return;

        const weapon = this.weapons[this.currentWeapon];
        if (this.currentMag >= weapon.magSize) return;
        if (weapon.ammo <= 0) return;

        this.reloading = true;

        this.time.delayedCall(1000, () => {
            const needed = weapon.magSize - this.currentMag;
            const available = Math.min(needed, weapon.ammo);
            this.currentMag += available;
            weapon.ammo -= available;
            this.reloading = false;
        });
    }

    switchWeapon(index) {
        if (this.currentWeapon === index) return;
        if (!this.weapons[index].unlocked) return;

        this.currentWeapon = index;
        this.currentMag = Math.min(this.currentMag, this.weapons[index].magSize);
        this.reloading = false;
    }

    updateEnemies(time) {
        this.enemies.children.iterate((enemy) => {
            if (!enemy || !enemy.active) return;

            if (enemy.isBoss) {
                this.updateBoss(enemy, time);
            } else {
                this.updateRegularEnemy(enemy, time);
            }
        });
    }

    updateRegularEnemy(enemy, time) {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Movement
        if (enemy.ranged) {
            // Keep distance
            if (dist > 200) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else if (dist < 150) {
                enemy.setVelocity(-Math.cos(angle) * enemy.speed, -Math.sin(angle) * enemy.speed);
            } else {
                enemy.setVelocity(0, 0);

                // Fire
                if (time - enemy.lastFire > enemy.fireRate) {
                    enemy.lastFire = time;
                    const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyLaser');
                    bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
                    bullet.setRotation(angle);
                    this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
                }
            }
        } else {
            // Chase
            if (dist > 30) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else {
                enemy.setVelocity(0, 0);
            }
        }

        enemy.setRotation(angle);
    }

    updateBoss(boss, time) {
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);

        // Update health bar
        if (this.bossHealthBar) {
            const healthPercent = boss.health / boss.maxHealth;
            this.bossHealthBar.width = 300 * healthPercent;
        }

        // Phase 2 at 50%
        if (boss.health < boss.maxHealth * 0.5 && boss.phase === 1) {
            boss.phase = 2;
            boss.speed = 60;
        }

        // Movement
        if (dist > 100) {
            boss.setVelocity(Math.cos(angle) * boss.speed, Math.sin(angle) * boss.speed);
        } else {
            boss.setVelocity(0, 0);
        }

        // Spawn minions
        if (time - boss.lastSpawn > 10000) {
            boss.lastSpawn = time;
            this.spawnEnemy(boss.x + 50, boss.y, 'scorpion');
            this.spawnEnemy(boss.x - 50, boss.y, 'scorpion');
        }

        // Phase 2: Ranged attack
        if (boss.phase === 2 && time - boss.lastFire > 1500) {
            boss.lastFire = time;

            for (let i = -2; i <= 2; i++) {
                const a = angle + i * 0.2;
                const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyLaser');
                bullet.setScale(1.5);
                bullet.setVelocity(Math.cos(a) * 180, Math.sin(a) * 180);
                this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
            }
        }

        boss.setRotation(angle);
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy();

        enemy.health -= bullet.damage;

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Particles
        for (let i = 0; i < 6; i++) {
            const p = this.add.circle(enemy.x, enemy.y, 3, 0x44ff44);
            this.tweens.add({
                targets: p,
                x: enemy.x + Phaser.Math.Between(-40, 40),
                y: enemy.y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        // Credits
        this.credits += enemy.isBoss ? 500 : 50;

        // Boss killed
        if (enemy.isBoss) {
            if (this.bossHealthBar) {
                this.bossHealthBar.destroy();
                this.bossHealthBarBg.destroy();
            }
        }

        enemy.destroy();
    }

    playerHitByBullet(player, bullet) {
        bullet.destroy();
        this.takeDamage(15);
    }

    playerTouchEnemy(player, enemy) {
        this.takeDamage(enemy.damage);

        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    takeDamage(amount) {
        this.health -= amount;

        this.player.setTint(0xff4444);
        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });

        this.cameras.main.shake(100, 0.01);

        if (this.health <= 0) {
            this.loseLife();
        }
    }

    loseLife() {
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn
            this.health = this.maxHealth;
            this.player.setPosition(100, 300);
        }
    }

    collectPickup(player, pickup) {
        switch (pickup.pickupType) {
            case 'health':
                this.health = Math.min(this.health + 30, this.maxHealth);
                break;
            case 'ammo':
                this.weapons[this.currentWeapon].ammo += 50;
                break;
            case 'keycard':
                this.hasKeycard = true;
                break;
        }
        pickup.destroy();
    }

    checkDoor(player, door) {
        if (!door.isExit) return;

        const level = this.levelData[this.currentLevel - 1];

        // Need keycard?
        if (level.hasKeycard && !this.hasKeycard) {
            return;
        }

        // Need to kill all enemies?
        if (this.enemies.countActive() > 0) {
            return;
        }

        // Level complete!
        this.levelComplete();
    }

    updateUI() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.width = 150 * healthPercent;
        this.healthBar.fillColor = healthPercent > 0.5 ? 0x44ff44 : (healthPercent > 0.25 ? 0xffff44 : 0xff4444);

        this.livesText.setText(`LIVES: ${this.lives}`);

        const weapon = this.weapons[this.currentWeapon];
        this.weaponText.setText(weapon.name);
        this.ammoText.setText(`${this.currentMag}/${weapon.magSize} [${weapon.ammo}]`);

        const level = this.levelData[this.currentLevel - 1];
        if (level.hasKeycard) {
            this.keycardText.setText(this.hasKeycard ? 'KEYCARD: YES' : 'KEYCARD: FIND IT');
        } else {
            this.keycardText.setText('');
        }
    }

    levelComplete() {
        if (this.currentLevel >= 5) {
            this.victory();
        } else {
            this.scene.start('LevelCompleteScene', {
                level: this.currentLevel,
                credits: this.credits
            });
        }
    }

    gameOver() {
        this.scene.start('GameOverScene', { victory: false, level: this.currentLevel });
    }

    victory() {
        this.scene.start('GameOverScene', { victory: true, level: this.currentLevel });
    }
}

class LevelCompleteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelCompleteScene' });
    }

    init(data) {
        this.level = data.level;
        this.credits = data.credits;
    }

    create() {
        const centerX = 400;

        this.add.text(centerX, 150, 'LEVEL COMPLETE', {
            fontSize: '48px',
            fill: '#44ff44',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(centerX, 220, `Credits earned: ${this.credits}`, {
            fontSize: '20px',
            fill: '#ffaa44'
        }).setOrigin(0.5);

        // Weapon unlock message
        const unlocks = ['', 'SMG unlocked!', 'Shotgun unlocked!', 'Flamethrower unlocked!'];
        if (this.level < 4) {
            this.add.text(centerX, 280, unlocks[this.level], {
                fontSize: '24px',
                fill: '#44aaff'
            }).setOrigin(0.5);
        }

        const continueBtn = this.add.text(centerX, 400, '[ CONTINUE ]', {
            fontSize: '32px',
            fill: '#44ff44'
        }).setOrigin(0.5).setInteractive();

        continueBtn.on('pointerover', () => continueBtn.setFill('#88ff88'));
        continueBtn.on('pointerout', () => continueBtn.setFill('#44ff44'));
        continueBtn.on('pointerdown', () => this.scene.start('GameScene', { level: this.level + 1 }));
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory;
        this.level = data.level;
    }

    create() {
        const centerX = 400;

        if (this.victory) {
            this.add.text(centerX, 150, 'MISSION COMPLETE', {
                fontSize: '48px',
                fill: '#44ff44',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, 'The Hive Commander is dead!', {
                fontSize: '24px',
                fill: '#88ff88'
            }).setOrigin(0.5);

            this.add.text(centerX, 280, 'Haven Station is secure... for now.', {
                fontSize: '18px',
                fill: '#888'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 150, 'MISSION FAILED', {
                fontSize: '48px',
                fill: '#ff4444',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, `Died on Level ${this.level}`, {
                fontSize: '24px',
                fill: '#ff8888'
            }).setOrigin(0.5);
        }

        const restartBtn = this.add.text(centerX, 400, '[ TRY AGAIN ]', {
            fontSize: '28px',
            fill: '#ff8844'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#ffaa66'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#ff8844'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene', { level: 1 }));

        const menuBtn = this.add.text(centerX, 460, '[ MAIN MENU ]', {
            fontSize: '20px',
            fill: '#888'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setFill('#aaa'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0f',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, LevelCompleteScene, GameOverScene]
};

const game = new Phaser.Game(config);
