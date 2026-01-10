// Brotato Clone - Arena Survivor
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 800, HEIGHT = 600;

const COLORS = {
  bg: '#1a1a2e', arena: '#16213e', player: '#e94560', bullet: '#ffff00',
  enemy: '#00ff00', enemyFast: '#00ffff', enemyTank: '#ff00ff', enemyRanged: '#ff8800',
  xp: '#44ff44', material: '#ffaa00', health: '#ff4444', ui: '#0f3460'
};

window.gameState = {
  scene: 'menu', wave: 1, maxWaves: 20, waveTimer: 0, waveDuration: 20,
  hp: 10, maxHp: 10, xp: 0, xpToLevel: 16, level: 1, materials: 0,
  stats: { damage: 0, attackSpeed: 0, critChance: 0, armor: 0, dodge: 0, speed: 0, luck: 0, harvesting: 0 },
  weapons: [{ type: 'pistol', tier: 1 }], weaponSlots: 6,
  upgradeChoices: [], showLevelUp: false, showShop: false,
  kills: 0, totalKills: 0, achievements: {}, settings: { sfx: true }
};

const WEAPONS = {
  pistol: { name: 'Pistol', damage: 12, fireRate: 870, range: 400, color: '#ff0' },
  smg: { name: 'SMG', damage: 5, fireRate: 150, range: 350, color: '#ff8' },
  shotgun: { name: 'Shotgun', damage: 8, fireRate: 1000, pellets: 5, spread: 30, range: 250, color: '#f80' },
  sniper: { name: 'Sniper', damage: 40, fireRate: 2000, range: 600, critBonus: 20, color: '#0ff' },
  knife: { name: 'Knife', damage: 8, fireRate: 600, range: 100, melee: true, color: '#fff' },
  sword: { name: 'Sword', damage: 20, fireRate: 900, range: 150, melee: true, sweep: true, color: '#aaf' }
};

const ENEMIES = {
  baby: { hp: 5, speed: 150, damage: 1, size: 10, color: COLORS.enemy, xp: 2, materials: 1 },
  chaser: { hp: 3, speed: 280, damage: 1, size: 8, color: COLORS.enemyFast, xp: 3, materials: 1 },
  tank: { hp: 25, speed: 80, damage: 2, size: 18, color: COLORS.enemyTank, xp: 5, materials: 3 },
  spitter: { hp: 10, speed: 120, damage: 1, size: 12, color: COLORS.enemyRanged, xp: 4, materials: 2, shoots: true },
  charger: { hp: 8, speed: 100, damage: 3, size: 14, color: '#ff4444', xp: 4, materials: 2, charges: true }
};

const UPGRADES = [
  { stat: 'maxHp', name: 'Max HP', values: [3, 6, 9, 12] },
  { stat: 'damage', name: 'Damage', values: [5, 8, 12, 16] },
  { stat: 'attackSpeed', name: 'Attack Speed', values: [5, 10, 15, 20] },
  { stat: 'critChance', name: 'Crit Chance', values: [3, 5, 7, 9] },
  { stat: 'armor', name: 'Armor', values: [1, 2, 3, 4] },
  { stat: 'dodge', name: 'Dodge', values: [3, 6, 9, 12] },
  { stat: 'speed', name: 'Speed', values: [5, 8, 12, 15] },
  { stat: 'harvesting', name: 'Harvesting', values: [3, 5, 8, 10] }
];

const SHOP_ITEMS = [
  { type: 'weapon', weapon: 'smg', cost: 25, name: 'SMG' },
  { type: 'weapon', weapon: 'shotgun', cost: 35, name: 'Shotgun' },
  { type: 'weapon', weapon: 'sniper', cost: 45, name: 'Sniper' },
  { type: 'weapon', weapon: 'knife', cost: 20, name: 'Knife' },
  { type: 'weapon', weapon: 'sword', cost: 40, name: 'Sword' },
  { type: 'item', stat: 'maxHp', value: 5, cost: 20, name: 'Health Boost' },
  { type: 'item', stat: 'armor', value: 2, cost: 30, name: 'Armor Plate' },
  { type: 'item', stat: 'damage', value: 10, cost: 35, name: 'Power Crystal' }
];

let player = { x: WIDTH / 2, y: HEIGHT / 2, angle: 0, invuln: 0 };
let bullets = [], enemies = [], enemyBullets = [], drops = [], particles = [];
let keys = {}, lastShots = {}, spawnTimer = 0;
let audioCtx = null, shake = { x: 0, y: 0, intensity: 0 };
let shopItems = [], hoveredBtn = null;

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type, vol = 0.1) {
  if (!audioCtx || !window.gameState.settings.sfx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime; gain.gain.setValueAtTime(vol, now);
  if (type === 'shoot') { osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06); osc.start(now); osc.stop(now + 0.06); }
  else if (type === 'hit') { osc.frequency.setValueAtTime(150, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08); osc.start(now); osc.stop(now + 0.08); }
  else if (type === 'pickup') { osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12); osc.start(now); osc.stop(now + 0.12); }
  else if (type === 'levelup') { osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.2); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25); osc.start(now); osc.stop(now + 0.25); }
}

function saveGame() {
  const s = window.gameState;
  localStorage.setItem('brotatoClone', JSON.stringify({ totalKills: s.totalKills, achievements: s.achievements }));
}
window.saveGame = saveGame;

function loadGame() {
  const data = localStorage.getItem('brotatoClone');
  if (data) { const saved = JSON.parse(data); window.gameState.totalKills = saved.totalKills || 0; window.gameState.achievements = saved.achievements || {}; return true; }
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
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
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

document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; initAudio(); });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('click', e => { initAudio(); handleClick(e); });
canvas.addEventListener('mousemove', e => { handleMouseMove(e); });

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  hoveredBtn = null;
  // Check button hovers in UI
}

function handleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (WIDTH / rect.width);
  const my = (e.clientY - rect.top) * (HEIGHT / rect.height);
  const s = window.gameState;
  
  if (s.scene === 'menu') {
    if (my > 280 && my < 330) startGame();
    else if (my > 340 && my < 390) { loadGame(); }
  } else if (s.scene === 'gameover' || s.scene === 'victory') {
    s.scene = 'menu';
  } else if (s.showLevelUp) {
    // Check upgrade choices
    for (let i = 0; i < s.upgradeChoices.length; i++) {
      const bx = 150 + i * 170, by = 250;
      if (mx > bx && mx < bx + 150 && my > by && my < by + 100) {
        applyUpgrade(s.upgradeChoices[i]);
        s.showLevelUp = false;
        break;
      }
    }
  } else if (s.showShop) {
    // Check shop items
    for (let i = 0; i < shopItems.length; i++) {
      const bx = 100 + (i % 4) * 160, by = 200 + Math.floor(i / 4) * 100;
      if (mx > bx && mx < bx + 140 && my > by && my < by + 80) {
        buyItem(shopItems[i]);
        break;
      }
    }
    // Continue button
    if (mx > WIDTH / 2 - 80 && mx < WIDTH / 2 + 80 && my > 500 && my < 550) {
      s.showShop = false;
      startWave();
    }
  }
}

function startGame() {
  const s = window.gameState;
  s.scene = 'game'; s.wave = 1; s.hp = 10; s.maxHp = 10; s.xp = 0;
  s.xpToLevel = 16; s.level = 1; s.materials = 0; s.kills = 0;
  s.stats = { damage: 0, attackSpeed: 0, critChance: 0, armor: 0, dodge: 0, speed: 0, luck: 0, harvesting: 0 };
  s.weapons = [{ type: 'pistol', tier: 1 }];
  s.showLevelUp = false; s.showShop = false;
  
  player.x = WIDTH / 2; player.y = HEIGHT / 2; player.invuln = 0;
  bullets = []; enemies = []; enemyBullets = []; drops = []; particles = [];
  lastShots = {}; spawnTimer = 0;
  
  startWave();
}

function startWave() {
  const s = window.gameState;
  s.waveTimer = s.waveDuration = 20 + Math.min(s.wave * 5, 40);
  spawnTimer = 0;
}

function endWave() {
  const s = window.gameState;
  if (s.wave >= s.maxWaves) {
    s.scene = 'victory';
    saveGame();
  } else {
    s.showShop = true;
    generateShop();
  }
}

function generateShop() {
  shopItems = [];
  const count = 4;
  const available = [...SHOP_ITEMS];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const item = { ...available[idx] };
    item.cost = Math.floor(item.cost * (1 + window.gameState.wave * 0.1));
    shopItems.push(item);
    available.splice(idx, 1);
  }
}

function buyItem(item) {
  const s = window.gameState;
  if (s.materials < item.cost) return;
  
  s.materials -= item.cost;
  if (item.type === 'weapon') {
    if (s.weapons.length < s.weaponSlots) {
      s.weapons.push({ type: item.weapon, tier: 1 });
    }
  } else if (item.type === 'item') {
    if (item.stat === 'maxHp') { s.maxHp += item.value; s.hp = Math.min(s.hp + item.value, s.maxHp); }
    else s.stats[item.stat] = (s.stats[item.stat] || 0) + item.value;
  }
  playSound('pickup');
}

function applyUpgrade(upgrade) {
  const s = window.gameState;
  const tier = Math.min(Math.floor(s.level / 5), 3);
  const value = upgrade.values[tier];
  
  if (upgrade.stat === 'maxHp') {
    s.maxHp += value;
    s.hp = Math.min(s.hp + value, s.maxHp);
  } else {
    s.stats[upgrade.stat] = (s.stats[upgrade.stat] || 0) + value;
  }
  playSound('levelup');
}

function generateUpgradeChoices() {
  const s = window.gameState;
  s.upgradeChoices = [];
  const available = [...UPGRADES];
  for (let i = 0; i < 4 && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    s.upgradeChoices.push(available[idx]);
    available.splice(idx, 1);
  }
  s.showLevelUp = true;
}

function levelUp() {
  const s = window.gameState;
  s.level++;
  s.maxHp++;
  s.hp = Math.min(s.hp + 1, s.maxHp);
  s.xp -= s.xpToLevel;
  s.xpToLevel = Math.pow(s.level + 3, 2);
  generateUpgradeChoices();
  playSound('levelup');
}

function spawnEnemy() {
  const s = window.gameState;
  const types = ['baby', 'baby', 'chaser'];
  if (s.wave >= 3) types.push('charger');
  if (s.wave >= 4) types.push('spitter');
  if (s.wave >= 6) types.push('tank');
  
  const type = types[Math.floor(Math.random() * types.length)];
  const e = ENEMIES[type];
  
  const side = Math.floor(Math.random() * 4);
  let x, y;
  if (side === 0) { x = Math.random() * WIDTH; y = -20; }
  else if (side === 1) { x = WIDTH + 20; y = Math.random() * HEIGHT; }
  else if (side === 2) { x = Math.random() * WIDTH; y = HEIGHT + 20; }
  else { x = -20; y = Math.random() * HEIGHT; }
  
  const hpScale = 1 + (s.wave - 1) * 0.3;
  enemies.push({
    x, y, type,
    hp: Math.floor(e.hp * hpScale), maxHp: Math.floor(e.hp * hpScale),
    speed: e.speed, damage: e.damage, size: e.size, color: e.color,
    xp: e.xp, materials: e.materials, shoots: e.shoots, charges: e.charges,
    shootTimer: 0, chargeTimer: 0, charging: false, chargeDir: { x: 0, y: 0 }
  });
}

function getPlayerSpeed() {
  return 200 * (1 + window.gameState.stats.speed / 100);
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
    const speed = getPlayerSpeed();
    player.x += (dx / len) * speed * dt;
    player.y += (dy / len) * speed * dt;
  }
  
  player.x = Math.max(20, Math.min(WIDTH - 20, player.x));
  player.y = Math.max(20, Math.min(HEIGHT - 20, player.y));
  
  if (player.invuln > 0) player.invuln -= dt;
}

function findNearestEnemy() {
  let nearest = null, minDist = Infinity;
  for (const e of enemies) {
    const dx = e.x - player.x, dy = e.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) { minDist = dist; nearest = e; }
  }
  return nearest;
}

function fireWeapons(dt) {
  const s = window.gameState;
  const target = findNearestEnemy();
  if (!target) return;
  
  const now = Date.now();
  const speedMult = 1 + s.stats.attackSpeed / 100;
  const dmgMult = 1 + s.stats.damage / 100;
  
  for (const w of s.weapons) {
    const wdata = WEAPONS[w.type];
    const interval = wdata.fireRate / speedMult;
    const lastShot = lastShots[w.type] || 0;
    
    if (now - lastShot < interval) continue;
    
    const dx = target.x - player.x, dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > wdata.range) continue;
    
    lastShots[w.type] = now;
    const angle = Math.atan2(dy, dx);
    
    if (wdata.melee) {
      // Melee attack
      bullets.push({
        x: player.x, y: player.y, angle,
        damage: wdata.damage * dmgMult * w.tier,
        range: wdata.range, melee: true, sweep: wdata.sweep,
        color: wdata.color, life: 0.15, traveled: 0
      });
    } else if (wdata.pellets) {
      // Shotgun
      for (let i = 0; i < wdata.pellets; i++) {
        const spread = (Math.random() - 0.5) * wdata.spread * Math.PI / 180;
        const a = angle + spread;
        bullets.push({
          x: player.x, y: player.y,
          vx: Math.cos(a) * 500, vy: Math.sin(a) * 500,
          damage: wdata.damage * dmgMult * w.tier,
          color: wdata.color, life: 0.5
        });
      }
    } else {
      // Regular projectile
      bullets.push({
        x: player.x, y: player.y,
        vx: Math.cos(angle) * 500, vy: Math.sin(angle) * 500,
        damage: wdata.damage * dmgMult * w.tier,
        color: wdata.color, life: 0.8,
        crit: Math.random() * 100 < s.stats.critChance + (wdata.critBonus || 0)
      });
    }
    playSound('shoot');
  }
}

function updateEnemies(dt) {
  const s = window.gameState;
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Charging enemies
    if (e.charges) {
      if (e.charging) {
        e.x += e.chargeDir.x * e.speed * 3 * dt;
        e.y += e.chargeDir.y * e.speed * 3 * dt;
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0) e.charging = false;
      } else {
        e.chargeTimer -= dt;
        if (e.chargeTimer <= 0 && dist < 300) {
          e.charging = true;
          e.chargeDir = { x: dx / dist, y: dy / dist };
          e.chargeTimer = 0.5;
        } else if (e.chargeTimer <= 0) {
          e.chargeTimer = 2 + Math.random();
        }
        // Move slowly when not charging
        e.x += (dx / dist) * e.speed * 0.3 * dt;
        e.y += (dy / dist) * e.speed * 0.3 * dt;
      }
    } else {
      // Normal movement
      if (dist > 30) {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }
    }
    
    // Shooting enemies
    if (e.shoots) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && dist < 300) {
        e.shootTimer = 2;
        const angle = Math.atan2(dy, dx);
        enemyBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 150, vy: Math.sin(angle) * 150,
          damage: e.damage, life: 3
        });
      }
    }
    
    // Collision with player
    if (dist < e.size + 15 && player.invuln <= 0) {
      takeDamage(e.damage);
    }
    
    // Check bullet collisions
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.melee) {
        // Melee hit detection
        const bdx = e.x - player.x, bdy = e.y - player.y;
        const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
        const angleDiff = Math.abs(Math.atan2(bdy, bdx) - b.angle);
        if (bdist < b.range && (b.sweep || angleDiff < 0.5)) {
          e.hp -= b.damage;
          spawnParticles(e.x, e.y, 3, e.color);
        }
      } else {
        const bdx = b.x - e.x, bdy = b.y - e.y;
        if (Math.sqrt(bdx * bdx + bdy * bdy) < e.size) {
          const damage = b.crit ? b.damage * 2 : b.damage;
          e.hp -= damage;
          bullets.splice(j, 1);
          spawnParticles(e.x, e.y, 5, e.color);
          playSound('hit');
        }
      }
    }
    
    if (e.hp <= 0) {
      killEnemy(i);
    }
  }
}

function killEnemy(index) {
  const s = window.gameState;
  const e = enemies[index];
  
  s.kills++; s.totalKills++;
  
  // Drop XP
  const xpBonus = 1 + s.stats.harvesting * 0.05;
  drops.push({ x: e.x, y: e.y, type: 'xp', value: Math.floor(e.xp * xpBonus), life: 10 });
  
  // Drop materials
  if (Math.random() < 0.5) {
    const matBonus = s.stats.harvesting;
    drops.push({ x: e.x + 10, y: e.y, type: 'material', value: e.materials + matBonus, life: 10 });
  }
  
  // Chance for health drop
  if (Math.random() < 0.1) {
    drops.push({ x: e.x - 10, y: e.y, type: 'health', value: 1, life: 10 });
  }
  
  spawnParticles(e.x, e.y, 10, e.color);
  enemies.splice(index, 1);
  shake.intensity = 5;
}

function takeDamage(amount) {
  const s = window.gameState;
  
  // Dodge check
  if (Math.random() * 100 < Math.min(s.stats.dodge, 60)) return;
  
  // Armor reduction
  const reduced = Math.max(1, amount - s.stats.armor / (s.stats.armor + 15) * amount);
  s.hp -= reduced;
  player.invuln = 0.5;
  shake.intensity = 10;
  playSound('hit');
  spawnParticles(player.x, player.y, 8, COLORS.health);
  
  if (s.hp <= 0) {
    s.scene = 'gameover';
    saveGame();
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b.melee) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    b.life -= dt;
    if (b.life <= 0 || b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      bullets.splice(i, 1);
    }
  }
  
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    
    const dx = b.x - player.x, dy = b.y - player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 15 && player.invuln <= 0) {
      takeDamage(b.damage);
      enemyBullets.splice(i, 1);
      continue;
    }
    
    if (b.life <= 0 || b.x < 0 || b.x > WIDTH || b.y < 0 || b.y > HEIGHT) {
      enemyBullets.splice(i, 1);
    }
  }
}

function updateDrops(dt) {
  const s = window.gameState;
  const pickupRange = 50;
  
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.life -= dt;
    
    const dx = d.x - player.x, dy = d.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Magnetic pull
    if (dist < pickupRange * 2) {
      d.x -= dx * 5 * dt;
      d.y -= dy * 5 * dt;
    }
    
    if (dist < pickupRange) {
      if (d.type === 'xp') {
        s.xp += d.value;
        if (s.xp >= s.xpToLevel) levelUp();
      } else if (d.type === 'material') {
        s.materials += d.value;
      } else if (d.type === 'health') {
        s.hp = Math.min(s.maxHp, s.hp + d.value);
      }
      playSound('pickup');
      drops.splice(i, 1);
      continue;
    }
    
    if (d.life <= 0) drops.splice(i, 1);
  }
}

function update(dt) {
  const s = window.gameState;
  
  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }
  
  // Shake
  if (shake.intensity > 0) {
    shake.x = (Math.random() - 0.5) * shake.intensity;
    shake.y = (Math.random() - 0.5) * shake.intensity;
    shake.intensity *= 0.9;
    if (shake.intensity < 0.5) shake.intensity = 0;
  }
  
  if (s.scene !== 'game' || s.showLevelUp || s.showShop) return;
  
  updatePlayer(dt);
  fireWeapons(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateDrops(dt);
  
  // Wave timer
  s.waveTimer -= dt;
  if (s.waveTimer <= 0) {
    endWave();
    return;
  }
  
  // Spawn enemies
  const spawnRate = 0.5 + s.wave * 0.15;
  spawnTimer -= dt;
  if (spawnTimer <= 0 && enemies.length < 50) {
    spawnEnemy();
    spawnTimer = 1 / spawnRate;
  }
}

function drawArena() {
  ctx.fillStyle = COLORS.arena;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Grid
  ctx.strokeStyle = '#1f3050';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }
}

function drawPlayer() {
  if (player.invuln > 0 && Math.floor(player.invuln * 10) % 2 === 0) return;
  
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
  ctx.fill();
  
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
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - e.size, e.y - e.size - 6, e.size * 2, 4);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(e.x - e.size, e.y - e.size - 6, e.size * 2 * (e.hp / e.maxHp), 4);
    }
  }
}

function drawBullets() {
  for (const b of bullets) {
    if (b.melee) {
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + Math.cos(b.angle) * b.range, player.y + Math.sin(b.angle) * b.range);
      ctx.stroke();
    } else {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.crit ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.fillStyle = '#ff0000';
  for (const b of enemyBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDrops() {
  for (const d of drops) {
    if (d.type === 'xp') ctx.fillStyle = COLORS.xp;
    else if (d.type === 'material') ctx.fillStyle = COLORS.material;
    else ctx.fillStyle = COLORS.health;
    
    ctx.beginPath();
    ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHUD() {
  const s = window.gameState;
  
  // Top bar
  ctx.fillStyle = 'rgba(15, 52, 96, 0.8)';
  ctx.fillRect(0, 0, WIDTH, 50);
  
  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 10, 150, 15);
  ctx.fillStyle = COLORS.health;
  ctx.fillRect(10, 10, 150 * (s.hp / s.maxHp), 15);
  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText('HP: ' + s.hp + '/' + s.maxHp, 15, 22);
  
  // XP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 30, 150, 10);
  ctx.fillStyle = COLORS.xp;
  ctx.fillRect(10, 30, 150 * (s.xp / s.xpToLevel), 10);
  
  // Wave and timer
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('WAVE ' + s.wave + '/' + s.maxWaves, WIDTH / 2, 25);
  ctx.fillText(Math.ceil(s.waveTimer) + 's', WIDTH / 2, 42);
  
  // Materials and level
  ctx.textAlign = 'right';
  ctx.fillText('$' + s.materials, WIDTH - 10, 22);
  ctx.fillText('LV ' + s.level, WIDTH - 10, 42);
  ctx.textAlign = 'left';
}

function drawMenu() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = COLORS.player;
  ctx.font = '36px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('BROTATO', WIDTH / 2, 150);
  ctx.fillStyle = '#fff';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillText('Arena Survivor Clone', WIDTH / 2, 190);
  
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('20 Waves • 6 Weapons • 5 Enemies', WIDTH / 2, 240);
  
  // Buttons
  ctx.fillStyle = '#e94560';
  ctx.fillRect(WIDTH / 2 - 100, 280, 200, 50);
  ctx.fillStyle = '#fff';
  ctx.fillText('START', WIDTH / 2, 312);
  
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(WIDTH / 2 - 100, 340, 200, 50);
  ctx.fillText('CONTROLS', WIDTH / 2, 372);
  
  ctx.font = '10px "Press Start 2P"';
  ctx.fillStyle = '#888';
  ctx.fillText('WASD to move • Auto-aim weapons', WIDTH / 2, 450);
  ctx.fillText('Survive, level up, shop between waves', WIDTH / 2, 470);
}

function drawGame() {
  drawArena();
  drawDrops();
  drawPlayer();
  drawEnemies();
  drawBullets();
  particles.forEach(p => p.draw());
  drawHUD();
}

function drawLevelUp() {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#ffff00';
  ctx.font = '24px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL UP!', WIDTH / 2, 180);
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Choose an upgrade:', WIDTH / 2, 220);
  
  const s = window.gameState;
  for (let i = 0; i < s.upgradeChoices.length; i++) {
    const upg = s.upgradeChoices[i];
    const tier = Math.min(Math.floor(s.level / 5), 3);
    const bx = 150 + i * 170, by = 250;
    
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(bx, by, 150, 100);
    ctx.strokeStyle = '#e94560';
    ctx.strokeRect(bx, by, 150, 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(upg.name, bx + 75, by + 40);
    ctx.fillStyle = '#0f0';
    ctx.fillText('+' + upg.values[tier], bx + 75, by + 70);
  }
}

function drawShop() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  const s = window.gameState;
  ctx.fillStyle = '#ffaa00';
  ctx.font = '24px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('SHOP', WIDTH / 2, 100);
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('Materials: $' + s.materials, WIDTH / 2, 140);
  ctx.fillText('Weapons: ' + s.weapons.length + '/' + s.weaponSlots, WIDTH / 2, 165);
  
  for (let i = 0; i < shopItems.length; i++) {
    const item = shopItems[i];
    const bx = 100 + (i % 4) * 160, by = 200 + Math.floor(i / 4) * 100;
    const canBuy = s.materials >= item.cost && (item.type !== 'weapon' || s.weapons.length < s.weaponSlots);
    
    ctx.fillStyle = canBuy ? '#0f3460' : '#333';
    ctx.fillRect(bx, by, 140, 80);
    ctx.strokeStyle = canBuy ? '#e94560' : '#666';
    ctx.strokeRect(bx, by, 140, 80);
    
    ctx.fillStyle = canBuy ? '#fff' : '#666';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(item.name, bx + 70, by + 35);
    ctx.fillStyle = canBuy ? '#0f0' : '#660';
    ctx.fillText('$' + item.cost, bx + 70, by + 60);
  }
  
  // Continue button
  ctx.fillStyle = '#e94560';
  ctx.fillRect(WIDTH / 2 - 80, 500, 160, 50);
  ctx.fillStyle = '#fff';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('CONTINUE', WIDTH / 2, 532);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#ff0000';
  ctx.font = '36px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, 200);
  
  const s = window.gameState;
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('Wave: ' + s.wave, WIDTH / 2, 280);
  ctx.fillText('Kills: ' + s.kills, WIDTH / 2, 310);
  ctx.fillText('Level: ' + s.level, WIDTH / 2, 340);
  
  ctx.fillText('Click to continue', WIDTH / 2, 420);
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = '#00ff00';
  ctx.font = '36px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', WIDTH / 2, 180);
  
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('You survived all 20 waves!', WIDTH / 2, 240);
  
  const s = window.gameState;
  ctx.fillText('Kills: ' + s.kills, WIDTH / 2, 300);
  ctx.fillText('Level: ' + s.level, WIDTH / 2, 330);
  ctx.fillText('Materials: ' + s.materials, WIDTH / 2, 360);
  
  ctx.fillText('Click to continue', WIDTH / 2, 440);
}

function render() {
  ctx.save();
  ctx.translate(shake.x, shake.y);
  
  const s = window.gameState;
  if (s.scene === 'menu') drawMenu();
  else if (s.scene === 'game') {
    drawGame();
    if (s.showLevelUp) drawLevelUp();
    else if (s.showShop) drawShop();
  }
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
window.ENEMIES = ENEMIES;
window.UPGRADES = UPGRADES;
window.particles = particles;

loadGame();
requestAnimationFrame(gameLoop);
