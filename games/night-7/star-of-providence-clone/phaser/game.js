// Star of Providence Clone - Bullet-hell roguelike shooter
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player ship (32x32)
        g.fillStyle(0x4488ff);
        g.fillTriangle(16, 0, 0, 28, 32, 28);
        g.fillStyle(0x2266cc);
        g.fillTriangle(16, 8, 6, 24, 26, 24);
        g.fillStyle(0x88ccff);
        g.fillRect(14, 12, 4, 8);
        g.generateTexture('player', 32, 32);
        g.clear();

        // Player bullet
        g.fillStyle(0x44ffff);
        g.fillRect(0, 0, 4, 12);
        g.generateTexture('bullet_player', 4, 12);
        g.clear();

        // Laser beam
        g.fillStyle(0xff4444);
        g.fillRect(0, 0, 6, 400);
        g.generateTexture('laser_beam', 6, 400);
        g.clear();

        // Fireball
        g.fillStyle(0xff6622);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffaa44);
        g.fillCircle(8, 8, 5);
        g.generateTexture('fireball', 16, 16);
        g.clear();

        // Sword projectile
        g.fillStyle(0xaaaaff);
        g.fillRect(4, 0, 8, 20);
        g.fillStyle(0xffffff);
        g.fillRect(6, 0, 4, 8);
        g.generateTexture('sword_proj', 16, 20);
        g.clear();

        // Enemy bullet
        g.fillStyle(0xff4488);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet_enemy', 8, 8);
        g.clear();

        // Ghost enemy
        g.fillStyle(0x66ffff, 0.7);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0xffffff);
        g.fillCircle(8, 10, 3);
        g.fillCircle(16, 10, 3);
        g.generateTexture('ghost', 24, 24);
        g.clear();

        // Drone enemy
        g.fillStyle(0x888888);
        g.fillRect(4, 8, 16, 8);
        g.fillStyle(0xff4444);
        g.fillRect(8, 4, 8, 4);
        g.fillRect(8, 16, 8, 4);
        g.generateTexture('drone', 24, 24);
        g.clear();

        // Turret enemy
        g.fillStyle(0x666666);
        g.fillRect(4, 4, 16, 16);
        g.fillStyle(0x444444);
        g.fillRect(10, 0, 4, 8);
        g.fillStyle(0xff0000);
        g.fillCircle(12, 12, 4);
        g.generateTexture('turret', 24, 24);
        g.clear();

        // Swarmer enemy
        g.fillStyle(0x22cc22);
        g.fillCircle(6, 6, 6);
        g.fillStyle(0x44ff44);
        g.fillCircle(6, 4, 2);
        g.generateTexture('swarmer', 12, 12);
        g.clear();

        // Boss
        g.fillStyle(0xaa2222);
        g.fillRect(8, 8, 48, 48);
        g.fillStyle(0xff4444);
        g.fillRect(0, 20, 16, 24);
        g.fillRect(48, 20, 16, 24);
        g.fillStyle(0xffff00);
        g.fillCircle(24, 32, 8);
        g.fillCircle(40, 32, 8);
        g.generateTexture('boss', 64, 64);
        g.clear();

        // Heart
        g.fillStyle(0xff4444);
        g.fillCircle(6, 5, 5);
        g.fillCircle(14, 5, 5);
        g.fillTriangle(10, 18, 0, 8, 20, 8);
        g.generateTexture('heart', 20, 20);
        g.clear();

        // Shield
        g.fillStyle(0x4488ff);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0x88ccff);
        g.fillCircle(8, 8, 5);
        g.generateTexture('shield', 16, 16);
        g.clear();

        // Bomb icon
        g.fillStyle(0x333333);
        g.fillCircle(8, 10, 8);
        g.fillStyle(0xff8844);
        g.fillRect(6, 0, 4, 4);
        g.generateTexture('bomb_icon', 16, 16);
        g.clear();

        // Bomb explosion
        g.fillStyle(0xffaa44, 0.5);
        g.fillCircle(100, 100, 100);
        g.fillStyle(0xff6622, 0.3);
        g.fillCircle(100, 100, 70);
        g.generateTexture('bomb_explosion', 200, 200);
        g.clear();

        // Ammo pickup
        g.fillStyle(0x44ff44);
        g.fillRect(2, 4, 12, 8);
        g.fillStyle(0x88ff88);
        g.fillRect(4, 6, 8, 4);
        g.generateTexture('ammo_pickup', 16, 16);
        g.clear();

        // Weapon pickup
        g.fillStyle(0xffdd44);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0xaa8822);
        g.fillRect(2, 2, 12, 12);
        g.generateTexture('weapon_pickup', 16, 16);
        g.clear();

        // Door
        g.fillStyle(0x444466);
        g.fillRect(0, 0, 40, 8);
        g.fillStyle(0x666688);
        g.fillRect(4, 2, 32, 4);
        g.generateTexture('door', 40, 8);
        g.clear();

        g.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x0a0812);

        // Title
        this.add.text(cx, 100, 'STAR OF PROVIDENCE', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#44ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, 150, 'CLONE', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#4488ff'
        }).setOrigin(0.5);

        // Ship display
        this.add.image(cx, 250, 'player').setScale(2);

        const instructions = [
            'WASD/Arrows - Move ship',
            'Left Click/Space - Fire',
            'Shift/Right Click - Focus (slow movement)',
            'Z/Q - Dash (invincible)',
            'X - Bomb (clears bullets)',
            '',
            'Collect weapons and survive!',
            'Clear 3 floors to win',
            '',
            'Click to start'
        ];

        this.add.text(cx, 420, instructions.join('\n'), {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Weapons data
        this.WEAPONS = {
            peashooter: { name: 'Peashooter', damage: 5, fireRate: 100, ammo: Infinity, speed: 600, spread: 0 },
            vulcan: { name: 'Vulcan', damage: 15, fireRate: 80, ammo: 500, speed: 500, spread: 5 },
            laser: { name: 'Laser', damage: 115, fireRate: 400, ammo: 100, speed: 0, isLaser: true },
            fireball: { name: 'Fireball', damage: 80, fireRate: 500, ammo: 90, speed: 300, aoe: 60 },
            revolver: { name: 'Revolver', damage: 28, fireRate: 130, ammo: 250, speed: 450, clip: 6 },
            sword: { name: 'Sword', damage: 70, fireRate: 300, ammo: 125, speed: 400, melee: true }
        };

        // Player state
        this.player = {
            hp: 4, maxHp: 4,
            shields: 0, maxShields: 3,
            bombs: 2, maxBombs: 6,
            weapon: 'peashooter',
            ammo: {},
            damage: 1.0,
            speed: 250,
            focusSpeed: 100,
            multiplier: 1.0
        };

        // Initialize all weapon ammo
        Object.keys(this.WEAPONS).forEach(w => {
            this.player.ammo[w] = this.WEAPONS[w].ammo;
        });

        // Game state
        this.floor = 1;
        this.roomCleared = false;
        this.bossDefeated = false;
        this.gameOver = false;
        this.paused = false;

        // Groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Player sprite
        this.playerSprite = this.physics.add.sprite(400, 500, 'player');
        this.playerSprite.setCollideWorldBounds(true);
        this.playerSprite.setDepth(10);
        this.playerSprite.body.setSize(16, 16);
        this.playerSprite.body.setOffset(8, 8);

        // State
        this.canFire = true;
        this.canDash = true;
        this.isDashing = false;
        this.dashCooldown = 500;
        this.isFocused = false;
        this.lastFireTime = 0;

        // Spawn room
        this.spawnRoom();

        // Create UI
        this.createUI();

        // Input
        this.setupInput();

        // Collisions
        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.playerSprite, this.enemyBullets, this.hitPlayer, null, this);
        this.physics.add.overlap(this.playerSprite, this.enemies, this.touchEnemy, null, this);
        this.physics.add.overlap(this.playerSprite, this.pickups, this.collectPickup, null, this);

        // Enemy AI update
        this.time.addEvent({
            delay: 1000,
            callback: () => this.enemyShoot(),
            loop: true
        });

        // Multiplier decay
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (this.player.multiplier > 1) {
                    this.player.multiplier = Math.max(1, this.player.multiplier - 0.1);
                    this.updateUI();
                }
            },
            loop: true
        });
    }

    spawnRoom() {
        // Clear existing enemies
        this.enemies.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.pickups.clear(true, true);

        this.roomCleared = false;

        // Spawn enemies based on floor
        const numEnemies = 5 + this.floor * 3;
        const enemyTypes = this.floor === 1 ? ['ghost', 'swarmer'] :
            this.floor === 2 ? ['ghost', 'drone', 'turret'] :
                ['drone', 'turret', 'ghost', 'swarmer'];

        for (let i = 0; i < numEnemies; i++) {
            const type = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 250);

            this.spawnEnemy(x, y, type);
        }

        this.updateUI();
    }

    spawnEnemy(x, y, type) {
        const enemy = this.enemies.create(x, y, type);
        enemy.type = type;
        enemy.setDepth(5);

        switch (type) {
            case 'ghost':
                enemy.hp = 50;
                enemy.speed = 40;
                enemy.damage = 10;
                enemy.behavior = 'chase';
                enemy.body.setSize(20, 20);
                break;
            case 'drone':
                enemy.hp = 70;
                enemy.speed = 80;
                enemy.damage = 15;
                enemy.behavior = 'dash';
                enemy.body.setSize(20, 20);
                break;
            case 'turret':
                enemy.hp = 90;
                enemy.speed = 0;
                enemy.damage = 20;
                enemy.behavior = 'stationary';
                enemy.body.setSize(20, 20);
                break;
            case 'swarmer':
                enemy.hp = 12;
                enemy.speed = 150;
                enemy.damage = 5;
                enemy.behavior = 'swarm';
                enemy.body.setSize(10, 10);
                break;
            default:
                enemy.hp = 50;
                enemy.speed = 50;
                enemy.damage = 10;
                enemy.behavior = 'chase';
        }

        enemy.maxHp = enemy.hp;
        enemy.shootCooldown = 0;

        return enemy;
    }

    spawnBoss() {
        const boss = this.enemies.create(400, 150, 'boss');
        boss.type = 'boss';
        boss.setDepth(5);
        boss.body.setSize(56, 56);

        const bossHP = [1500, 2000, 2500];
        boss.hp = bossHP[this.floor - 1];
        boss.maxHp = boss.hp;
        boss.speed = 50;
        boss.damage = 30;
        boss.behavior = 'boss';
        boss.phase = 1;
        boss.shootCooldown = 0;
        boss.patternTime = 0;

        // Boss HP bar
        this.bossHpBg = this.add.rectangle(400, 30, 600, 20, 0x333333).setDepth(50);
        this.bossHpBar = this.add.rectangle(103, 30, 594, 16, 0xff4444).setDepth(51);
        this.bossHpBar.setOrigin(0, 0.5);
        this.bossName = this.add.text(400, 30, this.getBossName(), {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(52);

        return boss;
    }

    getBossName() {
        const names = ['CHAMBERLORD', 'WRAITHKING', 'CORE GUARDIAN'];
        return names[this.floor - 1] || 'BOSS';
    }

    createUI() {
        // Hearts
        this.heartIcons = [];
        for (let i = 0; i < 6; i++) {
            const heart = this.add.image(30 + i * 25, 560, 'heart')
                .setScrollFactor(0).setDepth(50).setScale(0.8);
            this.heartIcons.push(heart);
        }

        // Bombs
        this.bombIcons = [];
        for (let i = 0; i < 6; i++) {
            const bomb = this.add.image(30 + i * 20, 585, 'bomb_icon')
                .setScrollFactor(0).setDepth(50).setScale(0.7);
            this.bombIcons.push(bomb);
        }

        // Weapon display
        this.weaponText = this.add.text(250, 560, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffff44'
        }).setScrollFactor(0).setDepth(50);

        // Ammo bar
        this.add.rectangle(250, 580, 100, 10, 0x333333).setScrollFactor(0).setDepth(50);
        this.ammoBar = this.add.rectangle(203, 580, 94, 6, 0x44ff44).setScrollFactor(0).setDepth(51);
        this.ammoBar.setOrigin(0, 0.5);

        // Floor & multiplier
        this.floorText = this.add.text(600, 560, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setScrollFactor(0).setDepth(50);

        this.multiplierText = this.add.text(600, 580, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ff8844'
        }).setScrollFactor(0).setDepth(50);

        // Room cleared text
        this.roomText = this.add.text(400, 300, '', {
            fontSize: '24px', fontFamily: 'monospace', color: '#44ff44',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

        this.updateUI();
    }

    updateUI() {
        if (!this.heartIcons || !this.bombIcons) return;

        // Update hearts
        for (let i = 0; i < this.heartIcons.length; i++) {
            this.heartIcons[i].setVisible(i < this.player.maxHp);
            this.heartIcons[i].setAlpha(i < this.player.hp ? 1 : 0.3);
        }

        // Update bombs
        for (let i = 0; i < this.bombIcons.length; i++) {
            this.bombIcons[i].setVisible(i < this.player.maxBombs);
            this.bombIcons[i].setAlpha(i < this.player.bombs ? 1 : 0.3);
        }

        // Weapon
        const weapon = this.WEAPONS[this.player.weapon];
        this.weaponText.setText(weapon.name);

        // Ammo bar
        const maxAmmo = this.WEAPONS[this.player.weapon].ammo;
        const currentAmmo = this.player.ammo[this.player.weapon];
        if (maxAmmo === Infinity) {
            this.ammoBar.width = 94;
        } else {
            this.ammoBar.width = 94 * (currentAmmo / maxAmmo);
        }

        // Floor & multiplier
        this.floorText.setText(`Floor ${this.floor}`);
        this.multiplierText.setText(`x${this.player.multiplier.toFixed(2)}`);

        // Boss HP bar
        const boss = this.enemies.getChildren().find(e => e.type === 'boss');
        if (boss && this.bossHpBar) {
            this.bossHpBar.width = 594 * (boss.hp / boss.maxHp);
        }
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            z: Phaser.Input.Keyboard.KeyCodes.Z,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });

        // Bomb
        this.input.keyboard.on('keydown-X', () => this.useBomb());
    }

    update(time, delta) {
        if (this.gameOver || this.paused) return;

        this.handleMovement();
        this.handleFiring(time);
        this.handleDash();
        this.updateEnemies(delta);
        this.checkRoomCleared();

        // Clean up off-screen bullets
        const pBullets = this.playerBullets.getChildren();
        if (pBullets) {
            pBullets.forEach(b => {
                if (b && b.active && (b.y < -20 || b.y > 620 || b.x < -20 || b.x > 820)) b.destroy();
            });
        }
        const eBullets = this.enemyBullets.getChildren();
        if (eBullets) {
            eBullets.forEach(b => {
                if (b && b.active && (b.y < -20 || b.y > 620 || b.x < -20 || b.x > 820)) b.destroy();
            });
        }
    }

    handleMovement() {
        let vx = 0, vy = 0;
        const speed = this.isFocused ? this.player.focusSpeed : this.player.speed;

        if (this.isDashing) return;

        if (this.keys.w.isDown || this.keys.up.isDown) vy -= speed;
        if (this.keys.s.isDown || this.keys.down.isDown) vy += speed;
        if (this.keys.a.isDown || this.keys.left.isDown) vx -= speed;
        if (this.keys.d.isDown || this.keys.right.isDown) vx += speed;

        // Focus mode
        this.isFocused = this.keys.shift.isDown || this.input.activePointer.rightButtonDown();

        // Normalize
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.playerSprite.setVelocity(vx, vy);

        // Visual feedback for focus
        if (this.isFocused) {
            this.playerSprite.setTint(0x8888ff);
        } else {
            this.playerSprite.clearTint();
        }
    }

    handleFiring(time) {
        const firing = this.keys.space.isDown || this.input.activePointer.leftButtonDown();

        if (!firing) return;

        const weapon = this.WEAPONS[this.player.weapon];
        if (time - this.lastFireTime < weapon.fireRate) return;

        // Check ammo
        if (this.player.ammo[this.player.weapon] <= 0) {
            // Switch to peashooter
            this.player.weapon = 'peashooter';
            this.updateUI();
            return;
        }

        this.lastFireTime = time;

        // Consume ammo
        if (weapon.ammo !== Infinity) {
            this.player.ammo[this.player.weapon]--;
        }

        // Fire based on weapon type
        if (weapon.isLaser) {
            this.fireLaser(weapon);
        } else {
            this.fireBullet(weapon);
        }

        this.updateUI();
    }

    fireBullet(weapon) {
        const spread = weapon.spread || 0;
        const angle = -90 + Phaser.Math.Between(-spread, spread);

        let texture = 'bullet_player';
        if (this.player.weapon === 'fireball') texture = 'fireball';
        if (this.player.weapon === 'sword') texture = 'sword_proj';

        const bullet = this.playerBullets.create(this.playerSprite.x, this.playerSprite.y - 16, texture);
        bullet.damage = weapon.damage * this.player.damage;
        bullet.aoe = weapon.aoe || 0;

        this.physics.velocityFromAngle(angle, weapon.speed, bullet.body.velocity);
        bullet.setDepth(8);
    }

    fireLaser(weapon) {
        // Instant hitscan laser
        const laser = this.add.image(this.playerSprite.x, this.playerSprite.y - 200, 'laser_beam');
        laser.setDepth(8);
        laser.setAlpha(0.8);

        // Damage all enemies in line
        const children = this.enemies.getChildren();
        if (children) {
            children.forEach(enemy => {
                if (Math.abs(enemy.x - this.playerSprite.x) < 20) {
                    this.damageEnemy(enemy, weapon.damage * this.player.damage);
                }
            });
        }

        // Remove after brief display
        this.time.delayedCall(100, () => laser.destroy());
    }

    handleDash() {
        if ((this.keys.z.isDown || this.keys.q.isDown) && this.canDash && !this.isDashing) {
            this.canDash = false;
            this.isDashing = true;

            // Dash in current velocity direction or up if stationary
            let vx = this.playerSprite.body.velocity.x;
            let vy = this.playerSprite.body.velocity.y;

            if (vx === 0 && vy === 0) {
                vy = -1;
            }

            const angle = Math.atan2(vy, vx);
            const dashSpeed = 500;

            this.playerSprite.setVelocity(
                Math.cos(angle) * dashSpeed,
                Math.sin(angle) * dashSpeed
            );

            // Visual effect
            this.playerSprite.setAlpha(0.5);
            this.playerSprite.setTint(0x00ffff);

            // End dash
            this.time.delayedCall(150, () => {
                this.isDashing = false;
                this.playerSprite.setAlpha(1);
                this.playerSprite.clearTint();
            });

            // Cooldown
            this.time.delayedCall(this.dashCooldown, () => {
                this.canDash = true;
            });
        }
    }

    useBomb() {
        if (this.player.bombs <= 0) return;

        this.player.bombs--;

        // Create explosion
        const explosion = this.add.image(this.playerSprite.x, this.playerSprite.y, 'bomb_explosion');
        explosion.setDepth(100);

        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => explosion.destroy()
        });

        // Clear all enemy bullets
        this.enemyBullets.clear(true, true);

        // Damage all enemies
        const enemyList = this.enemies.getChildren();
        if (enemyList) {
            enemyList.forEach(enemy => {
                this.damageEnemy(enemy, 50);
            });
        }

        // Brief invincibility
        this.isDashing = true;
        this.playerSprite.setTint(0xffff00);
        this.time.delayedCall(300, () => {
            this.isDashing = false;
            this.playerSprite.clearTint();
        });

        this.updateUI();
    }

    updateEnemies(delta) {
        const children = this.enemies.getChildren();
        if (!children) return;

        children.forEach(enemy => {
            if (!enemy.active) return;

            enemy.shootCooldown -= delta;

            switch (enemy.behavior) {
                case 'chase':
                    this.moveToPlayer(enemy, enemy.speed);
                    break;
                case 'swarm':
                    this.moveToPlayer(enemy, enemy.speed);
                    break;
                case 'dash':
                    // Occasionally dash toward player
                    if (Math.random() < 0.01) {
                        this.moveToPlayer(enemy, enemy.speed * 3);
                    } else {
                        this.moveToPlayer(enemy, enemy.speed * 0.3);
                    }
                    break;
                case 'stationary':
                    enemy.setVelocity(0, 0);
                    break;
                case 'boss':
                    this.updateBoss(enemy, delta);
                    break;
            }
        });
    }

    moveToPlayer(enemy, speed) {
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            this.playerSprite.x, this.playerSprite.y
        );
        enemy.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    updateBoss(boss, delta) {
        boss.patternTime += delta;

        // Move horizontally
        if (boss.x < 200) boss.setVelocityX(boss.speed);
        else if (boss.x > 600) boss.setVelocityX(-boss.speed);

        // Phases
        const hpPercent = boss.hp / boss.maxHp;
        if (hpPercent < 0.33 && boss.phase < 3) {
            boss.phase = 3;
            boss.speed = 100;
        } else if (hpPercent < 0.66 && boss.phase < 2) {
            boss.phase = 2;
            boss.speed = 75;
        }

        // Shooting patterns
        if (boss.shootCooldown <= 0) {
            this.bossAttack(boss);
            boss.shootCooldown = 1500 - (boss.phase * 300);
        }
    }

    bossAttack(boss) {
        // Different patterns based on phase
        const pattern = boss.phase;

        if (pattern === 1) {
            // Spread shot
            for (let i = -2; i <= 2; i++) {
                this.fireEnemyBullet(boss.x, boss.y + 30, 90 + i * 15, 200);
            }
        } else if (pattern === 2) {
            // Ring pattern
            for (let i = 0; i < 12; i++) {
                this.fireEnemyBullet(boss.x, boss.y, i * 30, 150);
            }
        } else {
            // Bullet hell
            for (let i = 0; i < 16; i++) {
                const angle = (boss.patternTime / 10 + i * 22.5) % 360;
                this.fireEnemyBullet(boss.x, boss.y, angle, 180);
            }
        }
    }

    enemyShoot() {
        const children = this.enemies.getChildren();
        if (!children) return;

        children.forEach(enemy => {
            if (!enemy.active || enemy.behavior === 'swarm') return;

            if (enemy.shootCooldown <= 0 && enemy.type !== 'boss') {
                const angle = Phaser.Math.Angle.BetweenPoints(enemy, this.playerSprite) * (180 / Math.PI);

                if (enemy.type === 'drone') {
                    // 3-shot spread
                    this.fireEnemyBullet(enemy.x, enemy.y, angle - 15, 200);
                    this.fireEnemyBullet(enemy.x, enemy.y, angle, 200);
                    this.fireEnemyBullet(enemy.x, enemy.y, angle + 15, 200);
                } else {
                    this.fireEnemyBullet(enemy.x, enemy.y, angle, 180);
                }

                enemy.shootCooldown = 2000;
            }
        });
    }

    fireEnemyBullet(x, y, angle, speed) {
        const bullet = this.enemyBullets.create(x, y, 'bullet_enemy');
        bullet.damage = 1;
        this.physics.velocityFromAngle(angle, speed, bullet.body.velocity);
        bullet.setDepth(6);
    }

    hitEnemy(bullet, enemy) {
        if (!enemy.active) return;

        const damage = bullet.damage || 10;

        // AOE damage
        if (bullet.aoe > 0) {
            const explosion = this.add.circle(bullet.x, bullet.y, bullet.aoe, 0xff6622, 0.5);
            this.tweens.add({
                targets: explosion,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => explosion.destroy()
            });

            // Damage nearby enemies
            this.enemies.getChildren().forEach(e => {
                if (e !== enemy && Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y) < bullet.aoe) {
                    this.damageEnemy(e, damage * 0.5);
                }
            });
        }

        this.damageEnemy(enemy, damage);
        bullet.destroy();
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Flash white
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, Math.floor(damage).toString(), {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffff44'
        }).setDepth(100);

        this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 20,
            alpha: 0,
            duration: 400,
            onComplete: () => dmgText.destroy()
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }

        // Update boss HP bar
        if (enemy.type === 'boss') {
            this.updateUI();
        }
    }

    killEnemy(enemy) {
        // Increase multiplier
        this.player.multiplier = Math.min(10, this.player.multiplier + 0.1);

        // Drop pickup
        if (Math.random() < 0.3) {
            const pickupType = Math.random() < 0.7 ? 'ammo_pickup' : 'weapon_pickup';
            const pickup = this.pickups.create(enemy.x, enemy.y, pickupType);
            pickup.pickupType = pickupType === 'ammo_pickup' ? 'ammo' : 'weapon';
        }

        // Boss death
        if (enemy.type === 'boss') {
            this.bossDefeated = true;

            // Clear boss HP bar
            if (this.bossHpBg) this.bossHpBg.destroy();
            if (this.bossHpBar) this.bossHpBar.destroy();
            if (this.bossName) this.bossName.destroy();

            // Reward
            if (Math.random() < 0.5) {
                this.player.maxHp += 2;
                this.player.hp = this.player.maxHp;
            } else {
                this.player.damage += 0.05;
            }

            // Victory or next floor
            if (this.floor >= 3) {
                this.victory();
            } else {
                this.roomText.setText('FLOOR CLEARED!\nClick to continue');
                this.roomText.setVisible(true);

                this.input.once('pointerdown', () => {
                    this.floor++;
                    this.bossDefeated = false;
                    this.roomText.setVisible(false);
                    this.spawnRoom();
                });
            }
        }

        enemy.destroy();
        this.updateUI();
    }

    hitPlayer(player, bullet) {
        if (this.isDashing) return;

        this.takeDamage(bullet.damage);
        bullet.destroy();
    }

    touchEnemy(player, enemy) {
        if (this.isDashing) return;

        this.takeDamage(1);

        // Push player back
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    takeDamage(amount) {
        // Shields first
        if (this.player.shields > 0) {
            this.player.shields--;
            this.showDamageEffect();
            this.updateUI();
            return;
        }

        this.player.hp -= amount;

        // Reduce multiplier
        this.player.multiplier = Math.max(1, this.player.multiplier - 0.5);

        this.showDamageEffect();
        this.updateUI();

        if (this.player.hp <= 0) {
            this.die();
        }
    }

    showDamageEffect() {
        // Screen flash
        const flash = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0.3).setDepth(200);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Brief invincibility
        this.isDashing = true;
        this.playerSprite.setAlpha(0.5);
        this.time.delayedCall(500, () => {
            this.isDashing = false;
            this.playerSprite.setAlpha(1);
        });
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'ammo') {
            // Refill current weapon ammo
            const weapon = this.player.weapon;
            if (this.WEAPONS[weapon].ammo !== Infinity) {
                this.player.ammo[weapon] = Math.min(
                    this.WEAPONS[weapon].ammo,
                    this.player.ammo[weapon] + Math.floor(this.WEAPONS[weapon].ammo * 0.3)
                );
            }
        } else {
            // New weapon
            const weapons = Object.keys(this.WEAPONS).filter(w => w !== 'peashooter');
            const newWeapon = weapons[Phaser.Math.Between(0, weapons.length - 1)];
            this.player.weapon = newWeapon;
            this.player.ammo[newWeapon] = this.WEAPONS[newWeapon].ammo;

            this.showMessage(`Got ${this.WEAPONS[newWeapon].name}!`);
        }

        pickup.destroy();
        this.updateUI();
    }

    checkRoomCleared() {
        if (this.roomCleared || this.bossDefeated) return;

        const children = this.enemies.getChildren();
        if (!children) return;

        const enemyCount = children.filter(e => e.type !== 'boss').length;
        const hasBoss = children.some(e => e.type === 'boss');

        if (enemyCount === 0 && !hasBoss && !this.roomCleared) {
            this.roomCleared = true;

            // Recharge bomb
            if (this.player.bombs < this.player.maxBombs) {
                this.player.bombs++;
            }

            // Show room cleared, then spawn boss
            this.roomText.setText('ROOM CLEARED!');
            this.roomText.setVisible(true);

            this.time.delayedCall(1500, () => {
                this.roomText.setVisible(false);
                this.roomText.setText('BOSS INCOMING!');
                this.roomText.setVisible(true);

                this.time.delayedCall(1000, () => {
                    this.roomText.setVisible(false);
                    this.spawnBoss();
                });
            });

            this.updateUI();
        }
    }

    showMessage(text) {
        const msg = this.add.text(400, 200, text, {
            fontSize: '18px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: msg,
            y: 180,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    die() {
        this.gameOver = true;
        this.physics.pause();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(300);

        this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'monospace', color: '#ff4444',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 320, `Reached Floor ${this.floor}`, {
            fontSize: '20px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 400, 'Click to try again', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setDepth(301);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    victory() {
        this.gameOver = true;
        this.physics.pause();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(300);

        this.add.text(400, 200, 'VICTORY!', {
            fontSize: '56px', fontFamily: 'monospace', color: '#44ffff',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 280, 'You defeated all 3 floors!', {
            fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 330, `Final Multiplier: x${this.player.multiplier.toFixed(2)}`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#ff8844'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 450, 'Click to play again', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setDepth(301);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

// Phaser configuration - MUST be at end of file
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0a0812',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene],
    pixelArt: true
};

const game = new Phaser.Game(config);
