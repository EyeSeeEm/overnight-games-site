// Using global crisp-game-lib from CDN

// Game state
let player;
let enemies;
let bullets;
let items;
let gs;
let restartTimer;

// Constants
const PLAYER_SPEED = 2;
const BULLET_SPEED = 5;
const ENEMY_SPEED = 1;

const title = 'STATION BREACH';
const description = `[WASD] Move
[Click] Shoot`;

const characters = [
  // Player (a)
  `
  llll
 llllll
 llLLll
 llllll
  llll
`,
  // Drone (b)
  `
  RR
 RRRR
 RRRR
  RR
`,
  // Bullet (c)
  `
 y
 y
`,
  // Item (d)
  `
 gg
 gg
`,
  // Spitter (e)
  `
  PP
 PPPP
  PP
 P  P
`
];

const options = {
  viewSize: { x: 150, y: 150 },
  isCapturing: false,
  isPlayingBgm: false,
  seed: 0,
  theme: 'dark'
};

// Expose game state for testing
function updateGameState() {
  if (typeof window !== 'undefined' && gs) {
    window.gameState = {
      health: gs.health,
      ammo: gs.ammo,
      score: gs.score,
      kills: gs.kills,
      wave: gs.wave,
      isDead: gs.isDead
    };
  }
}

function update() {
  // Initialize on first tick
  if (!ticks) {
    player = {
      pos: vec(75, 130),
      angle: -PI / 2
    };
    enemies = [];
    bullets = [];
    items = [];
    gs = {
      health: 100,
      maxHealth: 100,
      ammo: 50,
      score: 0,
      kills: 0,
      wave: 1,
      waveTimer: 0,
      spawnTimer: 0,
      isDead: false
    };
    restartTimer = 0;
  }

  // Update game state for testing
  updateGameState();

  if (gs.isDead) {
    color('red');
    text('GAME OVER', 75, 60, { isSmallText: false });
    text('Click to restart', 75, 80, { isSmallText: true });
    restartTimer++;
    if (restartTimer > 30 && input.isJustPressed) {
      gs.isDead = false;
      gs.health = 100;
      gs.ammo = 50;
      gs.kills = 0;
      gs.wave = 1;
      gs.waveTimer = 0;
      gs.spawnTimer = 0;
      enemies = [];
      bullets = [];
      items = [];
      player.pos = vec(75, 130);
      restartTimer = 0;
    }
    return;
  }

  // Draw floor grid
  color('light_black');
  for (let x = 0; x < 150; x += 10) {
    line(vec(x, 0), vec(x, 150), 1);
  }
  for (let y = 0; y < 150; y += 10) {
    line(vec(0, y), vec(150, y), 1);
  }

  // Player movement
  let dx = 0, dy = 0;

  // Keyboard movement
  if (input.isPressed) {
    // Touch/mouse can be used for aiming
  }

  if (keyboard.isPressed.w || keyboard.isPressed.ArrowUp) dy -= PLAYER_SPEED;
  if (keyboard.isPressed.s || keyboard.isPressed.ArrowDown) dy += PLAYER_SPEED;
  if (keyboard.isPressed.a || keyboard.isPressed.ArrowLeft) dx -= PLAYER_SPEED;
  if (keyboard.isPressed.d || keyboard.isPressed.ArrowRight) dx += PLAYER_SPEED;

  player.pos.x = clamp(player.pos.x + dx, 5, 145);
  player.pos.y = clamp(player.pos.y + dy, 5, 145);

  // Player aiming toward mouse
  if (input.pos.x !== undefined) {
    player.angle = Math.atan2(input.pos.y - player.pos.y, input.pos.x - player.pos.x);
  }

  // Shooting
  if (input.isJustPressed && gs.ammo > 0) {
    gs.ammo--;
    play('laser');
    bullets.push({
      pos: vec(player.pos.x, player.pos.y),
      vel: vec(cos(player.angle) * BULLET_SPEED, sin(player.angle) * BULLET_SPEED),
      damage: 15,
      isEnemy: false
    });
  }

  // Draw player
  color('cyan');
  char('a', player.pos);

  // Aim indicator
  color('yellow');
  const aimX = player.pos.x + cos(player.angle) * 10;
  const aimY = player.pos.y + sin(player.angle) * 10;
  box(vec(aimX, aimY), 2, 2);

  // Spawn enemies
  gs.spawnTimer++;
  const spawnInterval = Math.max(30, 120 - gs.wave * 10);
  if (gs.spawnTimer >= spawnInterval && enemies.length < 10 + gs.wave * 2) {
    gs.spawnTimer = 0;

    // Spawn from edges
    const side = rndi(0, 4);
    let ex, ey;
    if (side === 0) { ex = rnd(0, 150); ey = 0; }
    else if (side === 1) { ex = rnd(0, 150); ey = 150; }
    else if (side === 2) { ex = 0; ey = rnd(0, 150); }
    else { ex = 150; ey = rnd(0, 150); }

    const enemyType = rnd() < 0.7 ? 'drone' : 'spitter';
    enemies.push({
      pos: vec(ex, ey),
      type: enemyType,
      hp: enemyType === 'drone' ? 20 : 30,
      attackTimer: 0
    });
  }

  // Update enemies
  enemies = enemies.filter(enemy => {
    // Move toward player
    const angle = Math.atan2(player.pos.y - enemy.pos.y, player.pos.x - enemy.pos.x);
    const speed = enemy.type === 'drone' ? ENEMY_SPEED * 1.2 : ENEMY_SPEED * 0.8;

    if (enemy.type === 'spitter') {
      // Spitter keeps distance and shoots
      const dist = Math.hypot(player.pos.x - enemy.pos.x, player.pos.y - enemy.pos.y);
      if (dist > 50) {
        enemy.pos.x += cos(angle) * speed;
        enemy.pos.y += sin(angle) * speed;
      } else if (dist < 30) {
        enemy.pos.x -= cos(angle) * speed;
        enemy.pos.y -= sin(angle) * speed;
      }

      // Shoot acid
      enemy.attackTimer++;
      if (enemy.attackTimer >= 90) {
        enemy.attackTimer = 0;
        bullets.push({
          pos: vec(enemy.pos.x, enemy.pos.y),
          vel: vec(cos(angle) * 3, sin(angle) * 3),
          damage: 15,
          isEnemy: true
        });
      }
    } else {
      // Drone rushes player
      enemy.pos.x += cos(angle) * speed;
      enemy.pos.y += sin(angle) * speed;
    }

    // Draw enemy
    color(enemy.type === 'drone' ? 'red' : 'purple');
    char(enemy.type === 'drone' ? 'b' : 'e', enemy.pos);

    // Check collision with player (melee damage)
    if (enemy.type === 'drone') {
      const dist = Math.hypot(player.pos.x - enemy.pos.x, player.pos.y - enemy.pos.y);
      if (dist < 8) {
        gs.health -= 10;
        play('hit');
        // Knockback
        enemy.pos.x -= cos(angle) * 10;
        enemy.pos.y -= sin(angle) * 10;
      }
    }

    return enemy.hp > 0;
  });

  // Update bullets
  bullets = bullets.filter(bullet => {
    bullet.pos.x += bullet.vel.x;
    bullet.pos.y += bullet.vel.y;

    // Draw bullet
    color(bullet.isEnemy ? 'green' : 'yellow');
    char('c', bullet.pos);

    // Check bounds
    if (bullet.pos.x < 0 || bullet.pos.x > 150 || bullet.pos.y < 0 || bullet.pos.y > 150) {
      return false;
    }

    // Check collision
    if (bullet.isEnemy) {
      // Enemy bullet hits player
      const dist = Math.hypot(player.pos.x - bullet.pos.x, player.pos.y - bullet.pos.y);
      if (dist < 8) {
        gs.health -= bullet.damage;
        play('hit');
        return false;
      }
    } else {
      // Player bullet hits enemies
      for (const enemy of enemies) {
        const dist = Math.hypot(enemy.pos.x - bullet.pos.x, enemy.pos.y - bullet.pos.y);
        if (dist < 8) {
          enemy.hp -= bullet.damage;
          play('explosion');
          if (enemy.hp <= 0) {
            gs.kills++;
            gs.score += enemy.type === 'drone' ? 50 : 100;
            addScore(enemy.type === 'drone' ? 50 : 100);

            // Drop item
            if (rnd() < 0.3) {
              items.push({
                pos: vec(enemy.pos.x, enemy.pos.y),
                type: rnd() < 0.5 ? 'ammo' : 'health'
              });
            }
          }
          return false;
        }
      }
    }

    return true;
  });

  // Update items
  items = items.filter(item => {
    color(item.type === 'ammo' ? 'yellow' : 'red');
    char('d', item.pos);

    // Check pickup
    const dist = Math.hypot(player.pos.x - item.pos.x, player.pos.y - item.pos.y);
    if (dist < 10) {
      play('coin');
      if (item.type === 'ammo') {
        gs.ammo = Math.min(100, gs.ammo + 10);
      } else {
        gs.health = Math.min(gs.maxHealth, gs.health + 20);
      }
      return false;
    }
    return true;
  });

  // Wave progression
  gs.waveTimer++;
  if (gs.waveTimer >= 600) { // 10 seconds at 60fps
    gs.waveTimer = 0;
    gs.wave++;
    play('powerUp');
  }

  // Check death
  if (gs.health <= 0) {
    gs.isDead = true;
    gs.health = 0;
    play('explosion');
  }

  // Draw HUD
  color('black');
  rect(0, 0, 150, 12);

  color('red');
  bar(vec(2, 5), (gs.health / gs.maxHealth) * 40, 4, 0);
  color('light_red');
  text('HP', 2, 8, { isSmallText: true });

  color('yellow');
  text(`AMMO:${gs.ammo}`, 50, 8, { isSmallText: true });

  color('cyan');
  text(`WAVE:${gs.wave}`, 100, 8, { isSmallText: true });

  // Update final game state
  updateGameState();
}

// Initialize the game
init({ update, title, description, characters, options });
