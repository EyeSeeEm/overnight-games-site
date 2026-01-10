// Binding of Isaac Clone - Twin-stick Roguelike Dungeon Crawler
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
  tileSize: 40,
  playerSpeed: 200,
  tearSpeed: 400,
  tearDelay: 300, // ms between shots
  tearRange: 300, // pixels
  knockbackForce: 150
};

// Game state
const game = {
  state: 'menu',
  player: null,
  enemies: [],
  tears: [],
  pickups: [],
  particles: [],
  floor: 1,
  roomX: 0,
  roomY: 0,
  rooms: {},
  roomsCleared: 0,
  coins: 0,
  bombs: 1,
  keys: 1,
  lastTime: 0,
  keysPressed: {},
  soundEnabled: true,
  stats: {
    gamesPlayed: 0,
    totalKills: 0,
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
const ROOM_TYPES = {
  NORMAL: 'normal',
  TREASURE: 'treasure',
  SHOP: 'shop',
  BOSS: 'boss',
  START: 'start'
};

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.redHearts = 3;
    this.maxRedHearts = 3;
    this.soulHearts = 0;
    this.damage = 3.5;
    this.tearDelay = CONFIG.tearDelay;
    this.tearTimer = 0;
    this.shotSpeed = 1.0;
    this.range = CONFIG.tearRange;
    this.speed = CONFIG.playerSpeed;
    this.luck = 0;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.shootDir = { x: 0, y: -1 }; // Default shoot up
    this.items = [];
  }

  update(dt) {
    // Update timers
    if (this.tearTimer > 0) this.tearTimer -= dt * 1000;
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt * 1000;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    // Movement
    let mx = 0, my = 0;
    if (game.keysPressed['KeyA'] || game.keysPressed['ArrowLeft']) mx -= 1;
    if (game.keysPressed['KeyD'] || game.keysPressed['ArrowRight']) mx += 1;
    if (game.keysPressed['KeyW'] || game.keysPressed['ArrowUp']) my -= 1;
    if (game.keysPressed['KeyS'] || game.keysPressed['ArrowDown']) my += 1;

    // Normalize diagonal
    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    this.x += mx * this.speed * dt;
    this.y += my * this.speed * dt;

    // Clamp to room bounds
    const minX = CONFIG.roomOffsetX + this.radius;
    const maxX = CONFIG.roomOffsetX + CONFIG.roomWidth - this.radius;
    const minY = CONFIG.roomOffsetY + this.radius;
    const maxY = CONFIG.roomOffsetY + CONFIG.roomHeight - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));

    // Shooting (arrow keys for shooting direction)
    let sx = 0, sy = 0;
    if (game.keysPressed['ArrowLeft']) sx -= 1;
    if (game.keysPressed['ArrowRight']) sx += 1;
    if (game.keysPressed['ArrowUp']) sy -= 1;
    if (game.keysPressed['ArrowDown']) sy += 1;

    // Use WASD for movement, arrow keys for shooting
    if (sx !== 0 || sy !== 0) {
      this.shootDir = { x: sx, y: sy };
      if (this.tearTimer <= 0) {
        this.shoot();
        this.tearTimer = this.tearDelay;
      }
    }
  }

  shoot() {
    const len = Math.sqrt(this.shootDir.x ** 2 + this.shootDir.y ** 2);
    if (len === 0) return;

    const dx = this.shootDir.x / len;
    const dy = this.shootDir.y / len;

    const tear = {
      x: this.x,
      y: this.y,
      vx: dx * CONFIG.tearSpeed * this.shotSpeed,
      vy: dy * CONFIG.tearSpeed * this.shotSpeed,
      radius: 8,
      damage: this.damage,
      distanceTraveled: 0,
      maxRange: this.range,
      color: '#4488ff'
    };
    game.tears.push(tear);
    playSound(600, 'sine', 0.05, 0.15);
  }

  takeDamage(amount) {
    if (this.isInvincible) return;

    // Damage soul hearts first
    if (this.soulHearts > 0) {
      this.soulHearts -= amount;
      if (this.soulHearts < 0) {
        this.redHearts += this.soulHearts;
        this.soulHearts = 0;
      }
    } else {
      this.redHearts -= amount;
    }

    // Invincibility frames
    this.isInvincible = true;
    this.invincibleTimer = 1000;

    spawnParticles(this.x, this.y, '#ff0000', 10);
    playSound(150, 'sawtooth', 0.2, 0.3);

    if (this.redHearts <= 0 && this.soulHearts <= 0) {
      gameOver();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flash when invincible
    if (this.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Body (tan/pink)
    ctx.fillStyle = '#f4c8a8';
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head (larger)
    ctx.fillStyle = '#f4c8a8';
    ctx.beginPath();
    ctx.arc(0, -8, 18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (white with black pupils)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, -10, 6, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -10, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, -9, 3, 0, Math.PI * 2);
    ctx.arc(8, -9, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tears
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.ellipse(-8, -2, 3, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -2, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.moveTimer = Math.random() * 2000;

    switch (type) {
      case 'fly':
        this.hp = 5;
        this.speed = 80;
        this.damage = 0.5;
        this.color = '#666666';
        break;
      case 'gaper':
        this.hp = 10;
        this.speed = 50;
        this.damage = 1;
        this.color = '#dd8866';
        this.radius = 16;
        break;
      case 'spider':
        this.hp = 8;
        this.speed = 120;
        this.damage = 1;
        this.color = '#333333';
        this.radius = 10;
        break;
      case 'host':
        this.hp = 15;
        this.speed = 0;
        this.damage = 1;
        this.color = '#ffcc00';
        this.shootTimer = 2000;
        this.isVulnerable = false;
        this.vulnerableTimer = 0;
        break;
      case 'boss':
        this.hp = 100;
        this.speed = 40;
        this.damage = 1;
        this.color = '#ff4444';
        this.radius = 30;
        this.shootTimer = 1500;
        this.phase = 0;
        break;
      default:
        this.hp = 10;
        this.speed = 60;
        this.damage = 1;
        this.color = '#aa6644';
    }
    this.maxHp = this.hp;
  }

  update(dt) {
    // Apply knockback
    this.x += this.knockbackX * dt;
    this.y += this.knockbackY * dt;
    this.knockbackX *= 0.9;
    this.knockbackY *= 0.9;

    this.moveTimer += dt * 1000;

    // AI behavior
    switch (this.type) {
      case 'fly':
        this.flyAI(dt);
        break;
      case 'gaper':
        this.chaseAI(dt);
        break;
      case 'spider':
        this.spiderAI(dt);
        break;
      case 'host':
        this.hostAI(dt);
        break;
      case 'boss':
        this.bossAI(dt);
        break;
      default:
        this.chaseAI(dt);
    }

    // Clamp to room
    const minX = CONFIG.roomOffsetX + this.radius;
    const maxX = CONFIG.roomOffsetX + CONFIG.roomWidth - this.radius;
    const minY = CONFIG.roomOffsetY + this.radius;
    const maxY = CONFIG.roomOffsetY + CONFIG.roomHeight - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  flyAI(dt) {
    if (!game.player) return;
    // Fly toward player
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  chaseAI(dt) {
    if (!game.player) return;
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 30) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }
  }

  spiderAI(dt) {
    // Move in bursts
    if (this.moveTimer > 1000) {
      this.moveTimer = 0;
      if (game.player) {
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          this.vx = (dx / dist) * this.speed * 2;
          this.vy = (dy / dist) * this.speed * 2;
        }
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95;
    this.vy *= 0.95;
  }

  hostAI(dt) {
    this.shootTimer -= dt * 1000;
    if (this.vulnerableTimer > 0) {
      this.vulnerableTimer -= dt * 1000;
      this.isVulnerable = this.vulnerableTimer > 0;
    }

    if (this.shootTimer <= 0 && !this.isVulnerable) {
      // Pop up and shoot
      this.isVulnerable = true;
      this.vulnerableTimer = 1000;
      this.shootTimer = 3000;
      this.shootAtPlayer();
    }
  }

  bossAI(dt) {
    // Check phase
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent < 0.33) this.phase = 2;
    else if (hpPercent < 0.66) this.phase = 1;

    // Move toward player
    if (game.player) {
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 50) {
        this.x += (dx / dist) * this.speed * (1 + this.phase * 0.3) * dt;
        this.y += (dy / dist) * this.speed * (1 + this.phase * 0.3) * dt;
      }
    }

    // Shoot
    this.shootTimer -= dt * 1000;
    if (this.shootTimer <= 0) {
      if (this.phase === 2) {
        this.shootRing(12);
        this.shootTimer = 800;
      } else if (this.phase === 1) {
        this.shootAtPlayer(3);
        this.shootTimer = 1000;
      } else {
        this.shootAtPlayer();
        this.shootTimer = 1500;
      }
    }
  }

  shootAtPlayer(count = 1) {
    if (!game.player) return;
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const angle = Math.atan2(dy, dx);
    for (let i = 0; i < count; i++) {
      const spread = count > 1 ? (i - (count - 1) / 2) * 0.3 : 0;
      game.tears.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle + spread) * 200,
        vy: Math.sin(angle + spread) * 200,
        radius: 6,
        damage: this.damage,
        distanceTraveled: 0,
        maxRange: 500,
        color: '#ff4444',
        isEnemy: true
      });
    }
    playSound(300, 'square', 0.1, 0.15);
  }

  shootRing(count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      game.tears.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * 150,
        vy: Math.sin(angle) * 150,
        radius: 6,
        damage: this.damage,
        distanceTraveled: 0,
        maxRange: 400,
        color: '#ff6644',
        isEnemy: true
      });
    }
    playSound(250, 'square', 0.15, 0.2);
  }

  takeDamage(amount) {
    if (this.type === 'host' && !this.isVulnerable) return false;

    this.hp -= amount;
    spawnParticles(this.x, this.y, this.color, 3);
    return this.hp <= 0;
  }

  applyKnockback(dx, dy, force) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.knockbackX = (dx / dist) * force;
      this.knockbackY = (dy / dist) * force;
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = this.color;

    if (this.type === 'fly') {
      // Fly - small oval with wings
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const wingFlap = Math.sin(Date.now() / 30) * 3;
      ctx.beginPath();
      ctx.ellipse(-10, wingFlap, 6, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(10, -wingFlap, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'spider') {
      // Spider - oval with legs
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 4) - Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
        ctx.moveTo(0, 0);
        ctx.lineTo(-Math.cos(angle) * 12, Math.sin(angle) * 12);
        ctx.stroke();
      }
    } else if (this.type === 'host') {
      // Host - skull that pops up
      if (this.isVulnerable) {
        // Popped up
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, -8, 12, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -10, 3, 0, Math.PI * 2);
        ctx.arc(4, -10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Base
      ctx.fillStyle = '#886644';
      ctx.fillRect(-10, 0, 20, 12);
    } else if (this.type === 'boss') {
      // Boss - large creature
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      // Face
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-10, -5, 6, 0, Math.PI * 2);
      ctx.arc(10, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 10, 10, 0, Math.PI);
      ctx.fill();
      // HP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(-30, -45, 60, 6);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-30, -45, 60 * (this.hp / this.maxHp), 6);
    } else {
      // Default gaper-like
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-5, -3, 5, 0, Math.PI * 2);
      ctx.arc(5, -3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-5, -3, 2, 0, Math.PI * 2);
      ctx.arc(5, -3, 2, 0, Math.PI * 2);
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

  // Create start room
  createRoom(0, 0, ROOM_TYPES.START);

  // Create path
  const roomCount = 5 + game.floor * 2;
  const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let lastX = 0, lastY = 0;

  for (let i = 0; i < roomCount; i++) {
    const dir = directions[Math.floor(Math.random() * directions.length)];
    let nx = lastX + dir[0];
    let ny = lastY + dir[1];

    // Ensure we don't overlap start
    if (nx === 0 && ny === 0) continue;
    if (!game.rooms[`${nx},${ny}`]) {
      createRoom(nx, ny, ROOM_TYPES.NORMAL);
      lastX = nx;
      lastY = ny;
    }
  }

  // Place treasure room
  const normalRooms = Object.entries(game.rooms).filter(([k, v]) => v.type === ROOM_TYPES.NORMAL);
  if (normalRooms.length > 0) {
    const treasureRoom = normalRooms[Math.floor(Math.random() * normalRooms.length)];
    game.rooms[treasureRoom[0]].type = ROOM_TYPES.TREASURE;
  }

  // Place boss room at end
  game.rooms[`${lastX},${lastY}`].type = ROOM_TYPES.BOSS;
}

function createRoom(x, y, type) {
  game.rooms[`${x},${y}`] = {
    type,
    cleared: type === ROOM_TYPES.START,
    enemies: [],
    pickups: []
  };
}

function enterRoom(x, y) {
  const key = `${x},${y}`;
  const room = game.rooms[key];
  if (!room) return;

  game.roomX = x;
  game.roomY = y;
  game.enemies = [];
  game.tears = [];
  game.pickups = [];

  // Reset player position based on entry direction
  game.player.x = CONFIG.roomOffsetX + CONFIG.roomWidth / 2;
  game.player.y = CONFIG.roomOffsetY + CONFIG.roomHeight / 2;

  if (!room.cleared) {
    spawnEnemies(room.type);
  } else if (room.pickups.length > 0) {
    game.pickups = room.pickups.map(p => ({ ...p }));
  }

  // Spawn treasure
  if (room.type === ROOM_TYPES.TREASURE && !room.cleared) {
    game.pickups.push({
      x: CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
      y: CONFIG.roomOffsetY + CONFIG.roomHeight / 2,
      type: 'item',
      radius: 15
    });
  }
}

function spawnEnemies(roomType) {
  if (roomType === ROOM_TYPES.START || roomType === ROOM_TYPES.TREASURE) return;

  if (roomType === ROOM_TYPES.BOSS) {
    game.enemies.push(new Enemy(
      CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
      CONFIG.roomOffsetY + 100,
      'boss'
    ));
    return;
  }

  const count = 3 + Math.floor(game.floor / 2) + Math.floor(Math.random() * 3);
  const types = ['fly', 'gaper', 'spider'];
  if (game.floor >= 2) types.push('host');

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

    // Spawn rewards
    if (Math.random() < 0.3) {
      game.pickups.push({
        x: CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
        y: CONFIG.roomOffsetY + CONFIG.roomHeight / 2,
        type: Math.random() < 0.5 ? 'heart' : 'coin',
        radius: 10
      });
    }

    // Boss drops
    if (room.type === ROOM_TYPES.BOSS) {
      game.stats.bossesDefeated++;

      // Trapdoor to next floor
      game.pickups.push({
        x: CONFIG.roomOffsetX + CONFIG.roomWidth / 2,
        y: CONFIG.roomOffsetY + CONFIG.roomHeight / 2,
        type: 'trapdoor',
        radius: 20
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
  game.coins = 0;
  game.bombs = 1;
  game.keys = 1;
  game.roomsCleared = 0;
  game.stats.gamesPlayed++;
  generateFloor();
  enterRoom(0, 0);
  playSound(440, 'sine', 0.2, 0.2);
}

function nextFloor() {
  game.floor++;
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
  try {
    localStorage.setItem('isaac_clone_stats', JSON.stringify(game.stats));
  } catch (e) {}
}

function loadStats() {
  try {
    const saved = localStorage.getItem('isaac_clone_stats');
    if (saved) Object.assign(game.stats, JSON.parse(saved));
  } catch (e) {}
}

// Update functions
function updateTears(dt) {
  game.tears = game.tears.filter(t => {
    const prevX = t.x, prevY = t.y;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.distanceTraveled += Math.sqrt((t.x - prevX) ** 2 + (t.y - prevY) ** 2);

    // Check collisions
    if (t.isEnemy) {
      // Enemy tear hits player
      if (game.player && !game.player.isInvincible) {
        const dx = t.x - game.player.x;
        const dy = t.y - game.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < t.radius + game.player.radius) {
          game.player.takeDamage(t.damage);
          return false;
        }
      }
    } else {
      // Player tear hits enemy
      for (let i = game.enemies.length - 1; i >= 0; i--) {
        const e = game.enemies[i];
        const dx = t.x - e.x;
        const dy = t.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < t.radius + e.radius) {
          if (e.takeDamage(t.damage)) {
            game.enemies.splice(i, 1);
            game.stats.totalKills++;
            // Drop
            if (Math.random() < 0.15) {
              const dropTypes = ['heart', 'coin', 'coin', 'bomb', 'key'];
              game.pickups.push({
                x: e.x,
                y: e.y,
                type: dropTypes[Math.floor(Math.random() * dropTypes.length)],
                radius: 10
              });
            }
          }
          e.applyKnockback(dx, dy, CONFIG.knockbackForce);
          return false;
        }
      }
    }

    // Range check
    if (t.distanceTraveled >= t.maxRange) return false;

    // Bounds check
    return t.x > CONFIG.roomOffsetX && t.x < CONFIG.roomOffsetX + CONFIG.roomWidth &&
           t.y > CONFIG.roomOffsetY && t.y < CONFIG.roomOffsetY + CONFIG.roomHeight;
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
          if (game.player.redHearts < game.player.maxRedHearts) {
            game.player.redHearts++;
            playSound(880, 'sine', 0.1, 0.2);
            return false;
          }
          break;
        case 'coin':
          game.coins++;
          playSound(1200, 'square', 0.05, 0.15);
          return false;
        case 'bomb':
          game.bombs++;
          playSound(400, 'sine', 0.1, 0.2);
          return false;
        case 'key':
          game.keys++;
          playSound(600, 'sine', 0.1, 0.2);
          return false;
        case 'item':
          // Random stat boost
          const boosts = ['damage', 'speed', 'range'];
          const boost = boosts[Math.floor(Math.random() * boosts.length)];
          if (boost === 'damage') game.player.damage += 1;
          else if (boost === 'speed') game.player.speed += 20;
          else if (boost === 'range') game.player.range += 50;
          game.player.items.push({ type: boost });
          playSound(440, 'sine', 0.3, 0.3);
          return false;
        case 'trapdoor':
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
  const roomCenterX = CONFIG.roomOffsetX + CONFIG.roomWidth / 2;
  const roomCenterY = CONFIG.roomOffsetY + CONFIG.roomHeight / 2;

  // Check each direction
  if (p.y < CONFIG.roomOffsetY + 30 && game.rooms[`${game.roomX},${game.roomY - 1}`]) {
    // Up
    enterRoom(game.roomX, game.roomY - 1);
    game.player.y = CONFIG.roomOffsetY + CONFIG.roomHeight - 40;
  } else if (p.y > CONFIG.roomOffsetY + CONFIG.roomHeight - 30 && game.rooms[`${game.roomX},${game.roomY + 1}`]) {
    // Down
    enterRoom(game.roomX, game.roomY + 1);
    game.player.y = CONFIG.roomOffsetY + 40;
  } else if (p.x < CONFIG.roomOffsetX + 30 && game.rooms[`${game.roomX - 1},${game.roomY}`]) {
    // Left
    enterRoom(game.roomX - 1, game.roomY);
    game.player.x = CONFIG.roomOffsetX + CONFIG.roomWidth - 40;
  } else if (p.x > CONFIG.roomOffsetX + CONFIG.roomWidth - 30 && game.rooms[`${game.roomX + 1},${game.roomY}`]) {
    // Right
    enterRoom(game.roomX + 1, game.roomY);
    game.player.x = CONFIG.roomOffsetX + 40;
  }
}

// Draw functions
function drawRoom() {
  // Floor
  ctx.fillStyle = '#3a2f2a';
  ctx.fillRect(CONFIG.roomOffsetX, CONFIG.roomOffsetY, CONFIG.roomWidth, CONFIG.roomHeight);

  // Tiles
  ctx.fillStyle = '#4a3f3a';
  for (let x = 0; x < CONFIG.roomWidth; x += CONFIG.tileSize) {
    for (let y = 0; y < CONFIG.roomHeight; y += CONFIG.tileSize) {
      if ((x / CONFIG.tileSize + y / CONFIG.tileSize) % 2 === 0) {
        ctx.fillRect(CONFIG.roomOffsetX + x, CONFIG.roomOffsetY + y, CONFIG.tileSize, CONFIG.tileSize);
      }
    }
  }

  // Walls
  ctx.fillStyle = '#5a4a44';
  // Top
  ctx.fillRect(CONFIG.roomOffsetX - 20, CONFIG.roomOffsetY - 20, CONFIG.roomWidth + 40, 20);
  // Bottom
  ctx.fillRect(CONFIG.roomOffsetX - 20, CONFIG.roomOffsetY + CONFIG.roomHeight, CONFIG.roomWidth + 40, 20);
  // Left
  ctx.fillRect(CONFIG.roomOffsetX - 20, CONFIG.roomOffsetY, 20, CONFIG.roomHeight);
  // Right
  ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth, CONFIG.roomOffsetY, 20, CONFIG.roomHeight);

  // Doors (if room cleared or is start)
  const room = game.rooms[`${game.roomX},${game.roomY}`];
  if (room && (room.cleared || game.enemies.length === 0)) {
    ctx.fillStyle = '#2a1f1a';
    const doorSize = 40;
    // Check adjacent rooms
    if (game.rooms[`${game.roomX},${game.roomY - 1}`]) {
      ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth / 2 - doorSize / 2, CONFIG.roomOffsetY - 15, doorSize, 20);
    }
    if (game.rooms[`${game.roomX},${game.roomY + 1}`]) {
      ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth / 2 - doorSize / 2, CONFIG.roomOffsetY + CONFIG.roomHeight - 5, doorSize, 20);
    }
    if (game.rooms[`${game.roomX - 1},${game.roomY}`]) {
      ctx.fillRect(CONFIG.roomOffsetX - 15, CONFIG.roomOffsetY + CONFIG.roomHeight / 2 - doorSize / 2, 20, doorSize);
    }
    if (game.rooms[`${game.roomX + 1},${game.roomY}`]) {
      ctx.fillRect(CONFIG.roomOffsetX + CONFIG.roomWidth - 5, CONFIG.roomOffsetY + CONFIG.roomHeight / 2 - doorSize / 2, 20, doorSize);
    }
  }
}

function drawTears() {
  game.tears.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPickups() {
  game.pickups.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);

    switch (p.type) {
      case 'heart':
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.bezierCurveTo(-8, -10, -10, 0, 0, 10);
        ctx.bezierCurveTo(10, 0, 8, -10, 0, -5);
        ctx.fill();
        break;
      case 'coin':
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa8800';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bomb':
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(0, 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, -12);
        ctx.stroke();
        break;
      case 'key':
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2, 0, 4, 10);
        ctx.fillRect(-4, 6, 2, 4);
        break;
      case 'item':
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.rect(-10, -10, 20, 20);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 5);
        break;
      case 'trapdoor':
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 3;
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
  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.roomOffsetY - 20);
  ctx.fillRect(0, CONFIG.roomOffsetY + CONFIG.roomHeight + 20, CONFIG.width, 100);

  // Hearts
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText('HP:', 20, 30);

  for (let i = 0; i < game.player.maxRedHearts; i++) {
    ctx.fillStyle = i < game.player.redHearts ? '#ff0000' : '#333333';
    ctx.beginPath();
    const hx = 55 + i * 25;
    const hy = 25;
    ctx.moveTo(hx, hy - 5);
    ctx.bezierCurveTo(hx - 8, hy - 10, hx - 10, hy, hx, hy + 8);
    ctx.bezierCurveTo(hx + 10, hy, hx + 8, hy - 10, hx, hy - 5);
    ctx.fill();
  }

  // Soul hearts
  for (let i = 0; i < game.player.soulHearts; i++) {
    ctx.fillStyle = '#4488ff';
    const hx = 55 + (game.player.maxRedHearts + i) * 25;
    const hy = 25;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 5);
    ctx.bezierCurveTo(hx - 8, hy - 10, hx - 10, hy, hx, hy + 8);
    ctx.bezierCurveTo(hx + 10, hy, hx + 8, hy - 10, hx, hy - 5);
    ctx.fill();
  }

  // Items
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText(`Coins: ${game.coins}`, 20, 60);
  ctx.fillText(`Bombs: ${game.bombs}`, 120, 60);
  ctx.fillText(`Keys: ${game.keys}`, 220, 60);

  // Floor info
  ctx.textAlign = 'right';
  ctx.fillText(`Floor ${game.floor}`, CONFIG.width - 20, 30);
  ctx.fillText(`Room ${game.roomsCleared}`, CONFIG.width - 20, 60);
  ctx.textAlign = 'left';

  // Controls
  ctx.fillStyle = '#666666';
  ctx.font = '12px monospace';
  ctx.fillText('WASD: Move | Arrows: Shoot', 20, CONFIG.height - 20);

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

    // Room color based on type
    if (room.type === ROOM_TYPES.START) ctx.fillStyle = '#44ff44';
    else if (room.type === ROOM_TYPES.BOSS) ctx.fillStyle = '#ff4444';
    else if (room.type === ROOM_TYPES.TREASURE) ctx.fillStyle = '#ffff44';
    else if (room.cleared) ctx.fillStyle = '#666666';
    else ctx.fillStyle = '#444444';

    ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

    // Current room indicator
    if (rx === game.roomX && ry === game.roomY) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, cellSize + 1, cellSize + 1);
    }
  });
}

function drawMenu() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = '#ff6644';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BINDING OF ISAAC', CONFIG.width / 2, 150);
  ctx.fillStyle = '#888888';
  ctx.font = '20px monospace';
  ctx.fillText('Clone', CONFIG.width / 2, 190);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('Press ENTER or CLICK to Start', CONFIG.width / 2, 300);

  ctx.fillStyle = '#888888';
  ctx.font = '14px monospace';
  ctx.fillText('WASD - Move', CONFIG.width / 2, 380);
  ctx.fillText('Arrow Keys - Shoot', CONFIG.width / 2, 405);
  ctx.fillText('Clear rooms, collect items, defeat bosses', CONFIG.width / 2, 450);

  ctx.fillStyle = '#ffaa00';
  ctx.fillText(`Best Floor: ${game.stats.bestFloor}`, CONFIG.width / 2, 520);
  ctx.fillText(`Total Kills: ${game.stats.totalKills}`, CONFIG.width / 2, 545);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('YOU DIED', CONFIG.width / 2, 200);

  ctx.fillStyle = '#ffffff';
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

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  if (game.state === 'menu') {
    drawMenu();
  } else if (game.state === 'playing') {
    game.player.update(dt);
    game.enemies.forEach(e => e.update(dt));
    updateTears(dt);
    updatePickups();
    updateParticles(dt);

    // Check room cleared
    if (game.enemies.length === 0) {
      clearRoom();
      checkDoors();
    }

    // Check enemy collision with player
    game.enemies.forEach(e => {
      const dx = e.x - game.player.x;
      const dy = e.y - game.player.y;
      if (Math.sqrt(dx * dx + dy * dy) < e.radius + game.player.radius) {
        game.player.takeDamage(e.damage);
      }
    });

    drawRoom();
    drawPickups();
    drawTears();
    game.enemies.forEach(e => e.draw());
    game.player.draw();
    drawParticles();
    drawHUD();
  } else if (game.state === 'gameover') {
    drawRoom();
    drawTears();
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
    if (game.state === 'menu' || game.state === 'gameover') {
      startGame();
    }
  }

  if (e.code === 'Escape') {
    if (game.state === 'gameover') {
      game.state = 'menu';
    }
  }

  e.preventDefault();
});

document.addEventListener('keyup', e => {
  game.keysPressed[e.code] = false;
});

canvas.addEventListener('click', () => {
  initAudio();
  if (game.state === 'menu' || game.state === 'gameover') {
    startGame();
  }
});

// Expose for testing
window.game = game;

// Initialize
loadStats();
requestAnimationFrame(gameLoop);
