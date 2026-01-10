// System Shock 2D - Polished Twin-Stick Shooter
// Cyberpunk survival horror with visual effects

// Color palette (Cyberpunk)
const PALETTE = {
  bg: 0x0a0a12,
  bgLight: 0x141428,
  floor: 0x1a1a2e,
  floorLight: 0x252540,
  wall: 0x2d2d44,
  wallLight: 0x3d3d5c,
  player: 0x00ffcc,
  playerGlow: 0x00ffcc,
  enemy: 0xff3366,
  enemyGlow: 0xff6699,
  bullet: 0x00ff99,
  bulletEnemy: 0xff6666,
  health: 0x00ff66,
  energy: 0x00ccff,
  ammo: 0xffcc00,
  text: 0xffffff,
  textDim: 0x666688
};

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: PALETTE.bg,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [TitleScene, GameScene, GameOverScene]
};

// Title Scene
function TitleScene() {
  Phaser.Scene.call(this, { key: 'TitleScene' });
}
TitleScene.prototype = Object.create(Phaser.Scene.prototype);
TitleScene.prototype.constructor = TitleScene;

TitleScene.prototype.create = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;
  
  // Animated grid background
  this.gridGraphics = this.add.graphics();
  this.gridTime = 0;
  
  // Glow effect
  const glow = this.add.graphics();
  glow.fillGradientStyle(PALETTE.playerGlow, PALETTE.playerGlow, PALETTE.bg, PALETTE.bg, 0.3);
  glow.fillEllipse(width/2, 200, 400, 200);
  
  // Title with shadow
  this.add.text(width/2 + 3, 153, 'CITADEL', {
    fontFamily: 'Orbitron',
    fontSize: '64px',
    color: '#000000'
  }).setOrigin(0.5);
  
  this.add.text(width/2, 150, 'CITADEL', {
    fontFamily: 'Orbitron',
    fontSize: '64px',
    color: '#00ffcc'
  }).setOrigin(0.5);
  
  // Subtitle
  this.add.text(width/2, 210, 'STATION BREACH', {
    fontFamily: 'Share Tech Mono',
    fontSize: '24px',
    color: '#666688'
  }).setOrigin(0.5);
  
  // Instructions
  this.add.text(width/2, 320, 'WASD - MOVE   |   MOUSE - AIM   |   CLICK - FIRE', {
    fontFamily: 'Share Tech Mono',
    fontSize: '16px',
    color: '#888888'
  }).setOrigin(0.5);
  
  this.add.text(width/2, 350, 'SHIFT - SPRINT   |   R - RELOAD', {
    fontFamily: 'Share Tech Mono',
    fontSize: '16px',
    color: '#888888'
  }).setOrigin(0.5);
  
  // Flashing start text
  this.startText = this.add.text(width/2, 450, '[ CLICK TO BEGIN ]', {
    fontFamily: 'Orbitron',
    fontSize: '20px',
    color: '#00ffcc'
  }).setOrigin(0.5);
  
  this.tweens.add({
    targets: this.startText,
    alpha: 0.3,
    duration: 800,
    yoyo: true,
    repeat: -1
  });
  
  // Click to start
  this.input.on('pointerdown', () => {
    this.scene.start('GameScene');
  });
  
  // Scan lines
  this.scanLines = this.add.graphics();
  this.scanLines.lineStyle(1, 0xffffff, 0.03);
  for (let y = 0; y < height; y += 3) {
    this.scanLines.lineBetween(0, y, width, y);
  }
};

TitleScene.prototype.update = function(time, delta) {
  this.gridTime += delta * 0.001;
  this.gridGraphics.clear();
  this.gridGraphics.lineStyle(1, PALETTE.floorLight, 0.2);
  
  const offset = (this.gridTime * 30) % 40;
  for (let x = -40 + offset; x < 840; x += 40) {
    this.gridGraphics.lineBetween(x, 0, x + 200, 600);
  }
  for (let y = -40 + offset; y < 640; y += 40) {
    this.gridGraphics.lineBetween(0, y, 800, y);
  }
};

// Game Scene
function GameScene() {
  Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.create = function() {
  this.score = 0;
  this.hp = 100;
  this.maxHp = 100;
  this.energy = 100;
  this.ammo = 50;
  this.maxAmmo = 50;
  this.level = 1;
  this.kills = 0;
  
  // Expose for testing
  window.gameState = {
    hp: this.hp,
    energy: this.energy,
    ammo: this.ammo,
    level: this.level,
    score: this.score
  };
  
  // Groups
  this.bullets = this.physics.add.group();
  this.enemyBullets = this.physics.add.group();
  this.enemies = this.physics.add.group();
  this.particles = this.add.group();
  
  // Generate room
  this.generateRoom();
  
  // Create player
  this.createPlayer();
  
  // Input
  this.cursors = this.input.keyboard.addKeys({
    up: 'W', down: 'S', left: 'A', right: 'D',
    shift: 'SHIFT', reload: 'R'
  });
  
  this.input.on('pointerdown', () => this.fire());
  
  // Collisions
  this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
  this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
  this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
  
  // Camera
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  this.cameras.main.setZoom(1);
  
  // HUD
  this.createHUD();
  
  // Ambient particles
  this.createAmbientParticles();
  
  console.log('System Shock 2D Polished loaded');
};

GameScene.prototype.generateRoom = function() {
  const ROOM_W = 25;
  const ROOM_H = 19;
  const TILE = 32;
  
  this.room = [];
  this.wallGraphics = this.add.graphics();
  this.floorGraphics = this.add.graphics();
  
  // Generate room data
  for (let y = 0; y < ROOM_H; y++) {
    const row = [];
    for (let x = 0; x < ROOM_W; x++) {
      if (x === 0 || x === ROOM_W - 1 || y === 0 || y === ROOM_H - 1) {
        row.push(1);
      } else {
        row.push(0);
      }
    }
    this.room.push(row);
  }
  
  // Internal walls
  for (let i = 0; i < 8 + this.level * 2; i++) {
    const wx = Phaser.Math.Between(3, ROOM_W - 4);
    const wy = Phaser.Math.Between(3, ROOM_H - 4);
    const len = Phaser.Math.Between(2, 4);
    const horiz = Math.random() > 0.5;
    for (let j = 0; j < len; j++) {
      if (horiz && wx + j < ROOM_W - 1) this.room[wy][wx + j] = 1;
      else if (!horiz && wy + j < ROOM_H - 1) this.room[wy + j][wx] = 1;
    }
  }
  
  // Draw floor with grid
  this.floorGraphics.fillStyle(PALETTE.floor);
  this.floorGraphics.fillRect(0, 0, ROOM_W * TILE, ROOM_H * TILE);
  
  this.floorGraphics.lineStyle(1, PALETTE.floorLight, 0.3);
  for (let x = 0; x <= ROOM_W; x++) {
    this.floorGraphics.lineBetween(x * TILE, 0, x * TILE, ROOM_H * TILE);
  }
  for (let y = 0; y <= ROOM_H; y++) {
    this.floorGraphics.lineBetween(0, y * TILE, ROOM_W * TILE, y * TILE);
  }
  
  // Draw walls with 3D effect
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      if (this.room[y][x] === 1) {
        const px = x * TILE;
        const py = y * TILE;
        
        // Wall base
        this.wallGraphics.fillStyle(PALETTE.wall);
        this.wallGraphics.fillRect(px, py, TILE, TILE);
        
        // Top highlight
        this.wallGraphics.fillStyle(PALETTE.wallLight);
        this.wallGraphics.fillRect(px, py, TILE, 4);
        this.wallGraphics.fillRect(px, py, 4, TILE);
        
        // Bottom shadow
        this.wallGraphics.fillStyle(PALETTE.bg);
        this.wallGraphics.fillRect(px + TILE - 4, py, 4, TILE);
        this.wallGraphics.fillRect(px, py + TILE - 4, TILE, 4);
      }
    }
  }
  
  // Create wall collision bodies
  this.walls = this.physics.add.staticGroup();
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      if (this.room[y][x] === 1) {
        const wall = this.walls.create(x * TILE + TILE/2, y * TILE + TILE/2, null);
        wall.setSize(TILE, TILE);
        wall.setVisible(false);
      }
    }
  }
  
  // Spawn enemies
  this.spawnEnemies();
};

GameScene.prototype.spawnEnemies = function() {
  const count = 3 + this.level * 2;
  const TILE = 32;
  
  for (let i = 0; i < count; i++) {
    let ex, ey;
    do {
      ex = Phaser.Math.Between(3, 22);
      ey = Phaser.Math.Between(3, 16);
    } while (this.room[ey][ex] !== 0);
    
    const enemy = this.add.graphics();
    enemy.x = ex * TILE + TILE / 2;
    enemy.y = ey * TILE + TILE / 2;
    
    // Draw enemy
    enemy.fillStyle(PALETTE.enemy);
    enemy.fillCircle(0, 0, 12);
    enemy.fillStyle(0xffff00);
    enemy.fillCircle(-4, -3, 2);
    enemy.fillCircle(4, -3, 2);
    
    this.physics.add.existing(enemy);
    enemy.body.setCircle(12);
    enemy.body.setOffset(-12, -12);
    
    enemy.hp = 30 + this.level * 10;
    enemy.maxHp = enemy.hp;
    enemy.speed = 60 + this.level * 10;
    enemy.fireCooldown = 0;
    enemy.state = 'patrol';
    enemy.dir = Math.random() * Math.PI * 2;
    
    this.enemies.add(enemy);
    this.physics.add.collider(enemy, this.walls);
  }
};

GameScene.prototype.createPlayer = function() {
  const TILE = 32;
  this.player = this.add.graphics();
  this.player.x = 3 * TILE + TILE / 2;
  this.player.y = 3 * TILE + TILE / 2;
  
  // Player glow
  this.player.fillStyle(PALETTE.playerGlow, 0.2);
  this.player.fillCircle(0, 0, 25);
  
  // Player body
  this.player.fillStyle(PALETTE.player);
  this.player.fillCircle(0, 0, 12);
  
  // Direction indicator
  this.player.fillStyle(0xffffff);
  this.player.fillTriangle(12, 0, 8, -4, 8, 4);
  
  this.physics.add.existing(this.player);
  this.player.body.setCircle(12);
  this.player.body.setOffset(-12, -12);
  this.physics.add.collider(this.player, this.walls);
  
  this.player.angle = 0;
};

GameScene.prototype.createHUD = function() {
  this.hudContainer = this.add.container(0, 0);
  this.hudContainer.setScrollFactor(0);
  
  // HUD background
  const hudBg = this.add.graphics();
  hudBg.fillStyle(0x000000, 0.7);
  hudBg.fillRect(10, 10, 200, 90);
  hudBg.lineStyle(2, PALETTE.playerGlow, 0.5);
  hudBg.strokeRect(10, 10, 200, 90);
  this.hudContainer.add(hudBg);
  
  // HP bar
  this.hpBarBg = this.add.graphics();
  this.hpBarBg.fillStyle(0x333333);
  this.hpBarBg.fillRect(70, 20, 130, 12);
  this.hudContainer.add(this.hpBarBg);
  
  this.hpBar = this.add.graphics();
  this.hudContainer.add(this.hpBar);
  
  this.hpLabel = this.add.text(20, 18, 'HP', {
    fontFamily: 'Share Tech Mono',
    fontSize: '14px',
    color: '#00ff66'
  });
  this.hudContainer.add(this.hpLabel);
  
  // Energy bar
  this.energyBarBg = this.add.graphics();
  this.energyBarBg.fillStyle(0x333333);
  this.energyBarBg.fillRect(70, 40, 130, 12);
  this.hudContainer.add(this.energyBarBg);
  
  this.energyBar = this.add.graphics();
  this.hudContainer.add(this.energyBar);
  
  this.energyLabel = this.add.text(20, 38, 'EN', {
    fontFamily: 'Share Tech Mono',
    fontSize: '14px',
    color: '#00ccff'
  });
  this.hudContainer.add(this.energyLabel);
  
  // Ammo bar
  this.ammoBarBg = this.add.graphics();
  this.ammoBarBg.fillStyle(0x333333);
  this.ammoBarBg.fillRect(70, 60, 130, 12);
  this.hudContainer.add(this.ammoBarBg);
  
  this.ammoBar = this.add.graphics();
  this.hudContainer.add(this.ammoBar);
  
  this.ammoLabel = this.add.text(20, 58, 'AM', {
    fontFamily: 'Share Tech Mono',
    fontSize: '14px',
    color: '#ffcc00'
  });
  this.hudContainer.add(this.ammoLabel);
  
  // Ammo count
  this.ammoText = this.add.text(205, 58, '50/50', {
    fontFamily: 'Share Tech Mono',
    fontSize: '14px',
    color: '#ffcc00'
  });
  this.hudContainer.add(this.ammoText);
  
  // Level and score (top right)
  this.levelText = this.add.text(780, 20, 'LEVEL 1', {
    fontFamily: 'Orbitron',
    fontSize: '16px',
    color: '#00ffcc'
  }).setOrigin(1, 0);
  this.hudContainer.add(this.levelText);
  
  this.scoreText = this.add.text(780, 45, 'SCORE: 0', {
    fontFamily: 'Share Tech Mono',
    fontSize: '14px',
    color: '#ffffff'
  }).setOrigin(1, 0);
  this.hudContainer.add(this.scoreText);
  
  this.enemyText = this.add.text(780, 70, 'HOSTILES: 0', {
    fontFamily: 'Share Tech Mono',
    fontSize: '14px',
    color: '#ff3366'
  }).setOrigin(1, 0);
  this.hudContainer.add(this.enemyText);
};

GameScene.prototype.createAmbientParticles = function() {
  // Dust particles
  for (let i = 0; i < 20; i++) {
    const p = this.add.graphics();
    p.fillStyle(0xffffff, 0.1);
    p.fillCircle(0, 0, 2);
    p.x = Phaser.Math.Between(0, 800);
    p.y = Phaser.Math.Between(0, 600);
    p.vx = (Math.random() - 0.5) * 0.5;
    p.vy = (Math.random() - 0.5) * 0.5;
    this.particles.add(p);
  }
};

GameScene.prototype.fire = function() {
  if (this.ammo <= 0) return;
  this.ammo--;
  
  // Screen shake
  this.cameras.main.shake(50, 0.003);
  
  // Muzzle flash
  const flashX = this.player.x + Math.cos(this.player.rotation) * 20;
  const flashY = this.player.y + Math.sin(this.player.rotation) * 20;
  const flash = this.add.graphics();
  flash.fillStyle(PALETTE.bullet, 0.8);
  flash.fillCircle(flashX, flashY, 8);
  this.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 100,
    onComplete: () => flash.destroy()
  });
  
  // Bullet
  const bullet = this.add.graphics();
  bullet.fillStyle(PALETTE.bullet);
  bullet.fillCircle(0, 0, 4);
  bullet.x = flashX;
  bullet.y = flashY;
  
  this.physics.add.existing(bullet);
  bullet.body.setCircle(4);
  bullet.body.setOffset(-4, -4);
  
  const speed = 500;
  bullet.body.setVelocity(
    Math.cos(this.player.rotation) * speed,
    Math.sin(this.player.rotation) * speed
  );
  
  this.bullets.add(bullet);
  
  // Destroy after 2 seconds
  this.time.delayedCall(2000, () => {
    if (bullet.active) bullet.destroy();
  });
};

GameScene.prototype.spawnParticles = function(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const p = this.add.graphics();
    p.fillStyle(color);
    p.fillCircle(0, 0, 3);
    p.x = x;
    p.y = y;
    
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    p.vx = Math.cos(angle) * spd;
    p.vy = Math.sin(angle) * spd;
    p.life = 30;
    
    this.particles.add(p);
  }
};

GameScene.prototype.bulletHitEnemy = function(bullet, enemy) {
  bullet.destroy();
  enemy.hp -= 20;
  
  this.spawnParticles(enemy.x, enemy.y, PALETTE.enemyGlow, 5, 3);
  this.cameras.main.shake(30, 0.002);
  
  if (enemy.hp <= 0) {
    this.spawnParticles(enemy.x, enemy.y, PALETTE.enemy, 15, 5);
    this.score += 100;
    this.kills++;
    enemy.destroy();
    
    if (this.enemies.countActive() === 0) {
      // Level complete
      this.level++;
      this.time.delayedCall(1000, () => {
        this.regenerateLevel();
      });
    }
  }
};

GameScene.prototype.enemyBulletHitPlayer = function(bullet, player) {
  bullet.destroy();
  this.hp -= 15;
  
  this.spawnParticles(player.x, player.y, PALETTE.health, 3, 2);
  this.cameras.main.shake(100, 0.01);
  
  if (this.hp <= 0) {
    this.scene.start('GameOverScene', { score: this.score, level: this.level });
  }
};

GameScene.prototype.playerHitEnemy = function(player, enemy) {
  this.hp -= 5;
  this.cameras.main.shake(50, 0.005);
  
  // Knockback
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  player.body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
};

GameScene.prototype.regenerateLevel = function() {
  // Clear old level
  this.enemies.clear(true, true);
  this.bullets.clear(true, true);
  this.enemyBullets.clear(true, true);
  this.walls.clear(true, true);
  this.wallGraphics.clear();
  this.floorGraphics.clear();
  
  // Reset player position
  this.player.x = 100;
  this.player.y = 100;
  
  // Generate new room
  this.generateRoom();
};

GameScene.prototype.updateHUD = function() {
  // HP bar
  this.hpBar.clear();
  this.hpBar.fillStyle(PALETTE.health);
  this.hpBar.fillRect(70, 20, 130 * (this.hp / this.maxHp), 12);
  
  // Energy bar
  this.energyBar.clear();
  this.energyBar.fillStyle(PALETTE.energy);
  this.energyBar.fillRect(70, 40, 130 * (this.energy / 100), 12);
  
  // Ammo bar
  this.ammoBar.clear();
  this.ammoBar.fillStyle(PALETTE.ammo);
  this.ammoBar.fillRect(70, 60, 130 * (this.ammo / this.maxAmmo), 12);
  
  this.ammoText.setText(this.ammo + '/' + this.maxAmmo);
  this.levelText.setText('LEVEL ' + this.level);
  this.scoreText.setText('SCORE: ' + this.score);
  this.enemyText.setText('HOSTILES: ' + this.enemies.countActive());
  
  // Update exposed state
  window.gameState = {
    hp: this.hp,
    energy: this.energy,
    ammo: this.ammo,
    level: this.level,
    score: this.score
  };
};

GameScene.prototype.update = function(time, delta) {
  if (!this.player.active) return;
  
  // Player movement
  const speed = this.cursors.shift.isDown ? 200 : 120;
  let vx = 0, vy = 0;
  
  if (this.cursors.up.isDown) vy = -speed;
  if (this.cursors.down.isDown) vy = speed;
  if (this.cursors.left.isDown) vx = -speed;
  if (this.cursors.right.isDown) vx = speed;
  
  this.player.body.setVelocity(vx, vy);
  
  // Player rotation follows mouse
  const pointer = this.input.activePointer;
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  this.player.rotation = Math.atan2(worldPoint.y - this.player.y, worldPoint.x - this.player.x);
  
  // Redraw player to show rotation
  this.player.clear();
  this.player.fillStyle(PALETTE.playerGlow, 0.2);
  this.player.fillCircle(0, 0, 25);
  this.player.fillStyle(PALETTE.player);
  this.player.fillCircle(0, 0, 12);
  this.player.fillStyle(0xffffff);
  this.player.fillTriangle(12, 0, 8, -4, 8, 4);
  
  // Reload
  if (this.cursors.reload.isDown && this.ammo < this.maxAmmo) {
    this.ammo = this.maxAmmo;
  }
  
  // Energy drain
  if (this.cursors.shift.isDown) {
    this.energy = Math.max(0, this.energy - delta * 0.02);
  } else {
    this.energy = Math.min(100, this.energy + delta * 0.005);
  }
  
  // Update enemies
  this.enemies.getChildren().forEach(enemy => {
    if (!enemy.active) return;
    
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    
    if (dist < 200) {
      // Chase
      const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.body.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
      
      // Fire
      enemy.fireCooldown -= delta;
      if (enemy.fireCooldown <= 0 && dist < 300) {
        enemy.fireCooldown = 1500 + Math.random() * 1000;
        this.enemyFire(enemy);
      }
    } else {
      // Patrol
      if (Math.random() < 0.01) enemy.dir = Math.random() * Math.PI * 2;
      enemy.body.setVelocity(Math.cos(enemy.dir) * enemy.speed * 0.3, Math.sin(enemy.dir) * enemy.speed * 0.3);
    }
    
    // Redraw enemy
    enemy.clear();
    enemy.fillStyle(PALETTE.enemy);
    enemy.fillCircle(0, 0, 12);
    enemy.fillStyle(0xffff00);
    enemy.fillCircle(-4, -3, 2);
    enemy.fillCircle(4, -3, 2);
  });
  
  // Update particles
  this.particles.getChildren().forEach(p => {
    if (p.vx !== undefined) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      if (p.life !== undefined) {
        p.life--;
        p.alpha = p.life / 30;
        if (p.life <= 0) p.destroy();
      }
    }
  });
  
  // Update HUD
  this.updateHUD();
};

GameScene.prototype.enemyFire = function(enemy) {
  const bullet = this.add.graphics();
  bullet.fillStyle(PALETTE.bulletEnemy);
  bullet.fillCircle(0, 0, 3);
  bullet.x = enemy.x;
  bullet.y = enemy.y;
  
  this.physics.add.existing(bullet);
  bullet.body.setCircle(3);
  bullet.body.setOffset(-3, -3);
  
  const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
  const speed = 250;
  bullet.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  
  this.enemyBullets.add(bullet);
  
  this.time.delayedCall(3000, () => {
    if (bullet.active) bullet.destroy();
  });
};

// Game Over Scene
function GameOverScene() {
  Phaser.Scene.call(this, { key: 'GameOverScene' });
}
GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
GameOverScene.prototype.constructor = GameOverScene;

GameOverScene.prototype.init = function(data) {
  this.finalScore = data.score || 0;
  this.finalLevel = data.level || 1;
};

GameOverScene.prototype.create = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;
  
  // Dark overlay
  this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
  
  // Red vignette
  const vignette = this.add.graphics();
  vignette.fillGradientStyle(0xff0000, 0xff0000, 0x000000, 0x000000, 0.3);
  vignette.fillRect(0, 0, width, height);
  
  // Game over text
  this.add.text(width/2, 180, 'NEURAL LINK SEVERED', {
    fontFamily: 'Orbitron',
    fontSize: '40px',
    color: '#ff3366'
  }).setOrigin(0.5);
  
  this.add.text(width/2, 280, 'FINAL SCORE: ' + this.finalScore, {
    fontFamily: 'Share Tech Mono',
    fontSize: '28px',
    color: '#ffffff'
  }).setOrigin(0.5);
  
  this.add.text(width/2, 330, 'LEVEL REACHED: ' + this.finalLevel, {
    fontFamily: 'Share Tech Mono',
    fontSize: '20px',
    color: '#888888'
  }).setOrigin(0.5);
  
  const retryText = this.add.text(width/2, 450, '[ CLICK TO RETRY ]', {
    fontFamily: 'Orbitron',
    fontSize: '20px',
    color: '#00ffcc'
  }).setOrigin(0.5);
  
  this.tweens.add({
    targets: retryText,
    alpha: 0.3,
    duration: 800,
    yoyo: true,
    repeat: -1
  });
  
  this.input.on('pointerdown', () => {
    this.scene.start('GameScene');
  });
};

// Start game
const game = new Phaser.Game(config);
