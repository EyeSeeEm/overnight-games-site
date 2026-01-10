// Curious Expedition Clone - Hex-Based Exploration Roguelike
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Configuration
const CONFIG = {
  mapWidth: 15,
  mapHeight: 12,
  hexSize: 28,
  hexWidth: 56,
  hexHeight: 48,
  viewDistance: 2,
  baseSanity: 100,
  baseTravelCost: 3,
  expeditionsToWin: 4
};

// Colors
const COLORS = {
  background: '#1a1a2e',
  parchment: '#F5E6D3',
  inkBrown: '#3E2723',
  goldAccent: '#FFD700',
  dangerRed: '#C62828',
  sanityBlue: '#1976D2',
  grassland: '#7CB342',
  jungle: '#2E7D32',
  desert: '#D4A559',
  mountain: '#5D4037',
  water: '#1565C0',
  swamp: '#4E342E',
  village: '#FF9800',
  shrine: '#9C27B0',
  pyramid: '#FFD700',
  fog: '#1a1a2e',
  text: '#ffffff',
  party: '#ffcc88'
};

// Terrain types
const TERRAIN = {
  grassland: { name: 'Grassland', cost: 2, passable: true, color: COLORS.grassland },
  jungle: { name: 'Jungle', cost: 6, passable: true, color: COLORS.jungle },
  desert: { name: 'Desert', cost: 8, passable: true, color: COLORS.desert },
  mountain: { name: 'Mountain', cost: 0, passable: false, color: COLORS.mountain },
  water: { name: 'Water', cost: 0, passable: false, color: COLORS.water },
  swamp: { name: 'Swamp', cost: 10, passable: true, color: COLORS.swamp }
};

// Location types
const LOCATIONS = {
  village: { name: 'Village', sanityGain: 30, color: COLORS.village, symbol: 'V' },
  shrine: { name: 'Shrine', sanityGain: 15, color: COLORS.shrine, symbol: 'S' },
  pyramid: { name: 'Golden Pyramid', sanityGain: 50, color: COLORS.pyramid, symbol: 'P', isGoal: true },
  cave: { name: 'Cave', sanityGain: 0, color: '#666666', symbol: 'C', hasLoot: true }
};

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.1;

  switch(type) {
    case 'move': osc.frequency.value = 300; osc.type = 'sine'; break;
    case 'location': osc.frequency.value = 500; osc.type = 'triangle'; break;
    case 'pyramid': osc.frequency.value = 800; osc.type = 'sine'; break;
    case 'combat': osc.frequency.value = 200; osc.type = 'sawtooth'; break;
    case 'death': osc.frequency.value = 100; osc.type = 'square'; break;
  }

  osc.start();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  osc.stop(audioCtx.currentTime + 0.15);
}

// Game state
const game = {
  state: 'menu',
  expedition: 1,
  fame: 0,
  sanity: CONFIG.baseSanity,
  maxSanity: CONFIG.baseSanity,
  items: [],
  companions: [],
  map: [],
  partyPos: { q: 0, r: 0 },
  pyramidFound: false,
  inCombat: false,
  combatEnemy: null,
  combatDice: [],
  stats: { gamesPlayed: 0, expeditionsCompleted: 0, pyramidsFound: 0, victories: 0 }
};

// Load stats
try {
  const saved = localStorage.getItem('curiousExpCloneStats');
  if (saved) game.stats = JSON.parse(saved);
} catch(e) {}

function saveStats() {
  try { localStorage.setItem('curiousExpCloneStats', JSON.stringify(game.stats)); } catch(e) {}
}

// Hex math
function hexToPixel(q, r) {
  const x = CONFIG.hexSize * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
  const y = CONFIG.hexSize * (3/2 * r);
  return { x: x + 150, y: y + 80 };
}

function pixelToHex(x, y) {
  x -= 150;
  y -= 80;
  const q = (Math.sqrt(3)/3 * x - 1/3 * y) / CONFIG.hexSize;
  const r = (2/3 * y) / CONFIG.hexSize;
  return hexRound(q, r);
}

function hexRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

function hexDistance(q1, r1, q2, r2) {
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs((-q1-r1) - (-q2-r2)));
}

function getNeighbors(q, r) {
  const directions = [
    [1, 0], [1, -1], [0, -1],
    [-1, 0], [-1, 1], [0, 1]
  ];
  return directions.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

// Map generation
function generateMap() {
  game.map = [];

  // Generate terrain
  for (let r = 0; r < CONFIG.mapHeight; r++) {
    for (let q = 0; q < CONFIG.mapWidth; q++) {
      const noise = Math.sin(q * 0.5) * Math.cos(r * 0.4) + Math.random() * 0.5;
      let terrain;

      if (noise > 0.6) terrain = 'mountain';
      else if (noise > 0.4) terrain = 'jungle';
      else if (noise < -0.3) terrain = 'water';
      else if (noise < 0) terrain = 'swamp';
      else if (Math.random() < 0.15) terrain = 'desert';
      else terrain = 'grassland';

      game.map.push({
        q, r,
        terrain,
        location: null,
        revealed: false,
        enemy: null
      });
    }
  }

  // Place starting position
  const startHex = game.map.find(h => TERRAIN[h.terrain].passable);
  game.partyPos = { q: startHex.q, r: startHex.r };
  revealAround(startHex.q, startHex.r);

  // Place locations
  const passableHexes = game.map.filter(h =>
    TERRAIN[h.terrain].passable &&
    hexDistance(h.q, h.r, game.partyPos.q, game.partyPos.r) > 3
  );

  // Place pyramid far from start
  const farHexes = passableHexes.filter(h =>
    hexDistance(h.q, h.r, game.partyPos.q, game.partyPos.r) > 8
  );
  if (farHexes.length > 0) {
    const pyramidHex = farHexes[Math.floor(Math.random() * farHexes.length)];
    pyramidHex.location = 'pyramid';
  }

  // Place villages
  for (let i = 0; i < 3; i++) {
    const available = passableHexes.filter(h => !h.location);
    if (available.length > 0) {
      const hex = available[Math.floor(Math.random() * available.length)];
      hex.location = 'village';
    }
  }

  // Place shrines
  for (let i = 0; i < 2; i++) {
    const available = passableHexes.filter(h => !h.location);
    if (available.length > 0) {
      const hex = available[Math.floor(Math.random() * available.length)];
      hex.location = 'shrine';
    }
  }

  // Place caves
  for (let i = 0; i < 2; i++) {
    const available = passableHexes.filter(h => !h.location);
    if (available.length > 0) {
      const hex = available[Math.floor(Math.random() * available.length)];
      hex.location = 'cave';
    }
  }

  // Place enemies
  for (let i = 0; i < 3 + game.expedition; i++) {
    const available = passableHexes.filter(h =>
      !h.location && !h.enemy &&
      hexDistance(h.q, h.r, game.partyPos.q, game.partyPos.r) > 2
    );
    if (available.length > 0) {
      const hex = available[Math.floor(Math.random() * available.length)];
      hex.enemy = {
        name: ['Tiger', 'Gorilla', 'Giant Spider', 'Hyena'][Math.floor(Math.random() * 4)],
        health: 2 + game.expedition,
        damage: 1 + Math.floor(game.expedition / 2)
      };
    }
  }
}

function getHex(q, r) {
  return game.map.find(h => h.q === q && h.r === r);
}

function revealAround(q, r) {
  game.map.forEach(hex => {
    if (hexDistance(hex.q, hex.r, q, r) <= CONFIG.viewDistance) {
      hex.revealed = true;
    }
  });
}

// Companion class
class Companion {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.health = 3;
    this.maxHealth = 3;
    this.dice = type === 'warrior' ? 2 : 1;
    this.perks = [];

    if (type === 'scout') this.perks.push('explorer');
    if (type === 'translator') this.perks.push('diplomat');
  }
}

// Movement
function moveParty(targetQ, targetR) {
  const hex = getHex(targetQ, targetR);
  if (!hex || !hex.revealed) return false;
  if (!TERRAIN[hex.terrain].passable) return false;

  const dist = hexDistance(game.partyPos.q, game.partyPos.r, targetQ, targetR);
  if (dist !== 1) return false;

  // Calculate sanity cost
  const cost = CONFIG.baseTravelCost + TERRAIN[hex.terrain].cost;

  // Apply companion bonuses
  let modifiedCost = cost;
  game.companions.forEach(c => {
    if (c.perks.includes('explorer') && (hex.terrain === 'jungle' || hex.terrain === 'swamp')) {
      modifiedCost -= 2;
    }
  });

  modifiedCost = Math.max(1, modifiedCost);
  game.sanity = Math.max(0, game.sanity - modifiedCost);

  // Move
  game.partyPos = { q: targetQ, r: targetR };
  revealAround(targetQ, targetR);
  playSound('move');

  // Check for enemy
  if (hex.enemy) {
    startCombat(hex.enemy);
    return true;
  }

  // Check for location
  if (hex.location) {
    visitLocation(hex);
  }

  // Check zero sanity
  if (game.sanity <= 0) {
    checkInsanityEvent();
  }

  return true;
}

// Location visits
function visitLocation(hex) {
  const loc = LOCATIONS[hex.location];
  playSound(loc.isGoal ? 'pyramid' : 'location');

  // Gain sanity
  game.sanity = Math.min(game.maxSanity, game.sanity + loc.sanityGain);

  // Fame for finding pyramid
  if (loc.isGoal) {
    game.pyramidFound = true;
    game.fame += 100 * game.expedition;
    game.stats.pyramidsFound++;
    completeExpedition();
  }

  // Cave loot
  if (loc.hasLoot && Math.random() < 0.5) {
    game.items.push({ name: 'Treasure', value: 50 });
    game.fame += 20;
  }

  // Remove one-time locations
  if (loc.hasLoot) {
    hex.location = null;
  }
}

// Insanity events
function checkInsanityEvent() {
  if (game.sanity > 0) return;

  const roll = Math.random();
  if (roll < 0.3 && game.companions.length > 0) {
    // Companion leaves
    const idx = Math.floor(Math.random() * game.companions.length);
    const lost = game.companions.splice(idx, 1)[0];
    game.sanity = 20; // Slight recovery from loss
  } else if (roll < 0.5) {
    // Collapse - lose items
    if (game.items.length > 0) {
      game.items.pop();
    }
    game.sanity = 10;
  }
}

// Combat system
function startCombat(enemy) {
  game.inCombat = true;
  game.combatEnemy = { ...enemy };
  game.combatDice = [];
  rollCombatDice();
  playSound('combat');
}

function rollCombatDice() {
  game.combatDice = [];

  // Player always gets 2 dice
  let diceCount = 2;

  // Add companion dice
  game.companions.forEach(c => {
    if (c.health > 0) {
      diceCount += c.dice;
    }
  });

  for (let i = 0; i < diceCount; i++) {
    game.combatDice.push({
      value: Math.floor(Math.random() * 6) + 1,
      selected: false
    });
  }
}

function selectDie(index) {
  if (!game.inCombat) return;
  game.combatDice[index].selected = !game.combatDice[index].selected;
}

function attackEnemy() {
  if (!game.inCombat) return;

  const selectedDice = game.combatDice.filter(d => d.selected);
  if (selectedDice.length === 0) return;

  // Calculate attack power (sum of selected dice)
  const attackPower = selectedDice.reduce((sum, d) => sum + d.value, 0);
  const damage = Math.floor(attackPower / 5);

  game.combatEnemy.health -= Math.max(1, damage);
  playSound('combat');

  // Enemy counter-attack
  if (game.combatEnemy.health > 0) {
    const enemyDamage = game.combatEnemy.damage;
    // Damage goes to random companion or sanity
    if (game.companions.length > 0 && Math.random() < 0.5) {
      const target = game.companions[Math.floor(Math.random() * game.companions.length)];
      target.health -= enemyDamage;
      if (target.health <= 0) {
        game.companions = game.companions.filter(c => c !== target);
      }
    } else {
      game.sanity = Math.max(0, game.sanity - enemyDamage * 10);
    }
  }

  // Check combat end
  if (game.combatEnemy.health <= 0) {
    endCombat(true);
  } else {
    rollCombatDice();
  }
}

function fleeCombat() {
  if (!game.inCombat) return;

  // Flee costs sanity
  game.sanity = Math.max(0, game.sanity - 15);
  endCombat(false);
}

function endCombat(victory) {
  game.inCombat = false;

  if (victory) {
    game.fame += 10 * game.expedition;
    // Remove enemy from map
    const hex = getHex(game.partyPos.q, game.partyPos.r);
    if (hex) hex.enemy = null;
  }

  game.combatEnemy = null;
  game.combatDice = [];
}

// Expedition management
function completeExpedition() {
  game.stats.expeditionsCompleted++;

  if (game.expedition >= CONFIG.expeditionsToWin) {
    game.state = 'victory';
    game.stats.victories++;
  } else {
    game.expedition++;
    game.sanity = CONFIG.baseSanity;
    game.pyramidFound = false;

    // Add new companion
    const types = ['warrior', 'scout', 'translator'];
    game.companions.push(new Companion(
      `Companion ${game.companions.length + 1}`,
      types[Math.floor(Math.random() * types.length)]
    ));

    generateMap();
  }

  saveStats();
}

// Start game
function startGame() {
  game.state = 'playing';
  game.expedition = 1;
  game.fame = 0;
  game.sanity = CONFIG.baseSanity;
  game.maxSanity = CONFIG.baseSanity;
  game.items = [];
  game.companions = [new Companion('Scout', 'scout')];
  game.pyramidFound = false;
  game.inCombat = false;
  game.stats.gamesPlayed++;
  saveStats();
  generateMap();
}

// Drawing functions
function drawHex(x, y, size, color, stroke) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const hx = x + size * Math.cos(angle);
    const hy = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawMap() {
  game.map.forEach(hex => {
    const { x, y } = hexToPixel(hex.q, hex.r);

    if (!hex.revealed) {
      drawHex(x, y, CONFIG.hexSize - 1, COLORS.fog, '#333');
      return;
    }

    // Terrain
    drawHex(x, y, CONFIG.hexSize - 1, TERRAIN[hex.terrain].color, '#222');

    // Location
    if (hex.location) {
      const loc = LOCATIONS[hex.location];
      ctx.fillStyle = loc.color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(loc.symbol, x, y);
    }

    // Enemy
    if (hex.enemy) {
      ctx.fillStyle = COLORS.dangerRed;
      ctx.beginPath();
      ctx.arc(x, y - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.fillText('!', x, y - 5);
    }
  });

  // Draw party
  const partyPixel = hexToPixel(game.partyPos.q, game.partyPos.r);
  ctx.fillStyle = COLORS.party;
  ctx.beginPath();
  ctx.arc(partyPixel.x, partyPixel.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Highlight moveable hexes
  const neighbors = getNeighbors(game.partyPos.q, game.partyPos.r);
  neighbors.forEach(n => {
    const hex = getHex(n.q, n.r);
    if (hex && hex.revealed && TERRAIN[hex.terrain].passable) {
      const { x, y } = hexToPixel(n.q, n.r);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, CONFIG.hexSize - 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawUI() {
  // Stats panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(600, 10, 190, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';

  ctx.fillText(`Expedition: ${game.expedition}/${CONFIG.expeditionsToWin}`, 610, 35);
  ctx.fillText(`Fame: ${game.fame}`, 610, 55);

  // Sanity bar
  ctx.fillStyle = COLORS.dangerRed;
  ctx.fillRect(610, 70, 170 * (game.sanity / game.maxSanity), 15);
  ctx.strokeStyle = COLORS.text;
  ctx.strokeRect(610, 70, 170, 15);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Sanity: ${Math.floor(game.sanity)}`, 610, 105);

  // Companions
  ctx.fillText('Party:', 610, 130);
  game.companions.forEach((c, i) => {
    ctx.fillStyle = c.health > 0 ? COLORS.text : COLORS.dangerRed;
    ctx.fillText(`${c.name} (${c.type}) HP:${c.health}`, 615, 150 + i * 18);
  });

  // Items
  ctx.fillStyle = COLORS.goldAccent;
  ctx.fillText(`Items: ${game.items.length}`, 610, 195);
}

function drawCombat() {
  // Combat overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(100, 100, 600, 400);
  ctx.strokeStyle = COLORS.dangerRed;
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 100, 600, 400);

  ctx.fillStyle = COLORS.text;
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('COMBAT!', 400, 140);

  // Enemy info
  ctx.font = '18px monospace';
  ctx.fillStyle = COLORS.dangerRed;
  ctx.fillText(`${game.combatEnemy.name}`, 400, 180);
  ctx.fillText(`Health: ${game.combatEnemy.health}`, 400, 210);

  // Dice
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  ctx.fillText('Your Dice (click to select, then Attack):', 400, 260);

  game.combatDice.forEach((die, i) => {
    const x = 200 + i * 70;
    const y = 290;

    ctx.fillStyle = die.selected ? COLORS.goldAccent : '#444';
    ctx.fillRect(x, y, 50, 50);
    ctx.strokeStyle = die.selected ? '#fff' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 50, 50);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(die.value.toString(), x + 25, y + 35);
  });

  // Instructions
  ctx.font = '14px monospace';
  ctx.fillStyle = COLORS.text;
  ctx.fillText('Selected dice power determines damage (sum/5)', 400, 380);

  // Buttons
  ctx.fillStyle = COLORS.grassland;
  ctx.fillRect(250, 410, 100, 40);
  ctx.fillStyle = COLORS.dangerRed;
  ctx.fillRect(450, 410, 100, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('ATTACK', 300, 435);
  ctx.fillText('FLEE', 500, 435);
}

function drawMenu() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = COLORS.goldAccent;
  ctx.font = '36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CURIOUS EXPEDITION', canvas.width/2, 120);

  ctx.font = '18px monospace';
  ctx.fillStyle = COLORS.parchment;
  ctx.fillText('Hex Exploration Roguelike', canvas.width/2, 160);

  // Instructions
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  const lines = [
    'Press ENTER to Start',
    '',
    'Explore the map to find the Golden Pyramid',
    'Manage your sanity - travel costs sanity!',
    'Visit villages and shrines to recover',
    'Fight enemies or flee from them',
    `Complete ${CONFIG.expeditionsToWin} expeditions to win`,
    '',
    'Controls:',
    'CLICK on adjacent hex to move',
    'CLICK dice in combat to select',
    'ENTER to attack, ESC to flee'
  ];

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width/2, 220 + i * 24);
  });

  // Stats
  ctx.fillStyle = COLORS.goldAccent;
  ctx.font = '12px monospace';
  ctx.fillText(`Games: ${game.stats.gamesPlayed} | Expeditions: ${game.stats.expeditionsCompleted} | Victories: ${game.stats.victories}`, canvas.width/2, 550);
}

function drawGameOver() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.dangerRed;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXPEDITION FAILED', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '18px monospace';
  ctx.fillText(`You ran out of sanity!`, canvas.width/2, 280);
  ctx.fillText(`Final Fame: ${game.fame}`, canvas.width/2, 320);
  ctx.fillText(`Expeditions: ${game.expedition}/${CONFIG.expeditionsToWin}`, canvas.width/2, 350);

  ctx.fillStyle = COLORS.goldAccent;
  ctx.fillText('Press ENTER to try again', canvas.width/2, 420);
}

function drawVictory() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.goldAccent;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXPEDITION COMPLETE!', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '18px monospace';
  ctx.fillText('You found all the Golden Pyramids!', canvas.width/2, 280);
  ctx.fillText(`Final Fame: ${game.fame}`, canvas.width/2, 320);
  ctx.fillText(`Pyramids Found: ${game.stats.pyramidsFound}`, canvas.width/2, 350);

  ctx.fillStyle = COLORS.parchment;
  ctx.fillText('Press ENTER to play again', canvas.width/2, 420);
}

function draw() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  switch(game.state) {
    case 'menu':
      drawMenu();
      break;
    case 'playing':
      drawMap();
      drawUI();
      if (game.inCombat) {
        drawCombat();
      }
      break;
    case 'gameover':
      drawGameOver();
      break;
    case 'victory':
      drawVictory();
      break;
  }
}

// Input handling
document.addEventListener('keydown', e => {
  if (e.code === 'Enter') {
    if (game.state === 'menu' || game.state === 'gameover' || game.state === 'victory') {
      startGame();
    } else if (game.inCombat) {
      attackEnemy();
    }
  }

  if (e.code === 'Escape') {
    if (game.inCombat) {
      fleeCombat();
    } else if (game.state !== 'menu') {
      game.state = 'menu';
    }
  }
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (game.state === 'playing') {
    if (game.inCombat) {
      // Check dice clicks
      game.combatDice.forEach((die, i) => {
        const dx = 200 + i * 70;
        const dy = 290;
        if (x >= dx && x < dx + 50 && y >= dy && y < dy + 50) {
          selectDie(i);
        }
      });

      // Check button clicks
      if (x >= 250 && x < 350 && y >= 410 && y < 450) {
        attackEnemy();
      }
      if (x >= 450 && x < 550 && y >= 410 && y < 450) {
        fleeCombat();
      }
    } else {
      // Check hex clicks
      const clicked = pixelToHex(x, y);
      const dist = hexDistance(game.partyPos.q, game.partyPos.r, clicked.q, clicked.r);
      if (dist === 1) {
        moveParty(clicked.q, clicked.r);
      }
    }
  }

  // Check game over condition
  if (game.state === 'playing' && game.sanity <= 0 && !game.inCombat && game.companions.length === 0) {
    game.state = 'gameover';
    playSound('death');
    saveStats();
  }
});

// Game loop
function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}

// Expose game for testing
window.game = game;

// Start
requestAnimationFrame(gameLoop);
