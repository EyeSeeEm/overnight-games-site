import kaplay from "kaplay";

// Initialize Kaplay with Canvas2D fallback for testing
const k = kaplay({
  width: 640,
  height: 360,
  scale: 2,
  background: [30, 30, 50],
  crisp: true,
  canvas: document.querySelector("canvas") || undefined,
  pixelDensity: 1,
});

// Expose game state for testing immediately
window.gameState = { started: false, health: 100, player: null };

// Game constants
const TILE_SIZE = 16;
const PLAYER_SPEED = 80;
const SPRINT_SPEED = 140;

// Player stats
const playerStats = {
  level: 1,
  hp: 100,
  maxHp: 100,
  magicka: 50,
  maxMagicka: 50,
  stamina: 100,
  maxStamina: 100,
  gold: 50,
  xp: { combat: 0, magic: 0, stealth: 0 },
  skills: { combat: 1, magic: 1, stealth: 1 },
  inventory: [],
  equipment: { weapon: 'iron_sword', armor: 'leather' },
  quests: { active: [], completed: [] }
};

// Weapon data
const weapons = {
  iron_sword: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 24, type: 'melee' },
  steel_sword: { name: 'Steel Sword', damage: 12, speed: 0.3, range: 24, type: 'melee' },
  dagger: { name: 'Dagger', damage: 5, speed: 0.2, range: 16, type: 'melee', sneakBonus: 2 },
  hunting_bow: { name: 'Hunting Bow', damage: 10, speed: 0.8, range: 200, type: 'ranged' },
  fire_staff: { name: 'Fire Staff', damage: 8, cost: 10, range: 150, type: 'magic' }
};

// Enemy definitions
const enemies = {
  bandit: { hp: 40, damage: 8, speed: 50, color: [180, 80, 80], xp: 20, gold: [5, 15], size: 14 },
  wolf: { hp: 25, damage: 6, speed: 70, color: [100, 100, 100], xp: 10, gold: [0, 0], size: 12 },
  draugr: { hp: 50, damage: 10, speed: 40, color: [100, 150, 130], xp: 30, gold: [5, 20], size: 14 },
  bandit_chief: { hp: 80, damage: 15, speed: 45, color: [200, 50, 50], xp: 50, gold: [25, 50], size: 18, boss: true },
  draugr_deathlord: { hp: 150, damage: 25, speed: 35, color: [60, 120, 100], xp: 100, gold: [50, 100], size: 22, boss: true }
};

// Zone definitions
const zones = {
  riverwood: {
    name: 'Riverwood',
    width: 40, height: 25,
    safe: true,
    npcs: [
      { id: 'alvor', name: 'Alvor', x: 8, y: 10, type: 'blacksmith', dialogue: "Need some iron equipment? I can help." },
      { id: 'lucan', name: 'Lucan', x: 25, y: 8, type: 'merchant', dialogue: "Welcome to the Riverwood Trader!" }
    ],
    exits: [
      { x: 38, y: 12, width: 2, height: 6, to: 'forest', toX: 2, toY: 12 },
      { x: 20, y: 0, width: 6, height: 2, to: 'whiterun_road', toX: 20, toY: 23 }
    ],
    color: [60, 120, 60]
  },
  forest: {
    name: 'Riverwood Forest',
    width: 50, height: 30,
    safe: false,
    enemies: [
      { type: 'wolf', x: 15, y: 10 },
      { type: 'wolf', x: 18, y: 12 },
      { type: 'wolf', x: 30, y: 20 },
      { type: 'wolf', x: 35, y: 8 }
    ],
    exits: [
      { x: 0, y: 10, width: 2, height: 6, to: 'riverwood', toX: 36, toY: 12 },
      { x: 48, y: 15, width: 2, height: 6, to: 'embershard', toX: 2, toY: 10 }
    ],
    color: [40, 80, 40]
  },
  embershard: {
    name: 'Embershard Mine',
    width: 35, height: 25,
    safe: false,
    enemies: [
      { type: 'bandit', x: 10, y: 8 },
      { type: 'bandit', x: 15, y: 15 },
      { type: 'bandit', x: 25, y: 10 },
      { type: 'bandit_chief', x: 28, y: 20 }
    ],
    chests: [
      { x: 30, y: 22, gold: 50, items: ['health_potion'] }
    ],
    exits: [
      { x: 0, y: 8, width: 2, height: 6, to: 'forest', toX: 46, toY: 15 }
    ],
    color: [50, 40, 40]
  },
  whiterun_road: {
    name: 'Road to Whiterun',
    width: 45, height: 25,
    safe: false,
    enemies: [
      { type: 'bandit', x: 20, y: 10 },
      { type: 'wolf', x: 35, y: 18 }
    ],
    exits: [
      { x: 20, y: 23, width: 6, height: 2, to: 'riverwood', toX: 20, toY: 2 },
      { x: 43, y: 10, width: 2, height: 6, to: 'whiterun', toX: 2, toY: 12 }
    ],
    color: [80, 80, 50]
  },
  whiterun: {
    name: 'Whiterun',
    width: 50, height: 35,
    safe: true,
    npcs: [
      { id: 'jarl', name: 'Jarl Balgruuf', x: 25, y: 8, type: 'quest', dialogue: "You! You're the one who escaped Helgen? Speak with my court wizard." },
      { id: 'farengar', name: 'Farengar', x: 30, y: 10, type: 'wizard', dialogue: "I need the Dragonstone from Bleak Falls Barrow." }
    ],
    exits: [
      { x: 0, y: 10, width: 2, height: 6, to: 'whiterun_road', toX: 41, toY: 10 },
      { x: 48, y: 20, width: 2, height: 6, to: 'bleak_falls', toX: 2, toY: 10 }
    ],
    color: [100, 90, 70]
  },
  bleak_falls: {
    name: 'Bleak Falls Barrow',
    width: 40, height: 30,
    safe: false,
    enemies: [
      { type: 'draugr', x: 12, y: 10 },
      { type: 'draugr', x: 18, y: 18 },
      { type: 'draugr', x: 25, y: 12 },
      { type: 'draugr', x: 30, y: 20 },
      { type: 'draugr_deathlord', x: 35, y: 25 }
    ],
    chests: [
      { x: 36, y: 27, gold: 100, items: ['dragonstone', 'health_potion', 'health_potion'] }
    ],
    exits: [
      { x: 0, y: 8, width: 2, height: 6, to: 'whiterun', toX: 46, toY: 20 }
    ],
    color: [40, 50, 60]
  }
};

// Items
const items = {
  health_potion: { name: 'Health Potion', type: 'consumable', effect: 'heal', amount: 50, value: 30 },
  magicka_potion: { name: 'Magicka Potion', type: 'consumable', effect: 'magicka', amount: 30, value: 25 },
  dragonstone: { name: 'Dragonstone', type: 'quest', value: 0 }
};

// Quest definitions
const quests = {
  main_1: { id: 'main_1', name: 'Bleak Falls Barrow', desc: 'Retrieve the Dragonstone', objective: 'dragonstone', reward: 200 }
};

// Game state
let currentZone = 'riverwood';
let player;
let enemyObjects = [];
let npcObjects = [];
let chestObjects = [];
let attackCooldown = 0;
let gameStarted = false;
let dialogueOpen = false;
let currentDialogue = null;
let inventoryOpen = false;
let gameTime = 0;

// Game state is exposed at top of file for testing

// Title Scene
k.scene("title", () => {
  k.add([
    k.text("FROSTFALL", { size: 32 }),
    k.pos(k.width() / 2, k.height() / 2 - 60),
    k.anchor("center"),
    k.color(200, 200, 255)
  ]);

  k.add([
    k.text("A 2D Skyrim Demake", { size: 16 }),
    k.pos(k.width() / 2, k.height() / 2 - 20),
    k.anchor("center"),
    k.color(150, 150, 180)
  ]);

  k.add([
    k.text("WASD: Move | Shift: Sprint | Space: Attack", { size: 10 }),
    k.pos(k.width() / 2, k.height() / 2 + 20),
    k.anchor("center"),
    k.color(120, 120, 150)
  ]);

  k.add([
    k.text("E: Interact | I: Inventory | Q: Use Potion", { size: 10 }),
    k.pos(k.width() / 2, k.height() / 2 + 40),
    k.anchor("center"),
    k.color(120, 120, 150)
  ]);

  const startText = k.add([
    k.text("Press SPACE to Start", { size: 14 }),
    k.pos(k.width() / 2, k.height() / 2 + 80),
    k.anchor("center"),
    k.color(255, 255, 100)
  ]);

  // Pulse effect
  let time = 0;
  startText.onUpdate(() => {
    time += k.dt();
    startText.opacity = 0.5 + 0.5 * Math.sin(time * 3);
  });

  k.onKeyPress("space", () => {
    k.go("game");
  });
});

// Game Scene
k.scene("game", () => {
  gameStarted = true;
  window.gameState.started = true;

  loadZone(currentZone);

  // Player
  player = k.add([
    k.rect(14, 20),
    k.pos(zones[currentZone].width * TILE_SIZE / 2, zones[currentZone].height * TILE_SIZE / 2),
    k.anchor("center"),
    k.color(100, 150, 220),
    k.area(),
    k.body(),
    "player",
    {
      dir: k.vec2(0, 1),
      attacking: false,
      attackAnim: 0
    }
  ]);

  // Camera follow
  player.onUpdate(() => {
    k.camPos(player.pos);
    window.gameState.player = { x: player.pos.x, y: player.pos.y };
    window.gameState.health = playerStats.hp;
  });

  // Movement
  k.onUpdate(() => {
    if (dialogueOpen || inventoryOpen || playerStats.hp <= 0) return;

    gameTime += k.dt();

    // Regenerate stamina
    if (!k.isKeyDown("shift")) {
      playerStats.stamina = Math.min(playerStats.maxStamina, playerStats.stamina + 10 * k.dt());
    }

    // Regenerate magicka (out of combat)
    playerStats.magicka = Math.min(playerStats.maxMagicka, playerStats.magicka + 3 * k.dt());

    let moveDir = k.vec2(0, 0);
    if (k.isKeyDown("w") || k.isKeyDown("up")) moveDir.y -= 1;
    if (k.isKeyDown("s") || k.isKeyDown("down")) moveDir.y += 1;
    if (k.isKeyDown("a") || k.isKeyDown("left")) moveDir.x -= 1;
    if (k.isKeyDown("d") || k.isKeyDown("right")) moveDir.x += 1;

    if (moveDir.len() > 0) {
      moveDir = moveDir.unit();
      player.dir = moveDir;

      let speed = PLAYER_SPEED;
      if (k.isKeyDown("shift") && playerStats.stamina > 0) {
        speed = SPRINT_SPEED;
        playerStats.stamina -= 5 * k.dt();
      }

      const newPos = player.pos.add(moveDir.scale(speed * k.dt()));
      const zone = zones[currentZone];

      // Boundary check
      if (newPos.x > 10 && newPos.x < zone.width * TILE_SIZE - 10 &&
          newPos.y > 10 && newPos.y < zone.height * TILE_SIZE - 10) {
        player.pos = newPos;
      }
    }

    // Attack cooldown
    if (attackCooldown > 0) {
      attackCooldown -= k.dt();
    }

    // Check zone exits
    checkZoneExits();
  });

  // Attack
  k.onKeyPress("space", () => {
    if (dialogueOpen || inventoryOpen || playerStats.hp <= 0) return;
    if (attackCooldown > 0) return;

    const weapon = weapons[playerStats.equipment.weapon];
    attackCooldown = weapon.speed;
    playerStats.stamina = Math.max(0, playerStats.stamina - 10);

    // Create attack hitbox
    const attackPos = player.pos.add(player.dir.scale(weapon.range / 2 + 10));
    const attack = k.add([
      k.rect(weapon.range, weapon.range),
      k.pos(attackPos),
      k.anchor("center"),
      k.color(255, 200, 100),
      k.opacity(0.5),
      k.area(),
      k.lifespan(0.1),
      "player_attack"
    ]);

    // Check enemy hits
    for (const enemy of enemyObjects) {
      if (enemy.exists() && enemy.hp > 0) {
        const dist = player.pos.dist(enemy.pos);
        if (dist < weapon.range + enemy.size) {
          // Calculate damage
          const skillMult = 1 + playerStats.skills.combat * 0.05;
          const damage = Math.floor(weapon.damage * skillMult);
          enemy.hp -= damage;

          // Show damage number
          showDamage(enemy.pos, damage);

          // XP gain
          playerStats.xp.combat += 5;
          checkLevelUp();

          if (enemy.hp <= 0) {
            killEnemy(enemy);
          } else {
            // Knockback
            const knockDir = enemy.pos.sub(player.pos).unit();
            enemy.pos = enemy.pos.add(knockDir.scale(20));
          }
        }
      }
    }
  });

  // Interact
  k.onKeyPress("e", () => {
    if (inventoryOpen || playerStats.hp <= 0) return;

    if (dialogueOpen) {
      dialogueOpen = false;
      currentDialogue = null;
      return;
    }

    // Check NPCs
    for (const npc of npcObjects) {
      if (npc.exists() && player.pos.dist(npc.pos) < 30) {
        dialogueOpen = true;
        currentDialogue = npc.npcData;

        // Handle shops
        if (npc.npcData.type === 'blacksmith' || npc.npcData.type === 'merchant') {
          // Simple shop - give player weapon upgrade for gold
          if (playerStats.gold >= 50 && playerStats.equipment.weapon === 'iron_sword') {
            playerStats.gold -= 50;
            playerStats.equipment.weapon = 'steel_sword';
            showText(player.pos, "Bought Steel Sword!");
          }
        } else if (npc.npcData.type === 'quest' || npc.npcData.type === 'wizard') {
          // Add quest
          if (!playerStats.quests.active.includes('main_1') && !playerStats.quests.completed.includes('main_1')) {
            playerStats.quests.active.push('main_1');
            showText(player.pos, "Quest Started: Bleak Falls Barrow");
          }
        }
        return;
      }
    }

    // Check chests
    for (const chest of chestObjects) {
      if (chest.exists() && !chest.opened && player.pos.dist(chest.pos) < 30) {
        chest.opened = true;
        chest.color = k.rgb(80, 60, 40);
        playerStats.gold += chest.chestData.gold;
        showText(chest.pos, `+${chest.chestData.gold} Gold`);

        for (const itemId of chest.chestData.items) {
          playerStats.inventory.push(itemId);
          showText(chest.pos.add(k.vec2(0, 20)), `Got ${items[itemId].name}`);

          // Check quest completion
          if (itemId === 'dragonstone' && playerStats.quests.active.includes('main_1')) {
            playerStats.quests.active = playerStats.quests.active.filter(q => q !== 'main_1');
            playerStats.quests.completed.push('main_1');
            playerStats.gold += quests.main_1.reward;
            showText(player.pos, "Quest Complete! +200 Gold");
          }
        }
        return;
      }
    }
  });

  // Use potion
  k.onKeyPress("q", () => {
    if (dialogueOpen || inventoryOpen) return;

    const potionIdx = playerStats.inventory.findIndex(i => i === 'health_potion');
    if (potionIdx >= 0 && playerStats.hp < playerStats.maxHp) {
      playerStats.inventory.splice(potionIdx, 1);
      playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 50);
      showText(player.pos, "+50 HP");
    }
  });

  // Inventory toggle
  k.onKeyPress("i", () => {
    if (dialogueOpen) return;
    inventoryOpen = !inventoryOpen;
  });

  // Enemy AI
  k.onUpdate("enemy", (enemy) => {
    if (enemy.hp <= 0 || dialogueOpen || playerStats.hp <= 0) return;

    const dist = player.pos.dist(enemy.pos);
    const enemyDef = enemies[enemy.enemyType];

    // Detection and chase
    if (dist < 150) {
      enemy.state = 'chase';
      const dir = player.pos.sub(enemy.pos).unit();
      enemy.pos = enemy.pos.add(dir.scale(enemyDef.speed * k.dt()));

      // Attack when close
      if (dist < 20 && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 1;
        playerStats.hp -= enemyDef.damage;
        showDamage(player.pos, enemyDef.damage, true);

        if (playerStats.hp <= 0) {
          showText(player.pos, "YOU DIED", 48);
          k.wait(2, () => k.go("title"));
        }
      }
    } else {
      enemy.state = 'idle';
    }

    // Attack cooldown
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= k.dt();
    }
  });

  // Draw HUD
  k.onDraw(() => {
    k.drawRect({
      pos: k.vec2(0, 0),
      width: k.width(),
      height: 50,
      color: k.rgb(20, 20, 30),
      opacity: 0.8,
      fixed: true
    });

    // Zone name
    k.drawText({
      text: zones[currentZone].name,
      pos: k.vec2(k.width() / 2, 10),
      size: 14,
      anchor: "center",
      color: k.rgb(200, 200, 220),
      fixed: true
    });

    // HP bar
    drawBar(10, 30, 100, 10, playerStats.hp, playerStats.maxHp, [180, 50, 50], "HP");

    // Magicka bar
    drawBar(120, 30, 80, 8, playerStats.magicka, playerStats.maxMagicka, [50, 100, 180], "MP");

    // Stamina bar
    drawBar(210, 30, 80, 8, playerStats.stamina, playerStats.maxStamina, [50, 180, 50], "ST");

    // Gold
    k.drawText({
      text: `Gold: ${playerStats.gold}`,
      pos: k.vec2(k.width() - 80, 30),
      size: 12,
      color: k.rgb(255, 215, 0),
      fixed: true
    });

    // Level
    k.drawText({
      text: `Lv.${playerStats.level}`,
      pos: k.vec2(k.width() - 80, 12),
      size: 12,
      color: k.rgb(200, 200, 200),
      fixed: true
    });

    // Active quest
    if (playerStats.quests.active.length > 0) {
      const quest = quests[playerStats.quests.active[0]];
      k.drawText({
        text: quest.name,
        pos: k.vec2(k.width() - 10, k.height() - 30),
        size: 10,
        anchor: "right",
        color: k.rgb(255, 220, 100),
        fixed: true
      });
    }

    // Weapon
    k.drawText({
      text: weapons[playerStats.equipment.weapon].name,
      pos: k.vec2(10, k.height() - 20),
      size: 10,
      color: k.rgb(180, 180, 200),
      fixed: true
    });

    // Dialogue box
    if (dialogueOpen && currentDialogue) {
      k.drawRect({
        pos: k.vec2(50, k.height() - 100),
        width: k.width() - 100,
        height: 80,
        color: k.rgb(20, 20, 40),
        opacity: 0.95,
        fixed: true,
        radius: 4
      });
      k.drawText({
        text: currentDialogue.name,
        pos: k.vec2(60, k.height() - 90),
        size: 14,
        color: k.rgb(255, 220, 100),
        fixed: true
      });
      k.drawText({
        text: currentDialogue.dialogue,
        pos: k.vec2(60, k.height() - 70),
        size: 11,
        width: k.width() - 120,
        color: k.rgb(200, 200, 220),
        fixed: true
      });
      k.drawText({
        text: "[E] Close",
        pos: k.vec2(k.width() - 60, k.height() - 30),
        size: 10,
        color: k.rgb(150, 150, 150),
        fixed: true
      });
    }

    // Inventory
    if (inventoryOpen) {
      k.drawRect({
        pos: k.vec2(100, 60),
        width: k.width() - 200,
        height: k.height() - 120,
        color: k.rgb(30, 30, 50),
        opacity: 0.95,
        fixed: true,
        radius: 4
      });
      k.drawText({
        text: "INVENTORY",
        pos: k.vec2(k.width() / 2, 80),
        size: 16,
        anchor: "center",
        color: k.rgb(220, 200, 150),
        fixed: true
      });

      // Equipment
      k.drawText({
        text: `Weapon: ${weapons[playerStats.equipment.weapon].name}`,
        pos: k.vec2(120, 110),
        size: 11,
        color: k.rgb(180, 180, 200),
        fixed: true
      });

      // Items
      let y = 140;
      const itemCounts = {};
      for (const item of playerStats.inventory) {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      }
      for (const [itemId, count] of Object.entries(itemCounts)) {
        k.drawText({
          text: `${items[itemId].name} x${count}`,
          pos: k.vec2(120, y),
          size: 10,
          color: k.rgb(180, 180, 180),
          fixed: true
        });
        y += 18;
      }

      // Stats
      k.drawText({
        text: `Combat: ${playerStats.skills.combat}  Magic: ${playerStats.skills.magic}  Stealth: ${playerStats.skills.stealth}`,
        pos: k.vec2(120, k.height() - 80),
        size: 10,
        color: k.rgb(150, 150, 180),
        fixed: true
      });

      k.drawText({
        text: "[I] Close",
        pos: k.vec2(k.width() / 2, k.height() - 50),
        size: 10,
        anchor: "center",
        color: k.rgb(150, 150, 150),
        fixed: true
      });
    }
  });
});

// Helper functions
function loadZone(zoneId) {
  const zone = zones[zoneId];

  // Clear old objects
  k.destroyAll("enemy");
  k.destroyAll("npc");
  k.destroyAll("chest");
  k.destroyAll("exit_indicator");
  enemyObjects = [];
  npcObjects = [];
  chestObjects = [];

  // Zone background
  k.add([
    k.rect(zone.width * TILE_SIZE, zone.height * TILE_SIZE),
    k.pos(0, 0),
    k.color(...zone.color),
    k.z(-10)
  ]);

  // Grid pattern
  for (let x = 0; x < zone.width; x++) {
    for (let y = 0; y < zone.height; y++) {
      if ((x + y) % 2 === 0) {
        k.add([
          k.rect(TILE_SIZE, TILE_SIZE),
          k.pos(x * TILE_SIZE, y * TILE_SIZE),
          k.color(zone.color[0] + 10, zone.color[1] + 10, zone.color[2] + 10),
          k.opacity(0.3),
          k.z(-9)
        ]);
      }
    }
  }

  // Exit indicators
  for (const exit of zone.exits) {
    k.add([
      k.rect(exit.width * TILE_SIZE, exit.height * TILE_SIZE),
      k.pos(exit.x * TILE_SIZE, exit.y * TILE_SIZE),
      k.color(100, 200, 100),
      k.opacity(0.3),
      k.z(-5),
      "exit_indicator"
    ]);
  }

  // Spawn enemies
  if (zone.enemies) {
    for (const e of zone.enemies) {
      const enemyDef = enemies[e.type];
      const enemy = k.add([
        k.rect(enemyDef.size, enemyDef.size),
        k.pos(e.x * TILE_SIZE, e.y * TILE_SIZE),
        k.anchor("center"),
        k.color(...enemyDef.color),
        k.area(),
        k.z(5),
        "enemy",
        {
          enemyType: e.type,
          hp: enemyDef.hp,
          maxHp: enemyDef.hp,
          state: 'idle',
          attackCooldown: 0
        }
      ]);
      enemyObjects.push(enemy);
    }
  }

  // Spawn NPCs
  if (zone.npcs) {
    for (const n of zone.npcs) {
      const npc = k.add([
        k.rect(14, 20),
        k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE),
        k.anchor("center"),
        k.color(200, 180, 150),
        k.z(5),
        "npc",
        { npcData: n }
      ]);

      // Name tag
      k.add([
        k.text(n.name, { size: 8 }),
        k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE - 18),
        k.anchor("center"),
        k.color(220, 220, 180),
        k.z(6)
      ]);

      npcObjects.push(npc);
    }
  }

  // Spawn chests
  if (zone.chests) {
    for (const c of zone.chests) {
      const chest = k.add([
        k.rect(16, 12),
        k.pos(c.x * TILE_SIZE, c.y * TILE_SIZE),
        k.anchor("center"),
        k.color(160, 120, 60),
        k.z(4),
        "chest",
        { chestData: c, opened: false }
      ]);
      chestObjects.push(chest);
    }
  }
}

function checkZoneExits() {
  const zone = zones[currentZone];
  for (const exit of zone.exits) {
    const exitX = exit.x * TILE_SIZE;
    const exitY = exit.y * TILE_SIZE;
    const exitW = exit.width * TILE_SIZE;
    const exitH = exit.height * TILE_SIZE;

    if (player.pos.x >= exitX && player.pos.x <= exitX + exitW &&
        player.pos.y >= exitY && player.pos.y <= exitY + exitH) {
      currentZone = exit.to;
      loadZone(currentZone);
      player.pos = k.vec2(exit.toX * TILE_SIZE, exit.toY * TILE_SIZE);
      return;
    }
  }
}

function killEnemy(enemy) {
  const enemyDef = enemies[enemy.enemyType];
  playerStats.xp.combat += enemyDef.xp;

  // Gold drop
  const goldDrop = k.rand(enemyDef.gold[0], enemyDef.gold[1]);
  if (goldDrop > 0) {
    playerStats.gold += Math.floor(goldDrop);
    showText(enemy.pos, `+${Math.floor(goldDrop)} Gold`);
  }

  checkLevelUp();
  enemy.destroy();
  enemyObjects = enemyObjects.filter(e => e !== enemy);
}

function checkLevelUp() {
  const totalXp = playerStats.xp.combat + playerStats.xp.magic + playerStats.xp.stealth;
  const xpNeeded = playerStats.level * 100;

  if (totalXp >= xpNeeded && playerStats.level < 10) {
    playerStats.level++;
    playerStats.maxHp += 10;
    playerStats.hp = playerStats.maxHp;
    playerStats.maxMagicka += 5;
    playerStats.magicka = playerStats.maxMagicka;
    playerStats.maxStamina += 5;
    playerStats.stamina = playerStats.maxStamina;

    // Increase skills
    playerStats.skills.combat = Math.min(10, playerStats.skills.combat + 1);

    showText(player.pos, `LEVEL UP! Lv.${playerStats.level}`, 20);
  }
}

function showDamage(pos, damage, isPlayer = false) {
  const color = isPlayer ? [255, 100, 100] : [255, 255, 100];
  k.add([
    k.text(`-${damage}`, { size: 12 }),
    k.pos(pos.add(k.vec2(k.rand(-10, 10), -15))),
    k.anchor("center"),
    k.color(...color),
    k.lifespan(0.8),
    k.move(k.vec2(0, -1), 30),
    k.z(100)
  ]);
}

function showText(pos, text, size = 12) {
  k.add([
    k.text(text, { size }),
    k.pos(pos.add(k.vec2(0, -25))),
    k.anchor("center"),
    k.color(255, 255, 200),
    k.lifespan(1.5),
    k.move(k.vec2(0, -1), 20),
    k.z(100)
  ]);
}

function drawBar(x, y, width, height, current, max, color, label) {
  // Background
  k.drawRect({
    pos: k.vec2(x, y),
    width: width,
    height: height,
    color: k.rgb(40, 40, 50),
    fixed: true
  });

  // Fill
  const fillWidth = (current / max) * width;
  k.drawRect({
    pos: k.vec2(x, y),
    width: fillWidth,
    height: height,
    color: k.rgb(...color),
    fixed: true
  });

  // Label
  k.drawText({
    text: label,
    pos: k.vec2(x + 2, y - 2),
    size: 8,
    color: k.rgb(180, 180, 180),
    fixed: true
  });
}

// Start at title screen
k.go("title");
