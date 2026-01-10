// Isolation Protocol - Expanded Edition
// Survival Horror with more content, saves, and unlocks

const title = "ISOLATION";

const description = `
[Arrows] Move
[Z] Attack
[X] Use Item
`;

// Character sprites
const characters = [
  // a: Player
  `
 llll
llllll
 l  l
 l  l
`,
  // b: Zombie
  `
 rrrr
rrrrrr
 r  r
 r  r
`,
  // c: Item (loot)
  `
yyyy
yyyy
`,
  // d: Escape pod
  `
gggggg
gggggg
gggggg
`,
  // e: Wall
  `
pppppp
pppppp
pppppp
pppppp
`,
  // f: Door/Key
  `
cccccc
cccccc
`,
  // g: Runner zombie (fast)
  `
 llll
llllll
ll  ll
`,
  // h: Tank zombie (big)
  `
rrrrrr
rrrrrr
rr  rr
rr  rr
`,
  // i: Spitter (ranged)
  `
 gggg
gggggg
 g  g
`
];

const options = {
  viewSize: { x: 200, y: 200 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 2,
  theme: "dark"
};

// Game state
let player;
let enemies;
let items;
let projectiles;
let rooms;
let currentRoom;
let health;
let maxHealth;
let hunger;
let infection;
let gameTime;
let inventory;
let gameWon;
let gameState;
let selectedItem;
let unlocks;
let stats;
let wave;

const ROOM_SIZE = 180;
const SAVE_KEY = 'isolation_expanded_save';

// Save/Load
function saveGame() {
  const data = {
    stats: stats,
    unlocks: unlocks
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data) {
      stats = data.stats || stats;
      unlocks = data.unlocks || unlocks;
    }
  } catch (e) {}
}

// Expose for testing
window.gameState = {
  player: null,
  health: 0,
  hunger: 0,
  infection: 0,
  currentRoom: 0,
  inventory: [],
  state: 'menu'
};

window.game = {
  get state() { return gameState; },
  get health() { return health; },
  get inventory() { return inventory; },
  get currentRoom() { return currentRoom?.id || 0; },
  get enemies() { return enemies; },
  roomCount: 10,
  enemyTypes: ['zombie', 'runner', 'tank', 'spitter'],
  itemTypes: ['food', 'medkit', 'antidote', 'key', 'weapon', 'armor'],
  saveGame,
  loadSave
};

// Room generation
function generateRooms() {
  rooms = [];

  // Room 0: Hub (safe)
  rooms.push({
    id: 0, name: "HUB",
    enemies: [],
    items: [
      { type: "food", x: 30, y: 30 },
      { type: "food", x: 50, y: 30 }
    ],
    exits: { right: 1, down: 2 },
    safe: true
  });

  // Room 1: Storage
  rooms.push({
    id: 1, name: "STORAGE",
    enemies: [
      { type: "zombie", x: 100, y: 100, hp: 2 },
      { type: "zombie", x: 140, y: 60, hp: 2 }
    ],
    items: [
      { type: "food", x: 40, y: 120 },
      { type: "medkit", x: 160, y: 40 },
      { type: "weapon", x: 80, y: 80 }
    ],
    exits: { left: 0, down: 3, right: 5 },
    safe: false
  });

  // Room 2: Medical Bay
  rooms.push({
    id: 2, name: "MEDICAL",
    enemies: [
      { type: "zombie", x: 80, y: 80, hp: 3 }
    ],
    items: [
      { type: "medkit", x: 30, y: 150 },
      { type: "antidote", x: 150, y: 30 },
      { type: "medkit", x: 100, y: 100 }
    ],
    exits: { up: 0, right: 3, down: 6 },
    safe: false
  });

  // Room 3: Research
  rooms.push({
    id: 3, name: "RESEARCH",
    enemies: [
      { type: "runner", x: 60, y: 60, hp: 2 },
      { type: "zombie", x: 120, y: 120, hp: 3 },
      { type: "spitter", x: 90, y: 50, hp: 2 }
    ],
    items: [
      { type: "antidote", x: 100, y: 100 }
    ],
    exits: { left: 2, up: 1, right: 4, down: 7 },
    safe: false
  });

  // Room 4: Armory
  rooms.push({
    id: 4, name: "ARMORY",
    enemies: [
      { type: "tank", x: 100, y: 100, hp: 8 }
    ],
    items: [
      { type: "weapon", x: 40, y: 40 },
      { type: "weapon", x: 160, y: 40 },
      { type: "armor", x: 100, y: 150 }
    ],
    exits: { left: 3, down: 8 },
    safe: false
  });

  // Room 5: Cafeteria
  rooms.push({
    id: 5, name: "CAFETERIA",
    enemies: [
      { type: "runner", x: 50, y: 100, hp: 2 },
      { type: "runner", x: 150, y: 100, hp: 2 }
    ],
    items: [
      { type: "food", x: 50, y: 50 },
      { type: "food", x: 100, y: 50 },
      { type: "food", x: 150, y: 50 },
      { type: "food", x: 100, y: 150 }
    ],
    exits: { left: 1, down: 8 },
    safe: false
  });

  // Room 6: Reactor (dangerous)
  rooms.push({
    id: 6, name: "REACTOR",
    enemies: [
      { type: "spitter", x: 60, y: 60, hp: 3 },
      { type: "spitter", x: 140, y: 60, hp: 3 },
      { type: "tank", x: 100, y: 140, hp: 6 }
    ],
    items: [
      { type: "key", x: 100, y: 100 }
    ],
    exits: { up: 2, right: 7 },
    safe: false,
    radiation: true
  });

  // Room 7: Security
  rooms.push({
    id: 7, name: "SECURITY",
    enemies: [
      { type: "zombie", x: 80, y: 80, hp: 4 },
      { type: "zombie", x: 120, y: 80, hp: 4 },
      { type: "runner", x: 100, y: 140, hp: 3 }
    ],
    items: [
      { type: "armor", x: 50, y: 50 },
      { type: "medkit", x: 150, y: 150 }
    ],
    exits: { left: 6, up: 3, right: 9 },
    safe: false
  });

  // Room 8: Labs
  rooms.push({
    id: 8, name: "LABS",
    enemies: [
      { type: "spitter", x: 100, y: 80, hp: 3 },
      { type: "tank", x: 50, y: 120, hp: 7 },
      { type: "runner", x: 150, y: 120, hp: 2 }
    ],
    items: [
      { type: "antidote", x: 100, y: 50 },
      { type: "antidote", x: 100, y: 150 }
    ],
    exits: { up: 4, left: 5, right: 9 },
    safe: false
  });

  // Room 9: Escape Pod
  rooms.push({
    id: 9, name: "ESCAPE",
    enemies: [],
    items: [],
    exits: { left: 7, up: 8 },
    safe: true,
    hasEscapePod: true
  });
}

function loadRoom(roomId) {
  currentRoom = rooms[roomId];

  enemies = currentRoom.enemies.map(e => ({
    type: e.type,
    x: e.x,
    y: e.y,
    hp: e.hp,
    maxHp: e.hp,
    vx: 0,
    vy: 0,
    moveTimer: 0,
    attackTimer: 0
  }));

  items = currentRoom.items.filter(item => {
    const key = `${roomId}_${item.type}_${item.x}_${item.y}`;
    return !window.collectedItems || !window.collectedItems[key];
  }).map(i => ({ ...i }));

  if (player.lastExit === "right") player.x = 20;
  else if (player.lastExit === "left") player.x = ROOM_SIZE - 20;
  else if (player.lastExit === "up") player.y = ROOM_SIZE - 20;
  else if (player.lastExit === "down") player.y = 20;

  projectiles = [];
}

function getEnemyStats(type) {
  switch (type) {
    case 'runner': return { speed: 1.5, damage: 3, char: 'g' };
    case 'tank': return { speed: 0.3, damage: 10, char: 'h' };
    case 'spitter': return { speed: 0.5, damage: 5, char: 'i', ranged: true };
    default: return { speed: 0.8, damage: 5, char: 'b' };
  }
}

function startGame() {
  player = { x: 100, y: 100, lastExit: null, damage: 10, attackCooldown: 0 };
  health = 100;
  maxHealth = 100;
  hunger = 0;
  infection = 0;
  gameTime = 0;
  inventory = { key: false, weapon: 0, armor: 0 };
  gameWon = false;
  gameState = 'playing';
  selectedItem = 0;
  wave = 1;
  window.collectedItems = {};
  projectiles = [];

  generateRooms();
  loadRoom(0);
}

function update() {
  if (!ticks) {
    stats = { victories: 0, deaths: 0, enemiesKilled: 0, itemsCollected: 0 };
    unlocks = { extraHealth: false, fastAttack: false, resistance: false };
    loadSave();
    gameState = 'menu';
  }

  // Update test state
  window.gameState = {
    player: player ? { x: player.x, y: player.y } : null,
    health: health,
    hunger: hunger,
    infection: infection,
    currentRoom: currentRoom?.id || 0,
    inventory: inventory,
    state: gameState
  };

  // Menu state
  if (gameState === 'menu') {
    color("cyan");
    text("ISOLATION", 100, 60);
    color("white");
    text("EXPANDED", 100, 80);
    color("light_cyan");
    text("[Z] Start", 100, 120);
    text("[X] Tutorial", 100, 140);
    color("light_black");
    text(`Wins: ${stats.victories}`, 100, 170);

    if (keyboard.code["KeyZ"].isJustPressed) {
      startGame();
    }
    if (keyboard.code["KeyX"].isJustPressed) {
      gameState = 'tutorial';
    }
    return;
  }

  if (gameState === 'tutorial') {
    color("cyan");
    text("HOW TO PLAY", 100, 30);
    color("white");
    text("[Arrows] Move", 100, 60);
    text("[Z] Attack", 100, 80);
    text("[X] Use Item", 100, 100);
    color("yellow");
    text("Find the key!", 100, 130);
    text("Escape the pod!", 100, 150);
    color("light_black");
    text("[Z] Back", 100, 180);

    if (keyboard.code["KeyZ"].isJustPressed) {
      gameState = 'menu';
    }
    return;
  }

  if (gameWon) {
    color("green");
    text("ESCAPED!", 100, 80);
    text(`Score: ${score}`, 100, 100);
    color("light_black");
    text("[Z] Menu", 100, 140);

    if (keyboard.code["KeyZ"].isJustPressed) {
      stats.victories++;
      saveGame();
      gameState = 'menu';
    }
    return;
  }

  if (health <= 0 || infection >= 100) {
    color("red");
    text("GAME OVER", 100, 80);
    color("white");
    text(health <= 0 ? "You died!" : "Infected!", 100, 100);
    color("light_black");
    text("[Z] Menu", 100, 140);

    if (keyboard.code["KeyZ"].isJustPressed) {
      stats.deaths++;
      saveGame();
      gameState = 'menu';
    }
    return;
  }

  // Time passes
  gameTime++;
  if (gameTime % 60 === 0) {
    hunger = Math.min(100, hunger + 1);
    if (!currentRoom.safe) {
      const infRate = currentRoom.radiation ? 2 : 0.5;
      infection = Math.min(100, infection + infRate);
    }
  }

  if (hunger >= 75 && gameTime % 120 === 0) health -= 1;
  if (infection >= 75 && gameTime % 60 === 0) health -= 2;

  // Player movement
  let speed = hunger >= 50 ? 1.2 : 1.5;
  if (inventory.armor > 0) speed *= 0.9;

  if (keyboard.code["ArrowLeft"].isPressed || keyboard.code["KeyA"].isPressed) player.x -= speed;
  if (keyboard.code["ArrowRight"].isPressed || keyboard.code["KeyD"].isPressed) player.x += speed;
  if (keyboard.code["ArrowUp"].isPressed || keyboard.code["KeyW"].isPressed) player.y -= speed;
  if (keyboard.code["ArrowDown"].isPressed || keyboard.code["KeyS"].isPressed) player.y += speed;

  // Room transitions
  if (player.x < 5 && currentRoom.exits.left !== undefined) {
    player.lastExit = "left";
    loadRoom(currentRoom.exits.left);
    return;
  }
  if (player.x > ROOM_SIZE - 5 && currentRoom.exits.right !== undefined) {
    player.lastExit = "right";
    loadRoom(currentRoom.exits.right);
    return;
  }
  if (player.y < 5 && currentRoom.exits.up !== undefined) {
    player.lastExit = "up";
    loadRoom(currentRoom.exits.up);
    return;
  }
  if (player.y > ROOM_SIZE - 5 && currentRoom.exits.down !== undefined) {
    player.lastExit = "down";
    loadRoom(currentRoom.exits.down);
    return;
  }

  // Boundaries
  if (!currentRoom.exits.left) player.x = Math.max(15, player.x);
  if (!currentRoom.exits.right) player.x = Math.min(ROOM_SIZE - 15, player.x);
  if (!currentRoom.exits.up) player.y = Math.max(15, player.y);
  if (!currentRoom.exits.down) player.y = Math.min(ROOM_SIZE - 15, player.y);

  // Draw walls
  color("purple");
  if (!currentRoom.exits.left) rect(0, 0, 10, ROOM_SIZE);
  if (!currentRoom.exits.right) rect(ROOM_SIZE - 10, 0, 10, ROOM_SIZE);
  if (!currentRoom.exits.up) rect(0, 0, ROOM_SIZE, 10);
  if (!currentRoom.exits.down) rect(0, ROOM_SIZE - 10, ROOM_SIZE, 10);

  // Draw exits
  color("cyan");
  if (currentRoom.exits.left) rect(0, 80, 5, 40);
  if (currentRoom.exits.right) rect(ROOM_SIZE - 5, 80, 5, 40);
  if (currentRoom.exits.up) rect(80, 0, 40, 5);
  if (currentRoom.exits.down) rect(80, ROOM_SIZE - 5, 40, 5);

  // Radiation warning
  if (currentRoom.radiation) {
    color("light_green");
    text("RADIATION!", 100, 20);
  }

  // Escape pod
  if (currentRoom.hasEscapePod) {
    color("green");
    const podCollision = char("d", 100, 100);

    if (!inventory.key) {
      color("red");
      text("LOCKED", 100, 80);
    } else if (podCollision.isColliding.char.a) {
      gameWon = true;
      addScore(1000 + Math.floor(health * 10) - Math.floor(infection));
      play("powerUp");
    }
  }

  // Items
  items = items.filter(item => {
    let itemChar = "c";
    if (item.type === "key") { color("cyan"); itemChar = "f"; }
    else if (item.type === "antidote") { color("light_green"); }
    else if (item.type === "medkit") { color("red"); }
    else if (item.type === "weapon") { color("light_purple"); }
    else if (item.type === "armor") { color("light_blue"); }
    else { color("yellow"); }

    const collision = char(itemChar, item.x, item.y);

    if (collision.isColliding.char.a) {
      play("coin");
      stats.itemsCollected++;
      const itemKey = `${currentRoom.id}_${item.type}_${item.x}_${item.y}`;
      window.collectedItems[itemKey] = true;

      if (item.type === "food") { hunger = Math.max(0, hunger - 25); addScore(10); }
      else if (item.type === "medkit") { health = Math.min(maxHealth, health + 30); addScore(20); }
      else if (item.type === "antidote") { infection = Math.max(0, infection - 30); addScore(30); }
      else if (item.type === "key") { inventory.key = true; addScore(100); }
      else if (item.type === "weapon") { inventory.weapon++; player.damage += 5; addScore(50); }
      else if (item.type === "armor") { inventory.armor++; maxHealth += 20; health += 20; addScore(50); }

      return false;
    }
    return true;
  });

  // Player attack cooldown
  if (player.attackCooldown > 0) player.attackCooldown--;

  // Enemies
  enemies = enemies.filter(e => {
    const eStats = getEnemyStats(e.type);

    e.moveTimer++;
    if (e.moveTimer > 30) {
      e.moveTimer = 0;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = sqrt(dx * dx + dy * dy);

      if (dist < 100 && dist > 0) {
        if (eStats.ranged && dist > 40) {
          // Spitter shoots
          e.attackTimer++;
          if (e.attackTimer > 60) {
            e.attackTimer = 0;
            projectiles.push({
              x: e.x, y: e.y,
              vx: (dx / dist) * 2,
              vy: (dy / dist) * 2,
              damage: eStats.damage
            });
            play("laser");
          }
        }
        e.vx = (dx / dist) * eStats.speed;
        e.vy = (dy / dist) * eStats.speed;
      }
    }

    e.x += e.vx;
    e.y += e.vy;
    e.x = clamp(e.x, 15, ROOM_SIZE - 15);
    e.y = clamp(e.y, 15, ROOM_SIZE - 15);

    color("red");
    const collision = char(eStats.char, e.x, e.y);

    // Player attacks
    if ((keyboard.code["KeyZ"].isJustPressed || keyboard.code["Space"].isJustPressed) && player.attackCooldown === 0) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (sqrt(dx * dx + dy * dy) < 30) {
        e.hp -= player.damage;
        player.attackCooldown = 15;
        play("hit");
        particle(vec(e.x, e.y), { count: 3, speed: 1 });
        if (e.hp <= 0) {
          play("explosion");
          addScore(50 + e.maxHp * 10);
          stats.enemiesKilled++;
          return false;
        }
      }
    }

    // Enemy contact damage
    if (collision.isColliding.char.a) {
      if (gameTime % 30 === 0) {
        const dmg = inventory.armor > 0 ? Math.floor(eStats.damage * 0.7) : eStats.damage;
        health -= dmg;
        infection = Math.min(100, infection + 3);
        play("hit");
        particle(vec(player.x, player.y), { count: 2, speed: 1 });
      }
    }

    // HP bar for tough enemies
    if (e.maxHp > 3) {
      color("black");
      rect(e.x - 10, e.y - 15, 20, 3);
      color("red");
      rect(e.x - 10, e.y - 15, 20 * (e.hp / e.maxHp), 3);
    }

    return true;
  });

  // Projectiles
  projectiles = projectiles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;

    color("light_green");
    const col = box(p.x, p.y, 3);

    if (col.isColliding.char.a) {
      const dmg = inventory.armor > 0 ? Math.floor(p.damage * 0.7) : p.damage;
      health -= dmg;
      play("hit");
      return false;
    }

    return p.x > 0 && p.x < ROOM_SIZE && p.y > 0 && p.y < ROOM_SIZE;
  });

  // Draw player
  color(infection > 50 ? "light_green" : "cyan");
  char("a", player.x, player.y);

  // HUD
  color("black");
  rect(0, ROOM_SIZE, 200, 20);

  color("white");
  text(currentRoom.name, 10, ROOM_SIZE + 7, { isSmallText: true });

  color("red");
  rect(50, ROOM_SIZE + 3, Math.max(0, health) * 0.4, 5);
  color("light_black");
  text("HP", 45, ROOM_SIZE + 7, { isSmallText: true });

  color("yellow");
  rect(110, ROOM_SIZE + 3, hunger * 0.3, 5);
  color("light_black");
  text("HU", 105, ROOM_SIZE + 7, { isSmallText: true });

  color("green");
  rect(160, ROOM_SIZE + 3, infection * 0.3, 5);
  color("light_black");
  text("IN", 155, ROOM_SIZE + 7, { isSmallText: true });

  if (inventory.key) {
    color("cyan");
    text("KEY", 185, ROOM_SIZE + 7, { isSmallText: true });
  }
}

// Wait for DOM to be ready before initializing
window.addEventListener("load", () => {
  init({ update, title, description, characters, options });
});
