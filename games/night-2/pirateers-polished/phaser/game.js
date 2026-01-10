// Pirateers Polished - Naval Combat with Phaser 3
// Rich visual effects: water, particles, screen shake, glow

// Sea color palette (Stormy Waters)
const PALETTE = {
  deepSea: 0x0a1628,
  sea: 0x0d4a6f,
  seaLight: 0x1a6a9f,
  foam: 0x8bc4e8,
  playerHull: 0x8b4513,
  playerSail: 0xffffff,
  enemy: 0x333333,
  merchant: 0xc4a87c,
  navy: 0x1a3a6e,
  ghost: 0x33aa77,
  gold: 0xffd700,
  cannonball: 0x222222,
  fire: 0xff6600,
  smoke: 0x444444,
  health: 0xcc3333,
  healthBg: 0x333333
};

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: PALETTE.deepSea,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [TitleScene, GameScene, PortScene, GameOverScene]
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

  // Animated water background
  this.waterGraphics = this.add.graphics();
  this.waterTime = 0;

  // Title glow
  const glow = this.add.graphics();
  glow.fillStyle(PALETTE.gold, 0.2);
  glow.fillEllipse(width/2, 180, 500, 150);

  // Title shadow
  this.add.text(width/2 + 4, 154, 'PIRATEERS', {
    fontFamily: 'Pirata One',
    fontSize: '96px',
    color: '#000000'
  }).setOrigin(0.5);

  // Main title
  this.add.text(width/2, 150, 'PIRATEERS', {
    fontFamily: 'Pirata One',
    fontSize: '96px',
    color: '#ffd700'
  }).setOrigin(0.5);

  // Subtitle
  this.add.text(width/2, 240, 'Command the Seas', {
    fontFamily: 'Cinzel',
    fontSize: '28px',
    color: '#88aacc'
  }).setOrigin(0.5);

  // Instructions
  this.add.text(width/2, 380, 'WASD - Sail   |   MOUSE - Aim   |   CLICK - Fire', {
    fontFamily: 'Cinzel',
    fontSize: '18px',
    color: '#668899'
  }).setOrigin(0.5);

  this.add.text(width/2, 420, 'E - Dock at Port   |   1-4 - Switch Weapons', {
    fontFamily: 'Cinzel',
    fontSize: '18px',
    color: '#668899'
  }).setOrigin(0.5);

  // Start prompt
  this.startText = this.add.text(width/2, 550, '[ CLICK TO SET SAIL ]', {
    fontFamily: 'Pirata One',
    fontSize: '32px',
    color: '#ffd700'
  }).setOrigin(0.5);

  this.tweens.add({
    targets: this.startText,
    alpha: 0.4,
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  this.input.on('pointerdown', () => {
    this.scene.start('GameScene');
  });

  // Expose for testing
  window.gameState = { screen: 'title' };
};

TitleScene.prototype.update = function(time, delta) {
  this.waterTime += delta * 0.001;
  this.waterGraphics.clear();

  // Draw animated waves
  for (let layer = 0; layer < 5; layer++) {
    const y = 500 + layer * 60;
    const alpha = 0.3 - layer * 0.05;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 13, g: 74, b: 111 },
      { r: 26, g: 106, b: 159 },
      10, layer * 2
    );
    this.waterGraphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), alpha);

    this.waterGraphics.beginPath();
    this.waterGraphics.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 10) {
      const waveY = y + Math.sin(x * 0.02 + this.waterTime * (1 + layer * 0.3) + layer) * (8 - layer);
      this.waterGraphics.lineTo(x, waveY);
    }
    this.waterGraphics.lineTo(1024, 800);
    this.waterGraphics.lineTo(0, 800);
    this.waterGraphics.closePath();
    this.waterGraphics.fillPath();
  }
};

// Game Scene
function GameScene() {
  Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.create = function() {
  // World setup
  this.WORLD_WIDTH = 3000;
  this.WORLD_HEIGHT = 3000;
  this.physics.world.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);

  // Game state
  this.gold = 100;
  this.day = 1;
  this.score = 0;
  this.selectedWeapon = 0;
  this.weaponsUnlocked = [true, false, false, false];

  // Create water background
  this.waterGraphics = this.add.graphics();
  this.waterTime = 0;

  // Create groups
  this.enemies = this.physics.add.group();
  this.projectiles = this.physics.add.group();
  this.loot = this.physics.add.group();
  this.particles = this.add.group();

  // Port
  this.port = { x: 500, y: 500 };
  this.portGraphics = this.add.graphics();
  this.drawPort();

  // Create player
  this.createPlayer();

  // Input
  this.cursors = this.input.keyboard.addKeys({
    up: 'W', down: 'S', left: 'A', right: 'D',
    dock: 'E', weapon1: 'ONE', weapon2: 'TWO',
    weapon3: 'THREE', weapon4: 'FOUR'
  });

  this.input.on('pointerdown', () => this.fire());

  // Collisions
  this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHitEnemy, null, this);
  this.physics.add.overlap(this.loot, this.player, this.collectLoot, null, this);

  // Camera
  this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

  // HUD
  this.createHUD();

  // Spawn initial enemies
  for (let i = 0; i < 4; i++) this.spawnEnemy();

  // Spawn timer
  this.spawnTimer = this.time.addEvent({
    delay: 8000,
    callback: () => this.spawnEnemy(),
    loop: true
  });

  // Update gameState
  this.updateGameState();

  console.log('Pirateers Polished loaded');
};

GameScene.prototype.createPlayer = function() {
  this.player = this.add.graphics();
  this.player.x = this.WORLD_WIDTH / 2;
  this.player.y = this.WORLD_HEIGHT / 2;

  this.drawShip(this.player, PALETTE.playerHull, PALETTE.playerSail, 1.2);

  this.physics.add.existing(this.player);
  this.player.body.setCircle(20);
  this.player.body.setOffset(-20, -20);
  this.player.body.setCollideWorldBounds(true);

  this.player.angle = 0;
  this.player.speed = 80;
  this.player.maxSpeed = 200;
  this.player.hp = 100;
  this.player.maxHp = 100;
  this.player.sailHp = 50;
  this.player.maxSailHp = 50;
  this.player.reloadTimers = [0, 0, 0, 0];
};

GameScene.prototype.drawShip = function(graphics, hullColor, sailColor, scale) {
  graphics.clear();

  // Wake effect
  graphics.fillStyle(PALETTE.foam, 0.3);
  graphics.fillEllipse(-15 * scale, 0, 20 * scale, 8 * scale);

  // Hull shadow
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillTriangle(
    32 * scale + 2, 2,
    -24 * scale + 2, -14 * scale + 2,
    -24 * scale + 2, 14 * scale + 2
  );

  // Hull
  graphics.fillStyle(hullColor);
  graphics.fillTriangle(32 * scale, 0, -24 * scale, -14 * scale, -24 * scale, 14 * scale);

  // Hull highlight
  graphics.fillStyle(0xffffff, 0.2);
  graphics.fillTriangle(32 * scale, 0, -10 * scale, -8 * scale, -10 * scale, 0);

  // Mast
  graphics.fillStyle(0x4a3520);
  graphics.fillRect(-4 * scale, -3 * scale, 16 * scale, 6 * scale);

  // Sail
  graphics.fillStyle(sailColor);
  graphics.fillRect(-2 * scale, -12 * scale, 12 * scale, 24 * scale);

  // Sail detail
  graphics.lineStyle(1, 0xcccccc, 0.5);
  graphics.lineBetween(-2 * scale, 0, 10 * scale, 0);

  // Cannons
  graphics.fillStyle(0x222222);
  graphics.fillRect(-2 * scale, -18 * scale, 10 * scale, 4 * scale);
  graphics.fillRect(-2 * scale, 14 * scale, 10 * scale, 4 * scale);
};

GameScene.prototype.drawPort = function() {
  this.portGraphics.clear();

  // Dock zone
  this.portGraphics.lineStyle(3, PALETTE.gold, 0.4);
  this.portGraphics.strokeCircle(this.port.x, this.port.y, 150);

  // Dock platform
  this.portGraphics.fillStyle(0x654321);
  this.portGraphics.fillRect(this.port.x - 60, this.port.y - 60, 120, 120);

  // Buildings
  this.portGraphics.fillStyle(0x8b4513);
  this.portGraphics.fillRect(this.port.x - 40, this.port.y - 50, 35, 45);
  this.portGraphics.fillRect(this.port.x + 5, this.port.y - 40, 30, 35);

  // Roofs
  this.portGraphics.fillStyle(0x4a2810);
  this.portGraphics.fillTriangle(
    this.port.x - 45, this.port.y - 50,
    this.port.x - 22, this.port.y - 70,
    this.port.x, this.port.y - 50
  );

  // Flag
  this.portGraphics.fillStyle(0xff0000);
  this.portGraphics.fillRect(this.port.x + 35, this.port.y - 55, 15, 10);
  this.portGraphics.fillStyle(0x8b4513);
  this.portGraphics.fillRect(this.port.x + 33, this.port.y - 55, 3, 20);
};

GameScene.prototype.spawnEnemy = function() {
  if (this.enemies.countActive() >= 6) return;

  // Random type
  const types = ['merchant', 'pirate', 'navy'];
  const weights = [40, 40, 20];
  let roll = Math.random() * 100;
  let type = 'merchant';
  for (let i = 0; i < types.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { type = types[i]; break; }
  }

  const stats = {
    merchant: { hp: 40, speed: 100, color: PALETTE.merchant, gold: [30, 60], aggressive: false },
    pirate: { hp: 80, speed: 150, color: PALETTE.enemy, gold: [15, 35], aggressive: true },
    navy: { hp: 120, speed: 120, color: PALETTE.navy, gold: [25, 50], aggressive: true }
  };

  const stat = stats[type];

  // Spawn at edge
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * this.WORLD_WIDTH; y = 50; }
  else if (side === 1) { x = this.WORLD_WIDTH - 50; y = Math.random() * this.WORLD_HEIGHT; }
  else if (side === 2) { x = Math.random() * this.WORLD_WIDTH; y = this.WORLD_HEIGHT - 50; }
  else { x = 50; y = Math.random() * this.WORLD_HEIGHT; }

  const enemy = this.add.graphics();
  enemy.x = x;
  enemy.y = y;

  const sailColor = type === 'merchant' ? 0xffeedd : (type === 'navy' ? 0xffffff : 0x333333);
  this.drawShip(enemy, stat.color, sailColor, 1);

  this.physics.add.existing(enemy);
  enemy.body.setCircle(18);
  enemy.body.setOffset(-18, -18);

  enemy.type = type;
  enemy.hp = stat.hp;
  enemy.maxHp = stat.hp;
  enemy.speed = stat.speed;
  enemy.goldRange = stat.gold;
  enemy.aggressive = stat.aggressive;
  enemy.angle = Math.random() * Math.PI * 2;
  enemy.reloadTimer = 0;
  enemy.patrolDir = Math.random() * Math.PI * 2;

  this.enemies.add(enemy);
};

GameScene.prototype.fire = function() {
  if (this.player.reloadTimers[this.selectedWeapon] > 0) return;

  const weapons = [
    { damage: 15, reload: 1500, speed: 400, count: 3, spread: 15 },
    { damage: 5, reload: 2000, speed: 350, count: 1, spread: 0, slow: true },
    { damage: 10, reload: 3000, speed: 300, count: 1, spread: 0, burn: true },
    { damage: 25, reload: 2500, speed: 500, count: 8, spread: 45 }
  ];

  const weapon = weapons[this.selectedWeapon];
  this.player.reloadTimers[this.selectedWeapon] = weapon.reload;

  // Screen shake
  this.cameras.main.shake(100, 0.005);

  // Determine fire direction (broadside)
  const pointer = this.input.activePointer;
  const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const toMouseAngle = Math.atan2(worldPoint.y - this.player.y, worldPoint.x - this.player.x);
  const angleDiff = this.normalizeAngle(toMouseAngle - this.player.rotation);

  let fireAngle = this.player.rotation + (angleDiff > 0 ? Math.PI/2 : -Math.PI/2);

  const spreadRad = weapon.spread * Math.PI / 180;

  for (let i = 0; i < weapon.count; i++) {
    let angle = fireAngle;
    if (weapon.count > 1) {
      angle = fireAngle - spreadRad/2 + (spreadRad / (weapon.count - 1)) * i;
    }

    const bullet = this.add.graphics();
    bullet.x = this.player.x + Math.cos(fireAngle) * 35;
    bullet.y = this.player.y + Math.sin(fireAngle) * 35;

    // Cannonball
    bullet.fillStyle(PALETTE.cannonball);
    bullet.fillCircle(0, 0, 5);

    this.physics.add.existing(bullet);
    bullet.body.setCircle(5);
    bullet.body.setOffset(-5, -5);
    bullet.body.setVelocity(
      Math.cos(angle) * weapon.speed,
      Math.sin(angle) * weapon.speed
    );

    bullet.damage = weapon.damage;
    bullet.burn = weapon.burn;
    bullet.slow = weapon.slow;

    this.projectiles.add(bullet);

    // Destroy after 2s
    this.time.delayedCall(2000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  // Muzzle flash
  this.spawnParticles(
    this.player.x + Math.cos(fireAngle) * 40,
    this.player.y + Math.sin(fireAngle) * 40,
    PALETTE.fire, 5, 3
  );

  // Smoke
  this.spawnParticles(
    this.player.x + Math.cos(fireAngle) * 35,
    this.player.y + Math.sin(fireAngle) * 35,
    PALETTE.smoke, 3, 2
  );
};

GameScene.prototype.normalizeAngle = function(angle) {
  while (angle < -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
};

GameScene.prototype.projectileHitEnemy = function(bullet, enemy) {
  bullet.destroy();

  enemy.hp -= bullet.damage;

  // Hit particles
  this.spawnParticles(enemy.x, enemy.y, 0xffffff, 3, 2);

  if (enemy.hp <= 0) {
    this.destroyEnemy(enemy);
  }
};

GameScene.prototype.destroyEnemy = function(enemy) {
  // Gold
  const goldAmount = Phaser.Math.Between(enemy.goldRange[0], enemy.goldRange[1]);
  this.gold += goldAmount;
  this.score += goldAmount;

  // Explosion particles
  this.spawnParticles(enemy.x, enemy.y, PALETTE.fire, 15, 5);
  this.spawnParticles(enemy.x, enemy.y, PALETTE.smoke, 10, 3);
  this.spawnParticles(enemy.x, enemy.y, 0x8b4513, 8, 4);

  // Screen shake
  this.cameras.main.shake(200, 0.01);

  // Spawn loot
  for (let i = 0; i < Phaser.Math.Between(1, 3); i++) {
    const lootItem = this.add.graphics();
    lootItem.x = enemy.x + Phaser.Math.Between(-30, 30);
    lootItem.y = enemy.y + Phaser.Math.Between(-30, 30);

    lootItem.fillStyle(PALETTE.gold);
    lootItem.fillCircle(0, 0, 8);
    lootItem.fillStyle(0xffee00, 0.5);
    lootItem.fillCircle(0, 0, 12);

    this.physics.add.existing(lootItem);
    lootItem.body.setCircle(10);
    lootItem.body.setOffset(-10, -10);

    lootItem.value = Phaser.Math.Between(5, 20);
    lootItem.bobOffset = Math.random() * Math.PI * 2;

    this.loot.add(lootItem);

    // Timeout
    this.time.delayedCall(30000, () => {
      if (lootItem.active) lootItem.destroy();
    });
  }

  enemy.destroy();
};

GameScene.prototype.collectLoot = function(lootItem, player) {
  this.gold += lootItem.value;

  // Collect particle
  this.spawnParticles(lootItem.x, lootItem.y, PALETTE.gold, 5, 2);

  lootItem.destroy();
};

GameScene.prototype.spawnParticles = function(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const p = this.add.graphics();
    p.x = x;
    p.y = y;
    p.fillStyle(color);
    p.fillCircle(0, 0, 4);

    const angle = Math.random() * Math.PI * 2;
    p.vx = Math.cos(angle) * speed * (Math.random() + 0.5);
    p.vy = Math.sin(angle) * speed * (Math.random() + 0.5);
    p.life = 30;

    this.particles.add(p);
  }
};

GameScene.prototype.createHUD = function() {
  this.hudContainer = this.add.container(0, 0);
  this.hudContainer.setScrollFactor(0);

  // HP background
  const hpBg = this.add.graphics();
  hpBg.fillStyle(0x000000, 0.6);
  hpBg.fillRect(10, 10, 220, 60);
  this.hudContainer.add(hpBg);

  // HP bar
  this.hpBarBg = this.add.graphics();
  this.hpBarBg.fillStyle(PALETTE.healthBg);
  this.hpBarBg.fillRect(80, 18, 140, 16);
  this.hudContainer.add(this.hpBarBg);

  this.hpBar = this.add.graphics();
  this.hudContainer.add(this.hpBar);

  this.hpLabel = this.add.text(20, 16, 'HULL', {
    fontFamily: 'Cinzel',
    fontSize: '14px',
    color: '#cc3333'
  });
  this.hudContainer.add(this.hpLabel);

  // Sail bar
  this.sailBarBg = this.add.graphics();
  this.sailBarBg.fillStyle(PALETTE.healthBg);
  this.sailBarBg.fillRect(80, 42, 140, 12);
  this.hudContainer.add(this.sailBarBg);

  this.sailBar = this.add.graphics();
  this.hudContainer.add(this.sailBar);

  this.sailLabel = this.add.text(20, 40, 'SAIL', {
    fontFamily: 'Cinzel',
    fontSize: '12px',
    color: '#ffffff'
  });
  this.hudContainer.add(this.sailLabel);

  // Gold
  this.goldText = this.add.text(1004, 20, 'Gold: 100', {
    fontFamily: 'Pirata One',
    fontSize: '24px',
    color: '#ffd700'
  }).setOrigin(1, 0);
  this.hudContainer.add(this.goldText);

  // Day
  this.dayText = this.add.text(1004, 50, 'Day 1', {
    fontFamily: 'Cinzel',
    fontSize: '16px',
    color: '#ffffff'
  }).setOrigin(1, 0);
  this.hudContainer.add(this.dayText);

  // Weapon slots
  for (let i = 0; i < 4; i++) {
    const slotBg = this.add.graphics();
    slotBg.fillStyle(0x000000, 0.6);
    slotBg.fillRect(10 + i * 55, 698, 50, 50);
    this.hudContainer.add(slotBg);
  }

  this.weaponSlots = [];
  const weaponNames = ['Cannon', 'Chain', 'Fire', 'Grape'];
  for (let i = 0; i < 4; i++) {
    const slot = this.add.graphics();
    this.hudContainer.add(slot);
    this.weaponSlots.push(slot);

    const label = this.add.text(35 + i * 55, 740, (i + 1).toString(), {
      fontFamily: 'Cinzel',
      fontSize: '12px',
      color: this.weaponsUnlocked[i] ? '#ffffff' : '#444444'
    }).setOrigin(0.5);
    this.hudContainer.add(label);
  }

  // Minimap background
  const mmBg = this.add.graphics();
  mmBg.fillStyle(0x000000, 0.6);
  mmBg.fillRect(844, 588, 170, 170);
  mmBg.lineStyle(2, PALETTE.gold, 0.5);
  mmBg.strokeRect(844, 588, 170, 170);
  this.hudContainer.add(mmBg);

  this.minimap = this.add.graphics();
  this.hudContainer.add(this.minimap);
};

GameScene.prototype.updateHUD = function() {
  // HP bar
  this.hpBar.clear();
  this.hpBar.fillStyle(PALETTE.health);
  this.hpBar.fillRect(80, 18, 140 * (this.player.hp / this.player.maxHp), 16);

  // Sail bar
  this.sailBar.clear();
  this.sailBar.fillStyle(0xffffff);
  this.sailBar.fillRect(80, 42, 140 * (this.player.sailHp / this.player.maxSailHp), 12);

  // Gold
  this.goldText.setText('Gold: ' + this.gold);
  this.dayText.setText('Day ' + this.day);

  // Weapon slots
  for (let i = 0; i < 4; i++) {
    this.weaponSlots[i].clear();
    if (this.weaponsUnlocked[i]) {
      this.weaponSlots[i].lineStyle(2, i === this.selectedWeapon ? PALETTE.gold : 0x666666);
      this.weaponSlots[i].strokeRect(10 + i * 55, 698, 50, 50);

      // Reload indicator
      if (this.player.reloadTimers[i] > 0) {
        const weapons = [1500, 2000, 3000, 2500];
        const pct = 1 - this.player.reloadTimers[i] / weapons[i];
        this.weaponSlots[i].fillStyle(0x00aa00, 0.5);
        this.weaponSlots[i].fillRect(10 + i * 55, 748 - 50 * pct, 50, 50 * pct);
      }
    }
  }

  // Minimap
  this.minimap.clear();

  // Water
  this.minimap.fillStyle(PALETTE.sea, 0.5);
  this.minimap.fillRect(845, 589, 168, 168);

  // Port
  const portMmX = 845 + (this.port.x / this.WORLD_WIDTH) * 168;
  const portMmY = 589 + (this.port.y / this.WORLD_HEIGHT) * 168;
  this.minimap.fillStyle(PALETTE.gold);
  this.minimap.fillRect(portMmX - 3, portMmY - 3, 6, 6);

  // Enemies
  this.minimap.fillStyle(0xff3333);
  this.enemies.getChildren().forEach(e => {
    const ex = 845 + (e.x / this.WORLD_WIDTH) * 168;
    const ey = 589 + (e.y / this.WORLD_HEIGHT) * 168;
    this.minimap.fillCircle(ex, ey, 2);
  });

  // Player
  this.minimap.fillStyle(0x00ff00);
  const px = 845 + (this.player.x / this.WORLD_WIDTH) * 168;
  const py = 589 + (this.player.y / this.WORLD_HEIGHT) * 168;
  this.minimap.fillCircle(px, py, 4);
};

GameScene.prototype.updateGameState = function() {
  window.gameState = {
    screen: 'game',
    gold: this.gold,
    day: this.day,
    score: this.score,
    hp: this.player ? this.player.hp : 0,
    enemies: this.enemies.countActive()
  };
};

GameScene.prototype.update = function(time, delta) {
  if (!this.player || !this.player.active) return;

  const dt = delta / 1000;

  // Update water
  this.waterTime += dt;
  this.drawWater();

  // Player movement
  const sailEfficiency = this.player.sailHp / this.player.maxSailHp;
  const currentMaxSpeed = this.player.maxSpeed * sailEfficiency;

  if (this.cursors.up.isDown) {
    this.player.speed = Math.min(this.player.speed + 100 * dt, currentMaxSpeed);
  } else if (this.cursors.down.isDown) {
    this.player.speed = Math.max(this.player.speed - 150 * dt, 30);
  }

  const turnRate = 90 * (1 - this.player.speed / this.player.maxSpeed * 0.5);
  if (this.cursors.left.isDown) {
    this.player.rotation -= turnRate * Math.PI / 180 * dt;
  }
  if (this.cursors.right.isDown) {
    this.player.rotation += turnRate * Math.PI / 180 * dt;
  }

  // Apply velocity
  this.player.body.setVelocity(
    Math.cos(this.player.rotation) * this.player.speed,
    Math.sin(this.player.rotation) * this.player.speed
  );

  // Redraw player ship
  this.drawShip(this.player, PALETTE.playerHull, PALETTE.playerSail, 1.2);

  // Weapon switching
  if (this.cursors.weapon1.isDown) this.selectedWeapon = 0;
  if (this.cursors.weapon2.isDown && this.weaponsUnlocked[1]) this.selectedWeapon = 1;
  if (this.cursors.weapon3.isDown && this.weaponsUnlocked[2]) this.selectedWeapon = 2;
  if (this.cursors.weapon4.isDown && this.weaponsUnlocked[3]) this.selectedWeapon = 3;

  // Update reload timers
  for (let i = 0; i < 4; i++) {
    if (this.player.reloadTimers[i] > 0) {
      this.player.reloadTimers[i] -= delta;
    }
  }

  // Check dock
  if (this.cursors.dock.isDown) {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.port.x, this.port.y
    );
    if (dist < 150 && this.player.speed < 100) {
      this.scene.start('PortScene', { gold: this.gold, day: this.day, score: this.score });
    }
  }

  // Update enemies
  this.updateEnemies(dt);

  // Update particles
  this.particles.getChildren().forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    p.alpha = p.life / 30;
    if (p.life <= 0) p.destroy();
  });

  // Update loot bobbing
  this.loot.getChildren().forEach(l => {
    l.bobOffset += dt * 3;
    l.y += Math.sin(l.bobOffset) * 0.3;
  });

  // Update HUD
  this.updateHUD();
  this.updateGameState();

  // Check death
  if (this.player.hp <= 0) {
    this.scene.start('GameOverScene', { gold: this.gold, day: this.day, score: this.score });
  }
};

GameScene.prototype.drawWater = function() {
  this.waterGraphics.clear();

  // Draw water tiles
  const cam = this.cameras.main;
  const startX = Math.floor(cam.scrollX / 100) * 100;
  const startY = Math.floor(cam.scrollY / 100) * 100;

  for (let x = startX - 100; x < startX + cam.width + 200; x += 100) {
    for (let y = startY - 100; y < startY + cam.height + 200; y += 100) {
      const wave = Math.sin(x * 0.01 + y * 0.01 + this.waterTime * 2) * 0.1 + 0.5;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 13, g: 74, b: 111 },
        { r: 26, g: 106, b: 159 },
        10, Math.floor(wave * 10)
      );
      this.waterGraphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      this.waterGraphics.fillRect(x, y, 100, 100);
    }
  }

  // Grid lines
  this.waterGraphics.lineStyle(1, PALETTE.seaLight, 0.15);
  for (let x = startX; x < startX + cam.width + 200; x += 100) {
    this.waterGraphics.lineBetween(x, startY - 100, x, startY + cam.height + 200);
  }
  for (let y = startY; y < startY + cam.height + 200; y += 100) {
    this.waterGraphics.lineBetween(startX - 100, y, startX + cam.width + 200, y);
  }
};

GameScene.prototype.updateEnemies = function(dt) {
  this.enemies.getChildren().forEach(enemy => {
    if (!enemy.active) return;

    const dist = Phaser.Math.Distance.Between(
      enemy.x, enemy.y,
      this.player.x, this.player.y
    );

    const angleToPlayer = Math.atan2(
      this.player.y - enemy.y,
      this.player.x - enemy.x
    );

    if (enemy.aggressive && dist < 600) {
      // Chase and circle
      const targetAngle = dist > 200 ? angleToPlayer : angleToPlayer + Math.PI / 2;
      const angleDiff = this.normalizeAngle(targetAngle - enemy.angle);
      enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 60 * Math.PI / 180 * dt);

      // Fire when in range
      enemy.reloadTimer -= dt * 1000;
      if (enemy.reloadTimer <= 0 && dist < 400) {
        this.enemyFire(enemy);
        enemy.reloadTimer = 2000;
      }
    } else if (!enemy.aggressive && dist < 400) {
      // Flee
      const fleeAngle = angleToPlayer + Math.PI;
      const angleDiff = this.normalizeAngle(fleeAngle - enemy.angle);
      enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 50 * Math.PI / 180 * dt);
    } else {
      // Patrol
      if (Math.random() < 0.01) {
        enemy.patrolDir += (Math.random() - 0.5) * Math.PI / 2;
      }
      const angleDiff = this.normalizeAngle(enemy.patrolDir - enemy.angle);
      enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 30 * Math.PI / 180 * dt);
    }

    // Move
    enemy.body.setVelocity(
      Math.cos(enemy.angle) * enemy.speed,
      Math.sin(enemy.angle) * enemy.speed
    );

    // Redraw
    const sailColor = enemy.type === 'merchant' ? 0xffeedd : (enemy.type === 'navy' ? 0xffffff : 0x333333);
    const hullColor = enemy.type === 'merchant' ? PALETTE.merchant : (enemy.type === 'navy' ? PALETTE.navy : PALETTE.enemy);
    enemy.clear();
    this.drawShip(enemy, hullColor, sailColor, 1);
    enemy.rotation = enemy.angle;

    // Keep in bounds
    if (enemy.x < 50 || enemy.x > this.WORLD_WIDTH - 50 ||
        enemy.y < 50 || enemy.y > this.WORLD_HEIGHT - 50) {
      enemy.patrolDir = Math.atan2(
        this.WORLD_HEIGHT / 2 - enemy.y,
        this.WORLD_WIDTH / 2 - enemy.x
      );
    }
  });
};

GameScene.prototype.enemyFire = function(enemy) {
  const angleToPlayer = Math.atan2(
    this.player.y - enemy.y,
    this.player.x - enemy.x
  );

  const bullet = this.add.graphics();
  bullet.x = enemy.x;
  bullet.y = enemy.y;
  bullet.fillStyle(PALETTE.cannonball);
  bullet.fillCircle(0, 0, 4);

  this.physics.add.existing(bullet);
  bullet.body.setCircle(4);
  bullet.body.setOffset(-4, -4);
  bullet.body.setVelocity(
    Math.cos(angleToPlayer) * 350,
    Math.sin(angleToPlayer) * 350
  );

  bullet.isEnemy = true;
  bullet.damage = 10;

  // Check collision with player
  this.physics.add.overlap(bullet, this.player, () => {
    this.player.hp -= bullet.damage;
    this.cameras.main.shake(150, 0.015);
    this.spawnParticles(this.player.x, this.player.y, PALETTE.fire, 3, 2);
    bullet.destroy();
  });

  // Muzzle flash
  this.spawnParticles(enemy.x, enemy.y, PALETTE.fire, 3, 2);

  this.time.delayedCall(2500, () => {
    if (bullet.active) bullet.destroy();
  });
};

// Port Scene
function PortScene() {
  Phaser.Scene.call(this, { key: 'PortScene' });
}
PortScene.prototype = Object.create(Phaser.Scene.prototype);
PortScene.prototype.constructor = PortScene;

PortScene.prototype.init = function(data) {
  this.gold = data.gold || 100;
  this.day = data.day || 1;
  this.score = data.score || 0;
};

PortScene.prototype.create = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Background
  this.add.rectangle(width/2, height/2, width, height, 0x1a0a05);

  // Wood panel
  const panel = this.add.graphics();
  panel.fillStyle(0x8b4513);
  panel.fillRect(100, 80, width - 200, height - 160);
  panel.lineStyle(4, 0x654321);
  panel.strokeRect(100, 80, width - 200, height - 160);

  // Title
  this.add.text(width/2, 130, 'PORT ROYAL', {
    fontFamily: 'Pirata One',
    fontSize: '48px',
    color: '#ffd700'
  }).setOrigin(0.5);

  // Gold display
  this.goldText = this.add.text(width/2, 180, 'Gold: ' + this.gold, {
    fontFamily: 'Cinzel',
    fontSize: '24px',
    color: '#ffd700'
  }).setOrigin(0.5);

  // Buttons
  const buttons = [
    { y: 280, text: 'Repair Ship - 50 gold', action: 'repair' },
    { y: 360, text: 'Upgrade Weapons - 100 gold', action: 'weapons' },
    { y: 440, text: 'Hire Crew - 75 gold', action: 'crew' },
    { y: 520, text: 'Set Sail', action: 'sail' }
  ];

  buttons.forEach(btn => {
    const bg = this.add.graphics();
    bg.fillStyle(0x446688);
    bg.fillRect(width/2 - 150, btn.y, 300, 50);
    bg.lineStyle(2, 0x88aacc);
    bg.strokeRect(width/2 - 150, btn.y, 300, 50);

    const text = this.add.text(width/2, btn.y + 25, btn.text, {
      fontFamily: 'Cinzel',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    bg.setInteractive(new Phaser.Geom.Rectangle(width/2 - 150, btn.y, 300, 50), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', () => this.handleButton(btn.action));
    bg.on('pointerover', () => bg.fillStyle(0x5577aa).fillRect(width/2 - 150, btn.y, 300, 50));
    bg.on('pointerout', () => bg.fillStyle(0x446688).fillRect(width/2 - 150, btn.y, 300, 50));
  });

  // Update gameState
  window.gameState = { screen: 'port', gold: this.gold };
};

PortScene.prototype.handleButton = function(action) {
  if (action === 'repair' && this.gold >= 50) {
    this.gold -= 50;
  } else if (action === 'weapons' && this.gold >= 100) {
    this.gold -= 100;
  } else if (action === 'crew' && this.gold >= 75) {
    this.gold -= 75;
  } else if (action === 'sail') {
    this.scene.start('GameScene');
    return;
  }
  this.goldText.setText('Gold: ' + this.gold);
};

// Game Over Scene
function GameOverScene() {
  Phaser.Scene.call(this, { key: 'GameOverScene' });
}
GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
GameOverScene.prototype.constructor = GameOverScene;

GameOverScene.prototype.init = function(data) {
  this.finalGold = data.gold || 0;
  this.finalDay = data.day || 1;
  this.finalScore = data.score || 0;
};

GameOverScene.prototype.create = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Dark water
  this.add.rectangle(width/2, height/2, width, height, 0x0a1020);

  // Sinking particles
  for (let i = 0; i < 20; i++) {
    const bubble = this.add.graphics();
    bubble.fillStyle(0x446688, 0.5);
    bubble.fillCircle(0, 0, Phaser.Math.Between(3, 8));
    bubble.x = Phaser.Math.Between(0, width);
    bubble.y = Phaser.Math.Between(0, height);

    this.tweens.add({
      targets: bubble,
      y: bubble.y - 200,
      alpha: 0,
      duration: 3000 + Math.random() * 2000,
      repeat: -1
    });
  }

  // Title
  this.add.text(width/2, 180, 'LOST AT SEA', {
    fontFamily: 'Pirata One',
    fontSize: '64px',
    color: '#ff4444'
  }).setOrigin(0.5);

  // Stats
  this.add.text(width/2, 320, 'Days Survived: ' + this.finalDay, {
    fontFamily: 'Cinzel',
    fontSize: '28px',
    color: '#ffffff'
  }).setOrigin(0.5);

  this.add.text(width/2, 380, 'Gold Earned: ' + this.finalScore, {
    fontFamily: 'Cinzel',
    fontSize: '24px',
    color: '#ffd700'
  }).setOrigin(0.5);

  // Retry
  const retryText = this.add.text(width/2, 520, '[ CLICK TO TRY AGAIN ]', {
    fontFamily: 'Pirata One',
    fontSize: '28px',
    color: '#88aacc'
  }).setOrigin(0.5);

  this.tweens.add({
    targets: retryText,
    alpha: 0.4,
    duration: 800,
    yoyo: true,
    repeat: -1
  });

  this.input.on('pointerdown', () => {
    this.scene.start('TitleScene');
  });

  window.gameState = { screen: 'gameover', score: this.finalScore };
};

// Start game
const game = new Phaser.Game(config);
