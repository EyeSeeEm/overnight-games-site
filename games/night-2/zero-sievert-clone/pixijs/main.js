// Zero Sievert Clone - Top-Down Extraction Shooter
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Configuration
const CONFIG = {
  playerSpeed: 150,
  sprintMultiplier: 1.6,
  bulletSpeed: 500,
  staminaMax: 100,
  staminaDrain: 20,
  staminaRegen: 10,
  bleedDamage: 2,
  extractionTime: 3000,
  mapWidth: 1600,
  mapHeight: 1200
};

// Colors
const COLORS = {
  background: '#1a1a1a',
  floor: '#2d3a2e',
  wall: '#444444',
  player: '#4CAF50',
  enemy: '#f44336',
  mutant: '#9C27B0',
  loot: '#FFD700',
  extraction: '#00BCD4',
  bullet: '#FFEB3B',
  blood: '#8B0000',
  text: '#ffffff',
  health: '#4CAF50',
  stamina: '#2196F3',
  danger: '#f44336'
};

// Weapons
const WEAPONS = {
  pistol: { name: 'Pistol', damage: 18, fireRate: 300, magSize: 8, spread: 8, range: 200 },
  smg: { name: 'SMG', damage: 14, fireRate: 100, magSize: 25, spread: 12, range: 150 },
  shotgun: { name: 'Shotgun', damage: 10, fireRate: 800, magSize: 6, spread: 25, range: 100, pellets: 6 },
  rifle: { name: 'Rifle', damage: 30, fireRate: 150, magSize: 30, spread: 5, range: 300 }
};

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.1;

  switch(type) {
    case 'shoot': osc.frequency.value = 400; osc.type = 'square'; break;
    case 'hit': osc.frequency.value = 150; osc.type = 'sawtooth'; break;
    case 'pickup': osc.frequency.value = 600; osc.type = 'sine'; break;
    case 'extract': osc.frequency.value = 800; osc.type = 'triangle'; break;
    case 'death': osc.frequency.value = 80; osc.type = 'sawtooth'; break;
  }

  osc.start();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.stop(audioCtx.currentTime + 0.1);
}

// Game state
const game = {
  state: 'menu',
  player: null,
  enemies: [],
  bullets: [],
  loot: [],
  walls: [],
  extractionZone: null,
  camera: { x: 0, y: 0 },
  keys: {},
  mouse: { x: 0, y: 0, down: false },
  raid: 1,
  stash: { rubles: 0, items: [] },
  stats: { gamesPlayed: 0, raids: 0, extractions: 0, kills: 0 }
};

// Load stats
try {
  const saved = localStorage.getItem('zeroSievertCloneStats');
  if (saved) game.stats = JSON.parse(saved);
} catch(e) {}

function saveStats() {
  try { localStorage.setItem('zeroSievertCloneStats', JSON.stringify(game.stats)); } catch(e) {}
}

// Player class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.angle = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = CONFIG.staminaMax;
    this.bleeding = false;
    this.bleedTimer = 0;
    this.weapon = { ...WEAPONS.pistol };
    this.ammo = this.weapon.magSize;
    this.maxAmmo = this.weapon.magSize;
    this.reloading = false;
    this.reloadTimer = 0;
    this.lastShot = 0;
    this.inventory = [];
    this.rubles = 0;
    this.extracting = false;
    this.extractTimer = 0;
  }

  update(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (game.keys['KeyW'] || game.keys['ArrowUp']) dy -= 1;
    if (game.keys['KeyS'] || game.keys['ArrowDown']) dy += 1;
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) dx -= 1;
    if (game.keys['KeyD'] || game.keys['ArrowRight']) dx += 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    // Sprint
    const isSprinting = game.keys['ShiftLeft'] && this.stamina > 0 && (dx !== 0 || dy !== 0);
    let speed = CONFIG.playerSpeed;

    if (isSprinting) {
      speed *= CONFIG.sprintMultiplier;
      this.stamina = Math.max(0, this.stamina - CONFIG.staminaDrain * dt);
    } else if (dx === 0 && dy === 0) {
      this.stamina = Math.min(CONFIG.staminaMax, this.stamina + CONFIG.staminaRegen * dt);
    }

    // Apply movement
    const newX = this.x + dx * speed * dt;
    const newY = this.y + dy * speed * dt;

    if (!this.checkCollision(newX, this.y)) this.x = newX;
    if (!this.checkCollision(this.x, newY)) this.y = newY;

    // Keep in bounds
    this.x = Math.max(this.width/2, Math.min(CONFIG.mapWidth - this.width/2, this.x));
    this.y = Math.max(this.height/2, Math.min(CONFIG.mapHeight - this.height/2, this.y));

    // Aim at mouse
    const worldMouse = {
      x: game.mouse.x + game.camera.x,
      y: game.mouse.y + game.camera.y
    };
    this.angle = Math.atan2(worldMouse.y - this.y, worldMouse.x - this.x);

    // Shooting
    if (game.mouse.down && !this.reloading && this.ammo > 0) {
      const now = Date.now();
      if (now - this.lastShot >= this.weapon.fireRate) {
        this.shoot();
        this.lastShot = now;
      }
    }

    // Reloading
    if (this.reloading) {
      this.reloadTimer -= dt * 1000;
      if (this.reloadTimer <= 0) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
      }
    }

    // Bleeding
    if (this.bleeding) {
      this.bleedTimer -= dt * 1000;
      this.health -= CONFIG.bleedDamage * dt;
      if (this.bleedTimer <= 0) {
        this.bleeding = false;
      }
    }

    // Extraction
    if (this.extracting) {
      this.extractTimer += dt * 1000;
      if (this.extractTimer >= CONFIG.extractionTime) {
        completeExtraction();
      }
    }

    // Death check
    if (this.health <= 0) {
      game.state = 'gameover';
      playSound('death');
      saveStats();
    }
  }

  checkCollision(x, y) {
    for (const wall of game.walls) {
      if (x + this.width/2 > wall.x && x - this.width/2 < wall.x + wall.width &&
          y + this.height/2 > wall.y && y - this.height/2 < wall.y + wall.height) {
        return true;
      }
    }
    return false;
  }

  shoot() {
    const pellets = this.weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
      const spread = (Math.random() - 0.5) * this.weapon.spread * (Math.PI / 180);
      const angle = this.angle + spread;

      game.bullets.push({
        x: this.x + Math.cos(this.angle) * 20,
        y: this.y + Math.sin(this.angle) * 20,
        vx: Math.cos(angle) * CONFIG.bulletSpeed,
        vy: Math.sin(angle) * CONFIG.bulletSpeed,
        damage: this.weapon.damage,
        range: this.weapon.range,
        traveled: 0,
        isPlayer: true
      });
    }

    this.ammo--;
    playSound('shoot');

    if (this.ammo <= 0) {
      this.reload();
    }
  }

  reload() {
    if (this.reloading || this.ammo === this.maxAmmo) return;
    this.reloading = true;
    this.reloadTimer = 1500;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (Math.random() < 0.3) {
      this.bleeding = true;
      this.bleedTimer = 5000;
    }
    playSound('hit');
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - game.camera.x, this.y - game.camera.y);
    ctx.rotate(this.angle);

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

    // Gun
    ctx.fillStyle = '#333';
    ctx.fillRect(10, -3, 15, 6);

    ctx.restore();

    // Bleeding indicator
    if (this.bleeding) {
      ctx.fillStyle = COLORS.blood;
      ctx.beginPath();
      ctx.arc(this.x - game.camera.x, this.y - game.camera.y + 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.type = type;
    this.angle = 0;
    this.speed = type === 'mutant' ? 100 : 60;
    this.health = type === 'mutant' ? 50 : 80;
    this.maxHealth = this.health;
    this.damage = type === 'mutant' ? 15 : 10;
    this.attackRange = type === 'mutant' ? 30 : 200;
    this.lastAttack = 0;
    this.attackRate = type === 'mutant' ? 1000 : 800;
    this.state = 'patrol';
    this.patrolTarget = { x: x, y: y };
    this.detectionRange = 200;
  }

  update(dt) {
    const player = game.player;
    const dist = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

    // Detection
    if (dist < this.detectionRange) {
      this.state = 'chase';
    }

    // Behavior
    if (this.state === 'chase') {
      // Move toward player
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.angle = angle;

      if (dist > this.attackRange) {
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
      }

      // Attack
      const now = Date.now();
      if (dist < this.attackRange && now - this.lastAttack > this.attackRate) {
        this.attack();
        this.lastAttack = now;
      }
    } else {
      // Patrol
      const patrolDist = Math.sqrt(
        Math.pow(this.patrolTarget.x - this.x, 2) +
        Math.pow(this.patrolTarget.y - this.y, 2)
      );

      if (patrolDist < 10) {
        this.patrolTarget = {
          x: this.x + (Math.random() - 0.5) * 200,
          y: this.y + (Math.random() - 0.5) * 200
        };
      }

      const angle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
      this.x += Math.cos(angle) * this.speed * 0.5 * dt;
      this.y += Math.sin(angle) * this.speed * 0.5 * dt;
    }

    // Keep in bounds
    this.x = Math.max(20, Math.min(CONFIG.mapWidth - 20, this.x));
    this.y = Math.max(20, Math.min(CONFIG.mapHeight - 20, this.y));
  }

  attack() {
    if (this.type === 'mutant') {
      // Melee attack
      game.player.takeDamage(this.damage);
    } else {
      // Ranged attack
      const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
      const spread = (Math.random() - 0.5) * 15 * (Math.PI / 180);

      game.bullets.push({
        x: this.x + Math.cos(angle) * 15,
        y: this.y + Math.sin(angle) * 15,
        vx: Math.cos(angle + spread) * 300,
        vy: Math.sin(angle + spread) * 300,
        damage: this.damage,
        range: 250,
        traveled: 0,
        isPlayer: false
      });
      playSound('shoot');
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    this.state = 'chase';
    playSound('hit');
  }

  draw() {
    ctx.save();
    ctx.translate(this.x - game.camera.x, this.y - game.camera.y);

    ctx.fillStyle = this.type === 'mutant' ? COLORS.mutant : COLORS.enemy;
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);

    // Health bar
    if (this.health < this.maxHealth) {
      ctx.fillStyle = COLORS.danger;
      ctx.fillRect(-15, -18, 30 * (this.health / this.maxHealth), 4);
    }

    ctx.restore();
  }
}

// Loot container
class LootContainer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.opened = false;
    this.contents = this.generateLoot();
  }

  generateLoot() {
    const loot = [];
    const roll = Math.random();

    if (roll < 0.4) {
      loot.push({ type: 'rubles', amount: Math.floor(50 + Math.random() * 150) });
    }
    if (roll < 0.3) {
      loot.push({ type: 'bandage', name: 'Bandage' });
    }
    if (roll < 0.2) {
      loot.push({ type: 'medkit', name: 'Medkit' });
    }
    if (roll < 0.1) {
      const weapons = Object.keys(WEAPONS);
      loot.push({ type: 'weapon', weapon: weapons[Math.floor(Math.random() * weapons.length)] });
    }

    return loot;
  }

  interact() {
    if (this.opened) return;
    this.opened = true;

    this.contents.forEach(item => {
      if (item.type === 'rubles') {
        game.player.rubles += item.amount;
      } else if (item.type === 'weapon') {
        game.player.weapon = { ...WEAPONS[item.weapon] };
        game.player.maxAmmo = game.player.weapon.magSize;
        game.player.ammo = game.player.maxAmmo;
      } else {
        game.player.inventory.push(item);
      }
    });

    playSound('pickup');
  }

  draw() {
    ctx.fillStyle = this.opened ? '#555' : COLORS.loot;
    ctx.fillRect(
      this.x - game.camera.x - this.width/2,
      this.y - game.camera.y - this.height/2,
      this.width,
      this.height
    );

    if (!this.opened) {
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(
        this.x - game.camera.x - this.width/2,
        this.y - game.camera.y - this.height/2,
        this.width,
        this.height
      );
    }
  }
}

// Generate map
function generateMap() {
  game.walls = [];
  game.loot = [];
  game.enemies = [];

  // Border walls
  game.walls.push({ x: 0, y: 0, width: CONFIG.mapWidth, height: 20 });
  game.walls.push({ x: 0, y: CONFIG.mapHeight - 20, width: CONFIG.mapWidth, height: 20 });
  game.walls.push({ x: 0, y: 0, width: 20, height: CONFIG.mapHeight });
  game.walls.push({ x: CONFIG.mapWidth - 20, y: 0, width: 20, height: CONFIG.mapHeight });

  // Random buildings
  for (let i = 0; i < 15; i++) {
    const bx = 100 + Math.random() * (CONFIG.mapWidth - 300);
    const by = 100 + Math.random() * (CONFIG.mapHeight - 300);
    const bw = 60 + Math.random() * 100;
    const bh = 60 + Math.random() * 100;

    game.walls.push({ x: bx, y: by, width: bw, height: 15 });
    game.walls.push({ x: bx, y: by + bh - 15, width: bw, height: 15 });
    game.walls.push({ x: bx, y: by, width: 15, height: bh });
    game.walls.push({ x: bx + bw - 15, y: by, width: 15, height: bh });

    // Loot inside buildings
    if (Math.random() < 0.7) {
      game.loot.push(new LootContainer(bx + bw/2, by + bh/2));
    }
  }

  // Spawn enemies
  const enemyCount = 5 + game.raid * 2;
  for (let i = 0; i < enemyCount; i++) {
    const ex = 200 + Math.random() * (CONFIG.mapWidth - 400);
    const ey = 200 + Math.random() * (CONFIG.mapHeight - 400);
    const type = Math.random() < 0.3 ? 'mutant' : 'bandit';
    game.enemies.push(new Enemy(ex, ey, type));
  }

  // Extra loot
  for (let i = 0; i < 5; i++) {
    const lx = 100 + Math.random() * (CONFIG.mapWidth - 200);
    const ly = 100 + Math.random() * (CONFIG.mapHeight - 200);
    game.loot.push(new LootContainer(lx, ly));
  }

  // Extraction zone (far corner from player)
  game.extractionZone = {
    x: CONFIG.mapWidth - 150,
    y: CONFIG.mapHeight - 150,
    width: 100,
    height: 100
  };
}

// Start raid
function startRaid() {
  game.state = 'playing';
  game.player = new Player(100, 100);
  game.bullets = [];
  game.stats.raids++;
  saveStats();
  generateMap();
}

// Complete extraction
function completeExtraction() {
  game.state = 'extracted';
  game.stash.rubles += game.player.rubles;
  game.stats.extractions++;
  game.raid++;
  playSound('extract');
  saveStats();
}

// Update bullets
function updateBullets(dt) {
  game.bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * dt;

    // Wall collision
    for (const wall of game.walls) {
      if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
          bullet.y > wall.y && bullet.y < wall.y + wall.height) {
        bullet.hit = true;
      }
    }

    // Range limit
    if (bullet.traveled > bullet.range) {
      bullet.hit = true;
    }

    // Player/enemy collision
    if (bullet.isPlayer) {
      game.enemies.forEach(enemy => {
        if (Math.abs(bullet.x - enemy.x) < enemy.width/2 &&
            Math.abs(bullet.y - enemy.y) < enemy.height/2) {
          enemy.takeDamage(bullet.damage);
          bullet.hit = true;
        }
      });
    } else {
      const p = game.player;
      if (Math.abs(bullet.x - p.x) < p.width/2 &&
          Math.abs(bullet.y - p.y) < p.height/2) {
        p.takeDamage(bullet.damage);
        bullet.hit = true;
      }
    }
  });

  game.bullets = game.bullets.filter(b => !b.hit);

  // Remove dead enemies
  game.enemies = game.enemies.filter(e => {
    if (e.health <= 0) {
      game.stats.kills++;
      // Drop loot
      if (Math.random() < 0.5) {
        game.loot.push(new LootContainer(e.x, e.y));
      }
      return false;
    }
    return true;
  });
}

// Update camera
function updateCamera() {
  game.camera.x = game.player.x - canvas.width / 2;
  game.camera.y = game.player.y - canvas.height / 2;
  game.camera.x = Math.max(0, Math.min(CONFIG.mapWidth - canvas.width, game.camera.x));
  game.camera.y = Math.max(0, Math.min(CONFIG.mapHeight - canvas.height, game.camera.y));
}

// Check interactions
function checkInteractions() {
  // Loot
  game.loot.forEach(loot => {
    const dist = Math.sqrt(
      Math.pow(game.player.x - loot.x, 2) +
      Math.pow(game.player.y - loot.y, 2)
    );
    if (dist < 40 && game.keys['KeyE']) {
      loot.interact();
    }
  });

  // Use items
  if (game.keys['Digit1']) {
    const bandage = game.player.inventory.find(i => i.type === 'bandage');
    if (bandage) {
      game.player.bleeding = false;
      game.player.health = Math.min(game.player.maxHealth, game.player.health + 20);
      game.player.inventory = game.player.inventory.filter(i => i !== bandage);
      playSound('pickup');
    }
  }

  if (game.keys['Digit2']) {
    const medkit = game.player.inventory.find(i => i.type === 'medkit');
    if (medkit) {
      game.player.bleeding = false;
      game.player.health = game.player.maxHealth;
      game.player.inventory = game.player.inventory.filter(i => i !== medkit);
      playSound('pickup');
    }
  }

  // Extraction zone
  const ez = game.extractionZone;
  if (game.player.x > ez.x && game.player.x < ez.x + ez.width &&
      game.player.y > ez.y && game.player.y < ez.y + ez.height) {
    game.player.extracting = true;
  } else {
    game.player.extracting = false;
    game.player.extractTimer = 0;
  }
}

// Main update
function update(dt) {
  if (game.state !== 'playing') return;

  game.player.update(dt);
  game.enemies.forEach(e => e.update(dt));
  updateBullets(dt);
  updateCamera();
  checkInteractions();
}

// Draw functions
function drawMap() {
  // Floor
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Walls
  ctx.fillStyle = COLORS.wall;
  game.walls.forEach(wall => {
    ctx.fillRect(
      wall.x - game.camera.x,
      wall.y - game.camera.y,
      wall.width,
      wall.height
    );
  });

  // Extraction zone
  const ez = game.extractionZone;
  ctx.fillStyle = 'rgba(0, 188, 212, 0.3)';
  ctx.fillRect(ez.x - game.camera.x, ez.y - game.camera.y, ez.width, ez.height);
  ctx.strokeStyle = COLORS.extraction;
  ctx.lineWidth = 2;
  ctx.strokeRect(ez.x - game.camera.x, ez.y - game.camera.y, ez.width, ez.height);

  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXTRACT', ez.x - game.camera.x + ez.width/2, ez.y - game.camera.y + ez.height/2);

  // Loot
  game.loot.forEach(l => l.draw());

  // Enemies
  game.enemies.forEach(e => e.draw());

  // Bullets
  ctx.fillStyle = COLORS.bullet;
  game.bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x - game.camera.x, b.y - game.camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Player
  game.player.draw();
}

function drawUI() {
  // Health bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(10, 10, 200, 20);
  ctx.fillStyle = COLORS.health;
  ctx.fillRect(10, 10, 200 * (game.player.health / game.player.maxHealth), 20);
  ctx.strokeStyle = COLORS.text;
  ctx.strokeRect(10, 10, 200, 20);

  ctx.fillStyle = COLORS.text;
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${Math.floor(game.player.health)}`, 15, 25);

  // Stamina bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(10, 35, 150, 15);
  ctx.fillStyle = COLORS.stamina;
  ctx.fillRect(10, 35, 150 * (game.player.stamina / CONFIG.staminaMax), 15);
  ctx.strokeStyle = COLORS.text;
  ctx.strokeRect(10, 35, 150, 15);

  // Weapon info
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  ctx.fillText(`${game.player.weapon.name}`, 10, 70);
  ctx.fillText(`Ammo: ${game.player.ammo}/${game.player.maxAmmo}`, 10, 88);

  if (game.player.reloading) {
    ctx.fillStyle = COLORS.danger;
    ctx.fillText('RELOADING...', 10, 106);
  }

  // Inventory
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Rubles: ${game.player.rubles}`, 10, 130);
  ctx.fillText(`Items: ${game.player.inventory.length}`, 10, 148);

  // Raid info
  ctx.textAlign = 'right';
  ctx.fillText(`Raid #${game.raid}`, canvas.width - 10, 25);
  ctx.fillText(`Kills: ${game.stats.kills}`, canvas.width - 10, 45);

  // Bleeding warning
  if (game.player.bleeding) {
    ctx.fillStyle = COLORS.danger;
    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillText('BLEEDING!', canvas.width/2, 30);
  }

  // Extraction progress
  if (game.player.extracting) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width/2 - 100, canvas.height/2 - 30, 200, 60);
    ctx.fillStyle = COLORS.extraction;
    ctx.fillRect(canvas.width/2 - 90, canvas.height/2 - 10, 180 * (game.player.extractTimer / CONFIG.extractionTime), 20);
    ctx.strokeStyle = COLORS.text;
    ctx.strokeRect(canvas.width/2 - 90, canvas.height/2 - 10, 180, 20);

    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.font = '14px monospace';
    ctx.fillText('EXTRACTING...', canvas.width/2, canvas.height/2 - 35);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('[E] Loot  [R] Reload  [1] Bandage  [2] Medkit  [Shift] Sprint', 10, canvas.height - 10);
}

function drawMenu() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.text;
  ctx.font = '36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ZERO SIEVERT', canvas.width/2, 120);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('Extraction Shooter', canvas.width/2, 155);

  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  const lines = [
    'Press ENTER to Start Raid',
    '',
    'Survive the wasteland, collect loot,',
    'and extract before you die!',
    '',
    'WASD - Move    Mouse - Aim',
    'LMB - Shoot    R - Reload',
    'E - Interact   Shift - Sprint',
    '1/2 - Use Items',
    '',
    'Reach the EXTRACT zone to survive!'
  ];

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width/2, 200 + i * 24);
  });

  ctx.fillStyle = COLORS.loot;
  ctx.font = '12px monospace';
  ctx.fillText(`Stash: ${game.stash.rubles} Rubles | Raids: ${game.stats.raids} | Extractions: ${game.stats.extractions}`, canvas.width/2, 530);
}

function drawGameOver() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.danger;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('YOU DIED', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '18px monospace';
  ctx.fillText('All gear lost!', canvas.width/2, 260);
  ctx.fillText(`Rubles lost: ${game.player?.rubles || 0}`, canvas.width/2, 300);
  ctx.fillText(`Kills: ${game.stats.kills}`, canvas.width/2, 330);

  ctx.fillStyle = COLORS.extraction;
  ctx.fillText('Press ENTER to try again', canvas.width/2, 400);
}

function drawExtracted() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.extraction;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXTRACTED!', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '18px monospace';
  ctx.fillText('Loot secured!', canvas.width/2, 260);
  ctx.fillText(`Rubles gained: ${game.player?.rubles || 0}`, canvas.width/2, 300);
  ctx.fillText(`Total stash: ${game.stash.rubles}`, canvas.width/2, 330);
  ctx.fillText(`Kills: ${game.stats.kills}`, canvas.width/2, 360);

  ctx.fillStyle = COLORS.loot;
  ctx.fillText('Press ENTER for next raid', canvas.width/2, 430);
}

function draw() {
  switch(game.state) {
    case 'menu':
      drawMenu();
      break;
    case 'playing':
      drawMap();
      drawUI();
      break;
    case 'gameover':
      drawGameOver();
      break;
    case 'extracted':
      drawExtracted();
      break;
  }
}

// Input handling
document.addEventListener('keydown', e => {
  game.keys[e.code] = true;

  if (e.code === 'Enter') {
    if (game.state === 'menu' || game.state === 'gameover' || game.state === 'extracted') {
      startRaid();
    }
  }

  if (e.code === 'Escape') {
    if (game.state !== 'menu') {
      game.state = 'menu';
    }
  }

  if (e.code === 'KeyR' && game.state === 'playing') {
    game.player.reload();
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = e.clientX - rect.left;
  game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
  game.mouse.down = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});

canvas.addEventListener('mouseup', () => {
  game.mouse.down = false;
});

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// Expose game for testing
window.game = game;

// Start
requestAnimationFrame(gameLoop);
