// Spud Survivors - Brotato Clone
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ARENA_RADIUS = 280;

// Weapons data
const WEAPONS = {
    knife: { damage: 6, cooldown: 800, range: 80, type: 'melee', projectiles: 0 },
    sword: { damage: 20, cooldown: 1000, range: 100, type: 'melee', projectiles: 0 },
    pistol: { damage: 10, cooldown: 500, range: 300, type: 'ranged', projectiles: 1 },
    smg: { damage: 4, cooldown: 150, range: 250, type: 'ranged', projectiles: 1 },
    shotgun: { damage: 5, cooldown: 1000, range: 200, type: 'ranged', projectiles: 5 },
    spear: { damage: 15, cooldown: 1200, range: 150, type: 'melee', projectiles: 0 },
    fist: { damage: 8, cooldown: 600, range: 60, type: 'melee', projectiles: 0 },
    flamethrower: { damage: 3, cooldown: 100, range: 150, type: 'ranged', projectiles: 1 }
};

// Enemy data
const ENEMIES = {
    baby: { hp: 3, speed: 80, damage: 1, size: 16, color: 0x88ff88 },
    chaser: { hp: 2, speed: 150, damage: 1, size: 14, color: 0xff8888 },
    charger: { hp: 5, speed: 50, damage: 2, size: 20, color: 0xffaa00 },
    spitter: { hp: 6, speed: 60, damage: 1, size: 18, color: 0x8888ff },
    bruiser: { hp: 20, speed: 40, damage: 3, size: 28, color: 0xff4444 }
};

// Items data
const ITEMS = [
    { name: 'Helmet', stat: 'armor', value: 2, cost: 15 },
    { name: 'Running Shoes', stat: 'speed', value: 10, cost: 15 },
    { name: 'Glasses', stat: 'crit', value: 5, cost: 18 },
    { name: 'Bandana', stat: 'piercing', value: 1, cost: 20 },
    { name: 'Power Glove', stat: 'damage', value: 5, cost: 25 },
    { name: 'Lucky Charm', stat: 'luck', value: 10, cost: 25 },
    { name: 'Medikit', stat: 'regen', value: 2, cost: 20 },
    { name: 'Magnet', stat: 'pickupRange', value: 30, cost: 18 },
    { name: 'Heavy Armor', stat: 'armor', value: 4, cost: 40 },
    { name: 'Attack Boost', stat: 'attackSpeed', value: 10, cost: 30 }
];

// Characters
const CHARACTERS = [
    { name: 'Potato', hp: 15, speed: 100, damage: 0, weapon: 'knife', color: 0xddaa66 },
    { name: 'Ranger', hp: 10, speed: 110, damage: 5, weapon: 'pistol', color: 0x66aa66 },
    { name: 'Bruiser', hp: 20, speed: 80, damage: 10, weapon: 'fist', color: 0xaa6666 },
    { name: 'Speedster', hp: 8, speed: 150, damage: 0, weapon: 'smg', color: 0x6666aa },
    { name: 'Tank', hp: 30, speed: 70, damage: 0, weapon: 'sword', color: 0x888888 }
];

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const g = this.make.graphics({ add: false });

        // Player
        g.clear();
        g.fillStyle(0xddaa66);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x000000);
        g.fillCircle(12, 12, 3);
        g.fillCircle(20, 12, 3);
        g.fillStyle(0xffffff);
        g.fillCircle(12, 11, 1);
        g.fillCircle(20, 11, 1);
        g.generateTexture('player', 32, 32);

        // Bullet
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Melee swing
        g.clear();
        g.fillStyle(0xffffff);
        g.fillRect(0, 8, 40, 4);
        g.generateTexture('swing', 40, 20);

        // Material pickup
        g.clear();
        g.fillStyle(0xffdd00);
        g.fillCircle(6, 6, 5);
        g.generateTexture('material', 12, 12);

        // XP orb
        g.clear();
        g.fillStyle(0x00ff88);
        g.fillCircle(5, 5, 4);
        g.generateTexture('xp', 10, 10);

        // Health pickup
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(6, 8, 5);
        g.fillCircle(10, 8, 5);
        g.fillTriangle(3, 9, 13, 9, 8, 16);
        g.generateTexture('health', 16, 18);

        // Enemy textures
        Object.entries(ENEMIES).forEach(([name, data]) => {
            g.clear();
            g.fillStyle(data.color);
            g.fillCircle(data.size, data.size, data.size - 2);
            g.fillStyle(0x000000);
            g.fillCircle(data.size - 4, data.size - 4, 3);
            g.fillCircle(data.size + 4, data.size - 4, 3);
            g.generateTexture(`enemy_${name}`, data.size * 2, data.size * 2);
        });

        // Boss
        g.clear();
        g.fillStyle(0x880088);
        g.fillCircle(40, 40, 38);
        g.fillStyle(0xff00ff);
        g.fillCircle(40, 40, 30);
        g.fillStyle(0x000000);
        g.fillCircle(30, 30, 6);
        g.fillCircle(50, 30, 6);
        g.fillStyle(0xff0000);
        g.fillCircle(30, 29, 2);
        g.fillCircle(50, 29, 2);
        g.generateTexture('boss', 80, 80);

        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = GAME_WIDTH / 2;

        this.add.text(cx, 80, 'SPUD SURVIVORS', {
            fontSize: '48px', fontFamily: 'Arial', color: '#ffaa00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 140, 'A Brotato Clone', {
            fontSize: '20px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, 200, 'Choose your character:', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);

        // Character buttons
        CHARACTERS.forEach((char, i) => {
            const x = 100 + (i % 3) * 250;
            const y = 280 + Math.floor(i / 3) * 120;

            const bg = this.add.rectangle(x, y, 200, 90, 0x333333).setInteractive();
            const txt = this.add.text(x, y - 25, char.name, {
                fontSize: '20px', fontFamily: 'Arial', color: '#ffffff'
            }).setOrigin(0.5);
            const stats = this.add.text(x, y + 10, `HP: ${char.hp} | SPD: ${char.speed}`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa'
            }).setOrigin(0.5);
            const weapon = this.add.text(x, y + 30, `Weapon: ${char.weapon}`, {
                fontSize: '12px', fontFamily: 'Arial', color: '#88ff88'
            }).setOrigin(0.5);

            bg.on('pointerover', () => bg.setFillStyle(0x555555));
            bg.on('pointerout', () => bg.setFillStyle(0x333333));
            bg.on('pointerdown', () => {
                this.scene.start('GameScene', { character: i });
            });
        });

        this.add.text(cx, 520, 'WASD to move | Auto-attack nearest enemy', {
            fontSize: '16px', fontFamily: 'Arial', color: '#666666'
        }).setOrigin(0.5);
    }
}

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.characterIndex = data.character || 0;
    }

    create() {
        const char = CHARACTERS[this.characterIndex];

        // Player stats
        this.stats = {
            maxHp: char.hp,
            hp: char.hp,
            damage: char.damage,
            attackSpeed: 0,
            armor: 0,
            speed: char.speed,
            luck: 0,
            crit: 0,
            regen: 0,
            pickupRange: 50,
            piercing: 0
        };

        // Game state
        this.currentWave = 1;
        this.maxWaves = 10;
        this.waveTimer = 0;
        this.waveDuration = 20000; // 20 seconds
        this.materials = 0;
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 16;
        this.inShop = false;
        this.gameOver = false;

        // Weapons
        this.weapons = [{ ...WEAPONS[char.weapon], name: char.weapon, lastFire: 0 }];
        this.maxWeapons = 6;

        // Draw arena
        this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, ARENA_RADIUS + 20, 0x333333);
        this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, ARENA_RADIUS, 0x1a1a2e);

        // Groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.meleeSwings = this.physics.add.group();

        // Player
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.body.setCircle(12, 4, 4);
        this.player.setTint(char.color);

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.meleeSwings, this.enemies, this.meleeHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });

        // HUD
        this.createHUD();

        // Start wave
        this.startWave();
    }

    createHUD() {
        // HP bar
        this.hpBarBg = this.add.rectangle(GAME_WIDTH / 2, 20, 300, 20, 0x333333).setDepth(100);
        this.hpBar = this.add.rectangle(GAME_WIDTH / 2 - 148, 20, 296, 16, 0xff4444).setOrigin(0, 0.5).setDepth(101);
        this.hpText = this.add.text(GAME_WIDTH / 2, 20, '', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(102);

        // XP bar
        this.xpBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 40, 400, 16, 0x333333).setDepth(100);
        this.xpBar = this.add.rectangle(GAME_WIDTH / 2 - 198, GAME_HEIGHT - 40, 0, 12, 0x00ff88).setOrigin(0, 0.5).setDepth(101);
        this.xpText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setDepth(102);

        // Wave and timer
        this.waveText = this.add.text(20, 50, '', { fontSize: '18px', color: '#ffffff' }).setDepth(100);
        this.timerText = this.add.text(20, 75, '', { fontSize: '16px', color: '#ffaa00' }).setDepth(100);

        // Materials
        this.materialsText = this.add.text(GAME_WIDTH - 20, 50, '', { fontSize: '16px', color: '#ffdd00' }).setOrigin(1, 0).setDepth(100);

        // Weapons display
        this.weaponsText = this.add.text(20, GAME_HEIGHT - 70, '', { fontSize: '12px', color: '#88ccff' }).setDepth(100);

        this.updateHUD();
    }

    updateHUD() {
        this.hpBar.width = (this.stats.hp / this.stats.maxHp) * 296;
        this.hpText.setText(`${Math.ceil(this.stats.hp)}/${this.stats.maxHp}`);

        this.xpBar.width = (this.xp / this.xpToLevel) * 396;
        this.xpText.setText(`Level ${this.level} - XP: ${this.xp}/${this.xpToLevel}`);

        this.waveText.setText(`Wave ${this.currentWave}/${this.maxWaves}`);
        const timeLeft = Math.ceil((this.waveDuration - this.waveTimer) / 1000);
        this.timerText.setText(`Time: ${timeLeft}s`);

        this.materialsText.setText(`Materials: ${this.materials}`);

        const weaponNames = this.weapons.map(w => w.name).join(', ');
        this.weaponsText.setText(`Weapons: ${weaponNames}`);
    }

    startWave() {
        this.waveTimer = 0;
        this.waveDuration = 20000 + (this.currentWave - 1) * 5000; // Longer each wave
        this.inShop = false;

        // Clear existing enemies
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);

        // Spawn enemies immediately
        this.spawnWaveEnemies();
    }

    spawnWaveEnemies() {
        // Determine enemy types based on wave
        const enemyTypes = ['baby'];
        if (this.currentWave >= 2) enemyTypes.push('chaser');
        if (this.currentWave >= 3) enemyTypes.push('charger');
        if (this.currentWave >= 4) enemyTypes.push('spitter');
        if (this.currentWave >= 6) enemyTypes.push('bruiser');

        // Calculate enemy count
        const baseCount = 5 + this.currentWave * 3;

        for (let i = 0; i < baseCount; i++) {
            this.time.delayedCall(i * 200, () => {
                if (!this.inShop && !this.gameOver) {
                    this.spawnEnemy(Phaser.Utils.Array.GetRandom(enemyTypes));
                }
            });
        }

        // Spawn boss on wave 10
        if (this.currentWave === 10) {
            this.time.delayedCall(5000, () => {
                if (!this.inShop && !this.gameOver) {
                    this.spawnBoss();
                }
            });
        }
    }

    spawnEnemy(type) {
        const data = ENEMIES[type];
        const angle = Math.random() * Math.PI * 2;
        const dist = ARENA_RADIUS + 50;
        const x = GAME_WIDTH / 2 + Math.cos(angle) * dist;
        const y = GAME_HEIGHT / 2 + Math.sin(angle) * dist;

        const enemy = this.physics.add.sprite(x, y, `enemy_${type}`);
        enemy.setData('type', type);
        enemy.setData('hp', data.hp + this.currentWave * 2);
        enemy.setData('damage', data.damage);
        enemy.setData('speed', data.speed + this.currentWave * 5);
        enemy.setData('behavior', type === 'spitter' ? 'ranged' : 'chase');
        enemy.setData('lastShot', 0);
        enemy.body.setCircle(data.size - 4, 4, 4);
        this.enemies.add(enemy);
    }

    spawnBoss() {
        const angle = Math.random() * Math.PI * 2;
        const dist = ARENA_RADIUS + 50;
        const x = GAME_WIDTH / 2 + Math.cos(angle) * dist;
        const y = GAME_HEIGHT / 2 + Math.sin(angle) * dist;

        const boss = this.physics.add.sprite(x, y, 'boss');
        boss.setData('type', 'boss');
        boss.setData('hp', 100 + this.currentWave * 20);
        boss.setData('damage', 5);
        boss.setData('speed', 60);
        boss.setData('behavior', 'boss');
        boss.body.setCircle(35, 5, 5);
        this.enemies.add(boss);
    }

    update(time, delta) {
        if (this.gameOver || this.inShop) return;

        // Movement
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        const speed = this.stats.speed * (1 + this.stats.speed / 200);
        this.player.setVelocity(vx * speed, vy * speed);

        // Keep player in arena
        const dx = this.player.x - GAME_WIDTH / 2;
        const dy = this.player.y - GAME_HEIGHT / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > ARENA_RADIUS - 20) {
            const angle = Math.atan2(dy, dx);
            this.player.x = GAME_WIDTH / 2 + Math.cos(angle) * (ARENA_RADIUS - 20);
            this.player.y = GAME_HEIGHT / 2 + Math.sin(angle) * (ARENA_RADIUS - 20);
        }

        // Auto-attack
        this.autoAttack(time);

        // Update enemies
        this.updateEnemies(time);

        // HP regen
        if (this.stats.regen > 0) {
            this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.regen * delta / 5000);
        }

        // Wave timer
        this.waveTimer += delta;
        if (this.waveTimer >= this.waveDuration) {
            this.endWave();
        }

        this.updateHUD();
    }

    autoAttack(time) {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;

        this.enemies.children.each(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        });

        if (!nearest) return;

        // Fire each weapon
        this.weapons.forEach(weapon => {
            const cooldown = weapon.cooldown * (1 - this.stats.attackSpeed / 200);
            if (time - weapon.lastFire < cooldown) return;
            if (nearestDist > weapon.range + 100) return;

            weapon.lastFire = time;

            if (weapon.type === 'melee') {
                this.meleeAttack(weapon, nearest);
            } else {
                this.rangedAttack(weapon, nearest);
            }
        });
    }

    meleeAttack(weapon, target) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        const swing = this.physics.add.sprite(
            this.player.x + Math.cos(angle) * 30,
            this.player.y + Math.sin(angle) * 30,
            'swing'
        );
        swing.setRotation(angle);
        swing.setData('damage', weapon.damage + this.stats.damage);
        swing.setData('hit', new Set());
        this.meleeSwings.add(swing);

        this.time.delayedCall(150, () => swing.destroy());
    }

    rangedAttack(weapon, target) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        const spread = weapon.projectiles > 1 ? 0.3 : 0;

        for (let i = 0; i < weapon.projectiles; i++) {
            const a = angle + (i - (weapon.projectiles - 1) / 2) * spread;
            const bullet = this.physics.add.sprite(this.player.x, this.player.y, 'bullet');
            bullet.setData('damage', weapon.damage + this.stats.damage);
            bullet.setData('piercing', this.stats.piercing);
            bullet.setData('hits', 0);
            bullet.setVelocity(Math.cos(a) * 400, Math.sin(a) * 400);
            this.bullets.add(bullet);

            this.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    updateEnemies(time) {
        this.enemies.children.each(enemy => {
            if (!enemy.active) return;

            const behavior = enemy.getData('behavior');
            const speed = enemy.getData('speed');

            // Keep enemies in arena
            const dx = enemy.x - GAME_WIDTH / 2;
            const dy = enemy.y - GAME_HEIGHT / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > ARENA_RADIUS) {
                const angle = Math.atan2(dy, dx);
                enemy.x = GAME_WIDTH / 2 + Math.cos(angle) * ARENA_RADIUS;
                enemy.y = GAME_HEIGHT / 2 + Math.sin(angle) * ARENA_RADIUS;
            }

            if (behavior === 'chase' || behavior === 'boss') {
                this.physics.moveToObject(enemy, this.player, speed);
            } else if (behavior === 'ranged') {
                const playerDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (playerDist < 100) {
                    // Run away
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                } else if (playerDist > 200) {
                    this.physics.moveToObject(enemy, this.player, speed * 0.5);
                } else {
                    enemy.setVelocity(0, 0);
                    // Shoot
                    if (time - enemy.getData('lastShot') > 2000) {
                        enemy.setData('lastShot', time);
                        this.enemyShoot(enemy);
                    }
                }
            }
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const bullet = this.add.circle(enemy.x, enemy.y, 5, 0xff6666);

        this.tweens.add({
            targets: bullet,
            x: enemy.x + Math.cos(angle) * 300,
            y: enemy.y + Math.sin(angle) * 300,
            duration: 1000,
            onUpdate: () => {
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                if (dist < 20) {
                    this.playerTakeDamage(1);
                    bullet.destroy();
                }
            },
            onComplete: () => bullet.destroy()
        });
    }

    bulletHitEnemy(bullet, enemy) {
        const damage = bullet.getData('damage');
        this.damageEnemy(enemy, damage);

        const hits = bullet.getData('hits') + 1;
        bullet.setData('hits', hits);

        if (hits > bullet.getData('piercing')) {
            bullet.destroy();
        }
    }

    meleeHitEnemy(swing, enemy) {
        const hitSet = swing.getData('hit');
        if (hitSet.has(enemy)) return;
        hitSet.add(enemy);

        const damage = swing.getData('damage');
        this.damageEnemy(enemy, damage);
    }

    damageEnemy(enemy, damage) {
        // Crit check
        if (Math.random() * 100 < this.stats.crit) {
            damage *= 2;
        }

        let hp = enemy.getData('hp') - damage;
        enemy.setData('hp', hp);

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    enemyDeath(enemy) {
        const type = enemy.getData('type');

        // Drop materials and XP
        const materialCount = type === 'boss' ? 20 : Phaser.Math.Between(1, 3);
        for (let i = 0; i < materialCount; i++) {
            const pickup = this.physics.add.sprite(
                enemy.x + (Math.random() - 0.5) * 30,
                enemy.y + (Math.random() - 0.5) * 30,
                'material'
            );
            pickup.setData('type', 'material');
            pickup.setData('value', 1);
            this.pickups.add(pickup);
        }

        const xpOrb = this.physics.add.sprite(enemy.x, enemy.y, 'xp');
        xpOrb.setData('type', 'xp');
        xpOrb.setData('value', type === 'boss' ? 50 : 5 + this.currentWave);
        this.pickups.add(xpOrb);

        // Chance to drop health
        if (Math.random() < 0.1) {
            const health = this.physics.add.sprite(enemy.x, enemy.y + 10, 'health');
            health.setData('type', 'health');
            this.pickups.add(health);
        }

        enemy.destroy();

        // Check boss death
        if (type === 'boss') {
            this.victory();
        }
    }

    playerHitEnemy(player, enemy) {
        const damage = enemy.getData('damage');
        this.playerTakeDamage(damage);

        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.x += Math.cos(angle) * 20;
        player.y += Math.sin(angle) * 20;
    }

    playerTakeDamage(damage) {
        // Armor reduction
        const reduction = this.stats.armor / (this.stats.armor + 15);
        damage = Math.max(1, damage * (1 - reduction));

        this.stats.hp -= damage;
        this.cameras.main.shake(100, 0.01);

        if (this.stats.hp <= 0) {
            this.death();
        }
    }

    collectPickup(player, pickup) {
        const type = pickup.getData('type');

        if (type === 'material') {
            this.materials += pickup.getData('value');
        } else if (type === 'xp') {
            this.xp += pickup.getData('value');
            this.checkLevelUp();
        } else if (type === 'health') {
            this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 5);
        }

        pickup.destroy();
    }

    checkLevelUp() {
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.pow(this.level + 3, 2);
            this.stats.maxHp += 1;
            this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 1);

            // Show level up choices (simplified - auto-apply random upgrade)
            const upgrades = ['damage', 'attackSpeed', 'speed', 'maxHp', 'armor'];
            const upgrade = Phaser.Utils.Array.GetRandom(upgrades);
            if (upgrade === 'damage') this.stats.damage += 3;
            else if (upgrade === 'attackSpeed') this.stats.attackSpeed += 5;
            else if (upgrade === 'speed') this.stats.speed += 5;
            else if (upgrade === 'maxHp') { this.stats.maxHp += 3; this.stats.hp += 3; }
            else if (upgrade === 'armor') this.stats.armor += 1;

            this.showFloatText(`LEVEL UP! +${upgrade}`, '#00ff88');
        }
    }

    showFloatText(text, color) {
        const t = this.add.text(this.player.x, this.player.y - 40, text, {
            fontSize: '18px', fontFamily: 'Arial', color: color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(200);

        this.tweens.add({
            targets: t,
            y: t.y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => t.destroy()
        });
    }

    endWave() {
        this.inShop = true;

        // Collect all remaining pickups
        this.pickups.children.each(pickup => {
            if (pickup.getData('type') === 'material') {
                this.materials += pickup.getData('value');
            } else if (pickup.getData('type') === 'xp') {
                this.xp += pickup.getData('value');
                this.checkLevelUp();
            }
        });
        this.pickups.clear(true, true);
        this.enemies.clear(true, true);

        // Open shop
        this.openShop();
    }

    openShop() {
        // Shop overlay
        this.shopOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setDepth(300);

        this.add.text(GAME_WIDTH / 2, 50, `SHOP - Wave ${this.currentWave} Complete!`, {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffaa00', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(301);

        this.shopMaterialsText = this.add.text(GAME_WIDTH / 2, 90, `Materials: ${this.materials}`, {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffdd00'
        }).setOrigin(0.5).setDepth(301);

        // Generate shop items
        this.shopItems = [];
        const shuffled = Phaser.Utils.Array.Shuffle([...ITEMS]);
        for (let i = 0; i < 4; i++) {
            const item = shuffled[i];
            const x = 100 + i * 160;
            const y = 200;

            const bg = this.add.rectangle(x, y, 140, 150, 0x333333).setDepth(301).setInteractive();
            const name = this.add.text(x, y - 50, item.name, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffffff'
            }).setOrigin(0.5).setDepth(302);
            const effect = this.add.text(x, y, `+${item.value} ${item.stat}`, {
                fontSize: '12px', fontFamily: 'Arial', color: '#88ff88'
            }).setOrigin(0.5).setDepth(302);
            const cost = this.add.text(x, y + 40, `${item.cost} mat`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffdd00'
            }).setOrigin(0.5).setDepth(302);

            this.shopItems.push({ bg, name, effect, cost, item });

            bg.on('pointerover', () => bg.setFillStyle(0x555555));
            bg.on('pointerout', () => bg.setFillStyle(0x333333));
            bg.on('pointerdown', () => this.buyItem(i));
        }

        // Weapon shop
        this.add.text(GAME_WIDTH / 2, 320, 'Weapons', {
            fontSize: '18px', fontFamily: 'Arial', color: '#88ccff'
        }).setOrigin(0.5).setDepth(301);

        const weaponNames = Object.keys(WEAPONS);
        this.shopWeapons = [];
        for (let i = 0; i < 3; i++) {
            const weaponName = weaponNames[Math.floor(Math.random() * weaponNames.length)];
            const weapon = WEAPONS[weaponName];
            const x = 200 + i * 200;
            const y = 400;
            const weaponCost = 20 + this.currentWave * 5;

            const bg = this.add.rectangle(x, y, 160, 100, 0x333355).setDepth(301).setInteractive();
            const name = this.add.text(x, y - 20, weaponName, {
                fontSize: '16px', fontFamily: 'Arial', color: '#ffffff'
            }).setOrigin(0.5).setDepth(302);
            const stats = this.add.text(x, y + 10, `DMG: ${weapon.damage}`, {
                fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa'
            }).setOrigin(0.5).setDepth(302);
            const cost = this.add.text(x, y + 35, `${weaponCost} mat`, {
                fontSize: '14px', fontFamily: 'Arial', color: '#ffdd00'
            }).setOrigin(0.5).setDepth(302);

            this.shopWeapons.push({ bg, name, stats, cost, weaponName, weaponCost });

            bg.on('pointerover', () => bg.setFillStyle(0x555577));
            bg.on('pointerout', () => bg.setFillStyle(0x333355));
            bg.on('pointerdown', () => this.buyWeapon(i));
        }

        // Next wave button
        const nextBtn = this.add.rectangle(GAME_WIDTH / 2, 530, 200, 50, 0x00aa00).setDepth(301).setInteractive();
        this.add.text(GAME_WIDTH / 2, 530, 'NEXT WAVE', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(302);

        nextBtn.on('pointerover', () => nextBtn.setFillStyle(0x00cc00));
        nextBtn.on('pointerout', () => nextBtn.setFillStyle(0x00aa00));
        nextBtn.on('pointerdown', () => this.closeShop());
    }

    buyItem(index) {
        const shopItem = this.shopItems[index];
        if (!shopItem || !shopItem.item) return;

        const item = shopItem.item;
        if (this.materials < item.cost) return;

        this.materials -= item.cost;
        this.stats[item.stat] = (this.stats[item.stat] || 0) + item.value;

        shopItem.bg.setFillStyle(0x226622);
        shopItem.bg.removeInteractive();
        this.shopMaterialsText.setText(`Materials: ${this.materials}`);
    }

    buyWeapon(index) {
        const shopWeapon = this.shopWeapons[index];
        if (!shopWeapon) return;

        if (this.weapons.length >= this.maxWeapons) return;
        if (this.materials < shopWeapon.weaponCost) return;

        this.materials -= shopWeapon.weaponCost;
        this.weapons.push({
            ...WEAPONS[shopWeapon.weaponName],
            name: shopWeapon.weaponName,
            lastFire: 0
        });

        shopWeapon.bg.setFillStyle(0x226622);
        shopWeapon.bg.removeInteractive();
        this.shopMaterialsText.setText(`Materials: ${this.materials}`);
    }

    closeShop() {
        // Clear shop UI
        this.shopOverlay.destroy();
        this.shopItems.forEach(s => {
            s.bg.destroy();
            s.name.destroy();
            s.effect.destroy();
            s.cost.destroy();
        });
        this.shopWeapons.forEach(s => {
            s.bg.destroy();
            s.name.destroy();
            s.stats.destroy();
            s.cost.destroy();
        });
        this.children.list.filter(c => c.depth >= 301).forEach(c => c.destroy());

        // Next wave
        this.currentWave++;
        if (this.currentWave > this.maxWaves) {
            this.victory();
        } else {
            this.startWave();
        }
    }

    death() {
        this.gameOver = true;
        this.player.setActive(false);
        this.player.setVisible(false);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'Arial', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(300);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, `Reached Wave ${this.currentWave}`, {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5).setDepth(300);

        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    victory() {
        this.gameOver = true;
        this.scene.start('VictoryScene', { wave: this.currentWave, level: this.level });
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() { super('VictoryScene'); }

    init(data) {
        this.finalWave = data.wave || 10;
        this.finalLevel = data.level || 1;
    }

    create() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'VICTORY!', {
            fontSize: '64px', fontFamily: 'Arial', color: '#00ff88', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'You survived all waves!', {
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, `Final Level: ${this.finalLevel}`, {
            fontSize: '20px', fontFamily: 'Arial', color: '#88ccff'
        }).setOrigin(0.5);

        const restart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, '[ PLAY AGAIN ]', {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffaa00'
        }).setOrigin(0.5).setInteractive();

        restart.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0a0a0a',
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
