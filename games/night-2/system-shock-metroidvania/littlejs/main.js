// CITADEL - System Shock Metroidvania (LittleJS/Canvas)
const WIDTH = 800;
const HEIGHT = 600;
const TILE = 32;

const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Physics constants
const GRAVITY = 1200;
const WALK_SPEED = 250;
const JUMP_VELOCITY = -450;
const DOUBLE_JUMP_VELOCITY = -380;
const WALL_SLIDE_SPEED = 100;
const WALL_JUMP_X = 280;
const WALL_JUMP_Y = -400;
const DASH_SPEED = 600;
const DASH_DURATION = 0.2;
const DASH_COOLDOWN = 0.6;

// Room tiles: 0=empty, 1=solid, 2=platform, 3=spikes, 4=door, 5=save
const ROOMS = {
  start: {
    width: 20, height: 15,
    data: [
      "11111111111111111111",
      "1                  1",
      "1                  1",
      "1       111        1",
      "1                  1",
      "1   111     111    1",
      "1                  4",
      "1                  4",
      "1  1111            1",
      "1         1111     1",
      "1   S              1",
      "1 111    1111   1111",
      "1                  1",
      "1  H               1",
      "11111111111111111111"
    ],
    enemies: [
      { type: 'shambler', x: 300, y: 320 },
      { type: 'shambler', x: 450, y: 200 }
    ],
    exits: { right: 'corridor1' },
    theme: 'medical'
  },
  corridor1: {
    width: 25, height: 15,
    data: [
      "1111111111111111111111111",
      "1                       1",
      "1       E               1",
      "1      111              1",
      "1                 111   1",
      "1   111      111        1",
      "4                       4",
      "4                       4",
      "1     1111              1",
      "1              111      1",
      "1                    1111",
      "1 111       1111        1",
      "1                       1",
      "1                       1",
      "1111111111111111111111111"
    ],
    enemies: [
      { type: 'bot', x: 200, y: 280 },
      { type: 'shambler', x: 500, y: 360 },
      { type: 'shambler', x: 650, y: 280 }
    ],
    pickups: [{ x: 400, y: 120, type: 'health' }],
    exits: { left: 'start', right: 'ability_room' },
    theme: 'corridor'
  },
  ability_room: {
    width: 15, height: 15,
    data: [
      "111111111111111",
      "1             1",
      "1             1",
      "1    D        1",
      "1   111       1",
      "1             1",
      "4             1",
      "4             1",
      "1        111  1",
      "1             1",
      "1   1111      1",
      "1          1111",
      "1             1",
      "1     H       1",
      "111111111111111"
    ],
    enemies: [{ type: 'cyborg', x: 200, y: 320 }],
    pickups: [{ x: 220, y: 100, type: 'doubleJump' }],
    exits: { left: 'corridor1' },
    theme: 'tech'
  }
};

// Game state
const game = {
  screen: 'title',
  currentRoom: 'start',
  player: null,
  enemies: [],
  projectiles: [],
  pickups: [],
  particles: [],
  camera: { x: 0, y: 0 },
  keys: {},
  lastTime: 0,
  coyoteTime: 0,
  jumpBuffer: 0,
  messages: [],
  bossDefeated: false
};

// Player
function createPlayer(x, y) {
  return {
    x, y,
    width: 24,
    height: 40,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    energy: 100, maxEnergy: 100,
    facing: 1,
    grounded: false,
    onWall: 0,
    doubleJumped: false,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    invincible: 0,
    attackCooldown: 0,
    abilities: {
      doubleJump: false,
      wallJump: false,
      dash: false
    }
  };
}

// Initialize room
function loadRoom(name) {
  const room = ROOMS[name];
  if (!room) return;

  game.currentRoom = name;
  game.enemies = [];
  game.pickups = [];
  game.projectiles = [];
  game.particles = [];

  // Spawn enemies
  if (room.enemies) {
    room.enemies.forEach(e => {
      game.enemies.push(createEnemy(e.type, e.x, e.y));
    });
  }

  // Spawn pickups
  if (room.pickups) {
    room.pickups.forEach(p => {
      game.pickups.push({ ...p, collected: false });
    });
  }
}

// Enemy types
const ENEMY_TYPES = {
  shambler: { hp: 40, damage: 15, speed: 60, color: '#4a4', width: 28, height: 36 },
  bot: { hp: 60, damage: 20, speed: 80, color: '#888', width: 32, height: 32, shoots: true },
  cyborg: { hp: 100, damage: 25, speed: 100, color: '#a44', width: 32, height: 44 }
};

function createEnemy(type, x, y) {
  const t = ENEMY_TYPES[type];
  return {
    type, x, y,
    width: t.width,
    height: t.height,
    hp: t.hp,
    maxHp: t.hp,
    damage: t.damage,
    speed: t.speed,
    color: t.color,
    shoots: t.shoots || false,
    vx: 0, vy: 0,
    dir: 1,
    shootTimer: 0,
    grounded: false
  };
}

// Collision detection
function rectCollide(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function getTile(room, tx, ty) {
  const r = ROOMS[room];
  if (!r || ty < 0 || ty >= r.data.length || tx < 0 || tx >= r.data[0].length) return '1';
  return r.data[ty][tx];
}

function isSolid(room, tx, ty) {
  const tile = getTile(room, tx, ty);
  return tile === '1';
}

// Input
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  game.keys[e.code] = true;

  if (game.screen === 'title' && (e.key === ' ' || e.key === 'Enter')) {
    startGame();
  }
  if (game.screen === 'gameover' && (e.key === ' ' || e.key === 'Enter')) {
    game.screen = 'title';
  }
  if (game.screen === 'victory' && (e.key === ' ' || e.key === 'Enter')) {
    game.screen = 'title';
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
  game.keys[e.code] = false;
});

function startGame() {
  game.screen = 'game';
  game.player = createPlayer(160, 280);
  game.bossDefeated = false;
  game.messages = [];
  loadRoom('start');
  addMessage('SHODAN: "Look at you, hacker..."', 4);
}

function addMessage(text, duration = 3) {
  game.messages.push({ text, time: duration });
}

// Player update
function updatePlayer(dt) {
  const p = game.player;
  if (!p) return;

  // Timers
  if (p.invincible > 0) p.invincible -= dt;
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (p.attackCooldown > 0) p.attackCooldown -= dt;
  game.coyoteTime -= dt;
  game.jumpBuffer -= dt;

  // Movement input
  let moveX = 0;
  if (game.keys['a'] || game.keys['arrowleft']) moveX = -1;
  if (game.keys['d'] || game.keys['arrowright']) moveX = 1;

  // Dashing
  if (p.dashing) {
    p.dashTimer -= dt;
    if (p.dashTimer <= 0) {
      p.dashing = false;
      p.vx = p.facing * WALK_SPEED * 0.5;
    }
  } else {
    // Normal movement
    if (moveX !== 0) {
      p.facing = moveX;
      p.vx = moveX * WALK_SPEED;
    } else {
      p.vx *= 0.8;
      if (Math.abs(p.vx) < 10) p.vx = 0;
    }

    // Gravity and wall slide
    if (!p.grounded) {
      if (p.onWall !== 0 && p.abilities.wallJump) {
        p.vy = Math.min(p.vy + GRAVITY * dt * 0.3, WALL_SLIDE_SPEED);
      } else {
        p.vy += GRAVITY * dt;
      }
    }
    p.vy = Math.min(p.vy, 700); // Terminal velocity

    // Jump
    if (game.keys[' '] || game.keys['w'] || game.keys['arrowup']) {
      game.jumpBuffer = 0.1;
    }

    if (game.jumpBuffer > 0) {
      if (p.grounded || game.coyoteTime > 0) {
        p.vy = JUMP_VELOCITY;
        p.grounded = false;
        game.coyoteTime = 0;
        game.jumpBuffer = 0;
        p.doubleJumped = false;
      } else if (p.onWall !== 0 && p.abilities.wallJump) {
        p.vx = -p.onWall * WALL_JUMP_X;
        p.vy = WALL_JUMP_Y;
        p.facing = -p.onWall;
        p.onWall = 0;
        game.jumpBuffer = 0;
        p.doubleJumped = false;
      } else if (p.abilities.doubleJump && !p.doubleJumped) {
        p.vy = DOUBLE_JUMP_VELOCITY;
        p.doubleJumped = true;
        game.jumpBuffer = 0;
        spawnParticles(p.x + p.width/2, p.y + p.height, '#0af', 5);
      }
    }

    // Dash
    if ((game.keys['Shift'] || game.keys['shift']) && p.abilities.dash && p.dashCooldown <= 0) {
      p.dashing = true;
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = DASH_COOLDOWN;
      p.vx = p.facing * DASH_SPEED;
      p.vy = 0;
      p.invincible = DASH_DURATION;
      spawnParticles(p.x + p.width/2, p.y + p.height/2, '#f0f', 8);
    }
  }

  // Attack
  if ((game.keys['j'] || game.keys['z']) && p.attackCooldown <= 0) {
    p.attackCooldown = 0.3;
    // Create projectile
    game.projectiles.push({
      x: p.x + (p.facing > 0 ? p.width : 0),
      y: p.y + p.height/2 - 4,
      width: 16, height: 8,
      vx: p.facing * 500,
      vy: 0,
      damage: 25,
      isPlayer: true
    });
  }

  // Move with collision
  moveEntity(p, dt);

  // Room transitions
  checkRoomExit(p);

  // Pickup collision
  game.pickups.forEach(pickup => {
    if (!pickup.collected && rectCollide(p, { x: pickup.x, y: pickup.y, width: 24, height: 24 })) {
      pickup.collected = true;
      collectPickup(pickup);
    }
  });
}

function moveEntity(e, dt) {
  const room = game.currentRoom;

  // Horizontal movement
  e.x += e.vx * dt;
  const tx1 = Math.floor(e.x / TILE);
  const tx2 = Math.floor((e.x + e.width) / TILE);
  const ty1 = Math.floor(e.y / TILE);
  const ty2 = Math.floor((e.y + e.height - 1) / TILE);

  // Check horizontal collision
  if (e.vx > 0) {
    if (isSolid(room, tx2, ty1) || isSolid(room, tx2, ty2)) {
      e.x = tx2 * TILE - e.width;
      e.vx = 0;
      if (e === game.player) e.onWall = 1;
    } else if (e === game.player) {
      e.onWall = 0;
    }
  } else if (e.vx < 0) {
    if (isSolid(room, tx1, ty1) || isSolid(room, tx1, ty2)) {
      e.x = (tx1 + 1) * TILE;
      e.vx = 0;
      if (e === game.player) e.onWall = -1;
    } else if (e === game.player) {
      e.onWall = 0;
    }
  }

  // Vertical movement
  e.y += e.vy * dt;
  const ntx1 = Math.floor(e.x / TILE);
  const ntx2 = Math.floor((e.x + e.width - 1) / TILE);
  const nty1 = Math.floor(e.y / TILE);
  const nty2 = Math.floor((e.y + e.height) / TILE);

  e.grounded = false;
  if (e.vy > 0) {
    if (isSolid(room, ntx1, nty2) || isSolid(room, ntx2, nty2)) {
      e.y = nty2 * TILE - e.height;
      e.vy = 0;
      e.grounded = true;
      if (e === game.player) {
        game.coyoteTime = 0.1;
        e.doubleJumped = false;
      }
    }
  } else if (e.vy < 0) {
    if (isSolid(room, ntx1, nty1) || isSolid(room, ntx2, nty1)) {
      e.y = (nty1 + 1) * TILE;
      e.vy = 0;
    }
  }
}

function checkRoomExit(p) {
  const room = ROOMS[game.currentRoom];
  if (!room) return;

  const roomWidth = room.width * TILE;
  const roomHeight = room.height * TILE;

  // Right exit
  if (p.x + p.width > roomWidth - 20 && room.exits && room.exits.right) {
    loadRoom(room.exits.right);
    p.x = 40;
    return;
  }

  // Left exit
  if (p.x < 20 && room.exits && room.exits.left) {
    const nextRoom = ROOMS[room.exits.left];
    loadRoom(room.exits.left);
    p.x = nextRoom.width * TILE - 60;
  }
}

function collectPickup(pickup) {
  const p = game.player;
  switch (pickup.type) {
    case 'health':
      p.hp = Math.min(p.maxHp, p.hp + 30);
      addMessage('Health restored!', 2);
      break;
    case 'energy':
      p.energy = Math.min(p.maxEnergy, p.energy + 30);
      addMessage('Energy restored!', 2);
      break;
    case 'doubleJump':
      p.abilities.doubleJump = true;
      addMessage('ACQUIRED: Double Jump! Press JUMP in mid-air.', 4);
      break;
    case 'wallJump':
      p.abilities.wallJump = true;
      addMessage('ACQUIRED: Wall Jump! Jump off walls.', 4);
      break;
    case 'dash':
      p.abilities.dash = true;
      addMessage('ACQUIRED: Neural Dash! Press SHIFT to dash.', 4);
      break;
  }
}

// Enemy update
function updateEnemies(dt) {
  game.enemies.forEach(enemy => {
    if (enemy.hp <= 0) return;

    const p = game.player;
    if (!p) return;

    // Basic AI - move toward player
    const dx = p.x - enemy.x;
    const dist = Math.abs(dx);

    if (dist > 30) {
      enemy.dir = dx > 0 ? 1 : -1;
      enemy.vx = enemy.dir * enemy.speed;
    } else {
      enemy.vx = 0;
    }

    // Gravity
    if (!enemy.grounded) {
      enemy.vy += GRAVITY * dt;
    }
    enemy.vy = Math.min(enemy.vy, 600);

    // Move with collision
    moveEntity(enemy, dt);

    // Shooting enemies
    if (enemy.shoots) {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0 && dist < 300) {
        enemy.shootTimer = 1.5;
        game.projectiles.push({
          x: enemy.x + enemy.width/2,
          y: enemy.y + enemy.height/2,
          width: 10, height: 10,
          vx: enemy.dir * 200,
          vy: 0,
          damage: enemy.damage,
          isPlayer: false
        });
      }
    }

    // Contact damage
    if (p.invincible <= 0 && rectCollide(p, enemy)) {
      damagePlayer(enemy.damage);
    }
  });

  // Remove dead enemies
  game.enemies = game.enemies.filter(e => e.hp > 0);
}

// Projectile update
function updateProjectiles(dt) {
  game.projectiles.forEach(proj => {
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    // Check collision with tiles
    const tx = Math.floor(proj.x / TILE);
    const ty = Math.floor(proj.y / TILE);
    if (isSolid(game.currentRoom, tx, ty)) {
      proj.dead = true;
      return;
    }

    // Player projectiles hit enemies
    if (proj.isPlayer) {
      game.enemies.forEach(enemy => {
        if (enemy.hp > 0 && rectCollide(proj, enemy)) {
          enemy.hp -= proj.damage;
          proj.dead = true;
          spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#f44', 5);
          if (enemy.hp <= 0) {
            spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#4f4', 10);
          }
        }
      });
    } else {
      // Enemy projectiles hit player
      const p = game.player;
      if (p && p.invincible <= 0 && rectCollide(proj, p)) {
        damagePlayer(proj.damage);
        proj.dead = true;
      }
    }
  });

  // Remove dead projectiles and out of bounds
  game.projectiles = game.projectiles.filter(p => {
    if (p.dead) return false;
    if (p.x < -50 || p.x > WIDTH + 50 || p.y < -50 || p.y > HEIGHT + 50) return false;
    return true;
  });
}

function damagePlayer(amount) {
  const p = game.player;
  if (!p || p.invincible > 0) return;

  p.hp -= amount;
  p.invincible = 1.0;
  p.vx = -p.facing * 200;
  p.vy = -200;

  if (p.hp <= 0) {
    game.screen = 'gameover';
  }
}

// Particles
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200 - 100,
      life: 0.5 + Math.random() * 0.3,
      color
    });
  }
}

function updateParticles(dt) {
  game.particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt;
    p.life -= dt;
  });
  game.particles = game.particles.filter(p => p.life > 0);
}

// Messages
function updateMessages(dt) {
  game.messages.forEach(m => m.time -= dt);
  game.messages = game.messages.filter(m => m.time > 0);
}

// Rendering
function render() {
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (game.screen === 'title') {
    renderTitle();
  } else if (game.screen === 'game') {
    renderGame();
  } else if (game.screen === 'gameover') {
    renderGameOver();
  } else if (game.screen === 'victory') {
    renderVictory();
  }
}

function renderTitle() {
  // Background scan lines
  ctx.fillStyle = 'rgba(0, 50, 50, 0.3)';
  for (let y = 0; y < HEIGHT; y += 4) {
    ctx.fillRect(0, y, WIDTH, 2);
  }

  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('CITADEL', WIDTH/2, 180);

  ctx.fillStyle = '#0aa';
  ctx.font = '18px Courier New';
  ctx.fillText('A System Shock Metroidvania', WIDTH/2, 220);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 16px Courier New';
  ctx.fillText('"Look at you, hacker..."', WIDTH/2, 300);

  ctx.fillStyle = '#0f0';
  ctx.font = '16px Courier New';
  ctx.fillText('CONTROLS:', WIDTH/2, 380);
  ctx.fillText('A/D or Arrows - Move', WIDTH/2, 410);
  ctx.fillText('SPACE/W - Jump', WIDTH/2, 435);
  ctx.fillText('J/Z - Shoot', WIDTH/2, 460);
  ctx.fillText('SHIFT - Dash (when acquired)', WIDTH/2, 485);

  ctx.fillStyle = '#ff0';
  ctx.fillText('Press ENTER to begin', WIDTH/2, 550);
}

function renderGame() {
  const room = ROOMS[game.currentRoom];
  if (!room) return;

  // Render tiles
  for (let y = 0; y < room.data.length; y++) {
    for (let x = 0; x < room.data[y].length; x++) {
      const tile = room.data[y][x];
      const px = x * TILE;
      const py = y * TILE;

      if (tile === '1') {
        ctx.fillStyle = room.theme === 'medical' ? '#234' : room.theme === 'tech' ? '#322' : '#333';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = '#456';
        ctx.strokeRect(px, py, TILE, TILE);
      } else if (tile === '4') {
        // Door
        ctx.fillStyle = '#543';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#a86';
        ctx.fillRect(px + 8, py + 4, 16, 24);
      } else if (tile === 'S') {
        // Save point
        ctx.fillStyle = '#040';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(px + 10, py + 8, 12, 16);
      } else if (tile === 'H') {
        // Health pickup hint
        ctx.fillStyle = '#400';
        ctx.fillRect(px + 8, py + 8, 16, 16);
        ctx.fillStyle = '#f44';
        ctx.fillText('+', px + 12, py + 20);
      } else if (tile === 'E') {
        // Energy hint
        ctx.fillStyle = '#004';
        ctx.fillRect(px + 8, py + 8, 16, 16);
      } else if (tile === 'D') {
        // Ability hint
        ctx.fillStyle = '#440';
        ctx.fillRect(px + 8, py + 8, 16, 16);
      }
    }
  }

  // Render pickups
  game.pickups.forEach(pickup => {
    if (pickup.collected) return;
    const colors = {
      health: '#f44',
      energy: '#44f',
      doubleJump: '#ff0',
      wallJump: '#0ff',
      dash: '#f0f'
    };
    ctx.fillStyle = colors[pickup.type] || '#fff';
    ctx.fillRect(pickup.x, pickup.y, 24, 24);

    if (pickup.type.includes('Jump') || pickup.type === 'dash') {
      ctx.fillStyle = '#000';
      ctx.font = '10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('!', pickup.x + 12, pickup.y + 17);
    }
  });

  // Render enemies
  game.enemies.forEach(enemy => {
    if (enemy.hp <= 0) return;
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    // Health bar
    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#400';
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
    ctx.fillStyle = '#f00';
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * hpRatio, 4);

    // Eyes
    ctx.fillStyle = '#f00';
    const eyeX = enemy.x + (enemy.dir > 0 ? enemy.width - 10 : 4);
    ctx.fillRect(eyeX, enemy.y + 8, 6, 4);
  });

  // Render projectiles
  game.projectiles.forEach(proj => {
    ctx.fillStyle = proj.isPlayer ? '#0ff' : '#f44';
    ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
  });

  // Render particles
  game.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life * 2;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    ctx.globalAlpha = 1;
  });

  // Render player
  const p = game.player;
  if (p) {
    // Flash when invincible
    if (p.invincible <= 0 || Math.floor(p.invincible * 10) % 2 === 0) {
      ctx.fillStyle = p.dashing ? '#f0f' : '#0af';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Visor
      ctx.fillStyle = '#0ff';
      const visorX = p.facing > 0 ? p.x + 14 : p.x + 2;
      ctx.fillRect(visorX, p.y + 8, 8, 4);
    }

    // HUD
    ctx.fillStyle = '#200';
    ctx.fillRect(10, 10, 150, 20);
    ctx.fillStyle = '#f00';
    ctx.fillRect(10, 10, 150 * (p.hp / p.maxHp), 20);
    ctx.strokeStyle = '#400';
    ctx.strokeRect(10, 10, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${p.hp}/${p.maxHp}`, 15, 25);

    // Abilities
    ctx.fillStyle = '#0aa';
    ctx.font = '12px Courier New';
    let abilityY = 45;
    if (p.abilities.doubleJump) {
      ctx.fillText('DBL JUMP', 10, abilityY);
      abilityY += 15;
    }
    if (p.abilities.wallJump) {
      ctx.fillText('WALL JUMP', 10, abilityY);
      abilityY += 15;
    }
    if (p.abilities.dash) {
      ctx.fillText('DASH', 10, abilityY);
    }

    // Room name
    ctx.fillStyle = '#0ff';
    ctx.textAlign = 'right';
    ctx.fillText(game.currentRoom.toUpperCase(), WIDTH - 10, 25);
  }

  // Messages
  ctx.textAlign = 'center';
  game.messages.forEach((msg, i) => {
    ctx.fillStyle = msg.text.includes('SHODAN') ? '#f00' : '#0f0';
    ctx.font = '14px Courier New';
    ctx.fillText(msg.text, WIDTH/2, HEIGHT - 80 + i * 20);
  });
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('NEURAL DEATH', WIDTH/2, HEIGHT/2 - 40);

  ctx.fillStyle = '#f44';
  ctx.font = '24px Courier New';
  ctx.fillText('"Pathetic creature of meat and bone..."', WIDTH/2, HEIGHT/2 + 20);

  ctx.fillStyle = '#ff0';
  ctx.font = '16px Courier New';
  ctx.fillText('Press ENTER to try again', WIDTH/2, HEIGHT/2 + 80);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0, 50, 100, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('SHODAN DESTROYED', WIDTH/2, HEIGHT/2 - 40);

  ctx.fillStyle = '#0f0';
  ctx.font = '18px Courier New';
  ctx.fillText('Citadel Station is saved...', WIDTH/2, HEIGHT/2 + 20);
  ctx.fillText('...for now.', WIDTH/2, HEIGHT/2 + 50);

  ctx.fillStyle = '#ff0';
  ctx.font = '16px Courier New';
  ctx.fillText('Press ENTER to return', WIDTH/2, HEIGHT/2 + 120);
}

// Main loop
function update(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.05);
  game.lastTime = timestamp;

  if (game.screen === 'game') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateMessages(dt);

    // Check victory condition
    if (game.currentRoom === 'ability_room' && game.enemies.length === 0 && game.player.abilities.doubleJump) {
      if (!game.bossDefeated) {
        game.bossDefeated = true;
        addMessage('SHODAN: "NOOOOoooo..."', 5);
        setTimeout(() => {
          game.screen = 'victory';
        }, 3000);
      }
    }
  }

  render();
  requestAnimationFrame(update);
}

// Expose for testing
Object.defineProperty(window, 'gameState', {
  get: function() {
    return {
      screen: game.screen,
      currentRoom: game.currentRoom,
      player: game.player ? {
        x: game.player.x,
        y: game.player.y,
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        abilities: { ...game.player.abilities },
        grounded: game.player.grounded
      } : null,
      enemies: game.enemies.map(e => ({ type: e.type, hp: e.hp, x: e.x, y: e.y })),
      pickups: game.pickups.filter(p => !p.collected),
      projectiles: game.projectiles.length,
      bossDefeated: game.bossDefeated
    };
  }
});

// Start
requestAnimationFrame(update);
