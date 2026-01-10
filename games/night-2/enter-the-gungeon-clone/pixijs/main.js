// Enter the Gungeon Clone - Bullet-Hell Roguelike with Dodge Roll
// Built with vanilla Canvas

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game configuration
const CONFIG = {
  width: 800,
  height: 600,
  roomWidth: 520,
  roomHeight: 340,
  roomOffsetX: 140,
  roomOffsetY: 130,
  playerSpeed: 220,
  bulletSpeed: 500,
  dodgeRollDuration: 350,
  dodgeRollDistance: 150,
  dodgeRollIFrames: 175, // First half of roll
  reloadTime: 1000
};

// Game state
const game = {
  state: 'menu',
  player: null,
  enemies: [],
  bullets: [],
  pickups: [],
  particles: [],
  floor: 1,
  roomX: 0,
  roomY: 0,
  rooms: {},
  roomsCleared: 0,
  keys: 1,
  blanks: 2,
  lastTime: 0,
  keysPressed: {},
  mouseX: 400,
  mouseY: 300,
  soundEnabled: true,
  stats: {
    gamesPlayed: 0,
    enemiesKilled: 0,
    bestFloor: 0,
    bossesDefeated: 0
  }
};

// Audio
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(freq, type = 'square', duration = 0.1, volume = 0.2) {
  if (!game.soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// Room types
const ROOM_TYPES = { NORMAL: 'normal', BOSS: 'boss', START: 'start', CHEST: 'chest' };

// Weapons
const WEAPONS = {
  pistol: { name: 'Pistol', damage: 6, fireRate: 200, magSize: 10, maxAmmo: Infinity, spread: 5, bulletSpeed: 500, color: '#ffff00' },
  shotgun: { name: 'Shotgun', damage: 4, fireRate: 600, magSize: 6, maxAmmo: 40, spread: 15, bulletSpeed: 400, pellets: 5, color: '#ffaa00' },
  machineGun: { name: 'Machine Gun', damage: 3, fireRate: 80, magSize: 30, maxAmmo: 150, spread: 8, bulletSpeed: 550, color: '#44ff44' },
  laser: { name: 'Laser Rifle', damage: 12, fireRate: 400, magSize: 8, maxAmmo: 50, spread: 0, bulletSpeed: 800, color: '#00ffff' }
};

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.hp = 3;
    this.maxHp = 3;
    this.armor = 0;
    this.weapon = { ...WEAPONS.pistol, ammo: WEAPONS.pistol.maxAmmo, mag: WEAPONS.pistol.magSize };
    this.weapons = [this.weapon];
    this.weaponIndex = 0;
    this.isRolling = false;
    this.isInvincible = false;
    this.isReloading = false;
    this.rollTimer = 0;
    this.rollDir = { x: 0, y: -1 };
    this.invincibleTimer = 0;
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.aimAngle = 0;
  }

  update(dt) {
    // Update timers
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt * 1000;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }
    if (this.fireTimer > 0) this.fireTimer -= dt * 1000;
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt * 1000;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.weapon.mag = this.weapon.magSize;
        playSound(500, 'sine', 0.1, 0.2);
      }
    }

    // Dodge roll update
    if (this.isRolling) {
      this.rollTimer -= dt * 1000;
      const rollSpeed = CONFIG.dodgeRollDistance / (CONFIG.dodgeRollDuration / 1000);
      this.x += this.rollDir.x * rollSpeed * dt;
      this.y += this.rollDir.y * rollSpeed * dt;

      // I-frames for first half
      if (this.rollTimer > CONFIG.dodgeRollDuration / 2) {
        this.isInvincible = true;
      } else {
        this.isInvincible = false;
      }

      if (this.rollTimer <= 0) {
        this.isRolling = false;
      }
    } else {
      // Normal movement
      let mx = 0, my = 0;
      if (game.keysPressed['KeyA'] || game.keysPressed['ArrowLeft']) mx -= 1;
      if (game.keysPressed['KeyD'] || game.keysPressed['ArrowRight']) mx += 1;
      if (game.keysPressed['KeyW'] || game.keysPressed['ArrowUp']) my -= 1;
      if (game.keysPressed['KeyS'] || game.keysPressed['ArrowDown']) my += 1;

      if (mx !== 0 && my !== 0) {
        mx *= 0.7071;
        my *= 0.7071;
      }

      this.x += mx * CONFIG.playerSpeed * dt;
      this.y += my * CONFIG.playerSpeed * dt;
    }

    // Clamp to room
    const minX = CONFIG.roomOffsetX + this.radius;
    const maxX = CONFIG.roomOffsetX + CONFIG.roomWidth - this.radius;
    const minY = CONFIG.roomOffsetY + this.radius;
    const maxY = CONFIG.roomOffsetY + CONFIG.roomHeight - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // Aim angle
    this.aimAngle = Math.atan2(game.mouseY - this.y, game.mouseX - this.x);

    // Shooting
    if (game.keysPressed['click'] && !this.isRolling && !this.isReloading && this.fireTimer <= 0) {
      this.shoot();
    }

    // Reload
    if (game.keysPressed['KeyR'] && !this.isReloading && this.weapon.mag < this.weapon.magSize) {
      this.startReload();
    }

    // Dodge roll
    if ((game.keysPressed['Space'] || game.keysPressed['ShiftLeft']) && !this.isRolling) {
      this.dodgeRoll();
      game.keysPressed['Space'] = false;
      game.keysPressed['ShiftLeft'] = false;
    }

    // Blank
    if (game.keysPressed['KeyQ'] && game.blanks > 0) {
      this.useBlank();
      game.keysPressed['KeyQ'] = false;
    }
  }

  shoot() {
    if (this.weapon.mag <= 0) {
      this.startReload();
      return;
    }

    const pellets = this.weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const spread = (Math.random() - 0.5) * this.weapon.spread * Math.PI / 180;
      const angle = this.aimAngle + spread;
      game.bullets.push({
        x: this.x + Math.cos(angle) * 20,
        y: this.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * this.weapon.bulletSpeed,
        vy: Math.sin(angle) * this.weapon.bulletSpeed,
        radius: 4,
        damage: this.weapon.damage,
        color: this.weapon.color,
        isPlayer: true
      });
    }

    this.weapon.mag--;
    if (this.weapon.ammo !== Infinity) this.weapon.ammo--;
    this.fireTimer = this.weapon.fireRate;
    playSound(400 + Math.random() * 100, 'square', 0.05, 0.15);
  }

  startReload() {
    if (this.weapon.ammo <= 0 && this.weapon.ammo !== Infinity) return;
    this.isReloading = true;
    this.reloadTimer = CONFIG.reloadTime;
    playSound(300, 'sine', 0.1, 0.15);
  }

  dodgeRoll() {
    let mx = 0, my = 0;
    if (game.keysPressed['KeyA'] || game.keysPressed['ArrowLeft']) mx -= 1;
    if (game.keysPressed['KeyD'] || game.keysPressed['ArrowRight']) mx += 1;
    if (game.keysPressed['KeyW'] || game.keysPressed['ArrowUp']) my -= 1;
    if (game.keysPressed['KeyS'] || game.keysPressed['ArrowDown']) my += 1;

    if (mx === 0 && my === 0) {
      mx = Math.cos(this.aimAngle);
      my = Math.sin(this.aimAngle);
    }

    const len = Math.sqrt(mx * mx + my * my);
    this.rollDir = { x: mx / len, y: my / len };
    this.isRolling = true;
    this.isInvincible = true;
    this.rollTimer = CONFIG.dodgeRollDuration;
    playSound(200, 'sine', 0.1, 0.2);
  }

  useBlank() {
    game.blanks--;
    game.bullets = game.bullets.filter(b => b.isPlayer);
    this.isInvincible = true;
    this.invincibleTimer = 500;
    spawnParticles(this.x, this.y, '#ffffff', 30);
    playSound(100, 'sawtooth', 0.3, 0.3);
  }

  takeDamage(amount) {
    if (this.isInvincible) return;

    if (this.armor > 0) {
      this.armor -= amount;
      if (this.armor < 0) {
        this.hp += this.armor;
        this.armor = 0;
      }
    } else {
      this.hp -= amount;
    }

    this.isInvincible = true;
    this.invincibleTimer = 1000;
    spawnParticles(this.x, this.y, '#ff0000', 10);
    playSound(150, 'sawtooth', 0.2, 0.3);

    if (this.hp <= 0) gameOver();
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length) {
      this.weaponIndex = index;
      this.weapon = this.weapons[index];
      this.isReloading = false;
      this.reloadTimer = 0;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flash when invincible
    if (this.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Roll animation
    if (this.isRolling) {
      const rollProgress = 1 - (this.rollTimer / CONFIG.dodgeRollDuration);
      ctx.rotate(rollProgress * Math.PI * 2);
      ctx.scale(0.8, 0.8);
    }

    // Body
    ctx.fillStyle = '#4a4a6a';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f4c8a8';
    ctx.beginPath();
    ctx.arc(0, -2, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-4, -4, 2, 0, Math.PI * 2);
    ctx.arc(4, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Gun (not rotated with body)
    if (!this.isRolling) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.aimAngle);
      ctx.fillStyle = '#666666';
      ctx.fillRect(10, -3, 20, 6);
      ctx.fillStyle = '#444444';
      ctx.fillRect(28, -2, 5, 4);
      ctx.restore();
    }
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.type = type;
    this.radius = 14;
    this.fireTimer = 1000 + Math.random() * 1000;
    this.moveTimer = 0;
    this.knockbackX = 0;
    this.knockbackY = 0;

    switch (type) {
      case 'bulletKin':
        this.hp = 15;
        this.speed = 60;
        this.fireRate = 1500;
        this.color = '#ffcc00';
        this.bulletCount = 1;
        break;
      case 'shotgunKin':
        this.hp = 20;
        this.speed = 40;
        this.fireRate = 2000;
        this.color = '#ff6600';
        this.bulletCount = 5;
        this.bulletSpread = 30;
        break;
      case 'gunNut':
        this.hp = 30;
        this.speed = 80;
        this.fireRate = 200;
        this.color = '#666666';
        this.bulletCount = 1;
        this.burstCount = 5;
        this.burstRemaining = 0;
        break;
      case 'boss':
        this.hp = 200;
        this.maxHp = 200;
        this.speed = 50;
        this.fireRate = 800;
        this.color = '#ff0066';
        this.radius = 35;
        this.phase = 0;
        this.patternTimer = 0;
        break;
      default:
        this.hp = 10;
        this.speed = 50;
        this.fireRate = 2000;
        this.color = '#aa8844';
        this.bulletCount = 1;
    }
    this.maxHp = this.maxHp || this.hp;
  }

  update(dt) {
    // Apply knockback
    this.x += this.knockbackX * dt;
    this.y += this.knockbackY * dt;
    this.knockbackX *= 0.9;
    this.knockbackY *= 0.9;

    this.moveTimer += dt * 1000;
    this.fireTimer -= dt * 1000;

    if (this.type === 'boss') {
      this.bossAI(dt);
    } else {
      this.normalAI(dt);
    }

    // Clamp to room
    const minX = CONFIG.roomOffsetX + this.radius;
    const maxX = CONFIG.roomOffsetX + CONFIG.roomWidth - this.radius;
    const minY = CONFIG.roomOffsetY + this.radius;
    const maxY = CONFIG.roomOffsetY + CONFIG.roomHeight - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    if (this.fireTimer <= 0) {
      this.attack();
    }
  }

  normalAI(dt) {
    if (!game.player) return;
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Keep distance
    const targetDist = this.type === 'shotgunKin' ? 150 : 200;
    if (dist > targetDist + 50) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    } else if (dist < targetDist - 50) {
      this.x -= (dx / dist) * this.speed * dt;
      this.y -= (dy / dist) * this.speed * dt;
    }
  }

  bossAI(dt) {
    this.patternTimer += dt * 1000;

    // Phase transitions
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent < 0.33) this.phase = 2;
    else if (hpPercent < 0.66) this.phase = 1;

    // Movement
    const centerX = CONFIG.roomOffsetX + CONFIG.roomWidth / 2;
    const centerY = CONFIG.roomOffsetY + CONFIG.roomHeight / 2;
    const orbitRadius = 80;
    this.x = centerX + Math.cos(this.patternTimer / 1500) * orbitRadius;
    this.y = centerY + Math.sin(this.patternTimer / 2000) * 50 - 50;
  }

  attack() {
    if (!game.player) return;

    if (this.burstRemaining > 0) {
      this.shootAtPlayer();
      this.burstRemaining--;
      this.fireTimer = 100;
      return;
    }

    if (this.type === 'boss') {
      this.bossAttack();
    } else {
      this.shootAtPlayer();
    }

    if (this.burstCount) {
      this.burstRemaining = this.burstCount - 1;
      this.fireTimer = 100;
    } else {
      this.fireTimer = this.fireRate;
    }
  }

  shootAtPlayer() {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const angle = Math.atan2(dy, dx);

    const count = this.bulletCount || 1;
    const spread = (this.bulletSpread || 0) * Math.PI / 180;

    for (let i = 0; i < count; i++) {
      const offset = count > 1 ? (i - (count - 1) / 2) * (spread / count) : 0;
      game.bullets.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle + offset) * 200,
        vy: Math.sin(angle + offset) * 200,
        radius: 5,
        damage: 0.5,
        color: '#ff4444',
        isPlayer: false
      });
    }
    playSound(300, 'square', 0.08, 0.15);
  }

  bossAttack() {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const angle = Math.atan2(dy, dx);

    switch (this.phase) {
      case 0:
        // Simple spread
        for (let i = -2; i <= 2; i++) {
          game.bullets.push({
            x: this.x, y: this.y,
            vx: Math.cos(angle + i * 0.2) * 180,
            vy: Math.sin(angle + i * 0.2) * 180,
            radius: 6, damage: 0.5, color: '#ff4488', isPlayer: false
          });
        }
        this.fireTimer = 1000;
        break;
      case 1:
        // Ring pattern
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          game.bullets.push({
            x: this.x, y: this.y,
            vx: Math.cos(a) * 150,
            vy: Math.sin(a) * 150,
            radius: 5, damage: 0.5, color: '#ff6688', isPlayer: false
          });
        }
        this.fireTimer = 800;
        break;
      case 2:
        // Spiral + aimed
        const spiralAngle = this.patternTimer / 100;
        game.bullets.push({
          x: this.x, y: this.y,
          vx: Math.cos(spiralAngle) * 180,
          vy: Math.sin(spiralAngle) * 180,
          radius: 5, damage: 0.5, color: '#ff88aa', isPlayer: false
        });
        game.bullets.push({
          x: this.x, y: this.y,
          vx: Math.cos(spiralAngle + Math.PI) * 180,
          vy: Math.sin(spiralAngle + Math.PI) * 180,
          radius: 5, damage: 0.5, color: '#ff88aa', isPlayer: false
        });
        this.fireTimer = 100;
        break;
    }
    playSound(250, 'square', 0.1, 0.2);
  }

  takeDamage(amount, dx, dy) {
    this.hp -= amount;
    // Knockback
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.knockbackX = (dx / dist) * 100;
      this.knockbackY = (dy / dist) * 100;
    }
    spawnParticles(this.x, this.y, this.color, 3);
    return this.hp <= 0;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.color;

    if (this.type === 'boss') {
      // Boss is a large menacing shape
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = this.radius + Math.sin(Date.now() / 200 + i) * 5;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Face
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-10, -5, 6, 0, Math.PI * 2);
      ctx.arc(10, -5, 6, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(-40, -50, 80, 8);
      ctx.fillStyle = '#ff0066';
      ctx.fillRect(-40, -50, 80 * (this.hp / this.maxHp), 8);
    } else {
      // Bullet-shaped body
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, -2, 3, 0, Math.PI * 2);
      ctx.arc(4, -2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Angry mouth
      ctx.beginPath();
      ctx.arc(0, 5, 5, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Particles
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      life: 0.5,
      color,
      radius: 2 + Math.random() * 3
    });
  }
}

// Room generation
function generateFloor() {
  game.rooms = {};
  game.roomX = 0;
  game.roomY = 0;

  createRoom(0, 0, ROOM_TYPES.START);

  const roomCount = 4 + game.floor * 2;
  const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let lastX = 0, lastY = 0;

  for (let i = 0; i < roomCount; i++) {
    const dir = directions[Math.floor(Math.random() * directions.length)];
    let nx = lastX + dir[0];
    let ny = lastY + dir[1];
    if (nx === 0 && ny === 0) continue;
    if (!game.rooms[`${nx},${ny}`]) {
      createRoom(nx, ny, ROOM_TYPES.NORMAL);
      lastX = nx;
      lastY = ny;
    }
  }

  // Chest room
  const normalRooms = Object.entries(game.rooms).filter(([k, v]) => v.type === ROOM_TYPES.NORMAL);
  if (normalRooms.length > 0) {
    const chestRoom = normalRooms[Math.floor(Math.random() * normalRooms.length)];
    game.rooms[chestRoom[0]].type = ROOM_TYPES.CHEST;
  }

  // Boss room
  game.rooms[`${lastX},${lastY}`].type = ROOM_TYPES.BOSS;
}

function createRoom(x, y, type) {
  game.rooms[`${x},${y}`] = { type, cleared: type === ROOM_TYPES.START, pickups: [] };
}

function enterRoom(x, y) {
  const key = `${x},${y}`;
  const room = game.rooms[key];
  if (!room) return;

  game.roomX = x;
  game.roomY = y;
  game.enemies = [];
  game.bullets = [];
  game.pickups = [];

  game.player.x = CONFIG.roomOffsetX + CONFIG.roomWidth / 2;
  game.player.y = CONFIG.roomOffsetY + CONFIG.roomHeight / 2;

  if (!room.cleared) {
    spawnEnemies(room.type);
  }

  if (room.type === ROOM_TYPES.CHEST && !room.cleared) {
    game.pickups.push({
      x: CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
      y: CONFIG.roomOffsetY + CONFIG.roomHeight / 2,
      type: 'chest', radius: 20
    });
  }
}

function spawnEnemies(roomType) {
  if (roomType === ROOM_TYPES.START || roomType === ROOM_TYPES.CHEST) return;

  if (roomType === ROOM_TYPES.BOSS) {
    game.enemies.push(new Enemy(
      CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
      CONFIG.roomOffsetY + 100,
      'boss'
    ));
    return;
  }

  const count = 3 + Math.floor(game.floor / 2) + Math.floor(Math.random() * 2);
  const types = ['bulletKin', 'shotgunKin'];
  if (game.floor >= 2) types.push('gunNut');

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const x = CONFIG.roomOffsetX + 50 + Math.random() * (CONFIG.roomWidth - 100);
    const y = CONFIG.roomOffsetY + 50 + Math.random() * (CONFIG.roomHeight - 100);
    game.enemies.push(new Enemy(x, y, type));
  }
}

function clearRoom() {
  const key = `${game.roomX},${game.roomY}`;
  const room = game.rooms[key];
  if (room && !room.cleared) {
    room.cleared = true;
    game.roomsCleared++;

    // Rewards
    if (Math.random() < 0.3) {
      game.pickups.push({
        x: CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
        y: CONFIG.roomOffsetY + CONFIG.roomHeight / 2,
        type: Math.random() < 0.5 ? 'heart' : 'ammo',
        radius: 10
      });
    }

    if (room.type === ROOM_TYPES.BOSS) {
      game.stats.bossesDefeated++;
      game.pickups.push({
        x: CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
        y: CONFIG.roomOffsetY + CONFIG.roomHeight / 2,
        type: 'elevator', radius: 25
      });
    }

    playSound(880, 'sine', 0.2, 0.2);
  }
}

// Game functions
function startGame() {
  initAudio();
  game.state = 'playing';
  game.player = new Player(CONFIG.roomOffsetX + CONFIG.roomWidth / 2, CONFIG.roomOffsetY + CONFIG.roomHeight / 2);
  game.floor = 1;
  game.keys = 1;
  game.blanks = 2;
  game.roomsCleared = 0;
  game.stats.gamesPlayed++;
  generateFloor();
  enterRoom(0, 0);
  playSound(440, 'sine', 0.2, 0.2);
}

function nextFloor() {
  game.floor++;
  game.blanks = 2;
  game.stats.bestFloor = Math.max(game.stats.bestFloor, game.floor);
  generateFloor();
  enterRoom(0, 0);
  playSound(660, 'sine', 0.3, 0.2);
}

function gameOver() {
  game.state = 'gameover';
  game.stats.bestFloor = Math.max(game.stats.bestFloor, game.floor);
  saveStats();
  playSound(110, 'sawtooth', 0.5, 0.3);
}

function saveStats() {
  try { localStorage.setItem('gungeon_stats', JSON.stringify(game.stats)); } catch (e) {}
}

function loadStats() {
  try {
    const saved = localStorage.getItem('gungeon_stats');
    if (saved) Object.assign(game.stats, JSON.parse(saved));
  } catch (e) {}
}

// Update functions
function updateBullets(dt) {
  game.bullets = game.bullets.filter(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.isPlayer) {
      for (let i = game.enemies.length - 1; i >= 0; i--) {
        const e = game.enemies[i];
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + e.radius) {
          if (e.takeDamage(b.damage, dx, dy)) {
            game.enemies.splice(i, 1);
            game.stats.enemiesKilled++;
            // Drop
            if (Math.random() < 0.2) {
              game.pickups.push({
                x: e.x, y: e.y,
                type: Math.random() < 0.5 ? 'ammo' : 'heart',
                radius: 10
              });
            }
          }
          return false;
        }
      }
    } else {
      if (game.player && !game.player.isInvincible) {
        const dx = b.x - game.player.x;
        const dy = b.y - game.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + game.player.radius) {
          game.player.takeDamage(b.damage);
          return false;
        }
      }
    }

    return b.x > CONFIG.roomOffsetX && b.x < CONFIG.roomOffsetX + CONFIG.roomWidth &&
           b.y > CONFIG.roomOffsetY && b.y < CONFIG.roomOffsetY + CONFIG.roomHeight;
  });
}

function updatePickups() {
  if (!game.player) return;
  game.pickups = game.pickups.filter(p => {
    const dx = p.x - game.player.x;
    const dy = p.y - game.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < p.radius + game.player.radius) {
      switch (p.type) {
        case 'heart':
          if (game.player.hp < game.player.maxHp) {
            game.player.hp++;
            playSound(880, 'sine', 0.1, 0.2);
            return false;
          }
          break;
        case 'ammo':
          game.player.weapon.ammo += 20;
          playSound(600, 'sine', 0.1, 0.2);
          return false;
        case 'chest':
          // Give random weapon
          const weapons = Object.values(WEAPONS).filter(w => w.name !== game.player.weapon.name);
          const newWeapon = weapons[Math.floor(Math.random() * weapons.length)];
          game.player.weapons.push({ ...newWeapon, ammo: newWeapon.maxAmmo, mag: newWeapon.magSize });
          playSound(440, 'sine', 0.3, 0.3);
          return false;
        case 'elevator':
          nextFloor();
          return false;
      }
    }
    return true;
  });
}

function updateParticles(dt) {
  game.particles = game.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
    return p.life > 0;
  });
}

function checkDoors() {
  if (!game.player || game.enemies.length > 0) return;
  const p = game.player;

  if (p.y < CONFIG.roomOffsetY + 30 && game.rooms[`${game.roomX},${game.roomY - 1}`]) {
    enterRoom(game.roomX, game.roomY - 1);
    game.player.y = CONFIG.roomOffsetY + CONFIG.roomHeight - 40;
  } else if (p.y > CONFIG.roomOffsetY + CONFIG.roomHeight - 30 && game.rooms[`${game.roomX},${game.roomY + 1}`]) {
    enterRoom(game.roomX, game.roomY + 1);
    game.player.y = CONFIG.roomOffsetY + 40;
  } else if (p.x < CONFIG.roomOffsetX + 30 && game.rooms[`${game.roomX - 1},${game.roomY}`]) {
    enterRoom(game.roomX - 1, game.roomY);
    game.player.x = CONFIG.roomOffsetX + CONFIG.roomWidth - 40;
  } else if (p.x > CONFIG.roomOffsetX + CONFIG.roomWidth - 30 && game.rooms[`${game.roomX + 1},${game.roomY}`]) {
    enterRoom(game.roomX + 1, game.roomY);
    game.player.x = CONFIG.roomOffsetX + 40;
  }
}

// Draw functions
function drawRoom() {
  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(CONFIG.roomOffsetX, CONFIG.roomOffsetY, CONFIG.roomWidth, CONFIG.roomHeight);

  // Floor tiles
  ctx.fillStyle = '#3a3a5a';
  for (let x = 0; x < CONFIG.roomWidth; x += 40) {
    for (let y = 0; y < CONFIG.roomHeight; y += 40) {
      if ((x / 40 + y / 40) % 2 === 0) {
        ctx.fillRect(CONFIG.roomOffsetX + x, CONFIG.roomOffsetY + y, 40, 40);
      }
    }
  }

  // Walls
  ctx.fillStyle = '#5a5a7a';
  ctx.fillRect(CONFIG.roomOffsetX - 20, CONFIG.roomOffsetY - 20, CONFIG.roomWidth + 40, 20);
  ctx.fillRect(CONFIG.roomOffsetX - 20, CONFIG.roomOffsetY + CONFIG.roomHeight, CONFIG.roomWidth + 40, 20);
  ctx.fillRect(CONFIG.roomOffsetX - 20, CONFIG.roomOffsetY, 20, CONFIG.roomHeight);
  ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth, CONFIG.roomOffsetY, 20, CONFIG.roomHeight);

  // Doors
  const room = game.rooms[`${game.roomX},${game.roomY}`];
  if (room && (room.cleared || game.enemies.length === 0)) {
    ctx.fillStyle = '#1a1a2e';
    if (game.rooms[`${game.roomX},${game.roomY - 1}`])
      ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth / 2 - 20, CONFIG.roomOffsetY - 15, 40, 20);
    if (game.rooms[`${game.roomX},${game.roomY + 1}`])
      ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth / 2 - 20, CONFIG.roomOffsetY + CONFIG.roomHeight - 5, 40, 20);
    if (game.rooms[`${game.roomX - 1},${game.roomY}`])
      ctx.fillRect(CONFIG.roomOffsetX - 15, CONFIG.roomOffsetY + CONFIG.roomHeight / 2 - 20, 20, 40);
    if (game.rooms[`${game.roomX + 1},${game.roomY}`])
      ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth - 5, CONFIG.roomOffsetY + CONFIG.roomHeight / 2 - 20, 20, 40);
  }
}

function drawBullets() {
  game.bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPickups() {
  game.pickups.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);

    switch (p.type) {
      case 'heart':
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.bezierCurveTo(-8, -10, -10, 0, 0, 10);
        ctx.bezierCurveTo(10, 0, 8, -10, 0, -5);
        ctx.fill();
        break;
      case 'ammo':
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(-8, -6, 16, 12);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-5, -3, 3, 6);
        ctx.fillRect(2, -3, 3, 6);
        break;
      case 'chest':
        ctx.fillStyle = '#aa6622';
        ctx.fillRect(-15, -10, 30, 20);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-3, -3, 6, 6);
        break;
      case 'elevator':
        ctx.fillStyle = '#444466';
        ctx.fillRect(-20, -20, 40, 40);
        ctx.fillStyle = '#222244';
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, -10);
        ctx.lineTo(-8, 0);
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.stroke();
        break;
    }

    ctx.restore();
  });
}

function drawParticles() {
  game.particles.forEach(p => {
    ctx.globalAlpha = p.life * 2;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * p.life * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.roomOffsetY - 20);
  ctx.fillRect(0, CONFIG.roomOffsetY + CONFIG.roomHeight + 20, CONFIG.width, 100);

  // Hearts
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText('HP:', 20, 30);
  for (let i = 0; i < game.player.maxHp; i++) {
    ctx.fillStyle = i < game.player.hp ? '#ff4444' : '#333';
    ctx.beginPath();
    const hx = 55 + i * 25;
    ctx.moveTo(hx, 20);
    ctx.bezierCurveTo(hx - 8, 15, hx - 10, 25, hx, 33);
    ctx.bezierCurveTo(hx + 10, 25, hx + 8, 15, hx, 20);
    ctx.fill();
  }

  // Blanks
  ctx.fillStyle = '#fff';
  ctx.fillText(`Blanks: ${game.blanks}`, 20, 60);
  ctx.fillText(`Keys: ${game.keys}`, 120, 60);

  // Weapon info
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`${game.player.weapon.name}`, 250, 30);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Ammo: ${game.player.weapon.mag}/${game.player.weapon.ammo === Infinity ? '∞' : game.player.weapon.ammo}`, 250, 60);
  if (game.player.isReloading) {
    ctx.fillStyle = '#ffaa00';
    ctx.fillText('RELOADING...', 400, 45);
  }

  // Floor
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Floor ${game.floor}`, CONFIG.width - 20, 30);
  ctx.fillText(`Rooms: ${game.roomsCleared}`, CONFIG.width - 20, 60);
  ctx.textAlign = 'left';

  // Controls
  ctx.fillStyle = '#666';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | Mouse: Aim | Click: Shoot | Space: Dodge | R: Reload | Q: Blank', 20, CONFIG.height - 20);

  // Minimap
  drawMinimap();
}

function drawMinimap() {
  const mapX = CONFIG.width - 100;
  const mapY = 80;
  const cellSize = 10;

  Object.entries(game.rooms).forEach(([key, room]) => {
    const [rx, ry] = key.split(',').map(Number);
    const x = mapX + rx * cellSize + 30;
    const y = mapY + ry * cellSize + 30;

    if (room.type === ROOM_TYPES.START) ctx.fillStyle = '#44ff44';
    else if (room.type === ROOM_TYPES.BOSS) ctx.fillStyle = '#ff4444';
    else if (room.type === ROOM_TYPES.CHEST) ctx.fillStyle = '#ffff44';
    else if (room.cleared) ctx.fillStyle = '#666';
    else ctx.fillStyle = '#444';

    ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

    if (rx === game.roomX && ry === game.roomY) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, cellSize + 1, cellSize + 1);
    }
  });
}

function drawMenu() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = '#ff6644';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENTER THE GUNGEON', CONFIG.width / 2, 140);
  ctx.fillStyle = '#888';
  ctx.font = '18px monospace';
  ctx.fillText('Clone', CONFIG.width / 2, 175);

  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.fillText('Press ENTER or CLICK to Start', CONFIG.width / 2, 280);

  ctx.fillStyle = '#888';
  ctx.font = '14px monospace';
  ctx.fillText('WASD - Move', CONFIG.width / 2, 360);
  ctx.fillText('Mouse - Aim', CONFIG.width / 2, 385);
  ctx.fillText('Click - Shoot', CONFIG.width / 2, 410);
  ctx.fillText('Space/Shift - Dodge Roll (i-frames!)', CONFIG.width / 2, 435);
  ctx.fillText('R - Reload | Q - Use Blank', CONFIG.width / 2, 460);

  ctx.fillStyle = '#ffaa00';
  ctx.fillText(`Best Floor: ${game.stats.bestFloor}`, CONFIG.width / 2, 530);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CONFIG.width / 2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.fillText(`Reached Floor: ${game.floor}`, CONFIG.width / 2, 280);
  ctx.fillText(`Rooms Cleared: ${game.roomsCleared}`, CONFIG.width / 2, 320);

  ctx.fillStyle = '#00ff88';
  ctx.font = '18px monospace';
  ctx.fillText('Press ENTER or CLICK to Retry', CONFIG.width / 2, 420);
  ctx.fillText('Press ESC for Menu', CONFIG.width / 2, 450);
  ctx.textAlign = 'left';
}

// Main loop
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.1);
  game.lastTime = timestamp;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  if (game.state === 'menu') {
    drawMenu();
  } else if (game.state === 'playing') {
    game.player.update(dt);
    game.enemies.forEach(e => e.update(dt));
    updateBullets(dt);
    updatePickups();
    updateParticles(dt);

    if (game.enemies.length === 0) {
      clearRoom();
      checkDoors();
    }

    // Contact damage
    game.enemies.forEach(e => {
      const dx = e.x - game.player.x;
      const dy = e.y - game.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < e.radius + game.player.radius) {
        if (game.player.isRolling) {
          e.takeDamage(3, -dx, -dy);
        } else {
          game.player.takeDamage(0.5);
        }
      }
    });

    drawRoom();
    drawPickups();
    drawBullets();
    game.enemies.forEach(e => e.draw());
    game.player.draw();
    drawParticles();
    drawHUD();
  } else if (game.state === 'gameover') {
    drawRoom();
    drawBullets();
    game.enemies.forEach(e => e.draw());
    drawParticles();
    drawHUD();
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown', e => {
  game.keysPressed[e.code] = true;
  if (e.code === 'Enter') {
    if (game.state === 'menu' || game.state === 'gameover') startGame();
  }
  if (e.code === 'Escape' && game.state === 'gameover') game.state = 'menu';
  if (e.code.match(/Digit[1-9]/)) {
    const idx = parseInt(e.code[5]) - 1;
    if (game.player) game.player.switchWeapon(idx);
  }
  e.preventDefault();
});

document.addEventListener('keyup', e => { game.keysPressed[e.code] = false; });

canvas.addEventListener('click', () => {
  initAudio();
  if (game.state === 'menu' || game.state === 'gameover') startGame();
});

canvas.addEventListener('mousedown', () => { game.keysPressed['click'] = true; });
canvas.addEventListener('mouseup', () => { game.keysPressed['click'] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouseX = e.clientX - rect.left;
  game.mouseY = e.clientY - rect.top;
});

window.game = game;
loadStats();
requestAnimationFrame(gameLoop);
