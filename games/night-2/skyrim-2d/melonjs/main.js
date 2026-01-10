// Frostfall: A 2D Skyrim Demake (MelonJS)
// Uses global 'me' from CDN

// Game constants
const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const TILE_SIZE = 32;
const MAP_W = 20;
const MAP_H = 15;

// Movement
const WALK_SPEED = 100;
const SPRINT_SPEED = 180;
const DODGE_SPEED = 300;
const DODGE_DURATION = 200;
const ATTACK_COOLDOWN = 500;

// Tile types
const EMPTY = 0;
const WALL = 1;
const TREE = 2;
const WATER = 3;
const DOOR = 4;
const CHEST = 5;

// Game state
const gameState = {
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
  isDead: false,
  questStage: 0,
  kills: 0,
  currentArea: 'riverwood',
  potions: { health: 3, stamina: 2 }
};

window.gameState = gameState;

let map = [];
let currentMap = 'riverwood';
let player = null;
let enemies = [];
let npcs = [];
let loot = [];

// Initialize MelonJS
me.device.onReady(() => {
  if (!me.video.init(GAME_WIDTH, GAME_HEIGHT, {
    parent: 'screen',
    scaleMethod: 'flex-width',
    renderer: me.video.AUTO
  })) {
    console.error('Failed to initialize video');
    return;
  }

  // Input bindings
  me.input.bindKey(me.input.KEY.W, 'up');
  me.input.bindKey(me.input.KEY.S, 'down');
  me.input.bindKey(me.input.KEY.A, 'left');
  me.input.bindKey(me.input.KEY.D, 'right');
  me.input.bindKey(me.input.KEY.UP, 'up');
  me.input.bindKey(me.input.KEY.DOWN, 'down');
  me.input.bindKey(me.input.KEY.LEFT, 'left');
  me.input.bindKey(me.input.KEY.RIGHT, 'right');
  me.input.bindKey(me.input.KEY.SPACE, 'attack');
  me.input.bindKey(me.input.KEY.E, 'interact');
  me.input.bindKey(me.input.KEY.SHIFT, 'sprint');
  me.input.bindKey(me.input.KEY.Z, 'dodge');
  me.input.bindKey(me.input.KEY.NUM1, 'potion1');
  me.input.bindKey(me.input.KEY.NUM2, 'potion2');

  // Start game
  me.state.set(me.state.PLAY, new GameScreen());
  me.state.change(me.state.PLAY);

  console.log('Frostfall (MelonJS) loaded');
});

// Game Screen
class GameScreen extends me.Stage {
  onResetEvent() {
    generateMap('riverwood');
    createPlayer();
    createHUD();
  }
}

function generateMap(area) {
  me.game.world.reset();
  enemies = [];
  npcs = [];
  loot = [];
  map = [];
  currentMap = area;
  gameState.currentArea = area;

  // Initialize map
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
    // Buildings
    for (let y = 2; y < 6; y++) {
      for (let x = 2; x < 6; x++) {
        if (y === 2 || y === 5 || x === 2 || x === 5) map[y][x] = WALL;
      }
    }
    map[5][3] = DOOR;

    for (let y = 2; y < 6; y++) {
      for (let x = 8; x < 12; x++) {
        if (y === 2 || y === 5 || x === 8 || x === 11) map[y][x] = WALL;
      }
    }
    map[5][9] = DOOR;

    // Trees
    [[14, 3], [15, 5], [16, 2], [17, 4], [14, 8], [16, 10], [3, 10], [5, 12]].forEach(([x, y]) => {
      if (y < MAP_H && x < MAP_W) map[y][x] = TREE;
    });

    // River
    for (let y = 6; y < 10; y++) {
      map[y][18] = WATER;
      map[y][17] = WATER;
    }

    // Exit
    map[MAP_H - 1][10] = DOOR;

    // NPCs
    createNPC(4, 6, 'Alvor', 'blacksmith');
    createNPC(10, 6, 'Lucan', 'merchant');

  } else if (area === 'wilderness') {
    // Forest
    for (let i = 0; i < 20; i++) {
      const tx = Math.floor(Math.random() * (MAP_W - 4)) + 2;
      const ty = Math.floor(Math.random() * (MAP_H - 4)) + 2;
      if (map[ty][tx] === EMPTY) map[ty][tx] = TREE;
    }

    map[0][10] = DOOR; // Back to riverwood
    map[MAP_H - 1][MAP_W - 3] = DOOR; // To dungeon

    // Enemies
    spawnEnemies(5);

    // Loot
    createLoot(5 * TILE_SIZE, 8 * TILE_SIZE, 'gold', 15);
    createLoot(12 * TILE_SIZE, 4 * TILE_SIZE, 'gold', 10);

  } else if (area === 'dungeon') {
    // Dungeon walls
    for (let x = 4; x < 8; x++) map[4][x] = WALL;
    for (let y = 4; y < 8; y++) map[y][8] = WALL;
    for (let x = 10; x < 16; x++) map[7][x] = WALL;
    for (let y = 7; y < 12; y++) map[y][10] = WALL;

    map[4][6] = EMPTY;
    map[7][12] = EMPTY;
    map[0][3] = DOOR;
    map[MAP_H - 2][MAP_W - 2] = CHEST;

    // Draugr enemies
    spawnEnemies(6, 'draugr');

    createLoot(15 * TILE_SIZE, 12 * TILE_SIZE, 'gold', 50);
    createLoot(3 * TILE_SIZE, 10 * TILE_SIZE, 'potion', 1);
  }

  // Draw map
  me.game.world.addChild(new MapRenderer(), 0);
}

// Map Renderer
class MapRenderer extends me.Renderable {
  constructor() {
    super(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.alwaysUpdate = true;
  }

  draw(renderer) {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = map[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === EMPTY) {
          renderer.setColor(currentMap === 'dungeon' ? '#3a3a4a' : '#4a6a3a');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === WALL) {
          renderer.setColor(currentMap === 'dungeon' ? '#505060' : '#8b7355');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor(currentMap === 'dungeon' ? '#404050' : '#6b5335');
          renderer.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        } else if (tile === TREE) {
          renderer.setColor('#4a6a3a');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#5a4030');
          renderer.fillRect(px + 12, py + 16, 8, 16);
          renderer.setColor('#2a6a2a');
          renderer.fillEllipse(px + 16, py + 10, 12, 12);
        } else if (tile === WATER) {
          renderer.setColor('#3a6a9a');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#5a8aba');
          renderer.fillRect(px + 4, py + 8, 8, 2);
        } else if (tile === DOOR) {
          renderer.setColor(currentMap === 'dungeon' ? '#3a3a4a' : '#4a6a3a');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#6a4a2a');
          renderer.fillRect(px + 8, py + 4, 16, 24);
          renderer.setColor('#4a3a2a');
          renderer.fillRect(px + 10, py + 6, 12, 20);
        } else if (tile === CHEST) {
          renderer.setColor('#3a3a4a');
          renderer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          renderer.setColor('#8a6a3a');
          renderer.fillRect(px + 4, py + 10, 24, 18);
          renderer.setColor('#6a4a2a');
          renderer.fillRect(px + 6, py + 12, 20, 8);
          renderer.setColor('#ccaa44');
          renderer.fillRect(px + 13, py + 14, 6, 6);
        }
      }
    }
  }
}

function createPlayer() {
  player = new Player(7 * TILE_SIZE, 8 * TILE_SIZE);
  me.game.world.addChild(player, 5);
}

// Player class
class Player extends me.Renderable {
  constructor(x, y) {
    super(x, y, 16, 24);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;

    this.vx = 0;
    this.vy = 0;
    this.facing = 'down';
    this.attackTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeCooldown = 0;
    this.dodgeDir = { x: 0, y: 0 };
    this.isAttacking = false;
    this.staminaRegen = 0;
    this.invincible = 0;
  }

  update(dt) {
    if (gameState.isDead) return false;

    const dtSec = dt / 1000;
    let speed = WALK_SPEED;
    const sprinting = me.input.isKeyPressed('sprint');

    // Dodge
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dt;
      this.pos.x += this.dodgeDir.x * DODGE_SPEED * dtSec;
      this.pos.y += this.dodgeDir.y * DODGE_SPEED * dtSec;

      if (isWall(this.pos.x, this.pos.y)) {
        this.pos.x -= this.dodgeDir.x * DODGE_SPEED * dtSec;
        this.pos.y -= this.dodgeDir.y * DODGE_SPEED * dtSec;
      }
      this.invincible = 100;
    } else {
      // Movement
      if (sprinting && gameState.stamina > 0) {
        speed = SPRINT_SPEED;
        gameState.stamina -= 15 * dtSec;
        this.staminaRegen = 1000;
      }

      this.vx = 0;
      this.vy = 0;

      if (me.input.isKeyPressed('up')) this.vy = -speed;
      if (me.input.isKeyPressed('down')) this.vy = speed;
      if (me.input.isKeyPressed('left')) this.vx = -speed;
      if (me.input.isKeyPressed('right')) this.vx = speed;

      // Set facing direction
      if (this.vy < 0) this.facing = 'up';
      else if (this.vy > 0) this.facing = 'down';
      else if (this.vx < 0) this.facing = 'left';
      else if (this.vx > 0) this.facing = 'right';

      // Diagonal normalization
      if (this.vx !== 0 && this.vy !== 0) {
        this.vx *= 0.707;
        this.vy *= 0.707;
      }

      // Apply movement with collision
      const newX = this.pos.x + this.vx * dtSec;
      const newY = this.pos.y + this.vy * dtSec;
      if (!isWall(newX, this.pos.y)) this.pos.x = newX;
      if (!isWall(this.pos.x, newY)) this.pos.y = newY;

      // Dodge initiation
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
      if (me.input.isKeyPressed('dodge') && this.dodgeCooldown <= 0 && gameState.stamina >= 20) {
        if (this.vx !== 0 || this.vy !== 0) {
          const len = Math.sqrt(this.vx ** 2 + this.vy ** 2);
          this.dodgeDir = { x: this.vx / len, y: this.vy / len };
          this.dodgeTimer = DODGE_DURATION;
          this.dodgeCooldown = 500;
          gameState.stamina -= 20;
          this.staminaRegen = 1000;
        }
      }
    }

    // Clamp to map
    this.pos.x = Math.max(16, Math.min(MAP_W * TILE_SIZE - 16, this.pos.x));
    this.pos.y = Math.max(16, Math.min(MAP_H * TILE_SIZE - 16, this.pos.y));

    // Attack
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    if (me.input.isKeyPressed('attack') && this.attackTimer <= 0 && gameState.stamina >= 10) {
      this.attack();
    }
    if (this.attackTimer < ATTACK_COOLDOWN - 150) {
      this.isAttacking = false;
    }

    // Invincibility
    this.invincible = Math.max(0, this.invincible - dt);

    // Stamina regen
    if (this.staminaRegen > 0) {
      this.staminaRegen -= dt;
    } else {
      gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 20 * dtSec);
    }

    // Interact
    if (me.input.isKeyPressed('interact')) {
      this.interact();
    }

    // Potions
    if (me.input.isKeyPressed('potion1') && gameState.potions.health > 0) {
      gameState.potions.health--;
      gameState.hp = Math.min(gameState.maxHp, gameState.hp + 25);
    }
    if (me.input.isKeyPressed('potion2') && gameState.potions.stamina > 0) {
      gameState.potions.stamina--;
      gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 50);
    }

    // Collect loot
    for (let i = loot.length - 1; i >= 0; i--) {
      const l = loot[i];
      const dist = Math.sqrt((l.pos.x - this.pos.x) ** 2 + (l.pos.y - this.pos.y) ** 2);
      if (dist < 25) {
        if (l.type === 'gold') {
          gameState.gold += l.value;
        } else if (l.type === 'potion') {
          gameState.potions.health += l.value;
        }
        me.game.world.removeChild(l);
        loot.splice(i, 1);
      }
    }

    return true;
  }

  attack() {
    this.attackTimer = ATTACK_COOLDOWN;
    this.isAttacking = true;
    gameState.stamina -= 10;
    this.staminaRegen = 1000;

    const attackOffsets = {
      up: { x: 0, y: -30 },
      down: { x: 0, y: 30 },
      left: { x: -30, y: 0 },
      right: { x: 30, y: 0 }
    };
    const offset = attackOffsets[this.facing];
    const attackX = this.pos.x + offset.x;
    const attackY = this.pos.y + offset.y;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dist = Math.sqrt((attackX - e.pos.x) ** 2 + (attackY - e.pos.y) ** 2);
      if (dist < 35) {
        const damage = 8 * (1 + gameState.combatSkill * 0.05);
        e.takeDamage(damage);
        gameState.xp += 5;
      }
    }

    checkLevelUp();
  }

  interact() {
    const tx = Math.floor(this.pos.x / TILE_SIZE);
    const ty = Math.floor(this.pos.y / TILE_SIZE);

    const checkTiles = [[tx, ty - 1], [tx, ty + 1], [tx - 1, ty], [tx + 1, ty], [tx, ty]];

    for (const [cx, cy] of checkTiles) {
      if (cy >= 0 && cy < MAP_H && cx >= 0 && cx < MAP_W) {
        if (map[cy][cx] === DOOR) {
          if (currentMap === 'riverwood' && cy === MAP_H - 1) {
            generateMap('wilderness');
            player = new Player(10 * TILE_SIZE, 2 * TILE_SIZE);
            me.game.world.addChild(player, 5);
            createHUD();
          } else if (currentMap === 'wilderness' && cy === 0) {
            generateMap('riverwood');
            player = new Player(10 * TILE_SIZE, 12 * TILE_SIZE);
            me.game.world.addChild(player, 5);
            createHUD();
          } else if (currentMap === 'wilderness' && cy === MAP_H - 1) {
            generateMap('dungeon');
            player = new Player(3 * TILE_SIZE, 2 * TILE_SIZE);
            me.game.world.addChild(player, 5);
            createHUD();
          } else if (currentMap === 'dungeon' && cy === 0) {
            generateMap('wilderness');
            player = new Player(17 * TILE_SIZE, 12 * TILE_SIZE);
            me.game.world.addChild(player, 5);
            createHUD();
          }
          return;
        }

        if (map[cy][cx] === CHEST && enemies.length === 0) {
          gameState.gold += 100;
          gameState.xp += 50;
          if (gameState.questStage === 1) gameState.questStage = 2;
          map[cy][cx] = EMPTY;
          checkLevelUp();
          return;
        }
      }
    }

    // NPC interaction
    for (const npc of npcs) {
      const dist = Math.sqrt((npc.pos.x - this.pos.x) ** 2 + (npc.pos.y - this.pos.y) ** 2);
      if (dist < 50) {
        if (npc.hasQuest && gameState.questStage === 0) {
          gameState.questStage = 1;
          npc.hasQuest = false;
        } else if (npc.role === 'merchant' && gameState.gold >= 30) {
          gameState.gold -= 30;
          gameState.potions.health++;
        }
        return;
      }
    }
  }

  takeDamage(amount) {
    if (this.invincible > 0) return;
    gameState.hp -= amount;
    this.invincible = 500;
    if (gameState.hp <= 0) {
      gameState.hp = 0;
      gameState.isDead = true;
    }
  }

  draw(renderer) {
    renderer.save();
    renderer.translate(this.pos.x, this.pos.y);

    // Flash when invincible
    if (this.invincible > 0 && Math.floor(this.invincible / 50) % 2 === 0) {
      renderer.setGlobalAlpha(0.5);
    }

    // Body
    renderer.setColor('#5588bb');
    renderer.fillRect(-8, -12, 16, 24);

    // Head
    renderer.setColor('#ddaa88');
    renderer.fillRect(-6, -10, 12, 10);

    // Hair
    renderer.setColor('#4a3a2a');
    renderer.fillRect(-6, -12, 12, 4);

    // Attack indicator
    if (this.isAttacking) {
      const offsets = {
        up: { x: 0, y: -20 },
        down: { x: 0, y: 20 },
        left: { x: -20, y: 0 },
        right: { x: 20, y: 0 }
      };
      const off = offsets[this.facing];
      renderer.setColor('#cccccc');
      renderer.fillRect(off.x - 4, off.y - 4, 8, 8);
    }

    renderer.setGlobalAlpha(1);
    renderer.restore();
  }
}

function isWall(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return true;
  const tile = map[ty][tx];
  return tile === WALL || tile === TREE || tile === WATER;
}

function checkLevelUp() {
  while (gameState.xp >= gameState.xpToLevel) {
    gameState.xp -= gameState.xpToLevel;
    gameState.level++;
    gameState.maxHp += 10;
    gameState.hp = gameState.maxHp;
    gameState.maxStamina += 5;
    gameState.stamina = gameState.maxStamina;
    gameState.combatSkill = Math.min(10, gameState.combatSkill + 1);
    gameState.xpToLevel = 100 * gameState.level;
  }
}

// Enemy class
class Enemy extends me.Renderable {
  constructor(x, y, type) {
    super(x, y, 16, 24);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;
    this.type = type;

    if (type === 'wolf') {
      this.hp = 25;
      this.maxHp = 25;
      this.damage = 6;
      this.speed = 80;
      this.color = '#6a6a6a';
    } else if (type === 'bandit') {
      this.hp = 40;
      this.maxHp = 40;
      this.damage = 8;
      this.speed = 60;
      this.color = '#8a5a3a';
    } else { // draugr
      this.hp = 50;
      this.maxHp = 50;
      this.damage = 10;
      this.speed = 50;
      this.color = '#4a5a5a';
    }

    this.state = 'idle';
    this.attackTimer = 0;
    this.hitTimer = 0;
  }

  update(dt) {
    if (!player) return false;

    const dtSec = dt / 1000;
    const distToPlayer = Math.sqrt((this.pos.x - player.pos.x) ** 2 + (this.pos.y - player.pos.y) ** 2);

    // State transitions
    if (distToPlayer < 150) {
      this.state = 'chase';
    } else if (distToPlayer > 200) {
      this.state = 'idle';
    }

    // Movement
    if (this.state === 'chase') {
      const angle = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
      const nx = this.pos.x + Math.cos(angle) * this.speed * dtSec;
      const ny = this.pos.y + Math.sin(angle) * this.speed * dtSec;
      if (!isWall(nx, this.pos.y)) this.pos.x = nx;
      if (!isWall(this.pos.x, ny)) this.pos.y = ny;
    } else {
      if (Math.random() < 0.01) {
        const angle = Math.random() * Math.PI * 2;
        const nx = this.pos.x + Math.cos(angle) * this.speed * 0.5 * dtSec;
        const ny = this.pos.y + Math.sin(angle) * this.speed * 0.5 * dtSec;
        if (!isWall(nx, ny)) {
          this.pos.x = nx;
          this.pos.y = ny;
        }
      }
    }

    // Attack player
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    if (distToPlayer < 25 && this.attackTimer <= 0) {
      player.takeDamage(this.damage);
      this.attackTimer = 1000;
    }

    this.hitTimer = Math.max(0, this.hitTimer - dt);

    return true;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitTimer = 200;

    if (this.hp <= 0) {
      gameState.kills++;
      gameState.xp += this.maxHp;

      if (Math.random() > 0.5) {
        createLoot(this.pos.x, this.pos.y, 'gold', Math.floor(this.maxHp / 4));
      }

      const idx = enemies.indexOf(this);
      if (idx >= 0) enemies.splice(idx, 1);
      me.game.world.removeChild(this);
      checkLevelUp();
    }
  }

  draw(renderer) {
    renderer.save();
    renderer.translate(this.pos.x, this.pos.y);

    if (this.hitTimer > 0) {
      renderer.setColor('#ffffff');
    } else {
      renderer.setColor(this.color);
    }

    if (this.type === 'wolf') {
      renderer.fillEllipse(0, 0, 14, 8);
      renderer.fillEllipse(-10, -2, 4, 4);
    } else {
      renderer.fillRect(-8, -12, 16, 24);
      renderer.setColor(this.type === 'draugr' ? '#88bbcc' : '#ddaa88');
      renderer.fillRect(-4, -8, 8, 6);
    }

    // HP bar
    renderer.setColor('#333333');
    renderer.fillRect(-12, -18, 24, 4);
    renderer.setColor('#cc4444');
    renderer.fillRect(-12, -18, 24 * (this.hp / this.maxHp), 4);

    renderer.restore();
  }
}

function spawnEnemies(count, type = null) {
  for (let i = 0; i < count; i++) {
    let ex, ey, attempts = 0;
    do {
      ex = Math.floor(Math.random() * (MAP_W - 4)) + 2;
      ey = Math.floor(Math.random() * (MAP_H - 4)) + 2;
      attempts++;
    } while (map[ey][ex] !== EMPTY && attempts < 50);

    if (attempts < 50) {
      let enemyType = type;
      if (!enemyType) {
        enemyType = Math.random() > 0.4 ? 'wolf' : 'bandit';
      }

      const enemy = new Enemy(ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2, enemyType);
      enemies.push(enemy);
      me.game.world.addChild(enemy, 4);
    }
  }
}

// NPC class
class NPC extends me.Renderable {
  constructor(x, y, name, role) {
    super(x, y, 16, 24);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;
    this.name = name;
    this.role = role;
    this.hasQuest = role === 'blacksmith' && gameState.questStage === 0;
  }

  draw(renderer) {
    renderer.save();
    renderer.translate(this.pos.x, this.pos.y);

    // Body
    renderer.setColor(this.role === 'blacksmith' ? '#8a6a4a' : '#6a8a4a');
    renderer.fillRect(-8, -12, 16, 24);

    // Head
    renderer.setColor('#ddaa88');
    renderer.fillRect(-6, -10, 12, 10);

    // Quest marker
    if (this.hasQuest) {
      renderer.setColor('#ffcc00');
      renderer.fillRect(-4, -24, 8, 12);
    }

    renderer.restore();
  }
}

function createNPC(tx, ty, name, role) {
  const npc = new NPC(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, name, role);
  npcs.push(npc);
  me.game.world.addChild(npc, 3);
}

// Loot class
class Loot extends me.Renderable {
  constructor(x, y, type, value) {
    super(x, y, 12, 12);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;
    this.type = type;
    this.value = value;
  }

  draw(renderer) {
    renderer.save();
    renderer.translate(this.pos.x, this.pos.y);

    if (this.type === 'gold') {
      renderer.setColor('#ccaa44');
      renderer.fillEllipse(0, 0, 6, 6);
    } else {
      renderer.setColor('#cc4444');
      renderer.fillRect(-4, -6, 8, 12);
    }

    renderer.restore();
  }
}

function createLoot(x, y, type, value) {
  const item = new Loot(x, y, type, value);
  loot.push(item);
  me.game.world.addChild(item, 2);
}

// HUD class
class HUD extends me.Renderable {
  constructor() {
    super(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.alwaysUpdate = true;
    this.floating = true;

    // Create text objects
    this.hpText = new me.Text(170, 10, {
      font: '14px Arial',
      fillStyle: '#ffffff'
    });
    this.stText = new me.Text(170, 28, {
      font: '12px Arial',
      fillStyle: '#cccccc'
    });
    this.goldText = new me.Text(GAME_WIDTH - 100, 10, {
      font: '14px Arial',
      fillStyle: '#ffffff'
    });
    this.levelText = new me.Text(GAME_WIDTH - 100, 28, {
      font: '14px Arial',
      fillStyle: '#ffffff'
    });
    this.areaText = new me.Text(GAME_WIDTH / 2 - 40, 10, {
      font: '14px Arial',
      fillStyle: '#aaaaaa'
    });
    this.questText = new me.Text(10, GAME_HEIGHT - 25, {
      font: '12px Arial',
      fillStyle: '#ffcc44'
    });
    this.enemyText = new me.Text(GAME_WIDTH / 2 - 30, 28, {
      font: '12px Arial',
      fillStyle: '#ff8888'
    });
    this.controlsText = new me.Text(GAME_WIDTH / 2 - 150, GAME_HEIGHT - 12, {
      font: '10px Arial',
      fillStyle: '#666666'
    });
    this.potionText = new me.Text(10, 60, {
      font: '11px Arial',
      fillStyle: '#cccccc'
    });
    this.deathText = new me.Text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, {
      font: '48px Arial',
      fillStyle: '#cc4444',
      textAlign: 'center'
    });
    this.restartText = new me.Text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, {
      font: '18px Arial',
      fillStyle: '#888888',
      textAlign: 'center'
    });
  }

  draw(renderer) {
    // HP bar background
    renderer.setColor('#333333');
    renderer.fillRect(10, 10, 154, 18);
    // HP bar
    renderer.setColor('#cc4444');
    renderer.fillRect(12, 12, 150 * (gameState.hp / gameState.maxHp), 14);

    // Stamina bar background
    renderer.setColor('#333333');
    renderer.fillRect(10, 32, 154, 14);
    // Stamina bar
    renderer.setColor('#44cc44');
    renderer.fillRect(12, 34, 150 * (gameState.stamina / gameState.maxStamina), 10);

    // XP bar background
    renderer.setColor('#333333');
    renderer.fillRect(GAME_WIDTH - 110, 50, 104, 8);
    // XP bar
    renderer.setColor('#ccaa44');
    renderer.fillRect(GAME_WIDTH - 108, 51, 100 * (gameState.xp / gameState.xpToLevel), 6);

    // Text
    this.hpText.setText(`HP: ${Math.floor(gameState.hp)}/${gameState.maxHp}`);
    this.hpText.draw(renderer);

    this.stText.setText(`ST: ${Math.floor(gameState.stamina)}`);
    this.stText.draw(renderer);

    this.goldText.setText(`Gold: ${gameState.gold}`);
    this.goldText.draw(renderer);

    this.levelText.setText(`Level: ${gameState.level}`);
    this.levelText.draw(renderer);

    const areaNames = { riverwood: 'Riverwood', wilderness: 'Wilderness', dungeon: 'Bleak Falls Barrow' };
    this.areaText.setText(areaNames[currentMap]);
    this.areaText.draw(renderer);

    let questTextStr = '';
    if (gameState.questStage === 0) questTextStr = 'Talk to Alvor in Riverwood';
    else if (gameState.questStage === 1) questTextStr = 'Clear Bleak Falls Barrow';
    else if (gameState.questStage === 2) questTextStr = 'Quest Complete!';
    this.questText.setText(questTextStr);
    this.questText.draw(renderer);

    if (currentMap !== 'riverwood') {
      this.enemyText.setText(`Enemies: ${enemies.length}`);
      this.enemyText.draw(renderer);
    }

    this.controlsText.setText('WASD: Move | Space: Attack | Shift: Sprint | Z: Dodge | E: Interact');
    this.controlsText.draw(renderer);

    this.potionText.setText(`[1] HP Pot: ${gameState.potions.health}  [2] ST Pot: ${gameState.potions.stamina}`);
    this.potionText.draw(renderer);

    // Death screen
    if (gameState.isDead) {
      renderer.setColor('rgba(0, 0, 0, 0.8)');
      renderer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      this.deathText.setText('YOU DIED');
      this.deathText.draw(renderer);

      this.restartText.setText('Press R to restart');
      this.restartText.draw(renderer);

      if (me.input.isKeyPressed('r')) {
        resetGame();
      }
    }
  }
}

function createHUD() {
  me.game.world.addChild(new HUD(), 10);
}

function resetGame() {
  gameState.hp = 100;
  gameState.maxHp = 100;
  gameState.stamina = 100;
  gameState.maxStamina = 100;
  gameState.magicka = 50;
  gameState.maxMagicka = 50;
  gameState.gold = 50;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToLevel = 100;
  gameState.combatSkill = 1;
  gameState.isDead = false;
  gameState.questStage = 0;
  gameState.kills = 0;
  gameState.currentArea = 'riverwood';
  gameState.potions = { health: 3, stamina: 2 };

  generateMap('riverwood');
  createPlayer();
  createHUD();
}
