// Pirateers - Expanded Edition
// Full-featured naval combat with progression, saves, and content

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 900;
const HEIGHT = 700;

// ============================================
// AUDIO SYSTEM
// ============================================
let audioCtx = null;
const sounds = {};

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const t = audioCtx.currentTime;
  switch(type) {
    case 'shoot':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
    case 'explosion':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      break;
    case 'powerup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
    case 'hit':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
    case 'menu':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
  }
}

// Background music (simple oscillator drone)
let musicOsc = null;
let musicGain = null;
function startMusic() {
  if (!audioCtx || musicOsc) return;
  musicOsc = audioCtx.createOscillator();
  musicGain = audioCtx.createGain();
  musicOsc.connect(musicGain);
  musicGain.connect(audioCtx.destination);
  musicOsc.type = 'sine';
  musicOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  musicGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  musicOsc.start();
}

function stopMusic() {
  if (musicOsc) {
    musicOsc.stop();
    musicOsc = null;
  }
}

// ============================================
// COLOR PALETTE
// ============================================
const COLORS = {
  ocean: '#0d2b45',
  oceanLight: '#203c56',
  foam: '#8d697a',
  gold: '#ffaa5e',
  bright: '#ffd4a3',
  white: '#ffecd6',
  red: '#ff6b6b',
  green: '#4ecdc4',
  purple: '#c44dff',
  orange: '#ff9f43',
  blue: '#54a0ff'
};

// ============================================
// SCREEN SHAKE
// ============================================
const shake = { intensity: 0, decay: 0.9, x: 0, y: 0 };
function addShake(amount) { shake.intensity = Math.min(shake.intensity + amount, 20); }

// ============================================
// PARTICLE SYSTEM
// ============================================
const particles = [];
class Particle {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.vx = opts.vx || (Math.random() - 0.5) * 4;
    this.vy = opts.vy || (Math.random() - 0.5) * 4;
    this.life = opts.life || 1;
    this.maxLife = this.life;
    this.size = opts.size || 4;
    this.color = opts.color || COLORS.bright;
    this.glow = opts.glow || false;
  }
  update(dt) {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.glow) { ctx.shadowBlur = 10; ctx.shadowColor = this.color; }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnExplosion(x, y, size = 1) {
  for (let i = 0; i < 20 * size; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4 * size;
    particles.push(new Particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.5,
      size: 3 + Math.random() * 4 * size,
      color: Math.random() > 0.5 ? '#ff6600' : '#ffcc00',
      glow: true
    }));
  }
  addShake(5 * size);
  playSound('explosion');
}

// ============================================
// SAVE/LOAD SYSTEM
// ============================================
const SAVE_KEY = 'pirateers_expanded_save';

function saveGame() {
  const saveData = {
    highScore: game.highScore,
    totalKills: game.stats.totalKills,
    gamesPlayed: game.stats.gamesPlayed,
    maxWave: game.stats.maxWave,
    unlocks: game.unlocks,
    settings: game.settings
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data) {
      game.highScore = data.highScore || 0;
      game.stats = data.totalKills ? {
        totalKills: data.totalKills,
        gamesPlayed: data.gamesPlayed,
        maxWave: data.maxWave
      } : game.stats;
      game.unlocks = data.unlocks || game.unlocks;
      game.settings = data.settings || game.settings;
    }
  } catch (e) {}
}

// ============================================
// GAME STATE
// ============================================
const game = {
  state: 'menu', // menu, tutorial, playing, paused, gameover, settings
  score: 0,
  highScore: 0,
  wave: 1,
  waveTimer: 0,
  time: 0,
  stats: {
    totalKills: 0,
    gamesPlayed: 0,
    maxWave: 0
  },
  unlocks: {
    tripleShot: false,
    shield: false,
    missile: false,
    laser: false
  },
  settings: {
    soundOn: true,
    musicOn: true
  },
  achievements: []
};

// ============================================
// PLAYER
// ============================================
const player = {
  x: 450, y: 600,
  vx: 0, vy: 0,
  hull: 100, maxHull: 100,
  shield: 50, maxShield: 50,
  shieldRegenDelay: 0,
  power: 1, maxPower: 5,
  speed: 300,
  fireRate: 0.15,
  fireCooldown: 0,
  specialCooldown: 0,
  specialMaxCooldown: 3,
  invincible: 0,
  weapon: 'cannon', // cannon, triple, missile, laser
  missiles: 3,
  laserCharge: 0
};

// ============================================
// ENEMY TYPES (EXPANDED - 8 types)
// ============================================
const ENEMY_TYPES = {
  scout: { hull: 30, speed: 140, damage: 10, score: 50, fireRate: 2, color: '#c73e1d', size: 18 },
  hunter: { hull: 60, speed: 100, damage: 15, score: 100, fireRate: 1.5, color: '#f4a259', size: 24 },
  destroyer: { hull: 120, speed: 60, damage: 25, score: 200, fireRate: 1, color: '#7b2cbf', size: 32 },
  bomber: { hull: 80, speed: 50, damage: 40, score: 150, fireRate: 2.5, color: '#2d6a4f', size: 28 },
  sniper: { hull: 40, speed: 30, damage: 35, score: 175, fireRate: 3, color: '#0096c7', size: 22 },
  swarm: { hull: 15, speed: 180, damage: 8, score: 25, fireRate: 4, color: '#ff6b6b', size: 12 },
  tank: { hull: 200, speed: 25, damage: 30, score: 300, fireRate: 1.5, color: '#4a4e69', size: 40 },
  boss: { hull: 800, speed: 20, damage: 50, score: 2000, fireRate: 0.4, color: '#ffd700', size: 60 }
};

const enemies = [];
const projectiles = [];
const powerups = [];

// ============================================
// POWERUP TYPES (EXPANDED - 8 types)
// ============================================
const POWERUP_TYPES = {
  health: { color: COLORS.red, effect: () => { player.hull = Math.min(player.maxHull, player.hull + 30); } },
  shield: { color: COLORS.green, effect: () => { player.shield = player.maxShield; } },
  power: { color: COLORS.purple, effect: () => { player.power = Math.min(player.maxPower, player.power + 1); } },
  score: { color: COLORS.gold, effect: () => { game.score += 500; } },
  speed: { color: COLORS.blue, effect: () => { player.speed = Math.min(400, player.speed + 20); } },
  missile: { color: COLORS.orange, effect: () => { player.missiles = Math.min(10, player.missiles + 3); } },
  nuke: { color: '#fff', effect: () => { nukeScreen(); } },
  extraLife: { color: '#ff69b4', effect: () => { player.maxHull += 20; player.hull += 20; } }
};

function nukeScreen() {
  enemies.forEach(e => {
    spawnExplosion(e.x, e.y, 0.5);
    game.score += e.score;
    game.stats.totalKills++;
  });
  enemies.length = 0;
  addShake(15);
}

// ============================================
// INPUT
// ============================================
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  handleMenuInput(e.key);
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function handleMenuInput(key) {
  if (game.state === 'menu') {
    if (key === 'Enter' || key === ' ') { startGame(); playSound('menu'); }
    if (key === 't' || key === 'T') { game.state = 'tutorial'; playSound('menu'); }
    if (key === 's' || key === 'S') { game.state = 'settings'; playSound('menu'); }
  } else if (game.state === 'tutorial') {
    if (key === 'Escape' || key === 'Enter') { game.state = 'menu'; playSound('menu'); }
  } else if (game.state === 'settings') {
    if (key === 'Escape') { game.state = 'menu'; saveGame(); playSound('menu'); }
    if (key === '1') { game.settings.soundOn = !game.settings.soundOn; playSound('menu'); }
    if (key === '2') { game.settings.musicOn = !game.settings.musicOn; playSound('menu'); }
  } else if (game.state === 'playing') {
    if (key === 'Escape' || key === 'p') { game.state = 'paused'; stopMusic(); playSound('menu'); }
  } else if (game.state === 'paused') {
    if (key === 'Escape' || key === 'p' || key === 'Enter') { game.state = 'playing'; if (game.settings.musicOn) startMusic(); playSound('menu'); }
    if (key === 'q' || key === 'Q') { game.state = 'menu'; playSound('menu'); }
  } else if (game.state === 'gameover') {
    if (key === 'Enter' || key === ' ') { game.state = 'menu'; playSound('menu'); }
  }
}

// ============================================
// GAME FUNCTIONS
// ============================================
function startGame() {
  initAudio();
  game.state = 'playing';
  game.score = 0;
  game.wave = 1;
  game.waveTimer = 3;
  game.stats.gamesPlayed++;

  resetPlayer();
  enemies.length = 0;
  projectiles.length = 0;
  powerups.length = 0;
  particles.length = 0;

  if (game.settings.musicOn) startMusic();
  saveGame();
}

function resetPlayer() {
  player.x = 450; player.y = 600;
  player.vx = player.vy = 0;
  player.hull = player.maxHull;
  player.shield = player.maxShield;
  player.power = 1;
  player.speed = 300;
  player.invincible = 0;
  player.missiles = 3;
  player.weapon = 'cannon';
}

function gameOver() {
  game.state = 'gameover';
  stopMusic();

  if (game.score > game.highScore) game.highScore = game.score;
  if (game.wave > game.stats.maxWave) game.stats.maxWave = game.wave;

  // Check unlocks
  if (game.stats.totalKills >= 50 && !game.unlocks.tripleShot) {
    game.unlocks.tripleShot = true;
    game.achievements.push('Triple Shot Unlocked!');
  }
  if (game.stats.maxWave >= 10 && !game.unlocks.shield) {
    game.unlocks.shield = true;
    game.achievements.push('Shield Upgrade Unlocked!');
  }

  saveGame();
  spawnExplosion(player.x, player.y, 2);
}

function spawnEnemy(type) {
  const config = ENEMY_TYPES[type];
  enemies.push({
    x: Math.random() * (WIDTH - 100) + 50,
    y: -50,
    vx: 0, vy: 0,
    hull: config.hull, maxHull: config.hull,
    speed: config.speed,
    damage: config.damage,
    score: config.score,
    fireRate: config.fireRate,
    fireCooldown: Math.random() * config.fireRate,
    type, color: config.color, size: config.size,
    pattern: Math.random() > 0.5 ? 'zigzag' : 'chase',
    patternTimer: 0
  });
}

function spawnWave() {
  const wave = game.wave;
  let count = 5 + Math.floor(wave * 1.5);

  if (wave % 10 === 0) {
    spawnEnemy('boss');
    count = Math.floor(count / 2);
  }

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (game.state !== 'playing') return;
      let type = 'scout';
      const r = Math.random();
      if (wave >= 2 && r < 0.25) type = 'hunter';
      if (wave >= 3 && r < 0.15) type = 'destroyer';
      if (wave >= 4 && r < 0.2) type = 'swarm';
      if (wave >= 5 && r < 0.1) type = 'bomber';
      if (wave >= 6 && r < 0.1) type = 'sniper';
      if (wave >= 8 && r < 0.08) type = 'tank';
      spawnEnemy(type);
    }, i * 400);
  }
}

function playerShoot() {
  if (player.fireCooldown > 0) return;

  const damage = 15 + player.power * 5;
  const baseAngle = -Math.PI / 2;

  if (player.power >= 4) {
    // Five-way
    for (let i = -2; i <= 2; i++) {
      shootProjectile(player.x, player.y, baseAngle + i * 0.12, true, damage);
    }
  } else if (player.power >= 2) {
    // Triple
    shootProjectile(player.x, player.y, baseAngle - 0.1, true, damage);
    shootProjectile(player.x, player.y, baseAngle, true, damage);
    shootProjectile(player.x, player.y, baseAngle + 0.1, true, damage);
  } else {
    shootProjectile(player.x, player.y, baseAngle, true, damage);
  }

  player.fireCooldown = player.fireRate;
  if (game.settings.soundOn) playSound('shoot');
}

function playerSpecial() {
  if (player.specialCooldown > 0) return;

  // Fire missile if available
  if (player.missiles > 0) {
    player.missiles--;
    projectiles.push({
      x: player.x, y: player.y,
      vx: 0, vy: -400,
      isPlayer: true, damage: 100,
      life: 3, size: 10, color: COLORS.orange,
      missile: true
    });
    player.specialCooldown = 1;
    if (game.settings.soundOn) playSound('shoot');
  }
}

function shootProjectile(x, y, angle, isPlayer, damage = 10) {
  const speed = isPlayer ? 600 : 250;
  projectiles.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    isPlayer, damage,
    life: 3,
    size: isPlayer ? 5 : 4,
    color: isPlayer ? COLORS.gold : COLORS.red
  });
}

function spawnPowerup(x, y) {
  const types = Object.keys(POWERUP_TYPES);
  const weights = [25, 20, 15, 15, 10, 8, 5, 2]; // health most common, extraLife rarest
  let total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let idx = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { idx = i; break; }
  }
  const type = types[idx];
  powerups.push({
    x, y, type,
    color: POWERUP_TYPES[type].color,
    life: 10,
    bobTimer: Math.random() * Math.PI * 2
  });
}

function damagePlayer(amount) {
  if (player.invincible > 0) return;

  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, amount);
    player.shield -= absorbed;
    amount -= absorbed;
    player.shieldRegenDelay = 2;
  }

  if (amount > 0) {
    player.hull -= amount;
    addShake(4);
    player.invincible = 0.5;
    if (game.settings.soundOn) playSound('hit');
  }

  if (player.hull <= 0) gameOver();
}

// ============================================
// UPDATE
// ============================================
function update(dt) {
  game.time += dt;

  // Shake
  if (shake.intensity > 0.1) {
    shake.x = (Math.random() - 0.5) * shake.intensity * 2;
    shake.y = (Math.random() - 0.5) * shake.intensity * 2;
    shake.intensity *= shake.decay;
  } else { shake.x = shake.y = 0; }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }

  if (game.state !== 'playing') return;

  // Player movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx || dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
  }

  player.vx += (dx * player.speed - player.vx) * 8 * dt;
  player.vy += (dy * player.speed - player.vy) * 8 * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = Math.max(30, Math.min(WIDTH - 30, player.x));
  player.y = Math.max(30, Math.min(HEIGHT - 30, player.y));

  // Shooting
  if (keys['j'] || keys[' ']) playerShoot();
  if (keys['k']) playerSpecial();

  // Cooldowns
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.specialCooldown = Math.max(0, player.specialCooldown - dt);
  player.invincible = Math.max(0, player.invincible - dt);

  // Shield regen
  player.shieldRegenDelay = Math.max(0, player.shieldRegenDelay - dt);
  if (player.shieldRegenDelay === 0 && player.shield < player.maxShield) {
    player.shield = Math.min(player.maxShield, player.shield + 8 * dt);
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.patternTimer += dt;

    // AI movement
    let targetX = player.x;
    let targetY = Math.min(player.y - 150, 400);
    if (e.pattern === 'zigzag') targetX += Math.sin(e.patternTimer * 2) * 150;

    const edx = targetX - e.x;
    const edy = targetY - e.y;
    const dist = Math.sqrt(edx * edx + edy * edy);
    if (dist > 10) {
      e.vx += (edx / dist) * e.speed * dt * 2;
      e.vy += (edy / dist) * e.speed * dt * 2;
    }
    e.vx *= 0.98; e.vy *= 0.98;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.x = Math.max(30, Math.min(WIDTH - 30, e.x));

    // Shooting
    e.fireCooldown -= dt;
    if (e.fireCooldown <= 0 && e.y > 50) {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      shootProjectile(e.x, e.y, angle, false, e.damage);
      e.fireCooldown = e.fireRate;

      if (e.type === 'boss') {
        shootProjectile(e.x, e.y, angle - 0.3, false, e.damage);
        shootProjectile(e.x, e.y, angle + 0.3, false, e.damage);
      }
    }

    // Collision with player
    const pdist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
    if (pdist < e.size + 25) {
      damagePlayer(e.damage);
      e.hull -= 30;
    }

    // Death
    if (e.hull <= 0) {
      spawnExplosion(e.x, e.y, e.size / 25);
      game.score += e.score;
      game.stats.totalKills++;
      if (Math.random() < 0.2 || e.type === 'boss') spawnPowerup(e.x, e.y);
      enemies.splice(i, 1);
    }
  }

  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > HEIGHT || p.life <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    if (p.isPlayer) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
        if (dist < e.size) {
          e.hull -= p.damage;
          if (p.missile) {
            spawnExplosion(p.x, p.y, 0.8);
            // Splash damage
            enemies.forEach(en => {
              const d = Math.sqrt((p.x - en.x) ** 2 + (p.y - en.y) ** 2);
              if (d < 80) en.hull -= 30;
            });
          }
          projectiles.splice(i, 1);
          break;
        }
      }
    } else {
      const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
      if (dist < 25) {
        damagePlayer(p.damage);
        projectiles.splice(i, 1);
      }
    }
  }

  // Powerups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.life -= dt;
    p.bobTimer += dt * 3;

    if (p.life <= 0) { powerups.splice(i, 1); continue; }

    const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
    if (dist < 35) {
      POWERUP_TYPES[p.type].effect();
      if (game.settings.soundOn) playSound('powerup');
      powerups.splice(i, 1);
    }
  }

  // Wave system
  if (game.waveTimer > 0) {
    game.waveTimer -= dt;
    if (game.waveTimer <= 0) spawnWave();
  } else if (enemies.length === 0) {
    game.wave++;
    game.waveTimer = 3;
    game.score += game.wave * 100;
  }
}

// ============================================
// DRAW
// ============================================
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, COLORS.ocean);
  gradient.addColorStop(1, COLORS.oceanLight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Waves
  ctx.strokeStyle = 'rgba(141, 105, 122, 0.2)';
  ctx.lineWidth = 2;
  for (let y = 50; y < HEIGHT; y += 60) {
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 10) {
      const wave = Math.sin((x + game.time * 40) * 0.02 + y * 0.01) * 6;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2) return;

  // Shield
  if (player.shield > 0) {
    ctx.save();
    ctx.globalAlpha = 0.3 * (player.shield / player.maxShield);
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.green;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Ship
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.shadowBlur = 10;
  ctx.shadowColor = COLORS.gold;
  ctx.fillStyle = COLORS.bright;
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(-18, 20);
  ctx.lineTo(0, 12);
  ctx.lineTo(18, 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.shadowBlur = 8;
    ctx.shadowColor = e.color;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(0, e.size);
    ctx.lineTo(-e.size * 0.7, -e.size * 0.5);
    ctx.lineTo(e.size * 0.7, -e.size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Health bar for big enemies
    if (e.type === 'boss' || e.type === 'tank') {
      const w = e.size * 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - w/2, e.y - e.size - 15, w, 6);
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(e.x - w/2, e.y - e.size - 15, w * (e.hull / e.maxHull), 6);
    }
  });
}

function drawProjectiles() {
  projectiles.forEach(p => {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPowerups() {
  powerups.forEach(p => {
    const bob = Math.sin(p.bobTimer) * 5;
    const alpha = p.life < 3 ? p.life / 3 : 1;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 15;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => p.draw(ctx));
}

function drawHUD() {
  // Left panel
  ctx.fillStyle = 'rgba(13, 43, 69, 0.85)';
  ctx.fillRect(10, 10, 200, 100);
  ctx.strokeStyle = COLORS.foam;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 200, 100);

  // Hull
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 25, 130, 12);
  ctx.fillStyle = player.hull < 30 ? COLORS.red : COLORS.green;
  ctx.fillRect(22, 27, 126 * (player.hull / player.maxHull), 8);
  ctx.fillStyle = COLORS.white;
  ctx.font = '11px sans-serif';
  ctx.fillText('HULL', 155, 35);

  // Shield
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 43, 130, 12);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(22, 45, 126 * (player.shield / player.maxShield), 8);
  ctx.fillText('SHLD', 155, 53);

  // Special
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 61, 130, 12);
  const ready = player.specialCooldown <= 0;
  ctx.fillStyle = ready ? COLORS.purple : '#666';
  ctx.fillRect(22, 63, 126 * (ready ? 1 : 1 - player.specialCooldown / player.specialMaxCooldown), 8);
  ctx.fillText('SPEC', 155, 71);

  // Power & missiles
  ctx.fillText(`PWR: ${'★'.repeat(player.power)}${'☆'.repeat(player.maxPower - player.power)}`, 20, 95);
  ctx.fillText(`MSL: ${player.missiles}`, 120, 95);

  // Right panel - score
  ctx.fillStyle = 'rgba(13, 43, 69, 0.85)';
  ctx.fillRect(WIDTH - 200, 10, 190, 65);
  ctx.strokeStyle = COLORS.foam;
  ctx.strokeRect(WIDTH - 200, 10, 190, 65);

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${game.score}`, WIDTH - 20, 35);
  ctx.fillStyle = COLORS.bright;
  ctx.font = '14px sans-serif';
  ctx.fillText(`WAVE ${game.wave}`, WIDTH - 20, 55);
  ctx.fillStyle = '#aaa';
  ctx.font = '11px sans-serif';
  ctx.fillText(`HI: ${game.highScore}`, WIDTH - 20, 70);
  ctx.textAlign = 'left';

  // Wave incoming
  if (game.waveTimer > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.gold;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.gold;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`WAVE ${game.wave} INCOMING`, WIDTH/2, 180);
    ctx.font = '20px sans-serif';
    ctx.fillText(Math.ceil(game.waveTimer).toString(), WIDTH/2, 210);
    ctx.restore();
  }
}

function drawMenu() {
  drawBackground();
  ctx.save();
  ctx.textAlign = 'center';

  ctx.shadowBlur = 25;
  ctx.shadowColor = COLORS.gold;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText('PIRATEERS', WIDTH/2, 180);

  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.bright;
  ctx.font = '22px sans-serif';
  ctx.fillText('EXPANDED EDITION', WIDTH/2, 220);

  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white;
  ctx.font = '16px sans-serif';
  ctx.fillText('WASD / Arrows - Move', WIDTH/2, 320);
  ctx.fillText('J / Space - Fire', WIDTH/2, 345);
  ctx.fillText('K - Special (Missile)', WIDTH/2, 370);
  ctx.fillText('P / ESC - Pause', WIDTH/2, 395);

  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PRESS ENTER TO START', WIDTH/2, 480);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#aaa';
  ctx.font = '14px sans-serif';
  ctx.fillText('[T] Tutorial    [S] Settings', WIDTH/2, 530);
  ctx.fillText(`High Score: ${game.highScore}  |  Total Kills: ${game.stats.totalKills}`, WIDTH/2, 560);

  ctx.restore();
}

function drawTutorial() {
  drawBackground();
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('HOW TO PLAY', WIDTH/2, 100);

  ctx.fillStyle = COLORS.white;
  ctx.font = '16px sans-serif';
  const lines = [
    'Survive waves of enemy ships!',
    '',
    'CONTROLS:',
    'WASD or Arrow Keys - Move your ship',
    'J or Space - Fire main cannons',
    'K - Launch missile (limited ammo)',
    'P or ESC - Pause game',
    '',
    'TIPS:',
    '• Collect powerups dropped by enemies',
    '• Shield regenerates when not taking damage',
    '• Boss appears every 10 waves',
    '• Higher power = more bullets',
    '',
    'UNLOCKS:',
    `• Triple Shot: ${game.unlocks.tripleShot ? '✓' : '50 kills needed'}`,
    `• Shield Boost: ${game.unlocks.shield ? '✓' : 'Reach wave 10'}`
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, WIDTH/2, 150 + i * 28);
  });

  ctx.fillStyle = COLORS.gold;
  ctx.fillText('Press ENTER or ESC to return', WIDTH/2, 630);
  ctx.restore();
}

function drawSettings() {
  drawBackground();
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('SETTINGS', WIDTH/2, 150);

  ctx.fillStyle = COLORS.white;
  ctx.font = '20px sans-serif';
  ctx.fillText(`[1] Sound Effects: ${game.settings.soundOn ? 'ON' : 'OFF'}`, WIDTH/2, 280);
  ctx.fillText(`[2] Music: ${game.settings.musicOn ? 'ON' : 'OFF'}`, WIDTH/2, 320);

  ctx.fillStyle = '#aaa';
  ctx.font = '14px sans-serif';
  ctx.fillText('Press number to toggle', WIDTH/2, 400);

  ctx.fillStyle = COLORS.gold;
  ctx.fillText('Press ESC to return', WIDTH/2, 500);
  ctx.restore();
}

function drawPaused() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('PAUSED', WIDTH/2, 300);

  ctx.fillStyle = COLORS.white;
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P or ESC to resume', WIDTH/2, 360);
  ctx.fillText('Press Q to quit to menu', WIDTH/2, 390);
  ctx.restore();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(10, 10, 18, 0.85)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.shadowBlur = 20;
  ctx.shadowColor = COLORS.red;
  ctx.fillStyle = COLORS.red;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('GAME OVER', WIDTH/2, 250);

  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.gold;
  ctx.font = '24px sans-serif';
  ctx.fillText(`Final Score: ${game.score}`, WIDTH/2, 320);
  ctx.fillStyle = COLORS.bright;
  ctx.fillText(`Waves Survived: ${game.wave - 1}`, WIDTH/2, 355);
  ctx.fillText(`Kills This Run: ${game.stats.totalKills}`, WIDTH/2, 385);

  if (game.score >= game.highScore && game.score > 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('NEW HIGH SCORE!', WIDTH/2, 430);
  }

  // Show any new achievements
  if (game.achievements.length > 0) {
    ctx.fillStyle = COLORS.purple;
    ctx.font = '18px sans-serif';
    game.achievements.forEach((a, i) => {
      ctx.fillText(a, WIDTH/2, 470 + i * 25);
    });
    game.achievements.length = 0;
  }

  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.bright;
  ctx.font = '20px sans-serif';
  ctx.fillText('Press ENTER to continue', WIDTH/2, 550);
  ctx.restore();
}

// ============================================
// MAIN LOOP
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);

  ctx.save();
  ctx.translate(shake.x, shake.y);

  if (game.state === 'menu') {
    drawMenu();
  } else if (game.state === 'tutorial') {
    drawTutorial();
  } else if (game.state === 'settings') {
    drawSettings();
  } else if (game.state === 'playing') {
    drawBackground();
    drawParticles();
    drawPowerups();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawHUD();
  } else if (game.state === 'paused') {
    drawBackground();
    drawParticles();
    drawPowerups();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawHUD();
    drawPaused();
  } else if (game.state === 'gameover') {
    drawBackground();
    drawParticles();
    drawGameOver();
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

// ============================================
// INIT
// ============================================
// Expose game state to window for testing
window.game = {
  get state() { return game.state; },
  get score() { return game.score; },
  get wave() { return game.wave; },
  get highScore() { return game.highScore; },
  get player() { return player; },
  get enemies() { return enemies; },
  get bullets() { return projectiles.filter(p => p.isPlayer); },
  get powerups() { return powerups; },
  enemyTypes: ['scout', 'hunter', 'destroyer', 'bomber', 'sniper', 'swarm', 'tank', 'boss'],
  powerupTypes: ['health', 'shield', 'power', 'score', 'speed', 'missile', 'nuke', 'extraLife'],
  saveGame,
  loadGame
};

Object.defineProperty(window, 'gameState', {
  get: () => ({
    screen: game.state,
    score: game.score,
    wave: game.wave,
    playerHull: player.hull,
    playerShield: player.shield,
    playerPower: player.power,
    enemyCount: enemies.length,
    highScore: game.highScore,
    totalKills: game.stats.totalKills
  })
});

loadGame();
requestAnimationFrame(gameLoop);
