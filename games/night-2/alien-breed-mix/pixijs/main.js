// Station Breach - Twin-Stick Shooter (Canvas Implementation)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game state
const game = {
  player: null,
  enemies: [],
  bullets: [],
  pickups: [],
  particles: [],
  keys: {},
  mouse: { x: 400, y: 300, down: false },
  level: null,
  score: 0,
  wave: 1,
  gameOver: false,
  screenShake: { x: 0, y: 0, duration: 0 }
};

// Expose for testing
window.gameState = game;

// Generate level
function generateLevel(width, height) {
  const level = [];
  for (let y = 0; y < height; y++) {
    level[y] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        level[y][x] = 1;
      } else if (Math.random() < 0.05) {
        level[y][x] = 1;
      } else {
        level[y][x] = 0;
      }
    }
  }
  // Clear spawn area
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (level[cy + dy]) level[cy + dy][cx + dx] = 0;
    }
  }
  return level;
}

// Create player
function createPlayer(x, y) {
  return {
    x, y,
    hp: 100,
    maxHp: 100,
    ammo: 12,
    maxAmmo: 12,
    shootCooldown: 0,
    reloading: false,
    reloadTimer: 0,
    angle: 0
  };
}

// Create enemy
function createEnemy(x, y, type) {
  let hp, damage, speed, radius, points, attackRange, color;

  switch (type) {
    case 'drone':
      hp = 20; damage = 10; speed = 120; radius = 10; points = 5; attackRange = 30; color = '#ff4444';
      break;
    case 'spitter':
      hp = 30; damage = 15; speed = 80; radius = 14; points = 10; attackRange = 300; color = '#44ff44';
      break;
    case 'brute':
      hp = 100; damage = 30; speed = 60; radius = 20; points = 30; attackRange = 40; color = '#884444';
      break;
    default:
      hp = 20; damage = 10; speed = 120; radius = 10; points = 5; attackRange = 30; color = '#ff4444';
  }

  return { x, y, type, hp, damage, speed, radius, points, attackRange, attackCooldown: Math.random() * 0.5 + 0.5, color, angle: 0 };
}

// Create bullet
function createBullet(x, y, angle, isEnemy = false) {
  return {
    x, y, angle,
    speed: isEnemy ? 300 : 800,
    damage: isEnemy ? 15 : 15,
    life: isEnemy ? 2 : 0.7,
    isEnemy,
    radius: isEnemy ? 5 : 4,
    color: isEnemy ? '#00ff88' : '#ffff00'
  };
}

// Create pickup
function createPickup(x, y, type) {
  return { x, y, type };
}

// Create particle
function createParticle(x, y, vx, vy, life, color) {
  return { x, y, vx, vy, life, maxLife: life, color, radius: 2 + Math.random() * 2 };
}

// Initialize
const LEVEL_WIDTH = 25;
const LEVEL_HEIGHT = 19;
game.level = generateLevel(LEVEL_WIDTH, LEVEL_HEIGHT);
game.player = createPlayer(GAME_WIDTH / 2, GAME_HEIGHT / 2);

// Spawn wave
function spawnWave(waveNum) {
  const count = 3 + waveNum * 2;
  for (let i = 0; i < count; i++) {
    let x, y;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: x = 100 + Math.random() * (GAME_WIDTH - 200); y = 50; break;
      case 1: x = 100 + Math.random() * (GAME_WIDTH - 200); y = GAME_HEIGHT - 50; break;
      case 2: x = 50; y = 100 + Math.random() * (GAME_HEIGHT - 200); break;
      case 3: x = GAME_WIDTH - 50; y = 100 + Math.random() * (GAME_HEIGHT - 200); break;
    }

    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    if (game.level[tileY]?.[tileX] === 1) continue;

    const type = Math.random() < 0.7 ? 'drone' : Math.random() < 0.5 ? 'spitter' : 'brute';
    game.enemies.push(createEnemy(x, y, type));
  }
  game.waveMessage = `WAVE ${waveNum}`;
  game.waveMessageTimer = 2;
}

spawnWave(1);

// Input
window.addEventListener('keydown', (e) => {
  game.keys[e.key.toLowerCase()] = true;
  if (e.key === 'r' && !game.gameOver) {
    if (game.player.ammo < game.player.maxAmmo && !game.player.reloading) {
      game.player.reloading = true;
      game.player.reloadTimer = 1.2;
    }
  }
  if (e.key === 'Enter' && game.gameOver) restartGame();
});

window.addEventListener('keyup', (e) => {
  game.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = e.clientX - rect.left;
  game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => game.mouse.down = true);
canvas.addEventListener('mouseup', () => game.mouse.down = false);

// Collision
function checkWallCollision(x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  if (tileY < 0 || tileY >= game.level.length || tileX < 0 || tileX >= game.level[0].length) return true;
  return game.level[tileY][tileX] === 1;
}

// Screen shake
function addScreenShake(intensity, duration) {
  game.screenShake.x = intensity;
  game.screenShake.y = intensity;
  game.screenShake.duration = duration;
}

// Hit particles
function createHitParticles(x, y, color = '#00ff88') {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 100;
    game.particles.push(createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.3 + Math.random() * 0.2, color));
  }
}

// Restart
function restartGame() {
  game.enemies = [];
  game.bullets = [];
  game.pickups = [];
  game.particles = [];
  game.player = createPlayer(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  game.wave = 1;
  game.score = 0;
  game.gameOver = false;
  spawnWave(1);
}

// Update
let lastTime = 0;
let waveTimer = 0;

function update(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  if (game.gameOver) {
    render();
    requestAnimationFrame(update);
    return;
  }

  const player = game.player;

  // Screen shake update
  if (game.screenShake.duration > 0) {
    game.screenShake.duration -= dt;
  }

  // Player movement
  let dx = 0, dy = 0;
  if (game.keys['w'] || game.keys['arrowup']) dy = -1;
  if (game.keys['s'] || game.keys['arrowdown']) dy = 1;
  if (game.keys['a'] || game.keys['arrowleft']) dx = -1;
  if (game.keys['d'] || game.keys['arrowright']) dx = 1;

  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const speed = game.keys['shift'] ? 270 : 180;
  const newX = player.x + dx * speed * dt;
  const newY = player.y + dy * speed * dt;

  if (!checkWallCollision(newX, player.y)) player.x = newX;
  if (!checkWallCollision(player.x, newY)) player.y = newY;

  // Player aim
  player.angle = Math.atan2(game.mouse.y - player.y, game.mouse.x - player.x);

  // Shooting
  player.shootCooldown -= dt;
  if (game.mouse.down && player.shootCooldown <= 0 && player.ammo > 0 && !player.reloading) {
    player.ammo--;
    player.shootCooldown = 0.25;
    const bx = player.x + Math.cos(player.angle) * 20;
    const by = player.y + Math.sin(player.angle) * 20;
    game.bullets.push(createBullet(bx, by, player.angle, false));
    addScreenShake(2, 0.05);
    // Muzzle flash particle
    game.particles.push(createParticle(bx, by, 0, 0, 0.05, '#ffff88'));
  }

  // Reload
  if (player.reloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.ammo = player.maxAmmo;
      player.reloading = false;
    }
  }

  // Update bullets
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    b.life -= dt;

    if (checkWallCollision(b.x, b.y) || b.life <= 0) {
      game.bullets.splice(i, 1);
      continue;
    }

    // Player bullet vs enemies
    if (!b.isEnemy) {
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        const e = game.enemies[j];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.radius + b.radius) {
          e.hp -= b.damage;
          createHitParticles(b.x, b.y, '#00ff88');
          e.x += Math.cos(b.angle) * b.damage * 2;
          e.y += Math.sin(b.angle) * b.damage * 2;

          if (e.hp <= 0) {
            game.enemies.splice(j, 1);
            game.score += e.points;
            if (Math.random() < 0.3) {
              game.pickups.push(createPickup(e.x, e.y, Math.random() < 0.5 ? 'health' : 'ammo'));
            }
          }

          game.bullets.splice(i, 1);
          break;
        }
      }
    } else {
      // Enemy bullet vs player
      const dist = Math.hypot(b.x - player.x, b.y - player.y);
      if (dist < 16) {
        player.hp -= b.damage;
        addScreenShake(3, 0.05);
        game.bullets.splice(i, 1);
        if (player.hp <= 0) game.gameOver = true;
      }
    }
  }

  // Update enemies
  for (const e of game.enemies) {
    const toPlayerX = player.x - e.x;
    const toPlayerY = player.y - e.y;
    const dist = Math.hypot(toPlayerX, toPlayerY);
    e.angle = Math.atan2(toPlayerY, toPlayerX);

    // Movement
    if (e.type === 'drone' || e.type === 'brute') {
      if (dist > e.attackRange) {
        const mx = Math.cos(e.angle) * e.speed * dt;
        const my = Math.sin(e.angle) * e.speed * dt;
        if (!checkWallCollision(e.x + mx, e.y)) e.x += mx;
        if (!checkWallCollision(e.x, e.y + my)) e.y += my;
      }
    } else if (e.type === 'spitter') {
      if (dist < 150) {
        e.x -= Math.cos(e.angle) * e.speed * dt;
        e.y -= Math.sin(e.angle) * e.speed * dt;
      } else if (dist > 300) {
        e.x += Math.cos(e.angle) * e.speed * 0.5 * dt;
        e.y += Math.sin(e.angle) * e.speed * 0.5 * dt;
      }
    }

    // Attack
    e.attackCooldown -= dt;
    if (e.attackCooldown <= 0 && dist < e.attackRange) {
      if (e.type === 'spitter') {
        game.bullets.push(createBullet(e.x, e.y, e.angle, true));
        e.attackCooldown = 2.0;
      } else {
        player.hp -= e.damage;
        addScreenShake(5, 0.1);
        e.attackCooldown = 1.0;
        if (player.hp <= 0) game.gameOver = true;
      }
    }
  }

  // Update pickups
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const p = game.pickups[i];
    const dist = Math.hypot(p.x - player.x, p.y - player.y);
    if (dist < 32) {
      if (p.type === 'health') player.hp = Math.min(player.hp + 25, player.maxHp);
      else if (p.type === 'ammo') player.ammo = Math.min(player.ammo + 6, player.maxAmmo);
      game.pickups.splice(i, 1);
    }
  }

  // Update particles
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) game.particles.splice(i, 1);
  }

  // Wave message
  if (game.waveMessageTimer > 0) game.waveMessageTimer -= dt;

  // Check wave complete
  if (game.enemies.length === 0 && game.waveMessageTimer <= 0) {
    waveTimer += dt;
    if (waveTimer > 2) {
      game.wave++;
      spawnWave(game.wave);
      waveTimer = 0;
    }
  }

  render();
  requestAnimationFrame(update);
}

// Render
function render() {
  // Screen shake offset
  let shakeX = 0, shakeY = 0;
  if (game.screenShake.duration > 0) {
    shakeX = (Math.random() - 0.5) * game.screenShake.x * 2;
    shakeY = (Math.random() - 0.5) * game.screenShake.y * 2;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Clear
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Draw level
  for (let y = 0; y < game.level.length; y++) {
    for (let x = 0; x < game.level[y].length; x++) {
      ctx.fillStyle = game.level[y][x] === 1 ? '#4a4a4a' : '#2a2a2a';
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  // Draw pickups
  for (const p of game.pickups) {
    if (p.type === 'health') {
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(p.x - 8, p.y - 8, 16, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - 2, p.y - 6, 4, 12);
      ctx.fillRect(p.x - 6, p.y - 2, 12, 4);
    } else {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(p.x - 8, p.y - 6, 16, 12);
    }
  }

  // Draw bullets
  for (const b of game.bullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw particles
  for (const p of game.particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw enemies
  for (const e of game.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#220000';
    ctx.fillRect(e.radius * 0.3, -2, e.radius * 0.6, 4);
    ctx.restore();
  }

  // Draw player
  const player = game.player;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = '#4488ff';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888888';
  ctx.fillRect(8, -3, 12, 6);
  ctx.restore();

  ctx.restore();

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, 40);

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  const reloadStr = player.reloading ? ' [RELOADING]' : '';
  ctx.fillText(`HP: ${Math.floor(player.hp)} | Ammo: ${player.ammo}/${player.maxAmmo}${reloadStr} | Wave: ${game.wave} | Score: ${game.score}`, 10, 28);

  // Health bar
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(GAME_WIDTH - 210, 10, 200 * (player.hp / player.maxHp), 20);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(GAME_WIDTH - 210, 10, 200, 20);

  // Wave message
  if (game.waveMessageTimer > 0) {
    ctx.fillStyle = `rgba(255, 68, 68, ${game.waveMessageTimer / 2})`;
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.waveMessage, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
    ctx.textAlign = 'left';
  }

  // Game over
  if (game.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#ff0000';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Final Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    ctx.fillText('Press ENTER to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    ctx.textAlign = 'left';
  }
}

// Start game
requestAnimationFrame(update);
console.log('Station Breach initialized! WASD to move, mouse to aim, click to shoot, R to reload.');
