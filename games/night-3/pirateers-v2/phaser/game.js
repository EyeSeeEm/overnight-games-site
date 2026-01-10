// PIRATEERS - Naval Combat Clone
// Phaser 3 Implementation

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const UI_WIDTH = 100;
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

const COLORS = {
    OCEAN: 0x3080c0,
    OCEAN_DARK: 0x2060a0,
    PLAYER_HULL: 0x8a5030,
    PLAYER_DECK: 0xc08050,
    ENEMY_HULL: 0x505050,
    ENEMY_DECK: 0x707070,
    GOLD: 0xffd700,
    UI_BG: 0x5a3020
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }

    create() {
        this.createTextures();
        this.scene.start('Game');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Player ship
        g.fillStyle(COLORS.PLAYER_HULL);
        g.beginPath();
        g.moveTo(30, 15);
        g.lineTo(6, 5);
        g.lineTo(0, 15);
        g.lineTo(6, 25);
        g.closePath();
        g.fillPath();
        g.fillStyle(COLORS.PLAYER_DECK);
        g.fillRect(9, 10, 18, 10);
        g.fillStyle(0xe0d8c8);
        g.fillTriangle(12, 5, 24, 15, 12, 25);
        g.generateTexture('playerShip', 60, 30);

        // Enemy ship
        g.clear();
        g.fillStyle(COLORS.ENEMY_HULL);
        g.beginPath();
        g.moveTo(25, 12);
        g.lineTo(5, 4);
        g.lineTo(0, 12);
        g.lineTo(5, 20);
        g.closePath();
        g.fillPath();
        g.fillStyle(COLORS.ENEMY_DECK);
        g.fillRect(7, 8, 14, 8);
        g.fillStyle(0xd0c8b8);
        g.fillTriangle(10, 4, 20, 12, 10, 20);
        g.generateTexture('enemyShip', 50, 24);

        // Cannonball
        g.clear();
        g.fillStyle(0x303030);
        g.fillCircle(5, 5, 5);
        g.generateTexture('cannonball', 10, 10);

        // Gold coin
        g.clear();
        g.fillStyle(COLORS.GOLD);
        g.fillCircle(10, 10, 10);
        g.lineStyle(2, 0xffa000);
        g.strokeCircle(10, 10, 10);
        g.generateTexture('gold', 20, 20);

        // Ocean tile
        g.clear();
        g.fillStyle(COLORS.OCEAN);
        g.fillRect(0, 0, 150, 150);
        g.lineStyle(2, COLORS.OCEAN_DARK);
        g.arc(75, 75, 50, 0, Math.PI * 1.5);
        g.strokePath();
        g.generateTexture('oceanTile', 150, 150);

        g.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    create() {
        this.gameData = {
            day: 1,
            dayTimer: 180,
            gold: 100,
            messages: []
        };

        this.playerData = {
            armor: 100,
            maxArmor: 100,
            maxSpeed: 150,
            speedLevel: 0,
            firepower: 10,
            reloadTime: 2000,
            lastFire: 0
        };

        // Stats tracking
        this.stats = {
            shipsSunk: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            critCount: 0,
            lootCollected: 0,
            cannonsFired: 0,
            maxKillStreak: 0,
            goldEarned: 0
        };

        // Kill streak system
        this.killStreak = 0;
        this.killStreakTimer = 0;

        // Visual effects
        this.damageFlashAlpha = 0;
        this.lowHealthPulse = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.floatingTexts = [];

        // Debug mode
        this.debugMode = false;

        // Game start time
        this.gameStartTime = Date.now();

        // Game over flag
        this.gameOver = false;

        // Create ocean background
        for (let y = 0; y < WORLD_HEIGHT; y += 150) {
            for (let x = 0; x < WORLD_WIDTH; x += 150) {
                this.add.image(x + 75, y + 75, 'oceanTile');
            }
        }

        // Groups
        this.enemies = [];
        this.cannonballs = [];
        this.loot = [];

        // Create player
        this.player = this.add.sprite(600, 400, 'playerShip');
        this.player.setDepth(10);
        this.playerSpeed = 0;

        // Spawn enemies
        this.spawnEnemies();

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setDeadzone(200, 150);

        // UI layer (fixed)
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            fire: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.input.keyboard.on('keydown-SPACE', () => this.fireCanons());
        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            if (this.debugText) this.debugText.setVisible(this.debugMode);
        });

        this.addMessage("Day " + this.gameData.day + " - Set sail!");
    }

    spawnEnemies() {
        const count = 4 + this.gameData.day;

        for (let i = 0; i < count; i++) {
            const x = 200 + Math.random() * (WORLD_WIDTH - 400);
            const y = 200 + Math.random() * (WORLD_HEIGHT - 400);

            const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
            if (dist < 300) continue;

            const enemy = this.add.sprite(x, y, 'enemyShip');
            enemy.setDepth(8);
            enemy.rotation = Math.random() * Math.PI * 2;

            enemy.enemyData = {
                hp: 50 + Math.random() * 50,
                maxHp: 100,
                speed: 60 + Math.random() * 60,
                damage: 10,
                gold: 25 + Math.floor(Math.random() * 25),
                state: 'patrol',
                targetAngle: Math.random() * Math.PI * 2,
                lastFire: 0,
                reloadTime: 2500
            };

            this.enemies.push(enemy);
        }
    }

    createUI() {
        // Left panel
        this.uiPanel = this.add.rectangle(50, GAME_HEIGHT / 2, UI_WIDTH, GAME_HEIGHT, COLORS.UI_BG);
        this.uiPanel.setScrollFactor(0).setDepth(100);

        this.uiBorder = this.add.rectangle(UI_WIDTH - 2, GAME_HEIGHT / 2, 4, GAME_HEIGHT, 0x3a2010);
        this.uiBorder.setScrollFactor(0).setDepth(100);

        // Day text
        this.dayText = this.add.text(10, 20, 'Day 1', { fontSize: '16px', fontFamily: 'monospace', color: '#ffffff' });
        this.dayText.setScrollFactor(0).setDepth(101);

        // Gold text
        this.goldText = this.add.text(10, 45, '$100', { fontSize: '16px', fontFamily: 'monospace', color: '#ffd700' });
        this.goldText.setScrollFactor(0).setDepth(101);

        // Armor label
        this.armorLabel = this.add.text(10, 75, 'ARMOR', { fontSize: '12px', fontFamily: 'monospace', color: '#ffffff' });
        this.armorLabel.setScrollFactor(0).setDepth(101);

        this.armorBarBg = this.add.rectangle(50, 95, 80, 12, 0x400000);
        this.armorBarBg.setScrollFactor(0).setDepth(101);
        this.armorBar = this.add.rectangle(50, 95, 80, 12, 0xcc4040);
        this.armorBar.setScrollFactor(0).setDepth(101);

        // Speed text
        this.speedLabel = this.add.text(10, 115, 'SPEED', { fontSize: '12px', fontFamily: 'monospace', color: '#ffffff' });
        this.speedLabel.setScrollFactor(0).setDepth(101);
        this.speedText = this.add.text(10, 130, 'STOP', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.speedText.setScrollFactor(0).setDepth(101);

        // Time text
        this.timeLabel = this.add.text(10, 160, 'TIME', { fontSize: '12px', fontFamily: 'monospace', color: '#ffffff' });
        this.timeLabel.setScrollFactor(0).setDepth(101);
        this.timeText = this.add.text(10, 175, '3:00', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.timeText.setScrollFactor(0).setDepth(101);

        // Controls
        this.add.text(10, GAME_HEIGHT - 70, 'A/D Turn', { fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa' }).setScrollFactor(0).setDepth(101);
        this.add.text(10, GAME_HEIGHT - 55, 'W/S Speed', { fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa' }).setScrollFactor(0).setDepth(101);
        this.add.text(10, GAME_HEIGHT - 40, 'SPACE Fire', { fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa' }).setScrollFactor(0).setDepth(101);

        // Top bar
        this.topBar = this.add.rectangle(GAME_WIDTH / 2, 20, GAME_WIDTH - UI_WIDTH, 40, 0x5a3020, 0.9);
        this.topBar.setScrollFactor(0).setDepth(100);
        this.topBar.x = UI_WIDTH + (GAME_WIDTH - UI_WIDTH) / 2;

        this.questText = this.add.text(UI_WIDTH + 10, 12, 'Quests: Z-Bounty Hunt  X-Merchant Raid  C-Pirate Hunt', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.questText.setScrollFactor(0).setDepth(101);

        this.shipsText = this.add.text(GAME_WIDTH - 100, 12, 'Ships: 0', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.shipsText.setScrollFactor(0).setDepth(101);

        // Messages
        this.messagesText = this.add.text(UI_WIDTH + 10, GAME_HEIGHT - 60, '', { fontSize: '12px', fontFamily: 'monospace', color: '#60c860' });
        this.messagesText.setScrollFactor(0).setDepth(101);

        // Damage overlay
        this.damageOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0);
        this.damageOverlay.setScrollFactor(0).setDepth(150);

        // Low health overlay
        this.lowHealthOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x880000, 0);
        this.lowHealthOverlay.setScrollFactor(0).setDepth(149);

        // Kill streak text
        this.killStreakText = this.add.text(GAME_WIDTH - 150, 60, '', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff00ff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.killStreakText.setScrollFactor(0).setDepth(101);
        this.killStreakText.setVisible(false);

        // Debug text
        this.debugText = this.add.text(UI_WIDTH + 10, 50, '', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#000000aa',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setScrollFactor(0).setDepth(200);
        this.debugText.setVisible(false);
    }

    addMessage(text) {
        this.gameData.messages.unshift({ text, time: this.gameData.dayTimer });
        if (this.gameData.messages.length > 4) this.gameData.messages.pop();
    }

    update(time, delta) {
        if (this.gameOver) return;

        const dt = delta / 1000;

        // Day timer
        this.gameData.dayTimer -= dt;
        if (this.gameData.dayTimer <= 0) {
            this.endDay();
            return;
        }

        this.updatePlayer(dt, time);
        this.updateEnemies(dt, time);
        this.updateCannonballs(dt);
        this.updateLoot(dt);
        this.updateVisualEffects(dt);
        this.updateFloatingTexts(dt);
        this.updateKillStreak(dt);
        this.updateDebugOverlay();
        this.updateUI();

        // Check death
        if (this.playerData.armor <= 0) {
            this.showDestroyedScreen();
        }
    }

    updatePlayer(dt, time) {
        // Turning
        if (this.cursors.left.isDown) {
            this.player.rotation -= 1.5 * dt;
        }
        if (this.cursors.right.isDown) {
            this.player.rotation += 1.5 * dt;
        }

        // Speed
        if (this.cursors.up.isDown) {
            this.playerData.speedLevel = Math.min(3, this.playerData.speedLevel + 2 * dt);
        }
        if (this.cursors.down.isDown) {
            this.playerData.speedLevel = Math.max(0, this.playerData.speedLevel - 2 * dt);
        }

        const speedMults = [0, 0.25, 0.5, 1.0];
        const targetSpeed = this.playerData.maxSpeed * speedMults[Math.floor(this.playerData.speedLevel)];
        this.playerSpeed += (targetSpeed - this.playerSpeed) * 2 * dt;

        // Move
        this.player.x += Math.cos(this.player.rotation) * this.playerSpeed * dt;
        this.player.y += Math.sin(this.player.rotation) * this.playerSpeed * dt;

        // Bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 50, WORLD_WIDTH - 50);
        this.player.y = Phaser.Math.Clamp(this.player.y, 50, WORLD_HEIGHT - 50);

        // Collect loot
        for (let i = this.loot.length - 1; i >= 0; i--) {
            const l = this.loot[i];
            if (!l.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, l.x, l.y);
            if (dist < 50) {
                this.gameData.gold += l.value;
                this.stats.lootCollected++;
                this.stats.goldEarned += l.value;
                this.addMessage("+" + l.value + " gold!");

                // Floating gold text
                this.createFloatingText(l.x, l.y - 15, '+' + l.value, '#ffd700', 20);

                // Gold sparkle particles
                this.createGoldSparkle(l.x, l.y);

                l.destroy();
                this.loot.splice(i, 1);
            }
        }
    }

    fireCanons() {
        const now = this.time.now;
        if (now - this.playerData.lastFire < this.playerData.reloadTime) return;
        this.playerData.lastFire = now;

        const angles = [-Math.PI/2, Math.PI/2];

        for (const sideAngle of angles) {
            const fireAngle = this.player.rotation + sideAngle;

            for (let i = 0; i < 3; i++) {
                const spread = (i - 1) * 0.15;
                const ballAngle = fireAngle + spread;

                const ball = this.add.sprite(
                    this.player.x + Math.cos(fireAngle) * 20,
                    this.player.y + Math.sin(fireAngle) * 20,
                    'cannonball'
                );
                ball.setDepth(5);
                ball.ballData = {
                    vx: Math.cos(ballAngle) * 400,
                    vy: Math.sin(ballAngle) * 400,
                    damage: this.playerData.firepower,
                    life: 0.75,
                    owner: 'player'
                };
                this.cannonballs.push(ball);
                this.stats.cannonsFired++;

                // Muzzle flash particle
                this.createMuzzleFlash(
                    this.player.x + Math.cos(fireAngle) * 25,
                    this.player.y + Math.sin(fireAngle) * 25
                );
            }
        }

        // Screen shake for firing
        this.triggerScreenShake(3);
    }

    updateEnemies(dt, time) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const data = enemy.enemyData;

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (distToPlayer < 400) {
                data.state = 'attack';
                data.targetAngle = angleToPlayer + Math.PI / 2;
            } else {
                data.state = 'patrol';
                if (Math.random() < 0.01) {
                    data.targetAngle = Math.random() * Math.PI * 2;
                }
            }

            const angleDiff = Phaser.Math.Angle.Wrap(data.targetAngle - enemy.rotation);
            enemy.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.2 * dt);

            enemy.x += Math.cos(enemy.rotation) * data.speed * dt;
            enemy.y += Math.sin(enemy.rotation) * data.speed * dt;

            enemy.x = Phaser.Math.Clamp(enemy.x, 50, WORLD_WIDTH - 50);
            enemy.y = Phaser.Math.Clamp(enemy.y, 50, WORLD_HEIGHT - 50);

            // Fire
            if (data.state === 'attack' && distToPlayer < 350) {
                if (time - data.lastFire > data.reloadTime) {
                    data.lastFire = time;

                    const ball = this.add.sprite(enemy.x, enemy.y, 'cannonball');
                    ball.setDepth(5);
                    ball.ballData = {
                        vx: Math.cos(angleToPlayer) * 350,
                        vy: Math.sin(angleToPlayer) * 350,
                        damage: data.damage,
                        life: 0.8,
                        owner: 'enemy'
                    };
                    this.cannonballs.push(ball);
                }
            }
        }
    }

    updateCannonballs(dt) {
        for (let i = this.cannonballs.length - 1; i >= 0; i--) {
            const ball = this.cannonballs[i];
            if (!ball.active) continue;
            const data = ball.ballData;

            ball.x += data.vx * dt;
            ball.y += data.vy * dt;
            data.life -= dt;

            if (data.life <= 0) {
                ball.destroy();
                this.cannonballs.splice(i, 1);
                continue;
            }

            if (data.owner === 'player') {
                for (const enemy of this.enemies) {
                    if (!enemy.active) continue;
                    const dist = Phaser.Math.Distance.Between(ball.x, ball.y, enemy.x, enemy.y);
                    if (dist < 30) {
                        this.damageEnemy(enemy, data.damage);
                        ball.destroy();
                        this.cannonballs.splice(i, 1);
                        break;
                    }
                }
            } else {
                const dist = Phaser.Math.Distance.Between(ball.x, ball.y, this.player.x, this.player.y);
                if (dist < 30) {
                    this.damagePlayer(data.damage);
                    ball.destroy();
                    this.cannonballs.splice(i, 1);
                }
            }
        }
    }

    damageEnemy(enemy, damage) {
        const data = enemy.enemyData;

        // Critical hit check
        const isCrit = Math.random() < 0.15;
        const finalDamage = isCrit ? damage * 2 : damage;

        data.hp -= finalDamage;
        this.stats.totalDamageDealt += finalDamage;
        if (isCrit) this.stats.critCount++;

        // Floating damage number
        const color = isCrit ? '#ffff00' : '#ff8800';
        const text = isCrit ? finalDamage + '!' : '' + finalDamage;
        this.createFloatingText(enemy.x, enemy.y - 20, text, color, isCrit ? 24 : 18);

        // Hit particles
        this.createHitParticles(enemy.x, enemy.y, isCrit ? 8 : 4);

        // Screen shake on hit
        this.triggerScreenShake(isCrit ? 6 : 3);

        if (data.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        const data = enemy.enemyData;

        // Stats
        this.stats.shipsSunk++;

        // Kill streak
        this.killStreak++;
        this.killStreakTimer = 3;
        if (this.killStreak > this.stats.maxKillStreak) {
            this.stats.maxKillStreak = this.killStreak;
        }

        // Kill streak messages
        if (this.killStreak >= 2) {
            const streakMessages = ['', '', 'DOUBLE SINK!', 'TRIPLE SINK!', 'QUAD SINK!', 'RAMPAGE!'];
            const msg = this.killStreak >= 5 ? 'RAMPAGE!' : streakMessages[this.killStreak];
            this.createFloatingText(enemy.x, enemy.y - 40, msg, '#ff00ff', 22);
        }

        // Drop loot
        const coin = this.add.sprite(enemy.x, enemy.y, 'gold');
        coin.setDepth(5);
        coin.value = data.gold;
        coin.life = 15;
        this.loot.push(coin);

        // Death burst effect
        this.createDeathBurst(enemy.x, enemy.y);

        // Extra screen shake on kill
        this.triggerScreenShake(8);

        enemy.setActive(false).setVisible(false);
        this.addMessage("Enemy sunk!");
    }

    updateLoot(dt) {
        for (let i = this.loot.length - 1; i >= 0; i--) {
            const l = this.loot[i];
            if (!l.active) continue;
            l.life -= dt;
            if (l.life <= 0) {
                l.destroy();
                this.loot.splice(i, 1);
            }
        }
    }

    updateUI() {
        this.dayText.setText('Day ' + this.gameData.day);
        this.goldText.setText('$' + this.gameData.gold);

        this.armorBar.setScale(this.playerData.armor / this.playerData.maxArmor, 1);

        const speedNames = ['STOP', 'SLOW', 'HALF', 'FULL'];
        this.speedText.setText(speedNames[Math.floor(this.playerData.speedLevel)]);

        const mins = Math.floor(this.gameData.dayTimer / 60);
        const secs = Math.floor(this.gameData.dayTimer % 60);
        this.timeText.setText(mins + ':' + secs.toString().padStart(2, '0'));

        const aliveEnemies = this.enemies.filter(e => e.active).length;
        this.shipsText.setText('Ships: ' + aliveEnemies);

        let msgStr = '';
        for (let i = 0; i < this.gameData.messages.length; i++) {
            msgStr += this.gameData.messages[i].text + '\n';
        }
        this.messagesText.setText(msgStr);
    }

    endDay() {
        this.gameData.day++;
        this.gameData.dayTimer = 180;
        this.playerData.armor = this.playerData.maxArmor;
        this.player.x = 600;
        this.player.y = 400;

        // Clear old enemies
        for (const e of this.enemies) {
            if (e.active) e.destroy();
        }
        this.enemies = [];

        // Clear cannonballs
        for (const b of this.cannonballs) {
            if (b.active) b.destroy();
        }
        this.cannonballs = [];

        this.spawnEnemies();
        this.addMessage("Day " + this.gameData.day + " begins!");
    }

    // === Helper Methods ===

    damagePlayer(damage) {
        this.playerData.armor -= damage;
        this.stats.totalDamageTaken += damage;

        // Floating damage text
        this.createFloatingText(this.player.x, this.player.y - 30, '-' + damage, '#ff4444', 18);

        // Damage flash
        this.damageFlashAlpha = 0.4;

        // Screen shake
        this.triggerScreenShake(5);

        this.addMessage("Hit! -" + damage + " armor");
    }

    createFloatingText(x, y, text, color, size = 16) {
        const ft = this.add.text(x, y, text, {
            fontSize: size + 'px',
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        });
        ft.setOrigin(0.5);
        ft.setDepth(200);
        ft.life = 1.0;
        ft.vy = -50;
        this.floatingTexts.push(ft);
    }

    triggerScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }

    updateVisualEffects(dt) {
        // Damage flash decay
        if (this.damageFlashAlpha > 0) {
            this.damageFlashAlpha -= dt * 2;
            if (this.damageFlashAlpha < 0) this.damageFlashAlpha = 0;
        }
        if (this.damageOverlay) {
            this.damageOverlay.setAlpha(this.damageFlashAlpha);
        }

        // Low health pulse
        const armorPercent = this.playerData.armor / this.playerData.maxArmor;
        if (armorPercent < 0.3) {
            this.lowHealthPulse += dt * 4;
            const pulseAlpha = (Math.sin(this.lowHealthPulse) * 0.5 + 0.5) * 0.3;
            if (this.lowHealthOverlay) {
                this.lowHealthOverlay.setAlpha(pulseAlpha);
            }
        } else {
            if (this.lowHealthOverlay) {
                this.lowHealthOverlay.setAlpha(0);
            }
        }

        // Screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.intensity -= dt * 30;
            if (this.screenShake.intensity < 0) this.screenShake.intensity = 0;
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + this.screenShake.x,
                this.cameras.main.scrollY + this.screenShake.y
            );
        }
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.setAlpha(ft.life);
            if (ft.life <= 0) {
                ft.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    updateKillStreak(dt) {
        if (this.killStreakTimer > 0) {
            this.killStreakTimer -= dt;
            if (this.killStreakTimer <= 0) {
                this.killStreak = 0;
            }
        }

        // Update kill streak display
        if (this.killStreakText) {
            if (this.killStreak >= 2) {
                this.killStreakText.setText(this.killStreak + 'x STREAK');
                this.killStreakText.setVisible(true);
            } else {
                this.killStreakText.setVisible(false);
            }
        }
    }

    createHitParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const particle = this.add.circle(x, y, 3, 0xff6600);
            particle.setDepth(50);

            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
    }

    createDeathBurst(x, y) {
        // Ring effect
        const ring = this.add.circle(x, y, 10, 0xff4400, 0);
        ring.setStrokeStyle(4, 0xff8800);
        ring.setDepth(45);

        this.tweens.add({
            targets: ring,
            scale: 4,
            alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });

        // Explosion particles
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(x, y, 4 + Math.random() * 3, 0xff6600);
            particle.setDepth(50);

            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;

            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: 600,
                onComplete: () => particle.destroy()
            });
        }
    }

    createMuzzleFlash(x, y) {
        const flash = this.add.circle(x, y, 8, 0xffff88);
        flash.setDepth(50);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    createGoldSparkle(x, y) {
        for (let i = 0; i < 8; i++) {
            const sparkle = this.add.circle(x, y, 3, 0xffd700);
            sparkle.setDepth(50);

            const angle = (i / 8) * Math.PI * 2;
            const speed = 40 + Math.random() * 30;

            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.5,
                duration: 400,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    updateDebugOverlay() {
        if (!this.debugText || !this.debugMode) return;

        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;

        const debugInfo = [
            '=== DEBUG ===',
            'Day: ' + this.gameData.day,
            'Armor: ' + this.playerData.armor + '/' + this.playerData.maxArmor,
            'Gold: ' + this.gameData.gold,
            'Time: ' + mins + ':' + secs.toString().padStart(2, '0'),
            '',
            '=== STATS ===',
            'Ships Sunk: ' + this.stats.shipsSunk,
            'Damage Dealt: ' + this.stats.totalDamageDealt,
            'Damage Taken: ' + this.stats.totalDamageTaken,
            'Crits: ' + this.stats.critCount,
            'Loot: ' + this.stats.lootCollected,
            'Cannons Fired: ' + this.stats.cannonsFired,
            'Gold Earned: ' + this.stats.goldEarned,
            '',
            '=== STREAK ===',
            'Current: ' + this.killStreak,
            'Max: ' + this.stats.maxKillStreak
        ];

        this.debugText.setText(debugInfo.join('\n'));
    }

    showDestroyedScreen() {
        this.gameOver = true;

        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;

        // Performance rating
        let rating = 'DECKHAND';
        let ratingColor = '#888888';
        if (this.stats.shipsSunk >= 15) {
            rating = 'ADMIRAL';
            ratingColor = '#ffd700';
        } else if (this.stats.shipsSunk >= 10) {
            rating = 'CAPTAIN';
            ratingColor = '#00ff00';
        } else if (this.stats.shipsSunk >= 5) {
            rating = 'SAILOR';
            ratingColor = '#00aaff';
        }

        // Dark overlay
        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
        overlay.setScrollFactor(0).setDepth(300);

        // Title
        this.add.text(GAME_WIDTH / 2, 80, 'SHIP DESTROYED', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Rating
        this.add.text(GAME_WIDTH / 2, 140, rating, {
            fontSize: '36px',
            fontFamily: 'monospace',
            color: ratingColor
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Stats
        const statsText = [
            'Time Sailed: ' + mins + ':' + secs.toString().padStart(2, '0'),
            'Day Reached: ' + this.gameData.day,
            'Final Gold: ' + this.gameData.gold,
            '',
            'Ships Sunk: ' + this.stats.shipsSunk,
            'Total Damage Dealt: ' + this.stats.totalDamageDealt,
            'Total Damage Taken: ' + this.stats.totalDamageTaken,
            'Critical Hits: ' + this.stats.critCount,
            'Max Kill Streak: ' + this.stats.maxKillStreak,
            'Cannons Fired: ' + this.stats.cannonsFired,
            'Loot Collected: ' + this.stats.lootCollected,
            'Gold Earned: ' + this.stats.goldEarned
        ];

        this.add.text(GAME_WIDTH / 2, 340, statsText.join('\n'), {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Restart prompt
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'Press SPACE to restart', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        // Restart handler
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
}

const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a3050',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
