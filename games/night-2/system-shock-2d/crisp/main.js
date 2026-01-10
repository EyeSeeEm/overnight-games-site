// System Shock 2D - Citadel Station (crisp-game-lib)
// Cyberpunk survival horror shooter - arcade version
// crisp-game-lib loaded from CDN

const title = "CITADEL";

const description = `
[Arrows] Move
[Z] Fire
[X] Interact
`;

// Character sprites
const characters = [
  // a: Player (cyberpunk soldier)
  `
 cccc
cCCCCc
cCBBCc
 cCCc
 cCCc
  cc
`,
  // b: Mutant (green)
  `
 llll
lLLLLl
lLrrLl
 lLLl
 llll
  ll
`,
  // c: Cyborg (purple)
  `
 pppp
pPPPPp
pPrrPp
 pPPp
 pppp
  pp
`,
  // d: Bot (red)
  `
rrrrrr
rRRRRr
rRyyRr
 rRRr
rrrrrr
`,
  // e: Bullet
  `
 yy
yyyy
yyyy
 yy
`,
  // f: Wall
  `
bbbbbb
bBBBBb
bBBBBb
bBBBBb
bBBBBb
bbbbbb
`,
  // g: Door
  `
 g  g
ggGGgg
gGGGGg
gGGGGg
ggGGgg
 g  g
`,
  // h: Medical
  `
  rr
rrrrrr
 rRRr
rrrrrr
  rr
`,
  // i: Energy
  `
  cc
 cccc
ccCCcc
 cccc
  cc
`,
  // j: Ammo
  `
 yyyy
yYYYYy
yYYYYy
 yyyy
`,
  // k: Terminal
  `
gggggg
gllllg
gl  lg
gllllg
gggggg
`
];

const options = {
  viewSize: { x: 150, y: 150 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 1,
  theme: "dark"
};

// Room constants
const ROOM_W = 14;
const ROOM_H = 14;

// Tile types
const EMPTY = 0;
const WALL = 1;
const DOOR = 2;
const MEDICAL = 3;
const ENERGY = 4;
const TERMINAL = 5;

// Game state
let player;
let enemies;
let bullets;
let room;
let items;
let hp;
let maxHp;
let energy;
let ammo;
let level;
let kills;
let fireCooldown;
let interactCooldown;

// Expose for testing
window.gameState = {
  hp: 0,
  level: 0,
  score: 0,
  enemies: 0
};

function generateRoom() {
  room = [];
  enemies = [];
  items = [];

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
  const numWalls = 3 + level;
  for (let i = 0; i < numWalls; i++) {
    const wx = floor(rnd(3, ROOM_W - 3));
    const wy = floor(rnd(3, ROOM_H - 3));
    const len = floor(rnd(2, 4));
    const horiz = rnd() > 0.5;
    for (let j = 0; j < len; j++) {
      if (horiz && wx + j < ROOM_W - 1) {
        room[wy][wx + j] = WALL;
      } else if (!horiz && wy + j < ROOM_H - 1) {
        room[wy + j][wx] = WALL;
      }
    }
  }

  // Place door
  room[ROOM_H - 2][ROOM_W - 2] = DOOR;

  // Place stations
  room[2][2] = MEDICAL;
  room[ROOM_H - 3][2] = ENERGY;
  room[2][ROOM_W - 3] = TERMINAL;

  // Spawn enemies
  const numEnemies = 2 + level * 2;
  for (let i = 0; i < numEnemies; i++) {
    let ex, ey;
    do {
      ex = floor(rnd(4, ROOM_W - 4));
      ey = floor(rnd(4, ROOM_H - 4));
    } while (room[ey][ex] !== EMPTY);

    const types = ["mutant", "cyborg", "bot"];
    const type = types[floor(rnd(0, types.length))];
    let ehp = 20;
    let espeed = 0.3;
    if (type === "cyborg") { ehp = 30; espeed = 0.35; }
    if (type === "bot") { ehp = 40; espeed = 0.25; }

    enemies.push({
      x: ex * 10 + 5,
      y: ey * 10 + 5,
      type: type,
      hp: ehp,
      maxHp: ehp,
      speed: espeed,
      fireCooldown: rndi(60),
      state: "patrol",
      dir: rnd(0, PI * 2)
    });
  }

  // Spawn item pickups
  for (let i = 0; i < 3; i++) {
    let ix, iy;
    do {
      ix = floor(rnd(3, ROOM_W - 3));
      iy = floor(rnd(3, ROOM_H - 3));
    } while (room[iy][ix] !== EMPTY);

    const types = ["ammo", "health"];
    items.push({
      x: ix * 10 + 5,
      y: iy * 10 + 5,
      type: types[floor(rnd(0, types.length))]
    });
  }
}

function isWall(px, py) {
  const tx = floor(px / 10);
  const ty = floor(py / 10);
  if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return true;
  return room[ty][tx] === WALL;
}

function getTile(px, py) {
  const tx = floor(px / 10);
  const ty = floor(py / 10);
  if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return WALL;
  return room[ty][tx];
}

function update() {
  // Initialize
  if (!ticks) {
    player = { x: 25, y: 25, dx: 0, dy: 0 };
    bullets = [];
    hp = 100;
    maxHp = 100;
    energy = 100;
    ammo = 30;
    level = 1;
    kills = 0;
    fireCooldown = 0;
    interactCooldown = 0;
    generateRoom();
  }

  // Update game state for testing
  window.gameState = {
    hp: hp,
    level: level,
    score: score,
    enemies: enemies.length
  };

  // Draw room
  color("blue");
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const tile = room[y][x];
      const px = x * 10 + 5;
      const py = y * 10 + 5;

      if (tile === WALL) {
        char("f", px, py);
      } else if (tile === DOOR) {
        color(enemies.length > 0 ? "red" : "green");
        char("g", px, py);
      } else if (tile === MEDICAL) {
        char("h", px, py);
      } else if (tile === ENERGY) {
        char("i", px, py);
      } else if (tile === TERMINAL) {
        char("k", px, py);
      }
    }
  }

  // Draw item pickups
  color("yellow");
  remove(items, (item) => {
    if (item.type === "ammo") {
      char("j", item.x, item.y);
    } else {
      char("h", item.x, item.y);
    }

    // Pickup detection
    const dist = sqrt(pow(player.x - item.x, 2) + pow(player.y - item.y, 2));
    if (dist < 8) {
      play("powerUp");
      if (item.type === "ammo") {
        ammo = min(99, ammo + 15);
        addScore(10, item.x, item.y);
      } else {
        hp = min(maxHp, hp + 20);
        addScore(15, item.x, item.y);
      }
      return true;
    }
    return false;
  });

  // Player movement
  const speed = 0.8;
  if (keyboard.code["ArrowUp"].isPressed || keyboard.code["KeyW"].isPressed) {
    player.dy = -speed;
  } else if (keyboard.code["ArrowDown"].isPressed || keyboard.code["KeyS"].isPressed) {
    player.dy = speed;
  } else {
    player.dy *= 0.7;
  }

  if (keyboard.code["ArrowLeft"].isPressed || keyboard.code["KeyA"].isPressed) {
    player.dx = -speed;
  } else if (keyboard.code["ArrowRight"].isPressed || keyboard.code["KeyD"].isPressed) {
    player.dx = speed;
  } else {
    player.dx *= 0.7;
  }

  // Apply movement with collision
  const newX = player.x + player.dx;
  const newY = player.y + player.dy;
  if (!isWall(newX, player.y)) player.x = newX;
  if (!isWall(player.x, newY)) player.y = newY;

  // Keep player in bounds
  player.x = clamp(player.x, 5, 145);
  player.y = clamp(player.y, 5, 145);

  // Firing
  fireCooldown = max(0, fireCooldown - 1);
  if ((keyboard.code["KeyZ"].isPressed || keyboard.code["Space"].isPressed) && fireCooldown <= 0 && ammo > 0) {
    play("laser");
    fireCooldown = 12;
    ammo--;

    // Fire in 4 directions
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    for (const d of dirs) {
      bullets.push({
        x: player.x + d.dx * 5,
        y: player.y + d.dy * 5,
        dx: d.dx * 2.5,
        dy: d.dy * 2.5,
        damage: 15,
        life: 30
      });
    }
  }

  // Interact
  interactCooldown = max(0, interactCooldown - 1);
  if ((keyboard.code["KeyX"].isJustPressed || keyboard.code["Enter"].isJustPressed) && interactCooldown <= 0) {
    interactCooldown = 30;
    const tile = getTile(player.x, player.y);

    if (tile === DOOR && enemies.length === 0) {
      play("coin");
      level++;
      if (level > 5) {
        play("powerUp");
        // Victory!
        addScore(500);
      } else {
        player.x = 25;
        player.y = 25;
        generateRoom();
      }
    } else if (tile === MEDICAL && energy >= 15) {
      play("powerUp");
      energy -= 15;
      hp = min(maxHp, hp + 30);
    } else if (tile === ENERGY) {
      play("powerUp");
      energy = 100;
    }
  }

  // Energy drain
  energy = max(0, energy - 0.02);

  // Draw and update bullets
  color("yellow");
  remove(bullets, (b) => {
    b.x += b.dx;
    b.y += b.dy;
    b.life--;

    char("e", b.x, b.y);

    // Wall collision
    if (isWall(b.x, b.y)) {
      return true;
    }

    // Enemy collision
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dist = sqrt(pow(b.x - e.x, 2) + pow(b.y - e.y, 2));
      if (dist < 6) {
        e.hp -= b.damage;
        particle(b.x, b.y, { count: 5, speed: 1 });

        if (e.hp <= 0) {
          play("explosion");
          kills++;
          addScore(e.maxHp, e.x, e.y);
          particle(e.x, e.y, { count: 15, speed: 2 });
          enemies.splice(i, 1);
        }
        return true;
      }
    }

    return b.life <= 0;
  });

  // Update enemies
  remove(enemies, (e) => {
    // Detection
    const distToPlayer = sqrt(pow(e.x - player.x, 2) + pow(e.y - player.y, 2));
    if (distToPlayer < 60) {
      e.state = "chase";
    } else if (distToPlayer > 80) {
      e.state = "patrol";
    }

    // Movement
    if (e.state === "patrol") {
      if (rndi(100) < 2) {
        e.dir = rnd(0, PI * 2);
      }
      const nx = e.x + cos(e.dir) * e.speed * 0.3;
      const ny = e.y + sin(e.dir) * e.speed * 0.3;
      if (!isWall(nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir = rnd(0, PI * 2);
      }
    } else {
      const angle = atan2(player.y - e.y, player.x - e.x);
      const nx = e.x + cos(angle) * e.speed;
      const ny = e.y + sin(angle) * e.speed;
      if (!isWall(nx, e.y)) e.x = nx;
      if (!isWall(e.x, ny)) e.y = ny;
    }

    // Attack player on contact
    if (distToPlayer < 8) {
      hp -= 1;
      if (ticks % 20 === 0) {
        play("hit");
        particle(player.x, player.y, { count: 3, speed: 1 });
      }
    }

    // Draw enemy
    if (e.type === "mutant") {
      color("green");
      char("b", e.x, e.y);
    } else if (e.type === "cyborg") {
      color("purple");
      char("c", e.x, e.y);
    } else {
      color("red");
      char("d", e.x, e.y);
    }

    // HP bar
    const hpPct = e.hp / e.maxHp;
    color("black");
    box(e.x, e.y - 5, 8, 2);
    color("red");
    box(e.x - 4 + hpPct * 4, e.y - 5, hpPct * 8, 2);

    return false;
  });

  // Draw player
  color("cyan");
  char("a", player.x, player.y);

  // HUD
  color("white");
  text(`HP:${floor(hp)}`, 3, 3);
  text(`EN:${floor(energy)}`, 3, 12);
  text(`AM:${ammo}`, 3, 21);
  text(`LV:${level}`, 125, 3);
  text(`KL:${kills}`, 125, 12);

  // Door status
  if (enemies.length === 0) {
    color("green");
    text("EXIT OPEN", 50, 3);
  }

  // Death
  if (hp <= 0) {
    play("lucky");
    end();
  }

  // Victory
  if (level > 5) {
    color("green");
    text("CITADEL CLEARED!", 35, 75);
  }
}

init({ update, title, description, characters, options });
