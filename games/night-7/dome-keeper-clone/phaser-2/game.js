// Dome Keeper - Mining + Tower Defense
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Player/miner texture
        const player = this.add.graphics();
        player.fillStyle(0x44aaff);
        player.fillRoundedRect(4, 4, 24, 24, 4);
        player.fillStyle(0x2288dd);
        player.fillRect(10, 8, 12, 8); // visor
        player.generateTexture('player', 32, 32);
        player.destroy();

        // Dome texture
        const dome = this.add.graphics();
        dome.fillStyle(0x666688);
        dome.fillCircle(50, 50, 48);
        dome.fillStyle(0x8888aa);
        dome.fillCircle(50, 45, 40);
        dome.fillStyle(0x556677);
        dome.fillRect(10, 50, 80, 30);
        dome.generateTexture('dome', 100, 100);
        dome.destroy();

        // Dirt tile
        const dirt = this.add.graphics();
        dirt.fillStyle(0x553311);
        dirt.fillRect(0, 0, 32, 32);
        dirt.fillStyle(0x442200);
        dirt.fillRect(2, 2, 6, 6);
        dirt.fillRect(20, 8, 8, 8);
        dirt.fillRect(8, 22, 6, 6);
        dirt.generateTexture('dirt', 32, 32);
        dirt.destroy();

        // Iron ore tile
        const iron = this.add.graphics();
        iron.fillStyle(0x553311);
        iron.fillRect(0, 0, 32, 32);
        iron.fillStyle(0x8899aa);
        iron.fillCircle(10, 10, 5);
        iron.fillCircle(22, 14, 6);
        iron.fillCircle(12, 24, 4);
        iron.generateTexture('iron', 32, 32);
        iron.destroy();

        // Water crystal tile
        const water = this.add.graphics();
        water.fillStyle(0x553311);
        water.fillRect(0, 0, 32, 32);
        water.fillStyle(0x44ddff);
        water.fillTriangle(16, 4, 8, 18, 24, 18);
        water.fillTriangle(10, 20, 6, 28, 14, 28);
        water.generateTexture('water', 32, 32);
        water.destroy();

        // Empty (dug) tile
        const empty = this.add.graphics();
        empty.fillStyle(0x221100);
        empty.fillRect(0, 0, 32, 32);
        empty.generateTexture('empty', 32, 32);
        empty.destroy();

        // Iron resource icon
        const ironIcon = this.add.graphics();
        ironIcon.fillStyle(0x8899aa);
        ironIcon.fillCircle(8, 8, 7);
        ironIcon.generateTexture('ironIcon', 16, 16);
        ironIcon.destroy();

        // Water resource icon
        const waterIcon = this.add.graphics();
        waterIcon.fillStyle(0x44ddff);
        waterIcon.fillTriangle(8, 2, 2, 14, 14, 14);
        waterIcon.generateTexture('waterIcon', 16, 16);
        waterIcon.destroy();

        // Laser beam
        const laser = this.add.graphics();
        laser.fillStyle(0xff4444);
        laser.fillRect(0, 0, 8, 32);
        laser.generateTexture('laser', 8, 32);
        laser.destroy();

        // Enemy: Walker
        const walker = this.add.graphics();
        walker.fillStyle(0xaa4444);
        walker.fillCircle(12, 12, 10);
        walker.fillStyle(0xff6666);
        walker.fillCircle(12, 10, 4);
        walker.generateTexture('walker', 24, 24);
        walker.destroy();

        // Enemy: Flyer
        const flyer = this.add.graphics();
        flyer.fillStyle(0x44aa44);
        flyer.fillTriangle(12, 2, 2, 22, 22, 22);
        flyer.fillStyle(0x66ff66);
        flyer.fillCircle(12, 14, 4);
        flyer.generateTexture('flyer', 24, 24);
        flyer.destroy();

        // Enemy: Hornet
        const hornet = this.add.graphics();
        hornet.fillStyle(0xffaa00);
        hornet.fillRect(4, 8, 16, 12);
        hornet.fillStyle(0x000000);
        hornet.fillRect(8, 8, 4, 12);
        hornet.fillRect(16, 8, 4, 12);
        hornet.generateTexture('hornet', 24, 28);
        hornet.destroy();

        // Enemy: Worm
        const worm = this.add.graphics();
        worm.fillStyle(0xcc88cc);
        worm.fillCircle(6, 12, 5);
        worm.fillCircle(12, 12, 6);
        worm.fillCircle(18, 12, 5);
        worm.generateTexture('worm', 24, 24);
        worm.destroy();

        // Enemy: Diver (big boss type)
        const diver = this.add.graphics();
        diver.fillStyle(0x884444);
        diver.fillCircle(20, 20, 18);
        diver.fillStyle(0xff4444);
        diver.fillCircle(20, 16, 6);
        diver.generateTexture('diver', 40, 40);
        diver.destroy();

        // Particle
        const particle = this.add.graphics();
        particle.fillStyle(0xffffff);
        particle.fillRect(0, 0, 4, 4);
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
        const centerX = 512;
        const centerY = 300;

        this.add.text(centerX, 120, 'DOME KEEPER', {
            fontSize: '64px',
            fill: '#44aaff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(centerX, 200, 'Mine resources. Defend your dome.', {
            fontSize: '24px',
            fill: '#888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'WASD or Arrow Keys - Move miner',
            'SPACE - Mine / Interact',
            'CLICK - Aim and fire laser (when in dome)',
            '',
            'Mine iron and water underground',
            'Return to dome to deposit resources',
            'Upgrade your equipment between waves',
            'Defend the dome from alien attacks!',
            '',
            'Survive 10 waves to win'
        ];

        instructions.forEach((text, i) => {
            this.add.text(centerX, 280 + i * 28, text, {
                fontSize: '18px',
                fill: '#aaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 550, '[ START GAME ]', {
            fontSize: '32px',
            fill: '#4f4',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#8f8'));
        startBtn.on('pointerout', () => startBtn.setFill('#4f4'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Start with Enter or Space
        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game state
        this.wave = 0;
        this.maxWaves = 10;
        this.domeHealth = 100;
        this.maxDomeHealth = 100;

        // Resources
        this.iron = 0;
        this.waterRes = 0;
        this.carriedIron = 0;
        this.carriedWater = 0;
        this.maxCarry = 5;

        // Upgrades
        this.drillSpeed = 1;
        this.carryCapacity = 5;
        this.laserDamage = 10;

        // Wave timing
        this.waveTimer = 0;
        this.waveDuration = 30000; // 30 seconds between waves
        this.waveInProgress = false;
        this.enemiesRemaining = 0;

        // Create mine grid (20 wide, 15 deep)
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.tileSize = 32;
        this.grid = [];
        this.gridSprites = [];

        // Mine starts below ground level
        this.groundY = 180;
        this.mineOffsetX = 192; // Center the mine

        this.createMineGrid();

        // Create dome
        this.dome = this.add.sprite(512, 100, 'dome').setScale(1.5);

        // Create player
        this.player = this.physics.add.sprite(512, 140, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.playerSpeed = 200;
        this.inDome = true;
        this.mining = false;
        this.miningProgress = 0;
        this.miningTarget = null;

        // Enemies group
        this.enemies = this.physics.add.group();

        // Lasers
        this.lasers = this.physics.add.group();

        // UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Mouse for laser aiming
        this.input.on('pointerdown', (pointer) => this.fireLaser(pointer));

        // Collisions
        this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this);

        // Start first wave timer
        this.waveTimer = this.waveDuration;
        this.updateWaveText();
    }

    createMineGrid() {
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            this.gridSprites[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                // Determine tile type
                let type = 'dirt';
                const rand = Math.random();
                if (rand < 0.15) {
                    type = 'iron';
                } else if (rand < 0.22) {
                    type = 'water';
                }
                // Top row is always accessible
                if (y === 0) type = 'empty';

                this.grid[y][x] = type;

                const worldX = this.mineOffsetX + x * this.tileSize;
                const worldY = this.groundY + y * this.tileSize;

                const sprite = this.add.sprite(worldX, worldY, type).setOrigin(0);
                this.gridSprites[y][x] = sprite;
            }
        }
    }

    createUI() {
        // Top bar background
        this.add.rectangle(512, 25, 1024, 50, 0x000000, 0.7);

        // Dome health
        this.add.text(20, 10, 'DOME', { fontSize: '14px', fill: '#888' });
        this.healthBar = this.add.rectangle(120, 18, 150, 16, 0x44ff44).setOrigin(0, 0.5);
        this.healthBarBg = this.add.rectangle(120, 18, 150, 16, 0x333333).setOrigin(0, 0.5).setDepth(-1);

        // Wave info
        this.waveText = this.add.text(512, 10, 'Wave 1', {
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5, 0);

        this.waveTimerText = this.add.text(512, 35, '', {
            fontSize: '14px',
            fill: '#ff8'
        }).setOrigin(0.5, 0);

        // Resources
        this.add.sprite(750, 18, 'ironIcon').setScale(1.5);
        this.ironText = this.add.text(770, 10, '0', { fontSize: '16px', fill: '#8899aa' });

        this.add.sprite(850, 18, 'waterIcon').setScale(1.5);
        this.waterText = this.add.text(870, 10, '0', { fontSize: '16px', fill: '#44ddff' });

        // Carried resources (bottom)
        this.carriedText = this.add.text(512, 580, 'Carrying: 0/5', {
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Mining progress bar
        this.miningBar = this.add.rectangle(512, 550, 0, 10, 0xffff00);
        this.miningBar.setVisible(false);
    }

    update(time, delta) {
        this.handlePlayerMovement();
        this.handleMining(delta);
        this.updateWaveLogic(delta);
        this.updateEnemies();
        this.checkDomeCollision();
        this.updateUI();
    }

    handlePlayerMovement() {
        if (this.mining) return;

        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

        // Check if player is in dome area
        const domeArea = new Phaser.Geom.Rectangle(430, 50, 164, 130);
        this.inDome = domeArea.contains(this.player.x, this.player.y);

        // Deposit resources when entering dome
        if (this.inDome && (this.carriedIron > 0 || this.carriedWater > 0)) {
            this.iron += this.carriedIron;
            this.waterRes += this.carriedWater;
            this.carriedIron = 0;
            this.carriedWater = 0;
        }
    }

    handleMining(delta) {
        // Check for mine input
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const gridPos = this.worldToGrid(this.player.x, this.player.y);
            if (gridPos) {
                // Check if we can mine adjacent tile
                const directions = [
                    { dx: 0, dy: 1 },  // down
                    { dx: -1, dy: 0 }, // left
                    { dx: 1, dy: 0 },  // right
                    { dx: 0, dy: -1 }  // up
                ];

                for (const dir of directions) {
                    const nx = gridPos.x + dir.dx;
                    const ny = gridPos.y + dir.dy;

                    if (this.isValidTile(nx, ny) && this.grid[ny][nx] !== 'empty') {
                        this.startMining(nx, ny);
                        break;
                    }
                }
            }
        }

        // Continue mining
        if (this.mining && this.miningTarget) {
            this.miningProgress += delta * this.drillSpeed;
            const requiredTime = 1000; // 1 second base

            this.miningBar.width = (this.miningProgress / requiredTime) * 100;

            if (this.miningProgress >= requiredTime) {
                this.completeMining();
            }
        }
    }

    startMining(gx, gy) {
        const tile = this.grid[gy][gx];
        if (tile === 'empty') return;

        // Check carry capacity
        if (this.carriedIron + this.carriedWater >= this.maxCarry) {
            return; // Inventory full
        }

        this.mining = true;
        this.miningProgress = 0;
        this.miningTarget = { x: gx, y: gy, type: tile };
        this.miningBar.setVisible(true);
        this.player.setVelocity(0, 0);
    }

    completeMining() {
        const { x, y, type } = this.miningTarget;

        // Collect resource
        if (type === 'iron') {
            this.carriedIron++;
        } else if (type === 'water') {
            this.carriedWater++;
        }

        // Clear tile
        this.grid[y][x] = 'empty';
        this.gridSprites[y][x].setTexture('empty');

        // Reset mining state
        this.mining = false;
        this.miningProgress = 0;
        this.miningTarget = null;
        this.miningBar.setVisible(false);
        this.miningBar.width = 0;
    }

    worldToGrid(wx, wy) {
        const gx = Math.floor((wx - this.mineOffsetX) / this.tileSize);
        const gy = Math.floor((wy - this.groundY) / this.tileSize);

        if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
            return { x: gx, y: gy };
        }
        return null;
    }

    isValidTile(gx, gy) {
        return gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight;
    }

    updateWaveLogic(delta) {
        if (!this.waveInProgress) {
            this.waveTimer -= delta;

            if (this.waveTimer <= 0) {
                this.startWave();
            }
        } else {
            // Check if wave is complete
            if (this.enemies.countActive() === 0 && this.enemiesRemaining <= 0) {
                this.endWave();
            }
        }
    }

    startWave() {
        this.wave++;
        this.waveInProgress = true;

        // Calculate enemies for this wave
        const baseEnemies = 3 + this.wave * 2;
        this.enemiesRemaining = baseEnemies;

        // Spawn enemies over time
        this.time.addEvent({
            delay: 1500,
            repeat: baseEnemies - 1,
            callback: () => this.spawnEnemy()
        });

        this.updateWaveText();
    }

    spawnEnemy() {
        if (this.enemiesRemaining <= 0) return;

        // Choose enemy type based on wave
        let types = ['walker'];
        if (this.wave >= 2) types.push('flyer');
        if (this.wave >= 4) types.push('hornet');
        if (this.wave >= 6) types.push('worm');
        if (this.wave >= 8) types.push('diver');

        const type = Phaser.Utils.Array.GetRandom(types);

        // Spawn from edges
        const side = Phaser.Math.Between(0, 1);
        const x = side === 0 ? -30 : 1054;
        const y = Phaser.Math.Between(30, 150);

        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;

        // Set health and speed based on type
        switch (type) {
            case 'walker':
                enemy.health = 20;
                enemy.speed = 40;
                enemy.damage = 5;
                break;
            case 'flyer':
                enemy.health = 15;
                enemy.speed = 70;
                enemy.damage = 3;
                break;
            case 'hornet':
                enemy.health = 25;
                enemy.speed = 60;
                enemy.damage = 8;
                break;
            case 'worm':
                enemy.health = 40;
                enemy.speed = 30;
                enemy.damage = 10;
                break;
            case 'diver':
                enemy.health = 80;
                enemy.speed = 25;
                enemy.damage = 20;
                break;
        }

        this.enemiesRemaining--;
    }

    updateEnemies() {
        this.enemies.children.iterate((enemy) => {
            if (!enemy || !enemy.active) return;

            // Move toward dome
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, 512, 100);
            enemy.setVelocity(
                Math.cos(angle) * enemy.speed,
                Math.sin(angle) * enemy.speed
            );

            // Check dome collision
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, 512, 100);
            if (dist < 50) {
                this.domeHealth -= enemy.damage;
                enemy.destroy();

                // Check game over
                if (this.domeHealth <= 0) {
                    this.gameOver();
                }
            }
        });
    }

    endWave() {
        this.waveInProgress = false;

        if (this.wave >= this.maxWaves) {
            this.victory();
            return;
        }

        // Reset timer for next wave
        this.waveTimer = this.waveDuration;

        // Show upgrade shop
        this.scene.launch('ShopScene', {
            iron: this.iron,
            water: this.waterRes,
            drillSpeed: this.drillSpeed,
            carryCapacity: this.carryCapacity,
            laserDamage: this.laserDamage,
            gameScene: this
        });
        this.scene.pause();
    }

    fireLaser(pointer) {
        if (!this.inDome) return;

        // Create laser from dome toward pointer
        const angle = Phaser.Math.Angle.Between(512, 100, pointer.x, pointer.y);

        const laser = this.lasers.create(512, 100, 'laser');
        laser.setRotation(angle + Math.PI / 2);
        laser.setVelocity(
            Math.cos(angle) * 500,
            Math.sin(angle) * 500
        );
        laser.damage = this.laserDamage;

        // Destroy after 2 seconds
        this.time.delayedCall(2000, () => {
            if (laser.active) laser.destroy();
        });
    }

    hitEnemy(laser, enemy) {
        enemy.health -= laser.damage;
        laser.destroy();

        if (enemy.health <= 0) {
            // Particle effect
            for (let i = 0; i < 5; i++) {
                const p = this.add.sprite(enemy.x, enemy.y, 'particle');
                p.setTint(0xff4444);
                this.tweens.add({
                    targets: p,
                    x: enemy.x + Phaser.Math.Between(-30, 30),
                    y: enemy.y + Phaser.Math.Between(-30, 30),
                    alpha: 0,
                    duration: 300,
                    onComplete: () => p.destroy()
                });
            }
            enemy.destroy();
        }
    }

    checkDomeCollision() {
        // Enemies damaging dome handled in updateEnemies
    }

    updateUI() {
        // Health bar
        const healthPercent = this.domeHealth / this.maxDomeHealth;
        this.healthBar.width = 150 * healthPercent;
        this.healthBar.fillColor = healthPercent > 0.5 ? 0x44ff44 : (healthPercent > 0.25 ? 0xffff00 : 0xff4444);

        // Resources
        this.ironText.setText(this.iron.toString());
        this.waterText.setText(this.waterRes.toString());

        // Carried
        const carried = this.carriedIron + this.carriedWater;
        this.carriedText.setText(`Carrying: ${carried}/${this.maxCarry} (Iron: ${this.carriedIron}, Water: ${this.carriedWater})`);

        // Wave timer
        this.updateWaveText();
    }

    updateWaveText() {
        this.waveText.setText(`Wave ${this.wave}/${this.maxWaves}`);

        if (this.waveInProgress) {
            this.waveTimerText.setText(`Enemies: ${this.enemies.countActive()}`);
        } else {
            const seconds = Math.ceil(this.waveTimer / 1000);
            this.waveTimerText.setText(`Next wave in ${seconds}s`);
        }
    }

    applyUpgrades(upgrades) {
        this.iron = upgrades.iron;
        this.waterRes = upgrades.water;
        this.drillSpeed = upgrades.drillSpeed;
        this.carryCapacity = upgrades.carryCapacity;
        this.maxCarry = this.carryCapacity;
        this.laserDamage = upgrades.laserDamage;
    }

    gameOver() {
        this.scene.start('GameOverScene', { wave: this.wave, victory: false });
    }

    victory() {
        this.scene.start('GameOverScene', { wave: this.wave, victory: true });
    }
}

class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.iron = data.iron;
        this.waterRes = data.water;
        this.drillSpeed = data.drillSpeed;
        this.carryCapacity = data.carryCapacity;
        this.laserDamage = data.laserDamage;
        this.gameScene = data.gameScene;
    }

    create() {
        // Overlay
        this.add.rectangle(512, 300, 1024, 600, 0x000000, 0.8);

        this.add.text(512, 100, 'UPGRADE SHOP', {
            fontSize: '48px',
            fill: '#ffcc00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Resources display
        this.ironText = this.add.text(400, 160, `Iron: ${this.iron}`, {
            fontSize: '24px',
            fill: '#8899aa'
        });
        this.waterText = this.add.text(550, 160, `Water: ${this.waterRes}`, {
            fontSize: '24px',
            fill: '#44ddff'
        });

        // Upgrades
        const upgrades = [
            { name: 'Drill Speed', key: 'drillSpeed', current: this.drillSpeed, cost: { iron: 5, water: 0 }, max: 5 },
            { name: 'Carry Capacity', key: 'carryCapacity', current: this.carryCapacity, cost: { iron: 3, water: 2 }, max: 15 },
            { name: 'Laser Damage', key: 'laserDamage', current: this.laserDamage, cost: { iron: 2, water: 3 }, max: 50 }
        ];

        this.upgradeButtons = [];

        upgrades.forEach((upgrade, i) => {
            const y = 230 + i * 80;

            this.add.text(300, y, upgrade.name, {
                fontSize: '24px',
                fill: '#fff'
            });

            const valueText = this.add.text(500, y, `Level: ${upgrade.current}`, {
                fontSize: '20px',
                fill: '#8f8'
            });

            const costText = this.add.text(620, y, `Cost: ${upgrade.cost.iron} Iron, ${upgrade.cost.water} Water`, {
                fontSize: '16px',
                fill: '#888'
            });

            const btn = this.add.text(500, y + 30, '[ UPGRADE ]', {
                fontSize: '20px',
                fill: '#4f4'
            }).setInteractive();

            btn.on('pointerover', () => btn.setFill('#8f8'));
            btn.on('pointerout', () => btn.setFill('#4f4'));
            btn.on('pointerdown', () => {
                if (this.iron >= upgrade.cost.iron && this.waterRes >= upgrade.cost.water) {
                    if (this[upgrade.key] < upgrade.max) {
                        this.iron -= upgrade.cost.iron;
                        this.waterRes -= upgrade.cost.water;
                        this[upgrade.key]++;
                        valueText.setText(`Level: ${this[upgrade.key]}`);
                        this.ironText.setText(`Iron: ${this.iron}`);
                        this.waterText.setText(`Water: ${this.waterRes}`);
                    }
                }
            });

            this.upgradeButtons.push(btn);
        });

        // Continue button
        const continueBtn = this.add.text(512, 500, '[ CONTINUE ]', {
            fontSize: '32px',
            fill: '#ff8'
        }).setOrigin(0.5).setInteractive();

        continueBtn.on('pointerover', () => continueBtn.setFill('#ffa'));
        continueBtn.on('pointerout', () => continueBtn.setFill('#ff8'));
        continueBtn.on('pointerdown', () => {
            this.gameScene.applyUpgrades({
                iron: this.iron,
                water: this.waterRes,
                drillSpeed: this.drillSpeed,
                carryCapacity: this.carryCapacity,
                laserDamage: this.laserDamage
            });
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.wave = data.wave;
        this.victory = data.victory;
    }

    create() {
        const centerX = 512;

        if (this.victory) {
            this.add.text(centerX, 200, 'VICTORY!', {
                fontSize: '72px',
                fill: '#4f4',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 300, 'You defended the dome!', {
                fontSize: '32px',
                fill: '#8f8',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 200, 'DOME DESTROYED', {
                fontSize: '64px',
                fill: '#f44',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 300, `Survived ${this.wave} waves`, {
                fontSize: '32px',
                fill: '#f88',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        const restartBtn = this.add.text(centerX, 450, '[ PLAY AGAIN ]', {
            fontSize: '32px',
            fill: '#ff8',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#ffa'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#ff8'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

        const menuBtn = this.add.text(centerX, 510, '[ MAIN MENU ]', {
            fontSize: '24px',
            fill: '#888',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setFill('#aaa'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, ShopScene, GameOverScene]
};

const game = new Phaser.Game(config);
