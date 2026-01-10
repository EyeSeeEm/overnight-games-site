// Bullet Dungeon - Phaser 3 Version
// Enter the Gungeon Clone

const COLORS = {
    floor: 0x3A3540,
    floorGrid: 0x2A252F,
    wall: 0x252030,
    door: 0x5A4A40,
    doorOpen: 0x2A2520,
    player: 0xDDAA66,
    bulletKin: 0xAA8866,
    shotgunKin: 0x7777AA,
    playerBullet: 0xFFFF88,
    enemyBullet: 0xFF6644,
    heart: 0xCC3333,
    heartEmpty: 0x441111,
    shell: 0xFFCC33,
    key: 0xFFDD44,
    blank: 0x88DDFF
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player texture
        const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        // Body
        playerGfx.fillStyle(COLORS.player);
        playerGfx.fillEllipse(16, 18, 18, 22);
        playerGfx.lineStyle(2, 0xAA7744);
        playerGfx.strokeEllipse(16, 18, 18, 22);
        // Head
        playerGfx.fillEllipse(16, 8, 14, 14);
        playerGfx.strokeEllipse(16, 8, 14, 14);
        // Eyes
        playerGfx.fillStyle(0xFFFFFF);
        playerGfx.fillCircle(13, 7, 3);
        playerGfx.fillCircle(19, 7, 3);
        playerGfx.fillStyle(0x111111);
        playerGfx.fillCircle(14, 7, 1.5);
        playerGfx.fillCircle(20, 7, 1.5);
        playerGfx.generateTexture('player', 32, 32);
        playerGfx.destroy();

        // Gun texture
        const gunGfx = this.make.graphics({ x: 0, y: 0, add: false });
        gunGfx.fillStyle(0x666666);
        gunGfx.fillRect(0, 2, 20, 8);
        gunGfx.fillStyle(0x888888);
        gunGfx.fillRect(2, 3, 16, 6);
        gunGfx.generateTexture('gun', 20, 12);
        gunGfx.destroy();

        // Bullet Kin texture
        const bulletKinGfx = this.make.graphics({ x: 0, y: 0, add: false });
        bulletKinGfx.fillStyle(COLORS.bulletKin);
        bulletKinGfx.fillEllipse(16, 18, 16, 22);
        bulletKinGfx.beginPath();
        bulletKinGfx.arc(16, 6, 8, Math.PI, 0);
        bulletKinGfx.fillPath();
        // Eyes
        bulletKinGfx.fillStyle(0xFFFFFF);
        bulletKinGfx.fillEllipse(12, 14, 6, 8);
        bulletKinGfx.fillEllipse(20, 14, 6, 8);
        bulletKinGfx.fillStyle(0x111111);
        bulletKinGfx.fillCircle(13, 15, 2);
        bulletKinGfx.fillCircle(21, 15, 2);
        bulletKinGfx.generateTexture('bulletKin', 32, 32);
        bulletKinGfx.destroy();

        // Shotgun Kin texture
        const shotgunKinGfx = this.make.graphics({ x: 0, y: 0, add: false });
        shotgunKinGfx.fillStyle(COLORS.shotgunKin);
        shotgunKinGfx.fillEllipse(20, 22, 20, 26);
        shotgunKinGfx.beginPath();
        shotgunKinGfx.arc(20, 8, 10, Math.PI, 0);
        shotgunKinGfx.fillPath();
        // Bandana
        shotgunKinGfx.fillStyle(0xCC4444);
        shotgunKinGfx.fillEllipse(20, 12, 12, 4);
        // Eyes
        shotgunKinGfx.fillStyle(0xFFFFFF);
        shotgunKinGfx.fillEllipse(14, 18, 7, 9);
        shotgunKinGfx.fillEllipse(26, 18, 7, 9);
        shotgunKinGfx.fillStyle(0x111111);
        shotgunKinGfx.fillCircle(15, 19, 2.5);
        shotgunKinGfx.fillCircle(27, 19, 2.5);
        shotgunKinGfx.generateTexture('shotgunKin', 40, 40);
        shotgunKinGfx.destroy();

        // Player bullet
        const pBulletGfx = this.make.graphics({ x: 0, y: 0, add: false });
        pBulletGfx.fillStyle(COLORS.playerBullet);
        pBulletGfx.fillRect(0, 2, 16, 4);
        pBulletGfx.generateTexture('playerBullet', 16, 8);
        pBulletGfx.destroy();

        // Enemy bullet
        const eBulletGfx = this.make.graphics({ x: 0, y: 0, add: false });
        eBulletGfx.fillStyle(0xFF4422, 0.5);
        eBulletGfx.fillCircle(8, 8, 8);
        eBulletGfx.fillStyle(COLORS.enemyBullet);
        eBulletGfx.fillCircle(8, 8, 5);
        eBulletGfx.generateTexture('enemyBullet', 16, 16);
        eBulletGfx.destroy();

        // Heart texture
        const heartGfx = this.make.graphics({ x: 0, y: 0, add: false });
        heartGfx.fillStyle(COLORS.heart);
        heartGfx.fillCircle(5, 4, 5);
        heartGfx.fillCircle(13, 4, 5);
        heartGfx.fillTriangle(0, 6, 9, 18, 18, 6);
        heartGfx.generateTexture('heart', 18, 18);
        heartGfx.destroy();

        // Empty heart texture
        const emptyHeartGfx = this.make.graphics({ x: 0, y: 0, add: false });
        emptyHeartGfx.fillStyle(COLORS.heartEmpty);
        emptyHeartGfx.fillCircle(5, 4, 5);
        emptyHeartGfx.fillCircle(13, 4, 5);
        emptyHeartGfx.fillTriangle(0, 6, 9, 18, 18, 6);
        emptyHeartGfx.generateTexture('emptyHeart', 18, 18);
        emptyHeartGfx.destroy();

        // Shell pickup
        const shellGfx = this.make.graphics({ x: 0, y: 0, add: false });
        shellGfx.fillStyle(COLORS.shell);
        shellGfx.fillCircle(6, 6, 6);
        shellGfx.fillStyle(0xAA8822);
        shellGfx.fillRect(4, 2, 4, 8);
        shellGfx.generateTexture('shell', 12, 12);
        shellGfx.destroy();

        // Key
        const keyGfx = this.make.graphics({ x: 0, y: 0, add: false });
        keyGfx.fillStyle(COLORS.key);
        keyGfx.fillCircle(6, 5, 5);
        keyGfx.fillRect(4, 8, 4, 10);
        keyGfx.fillRect(6, 14, 4, 3);
        keyGfx.generateTexture('key', 12, 20);
        keyGfx.destroy();

        // Blank
        const blankGfx = this.make.graphics({ x: 0, y: 0, add: false });
        blankGfx.fillStyle(COLORS.blank);
        blankGfx.fillCircle(8, 8, 8);
        blankGfx.fillStyle(0xFFFFFF);
        blankGfx.fillCircle(8, 8, 4);
        blankGfx.generateTexture('blank', 16, 16);
        blankGfx.destroy();
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1A1A20');

        this.add.text(400, 150, 'BULLET DUNGEON', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 200, 'A Bullet Hell Roguelike', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        const controls = [
            'WASD - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'Space/Shift - Dodge Roll',
            'Q - Use Blank',
            'R - Reload'
        ];

        controls.forEach((text, i) => {
            this.add.text(400, 280 + i * 30, text, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#FFFFFF'
            }).setOrigin(0.5);
        });

        this.startText = this.add.text(400, 520, 'Press SPACE to Start', {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#33CC33'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.startText.visible = !this.startText.visible;
            },
            loop: true
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game state
        this.floor = 1;
        this.roomNum = 1;
        this.roomCleared = false;
        this.doorsOpen = false;
        this.roomBounds = { x: 200, y: 150, w: 400, h: 300 };

        // Create room background
        this.roomGraphics = null;
        this.createRoom();

        // Groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.damageNumbers = this.add.group();

        // Player
        this.createPlayer();

        // Spawn enemies
        this.spawnEnemies();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D',
            space: 'SPACE', shift: 'SHIFT',
            q: 'Q', r: 'R'
        });

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitBullet, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Create UI
        this.createUI();

        // Mouse tracking
        this.input.on('pointermove', pointer => {
            this.mouseX = pointer.worldX;
            this.mouseY = pointer.worldY;
        });

        // Shooting
        this.input.on('pointerdown', () => {
            this.isShooting = true;
        });
        this.input.on('pointerup', () => {
            this.isShooting = false;
        });
    }

    createRoom() {
        const b = this.roomBounds;

        // Destroy old graphics if exists
        if (this.roomGraphics) {
            this.roomGraphics.destroy();
        }

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.floor);
        bg.fillRect(b.x, b.y, b.w, b.h);

        // Grid
        bg.lineStyle(1, COLORS.floorGrid);
        for (let x = b.x; x <= b.x + b.w; x += 32) {
            bg.lineBetween(x, b.y, x, b.y + b.h);
        }
        for (let y = b.y; y <= b.y + b.h; y += 32) {
            bg.lineBetween(b.x, y, b.x + b.w, y);
        }

        // Walls
        bg.fillStyle(COLORS.wall);
        bg.fillRect(b.x - 20, b.y - 20, b.w + 40, 20);
        bg.fillRect(b.x - 20, b.y + b.h, b.w + 40, 20);
        bg.fillRect(b.x - 20, b.y, 20, b.h);
        bg.fillRect(b.x + b.w, b.y, 20, b.h);

        // Doors (closed by default - red color)
        bg.fillStyle(COLORS.door);
        bg.fillRect(b.x + b.w / 2 - 20, b.y - 20, 40, 20);
        bg.fillRect(b.x + b.w / 2 - 20, b.y + b.h, 40, 20);
        bg.fillRect(b.x - 20, b.y + b.h / 2 - 20, 20, 40);
        bg.fillRect(b.x + b.w, b.y + b.h / 2 - 20, 20, 40);

        bg.setDepth(-1);
        this.roomGraphics = bg;
    }

    createPlayer() {
        const b = this.roomBounds;
        this.player = this.physics.add.sprite(b.x + b.w / 2, b.y + b.h / 2, 'player');
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);

        // Stats
        this.player.hp = 6;
        this.player.maxHp = 6;
        this.player.blanks = 2;
        this.player.keys = 1;
        this.player.shells = 0;
        this.player.speed = 200;
        this.player.ammo = 12;
        this.player.maxAmmo = 12;
        this.player.fireRate = 4;
        this.player.fireTimer = 0;
        this.player.reloading = false;
        this.player.reloadTimer = 0;
        this.player.invulnerable = false;
        this.player.invulnTimer = 0;
        this.player.isRolling = false;
        this.player.rollTimer = 0;
        this.player.rollCooldown = 0;

        // Gun sprite
        this.gun = this.add.sprite(this.player.x, this.player.y, 'gun');
        this.gun.setDepth(11);
    }

    spawnEnemies() {
        const b = this.roomBounds;
        const count = 3 + Math.floor(this.floor * 1.5);

        for (let i = 0; i < count; i++) {
            const x = b.x + 50 + Math.random() * (b.w - 100);
            const y = b.y + 50 + Math.random() * (b.h - 100);

            let type = 'bulletKin';
            if (this.floor >= 2 && Math.random() < 0.3) type = 'shotgunKin';

            const enemy = this.enemies.create(x, y, type);
            enemy.enemyType = type;
            enemy.hp = type === 'shotgunKin' ? 25 : 15;
            enemy.maxHp = enemy.hp;
            enemy.speed = type === 'shotgunKin' ? 50 : 60;
            enemy.fireRate = type === 'shotgunKin' ? 1.0 : 1.5;
            enemy.fireTimer = Math.random() * (1 / enemy.fireRate);
            enemy.moveTimer = 0;
            enemy.moveDir = { x: 0, y: 0 };
            enemy.setDepth(5);
        }
    }

    createUI() {
        // Hearts background
        for (let i = 0; i < 3; i++) {
            this.add.image(30 + i * 24, 25, 'emptyHeart').setDepth(100);
        }

        // Hearts (will be updated)
        this.heartImages = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(30 + i * 24, 25, 'heart').setDepth(101);
            this.heartImages.push(heart);
        }

        // Blanks
        this.add.image(30, 55, 'blank').setDepth(100);
        this.blanksText = this.add.text(45, 48, '2', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setDepth(100);

        // Keys
        this.add.image(80, 55, 'key').setDepth(100);
        this.keysText = this.add.text(95, 48, '1', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setDepth(100);

        // Shells
        this.add.image(130, 55, 'shell').setDepth(100);
        this.shellsText = this.add.text(145, 48, '0', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setDepth(100);

        // Ammo
        this.ammoText = this.add.text(780, 580, '12/12', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(1, 1).setDepth(100);

        // Floor
        this.floorText = this.add.text(780, 25, 'Floor 1', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(1, 0).setDepth(100);

        // Reload indicator
        this.reloadText = this.add.text(400, 550, 'RELOADING...', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFF88'
        }).setOrigin(0.5).setDepth(100).setVisible(false);
    }

    update(time, delta) {
        const dt = delta / 1000;

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateBullets(dt);
        this.updateDamageNumbers(dt);
        this.updateUI();
        this.checkRoomClear();
    }

    updatePlayer(dt) {
        const p = this.player;
        const b = this.roomBounds;

        // Rolling
        if (p.isRolling) {
            p.rollTimer -= dt;
            p.setVelocity(p.rollDirX * 450, p.rollDirY * 450);
            p.invulnerable = p.rollTimer > 0.25;

            if (p.rollTimer <= 0) {
                p.isRolling = false;
                p.invulnerable = false;
            }
        } else {
            // Normal movement
            let vx = 0, vy = 0;
            if (this.cursors.up.isDown || this.wasd.w.isDown) vy = -1;
            if (this.cursors.down.isDown || this.wasd.s.isDown) vy = 1;
            if (this.cursors.left.isDown || this.wasd.a.isDown) vx = -1;
            if (this.cursors.right.isDown || this.wasd.d.isDown) vx = 1;

            if (vx && vy) {
                vx *= 0.707;
                vy *= 0.707;
            }

            p.setVelocity(vx * p.speed, vy * p.speed);

            // Dodge roll
            p.rollCooldown -= dt;
            if ((this.wasd.space.isDown || this.wasd.shift.isDown) && p.rollCooldown <= 0 && (vx || vy)) {
                p.isRolling = true;
                p.rollTimer = 0.5;
                p.rollCooldown = 0.1;
                const mag = Math.sqrt(vx * vx + vy * vy);
                p.rollDirX = vx / mag;
                p.rollDirY = vy / mag;
            }
        }

        // Clamp to room
        p.x = Phaser.Math.Clamp(p.x, b.x + 20, b.x + b.w - 20);
        p.y = Phaser.Math.Clamp(p.y, b.y + 20, b.y + b.h - 20);

        // Gun aim
        const angle = Math.atan2(this.mouseY - p.y, this.mouseX - p.x);
        this.gun.setPosition(p.x + Math.cos(angle) * 15, p.y + Math.sin(angle) * 15);
        this.gun.setRotation(angle);

        // Shooting
        p.fireTimer -= dt;
        if (this.isShooting && p.fireTimer <= 0 && !p.reloading && !p.isRolling && p.ammo > 0) {
            this.fire(angle);
        }

        // Auto-reload when empty
        if (p.ammo <= 0 && !p.reloading) {
            this.startReload();
        }

        // Reloading
        if (p.reloading) {
            p.reloadTimer -= dt;
            if (p.reloadTimer <= 0) {
                p.ammo = p.maxAmmo;
                p.reloading = false;
            }
        }

        // Manual reload
        if (Phaser.Input.Keyboard.JustDown(this.wasd.r) && !p.reloading && p.ammo < p.maxAmmo) {
            this.startReload();
        }

        // Use blank
        if (Phaser.Input.Keyboard.JustDown(this.wasd.q)) {
            this.useBlank();
        }

        // Invulnerability
        if (p.invulnTimer > 0) {
            p.invulnTimer -= dt;
            p.invulnerable = true;
            p.setAlpha(Math.floor(p.invulnTimer * 10) % 2 === 0 ? 0.5 : 1);
        } else if (!p.isRolling) {
            p.invulnerable = false;
            p.setAlpha(1);
        }
    }

    fire(angle) {
        const p = this.player;
        const spread = (Math.random() - 0.5) * 0.05;

        const bullet = this.playerBullets.create(
            p.x + Math.cos(angle) * 25,
            p.y + Math.sin(angle) * 25,
            'playerBullet'
        );
        bullet.setRotation(angle + spread);
        bullet.setVelocity(
            Math.cos(angle + spread) * 600,
            Math.sin(angle + spread) * 600
        );
        bullet.damage = 5;
        bullet.setDepth(8);

        p.ammo--;
        p.fireTimer = 1 / p.fireRate;
    }

    startReload() {
        this.player.reloading = true;
        this.player.reloadTimer = 1.0;
    }

    useBlank() {
        const p = this.player;
        if (p.blanks <= 0) return;

        p.blanks--;

        // Clear all enemy bullets
        this.enemyBullets.clear(true, true);

        // Knockback enemies
        this.enemies.getChildren().forEach(enemy => {
            const dx = enemy.x - p.x;
            const dy = enemy.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                enemy.x += (dx / dist) * 50;
                enemy.y += (dy / dist) * 50;
            }
        });
    }

    updateEnemies(dt) {
        const p = this.player;
        const b = this.roomBounds;

        this.enemies.getChildren().forEach(enemy => {
            // Movement AI
            enemy.moveTimer -= dt;
            if (enemy.moveTimer <= 0) {
                const dx = p.x - enemy.x;
                const dy = p.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 150) {
                    enemy.moveDir.x = dx / dist + (Math.random() - 0.5) * 0.5;
                    enemy.moveDir.y = dy / dist + (Math.random() - 0.5) * 0.5;
                } else {
                    enemy.moveDir.x = -dy / dist + (Math.random() - 0.5) * 0.5;
                    enemy.moveDir.y = dx / dist + (Math.random() - 0.5) * 0.5;
                }
                enemy.moveTimer = 0.5 + Math.random() * 0.5;
            }

            enemy.x += enemy.moveDir.x * enemy.speed * dt;
            enemy.y += enemy.moveDir.y * enemy.speed * dt;

            // Clamp to room
            enemy.x = Phaser.Math.Clamp(enemy.x, b.x + 25, b.x + b.w - 25);
            enemy.y = Phaser.Math.Clamp(enemy.y, b.y + 25, b.y + b.h - 25);

            // Shooting
            enemy.fireTimer -= dt;
            if (enemy.fireTimer <= 0) {
                this.enemyFire(enemy);
                enemy.fireTimer = 1 / enemy.fireRate;
            }
        });
    }

    enemyFire(enemy) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);

        if (enemy.enemyType === 'shotgunKin') {
            // Spread shot
            for (let i = -2; i <= 2; i++) {
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                const spread = i * 0.15;
                bullet.setVelocity(
                    Math.cos(angle + spread) * 180,
                    Math.sin(angle + spread) * 180
                );
                bullet.damage = 1;
                bullet.setDepth(7);
            }
        } else {
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
            bullet.damage = 1;
            bullet.setDepth(7);
        }
    }

    updateBullets(dt) {
        const b = this.roomBounds;

        // Remove out-of-bounds bullets
        this.playerBullets.getChildren().forEach(bullet => {
            if (bullet.x < b.x || bullet.x > b.x + b.w || bullet.y < b.y || bullet.y > b.y + b.h) {
                bullet.destroy();
            }
        });

        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.x < b.x || bullet.x > b.x + b.w || bullet.y < b.y || bullet.y > b.y + b.h) {
                bullet.destroy();
            }
        });
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;

        // Damage number
        this.createDamageNumber(enemy.x, enemy.y - 20, bullet.damage);

        // Hit flash
        enemy.setTint(0xFFFFFF);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        bullet.destroy();

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Drop shells
        const count = enemy.enemyType === 'shotgunKin' ? 3 : 1;
        for (let i = 0; i < count; i++) {
            const shell = this.pickups.create(
                enemy.x + Phaser.Math.Between(-15, 15),
                enemy.y + Phaser.Math.Between(-15, 15),
                'shell'
            );
            shell.pickupType = 'shell';
            shell.value = 1;
            shell.setDepth(2);
        }

        enemy.destroy();
    }

    playerHitBullet(player, bullet) {
        if (player.invulnerable) return;

        player.hp -= bullet.damage;
        player.invulnTimer = 1.0;

        // Screen shake
        this.cameras.main.shake(100, 0.01);

        bullet.destroy();

        if (player.hp <= 0) {
            this.scene.start('GameOverScene', { floor: this.floor, shells: player.shells });
        }
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'shell') {
            player.shells += pickup.value;
        }
        pickup.destroy();
    }

    createDamageNumber(x, y, value) {
        const text = this.add.text(x, y, value.toString(), {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(50);
        text.life = 0.5;
        text.vy = -50;
        this.damageNumbers.add(text);
    }

    updateDamageNumbers(dt) {
        this.damageNumbers.getChildren().forEach(text => {
            text.y += text.vy * dt;
            text.life -= dt;
            text.setAlpha(text.life / 0.5);
            if (text.life <= 0) {
                text.destroy();
            }
        });
    }

    checkRoomClear() {
        if (this.enemies.getLength() === 0 && !this.roomCleared) {
            this.roomCleared = true;
            this.doorsOpen = true;

            // Update room graphics to show open doors
            this.updateDoorGraphics();

            // Show message
            this.showRoomClearMessage();

            // Bonus drops
            if (Math.random() < 0.3) {
                const pickup = this.pickups.create(
                    this.player.x + Phaser.Math.Between(-30, 30),
                    this.player.y + Phaser.Math.Between(-30, 30),
                    'heart'
                );
                pickup.pickupType = 'heart';
                pickup.value = 2;
                pickup.setDepth(2);
            }
        }

        // Check for door transitions (only when room is cleared)
        if (this.doorsOpen) {
            this.checkDoorTransition();
        }
    }

    showRoomClearMessage() {
        const msg = this.add.text(400, 300, 'ROOM CLEARED!', {
            fontSize: '28px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#33FF33'
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: msg,
            y: 250,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    updateDoorGraphics() {
        const b = this.roomBounds;

        // Add green door indicators
        const doorIndicators = this.add.graphics();
        doorIndicators.fillStyle(0x33FF33);
        doorIndicators.fillRect(b.x + b.w / 2 - 20, b.y - 20, 40, 20); // Top
        doorIndicators.fillRect(b.x + b.w / 2 - 20, b.y + b.h, 40, 20); // Bottom
        doorIndicators.fillRect(b.x - 20, b.y + b.h / 2 - 20, 20, 40); // Left
        doorIndicators.fillRect(b.x + b.w, b.y + b.h / 2 - 20, 20, 40); // Right
        doorIndicators.setDepth(50);
    }

    checkDoorTransition() {
        const p = this.player;
        const b = this.roomBounds;

        // Door hitboxes (slightly extended beyond room)
        const doorW = 40, doorH = 40;

        // Top door
        if (p.x > b.x + b.w / 2 - doorW / 2 && p.x < b.x + b.w / 2 + doorW / 2 && p.y < b.y + 10) {
            this.transitionRoom('up');
        }
        // Bottom door
        if (p.x > b.x + b.w / 2 - doorW / 2 && p.x < b.x + b.w / 2 + doorW / 2 && p.y > b.y + b.h - 10) {
            this.transitionRoom('down');
        }
        // Left door
        if (p.y > b.y + b.h / 2 - doorH / 2 && p.y < b.y + b.h / 2 + doorH / 2 && p.x < b.x + 10) {
            this.transitionRoom('left');
        }
        // Right door
        if (p.y > b.y + b.h / 2 - doorH / 2 && p.y < b.y + b.h / 2 + doorH / 2 && p.x > b.x + b.w - 10) {
            this.transitionRoom('right');
        }
    }

    transitionRoom(direction) {
        // Increment room number
        this.roomNum++;

        // Every 5 rooms, go to next floor
        if (this.roomNum > 5) {
            this.floor++;
            this.roomNum = 1;
            this.showFloorMessage();
        }

        // Clear current room
        this.enemyBullets.clear(true, true);
        this.playerBullets.clear(true, true);
        this.pickups.clear(true, true);

        // Reset room state
        this.roomCleared = false;
        this.doorsOpen = false;

        // Recreate room graphics
        if (this.roomGraphics) this.roomGraphics.destroy();
        this.createRoom();

        // Move player to opposite side
        const b = this.roomBounds;
        switch (direction) {
            case 'up':
                this.player.setPosition(b.x + b.w / 2, b.y + b.h - 40);
                break;
            case 'down':
                this.player.setPosition(b.x + b.w / 2, b.y + 40);
                break;
            case 'left':
                this.player.setPosition(b.x + b.w - 40, b.y + b.h / 2);
                break;
            case 'right':
                this.player.setPosition(b.x + 40, b.y + b.h / 2);
                break;
        }

        // Spawn new enemies
        this.spawnEnemies();

        // Update floor text
        this.floorText.setText(`Floor ${this.floor}`);
    }

    showFloorMessage() {
        const msg = this.add.text(400, 300, `FLOOR ${this.floor}`, {
            fontSize: '36px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFF44'
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: msg,
            scale: 1.5,
            alpha: 0,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    updateUI() {
        const p = this.player;

        // Hearts
        for (let i = 0; i < 3; i++) {
            const hp = p.hp - i * 2;
            if (hp >= 2) {
                this.heartImages[i].setVisible(true);
                this.heartImages[i].setScale(1);
            } else if (hp === 1) {
                this.heartImages[i].setVisible(true);
                this.heartImages[i].setScale(0.5, 1);
            } else {
                this.heartImages[i].setVisible(false);
            }
        }

        // Blanks, keys, shells
        this.blanksText.setText(p.blanks.toString());
        this.keysText.setText(p.keys.toString());
        this.shellsText.setText(p.shells.toString());

        // Ammo
        this.ammoText.setText(`${p.ammo}/${p.maxAmmo}`);

        // Reload indicator
        this.reloadText.setVisible(p.reloading);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalFloor = data.floor || 1;
        this.finalShells = data.shells || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.8)');

        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#CC3333'
        }).setOrigin(0.5);

        this.add.text(400, 280, `Reached Floor ${this.finalFloor}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Shells Collected: ${this.finalShells}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.restartText = this.add.text(400, 450, 'Press SPACE to Restart', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#33CC33'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.restartText.visible = !this.restartText.visible;
            },
            loop: true
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
