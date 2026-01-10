// Basement Tears - Phaser 3 Version
// Binding of Isaac Style Roguelike

const TILE_SIZE = 40;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;

const COLORS = {
    floor: 0x2A2018,
    floorAlt: 0x231A12,
    wall: 0x3A3A3A,
    player: 0xEECCBB,
    tear: 0x6688CC,
    heart: 0xCC2222,
    fly: 0x3A3A3A,
    gaper: 0xDDAA88,
    blood: 0xCC3333
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Player
        let gfx = this.make.graphics({ add: false });
        // Head
        gfx.fillStyle(COLORS.player);
        gfx.fillCircle(16, 12, 14);
        // Body
        gfx.fillEllipse(16, 24, 20, 16);
        // Eyes
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(12, 10, 8, 10);
        gfx.fillEllipse(20, 10, 8, 10);
        // Mouth
        gfx.lineStyle(2, 0x000000);
        gfx.beginPath();
        gfx.arc(16, 16, 4, 0.2, Math.PI - 0.2);
        gfx.strokePath();
        gfx.generateTexture('player', 32, 32);
        gfx.destroy();

        // Tear
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.tear);
        gfx.fillCircle(8, 8, 8);
        gfx.fillStyle(0x99BBEE);
        gfx.fillCircle(5, 5, 3);
        gfx.generateTexture('tear', 16, 16);
        gfx.destroy();

        // Fly enemy
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x555555);
        gfx.fillEllipse(6, 8, 8, 12);
        gfx.fillEllipse(18, 8, 8, 12);
        gfx.fillStyle(COLORS.fly);
        gfx.fillCircle(12, 12, 7);
        gfx.fillStyle(0xFF0000);
        gfx.fillCircle(10, 10, 2);
        gfx.fillCircle(14, 10, 2);
        gfx.generateTexture('fly', 24, 24);
        gfx.destroy();

        // Gaper enemy
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.gaper);
        gfx.fillCircle(16, 16, 14);
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(11, 13, 8, 10);
        gfx.fillEllipse(21, 13, 8, 10);
        gfx.fillStyle(0x4A2A1A);
        gfx.fillEllipse(16, 22, 12, 10);
        gfx.generateTexture('gaper', 32, 32);
        gfx.destroy();

        // Heart pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.heart);
        gfx.fillCircle(6, 6, 6);
        gfx.fillCircle(14, 6, 6);
        gfx.fillTriangle(0, 8, 10, 20, 20, 8);
        gfx.generateTexture('heart_pickup', 20, 20);
        gfx.destroy();

        // Floor tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.floor);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.generateTexture('floor', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Wall tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.wall);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.fillStyle(0x252525);
        gfx.fillRect(2, 2, TILE_SIZE - 4, 10);
        gfx.fillRect(4, 14, TILE_SIZE - 8, 10);
        gfx.fillRect(2, 26, TILE_SIZE - 4, 10);
        gfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Rock
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x5A5A5A);
        gfx.fillTriangle(4, 28, 16, 4, 28, 28);
        gfx.fillStyle(0x3A3A3A);
        gfx.fillTriangle(8, 28, 16, 10, 24, 28);
        gfx.generateTexture('rock', 32, 32);
        gfx.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Room offset for HUD
        this.roomOffsetX = (800 - ROOM_WIDTH * TILE_SIZE) / 2;
        this.roomOffsetY = 60;

        // Draw room
        this.drawRoom();

        // Player
        this.player = this.add.sprite(
            this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2,
            this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2,
            'player'
        );
        this.player.setDepth(10);
        this.physics.add.existing(this.player);
        this.player.body.setSize(24, 24);

        // Player stats
        this.playerHealth = 6;
        this.maxHealth = 6;
        this.coins = 0;
        this.bombs = 1;
        this.keys = 1;
        this.fireTimer = 0;
        this.invulnTimer = 0;

        // Groups
        this.tears = this.add.group();
        this.enemies = this.add.group();
        this.pickups = this.add.group();

        // Spawn enemies
        this.spawnEnemies();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            j: Phaser.Input.Keyboard.KeyCodes.J,
            k: Phaser.Input.Keyboard.KeyCodes.K,
            l: Phaser.Input.Keyboard.KeyCodes.L
        });

        // HUD
        this.createHUD();

        // Game state
        this.gameState = 'playing';

        // Expose for testing
        window.gameState = () => ({
            state: this.gameState,
            playerHealth: this.playerHealth,
            enemies: this.enemies.getLength()
        });
    }

    drawRoom() {
        // Floor
        for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
            for (let x = 1; x < ROOM_WIDTH - 1; x++) {
                const tile = this.add.image(
                    this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                    this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                    'floor'
                );
                if ((x + y) % 2 === 1) {
                    tile.setTint(0x231A12);
                }
            }
        }

        // Walls
        for (let x = 0; x < ROOM_WIDTH; x++) {
            this.add.image(
                this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + TILE_SIZE / 2,
                'wall'
            );
            this.add.image(
                this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
        }
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            this.add.image(
                this.roomOffsetX + TILE_SIZE / 2,
                this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
            this.add.image(
                this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
        }

        // Obstacles
        for (let i = 0; i < 3; i++) {
            const rock = this.add.image(
                this.roomOffsetX + (3 + i * 3) * TILE_SIZE,
                this.roomOffsetY + 3.5 * TILE_SIZE,
                'rock'
            );
            rock.setDepth(5);
        }
    }

    spawnEnemies() {
        // Flies
        for (let i = 0; i < 3; i++) {
            const fly = this.add.sprite(
                this.roomOffsetX + (3 + Math.random() * 7) * TILE_SIZE,
                this.roomOffsetY + (2 + Math.random() * 3) * TILE_SIZE,
                'fly'
            );
            fly.setDepth(6);
            fly.enemyType = 'fly';
            fly.health = 4;
            fly.floatPhase = Math.random() * Math.PI * 2;
            this.physics.add.existing(fly);
            this.enemies.add(fly);
        }

        // Gaper
        const gaper = this.add.sprite(
            this.roomOffsetX + 6 * TILE_SIZE,
            this.roomOffsetY + 2 * TILE_SIZE,
            'gaper'
        );
        gaper.setDepth(6);
        gaper.enemyType = 'gaper';
        gaper.health = 12;
        this.physics.add.existing(gaper);
        this.enemies.add(gaper);
    }

    createHUD() {
        // Background
        this.add.rectangle(400, 27, 800, 54, 0x0A0A0A).setDepth(100);

        // Hearts
        this.heartSprites = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(30 + i * 28, 20, 'heart_pickup');
            heart.setDepth(101);
            this.heartSprites.push(heart);
        }

        // Pickup text
        const textStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#FFFFFF' };
        this.add.circle(25, 45, 7, 0xFFDD44).setDepth(101);
        this.coinText = this.add.text(38, 38, '00', textStyle).setDepth(101);

        this.add.circle(85, 45, 7, 0x444444).setDepth(101);
        this.bombText = this.add.text(98, 38, '01', textStyle).setDepth(101);

        this.add.circle(145, 42, 5, 0xFFCC22).setDepth(101);
        this.add.rectangle(145, 50, 4, 10, 0xFFCC22).setDepth(101);
        this.keyText = this.add.text(158, 38, '01', textStyle).setDepth(101);
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        const dt = delta / 1000;

        // Movement
        let dx = 0, dy = 0;
        if (this.cursors.w.isDown) dy = -1;
        if (this.cursors.s.isDown) dy = 1;
        if (this.cursors.a.isDown) dx = -1;
        if (this.cursors.d.isDown) dx = 1;

        if (dx && dy) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const speed = 150;
        this.player.body.setVelocity(dx * speed, dy * speed);

        // Keep in bounds
        const minX = this.roomOffsetX + TILE_SIZE + 16;
        const maxX = this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE - 16;
        const minY = this.roomOffsetY + TILE_SIZE + 16;
        const maxY = this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE - 16;

        this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
        this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);

        // Shooting
        let fireX = 0, fireY = 0;
        if (this.cursors.up.isDown || this.cursors.i.isDown) fireY = -1;
        if (this.cursors.down.isDown || this.cursors.k.isDown) fireY = 1;
        if (this.cursors.left.isDown || this.cursors.j.isDown) fireX = -1;
        if (this.cursors.right.isDown || this.cursors.l.isDown) fireX = 1;

        if (fireX && fireY) fireY = 0; // Prioritize horizontal

        this.fireTimer -= dt;
        if ((fireX || fireY) && this.fireTimer <= 0) {
            this.shoot(fireX, fireY);
        }

        // Update tears
        this.tears.children.iterate(tear => {
            if (!tear || !tear.active) return;

            tear.life -= dt;
            if (tear.life <= 0) {
                tear.destroy();
                return;
            }

            // Check bounds
            if (tear.x < this.roomOffsetX + TILE_SIZE ||
                tear.x > this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE ||
                tear.y < this.roomOffsetY + TILE_SIZE ||
                tear.y > this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE) {
                tear.destroy();
                return;
            }

            // Check enemy hits
            this.enemies.children.iterate(enemy => {
                if (!enemy || !enemy.active) return;
                const dist = Phaser.Math.Distance.Between(tear.x, tear.y, enemy.x, enemy.y);
                if (dist < 20) {
                    this.hitEnemy(enemy, 3.5);
                    tear.destroy();
                }
            });
        });

        // Update enemies
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            if (enemy.enemyType === 'fly') {
                enemy.floatPhase += dt * 5;
                enemy.y += Math.sin(enemy.floatPhase) * 0.5;

                // Move toward player
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.x += Math.cos(angle) * 60 * dt + (Math.random() - 0.5) * 20 * dt;
                enemy.y += Math.sin(angle) * 60 * dt + (Math.random() - 0.5) * 20 * dt;
            } else if (enemy.enemyType === 'gaper') {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.x += Math.cos(angle) * 40 * dt;
                enemy.y += Math.sin(angle) * 40 * dt;
            }

            // Check player collision
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            if (dist < 24 && this.invulnTimer <= 0) {
                this.takeDamage(1);
            }
        });

        // Invulnerability
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
            this.player.alpha = Math.floor(this.invulnTimer * 10) % 2 === 0 ? 0.5 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Update HUD
        this.updateHUD();

        // Check win
        if (this.enemies.getLength() === 0) {
            this.showWin();
        }
    }

    shoot(dx, dy) {
        const tear = this.add.sprite(this.player.x, this.player.y - 10, 'tear');
        tear.setDepth(8);
        tear.life = 0.7;

        this.physics.add.existing(tear);
        tear.body.setVelocity(dx * 300, dy * 300);

        this.tears.add(tear);
        this.fireTimer = 0.35;
    }

    hitEnemy(enemy, damage) {
        enemy.health -= damage;
        enemy.setTint(0xFFFFFF);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.health <= 0) {
            // Death effect
            for (let i = 0; i < 5; i++) {
                const particle = this.add.circle(
                    enemy.x + (Math.random() - 0.5) * 20,
                    enemy.y + (Math.random() - 0.5) * 20,
                    4, COLORS.blood
                );
                this.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => particle.destroy()
                });
            }

            // Maybe drop pickup
            if (Math.random() < 0.3) {
                const pickup = this.add.sprite(enemy.x, enemy.y, 'heart_pickup');
                pickup.setDepth(5);
                this.pickups.add(pickup);
            }

            enemy.destroy();
        }
    }

    takeDamage(amount) {
        this.playerHealth -= amount;
        this.invulnTimer = 1.5;
        this.cameras.main.shake(100, 0.01);

        if (this.playerHealth <= 0) {
            this.gameState = 'gameover';
            this.showGameOver();
        }
    }

    updateHUD() {
        // Update hearts
        for (let i = 0; i < this.heartSprites.length; i++) {
            const fullHearts = Math.floor(this.playerHealth / 2);
            if (i < fullHearts) {
                this.heartSprites[i].setTint(0xFFFFFF);
                this.heartSprites[i].setAlpha(1);
            } else {
                this.heartSprites[i].setTint(0x222222);
                this.heartSprites[i].setAlpha(0.5);
            }
        }

        this.coinText.setText(this.coins.toString().padStart(2, '0'));
        this.bombText.setText(this.bombs.toString().padStart(2, '0'));
        this.keyText.setText(this.keys.toString().padStart(2, '0'));

        // Check pickup collection
        this.pickups.children.iterate(pickup => {
            if (!pickup || !pickup.active) return;
            const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 25 && this.playerHealth < this.maxHealth) {
                this.playerHealth = Math.min(this.playerHealth + 2, this.maxHealth);
                pickup.destroy();
            }
        });
    }

    showWin() {
        this.gameState = 'won';
        const text = this.add.text(400, 300, 'ROOM CLEARED!', {
            fontFamily: 'serif',
            fontSize: '32px',
            color: '#44FF44'
        });
        text.setOrigin(0.5);
        text.setDepth(200);
    }

    showGameOver() {
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        bg.setDepth(199);

        const text = this.add.text(400, 300, 'YOU DIED', {
            fontFamily: 'serif',
            fontSize: '48px',
            color: '#CC3333'
        });
        text.setOrigin(0.5);
        text.setDepth(200);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
