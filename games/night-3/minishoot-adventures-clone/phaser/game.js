// Minishoot Adventures Clone - Phaser 3 Version (Expanded + Polished)
const COLORS = {
    background: 0x0a0a15,
    forestDark: 0x1e3a3a,
    forestLight: 0x2d5a4a,
    path: 0xd4a864,
    pathDark: 0xa67c42,
    treeTeal: 0x3a7a8a,
    treeBlue: 0x2a5a7a,
    treeOrange: 0xe87830,
    playerBody: 0xe8f4f8,
    playerAccent: 0x50c8ff,
    playerGlow: 0x50c8ff,
    bulletPlayer: 0x50c8ff,
    bulletSuper: 0x4080ff,
    bulletEnemy: 0xff6030,
    bulletHoming: 0xff40ff,
    crystal: 0xff3050,
    healthFull: 0xff4060,
    healthEmpty: 0x402030,
    energyFull: 0x50d0ff,
    energyEmpty: 0x203040,
    enemyScout: 0x50aa70,
    enemyTurret: 0x8060a0,
    enemyHeavy: 0xc06040,
    enemyGrasshopper: 0x80c040,
    enemyBurrower: 0xa08060,
    enemyMimic: 0x406030,
    enemyElite: 0xa040c0,
    pickup: 0x50ff80,
    white: 0xffffff,
    black: 0x000000,
    critical: 0xffff00,
    combo: 0xff8000,
    boss: 0xc03060
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Player ship texture
        const playerGfx = this.make.graphics({ add: false });
        playerGfx.fillStyle(0x50c8ff, 0.5);
        playerGfx.fillEllipse(6, 16, 16, 8);
        playerGfx.fillStyle(0x90c8d8);
        playerGfx.beginPath();
        playerGfx.moveTo(10, 4);
        playerGfx.lineTo(8, 10);
        playerGfx.lineTo(8, 22);
        playerGfx.lineTo(10, 28);
        playerGfx.lineTo(14, 22);
        playerGfx.lineTo(14, 10);
        playerGfx.closePath();
        playerGfx.fillPath();
        playerGfx.fillStyle(0xe8f8ff);
        playerGfx.beginPath();
        playerGfx.moveTo(28, 16);
        playerGfx.lineTo(22, 8);
        playerGfx.lineTo(12, 8);
        playerGfx.lineTo(10, 16);
        playerGfx.lineTo(12, 24);
        playerGfx.lineTo(22, 24);
        playerGfx.closePath();
        playerGfx.fillPath();
        playerGfx.lineStyle(1, 0x70b8d0);
        playerGfx.strokePath();
        playerGfx.fillStyle(0x50c8ff);
        playerGfx.fillCircle(20, 16, 5);
        playerGfx.fillStyle(0x80e0ff);
        playerGfx.fillCircle(20, 16, 3);
        playerGfx.fillStyle(0xffffff, 0.8);
        playerGfx.fillCircle(18, 14, 2);
        playerGfx.generateTexture('player', 32, 32);

        // Player bullet texture
        const bulletGfx = this.make.graphics({ add: false });
        bulletGfx.fillStyle(0x50c8ff, 0.3);
        bulletGfx.fillEllipse(8, 6, 20, 8);
        bulletGfx.fillStyle(0x50c8ff);
        bulletGfx.fillEllipse(14, 6, 10, 8);
        bulletGfx.fillStyle(0xffffff);
        bulletGfx.fillEllipse(16, 6, 5, 4);
        bulletGfx.generateTexture('playerBullet', 24, 12);

        // Super bullet texture
        const superBulletGfx = this.make.graphics({ add: false });
        superBulletGfx.fillStyle(0x4080ff, 0.5);
        superBulletGfx.fillEllipse(12, 10, 28, 14);
        superBulletGfx.fillStyle(0x4080ff);
        superBulletGfx.fillEllipse(18, 10, 16, 12);
        superBulletGfx.fillStyle(0xffffff);
        superBulletGfx.fillEllipse(20, 10, 8, 6);
        superBulletGfx.generateTexture('superBullet', 32, 20);

        // Enemy bullet texture
        const enemyBulletGfx = this.make.graphics({ add: false });
        enemyBulletGfx.lineStyle(2, COLORS.bulletEnemy);
        enemyBulletGfx.strokeCircle(10, 10, 8);
        enemyBulletGfx.fillStyle(COLORS.bulletEnemy);
        enemyBulletGfx.fillCircle(10, 10, 6);
        enemyBulletGfx.fillStyle(0x802010);
        enemyBulletGfx.fillCircle(10, 10, 3);
        enemyBulletGfx.generateTexture('enemyBullet', 20, 20);

        // Homing bullet texture
        const homingGfx = this.make.graphics({ add: false });
        homingGfx.lineStyle(2, COLORS.bulletHoming);
        homingGfx.strokeCircle(8, 8, 6);
        homingGfx.fillStyle(COLORS.bulletHoming);
        homingGfx.fillCircle(8, 8, 4);
        homingGfx.generateTexture('homingBullet', 16, 16);

        // Scout enemy texture
        const scoutGfx = this.make.graphics({ add: false });
        scoutGfx.fillStyle(COLORS.enemyScout);
        scoutGfx.beginPath();
        scoutGfx.moveTo(30, 16);
        scoutGfx.lineTo(5, 4);
        scoutGfx.lineTo(10, 16);
        scoutGfx.lineTo(5, 28);
        scoutGfx.closePath();
        scoutGfx.fillPath();
        scoutGfx.lineStyle(2, 0x204030);
        scoutGfx.strokePath();
        scoutGfx.fillStyle(0xff8040);
        scoutGfx.fillCircle(18, 16, 5);
        scoutGfx.generateTexture('scout', 32, 32);

        // Turret enemy texture
        const turretGfx = this.make.graphics({ add: false });
        turretGfx.fillStyle(COLORS.enemyTurret);
        const hexPoints = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            hexPoints.push({ x: 20 + Math.cos(angle) * 18, y: 20 + Math.sin(angle) * 18 });
        }
        turretGfx.beginPath();
        turretGfx.moveTo(hexPoints[0].x, hexPoints[0].y);
        for (let i = 1; i < 6; i++) {
            turretGfx.lineTo(hexPoints[i].x, hexPoints[i].y);
        }
        turretGfx.closePath();
        turretGfx.fillPath();
        turretGfx.lineStyle(3, 0x402050);
        turretGfx.strokePath();
        turretGfx.fillStyle(0x503060);
        turretGfx.fillRect(20, 16, 22, 8);
        turretGfx.fillStyle(0xff6040);
        turretGfx.fillCircle(20, 20, 8);
        turretGfx.generateTexture('turret', 44, 40);

        // Heavy enemy texture
        const heavyGfx = this.make.graphics({ add: false });
        heavyGfx.fillStyle(COLORS.enemyHeavy);
        heavyGfx.fillCircle(24, 24, 24);
        heavyGfx.lineStyle(4, 0x602020);
        heavyGfx.strokeCircle(24, 24, 24);
        heavyGfx.fillStyle(0xff4020);
        heavyGfx.fillCircle(24, 24, 12);
        heavyGfx.fillStyle(0x200000);
        heavyGfx.fillCircle(18, 20, 3);
        heavyGfx.fillCircle(30, 20, 3);
        heavyGfx.generateTexture('heavy', 48, 48);

        // Grasshopper enemy texture
        const grassGfx = this.make.graphics({ add: false });
        grassGfx.fillStyle(COLORS.enemyGrasshopper);
        grassGfx.fillCircle(16, 20, 14);
        grassGfx.fillStyle(0x60a020);
        grassGfx.fillCircle(16, 20, 8);
        grassGfx.fillStyle(0x204010);
        grassGfx.fillCircle(12, 18, 3);
        grassGfx.fillCircle(20, 18, 3);
        grassGfx.fillStyle(COLORS.enemyGrasshopper);
        grassGfx.fillRect(8, 28, 4, 10);
        grassGfx.fillRect(20, 28, 4, 10);
        grassGfx.generateTexture('grasshopper', 32, 40);

        // Burrower enemy texture
        const burrowGfx = this.make.graphics({ add: false });
        burrowGfx.fillStyle(COLORS.enemyBurrower);
        burrowGfx.fillCircle(20, 20, 18);
        burrowGfx.fillStyle(0x806040);
        burrowGfx.fillCircle(20, 20, 12);
        burrowGfx.fillStyle(0x301810);
        burrowGfx.fillCircle(14, 16, 4);
        burrowGfx.fillCircle(26, 16, 4);
        burrowGfx.fillStyle(0xff4020);
        burrowGfx.fillCircle(14, 16, 2);
        burrowGfx.fillCircle(26, 16, 2);
        burrowGfx.generateTexture('burrower', 40, 40);

        // Mimic enemy texture (looks like tree initially)
        const mimicGfx = this.make.graphics({ add: false });
        mimicGfx.fillStyle(COLORS.enemyMimic);
        mimicGfx.fillCircle(20, 20, 20);
        mimicGfx.fillStyle(0x305020);
        mimicGfx.fillCircle(20, 20, 14);
        mimicGfx.fillStyle(0xff2020);
        mimicGfx.fillCircle(14, 16, 4);
        mimicGfx.fillCircle(26, 16, 4);
        mimicGfx.generateTexture('mimic', 40, 40);

        // Boss texture
        const bossGfx = this.make.graphics({ add: false });
        bossGfx.fillStyle(COLORS.boss);
        bossGfx.fillCircle(50, 50, 48);
        bossGfx.lineStyle(6, 0x801040);
        bossGfx.strokeCircle(50, 50, 48);
        bossGfx.fillStyle(0xff4080);
        bossGfx.fillCircle(50, 50, 30);
        bossGfx.fillStyle(0x400020);
        bossGfx.fillCircle(35, 40, 8);
        bossGfx.fillCircle(65, 40, 8);
        bossGfx.fillStyle(0xff0040);
        bossGfx.fillCircle(35, 40, 4);
        bossGfx.fillCircle(65, 40, 4);
        bossGfx.fillStyle(0x400020);
        bossGfx.fillRect(30, 60, 40, 10);
        bossGfx.generateTexture('boss', 100, 100);

        // Crystal texture
        const crystalGfx = this.make.graphics({ add: false });
        crystalGfx.fillStyle(COLORS.crystal);
        crystalGfx.beginPath();
        crystalGfx.moveTo(8, 0);
        crystalGfx.lineTo(14, 8);
        crystalGfx.lineTo(8, 16);
        crystalGfx.lineTo(2, 8);
        crystalGfx.closePath();
        crystalGfx.fillPath();
        crystalGfx.fillStyle(0xffffff, 0.5);
        crystalGfx.beginPath();
        crystalGfx.moveTo(6, 3);
        crystalGfx.lineTo(10, 6);
        crystalGfx.lineTo(8, 8);
        crystalGfx.closePath();
        crystalGfx.fillPath();
        crystalGfx.generateTexture('crystal', 16, 16);

        // Health pickup texture
        const healthGfx = this.make.graphics({ add: false });
        healthGfx.fillStyle(0x50ff80);
        healthGfx.beginPath();
        healthGfx.moveTo(10, 15);
        healthGfx.lineTo(2, 7);
        healthGfx.arc(6, 5, 5, Math.PI, 0, false);
        healthGfx.arc(14, 5, 5, Math.PI, 0, false);
        healthGfx.lineTo(18, 7);
        healthGfx.closePath();
        healthGfx.fillPath();
        healthGfx.generateTexture('healthPickup', 20, 18);

        // Energy pickup texture
        const energyGfx = this.make.graphics({ add: false });
        energyGfx.fillStyle(0x50d0ff);
        energyGfx.beginPath();
        energyGfx.moveTo(8, 0);
        energyGfx.lineTo(14, 8);
        energyGfx.lineTo(8, 16);
        energyGfx.lineTo(2, 8);
        energyGfx.closePath();
        energyGfx.fillPath();
        energyGfx.lineStyle(2, 0x80e0ff);
        energyGfx.strokePath();
        energyGfx.generateTexture('energyPickup', 16, 16);

        // Tree textures
        this.createTreeTexture('treeTeal', COLORS.treeTeal, 0x1a3a4a);
        this.createTreeTexture('treeOrange', COLORS.treeOrange, 0xa05018);
    }

    createTreeTexture(name, mainColor, shadowColor) {
        const gfx = this.make.graphics({ add: false });
        const size = 60;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 12;
            const fx = size/2 + Math.cos(angle) * dist;
            const fy = size/2 - 6 + Math.sin(angle) * dist * 0.6;
            gfx.fillStyle(shadowColor);
            gfx.fillCircle(fx, fy, 18);
        }
        gfx.fillStyle(mainColor);
        gfx.fillCircle(size/2, size/2 - 6, 22);
        gfx.fillStyle(0xffffff, 0.2);
        gfx.fillCircle(size/2 - 8, size/2 - 14, 8);
        gfx.generateTexture(name, size, size);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.gameState = {
            crystals: 0,
            level: 1,
            xp: 0,
            xpToLevel: 15,
            wave: 1,
            maxWave: 10,
            combo: 0,
            comboTimer: 0,
            comboMultiplier: 1,
            bossActive: false,
            slowMotion: 1,
            slowMotionTimer: 0,
            victory: false,
            waveInProgress: false,  // Prevents false wave completion detection
            enemiesSpawnedThisWave: 0
        };

        this.playerStats = {
            maxHealth: 5,
            health: 5,
            maxEnergy: 6,
            energy: 6,
            damage: 1,
            fireRate: 5,
            speed: 200,
            range: 350,
            bulletCount: 1,
            critChance: 0.1,
            hasDash: true,
            hasBoost: true,
            hasSupershot: true,
            hasTimeStop: true
        };

        this.fireCooldown = 0;
        this.dashCooldown = 0;
        this.invincible = 0;
        this.superShotCharge = 0;
        this.boosting = false;
        this.trail = [];
        this.damageNumbers = [];
        this.particles = [];
        this.spawnWarnings = [];
    }

    create() {
        this.drawBackground();

        // Create groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.crystals = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.trees = this.add.group();

        this.createTrees();

        // Create player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(true);

        // Spawn first wave
        this.spawnWave();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            space: 'SPACE',
            shift: 'SHIFT',
            q: 'Q'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isShooting = true;
            }
            if (pointer.rightButtonDown()) {
                this.isCharging = true;
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) {
                this.isShooting = false;
            }
            if (!pointer.rightButtonDown()) {
                if (this.isCharging && this.superShotCharge >= 1) {
                    this.fireSuperShot();
                }
                this.isCharging = false;
                this.superShotCharge = 0;
            }
        });

        // Dash input
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.dashCooldown <= 0 && this.playerStats.hasDash) {
                this.dash();
            }
        });

        // Time stop input
        this.input.keyboard.on('keydown-Q', () => {
            if (this.playerStats.hasTimeStop && this.playerStats.energy >= 3 && this.gameState.slowMotion === 1) {
                this.playerStats.energy -= 3;
                this.gameState.slowMotion = 0.2;
                this.gameState.slowMotionTimer = 3;
                this.cameras.main.flash(200, 100, 200, 255);
            }
        });

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.crystals, this.collectCrystal, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // HUD
        this.createHUD();

        // Expose for testing
        window.gameState = this.gameState;
        window.player = this.playerStats;
        window.enemies = this.enemies.getChildren();
    }

    drawBackground() {
        this.add.rectangle(400, 300, 800, 600, COLORS.background);

        // Stars
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % 800;
            const y = (i * 47) % 600;
            const size = (i % 3) + 1;
            this.add.circle(x, y, size, 0xffffff, 0.3);
        }

        // Forest edge
        const forestEdge = this.add.graphics();
        forestEdge.fillStyle(COLORS.forestDark);
        forestEdge.beginPath();
        forestEdge.moveTo(70, 70);
        forestEdge.lineTo(730, 70);
        forestEdge.lineTo(755, 530);
        forestEdge.lineTo(45, 530);
        forestEdge.closePath();
        forestEdge.fillPath();

        // Forest ground
        const forestGround = this.add.graphics();
        forestGround.fillStyle(COLORS.forestLight);
        forestGround.beginPath();
        forestGround.moveTo(85, 85);
        forestGround.lineTo(715, 85);
        forestGround.lineTo(735, 515);
        forestGround.lineTo(65, 515);
        forestGround.closePath();
        forestGround.fillPath();

        // Path
        const path = this.add.graphics();
        path.fillStyle(COLORS.path);
        path.beginPath();
        path.moveTo(100, 100);
        path.lineTo(700, 100);
        path.lineTo(720, 500);
        path.lineTo(80, 500);
        path.closePath();
        path.fillPath();
        path.lineStyle(3, 0x8a6030);
        path.strokePath();
    }

    createTrees() {
        const positions = [];

        // Top
        for (let i = 0; i < 12; i++) {
            positions.push({ x: 50 + i * 65, y: 30 + Math.random() * 30 });
        }
        // Bottom
        for (let i = 0; i < 12; i++) {
            positions.push({ x: 50 + i * 65, y: 540 + Math.random() * 30 });
        }
        // Left
        for (let i = 0; i < 8; i++) {
            positions.push({ x: 20 + Math.random() * 30, y: 80 + i * 60 });
        }
        // Right
        for (let i = 0; i < 8; i++) {
            positions.push({ x: 750 + Math.random() * 30, y: 80 + i * 60 });
        }
        // Scattered
        positions.push({ x: 150, y: 150 }, { x: 650, y: 150 });
        positions.push({ x: 200, y: 420 }, { x: 600, y: 400 });

        positions.forEach(pos => {
            const isOrange = Math.random() > 0.7;
            const tree = this.add.image(pos.x, pos.y, isOrange ? 'treeOrange' : 'treeTeal');
            tree.setScale(0.8 + Math.random() * 0.4);
            tree.setDepth(pos.y > 300 ? 15 : 5);
            this.trees.add(tree);
        });
    }

    spawnWave() {
        // Mark wave as in progress - prevents false wave completion detection
        this.gameState.waveInProgress = true;
        this.gameState.enemiesSpawnedThisWave = 0;

        // Show wave indicator
        const waveText = this.add.text(400, 300, `WAVE ${this.gameState.wave}`, {
            fontSize: '36px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: waveText,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            onComplete: () => waveText.destroy()
        });

        // Spawn boss at wave 5 and 10
        if (this.gameState.wave === 5 || this.gameState.wave === 10) {
            this.time.delayedCall(1000, () => {
                this.spawnBoss();
                this.gameState.enemiesSpawnedThisWave = 1;
            });
            return;
        }

        const count = 3 + this.gameState.wave * 2;

        // Show spawn warnings
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 200, () => {
                let x, y;
                do {
                    x = 120 + Math.random() * 560;
                    y = 120 + Math.random() * 360;
                } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 150);

                // Spawn warning
                const warning = this.add.circle(x, y, 30, 0xff0000, 0.3);
                warning.setDepth(5);
                this.tweens.add({
                    targets: warning,
                    scale: { from: 0, to: 1.5 },
                    alpha: { from: 0.5, to: 0 },
                    duration: 800,
                    onComplete: () => {
                        warning.destroy();
                        this.spawnEnemy(x, y);
                        this.gameState.enemiesSpawnedThisWave++;
                    }
                });
            });
        }
    }

    spawnEnemy(x, y) {
        const types = ['scout', 'turret', 'heavy', 'grasshopper', 'burrower', 'mimic'];
        const weights = [0.35, 0.2, 0.15, 0.15, 0.1, 0.05];
        const rand = Math.random();
        let cumulative = 0;
        let type = 'scout';
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (rand < cumulative) {
                type = types[i];
                break;
            }
        }

        // Chance for elite
        const isElite = Math.random() < 0.1 + this.gameState.wave * 0.02;

        this.createEnemy(type, x, y, isElite);
    }

    createEnemy(type, x, y, isElite = false) {
        const configs = {
            scout: { hp: 3, speed: 80, fireRate: 1200, size: 0.8, xp: 2 },
            turret: { hp: 6, speed: 0, fireRate: 1500, size: 1, xp: 4 },
            heavy: { hp: 12, speed: 40, fireRate: 2000, size: 0.9, xp: 6 },
            grasshopper: { hp: 4, speed: 0, fireRate: 1500, size: 0.8, xp: 3 },
            burrower: { hp: 8, speed: 60, fireRate: 2500, size: 0.9, xp: 5 },
            mimic: { hp: 5, speed: 100, fireRate: 1000, size: 1, xp: 4 }
        };
        const cfg = configs[type];

        const textureName = type === 'grasshopper' || type === 'burrower' || type === 'mimic' ? type : type;
        const enemy = this.enemies.create(x, y, textureName);
        enemy.setScale(cfg.size * (isElite ? 1.3 : 1));
        enemy.setDepth(10);
        enemy.enemyType = type;
        enemy.hp = cfg.hp * (isElite ? 2 : 1);
        enemy.maxHp = enemy.hp;
        enemy.speed = cfg.speed;
        enemy.fireRate = cfg.fireRate;
        enemy.xp = cfg.xp * (isElite ? 2 : 1);
        enemy.lastFire = 0;
        enemy.hitFlash = 0;
        enemy.isElite = isElite;
        enemy.spawnScale = 0;
        enemy.jumpTimer = 0;
        enemy.burrowed = type === 'burrower';
        enemy.revealed = type !== 'mimic';

        if (isElite) {
            enemy.setTint(COLORS.enemyElite);
        }

        // Spawn animation
        enemy.setScale(0);
        this.tweens.add({
            targets: enemy,
            scale: cfg.size * (isElite ? 1.3 : 1),
            duration: 300,
            ease: 'Back.easeOut'
        });

        return enemy;
    }

    spawnBoss() {
        this.gameState.bossActive = true;

        const boss = this.enemies.create(400, 150, 'boss');
        boss.setDepth(10);
        boss.enemyType = 'boss';
        boss.hp = 150 + this.gameState.wave * 30;
        boss.maxHp = boss.hp;
        boss.speed = 30;
        boss.fireRate = 1000;
        boss.xp = 50;
        boss.lastFire = 0;
        boss.hitFlash = 0;
        boss.isElite = false;
        boss.phase = 1;
        boss.attackPattern = 0;

        // Spawn animation
        boss.setScale(0);
        this.tweens.add({
            targets: boss,
            scale: 1,
            duration: 1000,
            ease: 'Bounce.easeOut'
        });

        // Boss health bar
        this.bossHealthBg = this.add.rectangle(400, 30, 400, 20, 0x402030).setDepth(100);
        this.bossHealthFill = this.add.rectangle(200, 30, 396, 16, 0xff4080).setDepth(101);
        this.bossHealthFill.setOrigin(0, 0.5);
        this.bossNameText = this.add.text(400, 50, 'FOREST GUARDIAN', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ff4080'
        }).setOrigin(0.5).setDepth(101);
    }

    dash() {
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        const dashDist = 120;
        const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dashDist, 100, 700);
        const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dashDist, 100, 500);

        // Dash afterimages
        for (let i = 0; i < 5; i++) {
            const ghost = this.add.sprite(
                this.player.x + (targetX - this.player.x) * (i / 5),
                this.player.y + (targetY - this.player.y) * (i / 5),
                'player'
            );
            ghost.rotation = this.player.rotation;
            ghost.setTint(COLORS.playerAccent);
            ghost.setAlpha(0.5 - i * 0.1);
            ghost.setDepth(9);
            this.tweens.add({
                targets: ghost,
                alpha: 0,
                duration: 300,
                onComplete: () => ghost.destroy()
            });
        }

        // Dash particles
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(
                this.player.x,
                this.player.y,
                4,
                COLORS.playerAccent,
                0.8
            );
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                x: this.player.x + (Math.random() - 0.5) * 60,
                y: this.player.y + (Math.random() - 0.5) * 60,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        this.player.x = targetX;
        this.player.y = targetY;
        this.dashCooldown = 0.8;
        this.invincible = Math.max(this.invincible, 0.3); // Brief i-frames during dash
    }

    fireSuperShot() {
        if (this.playerStats.energy < 2) return;
        this.playerStats.energy -= 2;

        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        // Muzzle flash
        const flash = this.add.circle(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            20, 0x4080ff, 0.8
        );
        this.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });

        // Fire spread of super bullets
        for (let i = -3; i <= 3; i++) {
            const a = angle + i * 0.1;
            const bullet = this.playerBullets.create(
                this.player.x + Math.cos(a) * 20,
                this.player.y + Math.sin(a) * 20,
                'superBullet'
            );
            bullet.rotation = a;
            bullet.setVelocity(Math.cos(a) * 600, Math.sin(a) * 600);
            bullet.damage = this.playerStats.damage * 2;
            bullet.isSuper = true;

            this.time.delayedCall(800, () => {
                if (bullet.active) bullet.destroy();
            });
        }

        this.cameras.main.shake(100, 0.01);
    }

    createHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(100);

        // Health hearts
        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const heart = this.add.graphics();
            this.drawHeart(heart, 25 + i * 24, 20, true);
            this.hearts.push(heart);
            this.hudContainer.add(heart);
        }

        // Energy diamonds
        this.energyDiamonds = [];
        for (let i = 0; i < 6; i++) {
            const diamond = this.add.graphics();
            this.drawDiamond(diamond, 25 + i * 20, 48, true);
            this.energyDiamonds.push(diamond);
            this.hudContainer.add(diamond);
        }

        // Crystal counter
        const crystalIcon = this.add.graphics();
        crystalIcon.fillStyle(COLORS.crystal);
        crystalIcon.beginPath();
        crystalIcon.moveTo(0, -8);
        crystalIcon.lineTo(6, 0);
        crystalIcon.lineTo(0, 8);
        crystalIcon.lineTo(-6, 0);
        crystalIcon.closePath();
        crystalIcon.fillPath();
        crystalIcon.x = 28;
        crystalIcon.y = 85;
        this.hudContainer.add(crystalIcon);

        this.crystalText = this.add.text(42, 78, '0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.hudContainer.add(this.crystalText);

        // XP bar
        this.xpBarBg = this.add.rectangle(95, 108, 150, 8, 0x203040);
        this.xpBarFill = this.add.rectangle(20, 108, 0, 8, 0x50ff80);
        this.xpBarFill.setOrigin(0, 0.5);
        this.hudContainer.add(this.xpBarBg);
        this.hudContainer.add(this.xpBarFill);

        this.levelText = this.add.text(180, 100, 'LVL 1', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.hudContainer.add(this.levelText);

        // Wave counter
        this.waveText = this.add.text(700, 15, 'Wave: 1/10', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.hudContainer.add(this.waveText);

        // Enemy counter
        this.enemyText = this.add.text(700, 35, 'Enemies: 0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.hudContainer.add(this.enemyText);

        // Combo display
        this.comboText = this.add.text(400, 130, '', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff8000'
        }).setOrigin(0.5);
        this.hudContainer.add(this.comboText);

        // Ability bar
        this.createAbilityBar();

        // Minimap
        this.createMinimap();

        // Key hints
        this.add.text(15, 560, 'WASD: Move | SPACE: Dash | SHIFT: Boost | Q: Time Stop | RMB: Super Shot', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setDepth(100);
    }

    createMinimap() {
        this.minimap = this.add.graphics();
        this.minimap.setDepth(99);
        this.minimap.x = 720;
        this.minimap.y = 520;
    }

    updateMinimap() {
        this.minimap.clear();

        // Background
        this.minimap.fillStyle(0x000000, 0.5);
        this.minimap.fillRect(0, 0, 70, 70);
        this.minimap.lineStyle(1, 0x50c8ff);
        this.minimap.strokeRect(0, 0, 70, 70);

        // Player
        const px = (this.player.x / 800) * 70;
        const py = (this.player.y / 600) * 70;
        this.minimap.fillStyle(0x50c8ff);
        this.minimap.fillCircle(px, py, 3);

        // Enemies
        this.enemies.getChildren().forEach(enemy => {
            const ex = (enemy.x / 800) * 70;
            const ey = (enemy.y / 600) * 70;
            this.minimap.fillStyle(enemy.enemyType === 'boss' ? 0xff4080 : 0xff6030);
            this.minimap.fillCircle(ex, ey, enemy.enemyType === 'boss' ? 4 : 2);
        });

        // Pickups
        this.pickups.getChildren().forEach(pickup => {
            const px = (pickup.x / 800) * 70;
            const py = (pickup.y / 600) * 70;
            this.minimap.fillStyle(0x50ff80);
            this.minimap.fillCircle(px, py, 2);
        });
    }

    drawHeart(graphics, x, y, filled) {
        graphics.clear();
        graphics.fillStyle(filled ? COLORS.healthFull : COLORS.healthEmpty);
        graphics.beginPath();
        graphics.moveTo(x, y + 5);
        graphics.lineTo(x - 8, y - 3);
        graphics.arc(x - 4, y - 5, 5, Math.PI, 0, false);
        graphics.arc(x + 4, y - 5, 5, Math.PI, 0, false);
        graphics.lineTo(x + 8, y - 3);
        graphics.closePath();
        graphics.fillPath();

        if (filled) {
            graphics.fillStyle(0xffffff, 0.4);
            graphics.fillCircle(x - 3, y - 4, 2);
        }
    }

    drawDiamond(graphics, x, y, filled) {
        graphics.clear();
        graphics.fillStyle(filled ? COLORS.energyFull : COLORS.energyEmpty);
        graphics.beginPath();
        graphics.moveTo(x, y - 8);
        graphics.lineTo(x + 6, y);
        graphics.lineTo(x, y + 8);
        graphics.lineTo(x - 6, y);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(1, filled ? 0x80e0ff : 0x304050);
        graphics.strokePath();
    }

    createAbilityBar() {
        const abilities = [
            { name: 'DASH', key: 'SPC' },
            { name: 'SUPER', key: 'RMB' },
            { name: 'BOOST', key: 'SFT' },
            { name: 'TIME', key: 'Q' }
        ];
        const startX = 280;
        const y = 560;

        this.abilityButtons = [];

        abilities.forEach((ability, i) => {
            const x = startX + i * 55;

            const hex = this.add.graphics();
            hex.fillStyle(0x50c8ff, 0.3);
            hex.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2 - Math.PI / 2;
                const px = Math.cos(angle) * 22;
                const py = Math.sin(angle) * 22;
                if (j === 0) hex.moveTo(px, py);
                else hex.lineTo(px, py);
            }
            hex.closePath();
            hex.fillPath();
            hex.lineStyle(2, 0x50c8ff);
            hex.strokePath();
            hex.x = x;
            hex.y = y;
            hex.setDepth(100);
            this.hudContainer.add(hex);

            const text = this.add.text(x, y - 5, ability.name, {
                fontSize: '9px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5).setDepth(101);
            this.hudContainer.add(text);

            const keyText = this.add.text(x, y + 8, ability.key, {
                fontSize: '8px',
                fontFamily: 'Arial',
                color: '#80e0ff'
            }).setOrigin(0.5).setDepth(101);
            this.hudContainer.add(keyText);

            this.abilityButtons.push({ hex, text, ability: ability.name });
        });
    }

    updateHUD() {
        // Update hearts
        for (let i = 0; i < this.hearts.length; i++) {
            this.drawHeart(this.hearts[i], 25 + i * 24, 20, i < this.playerStats.health);
        }

        // Update energy
        for (let i = 0; i < this.energyDiamonds.length; i++) {
            this.drawDiamond(this.energyDiamonds[i], 25 + i * 20, 48, i < this.playerStats.energy);
        }

        // Update crystal text
        this.crystalText.setText(this.gameState.crystals.toString());

        // Update XP bar
        const xpRatio = this.gameState.xp / this.gameState.xpToLevel;
        this.xpBarFill.width = 150 * xpRatio;

        // Update level
        this.levelText.setText(`LVL ${this.gameState.level}`);

        // Update wave
        this.waveText.setText(`Wave: ${this.gameState.wave}/${this.gameState.maxWave}`);

        // Update enemy count
        this.enemyText.setText(`Enemies: ${this.enemies.countActive()}`);

        // Update combo
        if (this.gameState.combo > 1) {
            this.comboText.setText(`${this.gameState.combo}x COMBO`);
            this.comboText.setAlpha(1);
        } else {
            this.comboText.setAlpha(0);
        }

        // Update boss health bar
        if (this.gameState.bossActive && this.bossHealthFill) {
            const boss = this.enemies.getChildren().find(e => e.enemyType === 'boss');
            if (boss) {
                this.bossHealthFill.width = 396 * (boss.hp / boss.maxHp);
            }
        }

        // Low health warning
        if (this.playerStats.health <= 1) {
            const pulse = Math.sin(this.time.now * 0.01) * 0.3 + 0.3;
            this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(
                Math.floor(10 + pulse * 40), 10, 20
            ));
        }
    }

    update(time, delta) {
        if (this.gameState.victory) return;

        const rawDt = delta / 1000;
        const dt = rawDt * this.gameState.slowMotion;

        // Update slow motion
        if (this.gameState.slowMotionTimer > 0) {
            this.gameState.slowMotionTimer -= rawDt;
            if (this.gameState.slowMotionTimer <= 0) {
                this.gameState.slowMotion = 1;
            }
        }

        // Update cooldowns
        this.fireCooldown -= dt;
        this.dashCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

        // Update combo timer
        if (this.gameState.comboTimer > 0) {
            this.gameState.comboTimer -= dt;
            if (this.gameState.comboTimer <= 0) {
                this.gameState.combo = 0;
                this.gameState.comboMultiplier = 1;
            }
        }

        // Energy regeneration
        if (time % 3000 < 50 && this.playerStats.energy < this.playerStats.maxEnergy) {
            this.playerStats.energy = Math.min(this.playerStats.maxEnergy, this.playerStats.energy + 1);
        }

        // Player movement
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx -= 1;
        if (this.cursors.right.isDown) vx += 1;
        if (this.cursors.up.isDown) vy -= 1;
        if (this.cursors.down.isDown) vy += 1;

        if (vx && vy) {
            vx *= 0.707;
            vy *= 0.707;
        }

        // Boost
        let speedMult = 1;
        if (this.cursors.shift.isDown && this.playerStats.hasBoost && this.playerStats.energy > 0) {
            speedMult = 1.8;
            this.boosting = true;
            if (time % 200 < 50) {
                this.playerStats.energy = Math.max(0, this.playerStats.energy - 1);
            }
        } else {
            this.boosting = false;
        }

        this.player.setVelocity(
            vx * this.playerStats.speed * speedMult * this.gameState.slowMotion,
            vy * this.playerStats.speed * speedMult * this.gameState.slowMotion
        );

        // Player trail
        if ((vx !== 0 || vy !== 0) && time % 50 < 20) {
            const trail = this.add.circle(this.player.x, this.player.y, 3, COLORS.playerAccent, 0.3);
            trail.setDepth(8);
            this.tweens.add({
                targets: trail,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                onComplete: () => trail.destroy()
            });
        }

        // Player aim
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        this.player.rotation = angle;

        // Super shot charging
        if (this.isCharging && this.playerStats.hasSupershot) {
            this.superShotCharge = Math.min(1, this.superShotCharge + dt * 2);

            // Charge effect
            if (time % 100 < 20) {
                const chargeParticle = this.add.circle(
                    this.player.x + (Math.random() - 0.5) * 40,
                    this.player.y + (Math.random() - 0.5) * 40,
                    3, 0x4080ff, 0.8
                );
                this.tweens.add({
                    targets: chargeParticle,
                    x: this.player.x,
                    y: this.player.y,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => chargeParticle.destroy()
                });
            }
        }

        // Shooting
        if (this.isShooting && this.fireCooldown <= 0 && !this.isCharging) {
            this.firePlayerBullet(angle);
            this.fireCooldown = 1 / this.playerStats.fireRate;
        }

        // Player invincibility flash
        if (this.invincible > 0) {
            this.player.alpha = Math.floor(this.invincible * 10) % 2 === 0 ? 0.3 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemy(enemy, time, dt);
        });

        // Update enemy bullets (slow motion)
        this.enemyBullets.getChildren().forEach(bullet => {
            if (this.gameState.slowMotion < 1) {
                bullet.body.velocity.x *= this.gameState.slowMotion;
                bullet.body.velocity.y *= this.gameState.slowMotion;
            }
        });

        // Update crystals (magnet effect)
        this.crystals.getChildren().forEach(crystal => {
            const dist = Phaser.Math.Distance.Between(crystal.x, crystal.y, this.player.x, this.player.y);
            if (dist < 100) {
                const pull = (100 - dist) / 100 * 400;
                const angle = Phaser.Math.Angle.Between(crystal.x, crystal.y, this.player.x, this.player.y);
                crystal.x += Math.cos(angle) * pull * dt;
                crystal.y += Math.sin(angle) * pull * dt;
            }
        });

        // Update HUD
        this.updateHUD();
        this.updateMinimap();

        // Check wave complete - only if wave has started and enemies have spawned
        if (this.gameState.waveInProgress &&
            this.gameState.enemiesSpawnedThisWave > 0 &&
            this.enemies.countActive() === 0 &&
            !this.gameState.bossActive) {

            // Reset wave state
            this.gameState.waveInProgress = false;

            if (this.gameState.wave >= this.gameState.maxWave) {
                this.victory();
            } else {
                this.gameState.wave++;
                this.time.delayedCall(1500, () => this.spawnWave());
            }
        }
    }

    firePlayerBullet(angle) {
        const bulletCount = this.playerStats.bulletCount;
        const spread = 0.15;

        for (let i = 0; i < bulletCount; i++) {
            const offset = bulletCount > 1 ? (i - (bulletCount - 1) / 2) * spread : 0;
            const a = angle + offset;

            const bullet = this.playerBullets.create(
                this.player.x + Math.cos(a) * 20,
                this.player.y + Math.sin(a) * 20,
                'playerBullet'
            );
            bullet.rotation = a;
            bullet.setVelocity(Math.cos(a) * 500, Math.sin(a) * 500);

            // Critical hit
            const isCrit = Math.random() < this.playerStats.critChance;
            bullet.damage = this.playerStats.damage * (isCrit ? 2 : 1);
            bullet.isCrit = isCrit;

            this.time.delayedCall(this.playerStats.range / 500 * 1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }

        // Muzzle flash
        const flash = this.add.circle(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            8, 0xffff80, 0.8
        );
        this.tweens.add({
            targets: flash,
            scale: 0,
            alpha: 0,
            duration: 80,
            onComplete: () => flash.destroy()
        });
    }

    updateEnemy(enemy, time, dt) {
        if (!enemy.active) return;

        // Hit flash
        if (enemy.hitFlash > 0) {
            enemy.hitFlash -= dt * 5;
            enemy.setTint(0xffffff);
        } else if (enemy.isElite) {
            enemy.setTint(COLORS.enemyElite);
        } else {
            enemy.clearTint();
        }

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Special behaviors
        if (enemy.enemyType === 'grasshopper') {
            enemy.jumpTimer -= dt;
            if (enemy.jumpTimer <= 0) {
                // Jump toward player
                const jumpDist = Math.min(dist, 150);
                enemy.x += Math.cos(angle) * jumpDist * 0.5;
                enemy.y += Math.sin(angle) * jumpDist * 0.5;
                enemy.jumpTimer = 1.5 + Math.random();

                // Fire burst on land
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
                }
            }
            return;
        }

        if (enemy.enemyType === 'burrower') {
            if (enemy.burrowed) {
                enemy.setAlpha(0.3);
                if (dist < 150) {
                    enemy.burrowed = false;
                    enemy.setAlpha(1);
                    // Emerge attack
                    for (let i = 0; i < 8; i++) {
                        const a = (i / 8) * Math.PI * 2;
                        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'homingBullet');
                        bullet.setVelocity(Math.cos(a) * 80, Math.sin(a) * 80);
                        bullet.homing = true;
                        bullet.homingStrength = 2;
                    }
                }
            } else {
                if (dist > 50) {
                    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                } else {
                    enemy.setVelocity(0, 0);
                }
            }
            return;
        }

        if (enemy.enemyType === 'mimic') {
            if (!enemy.revealed) {
                enemy.setTint(COLORS.treeTeal);
                if (dist < 100) {
                    enemy.revealed = true;
                    enemy.clearTint();
                    // Ambush attack
                    for (let i = 0; i < 12; i++) {
                        const a = (i / 12) * Math.PI * 2;
                        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                        bullet.setVelocity(Math.cos(a) * 180, Math.sin(a) * 180);
                    }
                }
            } else {
                if (dist > 80) {
                    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                } else {
                    enemy.setVelocity(-Math.cos(angle) * enemy.speed * 0.5, -Math.sin(angle) * enemy.speed * 0.5);
                }
            }
            return;
        }

        if (enemy.enemyType === 'boss') {
            this.updateBoss(enemy, time, dt, dist, angle);
            return;
        }

        // Standard movement AI
        if (enemy.enemyType === 'scout') {
            if (dist > 150) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else if (dist < 100) {
                enemy.setVelocity(-Math.cos(angle) * enemy.speed, -Math.sin(angle) * enemy.speed);
            } else {
                enemy.setVelocity(0, 0);
            }
            enemy.rotation = angle;
        } else if (enemy.enemyType === 'turret') {
            enemy.rotation = angle;
        } else if (enemy.enemyType === 'heavy') {
            if (dist > 80) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else {
                enemy.setVelocity(0, 0);
            }
        }

        // Firing
        if (time - enemy.lastFire > enemy.fireRate && dist < 400 && enemy.revealed !== false) {
            this.fireEnemyBullet(enemy, angle);
            enemy.lastFire = time;
        }
    }

    updateBoss(boss, time, dt, dist, angle) {
        // Phase changes
        const hpRatio = boss.hp / boss.maxHp;
        if (hpRatio < 0.3 && boss.phase < 3) {
            boss.phase = 3;
            boss.fireRate = 600;
        } else if (hpRatio < 0.6 && boss.phase < 2) {
            boss.phase = 2;
            boss.fireRate = 800;
        }

        // Slow movement
        const moveAngle = angle + Math.sin(time * 0.002) * 0.5;
        if (dist > 200) {
            boss.setVelocity(Math.cos(moveAngle) * boss.speed, Math.sin(moveAngle) * boss.speed);
        } else {
            boss.setVelocity(0, 0);
        }

        // Attack patterns
        if (time - boss.lastFire > boss.fireRate) {
            boss.attackPattern = (boss.attackPattern + 1) % 3;

            if (boss.attackPattern === 0) {
                // Spiral attack
                for (let i = 0; i < 16; i++) {
                    const a = (i / 16) * Math.PI * 2 + time * 0.001;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
                }
            } else if (boss.attackPattern === 1) {
                // Aimed burst
                for (let i = -4; i <= 4; i++) {
                    const a = angle + i * 0.15;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 180, Math.sin(a) * 180);
                }
            } else {
                // Homing missiles
                for (let i = 0; i < 4; i++) {
                    const a = (i / 4) * Math.PI * 2;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'homingBullet');
                    bullet.setVelocity(Math.cos(a) * 60, Math.sin(a) * 60);
                    bullet.homing = true;
                    bullet.homingStrength = 3;
                }
            }

            boss.lastFire = time;
        }

        // Update homing bullets
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.homing) {
                const toPlayer = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
                let angleDiff = toPlayer - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const newAngle = currentAngle + angleDiff * dt * bullet.homingStrength;
                const speed = Math.sqrt(bullet.body.velocity.x ** 2 + bullet.body.velocity.y ** 2);
                bullet.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
            }
        });
    }

    fireEnemyBullet(enemy, angle) {
        const speed = 150;

        if (enemy.enemyType === 'turret') {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else if (enemy.enemyType === 'heavy') {
            for (let i = -2; i <= 2; i++) {
                const a = angle + i * 0.2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else {
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    hitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        enemy.hitFlash = 1;

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, Math.round(bullet.damage).toString(), {
            fontSize: bullet.isCrit ? '18px' : '14px',
            fontFamily: 'Arial',
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
        for (let i = 0; i < 5; i++) {
            const particle = this.add.circle(bullet.x, bullet.y, 3,
                enemy.isElite ? COLORS.enemyElite : COLORS.enemyScout);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: bullet.x + (Math.random() - 0.5) * 60,
                y: bullet.y + (Math.random() - 0.5) * 60,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        bullet.destroy();

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Update combo
        this.gameState.combo++;
        this.gameState.comboTimer = 2;
        this.gameState.comboMultiplier = Math.min(10, 1 + this.gameState.combo * 0.1);

        // Death particles
        const particleCount = enemy.enemyType === 'boss' ? 30 : 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = this.add.circle(enemy.x, enemy.y,
                enemy.enemyType === 'boss' ? 8 : 5,
                enemy.isElite ? COLORS.enemyElite : COLORS.enemyHeavy);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                x: enemy.x + (Math.random() - 0.5) * 150,
                y: enemy.y + (Math.random() - 0.5) * 150,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }

        // Drop crystals
        const count = Math.ceil(enemy.xp / 2) * this.gameState.comboMultiplier;
        for (let i = 0; i < Math.min(count, 10); i++) {
            const crystal = this.crystals.create(
                enemy.x + (Math.random() - 0.5) * 30,
                enemy.y + (Math.random() - 0.5) * 30,
                'crystal'
            );
            crystal.value = Math.ceil(enemy.xp / count * this.gameState.comboMultiplier);
            crystal.setDepth(8);
        }

        // Drop pickups
        if (Math.random() < 0.2) {
            const isHealth = Math.random() < 0.5;
            const pickup = this.pickups.create(enemy.x, enemy.y, isHealth ? 'healthPickup' : 'energyPickup');
            pickup.pickupType = isHealth ? 'health' : 'energy';
            pickup.setDepth(8);
        }

        // Screen shake
        this.cameras.main.shake(enemy.enemyType === 'boss' ? 500 : 100,
            enemy.enemyType === 'boss' ? 0.02 : 0.005);

        // Boss death
        if (enemy.enemyType === 'boss') {
            this.gameState.bossActive = false;
            if (this.bossHealthBg) this.bossHealthBg.destroy();
            if (this.bossHealthFill) this.bossHealthFill.destroy();
            if (this.bossNameText) this.bossNameText.destroy();

            // Extra crystals
            for (let i = 0; i < 20; i++) {
                const crystal = this.crystals.create(
                    enemy.x + (Math.random() - 0.5) * 100,
                    enemy.y + (Math.random() - 0.5) * 100,
                    'crystal'
                );
                crystal.value = 5;
                crystal.setDepth(8);
            }
        }

        enemy.destroy();
        window.enemies = this.enemies.getChildren();
    }

    playerHit(player, bullet) {
        if (this.invincible > 0) return;

        this.playerStats.health--;
        this.invincible = 1.5;
        bullet.destroy();

        // Hit particles (blood splatter)
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(player.x, player.y, 4, COLORS.healthFull);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: player.x + (Math.random() - 0.5) * 100,
                y: player.y + (Math.random() - 0.5) * 100,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        this.cameras.main.shake(200, 0.015);
        this.cameras.main.flash(100, 255, 50, 50);

        if (this.playerStats.health <= 0) {
            this.gameOver();
        }
    }

    collectCrystal(player, crystal) {
        this.gameState.crystals += crystal.value;
        this.gameState.xp += crystal.value;

        // Sparkle effect
        for (let i = 0; i < 5; i++) {
            const sparkle = this.add.circle(
                crystal.x + (Math.random() - 0.5) * 20,
                crystal.y + (Math.random() - 0.5) * 20,
                2, 0xff3050, 1
            );
            this.tweens.add({
                targets: sparkle,
                alpha: 0,
                scale: 2,
                y: sparkle.y - 20,
                duration: 300,
                onComplete: () => sparkle.destroy()
            });
        }

        // Check level up
        while (this.gameState.xp >= this.gameState.xpToLevel) {
            this.gameState.xp -= this.gameState.xpToLevel;
            this.gameState.level++;
            this.gameState.xpToLevel = Math.floor(this.gameState.xpToLevel * 1.2);
            this.playerStats.damage += 0.2;

            // Increase bullet count every 3 levels
            if (this.gameState.level % 3 === 0 && this.playerStats.bulletCount < 5) {
                this.playerStats.bulletCount++;
            }

            // Increase crit chance every 5 levels
            if (this.gameState.level % 5 === 0) {
                this.playerStats.critChance = Math.min(0.5, this.playerStats.critChance + 0.05);
            }

            // Level up effect
            this.cameras.main.flash(300, 80, 255, 128);

            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const particle = this.add.circle(player.x, player.y, 4, 0x50ff80);
                this.tweens.add({
                    targets: particle,
                    alpha: 0,
                    x: player.x + Math.cos(angle) * 80,
                    y: player.y + Math.sin(angle) * 80,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }

            // Level up text
            const lvlText = this.add.text(400, 200, 'LEVEL UP!', {
                fontSize: '32px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#50ff80'
            }).setOrigin(0.5).setDepth(100);

            this.tweens.add({
                targets: lvlText,
                alpha: 0,
                scale: 1.5,
                y: 150,
                duration: 1000,
                onComplete: () => lvlText.destroy()
            });
        }

        crystal.destroy();
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'health') {
            this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 1);
        } else {
            this.playerStats.energy = Math.min(this.playerStats.maxEnergy, this.playerStats.energy + 2);
        }

        // Pickup effect
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(pickup.x, pickup.y, 3,
                pickup.pickupType === 'health' ? 0x50ff80 : 0x50d0ff);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: player.x,
                y: player.y,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }

        pickup.destroy();
    }

    victory() {
        this.gameState.victory = true;

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);

        const victoryText = this.add.text(400, 200, 'VICTORY!', {
            fontSize: '64px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#50ff80'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(400, 300,
            `Crystals: ${this.gameState.crystals}\nLevel: ${this.gameState.level}\nMax Combo: ${Math.floor(this.gameState.comboMultiplier * 10) / 10}x`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 420, 'Press SPACE to play again', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        // Victory particles
        for (let i = 0; i < 50; i++) {
            this.time.delayedCall(i * 50, () => {
                const x = Math.random() * 800;
                const particle = this.add.circle(x, 600, 5, 0x50ff80);
                particle.setDepth(202);
                this.tweens.add({
                    targets: particle,
                    y: -50,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => particle.destroy()
                });
            });
        }

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    gameOver() {
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setDepth(200);

        const gameOverText = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff4060'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(400, 320,
            `Wave: ${this.gameState.wave}  Crystals: ${this.gameState.crystals}  Level: ${this.gameState.level}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 380, 'Press SPACE to restart', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
}

// Game config
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a15',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
