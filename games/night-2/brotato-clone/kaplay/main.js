// Using global kaplay from CDN

const k = kaplay({
  width: 800,
  height: 600,
  background: [25, 25, 40],
  canvas: document.createElement("canvas"),
  global: false,
});

document.body.appendChild(k.canvas);

// Audio
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  let duration = 0.1;

  if (type === "shoot") {
    osc.type = "square";
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    duration = 0.08;
  } else if (type === "hit") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    duration = 0.12;
  } else if (type === "pickup") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    duration = 0.1;
  } else if (type === "levelup") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(600, t + 0.1);
    osc.frequency.setValueAtTime(800, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    duration = 0.3;
  } else if (type === "buy") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.setValueAtTime(700, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    duration = 0.15;
  } else if (type === "waveComplete") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.15);
    osc.frequency.setValueAtTime(784, t + 0.3);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    duration = 0.5;
  } else if (type === "death") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    duration = 1;
  }

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Game State
let playerStats = {
  maxHP: 10,
  hp: 10,
  hpRegen: 0,
  damage: 0,
  attackSpeed: 0,
  critChance: 0,
  armor: 0,
  dodge: 0,
  speed: 0,
  range: 0,
  luck: 0,
  harvesting: 0,
  lifeSteal: 0
};

let gameState = {
  wave: 1,
  maxWaves: 20,
  waveTimer: 0,
  waveDuration: 30,
  materials: 0,
  xp: 0,
  level: 1,
  xpToLevel: 10,
  kills: 0,
  weaponSlots: 6,
  weapons: []
};

// Weapon definitions
const weaponTypes = [
  { name: "Pistol", type: "ranged", baseDamage: 3, cooldown: 0.5, range: 200, tier: 1, color: [200, 200, 200] },
  { name: "SMG", type: "ranged", baseDamage: 2, cooldown: 0.15, range: 180, tier: 1, color: [150, 150, 200] },
  { name: "Shotgun", type: "ranged", baseDamage: 4, cooldown: 0.8, range: 120, pellets: 5, tier: 2, color: [180, 140, 100] },
  { name: "Rifle", type: "ranged", baseDamage: 8, cooldown: 1.0, range: 300, tier: 2, color: [100, 150, 100] },
  { name: "Knife", type: "melee", baseDamage: 5, cooldown: 0.3, range: 50, tier: 1, color: [180, 180, 180] },
  { name: "Sword", type: "melee", baseDamage: 10, cooldown: 0.6, range: 70, tier: 2, color: [150, 200, 255] },
  { name: "Laser", type: "ranged", baseDamage: 6, cooldown: 0.4, range: 250, pierce: true, tier: 3, color: [255, 100, 100] },
  { name: "Rocket", type: "ranged", baseDamage: 20, cooldown: 2.0, range: 200, explosive: true, tier: 3, color: [255, 150, 50] }
];

// Enemy types
const enemyTypes = [
  { name: "Basic", health: 5, damage: 1, speed: 60, size: 16, color: [100, 200, 100], xp: 2, materials: 1 },
  { name: "Fast", health: 3, damage: 1, speed: 120, size: 12, color: [200, 200, 100], xp: 3, materials: 1 },
  { name: "Tank", health: 15, damage: 2, speed: 40, size: 24, color: [100, 100, 200], xp: 5, materials: 3 },
  { name: "Swarm", health: 2, damage: 1, speed: 80, size: 10, color: [200, 100, 200], xp: 1, materials: 1 },
  { name: "Elite", health: 30, damage: 3, speed: 50, size: 28, color: [255, 100, 100], xp: 10, materials: 5 }
];

// Shop items (stat upgrades)
const shopItems = [
  { name: "+5 Max HP", stat: "maxHP", value: 5, cost: 15 },
  { name: "+1 HP Regen", stat: "hpRegen", value: 1, cost: 20 },
  { name: "+10% Damage", stat: "damage", value: 10, cost: 25 },
  { name: "+15% Attack Speed", stat: "attackSpeed", value: 15, cost: 30 },
  { name: "+5% Crit Chance", stat: "critChance", value: 5, cost: 25 },
  { name: "+3 Armor", stat: "armor", value: 3, cost: 20 },
  { name: "+5% Dodge", stat: "dodge", value: 5, cost: 30 },
  { name: "+10% Speed", stat: "speed", value: 10, cost: 15 },
  { name: "+20 Range", stat: "range", value: 20, cost: 15 },
  { name: "+3% Life Steal", stat: "lifeSteal", value: 3, cost: 35 },
  { name: "+2 Harvesting", stat: "harvesting", value: 2, cost: 20 }
];

// Level up options
const levelUpOptions = [
  { name: "+3 Max HP", stat: "maxHP", value: 3 },
  { name: "+5% Damage", stat: "damage", value: 5 },
  { name: "+10% Attack Speed", stat: "attackSpeed", value: 10 },
  { name: "+3% Crit", stat: "critChance", value: 3 },
  { name: "+2 Armor", stat: "armor", value: 2 },
  { name: "+3% Dodge", stat: "dodge", value: 3 },
  { name: "+5% Speed", stat: "speed", value: 5 },
  { name: "+1 Harvesting", stat: "harvesting", value: 1 }
];

// Save/Load
function saveGame() {
  const saveData = {
    stats: playerStats,
    state: { ...gameState, weapons: gameState.weapons.map(w => w.name) },
    timestamp: Date.now()
  };
  localStorage.setItem("brotato_save", JSON.stringify(saveData));
}

function loadGame() {
  const data = localStorage.getItem("brotato_save");
  if (data) {
    try {
      const saveData = JSON.parse(data);
      playerStats = saveData.stats;
      gameState = saveData.state;
      gameState.weapons = gameState.weapons.map(name =>
        weaponTypes.find(w => w.name === name) || weaponTypes[0]
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function resetGame() {
  playerStats = {
    maxHP: 10, hp: 10, hpRegen: 0, damage: 0, attackSpeed: 0,
    critChance: 0, armor: 0, dodge: 0, speed: 0, range: 0,
    luck: 0, harvesting: 0, lifeSteal: 0
  };
  gameState = {
    wave: 1, maxWaves: 20, waveTimer: 0, waveDuration: 30,
    materials: 0, xp: 0, level: 1, xpToLevel: 10, kills: 0,
    weaponSlots: 6, weapons: [{ ...weaponTypes[0] }]
  };
}

// Scenes
k.scene("menu", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(25, 25, 40)
  ]);

  k.add([
    k.text("BROTATO", { size: 48 }),
    k.pos(400, 120),
    k.anchor("center"),
    k.color(255, 200, 100)
  ]);

  k.add([
    k.text("Arena Survivor", { size: 20 }),
    k.pos(400, 170),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  // Potato character
  k.add([
    k.circle(40),
    k.pos(400, 260),
    k.anchor("center"),
    k.color(200, 170, 100)
  ]);
  k.add([
    k.circle(6),
    k.pos(385, 250),
    k.anchor("center"),
    k.color(50, 50, 50)
  ]);
  k.add([
    k.circle(6),
    k.pos(415, 250),
    k.anchor("center"),
    k.color(50, 50, 50)
  ]);

  const hasSave = localStorage.getItem("brotato_save") !== null;

  const newBtn = k.add([
    k.rect(180, 45, { radius: 6 }),
    k.pos(400, 350),
    k.anchor("center"),
    k.color(60, 120, 60),
    k.area()
  ]);

  k.add([
    k.text("New Game", { size: 18 }),
    k.pos(400, 350),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  newBtn.onClick(() => {
    initAudio();
    playSound("buy");
    resetGame();
    k.go("game");
  });

  if (hasSave) {
    const contBtn = k.add([
      k.rect(180, 45, { radius: 6 }),
      k.pos(400, 410),
      k.anchor("center"),
      k.color(60, 60, 120),
      k.area()
    ]);

    k.add([
      k.text("Continue", { size: 18 }),
      k.pos(400, 410),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    contBtn.onClick(() => {
      initAudio();
      playSound("buy");
      loadGame();
      k.go("shop");
    });
  }

  k.add([
    k.text("Survive 20 waves of aliens!", { size: 12 }),
    k.pos(400, 500),
    k.anchor("center"),
    k.color(150, 150, 150)
  ]);

  k.add([
    k.text("WASD to move, weapons fire automatically", { size: 10 }),
    k.pos(400, 530),
    k.anchor("center"),
    k.color(120, 120, 120)
  ]);

  k.onKeyPress("space", () => {
    initAudio();
    playSound("buy");
    resetGame();
    k.go("game");
  });
});

k.scene("game", () => {
  gameState.waveTimer = gameState.waveDuration;
  let enemies = [];
  let projectiles = [];
  let pickups = [];
  let isPaused = false;
  let levelUpPending = false;
  let levelUpChoices = [];

  // Arena background
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(35, 35, 50)
  ]);

  // Arena border
  k.add([
    k.rect(760, 520),
    k.pos(20, 60),
    k.color(45, 45, 60),
    k.outline(2, k.rgb(80, 80, 100))
  ]);

  // Player
  const player = k.add([
    k.circle(16),
    k.pos(400, 330),
    k.color(200, 170, 100),
    k.area(),
    k.anchor("center"),
    "player"
  ]);

  // Eyes
  const leftEye = k.add([
    k.circle(4),
    k.pos(player.pos.x - 6, player.pos.y - 4),
    k.color(50, 50, 50),
    k.anchor("center")
  ]);

  const rightEye = k.add([
    k.circle(4),
    k.pos(player.pos.x + 6, player.pos.y - 4),
    k.color(50, 50, 50),
    k.anchor("center")
  ]);

  // Weapon cooldowns
  let weaponCooldowns = gameState.weapons.map(() => 0);

  // Movement
  k.onUpdate(() => {
    if (isPaused || levelUpPending) return;

    const dir = k.vec2(0, 0);
    if (k.isKeyDown("w") || k.isKeyDown("up")) dir.y -= 1;
    if (k.isKeyDown("s") || k.isKeyDown("down")) dir.y += 1;
    if (k.isKeyDown("a") || k.isKeyDown("left")) dir.x -= 1;
    if (k.isKeyDown("d") || k.isKeyDown("right")) dir.x += 1;

    if (dir.len() > 0) {
      dir.unit();
      const speed = 200 * (1 + playerStats.speed / 100);
      player.pos.x = Math.max(40, Math.min(760, player.pos.x + dir.x * speed * k.dt()));
      player.pos.y = Math.max(80, Math.min(560, player.pos.y + dir.y * speed * k.dt()));
    }

    // Update eyes position
    leftEye.pos = k.vec2(player.pos.x - 6, player.pos.y - 4);
    rightEye.pos = k.vec2(player.pos.x + 6, player.pos.y - 4);

    // HP Regen
    if (playerStats.hpRegen > 0) {
      const regenRate = 0.2 + (playerStats.hpRegen - 1) * 0.089;
      playerStats.hp = Math.min(playerStats.maxHP, playerStats.hp + regenRate * k.dt());
    }

    // Wave timer
    gameState.waveTimer -= k.dt();

    if (gameState.waveTimer <= 0) {
      // Wave complete
      playSound("waveComplete");
      saveGame();
      k.go("shop");
    }
  });

  // Enemy spawning
  function spawnEnemy() {
    if (isPaused || levelUpPending) return;

    // Select enemy type based on wave
    let typeIndex = 0;
    if (gameState.wave >= 15) typeIndex = Math.floor(Math.random() * 5);
    else if (gameState.wave >= 10) typeIndex = Math.floor(Math.random() * 4);
    else if (gameState.wave >= 5) typeIndex = Math.floor(Math.random() * 3);
    else if (gameState.wave >= 3) typeIndex = Math.floor(Math.random() * 2);

    const type = enemyTypes[typeIndex];

    // Spawn from edge
    let x, y;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = 20; y = 80 + Math.random() * 480; }
    else if (side === 1) { x = 780; y = 80 + Math.random() * 480; }
    else if (side === 2) { x = 40 + Math.random() * 720; y = 60; }
    else { x = 40 + Math.random() * 720; y = 580; }

    const enemy = k.add([
      k.circle(type.size / 2),
      k.pos(x, y),
      k.color(...type.color),
      k.area(),
      k.anchor("center"),
      "enemy",
      {
        health: type.health * (1 + (gameState.wave - 1) * 0.1),
        maxHealth: type.health * (1 + (gameState.wave - 1) * 0.1),
        damage: type.damage,
        speed: type.speed,
        xp: type.xp,
        materials: type.materials,
        type: type
      }
    ]);

    enemies.push(enemy);
  }

  // Spawn rate based on wave
  const spawnInterval = Math.max(0.3, 1.5 - gameState.wave * 0.05);
  k.loop(spawnInterval, spawnEnemy);

  // Enemy AI
  k.onUpdate("enemy", (enemy) => {
    if (isPaused || levelUpPending) return;

    const dir = player.pos.sub(enemy.pos).unit();
    enemy.pos = enemy.pos.add(dir.scale(enemy.speed * k.dt()));
  });

  // Weapon firing
  k.onUpdate(() => {
    if (isPaused || levelUpPending) return;

    gameState.weapons.forEach((weapon, idx) => {
      weaponCooldowns[idx] -= k.dt();

      if (weaponCooldowns[idx] <= 0 && enemies.length > 0) {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;

        enemies.forEach(e => {
          if (!e.isKilled) {
            const dist = player.pos.dist(e.pos);
            const weaponRange = weapon.range + playerStats.range;
            if (dist < nearestDist && dist < weaponRange) {
              nearest = e;
              nearestDist = dist;
            }
          }
        });

        if (nearest) {
          fireWeapon(weapon, nearest);
          const cooldown = weapon.cooldown / (1 + playerStats.attackSpeed / 100);
          weaponCooldowns[idx] = Math.max(1/12, cooldown);
        }
      }
    });
  });

  function fireWeapon(weapon, target) {
    playSound("shoot");
    const dir = target.pos.sub(player.pos).unit();

    if (weapon.type === "melee") {
      // Melee attack
      const damage = calculateDamage(weapon);
      enemies.forEach(e => {
        if (!e.isKilled && player.pos.dist(e.pos) < weapon.range + 20) {
          dealDamage(e, damage);
        }
      });

      // Visual effect
      const slash = k.add([
        k.rect(weapon.range, 10),
        k.pos(player.pos.add(dir.scale(weapon.range / 2))),
        k.anchor("center"),
        k.color(...weapon.color),
        k.rotate(Math.atan2(dir.y, dir.x) * 180 / Math.PI),
        k.opacity(0.8)
      ]);
      k.wait(0.1, () => slash.destroy());

    } else if (weapon.pellets) {
      // Shotgun
      for (let i = 0; i < weapon.pellets; i++) {
        const spread = (Math.random() - 0.5) * 0.5;
        const spreadDir = k.vec2(
          dir.x * Math.cos(spread) - dir.y * Math.sin(spread),
          dir.x * Math.sin(spread) + dir.y * Math.cos(spread)
        );
        createProjectile(weapon, spreadDir);
      }
    } else {
      createProjectile(weapon, dir);
    }
  }

  function createProjectile(weapon, dir) {
    const proj = k.add([
      k.circle(4),
      k.pos(player.pos),
      k.color(...weapon.color),
      k.anchor("center"),
      "projectile",
      {
        weapon: weapon,
        dir: dir,
        damage: calculateDamage(weapon),
        distance: 0,
        maxDistance: weapon.range + playerStats.range,
        pierce: weapon.pierce || false,
        explosive: weapon.explosive || false,
        hitEnemies: []
      }
    ]);
    projectiles.push(proj);
  }

  function calculateDamage(weapon) {
    let damage = weapon.baseDamage;
    damage *= (1 + playerStats.damage / 100);

    // Crit
    if (Math.random() * 100 < playerStats.critChance) {
      damage *= 2;
    }

    return Math.max(1, Math.floor(damage));
  }

  function dealDamage(enemy, damage) {
    enemy.health -= damage;
    playSound("hit");

    // Life steal
    if (Math.random() * 100 < playerStats.lifeSteal) {
      playerStats.hp = Math.min(playerStats.maxHP, playerStats.hp + 1);
    }

    // Damage number
    const dmgText = k.add([
      k.text("-" + damage, { size: 12 }),
      k.pos(enemy.pos),
      k.color(255, 100, 100),
      k.anchor("center")
    ]);
    dmgText.onUpdate(() => {
      dmgText.pos.y -= 40 * k.dt();
      dmgText.opacity -= 2 * k.dt();
      if (dmgText.opacity <= 0) dmgText.destroy();
    });

    if (enemy.health <= 0) {
      killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    gameState.kills++;

    // Spawn XP pickup
    const xpPickup = k.add([
      k.circle(6),
      k.pos(enemy.pos),
      k.color(100, 200, 255),
      k.area(),
      k.anchor("center"),
      "xp",
      { value: enemy.xp + playerStats.harvesting }
    ]);
    pickups.push(xpPickup);

    // Spawn materials (chance)
    if (Math.random() < 0.5) {
      const matPickup = k.add([
        k.rect(8, 8),
        k.pos(enemy.pos.add(k.vec2(Math.random() * 20 - 10, Math.random() * 20 - 10))),
        k.color(255, 200, 50),
        k.area(),
        k.anchor("center"),
        "material",
        { value: enemy.materials + Math.floor(playerStats.harvesting / 2) }
      ]);
      pickups.push(matPickup);
    }

    enemies = enemies.filter(e => e !== enemy);
    enemy.destroy();
  }

  // Projectile update
  k.onUpdate("projectile", (proj) => {
    if (isPaused || levelUpPending) return;

    proj.pos = proj.pos.add(proj.dir.scale(400 * k.dt()));
    proj.distance += 400 * k.dt();

    if (proj.distance > proj.maxDistance) {
      projectiles = projectiles.filter(p => p !== proj);
      proj.destroy();
      return;
    }

    // Check enemy collisions
    enemies.forEach(e => {
      if (!e.isKilled && !proj.hitEnemies.includes(e) && proj.pos.dist(e.pos) < e.type.size) {
        if (proj.explosive) {
          // Explosion
          enemies.forEach(ae => {
            if (!ae.isKilled && proj.pos.dist(ae.pos) < 60) {
              dealDamage(ae, proj.damage);
            }
          });
          // Visual
          const explosion = k.add([
            k.circle(30),
            k.pos(proj.pos),
            k.color(255, 150, 50),
            k.anchor("center"),
            k.opacity(0.7)
          ]);
          k.wait(0.15, () => explosion.destroy());
        } else {
          dealDamage(e, proj.damage);
        }

        proj.hitEnemies.push(e);

        if (!proj.pierce) {
          projectiles = projectiles.filter(p => p !== proj);
          proj.destroy();
        }
      }
    });
  });

  // Pickup collection
  k.onUpdate(() => {
    if (isPaused || levelUpPending) return;

    pickups.forEach(pickup => {
      if (!pickup.isKilled) {
        const dist = player.pos.dist(pickup.pos);
        if (dist < 80) {
          // Attract to player
          const dir = player.pos.sub(pickup.pos).unit();
          pickup.pos = pickup.pos.add(dir.scale(200 * k.dt()));
        }
        if (dist < 25) {
          playSound("pickup");
          if (pickup.is("xp")) {
            gameState.xp += pickup.value;
            checkLevelUp();
          } else if (pickup.is("material")) {
            gameState.materials += pickup.value;
          }
          pickups = pickups.filter(p => p !== pickup);
          pickup.destroy();
        }
      }
    });
  });

  function checkLevelUp() {
    while (gameState.xp >= gameState.xpToLevel) {
      gameState.xp -= gameState.xpToLevel;
      gameState.level++;
      playerStats.maxHP += 1;
      playerStats.hp = Math.min(playerStats.hp + 1, playerStats.maxHP);
      gameState.xpToLevel = Math.floor(gameState.xpToLevel * 1.2);
      playSound("levelup");

      // Show level up choices
      levelUpPending = true;
      levelUpChoices = [];
      const shuffled = [...levelUpOptions].sort(() => Math.random() - 0.5);
      levelUpChoices = shuffled.slice(0, 3);
      showLevelUpUI();
    }
  }

  let levelUpUI = [];
  function showLevelUpUI() {
    // Background
    const bg = k.add([
      k.rect(400, 250, { radius: 10 }),
      k.pos(400, 300),
      k.anchor("center"),
      k.color(30, 30, 50),
      k.z(100)
    ]);
    levelUpUI.push(bg);

    const title = k.add([
      k.text("LEVEL UP!", { size: 24 }),
      k.pos(400, 200),
      k.anchor("center"),
      k.color(255, 200, 100),
      k.z(101)
    ]);
    levelUpUI.push(title);

    levelUpChoices.forEach((choice, i) => {
      const btn = k.add([
        k.rect(300, 40, { radius: 6 }),
        k.pos(400, 260 + i * 55),
        k.anchor("center"),
        k.color(50, 80, 50),
        k.area(),
        k.z(101)
      ]);

      const label = k.add([
        k.text(choice.name, { size: 16 }),
        k.pos(400, 260 + i * 55),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.z(102)
      ]);

      btn.onClick(() => {
        playerStats[choice.stat] += choice.value;
        playSound("buy");
        levelUpUI.forEach(el => el.destroy());
        levelUpUI = [];
        levelUpPending = false;
      });

      btn.onHover(() => btn.color = k.rgb(70, 110, 70));
      btn.onHoverEnd(() => btn.color = k.rgb(50, 80, 50));

      levelUpUI.push(btn, label);
    });
  }

  // Player-enemy collision
  k.onUpdate(() => {
    if (isPaused || levelUpPending) return;

    enemies.forEach(e => {
      if (!e.isKilled && player.pos.dist(e.pos) < 20) {
        // Dodge check
        if (Math.random() * 100 >= Math.min(60, playerStats.dodge)) {
          // Take damage
          let damage = e.damage;
          // Armor reduction
          damage = Math.max(1, damage * (1 - playerStats.armor / (playerStats.armor + 15)));
          playerStats.hp -= damage;

          playSound("hit");

          if (playerStats.hp <= 0) {
            playSound("death");
            k.go("gameOver");
          }
        }

        // Push enemy back
        const pushDir = e.pos.sub(player.pos).unit();
        e.pos = e.pos.add(pushDir.scale(30));
      }
    });
  });

  // HUD
  k.onDraw(() => {
    // Wave info
    k.drawText({
      text: `Wave ${gameState.wave}/${gameState.maxWaves}`,
      pos: k.vec2(400, 20),
      size: 20,
      color: k.rgb(255, 200, 100),
      anchor: "center"
    });

    // Timer
    k.drawText({
      text: Math.ceil(gameState.waveTimer) + "s",
      pos: k.vec2(400, 45),
      size: 14,
      color: k.rgb(200, 200, 200),
      anchor: "center"
    });

    // Health bar
    k.drawRect({
      pos: k.vec2(20, 20),
      width: 120,
      height: 16,
      color: k.rgb(60, 30, 30)
    });
    k.drawRect({
      pos: k.vec2(22, 22),
      width: Math.max(0, (playerStats.hp / playerStats.maxHP) * 116),
      height: 12,
      color: k.rgb(200, 60, 60)
    });
    k.drawText({
      text: Math.floor(playerStats.hp) + "/" + playerStats.maxHP,
      pos: k.vec2(80, 28),
      size: 10,
      color: k.rgb(255, 255, 255),
      anchor: "center"
    });

    // XP bar
    k.drawRect({
      pos: k.vec2(20, 42),
      width: 120,
      height: 10,
      color: k.rgb(30, 30, 60)
    });
    k.drawRect({
      pos: k.vec2(21, 43),
      width: Math.min(118, (gameState.xp / gameState.xpToLevel) * 118),
      height: 8,
      color: k.rgb(100, 150, 255)
    });

    // Level
    k.drawText({
      text: "Lv." + gameState.level,
      pos: k.vec2(150, 26),
      size: 14,
      color: k.rgb(200, 200, 255)
    });

    // Materials
    k.drawText({
      text: "$" + gameState.materials,
      pos: k.vec2(700, 26),
      size: 16,
      color: k.rgb(255, 200, 50)
    });

    // Kills
    k.drawText({
      text: "Kills: " + gameState.kills,
      pos: k.vec2(700, 50),
      size: 12,
      color: k.rgb(200, 200, 200)
    });
  });

  // Pause
  k.onKeyPress("escape", () => {
    if (levelUpPending) return;
    isPaused = !isPaused;
  });
});

k.scene("shop", () => {
  gameState.wave++;

  if (gameState.wave > gameState.maxWaves) {
    k.go("victory");
    return;
  }

  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(30, 30, 45)
  ]);

  k.add([
    k.text("SHOP", { size: 36 }),
    k.pos(400, 40),
    k.anchor("center"),
    k.color(255, 200, 100)
  ]);

  k.add([
    k.text("Wave " + (gameState.wave - 1) + " Complete!", { size: 16 }),
    k.pos(400, 75),
    k.anchor("center"),
    k.color(150, 255, 150)
  ]);

  // Materials display
  const matDisplay = k.add([
    k.text("$" + gameState.materials, { size: 20 }),
    k.pos(700, 40),
    k.anchor("center"),
    k.color(255, 200, 50)
  ]);

  // Current weapons
  k.add([
    k.text("Weapons:", { size: 14 }),
    k.pos(50, 110),
    k.color(200, 200, 200)
  ]);

  gameState.weapons.forEach((weapon, i) => {
    k.add([
      k.rect(100, 25, { radius: 4 }),
      k.pos(60 + i * 110, 140),
      k.color(...weapon.color)
    ]);
    k.add([
      k.text(weapon.name, { size: 10 }),
      k.pos(110 + i * 110, 152),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);
  });

  // Buy weapons
  k.add([
    k.text("Buy Weapons:", { size: 14 }),
    k.pos(50, 180),
    k.color(200, 200, 200)
  ]);

  const availableWeapons = weaponTypes.filter(w => w.tier <= Math.ceil(gameState.wave / 5));
  availableWeapons.slice(0, 4).forEach((weapon, i) => {
    const cost = weapon.tier * 25;
    const canBuy = gameState.materials >= cost && gameState.weapons.length < gameState.weaponSlots;

    const btn = k.add([
      k.rect(170, 35, { radius: 4 }),
      k.pos(60 + i * 180, 210),
      k.color(canBuy ? 50 : 30, canBuy ? 70 : 40, canBuy ? 50 : 30),
      k.area()
    ]);

    k.add([
      k.text(weapon.name + " $" + cost, { size: 12 }),
      k.pos(145 + i * 180, 227),
      k.anchor("center"),
      k.color(canBuy ? 255 : 100, canBuy ? 255 : 100, canBuy ? 255 : 100)
    ]);

    if (canBuy) {
      btn.onClick(() => {
        gameState.materials -= cost;
        gameState.weapons.push({ ...weapon });
        playSound("buy");
        k.go("shop");
      });
    }
  });

  // Buy upgrades
  k.add([
    k.text("Buy Upgrades:", { size: 14 }),
    k.pos(50, 270),
    k.color(200, 200, 200)
  ]);

  const shuffledItems = [...shopItems].sort(() => Math.random() - 0.5).slice(0, 6);
  shuffledItems.forEach((item, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const canBuy = gameState.materials >= item.cost;

    const btn = k.add([
      k.rect(230, 40, { radius: 4 }),
      k.pos(50 + col * 250, 300 + row * 55),
      k.color(canBuy ? 50 : 30, canBuy ? 50 : 30, canBuy ? 80 : 50),
      k.area()
    ]);

    k.add([
      k.text(item.name + " $" + item.cost, { size: 11 }),
      k.pos(165 + col * 250, 320 + row * 55),
      k.anchor("center"),
      k.color(canBuy ? 255 : 100, canBuy ? 255 : 100, canBuy ? 255 : 100)
    ]);

    if (canBuy) {
      btn.onClick(() => {
        gameState.materials -= item.cost;
        playerStats[item.stat] += item.value;
        if (item.stat === "maxHP") {
          playerStats.hp += item.value;
        }
        playSound("buy");
        matDisplay.text = "$" + gameState.materials;
      });
    }
  });

  // Stats display
  k.add([
    k.text("Stats:", { size: 14 }),
    k.pos(50, 430),
    k.color(200, 200, 200)
  ]);

  const stats = [
    `HP: ${Math.floor(playerStats.hp)}/${playerStats.maxHP}`,
    `Dmg: +${playerStats.damage}%`,
    `AtkSpd: +${playerStats.attackSpeed}%`,
    `Crit: ${playerStats.critChance}%`,
    `Armor: ${playerStats.armor}`,
    `Dodge: ${playerStats.dodge}%`,
    `Speed: +${playerStats.speed}%`
  ];

  stats.forEach((stat, i) => {
    k.add([
      k.text(stat, { size: 10 }),
      k.pos(50 + (i % 4) * 180, 455 + Math.floor(i / 4) * 20),
      k.color(180, 180, 180)
    ]);
  });

  // Continue button
  const contBtn = k.add([
    k.rect(200, 50, { radius: 8 }),
    k.pos(400, 540),
    k.anchor("center"),
    k.color(60, 120, 60),
    k.area()
  ]);

  k.add([
    k.text("Start Wave " + gameState.wave, { size: 18 }),
    k.pos(400, 540),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  contBtn.onClick(() => {
    playerStats.hp = Math.min(playerStats.hp + 2, playerStats.maxHP);
    saveGame();
    playSound("buy");
    k.go("game");
  });

  k.onKeyPress("space", () => {
    playerStats.hp = Math.min(playerStats.hp + 2, playerStats.maxHP);
    saveGame();
    playSound("buy");
    k.go("game");
  });
});

k.scene("gameOver", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 10, 10)
  ]);

  k.add([
    k.text("GAME OVER", { size: 48 }),
    k.pos(400, 150),
    k.anchor("center"),
    k.color(255, 100, 100)
  ]);

  k.add([
    k.text("You survived " + (gameState.wave - 1) + " waves", { size: 20 }),
    k.pos(400, 220),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  k.add([
    k.text("Kills: " + gameState.kills, { size: 16 }),
    k.pos(400, 280),
    k.anchor("center"),
    k.color(150, 150, 150)
  ]);

  k.add([
    k.text("Level: " + gameState.level, { size: 16 }),
    k.pos(400, 310),
    k.anchor("center"),
    k.color(150, 150, 150)
  ]);

  localStorage.removeItem("brotato_save");

  const retryBtn = k.add([
    k.rect(180, 45, { radius: 6 }),
    k.pos(400, 400),
    k.anchor("center"),
    k.color(60, 100, 60),
    k.area()
  ]);

  k.add([
    k.text("Try Again", { size: 18 }),
    k.pos(400, 400),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  retryBtn.onClick(() => {
    resetGame();
    k.go("game");
  });

  const menuBtn = k.add([
    k.rect(180, 45, { radius: 6 }),
    k.pos(400, 460),
    k.anchor("center"),
    k.color(80, 60, 60),
    k.area()
  ]);

  k.add([
    k.text("Main Menu", { size: 18 }),
    k.pos(400, 460),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  menuBtn.onClick(() => k.go("menu"));

  k.onKeyPress("space", () => {
    resetGame();
    k.go("game");
  });
});

k.scene("victory", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 30, 20)
  ]);

  k.add([
    k.text("VICTORY!", { size: 56 }),
    k.pos(400, 140),
    k.anchor("center"),
    k.color(100, 255, 100)
  ]);

  k.add([
    k.text("You survived all 20 waves!", { size: 20 }),
    k.pos(400, 210),
    k.anchor("center"),
    k.color(200, 255, 200)
  ]);

  k.add([
    k.text("Total Kills: " + gameState.kills, { size: 18 }),
    k.pos(400, 280),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  k.add([
    k.text("Final Level: " + gameState.level, { size: 18 }),
    k.pos(400, 320),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  k.add([
    k.text("Weapons: " + gameState.weapons.length, { size: 18 }),
    k.pos(400, 360),
    k.anchor("center"),
    k.color(200, 200, 200)
  ]);

  localStorage.removeItem("brotato_save");

  const menuBtn = k.add([
    k.rect(200, 50, { radius: 8 }),
    k.pos(400, 480),
    k.anchor("center"),
    k.color(60, 100, 60),
    k.area()
  ]);

  k.add([
    k.text("Main Menu", { size: 20 }),
    k.pos(400, 480),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  menuBtn.onClick(() => k.go("menu"));

  playSound("waveComplete");
});

// Start
k.go("menu");
