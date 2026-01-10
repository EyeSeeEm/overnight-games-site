// Derelict Ship - Expanded Edition
// Survival horror with multiple decks, enemy types, upgrades, save/load

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 900;
const HEIGHT = 700;

// Color palette
const COLORS = {
  bg: '#050810',
  wall: '#1a1a2e',
  wallLight: '#2a2a4e',
  floor: '#0a0a15',
  floorLight: '#121220',
  player: '#00ccff',
  playerGlow: '#00ffff',
  enemy: '#ff3366',
  enemyGlow: '#ff6699',
  drone: '#ffaa00',
  parasite: '#33ff66',
  boss: '#ff0066',
  o2: '#00ff99',
  hp: '#ff3333',
  energy: '#ffcc00',
  item: '#ffd700',
  door: '#446688',
  terminal: '#00ff00'
};

// Game state
const state = {
  screen: 'menu',
  deck: 1,
  maxDecks: 5,
  hp: 100,
  maxHp: 100,
  o2: 100,
  energy: 100,
  maxEnergy: 100,
  score: 0,
  kills: 0,
  itemsCollected: 0,
  flashlightOn: true,
  paused: false,
  time: 0,

  // Upgrades
  upgrades: {
    hullArmor: 0,    // +20 max HP per level
    o2Tank: 0,       // slower O2 drain
    flashlight: 0,   // wider cone
    speed: 0,        // faster movement
    damage: 0        // more damage
  },

  // Achievements
  achievements: {
    firstKill: false,
    deck2: false,
    deck5: false,
    boss: false,
    noHit: false,
    speedrun: false
  },

  // Tutorial
  tutorialStep: 0,
  showTutorial: true
};

// Player
const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  angle: 0,
  speed: 2.5,
  radius: 12,
  visionAngle: Math.PI / 2,
  visionRange: 250,
  damage: 20,
  attackCooldown: 0,
  invulnFrames: 0
};

// Arrays
let enemies = [];
let items = [];
let particles = [];
let projectiles = [];
let rooms = [];
let doors = [];

// Input
const keys = {};
const mouse = { x: WIDTH/2, y: HEIGHT/2, down: false };

// Sound system (Web Audio API)
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(freq, duration, type = 'square', volume = 0.1) {
  if (!audioCtx) return;
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
}

// Input handlers
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape') {
    if (state.screen === 'game') state.paused = !state.paused;
    else if (state.screen === 'pause') state.screen = 'game';
  }
  if (e.code === 'KeyF' && state.screen === 'game') {
    state.flashlightOn = !state.flashlightOn;
    playSound(800, 0.1);
  }
  if (e.code === 'KeyE' && state.screen === 'game') {
    interact();
  }
});
document.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
  mouse.down = true;
  initAudio();

  if (state.screen === 'menu') {
    startGame();
  } else if (state.screen === 'gameover') {
    state.screen = 'menu';
  } else if (state.screen === 'game' && player.attackCooldown <= 0) {
    attack();
  }
});

canvas.addEventListener('mouseup', () => mouse.down = false);

// Save/Load
function saveGame() {
  const saveData = {
    state: { ...state },
    player: { x: player.x, y: player.y },
    deck: state.deck
  };
  localStorage.setItem('derelict_expanded_save', JSON.stringify(saveData));
  playSound(600, 0.2, 'sine');
}

function loadGame() {
  const saved = localStorage.getItem('derelict_expanded_save');
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(state, data.state);
    player.x = data.player.x;
    player.y = data.player.y;
    generateDeck(state.deck);
    playSound(800, 0.2, 'sine');
    return true;
  }
  return false;
}

function clearSave() {
  localStorage.removeItem('derelict_expanded_save');
}

// Game functions
function startGame() {
  state.screen = 'game';
  state.deck = 1;
  state.hp = 100 + state.upgrades.hullArmor * 20;
  state.maxHp = state.hp;
  state.o2 = 100;
  state.energy = 100;
  state.score = 0;
  state.kills = 0;
  state.time = 0;
  state.tutorialStep = 0;

  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  player.speed = 2.5 + state.upgrades.speed * 0.3;
  player.damage = 20 + state.upgrades.damage * 5;
  player.visionAngle = Math.PI / 2 + state.upgrades.flashlight * 0.15;

  generateDeck(state.deck);
  playSound(200, 0.3, 'sawtooth');
}

function generateDeck(deckNum) {
  enemies = [];
  items = [];
  doors = [];
  rooms = [];

  // Generate rooms
  const roomCount = 4 + deckNum;
  for (let i = 0; i < roomCount; i++) {
    rooms.push({
      x: 100 + Math.random() * (WIDTH - 300),
      y: 100 + Math.random() * (HEIGHT - 300),
      w: 80 + Math.random() * 100,
      h: 80 + Math.random() * 100
    });
  }

  // Enemy types based on deck
  const enemyCount = 3 + deckNum * 2;
  for (let i = 0; i < enemyCount; i++) {
    const types = ['robot', 'drone'];
    if (deckNum >= 2) types.push('parasite');
    if (deckNum >= 4) types.push('hunter');

    const type = types[Math.floor(Math.random() * types.length)];
    spawnEnemy(type);
  }

  // Boss on deck 5
  if (deckNum === 5) {
    spawnEnemy('boss');
  }

  // Items
  const itemCount = 5 + deckNum;
  for (let i = 0; i < itemCount; i++) {
    const types = ['o2', 'medkit', 'energy'];
    if (Math.random() < 0.2) types.push('upgrade');

    items.push({
      x: 50 + Math.random() * (WIDTH - 100),
      y: 50 + Math.random() * (HEIGHT - 100),
      type: types[Math.floor(Math.random() * types.length)],
      collected: false
    });
  }

  // Door to next deck
  if (deckNum < state.maxDecks) {
    doors.push({
      x: WIDTH - 80,
      y: HEIGHT / 2,
      w: 40,
      h: 60,
      locked: true,
      target: deckNum + 1
    });
  }
}

function spawnEnemy(type) {
  const stats = {
    robot: { hp: 40, speed: 1.2, damage: 10, color: COLORS.enemy, radius: 14, behavior: 'patrol' },
    drone: { hp: 20, speed: 2.5, damage: 5, color: COLORS.drone, radius: 10, behavior: 'swarm' },
    parasite: { hp: 30, speed: 1.8, damage: 15, color: COLORS.parasite, radius: 12, behavior: 'ambush' },
    hunter: { hp: 60, speed: 1.5, damage: 20, color: COLORS.enemy, radius: 16, behavior: 'hunt' },
    boss: { hp: 200, speed: 1.0, damage: 30, color: COLORS.boss, radius: 30, behavior: 'boss' }
  };

  const s = stats[type];
  const angle = Math.random() * Math.PI * 2;
  const dist = 200 + Math.random() * 200;

  enemies.push({
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    type,
    hp: s.hp,
    maxHp: s.hp,
    speed: s.speed,
    damage: s.damage,
    color: s.color,
    radius: s.radius,
    behavior: s.behavior,
    state: 'idle',
    angle: Math.random() * Math.PI * 2,
    alertTimer: 0,
    attackCooldown: 0
  });
}

function attack() {
  player.attackCooldown = 30;
  playSound(150, 0.1, 'square');

  // Melee attack in front of player
  const attackRange = 40;
  const attackAngle = Math.PI / 3;

  enemies.forEach(e => {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

    if (dist < attackRange + e.radius && angleDiff < attackAngle / 2) {
      e.hp -= player.damage;
      spawnParticles(e.x, e.y, e.color, 5);
      playSound(100, 0.15, 'sawtooth');

      if (e.hp <= 0) {
        state.kills++;
        state.score += e.type === 'boss' ? 500 : 50;
        spawnParticles(e.x, e.y, e.color, 15);
        playSound(80, 0.3, 'sawtooth');

        if (!state.achievements.firstKill) {
          state.achievements.firstKill = true;
        }
        if (e.type === 'boss') {
          state.achievements.boss = true;
        }
      }
    }
  });

  // Attack visual
  spawnParticles(
    player.x + Math.cos(player.angle) * 25,
    player.y + Math.sin(player.angle) * 25,
    '#ffffff', 3
  );
}

function interact() {
  // Check doors
  doors.forEach(d => {
    const dx = d.x + d.w/2 - player.x;
    const dy = d.y + d.h/2 - player.y;
    if (Math.sqrt(dx*dx + dy*dy) < 60) {
      if (!d.locked || enemies.filter(e => e.hp > 0).length === 0) {
        d.locked = false;
        state.deck = d.target;

        if (d.target === 2) state.achievements.deck2 = true;
        if (d.target === 5) state.achievements.deck5 = true;

        generateDeck(state.deck);
        player.x = 100;
        player.y = HEIGHT / 2;
        playSound(400, 0.3, 'sine');
      } else {
        playSound(100, 0.2, 'square');
      }
    }
  });
}

function normalizeAngle(a) {
  while (a < -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 30 + Math.random() * 20,
      size: 3 + Math.random() * 3
    });
  }
}

function update() {
  if (state.screen !== 'game' || state.paused) return;

  state.time++;

  // Player movement
  let dx = 0, dy = 0;
  if (keys['KeyW'] || keys['ArrowUp']) dy -= player.speed;
  if (keys['KeyS'] || keys['ArrowDown']) dy += player.speed;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= player.speed;
  if (keys['KeyD'] || keys['ArrowRight']) dx += player.speed;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  player.x = Math.max(20, Math.min(WIDTH - 20, player.x + dx));
  player.y = Math.max(20, Math.min(HEIGHT - 20, player.y + dy));

  // Player aim
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Cooldowns
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.invulnFrames > 0) player.invulnFrames--;

  // O2 drain
  const o2DrainRate = 0.02 - state.upgrades.o2Tank * 0.003;
  state.o2 = Math.max(0, state.o2 - o2DrainRate);

  // Flashlight energy
  if (state.flashlightOn) {
    state.energy = Math.max(0, state.energy - 0.015);
    if (state.energy <= 0) state.flashlightOn = false;
  } else {
    state.energy = Math.min(state.maxEnergy, state.energy + 0.01);
  }

  // O2 damage
  if (state.o2 <= 0) {
    state.hp -= 0.1;
  }

  // Update enemies
  enemies = enemies.filter(e => {
    if (e.hp <= 0) return false;

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angleToPlayer = Math.atan2(dy, dx);

    // Check if in player's vision
    const inVision = isInVision(e.x, e.y);

    // AI behavior
    if (e.behavior === 'patrol') {
      if (dist < 200 && inVision) {
        e.state = 'chase';
      } else if (e.state === 'chase' && dist > 300) {
        e.state = 'idle';
      }
    } else if (e.behavior === 'swarm') {
      if (dist < 250) e.state = 'chase';
    } else if (e.behavior === 'ambush') {
      if (dist < 150 || inVision) e.state = 'chase';
    } else if (e.behavior === 'hunt') {
      e.state = 'chase';
    } else if (e.behavior === 'boss') {
      e.state = 'chase';
      // Boss shoots projectiles
      e.attackCooldown--;
      if (e.attackCooldown <= 0 && dist < 400) {
        e.attackCooldown = 60;
        projectiles.push({
          x: e.x, y: e.y,
          vx: Math.cos(angleToPlayer) * 4,
          vy: Math.sin(angleToPlayer) * 4,
          damage: 15,
          life: 120
        });
        playSound(200, 0.1, 'square');
      }
    }

    // Movement
    if (e.state === 'chase') {
      e.x += Math.cos(angleToPlayer) * e.speed;
      e.y += Math.sin(angleToPlayer) * e.speed;
    } else {
      // Patrol
      e.angle += (Math.random() - 0.5) * 0.1;
      e.x += Math.cos(e.angle) * e.speed * 0.3;
      e.y += Math.sin(e.angle) * e.speed * 0.3;
    }

    // Keep in bounds
    e.x = Math.max(e.radius, Math.min(WIDTH - e.radius, e.x));
    e.y = Math.max(e.radius, Math.min(HEIGHT - e.radius, e.y));

    // Attack player
    if (dist < player.radius + e.radius + 5 && player.invulnFrames <= 0) {
      state.hp -= e.damage;
      player.invulnFrames = 60;
      spawnParticles(player.x, player.y, COLORS.hp, 5);
      playSound(80, 0.2, 'sawtooth');
    }

    return true;
  });

  // Update projectiles
  projectiles = projectiles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    // Hit player
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    if (Math.sqrt(dx*dx + dy*dy) < player.radius + 5 && player.invulnFrames <= 0) {
      state.hp -= p.damage;
      player.invulnFrames = 30;
      spawnParticles(player.x, player.y, COLORS.hp, 3);
      return false;
    }

    return p.life > 0 && p.x > 0 && p.x < WIDTH && p.y > 0 && p.y < HEIGHT;
  });

  // Collect items
  items = items.filter(item => {
    if (item.collected) return false;

    const dx = player.x - item.x;
    const dy = player.y - item.y;
    if (Math.sqrt(dx*dx + dy*dy) < player.radius + 15) {
      item.collected = true;
      state.itemsCollected++;
      state.score += 10;
      playSound(600, 0.1, 'sine');

      if (item.type === 'o2') {
        state.o2 = Math.min(100, state.o2 + 30);
      } else if (item.type === 'medkit') {
        state.hp = Math.min(state.maxHp, state.hp + 25);
      } else if (item.type === 'energy') {
        state.energy = Math.min(state.maxEnergy, state.energy + 40);
      } else if (item.type === 'upgrade') {
        // Random upgrade
        const upgrades = Object.keys(state.upgrades);
        const upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        if (state.upgrades[upgrade] < 5) {
          state.upgrades[upgrade]++;
          // Apply upgrade
          if (upgrade === 'hullArmor') {
            state.maxHp += 20;
            state.hp += 20;
          } else if (upgrade === 'speed') {
            player.speed += 0.3;
          } else if (upgrade === 'damage') {
            player.damage += 5;
          } else if (upgrade === 'flashlight') {
            player.visionAngle += 0.15;
          }
        }
      }

      return false;
    }
    return true;
  });

  // Update particles
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    return p.life > 0;
  });

  // Check death
  if (state.hp <= 0) {
    state.screen = 'gameover';
    playSound(50, 0.5, 'sawtooth');
  }

  // Tutorial progression
  if (state.showTutorial && state.tutorialStep < 4) {
    if (state.tutorialStep === 0 && (dx !== 0 || dy !== 0)) state.tutorialStep = 1;
    if (state.tutorialStep === 1 && state.kills > 0) state.tutorialStep = 2;
    if (state.tutorialStep === 2 && state.itemsCollected > 0) state.tutorialStep = 3;
    if (state.tutorialStep === 3 && state.deck > 1) state.tutorialStep = 4;
  }

  // Update game state for testing
  window.gameState = {
    screen: state.screen,
    hp: Math.floor(state.hp),
    o2: Math.floor(state.o2),
    deck: state.deck,
    score: state.score,
    kills: state.kills,
    enemies: enemies.length
  };
}

function isInVision(x, y) {
  if (!state.flashlightOn) return false;

  const dx = x - player.x;
  const dy = y - player.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx);
  const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

  return dist < player.visionRange && angleDiff < player.visionAngle / 2;
}

function render() {
  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (state.screen === 'menu') {
    renderMenu();
  } else if (state.screen === 'game') {
    renderGame();
  } else if (state.screen === 'gameover') {
    renderGameOver();
  }
}

function renderMenu() {
  // Background grid
  ctx.strokeStyle = COLORS.floor;
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

  // Title glow
  ctx.fillStyle = COLORS.playerGlow;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.ellipse(WIDTH/2, 180, 300, 100, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 56px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('DERELICT', WIDTH/2 + 3, 173);

  ctx.fillStyle = COLORS.playerGlow;
  ctx.fillText('DERELICT', WIDTH/2, 170);

  ctx.fillStyle = COLORS.enemy;
  ctx.font = '24px Share Tech Mono';
  ctx.fillText('EXPANDED EDITION', WIDTH/2, 210);

  // Menu options
  ctx.fillStyle = '#888';
  ctx.font = '20px Share Tech Mono';
  ctx.fillText('[ CLICK TO START NEW GAME ]', WIDTH/2, 350);

  // Check for save
  if (localStorage.getItem('derelict_expanded_save')) {
    ctx.fillText('[ PRESS L TO LOAD GAME ]', WIDTH/2, 390);
  }

  ctx.fillText('[ PRESS H FOR HELP ]', WIDTH/2, 430);

  // Controls
  ctx.fillStyle = '#555';
  ctx.font = '16px Share Tech Mono';
  ctx.fillText('WASD - Move | Mouse - Aim | Click - Attack | F - Flashlight | E - Interact', WIDTH/2, 550);

  // Achievements
  const achieved = Object.values(state.achievements).filter(a => a).length;
  ctx.fillText(`Achievements: ${achieved}/${Object.keys(state.achievements).length}`, WIDTH/2, 600);

  // Handle L key for load
  if (keys['KeyL']) {
    if (loadGame()) {
      state.screen = 'game';
    }
  }
}

function renderGame() {
  // Fog of war (dark base)
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw floor grid
  ctx.strokeStyle = COLORS.floorLight;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
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
  ctx.globalAlpha = 1;

  // Draw rooms
  rooms.forEach(r => {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 3;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });

  // Vision cone (flashlight)
  if (state.flashlightOn && state.energy > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, player.visionRange,
      player.angle - player.visionAngle/2,
      player.angle + player.visionAngle/2);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(
      player.x, player.y, 0,
      player.x, player.y, player.visionRange
    );
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  // Draw items
  items.forEach(item => {
    if (item.collected) return;

    const colors = {
      o2: COLORS.o2,
      medkit: COLORS.hp,
      energy: COLORS.energy,
      upgrade: COLORS.item
    };

    // Glow
    ctx.fillStyle = colors[item.type];
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Item
    ctx.fillStyle = colors[item.type];
    ctx.beginPath();
    ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw doors
  doors.forEach(d => {
    ctx.fillStyle = d.locked ? '#663333' : COLORS.door;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = d.locked ? '#ff3333' : '#88ffaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText(d.locked ? 'LOCKED' : 'DECK ' + d.target, d.x + d.w/2, d.y + d.h/2 + 4);
  });

  // Draw enemies
  enemies.forEach(e => {
    // Only draw if in vision or close
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const inVision = isInVision(e.x, e.y);

    if (inVision || dist < 50) {
      // Glow
      ctx.fillStyle = e.color;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Body
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(e.x - 4, e.y - 3, 3, 0, Math.PI * 2);
      ctx.arc(e.x + 4, e.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      if (e.hp < e.maxHp) {
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - 15, e.y - e.radius - 10, 30, 4);
        ctx.fillStyle = COLORS.hp;
        ctx.fillRect(e.x - 15, e.y - e.radius - 10, 30 * (e.hp / e.maxHp), 4);
      }
    } else {
      // Red dot in darkness
      ctx.fillStyle = e.color;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  // Draw projectiles
  projectiles.forEach(p => {
    ctx.fillStyle = COLORS.enemy;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 50;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Draw player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Glow
  if (player.invulnFrames > 0) {
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Body
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Direction indicator
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(player.radius + 5, 0);
  ctx.lineTo(player.radius - 5, -5);
  ctx.lineTo(player.radius - 5, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // HUD
  renderHUD();

  // Tutorial
  if (state.showTutorial && state.tutorialStep < 4) {
    renderTutorial();
  }

  // Pause overlay
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLORS.playerGlow;
    ctx.font = 'bold 48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2 - 50);

    ctx.fillStyle = '#888';
    ctx.font = '20px Share Tech Mono';
    ctx.fillText('Press ESC to resume', WIDTH/2, HEIGHT/2 + 20);
    ctx.fillText('Press S to save game', WIDTH/2, HEIGHT/2 + 50);

    if (keys['KeyS']) {
      saveGame();
    }
  }
}

function renderHUD() {
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 10, 250, 100);
  ctx.fillRect(WIDTH - 160, 10, 150, 80);

  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(60, 20, 150, 18);
  ctx.fillStyle = COLORS.hp;
  ctx.fillRect(60, 20, 150 * (state.hp / state.maxHp), 18);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Share Tech Mono';
  ctx.textAlign = 'left';
  ctx.fillText('HP', 20, 33);
  ctx.fillText(`${Math.floor(state.hp)}/${state.maxHp}`, 215, 33);

  // O2 bar
  ctx.fillStyle = '#333';
  ctx.fillRect(60, 45, 150, 14);
  ctx.fillStyle = COLORS.o2;
  ctx.fillRect(60, 45, 150 * (state.o2 / 100), 14);
  ctx.fillStyle = '#fff';
  ctx.fillText('O2', 20, 56);

  // Energy bar
  ctx.fillStyle = '#333';
  ctx.fillRect(60, 65, 150, 14);
  ctx.fillStyle = COLORS.energy;
  ctx.fillRect(60, 65, 150 * (state.energy / state.maxEnergy), 14);
  ctx.fillStyle = '#fff';
  ctx.fillText('EN', 20, 76);

  // Flashlight indicator
  ctx.fillStyle = state.flashlightOn ? COLORS.energy : '#333';
  ctx.fillText('[F] Light: ' + (state.flashlightOn ? 'ON' : 'OFF'), 20, 100);

  // Right side - Deck and Score
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.playerGlow;
  ctx.font = '18px Orbitron';
  ctx.fillText('DECK ' + state.deck + '/' + state.maxDecks, WIDTH - 20, 35);

  ctx.fillStyle = COLORS.item;
  ctx.font = '16px Share Tech Mono';
  ctx.fillText('Score: ' + state.score, WIDTH - 20, 60);

  ctx.fillStyle = COLORS.enemy;
  ctx.fillText('Kills: ' + state.kills, WIDTH - 20, 80);
}

function renderTutorial() {
  const tutorials = [
    'Use WASD to move around the ship',
    'Click to attack enemies in front of you',
    'Collect O2 canisters and medkits to survive',
    'Clear all enemies to unlock the door to the next deck'
  ];

  ctx.fillStyle = 'rgba(0, 100, 150, 0.8)';
  ctx.fillRect(WIDTH/2 - 250, HEIGHT - 80, 500, 50);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Share Tech Mono';
  ctx.textAlign = 'center';
  ctx.fillText(tutorials[state.tutorialStep], WIDTH/2, HEIGHT - 50);

  ctx.fillStyle = '#888';
  ctx.font = '12px Share Tech Mono';
  ctx.fillText('Press T to hide tutorial', WIDTH/2, HEIGHT - 30);

  if (keys['KeyT']) {
    state.showTutorial = false;
  }
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.hp;
  ctx.font = 'bold 56px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('SIGNAL LOST', WIDTH/2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Share Tech Mono';
  ctx.fillText('Final Score: ' + state.score, WIDTH/2, 300);
  ctx.fillText('Decks Explored: ' + state.deck + '/' + state.maxDecks, WIDTH/2, 340);
  ctx.fillText('Enemies Eliminated: ' + state.kills, WIDTH/2, 380);

  // Achievements unlocked
  const newAchievements = [];
  if (state.achievements.firstKill) newAchievements.push('First Blood');
  if (state.achievements.deck2) newAchievements.push('Deeper');
  if (state.achievements.deck5) newAchievements.push('The Bottom');
  if (state.achievements.boss) newAchievements.push('Boss Slayer');

  if (newAchievements.length > 0) {
    ctx.fillStyle = COLORS.item;
    ctx.fillText('Achievements: ' + newAchievements.join(', '), WIDTH/2, 440);
  }

  ctx.fillStyle = '#888';
  ctx.font = '20px Share Tech Mono';
  ctx.fillText('[ CLICK TO RETURN TO MENU ]', WIDTH/2, 550);
}

// Game loop
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Initialize
window.gameState = state;
gameLoop();
console.log('Derelict Ship Expanded loaded');
