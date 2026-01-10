// CITADEL - Mini Metroidvania
// Inspired by System Shock

title = "CITADEL";

description = `
[Arrow] Move
[Z] Jump/Wall Jump
[X] Shoot
[C] Dash (when unlocked)
`;

characters = [
  // Player (a)
  `
  llll
 llllll
  llll
 llllll
  l  l
  l  l
  `,
  // Enemy Shambler (b)
  `
 rrrr
rrrrrr
 r  r
rrrrrr
 rr rr
 r   r
  `,
  // Cyborg (c)
  `
 yyyy
yyyyyy
 y  y
yyyyyy
yyy yy
 y   y
  `,
  // Boss (d)
  `
rrrrrr
rrrrrr
rr  rr
rrrrrr
rrrrrr
rr  rr
  `,
  // Pickup (e)
  `
  gg
 gggg
gggggg
gggggg
 gggg
  gg
  `,
  // Door (f)
  `
llllll
llllll
llllll
llllll
llllll
llllll
  `
];

options = {
  viewSize: { x: 150, y: 150 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 42
};

// Game state
let player;
let bullets;
let enemies;
let particles;
let rooms;
let currentRoom;
let pickups;
let doors;
let boss;
let gamePhase;
let screenShake;
let abilities;
let energy;
let dashCooldown;
let iframes;
let totalRooms;
let visitedRooms;
let bossDefeated;

// Room layouts - each room is 10x10 tiles, 15px per tile
const ROOM_DATA = {
  "0,0": { // Start
    walls: [[0,9,10,1], [0,0,1,9], [9,0,1,9]], // floor, left wall, right wall
    enemies: [],
    type: "start",
    exits: { right: "1,0", up: "0,-1" }
  },
  "1,0": { // Corridor
    walls: [[0,9,10,1], [0,0,10,1], [3,5,4,1]], // floor, ceiling, platform
    enemies: [{type: "shambler", x: 80, y: 120}],
    type: "corridor",
    exits: { left: "0,0", right: "2,0" }
  },
  "2,0": { // Double Jump Room
    walls: [[0,9,10,1], [0,0,10,1], [0,0,1,10], [9,0,1,10]],
    enemies: [{type: "shambler", x: 60, y: 120}],
    pickups: [{type: "double_jump", x: 75, y: 30}],
    type: "ability",
    exits: { left: "1,0", up: "2,-1" }
  },
  "0,-1": { // Vertical shaft
    walls: [[0,9,3,1], [7,9,3,1], [0,0,10,1], [0,0,1,10], [9,0,1,10], [3,6,4,1]],
    enemies: [{type: "cyborg", x: 75, y: 80}],
    type: "shaft",
    exits: { down: "0,0", up: "0,-2" }
  },
  "2,-1": { // Boss corridor
    walls: [[0,9,10,1], [0,0,10,1]],
    enemies: [{type: "cyborg", x: 50, y: 120}, {type: "cyborg", x: 100, y: 120}],
    type: "corridor",
    exits: { down: "2,0", right: "3,-1" }
  },
  "3,-1": { // Boss room
    walls: [[0,9,10,1], [0,0,10,1], [0,0,1,10], [9,0,1,10]],
    enemies: [],
    type: "boss",
    boss: {type: "diego", hp: 50},
    exits: { left: "2,-1" }
  },
  "0,-2": { // Dash pickup
    walls: [[0,9,10,1], [0,0,10,1], [0,0,1,10], [9,0,1,10], [4,5,2,1]],
    enemies: [],
    pickups: [{type: "dash", x: 75, y: 60}],
    type: "ability",
    exits: { down: "0,-1" }
  }
};

function update() {
  if (!ticks) {
    initGame();
  }

  // Apply screen shake
  if (screenShake > 0) {
    screenShake -= 0.5;
  }

  switch(gamePhase) {
    case "playing":
      updatePlaying();
      break;
    case "death":
      updateDeath();
      break;
    case "victory":
      updateVictory();
      break;
  }
}

function initGame() {
  player = {
    x: 30,
    y: 120,
    vx: 0,
    vy: 0,
    onGround: false,
    onWall: 0,
    facing: 1,
    hp: 100,
    jumping: false,
    doubleJumped: false,
    dashing: false,
    dashTimer: 0
  };

  abilities = {
    doubleJump: false,
    dash: false,
    wallJump: false
  };

  bullets = [];
  particles = [];
  enemies = [];
  pickups = [];
  doors = [];
  boss = null;
  currentRoom = "0,0";
  gamePhase = "playing";
  screenShake = 0;
  energy = 100;
  dashCooldown = 0;
  iframes = 0;
  totalRooms = Object.keys(ROOM_DATA).length;
  visitedRooms = new Set(["0,0"]);
  bossDefeated = false;

  loadRoom(currentRoom);
}

function loadRoom(roomId) {
  const room = ROOM_DATA[roomId];
  if (!room) return;

  enemies = [];
  pickups = [];
  boss = null;
  bullets = [];

  // Load enemies
  if (room.enemies) {
    room.enemies.forEach(e => {
      enemies.push({
        x: e.x,
        y: e.y,
        vx: e.type === "shambler" ? 0.3 : 0.5,
        type: e.type,
        hp: e.type === "shambler" ? 20 : 30,
        maxHp: e.type === "shambler" ? 20 : 30,
        dir: 1,
        shootTimer: 0
      });
    });
  }

  // Load pickups
  if (room.pickups) {
    room.pickups.forEach(p => {
      if ((p.type === "double_jump" && !abilities.doubleJump) ||
          (p.type === "dash" && !abilities.dash)) {
        pickups.push({ x: p.x, y: p.y, type: p.type });
      }
    });
  }

  // Load boss
  if (room.boss && !bossDefeated) {
    boss = {
      x: 75,
      y: 100,
      vx: 1,
      hp: room.boss.hp,
      maxHp: room.boss.hp,
      type: room.boss.type,
      phase: 1,
      attackTimer: 60,
      state: "idle"
    };
  }

  visitedRooms.add(roomId);
}

function updatePlaying() {
  // Update timers
  if (dashCooldown > 0) dashCooldown--;
  if (iframes > 0) iframes--;

  // Player input
  const moveInput = input.isPressed ? (input.pos.x < 75 ? -1 : 1) :
                    (input.isPressed ? 1 : 0);

  let dx = 0;
  if (input.keyboard.isPressed("ArrowLeft") || input.keyboard.isPressed("KeyA")) dx = -1;
  if (input.keyboard.isPressed("ArrowRight") || input.keyboard.isPressed("KeyD")) dx = 1;

  // Dashing
  if (player.dashing) {
    player.dashTimer--;
    if (player.dashTimer <= 0) {
      player.dashing = false;
    }
    player.vx = player.facing * 5;
    player.vy = 0;
  } else {
    // Normal movement
    player.vx = dx * 2;

    if (dx !== 0) player.facing = dx;

    // Gravity
    player.vy += 0.3;
    if (player.vy > 4) player.vy = 4;

    // Wall slide
    if (player.onWall !== 0 && player.vy > 0 && !player.onGround) {
      player.vy = 1;
    }
  }

  // Jump
  if (input.keyboard.isJustPressed("KeyZ") || input.keyboard.isJustPressed("Space")) {
    if (player.onGround) {
      player.vy = -4.5;
      player.onGround = false;
      player.doubleJumped = false;
      play("jump");
      spawnParticles(player.x, player.y + 6, 3, "cyan");
    } else if (player.onWall !== 0) {
      // Wall jump
      player.vy = -4;
      player.vx = -player.onWall * 3;
      player.onWall = 0;
      play("jump");
      spawnParticles(player.x, player.y, 4, "cyan");
    } else if (abilities.doubleJump && !player.doubleJumped) {
      player.vy = -4;
      player.doubleJumped = true;
      play("powerUp");
      spawnParticles(player.x, player.y + 6, 5, "green");
    }
  }

  // Dash
  if ((input.keyboard.isJustPressed("KeyC") || input.keyboard.isJustPressed("ShiftLeft")) &&
      abilities.dash && dashCooldown <= 0 && !player.dashing) {
    player.dashing = true;
    player.dashTimer = 15;
    dashCooldown = 60;
    play("laser");
    spawnParticles(player.x, player.y, 6, "yellow");
  }

  // Shoot
  if (input.keyboard.isJustPressed("KeyX") || input.keyboard.isJustPressed("Enter")) {
    if (energy >= 10) {
      energy -= 10;
      bullets.push({
        x: player.x + player.facing * 6,
        y: player.y,
        vx: player.facing * 5,
        vy: 0,
        friendly: true
      });
      play("hit");
    }
  }

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Wall collision
  const room = ROOM_DATA[currentRoom];
  player.onGround = false;
  player.onWall = 0;

  room.walls.forEach(w => {
    const wx = w[0] * 15;
    const wy = w[1] * 15;
    const ww = w[2] * 15;
    const wh = w[3] * 15;

    if (player.x > wx - 3 && player.x < wx + ww + 3 &&
        player.y > wy - 6 && player.y < wy + wh + 6) {

      // Top collision (landing)
      if (player.vy > 0 && player.y - player.vy < wy) {
        player.y = wy - 6;
        player.vy = 0;
        player.onGround = true;
        player.doubleJumped = false;
      }
      // Bottom collision
      else if (player.vy < 0 && player.y - player.vy > wy + wh) {
        player.y = wy + wh + 6;
        player.vy = 0;
      }
      // Side collision
      else if (player.vx > 0) {
        player.x = wx - 3;
        player.onWall = 1;
      } else if (player.vx < 0) {
        player.x = wx + ww + 3;
        player.onWall = -1;
      }
    }
  });

  // Room transitions
  if (player.x < 0 && room.exits.left) {
    currentRoom = room.exits.left;
    player.x = 145;
    loadRoom(currentRoom);
  }
  if (player.x > 150 && room.exits.right) {
    currentRoom = room.exits.right;
    player.x = 5;
    loadRoom(currentRoom);
  }
  if (player.y < 0 && room.exits.up) {
    currentRoom = room.exits.up;
    player.y = 140;
    loadRoom(currentRoom);
  }
  if (player.y > 150 && room.exits.down) {
    currentRoom = room.exits.down;
    player.y = 5;
    loadRoom(currentRoom);
  }

  // Screen bounds
  player.x = clamp(player.x, 3, 147);
  player.y = clamp(player.y, 3, 147);

  // Energy regen
  if (energy < 100) energy += 0.2;

  // Update bullets
  bullets = bullets.filter(b => {
    b.x += b.vx;
    b.y += b.vy;

    // Check wall collision
    let hit = false;
    room.walls.forEach(w => {
      const wx = w[0] * 15;
      const wy = w[1] * 15;
      const ww = w[2] * 15;
      const wh = w[3] * 15;
      if (b.x > wx && b.x < wx + ww && b.y > wy && b.y < wy + wh) {
        hit = true;
        spawnParticles(b.x, b.y, 3, "red");
      }
    });

    // Check enemy collision (friendly bullets)
    if (b.friendly) {
      enemies.forEach(e => {
        if (Math.abs(b.x - e.x) < 8 && Math.abs(b.y - e.y) < 8) {
          e.hp -= 10;
          hit = true;
          screenShake = 3;
          play("explosion");
          spawnParticles(b.x, b.y, 5, "yellow");

          if (e.hp <= 0) {
            addScore(e.type === "shambler" ? 50 : 100);
            spawnParticles(e.x, e.y, 10, "red");
          }
        }
      });

      // Boss collision
      if (boss && Math.abs(b.x - boss.x) < 12 && Math.abs(b.y - boss.y) < 12) {
        boss.hp -= 5;
        hit = true;
        screenShake = 5;
        play("explosion");
        spawnParticles(b.x, b.y, 6, "red");

        if (boss.hp <= 0) {
          addScore(500);
          spawnParticles(boss.x, boss.y, 20, "yellow");
          boss = null;
          bossDefeated = true;
          play("powerUp");
        }
      }
    }

    // Check player collision (enemy bullets)
    if (!b.friendly && iframes <= 0 && !player.dashing) {
      if (Math.abs(b.x - player.x) < 6 && Math.abs(b.y - player.y) < 8) {
        damagePlayer(15);
        hit = true;
      }
    }

    return !hit && b.x > 0 && b.x < 150 && b.y > 0 && b.y < 150;
  });

  // Update enemies
  enemies = enemies.filter(e => {
    if (e.hp <= 0) return false;

    // AI
    if (e.type === "shambler") {
      e.x += e.vx * e.dir;

      // Turn at edges
      if (e.x < 20 || e.x > 130) e.dir *= -1;

      // Player collision
      if (iframes <= 0 && !player.dashing &&
          Math.abs(e.x - player.x) < 8 && Math.abs(e.y - player.y) < 8) {
        damagePlayer(10);
      }
    } else if (e.type === "cyborg") {
      e.shootTimer++;
      if (e.shootTimer > 90) {
        e.shootTimer = 0;
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        bullets.push({
          x: e.x,
          y: e.y,
          vx: (dx / dist) * 2,
          vy: (dy / dist) * 2,
          friendly: false
        });
        play("laser");
      }
    }

    return true;
  });

  // Update boss
  if (boss) {
    boss.attackTimer--;

    // Movement
    boss.x += boss.vx;
    if (boss.x < 30 || boss.x > 120) boss.vx *= -1;

    // Attacks
    if (boss.attackTimer <= 0) {
      boss.attackTimer = 40;

      // Fire bullets
      for (let i = -1; i <= 1; i++) {
        bullets.push({
          x: boss.x,
          y: boss.y + 10,
          vx: i * 2,
          vy: 2,
          friendly: false
        });
      }
      play("laser");
    }

    // Collision with player
    if (iframes <= 0 && !player.dashing &&
        Math.abs(boss.x - player.x) < 12 && Math.abs(boss.y - player.y) < 12) {
      damagePlayer(20);
    }
  }

  // Pickup collision
  pickups = pickups.filter(p => {
    if (Math.abs(p.x - player.x) < 10 && Math.abs(p.y - player.y) < 10) {
      if (p.type === "double_jump") {
        abilities.doubleJump = true;
        play("coin");
        addScore(200);
      } else if (p.type === "dash") {
        abilities.dash = true;
        play("coin");
        addScore(200);
      }
      spawnParticles(p.x, p.y, 10, "green");
      return false;
    }
    return true;
  });

  // Update particles
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
    return p.life > 0;
  });

  // Check death
  if (player.hp <= 0) {
    gamePhase = "death";
    play("explosion");
  }

  // Check victory
  if (bossDefeated && currentRoom === "3,-1") {
    gamePhase = "victory";
  }

  // Drawing
  draw();
}

function draw() {
  // Apply screen shake offset
  const shakeX = screenShake > 0 ? rnd(-screenShake, screenShake) : 0;
  const shakeY = screenShake > 0 ? rnd(-screenShake, screenShake) : 0;

  const room = ROOM_DATA[currentRoom];

  // Draw walls with gradient effect
  room.walls.forEach(w => {
    const wx = w[0] * 15 + shakeX;
    const wy = w[1] * 15 + shakeY;
    const ww = w[2] * 15;
    const wh = w[3] * 15;

    // Base wall
    color("blue");
    rect(wx, wy, ww, wh);

    // Inner highlight
    color("cyan");
    rect(wx + 1, wy + 1, ww - 2, 1);
    rect(wx + 1, wy + 1, 1, wh - 2);
  });

  // Draw exit indicators
  color("green");
  if (room.exits.right) rect(147, 70, 3, 10);
  if (room.exits.left) rect(0, 70, 3, 10);
  if (room.exits.up) rect(70, 0, 10, 3);
  if (room.exits.down) rect(70, 147, 10, 3);

  // Draw pickups with glow
  pickups.forEach(p => {
    // Glow effect
    color("light_green");
    arc(p.x + shakeX, p.y + shakeY, 10 + sin(ticks * 0.1) * 2, 2);
    char("e", p.x + shakeX, p.y + shakeY);
  });

  // Draw enemies with health bars
  enemies.forEach(e => {
    const c = e.type === "shambler" ? "b" : "c";
    char(c, e.x + shakeX, e.y + shakeY);

    // Health bar
    color("red");
    rect(e.x - 8 + shakeX, e.y - 12 + shakeY, 16, 2);
    color("green");
    rect(e.x - 8 + shakeX, e.y - 12 + shakeY, 16 * (e.hp / e.maxHp), 2);
  });

  // Draw boss
  if (boss) {
    // Boss glow
    color("red");
    arc(boss.x + shakeX, boss.y + shakeY, 15 + sin(ticks * 0.05) * 3, 2);

    char("d", boss.x + shakeX, boss.y + shakeY);

    // Boss health bar at top
    color("black");
    rect(20, 8, 110, 6);
    color("red");
    rect(21, 9, 108, 4);
    color("green");
    rect(21, 9, 108 * (boss.hp / boss.maxHp), 4);

    color("white");
    text("DIEGO", 75, 5);
  }

  // Draw bullets with trails
  bullets.forEach(b => {
    if (b.friendly) {
      color("yellow");
      box(b.x + shakeX, b.y + shakeY, 4, 2);
      color("light_yellow");
      box(b.x - b.vx + shakeX, b.y + shakeY, 2, 1);
    } else {
      color("red");
      box(b.x + shakeX, b.y + shakeY, 3, 3);
      color("light_red");
      arc(b.x + shakeX, b.y + shakeY, 2, 1);
    }
  });

  // Draw particles
  particles.forEach(p => {
    color(p.color);
    box(p.x + shakeX, p.y + shakeY, p.size, p.size);
  });

  // Draw player
  if (iframes <= 0 || floor(ticks / 3) % 2 === 0) {
    if (player.dashing) {
      color("yellow");
      arc(player.x + shakeX, player.y + shakeY, 8, 3);
    }
    char("a", player.x + shakeX, player.y + shakeY, { mirror: { x: player.facing < 0 ? 1 : 0 }});
  }

  // UI
  color("white");
  text(`HP:${floor(player.hp)}`, 3, 3);

  // Energy bar
  color("black");
  rect(3, 10, 32, 4);
  color("light_blue");
  rect(4, 11, 30 * (energy / 100), 2);

  // Ability indicators
  let uy = 18;
  if (abilities.doubleJump) {
    color("green");
    text("2X", 3, uy);
    uy += 8;
  }
  if (abilities.dash) {
    color(dashCooldown > 0 ? "light_black" : "yellow");
    text("DASH", 3, uy);
  }

  // Room indicator
  color("light_black");
  text(`${visitedRooms.size}/${totalRooms}`, 130, 3);
}

function updateDeath() {
  color("red");
  text("GAME OVER", 75, 60);
  text("SHODAN WINS", 75, 75);

  color("white");
  text("Press Z to retry", 75, 100);

  if (input.keyboard.isJustPressed("KeyZ")) {
    initGame();
  }
}

function updateVictory() {
  color("green");
  text("VICTORY!", 75, 50);
  text("DIEGO DEFEATED", 75, 65);

  color("yellow");
  text(`Score: ${score}`, 75, 85);
  text(`Rooms: ${visitedRooms.size}/${totalRooms}`, 75, 95);

  color("white");
  text("Press Z to play again", 75, 120);

  if (input.keyboard.isJustPressed("KeyZ")) {
    initGame();
  }
}

function damagePlayer(amount) {
  if (iframes > 0 || player.dashing) return;

  player.hp -= amount;
  iframes = 60;
  screenShake = 8;
  play("hit");
  spawnParticles(player.x, player.y, 8, "red");

  // Knockback
  player.vx = -player.facing * 2;
  player.vy = -2;
}

function spawnParticles(x, y, count, col) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: rnd(-2, 2),
      vy: rnd(-3, 0),
      life: rnd(15, 30),
      size: rnd(1, 3),
      color: col
    });
  }
}

// Expose for testing
if (typeof window !== 'undefined') {
  window.gameState = {
    get player() { return player; },
    get abilities() { return abilities; },
    get currentRoom() { return currentRoom; },
    get gamePhase() { return gamePhase; }
  };
}
