// Frostfall - Expanded Edition
// 2D Skyrim demake with regions, quests, skills, and progression

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024;
const HEIGHT = 768;

// Nordic Winter palette
const COLORS = {
  bg: '#0a1018',
  snow: '#f0f4ff',
  snowLight: '#ffffff',
  ice: '#88ccee',
  ground: '#1a2a1a',
  groundLight: '#2a3a2a',
  groundSnow: '#e8eef0',
  tree: '#1a3020',
  treeDark: '#102818',
  player: '#3366aa',
  playerLight: '#4488cc',
  bandit: '#664433',
  wolf: '#554422',
  draugr: '#335566',
  dragon: '#883322',
  health: '#cc3333',
  stamina: '#33aa33',
  magicka: '#3366cc',
  gold: '#ffd700',
  xp: '#6699ff',
  fire: '#ff6622',
  frost: '#66ccff',
  lightning: '#ffff44'
};

// Regions (Holds)
const REGIONS = {
  whiterun: { name: 'Whiterun Hold', color: '#2a3a2a', enemies: ['wolf', 'bandit'], difficulty: 1 },
  falkreath: { name: 'Falkreath', color: '#1a2a1a', enemies: ['wolf', 'bandit', 'draugr'], difficulty: 2 },
  reach: { name: 'The Reach', color: '#3a3a2a', enemies: ['bandit', 'draugr', 'hagraven'], difficulty: 3 },
  eastmarch: { name: 'Eastmarch', color: '#2a2a3a', enemies: ['draugr', 'frost_troll'], difficulty: 4 },
  throat: { name: 'Throat of the World', color: '#4a5a6a', enemies: ['frost_troll', 'dragon'], difficulty: 5 }
};

// Enemy types
const ENEMIES = {
  wolf: { hp: 30, damage: 8, speed: 3, xp: 15, gold: 5, behavior: 'chase', color: COLORS.wolf },
  bandit: { hp: 50, damage: 12, speed: 2, xp: 25, gold: 20, behavior: 'attack', color: COLORS.bandit },
  draugr: { hp: 80, damage: 18, speed: 1.5, xp: 40, gold: 30, behavior: 'slow_attack', color: COLORS.draugr },
  hagraven: { hp: 60, damage: 25, speed: 2, xp: 60, gold: 50, behavior: 'magic', color: '#665544' },
  frost_troll: { hp: 150, damage: 30, speed: 1.2, xp: 100, gold: 80, behavior: 'tank', color: '#aaccdd' },
  dragon: { hp: 500, damage: 50, speed: 2.5, xp: 500, gold: 300, behavior: 'boss', color: COLORS.dragon }
};

// Skills
const SKILLS = {
  oneHanded: { name: 'One-Handed', level: 1, xp: 0 },
  archery: { name: 'Archery', level: 1, xp: 0 },
  destruction: { name: 'Destruction', level: 1, xp: 0 },
  restoration: { name: 'Restoration', level: 1, xp: 0 },
  lightArmor: { name: 'Light Armor', level: 1, xp: 0 },
  sneak: { name: 'Sneak', level: 1, xp: 0 }
};

// Spells
const SPELLS = {
  flames: { name: 'Flames', damage: 15, cost: 10, type: 'fire', unlocked: true },
  frostbite: { name: 'Frostbite', damage: 20, cost: 15, type: 'frost', unlocked: false },
  sparks: { name: 'Sparks', damage: 25, cost: 20, type: 'lightning', unlocked: false },
  healing: { name: 'Healing', heal: 30, cost: 15, type: 'heal', unlocked: true }
};

// Game state
const state = {
  screen: 'menu',
  region: 'whiterun',

  // Stats
  level: 1,
  xp: 0,
  xpToLevel: 100,
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  magicka: 100,
  maxMagicka: 100,
  gold: 50,

  // Combat
  weapon: 'sword',
  spell: 'flames',
  attackMode: 'melee',

  // Progress
  kills: 0,
  questsCompleted: 0,
  dragonsSlain: 0,

  // Current quest
  currentQuest: null,
  questProgress: 0,

  // Skills
  skills: JSON.parse(JSON.stringify(SKILLS)),
  spells: JSON.parse(JSON.stringify(SPELLS)),

  // Achievements
  achievements: {
    firstKill: false,
    reachFalkreath: false,
    slayDragon: false,
    level10: false,
    masterMage: false,
    questComplete: false
  },

  paused: false,
  time: 0,
  showTutorial: true,
  tutorialStep: 0
};

// Player
const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  angle: 0,
  speed: 3,
  radius: 16,
  attackCooldown: 0,
  invulnFrames: 0,
  casting: false,
  sneaking: false
};

// Arrays
let enemies = [];
let projectiles = [];
let particles = [];
let snowflakes = [];
let trees = [];
let npcs = [];

// Input
const keys = {};
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Initialize snow
for (let i = 0; i < 150; i++) {
  snowflakes.push({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 1 + 0.5,
    drift: (Math.random() - 0.5) * 0.5
  });
}

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
    case 'sword':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'magic':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
    case 'hit':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(volume * 0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      break;
    case 'death':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.4);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      break;
    case 'levelup':
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
      break;
    case 'heal':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
      break;
  }
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === 'Escape' && state.screen === 'playing') {
    state.paused = !state.paused;
  }
  if (e.key.toLowerCase() === 'h') {
    state.showTutorial = !state.showTutorial;
  }
  if (e.key.toLowerCase() === 'q' && state.screen === 'playing') {
    // Toggle attack mode
    state.attackMode = state.attackMode === 'melee' ? 'magic' : 'melee';
  }
  if (e.key.toLowerCase() === 'r' && state.screen === 'playing') {
    // Use healing spell
    if (state.magicka >= 15 && state.hp < state.maxHp) {
      state.hp = Math.min(state.maxHp, state.hp + 30);
      state.magicka -= 15;
      playSound('heal');
      // Healing particles
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: player.x, y: player.y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 3,
          life: 30,
          color: '#44ff44',
          size: 4
        });
      }
    }
  }
  // Cycle spells with 1-4
  if (state.screen === 'playing') {
    if (e.key === '1') state.spell = 'flames';
    if (e.key === '2' && state.spells.frostbite.unlocked) state.spell = 'frostbite';
    if (e.key === '3' && state.spells.sparks.unlocked) state.spell = 'sparks';
    if (e.key === '4') state.spell = 'healing';
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
  handleClick();
});

canvas.addEventListener('mouseup', () => {
  mouse.down = false;
});

function handleClick() {
  if (state.screen === 'menu') {
    const y = mouse.y;
    if (y > 340 && y < 390) startNewGame();
    else if (y > 400 && y < 450) loadGame();
    else if (y > 460 && y < 510) state.screen = 'skills';
    else if (y > 520 && y < 570) state.screen = 'regionSelect';
  } else if (state.screen === 'skills') {
    handleSkillsClick();
  } else if (state.screen === 'regionSelect') {
    handleRegionSelectClick();
  } else if (state.screen === 'gameover') {
    state.screen = 'menu';
  } else if (state.screen === 'victory') {
    state.screen = 'menu';
  }
}

function startNewGame() {
  state.screen = 'playing';
  state.hp = state.maxHp;
  state.stamina = state.maxStamina;
  state.magicka = state.maxMagicka;
  state.time = 0;
  state.questProgress = 0;

  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  player.invulnFrames = 0;

  enemies = [];
  projectiles = [];
  particles = [];

  generateRegion();
  spawnEnemies();
  generateQuest();
}

function generateRegion() {
  trees = [];
  npcs = [];

  const numTrees = 15 + Math.floor(Math.random() * 10);
  for (let i = 0; i < numTrees; i++) {
    trees.push({
      x: 50 + Math.random() * (WIDTH - 100),
      y: 100 + Math.random() * (HEIGHT - 200),
      size: 20 + Math.random() * 30
    });
  }

  // Add quest giver NPC
  npcs.push({
    x: 100,
    y: HEIGHT - 150,
    type: 'questgiver',
    name: 'Guard'
  });
}

function spawnEnemies() {
  const region = REGIONS[state.region];
  const numEnemies = 4 + region.difficulty * 2;

  for (let i = 0; i < numEnemies; i++) {
    const type = region.enemies[Math.floor(Math.random() * region.enemies.length)];
    const stats = ENEMIES[type];

    let x, y;
    do {
      x = 50 + Math.random() * (WIDTH - 100);
      y = 50 + Math.random() * (HEIGHT - 100);
    } while (Math.hypot(x - player.x, y - player.y) < 200);

    enemies.push({
      x, y,
      type,
      hp: stats.hp * region.difficulty,
      maxHp: stats.hp * region.difficulty,
      speed: stats.speed,
      damage: stats.damage * region.difficulty,
      xp: stats.xp * region.difficulty,
      gold: stats.gold * region.difficulty,
      behavior: stats.behavior,
      color: stats.color,
      angle: Math.random() * Math.PI * 2,
      attackCooldown: 0,
      size: type === 'dragon' ? 40 : (type === 'frost_troll' ? 25 : 18)
    });
  }
}

function generateQuest() {
  const quests = [
    { type: 'kill', target: 5, desc: 'Slay 5 enemies' },
    { type: 'explore', target: 1, desc: 'Explore the region' },
    { type: 'boss', target: 1, desc: 'Defeat the boss' }
  ];
  state.currentQuest = quests[Math.floor(Math.random() * quests.length)];
  state.questProgress = 0;
}

function attack() {
  if (player.attackCooldown > 0) return;

  if (state.attackMode === 'melee') {
    // Melee attack
    player.attackCooldown = 400;
    playSound('sword');

    // Gain skill XP
    state.skills.oneHanded.xp += 5;
    checkSkillLevelUp('oneHanded');

    const damage = 20 * (1 + state.skills.oneHanded.level * 0.1);

    // Check hits
    for (const e of enemies) {
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      const angleToEnemy = Math.atan2(e.y - player.y, e.x - player.x);
      const angleDiff = Math.abs(normalizeAngle(angleToEnemy - player.angle));

      if (dist < 60 && angleDiff < Math.PI / 3) {
        damageEnemy(e, damage);
      }
    }

    // Swing particles
    for (let i = 0; i < 5; i++) {
      const angle = player.angle + (Math.random() - 0.5) * 0.5;
      particles.push({
        x: player.x + Math.cos(angle) * 30,
        y: player.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 15,
        color: '#aaaaaa',
        size: 3
      });
    }
  } else {
    // Magic attack
    const spell = SPELLS[state.spell];
    if (state.magicka < spell.cost) return;

    player.attackCooldown = 300;
    state.magicka -= spell.cost;
    playSound('magic');

    // Gain destruction XP
    state.skills.destruction.xp += 8;
    checkSkillLevelUp('destruction');

    const damage = spell.damage * (1 + state.skills.destruction.level * 0.15);

    let color = COLORS.fire;
    if (spell.type === 'frost') color = COLORS.frost;
    if (spell.type === 'lightning') color = COLORS.lightning;

    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(player.angle) * 10,
      vy: Math.sin(player.angle) * 10,
      damage: damage,
      color: color,
      type: spell.type,
      fromPlayer: true
    });
  }
}

function damageEnemy(e, damage) {
  e.hp -= damage;
  playSound('hit');

  // Damage particles
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: e.x, y: e.y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 20,
      color: '#ff4444',
      size: 3
    });
  }

  if (e.hp <= 0) {
    killEnemy(e);
  }
}

function killEnemy(e) {
  playSound('death');

  // Death particles
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: e.x, y: e.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      color: e.color,
      size: 4
    });
  }

  // Rewards
  gainXP(e.xp);
  state.gold += e.gold;
  state.kills++;

  // Quest progress
  if (state.currentQuest && state.currentQuest.type === 'kill') {
    state.questProgress++;
    if (state.questProgress >= state.currentQuest.target) {
      completeQuest();
    }
  }

  // Achievements
  if (!state.achievements.firstKill) state.achievements.firstKill = true;
  if (e.type === 'dragon' && !state.achievements.slayDragon) {
    state.achievements.slayDragon = true;
    state.dragonsSlain++;
  }

  // Remove enemy
  const index = enemies.indexOf(e);
  if (index > -1) enemies.splice(index, 1);
}

function gainXP(amount) {
  state.xp += amount;

  while (state.xp >= state.xpToLevel) {
    state.xp -= state.xpToLevel;
    state.level++;
    state.xpToLevel = Math.floor(state.xpToLevel * 1.5);

    // Level up bonuses
    state.maxHp += 10;
    state.hp = state.maxHp;
    state.maxStamina += 5;
    state.maxMagicka += 10;

    playSound('levelup');

    // Level up particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 40,
        color: COLORS.xp,
        size: 5
      });
    }

    // Unlock spells at certain levels
    if (state.level >= 5) state.spells.frostbite.unlocked = true;
    if (state.level >= 10) state.spells.sparks.unlocked = true;

    // Achievement
    if (state.level >= 10 && !state.achievements.level10) {
      state.achievements.level10 = true;
    }
  }
}

function checkSkillLevelUp(skill) {
  const s = state.skills[skill];
  const xpNeeded = s.level * 50;

  if (s.xp >= xpNeeded) {
    s.xp -= xpNeeded;
    s.level++;

    // Mage achievement
    if (skill === 'destruction' && s.level >= 50 && !state.achievements.masterMage) {
      state.achievements.masterMage = true;
    }
  }
}

function completeQuest() {
  state.questsCompleted++;
  state.gold += 100;
  gainXP(200);

  if (!state.achievements.questComplete) {
    state.achievements.questComplete = true;
  }

  // New quest
  generateQuest();
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused) return;

  state.time += dt;

  // Snow animation
  for (const s of snowflakes) {
    s.y += s.speed;
    s.x += s.drift;
    if (s.y > HEIGHT) {
      s.y = 0;
      s.x = Math.random() * WIDTH;
    }
    if (s.x < 0) s.x = WIDTH;
    if (s.x > WIDTH) s.x = 0;
  }

  // Player movement
  let dx = 0, dy = 0;
  const sneaking = keys['control'] || keys['c'];
  const sprinting = keys['shift'] && state.stamina > 0;

  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;

    let speed = player.speed * (1 + state.skills.sneak.level * 0.02);
    if (sneaking) speed *= 0.5;
    if (sprinting) {
      speed *= 1.6;
      state.stamina -= dt * 0.02;
    }

    player.x += dx * speed;
    player.y += dy * speed;

    // Sneak XP
    if (sneaking) {
      state.skills.sneak.xp += dt * 0.01;
      checkSkillLevelUp('sneak');
    }
  }

  // Regenerate stamina and magicka
  if (!sprinting) {
    state.stamina = Math.min(state.maxStamina, state.stamina + dt * 0.01);
  }
  state.magicka = Math.min(state.maxMagicka, state.magicka + dt * 0.005);

  // Bounds
  player.x = Math.max(player.radius, Math.min(WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius + 50, Math.min(HEIGHT - player.radius, player.y));

  // Player aim
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Attack
  if (mouse.down) {
    attack();
  }

  // Cooldowns
  if (player.attackCooldown > 0) player.attackCooldown -= dt;
  if (player.invulnFrames > 0) player.invulnFrames -= dt;

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > HEIGHT) {
      projectiles.splice(i, 1);
      continue;
    }

    if (p.fromPlayer) {
      // Hit enemies
      for (const e of enemies) {
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.size + 10) {
          damageEnemy(e, p.damage);

          // Effect particles
          for (let j = 0; j < 8; j++) {
            particles.push({
              x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 25,
              color: p.color,
              size: 4
            });
          }

          projectiles.splice(i, 1);
          break;
        }
      }
    } else {
      // Hit player
      if (player.invulnFrames <= 0 && Math.hypot(p.x - player.x, p.y - player.y) < player.radius) {
        takeDamage(p.damage);
        projectiles.splice(i, 1);
      }
    }
  }

  // Update enemies
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const angleToPlayer = Math.atan2(dy, dx);

    e.attackCooldown -= dt;

    switch (e.behavior) {
      case 'chase':
        e.angle = angleToPlayer;
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        if (dist < e.size + player.radius && player.invulnFrames <= 0) {
          takeDamage(e.damage);
        }
        break;

      case 'attack':
        if (dist > 50) {
          e.angle = angleToPlayer;
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
        }
        if (dist < e.size + player.radius + 20 && e.attackCooldown <= 0) {
          e.attackCooldown = 1000;
          if (player.invulnFrames <= 0) {
            takeDamage(e.damage);
          }
        }
        break;

      case 'slow_attack':
        e.angle = angleToPlayer;
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        if (dist < e.size + player.radius && e.attackCooldown <= 0) {
          e.attackCooldown = 1500;
          if (player.invulnFrames <= 0) {
            takeDamage(e.damage);
          }
        }
        break;

      case 'magic':
        // Keep distance and shoot
        if (dist < 150) {
          e.x -= Math.cos(angleToPlayer) * e.speed;
          e.y -= Math.sin(angleToPlayer) * e.speed;
        } else if (dist > 250) {
          e.x += Math.cos(angleToPlayer) * e.speed;
          e.y += Math.sin(angleToPlayer) * e.speed;
        }
        e.angle = angleToPlayer;
        if (e.attackCooldown <= 0) {
          e.attackCooldown = 2000;
          projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(angleToPlayer) * 6,
            vy: Math.sin(angleToPlayer) * 6,
            damage: e.damage,
            color: '#ff6600',
            fromPlayer: false
          });
        }
        break;

      case 'tank':
        e.angle = angleToPlayer;
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        if (dist < e.size + player.radius && e.attackCooldown <= 0) {
          e.attackCooldown = 800;
          if (player.invulnFrames <= 0) {
            takeDamage(e.damage);
          }
        }
        break;

      case 'boss':
        // Dragon - fly and breathe fire
        e.angle = angleToPlayer;
        e.x += Math.cos(e.angle + Math.sin(state.time * 0.002) * 0.5) * e.speed;
        e.y += Math.sin(e.angle + Math.sin(state.time * 0.002) * 0.5) * e.speed;

        if (e.attackCooldown <= 0) {
          e.attackCooldown = 1500;
          // Fire breath
          for (let i = -2; i <= 2; i++) {
            const angle = angleToPlayer + i * 0.2;
            projectiles.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 8,
              vy: Math.sin(angle) * 8,
              damage: e.damage,
              color: COLORS.fire,
              fromPlayer: false
            });
          }
        }
        break;
    }

    // Keep in bounds
    e.x = Math.max(e.size, Math.min(WIDTH - e.size, e.x));
    e.y = Math.max(e.size + 50, Math.min(HEIGHT - e.size, e.y));
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.vx *= 0.95;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Check region completion
  if (enemies.length === 0) {
    advanceRegion();
  }

  // Tutorial
  if (state.showTutorial && state.tutorialStep < 4) {
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
  // Light armor skill reduces damage
  const reduction = 1 - state.skills.lightArmor.level * 0.02;
  amount = Math.floor(amount * reduction);

  state.hp -= amount;
  player.invulnFrames = 1000;
  playSound('hit');

  // Gain armor XP
  state.skills.lightArmor.xp += 10;
  checkSkillLevelUp('lightArmor');

  // Damage particles
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: player.x, y: player.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 20,
      color: COLORS.health,
      size: 4
    });
  }

  if (state.hp <= 0) {
    state.hp = 0;
    state.screen = 'gameover';
    saveGame();
  }
}

function advanceRegion() {
  const regionOrder = ['whiterun', 'falkreath', 'reach', 'eastmarch', 'throat'];
  const currentIndex = regionOrder.indexOf(state.region);

  if (currentIndex < regionOrder.length - 1) {
    state.region = regionOrder[currentIndex + 1];

    // Achievements
    if (state.region === 'falkreath') state.achievements.reachFalkreath = true;

    generateRegion();
    spawnEnemies();
    generateQuest();
    saveGame();
  } else {
    state.screen = 'victory';
    saveGame();
  }
}

function handleSkillsClick() {
  // Back button
  if (mouse.y > 650 && mouse.y < 700) {
    state.screen = 'menu';
  }
}

function handleRegionSelectClick() {
  const regionList = Object.keys(REGIONS);
  for (let i = 0; i < regionList.length; i++) {
    const y = 200 + i * 60;
    if (mouse.y > y && mouse.y < y + 50) {
      state.region = regionList[i];
      startNewGame();
    }
  }

  // Back
  if (mouse.y > 550 && mouse.y < 600) {
    state.screen = 'menu';
  }
}

function saveGame() {
  const saveData = {
    level: state.level,
    xp: state.xp,
    xpToLevel: state.xpToLevel,
    maxHp: state.maxHp,
    maxStamina: state.maxStamina,
    maxMagicka: state.maxMagicka,
    gold: state.gold,
    kills: state.kills,
    questsCompleted: state.questsCompleted,
    dragonsSlain: state.dragonsSlain,
    skills: state.skills,
    spells: state.spells,
    achievements: state.achievements
  };
  localStorage.setItem('frostfall_expanded_save', JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem('frostfall_expanded_save');
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(state, data);
  }
  startNewGame();
}

// Rendering
function render() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (state.screen) {
    case 'menu': renderMenu(); break;
    case 'playing':
      renderGame();
      if (state.paused) renderPauseOverlay();
      break;
    case 'skills': renderSkills(); break;
    case 'regionSelect': renderRegionSelect(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderMenu() {
  // Mountain silhouettes
  ctx.fillStyle = '#1a2a35';
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  ctx.lineTo(0, 500);
  ctx.lineTo(150, 350);
  ctx.lineTo(300, 450);
  ctx.lineTo(450, 280);
  ctx.lineTo(600, 400);
  ctx.lineTo(750, 320);
  ctx.lineTo(900, 450);
  ctx.lineTo(WIDTH, 380);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Snow
  ctx.fillStyle = COLORS.snowLight;
  for (const s of snowflakes) {
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Title glow
  const gradient = ctx.createRadialGradient(WIDTH/2, 150, 0, WIDTH/2, 150, 300);
  gradient.addColorStop(0, 'rgba(136, 204, 238, 0.2)');
  gradient.addColorStop(1, 'rgba(136, 204, 238, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, 400);

  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 84px UnifrakturMaguntia';
  ctx.textAlign = 'center';
  ctx.fillText('Frostfall', WIDTH/2 + 3, 153);
  ctx.fillStyle = COLORS.ice;
  ctx.fillText('Frostfall', WIDTH/2, 150);

  // Subtitle
  ctx.fillStyle = '#668899';
  ctx.font = '28px Cinzel';
  ctx.fillText('EXPANDED EDITION', WIDTH/2, 210);

  // Tagline
  ctx.fillStyle = '#556677';
  ctx.font = '18px Cinzel';
  ctx.fillText("A Winter's Tale", WIDTH/2, 250);

  // Menu items
  const menuItems = ['[ BEGIN JOURNEY ]', '[ CONTINUE ]', '[ VIEW SKILLS ]', '[ SELECT REGION ]'];
  ctx.font = '26px Cinzel';
  for (let i = 0; i < menuItems.length; i++) {
    const y = 360 + i * 60;
    const hover = mouse.y > y - 30 && mouse.y < y + 10;
    ctx.fillStyle = hover ? COLORS.ice : COLORS.snow;
    ctx.fillText(menuItems[i], WIDTH/2, y);
  }

  // Stats
  ctx.fillStyle = '#556677';
  ctx.font = '16px Cinzel';
  ctx.fillText(`Level: ${state.level}  |  Gold: ${state.gold}  |  Dragons Slain: ${state.dragonsSlain}`, WIDTH/2, 650);

  // Controls
  ctx.font = '14px Cinzel';
  ctx.fillText('WASD - Move | Mouse - Aim | Click - Attack | Q - Toggle Magic | R - Heal', WIDTH/2, 720);

  // Achievement count
  const achCount = Object.values(state.achievements).filter(a => a).length;
  ctx.fillText(`Achievements: ${achCount}/6`, WIDTH/2, 745);
}

function renderGame() {
  const region = REGIONS[state.region];

  // Ground
  ctx.fillStyle = region.color;
  ctx.fillRect(0, 50, WIDTH, HEIGHT - 50);

  // Snow patches
  ctx.fillStyle = COLORS.groundSnow;
  for (let i = 0; i < 20; i++) {
    const x = (i * 137 + state.time * 0.01) % WIDTH;
    const y = 100 + (i * 89) % (HEIGHT - 150);
    ctx.beginPath();
    ctx.ellipse(x, y, 30 + (i % 3) * 15, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trees
  for (const tree of trees) {
    // Trunk
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(tree.x - 5, tree.y, 10, tree.size * 0.5);

    // Foliage (triangle)
    ctx.fillStyle = COLORS.tree;
    ctx.beginPath();
    ctx.moveTo(tree.x, tree.y - tree.size);
    ctx.lineTo(tree.x - tree.size * 0.6, tree.y);
    ctx.lineTo(tree.x + tree.size * 0.6, tree.y);
    ctx.closePath();
    ctx.fill();

    // Snow on tree
    ctx.fillStyle = COLORS.snowLight;
    ctx.beginPath();
    ctx.moveTo(tree.x, tree.y - tree.size);
    ctx.lineTo(tree.x - tree.size * 0.3, tree.y - tree.size * 0.5);
    ctx.lineTo(tree.x + tree.size * 0.3, tree.y - tree.size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // NPCs
  for (const npc of npcs) {
    ctx.fillStyle = '#6688aa';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px Cinzel';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, npc.x, npc.y - 25);
  }

  // Snow particles
  ctx.fillStyle = COLORS.snowLight;
  for (const s of snowflakes) {
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Projectiles
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(p.x - p.vx * 0.5, p.y - p.vy * 0.5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Enemies
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);

    ctx.fillStyle = e.color;

    if (e.type === 'dragon') {
      // Dragon shape
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(-30, -25);
      ctx.lineTo(-20, 0);
      ctx.lineTo(-30, 25);
      ctx.closePath();
      ctx.fill();

      // Wings
      ctx.fillStyle = '#662211';
      ctx.beginPath();
      ctx.ellipse(-10, -30, 25, 15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-10, 30, 25, 15, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'wolf' || e.type === 'frost_troll') {
      // Animal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, e.size, e.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.size * 0.7, 0, e.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Humanoid
      ctx.beginPath();
      ctx.arc(0, 0, e.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - 25, e.y - e.size - 12, 50, 6);
      ctx.fillStyle = COLORS.health;
      ctx.fillRect(e.x - 25, e.y - e.size - 12, 50 * (e.hp / e.maxHp), 6);
    }

    // Enemy type label
    ctx.fillStyle = '#fff';
    ctx.font = '10px Cinzel';
    ctx.textAlign = 'center';
    ctx.fillText(e.type.charAt(0).toUpperCase() + e.type.slice(1).replace('_', ' '), e.x, e.y - e.size - 18);
  }

  // Player
  const playerAlpha = player.invulnFrames > 0 ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
  ctx.globalAlpha = playerAlpha;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Body
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Weapon/spell indicator
  if (state.attackMode === 'melee') {
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(player.radius, -3, 15, 6);
  } else {
    const spellColor = state.spell === 'flames' ? COLORS.fire :
                       state.spell === 'frostbite' ? COLORS.frost :
                       state.spell === 'sparks' ? COLORS.lightning : '#44ff44';
    ctx.fillStyle = spellColor;
    ctx.beginPath();
    ctx.arc(player.radius + 5, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // HUD
  renderHUD();

  // Tutorial
  if (state.showTutorial && state.tutorialStep < 4) {
    renderTutorial();
  }
}

function renderHUD() {
  // Top bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, WIDTH, 50);

  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 10, 150, 12);
  ctx.fillStyle = COLORS.health;
  ctx.fillRect(10, 10, 150 * (state.hp / state.maxHp), 12);

  // Stamina bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 26, 150, 12);
  ctx.fillStyle = COLORS.stamina;
  ctx.fillRect(10, 26, 150 * (state.stamina / state.maxStamina), 12);

  // Magicka bar
  ctx.fillStyle = '#333';
  ctx.fillRect(170, 10, 150, 12);
  ctx.fillStyle = COLORS.magicka;
  ctx.fillRect(170, 10, 150 * (state.magicka / state.maxMagicka), 12);

  // Labels
  ctx.fillStyle = '#fff';
  ctx.font = '10px Cinzel';
  ctx.textAlign = 'left';
  ctx.fillText('HP', 15, 20);
  ctx.fillText('STA', 15, 36);
  ctx.fillText('MP', 175, 20);

  // Level and XP
  ctx.fillStyle = COLORS.xp;
  ctx.textAlign = 'center';
  ctx.font = '14px Cinzel';
  ctx.fillText(`Lvl ${state.level}`, WIDTH/2 - 80, 20);
  ctx.fillStyle = '#333';
  ctx.fillRect(WIDTH/2 - 50, 10, 100, 10);
  ctx.fillStyle = COLORS.xp;
  ctx.fillRect(WIDTH/2 - 50, 10, 100 * (state.xp / state.xpToLevel), 10);

  // Gold
  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = 'right';
  ctx.font = '16px Cinzel';
  ctx.fillText(`${state.gold} Gold`, WIDTH - 10, 22);

  // Attack mode
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = '12px Cinzel';
  const modeText = state.attackMode === 'melee' ? 'Sword' : state.spell.charAt(0).toUpperCase() + state.spell.slice(1);
  ctx.fillText(`Mode: ${modeText} (Q)`, 340, 36);

  // Bottom bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '14px Cinzel';
  ctx.textAlign = 'center';
  ctx.fillText(`${REGIONS[state.region].name}  |  Kills: ${state.kills}  |  Enemies: ${enemies.length}`, WIDTH/2, HEIGHT - 15);

  // Quest
  if (state.currentQuest) {
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'left';
    ctx.fillText(`Quest: ${state.currentQuest.desc} (${state.questProgress}/${state.currentQuest.target})`, 10, HEIGHT - 15);
  }
}

function renderTutorial() {
  const messages = [
    'Use WASD to move your character',
    'Click to attack (Q toggles magic)',
    'Defeat all enemies to advance',
    'Press R to heal with magicka'
  ];

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(WIDTH/2 - 220, HEIGHT - 120, 440, 60);
  ctx.strokeStyle = COLORS.ice;
  ctx.lineWidth = 2;
  ctx.strokeRect(WIDTH/2 - 220, HEIGHT - 120, 440, 60);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '18px Cinzel';
  ctx.textAlign = 'center';
  ctx.fillText(messages[state.tutorialStep], WIDTH/2, HEIGHT - 85);
}

function renderPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '56px UnifrakturMaguntia';
  ctx.textAlign = 'center';
  ctx.fillText('Paused', WIDTH/2, HEIGHT/2 - 40);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Cinzel';
  ctx.fillText('Press ESC to resume', WIDTH/2, HEIGHT/2 + 20);
}

function renderSkills() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '48px UnifrakturMaguntia';
  ctx.textAlign = 'center';
  ctx.fillText('Skills', WIDTH/2, 80);

  const skillList = Object.keys(state.skills);
  ctx.font = '20px Cinzel';

  for (let i = 0; i < skillList.length; i++) {
    const key = skillList[i];
    const skill = state.skills[key];
    const y = 150 + i * 50;

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(skill.name, 250, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.xp;
    ctx.fillText(`Level ${skill.level}`, 750, y);
  }

  // Spells
  ctx.fillStyle = COLORS.ice;
  ctx.font = '32px Cinzel';
  ctx.textAlign = 'center';
  ctx.fillText('Spells', WIDTH/2, 480);

  const spellList = Object.keys(state.spells);
  ctx.font = '18px Cinzel';

  for (let i = 0; i < spellList.length; i++) {
    const key = spellList[i];
    const spell = state.spells[key];
    const y = 520 + i * 35;

    ctx.fillStyle = spell.unlocked ? '#fff' : '#666';
    ctx.textAlign = 'left';
    ctx.fillText(spell.name, 300, y);

    ctx.textAlign = 'right';
    ctx.fillText(spell.unlocked ? 'Unlocked' : 'Locked', 700, y);
  }

  // Back button
  ctx.fillStyle = mouse.y > 650 && mouse.y < 700 ? COLORS.ice : '#fff';
  ctx.textAlign = 'center';
  ctx.font = '24px Cinzel';
  ctx.fillText('[ BACK ]', WIDTH/2, 680);
}

function renderRegionSelect() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '48px UnifrakturMaguntia';
  ctx.textAlign = 'center';
  ctx.fillText('Select Region', WIDTH/2, 100);

  const regionList = Object.keys(REGIONS);
  ctx.font = '22px Cinzel';

  for (let i = 0; i < regionList.length; i++) {
    const key = regionList[i];
    const region = REGIONS[key];
    const y = 200 + i * 60;
    const hover = mouse.y > y && mouse.y < y + 50;

    ctx.fillStyle = hover ? COLORS.ice : '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(region.name, 250, y + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#668899';
    ctx.fillText(`Difficulty: ${'*'.repeat(region.difficulty)}`, 750, y + 30);
  }

  // Back button
  ctx.textAlign = 'center';
  ctx.fillStyle = mouse.y > 550 && mouse.y < 600 ? COLORS.ice : '#fff';
  ctx.font = '24px Cinzel';
  ctx.fillText('[ BACK ]', WIDTH/2, 580);
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.health;
  ctx.font = '64px UnifrakturMaguntia';
  ctx.textAlign = 'center';
  ctx.fillText('You Have Fallen', WIDTH/2, HEIGHT/2 - 100);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Cinzel';
  ctx.fillText(`Level Reached: ${state.level}`, WIDTH/2, HEIGHT/2);
  ctx.fillText(`Enemies Slain: ${state.kills}`, WIDTH/2, HEIGHT/2 + 40);
  ctx.fillText(`Gold Collected: ${state.gold}`, WIDTH/2, HEIGHT/2 + 80);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '24px Cinzel';
  ctx.fillText('[ CLICK TO CONTINUE ]', WIDTH/2, HEIGHT/2 + 160);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '64px UnifrakturMaguntia';
  ctx.textAlign = 'center';
  ctx.fillText('Dragonborn!', WIDTH/2, HEIGHT/2 - 100);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Cinzel';
  ctx.fillText('You have conquered all of Skyrim!', WIDTH/2, HEIGHT/2 - 30);
  ctx.fillText(`Final Level: ${state.level}`, WIDTH/2, HEIGHT/2 + 20);
  ctx.fillText(`Total Kills: ${state.kills}`, WIDTH/2, HEIGHT/2 + 60);
  ctx.fillText(`Dragons Slain: ${state.dragonsSlain}`, WIDTH/2, HEIGHT/2 + 100);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '24px Cinzel';
  ctx.fillText('[ CLICK TO CONTINUE ]', WIDTH/2, HEIGHT/2 + 180);
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

// Load saved data
const saved = localStorage.getItem('frostfall_expanded_save');
if (saved) {
  const data = JSON.parse(saved);
  Object.assign(state, data);
}

// Start
requestAnimationFrame(gameLoop);
