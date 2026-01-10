// X-COM Clone - Turn-Based Tactical Combat
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 900, HEIGHT = 700;
const TILE = 32, MAP_W = 20, MAP_H = 15;
const MAP_OFFSET_X = 50, MAP_OFFSET_Y = 80;

const COLORS = {
  bg: '#0a0a0a', grid: '#1a1a1a', gridLine: '#222',
  soldier: '#4488ff', enemy: '#ff4444', selected: '#00ff00',
  cover: '#888844', wall: '#444', floor: '#1a1a1a',
  move: 'rgba(0,255,0,0.2)', attack: 'rgba(255,0,0,0.2)',
  fog: 'rgba(0,0,0,0.7)', ui: '#0a1a0a'
};

window.gameState = {
  scene: 'menu', turn: 'player', selectedUnit: null,
  soldiers: [], enemies: [], map: [], mission: 1,
  phase: 'move', cursorX: 0, cursorY: 0,
  log: [], achievements: {}, settings: { sfx: true }
};

const WEAPONS = {
  pistol: { name: 'Pistol', damage: 26, snapTU: 18, snapAcc: 30, aimedTU: 30, aimedAcc: 78, ammo: 12 },
  rifle: { name: 'Rifle', damage: 30, snapTU: 25, snapAcc: 60, aimedTU: 80, aimedAcc: 110, autoTU: 35, autoAcc: 35, ammo: 20 },
  heavyCannon: { name: 'Heavy Cannon', damage: 56, snapTU: 33, snapAcc: 60, aimedTU: 80, aimedAcc: 90, ammo: 6 },
  laser: { name: 'Laser Rifle', damage: 60, snapTU: 25, snapAcc: 65, aimedTU: 50, aimedAcc: 100, ammo: 999 },
  plasma: { name: 'Plasma Rifle', damage: 80, snapTU: 30, snapAcc: 86, aimedTU: 60, aimedAcc: 100, ammo: 28 }
};

const SOLDIER_TEMPLATES = [
  { name: 'Rookie', tu: 55, hp: 30, reactions: 40, accuracy: 50, armor: 0 },
  { name: 'Squaddie', tu: 60, hp: 35, reactions: 50, accuracy: 60, armor: 10 },
  { name: 'Sergeant', tu: 65, hp: 40, reactions: 60, accuracy: 70, armor: 20 },
  { name: 'Captain', tu: 70, hp: 45, reactions: 70, accuracy: 80, armor: 30 }
];

const ENEMY_TYPES = {
  sectoid: { name: 'Sectoid', hp: 30, tu: 54, reactions: 63, accuracy: 50, armor: 4, weapon: 'pistol', color: '#88ff88' },
  floater: { name: 'Floater', hp: 40, tu: 55, reactions: 60, accuracy: 45, armor: 8, weapon: 'plasma', color: '#ff88ff' },
  muton: { name: 'Muton', hp: 125, tu: 60, reactions: 70, accuracy: 65, armor: 32, weapon: 'plasma', color: '#ff8844' },
  snakeman: { name: 'Snakeman', hp: 50, tu: 45, reactions: 60, accuracy: 70, armor: 20, weapon: 'plasma', color: '#44ff44' }
};

const TERRAIN = {
  floor: { walkable: true, cover: 0, tu: 4, color: COLORS.floor },
  wall: { walkable: false, cover: 100, tu: 999, color: COLORS.wall },
  cover: { walkable: true, cover: 40, tu: 6, color: COLORS.cover },
  rubble: { walkable: true, cover: 20, tu: 6, color: '#553' }
};

let particles = [], shake = { x: 0, y: 0, intensity: 0 };
let audioCtx = null;

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type, vol = 0.12) {
  if (!audioCtx || !window.gameState.settings.sfx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime; gain.gain.setValueAtTime(vol, now);
  if (type === 'shoot') { osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12); osc.start(now); osc.stop(now + 0.12); }
  else if (type === 'hit') { osc.frequency.setValueAtTime(100, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); }
  else if (type === 'select') { osc.frequency.setValueAtTime(800, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05); }
  else if (type === 'move') { osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08); osc.start(now); osc.stop(now + 0.08); }
}

function saveGame() {
  localStorage.setItem('xcomClone', JSON.stringify({ mission: window.gameState.mission, achievements: window.gameState.achievements }));
}
window.saveGame = saveGame;

function loadGame() {
  const data = localStorage.getItem('xcomClone');
  if (data) { const saved = JSON.parse(data); window.gameState.mission = saved.mission || 1; window.gameState.achievements = saved.achievements || {}; return true; }
  return false;
}
window.loadGame = loadGame;

class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size; this.life = this.maxLife = life;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; return this.life > 0; }
  draw() {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 2 + Math.random() * 3, 0.3 + Math.random() * 0.2));
  }
}

function generateMap() {
  const s = window.gameState;
  s.map = [];
  for (let y = 0; y < MAP_H; y++) {
    s.map[y] = [];
    for (let x = 0; x < MAP_W; x++) {
      const r = Math.random();
      if (r < 0.1) s.map[y][x] = 'wall';
      else if (r < 0.2) s.map[y][x] = 'cover';
      else if (r < 0.25) s.map[y][x] = 'rubble';
      else s.map[y][x] = 'floor';
    }
  }
  // Clear spawn areas
  for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) s.map[y][x] = 'floor';
  for (let y = MAP_H - 3; y < MAP_H; y++) for (let x = MAP_W - 5; x < MAP_W; x++) s.map[y][x] = 'floor';
}

function createSoldier(template, x, y) {
  const t = SOLDIER_TEMPLATES[template];
  return {
    name: t.name + ' ' + Math.floor(Math.random() * 100),
    x, y, tu: t.tu, maxTu: t.tu, hp: t.hp, maxHp: t.hp,
    reactions: t.reactions, accuracy: t.accuracy, armor: t.armor,
    weapon: 'rifle', ammo: WEAPONS.rifle.ammo, kneeling: false, alive: true
  };
}

function createEnemy(type, x, y) {
  const t = ENEMY_TYPES[type];
  return {
    type, name: t.name, x, y, tu: t.tu, maxTu: t.tu, hp: t.hp, maxHp: t.hp,
    reactions: t.reactions, accuracy: t.accuracy, armor: t.armor,
    weapon: t.weapon, ammo: 50, color: t.color, alive: true
  };
}

function startMission() {
  const s = window.gameState;
  s.scene = 'game'; s.turn = 'player'; s.selectedUnit = null;
  s.soldiers = []; s.enemies = []; s.log = [];
  
  generateMap();
  
  // Spawn soldiers
  const soldierCount = Math.min(4, 2 + Math.floor(s.mission / 2));
  for (let i = 0; i < soldierCount; i++) {
    const rank = Math.min(i, SOLDIER_TEMPLATES.length - 1);
    s.soldiers.push(createSoldier(rank, 1 + i, 1));
  }
  
  // Spawn enemies
  const enemyTypes = ['sectoid'];
  if (s.mission >= 2) enemyTypes.push('floater');
  if (s.mission >= 3) enemyTypes.push('snakeman');
  if (s.mission >= 4) enemyTypes.push('muton');
  
  const enemyCount = 3 + s.mission;
  for (let i = 0; i < enemyCount; i++) {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const x = MAP_W - 4 + Math.floor(Math.random() * 3);
    const y = MAP_H - 4 + Math.floor(Math.random() * 3);
    s.enemies.push(createEnemy(type, x, y));
  }
  
  addLog('Mission ' + s.mission + ' started. ' + soldierCount + ' soldiers deployed.');
}

function addLog(msg) {
  window.gameState.log.unshift(msg);
  if (window.gameState.log.length > 5) window.gameState.log.pop();
}

function getTileAt(x, y) {
  const s = window.gameState;
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 'wall';
  return s.map[y][x];
}

function getUnitAt(x, y) {
  const s = window.gameState;
  for (const sol of s.soldiers) if (sol.alive && sol.x === x && sol.y === y) return sol;
  for (const en of s.enemies) if (en.alive && en.x === x && en.y === y) return en;
  return null;
}

function canWalk(x, y) {
  const tile = getTileAt(x, y);
  return TERRAIN[tile].walkable && !getUnitAt(x, y);
}

function getMoveCost(x, y) {
  const tile = getTileAt(x, y);
  return TERRAIN[tile].tu;
}

function getCover(x, y) {
  const tile = getTileAt(x, y);
  return TERRAIN[tile].cover;
}

function hasLineOfSight(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy, x = x1, y = y1;
  
  while (x !== x2 || y !== y2) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    if (x === x2 && y === y2) break;
    if (getTileAt(x, y) === 'wall') return false;
  }
  return true;
}

function calculateHitChance(attacker, target, shotType) {
  const weapon = WEAPONS[attacker.weapon];
  const baseAcc = shotType === 'aimed' ? weapon.aimedAcc : weapon.snapAcc;
  const acc = attacker.accuracy / 100;
  const cover = getCover(target.x, target.y);
  const dist = Math.sqrt(Math.pow(target.x - attacker.x, 2) + Math.pow(target.y - attacker.y, 2));
  const rangePenalty = Math.max(0, (dist - 5) * 2);
  
  let chance = (baseAcc * acc) - cover - rangePenalty;
  if (attacker.kneeling) chance *= 1.15;
  
  return Math.max(5, Math.min(95, Math.floor(chance)));
}

function attack(attacker, target, shotType) {
  const s = window.gameState;
  const weapon = WEAPONS[attacker.weapon];
  const tuCost = shotType === 'aimed' ? weapon.aimedTU : weapon.snapTU;
  
  if (attacker.tu < tuCost) { addLog('Not enough TU!'); return false; }
  if (!hasLineOfSight(attacker.x, attacker.y, target.x, target.y)) { addLog('No line of sight!'); return false; }
  
  attacker.tu -= tuCost;
  attacker.ammo--;
  
  const hitChance = calculateHitChance(attacker, target, shotType);
  const roll = Math.random() * 100;
  
  playSound('shoot');
  
  const sx = MAP_OFFSET_X + attacker.x * TILE + TILE / 2;
  const sy = MAP_OFFSET_Y + attacker.y * TILE + TILE / 2;
  const tx = MAP_OFFSET_X + target.x * TILE + TILE / 2;
  const ty = MAP_OFFSET_Y + target.y * TILE + TILE / 2;
  spawnParticles(sx, sy, 5, '#ff0');
  
  if (roll < hitChance) {
    // Hit!
    const baseDamage = weapon.damage;
    const damageRoll = baseDamage * (0.5 + Math.random() * 1.5);
    const finalDamage = Math.max(1, Math.floor(damageRoll - target.armor));
    
    target.hp -= finalDamage;
    spawnParticles(tx, ty, 10, '#f00');
    playSound('hit');
    shake.intensity = 8;
    
    addLog((attacker.name || 'Unit') + ' hits ' + target.name + ' for ' + finalDamage + ' damage!');
    
    if (target.hp <= 0) {
      target.alive = false;
      addLog(target.name + ' is killed!');
      spawnParticles(tx, ty, 20, '#f00');
      shake.intensity = 15;
    }
    
    return true;
  } else {
    addLog((attacker.name || 'Unit') + ' misses ' + target.name + '! (' + Math.floor(roll) + ' vs ' + hitChance + ')');
    return false;
  }
}

function moveUnit(unit, tx, ty) {
  const s = window.gameState;
  const cost = getMoveCost(tx, ty);
  
  if (!canWalk(tx, ty)) return false;
  if (unit.tu < cost) { addLog('Not enough TU!'); return false; }
  
  // Check for reaction fire
  const opponents = unit === s.soldiers.find(sol => sol === unit) ? s.enemies : s.soldiers;
  for (const opp of opponents) {
    if (!opp.alive || opp.tu < 10) continue;
    if (!hasLineOfSight(opp.x, opp.y, unit.x, unit.y)) continue;
    
    const reactionChance = opp.reactions / 100;
    if (Math.random() < reactionChance * 0.3) {
      addLog(opp.name + ' takes reaction fire!');
      attack(opp, unit, 'snap');
      if (!unit.alive) return false;
    }
  }
  
  unit.tu -= cost;
  unit.x = tx; unit.y = ty;
  playSound('move');
  return true;
}

function endPlayerTurn() {
  const s = window.gameState;
  s.turn = 'enemy';
  s.selectedUnit = null;
  addLog('Enemy turn...');
  
  // AI turn
  setTimeout(executeEnemyTurn, 500);
}

function executeEnemyTurn() {
  const s = window.gameState;
  
  for (const enemy of s.enemies) {
    if (!enemy.alive) continue;
    enemy.tu = enemy.maxTu;
    
    // Find nearest soldier
    let nearest = null, minDist = Infinity;
    for (const sol of s.soldiers) {
      if (!sol.alive) continue;
      const dist = Math.abs(sol.x - enemy.x) + Math.abs(sol.y - enemy.y);
      if (dist < minDist) { minDist = dist; nearest = sol; }
    }
    
    if (!nearest) continue;
    
    // Try to attack if in range
    if (hasLineOfSight(enemy.x, enemy.y, nearest.x, nearest.y) && minDist < 15) {
      while (enemy.tu >= 30 && enemy.ammo > 0) {
        attack(enemy, nearest, 'snap');
        if (!nearest.alive) {
          // Find new target
          nearest = null;
          for (const sol of s.soldiers) {
            if (!sol.alive) continue;
            const dist = Math.abs(sol.x - enemy.x) + Math.abs(sol.y - enemy.y);
            if (!nearest || dist < minDist) { minDist = dist; nearest = sol; }
          }
          if (!nearest) break;
        }
      }
    } else {
      // Move toward target
      const dx = Math.sign(nearest.x - enemy.x);
      const dy = Math.sign(nearest.y - enemy.y);
      
      for (let i = 0; i < 5 && enemy.tu >= 4; i++) {
        let moved = false;
        if (dx !== 0 && canWalk(enemy.x + dx, enemy.y)) {
          moveUnit(enemy, enemy.x + dx, enemy.y);
          moved = true;
        } else if (dy !== 0 && canWalk(enemy.x, enemy.y + dy)) {
          moveUnit(enemy, enemy.x, enemy.y + dy);
          moved = true;
        }
        if (!moved) break;
      }
    }
  }
  
  // Check win/lose
  const soldiersAlive = s.soldiers.filter(sol => sol.alive).length;
  const enemiesAlive = s.enemies.filter(en => en.alive).length;
  
  if (soldiersAlive === 0) {
    s.scene = 'gameover';
    addLog('Mission failed!');
  } else if (enemiesAlive === 0) {
    s.mission++;
    saveGame();
    s.scene = 'victory';
    addLog('Mission complete!');
  } else {
    // Start new player turn
    s.turn = 'player';
    for (const sol of s.soldiers) if (sol.alive) sol.tu = sol.maxTu;
    addLog('Your turn. ' + soldiersAlive + ' soldiers remaining.');
  }
}

canvas.addEventListener('click', e => {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  
  const s = window.gameState;
  
  if (s.scene === 'menu') {
    if (my > 300 && my < 360) startMission();
  } else if (s.scene === 'gameover' || s.scene === 'victory') {
    if (s.scene === 'victory') startMission();
    else s.scene = 'menu';
  } else if (s.scene === 'game' && s.turn === 'player') {
    const gx = Math.floor((mx - MAP_OFFSET_X) / TILE);
    const gy = Math.floor((my - MAP_OFFSET_Y) / TILE);
    
    if (gx >= 0 && gx < MAP_W && gy >= 0 && gy < MAP_H) {
      const unit = getUnitAt(gx, gy);
      
      if (unit && s.soldiers.includes(unit) && unit.alive) {
        s.selectedUnit = unit;
        s.phase = 'move';
        playSound('select');
      } else if (s.selectedUnit) {
        if (unit && s.enemies.includes(unit) && unit.alive) {
          // Attack
          attack(s.selectedUnit, unit, keys['shift'] ? 'aimed' : 'snap');
        } else if (canWalk(gx, gy)) {
          // Move
          moveUnit(s.selectedUnit, gx, gy);
        }
      }
    }
    
    // End turn button
    if (mx > WIDTH - 120 && mx < WIDTH - 20 && my > HEIGHT - 50 && my < HEIGHT - 10) {
      endPlayerTurn();
    }
  }
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  
  const s = window.gameState;
  s.cursorX = Math.floor((mx - MAP_OFFSET_X) / TILE);
  s.cursorY = Math.floor((my - MAP_OFFSET_Y) / TILE);
});

let keys = {};
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function update(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }
  
  if (shake.intensity > 0) {
    shake.x = (Math.random() - 0.5) * shake.intensity;
    shake.y = (Math.random() - 0.5) * shake.intensity;
    shake.intensity *= 0.9;
    if (shake.intensity < 0.5) shake.intensity = 0;
  }
}

function drawMap() {
  const s = window.gameState;
  
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = s.map[y][x];
      const px = MAP_OFFSET_X + x * TILE;
      const py = MAP_OFFSET_Y + y * TILE;
      
      ctx.fillStyle = TERRAIN[tile].color;
      ctx.fillRect(px, py, TILE - 1, TILE - 1);
      
      // Highlight cursor
      if (x === s.cursorX && y === s.cursorY) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, TILE - 1, TILE - 1);
      }
    }
  }
  
  // Move range
  if (s.selectedUnit && s.turn === 'player') {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (canWalk(x, y)) {
          const cost = getMoveCost(x, y);
          if (cost <= s.selectedUnit.tu) {
            ctx.fillStyle = COLORS.move;
            ctx.fillRect(MAP_OFFSET_X + x * TILE, MAP_OFFSET_Y + y * TILE, TILE - 1, TILE - 1);
          }
        }
      }
    }
  }
}

function drawUnits() {
  const s = window.gameState;
  
  // Draw soldiers
  for (const sol of s.soldiers) {
    if (!sol.alive) continue;
    const px = MAP_OFFSET_X + sol.x * TILE + TILE / 2;
    const py = MAP_OFFSET_Y + sol.y * TILE + TILE / 2;
    
    ctx.fillStyle = s.selectedUnit === sol ? COLORS.selected : COLORS.soldier;
    ctx.beginPath();
    ctx.arc(px, py, TILE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(px - 12, py - 18, 24, 4);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(px - 12, py - 18, 24 * (sol.hp / sol.maxHp), 4);
  }
  
  // Draw enemies
  for (const en of s.enemies) {
    if (!en.alive) continue;
    const px = MAP_OFFSET_X + en.x * TILE + TILE / 2;
    const py = MAP_OFFSET_Y + en.y * TILE + TILE / 2;
    
    ctx.fillStyle = en.color;
    ctx.beginPath();
    ctx.moveTo(px, py - TILE / 2 + 4);
    ctx.lineTo(px + TILE / 2 - 4, py + TILE / 2 - 4);
    ctx.lineTo(px - TILE / 2 + 4, py + TILE / 2 - 4);
    ctx.closePath();
    ctx.fill();
    
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(px - 12, py - 18, 24, 4);
    ctx.fillStyle = '#f00';
    ctx.fillRect(px - 12, py - 18, 24 * (en.hp / en.maxHp), 4);
  }
}

function drawHUD() {
  const s = window.gameState;
  
  // Top bar
  ctx.fillStyle = COLORS.ui;
  ctx.fillRect(0, 0, WIDTH, 70);
  
  ctx.fillStyle = '#0f0';
  ctx.font = '14px "Share Tech Mono"';
  ctx.fillText('MISSION ' + s.mission, 20, 25);
  ctx.fillText('TURN: ' + s.turn.toUpperCase(), 20, 45);
  
  const soldiersAlive = s.soldiers.filter(sol => sol.alive).length;
  const enemiesAlive = s.enemies.filter(en => en.alive).length;
  ctx.fillText('SOLDIERS: ' + soldiersAlive, 200, 25);
  ctx.fillText('ENEMIES: ' + enemiesAlive, 200, 45);
  
  // Selected unit info
  if (s.selectedUnit) {
    ctx.fillText('SELECTED: ' + s.selectedUnit.name, 400, 25);
    ctx.fillText('TU: ' + s.selectedUnit.tu + '/' + s.selectedUnit.maxTu, 400, 45);
    ctx.fillText('HP: ' + s.selectedUnit.hp + '/' + s.selectedUnit.maxHp, 600, 25);
    ctx.fillText('ACC: ' + s.selectedUnit.accuracy + '%', 600, 45);
  }
  
  // Target info
  if (s.cursorX >= 0 && s.cursorX < MAP_W && s.cursorY >= 0 && s.cursorY < MAP_H) {
    const target = getUnitAt(s.cursorX, s.cursorY);
    if (target && s.selectedUnit && s.enemies.includes(target)) {
      const hitChance = calculateHitChance(s.selectedUnit, target, keys['shift'] ? 'aimed' : 'snap');
      ctx.fillStyle = '#ff0';
      ctx.fillText('HIT: ' + hitChance + '% (Shift for aimed)', 700, 62);
    }
  }
  
  // Combat log
  ctx.fillStyle = 'rgba(10, 26, 10, 0.9)';
  ctx.fillRect(0, HEIGHT - 100, 350, 100);
  ctx.fillStyle = '#0f0';
  ctx.font = '11px "Share Tech Mono"';
  for (let i = 0; i < Math.min(5, s.log.length); i++) {
    ctx.fillText(s.log[i], 10, HEIGHT - 85 + i * 18);
  }
  
  // End turn button
  if (s.turn === 'player') {
    ctx.fillStyle = '#040';
    ctx.fillRect(WIDTH - 120, HEIGHT - 50, 100, 40);
    ctx.strokeStyle = '#0f0';
    ctx.strokeRect(WIDTH - 120, HEIGHT - 50, 100, 40);
    ctx.fillStyle = '#0f0';
    ctx.font = '12px "Share Tech Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('END TURN', WIDTH - 70, HEIGHT - 25);
    ctx.textAlign = 'left';
  }
}

function drawMenu() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#0f0';
  ctx.font = '36px "Share Tech Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('X-COM CLONE', WIDTH / 2, 150);
  
  ctx.font = '18px "Share Tech Mono"';
  ctx.fillText('Tactical Combat Simulator', WIDTH / 2, 200);
  
  ctx.font = '14px "Share Tech Mono"';
  ctx.fillText('5 Weapons • 4 Enemy Types • Turn-Based Combat', WIDTH / 2, 260);
  
  ctx.fillStyle = '#040';
  ctx.fillRect(WIDTH / 2 - 100, 300, 200, 60);
  ctx.strokeStyle = '#0f0';
  ctx.strokeRect(WIDTH / 2 - 100, 300, 200, 60);
  ctx.fillStyle = '#0f0';
  ctx.fillText('START MISSION', WIDTH / 2, 338);
  
  ctx.font = '12px "Share Tech Mono"';
  ctx.fillStyle = '#080';
  ctx.fillText('Click soldiers to select', WIDTH / 2, 420);
  ctx.fillText('Click tiles to move, enemies to attack', WIDTH / 2, 445);
  ctx.fillText('Hold SHIFT for aimed shot (+accuracy, +TU)', WIDTH / 2, 470);
  
  ctx.textAlign = 'left';
}

function drawGame() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  drawMap();
  drawUnits();
  particles.forEach(p => p.draw());
  drawHUD();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#f00';
  ctx.font = '36px "Share Tech Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('MISSION FAILED', WIDTH / 2, 250);
  
  ctx.fillStyle = '#fff';
  ctx.font = '18px "Share Tech Mono"';
  ctx.fillText('All soldiers KIA', WIDTH / 2, 320);
  ctx.fillText('Click to return to menu', WIDTH / 2, 380);
  ctx.textAlign = 'left';
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#0f0';
  ctx.font = '36px "Share Tech Mono"';
  ctx.textAlign = 'center';
  ctx.fillText('MISSION COMPLETE', WIDTH / 2, 250);
  
  ctx.fillStyle = '#fff';
  ctx.font = '18px "Share Tech Mono"';
  ctx.fillText('All hostiles eliminated', WIDTH / 2, 320);
  ctx.fillText('Click to start next mission', WIDTH / 2, 380);
  ctx.textAlign = 'left';
}

function render() {
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const s = window.gameState;
  if (s.scene === 'menu') drawMenu();
  else if (s.scene === 'game') drawGame();
  else if (s.scene === 'gameover') drawGameOver();
  else if (s.scene === 'victory') drawVictory();
  
  ctx.restore();
}

let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  
  update(dt);
  render();
  
  requestAnimationFrame(gameLoop);
}

// Expose for testing
window.WEAPONS = WEAPONS;
window.ENEMY_TYPES = ENEMY_TYPES;
window.SOLDIER_TEMPLATES = SOLDIER_TEMPLATES;
window.particles = particles;

loadGame();
requestAnimationFrame(gameLoop);
