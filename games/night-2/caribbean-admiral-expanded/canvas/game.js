// Caribbean Admiral - EXPANDED EDITION
// Full naval combat with progression, saves, achievements, and more content

// ============================================
// CONSTANTS & PALETTE
// ============================================
const PALETTE = {
  oceanDeep: '#0a1628', oceanMid: '#0f2847', oceanLight: '#1a4066', oceanFoam: '#4a90b8',
  woodDark: '#3d2817', woodMid: '#5c3d2e', woodLight: '#8b5a3c',
  sail: '#e8dcc8', sailShadow: '#c4b8a4',
  gold: '#ffd700', goldDark: '#b8860b', parchment: '#f4e4bc', parchmentDark: '#d4c49c',
  blood: '#8b0000', cannon: '#2f2f2f',
  fire: '#ff6b35', smoke: '#555555', splash: '#88ccff', muzzleFlash: '#ffdd88'
};

// ============================================
// EXPANDED SHIP TYPES (2x more than polished)
// ============================================
const SHIPS = {
  rowboat: { name: 'Rowboat', hull: 40, sails: 25, crew: 5, damage: 8, cost: 0, size: 0.4, tier: 0 },
  sloop: { name: 'Sloop', hull: 100, sails: 40, crew: 15, damage: 15, cost: 500, size: 0.6, tier: 1 },
  cutter: { name: 'Cutter', hull: 130, sails: 50, crew: 20, damage: 20, cost: 1200, size: 0.65, tier: 1 },
  schooner: { name: 'Schooner', hull: 180, sails: 55, crew: 25, damage: 28, cost: 2000, size: 0.75, tier: 2 },
  brig: { name: 'Brigantine', hull: 280, sails: 55, crew: 40, damage: 45, cost: 3500, size: 0.9, tier: 2 },
  corvette: { name: 'Corvette', hull: 350, sails: 60, crew: 50, damage: 55, cost: 5000, size: 0.95, tier: 3 },
  frigate: { name: 'Frigate', hull: 450, sails: 60, crew: 60, damage: 75, cost: 7500, size: 1.0, tier: 3 },
  galleon: { name: 'Galleon', hull: 600, sails: 55, crew: 80, damage: 95, cost: 12000, size: 1.15, tier: 4 },
  manOWar: { name: "Man-o'-War", hull: 800, sails: 65, crew: 100, damage: 130, cost: 20000, size: 1.3, tier: 4 },
  flagship: { name: 'Flagship', hull: 1000, sails: 70, crew: 120, damage: 160, cost: 35000, size: 1.4, tier: 5 }
};

// ============================================
// EXPANDED ATTACKS (more variety)
// ============================================
const ATTACKS = {
  broadside: { name: 'Broadside', apCost: 25, hullMult: 1.0, sailMult: 0.2, crewMult: 0.2, desc: 'Heavy hull damage' },
  chainShot: { name: 'Chain Shot', apCost: 20, hullMult: 0.1, sailMult: 1.2, crewMult: 0.1, desc: 'Shreds sails' },
  grapeshot: { name: 'Grapeshot', apCost: 20, hullMult: 0.3, sailMult: 0.2, crewMult: 1.0, desc: 'Decimates crew' },
  quickVolley: { name: 'Quick Volley', apCost: 12, hullMult: 0.35, sailMult: 0.35, crewMult: 0.35, desc: 'Fast, light damage' },
  fireBarrels: { name: 'Fire Barrels', apCost: 30, hullMult: 1.3, sailMult: 0.8, crewMult: 0.4, desc: 'Burning damage' },
  boardingParty: { name: 'Board!', apCost: 35, hullMult: 0.2, sailMult: 0.1, crewMult: 1.5, desc: 'Capture attempt' }
};

// ============================================
// UPGRADES SYSTEM
// ============================================
const UPGRADES = {
  reinforcedHull: { name: 'Reinforced Hull', cost: 2000, effect: 'hull', mult: 1.2, desc: '+20% hull HP' },
  betterSails: { name: 'Better Sails', cost: 1500, effect: 'sails', mult: 1.15, desc: '+15% sail points' },
  trainedCrew: { name: 'Trained Crew', cost: 2500, effect: 'damage', mult: 1.1, desc: '+10% damage' },
  extraCannons: { name: 'Extra Cannons', cost: 3000, effect: 'damage', mult: 1.2, desc: '+20% damage' },
  copperPlating: { name: 'Copper Plating', cost: 4000, effect: 'hull', mult: 1.3, desc: '+30% hull HP' },
  eliteCrew: { name: 'Elite Crew', cost: 5000, effect: 'crew', mult: 1.25, desc: '+25% crew' }
};

// ============================================
// ACHIEVEMENTS
// ============================================
const ACHIEVEMENTS = {
  firstBlood: { name: 'First Blood', desc: 'Win your first battle', unlocked: false },
  pirateLord: { name: 'Pirate Lord', desc: 'Accumulate 50,000 gold', unlocked: false },
  fleetCommander: { name: 'Fleet Commander', desc: 'Own 4 ships simultaneously', unlocked: false },
  undefeated: { name: 'Undefeated', desc: 'Win 10 battles in a row', unlocked: false },
  shipCollector: { name: 'Ship Collector', desc: 'Own every ship type', unlocked: false },
  veteranAdmiral: { name: 'Veteran Admiral', desc: 'Complete 25 battles', unlocked: false }
};

// ============================================
// CAMPAIGNS/MISSIONS
// ============================================
const CAMPAIGNS = [
  { id: 1, name: 'Tutorial Waters', enemies: ['rowboat'], reward: 200, unlocked: true },
  { id: 2, name: 'Merchant Route', enemies: ['sloop'], reward: 400, unlocked: true },
  { id: 3, name: 'Pirate Cove', enemies: ['sloop', 'cutter'], reward: 800, unlocked: false },
  { id: 4, name: 'Navy Patrol', enemies: ['schooner', 'brig'], reward: 1500, unlocked: false },
  { id: 5, name: 'Storm Sea', enemies: ['brig', 'corvette'], reward: 2500, unlocked: false },
  { id: 6, name: 'Fortress Harbor', enemies: ['frigate', 'corvette'], reward: 4000, unlocked: false },
  { id: 7, name: 'Treasure Fleet', enemies: ['galleon', 'frigate'], reward: 6000, unlocked: false },
  { id: 8, name: 'Armada Battle', enemies: ['manOWar', 'galleon'], reward: 10000, unlocked: false },
  { id: 9, name: 'Final Showdown', enemies: ['flagship', 'manOWar'], reward: 20000, unlocked: false }
];

// ============================================
// GAME STATE
// ============================================
window.gameState = {
  scene: 'menu',
  gold: 500,
  totalGold: 500,
  day: 1,
  wins: 0,
  losses: 0,
  winStreak: 0,
  battlesTotal: 0,
  playerFleet: [],
  enemyFleet: [],
  combatTurn: 'player',
  selectedShip: null,
  selectedAttack: null,
  battleResult: null,
  message: '',
  upgrades: {},
  achievements: JSON.parse(JSON.stringify(ACHIEVEMENTS)),
  campaigns: JSON.parse(JSON.stringify(CAMPAIGNS)),
  currentCampaign: null,
  settings: { music: true, sfx: true, difficulty: 'normal' },
  tutorialComplete: false
};

// ============================================
// SAVE/LOAD SYSTEM
// ============================================
function saveGame() {
  const saveData = {
    gold: window.gameState.gold,
    totalGold: window.gameState.totalGold,
    day: window.gameState.day,
    wins: window.gameState.wins,
    losses: window.gameState.losses,
    winStreak: window.gameState.winStreak,
    battlesTotal: window.gameState.battlesTotal,
    playerFleet: window.gameState.playerFleet.map(s => ({ type: s.type })),
    upgrades: window.gameState.upgrades,
    achievements: window.gameState.achievements,
    campaigns: window.gameState.campaigns,
    settings: window.gameState.settings,
    tutorialComplete: window.gameState.tutorialComplete
  };
  localStorage.setItem('caribbeanAdmiralExpanded', JSON.stringify(saveData));
  window.gameState.message = 'Game saved!';
}

function loadGame() {
  const data = localStorage.getItem('caribbeanAdmiralExpanded');
  if (data) {
    const save = JSON.parse(data);
    Object.assign(window.gameState, save);
    window.gameState.playerFleet = save.playerFleet.map(s => createShip(s.type));
    window.gameState.scene = 'menu';
    return true;
  }
  return false;
}

function hasSave() {
  return localStorage.getItem('caribbeanAdmiralExpanded') !== null;
}

// ============================================
// AUDIO SYSTEM
// ============================================
let audioCtx;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type, volume = 0.3) {
  if (!audioCtx || !window.gameState.settings.sfx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);

  switch(type) {
    case 'cannon':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case 'hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;
    case 'victory':
      osc.type = 'sine';
      [523, 659, 784, 1047].forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + i * 0.15);
      });
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now); osc.stop(now + 0.8);
      break;
    case 'select':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;
    case 'explosion':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
    case 'achievement':
      osc.type = 'sine';
      [440, 554, 659, 880].forEach((f, i) => {
        osc.frequency.setValueAtTime(f, now + i * 0.1);
      });
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;
  }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size;
    this.life = this.maxLife = life;
    this.gravity = gravity;
  }
  update(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

const particles = [];
function spawnParticles(x, y, count, config) {
  const { color, speedMin = 50, speedMax = 150, sizeMin = 2, sizeMax = 6,
          lifeMin = 0.3, lifeMax = 0.8, gravity = 0 } = config;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    particles.push(new Particle(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 50,
      color, sizeMin + Math.random() * (sizeMax - sizeMin),
      lifeMin + Math.random() * (lifeMax - lifeMin), gravity
    ));
  }
}

// ============================================
// SCREEN SHAKE
// ============================================
const shake = {
  intensity: 0, duration: 0, offsetX: 0, offsetY: 0,
  trigger(i, d) { this.intensity = Math.max(this.intensity, i); this.duration = Math.max(this.duration, d); },
  update(dt) {
    if (this.duration > 0) {
      this.duration -= dt;
      this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
      this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
      this.intensity *= 0.92;
    } else { this.offsetX = this.offsetY = 0; }
  }
};

// ============================================
// SHIP FUNCTIONS
// ============================================
function createShip(type, isEnemy = false) {
  const t = SHIPS[type];
  const upgrades = window.gameState.upgrades;
  let hullMult = 1, sailMult = 1, damageMult = 1, crewMult = 1;

  if (!isEnemy) {
    Object.entries(upgrades).forEach(([key, owned]) => {
      if (owned) {
        const u = UPGRADES[key];
        if (u.effect === 'hull') hullMult *= u.mult;
        if (u.effect === 'sails') sailMult *= u.mult;
        if (u.effect === 'damage') damageMult *= u.mult;
        if (u.effect === 'crew') crewMult *= u.mult;
      }
    });
  }

  return {
    type, name: t.name, size: t.size, tier: t.tier,
    maxHull: Math.floor(t.hull * hullMult), hull: Math.floor(t.hull * hullMult),
    maxSails: Math.floor(t.sails * sailMult), sails: Math.floor(t.sails * sailMult),
    ap: Math.floor(t.sails * sailMult),
    maxCrew: Math.floor(t.crew * crewMult), crew: Math.floor(t.crew * crewMult),
    damage: Math.floor(t.damage * damageMult), isEnemy,
    x: 0, y: 0, hitAnim: 0
  };
}

function calculateDamage(attacker, attack) {
  const base = attacker.damage * (0.7 + attacker.crew / attacker.maxCrew * 0.3);
  const variance = 0.85 + Math.random() * 0.3;
  return {
    hull: Math.floor(base * attack.hullMult * variance),
    sail: Math.floor(base * attack.sailMult * variance),
    crew: Math.floor(base * attack.crewMult * variance * 0.3)
  };
}

function applyDamage(ship, dmg) {
  ship.hull = Math.max(0, ship.hull - dmg.hull);
  ship.sails = Math.max(0, ship.sails - dmg.sail);
  ship.ap = Math.min(ship.ap, ship.sails);
  ship.crew = Math.max(0, ship.crew - dmg.crew);
  ship.hitAnim = 0.3;
}

function isDefeated(ship) { return ship.hull <= 0 || ship.crew <= 0; }

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================
function checkAchievements() {
  const state = window.gameState;
  const ach = state.achievements;

  if (!ach.firstBlood.unlocked && state.wins >= 1) {
    ach.firstBlood.unlocked = true;
    showAchievement('firstBlood');
  }
  if (!ach.pirateLord.unlocked && state.totalGold >= 50000) {
    ach.pirateLord.unlocked = true;
    showAchievement('pirateLord');
  }
  if (!ach.fleetCommander.unlocked && state.playerFleet.length >= 4) {
    ach.fleetCommander.unlocked = true;
    showAchievement('fleetCommander');
  }
  if (!ach.undefeated.unlocked && state.winStreak >= 10) {
    ach.undefeated.unlocked = true;
    showAchievement('undefeated');
  }
  if (!ach.veteranAdmiral.unlocked && state.battlesTotal >= 25) {
    ach.veteranAdmiral.unlocked = true;
    showAchievement('veteranAdmiral');
  }
}

let achievementPopup = null;
function showAchievement(id) {
  playSound('achievement');
  achievementPopup = { id, timer: 3 };
}

// ============================================
// BATTLE LOGIC
// ============================================
function startBattle(campaign) {
  const state = window.gameState;
  state.currentCampaign = campaign;
  state.scene = 'battle';
  state.combatTurn = 'player';
  state.selectedShip = null;
  state.selectedAttack = null;
  state.battleResult = null;

  // Create enemy fleet based on campaign
  state.enemyFleet = campaign.enemies.map(type => createShip(type, true));

  // Position ships
  state.playerFleet.forEach((s, i) => { s.x = 180; s.y = 120 + i * 110; s.ap = s.sails; });
  state.enemyFleet.forEach((s, i) => { s.x = 820; s.y = 120 + i * 110; s.ap = s.sails; });

  state.message = 'Select your ship to attack!';
}

function playerAttack(targetIndex) {
  const state = window.gameState;
  const attacker = state.selectedShip;
  const attack = ATTACKS[state.selectedAttack];
  const target = state.enemyFleet[targetIndex];

  if (!attacker || !attack || !target || isDefeated(target)) return;
  if (attacker.ap < attack.apCost) return;

  attacker.ap -= attack.apCost;
  const dmg = calculateDamage(attacker, attack);

  // Spawn cannon fire
  spawnParticles(attacker.x + 50, attacker.y, 8, { color: PALETTE.muzzleFlash, speedMin: 100, speedMax: 200, sizeMin: 4, sizeMax: 8, lifeMin: 0.1, lifeMax: 0.2 });
  playSound('cannon');

  setTimeout(() => {
    applyDamage(target, dmg);
    spawnParticles(target.x, target.y, 12, { color: PALETTE.woodMid, speedMin: 80, speedMax: 200, sizeMin: 3, sizeMax: 7, lifeMin: 0.3, lifeMax: 0.6, gravity: 200 });
    shake.trigger(10, 0.2);
    playSound('hit');

    if (isDefeated(target)) {
      spawnParticles(target.x, target.y, 25, { color: PALETTE.fire, speedMin: 100, speedMax: 250, sizeMin: 5, sizeMax: 12, lifeMin: 0.5, lifeMax: 1.2, gravity: 100 });
      playSound('explosion');
    }

    state.message = `${attacker.name} deals ${dmg.hull} hull, ${dmg.sail} sail, ${dmg.crew} crew damage!`;
    state.selectedAttack = null;
    checkBattleEnd();
  }, 300);
}

function enemyTurn() {
  const state = window.gameState;
  if (state.battleResult) return;

  const enemies = state.enemyFleet.filter(s => !isDefeated(s));
  const targets = state.playerFleet.filter(s => !isDefeated(s));

  if (enemies.length === 0 || targets.length === 0) return;

  let delay = 0;
  enemies.forEach(enemy => {
    if (enemy.ap >= 12) {
      setTimeout(() => {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const attackKeys = Object.keys(ATTACKS).filter(k => ATTACKS[k].apCost <= enemy.ap);
        const attackKey = attackKeys[Math.floor(Math.random() * attackKeys.length)];
        const attack = ATTACKS[attackKey];

        enemy.ap -= attack.apCost;
        const dmg = calculateDamage(enemy, attack);

        spawnParticles(enemy.x - 50, enemy.y, 8, { color: PALETTE.muzzleFlash, speedMin: 100, speedMax: 200, sizeMin: 4, sizeMax: 8, lifeMin: 0.1, lifeMax: 0.2 });
        playSound('cannon');

        setTimeout(() => {
          applyDamage(target, dmg);
          spawnParticles(target.x, target.y, 12, { color: PALETTE.woodMid, speedMin: 80, speedMax: 200, sizeMin: 3, sizeMax: 7, lifeMin: 0.3, lifeMax: 0.6, gravity: 200 });
          shake.trigger(8, 0.15);
          playSound('hit');

          if (isDefeated(target)) {
            spawnParticles(target.x, target.y, 25, { color: PALETTE.fire, speedMin: 100, speedMax: 250, sizeMin: 5, sizeMax: 12, lifeMin: 0.5, lifeMax: 1.2, gravity: 100 });
            playSound('explosion');
          }

          state.message = `${enemy.name} attacks ${target.name}!`;
          checkBattleEnd();
        }, 300);
      }, delay);
      delay += 800;
    }
  });

  setTimeout(() => {
    if (!state.battleResult) {
      state.combatTurn = 'player';
      state.playerFleet.forEach(s => { if (!isDefeated(s)) s.ap = s.sails; });
      state.message = 'Your turn! Select a ship.';
    }
  }, delay + 500);
}

function checkBattleEnd() {
  const state = window.gameState;
  const playerAlive = state.playerFleet.filter(s => !isDefeated(s));
  const enemyAlive = state.enemyFleet.filter(s => !isDefeated(s));

  if (enemyAlive.length === 0) {
    state.battleResult = 'victory';
    state.wins++;
    state.winStreak++;
    state.battlesTotal++;
    const reward = state.currentCampaign.reward;
    state.gold += reward;
    state.totalGold += reward;
    playSound('victory');
    state.message = `VICTORY! Earned ${reward} gold!`;

    // Unlock next campaign
    const idx = state.campaigns.findIndex(c => c.id === state.currentCampaign.id);
    if (idx < state.campaigns.length - 1) {
      state.campaigns[idx + 1].unlocked = true;
    }

    checkAchievements();
    saveGame();
  } else if (playerAlive.length === 0) {
    state.battleResult = 'defeat';
    state.losses++;
    state.winStreak = 0;
    state.battlesTotal++;
    state.message = 'DEFEAT! Your fleet was destroyed.';
    saveGame();
  }
}

function endTurn() {
  const state = window.gameState;
  if (state.combatTurn !== 'player' || state.battleResult) return;
  state.combatTurn = 'enemy';
  state.message = 'Enemy turn...';
  state.enemyFleet.forEach(s => { if (!isDefeated(s)) s.ap = s.sails; });
  setTimeout(enemyTurn, 500);
}

// ============================================
// CANVAS SETUP
// ============================================
let canvas = document.getElementById('game');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'game';
  canvas.width = 1000;
  canvas.height = 700;
  document.body.appendChild(canvas);
}
const ctx = canvas.getContext('2d');
let lastTime = 0;
let waveOffset = 0;

// ============================================
// RENDER FUNCTIONS
// ============================================
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  shake.update(dt);
  waveOffset += dt * 30;

  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }

  if (achievementPopup) {
    achievementPopup.timer -= dt;
    if (achievementPopup.timer <= 0) achievementPopup = null;
  }

  const state = window.gameState;
  [...state.playerFleet, ...state.enemyFleet].forEach(s => {
    if (s.hitAnim > 0) s.hitAnim -= dt;
  });

  render();
  requestAnimationFrame(gameLoop);
}

function render() {
  const state = window.gameState;
  ctx.save();
  ctx.translate(shake.offsetX, shake.offsetY);

  if (state.scene === 'menu') renderMenu();
  else if (state.scene === 'battle') renderBattle();
  else if (state.scene === 'shop') renderShop();
  else if (state.scene === 'campaign') renderCampaign();
  else if (state.scene === 'upgrades') renderUpgrades();
  else if (state.scene === 'achievements') renderAchievements();
  else if (state.scene === 'settings') renderSettings();
  else if (state.scene === 'help') renderHelp();

  particles.forEach(p => p.draw(ctx));

  // Achievement popup
  if (achievementPopup) {
    const ach = state.achievements[achievementPopup.id];
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.fillRect(300, 20, 400, 60);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(300, 20, 400, 60);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px "Pirata One"';
    ctx.textAlign = 'center';
    ctx.fillText('Achievement Unlocked!', 500, 45);
    ctx.font = '14px "IM Fell English SC"';
    ctx.fillText(ach.name + ' - ' + ach.desc, 500, 65);
  }

  ctx.restore();
}

function drawOcean() {
  const grad = ctx.createLinearGradient(0, 0, 0, 700);
  grad.addColorStop(0, PALETTE.oceanDeep);
  grad.addColorStop(0.5, PALETTE.oceanMid);
  grad.addColorStop(1, PALETTE.oceanLight);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 700);

  ctx.strokeStyle = PALETTE.oceanFoam;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  for (let y = 50; y < 550; y += 40) {
    ctx.beginPath();
    for (let x = 0; x < 1000; x += 5) {
      const wave = Math.sin((x + waveOffset + y * 0.5) * 0.02) * 5;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function renderMenu() {
  drawOcean();

  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 56px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 10;
  ctx.fillText('Caribbean Admiral', 500, 100);
  ctx.font = '24px "Pirata One"';
  ctx.fillText('EXPANDED EDITION', 500, 135);
  ctx.shadowBlur = 0;

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '16px "IM Fell English SC"';
  ctx.fillText('Naval Combat • Upgrades • Campaigns • Achievements', 500, 165);

  const buttons = [
    { text: 'New Game', y: 250 },
    { text: hasSave() ? 'Continue' : 'Continue (No Save)', y: 310, disabled: !hasSave() },
    { text: 'Campaign', y: 370 },
    { text: 'Achievements', y: 430 },
    { text: 'Settings', y: 490 },
    { text: 'How to Play', y: 550 }
  ];

  buttons.forEach(btn => {
    const hover = mouseY > btn.y - 25 && mouseY < btn.y + 25 && mouseX > 350 && mouseX < 650 && !btn.disabled;
    ctx.fillStyle = btn.disabled ? '#444' : (hover ? PALETTE.goldDark : PALETTE.woodDark);
    ctx.fillRect(350, btn.y - 25, 300, 50);
    ctx.strokeStyle = btn.disabled ? '#666' : PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(350, btn.y - 25, 300, 50);
    ctx.fillStyle = btn.disabled ? '#888' : PALETTE.parchment;
    ctx.font = '22px "Pirata One"';
    ctx.fillText(btn.text, 500, btn.y + 8);
  });

  // Stats
  ctx.fillStyle = PALETTE.parchmentDark;
  ctx.font = '14px "IM Fell English SC"';
  ctx.fillText(`Wins: ${window.gameState.wins} | Losses: ${window.gameState.losses} | Gold Earned: ${window.gameState.totalGold}`, 500, 620);
}

function renderBattle() {
  const state = window.gameState;
  drawOcean();

  // Draw ships
  state.playerFleet.forEach(ship => { if (!isDefeated(ship)) drawShip(ship, false, state.selectedShip === ship); });
  state.enemyFleet.forEach(ship => { if (!isDefeated(ship)) drawShip(ship, true, false); });

  // UI Panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 550, 1000, 150);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 550, 1000, 150);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '18px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText(state.message, 500, 575);

  // Attack buttons
  if (state.selectedShip && !state.battleResult && state.combatTurn === 'player') {
    const attacks = Object.entries(ATTACKS);
    attacks.forEach(([key, atk], i) => {
      const x = 20 + (i % 3) * 165;
      const y = 590 + Math.floor(i / 3) * 50;
      const canAfford = state.selectedShip.ap >= atk.apCost;
      const selected = state.selectedAttack === key;

      ctx.fillStyle = selected ? PALETTE.goldDark : (canAfford ? PALETTE.woodDark : '#333');
      ctx.fillRect(x, y, 155, 45);
      ctx.strokeStyle = selected ? PALETTE.gold : (canAfford ? PALETTE.woodLight : '#555');
      ctx.lineWidth = selected ? 3 : 1;
      ctx.strokeRect(x, y, 155, 45);

      ctx.fillStyle = canAfford ? PALETTE.parchment : '#666';
      ctx.font = '14px "Pirata One"';
      ctx.textAlign = 'center';
      ctx.fillText(atk.name, x + 77, y + 18);
      ctx.font = '10px "IM Fell English SC"';
      ctx.fillText(`AP: ${atk.apCost}`, x + 77, y + 35);
    });
  }

  // End turn / Back button
  if (state.combatTurn === 'player' && !state.battleResult) {
    ctx.fillStyle = PALETTE.blood;
    ctx.fillRect(850, 610, 130, 40);
    ctx.strokeStyle = PALETTE.gold;
    ctx.strokeRect(850, 610, 130, 40);
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '16px "Pirata One"';
    ctx.fillText('End Turn', 915, 637);
  }

  // Battle result overlay
  if (state.battleResult) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(250, 200, 500, 200);
    ctx.strokeStyle = state.battleResult === 'victory' ? PALETTE.gold : PALETTE.blood;
    ctx.lineWidth = 4;
    ctx.strokeRect(250, 200, 500, 200);

    ctx.fillStyle = state.battleResult === 'victory' ? PALETTE.gold : PALETTE.blood;
    ctx.font = 'bold 48px "Pirata One"';
    ctx.fillText(state.battleResult.toUpperCase(), 500, 280);

    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '18px "IM Fell English SC"';
    ctx.fillText(state.message, 500, 320);
    ctx.fillText('Click to continue', 500, 370);
  }

  // HUD
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '14px "IM Fell English SC"';
  ctx.fillText(`Gold: ${state.gold}`, 20, 25);
  ctx.fillText(`Campaign: ${state.currentCampaign?.name || 'Free Battle'}`, 20, 45);
}

function drawShip(ship, isEnemy, selected) {
  const x = ship.x;
  const y = ship.y;
  const scale = ship.size;
  const bobY = Math.sin(Date.now() / 500 + x) * 3;

  ctx.save();
  ctx.translate(x, y + bobY);
  if (isEnemy) ctx.scale(-1, 1);

  if (ship.hitAnim > 0) {
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = ship.hitAnim;
    ctx.fillRect(-50 * scale, -30 * scale, 100 * scale, 60 * scale);
    ctx.globalAlpha = 1;
  }

  // Hull
  ctx.fillStyle = PALETTE.woodMid;
  ctx.beginPath();
  ctx.moveTo(-40 * scale, 20 * scale);
  ctx.lineTo(50 * scale, 15 * scale);
  ctx.lineTo(60 * scale, 0);
  ctx.lineTo(50 * scale, -15 * scale);
  ctx.lineTo(-40 * scale, -20 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mast & Sail
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-5 * scale, -70 * scale, 6 * scale, 90 * scale);
  const sailHealth = ship.sails / ship.maxSails;
  ctx.fillStyle = PALETTE.sail;
  ctx.globalAlpha = 0.5 + sailHealth * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -65 * scale);
  ctx.quadraticCurveTo(35 * scale * sailHealth, -40 * scale, 0, -10 * scale);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();

  // Selection highlight
  if (selected) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - 70, y - 50 + bobY, 140, 100);
    ctx.setLineDash([]);
  }

  // Health bars
  const barY = y + 45 + bobY;
  const barWidth = 70;
  ctx.fillStyle = '#333';
  ctx.fillRect(x - barWidth/2, barY, barWidth, 6);
  ctx.fillStyle = ship.hull / ship.maxHull > 0.3 ? '#44aa44' : '#aa4444';
  ctx.fillRect(x - barWidth/2, barY, barWidth * (ship.hull / ship.maxHull), 6);

  ctx.fillStyle = '#333';
  ctx.fillRect(x - barWidth/2, barY + 8, barWidth, 4);
  ctx.fillStyle = '#4488ff';
  ctx.fillRect(x - barWidth/2, barY + 8, barWidth * (ship.ap / ship.maxSails), 4);

  ctx.fillStyle = isEnemy ? PALETTE.blood : PALETTE.gold;
  ctx.font = '11px "IM Fell English SC"';
  ctx.textAlign = 'center';
  ctx.fillText(ship.name, x, barY + 22);
}

function renderShop() {
  const state = window.gameState;
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(50, 30, 900, 640);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 30, 900, 640);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '32px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Shipyard', 500, 70);

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '16px "IM Fell English SC"';
  ctx.fillText(`Your Gold: ${state.gold} | Fleet: ${state.playerFleet.length}/4 ships`, 500, 100);

  // Ship list
  const ships = Object.entries(SHIPS);
  ships.forEach(([key, ship], i) => {
    const x = 80 + (i % 2) * 420;
    const y = 120 + Math.floor(i / 2) * 55;
    const canAfford = state.gold >= ship.cost && state.playerFleet.length < 4;

    ctx.fillStyle = canAfford ? PALETTE.woodDark : '#222';
    ctx.fillRect(x, y, 400, 50);
    ctx.strokeStyle = canAfford ? PALETTE.woodLight : '#444';
    ctx.strokeRect(x, y, 400, 50);

    ctx.fillStyle = canAfford ? PALETTE.parchment : '#666';
    ctx.font = '16px "Pirata One"';
    ctx.textAlign = 'left';
    ctx.fillText(ship.name, x + 15, y + 22);

    ctx.font = '11px "IM Fell English SC"';
    ctx.fillText(`Hull: ${ship.hull} | Sails: ${ship.sails} | Dmg: ${ship.damage}`, x + 15, y + 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = canAfford ? PALETTE.gold : '#666';
    ctx.font = '14px "Pirata One"';
    ctx.fillText(ship.cost === 0 ? 'FREE' : `${ship.cost}g`, x + 385, y + 30);
  });

  // Current fleet
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '20px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Your Fleet:', 500, 420);

  state.playerFleet.forEach((ship, i) => {
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '14px "IM Fell English SC"';
    ctx.fillText(`${i + 1}. ${ship.name} (HP: ${ship.hull}/${ship.maxHull})`, 500, 445 + i * 20);
  });

  // Buttons
  const buttons = [
    { text: 'Upgrades', x: 200, y: 580 },
    { text: 'Set Sail!', x: 400, y: 580 },
    { text: 'Back', x: 600, y: 580 }
  ];

  buttons.forEach(btn => {
    const hover = mouseX > btn.x && mouseX < btn.x + 160 && mouseY > btn.y && mouseY < btn.y + 50;
    ctx.fillStyle = hover ? PALETTE.goldDark : PALETTE.blood;
    ctx.fillRect(btn.x, btn.y, 160, 50);
    ctx.strokeStyle = PALETTE.gold;
    ctx.strokeRect(btn.x, btn.y, 160, 50);
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '18px "Pirata One"';
    ctx.textAlign = 'center';
    ctx.fillText(btn.text, btn.x + 80, btn.y + 32);
  });
}

function renderCampaign() {
  const state = window.gameState;
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(100, 50, 800, 600);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 50, 800, 600);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '32px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Campaign Map', 500, 90);

  state.campaigns.forEach((camp, i) => {
    const x = 150;
    const y = 120 + i * 55;
    const hover = mouseX > x && mouseX < x + 700 && mouseY > y && mouseY < y + 50;

    ctx.fillStyle = camp.unlocked ? (hover ? PALETTE.goldDark : PALETTE.woodDark) : '#222';
    ctx.fillRect(x, y, 700, 50);
    ctx.strokeStyle = camp.unlocked ? PALETTE.woodLight : '#444';
    ctx.strokeRect(x, y, 700, 50);

    ctx.fillStyle = camp.unlocked ? PALETTE.parchment : '#555';
    ctx.font = '16px "Pirata One"';
    ctx.textAlign = 'left';
    ctx.fillText(`${camp.id}. ${camp.name}`, x + 15, y + 22);

    ctx.font = '12px "IM Fell English SC"';
    ctx.fillText(`Enemies: ${camp.enemies.join(', ')} | Reward: ${camp.reward} gold`, x + 15, y + 40);

    if (!camp.unlocked) {
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText('LOCKED', x + 680, y + 30);
    }
  });

  // Back button
  ctx.fillStyle = PALETTE.blood;
  ctx.fillRect(420, 600, 160, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(420, 600, 160, 40);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '18px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Back', 500, 627);
}

function renderUpgrades() {
  const state = window.gameState;
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(100, 50, 800, 600);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 50, 800, 600);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '32px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Ship Upgrades', 500, 90);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '16px "IM Fell English SC"';
  ctx.fillText(`Gold: ${state.gold}`, 500, 115);

  Object.entries(UPGRADES).forEach(([key, upg], i) => {
    const x = 150;
    const y = 140 + i * 70;
    const owned = state.upgrades[key];
    const canBuy = !owned && state.gold >= upg.cost;
    const hover = mouseX > x && mouseX < x + 700 && mouseY > y && mouseY < y + 60 && canBuy;

    ctx.fillStyle = owned ? '#2a4a2a' : (canBuy ? (hover ? PALETTE.goldDark : PALETTE.woodDark) : '#222');
    ctx.fillRect(x, y, 700, 60);
    ctx.strokeStyle = owned ? '#4a8a4a' : (canBuy ? PALETTE.woodLight : '#444');
    ctx.strokeRect(x, y, 700, 60);

    ctx.fillStyle = owned ? '#8f8' : (canBuy ? PALETTE.parchment : '#666');
    ctx.font = '18px "Pirata One"';
    ctx.textAlign = 'left';
    ctx.fillText(upg.name, x + 15, y + 25);

    ctx.font = '12px "IM Fell English SC"';
    ctx.fillText(upg.desc, x + 15, y + 45);

    ctx.textAlign = 'right';
    ctx.fillStyle = owned ? '#8f8' : (canBuy ? PALETTE.gold : '#666');
    ctx.font = '16px "Pirata One"';
    ctx.fillText(owned ? 'OWNED' : `${upg.cost} gold`, x + 680, y + 35);
  });

  // Back button
  ctx.fillStyle = PALETTE.blood;
  ctx.fillRect(420, 600, 160, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(420, 600, 160, 40);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '18px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Back', 500, 627);
}

function renderAchievements() {
  const state = window.gameState;
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(100, 50, 800, 600);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 50, 800, 600);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '32px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Achievements', 500, 90);

  const unlocked = Object.values(state.achievements).filter(a => a.unlocked).length;
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '16px "IM Fell English SC"';
  ctx.fillText(`${unlocked}/${Object.keys(state.achievements).length} Unlocked`, 500, 115);

  Object.entries(state.achievements).forEach(([key, ach], i) => {
    const x = 150;
    const y = 140 + i * 70;

    ctx.fillStyle = ach.unlocked ? '#2a4a2a' : '#222';
    ctx.fillRect(x, y, 700, 60);
    ctx.strokeStyle = ach.unlocked ? PALETTE.gold : '#444';
    ctx.strokeRect(x, y, 700, 60);

    ctx.fillStyle = ach.unlocked ? PALETTE.gold : '#666';
    ctx.font = '18px "Pirata One"';
    ctx.textAlign = 'left';
    ctx.fillText(ach.name, x + 15, y + 25);

    ctx.font = '12px "IM Fell English SC"';
    ctx.fillStyle = ach.unlocked ? PALETTE.parchment : '#555';
    ctx.fillText(ach.desc, x + 15, y + 45);

    ctx.textAlign = 'right';
    ctx.fillStyle = ach.unlocked ? '#8f8' : '#555';
    ctx.font = '14px "Pirata One"';
    ctx.fillText(ach.unlocked ? '✓ UNLOCKED' : 'LOCKED', x + 680, y + 35);
  });

  // Back button
  ctx.fillStyle = PALETTE.blood;
  ctx.fillRect(420, 600, 160, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(420, 600, 160, 40);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '18px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Back', 500, 627);
}

function renderSettings() {
  const state = window.gameState;
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(200, 100, 600, 500);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(200, 100, 600, 500);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '32px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Settings', 500, 150);

  const settings = [
    { label: 'Sound Effects', key: 'sfx', y: 220 },
    { label: 'Music', key: 'music', y: 290 }
  ];

  settings.forEach(s => {
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '20px "IM Fell English SC"';
    ctx.textAlign = 'left';
    ctx.fillText(s.label, 280, s.y);

    const on = state.settings[s.key];
    ctx.fillStyle = on ? '#4a8a4a' : '#8a4a4a';
    ctx.fillRect(550, s.y - 25, 100, 40);
    ctx.strokeStyle = PALETTE.gold;
    ctx.strokeRect(550, s.y - 25, 100, 40);
    ctx.fillStyle = PALETTE.parchment;
    ctx.textAlign = 'center';
    ctx.fillText(on ? 'ON' : 'OFF', 600, s.y + 5);
  });

  // Delete save button
  ctx.fillStyle = '#600';
  ctx.fillRect(350, 400, 300, 50);
  ctx.strokeStyle = '#a00';
  ctx.strokeRect(350, 400, 300, 50);
  ctx.fillStyle = '#faa';
  ctx.font = '18px "Pirata One"';
  ctx.fillText('Delete Save Data', 500, 432);

  // Back button
  ctx.fillStyle = PALETTE.blood;
  ctx.fillRect(420, 520, 160, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(420, 520, 160, 40);
  ctx.fillStyle = PALETTE.parchment;
  ctx.fillText('Back', 500, 547);
}

function renderHelp() {
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(100, 50, 800, 600);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 50, 800, 600);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '32px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('How to Play', 500, 90);

  const lines = [
    '1. Build your fleet by purchasing ships at the Shipyard',
    '2. Select campaigns to battle enemy fleets',
    '3. In battle, click your ship to select it',
    '4. Choose an attack type, then click an enemy ship',
    '5. End your turn when out of Action Points (AP)',
    '6. Sink all enemy ships to win and earn gold!',
    '',
    'ATTACKS:',
    '• Broadside: Heavy hull damage',
    '• Chain Shot: Destroys sails, reduces enemy AP',
    '• Grapeshot: Kills crew, reduces damage output',
    '• Fire Barrels: High damage but expensive',
    '• Board!: Capture attempt - kills lots of crew',
    '',
    'TIPS:',
    '• Buy upgrades to strengthen all your ships',
    '• Larger ships have more HP but cost more',
    '• Target sails to slow fast enemies'
  ];

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '14px "IM Fell English SC"';
  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    ctx.fillText(line, 150, 130 + i * 26);
  });

  // Back button
  ctx.fillStyle = PALETTE.blood;
  ctx.fillRect(420, 600, 160, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(420, 600, 160, 40);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '18px "Pirata One"';
  ctx.textAlign = 'center';
  ctx.fillText('Back', 500, 627);
}

// ============================================
// INPUT HANDLING
// ============================================
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', e => {
  const state = window.gameState;
  initAudio();
  playSound('select');

  if (state.scene === 'menu') {
    if (mouseX > 350 && mouseX < 650) {
      if (mouseY > 225 && mouseY < 275) { // New Game
        state.gold = 500;
        state.totalGold = 500;
        state.day = 1;
        state.wins = 0;
        state.losses = 0;
        state.winStreak = 0;
        state.battlesTotal = 0;
        state.playerFleet = [createShip('rowboat')];
        state.upgrades = {};
        state.achievements = JSON.parse(JSON.stringify(ACHIEVEMENTS));
        state.campaigns = JSON.parse(JSON.stringify(CAMPAIGNS));
        state.scene = 'shop';
      } else if (mouseY > 285 && mouseY < 335 && hasSave()) { // Continue
        loadGame();
        state.scene = 'shop';
      } else if (mouseY > 345 && mouseY < 395) { // Campaign
        state.scene = 'campaign';
      } else if (mouseY > 405 && mouseY < 455) { // Achievements
        state.scene = 'achievements';
      } else if (mouseY > 465 && mouseY < 515) { // Settings
        state.scene = 'settings';
      } else if (mouseY > 525 && mouseY < 575) { // Help
        state.scene = 'help';
      }
    }
  } else if (state.scene === 'shop') {
    // Buy ships
    const ships = Object.entries(SHIPS);
    ships.forEach(([key, ship], i) => {
      const x = 80 + (i % 2) * 420;
      const y = 120 + Math.floor(i / 2) * 55;
      if (mouseX > x && mouseX < x + 400 && mouseY > y && mouseY < y + 50) {
        if (state.gold >= ship.cost && state.playerFleet.length < 4) {
          state.gold -= ship.cost;
          state.playerFleet.push(createShip(key));
          checkAchievements();
          saveGame();
        }
      }
    });

    // Buttons
    if (mouseY > 580 && mouseY < 630) {
      if (mouseX > 200 && mouseX < 360) state.scene = 'upgrades';
      else if (mouseX > 400 && mouseX < 560 && state.playerFleet.length > 0) state.scene = 'campaign';
      else if (mouseX > 600 && mouseX < 760) state.scene = 'menu';
    }
  } else if (state.scene === 'campaign') {
    state.campaigns.forEach((camp, i) => {
      const y = 120 + i * 55;
      if (camp.unlocked && mouseX > 150 && mouseX < 850 && mouseY > y && mouseY < y + 50) {
        startBattle(camp);
      }
    });
    if (mouseX > 420 && mouseX < 580 && mouseY > 600 && mouseY < 640) state.scene = 'menu';
  } else if (state.scene === 'upgrades') {
    Object.entries(UPGRADES).forEach(([key, upg], i) => {
      const y = 140 + i * 70;
      if (!state.upgrades[key] && state.gold >= upg.cost && mouseX > 150 && mouseX < 850 && mouseY > y && mouseY < y + 60) {
        state.gold -= upg.cost;
        state.upgrades[key] = true;
        // Refresh fleet with new upgrades
        state.playerFleet = state.playerFleet.map(s => createShip(s.type));
        saveGame();
      }
    });
    if (mouseX > 420 && mouseX < 580 && mouseY > 600 && mouseY < 640) state.scene = 'shop';
  } else if (state.scene === 'achievements') {
    if (mouseX > 420 && mouseX < 580 && mouseY > 600 && mouseY < 640) state.scene = 'menu';
  } else if (state.scene === 'settings') {
    if (mouseX > 550 && mouseX < 650) {
      if (mouseY > 195 && mouseY < 235) state.settings.sfx = !state.settings.sfx;
      else if (mouseY > 265 && mouseY < 305) state.settings.music = !state.settings.music;
    }
    if (mouseX > 350 && mouseX < 650 && mouseY > 400 && mouseY < 450) {
      localStorage.removeItem('caribbeanAdmiralExpanded');
      location.reload();
    }
    if (mouseX > 420 && mouseX < 580 && mouseY > 520 && mouseY < 560) state.scene = 'menu';
  } else if (state.scene === 'help') {
    if (mouseX > 420 && mouseX < 580 && mouseY > 600 && mouseY < 640) state.scene = 'menu';
  } else if (state.scene === 'battle') {
    if (state.battleResult) {
      state.scene = 'shop';
      // Heal surviving ships partially
      state.playerFleet = state.playerFleet.filter(s => !isDefeated(s));
      state.playerFleet.forEach(s => {
        s.hull = Math.min(s.maxHull, s.hull + Math.floor(s.maxHull * 0.3));
        s.sails = s.maxSails;
        s.crew = Math.min(s.maxCrew, s.crew + Math.floor(s.maxCrew * 0.2));
      });
      return;
    }

    if (state.combatTurn !== 'player') return;

    // Select player ship
    state.playerFleet.forEach(ship => {
      if (!isDefeated(ship)) {
        const dist = Math.hypot(mouseX - ship.x, mouseY - ship.y);
        if (dist < 60) {
          state.selectedShip = ship;
          state.selectedAttack = null;
        }
      }
    });

    // Select attack
    if (state.selectedShip) {
      const attacks = Object.keys(ATTACKS);
      attacks.forEach((key, i) => {
        const x = 20 + (i % 3) * 165;
        const y = 590 + Math.floor(i / 3) * 50;
        if (mouseX > x && mouseX < x + 155 && mouseY > y && mouseY < y + 45) {
          if (state.selectedShip.ap >= ATTACKS[key].apCost) {
            state.selectedAttack = key;
          }
        }
      });
    }

    // Attack enemy ship
    if (state.selectedShip && state.selectedAttack) {
      state.enemyFleet.forEach((ship, i) => {
        if (!isDefeated(ship)) {
          const dist = Math.hypot(mouseX - ship.x, mouseY - ship.y);
          if (dist < 60) playerAttack(i);
        }
      });
    }

    // End turn
    if (mouseX > 850 && mouseX < 980 && mouseY > 610 && mouseY < 650) endTurn();
  }
});

// ============================================
// EXPOSE FOR TESTING
// ============================================
window.SHIPS = SHIPS;
window.ATTACKS = ATTACKS;
window.UPGRADES = UPGRADES;
window.createShip = createShip;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.particles = particles;
window.shake = shake;

// Start
requestAnimationFrame(gameLoop);
console.log('Caribbean Admiral EXPANDED loaded');
