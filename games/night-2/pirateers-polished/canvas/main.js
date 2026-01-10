// Pirateers - Polished Edition
// Wave-based naval combat with full visual juice

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Color Palette (inspired by lospec's "Slso8" palette)
const COLORS = {
  deepOcean: '#0d2b45',
  midOcean: '#203c56',
  lightOcean: '#544e68',
  foam: '#8d697a',
  sand: '#d08159',
  gold: '#ffaa5e',
  bright: '#ffd4a3',
  white: '#ffecd6',
  // Additional colors for effects
  cannonFlash: '#fff7e0',
  explosion: '#ff6b35',
  explosionCore: '#ffdd44',
  shield: '#4ecdc4',
  shieldGlow: '#88ffff',
  health: '#ff6b6b',
  power: '#c44dff',
  damage: '#ff4444',
  enemyRed: '#c73e1d',
  enemyOrange: '#f4a259',
  enemyPurple: '#7b2cbf',
  bossGold: '#ffd700'
};

// Screen shake
const shake = {
  intensity: 0,
  decay: 0.9,
  x: 0,
  y: 0
};

function addShake(amount) {
  shake.intensity = Math.min(shake.intensity + amount, 20);
}

// Particle System
const particles = [];

class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || (Math.random() - 0.5) * 4;
    this.vy = options.vy || (Math.random() - 0.5) * 4;
    this.life = options.life || 1;
    this.maxLife = this.life;
    this.size = options.size || 4;
    this.color = options.color || COLORS.bright;
    this.gravity = options.gravity || 0;
    this.friction = options.friction || 0.98;
    this.shrink = options.shrink !== false;
    this.glow = options.glow || false;
    this.glowSize = options.glowSize || 10;
  }

  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    const size = this.shrink ? this.size * alpha : this.size;

    if (this.glow) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = this.glowSize;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Spawn particle effects
function spawnExplosion(x, y, size = 1) {
  const count = Math.floor(20 * size);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4 * size;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.5,
      size: 3 + Math.random() * 4 * size,
      color: Math.random() > 0.5 ? COLORS.explosion : COLORS.explosionCore,
      glow: true,
      glowSize: 15
    }));
  }
  // Smoke
  for (let i = 0; i < count / 2; i++) {
    particles.push(new Particle(x, y, {
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 2 - 1,
      life: 1 + Math.random(),
      size: 8 + Math.random() * 8 * size,
      color: '#444',
      friction: 0.95,
      shrink: false
    }));
  }
  addShake(5 * size);
}

function spawnCannonFlash(x, y, angle) {
  for (let i = 0; i < 8; i++) {
    const spread = (Math.random() - 0.5) * 0.5;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle + spread) * (3 + Math.random() * 2),
      vy: Math.sin(angle + spread) * (3 + Math.random() * 2),
      life: 0.15 + Math.random() * 0.1,
      size: 3 + Math.random() * 3,
      color: COLORS.cannonFlash,
      glow: true
    }));
  }
}

function spawnWake(x, y, angle) {
  particles.push(new Particle(x, y, {
    vx: Math.cos(angle + Math.PI) * 0.5 + (Math.random() - 0.5),
    vy: Math.sin(angle + Math.PI) * 0.5 + (Math.random() - 0.5),
    life: 0.8 + Math.random() * 0.4,
    size: 4 + Math.random() * 3,
    color: COLORS.foam,
    friction: 0.96
  }));
}

function spawnPowerupPickup(x, y, color) {
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 * i) / 15;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      life: 0.5 + Math.random() * 0.3,
      size: 4,
      color: color,
      glow: true
    }));
  }
}

function spawnDamageNumbers(x, y, damage) {
  // Create floating damage text effect using particles
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(x + (Math.random() - 0.5) * 20, y, {
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      life: 0.4,
      size: 2,
      color: COLORS.damage,
      gravity: 0.1
    }));
  }
}

// Game state
const game = {
  state: 'title',
  score: 0,
  wave: 1,
  waveTimer: 0,
  enemiesRemaining: 0,
  time: 0
};

// Player ship
const player = {
  x: 400,
  y: 500,
  vx: 0,
  vy: 0,
  angle: -Math.PI / 2,
  hull: 100,
  maxHull: 100,
  shield: 50,
  maxShield: 50,
  shieldRegenDelay: 0,
  power: 1,
  speed: 280,
  fireRate: 0.2,
  fireCooldown: 0,
  specialCooldown: 0,
  specialMaxCooldown: 3,
  invincible: 0
};

// Arrays
const projectiles = [];
const enemies = [];
const powerups = [];

// Input
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (game.state === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
  } else if (game.state === 'gameover' && (e.key === 'Enter' || e.key === ' ')) {
    resetGame();
  }
});
document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function startGame() {
  game.state = 'playing';
  game.score = 0;
  game.wave = 1;
  game.waveTimer = 3;
  game.enemiesRemaining = 0;
  resetPlayer();
  enemies.length = 0;
  projectiles.length = 0;
  powerups.length = 0;
  particles.length = 0;
}

function resetGame() {
  game.state = 'title';
}

function resetPlayer() {
  player.x = 400;
  player.y = 500;
  player.vx = 0;
  player.vy = 0;
  player.hull = player.maxHull;
  player.shield = player.maxShield;
  player.power = 1;
  player.invincible = 0;
}

// Enemy types
const ENEMY_TYPES = {
  scout: {
    hull: 30, speed: 120, damage: 10, score: 50, fireRate: 2,
    color: COLORS.enemyRed, size: 20, glow: COLORS.explosion
  },
  hunter: {
    hull: 60, speed: 80, damage: 15, score: 100, fireRate: 1.5,
    color: COLORS.enemyOrange, size: 25, glow: COLORS.gold
  },
  destroyer: {
    hull: 120, speed: 50, damage: 25, score: 200, fireRate: 1,
    color: COLORS.enemyPurple, size: 35, glow: COLORS.power
  },
  boss: {
    hull: 500, speed: 30, damage: 40, score: 1000, fireRate: 0.5,
    color: COLORS.bossGold, size: 50, glow: COLORS.gold
  }
};

function spawnEnemy(type) {
  const config = ENEMY_TYPES[type];
  const enemy = {
    x: Math.random() * 700 + 50,
    y: -50,
    vx: 0,
    vy: 0,
    angle: Math.PI / 2,
    hull: config.hull,
    maxHull: config.hull,
    speed: config.speed,
    damage: config.damage,
    score: config.score,
    fireRate: config.fireRate,
    fireCooldown: Math.random() * config.fireRate,
    type: type,
    color: config.color,
    size: config.size,
    glow: config.glow,
    pattern: Math.random() > 0.5 ? 'zigzag' : 'chase',
    patternTimer: 0
  };
  enemies.push(enemy);
  game.enemiesRemaining++;
}

function spawnWave() {
  const wave = game.wave;
  let count = 3 + Math.floor(wave * 1.5);

  if (wave === 10) {
    spawnEnemy('boss');
    count = 2;
  }

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (game.state !== 'playing') return;
      let type = 'scout';
      if (wave >= 3 && Math.random() < 0.3) type = 'hunter';
      if (wave >= 5 && Math.random() < 0.2) type = 'destroyer';
      spawnEnemy(type);
    }, i * 500);
  }
}

function shootProjectile(x, y, angle, isPlayer, damage = 10) {
  const speed = isPlayer ? 500 : 200;
  projectiles.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    isPlayer,
    damage,
    life: 3,
    size: isPlayer ? 6 : 5,
    color: isPlayer ? COLORS.gold : COLORS.damage
  });

  if (isPlayer) {
    spawnCannonFlash(x, y, angle);
  }
}

function playerShoot() {
  if (player.fireCooldown > 0) return;

  const baseAngle = player.angle;
  const damage = 15 + player.power * 5;

  if (player.power >= 3) {
    // Five-way spread
    for (let i = -2; i <= 2; i++) {
      shootProjectile(player.x, player.y, baseAngle + i * 0.15, true, damage);
    }
  } else if (player.power >= 2) {
    // Triple shot
    shootProjectile(player.x, player.y, baseAngle - 0.1, true, damage);
    shootProjectile(player.x, player.y, baseAngle, true, damage);
    shootProjectile(player.x, player.y, baseAngle + 0.1, true, damage);
  } else {
    shootProjectile(player.x, player.y, baseAngle, true, damage);
  }

  player.fireCooldown = player.fireRate;
  addShake(1);
}

function playerSpecial() {
  if (player.specialCooldown > 0) return;

  // Fan pattern special attack
  for (let i = -4; i <= 4; i++) {
    shootProjectile(player.x, player.y, player.angle + i * 0.2, true, 25);
  }

  player.specialCooldown = player.specialMaxCooldown;
  addShake(3);
}

function spawnPowerup(x, y) {
  const types = ['health', 'shield', 'power', 'score'];
  const type = types[Math.floor(Math.random() * types.length)];
  const colors = {
    health: COLORS.health,
    shield: COLORS.shield,
    power: COLORS.power,
    score: COLORS.gold
  };
  powerups.push({
    x, y,
    type,
    color: colors[type],
    life: 8,
    bobTimer: Math.random() * Math.PI * 2
  });
}

function damagePlayer(amount) {
  if (player.invincible > 0) return;

  if (player.shield > 0) {
    const shieldDamage = Math.min(player.shield, amount);
    player.shield -= shieldDamage;
    amount -= shieldDamage;
    player.shieldRegenDelay = 2;
  }

  if (amount > 0) {
    player.hull -= amount;
    addShake(4);
    player.invincible = 0.5;
    spawnDamageNumbers(player.x, player.y, amount);
  }

  if (player.hull <= 0) {
    gameOver();
  }
}

function gameOver() {
  game.state = 'gameover';
  spawnExplosion(player.x, player.y, 2);
}

// Update functions
function updatePlayer(dt) {
  // Movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
    player.angle = Math.atan2(dy, dx);
  }

  // Apply velocity with smoothing
  const targetVx = dx * player.speed;
  const targetVy = dy * player.speed;
  player.vx += (targetVx - player.vx) * 8 * dt;
  player.vy += (targetVy - player.vy) * 8 * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Bounds
  player.x = Math.max(30, Math.min(770, player.x));
  player.y = Math.max(30, Math.min(570, player.y));

  // Shooting
  if (keys['j'] || keys[' ']) {
    playerShoot();
  }
  if (keys['k']) {
    playerSpecial();
  }

  // Cooldowns
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.specialCooldown = Math.max(0, player.specialCooldown - dt);
  player.invincible = Math.max(0, player.invincible - dt);

  // Shield regen
  player.shieldRegenDelay = Math.max(0, player.shieldRegenDelay - dt);
  if (player.shieldRegenDelay === 0 && player.shield < player.maxShield) {
    player.shield = Math.min(player.maxShield, player.shield + 5 * dt);
  }

  // Wake particles
  if (Math.abs(player.vx) > 50 || Math.abs(player.vy) > 50) {
    if (Math.random() < 0.3) {
      spawnWake(player.x, player.y, player.angle);
    }
  }
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // Movement pattern
    e.patternTimer += dt;
    let targetX = player.x;
    let targetY = Math.min(player.y - 100, 300);

    if (e.pattern === 'zigzag') {
      targetX += Math.sin(e.patternTimer * 2) * 150;
    }

    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      e.vx += (dx / dist) * e.speed * dt * 2;
      e.vy += (dy / dist) * e.speed * dt * 2;
    }

    // Friction
    e.vx *= 0.98;
    e.vy *= 0.98;

    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // Bounds
    e.x = Math.max(30, Math.min(770, e.x));

    // Aim at player
    e.angle = Math.atan2(player.y - e.y, player.x - e.x);

    // Shooting
    e.fireCooldown -= dt;
    if (e.fireCooldown <= 0 && e.y > 50) {
      shootProjectile(e.x, e.y, e.angle, false, e.damage);
      e.fireCooldown = e.fireRate;

      // Boss shoots spread
      if (e.type === 'boss') {
        shootProjectile(e.x, e.y, e.angle - 0.3, false, e.damage);
        shootProjectile(e.x, e.y, e.angle + 0.3, false, e.damage);
      }
    }

    // Collision with player
    const pdist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
    if (pdist < e.size + 20) {
      damagePlayer(e.damage);
      e.hull -= 30;
    }

    // Death
    if (e.hull <= 0) {
      spawnExplosion(e.x, e.y, e.size / 20);
      game.score += e.score;
      game.enemiesRemaining--;

      // Drop powerup
      if (Math.random() < 0.25 || e.type === 'boss') {
        spawnPowerup(e.x, e.y);
      }

      enemies.splice(i, 1);
    }
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    // Trail particles
    if (Math.random() < 0.3) {
      particles.push(new Particle(p.x, p.y, {
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 0.2,
        size: 2,
        color: p.color,
        glow: true
      }));
    }

    // Out of bounds
    if (p.x < 0 || p.x > 800 || p.y < 0 || p.y > 600 || p.life <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    // Player projectile hitting enemies
    if (p.isPlayer) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
        if (dist < e.size) {
          e.hull -= p.damage;
          spawnDamageNumbers(e.x, e.y, p.damage);
          projectiles.splice(i, 1);
          break;
        }
      }
    } else {
      // Enemy projectile hitting player
      const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
      if (dist < 25) {
        damagePlayer(p.damage);
        projectiles.splice(i, 1);
      }
    }
  }
}

function updatePowerups(dt) {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.life -= dt;
    p.bobTimer += dt * 3;

    if (p.life <= 0) {
      powerups.splice(i, 1);
      continue;
    }

    // Pickup
    const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
    if (dist < 35) {
      spawnPowerupPickup(p.x, p.y, p.color);

      switch (p.type) {
        case 'health':
          player.hull = Math.min(player.maxHull, player.hull + 30);
          break;
        case 'shield':
          player.shield = player.maxShield;
          break;
        case 'power':
          player.power = Math.min(3, player.power + 1);
          break;
        case 'score':
          game.score += 200;
          break;
      }

      powerups.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) {
      particles.splice(i, 1);
    }
  }
}

function updateShake() {
  if (shake.intensity > 0.1) {
    shake.x = (Math.random() - 0.5) * shake.intensity * 2;
    shake.y = (Math.random() - 0.5) * shake.intensity * 2;
    shake.intensity *= shake.decay;
  } else {
    shake.x = 0;
    shake.y = 0;
    shake.intensity = 0;
  }
}

function updateWaves(dt) {
  if (game.state !== 'playing') return;

  if (game.waveTimer > 0) {
    game.waveTimer -= dt;
    if (game.waveTimer <= 0) {
      spawnWave();
    }
  } else if (game.enemiesRemaining <= 0 && enemies.length === 0) {
    game.wave++;
    game.waveTimer = 3;
    game.score += game.wave * 50;
  }
}

// Draw functions
function drawBackground() {
  // Gradient ocean
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, COLORS.deepOcean);
  gradient.addColorStop(0.5, COLORS.midOcean);
  gradient.addColorStop(1, COLORS.lightOcean);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  // Animated waves
  ctx.strokeStyle = 'rgba(141, 105, 122, 0.2)';
  ctx.lineWidth = 2;
  for (let y = 50; y < 600; y += 80) {
    ctx.beginPath();
    for (let x = 0; x <= 800; x += 10) {
      const wave = Math.sin((x + game.time * 50) * 0.02 + y * 0.01) * 8;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawShip(x, y, angle, size, color, glowColor, hullPercent = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = glowColor;

  // Hull damage overlay
  const damageColor = hullPercent < 0.3 ? COLORS.damage : null;

  // Ship body
  ctx.fillStyle = damageColor || color;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, -size * 0.5);
  ctx.lineTo(-size * 0.4, 0);
  ctx.lineTo(-size * 0.6, size * 0.5);
  ctx.closePath();
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(size * 0.8, 0);
  ctx.lineTo(-size * 0.2, -size * 0.3);
  ctx.lineTo(-size * 0.1, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPlayer() {
  const flash = player.invincible > 0 && Math.floor(player.invincible * 10) % 2;
  if (flash) return;

  // Shield glow
  if (player.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.3 * (player.shield / player.maxShield);
    ctx.strokeStyle = COLORS.shieldGlow;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.shield;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawShip(player.x, player.y, player.angle, 25, COLORS.bright, COLORS.gold, player.hull / player.maxHull);
}

function drawEnemies() {
  for (const e of enemies) {
    drawShip(e.x, e.y, e.angle, e.size, e.color, e.glow, e.hull / e.maxHull);

    // Health bar for bosses
    if (e.type === 'boss') {
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - 40, e.y - e.size - 15, 80, 8);
      ctx.fillStyle = COLORS.health;
      ctx.fillRect(e.x - 38, e.y - e.size - 13, 76 * (e.hull / e.maxHull), 4);
    }
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPowerups() {
  for (const p of powerups) {
    const bob = Math.sin(p.bobTimer) * 5;
    const alpha = p.life < 2 ? p.life / 2 : 1;

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.globalAlpha = alpha;

    // Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;

    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    // Inner shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    p.draw(ctx);
  }
}

function drawUI() {
  // HUD background
  ctx.fillStyle = 'rgba(13, 43, 69, 0.8)';
  ctx.fillRect(10, 10, 200, 90);
  ctx.strokeStyle = COLORS.foam;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 200, 90);

  // Hull bar
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 25, 140, 14);
  ctx.fillStyle = player.hull < 30 ? COLORS.damage : COLORS.health;
  ctx.fillRect(22, 27, 136 * (player.hull / player.maxHull), 10);
  ctx.fillStyle = COLORS.white;
  ctx.font = '12px monospace';
  ctx.fillText('HULL', 165, 36);

  // Shield bar
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 45, 140, 14);
  ctx.fillStyle = COLORS.shield;
  ctx.fillRect(22, 47, 136 * (player.shield / player.maxShield), 10);
  ctx.fillStyle = COLORS.white;
  ctx.fillText('SHLD', 165, 56);

  // Special cooldown
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 65, 140, 14);
  const specialReady = player.specialCooldown <= 0;
  ctx.fillStyle = specialReady ? COLORS.power : '#666';
  const specialPercent = specialReady ? 1 : 1 - (player.specialCooldown / player.specialMaxCooldown);
  ctx.fillRect(22, 67, 136 * specialPercent, 10);
  ctx.fillStyle = COLORS.white;
  ctx.fillText('SPEC', 165, 76);

  // Score and wave (right side)
  ctx.fillStyle = 'rgba(13, 43, 69, 0.8)';
  ctx.fillRect(590, 10, 200, 60);
  ctx.strokeStyle = COLORS.foam;
  ctx.strokeRect(590, 10, 200, 60);

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${game.score}`, 780, 35);
  ctx.fillStyle = COLORS.bright;
  ctx.font = '16px monospace';
  ctx.fillText(`WAVE ${game.wave}`, 780, 58);
  ctx.textAlign = 'left';

  // Power level indicators
  ctx.fillStyle = COLORS.white;
  ctx.font = '12px monospace';
  ctx.fillText(`PWR: ${'★'.repeat(player.power)}${'☆'.repeat(3 - player.power)}`, 20, 95);

  // Wave incoming text
  if (game.waveTimer > 0) {
    ctx.save();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.gold;
    ctx.fillText(`WAVE ${game.wave} INCOMING`, 400, 200);
    ctx.font = '20px monospace';
    ctx.fillText(Math.ceil(game.waveTimer).toString(), 400, 240);
    ctx.restore();
  }
}

function drawTitle() {
  drawBackground();

  ctx.save();
  ctx.textAlign = 'center';

  // Title with glow
  ctx.shadowBlur = 30;
  ctx.shadowColor = COLORS.gold;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px monospace';
  ctx.fillText('PIRATEERS', 400, 200);

  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.bright;
  ctx.fillStyle = COLORS.bright;
  ctx.font = '24px monospace';
  ctx.fillText('POLISHED EDITION', 400, 250);

  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white;
  ctx.font = '18px monospace';
  ctx.fillText('WASD / Arrow Keys - Move', 400, 340);
  ctx.fillText('J / Space - Fire', 400, 370);
  ctx.fillText('K - Special Attack', 400, 400);

  // Pulsing start text
  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('PRESS ENTER TO START', 400, 480);

  ctx.restore();
}

function drawGameOver() {
  // Darken background
  ctx.fillStyle = 'rgba(10, 10, 18, 0.8)';
  ctx.fillRect(0, 0, 800, 600);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.shadowBlur = 20;
  ctx.shadowColor = COLORS.damage;
  ctx.fillStyle = COLORS.damage;
  ctx.font = 'bold 48px monospace';
  ctx.fillText('GAME OVER', 400, 250);

  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.gold;
  ctx.font = '28px monospace';
  ctx.fillText(`FINAL SCORE: ${game.score}`, 400, 320);
  ctx.fillText(`WAVES SURVIVED: ${game.wave - 1}`, 400, 360);

  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.bright;
  ctx.font = '20px monospace';
  ctx.fillText('PRESS ENTER TO CONTINUE', 400, 450);

  ctx.restore();
}

// Main loop
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  game.time += dt;

  // Update
  updateShake();

  if (game.state === 'playing') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePowerups(dt);
    updateWaves(dt);
  }

  updateParticles(dt);

  // Draw with screen shake
  ctx.save();
  ctx.translate(shake.x, shake.y);

  if (game.state === 'title') {
    drawTitle();
  } else if (game.state === 'playing') {
    drawBackground();
    drawParticles();
    drawPowerups();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawUI();
  } else if (game.state === 'gameover') {
    drawBackground();
    drawParticles();
    drawGameOver();
  }

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// Expose game state for testing
Object.defineProperty(window, 'gameState', {
  get: function() {
    return {
      screen: game.state === 'playing' ? 'game' : game.state,
      score: game.score,
      wave: game.wave,
      playerHull: player.hull,
      playerShield: player.shield,
      playerPower: player.power,
      enemyCount: enemies.length,
      projectileCount: projectiles.length,
      powerupCount: powerups.length,
      particleCount: particles.length
    };
  }
});

// Start
requestAnimationFrame(gameLoop);
