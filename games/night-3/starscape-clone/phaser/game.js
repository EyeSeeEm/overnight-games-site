// Starscape Clone - Phaser 3
// Space combat mining game

const COLORS = {
    playerShip: 0x4A90D9,
    playerShield: 0x00BFFF,
    aegisHull: 0x708090,
    aegisShield: 0x4169E1,
    archnidBase: 0x8B0000,
    archnidGlow: 0xFF4500,
    blasterCyan: 0x00FFFF,
    greenMineral: 0x32CD32,
    yellowMineral: 0xFFD700,
    purpleMineral: 0x9400D3,
    asteroid: 0x8B7355,
    gravityBeam: 0x00FF88
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Create textures
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player ship
        let gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.playerShip);
        gfx.beginPath();
        gfx.moveTo(20, 10);
        gfx.lineTo(0, 0);
        gfx.lineTo(4, 10);
        gfx.lineTo(0, 20);
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(0x88CCFF);
        gfx.fillCircle(14, 10, 4);
        gfx.fillStyle(0xFF6600);
        gfx.fillEllipse(2, 10, 4, 3);
        gfx.generateTexture('player', 24, 20);
        gfx.destroy();

        // Aegis station
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.aegisHull);
        gfx.fillCircle(50, 50, 50);
        gfx.fillStyle(0x556677);
        gfx.fillCircle(50, 50, 35);
        gfx.fillStyle(0x445566);
        gfx.fillCircle(50, 50, 20);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            gfx.fillStyle(0x88AAFF);
            gfx.fillCircle(50 + Math.cos(angle) * 27, 50 + Math.sin(angle) * 27, 4);
        }
        gfx.generateTexture('aegis', 100, 100);
        gfx.destroy();

        // Enemy types
        // Drone
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.archnidBase);
        gfx.fillCircle(12, 12, 12);
        gfx.fillStyle(COLORS.archnidGlow);
        gfx.fillCircle(16, 12, 4);
        gfx.generateTexture('drone', 24, 24);
        gfx.destroy();

        // Fighter
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.archnidBase);
        gfx.beginPath();
        gfx.moveTo(20, 10);
        gfx.lineTo(0, 2);
        gfx.lineTo(4, 10);
        gfx.lineTo(0, 18);
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(COLORS.archnidGlow);
        gfx.fillCircle(12, 10, 4);
        gfx.generateTexture('fighter', 20, 20);
        gfx.destroy();

        // Heavy
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.archnidBase);
        gfx.beginPath();
        gfx.moveTo(28, 14);
        gfx.lineTo(0, 0);
        gfx.lineTo(0, 28);
        gfx.closePath();
        gfx.fillPath();
        gfx.fillStyle(COLORS.archnidGlow);
        gfx.fillCircle(16, 14, 5);
        gfx.generateTexture('heavy', 28, 28);
        gfx.destroy();

        // Blaster bolt
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.blasterCyan);
        gfx.fillRect(0, 1, 12, 3);
        gfx.generateTexture('blaster', 12, 5);
        gfx.destroy();

        // Enemy bolt
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.archnidGlow);
        gfx.fillRect(0, 1, 10, 3);
        gfx.generateTexture('enemyBolt', 10, 5);
        gfx.destroy();

        // Turret bolt
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFFF00);
        gfx.fillRect(0, 1, 8, 2);
        gfx.generateTexture('turretBolt', 8, 4);
        gfx.destroy();

        // Minerals
        ['green', 'yellow', 'purple'].forEach(color => {
            gfx = this.make.graphics({ add: false });
            gfx.fillStyle(COLORS[color + 'Mineral']);
            gfx.fillCircle(6, 6, 6);
            gfx.generateTexture(color + 'Mineral', 12, 12);
            gfx.destroy();
        });

        // Asteroid sizes
        [20, 35, 50].forEach((size, i) => {
            gfx = this.make.graphics({ add: false });
            gfx.fillStyle(COLORS.asteroid);
            gfx.beginPath();
            const points = 7;
            for (let j = 0; j < points; j++) {
                const angle = (j / points) * Math.PI * 2;
                const r = size * (0.7 + Math.sin(j * 3) * 0.3);
                const x = size + Math.cos(angle) * r;
                const y = size + Math.sin(angle) * r;
                if (j === 0) gfx.moveTo(x, y);
                else gfx.lineTo(x, y);
            }
            gfx.closePath();
            gfx.fillPath();
            gfx.generateTexture('asteroid' + ['Small', 'Medium', 'Large'][i], size * 2, size * 2);
            gfx.destroy();
        });

        // Particle
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFFFFF);
        gfx.fillRect(0, 0, 4, 4);
        gfx.generateTexture('particle', 4, 4);
        gfx.destroy();
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0A0A15');

        // Stars
        for (let i = 0; i < 150; i++) {
            const star = this.add.rectangle(
                Math.random() * 800, Math.random() * 600,
                Math.random() * 2 + 1, Math.random() * 2 + 1,
                0xFFFFFF, Math.random() * 0.5 + 0.5
            );
        }

        // Title
        this.add.text(400, 180, 'STARSCAPE', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#4A90D9',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 230, 'Space Combat Mining', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#88CCFF'
        }).setOrigin(0.5);

        this.add.text(400, 350, 'Press SPACE or Click to Start', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 450, 'WASD - Move  |  Q/Click - Fire  |  E - Gravity Beam  |  R - Dock', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(400, 480, 'Defend the Aegis station! Mine asteroids for resources!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0A0A15');

        // State
        this.score = 0;
        this.wave = 1;
        this.waveTimer = 3;
        this.waveCleared = true;
        this.resources = { green: 50, yellow: 30, purple: 10 };

        // Stars background
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            const star = this.add.rectangle(
                Math.random() * 800, Math.random() * 600,
                Math.random() * 2 + 1, Math.random() * 2 + 1,
                0xFFFFFF, Math.random() * 0.5 + 0.5
            );
            this.stars.push(star);
        }

        // Groups
        this.projectiles = this.add.group();
        this.enemyProjectiles = this.add.group();
        this.enemies = this.add.group();
        this.asteroids = this.add.group();
        this.minerals = this.add.group();
        this.particles = this.add.group();

        // Aegis station
        this.aegis = this.add.sprite(400, 300, 'aegis');
        this.aegis.hp = 500;
        this.aegis.maxHp = 500;
        this.aegis.shield = 200;
        this.aegis.maxShield = 200;
        this.aegis.shieldRecharge = 10;
        this.aegis.turretAngle = 0;
        this.aegis.turretFireTimer = 0;

        // Aegis shield indicator
        this.aegisShield = this.add.circle(400, 300, 58, COLORS.aegisShield, 0.3);
        this.aegisShield.setStrokeStyle(2, COLORS.aegisShield, 0.6);

        // Player
        this.player = this.add.sprite(400, 450, 'player');
        this.player.hp = 75;
        this.player.maxHp = 75;
        this.player.shield = 60;
        this.player.maxShield = 60;
        this.player.shieldRecharge = 5;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.fireTimer = 0;
        this.player.fireRate = 5;
        this.player.damage = 12;

        // Player shield indicator
        this.playerShield = this.add.circle(400, 450, 24, COLORS.playerShield, 0.2);
        this.playerShield.setStrokeStyle(2, COLORS.playerShield, 0.5);

        // Gravity beam circle
        this.gravityBeam = this.add.circle(400, 450, 150, COLORS.gravityBeam, 0.1);
        this.gravityBeam.setStrokeStyle(2, COLORS.gravityBeam, 0.3);
        this.gravityBeam.setVisible(false);

        // Spawn asteroids
        this.spawnAsteroids(8);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fire: Phaser.Input.Keyboard.KeyCodes.Q,
            gravity: Phaser.Input.Keyboard.KeyCodes.E,
            dock: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.arrows = this.input.keyboard.createCursorKeys();

        // Create HUD
        this.createHUD();

        // Expose for testing
        const scene = this;
        window.gameState = {
            get state() { return 'playing'; },
            get score() { return scene.score; },
            get wave() { return scene.wave; },
            get playerHp() { return scene.player.hp; },
            get aegisHp() { return scene.aegis.hp; },
            get resources() { return scene.resources; },
            get enemies() { return scene.enemies.getLength(); },
            get asteroids() { return scene.asteroids.getLength(); },
            get minerals() { return scene.minerals.getLength(); }
        };

        window.startGame = () => {};
    }

    createHUD() {
        // Top bar
        this.add.rectangle(400, 25, 800, 50, 0x000000, 0.7);

        // Shield bar
        this.add.rectangle(70, 14, 120, 12, 0x333333);
        this.shieldBar = this.add.rectangle(70, 14, 120, 12, 0x4444FF);
        this.shieldBar.setOrigin(0.5);
        this.add.text(15, 9, 'SHIELD', { fontSize: '10px', color: '#FFF' });

        // HP bar
        this.add.rectangle(70, 30, 120, 12, 0x333333);
        this.hpBar = this.add.rectangle(70, 30, 120, 12, 0xFF4444);
        this.hpBar.setOrigin(0.5);
        this.add.text(15, 25, 'HULL', { fontSize: '10px', color: '#FFF' });

        // Resources
        this.greenText = this.add.text(150, 15, 'G: 50', { fontSize: '14px', color: '#32CD32' });
        this.yellowText = this.add.text(220, 15, 'Y: 30', { fontSize: '14px', color: '#FFD700' });
        this.purpleText = this.add.text(290, 15, 'P: 10', { fontSize: '14px', color: '#9400D3' });

        // Wave and score
        this.waveText = this.add.text(400, 15, 'Wave 1', { fontSize: '16px', color: '#FFF' }).setOrigin(0.5);
        this.scoreText = this.add.text(400, 35, 'Score: 0', { fontSize: '16px', color: '#FFF' }).setOrigin(0.5);

        // Enemies count
        this.enemiesText = this.add.text(780, 20, '', { fontSize: '14px', color: '#FF8800' }).setOrigin(1, 0.5);

        // Bottom bar
        this.add.rectangle(125, 580, 250, 40, 0x000000, 0.7);
        this.add.text(10, 568, 'AEGIS', { fontSize: '12px', color: '#FFF' });

        // Aegis bars
        this.add.rectangle(100, 563, 80, 10, 0x333333);
        this.aegisShieldBar = this.add.rectangle(100, 563, 80, 10, 0x4444FF);
        this.aegisShieldBar.setOrigin(0.5);

        this.add.rectangle(100, 577, 80, 10, 0x333333);
        this.aegisHpBar = this.add.rectangle(100, 577, 80, 10, 0xFF4444);
        this.aegisHpBar.setOrigin(0.5);

        // Controls
        this.add.text(160, 578, '[WASD] Move  [Q/Click] Fire  [E] Gravity Beam  [R] Dock', {
            fontSize: '11px', color: '#888'
        });

        // Wave warning
        this.waveWarning = this.add.text(400, 200, '', {
            fontSize: '20px', color: '#FFFF00'
        }).setOrigin(0.5);
    }

    spawnAsteroids(count) {
        const sizes = ['Small', 'Medium', 'Large'];
        const hpMap = { Small: 20, Medium: 50, Large: 100 };
        const sizeMap = { Small: 20, Medium: 35, Large: 50 };

        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.random() * 700 + 50;
                y = Math.random() * 500 + 50;
            } while (Phaser.Math.Distance.Between(x, y, 400, 300) < 150);

            const sizeType = sizes[Math.floor(Math.random() * 3)];
            const asteroid = this.add.sprite(x, y, 'asteroid' + sizeType);
            asteroid.hp = hpMap[sizeType];
            asteroid.maxHp = asteroid.hp;
            asteroid.sizeType = sizeType;
            asteroid.size = sizeMap[sizeType];
            asteroid.vx = (Math.random() - 0.5) * 20;
            asteroid.vy = (Math.random() - 0.5) * 20;
            asteroid.rotSpeed = (Math.random() - 0.5) * 0.02;
            this.asteroids.add(asteroid);
        }
    }

    spawnEnemy(type = 'fighter') {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * 800; y = -30; break;
            case 1: x = 830; y = Math.random() * 600; break;
            case 2: x = Math.random() * 800; y = 630; break;
            case 3: x = -30; y = Math.random() * 600; break;
        }

        const types = {
            drone: { hp: 15, damage: 5, speed: 250, fireRate: 2, score: 10 },
            fighter: { hp: 40, damage: 10, speed: 180, fireRate: 2.5, score: 50 },
            heavy: { hp: 80, damage: 15, speed: 120, fireRate: 1.5, score: 100, shieldAmt: 30 }
        };

        const config = types[type] || types.fighter;
        const enemy = this.add.sprite(x, y, type);
        enemy.type = type;
        enemy.hp = config.hp;
        enemy.maxHp = config.hp;
        enemy.damage = config.damage;
        enemy.speed = config.speed;
        enemy.fireRate = config.fireRate;
        enemy.scoreVal = config.score;
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.fireTimer = Math.random() * 2;
        if (config.shieldAmt) {
            enemy.shield = config.shieldAmt;
            enemy.maxShield = config.shieldAmt;
        }
        this.enemies.add(enemy);
    }

    spawnWave() {
        const enemyCount = 3 + this.wave * 2;
        for (let i = 0; i < enemyCount; i++) {
            this.time.delayedCall(i * 500, () => {
                if (this.wave >= 3 && Math.random() < 0.3) {
                    this.spawnEnemy('heavy');
                } else if (Math.random() < 0.4) {
                    this.spawnEnemy('drone');
                } else {
                    this.spawnEnemy('fighter');
                }
            });
        }
        this.waveCleared = false;
    }

    dropMinerals(asteroid) {
        const dropCounts = { Small: [3, 6], Medium: [8, 15], Large: [20, 30] };
        const [min, max] = dropCounts[asteroid.sizeType];
        const count = Phaser.Math.Between(min, max);

        for (let i = 0; i < count; i++) {
            const roll = Math.random();
            let mineralType;
            if (roll < 0.5) mineralType = 'green';
            else if (roll < 0.85) mineralType = 'yellow';
            else mineralType = 'purple';

            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * asteroid.size;
            const mineral = this.add.sprite(
                asteroid.x + Math.cos(angle) * dist,
                asteroid.y + Math.sin(angle) * dist,
                mineralType + 'Mineral'
            );
            mineral.mineralType = mineralType;
            mineral.vx = Math.cos(angle) * 30;
            mineral.vy = Math.sin(angle) * 30;
            mineral.life = 15;
            this.minerals.add(mineral);
        }
    }

    createParticle(x, y, color, count = 5, speed = 100) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const vel = Math.random() * speed + speed * 0.5;
            const particle = this.add.rectangle(
                x, y, 4, 4, color
            );
            particle.vx = Math.cos(angle) * vel;
            particle.vy = Math.sin(angle) * vel;
            particle.life = 1;
            this.particles.add(particle);
        }
    }

    takeDamage(entity, damage) {
        if (entity.shield && entity.shield > 0) {
            const absorbed = Math.min(entity.shield, damage);
            entity.shield -= absorbed;
            damage -= absorbed;
        }
        if (damage > 0) {
            entity.hp -= damage;
        }
        return entity.hp > 0;
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Player movement
        let thrustX = 0, thrustY = 0;
        if (this.cursors.up.isDown || this.arrows.up.isDown) thrustY -= 1;
        if (this.cursors.down.isDown || this.arrows.down.isDown) thrustY += 1;
        if (this.cursors.left.isDown || this.arrows.left.isDown) thrustX -= 1;
        if (this.cursors.right.isDown || this.arrows.right.isDown) thrustX += 1;

        if (thrustX !== 0 || thrustY !== 0) {
            const len = Math.sqrt(thrustX * thrustX + thrustY * thrustY);
            thrustX /= len;
            thrustY /= len;
            this.player.vx += thrustX * 300 * dt;
            this.player.vy += thrustY * 300 * dt;
        }

        // Drag and speed cap
        this.player.vx *= 0.985;
        this.player.vy *= 0.985;
        const speed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2);
        if (speed > 350) {
            this.player.vx = (this.player.vx / speed) * 350;
            this.player.vy = (this.player.vy / speed) * 350;
        }

        this.player.x += this.player.vx * dt;
        this.player.y += this.player.vy * dt;

        // Wrap screen
        if (this.player.x < 0) this.player.x = 800;
        if (this.player.x > 800) this.player.x = 0;
        if (this.player.y < 0) this.player.y = 600;
        if (this.player.y > 600) this.player.y = 0;

        // Rotate towards mouse
        const targetAngle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            this.input.activePointer.worldX, this.input.activePointer.worldY
        );
        this.player.rotation = Phaser.Math.Angle.RotateTo(
            this.player.rotation, targetAngle, 4 * dt
        );

        // Shield recharge
        if (this.player.shield < this.player.maxShield) {
            this.player.shield = Math.min(this.player.maxShield, this.player.shield + this.player.shieldRecharge * dt);
        }

        // Update player shield visual
        this.playerShield.x = this.player.x;
        this.playerShield.y = this.player.y;
        this.playerShield.setAlpha(0.2 + (this.player.shield / this.player.maxShield) * 0.3);

        // Fire weapon
        this.player.fireTimer -= dt;
        if ((this.cursors.fire.isDown || this.input.activePointer.isDown) && this.player.fireTimer <= 0) {
            this.player.fireTimer = 1 / this.player.fireRate;
            const bolt = this.add.sprite(
                this.player.x + Math.cos(this.player.rotation) * 20,
                this.player.y + Math.sin(this.player.rotation) * 20,
                'blaster'
            );
            bolt.rotation = this.player.rotation;
            bolt.vx = Math.cos(this.player.rotation) * 600 + this.player.vx * 0.5;
            bolt.vy = Math.sin(this.player.rotation) * 600 + this.player.vy * 0.5;
            bolt.damage = this.player.damage;
            bolt.life = 2;
            this.projectiles.add(bolt);
        }

        // Gravity beam
        const gravityActive = this.cursors.gravity.isDown;
        this.gravityBeam.setVisible(gravityActive);
        this.gravityBeam.x = this.player.x;
        this.gravityBeam.y = this.player.y;

        if (gravityActive) {
            this.minerals.getChildren().forEach(m => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
                if (dist < 150) {
                    const angle = Phaser.Math.Angle.Between(m.x, m.y, this.player.x, this.player.y);
                    m.vx += Math.cos(angle) * 200 * dt;
                    m.vy += Math.sin(angle) * 200 * dt;
                }
            });
        }

        // Collect minerals
        this.minerals.getChildren().forEach(m => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
            if (dist < 25) {
                this.resources[m.mineralType]++;
                this.score += m.mineralType === 'purple' ? 30 : (m.mineralType === 'yellow' ? 20 : 10);
                this.createParticle(m.x, m.y, COLORS[m.mineralType + 'Mineral'], 3, 30);
                m.destroy();
            }
        });

        // Dock with Aegis
        if (this.cursors.dock.isDown && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.aegis.x, this.aegis.y) < 80) {
            const repairNeeded = this.player.maxHp - this.player.hp;
            const repairCost = Math.ceil(repairNeeded * 0.2);
            if (repairCost > 0 && this.resources.green >= repairCost) {
                this.resources.green -= repairCost;
                this.player.hp = this.player.maxHp;
            }
        }

        // Update Aegis
        if (this.aegis.shield < this.aegis.maxShield) {
            this.aegis.shield = Math.min(this.aegis.maxShield, this.aegis.shield + this.aegis.shieldRecharge * dt);
        }
        this.aegisShield.setAlpha(0.1 + (this.aegis.shield / this.aegis.maxShield) * 0.3);

        // Aegis turret
        this.aegis.turretFireTimer -= dt;
        const enemyChildren = this.enemies.getChildren();
        if (enemyChildren.length > 0 && this.aegis.turretFireTimer <= 0) {
            let closest = null;
            let closestDist = Infinity;
            enemyChildren.forEach(e => {
                const d = Phaser.Math.Distance.Between(this.aegis.x, this.aegis.y, e.x, e.y);
                if (d < closestDist && d < 350) {
                    closestDist = d;
                    closest = e;
                }
            });

            if (closest) {
                this.aegis.turretFireTimer = 0.4;
                const angle = Phaser.Math.Angle.Between(this.aegis.x, this.aegis.y, closest.x, closest.y);
                const bolt = this.add.sprite(
                    this.aegis.x + Math.cos(angle) * 55,
                    this.aegis.y + Math.sin(angle) * 55,
                    'turretBolt'
                );
                bolt.rotation = angle;
                bolt.vx = Math.cos(angle) * 450;
                bolt.vy = Math.sin(angle) * 450;
                bolt.damage = 8;
                bolt.life = 1.5;
                this.projectiles.add(bolt);
            }
        }

        // Update projectiles
        this.projectiles.getChildren().forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0 || p.x < -50 || p.x > 850 || p.y < -50 || p.y > 650) {
                p.destroy();
                return;
            }

            // Hit enemies
            enemyChildren.forEach(e => {
                if (e.active && Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 20) {
                    if (!this.takeDamage(e, p.damage)) {
                        this.score += e.scoreVal;
                        this.createParticle(e.x, e.y, COLORS.archnidGlow, 15, 150);

                        // Drop resources
                        if (Math.random() < 0.5) {
                            const roll = Math.random();
                            const type = roll < 0.5 ? 'green' : (roll < 0.85 ? 'yellow' : 'purple');
                            const mineral = this.add.sprite(e.x, e.y, type + 'Mineral');
                            mineral.mineralType = type;
                            mineral.vx = (Math.random() - 0.5) * 50;
                            mineral.vy = (Math.random() - 0.5) * 50;
                            mineral.life = 15;
                            this.minerals.add(mineral);
                        }

                        e.destroy();
                    } else {
                        this.createParticle(p.x, p.y, 0xFF8800, 3, 50);
                    }
                    p.destroy();
                }
            });

            // Hit asteroids
            this.asteroids.getChildren().forEach(a => {
                if (a.active && Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) < a.size) {
                    a.hp -= p.damage;
                    this.createParticle(p.x, p.y, COLORS.asteroid, 3, 30);

                    if (a.hp <= 0) {
                        this.dropMinerals(a);
                        this.createParticle(a.x, a.y, COLORS.asteroid, 10, 100);
                        a.destroy();
                    }
                    p.destroy();
                }
            });
        });

        // Update enemies
        enemyChildren.forEach(e => {
            const playerDist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
            const aegisDist = Phaser.Math.Distance.Between(e.x, e.y, this.aegis.x, this.aegis.y);

            let target, targetDist;
            if (playerDist > 400 && aegisDist < 300) {
                target = this.aegis;
                targetDist = aegisDist;
            } else {
                target = this.player;
                targetDist = playerDist;
            }

            const targetAngle = Phaser.Math.Angle.Between(e.x, e.y, target.x, target.y);
            let angleDiff = targetAngle - e.rotation;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            e.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 3 * dt);

            if (e.type === 'heavy' && targetDist < 200) {
                e.vx += Math.cos(e.rotation + Math.PI / 2) * e.speed * 0.5 * dt;
                e.vy += Math.sin(e.rotation + Math.PI / 2) * e.speed * 0.5 * dt;
            } else if (targetDist > 80) {
                e.vx += Math.cos(e.rotation) * e.speed * dt;
                e.vy += Math.sin(e.rotation) * e.speed * dt;
            }

            e.vx *= 0.98;
            e.vy *= 0.98;
            const eSpeed = Math.sqrt(e.vx ** 2 + e.vy ** 2);
            if (eSpeed > e.speed) {
                e.vx = (e.vx / eSpeed) * e.speed;
                e.vy = (e.vy / eSpeed) * e.speed;
            }

            e.x += e.vx * dt;
            e.y += e.vy * dt;

            // Fire
            e.fireTimer -= dt;
            if (e.fireTimer <= 0 && targetDist < 350) {
                e.fireTimer = 1 / e.fireRate;
                const shootAngle = Phaser.Math.Angle.Between(e.x, e.y, target.x, target.y);
                const bolt = this.add.sprite(
                    e.x + Math.cos(shootAngle) * 15,
                    e.y + Math.sin(shootAngle) * 15,
                    'enemyBolt'
                );
                bolt.rotation = shootAngle;
                bolt.vx = Math.cos(shootAngle) * 350;
                bolt.vy = Math.sin(shootAngle) * 350;
                bolt.damage = e.damage;
                bolt.life = 2;
                this.enemyProjectiles.add(bolt);
            }

            // Shield recharge for heavy
            if (e.shield !== undefined && e.shield < e.maxShield) {
                e.shield = Math.min(e.maxShield, e.shield + 3 * dt);
            }
        });

        // Update enemy projectiles
        this.enemyProjectiles.getChildren().forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0 || p.x < -50 || p.x > 850 || p.y < -50 || p.y > 650) {
                p.destroy();
                return;
            }

            // Hit player
            if (Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y) < 18) {
                this.takeDamage(this.player, p.damage);
                this.createParticle(p.x, p.y, COLORS.playerShield, 5, 50);
                p.destroy();
                return;
            }

            // Hit Aegis
            if (Phaser.Math.Distance.Between(p.x, p.y, this.aegis.x, this.aegis.y) < 50) {
                this.takeDamage(this.aegis, p.damage);
                this.createParticle(p.x, p.y, COLORS.aegisShield, 5, 50);
                p.destroy();
            }
        });

        // Update asteroids
        this.asteroids.getChildren().forEach(a => {
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            a.rotation += a.rotSpeed;

            if (a.x < a.size || a.x > 800 - a.size) a.vx *= -1;
            if (a.y < a.size || a.y > 600 - a.size) a.vy *= -1;
            a.x = Phaser.Math.Clamp(a.x, a.size, 800 - a.size);
            a.y = Phaser.Math.Clamp(a.y, a.size, 600 - a.size);
        });

        // Update minerals
        this.minerals.getChildren().forEach(m => {
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            m.vx *= 0.95;
            m.vy *= 0.95;
            m.life -= dt;

            if (m.x < 10 || m.x > 790) m.vx *= -1;
            if (m.y < 10 || m.y > 590) m.vy *= -1;

            if (m.life <= 0) m.destroy();
        });

        // Update particles
        this.particles.getChildren().forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life -= 0.02;
            p.setAlpha(p.life);
            if (p.life <= 0) p.destroy();
        });

        // Wave management
        if (this.waveCleared) {
            this.waveTimer -= dt;
            this.waveWarning.setText(`Next wave in ${Math.ceil(this.waveTimer)}...`);
            if (this.waveTimer <= 0) {
                this.spawnWave();
                this.waveWarning.setText('');
            }
        } else {
            this.waveWarning.setText('');
            if (this.enemies.getLength() === 0) {
                this.waveCleared = true;
                this.wave++;
                this.waveTimer = 5;

                if (this.asteroids.getLength() < 5) {
                    this.spawnAsteroids(3);
                }
            }
        }

        // Check game over
        if (this.player.hp <= 0 || this.aegis.hp <= 0) {
            this.scene.start('GameOverScene', { score: this.score, wave: this.wave });
        }

        // Update HUD
        this.shieldBar.scaleX = this.player.shield / this.player.maxShield;
        this.hpBar.scaleX = this.player.hp / this.player.maxHp;
        this.greenText.setText(`G: ${this.resources.green}`);
        this.yellowText.setText(`Y: ${this.resources.yellow}`);
        this.purpleText.setText(`P: ${this.resources.purple}`);
        this.waveText.setText(`Wave ${this.wave}`);
        this.scoreText.setText(`Score: ${this.score}`);
        this.enemiesText.setText(this.waveCleared ? '' : `Enemies: ${this.enemies.getLength()}`);
        this.aegisShieldBar.scaleX = this.aegis.shield / this.aegis.maxShield;
        this.aegisHpBar.scaleX = this.aegis.hp / this.aegis.maxHp;
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalWave = data.wave || 1;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0A0A15');

        // Stars
        for (let i = 0; i < 150; i++) {
            this.add.rectangle(
                Math.random() * 800, Math.random() * 600,
                Math.random() * 2 + 1, Math.random() * 2 + 1,
                0xFFFFFF, Math.random() * 0.5 + 0.5
            );
        }

        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);

        this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#FF4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Final Score: ${this.finalScore}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 360, `Waves Survived: ${this.finalWave}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 450, 'Press SPACE to Restart', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

// Game config
const config = {
    type: Phaser.CANVAS, // Use CANVAS for headless testing
    width: 1280,
    height: 720,
    parent: document.body,
    backgroundColor: '#0A0A15',
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
