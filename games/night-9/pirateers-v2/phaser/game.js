// Pirateers - Naval Combat Game
const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const MAP_SIZE = 2000;

// Ship stats
const SHIPS = {
    player: { armor: 100, speed: 150, reload: 2000, firepower: 10, turnRate: 2 },
    merchant: { hp: 50, speed: 60, damage: 5, gold: [20, 40], cargo: [2, 3], color: 0x884422 },
    navySloop: { hp: 80, speed: 100, damage: 12, gold: [30, 50], cargo: [1, 2], color: 0x2244aa },
    pirateRaider: { hp: 100, speed: 120, damage: 15, gold: [40, 70], cargo: [2, 3], color: 0x444444 },
    pirateCaptain: { hp: 250, speed: 90, damage: 25, gold: [100, 150], cargo: [4, 6], color: 0x222222, isBoss: true }
};

const CARGO_ITEMS = [
    { name: 'Rum', value: 15, rarity: 'common' },
    { name: 'Grain', value: 10, rarity: 'common' },
    { name: 'Fish', value: 8, rarity: 'common' },
    { name: 'Wood', value: 12, rarity: 'common' },
    { name: 'Spices', value: 25, rarity: 'uncommon' },
    { name: 'Silk', value: 40, rarity: 'uncommon' },
    { name: 'Sugar', value: 30, rarity: 'uncommon' },
    { name: 'Gold Bars', value: 75, rarity: 'rare' },
    { name: 'Gems', value: 120, rarity: 'rare' },
    { name: 'Artifact', value: 200, rarity: 'rare' }
];

const UPGRADE_COSTS = [100, 200, 350];

// Game state
let gameState = {
    gold: 500,
    day: 1,
    armor: 100,
    maxArmor: 100,
    speed: 150,
    reload: 2000,
    firepower: 10,
    cargo: [],
    cargoCapacity: 15,
    upgrades: { armor: 1, speed: 1, reload: 1, firepower: 1 },
    dayTimer: 120,
    bossDefeated: false,
    exploredTiles: new Set()
};

// Scenes
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        let g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player ship (brown wooden ship)
        g.fillStyle(0x8b4513);
        g.fillRect(8, 4, 16, 24);
        g.fillStyle(0xdeb887);
        g.fillRect(10, 8, 12, 2);
        g.fillRect(10, 14, 12, 2);
        g.fillRect(10, 20, 12, 2);
        g.fillStyle(0xffffff);
        g.fillRect(14, 6, 4, 8);
        g.generateTexture('playerShip', 32, 32);

        // Enemy ships
        Object.keys(SHIPS).forEach(key => {
            if (key === 'player') return;
            const ship = SHIPS[key];
            g.clear();
            g.fillStyle(ship.color);
            g.fillRect(8, 4, 16, 24);
            g.fillStyle(0xcccccc);
            g.fillRect(10, 8, 12, 2);
            g.fillRect(10, 14, 12, 2);
            if (ship.isBoss) {
                g.fillStyle(0xff0000);
                g.fillRect(12, 2, 8, 4);
            }
            g.generateTexture('ship_' + key, 32, 32);
        });

        // Cannonball
        g.clear();
        g.fillStyle(0x333333);
        g.fillCircle(4, 4, 4);
        g.generateTexture('cannonball', 8, 8);

        // Gold coin
        g.clear();
        g.fillStyle(0xffd700);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0xffec8b);
        g.fillCircle(5, 5, 3);
        g.generateTexture('goldCoin', 12, 12);

        // Cargo crate
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillRect(0, 0, 14, 14);
        g.fillStyle(0xdeb887);
        g.fillRect(2, 2, 10, 10);
        g.lineStyle(2, 0x8b4513);
        g.lineBetween(7, 2, 7, 12);
        g.lineBetween(2, 7, 12, 7);
        g.generateTexture('cargoCrate', 14, 14);

        // Island
        g.clear();
        g.fillStyle(0xdaa520);
        g.fillCircle(32, 32, 30);
        g.fillStyle(0x228b22);
        g.fillCircle(25, 25, 15);
        g.fillCircle(38, 30, 12);
        g.fillCircle(30, 40, 10);
        g.generateTexture('island', 64, 64);

        // Port (island with buildings)
        g.clear();
        g.fillStyle(0xdaa520);
        g.fillCircle(32, 32, 30);
        g.fillStyle(0x228b22);
        g.fillCircle(25, 25, 12);
        g.fillCircle(40, 35, 10);
        g.fillStyle(0x8b4513);
        g.fillRect(28, 28, 12, 10);
        g.fillStyle(0x8b0000);
        g.fillTriangle(28, 28, 34, 20, 40, 28);
        g.generateTexture('port', 64, 64);

        // Water tile
        g.clear();
        g.fillStyle(0x4488cc);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x5599dd);
        g.fillEllipse(20, 20, 30, 10);
        g.fillEllipse(50, 45, 25, 8);
        g.generateTexture('water', 64, 64);

        // Fog
        g.clear();
        g.fillStyle(0x1a3a50, 0.95);
        g.fillRect(0, 0, 64, 64);
        g.generateTexture('fog', 64, 64);

        // Explosion
        g.clear();
        g.fillStyle(0xff6600);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xffcc00);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffffff);
        g.fillCircle(16, 16, 5);
        g.generateTexture('explosion', 32, 32);

        // Muzzle flash
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(5, 5, 5);
        g.generateTexture('muzzleFlash', 10, 10);

        g.destroy();
    }
}

// MenuScene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a3a50);

        this.add.text(GAME_WIDTH / 2, 100, 'PIRATEERS', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            color: '#ffd700',
            stroke: '#8b4513',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 160, 'Naval Combat Adventure', {
            fontSize: '20px',
            color: '#deb887'
        }).setOrigin(0.5);

        const controls = [
            'WASD / Arrows - Sail',
            'A/D - Turn Ship',
            'W/S - Speed Up/Down',
            'Space / Click - Fire Cannons',
            'E - Enter Port (when nearby)',
            'Q - Debug Overlay',
            'ESC - Return to Base'
        ];

        controls.forEach((text, i) => {
            this.add.text(GAME_WIDTH / 2, 220 + i * 26, text, {
                fontSize: '14px',
                color: '#aaccee'
            }).setOrigin(0.5);
        });

        this.add.text(GAME_WIDTH / 2, 480, 'OBJECTIVE: Defeat the Pirate Captain', {
            fontSize: '16px',
            color: '#ff6666'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 550, 'Press SPACE to Set Sail', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.resetGameState();
            this.scene.start('BaseScene');
        });
    }

    resetGameState() {
        gameState = {
            gold: 500,
            day: 1,
            armor: 100,
            maxArmor: 100,
            speed: 150,
            reload: 2000,
            firepower: 10,
            cargo: [],
            cargoCapacity: 15,
            upgrades: { armor: 1, speed: 1, reload: 1, firepower: 1 },
            dayTimer: 120,
            bossDefeated: false,
            exploredTiles: new Set()
        };
    }
}

// BaseScene - Port/Shop
class BaseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BaseScene' });
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2a4a60);

        // Title
        this.add.text(GAME_WIDTH / 2, 30, 'HOME PORT - Day ' + gameState.day, {
            fontSize: '28px',
            color: '#ffd700'
        }).setOrigin(0.5);

        // Gold display
        this.add.text(GAME_WIDTH / 2, 70, 'Gold: ' + gameState.gold, {
            fontSize: '20px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        // Auto-sell cargo
        this.sellCargo();

        // Ship stats display
        this.add.text(100, 120, 'SHIP STATS', { fontSize: '18px', color: '#ffffff' });

        const stats = [
            { name: 'Armor', key: 'armor', value: gameState.maxArmor, effect: '+50 HP' },
            { name: 'Speed', key: 'speed', value: gameState.speed, effect: '+15%' },
            { name: 'Reload', key: 'reload', value: (gameState.reload / 1000).toFixed(1) + 's', effect: '-0.15s' },
            { name: 'Firepower', key: 'firepower', value: gameState.firepower, effect: '+5 dmg' }
        ];

        stats.forEach((stat, i) => {
            const y = 160 + i * 60;
            const level = gameState.upgrades[stat.key];
            const cost = level <= 3 ? UPGRADE_COSTS[level - 1] : 'MAX';

            this.add.text(100, y, `${stat.name}: ${stat.value}`, { fontSize: '16px', color: '#aaddff' });
            this.add.text(100, y + 20, `Level ${level}/4 (${stat.effect}/lvl)`, { fontSize: '12px', color: '#888888' });

            if (cost !== 'MAX') {
                const btn = this.add.text(300, y + 5, `Upgrade (${cost}g)`, {
                    fontSize: '14px',
                    color: gameState.gold >= cost ? '#00ff00' : '#ff6666',
                    backgroundColor: '#333333',
                    padding: { x: 8, y: 4 }
                }).setInteractive();

                btn.on('pointerdown', () => {
                    if (gameState.gold >= cost && level < 4) {
                        gameState.gold -= cost;
                        gameState.upgrades[stat.key]++;
                        this.applyUpgrade(stat.key);
                        this.scene.restart();
                    }
                });
            }
        });

        // Cargo display
        this.add.text(550, 120, 'CARGO', { fontSize: '18px', color: '#ffffff' });
        if (gameState.cargo.length === 0) {
            this.add.text(550, 150, 'Empty', { fontSize: '14px', color: '#888888' });
        } else {
            const cargoSummary = {};
            gameState.cargo.forEach(item => {
                cargoSummary[item.name] = (cargoSummary[item.name] || 0) + 1;
            });
            let cy = 150;
            Object.keys(cargoSummary).forEach(name => {
                const item = CARGO_ITEMS.find(c => c.name === name);
                this.add.text(550, cy, `${name} x${cargoSummary[name]} (${item.value}g each)`, {
                    fontSize: '12px',
                    color: item.rarity === 'rare' ? '#ffaa00' : (item.rarity === 'uncommon' ? '#00aaff' : '#aaaaaa')
                });
                cy += 20;
            });
        }

        // Repair notice
        if (gameState.armor < gameState.maxArmor) {
            gameState.armor = gameState.maxArmor;
            this.add.text(GAME_WIDTH / 2, 420, 'Ship repaired!', { fontSize: '14px', color: '#00ff00' }).setOrigin(0.5);
        }

        // Set sail button
        const sailBtn = this.add.text(GAME_WIDTH / 2, 520, '[ SET SAIL ]', {
            fontSize: '24px',
            color: '#ffd700',
            backgroundColor: '#334455',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        sailBtn.on('pointerdown', () => {
            gameState.dayTimer = 120;
            this.scene.start('SailingScene');
        });

        // Day info
        this.add.text(GAME_WIDTH / 2, 580, 'Each day at sea lasts 2 minutes', {
            fontSize: '12px',
            color: '#888888'
        }).setOrigin(0.5);
    }

    sellCargo() {
        let total = 0;
        gameState.cargo.forEach(item => {
            total += item.value;
        });
        if (total > 0) {
            gameState.gold += total;
            this.add.text(GAME_WIDTH / 2, 95, `Sold cargo for ${total} gold!`, {
                fontSize: '14px',
                color: '#00ff00'
            }).setOrigin(0.5);
        }
        gameState.cargo = [];
    }

    applyUpgrade(key) {
        switch (key) {
            case 'armor':
                gameState.maxArmor += 50;
                gameState.armor = gameState.maxArmor;
                break;
            case 'speed':
                gameState.speed = Math.floor(gameState.speed * 1.15);
                break;
            case 'reload':
                gameState.reload = Math.max(500, gameState.reload - 150);
                break;
            case 'firepower':
                gameState.firepower += 5;
                break;
        }
    }
}

// SailingScene - Main gameplay
class SailingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SailingScene' });
    }

    create() {
        // World bounds
        this.physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

        // Create water background
        for (let x = 0; x < MAP_SIZE; x += 64) {
            for (let y = 0; y < MAP_SIZE; y += 64) {
                this.add.image(x + 32, y + 32, 'water').setDepth(0);
            }
        }

        // Create islands and ports
        this.islands = this.physics.add.staticGroup();
        this.ports = this.physics.add.staticGroup();
        this.createIslands();

        // Fog of war
        this.fogTiles = this.add.group();
        this.createFog();

        // Groups
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.loot = this.physics.add.group();

        // Player ship
        this.player = this.physics.add.sprite(MAP_SIZE / 2, MAP_SIZE / 2, 'playerShip');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.rotation = -Math.PI / 2;
        this.player.speedLevel = 0.5;

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);
        this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

        // Input
        this.keys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            fire: 'SPACE', enter: 'E', debug: 'Q', escape: 'ESC'
        });

        this.input.on('pointerdown', () => this.fireCanons());

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.loot, this.collectLoot, null, this);
        this.physics.add.collider(this.player, this.islands);
        this.physics.add.collider(this.enemies, this.islands);

        // Spawn enemies
        this.spawnEnemies();

        // HUD
        this.createHUD();

        // State
        this.lastFireTime = 0;
        this.debugVisible = false;
        this.nearPort = null;

        // Day timer
        this.dayTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateDayTimer,
            callbackScope: this,
            loop: true
        });
    }

    createIslands() {
        const islandCount = 15;
        const portCount = 5;

        // Regular islands
        for (let i = 0; i < islandCount; i++) {
            const x = Phaser.Math.Between(200, MAP_SIZE - 200);
            const y = Phaser.Math.Between(200, MAP_SIZE - 200);
            // Don't place near center (player spawn)
            if (Math.abs(x - MAP_SIZE / 2) < 200 && Math.abs(y - MAP_SIZE / 2) < 200) continue;
            const island = this.islands.create(x, y, 'island');
            island.setDepth(5);
        }

        // Ports
        for (let i = 0; i < portCount; i++) {
            const x = Phaser.Math.Between(300, MAP_SIZE - 300);
            const y = Phaser.Math.Between(300, MAP_SIZE - 300);
            if (Math.abs(x - MAP_SIZE / 2) < 300 && Math.abs(y - MAP_SIZE / 2) < 300) continue;
            const port = this.ports.create(x, y, 'port');
            port.setDepth(5);
            port.portName = ['Port Royal', 'Tortuga', 'Nassau', 'Havana', 'Kingston'][i] || 'Trading Post';
        }
    }

    createFog() {
        const tileSize = 64;
        for (let x = 0; x < MAP_SIZE; x += tileSize) {
            for (let y = 0; y < MAP_SIZE; y += tileSize) {
                const key = `${Math.floor(x / tileSize)},${Math.floor(y / tileSize)}`;
                if (!gameState.exploredTiles.has(key)) {
                    const fog = this.add.image(x + tileSize / 2, y + tileSize / 2, 'fog');
                    fog.setDepth(20);
                    fog.tileKey = key;
                    this.fogTiles.add(fog);
                }
            }
        }
    }

    spawnEnemies() {
        const spawnEnemy = (type, count) => {
            for (let i = 0; i < count; i++) {
                const x = Phaser.Math.Between(100, MAP_SIZE - 100);
                const y = Phaser.Math.Between(100, MAP_SIZE - 100);
                // Don't spawn near player
                if (Math.abs(x - MAP_SIZE / 2) < 400 && Math.abs(y - MAP_SIZE / 2) < 400) {
                    i--;
                    continue;
                }

                const data = SHIPS[type];
                const enemy = this.enemies.create(x, y, 'ship_' + type);
                enemy.setDepth(9);
                enemy.enemyType = type;
                enemy.hp = data.hp;
                enemy.maxHp = data.hp;
                enemy.damage = data.damage;
                enemy.speed = data.speed;
                enemy.goldDrop = data.gold;
                enemy.cargoDrop = data.cargo;
                enemy.isBoss = data.isBoss || false;
                enemy.lastFireTime = 0;
                enemy.rotation = Math.random() * Math.PI * 2;
            }
        };

        spawnEnemy('merchant', 8);
        spawnEnemy('navySloop', 5);
        spawnEnemy('pirateRaider', 4);
        spawnEnemy('pirateCaptain', 1);
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.updateEnemies(time);
        this.updateFog();
        this.checkPortProximity();
        this.updateHUD();

        // Fire
        if (this.keys.fire.isDown && time - this.lastFireTime > gameState.reload) {
            this.fireCanons();
            this.lastFireTime = time;
        }

        // Enter port
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) && this.nearPort) {
            this.enterPort(this.nearPort);
        }

        // Debug
        if (Phaser.Input.Keyboard.JustDown(this.keys.debug)) {
            this.debugVisible = !this.debugVisible;
        }

        // Return to base
        if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
            this.returnToBase();
        }

        // Check win condition
        if (gameState.bossDefeated) {
            this.scene.start('VictoryScene');
        }
    }

    handleMovement(delta) {
        // Turn
        const turnSpeed = 2;
        if (this.keys.left.isDown) {
            this.player.rotation -= turnSpeed * delta / 1000;
        }
        if (this.keys.right.isDown) {
            this.player.rotation += turnSpeed * delta / 1000;
        }

        // Speed control
        if (this.keys.up.isDown) {
            this.player.speedLevel = Math.min(1, this.player.speedLevel + 0.02);
        }
        if (this.keys.down.isDown) {
            this.player.speedLevel = Math.max(0, this.player.speedLevel - 0.02);
        }

        // Apply velocity
        const speed = gameState.speed * this.player.speedLevel;
        this.player.setVelocity(
            Math.cos(this.player.rotation) * speed,
            Math.sin(this.player.rotation) * speed
        );
    }

    fireCanons() {
        // Broadside fire - both sides
        const angles = [
            this.player.rotation + Math.PI / 2,
            this.player.rotation - Math.PI / 2
        ];

        const cannonsPerSide = 3 + Math.floor(gameState.upgrades.firepower / 2);

        angles.forEach(baseAngle => {
            for (let i = 0; i < cannonsPerSide; i++) {
                const spread = (i - (cannonsPerSide - 1) / 2) * 0.15;
                const angle = baseAngle + spread;

                const bullet = this.bullets.create(
                    this.player.x + Math.cos(angle) * 20,
                    this.player.y + Math.sin(angle) * 20,
                    'cannonball'
                );
                bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
                bullet.damage = gameState.firepower;
                bullet.setDepth(11);

                this.time.delayedCall(750, () => {
                    if (bullet.active) bullet.destroy();
                });
            }

            // Muzzle flash
            const flash = this.add.sprite(
                this.player.x + Math.cos(baseAngle) * 20,
                this.player.y + Math.sin(baseAngle) * 20,
                'muzzleFlash'
            );
            flash.setDepth(12);
            this.time.delayedCall(50, () => flash.destroy());
        });
    }

    updateEnemies(time) {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // AI behavior
            if (dist < 400) {
                // Turn toward player
                const angleDiff = Phaser.Math.Angle.Wrap(angle - enemy.rotation);
                enemy.rotation += Math.sign(angleDiff) * 0.02;

                // Fire at player
                if (time - enemy.lastFireTime > 2000 && dist < 300) {
                    enemy.lastFireTime = time;
                    this.enemyFire(enemy);
                }
            }

            // Move forward
            enemy.setVelocity(
                Math.cos(enemy.rotation) * enemy.speed * 0.5,
                Math.sin(enemy.rotation) * enemy.speed * 0.5
            );
        });
    }

    enemyFire(enemy) {
        const angles = [enemy.rotation + Math.PI / 2, enemy.rotation - Math.PI / 2];
        const playerAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Fire toward player side
        const fireAngle = Math.abs(Phaser.Math.Angle.Wrap(angles[0] - playerAngle)) <
            Math.abs(Phaser.Math.Angle.Wrap(angles[1] - playerAngle)) ? angles[0] : angles[1];

        for (let i = 0; i < 2; i++) {
            const spread = (i - 0.5) * 0.2;
            const bullet = this.enemyBullets.create(
                enemy.x + Math.cos(fireAngle) * 16,
                enemy.y + Math.sin(fireAngle) * 16,
                'cannonball'
            );
            bullet.setTint(0xff6666);
            bullet.setVelocity(
                Math.cos(fireAngle + spread) * 300,
                Math.sin(fireAngle + spread) * 300
            );
            bullet.damage = enemy.damage;
            bullet.setDepth(11);

            this.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        bullet.destroy();

        // Damage flash
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Drop gold
        const gold = Phaser.Math.Between(enemy.goldDrop[0], enemy.goldDrop[1]);
        for (let i = 0; i < Math.ceil(gold / 10); i++) {
            const coin = this.loot.create(
                enemy.x + Phaser.Math.Between(-30, 30),
                enemy.y + Phaser.Math.Between(-30, 30),
                'goldCoin'
            );
            coin.lootType = 'gold';
            coin.value = Math.min(10, gold - i * 10);
            coin.setDepth(8);
        }

        // Drop cargo
        const cargoCount = Phaser.Math.Between(enemy.cargoDrop[0], enemy.cargoDrop[1]);
        for (let i = 0; i < cargoCount; i++) {
            const item = this.getRandomCargo(enemy.isBoss ? 'rare' : 'common');
            const crate = this.loot.create(
                enemy.x + Phaser.Math.Between(-40, 40),
                enemy.y + Phaser.Math.Between(-40, 40),
                'cargoCrate'
            );
            crate.lootType = 'cargo';
            crate.item = item;
            crate.setDepth(8);
        }

        // Explosion
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.setDepth(15);
        this.time.delayedCall(300, () => explosion.destroy());

        // Check if boss
        if (enemy.isBoss) {
            gameState.bossDefeated = true;
        }

        enemy.destroy();
    }

    getRandomCargo(minRarity) {
        let pool = CARGO_ITEMS;
        if (minRarity === 'rare') {
            pool = CARGO_ITEMS.filter(i => i.rarity !== 'common');
        }
        return Phaser.Utils.Array.GetRandom(pool);
    }

    playerHit(player, bullet) {
        gameState.armor -= bullet.damage;
        bullet.destroy();

        player.setTint(0xff0000);
        this.time.delayedCall(100, () => player.clearTint());

        if (gameState.armor <= 0) {
            // Ship destroyed
            this.cameras.main.shake(500, 0.02);
            // Lose 25% cargo
            const toLose = Math.floor(gameState.cargo.length * 0.25);
            for (let i = 0; i < toLose; i++) {
                gameState.cargo.pop();
            }
            this.returnToBase();
        }
    }

    collectLoot(player, loot) {
        if (loot.lootType === 'gold') {
            gameState.gold += loot.value;
            this.showFloatingText('+' + loot.value + 'g', loot.x, loot.y, '#ffd700');
        } else if (loot.lootType === 'cargo') {
            if (gameState.cargo.length < gameState.cargoCapacity) {
                gameState.cargo.push(loot.item);
                this.showFloatingText('+' + loot.item.name, loot.x, loot.y, '#deb887');
            }
        }
        loot.destroy();
    }

    showFloatingText(text, x, y, color) {
        const floatText = this.add.text(x, y, text, {
            fontSize: '12px',
            color: color
        }).setOrigin(0.5).setDepth(30);

        this.tweens.add({
            targets: floatText,
            y: y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatText.destroy()
        });
    }

    updateFog() {
        const tileSize = 64;
        const px = Math.floor(this.player.x / tileSize);
        const py = Math.floor(this.player.y / tileSize);
        const revealRadius = 4;

        this.fogTiles.getChildren().forEach(fog => {
            const [tx, ty] = fog.tileKey.split(',').map(Number);
            if (Math.abs(tx - px) <= revealRadius && Math.abs(ty - py) <= revealRadius) {
                gameState.exploredTiles.add(fog.tileKey);
                fog.destroy();
            }
        });
    }

    checkPortProximity() {
        this.nearPort = null;
        this.ports.getChildren().forEach(port => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, port.x, port.y);
            if (dist < 80) {
                this.nearPort = port;
            }
        });
    }

    enterPort(port) {
        this.scene.start('PortScene', { portName: port.portName });
    }

    updateDayTimer() {
        gameState.dayTimer--;
        if (gameState.dayTimer <= 0) {
            this.returnToBase();
        }
    }

    returnToBase() {
        gameState.day++;
        gameState.armor = gameState.maxArmor;
        this.scene.start('BaseScene');
    }

    createHUD() {
        // Top bar
        this.armorText = this.add.text(10, 10, '', { fontSize: '14px', color: '#00ff00' }).setScrollFactor(0).setDepth(100);
        this.speedText = this.add.text(10, 30, '', { fontSize: '14px', color: '#aaddff' }).setScrollFactor(0).setDepth(100);

        // Day timer
        this.timerText = this.add.text(GAME_WIDTH - 100, 10, '', { fontSize: '16px', color: '#ffcc00' }).setScrollFactor(0).setDepth(100);
        this.dayText = this.add.text(GAME_WIDTH - 100, 30, '', { fontSize: '12px', color: '#888888' }).setScrollFactor(0).setDepth(100);

        // Bottom bar
        this.goldText = this.add.text(10, GAME_HEIGHT - 40, '', { fontSize: '16px', color: '#ffd700' }).setScrollFactor(0).setDepth(100);
        this.cargoText = this.add.text(10, GAME_HEIGHT - 20, '', { fontSize: '12px', color: '#deb887' }).setScrollFactor(0).setDepth(100);

        // Port prompt
        this.portPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'Press E to enter port', {
            fontSize: '16px',
            color: '#00ff00',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

        // Debug
        this.debugText = this.add.text(GAME_WIDTH - 180, 60, '', {
            fontSize: '10px',
            color: '#00ff00',
            backgroundColor: '#000000aa'
        }).setScrollFactor(0).setDepth(200);
    }

    updateHUD() {
        const armorPercent = Math.floor(gameState.armor / gameState.maxArmor * 100);
        this.armorText.setText(`Armor: ${gameState.armor}/${gameState.maxArmor} (${armorPercent}%)`);
        this.armorText.setColor(armorPercent < 30 ? '#ff0000' : (armorPercent < 60 ? '#ffaa00' : '#00ff00'));

        const speedPercent = Math.floor(this.player.speedLevel * 100);
        this.speedText.setText(`Speed: ${speedPercent}%`);

        const minutes = Math.floor(gameState.dayTimer / 60);
        const seconds = gameState.dayTimer % 60;
        this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        this.dayText.setText(`Day ${gameState.day}`);

        this.goldText.setText(`Gold: ${gameState.gold}`);
        this.cargoText.setText(`Cargo: ${gameState.cargo.length}/${gameState.cargoCapacity}`);

        this.portPrompt.setVisible(this.nearPort !== null);

        if (this.debugVisible) {
            this.debugText.setText([
                '=== DEBUG (Q) ===',
                `Pos: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
                `Armor: ${gameState.armor}/${gameState.maxArmor}`,
                `Gold: ${gameState.gold}`,
                `Cargo: ${gameState.cargo.length}/${gameState.cargoCapacity}`,
                `Enemies: ${this.enemies.countActive()}`,
                `Day: ${gameState.day}`,
                `Timer: ${gameState.dayTimer}s`,
                `Boss Defeated: ${gameState.bossDefeated}`,
                `FPS: ${Math.floor(this.game.loop.actualFps)}`
            ].join('\n'));
            this.debugText.setVisible(true);
        } else {
            this.debugText.setVisible(false);
        }
    }
}

// PortScene - Trading
class PortScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PortScene' });
    }

    init(data) {
        this.portName = data.portName || 'Trading Post';
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2a4a60);

        this.add.text(GAME_WIDTH / 2, 40, this.portName, {
            fontSize: '28px',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 80, 'Gold: ' + gameState.gold, {
            fontSize: '18px',
            color: '#ffcc00'
        }).setOrigin(0.5);

        // Sell cargo
        this.add.text(100, 120, 'SELL CARGO', { fontSize: '18px', color: '#ffffff' });

        if (gameState.cargo.length === 0) {
            this.add.text(100, 150, 'No cargo to sell', { fontSize: '14px', color: '#888888' });
        } else {
            const sellAllBtn = this.add.text(100, 150, '[ Sell All Cargo ]', {
                fontSize: '14px',
                color: '#00ff00',
                backgroundColor: '#333333',
                padding: { x: 8, y: 4 }
            }).setInteractive();

            sellAllBtn.on('pointerdown', () => {
                let total = 0;
                gameState.cargo.forEach(item => total += item.value);
                gameState.gold += total;
                gameState.cargo = [];
                this.scene.restart({ portName: this.portName });
            });

            let cy = 190;
            const cargoSummary = {};
            gameState.cargo.forEach(item => {
                cargoSummary[item.name] = (cargoSummary[item.name] || 0) + 1;
            });
            Object.keys(cargoSummary).forEach(name => {
                const item = CARGO_ITEMS.find(c => c.name === name);
                this.add.text(100, cy, `${name} x${cargoSummary[name]} = ${item.value * cargoSummary[name]}g`, {
                    fontSize: '12px',
                    color: '#aaddff'
                });
                cy += 20;
            });
        }

        // Repair (if needed)
        if (gameState.armor < gameState.maxArmor) {
            const repairCost = Math.floor((gameState.maxArmor - gameState.armor) * 0.5);
            const repairBtn = this.add.text(500, 150, `[ Repair Ship (${repairCost}g) ]`, {
                fontSize: '14px',
                color: gameState.gold >= repairCost ? '#00ff00' : '#ff6666',
                backgroundColor: '#333333',
                padding: { x: 8, y: 4 }
            }).setInteractive();

            repairBtn.on('pointerdown', () => {
                if (gameState.gold >= repairCost) {
                    gameState.gold -= repairCost;
                    gameState.armor = gameState.maxArmor;
                    this.scene.restart({ portName: this.portName });
                }
            });
        }

        // Leave port
        const leaveBtn = this.add.text(GAME_WIDTH / 2, 550, '[ Leave Port ]', {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#334455',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        leaveBtn.on('pointerdown', () => {
            this.scene.start('SailingScene');
        });
    }
}

// VictoryScene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a4a3a);

        this.add.text(GAME_WIDTH / 2, 150, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            color: '#ffd700',
            stroke: '#8b4513',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, 'You defeated the Pirate Captain!', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const stats = [
            `Days at Sea: ${gameState.day}`,
            `Gold Earned: ${gameState.gold}`,
            `Final Upgrades:`,
            `  Armor Lv.${gameState.upgrades.armor} | Speed Lv.${gameState.upgrades.speed}`,
            `  Reload Lv.${gameState.upgrades.reload} | Firepower Lv.${gameState.upgrades.firepower}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(GAME_WIDTH / 2, 280 + i * 28, stat, {
                fontSize: '16px',
                color: '#aaddff'
            }).setOrigin(0.5);
        });

        this.add.text(GAME_WIDTH / 2, 500, 'Press SPACE to play again', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Phaser config
const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a3a50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, BaseScene, SailingScene, PortScene, VictoryScene]
};

// Start game
const game = new Phaser.Game(config);
