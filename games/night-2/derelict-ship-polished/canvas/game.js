// Derelict - Polished Canvas Version
// Survival Horror with 90-degree Vision Cone
// Visual Effects: Particles, Screen Shake, Dynamic Lighting, Fog of War

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const WIDTH = 800;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Color palette (Lospec - Midnight Ablaze)
const PALETTE = {
  bg: '#0f0f1b',
  bgDark: '#070710',
  wall: '#1a1a2e',
  wallLight: '#2d2d44',
  floor: '#16161c',
  floorLight: '#1c1c24',
  player: '#4ecdc4',
  playerGlow: '#7ee8e2',
  enemy: '#ff6b6b',
  enemyGlow: '#ff9999',
  flashlight: '#fffae6',
  flashlightDim: '#665f4d',
  o2: '#5dade2',
  hp: '#e74c3c',
  integrity: '#f39c12',
  text: '#ecf0f1',
  textDim: '#7f8c8d',
  particle: '#ffcc00',
  blood: '#8b0000',
  spark: '#fff68f'
};

// Game state
let gameState = 'title';
let player = { x: 400, y: 300, angle: 0, vx: 0, vy: 0 };
let o2 = 100, maxO2 = 100;
let hp = 100, maxHp = 100;
let integrity = 100;
let flashlightOn = true;
let flashlightBattery = 100;
let sector = 1;
let enemies = [];
let particles = [];
let decals = [];
let lights = [];
let screenShake = { x: 0, y: 0, intensity: 0 };
let ambientPulse = 0;
let time = 0;

// Expose for testing
window.gameState = {
  o2: 100,
  hp: 100,
  integrity: 100,
  sector: 1,
  flashlightOn: true
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('click', () => {
  if (gameState === 'title') {
    startGame();
  } else if (gameState === 'gameover') {
    startGame();
  } else if (gameState === 'playing') {
    attack();
  }
});

// Room generation
let room = [];
const ROOM_W = 25;
const ROOM_H = 19;
const TILE = 32;

function generateRoom() {
  room = [];
  enemies = [];
  decals = [];
  lights = [];
  
  for (let y = 0; y < ROOM_H; y++) {
    const row = [];
    for (let x = 0; x < ROOM_W; x++) {
      if (x === 0 || x === ROOM_W - 1 || y === 0 || y === ROOM_H - 1) {
        row.push(1); // Wall
      } else {
        row.push(0); // Floor
      }
    }
    room.push(row);
  }
  
  // Add internal walls
  const numWalls = 5 + sector * 2;
  for (let i = 0; i < numWalls; i++) {
    const wx = Math.floor(Math.random() * (ROOM_W - 6)) + 3;
    const wy = Math.floor(Math.random() * (ROOM_H - 6)) + 3;
    const len = Math.floor(Math.random() * 4) + 2;
    const horiz = Math.random() > 0.5;
    for (let j = 0; j < len; j++) {
      if (horiz && wx + j < ROOM_W - 1) room[wy][wx + j] = 1;
      else if (!horiz && wy + j < ROOM_H - 1) room[wy + j][wx] = 1;
    }
  }
  
  // Add ambient lights
  for (let i = 0; i < 3; i++) {
    lights.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: 80 + Math.random() * 60,
      color: Math.random() > 0.7 ? PALETTE.o2 : PALETTE.flashlightDim,
      flicker: Math.random() * 0.3
    });
  }
  
  // Add blood decals
  for (let i = 0; i < 8; i++) {
    decals.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: 5 + Math.random() * 15,
      alpha: 0.3 + Math.random() * 0.4
    });
  }
  
  // Spawn enemies
  const numEnemies = 2 + sector;
  for (let i = 0; i < numEnemies; i++) {
    let ex, ey;
    do {
      ex = Math.floor(Math.random() * (ROOM_W - 4)) + 2;
      ey = Math.floor(Math.random() * (ROOM_H - 4)) + 2;
    } while (room[ey][ex] !== 0 || (Math.abs(ex * TILE - player.x) < 150 && Math.abs(ey * TILE - player.y) < 150));
    
    enemies.push({
      x: ex * TILE + TILE / 2,
      y: ey * TILE + TILE / 2,
      hp: 30 + sector * 10,
      maxHp: 30 + sector * 10,
      speed: 0.8 + sector * 0.1,
      state: 'patrol',
      dir: Math.random() * Math.PI * 2,
      attackCooldown: 0,
      hitFlash: 0
    });
  }
}

function startGame() {
  gameState = 'playing';
  player = { x: 100, y: 100, angle: 0, vx: 0, vy: 0 };
  o2 = maxO2;
  hp = maxHp;
  integrity = 100;
  flashlightOn = true;
  flashlightBattery = 100;
  sector = 1;
  particles = [];
  generateRoom();
}

// Particle system
function spawnParticles(x, y, count, color, speed, life, size) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      color,
      life,
      maxLife: life,
      size: size || 3
    });
  }
}

function spawnBlood(x, y) {
  spawnParticles(x, y, 8, PALETTE.blood, 3, 40, 4);
  decals.push({ x, y, radius: 8 + Math.random() * 8, alpha: 0.6 });
}

function spawnSparks(x, y) {
  spawnParticles(x, y, 5, PALETTE.spark, 4, 20, 2);
}

// Screen shake
function shake(intensity) {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

// Vision cone check
const VISION_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE = 200;
const FLASHLIGHT_RANGE = 350;

function isInVisionCone(tx, ty) {
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const range = flashlightOn ? FLASHLIGHT_RANGE : VISION_RANGE;
  
  if (dist > range) return false;
  
  const angleToTarget = Math.atan2(dy, dx);
  let angleDiff = angleToTarget - player.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  return Math.abs(angleDiff) < VISION_ANGLE / 2;
}

function isWall(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return true;
  return room[ty][tx] === 1;
}

// Attack
function attack() {
  if (o2 < 5) return;
  o2 -= 3;
  shake(3);
  spawnSparks(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20);
  
  // Check hit on enemies
  for (const e of enemies) {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 50 && isInVisionCone(e.x, e.y)) {
      e.hp -= 25;
      e.hitFlash = 10;
      spawnBlood(e.x, e.y);
      shake(5);
    }
  }
}

// Update
function update() {
  time++;
  ambientPulse = Math.sin(time * 0.02) * 0.1;
  
  if (gameState !== 'playing') return;
  
  // Screen shake decay
  screenShake.intensity *= 0.9;
  screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
  screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
  
  // Player movement
  const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? 3.5 : 2;
  player.vx *= 0.85;
  player.vy *= 0.85;
  
  if (keys['KeyW'] || keys['ArrowUp']) player.vy -= speed * 0.3;
  if (keys['KeyS'] || keys['ArrowDown']) player.vy += speed * 0.3;
  if (keys['KeyA'] || keys['ArrowLeft']) player.vx -= speed * 0.3;
  if (keys['KeyD'] || keys['ArrowRight']) player.vx += speed * 0.3;
  
  // Collision
  const newX = player.x + player.vx;
  const newY = player.y + player.vy;
  if (!isWall(newX, player.y)) player.x = newX;
  if (!isWall(player.x, newY)) player.y = newY;
  
  // Player angle follows mouse
  player.angle = Math.atan2(mouse.y - HEIGHT / 2, mouse.x - WIDTH / 2);
  
  // Flashlight toggle
  if (keys['KeyF'] && !keys['KeyF_prev']) {
    flashlightOn = !flashlightOn;
  }
  keys['KeyF_prev'] = keys['KeyF'];
  
  // O2 drain
  const drainRate = (keys['ShiftLeft'] || keys['ShiftRight']) ? 0.08 : 0.03;
  o2 = Math.max(0, o2 - drainRate);
  
  // Flashlight battery
  if (flashlightOn) {
    flashlightBattery = Math.max(0, flashlightBattery - 0.02);
    if (flashlightBattery <= 0) flashlightOn = false;
  }
  
  // Integrity decay
  integrity = Math.max(0, integrity - 0.005);
  
  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.hitFlash = Math.max(0, e.hitFlash - 1);
    e.attackCooldown = Math.max(0, e.attackCooldown - 1);
    
    // AI
    const distToPlayer = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
    if (distToPlayer < 150) {
      e.state = 'chase';
    } else if (distToPlayer > 250) {
      e.state = 'patrol';
    }
    
    if (e.state === 'chase') {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      const nx = e.x + Math.cos(angle) * e.speed;
      const ny = e.y + Math.sin(angle) * e.speed;
      if (!isWall(nx, e.y)) e.x = nx;
      if (!isWall(e.x, ny)) e.y = ny;
      
      // Attack
      if (distToPlayer < 30 && e.attackCooldown <= 0) {
        hp -= 10;
        shake(8);
        spawnBlood(player.x, player.y);
        e.attackCooldown = 60;
      }
    } else {
      // Patrol
      if (Math.random() < 0.02) e.dir = Math.random() * Math.PI * 2;
      const nx = e.x + Math.cos(e.dir) * e.speed * 0.3;
      const ny = e.y + Math.sin(e.dir) * e.speed * 0.3;
      if (!isWall(nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir = Math.random() * Math.PI * 2;
      }
    }
    
    // Death
    if (e.hp <= 0) {
      spawnBlood(e.x, e.y);
      spawnSparks(e.x, e.y);
      enemies.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.vy += 0.1; // Gravity
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  
  // Death
  if (hp <= 0 || o2 <= 0 || integrity <= 0) {
    gameState = 'gameover';
  }
  
  // Sector transition
  if (enemies.length === 0) {
    // All enemies dead - can proceed
  }
  
  // Update exposed state
  window.gameState = { o2, hp, integrity, sector, flashlightOn };
}

// Draw
function draw() {
  ctx.save();
  ctx.translate(screenShake.x, screenShake.y);
  
  // Background
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  if (gameState === 'title') {
    drawTitle();
  } else if (gameState === 'gameover') {
    drawGameOver();
  } else {
    drawGame();
  }
  
  ctx.restore();
}

function drawTitle() {
  // Animated background
  ctx.fillStyle = PALETTE.bgDark;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Scan lines
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let y = 0; y < HEIGHT; y += 4) {
    ctx.fillRect(0, y, WIDTH, 2);
  }
  
  // Title glow
  const glowSize = 120 + Math.sin(time * 0.05) * 10;
  const gradient = ctx.createRadialGradient(WIDTH/2, 200, 0, WIDTH/2, 200, glowSize);
  gradient.addColorStop(0, 'rgba(78, 205, 196, 0.3)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Title
  ctx.fillStyle = PALETTE.player;
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DERELICT', WIDTH / 2, 200);
  
  // Subtitle
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '18px monospace';
  ctx.fillText('A SURVIVAL HORROR EXPERIENCE', WIDTH / 2, 240);
  
  // Instructions
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px monospace';
  ctx.fillText('WASD - Move    SHIFT - Run    F - Flashlight', WIDTH / 2, 350);
  ctx.fillText('CLICK - Attack    Mouse - Aim', WIDTH / 2, 380);
  
  // Flashing prompt
  if (Math.floor(time / 30) % 2 === 0) {
    ctx.fillStyle = PALETTE.playerGlow;
    ctx.fillText('[ CLICK TO START ]', WIDTH / 2, 450);
  }
}

function drawGameOver() {
  ctx.fillStyle = PALETTE.bgDark;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Blood overlay
  ctx.fillStyle = 'rgba(139, 0, 0, 0.3)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.fillStyle = PALETTE.hp;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MISSION FAILED', WIDTH / 2, 250);
  
  ctx.fillStyle = PALETTE.text;
  ctx.font = '20px monospace';
  if (hp <= 0) ctx.fillText('You succumbed to your injuries', WIDTH / 2, 310);
  else if (o2 <= 0) ctx.fillText('Your oxygen supply depleted', WIDTH / 2, 310);
  else ctx.fillText('Hull breach - catastrophic failure', WIDTH / 2, 310);
  
  ctx.fillText('Sector Reached: ' + sector, WIDTH / 2, 360);
  
  if (Math.floor(time / 30) % 2 === 0) {
    ctx.fillStyle = PALETTE.playerGlow;
    ctx.fillText('[ CLICK TO RETRY ]', WIDTH / 2, 430);
  }
}

function drawGame() {
  const camX = player.x - WIDTH / 2;
  const camY = player.y - HEIGHT / 2;
  
  // Draw floor
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Floor grid pattern
  ctx.fillStyle = PALETTE.floorLight;
  for (let x = -camX % TILE; x < WIDTH; x += TILE) {
    for (let y = -camY % TILE; y < HEIGHT; y += TILE) {
      ctx.fillRect(x, y, 1, TILE);
      ctx.fillRect(x, y, TILE, 1);
    }
  }
  
  // Blood decals
  for (const d of decals) {
    const sx = d.x - camX;
    const sy = d.y - camY;
    if (sx > -50 && sx < WIDTH + 50 && sy > -50 && sy < HEIGHT + 50) {
      ctx.fillStyle = `rgba(139, 0, 0, ${d.alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, d.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw walls
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      if (room[y][x] === 1) {
        const sx = x * TILE - camX;
        const sy = y * TILE - camY;
        if (sx > -TILE && sx < WIDTH + TILE && sy > -TILE && sy < HEIGHT + TILE) {
          // Wall with 3D effect
          ctx.fillStyle = PALETTE.wall;
          ctx.fillRect(sx, sy, TILE, TILE);
          ctx.fillStyle = PALETTE.wallLight;
          ctx.fillRect(sx, sy, TILE, 4);
          ctx.fillRect(sx, sy, 4, TILE);
          ctx.fillStyle = PALETTE.bgDark;
          ctx.fillRect(sx + TILE - 4, sy, 4, TILE);
          ctx.fillRect(sx, sy + TILE - 4, TILE, 4);
        }
      }
    }
  }
  
  // Draw ambient lights
  for (const light of lights) {
    const sx = light.x - camX;
    const sy = light.y - camY;
    const flicker = 1 + Math.sin(time * 0.1 + light.flicker * 100) * light.flicker;
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, light.radius * flicker);
    gradient.addColorStop(0, light.color + '30');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(sx - light.radius, sy - light.radius, light.radius * 2, light.radius * 2);
  }
  
  // Draw enemies (only if visible)
  for (const e of enemies) {
    const sx = e.x - camX;
    const sy = e.y - camY;
    
    if (isInVisionCone(e.x, e.y)) {
      // Enemy glow
      const glowGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 25);
      glowGradient.addColorStop(0, e.hitFlash > 0 ? '#ffffff50' : PALETTE.enemyGlow + '30');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(sx, sy, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemy body
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : PALETTE.enemy;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(sx - 4, sy - 3, 2, 0, Math.PI * 2);
      ctx.arc(sx + 4, sy - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // HP bar
      const hpPct = e.hp / e.maxHp;
      ctx.fillStyle = '#000000';
      ctx.fillRect(sx - 15, sy - 25, 30, 4);
      ctx.fillStyle = PALETTE.hp;
      ctx.fillRect(sx - 15, sy - 25, 30 * hpPct, 4);
    }
  }
  
  // Draw vision cone / fog of war
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const range = flashlightOn ? FLASHLIGHT_RANGE : VISION_RANGE;
  
  // Vision cone shape
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, range, player.angle - VISION_ANGLE / 2, player.angle + VISION_ANGLE / 2);
  ctx.closePath();
  
  // Gradient for vision
  const visionGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, range);
  visionGradient.addColorStop(0, 'rgba(255,255,255,1)');
  visionGradient.addColorStop(0.7, 'rgba(255,255,255,0.8)');
  visionGradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = visionGradient;
  ctx.fill();
  
  // Also show immediate area around player
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
  const nearGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
  nearGradient.addColorStop(0, 'rgba(255,255,255,0.5)');
  nearGradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = nearGradient;
  ctx.fill();
  
  ctx.restore();
  
  // Flashlight beam effect (additive)
  if (flashlightOn) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, FLASHLIGHT_RANGE, player.angle - VISION_ANGLE / 2, player.angle + VISION_ANGLE / 2);
    ctx.closePath();
    const flashGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, FLASHLIGHT_RANGE);
    flashGradient.addColorStop(0, 'rgba(255, 250, 230, 0.15)');
    flashGradient.addColorStop(0.5, 'rgba(255, 250, 230, 0.05)');
    flashGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGradient;
    ctx.fill();
    ctx.restore();
  }
  
  // Draw player
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(player.angle);
  
  // Player glow
  const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
  playerGlow.addColorStop(0, PALETTE.playerGlow + '40');
  playerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = playerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // Player body
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Direction indicator
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(8, -4);
  ctx.lineTo(8, 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  // Draw particles
  for (const p of particles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // HUD
  drawHUD();
}

function drawHUD() {
  const hudY = 20;
  
  // HUD background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 10, 200, 100);
  ctx.strokeStyle = PALETTE.playerGlow;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 200, 100);
  
  // O2
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('O2', 20, hudY + 15);
  ctx.fillStyle = '#333';
  ctx.fillRect(45, hudY + 5, 150, 12);
  ctx.fillStyle = PALETTE.o2;
  ctx.fillRect(45, hudY + 5, 150 * (o2 / maxO2), 12);
  
  // HP
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText('HP', 20, hudY + 35);
  ctx.fillStyle = '#333';
  ctx.fillRect(45, hudY + 25, 150, 12);
  ctx.fillStyle = PALETTE.hp;
  ctx.fillRect(45, hudY + 25, 150 * (hp / maxHp), 12);
  
  // Integrity
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText('HULL', 20, hudY + 55);
  ctx.fillStyle = '#333';
  ctx.fillRect(45, hudY + 45, 150, 12);
  ctx.fillStyle = PALETTE.integrity;
  ctx.fillRect(45, hudY + 45, 150 * (integrity / 100), 12);
  
  // Flashlight
  ctx.fillStyle = flashlightOn ? PALETTE.playerGlow : PALETTE.textDim;
  ctx.fillText('LIGHT: ' + (flashlightOn ? 'ON' : 'OFF'), 20, hudY + 75);
  ctx.fillStyle = '#333';
  ctx.fillRect(90, hudY + 65, 105, 12);
  ctx.fillStyle = PALETTE.flashlight;
  ctx.fillRect(90, hudY + 65, 105 * (flashlightBattery / 100), 12);
  
  // Sector
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('SECTOR ' + sector, WIDTH - 20, 30);
  
  // Enemy count
  ctx.fillStyle = enemies.length > 0 ? PALETTE.enemy : PALETTE.playerGlow;
  ctx.font = '14px monospace';
  ctx.fillText('HOSTILES: ' + enemies.length, WIDTH - 20, 55);
  
  // Scan lines overlay
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let y = 0; y < HEIGHT; y += 3) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
  
  // Vignette
  const vignette = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, HEIGHT/3, WIDTH/2, HEIGHT/2, HEIGHT);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start
gameLoop();
console.log('Derelict Polished loaded');
