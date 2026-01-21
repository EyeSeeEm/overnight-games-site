// Pirateers - Naval Combat Adventure
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Player ship
        const ship = this.add.graphics();
        ship.fillStyle(0x8b4513);
        ship.fillTriangle(24, 4, 12, 40, 36, 40);
        ship.fillStyle(0xffffff);
        ship.fillTriangle(24, 8, 20, 28, 28, 28);
        ship.generateTexture('playerShip', 48, 44);
        ship.destroy();

        // Merchant ship
        const merchant = this.add.graphics();
        merchant.fillStyle(0x666666);
        merchant.fillTriangle(20, 4, 8, 36, 32, 36);
        merchant.fillStyle(0xcccccc);
        merchant.fillTriangle(20, 8, 14, 26, 26, 26);
        merchant.generateTexture('merchantShip', 40, 40);
        merchant.destroy();

        // Navy ship
        const navy = this.add.graphics();
        navy.fillStyle(0x2244aa);
        navy.fillTriangle(20, 4, 8, 36, 32, 36);
        navy.fillStyle(0xffffff);
        navy.fillTriangle(20, 8, 14, 26, 26, 26);
        navy.generateTexture('navyShip', 40, 40);
        navy.destroy();

        // Pirate raider
        const raider = this.add.graphics();
        raider.fillStyle(0x333333);
        raider.fillTriangle(22, 4, 8, 38, 36, 38);
        raider.fillStyle(0x111111);
        raider.fillTriangle(22, 8, 14, 26, 30, 26);
        raider.generateTexture('raiderShip', 44, 42);
        raider.destroy();

        // Pirate captain (boss)
        const captain = this.add.graphics();
        captain.fillStyle(0x440000);
        captain.fillTriangle(28, 4, 8, 48, 48, 48);
        captain.fillStyle(0x880000);
        captain.fillTriangle(28, 8, 16, 32, 40, 32);
        captain.fillStyle(0xffffff);
        captain.fillCircle(28, 20, 6);
        captain.generateTexture('captainShip', 56, 52);
        captain.destroy();

        // Cannonball
        const cannonball = this.add.graphics();
        cannonball.fillStyle(0x333333);
        cannonball.fillCircle(4, 4, 4);
        cannonball.generateTexture('cannonball', 8, 8);
        cannonball.destroy();

        // Water tile
        const water = this.add.graphics();
        water.fillStyle(0x2a5a8a);
        water.fillRect(0, 0, 64, 64);
        water.fillStyle(0x3a6a9a);
        water.fillCircle(20, 20, 8);
        water.fillCircle(50, 40, 6);
        water.generateTexture('water', 64, 64);
        water.destroy();

        // Island
        const island = this.add.graphics();
        island.fillStyle(0x8b7355);
        island.fillCircle(40, 40, 35);
        island.fillStyle(0x6a9a5a);
        island.fillCircle(40, 35, 25);
        island.fillStyle(0x228b22);
        island.fillCircle(35, 30, 10);
        island.fillCircle(45, 35, 8);
        island.generateTexture('island', 80, 80);
        island.destroy();

        // Port
        const port = this.add.graphics();
        port.fillStyle(0x8b4513);
        port.fillRect(10, 30, 60, 30);
        port.fillStyle(0x666666);
        port.fillRect(20, 20, 40, 15);
        port.fillStyle(0xffaa00);
        port.fillCircle(40, 12, 8);
        port.generateTexture('port', 80, 60);
        port.destroy();

        // Cargo crate
        const crate = this.add.graphics();
        crate.fillStyle(0x8b4513);
        crate.fillRect(0, 0, 16, 16);
        crate.fillStyle(0x654321);
        crate.fillRect(6, 0, 4, 16);
        crate.fillRect(0, 6, 16, 4);
        crate.generateTexture('crate', 16, 16);
        crate.destroy();

        // Gold coin
        const coin = this.add.graphics();
        coin.fillStyle(0xffd700);
        coin.fillCircle(6, 6, 6);
        coin.fillStyle(0xffee88);
        coin.fillCircle(6, 5, 3);
        coin.generateTexture('coin', 12, 12);
        coin.destroy();

        // Particle
        const particle = this.add.graphics();
        particle.fillStyle(0xffffff);
        particle.fillCircle(2, 2, 2);
        particle.generateTexture('particle', 4, 4);
        particle.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = 480;

        this.add.text(centerX, 100, 'PIRATEERS', {
            fontSize: '64px',
            fill: '#ffd700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 160, 'Naval Combat Adventure', {
            fontSize: '20px',
            fill: '#8b7355',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const instructions = [
            'WASD/Arrows - Navigate ship',
            'SPACE - Fire cannons (broadside)',
            '',
            'Sail the seas, defeat enemies,',
            'collect cargo and gold.',
            'Trade at ports, upgrade your ship.',
            '',
            'Find and defeat the Pirate Captain to win!',
            '',
            'Dock at ports (sail close, press E)'
        ];

        instructions.forEach((text, i) => {
            this.add.text(centerX, 220 + i * 26, text, {
                fontSize: '16px',
                fill: '#aaddff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 530, '[ SET SAIL ]', {
            fontSize: '32px',
            fill: '#ffd700',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ffee88'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffd700'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // World dimensions
        this.worldWidth = 3000;
        this.worldHeight = 3000;

        // Player stats
        this.gold = 100;
        this.armor = 100;
        this.maxArmor = 100;

        // Ship stats (upgradeable)
        this.stats = {
            armor: 1,
            speed: 1,
            reload: 1,
            firepower: 1
        };

        // Cargo
        this.cargo = [];
        this.maxCargo = 15;

        // Day timer (120 seconds)
        this.dayTime = 120;
        this.day = 1;

        // Boss defeated
        this.bossDefeated = false;

        // Port state
        this.inPort = false;

        // Create ocean
        this.createOcean();

        // Create islands and ports
        this.islands = [];
        this.ports = [];
        this.createIslandsAndPorts();

        // Player ship
        this.player = this.physics.add.sprite(this.worldWidth / 2, this.worldHeight / 2, 'playerShip');
        this.player.setCollideWorldBounds(true);
        this.playerSpeed = 0;
        this.maxSpeed = 150 + this.stats.speed * 15;
        this.turnRate = 100;
        this.lastFire = 0;
        this.reloadTime = 2000 - this.stats.reload * 150;

        // Groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Spawn enemies
        this.spawnEnemies();

        // Camera
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);

        // Physics bounds
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.shipCollision, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Day timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.inPort) {
                    this.dayTime--;
                    if (this.dayTime <= 0) {
                        this.endDay();
                    }
                }
            },
            loop: true
        });
    }

    createOcean() {
        // Tile the ocean
        for (let x = 0; x < this.worldWidth; x += 64) {
            for (let y = 0; y < this.worldHeight; y += 64) {
                this.add.sprite(x + 32, y + 32, 'water');
            }
        }
    }

    createIslandsAndPorts() {
        // Create several islands with ports
        const islandPositions = [
            { x: 500, y: 500 },
            { x: 2500, y: 500 },
            { x: 500, y: 2500 },
            { x: 2500, y: 2500 },
            { x: 1500, y: 800 },
            { x: 800, y: 1500 },
            { x: 2200, y: 1500 },
            { x: 1500, y: 2200 }
        ];

        islandPositions.forEach((pos, i) => {
            const island = this.add.sprite(pos.x, pos.y, 'island').setScale(1.5);
            this.islands.push(island);

            // Add port to most islands
            if (i < 6) {
                const port = this.add.sprite(pos.x + 60, pos.y + 40, 'port');
                port.portName = ['Port Royal', 'Tortuga', 'Nassau', 'Havana', 'Kingston', 'Santiago'][i];
                port.prices = {
                    rum: Phaser.Math.Between(10, 20),
                    spices: Phaser.Math.Between(20, 35),
                    silk: Phaser.Math.Between(35, 55),
                    gold: Phaser.Math.Between(60, 100)
                };
                this.ports.push(port);
            }
        });
    }

    spawnEnemies() {
        // Spawn various enemies
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);

            // Avoid spawning near center (player start)
            if (Math.abs(x - this.worldWidth / 2) < 400 && Math.abs(y - this.worldHeight / 2) < 400) {
                continue;
            }

            const roll = Math.random();
            let type;
            if (roll < 0.4) type = 'merchant';
            else if (roll < 0.7) type = 'navy';
            else if (roll < 0.95) type = 'raider';
            else type = 'captain';

            this.spawnEnemy(x, y, type);
        }
    }

    spawnEnemy(x, y, type) {
        let texture;
        switch (type) {
            case 'merchant': texture = 'merchantShip'; break;
            case 'navy': texture = 'navyShip'; break;
            case 'raider': texture = 'raiderShip'; break;
            case 'captain': texture = 'captainShip'; break;
        }

        const enemy = this.enemies.create(x, y, texture);
        enemy.enemyType = type;
        enemy.lastFire = 0;
        enemy.angle = Phaser.Math.Between(0, 360);

        switch (type) {
            case 'merchant':
                enemy.health = 50;
                enemy.speed = 60;
                enemy.damage = 5;
                enemy.goldDrop = Phaser.Math.Between(20, 40);
                enemy.cargoDrop = 3;
                break;
            case 'navy':
                enemy.health = 80;
                enemy.speed = 100;
                enemy.damage = 12;
                enemy.goldDrop = Phaser.Math.Between(30, 50);
                enemy.cargoDrop = 2;
                break;
            case 'raider':
                enemy.health = 100;
                enemy.speed = 120;
                enemy.damage = 15;
                enemy.goldDrop = Phaser.Math.Between(40, 70);
                enemy.cargoDrop = 3;
                break;
            case 'captain':
                enemy.health = 200;
                enemy.maxHealth = 200;
                enemy.speed = 90;
                enemy.damage = 25;
                enemy.goldDrop = Phaser.Math.Between(100, 150);
                enemy.cargoDrop = 5;
                enemy.isBoss = true;
                break;
        }

        enemy.setRotation(Phaser.Math.DegToRad(enemy.angle));
    }

    createUI() {
        // HUD container (fixed to camera)
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Health bar background
        this.uiContainer.add(this.add.rectangle(120, 30, 200, 20, 0x333333).setScrollFactor(0));
        // Health bar
        this.healthBar = this.add.rectangle(120, 30, 200, 20, 0x44ff44).setScrollFactor(0);
        this.uiContainer.add(this.healthBar);
        this.uiContainer.add(this.add.text(20, 22, 'ARMOR', { fontSize: '12px', fill: '#888' }).setScrollFactor(0));

        // Speed indicator
        this.speedText = this.add.text(20, 50, 'SPEED: STOP', { fontSize: '14px', fill: '#88ddff' }).setScrollFactor(0);
        this.uiContainer.add(this.speedText);

        // Gold
        this.goldText = this.add.text(20, 580, 'GOLD: 100', { fontSize: '18px', fill: '#ffd700' }).setScrollFactor(0);
        this.uiContainer.add(this.goldText);

        // Cargo
        this.cargoText = this.add.text(20, 560, 'CARGO: 0/15', { fontSize: '14px', fill: '#aaa' }).setScrollFactor(0);
        this.uiContainer.add(this.cargoText);

        // Cargo preview
        this.cargoPreview = this.add.text(200, 580, '', { fontSize: '12px', fill: '#aaddff' }).setScrollFactor(0);
        this.uiContainer.add(this.cargoPreview);

        // Day timer
        this.dayText = this.add.text(850, 20, 'Day 1', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
        this.uiContainer.add(this.dayText);
        this.timerText = this.add.text(850, 45, '2:00', { fontSize: '16px', fill: '#ffaa44' }).setScrollFactor(0);
        this.uiContainer.add(this.timerText);

        // Controls hint
        this.uiContainer.add(this.add.text(700, 580, 'SPACE: Fire | E: Dock at port', { fontSize: '12px', fill: '#666' }).setScrollFactor(0));

        // Port menu (hidden initially)
        this.portMenu = this.add.container(480, 320).setScrollFactor(0).setDepth(200).setVisible(false);
        this.portMenu.add(this.add.rectangle(0, 0, 400, 300, 0x000000, 0.9));
        this.portMenuTitle = this.add.text(0, -120, 'PORT', { fontSize: '24px', fill: '#ffd700' }).setOrigin(0.5);
        this.portMenu.add(this.portMenuTitle);
    }

    update(time, delta) {
        if (this.inPort) {
            this.handlePortInput();
            return;
        }

        this.handleInput(time, delta);
        this.updateEnemies(time);
        this.checkPortProximity();
        this.updateUI();
    }

    handleInput(time, delta) {
        // Turning
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.angle -= this.turnRate * delta / 1000;
        }
        if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.angle += this.turnRate * delta / 1000;
        }

        // Acceleration/deceleration
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.playerSpeed = Math.min(this.maxSpeed, this.playerSpeed + 200 * delta / 1000);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.playerSpeed = Math.max(0, this.playerSpeed - 200 * delta / 1000);
        } else {
            // Natural deceleration
            this.playerSpeed = Math.max(0, this.playerSpeed - 100 * delta / 1000);
        }

        // Apply velocity
        const rad = Phaser.Math.DegToRad(this.player.angle - 90);
        this.player.setVelocity(
            Math.cos(rad) * this.playerSpeed,
            Math.sin(rad) * this.playerSpeed
        );

        // Firing
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (time - this.lastFire > this.reloadTime) {
                this.fire(time);
            }
        }
    }

    fire(time) {
        this.lastFire = time;

        const damage = 10 + this.stats.firepower * 5;
        const rad = Phaser.Math.DegToRad(this.player.angle - 90);

        // Fire from both sides (broadside)
        [-90, 90].forEach(side => {
            const sideRad = Phaser.Math.DegToRad(this.player.angle + side - 90);

            for (let i = 0; i < 3; i++) {
                const spread = (i - 1) * 0.15;
                const angle = sideRad + spread;

                const bullet = this.bullets.create(this.player.x, this.player.y, 'cannonball');
                bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                bullet.damage = damage;

                this.time.delayedCall(2000, () => {
                    if (bullet.active) bullet.destroy();
                });
            }
        });
    }

    updateEnemies(time) {
        this.enemies.children.iterate((enemy) => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // AI behavior
            if (enemy.enemyType === 'merchant') {
                // Merchants flee
                if (dist < 300) {
                    const fleeAngle = angleToPlayer + Math.PI;
                    enemy.angle = Phaser.Math.RadToDeg(fleeAngle) + 90;
                }
            } else {
                // Combat ships approach
                if (dist > 200) {
                    enemy.angle = Phaser.Math.RadToDeg(angleToPlayer) + 90;
                } else if (dist < 100) {
                    // Broadside position
                    enemy.angle = Phaser.Math.RadToDeg(angleToPlayer + Math.PI / 2) + 90;
                }
            }

            // Movement
            const enemyRad = Phaser.Math.DegToRad(enemy.angle - 90);
            enemy.setVelocity(
                Math.cos(enemyRad) * enemy.speed,
                Math.sin(enemyRad) * enemy.speed
            );
            enemy.setRotation(Phaser.Math.DegToRad(enemy.angle - 90));

            // Enemy firing
            if (dist < 300 && enemy.enemyType !== 'merchant') {
                if (time - enemy.lastFire > 2000) {
                    enemy.lastFire = time;
                    this.enemyFire(enemy, angleToPlayer);
                }
            }

            // Boss health bar
            if (enemy.isBoss) {
                this.updateBossHealthBar(enemy);
            }
        });
    }

    enemyFire(enemy, angle) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'cannonball');
        bullet.setTint(0xff4444);
        bullet.damage = enemy.damage;
        bullet.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

        this.time.delayedCall(3000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateBossHealthBar(boss) {
        if (!this.bossHealthBar) {
            this.bossHealthBar = this.add.rectangle(480, 50, 300, 16, 0xff4444).setScrollFactor(0).setDepth(100);
            this.bossHealthBarBg = this.add.rectangle(480, 50, 300, 16, 0x333333).setScrollFactor(0).setDepth(99);
            this.add.text(480, 30, 'PIRATE CAPTAIN', { fontSize: '14px', fill: '#ff4444' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        }

        const healthPercent = boss.health / boss.maxHealth;
        this.bossHealthBar.width = 300 * healthPercent;
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
        for (let i = 0; i < 8; i++) {
            const p = this.add.sprite(enemy.x, enemy.y, 'particle');
            p.setTint(0xff8844);
            this.tweens.add({
                targets: p,
                x: enemy.x + Phaser.Math.Between(-50, 50),
                y: enemy.y + Phaser.Math.Between(-50, 50),
                alpha: 0,
                duration: 500,
                onComplete: () => p.destroy()
            });
        }

        // Drop gold
        for (let i = 0; i < 3; i++) {
            const coin = this.pickups.create(
                enemy.x + Phaser.Math.Between(-30, 30),
                enemy.y + Phaser.Math.Between(-30, 30),
                'coin'
            );
            coin.pickupType = 'gold';
            coin.value = Math.floor(enemy.goldDrop / 3);
        }

        // Drop cargo
        const cargoTypes = ['rum', 'spices', 'silk', 'gold'];
        for (let i = 0; i < enemy.cargoDrop; i++) {
            const crate = this.pickups.create(
                enemy.x + Phaser.Math.Between(-40, 40),
                enemy.y + Phaser.Math.Between(-40, 40),
                'crate'
            );
            crate.pickupType = 'cargo';
            crate.cargoType = Phaser.Utils.Array.GetRandom(cargoTypes);
        }

        // Boss defeated
        if (enemy.isBoss) {
            this.bossDefeated = true;
            this.victory();
        }

        enemy.destroy();
    }

    playerHitByBullet(player, bullet) {
        bullet.destroy();
        this.takeDamage(bullet.damage);
    }

    shipCollision(player, enemy) {
        this.takeDamage(5);

        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    takeDamage(amount) {
        this.armor -= amount;

        this.cameras.main.shake(100, 0.01);

        if (this.armor <= 0) {
            this.armor = 0;
            this.shipDestroyed();
        }
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'gold') {
            this.gold += pickup.value;
        } else if (pickup.pickupType === 'cargo') {
            if (this.cargo.length < this.maxCargo) {
                this.cargo.push(pickup.cargoType);
            }
        }
        pickup.destroy();
    }

    checkPortProximity() {
        this.nearPort = null;

        this.ports.forEach(port => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, port.x, port.y);
            if (dist < 100) {
                this.nearPort = port;
            }
        });

        // Dock at port
        if (this.nearPort && Phaser.Input.Keyboard.JustDown(this.eKey)) {
            this.enterPort(this.nearPort);
        }
    }

    enterPort(port) {
        this.inPort = true;
        this.currentPort = port;
        this.playerSpeed = 0;
        this.player.setVelocity(0, 0);

        // Show port menu
        this.showPortMenu(port);
    }

    showPortMenu(port) {
        this.portMenu.setVisible(true);
        this.portMenuTitle.setText(port.portName);

        // Clear old buttons
        this.portMenu.list.filter(c => c.isButton).forEach(c => c.destroy());

        // Sell cargo button
        const sellBtn = this.add.text(0, -60, '[ SELL CARGO ]', {
            fontSize: '18px',
            fill: '#88ff88'
        }).setOrigin(0.5).setInteractive();
        sellBtn.isButton = true;
        sellBtn.on('pointerdown', () => this.sellCargo(port));
        this.portMenu.add(sellBtn);

        // Repair button
        const repairBtn = this.add.text(0, -20, '[ REPAIR (50g) ]', {
            fontSize: '18px',
            fill: '#ffaa44'
        }).setOrigin(0.5).setInteractive();
        repairBtn.isButton = true;
        repairBtn.on('pointerdown', () => this.repairShip());
        this.portMenu.add(repairBtn);

        // Upgrade buttons
        const stats = ['armor', 'speed', 'reload', 'firepower'];
        stats.forEach((stat, i) => {
            const cost = (this.stats[stat]) * 100;
            const btn = this.add.text(0, 30 + i * 30, `[ UPGRADE ${stat.toUpperCase()} (${cost}g) ]`, {
                fontSize: '14px',
                fill: '#88ddff'
            }).setOrigin(0.5).setInteractive();
            btn.isButton = true;
            btn.on('pointerdown', () => this.upgradeStat(stat));
            this.portMenu.add(btn);
        });

        // Leave button
        const leaveBtn = this.add.text(0, 160, '[ LEAVE PORT ]', {
            fontSize: '18px',
            fill: '#ff8888'
        }).setOrigin(0.5).setInteractive();
        leaveBtn.isButton = true;
        leaveBtn.on('pointerdown', () => this.leavePort());
        this.portMenu.add(leaveBtn);
    }

    sellCargo(port) {
        if (this.cargo.length === 0) return;

        let total = 0;
        this.cargo.forEach(item => {
            total += port.prices[item] || 15;
        });

        this.gold += total;
        this.cargo = [];
    }

    repairShip() {
        if (this.gold >= 50 && this.armor < this.maxArmor) {
            this.gold -= 50;
            this.armor = this.maxArmor;
        }
    }

    upgradeStat(stat) {
        const cost = (this.stats[stat]) * 100;
        if (this.gold >= cost && this.stats[stat] < 4) {
            this.gold -= cost;
            this.stats[stat]++;

            // Apply upgrade
            if (stat === 'armor') {
                this.maxArmor = 100 + this.stats.armor * 50;
                this.armor = this.maxArmor;
            } else if (stat === 'speed') {
                this.maxSpeed = 150 + this.stats.speed * 15;
            } else if (stat === 'reload') {
                this.reloadTime = 2000 - this.stats.reload * 150;
            }
        }
    }

    leavePort() {
        this.inPort = false;
        this.portMenu.setVisible(false);
    }

    handlePortInput() {
        // ESC to leave
        if (this.input.keyboard.addKey('ESC').isDown) {
            this.leavePort();
        }
    }

    updateUI() {
        // Health bar
        const healthPercent = this.armor / this.maxArmor;
        this.healthBar.width = 200 * healthPercent;
        this.healthBar.fillColor = healthPercent > 0.5 ? 0x44ff44 : (healthPercent > 0.25 ? 0xffff44 : 0xff4444);

        // Speed text
        const speedPercent = this.playerSpeed / this.maxSpeed;
        let speedLabel = 'STOP';
        if (speedPercent > 0.75) speedLabel = 'FULL';
        else if (speedPercent > 0.5) speedLabel = 'HALF';
        else if (speedPercent > 0.1) speedLabel = 'SLOW';
        this.speedText.setText(`SPEED: ${speedLabel}`);

        // Gold
        this.goldText.setText(`GOLD: ${this.gold}`);

        // Cargo
        this.cargoText.setText(`CARGO: ${this.cargo.length}/${this.maxCargo}`);

        // Cargo preview
        const cargoCounts = {};
        this.cargo.forEach(c => cargoCounts[c] = (cargoCounts[c] || 0) + 1);
        const preview = Object.entries(cargoCounts).map(([k, v]) => `${k}x${v}`).join(' ');
        this.cargoPreview.setText(preview);

        // Day and timer
        this.dayText.setText(`Day ${this.day}`);
        const mins = Math.floor(this.dayTime / 60);
        const secs = this.dayTime % 60;
        this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

        // Near port indicator
        if (this.nearPort) {
            this.cargoText.setText(`CARGO: ${this.cargo.length}/${this.maxCargo} - Press E to dock`);
        }
    }

    endDay() {
        this.day++;
        this.dayTime = 120;

        // Auto-heal some armor
        this.armor = Math.min(this.maxArmor, this.armor + 20);

        // Respawn some enemies
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);

            const roll = Math.random();
            let type;
            if (roll < 0.4) type = 'merchant';
            else if (roll < 0.7) type = 'navy';
            else type = 'raider';

            this.spawnEnemy(x, y, type);
        }
    }

    shipDestroyed() {
        // Lose 25% cargo
        const toRemove = Math.floor(this.cargo.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            this.cargo.pop();
        }

        // Reset armor and day
        this.armor = this.maxArmor;
        this.endDay();

        // Move back to center
        this.player.setPosition(this.worldWidth / 2, this.worldHeight / 2);
    }

    victory() {
        this.scene.start('GameOverScene', { victory: true, gold: this.gold, day: this.day });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory;
        this.gold = data.gold;
        this.day = data.day;
    }

    create() {
        const centerX = 480;

        if (this.victory) {
            this.add.text(centerX, 150, 'VICTORY!', {
                fontSize: '64px',
                fill: '#ffd700',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, 'You defeated the Pirate Captain!', {
                fontSize: '24px',
                fill: '#88ff88'
            }).setOrigin(0.5);

            this.add.text(centerX, 280, `Days: ${this.day} | Final Gold: ${this.gold}`, {
                fontSize: '18px',
                fill: '#aaa'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 150, 'GAME OVER', {
                fontSize: '64px',
                fill: '#ff4444',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        const restartBtn = this.add.text(centerX, 400, '[ PLAY AGAIN ]', {
            fontSize: '28px',
            fill: '#ffd700'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#ffee88'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#ffd700'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

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
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#1a3a5a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
