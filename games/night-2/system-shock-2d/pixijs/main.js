// System Shock 2D - Citadel Station (PixiJS)
const { Application, Graphics, Text, TextStyle, Container } = PIXI;

// Game constants
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;
const ROOM_W = 18;
const ROOM_H = 13;

// Tile types
const EMPTY = 0;
const WALL = 1;
const DOOR = 2;
const MEDICAL = 3;
const ENERGY = 4;
const TERMINAL = 5;

// Game state
let gameState = {
  hp: 100,
  maxHp: 100,
  energy: 100,
  ammo: 30,
  level: 1,
  score: 0,
  isDead: false,
  hasWon: false
};

window.gameState = gameState;

// Game objects
let app;
let gameContainer;
let hudContainer;
let player;
let enemies = [];
let bullets = [];
let items = [];
let room = [];

// Input state
const keys = {};

// Initialize (PixiJS v7 sync API)
(() => {
  app = new Application({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x0a0a12,
    antialias: false
  });
  document.body.appendChild(app.view);

  // Containers
  gameContainer = new Container();
  hudContainer = new Container();
  app.stage.addChild(gameContainer);
  app.stage.addChild(hudContainer);

  // Input
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Start game
  generateRoom();
  createPlayer();
  createHUD();

  // Game loop
  app.ticker.add(gameLoop);

  console.log('System Shock 2D (PixiJS) loaded');
})();

function generateRoom() {
  // Clear previous
  gameContainer.removeChildren();
  enemies = [];
  items = [];
  room = [];

  // Initialize with walls at edges
  for (let y = 0; y < ROOM_H; y++) {
    const row = [];
    for (let x = 0; x < ROOM_W; x++) {
      if (x === 0 || x === ROOM_W - 1 || y === 0 || y === ROOM_H - 1) {
        row.push(WALL);
      } else {
        row.push(EMPTY);
      }
    }
    room.push(row);
  }

  // Add internal walls
  const numWalls = 3 + gameState.level;
  for (let i = 0; i < numWalls; i++) {
    const wx = Math.floor(Math.random() * (ROOM_W - 6)) + 3;
    const wy = Math.floor(Math.random() * (ROOM_H - 6)) + 3;
    const len = Math.floor(Math.random() * 3) + 2;
    const horiz = Math.random() > 0.5;
    for (let j = 0; j < len; j++) {
      if (horiz && wx + j < ROOM_W - 1) {
        room[wy][wx + j] = WALL;
      } else if (!horiz && wy + j < ROOM_H - 1) {
        room[wy + j][wx] = WALL;
      }
    }
  }

  // Place special tiles
  room[ROOM_H - 2][ROOM_W - 2] = DOOR;
  room[2][2] = MEDICAL;
  room[ROOM_H - 3][2] = ENERGY;
  room[2][ROOM_W - 3] = TERMINAL;

  // Draw room
  drawRoom();

  // Spawn enemies
  const numEnemies = 2 + gameState.level * 2;
  for (let i = 0; i < numEnemies; i++) {
    let ex, ey;
    do {
      ex = Math.floor(Math.random() * (ROOM_W - 8)) + 4;
      ey = Math.floor(Math.random() * (ROOM_H - 6)) + 3;
    } while (room[ey][ex] !== EMPTY);

    const types = ['mutant', 'cyborg', 'bot'];
    const type = types[Math.floor(Math.random() * types.length)];
    createEnemy(ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, type);
  }

  // Spawn items
  for (let i = 0; i < 3; i++) {
    let ix, iy;
    do {
      ix = Math.floor(Math.random() * (ROOM_W - 6)) + 3;
      iy = Math.floor(Math.random() * (ROOM_H - 4)) + 2;
    } while (room[iy][ix] !== EMPTY);

    const types = ['ammo', 'health'];
    createItem(ix * TILE_SIZE + TILE_SIZE / 2, iy * TILE_SIZE + TILE_SIZE / 2, types[Math.floor(Math.random() * types.length)]);
  }
}

function drawRoom() {
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const tile = room[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      const g = new Graphics();

      if (tile === EMPTY) {
        g.beginFill(0x141420);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        if ((x + y) % 3 === 0) {
          g.beginFill(0x101018);
          g.drawRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          g.endFill();
        }
      } else if (tile === WALL) {
        g.beginFill(0x404858);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        g.beginFill(0x586070);
        g.drawRect(px + 2, py + TILE_SIZE - 8, TILE_SIZE - 4, 4);
        g.endFill();
        g.beginFill(0x303848);
        g.drawRect(px + 2, py + 2, TILE_SIZE - 4, 3);
        g.endFill();
      } else if (tile === DOOR) {
        g.beginFill(0x141420);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        const locked = enemies.length > 0;
        g.beginFill(locked ? 0x994444 : 0x449944);
        g.drawRect(px + 12, py + 2, 8, TILE_SIZE - 4);
        g.endFill();
        g.beginFill(0x505050);
        g.drawRect(px + 2, py + 2, 8, TILE_SIZE - 4);
        g.endFill();
        g.beginFill(0x505050);
        g.drawRect(px + TILE_SIZE - 10, py + 2, 8, TILE_SIZE - 4);
        g.endFill();
      } else if (tile === MEDICAL) {
        g.beginFill(0x141420);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        g.beginFill(0xcc3333);
        g.drawRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.endFill();
        g.beginFill(0xffffff);
        g.drawRect(px + 14, py + 8, 4, 16);
        g.endFill();
        g.beginFill(0xffffff);
        g.drawRect(px + 8, py + 14, 16, 4);
        g.endFill();
      } else if (tile === ENERGY) {
        g.beginFill(0x141420);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        g.beginFill(0x3366cc);
        g.drawRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        g.endFill();
        g.beginFill(0x66aaff);
        g.drawRect(px + 10, py + 10, 12, 12);
        g.endFill();
      } else if (tile === TERMINAL) {
        g.beginFill(0x141420);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        g.beginFill(0x202830);
        g.drawRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 12);
        g.endFill();
        g.beginFill(0x00cc00);
        g.drawRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 16);
        g.endFill();
      }

      gameContainer.addChild(g);
    }
  }
}

function createPlayer() {
  player = {
    x: 2 * TILE_SIZE + TILE_SIZE / 2,
    y: 2 * TILE_SIZE + TILE_SIZE / 2,
    vx: 0,
    vy: 0,
    fireTimer: 0,
    interactTimer: 0,
    graphics: new Graphics()
  };
  drawPlayer();
  gameContainer.addChild(player.graphics);
}

function drawPlayer() {
  player.graphics.clear();
  // Body
  player.graphics.beginFill(0x3366aa);
  player.graphics.drawRect(-10, -12, 20, 24);
  player.graphics.endFill();
  // Visor
  player.graphics.beginFill(0x33ccff);
  player.graphics.drawRect(-6, -8, 12, 4);
  player.graphics.endFill();
  // Update position
  player.graphics.position.set(player.x, player.y);
}

function createEnemy(x, y, type) {
  let hp = 40;
  let speed = 1;
  let color = 0x66aa44;

  if (type === 'cyborg') {
    hp = 60;
    speed = 1.2;
    color = 0x9966aa;
  } else if (type === 'bot') {
    hp = 80;
    speed = 0.8;
    color = 0xaa4444;
  }

  const enemy = {
    x,
    y,
    type,
    hp,
    maxHp: hp,
    speed,
    state: 'patrol',
    dir: Math.random() * Math.PI * 2,
    fireTimer: Math.random() * 120,
    graphics: new Graphics()
  };

  // Draw enemy
  enemy.graphics.beginFill(color);
  enemy.graphics.drawRect(-8, -10, 16, 20);
  enemy.graphics.endFill();
  enemy.graphics.beginFill(0xff0000);
  enemy.graphics.drawRect(-4, -6, 3, 3);
  enemy.graphics.endFill();
  enemy.graphics.beginFill(0xff0000);
  enemy.graphics.drawRect(1, -6, 3, 3);
  enemy.graphics.endFill();
  enemy.graphics.position.set(x, y);

  enemies.push(enemy);
  gameContainer.addChild(enemy.graphics);
}

function createItem(x, y, type) {
  const item = {
    x,
    y,
    type,
    graphics: new Graphics()
  };

  const color = type === 'ammo' ? 0xccaa44 : 0xff4444;
  item.graphics.beginFill(color);
  item.graphics.drawRect(-6, -6, 12, 12);
  item.graphics.endFill();
  item.graphics.position.set(x, y);

  items.push(item);
  gameContainer.addChild(item.graphics);
}

function createBullet(x, y, vx, vy) {
  const bullet = {
    x,
    y,
    vx,
    vy,
    life: 60,
    graphics: new Graphics()
  };

  bullet.graphics.beginFill(0xffcc44);
  bullet.graphics.drawCircle(0, 0, 4);
  bullet.graphics.endFill();
  bullet.graphics.position.set(x, y);

  bullets.push(bullet);
  gameContainer.addChild(bullet.graphics);
}

function isWall(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return true;
  return room[ty][tx] === WALL;
}

function getTile(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return WALL;
  return room[ty][tx];
}

function createHUD() {
  // Clear HUD
  hudContainer.removeChildren();

  // HP Bar background
  const hpBg = new Graphics();
  hpBg.beginFill(0x333333);
  hpBg.drawRect(10, 10, 104, 14);
  hpBg.endFill();
  hudContainer.addChild(hpBg);

  // Energy bar background
  const enBg = new Graphics();
  enBg.beginFill(0x333333);
  enBg.drawRect(10, 28, 104, 14);
  enBg.endFill();
  hudContainer.addChild(enBg);
}

function updateHUD() {
  // Remove old dynamic HUD elements (keep first 2 backgrounds)
  while (hudContainer.children.length > 2) {
    hudContainer.removeChildAt(2);
  }

  // HP bar
  const hpPct = gameState.hp / gameState.maxHp;
  const hpBar = new Graphics();
  hpBar.beginFill(0xff4444);
  hpBar.drawRect(12, 12, hpPct * 100, 10);
  hpBar.endFill();
  hudContainer.addChild(hpBar);

  // Energy bar
  const enPct = gameState.energy / 100;
  const enBar = new Graphics();
  enBar.beginFill(0x4488ff);
  enBar.drawRect(12, 30, enPct * 100, 10);
  enBar.endFill();
  hudContainer.addChild(enBar);

  // Text labels
  const style = new TextStyle({ fill: '#ffffff', fontSize: 14 });
  const hpText = new Text(`HP: ${Math.floor(gameState.hp)}`, style);
  hpText.position.set(120, 8);
  hudContainer.addChild(hpText);

  const enText = new Text(`EN: ${Math.floor(gameState.energy)}`, style);
  enText.position.set(120, 26);
  hudContainer.addChild(enText);

  const ammoText = new Text(`AMMO: ${gameState.ammo}`, style);
  ammoText.position.set(200, 8);
  hudContainer.addChild(ammoText);

  const levelText = new Text(`LEVEL: ${gameState.level}`, style);
  levelText.position.set(GAME_WIDTH - 80, 8);
  hudContainer.addChild(levelText);

  const scoreText = new Text(`SCORE: ${gameState.score}`, style);
  scoreText.position.set(GAME_WIDTH - 120, 26);
  hudContainer.addChild(scoreText);

  const enemyText = new Text(`ENEMIES: ${enemies.length}`, new TextStyle({ fill: '#ff8888', fontSize: 14 }));
  enemyText.position.set(300, 8);
  hudContainer.addChild(enemyText);

  // Door status
  if (enemies.length === 0) {
    const doorText = new Text('DOOR UNLOCKED - Press E', new TextStyle({ fill: '#44ff44', fontSize: 14 }));
    doorText.position.set(GAME_WIDTH / 2 - 80, GAME_HEIGHT - 30);
    hudContainer.addChild(doorText);
  }

  // Death screen
  if (gameState.isDead) {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.8);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    hudContainer.addChild(overlay);

    const deathStyle = new TextStyle({ fill: '#ff4444', fontSize: 48 });
    const deathText = new Text('SYSTEM FAILURE', deathStyle);
    deathText.anchor.set(0.5);
    deathText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    hudContainer.addChild(deathText);

    const restartText = new Text('Press R to restart', new TextStyle({ fill: '#888888', fontSize: 18 }));
    restartText.anchor.set(0.5);
    restartText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    hudContainer.addChild(restartText);
  }

  // Victory screen
  if (gameState.hasWon) {
    const overlay = new Graphics();
    overlay.beginFill(0x002200, 0.8);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    hudContainer.addChild(overlay);

    const winStyle = new TextStyle({ fill: '#44ff44', fontSize: 48 });
    const winText = new Text('CITADEL CLEARED', winStyle);
    winText.anchor.set(0.5);
    winText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    hudContainer.addChild(winText);

    const scoreStyle = new TextStyle({ fill: '#ffffff', fontSize: 24 });
    const finalScore = new Text(`Final Score: ${gameState.score}`, scoreStyle);
    finalScore.anchor.set(0.5);
    finalScore.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    hudContainer.addChild(finalScore);
  }
}

function gameLoop(delta) {
  if (gameState.isDead) {
    if (keys['KeyR']) {
      resetGame();
    }
    updateHUD();
    return;
  }

  if (gameState.hasWon) {
    updateHUD();
    return;
  }

  // Player movement
  const speed = 2.5;
  player.vx = 0;
  player.vy = 0;

  if (keys['ArrowUp'] || keys['KeyW']) player.vy = -speed;
  if (keys['ArrowDown'] || keys['KeyS']) player.vy = speed;
  if (keys['ArrowLeft'] || keys['KeyA']) player.vx = -speed;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx = speed;

  // Apply movement with collision
  const newX = player.x + player.vx;
  const newY = player.y + player.vy;
  if (!isWall(newX, player.y)) player.x = newX;
  if (!isWall(player.x, newY)) player.y = newY;

  // Clamp to bounds
  player.x = Math.max(16, Math.min(GAME_WIDTH - 16, player.x));
  player.y = Math.max(16, Math.min(GAME_HEIGHT - 16, player.y));

  drawPlayer();

  // Firing
  player.fireTimer = Math.max(0, player.fireTimer - 1);
  if ((keys['Space'] || keys['KeyZ']) && player.fireTimer <= 0 && gameState.ammo > 0) {
    player.fireTimer = 15;
    gameState.ammo--;

    // Fire in 4 directions
    createBullet(player.x, player.y - 10, 0, -8);
    createBullet(player.x, player.y + 10, 0, 8);
    createBullet(player.x - 10, player.y, -8, 0);
    createBullet(player.x + 10, player.y, 8, 0);
  }

  // Interact
  player.interactTimer = Math.max(0, player.interactTimer - 1);
  if ((keys['KeyE'] || keys['Enter']) && player.interactTimer <= 0) {
    player.interactTimer = 30;
    const tile = getTile(player.x, player.y);

    if (tile === DOOR && enemies.length === 0) {
      gameState.level++;
      if (gameState.level > 5) {
        gameState.hasWon = true;
        gameState.score += 500;
      } else {
        player.x = 2 * TILE_SIZE + TILE_SIZE / 2;
        player.y = 2 * TILE_SIZE + TILE_SIZE / 2;
        generateRoom();
        createPlayer();
      }
    } else if (tile === MEDICAL && gameState.energy >= 15) {
      gameState.energy -= 15;
      gameState.hp = Math.min(gameState.maxHp, gameState.hp + 30);
    } else if (tile === ENERGY) {
      gameState.energy = 100;
    }
  }

  // Energy drain
  gameState.energy = Math.max(0, gameState.energy - 0.02);

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;
    b.graphics.position.set(b.x, b.y);

    // Wall collision
    if (isWall(b.x, b.y) || b.life <= 0) {
      gameContainer.removeChild(b.graphics);
      bullets.splice(i, 1);
      continue;
    }

    // Enemy collision
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
      if (dist < 15) {
        e.hp -= 15;
        gameContainer.removeChild(b.graphics);
        bullets.splice(i, 1);

        if (e.hp <= 0) {
          gameState.score += e.maxHp;
          gameContainer.removeChild(e.graphics);
          enemies.splice(j, 1);
        }
        break;
      }
    }
  }

  // Update enemies
  for (const e of enemies) {
    const distToPlayer = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);

    if (distToPlayer < 200) {
      e.state = 'chase';
    } else if (distToPlayer > 250) {
      e.state = 'patrol';
    }

    if (e.state === 'patrol') {
      if (Math.random() < 0.02) {
        e.dir = Math.random() * Math.PI * 2;
      }
      const nx = e.x + Math.cos(e.dir) * e.speed * 0.3;
      const ny = e.y + Math.sin(e.dir) * e.speed * 0.3;
      if (!isWall(nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir = Math.random() * Math.PI * 2;
      }
    } else {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      const nx = e.x + Math.cos(angle) * e.speed;
      const ny = e.y + Math.sin(angle) * e.speed;
      if (!isWall(nx, e.y)) e.x = nx;
      if (!isWall(e.x, ny)) e.y = ny;
    }

    e.graphics.position.set(e.x, e.y);

    // Attack player
    if (distToPlayer < 20) {
      gameState.hp -= 0.5;
    }
  }

  // Update items
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
    if (dist < 20) {
      if (item.type === 'ammo') {
        gameState.ammo = Math.min(99, gameState.ammo + 15);
        gameState.score += 10;
      } else {
        gameState.hp = Math.min(gameState.maxHp, gameState.hp + 20);
        gameState.score += 15;
      }
      gameContainer.removeChild(item.graphics);
      items.splice(i, 1);
    }
  }

  // Check death
  if (gameState.hp <= 0) {
    gameState.isDead = true;
  }

  // Update window game state
  window.gameState = gameState;

  updateHUD();
}

function resetGame() {
  gameState = {
    hp: 100,
    maxHp: 100,
    energy: 100,
    ammo: 30,
    level: 1,
    score: 0,
    isDead: false,
    hasWon: false
  };
  window.gameState = gameState;

  // Clear
  for (const b of bullets) {
    gameContainer.removeChild(b.graphics);
  }
  bullets = [];

  generateRoom();
  createPlayer();
}
