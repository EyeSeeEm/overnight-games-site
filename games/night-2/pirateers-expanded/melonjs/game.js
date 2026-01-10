// Pirateers - Expanded Edition
// Naval combat with multiple seas, ship upgrades, save/load

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024;
const HEIGHT = 768;

// Sea color palette
const COLORS = {
  deepSea: '#0a1628',
  sea: '#0d4a6f',
  seaLight: '#1a6a9f',
  foam: '#8bc4e8',
  playerHull: '#8b4513',
  playerSail: '#ffffff',
  enemy: '#333333',
  merchant: '#c4a87c',
  navy: '#1a3a6e',
  ghost: '#33aa77',
  kraken: '#663399',
  gold: '#ffd700',
  cannonball: '#222222',
  fire: '#ff6600',
  smoke: '#444444',
  health: '#cc3333',
  healthBg: '#333333',
  wood: '#654321',
  text: '#ffffff'
};

// Sea regions
const SEAS = {
  caribbean: { name: 'Caribbean', color: '#1a6a9f', enemyTypes: ['pirate', 'merchant'], difficulty: 1 },
  atlantic: { name: 'Atlantic', color: '#0d4a6f', enemyTypes: ['pirate', 'merchant', 'navy'], difficulty: 2 },
  mediterranean: { name: 'Mediterranean', color: '#2a7aaf', enemyTypes: ['navy', 'merchant', 'ghost'], difficulty: 3 },
  pacific: { name: 'Pacific', color: '#0a3a5f', enemyTypes: ['pirate', 'ghost', 'kraken'], difficulty: 4 },
  arctic: { name: 'Arctic', color: '#2a5a7f', enemyTypes: ['ghost', 'kraken', 'navy'], difficulty: 5 }
};

// Ship types
const SHIPS = {
  sloop: { name: 'Sloop', hp: 80, speed: 4, cannons: 2, cargo: 50, cost: 0 },
  brigantine: { name: 'Brigantine', hp: 120, speed: 3.5, cannons: 4, cargo: 100, cost: 500 },
  frigate: { name: 'Frigate', hp: 180, speed: 3, cannons: 8, cargo: 150, cost: 1500 },
  galleon: { name: 'Galleon', hp: 250, speed: 2.5, cannons: 12, cargo: 300, cost: 3500 },
  manOWar: { name: "Man O' War", hp: 400, speed: 2, cannons: 20, cargo: 200, cost: 8000 }
};

// Enemy definitions
const ENEMIES = {
  pirate: { hp: 60, speed: 2.5, damage: 15, gold: 50, behavior: 'aggressive' },
  merchant: { hp: 40, speed: 2, damage: 5, gold: 100, behavior: 'flee' },
  navy: { hp: 100, speed: 2.2, damage: 20, gold: 75, behavior: 'patrol' },
  ghost: { hp: 80, speed: 3, damage: 25, gold: 150, behavior: 'phase' },
  kraken: { hp: 300, speed: 1.5, damage: 50, gold: 500, behavior: 'boss' }
};

// Game state
const state = {
  screen: 'menu',
  sea: 'caribbean',
  hp: 80,
  maxHp: 80,
  gold: 100,
  ammo: 30,
  maxAmmo: 50,
  cargo: 0,
  maxCargo: 50,
  score: 0,
  kills: 0,
  ship: 'sloop',
  paused: false,
  time: 0,
  waveNumber: 0,

  // Upgrades
  upgrades: {
    hull: 0,      // +20% HP
    cannons: 0,   // +15% damage
    sails: 0,     // +10% speed
    cargo: 0,     // +25% cargo
    reload: 0     // -10% reload time
  },

  // Unlocked ships
  ships: {
    sloop: true,
    brigantine: false,
    frigate: false,
    galleon: false,
    manOWar: false
  },

  // Achievements
  achievements: {
    firstSink: false,
    reachAtlantic: false,
    reachArctic: false,
    krakenSlayer: false,
    richPirate: false,
    fleetDestroyer: false
  },

  tutorialStep: 0,
  showTutorial: true
};

// Player ship
const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  angle: -Math.PI / 2,
  speed: 0,
  maxSpeed: 4,
  turnSpeed: 0.04,
  radius: 25,
  fireCooldown: 0,
  invulnFrames: 0
};

// Arrays
let enemies = [];
let cannonballs = [];
let enemyCannonballs = [];
let particles = [];
let flotsam = [];
let islands = [];

// Input
const keys = {};
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Wave animation
let waveOffset = 0;

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
    case 'cannon':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      break;
    case 'hit':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(volume * 0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      break;
    case 'sink':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
      break;
    case 'gold':
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      break;
    case 'wave':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume * 0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
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
  if (e.key.toLowerCase() === 'e' && state.screen === 'playing') {
    checkPortDocking();
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
    if (y > 320 && y < 370) startNewGame();
    else if (y > 380 && y < 430) loadGame();
    else if (y > 440 && y < 490) state.screen = 'shipyard';
    else if (y > 500 && y < 550) state.screen = 'seaSelect';
  } else if (state.screen === 'port') {
    handlePortClick();
  } else if (state.screen === 'shipyard') {
    handleShipyardClick();
  } else if (state.screen === 'seaSelect') {
    handleSeaSelectClick();
  } else if (state.screen === 'gameover') {
    state.screen = 'menu';
  } else if (state.screen === 'victory') {
    state.screen = 'menu';
  }
}

function startNewGame() {
  const shipStats = SHIPS[state.ship];
  const hullBonus = 1 + state.upgrades.hull * 0.2;

  state.screen = 'playing';
  state.hp = Math.floor(shipStats.hp * hullBonus);
  state.maxHp = Math.floor(shipStats.hp * hullBonus);
  state.ammo = 30;
  state.cargo = 0;
  state.maxCargo = Math.floor(shipStats.cargo * (1 + state.upgrades.cargo * 0.25));
  state.score = 0;
  state.kills = 0;
  state.waveNumber = 0;
  state.time = 0;

  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  player.angle = -Math.PI / 2;
  player.maxSpeed = shipStats.speed * (1 + state.upgrades.sails * 0.1);
  player.invulnFrames = 0;

  enemies = [];
  cannonballs = [];
  enemyCannonballs = [];
  particles = [];
  flotsam = [];

  generateIslands();
  spawnWave();
}

function generateIslands() {
  islands = [];
  const numIslands = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numIslands; i++) {
    islands.push({
      x: 100 + Math.random() * (WIDTH - 200),
      y: 100 + Math.random() * (HEIGHT - 200),
      radius: 30 + Math.random() * 50,
      isPort: i === 0
    });
  }
}

function spawnWave() {
  state.waveNumber++;
  const seaData = SEAS[state.sea];
  const numEnemies = 2 + state.waveNumber + seaData.difficulty;

  for (let i = 0; i < numEnemies; i++) {
    const type = seaData.enemyTypes[Math.floor(Math.random() * seaData.enemyTypes.length)];
    const stats = ENEMIES[type];

    let x, y;
    do {
      x = 50 + Math.random() * (WIDTH - 100);
      y = 50 + Math.random() * (HEIGHT - 100);
    } while (Math.hypot(x - player.x, y - player.y) < 250);

    enemies.push({
      x, y,
      type,
      hp: stats.hp * seaData.difficulty,
      maxHp: stats.hp * seaData.difficulty,
      speed: stats.speed,
      damage: stats.damage * seaData.difficulty,
      gold: stats.gold * seaData.difficulty,
      behavior: stats.behavior,
      angle: Math.random() * Math.PI * 2,
      fireCooldown: 0,
      phaseTimer: 0,
      visible: true
    });
  }
}

function checkPortDocking() {
  for (const island of islands) {
    if (island.isPort && Math.hypot(player.x - island.x, player.y - island.y) < island.radius + 50) {
      state.screen = 'port';
      return;
    }
  }
}

function fireCannon() {
  if (player.fireCooldown > 0 || state.ammo <= 0) return;

  const shipStats = SHIPS[state.ship];
  const reloadBonus = 1 - state.upgrades.reload * 0.1;
  player.fireCooldown = 500 * reloadBonus;
  state.ammo--;

  playSound('cannon');

  // Fire broadside (both sides)
  const numCannons = shipStats.cannons;
  const damageBonus = 1 + state.upgrades.cannons * 0.15;

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < numCannons / 2; i++) {
      const offsetAngle = player.angle + side * Math.PI / 2;
      const offsetDist = -15 + i * 10;

      cannonballs.push({
        x: player.x + Math.cos(player.angle) * offsetDist + Math.cos(offsetAngle) * 20,
        y: player.y + Math.sin(player.angle) * offsetDist + Math.sin(offsetAngle) * 20,
        vx: Math.cos(offsetAngle) * 8,
        vy: Math.sin(offsetAngle) * 8,
        damage: 15 * damageBonus
      });
    }
  }

  // Smoke particles
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 30,
      color: COLORS.smoke,
      size: 8
    });
  }
}

function update(dt) {
  if (state.screen !== 'playing' || state.paused) return;

  state.time += dt;
  waveOffset += dt * 0.001;

  // Player movement
  if (keys['w'] || keys['arrowup']) {
    player.speed = Math.min(player.maxSpeed, player.speed + 0.1);
  } else {
    player.speed = Math.max(0, player.speed - 0.02);
  }

  if (keys['s'] || keys['arrowdown']) {
    player.speed = Math.max(-player.maxSpeed / 2, player.speed - 0.1);
  }

  if (keys['a'] || keys['arrowleft']) {
    player.angle -= player.turnSpeed * (0.5 + player.speed / player.maxSpeed * 0.5);
  }
  if (keys['d'] || keys['arrowright']) {
    player.angle += player.turnSpeed * (0.5 + player.speed / player.maxSpeed * 0.5);
  }

  player.x += Math.cos(player.angle) * player.speed;
  player.y += Math.sin(player.angle) * player.speed;

  // Bounds
  player.x = Math.max(player.radius, Math.min(WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(HEIGHT - player.radius, player.y));

  // Island collision
  for (const island of islands) {
    const dist = Math.hypot(player.x - island.x, player.y - island.y);
    if (dist < player.radius + island.radius) {
      const angle = Math.atan2(player.y - island.y, player.x - island.x);
      player.x = island.x + Math.cos(angle) * (player.radius + island.radius + 5);
      player.y = island.y + Math.sin(angle) * (player.radius + island.radius + 5);
      player.speed *= 0.5;
    }
  }

  // Cooldowns
  if (player.fireCooldown > 0) player.fireCooldown -= dt;
  if (player.invulnFrames > 0) player.invulnFrames -= dt;

  // Shooting
  if (mouse.down) {
    fireCannon();
  }

  // Update cannonballs
  for (let i = cannonballs.length - 1; i >= 0; i--) {
    const b = cannonballs[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.05; // Gravity arc

    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      // Splash
      for (let j = 0; j < 5; j++) {
        particles.push({
          x: b.x, y: b.y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          life: 20,
          color: COLORS.foam,
          size: 4
        });
      }
      cannonballs.splice(i, 1);
      continue;
    }

    // Enemy collision
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (!e.visible) continue;

      if (Math.hypot(b.x - e.x, b.y - e.y) < 30) {
        e.hp -= b.damage;
        playSound('hit');

        // Hit particles
        for (let k = 0; k < 8; k++) {
          particles.push({
            x: b.x, y: b.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 25,
            color: COLORS.wood,
            size: 4
          });
        }

        if (e.hp <= 0) {
          sinkEnemy(e, j);
        }

        cannonballs.splice(i, 1);
        break;
      }
    }
  }

  // Update enemy cannonballs
  for (let i = enemyCannonballs.length - 1; i >= 0; i--) {
    const b = enemyCannonballs[i];
    b.x += b.vx;
    b.y += b.vy;

    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      enemyCannonballs.splice(i, 1);
      continue;
    }

    // Player collision
    if (player.invulnFrames <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < player.radius) {
      takeDamage(b.damage);
      enemyCannonballs.splice(i, 1);
    }
  }

  // Update enemies
  for (const e of enemies) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    const angleToPlayer = Math.atan2(dy, dx);

    e.fireCooldown -= dt;

    switch (e.behavior) {
      case 'aggressive':
        // Chase and attack
        if (dist > 100) {
          e.angle = angleToPlayer;
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
        }
        if (e.fireCooldown <= 0 && dist < 300) {
          fireEnemyCannon(e);
        }
        break;

      case 'flee':
        // Run away
        e.angle = angleToPlayer + Math.PI;
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        break;

      case 'patrol':
        // Circle and attack
        e.angle += 0.01;
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        if (e.fireCooldown <= 0 && dist < 350) {
          fireEnemyCannon(e);
        }
        break;

      case 'phase':
        // Ghost ship - phases in and out
        e.phaseTimer += dt;
        e.visible = Math.sin(e.phaseTimer * 0.002) > 0;
        if (e.visible) {
          e.angle = angleToPlayer;
          e.x += Math.cos(e.angle) * e.speed;
          e.y += Math.sin(e.angle) * e.speed;
          if (e.fireCooldown <= 0 && dist < 250) {
            fireEnemyCannon(e);
          }
        }
        break;

      case 'boss':
        // Kraken - slow but deadly
        e.angle = angleToPlayer;
        e.x += Math.cos(e.angle) * e.speed;
        e.y += Math.sin(e.angle) * e.speed;
        if (e.fireCooldown <= 0) {
          // Tentacle attack (multiple shots)
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            enemyCannonballs.push({
              x: e.x + Math.cos(angle) * 30,
              y: e.y + Math.sin(angle) * 30,
              vx: Math.cos(angle) * 4,
              vy: Math.sin(angle) * 4,
              damage: e.damage
            });
          }
          e.fireCooldown = 2000;
        }
        // Contact damage
        if (dist < 50 && player.invulnFrames <= 0) {
          takeDamage(e.damage);
        }
        break;
    }

    // Keep in bounds
    e.x = Math.max(30, Math.min(WIDTH - 30, e.x));
    e.y = Math.max(30, Math.min(HEIGHT - 30, e.y));
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

  // Update flotsam (collectibles)
  for (let i = flotsam.length - 1; i >= 0; i--) {
    const f = flotsam[i];
    f.time += dt;

    if (Math.hypot(f.x - player.x, f.y - player.y) < 40) {
      if (f.type === 'gold') {
        state.gold += f.value;
        playSound('gold');
      } else if (f.type === 'ammo') {
        state.ammo = Math.min(state.maxAmmo, state.ammo + 10);
        playSound('gold');
      } else if (f.type === 'cargo') {
        state.cargo = Math.min(state.maxCargo, state.cargo + f.value);
        playSound('gold');
      }
      flotsam.splice(i, 1);
    } else if (f.time > 15000) {
      flotsam.splice(i, 1);
    }
  }

  // Wave completion
  if (enemies.length === 0) {
    if (state.waveNumber >= 5) {
      // Sea completed
      advanceToNextSea();
    } else {
      spawnWave();
    }
  }

  // Check achievements
  if (state.gold >= 10000 && !state.achievements.richPirate) {
    state.achievements.richPirate = true;
  }
  if (state.kills >= 50 && !state.achievements.fleetDestroyer) {
    state.achievements.fleetDestroyer = true;
  }

  // Tutorial
  if (state.showTutorial && state.tutorialStep < 4) {
    if (state.tutorialStep === 0 && player.speed > 0) state.tutorialStep = 1;
    if (state.tutorialStep === 1 && cannonballs.length > 0) state.tutorialStep = 2;
    if (state.tutorialStep === 2 && state.kills > 0) state.tutorialStep = 3;
    if (state.tutorialStep === 3) {
      setTimeout(() => { state.showTutorial = false; }, 3000);
    }
  }
}

function fireEnemyCannon(e) {
  const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
  enemyCannonballs.push({
    x: e.x,
    y: e.y,
    vx: Math.cos(angleToPlayer) * 5,
    vy: Math.sin(angleToPlayer) * 5,
    damage: e.damage
  });
  e.fireCooldown = 1500;
}

function sinkEnemy(e, index) {
  playSound('sink');

  // Explosion particles
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: e.x, y: e.y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 40,
      color: i % 2 === 0 ? COLORS.fire : COLORS.wood,
      size: 6
    });
  }

  // Drop loot
  flotsam.push({ x: e.x, y: e.y, type: 'gold', value: e.gold, time: 0 });
  if (Math.random() < 0.3) {
    flotsam.push({ x: e.x + 20, y: e.y, type: 'ammo', value: 10, time: 0 });
  }
  if (Math.random() < 0.2) {
    flotsam.push({ x: e.x - 20, y: e.y, type: 'cargo', value: 20, time: 0 });
  }

  state.score += e.gold;
  state.kills++;

  // Achievements
  if (!state.achievements.firstSink) state.achievements.firstSink = true;
  if (e.type === 'kraken' && !state.achievements.krakenSlayer) {
    state.achievements.krakenSlayer = true;
  }

  enemies.splice(index, 1);
}

function takeDamage(amount) {
  state.hp -= amount;
  player.invulnFrames = 1000;
  playSound('hit');

  // Damage particles
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: player.x, y: player.y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 20,
      color: COLORS.wood,
      size: 5
    });
  }

  if (state.hp <= 0) {
    state.hp = 0;
    state.screen = 'gameover';
    saveGame();
  }
}

function advanceToNextSea() {
  const seaOrder = ['caribbean', 'atlantic', 'mediterranean', 'pacific', 'arctic'];
  const currentIndex = seaOrder.indexOf(state.sea);

  if (currentIndex < seaOrder.length - 1) {
    state.sea = seaOrder[currentIndex + 1];

    // Achievements
    if (state.sea === 'atlantic') state.achievements.reachAtlantic = true;
    if (state.sea === 'arctic') state.achievements.reachArctic = true;

    state.waveNumber = 0;
    generateIslands();
    spawnWave();
    saveGame();
  } else {
    state.screen = 'victory';
    saveGame();
  }
}

function handlePortClick() {
  const options = [
    { label: 'Repair Ship (50 gold)', y: 250, action: () => {
      if (state.gold >= 50) { state.gold -= 50; state.hp = state.maxHp; }
    }},
    { label: 'Buy Ammo (25 gold)', y: 310, action: () => {
      if (state.gold >= 25) { state.gold -= 25; state.ammo = state.maxAmmo; }
    }},
    { label: 'Sell Cargo', y: 370, action: () => {
      state.gold += state.cargo * 2;
      state.cargo = 0;
    }},
    { label: 'Set Sail', y: 500, action: () => { state.screen = 'playing'; }}
  ];

  for (const opt of options) {
    if (mouse.y > opt.y - 25 && mouse.y < opt.y + 25) {
      opt.action();
      playSound('gold');
      break;
    }
  }
}

function handleShipyardClick() {
  const shipList = Object.keys(SHIPS);
  for (let i = 0; i < shipList.length; i++) {
    const y = 200 + i * 60;
    if (mouse.y > y && mouse.y < y + 50) {
      const shipKey = shipList[i];
      const ship = SHIPS[shipKey];
      if (state.ships[shipKey]) {
        state.ship = shipKey;
        playSound('gold');
      } else if (state.gold >= ship.cost) {
        state.gold -= ship.cost;
        state.ships[shipKey] = true;
        state.ship = shipKey;
        playSound('gold');
        saveGame();
      }
    }
  }

  // Back
  if (mouse.y > 550 && mouse.y < 600) {
    state.screen = 'menu';
  }
}

function handleSeaSelectClick() {
  const seaList = Object.keys(SEAS);
  for (let i = 0; i < seaList.length; i++) {
    const y = 200 + i * 60;
    if (mouse.y > y && mouse.y < y + 50) {
      state.sea = seaList[i];
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
    gold: state.gold,
    upgrades: state.upgrades,
    ships: state.ships,
    ship: state.ship,
    achievements: state.achievements,
    highScore: Math.max(state.score, parseInt(localStorage.getItem('pirateers_highscore') || '0'))
  };
  localStorage.setItem('pirateers_expanded_save', JSON.stringify(saveData));
  localStorage.setItem('pirateers_highscore', saveData.highScore.toString());
}

function loadGame() {
  const saved = localStorage.getItem('pirateers_expanded_save');
  if (saved) {
    const data = JSON.parse(saved);
    state.gold = data.gold || 100;
    state.upgrades = data.upgrades || state.upgrades;
    state.ships = data.ships || state.ships;
    state.ship = data.ship || 'sloop';
    state.achievements = data.achievements || state.achievements;
  }
  startNewGame();
}

// Rendering
function render() {
  ctx.fillStyle = SEAS[state.sea]?.color || COLORS.deepSea;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (state.screen) {
    case 'menu': renderMenu(); break;
    case 'playing':
      renderGame();
      if (state.paused) renderPauseOverlay();
      break;
    case 'port': renderPort(); break;
    case 'shipyard': renderShipyard(); break;
    case 'seaSelect': renderSeaSelect(); break;
    case 'gameover': renderGameOver(); break;
    case 'victory': renderVictory(); break;
  }
}

function renderMenu() {
  // Animated waves
  for (let layer = 0; layer < 5; layer++) {
    const y = 450 + layer * 70;
    ctx.fillStyle = `rgba(13, 74, 111, ${0.3 - layer * 0.05})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= WIDTH; x += 10) {
      const waveY = y + Math.sin(x * 0.02 + waveOffset * (1 + layer * 0.3) + layer) * (10 - layer * 2);
      ctx.lineTo(x, waveY);
    }
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // Title glow
  const gradient = ctx.createRadialGradient(WIDTH/2, 150, 0, WIDTH/2, 150, 250);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, 350);

  // Title
  ctx.fillStyle = '#000';
  ctx.font = 'bold 96px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('PIRATEERS', WIDTH/2 + 4, 154);
  ctx.fillStyle = COLORS.gold;
  ctx.fillText('PIRATEERS', WIDTH/2, 150);

  // Subtitle
  ctx.fillStyle = '#88aacc';
  ctx.font = '28px Cinzel';
  ctx.fillText('EXPANDED EDITION', WIDTH/2, 200);

  // Menu items
  const menuItems = ['[ NEW VOYAGE ]', '[ CONTINUE ]', '[ SHIPYARD ]', '[ SELECT SEA ]'];
  ctx.font = '28px Pirata One';
  for (let i = 0; i < menuItems.length; i++) {
    const y = 340 + i * 60;
    const hover = mouse.y > y - 30 && mouse.y < y + 10;
    ctx.fillStyle = hover ? COLORS.gold : COLORS.text;
    ctx.fillText(menuItems[i], WIDTH/2, y);
  }

  // Stats
  const highScore = localStorage.getItem('pirateers_highscore') || '0';
  ctx.fillStyle = '#668899';
  ctx.font = '18px Cinzel';
  ctx.fillText(`High Score: ${highScore}  |  Gold: ${state.gold}`, WIDTH/2, 620);

  // Controls
  ctx.font = '14px Cinzel';
  ctx.fillText('WASD - Sail | Click - Fire Broadsides | E - Dock at Port', WIDTH/2, 700);

  // Achievement count
  const achCount = Object.values(state.achievements).filter(a => a).length;
  ctx.fillText(`Achievements: ${achCount}/6`, WIDTH/2, 730);
}

function renderGame() {
  // Draw waves pattern
  ctx.strokeStyle = 'rgba(139, 196, 232, 0.1)';
  ctx.lineWidth = 2;
  for (let y = 0; y < HEIGHT; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= WIDTH; x += 20) {
      const waveY = y + Math.sin(x * 0.03 + waveOffset + y * 0.01) * 5;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  // Islands
  for (const island of islands) {
    // Sand
    ctx.fillStyle = '#c4a87c';
    ctx.beginPath();
    ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
    ctx.fill();

    // Trees
    ctx.fillStyle = '#228833';
    for (let i = 0; i < 3; i++) {
      const tx = island.x + (Math.random() - 0.5) * island.radius;
      const ty = island.y + (Math.random() - 0.5) * island.radius;
      ctx.beginPath();
      ctx.arc(tx, ty, 10 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Port marker
    if (island.isPort) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = 'bold 20px Pirata One';
      ctx.textAlign = 'center';
      ctx.fillText('PORT', island.x, island.y - island.radius - 10);
    }
  }

  // Flotsam
  for (const f of flotsam) {
    const pulse = Math.sin(f.time * 0.005) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = f.type === 'gold' ? COLORS.gold : (f.type === 'ammo' ? '#666' : '#8b4513');
    ctx.beginPath();
    ctx.arc(f.x, f.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Enemy cannonballs
  ctx.fillStyle = COLORS.cannonball;
  for (const b of enemyCannonballs) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player cannonballs
  ctx.fillStyle = COLORS.cannonball;
  for (const b of cannonballs) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of enemies) {
    if (!e.visible) continue;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);

    // Hull
    let hullColor = COLORS.enemy;
    if (e.type === 'merchant') hullColor = COLORS.merchant;
    if (e.type === 'navy') hullColor = COLORS.navy;
    if (e.type === 'ghost') hullColor = COLORS.ghost;
    if (e.type === 'kraken') hullColor = COLORS.kraken;

    ctx.fillStyle = hullColor;
    if (e.type === 'kraken') {
      // Draw kraken as tentacles
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
        ctx.lineWidth = 8;
        ctx.strokeStyle = hullColor;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ship shape
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(-20, 15);
      ctx.lineTo(-20, -15);
      ctx.closePath();
      ctx.fill();

      // Sail
      ctx.fillStyle = e.type === 'navy' ? '#ffffff' : '#888888';
      ctx.fillRect(-5, -12, 3, 24);
    }

    ctx.restore();

    // HP bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = COLORS.healthBg;
      ctx.fillRect(e.x - 25, e.y - 40, 50, 6);
      ctx.fillStyle = COLORS.health;
      ctx.fillRect(e.x - 25, e.y - 40, 50 * (e.hp / e.maxHp), 6);
    }
  }

  // Player ship
  const playerAlpha = player.invulnFrames > 0 ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
  ctx.globalAlpha = playerAlpha;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Hull
  ctx.fillStyle = COLORS.playerHull;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(-25, 18);
  ctx.lineTo(-25, -18);
  ctx.closePath();
  ctx.fill();

  // Deck
  ctx.fillStyle = '#a0522d';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mast and sail
  ctx.fillStyle = '#654321';
  ctx.fillRect(-5, -3, 6, 6);
  ctx.fillStyle = COLORS.playerSail;
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(0, 25);
  ctx.lineTo(-15, 0);
  ctx.closePath();
  ctx.fill();

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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, 50);

  // HP bar
  ctx.fillStyle = COLORS.healthBg;
  ctx.fillRect(10, 15, 150, 20);
  ctx.fillStyle = COLORS.health;
  ctx.fillRect(10, 15, 150 * (state.hp / state.maxHp), 20);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Cinzel';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${state.hp}/${state.maxHp}`, 15, 30);

  // Ammo
  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = 'right';
  ctx.font = '18px Pirata One';
  ctx.fillText(`Ammo: ${state.ammo}`, WIDTH - 10, 32);

  // Gold and cargo
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`Gold: ${state.gold}`, WIDTH/2 - 100, 32);
  ctx.fillStyle = '#a0522d';
  ctx.fillText(`Cargo: ${state.cargo}/${state.maxCargo}`, WIDTH/2 + 100, 32);

  // Bottom bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, HEIGHT - 40, WIDTH, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Cinzel';
  ctx.textAlign = 'center';
  ctx.fillText(`${SEAS[state.sea].name}  |  Wave ${state.waveNumber}/5  |  Score: ${state.score}  |  Ship: ${SHIPS[state.ship].name}`, WIDTH/2, HEIGHT - 15);
}

function renderTutorial() {
  const messages = [
    'Use WASD to sail your ship',
    'Click to fire broadside cannons',
    'Great! Sink enemy ships',
    'Dock at PORT with E to repair and resupply'
  ];

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(WIDTH/2 - 250, HEIGHT - 120, 500, 60);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(WIDTH/2 - 250, HEIGHT - 120, 500, 60);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '20px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText(messages[state.tutorialStep], WIDTH/2, HEIGHT - 85);
}

function renderPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '64px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2 - 40);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Cinzel';
  ctx.fillText('Press ESC to resume', WIDTH/2, HEIGHT/2 + 20);
}

function renderPort() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '56px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('PORT', WIDTH/2, 100);

  ctx.fillStyle = '#88aacc';
  ctx.font = '24px Cinzel';
  ctx.fillText(`Gold: ${state.gold}  |  HP: ${state.hp}/${state.maxHp}  |  Ammo: ${state.ammo}`, WIDTH/2, 160);

  const options = [
    { label: `Repair Ship (50 gold) - HP: ${state.hp}/${state.maxHp}`, y: 250 },
    { label: `Buy Ammo (25 gold) - ${state.ammo}/${state.maxAmmo}`, y: 310 },
    { label: `Sell Cargo (${state.cargo} x 2 gold = ${state.cargo * 2})`, y: 370 },
    { label: '[ SET SAIL ]', y: 500 }
  ];

  ctx.font = '28px Pirata One';
  for (const opt of options) {
    const hover = mouse.y > opt.y - 25 && mouse.y < opt.y + 25;
    ctx.fillStyle = hover ? COLORS.gold : '#fff';
    ctx.fillText(opt.label, WIDTH/2, opt.y);
  }
}

function renderShipyard() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '56px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('SHIPYARD', WIDTH/2, 100);

  ctx.fillStyle = '#88aacc';
  ctx.font = '20px Cinzel';
  ctx.fillText(`Gold: ${state.gold}`, WIDTH/2, 150);

  const shipList = Object.keys(SHIPS);
  ctx.font = '22px Pirata One';

  for (let i = 0; i < shipList.length; i++) {
    const key = shipList[i];
    const ship = SHIPS[key];
    const y = 200 + i * 60;
    const owned = state.ships[key];
    const selected = state.ship === key;
    const hover = mouse.y > y && mouse.y < y + 50;

    ctx.fillStyle = selected ? COLORS.gold : (owned ? '#88ff88' : (hover ? '#aaaaaa' : '#666666'));
    ctx.textAlign = 'left';
    ctx.fillText(`${ship.name}`, 200, y + 30);

    ctx.textAlign = 'right';
    ctx.fillText(`HP:${ship.hp} SPD:${ship.speed} GUNS:${ship.cannons}`, 600, y + 30);

    ctx.fillStyle = owned ? '#88ff88' : '#ffaa00';
    ctx.fillText(owned ? 'OWNED' : `${ship.cost} gold`, 800, y + 30);
  }

  // Back button
  ctx.textAlign = 'center';
  ctx.fillStyle = mouse.y > 550 && mouse.y < 600 ? COLORS.gold : '#fff';
  ctx.font = '28px Pirata One';
  ctx.fillText('[ BACK ]', WIDTH/2, 580);
}

function renderSeaSelect() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '56px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('SELECT SEA', WIDTH/2, 100);

  const seaList = Object.keys(SEAS);
  ctx.font = '24px Pirata One';

  for (let i = 0; i < seaList.length; i++) {
    const key = seaList[i];
    const sea = SEAS[key];
    const y = 200 + i * 60;
    const hover = mouse.y > y && mouse.y < y + 50;

    ctx.fillStyle = hover ? COLORS.gold : '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`${sea.name}`, 250, y + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#88aacc';
    ctx.fillText(`Difficulty: ${'*'.repeat(sea.difficulty)}`, 750, y + 30);
  }

  // Back button
  ctx.textAlign = 'center';
  ctx.fillStyle = mouse.y > 550 && mouse.y < 600 ? COLORS.gold : '#fff';
  ctx.font = '28px Pirata One';
  ctx.fillText('[ BACK ]', WIDTH/2, 580);
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.health;
  ctx.font = '72px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('SHIP SUNK!', WIDTH/2, HEIGHT/2 - 100);

  ctx.fillStyle = '#fff';
  ctx.font = '28px Cinzel';
  ctx.fillText(`Final Score: ${state.score}`, WIDTH/2, HEIGHT/2);
  ctx.fillText(`Ships Destroyed: ${state.kills}`, WIDTH/2, HEIGHT/2 + 50);
  ctx.fillText(`Gold Collected: ${state.gold}`, WIDTH/2, HEIGHT/2 + 100);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '28px Pirata One';
  ctx.fillText('[ CLICK TO CONTINUE ]', WIDTH/2, HEIGHT/2 + 180);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '72px Pirata One';
  ctx.textAlign = 'center';
  ctx.fillText('LEGENDARY CAPTAIN!', WIDTH/2, HEIGHT/2 - 100);

  ctx.fillStyle = '#fff';
  ctx.font = '28px Cinzel';
  ctx.fillText('You conquered all the seas!', WIDTH/2, HEIGHT/2 - 30);
  ctx.fillText(`Final Score: ${state.score}`, WIDTH/2, HEIGHT/2 + 30);
  ctx.fillText(`Total Gold: ${state.gold}`, WIDTH/2, HEIGHT/2 + 80);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '28px Pirata One';
  ctx.fillText('[ CLICK TO CONTINUE ]', WIDTH/2, HEIGHT/2 + 180);
}

// Game loop
let lastTime = 0;
function gameLoop(time) {
  const dt = time - lastTime;
  lastTime = time;

  waveOffset += 0.01;
  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// Load saved data
const saved = localStorage.getItem('pirateers_expanded_save');
if (saved) {
  const data = JSON.parse(saved);
  state.gold = data.gold || 100;
  state.upgrades = data.upgrades || state.upgrades;
  state.ships = data.ships || state.ships;
  state.ship = data.ship || 'sloop';
  state.achievements = data.achievements || state.achievements;
}

// Start
requestAnimationFrame(gameLoop);
