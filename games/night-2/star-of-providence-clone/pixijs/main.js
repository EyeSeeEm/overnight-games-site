// Star of Providence Clone - Bullet Hell Roguelike Shooter
// Built with vanilla Canvas (PixiJS style)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game configuration
const CONFIG = {
  width: 800,
  height: 600,
  roomWidth: 700,
  roomHeight: 500,
  roomOffsetX: 50,
  roomOffsetY: 80,
  playerSpeed: 250,
  focusSpeed: 100,
  dashDistance: 120,
  dashDuration: 100,
  dashCooldown: 500,
  dashIFrames: 150,
  bulletSpeed: 600,
  fireRate: 100,
  enemyBulletSpeed: 200
};

// Game state
const game = {
  state: 'menu',
  player: null,
  enemies: [],
  playerBullets: [],
  enemyBullets: [],
  pickups: [],
  particles: [],
  floor: 1,
  room: 0,
  roomsCleared: 0,
  score: 0,
  multiplier: 1.0,
  debris: 0,
  lastTime: 0,
  keys: {},
  mouseX: 400,
  mouseY: 300,
  soundEnabled: true,
  musicEnabled: true,
  stats: {
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    enemiesKilled: 0,
    bossesDefeated: 0
  }
};

// Audio context
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(freq, type = 'square', duration = 0.1, volume = 0.2) {
  if (!game.soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 4; // Tiny hitbox for bullet hell
    this.spriteSize = 24;
    this.hp = 4;
    this.maxHp = 4;
    this.shields = 0;
    this.bombs = 2;
    this.maxBombs = 6;
    this.damage = 5;
    this.damageMultiplier = 1.0;
    this.fireTimer = 0;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.isDashing = false;
    this.isFocused = false;
    this.ammo = Infinity;
  }

  update(dt) {
    // Update timers
    if (this.dashCooldown > 0) this.dashCooldown -= dt * 1000;
    if (this.dashTimer > 0) this.dashTimer -= dt * 1000;
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt * 1000;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }
    if (this.fireTimer > 0) this.fireTimer -= dt * 1000;
    if (this.dashTimer <= 0) this.isDashing = false;

    // Movement
    const speed = this.isFocused ? CONFIG.focusSpeed : CONFIG.playerSpeed;
    let mx = 0, my = 0;
    if (game.keys['ArrowLeft'] || game.keys['KeyA']) mx -= 1;
    if (game.keys['ArrowRight'] || game.keys['KeyD']) mx += 1;
    if (game.keys['ArrowUp'] || game.keys['KeyW']) my -= 1;
    if (game.keys['ArrowDown'] || game.keys['KeyS']) my += 1;

    // Normalize diagonal
    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    if (!this.isDashing) {
      this.x += mx * speed * dt;
      this.y += my * speed * dt;
    }

    // Clamp to room bounds
    const minX = CONFIG.roomOffsetX + this.spriteSize / 2;
    const maxX = CONFIG.roomOffsetX + CONFIG.roomWidth - this.spriteSize / 2;
    const minY = CONFIG.roomOffsetY + this.spriteSize / 2;
    const maxY = CONFIG.roomOffsetY + CONFIG.roomHeight - this.spriteSize / 2;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // Focus mode
    this.isFocused = game.keys['ShiftLeft'] || game.keys['ShiftRight'];

    // Shooting
    if ((game.keys['Space'] || game.keys['click']) && this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = CONFIG.fireRate;
    }

    // Dash
    if ((game.keys['KeyZ'] || game.keys['KeyQ']) && this.dashCooldown <= 0 && !this.isDashing) {
      this.dash(mx, my);
      game.keys['KeyZ'] = false;
      game.keys['KeyQ'] = false;
    }

    // Bomb
    if (game.keys['KeyX'] && this.bombs > 0) {
      this.useBomb();
      game.keys['KeyX'] = false;
    }
  }

  shoot() {
    // Calculate aim direction (toward mouse or up by default)
    let angle = -Math.PI / 2; // Default up
    if (game.mouseY !== undefined) {
      angle = Math.atan2(game.mouseY - this.y, game.mouseX - this.x);
    }

    const bullet = {
      x: this.x,
      y: this.y - 10,
      vx: Math.cos(angle) * CONFIG.bulletSpeed,
      vy: Math.sin(angle) * CONFIG.bulletSpeed,
      radius: 4,
      damage: this.damage * this.damageMultiplier,
      isPlayer: true
    };
    game.playerBullets.push(bullet);
    playSound(800, 'square', 0.05, 0.15);
  }

  dash(dirX, dirY) {
    if (dirX === 0 && dirY === 0) dirY = -1; // Default up
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0) {
      dirX /= len;
      dirY /= len;
    }

    this.isDashing = true;
    this.isInvincible = true;
    this.dashTimer = CONFIG.dashDuration;
    this.dashCooldown = CONFIG.dashCooldown;

    // Dash movement
    const targetX = this.x + dirX * CONFIG.dashDistance;
    const targetY = this.y + dirY * CONFIG.dashDistance;
    this.dashTargetX = targetX;
    this.dashTargetY = targetY;
    this.dashStartX = this.x;
    this.dashStartY = this.y;
    this.dashProgress = 0;

    // Animate dash
    const dashStep = () => {
      if (this.dashProgress < 1) {
        this.dashProgress += 0.15;
        this.x = this.dashStartX + (this.dashTargetX - this.dashStartX) * this.dashProgress;
        this.y = this.dashStartY + (this.dashTargetY - this.dashStartY) * this.dashProgress;
        requestAnimationFrame(dashStep);
      }
    };
    dashStep();

    // Set i-frames
    setTimeout(() => {
      this.invincibleTimer = CONFIG.dashIFrames - CONFIG.dashDuration;
    }, CONFIG.dashDuration);

    playSound(400, 'sine', 0.1, 0.2);
  }

  useBomb() {
    this.bombs--;
    this.isInvincible = true;
    this.invincibleTimer = 1000;

    // Clear all enemy bullets
    game.enemyBullets = [];

    // Damage all enemies
    game.enemies.forEach(e => {
      e.hp -= 50;
      spawnParticles(e.x, e.y, '#ffff00', 5);
    });

    // Multiplier penalty
    game.multiplier = Math.max(1.0, game.multiplier - 1.0);

    // Visual effect
    spawnParticles(this.x, this.y, '#ffff00', 30);
    playSound(200, 'sawtooth', 0.3, 0.3);
  }

  takeDamage(amount) {
    if (this.isInvincible) return;

    // Shields absorb first
    if (this.shields > 0) {
      this.shields -= amount;
      if (this.shields < 0) {
        this.hp += this.shields;
        this.shields = 0;
      }
    } else {
      this.hp -= amount;
    }

    // Multiplier penalty
    game.multiplier = Math.max(1.0, game.multiplier - 1.0);

    // Invincibility
    this.isInvincible = true;
    this.invincibleTimer = 1000;

    spawnParticles(this.x, this.y, '#ff0000', 10);
    playSound(150, 'sawtooth', 0.2, 0.3);

    if (this.hp <= 0) {
      gameOver();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flash when invincible
    if (this.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Ship body
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-10, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(10, 12);
    ctx.closePath();
    ctx.fill();

    // Engine glow
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.ellipse(0, 10, 4, 6 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Focus indicator
    if (this.isFocused) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();

      // Show tiny hitbox
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Enemy classes
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.fireTimer = Math.random() * 2000;
    this.activationDelay = 500;
    this.debris = 10;
    this.moveTimer = 0;
    this.angle = 0;

    // Type-specific stats
    switch (type) {
      case 'ghost':
        this.hp = 50;
        this.speed = 80;
        this.debris = 10;
        this.fireRate = 2000;
        this.color = '#8844ff';
        break;
      case 'drone':
        this.hp = 70;
        this.speed = 150;
        this.debris = 30;
        this.fireRate = 1500;
        this.color = '#44aaff';
        break;
      case 'turret':
        this.hp = 90;
        this.speed = 0;
        this.debris = 25;
        this.fireRate = 800;
        this.color = '#ffaa00';
        break;
      case 'heavy':
        this.hp = 180;
        this.speed = 60;
        this.debris = 50;
        this.fireRate = 2500;
        this.radius = 18;
        this.color = '#ff4444';
        break;
      case 'boss':
        this.hp = 1500;
        this.maxHp = 1500;
        this.speed = 40;
        this.debris = 500;
        this.fireRate = 1000;
        this.radius = 40;
        this.color = '#ff00ff';
        this.phase = 0;
        this.patternTimer = 0;
        break;
      default:
        this.hp = 30;
        this.speed = 100;
        this.debris = 5;
        this.fireRate = 2000;
        this.color = '#ff8844';
    }
  }

  update(dt) {
    if (this.activationDelay > 0) {
      this.activationDelay -= dt * 1000;
      return;
    }

    this.fireTimer -= dt * 1000;
    this.moveTimer += dt * 1000;

    // Movement AI
    switch (this.type) {
      case 'ghost':
        this.chasePlayer(dt);
        break;
      case 'drone':
        this.dashToPlayer(dt);
        break;
      case 'turret':
        // Stationary
        break;
      case 'heavy':
        this.advanceSlowly(dt);
        break;
      case 'boss':
        this.bossAI(dt);
        break;
      default:
        this.wander(dt);
    }

    // Clamp to room
    const minX = CONFIG.roomOffsetX + this.radius;
    const maxX = CONFIG.roomOffsetX + CONFIG.roomWidth - this.radius;
    const minY = CONFIG.roomOffsetY + this.radius;
    const maxY = CONFIG.roomOffsetY + CONFIG.roomHeight - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // Shooting
    if (this.fireTimer <= 0) {
      this.attack();
      this.fireTimer = this.fireRate;
    }
  }

  chasePlayer(dt) {
    if (!game.player) return;
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  dashToPlayer(dt) {
    if (!game.player) return;
    if (this.moveTimer > 2000) {
      this.moveTimer = 0;
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.vx = (dx / dist) * this.speed * 2;
        this.vy = (dy / dist) * this.speed * 2;
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  advanceSlowly(dt) {
    if (!game.player) return;
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 150) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  wander(dt) {
    this.angle += (Math.random() - 0.5) * 2 * dt;
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
  }

  bossAI(dt) {
    this.patternTimer += dt * 1000;

    // Phase transitions
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent < 0.33 && this.phase < 2) {
      this.phase = 2;
      this.fireRate = 600;
    } else if (hpPercent < 0.66 && this.phase < 1) {
      this.phase = 1;
      this.fireRate = 800;
    }

    // Movement pattern
    const centerX = CONFIG.roomOffsetX + CONFIG.roomWidth / 2;
    const centerY = CONFIG.roomOffsetY + 150;
    const orbitRadius = 100 + Math.sin(this.patternTimer / 2000) * 50;
    this.x = centerX + Math.cos(this.patternTimer / 1500) * orbitRadius;
    this.y = centerY + Math.sin(this.patternTimer / 1000) * 50;
  }

  attack() {
    if (!game.player) return;

    switch (this.type) {
      case 'ghost':
        this.shootAtPlayer(1);
        break;
      case 'drone':
        this.shootSpread(3, 30);
        break;
      case 'turret':
        this.shootRing(8);
        break;
      case 'heavy':
        this.shootSpread(5, 45);
        break;
      case 'boss':
        this.bossAttack();
        break;
      default:
        this.shootAtPlayer(1);
    }
  }

  shootAtPlayer(count) {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const angle = Math.atan2(dy, dx);
    for (let i = 0; i < count; i++) {
      this.fireBullet(angle);
    }
  }

  shootSpread(count, spreadAngle) {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const baseAngle = Math.atan2(dy, dx);
    const spreadRad = spreadAngle * Math.PI / 180;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * (spreadRad / count);
      this.fireBullet(baseAngle + offset);
    }
  }

  shootRing(count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.fireBullet(angle);
    }
  }

  bossAttack() {
    switch (this.phase) {
      case 0:
        // Spread shots
        this.shootSpread(5, 60);
        break;
      case 1:
        // Ring + aimed
        if (this.patternTimer % 2000 < 1000) {
          this.shootRing(12);
        } else {
          this.shootAtPlayer(3);
        }
        break;
      case 2:
        // Spiral + rapid
        const spiralAngle = this.patternTimer / 100;
        this.fireBullet(spiralAngle);
        this.fireBullet(spiralAngle + Math.PI);
        if (Math.random() < 0.3) {
          this.shootAtPlayer(2);
        }
        break;
    }
  }

  fireBullet(angle, speed = CONFIG.enemyBulletSpeed) {
    game.enemyBullets.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4,
      damage: 1,
      isPlayer: false
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    spawnParticles(this.x, this.y, this.color, 3);

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    // Multiplier gain
    game.multiplier = Math.min(3.0, game.multiplier + 0.05);

    // Debris
    const actualDebris = Math.floor(this.debris * game.multiplier);
    game.debris += actualDebris;
    game.score += actualDebris;
    game.stats.enemiesKilled++;

    // Spawn pickups
    if (Math.random() < 0.2) {
      game.pickups.push({
        x: this.x,
        y: this.y,
        type: Math.random() < 0.7 ? 'health' : 'bomb',
        radius: 10
      });
    }

    spawnParticles(this.x, this.y, this.color, 15);
    playSound(200, 'square', 0.15, 0.2);

    if (this.type === 'boss') {
      game.stats.bossesDefeated++;
      bossDefeated();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.activationDelay > 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = this.color;

    if (this.type === 'boss') {
      // Boss is a large octagon
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = this.radius + Math.sin(Date.now() / 200 + i) * 5;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Boss HP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(-40, -55, 80, 8);
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(-40, -55, 80 * (this.hp / this.maxHp), 8);
    } else if (this.type === 'turret') {
      // Turret is square
      ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
      // Gun
      const angle = game.player ? Math.atan2(game.player.y - this.y, game.player.x - this.x) : 0;
      ctx.rotate(angle);
      ctx.fillStyle = '#886600';
      ctx.fillRect(0, -3, this.radius + 8, 6);
    } else {
      // Others are circles
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Spawn particles
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: 0.5,
      color,
      radius: 2 + Math.random() * 3
    });
  }
}

// Game functions
function startGame() {
  initAudio();
  game.state = 'playing';
  game.player = new Player(CONFIG.roomOffsetX + CONFIG.roomWidth / 2, CONFIG.roomOffsetY + CONFIG.roomHeight - 50);
  game.enemies = [];
  game.playerBullets = [];
  game.enemyBullets = [];
  game.pickups = [];
  game.particles = [];
  game.floor = 1;
  game.room = 1;
  game.roomsCleared = 0;
  game.score = 0;
  game.multiplier = 1.0;
  game.debris = 0;
  game.stats.gamesPlayed++;
  spawnRoom();
  playSound(440, 'sine', 0.2, 0.2);
}

function spawnRoom() {
  game.enemies = [];
  game.enemyBullets = [];

  // Boss room every 5 rooms
  if (game.room % 5 === 0) {
    game.enemies.push(new Enemy(
      CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
      CONFIG.roomOffsetY + 100,
      'boss'
    ));
    return;
  }

  // Normal room
  const enemyCount = 3 + Math.floor(game.room / 2);
  const types = ['ghost', 'drone', 'turret', 'heavy'];
  const availableTypes = types.slice(0, Math.min(types.length, 1 + Math.floor(game.room / 2)));

  for (let i = 0; i < enemyCount; i++) {
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const x = CONFIG.roomOffsetX + 50 + Math.random() * (CONFIG.roomWidth - 100);
    const y = CONFIG.roomOffsetY + 50 + Math.random() * (CONFIG.roomHeight / 2);
    game.enemies.push(new Enemy(x, y, type));
  }
}

function nextRoom() {
  game.room++;
  game.roomsCleared++;
  game.player.x = CONFIG.roomOffsetX + CONFIG.roomWidth / 2;
  game.player.y = CONFIG.roomOffsetY + CONFIG.roomHeight - 50;

  // Recharge bomb every 3 rooms
  if (game.roomsCleared % 3 === 0 && game.player.bombs < game.player.maxBombs) {
    game.player.bombs++;
  }

  spawnRoom();
  playSound(660, 'sine', 0.15, 0.2);
}

function bossDefeated() {
  game.state = 'victory';
  game.stats.bestScore = Math.max(game.stats.bestScore, game.score);
  saveStats();
  playSound(880, 'sine', 0.5, 0.3);
}

function gameOver() {
  game.state = 'gameover';
  game.stats.bestScore = Math.max(game.stats.bestScore, game.score);
  saveStats();
  playSound(110, 'sawtooth', 0.5, 0.3);
}

function saveStats() {
  try {
    localStorage.setItem('starofprovidence_stats', JSON.stringify(game.stats));
  } catch (e) {}
}

function loadStats() {
  try {
    const saved = localStorage.getItem('starofprovidence_stats');
    if (saved) {
      Object.assign(game.stats, JSON.parse(saved));
    }
  } catch (e) {}
}

// Update functions
function updateBullets(dt) {
  // Player bullets
  game.playerBullets = game.playerBullets.filter(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Check enemy collisions
    for (let i = game.enemies.length - 1; i >= 0; i--) {
      const e = game.enemies[i];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.radius + e.radius) {
        if (e.takeDamage(b.damage)) {
          game.enemies.splice(i, 1);
        }
        return false;
      }
    }

    // Remove if out of bounds
    return b.x > 0 && b.x < CONFIG.width && b.y > 0 && b.y < CONFIG.height;
  });

  // Enemy bullets
  game.enemyBullets = game.enemyBullets.filter(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Check player collision
    if (game.player && !game.player.isInvincible) {
      const dx = b.x - game.player.x;
      const dy = b.y - game.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.radius + game.player.radius) {
        game.player.takeDamage(b.damage);
        return false;
      }
    }

    return b.x > 0 && b.x < CONFIG.width && b.y > 0 && b.y < CONFIG.height;
  });
}

function updatePickups(dt) {
  game.pickups = game.pickups.filter(p => {
    if (!game.player) return false;
    const dx = p.x - game.player.x;
    const dy = p.y - game.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < p.radius + game.player.spriteSize / 2) {
      if (p.type === 'health' && game.player.hp < game.player.maxHp) {
        game.player.hp++;
        playSound(880, 'sine', 0.1, 0.2);
      } else if (p.type === 'bomb' && game.player.bombs < game.player.maxBombs) {
        game.player.bombs++;
        playSound(440, 'sine', 0.1, 0.2);
      }
      return false;
    }
    return true;
  });
}

function updateParticles(dt) {
  game.particles = game.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
    return p.life > 0;
  });
}

// Draw functions
function drawRoom() {
  // Room background
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(CONFIG.roomOffsetX, CONFIG.roomOffsetY, CONFIG.roomWidth, CONFIG.roomHeight);

  // Room border
  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 3;
  ctx.strokeRect(CONFIG.roomOffsetX, CONFIG.roomOffsetY, CONFIG.roomWidth, CONFIG.roomHeight);

  // Grid pattern
  ctx.strokeStyle = '#222244';
  ctx.lineWidth = 1;
  for (let x = CONFIG.roomOffsetX; x <= CONFIG.roomOffsetX + CONFIG.roomWidth; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, CONFIG.roomOffsetY);
    ctx.lineTo(x, CONFIG.roomOffsetY + CONFIG.roomHeight);
    ctx.stroke();
  }
  for (let y = CONFIG.roomOffsetY; y <= CONFIG.roomOffsetY + CONFIG.roomHeight; y += 50) {
    ctx.beginPath();
    ctx.moveTo(CONFIG.roomOffsetX, y);
    ctx.lineTo(CONFIG.roomOffsetX + CONFIG.roomWidth, y);
    ctx.stroke();
  }
}

function drawBullets() {
  // Player bullets
  ctx.fillStyle = '#ffff00';
  game.playerBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemy bullets
  ctx.fillStyle = '#ff4444';
  game.enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPickups() {
  game.pickups.forEach(p => {
    if (p.type === 'health') {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 8);
      ctx.bezierCurveTo(p.x - 8, p.y - 8, p.x - 8, p.y + 4, p.x, p.y + 8);
      ctx.bezierCurveTo(p.x + 8, p.y + 4, p.x + 8, p.y - 8, p.x, p.y - 8);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawParticles() {
  game.particles.forEach(p => {
    ctx.globalAlpha = p.life * 2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * p.life * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  // Top bar background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, CONFIG.width, 70);

  // HP
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText('HP:', 20, 25);
  for (let i = 0; i < game.player.maxHp; i++) {
    ctx.fillStyle = i < game.player.hp ? '#ff0000' : '#333333';
    ctx.fillRect(50 + i * 18, 12, 14, 14);
  }

  // Shields
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SH:', 20, 50);
  for (let i = 0; i < game.player.shields; i++) {
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(50 + i * 18, 37, 14, 14);
  }

  // Bombs
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BOMBS:', 200, 25);
  for (let i = 0; i < game.player.maxBombs; i++) {
    ctx.fillStyle = i < game.player.bombs ? '#ffaa00' : '#333333';
    ctx.beginPath();
    ctx.arc(265 + i * 18, 20, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Multiplier
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`MULT: x${game.multiplier.toFixed(2)}`, 200, 50);

  // Score / Debris
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`DEBRIS: ${game.debris}`, 400, 25);
  ctx.fillText(`SCORE: ${game.score}`, 400, 50);

  // Floor / Room
  ctx.fillStyle = '#00ff88';
  ctx.textAlign = 'right';
  ctx.fillText(`FLOOR ${game.floor} - ROOM ${game.room}`, CONFIG.width - 20, 25);
  ctx.fillText(`ENEMIES: ${game.enemies.length}`, CONFIG.width - 20, 50);
  ctx.textAlign = 'left';

  // Bottom bar
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, CONFIG.height - 20, CONFIG.width, 20);
  ctx.fillStyle = '#666666';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | SHIFT: Focus | SPACE: Fire | Z: Dash | X: Bomb', 20, CONFIG.height - 6);
}

function drawMenu() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // Title
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STAR OF PROVIDENCE', CONFIG.width / 2, 150);

  ctx.fillStyle = '#8844ff';
  ctx.font = '20px monospace';
  ctx.fillText('Bullet Hell Roguelike', CONFIG.width / 2, 190);

  // Instructions
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('Press ENTER or CLICK to Start', CONFIG.width / 2, 300);

  ctx.fillStyle = '#888888';
  ctx.font = '14px monospace';
  ctx.fillText('WASD / Arrows - Move', CONFIG.width / 2, 380);
  ctx.fillText('SHIFT - Focus Mode (precise dodging)', CONFIG.width / 2, 405);
  ctx.fillText('SPACE - Fire', CONFIG.width / 2, 430);
  ctx.fillText('Z - Dash (i-frames)', CONFIG.width / 2, 455);
  ctx.fillText('X - Bomb (clears bullets)', CONFIG.width / 2, 480);

  // Stats
  ctx.fillStyle = '#ffaa00';
  ctx.fillText(`Best Score: ${game.stats.bestScore}`, CONFIG.width / 2, 550);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CONFIG.width / 2, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.fillText(`Final Score: ${game.score}`, CONFIG.width / 2, 280);
  ctx.fillText(`Rooms Cleared: ${game.roomsCleared}`, CONFIG.width / 2, 320);
  ctx.fillText(`Best Score: ${game.stats.bestScore}`, CONFIG.width / 2, 360);

  ctx.fillStyle = '#00ff88';
  ctx.font = '18px monospace';
  ctx.fillText('Press ENTER or CLICK to Retry', CONFIG.width / 2, 450);
  ctx.fillText('Press ESC for Menu', CONFIG.width / 2, 480);
  ctx.textAlign = 'left';
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS DEFEATED!', CONFIG.width / 2, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.fillText(`Final Score: ${game.score}`, CONFIG.width / 2, 280);
  ctx.fillText(`Rooms Cleared: ${game.roomsCleared}`, CONFIG.width / 2, 320);

  ctx.fillStyle = '#ffaa00';
  ctx.font = '18px monospace';
  ctx.fillText('Press ENTER to Continue', CONFIG.width / 2, 400);
  ctx.fillText('Press ESC for Menu', CONFIG.width / 2, 430);
  ctx.textAlign = 'left';
}

// Main game loop
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.1);
  game.lastTime = timestamp;

  // Clear
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  if (game.state === 'menu') {
    drawMenu();
  } else if (game.state === 'playing') {
    // Update
    game.player.update(dt);
    game.enemies.forEach(e => e.update(dt));
    updateBullets(dt);
    updatePickups(dt);
    updateParticles(dt);

    // Check room cleared
    if (game.enemies.length === 0) {
      nextRoom();
    }

    // Draw
    drawRoom();
    drawPickups();
    drawBullets();
    game.enemies.forEach(e => e.draw());
    game.player.draw();
    drawParticles();
    drawHUD();
  } else if (game.state === 'gameover') {
    drawRoom();
    drawBullets();
    game.enemies.forEach(e => e.draw());
    drawParticles();
    drawHUD();
    drawGameOver();
  } else if (game.state === 'victory') {
    drawRoom();
    drawParticles();
    drawHUD();
    drawVictory();
  }

  requestAnimationFrame(gameLoop);
}

// Input handling
document.addEventListener('keydown', e => {
  game.keys[e.code] = true;

  if (e.code === 'Enter') {
    if (game.state === 'menu' || game.state === 'gameover') {
      startGame();
    } else if (game.state === 'victory') {
      // Continue to next floor
      game.floor++;
      game.room++;
      game.state = 'playing';
      spawnRoom();
    }
  }

  if (e.code === 'Escape') {
    if (game.state === 'gameover' || game.state === 'victory') {
      game.state = 'menu';
    }
  }

  e.preventDefault();
});

document.addEventListener('keyup', e => {
  game.keys[e.code] = false;
});

canvas.addEventListener('click', e => {
  initAudio();
  if (game.state === 'menu' || game.state === 'gameover') {
    startGame();
  } else if (game.state === 'victory') {
    game.floor++;
    game.room++;
    game.state = 'playing';
    spawnRoom();
  }
});

canvas.addEventListener('mousedown', e => {
  game.keys['click'] = true;
});

canvas.addEventListener('mouseup', e => {
  game.keys['click'] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouseX = e.clientX - rect.left;
  game.mouseY = e.clientY - rect.top;
});

// Expose game object for testing
window.game = game;

// Initialize
loadStats();
requestAnimationFrame(gameLoop);
