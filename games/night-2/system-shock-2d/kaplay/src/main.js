const k = kaplay({
  width: 1280,
  height: 720,
  background: [10, 10, 20],
  canvas: document.createElement('canvas')
});

document.body.appendChild(k.canvas);

// Game state for testing
window.gameState = {
  scene: 'loading',
  health: 100,
  energy: 100,
  ammo: 24,
  kills: 0,
  currentDeck: 1,
  hasYellowKeycard: false,
  isHacking: false
};

// Constants
const TILE = 32;
const PLAYER_SPEED = 160;
const BULLET_SPEED = 400;
const ENEMY_SPEED = 80;

// Menu Scene
k.scene('menu', () => {
  window.gameState.scene = 'menu';

  k.add([
    k.text('SYSTEM SHOCK 2D', { size: 48 }),
    k.pos(k.width() / 2, 150),
    k.anchor('center'),
    k.color(255, 50, 50)
  ]);

  k.add([
    k.text('Whispers of M.A.R.I.A.', { size: 24 }),
    k.pos(k.width() / 2, 200),
    k.anchor('center'),
    k.color(150, 150, 150)
  ]);

  k.add([
    k.text('You awaken on the Von Braun with no memory.\nThe AI M.A.R.I.A. has gone rogue.\nSurvive. Escape.', { size: 16, align: 'center' }),
    k.pos(k.width() / 2, 300),
    k.anchor('center'),
    k.color(200, 200, 200)
  ]);

  const startBtn = k.add([
    k.rect(200, 50),
    k.pos(k.width() / 2, 450),
    k.anchor('center'),
    k.color(50, 80, 50),
    k.area(),
    'startBtn'
  ]);

  k.add([
    k.text('Start Game', { size: 20 }),
    k.pos(k.width() / 2, 450),
    k.anchor('center'),
    k.color(255, 255, 255)
  ]);

  k.add([
    k.text('Controls: WASD move, Mouse aim, Click shoot, E interact', { size: 14 }),
    k.pos(k.width() / 2, 550),
    k.anchor('center'),
    k.color(100, 100, 100)
  ]);

  startBtn.onClick(() => {
    k.go('game');
  });
});

// Game Scene
k.scene('game', () => {
  window.gameState.scene = 'game';
  window.gameState.health = 100;
  window.gameState.energy = 100;
  window.gameState.ammo = 24;
  window.gameState.kills = 0;
  window.gameState.hasYellowKeycard = false;

  // Map layout (simplified deck 1)
  const mapWidth = 25;
  const mapHeight = 20;
  const map = [];

  // Generate walls (border and some internal walls)
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (x === 0 || x === mapWidth - 1 || y === 0 || y === mapHeight - 1) {
        map.push({ x, y, type: 'wall' });
      }
    }
  }

  // Internal walls (create rooms)
  // Vertical wall with door
  for (let y = 0; y < 12; y++) {
    if (y !== 5 && y !== 6) {
      map.push({ x: 10, y, type: 'wall' });
    }
  }

  // Horizontal wall with door
  for (let x = 10; x < mapWidth; x++) {
    if (x !== 15 && x !== 16) {
      map.push({ x, y: 12, type: 'wall' });
    }
  }

  // Draw floor
  k.add([
    k.rect(mapWidth * TILE, mapHeight * TILE),
    k.pos(0, 0),
    k.color(30, 30, 40),
    k.z(-10)
  ]);

  // Draw walls
  map.forEach(tile => {
    if (tile.type === 'wall') {
      k.add([
        k.rect(TILE, TILE),
        k.pos(tile.x * TILE, tile.y * TILE),
        k.color(60, 60, 70),
        k.area(),
        k.body({ isStatic: true }),
        'wall'
      ]);
    }
  });

  // Exit door (locked, needs keycard)
  const exitDoor = k.add([
    k.rect(TILE * 2, TILE),
    k.pos(22 * TILE, 15 * TILE),
    k.color(255, 255, 0),
    k.area(),
    k.body({ isStatic: true }),
    'exitDoor'
  ]);

  // Keycard (yellow)
  const keycard = k.add([
    k.rect(20, 12),
    k.pos(3 * TILE, 15 * TILE),
    k.color(255, 255, 0),
    k.area(),
    k.scale(1),
    'keycard'
  ]);

  // Terminal (hackable)
  const terminal = k.add([
    k.rect(TILE, TILE),
    k.pos(18 * TILE, 3 * TILE),
    k.color(0, 100, 50),
    k.area(),
    'terminal'
  ]);

  // Health station
  const healthStation = k.add([
    k.rect(TILE, TILE),
    k.pos(5 * TILE, 3 * TILE),
    k.color(255, 50, 50),
    k.area(),
    'healthStation'
  ]);

  // Player
  const player = k.add([
    k.rect(24, 24),
    k.pos(2 * TILE, 10 * TILE),
    k.color(0, 200, 100),
    k.area(),
    k.body(),
    k.anchor('center'),
    k.rotate(0),
    'player'
  ]);

  // Enemies (Cyborg Drones)
  const enemies = [];

  function spawnEnemy(x, y) {
    const enemy = k.add([
      k.rect(28, 28),
      k.pos(x * TILE, y * TILE),
      k.color(150, 0, 0),
      k.area(),
      k.body(),
      k.anchor('center'),
      k.health(30),
      'enemy'
    ]);

    enemy.onCollide('bullet', (bullet) => {
      enemy.hurt(12);
      bullet.destroy();
      if (enemy.hp() <= 0) {
        enemy.destroy();
        window.gameState.kills++;
      }
    });

    enemies.push(enemy);
    return enemy;
  }

  // Spawn enemies
  spawnEnemy(15, 5);
  spawnEnemy(20, 8);
  spawnEnemy(18, 16);
  spawnEnemy(13, 3);

  // Bullets group
  const bullets = [];

  // Player movement
  k.onUpdate(() => {
    if (window.gameState.isHacking) return;

    const dir = k.vec2(0, 0);

    if (k.isKeyDown('w') || k.isKeyDown('up')) dir.y = -1;
    if (k.isKeyDown('s') || k.isKeyDown('down')) dir.y = 1;
    if (k.isKeyDown('a') || k.isKeyDown('left')) dir.x = -1;
    if (k.isKeyDown('d') || k.isKeyDown('right')) dir.x = 1;

    if (dir.len() > 0) {
      const normalized = dir.unit();
      player.move(normalized.scale(PLAYER_SPEED));
    }

    // Aim toward mouse
    const mousePos = k.mousePos();
    const angle = Math.atan2(mousePos.y - player.pos.y, mousePos.x - player.pos.x);
    player.angle = k.rad2deg(angle);

    // Update game state
    window.gameState.health = Math.max(0, window.gameState.health);
    window.gameState.energy = Math.min(100, window.gameState.energy + 0.02);
  });

  // Shoot
  k.onMousePress('left', () => {
    if (window.gameState.isHacking) return;
    if (window.gameState.ammo <= 0) return;

    window.gameState.ammo--;

    const angle = k.deg2rad(player.angle);
    const bulletDir = k.vec2(Math.cos(angle), Math.sin(angle));

    const bullet = k.add([
      k.rect(8, 4),
      k.pos(player.pos.add(bulletDir.scale(20))),
      k.color(255, 255, 0),
      k.area(),
      k.move(bulletDir, BULLET_SPEED),
      k.rotate(player.angle),
      k.opacity(1),
      k.lifespan(2),
      'bullet'
    ]);

    bullets.push(bullet);
  });

  // Bullet-wall collision
  k.onCollide('bullet', 'wall', (bullet) => {
    bullet.destroy();
  });

  // Enemy AI
  k.onUpdate('enemy', (enemy) => {
    if (!enemy.exists()) return;

    const toPlayer = player.pos.sub(enemy.pos);
    const dist = toPlayer.len();

    if (dist < 300 && dist > 40) {
      const dir = toPlayer.unit();
      enemy.move(dir.scale(ENEMY_SPEED));
    }

    // Enemy attack
    if (dist < 50) {
      if (!enemy.lastAttack || k.time() - enemy.lastAttack > 1.5) {
        window.gameState.health -= 10;
        enemy.lastAttack = k.time();
      }
    }
  });

  // Interact (E key)
  k.onKeyPress('e', () => {
    if (window.gameState.isHacking) return;

    // Check keycard pickup
    if (keycard.exists() && player.pos.dist(keycard.pos) < 60) {
      window.gameState.hasYellowKeycard = true;
      keycard.destroy();
    }

    // Check exit door
    if (player.pos.dist(exitDoor.pos) < 80) {
      if (window.gameState.hasYellowKeycard) {
        k.go('victory');
      }
    }

    // Check terminal (hacking)
    if (player.pos.dist(terminal.pos) < 60) {
      startHacking();
    }

    // Check health station
    if (player.pos.dist(healthStation.pos) < 60) {
      window.gameState.health = Math.min(100, window.gameState.health + 30);
      window.gameState.energy = Math.max(0, window.gameState.energy - 20);
    }
  });

  // Hacking mini-game (simplified)
  let hackingUI = null;
  let hackingTimer = 0;
  let hackingSuccess = false;

  function startHacking() {
    window.gameState.isHacking = true;
    hackingTimer = 10;
    hackingSuccess = false;

    // Create hacking UI overlay
    hackingUI = k.add([
      k.rect(400, 300),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor('center'),
      k.color(0, 30, 20),
      k.z(100),
      'hackUI'
    ]);

    k.add([
      k.text('HACKING: Security Terminal', { size: 18 }),
      k.pos(k.width() / 2, k.height() / 2 - 120),
      k.anchor('center'),
      k.color(0, 255, 100),
      k.z(101),
      'hackUI'
    ]);

    k.add([
      k.text('Press SPACE repeatedly to breach!', { size: 14 }),
      k.pos(k.width() / 2, k.height() / 2 - 80),
      k.anchor('center'),
      k.color(200, 200, 200),
      k.z(101),
      'hackUI'
    ]);

    // Progress bar background
    k.add([
      k.rect(300, 30),
      k.pos(k.width() / 2 - 150, k.height() / 2),
      k.color(50, 50, 50),
      k.z(101),
      'hackUI'
    ]);
  }

  let hackProgress = 0;

  k.onKeyPress('space', () => {
    if (window.gameState.isHacking) {
      hackProgress += 5;
      if (hackProgress >= 100) {
        hackingSuccess = true;
        endHacking(true);
      }
    }
  });

  k.onKeyPress('escape', () => {
    if (window.gameState.isHacking) {
      endHacking(false);
    }
  });

  function endHacking(success) {
    window.gameState.isHacking = false;
    hackProgress = 0;

    // Remove hacking UI
    k.get('hackUI').forEach(obj => obj.destroy());

    if (success) {
      // Reveal ammo location or disable cameras
      window.gameState.ammo += 12;
      terminal.color = k.rgb(0, 50, 100); // Terminal hacked
    }
  }

  // Check death
  k.onUpdate(() => {
    if (window.gameState.health <= 0) {
      k.go('gameover');
    }
  });

  // HUD
  const hudBg = k.add([
    k.rect(250, 100),
    k.pos(10, 10),
    k.color(0, 0, 0),
    k.opacity(0.7),
    k.fixed(),
    k.z(50)
  ]);

  const healthText = k.add([
    k.text('Health: 100', { size: 16 }),
    k.pos(20, 20),
    k.color(255, 80, 80),
    k.fixed(),
    k.z(51)
  ]);

  const energyText = k.add([
    k.text('Energy: 100', { size: 16 }),
    k.pos(20, 45),
    k.color(80, 150, 255),
    k.fixed(),
    k.z(51)
  ]);

  const ammoText = k.add([
    k.text('Ammo: 24', { size: 16 }),
    k.pos(20, 70),
    k.color(255, 255, 100),
    k.fixed(),
    k.z(51)
  ]);

  const keycardText = k.add([
    k.text('Keycard: NO', { size: 16 }),
    k.pos(20, 95),
    k.color(255, 255, 0),
    k.fixed(),
    k.z(51)
  ]);

  k.onUpdate(() => {
    healthText.text = `Health: ${Math.floor(window.gameState.health)}`;
    energyText.text = `Energy: ${Math.floor(window.gameState.energy)}`;
    ammoText.text = `Ammo: ${window.gameState.ammo}`;
    keycardText.text = `Keycard: ${window.gameState.hasYellowKeycard ? 'YES' : 'NO'}`;
  });

  // Camera follow
  k.onUpdate(() => {
    k.setCamPos(player.pos);
  });

  // M.A.R.I.A. message
  k.wait(2, () => {
    const mariaMsg = k.add([
      k.rect(500, 60),
      k.pos(k.width() / 2, 80),
      k.anchor('center'),
      k.color(50, 0, 0),
      k.opacity(0.9),
      k.fixed(),
      k.z(100),
      'maria'
    ]);

    k.add([
      k.text('"You\'re awake. Fascinating. Why do you resist perfection?"', { size: 14 }),
      k.pos(k.width() / 2, 80),
      k.anchor('center'),
      k.color(255, 100, 100),
      k.fixed(),
      k.z(101),
      'maria'
    ]);

    k.wait(4, () => {
      k.get('maria').forEach(obj => obj.destroy());
    });
  });
});

// Victory Scene
k.scene('victory', () => {
  window.gameState.scene = 'victory';

  k.add([
    k.text('ESCAPED!', { size: 64 }),
    k.pos(k.width() / 2, 200),
    k.anchor('center'),
    k.color(0, 255, 100)
  ]);

  k.add([
    k.text('You found the keycard and escaped the Von Braun.', { size: 18 }),
    k.pos(k.width() / 2, 300),
    k.anchor('center'),
    k.color(200, 200, 200)
  ]);

  k.add([
    k.text(`Enemies defeated: ${window.gameState.kills}`, { size: 16 }),
    k.pos(k.width() / 2, 370),
    k.anchor('center'),
    k.color(150, 150, 150)
  ]);

  k.add([
    k.text('"This isn\'t over, insect." - M.A.R.I.A.', { size: 14 }),
    k.pos(k.width() / 2, 450),
    k.anchor('center'),
    k.color(255, 100, 100)
  ]);

  const restartBtn = k.add([
    k.rect(200, 50),
    k.pos(k.width() / 2, 550),
    k.anchor('center'),
    k.color(50, 80, 50),
    k.area()
  ]);

  k.add([
    k.text('Play Again', { size: 20 }),
    k.pos(k.width() / 2, 550),
    k.anchor('center'),
    k.color(255, 255, 255)
  ]);

  restartBtn.onClick(() => k.go('menu'));
});

// Game Over Scene
k.scene('gameover', () => {
  window.gameState.scene = 'defeat';

  k.add([
    k.text('YOU DIED', { size: 64 }),
    k.pos(k.width() / 2, 200),
    k.anchor('center'),
    k.color(255, 0, 0)
  ]);

  k.add([
    k.text('"Another joins my perfect family." - M.A.R.I.A.', { size: 18 }),
    k.pos(k.width() / 2, 300),
    k.anchor('center'),
    k.color(255, 100, 100)
  ]);

  k.add([
    k.text(`Enemies defeated: ${window.gameState.kills}`, { size: 16 }),
    k.pos(k.width() / 2, 370),
    k.anchor('center'),
    k.color(150, 150, 150)
  ]);

  const restartBtn = k.add([
    k.rect(200, 50),
    k.pos(k.width() / 2, 500),
    k.anchor('center'),
    k.color(80, 50, 50),
    k.area()
  ]);

  k.add([
    k.text('Try Again', { size: 20 }),
    k.pos(k.width() / 2, 500),
    k.anchor('center'),
    k.color(255, 255, 255)
  ]);

  restartBtn.onClick(() => k.go('game'));
});

// Start
k.go('menu');

// Testing helpers
window.startGame = () => k.go('game');
window.giveKeycard = () => { window.gameState.hasYellowKeycard = true; };
window.win = () => k.go('victory');

console.log('System Shock 2D initialized');
