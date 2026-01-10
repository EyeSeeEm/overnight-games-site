// DERELICT - Survival Horror
// Built with LittleJS
// Darkwood-style vision cone mechanics

// Using global LittleJS from CDN - all functions/classes are already global

// Game constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 25;
const ROOM_HEIGHT = 20;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE_LIT = 12;
const VISION_RANGE_DARK = 6;
const VISION_RANGE_NONE = 2;

// Game state
let gameState = null;
let player = null;
let enemies = [];
let items = [];
let bullets = [];
let particles = [];
let walls = [];
let doors = [];

// Ship layout - rooms array
let rooms = [];
let currentRoom = 0;

// Initialize game state
function initGameState() {
  gameState = {
    health: 100,
    maxHealth: 100,
    oxygen: 100,
    maxOxygen: 100,
    inventory: [],
    flashlightOn: false,
    flashlightBattery: 60,
    currentSector: 1,
    integrity: 100,
    powerBars: 4,
    systems: {
      lights: false,
      doors: true,
      scanner: false,
      lifeSupport: true
    },
    isDead: false,
    hasEscaped: false,
    enemiesKilled: 0,
    itemsCollected: 0
  };
  window.gameState = gameState;
}

// Generate a room with walls and obstacles
function generateRoom() {
  walls = [];
  items = [];
  enemies = [];
  doors = [];

  // Outer walls
  for (let x = 0; x < ROOM_WIDTH; x++) {
    walls.push({ x: x, y: 0, type: 'wall' });
    walls.push({ x: x, y: ROOM_HEIGHT - 1, type: 'wall' });
  }
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    walls.push({ x: 0, y: y, type: 'wall' });
    walls.push({ x: ROOM_WIDTH - 1, y: y, type: 'wall' });
  }

  // Internal walls/obstacles
  for (let i = 0; i < 8; i++) {
    const wx = Math.floor(rand(3, ROOM_WIDTH - 3));
    const wy = Math.floor(rand(3, ROOM_HEIGHT - 3));
    const len = Math.floor(rand(2, 5));
    const horiz = rand() > 0.5;
    for (let j = 0; j < len; j++) {
      if (horiz) {
        walls.push({ x: wx + j, y: wy, type: 'obstacle' });
      } else {
        walls.push({ x: wx, y: wy + j, type: 'obstacle' });
      }
    }
  }

  // Doors
  doors.push({ x: ROOM_WIDTH - 1, y: Math.floor(ROOM_HEIGHT / 2), open: false, color: 'blue' });

  // Spawn items
  for (let i = 0; i < 4; i++) {
    const ix = Math.floor(rand(2, ROOM_WIDTH - 2));
    const iy = Math.floor(rand(2, ROOM_HEIGHT - 2));
    if (!isWall(ix, iy)) {
      const types = ['o2_small', 'o2_small', 'medkit_small', 'ammo'];
      items.push({
        x: ix,
        y: iy,
        type: types[Math.floor(rand(0, types.length))]
      });
    }
  }

  // Spawn enemies based on sector
  const numEnemies = gameState.currentSector + 1;
  for (let i = 0; i < numEnemies; i++) {
    let ex, ey;
    do {
      ex = Math.floor(rand(4, ROOM_WIDTH - 4));
      ey = Math.floor(rand(4, ROOM_HEIGHT - 4));
    } while (isWall(ex, ey) || (Math.abs(ex - ROOM_WIDTH/2) < 3 && Math.abs(ey - ROOM_HEIGHT/2) < 3));

    const type = rand() > 0.5 ? 'crawler' : 'shambler';
    enemies.push(new Enemy(vec2(ex, ey), type));
  }
}

function isWall(x, y) {
  return walls.some(w => w.x === Math.floor(x) && w.y === Math.floor(y));
}

function isDoor(x, y) {
  return doors.find(d => d.x === Math.floor(x) && d.y === Math.floor(y));
}

// Player class
class Player {
  constructor(pos) {
    this.pos = pos.copy();
    this.facing = 0; // Angle in radians
    this.velocity = vec2(0, 0);
    this.attackCooldown = new Timer();
    this.weapon = { name: 'Pipe', damage: 20, range: 1.5, speed: 1.0 };
    this.isAttacking = false;
    this.attackTimer = new Timer();
  }

  update() {
    if (gameState.isDead) return;

    // Update facing based on mouse position
    const worldMouse = screenToWorld(mousePos);
    const dx = worldMouse.x - this.pos.x;
    const dy = worldMouse.y - this.pos.y;
    this.facing = Math.atan2(dy, dx);

    // Movement
    const isRunning = keyIsDown('ShiftLeft') || keyIsDown('ShiftRight');
    const speed = isRunning ? 0.12 : 0.08;
    let moved = false;

    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) {
      this.velocity.y += speed;
      moved = true;
    }
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) {
      this.velocity.y -= speed;
      moved = true;
    }
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) {
      this.velocity.x -= speed;
      moved = true;
    }
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) {
      this.velocity.x += speed;
      moved = true;
    }

    // O2 drain based on activity
    const drainRate = isRunning && moved ? 0.03 : (moved ? 0.015 : 0.01);
    gameState.oxygen -= drainRate;

    // Clamp velocity
    this.velocity.x = clamp(this.velocity.x, -0.2, 0.2);
    this.velocity.y = clamp(this.velocity.y, -0.2, 0.2);

    // Apply velocity with collision
    const newPos = this.pos.add(this.velocity);
    if (!isWall(newPos.x, this.pos.y)) {
      this.pos.x = newPos.x;
    }
    if (!isWall(this.pos.x, newPos.y)) {
      this.pos.y = newPos.y;
    }

    // Friction
    this.velocity = this.velocity.scale(0.85);

    // Bounds
    this.pos.x = clamp(this.pos.x, 1, ROOM_WIDTH - 2);
    this.pos.y = clamp(this.pos.y, 1, ROOM_HEIGHT - 2);

    // Flashlight toggle
    if (keyWasPressed('KeyF')) {
      gameState.flashlightOn = !gameState.flashlightOn;
    }

    // Flashlight battery
    if (gameState.flashlightOn) {
      gameState.flashlightBattery -= 0.02;
      if (gameState.flashlightBattery <= 0) {
        gameState.flashlightOn = false;
        gameState.flashlightBattery = 0;
      }
    } else {
      gameState.flashlightBattery = Math.min(60, gameState.flashlightBattery + 0.01);
    }

    // Attack (melee)
    if (keyWasPressed('Space') && this.attackCooldown.elapsed()) {
      this.attack();
    }

    // Interact with door
    if (keyWasPressed('KeyE')) {
      const door = doors.find(d =>
        Math.abs(d.x - this.pos.x) < 1.5 && Math.abs(d.y - this.pos.y) < 1.5
      );
      if (door) {
        door.open = !door.open;
        if (door.open) {
          // Move to next room
          gameState.currentSector++;
          if (gameState.currentSector > 6) {
            gameState.hasEscaped = true;
          } else {
            generateRoom();
            this.pos = vec2(2, ROOM_HEIGHT / 2);
          }
        }
      }
    }

    // Update attack animation
    if (this.isAttacking && this.attackTimer.elapsed()) {
      this.isAttacking = false;
    }

    // Pick up items
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const dist = Math.sqrt((item.x - this.pos.x) ** 2 + (item.y - this.pos.y) ** 2);
      if (dist < 0.8) {
        this.pickupItem(item);
        items.splice(i, 1);
        gameState.itemsCollected++;
      }
    }

    // Check O2 death
    if (gameState.oxygen <= 0) {
      gameState.oxygen = 0;
      gameState.isDead = true;
    }

    // Check HP death
    if (gameState.health <= 0) {
      gameState.health = 0;
      gameState.isDead = true;
    }
  }

  attack() {
    this.isAttacking = true;
    this.attackTimer.set(0.3);
    this.attackCooldown.set(0.6 / this.weapon.speed);
    gameState.oxygen -= 2; // Combat drains O2

    // Check for enemy hits
    for (const enemy of enemies) {
      const dist = this.pos.distance(enemy.pos);
      if (dist < this.weapon.range) {
        // Check if enemy is in front of player
        const angle = Math.atan2(enemy.pos.y - this.pos.y, enemy.pos.x - this.pos.x);
        const angleDiff = Math.abs(normalizeAngle(angle - this.facing));
        if (angleDiff < Math.PI / 3) {
          enemy.takeDamage(this.weapon.damage);
          spawnParticles(enemy.pos, new Color(1, 0, 0, 0.8), 5);
        }
      }
    }

    // Attack particles
    const attackDir = vec2(Math.cos(this.facing), Math.sin(this.facing));
    spawnParticles(this.pos.add(attackDir.scale(0.5)), new Color(1, 1, 0.5, 0.7), 3);
  }

  pickupItem(item) {
    switch (item.type) {
      case 'o2_small':
        gameState.oxygen = Math.min(gameState.maxOxygen, gameState.oxygen + 25);
        break;
      case 'o2_large':
        gameState.oxygen = Math.min(gameState.maxOxygen, gameState.oxygen + 50);
        break;
      case 'medkit_small':
        gameState.health = Math.min(gameState.maxHealth, gameState.health + 30);
        break;
      case 'medkit_large':
        gameState.health = Math.min(gameState.maxHealth, gameState.health + 60);
        break;
      case 'ammo':
        // For future ranged weapons
        break;
    }
    spawnParticles(vec2(item.x, item.y), new Color(0, 1, 0, 0.8), 5);
  }

  takeDamage(amount) {
    gameState.health -= amount;
    spawnParticles(this.pos, new Color(1, 0, 0, 0.8), 8);
  }

  render() {
    // Player body
    const bodyColor = new Color(0.3, 0.5, 0.7);
    drawRect(this.pos, vec2(0.8, 0.8), bodyColor);

    // Direction indicator (facing)
    const dir = vec2(Math.cos(this.facing), Math.sin(this.facing));
    const headPos = this.pos.add(dir.scale(0.3));
    drawRect(headPos, vec2(0.3, 0.3), new Color(0.8, 0.7, 0.6));

    // Attack animation
    if (this.isAttacking) {
      const weaponPos = this.pos.add(dir.scale(0.8));
      drawRect(weaponPos, vec2(0.5, 0.2), new Color(0.6, 0.6, 0.6));
    }
  }
}

// Enemy class
class Enemy {
  constructor(pos, type) {
    this.pos = pos.copy();
    this.type = type;
    this.velocity = vec2(0, 0);
    this.attackCooldown = new Timer();
    this.state = 'patrol'; // patrol, chase, attack
    this.patrolDir = rand(0, Math.PI * 2);
    this.patrolTimer = new Timer();
    this.patrolTimer.set(rand(1, 3));

    // Stats based on type
    if (type === 'crawler') {
      this.hp = 30;
      this.maxHp = 30;
      this.damage = 15;
      this.speed = 0.05;
      this.attackRate = 1.2;
      this.detectionRange = 8;
      this.color = new Color(0.4, 0.6, 0.2);
    } else if (type === 'shambler') {
      this.hp = 60;
      this.maxHp = 60;
      this.damage = 25;
      this.speed = 0.03;
      this.attackRate = 2;
      this.detectionRange = 6;
      this.color = new Color(0.5, 0.3, 0.4);
    }
  }

  update() {
    if (this.hp <= 0) return;

    const distToPlayer = this.pos.distance(player.pos);

    // State transitions
    if (distToPlayer < this.detectionRange && canSeePlayer(this.pos)) {
      this.state = 'chase';
    } else if (this.state === 'chase' && distToPlayer > this.detectionRange * 1.5) {
      this.state = 'patrol';
    }

    // Behavior
    if (this.state === 'patrol') {
      if (this.patrolTimer.elapsed()) {
        this.patrolDir = rand(0, Math.PI * 2);
        this.patrolTimer.set(rand(2, 4));
      }
      this.velocity.x = Math.cos(this.patrolDir) * this.speed * 0.3;
      this.velocity.y = Math.sin(this.patrolDir) * this.speed * 0.3;
    } else if (this.state === 'chase') {
      const dir = player.pos.subtract(this.pos).normalize();
      this.velocity = dir.scale(this.speed);

      // Attack when close
      if (distToPlayer < 1.2 && this.attackCooldown.elapsed()) {
        this.attack();
      }
    }

    // Apply velocity with collision
    const newPos = this.pos.add(this.velocity);
    if (!isWall(newPos.x, this.pos.y)) {
      this.pos.x = newPos.x;
    }
    if (!isWall(this.pos.x, newPos.y)) {
      this.pos.y = newPos.y;
    }

    // Bounds
    this.pos.x = clamp(this.pos.x, 1, ROOM_WIDTH - 2);
    this.pos.y = clamp(this.pos.y, 1, ROOM_HEIGHT - 2);
  }

  attack() {
    this.attackCooldown.set(this.attackRate);
    player.takeDamage(this.damage);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      gameState.enemiesKilled++;
      spawnParticles(this.pos, this.color, 10);
    }
  }

  render() {
    if (this.hp <= 0) return;

    // Enemy body
    const size = this.type === 'shambler' ? 0.9 : 0.7;
    drawRect(this.pos, vec2(size, size), this.color);

    // Health bar
    const hpPct = this.hp / this.maxHp;
    drawRect(this.pos.add(vec2(0, 0.6)), vec2(0.8, 0.1), new Color(0.3, 0.3, 0.3));
    drawRect(this.pos.add(vec2((hpPct - 1) * 0.4, 0.6)), vec2(hpPct * 0.8, 0.1), new Color(1, 0.2, 0.2));

    // Eyes (glow when chasing)
    if (this.state === 'chase') {
      drawRect(this.pos.add(vec2(-0.15, 0.1)), vec2(0.1, 0.1), new Color(1, 0, 0));
      drawRect(this.pos.add(vec2(0.15, 0.1)), vec2(0.1, 0.1), new Color(1, 0, 0));
    }
  }
}

// Particle system
function spawnParticles(pos, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      pos: pos.copy(),
      velocity: vec2(rand(-0.1, 0.1), rand(-0.1, 0.1)),
      color: color.copy(),
      life: 1,
      decay: rand(0.02, 0.05)
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.pos = p.pos.add(p.velocity);
    p.velocity = p.velocity.scale(0.95);
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function renderParticles() {
  for (const p of particles) {
    const size = p.life * 0.15;
    const c = p.color.copy();
    c.a = p.life;
    drawRect(p.pos, vec2(size, size), c);
  }
}

// Visibility system
function canSeePlayer(fromPos) {
  const dx = player.pos.x - fromPos.x;
  const dy = player.pos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(dist * 2);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = fromPos.x + dx * t;
    const y = fromPos.y + dy * t;
    if (isWall(x, y)) return false;
  }
  return true;
}

function isInVisionCone(pos) {
  const dx = pos.x - player.pos.x;
  const dy = pos.y - player.pos.y;
  const angle = Math.atan2(dy, dx);
  const angleDiff = Math.abs(normalizeAngle(angle - player.facing));

  if (angleDiff > VISION_CONE_ANGLE / 2) return false;

  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxRange = gameState.systems.lights ? VISION_RANGE_LIT :
                   gameState.flashlightOn ? VISION_RANGE_DARK : VISION_RANGE_NONE;

  if (dist > maxRange) return false;

  // Line of sight check
  return canSeePlayer(pos);
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// Convert screen position to world position
function screenToWorld(screenPos) {
  const canvas = mainCanvasSize;
  const scale = 32; // Camera scale
  const camX = ROOM_WIDTH / 2;
  const camY = ROOM_HEIGHT / 2;

  return vec2(
    (screenPos.x - canvas.x / 2) / scale + camX,
    -(screenPos.y - canvas.y / 2) / scale + camY
  );
}

// Render functions
function renderRoom() {
  // Floor
  for (let x = 0; x < ROOM_WIDTH; x++) {
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const pos = vec2(x + 0.5, y + 0.5);
      const visible = isInVisionCone(pos);
      const explored = true; // Simplified - could track explored tiles

      if (visible) {
        // Visible floor
        const floorColor = new Color(0.15, 0.15, 0.2);
        drawRect(pos, vec2(1, 1), floorColor);

        // Floor detail
        if ((x + y) % 4 === 0) {
          drawRect(pos, vec2(0.9, 0.9), new Color(0.12, 0.12, 0.18));
        }
      } else if (explored) {
        // Explored but not visible (darkness)
        drawRect(pos, vec2(1, 1), new Color(0.03, 0.03, 0.05));
      }
    }
  }

  // Walls
  for (const wall of walls) {
    const pos = vec2(wall.x + 0.5, wall.y + 0.5);
    const visible = isInVisionCone(pos) ||
                    player.pos.distance(pos) < 3;

    if (visible) {
      const wallColor = wall.type === 'wall'
        ? new Color(0.3, 0.3, 0.35)
        : new Color(0.25, 0.25, 0.3);
      drawRect(pos, vec2(1, 1), wallColor);
      // Wall highlight
      drawRect(pos.add(vec2(0, 0.3)), vec2(0.9, 0.2), new Color(0.4, 0.4, 0.45));
    } else {
      // Dark wall silhouette
      drawRect(pos, vec2(1, 1), new Color(0.08, 0.08, 0.1));
    }
  }

  // Doors
  for (const door of doors) {
    const pos = vec2(door.x + 0.5, door.y + 0.5);
    const visible = isInVisionCone(pos) || player.pos.distance(pos) < 3;

    if (visible) {
      const doorColor = door.open
        ? new Color(0.2, 0.5, 0.2)
        : new Color(0.2, 0.3, 0.8);
      drawRect(pos, vec2(0.3, 1), doorColor);
      // Door frame
      drawRect(pos.add(vec2(-0.4, 0)), vec2(0.1, 1.1), new Color(0.4, 0.4, 0.4));
      drawRect(pos.add(vec2(0.4, 0)), vec2(0.1, 1.1), new Color(0.4, 0.4, 0.4));
    }
  }

  // Items (only visible in cone)
  for (const item of items) {
    const pos = vec2(item.x + 0.5, item.y + 0.5);
    if (isInVisionCone(pos)) {
      let color;
      switch (item.type) {
        case 'o2_small':
        case 'o2_large':
          color = new Color(0.2, 0.6, 1);
          break;
        case 'medkit_small':
        case 'medkit_large':
          color = new Color(1, 0.3, 0.3);
          break;
        default:
          color = new Color(0.8, 0.8, 0.3);
      }
      drawRect(pos, vec2(0.4, 0.4), color);
      // Glow effect
      drawRect(pos, vec2(0.6, 0.6), color.scale(1, 0.3));
    }
  }

  // Enemies (only visible in cone)
  for (const enemy of enemies) {
    if (enemy.hp > 0 && isInVisionCone(enemy.pos)) {
      enemy.render();
    }
  }
}

function renderVisionCone() {
  // Subtle cone indicator (optional, for debugging)
  if (false) { // Set to true to see cone
    const range = gameState.flashlightOn ? VISION_RANGE_DARK : VISION_RANGE_NONE;
    const p1 = player.pos;
    const angle1 = player.facing - VISION_CONE_ANGLE / 2;
    const angle2 = player.facing + VISION_CONE_ANGLE / 2;
    const p2 = p1.add(vec2(Math.cos(angle1), Math.sin(angle1)).scale(range));
    const p3 = p1.add(vec2(Math.cos(angle2), Math.sin(angle2)).scale(range));

    drawLine(p1, p2, 0.05, new Color(1, 1, 0, 0.2));
    drawLine(p1, p3, 0.05, new Color(1, 1, 0, 0.2));
  }

  // Flashlight beam effect
  if (gameState.flashlightOn) {
    const beamLength = VISION_RANGE_DARK;
    const beamDir = vec2(Math.cos(player.facing), Math.sin(player.facing));
    const beamEnd = player.pos.add(beamDir.scale(beamLength));
    drawLine(player.pos, beamEnd, 0.3, new Color(1, 1, 0.8, 0.1));
  }
}

function renderHUD() {
  const sw = mainCanvasSize.x;
  const sh = mainCanvasSize.y;

  // Background bars
  drawRect(vec2(sw / 64, sh / 64 - 1.5), vec2(sw / 32, 3), new Color(0, 0, 0, 0.7), 0, true, true);

  // O2 bar
  const o2Pct = gameState.oxygen / gameState.maxOxygen;
  const o2Color = o2Pct < 0.2 ? new Color(1, 0.2, 0.2) : new Color(0.2, 0.6, 1);
  drawTextScreen(`O2: ${Math.ceil(gameState.oxygen)}`, vec2(20, 30), 16, new Color(1, 1, 1));
  drawRect(vec2(150 / 32, sh / 64 - 1.7), vec2(100 / 32, 0.4), new Color(0.2, 0.2, 0.2), 0, true, true);
  drawRect(vec2((50 + o2Pct * 50) / 32, sh / 64 - 1.7), vec2(o2Pct * 100 / 32, 0.4), o2Color, 0, true, true);

  // HP bar
  const hpPct = gameState.health / gameState.maxHealth;
  const hpColor = hpPct < 0.25 ? new Color(1, 0.2, 0.2) : new Color(0.2, 0.8, 0.2);
  drawTextScreen(`HP: ${Math.ceil(gameState.health)}`, vec2(sw - 180, 30), 16, new Color(1, 1, 1));
  drawRect(vec2((sw - 80) / 32, sh / 64 - 1.7), vec2(100 / 32, 0.4), new Color(0.2, 0.2, 0.2), 0, true, true);
  drawRect(vec2((sw - 130 + hpPct * 50) / 32, sh / 64 - 1.7), vec2(hpPct * 100 / 32, 0.4), hpColor, 0, true, true);

  // Bottom bar
  drawRect(vec2(sw / 64, (sh - 30) / 32), vec2(sw / 32, 2), new Color(0, 0, 0, 0.7), 0, true, true);

  // Sector info
  drawTextScreen(`SECTOR ${gameState.currentSector}/6`, vec2(20, sh - 35), 14, new Color(0.8, 0.8, 0.8));

  // Flashlight
  const flashText = gameState.flashlightOn ? 'ON' : 'OFF';
  const flashColor = gameState.flashlightOn ? new Color(1, 1, 0.5) : new Color(0.5, 0.5, 0.5);
  drawTextScreen(`[F] Flashlight: ${flashText}`, vec2(150, sh - 35), 14, flashColor);

  // Integrity
  const intColor = gameState.integrity < 25 ? new Color(1, 0.3, 0.3) : new Color(0.6, 0.8, 0.6);
  drawTextScreen(`Ship Integrity: ${Math.ceil(gameState.integrity)}%`, vec2(sw - 180, sh - 35), 14, intColor);

  // Warnings
  if (o2Pct < 0.2 && Math.sin(Date.now() * 0.01) > 0) {
    drawTextScreen('LOW OXYGEN!', vec2(sw / 2 - 60, sh / 2 - 100), 24, new Color(1, 0.2, 0.2));
  }
  if (hpPct < 0.25 && Math.sin(Date.now() * 0.01) > 0) {
    drawTextScreen('CRITICAL DAMAGE!', vec2(sw / 2 - 80, sh / 2 - 60), 24, new Color(1, 0.2, 0.2));
  }

  // Death screen
  if (gameState.isDead) {
    drawRect(vec2(sw / 64, sh / 64), vec2(sw / 32, sh / 32), new Color(0, 0, 0, 0.85), 0, true, true);
    drawTextScreen('YOU DIED', vec2(sw / 2 - 60, sh / 2 - 40), 36, new Color(0.8, 0.1, 0.1));
    if (gameState.oxygen <= 0) {
      drawTextScreen('Your lungs burned for oxygen that never came.', vec2(sw / 2 - 180, sh / 2 + 20), 14, new Color(0.7, 0.7, 0.7));
    } else {
      drawTextScreen('Your body joins the ship\'s other victims.', vec2(sw / 2 - 160, sh / 2 + 20), 14, new Color(0.7, 0.7, 0.7));
    }
    drawTextScreen('Press R to restart', vec2(sw / 2 - 70, sh / 2 + 60), 16, new Color(0.5, 0.5, 0.5));
  }

  // Victory screen
  if (gameState.hasEscaped) {
    drawRect(vec2(sw / 64, sh / 64), vec2(sw / 32, sh / 32), new Color(0, 0.1, 0, 0.85), 0, true, true);
    drawTextScreen('ESCAPED!', vec2(sw / 2 - 60, sh / 2 - 40), 36, new Color(0.2, 0.8, 0.2));
    drawTextScreen(`Enemies killed: ${gameState.enemiesKilled}`, vec2(sw / 2 - 80, sh / 2 + 10), 16, new Color(0.7, 0.7, 0.7));
    drawTextScreen(`Items collected: ${gameState.itemsCollected}`, vec2(sw / 2 - 80, sh / 2 + 35), 16, new Color(0.7, 0.7, 0.7));
    drawTextScreen('Press R to play again', vec2(sw / 2 - 85, sh / 2 + 80), 16, new Color(0.5, 0.5, 0.5));
  }
}

// Engine callbacks
function gameInit() {
  initGameState();
  player = new Player(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));
  generateRoom();
  setCameraScale(32);
  setCameraPos(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));
}

function gameUpdate() {
  // Restart
  if ((gameState.isDead || gameState.hasEscaped) && keyWasPressed('KeyR')) {
    initGameState();
    player = new Player(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));
    generateRoom();
  }

  if (!gameState.isDead && !gameState.hasEscaped) {
    player.update();

    // Update enemies
    for (const enemy of enemies) {
      enemy.update();
    }

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);

    // Ship integrity decay
    gameState.integrity -= 0.002;
    if (gameState.integrity <= 0) {
      gameState.integrity = 0;
      gameState.isDead = true;
    }
  }

  updateParticles();
}

function gameUpdatePost() {
  // Camera stays centered on room
}

function gameRender() {
  renderRoom();
  renderVisionCone();
  player.render();
  renderParticles();
}

function gameRenderPost() {
  renderHUD();
}

// Start the engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

console.log('DERELICT - Survival Horror loaded');
