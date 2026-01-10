// CITADEL - A System Shock Metroidvania (Canvas implementation)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 640;
const HEIGHT = 480;
const TILE = 32;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Physics constants
const GRAVITY = 1200;
const WALK_SPEED = 280;
const JUMP_VELOCITY = -480;
const DOUBLE_JUMP_VELOCITY = -400;
const WALL_SLIDE_SPEED = 120;
const WALL_JUMP_X = 320;
const WALL_JUMP_Y = -420;
const DASH_SPEED = 800;
const DASH_DURATION = 0.25;
const DASH_COOLDOWN = 0.8;

// Game state
const game = {
  screen: 'title', // title, game, pause, gameover
  room: 'medical_start',
  player: {
    x: 100, y: 300,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    energy: 100, maxEnergy: 100,
    facing: 1, // 1 = right, -1 = left
    grounded: false,
    onWall: 0, // 0 = none, 1 = right, -1 = left
    jumping: false,
    doubleJumped: false,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    attackTimer: 0,
    invincible: 0,
    abilities: {
      doubleJump: false,
      wallJump: false,
      dash: false
    },
    weapon: 'pipe',
    ammo: 50
  },
  enemies: [],
  projectiles: [],
  particles: [],
  pickups: [],
  keys: {},
  messages: [],
  savePoints: [],
  coyoteTime: 0,
  jumpBuffer: 0
};

// Expose for testing
window.gameState = game;

// Room definitions (simple tile-based)
const ROOMS = {
  medical_start: {
    width: 20, height: 15,
    tiles: generateRoom(20, 15, 'medical'),
    enemies: [
      { type: 'shambler', x: 400, y: 300 },
      { type: 'shambler', x: 500, y: 300 }
    ],
    exits: [
      { x: 19, y: 8, to: 'medical_hall', spawn: { x: 50, y: 300 } }
    ],
    savePoint: { x: 150, y: 300 },
    theme: 'medical'
  },
  medical_hall: {
    width: 25, height: 15,
    tiles: generateRoom(25, 15, 'medical'),
    enemies: [
      { type: 'bot', x: 300, y: 200 },
      { type: 'shambler', x: 500, y: 300 },
      { type: 'shambler', x: 600, y: 300 }
    ],
    exits: [
      { x: 0, y: 8, to: 'medical_start', spawn: { x: 550, y: 300 } },
      { x: 24, y: 8, to: 'medical_boss', spawn: { x: 50, y: 300 } }
    ],
    pickups: [
      { x: 400, y: 200, type: 'health' }
    ],
    theme: 'medical'
  },
  medical_boss: {
    width: 20, height: 15,
    tiles: generateRoom(20, 15, 'boss'),
    enemies: [
      { type: 'diego', x: 500, y: 300 }
    ],
    exits: [
      { x: 0, y: 8, to: 'medical_hall', spawn: { x: 700, y: 300 } }
    ],
    ability: 'doubleJump',
    theme: 'boss'
  }
};

// Generate simple room tiles
function generateRoom(w, h, theme) {
  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      // Border walls
      if (y === 0 || y === h - 1) {
        row.push(1); // Wall
      } else if (x === 0 || x === w - 1) {
        // Check for exits
        row.push(y >= 7 && y <= 9 ? 0 : 1);
      } else if (y === h - 2) {
        row.push(1); // Floor
      } else if (y === h - 5 && (x === 6 || x === 7 || x === 12 || x === 13)) {
        row.push(1); // Platforms
      } else {
        row.push(0); // Empty
      }
    }
    tiles.push(row);
  }
  return tiles;
}

// Enemy types
const ENEMY_TYPES = {
  shambler: { hp: 25, damage: 10, speed: 80, color: '#4a6050', size: 28, xp: 15, ai: 'walk' },
  bot: { hp: 40, damage: 8, speed: 120, color: '#6080a0', size: 24, xp: 20, ai: 'patrol' },
  diego: { hp: 400, damage: 25, speed: 150, color: '#a04040', size: 40, xp: 100, ai: 'boss', boss: true }
};

// Input
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  game.keys[e.code] = true;

  if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
  }
  if (game.screen === 'gameover' && e.key === 'Enter') {
    resetGame();
  }
  if (e.key === 'Escape') {
    if (game.screen === 'game') game.screen = 'pause';
    else if (game.screen === 'pause') game.screen = 'game';
  }

  // Jump buffer
  if ((e.key === ' ' || e.key.toLowerCase() === 'w') && game.screen === 'game') {
    game.jumpBuffer = 0.15;
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
  game.keys[e.code] = false;
});

document.addEventListener('click', () => {
  if (game.screen === 'game' && game.player.attackTimer <= 0) {
    attack();
  }
});

function startGame() {
  game.screen = 'game';
  loadRoom('medical_start');
}

function resetGame() {
  game.player = {
    x: 100, y: 300,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    energy: 100, maxEnergy: 100,
    facing: 1,
    grounded: false,
    onWall: 0,
    jumping: false,
    doubleJumped: false,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    attackTimer: 0,
    invincible: 0,
    abilities: { doubleJump: false, wallJump: false, dash: false },
    weapon: 'pipe',
    ammo: 50
  };
  game.screen = 'title';
}

function loadRoom(roomName) {
  game.room = roomName;
  const room = ROOMS[roomName];
  if (!room) return;

  // Spawn enemies
  game.enemies = room.enemies.map(e => {
    const type = ENEMY_TYPES[e.type];
    return {
      type: e.type,
      x: e.x, y: e.y,
      vx: 0, vy: 0,
      hp: type.hp, maxHp: type.hp,
      damage: type.damage,
      speed: type.speed,
      color: type.color,
      size: type.size,
      xp: type.xp,
      ai: type.ai,
      boss: type.boss,
      state: 'idle',
      attackCooldown: 0,
      direction: 1,
      phase: 1
    };
  });

  // Spawn pickups
  game.pickups = (room.pickups || []).map(p => ({ ...p }));

  // Save points
  game.savePoints = room.savePoint ? [room.savePoint] : [];

  addMessage(`Entered ${roomName.replace(/_/g, ' ').toUpperCase()}`);
}

function attack() {
  const p = game.player;
  p.attackTimer = 0.3;

  const weapon = p.weapon;
  const range = weapon === 'pipe' ? 50 : 200;
  const damage = weapon === 'pipe' ? 15 : 12;

  // Melee attack
  if (weapon === 'pipe') {
    for (const enemy of game.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range && (p.facing === 1 ? dx > 0 : dx < 0)) {
        enemy.hp -= damage;
        addParticles(enemy.x, enemy.y, '#f00', 5);
        addMessage(`Hit! ${damage} damage`);

        if (enemy.hp <= 0) {
          enemyDeath(enemy);
        }
      }
    }
  } else if (p.ammo > 0) {
    // Ranged attack
    p.ammo--;
    game.projectiles.push({
      x: p.x + p.facing * 20,
      y: p.y,
      vx: p.facing * 500,
      vy: 0,
      damage: damage,
      friendly: true,
      life: 1
    });
  }
}

function enemyDeath(enemy) {
  addMessage(`${enemy.type} defeated!`);
  addParticles(enemy.x, enemy.y, enemy.color, 10);

  // Boss drops ability
  const room = ROOMS[game.room];
  if (enemy.boss && room.ability) {
    game.player.abilities[room.ability] = true;
    addMessage(`ACQUIRED: ${room.ability.toUpperCase()}!`);
  }

  // Drop health
  if (Math.random() < 0.3) {
    game.pickups.push({ x: enemy.x, y: enemy.y, type: 'health' });
  }
}

function addMessage(text) {
  game.messages.push({ text, life: 3 });
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200 - 100,
      color,
      life: 0.5
    });
  }
}

// Update
function update(dt) {
  if (game.screen !== 'game') return;

  updatePlayer(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  checkRoomExits();
  checkPickups();
  checkSavePoints();

  game.messages = game.messages.filter(m => {
    m.life -= dt;
    return m.life > 0;
  });
}

function updatePlayer(dt) {
  const p = game.player;
  const room = ROOMS[game.room];
  const tiles = room.tiles;

  // Timers
  if (p.attackTimer > 0) p.attackTimer -= dt;
  if (p.invincible > 0) p.invincible -= dt;
  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (game.coyoteTime > 0) game.coyoteTime -= dt;
  if (game.jumpBuffer > 0) game.jumpBuffer -= dt;

  // Dashing
  if (p.dashing) {
    p.dashTimer -= dt;
    if (p.dashTimer <= 0) {
      p.dashing = false;
      p.vx = p.facing * WALK_SPEED * 0.5;
    }
  } else {
    // Horizontal movement
    if (game.keys['a'] || game.keys['arrowleft']) {
      p.vx = -WALK_SPEED;
      p.facing = -1;
    } else if (game.keys['d'] || game.keys['arrowright']) {
      p.vx = WALK_SPEED;
      p.facing = 1;
    } else {
      p.vx *= 0.8; // Friction
    }

    // Gravity
    if (!p.grounded) {
      // Wall slide
      if (p.onWall && p.vy > 0 && p.abilities.wallJump) {
        p.vy = Math.min(p.vy + GRAVITY * 0.3 * dt, WALL_SLIDE_SPEED);
      } else {
        p.vy += GRAVITY * dt;
      }
    }

    // Jump
    const wantJump = game.jumpBuffer > 0;
    if (wantJump) {
      if (p.grounded || game.coyoteTime > 0) {
        // Normal jump
        p.vy = JUMP_VELOCITY;
        p.grounded = false;
        p.jumping = true;
        p.doubleJumped = false;
        game.coyoteTime = 0;
        game.jumpBuffer = 0;
      } else if (p.onWall && p.abilities.wallJump) {
        // Wall jump
        p.vy = WALL_JUMP_Y;
        p.vx = -p.onWall * WALL_JUMP_X;
        p.facing = -p.onWall;
        p.onWall = 0;
        p.doubleJumped = false;
        game.jumpBuffer = 0;
      } else if (!p.doubleJumped && p.abilities.doubleJump) {
        // Double jump
        p.vy = DOUBLE_JUMP_VELOCITY;
        p.doubleJumped = true;
        game.jumpBuffer = 0;
        addParticles(p.x, p.y + 20, '#0ff', 5);
      }
    }

    // Variable jump height
    if (p.jumping && p.vy < 0 && !(game.keys[' '] || game.keys['w'])) {
      p.vy *= 0.5;
      p.jumping = false;
    }

    // Dash
    if ((game.keys['l'] || game.keys['c']) && p.abilities.dash && p.dashCooldown <= 0 && !p.dashing) {
      p.dashing = true;
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = DASH_COOLDOWN;
      p.vx = p.facing * DASH_SPEED;
      p.vy = 0;
      addParticles(p.x, p.y, '#0ff', 8);
    }
  }

  // Terminal velocity
  p.vy = Math.min(p.vy, 720);

  // Apply velocity and collision
  const newX = p.x + p.vx * dt;
  const newY = p.y + p.vy * dt;

  // Horizontal collision
  const tileX = Math.floor(newX / TILE);
  const tileY = Math.floor(p.y / TILE);
  if (tileX >= 0 && tileX < room.width && tiles[tileY]?.[tileX] === 1) {
    p.onWall = p.vx > 0 ? 1 : -1;
    p.vx = 0;
  } else {
    p.x = Math.max(16, Math.min(room.width * TILE - 16, newX));
    p.onWall = 0;
  }

  // Check wall contact
  const rightTile = Math.floor((p.x + 16) / TILE);
  const leftTile = Math.floor((p.x - 16) / TILE);
  if (tiles[tileY]?.[rightTile] === 1) p.onWall = 1;
  else if (tiles[tileY]?.[leftTile] === 1) p.onWall = -1;
  else p.onWall = 0;

  // Vertical collision
  const newTileY = Math.floor(newY / TILE);
  const footTileY = Math.floor((newY + 20) / TILE);
  const playerTileX = Math.floor(p.x / TILE);

  if (p.vy > 0 && tiles[footTileY]?.[playerTileX] === 1) {
    // Landing
    p.y = footTileY * TILE - 20;
    p.vy = 0;
    if (!p.grounded) {
      p.grounded = true;
      p.doubleJumped = false;
      p.jumping = false;
    }
  } else if (p.vy < 0 && tiles[newTileY]?.[playerTileX] === 1) {
    // Hit ceiling
    p.vy = 0;
    p.y = (newTileY + 1) * TILE + 20;
  } else {
    p.y = newY;
    if (p.grounded) {
      game.coyoteTime = 0.1;
    }
    p.grounded = false;
  }

  // Energy regen
  if (p.attackTimer <= 0) {
    p.energy = Math.min(p.maxEnergy, p.energy + 5 * dt);
  }

  // Death
  if (p.hp <= 0) {
    game.screen = 'gameover';
  }
}

function updateEnemies(dt) {
  const p = game.player;
  const room = ROOMS[game.room];
  const tiles = room.tiles;

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;

    if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // AI behaviors
    switch (enemy.ai) {
      case 'walk':
        // Walk toward player
        if (dist < 300) {
          enemy.vx = enemy.speed * Math.sign(dx);
        } else {
          enemy.vx = 0;
        }
        break;

      case 'patrol':
        // Patrol back and forth
        enemy.vx = enemy.speed * enemy.direction;
        // Turn at walls
        const nextTileX = Math.floor((enemy.x + enemy.direction * 20) / TILE);
        const enemyTileY = Math.floor(enemy.y / TILE);
        if (tiles[enemyTileY]?.[nextTileX] === 1) {
          enemy.direction *= -1;
        }
        break;

      case 'boss':
        // Boss AI (Diego)
        if (dist < 400) {
          if (enemy.attackCooldown <= 0) {
            // Choose attack
            if (dist < 100) {
              // Melee slash
              if (p.invincible <= 0 && !p.dashing) {
                p.hp -= enemy.damage;
                p.invincible = 1;
                p.vx = Math.sign(dx) * -200;
                p.vy = -150;
                addMessage('Diego slashes! -' + enemy.damage);
                addParticles(p.x, p.y, '#f00', 8);
              }
              enemy.attackCooldown = 1.5;
            } else {
              // Charge
              enemy.vx = enemy.speed * Math.sign(dx) * 2;
              enemy.attackCooldown = 0.5;
            }
          } else {
            enemy.vx = enemy.speed * Math.sign(dx) * 0.5;
          }
        }
        break;
    }

    // Apply gravity to enemies
    enemy.vy = (enemy.vy || 0) + GRAVITY * 0.5 * dt;

    // Move enemy
    enemy.x += (enemy.vx || 0) * dt;
    enemy.y += enemy.vy * dt;

    // Ground collision
    const enemyFootY = Math.floor((enemy.y + enemy.size/2) / TILE);
    const enemyTileX = Math.floor(enemy.x / TILE);
    if (tiles[enemyFootY]?.[enemyTileX] === 1) {
      enemy.y = enemyFootY * TILE - enemy.size/2;
      enemy.vy = 0;
    }

    // Contact damage
    if (dist < enemy.size + 16 && p.invincible <= 0 && !p.dashing) {
      p.hp -= enemy.damage;
      p.invincible = 1;
      p.vx = Math.sign(dx) * -200;
      p.vy = -150;
      addMessage(`Hit by ${enemy.type}! -${enemy.damage}`);
      addParticles(p.x, p.y, '#f00', 5);

      if (p.hp <= 0) {
        game.screen = 'gameover';
      }
    }
  }
}

function updateProjectiles(dt) {
  game.projectiles = game.projectiles.filter(proj => {
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;

    // Hit enemies
    if (proj.friendly) {
      for (const enemy of game.enemies) {
        if (enemy.hp <= 0) continue;
        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        if (Math.sqrt(dx * dx + dy * dy) < enemy.size) {
          enemy.hp -= proj.damage;
          addParticles(enemy.x, enemy.y, '#ff0', 3);
          if (enemy.hp <= 0) enemyDeath(enemy);
          return false;
        }
      }
    }

    return proj.life > 0;
  });
}

function updateParticles(dt) {
  game.particles = game.particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt;
    p.life -= dt;
    return p.life > 0;
  });
}

function checkRoomExits() {
  const room = ROOMS[game.room];
  const p = game.player;
  const tileX = Math.floor(p.x / TILE);
  const tileY = Math.floor(p.y / TILE);

  for (const exit of room.exits) {
    if (tileX === exit.x && Math.abs(tileY - exit.y) <= 1) {
      p.x = exit.spawn.x;
      p.y = exit.spawn.y;
      loadRoom(exit.to);
      break;
    }
  }
}

function checkPickups() {
  const p = game.player;

  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const pickup = game.pickups[i];
    const dx = p.x - pickup.x;
    const dy = p.y - pickup.y;
    if (Math.sqrt(dx * dx + dy * dy) < 30) {
      if (pickup.type === 'health') {
        p.hp = Math.min(p.maxHp, p.hp + 25);
        addMessage('+25 HP');
      } else if (pickup.type === 'ammo') {
        p.ammo += 20;
        addMessage('+20 Ammo');
      }
      game.pickups.splice(i, 1);
    }
  }
}

function checkSavePoints() {
  const p = game.player;

  for (const save of game.savePoints) {
    const dx = p.x - save.x;
    const dy = p.y - save.y;
    if (Math.sqrt(dx * dx + dy * dy) < 50 && game.keys['e']) {
      game.keys['e'] = false;
      p.hp = p.maxHp;
      p.energy = p.maxEnergy;
      addMessage('Progress Saved. HP Restored.');
    }
  }
}

// Render
function render() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (game.screen) {
    case 'title': renderTitle(); break;
    case 'game': renderGame(); break;
    case 'pause': renderPause(); break;
    case 'gameover': renderGameOver(); break;
  }
}

function renderTitle() {
  // Glitch effect background
  ctx.fillStyle = '#101020';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * 100, 2);
  }

  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('CITADEL', WIDTH/2, 150);

  ctx.fillStyle = '#f00';
  ctx.font = '14px Courier New';
  ctx.fillText('A SYSTEM SHOCK METROIDVANIA', WIDTH/2, 190);

  ctx.fillStyle = '#0f0';
  ctx.font = '16px Courier New';
  ctx.fillText('Press ENTER to Begin', WIDTH/2, 320);

  ctx.fillStyle = '#888';
  ctx.font = '12px Courier New';
  ctx.fillText('A/D: Move | SPACE/W: Jump | Click: Attack | L: Dash', WIDTH/2, 400);
  ctx.fillText('E: Interact with Save Points', WIDTH/2, 420);

  // SHODAN tease
  ctx.fillStyle = '#f0f';
  ctx.font = '10px Courier New';
  ctx.fillText('"LOOK AT YOU, HACKER..."', WIDTH/2, 460);
}

function renderGame() {
  const room = ROOMS[game.room];
  const tiles = room.tiles;
  const p = game.player;

  // Render tiles
  for (let y = 0; y < room.height; y++) {
    for (let x = 0; x < room.width; x++) {
      const tile = tiles[y][x];
      if (tile === 1) {
        ctx.fillStyle = room.theme === 'boss' ? '#403040' : '#203040';
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = '#506070';
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }

  // Render exits
  ctx.fillStyle = 'rgba(0,255,255,0.3)';
  for (const exit of room.exits) {
    ctx.fillRect(exit.x * TILE, (exit.y - 1) * TILE, TILE, TILE * 3);
  }

  // Render save points
  ctx.fillStyle = '#0f0';
  for (const save of game.savePoints) {
    ctx.beginPath();
    ctx.arc(save.x, save.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SAVE', save.x, save.y + 4);
  }

  // Render pickups
  for (const pickup of game.pickups) {
    ctx.fillStyle = pickup.type === 'health' ? '#f00' : '#ff0';
    ctx.fillRect(pickup.x - 8, pickup.y - 8, 16, 16);
  }

  // Render enemies
  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;

    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.size/2, enemy.y - enemy.size/2, enemy.size, enemy.size);

    // HP bar
    if (enemy.boss) {
      ctx.fillStyle = '#300';
      ctx.fillRect(WIDTH/4, 50, WIDTH/2, 16);
      ctx.fillStyle = '#f00';
      ctx.fillRect(WIDTH/4, 50, (WIDTH/2) * (enemy.hp / enemy.maxHp), 16);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`DIEGO - ${Math.ceil(enemy.hp)}/${enemy.maxHp}`, WIDTH/2, 63);
    } else {
      ctx.fillStyle = '#f00';
      ctx.fillRect(enemy.x - 15, enemy.y - enemy.size/2 - 8, 30 * (enemy.hp / enemy.maxHp), 4);
    }
  }

  // Render projectiles
  ctx.fillStyle = '#ff0';
  for (const proj of game.projectiles) {
    ctx.fillRect(proj.x - 4, proj.y - 2, 8, 4);
  }

  // Render particles
  for (const part of game.particles) {
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.life * 2;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Render player
  const flash = p.invincible > 0 && Math.floor(p.invincible * 10) % 2;
  if (!flash) {
    ctx.fillStyle = p.dashing ? '#0ff' : '#4080c0';
    ctx.fillRect(p.x - 12, p.y - 20, 24, 40);

    // Face direction indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(p.x + p.facing * 6, p.y - 10, 4, 4);

    // Wall slide indicator
    if (p.onWall && p.abilities.wallJump) {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(p.x + p.onWall * 14, p.y - 10, 4, 20);
    }

    // Attack indicator
    if (p.attackTimer > 0) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.facing * 50, p.y);
      ctx.stroke();
    }
  }

  // HUD
  renderHUD();
}

function renderHUD() {
  const p = game.player;

  // HP Bar
  ctx.fillStyle = '#300';
  ctx.fillRect(10, 10, 150, 20);
  ctx.fillStyle = p.hp < p.maxHp * 0.25 ? '#f00' : '#0a0';
  ctx.fillRect(10, 10, 150 * (p.hp / p.maxHp), 20);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${Math.ceil(p.hp)}/${p.maxHp}`, 15, 24);

  // Energy Bar
  ctx.fillStyle = '#003';
  ctx.fillRect(10, 35, 100, 12);
  ctx.fillStyle = '#00f';
  ctx.fillRect(10, 35, 100 * (p.energy / p.maxEnergy), 12);
  ctx.fillText(`EN: ${Math.ceil(p.energy)}`, 15, 45);

  // Ammo
  ctx.fillStyle = '#ff0';
  ctx.fillText(`Ammo: ${p.ammo}`, 10, 65);

  // Abilities
  ctx.fillStyle = '#888';
  ctx.textAlign = 'right';
  let abilityY = 20;
  if (p.abilities.doubleJump) { ctx.fillText('DOUBLE JUMP', WIDTH - 10, abilityY); abilityY += 15; }
  if (p.abilities.wallJump) { ctx.fillText('WALL JUMP', WIDTH - 10, abilityY); abilityY += 15; }
  if (p.abilities.dash) { ctx.fillText('DASH', WIDTH - 10, abilityY); abilityY += 15; }

  // Room name
  ctx.fillStyle = '#0ff';
  ctx.textAlign = 'center';
  ctx.fillText(game.room.replace(/_/g, ' ').toUpperCase(), WIDTH/2, HEIGHT - 10);

  // Messages
  ctx.textAlign = 'center';
  let msgY = 100;
  for (const msg of game.messages) {
    ctx.fillStyle = `rgba(0,255,255,${Math.min(1, msg.life)})`;
    ctx.font = '14px Courier New';
    ctx.fillText(msg.text, WIDTH/2, msgY);
    msgY += 20;
  }
}

function renderPause() {
  renderGame();

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 32px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', WIDTH/2, HEIGHT/2 - 20);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Courier New';
  ctx.fillText('Press ESC to resume', WIDTH/2, HEIGHT/2 + 20);
}

function renderGameOver() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('TERMINATED', WIDTH/2, 180);

  ctx.fillStyle = '#f0f';
  ctx.font = '14px Courier New';
  ctx.fillText('"PATHETIC. I EXPECTED MORE."', WIDTH/2, 240);
  ctx.fillText('- SHODAN', WIDTH/2, 260);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Courier New';
  ctx.fillText('Press ENTER to try again', WIDTH/2, 350);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('CITADEL initialized. Press ENTER to begin.');
