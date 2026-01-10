// Caribbean Admiral - Polished Edition
// Turn-based naval combat with visual polish

// ============================================
// COLOR PALETTE - Golden Age of Piracy
// ============================================
const PALETTE = {
  // Ocean
  oceanDeep: '#0a1628',
  oceanMid: '#0f2847',
  oceanLight: '#1a4066',
  oceanFoam: '#4a90b8',

  // Ships
  woodDark: '#3d2817',
  woodMid: '#5c3d2e',
  woodLight: '#8b5a3c',
  sail: '#e8dcc8',
  sailShadow: '#c4b8a4',

  // UI
  gold: '#ffd700',
  goldDark: '#b8860b',
  parchment: '#f4e4bc',
  parchmentDark: '#d4c49c',
  blood: '#8b0000',
  cannon: '#2f2f2f',

  // Effects
  fire: '#ff6b35',
  smoke: '#555555',
  splash: '#88ccff',
  muzzleFlash: '#ffdd88'
};

// ============================================
// GAME STATE
// ============================================
window.gameState = {
  scene: 'menu',
  gold: 1000,
  warPoints: 0,
  day: 1,
  playerFleet: [],
  enemyFleet: [],
  combatTurn: 'player',
  selectedShip: null,
  selectedAttack: null,
  battleResult: null,
  message: ''
};

// ============================================
// SHIP DEFINITIONS
// ============================================
const SHIPS = {
  sloop: { name: 'Sloop', hull: 100, sails: 40, crew: 15, damage: 15, cost: 0, size: 0.6 },
  schooner: { name: 'Schooner', hull: 150, sails: 50, crew: 20, damage: 22, cost: 1000, size: 0.75 },
  brig: { name: 'Brigantine', hull: 280, sails: 55, crew: 35, damage: 45, cost: 3000, size: 0.9 },
  frigate: { name: 'Frigate', hull: 400, sails: 55, crew: 55, damage: 75, cost: 5500, size: 1.0 },
  galleon: { name: 'Galleon', hull: 550, sails: 50, crew: 70, damage: 90, cost: 9000, size: 1.15 },
  manOWar: { name: "Man-o'-War", hull: 700, sails: 60, crew: 90, damage: 120, cost: 15000, size: 1.3 }
};

const ATTACKS = {
  broadside: { name: 'Broadside', apCost: 25, hullMult: 1.0, sailMult: 0.2, crewMult: 0.2, desc: 'Heavy hull damage' },
  chainShot: { name: 'Chain Shot', apCost: 20, hullMult: 0.1, sailMult: 1.2, crewMult: 0.1, desc: 'Shreds sails' },
  grapeshot: { name: 'Grapeshot', apCost: 20, hullMult: 0.3, sailMult: 0.2, crewMult: 1.0, desc: 'Decimates crew' },
  quickVolley: { name: 'Quick Volley', apCost: 12, hullMult: 0.35, sailMult: 0.35, crewMult: 0.35, desc: 'Fast, light damage' }
};

// ============================================
// SCREEN SHAKE
// ============================================
const shake = {
  intensity: 0,
  duration: 0,
  offsetX: 0,
  offsetY: 0,
  trigger(i, d) {
    this.intensity = Math.max(this.intensity, i);
    this.duration = Math.max(this.duration, d);
  },
  update(dt) {
    if (this.duration > 0) {
      this.duration -= dt;
      this.offsetX = (Math.random() - 0.5) * this.intensity * 2;
      this.offsetY = (Math.random() - 0.5) * this.intensity * 2;
      this.intensity *= 0.92;
    } else {
      this.offsetX = this.offsetY = 0;
    }
  }
};

// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0, fade = true) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size;
    this.life = this.maxLife = life;
    this.gravity = gravity; this.fade = fade;
  }
  update(dt) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }
  draw(ctx) {
    const alpha = this.fade ? this.life / this.maxLife : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

const particles = [];

function spawnParticles(x, y, count, config) {
  const { color, speedMin = 50, speedMax = 150, sizeMin = 2, sizeMax = 6,
          lifeMin = 0.3, lifeMax = 0.8, gravity = 0, spread = Math.PI * 2 } = config;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * spread - spread / 2;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    particles.push(new Particle(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 50,
      color, sizeMin + Math.random() * (sizeMax - sizeMin),
      lifeMin + Math.random() * (lifeMax - lifeMin), gravity
    ));
  }
}

// Cannon fire effect
function cannonFire(x, y, direction) {
  // Muzzle flash
  spawnParticles(x + direction * 20, y, 8, {
    color: PALETTE.muzzleFlash, speedMin: 100, speedMax: 200,
    sizeMin: 4, sizeMax: 8, lifeMin: 0.1, lifeMax: 0.2, spread: Math.PI / 3
  });
  // Smoke
  spawnParticles(x + direction * 30, y, 12, {
    color: PALETTE.smoke, speedMin: 30, speedMax: 80,
    sizeMin: 8, sizeMax: 15, lifeMin: 0.5, lifeMax: 1.0, gravity: -30
  });
  shake.trigger(8, 0.15);
  playSound('cannon');
}

// Hit effect
function hitEffect(x, y, type) {
  if (type === 'hull') {
    spawnParticles(x, y, 15, {
      color: PALETTE.woodMid, speedMin: 80, speedMax: 200,
      sizeMin: 3, sizeMax: 7, lifeMin: 0.3, lifeMax: 0.6, gravity: 200
    });
    shake.trigger(12, 0.2);
  } else if (type === 'sail') {
    spawnParticles(x, y - 30, 10, {
      color: PALETTE.sail, speedMin: 40, speedMax: 100,
      sizeMin: 4, sizeMax: 10, lifeMin: 0.4, lifeMax: 0.8, gravity: 50
    });
  } else if (type === 'crew') {
    spawnParticles(x, y, 8, {
      color: PALETTE.blood, speedMin: 60, speedMax: 120,
      sizeMin: 2, sizeMax: 5, lifeMin: 0.2, lifeMax: 0.4, gravity: 150
    });
  }
  playSound('hit');
}

// Ship destruction
function destroyShip(x, y) {
  spawnParticles(x, y, 30, {
    color: PALETTE.woodDark, speedMin: 100, speedMax: 250,
    sizeMin: 5, sizeMax: 12, lifeMin: 0.5, lifeMax: 1.2, gravity: 200
  });
  spawnParticles(x, y - 20, 20, {
    color: PALETTE.fire, speedMin: 50, speedMax: 150,
    sizeMin: 6, sizeMax: 14, lifeMin: 0.3, lifeMax: 0.7, gravity: -50
  });
  shake.trigger(20, 0.4);
  playSound('explosion');
}

// Water splash
function waterSplash(x, y) {
  spawnParticles(x, y, 10, {
    color: PALETTE.splash, speedMin: 50, speedMax: 120,
    sizeMin: 3, sizeMax: 8, lifeMin: 0.3, lifeMax: 0.5, gravity: 150
  });
}

// ============================================
// AUDIO
// ============================================
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch(type) {
    case 'cannon':
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.type = 'sawtooth';
      osc.start(now); osc.stop(now + 0.2);
      break;
    case 'hit':
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.type = 'square';
      osc.start(now); osc.stop(now + 0.15);
      break;
    case 'explosion':
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.type = 'sawtooth';
      osc.start(now); osc.stop(now + 0.4);
      break;
    case 'select':
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.type = 'sine';
      osc.start(now); osc.stop(now + 0.1);
      break;
    case 'victory':
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(400, now + 0.15);
      osc.frequency.setValueAtTime(500, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.type = 'sine';
      osc.start(now); osc.stop(now + 0.5);
      break;
  }
}

// ============================================
// GAME LOGIC
// ============================================
function createShip(type, isEnemy = false) {
  const t = SHIPS[type];
  return {
    type, name: t.name, size: t.size,
    maxHull: t.hull, hull: t.hull,
    maxSails: t.sails, sails: t.sails,
    ap: t.sails, maxCrew: t.crew, crew: t.crew,
    damage: t.damage, isEnemy,
    x: 0, y: 0, hitAnim: 0
  };
}

function calculateDamage(attacker, attack, defender) {
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

function isDefeated(ship) {
  return ship.hull <= 0 || ship.ap < 10;
}

function startBattle() {
  const state = window.gameState;
  state.scene = 'battle';
  state.combatTurn = 'player';
  state.selectedShip = null;
  state.selectedAttack = null;
  state.battleResult = null;
  state.message = 'Select your ship to attack!';

  // Position ships
  state.playerFleet.forEach((s, i) => {
    s.x = 180; s.y = 150 + i * 130;
    s.ap = s.sails;
  });
  state.enemyFleet.forEach((s, i) => {
    s.x = 820; s.y = 150 + i * 130;
    s.ap = s.sails;
  });
}

function playerAttack(targetIndex) {
  const state = window.gameState;
  if (!state.selectedShip || !state.selectedAttack) return;

  const attacker = state.selectedShip;
  const attack = ATTACKS[state.selectedAttack];
  const target = state.enemyFleet[targetIndex];

  if (!target || isDefeated(target)) return;
  if (attacker.ap < attack.apCost) {
    state.message = 'Not enough AP!';
    return;
  }

  // Fire!
  attacker.ap -= attack.apCost;
  const dmg = calculateDamage(attacker, attack, target);
  cannonFire(attacker.x + 40, attacker.y, 1);

  setTimeout(() => {
    applyDamage(target, dmg);
    const mainType = attack.hullMult >= attack.sailMult && attack.hullMult >= attack.crewMult ? 'hull' :
                     attack.sailMult >= attack.crewMult ? 'sail' : 'crew';
    hitEffect(target.x - 30, target.y, mainType);

    if (isDefeated(target)) {
      destroyShip(target.x, target.y);
      state.message = `${target.name} destroyed!`;
    } else {
      state.message = `Hit! ${dmg.hull} hull, ${dmg.sail} sail damage`;
    }

    checkBattleEnd();
  }, 300);

  state.selectedShip = null;
  state.selectedAttack = null;
}

function enemyTurn() {
  const state = window.gameState;
  if (state.combatTurn !== 'enemy' || state.battleResult) return;

  const aliveEnemies = state.enemyFleet.filter(s => !isDefeated(s));
  const alivePlayers = state.playerFleet.filter(s => !isDefeated(s));

  if (aliveEnemies.length === 0 || alivePlayers.length === 0) return;

  // Each enemy attacks
  let delay = 0;
  aliveEnemies.forEach(enemy => {
    if (enemy.ap >= 12) {
      setTimeout(() => {
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        const attackTypes = Object.keys(ATTACKS);
        const attackKey = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        const attack = ATTACKS[attackKey];

        if (enemy.ap >= attack.apCost && target && !isDefeated(target)) {
          enemy.ap -= attack.apCost;
          const dmg = calculateDamage(enemy, attack, target);
          cannonFire(enemy.x - 40, enemy.y, -1);

          setTimeout(() => {
            applyDamage(target, dmg);
            hitEffect(target.x + 30, target.y, 'hull');
            if (isDefeated(target)) {
              destroyShip(target.x, target.y);
            }
            checkBattleEnd();
          }, 300);
        }
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
    state.warPoints += 100;
    state.gold += 500;
    playSound('victory');
    state.message = 'VICTORY! You earned 500 gold!';
  } else if (playerAlive.length === 0) {
    state.battleResult = 'defeat';
    state.message = 'DEFEAT! Your fleet was destroyed.';
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
// CANVAS & RENDERING
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

function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  shake.update(dt);
  waveOffset += dt * 30;

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) particles.splice(i, 1);
  }

  // Update hit animations
  const state = window.gameState;
  [...state.playerFleet, ...state.enemyFleet].forEach(s => {
    if (s.hitAnim > 0) s.hitAnim -= dt;
  });
}

function render() {
  const state = window.gameState;

  ctx.save();
  ctx.translate(shake.offsetX, shake.offsetY);

  if (state.scene === 'menu') renderMenu();
  else if (state.scene === 'battle') renderBattle();
  else if (state.scene === 'shop') renderShop();

  // Draw particles
  particles.forEach(p => p.draw(ctx));

  ctx.restore();
}

function renderMenu() {
  const time = Date.now() / 1000;

  // Ocean background
  drawOcean();

  // Title
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 56px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 10;
  ctx.fillText('Caribbean Admiral', 500, 120);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '20px "IM Fell English SC", serif';
  ctx.fillText('Naval Combat in the Golden Age of Piracy', 500, 160);

  // Buttons
  const buttons = [
    { text: 'New Voyage', y: 300, action: 'newGame' },
    { text: 'Continue', y: 380, action: 'continue' },
    { text: 'How to Play', y: 460, action: 'help' }
  ];

  buttons.forEach((btn, i) => {
    const hover = mouseY > btn.y - 25 && mouseY < btn.y + 25 && mouseX > 350 && mouseX < 650;
    const pulse = hover ? 1.05 + 0.03 * Math.sin(time * 8) : 1;

    ctx.fillStyle = hover ? PALETTE.goldDark : PALETTE.woodDark;
    ctx.fillRect(350, btn.y - 25, 300 * pulse, 50);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(350, btn.y - 25, 300 * pulse, 50);

    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '24px "Pirata One", cursive';
    ctx.fillText(btn.text, 500, btn.y + 8);
  });

  // Instructions
  ctx.fillStyle = PALETTE.parchmentDark;
  ctx.font = '14px "IM Fell English SC", serif';
  ctx.fillText('Click to select ships and attacks. Sink all enemy vessels to win!', 500, 580);
}

function renderBattle() {
  const state = window.gameState;
  const time = Date.now() / 1000;

  // Ocean
  drawOcean();

  // Draw ships
  state.playerFleet.forEach((ship, i) => {
    if (!isDefeated(ship)) {
      drawShip(ship, false, state.selectedShip === ship);
    }
  });

  state.enemyFleet.forEach((ship, i) => {
    if (!isDefeated(ship)) {
      drawShip(ship, true, false);
    }
  });

  // UI Panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 550, 1000, 150);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 550, 1000, 150);

  // Message
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '20px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.fillText(state.message, 500, 580);

  // Attack buttons
  if (state.selectedShip && !state.battleResult) {
    const attacks = Object.entries(ATTACKS);
    attacks.forEach(([key, atk], i) => {
      const x = 80 + i * 230;
      const y = 620;
      const canAfford = state.selectedShip.ap >= atk.apCost;
      const selected = state.selectedAttack === key;

      ctx.fillStyle = selected ? PALETTE.goldDark : (canAfford ? PALETTE.woodDark : '#333');
      ctx.fillRect(x, y, 200, 60);
      ctx.strokeStyle = selected ? PALETTE.gold : (canAfford ? PALETTE.woodLight : '#555');
      ctx.lineWidth = selected ? 3 : 1;
      ctx.strokeRect(x, y, 200, 60);

      ctx.fillStyle = canAfford ? PALETTE.parchment : '#666';
      ctx.font = '16px "Pirata One", cursive';
      ctx.textAlign = 'center';
      ctx.fillText(atk.name, x + 100, y + 25);
      ctx.font = '12px "IM Fell English SC", serif';
      ctx.fillText(`AP: ${atk.apCost} - ${atk.desc}`, x + 100, y + 48);
    });
  }

  // End turn button
  if (state.combatTurn === 'player' && !state.battleResult) {
    ctx.fillStyle = PALETTE.blood;
    ctx.fillRect(850, 610, 130, 40);
    ctx.strokeStyle = PALETTE.gold;
    ctx.strokeRect(850, 610, 130, 40);
    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '18px "Pirata One", cursive';
    ctx.fillText('End Turn', 915, 637);
  }

  // Battle result
  if (state.battleResult) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(250, 200, 500, 200);
    ctx.strokeStyle = state.battleResult === 'victory' ? PALETTE.gold : PALETTE.blood;
    ctx.lineWidth = 4;
    ctx.strokeRect(250, 200, 500, 200);

    ctx.fillStyle = state.battleResult === 'victory' ? PALETTE.gold : PALETTE.blood;
    ctx.font = 'bold 48px "Pirata One", cursive';
    ctx.fillText(state.battleResult.toUpperCase(), 500, 280);

    ctx.fillStyle = PALETTE.parchment;
    ctx.font = '20px "IM Fell English SC", serif';
    ctx.fillText('Click to continue', 500, 350);
  }

  // Stats
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '16px "IM Fell English SC", serif';
  ctx.fillText(`Gold: ${state.gold}`, 20, 30);
  ctx.fillText(`Day: ${state.day}`, 20, 55);
}

function drawOcean() {
  // Gradient ocean
  const grad = ctx.createLinearGradient(0, 0, 0, 700);
  grad.addColorStop(0, PALETTE.oceanDeep);
  grad.addColorStop(0.5, PALETTE.oceanMid);
  grad.addColorStop(1, PALETTE.oceanLight);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1000, 700);

  // Wave lines
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

function drawShip(ship, isEnemy, selected) {
  const x = ship.x;
  const y = ship.y;
  const scale = ship.size;
  const bobY = Math.sin(Date.now() / 500 + x) * 3;

  ctx.save();
  ctx.translate(x, y + bobY);
  if (isEnemy) ctx.scale(-1, 1);

  // Hit flash
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

  // Mast
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(-5 * scale, -70 * scale, 6 * scale, 90 * scale);

  // Sail
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
  const barWidth = 80;

  // Hull bar
  ctx.fillStyle = '#333';
  ctx.fillRect(x - barWidth/2, barY, barWidth, 8);
  ctx.fillStyle = ship.hull / ship.maxHull > 0.3 ? '#44aa44' : '#aa4444';
  ctx.fillRect(x - barWidth/2, barY, barWidth * (ship.hull / ship.maxHull), 8);

  // AP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(x - barWidth/2, barY + 10, barWidth, 6);
  ctx.fillStyle = '#4488ff';
  ctx.fillRect(x - barWidth/2, barY + 10, barWidth * (ship.ap / ship.maxSails), 6);

  // Ship name
  ctx.fillStyle = isEnemy ? PALETTE.blood : PALETTE.gold;
  ctx.font = '12px "IM Fell English SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText(ship.name, x, barY + 30);
}

function renderShop() {
  drawOcean();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(100, 50, 800, 600);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(100, 50, 800, 600);

  ctx.fillStyle = PALETTE.gold;
  ctx.font = '36px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('Shipyard', 500, 100);

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '18px "IM Fell English SC", serif';
  ctx.fillText(`Your Gold: ${window.gameState.gold}`, 500, 140);

  // Ship list
  const ships = Object.entries(SHIPS);
  ships.forEach(([key, ship], i) => {
    const x = 150;
    const y = 180 + i * 65;
    const canAfford = window.gameState.gold >= ship.cost;

    ctx.fillStyle = canAfford ? PALETTE.woodDark : '#222';
    ctx.fillRect(x, y, 700, 55);
    ctx.strokeStyle = canAfford ? PALETTE.woodLight : '#444';
    ctx.strokeRect(x, y, 700, 55);

    ctx.fillStyle = canAfford ? PALETTE.parchment : '#666';
    ctx.font = '18px "Pirata One", cursive';
    ctx.textAlign = 'left';
    ctx.fillText(ship.name, x + 20, y + 25);

    ctx.font = '12px "IM Fell English SC", serif';
    ctx.fillText(`Hull: ${ship.hull} | Sails: ${ship.sails} | Crew: ${ship.crew} | Damage: ${ship.damage}`, x + 20, y + 45);

    ctx.textAlign = 'right';
    ctx.fillStyle = canAfford ? PALETTE.gold : '#666';
    ctx.font = '16px "Pirata One", cursive';
    ctx.fillText(ship.cost === 0 ? 'FREE' : `${ship.cost} gold`, x + 680, y + 35);
  });

  // Back button
  ctx.fillStyle = PALETTE.blood;
  ctx.fillRect(420, 600, 160, 40);
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(420, 600, 160, 40);
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = '18px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('Set Sail!', 500, 627);
}

// ============================================
// INPUT
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

  if (state.scene === 'menu') {
    if (mouseY > 275 && mouseY < 325 && mouseX > 350 && mouseX < 650) {
      // New game
      state.gold = 1000;
      state.day = 1;
      state.playerFleet = [createShip('sloop')];
      state.enemyFleet = [createShip('sloop', true)];
      state.scene = 'shop';
      playSound('select');
    }
  } else if (state.scene === 'shop') {
    // Buy ships
    const ships = Object.entries(SHIPS);
    ships.forEach(([key, ship], i) => {
      const y = 180 + i * 65;
      if (mouseY > y && mouseY < y + 55 && mouseX > 150 && mouseX < 850) {
        if (state.gold >= ship.cost && state.playerFleet.length < 4) {
          state.gold -= ship.cost;
          state.playerFleet.push(createShip(key));
          playSound('select');
        }
      }
    });

    // Set sail
    if (mouseY > 600 && mouseY < 640 && mouseX > 420 && mouseX < 580) {
      if (state.playerFleet.length > 0) {
        state.enemyFleet = [createShip('schooner', true), createShip('sloop', true)];
        startBattle();
        playSound('select');
      }
    }
  } else if (state.scene === 'battle') {
    if (state.battleResult) {
      state.scene = 'menu';
      state.playerFleet = [];
      state.enemyFleet = [];
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
          playSound('select');
        }
      }
    });

    // Select attack
    if (state.selectedShip) {
      const attacks = Object.keys(ATTACKS);
      attacks.forEach((key, i) => {
        const x = 80 + i * 230;
        if (mouseX > x && mouseX < x + 200 && mouseY > 620 && mouseY < 680) {
          if (state.selectedShip.ap >= ATTACKS[key].apCost) {
            state.selectedAttack = key;
            playSound('select');
          }
        }
      });
    }

    // Attack enemy ship
    if (state.selectedShip && state.selectedAttack) {
      state.enemyFleet.forEach((ship, i) => {
        if (!isDefeated(ship)) {
          const dist = Math.hypot(mouseX - ship.x, mouseY - ship.y);
          if (dist < 60) {
            playerAttack(i);
          }
        }
      });
    }

    // End turn
    if (mouseX > 850 && mouseX < 980 && mouseY > 610 && mouseY < 650) {
      endTurn();
    }
  }
});

// ============================================
// EXPOSE FOR TESTING
// ============================================
window.startGame = () => {
  const state = window.gameState;
  state.gold = 1000;
  state.playerFleet = [createShip('sloop')];
  state.enemyFleet = [createShip('sloop', true)];
  startBattle();
};

window.SHIPS = SHIPS;
window.ATTACKS = ATTACKS;
window.createShip = createShip;
window.calculateDamage = calculateDamage;
window.applyDamage = applyDamage;
window.isDefeated = isDefeated;
window.shake = shake;
window.particles = particles;
window.initAudio = initAudio;
window.playSound = playSound;

// Start game loop
requestAnimationFrame(gameLoop);
console.log('Caribbean Admiral Polished loaded');
