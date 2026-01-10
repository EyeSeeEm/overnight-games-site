// DERELICT - Survival Horror (PixiJS)
// Using global PIXI from CDN
const Application = PIXI.Application;
const Graphics = PIXI.Graphics;
const Text = PIXI.Text;
const Container = PIXI.Container;
const TextStyle = PIXI.TextStyle;

const WIDTH = 800;
const HEIGHT = 600;

// Game state
const gs = {
  o2: 100,
  maxO2: 100,
  hp: 100,
  maxHp: 100,
  integrity: 100,
  sector: 1,
  kills: 0,
  started: false,
  gameOver: false,
  won: false,
  lastTime: 0
};

// Player
const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  angle: 0,
  speed: 2,
  radius: 12,
  attacking: false,
  attackTimer: 0
};

// Input
const keys = {};
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false, clicked: false };

// Arrays
let enemies = [];
let items = [];

// Expose for testing
window.gameState = gs;
function updateGameState() {
  window.gameState = {
    o2: Math.floor(gs.o2),
    maxO2: gs.maxO2,
    hp: gs.hp,
    maxHp: gs.maxHp,
    integrity: Math.floor(gs.integrity),
    sector: gs.sector,
    kills: gs.kills,
    gameOver: gs.gameOver,
    won: gs.won
  };
}

// Canvas fallback for environments without WebGL
function initCanvasFallback(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFallback() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#00ff00';
    ctx.font = '20px monospace';
    ctx.fillText('DERELICT - Survival Horror', 200, 100);
    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.fillText('O2: ' + gs.o2 + '% | HP: ' + gs.hp + '% | Integrity: ' + gs.integrity + '%', 50, 50);
    ctx.fillText('Click to start', 350, 350);
    if (!gs.started) requestAnimationFrame(drawFallback);
  }

  canvas.addEventListener('click', () => { gs.started = true; });
  drawFallback();
  console.log('DERELICT (PixiJS) initialized with canvas fallback');
}

// Init PixiJS
function init() {
  // Create canvas first
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  document.body.appendChild(canvas);

  let app;
  try {
    app = new Application({
      view: canvas,
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: 0x0a0a0a,
      antialias: true,
      forceCanvas: true
    });
  } catch (e) {
    console.log('PixiJS initialization failed, using canvas fallback:', e.message);
    initCanvasFallback(canvas);
    return;
  }

  // Input handlers
  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
  app.view.addEventListener('mousemove', e => {
    const rect = app.view.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  app.view.addEventListener('mousedown', () => { mouse.down = true; mouse.clicked = true; });
  app.view.addEventListener('mouseup', () => mouse.down = false);
  app.view.addEventListener('click', () => { if (!gs.started) gs.started = true; });

  // Create containers
  const gameContainer = new Container();
  const uiContainer = new Container();
  app.stage.addChild(gameContainer);
  app.stage.addChild(uiContainer);

  // Graphics
  const ground = new Graphics();
  const playerGfx = new Graphics();
  const enemyGfx = new Graphics();
  const itemGfx = new Graphics();
  const visionMask = new Graphics();
  const darkness = new Graphics();

  gameContainer.addChild(ground);
  gameContainer.addChild(itemGfx);
  gameContainer.addChild(enemyGfx);
  gameContainer.addChild(playerGfx);
  gameContainer.addChild(darkness);

  // UI Text
  const textStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 14,
    fill: '#ffffff'
  });

  const o2Text = new Text({ text: 'O2: 100', style: textStyle });
  o2Text.x = 10; o2Text.y = 10;
  uiContainer.addChild(o2Text);

  const hpText = new Text({ text: 'HP: 100', style: textStyle });
  hpText.x = 10; hpText.y = 30;
  uiContainer.addChild(hpText);

  const integrityText = new Text({ text: 'Integrity: 100%', style: textStyle });
  integrityText.x = 10; integrityText.y = 50;
  uiContainer.addChild(integrityText);

  const sectorText = new Text({ text: 'Sector: 1', style: textStyle });
  sectorText.x = 10; sectorText.y = 70;
  uiContainer.addChild(sectorText);

  const killsText = new Text({ text: 'Kills: 0', style: textStyle });
  killsText.x = WIDTH - 80; killsText.y = 10;
  uiContainer.addChild(killsText);

  const titleStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 36,
    fill: '#cc0000'
  });
  const titleText = new Text({ text: 'DERELICT', style: titleStyle });
  titleText.anchor.set(0.5);
  titleText.x = WIDTH / 2; titleText.y = HEIGHT / 2 - 60;
  uiContainer.addChild(titleText);

  const instructStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 14,
    fill: '#888888',
    align: 'center'
  });
  const instructText = new Text({
    text: '[WASD] Move  [Mouse] Aim  [Click] Attack\n\nYour O2 is draining. Explore. Survive.\n\nClick to Start',
    style: instructStyle
  });
  instructText.anchor.set(0.5);
  instructText.x = WIDTH / 2; instructText.y = HEIGHT / 2 + 40;
  uiContainer.addChild(instructText);

  const gameOverText = new Text({ text: '', style: titleStyle });
  gameOverText.anchor.set(0.5);
  gameOverText.x = WIDTH / 2; gameOverText.y = HEIGHT / 2;
  gameOverText.visible = false;
  uiContainer.addChild(gameOverText);

  // Spawn enemies
  function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < 3 + gs.sector; i++) {
      const type = Math.random() < 0.6 ? 'crawler' : 'shambler';
      enemies.push({
        x: Math.random() * (WIDTH - 100) + 50,
        y: Math.random() * (HEIGHT - 150) + 100,
        type,
        hp: type === 'crawler' ? 30 : 60,
        maxHp: type === 'crawler' ? 30 : 60,
        speed: type === 'crawler' ? 1 : 0.5,
        damage: type === 'crawler' ? 15 : 25,
        radius: type === 'crawler' ? 10 : 14,
        attackTimer: 0,
        state: 'idle'
      });
    }
  }

  // Spawn items
  function spawnItems() {
    items = [];
    for (let i = 0; i < 2; i++) {
      items.push({
        x: Math.random() * (WIDTH - 100) + 50,
        y: Math.random() * (HEIGHT - 150) + 100,
        type: Math.random() < 0.6 ? 'o2' : 'medkit',
        radius: 8
      });
    }
  }

  spawnEnemies();
  spawnItems();

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function isInVisionCone(targetX, targetY) {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - player.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    return Math.abs(angleDiff) < Math.PI / 4; // 45 degrees each side = 90 total
  }

  // Game loop
  app.ticker.add((ticker) => {
    const delta = ticker.deltaTime / 60;
    const now = performance.now();

    if (!gs.started) {
      titleText.visible = true;
      instructText.visible = true;
      updateGameState();
      return;
    }

    titleText.visible = false;
    instructText.visible = false;

    if (gs.gameOver) {
      gameOverText.visible = true;
      gameOverText.text = gs.won ? 'ESCAPED!' : 'YOU DIED';
      gameOverText.style.fill = gs.won ? '#00ff00' : '#cc0000';
      updateGameState();
      return;
    }

    // O2 drain
    const drainRate = keys['shift'] ? 2 : 1;
    gs.o2 -= delta * drainRate * 0.5;

    // Integrity decay
    gs.integrity -= delta * 0.02;

    // Check death
    if (gs.o2 <= 0) {
      gs.o2 = 0;
      gs.gameOver = true;
    }
    if (gs.hp <= 0) {
      gs.hp = 0;
      gs.gameOver = true;
    }
    if (gs.integrity <= 0) {
      gs.integrity = 0;
      gs.gameOver = true;
    }

    // Player movement
    let dx = 0, dy = 0;
    const speed = keys['shift'] ? player.speed * 1.5 : player.speed;
    if (keys['w']) dy -= speed;
    if (keys['s']) dy += speed;
    if (keys['a']) dx -= speed;
    if (keys['d']) dx += speed;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    player.x = Math.max(20, Math.min(WIDTH - 20, player.x + dx));
    player.y = Math.max(20, Math.min(HEIGHT - 20, player.y + dy));

    // Player aim
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Attack
    if (player.attackTimer > 0) player.attackTimer -= delta;
    if (mouse.clicked && player.attackTimer <= 0) {
      player.attacking = true;
      player.attackTimer = 0.5;
      gs.o2 -= 2; // Combat drain

      // Check hits
      const attackDir = { x: Math.cos(player.angle), y: Math.sin(player.angle) };
      const attackPos = {
        x: player.x + attackDir.x * 25,
        y: player.y + attackDir.y * 25
      };

      for (const enemy of enemies) {
        if (dist(attackPos, enemy) < enemy.radius + 15) {
          enemy.hp -= 20;
          if (enemy.hp <= 0) {
            gs.kills++;
          }
        }
      }

      setTimeout(() => { player.attacking = false; }, 150);
    }
    mouse.clicked = false;

    // Update enemies
    enemies = enemies.filter(e => {
      const d = dist(e, player);

      // AI
      if (d < 250) {
        e.state = 'chase';
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;

        // Attack player
        if (d < e.radius + player.radius + 5) {
          e.attackTimer += delta;
          if (e.attackTimer >= 1) {
            e.attackTimer = 0;
            gs.hp -= e.damage;
          }
        }
      } else {
        e.state = 'idle';
      }

      return e.hp > 0;
    });

    // Collect items
    items = items.filter(item => {
      if (dist(item, player) < item.radius + player.radius) {
        if (item.type === 'o2') {
          gs.o2 = Math.min(gs.maxO2, gs.o2 + 25);
        } else {
          gs.hp = Math.min(gs.maxHp, gs.hp + 30);
        }
        return false;
      }
      return true;
    });

    // Progress sector
    if (enemies.length === 0 && gs.sector < 6) {
      gs.sector++;
      player.x = WIDTH / 2;
      player.y = HEIGHT - 50;
      spawnEnemies();
      spawnItems();
    }

    // Win condition
    if (gs.sector >= 6 && enemies.length === 0) {
      gs.won = true;
      gs.gameOver = true;
    }

    // ===== RENDERING =====

    // Clear
    ground.clear();
    playerGfx.clear();
    enemyGfx.clear();
    itemGfx.clear();
    darkness.clear();

    // Draw ground grid
    ground.fill({ color: 0x111111 });
    ground.rect(0, 0, WIDTH, HEIGHT);
    ground.fill();
    ground.stroke({ color: 0x1a1a1a, width: 1 });
    for (let x = 0; x < WIDTH; x += 40) {
      ground.moveTo(x, 0);
      ground.lineTo(x, HEIGHT);
    }
    for (let y = 0; y < HEIGHT; y += 40) {
      ground.moveTo(0, y);
      ground.lineTo(WIDTH, y);
    }
    ground.stroke();

    // Draw items
    for (const item of items) {
      itemGfx.fill({ color: item.type === 'o2' ? 0x00aaff : 0xff4444 });
      itemGfx.circle(item.x, item.y, item.radius);
      itemGfx.fill();
    }

    // Draw enemies (only in vision cone)
    for (const enemy of enemies) {
      if (isInVisionCone(enemy.x, enemy.y) && dist(enemy, player) < 300) {
        const color = enemy.type === 'crawler' ? 0x884422 : 0x668844;
        enemyGfx.fill({ color });
        enemyGfx.circle(enemy.x, enemy.y, enemy.radius);
        enemyGfx.fill();

        // Health bar
        if (enemy.hp < enemy.maxHp) {
          const barW = enemy.radius * 2;
          enemyGfx.fill({ color: 0x333333 });
          enemyGfx.rect(enemy.x - barW/2, enemy.y - enemy.radius - 8, barW, 4);
          enemyGfx.fill();
          enemyGfx.fill({ color: 0xff0000 });
          enemyGfx.rect(enemy.x - barW/2, enemy.y - enemy.radius - 8, barW * (enemy.hp/enemy.maxHp), 4);
          enemyGfx.fill();
        }
      }
    }

    // Draw player
    playerGfx.fill({ color: 0x3366cc });
    playerGfx.circle(player.x, player.y, player.radius);
    playerGfx.fill();

    // Flashlight direction
    const flashX = player.x + Math.cos(player.angle) * 20;
    const flashY = player.y + Math.sin(player.angle) * 20;
    playerGfx.fill({ color: 0xffff88 });
    playerGfx.circle(flashX, flashY, 4);
    playerGfx.fill();

    // Attack swing
    if (player.attacking) {
      const swingX = player.x + Math.cos(player.angle) * 25;
      const swingY = player.y + Math.sin(player.angle) * 25;
      playerGfx.fill({ color: 0xffffff, alpha: 0.5 });
      playerGfx.circle(swingX, swingY, 15);
      playerGfx.fill();
    }

    // Draw darkness (90 degree vision cone)
    darkness.fill({ color: 0x000000, alpha: 0.85 });
    darkness.rect(0, 0, WIDTH, HEIGHT);
    darkness.fill();

    // Cut out vision cone
    darkness.fill({ color: 0x000000 });
    darkness.beginHole();
    const visionRange = 200;
    const coneAngle = Math.PI / 4; // 45 degrees half-angle
    darkness.moveTo(player.x, player.y);
    for (let a = -coneAngle; a <= coneAngle; a += 0.05) {
      const vx = player.x + Math.cos(player.angle + a) * visionRange;
      const vy = player.y + Math.sin(player.angle + a) * visionRange;
      darkness.lineTo(vx, vy);
    }
    darkness.lineTo(player.x, player.y);
    darkness.endHole();
    darkness.fill();

    // Update UI
    o2Text.text = `O2: ${Math.floor(gs.o2)}/${gs.maxO2}`;
    o2Text.style.fill = gs.o2 < 20 ? '#ff0000' : '#00aaff';
    hpText.text = `HP: ${gs.hp}/${gs.maxHp}`;
    hpText.style.fill = gs.hp < 30 ? '#ff0000' : '#ff4444';
    integrityText.text = `Integrity: ${Math.floor(gs.integrity)}%`;
    integrityText.style.fill = gs.integrity < 25 ? '#ff0000' : '#888888';
    sectorText.text = `Sector: ${gs.sector}/6`;
    killsText.text = `Kills: ${gs.kills}`;

    updateGameState();
  });

  console.log('DERELICT (PixiJS) initialized');
}

try {
  init();
} catch (e) {
  console.error(e);
}
