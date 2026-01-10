// Caribbean Admiral - Naval Arcade (crisp-game-lib style simplified)
// Uses vanilla Canvas with crisp-game-lib-like minimalist design
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 400;
const HEIGHT = 300;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Colors (crisp-game-lib inspired palette)
const COLORS = {
  bg: '#1a2744',
  water: '#2d4a7c',
  ship: '#ffffff',
  enemy: '#ff6b6b',
  gold: '#ffd700',
  cannon: '#ffaa00',
  text: '#ffffff'
};

// Game state
const game = {
  screen: 'title',
  score: 0,
  gold: 0,
  hp: 3,
  maxHp: 3,
  wave: 1,
  player: { x: 50, y: HEIGHT / 2, vy: 0 },
  enemies: [],
  bullets: [],
  coins: [],
  particles: [],
  keys: {},
  difficulty: 1,
  waveTimer: 0,
  highScore: 0
};

// Expose for testing
window.gameState = game;

// Input handling
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  game.keys[e.code] = true;

  if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
  } else if (game.screen === 'gameover' && e.key === 'Enter') {
    game.screen = 'title';
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
  game.keys[e.code] = false;
});

function startGame() {
  game.screen = 'game';
  game.score = 0;
  game.gold = 0;
  game.hp = 3;
  game.wave = 1;
  game.difficulty = 1;
  game.waveTimer = 0;
  game.player = { x: 50, y: HEIGHT / 2, vy: 0, shootCooldown: 0 };
  game.enemies = [];
  game.bullets = [];
  game.coins = [];
  game.particles = [];
}

// Update
function update(dt) {
  if (game.screen !== 'game') return;

  const p = game.player;

  // Player movement
  if (game.keys['w'] || game.keys['arrowup']) {
    p.vy = -150;
  } else if (game.keys['s'] || game.keys['arrowdown']) {
    p.vy = 150;
  } else {
    p.vy *= 0.9;
  }

  p.y += p.vy * dt;
  p.y = Math.max(20, Math.min(HEIGHT - 20, p.y));

  // Shooting
  if (p.shootCooldown > 0) p.shootCooldown -= dt;
  if ((game.keys[' '] || game.keys['x']) && p.shootCooldown <= 0) {
    game.bullets.push({
      x: p.x + 15,
      y: p.y,
      vx: 300,
      vy: 0
    });
    p.shootCooldown = 0.25;
    addParticles(p.x + 15, p.y, COLORS.cannon, 3);
  }

  // Wave management
  game.waveTimer += dt;
  if (game.waveTimer > 10 + game.wave * 2) {
    game.wave++;
    game.difficulty = Math.min(game.difficulty + 0.2, 3);
    game.waveTimer = 0;
  }

  // Spawn enemies
  if (Math.random() < 0.02 * game.difficulty) {
    const enemyType = Math.random() < 0.7 ? 'pirate' : 'ship';
    game.enemies.push({
      type: enemyType,
      x: WIDTH + 20,
      y: 30 + Math.random() * (HEIGHT - 60),
      hp: enemyType === 'pirate' ? 1 : 2,
      shootTimer: Math.random() * 2
    });
  }

  // Update enemies
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    e.x -= (50 + game.difficulty * 20) * dt;

    // Enemy shooting
    e.shootTimer -= dt;
    if (e.shootTimer <= 0 && e.type === 'ship') {
      game.bullets.push({
        x: e.x - 10,
        y: e.y,
        vx: -200,
        vy: (Math.random() - 0.5) * 50,
        enemy: true
      });
      e.shootTimer = 2 + Math.random();
    }

    // Remove off-screen enemies
    if (e.x < -30) {
      game.enemies.splice(i, 1);
    }
  }

  // Update bullets
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    const b = game.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Remove off-screen bullets
    if (b.x < -10 || b.x > WIDTH + 10 || b.y < -10 || b.y > HEIGHT + 10) {
      game.bullets.splice(i, 1);
      continue;
    }

    // Player bullets hit enemies
    if (!b.enemy) {
      for (let j = game.enemies.length - 1; j >= 0; j--) {
        const e = game.enemies[j];
        if (Math.abs(b.x - e.x) < 15 && Math.abs(b.y - e.y) < 12) {
          e.hp--;
          game.bullets.splice(i, 1);
          addParticles(e.x, e.y, COLORS.enemy, 5);

          if (e.hp <= 0) {
            // Drop coins
            const coinCount = e.type === 'ship' ? 3 : 1;
            for (let c = 0; c < coinCount; c++) {
              game.coins.push({
                x: e.x + (Math.random() - 0.5) * 20,
                y: e.y + (Math.random() - 0.5) * 20,
                life: 5
              });
            }
            game.score += e.type === 'ship' ? 100 : 50;
            game.enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    // Enemy bullets hit player
    if (b.enemy) {
      if (Math.abs(b.x - p.x) < 12 && Math.abs(b.y - p.y) < 10) {
        game.hp--;
        game.bullets.splice(i, 1);
        addParticles(p.x, p.y, '#ff0000', 8);
        if (game.hp <= 0) {
          game.screen = 'gameover';
          if (game.score > game.highScore) game.highScore = game.score;
        }
      }
    }
  }

  // Enemies collide with player
  for (const e of game.enemies) {
    if (Math.abs(e.x - p.x) < 15 && Math.abs(e.y - p.y) < 12) {
      game.hp--;
      e.hp = 0;
      addParticles(p.x, p.y, '#ff0000', 8);
      if (game.hp <= 0) {
        game.screen = 'gameover';
        if (game.score > game.highScore) game.highScore = game.score;
      }
    }
  }
  game.enemies = game.enemies.filter(e => e.hp > 0);

  // Update coins
  for (let i = game.coins.length - 1; i >= 0; i--) {
    const c = game.coins[i];
    c.life -= dt;

    // Coin moves toward player if close
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 60) {
      c.x += (dx / dist) * 100 * dt;
      c.y += (dy / dist) * 100 * dt;
    }

    // Collect coin
    if (dist < 15) {
      game.gold += 10;
      game.score += 10;
      game.coins.splice(i, 1);
      continue;
    }

    if (c.life <= 0) {
      game.coins.splice(i, 1);
    }
  }

  // Update particles
  game.particles = game.particles.filter(part => {
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.life -= dt;
    return part.life > 0;
  });

  // HP regeneration from gold
  if (game.gold >= 100 && game.hp < game.maxHp) {
    game.gold -= 100;
    game.hp++;
  }
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      color,
      life: 0.3 + Math.random() * 0.3
    });
  }
}

// Render
function render() {
  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Water waves
  ctx.fillStyle = COLORS.water;
  for (let y = 0; y < HEIGHT; y += 20) {
    const offset = Math.sin(Date.now() * 0.002 + y * 0.1) * 5;
    ctx.fillRect(0, y + offset, WIDTH, 3);
  }

  if (game.screen === 'title') {
    renderTitle();
  } else if (game.screen === 'game') {
    renderGame();
  } else if (game.screen === 'gameover') {
    renderGameOver();
  }
}

function renderTitle() {
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('CARIBBEAN', WIDTH / 2, 80);
  ctx.fillText('ADMIRAL', WIDTH / 2, 110);

  ctx.font = '12px Courier New';
  ctx.fillStyle = '#88aacc';
  ctx.fillText('Naval Arcade Edition', WIDTH / 2, 140);

  // Ship preview
  ctx.fillStyle = COLORS.ship;
  drawShip(WIDTH / 2 - 15, 180);

  ctx.fillStyle = COLORS.text;
  ctx.font = '10px Courier New';
  ctx.fillText('W/S: Move Up/Down', WIDTH / 2, 230);
  ctx.fillText('SPACE: Fire Cannons', WIDTH / 2, 245);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '14px Courier New';
  ctx.fillText('Press ENTER to Start', WIDTH / 2, 280);

  if (game.highScore > 0) {
    ctx.fillStyle = '#88aacc';
    ctx.font = '10px Courier New';
    ctx.fillText(`High Score: ${game.highScore}`, WIDTH / 2, 295);
  }
}

function renderGame() {
  const p = game.player;

  // Coins
  ctx.fillStyle = COLORS.gold;
  for (const c of game.coins) {
    const size = 4 + Math.sin(Date.now() * 0.01 + c.x) * 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of game.enemies) {
    ctx.fillStyle = COLORS.enemy;
    if (e.type === 'pirate') {
      drawPirate(e.x - 10, e.y);
    } else {
      drawEnemyShip(e.x - 15, e.y);
    }
  }

  // Bullets
  for (const b of game.bullets) {
    ctx.fillStyle = b.enemy ? COLORS.enemy : COLORS.cannon;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.enemy ? 3 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player ship
  ctx.fillStyle = COLORS.ship;
  drawShip(p.x - 15, p.y);

  // Particles
  for (const part of game.particles) {
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.life * 2;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, WIDTH, 20);

  ctx.fillStyle = COLORS.text;
  ctx.font = '10px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${game.score}`, 5, 14);

  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`Gold: ${game.gold}`, 100, 14);

  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Wave: ${game.wave}`, 180, 14);

  // HP hearts
  ctx.fillStyle = '#ff4444';
  for (let i = 0; i < game.maxHp; i++) {
    ctx.globalAlpha = i < game.hp ? 1 : 0.3;
    ctx.fillText('♥', WIDTH - 50 + i * 15, 14);
  }
  ctx.globalAlpha = 1;
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, 100);

  ctx.fillStyle = COLORS.text;
  ctx.font = '14px Courier New';
  ctx.fillText(`Final Score: ${game.score}`, WIDTH / 2, 150);
  ctx.fillText(`Gold Collected: ${game.gold}`, WIDTH / 2, 175);
  ctx.fillText(`Waves Survived: ${game.wave}`, WIDTH / 2, 200);

  if (game.score >= game.highScore && game.highScore > 0) {
    ctx.fillStyle = COLORS.gold;
    ctx.fillText('NEW HIGH SCORE!', WIDTH / 2, 230);
  }

  ctx.fillStyle = COLORS.text;
  ctx.font = '12px Courier New';
  ctx.fillText('Press ENTER to continue', WIDTH / 2, 270);
}

// Drawing functions
function drawShip(x, y) {
  // Hull
  ctx.fillRect(x, y - 5, 30, 10);
  // Bow
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 5);
  ctx.lineTo(x + 40, y);
  ctx.lineTo(x + 30, y + 5);
  ctx.fill();
  // Mast
  ctx.fillRect(x + 12, y - 15, 3, 20);
  // Sail
  ctx.fillRect(x + 8, y - 12, 12, 8);
}

function drawEnemyShip(x, y) {
  // Hull
  ctx.fillRect(x, y - 5, 30, 10);
  // Bow (facing left)
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x - 10, y);
  ctx.lineTo(x, y + 5);
  ctx.fill();
  // Mast
  ctx.fillRect(x + 15, y - 12, 3, 17);
  // Skull flag
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 10, y - 12, 8, 6);
  ctx.fillStyle = COLORS.enemy;
}

function drawPirate(x, y) {
  // Simple raft/small boat
  ctx.fillRect(x, y - 3, 20, 6);
  ctx.beginPath();
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x - 5, y);
  ctx.lineTo(x, y + 3);
  ctx.fill();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
console.log('Caribbean Admiral initialized! Press ENTER to start.');
