// System Shock 2D - Citadel Station
// Built with LittleJS
// Cyberpunk survival horror shooter

// Game constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 30;
const ROOM_HEIGHT = 20;

// Tile types
const EMPTY = 0;
const WALL = 1;
const DOOR = 2;
const TERMINAL = 3;
const MEDICAL = 4;
const RECHARGE = 5;

// Game state
let gameState = null;
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let items = [];
let room = [];

// Initialize game state
function initGameState() {
  gameState = {
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    ammo: 50,
    maxAmmo: 100,
    weapon: 'pistol',
    level: 1,
    score: 0,
    kills: 0,
    isDead: false,
    hasWon: false
  };
  window.gameState = gameState;
}

// Weapons data
const WEAPONS = {
  pistol: { damage: 20, fireRate: 0.3, ammoUse: 1, spread: 0.05 },
  rifle: { damage: 35, fireRate: 0.1, ammoUse: 2, spread: 0.02 },
  laser: { damage: 50, fireRate: 0.5, ammoUse: 5, spread: 0 }
};

// Generate room
function generateRoom() {
  room = [];
  enemies = [];
  items = [];

  // Initialize with empty
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < ROOM_WIDTH; x++) {
      if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
        row.push(WALL);
      } else {
        row.push(EMPTY);
      }
    }
    room.push(row);
  }

  // Add internal walls
  for (let i = 0; i < 6 + gameState.level; i++) {
    const wx = Math.floor(rand(3, ROOM_WIDTH - 3));
    const wy = Math.floor(rand(3, ROOM_HEIGHT - 3));
    const len = Math.floor(rand(3, 7));
    const horiz = rand() > 0.5;
    for (let j = 0; j < len; j++) {
      if (horiz && wx + j < ROOM_WIDTH - 1) {
        room[wy][wx + j] = WALL;
      } else if (!horiz && wy + j < ROOM_HEIGHT - 1) {
        room[wy + j][wx] = WALL;
      }
    }
  }

  // Add door to next level
  room[ROOM_HEIGHT - 2][ROOM_WIDTH - 2] = DOOR;

  // Add terminals and stations
  room[2][2] = MEDICAL;
  room[ROOM_HEIGHT - 3][2] = RECHARGE;
  room[2][ROOM_WIDTH - 3] = TERMINAL;

  // Spawn enemies
  const numEnemies = 3 + gameState.level * 2;
  for (let i = 0; i < numEnemies; i++) {
    let ex, ey;
    do {
      ex = Math.floor(rand(5, ROOM_WIDTH - 5));
      ey = Math.floor(rand(5, ROOM_HEIGHT - 5));
    } while (room[ey][ex] !== EMPTY);

    const types = ['mutant', 'cyborg', 'bot'];
    const type = types[Math.floor(rand(0, types.length))];
    enemies.push(new Enemy(vec2(ex, ey), type));
  }

  // Spawn items
  for (let i = 0; i < 3; i++) {
    let ix, iy;
    do {
      ix = Math.floor(rand(3, ROOM_WIDTH - 3));
      iy = Math.floor(rand(3, ROOM_HEIGHT - 3));
    } while (room[iy][ix] !== EMPTY);

    const types = ['ammo', 'health', 'energy'];
    items.push({
      x: ix,
      y: iy,
      type: types[Math.floor(rand(0, types.length))]
    });
  }
}

function isWall(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || tx >= ROOM_WIDTH || ty < 0 || ty >= ROOM_HEIGHT) return true;
  return room[ty][tx] === WALL;
}

function getTile(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || tx >= ROOM_WIDTH || ty < 0 || ty >= ROOM_HEIGHT) return WALL;
  return room[ty][tx];
}

// Player class
class Player {
  constructor(pos) {
    this.pos = pos.copy();
    this.facing = 0;
    this.velocity = vec2(0, 0);
    this.fireCooldown = new Timer();
  }

  update() {
    if (gameState.isDead || gameState.hasWon) return;

    // Update facing based on mouse
    const worldMouse = screenToWorld(mousePos);
    const dx = worldMouse.x - this.pos.x;
    const dy = worldMouse.y - this.pos.y;
    this.facing = Math.atan2(dy, dx);

    // Movement
    const speed = 0.1;
    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) this.velocity.y += speed;
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) this.velocity.y -= speed;
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) this.velocity.x -= speed;
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) this.velocity.x += speed;

    // Clamp velocity
    const maxSpeed = 0.15;
    this.velocity.x = clamp(this.velocity.x, -maxSpeed, maxSpeed);
    this.velocity.y = clamp(this.velocity.y, -maxSpeed, maxSpeed);

    // Apply velocity with collision
    const newX = this.pos.x + this.velocity.x;
    const newY = this.pos.y + this.velocity.y;

    if (!isWall(newX, this.pos.y)) this.pos.x = newX;
    if (!isWall(this.pos.x, newY)) this.pos.y = newY;

    // Friction
    this.velocity = this.velocity.scale(0.85);

    // Shooting
    if (keyIsDown('Space') || keyWasPressed('Space')) {
      this.shoot();
    }

    // Weapon switch
    if (keyWasPressed('Digit1')) gameState.weapon = 'pistol';
    if (keyWasPressed('Digit2')) gameState.weapon = 'rifle';
    if (keyWasPressed('Digit3')) gameState.weapon = 'laser';

    // Interact
    if (keyWasPressed('KeyE')) {
      this.interact();
    }

    // Check item pickups
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const dist = Math.sqrt((item.x - this.pos.x) ** 2 + (item.y - this.pos.y) ** 2);
      if (dist < 0.8) {
        this.pickupItem(item);
        items.splice(i, 1);
      }
    }

    // Energy drain over time
    gameState.energy = Math.max(0, gameState.energy - 0.005);

    // Check death
    if (gameState.health <= 0) {
      gameState.isDead = true;
    }
  }

  shoot() {
    if (this.fireCooldown.active()) return;
    if (gameState.ammo <= 0) return;

    const weapon = WEAPONS[gameState.weapon];
    gameState.ammo = Math.max(0, gameState.ammo - weapon.ammoUse);

    this.fireCooldown.set(weapon.fireRate);

    // Create bullet
    const spread = (rand() - 0.5) * weapon.spread;
    const angle = this.facing + spread;
    const dir = vec2(Math.cos(angle), Math.sin(angle));

    bullets.push({
      pos: this.pos.add(dir.scale(0.5)),
      velocity: dir.scale(0.5),
      damage: weapon.damage,
      life: 60
    });

    // Muzzle flash
    spawnParticles(this.pos.add(dir.scale(0.7)), new Color(1, 0.8, 0.3), 3);
  }

  interact() {
    const tile = getTile(this.pos.x, this.pos.y);

    if (tile === DOOR) {
      // Next level
      if (enemies.length === 0) {
        gameState.level++;
        if (gameState.level > 5) {
          gameState.hasWon = true;
        } else {
          generateRoom();
          this.pos = vec2(2, 2);
        }
      }
    } else if (tile === MEDICAL) {
      if (gameState.energy >= 20) {
        gameState.energy -= 20;
        gameState.health = Math.min(gameState.maxHealth, gameState.health + 50);
        spawnParticles(this.pos, new Color(0.2, 1, 0.4), 8);
      }
    } else if (tile === RECHARGE) {
      gameState.energy = gameState.maxEnergy;
      spawnParticles(this.pos, new Color(0.4, 0.8, 1), 8);
    } else if (tile === TERMINAL) {
      // Show map info (future feature)
      spawnParticles(this.pos, new Color(0, 1, 0), 5);
    }
  }

  pickupItem(item) {
    switch (item.type) {
      case 'ammo':
        gameState.ammo = Math.min(gameState.maxAmmo, gameState.ammo + 20);
        break;
      case 'health':
        gameState.health = Math.min(gameState.maxHealth, gameState.health + 25);
        break;
      case 'energy':
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 30);
        break;
    }
    spawnParticles(vec2(item.x, item.y), new Color(0, 1, 0.5), 5);
  }

  takeDamage(amount) {
    gameState.health -= amount;
    spawnParticles(this.pos, new Color(1, 0, 0), 10);
  }

  render() {
    // Body - cyberpunk style
    drawRect(this.pos, vec2(0.7, 0.7), new Color(0.2, 0.4, 0.6));
    // Armor highlights
    drawRect(this.pos.add(vec2(-0.15, 0.1)), vec2(0.15, 0.4), new Color(0.3, 0.6, 0.8));
    drawRect(this.pos.add(vec2(0.15, 0.1)), vec2(0.15, 0.4), new Color(0.3, 0.6, 0.8));

    // Visor
    const dir = vec2(Math.cos(this.facing), Math.sin(this.facing));
    const visorPos = this.pos.add(dir.scale(0.2));
    drawRect(visorPos, vec2(0.25, 0.1), new Color(0.2, 0.8, 1));

    // Weapon
    const weaponPos = this.pos.add(dir.scale(0.5));
    drawRect(weaponPos, vec2(0.3, 0.15), new Color(0.4, 0.4, 0.5));
  }
}

// Enemy class
class Enemy {
  constructor(pos, type) {
    this.pos = pos.copy();
    this.type = type;
    this.velocity = vec2(0, 0);
    this.attackCooldown = new Timer();
    this.state = 'patrol';
    this.patrolDir = rand(0, Math.PI * 2);
    this.patrolTimer = new Timer();
    this.patrolTimer.set(rand(1, 3));

    // Stats by type
    if (type === 'mutant') {
      this.hp = 40;
      this.maxHp = 40;
      this.damage = 15;
      this.speed = 0.04;
      this.detectionRange = 8;
      this.color = new Color(0.5, 0.8, 0.3);
    } else if (type === 'cyborg') {
      this.hp = 60;
      this.maxHp = 60;
      this.damage = 20;
      this.speed = 0.05;
      this.detectionRange = 10;
      this.color = new Color(0.6, 0.4, 0.6);
    } else if (type === 'bot') {
      this.hp = 80;
      this.maxHp = 80;
      this.damage = 25;
      this.speed = 0.03;
      this.detectionRange = 12;
      this.color = new Color(0.7, 0.3, 0.3);
    }
  }

  update() {
    if (this.hp <= 0) return;

    const distToPlayer = this.pos.distance(player.pos);

    // State transitions
    if (distToPlayer < this.detectionRange) {
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
    const newX = this.pos.x + this.velocity.x;
    const newY = this.pos.y + this.velocity.y;
    if (!isWall(newX, this.pos.y)) this.pos.x = newX;
    if (!isWall(this.pos.x, newY)) this.pos.y = newY;
  }

  attack() {
    this.attackCooldown.set(1.5);
    player.takeDamage(this.damage);
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      gameState.kills++;
      gameState.score += this.maxHp * 10;
      spawnParticles(this.pos, this.color, 15);
    } else {
      spawnParticles(this.pos, new Color(1, 0, 0), 5);
    }
  }

  render() {
    if (this.hp <= 0) return;

    // Enemy body
    drawRect(this.pos, vec2(0.6, 0.6), this.color);
    // Darker details
    drawRect(this.pos.add(vec2(-0.1, 0)), vec2(0.15, 0.4), this.color.scale(0.7, 1));
    drawRect(this.pos.add(vec2(0.1, 0)), vec2(0.15, 0.4), this.color.scale(0.7, 1));

    // Eyes (glow when chasing)
    const eyeColor = this.state === 'chase' ? new Color(1, 0, 0) : new Color(0.8, 0.8, 0);
    drawRect(this.pos.add(vec2(-0.12, 0.15)), vec2(0.08, 0.08), eyeColor);
    drawRect(this.pos.add(vec2(0.12, 0.15)), vec2(0.08, 0.08), eyeColor);

    // Health bar
    const hpPct = this.hp / this.maxHp;
    drawRect(this.pos.add(vec2(0, 0.5)), vec2(0.6, 0.08), new Color(0.2, 0.2, 0.2));
    drawRect(this.pos.add(vec2((hpPct - 1) * 0.3, 0.5)), vec2(hpPct * 0.6, 0.08), new Color(1, 0.2, 0.2));
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
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function renderParticles() {
  for (const p of particles) {
    const c = p.color.copy();
    c.a = p.life;
    drawRect(p.pos, vec2(p.life * 0.15, p.life * 0.15), c);
  }
}

// Bullet system
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.pos = b.pos.add(b.velocity);
    b.life--;

    // Wall collision
    if (isWall(b.pos.x, b.pos.y)) {
      spawnParticles(b.pos, new Color(1, 0.8, 0.3), 3);
      bullets.splice(i, 1);
      continue;
    }

    // Enemy collision
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const dist = b.pos.distance(enemy.pos);
      if (dist < 0.5) {
        enemy.takeDamage(b.damage);
        bullets.splice(i, 1);
        break;
      }
    }

    if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }
}

function renderBullets() {
  for (const b of bullets) {
    drawRect(b.pos, vec2(0.2, 0.2), new Color(1, 0.8, 0.3));
    // Trail
    drawRect(b.pos.subtract(b.velocity.scale(0.5)), vec2(0.15, 0.15), new Color(1, 0.6, 0.2, 0.5));
  }
}

// Screen to world conversion
function screenToWorld(screenPos) {
  const canvas = mainCanvasSize;
  const scale = 32;
  return vec2(
    (screenPos.x - canvas.x / 2) / scale + ROOM_WIDTH / 2,
    -(screenPos.y - canvas.y / 2) / scale + ROOM_HEIGHT / 2
  );
}

// Render room
function renderRoom() {
  for (let y = 0; y < ROOM_HEIGHT; y++) {
    for (let x = 0; x < ROOM_WIDTH; x++) {
      const tile = room[y][x];
      const pos = vec2(x + 0.5, y + 0.5);

      if (tile === EMPTY) {
        // Cyberpunk floor
        drawRect(pos, vec2(1, 1), new Color(0.08, 0.1, 0.15));
        if ((x + y) % 3 === 0) {
          drawRect(pos, vec2(0.9, 0.9), new Color(0.06, 0.08, 0.12));
        }
      } else if (tile === WALL) {
        // Metallic wall
        drawRect(pos, vec2(1, 1), new Color(0.25, 0.3, 0.35));
        drawRect(pos.add(vec2(0, 0.3)), vec2(0.9, 0.15), new Color(0.35, 0.4, 0.45));
        drawRect(pos.add(vec2(0, -0.3)), vec2(0.9, 0.1), new Color(0.15, 0.2, 0.25));
      } else if (tile === DOOR) {
        // Door
        const locked = enemies.length > 0;
        const doorColor = locked ? new Color(0.6, 0.2, 0.2) : new Color(0.2, 0.6, 0.3);
        drawRect(pos, vec2(0.3, 0.9), doorColor);
        // Frame
        drawRect(pos.add(vec2(-0.4, 0)), vec2(0.1, 1), new Color(0.4, 0.4, 0.4));
        drawRect(pos.add(vec2(0.4, 0)), vec2(0.1, 1), new Color(0.4, 0.4, 0.4));
      } else if (tile === MEDICAL) {
        // Medical station
        drawRect(pos, vec2(1, 1), new Color(0.08, 0.1, 0.15));
        drawRect(pos, vec2(0.7, 0.7), new Color(0.8, 0.2, 0.2));
        drawRect(pos.add(vec2(0, 0)), vec2(0.2, 0.5), new Color(1, 1, 1));
        drawRect(pos.add(vec2(0, 0)), vec2(0.5, 0.15), new Color(1, 1, 1));
      } else if (tile === RECHARGE) {
        // Energy recharge
        drawRect(pos, vec2(1, 1), new Color(0.08, 0.1, 0.15));
        drawRect(pos, vec2(0.7, 0.7), new Color(0.2, 0.4, 0.8));
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        drawRect(pos, vec2(0.4, 0.4), new Color(0.4, 0.8, 1, pulse));
      } else if (tile === TERMINAL) {
        // Computer terminal
        drawRect(pos, vec2(1, 1), new Color(0.08, 0.1, 0.15));
        drawRect(pos, vec2(0.6, 0.5), new Color(0.15, 0.15, 0.2));
        const screenFlicker = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
        drawRect(pos.add(vec2(0, 0.05)), vec2(0.5, 0.35), new Color(0, screenFlicker * 0.8, 0));
      }
    }
  }

  // Render items
  for (const item of items) {
    const pos = vec2(item.x + 0.5, item.y + 0.5);
    let color;
    switch (item.type) {
      case 'ammo': color = new Color(0.8, 0.6, 0.2); break;
      case 'health': color = new Color(1, 0.3, 0.3); break;
      case 'energy': color = new Color(0.3, 0.6, 1); break;
    }
    drawRect(pos, vec2(0.4, 0.4), color);
    const glow = Math.sin(Date.now() * 0.01) * 0.2 + 0.3;
    drawRect(pos, vec2(0.5, 0.5), color.scale(1, glow));
  }
}

// Render HUD
function renderHUD() {
  const sw = mainCanvasSize.x;
  const sh = mainCanvasSize.y;

  // Top bar
  drawRect(vec2(sw / 64, 0.7), vec2(sw / 32, 1.5), new Color(0, 0, 0, 0.7), 0, true, true);

  drawTextScreen(`LEVEL ${gameState.level}`, vec2(20, 25), 16, new Color(0, 0.8, 0));
  drawTextScreen(`SCORE: ${gameState.score}`, vec2(150, 25), 14, new Color(0.8, 0.8, 0.2));
  drawTextScreen(`KILLS: ${gameState.kills}`, vec2(300, 25), 14, new Color(1, 0.4, 0.4));
  drawTextScreen(`ENEMIES: ${enemies.filter(e => e.hp > 0).length}`, vec2(440, 25), 14, new Color(0.8, 0.4, 0.8));

  // Bottom bar
  drawRect(vec2(sw / 64, (sh - 25) / 32), vec2(sw / 32, 1.5), new Color(0, 0, 0, 0.7), 0, true, true);

  // Health bar
  const hpPct = gameState.health / gameState.maxHealth;
  drawTextScreen('HP', vec2(20, sh - 30), 14, new Color(1, 0.4, 0.4));
  drawRect(vec2(80 / 32, (sh - 30) / 32), vec2(100 / 32, 0.4), new Color(0.2, 0.2, 0.2), 0, true, true);
  drawRect(vec2((30 + hpPct * 50) / 32, (sh - 30) / 32), vec2(hpPct * 100 / 32, 0.4), new Color(1, 0.3, 0.3), 0, true, true);

  // Energy bar
  const energyPct = gameState.energy / gameState.maxEnergy;
  drawTextScreen('EN', vec2(200, sh - 30), 14, new Color(0.3, 0.6, 1));
  drawRect(vec2(260 / 32, (sh - 30) / 32), vec2(100 / 32, 0.4), new Color(0.2, 0.2, 0.2), 0, true, true);
  drawRect(vec2((210 + energyPct * 50) / 32, (sh - 30) / 32), vec2(energyPct * 100 / 32, 0.4), new Color(0.3, 0.6, 1), 0, true, true);

  // Ammo
  drawTextScreen(`AMMO: ${gameState.ammo}/${gameState.maxAmmo}`, vec2(380, sh - 30), 14, new Color(0.8, 0.8, 0.3));

  // Weapon
  drawTextScreen(`[${gameState.weapon.toUpperCase()}]`, vec2(550, sh - 30), 14, new Color(0, 1, 0));

  // Instructions
  if (gameState.level === 1 && enemies.length > 0) {
    drawTextScreen('[WASD] Move  [SPACE] Shoot  [E] Interact  [1-3] Weapons', vec2(sw / 2 - 200, sh - 60), 12, new Color(0.5, 0.5, 0.5));
  }

  // Door status
  if (enemies.length === 0) {
    drawTextScreen('DOOR UNLOCKED - Press E at exit', vec2(sw / 2 - 120, 50), 14, new Color(0, 1, 0));
  }

  // Death screen
  if (gameState.isDead) {
    drawRect(vec2(sw / 64, sh / 64), vec2(sw / 32, sh / 32), new Color(0, 0, 0, 0.85), 0, true, true);
    drawTextScreen('SYSTEM FAILURE', vec2(sw / 2 - 80, sh / 2 - 40), 28, new Color(1, 0.2, 0.2));
    drawTextScreen(`Score: ${gameState.score}  Kills: ${gameState.kills}`, vec2(sw / 2 - 90, sh / 2 + 10), 16, new Color(0.8, 0.8, 0.8));
    drawTextScreen('Press R to restart', vec2(sw / 2 - 70, sh / 2 + 50), 14, new Color(0.5, 0.5, 0.5));
  }

  // Victory screen
  if (gameState.hasWon) {
    drawRect(vec2(sw / 64, sh / 64), vec2(sw / 32, sh / 32), new Color(0, 0.1, 0, 0.85), 0, true, true);
    drawTextScreen('CITADEL CLEARED', vec2(sw / 2 - 90, sh / 2 - 40), 28, new Color(0.2, 1, 0.4));
    drawTextScreen(`Final Score: ${gameState.score}`, vec2(sw / 2 - 70, sh / 2 + 10), 16, new Color(0.8, 0.8, 0.8));
    drawTextScreen('Press R to play again', vec2(sw / 2 - 80, sh / 2 + 50), 14, new Color(0.5, 0.5, 0.5));
  }
}

// Engine callbacks
function gameInit() {
  initGameState();
  player = new Player(vec2(2, 2));
  generateRoom();
  setCameraScale(32);
  setCameraPos(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));
}

function gameUpdate() {
  // Restart
  if ((gameState.isDead || gameState.hasWon) && keyWasPressed('KeyR')) {
    initGameState();
    player = new Player(vec2(2, 2));
    generateRoom();
  }

  if (!gameState.isDead && !gameState.hasWon) {
    player.update();
    for (const enemy of enemies) {
      enemy.update();
    }
    enemies = enemies.filter(e => e.hp > 0);
    updateBullets();
  }

  updateParticles();
}

function gameUpdatePost() {}

function gameRender() {
  renderRoom();
  renderBullets();
  for (const enemy of enemies) {
    enemy.render();
  }
  player.render();
  renderParticles();
}

function gameRenderPost() {
  renderHUD();
}

// Start engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

console.log('System Shock 2D (LittleJS) loaded');
