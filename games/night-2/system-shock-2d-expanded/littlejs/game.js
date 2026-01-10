// CITADEL - Expanded Edition
// Cyberpunk twin-stick shooter with multiple floors, weapons, upgrades

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 900;
const HEIGHT = 700;

// Cyberpunk color palette
const COLORS = {
  bg: '#0a0a12',
  bgLight: '#141428',
  floor: '#1a1a2e',
  floorLight: '#252540',
  wall: '#2d2d44',
  wallLight: '#3d3d5c',
  player: '#00ffcc',
  playerGlow: '#00ffcc',
  enemy: '#ff3366',
  enemyGlow: '#ff6699',
  bullet: '#00ff99',
  bulletEnemy: '#ff6666',
  health: '#00ff66',
  energy: '#00ccff',
  ammo: '#ffcc00',
  shield: '#6666ff',
  text: '#ffffff',
  textDim: '#666688',
  terminal: '#00ff00',
  explosion: '#ff9900'
};

// Game state
const state = {
  screen: 'menu',
  floor: 1,
  maxFloors: 5,
  hp: 100,
  maxHp: 100,
  shield: 0,
  maxShield: 50,
  energy: 100,
  maxEnergy: 100,
  ammo: 50,
  maxAmmo: 100,
  score: 0,
  kills: 0,
  credits: 0,
  weapon: 'pistol',
  paused: false,
  time: 0,
  waveNumber: 0,
  waveEnemies: 0,

  // Upgrades (purchased with credits)
  upgrades: {
    maxHp: 0,
    maxShield: 0,
    damage: 0,
    fireRate: 0,
    speed: 0
  },

  // Unlocked weapons
  weapons: {
    pistol: true,
    shotgun: false,
    rifle: false,
    plasma: false,
    laser: false
  },

  // Achievements
  achievements: {
    firstKill: false,
    floor2: false,
    floor5: false,
    shotgunUnlock: false,
    noHit: false,
    speedKill: false
  },

  tutorialStep: 0,
  showTutorial: true
};

// Weapon definitions
const WEAPONS = {
  pistol: { damage: 15, fireRate: 250, ammoUse: 1, spread: 0.05, bullets: 1, color: COLORS.bullet, sound: 'shoot' },
  shotgun: { damage: 10, fireRate: 600, ammoUse: 3, spread: 0.3, bullets: 5, color: '#ff9933', sound: 'shotgun' },
  rifle: { damage: 25, fireRate: 150, ammoUse: 1, spread: 0.02, bullets: 1, color: '#ffff00', sound: 'rifle' },
  plasma: { damage: 40, fireRate: 400, ammoUse: 5, spread: 0.1, bullets: 1, color: '#ff00ff', sound: 'plasma' },
  laser: { damage: 5, fireRate: 50, ammoUse: 0.5, spread: 0, bullets: 1, color: '#00ffff', sound: 'laser' }
};

// Enemy types
const ENEMY_TYPES = {
  drone: { hp: 30, speed: 2, damage: 8, score: 50, behavior: 'chase', color: COLORS.enemy, size: 12 },
  security: { hp: 50, speed: 1.5, damage: 12, score: 100, behavior: 'shoot', color: '#ff6600', size: 16 },
  cyborg: { hp: 80, speed: 1.2, damage: 20, score: 150, behavior: 'tank', color: '#9933ff', size: 20 },
  hacker: { hp: 25, speed: 2.5, damage: 5, score: 75, behavior: 'teleport', color: '#00ff99', size: 10 },
  boss: { hp: 500, speed: 0.8, damage: 30, score: 1000, behavior: 'boss', color: '#ff0066', size: 35 }
};

// Player
const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  angle: 0,
  speed: 3,
  radius: 14,
  vx: 0,
  vy: 0,
  lastShot: 0,
  invulnFrames: 0,
  reloading: false,
  reloadTime: 0
};

// Arrays
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let pickups = [];
let walls = [];
let terminals = [];

// Input
const keys = {};
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Audio
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type, volume = 0.3) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch(type) {
    case 'shoot':
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'shotgun':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      break;
    case 'rifle':
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(volume * 0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
      break;
    case 'plasma':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume * 0.7, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      break;
    case 'laser':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume * 0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
      break;
    case 'hit':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'explode':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
    case 'pickup':
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      break;
    case 'reload':
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
  }
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r' && state.screen === 'playing') {
    startReload();
  }
  if (e.key === 'Escape' && state.screen === 'playing') {
    state.paused = !state.paused;
  }
  if (e.key.toLowerCase() === 'h') {
    state.showTutorial = !state.showTutorial;
  }
  // Weapon switching
  if (state.screen === 'playing') {
    if (e.key === '1' && state.weapons.pistol) state.weapon = 'pistol';
    if (e.key === '2' && state.weapons.shotgun) state.weapon = 'shotgun';
    if (e.key === '3' && state.weapons.rifle) state.weapon = 'rifle';
    if (e.key === '4' && state.weapons.plasma) state.weapon = 'plasma';
    if (e.key === '5' && state.weapons.laser) state.weapon = 'laser';
  }
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  initAudio();

  if (state.screen === 'menu') {
    const clickY = mouse.y;
    if (clickY > 280 && clickY < 330) {
      startNewGame();
    } else if (clickY > 340 && clickY < 390) {
      loadGame();
    } else if (clickY > 400 && clickY < 450) {
      state.screen = 'shop';
    }
  } else if (state.screen === 'shop') {
    handleShopClick();
  } else if (state.screen === 'gameover') {
    state.screen = 'menu';
  } else if (state.screen === 'victory') {
    state.screen = 'menu';
  }
});

canvas.addEventListener('mouseup', () => {
  mouse.down = false;
});

// Game functions
function startNewGame() {
  state.screen = 'playing';
  state.floor = 1;
  state.hp = 100 + state.upgrades.maxHp * 20;
  state.maxHp = 100 + state.upgrades.maxHp * 20;
  state.shield = state.upgrades.maxShield * 25;
  state.maxShield = 50 + state.upgrades.maxShield * 25;
  state.energy = 100;
  state.ammo = 50;
  state.score = 0;
  state.kills = 0;
  state.waveNumber = 0;
  state.time = 0;
  state.weapon = 'pistol';
  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  player.invulnFrames = 0;
  player.reloading = false;
  enemies = [];
  bullets = [];
  enemyBullets = [];
  particles = [];
  pickups = [];
  generateFloor();
  spawnWave();
}

function generateFloor() {
  walls = [];
  terminals = [];

  // Create room walls based on floor number
  const numRooms = 3 + state.floor;

  for (let i = 0; i < numRooms; i++) {
    const rx = 100 + Math.random() * (WIDTH - 300);
    const ry = 100 + Math.random() * (HEIGHT - 300);
    const rw = 80 + Math.random() * 120;
    const rh = 60 + Math.random() * 100;

    // Create wall segments with gaps
    const gap = 40 + Math.random() * 40;
    const gapPos = Math.random() * (rw - gap);

    // Top wall (with gap)
    if (gapPos > 20) {
      walls.push({ x: rx, y: ry, w: gapPos, h: 10 });
    }
    if (gapPos + gap < rw - 20) {
      walls.push({ x: rx + gapPos + gap, y: ry, w: rw - gapPos - gap, h: 10 });
    }

    // Side walls
    walls.push({ x: rx, y: ry, w: 10, h: rh });
    walls.push({ x: rx + rw - 10, y: ry, w: 10, h: rh });
  }

  // Add terminals
  for (let i = 0; i < 2 + state.floor; i++) {
    terminals.push({
      x: 50 + Math.random() * (WIDTH - 100),
      y: 50 + Math.random() * (HEIGHT - 100),
      active: true,
      type: Math.random() > 0.5 ? 'ammo' : 'health'
    });
  }
}

function spawnWave() {
  state.waveNumber++;
  const numEnemies = 3 + state.waveNumber + state.floor * 2;

  // Determine enemy types based on floor
  const types = ['drone'];
  if (state.floor >= 2) types.push('security');
  if (state.floor >= 3) types.push('cyborg');
  if (state.floor >= 4) types.push('hacker');

  for (let i = 0; i < numEnemies; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const stats = ENEMY_TYPES[type];

    // Spawn away from player
    let x, y;
    do {
      x = 50 + Math.random() * (WIDTH - 100);
      y = 50 + Math.random() * (HEIGHT - 100);
    } while (Math.hypot(x - player.x, y - player.y) < 200);

    enemies.push({
      x, y,
      type,
      hp: stats.hp * (1 + state.floor * 0.2),
      maxHp: stats.hp * (1 + state.floor * 0.2),
      speed: stats.speed,
      damage: stats.damage,
      score: stats.score,
      behavior: stats.behavior,
      color: stats.color,
      size: stats.size,
      angle: Math.random() * Math.PI * 2,
      shootCooldown: 0,
      teleportCooldown: 0
    });
  }

  state.waveEnemies = numEnemies;
}

function spawnBoss() {
  const stats = ENEMY_TYPES.boss;
  enemies.push({
    x: WIDTH / 2,
    y: 100,
    type: 'boss',
    hp: stats.hp * (1 + state.floor * 0.3),
    maxHp: stats.hp * (1 + state.floor * 0.3),
    speed: stats.speed,
    damage: stats.damage,
    score: stats.score,
    behavior: stats.behavior,
    color: stats.color,
    size: stats.size,
    angle: 0,
    shootCooldown: 0,
    phase: 0
  });
}

function startReload() {
  if (!player.reloading && state.ammo < state.maxAmmo) {
    player.reloading = true;
    player.reloadTime = 1500;
    playSound('reload');
  }
}

function shoot() {
  const now = Date.now();
  const weapon = WEAPONS[state.weapon];
  const fireRate = weapon.fireRate * (1 - state.upgrades.fireRate * 0.1);

  if (player.reloading) return;
  if (now - player.lastShot < fireRate) return;
  if (state.ammo < weapon.ammoUse) {
    startReload();
    return;
  }

  player.lastShot = now;
  state.ammo -= weapon.ammoUse;
  playSound(weapon.sound);

  const baseDamage = weapon.damage * (1 + state.upgrades.damage * 0.15);

  for (let i = 0; i < weapon.bullets; i++) {
    const spread = (Math.random() - 0.5) * weapon.spread * 2;
    const angle = player.angle + spread;

    bullets.push({
      x: player.x + Math.cos(player.angle) * 20,
      y: player.y + Math.sin(player.angle) * 20,
      vx: Math.cos(angle) * 12,
      vy: Math.sin(angle) * 12,
      damage: baseDamage,
      color: weapon.color,
      size: state.weapon === 'plasma' ? 8 : 4
    });
  }

  // Muzzle flash particles
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: player.x + Math.cos(player.angle) * 25,
      y: player.y + Math.sin(player.angle) * 25,
      vx: Math.cos(player.angle + (Math.random() - 0.5)) * 5,
      vy: Math.sin(player.angle + (Math.random() - 0.5)) * 5,
      life: 10,
      color: weapon.color,
      size: 3
    });
  }
}

function spawnPickup(x, y, type) {
  pickups.push({ x, y, type, time: 0 });
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused) return;

  state.time += dt;

  // Player movement
  const moveSpeed = player.speed * (1 + state.upgrades.speed * 0.1);
  let dx = 0, dy = 0;

  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;

    // Apply sprint
    const sprint = keys['shift'] ? 1.5 : 1;
    if (keys['shift'] && state.energy > 0) {
      state.energy -= dt * 0.03;
    }

    player.x += dx * moveSpeed * sprint;
    player.y += dy * moveSpeed * sprint;
  }

  // Regenerate energy
  if (!keys['shift'] && state.energy < state.maxEnergy) {
    state.energy = Math.min(state.maxEnergy, state.energy + dt * 0.01);
  }

  // Wall collision
  for (const wall of walls) {
    if (player.x > wall.x - player.radius && player.x < wall.x + wall.w + player.radius &&
        player.y > wall.y - player.radius && player.y < wall.y + wall.h + player.radius) {
      // Push out
      const cx = wall.x + wall.w / 2;
      const cy = wall.y + wall.h / 2;
      const angle = Math.atan2(player.y - cy, player.x - cx);
      player.x = cx + Math.cos(angle) * (wall.w / 2 + player.radius + 5);
      player.y = cy + Math.sin(angle) * (wall.h / 2 + player.radius + 5);
    }
  }

  // Bounds
  player.x = Math.max(player.radius, Math.min(WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(HEIGHT - player.radius, player.y));

  // Player aim
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Shooting
  if (mouse.down) {
    shoot();
  }

  // Reload
  if (player.reloading) {
    player.reloadTime -= dt;
    if (player.reloadTime <= 0) {
      player.reloading = false;
      state.ammo = state.maxAmmo;
    }
  }

  // Invulnerability
  if (player.invulnFrames > 0) {
    player.invulnFrames -= dt;
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // Remove if out of bounds
    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      bullets.splice(i, 1);
      continue;
    }

    // Wall collision
    let hitWall = false;
    for (const wall of walls) {
      if (b.x > wall.x && b.x < wall.x + wall.w && b.y > wall.y && b.y < wall.y + wall.h) {
        hitWall = true;
        break;
      }
    }
    if (hitWall) {
      // Spark particles
      for (let j = 0; j < 3; j++) {
        particles.push({
          x: b.x, y: b.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 15,
          color: '#ffff00',
          size: 2
        });
      }
      bullets.splice(i, 1);
      continue;
    }

    // Enemy collision
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
        e.hp -= b.damage;
        playSound('hit');

        // Hit particles
        for (let k = 0; k < 5; k++) {
          particles.push({
            x: b.x, y: b.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20,
            color: e.color,
            size: 3
          });
        }

        if (e.hp <= 0) {
          // Death explosion
          playSound('explode');
          for (let k = 0; k < 15; k++) {
            particles.push({
              x: e.x, y: e.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 30,
              color: e.color,
              size: 4
            });
          }

          state.score += e.score;
          state.kills++;
          state.credits += Math.floor(e.score / 10);

          // Drop pickup
          if (Math.random() < 0.3) {
            const type = Math.random() < 0.5 ? 'health' : 'ammo';
            spawnPickup(e.x, e.y, type);
          }

          // Check achievements
          if (!state.achievements.firstKill) {
            state.achievements.firstKill = true;
          }

          enemies.splice(j, 1);
        }

        bullets.splice(i, 1);
        break;
      }
    }
  }

  // Update enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      enemyBullets.splice(i, 1);
      continue;
    }

    // Player collision
    if (player.invulnFrames <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < player.radius + 4) {
      takeDamage(b.damage);
      enemyBullets.splice(i, 1);
    }
  }

  // Update enemies
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.angle = Math.atan2(dy, dx);

    switch (e.behavior) {
      case 'chase':
        if (dist > 30) {
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
        }
        // Contact damage
        if (dist < e.size + player.radius && player.invulnFrames <= 0) {
          takeDamage(e.damage);
        }
        break;

      case 'shoot':
        // Keep distance and shoot
        if (dist < 150) {
          e.x -= Math.cos(e.angle) * e.speed * 0.5;
          e.y -= Math.sin(e.angle) * e.speed * 0.5;
        } else if (dist > 250) {
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
        }
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 1500;
          enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(e.angle) * 5,
            vy: Math.sin(e.angle) * 5,
            damage: e.damage
          });
        }
        break;

      case 'tank':
        // Slow chase, high damage
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        if (dist < e.size + player.radius && player.invulnFrames <= 0) {
          takeDamage(e.damage);
        }
        break;

      case 'teleport':
        // Teleport around and chase
        e.teleportCooldown -= dt;
        if (e.teleportCooldown <= 0 && dist > 100) {
          e.teleportCooldown = 2000;
          const angle = Math.random() * Math.PI * 2;
          e.x = player.x + Math.cos(angle) * 80;
          e.y = player.y + Math.sin(angle) * 80;
          // Teleport particles
          for (let i = 0; i < 10; i++) {
            particles.push({
              x: e.x, y: e.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 20,
              color: e.color,
              size: 3
            });
          }
        }
        if (dist < 50) {
          e.x += Math.cos(e.angle) * e.speed * 2;
          e.y += Math.sin(e.angle) * e.speed * 2;
        }
        if (dist < e.size + player.radius && player.invulnFrames <= 0) {
          takeDamage(e.damage);
        }
        break;

      case 'boss':
        // Multi-phase boss
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;

        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 800 - e.phase * 150;
          // Shoot spread
          for (let i = -2; i <= 2; i++) {
            const angle = e.angle + i * 0.3;
            enemyBullets.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              damage: e.damage
            });
          }
        }

        // Phase transitions
        const hpPercent = e.hp / e.maxHp;
        if (hpPercent < 0.3 && e.phase < 2) {
          e.phase = 2;
          e.speed = 1.5;
        } else if (hpPercent < 0.6 && e.phase < 1) {
          e.phase = 1;
          e.speed = 1.2;
        }

        if (dist < e.size + player.radius && player.invulnFrames <= 0) {
          takeDamage(e.damage);
        }
        break;
    }

    // Keep in bounds
    e.x = Math.max(e.size, Math.min(WIDTH - e.size, e.x));
    e.y = Math.max(e.size, Math.min(HEIGHT - e.size, e.y));
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Update pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.time += dt;

    // Check collision with player
    if (Math.hypot(p.x - player.x, p.y - player.y) < 30) {
      playSound('pickup');
      if (p.type === 'health') {
        state.hp = Math.min(state.maxHp, state.hp + 25);
      } else if (p.type === 'ammo') {
        state.ammo = Math.min(state.maxAmmo, state.ammo + 20);
      } else if (p.type === 'shield') {
        state.shield = Math.min(state.maxShield, state.shield + 25);
      }
      pickups.splice(i, 1);
    } else if (p.time > 10000) {
      pickups.splice(i, 1);
    }
  }

  // Terminal interaction
  if (keys['e']) {
    for (const t of terminals) {
      if (t.active && Math.hypot(t.x - player.x, t.y - player.y) < 40) {
        t.active = false;
        playSound('pickup');
        if (t.type === 'ammo') {
          state.ammo = state.maxAmmo;
        } else {
          state.hp = Math.min(state.maxHp, state.hp + 30);
        }
      }
    }
  }

  // Check wave completion
  if (enemies.length === 0) {
    if (state.waveNumber >= 3 + state.floor) {
      // Floor complete - spawn boss or advance
      if (state.waveNumber === 3 + state.floor && state.floor < state.maxFloors) {
        // Boss wave
        spawnBoss();
      } else {
        // Advance to next floor
        advanceFloor();
      }
    } else {
      spawnWave();
    }
  }

  // Tutorial progression
  if (state.showTutorial) {
    if (state.tutorialStep === 0 && (keys['w'] || keys['a'] || keys['s'] || keys['d'])) {
      state.tutorialStep = 1;
    }
    if (state.tutorialStep === 1 && mouse.down) {
      state.tutorialStep = 2;
    }
    if (state.tutorialStep === 2 && state.kills > 0) {
      state.tutorialStep = 3;
    }
    if (state.tutorialStep === 3) {
      setTimeout(() => { state.showTutorial = false; }, 3000);
    }
  }
}

function takeDamage(amount) {
  if (player.invulnFrames > 0) return;

  // Shield absorbs damage first
  if (state.shield > 0) {
    const shieldDamage = Math.min(state.shield, amount);
    state.shield -= shieldDamage;
    amount -= shieldDamage;
  }

  state.hp -= amount;
  player.invulnFrames = 500;
  playSound('hit');

  // Screen shake effect via particles
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: player.x, y: player.y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 15,
      color: COLORS.health,
      size: 4
    });
  }

  if (state.hp <= 0) {
    state.hp = 0;
    state.screen = 'gameover';
    saveGame(); // Save progress (upgrades, weapons)
  }
}

function advanceFloor() {
  state.floor++;

  // Check achievements
  if (state.floor === 2) state.achievements.floor2 = true;
  if (state.floor === 5) state.achievements.floor5 = true;

  // Unlock weapons
  if (state.floor === 2) state.weapons.shotgun = true;
  if (state.floor === 3) state.weapons.rifle = true;
  if (state.floor === 4) state.weapons.plasma = true;
  if (state.floor === 5) state.weapons.laser = true;

  if (state.floor > state.maxFloors) {
    state.screen = 'victory';
    state.achievements.boss = true;
    saveGame();
    return;
  }

  state.waveNumber = 0;
  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  generateFloor();
  spawnWave();
  saveGame();
}

function saveGame() {
  const saveData = {
    upgrades: state.upgrades,
    weapons: state.weapons,
    achievements: state.achievements,
    credits: state.credits,
    highScore: Math.max(state.score, parseInt(localStorage.getItem('citadel_highscore') || '0'))
  };
  localStorage.setItem('citadel_expanded_save', JSON.stringify(saveData));
  localStorage.setItem('citadel_highscore', saveData.highScore.toString());
}

function loadGame() {
  const saved = localStorage.getItem('citadel_expanded_save');
  if (saved) {
    const data = JSON.parse(saved);
    state.upgrades = data.upgrades || state.upgrades;
    state.weapons = data.weapons || state.weapons;
    state.achievements = data.achievements || state.achievements;
    state.credits = data.credits || 0;
  }
  startNewGame();
}

function handleShopClick() {
  const items = [
    { name: 'Max HP +20', cost: 100, upgrade: 'maxHp', max: 5 },
    { name: 'Max Shield +25', cost: 150, upgrade: 'maxShield', max: 4 },
    { name: 'Damage +15%', cost: 200, upgrade: 'damage', max: 5 },
    { name: 'Fire Rate +10%', cost: 175, upgrade: 'fireRate', max: 5 },
    { name: 'Speed +10%', cost: 125, upgrade: 'speed', max: 3 }
  ];

  const startY = 200;
  const itemHeight = 50;

  for (let i = 0; i < items.length; i++) {
    const y = startY + i * itemHeight;
    if (mouse.y > y && mouse.y < y + 40) {
      const item = items[i];
      if (state.credits >= item.cost && state.upgrades[item.upgrade] < item.max) {
        state.credits -= item.cost;
        state.upgrades[item.upgrade]++;
        playSound('pickup');
        saveGame();
      }
    }
  }

  // Back button
  if (mouse.y > 500 && mouse.y < 550) {
    state.screen = 'menu';
  }
}

// Rendering
function render() {
  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (state.screen) {
    case 'menu':
      renderMenu();
      break;
    case 'playing':
      renderGame();
      if (state.paused) renderPauseOverlay();
      break;
    case 'shop':
      renderShop();
      break;
    case 'gameover':
      renderGameOver();
      break;
    case 'victory':
      renderVictory();
      break;
  }
}

function renderMenu() {
  // Animated grid background
  ctx.strokeStyle = COLORS.floorLight;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  const offset = (Date.now() * 0.02) % 40;
  for (let x = -40 + offset; x < WIDTH + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 100, HEIGHT);
    ctx.stroke();
  }
  for (let y = -40 + offset; y < HEIGHT + 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Title glow
  const gradient = ctx.createRadialGradient(WIDTH/2, 120, 0, WIDTH/2, 120, 200);
  gradient.addColorStop(0, 'rgba(0, 255, 204, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, 300);

  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 72px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('CITADEL', WIDTH/2 + 3, 123);
  ctx.fillStyle = COLORS.player;
  ctx.fillText('CITADEL', WIDTH/2, 120);

  // Subtitle
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '24px Share Tech Mono';
  ctx.fillText('EXPANDED EDITION', WIDTH/2, 160);

  // Menu items
  const menuItems = ['[ NEW GAME ]', '[ CONTINUE ]', '[ UPGRADES ]'];
  ctx.font = '24px Orbitron';
  for (let i = 0; i < menuItems.length; i++) {
    const y = 300 + i * 60;
    const hover = mouse.y > y - 20 && mouse.y < y + 20;
    ctx.fillStyle = hover ? COLORS.player : COLORS.text;
    ctx.fillText(menuItems[i], WIDTH/2, y);
  }

  // High score
  const highScore = localStorage.getItem('citadel_highscore') || '0';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '16px Share Tech Mono';
  ctx.fillText(`HIGH SCORE: ${highScore}`, WIDTH/2, 520);

  // Credits
  ctx.fillText(`CREDITS: ${state.credits}`, WIDTH/2, 550);

  // Controls
  ctx.font = '14px Share Tech Mono';
  ctx.fillStyle = '#666688';
  ctx.fillText('WASD - Move | Mouse - Aim | Click - Fire | Shift - Sprint | R - Reload', WIDTH/2, 620);
  ctx.fillText('1-5 - Weapons | ESC - Pause | H - Help', WIDTH/2, 645);

  // Achievements count
  const achCount = Object.values(state.achievements).filter(a => a).length;
  ctx.fillText(`Achievements: ${achCount}/6`, WIDTH/2, 670);
}

function renderGame() {
  // Floor pattern
  ctx.fillStyle = COLORS.floor;
  for (let x = 0; x < WIDTH; x += 30) {
    for (let y = 0; y < HEIGHT; y += 30) {
      if ((x + y) % 60 === 0) {
        ctx.fillRect(x, y, 28, 28);
      }
    }
  }

  // Walls
  for (const wall of walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = COLORS.wallLight;
    ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, 3);
  }

  // Terminals
  for (const t of terminals) {
    ctx.fillStyle = t.active ? COLORS.terminal : '#333';
    ctx.fillRect(t.x - 12, t.y - 15, 24, 30);
    if (t.active) {
      ctx.fillStyle = '#000';
      ctx.fillRect(t.x - 8, t.y - 11, 16, 18);
      ctx.fillStyle = COLORS.terminal;
      ctx.font = '10px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillText(t.type === 'ammo' ? 'A' : 'H', t.x, t.y + 2);
    }
  }

  // Pickups
  for (const p of pickups) {
    const pulse = Math.sin(p.time * 0.005) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = p.type === 'health' ? COLORS.health : COLORS.ammo;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText(p.type === 'health' ? '+' : 'A', p.x, p.y + 4);
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Enemy bullets
  for (const b of enemyBullets) {
    ctx.fillStyle = COLORS.bulletEnemy;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player bullets
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of enemies) {
    // Glow
    const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 2);
    gradient.addColorStop(0, e.color + '40');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(e.x - e.size * 2, e.y - e.size * 2, e.size * 4, e.size * 4);

    // Body
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2, 4);
      ctx.fillStyle = COLORS.health;
      ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2 * (e.hp / e.maxHp), 4);
    }

    // Eye (direction indicator)
    ctx.fillStyle = '#fff';
    const eyeX = e.x + Math.cos(e.angle) * e.size * 0.5;
    const eyeY = e.y + Math.sin(e.angle) * e.size * 0.5;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, e.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player
  const playerAlpha = player.invulnFrames > 0 ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
  ctx.globalAlpha = playerAlpha;

  // Player glow
  const playerGlow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 40);
  playerGlow.addColorStop(0, COLORS.playerGlow + '40');
  playerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = playerGlow;
  ctx.fillRect(player.x - 40, player.y - 40, 80, 80);

  // Player body
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Aim indicator
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.angle) * (player.radius + 5), player.y + Math.sin(player.angle) * (player.radius + 5));
  ctx.lineTo(player.x + Math.cos(player.angle) * (player.radius + 20), player.y + Math.sin(player.angle) * (player.radius + 20));
  ctx.stroke();

  ctx.globalAlpha = 1;

  // HUD
  renderHUD();

  // Tutorial
  if (state.showTutorial && state.tutorialStep < 4) {
    renderTutorial();
  }
}

function renderHUD() {
  // Background bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, 45);
  ctx.fillRect(0, HEIGHT - 35, WIDTH, 35);

  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 10, 150, 20);
  ctx.fillStyle = COLORS.health;
  ctx.fillRect(10, 10, 150 * (state.hp / state.maxHp), 20);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Share Tech Mono';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${Math.ceil(state.hp)}/${state.maxHp}`, 15, 25);

  // Shield bar
  if (state.maxShield > 0) {
    ctx.fillStyle = '#333';
    ctx.fillRect(170, 10, 100, 20);
    ctx.fillStyle = COLORS.shield;
    ctx.fillRect(170, 10, 100 * (state.shield / state.maxShield), 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`SH: ${Math.ceil(state.shield)}`, 175, 25);
  }

  // Energy bar
  ctx.fillStyle = '#333';
  ctx.fillRect(280, 10, 100, 20);
  ctx.fillStyle = COLORS.energy;
  ctx.fillRect(280, 10, 100 * (state.energy / state.maxEnergy), 20);
  ctx.fillStyle = '#fff';
  ctx.fillText('ENERGY', 285, 25);

  // Ammo
  ctx.fillStyle = COLORS.ammo;
  ctx.textAlign = 'right';
  ctx.font = '18px Orbitron';
  ctx.fillText(`${Math.ceil(state.ammo)}/${state.maxAmmo}`, WIDTH - 10, 28);
  if (player.reloading) {
    ctx.fillStyle = '#ff6600';
    ctx.font = '12px Share Tech Mono';
    ctx.fillText('RELOADING...', WIDTH - 80, 28);
  }

  // Weapon indicator
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.player;
  ctx.font = '14px Orbitron';
  ctx.fillText(state.weapon.toUpperCase(), 400, 28);

  // Score and floor
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '14px Share Tech Mono';
  ctx.fillText(`FLOOR ${state.floor}/${state.maxFloors}  |  WAVE ${state.waveNumber}  |  SCORE: ${state.score}`, WIDTH/2, HEIGHT - 12);

  // Weapon slots at bottom
  const weapons = ['pistol', 'shotgun', 'rifle', 'plasma', 'laser'];
  ctx.textAlign = 'center';
  for (let i = 0; i < weapons.length; i++) {
    const w = weapons[i];
    const x = 100 + i * 80;
    const unlocked = state.weapons[w];
    const selected = state.weapon === w;

    ctx.fillStyle = unlocked ? (selected ? COLORS.player : '#666') : '#333';
    ctx.fillRect(x - 30, HEIGHT - 32, 60, 18);
    ctx.fillStyle = selected ? '#000' : '#fff';
    ctx.font = '10px Share Tech Mono';
    ctx.fillText(`${i + 1}: ${w.toUpperCase()}`, x, HEIGHT - 19);
  }
}

function renderTutorial() {
  const messages = [
    'Use WASD to move',
    'Click to shoot enemies',
    'Great! Keep eliminating threats',
    'Good luck, soldier!'
  ];

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(WIDTH/2 - 200, HEIGHT - 100, 400, 50);
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.strokeRect(WIDTH/2 - 200, HEIGHT - 100, 400, 50);

  ctx.fillStyle = COLORS.player;
  ctx.font = '18px Share Tech Mono';
  ctx.textAlign = 'center';
  ctx.fillText(messages[state.tutorialStep], WIDTH/2, HEIGHT - 70);
}

function renderPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.player;
  ctx.font = '48px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2 - 40);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Share Tech Mono';
  ctx.fillText('Press ESC to resume', WIDTH/2, HEIGHT/2 + 20);
  ctx.fillText('Press H for help', WIDTH/2, HEIGHT/2 + 50);
}

function renderShop() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = COLORS.player;
  ctx.font = '48px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('UPGRADES', WIDTH/2, 100);

  // Credits
  ctx.fillStyle = COLORS.ammo;
  ctx.font = '24px Share Tech Mono';
  ctx.fillText(`Credits: ${state.credits}`, WIDTH/2, 150);

  // Items
  const items = [
    { name: 'Max HP +20', cost: 100, upgrade: 'maxHp', max: 5 },
    { name: 'Max Shield +25', cost: 150, upgrade: 'maxShield', max: 4 },
    { name: 'Damage +15%', cost: 200, upgrade: 'damage', max: 5 },
    { name: 'Fire Rate +10%', cost: 175, upgrade: 'fireRate', max: 5 },
    { name: 'Speed +10%', cost: 125, upgrade: 'speed', max: 3 }
  ];

  ctx.font = '20px Share Tech Mono';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const y = 200 + i * 50;
    const level = state.upgrades[item.upgrade];
    const maxed = level >= item.max;
    const canBuy = state.credits >= item.cost && !maxed;
    const hover = mouse.y > y && mouse.y < y + 40;

    ctx.fillStyle = hover && canBuy ? COLORS.player : (canBuy ? '#fff' : '#666');
    ctx.textAlign = 'left';
    ctx.fillText(item.name, 200, y + 25);

    ctx.textAlign = 'right';
    ctx.fillText(maxed ? 'MAXED' : `${item.cost} CR`, 500, y + 25);

    // Level indicator
    ctx.fillStyle = COLORS.player;
    for (let j = 0; j < item.max; j++) {
      ctx.fillStyle = j < level ? COLORS.player : '#333';
      ctx.fillRect(520 + j * 20, y + 15, 15, 15);
    }
  }

  // Back button
  ctx.fillStyle = mouse.y > 500 && mouse.y < 550 ? COLORS.player : '#fff';
  ctx.textAlign = 'center';
  ctx.font = '24px Orbitron';
  ctx.fillText('[ BACK ]', WIDTH/2, 530);
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.enemy;
  ctx.font = '64px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM FAILURE', WIDTH/2, HEIGHT/2 - 80);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Share Tech Mono';
  ctx.fillText(`Final Score: ${state.score}`, WIDTH/2, HEIGHT/2);
  ctx.fillText(`Floor Reached: ${state.floor}`, WIDTH/2, HEIGHT/2 + 40);
  ctx.fillText(`Enemies Eliminated: ${state.kills}`, WIDTH/2, HEIGHT/2 + 80);

  ctx.fillStyle = COLORS.player;
  ctx.font = '20px Orbitron';
  ctx.fillText('[ CLICK TO CONTINUE ]', WIDTH/2, HEIGHT/2 + 150);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.player;
  ctx.font = '64px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('MISSION COMPLETE', WIDTH/2, HEIGHT/2 - 80);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Share Tech Mono';
  ctx.fillText(`Final Score: ${state.score}`, WIDTH/2, HEIGHT/2);
  ctx.fillText(`Enemies Eliminated: ${state.kills}`, WIDTH/2, HEIGHT/2 + 40);
  ctx.fillText(`Credits Earned: ${state.credits}`, WIDTH/2, HEIGHT/2 + 80);

  ctx.fillStyle = COLORS.player;
  ctx.font = '20px Orbitron';
  ctx.fillText('[ CLICK TO CONTINUE ]', WIDTH/2, HEIGHT/2 + 150);
}

// Game loop
let lastTime = 0;
function gameLoop(time) {
  const dt = time - lastTime;
  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// Load saved data on start
const saved = localStorage.getItem('citadel_expanded_save');
if (saved) {
  const data = JSON.parse(saved);
  state.upgrades = data.upgrades || state.upgrades;
  state.weapons = data.weapons || state.weapons;
  state.achievements = data.achievements || state.achievements;
  state.credits = data.credits || 0;
}

// Start
requestAnimationFrame(gameLoop);
