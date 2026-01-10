// Minishoot Adventures Clone - Twin-Stick Shooter Adventure
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Configuration
const CONFIG = {
  worldWidth: 2400,
  worldHeight: 1800,
  playerSpeed: 200,
  bulletSpeed: 400,
  fireRate: 200,
  dashDistance: 120,
  dashCooldown: 500,
  xpToLevel: level => 10 + (level - 1) * 3,
  heartPiecesPer: 4
};

// Colors
const COLORS = {
  background: '#1a1a2e',
  grass: '#7CB342',
  forest: '#2E7D32',
  desert: '#D4A559',
  water: '#1565C0',
  path: '#8D6E63',
  player: '#4CAF50',
  playerOutline: '#81C784',
  enemy: '#F44336',
  bullet: '#FFEB3B',
  enemyBullet: '#FF6600',
  crystal: '#E91E63',
  heart: '#F44336',
  energy: '#00BCD4',
  dungeon: '#9C27B0',
  text: '#ffffff'
};

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.08;

  switch(type) {
    case 'shoot': osc.frequency.value = 600; osc.type = 'square'; break;
    case 'hit': osc.frequency.value = 200; osc.type = 'sawtooth'; break;
    case 'pickup': osc.frequency.value = 800; osc.type = 'sine'; break;
    case 'levelup': osc.frequency.value = 1000; osc.type = 'triangle'; break;
    case 'dash': osc.frequency.value = 400; osc.type = 'sine'; break;
    case 'death': osc.frequency.value = 100; osc.type = 'sawtooth'; break;
  }

  osc.start();
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.stop(audioCtx.currentTime + 0.1);
}

// Game state
const game = {
  state: 'menu',
  player: null,
  enemies: [],
  bullets: [],
  crystals: [],
  pickups: [],
  camera: { x: 0, y: 0 },
  keys: {},
  mouse: { x: 0, y: 0, down: false },
  worldTiles: [],
  dungeons: [],
  stats: { gamesPlayed: 0, crystalsCollected: 0, enemiesDefeated: 0, levelsReached: 0 }
};

// Load stats
try {
  const saved = localStorage.getItem('minishootCloneStats');
  if (saved) game.stats = JSON.parse(saved);
} catch(e) {}

function saveStats() {
  try { localStorage.setItem('minishootCloneStats', JSON.stringify(game.stats)); } catch(e) {}
}

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 28;
    this.angle = 0;
    this.speed = CONFIG.playerSpeed;
    this.health = 3;
    this.maxHealth = 3;
    this.heartPieces = 0;
    this.energy = 4;
    this.maxEnergy = 4;
    this.xp = 0;
    this.level = 1;
    this.skillPoints = 0;
    this.damage = 1;
    this.fireRate = CONFIG.fireRate;
    this.range = 300;
    this.critChance = 0;
    this.lastShot = 0;
    this.dashCooldown = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.abilities = { dash: true, supershot: false };

    // Skills allocated
    this.skills = { damage: 0, fireRate: 0, range: 0, speed: 0, crit: 0 };
  }

  update(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (game.keys['KeyW'] || game.keys['ArrowUp']) dy -= 1;
    if (game.keys['KeyS'] || game.keys['ArrowDown']) dy += 1;
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) dx -= 1;
    if (game.keys['KeyD'] || game.keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const speed = this.speed + this.skills.speed * 20;
    this.x += dx * speed * dt;
    this.y += dy * speed * dt;

    // World bounds
    this.x = Math.max(this.width/2, Math.min(CONFIG.worldWidth - this.width/2, this.x));
    this.y = Math.max(this.height/2, Math.min(CONFIG.worldHeight - this.height/2, this.y));

    // Aim at mouse
    const worldMouse = {
      x: game.mouse.x + game.camera.x,
      y: game.mouse.y + game.camera.y
    };
    this.angle = Math.atan2(worldMouse.y - this.y, worldMouse.x - this.x);

    // Shooting
    if (game.mouse.down) {
      const now = Date.now();
      const rate = this.fireRate - this.skills.fireRate * 15;
      if (now - this.lastShot >= rate) {
        this.shoot();
        this.lastShot = now;
      }
    }

    // Dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt * 1000;
    }

    // Invincibility
    if (this.invincible) {
      this.invincibleTimer -= dt * 1000;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Energy regen
    this.energy = Math.min(this.maxEnergy, this.energy + 0.5 * dt);
  }

  shoot() {
    const bulletDamage = this.damage + this.skills.damage * 0.5;
    const range = this.range + this.skills.range * 30;
    const isCrit = Math.random() < this.skills.crit * 0.05;

    game.bullets.push({
      x: this.x + Math.cos(this.angle) * 20,
      y: this.y + Math.sin(this.angle) * 20,
      vx: Math.cos(this.angle) * CONFIG.bulletSpeed,
      vy: Math.sin(this.angle) * CONFIG.bulletSpeed,
      damage: isCrit ? bulletDamage * 2 : bulletDamage,
      range: range,
      traveled: 0,
      isPlayer: true,
      isCrit: isCrit
    });

    playSound('shoot');
  }

  dash() {
    if (!this.abilities.dash || this.dashCooldown > 0) return;

    this.x += Math.cos(this.angle) * CONFIG.dashDistance;
    this.y += Math.sin(this.angle) * CONFIG.dashDistance;
    this.dashCooldown = CONFIG.dashCooldown;

    playSound('dash');
  }

  supershot() {
    if (!this.abilities.supershot || this.energy < 1) return;

    this.energy -= 1;
    const bulletDamage = (this.damage + this.skills.damage * 0.5) * 3;

    game.bullets.push({
      x: this.x + Math.cos(this.angle) * 20,
      y: this.y + Math.sin(this.angle) * 20,
      vx: Math.cos(this.angle) * CONFIG.bulletSpeed * 1.5,
      vy: Math.sin(this.angle) * CONFIG.bulletSpeed * 1.5,
      damage: bulletDamage,
      range: 500,
      traveled: 0,
      isPlayer: true,
      isSuper: true
    });

    playSound('shoot');
  }

  takeDamage(damage) {
    if (this.invincible) return;

    this.health -= damage;
    this.invincible = true;
    this.invincibleTimer = 1000;

    playSound('hit');

    if (this.health <= 0) {
      game.state = 'gameover';
      playSound('death');
      saveStats();
    }
  }

  gainXP(amount) {
    this.xp += amount;
    game.stats.crystalsCollected += amount;

    const xpNeeded = CONFIG.xpToLevel(this.level);
    if (this.xp >= xpNeeded) {
      this.xp -= xpNeeded;
      this.level++;
      this.skillPoints++;
      game.stats.levelsReached = Math.max(game.stats.levelsReached, this.level);
      playSound('levelup');

      // Level up pulse clears nearby bullets
      game.bullets = game.bullets.filter(b => {
        if (!b.isPlayer) {
          const dist = Math.sqrt(Math.pow(b.x - this.x, 2) + Math.pow(b.y - this.y, 2));
          return dist > 100;
        }
        return true;
      });
    }
  }

  collectHeartPiece() {
    this.heartPieces++;
    if (this.heartPieces >= CONFIG.heartPiecesPer) {
      this.heartPieces = 0;
      this.maxHealth++;
    }
    playSound('pickup');
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - game.camera.x, this.y - game.camera.y);
    ctx.rotate(this.angle);

    // Invincibility flash
    if (this.invincible && Math.floor(Date.now() / 100) % 2) {
      ctx.globalAlpha = 0.5;
    }

    // Ship body (cute rounded)
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 24;
    this.height = 24;
    this.health = type === 'large' ? 5 : (type === 'medium' ? 3 : 1);
    this.maxHealth = this.health;
    this.speed = type === 'large' ? 40 : (type === 'medium' ? 60 : 80);
    this.damage = type === 'large' ? 2 : 1;
    this.xpValue = type === 'large' ? 5 : (type === 'medium' ? 3 : 1);
    this.shootCooldown = 0;
    this.shootRate = type === 'large' ? 1500 : (type === 'medium' ? 2000 : 3000);
    this.angle = 0;
  }

  update(dt) {
    const player = game.player;
    const dist = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

    if (dist < 400) {
      // Move toward player
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.angle = angle;

      if (dist > 150) {
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
      }

      // Shoot
      this.shootCooldown -= dt * 1000;
      if (this.shootCooldown <= 0 && dist < 350) {
        this.shoot();
        this.shootCooldown = this.shootRate;
      }
    }

    // World bounds
    this.x = Math.max(20, Math.min(CONFIG.worldWidth - 20, this.x));
    this.y = Math.max(20, Math.min(CONFIG.worldHeight - 20, this.y));
  }

  shoot() {
    const player = game.player;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);

    if (this.type === 'large') {
      // Spread shot
      for (let i = -2; i <= 2; i++) {
        const spreadAngle = angle + i * 0.2;
        game.bullets.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(spreadAngle) * 180,
          vy: Math.sin(spreadAngle) * 180,
          damage: this.damage,
          range: 300,
          traveled: 0,
          isPlayer: false
        });
      }
    } else {
      game.bullets.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        damage: this.damage,
        range: 300,
        traveled: 0,
        isPlayer: false
      });
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      // Drop crystals
      for (let i = 0; i < this.xpValue; i++) {
        game.crystals.push({
          x: this.x + (Math.random() - 0.5) * 30,
          y: this.y + (Math.random() - 0.5) * 30,
          value: 1
        });
      }
      game.stats.enemiesDefeated++;
      return true;
    }
    return false;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - game.camera.x, this.y - game.camera.y);

    // Enemy body
    const size = this.type === 'large' ? 16 : (this.type === 'medium' ? 12 : 10);
    ctx.fillStyle = this.type === 'large' ? '#D32F2F' : (this.type === 'medium' ? '#F44336' : '#EF5350');
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Health bar for larger enemies
    if (this.type !== 'basic' && this.health < this.maxHealth) {
      ctx.fillStyle = '#333';
      ctx.fillRect(-15, -size - 8, 30, 4);
      ctx.fillStyle = COLORS.heart;
      ctx.fillRect(-15, -size - 8, 30 * (this.health / this.maxHealth), 4);
    }

    ctx.restore();
  }
}

// Generate world
function generateWorld() {
  game.worldTiles = [];
  game.enemies = [];
  game.crystals = [];
  game.pickups = [];
  game.dungeons = [];

  const tileSize = 100;
  const tilesX = Math.ceil(CONFIG.worldWidth / tileSize);
  const tilesY = Math.ceil(CONFIG.worldHeight / tileSize);

  // Generate terrain
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      const noise = Math.sin(x * 0.3) * Math.cos(y * 0.4) + Math.random() * 0.3;
      let type;

      if (noise > 0.5) type = 'forest';
      else if (noise < -0.3) type = 'water';
      else if (noise > 0.2) type = 'grass';
      else type = 'desert';

      game.worldTiles.push({
        x: x * tileSize,
        y: y * tileSize,
        width: tileSize,
        height: tileSize,
        type
      });
    }
  }

  // Spawn enemies
  for (let i = 0; i < 30; i++) {
    const ex = 200 + Math.random() * (CONFIG.worldWidth - 400);
    const ey = 200 + Math.random() * (CONFIG.worldHeight - 400);
    const roll = Math.random();
    const type = roll < 0.1 ? 'large' : (roll < 0.3 ? 'medium' : 'basic');
    game.enemies.push(new Enemy(ex, ey, type));
  }

  // Spawn heart pieces
  for (let i = 0; i < 8; i++) {
    game.pickups.push({
      x: 150 + Math.random() * (CONFIG.worldWidth - 300),
      y: 150 + Math.random() * (CONFIG.worldHeight - 300),
      type: 'heart'
    });
  }

  // Spawn dungeons
  game.dungeons = [
    { x: 400, y: 400, name: 'Forest Temple', entered: false },
    { x: CONFIG.worldWidth - 400, y: 400, name: 'Desert Temple', entered: false },
    { x: CONFIG.worldWidth / 2, y: CONFIG.worldHeight - 300, name: 'Crystal Cave', entered: false }
  ];
}

// Start game
function startGame() {
  game.state = 'playing';
  game.player = new Player(CONFIG.worldWidth / 2, CONFIG.worldHeight / 2);
  game.bullets = [];
  game.stats.gamesPlayed++;
  saveStats();
  generateWorld();
}

// Update
function updateBullets(dt) {
  game.bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dt;

    if (bullet.traveled > bullet.range) {
      bullet.hit = true;
    }

    // Player bullets hit enemies
    if (bullet.isPlayer) {
      game.enemies.forEach(enemy => {
        if (Math.abs(bullet.x - enemy.x) < enemy.width/2 &&
            Math.abs(bullet.y - enemy.y) < enemy.height/2) {
          if (enemy.takeDamage(bullet.damage)) {
            enemy.dead = true;
          }
          bullet.hit = true;
        }
      });
    } else {
      // Enemy bullets hit player
      const p = game.player;
      if (Math.abs(bullet.x - p.x) < p.width/2 &&
          Math.abs(bullet.y - p.y) < p.height/2) {
        p.takeDamage(bullet.damage);
        bullet.hit = true;
      }
    }
  });

  game.bullets = game.bullets.filter(b => !b.hit);
  game.enemies = game.enemies.filter(e => !e.dead);
}

function updateCrystals() {
  const p = game.player;
  game.crystals.forEach(crystal => {
    const dist = Math.sqrt(Math.pow(crystal.x - p.x, 2) + Math.pow(crystal.y - p.y, 2));

    // Magnet effect
    if (dist < 100) {
      const angle = Math.atan2(p.y - crystal.y, p.x - crystal.x);
      crystal.x += Math.cos(angle) * 200 * (1/60);
      crystal.y += Math.sin(angle) * 200 * (1/60);
    }

    // Collect
    if (dist < 20) {
      p.gainXP(crystal.value);
      crystal.collected = true;
    }
  });

  game.crystals = game.crystals.filter(c => !c.collected);
}

function updatePickups() {
  const p = game.player;
  game.pickups.forEach(pickup => {
    const dist = Math.sqrt(Math.pow(pickup.x - p.x, 2) + Math.pow(pickup.y - p.y, 2));
    if (dist < 30) {
      if (pickup.type === 'heart') {
        p.collectHeartPiece();
      }
      pickup.collected = true;
    }
  });

  game.pickups = game.pickups.filter(p => !p.collected);
}

function updateCamera() {
  game.camera.x = game.player.x - canvas.width / 2;
  game.camera.y = game.player.y - canvas.height / 2;
  game.camera.x = Math.max(0, Math.min(CONFIG.worldWidth - canvas.width, game.camera.x));
  game.camera.y = Math.max(0, Math.min(CONFIG.worldHeight - canvas.height, game.camera.y));
}

function update(dt) {
  if (game.state !== 'playing') return;

  game.player.update(dt);
  game.enemies.forEach(e => e.update(dt));
  updateBullets(dt);
  updateCrystals();
  updatePickups();
  updateCamera();
}

// Draw functions
function drawWorld() {
  // Draw tiles
  game.worldTiles.forEach(tile => {
    const screenX = tile.x - game.camera.x;
    const screenY = tile.y - game.camera.y;

    if (screenX > -tile.width && screenX < canvas.width &&
        screenY > -tile.height && screenY < canvas.height) {
      ctx.fillStyle = {
        grass: COLORS.grass,
        forest: COLORS.forest,
        desert: COLORS.desert,
        water: COLORS.water
      }[tile.type];
      ctx.fillRect(screenX, screenY, tile.width, tile.height);
    }
  });

  // Draw dungeons
  game.dungeons.forEach(dungeon => {
    const screenX = dungeon.x - game.camera.x;
    const screenY = dungeon.y - game.camera.y;

    ctx.fillStyle = COLORS.dungeon;
    ctx.fillRect(screenX - 30, screenY - 30, 60, 60);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(screenX - 30, screenY - 30, 60, 60);

    ctx.fillStyle = COLORS.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dungeon.name, screenX, screenY + 50);
  });

  // Draw pickups
  game.pickups.forEach(pickup => {
    const screenX = pickup.x - game.camera.x;
    const screenY = pickup.y - game.camera.y;

    ctx.fillStyle = COLORS.heart;
    ctx.beginPath();
    // Heart shape
    ctx.moveTo(screenX, screenY + 5);
    ctx.bezierCurveTo(screenX - 10, screenY - 5, screenX - 10, screenY - 15, screenX, screenY - 10);
    ctx.bezierCurveTo(screenX + 10, screenY - 15, screenX + 10, screenY - 5, screenX, screenY + 5);
    ctx.fill();
  });

  // Draw crystals
  ctx.fillStyle = COLORS.crystal;
  game.crystals.forEach(crystal => {
    const screenX = crystal.x - game.camera.x;
    const screenY = crystal.y - game.camera.y;

    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 8);
    ctx.lineTo(screenX + 6, screenY);
    ctx.lineTo(screenX, screenY + 8);
    ctx.lineTo(screenX - 6, screenY);
    ctx.closePath();
    ctx.fill();
  });

  // Draw enemies
  game.enemies.forEach(e => e.draw());

  // Draw bullets
  game.bullets.forEach(bullet => {
    const screenX = bullet.x - game.camera.x;
    const screenY = bullet.y - game.camera.y;

    ctx.fillStyle = bullet.isPlayer ?
      (bullet.isSuper ? '#00BCD4' : (bullet.isCrit ? '#FF9800' : COLORS.bullet)) :
      COLORS.enemyBullet;
    ctx.beginPath();
    ctx.arc(screenX, screenY, bullet.isSuper ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw player
  game.player.draw();
}

function drawUI() {
  const p = game.player;

  // Health hearts
  for (let i = 0; i < p.maxHealth; i++) {
    ctx.fillStyle = i < p.health ? COLORS.heart : '#333';
    ctx.beginPath();
    const hx = 25 + i * 25;
    const hy = 25;
    ctx.moveTo(hx, hy + 5);
    ctx.bezierCurveTo(hx - 8, hy - 3, hx - 8, hy - 10, hx, hy - 5);
    ctx.bezierCurveTo(hx + 8, hy - 10, hx + 8, hy - 3, hx, hy + 5);
    ctx.fill();
  }

  // Heart pieces
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`+${p.heartPieces}/${CONFIG.heartPiecesPer}`, 25 + p.maxHealth * 25, 30);

  // Energy bars
  for (let i = 0; i < p.maxEnergy; i++) {
    ctx.fillStyle = i < p.energy ? COLORS.energy : '#333';
    ctx.fillRect(25 + i * 20, 45, 15, 10);
  }

  // Level and XP
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  ctx.fillText(`Level ${p.level}`, 25, 80);

  const xpNeeded = CONFIG.xpToLevel(p.level);
  ctx.fillStyle = '#333';
  ctx.fillRect(25, 85, 100, 8);
  ctx.fillStyle = COLORS.crystal;
  ctx.fillRect(25, 85, 100 * (p.xp / xpNeeded), 8);

  // Skill points
  if (p.skillPoints > 0) {
    ctx.fillStyle = COLORS.energy;
    ctx.fillText(`Skill Points: ${p.skillPoints}`, 25, 110);
  }

  // Stats
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Enemies: ${game.enemies.length}`, canvas.width - 10, 25);
  ctx.fillText(`Crystals: ${game.stats.crystalsCollected}`, canvas.width - 10, 45);

  // Dash cooldown
  if (p.dashCooldown > 0) {
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('DASH', canvas.width/2, canvas.height - 40);
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width/2 - 30, canvas.height - 35, 60, 8);
    ctx.fillStyle = COLORS.energy;
    ctx.fillRect(canvas.width/2 - 30, canvas.height - 35, 60 * (1 - p.dashCooldown / CONFIG.dashCooldown), 8);
  } else {
    ctx.fillStyle = COLORS.energy;
    ctx.textAlign = 'center';
    ctx.fillText('[SPACE] DASH', canvas.width/2, canvas.height - 30);
  }

  // Minimap
  const mmSize = 100;
  const mmX = canvas.width - mmSize - 10;
  const mmY = canvas.height - mmSize - 10;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(mmX, mmY, mmSize, mmSize);

  // Player on minimap
  const pmx = mmX + (p.x / CONFIG.worldWidth) * mmSize;
  const pmy = mmY + (p.y / CONFIG.worldHeight) * mmSize;
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(pmx - 2, pmy - 2, 4, 4);

  // Enemies on minimap
  ctx.fillStyle = COLORS.enemy;
  game.enemies.forEach(e => {
    const emx = mmX + (e.x / CONFIG.worldWidth) * mmSize;
    const emy = mmY + (e.y / CONFIG.worldHeight) * mmSize;
    ctx.fillRect(emx - 1, emy - 1, 2, 2);
  });

  // Dungeons on minimap
  ctx.fillStyle = COLORS.dungeon;
  game.dungeons.forEach(d => {
    const dmx = mmX + (d.x / CONFIG.worldWidth) * mmSize;
    const dmy = mmY + (d.y / CONFIG.worldHeight) * mmSize;
    ctx.fillRect(dmx - 3, dmy - 3, 6, 6);
  });
}

function drawMenu() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.playerOutline;
  ctx.font = '36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MINISHOOT', canvas.width/2, 120);
  ctx.fillText('ADVENTURES', canvas.width/2, 160);

  ctx.font = '14px monospace';
  ctx.fillStyle = COLORS.text;
  const lines = [
    'Press ENTER to Start',
    '',
    'Explore, defeat enemies, collect crystals!',
    'Level up and allocate skill points',
    'Find heart pieces to increase max health',
    '',
    'WASD - Move     Mouse - Aim',
    'LMB - Shoot     SPACE - Dash',
    '1-5 - Allocate skill points'
  ];

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width/2, 220 + i * 24);
  });

  ctx.fillStyle = COLORS.crystal;
  ctx.font = '12px monospace';
  ctx.fillText(`Games: ${game.stats.gamesPlayed} | Crystals: ${game.stats.crystalsCollected} | Max Level: ${game.stats.levelsReached}`, canvas.width/2, 530);
}

function drawGameOver() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.enemy;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '18px monospace';
  ctx.fillText(`Level Reached: ${game.player?.level || 1}`, canvas.width/2, 280);
  ctx.fillText(`Enemies Defeated: ${game.stats.enemiesDefeated}`, canvas.width/2, 320);
  ctx.fillText(`Crystals: ${game.stats.crystalsCollected}`, canvas.width/2, 350);

  ctx.fillStyle = COLORS.playerOutline;
  ctx.fillText('Press ENTER to try again', canvas.width/2, 420);
}

function draw() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch(game.state) {
    case 'menu':
      drawMenu();
      break;
    case 'playing':
      drawWorld();
      drawUI();
      break;
    case 'gameover':
      drawGameOver();
      break;
  }
}

// Input handling
document.addEventListener('keydown', e => {
  game.keys[e.code] = true;

  if (e.code === 'Enter') {
    if (game.state === 'menu' || game.state === 'gameover') {
      startGame();
    }
  }

  if (e.code === 'Escape') {
    if (game.state !== 'menu') {
      game.state = 'menu';
    }
  }

  if (game.state === 'playing') {
    if (e.code === 'Space') {
      game.player.dash();
    }

    // Skill allocation (1-5)
    const p = game.player;
    if (p.skillPoints > 0) {
      if (e.code === 'Digit1' && p.skills.damage < 10) { p.skills.damage++; p.skillPoints--; }
      if (e.code === 'Digit2' && p.skills.fireRate < 10) { p.skills.fireRate++; p.skillPoints--; }
      if (e.code === 'Digit3' && p.skills.range < 10) { p.skills.range++; p.skillPoints--; }
      if (e.code === 'Digit4' && p.skills.speed < 10) { p.skills.speed++; p.skillPoints--; }
      if (e.code === 'Digit5' && p.skills.crit < 5 && p.skillPoints >= 2) {
        p.skills.crit++;
        p.skillPoints -= 2;
      }
    }
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = e.clientX - rect.left;
  game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
  game.mouse.down = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});

canvas.addEventListener('mouseup', () => {
  game.mouse.down = false;
});

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// Expose game for testing
window.game = game;

// Start
requestAnimationFrame(gameLoop);
