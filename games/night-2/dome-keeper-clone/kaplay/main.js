const k = kaplay({
  width: 800,
  height: 600,
  background: [30, 25, 20],
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

  if (type === "drill") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100 + Math.random() * 50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    duration = 0.08;
  } else if (type === "collect") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.setValueAtTime(700, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    duration = 0.12;
  } else if (type === "laser") {
    osc.type = "square";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    duration = 0.2;
  } else if (type === "hit") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    duration = 0.15;
  } else if (type === "upgrade") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.setValueAtTime(600, t + 0.1);
    osc.frequency.setValueAtTime(800, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    duration = 0.3;
  } else if (type === "warning") {
    osc.type = "square";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    duration = 0.4;
  } else if (type === "death") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 1);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
    duration = 1.2;
  } else if (type === "victory") {
    osc.type = "sine";
    const t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.2);
    osc.frequency.setValueAtTime(784, t + 0.4);
    osc.frequency.setValueAtTime(1047, t + 0.6);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    duration = 0.8;
  }

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Game Constants
const TILE_SIZE = 20;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 25;
const DOME_X = MAP_WIDTH / 2;
const DOME_Y = 3;

// Game State
let gameState = {
  iron: 0,
  water: 0,
  cobalt: 0,
  domeHealth: 100,
  maxDomeHealth: 100,
  wave: 0,
  phase: "mining", // mining or defense
  waveTimer: 60,
  relicsFound: 0,
  relicsNeeded: 3
};

let playerStats = {
  drillStrength: 2,
  maxSpeed: 56,
  carryCapacity: 3,
  speedLossPerResource: 5.7,
  inventory: []
};

let domeStats = {
  laserDamage: 10,
  laserCooldown: 0.5,
  fireRate: 1
};

// Map generation
let tiles = [];

function generateMap() {
  tiles = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (y < 3) {
        // Sky
        tiles[y][x] = { type: "sky", health: 0, maxHealth: 0 };
      } else if (y === 3 && x >= DOME_X - 2 && x <= DOME_X + 2) {
        // Dome area
        tiles[y][x] = { type: "dome", health: 0, maxHealth: 0 };
      } else {
        // Underground
        const depth = y - 3;
        const rand = Math.random();

        if (rand < 0.05 + depth * 0.002) {
          // Cobalt (deeper = more)
          tiles[y][x] = { type: "cobalt", health: 14, maxHealth: 14, resource: 1 + Math.floor(Math.random() * 3) };
        } else if (rand < 0.12 + depth * 0.001) {
          // Water
          tiles[y][x] = { type: "water", health: 10, maxHealth: 10, resource: 1 + Math.floor(Math.random() * 3) };
        } else if (rand < 0.25) {
          // Iron
          tiles[y][x] = { type: "iron", health: 12, maxHealth: 12, resource: 1 + Math.floor(Math.random() * 4) };
        } else if (rand < 0.4 + depth * 0.01) {
          // Hard rock
          tiles[y][x] = { type: "hardRock", health: 16 + depth, maxHealth: 16 + depth };
        } else if (rand < 0.6 + depth * 0.01) {
          // Medium dirt
          tiles[y][x] = { type: "mediumDirt", health: 8 + depth * 0.5, maxHealth: 8 + depth * 0.5 };
        } else {
          // Soft dirt
          tiles[y][x] = { type: "softDirt", health: 4, maxHealth: 4 };
        }
      }
    }
  }

  // Place relic chambers deep underground
  for (let i = 0; i < gameState.relicsNeeded; i++) {
    const rx = 5 + Math.floor(Math.random() * (MAP_WIDTH - 10));
    const ry = 15 + Math.floor(Math.random() * 8);
    tiles[ry][rx] = { type: "relic", health: 24, maxHealth: 24, collected: false };
  }
}

// Save/Load
function saveGame() {
  const saveData = {
    gameState,
    playerStats,
    domeStats,
    tiles,
    timestamp: Date.now()
  };
  localStorage.setItem("dome_keeper_save", JSON.stringify(saveData));
}

function loadGame() {
  const data = localStorage.getItem("dome_keeper_save");
  if (data) {
    try {
      const saveData = JSON.parse(data);
      gameState = saveData.gameState;
      playerStats = saveData.playerStats;
      domeStats = saveData.domeStats;
      tiles = saveData.tiles;
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function resetGame() {
  gameState = {
    iron: 0, water: 0, cobalt: 0,
    domeHealth: 100, maxDomeHealth: 100,
    wave: 0, phase: "mining", waveTimer: 60,
    relicsFound: 0, relicsNeeded: 3
  };
  playerStats = {
    drillStrength: 2, maxSpeed: 56, carryCapacity: 3,
    speedLossPerResource: 5.7, inventory: []
  };
  domeStats = {
    laserDamage: 10, laserCooldown: 0.5, fireRate: 1
  };
  generateMap();
}

// Tile colors
const tileColors = {
  sky: [100, 150, 200],
  dome: [150, 150, 180],
  softDirt: [139, 90, 43],
  mediumDirt: [101, 67, 33],
  hardRock: [80, 80, 90],
  iron: [180, 140, 80],
  water: [100, 180, 220],
  cobalt: [80, 100, 200],
  relic: [200, 150, 255],
  empty: [50, 40, 35]
};

// Scenes
k.scene("menu", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(30, 25, 20)
  ]);

  k.add([
    k.text("DOME KEEPER", { size: 48 }),
    k.pos(400, 100),
    k.anchor("center"),
    k.color(200, 180, 150)
  ]);

  k.add([
    k.text("Mining Defense", { size: 20 }),
    k.pos(400, 150),
    k.anchor("center"),
    k.color(150, 130, 100)
  ]);

  // Dome icon
  k.add([
    k.circle(50),
    k.pos(400, 250),
    k.anchor("center"),
    k.color(150, 150, 180)
  ]);

  const hasSave = localStorage.getItem("dome_keeper_save") !== null;

  const newBtn = k.add([
    k.rect(180, 45, { radius: 6 }),
    k.pos(400, 350),
    k.anchor("center"),
    k.color(100, 80, 60),
    k.area()
  ]);

  k.add([
    k.text("New Game", { size: 20 }),
    k.pos(400, 350),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  newBtn.onClick(() => {
    initAudio();
    playSound("upgrade");
    resetGame();
    k.go("game");
  });

  if (hasSave) {
    const contBtn = k.add([
      k.rect(180, 45, { radius: 6 }),
      k.pos(400, 410),
      k.anchor("center"),
      k.color(60, 80, 100),
      k.area()
    ]);

    k.add([
      k.text("Continue", { size: 20 }),
      k.pos(400, 410),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    contBtn.onClick(() => {
      initAudio();
      playSound("upgrade");
      loadGame();
      k.go("game");
    });
  }

  k.add([
    k.text("Mine resources, defend your dome!", { size: 14 }),
    k.pos(400, 500),
    k.anchor("center"),
    k.color(120, 100, 80)
  ]);

  k.add([
    k.text("WASD to move, Space to drill/collect", { size: 12 }),
    k.pos(400, 530),
    k.anchor("center"),
    k.color(100, 80, 60)
  ]);

  k.onKeyPress("space", () => {
    initAudio();
    playSound("upgrade");
    if (hasSave) {
      loadGame();
    } else {
      resetGame();
    }
    k.go("game");
  });
});

k.scene("game", () => {
  let enemies = [];
  let projectiles = [];
  let laserCooldown = 0;
  let drillTimer = 0;
  const DRILL_INTERVAL = 0.35;

  // Draw tiles
  function drawTiles() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE + 100;

        if (tile.type === "empty" || tile.health <= 0) {
          k.drawRect({
            pos: k.vec2(px, py),
            width: TILE_SIZE,
            height: TILE_SIZE,
            color: k.rgb(...tileColors.empty)
          });
        } else {
          k.drawRect({
            pos: k.vec2(px, py),
            width: TILE_SIZE,
            height: TILE_SIZE,
            color: k.rgb(...tileColors[tile.type])
          });

          // Show damage
          if (tile.health < tile.maxHealth) {
            const damageRatio = 1 - tile.health / tile.maxHealth;
            k.drawRect({
              pos: k.vec2(px + 2, py + 2),
              width: (TILE_SIZE - 4) * damageRatio,
              height: 3,
              color: k.rgb(50, 50, 50)
            });
          }
        }
      }
    }
  }

  // Draw dome
  function drawDome() {
    const domeX = DOME_X * TILE_SIZE + TILE_SIZE / 2;
    const domeY = DOME_Y * TILE_SIZE + 100;

    // Dome structure
    k.drawCircle({
      pos: k.vec2(domeX, domeY),
      radius: 40,
      color: k.rgb(150, 150, 180)
    });

    // Dome glass
    k.drawCircle({
      pos: k.vec2(domeX, domeY - 10),
      radius: 25,
      color: k.rgb(180, 200, 220)
    });

    // Health bar
    k.drawRect({
      pos: k.vec2(domeX - 30, domeY - 60),
      width: 60,
      height: 8,
      color: k.rgb(60, 30, 30)
    });
    k.drawRect({
      pos: k.vec2(domeX - 29, domeY - 59),
      width: Math.max(0, 58 * (gameState.domeHealth / gameState.maxDomeHealth)),
      height: 6,
      color: k.rgb(200, 60, 60)
    });
  }

  // Player
  const player = k.add([
    k.rect(14, 14),
    k.pos(DOME_X * TILE_SIZE + 3, DOME_Y * TILE_SIZE + 110),
    k.color(255, 200, 100),
    k.anchor("center"),
    "player"
  ]);

  // Movement
  k.onUpdate(() => {
    const dir = k.vec2(0, 0);
    if (k.isKeyDown("w") || k.isKeyDown("up")) dir.y -= 1;
    if (k.isKeyDown("s") || k.isKeyDown("down")) dir.y += 1;
    if (k.isKeyDown("a") || k.isKeyDown("left")) dir.x -= 1;
    if (k.isKeyDown("d") || k.isKeyDown("right")) dir.x += 1;

    if (dir.len() > 0) {
      dir.unit();
      const carryPenalty = playerStats.inventory.length * playerStats.speedLossPerResource;
      const speed = Math.max(20, playerStats.maxSpeed - carryPenalty);
      player.pos.x = Math.max(10, Math.min(790, player.pos.x + dir.x * speed * k.dt()));
      player.pos.y = Math.max(110, Math.min(590, player.pos.y + dir.y * speed * k.dt()));
    }

    // Drilling
    if (k.isKeyDown("space")) {
      drillTimer += k.dt();
      if (drillTimer >= DRILL_INTERVAL) {
        drillTimer = 0;
        tryDrill();
      }
    }

    // Wave timer
    if (gameState.phase === "mining") {
      gameState.waveTimer -= k.dt();
      if (gameState.waveTimer <= 10 && gameState.waveTimer > 9.9) {
        playSound("warning");
      }
      if (gameState.waveTimer <= 0) {
        startDefensePhase();
      }
    }

    // Defense phase
    if (gameState.phase === "defense") {
      laserCooldown -= k.dt();

      // Spawn enemies
      if (Math.random() < 0.02 * (1 + gameState.wave * 0.1)) {
        spawnEnemy();
      }

      // Auto-fire laser at nearest enemy
      if (laserCooldown <= 0 && enemies.length > 0) {
        const nearest = enemies.reduce((a, b) =>
          getDomeDistance(a) < getDomeDistance(b) ? a : b
        );
        fireLaser(nearest);
        laserCooldown = domeStats.laserCooldown / domeStats.fireRate;
      }

      // Update enemies
      enemies.forEach(enemy => {
        if (!enemy.destroyed) {
          const domePos = k.vec2(DOME_X * TILE_SIZE + TILE_SIZE / 2, DOME_Y * TILE_SIZE + 110);
          const dir = domePos.sub(enemy.pos).unit();
          enemy.pos = enemy.pos.add(dir.scale(enemy.speed * k.dt()));

          // Attack dome
          if (enemy.pos.dist(domePos) < 50) {
            gameState.domeHealth -= enemy.damage;
            playSound("hit");
            enemy.destroyed = true;

            if (gameState.domeHealth <= 0) {
              playSound("death");
              k.go("gameOver");
            }
          }
        }
      });

      // Remove destroyed enemies
      enemies = enemies.filter(e => !e.destroyed);

      // Check wave end
      if (enemies.length === 0 && gameState.waveTimer <= -5) {
        endDefensePhase();
      }

      gameState.waveTimer -= k.dt();
    }

    // Check win
    if (gameState.relicsFound >= gameState.relicsNeeded) {
      playSound("victory");
      k.go("victory");
    }
  });

  function tryDrill() {
    const tileX = Math.floor(player.pos.x / TILE_SIZE);
    const tileY = Math.floor((player.pos.y - 100) / TILE_SIZE);

    // Check adjacent tiles
    const adjacent = [
      { x: tileX, y: tileY },
      { x: tileX + 1, y: tileY },
      { x: tileX - 1, y: tileY },
      { x: tileX, y: tileY + 1 }
    ];

    for (const pos of adjacent) {
      if (pos.x >= 0 && pos.x < MAP_WIDTH && pos.y >= 0 && pos.y < MAP_HEIGHT) {
        const tile = tiles[pos.y][pos.x];
        if (tile.health > 0 && tile.type !== "sky" && tile.type !== "dome") {
          tile.health -= playerStats.drillStrength;
          playSound("drill");

          if (tile.health <= 0) {
            // Tile destroyed
            if (tile.resource) {
              // Spawn resource pickup
              const pickup = k.add([
                k.rect(10, 10),
                k.pos(pos.x * TILE_SIZE + 5, pos.y * TILE_SIZE + 105),
                k.color(...tileColors[tile.type]),
                k.anchor("center"),
                "pickup",
                { type: tile.type, amount: tile.resource }
              ]);
            }

            if (tile.type === "relic" && !tile.collected) {
              tile.collected = true;
              gameState.relicsFound++;
              playSound("collect");
            }

            tile.type = "empty";
          }
          return;
        }
      }
    }
  }

  // Collect pickups
  k.onUpdate("pickup", (pickup) => {
    const dist = player.pos.dist(pickup.pos);
    if (dist < 30 && playerStats.inventory.length < playerStats.carryCapacity) {
      playSound("collect");
      playerStats.inventory.push({ type: pickup.type, amount: pickup.amount });
      pickup.destroy();
    }
  });

  // Deposit at dome
  k.onUpdate(() => {
    const domePos = k.vec2(DOME_X * TILE_SIZE + TILE_SIZE / 2, DOME_Y * TILE_SIZE + 110);
    if (player.pos.dist(domePos) < 50 && playerStats.inventory.length > 0) {
      playerStats.inventory.forEach(item => {
        if (item.type === "iron") gameState.iron += item.amount;
        else if (item.type === "water") gameState.water += item.amount;
        else if (item.type === "cobalt") gameState.cobalt += item.amount;
      });
      playerStats.inventory = [];
      playSound("collect");
    }
  });

  function getDomeDistance(enemy) {
    const domePos = k.vec2(DOME_X * TILE_SIZE + TILE_SIZE / 2, DOME_Y * TILE_SIZE + 110);
    return enemy.pos.dist(domePos);
  }

  function spawnEnemy() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const enemy = k.add([
      k.circle(12 + gameState.wave),
      k.pos(side < 0 ? -20 : 820, 150 + Math.random() * 50),
      k.color(150, 50, 50),
      k.anchor("center"),
      "enemy",
      {
        health: 20 + gameState.wave * 5,
        maxHealth: 20 + gameState.wave * 5,
        damage: 5 + gameState.wave * 2,
        speed: 30 + gameState.wave * 2,
        destroyed: false
      }
    ]);
    enemies.push(enemy);
  }

  function fireLaser(target) {
    playSound("laser");

    const domePos = k.vec2(DOME_X * TILE_SIZE + TILE_SIZE / 2, DOME_Y * TILE_SIZE + 110);
    const dir = target.pos.sub(domePos).unit();

    // Visual laser line
    const laser = k.add([
      k.rect(target.pos.dist(domePos), 3),
      k.pos(domePos),
      k.color(255, 100, 100),
      k.rotate(Math.atan2(dir.y, dir.x) * 180 / Math.PI),
      k.anchor("left"),
      k.opacity(1)
    ]);

    k.wait(0.1, () => laser.destroy());

    // Damage enemy
    target.health -= domeStats.laserDamage;
    if (target.health <= 0) {
      target.destroyed = true;
      target.destroy();
    }
  }

  function startDefensePhase() {
    gameState.phase = "defense";
    gameState.wave++;
    gameState.waveTimer = 0;
    playSound("warning");

    // Teleport player to dome
    player.pos = k.vec2(DOME_X * TILE_SIZE + 10, DOME_Y * TILE_SIZE + 130);
  }

  function endDefensePhase() {
    gameState.phase = "mining";
    gameState.waveTimer = 60 + gameState.wave * 5;
    enemies.forEach(e => e.destroy());
    enemies = [];
    saveGame();
    k.go("shop");
  }

  // Drawing
  k.onDraw(() => {
    drawTiles();
    drawDome();

    // HUD
    k.drawRect({
      pos: k.vec2(0, 0),
      width: 800,
      height: 95,
      color: k.rgb(40, 35, 30)
    });

    // Resources
    k.drawText({
      text: `Iron: ${gameState.iron}`,
      pos: k.vec2(20, 20),
      size: 18,
      color: k.rgb(180, 140, 80)
    });

    k.drawText({
      text: `Water: ${gameState.water}`,
      pos: k.vec2(120, 20),
      size: 18,
      color: k.rgb(100, 180, 220)
    });

    k.drawText({
      text: `Cobalt: ${gameState.cobalt}`,
      pos: k.vec2(230, 20),
      size: 18,
      color: k.rgb(80, 100, 200)
    });

    // Wave and phase
    k.drawText({
      text: `Wave ${gameState.wave}`,
      pos: k.vec2(400, 15),
      size: 20,
      color: k.rgb(200, 180, 150),
      anchor: "center"
    });

    k.drawText({
      text: gameState.phase === "mining" ? `Mining: ${Math.ceil(gameState.waveTimer)}s` : "DEFENSE!",
      pos: k.vec2(400, 40),
      size: 16,
      color: gameState.phase === "mining" ? k.rgb(150, 200, 150) : k.rgb(255, 100, 100),
      anchor: "center"
    });

    // Relics
    k.drawText({
      text: `Relics: ${gameState.relicsFound}/${gameState.relicsNeeded}`,
      pos: k.vec2(650, 20),
      size: 18,
      color: k.rgb(200, 150, 255)
    });

    // Inventory
    k.drawText({
      text: `Carrying: ${playerStats.inventory.length}/${playerStats.carryCapacity}`,
      pos: k.vec2(20, 55),
      size: 14,
      color: k.rgb(150, 150, 150)
    });

    // Dome health
    k.drawText({
      text: `Dome: ${Math.floor(gameState.domeHealth)}/${gameState.maxDomeHealth}`,
      pos: k.vec2(20, 75),
      size: 14,
      color: k.rgb(200, 100, 100)
    });
  });

  k.onKeyPress("escape", () => {
    saveGame();
    k.go("menu");
  });

  k.onKeyPress("e", () => {
    if (gameState.phase === "mining") {
      const domePos = k.vec2(DOME_X * TILE_SIZE + TILE_SIZE / 2, DOME_Y * TILE_SIZE + 110);
      if (player.pos.dist(domePos) < 60) {
        saveGame();
        k.go("shop");
      }
    }
  });
});

k.scene("shop", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(35, 30, 25)
  ]);

  k.add([
    k.text("UPGRADE SHOP", { size: 32 }),
    k.pos(400, 40),
    k.anchor("center"),
    k.color(200, 180, 150)
  ]);

  // Resources
  k.add([
    k.text(`Iron: ${gameState.iron}  Water: ${gameState.water}  Cobalt: ${gameState.cobalt}`, { size: 16 }),
    k.pos(400, 80),
    k.anchor("center"),
    k.color(150, 150, 150)
  ]);

  // Upgrades
  const upgrades = [
    { name: "Drill Power +5", cost: { iron: 4 }, effect: () => { playerStats.drillStrength += 5; } },
    { name: "Speed +20", cost: { iron: 4 }, effect: () => { playerStats.maxSpeed += 20; } },
    { name: "Carry +5", cost: { iron: 6 }, effect: () => { playerStats.carryCapacity += 5; playerStats.speedLossPerResource -= 1; } },
    { name: "Dome HP +25", cost: { iron: 5 }, effect: () => { gameState.maxDomeHealth += 25; gameState.domeHealth += 25; } },
    { name: "Laser Damage +5", cost: { iron: 6, cobalt: 2 }, effect: () => { domeStats.laserDamage += 5; } },
    { name: "Fire Rate +0.5", cost: { iron: 4, water: 2 }, effect: () => { domeStats.fireRate += 0.5; } },
    { name: "Repair Dome +20", cost: { water: 3 }, effect: () => { gameState.domeHealth = Math.min(gameState.maxDomeHealth, gameState.domeHealth + 20); } }
  ];

  upgrades.forEach((upg, i) => {
    const costText = Object.entries(upg.cost).map(([r, c]) => `${c} ${r}`).join(", ");
    const canBuy = Object.entries(upg.cost).every(([r, c]) => gameState[r] >= c);

    const btn = k.add([
      k.rect(350, 40, { radius: 6 }),
      k.pos(400, 140 + i * 55),
      k.anchor("center"),
      k.color(canBuy ? 80 : 40, canBuy ? 70 : 35, canBuy ? 60 : 30),
      k.area()
    ]);

    k.add([
      k.text(`${upg.name} (${costText})`, { size: 14 }),
      k.pos(400, 140 + i * 55),
      k.anchor("center"),
      k.color(canBuy ? 255 : 100, canBuy ? 255 : 100, canBuy ? 255 : 100)
    ]);

    if (canBuy) {
      btn.onClick(() => {
        Object.entries(upg.cost).forEach(([r, c]) => gameState[r] -= c);
        upg.effect();
        playSound("upgrade");
        k.go("shop");
      });
    }
  });

  // Continue button
  const contBtn = k.add([
    k.rect(200, 50, { radius: 8 }),
    k.pos(400, 540),
    k.anchor("center"),
    k.color(100, 80, 60),
    k.area()
  ]);

  k.add([
    k.text("Continue Mining", { size: 18 }),
    k.pos(400, 540),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  contBtn.onClick(() => {
    saveGame();
    playSound("upgrade");
    k.go("game");
  });

  k.onKeyPress("space", () => {
    saveGame();
    playSound("upgrade");
    k.go("game");
  });
});

k.scene("gameOver", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(30, 15, 15)
  ]);

  k.add([
    k.text("DOME DESTROYED", { size: 40 }),
    k.pos(400, 150),
    k.anchor("center"),
    k.color(200, 80, 80)
  ]);

  k.add([
    k.text(`Survived ${gameState.wave} waves`, { size: 20 }),
    k.pos(400, 220),
    k.anchor("center"),
    k.color(180, 150, 150)
  ]);

  k.add([
    k.text(`Relics found: ${gameState.relicsFound}/${gameState.relicsNeeded}`, { size: 18 }),
    k.pos(400, 260),
    k.anchor("center"),
    k.color(150, 130, 130)
  ]);

  localStorage.removeItem("dome_keeper_save");

  const retryBtn = k.add([
    k.rect(180, 45, { radius: 6 }),
    k.pos(400, 380),
    k.anchor("center"),
    k.color(100, 80, 60),
    k.area()
  ]);

  k.add([
    k.text("Try Again", { size: 20 }),
    k.pos(400, 380),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  retryBtn.onClick(() => {
    resetGame();
    k.go("game");
  });

  k.onKeyPress("space", () => {
    resetGame();
    k.go("game");
  });
});

k.scene("victory", () => {
  k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(20, 35, 20)
  ]);

  k.add([
    k.text("VICTORY!", { size: 56 }),
    k.pos(400, 140),
    k.anchor("center"),
    k.color(100, 255, 150)
  ]);

  k.add([
    k.text("All relics collected!", { size: 22 }),
    k.pos(400, 210),
    k.anchor("center"),
    k.color(150, 255, 180)
  ]);

  k.add([
    k.text(`Waves survived: ${gameState.wave}`, { size: 18 }),
    k.pos(400, 280),
    k.anchor("center"),
    k.color(180, 180, 180)
  ]);

  localStorage.removeItem("dome_keeper_save");

  const menuBtn = k.add([
    k.rect(180, 45, { radius: 6 }),
    k.pos(400, 400),
    k.anchor("center"),
    k.color(80, 100, 80),
    k.area()
  ]);

  k.add([
    k.text("Main Menu", { size: 20 }),
    k.pos(400, 400),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  menuBtn.onClick(() => k.go("menu"));
});

// Start
k.go("menu");
