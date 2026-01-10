// Frostfall: A 2D Skyrim Demake (PixiJS)
// PixiJS loaded from CDN - PIXI is global
const { Application, Graphics, Text, TextStyle, Container } = PIXI;

// Game constants
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;
const MAP_W = 20;
const MAP_H = 15;

// Movement speeds
const WALK_SPEED = 2.5;
const SPRINT_SPEED = 4.5;

// Combat
const ATTACK_RANGE = 40;
const ATTACK_COOLDOWN = 30;
const DODGE_COOLDOWN = 45;
const DODGE_SPEED = 8;
const DODGE_DURATION = 12;

// Tile types
const EMPTY = 0;
const WALL = 1;
const TREE = 2;
const WATER = 3;
const DOOR = 4;
const CHEST = 5;
const NPC = 6;

// Game state
let gameState = {
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  magicka: 50,
  maxMagicka: 50,
  gold: 50,
  level: 1,
  xp: 0,
  xpToLevel: 100,
  combatSkill: 1,
  magicSkill: 1,
  stealthSkill: 1,
  isDead: false,
  questStage: 0,
  kills: 0,
  currentArea: 'riverwood'
};

window.gameState = gameState;

// Game objects
let app;
let gameContainer;
let hudContainer;
let player;
let enemies = [];
let loot = [];
let npcs = [];
let map = [];
let currentMap = 'riverwood';

// Input state
const keys = {};
const mousePos = { x: 0, y: 0 };
let mouseDown = false;

// Equipment
let equipment = {
  weapon: { name: 'Iron Sword', damage: 8, type: 'melee' },
  armor: { name: 'Leather Armor', defense: 10 }
};

// Inventory
let inventory = [
  { name: 'Health Potion', type: 'consumable', effect: 'heal', value: 25, count: 3 },
  { name: 'Stamina Potion', type: 'consumable', effect: 'stamina', value: 50, count: 2 }
];

// Initialize (PixiJS v7 sync API)
(() => {
  app = new Application({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x2d4a2d,
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
    if (e.code === 'KeyE') handleInteract();
    if (e.code === 'Digit1') usePotion('heal');
    if (e.code === 'Digit2') usePotion('stamina');
    if (e.code === 'Tab') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('mousemove', (e) => {
    const rect = app.view.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouseDown = true;
      handleAttack();
    }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseDown = false;
  });

  // Start game
  generateMap('riverwood');
  createPlayer();
  createHUD();

  // Game loop
  app.ticker.add(gameLoop);

  console.log('Frostfall (PixiJS) loaded');
})();

function generateMap(area) {
  // Clear previous
  gameContainer.removeChildren();
  enemies = [];
  loot = [];
  npcs = [];
  map = [];
  currentMap = area;
  gameState.currentArea = area;

  // Initialize empty map
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      if (x === 0 || x === MAP_W - 1 || y === 0 || y === MAP_H - 1) {
        row.push(WALL);
      } else {
        row.push(EMPTY);
      }
    }
    map.push(row);
  }

  if (area === 'riverwood') {
    // Village layout
    // Buildings
    for (let y = 2; y < 6; y++) {
      for (let x = 2; x < 6; x++) {
        if (y === 2 || y === 5 || x === 2 || x === 5) map[y][x] = WALL;
      }
    }
    map[5][3] = DOOR; // Shop door

    for (let y = 2; y < 6; y++) {
      for (let x = 8; x < 12; x++) {
        if (y === 2 || y === 5 || x === 8 || x === 11) map[y][x] = WALL;
      }
    }
    map[5][9] = DOOR; // Blacksmith door

    // Trees
    const treePositions = [[14, 3], [15, 5], [16, 2], [17, 4], [14, 8], [16, 10], [3, 10], [5, 12]];
    treePositions.forEach(([x, y]) => {
      if (y < MAP_H && x < MAP_W) map[y][x] = TREE;
    });

    // River
    for (let y = 6; y < 10; y++) {
      map[y][18] = WATER;
      map[y][17] = WATER;
    }

    // Exit to wilderness
    map[MAP_H - 1][10] = DOOR;

    // NPCs
    createNPC(4, 6, 'Alvor', 'blacksmith');
    createNPC(10, 6, 'Lucan', 'merchant');

    // Quest indicator
    if (gameState.questStage === 0) {
      npcs[0].hasQuest = true;
    }

  } else if (area === 'wilderness') {
    // Forest wilderness
    const numTrees = 20;
    for (let i = 0; i < numTrees; i++) {
      const tx = Math.floor(Math.random() * (MAP_W - 4)) + 2;
      const ty = Math.floor(Math.random() * (MAP_H - 4)) + 2;
      if (map[ty][tx] === EMPTY) map[ty][tx] = TREE;
    }

    // Entry back to riverwood
    map[0][10] = DOOR;

    // Dungeon entrance
    map[MAP_H - 1][MAP_W - 3] = DOOR;

    // Enemies
    spawnEnemies(area, 5);

    // Loot
    createLoot(5 * TILE_SIZE, 8 * TILE_SIZE, 'gold', 15);
    createLoot(12 * TILE_SIZE, 4 * TILE_SIZE, 'gold', 10);

  } else if (area === 'dungeon') {
    // Dungeon layout
    // Inner walls
    for (let x = 4; x < 8; x++) map[4][x] = WALL;
    for (let y = 4; y < 8; y++) map[y][8] = WALL;
    for (let x = 10; x < 16; x++) map[7][x] = WALL;
    for (let y = 7; y < 12; y++) map[y][10] = WALL;

    // Doorways
    map[4][6] = EMPTY;
    map[7][12] = EMPTY;

    // Exit
    map[0][3] = DOOR;

    // Boss room door (locked until enemies cleared)
    map[MAP_H - 2][MAP_W - 2] = CHEST;

    // Enemies - draugr
    spawnEnemies(area, 6);

    // Treasure
    createLoot(15 * TILE_SIZE, 12 * TILE_SIZE, 'gold', 50);
    createLoot(3 * TILE_SIZE, 10 * TILE_SIZE, 'potion', 1);
  }

  drawMap();
}

function drawMap() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      const g = new Graphics();

      if (tile === EMPTY) {
        // Ground
        if (currentMap === 'dungeon') {
          g.beginFill(0x3a3a4a);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          if ((x + y) % 2 === 0) {
            g.beginFill(0x404050);
            g.drawRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            g.endFill();
          }
        } else {
          g.beginFill(currentMap === 'riverwood' ? 0x4a6a3a : 0x3a5a2a);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          // Grass detail
          if (Math.random() > 0.7) {
            g.beginFill(0x5a8a4a);
            g.drawRect(px + 8, py + 12, 2, 8);
            g.endFill();
          }
        }
      } else if (tile === WALL) {
        if (currentMap === 'dungeon') {
          g.beginFill(0x505060);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          g.beginFill(0x404050);
          g.drawRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          g.endFill();
        } else if (currentMap === 'riverwood') {
          // Building walls
          g.beginFill(0x8b7355);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
          g.beginFill(0x6b5335);
          g.drawRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          g.endFill();
        } else {
          // Rock walls
          g.beginFill(0x5a5a5a);
          g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
          g.endFill();
        }
      } else if (tile === TREE) {
        // Ground first
        g.beginFill(currentMap === 'riverwood' ? 0x4a6a3a : 0x3a5a2a);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        // Trunk
        g.beginFill(0x5a4030);
        g.drawRect(px + 12, py + 16, 8, 16);
        g.endFill();
        // Foliage
        g.beginFill(0x2a6a2a);
        g.drawCircle(px + 16, py + 10, 12);
        g.endFill();
      } else if (tile === WATER) {
        g.beginFill(0x3a6a9a);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        g.beginFill(0x5a8aba);
        g.drawRect(px + 4, py + 8, 8, 2);
        g.endFill();
      } else if (tile === DOOR) {
        // Ground
        g.beginFill(currentMap === 'dungeon' ? 0x3a3a4a : 0x4a6a3a);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        // Door frame
        g.beginFill(0x6a4a2a);
        g.drawRect(px + 8, py + 4, 16, 24);
        g.endFill();
        g.beginFill(0x4a3a2a);
        g.drawRect(px + 10, py + 6, 12, 20);
        g.endFill();
      } else if (tile === CHEST) {
        // Ground
        g.beginFill(currentMap === 'dungeon' ? 0x3a3a4a : 0x4a6a3a);
        g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
        g.endFill();
        // Chest
        g.beginFill(0x8a6a3a);
        g.drawRect(px + 4, py + 10, 24, 18);
        g.endFill();
        g.beginFill(0x6a4a2a);
        g.drawRect(px + 6, py + 12, 20, 8);
        g.endFill();
        g.beginFill(0xccaa44);
        g.drawRect(px + 13, py + 14, 6, 6);
        g.endFill();
      }

      gameContainer.addChild(g);
    }
  }
}

function createPlayer() {
  player = {
    x: 7 * TILE_SIZE,
    y: 8 * TILE_SIZE,
    vx: 0,
    vy: 0,
    facing: 'down',
    attackTimer: 0,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeDir: { x: 0, y: 0 },
    isAttacking: false,
    staminaRegen: 0,
    graphics: new Graphics(),
    attackGraphics: new Graphics()
  };
  drawPlayer();
  gameContainer.addChild(player.graphics);
  gameContainer.addChild(player.attackGraphics);
}

function drawPlayer() {
  player.graphics.clear();

  // Body
  player.graphics.beginFill(0x5588bb);
  player.graphics.drawRect(-8, -12, 16, 24);
  player.graphics.endFill();

  // Head
  player.graphics.beginFill(0xddaa88);
  player.graphics.drawRect(-6, -10, 12, 10);
  player.graphics.endFill();

  // Hair
  player.graphics.beginFill(0x4a3a2a);
  player.graphics.drawRect(-6, -12, 12, 4);
  player.graphics.endFill();

  // Weapon indicator
  if (player.isAttacking) {
    const dir = getFacingOffset();
    player.attackGraphics.clear();
    player.attackGraphics.beginFill(0xcccccc);
    player.attackGraphics.drawRect(-4 + dir.x * 16, -4 + dir.y * 16, 8, 8);
    player.attackGraphics.endFill();
  } else {
    player.attackGraphics.clear();
  }

  player.graphics.position.set(player.x, player.y);
  player.attackGraphics.position.set(player.x, player.y);
}

function getFacingOffset() {
  const angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  };
}

function createNPC(tx, ty, name, role) {
  const npc = {
    x: tx * TILE_SIZE + TILE_SIZE / 2,
    y: ty * TILE_SIZE + TILE_SIZE / 2,
    name,
    role,
    hasQuest: false,
    graphics: new Graphics()
  };

  // Draw NPC
  npc.graphics.beginFill(role === 'blacksmith' ? 0x8a6a4a : 0x6a8a4a);
  npc.graphics.drawRect(-8, -12, 16, 24);
  npc.graphics.endFill();
  npc.graphics.beginFill(0xddaa88);
  npc.graphics.drawRect(-6, -10, 12, 10);
  npc.graphics.endFill();
  npc.graphics.position.set(npc.x, npc.y);

  npcs.push(npc);
  gameContainer.addChild(npc.graphics);
}

function spawnEnemies(area, count) {
  for (let i = 0; i < count; i++) {
    let ex, ey;
    let attempts = 0;
    do {
      ex = Math.floor(Math.random() * (MAP_W - 4)) + 2;
      ey = Math.floor(Math.random() * (MAP_H - 4)) + 2;
      attempts++;
    } while (map[ey][ex] !== EMPTY && attempts < 50);

    if (attempts < 50) {
      let type, hp, damage, color, speed;
      if (area === 'wilderness') {
        if (Math.random() > 0.4) {
          type = 'wolf';
          hp = 25;
          damage = 6;
          color = 0x6a6a6a;
          speed = 2.0;
        } else {
          type = 'bandit';
          hp = 40;
          damage = 8;
          color = 0x8a5a3a;
          speed = 1.5;
        }
      } else {
        type = 'draugr';
        hp = 50;
        damage = 10;
        color = 0x4a5a5a;
        speed = 1.2;
      }

      createEnemy(ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, type, hp, damage, color, speed);
    }
  }
}

function createEnemy(x, y, type, hp, damage, color, speed) {
  const enemy = {
    x,
    y,
    type,
    hp,
    maxHp: hp,
    damage,
    speed,
    state: 'idle',
    attackTimer: 0,
    hitTimer: 0,
    graphics: new Graphics()
  };

  if (type === 'wolf') {
    enemy.graphics.beginFill(color);
    enemy.graphics.drawEllipse(0, 0, 14, 8);
    enemy.graphics.endFill();
    enemy.graphics.beginFill(color);
    enemy.graphics.drawCircle(-10, -2, 4);
    enemy.graphics.endFill();
  } else {
    enemy.graphics.beginFill(color);
    enemy.graphics.drawRect(-8, -12, 16, 24);
    enemy.graphics.endFill();
    enemy.graphics.beginFill(type === 'draugr' ? 0x88bbcc : 0xddaa88);
    enemy.graphics.drawRect(-4, -8, 8, 6);
    enemy.graphics.endFill();
  }

  enemy.graphics.position.set(x, y);
  enemies.push(enemy);
  gameContainer.addChild(enemy.graphics);
}

function createLoot(x, y, type, value) {
  const item = {
    x,
    y,
    type,
    value,
    graphics: new Graphics()
  };

  if (type === 'gold') {
    item.graphics.beginFill(0xccaa44);
    item.graphics.drawCircle(0, 0, 6);
    item.graphics.endFill();
  } else if (type === 'potion') {
    item.graphics.beginFill(0xcc4444);
    item.graphics.drawRect(-4, -6, 8, 12);
    item.graphics.endFill();
  }

  item.graphics.position.set(x, y);
  loot.push(item);
  gameContainer.addChild(item.graphics);
}

function isWall(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return true;
  const tile = map[ty][tx];
  return tile === WALL || tile === TREE || tile === WATER;
}

function handleAttack() {
  if (gameState.isDead) return;
  if (player.attackTimer > 0) return;
  if (gameState.stamina < 10) return;

  player.attackTimer = ATTACK_COOLDOWN;
  player.isAttacking = true;
  gameState.stamina -= 10;
  player.staminaRegen = 60;

  const dir = getFacingOffset();
  const attackX = player.x + dir.x * ATTACK_RANGE;
  const attackY = player.y + dir.y * ATTACK_RANGE;

  // Check enemy hits
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dist = Math.sqrt((attackX - e.x) ** 2 + (attackY - e.y) ** 2);

    if (dist < 30) {
      const damage = equipment.weapon.damage * (1 + gameState.combatSkill * 0.05);
      e.hp -= damage;
      e.hitTimer = 10;

      // XP gain
      gameState.xp += 5;

      if (e.hp <= 0) {
        gameState.kills++;
        gameState.xp += e.maxHp;

        // Drop loot
        if (Math.random() > 0.5) {
          createLoot(e.x, e.y, 'gold', Math.floor(e.maxHp / 4));
        }

        gameContainer.removeChild(e.graphics);
        enemies.splice(i, 1);
      }
    }
  }

  // Level up check
  checkLevelUp();
}

function handleInteract() {
  if (gameState.isDead) return;

  const tx = Math.floor(player.x / TILE_SIZE);
  const ty = Math.floor(player.y / TILE_SIZE);

  // Check adjacent tiles for doors
  const checkTiles = [
    [tx, ty - 1], [tx, ty + 1], [tx - 1, ty], [tx + 1, ty], [tx, ty]
  ];

  for (const [cx, cy] of checkTiles) {
    if (cy >= 0 && cy < MAP_H && cx >= 0 && cx < MAP_W) {
      if (map[cy][cx] === DOOR) {
        // Transition to new area
        if (currentMap === 'riverwood' && cy === MAP_H - 1) {
          generateMap('wilderness');
          player.x = 10 * TILE_SIZE;
          player.y = 2 * TILE_SIZE;
          createPlayer();
        } else if (currentMap === 'wilderness' && cy === 0) {
          generateMap('riverwood');
          player.x = 10 * TILE_SIZE;
          player.y = 12 * TILE_SIZE;
          createPlayer();
        } else if (currentMap === 'wilderness' && cy === MAP_H - 1) {
          generateMap('dungeon');
          player.x = 3 * TILE_SIZE;
          player.y = 2 * TILE_SIZE;
          createPlayer();
        } else if (currentMap === 'dungeon' && cy === 0) {
          generateMap('wilderness');
          player.x = 17 * TILE_SIZE;
          player.y = 12 * TILE_SIZE;
          createPlayer();
        }
        return;
      }

      if (map[cy][cx] === CHEST && enemies.length === 0) {
        // Open chest
        gameState.gold += 100;
        gameState.xp += 50;
        if (gameState.questStage === 1) {
          gameState.questStage = 2;
        }
        map[cy][cx] = EMPTY;
        // Redraw map
        gameContainer.removeChildren();
        drawMap();
        gameContainer.addChild(player.graphics);
        gameContainer.addChild(player.attackGraphics);
        for (const e of enemies) gameContainer.addChild(e.graphics);
        for (const l of loot) gameContainer.addChild(l.graphics);
        for (const n of npcs) gameContainer.addChild(n.graphics);
        checkLevelUp();
        return;
      }
    }
  }

  // Check NPCs
  for (const npc of npcs) {
    const dist = Math.sqrt((npc.x - player.x) ** 2 + (npc.y - player.y) ** 2);
    if (dist < 50) {
      if (npc.hasQuest && gameState.questStage === 0) {
        gameState.questStage = 1;
        npc.hasQuest = false;
      } else if (npc.role === 'merchant') {
        // Buy health potion
        if (gameState.gold >= 30) {
          gameState.gold -= 30;
          const potion = inventory.find(i => i.effect === 'heal');
          if (potion) potion.count++;
        }
      }
      return;
    }
  }
}

function usePotion(type) {
  const potion = inventory.find(i => i.effect === type && i.count > 0);
  if (!potion) return;

  potion.count--;
  if (type === 'heal') {
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + potion.value);
  } else if (type === 'stamina') {
    gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + potion.value);
  }
}

function checkLevelUp() {
  while (gameState.xp >= gameState.xpToLevel) {
    gameState.xp -= gameState.xpToLevel;
    gameState.level++;
    gameState.maxHp += 10;
    gameState.hp = gameState.maxHp;
    gameState.maxStamina += 5;
    gameState.stamina = gameState.maxStamina;
    gameState.maxMagicka += 5;
    gameState.combatSkill = Math.min(10, gameState.combatSkill + 1);
    gameState.xpToLevel = 100 * gameState.level;
  }
}

function createHUD() {
  hudContainer.removeChildren();
}

function updateHUD() {
  hudContainer.removeChildren();

  // HP Bar background
  const hpBg = new Graphics();
  hpBg.beginFill(0x333333);
  hpBg.drawRect(10, 10, 154, 18);
  hpBg.endFill();
  hudContainer.addChild(hpBg);

  // HP bar
  const hpPct = gameState.hp / gameState.maxHp;
  const hpBar = new Graphics();
  hpBar.beginFill(0xcc4444);
  hpBar.drawRect(12, 12, hpPct * 150, 14);
  hpBar.endFill();
  hudContainer.addChild(hpBar);

  // Stamina bar background
  const stBg = new Graphics();
  stBg.beginFill(0x333333);
  stBg.drawRect(10, 32, 154, 14);
  stBg.endFill();
  hudContainer.addChild(stBg);

  // Stamina bar
  const stPct = gameState.stamina / gameState.maxStamina;
  const stBar = new Graphics();
  stBar.beginFill(0x44cc44);
  stBar.drawRect(12, 34, stPct * 150, 10);
  stBar.endFill();
  hudContainer.addChild(stBar);

  // Magicka bar background
  const mpBg = new Graphics();
  mpBg.beginFill(0x333333);
  mpBg.drawRect(10, 50, 104, 12);
  mpBg.endFill();
  hudContainer.addChild(mpBg);

  // Magicka bar
  const mpPct = gameState.magicka / gameState.maxMagicka;
  const mpBar = new Graphics();
  mpBar.beginFill(0x4488cc);
  mpBar.drawRect(12, 52, mpPct * 100, 8);
  mpBar.endFill();
  hudContainer.addChild(mpBar);

  // Text style
  const style = new TextStyle({ fill: '#ffffff', fontSize: 14 });
  const smallStyle = new TextStyle({ fill: '#cccccc', fontSize: 12 });

  // Stats
  const hpText = new Text(`HP: ${Math.floor(gameState.hp)}/${gameState.maxHp}`, smallStyle);
  hpText.position.set(170, 10);
  hudContainer.addChild(hpText);

  const stText = new Text(`ST: ${Math.floor(gameState.stamina)}`, smallStyle);
  stText.position.set(170, 30);
  hudContainer.addChild(stText);

  // Gold and Level
  const goldText = new Text(`Gold: ${gameState.gold}`, style);
  goldText.position.set(GAME_WIDTH - 100, 10);
  hudContainer.addChild(goldText);

  const levelText = new Text(`Level: ${gameState.level}`, style);
  levelText.position.set(GAME_WIDTH - 100, 30);
  hudContainer.addChild(levelText);

  // XP bar
  const xpBg = new Graphics();
  xpBg.beginFill(0x333333);
  xpBg.drawRect(GAME_WIDTH - 110, 52, 104, 8);
  xpBg.endFill();
  hudContainer.addChild(xpBg);

  const xpPct = gameState.xp / gameState.xpToLevel;
  const xpBar = new Graphics();
  xpBar.beginFill(0xccaa44);
  xpBar.drawRect(GAME_WIDTH - 108, 53, xpPct * 100, 6);
  xpBar.endFill();
  hudContainer.addChild(xpBar);

  // Current area
  const areaNames = { riverwood: 'Riverwood', wilderness: 'Wilderness', dungeon: 'Bleak Falls Barrow' };
  const areaText = new Text(areaNames[currentMap], new TextStyle({ fill: '#aaaaaa', fontSize: 14 }));
  areaText.position.set(GAME_WIDTH / 2 - 40, 10);
  hudContainer.addChild(areaText);

  // Quest tracker
  let questText = '';
  if (gameState.questStage === 0) {
    questText = 'Talk to Alvor in Riverwood';
  } else if (gameState.questStage === 1) {
    questText = 'Clear Bleak Falls Barrow';
  } else if (gameState.questStage === 2) {
    questText = 'Quest Complete!';
  }
  const quest = new Text(questText, new TextStyle({ fill: '#ffcc44', fontSize: 12 }));
  quest.position.set(10, GAME_HEIGHT - 25);
  hudContainer.addChild(quest);

  // Quick slots
  const slot1 = new Text(`[1] HP Pot: ${inventory.find(i => i.effect === 'heal')?.count || 0}`, smallStyle);
  slot1.position.set(10, 70);
  hudContainer.addChild(slot1);

  const slot2 = new Text(`[2] ST Pot: ${inventory.find(i => i.effect === 'stamina')?.count || 0}`, smallStyle);
  slot2.position.set(10, 85);
  hudContainer.addChild(slot2);

  // Controls hint
  const controls = new Text('WASD: Move | Click: Attack | Shift: Dodge | E: Interact', new TextStyle({ fill: '#666666', fontSize: 10 }));
  controls.position.set(GAME_WIDTH / 2 - 150, GAME_HEIGHT - 12);
  hudContainer.addChild(controls);

  // Enemy count in dangerous areas
  if (currentMap !== 'riverwood') {
    const enemyText = new Text(`Enemies: ${enemies.length}`, new TextStyle({ fill: '#ff8888', fontSize: 12 }));
    enemyText.position.set(GAME_WIDTH / 2 - 30, 30);
    hudContainer.addChild(enemyText);
  }

  // NPC quest markers
  for (const npc of npcs) {
    if (npc.hasQuest) {
      const marker = new Graphics();
      marker.beginFill(0xffcc00);
      marker.drawRect(npc.x - 4, npc.y - 24, 8, 12);
      marker.endFill();
      gameContainer.addChild(marker);
    }
  }

  // Death screen
  if (gameState.isDead) {
    const overlay = new Graphics();
    overlay.beginFill(0x000000, 0.8);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    hudContainer.addChild(overlay);

    const deathStyle = new TextStyle({ fill: '#cc4444', fontSize: 48 });
    const deathText = new Text('YOU DIED', deathStyle);
    deathText.anchor.set(0.5);
    deathText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
    hudContainer.addChild(deathText);

    const restartText = new Text('Press R to restart', new TextStyle({ fill: '#888888', fontSize: 18 }));
    restartText.anchor.set(0.5);
    restartText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    hudContainer.addChild(restartText);
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

  // Player movement
  let speed = WALK_SPEED;
  const sprinting = keys['ShiftLeft'] || keys['ShiftRight'];

  // Dodge roll
  if (player.dodgeTimer > 0) {
    player.dodgeTimer--;
    player.x += player.dodgeDir.x * DODGE_SPEED;
    player.y += player.dodgeDir.y * DODGE_SPEED;

    // Clamp and collision
    if (isWall(player.x, player.y)) {
      player.x -= player.dodgeDir.x * DODGE_SPEED;
      player.y -= player.dodgeDir.y * DODGE_SPEED;
    }
  } else {
    // Normal movement
    if (sprinting && gameState.stamina > 0) {
      speed = SPRINT_SPEED;
      gameState.stamina -= 0.3;
      player.staminaRegen = 60;
    }

    player.vx = 0;
    player.vy = 0;

    if (keys['KeyW'] || keys['ArrowUp']) player.vy = -speed;
    if (keys['KeyS'] || keys['ArrowDown']) player.vy = speed;
    if (keys['KeyA'] || keys['ArrowLeft']) player.vx = -speed;
    if (keys['KeyD'] || keys['ArrowRight']) player.vx = speed;

    // Diagonal normalization
    if (player.vx !== 0 && player.vy !== 0) {
      player.vx *= 0.707;
      player.vy *= 0.707;
    }

    // Apply movement with collision
    const newX = player.x + player.vx;
    const newY = player.y + player.vy;
    if (!isWall(newX, player.y)) player.x = newX;
    if (!isWall(player.x, newY)) player.y = newY;

    // Initiate dodge
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - 1);
    if ((keys['Space']) && player.dodgeCooldown <= 0 && gameState.stamina >= 20) {
      if (player.vx !== 0 || player.vy !== 0) {
        const len = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        player.dodgeDir = { x: player.vx / len, y: player.vy / len };
        player.dodgeTimer = DODGE_DURATION;
        player.dodgeCooldown = DODGE_COOLDOWN;
        gameState.stamina -= 20;
        player.staminaRegen = 60;
      }
    }
  }

  // Clamp to map bounds
  player.x = Math.max(16, Math.min(GAME_WIDTH - 16, player.x));
  player.y = Math.max(16, Math.min(GAME_HEIGHT - 16, player.y));

  // Attack timer
  player.attackTimer = Math.max(0, player.attackTimer - 1);
  if (player.attackTimer < ATTACK_COOLDOWN - 8) {
    player.isAttacking = false;
  }

  // Stamina regen
  if (player.staminaRegen > 0) {
    player.staminaRegen--;
  } else {
    gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 0.3);
  }

  drawPlayer();

  // Update enemies
  for (const e of enemies) {
    const distToPlayer = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);

    // State transitions
    if (distToPlayer < 150) {
      e.state = 'chase';
    } else if (distToPlayer > 200) {
      e.state = 'idle';
    }

    // Movement
    if (e.state === 'chase') {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      const nx = e.x + Math.cos(angle) * e.speed;
      const ny = e.y + Math.sin(angle) * e.speed;
      if (!isWall(nx, e.y)) e.x = nx;
      if (!isWall(e.x, ny)) e.y = ny;
    } else {
      // Idle wander
      if (Math.random() < 0.01) {
        const angle = Math.random() * Math.PI * 2;
        const nx = e.x + Math.cos(angle) * e.speed * 0.5;
        const ny = e.y + Math.sin(angle) * e.speed * 0.5;
        if (!isWall(nx, ny)) {
          e.x = nx;
          e.y = ny;
        }
      }
    }

    // Attack player
    e.attackTimer = Math.max(0, e.attackTimer - 1);
    if (distToPlayer < 25 && e.attackTimer <= 0 && player.dodgeTimer <= 0) {
      const damage = Math.max(1, e.damage - equipment.armor.defense / 5);
      gameState.hp -= damage;
      e.attackTimer = 60;
    }

    // Update graphics
    e.hitTimer = Math.max(0, e.hitTimer - 1);
    if (e.hitTimer > 0) {
      e.graphics.tint = 0xffffff;
    } else {
      e.graphics.tint = 0xffffff;
    }
    e.graphics.position.set(e.x, e.y);
  }

  // Collect loot
  for (let i = loot.length - 1; i >= 0; i--) {
    const l = loot[i];
    const dist = Math.sqrt((l.x - player.x) ** 2 + (l.y - player.y) ** 2);
    if (dist < 25) {
      if (l.type === 'gold') {
        gameState.gold += l.value;
      } else if (l.type === 'potion') {
        const potion = inventory.find(item => item.effect === 'heal');
        if (potion) potion.count += l.value;
      }
      gameContainer.removeChild(l.graphics);
      loot.splice(i, 1);
    }
  }

  // Check death
  if (gameState.hp <= 0) {
    gameState.hp = 0;
    gameState.isDead = true;
  }

  // Update window gameState
  window.gameState = gameState;

  updateHUD();
}

function resetGame() {
  gameState = {
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    magicka: 50,
    maxMagicka: 50,
    gold: 50,
    level: 1,
    xp: 0,
    xpToLevel: 100,
    combatSkill: 1,
    magicSkill: 1,
    stealthSkill: 1,
    isDead: false,
    questStage: 0,
    kills: 0,
    currentArea: 'riverwood'
  };
  window.gameState = gameState;

  inventory = [
    { name: 'Health Potion', type: 'consumable', effect: 'heal', value: 25, count: 3 },
    { name: 'Stamina Potion', type: 'consumable', effect: 'stamina', value: 50, count: 2 }
  ];

  generateMap('riverwood');
  createPlayer();
}
