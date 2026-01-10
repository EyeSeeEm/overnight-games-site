// Spud Survivor - Phaser 3 Version
// Brotato-style arena roguelike

const COLORS = {
    floor: 0x504540,
    floorLight: 0x5A504A,
    floorDark: 0x403530,
    rock: 0x706560,
    player: 0xEEEEEE,
    playerOutline: 0xAAAAAA,
    alien: 0x7A6A9A,
    alienDark: 0x5A5A7A,
    material: 0x66FF66,
    hp: 0xCC3333,
    hpBg: 0x441111,
    xp: 0x33CC33,
    xpBg: 0x114411,
    bullet: 0xFFFF88,
    deathMark: 0xAA3333
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
        playerGfx.fillStyle(COLORS.player);
        playerGfx.fillEllipse(16, 16, 24, 28);
        playerGfx.lineStyle(2, COLORS.playerOutline);
        playerGfx.strokeEllipse(16, 16, 24, 28);
        // Eyes
        playerGfx.fillStyle(0x000000);
        playerGfx.fillCircle(12, 13, 2.5);
        playerGfx.fillCircle(20, 13, 2.5);
        // Eyebrows
        playerGfx.lineStyle(2, 0x000000);
        playerGfx.lineBetween(9, 8, 14, 10);
        playerGfx.lineBetween(23, 8, 18, 10);
        // Mouth
        playerGfx.beginPath();
        playerGfx.arc(16, 20, 4, 0.2, Math.PI - 0.2);
        playerGfx.stroke();
        // Arms
        playerGfx.lineStyle(4, COLORS.player);
        playerGfx.lineBetween(6, 18, 0, 16);
        playerGfx.lineBetween(26, 18, 32, 16);
        // Weapons
        playerGfx.fillStyle(0x666666);
        playerGfx.fillRect(0, 13, 8, 6);
        playerGfx.fillRect(24, 13, 8, 6);
        playerGfx.generateTexture('player', 32, 32);
        playerGfx.destroy();

        // Basic enemy texture
        const enemyGfx = this.make.graphics({ x: 0, y: 0, add: false });
        enemyGfx.fillStyle(COLORS.alien);
        enemyGfx.fillEllipse(16, 16, 24, 30);
        enemyGfx.fillStyle(COLORS.alienDark);
        enemyGfx.fillEllipse(16, 18, 16, 20);
        // Big eyes
        enemyGfx.fillStyle(0xFFFFFF);
        enemyGfx.fillEllipse(11, 12, 10, 12);
        enemyGfx.fillEllipse(21, 12, 10, 12);
        // Pupils
        enemyGfx.fillStyle(0x111111);
        enemyGfx.fillCircle(12, 13, 2.5);
        enemyGfx.fillCircle(22, 13, 2.5);
        enemyGfx.generateTexture('enemy', 32, 32);
        enemyGfx.destroy();

        // Charger enemy
        const chargerGfx = this.make.graphics({ x: 0, y: 0, add: false });
        chargerGfx.fillStyle(0x8A7AAA);
        chargerGfx.fillEllipse(12, 12, 18, 22);
        chargerGfx.fillStyle(COLORS.alienDark);
        chargerGfx.fillEllipse(12, 14, 12, 15);
        chargerGfx.fillStyle(0xFFFFFF);
        chargerGfx.fillEllipse(9, 9, 7, 8);
        chargerGfx.fillEllipse(15, 9, 7, 8);
        chargerGfx.fillStyle(0x111111);
        chargerGfx.fillCircle(9, 10, 2);
        chargerGfx.fillCircle(15, 10, 2);
        chargerGfx.generateTexture('charger', 24, 24);
        chargerGfx.destroy();

        // Bruiser enemy
        const bruiserGfx = this.make.graphics({ x: 0, y: 0, add: false });
        bruiserGfx.fillStyle(0x6A5A8A);
        bruiserGfx.fillEllipse(24, 24, 40, 44);
        bruiserGfx.fillStyle(COLORS.alienDark);
        bruiserGfx.fillEllipse(24, 27, 28, 32);
        // Eyes
        bruiserGfx.fillStyle(0xFFFFFF);
        bruiserGfx.fillEllipse(16, 18, 12, 14);
        bruiserGfx.fillEllipse(32, 18, 12, 14);
        bruiserGfx.fillStyle(0x111111);
        bruiserGfx.fillCircle(17, 19, 3);
        bruiserGfx.fillCircle(33, 19, 3);
        // Mouth
        bruiserGfx.fillStyle(0x331122);
        bruiserGfx.fillEllipse(24, 34, 12, 8);
        bruiserGfx.fillStyle(0xFFFFFF);
        bruiserGfx.fillRect(20, 32, 3, 4);
        bruiserGfx.fillRect(25, 32, 3, 4);
        bruiserGfx.generateTexture('bruiser', 48, 48);
        bruiserGfx.destroy();

        // Bullet texture
        const bulletGfx = this.make.graphics({ x: 0, y: 0, add: false });
        bulletGfx.fillStyle(COLORS.bullet);
        bulletGfx.fillRect(0, 2, 12, 4);
        bulletGfx.generateTexture('bullet', 12, 8);
        bulletGfx.destroy();

        // Material pickup texture
        const materialGfx = this.make.graphics({ x: 0, y: 0, add: false });
        materialGfx.fillStyle(COLORS.material);
        materialGfx.fillTriangle(6, 0, 12, 6, 6, 12);
        materialGfx.fillTriangle(6, 0, 0, 6, 6, 12);
        materialGfx.fillStyle(0xAAFFAA);
        materialGfx.fillTriangle(6, 2, 8, 6, 6, 6);
        materialGfx.generateTexture('material', 12, 12);
        materialGfx.destroy();

        // Health pickup texture
        const healthGfx = this.make.graphics({ x: 0, y: 0, add: false });
        healthGfx.fillStyle(COLORS.hp);
        healthGfx.fillRect(4, 0, 4, 12);
        healthGfx.fillRect(0, 4, 12, 4);
        healthGfx.generateTexture('health', 12, 12);
        healthGfx.destroy();

        // Death marker texture
        const deathGfx = this.make.graphics({ x: 0, y: 0, add: false });
        deathGfx.lineStyle(3, COLORS.deathMark);
        deathGfx.lineBetween(0, 0, 16, 16);
        deathGfx.lineBetween(16, 0, 0, 16);
        deathGfx.generateTexture('deathMark', 16, 16);
        deathGfx.destroy();
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1A1A1A');

        this.add.text(400, 180, 'SPUD SURVIVOR', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#EEEEEE'
        }).setOrigin(0.5);

        this.add.text(400, 220, 'An Arena Roguelike', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        this.add.text(400, 320, 'WASD or Arrow Keys - Move', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Auto-aim weapons', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 380, 'Survive 20 waves!', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.startText = this.add.text(400, 480, 'Press SPACE to Start', {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#33CC33'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 300,
            callback: () => {
                this.startText.setColor(this.startText.style.color === '#33CC33' ? '#88FF88' : '#33CC33');
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
        // Initialize game state
        this.wave = 1;
        this.waveTimer = 0;
        this.waveDuration = 20;
        this.spawnTimer = 0;

        // Create background
        this.createBackground();

        // Groups
        this.deathMarkers = this.add.group();
        this.pickups = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.damageNumbers = this.add.group();

        // Player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.hp = 10;
        this.player.maxHp = 10;
        this.player.xp = 0;
        this.player.level = 1;
        this.player.xpToLevel = 16;
        this.player.materials = 0;
        this.player.damage = 5;
        this.player.attackSpeed = 1;
        this.player.fireTimer = 0;
        this.player.invulnTimer = 0;
        this.player.setDepth(10);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // UI
        this.createUI();
    }

    createBackground() {
        // Base floor
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.floor);
        bg.fillRect(0, 0, 800, 600);

        // Floor variations
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(20, 70);
            bg.fillStyle(Math.random() < 0.5 ? COLORS.floorLight : COLORS.floorDark, 0.3);
            bg.fillCircle(x, y, size);
        }

        // Ground details
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(2, 6);
            bg.fillStyle(COLORS.rock, 1);
            bg.fillCircle(x, y, size);
        }

        // Grass/weeds
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            bg.fillStyle(0x4A5030);
            bg.fillRect(x - 1, y - 6, 2, 6);
        }

        // Yellow patches
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const size = Phaser.Math.Between(3, 6);
            bg.fillStyle(0x8A7A50, 0.5);
            bg.fillRect(x - size, y - 2, size * 2, 4);
        }

        // Jagged dark edges
        bg.fillStyle(0x1A1A1A);
        for (let x = 0; x < 800; x += 20) {
            const h = 15 + Math.sin(x * 0.1) * 8 + Math.random() * 5;
            bg.fillRect(x, 0, 20, h);
            bg.fillRect(x, 600 - h, 20, h);
        }
        for (let y = 0; y < 600; y += 20) {
            const w = 15 + Math.sin(y * 0.12) * 8 + Math.random() * 5;
            bg.fillRect(0, y, w, 20);
            bg.fillRect(800 - w, y, w, 20);
        }

        bg.setDepth(-1);
    }

    createUI() {
        // HP Bar background
        this.add.rectangle(110, 20, 200, 20, COLORS.hpBg).setOrigin(0, 0);
        this.hpBar = this.add.rectangle(112, 22, 196, 16, COLORS.hp).setOrigin(0, 0);
        this.hpText = this.add.text(116, 24, '10 / 10', {
            fontSize: '12px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });

        // XP Bar
        this.add.rectangle(110, 45, 200, 14, COLORS.xpBg).setOrigin(0, 0);
        this.xpBar = this.add.rectangle(112, 47, 0, 10, COLORS.xp).setOrigin(0, 0);
        this.levelText = this.add.text(280, 48, 'LV.1', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        });

        // Materials
        this.add.circle(125, 75, 8, COLORS.material);
        this.materialsText = this.add.text(140, 68, '0', {
            fontSize: '16px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });

        // Wave info
        this.waveText = this.add.text(400, 20, 'WAVE 1', {
            fontSize: '24px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5, 0);

        this.timerText = this.add.text(400, 50, '20', {
            fontSize: '32px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5, 0);

        // Set UI depth
        [this.hpBar, this.hpText, this.xpBar, this.levelText, this.materialsText, this.waveText, this.timerText]
            .forEach(item => item.setDepth(100));
    }

    update(time, delta) {
        const dt = delta / 1000;

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateWave(dt);
        this.updateDamageNumbers(dt);
        this.updateDeathMarkers(dt);
        this.updateUI();
    }

    updatePlayer(dt) {
        // Movement
        let vx = 0, vy = 0;
        const speed = 200;

        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;
        if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed;

        if (vx && vy) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Keep in bounds (inside the jagged edge)
        this.player.x = Phaser.Math.Clamp(this.player.x, 50, 750);
        this.player.y = Phaser.Math.Clamp(this.player.y, 50, 550);

        // Auto-fire
        this.player.fireTimer -= dt;
        if (this.player.fireTimer <= 0 && this.enemies.getLength() > 0) {
            this.fireWeapon();
        }

        // Invulnerability
        if (this.player.invulnTimer > 0) {
            this.player.invulnTimer -= dt;
            this.player.setAlpha(Math.floor(this.player.invulnTimer * 10) % 2 === 0 ? 0.5 : 1);
        } else {
            this.player.setAlpha(1);
        }
    }

    fireWeapon() {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < nearestDist && dist < 400) {
                nearest = enemy;
                nearestDist = dist;
            }
        });

        if (nearest) {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
            const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
            bullet.setRotation(angle);
            bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
            bullet.damage = this.player.damage;
            bullet.range = 400;
            bullet.startX = this.player.x;
            bullet.startY = this.player.y;

            this.player.fireTimer = 1 / this.player.attackSpeed;
        }
    }

    updateEnemies(dt) {
        this.enemies.getChildren().forEach(enemy => {
            // Move toward player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);

            // Hit flash
            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt;
                enemy.setTint(0xFFFFFF);
            } else {
                enemy.clearTint();
            }
        });

        // Remove bullets that traveled too far
        this.bullets.getChildren().forEach(bullet => {
            const dist = Phaser.Math.Distance.Between(bullet.startX, bullet.startY, bullet.x, bullet.y);
            if (dist > bullet.range || bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
                bullet.destroy();
            }
        });
    }

    updateWave(dt) {
        this.waveTimer += dt;

        // Spawn enemies
        this.spawnTimer -= dt;
        const spawnRate = Math.max(0.3, 1.5 - this.wave * 0.05);
        if (this.spawnTimer <= 0 && this.enemies.getLength() < 50 + this.wave * 5) {
            this.spawnEnemy();
            this.spawnTimer = spawnRate;
        }

        // Check wave end
        if (this.waveTimer >= this.waveDuration) {
            this.wave++;
            this.waveTimer = 0;
            this.waveDuration = Math.min(60, 20 + this.wave * 2);
            this.player.materials += this.wave * 5;

            if (this.wave > 20) {
                this.scene.start('VictoryScene', {
                    level: this.player.level,
                    materials: this.player.materials
                });
            }
        }
    }

    spawnEnemy() {
        let x, y;
        const side = Phaser.Math.Between(0, 3);
        switch (side) {
            case 0: x = -30; y = Phaser.Math.Between(0, 600); break;
            case 1: x = 830; y = Phaser.Math.Between(0, 600); break;
            case 2: x = Phaser.Math.Between(0, 800); y = -30; break;
            case 3: x = Phaser.Math.Between(0, 800); y = 630; break;
        }

        let type = 'basic';
        if (this.wave >= 3 && Math.random() < 0.2) type = 'charger';
        if (this.wave >= 5 && Math.random() < 0.1) type = 'bruiser';

        let enemy;
        if (type === 'bruiser') {
            enemy = this.enemies.create(x, y, 'bruiser');
            enemy.hp = 15 + this.wave * 3;
            enemy.speed = 50;
            enemy.damage = 2;
        } else if (type === 'charger') {
            enemy = this.enemies.create(x, y, 'charger');
            enemy.hp = 3 + this.wave;
            enemy.speed = 180;
            enemy.damage = 1;
        } else {
            enemy = this.enemies.create(x, y, 'enemy');
            enemy.hp = 5 + this.wave * 2;
            enemy.speed = 80 + Math.random() * 40;
            enemy.damage = 1;
        }
        enemy.maxHp = enemy.hp;
        enemy.type = type;
        enemy.hitFlash = 0;
        enemy.setDepth(5);
    }

    bulletHitEnemy(bullet, enemy) {
        enemy.hp -= bullet.damage;
        enemy.hitFlash = 0.1;

        // Damage number
        this.createDamageNumber(enemy.x, enemy.y - 15, bullet.damage);

        bullet.destroy();

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Death marker
        const marker = this.add.image(enemy.x, enemy.y, 'deathMark');
        marker.setDepth(1);
        marker.life = 2.0;
        this.deathMarkers.add(marker);

        // Drop materials
        const dropCount = enemy.type === 'bruiser' ? 3 : 1;
        for (let i = 0; i < dropCount; i++) {
            const material = this.pickups.create(
                enemy.x + Phaser.Math.Between(-20, 20),
                enemy.y + Phaser.Math.Between(-20, 20),
                'material'
            );
            material.type = 'material';
            material.value = 1 + Math.floor(this.wave / 5);
            material.setDepth(2);
        }

        // Health drop
        if (Math.random() < 0.1) {
            const health = this.pickups.create(enemy.x, enemy.y, 'health');
            health.type = 'health';
            health.value = 3;
            health.setDepth(2);
        }

        enemy.destroy();
    }

    playerHitEnemy(player, enemy) {
        if (player.invulnTimer > 0) return;

        player.hp -= enemy.damage;
        player.invulnTimer = 0.5;

        if (player.hp <= 0) {
            this.scene.start('GameOverScene', {
                wave: this.wave,
                level: player.level,
                materials: player.materials
            });
        }
    }

    collectPickup(player, pickup) {
        if (pickup.type === 'material') {
            player.materials += pickup.value;
            player.xp += pickup.value;

            // Check level up
            while (player.xp >= player.xpToLevel) {
                player.xp -= player.xpToLevel;
                this.levelUp();
            }
        } else if (pickup.type === 'health') {
            player.hp = Math.min(player.hp + pickup.value, player.maxHp);
        }
        pickup.destroy();
    }

    levelUp() {
        this.player.level++;
        this.player.maxHp++;
        this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp);
        this.player.damage += 1;
        this.player.xpToLevel = Math.pow(this.player.level + 3, 2);
    }

    createDamageNumber(x, y, value) {
        const text = this.add.text(x, y, value.toString(), {
            fontSize: '14px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        text.setDepth(50);
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

    updateDeathMarkers(dt) {
        this.deathMarkers.getChildren().forEach(marker => {
            marker.life -= dt;
            marker.setAlpha(marker.life / 2.0 * 0.7);
            if (marker.life <= 0) {
                marker.destroy();
            }
        });
    }

    updateUI() {
        // HP
        const hpPercent = this.player.hp / this.player.maxHp;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText(`${this.player.hp} / ${this.player.maxHp}`);

        // XP
        const xpPercent = this.player.xp / this.player.xpToLevel;
        this.xpBar.setScale(xpPercent * 196 / 196, 1);
        this.xpBar.width = xpPercent * 196;
        this.levelText.setText(`LV.${this.player.level}`);

        // Materials
        this.materialsText.setText(this.player.materials.toString());

        // Wave
        this.waveText.setText(`WAVE ${this.wave}`);
        this.timerText.setText(Math.ceil(this.waveDuration - this.waveTimer).toString());
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalWave = data.wave || 1;
        this.finalLevel = data.level || 1;
        this.finalMaterials = data.materials || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.8)');

        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#CC3333'
        }).setOrigin(0.5);

        this.add.text(400, 280, `Reached Wave ${this.finalWave}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 310, `Level ${this.finalLevel}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 340, `Materials: ${this.finalMaterials}`, {
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
            delay: 300,
            callback: () => {
                this.restartText.setColor(this.restartText.style.color === '#33CC33' ? '#88FF88' : '#33CC33');
            },
            loop: true
        });

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.finalLevel = data.level || 1;
        this.finalMaterials = data.materials || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('rgba(0, 50, 0, 0.9)');

        this.add.text(400, 200, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#33CC33'
        }).setOrigin(0.5);

        this.add.text(400, 280, 'You survived all 20 waves!', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Final Level: ${this.finalLevel}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 350, `Materials: ${this.finalMaterials}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.restartText = this.add.text(400, 450, 'Press SPACE to Play Again', {
            fontSize: '20px',
            fontFamily: 'monospace',
            fontStyle: 'bold',
            color: '#FFFF88'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 300,
            callback: () => {
                this.restartText.setColor(this.restartText.style.color === '#33CC33' ? '#FFFF88' : '#33CC33');
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
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);

// Expose for testing
window.gameState = () => {
    const scene = game.scene.getScene('GameScene');
    return {
        state: game.scene.isActive('GameScene') ? 'playing' :
               game.scene.isActive('MenuScene') ? 'title' :
               game.scene.isActive('GameOverScene') ? 'gameover' : 'victory',
        wave: scene ? scene.wave : 0,
        playerHp: scene && scene.player ? scene.player.hp : 0,
        playerLevel: scene && scene.player ? scene.player.level : 0,
        enemies: scene && scene.enemies ? scene.enemies.getLength() : 0,
        materials: scene && scene.player ? scene.player.materials : 0
    };
};
