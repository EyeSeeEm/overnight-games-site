// Caribbean Admiral - Expanded Edition
// Turn-based naval combat with progression, crews, and more ships

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1024;
const HEIGHT = 768;

// ============================================
// AUDIO SYSTEM
// ============================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx || !game.settings.soundOn) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const t = audioCtx.currentTime;
  switch(type) {
    case 'cannon':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
      break;
    case 'hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
      break;
    case 'sink':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
      break;
    case 'buy':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
      break;
    case 'menu':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
      break;
    case 'victory':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.setValueAtTime(500, t + 0.1);
      osc.frequency.setValueAtTime(600, t + 0.2);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
      break;
  }
}

let musicOsc = null;
let musicGain = null;
function startMusic() {
  if (!audioCtx || musicOsc || !game.settings.musicOn) return;
  musicOsc = audioCtx.createOscillator();
  musicGain = audioCtx.createGain();
  musicOsc.connect(musicGain);
  musicGain.connect(audioCtx.destination);
  musicOsc.type = 'sine';
  musicOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  musicGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  musicOsc.start();
}

function stopMusic() {
  if (musicOsc) {
    musicOsc.stop();
    musicOsc = null;
  }
}

// ============================================
// COLORS
// ============================================
const COLORS = {
  ocean: '#0a1628',
  oceanLight: '#1a2838',
  gold: '#ffd700',
  white: '#ffffff',
  red: '#ff4444',
  green: '#44ff44',
  blue: '#4488ff',
  purple: '#8844ff',
  orange: '#ff8844',
  cyan: '#44ffff'
};

// ============================================
// SHIP TYPES (EXPANDED - 12 types)
// ============================================
const SHIP_TYPES = {
  // Basic
  dinghy: { name: 'Dinghy', hull: 40, ap: 30, damage: 8, accuracy: 50, cost: 100, color: '#6a8', tier: 0 },
  sloop: { name: 'Sloop', hull: 100, ap: 50, damage: 15, accuracy: 65, cost: 500, color: '#4a8', tier: 1 },
  cutter: { name: 'Cutter', hull: 80, ap: 70, damage: 12, accuracy: 75, cost: 800, color: '#5b9', tier: 1 },

  // Intermediate
  brigantine: { name: 'Brigantine', hull: 220, ap: 70, damage: 32, accuracy: 70, cost: 4000, color: '#68a', tier: 2 },
  corvette: { name: 'Corvette', hull: 180, ap: 90, damage: 25, accuracy: 80, cost: 5000, color: '#79b', tier: 2 },
  brig: { name: 'Brig', hull: 300, ap: 60, damage: 40, accuracy: 68, cost: 8000, color: '#8ac', tier: 2 },

  // Advanced
  frigate: { name: 'Frigate', hull: 550, ap: 100, damage: 80, accuracy: 78, cost: 30000, color: '#86a', tier: 3 },
  manOWar: { name: 'Man-O-War', hull: 800, ap: 80, damage: 100, accuracy: 72, cost: 45000, color: '#97b', tier: 3 },
  galleon: { name: 'Galleon', hull: 700, ap: 90, damage: 95, accuracy: 72, cost: 50000, color: '#a68', tier: 3 },

  // Legendary
  flagship: { name: 'Flagship', hull: 1200, ap: 120, damage: 150, accuracy: 85, cost: 150000, color: '#fc0', tier: 4 },
  leviathan: { name: 'Leviathan', hull: 2000, ap: 100, damage: 200, accuracy: 75, cost: 300000, color: '#f80', tier: 4 },

  // Boss
  ghostship: { name: 'Ghost Ship', hull: 3000, ap: 200, damage: 280, accuracy: 90, cost: 0, color: '#848', tier: 5 },
  kraken: { name: 'The Kraken', hull: 5000, ap: 250, damage: 350, accuracy: 88, cost: 0, color: '#a4f', tier: 5 }
};

// ============================================
// CREW TYPES (NEW MECHANIC)
// ============================================
const CREW_TYPES = {
  gunner: { name: 'Gunner', bonus: 'damage', value: 10, cost: 500 },
  navigator: { name: 'Navigator', bonus: 'accuracy', value: 5, cost: 400 },
  surgeon: { name: 'Surgeon', bonus: 'repair', value: 15, cost: 600 },
  boatswain: { name: 'Boatswain', bonus: 'ap', value: 10, cost: 700 },
  cannoneer: { name: 'Master Cannoneer', bonus: 'critChance', value: 10, cost: 1000 }
};

// ============================================
// SAVE/LOAD
// ============================================
const SAVE_KEY = 'caribbean_admiral_expanded_save';

function saveGame() {
  const data = {
    gold: game.gold,
    playerShips: game.playerShips.map(s => ({
      type: s.type,
      crew: s.crew,
      upgrades: s.upgrades
    })),
    stats: game.stats,
    unlocks: game.unlocks,
    settings: game.settings,
    achievements: game.earnedAchievements
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data) {
      game.gold = data.gold || 1000;
      game.stats = data.stats || game.stats;
      game.unlocks = data.unlocks || game.unlocks;
      game.settings = data.settings || game.settings;
      game.earnedAchievements = data.achievements || [];
      if (data.playerShips && data.playerShips.length > 0) {
        game.playerShips = data.playerShips.map(s => {
          const ship = createShip(s.type, 0, 0, true);
          ship.crew = s.crew || [];
          ship.upgrades = s.upgrades || {};
          applyUpgrades(ship);
          return ship;
        });
      }
    }
  } catch (e) {}
}

// ============================================
// GAME STATE
// ============================================
const game = {
  state: 'menu', // menu, tutorial, settings, port, battle, victory, defeat, gameover, boss
  gold: 1000,
  playerShips: [],
  enemyShips: [],
  selectedShip: null,
  targetedEnemy: null,
  turn: 'player',
  battleNumber: 1,
  messages: [],
  battleLog: [],
  time: 0,
  mouse: { x: 0, y: 0, clicked: false },
  keys: {},

  stats: {
    victories: 0,
    defeats: 0,
    totalKills: 0,
    bossesDefeated: 0,
    goldEarned: 0,
    damageDealt: 0
  },

  unlocks: {
    corvette: false,
    brig: false,
    frigate: false,
    manOWar: false,
    galleon: false,
    flagship: false,
    leviathan: false
  },

  settings: {
    soundOn: true,
    musicOn: true
  },

  earnedAchievements: [],
  newAchievements: []
};

// ============================================
// ACHIEVEMENTS
// ============================================
const ACHIEVEMENTS = {
  firstBlood: { name: 'First Blood', desc: 'Win your first battle', check: () => game.stats.victories >= 1 },
  veteran: { name: 'Veteran', desc: 'Win 10 battles', check: () => game.stats.victories >= 10 },
  admiral: { name: 'Admiral', desc: 'Win 25 battles', check: () => game.stats.victories >= 25 },
  ghostBuster: { name: 'Ghost Buster', desc: 'Defeat the Ghost Ship', check: () => game.stats.bossesDefeated >= 1 },
  krakenSlayer: { name: 'Kraken Slayer', desc: 'Defeat the Kraken', check: () => game.stats.bossesDefeated >= 2 },
  wealthy: { name: 'Wealthy', desc: 'Accumulate 100,000 gold', check: () => game.stats.goldEarned >= 100000 },
  armada: { name: 'Armada', desc: 'Have 5 ships in your fleet', check: () => game.playerShips.length >= 5 },
  legendary: { name: 'Legendary', desc: 'Own a Flagship or Leviathan', check: () => game.playerShips.some(s => s.type === 'flagship' || s.type === 'leviathan') }
};

function checkAchievements() {
  for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
    if (!game.earnedAchievements.includes(id) && ach.check()) {
      game.earnedAchievements.push(id);
      game.newAchievements.push(ach.name);
    }
  }
}

// ============================================
// SHIP FUNCTIONS
// ============================================
function createShip(type, x, y, isPlayer) {
  const t = SHIP_TYPES[type];
  return {
    type,
    name: t.name,
    x, y,
    hull: t.hull,
    maxHull: t.hull,
    ap: t.ap,
    maxAp: t.ap,
    damage: t.damage,
    accuracy: t.accuracy,
    color: t.color,
    tier: t.tier,
    isPlayer,
    selected: false,
    hasActed: false,
    crew: [],
    upgrades: {},
    critChance: 5
  };
}

function applyUpgrades(ship) {
  const t = SHIP_TYPES[ship.type];
  ship.maxHull = t.hull + (ship.upgrades.hull || 0);
  ship.hull = Math.min(ship.hull, ship.maxHull);
  ship.maxAp = t.ap + (ship.upgrades.ap || 0);
  ship.damage = t.damage + (ship.upgrades.damage || 0);
  ship.accuracy = Math.min(95, t.accuracy + (ship.upgrades.accuracy || 0));

  // Apply crew bonuses
  for (const crewType of ship.crew) {
    const crew = CREW_TYPES[crewType];
    if (crew.bonus === 'damage') ship.damage += crew.value;
    if (crew.bonus === 'accuracy') ship.accuracy = Math.min(95, ship.accuracy + crew.value);
    if (crew.bonus === 'ap') ship.maxAp += crew.value;
    if (crew.bonus === 'critChance') ship.critChance += crew.value;
  }
}

function checkUnlocks() {
  if (game.stats.victories >= 3 && !game.unlocks.corvette) game.unlocks.corvette = true;
  if (game.stats.victories >= 5 && !game.unlocks.brig) game.unlocks.brig = true;
  if (game.stats.victories >= 8 && !game.unlocks.frigate) game.unlocks.frigate = true;
  if (game.stats.victories >= 12 && !game.unlocks.manOWar) game.unlocks.manOWar = true;
  if (game.stats.victories >= 15 && !game.unlocks.galleon) game.unlocks.galleon = true;
  if (game.stats.victories >= 20 && !game.unlocks.flagship) game.unlocks.flagship = true;
  if (game.stats.bossesDefeated >= 1 && !game.unlocks.leviathan) game.unlocks.leviathan = true;
}

// ============================================
// MESSAGES
// ============================================
function addMessage(text, duration = 3) {
  game.messages.unshift({ text, time: duration });
  if (game.messages.length > 4) game.messages.pop();
}

function addLog(text) {
  game.battleLog.unshift(text);
  if (game.battleLog.length > 8) game.battleLog.pop();
}

// ============================================
// INPUT
// ============================================
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  handleInput(e.key);
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
  handleClick();
});

function handleInput(key) {
  if (game.state === 'menu') {
    if (key === 'Enter' || key === ' ') { startNewGame(); playSound('menu'); }
    if (key === 'c' || key === 'C') { continueGame(); playSound('menu'); }
    if (key === 't' || key === 'T') { game.state = 'tutorial'; playSound('menu'); }
    if (key === 's' || key === 'S') { game.state = 'settings'; playSound('menu'); }
  } else if (game.state === 'tutorial' || game.state === 'settings') {
    if (key === 'Escape' || key === 'Enter') { game.state = 'menu'; saveGame(); playSound('menu'); }
    if (game.state === 'settings') {
      if (key === '1') { game.settings.soundOn = !game.settings.soundOn; playSound('menu'); }
      if (key === '2') { game.settings.musicOn = !game.settings.musicOn; if (!game.settings.musicOn) stopMusic(); playSound('menu'); }
    }
  } else if (game.state === 'port') {
    if (key === 'b' || key === 'B' || key === ' ' || key === 'Enter') { startBattle(); playSound('menu'); }
    if (key === '1') buyShip('sloop');
    if (key === '2') buyShip('brigantine');
    if (key === '3') buyShip('frigate');
    if (key === '4') buyShip('galleon');
    if (key === 'r' || key === 'R') repairShips();
    if (key === 'g' || key === 'G') fightBoss('ghostship');
    if (key === 'k' || key === 'K') fightBoss('kraken');
    if (key === 'Escape') { game.state = 'menu'; saveGame(); playSound('menu'); }
  } else if (game.state === 'battle' && game.turn === 'player') {
    if (key === 'Tab') { e && e.preventDefault(); selectNextShip(); }
    if (key === '1' && game.enemyShips[0]) attackEnemy(0);
    if (key === '2' && game.enemyShips[1]) attackEnemy(1);
    if (key === '3' && game.enemyShips[2]) attackEnemy(2);
    if (key === 'e' || key === 'E' || key === ' ') endTurn();
    if (key === 'Escape') { game.state = 'port'; playSound('menu'); }
  } else if (game.state === 'victory' || game.state === 'defeat' || game.state === 'gameover') {
    if (key === 'Enter' || key === ' ') {
      if (game.state === 'gameover') { game.state = 'menu'; }
      else { game.state = 'port'; }
      playSound('menu');
    }
  }
}

function handleClick() {
  if (game.state === 'menu') {
    startNewGame();
  } else if (game.state === 'battle' && game.turn === 'player') {
    // Check enemy ships
    for (let i = 0; i < game.enemyShips.length; i++) {
      const e = game.enemyShips[i];
      const dist = Math.sqrt((game.mouse.x - e.x) ** 2 + (game.mouse.y - e.y) ** 2);
      if (dist < 50) { attackEnemy(i); return; }
    }
    // Check player ships for selection
    for (const ship of game.playerShips) {
      const dist = Math.sqrt((game.mouse.x - ship.x) ** 2 + (game.mouse.y - ship.y) ** 2);
      if (dist < 50) { selectShip(ship); return; }
    }
  } else if (game.state === 'port') {
    handlePortClick();
  } else if (game.state === 'victory' || game.state === 'defeat') {
    game.state = 'port';
  } else if (game.state === 'gameover') {
    game.state = 'menu';
  }
}

function handlePortClick() {
  const buttonY = 520;
  const ships = [
    { type: 'sloop', x: 150 },
    { type: 'brigantine', x: 300 },
    { type: 'frigate', x: 450 },
    { type: 'galleon', x: 600 }
  ];

  for (const s of ships) {
    if (game.mouse.x > s.x - 60 && game.mouse.x < s.x + 60 &&
        game.mouse.y > buttonY - 20 && game.mouse.y < buttonY + 20) {
      buyShip(s.type);
      return;
    }
  }

  // Sail button
  if (game.mouse.x > WIDTH / 2 - 100 && game.mouse.x < WIDTH / 2 + 100 &&
      game.mouse.y > 620 && game.mouse.y < 660) {
    startBattle();
  }

  // Boss buttons
  if (game.stats.victories >= 10 && game.mouse.y > 680 && game.mouse.y < 720) {
    if (game.mouse.x > 200 && game.mouse.x < 400) fightBoss('ghostship');
    if (game.stats.bossesDefeated >= 1 && game.mouse.x > 600 && game.mouse.x < 800) fightBoss('kraken');
  }
}

// ============================================
// GAME FLOW
// ============================================
function startNewGame() {
  initAudio();
  game.gold = 1000;
  game.playerShips = [createShip('sloop', 0, 0, true)];
  game.battleNumber = 1;
  game.stats = { victories: 0, defeats: 0, totalKills: 0, bossesDefeated: 0, goldEarned: 0, damageDealt: 0 };
  game.messages = [];
  game.state = 'port';
  if (game.settings.musicOn) startMusic();
  addMessage('Welcome to port! Prepare for battle.');
}

function continueGame() {
  initAudio();
  loadGame();
  if (game.playerShips.length === 0) {
    game.playerShips = [createShip('sloop', 0, 0, true)];
  }
  game.state = 'port';
  if (game.settings.musicOn) startMusic();
  addMessage('Welcome back, Admiral!');
}

function startBattle() {
  game.state = 'battle';
  game.battleLog = [];

  // Position player ships
  game.playerShips.forEach((ship, i) => {
    ship.x = 150;
    ship.y = 150 + i * 120;
    ship.hull = ship.maxHull;
    ship.ap = ship.maxAp;
    ship.hasActed = false;
    ship.selected = false;
  });

  // Generate enemy fleet based on battle number
  game.enemyShips = [];
  const enemyCount = Math.min(1 + Math.floor(game.battleNumber / 3), 4);

  for (let i = 0; i < enemyCount; i++) {
    let type = 'sloop';
    const roll = Math.random();
    if (game.battleNumber >= 3) type = roll < 0.4 ? 'brigantine' : type;
    if (game.battleNumber >= 5) type = roll < 0.3 ? 'corvette' : type;
    if (game.battleNumber >= 8) type = roll < 0.25 ? 'frigate' : type;
    if (game.battleNumber >= 12) type = roll < 0.2 ? 'manOWar' : type;
    if (game.battleNumber >= 15) type = roll < 0.15 ? 'galleon' : type;

    const ship = createShip(type, 850, 150 + i * 120, false);
    game.enemyShips.push(ship);
  }

  // Select first player ship
  if (game.playerShips.length > 0) {
    game.playerShips[0].selected = true;
    game.selectedShip = game.playerShips[0];
  }

  game.turn = 'player';
  addLog('Battle ' + game.battleNumber + ' begins!');
  addMessage('Your turn! Click enemies to attack.');
}

function fightBoss(bossType) {
  if (bossType === 'ghostship' && game.stats.victories < 10) {
    addMessage('Win 10 battles first!');
    return;
  }
  if (bossType === 'kraken' && game.stats.bossesDefeated < 1) {
    addMessage('Defeat the Ghost Ship first!');
    return;
  }

  game.state = 'battle';
  game.battleLog = [];

  game.playerShips.forEach((ship, i) => {
    ship.x = 150;
    ship.y = 150 + i * 120;
    ship.hull = ship.maxHull;
    ship.ap = ship.maxAp;
    ship.hasActed = false;
    ship.selected = false;
  });

  game.enemyShips = [createShip(bossType, 800, 350, false)];

  if (game.playerShips.length > 0) {
    game.playerShips[0].selected = true;
    game.selectedShip = game.playerShips[0];
  }

  game.turn = 'player';
  const bossName = bossType === 'ghostship' ? 'THE GHOST SHIP' : 'THE KRAKEN';
  addLog(`${bossName} APPEARS!`);
  addMessage(`Boss fight! Destroy ${bossName}!`);
}

// ============================================
// COMBAT
// ============================================
function selectShip(ship) {
  game.playerShips.forEach(s => s.selected = false);
  ship.selected = true;
  game.selectedShip = ship;
}

function selectNextShip() {
  const available = game.playerShips.filter(s => !s.hasActed);
  if (available.length === 0) return;
  const idx = available.indexOf(game.selectedShip);
  selectShip(available[(idx + 1) % available.length]);
}

function attackEnemy(index) {
  if (!game.selectedShip || game.selectedShip.hasActed) return;
  if (!game.enemyShips[index]) return;
  performAttack(game.selectedShip, game.enemyShips[index]);
}

function performAttack(attacker, defender) {
  if (attacker.ap < 20) {
    addMessage('Not enough AP!');
    return;
  }

  attacker.ap -= 20;
  playSound('cannon');

  const hitRoll = Math.random() * 100;
  if (hitRoll < attacker.accuracy) {
    let damage = Math.floor(attacker.damage * (0.8 + Math.random() * 0.4));

    // Critical hit
    if (Math.random() * 100 < attacker.critChance) {
      damage = Math.floor(damage * 1.5);
      addLog(`CRITICAL HIT!`);
    }

    defender.hull -= damage;
    game.stats.damageDealt += damage;
    playSound('hit');
    addLog(`${attacker.name} hits ${defender.name} for ${damage}!`);

    if (defender.hull <= 0) {
      defender.hull = 0;
      playSound('sink');
      addLog(`${defender.name} sunk!`);

      if (defender.isPlayer) {
        game.playerShips = game.playerShips.filter(s => s !== defender);
        if (game.selectedShip === defender) {
          game.selectedShip = game.playerShips[0] || null;
          if (game.selectedShip) game.selectedShip.selected = true;
        }
      } else {
        game.enemyShips = game.enemyShips.filter(s => s !== defender);
        game.stats.totalKills++;
      }

      if (game.enemyShips.length === 0) { checkVictory(); return; }
      if (game.playerShips.length === 0) { checkDefeat(); return; }
    }
  } else {
    addLog(`${attacker.name} misses!`);
  }

  if (attacker.ap < 20) {
    attacker.hasActed = true;
    selectNextShip();
  }

  if (game.playerShips.every(s => s.hasActed)) {
    endTurn();
  }
}

function endTurn() {
  if (game.turn === 'player') {
    game.turn = 'enemy';
    addLog('Enemy turn...');
    setTimeout(enemyTurn, 500);
  } else {
    game.turn = 'player';
    game.playerShips.forEach(s => { s.ap = s.maxAp; s.hasActed = false; });
    game.enemyShips.forEach(s => { s.ap = s.maxAp; });

    // Surgeon crew heal
    game.playerShips.forEach(s => {
      if (s.crew.includes('surgeon')) {
        s.hull = Math.min(s.maxHull, s.hull + 15);
      }
    });

    addLog('Your turn!');
    addMessage('Your turn!');
  }
}

function enemyTurn() {
  // Better AI: prioritize low health targets
  for (const enemy of game.enemyShips) {
    if (game.playerShips.length === 0) break;

    while (enemy.ap >= 20 && game.playerShips.length > 0) {
      // Target lowest HP ship
      const target = game.playerShips.reduce((a, b) => a.hull < b.hull ? a : b);

      enemy.ap -= 20;
      playSound('cannon');

      if (Math.random() * 100 < enemy.accuracy) {
        const damage = Math.floor(enemy.damage * (0.8 + Math.random() * 0.4));
        target.hull -= damage;
        playSound('hit');
        addLog(`${enemy.name} hits ${target.name} for ${damage}!`);

        if (target.hull <= 0) {
          target.hull = 0;
          playSound('sink');
          addLog(`${target.name} sunk!`);
          game.playerShips = game.playerShips.filter(s => s !== target);
        }
      } else {
        addLog(`${enemy.name} misses!`);
      }
    }
  }

  if (game.playerShips.length === 0) {
    checkDefeat();
    return;
  }

  setTimeout(endTurn, 500);
}

function checkVictory() {
  const isBoss = game.battleLog.some(l => l.includes('GHOST') || l.includes('KRAKEN'));

  if (isBoss) {
    game.stats.bossesDefeated++;
    const loot = 100000 + game.stats.bossesDefeated * 50000;
    game.gold += loot;
    game.stats.goldEarned += loot;
    playSound('victory');
    addMessage(`BOSS DEFEATED! +${loot} gold!`);
  } else {
    const loot = 500 + game.battleNumber * 250 + Math.floor(Math.random() * 500);
    game.gold += loot;
    game.stats.goldEarned += loot;
    game.stats.victories++;
    game.battleNumber++;
    playSound('victory');
    addMessage(`Victory! +${loot} gold.`);
  }

  checkUnlocks();
  checkAchievements();
  saveGame();
  game.state = 'victory';
}

function checkDefeat() {
  game.gold = Math.floor(game.gold * 0.75);
  game.playerShips = [createShip('sloop', 0, 0, true)];
  game.stats.defeats++;

  if (game.gold < 100) {
    game.state = 'gameover';
    addMessage('Game Over! You lost everything.');
  } else {
    game.state = 'defeat';
    addMessage('Defeat! Lost 25% gold.');
  }
  saveGame();
}

// ============================================
// PORT ACTIONS
// ============================================
function buyShip(type) {
  if (game.playerShips.length >= 5) {
    addMessage('Max 5 ships in fleet!');
    return;
  }

  // Check unlock requirements
  if (['corvette', 'brig', 'frigate', 'manOWar', 'galleon', 'flagship', 'leviathan'].includes(type)) {
    if (!game.unlocks[type]) {
      addMessage(`${SHIP_TYPES[type].name} not yet unlocked!`);
      return;
    }
  }

  const cost = SHIP_TYPES[type].cost;
  if (game.gold < cost) {
    addMessage('Not enough gold!');
    return;
  }

  game.gold -= cost;
  game.playerShips.push(createShip(type, 0, 0, true));
  playSound('buy');
  addMessage(`Bought ${SHIP_TYPES[type].name}!`);
  saveGame();
}

function repairShips() {
  let cost = 0;
  game.playerShips.forEach(s => cost += Math.floor((s.maxHull - s.hull) * 0.5));

  if (cost === 0) { addMessage('All ships fully repaired!'); return; }
  if (game.gold < cost) { addMessage(`Need ${cost} gold for repairs!`); return; }

  game.gold -= cost;
  game.playerShips.forEach(s => s.hull = s.maxHull);
  playSound('buy');
  addMessage(`Repaired for ${cost} gold!`);
  saveGame();
}

function updateMessages(dt) {
  for (let i = game.messages.length - 1; i >= 0; i--) {
    game.messages[i].time -= dt;
    if (game.messages[i].time <= 0) game.messages.splice(i, 1);
  }
}

// ============================================
// RENDERING
// ============================================
function drawBackground() {
  ctx.fillStyle = COLORS.ocean;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Animated waves
  ctx.strokeStyle = 'rgba(30, 80, 120, 0.3)';
  for (let y = 0; y < HEIGHT; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < WIDTH; x += 20) {
      ctx.lineTo(x, y + Math.sin(x / 50 + game.time) * 5);
    }
    ctx.stroke();
  }
}

function drawShip(ship) {
  const isHovered = Math.sqrt((game.mouse.x - ship.x) ** 2 + (game.mouse.y - ship.y) ** 2) < 50;

  ctx.save();
  ctx.translate(ship.x, ship.y);

  // Selection ring
  if (ship.selected) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hover ring
  if (isHovered && !ship.isPlayer && game.turn === 'player') {
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ship body
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  if (ship.isPlayer) {
    ctx.moveTo(-30, -15);
    ctx.lineTo(40, 0);
    ctx.lineTo(-30, 15);
  } else {
    ctx.moveTo(30, -15);
    ctx.lineTo(-40, 0);
    ctx.lineTo(30, 15);
  }
  ctx.closePath();
  ctx.fill();

  // Mast & sail
  ctx.fillStyle = '#654';
  ctx.fillRect(-5, -30, 10, 40);
  ctx.fillStyle = ship.isPlayer ? '#fff' : '#844';
  ctx.beginPath();
  ctx.moveTo(-5, -25);
  ctx.lineTo(ship.isPlayer ? 20 : -20, -15);
  ctx.lineTo(-5, -5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // HP bar
  ctx.fillStyle = '#300';
  ctx.fillRect(ship.x - 30, ship.y - 50, 60, 8);
  ctx.fillStyle = ship.hull > ship.maxHull * 0.3 ? '#4a4' : '#f44';
  ctx.fillRect(ship.x - 30, ship.y - 50, 60 * (ship.hull / ship.maxHull), 8);

  // AP bar
  ctx.fillStyle = '#003';
  ctx.fillRect(ship.x - 30, ship.y - 40, 60, 6);
  ctx.fillStyle = '#48f';
  ctx.fillRect(ship.x - 30, ship.y - 40, 60 * (ship.ap / ship.maxAp), 6);

  // Name
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ship.name, ship.x, ship.y + 40);
}

function drawMessages() {
  ctx.textAlign = 'center';
  game.messages.forEach((msg, i) => {
    ctx.fillStyle = `rgba(255, 255, 100, ${Math.min(1, msg.time)})`;
    ctx.font = '16px sans-serif';
    ctx.fillText(msg.text, WIDTH / 2, 100 + i * 25);
  });
}

function drawMenu() {
  drawBackground();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.shadowBlur = 20;
  ctx.shadowColor = COLORS.gold;
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('CARIBBEAN ADMIRAL', WIDTH / 2, 150);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#8ac';
  ctx.font = '22px sans-serif';
  ctx.fillText('EXPANDED EDITION', WIDTH / 2, 190);

  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Build your fleet and conquer the seas!', WIDTH / 2, 280);
  ctx.fillText('12 ship types • Crew system • Boss battles', WIDTH / 2, 310);

  ctx.fillStyle = COLORS.green;
  ctx.font = '20px sans-serif';
  const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillText('Press ENTER to Start New Game', WIDTH / 2, 420);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#aaa';
  ctx.font = '16px sans-serif';
  ctx.fillText('[C] Continue • [T] Tutorial • [S] Settings', WIDTH / 2, 480);

  // Stats
  if (game.stats.victories > 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Previous: ${game.stats.victories} victories | ${game.stats.totalKills} kills`, WIDTH / 2, 550);
  }

  ctx.restore();
}

function drawTutorial() {
  drawBackground();
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('HOW TO PLAY', WIDTH / 2, 80);

  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  const lines = [
    'OBJECTIVE: Build your fleet and defeat the legendary bosses!',
    '',
    'COMBAT:',
    '• Click enemy ships to attack (costs 20 AP)',
    '• TAB to cycle through your ships',
    '• SPACE/E to end your turn',
    '• Numbers 1-3 to quickly target enemies',
    '',
    'PORT:',
    '• Buy new ships to expand your fleet (max 5)',
    '• Repair damaged ships',
    '• Hire crew for bonuses',
    '',
    'PROGRESSION:',
    '• Win battles to unlock better ships',
    '• Defeat 10 enemies to unlock Ghost Ship boss',
    '• Defeat Ghost Ship to unlock Kraken boss',
    '',
    'TIPS:',
    '• Critical hits deal 150% damage',
    '• Surgeons heal 15 HP per turn',
    '• Target low-health enemies first'
  ];

  lines.forEach((line, i) => ctx.fillText(line, WIDTH / 2, 130 + i * 26));

  ctx.fillStyle = COLORS.gold;
  ctx.fillText('Press ESC to return', WIDTH / 2, 700);
  ctx.restore();
}

function drawSettings() {
  drawBackground();
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('SETTINGS', WIDTH / 2, 150);

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`[1] Sound Effects: ${game.settings.soundOn ? 'ON' : 'OFF'}`, WIDTH / 2, 300);
  ctx.fillText(`[2] Music: ${game.settings.musicOn ? 'ON' : 'OFF'}`, WIDTH / 2, 350);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '16px sans-serif';
  ctx.fillText('Press ESC to return', WIDTH / 2, 500);
  ctx.restore();
}

function drawPort() {
  drawBackground();

  // Port structure
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(0, HEIGHT - 120, WIDTH, 120);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('PORT NASSAU', WIDTH / 2, 50);

  ctx.fillStyle = '#ff0';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Gold: ${game.gold}`, WIDTH / 2, 85);

  // Fleet display
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Your Fleet (${game.playerShips.length}/5):`, WIDTH / 2, 130);

  game.playerShips.forEach((ship, i) => {
    ctx.fillStyle = ship.color;
    ctx.fillText(`${ship.name} - HP: ${ship.hull}/${ship.maxHull} | DMG: ${ship.damage}`, WIDTH / 2, 160 + i * 22);
  });

  // Stats
  ctx.fillStyle = COLORS.green;
  ctx.font = '16px sans-serif';
  ctx.fillText(`Victories: ${game.stats.victories} | Bosses: ${game.stats.bossesDefeated}`, WIDTH / 2, 300);

  // Ship shop
  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText('BUY SHIPS:', WIDTH / 2, 420);

  const shopShips = [
    { type: 'sloop', x: 150 },
    { type: 'brigantine', x: 300 },
    { type: 'frigate', x: 450 },
    { type: 'galleon', x: 600 }
  ];

  shopShips.forEach(s => {
    const t = SHIP_TYPES[s.type];
    const canAfford = game.gold >= t.cost;
    const unlocked = !['frigate', 'galleon'].includes(s.type) || game.unlocks[s.type];
    ctx.fillStyle = (canAfford && unlocked) ? t.color : '#444';
    ctx.fillRect(s.x - 60, 500, 120, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText(unlocked ? `${t.name}` : 'LOCKED', s.x, 515);
    ctx.fillText(unlocked ? `${t.cost}g` : '', s.x, 530);
  });

  // Sail button
  ctx.fillStyle = '#48a';
  ctx.fillRect(WIDTH / 2 - 100, 620, 200, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('[B] SAIL TO BATTLE', WIDTH / 2, 645);

  // Boss buttons
  if (game.stats.victories >= 10) {
    ctx.fillStyle = '#848';
    ctx.fillRect(200, 680, 200, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('[G] GHOST SHIP', 300, 705);
  }
  if (game.stats.bossesDefeated >= 1) {
    ctx.fillStyle = '#a4f';
    ctx.fillRect(600, 680, 200, 40);
    ctx.fillText('[K] KRAKEN', 700, 705);
  }

  ctx.restore();
  drawMessages();
}

function drawBattle() {
  drawBackground();

  // Draw ships
  game.playerShips.forEach(drawShip);
  game.enemyShips.forEach(drawShip);

  // Turn indicator
  ctx.fillStyle = game.turn === 'player' ? COLORS.green : COLORS.red;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(game.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN', 20, 30);

  // Battle log
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(WIDTH - 280, 10, 270, 180);
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Battle Log:', WIDTH - 270, 30);
  game.battleLog.forEach((log, i) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${1 - i * 0.1})`;
    ctx.fillText(log.substring(0, 32), WIDTH - 270, 50 + i * 16);
  });

  // Selected ship info
  if (game.selectedShip) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, HEIGHT - 90, 180, 80);
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'left';
    ctx.fillText(`${game.selectedShip.name}`, 20, HEIGHT - 70);
    ctx.fillStyle = '#fff';
    ctx.fillText(`AP: ${game.selectedShip.ap}/${game.selectedShip.maxAp}`, 20, HEIGHT - 50);
    ctx.fillText(`DMG: ${game.selectedShip.damage} | ACC: ${game.selectedShip.accuracy}%`, 20, HEIGHT - 30);
  }

  // Controls hint
  ctx.fillStyle = '#666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Click enemies to attack | TAB: next ship | SPACE: end turn | ESC: flee', WIDTH / 2, HEIGHT - 10);

  drawMessages();
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.green;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('VICTORY!', WIDTH / 2, 200);

  ctx.fillStyle = '#8f8';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Battle ${game.battleNumber - 1} won!`, WIDTH / 2, 280);
  ctx.fillText(`Total Victories: ${game.stats.victories}`, WIDTH / 2, 320);

  // New achievements
  if (game.newAchievements.length > 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = '18px sans-serif';
    ctx.fillText('NEW ACHIEVEMENTS:', WIDTH / 2, 380);
    game.newAchievements.forEach((a, i) => {
      ctx.fillText(a, WIDTH / 2, 410 + i * 25);
    });
    game.newAchievements = [];
  }

  ctx.fillStyle = COLORS.gold;
  ctx.font = '24px sans-serif';
  ctx.fillText(`Gold: ${game.gold}`, WIDTH / 2, 500);

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press SPACE to continue', WIDTH / 2, 580);
  ctx.restore();
}

function drawDefeat() {
  ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = COLORS.red;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('DEFEAT', WIDTH / 2, 200);

  ctx.fillStyle = '#f88';
  ctx.font = '20px sans-serif';
  ctx.fillText('Your fleet was destroyed!', WIDTH / 2, 280);
  ctx.fillText('Lost 25% gold. Starting ship restored.', WIDTH / 2, 320);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '24px sans-serif';
  ctx.fillText(`Remaining Gold: ${game.gold}`, WIDTH / 2, 400);

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press SPACE to return to port', WIDTH / 2, 500);
  ctx.restore();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(20, 0, 0, 0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('GAME OVER', WIDTH / 2, 200);

  ctx.fillStyle = '#888';
  ctx.font = '20px sans-serif';
  ctx.fillText('You lost everything...', WIDTH / 2, 280);
  ctx.fillText(`Victories: ${game.stats.victories} | Kills: ${game.stats.totalKills}`, WIDTH / 2, 320);

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press SPACE to return to title', WIDTH / 2, 450);
  ctx.restore();
}

// ============================================
// MAIN LOOP
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  game.time += dt;

  updateMessages(dt);

  switch (game.state) {
    case 'menu': drawMenu(); break;
    case 'tutorial': drawTutorial(); break;
    case 'settings': drawSettings(); break;
    case 'port': drawPort(); break;
    case 'battle': drawBattle(); break;
    case 'victory': drawVictory(); break;
    case 'defeat': drawDefeat(); break;
    case 'gameover': drawGameOver(); break;
  }

  requestAnimationFrame(gameLoop);
}

// ============================================
// INIT
// ============================================
window.game = {
  get state() { return game.state; },
  get gold() { return game.gold; },
  get playerShips() { return game.playerShips; },
  get enemyShips() { return game.enemyShips; },
  get turn() { return game.turn; },
  get stats() { return game.stats; },
  get selectedShip() { return game.selectedShip; },
  shipTypes: Object.keys(SHIP_TYPES),
  crewTypes: Object.keys(CREW_TYPES),
  saveGame,
  loadGame
};

loadGame();
requestAnimationFrame(gameLoop);
