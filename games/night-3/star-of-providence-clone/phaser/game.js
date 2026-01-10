// Star of Providence Clone - Phaser 3 Version (Expanded + Polished)
const COLORS = {
    background: 0x0a0a15,
    floorDark: 0x2a1a0a,
    floorLight: 0x3a2810,
    wallDark: 0x483018,
    wallLight: 0x584020,
    uiGreen: 0x00ff88,
    uiGreenDark: 0x00aa55,
    uiRed: 0xff4444,
    uiOrange: 0xff8800,
    player: 0x00ffaa,
    playerGlow: 0x00ff88,
    bulletPlayer: 0xffff00,
    bulletPlayerSuper: 0xff8800,
    bulletEnemy: 0xff4444,
    bulletEnemyOrange: 0xff6600,
    bulletHoming: 0xff00ff,
    debris: 0xffcc00,
    ghost: 0x4488aa,
    drone: 0x888899,
    turret: 0xaa6644,
    charger: 0xcc4488,
    spawner: 0x66aa66,
    boss: 0xff4466,
    elite: 0xaa00ff,
    heart: 0x00ff66,
    energy: 0x00ccff,
    critical: 0xffff00
};

const TILE_SIZE = 32;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;

// Salvage upgrades
const SALVAGES = [
    { id: 'damage', name: 'DAMAGE UP', desc: '+25% damage' },
    { id: 'speed', name: 'SPEED UP', desc: '+15% speed' },
    { id: 'firerate', name: 'FIRE RATE', desc: '+20% fire rate' },
    { id: 'health', name: 'VITALITY', desc: '+1 max HP' },
    { id: 'crit', name: 'CRITICAL', desc: '+10% crit chance' },
    { id: 'bullets', name: 'MULTI-SHOT', desc: '+1 bullet' },
    { id: 'lifesteal', name: 'LIFESTEAL', desc: 'Heal on kills' },
    { id: 'homing', name: 'HOMING', desc: 'Bullets track' },
    { id: 'piercing', name: 'PIERCING', desc: 'Bullets pierce' },
    { id: 'shield', name: 'SHIELD', desc: '+1 shield hit' }
];

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Player ship
        const playerGfx = this.make.graphics({ add: false });
        playerGfx.fillStyle(COLORS.player, 0.5);
        playerGfx.fillRect(12, 20, 8, 6);
        playerGfx.fillStyle(COLORS.player);
        playerGfx.beginPath();
        playerGfx.moveTo(16, 4);
        playerGfx.lineTo(8, 24);
        playerGfx.lineTo(16, 18);
        playerGfx.lineTo(24, 24);
        playerGfx.closePath();
        playerGfx.fillPath();
        playerGfx.fillStyle(0xffffff);
        playerGfx.fillRect(14, 10, 4, 4);
        playerGfx.generateTexture('player', 32, 32);

        // Player bullet
        const bulletGfx = this.make.graphics({ add: false });
        bulletGfx.fillStyle(COLORS.bulletPlayer);
        bulletGfx.fillRect(0, 2, 12, 4);
        bulletGfx.fillStyle(0xffffff);
        bulletGfx.fillRect(8, 3, 4, 2);
        bulletGfx.generateTexture('playerBullet', 12, 8);

        // Super bullet
        const superBulletGfx = this.make.graphics({ add: false });
        superBulletGfx.fillStyle(COLORS.bulletPlayerSuper);
        superBulletGfx.fillRect(0, 1, 18, 6);
        superBulletGfx.fillStyle(0xffffff);
        superBulletGfx.fillRect(12, 2, 6, 4);
        superBulletGfx.generateTexture('superBullet', 18, 8);

        // Enemy bullet
        const enemyBulletGfx = this.make.graphics({ add: false });
        enemyBulletGfx.fillStyle(COLORS.bulletEnemy);
        enemyBulletGfx.fillCircle(6, 6, 6);
        enemyBulletGfx.fillStyle(0x800000);
        enemyBulletGfx.fillCircle(6, 6, 3);
        enemyBulletGfx.generateTexture('enemyBullet', 12, 12);

        // Homing bullet
        const homingBulletGfx = this.make.graphics({ add: false });
        homingBulletGfx.fillStyle(COLORS.bulletHoming);
        homingBulletGfx.fillCircle(6, 6, 6);
        homingBulletGfx.fillStyle(0x400040);
        homingBulletGfx.fillCircle(6, 6, 3);
        homingBulletGfx.generateTexture('homingBullet', 12, 12);

        // Ghost enemy
        const ghostGfx = this.make.graphics({ add: false });
        ghostGfx.fillStyle(COLORS.ghost);
        ghostGfx.fillCircle(16, 14, 14);
        ghostGfx.fillStyle(0x000000);
        ghostGfx.fillRect(10, 10, 4, 4);
        ghostGfx.fillRect(18, 10, 4, 4);
        ghostGfx.fillStyle(COLORS.ghost);
        for (let i = 0; i < 4; i++) ghostGfx.fillRect(6 + i * 6, 24, 4, 6);
        ghostGfx.generateTexture('ghost', 32, 32);

        // Drone enemy
        const droneGfx = this.make.graphics({ add: false });
        droneGfx.fillStyle(COLORS.drone);
        droneGfx.beginPath();
        droneGfx.moveTo(16, 4);
        droneGfx.lineTo(6, 24);
        droneGfx.lineTo(16, 18);
        droneGfx.lineTo(26, 24);
        droneGfx.closePath();
        droneGfx.fillPath();
        droneGfx.fillStyle(0xff0000);
        droneGfx.fillRect(14, 10, 4, 4);
        droneGfx.generateTexture('drone', 32, 32);

        // Turret enemy
        const turretGfx = this.make.graphics({ add: false });
        turretGfx.fillStyle(COLORS.turret);
        turretGfx.fillRect(4, 4, 28, 28);
        turretGfx.fillStyle(0x666666);
        turretGfx.fillRect(14, 0, 8, 12);
        turretGfx.fillStyle(0xff4400);
        turretGfx.fillCircle(18, 18, 8);
        turretGfx.generateTexture('turret', 36, 36);

        // Charger enemy
        const chargerGfx = this.make.graphics({ add: false });
        chargerGfx.fillStyle(COLORS.charger);
        chargerGfx.beginPath();
        chargerGfx.moveTo(28, 16);
        chargerGfx.lineTo(8, 4);
        chargerGfx.lineTo(8, 28);
        chargerGfx.closePath();
        chargerGfx.fillPath();
        chargerGfx.fillStyle(0xff0000);
        chargerGfx.fillRect(18, 14, 6, 4);
        chargerGfx.generateTexture('charger', 32, 32);

        // Spawner enemy
        const spawnerGfx = this.make.graphics({ add: false });
        spawnerGfx.fillStyle(COLORS.spawner);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            spawnerGfx.fillCircle(20 + Math.cos(a) * 12, 20 + Math.sin(a) * 12, 5);
        }
        spawnerGfx.fillStyle(0x00ff00);
        spawnerGfx.fillCircle(20, 20, 8);
        spawnerGfx.generateTexture('spawner', 40, 40);

        // Boss
        const bossGfx = this.make.graphics({ add: false });
        bossGfx.fillStyle(COLORS.boss);
        bossGfx.fillCircle(40, 40, 38);
        bossGfx.fillStyle(0x200020);
        bossGfx.fillCircle(40, 40, 28);
        bossGfx.fillStyle(0xff0000);
        bossGfx.fillRect(24, 32, 8, 6);
        bossGfx.fillRect(48, 32, 8, 6);
        bossGfx.fillStyle(0xff4400);
        bossGfx.fillRect(28, 48, 24, 8);
        bossGfx.generateTexture('boss', 80, 80);

        // Debris pickup
        const debrisGfx = this.make.graphics({ add: false });
        debrisGfx.fillStyle(COLORS.debris);
        debrisGfx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = 8 + Math.cos(angle) * 6;
            const y = 8 + Math.sin(angle) * 6;
            if (i === 0) debrisGfx.moveTo(x, y);
            else debrisGfx.lineTo(x, y);
        }
        debrisGfx.closePath();
        debrisGfx.fillPath();
        debrisGfx.generateTexture('debris', 16, 16);

        // Health pickup
        const healthGfx = this.make.graphics({ add: false });
        healthGfx.fillStyle(COLORS.heart);
        healthGfx.fillCircle(5, 5, 4);
        healthGfx.fillCircle(11, 5, 4);
        healthGfx.beginPath();
        healthGfx.moveTo(1, 6);
        healthGfx.lineTo(8, 14);
        healthGfx.lineTo(15, 6);
        healthGfx.closePath();
        healthGfx.fillPath();
        healthGfx.generateTexture('health', 16, 16);

        // Bomb pickup
        const bombGfx = this.make.graphics({ add: false });
        bombGfx.fillStyle(COLORS.uiOrange);
        bombGfx.fillRect(2, 2, 12, 12);
        bombGfx.fillStyle(0x000000);
        bombGfx.fillRect(6, 0, 4, 4);
        bombGfx.generateTexture('bomb', 16, 16);

        // Floor tiles
        const floorGfx = this.make.graphics({ add: false });
        floorGfx.fillStyle(COLORS.floorLight);
        floorGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        floorGfx.generateTexture('floorLight', TILE_SIZE, TILE_SIZE);

        const floorDarkGfx = this.make.graphics({ add: false });
        floorDarkGfx.fillStyle(COLORS.floorDark);
        floorDarkGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        floorDarkGfx.generateTexture('floorDark', TILE_SIZE, TILE_SIZE);

        // Wall tile
        const wallGfx = this.make.graphics({ add: false });
        wallGfx.fillStyle(COLORS.wallDark);
        wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        wallGfx.fillStyle(COLORS.wallLight);
        wallGfx.fillRect(2, 2, 12, 10);
        wallGfx.fillRect(18, 2, 12, 10);
        wallGfx.fillRect(8, 16, 16, 10);
        wallGfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        // Preserve stats across rooms if provided
        if (data && data.playerStats) {
            this.playerStats = data.playerStats;
            this.gameState = data.gameState;
            // Start new room
            this.gameState.wave = 1;
            this.gameState.state = 'playing';
        } else {
            this.gameState = {
                floor: 1,
                roomsCleared: 0,
                debris: 0,
                multiplier: 1.0,
                wave: 1,
                maxWave: 5,
                combo: 0,
                comboTimer: 0,
                comboMultiplier: 1,
                bossActive: false,
                salvageChoices: [],
                state: 'playing',
                roomsVisited: [[true]], // Minimap tracking - start at 0,0
                currentRoomX: 0,
                currentRoomY: 0
            };

            this.playerStats = {
                hp: 4,
                maxHp: 4,
                bombs: 2,
                maxBombs: 3,
                speed: 250,
                focusSpeed: 100,
                fireRate: 10,
                damage: 1,
                bulletCount: 1,
                critChance: 0.1,
                lifesteal: 0,
                shield: 0,
                hasHoming: false,
                hasPiercing: false
            };
        }

        this.fireCooldown = 0;
        this.dashCooldown = 0;
        this.invincible = 0;
        this.isFocused = false;
        this.isDashing = false;
        this.superShotCharge = 0;
        this.damageNumbers = [];
        this.roomClearing = false;
    }

    create() {
        this.roomOffsetX = (800 - ROOM_WIDTH * TILE_SIZE) / 2;
        this.roomOffsetY = 80;

        this.add.rectangle(400, 300, 800, 600, COLORS.background);

        this.floorTiles = this.add.group();
        this.wallTiles = this.add.group();
        this.generateRoom();

        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        this.player = this.physics.add.sprite(400, 400, 'player');
        this.player.setDepth(10);

        this.spawnWave();

        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            dash: 'Z', altDash: 'Q', focus: 'SHIFT', fire: 'SPACE', bomb: 'E'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.isShooting = true;
            if (pointer.rightButtonDown()) this.isFocused = true;
        });

        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) {
                this.isShooting = false;
                if (this.superShotCharge >= 1) this.fireSuperShot();
                this.superShotCharge = 0;
            }
            if (!pointer.rightButtonDown()) this.isFocused = false;
        });

        this.input.keyboard.on('keydown-Z', () => this.dash());
        this.input.keyboard.on('keydown-Q', () => this.dash());
        this.input.keyboard.on('keydown-E', () => this.useBomb());

        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        this.createHUD();

        window.gameState = this.gameState;
        window.player = this.playerStats;
        window.enemies = this.enemies.getChildren();
    }

    generateRoom() {
        this.floorTiles.clear(true, true);
        this.wallTiles.clear(true, true);

        for (let y = 0; y < ROOM_HEIGHT; y++) {
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const tx = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const ty = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;

                if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
                    const isDoor = (y === 0 && x === 10) || (y === ROOM_HEIGHT - 1 && x === 10) ||
                                   (x === 0 && y === 7) || (x === ROOM_WIDTH - 1 && y === 7);
                    if (!isDoor) {
                        const wall = this.add.image(tx, ty, 'wall');
                        this.wallTiles.add(wall);
                    } else {
                        const floor = this.add.image(tx, ty, 'floorDark');
                        this.floorTiles.add(floor);
                    }
                } else {
                    const isLight = (x + y) % 2 === 0;
                    const floor = this.add.image(tx, ty, isLight ? 'floorLight' : 'floorDark');
                    this.floorTiles.add(floor);
                }
            }
        }

        const pillarCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < pillarCount; i++) {
            const px = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
            const py = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
            const tx = this.roomOffsetX + px * TILE_SIZE + TILE_SIZE / 2;
            const ty = this.roomOffsetY + py * TILE_SIZE + TILE_SIZE / 2;
            const pillar = this.add.image(tx, ty, 'wall');
            this.wallTiles.add(pillar);
        }

        const border = this.add.graphics();
        border.lineStyle(2, COLORS.uiGreen, 0.5);
        border.strokeRect(this.roomOffsetX, this.roomOffsetY, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    }

    spawnWave() {
        this.enemies.clear(true, true);

        // Boss on wave 5
        if (this.gameState.wave === this.gameState.maxWave && this.gameState.roomsCleared > 0 && this.gameState.roomsCleared % 3 === 0) {
            this.spawnBoss();
            return;
        }

        const count = 3 + this.gameState.floor + this.gameState.wave + Math.floor(this.gameState.roomsCleared / 3);

        for (let i = 0; i < count; i++) {
            const types = ['ghost', 'drone', 'turret', 'charger', 'spawner'];
            const weights = [0.35, 0.25, 0.2, 0.12, 0.08];
            const rand = Math.random();
            let cumulative = 0;
            let type = 'ghost';
            for (let j = 0; j < weights.length; j++) {
                cumulative += weights[j];
                if (rand < cumulative) { type = types[j]; break; }
            }

            let x, y, valid = false;
            while (!valid) {
                x = this.roomOffsetX + 80 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 160);
                y = this.roomOffsetY + 80 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 160);
                if (Phaser.Math.Distance.Between(x, y, this.player?.x || 400, this.player?.y || 400) > 150) {
                    valid = true;
                }
            }

            const isElite = Math.random() < 0.1 + this.gameState.floor * 0.02;
            this.createEnemy(type, x, y, isElite);
        }

        window.enemies = this.enemies.getChildren();
    }

    spawnBoss() {
        this.gameState.bossActive = true;
        const boss = this.createEnemy('boss', 400, 200, false);
        boss.hp = 80 + this.gameState.floor * 30;
        boss.maxHp = boss.hp;
        boss.phase = 1;
        boss.attackPattern = 0;

        // Boss health bar
        this.bossHealthBg = this.add.rectangle(400, 70, 400, 16, 0x200020).setDepth(100);
        this.bossHealthFill = this.add.rectangle(200, 70, 396, 12, COLORS.boss).setDepth(101);
        this.bossHealthFill.setOrigin(0, 0.5);
        this.bossNameText = this.add.text(400, 55, 'FLOOR GUARDIAN', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ff4466'
        }).setOrigin(0.5).setDepth(101);
    }

    createEnemy(type, x, y, isElite = false) {
        const configs = {
            ghost: { hp: 3, speed: 80, fireRate: 2000, debris: 10 },
            drone: { hp: 5, speed: 120, fireRate: 1500, debris: 30 },
            turret: { hp: 8, speed: 0, fireRate: 1000, debris: 25 },
            charger: { hp: 6, speed: 200, fireRate: 0, debris: 20 },
            spawner: { hp: 10, speed: 30, fireRate: 3000, debris: 40 },
            boss: { hp: 100, speed: 40, fireRate: 800, debris: 200 }
        };
        const cfg = configs[type];

        const enemy = this.enemies.create(x, y, type);
        enemy.setDepth(8);
        enemy.enemyType = type;
        enemy.hp = cfg.hp * (isElite ? 2 : 1);
        enemy.maxHp = enemy.hp;
        enemy.speed = cfg.speed;
        enemy.fireRate = cfg.fireRate;
        enemy.debris = cfg.debris * (isElite ? 2 : 1);
        enemy.lastFire = Math.random() * 1000;
        enemy.hitFlash = 0;
        enemy.isElite = isElite;
        enemy.chargeTimer = 2;
        enemy.spawnTimer = 5000;
        enemy.phase = 1;
        enemy.attackPattern = 0;

        if (isElite) enemy.setTint(COLORS.elite);
        if (type === 'drone') {
            enemy.setVelocity((Math.random() - 0.5) * cfg.speed * 2, (Math.random() - 0.5) * cfg.speed * 2);
        }

        // Spawn animation
        enemy.setScale(0);
        this.tweens.add({
            targets: enemy,
            scale: isElite ? 1.3 : 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        return enemy;
    }

    dash() {
        if (this.dashCooldown > 0 || this.isDashing) return;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        this.isDashing = true;
        this.invincible = 0.15;

        const dashDist = 120;
        const targetX = Phaser.Math.Clamp(
            this.player.x + Math.cos(angle) * dashDist,
            this.roomOffsetX + 20, this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 20
        );
        const targetY = Phaser.Math.Clamp(
            this.player.y + Math.sin(angle) * dashDist,
            this.roomOffsetY + 20, this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 20
        );

        // Dash afterimages
        for (let i = 0; i < 5; i++) {
            const ghost = this.add.sprite(
                this.player.x + (targetX - this.player.x) * (i / 5),
                this.player.y + (targetY - this.player.y) * (i / 5),
                'player'
            );
            ghost.rotation = this.player.rotation;
            ghost.setTint(COLORS.playerGlow);
            ghost.setAlpha(0.5 - i * 0.1);
            ghost.setDepth(9);
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: 300,
                onComplete: () => ghost.destroy()
            });
        }

        this.tweens.add({
            targets: this.player,
            x: targetX, y: targetY,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.isDashing = false;
                this.dashCooldown = 0.5;
            }
        });
    }

    useBomb() {
        if (this.playerStats.bombs <= 0) return;
        this.playerStats.bombs--;

        this.enemyBullets.clear(true, true);

        this.enemies.getChildren().forEach(enemy => {
            enemy.hp -= 10;
            enemy.setTint(0xffffff);
            this.time.delayedCall(100, () => {
                if (enemy.active) enemy.clearTint();
            });
            if (enemy.hp <= 0) this.killEnemy(enemy);
        });

        this.cameras.main.flash(200, 255, 136, 0);
        this.cameras.main.shake(200, 0.02);

        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const particle = this.add.rectangle(this.player.x, this.player.y, 6, 6, COLORS.uiOrange);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: this.player.x + Math.cos(angle) * 200,
                y: this.player.y + Math.sin(angle) * 200,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
    }

    fireSuperShot() {
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        for (let i = -3; i <= 3; i++) {
            const a = angle + i * 0.1;
            const bullet = this.playerBullets.create(
                this.player.x + Math.cos(a) * 15,
                this.player.y + Math.sin(a) * 15,
                'superBullet'
            );
            bullet.rotation = a;
            bullet.setVelocity(Math.cos(a) * 900, Math.sin(a) * 900);
            bullet.damage = this.playerStats.damage * 3;
            bullet.isSuper = true;
            bullet.piercing = true;
            bullet.pierceCount = 5;

            this.time.delayedCall(800, () => { if (bullet.active) bullet.destroy(); });
        }

        this.cameras.main.shake(100, 0.01);
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(100);

        // Weapon panel
        const weaponPanel = this.add.graphics();
        weaponPanel.lineStyle(2, COLORS.uiGreen);
        weaponPanel.strokeRect(this.roomOffsetX, 15, 120, 50);
        weaponPanel.fillStyle(COLORS.background);
        weaponPanel.fillRect(this.roomOffsetX + 2, 17, 116, 46);
        this.hudContainer.add(weaponPanel);

        const weaponIcon = this.add.graphics();
        weaponIcon.fillStyle(COLORS.uiGreen);
        weaponIcon.fillRect(this.roomOffsetX + 10, 25, 30, 20);
        weaponIcon.fillStyle(0x000000);
        weaponIcon.fillRect(this.roomOffsetX + 12, 27, 26, 16);
        weaponIcon.fillStyle(COLORS.bulletPlayer);
        weaponIcon.fillRect(this.roomOffsetX + 15, 32, 20, 6);
        this.hudContainer.add(weaponIcon);

        this.ammoText = this.add.text(this.roomOffsetX + 50, 30, '∞', {
            fontSize: '12px', fontFamily: 'monospace', color: '#00ff88'
        });
        this.hudContainer.add(this.ammoText);

        this.bombIndicators = [];
        for (let i = 0; i < 3; i++) {
            const bomb = this.add.rectangle(this.roomOffsetX + 14 + i * 12, 56, 8, 8, COLORS.uiOrange);
            this.bombIndicators.push(bomb);
            this.hudContainer.add(bomb);
        }

        // Hearts
        this.hearts = [];
        const hpStartX = 280;
        for (let i = 0; i < 6; i++) {
            const heart = this.add.graphics();
            if (i < 4) this.drawHeart(heart, hpStartX + i * 24, 30, true);
            this.hearts.push(heart);
            this.hudContainer.add(heart);
        }

        // Shield indicators
        this.shieldIndicators = [];
        for (let i = 0; i < 3; i++) {
            const shield = this.add.graphics();
            shield.lineStyle(2, COLORS.energy);
            shield.strokeCircle(hpStartX + 100 + i * 20, 30, 8);
            shield.setVisible(false);
            this.shieldIndicators.push(shield);
            this.hudContainer.add(shield);
        }

        // Multiplier panel
        const rightX = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 120;
        const multPanel = this.add.graphics();
        multPanel.lineStyle(2, COLORS.uiGreen);
        multPanel.strokeRect(rightX, 15, 120, 50);
        multPanel.fillStyle(COLORS.background);
        multPanel.fillRect(rightX + 2, 17, 116, 46);
        this.hudContainer.add(multPanel);

        this.multiplierText = this.add.text(rightX + 110, 28, 'x1.0', {
            fontSize: '14px', fontFamily: 'monospace', color: '#00ff88'
        }).setOrigin(1, 0);
        this.hudContainer.add(this.multiplierText);

        this.debrisText = this.add.text(rightX + 110, 48, '0G', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00'
        }).setOrigin(1, 0);
        this.hudContainer.add(this.debrisText);

        // Floor/wave info
        this.floorText = this.add.text(400, 575, 'FLOOR 1 - ROOM 1 - WAVE 1/5', {
            fontSize: '12px', fontFamily: 'monospace', color: '#00ff88'
        }).setOrigin(0.5);
        this.hudContainer.add(this.floorText);

        this.enemyCountText = this.add.text(780, 575, 'ENEMIES: 0', {
            fontSize: '12px', fontFamily: 'monospace', color: '#00ff88'
        }).setOrigin(1, 0.5);
        this.hudContainer.add(this.enemyCountText);

        // Combo display
        this.comboText = this.add.text(400, 95, '', {
            fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ff8800'
        }).setOrigin(0.5);
        this.hudContainer.add(this.comboText);

        // Key hints
        this.add.text(15, 590, 'WASD:Move | LMB:Shoot | RMB:Focus | Z:Dash | E:Bomb', {
            fontSize: '10px', fontFamily: 'monospace', color: '#444444'
        }).setDepth(100);

        // Minimap
        this.minimapContainer = this.add.container(730, 85).setDepth(100);
        const minimapBg = this.add.rectangle(0, 0, 60, 60, 0x000000, 0.7);
        const minimapBorder = this.add.graphics();
        minimapBorder.lineStyle(2, COLORS.uiGreen);
        minimapBorder.strokeRect(-30, -30, 60, 60);
        this.minimapContainer.add([minimapBg, minimapBorder]);

        this.minimapRooms = this.add.graphics();
        this.minimapContainer.add(this.minimapRooms);

        this.updateMinimap();
    }

    updateMinimap() {
        if (!this.minimapRooms) return;
        this.minimapRooms.clear();

        const cellSize = 10;
        const centerX = 0;
        const centerY = 0;

        // Draw visited rooms
        const visited = this.gameState.roomsVisited || [[true]];
        const currentX = this.gameState.currentRoomX || 0;
        const currentY = this.gameState.currentRoomY || 0;

        for (let y = 0; y < visited.length; y++) {
            for (let x = 0; x < (visited[y] ? visited[y].length : 0); x++) {
                if (visited[y] && visited[y][x]) {
                    const rx = centerX + (x - currentX) * (cellSize + 2);
                    const ry = centerY + (y - currentY) * (cellSize + 2);

                    // Check if room is in visible area
                    if (Math.abs(rx) < 25 && Math.abs(ry) < 25) {
                        if (x === currentX && y === currentY) {
                            // Current room - bright green
                            this.minimapRooms.fillStyle(COLORS.uiGreen);
                        } else {
                            // Visited room - dim green
                            this.minimapRooms.fillStyle(COLORS.uiGreenDark);
                        }
                        this.minimapRooms.fillRect(rx - cellSize/2, ry - cellSize/2, cellSize, cellSize);
                    }
                }
            }
        }

        // Draw potential next rooms (adjacent to current)
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        directions.forEach(([dx, dy]) => {
            const nx = currentX + dx;
            const ny = currentY + dy;
            if (nx >= 0 && ny >= 0) {
                const isVisited = visited[ny] && visited[ny][nx];
                if (!isVisited) {
                    const rx = centerX + dx * (cellSize + 2);
                    const ry = centerY + dy * (cellSize + 2);
                    this.minimapRooms.fillStyle(0x333333);
                    this.minimapRooms.fillRect(rx - cellSize/2, ry - cellSize/2, cellSize, cellSize);
                }
            }
        });
    }

    drawHeart(graphics, x, y, filled) {
        graphics.clear();
        if (filled) {
            graphics.fillStyle(COLORS.heart);
            graphics.fillCircle(x - 5, y - 4, 6);
            graphics.fillCircle(x + 5, y - 4, 6);
            graphics.beginPath();
            graphics.moveTo(x - 10, y - 2);
            graphics.lineTo(x, y + 10);
            graphics.lineTo(x + 10, y - 2);
            graphics.closePath();
            graphics.fillPath();
        } else {
            graphics.lineStyle(2, COLORS.uiGreenDark);
            graphics.strokeCircle(x - 5, y - 4, 6);
            graphics.strokeCircle(x + 5, y - 4, 6);
            graphics.beginPath();
            graphics.moveTo(x - 10, y - 2);
            graphics.lineTo(x, y + 10);
            graphics.lineTo(x + 10, y - 2);
            graphics.closePath();
            graphics.strokePath();
        }
    }

    updateHUD() {
        for (let i = 0; i < this.hearts.length; i++) {
            if (i < this.playerStats.maxHp) {
                this.drawHeart(this.hearts[i], 280 + i * 24, 30, i < this.playerStats.hp);
                this.hearts[i].setVisible(true);
            } else {
                this.hearts[i].setVisible(false);
            }
        }

        for (let i = 0; i < this.shieldIndicators.length; i++) {
            this.shieldIndicators[i].setVisible(i < this.playerStats.shield);
        }

        for (let i = 0; i < this.bombIndicators.length; i++) {
            this.bombIndicators[i].setFillStyle(i < this.playerStats.bombs ? COLORS.uiOrange : 0x333333);
        }

        this.multiplierText.setText(`x${this.gameState.multiplier.toFixed(1)}`);
        this.debrisText.setText(`${this.gameState.debris}G`);
        this.floorText.setText(`FLOOR ${this.gameState.floor} - ROOM ${this.gameState.roomsCleared + 1} - WAVE ${this.gameState.wave}/${this.gameState.maxWave}`);
        this.enemyCountText.setText(`ENEMIES: ${this.enemies.countActive()}`);

        if (this.gameState.combo > 1) {
            this.comboText.setText(`${this.gameState.combo}x COMBO`);
            this.comboText.setAlpha(1);
        } else {
            this.comboText.setAlpha(0);
        }

        if (this.gameState.bossActive && this.bossHealthFill) {
            const boss = this.enemies.getChildren().find(e => e.enemyType === 'boss');
            if (boss) {
                this.bossHealthFill.width = 396 * (boss.hp / boss.maxHp);
            }
        }

        // Update minimap
        this.updateMinimap();
    }

    update(time, delta) {
        if (this.gameState.state !== 'playing') return;

        const dt = delta / 1000;

        this.fireCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

        if (this.gameState.comboTimer > 0) {
            this.gameState.comboTimer -= dt;
            if (this.gameState.comboTimer <= 0) {
                this.gameState.combo = 0;
                this.gameState.comboMultiplier = 1;
            }
        }

        if (!this.isDashing) {
            let vx = 0, vy = 0;
            if (this.cursors.left.isDown) vx -= 1;
            if (this.cursors.right.isDown) vx += 1;
            if (this.cursors.up.isDown) vy -= 1;
            if (this.cursors.down.isDown) vy += 1;

            if (vx && vy) { vx *= 0.707; vy *= 0.707; }

            this.isFocused = this.cursors.focus.isDown || this.input.activePointer.rightButtonDown();
            const speed = this.isFocused ? this.playerStats.focusSpeed : this.playerStats.speed;

            this.player.setVelocity(vx * speed, vy * speed);

            this.player.x = Phaser.Math.Clamp(this.player.x, this.roomOffsetX + 20, this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 20);
            this.player.y = Phaser.Math.Clamp(this.player.y, this.roomOffsetY + 20, this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 20);
        }

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        this.player.rotation = angle + Math.PI / 2;

        // Super shot charge
        if (this.input.activePointer.rightButtonDown() && this.isFocused) {
            this.superShotCharge = Math.min(1, this.superShotCharge + dt);
        }

        // Shooting
        if ((this.isShooting || this.cursors.fire.isDown) && this.fireCooldown <= 0 && !this.isFocused) {
            this.firePlayerBullet(angle);
            this.fireCooldown = 1 / this.playerStats.fireRate;
        }

        if (this.invincible > 0) {
            this.player.alpha = Math.floor(this.invincible * 20) % 2 === 0 ? 0.3 : 1;
        } else {
            this.player.alpha = 1;
        }

        this.enemies.getChildren().forEach(enemy => this.updateEnemy(enemy, time, dt));

        // Update homing bullets
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.homing) {
                const toPlayer = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
                let angleDiff = toPlayer - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const newAngle = currentAngle + angleDiff * dt * 2;
                const speed = Math.sqrt(bullet.body.velocity.x ** 2 + bullet.body.velocity.y ** 2);
                bullet.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
            }
        });

        // Update player homing bullets
        this.playerBullets.getChildren().forEach(bullet => {
            if (bullet.homing && this.enemies.countActive() > 0) {
                let closest = null, closestDist = Infinity;
                this.enemies.getChildren().forEach(e => {
                    const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
                    if (d < closestDist) { closestDist = d; closest = e; }
                });
                if (closest && closestDist < 200) {
                    const toEnemy = Phaser.Math.Angle.Between(bullet.x, bullet.y, closest.x, closest.y);
                    const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
                    let angleDiff = toEnemy - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    const newAngle = currentAngle + angleDiff * dt * 5;
                    const speed = Math.sqrt(bullet.body.velocity.x ** 2 + bullet.body.velocity.y ** 2);
                    bullet.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
                    bullet.rotation = newAngle;
                }
            }
        });

        // Pickup magnet
        this.pickups.getChildren().forEach(pickup => {
            const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 100) {
                const angle = Phaser.Math.Angle.Between(pickup.x, pickup.y, this.player.x, this.player.y);
                const pull = (100 - dist) / 100 * 300;
                pickup.x += Math.cos(angle) * pull * dt;
                pickup.y += Math.sin(angle) * pull * dt;
            }
        });

        this.updateHUD();

        // Check wave/room clear
        if (this.enemies.countActive() === 0 && !this.roomClearing) {
            if (this.gameState.bossActive) {
                this.gameState.bossActive = false;
                if (this.bossHealthBg) this.bossHealthBg.destroy();
                if (this.bossHealthFill) this.bossHealthFill.destroy();
                if (this.bossNameText) this.bossNameText.destroy();
                this.bossDefeated();
            } else if (this.gameState.wave < this.gameState.maxWave) {
                this.gameState.wave++;
                this.time.delayedCall(1000, () => this.spawnWave());
            } else {
                this.roomCleared();
            }
        }
    }

    firePlayerBullet(angle) {
        const spread = this.isFocused ? 0 : 0.1;

        for (let i = 0; i < this.playerStats.bulletCount; i++) {
            const offset = this.playerStats.bulletCount > 1 ? (i - (this.playerStats.bulletCount - 1) / 2) * 0.15 : 0;
            const bulletAngle = angle + (Math.random() - 0.5) * spread + offset;
            const isCrit = Math.random() < this.playerStats.critChance;

            const bullet = this.playerBullets.create(
                this.player.x + Math.cos(bulletAngle) * 15,
                this.player.y + Math.sin(bulletAngle) * 15,
                'playerBullet'
            );
            bullet.rotation = bulletAngle;
            bullet.setVelocity(Math.cos(bulletAngle) * 600, Math.sin(bulletAngle) * 600);
            bullet.damage = this.playerStats.damage * (isCrit ? 2 : 1);
            bullet.isCrit = isCrit;
            bullet.homing = this.playerStats.hasHoming;
            bullet.piercing = this.playerStats.hasPiercing;
            bullet.pierceCount = 3;

            this.time.delayedCall(1000, () => { if (bullet.active) bullet.destroy(); });
        }

        // Muzzle flash
        const flash = this.add.circle(
            this.player.x + Math.cos(angle) * 18,
            this.player.y + Math.sin(angle) * 18,
            8, COLORS.bulletPlayer, 0.8
        );
        this.tweens.add({
            targets: flash,
            alpha: 0, scale: 0,
            duration: 80,
            onComplete: () => flash.destroy()
        });
    }

    updateEnemy(enemy, time, dt) {
        if (!enemy.active) return;

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        const minX = this.roomOffsetX + 30;
        const maxX = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - 30;
        const minY = this.roomOffsetY + 30;
        const maxY = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - 30;

        if (enemy.enemyType === 'ghost') {
            if (dist > 50) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else {
                enemy.setVelocity(0, 0);
            }
        } else if (enemy.enemyType === 'drone') {
            if (dist > 200) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            }
            if (enemy.x < minX || enemy.x > maxX) enemy.body.velocity.x *= -1;
            if (enemy.y < minY || enemy.y > maxY) enemy.body.velocity.y *= -1;
        } else if (enemy.enemyType === 'charger') {
            enemy.chargeTimer -= dt;
            if (enemy.chargeTimer <= 0) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed * 2, Math.sin(angle) * enemy.speed * 2);
                enemy.chargeTimer = 2 + Math.random();
            }
            enemy.body.velocity.x *= 0.98;
            enemy.body.velocity.y *= 0.98;
            enemy.rotation = angle;
        } else if (enemy.enemyType === 'spawner') {
            if (dist > 100) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            }
            enemy.spawnTimer -= dt * 1000;
            if (enemy.spawnTimer <= 0 && this.enemies.countActive() < 15) {
                this.createEnemy('ghost', enemy.x, enemy.y, false);
                enemy.spawnTimer = 5000;
            }
        } else if (enemy.enemyType === 'boss') {
            this.updateBoss(enemy, time, dt, dist, angle);
        }

        enemy.x = Phaser.Math.Clamp(enemy.x, minX, maxX);
        enemy.y = Phaser.Math.Clamp(enemy.y, minY, maxY);

        if (enemy.enemyType !== 'charger' && enemy.enemyType !== 'boss') {
            enemy.lastFire -= dt * 1000;
            if (enemy.lastFire <= 0 && dist < 500) {
                this.fireEnemyBullet(enemy, angle);
                enemy.lastFire = enemy.fireRate;
            }
        }

        // Contact damage
        if (this.invincible <= 0 && dist < enemy.displayWidth / 2 + 10) {
            this.playerHit(this.player, null);
        }
    }

    updateBoss(boss, time, dt, dist, angle) {
        const hpRatio = boss.hp / boss.maxHp;
        if (hpRatio < 0.3 && boss.phase < 3) {
            boss.phase = 3;
            boss.fireRate = 400;
        } else if (hpRatio < 0.6 && boss.phase < 2) {
            boss.phase = 2;
            boss.fireRate = 600;
        }

        const targetDist = 200;
        if (dist > targetDist + 50) {
            boss.setVelocity(Math.cos(angle) * boss.speed, Math.sin(angle) * boss.speed);
        } else if (dist < targetDist - 50) {
            boss.setVelocity(-Math.cos(angle) * boss.speed, -Math.sin(angle) * boss.speed);
        } else {
            boss.setVelocity(0, 0);
        }

        boss.lastFire -= dt * 1000;
        if (boss.lastFire <= 0) {
            boss.attackPattern = (boss.attackPattern + 1) % 3;

            if (boss.attackPattern === 0) {
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2 + time * 0.001;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
                }
            } else if (boss.attackPattern === 1) {
                for (let i = -3; i <= 3; i++) {
                    const a = angle + i * 0.15;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 180, Math.sin(a) * 180);
                }
            } else {
                for (let i = 0; i < boss.phase + 1; i++) {
                    const a = (i / (boss.phase + 1)) * Math.PI * 2;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'homingBullet');
                    bullet.setVelocity(Math.cos(a) * 60, Math.sin(a) * 60);
                    bullet.homing = true;
                }
            }

            boss.lastFire = boss.fireRate;
        }
    }

    fireEnemyBullet(enemy, angle) {
        const speed = 150;

        if (enemy.enemyType === 'turret') {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else if (enemy.enemyType === 'drone') {
            for (let i = -1; i <= 1; i++) {
                const a = angle + i * 0.3;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else if (enemy.enemyType === 'spawner') {
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed * 0.8, Math.sin(a) * speed * 0.8);
            }
        } else {
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    hitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                if (enemy.isElite) enemy.setTint(COLORS.elite);
                else enemy.clearTint();
            }
        });

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, Math.round(bullet.damage).toString(), {
            fontSize: bullet.isCrit ? '16px' : '12px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: bullet.isCrit ? '#ffff00' : '#ffffff'
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 500,
            onComplete: () => dmgText.destroy()
        });

        // Hit particles
        for (let i = 0; i < 4; i++) {
            const particle = this.add.rectangle(bullet.x, bullet.y, 3, 3,
                bullet.isCrit ? COLORS.critical : COLORS.bulletPlayer);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: bullet.x + (Math.random() - 0.5) * 50,
                y: bullet.y + (Math.random() - 0.5) * 50,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }

        if (!bullet.piercing || bullet.pierceCount <= 0) {
            bullet.destroy();
        } else {
            bullet.pierceCount--;
        }

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        this.gameState.combo++;
        this.gameState.comboTimer = 2;
        this.gameState.comboMultiplier = Math.min(5, 1 + this.gameState.combo * 0.1);

        for (let i = 0; i < 12; i++) {
            const particle = this.add.rectangle(enemy.x, enemy.y, 5, 5,
                enemy.isElite ? COLORS.elite : (enemy.tintTopLeft || COLORS.ghost));
            this.tweens.add({
                targets: particle,
                alpha: 0, scale: 0,
                x: enemy.x + (Math.random() - 0.5) * 100,
                y: enemy.y + (Math.random() - 0.5) * 100,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        const pickup = this.pickups.create(enemy.x, enemy.y, 'debris');
        pickup.pickupType = 'debris';
        pickup.value = Math.floor(enemy.debris * this.gameState.multiplier * this.gameState.comboMultiplier);

        if (Math.random() < 0.1) {
            const health = this.pickups.create(enemy.x + 20, enemy.y, 'health');
            health.pickupType = 'health';
        }

        if (Math.random() < 0.05) {
            const bomb = this.pickups.create(enemy.x - 20, enemy.y, 'bomb');
            bomb.pickupType = 'bomb';
        }

        // Lifesteal
        if (this.playerStats.lifesteal > 0 && Math.random() < this.playerStats.lifesteal) {
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 1);
        }

        this.gameState.multiplier = Math.min(3.0, this.gameState.multiplier + 0.05);
        this.cameras.main.shake(enemy.enemyType === 'boss' ? 500 : 100,
            enemy.enemyType === 'boss' ? 0.02 : 0.005);

        enemy.destroy();
        window.enemies = this.enemies.getChildren();
    }

    playerHit(player, bullet) {
        if (this.invincible > 0) return;

        if (this.playerStats.shield > 0) {
            this.playerStats.shield--;
            this.invincible = 0.5;
            this.cameras.main.flash(100, 0, 200, 255);
            if (bullet) bullet.destroy();
            return;
        }

        this.playerStats.hp--;
        this.invincible = 1.0;
        this.gameState.multiplier = Math.max(1.0, this.gameState.multiplier - 0.5);
        this.gameState.combo = 0;
        if (bullet) bullet.destroy();

        for (let i = 0; i < 10; i++) {
            const particle = this.add.rectangle(player.x, player.y, 4, 4, COLORS.uiRed);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: player.x + (Math.random() - 0.5) * 80,
                y: player.y + (Math.random() - 0.5) * 80,
                duration: 250,
                onComplete: () => particle.destroy()
            });
        }

        this.cameras.main.shake(200, 0.015);
        this.cameras.main.flash(100, 255, 50, 50);

        if (this.playerStats.hp <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'debris') {
            this.gameState.debris += pickup.value;
        } else if (pickup.pickupType === 'health') {
            this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 1);
        } else if (pickup.pickupType === 'bomb') {
            this.playerStats.bombs = Math.min(this.playerStats.maxBombs, this.playerStats.bombs + 1);
        }
        pickup.destroy();
    }

    bossDefeated() {
        for (let i = 0; i < 15; i++) {
            const pickup = this.pickups.create(
                400 + (Math.random() - 0.5) * 100,
                250 + (Math.random() - 0.5) * 100,
                'debris'
            );
            pickup.pickupType = 'debris';
            pickup.value = 15;
        }

        this.time.delayedCall(1500, () => this.showSalvageScreen());
    }

    roomCleared() {
        this.roomClearing = true;
        this.gameState.roomsCleared++;
        this.gameState.floor = Math.floor(this.gameState.roomsCleared / 5) + 1;

        this.time.delayedCall(1000, () => this.showSalvageScreen());
    }

    showSalvageScreen() {
        this.gameState.state = 'salvage';

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9).setDepth(200);

        const title = this.add.text(400, 120, 'CHOOSE ONE SALVAGE', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#00ff88'
        }).setOrigin(0.5).setDepth(201);

        const shuffled = [...SALVAGES].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);

        choices.forEach((salvage, i) => {
            const x = 150 + i * 250;
            const y = 300;

            const box = this.add.rectangle(x, y, 160, 120, 0x0a0a15).setDepth(201);
            const border = this.add.graphics().setDepth(202);
            border.lineStyle(2, COLORS.uiOrange);
            border.strokeRect(x - 80, y - 60, 160, 120);

            const nameText = this.add.text(x, y - 20, salvage.name, {
                fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ff8800'
            }).setOrigin(0.5).setDepth(202);

            const descText = this.add.text(x, y + 20, salvage.desc, {
                fontSize: '12px', fontFamily: 'monospace', color: '#00ff88'
            }).setOrigin(0.5).setDepth(202);

            const keyText = this.add.text(x, y + 50, `[${i + 1}]`, {
                fontSize: '10px', fontFamily: 'monospace', color: '#666666'
            }).setOrigin(0.5).setDepth(202);

            box.setInteractive();
            box.on('pointerover', () => border.lineStyle(4, COLORS.uiGreen).strokeRect(x - 80, y - 60, 160, 120));
            box.on('pointerout', () => border.clear().lineStyle(2, COLORS.uiOrange).strokeRect(x - 80, y - 60, 160, 120));
            box.on('pointerdown', () => this.selectSalvage(salvage, [overlay, title, box, border, nameText, descText, keyText]));
        });

        // Key handlers
        this.input.keyboard.once('keydown-ONE', () => this.selectSalvage(choices[0]));
        this.input.keyboard.once('keydown-TWO', () => this.selectSalvage(choices[1]));
        this.input.keyboard.once('keydown-THREE', () => this.selectSalvage(choices[2]));
    }

    selectSalvage(salvage) {
        // Apply upgrade
        switch (salvage.id) {
            case 'damage': this.playerStats.damage *= 1.25; break;
            case 'speed': this.playerStats.speed *= 1.15; this.playerStats.focusSpeed *= 1.15; break;
            case 'firerate': this.playerStats.fireRate *= 1.2; break;
            case 'health': this.playerStats.maxHp++; this.playerStats.hp++; break;
            case 'crit': this.playerStats.critChance += 0.1; break;
            case 'bullets': this.playerStats.bulletCount++; break;
            case 'lifesteal': this.playerStats.lifesteal += 0.1; break;
            case 'homing': this.playerStats.hasHoming = true; break;
            case 'piercing': this.playerStats.hasPiercing = true; break;
            case 'shield': this.playerStats.shield++; break;
        }

        // Update room position for next room (move "forward" - down on minimap)
        this.gameState.currentRoomY++;

        // Ensure visited array has room for new position
        while (this.gameState.roomsVisited.length <= this.gameState.currentRoomY) {
            this.gameState.roomsVisited.push([]);
        }
        while ((this.gameState.roomsVisited[this.gameState.currentRoomY] || []).length <= this.gameState.currentRoomX) {
            if (!this.gameState.roomsVisited[this.gameState.currentRoomY]) {
                this.gameState.roomsVisited[this.gameState.currentRoomY] = [];
            }
            this.gameState.roomsVisited[this.gameState.currentRoomY].push(false);
        }
        this.gameState.roomsVisited[this.gameState.currentRoomY][this.gameState.currentRoomX] = true;

        // Transition to new room with preserved stats
        this.scene.restart({
            playerStats: this.playerStats,
            gameState: this.gameState
        });
    }

    gameOver() {
        this.gameState.state = 'gameover';

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);

        const gameOverText = this.add.text(400, 220, 'GAME OVER', {
            fontSize: '40px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ff4444'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(400, 300,
            `DEBRIS: ${this.gameState.debris}G\nROOMS CLEARED: ${this.gameState.roomsCleared}\nFLOOR: ${this.gameState.floor}`, {
            fontSize: '20px', fontFamily: 'monospace', color: '#00ff88', align: 'center'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 400, 'Press SPACE to restart', {
            fontSize: '16px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a15',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
