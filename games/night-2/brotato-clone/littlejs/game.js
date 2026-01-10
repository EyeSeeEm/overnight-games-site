// Spudtato - Survivor Arena (Brotato Clone)
// Wave-based survival with auto-aiming weapons and stat upgrades

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;

// Colors
const COLORS = {
  bg: '#1a1a2e',
  arena: '#2a2a4e',
  player: '#f4a460',
  playerOutline: '#8b4513',
  enemy: '#ff4466',
  enemyGlow: '#ff6688',
  bullet: '#ffff00',
  bulletEnemy: '#ff6666',
  xp: '#44ff44',
  hp: '#ff3333',
  gold: '#ffd700',
  shop: '#3a3a6e',
  text: '#ffffff',
  textDim: '#888899'
};

// Weapon definitions
const WEAPONS = {
  knife: { name: 'Knife', damage: 8, cooldown: 300, type: 'melee', range: 50, tier: 1 },
  pistol: { name: 'Pistol', damage: 6, cooldown: 400, type: 'ranged', range: 300, speed: 8, tier: 1 },
  smg: { name: 'SMG', damage: 4, cooldown: 150, type: 'ranged', range: 250, speed: 10, tier: 2 },
  shotgun: { name: 'Shotgun', damage: 5, cooldown: 600, type: 'ranged', range: 200, speed: 6, bullets: 5, spread: 0.4, tier: 2 },
  sword: { name: 'Sword', damage: 15, cooldown: 500, type: 'melee', range: 70, tier: 2 },
  laser: { name: 'Laser', damage: 20, cooldown: 800, type: 'ranged', range: 400, speed: 15, tier: 3 },
  minigun: { name: 'Minigun', damage: 3, cooldown: 80, type: 'ranged', range: 350, speed: 12, tier: 3 },
  rocket: { name: 'Rocket', damage: 30, cooldown: 1200, type: 'ranged', range: 500, speed: 5, explosive: true, tier: 4 }
};

// Item definitions (passive bonuses)
const ITEMS = {
  hpBoost: { name: 'Armor Plate', stat: 'maxHp', value: 5, cost: 20 },
  damage: { name: 'Power Crystal', stat: 'damage', value: 5, cost: 25 },
  speed: { name: 'Swift Boots', stat: 'speed', value: 10, cost: 20 },
  crit: { name: 'Lucky Charm', stat: 'critChance', value: 5, cost: 30 },
  regen: { name: 'Healing Ring', stat: 'hpRegen', value: 1, cost: 35 },
  lifesteal: { name: 'Vampire Fang', stat: 'lifeSteal', value: 3, cost: 40 },
  armor: { name: 'Shield', stat: 'armor', value: 3, cost: 25 },
  harvest: { name: 'Magnet', stat: 'harvesting', value: 10, cost: 20 }
};

// Game state
const state = {
  screen: 'menu',
  wave: 0,
  maxWaves: 20,
  waveTimer: 0,
  waveDuration: 30000, // 30 seconds per wave
  kills: 0,
  totalKills: 0,

  // Stats
  hp: 10,
  maxHp: 10,
  damage: 0,
  speed: 0,
  critChance: 0,
  hpRegen: 0,
  lifeSteal: 0,
  armor: 0,
  harvesting: 0,
  attackSpeed: 0,

  // Resources
  xp: 0,
  xpToLevel: 10,
  level: 1,
  gold: 0,

  // Weapons (max 6)
  weapons: [],

  // Shop
  shopItems: [],
  shopWeapons: [],

  paused: false
};

// Player
const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 16,
  baseSpeed: 200,
  invulnFrames: 0
};

// Arrays
let enemies = [];
let bullets = [];
let xpOrbs = [];
let particles = [];
let weaponCooldowns = {};

// Input
const keys = {};

// Audio
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type, volume = 0.2) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch(type) {
    case 'shoot':
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
      break;
    case 'melee':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
      break;
    case 'xp':
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'levelup':
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
    case 'explode':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(volume * 1.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
  }
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  initAudio();

  if (e.key === 'Escape') {
    if (state.screen === 'playing') state.paused = !state.paused;
  }
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  handleClick(x, y);
});

function handleClick(x, y) {
  if (state.screen === 'menu') {
    if (y > 300 && y < 360) {
      startNewGame();
    }
  } else if (state.screen === 'shop') {
    handleShopClick(x, y);
  } else if (state.screen === 'levelup') {
    handleLevelUpClick(x, y);
  } else if (state.screen === 'gameover' || state.screen === 'victory') {
    state.screen = 'menu';
  }
}

function startNewGame() {
  state.screen = 'playing';
  state.wave = 1;
  state.waveTimer = 0;
  state.kills = 0;
  state.totalKills = 0;

  // Reset stats
  state.hp = 10;
  state.maxHp = 10;
  state.damage = 0;
  state.speed = 0;
  state.critChance = 0;
  state.hpRegen = 0;
  state.lifeSteal = 0;
  state.armor = 0;
  state.harvesting = 0;
  state.attackSpeed = 0;
  state.xp = 0;
  state.xpToLevel = 10;
  state.level = 1;
  state.gold = 0;

  // Starting weapon
  state.weapons = ['pistol'];
  weaponCooldowns = { pistol: 0 };

  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  player.invulnFrames = 0;

  enemies = [];
  bullets = [];
  xpOrbs = [];
  particles = [];

  spawnWave();
}

function spawnWave() {
  const baseCount = 5 + state.wave * 3;
  const spawnDelay = 1000 / (1 + state.wave * 0.1);

  // Spawn enemies over time
  let spawned = 0;
  const spawnInterval = setInterval(() => {
    if (state.screen !== 'playing' || spawned >= baseCount) {
      clearInterval(spawnInterval);
      return;
    }

    // Spawn position (outside screen)
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch(side) {
      case 0: x = -20; y = Math.random() * HEIGHT; break;
      case 1: x = WIDTH + 20; y = Math.random() * HEIGHT; break;
      case 2: x = Math.random() * WIDTH; y = -20; break;
      case 3: x = Math.random() * WIDTH; y = HEIGHT + 20; break;
    }

    // Enemy type based on wave
    let type = 'basic';
    if (state.wave >= 5 && Math.random() < 0.2) type = 'fast';
    if (state.wave >= 10 && Math.random() < 0.15) type = 'tank';
    if (state.wave >= 15 && Math.random() < 0.1) type = 'shooter';

    const stats = {
      basic: { hp: 10 + state.wave, speed: 60, damage: 3, xp: 1, gold: 1, size: 12, color: COLORS.enemy },
      fast: { hp: 5 + state.wave, speed: 120, damage: 2, xp: 2, gold: 2, size: 10, color: '#ff9944' },
      tank: { hp: 30 + state.wave * 2, speed: 40, damage: 5, xp: 5, gold: 5, size: 18, color: '#9944ff' },
      shooter: { hp: 15 + state.wave, speed: 50, damage: 4, xp: 3, gold: 3, size: 14, color: '#44ff99', shoots: true }
    };

    const s = stats[type];
    enemies.push({
      x, y,
      hp: s.hp,
      maxHp: s.hp,
      speed: s.speed,
      damage: s.damage,
      xp: s.xp,
      gold: s.gold,
      size: s.size,
      color: s.color,
      shoots: s.shoots || false,
      shootCooldown: 0
    });

    spawned++;
  }, spawnDelay);
}

function endWave() {
  state.waveTimer = 0;

  if (state.wave >= state.maxWaves) {
    state.screen = 'victory';
    return;
  }

  // Generate shop
  generateShop();
  state.screen = 'shop';
}

function generateShop() {
  state.shopWeapons = [];
  state.shopItems = [];

  // Available weapons based on wave
  const availableWeapons = Object.keys(WEAPONS).filter(w => {
    const tier = WEAPONS[w].tier;
    if (tier === 1) return true;
    if (tier === 2) return state.wave >= 2;
    if (tier === 3) return state.wave >= 4;
    if (tier === 4) return state.wave >= 8;
    return false;
  });

  // Pick 3 random weapons
  for (let i = 0; i < 3; i++) {
    const w = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
    const tier = WEAPONS[w].tier;
    state.shopWeapons.push({
      key: w,
      weapon: WEAPONS[w],
      cost: 15 + tier * 10
    });
  }

  // Pick 3 random items
  const itemKeys = Object.keys(ITEMS);
  for (let i = 0; i < 3; i++) {
    const k = itemKeys[Math.floor(Math.random() * itemKeys.length)];
    state.shopItems.push({
      key: k,
      item: ITEMS[k]
    });
  }
}

function handleShopClick(x, y) {
  // Weapons (left side)
  for (let i = 0; i < state.shopWeapons.length; i++) {
    const itemY = 180 + i * 80;
    if (x > 50 && x < 350 && y > itemY && y < itemY + 60) {
      const sw = state.shopWeapons[i];
      if (state.gold >= sw.cost && state.weapons.length < 6) {
        state.gold -= sw.cost;
        state.weapons.push(sw.key);
        weaponCooldowns[sw.key] = 0;
        playSound('xp');
      }
    }
  }

  // Items (right side)
  for (let i = 0; i < state.shopItems.length; i++) {
    const itemY = 180 + i * 80;
    if (x > 450 && x < 750 && y > itemY && y < itemY + 60) {
      const si = state.shopItems[i];
      if (state.gold >= si.item.cost) {
        state.gold -= si.item.cost;
        state[si.item.stat] += si.item.value;
        if (si.item.stat === 'maxHp') state.hp += si.item.value;
        playSound('xp');
      }
    }
  }

  // Continue button
  if (x > 300 && x < 500 && y > 500 && y < 560) {
    state.wave++;
    state.screen = 'playing';
    spawnWave();
  }
}

function showLevelUp() {
  state.screen = 'levelup';
  state.levelUpOptions = [];

  const stats = [
    { stat: 'maxHp', name: '+5 Max HP', value: 5 },
    { stat: 'damage', name: '+5% Damage', value: 5 },
    { stat: 'speed', name: '+10% Speed', value: 10 },
    { stat: 'critChance', name: '+5% Crit', value: 5 },
    { stat: 'attackSpeed', name: '+10% Attack Speed', value: 10 },
    { stat: 'armor', name: '+2 Armor', value: 2 }
  ];

  // Pick 3 random options
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * stats.length);
    state.levelUpOptions.push(stats.splice(idx, 1)[0]);
  }
}

function handleLevelUpClick(x, y) {
  for (let i = 0; i < state.levelUpOptions.length; i++) {
    const optY = 250 + i * 80;
    if (x > 200 && x < 600 && y > optY && y < optY + 60) {
      const opt = state.levelUpOptions[i];
      state[opt.stat] += opt.value;
      if (opt.stat === 'maxHp') state.hp += opt.value;
      playSound('levelup');
      state.screen = 'playing';
    }
  }
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused) return;

  state.waveTimer += dt;

  // HP regen
  if (state.hpRegen > 0) {
    const regenAmount = (0.2 + (state.hpRegen - 1) * 0.089) * dt / 1000;
    state.hp = Math.min(state.maxHp, state.hp + regenAmount);
  }

  // Player movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;

    const speed = player.baseSpeed * (1 + state.speed / 100) * dt / 1000;
    player.x += dx * speed;
    player.y += dy * speed;
  }

  // Keep in bounds
  player.x = Math.max(player.radius, Math.min(WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(HEIGHT - player.radius, player.y));

  // Invulnerability
  if (player.invulnFrames > 0) player.invulnFrames -= dt;

  // Fire weapons
  fireWeapons(dt);

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt / 1000;
    b.y += b.vy * dt / 1000;
    b.life -= dt;

    if (b.life <= 0 || b.x < -20 || b.x > WIDTH + 20 || b.y < -20 || b.y > HEIGHT + 20) {
      bullets.splice(i, 1);
      continue;
    }

    if (b.fromPlayer) {
      // Hit enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + 5) {
          let dmg = b.damage * (1 + state.damage / 100);
          const isCrit = Math.random() * 100 < state.critChance;
          if (isCrit) dmg *= 2;

          e.hp -= dmg;
          playSound('hit');

          // Life steal
          if (state.lifeSteal > 0 && Math.random() * 100 < state.lifeSteal) {
            state.hp = Math.min(state.maxHp, state.hp + 1);
          }

          // Hit particles
          for (let k = 0; k < 3; k++) {
            particles.push({
              x: b.x, y: b.y,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              life: 300,
              color: isCrit ? '#ffff00' : e.color,
              size: 3
            });
          }

          if (e.hp <= 0) {
            killEnemy(e, j);
          }

          if (b.explosive) {
            // Explosion
            playSound('explode');
            for (let k = enemies.length - 1; k >= 0; k--) {
              const e2 = enemies[k];
              if (Math.hypot(b.x - e2.x, b.y - e2.y) < 80) {
                e2.hp -= dmg * 0.5;
                if (e2.hp <= 0) killEnemy(e2, k);
              }
            }
            // Explosion particles
            for (let k = 0; k < 15; k++) {
              particles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 400,
                color: '#ff6600',
                size: 5
              });
            }
          }

          if (!b.piercing) {
            bullets.splice(i, 1);
          }
          break;
        }
      }
    } else {
      // Enemy bullet hits player
      if (player.invulnFrames <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < player.radius + 3) {
        takeDamage(b.damage);
        bullets.splice(i, 1);
      }
    }
  }

  // Update enemies
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0) {
      e.x += (dx / dist) * e.speed * dt / 1000;
      e.y += (dy / dist) * e.speed * dt / 1000;
    }

    // Shooter enemies
    if (e.shoots) {
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0 && dist < 300) {
        e.shootCooldown = 1500;
        const angle = Math.atan2(dy, dx);
        bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 150,
          vy: Math.sin(angle) * 150,
          damage: e.damage,
          life: 3000,
          fromPlayer: false
        });
      }
    }

    // Contact damage
    if (player.invulnFrames <= 0 && dist < e.size + player.radius) {
      takeDamage(e.damage);
    }
  }

  // Update XP orbs
  const pickupRange = 50 + state.harvesting;
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    const dist = Math.hypot(orb.x - player.x, orb.y - player.y);

    if (dist < pickupRange) {
      // Move toward player
      const dx = player.x - orb.x;
      const dy = player.y - orb.y;
      orb.x += dx * 0.2;
      orb.y += dy * 0.2;

      if (dist < 20) {
        state.xp += orb.xp * (1 + state.harvesting / 100);
        state.gold += orb.gold;
        playSound('xp');
        xpOrbs.splice(i, 1);

        // Check level up
        while (state.xp >= state.xpToLevel) {
          state.xp -= state.xpToLevel;
          state.level++;
          state.xpToLevel = Math.floor(state.xpToLevel * 1.5);
          state.maxHp++;
          state.hp++;
          showLevelUp();
        }
      }
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt / 1000;
    p.y += p.vy * dt / 1000;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Check wave end
  if (state.waveTimer >= state.waveDuration && enemies.length === 0) {
    endWave();
  }
}

function fireWeapons(dt) {
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;

  for (const e of enemies) {
    const dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = e;
    }
  }

  if (!nearestEnemy) return;

  const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);

  // Fire each weapon
  for (const weaponKey of state.weapons) {
    const weapon = WEAPONS[weaponKey];
    weaponCooldowns[weaponKey] = (weaponCooldowns[weaponKey] || 0) - dt;

    if (weaponCooldowns[weaponKey] <= 0 && nearestDist < weapon.range) {
      const cooldown = weapon.cooldown / (1 + state.attackSpeed / 100);
      weaponCooldowns[weaponKey] = cooldown;

      if (weapon.type === 'melee') {
        // Melee attack - hit all enemies in arc
        playSound('melee');
        for (const e of enemies) {
          const eDist = Math.hypot(e.x - player.x, e.y - player.y);
          const eAngle = Math.atan2(e.y - player.y, e.x - player.x);
          const angleDiff = Math.abs(normalizeAngle(eAngle - angle));

          if (eDist < weapon.range && angleDiff < Math.PI / 3) {
            let dmg = weapon.damage * (1 + state.damage / 100);
            if (Math.random() * 100 < state.critChance) dmg *= 2;
            e.hp -= dmg;

            if (e.hp <= 0) {
              const idx = enemies.indexOf(e);
              if (idx > -1) killEnemy(e, idx);
            }
          }
        }

        // Swing particles
        for (let i = 0; i < 5; i++) {
          const a = angle + (Math.random() - 0.5) * Math.PI / 2;
          particles.push({
            x: player.x + Math.cos(a) * 30,
            y: player.y + Math.sin(a) * 30,
            vx: Math.cos(a) * 100,
            vy: Math.sin(a) * 100,
            life: 200,
            color: '#ffffff',
            size: 3
          });
        }
      } else {
        // Ranged attack
        playSound('shoot');
        const numBullets = weapon.bullets || 1;
        const spread = weapon.spread || 0;

        for (let i = 0; i < numBullets; i++) {
          const bulletAngle = angle + (Math.random() - 0.5) * spread * 2;
          bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(bulletAngle) * weapon.speed * 50,
            vy: Math.sin(bulletAngle) * weapon.speed * 50,
            damage: weapon.damage,
            life: 2000,
            fromPlayer: true,
            explosive: weapon.explosive || false
          });
        }
      }
    }
  }
}

function killEnemy(e, index) {
  // Drop XP orb
  xpOrbs.push({
    x: e.x, y: e.y,
    xp: e.xp,
    gold: e.gold
  });

  // Death particles
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: e.x, y: e.y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      life: 400,
      color: e.color,
      size: 4
    });
  }

  state.kills++;
  state.totalKills++;
  enemies.splice(index, 1);
}

function takeDamage(amount) {
  // Armor reduction
  const reduction = state.armor / (state.armor + 15);
  amount = Math.max(1, Math.floor(amount * (1 - reduction)));

  state.hp -= amount;
  player.invulnFrames = 500;
  playSound('hit');

  // Damage particles
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: player.x, y: player.y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      life: 300,
      color: COLORS.hp,
      size: 4
    });
  }

  if (state.hp <= 0) {
    state.hp = 0;
    state.screen = 'gameover';
  }
}

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Rendering
function render() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (state.screen) {
    case 'menu': renderMenu(); break;
    case 'playing': renderGame(); break;
    case 'shop': renderShop(); break;
    case 'levelup': renderLevelUp(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderMenu() {
  // Title
  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 48px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('SPUDTATO', WIDTH/2, 150);

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '16px "Press Start 2P"';
  ctx.fillText('Survivor Arena', WIDTH/2, 200);

  // Start button
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(250, 300, 300, 60);
  ctx.fillStyle = '#fff';
  ctx.font = '20px "Press Start 2P"';
  ctx.fillText('START', WIDTH/2, 340);

  // Instructions
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('WASD - Move', WIDTH/2, 450);
  ctx.fillText('Weapons auto-aim!', WIDTH/2, 480);
  ctx.fillText('Survive 20 waves', WIDTH/2, 510);
}

function renderGame() {
  // Arena background
  ctx.fillStyle = COLORS.arena;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // XP orbs
  for (const orb of xpOrbs) {
    ctx.fillStyle = COLORS.xp;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 400;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Bullets
  for (const b of bullets) {
    ctx.fillStyle = b.fromPlayer ? COLORS.bullet : COLORS.bulletEnemy;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of enemies) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - 15, e.y - e.size - 8, 30, 4);
      ctx.fillStyle = COLORS.hp;
      ctx.fillRect(e.x - 15, e.y - e.size - 8, 30 * (e.hp / e.maxHp), 4);
    }
  }

  // Player
  const playerAlpha = player.invulnFrames > 0 ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
  ctx.globalAlpha = playerAlpha;

  // Player body (potato shape)
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.ellipse(player.x, player.y, player.radius, player.radius * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 3, 4, 0, Math.PI * 2);
  ctx.arc(player.x + 5, player.y - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 3, 2, 0, Math.PI * 2);
  ctx.arc(player.x + 5, player.y - 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // HUD
  renderHUD();
}

function renderHUD() {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, WIDTH, 40);

  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 10, 150, 20);
  ctx.fillStyle = COLORS.hp;
  ctx.fillRect(10, 10, 150 * (state.hp / state.maxHp), 20);
  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText(`HP ${Math.ceil(state.hp)}/${state.maxHp}`, 15, 25);

  // XP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(170, 10, 100, 20);
  ctx.fillStyle = COLORS.xp;
  ctx.fillRect(170, 10, 100 * (state.xp / state.xpToLevel), 20);
  ctx.fillStyle = '#fff';
  ctx.fillText(`LV ${state.level}`, 175, 25);

  // Wave and timer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  const timeLeft = Math.max(0, Math.ceil((state.waveDuration - state.waveTimer) / 1000));
  ctx.fillText(`Wave ${state.wave}/${state.maxWaves}  -  ${timeLeft}s`, WIDTH/2, 26);

  // Gold
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`${state.gold} G`, WIDTH - 10, 26);

  // Weapons display
  ctx.textAlign = 'left';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('Weapons: ' + state.weapons.map(w => WEAPONS[w].name).join(', '), 10, HEIGHT - 10);
}

function renderShop() {
  ctx.fillStyle = COLORS.shop;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '24px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('SHOP', WIDTH/2, 60);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText(`Gold: ${state.gold}  |  Weapons: ${state.weapons.length}/6`, WIDTH/2, 100);

  // Weapons (left)
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText('WEAPONS', 100, 150);

  for (let i = 0; i < state.shopWeapons.length; i++) {
    const sw = state.shopWeapons[i];
    const y = 180 + i * 80;
    const canBuy = state.gold >= sw.cost && state.weapons.length < 6;

    ctx.fillStyle = canBuy ? '#446644' : '#444444';
    ctx.fillRect(50, y, 300, 60);

    ctx.fillStyle = canBuy ? '#fff' : '#888';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(sw.weapon.name, 60, y + 25);
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`DMG:${sw.weapon.damage} | ${sw.weapon.type}`, 60, y + 45);

    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${sw.cost}G`, 340, y + 35);
    ctx.textAlign = 'left';
  }

  // Items (right)
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('ITEMS', 500, 150);

  for (let i = 0; i < state.shopItems.length; i++) {
    const si = state.shopItems[i];
    const y = 180 + i * 80;
    const canBuy = state.gold >= si.item.cost;

    ctx.fillStyle = canBuy ? '#444466' : '#444444';
    ctx.fillRect(450, y, 300, 60);

    ctx.fillStyle = canBuy ? '#fff' : '#888';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(si.item.name, 460, y + 25);
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`+${si.item.value} ${si.item.stat}`, 460, y + 45);

    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${si.item.cost}G`, 740, y + 35);
    ctx.textAlign = 'left';
  }

  // Continue button
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(300, 500, 200, 60);
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('CONTINUE', WIDTH/2, 538);
}

function renderLevelUp() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.xp;
  ctx.font = '24px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL UP!', WIDTH/2, 100);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText(`Level ${state.level}`, WIDTH/2, 150);
  ctx.fillText('Choose an upgrade:', WIDTH/2, 200);

  for (let i = 0; i < state.levelUpOptions.length; i++) {
    const opt = state.levelUpOptions[i];
    const y = 250 + i * 80;

    ctx.fillStyle = '#446644';
    ctx.fillRect(200, y, 400, 60);

    ctx.fillStyle = '#fff';
    ctx.font = '14px "Press Start 2P"';
    ctx.fillText(opt.name, WIDTH/2, y + 38);
  }
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.hp;
  ctx.font = '32px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText(`Wave: ${state.wave}/${state.maxWaves}`, WIDTH/2, 280);
  ctx.fillText(`Level: ${state.level}`, WIDTH/2, 320);
  ctx.fillText(`Total Kills: ${state.totalKills}`, WIDTH/2, 360);

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Click to continue', WIDTH/2, 450);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '32px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('You survived all 20 waves!', WIDTH/2, 260);
  ctx.fillText(`Level: ${state.level}`, WIDTH/2, 320);
  ctx.fillText(`Total Kills: ${state.totalKills}`, WIDTH/2, 360);

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Click to continue', WIDTH/2, 450);
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

requestAnimationFrame(gameLoop);
