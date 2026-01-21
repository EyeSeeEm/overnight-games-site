// Dome Keeper Clone - Mining/Defense Hybrid
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 60;

// Tile types
const TILES = {
    AIR: 0,
    DIRT: 1,
    SOFT_ROCK: 2,
    HARD_ROCK: 3,
    IRON: 4,
    WATER: 5
};

// Enemy types
const ENEMIES = {
    walker: { hp: 40, damage: 12, speed: 60, size: 20, color: 0x88aa44 },
    flyer: { hp: 20, damage: 15, speed: 100, size: 16, color: 0xaa8844 },
    hornet: { hp: 100, damage: 45, speed: 50, size: 24, color: 0xffaa00 },
    tick: { hp: 5, damage: 15, speed: 80, size: 12, color: 0x448844 },
    diver: { hp: 30, damage: 100, speed: 200, size: 20, color: 0x4444aa }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const g = this.make.graphics({ add: false });

        // Dome
        g.clear();
        g.fillStyle(0x4466aa);
        g.fillRoundedRect(0, 16, 64, 32, 8);
        g.fillStyle(0x88aacc);
        g.fillRoundedRect(8, 0, 48, 24, 16);
        g.generateTexture('dome', 64, 48);

        // Keeper
        g.clear();
        g.fillStyle(0x44aaff);
        g.fillRect(4, 0, 8, 12);
        g.fillStyle(0xffcc88);
        g.fillCircle(8, 4, 4);
        g.generateTexture('keeper', 16, 16);

        // Laser beam
        g.clear();
        g.fillStyle(0xff4444);
        g.fillRect(0, 0, 200, 4);
        g.generateTexture('laser', 200, 4);

        // Tiles
        const tileColors = {
            dirt: 0x8b7355,
            softRock: 0x6b6b6b,
            hardRock: 0x4a4a4a,
            iron: 0xcc8844,
            water: 0x4488cc
        };

        Object.entries(tileColors).forEach(([name, color]) => {
            g.clear();
            g.fillStyle(color);
            g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            g.lineStyle(1, color - 0x111111);
            g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
            g.generateTexture(`tile_${name}`, TILE_SIZE, TILE_SIZE);
        });

        // Air tile
        g.clear();
        g.fillStyle(0x1a1a2e);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('tile_air', TILE_SIZE, TILE_SIZE);

        // Resource pickups
        g.clear();
        g.fillStyle(0xffaa44);
        g.fillCircle(6, 6, 5);
        g.generateTexture('iron_pickup', 12, 12);

        g.clear();
        g.fillStyle(0x44aaff);
        g.fillCircle(6, 6, 5);
        g.generateTexture('water_pickup', 12, 12);

        // Enemies
        Object.entries(ENEMIES).forEach(([name, data]) => {
            g.clear();
            g.fillStyle(data.color);
            g.fillCircle(data.size / 2, data.size / 2, data.size / 2 - 2);
            g.fillStyle(0xff0000);
            g.fillCircle(data.size / 3, data.size / 3, 2);
            g.fillCircle(data.size * 2 / 3, data.size / 3, 2);
            g.generateTexture(`enemy_${name}`, data.size, data.size);
        });

        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = GAME_WIDTH / 2;

        this.add.text(cx, 100, 'DOME KEEPER', {
            fontSize: '48px', fontFamily: 'Arial', color: '#4488cc', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 170, 'Mine. Defend. Survive.', {
            fontSize: '20px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, 250, 'WASD - Move | Arrow Keys - Dig', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, 280, 'Mouse - Aim Laser | Click - Fire', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        this.add.text(cx, 310, 'E - Upgrades (at dome)', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);

        const start = this.add.text(cx, 420, '[ START ]', {
            fontSize: '32px', fontFamily: 'Arial', color: '#00ff88'
        }).setOrigin(0.5).setInteractive();

        start.on('pointerover', () => start.setColor('#88ffaa'));
        start.on('pointerout', () => start.setColor('#00ff88'));
        start.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        // Game state
        this.currentWave = 1;
        this.maxWaves = 10;
        this.phase = 'mining'; // 'mining' or 'defense'
        this.phaseTimer = 60000; // 60 seconds mining
        this.waveWarning = false;

        // Resources
        this.iron = 0;
        this.water = 0;

        // Dome stats
        this.domeHp = 800;
        this.domeMaxHp = 800;
        this.laserDamage = 15;
        this.laserSpeed = 0.2;

        // Keeper stats
        this.drillStrength = 2;
        this.moveSpeed = 80;
        this.carryCapacity = 3;
        this.carrying = 0;
        this.carryType = null;

        // Upgrades
        this.upgrades = {
            drill: 0,
            speed: 0,
            carry: 0,
            laserDamage: 0,
            laserSpeed: 0,
            domeHp: 0
        };

        // Generate map
        this.generateMap();

        // Groups
        this.tileSprites = this.add.group();
        this.pickups = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.lasers = this.add.group();

        // Create dome
        this.domeX = MAP_WIDTH * TILE_SIZE / 2;
        this.domeY = 4 * TILE_SIZE;
        this.dome = this.add.sprite(this.domeX, this.domeY, 'dome');
        this.dome.setDepth(10);

        // Create keeper
        this.keeper = this.physics.add.sprite(this.domeX, this.domeY + 40, 'keeper');
        this.keeper.setCollideWorldBounds(true);
        this.keeper.setDepth(15);

        // Draw initial map
        this.drawMap();

        // Set world bounds
        this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        // Camera
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        this.cameras.main.startFollow(this.keeper, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);

        // Input
        this.moveKeys = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
        this.digKeys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT' });
        this.input.keyboard.on('keydown-E', () => this.openUpgradeMenu());

        this.input.on('pointerdown', () => {
            if (this.phase === 'defense') this.fireLaser();
        });

        // Collisions
        this.physics.add.overlap(this.keeper, this.pickups, this.collectResource, null, this);

        // HUD
        this.createHUD();

        // Laser aim line
        this.laserLine = this.add.graphics().setDepth(20);
    }

    generateMap() {
        this.map = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Surface area (dome space)
                if (y < 6) {
                    if (x >= MAP_WIDTH / 2 - 3 && x <= MAP_WIDTH / 2 + 2 && y >= 2) {
                        this.map[y][x] = TILES.AIR;
                    } else if (y < 2) {
                        this.map[y][x] = TILES.AIR;
                    } else {
                        this.map[y][x] = TILES.DIRT;
                    }
                    continue;
                }

                // Underground
                const depth = y - 6;
                let tile = TILES.DIRT;

                // Depth-based rock types
                if (depth > 10) {
                    tile = Math.random() < 0.3 ? TILES.SOFT_ROCK : TILES.DIRT;
                }
                if (depth > 25) {
                    tile = Math.random() < 0.5 ? TILES.SOFT_ROCK : (Math.random() < 0.3 ? TILES.HARD_ROCK : TILES.DIRT);
                }
                if (depth > 40) {
                    tile = Math.random() < 0.4 ? TILES.HARD_ROCK : TILES.SOFT_ROCK;
                }

                // Resource veins
                if (Math.random() < 0.08 + depth * 0.002) {
                    tile = TILES.IRON;
                }
                if (depth > 15 && Math.random() < 0.04 + depth * 0.001) {
                    tile = TILES.WATER;
                }

                this.map[y][x] = tile;
            }
        }
    }

    drawMap() {
        this.tileSprites.clear(true, true);

        const camX = this.cameras.main.scrollX;
        const camY = this.cameras.main.scrollY;
        const viewWidth = GAME_WIDTH / this.cameras.main.zoom + TILE_SIZE * 4;
        const viewHeight = GAME_HEIGHT / this.cameras.main.zoom + TILE_SIZE * 4;

        const startX = Math.max(0, Math.floor((camX - TILE_SIZE * 2) / TILE_SIZE));
        const startY = Math.max(0, Math.floor((camY - TILE_SIZE * 2) / TILE_SIZE));
        const endX = Math.min(MAP_WIDTH, Math.ceil((camX + viewWidth) / TILE_SIZE));
        const endY = Math.min(MAP_HEIGHT, Math.ceil((camY + viewHeight) / TILE_SIZE));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.map[y][x];
                let texture = 'tile_air';

                switch (tile) {
                    case TILES.DIRT: texture = 'tile_dirt'; break;
                    case TILES.SOFT_ROCK: texture = 'tile_softRock'; break;
                    case TILES.HARD_ROCK: texture = 'tile_hardRock'; break;
                    case TILES.IRON: texture = 'tile_iron'; break;
                    case TILES.WATER: texture = 'tile_water'; break;
                }

                const sprite = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, texture);
                this.tileSprites.add(sprite);
            }
        }
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // Phase and wave
        this.phaseText = this.add.text(GAME_WIDTH / 2, 15, '', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        this.hudContainer.add(this.phaseText);

        // Timer
        this.timerText = this.add.text(GAME_WIDTH / 2, 40, '', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffaa00'
        }).setOrigin(0.5).setScrollFactor(0);
        this.hudContainer.add(this.timerText);

        // Resources
        this.resourceText = this.add.text(20, 20, '', {
            fontSize: '16px', fontFamily: 'Arial', color: '#ffffff'
        }).setScrollFactor(0);
        this.hudContainer.add(this.resourceText);

        // Dome HP
        this.hudContainer.add(this.add.rectangle(GAME_WIDTH - 120, 25, 204, 20, 0x333333).setScrollFactor(0));
        this.domeHpBar = this.add.rectangle(GAME_WIDTH - 220, 17, 200, 16, 0x4488cc).setOrigin(0, 0).setScrollFactor(0);
        this.hudContainer.add(this.domeHpBar);
        this.domeHpText = this.add.text(GAME_WIDTH - 120, 25, '', {
            fontSize: '12px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        this.hudContainer.add(this.domeHpText);

        // Carrying
        this.carryText = this.add.text(20, 560, '', {
            fontSize: '14px', fontFamily: 'Arial', color: '#88ff88'
        }).setScrollFactor(0);
        this.hudContainer.add(this.carryText);

        // Warning text
        this.warningText = this.add.text(GAME_WIDTH / 2, 100, '', {
            fontSize: '28px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0);

        this.updateHUD();
    }

    updateHUD() {
        this.phaseText.setText(`Wave ${this.currentWave}/${this.maxWaves} - ${this.phase.toUpperCase()}`);

        const timeLeft = Math.ceil(this.phaseTimer / 1000);
        this.timerText.setText(`Time: ${timeLeft}s`);

        this.resourceText.setText(`Iron: ${this.iron} | Water: ${this.water}`);

        this.domeHpBar.width = (this.domeHp / this.domeMaxHp) * 200;
        this.domeHpText.setText(`Dome: ${Math.ceil(this.domeHp)}/${this.domeMaxHp}`);

        if (this.carrying > 0) {
            this.carryText.setText(`Carrying: ${this.carrying}/${this.carryCapacity} ${this.carryType}`);
        } else {
            this.carryText.setText('');
        }

        // Wave warning
        if (this.waveWarning) {
            this.warningText.setText('WAVE INCOMING!');
        } else {
            this.warningText.setText('');
        }
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Phase timer
        this.phaseTimer -= delta;

        // Wave warning (10 seconds before)
        if (this.phase === 'mining' && this.phaseTimer < 10000) {
            this.waveWarning = true;
        }

        if (this.phaseTimer <= 0) {
            if (this.phase === 'mining') {
                this.startDefensePhase();
            } else {
                if (this.enemies.countActive() === 0) {
                    this.endDefensePhase();
                }
            }
        }

        // Keeper movement
        let vx = 0, vy = 0;
        if (this.moveKeys.left.isDown) vx = -1;
        if (this.moveKeys.right.isDown) vx = 1;
        if (this.moveKeys.up.isDown) vy = -1;
        if (this.moveKeys.down.isDown) vy = 1;

        // Speed penalty for carrying
        const speedPenalty = this.carrying * (5.7 - this.upgrades.carry * 1.5);
        const actualSpeed = Math.max(30, this.moveSpeed - speedPenalty);

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        // Check tile collision
        const nextX = this.keeper.x + vx * actualSpeed * delta / 1000 * 10;
        const nextY = this.keeper.y + vy * actualSpeed * delta / 1000 * 10;
        const tileX = Math.floor(nextX / TILE_SIZE);
        const tileY = Math.floor(nextY / TILE_SIZE);

        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
            if (this.map[tileY][tileX] !== TILES.AIR) {
                // Can't move into solid tile
                vx = 0; vy = 0;
            }
        }

        this.keeper.setVelocity(vx * actualSpeed, vy * actualSpeed);

        // Digging
        if (Phaser.Input.Keyboard.JustDown(this.digKeys.left)) this.dig(-1, 0);
        if (Phaser.Input.Keyboard.JustDown(this.digKeys.right)) this.dig(1, 0);
        if (Phaser.Input.Keyboard.JustDown(this.digKeys.up)) this.dig(0, -1);
        if (Phaser.Input.Keyboard.JustDown(this.digKeys.down)) this.dig(0, 1);

        // Deposit resources at dome
        if (this.carrying > 0) {
            const distToDome = Phaser.Math.Distance.Between(this.keeper.x, this.keeper.y, this.domeX, this.domeY);
            if (distToDome < 50) {
                if (this.carryType === 'iron') this.iron += this.carrying;
                else if (this.carryType === 'water') this.water += this.carrying;
                this.carrying = 0;
                this.carryType = null;
            }
        }

        // Defense phase - update enemies
        if (this.phase === 'defense') {
            this.updateEnemies(time);
            this.updateLaserAim();
        }

        // Redraw map (culling)
        this.drawMap();
        this.updateHUD();
    }

    dig(dx, dy) {
        const tileX = Math.floor(this.keeper.x / TILE_SIZE) + dx;
        const tileY = Math.floor(this.keeper.y / TILE_SIZE) + dy;

        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return;

        const tile = this.map[tileY][tileX];
        if (tile === TILES.AIR) return;

        // Get tile HP
        let tileHp = 4;
        switch (tile) {
            case TILES.DIRT: tileHp = 4; break;
            case TILES.SOFT_ROCK: tileHp = 8; break;
            case TILES.HARD_ROCK: tileHp = 16; break;
            case TILES.IRON: tileHp = 6; break;
            case TILES.WATER: tileHp = 5; break;
        }

        // Drill strength
        const drillPower = this.drillStrength + this.upgrades.drill * 5;

        if (drillPower >= tileHp) {
            // Destroy tile
            this.map[tileY][tileX] = TILES.AIR;

            // Drop resource
            if (tile === TILES.IRON || tile === TILES.WATER) {
                const pickup = this.physics.add.sprite(
                    tileX * TILE_SIZE + TILE_SIZE / 2,
                    tileY * TILE_SIZE + TILE_SIZE / 2,
                    tile === TILES.IRON ? 'iron_pickup' : 'water_pickup'
                );
                pickup.setData('type', tile === TILES.IRON ? 'iron' : 'water');
                pickup.setData('amount', Phaser.Math.Between(1, 3));
                this.pickups.add(pickup);
            }
        }
    }

    collectResource(keeper, pickup) {
        const type = pickup.getData('type');
        const amount = pickup.getData('amount');

        if (this.carrying > 0 && this.carryType !== type) return;
        if (this.carrying >= this.carryCapacity) return;

        const toPickup = Math.min(amount, this.carryCapacity - this.carrying);
        this.carrying += toPickup;
        this.carryType = type;

        const remaining = amount - toPickup;
        if (remaining <= 0) {
            pickup.destroy();
        } else {
            pickup.setData('amount', remaining);
        }
    }

    startDefensePhase() {
        this.phase = 'defense';
        this.phaseTimer = 30000 + this.currentWave * 5000; // Defense duration
        this.waveWarning = false;

        // Spawn enemies
        this.spawnWaveEnemies();
    }

    spawnWaveEnemies() {
        const wave = this.currentWave;
        const baseCount = 3 + wave * 2;

        // Enemy types by wave
        const availableEnemies = ['walker'];
        if (wave >= 2) availableEnemies.push('flyer');
        if (wave >= 4) availableEnemies.push('tick');
        if (wave >= 6) availableEnemies.push('hornet');
        if (wave >= 8) availableEnemies.push('diver');

        for (let i = 0; i < baseCount; i++) {
            const type = Phaser.Utils.Array.GetRandom(availableEnemies);
            const data = ENEMIES[type];

            // Spawn from sides
            const side = Math.random() < 0.5 ? -1 : 1;
            const x = this.domeX + side * (200 + Math.random() * 100);
            const y = this.domeY - 50 + Math.random() * 100;

            const enemy = this.physics.add.sprite(x, y, `enemy_${type}`);
            enemy.setData('type', type);
            enemy.setData('hp', data.hp + wave * 5);
            enemy.setData('damage', data.damage);
            enemy.setData('speed', data.speed);
            enemy.setData('lastAttack', 0);
            this.enemies.add(enemy);
        }
    }

    updateEnemies(time) {
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            const speed = enemy.getData('speed');
            const damage = enemy.getData('damage');

            // Move toward dome
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.domeX, this.domeY);
            enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

            // Attack dome if close
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.domeX, this.domeY);
            if (dist < 50) {
                if (time - enemy.getData('lastAttack') > 1000) {
                    enemy.setData('lastAttack', time);
                    this.domeHp -= damage;

                    if (this.domeHp <= 0) {
                        this.lose();
                    }
                }
            }
        });
    }

    updateLaserAim() {
        this.laserLine.clear();

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        this.laserLine.lineStyle(2, 0xff0000, 0.5);
        this.laserLine.beginPath();
        this.laserLine.moveTo(this.domeX, this.domeY);
        this.laserLine.lineTo(worldPoint.x, worldPoint.y);
        this.laserLine.strokePath();
    }

    fireLaser() {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.domeX, this.domeY, worldPoint.x, worldPoint.y);

        // Create laser visual
        const laser = this.add.sprite(this.domeX, this.domeY, 'laser');
        laser.setRotation(angle);
        laser.setDepth(5);
        this.lasers.add(laser);

        // Hit enemies in line
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            // Check if enemy is in laser path
            const enemyAngle = Phaser.Math.Angle.Between(this.domeX, this.domeY, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));

            if (angleDiff < 0.1) {
                let hp = enemy.getData('hp') - (this.laserDamage + this.upgrades.laserDamage * 15);
                enemy.setData('hp', hp);

                enemy.setTint(0xff0000);
                this.time.delayedCall(100, () => {
                    if (enemy.active) enemy.clearTint();
                });

                if (hp <= 0) {
                    enemy.destroy();
                }
            }
        });

        this.time.delayedCall(100, () => laser.destroy());
    }

    endDefensePhase() {
        this.phase = 'mining';
        this.phaseTimer = 60000 + this.currentWave * 5000; // Mining time increases
        this.waveWarning = false;

        this.currentWave++;

        if (this.currentWave > this.maxWaves) {
            this.win();
        }
    }

    openUpgradeMenu() {
        // Check if at dome
        const dist = Phaser.Math.Distance.Between(this.keeper.x, this.keeper.y, this.domeX, this.domeY);
        if (dist > 80) return;

        this.scene.pause();
        this.scene.launch('UpgradeScene', {
            iron: this.iron,
            water: this.water,
            upgrades: this.upgrades,
            onClose: (newIron, newWater, newUpgrades) => {
                this.iron = newIron;
                this.water = newWater;
                this.upgrades = newUpgrades;

                // Apply upgrades
                this.drillStrength = 2 + newUpgrades.drill * 5;
                this.moveSpeed = 80 + newUpgrades.speed * 18;
                this.carryCapacity = 3 + newUpgrades.carry * 4;
                this.laserDamage = 15 + newUpgrades.laserDamage * 15;
                this.domeMaxHp = 800 + newUpgrades.domeHp * 300;
                this.domeHp = Math.min(this.domeHp, this.domeMaxHp);
            }
        });
    }

    win() {
        this.gameOver = true;
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'VICTORY!', {
            fontSize: '48px', fontFamily: 'Arial', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'You survived all waves!', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    lose() {
        this.gameOver = true;
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'DOME DESTROYED', {
            fontSize: '40px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }
}

// Upgrade Scene
class UpgradeScene extends Phaser.Scene {
    constructor() { super('UpgradeScene'); }

    init(data) {
        this.iron = data.iron;
        this.water = data.water;
        this.upgrades = { ...data.upgrades };
        this.onClose = data.onClose;
    }

    create() {
        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, 450, 0x222233, 0.95);

        this.add.text(GAME_WIDTH / 2, 100, 'UPGRADES', {
            fontSize: '32px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.resourceText = this.add.text(GAME_WIDTH / 2, 140, `Iron: ${this.iron} | Water: ${this.water}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffaa00'
        }).setOrigin(0.5);

        // Upgrade buttons
        const upgradeDefs = [
            { key: 'drill', name: 'Drill Speed', cost: 5, resource: 'iron' },
            { key: 'speed', name: 'Movement Speed', cost: 4, resource: 'iron' },
            { key: 'carry', name: 'Carry Capacity', cost: 4, resource: 'iron' },
            { key: 'laserDamage', name: 'Laser Damage', cost: 6, resource: 'iron' },
            { key: 'laserSpeed', name: 'Laser Speed', cost: 5, resource: 'iron' },
            { key: 'domeHp', name: 'Dome Health', cost: 10, resource: 'iron' }
        ];

        upgradeDefs.forEach((def, i) => {
            const y = 190 + i * 45;
            const level = this.upgrades[def.key];
            const cost = def.cost * (level + 1);

            const btn = this.add.rectangle(GAME_WIDTH / 2, y, 400, 38, 0x334455).setInteractive();
            this.add.text(GAME_WIDTH / 2 - 180, y, `${def.name} (Lv ${level})`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffffff'
            }).setOrigin(0, 0.5);
            this.add.text(GAME_WIDTH / 2 + 150, y, `${cost} ${def.resource}`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffaa00'
            }).setOrigin(1, 0.5);

            btn.on('pointerover', () => btn.setFillStyle(0x445566));
            btn.on('pointerout', () => btn.setFillStyle(0x334455));
            btn.on('pointerdown', () => this.buyUpgrade(def.key, cost, def.resource));
        });

        // Close button
        const closeBtn = this.add.rectangle(GAME_WIDTH / 2, 480, 150, 40, 0x00aa00).setInteractive();
        this.add.text(GAME_WIDTH / 2, 480, 'CLOSE', {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);

        closeBtn.on('pointerdown', () => {
            this.onClose(this.iron, this.water, this.upgrades);
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }

    buyUpgrade(key, cost, resource) {
        if (resource === 'iron' && this.iron >= cost) {
            this.iron -= cost;
            this.upgrades[key]++;
        } else if (resource === 'water' && this.water >= cost) {
            this.water -= cost;
            this.upgrades[key]++;
        }

        this.resourceText.setText(`Iron: ${this.iron} | Water: ${this.water}`);
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0a0a15',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, UpgradeScene]
};

const game = new Phaser.Game(config);
