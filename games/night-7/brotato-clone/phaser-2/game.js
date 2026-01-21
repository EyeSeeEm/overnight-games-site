// Spud Survivors - Brotato Clone
// Built with Phaser 3

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// ==================== BOOT SCENE ====================
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Player (potato)
        g.clear();
        g.fillStyle(0xd4a574);
        g.fillEllipse(16, 18, 20, 24);
        g.fillStyle(0x000000);
        g.fillCircle(11, 16, 2);
        g.fillCircle(21, 16, 2);
        g.fillStyle(0xff6666);
        g.fillRect(14, 22, 4, 2);
        g.generateTexture('player', 32, 32);

        // Bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Knife projectile
        g.clear();
        g.fillStyle(0xcccccc);
        g.fillRect(0, 6, 16, 4);
        g.fillStyle(0x888888);
        g.fillTriangle(16, 4, 24, 8, 16, 12);
        g.generateTexture('knife', 24, 16);

        // Sword projectile
        g.clear();
        g.fillStyle(0xaaaaaa);
        g.fillRect(0, 8, 28, 4);
        g.fillStyle(0xffcc00);
        g.fillRect(0, 6, 6, 8);
        g.generateTexture('sword', 32, 20);

        // Baby alien enemy
        g.clear();
        g.fillStyle(0x44ff44);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0x000000);
        g.fillCircle(8, 10, 3);
        g.fillCircle(16, 10, 3);
        g.generateTexture('baby_alien', 24, 24);

        // Chaser enemy
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(10, 10, 8);
        g.fillStyle(0xffff00);
        g.fillCircle(7, 8, 2);
        g.fillCircle(13, 8, 2);
        g.generateTexture('chaser', 20, 20);

        // Charger enemy
        g.clear();
        g.fillStyle(0x8844ff);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xffffff);
        g.fillCircle(10, 12, 4);
        g.fillCircle(22, 12, 4);
        g.generateTexture('charger', 32, 32);

        // Spitter enemy
        g.clear();
        g.fillStyle(0x44ffff);
        g.fillCircle(14, 14, 12);
        g.fillStyle(0x000000);
        g.fillCircle(10, 12, 3);
        g.fillCircle(18, 12, 3);
        g.fillRect(10, 18, 8, 4);
        g.generateTexture('spitter', 28, 28);

        // Bruiser enemy
        g.clear();
        g.fillStyle(0x884422);
        g.fillCircle(20, 20, 18);
        g.fillStyle(0xff0000);
        g.fillCircle(14, 16, 4);
        g.fillCircle(26, 16, 4);
        g.generateTexture('bruiser', 40, 40);

        // Boss
        g.clear();
        g.fillStyle(0xff00ff);
        g.fillCircle(32, 32, 30);
        g.fillStyle(0xffff00);
        g.fillCircle(22, 26, 6);
        g.fillCircle(42, 26, 6);
        g.fillStyle(0x000000);
        g.fillCircle(22, 26, 3);
        g.fillCircle(42, 26, 3);
        g.fillRect(24, 40, 16, 6);
        g.generateTexture('boss', 64, 64);

        // XP orb
        g.clear();
        g.fillStyle(0x00ff88);
        g.fillCircle(6, 6, 5);
        g.generateTexture('xp', 12, 12);

        // Material (gold)
        g.clear();
        g.fillStyle(0xffdd00);
        g.fillCircle(6, 6, 5);
        g.generateTexture('material', 12, 12);

        // Health pickup
        g.clear();
        g.fillStyle(0xff0000);
        g.fillRect(4, 0, 4, 12);
        g.fillRect(0, 4, 12, 4);
        g.generateTexture('health_pickup', 12, 12);

        // Enemy bullet
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(4, 4, 4);
        g.generateTexture('enemy_bullet', 8, 8);

        // Arena floor
        g.clear();
        g.fillStyle(0x3a3a3a);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x2a2a2a);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);

        g.destroy();
    }
}

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.text(cx, cy - 150, 'SPUD SURVIVORS', {
            fontSize: '48px',
            fill: '#d4a574',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 80, 'A Brotato Clone', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 20, 'WASD / Arrow Keys - Move', {
            fontSize: '16px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 10, 'Weapons fire automatically at nearest enemy', {
            fontSize: '16px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, 'Survive 10 waves, defeat the boss!', {
            fontSize: '18px',
            fill: '#ffff00'
        }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy + 120, '[ CLICK TO START ]', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#00ff00'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Player stats
        this.stats = {
            maxHP: 15,
            hp: 15,
            damage: 0,
            attackSpeed: 0,
            armor: 0,
            speed: 0,
            luck: 0,
            harvesting: 8
        };

        // Weapons (array of weapon objects)
        this.weapons = [
            { type: 'knife', damage: 8, cooldown: 780, lastFired: 0, range: 150 }
        ];
        this.maxWeaponSlots = 6;

        // Wave system
        this.currentWave = 1;
        this.maxWaves = 10;
        this.waveTimer = 0;
        this.waveDuration = 20000; // 20 seconds base, increases per wave
        this.waveActive = true;

        // Economy
        this.xp = 0;
        this.xpToLevel = 16;
        this.level = 1;
        this.materials = 0;

        // Groups
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Draw arena floor
        for (let y = 0; y < GAME_HEIGHT; y += 32) {
            for (let x = 0; x < GAME_WIDTH; x += 32) {
                this.add.image(x + 16, y + 16, 'floor');
            }
        }

        // Create player
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Collisions
        this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitBullet, null, this);

        // Spawn timer
        this.spawnTimer = 0;
        this.spawnInterval = 1500;

        // Create HUD
        this.createHUD();

        // Invincibility
        this.invincible = false;

        // Wave start message
        this.showWaveMessage();
    }

    createHUD() {
        // HP bar
        this.add.rectangle(GAME_WIDTH / 2, 20, 204, 24, 0x333333);
        this.hpBar = this.add.rectangle(GAME_WIDTH / 2 - 100, 20, 200, 20, 0xff4444).setOrigin(0, 0.5);
        this.hpText = this.add.text(GAME_WIDTH / 2, 20, '', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // XP bar
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, 204, 16, 0x333333);
        this.xpBar = this.add.rectangle(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 20, 200, 12, 0x00ff88).setOrigin(0, 0.5);
        this.levelText = this.add.text(10, GAME_HEIGHT - 30, '', {
            fontSize: '14px',
            fill: '#00ff88'
        });

        // Materials
        this.materialText = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#ffdd00'
        });

        // Wave info
        this.waveText = this.add.text(GAME_WIDTH - 10, 10, '', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(1, 0);

        // Timer
        this.timerText = this.add.text(GAME_WIDTH - 10, 30, '', {
            fontSize: '14px',
            fill: '#aaaaaa'
        }).setOrigin(1, 0);

        // Weapon slots display
        this.weaponDisplay = this.add.text(10, 50, '', {
            fontSize: '12px',
            fill: '#cccccc'
        });
    }

    showWaveMessage() {
        const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `WAVE ${this.currentWave}`, {
            fontSize: '48px',
            fill: '#ffff00'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: GAME_HEIGHT / 2 - 50,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    update(time, delta) {
        if (!this.waveActive) return;

        // Player movement
        const baseSpeed = 200;
        const actualSpeed = baseSpeed * (1 + this.stats.speed / 100);
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * actualSpeed, vy * actualSpeed);

        // Auto-fire weapons
        this.fireWeapons(time);

        // Spawn enemies
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemy(enemy, time);
        });

        // Update projectiles
        this.projectiles.getChildren().forEach(proj => {
            proj.life -= delta;
            if (proj.life <= 0) proj.destroy();
        });

        // Update enemy bullets
        this.enemyBullets.getChildren().forEach(bullet => {
            bullet.life -= delta;
            if (bullet.life <= 0) bullet.destroy();
        });

        // Wave timer
        this.waveTimer += delta;
        if (this.waveTimer >= this.waveDuration) {
            this.endWave();
        }

        // Update HUD
        this.updateHUD();
    }

    fireWeapons(time) {
        const nearestEnemy = this.findNearestEnemy();
        if (!nearestEnemy) return;

        this.weapons.forEach(weapon => {
            const cooldown = weapon.cooldown / (1 + this.stats.attackSpeed / 100);
            if (time - weapon.lastFired >= cooldown) {
                weapon.lastFired = time;
                this.fireWeapon(weapon, nearestEnemy);
            }
        });
    }

    findNearestEnemy() {
        let nearest = null;
        let nearestDist = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    fireWeapon(weapon, target) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        let proj;

        if (weapon.type === 'knife' || weapon.type === 'sword') {
            // Melee - thrust attack
            proj = this.projectiles.create(this.player.x, this.player.y, weapon.type);
            proj.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
            proj.rotation = angle;
            proj.life = 300;
        } else if (weapon.type === 'pistol') {
            proj = this.projectiles.create(this.player.x, this.player.y, 'bullet');
            proj.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
            proj.life = 600;
        } else if (weapon.type === 'smg') {
            proj = this.projectiles.create(this.player.x, this.player.y, 'bullet');
            proj.setScale(0.8);
            const spread = (Math.random() - 0.5) * 0.2;
            proj.setVelocity(Math.cos(angle + spread) * 500, Math.sin(angle + spread) * 500);
            proj.life = 500;
        } else if (weapon.type === 'shotgun') {
            // Fire 5 pellets
            for (let i = 0; i < 5; i++) {
                const spread = (i - 2) * 0.15;
                const p = this.projectiles.create(this.player.x, this.player.y, 'bullet');
                p.setScale(0.7);
                p.setVelocity(Math.cos(angle + spread) * 400, Math.sin(angle + spread) * 400);
                p.damage = weapon.damage;
                p.life = 300;
            }
            return;
        } else {
            proj = this.projectiles.create(this.player.x, this.player.y, 'bullet');
            proj.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
            proj.life = 500;
        }

        proj.damage = weapon.damage * (1 + this.stats.damage / 100);
    }

    spawnEnemy() {
        if (this.enemies.countActive() >= 50) return;

        // Spawn at edge
        let x, y;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = -20; y = Math.random() * GAME_HEIGHT; }
        else if (side === 1) { x = GAME_WIDTH + 20; y = Math.random() * GAME_HEIGHT; }
        else if (side === 2) { x = Math.random() * GAME_WIDTH; y = -20; }
        else { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 20; }

        const enemyType = this.getEnemyType();
        const enemy = this.enemies.create(x, y, enemyType);
        enemy.enemyType = enemyType;

        const stats = {
            baby_alien: { hp: 3 + this.currentWave * 2, speed: 80, damage: 1 },
            chaser: { hp: 1 + this.currentWave, speed: 150, damage: 1 },
            charger: { hp: 4 + this.currentWave * 2.5, speed: 60, damage: 2, charges: true },
            spitter: { hp: 8 + this.currentWave, speed: 50, damage: 1, ranged: true },
            bruiser: { hp: 20 + this.currentWave * 11, speed: 40, damage: 3 },
            boss: { hp: 200 + this.currentWave * 50, speed: 30, damage: 5, isBoss: true }
        };

        const s = stats[enemyType] || stats.baby_alien;
        enemy.hp = s.hp;
        enemy.maxHp = s.hp;
        enemy.speed = s.speed;
        enemy.contactDamage = s.damage;
        enemy.canShoot = s.ranged;
        enemy.canCharge = s.charges;
        enemy.isBoss = s.isBoss;
        enemy.lastShot = 0;
        enemy.charging = false;

        if (enemy.isBoss) {
            enemy.setScale(1.5);
        }
    }

    getEnemyType() {
        const wave = this.currentWave;

        // Boss on wave 10
        if (wave === 10 && this.enemies.countActive() === 0 && this.waveTimer > 5000) {
            if (!this.bossSpawned) {
                this.bossSpawned = true;
                return 'boss';
            }
        }

        const types = ['baby_alien'];
        if (wave >= 2) types.push('chaser');
        if (wave >= 3) types.push('charger');
        if (wave >= 4) types.push('spitter');
        if (wave >= 6) types.push('bruiser');

        return types[Math.floor(Math.random() * types.length)];
    }

    updateEnemy(enemy, time) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Charger logic
        if (enemy.canCharge && !enemy.charging && dist < 200) {
            enemy.charging = true;
            enemy.chargeDir = { x: dx / dist, y: dy / dist };
            this.time.delayedCall(2000, () => { if (enemy.active) enemy.charging = false; });
        }

        if (enemy.charging) {
            enemy.setVelocity(enemy.chargeDir.x * 300, enemy.chargeDir.y * 300);
        } else if (enemy.canShoot) {
            // Spitter - keep distance and shoot
            if (dist < 150) {
                enemy.setVelocity(-dx / dist * enemy.speed, -dy / dist * enemy.speed);
            } else if (dist > 200) {
                enemy.setVelocity(dx / dist * enemy.speed * 0.5, dy / dist * enemy.speed * 0.5);
            } else {
                enemy.setVelocity(0, 0);
            }

            // Shoot
            if (time - enemy.lastShot > 2000) {
                enemy.lastShot = time;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemy_bullet');
                const angle = Math.atan2(dy, dx);
                bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
                bullet.damage = enemy.contactDamage;
                bullet.life = 3000;
            }
        } else {
            // Basic chase
            if (dist > 10) {
                enemy.setVelocity(dx / dist * enemy.speed, dy / dist * enemy.speed);
            }
        }
    }

    projectileHitEnemy(proj, enemy) {
        const damage = proj.damage || 10;
        enemy.hp -= damage;
        proj.destroy();

        // Flash
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    enemyDeath(enemy) {
        // Drop XP
        const xpAmount = enemy.isBoss ? 50 : (enemy.enemyType === 'bruiser' ? 10 : 5);
        for (let i = 0; i < Math.ceil(xpAmount / 5); i++) {
            const xp = this.pickups.create(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                'xp'
            );
            xp.pickupType = 'xp';
            xp.value = 5 + this.stats.harvesting;
        }

        // Drop materials
        const matAmount = enemy.isBoss ? 30 : (Math.random() < 0.5 ? 1 : 2);
        for (let i = 0; i < matAmount; i++) {
            const mat = this.pickups.create(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                'material'
            );
            mat.pickupType = 'material';
            mat.value = 1 + Math.floor(this.stats.harvesting / 10);
        }

        // Health drop chance
        if (Math.random() < 0.1 + this.stats.luck / 100) {
            const hp = this.pickups.create(enemy.x, enemy.y, 'health_pickup');
            hp.pickupType = 'health';
            hp.value = 3;
        }

        enemy.destroy();

        // Check boss death
        if (enemy.isBoss) {
            this.victory();
        }
    }

    playerHitEnemy(player, enemy) {
        if (this.invincible) return;
        this.takeDamage(enemy.contactDamage);
    }

    playerHitBullet(player, bullet) {
        if (this.invincible) return;
        this.takeDamage(bullet.damage);
        bullet.destroy();
    }

    takeDamage(amount) {
        const reduction = this.stats.armor / (this.stats.armor + 15);
        const damage = Math.max(1, Math.floor(amount * (1 - reduction)));

        this.stats.hp -= damage;
        this.invincible = true;
        this.player.setAlpha(0.5);

        this.cameras.main.shake(100, 0.01);

        this.time.delayedCall(500, () => {
            this.invincible = false;
            if (this.player.active) this.player.setAlpha(1);
        });

        if (this.stats.hp <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'xp') {
            this.xp += pickup.value;
            if (this.xp >= this.xpToLevel) {
                this.levelUp();
            }
        } else if (pickup.pickupType === 'material') {
            this.materials += pickup.value;
        } else if (pickup.pickupType === 'health') {
            this.stats.hp = Math.min(this.stats.maxHP, this.stats.hp + pickup.value);
        }
        pickup.destroy();
    }

    levelUp() {
        this.xp -= this.xpToLevel;
        this.level++;
        this.xpToLevel = Math.pow(this.level + 3, 2);
        this.stats.maxHP++;
        this.stats.hp = Math.min(this.stats.hp + 1, this.stats.maxHP);

        // Auto-upgrade a random stat
        const upgrades = ['damage', 'attackSpeed', 'armor', 'speed', 'maxHP'];
        const stat = upgrades[Math.floor(Math.random() * upgrades.length)];
        if (stat === 'damage') this.stats.damage += 5;
        else if (stat === 'attackSpeed') this.stats.attackSpeed += 5;
        else if (stat === 'armor') this.stats.armor += 1;
        else if (stat === 'speed') this.stats.speed += 3;
        else if (stat === 'maxHP') { this.stats.maxHP += 3; this.stats.hp += 3; }

        this.showMessage(`LEVEL UP! +${stat}`);
    }

    showMessage(text) {
        const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, text, {
            fontSize: '24px',
            fill: '#ffff00'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: GAME_HEIGHT / 2 - 100,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    endWave() {
        this.waveActive = false;

        // Clear remaining enemies
        this.enemies.getChildren().forEach(e => e.destroy());

        // Collect all pickups
        this.pickups.getChildren().forEach(p => {
            if (p.pickupType === 'xp') this.xp += p.value;
            else if (p.pickupType === 'material') this.materials += p.value;
            p.destroy();
        });

        if (this.xp >= this.xpToLevel) {
            this.levelUp();
        }

        // Go to shop
        this.scene.start('ShopScene', {
            stats: this.stats,
            weapons: this.weapons,
            materials: this.materials,
            level: this.level,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            currentWave: this.currentWave
        });
    }

    gameOver() {
        this.waveActive = false;
        this.player.setActive(false);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5).setDepth(100);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, `Reached Wave ${this.currentWave}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }

    victory() {
        this.waveActive = false;

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'VICTORY!', {
            fontSize: '48px',
            fill: '#00ff00'
        }).setOrigin(0.5).setDepth(100);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'You survived all waves!', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(3000, () => {
            this.scene.start('MenuScene');
        });
    }

    updateHUD() {
        // HP
        const hpPercent = this.stats.hp / this.stats.maxHP;
        this.hpBar.width = 200 * hpPercent;
        this.hpText.setText(`${this.stats.hp}/${this.stats.maxHP}`);

        // XP
        const xpPercent = this.xp / this.xpToLevel;
        this.xpBar.width = 200 * xpPercent;
        this.levelText.setText(`Level ${this.level}`);

        // Materials
        this.materialText.setText(`Materials: ${this.materials}`);

        // Wave
        this.waveText.setText(`Wave ${this.currentWave}/${this.maxWaves}`);

        // Timer
        const remaining = Math.max(0, Math.ceil((this.waveDuration - this.waveTimer) / 1000));
        this.timerText.setText(`${remaining}s`);

        // Weapons
        let weaponStr = 'Weapons: ';
        this.weapons.forEach((w, i) => {
            weaponStr += `[${w.type}] `;
        });
        for (let i = this.weapons.length; i < this.maxWeaponSlots; i++) {
            weaponStr += '[ ] ';
        }
        this.weaponDisplay.setText(weaponStr);
    }
}

// ==================== SHOP SCENE ====================
class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    init(data) {
        this.stats = data.stats;
        this.weapons = data.weapons;
        this.materials = data.materials;
        this.level = data.level;
        this.xp = data.xp;
        this.xpToLevel = data.xpToLevel;
        this.currentWave = data.currentWave;
    }

    create() {
        const cx = GAME_WIDTH / 2;

        this.add.text(cx, 30, `SHOP - Wave ${this.currentWave} Complete`, {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.materialText = this.add.text(cx, 60, `Materials: ${this.materials}`, {
            fontSize: '20px',
            fill: '#ffdd00'
        }).setOrigin(0.5);

        // Generate shop items
        this.shopItems = this.generateShopItems();

        // Display shop items
        this.shopItems.forEach((item, idx) => {
            const x = 100 + (idx % 4) * 180;
            const y = 150 + Math.floor(idx / 4) * 120;

            const box = this.add.rectangle(x, y, 160, 100, 0x333333);
            const nameText = this.add.text(x, y - 30, item.name, {
                fontSize: '14px',
                fill: '#ffffff'
            }).setOrigin(0.5);

            const effectText = this.add.text(x, y, item.effect, {
                fontSize: '12px',
                fill: '#aaaaaa'
            }).setOrigin(0.5);

            const priceText = this.add.text(x, y + 30, `${item.price} materials`, {
                fontSize: '14px',
                fill: '#ffdd00'
            }).setOrigin(0.5);

            box.setInteractive();
            box.on('pointerover', () => box.setFillStyle(0x555555));
            box.on('pointerout', () => box.setFillStyle(0x333333));
            box.on('pointerdown', () => this.buyItem(item, idx));

            item.ui = { box, nameText, effectText, priceText };
        });

        // Stats display
        this.add.text(50, 400, `Stats:\nHP: ${this.stats.hp}/${this.stats.maxHP}\nDamage: +${this.stats.damage}%\nAttack Speed: +${this.stats.attackSpeed}%\nArmor: ${this.stats.armor}\nSpeed: +${this.stats.speed}%`, {
            fontSize: '14px',
            fill: '#cccccc'
        });

        // Weapons display
        let weaponStr = 'Weapons:\n';
        this.weapons.forEach(w => weaponStr += `- ${w.type} (${w.damage} dmg)\n`);
        this.add.text(250, 400, weaponStr, {
            fontSize: '14px',
            fill: '#cccccc'
        });

        // Continue button
        const continueBtn = this.add.text(cx, 550, '[ NEXT WAVE ]', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        continueBtn.on('pointerover', () => continueBtn.setFill('#88ff88'));
        continueBtn.on('pointerout', () => continueBtn.setFill('#00ff00'));
        continueBtn.on('pointerdown', () => this.nextWave());
    }

    generateShopItems() {
        const items = [];
        const wave = this.currentWave;

        // Weapons
        const weaponTypes = [
            { name: 'Pistol', type: 'pistol', damage: 12, cooldown: 870, range: 400, price: 25 },
            { name: 'SMG', type: 'smg', damage: 3, cooldown: 150, range: 400, price: 35 },
            { name: 'Shotgun', type: 'shotgun', damage: 5, cooldown: 1000, range: 300, price: 40 },
            { name: 'Knife', type: 'knife', damage: 8, cooldown: 780, range: 150, price: 20 },
            { name: 'Sword', type: 'sword', damage: 25, cooldown: 1200, range: 200, price: 45 }
        ];

        // Add 2 weapons
        for (let i = 0; i < 2; i++) {
            const w = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
            items.push({
                name: w.name,
                isWeapon: true,
                weaponData: { type: w.type, damage: w.damage, cooldown: w.cooldown, range: w.range, lastFired: 0 },
                effect: `${w.damage} dmg`,
                price: w.price + wave * 3
            });
        }

        // Stat items
        const statItems = [
            { name: 'Health Boost', effect: '+5 Max HP', stat: 'maxHP', value: 5, price: 20 },
            { name: 'Damage Boost', effect: '+10% Damage', stat: 'damage', value: 10, price: 30 },
            { name: 'Attack Speed', effect: '+10% Attack Speed', stat: 'attackSpeed', value: 10, price: 30 },
            { name: 'Armor Plate', effect: '+2 Armor', stat: 'armor', value: 2, price: 25 },
            { name: 'Speed Boost', effect: '+5% Speed', stat: 'speed', value: 5, price: 20 },
            { name: 'Lucky Charm', effect: '+10 Luck', stat: 'luck', value: 10, price: 25 },
            { name: 'Harvester', effect: '+5 Harvesting', stat: 'harvesting', value: 5, price: 20 }
        ];

        // Add 2 stat items
        for (let i = 0; i < 2; i++) {
            const s = statItems[Math.floor(Math.random() * statItems.length)];
            items.push({
                name: s.name,
                effect: s.effect,
                stat: s.stat,
                value: s.value,
                price: s.price + wave * 2
            });
        }

        return items;
    }

    buyItem(item, idx) {
        if (this.materials < item.price) {
            this.showMessage('Not enough materials!');
            return;
        }

        if (item.isWeapon) {
            if (this.weapons.length >= 6) {
                this.showMessage('Weapon slots full!');
                return;
            }
            this.weapons.push(item.weaponData);
        } else {
            if (item.stat === 'maxHP') {
                this.stats.maxHP += item.value;
                this.stats.hp += item.value;
            } else {
                this.stats[item.stat] += item.value;
            }
        }

        this.materials -= item.price;
        this.materialText.setText(`Materials: ${this.materials}`);

        // Remove item from display
        item.ui.box.destroy();
        item.ui.nameText.destroy();
        item.ui.effectText.destroy();
        item.ui.priceText.destroy();

        this.shopItems.splice(idx, 1);
        this.showMessage(`Bought ${item.name}!`);
    }

    showMessage(text) {
        const msg = this.add.text(GAME_WIDTH / 2, 500, text, {
            fontSize: '18px',
            fill: '#ffff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    nextWave() {
        this.scene.start('GameScene');

        // Pass data to game scene (using registry)
        this.registry.set('stats', this.stats);
        this.registry.set('weapons', this.weapons);
        this.registry.set('materials', this.materials);
        this.registry.set('level', this.level);
        this.registry.set('xp', this.xp);
        this.registry.set('xpToLevel', this.xpToLevel);
        this.registry.set('currentWave', this.currentWave + 1);

        // Start next wave scene
        this.scene.start('WaveScene', {
            stats: this.stats,
            weapons: this.weapons,
            materials: this.materials,
            level: this.level,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            currentWave: this.currentWave + 1
        });
    }
}

// ==================== WAVE SCENE (Combat) ====================
class WaveScene extends Phaser.Scene {
    constructor() {
        super('WaveScene');
    }

    init(data) {
        this.stats = data.stats || {
            maxHP: 15, hp: 15, damage: 0, attackSpeed: 0,
            armor: 0, speed: 0, luck: 0, harvesting: 8
        };
        this.weapons = data.weapons || [{ type: 'knife', damage: 8, cooldown: 780, lastFired: 0, range: 150 }];
        this.materials = data.materials || 0;
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.xpToLevel = data.xpToLevel || 16;
        this.currentWave = data.currentWave || 1;
    }

    create() {
        this.waveTimer = 0;
        this.waveDuration = 20000 + (this.currentWave - 1) * 5000;
        this.waveActive = true;
        this.bossSpawned = false;

        // Groups
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Draw arena floor
        for (let y = 0; y < GAME_HEIGHT; y += 32) {
            for (let x = 0; x < GAME_WIDTH; x += 32) {
                this.add.image(x + 16, y + 16, 'floor');
            }
        }

        // Create player
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Collisions
        this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitBullet, null, this);

        this.spawnTimer = 0;
        this.spawnInterval = Math.max(500, 1500 - this.currentWave * 100);

        this.createHUD();
        this.showWaveMessage();

        this.invincible = false;
    }

    createHUD() {
        this.add.rectangle(GAME_WIDTH / 2, 20, 204, 24, 0x333333);
        this.hpBar = this.add.rectangle(GAME_WIDTH / 2 - 100, 20, 200, 20, 0xff4444).setOrigin(0, 0.5);
        this.hpText = this.add.text(GAME_WIDTH / 2, 20, '', { fontSize: '14px', fill: '#ffffff' }).setOrigin(0.5);

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, 204, 16, 0x333333);
        this.xpBar = this.add.rectangle(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 20, 200, 12, 0x00ff88).setOrigin(0, 0.5);
        this.levelText = this.add.text(10, GAME_HEIGHT - 30, '', { fontSize: '14px', fill: '#00ff88' });

        this.materialText = this.add.text(10, 10, '', { fontSize: '16px', fill: '#ffdd00' });
        this.waveText = this.add.text(GAME_WIDTH - 10, 10, '', { fontSize: '16px', fill: '#ffffff' }).setOrigin(1, 0);
        this.timerText = this.add.text(GAME_WIDTH - 10, 30, '', { fontSize: '14px', fill: '#aaaaaa' }).setOrigin(1, 0);
    }

    showWaveMessage() {
        const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `WAVE ${this.currentWave}`, {
            fontSize: '48px', fill: '#ffff00'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: msg,
            alpha: 0, y: GAME_HEIGHT / 2 - 50,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    update(time, delta) {
        if (!this.waveActive) return;

        // Movement
        const baseSpeed = 200;
        const actualSpeed = baseSpeed * (1 + this.stats.speed / 100);
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.player.setVelocity(vx * actualSpeed, vy * actualSpeed);

        this.fireWeapons(time);

        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        this.enemies.getChildren().forEach(e => this.updateEnemy(e, time));
        this.projectiles.getChildren().forEach(p => { p.life -= delta; if (p.life <= 0) p.destroy(); });
        this.enemyBullets.getChildren().forEach(b => { b.life -= delta; if (b.life <= 0) b.destroy(); });

        this.waveTimer += delta;
        if (this.waveTimer >= this.waveDuration) this.endWave();

        this.updateHUD();
    }

    fireWeapons(time) {
        const nearestEnemy = this.findNearestEnemy();
        if (!nearestEnemy) return;

        this.weapons.forEach(weapon => {
            const cooldown = weapon.cooldown / (1 + this.stats.attackSpeed / 100);
            if (time - weapon.lastFired >= cooldown) {
                weapon.lastFired = time;
                this.fireWeapon(weapon, nearestEnemy);
            }
        });
    }

    findNearestEnemy() {
        let nearest = null, nearestDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (dist < nearestDist) { nearestDist = dist; nearest = e; }
        });
        return nearest;
    }

    fireWeapon(weapon, target) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);

        if (weapon.type === 'shotgun') {
            for (let i = 0; i < 5; i++) {
                const spread = (i - 2) * 0.15;
                const p = this.projectiles.create(this.player.x, this.player.y, 'bullet');
                p.setScale(0.7);
                p.setVelocity(Math.cos(angle + spread) * 400, Math.sin(angle + spread) * 400);
                p.damage = weapon.damage * (1 + this.stats.damage / 100);
                p.life = 300;
            }
            return;
        }

        let proj;
        if (weapon.type === 'knife' || weapon.type === 'sword') {
            proj = this.projectiles.create(this.player.x, this.player.y, weapon.type);
            proj.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
            proj.rotation = angle;
            proj.life = 300;
        } else {
            proj = this.projectiles.create(this.player.x, this.player.y, 'bullet');
            const speed = weapon.type === 'smg' ? 500 : 500;
            const spread = weapon.type === 'smg' ? (Math.random() - 0.5) * 0.2 : 0;
            proj.setVelocity(Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed);
            proj.life = 500;
        }
        proj.damage = weapon.damage * (1 + this.stats.damage / 100);
    }

    spawnEnemy() {
        if (this.enemies.countActive() >= 50) return;

        let x, y;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = -20; y = Math.random() * GAME_HEIGHT; }
        else if (side === 1) { x = GAME_WIDTH + 20; y = Math.random() * GAME_HEIGHT; }
        else if (side === 2) { x = Math.random() * GAME_WIDTH; y = -20; }
        else { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 20; }

        const enemyType = this.getEnemyType();
        const enemy = this.enemies.create(x, y, enemyType);
        enemy.enemyType = enemyType;

        const stats = {
            baby_alien: { hp: 3 + this.currentWave * 2, speed: 80, damage: 1 },
            chaser: { hp: 1 + this.currentWave, speed: 150, damage: 1 },
            charger: { hp: 4 + this.currentWave * 2.5, speed: 60, damage: 2, charges: true },
            spitter: { hp: 8 + this.currentWave, speed: 50, damage: 1, ranged: true },
            bruiser: { hp: 20 + this.currentWave * 11, speed: 40, damage: 3 },
            boss: { hp: 200 + this.currentWave * 50, speed: 30, damage: 5, isBoss: true }
        };

        const s = stats[enemyType] || stats.baby_alien;
        enemy.hp = s.hp;
        enemy.speed = s.speed;
        enemy.contactDamage = s.damage;
        enemy.canShoot = s.ranged;
        enemy.canCharge = s.charges;
        enemy.isBoss = s.isBoss;
        enemy.lastShot = 0;
        enemy.charging = false;

        if (enemy.isBoss) enemy.setScale(1.5);
    }

    getEnemyType() {
        const wave = this.currentWave;
        if (wave === 10 && !this.bossSpawned && this.waveTimer > 5000) {
            this.bossSpawned = true;
            return 'boss';
        }

        const types = ['baby_alien'];
        if (wave >= 2) types.push('chaser');
        if (wave >= 3) types.push('charger');
        if (wave >= 4) types.push('spitter');
        if (wave >= 6) types.push('bruiser');
        return types[Math.floor(Math.random() * types.length)];
    }

    updateEnemy(enemy, time) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (enemy.canCharge && !enemy.charging && dist < 200) {
            enemy.charging = true;
            enemy.chargeDir = { x: dx / dist, y: dy / dist };
            this.time.delayedCall(2000, () => { if (enemy.active) enemy.charging = false; });
        }

        if (enemy.charging) {
            enemy.setVelocity(enemy.chargeDir.x * 300, enemy.chargeDir.y * 300);
        } else if (enemy.canShoot) {
            if (dist < 150) enemy.setVelocity(-dx / dist * enemy.speed, -dy / dist * enemy.speed);
            else if (dist > 200) enemy.setVelocity(dx / dist * enemy.speed * 0.5, dy / dist * enemy.speed * 0.5);
            else enemy.setVelocity(0, 0);

            if (time - enemy.lastShot > 2000) {
                enemy.lastShot = time;
                const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemy_bullet');
                const angle = Math.atan2(dy, dx);
                bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
                bullet.damage = enemy.contactDamage;
                bullet.life = 3000;
            }
        } else if (dist > 10) {
            enemy.setVelocity(dx / dist * enemy.speed, dy / dist * enemy.speed);
        }
    }

    projectileHitEnemy(proj, enemy) {
        enemy.hp -= proj.damage || 10;
        proj.destroy();
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => { if (enemy.active) enemy.clearTint(); });
        if (enemy.hp <= 0) this.enemyDeath(enemy);
    }

    enemyDeath(enemy) {
        const xpAmount = enemy.isBoss ? 50 : 5;
        for (let i = 0; i < Math.ceil(xpAmount / 5); i++) {
            const xp = this.pickups.create(enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20, 'xp');
            xp.pickupType = 'xp';
            xp.value = 5 + this.stats.harvesting;
        }

        const matAmount = enemy.isBoss ? 30 : (Math.random() < 0.5 ? 1 : 2);
        for (let i = 0; i < matAmount; i++) {
            const mat = this.pickups.create(enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20, 'material');
            mat.pickupType = 'material';
            mat.value = 1 + Math.floor(this.stats.harvesting / 10);
        }

        if (Math.random() < 0.1) {
            const hp = this.pickups.create(enemy.x, enemy.y, 'health_pickup');
            hp.pickupType = 'health';
            hp.value = 3;
        }

        enemy.destroy();
        if (enemy.isBoss) this.victory();
    }

    playerHitEnemy(player, enemy) {
        if (this.invincible) return;
        this.takeDamage(enemy.contactDamage);
    }

    playerHitBullet(player, bullet) {
        if (this.invincible) return;
        this.takeDamage(bullet.damage);
        bullet.destroy();
    }

    takeDamage(amount) {
        const reduction = this.stats.armor / (this.stats.armor + 15);
        const damage = Math.max(1, Math.floor(amount * (1 - reduction)));
        this.stats.hp -= damage;
        this.invincible = true;
        this.player.setAlpha(0.5);
        this.cameras.main.shake(100, 0.01);
        this.time.delayedCall(500, () => { this.invincible = false; if (this.player.active) this.player.setAlpha(1); });
        if (this.stats.hp <= 0) this.gameOver();
    }

    collectPickup(player, pickup) {
        if (pickup.pickupType === 'xp') {
            this.xp += pickup.value;
            if (this.xp >= this.xpToLevel) this.levelUp();
        } else if (pickup.pickupType === 'material') {
            this.materials += pickup.value;
        } else if (pickup.pickupType === 'health') {
            this.stats.hp = Math.min(this.stats.maxHP, this.stats.hp + pickup.value);
        }
        pickup.destroy();
    }

    levelUp() {
        this.xp -= this.xpToLevel;
        this.level++;
        this.xpToLevel = Math.pow(this.level + 3, 2);
        this.stats.maxHP++;
        this.stats.hp = Math.min(this.stats.hp + 1, this.stats.maxHP);

        const upgrades = ['damage', 'attackSpeed', 'armor', 'speed', 'maxHP'];
        const stat = upgrades[Math.floor(Math.random() * upgrades.length)];
        if (stat === 'damage') this.stats.damage += 5;
        else if (stat === 'attackSpeed') this.stats.attackSpeed += 5;
        else if (stat === 'armor') this.stats.armor += 1;
        else if (stat === 'speed') this.stats.speed += 3;
        else if (stat === 'maxHP') { this.stats.maxHP += 3; this.stats.hp += 3; }
    }

    endWave() {
        this.waveActive = false;
        this.enemies.getChildren().forEach(e => e.destroy());
        this.pickups.getChildren().forEach(p => {
            if (p.pickupType === 'xp') this.xp += p.value;
            else if (p.pickupType === 'material') this.materials += p.value;
            p.destroy();
        });

        if (this.currentWave >= 10) {
            this.victory();
            return;
        }

        this.scene.start('ShopScene', {
            stats: this.stats,
            weapons: this.weapons,
            materials: this.materials,
            level: this.level,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            currentWave: this.currentWave
        });
    }

    gameOver() {
        this.waveActive = false;
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER', { fontSize: '48px', fill: '#ff0000' }).setOrigin(0.5).setDepth(100);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    victory() {
        this.waveActive = false;
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'VICTORY!', { fontSize: '48px', fill: '#00ff00' }).setOrigin(0.5).setDepth(100);
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'You survived all 10 waves!', { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5).setDepth(100);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    updateHUD() {
        const hpPercent = this.stats.hp / this.stats.maxHP;
        this.hpBar.width = 200 * hpPercent;
        this.hpText.setText(`${this.stats.hp}/${this.stats.maxHP}`);
        this.xpBar.width = 200 * (this.xp / this.xpToLevel);
        this.levelText.setText(`Level ${this.level}`);
        this.materialText.setText(`Materials: ${this.materials}`);
        this.waveText.setText(`Wave ${this.currentWave}/10`);
        const remaining = Math.max(0, Math.ceil((this.waveDuration - this.waveTimer) / 1000));
        this.timerText.setText(`${remaining}s`);
    }
}

// ==================== CONFIG ====================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, MenuScene, GameScene, ShopScene, WaveScene]
};

const game = new Phaser.Game(config);
