// Pirateers - Top-Down Naval Combat
const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;

// Map size
const MAP_SIZE = 3000;

// Ship stats
const SHIP_STATS = {
    armor: { base: 100, perLevel: 50 },
    speed: { base: 150, perLevel: 20 },
    reload: { base: 2000, perLevel: -150 },
    firepower: { base: 10, perLevel: 5 }
};

// Upgrade costs
const UPGRADE_COSTS = [100, 200, 350];

// Enemy definitions
const ENEMIES = {
    merchant: { hp: 50, speed: 60, damage: 5, gold: [20, 40], cargo: [2, 3], aggression: 0.2 },
    navySloop: { hp: 80, speed: 100, damage: 12, gold: [30, 50], cargo: [1, 2], aggression: 0.6 },
    pirateRaider: { hp: 100, speed: 120, damage: 15, gold: [40, 70], cargo: [2, 3], aggression: 0.8 },
    pirateCaptain: { hp: 250, speed: 90, damage: 25, gold: [100, 150], cargo: [4, 6], aggression: 1.0 }
};

// Cargo types
const CARGO_TYPES = [
    { name: 'Rum', value: 15, rarity: 'common' },
    { name: 'Fish', value: 10, rarity: 'common' },
    { name: 'Wood', value: 12, rarity: 'common' },
    { name: 'Spices', value: 30, rarity: 'uncommon' },
    { name: 'Silk', value: 45, rarity: 'uncommon' },
    { name: 'Gold Bars', value: 80, rarity: 'rare' },
    { name: 'Gems', value: 120, rarity: 'rare' }
];

// ========== BOOT SCENE ==========
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        this.createTextures();
    }

    createTextures() {
        let g = this.make.graphics({ add: false });

        // Player ship
        g.fillStyle(0x8b4513);
        g.fillRect(10, 0, 12, 32);
        g.fillStyle(0xf5deb3);
        g.fillTriangle(16, 0, 6, 16, 26, 16);
        g.fillStyle(0x654321);
        g.fillRect(14, 4, 4, 20);
        g.fillStyle(0xcc8844);
        g.fillRect(6, 24, 20, 6);
        g.generateTexture('playerShip', 32, 32);

        // Merchant ship (white sails)
        g.clear();
        g.fillStyle(0x6b4423);
        g.fillRect(8, 0, 8, 24);
        g.fillStyle(0xffffff);
        g.fillTriangle(12, 0, 4, 12, 20, 12);
        g.generateTexture('merchantShip', 24, 24);

        // Navy ship (blue)
        g.clear();
        g.fillStyle(0x4a3728);
        g.fillRect(8, 0, 10, 28);
        g.fillStyle(0x2244aa);
        g.fillTriangle(13, 0, 4, 14, 22, 14);
        g.fillStyle(0xffffff);
        g.fillRect(8, 6, 10, 2);
        g.generateTexture('navyShip', 26, 28);

        // Pirate ship (black flag)
        g.clear();
        g.fillStyle(0x3a2818);
        g.fillRect(8, 0, 10, 28);
        g.fillStyle(0x880000);
        g.fillTriangle(13, 0, 4, 14, 22, 14);
        g.fillStyle(0x000000);
        g.fillRect(11, 2, 4, 4);
        g.generateTexture('pirateShip', 26, 28);

        // Pirate Captain ship (larger)
        g.clear();
        g.fillStyle(0x2a1808);
        g.fillRect(12, 0, 16, 40);
        g.fillStyle(0x440000);
        g.fillTriangle(20, 0, 6, 20, 34, 20);
        g.fillStyle(0x000000);
        g.fillRect(16, 4, 8, 6);
        g.fillStyle(0xffffff);
        g.fillCircle(20, 6, 2);
        g.generateTexture('captainShip', 40, 40);

        // Cannonball
        g.clear();
        g.fillStyle(0x333333);
        g.fillCircle(4, 4, 4);
        g.generateTexture('cannonball', 8, 8);

        // Water tile
        g.clear();
        g.fillStyle(0x1a5c7a);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x206080);
        g.fillRect(10, 20, 40, 3);
        g.fillRect(20, 40, 30, 2);
        g.generateTexture('water', 64, 64);

        // Island
        g.clear();
        g.fillStyle(0xd4a574);
        g.fillCircle(40, 40, 35);
        g.fillStyle(0x44aa44);
        g.fillCircle(30, 30, 15);
        g.fillCircle(50, 35, 12);
        g.fillCircle(40, 50, 10);
        g.generateTexture('island', 80, 80);

        // Port
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 20, 60, 20);
        g.fillStyle(0x654321);
        g.fillRect(0, 10, 8, 30);
        g.fillRect(52, 10, 8, 30);
        g.fillStyle(0xcc9966);
        g.fillRect(20, 25, 20, 10);
        g.generateTexture('port', 60, 40);

        // Cargo crate
        g.clear();
        g.fillStyle(0x8b6914);
        g.fillRect(0, 0, 12, 12);
        g.fillStyle(0x6b4904);
        g.fillRect(0, 0, 12, 2);
        g.fillRect(5, 2, 2, 10);
        g.generateTexture('crate', 12, 12);

        // Gold coin
        g.clear();
        g.fillStyle(0xffd700);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xcc9900);
        g.fillCircle(6, 6, 3);
        g.generateTexture('goldCoin', 12, 12);

        // Explosion
        g.clear();
        g.fillStyle(0xff8800);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xffcc00);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffffff);
        g.fillCircle(16, 16, 4);
        g.generateTexture('explosion', 32, 32);

        // Fog of war tile
        g.clear();
        g.fillStyle(0x0a1520);
        g.fillRect(0, 0, 64, 64);
        g.generateTexture('fog', 64, 64);

        g.destroy();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// ========== MENU SCENE ==========
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a1520);

        this.add.text(GAME_WIDTH / 2, 100, 'PIRATEERS', {
            fontSize: '56px',
            fontFamily: 'Arial Black',
            color: '#ffd700',
            stroke: '#8b4513',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 170, 'Naval Combat & Trade', {
            fontSize: '20px',
            color: '#88aacc'
        }).setOrigin(0.5);

        const story = [
            'Sail the seas as a pirate captain.',
            'Battle merchants and navy ships.',
            'Collect cargo and gold.',
            'Upgrade your ship.',
            'Defeat the legendary Pirate Captain!'
        ];

        story.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 230 + i * 28, line, {
                fontSize: '16px',
                color: '#668899'
            }).setOrigin(0.5);
        });

        // Controls
        const controls = [
            'W/S - Speed Up/Down',
            'A/D - Turn Left/Right',
            'SPACE - Fire Cannons',
            'E - Enter Port (when nearby)'
        ];

        this.add.text(200, 420, 'CONTROLS:', { fontSize: '14px', color: '#ffd700' });
        controls.forEach((text, i) => {
            this.add.text(200, 445 + i * 22, text, { fontSize: '12px', color: '#668899' });
        });

        const startBtn = this.add.text(GAME_WIDTH / 2, 560, '[ SET SAIL ]', {
            fontSize: '32px',
            color: '#44ff88'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#66ffaa'));
        startBtn.on('pointerout', () => startBtn.setColor('#44ff88'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ========== GAME SCENE ==========
class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        // Game state
        this.gold = 100;
        this.day = 1;
        this.dayTimer = 120;
        this.inPort = false;

        // Upgrades (0-3 levels each)
        this.upgrades = {
            armor: 0,
            speed: 0,
            reload: 0,
            firepower: 0
        };

        // Cargo
        this.cargo = [];
        this.cargoCapacity = 15;

        // Boss defeated
        this.captainDefeated = false;

        // Groups
        this.cannonballs = this.physics.add.group();
        this.enemyCannonballs = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.loot = this.physics.add.group();
        this.islands = this.add.group();
        this.ports = this.physics.add.staticGroup();

        // Fog of war tracking
        this.exploredTiles = new Set();

        // Create world
        this.createWorld();

        // Create player
        this.createPlayer();

        // Spawn enemies
        this.spawnEnemies();

        // Setup input
        this.setupInput();

        // Create UI
        this.createUI();

        // Setup collisions
        this.setupCollisions();

        // Day timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.inPort) {
                    this.dayTimer--;
                    if (this.dayTimer <= 0) {
                        this.endDay();
                    }
                    this.updateUI();
                }
            },
            loop: true
        });

        // Enemy AI timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateEnemies,
            callbackScope: this,
            loop: true
        });

        // Camera setup
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);
    }

    createWorld() {
        // Physics bounds
        this.physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

        // Water background
        for (let x = 0; x < MAP_SIZE; x += 64) {
            for (let y = 0; y < MAP_SIZE; y += 64) {
                this.add.image(x + 32, y + 32, 'water').setDepth(0);
            }
        }

        // Spawn islands
        const islandPositions = [
            { x: 500, y: 500 },
            { x: 1500, y: 300 },
            { x: 2500, y: 500 },
            { x: 400, y: 1500 },
            { x: 1500, y: 1500 },
            { x: 2600, y: 1400 },
            { x: 600, y: 2500 },
            { x: 1800, y: 2600 },
            { x: 2400, y: 2400 }
        ];

        islandPositions.forEach((pos, i) => {
            const island = this.add.image(pos.x, pos.y, 'island');
            island.setScale(1 + Math.random() * 0.5);
            island.setDepth(1);
            this.islands.add(island);

            // Add port to some islands
            if (i % 2 === 0) {
                const port = this.ports.create(pos.x, pos.y + 50, 'port');
                port.setData('name', `Port ${Math.floor(i / 2) + 1}`);
                port.setDepth(2);
            }
        });

        // Create fog of war layer
        this.fogLayer = this.add.container(0, 0);
        this.fogLayer.setDepth(50);

        // Initially fog everything except starting area
        this.fogTiles = [];
        for (let x = 0; x < MAP_SIZE; x += 64) {
            for (let y = 0; y < MAP_SIZE; y += 64) {
                const fog = this.add.image(x + 32, y + 32, 'fog');
                fog.setData('tx', Math.floor(x / 64));
                fog.setData('ty', Math.floor(y / 64));
                this.fogTiles.push(fog);
                this.fogLayer.add(fog);
            }
        }

        // Reveal starting area
        this.revealArea(MAP_SIZE / 2, MAP_SIZE / 2, 400);
    }

    revealArea(x, y, radius) {
        const tilesToReveal = [];
        const centerTx = Math.floor(x / 64);
        const centerTy = Math.floor(y / 64);
        const tileRadius = Math.ceil(radius / 64);

        for (let tx = centerTx - tileRadius; tx <= centerTx + tileRadius; tx++) {
            for (let ty = centerTy - tileRadius; ty <= centerTy + tileRadius; ty++) {
                const key = `${tx},${ty}`;
                if (!this.exploredTiles.has(key)) {
                    const dist = Math.sqrt((tx - centerTx) ** 2 + (ty - centerTy) ** 2);
                    if (dist <= tileRadius) {
                        this.exploredTiles.add(key);
                        tilesToReveal.push(key);
                    }
                }
            }
        }

        // Remove fog for revealed tiles
        this.fogTiles.forEach(fog => {
            const key = `${fog.getData('tx')},${fog.getData('ty')}`;
            if (tilesToReveal.includes(key)) {
                fog.setVisible(false);
            }
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(MAP_SIZE / 2, MAP_SIZE / 2, 'playerShip');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.setDrag(50);

        // Calculate stats
        this.updatePlayerStats();

        this.player.currentSpeed = 0;
        this.player.lastFired = 0;
    }

    updatePlayerStats() {
        this.player.maxArmor = SHIP_STATS.armor.base + this.upgrades.armor * SHIP_STATS.armor.perLevel;
        this.player.armor = this.player.armor || this.player.maxArmor;
        this.player.maxSpeed = SHIP_STATS.speed.base + this.upgrades.speed * SHIP_STATS.speed.perLevel;
        this.player.reloadTime = SHIP_STATS.reload.base + this.upgrades.reload * SHIP_STATS.reload.perLevel;
        this.player.firepower = SHIP_STATS.firepower.base + this.upgrades.firepower * SHIP_STATS.firepower.perLevel;
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            fire: 'SPACE', enter: 'E'
        });
    }

    setupCollisions() {
        this.physics.add.overlap(this.cannonballs, this.enemies, this.cannonballHitEnemy, null, this);
        this.physics.add.overlap(this.enemyCannonballs, this.player, this.cannonballHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.loot, this.collectLoot, null, this);
    }

    spawnEnemies() {
        // Spawn various enemies across the map
        for (let i = 0; i < 15; i++) {
            const types = ['merchant', 'merchant', 'merchant', 'navySloop', 'navySloop', 'pirateRaider'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = 200 + Math.random() * (MAP_SIZE - 400);
            const y = 200 + Math.random() * (MAP_SIZE - 400);
            this.spawnEnemy(type, x, y);
        }

        // Spawn the Pirate Captain boss
        const bossX = 200 + Math.random() * (MAP_SIZE - 400);
        const bossY = 200 + Math.random() * (MAP_SIZE - 400);
        this.spawnEnemy('pirateCaptain', bossX, bossY);
    }

    spawnEnemy(type, x, y) {
        const data = ENEMIES[type];
        const texture = type === 'merchant' ? 'merchantShip' :
                       type === 'navySloop' ? 'navyShip' :
                       type === 'pirateCaptain' ? 'captainShip' : 'pirateShip';

        const enemy = this.enemies.create(x, y, texture);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp);
        enemy.setData('maxHp', data.hp);
        enemy.setData('speed', data.speed);
        enemy.setData('damage', data.damage);
        enemy.setData('goldRange', data.gold);
        enemy.setData('cargoRange', data.cargo);
        enemy.setData('aggression', data.aggression);
        enemy.setData('lastFired', 0);
        enemy.setData('angle', Math.random() * Math.PI * 2);
        enemy.setCollideWorldBounds(true);
        enemy.setDepth(5);

        return enemy;
    }

    updateEnemies() {
        if (!this.player || !this.player.active || this.inPort) return;

        const now = this.time.now;

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const type = enemy.getData('type');
            const data = ENEMIES[type];
            const speed = enemy.getData('speed');
            const aggression = enemy.getData('aggression');

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // AI behavior
            if (dist < 400 && Math.random() < aggression) {
                // Aggressive - approach player
                enemy.setData('angle', angleToPlayer);
                enemy.setRotation(angleToPlayer - Math.PI / 2);
                enemy.setVelocity(Math.cos(angleToPlayer) * speed, Math.sin(angleToPlayer) * speed);

                // Fire at player
                const lastFired = enemy.getData('lastFired');
                if (now - lastFired > 2000 && dist < 300) {
                    this.enemyFire(enemy);
                    enemy.setData('lastFired', now);
                }
            } else {
                // Patrol randomly
                if (Math.random() < 0.02) {
                    const newAngle = enemy.getData('angle') + (Math.random() - 0.5) * 0.5;
                    enemy.setData('angle', newAngle);
                }

                const angle = enemy.getData('angle');
                enemy.setRotation(angle - Math.PI / 2);
                enemy.setVelocity(Math.cos(angle) * speed * 0.5, Math.sin(angle) * speed * 0.5);
            }
        });
    }

    enemyFire(enemy) {
        const angle = enemy.rotation + Math.PI / 2;
        const damage = enemy.getData('damage');

        // Fire from both sides
        [-Math.PI / 2, Math.PI / 2].forEach(offset => {
            const fireAngle = angle + offset;
            const ball = this.enemyCannonballs.create(enemy.x, enemy.y, 'cannonball');
            ball.setVelocity(Math.cos(fireAngle) * 300, Math.sin(fireAngle) * 300);
            ball.setData('damage', damage);
            this.time.delayedCall(3000, () => { if (ball.active) ball.destroy(); });
        });
    }

    fire() {
        const now = this.time.now;
        if (now - this.player.lastFired < this.player.reloadTime) return;

        const angle = this.player.rotation + Math.PI / 2;
        const damage = this.player.firepower;

        // Fire from both sides (broadside)
        [-Math.PI / 2, Math.PI / 2].forEach(offset => {
            for (let i = -1; i <= 1; i++) {
                const spread = i * 0.15;
                const fireAngle = angle + offset + spread;
                const ball = this.cannonballs.create(this.player.x, this.player.y, 'cannonball');
                ball.setVelocity(Math.cos(fireAngle) * 400, Math.sin(fireAngle) * 400);
                ball.setData('damage', damage);
                this.time.delayedCall(2000, () => { if (ball.active) ball.destroy(); });
            }
        });

        this.player.lastFired = now;
    }

    cannonballHitEnemy(ball, enemy) {
        const damage = ball.getData('damage');
        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => enemy.clearTint());

        if (hp <= 0) {
            this.destroyEnemy(enemy);
        }

        ball.destroy();
    }

    destroyEnemy(enemy) {
        const type = enemy.getData('type');
        const goldRange = enemy.getData('goldRange');
        const cargoRange = enemy.getData('cargoRange');

        // Drop gold
        const goldAmount = goldRange[0] + Math.floor(Math.random() * (goldRange[1] - goldRange[0]));
        for (let i = 0; i < Math.ceil(goldAmount / 10); i++) {
            const lootX = enemy.x + (Math.random() - 0.5) * 40;
            const lootY = enemy.y + (Math.random() - 0.5) * 40;
            const coin = this.loot.create(lootX, lootY, 'goldCoin');
            coin.setData('type', 'gold');
            coin.setData('value', Math.min(10, goldAmount - i * 10));
        }

        // Drop cargo
        const cargoCount = cargoRange[0] + Math.floor(Math.random() * (cargoRange[1] - cargoRange[0] + 1));
        for (let i = 0; i < cargoCount; i++) {
            const lootX = enemy.x + (Math.random() - 0.5) * 60;
            const lootY = enemy.y + (Math.random() - 0.5) * 60;
            const crate = this.loot.create(lootX, lootY, 'crate');
            crate.setData('type', 'cargo');

            // Random cargo type based on rarity
            const roll = Math.random();
            let cargoItem;
            if (roll < 0.6) {
                cargoItem = CARGO_TYPES.filter(c => c.rarity === 'common')[Math.floor(Math.random() * 3)];
            } else if (roll < 0.9) {
                cargoItem = CARGO_TYPES.filter(c => c.rarity === 'uncommon')[Math.floor(Math.random() * 2)];
            } else {
                cargoItem = CARGO_TYPES.filter(c => c.rarity === 'rare')[Math.floor(Math.random() * 2)];
            }
            crate.setData('cargo', cargoItem);
        }

        // Explosion effect
        const exp = this.add.image(enemy.x, enemy.y, 'explosion');
        exp.setScale(1.5);
        this.tweens.add({
            targets: exp,
            scale: 2.5,
            alpha: 0,
            duration: 500,
            onComplete: () => exp.destroy()
        });

        // Check if captain defeated
        if (type === 'pirateCaptain') {
            this.captainDefeated = true;
            this.showMessage('PIRATE CAPTAIN DEFEATED!', 3000);
            this.time.delayedCall(3000, () => {
                this.scene.start('VictoryScene', { gold: this.gold, day: this.day });
            });
        }

        enemy.destroy();
    }

    cannonballHitPlayer(ball, player) {
        if (this.player.invincible) return;

        const damage = ball.getData('damage');
        this.player.armor -= damage;

        this.player.invincible = true;
        this.player.setAlpha(0.5);

        this.time.delayedCall(500, () => {
            this.player.invincible = false;
            this.player.setAlpha(1);
        });

        this.cameras.main.shake(100, 0.02);
        ball.destroy();
        this.updateUI();

        if (this.player.armor <= 0) {
            this.playerDestroyed();
        }
    }

    collectLoot(player, lootItem) {
        const type = lootItem.getData('type');

        if (type === 'gold') {
            this.gold += lootItem.getData('value');
        } else if (type === 'cargo') {
            if (this.cargo.length < this.cargoCapacity) {
                this.cargo.push(lootItem.getData('cargo'));
            }
        }

        lootItem.destroy();
        this.updateUI();
    }

    playerDestroyed() {
        // Lose 25% of cargo
        const lossCount = Math.floor(this.cargo.length * 0.25);
        for (let i = 0; i < lossCount; i++) {
            this.cargo.pop();
        }

        // Reset to port
        this.player.armor = this.player.maxArmor;
        this.player.setPosition(MAP_SIZE / 2, MAP_SIZE / 2);
        this.showMessage('Ship destroyed! Lost some cargo.', 2000);
        this.updateUI();
    }

    endDay() {
        this.day++;
        this.dayTimer = 120;
        this.player.armor = this.player.maxArmor;
        this.showMessage(`Day ${this.day} begins!`, 2000);
        this.updateUI();
    }

    checkPortInteraction() {
        let nearestPort = null;
        let nearestDist = Infinity;

        this.ports.getChildren().forEach(port => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, port.x, port.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestPort = port;
            }
        });

        if (nearestDist < 80) {
            this.enterPort(nearestPort);
        }
    }

    enterPort(port) {
        this.inPort = true;
        this.currentPort = port;

        // Show port menu
        this.portMenu = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setScrollFactor(0).setDepth(100);

        const bg = this.add.rectangle(0, 0, 400, 350, 0x1a1510, 0.95);
        bg.setStrokeStyle(3, 0xffd700);

        const title = this.add.text(0, -150, port.getData('name'), {
            fontSize: '28px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Sell cargo button
        const sellBtn = this.add.text(0, -80, `[ SELL CARGO (${this.cargo.length} items) ]`, {
            fontSize: '18px',
            color: '#44ff88'
        }).setOrigin(0.5).setInteractive();

        sellBtn.on('pointerdown', () => this.sellCargo());

        // Repair button
        const repairCost = Math.floor((this.player.maxArmor - this.player.armor) * 0.5);
        const repairBtn = this.add.text(0, -30, `[ REPAIR: ${repairCost} gold ]`, {
            fontSize: '18px',
            color: this.gold >= repairCost ? '#44ff88' : '#ff4444'
        }).setOrigin(0.5).setInteractive();

        repairBtn.on('pointerdown', () => {
            if (this.gold >= repairCost) {
                this.gold -= repairCost;
                this.player.armor = this.player.maxArmor;
                repairBtn.setText('[ REPAIRED! ]');
                this.updateUI();
            }
        });

        // Upgrade buttons
        const upgradeY = 30;
        ['armor', 'speed', 'reload', 'firepower'].forEach((stat, i) => {
            const level = this.upgrades[stat];
            const cost = level < 3 ? UPGRADE_COSTS[level] : 'MAX';
            const btn = this.add.text(0, upgradeY + i * 35, `${stat.toUpperCase()} Lv${level+1} -> ${cost === 'MAX' ? 'MAX' : cost + ' gold'}`, {
                fontSize: '14px',
                color: cost === 'MAX' ? '#888888' : (this.gold >= cost ? '#44ff88' : '#ff4444')
            }).setOrigin(0.5).setInteractive();

            btn.on('pointerdown', () => {
                if (cost !== 'MAX' && this.gold >= cost) {
                    this.gold -= cost;
                    this.upgrades[stat]++;
                    this.updatePlayerStats();
                    btn.setText(`${stat.toUpperCase()} Lv${this.upgrades[stat]+1} -> ${this.upgrades[stat] < 3 ? UPGRADE_COSTS[this.upgrades[stat]] + ' gold' : 'MAX'}`);
                    this.updateUI();
                }
            });

            this.portMenu.add(btn);
        });

        // Leave button
        const leaveBtn = this.add.text(0, 150, '[ LEAVE PORT ]', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        leaveBtn.on('pointerdown', () => this.leavePort());

        this.portMenu.add([bg, title, sellBtn, repairBtn, leaveBtn]);
    }

    sellCargo() {
        let totalValue = 0;
        this.cargo.forEach(item => {
            totalValue += item.value;
        });
        this.gold += totalValue;
        this.cargo = [];
        this.showMessage(`Sold cargo for ${totalValue} gold!`, 1500);
        this.updateUI();
        this.leavePort();
    }

    leavePort() {
        this.inPort = false;
        if (this.portMenu) {
            this.portMenu.destroy();
            this.portMenu = null;
        }
    }

    showMessage(text, duration) {
        const msg = this.add.text(GAME_WIDTH / 2, 100, text, {
            fontSize: '24px',
            color: '#ffd700',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(duration, () => msg.destroy());
    }

    createUI() {
        // Health bar
        this.add.rectangle(120, 30, 200, 20, 0x333333).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(22, 30, 196, 16, 0x44ff44).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);

        this.hpText = this.add.text(120, 30, '', {
            fontSize: '12px', color: '#ffffff'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100);

        // Speed indicator
        this.speedText = this.add.text(20, 55, '', {
            fontSize: '14px', color: '#88ccff'
        }).setScrollFactor(0).setDepth(100);

        // Gold
        this.goldText = this.add.text(20, GAME_HEIGHT - 50, '', {
            fontSize: '18px', color: '#ffd700'
        }).setScrollFactor(0).setDepth(100);

        // Cargo
        this.cargoText = this.add.text(20, GAME_HEIGHT - 25, '', {
            fontSize: '14px', color: '#ccaa88'
        }).setScrollFactor(0).setDepth(100);

        // Day/Time
        this.dayText = this.add.text(GAME_WIDTH - 20, 20, '', {
            fontSize: '16px', color: '#ffcc00', align: 'right'
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(100);

        // Mini-map background
        this.add.rectangle(GAME_WIDTH - 70, GAME_HEIGHT - 70, 120, 120, 0x000000, 0.6).setScrollFactor(0).setDepth(99);
        this.minimapDot = this.add.circle(GAME_WIDTH - 70, GAME_HEIGHT - 70, 3, 0x44ff44).setScrollFactor(0).setDepth(100);

        // Port prompt
        this.portPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'Press E to enter port', {
            fontSize: '16px', color: '#ffcc00'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(100).setVisible(false);

        this.updateUI();
    }

    updateUI() {
        const hpPercent = this.player.armor / this.player.maxArmor;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText(`${Math.ceil(this.player.armor)}/${this.player.maxArmor}`);

        const speedPercent = Math.abs(this.player.currentSpeed / this.player.maxSpeed);
        const speedLabel = speedPercent === 0 ? 'STOP' : speedPercent < 0.5 ? 'SLOW' : speedPercent < 1 ? 'HALF' : 'FULL';
        this.speedText.setText(`Speed: ${speedLabel}`);

        this.goldText.setText(`Gold: ${this.gold}`);
        this.cargoText.setText(`Cargo: ${this.cargo.length}/${this.cargoCapacity}`);

        this.dayText.setText(`Day ${this.day}\nTime: ${Math.floor(this.dayTimer / 60)}:${(this.dayTimer % 60).toString().padStart(2, '0')}`);

        // Update minimap dot
        const mapScale = 120 / MAP_SIZE;
        this.minimapDot.setPosition(
            GAME_WIDTH - 130 + this.player.x * mapScale,
            GAME_HEIGHT - 130 + this.player.y * mapScale
        );
    }

    update(time, delta) {
        if (!this.player || !this.player.active || this.inPort) return;

        // Turn
        if (this.keys.left.isDown) {
            this.player.rotation -= 0.04;
        }
        if (this.keys.right.isDown) {
            this.player.rotation += 0.04;
        }

        // Speed control
        if (this.keys.up.isDown) {
            this.player.currentSpeed = Math.min(this.player.maxSpeed, this.player.currentSpeed + 5);
        }
        if (this.keys.down.isDown) {
            this.player.currentSpeed = Math.max(0, this.player.currentSpeed - 5);
        }

        // Apply velocity based on rotation
        const angle = this.player.rotation + Math.PI / 2;
        this.player.setVelocity(
            Math.cos(angle) * this.player.currentSpeed,
            Math.sin(angle) * this.player.currentSpeed
        );

        // Fire
        if (this.keys.fire.isDown) {
            this.fire();
        }

        // Port interaction
        let nearPort = false;
        this.ports.getChildren().forEach(port => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, port.x, port.y);
            if (dist < 80) nearPort = true;
        });
        this.portPrompt.setVisible(nearPort);

        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) && nearPort) {
            this.checkPortInteraction();
        }

        // Reveal fog of war
        this.revealArea(this.player.x, this.player.y, 200);

        this.updateUI();
    }
}

// ========== VICTORY SCENE ==========
class VictoryScene extends Phaser.Scene {
    constructor() { super({ key: 'VictoryScene' }); }

    init(data) {
        this.finalGold = data.gold || 0;
        this.finalDay = data.day || 1;
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a2520);

        this.add.text(GAME_WIDTH / 2, 120, 'VICTORY!', {
            fontSize: '56px',
            fontFamily: 'Arial Black',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 200, 'You defeated the Pirate Captain!', {
            fontSize: '24px',
            color: '#88ffaa'
        }).setOrigin(0.5);

        const stats = [
            `Days at Sea: ${this.finalDay}`,
            `Gold Accumulated: ${this.finalGold}`,
            '',
            'The seas are safer now.',
            'Your legend will be told for generations.'
        ];

        stats.forEach((line, i) => {
            this.add.text(GAME_WIDTH / 2, 280 + i * 30, line, {
                fontSize: '16px',
                color: '#aaccaa'
            }).setOrigin(0.5);
        });

        const menuBtn = this.add.text(GAME_WIDTH / 2, 500, '[ RETURN TO MENU ]', {
            fontSize: '28px',
            color: '#44ff88'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ========== GAME CONFIG ==========
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0a1520',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, VictoryScene]
};

const game = new Phaser.Game(config);
