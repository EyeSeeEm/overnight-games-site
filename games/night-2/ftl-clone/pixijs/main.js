// FTL Clone - Spaceship Roguelike with Real-Time-Pause Combat
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Configuration
const CONFIG = {
  shipWidth: 300,
  shipHeight: 200,
  roomSize: 50,
  crewSize: 16,
  crewSpeed: 60,
  baseReactorPower: 8,
  startingFuel: 16,
  startingMissiles: 10,
  startingScrap: 30,
  sectorBeacons: 8,
  oxygenDrainRate: 2,
  oxygenRegenRate: 5,
  healRate: 10,
  shieldRechargeTime: 2000,
  weaponChargeTime: 3000
};

// Colors
const COLORS = {
  background: '#0a0a1a',
  shipHull: '#3a3a5c',
  roomFloor: '#1a1a2e',
  roomBorder: '#5a5a7c',
  shields: '#00ccff',
  weapons: '#ff6600',
  engines: '#ffff00',
  oxygen: '#88ff88',
  medbay: '#00ff00',
  piloting: '#8888ff',
  text: '#ffffff',
  textRed: '#ff4444',
  textGreen: '#00ff00',
  textBlue: '#4488ff',
  textOrange: '#ffaa00',
  crew: '#ffcc88',
  enemy: '#ff6666',
  fire: '#ff4400',
  projectile: '#ffff00'
};

// System types
const SYSTEMS = {
  SHIELDS: 'shields',
  WEAPONS: 'weapons',
  ENGINES: 'engines',
  MEDBAY: 'medbay',
  OXYGEN: 'oxygen',
  PILOTING: 'piloting'
};

// Weapon definitions
const WEAPONS = {
  basicLaser: { name: 'Basic Laser', power: 1, chargeTime: 3000, shots: 1, damage: 1 },
  burstLaser: { name: 'Burst Laser', power: 2, chargeTime: 4000, shots: 2, damage: 1 },
  missile: { name: 'Missiles', power: 1, chargeTime: 5000, shots: 1, damage: 2, usesMissile: true, bypassShields: true },
  heavyLaser: { name: 'Heavy Laser', power: 2, chargeTime: 4500, shots: 1, damage: 3 }
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
    case 'laser':
      osc.frequency.value = 800;
      osc.type = 'sawtooth';
      gain.gain.exponentialDecayTo && gain.gain.exponentialDecayTo(0.01, audioCtx.currentTime + 0.1);
      break;
    case 'hit':
      osc.frequency.value = 200;
      osc.type = 'square';
      break;
    case 'shield':
      osc.frequency.value = 600;
      osc.type = 'sine';
      break;
    case 'jump':
      osc.frequency.value = 400;
      osc.type = 'triangle';
      break;
    case 'death':
      osc.frequency.value = 100;
      osc.type = 'sawtooth';
      break;
  }

  osc.start();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  osc.stop(audioCtx.currentTime + 0.15);
}

// Game state
const game = {
  state: 'menu',
  paused: false,
  sector: 1,
  beacon: 0,
  fuel: CONFIG.startingFuel,
  missiles: CONFIG.startingMissiles,
  scrap: CONFIG.startingScrap,
  playerShip: null,
  enemyShip: null,
  projectiles: [],
  sectorMap: [],
  selectedCrew: null,
  targetRoom: null,
  combatActive: false,
  stats: { gamesPlayed: 0, victories: 0, beaconsVisited: 0, enemiesDefeated: 0 }
};

// Load stats
try {
  const saved = localStorage.getItem('ftlCloneStats');
  if (saved) game.stats = JSON.parse(saved);
} catch(e) {}

function saveStats() {
  try { localStorage.setItem('ftlCloneStats', JSON.stringify(game.stats)); } catch(e) {}
}

// Room class
class Room {
  constructor(x, y, w, h, system) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.system = system;
    this.health = 2;
    this.maxHealth = 2;
    this.powered = true;
    this.powerLevel = 0;
    this.maxPower = system ? 3 : 0;
    this.oxygen = 100;
    this.onFire = false;
    this.breached = false;
    this.crew = [];
  }

  contains(px, py) {
    return px >= this.x && px < this.x + this.width &&
           py >= this.y && py < this.y + this.height;
  }

  getCenter() {
    return { x: this.x + this.width/2, y: this.y + this.height/2 };
  }
}

// Crew class
class Crew {
  constructor(name, race, x, y) {
    this.name = name;
    this.race = race;
    this.x = x;
    this.y = y;
    this.health = 100;
    this.maxHealth = 100;
    this.targetX = x;
    this.targetY = y;
    this.currentRoom = null;
    this.repairSpeed = race === 'engi' ? 2 : 1;
    this.combatDamage = race === 'mantis' ? 1.5 : (race === 'engi' ? 0.5 : 1);
    this.isEnemy = false;
    this.fighting = null;
  }

  update(dt) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > 2) {
      const speed = CONFIG.crewSpeed * (dt / 1000);
      this.x += (dx / dist) * Math.min(speed, dist);
      this.y += (dy / dist) * Math.min(speed, dist);
    }

    // Fighting
    if (this.fighting && this.fighting.health > 0) {
      const fightDist = Math.sqrt(
        Math.pow(this.fighting.x - this.x, 2) +
        Math.pow(this.fighting.y - this.y, 2)
      );
      if (fightDist < 20) {
        this.fighting.health -= this.combatDamage * 10 * (dt / 1000);
      }
    } else {
      this.fighting = null;
    }

    // Oxygen damage
    if (this.currentRoom && this.currentRoom.oxygen < 25) {
      this.health -= 5 * (dt / 1000);
    }

    // Fire damage
    if (this.currentRoom && this.currentRoom.onFire) {
      this.health -= 10 * (dt / 1000);
    }
  }
}

// Ship class
class Ship {
  constructor(isPlayer) {
    this.isPlayer = isPlayer;
    this.hull = 30;
    this.maxHull = 30;
    this.reactorPower = CONFIG.baseReactorPower;
    this.usedPower = 0;
    this.shieldLayers = 0;
    this.maxShieldLayers = 2;
    this.shieldRecharge = 0;
    this.evasion = 15;
    this.rooms = [];
    this.crew = [];
    this.weapons = [];
    this.weaponSlots = [];
    this.x = isPlayer ? 50 : 450;
    this.y = 100;
    this.setupRooms();

    if (isPlayer) {
      this.setupPlayerWeapons();
      this.spawnCrew();
    }
  }

  setupRooms() {
    const rs = CONFIG.roomSize;
    const ox = this.x;
    const oy = this.y;

    // Standard ship layout
    this.rooms = [
      new Room(ox, oy + rs, rs, rs, SYSTEMS.SHIELDS),
      new Room(ox + rs, oy, rs, rs, SYSTEMS.WEAPONS),
      new Room(ox + rs, oy + rs, rs, rs, null), // Hallway
      new Room(ox + rs, oy + rs*2, rs, rs, SYSTEMS.ENGINES),
      new Room(ox + rs*2, oy + rs/2, rs, rs, SYSTEMS.OXYGEN),
      new Room(ox + rs*2, oy + rs*1.5, rs, rs, SYSTEMS.MEDBAY),
      new Room(ox + rs*3, oy + rs, rs, rs, SYSTEMS.PILOTING)
    ];

    // Set initial power
    this.rooms.forEach(r => {
      if (r.system) {
        r.powerLevel = 1;
        r.maxPower = r.system === SYSTEMS.SHIELDS ? 4 :
                     r.system === SYSTEMS.WEAPONS ? 4 :
                     r.system === SYSTEMS.ENGINES ? 3 : 2;
      }
    });

    this.updatePower();
  }

  setupPlayerWeapons() {
    this.weaponSlots = [
      { weapon: WEAPONS.basicLaser, charge: 0, powered: true, autofire: false },
      { weapon: WEAPONS.missile, charge: 0, powered: false, autofire: false }
    ];
  }

  spawnCrew() {
    const pilotRoom = this.rooms.find(r => r.system === SYSTEMS.PILOTING);
    const weaponsRoom = this.rooms.find(r => r.system === SYSTEMS.WEAPONS);
    const enginesRoom = this.rooms.find(r => r.system === SYSTEMS.ENGINES);

    this.crew = [
      new Crew('Captain', 'human', pilotRoom.x + 25, pilotRoom.y + 25),
      new Crew('Gunner', 'human', weaponsRoom.x + 25, weaponsRoom.y + 25),
      new Crew('Engineer', 'engi', enginesRoom.x + 25, enginesRoom.y + 25)
    ];

    this.crew.forEach(c => this.assignCrewToRoom(c));
  }

  assignCrewToRoom(crew) {
    this.rooms.forEach(r => {
      const idx = r.crew.indexOf(crew);
      if (idx >= 0) r.crew.splice(idx, 1);
    });

    const room = this.rooms.find(r => r.contains(crew.x, crew.y));
    if (room) {
      room.crew.push(crew);
      crew.currentRoom = room;
    }
  }

  updatePower() {
    this.usedPower = 0;
    this.rooms.forEach(r => {
      if (r.system && r.powerLevel > 0) {
        this.usedPower += r.powerLevel;
      }
    });

    // Update shield layers based on power
    const shieldRoom = this.rooms.find(r => r.system === SYSTEMS.SHIELDS);
    if (shieldRoom && shieldRoom.health > 0) {
      this.maxShieldLayers = Math.floor(shieldRoom.powerLevel / 2);
    } else {
      this.maxShieldLayers = 0;
    }

    // Update evasion based on engines
    const enginesRoom = this.rooms.find(r => r.system === SYSTEMS.ENGINES);
    const pilotRoom = this.rooms.find(r => r.system === SYSTEMS.PILOTING);
    if (enginesRoom && enginesRoom.health > 0 && pilotRoom && pilotRoom.crew.length > 0) {
      this.evasion = 5 + enginesRoom.powerLevel * 5;
      if (enginesRoom.crew.length > 0) this.evasion += 5;
      if (pilotRoom.crew.length > 0) this.evasion += 5;
    } else {
      this.evasion = 0;
    }
  }

  update(dt) {
    // Shield recharge
    if (this.shieldLayers < this.maxShieldLayers) {
      this.shieldRecharge += dt;
      if (this.shieldRecharge >= CONFIG.shieldRechargeTime) {
        this.shieldLayers++;
        this.shieldRecharge = 0;
        playSound('shield');
      }
    }

    // Room updates
    this.rooms.forEach(room => {
      // Oxygen
      const oxygenRoom = this.rooms.find(r => r.system === SYSTEMS.OXYGEN);
      if (oxygenRoom && oxygenRoom.health > 0 && oxygenRoom.powerLevel > 0) {
        room.oxygen = Math.min(100, room.oxygen + CONFIG.oxygenRegenRate * (dt / 1000));
      } else {
        room.oxygen = Math.max(0, room.oxygen - CONFIG.oxygenDrainRate * (dt / 1000));
      }

      if (room.breached) {
        room.oxygen = Math.max(0, room.oxygen - CONFIG.oxygenDrainRate * 3 * (dt / 1000));
      }

      // Medbay healing
      if (room.system === SYSTEMS.MEDBAY && room.health > 0 && room.powerLevel > 0) {
        room.crew.forEach(c => {
          c.health = Math.min(c.maxHealth, c.health + CONFIG.healRate * (dt / 1000));
        });
      }

      // Repair
      if (room.health < room.maxHealth && room.crew.length > 0) {
        const repairSpeed = room.crew.reduce((sum, c) => sum + c.repairSpeed, 0);
        room.health = Math.min(room.maxHealth, room.health + 0.5 * repairSpeed * (dt / 1000));
      }

      // Fire
      if (room.onFire) {
        room.health = Math.max(0, room.health - 0.2 * (dt / 1000));
        // Crew can fight fire
        if (room.crew.length > 0) {
          if (Math.random() < 0.1 * room.crew.length * (dt / 1000)) {
            room.onFire = false;
          }
        }
      }
    });

    // Crew updates
    this.crew.forEach(c => {
      c.update(dt);
      this.assignCrewToRoom(c);
    });
    this.crew = this.crew.filter(c => c.health > 0);

    // Weapon charging
    this.weaponSlots.forEach(slot => {
      if (slot.powered && slot.weapon) {
        slot.charge = Math.min(slot.weapon.chargeTime, slot.charge + dt);
      }
    });

    this.updatePower();
  }

  takeDamage(damage, targetRoom, bypassShields) {
    // Evasion check
    if (Math.random() * 100 < this.evasion) {
      return { evaded: true };
    }

    // Shield check
    if (!bypassShields && this.shieldLayers > 0) {
      this.shieldLayers--;
      this.shieldRecharge = 0;
      return { shielded: true };
    }

    // Apply damage
    this.hull -= damage;
    playSound('hit');

    if (targetRoom) {
      targetRoom.health = Math.max(0, targetRoom.health - 1);
      // Fire chance
      if (Math.random() < 0.15) {
        targetRoom.onFire = true;
      }
    }

    return { damage: damage };
  }

  getSystemRoom(system) {
    return this.rooms.find(r => r.system === system);
  }
}

// Generate sector map
function generateSectorMap() {
  game.sectorMap = [];
  for (let i = 0; i < CONFIG.sectorBeacons; i++) {
    const beacon = {
      x: 100 + i * 80,
      y: 200 + Math.sin(i * 1.5) * 100,
      visited: i === 0,
      type: i === CONFIG.sectorBeacons - 1 ? 'exit' :
            Math.random() < 0.3 ? 'store' :
            Math.random() < 0.2 ? 'empty' : 'combat',
      connections: []
    };
    game.sectorMap.push(beacon);
  }

  // Connect beacons
  for (let i = 0; i < game.sectorMap.length - 1; i++) {
    game.sectorMap[i].connections.push(i + 1);
    if (i + 2 < game.sectorMap.length && Math.random() < 0.5) {
      game.sectorMap[i].connections.push(i + 2);
    }
  }

  game.beacon = 0;
}

// Generate enemy ship
function generateEnemy() {
  const ship = new Ship(false);
  ship.hull = 15 + game.sector * 5;
  ship.maxHull = ship.hull;

  // Enemy weapons
  ship.weaponSlots = [
    { weapon: WEAPONS.basicLaser, charge: Math.random() * 2000, powered: true, autofire: true }
  ];

  if (game.sector >= 2) {
    ship.weaponSlots.push({
      weapon: WEAPONS.burstLaser,
      charge: Math.random() * 3000,
      powered: true,
      autofire: true
    });
  }

  // Enemy crew
  ship.crew = [
    new Crew('Enemy 1', 'human', ship.rooms[0].x + 25, ship.rooms[0].y + 25),
    new Crew('Enemy 2', 'human', ship.rooms[1].x + 25, ship.rooms[1].y + 25)
  ];
  ship.crew.forEach(c => {
    c.isEnemy = true;
    ship.assignCrewToRoom(c);
  });

  // Shield based on sector
  const shieldRoom = ship.getSystemRoom(SYSTEMS.SHIELDS);
  if (shieldRoom) {
    shieldRoom.powerLevel = Math.min(4, game.sector);
    ship.maxShieldLayers = Math.floor(shieldRoom.powerLevel / 2);
    ship.shieldLayers = ship.maxShieldLayers;
  }

  return ship;
}

// Start game
function startGame() {
  game.state = 'playing';
  game.sector = 1;
  game.fuel = CONFIG.startingFuel;
  game.missiles = CONFIG.startingMissiles;
  game.scrap = CONFIG.startingScrap;
  game.playerShip = new Ship(true);
  game.enemyShip = null;
  game.projectiles = [];
  game.combatActive = false;
  game.paused = false;
  game.stats.gamesPlayed++;
  saveStats();
  generateSectorMap();
}

// Jump to beacon
function jumpToBeacon(beaconIdx) {
  if (game.fuel <= 0) return;
  if (!game.sectorMap[game.beacon].connections.includes(beaconIdx)) return;

  game.fuel--;
  game.beacon = beaconIdx;
  game.sectorMap[beaconIdx].visited = true;
  game.stats.beaconsVisited++;
  playSound('jump');

  const beacon = game.sectorMap[beaconIdx];

  if (beacon.type === 'combat') {
    game.enemyShip = generateEnemy();
    game.combatActive = true;
  } else if (beacon.type === 'store') {
    game.scrap += 15;
  } else if (beacon.type === 'exit') {
    if (game.sector < 8) {
      game.sector++;
      generateSectorMap();
    } else {
      game.state = 'victory';
      game.stats.victories++;
      saveStats();
    }
  } else {
    game.scrap += 5;
  }
}

// Fire weapon
function fireWeapon(slotIdx, targetRoom) {
  const ship = game.playerShip;
  const slot = ship.weaponSlots[slotIdx];

  if (!slot || !slot.weapon) return;
  if (slot.charge < slot.weapon.chargeTime) return;
  if (slot.weapon.usesMissile && game.missiles <= 0) return;

  slot.charge = 0;
  if (slot.weapon.usesMissile) game.missiles--;

  playSound('laser');

  // Create projectile
  for (let i = 0; i < slot.weapon.shots; i++) {
    game.projectiles.push({
      x: ship.x + 200,
      y: ship.y + 80 + i * 10,
      targetX: game.enemyShip.x + 100,
      targetY: targetRoom ? targetRoom.y + 25 : game.enemyShip.y + 75,
      damage: slot.weapon.damage,
      bypassShields: slot.weapon.bypassShields || false,
      targetRoom: targetRoom,
      speed: 300,
      isPlayer: true
    });
  }
}

// Enemy AI
function updateEnemyAI(dt) {
  if (!game.enemyShip || !game.combatActive) return;

  game.enemyShip.weaponSlots.forEach((slot, idx) => {
    if (slot.powered && slot.weapon && slot.charge >= slot.weapon.chargeTime && slot.autofire) {
      slot.charge = 0;
      playSound('laser');

      // Target random player room
      const targetRoom = game.playerShip.rooms[Math.floor(Math.random() * game.playerShip.rooms.length)];

      for (let i = 0; i < slot.weapon.shots; i++) {
        game.projectiles.push({
          x: game.enemyShip.x + 50,
          y: game.enemyShip.y + 75,
          targetX: game.playerShip.x + 150,
          targetY: targetRoom.y + 25,
          damage: slot.weapon.damage,
          bypassShields: slot.weapon.bypassShields || false,
          targetRoom: targetRoom,
          speed: 250,
          isPlayer: false
        });
      }
    }
  });
}

// Update projectiles
function updateProjectiles(dt) {
  game.projectiles.forEach(proj => {
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist > 5) {
      const speed = proj.speed * (dt / 1000);
      proj.x += (dx / dist) * Math.min(speed, dist);
      proj.y += (dy / dist) * Math.min(speed, dist);
    } else {
      // Hit
      const target = proj.isPlayer ? game.enemyShip : game.playerShip;
      target.takeDamage(proj.damage, proj.targetRoom, proj.bypassShields);
      proj.hit = true;
    }
  });

  game.projectiles = game.projectiles.filter(p => !p.hit);
}

// Check combat end
function checkCombatEnd() {
  if (game.enemyShip && game.enemyShip.hull <= 0) {
    game.combatActive = false;
    game.enemyShip = null;
    game.stats.enemiesDefeated++;
    game.scrap += 20 + game.sector * 5;
    game.fuel += 2;
    game.missiles += 2;
    saveStats();
  }

  if (game.playerShip.hull <= 0) {
    game.state = 'gameover';
    playSound('death');
    saveStats();
  }
}

// Main update
function update(dt) {
  if (game.state !== 'playing' || game.paused) return;

  game.playerShip.update(dt);

  if (game.combatActive && game.enemyShip) {
    game.enemyShip.update(dt);
    updateEnemyAI(dt);
    updateProjectiles(dt);
    checkCombatEnd();
  }
}

// Draw ship
function drawShip(ship, offsetX, offsetY, showDetails) {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Hull outline
  ctx.fillStyle = COLORS.shipHull;
  ctx.fillRect(-10, -10, CONFIG.shipWidth + 20, CONFIG.shipHeight + 50);

  // Rooms
  ship.rooms.forEach(room => {
    const rx = room.x - ship.x;
    const ry = room.y - ship.y;

    // Floor
    ctx.fillStyle = room.onFire ? COLORS.fire :
                    room.oxygen < 25 ? '#440044' :
                    COLORS.roomFloor;
    ctx.fillRect(rx, ry, room.width, room.height);

    // Border
    ctx.strokeStyle = room.system ? {
      [SYSTEMS.SHIELDS]: COLORS.shields,
      [SYSTEMS.WEAPONS]: COLORS.weapons,
      [SYSTEMS.ENGINES]: COLORS.engines,
      [SYSTEMS.MEDBAY]: COLORS.medbay,
      [SYSTEMS.OXYGEN]: COLORS.oxygen,
      [SYSTEMS.PILOTING]: COLORS.piloting
    }[room.system] || COLORS.roomBorder : COLORS.roomBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, room.width, room.height);

    // System icon
    if (room.system && showDetails) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const sysName = room.system.charAt(0).toUpperCase() + room.system.slice(1, 4);
      ctx.fillText(sysName, rx + room.width/2, ry + 12);

      // Power bars
      for (let i = 0; i < room.maxPower; i++) {
        ctx.fillStyle = i < room.powerLevel ? '#00ff00' : '#333333';
        ctx.fillRect(rx + 5 + i * 10, ry + room.height - 12, 8, 8);
      }

      // Health
      if (room.health < room.maxHealth) {
        ctx.fillStyle = COLORS.textRed;
        ctx.fillRect(rx, ry + room.height - 4, room.width * (room.health / room.maxHealth), 3);
      }
    }
  });

  // Shields
  if (ship.shieldLayers > 0) {
    ctx.strokeStyle = COLORS.shields;
    ctx.lineWidth = ship.shieldLayers * 2;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(-20, -20, CONFIG.shipWidth + 40, CONFIG.shipHeight + 70);
    ctx.globalAlpha = 1;
  }

  // Crew
  ship.crew.forEach(crew => {
    ctx.fillStyle = crew.isEnemy ? COLORS.enemy : COLORS.crew;
    ctx.beginPath();
    ctx.arc(crew.x - ship.x, crew.y - ship.y, CONFIG.crewSize/2, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    if (showDetails && crew.health < crew.maxHealth) {
      ctx.fillStyle = COLORS.textRed;
      ctx.fillRect(crew.x - ship.x - 8, crew.y - ship.y - 15, 16 * (crew.health / crew.maxHealth), 3);
    }
  });

  // Hull bar
  ctx.fillStyle = COLORS.textRed;
  ctx.fillRect(0, CONFIG.shipHeight + 25, CONFIG.shipWidth * (ship.hull / ship.maxHull), 8);
  ctx.strokeStyle = COLORS.text;
  ctx.strokeRect(0, CONFIG.shipHeight + 25, CONFIG.shipWidth, 8);

  ctx.restore();
}

// Draw weapons UI
function drawWeaponsUI() {
  const ship = game.playerShip;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(10, 450, 400, 60);
  ctx.strokeStyle = COLORS.roomBorder;
  ctx.strokeRect(10, 450, 400, 60);

  ship.weaponSlots.forEach((slot, idx) => {
    const x = 20 + idx * 100;
    const y = 460;

    // Weapon box
    ctx.fillStyle = slot.powered ? '#2a2a3e' : '#1a1a1e';
    ctx.fillRect(x, y, 90, 40);
    ctx.strokeStyle = slot.powered ? COLORS.weapons : '#444444';
    ctx.strokeRect(x, y, 90, 40);

    // Name
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(slot.weapon.name, x + 5, y + 12);

    // Charge bar
    const chargePercent = slot.charge / slot.weapon.chargeTime;
    ctx.fillStyle = chargePercent >= 1 ? COLORS.textGreen : COLORS.textOrange;
    ctx.fillRect(x + 5, y + 20, 80 * chargePercent, 10);
    ctx.strokeStyle = '#666666';
    ctx.strokeRect(x + 5, y + 20, 80, 10);

    // Hotkey
    ctx.fillStyle = COLORS.textBlue;
    ctx.fillText(`[${idx + 1}]`, x + 5, y + 38);
  });
}

// Draw resources UI
function drawResourcesUI() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(10, 520, 400, 30);

  ctx.font = '12px monospace';
  ctx.textAlign = 'left';

  ctx.fillStyle = COLORS.textOrange;
  ctx.fillText(`Scrap: ${game.scrap}`, 20, 540);

  ctx.fillStyle = COLORS.textBlue;
  ctx.fillText(`Fuel: ${game.fuel}`, 120, 540);

  ctx.fillStyle = COLORS.textRed;
  ctx.fillText(`Missiles: ${game.missiles}`, 200, 540);

  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Sector: ${game.sector}`, 310, 540);
}

// Draw sector map
function drawSectorMap() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.text;
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`SECTOR ${game.sector} - Choose Beacon`, canvas.width/2, 50);

  // Draw connections
  ctx.strokeStyle = '#333366';
  ctx.lineWidth = 2;
  game.sectorMap.forEach((beacon, idx) => {
    beacon.connections.forEach(targetIdx => {
      ctx.beginPath();
      ctx.moveTo(beacon.x, beacon.y);
      ctx.lineTo(game.sectorMap[targetIdx].x, game.sectorMap[targetIdx].y);
      ctx.stroke();
    });
  });

  // Draw beacons
  game.sectorMap.forEach((beacon, idx) => {
    ctx.fillStyle = beacon.visited ? '#446644' :
                    beacon.type === 'combat' ? '#664444' :
                    beacon.type === 'store' ? '#446666' :
                    beacon.type === 'exit' ? '#666644' :
                    '#444466';
    ctx.beginPath();
    ctx.arc(beacon.x, beacon.y, idx === game.beacon ? 18 : 12, 0, Math.PI * 2);
    ctx.fill();

    // Current beacon indicator
    if (idx === game.beacon) {
      ctx.strokeStyle = COLORS.textGreen;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Type label
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const label = beacon.type === 'combat' ? '!' :
                  beacon.type === 'store' ? '$' :
                  beacon.type === 'exit' ? 'EXIT' : '?';
    ctx.fillText(label, beacon.x, beacon.y + 4);
  });

  // Instructions
  ctx.fillStyle = COLORS.textBlue;
  ctx.font = '14px monospace';
  ctx.fillText('Click connected beacon to jump (costs 1 fuel)', canvas.width/2, 400);
  ctx.fillText(`Fuel: ${game.fuel}`, canvas.width/2, 430);
}

// Draw combat
function drawCombat() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player ship
  drawShip(game.playerShip, 0, 0, true);

  // Enemy ship
  if (game.enemyShip) {
    drawShip(game.enemyShip, 400, 0, false);

    // Enemy label
    ctx.fillStyle = COLORS.textRed;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENEMY SHIP', 600, 20);
  }

  // Projectiles
  game.projectiles.forEach(proj => {
    ctx.fillStyle = proj.isPlayer ? COLORS.projectile : COLORS.textRed;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Weapons UI
  drawWeaponsUI();

  // Resources
  drawResourcesUI();

  // Pause indicator
  if (game.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to resume', canvas.width/2, canvas.height/2 + 40);
  }

  // Combat status
  if (!game.combatActive && !game.enemyShip) {
    ctx.fillStyle = COLORS.textGreen;
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENEMY DEFEATED!', canvas.width/2, 380);
    ctx.font = '14px monospace';
    ctx.fillText('Press M to view sector map', canvas.width/2, 410);
  }
}

// Draw menu
function drawMenu() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 100; i++) {
    const x = (i * 73) % canvas.width;
    const y = (i * 47) % canvas.height;
    ctx.fillRect(x, y, 1, 1);
  }

  // Title
  ctx.fillStyle = COLORS.text;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FTL CLONE', canvas.width/2, 150);

  ctx.font = '16px monospace';
  ctx.fillStyle = COLORS.textBlue;
  ctx.fillText('Spaceship Roguelike', canvas.width/2, 190);

  // Instructions
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px monospace';
  const instructions = [
    'Press ENTER to Start',
    '',
    'Controls:',
    'SPACE - Pause/Unpause',
    'CLICK - Select crew, target rooms',
    '1-4 - Fire weapons at target',
    'M - Toggle sector map',
    'P - Add/Remove power from system'
  ];

  instructions.forEach((line, i) => {
    ctx.fillText(line, canvas.width/2, 260 + i * 25);
  });

  // Stats
  ctx.fillStyle = COLORS.textOrange;
  ctx.font = '12px monospace';
  ctx.fillText(`Games: ${game.stats.gamesPlayed} | Victories: ${game.stats.victories} | Beacons: ${game.stats.beaconsVisited}`, canvas.width/2, 530);
}

// Draw game over
function drawGameOver() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.textRed;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SHIP DESTROYED', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '16px monospace';
  ctx.fillText(`Reached Sector ${game.sector}`, canvas.width/2, 280);
  ctx.fillText(`Beacons Visited: ${game.stats.beaconsVisited}`, canvas.width/2, 320);
  ctx.fillText(`Enemies Defeated: ${game.stats.enemiesDefeated}`, canvas.width/2, 350);

  ctx.fillStyle = COLORS.textBlue;
  ctx.fillText('Press ENTER to try again', canvas.width/2, 420);
  ctx.fillText('Press ESC for menu', canvas.width/2, 450);
}

// Draw victory
function drawVictory() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.textGreen;
  ctx.font = '40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', canvas.width/2, 200);

  ctx.fillStyle = COLORS.text;
  ctx.font = '16px monospace';
  ctx.fillText('You reached the Federation Fleet!', canvas.width/2, 280);
  ctx.fillText(`Scrap Collected: ${game.scrap}`, canvas.width/2, 330);
  ctx.fillText(`Enemies Defeated: ${game.stats.enemiesDefeated}`, canvas.width/2, 360);

  ctx.fillStyle = COLORS.textBlue;
  ctx.fillText('Press ENTER to play again', canvas.width/2, 430);
}

// Main draw
let showMap = false;

function draw() {
  switch(game.state) {
    case 'menu':
      drawMenu();
      break;
    case 'playing':
      if (showMap || !game.combatActive) {
        drawSectorMap();
      } else {
        drawCombat();
      }
      break;
    case 'gameover':
      drawGameOver();
      break;
    case 'victory':
      drawVictory();
      break;
  }
}

// Input handling
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code === 'Enter') {
    if (game.state === 'menu' || game.state === 'gameover' || game.state === 'victory') {
      startGame();
    }
  }

  if (e.code === 'Escape') {
    if (game.state !== 'menu') {
      game.state = 'menu';
    }
  }

  if (game.state === 'playing') {
    if (e.code === 'Space') {
      game.paused = !game.paused;
    }

    if (e.code === 'KeyM') {
      showMap = !showMap;
    }

    // Weapon firing (1-4)
    if (e.code.startsWith('Digit') && game.combatActive && game.targetRoom) {
      const idx = parseInt(e.code.replace('Digit', '')) - 1;
      if (idx >= 0 && idx < game.playerShip.weaponSlots.length) {
        fireWeapon(idx, game.targetRoom);
      }
    }

    // Power adjustment
    if (e.code === 'KeyP' && game.selectedCrew && game.selectedCrew.currentRoom) {
      const room = game.selectedCrew.currentRoom;
      if (room.system) {
        if (room.powerLevel < room.maxPower && game.playerShip.usedPower < game.playerShip.reactorPower) {
          room.powerLevel++;
        } else if (room.powerLevel > 0) {
          room.powerLevel--;
        }
        game.playerShip.updatePower();
      }
    }
  }
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Mouse handling
let mouseX = 0, mouseY = 0;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (game.state === 'playing') {
    if (showMap || !game.combatActive) {
      // Sector map click
      game.sectorMap.forEach((beacon, idx) => {
        const dist = Math.sqrt(Math.pow(x - beacon.x, 2) + Math.pow(y - beacon.y, 2));
        if (dist < 20 && game.sectorMap[game.beacon].connections.includes(idx)) {
          jumpToBeacon(idx);
        }
      });
    } else {
      // Combat click
      // Check player crew selection
      let clickedCrew = null;
      game.playerShip.crew.forEach(crew => {
        const dist = Math.sqrt(Math.pow(x - crew.x, 2) + Math.pow(y - crew.y, 2));
        if (dist < CONFIG.crewSize) {
          clickedCrew = crew;
        }
      });

      if (clickedCrew) {
        game.selectedCrew = clickedCrew;
      } else if (game.selectedCrew) {
        // Move crew to clicked position in player ship
        const room = game.playerShip.rooms.find(r =>
          x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
        );
        if (room) {
          game.selectedCrew.targetX = x;
          game.selectedCrew.targetY = y;
        }
      }

      // Check enemy room targeting
      if (game.enemyShip) {
        const enemyRoom = game.enemyShip.rooms.find(r =>
          x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
        );
        if (enemyRoom) {
          game.targetRoom = enemyRoom;
        }
      }
    }
  }
});

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(Math.min(dt, 50));
  draw();

  requestAnimationFrame(gameLoop);
}

// Expose game for testing
window.game = game;

// Start
requestAnimationFrame(gameLoop);
