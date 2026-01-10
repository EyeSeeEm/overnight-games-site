// Minishoot Adventures Clone - Phaser 3 Version
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
    bulletPlayer: 0x50c8ff,
    bulletEnemy: 0xff6030,
    crystal: 0xff3050,
    healthFull: 0xff4060,
    healthEmpty: 0x402030,
    energyFull: 0x50d0ff,
    energyEmpty: 0x203040,
    enemyScout: 0x50aa70,
    enemyTurret: 0x8060a0,
    enemyHeavy: 0xc06040
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

        // Engine glow
        playerGfx.fillStyle(0x50c8ff, 0.5);
        playerGfx.fillEllipse(6, 16, 16, 8);

        // Wings
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

        // Body
        playerGfx.fillStyle(0xe8f8ff);
        playerGfx.beginPath();
        playerGfx.moveTo(28, 16);  // Nose
        playerGfx.lineTo(22, 8);
        playerGfx.lineTo(12, 8);
        playerGfx.lineTo(10, 16);
        playerGfx.lineTo(12, 24);
        playerGfx.lineTo(22, 24);
        playerGfx.closePath();
        playerGfx.fillPath();

        // Body outline
        playerGfx.lineStyle(1, 0x70b8d0);
        playerGfx.strokePath();

        // Cockpit
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

        // Enemy bullet texture
        const enemyBulletGfx = this.make.graphics({ add: false });
        enemyBulletGfx.lineStyle(2, COLORS.bulletEnemy);
        enemyBulletGfx.strokeCircle(10, 10, 8);
        enemyBulletGfx.fillStyle(COLORS.bulletEnemy);
        enemyBulletGfx.fillCircle(10, 10, 6);
        enemyBulletGfx.fillStyle(0x802010);
        enemyBulletGfx.fillCircle(10, 10, 3);
        enemyBulletGfx.generateTexture('enemyBullet', 20, 20);

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

        // Tree textures
        this.createTreeTexture('treeTeal', COLORS.treeTeal, 0x1a3a4a);
        this.createTreeTexture('treeOrange', COLORS.treeOrange, 0xa05018);
    }

    createTreeTexture(name, mainColor, shadowColor) {
        const gfx = this.make.graphics({ add: false });
        const size = 60;

        // Shadow puffs
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 12;
            const fx = size/2 + Math.cos(angle) * dist;
            const fy = size/2 - 6 + Math.sin(angle) * dist * 0.6;
            gfx.fillStyle(shadowColor);
            gfx.fillCircle(fx, fy, 18);
        }

        // Main puff
        gfx.fillStyle(mainColor);
        gfx.fillCircle(size/2, size/2 - 6, 22);

        // Highlight
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
            xpToLevel: 15
        };

        this.playerStats = {
            maxHealth: 5,
            health: 5,
            maxEnergy: 4,
            energy: 4,
            damage: 1,
            fireRate: 4,
            speed: 200,
            range: 350
        };

        this.fireCooldown = 0;
        this.dashCooldown = 0;
        this.invincible = 0;
    }

    create() {
        // Draw background
        this.drawBackground();

        // Create groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.crystals = this.physics.add.group();
        this.trees = this.add.group();

        // Create trees
        this.createTrees();

        // Create player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setDepth(10);
        this.player.setCollideWorldBounds(true);

        // Spawn enemies
        this.spawnEnemies();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            space: 'SPACE'
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isShooting = true;
            }
        });

        this.input.on('pointerup', () => {
            this.isShooting = false;
        });

        // Dash input
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.dashCooldown <= 0) {
                this.dash();
            }
        });

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.crystals, this.collectCrystal, null, this);

        // HUD
        this.createHUD();

        // Expose for testing
        window.gameState = this.gameState;
        window.player = this.playerStats;
        window.enemies = this.enemies.getChildren();
    }

    drawBackground() {
        // Space background
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
        // Border trees
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
        positions.push({ x: 350, y: 200 }, { x: 450, y: 450 });

        positions.forEach(pos => {
            const isOrange = Math.random() > 0.7;
            const tree = this.add.image(pos.x, pos.y, isOrange ? 'treeOrange' : 'treeTeal');
            tree.setScale(0.8 + Math.random() * 0.4);
            tree.setDepth(pos.y > 300 ? 15 : 5);
            this.trees.add(tree);
        });
    }

    spawnEnemies() {
        const count = 4 + this.gameState.level * 2;

        for (let i = 0; i < count; i++) {
            const types = ['scout', 'turret', 'heavy'];
            const weights = [0.6, 0.3, 0.1];
            const rand = Math.random();
            let type = 'scout';
            if (rand > weights[0]) type = 'turret';
            if (rand > weights[0] + weights[1]) type = 'heavy';

            let x, y;
            do {
                x = 120 + Math.random() * 560;
                y = 120 + Math.random() * 360;
            } while (Phaser.Math.Distance.Between(x, y, 400, 300) < 150);

            this.createEnemy(type, x, y);
        }

        window.enemies = this.enemies.getChildren();
    }

    createEnemy(type, x, y) {
        const configs = {
            scout: { hp: 3, speed: 80, fireRate: 1200, size: 0.8, xp: 2 },
            turret: { hp: 6, speed: 0, fireRate: 1500, size: 1, xp: 4 },
            heavy: { hp: 12, speed: 40, fireRate: 2000, size: 0.9, xp: 6 }
        };
        const cfg = configs[type];

        const enemy = this.enemies.create(x, y, type);
        enemy.setScale(cfg.size);
        enemy.setDepth(10);
        enemy.enemyType = type;
        enemy.hp = cfg.hp;
        enemy.maxHp = cfg.hp;
        enemy.speed = cfg.speed;
        enemy.fireRate = cfg.fireRate;
        enemy.xp = cfg.xp;
        enemy.lastFire = 0;
        enemy.hitFlash = 0;

        return enemy;
    }

    dash() {
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );

        const dashDist = 120;
        const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dashDist, 100, 700);
        const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dashDist, 100, 500);

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
        for (let i = 0; i < 4; i++) {
            const diamond = this.add.graphics();
            this.drawDiamond(diamond, 25 + i * 24, 48, true);
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

        // Enemy counter
        this.enemyText = this.add.text(700, 15, 'Enemies: 0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.hudContainer.add(this.enemyText);

        // Ability bar
        this.createAbilityBar();
    }

    drawHeart(graphics, x, y, filled) {
        graphics.clear();
        graphics.fillStyle(filled ? COLORS.healthFull : COLORS.healthEmpty);
        graphics.beginPath();
        // Heart shape
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
        graphics.moveTo(x, y - 10);
        graphics.lineTo(x + 8, y);
        graphics.lineTo(x, y + 10);
        graphics.lineTo(x - 8, y);
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(2, filled ? 0x80e0ff : 0x304050);
        graphics.strokePath();
    }

    createAbilityBar() {
        const abilities = ['DASH', 'SUPER', 'MAP'];
        const startX = 310;
        const y = 555;

        abilities.forEach((name, i) => {
            const x = startX + i * 50;

            // Hexagon
            const hex = this.add.graphics();
            hex.fillStyle(0x50c8ff, 0.3);
            hex.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (j / 6) * Math.PI * 2 - Math.PI / 2;
                const px = Math.cos(angle) * 20;
                const py = Math.sin(angle) * 20;
                if (j === 0) hex.moveTo(px, py);
                else hex.lineTo(px, py);
            }
            hex.closePath();
            hex.fillPath();
            hex.lineStyle(2, 0x50c8ff);
            hex.strokePath();
            hex.x = x;
            hex.y = y;
            this.hudContainer.add(hex);

            const text = this.add.text(x, y, name, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.hudContainer.add(text);
        });
    }

    updateHUD() {
        // Update hearts
        for (let i = 0; i < this.hearts.length; i++) {
            this.drawHeart(this.hearts[i], 25 + i * 24, 20, i < this.playerStats.health);
        }

        // Update energy
        for (let i = 0; i < this.energyDiamonds.length; i++) {
            this.drawDiamond(this.energyDiamonds[i], 25 + i * 24, 48, i < this.playerStats.energy);
        }

        // Update crystal text
        this.crystalText.setText(this.gameState.crystals.toString());

        // Update XP bar
        const xpRatio = this.gameState.xp / this.gameState.xpToLevel;
        this.xpBarFill.width = 150 * xpRatio;

        // Update level
        this.levelText.setText(`LVL ${this.gameState.level}`);

        // Update enemy count
        this.enemyText.setText(`Enemies: ${this.enemies.countActive()}`);
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Update cooldowns
        this.fireCooldown -= dt;
        this.dashCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

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

        this.player.setVelocity(vx * this.playerStats.speed, vy * this.playerStats.speed);

        // Player aim
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        this.player.rotation = angle;

        // Shooting
        if (this.isShooting && this.fireCooldown <= 0) {
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

        // Update crystals (magnet effect)
        this.crystals.getChildren().forEach(crystal => {
            const dist = Phaser.Math.Distance.Between(crystal.x, crystal.y, this.player.x, this.player.y);
            if (dist < 80) {
                const pull = (80 - dist) / 80 * 300;
                const angle = Phaser.Math.Angle.Between(crystal.x, crystal.y, this.player.x, this.player.y);
                crystal.x += Math.cos(angle) * pull * dt;
                crystal.y += Math.sin(angle) * pull * dt;
            }
        });

        // Update HUD
        this.updateHUD();

        // Check wave complete
        if (this.enemies.countActive() === 0) {
            this.gameState.level++;
            this.time.delayedCall(1500, () => this.spawnEnemies());
        }
    }

    firePlayerBullet(angle) {
        const bullet = this.playerBullets.create(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20,
            'playerBullet'
        );
        bullet.rotation = angle;
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        bullet.damage = this.playerStats.damage;
        bullet.traveled = 0;
        bullet.startX = bullet.x;
        bullet.startY = bullet.y;

        // Auto destroy after range
        this.time.delayedCall(this.playerStats.range / 500 * 1000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateEnemy(enemy, time, dt) {
        if (!enemy.active) return;

        // Hit flash
        if (enemy.hitFlash > 0) {
            enemy.hitFlash -= dt * 5;
            enemy.setTint(0xffffff);
        } else {
            enemy.clearTint();
        }

        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Movement AI
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
        if (time - enemy.lastFire > enemy.fireRate && dist < 400) {
            this.fireEnemyBullet(enemy, angle);
            enemy.lastFire = time;
        }
    }

    fireEnemyBullet(enemy, angle) {
        const speed = 150;

        if (enemy.enemyType === 'turret') {
            // Spray 8 bullets
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else if (enemy.enemyType === 'heavy') {
            // Spread 5 bullets
            for (let i = -2; i <= 2; i++) {
                const a = angle + i * 0.2;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            }
        } else {
            // Single bullet
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    hitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        enemy.hitFlash = 1;

        // Hit particles
        for (let i = 0; i < 5; i++) {
            const particle = this.add.circle(bullet.x, bullet.y, 3, COLORS.enemyScout);
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
        // Death particles
        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(enemy.x, enemy.y, 5, COLORS.enemyHeavy);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                x: enemy.x + (Math.random() - 0.5) * 100,
                y: enemy.y + (Math.random() - 0.5) * 100,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        // Drop crystals
        const count = Math.ceil(enemy.xp / 2);
        for (let i = 0; i < count; i++) {
            const crystal = this.crystals.create(
                enemy.x + (Math.random() - 0.5) * 30,
                enemy.y + (Math.random() - 0.5) * 30,
                'crystal'
            );
            crystal.value = Math.ceil(enemy.xp / count);
            crystal.setDepth(8);
        }

        // Screen shake
        this.cameras.main.shake(100, 0.005);

        enemy.destroy();
        window.enemies = this.enemies.getChildren();
    }

    playerHit(player, bullet) {
        if (this.invincible > 0) return;

        this.playerStats.health--;
        this.invincible = 1.5;
        bullet.destroy();

        // Hit particles
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(player.x, player.y, 4, COLORS.healthFull);
            this.tweens.add({
                targets: particle,
                alpha: 0,
                x: player.x + (Math.random() - 0.5) * 80,
                y: player.y + (Math.random() - 0.5) * 80,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        this.cameras.main.shake(150, 0.01);

        if (this.playerStats.health <= 0) {
            this.gameOver();
        }
    }

    collectCrystal(player, crystal) {
        this.gameState.crystals += crystal.value;
        this.gameState.xp += crystal.value;

        // Check level up
        while (this.gameState.xp >= this.gameState.xpToLevel) {
            this.gameState.xp -= this.gameState.xpToLevel;
            this.gameState.level++;
            this.gameState.xpToLevel = Math.floor(this.gameState.xpToLevel * 1.2);
            this.playerStats.damage += 0.2;

            // Level up effect
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
        }

        crystal.destroy();
    }

    gameOver() {
        // Game over overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7).setDepth(200);

        const gameOverText = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff4060'
        }).setOrigin(0.5).setDepth(201);

        const statsText = this.add.text(400, 320,
            `Crystals: ${this.gameState.crystals}  Level: ${this.gameState.level}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        const restartText = this.add.text(400, 380, 'Press SPACE to restart', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        // Restart on space
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
