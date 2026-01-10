// Using global Phaser from CDN

// Game constants
const TILE_SIZE = 32;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Game state
const gameState = {
  o2: 100,
  maxO2: 100,
  hp: 100,
  maxHp: 100,
  integrity: 100,
  sector: 1,
  power: 4,
  maxPower: 8,
  flashlightOn: true,
  flashlightBattery: 60,
  kills: 0,
  running: false,
  isDead: false,
  hasEscaped: false
};
window.gameState = gameState;

// Room data
const rooms = [];
const enemies = [];
const items = [];

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.visionMask = null;
    this.o2Timer = 0;
    this.integrityTimer = 0;
    this.attackCooldown = 0;
  }

  create() {
    // Generate ship layout
    this.generateShip();

    // Create player
    this.player = this.add.rectangle(
      rooms[0].x * TILE_SIZE + rooms[0].width * TILE_SIZE / 2,
      rooms[0].y * TILE_SIZE + rooms[0].height * TILE_SIZE / 2,
      24, 24, 0x44aa44
    );
    this.player.setDepth(10);

    // Physics
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1);

    // Input
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      e: Phaser.Input.Keyboard.KeyCodes.E
    });

    // Mouse click for attack
    this.input.on('pointerdown', () => this.attack());

    // Flashlight toggle
    this.input.keyboard.on('keydown-F', () => {
      gameState.flashlightOn = !gameState.flashlightOn;
    });

    // Create vision overlay
    this.createVisionSystem();

    // Create HUD
    this.createHUD();

    // Spawn enemies
    this.spawnEnemies();

    // Spawn items
    this.spawnItems();

    console.log('Derelict Ship (Phaser) loaded');
  }

  generateShip() {
    // Clear previous
    rooms.length = 0;

    // Create graphics for walls
    this.wallsGraphics = this.add.graphics();
    this.wallsGraphics.setDepth(1);

    // Generate rooms for current sector
    const numRooms = 4 + Math.floor(Math.random() * 3);
    let currentX = 2;
    let currentY = 2;

    for (let i = 0; i < numRooms; i++) {
      const width = 5 + Math.floor(Math.random() * 4);
      const height = 5 + Math.floor(Math.random() * 4);

      const room = {
        x: currentX,
        y: currentY,
        width,
        height,
        type: i === 0 ? 'start' : (i === numRooms - 1 ? 'exit' : 'normal'),
        hasLifeSupport: Math.random() < 0.2
      };
      rooms.push(room);

      // Draw room
      this.drawRoom(room);

      // Connect to previous room with corridor
      if (i > 0) {
        this.drawCorridor(rooms[i - 1], room);
      }

      // Move to next position
      currentX += width + 3;
      if (currentX > 30) {
        currentX = 2;
        currentY += 10;
      }
    }

    // Set world bounds
    this.physics.world.setBounds(0, 0, 50 * TILE_SIZE, 30 * TILE_SIZE);
    this.cameras.main.setBounds(0, 0, 50 * TILE_SIZE, 30 * TILE_SIZE);
  }

  drawRoom(room) {
    const x = room.x * TILE_SIZE;
    const y = room.y * TILE_SIZE;
    const w = room.width * TILE_SIZE;
    const h = room.height * TILE_SIZE;

    // Floor
    this.wallsGraphics.fillStyle(0x1a1a2a, 1);
    this.wallsGraphics.fillRect(x, y, w, h);

    // Walls
    this.wallsGraphics.lineStyle(3, 0x333355);
    this.wallsGraphics.strokeRect(x, y, w, h);

    // Life support indicator
    if (room.hasLifeSupport) {
      this.wallsGraphics.fillStyle(0x00ff00, 0.3);
      this.wallsGraphics.fillRect(x + 4, y + 4, w - 8, h - 8);
    }

    // Exit marker
    if (room.type === 'exit') {
      this.wallsGraphics.fillStyle(0xff6600, 0.5);
      this.wallsGraphics.fillRect(x + w/2 - 16, y + h/2 - 16, 32, 32);
    }
  }

  drawCorridor(room1, room2) {
    const x1 = room1.x * TILE_SIZE + room1.width * TILE_SIZE / 2;
    const y1 = room1.y * TILE_SIZE + room1.height * TILE_SIZE / 2;
    const x2 = room2.x * TILE_SIZE + room2.width * TILE_SIZE / 2;
    const y2 = room2.y * TILE_SIZE + room2.height * TILE_SIZE / 2;

    this.wallsGraphics.fillStyle(0x151525, 1);
    this.wallsGraphics.fillRect(Math.min(x1, x2), y1 - 16, Math.abs(x2 - x1), 32);
    if (y1 !== y2) {
      this.wallsGraphics.fillRect(x2 - 16, Math.min(y1, y2), 32, Math.abs(y2 - y1));
    }
  }

  createVisionSystem() {
    // Create darkness overlay
    this.darkness = this.add.graphics();
    this.darkness.setDepth(100);

    // Vision cone graphics
    this.visionCone = this.add.graphics();
    this.visionCone.setDepth(99);
  }

  updateVision() {
    // Clear previous
    this.darkness.clear();
    this.visionCone.clear();

    // Get player position and facing direction
    const px = this.player.x;
    const py = this.player.y;
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(px, py, worldPoint.x, worldPoint.y);

    // Vision parameters
    const coneAngle = Math.PI / 2; // 90 degrees
    const visionRange = gameState.flashlightOn ? 200 : 60;

    // Draw full darkness
    this.darkness.fillStyle(0x000000, 0.85);
    this.darkness.fillRect(
      this.cameras.main.scrollX - 100,
      this.cameras.main.scrollY - 100,
      GAME_WIDTH + 200,
      GAME_HEIGHT + 200
    );

    // Cut out vision cone using blend mode
    this.visionCone.fillStyle(0x000000, 1);
    this.visionCone.setBlendMode(Phaser.BlendModes.ERASE);

    // Draw vision cone as triangle fan
    this.visionCone.beginPath();
    this.visionCone.moveTo(px, py);

    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const a = angle - coneAngle / 2 + (coneAngle * i / segments);
      const x = px + Math.cos(a) * visionRange;
      const y = py + Math.sin(a) * visionRange;
      this.visionCone.lineTo(x, y);
    }

    this.visionCone.closePath();
    this.visionCone.fillPath();

    // Small ambient glow around player
    this.visionCone.fillCircle(px, py, 30);
  }

  createHUD() {
    // Create HUD container (fixed to camera)
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(200);

    // Background bars
    const hudBg = this.add.rectangle(GAME_WIDTH / 2, 25, GAME_WIDTH - 20, 40, 0x000000, 0.7);
    this.hudContainer.add(hudBg);

    // O2 bar
    this.add.text(20, 12, 'O2:', { fontSize: '14px', fill: '#88ccff' }).setScrollFactor(0).setDepth(201);
    this.o2Bar = this.add.rectangle(100, 20, 150, 16, 0x3399ff);
    this.o2Bar.setOrigin(0, 0.5);
    this.o2Bar.setScrollFactor(0);
    this.o2Bar.setDepth(201);

    // HP bar
    this.add.text(270, 12, 'HP:', { fontSize: '14px', fill: '#ff8888' }).setScrollFactor(0).setDepth(201);
    this.hpBar = this.add.rectangle(340, 20, 150, 16, 0xff4444);
    this.hpBar.setOrigin(0, 0.5);
    this.hpBar.setScrollFactor(0);
    this.hpBar.setDepth(201);

    // Integrity
    this.integrityText = this.add.text(520, 12, 'INTEGRITY: 100%', { fontSize: '14px', fill: '#ffcc00' });
    this.integrityText.setScrollFactor(0);
    this.integrityText.setDepth(201);

    // Sector
    this.sectorText = this.add.text(700, 12, 'SECTOR 1', { fontSize: '14px', fill: '#aaaaaa' });
    this.sectorText.setScrollFactor(0);
    this.sectorText.setDepth(201);

    // Bottom HUD
    this.flashlightText = this.add.text(20, GAME_HEIGHT - 30, 'FLASHLIGHT: ON', { fontSize: '12px', fill: '#ffff88' });
    this.flashlightText.setScrollFactor(0);
    this.flashlightText.setDepth(201);

    this.killsText = this.add.text(GAME_WIDTH - 100, GAME_HEIGHT - 30, 'KILLS: 0', { fontSize: '12px', fill: '#ff6666' });
    this.killsText.setScrollFactor(0);
    this.killsText.setDepth(201);
  }

  updateHUD() {
    // Update bars
    this.o2Bar.width = 150 * (gameState.o2 / gameState.maxO2);
    this.hpBar.width = 150 * (gameState.hp / gameState.maxHp);

    // Update colors based on critical levels
    if (gameState.o2 < 20) {
      this.o2Bar.setFillStyle(0xff0000);
    } else {
      this.o2Bar.setFillStyle(0x3399ff);
    }

    if (gameState.hp < 25) {
      this.hpBar.setFillStyle(0xff0000);
    } else {
      this.hpBar.setFillStyle(0xff4444);
    }

    // Update texts
    this.integrityText.setText('INTEGRITY: ' + Math.floor(gameState.integrity) + '%');
    this.sectorText.setText('SECTOR ' + gameState.sector);
    this.flashlightText.setText('FLASHLIGHT: ' + (gameState.flashlightOn ? 'ON' : 'OFF'));
    this.killsText.setText('KILLS: ' + gameState.kills);

    // Critical warnings
    if (gameState.integrity < 25) {
      this.integrityText.setFill('#ff0000');
    }
  }

  spawnEnemies() {
    enemies.length = 0;

    // Spawn enemies in rooms (not starting room)
    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const enemyCount = room.type === 'exit' ? 2 : 1;

      for (let j = 0; j < enemyCount; j++) {
        const ex = (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE;
        const ey = (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE;

        const type = gameState.sector <= 2 ? 'crawler' : (Math.random() < 0.5 ? 'shambler' : 'stalker');
        const stats = this.getEnemyStats(type);

        const enemy = this.add.rectangle(ex, ey, 28, 28, stats.color);
        enemy.setDepth(9);
        this.physics.add.existing(enemy);

        enemy.data = {
          type,
          hp: stats.hp,
          maxHp: stats.hp,
          damage: stats.damage,
          speed: stats.speed,
          detectionRange: stats.detectionRange,
          attackCooldown: 0,
          state: 'patrol',
          patrolTarget: { x: ex, y: ey }
        };

        enemies.push(enemy);
      }
    }
  }

  getEnemyStats(type) {
    const stats = {
      crawler: { hp: 30, damage: 15, speed: 80, detectionRange: 250, color: 0x884422 },
      shambler: { hp: 60, damage: 25, speed: 50, detectionRange: 200, color: 0x446644 },
      stalker: { hp: 45, damage: 20, speed: 150, detectionRange: 350, color: 0x442244 }
    };
    return stats[type] || stats.crawler;
  }

  spawnItems() {
    items.length = 0;

    // Spawn O2 canisters and medkits
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (Math.random() < 0.5) {
        const ix = (room.x + 1 + Math.random() * (room.width - 2)) * TILE_SIZE;
        const iy = (room.y + 1 + Math.random() * (room.height - 2)) * TILE_SIZE;

        const type = Math.random() < 0.6 ? 'o2_small' : 'medkit_small';
        const item = this.add.rectangle(ix, iy, 16, 16, type === 'o2_small' ? 0x00aaff : 0xff4444);
        item.setDepth(5);

        item.data = { type, collected: false };
        items.push(item);
      }
    }
  }

  attack() {
    if (this.attackCooldown > 0 || gameState.isDead) return;

    this.attackCooldown = 600; // ms
    gameState.o2 -= 2; // Combat O2 cost

    // Get attack direction
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    // Attack range
    const range = 50;
    const attackX = this.player.x + Math.cos(angle) * range;
    const attackY = this.player.y + Math.sin(angle) * range;

    // Visual feedback
    const attackVisual = this.add.circle(attackX, attackY, 20, 0xffffff, 0.5);
    attackVisual.setDepth(15);
    this.time.delayedCall(100, () => attackVisual.destroy());

    // Check enemy hits
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);

      if (dist < 40) {
        enemy.data.hp -= 20; // Melee damage

        // Flash enemy
        enemy.setFillStyle(0xffffff);
        this.time.delayedCall(100, () => {
          if (enemy.data.hp > 0) {
            enemy.setFillStyle(this.getEnemyStats(enemy.data.type).color);
          }
        });

        if (enemy.data.hp <= 0) {
          enemy.destroy();
          enemies.splice(i, 1);
          gameState.kills++;
        }
      }
    }
  }

  update(time, delta) {
    if (gameState.isDead || gameState.hasEscaped) return;

    // Movement
    const speed = gameState.running ? 200 : 120;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown) vx = -speed;
    if (this.cursors.right.isDown) vx = speed;
    if (this.cursors.up.isDown) vy = -speed;
    if (this.cursors.down.isDown) vy = speed;

    gameState.running = this.cursors.shift.isDown && (vx !== 0 || vy !== 0);

    this.player.body.setVelocity(vx, vy);

    // O2 drain
    this.o2Timer += delta;
    let drainInterval = 2000; // idle: -1 per 2s
    if (vx !== 0 || vy !== 0) {
      drainInterval = gameState.running ? 750 : 1500;
    }

    if (this.o2Timer >= drainInterval) {
      this.o2Timer = 0;

      // Check if in life support room
      let inLifeSupport = false;
      for (const room of rooms) {
        if (room.hasLifeSupport) {
          const rx = room.x * TILE_SIZE;
          const ry = room.y * TILE_SIZE;
          const rw = room.width * TILE_SIZE;
          const rh = room.height * TILE_SIZE;
          if (this.player.x >= rx && this.player.x <= rx + rw &&
              this.player.y >= ry && this.player.y <= ry + rh) {
            inLifeSupport = true;
            break;
          }
        }
      }

      if (inLifeSupport) {
        gameState.o2 = Math.min(gameState.maxO2, gameState.o2 + 5);
      } else {
        gameState.o2 -= 1;
      }
    }

    // Integrity decay
    this.integrityTimer += delta;
    if (this.integrityTimer >= 45000) {
      this.integrityTimer = 0;
      gameState.integrity -= 1;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Update enemies
    this.updateEnemies(delta);

    // Check item collection
    this.checkItemCollection();

    // Check death conditions
    if (gameState.o2 <= 0) {
      this.gameOver('SUFFOCATED');
    } else if (gameState.hp <= 0) {
      this.gameOver('KILLED');
    } else if (gameState.integrity <= 0) {
      this.gameOver('SHIP DESTROYED');
    }

    // Check win (at exit with all enemies killed)
    const exitRoom = rooms.find(r => r.type === 'exit');
    if (exitRoom && enemies.length === 0) {
      const rx = exitRoom.x * TILE_SIZE;
      const ry = exitRoom.y * TILE_SIZE;
      const rw = exitRoom.width * TILE_SIZE;
      const rh = exitRoom.height * TILE_SIZE;
      if (this.player.x >= rx && this.player.x <= rx + rw &&
          this.player.y >= ry && this.player.y <= ry + rh) {
        if (gameState.sector < 6) {
          gameState.sector++;
          this.generateShip();
          this.player.setPosition(
            rooms[0].x * TILE_SIZE + rooms[0].width * TILE_SIZE / 2,
            rooms[0].y * TILE_SIZE + rooms[0].height * TILE_SIZE / 2
          );
          this.spawnEnemies();
          this.spawnItems();
        } else {
          this.victory();
        }
      }
    }

    // Update vision
    this.updateVision();

    // Update HUD
    this.updateHUD();
  }

  updateEnemies(delta) {
    for (const enemy of enemies) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

      // Detection
      if (dist < enemy.data.detectionRange) {
        enemy.data.state = 'chase';
      } else if (enemy.data.state === 'chase' && dist > enemy.data.detectionRange * 1.5) {
        enemy.data.state = 'patrol';
      }

      // Movement
      if (enemy.data.state === 'chase') {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.data.speed,
          Math.sin(angle) * enemy.data.speed
        );

        // Attack if close
        if (dist < 30 && enemy.data.attackCooldown <= 0) {
          gameState.hp -= enemy.data.damage;
          enemy.data.attackCooldown = 1000;

          // Flash screen red
          this.cameras.main.flash(100, 255, 0, 0);
        }
      } else {
        // Simple patrol
        const patrolDist = Phaser.Math.Distance.Between(
          enemy.x, enemy.y,
          enemy.data.patrolTarget.x, enemy.data.patrolTarget.y
        );

        if (patrolDist < 10) {
          // New patrol target within room
          enemy.data.patrolTarget = {
            x: enemy.x + (Math.random() - 0.5) * 100,
            y: enemy.y + (Math.random() - 0.5) * 100
          };
        }

        const angle = Phaser.Math.Angle.Between(
          enemy.x, enemy.y,
          enemy.data.patrolTarget.x, enemy.data.patrolTarget.y
        );
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.data.speed * 0.3,
          Math.sin(angle) * enemy.data.speed * 0.3
        );
      }

      // Cooldown
      if (enemy.data.attackCooldown > 0) {
        enemy.data.attackCooldown -= delta;
      }
    }
  }

  checkItemCollection() {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.data.collected) continue;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (dist < 25) {
        item.data.collected = true;
        item.destroy();

        if (item.data.type === 'o2_small') {
          gameState.o2 = Math.min(gameState.maxO2, gameState.o2 + 25);
        } else if (item.data.type === 'medkit_small') {
          gameState.hp = Math.min(gameState.maxHp, gameState.hp + 30);
        }

        items.splice(i, 1);
      }
    }
  }

  gameOver(reason) {
    gameState.isDead = true;

    const gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER\n' + reason, {
      fontSize: '48px',
      fill: '#ff0000',
      align: 'center'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(300);
  }

  victory() {
    gameState.hasEscaped = true;

    const victoryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'ESCAPED!\nYou survived the derelict ship', {
      fontSize: '36px',
      fill: '#00ff00',
      align: 'center'
    });
    victoryText.setOrigin(0.5);
    victoryText.setScrollFactor(0);
    victoryText.setDepth(300);
  }
}

// Phaser config
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: GameScene
};

const game = new Phaser.Game(config);
