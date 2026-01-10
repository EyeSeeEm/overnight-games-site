// CITADEL POLISHED - Setup Module
console.log('Setup module loading');

// ============================================
// COLOR PALETTE (Sci-fi Horror inspired by Carrion/Quasimorph)
// ============================================
const PALETTE = {
  // Backgrounds
  bgDark: '#05060a',
  bgMid: '#0a0d15',
  bgLight: '#121824',

  // UI
  uiPrimary: '#00ff88',
  uiSecondary: '#00ccff',
  uiWarning: '#ffaa00',
  uiDanger: '#ff3355',
  uiText: '#e0e8ff',
  uiTextDim: '#6a7a99',

  // Player
  playerCore: '#00ddff',
  playerGlow: '#00ffff',
  playerDash: '#88ffff',

  // Enemies
  enemyOrganic: '#88ff44',
  enemyCyborg: '#ff8844',
  enemyElite: '#ff44ff',
  enemyDrone: '#44ffff',

  // Environment
  platform: '#1a2233',
  platformHighlight: '#2a3344',
  wall: '#0f1520',

  // Effects
  muzzleFlash: '#ffff88',
  explosion: '#ff6622',
  heal: '#44ff88',
  energy: '#44aaff',
  damage: '#ff2244'
};

// ============================================
// SCREEN SHAKE SYSTEM
// ============================================
const screenShake = {
  intensity: 0,
  duration: 0,
  offsetX: 0,
  offsetY: 0,

  shake(intensity, duration) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
  },

  update(dt) {
    if (this.duration > 0) {
      this.duration -= dt;
      const t = this.intensity * (this.duration > 0 ? 1 : 0);
      this.offsetX = (Math.random() - 0.5) * t * 2;
      this.offsetY = (Math.random() - 0.5) * t * 2;
      this.intensity *= 0.9;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
    }
  }
};

// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
  constructor(x, y, vx, vy, color, size, life, gravity = 0, friction = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.gravity = gravity;
    this.friction = friction;
  }

  update(dt) {
    this.vy += this.gravity * dt;
    this.vx *= Math.pow(this.friction, dt * 60);
    this.vy *= Math.pow(this.friction, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    const s = this.size * (0.5 + 0.5 * alpha);
    ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    ctx.globalAlpha = 1;
  }
}

const particles = [];

window.spawnParticles = (x, y, count, config) => {
  const {
    color = PALETTE.uiPrimary,
    speedMin = 50,
    speedMax = 150,
    sizeMin = 2,
    sizeMax = 6,
    lifeMin = 0.3,
    lifeMax = 0.8,
    gravity = 0,
    friction = 0.98,
    angleMin = 0,
    angleMax = Math.PI * 2
  } = config;

  for (let i = 0; i < count; i++) {
    const angle = angleMin + Math.random() * (angleMax - angleMin);
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const size = sizeMin + Math.random() * (sizeMax - sizeMin);
    const life = lifeMin + Math.random() * (lifeMax - lifeMin);

    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color, size, life, gravity, friction
    ));
  }
};

window.updateParticles = (dt) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update(dt)) {
      particles.splice(i, 1);
    }
  }
};

window.drawParticles = (ctx) => {
  for (const p of particles) {
    p.draw(ctx);
  }
};

// ============================================
// AUDIO SYSTEM (Web Audio API)
// ============================================
let audioCtx = null;

window.initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

window.playSound = (type) => {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'jump':
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.type = 'square';
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'doubleJump':
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.type = 'triangle';
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'dash':
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.type = 'sawtooth';
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'shoot':
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.type = 'square';
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case 'melee':
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.type = 'sawtooth';
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'hit':
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.type = 'square';
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'enemyDeath':
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.type = 'sawtooth';
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    case 'pickup':
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.type = 'sine';
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'augmentation':
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.type = 'sine';
      osc.start(now);
      osc.stop(now + 0.4);
      break;
  }
};

// ============================================
// AUGMENTATIONS
// ============================================
const AUGMENTATIONS = {
  hydraulic_legs: { name: 'Hydraulic Legs', effect: 'double_jump', location: 'Medical', color: PALETTE.uiSecondary },
  gecko_pads: { name: 'Gecko Pads', effect: 'wall_jump', location: 'Research', color: PALETTE.enemyOrganic },
  neural_dash: { name: 'Neural Dash', effect: 'dash', location: 'Storage', color: PALETTE.playerDash },
  thermal_shielding: { name: 'Thermal Shielding', effect: 'fire_immune', location: 'Reactor', color: PALETTE.uiDanger },
  hazmat_coating: { name: 'Hazmat Coating', effect: 'toxic_immune', location: 'Groves', color: PALETTE.enemyOrganic },
  magnetic_boots: { name: 'Magnetic Boots', effect: 'zero_g', location: 'Flight', color: PALETTE.uiSecondary },
  system_analyzer: { name: 'System Analyzer', effect: 'see_hp', location: 'Security', color: PALETTE.uiPrimary },
  jump_booster: { name: 'Jump Booster', effect: 'higher_jump', location: 'Bridge', color: PALETTE.playerGlow },
  speed_booster: { name: 'Speed Booster', effect: 'faster', location: 'Executive', color: PALETTE.uiWarning }
};

// ============================================
// WEAPONS
// ============================================
const WEAPONS = {
  pipe: { name: 'Lead Pipe', type: 'melee', damage: 15, attackSpeed: 0.4, color: PALETTE.uiTextDim },
  laser_rapier: { name: 'Laser Rapier', type: 'melee', damage: 35, attackSpeed: 0.25, color: PALETTE.uiDanger },
  minipistol: { name: 'Minipistol', type: 'ballistic', damage: 12, fireRate: 0.2, magSize: 8, color: PALETTE.uiWarning },
  magnum: { name: 'Magnum', type: 'ballistic', damage: 40, fireRate: 0.5, magSize: 6, color: PALETTE.uiDanger },
  sparq_beam: { name: 'Sparq Beam', type: 'energy', damage: 8, fireRate: 0.1, energyCost: 2, color: PALETTE.energy },
  plasma_rifle: { name: 'Plasma Rifle', type: 'energy', damage: 45, fireRate: 0.4, energyCost: 12, color: PALETTE.enemyElite }
};

// ============================================
// ENEMIES
// ============================================
const ENEMY_TYPES = {
  shambler: { hp: 30, damage: 12, speed: 90, behavior: 'chase', color: PALETTE.enemyOrganic },
  maintenance_bot: { hp: 50, damage: 8, speed: 130, behavior: 'patrol', color: PALETTE.uiTextDim },
  cyborg_drone: { hp: 70, damage: 20, speed: 110, behavior: 'fly', color: PALETTE.enemyDrone },
  mutant_gorilla: { hp: 120, damage: 30, speed: 160, behavior: 'charge', color: PALETTE.enemyOrganic },
  elite_cyborg: { hp: 150, damage: 25, speed: 140, behavior: 'tactical', color: PALETTE.enemyCyborg },
  cortex_reaver: { hp: 100, damage: 40, speed: 70, behavior: 'psi', color: PALETTE.enemyElite }
};

// ============================================
// DECKS
// ============================================
const DECKS = {
  medical: { name: 'Medical Deck', enemies: ['shambler', 'maintenance_bot'], boss: 'CYBORG_HUNTER' },
  research: { name: 'Research Deck', enemies: ['shambler', 'cyborg_drone'], boss: 'MUTANT_QUEEN' },
  storage: { name: 'Storage Deck', enemies: ['cyborg_drone', 'mutant_gorilla'], boss: 'LOADER_MECH' },
  reactor: { name: 'Reactor Deck', enemies: ['maintenance_bot', 'cyborg_drone'], boss: 'CORE_GUARDIAN' },
  groves: { name: 'Groves Deck', enemies: ['mutant_gorilla', 'cortex_reaver'], boss: 'BIO_HORROR' },
  flight: { name: 'Flight Deck', enemies: ['cyborg_drone', 'elite_cyborg'], boss: 'ASSAULT_DRONE' },
  security: { name: 'Security Deck', enemies: ['elite_cyborg', 'maintenance_bot'], boss: 'SEC_COMMANDER' },
  bridge: { name: 'Bridge Deck', enemies: ['elite_cyborg', 'cortex_reaver'], boss: 'SHODAN' },
  executive: { name: 'Executive Deck', enemies: ['elite_cyborg', 'cortex_reaver'], boss: 'SHODAN' }
};

// ============================================
// PHYSICS
// ============================================
const PHYSICS = {
  gravity: 1200,
  walkSpeed: 300,
  walkAccel: 2000,
  friction: 2800,
  airControl: 0.75,
  jumpVelocity: -500,
  doubleJumpVelocity: -420,
  terminalVelocity: 750,
  wallSlideSpeed: 100,
  wallJumpXVelocity: 350,
  wallJumpYVelocity: -450,
  dashSpeed: 850,
  dashDuration: 0.22,
  dashCooldown: 0.7
};

// ============================================
// GAME STATE
// ============================================
window.gameState = {
  scene: 'menu',

  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,

  x: 100,
  y: 400,
  velocityX: 0,
  velocityY: 0,
  onGround: false,
  onWall: false,
  facingRight: true,

  hasDoubleJumped: false,
  doubleJumpAvailable: true,
  isDashing: false,
  dashCooldown: 0,
  dashTrailTimer: 0,

  augmentations: {
    hydraulic_legs: false,
    gecko_pads: false,
    neural_dash: false,
    thermal_shielding: false,
    hazmat_coating: false,
    magnetic_boots: false,
    system_analyzer: false,
    jump_booster: false,
    speed_booster: false
  },

  currentWeapon: 'pipe',
  weapons: ['pipe'],
  currentMag: 8,
  attackCooldown: 0,

  invincible: false,
  invincibilityTimer: 0,
  hitFlashTimer: 0,

  currentDeck: 'medical',
  enemies: [],

  bossActive: false,
  bossHp: 0,
  bossMaxHp: 300,
  bossPhase: 1,

  enemiesKilled: 0,
  deaths: 0,
  comboCount: 0,
  comboTimer: 0
};

// ============================================
// GAME FUNCTIONS
// ============================================

window.startGame = () => {
  const state = window.gameState;
  state.scene = 'game';
  state.health = state.maxHealth;
  state.energy = state.maxEnergy;
  state.x = 100;
  state.y = 400;
  state.velocityX = 0;
  state.velocityY = 0;
  state.enemies = [];
  state.invincible = false;
  window.initAudio();
};

window.jump = () => {
  const state = window.gameState;

  if (state.onGround) {
    state.velocityY = PHYSICS.jumpVelocity;
    state.onGround = false;
    state.hasDoubleJumped = false;
    state.doubleJumpAvailable = true;
    window.playSound('jump');
    window.spawnParticles(state.x, state.y + 20, 8, {
      color: PALETTE.platform,
      speedMin: 30, speedMax: 80,
      sizeMin: 3, sizeMax: 6,
      lifeMin: 0.2, lifeMax: 0.4,
      angleMin: -Math.PI, angleMax: 0,
      gravity: 400
    });
    return { success: true, type: 'normal' };
  }

  if (state.augmentations.hydraulic_legs && state.doubleJumpAvailable && !state.hasDoubleJumped) {
    state.velocityY = PHYSICS.doubleJumpVelocity;
    state.hasDoubleJumped = true;
    state.doubleJumpAvailable = false;
    window.playSound('doubleJump');
    window.spawnParticles(state.x, state.y + 10, 12, {
      color: PALETTE.playerGlow,
      speedMin: 50, speedMax: 120,
      sizeMin: 2, sizeMax: 5,
      lifeMin: 0.3, lifeMax: 0.5,
      gravity: 200
    });
    return { success: true, type: 'double' };
  }

  if (state.augmentations.gecko_pads && state.onWall) {
    state.velocityX = state.facingRight ? -PHYSICS.wallJumpXVelocity : PHYSICS.wallJumpXVelocity;
    state.velocityY = PHYSICS.wallJumpYVelocity;
    state.facingRight = !state.facingRight;
    state.onWall = false;
    state.doubleJumpAvailable = true;
    window.playSound('jump');
    return { success: true, type: 'wall' };
  }

  return { success: false };
};

window.dash = () => {
  const state = window.gameState;

  if (!state.augmentations.neural_dash) return { success: false };
  if (state.dashCooldown > 0) return { success: false };
  if (state.isDashing) return { success: false };

  state.isDashing = true;
  state.invincible = true;
  state.velocityX = state.facingRight ? PHYSICS.dashSpeed : -PHYSICS.dashSpeed;
  state.velocityY = 0;

  window.playSound('dash');
  screenShake.shake(3, 0.1);

  setTimeout(() => {
    state.isDashing = false;
    state.invincible = false;
    state.dashCooldown = PHYSICS.dashCooldown;
  }, PHYSICS.dashDuration * 1000);

  return { success: true };
};

window.updateMovement = (dt, inputX) => {
  const state = window.gameState;

  // Dash trail
  if (state.isDashing) {
    state.dashTrailTimer -= dt;
    if (state.dashTrailTimer <= 0) {
      state.dashTrailTimer = 0.03;
      window.spawnParticles(state.x, state.y, 3, {
        color: PALETTE.playerDash,
        speedMin: 10, speedMax: 30,
        sizeMin: 4, sizeMax: 8,
        lifeMin: 0.15, lifeMax: 0.25
      });
    }
    return;
  }

  const speed = state.augmentations.speed_booster ? PHYSICS.walkSpeed + 80 : PHYSICS.walkSpeed;
  const accel = state.onGround ? PHYSICS.walkAccel : PHYSICS.walkAccel * PHYSICS.airControl;

  if (inputX !== 0) {
    state.velocityX += inputX * accel * dt;
    state.velocityX = Math.max(-speed, Math.min(speed, state.velocityX));
    state.facingRight = inputX > 0;
  } else if (state.onGround) {
    if (state.velocityX > 0) {
      state.velocityX = Math.max(0, state.velocityX - PHYSICS.friction * dt);
    } else if (state.velocityX < 0) {
      state.velocityX = Math.min(0, state.velocityX + PHYSICS.friction * dt);
    }
  }

  if (state.onWall && state.velocityY > 0 && state.augmentations.gecko_pads) {
    state.velocityY = Math.min(state.velocityY, PHYSICS.wallSlideSpeed);
  }

  if (!state.onGround) {
    state.velocityY += PHYSICS.gravity * dt;
    state.velocityY = Math.min(state.velocityY, PHYSICS.terminalVelocity);
  }

  state.x += state.velocityX * dt;
  state.y += state.velocityY * dt;

  // Cooldowns
  if (state.dashCooldown > 0) state.dashCooldown -= dt;
  if (state.attackCooldown > 0) state.attackCooldown -= dt;
  if (state.invincibilityTimer > 0) {
    state.invincibilityTimer -= dt;
    if (state.invincibilityTimer <= 0) state.invincible = false;
  }
  if (state.hitFlashTimer > 0) state.hitFlashTimer -= dt;
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.comboCount = 0;
  }

  screenShake.update(dt);
  window.updateParticles(dt);
};

window.attack = () => {
  const state = window.gameState;
  if (state.attackCooldown > 0) return { success: false };

  const weapon = WEAPONS[state.currentWeapon];
  if (!weapon) return { success: false };

  let damage = weapon.damage;

  if (weapon.type === 'melee') {
    state.attackCooldown = weapon.attackSpeed;
    window.playSound('melee');

    // Melee swing particles
    const angle = state.facingRight ? 0 : Math.PI;
    window.spawnParticles(state.x + (state.facingRight ? 30 : -30), state.y, 6, {
      color: weapon.color,
      speedMin: 100, speedMax: 200,
      sizeMin: 2, sizeMax: 4,
      lifeMin: 0.1, lifeMax: 0.2,
      angleMin: angle - 0.5, angleMax: angle + 0.5
    });

    return { success: true, damage, type: 'melee' };
  }

  if (weapon.type === 'ballistic') {
    if (state.currentMag <= 0) return { success: false };
    state.currentMag--;
    state.attackCooldown = weapon.fireRate;
    window.playSound('shoot');
    screenShake.shake(2, 0.05);

    // Muzzle flash
    window.spawnParticles(state.x + (state.facingRight ? 25 : -25), state.y - 5, 5, {
      color: PALETTE.muzzleFlash,
      speedMin: 150, speedMax: 300,
      sizeMin: 3, sizeMax: 6,
      lifeMin: 0.05, lifeMax: 0.1,
      angleMin: state.facingRight ? -0.3 : Math.PI - 0.3,
      angleMax: state.facingRight ? 0.3 : Math.PI + 0.3
    });

    return { success: true, damage, type: 'ranged' };
  }

  if (weapon.type === 'energy') {
    if (state.energy < weapon.energyCost) return { success: false };
    state.energy -= weapon.energyCost;
    state.attackCooldown = weapon.fireRate;
    window.playSound('shoot');

    // Energy beam particles
    window.spawnParticles(state.x + (state.facingRight ? 25 : -25), state.y - 5, 8, {
      color: weapon.color,
      speedMin: 200, speedMax: 350,
      sizeMin: 2, sizeMax: 4,
      lifeMin: 0.1, lifeMax: 0.2,
      angleMin: state.facingRight ? -0.2 : Math.PI - 0.2,
      angleMax: state.facingRight ? 0.2 : Math.PI + 0.2
    });

    return { success: true, damage, type: 'energy' };
  }

  return { success: false };
};

window.takeDamage = (amount) => {
  const state = window.gameState;
  if (state.invincible) return false;

  state.health -= amount;
  state.invincible = true;
  state.invincibilityTimer = 1.2;
  state.hitFlashTimer = 0.1;
  state.comboCount = 0;

  window.playSound('hit');
  screenShake.shake(8, 0.15);

  window.spawnParticles(state.x, state.y, 15, {
    color: PALETTE.damage,
    speedMin: 100, speedMax: 250,
    sizeMin: 3, sizeMax: 7,
    lifeMin: 0.3, lifeMax: 0.6,
    gravity: 400
  });

  if (state.health <= 0) {
    state.health = 0;
    state.deaths++;
    return true;
  }
  return false;
};

window.heal = (amount) => {
  const state = window.gameState;
  state.health = Math.min(state.health + amount, state.maxHealth);
  window.spawnParticles(state.x, state.y, 10, {
    color: PALETTE.heal,
    speedMin: 30, speedMax: 80,
    sizeMin: 3, sizeMax: 6,
    lifeMin: 0.4, lifeMax: 0.7,
    gravity: -100
  });
};

window.restoreEnergy = (amount) => {
  window.gameState.energy = Math.min(
    window.gameState.energy + amount,
    window.gameState.maxEnergy
  );
};

window.spawnEnemy = (type) => {
  const data = ENEMY_TYPES[type];
  if (!data) return null;

  const enemy = {
    id: Date.now() + Math.random(),
    type,
    hp: data.hp,
    maxHp: data.hp,
    damage: data.damage,
    speed: data.speed,
    color: data.color,
    x: 150 + Math.random() * 500,
    y: 450,
    hitFlash: 0
  };

  window.gameState.enemies.push(enemy);
  return enemy;
};

window.damageEnemy = (enemyId, damage) => {
  const state = window.gameState;
  const enemy = state.enemies.find(e => e.id === enemyId);
  if (!enemy) return { hit: false };

  enemy.hp -= damage;
  enemy.hitFlash = 0.1;
  state.damageDealt = (state.damageDealt || 0) + damage;

  // Hit particles
  window.spawnParticles(enemy.x, enemy.y, 8, {
    color: enemy.color,
    speedMin: 80, speedMax: 180,
    sizeMin: 2, sizeMax: 5,
    lifeMin: 0.2, lifeMax: 0.4,
    gravity: 300
  });

  if (enemy.hp <= 0) {
    return { hit: true, killed: true };
  }
  return { hit: true, killed: false };
};

window.killEnemy = (enemyId) => {
  const state = window.gameState;
  const idx = state.enemies.findIndex(e => e.id === enemyId);
  if (idx === -1) return false;

  const enemy = state.enemies[idx];

  // Death explosion
  window.playSound('enemyDeath');
  screenShake.shake(5, 0.1);
  window.spawnParticles(enemy.x, enemy.y, 25, {
    color: enemy.color,
    speedMin: 100, speedMax: 300,
    sizeMin: 3, sizeMax: 8,
    lifeMin: 0.3, lifeMax: 0.7,
    gravity: 400
  });

  state.enemiesKilled++;
  state.comboCount++;
  state.comboTimer = 2;
  state.enemies.splice(idx, 1);
  return true;
};

window.acquireAugmentation = (augId) => {
  const aug = AUGMENTATIONS[augId];
  if (!aug) return false;
  if (window.gameState.augmentations[augId]) return false;

  window.gameState.augmentations[augId] = true;
  window.playSound('augmentation');
  screenShake.shake(4, 0.2);

  window.spawnParticles(window.gameState.x, window.gameState.y, 30, {
    color: aug.color,
    speedMin: 50, speedMax: 150,
    sizeMin: 3, sizeMax: 7,
    lifeMin: 0.5, lifeMax: 1.0,
    gravity: -50
  });

  return true;
};

window.startBoss = (bossName) => {
  const bossHp = {
    'CYBORG_HUNTER': 250,
    'MUTANT_QUEEN': 350,
    'LOADER_MECH': 400,
    'CORE_GUARDIAN': 450,
    'BIO_HORROR': 500,
    'ASSAULT_DRONE': 450,
    'SEC_COMMANDER': 550,
    'SHODAN': 900
  };

  window.gameState.bossActive = true;
  window.gameState.bossHp = bossHp[bossName] || 300;
  window.gameState.bossMaxHp = window.gameState.bossHp;
  window.gameState.bossPhase = 1;
  screenShake.shake(10, 0.5);
  return true;
};

window.damageBoss = (damage) => {
  const state = window.gameState;
  if (!state.bossActive) return false;

  state.bossHp -= damage;
  screenShake.shake(6, 0.1);

  const hpPercent = state.bossHp / state.bossMaxHp;
  if (hpPercent <= 0.3 && state.bossPhase < 3) {
    state.bossPhase = 3;
    screenShake.shake(15, 0.3);
  } else if (hpPercent <= 0.6 && state.bossPhase < 2) {
    state.bossPhase = 2;
    screenShake.shake(12, 0.25);
  }

  if (state.bossHp <= 0) {
    state.bossActive = false;
    screenShake.shake(20, 0.5);
    return true;
  }
  return false;
};

// ============================================
// EXPOSE GLOBALS
// ============================================
window.PALETTE = PALETTE;
window.AUGMENTATIONS = AUGMENTATIONS;
window.WEAPONS = WEAPONS;
window.ENEMY_TYPES = ENEMY_TYPES;
window.DECKS = DECKS;
window.PHYSICS = PHYSICS;
window.screenShake = screenShake;

console.log('Setup complete');
