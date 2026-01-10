// Frostfall Polished - 2D Skyrim Demake with Phaser 3
// Winter landscape with snow particles, combat effects

// Nordic Winter palette
const PALETTE = {
  bg: 0x0a1018,
  snow: 0xf0f4ff,
  snowLight: 0xffffff,
  ice: 0x88ccee,
  ground: 0x1a2a1a,
  groundLight: 0x2a3a2a,
  tree: 0x1a3020,
  treeDark: 0x102818,
  player: 0x3366aa,
  playerLight: 0x4488cc,
  bandit: 0x664433,
  wolf: 0x554422,
  health: 0xcc3333,
  stamina: 0x33aa33,
  magicka: 0x3366cc,
  gold: 0xffd700,
  xp: 0x6699ff,
  damage: 0xffff00,
  heal: 0x44ff44
};

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 700,
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

  // Mountain background
  this.mountainGraphics = this.add.graphics();
  this.drawMountains();

  // Snow particles
  this.snowParticles = this.add.group();
  for (let i = 0; i < 100; i++) {
    const snow = this.add.graphics();
    snow.x = Math.random() * width;
    snow.y = Math.random() * height;
    snow.fillStyle(PALETTE.snowLight, 0.7);
    snow.fillCircle(0, 0, Math.random() * 2 + 1);
    snow.vx = (Math.random() - 0.5) * 0.5;
    snow.vy = Math.random() * 1 + 0.5;
    this.snowParticles.add(snow);
  }

  // Glow behind title
  const glow = this.add.graphics();
  glow.fillStyle(PALETTE.ice, 0.15);
  glow.fillEllipse(width/2, 180, 600, 200);

  // Title shadow
  this.add.text(width/2 + 3, 153, 'FROSTFALL', {
    fontFamily: 'UnifrakturMaguntia',
    fontSize: '84px',
    color: '#000000'
  }).setOrigin(0.5);

  // Main title
  this.add.text(width/2, 150, 'FROSTFALL', {
    fontFamily: 'UnifrakturMaguntia',
    fontSize: '84px',
    color: '#88ccee'
  }).setOrigin(0.5);

  // Subtitle
  this.add.text(width/2, 240, 'A Winter\'s Tale', {
    fontFamily: 'Cinzel',
    fontSize: '24px',
    color: '#668899'
  }).setOrigin(0.5);

  // Instructions
  this.add.text(width/2, 380, 'WASD - Move   |   SHIFT - Sprint', {
    fontFamily: 'Cinzel',
    fontSize: '16px',
    color: '#556677'
  }).setOrigin(0.5);

  this.add.text(width/2, 410, 'MOUSE - Aim   |   CLICK - Attack', {
    fontFamily: 'Cinzel',
    fontSize: '16px',
    color: '#556677'
  }).setOrigin(0.5);

  // Start prompt
  this.startText = this.add.text(width/2, 530, '[ CLICK TO BEGIN YOUR JOURNEY ]', {
    fontFamily: 'Cinzel',
    fontSize: '22px',
    color: '#88ccee'
  }).setOrigin(0.5);

  this.tweens.add({
    targets: this.startText,
    alpha: 0.4,
    duration: 1200,
    yoyo: true,
    repeat: -1
  });

  this.input.on('pointerdown', () => {
    this.scene.start('GameScene');
  });

  window.gameState = { screen: 'title' };
};

TitleScene.prototype.drawMountains = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Far mountains
  this.mountainGraphics.fillStyle(0x1a2a35);
  this.mountainGraphics.beginPath();
  this.mountainGraphics.moveTo(0, height);
  this.mountainGraphics.lineTo(0, 500);
  this.mountainGraphics.lineTo(150, 350);
  this.mountainGraphics.lineTo(300, 450);
  this.mountainGraphics.lineTo(450, 300);
  this.mountainGraphics.lineTo(600, 420);
  this.mountainGraphics.lineTo(750, 330);
  this.mountainGraphics.lineTo(900, 480);
  this.mountainGraphics.lineTo(width, height);
  this.mountainGraphics.closePath();
  this.mountainGraphics.fillPath();

  // Snow caps
  this.mountainGraphics.fillStyle(PALETTE.snow, 0.3);
  this.mountainGraphics.fillTriangle(450, 300, 400, 350, 500, 350);
  this.mountainGraphics.fillTriangle(750, 330, 700, 380, 800, 380);
  this.mountainGraphics.fillTriangle(150, 350, 100, 400, 200, 400);
};

TitleScene.prototype.update = function() {
  this.snowParticles.getChildren().forEach(snow => {
    snow.x += snow.vx;
    snow.y += snow.vy;
    if (snow.y > 700) {
      snow.y = -5;
      snow.x = Math.random() * 900;
    }
    if (snow.x < 0) snow.x = 900;
    if (snow.x > 900) snow.x = 0;
  });
};

// Game Scene
function GameScene() {
  Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.create = function() {
  // Stats
  this.hp = 100;
  this.maxHp = 100;
  this.stamina = 100;
  this.maxStamina = 100;
  this.gold = 50;
  this.level = 1;
  this.xp = 0;
  this.xpToLevel = 100;
  this.kills = 0;
  this.combatSkill = 1;

  // Groups
  this.enemies = this.physics.add.group();
  this.items = this.physics.add.group();
  this.particles = this.add.group();
  this.damageNumbers = this.add.group();
  this.snowParticles = this.add.group();

  // Ground
  this.groundGraphics = this.add.graphics();
  this.drawGround();

  // Snow
  this.createSnowParticles();

  // Trees
  this.treeGraphics = this.add.graphics();
  this.drawTrees();

  // Create player
  this.createPlayer();

  // Input
  this.cursors = this.input.keyboard.addKeys({
    up: 'W', down: 'S', left: 'A', right: 'D',
    shift: 'SHIFT'
  });

  this.input.on('pointerdown', () => this.attack());

  // Collisions
  this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

  // Spawn initial enemies and items
  this.spawnEnemies();
  this.spawnItems();

  // HUD
  this.createHUD();

  // Attack state
  this.attackTimer = 0;
  this.invulnTimer = 0;

  this.updateGameState();

  console.log('Frostfall Polished loaded');
};

GameScene.prototype.drawGround = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Base ground
  this.groundGraphics.fillStyle(PALETTE.ground);
  this.groundGraphics.fillRect(0, 0, width, height);

  // Snow patches
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 40 + 20;
    this.groundGraphics.fillStyle(PALETTE.snow, 0.1);
    this.groundGraphics.fillEllipse(x, y, size, size * 0.6);
  }

  // Grid
  this.groundGraphics.lineStyle(1, PALETTE.groundLight, 0.3);
  for (let x = 0; x < width; x += 50) {
    this.groundGraphics.lineBetween(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 50) {
    this.groundGraphics.lineBetween(0, y, width, y);
  }
};

GameScene.prototype.drawTrees = function() {
  const trees = [
    { x: 100, y: 150 }, { x: 750, y: 100 }, { x: 800, y: 550 },
    { x: 150, y: 500 }, { x: 50, y: 350 }, { x: 850, y: 300 }
  ];

  trees.forEach(t => {
    // Shadow
    this.treeGraphics.fillStyle(0x000000, 0.3);
    this.treeGraphics.fillEllipse(t.x + 5, t.y + 35, 30, 10);

    // Trunk
    this.treeGraphics.fillStyle(0x4a3020);
    this.treeGraphics.fillRect(t.x - 5, t.y, 10, 30);

    // Foliage layers
    this.treeGraphics.fillStyle(PALETTE.treeDark);
    this.treeGraphics.fillTriangle(t.x, t.y - 50, t.x - 30, t.y + 5, t.x + 30, t.y + 5);
    this.treeGraphics.fillStyle(PALETTE.tree);
    this.treeGraphics.fillTriangle(t.x, t.y - 70, t.x - 25, t.y - 20, t.x + 25, t.y - 20);

    // Snow on tree
    this.treeGraphics.fillStyle(PALETTE.snow, 0.6);
    this.treeGraphics.fillTriangle(t.x, t.y - 70, t.x - 12, t.y - 50, t.x + 12, t.y - 50);
  });
};

GameScene.prototype.createSnowParticles = function() {
  for (let i = 0; i < 80; i++) {
    const snow = this.add.graphics();
    snow.x = Math.random() * 900;
    snow.y = Math.random() * 700;
    snow.fillStyle(PALETTE.snowLight, 0.5);
    snow.fillCircle(0, 0, Math.random() * 2 + 1);
    snow.vx = (Math.random() - 0.5) * 0.3;
    snow.vy = Math.random() * 0.8 + 0.3;
    this.snowParticles.add(snow);
  }
};

GameScene.prototype.createPlayer = function() {
  this.player = this.add.graphics();
  this.player.x = 450;
  this.player.y = 350;

  this.drawPlayer();

  this.physics.add.existing(this.player);
  this.player.body.setCircle(14);
  this.player.body.setOffset(-14, -14);
  this.player.body.setCollideWorldBounds(true);

  this.player.rotation = 0;
};

GameScene.prototype.drawPlayer = function(attacking) {
  this.player.clear();

  // Glow when invulnerable
  if (this.invulnTimer > 0) {
    this.player.fillStyle(PALETTE.ice, 0.3);
    this.player.fillCircle(0, 0, 22);
  }

  // Body shadow
  this.player.fillStyle(0x000000, 0.3);
  this.player.fillCircle(3, 3, 14);

  // Body
  this.player.fillStyle(this.invulnTimer > 0 ? PALETTE.playerLight : PALETTE.player);
  this.player.fillCircle(0, 0, 14);

  // Armor highlight
  this.player.fillStyle(PALETTE.playerLight, 0.4);
  this.player.fillCircle(-4, -4, 6);

  // Weapon (sword)
  this.player.fillStyle(0x888888);
  this.player.fillRect(10, -3, 18, 6);
  this.player.fillStyle(0xaaaaaa);
  this.player.fillRect(10, -3, 18, 2);

  // Attack swing effect
  if (attacking) {
    this.player.fillStyle(0xffffff, 0.4);
    this.player.fillCircle(25, 0, 20);
    this.player.lineStyle(2, 0xffffff, 0.6);
    this.player.strokeCircle(25, 0, 20);
  }
};

GameScene.prototype.spawnEnemies = function() {
  const count = 3 + this.level;

  for (let i = 0; i < count; i++) {
    const type = Math.random() < 0.6 ? 'bandit' : 'wolf';
    const angle = Math.random() * Math.PI * 2;
    const dist = 180 + Math.random() * 200;

    const enemy = this.add.graphics();
    enemy.x = this.player.x + Math.cos(angle) * dist;
    enemy.y = this.player.y + Math.sin(angle) * dist;

    // Keep in bounds
    enemy.x = Phaser.Math.Clamp(enemy.x, 50, 850);
    enemy.y = Phaser.Math.Clamp(enemy.y, 80, 650);

    enemy.homeX = enemy.x;
    enemy.homeY = enemy.y;

    const stats = {
      bandit: { hp: 40, speed: 70, damage: 8, color: PALETTE.bandit, radius: 12, goldDrop: 10 },
      wolf: { hp: 25, speed: 100, damage: 6, color: PALETTE.wolf, radius: 10, goldDrop: 0 }
    };

    const stat = stats[type];
    enemy.type = type;
    enemy.hp = stat.hp;
    enemy.maxHp = stat.hp;
    enemy.speed = stat.speed;
    enemy.damage = stat.damage;
    enemy.color = stat.color;
    enemy.radius = stat.radius;
    enemy.goldDrop = stat.goldDrop;
    enemy.state = 'idle';
    enemy.attackTimer = 0;

    this.drawEnemy(enemy);

    this.physics.add.existing(enemy);
    enemy.body.setCircle(stat.radius);
    enemy.body.setOffset(-stat.radius, -stat.radius);

    this.enemies.add(enemy);
  }
};

GameScene.prototype.drawEnemy = function(enemy) {
  enemy.clear();

  // Shadow
  enemy.fillStyle(0x000000, 0.3);
  enemy.fillEllipse(3, 3, enemy.radius * 2, enemy.radius);

  // Body
  enemy.fillStyle(enemy.color);
  enemy.fillCircle(0, 0, enemy.radius);

  // Eyes
  if (enemy.type === 'wolf') {
    enemy.fillStyle(0xffff00);
    enemy.fillCircle(-3, -3, 2);
    enemy.fillCircle(3, -3, 2);
  }

  // Aggro indicator
  if (enemy.state === 'chase' || enemy.state === 'attack') {
    enemy.fillStyle(0xff0000);
    enemy.fillCircle(0, -enemy.radius - 8, 3);
  }
};

GameScene.prototype.spawnItems = function() {
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 150;

    const item = this.add.graphics();
    item.x = this.player.x + Math.cos(angle) * dist;
    item.y = this.player.y + Math.sin(angle) * dist;

    // Keep in bounds
    item.x = Phaser.Math.Clamp(item.x, 30, 870);
    item.y = Phaser.Math.Clamp(item.y, 80, 670);

    item.type = Math.random() < 0.5 ? 'potion' : 'gold';

    this.drawItem(item);

    this.physics.add.existing(item);
    item.body.setCircle(10);
    item.body.setOffset(-10, -10);

    this.items.add(item);
  }
};

GameScene.prototype.drawItem = function(item) {
  item.clear();

  // Glow
  item.fillStyle(item.type === 'potion' ? PALETTE.health : PALETTE.gold, 0.3);
  item.fillCircle(0, 0, 14);

  // Item
  item.fillStyle(item.type === 'potion' ? PALETTE.health : PALETTE.gold);
  item.fillCircle(0, 0, 8);

  // Highlight
  item.fillStyle(0xffffff, 0.4);
  item.fillCircle(-2, -2, 3);
};

GameScene.prototype.collectItem = function(item) {
  if (item.type === 'potion') {
    this.hp = Math.min(this.maxHp, this.hp + 25);
    this.spawnDamageNumber(item.x, item.y, '+25 HP', PALETTE.heal);
  } else {
    this.gold += 10;
    this.spawnDamageNumber(item.x, item.y, '+10g', PALETTE.gold);
  }

  // Collect particles
  this.spawnParticles(item.x, item.y, item.type === 'potion' ? PALETTE.health : PALETTE.gold, 5);

  item.destroy();
};

GameScene.prototype.attack = function() {
  if (this.attackTimer > 0 || this.stamina < 10) return;

  this.attackTimer = 400; // ms
  this.stamina -= 10;

  // Screen shake
  this.cameras.main.shake(50, 0.003);

  // Attack position
  const pointer = this.input.activePointer;
  this.player.rotation = Math.atan2(pointer.y - this.player.y, pointer.x - this.player.x);

  const attackX = this.player.x + Math.cos(this.player.rotation) * 25;
  const attackY = this.player.y + Math.sin(this.player.rotation) * 25;

  // Check hits
  this.enemies.getChildren().forEach(enemy => {
    const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
    if (dist < enemy.radius + 20) {
      const damage = 10 + this.combatSkill * 2;
      enemy.hp -= damage;
      this.xp += 5;

      this.spawnDamageNumber(enemy.x, enemy.y - 15, damage, PALETTE.damage);
      this.spawnParticles(enemy.x, enemy.y, 0xffffff, 3);

      // Screen shake on hit
      this.cameras.main.shake(80, 0.005);

      if (enemy.hp <= 0) {
        this.kills++;
        this.gold += enemy.goldDrop;
        this.spawnParticles(enemy.x, enemy.y, enemy.color, 8);
        enemy.destroy();
      }
    }
  });

  // Attack effect
  this.spawnParticles(attackX, attackY, 0xcccccc, 2);

  // Check level up
  this.checkLevelUp();

  // Reset attack after delay
  this.time.delayedCall(100, () => {
    this.drawPlayer(false);
  });

  this.drawPlayer(true);
};

GameScene.prototype.checkLevelUp = function() {
  if (this.xp >= this.xpToLevel) {
    this.xp -= this.xpToLevel;
    this.level++;
    this.xpToLevel = 100 * this.level;
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.maxStamina += 5;
    this.combatSkill = Math.min(10, this.combatSkill + 1);

    this.spawnDamageNumber(this.player.x, this.player.y - 40, 'LEVEL UP!', PALETTE.ice);
    this.cameras.main.shake(150, 0.01);
  }
};

GameScene.prototype.spawnDamageNumber = function(x, y, text, color) {
  const num = this.add.text(x, y, text, {
    fontFamily: 'Cinzel',
    fontSize: '18px',
    fontStyle: 'bold',
    color: '#' + color.toString(16).padStart(6, '0')
  }).setOrigin(0.5);

  this.tweens.add({
    targets: num,
    y: y - 30,
    alpha: 0,
    duration: 800,
    onComplete: () => num.destroy()
  });
};

GameScene.prototype.spawnParticles = function(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const p = this.add.graphics();
    p.x = x;
    p.y = y;
    p.fillStyle(color);
    p.fillCircle(0, 0, 3);

    const angle = Math.random() * Math.PI * 2;
    p.vx = Math.cos(angle) * (Math.random() * 3 + 1);
    p.vy = Math.sin(angle) * (Math.random() * 3 + 1);
    p.life = 30;

    this.particles.add(p);
  }
};

GameScene.prototype.createHUD = function() {
  this.hudContainer = this.add.container(0, 0);

  // HUD background
  const hudBg = this.add.graphics();
  hudBg.fillStyle(0x000000, 0.7);
  hudBg.fillRect(0, 0, 900, 70);
  this.hudContainer.add(hudBg);

  // HP bar background
  const hpBg = this.add.graphics();
  hpBg.fillStyle(0x333333);
  hpBg.fillRect(70, 12, 160, 20);
  this.hudContainer.add(hpBg);

  // HP bar
  this.hpBar = this.add.graphics();
  this.hudContainer.add(this.hpBar);

  // HP label
  this.hpLabel = this.add.text(10, 10, 'HP', {
    fontFamily: 'Cinzel',
    fontSize: '16px',
    color: '#cc3333'
  });
  this.hudContainer.add(this.hpLabel);

  // Stamina bar background
  const stBg = this.add.graphics();
  stBg.fillStyle(0x333333);
  stBg.fillRect(70, 38, 130, 14);
  this.hudContainer.add(stBg);

  // Stamina bar
  this.staminaBar = this.add.graphics();
  this.hudContainer.add(this.staminaBar);

  // Stamina label
  this.stLabel = this.add.text(10, 36, 'ST', {
    fontFamily: 'Cinzel',
    fontSize: '12px',
    color: '#33aa33'
  });
  this.hudContainer.add(this.stLabel);

  // Gold
  this.goldText = this.add.text(260, 12, 'Gold: 50', {
    fontFamily: 'Cinzel',
    fontSize: '16px',
    color: '#ffd700'
  });
  this.hudContainer.add(this.goldText);

  // Level
  this.levelText = this.add.text(260, 36, 'Lv 1', {
    fontFamily: 'Cinzel',
    fontSize: '14px',
    color: '#6699ff'
  });
  this.hudContainer.add(this.levelText);

  // XP
  this.xpText = this.add.text(320, 36, 'XP: 0/100', {
    fontFamily: 'Cinzel',
    fontSize: '12px',
    color: '#aaaaaa'
  });
  this.hudContainer.add(this.xpText);

  // Kills
  this.killsText = this.add.text(880, 12, 'Kills: 0', {
    fontFamily: 'Cinzel',
    fontSize: '16px',
    color: '#ff6666'
  }).setOrigin(1, 0);
  this.hudContainer.add(this.killsText);

  // Quest
  this.questText = this.add.text(450, 55, 'Quest: Explore the wilderness', {
    fontFamily: 'Cinzel',
    fontSize: '14px',
    color: '#ffff88'
  }).setOrigin(0.5);
  this.hudContainer.add(this.questText);
};

GameScene.prototype.updateHUD = function() {
  // HP bar
  this.hpBar.clear();
  this.hpBar.fillStyle(PALETTE.health);
  this.hpBar.fillRect(70, 12, 160 * (this.hp / this.maxHp), 20);

  // Stamina bar
  this.staminaBar.clear();
  this.staminaBar.fillStyle(PALETTE.stamina);
  this.staminaBar.fillRect(70, 38, 130 * (this.stamina / this.maxStamina), 14);

  // Text
  this.goldText.setText('Gold: ' + this.gold);
  this.levelText.setText('Lv ' + this.level);
  this.xpText.setText('XP: ' + this.xp + '/' + this.xpToLevel);
  this.killsText.setText('Kills: ' + this.kills);

  // Quest
  if (this.kills >= 8) {
    this.questText.setText('Quest: Complete!');
    this.questText.setColor('#00ff00');
  } else if (this.kills >= 3) {
    this.questText.setText('Quest: Clear the enemies (' + this.kills + '/8)');
  }
};

GameScene.prototype.updateGameState = function() {
  window.gameState = {
    screen: 'game',
    hp: this.hp,
    maxHp: this.maxHp,
    stamina: Math.floor(this.stamina),
    gold: this.gold,
    level: this.level,
    xp: this.xp,
    kills: this.kills
  };
};

GameScene.prototype.update = function(time, delta) {
  const dt = delta / 1000;

  // Timers
  if (this.attackTimer > 0) this.attackTimer -= delta;
  if (this.invulnTimer > 0) this.invulnTimer -= delta;

  // Player movement
  const sprinting = this.cursors.shift.isDown && this.stamina > 5;
  const speed = sprinting ? 180 : 120;
  let vx = 0, vy = 0;

  if (this.cursors.up.isDown) vy = -speed;
  if (this.cursors.down.isDown) vy = speed;
  if (this.cursors.left.isDown) vx = -speed;
  if (this.cursors.right.isDown) vx = speed;

  this.player.body.setVelocity(vx, vy);

  // Stamina
  if (sprinting && (vx !== 0 || vy !== 0)) {
    this.stamina = Math.max(0, this.stamina - 20 * dt);
  } else if (this.stamina < this.maxStamina) {
    this.stamina = Math.min(this.maxStamina, this.stamina + 10 * dt);
  }

  // Aim at mouse
  const pointer = this.input.activePointer;
  this.player.rotation = Math.atan2(pointer.y - this.player.y, pointer.x - this.player.x);

  // Update enemies
  this.enemies.getChildren().forEach(enemy => {
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

    if (enemy.state === 'idle') {
      if (dist < 180) enemy.state = 'chase';
    } else if (enemy.state === 'chase') {
      if (dist > 350) {
        enemy.state = 'return';
      } else if (dist < enemy.radius + 14 + 5) {
        enemy.state = 'attack';
      } else {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        enemy.body.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
      }
    } else if (enemy.state === 'attack') {
      enemy.attackTimer += delta;
      if (enemy.attackTimer >= 1000) {
        enemy.attackTimer = 0;
        if (this.invulnTimer <= 0) {
          this.hp -= enemy.damage;
          this.invulnTimer = 500;
          this.spawnDamageNumber(this.player.x, this.player.y - 15, enemy.damage, PALETTE.health);
          this.cameras.main.shake(100, 0.01);
        }
      }
      if (dist > enemy.radius + 14 + 20) {
        enemy.state = 'chase';
      }
      enemy.body.setVelocity(0, 0);
    } else if (enemy.state === 'return') {
      const toHomeX = enemy.homeX - enemy.x;
      const toHomeY = enemy.homeY - enemy.y;
      const homeDist = Math.hypot(toHomeX, toHomeY);
      if (homeDist < 5) {
        enemy.state = 'idle';
        enemy.body.setVelocity(0, 0);
      } else {
        enemy.body.setVelocity(toHomeX / homeDist * enemy.speed * 0.7, toHomeY / homeDist * enemy.speed * 0.7);
      }
      if (dist < 150) enemy.state = 'chase';
    }

    this.drawEnemy(enemy);
  });

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

  // Update snow
  this.snowParticles.getChildren().forEach(snow => {
    snow.x += snow.vx;
    snow.y += snow.vy;
    if (snow.y > 700) {
      snow.y = -5;
      snow.x = Math.random() * 900;
    }
    if (snow.x < 0) snow.x = 900;
    if (snow.x > 900) snow.x = 0;
  });

  // Respawn enemies
  if (this.enemies.countActive() === 0) {
    this.spawnEnemies();
    this.spawnItems();
  }

  // Death
  if (this.hp <= 0) {
    this.scene.start('GameOverScene', { gold: this.gold, level: this.level, kills: this.kills });
  }

  // Update HUD
  this.updateHUD();
  this.updateGameState();

  // Redraw player
  if (this.attackTimer <= 0) {
    this.drawPlayer(false);
  }
};

// Game Over Scene
function GameOverScene() {
  Phaser.Scene.call(this, { key: 'GameOverScene' });
}
GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
GameOverScene.prototype.constructor = GameOverScene;

GameOverScene.prototype.init = function(data) {
  this.finalGold = data.gold || 0;
  this.finalLevel = data.level || 1;
  this.finalKills = data.kills || 0;
};

GameOverScene.prototype.create = function() {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;

  // Dark background
  this.add.rectangle(width/2, height/2, width, height, 0x0a0810);

  // Snow particles (slowed)
  this.snowParticles = this.add.group();
  for (let i = 0; i < 50; i++) {
    const snow = this.add.graphics();
    snow.x = Math.random() * width;
    snow.y = Math.random() * height;
    snow.fillStyle(PALETTE.snowLight, 0.3);
    snow.fillCircle(0, 0, Math.random() * 2 + 1);
    snow.vy = Math.random() * 0.3 + 0.1;
    this.snowParticles.add(snow);
  }

  // Title
  this.add.text(width/2, 180, 'FALLEN IN BATTLE', {
    fontFamily: 'UnifrakturMaguntia',
    fontSize: '48px',
    color: '#cc4444'
  }).setOrigin(0.5);

  // Stats
  this.add.text(width/2, 320, 'Level Reached: ' + this.finalLevel, {
    fontFamily: 'Cinzel',
    fontSize: '24px',
    color: '#ffffff'
  }).setOrigin(0.5);

  this.add.text(width/2, 370, 'Enemies Slain: ' + this.finalKills, {
    fontFamily: 'Cinzel',
    fontSize: '20px',
    color: '#ff6666'
  }).setOrigin(0.5);

  this.add.text(width/2, 420, 'Gold Collected: ' + this.finalGold, {
    fontFamily: 'Cinzel',
    fontSize: '20px',
    color: '#ffd700'
  }).setOrigin(0.5);

  // Retry
  const retryText = this.add.text(width/2, 540, '[ CLICK TO TRY AGAIN ]', {
    fontFamily: 'Cinzel',
    fontSize: '22px',
    color: '#88ccee'
  }).setOrigin(0.5);

  this.tweens.add({
    targets: retryText,
    alpha: 0.4,
    duration: 1000,
    yoyo: true,
    repeat: -1
  });

  this.input.on('pointerdown', () => {
    this.scene.start('TitleScene');
  });

  window.gameState = { screen: 'gameover', kills: this.finalKills };
};

GameOverScene.prototype.update = function() {
  this.snowParticles.getChildren().forEach(snow => {
    snow.y += snow.vy;
    if (snow.y > 700) {
      snow.y = -5;
      snow.x = Math.random() * 900;
    }
  });
};

// Start game
const game = new Phaser.Game(config);
