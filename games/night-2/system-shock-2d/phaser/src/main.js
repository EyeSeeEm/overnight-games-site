// System Shock 2D - Whispers of M.A.R.I.A.
// Built with Phaser 3
// Twin-stick survival horror

// Game constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 25;
const ROOM_HEIGHT = 18;
const PLAYER_SPEED = 150;
const BULLET_SPEED = 400;
const ENEMY_SPEED = 60;

// Tile types
const EMPTY = 0;
const WALL = 1;
const DOOR = 2;
const TERMINAL = 3;
const MEDICAL = 4;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Game state
    this.gameState = {
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      ammo: 50,
      maxAmmo: 100,
      level: 1,
      kills: 0,
      isDead: false
    };

    // Expose for testing
    window.gameState = this.gameState;

    // Groups
    this.bullets = this.add.group();
    this.enemies = this.add.group();

    // Generate room
    this.generateRoom();

    // Create player
    this.createPlayer();

    // Spawn enemies
    this.spawnEnemies(3 + this.gameState.level);

    // Input
    this.cursors = {
      w: this.input.keyboard.addKey('W'),
      a: this.input.keyboard.addKey('A'),
      s: this.input.keyboard.addKey('S'),
      d: this.input.keyboard.addKey('D')
    };

    // Mouse
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.shoot();
      }
    });

    // Camera
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Fire timer
    this.lastFireTime = 0;
    this.fireRate = 300;

    // Create HUD
    this.createHUD();

    console.log('System Shock 2D initialized');
  }

  generateRoom() {
    this.room = [];

    // Generate tilemap
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < ROOM_WIDTH; x++) {
        if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
          row.push(WALL);
        } else {
          row.push(EMPTY);
        }
      }
      this.room.push(row);
    }

    // Add internal walls
    for (let i = 0; i < 5; i++) {
      const wx = Phaser.Math.Between(3, ROOM_WIDTH - 4);
      const wy = Phaser.Math.Between(3, ROOM_HEIGHT - 4);
      const len = Phaser.Math.Between(3, 6);
      const horiz = Math.random() > 0.5;
      for (let j = 0; j < len; j++) {
        if (horiz && wx + j < ROOM_WIDTH - 1) {
          this.room[wy][wx + j] = WALL;
        } else if (!horiz && wy + j < ROOM_HEIGHT - 1) {
          this.room[wy + j][wx] = WALL;
        }
      }
    }

    // Add door
    this.room[ROOM_HEIGHT - 2][ROOM_WIDTH - 2] = DOOR;

    // Add stations
    this.room[2][2] = MEDICAL;
    this.room[ROOM_HEIGHT - 3][2] = TERMINAL;

    // Draw tiles
    this.wallGraphics = this.add.graphics();
    this.drawRoom();
  }

  drawRoom() {
    this.wallGraphics.clear();

    for (let y = 0; y < ROOM_HEIGHT; y++) {
      for (let x = 0; x < ROOM_WIDTH; x++) {
        const tile = this.room[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === WALL) {
          this.wallGraphics.fillStyle(0x333366, 1);
          this.wallGraphics.fillRect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);
          this.wallGraphics.lineStyle(1, 0x555599);
          this.wallGraphics.strokeRect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);
        } else if (tile === DOOR) {
          this.wallGraphics.fillStyle(0x00ff00, 1);
          this.wallGraphics.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        } else if (tile === MEDICAL) {
          this.wallGraphics.fillStyle(0xff0000, 1);
          this.wallGraphics.fillRect(px + 8, py + 4, TILE_SIZE - 16, TILE_SIZE - 8);
          this.wallGraphics.fillRect(px + 4, py + 8, TILE_SIZE - 8, TILE_SIZE - 16);
        } else if (tile === TERMINAL) {
          this.wallGraphics.fillStyle(0x00aaff, 1);
          this.wallGraphics.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        } else {
          // Floor
          this.wallGraphics.fillStyle(0x1a1a2e, 1);
          this.wallGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  createPlayer() {
    // Find empty spawn position
    let spawnX = TILE_SIZE * 3 + TILE_SIZE / 2;
    let spawnY = TILE_SIZE * 3 + TILE_SIZE / 2;

    this.player = this.add.graphics();
    this.player.x = spawnX;
    this.player.y = spawnY;
    this.player.angle = 0;

    this.drawPlayer();
  }

  drawPlayer() {
    this.player.clear();
    // Body
    this.player.fillStyle(0x4488ff, 1);
    this.player.fillCircle(0, 0, 12);
    // Visor
    this.player.fillStyle(0x00ffff, 1);
    this.player.fillRect(4, -4, 10, 8);
    // Direction indicator
    this.player.fillStyle(0xffffff, 1);
    this.player.fillTriangle(10, 0, 6, -4, 6, 4);
  }

  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      let ex, ey;
      let attempts = 0;
      do {
        ex = Phaser.Math.Between(5, ROOM_WIDTH - 5);
        ey = Phaser.Math.Between(5, ROOM_HEIGHT - 5);
        attempts++;
      } while (this.room[ey][ex] !== EMPTY && attempts < 50);

      if (attempts < 50) {
        this.createEnemy(ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2);
      }
    }
  }

  createEnemy(x, y) {
    const enemy = this.add.graphics();
    enemy.x = x;
    enemy.y = y;
    enemy.hp = 30;
    enemy.state = 'patrol';
    enemy.patrolTarget = { x: x, y: y };
    enemy.attackTimer = 0;

    // Draw enemy
    enemy.fillStyle(0xff4444, 1);
    enemy.fillCircle(0, 0, 10);
    enemy.fillStyle(0xff0000, 1);
    enemy.fillCircle(3, -3, 4);

    this.enemies.add(enemy);
  }

  shoot() {
    if (this.gameState.ammo <= 0 || this.gameState.isDead) return;

    const now = this.time.now;
    if (now - this.lastFireTime < this.fireRate) return;

    this.lastFireTime = now;
    this.gameState.ammo--;

    // Create bullet
    const angle = this.player.angle * Math.PI / 180;
    const bullet = this.add.graphics();
    bullet.x = this.player.x + Math.cos(angle) * 16;
    bullet.y = this.player.y + Math.sin(angle) * 16;
    bullet.vx = Math.cos(angle) * BULLET_SPEED;
    bullet.vy = Math.sin(angle) * BULLET_SPEED;
    bullet.damage = 20;
    bullet.life = 2000;

    bullet.fillStyle(0xffff00, 1);
    bullet.fillCircle(0, 0, 4);

    this.bullets.add(bullet);
  }

  createHUD() {
    this.hudGraphics = this.add.graphics();
    this.hudGraphics.setScrollFactor(0);
    this.hudGraphics.setDepth(100);

    this.healthText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff4444'
    }).setScrollFactor(0).setDepth(100);

    this.energyText = this.add.text(10, 28, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#44aaff'
    }).setScrollFactor(0).setDepth(100);

    this.ammoText = this.add.text(10, 46, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffaa00'
    }).setScrollFactor(0).setDepth(100);

    this.levelText = this.add.text(10, 64, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ff00'
    }).setScrollFactor(0).setDepth(100);

    this.killsText = this.add.text(10, 82, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa'
    }).setScrollFactor(0).setDepth(100);
  }

  updateHUD() {
    this.healthText.setText(`HP: ${this.gameState.health}/${this.gameState.maxHealth}`);
    this.energyText.setText(`EN: ${this.gameState.energy}/${this.gameState.maxEnergy}`);
    this.ammoText.setText(`AMMO: ${this.gameState.ammo}/${this.gameState.maxAmmo}`);
    this.levelText.setText(`LEVEL: ${this.gameState.level}`);
    this.killsText.setText(`KILLS: ${this.gameState.kills}`);

    // Draw health bar
    this.hudGraphics.clear();
    this.hudGraphics.fillStyle(0x330000, 1);
    this.hudGraphics.fillRect(80, 10, 100, 12);
    this.hudGraphics.fillStyle(0xff4444, 1);
    this.hudGraphics.fillRect(80, 10, 100 * (this.gameState.health / this.gameState.maxHealth), 12);

    // Draw energy bar
    this.hudGraphics.fillStyle(0x003333, 1);
    this.hudGraphics.fillRect(80, 28, 100, 12);
    this.hudGraphics.fillStyle(0x44aaff, 1);
    this.hudGraphics.fillRect(80, 28, 100 * (this.gameState.energy / this.gameState.maxEnergy), 12);
  }

  update(time, delta) {
    if (this.gameState.isDead) return;

    // Update game state for testing
    window.gameState = this.gameState;

    // Player movement
    let vx = 0, vy = 0;
    if (this.cursors.w.isDown) vy -= 1;
    if (this.cursors.s.isDown) vy += 1;
    if (this.cursors.a.isDown) vx -= 1;
    if (this.cursors.d.isDown) vx += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      vx = vx / len * PLAYER_SPEED * delta / 1000;
      vy = vy / len * PLAYER_SPEED * delta / 1000;

      const newX = this.player.x + vx;
      const newY = this.player.y + vy;

      // Check collision
      if (!this.isWall(newX, this.player.y)) {
        this.player.x = newX;
      }
      if (!this.isWall(this.player.x, newY)) {
        this.player.y = newY;
      }
    }

    // Rotate toward mouse
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
    this.player.angle = Phaser.Math.RadToDeg(angle);

    // Redraw player (rotation)
    this.player.clear();
    this.player.fillStyle(0x4488ff, 1);
    this.player.fillCircle(0, 0, 12);
    this.player.fillStyle(0x00ffff, 1);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.player.fillCircle(cos * 6, sin * 6, 5);

    // Update bullets
    this.bullets.getChildren().forEach(bullet => {
      bullet.x += bullet.vx * delta / 1000;
      bullet.y += bullet.vy * delta / 1000;
      bullet.life -= delta;

      if (bullet.life <= 0 || this.isWall(bullet.x, bullet.y)) {
        bullet.destroy();
        return;
      }

      // Check hit enemies
      this.enemies.getChildren().forEach(enemy => {
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < 14) {
          enemy.hp -= bullet.damage;
          bullet.destroy();

          if (enemy.hp <= 0) {
            enemy.destroy();
            this.gameState.kills++;
            // Random ammo drop
            if (Math.random() < 0.5) {
              this.gameState.ammo = Math.min(this.gameState.maxAmmo, this.gameState.ammo + 5);
            }
          }
        }
      });
    });

    // Update enemies
    this.enemies.getChildren().forEach(enemy => {
      const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

      if (distToPlayer < 200) {
        // Chase player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.x += Math.cos(angle) * ENEMY_SPEED * delta / 1000;
        enemy.y += Math.sin(angle) * ENEMY_SPEED * delta / 1000;

        // Attack if close
        if (distToPlayer < 20) {
          enemy.attackTimer += delta;
          if (enemy.attackTimer > 1000) {
            enemy.attackTimer = 0;
            this.gameState.health -= 10;
            if (this.gameState.health <= 0) {
              this.gameState.health = 0;
              this.gameState.isDead = true;
              this.showGameOver();
            }
          }
        }
      }
    });

    // Check door (level complete)
    const tx = Math.floor(this.player.x / TILE_SIZE);
    const ty = Math.floor(this.player.y / TILE_SIZE);
    if (tx >= 0 && tx < ROOM_WIDTH && ty >= 0 && ty < ROOM_HEIGHT) {
      if (this.room[ty][tx] === DOOR && this.enemies.getChildren().length === 0) {
        this.nextLevel();
      }
      // Medical station heals
      if (this.room[ty][tx] === MEDICAL) {
        if (this.gameState.health < this.gameState.maxHealth) {
          this.gameState.health = Math.min(this.gameState.maxHealth, this.gameState.health + 1);
        }
      }
    }

    // Energy regen
    if (this.gameState.energy < this.gameState.maxEnergy) {
      this.gameState.energy = Math.min(this.gameState.maxEnergy, this.gameState.energy + delta / 1000 * 2);
    }

    this.updateHUD();
  }

  isWall(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= ROOM_WIDTH || ty < 0 || ty >= ROOM_HEIGHT) return true;
    return this.room[ty][tx] === WALL;
  }

  nextLevel() {
    this.gameState.level++;
    this.scene.restart();
  }

  showGameOver() {
    const text = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'GAME OVER\nM.A.R.I.A. WINS',
      { fontFamily: 'monospace', fontSize: '32px', color: '#ff0000', align: 'center' }
    );
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(200);
  }
}

// Game config
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0a0a1a',
  parent: 'game',
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  }
};

// Start game
const game = new Phaser.Game(config);
