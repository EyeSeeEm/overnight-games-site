// Using global LittleJS from CDN

// Game constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;

// Game state
let player;
let bullets = [];
let enemies = [];
let pickups = [];
let doors = [];
let particles = [];
let currentRoom = 0;
let gameTime = 0;
let gameStarted = false;
let gameOver = false;
let victory = false;
let selfDestructTimer = -1;
let shopOpen = false;
let gamePaused = false;

// Player stats
const playerStats = {
  health: 100,
  maxHealth: 100,
  shield: 0,
  maxShield: 0,
  ammo: { pistol: Infinity, shotgun: 24, smg: 120, rifle: 90 },
  maxAmmo: { pistol: Infinity, shotgun: 64, smg: 300, rifle: 180 },
  currentWeapon: 'pistol',
  weapons: ['pistol'],
  keycards: { green: false, blue: false, yellow: false, red: false },
  credits: 0,
  kills: 0
};

// Weapon definitions
const weapons = {
  pistol: { damage: 15, fireRate: 0.25, spread: 3, projectileSpeed: 800, color: new Color(1, 1, 0) },
  shotgun: { damage: 8, pellets: 6, fireRate: 0.8, spread: 25, projectileSpeed: 600, color: new Color(1, 0.5, 0) },
  smg: { damage: 10, fireRate: 0.08, spread: 8, projectileSpeed: 700, color: new Color(0, 1, 0) },
  rifle: { damage: 20, fireRate: 0.16, spread: 5, projectileSpeed: 850, color: new Color(0, 0.5, 1) }
};

// Room definitions
const rooms = [
  // Deck 1 - Cargo Bay (Start)
  {
    id: 0, name: 'CARGO BAY', deck: 1,
    exits: { right: 1 },
    enemies: [
      { type: 'drone', x: 12, y: 8 },
      { type: 'drone', x: 14, y: 10 }
    ],
    pickups: [{ type: 'health', x: 3, y: 3 }],
    hasShop: true
  },
  // Deck 1 - Security Office
  {
    id: 1, name: 'SECURITY', deck: 1,
    exits: { left: 0, right: 2 },
    enemies: [
      { type: 'drone', x: 5, y: 6 },
      { type: 'drone', x: 8, y: 10 },
      { type: 'drone', x: 12, y: 7 },
      { type: 'spitter', x: 15, y: 12 }
    ],
    pickups: [
      { type: 'credits', x: 16, y: 3, amount: 50 },
      { type: 'keycard', x: 10, y: 7, keycardType: 'green' }
    ]
  },
  // Deck 1 - Armory (green keycard required)
  {
    id: 2, name: 'ARMORY', deck: 1,
    exits: { left: 1, down: 3 },
    doorLocks: { left: 'green' },
    enemies: [
      { type: 'drone', x: 10, y: 8 },
      { type: 'spitter', x: 14, y: 6 }
    ],
    pickups: [
      { type: 'weapon', x: 10, y: 10, weaponType: 'shotgun' },
      { type: 'ammo', x: 12, y: 10, ammoType: 'shotgun', amount: 16 }
    ]
  },
  // Deck 2 - Engineering Hub
  {
    id: 3, name: 'ENGINEERING', deck: 2,
    exits: { up: 2, right: 4 },
    enemies: [
      { type: 'drone', x: 6, y: 8 },
      { type: 'drone', x: 8, y: 5 },
      { type: 'lurker', x: 14, y: 10 },
      { type: 'spitter', x: 16, y: 6 }
    ],
    pickups: [
      { type: 'health', x: 3, y: 12 },
      { type: 'credits', x: 17, y: 3, amount: 75 }
    ],
    hasShop: true
  },
  // Deck 2 - Control Room
  {
    id: 4, name: 'CONTROL ROOM', deck: 2,
    exits: { left: 3, down: 5 },
    enemies: [
      { type: 'drone', x: 5, y: 6 },
      { type: 'lurker', x: 10, y: 9 },
      { type: 'brute', x: 15, y: 8 }
    ],
    pickups: [
      { type: 'keycard', x: 10, y: 7, keycardType: 'blue' },
      { type: 'weapon', x: 4, y: 12, weaponType: 'smg' }
    ]
  },
  // Deck 3 - Labs
  {
    id: 5, name: 'RESEARCH LABS', deck: 3,
    exits: { up: 4, right: 6 },
    doorLocks: { up: 'blue' },
    enemies: [
      { type: 'spitter', x: 6, y: 8 },
      { type: 'lurker', x: 10, y: 6 },
      { type: 'brute', x: 14, y: 10 },
      { type: 'drone', x: 16, y: 4 }
    ],
    pickups: [
      { type: 'health', x: 3, y: 3 },
      { type: 'credits', x: 17, y: 13, amount: 100 }
    ],
    hasShop: true
  },
  // Deck 3 - Director's Office (Mini-boss)
  {
    id: 6, name: "DIRECTOR'S OFFICE", deck: 3,
    exits: { left: 5, down: 7 },
    enemies: [
      { type: 'alpha', x: 10, y: 8 } // Mini-boss
    ],
    pickups: [
      { type: 'keycard', x: 10, y: 8, keycardType: 'yellow', afterBoss: true },
      { type: 'weapon', x: 16, y: 4, weaponType: 'rifle' }
    ]
  },
  // Deck 4 - Command
  {
    id: 7, name: 'COMMAND CENTER', deck: 4,
    exits: { up: 6, right: 8 },
    doorLocks: { up: 'yellow' },
    enemies: [
      { type: 'drone', x: 5, y: 6 },
      { type: 'drone', x: 8, y: 10 },
      { type: 'lurker', x: 12, y: 5 },
      { type: 'brute', x: 15, y: 9 },
      { type: 'spitter', x: 17, y: 12 }
    ],
    pickups: [
      { type: 'health', x: 3, y: 3 },
      { type: 'ammo', x: 17, y: 3, ammoType: 'rifle', amount: 30 }
    ],
    hasShop: true,
    triggersSelfDestruct: true
  },
  // Deck 4 - Queen's Lair (Final Boss)
  {
    id: 8, name: "QUEEN'S LAIR", deck: 4,
    exits: { left: 7, right: 9 },
    enemies: [
      { type: 'queen', x: 10, y: 8 } // Final Boss
    ],
    pickups: []
  },
  // Escape Pod Bay (Victory)
  {
    id: 9, name: 'ESCAPE POD', deck: 4,
    exits: { left: 8 },
    enemies: [],
    pickups: [{ type: 'escapePod', x: 10, y: 8 }]
  }
];

// Enemy type definitions
const enemyTypes = {
  drone: { hp: 20, damage: 10, speed: 120, color: new Color(0.5, 0.8, 0.3), size: 0.7, credits: 5, behavior: 'chase' },
  spitter: { hp: 30, damage: 15, speed: 80, color: new Color(0.3, 0.8, 0.5), size: 0.8, credits: 10, behavior: 'ranged', range: 300 },
  lurker: { hp: 40, damage: 20, speed: 200, color: new Color(0.6, 0.4, 0.8), size: 0.7, credits: 15, behavior: 'ambush' },
  brute: { hp: 100, damage: 30, speed: 60, color: new Color(0.8, 0.3, 0.3), size: 1.2, credits: 30, behavior: 'charge' },
  alpha: { hp: 200, damage: 25, speed: 100, color: new Color(1, 0, 0.5), size: 1.5, credits: 100, behavior: 'boss' },
  queen: { hp: 500, damage: 40, speed: 80, color: new Color(1, 0, 0), size: 2.5, credits: 500, behavior: 'boss' }
};

// Player class
class Player extends EngineObject {
  constructor(pos) {
    super(pos, vec2(0.8, 0.8));
    this.color = new Color(0.2, 0.6, 1);
    this.angle = 0;
    this.fireTimer = new Timer();
    this.invincibleTimer = new Timer();
    this.speed = 180;
  }

  update() {
    if (gameOver || gamePaused || shopOpen) return;

    // Movement
    let moveDir = vec2(0, 0);
    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveDir.y += 1;
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveDir.y -= 1;
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveDir.x -= 1;
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveDir.x += 1;

    if (moveDir.length() > 0) {
      moveDir = moveDir.normalize();
      const newPos = this.pos.add(moveDir.scale(this.speed / 60));
      // Collision with room bounds
      const margin = 1;
      this.pos.x = clamp(newPos.x, margin, ROOM_WIDTH - margin);
      this.pos.y = clamp(newPos.y, margin + 2, ROOM_HEIGHT - margin);
    }

    // Aim at mouse
    const worldMouse = mousePos;
    const toMouse = worldMouse.subtract(this.pos);
    this.angle = Math.atan2(toMouse.y, toMouse.x);

    // Shooting
    const weapon = weapons[playerStats.currentWeapon];
    if (mouseWasPressed(0) || (keyIsDown('Space') && this.fireTimer.elapsed())) {
      if (playerStats.ammo[playerStats.currentWeapon] > 0 || playerStats.currentWeapon === 'pistol') {
        this.fireTimer.set(weapon.fireRate);
        this.shoot();
      }
    }

    // Continuous fire for automatic weapons
    if (keyIsDown('Space') && (playerStats.currentWeapon === 'smg' || playerStats.currentWeapon === 'rifle')) {
      if (this.fireTimer.elapsed() && (playerStats.ammo[playerStats.currentWeapon] > 0 || playerStats.currentWeapon === 'pistol')) {
        this.fireTimer.set(weapon.fireRate);
        this.shoot();
      }
    }

    // Weapon switching
    if (keyWasPressed('KeyQ')) {
      const idx = playerStats.weapons.indexOf(playerStats.currentWeapon);
      playerStats.currentWeapon = playerStats.weapons[(idx + 1) % playerStats.weapons.length];
    }

    // Use medkit (H key)
    if (keyWasPressed('KeyH') && playerStats.health < playerStats.maxHealth) {
      playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 25);
    }

    // Check door interactions
    this.checkDoors();
    this.checkPickups();
  }

  shoot() {
    const weapon = weapons[playerStats.currentWeapon];
    if (playerStats.currentWeapon !== 'pistol') {
      playerStats.ammo[playerStats.currentWeapon]--;
    }

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const spreadRad = (weapon.spread * PI / 180) * (rand(-1, 1));
      const bulletAngle = this.angle + spreadRad;
      const dir = vec2(Math.cos(bulletAngle), Math.sin(bulletAngle));
      const bullet = new Bullet(
        this.pos.add(dir.scale(0.5)),
        dir,
        weapon.damage,
        weapon.projectileSpeed,
        weapon.color,
        true
      );
      bullets.push(bullet);
    }

    // Screen shake effect
    spawnParticles(this.pos.add(vec2(Math.cos(this.angle), Math.sin(this.angle)).scale(0.5)), weapon.color, 3);
  }

  takeDamage(amount) {
    if (!this.invincibleTimer.elapsed()) return;

    // Shield absorbs damage first
    if (playerStats.shield > 0) {
      const shieldDamage = Math.min(playerStats.shield, amount);
      playerStats.shield -= shieldDamage;
      amount -= shieldDamage;
    }

    playerStats.health -= amount;
    this.invincibleTimer.set(0.5);
    spawnParticles(this.pos, new Color(1, 0, 0), 10);

    if (playerStats.health <= 0) {
      gameOver = true;
    }
  }

  checkDoors() {
    const room = rooms[currentRoom];
    // Check exits
    for (const [dir, targetRoom] of Object.entries(room.exits)) {
      let doorPos;
      let playerNear = false;

      if (dir === 'left' && this.pos.x < 2) {
        doorPos = vec2(0.5, ROOM_HEIGHT / 2);
        playerNear = true;
      } else if (dir === 'right' && this.pos.x > ROOM_WIDTH - 2) {
        doorPos = vec2(ROOM_WIDTH - 0.5, ROOM_HEIGHT / 2);
        playerNear = true;
      } else if (dir === 'up' && this.pos.y > ROOM_HEIGHT - 3) {
        doorPos = vec2(ROOM_WIDTH / 2, ROOM_HEIGHT - 0.5);
        playerNear = true;
      } else if (dir === 'down' && this.pos.y < 3) {
        doorPos = vec2(ROOM_WIDTH / 2, 0.5);
        playerNear = true;
      }

      if (playerNear && keyWasPressed('KeyE')) {
        // Check keycard requirement
        const requiredKey = room.doorLocks?.[dir];
        if (requiredKey && !playerStats.keycards[requiredKey]) {
          // Door is locked
          spawnTextParticle(this.pos, `NEED ${requiredKey.toUpperCase()} KEYCARD`);
          return;
        }
        // Check target room's lock for this direction
        const targetRoomData = rooms[targetRoom];
        const reverseDir = { left: 'right', right: 'left', up: 'down', down: 'up' }[dir];
        const targetLock = targetRoomData.doorLocks?.[reverseDir];
        if (targetLock && !playerStats.keycards[targetLock]) {
          spawnTextParticle(this.pos, `NEED ${targetLock.toUpperCase()} KEYCARD`);
          return;
        }

        loadRoom(targetRoom);
      }
    }
  }

  checkPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      if (pickup.collected) continue;

      const dist = this.pos.subtract(pickup.pos).length();
      if (dist < 1) {
        pickup.collect();
      }
    }
  }

  render() {
    // Body
    const flashColor = this.invincibleTimer.elapsed() ? this.color : new Color(1, 1, 1);
    drawRect(this.pos, vec2(0.8, 0.8), flashColor);

    // Direction indicator (gun)
    const gunDir = vec2(Math.cos(this.angle), Math.sin(this.angle));
    const gunEnd = this.pos.add(gunDir.scale(0.6));
    drawLine(this.pos, gunEnd, 0.15, new Color(0.3, 0.3, 0.3));
  }
}

// Bullet class
class Bullet extends EngineObject {
  constructor(pos, dir, damage, speed, color, isPlayer) {
    super(pos, vec2(0.2, 0.2));
    this.dir = dir;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.isPlayer = isPlayer;
    this.lifetime = new Timer(2);
  }

  update() {
    if (gameOver || gamePaused) return;

    this.pos = this.pos.add(this.dir.scale(this.speed / 60));

    // Check bounds
    if (this.pos.x < 0 || this.pos.x > ROOM_WIDTH ||
        this.pos.y < 0 || this.pos.y > ROOM_HEIGHT ||
        this.lifetime.elapsed()) {
      this.destroy();
      return;
    }

    // Collision check
    if (this.isPlayer) {
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (isOverlapping(this.pos, this.size, enemy.pos, enemy.size)) {
          enemy.takeDamage(this.damage);
          spawnParticles(this.pos, new Color(0, 1, 0), 5);
          this.destroy();
          return;
        }
      }
    } else {
      if (player && isOverlapping(this.pos, this.size, player.pos, player.size)) {
        player.takeDamage(this.damage);
        this.destroy();
        return;
      }
    }
  }

  destroy() {
    const idx = bullets.indexOf(this);
    if (idx >= 0) bullets.splice(idx, 1);
  }

  render() {
    drawRect(this.pos, this.size, this.color);
  }
}

// Enemy class
class Enemy extends EngineObject {
  constructor(pos, type) {
    const def = enemyTypes[type];
    super(pos, vec2(def.size, def.size));
    this.type = type;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.damage = def.damage;
    this.speed = def.speed;
    this.color = def.color;
    this.credits = def.credits;
    this.behavior = def.behavior;
    this.dead = false;
    this.attackTimer = new Timer();
    this.shootTimer = new Timer();
    this.chargeTimer = new Timer();
    this.isCharging = false;
    this.chargeDir = vec2(0, 0);
    this.activated = false;
    this.phase = 1; // For boss phases
  }

  update() {
    if (this.dead || gameOver || gamePaused) return;
    if (!player) return;

    const toPlayer = player.pos.subtract(this.pos);
    const dist = toPlayer.length();
    const dir = dist > 0 ? toPlayer.normalize() : vec2(0, 0);

    // Activation distance
    if (!this.activated && dist < 8) {
      this.activated = true;
    }
    if (!this.activated) return;

    // Behavior based on type
    switch (this.behavior) {
      case 'chase':
        this.chasePlayer(dir, dist);
        break;
      case 'ranged':
        this.rangedAttack(dir, dist);
        break;
      case 'ambush':
        this.ambushAttack(dir, dist);
        break;
      case 'charge':
        this.chargeAttack(dir, dist);
        break;
      case 'boss':
        this.bossAttack(dir, dist);
        break;
    }
  }

  chasePlayer(dir, dist) {
    if (dist > 0.8) {
      this.pos = this.pos.add(dir.scale(this.speed / 60));
    }
    // Melee attack
    if (dist < 1 && this.attackTimer.elapsed()) {
      player.takeDamage(this.damage);
      this.attackTimer.set(1);
    }
  }

  rangedAttack(dir, dist) {
    const preferredDist = 5;
    if (dist > preferredDist + 1) {
      this.pos = this.pos.add(dir.scale(this.speed / 60));
    } else if (dist < preferredDist - 1) {
      this.pos = this.pos.subtract(dir.scale(this.speed / 60));
    }

    // Shoot
    if (this.shootTimer.elapsed() && dist < 10) {
      this.shootTimer.set(2);
      const bullet = new Bullet(
        this.pos.add(dir.scale(0.5)),
        dir,
        this.damage,
        300,
        new Color(0, 1, 0.5),
        false
      );
      bullets.push(bullet);
    }
  }

  ambushAttack(dir, dist) {
    if (dist < 3) {
      // Lunge!
      this.pos = this.pos.add(dir.scale(this.speed * 1.5 / 60));
    } else if (dist < 6) {
      this.pos = this.pos.add(dir.scale(this.speed / 60));
    }

    if (dist < 1 && this.attackTimer.elapsed()) {
      player.takeDamage(this.damage);
      this.attackTimer.set(0.8);
    }
  }

  chargeAttack(dir, dist) {
    if (this.isCharging) {
      this.pos = this.pos.add(this.chargeDir.scale(250 / 60));
      if (this.chargeTimer.elapsed()) {
        this.isCharging = false;
        this.attackTimer.set(1.5);
      }
      // Check collision during charge
      if (player && isOverlapping(this.pos, this.size, player.pos, player.size)) {
        player.takeDamage(this.damage);
        this.isCharging = false;
      }
    } else if (dist < 5 && this.attackTimer.elapsed()) {
      // Start charging
      this.isCharging = true;
      this.chargeDir = dir;
      this.chargeTimer.set(1);
    } else if (dist > 2) {
      this.pos = this.pos.add(dir.scale(this.speed / 60));
    }
  }

  bossAttack(dir, dist) {
    // Update phase based on HP
    if (this.hp < this.maxHp * 0.3) this.phase = 3;
    else if (this.hp < this.maxHp * 0.7) this.phase = 2;

    // Chase player
    if (dist > 2) {
      this.pos = this.pos.add(dir.scale(this.speed / 60));
    }

    // Melee attack
    if (dist < 2 && this.attackTimer.elapsed()) {
      player.takeDamage(this.damage);
      this.attackTimer.set(1.5 / this.phase);
    }

    // Ranged acid attack (phases 2+)
    if (this.phase >= 2 && this.shootTimer.elapsed()) {
      this.shootTimer.set(3 / this.phase);
      for (let i = 0; i < this.phase + 1; i++) {
        const spreadAngle = (i - this.phase / 2) * 0.3;
        const shootDir = vec2(
          Math.cos(Math.atan2(dir.y, dir.x) + spreadAngle),
          Math.sin(Math.atan2(dir.y, dir.x) + spreadAngle)
        );
        const bullet = new Bullet(
          this.pos.add(shootDir.scale(1)),
          shootDir,
          15,
          250,
          new Color(0.5, 1, 0),
          false
        );
        bullets.push(bullet);
      }
    }

    // Spawn minions (queen only, phase 3)
    if (this.type === 'queen' && this.phase === 3 && enemies.length < 8) {
      if (!this.spawnTimer || this.spawnTimer.elapsed()) {
        if (!this.spawnTimer) this.spawnTimer = new Timer();
        this.spawnTimer.set(5);
        const spawnPos = this.pos.add(vec2(rand(-3, 3), rand(-3, 3)));
        if (spawnPos.x > 1 && spawnPos.x < ROOM_WIDTH - 1 && spawnPos.y > 1 && spawnPos.y < ROOM_HEIGHT - 1) {
          enemies.push(new Enemy(spawnPos, 'drone'));
        }
      }
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    playerStats.credits += this.credits;
    playerStats.kills++;
    spawnParticles(this.pos, new Color(0, 1, 0), 15);

    // Drop pickups
    if (rand() < 0.3) {
      pickups.push(new Pickup(this.pos, 'health'));
    }
    if (rand() < 0.2 && playerStats.weapons.length > 1) {
      const ammoTypes = ['shotgun', 'smg', 'rifle'];
      const type = ammoTypes[randInt(ammoTypes.length)];
      if (playerStats.weapons.includes(type)) {
        pickups.push(new Pickup(this.pos.add(vec2(rand(-1, 1), rand(-1, 1))), 'ammo', type, 10));
      }
    }

    // Boss-specific drops
    if (this.type === 'alpha') {
      // Yellow keycard drops from alpha
      const room = rooms[currentRoom];
      for (const pickup of room.pickups) {
        if (pickup.afterBoss && pickup.type === 'keycard') {
          pickups.push(new Pickup(this.pos, 'keycard', pickup.keycardType));
        }
      }
    }
  }

  render() {
    if (this.dead) return;

    // Body
    const hurtFlash = this.hp < this.maxHp ? new Color(1, 0.5, 0.5).lerp(this.color, this.hp / this.maxHp) : this.color;
    drawRect(this.pos, this.size, hurtFlash);

    // HP bar for bosses
    if (this.type === 'alpha' || this.type === 'queen') {
      const barWidth = 3;
      const barHeight = 0.2;
      const barPos = this.pos.add(vec2(0, this.size.y / 2 + 0.3));
      drawRect(barPos, vec2(barWidth, barHeight), new Color(0.3, 0, 0));
      drawRect(barPos.subtract(vec2(barWidth * (1 - this.hp / this.maxHp) / 2, 0)),
               vec2(barWidth * this.hp / this.maxHp, barHeight), new Color(1, 0, 0));
    }
  }
}

// Pickup class
class Pickup extends EngineObject {
  constructor(pos, type, subType, amount) {
    super(pos, vec2(0.5, 0.5));
    this.type = type;
    this.subType = subType;
    this.amount = amount || 25;
    this.collected = false;
    this.bobTimer = new Timer();

    // Color based on type
    switch (type) {
      case 'health': this.color = new Color(1, 0, 0); break;
      case 'ammo': this.color = new Color(1, 1, 0); break;
      case 'credits': this.color = new Color(1, 0.8, 0); break;
      case 'keycard':
        const colors = { green: new Color(0, 1, 0), blue: new Color(0, 0.5, 1), yellow: new Color(1, 1, 0), red: new Color(1, 0, 0) };
        this.color = colors[subType] || new Color(1, 1, 1);
        break;
      case 'weapon': this.color = new Color(0.5, 0.5, 1); break;
      case 'escapePod': this.color = new Color(1, 1, 1); break;
      default: this.color = new Color(1, 1, 1);
    }
  }

  collect() {
    if (this.collected) return;

    switch (this.type) {
      case 'health':
        if (playerStats.health >= playerStats.maxHealth) return;
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + this.amount);
        spawnTextParticle(this.pos, `+${this.amount} HP`);
        break;
      case 'ammo':
        if (playerStats.ammo[this.subType] >= playerStats.maxAmmo[this.subType]) return;
        playerStats.ammo[this.subType] = Math.min(playerStats.maxAmmo[this.subType], playerStats.ammo[this.subType] + this.amount);
        spawnTextParticle(this.pos, `+${this.amount} ${this.subType.toUpperCase()}`);
        break;
      case 'credits':
        playerStats.credits += this.amount;
        spawnTextParticle(this.pos, `+${this.amount} CREDITS`);
        break;
      case 'keycard':
        playerStats.keycards[this.subType] = true;
        spawnTextParticle(this.pos, `${this.subType.toUpperCase()} KEYCARD`);
        break;
      case 'weapon':
        if (!playerStats.weapons.includes(this.subType)) {
          playerStats.weapons.push(this.subType);
          playerStats.currentWeapon = this.subType;
          spawnTextParticle(this.pos, `${this.subType.toUpperCase()} ACQUIRED`);
        }
        break;
      case 'escapePod':
        if (selfDestructTimer > 0 || currentRoom === 9) {
          victory = true;
          gameOver = true;
        }
        break;
    }

    this.collected = true;
    spawnParticles(this.pos, this.color, 8);
  }

  render() {
    if (this.collected) return;

    // Bobbing animation
    const bob = Math.sin(gameTime * 5) * 0.1;
    const drawPos = this.pos.add(vec2(0, bob));
    drawRect(drawPos, this.size, this.color);

    // Glow for keycards and weapons
    if (this.type === 'keycard' || this.type === 'weapon' || this.type === 'escapePod') {
      const glowSize = this.size.scale(1.5 + Math.sin(gameTime * 3) * 0.2);
      drawRect(drawPos, glowSize, this.color.scale(0.3, 0.3));
    }
  }
}

// Particle system
class TextParticle {
  constructor(pos, text) {
    this.pos = pos;
    this.text = text;
    this.lifetime = 1.5;
    this.timer = new Timer(this.lifetime);
  }

  update() {
    this.pos = this.pos.add(vec2(0, 1 / 60));
  }

  render() {
    const alpha = 1 - this.timer.get() / this.lifetime;
    if (alpha <= 0) return;
    drawText(this.text, this.pos, 0.4, new Color(1, 1, 1, alpha));
  }

  isDead() {
    return this.timer.elapsed();
  }
}

let textParticles = [];

function spawnTextParticle(pos, text) {
  textParticles.push(new TextParticle(pos, text));
}

function spawnParticles(pos, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      pos: pos.copy(),
      vel: vec2(rand(-2, 2), rand(-2, 2)),
      color: color,
      life: 0.5,
      timer: new Timer(0.5)
    });
  }
}

// Load a room
function loadRoom(roomId) {
  const room = rooms[roomId];
  currentRoom = roomId;

  // Clear existing
  bullets = [];
  enemies = [];
  pickups = [];

  // Position player based on entry direction
  const prevRoom = rooms.find(r => Object.values(r.exits).includes(roomId));
  if (prevRoom) {
    const entryDir = Object.keys(prevRoom.exits).find(k => prevRoom.exits[k] === roomId);
    switch (entryDir) {
      case 'right': player.pos = vec2(2, ROOM_HEIGHT / 2); break;
      case 'left': player.pos = vec2(ROOM_WIDTH - 2, ROOM_HEIGHT / 2); break;
      case 'down': player.pos = vec2(ROOM_WIDTH / 2, ROOM_HEIGHT - 3); break;
      case 'up': player.pos = vec2(ROOM_WIDTH / 2, 3); break;
    }
  } else {
    player.pos = vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
  }

  // Spawn enemies
  for (const e of room.enemies) {
    enemies.push(new Enemy(vec2(e.x, e.y), e.type));
  }

  // Spawn pickups (except boss-conditional ones)
  for (const p of room.pickups) {
    if (p.afterBoss) continue; // These spawn when boss dies
    pickups.push(new Pickup(vec2(p.x, p.y), p.type, p.keycardType || p.weaponType || p.ammoType, p.amount));
  }

  // Trigger self-destruct
  if (room.triggersSelfDestruct && selfDestructTimer < 0) {
    selfDestructTimer = 600; // 10 minutes in seconds
  }
}

// Shop system
const shopItems = [
  { name: 'MEDKIT', cost: 50, effect: () => { playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + 50); } },
  { name: 'SHIELD', cost: 100, effect: () => { playerStats.shield = Math.min(playerStats.maxShield || 25, (playerStats.shield || 0) + 25); playerStats.maxShield = playerStats.maxShield || 25; } },
  { name: 'SHOTGUN AMMO', cost: 25, effect: () => { playerStats.ammo.shotgun = Math.min(playerStats.maxAmmo.shotgun, playerStats.ammo.shotgun + 16); } },
  { name: 'SMG AMMO', cost: 30, effect: () => { playerStats.ammo.smg = Math.min(playerStats.maxAmmo.smg, playerStats.ammo.smg + 60); } },
  { name: 'RIFLE AMMO', cost: 35, effect: () => { playerStats.ammo.rifle = Math.min(playerStats.maxAmmo.rifle, playerStats.ammo.rifle + 30); } },
  { name: 'HP UPGRADE', cost: 200, once: true, effect: () => { playerStats.maxHealth += 25; playerStats.health += 25; } },
  { name: 'DAMAGE UP', cost: 250, once: true, effect: () => { for (const w in weapons) weapons[w].damage *= 1.1; } }
];
let shopPurchased = new Set();
let shopSelection = 0;

function renderShop() {
  // Background overlay
  drawRect(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), vec2(14, 10), new Color(0, 0, 0, 0.9));
  drawRect(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), vec2(13.5, 9.5), new Color(0, 0.3, 0.3, 0.8));

  drawText('INTEX TERMINAL', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 4), 0.6, new Color(0, 1, 1));
  drawText(`CREDITS: ${playerStats.credits}`, vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 3), 0.4, new Color(1, 1, 0));

  for (let i = 0; i < shopItems.length; i++) {
    const item = shopItems[i];
    const y = ROOM_HEIGHT / 2 + 1.5 - i * 0.8;
    const isSelected = i === shopSelection;
    const canBuy = playerStats.credits >= item.cost && (!item.once || !shopPurchased.has(item.name));
    const color = isSelected ? new Color(1, 1, 0) : (canBuy ? new Color(0.7, 0.7, 0.7) : new Color(0.4, 0.4, 0.4));

    drawText(`${isSelected ? '> ' : '  '}${item.name} - ${item.cost}cr`, vec2(ROOM_WIDTH / 2, y), 0.35, color);
  }

  drawText('W/S: Select | E: Buy | Q: Exit', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 4), 0.3, new Color(0.5, 0.5, 0.5));
}

function updateShop() {
  if (keyWasPressed('KeyW') || keyWasPressed('ArrowUp')) {
    shopSelection = (shopSelection - 1 + shopItems.length) % shopItems.length;
  }
  if (keyWasPressed('KeyS') || keyWasPressed('ArrowDown')) {
    shopSelection = (shopSelection + 1) % shopItems.length;
  }
  if (keyWasPressed('KeyE')) {
    const item = shopItems[shopSelection];
    if (playerStats.credits >= item.cost && (!item.once || !shopPurchased.has(item.name))) {
      playerStats.credits -= item.cost;
      item.effect();
      if (item.once) shopPurchased.add(item.name);
    }
  }
  if (keyWasPressed('KeyQ') || keyWasPressed('Escape')) {
    shopOpen = false;
  }
}

// Game initialization
function gameInit() {
  setCanvasFixedSize(vec2(1280, 720));
  setCameraScale(40);
}

// Game update
function gameUpdate() {
  gameTime += 1 / 60;

  // Title screen
  if (!gameStarted) {
    if (keyWasPressed('Space') || mouseWasPressed(0)) {
      gameStarted = true;
      player = new Player(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));
      loadRoom(0);
    }
    return;
  }

  if (gameOver) {
    if (keyWasPressed('KeyR')) {
      // Reset game
      gameOver = false;
      victory = false;
      selfDestructTimer = -1;
      playerStats.health = 100;
      playerStats.maxHealth = 100;
      playerStats.shield = 0;
      playerStats.maxShield = 0;
      playerStats.ammo = { pistol: Infinity, shotgun: 24, smg: 120, rifle: 90 };
      playerStats.currentWeapon = 'pistol';
      playerStats.weapons = ['pistol'];
      playerStats.keycards = { green: false, blue: false, yellow: false, red: false };
      playerStats.credits = 0;
      playerStats.kills = 0;
      shopPurchased = new Set();
      player = new Player(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));
      loadRoom(0);
    }
    return;
  }

  // Pause
  if (keyWasPressed('Escape') || keyWasPressed('KeyP')) {
    gamePaused = !gamePaused;
  }
  if (gamePaused) return;

  // Shop interaction
  const room = rooms[currentRoom];
  if (room.hasShop && keyWasPressed('KeyE') && !shopOpen) {
    // Check if near center (shop terminal area)
    if (player.pos.subtract(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2)).length() < 3) {
      shopOpen = true;
    }
  }
  if (shopOpen) {
    updateShop();
    return;
  }

  // Self-destruct timer
  if (selfDestructTimer > 0) {
    selfDestructTimer -= 1 / 60;
    if (selfDestructTimer <= 0) {
      gameOver = true;
      victory = false;
    }
  }

  // Update camera to follow player
  setCameraPos(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2));

  // Update player
  if (player) player.update();

  // Update bullets
  for (const bullet of [...bullets]) {
    bullet.update();
  }

  // Update enemies
  for (const enemy of enemies) {
    enemy.update();
  }

  // Update particles
  particles = particles.filter(p => {
    p.pos = p.pos.add(p.vel.scale(1 / 60));
    p.vel = p.vel.scale(0.95);
    return !p.timer.elapsed();
  });

  textParticles = textParticles.filter(p => {
    p.update();
    return !p.isDead();
  });

  // Expose game state for testing
  window.gameState = {
    health: playerStats.health,
    player: player ? { x: player.pos.x, y: player.pos.y } : null,
    room: currentRoom,
    enemies: enemies.filter(e => !e.dead).length,
    started: gameStarted,
    gameOver: gameOver,
    victory: victory
  };
}

// Game update post
function gameUpdatePost() {}

// Game render
function gameRender() {
  // Background
  drawRect(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), vec2(ROOM_WIDTH, ROOM_HEIGHT), new Color(0.1, 0.1, 0.15));

  if (!gameStarted) {
    // Title screen
    drawText('STATION BREACH', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 2), 1, new Color(1, 0, 0));
    drawText('A Twin-Stick Shooter', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 0.5), 0.4, new Color(0.7, 0.7, 0.7));
    drawText('WASD: Move | Mouse: Aim | Click: Shoot', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 1), 0.3, new Color(0.5, 0.5, 0.5));
    drawText('E: Interact | Q: Switch Weapon', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 1.6), 0.3, new Color(0.5, 0.5, 0.5));
    drawText('Click to Start', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 3), 0.5, new Color(1, 1, 0, 0.5 + 0.5 * Math.sin(gameTime * 3)));
    return;
  }

  if (gameOver) {
    if (victory) {
      drawText('ESCAPED!', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 2), 1, new Color(0, 1, 0));
      drawText(`Kills: ${playerStats.kills}`, vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), 0.5, new Color(0.7, 0.7, 0.7));
    } else {
      drawText('MISSION FAILED', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 2), 1, new Color(1, 0, 0));
      if (selfDestructTimer <= 0 && currentRoom >= 7) {
        drawText('Station Destroyed', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), 0.5, new Color(1, 0.5, 0));
      }
    }
    drawText('Press R to Restart', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 2), 0.4, new Color(0.5, 0.5, 0.5));
    return;
  }

  // Draw room
  const room = rooms[currentRoom];

  // Floor grid
  for (let x = 0; x < ROOM_WIDTH; x++) {
    for (let y = 0; y < ROOM_HEIGHT; y++) {
      const gridColor = (x + y) % 2 === 0 ? new Color(0.15, 0.15, 0.2) : new Color(0.12, 0.12, 0.17);
      drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), gridColor);
    }
  }

  // Walls
  drawRect(vec2(ROOM_WIDTH / 2, 0.5), vec2(ROOM_WIDTH, 1), new Color(0.3, 0.3, 0.35)); // Bottom
  drawRect(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT - 0.5), vec2(ROOM_WIDTH, 1), new Color(0.3, 0.3, 0.35)); // Top
  drawRect(vec2(0.5, ROOM_HEIGHT / 2), vec2(1, ROOM_HEIGHT), new Color(0.3, 0.3, 0.35)); // Left
  drawRect(vec2(ROOM_WIDTH - 0.5, ROOM_HEIGHT / 2), vec2(1, ROOM_HEIGHT), new Color(0.3, 0.3, 0.35)); // Right

  // Draw doors
  for (const [dir, targetRoom] of Object.entries(room.exits)) {
    let doorPos, doorSize;
    const lock = room.doorLocks?.[dir];
    const doorColor = lock ?
      { green: new Color(0, 1, 0), blue: new Color(0, 0.5, 1), yellow: new Color(1, 1, 0), red: new Color(1, 0, 0) }[lock] :
      new Color(0.5, 0.5, 0.5);

    switch (dir) {
      case 'left': doorPos = vec2(0.5, ROOM_HEIGHT / 2); doorSize = vec2(1, 3); break;
      case 'right': doorPos = vec2(ROOM_WIDTH - 0.5, ROOM_HEIGHT / 2); doorSize = vec2(1, 3); break;
      case 'up': doorPos = vec2(ROOM_WIDTH / 2, ROOM_HEIGHT - 0.5); doorSize = vec2(3, 1); break;
      case 'down': doorPos = vec2(ROOM_WIDTH / 2, 0.5); doorSize = vec2(3, 1); break;
    }
    drawRect(doorPos, doorSize, doorColor);
  }

  // Shop terminal indicator
  if (room.hasShop) {
    drawRect(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), vec2(2, 2), new Color(0, 0.5, 0.5, 0.5 + 0.3 * Math.sin(gameTime * 2)));
    drawText('SHOP [E]', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 1.3), 0.3, new Color(0, 1, 1));
  }

  // Render pickups
  for (const pickup of pickups) {
    pickup.render();
  }

  // Render enemies
  for (const enemy of enemies) {
    enemy.render();
  }

  // Render bullets
  for (const bullet of bullets) {
    bullet.render();
  }

  // Render player
  if (player) player.render();

  // Render particles
  for (const p of particles) {
    const alpha = 1 - p.timer.get() / 0.5;
    drawRect(p.pos, vec2(0.1, 0.1), p.color.scale(1, alpha));
  }

  // Render text particles
  for (const p of textParticles) {
    p.render();
  }

  // Shop overlay
  if (shopOpen) {
    renderShop();
  }

  // Pause overlay
  if (gamePaused) {
    drawRect(vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), vec2(ROOM_WIDTH, ROOM_HEIGHT), new Color(0, 0, 0, 0.7));
    drawText('PAUSED', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2), 0.8, new Color(1, 1, 1));
    drawText('Press P or ESC to Resume', vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 - 1.5), 0.3, new Color(0.5, 0.5, 0.5));
  }
}

// Game render post (HUD)
function gameRenderPost() {
  if (!gameStarted || gameOver || gamePaused) return;

  const room = rooms[currentRoom];
  const hudY = mainCanvasSize.y - 30;

  // Room name
  drawText(`DECK ${room.deck} - ${room.name}`, vec2(mainCanvasSize.x / 2, 25), 0.5, new Color(0.7, 0.7, 0.7), 0.2, new Color(0, 0, 0), 'center', mainCanvasSize.x, undefined, true);

  // Self-destruct timer
  if (selfDestructTimer > 0) {
    const mins = Math.floor(selfDestructTimer / 60);
    const secs = Math.floor(selfDestructTimer % 60);
    const timerColor = selfDestructTimer < 60 ? new Color(1, 0, 0) : (selfDestructTimer < 300 ? new Color(1, 0.5, 0) : new Color(1, 1, 0));
    drawText(`SELF-DESTRUCT: ${mins}:${secs.toString().padStart(2, '0')}`, vec2(mainCanvasSize.x / 2, 50), 0.6, timerColor, 0.2, new Color(0, 0, 0), 'center', mainCanvasSize.x, undefined, true);
  }

  // Health bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = 20;
  const barY = hudY;

  // Health background
  drawRect(vec2(barX + barWidth / 2, barY), vec2(barWidth, barHeight), new Color(0.3, 0, 0), 0, true, true);
  // Health fill
  const healthPercent = playerStats.health / playerStats.maxHealth;
  drawRect(vec2(barX + barWidth * healthPercent / 2, barY), vec2(barWidth * healthPercent, barHeight), new Color(1, 0, 0), 0, true, true);
  drawText(`HP: ${playerStats.health}/${playerStats.maxHealth}`, vec2(barX + barWidth / 2, barY), 0.4, new Color(1, 1, 1), 0.15, new Color(0, 0, 0), 'center', mainCanvasSize.x, undefined, true);

  // Shield bar (if any)
  if (playerStats.maxShield > 0) {
    const shieldY = barY - 25;
    drawRect(vec2(barX + barWidth / 2, shieldY), vec2(barWidth * 0.75, barHeight * 0.75), new Color(0, 0, 0.3), 0, true, true);
    const shieldPercent = playerStats.shield / playerStats.maxShield;
    drawRect(vec2(barX + barWidth * 0.75 * shieldPercent / 2, shieldY), vec2(barWidth * 0.75 * shieldPercent, barHeight * 0.75), new Color(0, 0.5, 1), 0, true, true);
  }

  // Weapon and ammo
  const weaponX = mainCanvasSize.x - 200;
  drawText(playerStats.currentWeapon.toUpperCase(), vec2(weaponX, barY), 0.5, weapons[playerStats.currentWeapon].color, 0.2, new Color(0, 0, 0), 'left', mainCanvasSize.x, undefined, true);
  const ammoText = playerStats.currentWeapon === 'pistol' ? 'INF' : `${playerStats.ammo[playerStats.currentWeapon]}`;
  drawText(`AMMO: ${ammoText}`, vec2(weaponX, barY - 25), 0.4, new Color(1, 1, 0), 0.15, new Color(0, 0, 0), 'left', mainCanvasSize.x, undefined, true);

  // Credits
  drawText(`CREDITS: ${playerStats.credits}`, vec2(weaponX, barY - 50), 0.4, new Color(1, 0.8, 0), 0.15, new Color(0, 0, 0), 'left', mainCanvasSize.x, undefined, true);

  // Keycards
  const keycardX = mainCanvasSize.x - 150;
  const keycardY = 30;
  const keycardSize = 20;
  const keycardColors = [
    { key: 'green', color: new Color(0, 1, 0) },
    { key: 'blue', color: new Color(0, 0.5, 1) },
    { key: 'yellow', color: new Color(1, 1, 0) },
    { key: 'red', color: new Color(1, 0, 0) }
  ];
  for (let i = 0; i < keycardColors.length; i++) {
    const kc = keycardColors[i];
    const x = keycardX + i * 30;
    const color = playerStats.keycards[kc.key] ? kc.color : new Color(0.2, 0.2, 0.2);
    drawRect(vec2(x, keycardY), vec2(keycardSize, keycardSize), color, 0, true, true);
  }

  // Enemy count
  const aliveEnemies = enemies.filter(e => !e.dead).length;
  if (aliveEnemies > 0) {
    drawText(`ENEMIES: ${aliveEnemies}`, vec2(barX + barWidth / 2, barY - 50), 0.4, new Color(1, 0.3, 0.3), 0.15, new Color(0, 0, 0), 'center', mainCanvasSize.x, undefined, true);
  }
}

// Start the engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
