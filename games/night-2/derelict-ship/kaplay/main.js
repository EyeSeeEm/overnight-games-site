// DERELICT - Survival Horror (Vanilla Canvas for headless testing)
const WIDTH = 1024;
const HEIGHT = 768;

const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const PLAYER_SPEED = 120;
const RUN_SPEED = 200;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE_LIT = 400;
const VISION_RANGE_DARK = 200;
const VISION_RANGE_NO_LIGHT = 60;

// Game state
const game = {
  state: 'title',
  player: null,
  enemies: [],
  items: [],
  rooms: [],
  doors: [],
  currentSector: 1,
  keys: {},
  mouse: { x: WIDTH / 2, y: HEIGHT / 2, clicked: false },
  lastTime: 0,
  flashlightOn: true,
  flashlightBattery: 60,
  powerAllocated: {
    lights: 1,
    doors: 1,
    scanners: 0,
    lifeSupport: 2,
    security: 0,
    engines: 0
  },
  totalPower: 4,
  shipIntegrity: 100,
  keycards: { blue: false, red: false, gold: false },
  enemiesKilled: 0,
  itemsCollected: 0,
  timeElapsed: 0
};

// Player object
function createPlayer(x, y) {
  return {
    x: x,
    y: y,
    width: 28,
    height: 28,
    hp: 100,
    maxHp: 100,
    o2: 100,
    maxO2: 100,
    facingAngle: 0,
    weapon: { name: 'Pipe', damage: 20, durability: 15, maxDurability: 15 },
    attacking: false,
    attackCooldown: 0,
    running: false,
    inventory: [],
    invincible: 0
  };
}

// Enemy types
function createCrawler(x, y) {
  return {
    type: 'crawler',
    x: x,
    y: y,
    width: 28,
    height: 28,
    hp: 30,
    maxHp: 30,
    damage: 15,
    speed: 80,
    attackRate: 1.2,
    attackCooldown: 0,
    detectionRange: 250,
    state: 'patrol',
    patrolTarget: { x: x, y: y },
    color: '#4a2'
  };
}

function createShambler(x, y) {
  return {
    type: 'shambler',
    x: x,
    y: y,
    width: 32,
    height: 32,
    hp: 60,
    maxHp: 60,
    damage: 25,
    speed: 50,
    attackRate: 2.0,
    attackCooldown: 0,
    detectionRange: 200,
    state: 'patrol',
    patrolTarget: { x: x, y: y },
    color: '#625'
  };
}

function createStalker(x, y) {
  return {
    type: 'stalker',
    x: x,
    y: y,
    width: 24,
    height: 24,
    hp: 45,
    maxHp: 45,
    damage: 20,
    speed: 150,
    attackRate: 0.8,
    attackCooldown: 0,
    detectionRange: 350,
    state: 'hiding',
    patrolTarget: { x: x, y: y },
    color: '#333',
    visible: false
  };
}

// Item types
function createO2Canister(x, y, size) {
  return {
    type: 'o2',
    x: x,
    y: y,
    width: 20,
    height: 20,
    size: size, // 'small' or 'large'
    value: size === 'small' ? 25 : 50,
    color: '#0af'
  };
}

function createMedkit(x, y, size) {
  return {
    type: 'medkit',
    x: x,
    y: y,
    width: 20,
    height: 20,
    size: size,
    value: size === 'small' ? 30 : 60,
    color: '#f44'
  };
}

function createKeycard(x, y, cardType) {
  return {
    type: 'keycard',
    x: x,
    y: y,
    width: 24,
    height: 16,
    cardType: cardType, // 'blue', 'red', 'gold'
    color: cardType === 'blue' ? '#44f' : cardType === 'red' ? '#f44' : '#fc0'
  };
}

// Room/Map generation
function generateShip() {
  game.rooms = [];
  game.doors = [];
  game.enemies = [];
  game.items = [];

  // Create a simple 3-sector ship layout
  // Sector 1: Starting area (Crew Quarters)
  createRoom(100, 100, 300, 200, 1, 'Crew Quarters');
  createRoom(100, 350, 200, 150, 1, 'Storage');
  createRoom(350, 100, 200, 250, 1, 'Corridor');

  // Sector 2: Medical Bay
  createRoom(600, 100, 250, 200, 2, 'Medical Bay');
  createRoom(600, 350, 200, 200, 2, 'Lab');

  // Sector 3: Engineering (Exit)
  createRoom(900, 200, 200, 300, 3, 'Engineering');

  // Create doors
  game.doors.push({ x: 380, y: 180, width: 40, height: 8, open: true, locked: false, sector: 1 });
  game.doors.push({ x: 530, y: 180, width: 8, height: 40, open: false, locked: false, sector: 1 });
  game.doors.push({ x: 830, y: 250, width: 8, height: 40, open: false, locked: true, requiredKey: 'blue', sector: 2 });

  // Add enemies
  game.enemies.push(createCrawler(350, 250));
  game.enemies.push(createCrawler(200, 420));
  game.enemies.push(createShambler(700, 180));
  game.enemies.push(createShambler(650, 420));
  game.enemies.push(createStalker(950, 400));

  // Add items
  game.items.push(createO2Canister(150, 150, 'small'));
  game.items.push(createO2Canister(180, 420, 'small'));
  game.items.push(createMedkit(650, 150, 'small'));
  game.items.push(createO2Canister(720, 400, 'large'));
  game.items.push(createKeycard(750, 200, 'blue'));
  game.items.push(createMedkit(950, 300, 'large'));

  // Player starts in crew quarters
  game.player = createPlayer(200, 180);
}

function createRoom(x, y, width, height, sector, name) {
  game.rooms.push({
    x: x,
    y: y,
    width: width,
    height: height,
    sector: sector,
    name: name,
    lit: game.powerAllocated.lights > 0,
    walls: [
      { x: x, y: y, width: width, height: 8 }, // top
      { x: x, y: y + height - 8, width: width, height: 8 }, // bottom
      { x: x, y: y, width: 8, height: height }, // left
      { x: x + width - 8, y: y, width: 8, height: height } // right
    ]
  });
}

// Collision detection
function rectCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.width &&
         py >= rect.y && py <= rect.y + rect.height;
}

function isWallAt(x, y) {
  for (const room of game.rooms) {
    for (const wall of room.walls) {
      if (pointInRect(x, y, wall)) return true;
    }
  }
  return false;
}

function canSeePoint(fromX, fromY, toX, toY) {
  // Simple raycast to check visibility
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(dist / 10);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const checkX = fromX + dx * t;
    const checkY = fromY + dy * t;
    if (isWallAt(checkX, checkY)) return false;
  }
  return true;
}

function isInVisionCone(targetX, targetY, player) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Get vision range based on lighting
  const room = getCurrentRoom(player.x, player.y);
  let visionRange = VISION_RANGE_NO_LIGHT;
  if (room && room.lit) {
    visionRange = VISION_RANGE_LIT;
  } else if (game.flashlightOn && game.flashlightBattery > 0) {
    visionRange = VISION_RANGE_DARK;
  }

  if (dist > visionRange) return false;

  // Check angle
  const angleToTarget = Math.atan2(dy, dx);
  let angleDiff = angleToTarget - player.facingAngle;

  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  if (Math.abs(angleDiff) > VISION_CONE_ANGLE / 2) return false;

  // Check line of sight
  return canSeePoint(player.x, player.y, targetX, targetY);
}

function getCurrentRoom(x, y) {
  for (const room of game.rooms) {
    if (pointInRect(x, y, room)) return room;
  }
  return null;
}

// Input handling
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  if (e.key === 'f' || e.key === 'F') {
    game.flashlightOn = !game.flashlightOn;
  }
  if (e.key === ' ' && game.state === 'title') {
    startGame();
  }
  if (e.key === 'e' || e.key === 'E') {
    interactWithNearby();
  }
  if (e.key === 'Escape' && game.state === 'playing') {
    game.state = 'paused';
  } else if (e.key === 'Escape' && game.state === 'paused') {
    game.state = 'playing';
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
  game.mouse.clicked = true;

  if (game.state === 'title') {
    startGame();
  } else if (game.state === 'playing') {
    playerAttack();
  } else if (game.state === 'gameover' || game.state === 'victory') {
    game.state = 'title';
  }
});

function startGame() {
  generateShip();
  game.state = 'playing';
  game.timeElapsed = 0;
  game.enemiesKilled = 0;
  game.itemsCollected = 0;
  game.keycards = { blue: false, red: false, gold: false };
  game.shipIntegrity = 100;
  game.flashlightBattery = 60;
  game.flashlightOn = true;
}

function interactWithNearby() {
  const p = game.player;
  if (!p) return;

  // Check doors
  for (const door of game.doors) {
    const dist = Math.sqrt((door.x - p.x) ** 2 + (door.y - p.y) ** 2);
    if (dist < 60) {
      if (door.locked) {
        if (door.requiredKey && game.keycards[door.requiredKey]) {
          door.locked = false;
          door.open = true;
        }
      } else {
        door.open = !door.open;
      }
    }
  }

  // Check escape pod (in Engineering)
  const room = getCurrentRoom(p.x, p.y);
  if (room && room.name === 'Engineering' && game.powerAllocated.engines >= 3) {
    game.state = 'victory';
  }
}

function playerAttack() {
  const p = game.player;
  if (!p || p.attackCooldown > 0) return;

  p.attacking = true;
  p.attackCooldown = 0.6;
  p.o2 = Math.max(0, p.o2 - 2); // Combat drains O2

  // Check for enemies in attack range
  const attackRange = 50;
  const attackAngle = 0.8; // ~45 degrees each side

  for (const enemy of game.enemies) {
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < attackRange) {
      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - p.facingAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) < attackAngle) {
        enemy.hp -= p.weapon.damage;
        p.weapon.durability--;

        if (enemy.hp <= 0) {
          game.enemies = game.enemies.filter(e => e !== enemy);
          game.enemiesKilled++;
        }
      }
    }
  }
}

// Update functions
function updatePlayer(dt) {
  const p = game.player;
  if (!p) return;

  // Update facing angle based on mouse
  const dx = game.mouse.x - p.x;
  const dy = game.mouse.y - p.y;
  p.facingAngle = Math.atan2(dy, dx);

  // Movement
  p.running = game.keys['shift'];
  const speed = p.running ? RUN_SPEED : PLAYER_SPEED;
  let moveX = 0, moveY = 0;

  if (game.keys['w']) moveY -= 1;
  if (game.keys['s']) moveY += 1;
  if (game.keys['a']) moveX -= 1;
  if (game.keys['d']) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const mag = Math.sqrt(moveX * moveX + moveY * moveY);
    moveX /= mag;
    moveY /= mag;

    const newX = p.x + moveX * speed * dt;
    const newY = p.y + moveY * speed * dt;

    // Check collision with walls and closed doors
    let canMoveX = !isWallAt(newX, p.y) && !isWallAt(newX + p.width / 2, p.y) && !isWallAt(newX - p.width / 2, p.y);
    let canMoveY = !isWallAt(p.x, newY) && !isWallAt(p.x, newY + p.height / 2) && !isWallAt(p.x, newY - p.height / 2);

    // Check doors
    for (const door of game.doors) {
      if (!door.open) {
        const doorRect = { x: door.x, y: door.y, width: door.width, height: door.height };
        if (rectCollision({ x: newX - p.width / 2, y: p.y - p.height / 2, width: p.width, height: p.height }, doorRect)) {
          canMoveX = false;
        }
        if (rectCollision({ x: p.x - p.width / 2, y: newY - p.height / 2, width: p.width, height: p.height }, doorRect)) {
          canMoveY = false;
        }
      }
    }

    if (canMoveX) p.x = newX;
    if (canMoveY) p.y = newY;

    // O2 drain while moving
    const drainRate = p.running ? 1 / 0.75 : 1 / 1.5;
    p.o2 -= drainRate * dt;
  } else {
    // Idle O2 drain
    p.o2 -= (1 / 2) * dt;
  }

  // Flashlight battery
  if (game.flashlightOn) {
    game.flashlightBattery -= dt;
    if (game.flashlightBattery <= 0) {
      game.flashlightOn = false;
      game.flashlightBattery = 0;
    }
  } else {
    game.flashlightBattery = Math.min(60, game.flashlightBattery + dt * 0.5);
  }

  // Life support O2 refill
  const room = getCurrentRoom(p.x, p.y);
  if (room && game.powerAllocated.lifeSupport >= 2) {
    // In powered life support, O2 refills slowly
    if (room.name === 'Medical Bay') {
      p.o2 = Math.min(p.maxO2, p.o2 + 5 * dt);
    }
  }

  // Check O2 death
  if (p.o2 <= 0) {
    game.state = 'gameover';
    game.deathReason = 'suffocation';
  }

  // Check HP death
  if (p.hp <= 0) {
    game.state = 'gameover';
    game.deathReason = 'killed';
  }

  // Update attack cooldown
  if (p.attackCooldown > 0) {
    p.attackCooldown -= dt;
    if (p.attackCooldown <= 0) {
      p.attacking = false;
    }
  }

  // Invincibility frames
  if (p.invincible > 0) {
    p.invincible -= dt;
  }

  // Item collision
  for (let i = game.items.length - 1; i >= 0; i--) {
    const item = game.items[i];
    const dist = Math.sqrt((item.x - p.x) ** 2 + (item.y - p.y) ** 2);
    if (dist < 30) {
      if (item.type === 'o2') {
        p.o2 = Math.min(p.maxO2, p.o2 + item.value);
        game.items.splice(i, 1);
        game.itemsCollected++;
      } else if (item.type === 'medkit') {
        p.hp = Math.min(p.maxHp, p.hp + item.value);
        game.items.splice(i, 1);
        game.itemsCollected++;
      } else if (item.type === 'keycard') {
        game.keycards[item.cardType] = true;
        game.items.splice(i, 1);
        game.itemsCollected++;
      }
    }
  }
}

function updateEnemies(dt) {
  const p = game.player;
  if (!p) return;

  for (const enemy of game.enemies) {
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Stalker visibility
    if (enemy.type === 'stalker') {
      enemy.visible = enemy.state === 'chasing' || dist < 80;
    }

    // Detection
    if (dist < enemy.detectionRange && canSeePoint(enemy.x, enemy.y, p.x, p.y)) {
      enemy.state = 'chasing';
    }

    // Movement
    if (enemy.state === 'chasing') {
      const moveX = dx / dist;
      const moveY = dy / dist;

      const newX = enemy.x + moveX * enemy.speed * dt;
      const newY = enemy.y + moveY * enemy.speed * dt;

      if (!isWallAt(newX, enemy.y)) enemy.x = newX;
      if (!isWallAt(enemy.x, newY)) enemy.y = newY;

      // Attack player
      if (dist < 35 && enemy.attackCooldown <= 0) {
        if (p.invincible <= 0) {
          p.hp -= enemy.damage;
          p.invincible = 0.5;
        }
        enemy.attackCooldown = enemy.attackRate;
      }
    } else {
      // Patrol behavior
      const ptx = enemy.patrolTarget.x;
      const pty = enemy.patrolTarget.y;
      const pdist = Math.sqrt((ptx - enemy.x) ** 2 + (pty - enemy.y) ** 2);

      if (pdist < 10) {
        // Pick new patrol point
        const room = getCurrentRoom(enemy.x, enemy.y);
        if (room) {
          enemy.patrolTarget.x = room.x + 20 + Math.random() * (room.width - 40);
          enemy.patrolTarget.y = room.y + 20 + Math.random() * (room.height - 40);
        }
      } else {
        const pmx = (ptx - enemy.x) / pdist;
        const pmy = (pty - enemy.y) / pdist;
        enemy.x += pmx * enemy.speed * 0.3 * dt;
        enemy.y += pmy * enemy.speed * 0.3 * dt;
      }
    }

    // Update attack cooldown
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= dt;
    }
  }
}

function updateGame(dt) {
  game.timeElapsed += dt;

  // Ship integrity decay
  game.shipIntegrity -= dt / 45;
  if (game.shipIntegrity <= 0) {
    game.state = 'gameover';
    game.deathReason = 'ship_destroyed';
  }
}

// Render functions
function renderTitle() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Flickering title effect
  const flicker = Math.random() > 0.95 ? 0.5 : 1;
  ctx.globalAlpha = flicker;

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 64px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('DERELICT', WIDTH / 2, 200);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#888';
  ctx.font = '20px Courier New';
  ctx.fillText('Survival Horror', WIDTH / 2, 250);

  ctx.fillStyle = '#0af';
  ctx.font = '16px Courier New';
  ctx.fillText('WASD - Move | SHIFT - Run | F - Flashlight', WIDTH / 2, 400);
  ctx.fillText('Mouse - Aim | Click - Attack | E - Interact', WIDTH / 2, 430);

  ctx.fillStyle = '#f44';
  ctx.fillText('Manage your O2. Stay in the light. Escape.', WIDTH / 2, 500);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Courier New';
  ctx.fillText('Click or Press SPACE to Start', WIDTH / 2, 600);
}

function renderGame() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const p = game.player;
  if (!p) return;

  // Render rooms
  for (const room of game.rooms) {
    // Floor
    ctx.fillStyle = room.lit ? '#1a1a2a' : '#0a0a10';
    ctx.fillRect(room.x, room.y, room.width, room.height);

    // Room name
    ctx.fillStyle = '#333';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, room.x + room.width / 2, room.y + 20);

    // Walls
    ctx.fillStyle = '#444';
    for (const wall of room.walls) {
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
  }

  // Render doors
  for (const door of game.doors) {
    if (door.open) {
      ctx.fillStyle = '#1a1a1a';
    } else if (door.locked) {
      ctx.fillStyle = door.requiredKey === 'blue' ? '#44f' : door.requiredKey === 'red' ? '#f44' : '#fc0';
    } else {
      ctx.fillStyle = '#654';
    }
    ctx.fillRect(door.x, door.y, door.width, door.height);
  }

  // Render items (only if visible)
  for (const item of game.items) {
    if (isInVisionCone(item.x, item.y, p)) {
      ctx.fillStyle = item.color;
      ctx.fillRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);

      // Item indicator
      if (item.type === 'o2') {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('O2', item.x, item.y + 4);
      } else if (item.type === 'medkit') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText('+', item.x, item.y + 5);
      } else if (item.type === 'keycard') {
        ctx.fillStyle = '#fff';
        ctx.font = '8px Courier New';
        ctx.fillText('KEY', item.x, item.y + 3);
      }
    }
  }

  // Render enemies (only if in vision cone)
  for (const enemy of game.enemies) {
    if (isInVisionCone(enemy.x, enemy.y, p)) {
      if (enemy.type === 'stalker' && !enemy.visible) continue;

      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Enemy type indicator
      ctx.fillStyle = '#f00';
      ctx.font = '10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.type[0].toUpperCase(), enemy.x, enemy.y + 4);

      // HP bar
      const hpPercent = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#300';
      ctx.fillRect(enemy.x - 15, enemy.y - 20, 30, 4);
      ctx.fillStyle = '#f00';
      ctx.fillRect(enemy.x - 15, enemy.y - 20, 30 * hpPercent, 4);
    }
  }

  // Render player
  ctx.save();
  ctx.translate(p.x, p.y);

  // Flashlight cone
  if (game.flashlightOn && game.flashlightBattery > 0) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, VISION_RANGE_DARK);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, VISION_RANGE_DARK, p.facingAngle - VISION_CONE_ANGLE / 2, p.facingAngle + VISION_CONE_ANGLE / 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.rotate(p.facingAngle);

  // Player body
  ctx.fillStyle = p.invincible > 0 ? '#aaf' : '#6af';
  ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

  // Direction indicator
  ctx.fillStyle = '#fff';
  ctx.fillRect(p.width / 4, -3, p.width / 2, 6);

  // Attack effect
  if (p.attacking) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.width / 2, 0);
    ctx.lineTo(p.width / 2 + 30, -15);
    ctx.lineTo(p.width / 2 + 30, 15);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();

  // Darkness overlay (outside vision cone)
  renderDarkness(p);

  // HUD
  renderHUD(p);
}

function renderDarkness(p) {
  // Create darkness with vision cone cut out
  ctx.save();

  // Darken areas outside cone (simplified)
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#000';

  const room = getCurrentRoom(p.x, p.y);
  let visionRange = VISION_RANGE_NO_LIGHT;
  if (room && room.lit) {
    visionRange = VISION_RANGE_LIT;
    ctx.globalAlpha = 0.3;
  } else if (game.flashlightOn && game.flashlightBattery > 0) {
    visionRange = VISION_RANGE_DARK;
    ctx.globalAlpha = 0.5;
  }

  // Draw darkness around vision cone
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.moveTo(p.x, p.y);
  ctx.arc(p.x, p.y, visionRange, p.facingAngle + VISION_CONE_ANGLE / 2, p.facingAngle - VISION_CONE_ANGLE / 2, true);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function renderHUD(p) {
  // O2 Bar
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 10, 204, 24);
  ctx.fillStyle = '#024';
  ctx.fillRect(12, 12, 200, 20);
  const o2Percent = p.o2 / p.maxO2;
  ctx.fillStyle = o2Percent < 0.2 ? '#f00' : '#0af';
  ctx.fillRect(12, 12, 200 * o2Percent, 20);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText(`O2: ${Math.floor(p.o2)}/${p.maxO2}`, 16, 27);

  // HP Bar
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 40, 204, 24);
  ctx.fillStyle = '#200';
  ctx.fillRect(12, 42, 200, 20);
  const hpPercent = p.hp / p.maxHp;
  ctx.fillStyle = hpPercent < 0.25 ? '#f00' : '#f44';
  ctx.fillRect(12, 42, 200 * hpPercent, 20);
  ctx.fillStyle = '#fff';
  ctx.fillText(`HP: ${Math.floor(p.hp)}/${p.maxHp}`, 16, 57);

  // Flashlight
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 70, 104, 20);
  ctx.fillStyle = game.flashlightOn ? '#ff0' : '#440';
  ctx.fillRect(12, 72, 100 * (game.flashlightBattery / 60), 16);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Courier New';
  ctx.fillText(`LIGHT: ${game.flashlightOn ? 'ON' : 'OFF'}`, 16, 84);

  // Ship Integrity
  ctx.fillStyle = '#000';
  ctx.fillRect(WIDTH - 214, 10, 204, 24);
  ctx.fillStyle = '#220';
  ctx.fillRect(WIDTH - 212, 12, 200, 20);
  const integrityPercent = game.shipIntegrity / 100;
  ctx.fillStyle = integrityPercent < 0.25 ? '#f00' : '#fa0';
  ctx.fillRect(WIDTH - 212, 12, 200 * integrityPercent, 20);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Courier New';
  ctx.textAlign = 'right';
  ctx.fillText(`INTEGRITY: ${Math.floor(game.shipIntegrity)}%`, WIDTH - 16, 27);

  // Keycards
  ctx.textAlign = 'left';
  ctx.font = '12px Courier New';
  ctx.fillStyle = game.keycards.blue ? '#44f' : '#226';
  ctx.fillText('■ BLUE', WIDTH - 200, 50);
  ctx.fillStyle = game.keycards.red ? '#f44' : '#622';
  ctx.fillText('■ RED', WIDTH - 130, 50);
  ctx.fillStyle = game.keycards.gold ? '#fc0' : '#662';
  ctx.fillText('■ GOLD', WIDTH - 60, 50);

  // Weapon
  ctx.fillStyle = '#fff';
  ctx.font = '14px Courier New';
  ctx.fillText(`Weapon: ${p.weapon.name} (${p.weapon.durability}/${p.weapon.maxDurability})`, 10, HEIGHT - 30);

  // Time
  const mins = Math.floor(game.timeElapsed / 60);
  const secs = Math.floor(game.timeElapsed % 60);
  ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, 10, HEIGHT - 10);

  // Warning overlay for low O2
  if (p.o2 < 20) {
    ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + 0.1 * Math.sin(Date.now() / 200)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Sector indicator
  const room = getCurrentRoom(p.x, p.y);
  if (room) {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '16px Courier New';
    ctx.fillText(`Sector ${room.sector}: ${room.name}`, WIDTH / 2, HEIGHT - 10);

    // Win hint in Engineering
    if (room.name === 'Engineering') {
      ctx.fillStyle = '#0f0';
      ctx.fillText('Press E near Escape Pod to win (need 3 Engine power)', WIDTH / 2, HEIGHT - 30);
    }
  }
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, 200);

  ctx.fillStyle = '#888';
  ctx.font = '20px Courier New';

  if (game.deathReason === 'suffocation') {
    ctx.fillText('Your lungs burned for oxygen that never came.', WIDTH / 2, 280);
  } else if (game.deathReason === 'killed') {
    ctx.fillText('Your body joins the ship\'s other victims.', WIDTH / 2, 280);
  } else if (game.deathReason === 'ship_destroyed') {
    ctx.fillText('The ship tears itself apart around you.', WIDTH / 2, 280);
  }

  ctx.fillStyle = '#aaa';
  ctx.font = '16px Courier New';
  ctx.fillText(`Time Survived: ${Math.floor(game.timeElapsed / 60)}:${Math.floor(game.timeElapsed % 60).toString().padStart(2, '0')}`, WIDTH / 2, 350);
  ctx.fillText(`Enemies Killed: ${game.enemiesKilled}`, WIDTH / 2, 380);
  ctx.fillText(`Items Collected: ${game.itemsCollected}`, WIDTH / 2, 410);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Courier New';
  ctx.fillText('Click to Return to Title', WIDTH / 2, 500);
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#0f0';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('ESCAPED!', WIDTH / 2, 200);

  ctx.fillStyle = '#8f8';
  ctx.font = '20px Courier New';
  ctx.fillText('You made it to the escape pod.', WIDTH / 2, 280);

  ctx.fillStyle = '#aaa';
  ctx.font = '16px Courier New';
  ctx.fillText(`Time: ${Math.floor(game.timeElapsed / 60)}:${Math.floor(game.timeElapsed % 60).toString().padStart(2, '0')}`, WIDTH / 2, 350);
  ctx.fillText(`Enemies Killed: ${game.enemiesKilled}`, WIDTH / 2, 380);
  ctx.fillText(`Items Collected: ${game.itemsCollected}`, WIDTH / 2, 410);
  ctx.fillText(`Ship Integrity: ${Math.floor(game.shipIntegrity)}%`, WIDTH / 2, 440);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Courier New';
  ctx.fillText('Click to Return to Title', WIDTH / 2, 520);
}

function renderPaused() {
  renderGame();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
  ctx.font = '20px Courier New';
  ctx.fillText('Press ESC to Resume', WIDTH / 2, HEIGHT / 2 + 50);
}

// Main game loop
function update(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.1);
  game.lastTime = timestamp;

  if (game.state === 'playing') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateGame(dt);
  }

  // Render
  if (game.state === 'title') {
    renderTitle();
  } else if (game.state === 'playing') {
    renderGame();
  } else if (game.state === 'gameover') {
    renderGameOver();
  } else if (game.state === 'victory') {
    renderVictory();
  } else if (game.state === 'paused') {
    renderPaused();
  }

  game.mouse.clicked = false;

  requestAnimationFrame(update);
}

// Expose game state for testing
window.gameState = game;

// Start the game loop
requestAnimationFrame(update);
