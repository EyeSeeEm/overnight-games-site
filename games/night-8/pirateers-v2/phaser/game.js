// Pirateers - Phaser 3 Implementation
// Top-Down Naval Combat Game

const COLORS = {
    ocean: 0x2a4a6a,
    oceanLight: 0x3a6a8a,
    sand: 0xd4b896,
    grass: 0x5a8a5a,
    wood: 0x8a6a4a,
    ship: 0xc4a060,
    enemy: 0xaa4444,
    merchant: 0x4a8a4a,
    navy: 0x4a4aaa,
    gold: 0xffcc00,
    health: 0x44aa44,
    healthLow: 0xaa4444
};

const MAP_SIZE = 3000;

const ISLANDS = [
    { x: 1500, y: 1500, radius: 0, name: 'Home', hasPort: true },
    { x: 800, y: 600, radius: 120, name: 'Tortuga', hasPort: true },
    { x: 2200, y: 500, radius: 100, name: 'Port Royal', hasPort: true },
    { x: 2400, y: 1800, radius: 90, name: 'Nassau', hasPort: true },
    { x: 600, y: 2000, radius: 110, name: 'Havana', hasPort: true },
    { x: 1800, y: 2400, radius: 80, name: 'Skull Isle', hasPort: false },
    { x: 400, y: 1200, radius: 60, name: 'Reef', hasPort: false }
];

const CARGO_TYPES = [
    { name: 'Rum', value: 15 },
    { name: 'Grain', value: 10 },
    { name: 'Spices', value: 30 },
    { name: 'Silk', value: 45 },
    { name: 'Gold', value: 80 }
];

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x1a3a5a);

        this.add.text(width / 2, 150, 'PIRATEERS', {
            fontSize: '64px',
            fontFamily: 'Georgia',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 220, 'Naval Combat Adventure', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Ship preview
        this.createShipPreview(width / 2, 340);

        const controls = ['WASD / Arrows - Sail', 'SPACE - Fire Cannons', 'E - Enter Port', 'ESC - Return Home'];
        controls.forEach((text, i) => {
            this.add.text(width / 2, 430 + i * 25, text, {
                fontSize: '16px',
                fontFamily: 'Georgia',
                color: '#ffffff'
            }).setOrigin(0.5);
        });

        this.startText = this.add.text(width / 2, 560, 'Click or Press SPACE to Set Sail', {
            fontSize: '28px',
            fontFamily: 'Georgia',
            color: '#ffcc00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.startText,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    }

    createShipPreview(x, y) {
        const ship = this.add.graphics();
        ship.setPosition(x, y);
        ship.fillStyle(COLORS.ship);
        ship.beginPath();
        ship.moveTo(30, 0);
        ship.lineTo(-20, -15);
        ship.lineTo(-20, 15);
        ship.closePath();
        ship.fillPath();

        ship.fillStyle(COLORS.wood);
        ship.fillRect(-10, -5, 8, 10);

        ship.fillStyle(0xffffff);
        ship.fillTriangle(-5, 0, 5, -20, -5, -25);
    }

    startGame() {
        this.scene.start('GameScene');
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.gameData = {
            day: 1,
            dayTimer: 120,
            gold: 200,
            cargo: [],
            cargoCapacity: 15,
            armorLevel: 1,
            speedLevel: 1,
            firepowerLevel: 1
        };
        this.debugMode = false;
    }

    create() {
        // Ocean background
        this.add.rectangle(MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE, MAP_SIZE, COLORS.ocean);

        // Wave patterns
        for (let x = 0; x < MAP_SIZE; x += 200) {
            for (let y = 0; y < MAP_SIZE; y += 200) {
                if ((x + y) % 400 === 0) {
                    this.add.rectangle(x + 100, y + 100, 200, 200, COLORS.oceanLight, 0.3);
                }
            }
        }

        // Create islands
        this.createIslands();

        // Create player
        this.createPlayer();

        // Groups
        this.enemies = this.physics.add.group();
        this.cannonballs = this.physics.add.group();
        this.lootDrops = this.physics.add.group();

        // Spawn enemies
        this.spawnEnemies();

        // Camera
        this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            upAlt: 'UP', downAlt: 'DOWN', leftAlt: 'LEFT', rightAlt: 'RIGHT',
            fire: 'SPACE', port: 'E', escape: 'ESC'
        });

        this.input.keyboard.on('keydown-Q', () => this.debugMode = !this.debugMode);
        this.input.keyboard.on('keydown-ESC', () => this.returnToPort());
        this.input.keyboard.on('keydown-E', () => this.checkPortInteraction());

        // Collisions
        this.physics.add.overlap(this.cannonballs, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.lootDrops, this.collectLoot, null, this);

        // UI scene
        this.scene.launch('UIScene', { gameScene: this });

        // Timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameData.dayTimer--;
                if (this.gameData.dayTimer <= 0) this.returnToPort();
            },
            loop: true
        });
    }

    createIslands() {
        ISLANDS.forEach(island => {
            if (island.radius > 0) {
                // Sand
                const sand = this.add.circle(island.x, island.y, island.radius, COLORS.sand);
                // Grass
                this.add.circle(island.x, island.y, island.radius * 0.6, COLORS.grass);

                // Port
                if (island.hasPort) {
                    this.add.rectangle(island.x, island.y + island.radius - 15, 30, 20, COLORS.wood);
                }
            }

            // Labels
            this.add.text(island.x, island.y - (island.radius || 30) - 15, island.name, {
                fontSize: '14px',
                fontFamily: 'Georgia',
                color: '#ffffff'
            }).setOrigin(0.5);

            if (island.hasPort) {
                this.add.text(island.x, island.y + (island.radius || 0) + 15, '⚓', {
                    fontSize: '16px'
                }).setOrigin(0.5);
            }
        });
    }

    createPlayer() {
        this.player = this.add.container(1500, 1500);

        // Ship body
        const body = this.add.graphics();
        body.fillStyle(COLORS.ship);
        body.beginPath();
        body.moveTo(25, 0);
        body.lineTo(-20, -12);
        body.lineTo(-20, 12);
        body.closePath();
        body.fillPath();

        // Mast
        body.fillStyle(COLORS.wood);
        body.fillRect(-8, -4, 6, 8);

        // Sail
        body.fillStyle(0xffffff);
        body.fillTriangle(-5, 0, 5, -15, -5, -20);

        this.player.add(body);

        // Physics
        this.physics.world.enable(this.player);
        this.player.body.setCircle(15);
        this.player.body.setOffset(-15, -15);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setMaxVelocity(150 + this.gameData.speedLevel * 20);
        this.player.body.setDrag(60);

        this.player.armor = 100 + this.gameData.armorLevel * 50;
        this.player.maxArmor = this.player.armor;
        this.player.speed = 0;
        this.player.lastShot = 0;
    }

    spawnEnemies() {
        const types = [
            { type: 'merchant', count: 12, hp: 50, speed: 60, damage: 5, gold: [20, 40], color: COLORS.merchant },
            { type: 'navy', count: 6, hp: 80, speed: 100, damage: 12, gold: [30, 50], color: COLORS.navy },
            { type: 'raider', count: 5, hp: 100, speed: 120, damage: 15, gold: [40, 70], color: COLORS.enemy },
            { type: 'captain', count: 1, hp: 250, speed: 90, damage: 25, gold: [100, 150], color: 0x880088 }
        ];

        types.forEach(cfg => {
            for (let i = 0; i < cfg.count; i++) {
                this.createEnemy(cfg);
            }
        });
    }

    createEnemy(cfg) {
        let x, y;
        do {
            x = 200 + Math.random() * (MAP_SIZE - 400);
            y = 200 + Math.random() * (MAP_SIZE - 400);
        } while (Phaser.Math.Distance.Between(x, y, 1500, 1500) < 400);

        const enemy = this.add.container(x, y);

        const body = this.add.graphics();
        body.fillStyle(cfg.color);
        body.beginPath();
        body.moveTo(20, 0);
        body.lineTo(-15, -10);
        body.lineTo(-15, 10);
        body.closePath();
        body.fillPath();
        body.fillStyle(COLORS.wood);
        body.fillRect(-6, -3, 5, 6);
        enemy.add(body);

        // HP bar
        const hpBg = this.add.rectangle(0, -25, 30, 5, 0x333333);
        const hpBar = this.add.rectangle(-15, -25, 30, 5, COLORS.health).setOrigin(0, 0.5);
        enemy.add(hpBg);
        enemy.add(hpBar);

        // Label
        const label = this.add.text(0, -35, cfg.type.toUpperCase(), {
            fontSize: '10px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);
        enemy.add(label);

        this.physics.world.enable(enemy);
        enemy.body.setCircle(15);
        enemy.body.setOffset(-15, -15);

        enemy.setData({
            type: cfg.type,
            hp: cfg.hp,
            maxHp: cfg.hp,
            speed: cfg.speed,
            damage: cfg.damage,
            goldDrop: cfg.gold,
            hpBar: hpBar,
            lastShot: 0,
            patrolAngle: Math.random() * Math.PI * 2
        });

        this.enemies.add(enemy);
    }

    update(time, delta) {
        const dt = delta / 1000;

        this.updatePlayer(dt, time);
        this.updateEnemies(dt, time);
        this.cleanupBullets();
        this.updateUI();
    }

    updatePlayer(dt, time) {
        const accel = 80;
        const turnRate = 2;

        // Turn
        if (this.cursors.left.isDown || this.cursors.leftAlt.isDown) {
            this.player.rotation -= turnRate * dt;
        }
        if (this.cursors.right.isDown || this.cursors.rightAlt.isDown) {
            this.player.rotation += turnRate * dt;
        }

        // Accelerate
        if (this.cursors.up.isDown || this.cursors.upAlt.isDown) {
            this.player.speed = Math.min(this.player.speed + accel * dt, 150 + this.gameData.speedLevel * 20);
        } else if (this.cursors.down.isDown || this.cursors.downAlt.isDown) {
            this.player.speed = Math.max(this.player.speed - accel * dt, 0);
        } else {
            this.player.speed = Math.max(0, this.player.speed - accel * 0.5 * dt);
        }

        // Apply velocity
        this.player.body.setVelocity(
            Math.cos(this.player.rotation) * this.player.speed,
            Math.sin(this.player.rotation) * this.player.speed
        );

        // Fire
        if (this.cursors.fire.isDown && time - this.player.lastShot > 2000) {
            this.playerShoot(time);
        }

        // Check game over
        if (this.player.armor <= 0) {
            this.scene.start('GameOverScene', { day: this.gameData.day, gold: this.gameData.gold });
        }
    }

    playerShoot(time) {
        this.player.lastShot = time;

        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 3; i++) {
                const spread = (i - 1) * 0.3;
                const angle = this.player.rotation + Math.PI / 2 * side + spread;

                const ball = this.add.circle(
                    this.player.x + Math.cos(angle) * 20,
                    this.player.y + Math.sin(angle) * 20,
                    4, 0x333333
                );

                this.physics.world.enable(ball);
                ball.body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                ball.setData('damage', 10 + this.gameData.firepowerLevel * 5);
                ball.setData('life', 60);
                this.cannonballs.add(ball);
            }
        }
    }

    updateEnemies(dt, time) {
        this.enemies.getChildren().forEach(enemy => {
            const data = enemy.data.values;
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (dist < 400 && data.type !== 'merchant') {
                // Attack
                const angleDiff = angle - enemy.rotation;
                enemy.rotation += Math.sign(Math.sin(angleDiff)) * 1.5 * dt;

                enemy.body.setVelocity(
                    Math.cos(enemy.rotation) * data.speed * 0.8,
                    Math.sin(enemy.rotation) * data.speed * 0.8
                );

                if (time - data.lastShot > 2000 && dist < 300) {
                    data.lastShot = time;
                    this.enemyShoot(enemy, angle);
                }
            } else {
                // Patrol
                data.patrolAngle += (Math.random() - 0.5) * dt;
                enemy.rotation += (data.patrolAngle - enemy.rotation) * 0.3 * dt;
                enemy.body.setVelocity(
                    Math.cos(enemy.rotation) * 30,
                    Math.sin(enemy.rotation) * 30
                );
            }

            // Update HP bar
            data.hpBar.scaleX = data.hp / data.maxHp;
        });
    }

    enemyShoot(enemy, angle) {
        const ball = this.add.circle(enemy.x, enemy.y, 4, 0x880000);
        this.physics.world.enable(ball);
        ball.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        ball.setData('damage', enemy.getData('damage'));
        ball.setData('isEnemy', true);
        ball.setData('life', 90);
        this.cannonballs.add(ball);
    }

    cleanupBullets() {
        this.cannonballs.getChildren().forEach(ball => {
            const life = ball.getData('life') - 1;
            ball.setData('life', life);

            if (life <= 0) {
                ball.destroy();
                return;
            }

            // Enemy bullets hitting player
            if (ball.getData('isEnemy')) {
                const dist = Phaser.Math.Distance.Between(ball.x, ball.y, this.player.x, this.player.y);
                if (dist < 20) {
                    this.player.armor -= ball.getData('damage');
                    ball.destroy();
                }
            }
        });
    }

    bulletHitEnemy(ball, enemy) {
        if (ball.getData('isEnemy')) return;

        const data = enemy.data.values;
        data.hp -= ball.getData('damage');
        ball.destroy();

        if (data.hp <= 0) {
            // Drop loot
            const gold = data.goldDrop[0] + Math.floor(Math.random() * (data.goldDrop[1] - data.goldDrop[0]));
            this.gameData.gold += gold;

            // Drop cargo
            for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
                this.dropLoot(enemy.x + (Math.random() - 0.5) * 40, enemy.y + (Math.random() - 0.5) * 40);
            }

            // Victory check
            if (data.type === 'captain') {
                this.scene.start('VictoryScene', { day: this.gameData.day, gold: this.gameData.gold });
            }

            enemy.destroy();
        }
    }

    dropLoot(x, y) {
        const crate = this.add.rectangle(x, y, 16, 16, COLORS.wood);
        this.physics.world.enable(crate);

        const item = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
        crate.setData('item', item);
        crate.setData('timer', 15);

        this.lootDrops.add(crate);

        this.tweens.add({
            targets: crate,
            y: y - 5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    collectLoot(player, crate) {
        if (this.gameData.cargo.length < this.gameData.cargoCapacity) {
            this.gameData.cargo.push(crate.getData('item'));
        }
        crate.destroy();
    }

    checkPortInteraction() {
        for (const island of ISLANDS) {
            if (!island.hasPort) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, island.x, island.y);
            if (dist < (island.radius || 80) + 80) {
                this.scene.pause();
                this.scene.launch('PortScene', { gameScene: this, port: island });
                return;
            }
        }
    }

    returnToPort() {
        this.player.x = 1500;
        this.player.y = 1500;
        this.player.armor = this.player.maxArmor;
        this.gameData.day++;
        this.gameData.dayTimer = 120;
        this.scene.pause();
        this.scene.launch('PortScene', { gameScene: this, port: ISLANDS[0] });
    }

    updateUI() {
        const ui = this.scene.get('UIScene');
        if (ui && ui.updateData) {
            ui.updateData(this.player, this.gameData, this.enemies.countActive());
        }
    }
}

// ==================== UI SCENE ====================
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Health panel
        this.add.rectangle(120, 50, 220, 90, 0x000000, 0.7);

        this.add.text(20, 20, 'ARMOR', { fontSize: '14px', fontFamily: 'Georgia', color: '#ffffff' });
        this.hpBarBg = this.add.rectangle(115, 42, 190, 15, 0x333333).setOrigin(0, 0.5);
        this.hpBar = this.add.rectangle(22, 42, 186, 13, COLORS.health).setOrigin(0, 0.5);
        this.hpText = this.add.text(115, 35, '100/100', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5, 0);

        this.speedText = this.add.text(20, 60, 'SPEED: 0', { fontSize: '12px', color: '#ffffff' });
        this.goldText = this.add.text(20, 80, 'GOLD: 0', { fontSize: '12px', color: '#ffcc00' });

        // Cargo
        this.add.rectangle(120, 135, 220, 45, 0x000000, 0.7);
        this.cargoText = this.add.text(20, 115, 'CARGO: 0/15', { fontSize: '12px', color: '#ffffff' });
        this.cargoItems = this.add.text(20, 135, '', { fontSize: '10px', color: '#aaaaaa' });

        // Day timer
        this.add.rectangle(880, 35, 150, 50, 0x000000, 0.7);
        this.dayText = this.add.text(940, 20, 'Day 1', { fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0);
        this.timerText = this.add.text(940, 40, 'Time: 120s', { fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0);

        // Mini-map
        this.minimap = this.add.rectangle(880, 560, 150, 150, 0x000000, 0.7);
        this.minimapGraphics = this.add.graphics();
    }

    updateData(player, gameData, enemyCount) {
        if (!player) return;

        const hpPercent = player.armor / player.maxArmor;
        this.hpBar.scaleX = hpPercent;
        this.hpBar.setFillStyle(hpPercent > 0.3 ? COLORS.health : COLORS.healthLow);
        this.hpText.setText(`${Math.ceil(player.armor)}/${player.maxArmor}`);

        this.speedText.setText(`SPEED: ${Math.round(player.speed)}`);
        this.goldText.setText(`GOLD: ${gameData.gold}`);
        this.cargoText.setText(`CARGO: ${gameData.cargo.length}/${gameData.cargoCapacity}`);

        const cargoStr = gameData.cargo.slice(0, 4).map(c => c.name.substring(0, 3)).join(' ');
        this.cargoItems.setText(cargoStr + (gameData.cargo.length > 4 ? '...' : ''));

        this.dayText.setText(`Day ${gameData.day}`);
        this.timerText.setText(`Time: ${gameData.dayTimer}s`);

        // Mini-map
        this.minimapGraphics.clear();
        const mmX = 805, mmY = 485, mmScale = 150 / MAP_SIZE;

        ISLANDS.forEach(island => {
            if (island.radius > 0) {
                this.minimapGraphics.fillStyle(COLORS.sand);
                this.minimapGraphics.fillCircle(mmX + island.x * mmScale, mmY + island.y * mmScale, 4);
            }
        });

        this.minimapGraphics.fillStyle(COLORS.gold);
        this.minimapGraphics.fillCircle(mmX + player.x * mmScale, mmY + player.y * mmScale, 3);
    }
}

// ==================== PORT SCENE ====================
class PortScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PortScene' });
    }

    init(data) {
        this.gameScene = data.gameScene;
        this.port = data.port;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x1a3a5a, 0.95);

        this.add.text(width / 2, 60, this.port.name, {
            fontSize: '36px',
            fontFamily: 'Georgia',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const gd = this.gameScene.gameData;
        this.goldText = this.add.text(width / 2, 110, `Gold: ${gd.gold}`, {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Sell cargo
        this.createButton(150, 180, 200, 50, 'SELL CARGO', () => this.sellCargo());

        // Repair
        this.createButton(150, 250, 200, 50, 'REPAIR SHIP', () => this.repair());

        // Upgrades
        this.add.text(150, 310, 'UPGRADES:', { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5);
        this.createButton(150, 350, 200, 40, `Armor Lv${gd.armorLevel}`, () => this.upgrade('armor'));
        this.createButton(150, 400, 200, 40, `Speed Lv${gd.speedLevel}`, () => this.upgrade('speed'));
        this.createButton(150, 450, 200, 40, `Firepower Lv${gd.firepowerLevel}`, () => this.upgrade('firepower'));

        // Cargo list
        this.add.text(500, 180, 'CARGO:', { fontSize: '18px', color: '#ffffff' });
        this.cargoList = this.add.text(500, 210, '', { fontSize: '14px', color: '#aaaaaa' });
        this.updateCargoList();

        // Set sail
        this.createButton(700, 550, 200, 60, 'SET SAIL', () => this.setSail());

        this.input.keyboard.on('keydown-ESC', () => this.setSail());
    }

    createButton(x, y, w, h, text, callback) {
        const btn = this.add.rectangle(x, y, w, h, 0x4a4a6a).setInteractive();
        this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.on('pointerdown', callback);
        btn.on('pointerover', () => btn.setFillStyle(COLORS.gold));
        btn.on('pointerout', () => btn.setFillStyle(0x4a4a6a));
    }

    sellCargo() {
        const gd = this.gameScene.gameData;
        let total = 0;
        gd.cargo.forEach(item => total += item.value);
        gd.gold += total;
        gd.cargo = [];
        this.goldText.setText(`Gold: ${gd.gold}`);
        this.updateCargoList();
    }

    repair() {
        const player = this.gameScene.player;
        const cost = Math.ceil((player.maxArmor - player.armor) * 0.5);
        if (this.gameScene.gameData.gold >= cost) {
            this.gameScene.gameData.gold -= cost;
            player.armor = player.maxArmor;
            this.goldText.setText(`Gold: ${this.gameScene.gameData.gold}`);
        }
    }

    upgrade(stat) {
        const gd = this.gameScene.gameData;
        const level = gd[stat + 'Level'];
        if (level >= 3) return;

        const cost = level * 150;
        if (gd.gold >= cost) {
            gd.gold -= cost;
            gd[stat + 'Level']++;
            this.goldText.setText(`Gold: ${gd.gold}`);

            if (stat === 'armor') {
                this.gameScene.player.maxArmor = 100 + gd.armorLevel * 50;
                this.gameScene.player.armor = this.gameScene.player.maxArmor;
            }
        }
    }

    updateCargoList() {
        const cargo = this.gameScene.gameData.cargo;
        if (cargo.length === 0) {
            this.cargoList.setText('(Empty)');
        } else {
            this.cargoList.setText(cargo.map(c => `${c.name} - ${c.value}g`).join('\n'));
        }
    }

    setSail() {
        this.scene.stop();
        this.scene.resume('GameScene');
    }
}

// ==================== GAME OVER SCENE ====================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.data = data;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

        this.add.text(width / 2, 200, 'SHIP SUNK!', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            color: '#aa4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 300, `Days: ${this.data.day}`, {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 350, `Gold: ${this.data.gold}`, {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#ffcc00'
        }).setOrigin(0.5);

        this.add.text(width / 2, 450, 'Press SPACE to try again', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// ==================== VICTORY SCENE ====================
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.data = data;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

        this.add.text(width / 2, 180, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 260, 'You defeated the Pirate Captain!', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 340, `Days: ${this.data.day}`, {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 380, `Gold: ${this.data.gold}`, {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#ffcc00'
        }).setOrigin(0.5);

        this.add.text(width / 2, 480, 'Press SPACE to play again', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// ==================== GAME CONFIG ====================
const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#1a2a3a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, UIScene, PortScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
