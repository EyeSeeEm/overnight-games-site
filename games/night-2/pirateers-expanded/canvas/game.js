// Pirateers EXPANDED - Twin-Stick Shooter with Progression
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

window.gameState = {
  scene: 'menu',
  hp: 100, maxHp: 100, shield: 0, maxShield: 50,
  score: 0, highScore: 0, wave: 1, kills: 0, totalKills: 0,
  coins: 0, totalCoins: 0, powerLevel: 1, specialCharge: 0,
  comboCount: 0, comboTimer: 0, upgrades: {}, achievements: {},
  settings: { sfx: true }
};

const UPGRADES = {
  maxHealth: { name: 'Max Health', cost: 100, maxLevel: 5, effect: 20 },
  fireRate: { name: 'Fire Rate', cost: 150, maxLevel: 5, effect: 0.9 },
  damage: { name: 'Damage', cost: 200, maxLevel: 5, effect: 1.2 },
  speed: { name: 'Move Speed', cost: 120, maxLevel: 3, effect: 1.1 },
  shield: { name: 'Shield', cost: 250, maxLevel: 3, effect: 25 },
  multishot: { name: 'Multi-Shot', cost: 500, maxLevel: 3, effect: 1 }
};

const ENEMY_TYPES = {
  basic: { hp: 20, speed: 100, size: 15, color: '#f44', points: 10, coins: 1 },
  fast: { hp: 15, speed: 200, size: 12, color: '#ff0', points: 15, coins: 1 },
  tank: { hp: 80, speed: 60, size: 25, color: '#a44', points: 30, coins: 3 },
  shooter: { hp: 30, speed: 80, size: 18, color: '#f80', points: 25, coins: 2, shoots: true },
  homing: { hp: 25, speed: 150, size: 14, color: '#f0f', points: 25, coins: 2 },
  boss: { hp: 500, speed: 40, size: 50, color: '#fff', points: 500, coins: 50, boss: true }
};

const ACHIEVEMENTS = {
  firstKill: { name: 'First Blood', desc: 'Kill your first enemy' },
  wave10: { name: 'Survivor', desc: 'Reach wave 10' },
  kills100: { name: 'Centurion', desc: 'Kill 100 enemies' },
  bossKill: { name: 'Boss Slayer', desc: 'Defeat a boss' }
};

let player = { x: 400, y: 300, angle: 0, invulnerable: 0 };
let bullets = [], enemies = [], enemyBullets = [], particles = [], powerups = [];
let keys = {}, mouse = { x: 400, y: 300 };
let shootTimer = 0, waveTimer = 0, spawnTimer = 0, bossActive = false;

let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type, vol = 0.2) {
  if (!audioCtx || !window.gameState.settings.sfx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(vol, now);
  if (type === 'shoot') { osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05); }
  else if (type === 'hit') { osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); }
  else if (type === 'explosion') { osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(20, now + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
}

class Particle {
  constructor(x, y, vx, vy, color, size, life) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.color = color; this.size = size; this.life = this.maxLife = life; }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; return this.life > 0; }
  draw() { ctx.globalAlpha = this.life / this.maxLife; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size * (this.life / this.maxLife), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 2 + Math.random() * 4, 0.3 + Math.random() * 0.4));
  }
}

function saveGame() {
  localStorage.setItem('pirateersExpanded', JSON.stringify({
    highScore: window.gameState.highScore, totalKills: window.gameState.totalKills,
    totalCoins: window.gameState.totalCoins, coins: window.gameState.coins,
    upgrades: window.gameState.upgrades, achievements: window.gameState.achievements
  }));
}

function loadGame() {
  const data = localStorage.getItem('pirateersExpanded');
  if (data) { Object.assign(window.gameState, JSON.parse(data)); return true; }
  return false;
}

function getUpgradeLevel(name) { return window.gameState.upgrades[name] || 0; }
function getUpgradeCost(name) { return Math.floor(UPGRADES[name].cost * Math.pow(1.5, getUpgradeLevel(name))); }

function applyUpgrades() {
  const s = window.gameState;
  s.maxHp = 100 + getUpgradeLevel('maxHealth') * 20;
  s.maxShield = getUpgradeLevel('shield') * 25;
}

function startGame() {
  const s = window.gameState;
  s.scene = 'game'; s.hp = s.maxHp; s.shield = s.maxShield;
  s.score = 0; s.wave = 1; s.kills = 0; s.specialCharge = 0; s.comboCount = 0;
  player = { x: 400, y: 300, angle: 0, invulnerable: 0 };
  bullets = []; enemies = []; enemyBullets = []; particles = []; powerups = [];
  waveTimer = 3; spawnTimer = 0; bossActive = false;
}

function spawnEnemy() {
  const wave = window.gameState.wave;
  const types = ['basic'];
  if (wave >= 3) types.push('fast');
  if (wave >= 5) types.push('tank');
  if (wave >= 7) types.push('shooter');
  if (wave >= 15) types.push('homing');
  const type = types[Math.floor(Math.random() * types.length)];
  const def = ENEMY_TYPES[type];
  let x, y;
  if (Math.random() < 0.5) { x = Math.random() < 0.5 ? -20 : 820; y = Math.random() * 600; }
  else { x = Math.random() * 800; y = Math.random() < 0.5 ? -20 : 620; }
  enemies.push({ x, y, type, hp: def.hp * (1 + wave * 0.05), maxHp: def.hp * (1 + wave * 0.05), speed: def.speed, size: def.size, color: def.color, points: def.points, coins: def.coins, shootTimer: 0, ...def });
}

function spawnBoss() {
  const def = ENEMY_TYPES.boss;
  bossActive = true;
  enemies.push({ x: 400, y: -60, type: 'boss', hp: def.hp, maxHp: def.hp, speed: def.speed, size: def.size, color: def.color, points: def.points, coins: def.coins, shootTimer: 0, boss: true });
}

function shoot() {
  const fireRateLevel = getUpgradeLevel('fireRate');
  const fireDelay = 0.15 * Math.pow(0.9, fireRateLevel);
  if (shootTimer > 0) return;
  shootTimer = fireDelay;
  playSound('shoot');
  const multishot = 1 + getUpgradeLevel('multishot');
  const damageLevel = getUpgradeLevel('damage');
  const damage = 10 * Math.pow(1.2, damageLevel);
  for (let i = 0; i < multishot; i++) {
    const spread = multishot > 1 ? (i - (multishot - 1) / 2) * 0.2 : 0;
    const angle = player.angle + spread;
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 500, vy: Math.sin(angle) * 500, damage });
  }
}

function fireSpecial() {
  const s = window.gameState;
  if (s.specialCharge < 100) return;
  s.specialCharge = 0;
  playSound('explosion');
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400, damage: 30, special: true });
  }
  spawnParticles(player.x, player.y, 30, '#0ff');
}

function checkAchievements() {
  const s = window.gameState;
  if (!s.achievements.firstKill && s.totalKills >= 1) s.achievements.firstKill = true;
  if (!s.achievements.wave10 && s.wave >= 10) s.achievements.wave10 = true;
  if (!s.achievements.kills100 && s.totalKills >= 100) s.achievements.kills100 = true;
}

function update(dt) {
  const s = window.gameState;
  if (s.scene !== 'game') return;

  waveTimer -= dt;
  if (waveTimer <= 0 && enemies.length === 0) {
    s.wave++;
    waveTimer = 2;
    if (s.wave % 10 === 0) setTimeout(spawnBoss, 2000);
  }

  if (!bossActive && waveTimer <= 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0 && enemies.length < Math.min(3 + Math.floor(s.wave / 3), 10)) {
      spawnEnemy();
      spawnTimer = Math.max(0.5, 2 - s.wave * 0.05);
    }
  }

  const speedLevel = getUpgradeLevel('speed');
  const speed = 250 * Math.pow(1.1, speedLevel);
  let dx = 0, dy = 0;
  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
  if (dx || dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    player.x += (dx / len) * speed * dt;
    player.y += (dy / len) * speed * dt;
  }
  player.x = Math.max(20, Math.min(780, player.x));
  player.y = Math.max(20, Math.min(580, player.y));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  shootTimer -= dt;
  if (keys['Space'] || keys['MouseLeft']) shoot();

  if (s.comboTimer > 0) { s.comboTimer -= dt; if (s.comboTimer <= 0) s.comboCount = 0; }
  if (player.invulnerable > 0) player.invulnerable -= dt;

  bullets = bullets.filter(b => { b.x += b.vx * dt; b.y += b.vy * dt; return b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600; });

  enemyBullets = enemyBullets.filter(b => {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (player.invulnerable <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 20) { takeDamage(10); return false; }
    return b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600;
  });

  enemies = enemies.filter(e => {
    if (e.boss) {
      if (e.y < 100) e.y += e.speed * dt;
      else e.x += Math.sin(Date.now() / 500) * e.speed * dt;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 0.5;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + Date.now() / 1000;
          enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200 });
        }
      }
    } else {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;
    }

    if (e.shoots) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.5;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200 });
      }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.size) {
        e.hp -= b.damage;
        bullets.splice(i, 1);
        spawnParticles(b.x, b.y, 5, e.color);
        playSound('hit');
        if (e.hp <= 0) {
          s.score += e.points * (1 + s.comboCount * 0.1);
          s.coins += e.coins; s.totalCoins += e.coins;
          s.kills++; s.totalKills++;
          s.comboCount++; s.comboTimer = 2;
          s.specialCharge = Math.min(100, s.specialCharge + 5);
          spawnParticles(e.x, e.y, 15, e.color);
          playSound('explosion');
          if (e.boss) { bossActive = false; s.achievements.bossKill = true; }
          checkAchievements();
          return false;
        }
      }
    }

    if (player.invulnerable <= 0 && Math.hypot(e.x - player.x, e.y - player.y) < e.size + 15) {
      takeDamage(e.boss ? 30 : 15);
    }
    return true;
  });

  particles = particles.filter(p => p.update(dt));
  if (s.score > s.highScore) { s.highScore = s.score; saveGame(); }
}

function takeDamage(amount) {
  const s = window.gameState;
  if (player.invulnerable > 0) return;
  player.invulnerable = 1;
  if (s.shield > 0) { const sd = Math.min(s.shield, amount); s.shield -= sd; amount -= sd; }
  s.hp -= amount;
  spawnParticles(player.x, player.y, 10, '#f00');
  playSound('hit');
  if (s.hp <= 0) { s.hp = 0; s.scene = 'gameover'; saveGame(); }
}

function render() {
  const s = window.gameState;
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, 800, 600);

  if (s.scene === 'menu') {
    ctx.fillStyle = '#0ff'; ctx.font = 'bold 48px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('PIRATEERS', 400, 150);
    ctx.font = '24px Orbitron'; ctx.fillText('EXPANDED', 400, 190);
    ctx.fillStyle = '#fff'; ctx.font = '14px Orbitron';
    ctx.fillText('High Score: ' + s.highScore, 400, 230);
    ctx.fillText('Coins: ' + s.coins, 400, 255);

    ['START GAME', 'UPGRADES', 'ACHIEVEMENTS'].forEach((t, i) => {
      const y = 320 + i * 60;
      ctx.fillStyle = mouse.y > y - 20 && mouse.y < y + 20 && mouse.x > 300 && mouse.x < 500 ? '#0ff' : '#088';
      ctx.fillRect(300, y - 20, 200, 40);
      ctx.strokeStyle = '#0ff'; ctx.strokeRect(300, y - 20, 200, 40);
      ctx.fillStyle = '#fff'; ctx.font = '16px Orbitron'; ctx.fillText(t, 400, y + 6);
    });
  } else if (s.scene === 'game') {
    ctx.strokeStyle = '#222';
    for (let x = 0; x < 800; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
    for (let y = 0; y < 600; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }

    particles.forEach(p => p.draw());

    ctx.fillStyle = '#0ff';
    bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.special ? 6 : 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#f80';
    enemyBullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); });

    enemies.forEach(e => {
      ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
      if (e.hp < e.maxHp) {
        ctx.fillStyle = '#400'; ctx.fillRect(e.x - 20, e.y - e.size - 10, 40, 5);
        ctx.fillStyle = '#f00'; ctx.fillRect(e.x - 20, e.y - e.size - 10, 40 * (e.hp / e.maxHp), 5);
      }
    });

    if (player.invulnerable <= 0 || Math.floor(player.invulnerable * 10) % 2 === 0) {
      ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle);
      ctx.fillStyle = '#0ff'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-10, -12); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#fff'; ctx.font = '14px Orbitron'; ctx.textAlign = 'left';
    ctx.fillText('WAVE: ' + s.wave, 20, 30);
    ctx.fillText('SCORE: ' + Math.floor(s.score), 20, 50);
    ctx.fillText('COINS: ' + s.coins, 20, 70);

    ctx.fillStyle = '#400'; ctx.fillRect(600, 20, 180, 20);
    ctx.fillStyle = '#0f0'; ctx.fillRect(600, 20, 180 * (s.hp / s.maxHp), 20);
    if (s.maxShield > 0) { ctx.fillStyle = '#004'; ctx.fillRect(600, 45, 180, 15); ctx.fillStyle = '#00f'; ctx.fillRect(600, 45, 180 * (s.shield / s.maxShield), 15); }
    ctx.fillStyle = '#440'; ctx.fillRect(600, 65, 180, 10); ctx.fillStyle = '#ff0'; ctx.fillRect(600, 65, 180 * (s.specialCharge / 100), 10);

    if (s.comboCount > 1) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 24px Orbitron'; ctx.textAlign = 'center'; ctx.fillText(s.comboCount + 'x COMBO!', 400, 100); }
    if (waveTimer > 0) { ctx.fillStyle = '#0ff'; ctx.font = 'bold 36px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('WAVE ' + s.wave, 400, 300); }
  } else if (s.scene === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#f00'; ctx.font = 'bold 48px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);
    ctx.fillStyle = '#fff'; ctx.font = '20px Orbitron';
    ctx.fillText('Score: ' + Math.floor(s.score), 400, 280);
    ctx.fillText('Wave: ' + s.wave, 400, 320);
    ctx.fillStyle = '#0ff'; ctx.fillRect(300, 450, 200, 50);
    ctx.fillStyle = '#000'; ctx.fillText('CONTINUE', 400, 482);
  } else if (s.scene === 'upgrades') {
    ctx.fillStyle = '#0ff'; ctx.font = 'bold 32px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', 400, 60);
    ctx.fillStyle = '#fff'; ctx.font = '16px Orbitron'; ctx.fillText('Coins: ' + s.coins, 400, 95);
    Object.entries(UPGRADES).forEach(([key, upg], i) => {
      const y = 130 + i * 70;
      const level = getUpgradeLevel(key);
      const cost = getUpgradeCost(key);
      const canBuy = level < upg.maxLevel && s.coins >= cost;
      ctx.fillStyle = canBuy ? '#022' : '#011'; ctx.fillRect(100, y, 600, 55);
      ctx.strokeStyle = canBuy ? '#0ff' : '#444'; ctx.strokeRect(100, y, 600, 55);
      ctx.fillStyle = canBuy ? '#fff' : '#666'; ctx.font = '16px Orbitron'; ctx.textAlign = 'left';
      ctx.fillText(upg.name, 120, y + 30);
      ctx.textAlign = 'right'; ctx.fillText('Level ' + level + '/' + upg.maxLevel, 680, y + 22);
      ctx.fillStyle = canBuy ? '#0f0' : '#666'; ctx.fillText(level < upg.maxLevel ? cost + ' coins' : 'MAX', 680, y + 42);
    });
    ctx.fillStyle = '#800'; ctx.fillRect(300, 550, 200, 40);
    ctx.fillStyle = '#fff'; ctx.font = '16px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('BACK', 400, 577);
  } else if (s.scene === 'achievements') {
    ctx.fillStyle = '#0ff'; ctx.font = 'bold 32px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('ACHIEVEMENTS', 400, 60);
    Object.entries(ACHIEVEMENTS).forEach(([key, ach], i) => {
      const y = 100 + i * 55;
      const unlocked = s.achievements[key];
      ctx.fillStyle = unlocked ? '#040' : '#111'; ctx.fillRect(100, y, 600, 45);
      ctx.strokeStyle = unlocked ? '#0f0' : '#333'; ctx.strokeRect(100, y, 600, 45);
      ctx.fillStyle = unlocked ? '#fff' : '#666'; ctx.font = '14px Orbitron'; ctx.textAlign = 'left';
      ctx.fillText(ach.name, 120, y + 20);
      ctx.font = '12px Orbitron'; ctx.fillText(ach.desc, 120, y + 36);
    });
    ctx.fillStyle = '#800'; ctx.fillRect(300, 550, 200, 40);
    ctx.fillStyle = '#fff'; ctx.font = '16px Orbitron'; ctx.textAlign = 'center'; ctx.fillText('BACK', 400, 577);
  }
}

let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  update(dt); render();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyE') fireSpecial(); });
document.addEventListener('keyup', e => keys[e.code] = false);
document.addEventListener('mousemove', e => { const rect = canvas.getBoundingClientRect(); mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top; });
document.addEventListener('mousedown', () => { keys['MouseLeft'] = true; initAudio(); });
document.addEventListener('mouseup', () => keys['MouseLeft'] = false);

canvas.addEventListener('click', () => {
  const s = window.gameState;
  if (s.scene === 'menu' && mouse.x > 300 && mouse.x < 500) {
    if (mouse.y > 300 && mouse.y < 340) { applyUpgrades(); startGame(); }
    else if (mouse.y > 360 && mouse.y < 400) s.scene = 'upgrades';
    else if (mouse.y > 420 && mouse.y < 460) s.scene = 'achievements';
  } else if (s.scene === 'gameover' && mouse.x > 300 && mouse.x < 500 && mouse.y > 450 && mouse.y < 500) {
    s.scene = 'menu';
  } else if (s.scene === 'upgrades') {
    Object.entries(UPGRADES).forEach(([key, upg], i) => {
      const y = 130 + i * 70;
      const level = getUpgradeLevel(key);
      const cost = getUpgradeCost(key);
      if (mouse.x > 100 && mouse.x < 700 && mouse.y > y && mouse.y < y + 55 && level < upg.maxLevel && s.coins >= cost) {
        s.coins -= cost; s.upgrades[key] = level + 1; saveGame();
      }
    });
    if (mouse.x > 300 && mouse.x < 500 && mouse.y > 550 && mouse.y < 590) s.scene = 'menu';
  } else if (s.scene === 'achievements' && mouse.x > 300 && mouse.x < 500 && mouse.y > 550 && mouse.y < 590) {
    s.scene = 'menu';
  }
});

window.UPGRADES = UPGRADES;
window.ENEMY_TYPES = ENEMY_TYPES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.particles = particles;

loadGame();
applyUpgrades();
requestAnimationFrame(gameLoop);
console.log('Pirateers EXPANDED loaded');
