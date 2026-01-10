// Excalibur loaded from CDN - ex is global
console.log('Frostfall main module loading');

// Constants
const TILE = 32;
const PLAYER_SPEED = 80;
const SPRINT_SPEED = 140;

// Weapon data
const WEAPONS = {
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', damage: 8, type: 'melee', range: 24 },
  steel_sword: { id: 'steel_sword', name: 'Steel Sword', damage: 12, type: 'melee', range: 24 },
  hunting_bow: { id: 'hunting_bow', name: 'Hunting Bow', damage: 10, type: 'ranged', range: 200 },
  dagger: { id: 'dagger', name: 'Dagger', damage: 5, type: 'melee', range: 16 }
};

// Enemy types
const ENEMY_TYPES = {
  bandit: { hp: 40, damage: 8, speed: 60, color: '#884400', xp: 50 },
  bandit_archer: { hp: 30, damage: 10, speed: 50, color: '#886644', xp: 40 },
  wolf: { hp: 25, damage: 6, speed: 100, color: '#666666', xp: 30 },
  draugr: { hp: 50, damage: 10, speed: 40, color: '#336666', xp: 60 }
};

// Zone data
const ZONES = {
  riverwood: { width: 20, height: 15, enemies: [], npcs: ['blacksmith', 'trader'] },
  forest: { width: 30, height: 20, enemies: ['wolf', 'wolf', 'wolf'], npcs: [] },
  mine: { width: 25, height: 20, enemies: ['bandit', 'bandit', 'bandit', 'bandit_archer'], npcs: [] }
};

// Create engine
const game = new ex.Engine({
  width: 1280,
  height: 720,
  backgroundColor: ex.Color.fromHex('#2a3a1a'),
  displayMode: ex.DisplayMode.Fixed
});

// Player class
class Player extends ex.Actor {
  constructor(x, y) {
    super({
      pos: ex.vec(x, y),
      width: 24,
      height: 32,
      color: ex.Color.fromHex('#4488ff'),
      collisionType: ex.CollisionType.Active
    });
    this.speed = PLAYER_SPEED;
    this.sprinting = false;
    this.attackCooldown = false;
  }
}

// Enemy class
class Enemy extends ex.Actor {
  constructor(x, y, type) {
    const data = ENEMY_TYPES[type];
    super({
      pos: ex.vec(x, y),
      width: 28,
      height: 28,
      color: ex.Color.fromHex(data.color),
      collisionType: ex.CollisionType.Active
    });
    this.enemyType = type;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.damage = data.damage;
    this.speed = data.speed;
    this.xpValue = data.xp;
    this.attackCooldown = false;
  }
}

// NPC class
class NPC extends ex.Actor {
  constructor(x, y, npcType) {
    super({
      pos: ex.vec(x, y),
      width: 24,
      height: 32,
      color: ex.Color.fromHex('#ffaa44'),
      collisionType: ex.CollisionType.Fixed
    });
    this.npcType = npcType;
  }
}

// Wall class
class Wall extends ex.Actor {
  constructor(x, y, w = TILE, h = TILE) {
    super({
      pos: ex.vec(x, y),
      width: w,
      height: h,
      color: ex.Color.fromHex('#555555'),
      collisionType: ex.CollisionType.Fixed
    });
  }
}

// Item pickup class
class ItemPickup extends ex.Actor {
  constructor(x, y, itemData) {
    super({
      pos: ex.vec(x, y),
      width: 16,
      height: 16,
      color: ex.Color.fromHex('#ffff00'),
      collisionType: ex.CollisionType.Passive
    });
    this.itemData = itemData;
  }
}

// Menu Scene
class MenuScene extends ex.Scene {
  onInitialize(engine) {
    const bg = new ex.Actor({
      pos: ex.vec(640, 360),
      width: 1280,
      height: 720,
      color: ex.Color.fromHex('#1a1a2e')
    });
    this.add(bg);

    const title = new ex.Label({
      text: 'FROSTFALL',
      pos: ex.vec(640, 150),
      font: new ex.Font({ size: 72, color: ex.Color.fromHex('#88ccff'), family: 'Arial' }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(title);

    const subtitle = new ex.Label({
      text: 'A 2D Skyrim Demake',
      pos: ex.vec(640, 220),
      font: new ex.Font({ size: 24, color: ex.Color.White }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(subtitle);

    const startBtn = new ex.Actor({
      pos: ex.vec(640, 400),
      width: 200,
      height: 50,
      color: ex.Color.fromHex('#444444')
    });
    startBtn.enableCapturePointer = true;
    startBtn.on('pointerup', () => {
      window.startGame();
      engine.goToScene('game');
    });
    this.add(startBtn);

    const startText = new ex.Label({
      text: 'New Game',
      pos: ex.vec(640, 400),
      font: new ex.Font({ size: 24, color: ex.Color.White }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(startText);

    const controls = new ex.Label({
      text: 'WASD: Move | Shift: Sprint | Left Click: Attack | E: Interact',
      pos: ex.vec(640, 550),
      font: new ex.Font({ size: 16, color: ex.Color.fromHex('#888888') }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(controls);
  }

  onActivate() {
    window.gameState.scene = 'menu';
  }
}

// Game Scene
class GameScene extends ex.Scene {
  constructor() {
    super();
    this.player = null;
    this.enemies = [];
    this.npcs = [];
    this.walls = [];
    this.items = [];
    this.hudLabels = {};
  }

  onInitialize(engine) {
    this.generateZone('riverwood', engine);
    this.createHUD();
  }

  onActivate() {
    window.gameState.scene = 'game';
    this.generateZone(window.gameState.currentZone || 'riverwood', this.engine);
  }

  generateZone(zoneName, engine) {
    // Clear existing
    this.enemies.forEach(e => e.kill());
    this.npcs.forEach(n => n.kill());
    this.walls.forEach(w => w.kill());
    this.items.forEach(i => i.kill());
    if (this.player) this.player.kill();
    this.enemies = [];
    this.npcs = [];
    this.walls = [];
    this.items = [];

    const zone = ZONES[zoneName];
    const width = zone.width * TILE;
    const height = zone.height * TILE;

    // Floor
    const floor = new ex.Actor({
      pos: ex.vec(width / 2, height / 2),
      width,
      height,
      color: ex.Color.fromHex(zoneName === 'mine' ? '#333333' : '#3a4a2a'),
      z: -10
    });
    this.add(floor);
    this.walls.push(floor);

    // Border walls
    for (let x = 0; x < zone.width; x++) {
      this.addWall(x * TILE + TILE / 2, TILE / 2);
      this.addWall(x * TILE + TILE / 2, height - TILE / 2);
    }
    for (let y = 1; y < zone.height - 1; y++) {
      this.addWall(TILE / 2, y * TILE + TILE / 2);
      this.addWall(width - TILE / 2, y * TILE + TILE / 2);
    }

    // Zone exit indicators
    if (zoneName === 'riverwood') {
      // Exit to forest
      const exitLabel = new ex.Label({
        text: '[E] Forest',
        pos: ex.vec(width - TILE, height / 2),
        font: new ex.Font({ size: 12, color: ex.Color.Yellow }),
        anchor: ex.vec(0.5, 0.5)
      });
      this.add(exitLabel);
    }

    // Spawn enemies
    zone.enemies.forEach((type, i) => {
      const x = TILE * 4 + Math.random() * (width - TILE * 8);
      const y = TILE * 4 + Math.random() * (height - TILE * 8);
      const enemy = new Enemy(x, y, type);
      this.add(enemy);
      this.enemies.push(enemy);
    });

    // Spawn NPCs in safe zones
    if (zoneName === 'riverwood') {
      const blacksmith = new NPC(200, 200, 'blacksmith');
      this.add(blacksmith);
      this.npcs.push(blacksmith);

      const trader = new NPC(350, 200, 'trader');
      this.add(trader);
      this.npcs.push(trader);
    }

    // Spawn loot in dungeons
    if (zoneName === 'mine') {
      const chest = new ItemPickup(width / 2, height / 2, {
        gold: 50,
        items: [{ id: 'steel_sword', name: 'Steel Sword', damage: 12, type: 'melee' }]
      });
      chest.color = ex.Color.fromHex('#aa8844');
      chest.width = 24;
      chest.height = 20;
      this.add(chest);
      this.items.push(chest);
    }

    // Create player
    this.player = new Player(width / 2, height / 2);
    this.add(this.player);

    // Camera
    if (engine && engine.currentScene) {
      engine.currentScene.camera.strategy.lockToActor(this.player);
    }

    window.gameState.currentZone = zoneName;
  }

  addWall(x, y) {
    const wall = new Wall(x, y);
    this.add(wall);
    this.walls.push(wall);
  }

  createHUD() {
    const hudZ = 100;

    // Background
    this.hudLabels.bg = new ex.Actor({
      pos: ex.vec(150, 60),
      width: 280,
      height: 110,
      color: ex.Color.fromRGB(0, 0, 0, 0.6),
      z: hudZ - 1
    });
    this.add(this.hudLabels.bg);

    // Health
    this.hudLabels.health = new ex.Label({
      text: 'Health: 100/100',
      pos: ex.vec(20, 20),
      font: new ex.Font({ size: 14, color: ex.Color.fromHex('#ff4444') }),
      z: hudZ
    });
    this.add(this.hudLabels.health);

    // Magicka
    this.hudLabels.magicka = new ex.Label({
      text: 'Magicka: 50/50',
      pos: ex.vec(20, 40),
      font: new ex.Font({ size: 14, color: ex.Color.fromHex('#4488ff') }),
      z: hudZ
    });
    this.add(this.hudLabels.magicka);

    // Stamina
    this.hudLabels.stamina = new ex.Label({
      text: 'Stamina: 100/100',
      pos: ex.vec(20, 60),
      font: new ex.Font({ size: 14, color: ex.Color.fromHex('#44ff44') }),
      z: hudZ
    });
    this.add(this.hudLabels.stamina);

    // Level and XP
    this.hudLabels.level = new ex.Label({
      text: 'Level: 1 | Combat: 1 | Gold: 50',
      pos: ex.vec(20, 85),
      font: new ex.Font({ size: 12, color: ex.Color.Yellow }),
      z: hudZ
    });
    this.add(this.hudLabels.level);

    // Zone
    this.hudLabels.zone = new ex.Label({
      text: 'Zone: Riverwood',
      pos: ex.vec(20, 105),
      font: new ex.Font({ size: 12, color: ex.Color.White }),
      z: hudZ
    });
    this.add(this.hudLabels.zone);
  }

  updateHUD() {
    const state = window.gameState;
    if (!this.hudLabels.health) return;

    this.hudLabels.health.text = `Health: ${Math.floor(state.health)}/${state.maxHealth}`;
    this.hudLabels.magicka.text = `Magicka: ${Math.floor(state.magicka)}/${state.maxMagicka}`;
    this.hudLabels.stamina.text = `Stamina: ${Math.floor(state.stamina)}/${state.maxStamina}`;
    this.hudLabels.level.text = `Level: ${state.level} | Combat: ${state.skills.combat} | Gold: ${state.gold}`;
    this.hudLabels.zone.text = `Zone: ${state.currentZone.charAt(0).toUpperCase() + state.currentZone.slice(1)}`;

    // Update HUD position relative to camera
    const cam = this.camera.pos;
    this.hudLabels.bg.pos = ex.vec(cam.x - 490, cam.y - 300);
    this.hudLabels.health.pos = ex.vec(cam.x - 620, cam.y - 340);
    this.hudLabels.magicka.pos = ex.vec(cam.x - 620, cam.y - 320);
    this.hudLabels.stamina.pos = ex.vec(cam.x - 620, cam.y - 300);
    this.hudLabels.level.pos = ex.vec(cam.x - 620, cam.y - 275);
    this.hudLabels.zone.pos = ex.vec(cam.x - 620, cam.y - 255);
  }

  onPreUpdate(engine, delta) {
    if (!this.player) return;

    const state = window.gameState;
    const keyboard = engine.input.keyboard;

    // Sprint check
    this.player.sprinting = keyboard.isHeld(ex.Keys.ShiftLeft) && state.stamina > 0;

    // Movement
    const speed = this.player.sprinting ? SPRINT_SPEED : PLAYER_SPEED;
    let velX = 0;
    let velY = 0;

    if (keyboard.isHeld(ex.Keys.A)) velX = -speed;
    if (keyboard.isHeld(ex.Keys.D)) velX = speed;
    if (keyboard.isHeld(ex.Keys.W)) velY = -speed;
    if (keyboard.isHeld(ex.Keys.S)) velY = speed;

    this.player.vel = ex.vec(velX, velY);

    // Stamina drain from sprinting
    if (this.player.sprinting && (velX !== 0 || velY !== 0)) {
      state.stamina -= 5 * (delta / 1000);
      if (state.stamina < 0) state.stamina = 0;
    }

    // Attack
    if (engine.input.pointers.primary.wasPressed && !this.player.attackCooldown) {
      this.performAttack(engine);
    }

    // Interact
    if (keyboard.wasPressed(ex.Keys.E)) {
      this.interact(engine);
    }

    // Enemy AI
    this.enemies.forEach(enemy => {
      if (enemy.isKilled()) return;
      const dist = this.player.pos.distance(enemy.pos);

      if (dist < 200 && dist > 30) {
        const dir = this.player.pos.sub(enemy.pos).normalize();
        enemy.vel = dir.scale(enemy.speed);
      } else if (dist <= 30 && !enemy.attackCooldown) {
        enemy.vel = ex.vec(0, 0);
        // Enemy attacks
        state.health -= enemy.damage;
        enemy.attackCooldown = true;
        setTimeout(() => {
          if (!enemy.isKilled()) enemy.attackCooldown = false;
        }, 1000);

        if (state.health <= 0) {
          state.health = 0;
          engine.goToScene('gameover');
        }
      } else {
        enemy.vel = ex.vec(0, 0);
      }
    });

    // Item collection
    this.items.forEach(item => {
      if (item.isKilled()) return;
      const dist = this.player.pos.distance(item.pos);
      if (dist < 30) {
        this.collectItem(item);
      }
    });

    this.updateHUD();
  }

  performAttack(engine) {
    const state = window.gameState;
    if (state.stamina < 10) return;

    this.player.attackCooldown = true;
    this.player.color = ex.Color.White;

    const damage = window.attack();
    const attackRange = 50;

    this.enemies.forEach(enemy => {
      if (enemy.isKilled()) return;
      const dist = this.player.pos.distance(enemy.pos);
      if (dist < attackRange) {
        enemy.hp -= damage;
        enemy.color = ex.Color.White;

        setTimeout(() => {
          if (!enemy.isKilled()) {
            const data = ENEMY_TYPES[enemy.enemyType];
            enemy.color = ex.Color.fromHex(data.color);
          }
        }, 100);

        if (enemy.hp <= 0) {
          window.killEnemy(enemy.xpValue);
          state.gold += Math.floor(Math.random() * 15) + 5;
          enemy.kill();
        }
      }
    });

    setTimeout(() => {
      if (this.player) {
        this.player.attackCooldown = false;
        this.player.color = ex.Color.fromHex('#4488ff');
      }
    }, 300);
  }

  interact(engine) {
    const state = window.gameState;
    const zone = ZONES[state.currentZone];
    const width = zone.width * TILE;

    // Check zone transitions
    if (state.currentZone === 'riverwood') {
      if (this.player.pos.x > width - TILE * 2) {
        this.generateZone('forest', engine);
      }
    } else if (state.currentZone === 'forest') {
      if (this.player.pos.x < TILE * 2) {
        this.generateZone('riverwood', engine);
      }
      if (this.player.pos.x > zone.width * TILE - TILE * 2) {
        this.generateZone('mine', engine);
      }
    } else if (state.currentZone === 'mine') {
      if (this.player.pos.x < TILE * 2) {
        this.generateZone('forest', engine);
      }
      // Victory condition - clear the mine
      if (this.enemies.filter(e => !e.isKilled()).length === 0) {
        if (!state.questsCompleted.includes('clear_mine')) {
          state.questsCompleted.push('clear_mine');
          state.gold += 75;
          console.log('Quest complete: Clear the Mine!');
          // Check for final victory
          if (state.level >= 2 || state.enemiesKilled >= 5) {
            engine.goToScene('victory');
          }
        }
      }
    }

    // NPC interaction
    this.npcs.forEach(npc => {
      const dist = this.player.pos.distance(npc.pos);
      if (dist < 40) {
        if (npc.npcType === 'blacksmith') {
          // Buy steel sword
          if (state.gold >= 120 && !state.inventory.find(i => i.id === 'steel_sword')) {
            state.gold -= 120;
            window.equipWeapon(WEAPONS.steel_sword);
            console.log('Bought Steel Sword!');
          }
        } else if (npc.npcType === 'trader') {
          // Buy health potion
          if (state.gold >= 40) {
            state.gold -= 40;
            window.addItem({ id: 'health_potion', name: 'Health Potion', type: 'consumable', effect: { health: 50 } });
            console.log('Bought Health Potion!');
          }
        }
      }
    });
  }

  collectItem(item) {
    const state = window.gameState;
    const data = item.itemData;

    if (data.gold) {
      state.gold += data.gold;
    }
    if (data.items) {
      data.items.forEach(itemData => {
        if (itemData.damage) {
          // It's a weapon
          window.equipWeapon(itemData);
        } else {
          window.addItem(itemData);
        }
      });
    }

    item.kill();
    this.items = this.items.filter(i => !i.isKilled());
  }
}

// Game Over Scene
class GameOverScene extends ex.Scene {
  onActivate() {
    window.gameState.scene = 'defeat';

    this.actors.forEach(a => a.kill());

    const bg = new ex.Actor({
      pos: ex.vec(640, 360),
      width: 1280,
      height: 720,
      color: ex.Color.fromHex('#1a0000')
    });
    this.add(bg);

    const title = new ex.Label({
      text: 'YOU DIED',
      pos: ex.vec(640, 300),
      font: new ex.Font({ size: 72, color: ex.Color.Red }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(title);

    const stats = new ex.Label({
      text: `Level: ${window.gameState.level} | Enemies Killed: ${window.gameState.enemiesKilled}`,
      pos: ex.vec(640, 400),
      font: new ex.Font({ size: 20, color: ex.Color.White }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(stats);
  }
}

// Victory Scene
class VictoryScene extends ex.Scene {
  onActivate() {
    window.gameState.scene = 'victory';

    this.actors.forEach(a => a.kill());

    const bg = new ex.Actor({
      pos: ex.vec(640, 360),
      width: 1280,
      height: 720,
      color: ex.Color.fromHex('#001122')
    });
    this.add(bg);

    const title = new ex.Label({
      text: 'DRAGONBORN',
      pos: ex.vec(640, 200),
      font: new ex.Font({ size: 72, color: ex.Color.fromHex('#88ccff') }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(title);

    const desc = new ex.Label({
      text: 'You have proven yourself worthy.\nThe prophecy speaks of your arrival...',
      pos: ex.vec(640, 300),
      font: new ex.Font({ size: 20, color: ex.Color.White }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(desc);

    const stats = new ex.Label({
      text: `Level: ${window.gameState.level} | Gold: ${window.gameState.gold} | Enemies: ${window.gameState.enemiesKilled}`,
      pos: ex.vec(640, 400),
      font: new ex.Font({ size: 18, color: ex.Color.Yellow }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(stats);

    const skills = new ex.Label({
      text: `Skills - Combat: ${window.gameState.skills.combat} | Magic: ${window.gameState.skills.magic} | Stealth: ${window.gameState.skills.stealth}`,
      pos: ex.vec(640, 440),
      font: new ex.Font({ size: 16, color: ex.Color.White }),
      anchor: ex.vec(0.5, 0.5)
    });
    this.add(skills);
  }
}

// Add scenes
game.addScene('menu', new MenuScene());
game.addScene('game', new GameScene());
game.addScene('gameover', new GameOverScene());
game.addScene('victory', new VictoryScene());

console.log('Scenes added');

// Start game
game.start().then(() => {
  game.goToScene('menu');
  console.log('Frostfall initialized');
}).catch(err => {
  console.error('Game start error:', err);
});

console.log('Frostfall main module complete');
