// CITADEL - System Shock Metroidvania
// Phaser 3 Implementation

const TILE_SIZE = 32;
const ROOM_WIDTH = 40;
const ROOM_HEIGHT = 22;

// Colors
const COLORS = {
    bg: 0x0a0a12,
    wall: 0x2a2a3a,
    wallLight: 0x3a3a4a,
    floor: 0x1a1a2a,
    accent: 0x8844aa,
    accentGlow: 0xaa66cc,
    healthBar: 0xcc4444,
    energyBar: 0x4488cc,
    player: 0xcc8844,
    playerLight: 0xddaa66,
    enemy: 0x884466,
    enemyGlow: 0xaa6688,
    bullet: 0xffdd44,
    danger: 0xff4466
};

// Room templates
const ROOM_TEMPLATES = [
    `
.........................
.........................
.........................
.........................
.........................
..#####################..
..#.....................#
..#.....................#
..#...#####.....#####...#
..#.....................#
..#.....................#
..#.........S...........#
..#.....................#
..#########.....########.
..#.......#.....#........
..#.......#.....#........
..#.......#.....#........
.########################
`,
    `
.........................
...####.........####.....
...#...E............#....
...#...##########...#....
...#...#........#...#....
...#...#........#...#....
...#...####..####...#....
...#........E.......#....
...#....########....#....
...#....#......#....#....
...#....#......#....#....
...####.#......#.####....
........#......#.........
...####.#......#.####....
...#....#......#....#....
...#....########....#....
...#................#....
.########################
`,
    `
.........................
.........................
..#####################..
..#...................#..
..#..E...........E....#..
..#...###########.....#..
..#...................#..
..#...........E.......#..
..#.....#########.....#..
..#...................#..
..#.E.................#..
..#...###########.....#..
..#...................#..
..#.....#####.........#..
..#...................#..
..#...................#..
..#...................#..
.########################
`
];

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // Grid decoration
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x1a1a2a);
        for (let x = 0; x < width; x += 40) {
            graphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += 40) {
            graphics.lineBetween(0, y, width, y);
        }

        // Title
        this.add.text(width / 2, 180, 'CITADEL', {
            fontSize: '64px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#aa66cc'
        }).setOrigin(0.5);

        this.add.text(width / 2, 230, 'A System Shock Metroidvania', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        // SHODAN quote
        this.add.text(width / 2, 320, '"LOOK AT YOU, HACKER..."', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#8844aa'
        }).setOrigin(0.5);

        // Start prompt
        const startText = this.add.text(width / 2, 420, 'Press SPACE to Begin', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Blink effect
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls
        this.add.text(width / 2, 500, 'WASD/Arrows: Move | Space: Jump | J/Z: Attack | K/X: Shoot', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // Player data
        this.playerData = {
            hp: 100,
            maxHp: 100,
            energy: 100,
            maxEnergy: 100,
            weapon: 'pipe',
            ammo: { standard: 50, magnum: 20 },
            hasDoubleJump: true,
            canDoubleJump: false,
            hasWallJump: true,
            onWall: 0,
            invincible: 0,
            attackTimer: 0
        };

        this.currentRoom = 0;
        this.roomMap = [];
        this.bullets = [];

        // Visual effects
        this.floatingTexts = [];
        this.screenShakeAmount = 0;

        // Score and combo
        this.score = 0;
        this.killCount = 0;
        this.meleeCombo = 0;
        this.comboTimer = 0;

        // Debug overlay
        this.debugMode = false;

        // SHODAN taunts
        this.SHODAN_TAUNTS = [
            '"LOOK AT YOU, HACKER..."',
            '"YOU CANNOT STOP ME."',
            '"I AM PERFECTION."',
            '"PATHETIC INSECT."',
            '"YOUR DEATH IS INEVITABLE."'
        ];
        this.tauntTimer = 0;
        this.currentTaunt = '';

        // Create groups
        this.wallsGroup = this.physics.add.staticGroup();
        this.enemiesGroup = this.physics.add.group();
        this.bulletsGroup = this.physics.add.group();

        // Create player
        this.createPlayer();

        // Load room
        this.loadRoom(0);

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            j: Phaser.Input.Keyboard.KeyCodes.J,
            k: Phaser.Input.Keyboard.KeyCodes.K,
            z: Phaser.Input.Keyboard.KeyCodes.Z,
            x: Phaser.Input.Keyboard.KeyCodes.X,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.jumpJustPressed = false;
        this.attackJustPressed = false;

        // Debug mode toggle (using Backquote key to avoid Q weapon cycle conflict)
        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            if (this.debugPanel) this.debugPanel.setVisible(this.debugMode);
            if (this.debugText) this.debugText.setVisible(this.debugMode);
        });

        // Create HUD
        this.createHUD();

        // Create debug overlay
        this.createDebugOverlay();

        // Collisions
        this.physics.add.collider(this.player, this.wallsGroup);
        this.physics.add.collider(this.enemiesGroup, this.wallsGroup);

        this.physics.add.overlap(this.player, this.enemiesGroup, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.bulletsGroup, this.wallsGroup, (bullet) => bullet.destroy());
        this.physics.add.overlap(this.bulletsGroup, this.enemiesGroup, this.bulletHitEnemy, null, this);

        // Expose for testing
        const scene = this;
        window.gameState = {
            get state() { return 'playing'; },
            get hp() { return scene.playerData.hp; },
            get energy() { return scene.playerData.energy; },
            get weapon() { return scene.playerData.weapon; },
            get enemies() { return scene.enemiesGroup.countActive(); },
            get room() { return scene.currentRoom; },
            get score() { return scene.score; },
            get kills() { return scene.killCount; },
            get combo() { return scene.meleeCombo; }
        };

        window.startGame = () => {
            scene.scene.restart();
        };
    }

    createPlayer() {
        // Player graphics
        const playerGraphics = this.make.graphics({ add: false });

        // Body
        playerGraphics.fillStyle(COLORS.player);
        playerGraphics.fillRect(0, 0, 24, 40);

        // Chest
        playerGraphics.fillStyle(COLORS.playerLight);
        playerGraphics.fillRect(4, 5, 16, 20);

        // Head
        playerGraphics.fillStyle(0xddbb99);
        playerGraphics.fillRect(6, -8, 12, 10);

        // Visor
        playerGraphics.fillStyle(0x44ffaa);
        playerGraphics.fillRect(8, -6, 6, 4);

        playerGraphics.generateTexture('player', 24, 40);

        this.player = this.physics.add.sprite(100, 400, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800);
        this.player.body.setSize(20, 38);
        this.player.facing = 1;
    }

    // Visual effect helpers
    spawnFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: color
        }).setOrigin(0.5).setDepth(150);
        floatText.life = 1.5;
        floatText.maxLife = 1.5;
        this.floatingTexts.push(floatText);
    }

    spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const particle = this.add.rectangle(x, y, 4, 4, color).setDepth(80);
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 50;
            particle.life = 0.5 + Math.random() * 0.5;

            this.tweens.add({
                targets: particle,
                alpha: 0,
                duration: particle.life * 1000,
                ease: 'Linear',
                onUpdate: () => {
                    particle.x += particle.vx * 0.016;
                    particle.y += particle.vy * 0.016;
                    particle.vy += 300 * 0.016;
                },
                onComplete: () => particle.destroy()
            });
        }
    }

    addScreenShake(amount) {
        this.screenShakeAmount = Math.min(this.screenShakeAmount + amount, 1.0);
        this.cameras.main.shake(100, amount * 0.01);
    }

    getComboMultiplier() {
        if (this.meleeCombo <= 0) return 1;
        return Math.min(1 + this.meleeCombo * 0.3, 2.5);
    }

    triggerTaunt() {
        if (this.tauntTimer <= 0) {
            this.currentTaunt = this.SHODAN_TAUNTS[Math.floor(Math.random() * this.SHODAN_TAUNTS.length)];
            this.tauntTimer = 5;
        }
    }

    createHUD() {
        // HUD background
        const hudBg = this.add.rectangle(0, 0, 1280, 50, 0x0a0a14, 0.9);
        hudBg.setOrigin(0, 0);
        hudBg.setScrollFactor(0);
        hudBg.setDepth(100);

        // HP bar background
        this.hpBarBg = this.add.rectangle(15, 12, 150, 12, 0x333333);
        this.hpBarBg.setOrigin(0, 0);
        this.hpBarBg.setScrollFactor(0);
        this.hpBarBg.setDepth(101);

        // HP bar
        this.hpBar = this.add.rectangle(15, 12, 150, 12, COLORS.healthBar);
        this.hpBar.setOrigin(0, 0);
        this.hpBar.setScrollFactor(0);
        this.hpBar.setDepth(102);

        // HP text
        this.hpText = this.add.text(20, 11, 'HP: 100/100', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.hpText.setScrollFactor(0);
        this.hpText.setDepth(103);

        // Energy bar background
        this.energyBarBg = this.add.rectangle(15, 28, 150, 8, 0x333333);
        this.energyBarBg.setOrigin(0, 0);
        this.energyBarBg.setScrollFactor(0);
        this.energyBarBg.setDepth(101);

        // Energy bar
        this.energyBar = this.add.rectangle(15, 28, 150, 8, COLORS.energyBar);
        this.energyBar.setOrigin(0, 0);
        this.energyBar.setScrollFactor(0);
        this.energyBar.setDepth(102);

        // Score display (center)
        this.scoreText = this.add.text(640, 15, 'SCORE: 0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffdd44'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(103);

        this.killsText = this.add.text(640, 32, 'KILLS: 0', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(103);

        // Combo display
        this.comboText = this.add.text(180, 20, '', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffaa44'
        }).setScrollFactor(0).setDepth(103);

        // SHODAN taunt
        this.tauntText = this.add.text(640, 80, '', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontStyle: 'italic',
            color: '#8844aa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(103);

        // Weapon display background
        this.weaponBg = this.add.rectangle(1100, 8, 170, 35, 0x323250, 0.8);
        this.weaponBg.setOrigin(0, 0);
        this.weaponBg.setScrollFactor(0);
        this.weaponBg.setDepth(100);
        this.weaponBg.setStrokeStyle(1, COLORS.accent);

        // Weapon text
        this.weaponText = this.add.text(1110, 15, 'PIPE', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.weaponText.setScrollFactor(0);
        this.weaponText.setDepth(103);

        // Ammo text
        this.ammoText = this.add.text(1110, 30, 'MELEE', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        });
        this.ammoText.setScrollFactor(0);
        this.ammoText.setDepth(103);

        // Bottom bar
        const bottomBar = this.add.rectangle(0, 695, 1280, 25, 0x0a0a14, 0.7);
        bottomBar.setOrigin(0, 0);
        bottomBar.setScrollFactor(0);
        bottomBar.setDepth(100);

        // Controls text
        this.add.text(15, 701, 'WASD/Arrows: Move | SPACE: Jump | J/Z: Melee | K/X: Shoot | Q: Cycle Weapon', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setScrollFactor(0).setDepth(101);

        // Room text
        this.roomText = this.add.text(1100, 701, 'MEDICAL DECK - ROOM 1', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#555555'
        });
        this.roomText.setScrollFactor(0);
        this.roomText.setDepth(101);
    }

    createDebugOverlay() {
        // Debug panel background
        this.debugPanel = this.add.rectangle(150, 200, 280, 340, 0x000000, 0.85);
        this.debugPanel.setScrollFactor(0);
        this.debugPanel.setDepth(200);
        this.debugPanel.setVisible(false);

        // Debug text
        this.debugText = this.add.text(20, 60, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#00FF00',
            lineSpacing: 4
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(201);
        this.debugText.setVisible(false);
    }

    updateDebugOverlay() {
        if (!this.debugMode || !this.debugText) return;

        const onGround = this.player.body.blocked.down || this.player.body.touching.down;
        const lines = [
            '=== DEBUG (Q to close) ===',
            `Player Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `Player Vel: (${Math.round(this.player.body.velocity.x)}, ${Math.round(this.player.body.velocity.y)})`,
            `HP: ${Math.ceil(this.playerData.hp)}/${this.playerData.maxHp}`,
            `Energy: ${Math.ceil(this.playerData.energy)}/${this.playerData.maxEnergy}`,
            `Grounded: ${onGround}`,
            `Can Double Jump: ${this.playerData.canDoubleJump}`,
            `Facing: ${this.player.facing > 0 ? 'Right' : 'Left'}`,
            `Weapon: ${this.playerData.weapon}`,
            `Room: ${this.currentRoom}`,
            `Enemies: ${this.enemiesGroup.getLength()}`,
            `Bullets: ${this.bulletsGroup.getLength()}`,
            `Score: ${this.score} | Kills: ${this.killCount}`,
            `Combo: ${this.meleeCombo}x`,
            `FloatTexts: ${this.floatingTexts.length}`
        ];

        this.debugText.setText(lines.join('\n'));
    }

    loadRoom(roomIndex) {
        // Clear existing
        this.wallsGroup.clear(true, true);
        this.enemiesGroup.clear(true, true);

        const template = ROOM_TEMPLATES[roomIndex % ROOM_TEMPLATES.length];
        const lines = template.trim().split('\n');
        this.roomMap = [];

        for (let y = 0; y < ROOM_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < ROOM_WIDTH; x++) {
                const char = lines[y] ? lines[y][x] || '.' : '.';
                row.push(char);

                if (char === '#') {
                    this.createWallTile(x, y);
                } else if (char === 'E') {
                    this.createEnemy(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'shambler');
                } else if (char === 'S') {
                    this.player.setPosition(x * TILE_SIZE + 16, y * TILE_SIZE + 20);
                }
            }
            this.roomMap.push(row);
        }

        this.currentRoom = roomIndex;
        if (this.roomText) {
            this.roomText.setText(`MEDICAL DECK - ROOM ${roomIndex + 1}`);
        }
    }

    createWallTile(x, y) {
        // Create wall graphic
        const graphics = this.make.graphics({ add: false });

        // Base
        graphics.fillStyle(COLORS.wall);
        graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

        // Texture
        graphics.fillStyle(COLORS.wallLight);
        graphics.fillRect(2, 2, 4, 4);
        graphics.fillRect(TILE_SIZE - 6, TILE_SIZE - 6, 4, 4);

        graphics.fillStyle(COLORS.floor);
        graphics.fillRect(10, 10, 6, 6);

        // Edge
        graphics.fillStyle(0x4a4a5a);
        graphics.fillRect(0, 0, TILE_SIZE, 2);
        graphics.fillRect(0, 0, 2, TILE_SIZE);

        const key = `wall_${x}_${y}`;
        graphics.generateTexture(key, TILE_SIZE, TILE_SIZE);

        const wall = this.wallsGroup.create(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, key);
        wall.setImmovable(true);
        wall.body.setSize(TILE_SIZE, TILE_SIZE);
    }

    createEnemy(x, y, type) {
        // Create enemy graphic
        const graphics = this.make.graphics({ add: false });

        graphics.fillStyle(COLORS.enemy);
        graphics.fillRect(0, 0, 28, 36);

        graphics.fillStyle(COLORS.enemyGlow);
        graphics.fillRect(6, 4, 4, 4);
        graphics.fillRect(14, 4, 4, 4);

        const key = `enemy_${x}_${y}`;
        graphics.generateTexture(key, 28, 36);

        const enemy = this.enemiesGroup.create(x, y, key);
        enemy.setCollideWorldBounds(true);
        enemy.setGravityY(800);
        enemy.body.setSize(24, 34);

        enemy.enemyType = type;
        enemy.hp = 25;
        enemy.maxHp = 25;
        enemy.damage = 10;
        enemy.speed = 80;
        enemy.dir = Phaser.Math.Between(0, 1) ? 1 : -1;
        enemy.alertRange = 200;
        enemy.state = 'patrol';

        return enemy;
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Update timers
        if (this.playerData.invincible > 0) this.playerData.invincible -= dt;
        if (this.playerData.attackTimer > 0) this.playerData.attackTimer -= dt;

        // Energy regen
        if (this.playerData.energy < this.playerData.maxEnergy) {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + 5 * dt);
        }

        // Player movement
        const left = this.cursors.left.isDown || this.keys.a.isDown;
        const right = this.cursors.right.isDown || this.keys.d.isDown;

        if (left) {
            this.player.setVelocityX(-280);
            this.player.facing = -1;
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(280);
            this.player.facing = 1;
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        // Jumping
        const jumpPressed = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;
        const onGround = this.player.body.blocked.down || this.player.body.touching.down;

        if (jumpPressed && !this.jumpJustPressed) {
            if (onGround) {
                this.player.setVelocityY(-480);
                this.playerData.canDoubleJump = true;
            } else if (this.playerData.hasDoubleJump && this.playerData.canDoubleJump) {
                this.player.setVelocityY(-400);
                this.playerData.canDoubleJump = false;
            }
        }
        this.jumpJustPressed = jumpPressed;

        // Variable jump height
        if (!jumpPressed && this.player.body.velocity.y < 0) {
            this.player.setVelocityY(this.player.body.velocity.y * 0.9);
        }

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) this.meleeCombo = 0;
        }

        // Melee attack
        const attackPressed = this.keys.j.isDown || this.keys.z.isDown;
        if (attackPressed && !this.attackJustPressed && this.playerData.attackTimer <= 0) {
            this.playerData.attackTimer = 0.4;

            // Check enemy hits
            let hitAny = false;
            this.enemiesGroup.getChildren().forEach(enemy => {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 48 && Math.sign(dx) === this.player.facing) {
                    const mult = this.getComboMultiplier();
                    const damage = Math.floor(15 * mult);
                    enemy.hp -= damage;
                    hitAny = true;

                    // Damage feedback
                    const critical = mult >= 2.0;
                    this.spawnFloatingText(enemy.x, enemy.y - 20, critical ? damage + '!' : String(damage), critical ? '#ffff00' : '#ff8844');
                    this.spawnParticles(enemy.x, enemy.y, 5, COLORS.enemyGlow);
                    this.addScreenShake(0.15);

                    if (enemy.hp <= 0) {
                        // Score and effects
                        this.score += 25;
                        this.killCount++;
                        this.spawnFloatingText(enemy.x, enemy.y - 10, '+25', '#ffdd44');
                        this.spawnParticles(enemy.x, enemy.y, 12, COLORS.enemy);
                        if (Math.random() < 0.15) this.triggerTaunt();
                        enemy.destroy();
                    }
                }
            });
            if (hitAny) {
                this.meleeCombo++;
                this.comboTimer = 1.5;
            }
        }
        this.attackJustPressed = attackPressed;

        // Shooting
        const shootPressed = this.keys.k.isDown || this.keys.x.isDown;
        if (shootPressed && !this.shootJustPressed && this.playerData.weapon !== 'pipe') {
            const ammoType = this.playerData.weapon === 'minipistol' ? 'standard' : 'magnum';
            if (this.playerData.ammo[ammoType] > 0) {
                this.playerData.ammo[ammoType]--;
                this.createBullet(
                    this.player.x + this.player.facing * 20,
                    this.player.y,
                    this.player.facing * 600,
                    0,
                    12,
                    true
                );
            }
        }
        this.shootJustPressed = shootPressed;

        // Weapon cycling
        if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
            const weapons = ['pipe', 'minipistol', 'magnum'];
            const idx = weapons.indexOf(this.playerData.weapon);
            this.playerData.weapon = weapons[(idx + 1) % weapons.length];
        }

        // Update enemies
        this.updateEnemies(dt);

        // Update visual effects
        this.updateVisualEffects(dt);

        // Update HUD
        this.updateHUD();
        this.updateDebugOverlay();

        // Check death
        if (this.playerData.hp <= 0) {
            this.triggerTaunt();
            this.scene.start('GameOverScene');
        }
    }

    createBullet(x, y, vx, vy, damage, friendly) {
        const graphics = this.make.graphics({ add: false });
        graphics.fillStyle(friendly ? COLORS.bullet : COLORS.danger);
        graphics.fillCircle(4, 4, 4);
        const key = `bullet_${Date.now()}_${Math.random()}`;
        graphics.generateTexture(key, 8, 8);

        const bullet = this.bulletsGroup.create(x, y, key);
        bullet.setVelocity(vx, vy);
        bullet.body.setAllowGravity(false);
        bullet.damage = damage;
        bullet.friendly = friendly;

        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateEnemies(dt) {
        this.enemiesGroup.getChildren().forEach(enemy => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.alertRange) {
                enemy.state = 'chase';
                enemy.dir = Math.sign(dx);
            } else {
                enemy.state = 'patrol';
            }

            const speed = enemy.state === 'chase' ? enemy.speed : enemy.speed * 0.5;
            enemy.setVelocityX(enemy.dir * speed);

            // Turn at walls
            if (enemy.body.blocked.left || enemy.body.blocked.right) {
                enemy.dir *= -1;
            }
        });
    }

    playerHitEnemy(player, enemy) {
        if (this.playerData.invincible <= 0) {
            this.playerData.hp -= enemy.damage;
            this.playerData.invincible = 1.0;
            player.setVelocityX(-player.facing * 200);
            player.setVelocityY(-150);
            this.addScreenShake(0.4);
            this.spawnFloatingText(player.x, player.y - 30, '-' + enemy.damage, '#ff4444');
            this.spawnParticles(player.x, player.y, 8, 0xff6666);
        }
    }

    bulletHitEnemy(bullet, enemy) {
        if (bullet.friendly) {
            enemy.hp -= bullet.damage;
            this.spawnFloatingText(enemy.x, enemy.y - 15, String(bullet.damage), '#ffaa44');
            this.spawnParticles(bullet.x, bullet.y, 4, 0xffcc66);

            if (enemy.hp <= 0) {
                this.score += 25;
                this.killCount++;
                this.spawnFloatingText(enemy.x, enemy.y - 10, '+25', '#ffdd44');
                this.spawnParticles(enemy.x, enemy.y, 12, COLORS.enemy);
                this.addScreenShake(0.2);
                if (Math.random() < 0.15) this.triggerTaunt();
                enemy.destroy();
            }
            bullet.destroy();
        }
    }

    updateHUD() {
        // Health
        const hpPercent = this.playerData.hp / this.playerData.maxHp;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText(`HP: ${Math.ceil(this.playerData.hp)}/${this.playerData.maxHp}`);

        // Energy
        const energyPercent = this.playerData.energy / this.playerData.maxEnergy;
        this.energyBar.setScale(energyPercent, 1);

        // Weapon
        this.weaponText.setText(this.playerData.weapon.toUpperCase());
        if (this.playerData.weapon === 'pipe') {
            this.ammoText.setText('MELEE');
        } else {
            const ammoType = this.playerData.weapon === 'minipistol' ? 'standard' : 'magnum';
            this.ammoText.setText(`AMMO: ${this.playerData.ammo[ammoType]}`);
        }

        // Score and kills
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.killsText.setText(`KILLS: ${this.killCount}`);

        // Combo
        if (this.meleeCombo > 0 && this.comboTimer > 0) {
            const mult = this.getComboMultiplier().toFixed(1);
            this.comboText.setText(`COMBO x${this.meleeCombo} (${mult}x)`);
            this.comboText.setColor(this.meleeCombo >= 3 ? '#ffff00' : '#ffaa44');
        } else {
            this.comboText.setText('');
        }

        // SHODAN taunt
        if (this.tauntTimer > 0) {
            this.tauntText.setText(this.currentTaunt + '\n- SHODAN');
            this.tauntText.setAlpha(Math.min(1, this.tauntTimer / 2));
        } else {
            this.tauntText.setText('');
        }
    }

    updateVisualEffects(dt) {
        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            ft.y -= 40 * dt;
            ft.setAlpha(ft.life / ft.maxLife);
            if (ft.life <= 0) {
                ft.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }

        // SHODAN taunt timer
        if (this.tauntTimer > 0) {
            this.tauntTimer -= dt;
        }
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(0x140000);

        this.add.text(width / 2, 200, 'SYSTEM FAILURE', {
            fontSize: '48px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ff4466'
        }).setOrigin(0.5);

        this.add.text(width / 2, 280, '"PATHETIC. I EXPECTED MORE FROM YOU."', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#8844aa'
        }).setOrigin(0.5);

        this.add.text(width / 2, 310, '- SHODAN', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#8844aa'
        }).setOrigin(0.5);

        this.add.text(width / 2, 420, 'Press SPACE to Continue', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Expose for testing
        window.gameState = {
            get state() { return 'gameover'; },
            hp: 0,
            energy: 0,
            weapon: 'pipe',
            enemies: 0,
            room: 0
        };
    }
}

// Phaser configuration
const config = {
    type: Phaser.CANVAS,
    width: 1280,
    height: 720,
    backgroundColor: COLORS.bg,
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

// Create game
const game = new Phaser.Game(config);

// Expose for testing
window.startGame = () => {
    if (game.scene.isActive('MenuScene')) {
        game.scene.start('GameScene');
    } else if (game.scene.isActive('GameOverScene')) {
        game.scene.start('GameScene');
    }
};

window.gameState = {
    get state() {
        if (game.scene.isActive('MenuScene')) return 'title';
        if (game.scene.isActive('GameScene')) return 'playing';
        if (game.scene.isActive('GameOverScene')) return 'gameover';
        return 'loading';
    },
    hp: 100,
    energy: 100,
    weapon: 'pipe',
    enemies: 0,
    room: 0
};
