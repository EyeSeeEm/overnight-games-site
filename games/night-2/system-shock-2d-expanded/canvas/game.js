// System Shock 2D EXPANDED - Survival Horror Shooter
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 900, HEIGHT = 650;

const COLORS = {
  bg: '#0a0a12', player: '#4488ff', bullet: '#ffff88', energy: '#4488ff',
  health: '#ff4444', green: '#00ff00', red: '#ff0000', cyan: '#00ffff',
  yellow: '#ffff00', purple: '#aa44aa', orange: '#ff8800', white: '#ffffff',
  dark: '#1a1a24', grid: '#1a2a1a', hack: '#00ff44'
};

window.gameState = {
  scene: 'menu', level: 1, score: 0, highScore: 0,
  hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, armor: 0,
  weapon: 0, ammo: [50, 20, 10, 5, 3, 1], // per weapon
  credits: 0, keycards: [], xp: 0, skillPoints: 0,
  upgrades: {}, achievements: {},
  hackingActive: false, hackSuccess: 0,
  settings: { sfx: true }, kills: 0, totalKills: 0
};

const WEAPONS = [
  { name: 'Pistol', damage: 15, fireRate: 200, spread: 2, color: '#ff0', ammoMax: 100, auto: false },
  { name: 'SMG', damage: 8, fireRate: 80, spread: 8, color: '#ff8', ammoMax: 200, auto: true },
  { name: 'Shotgun', damage: 40, fireRate: 600, spread: 20, pellets: 5, color: '#f80', ammoMax: 30, auto: false },
  { name: 'Rifle', damage: 50, fireRate: 400, spread: 1, color: '#0ff', ammoMax: 20, auto: false },
  { name: 'Plasma', damage: 35, fireRate: 150, spread: 3, color: '#f0f', ammoMax: 50, auto: true },
  { name: 'Laser', damage: 100, fireRate: 1000, spread: 0, color: '#f00', ammoMax: 10, auto: false }
];

const ENEMIES = {
  drone: { hp: 30, speed: 80, damage: 5, size: 12, color: '#4f4', score: 50, xp: 10 },
  soldier: { hp: 60, speed: 60, damage: 10, size: 16, color: '#4a4', score: 100, xp: 20, shoots: true },
  mutant: { hp: 45, speed: 100, damage: 15, size: 14, color: '#a4a', score: 75, xp: 15 },
  brute: { hp: 150, speed: 40, damage: 25, size: 24, color: '#a0a', score: 200, xp: 40 },
  robot: { hp: 100, speed: 50, damage: 20, size: 20, color: '#aaa', score: 150, xp: 30, shoots: true },
  assassin: { hp: 40, speed: 150, damage: 30, size: 12, color: '#0f0', score: 175, xp: 35 },
  heavy: { hp: 200, speed: 30, damage: 35, size: 28, color: '#666', score: 300, xp: 50, shoots: true },
  shodan: { hp: 1000, speed: 60, damage: 50, size: 40, color: '#f0f', score: 5000, xp: 500, boss: true, shoots: true }
};

const UPGRADES = {
  maxHp: { name: 'Health+', cost: 100, maxLevel: 5, effect: 25 },
  maxEnergy: { name: 'Energy+', cost: 100, maxLevel: 5, effect: 25 },
  damage: { name: 'Damage+', cost: 150, maxLevel: 5, effect: 1.1 },
  armor: { name: 'Armor', cost: 200, maxLevel: 3, effect: 10 },
  speed: { name: 'Speed+', cost: 120, maxLevel: 3, effect: 1.1 },
  hacking: { name: 'Hacking+', cost: 250, maxLevel: 3, effect: 1 }
};

const ACHIEVEMENTS = {
  firstKill: { name: 'First Blood', desc: 'Kill your first enemy', icon: '💀' },
  massacre: { name: 'Massacre', desc: 'Kill 100 enemies', icon: '☠️' },
  survivor: { name: 'Survivor', desc: 'Reach level 5', icon: '🏆' },
  hacker: { name: 'Hacker', desc: 'Complete 10 hacks', icon: '💻' },
  shodanSlayer: { name: 'SHODAN Slayer', desc: 'Defeat SHODAN', icon: '👾' },
  collector: { name: 'Collector', desc: 'Collect all keycards', icon: '🔑' }
};

let player = { x: WIDTH / 2, y: HEIGHT / 2, angle: 0, speed: 200, invuln: 0 };
let bullets = [], enemies = [], enemyBullets = [], particles = [], items = [];
let keys = {}, mouse = { x: 0, y: 0, down: false };
let lastShot = 0, waveTimer = 0, currentWave = 0, enemiesRemaining = 0;
let audioCtx = null, shake = { x: 0, y: 0, intensity: 0 };
let hackGrid = [], hackPath = [], hackTimer = 0;

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type, vol = 0.15) {
  if (!audioCtx || !window.gameState.settings.sfx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime; gain.gain.setValueAtTime(vol, now);
  if (type === 'shoot') { osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06); osc.start(now); osc.stop(now + 0.06); }
  else if (type === 'hit') { osc.frequency.setValueAtTime(150, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
  else if (type === 'explosion') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
  else if (type === 'pickup') { osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); osc.start(now); osc.stop(now + 0.15); }
  else if (type === 'hack') { osc.type = 'square'; osc.frequency.setValueAtTime(1000, now); osc.frequency.exponentialRampToValueAtTime(2000, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08); osc.start(now); osc.stop(now + 0.08); }
}

function saveGame() {
  const s = window.gameState;
  localStorage.setItem('systemShock2dExpanded', JSON.stringify({
    highScore: s.highScore, totalKills: s.totalKills, credits: s.credits,
    upgrades: s.upgrades, achievements: s.achievements, hackSuccess: s.hackSuccess
  }));
}
window.saveGame = saveGame;

function loadGame() {
  const data = localStorage.getItem('systemShock2dExpanded');
  if (data) { Object.assign(window.gameState, JSON.parse(data)); return true; }
  return false;
}
window.loadGame = loadGame;

function getUpgradeLevel(id) { return window.gameState.upgrades[id] || 0; }
function getUpgradeCost(id) { return Math.floor(UPGRADES[id].cost * Math.pow(1.5, getUpgradeLevel(id))); }

function applyUpgrades() {
  const s = window.gameState;
  s.maxHp = 100 + getUpgradeLevel('maxHp') * 25;
  s.maxEnergy = 100 + getUpgradeLevel('maxEnergy') * 25;
  s.armor = getUpgradeLevel('armor') * 10;
  player.speed = 200 * Math.pow(1.1, getUpgradeLevel('speed'));
}

function unlockAchievement(id) {
  if (!window.gameState.achievements[id]) {
    window.gameState.achievements[id] = true;
    spawnParticles(WIDTH / 2, HEIGHT / 2, 30, COLORS.yellow);
    playSound('pickup');
  }
}

function checkAchievements() {
  const s = window.gameState;
  if (s.kills > 0) unlockAchievement('firstKill');
  if (s.totalKills >= 100) unlockAchievement('massacre');
  if (s.level >= 5) unlockAchievement('survivor');
  if (s.hackSuccess >= 10) unlockAchievement('hacker');
  if (s.keycards.length >= 4) unlockAchievement('collector');
}

class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size; this.life = this.maxLife = life;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; return this.life > 0; }
  draw() {
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 2 + Math.random() * 4, 0.3 + Math.random() * 0.3));
  }
}

document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; initAudio(); });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
});
canvas.addEventListener('mousedown', e => { mouse.down = true; initAudio(); handleClick(); });
canvas.addEventListener('mouseup', e => { mouse.down = false; });

function handleClick() {
  const s = window.gameState;
  if (s.scene === 'menu') {
    if (mouse.x > WIDTH / 2 - 100 && mouse.x < WIDTH / 2 + 100) {
      if (mouse.y > 280 && mouse.y < 330) startGame();
      else if (mouse.y > 340 && mouse.y < 390) { loadGame(); s.scene = 'upgrades'; }
      else if (mouse.y > 400 && mouse.y < 450) s.scene = 'help';
    }
  } else if (s.scene === 'gameover' || s.scene === 'victory') {
    s.scene = 'menu';
  } else if (s.hackingActive) {
    handleHackClick();
  }
}

function startGame() {
  const s = window.gameState;
  s.scene = 'game'; s.level = 1; s.score = 0; s.kills = 0;
  s.hp = s.maxHp; s.energy = s.maxEnergy;
  s.weapon = 0; s.ammo = [50, 20, 10, 5, 3, 1];
  s.keycards = []; s.xp = 0; s.skillPoints = 0;
  
  player.x = WIDTH / 2; player.y = HEIGHT / 2; player.invuln = 0;
  bullets = []; enemies = []; enemyBullets = []; particles = []; items = [];
  currentWave = 0; waveTimer = 2;
  applyUpgrades();
}

function startWave() {
  const s = window.gameState;
  currentWave++;
  
  const types = ['drone', 'soldier', 'mutant'];
  if (s.level >= 2) types.push('robot', 'brute');
  if (s.level >= 3) types.push('assassin', 'heavy');
  
  const count = 3 + currentWave * 2 + s.level;
  enemiesRemaining = count;
  
  // Boss every 5 waves
  if (currentWave % 5 === 0 && s.level >= 3) {
    spawnEnemy('shodan');
    enemiesRemaining++;
  }
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    setTimeout(() => spawnEnemy(type), i * 500);
  }
}

function spawnEnemy(type) {
  const e = ENEMIES[type];
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * WIDTH; y = -20; }
  else if (side === 1) { x = WIDTH + 20; y = Math.random() * HEIGHT; }
  else if (side === 2) { x = Math.random() * WIDTH; y = HEIGHT + 20; }
  else { x = -20; y = Math.random() * HEIGHT; }
  
  enemies.push({
    x, y, type, hp: e.hp, maxHp: e.hp, speed: e.speed, damage: e.damage,
    size: e.size, color: e.color, score: e.score, xp: e.xp,
    shoots: e.shoots, boss: e.boss, shootTimer: 0, angle: 0
  });
}

function shoot() {
  const s = window.gameState;
  const w = WEAPONS[s.weapon];
  const now = Date.now();
  
  if (now - lastShot < w.fireRate) return;
  if (s.ammo[s.weapon] <= 0) return;
  
  lastShot = now;
  s.ammo[s.weapon]--;
  
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const dmgMult = Math.pow(1.1, getUpgradeLevel('damage'));
  
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const spread = (Math.random() - 0.5) * w.spread * (Math.PI / 180);
    const a = angle + spread;
    bullets.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * 500, vy: Math.sin(a) * 500,
      damage: w.damage * dmgMult, color: w.color, life: 2
    });
  }
  
  playSound('shoot');
  shake.intensity = 3;
}

function updatePlayer(dt) {
  const s = window.gameState;
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  
  if (dx || dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    player.x += (dx / len) * player.speed * dt;
    player.y += (dy / len) * player.speed * dt;
  }
  
  player.x = Math.max(20, Math.min(WIDTH - 20, player.x));
  player.y = Math.max(20, Math.min(HEIGHT - 20, player.y));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  
  if (player.invuln > 0) player.invuln -= dt;
  
  // Weapon switching
  for (let i = 1; i <= 6; i++) {
    if (keys[String(i)] && s.ammo[i - 1] > 0) s.weapon = i - 1;
  }
  
  // Shooting
  const w = WEAPONS[s.weapon];
  if (mouse.down && (w.auto || Date.now() - lastShot >= w.fireRate)) shoot();
  
  // Energy regen
  s.energy = Math.min(s.maxEnergy, s.energy + 5 * dt);
}

function updateEnemies(dt) {
  const s = window.gameState;
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Move toward player
    if (dist > (e.boss ? 150 : 30)) {
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;
    }
    e.angle = Math.atan2(dy, dx);
    
    // Shooting enemies
    if (e.shoots) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.boss ? 0.5 : 1.5;
        const bulletCount = e.boss ? 8 : 1;
        for (let b = 0; b < bulletCount; b++) {
          const a = e.boss ? (Math.PI * 2 * b / bulletCount) : e.angle;
          enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
            damage: e.damage, life: 3
          });
        }
      }
    }
    
    // Melee damage
    if (dist < e.size + 15 && player.invuln <= 0) {
      takeDamage(e.damage);
    }
    
    // Check bullet collisions
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const bdx = b.x - e.x, bdy = b.y - e.y;
      if (Math.sqrt(bdx * bdx + bdy * bdy) < e.size) {
        e.hp -= b.damage;
        bullets.splice(j, 1);
        spawnParticles(e.x, e.y, 5, e.color);
        playSound('hit');
        
        if (e.hp <= 0) {
          killEnemy(i);
          break;
        }
      }
    }
  }
}

function killEnemy(index) {
  const s = window.gameState;
  const e = enemies[index];
  
  s.score += e.score;
  s.xp += e.xp;
  s.kills++;
  s.totalKills++;
  enemiesRemaining--;
  
  spawnParticles(e.x, e.y, 20, e.color);
  playSound('explosion');
  shake.intensity = e.boss ? 20 : 8;
  
  // Drop items
  if (Math.random() < 0.3) spawnItem(e.x, e.y, 'health');
  if (Math.random() < 0.2) spawnItem(e.x, e.y, 'ammo');
  if (Math.random() < 0.1) spawnItem(e.x, e.y, 'credits');
  if (e.boss) {
    unlockAchievement('shodanSlayer');
    spawnItem(e.x, e.y, 'keycard');
  }
  
  enemies.splice(index, 1);
  checkAchievements();
  
  // Level up check
  if (s.xp >= 100 + s.level * 50) {
    s.xp = 0;
    s.skillPoints++;
  }
}

function spawnItem(x, y, type) {
  items.push({ x, y, type, life: 10 });
}

function takeDamage(amount) {
  const s = window.gameState;
  const reduced = Math.max(1, amount - s.armor);
  s.hp -= reduced;
  player.invuln = 0.5;
  shake.intensity = 10;
  playSound('hit');
  spawnParticles(player.x, player.y, 10, COLORS.red);
  
  if (s.hp <= 0) {
    s.scene = 'gameover';
    if (s.score > s.highScore) s.highScore = s.score;
    saveGame();
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT || b.life <= 0) bullets.splice(i, 1);
  }
  
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT || b.life <= 0) {
      enemyBullets.splice(i, 1);
      continue;
    }
    
    const dx = b.x - player.x, dy = b.y - player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 15 && player.invuln <= 0) {
      takeDamage(b.damage);
      enemyBullets.splice(i, 1);
    }
  }
}

function updateItems(dt) {
  const s = window.gameState;
  
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.life -= dt;
    if (it.life <= 0) { items.splice(i, 1); continue; }
    
    const dx = it.x - player.x, dy = it.y - player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      if (it.type === 'health') s.hp = Math.min(s.maxHp, s.hp + 25);
      else if (it.type === 'ammo') {
        for (let j = 0; j < s.ammo.length; j++) s.ammo[j] = Math.min(WEAPONS[j].ammoMax, s.ammo[j] + 10);
      }
      else if (it.type === 'credits') s.credits += 50;
      else if (it.type === 'keycard') {
        const colors = ['yellow', 'red', 'blue', 'black'];
        const newCard = colors.find(c => !s.keycards.includes(c));
        if (newCard) s.keycards.push(newCard);
      }
      
      playSound('pickup');
      spawnParticles(it.x, it.y, 10, COLORS.cyan);
      items.splice(i, 1);
      checkAchievements();
    }
  }
}

function updateWaves(dt) {
  const s = window.gameState;
  
  if (enemiesRemaining <= 0 && enemies.length === 0) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      if (currentWave >= 10) {
        s.level++;
        currentWave = 0;
        if (s.level > 5) {
          s.scene = 'victory';
          if (s.score > s.highScore) s.highScore = s.score;
          saveGame();
          return;
        }
      }
      waveTimer = 3;
      startWave();
    }
  }
}

// Hacking minigame
function startHacking() {
  const s = window.gameState;
  s.hackingActive = true;
  hackGrid = [];
  hackPath = [];
  hackTimer = 30;
  
  const size = 6 + getUpgradeLevel('hacking');
  for (let y = 0; y < size; y++) {
    hackGrid[y] = [];
    for (let x = 0; x < size; x++) {
      const r = Math.random();
      hackGrid[y][x] = r < 0.2 ? 'block' : r < 0.3 ? 'trap' : 'empty';
    }
  }
  hackGrid[0][0] = 'start';
  hackGrid[size - 1][size - 1] = 'end';
  hackPath = [{ x: 0, y: 0 }];
}

function handleHackClick() {
  const cellSize = 50;
  const gridSize = hackGrid.length;
  const startX = (WIDTH - gridSize * cellSize) / 2;
  const startY = (HEIGHT - gridSize * cellSize) / 2;
  
  const cx = Math.floor((mouse.x - startX) / cellSize);
  const cy = Math.floor((mouse.y - startY) / cellSize);
  
  if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) return;
  
  const last = hackPath[hackPath.length - 1];
  const dx = Math.abs(cx - last.x), dy = Math.abs(cy - last.y);
  
  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
    const cell = hackGrid[cy][cx];
    if (cell === 'block') return;
    
    if (cell === 'trap') {
      window.gameState.hackingActive = false;
      takeDamage(20);
      return;
    }
    
    hackPath.push({ x: cx, y: cy });
    playSound('hack');
    
    if (cell === 'end') {
      window.gameState.hackingActive = false;
      window.gameState.hackSuccess++;
      window.gameState.credits += 100;
      spawnParticles(WIDTH / 2, HEIGHT / 2, 30, COLORS.green);
      checkAchievements();
    }
  }
}

function update(dt) {
  const s = window.gameState;
  
  // Particles and shake
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }
  
  if (shake.intensity > 0) {
    shake.x = (Math.random() - 0.5) * shake.intensity;
    shake.y = (Math.random() - 0.5) * shake.intensity;
    shake.intensity *= 0.9;
    if (shake.intensity < 0.5) shake.intensity = 0;
  }
  
  if (s.scene === 'game' && !s.hackingActive) {
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateItems(dt);
    updateWaves(dt);
  }
  
  if (s.hackingActive) {
    hackTimer -= dt;
    if (hackTimer <= 0) {
      s.hackingActive = false;
    }
  }
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
}

function drawPlayer() {
  const s = window.gameState;
  if (player.invuln > 0 && Math.floor(player.invuln * 10) % 2 === 0) return;
  
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawEnemies() {
  for (const e of enemies) {
    // Health bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2, 4);
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(e.x - e.size, e.y - e.size - 8, e.size * 2 * (e.hp / e.maxHp), 4);
    }
    
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    
    ctx.fillStyle = e.color;
    if (e.boss) {
      // Boss shape
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const r = i % 2 === 0 ? e.size : e.size * 0.6;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, e.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

function drawBullets() {
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.fillStyle = COLORS.red;
  for (const b of enemyBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawItems() {
  for (const it of items) {
    const colors = { health: COLORS.red, ammo: COLORS.yellow, credits: COLORS.cyan, keycard: COLORS.white };
    ctx.fillStyle = colors[it.type];
    ctx.beginPath();
    ctx.arc(it.x, it.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawHUD() {
  const s = window.gameState;
  
  // Health bar
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 10, 200, 20);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(12, 12, 196 * (s.hp / s.maxHp), 16);
  ctx.fillStyle = COLORS.white;
  ctx.font = '12px "Share Tech Mono", monospace';
  ctx.fillText('HP: ' + s.hp + '/' + s.maxHp, 15, 25);
  
  // Energy bar
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 35, 200, 20);
  ctx.fillStyle = COLORS.energy;
  ctx.fillRect(12, 37, 196 * (s.energy / s.maxEnergy), 16);
  ctx.fillText('EN: ' + Math.floor(s.energy) + '/' + s.maxEnergy, 15, 50);
  
  // Weapon and ammo
  ctx.fillStyle = COLORS.green;
  ctx.font = '14px "Orbitron", sans-serif';
  ctx.fillText(WEAPONS[s.weapon].name + ': ' + s.ammo[s.weapon], 10, 75);
  
  // Score and level
  ctx.textAlign = 'right';
  ctx.fillText('Score: ' + s.score, WIDTH - 10, 25);
  ctx.fillText('Level: ' + s.level + ' Wave: ' + currentWave, WIDTH - 10, 45);
  ctx.fillText('Credits: ' + s.credits, WIDTH - 10, 65);
  ctx.textAlign = 'left';
  
  // Keycards
  const cardColors = { yellow: '#ff0', red: '#f00', blue: '#00f', black: '#333' };
  let kx = 10;
  for (const card of s.keycards) {
    ctx.fillStyle = cardColors[card];
    ctx.fillRect(kx, HEIGHT - 30, 20, 20);
    kx += 25;
  }
}

function drawMenu() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid();
  
  ctx.fillStyle = COLORS.green;
  ctx.font = '48px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM SHOCK 2D', WIDTH / 2, 150);
  ctx.font = '24px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText('Expanded Edition', WIDTH / 2, 190);
  
  ctx.font = '18px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.white;
  ctx.fillText('8 Enemy Types • 6 Weapons • 6 Upgrades • Boss Fights', WIDTH / 2, 240);
  
  // Buttons
  const btns = [{ y: 280, t: '[ START GAME ]' }, { y: 340, t: '[ UPGRADES ]' }, { y: 400, t: '[ HOW TO PLAY ]' }];
  for (const btn of btns) {
    const hover = mouse.x > WIDTH / 2 - 100 && mouse.x < WIDTH / 2 + 100 && mouse.y > btn.y && mouse.y < btn.y + 50;
    ctx.fillStyle = hover ? COLORS.green : COLORS.cyan;
    ctx.fillText(btn.t, WIDTH / 2, btn.y + 30);
  }
  
  ctx.fillStyle = COLORS.green;
  ctx.font = '14px "Share Tech Mono", monospace';
  ctx.fillText('High Score: ' + window.gameState.highScore, WIDTH / 2, 500);
}

function drawGame() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid();
  
  drawItems();
  drawPlayer();
  drawEnemies();
  drawBullets();
  particles.forEach(p => p.draw());
  drawHUD();
  
  // Wave notification
  if (waveTimer > 0 && enemiesRemaining === 0 && enemies.length === 0) {
    ctx.fillStyle = COLORS.green;
    ctx.font = '24px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WAVE ' + (currentWave + 1) + ' INCOMING...', WIDTH / 2, HEIGHT / 2);
    ctx.textAlign = 'left';
  }
}

function drawHacking() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  const cellSize = 50;
  const gridSize = hackGrid.length;
  const startX = (WIDTH - gridSize * cellSize) / 2;
  const startY = (HEIGHT - gridSize * cellSize) / 2;
  
  ctx.fillStyle = COLORS.green;
  ctx.font = '24px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ICE BREAKER - Connect to Target', WIDTH / 2, startY - 30);
  ctx.fillText('Time: ' + Math.ceil(hackTimer), WIDTH / 2, startY - 5);
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = hackGrid[y][x];
      const px = startX + x * cellSize, py = startY + y * cellSize;
      
      ctx.strokeStyle = COLORS.green;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
      
      if (cell === 'start') ctx.fillStyle = COLORS.cyan;
      else if (cell === 'end') ctx.fillStyle = COLORS.purple;
      else if (cell === 'block') ctx.fillStyle = '#333';
      else if (cell === 'trap') ctx.fillStyle = COLORS.orange;
      else ctx.fillStyle = 'transparent';
      
      if (cell !== 'empty') ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
    }
  }
  
  // Draw path
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < hackPath.length; i++) {
    const p = hackPath[i];
    const px = startX + p.x * cellSize + cellSize / 2;
    const py = startY + p.y * cellSize + cellSize / 2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  
  ctx.textAlign = 'left';
}

function drawUpgrades() {
  const s = window.gameState;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid();
  
  ctx.fillStyle = COLORS.green;
  ctx.font = '32px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('UPGRADES', WIDTH / 2, 50);
  ctx.fillStyle = COLORS.cyan;
  ctx.font = '18px "Share Tech Mono", monospace';
  ctx.fillText('Credits: ' + s.credits, WIDTH / 2, 80);
  
  let y = 120;
  ctx.textAlign = 'left';
  for (const [id, upg] of Object.entries(UPGRADES)) {
    const level = getUpgradeLevel(id);
    const cost = getUpgradeCost(id);
    const maxed = level >= upg.maxLevel;
    
    ctx.fillStyle = maxed ? COLORS.green : COLORS.white;
    ctx.fillText(upg.name + ' (Lv ' + level + '/' + upg.maxLevel + ')', 200, y);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(maxed ? 'MAXED' : 'Cost: ' + cost, 500, y);
    y += 40;
  }
  
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.green;
  ctx.fillText('Press ESC or click to return', WIDTH / 2, HEIGHT - 50);
}

function drawHelp() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid();
  
  ctx.fillStyle = COLORS.green;
  ctx.font = '28px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', WIDTH / 2, 50);
  
  const lines = [
    'WASD / Arrows - Move',
    'Mouse - Aim',
    'Click - Shoot',
    '1-6 - Switch Weapons',
    'H - Hack nearby terminal',
    '',
    'Survive waves of enemies on Citadel Station!',
    'Collect items, earn credits, and upgrade your abilities.',
    'Defeat SHODAN to escape!',
    '',
    'ENEMIES: Drones, Soldiers, Mutants, Brutes, Robots, Assassins, Heavies',
    'WEAPONS: Pistol, SMG, Shotgun, Rifle, Plasma Gun, Laser Cannon'
  ];
  
  ctx.font = '16px "Share Tech Mono", monospace';
  ctx.fillStyle = COLORS.cyan;
  let y = 100;
  for (const line of lines) {
    ctx.fillText(line, WIDTH / 2, y);
    y += 28;
  }
  
  ctx.fillStyle = COLORS.green;
  ctx.fillText('Click to return', WIDTH / 2, HEIGHT - 50);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(10, 10, 18, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.red;
  ctx.font = '48px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, 200);
  
  ctx.fillStyle = COLORS.white;
  ctx.font = '24px "Share Tech Mono", monospace';
  ctx.fillText('Score: ' + window.gameState.score, WIDTH / 2, 280);
  ctx.fillText('Kills: ' + window.gameState.kills, WIDTH / 2, 320);
  
  ctx.fillStyle = COLORS.green;
  ctx.fillText('Click to continue', WIDTH / 2, 420);
}

function drawVictory() {
  ctx.fillStyle = 'rgba(10, 10, 18, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.green;
  ctx.font = '48px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH / 2, 180);
  
  ctx.fillStyle = COLORS.cyan;
  ctx.font = '24px "Share Tech Mono", monospace';
  ctx.fillText('You have escaped Citadel Station!', WIDTH / 2, 240);
  ctx.fillText('SHODAN has been defeated... for now.', WIDTH / 2, 280);
  
  ctx.fillStyle = COLORS.white;
  ctx.fillText('Final Score: ' + window.gameState.score, WIDTH / 2, 340);
  ctx.fillText('Total Kills: ' + window.gameState.kills, WIDTH / 2, 380);
  
  ctx.fillStyle = COLORS.green;
  ctx.fillText('Click to continue', WIDTH / 2, 460);
}

function render() {
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const scene = window.gameState.scene;
  if (scene === 'menu') drawMenu();
  else if (scene === 'game') {
    drawGame();
    if (window.gameState.hackingActive) drawHacking();
  }
  else if (scene === 'upgrades') drawUpgrades();
  else if (scene === 'help') drawHelp();
  else if (scene === 'gameover') drawGameOver();
  else if (scene === 'victory') drawVictory();
  
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
window.ENEMIES = ENEMIES;
window.UPGRADES = UPGRADES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.particles = particles;
window.startGame = startGame;

loadGame();
requestAnimationFrame(gameLoop);
