// Frostfall: A 2D Skyrim Demake - POLISHED VERSION
// Enhanced with particles, screen shake, glow effects, and sound
// Kaplay loaded from CDN - kaplay is global

const k = kaplay({
  width: 640,
  height: 360,
  scale: 2,
  background: [15, 20, 35],
  crisp: true,
  pixelDensity: 1,
});

// Expose game state for testing
window.gameState = { started: false, health: 100, player: null };

// ============================================
// AUDIO SYSTEM (Web Audio API)
// ============================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, volume = 0.3) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);

  switch (type) {
    case 'hit':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'sword':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    case 'death':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'pickup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.05);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    case 'levelup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(550, now + 0.1);
      osc.frequency.setValueAtTime(660, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'step':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 20, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
  }
}

// ============================================
// CONSTANTS & DATA
// ============================================
const TILE_SIZE = 16;
const PLAYER_SPEED = 80;
const SPRINT_SPEED = 140;

// Enhanced color palette (lospec inspired)
const COLORS = {
  bg: [15, 20, 35],
  bgLight: [25, 35, 55],
  player: [90, 140, 210],
  playerLight: [130, 180, 250],
  enemy: [180, 70, 70],
  enemyLight: [220, 110, 110],
  npc: [200, 180, 140],
  gold: [255, 215, 80],
  health: [200, 60, 60],
  mana: [60, 100, 200],
  stamina: [60, 180, 80],
  xp: [200, 180, 100],
  text: [230, 230, 250],
  textDim: [150, 150, 180],
  particle: [255, 220, 150],
};

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

// Weapons
const weapons = {
  iron_sword: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 28, type: 'melee' },
  steel_sword: { name: 'Steel Sword', damage: 12, speed: 0.3, range: 28, type: 'melee' },
  dagger: { name: 'Dagger', damage: 5, speed: 0.15, range: 20, type: 'melee', sneakBonus: 2 },
};

// Enemies
const enemies = {
  bandit: { hp: 40, damage: 8, speed: 50, color: [180, 80, 80], xp: 20, gold: [5, 15], size: 14 },
  wolf: { hp: 25, damage: 6, speed: 75, color: [100, 100, 110], xp: 10, gold: [0, 0], size: 11 },
  draugr: { hp: 50, damage: 10, speed: 40, color: [80, 130, 110], xp: 30, gold: [5, 20], size: 14 },
  bandit_chief: { hp: 80, damage: 15, speed: 45, color: [200, 60, 60], xp: 50, gold: [25, 50], size: 18, boss: true },
  draugr_deathlord: { hp: 150, damage: 25, speed: 35, color: [50, 110, 90], xp: 100, gold: [50, 100], size: 22, boss: true }
};

// Zones
const zones = {
  riverwood: {
    name: 'Riverwood',
    width: 40, height: 25,
    safe: true,
    ambientColor: [50, 80, 50],
    npcs: [
      { id: 'alvor', name: 'Alvor', x: 8, y: 10, type: 'blacksmith', dialogue: "Need iron equipment? I've got the finest in the hold." },
      { id: 'lucan', name: 'Lucan', x: 25, y: 8, type: 'merchant', dialogue: "Welcome to the Riverwood Trader! Potions half price today." }
    ],
    exits: [
      { x: 38, y: 12, width: 2, height: 6, to: 'forest', toX: 2, toY: 12 },
      { x: 20, y: 0, width: 6, height: 2, to: 'whiterun_road', toX: 20, toY: 23 }
    ],
    structures: [
      { x: 5, y: 8, w: 8, h: 6, type: 'building' },
      { x: 22, y: 6, w: 8, h: 5, type: 'building' },
    ]
  },
  forest: {
    name: 'Riverwood Forest',
    width: 50, height: 30,
    safe: false,
    ambientColor: [30, 60, 35],
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
    trees: 25
  },
  embershard: {
    name: 'Embershard Mine',
    width: 35, height: 25,
    safe: false,
    ambientColor: [40, 30, 25],
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
    ]
  },
  whiterun_road: {
    name: 'Road to Whiterun',
    width: 45, height: 25,
    safe: false,
    ambientColor: [60, 55, 40],
    enemies: [
      { type: 'bandit', x: 20, y: 10 },
      { type: 'wolf', x: 35, y: 18 }
    ],
    exits: [
      { x: 20, y: 23, width: 6, height: 2, to: 'riverwood', toX: 20, toY: 2 },
      { x: 43, y: 10, width: 2, height: 6, to: 'whiterun', toX: 2, toY: 12 }
    ]
  },
  whiterun: {
    name: 'Whiterun',
    width: 50, height: 35,
    safe: true,
    ambientColor: [80, 70, 55],
    npcs: [
      { id: 'jarl', name: 'Jarl Balgruuf', x: 25, y: 8, type: 'quest', dialogue: "You! The one from Helgen? Speak with Farengar about the dragons." },
      { id: 'farengar', name: 'Farengar', x: 30, y: 10, type: 'wizard', dialogue: "The Dragonstone... it's in Bleak Falls Barrow. Retrieve it." }
    ],
    exits: [
      { x: 0, y: 10, width: 2, height: 6, to: 'whiterun_road', toX: 41, toY: 10 },
      { x: 48, y: 20, width: 2, height: 6, to: 'bleak_falls', toX: 2, toY: 10 }
    ],
    structures: [
      { x: 20, y: 5, w: 15, h: 8, type: 'castle' },
    ]
  },
  bleak_falls: {
    name: 'Bleak Falls Barrow',
    width: 40, height: 30,
    safe: false,
    ambientColor: [35, 45, 55],
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
    ]
  }
};

// Items
const items = {
  health_potion: { name: 'Health Potion', type: 'consumable', effect: 'heal', amount: 50, value: 30 },
  magicka_potion: { name: 'Magicka Potion', type: 'consumable', effect: 'magicka', amount: 30, value: 25 },
  dragonstone: { name: 'Dragonstone', type: 'quest', value: 0 }
};

// Quests
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
let dialogueOpen = false;
let currentDialogue = null;
let inventoryOpen = false;
let screenShake = 0;
let stepTimer = 0;

// ============================================
// PARTICLE SYSTEM
// ============================================
function spawnParticles(pos, count, color, speed = 100, life = 0.5, spread = 360) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * spread - spread / 2) * Math.PI / 180;
    const vel = k.vec2(Math.cos(angle), Math.sin(angle)).scale(speed * (0.5 + Math.random() * 0.5));
    const size = 2 + Math.random() * 3;

    k.add([
      k.rect(size, size),
      k.pos(pos),
      k.anchor("center"),
      k.color(...color),
      k.opacity(1),
      k.lifespan(life, { fade: 0.5 }),
      k.z(50),
      {
        vel,
        update() {
          this.pos = this.pos.add(this.vel.scale(k.dt()));
          this.vel = this.vel.scale(0.95);
        }
      }
    ]);
  }
}

function spawnDustTrail(pos) {
  const dust = k.add([
    k.circle(2 + Math.random() * 2),
    k.pos(pos.add(k.vec2(k.rand(-5, 5), k.rand(3, 8)))),
    k.anchor("center"),
    k.color(150, 140, 120),
    k.opacity(0.4),
    k.lifespan(0.3, { fade: 0.3 }),
    k.z(1)
  ]);
}

function spawnBloodSplatter(pos) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 15;
    k.add([
      k.circle(1 + Math.random() * 2),
      k.pos(pos.add(k.vec2(Math.cos(angle) * dist, Math.sin(angle) * dist))),
      k.anchor("center"),
      k.color(150, 40, 40),
      k.opacity(0.7),
      k.lifespan(2, { fade: 1 }),
      k.z(2)
    ]);
  }
}

function spawnGoldParticles(pos) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    k.add([
      k.rect(3, 3),
      k.pos(pos),
      k.anchor("center"),
      k.color(255, 215, 80),
      k.opacity(1),
      k.lifespan(0.8, { fade: 0.4 }),
      k.z(50),
      {
        vel: k.vec2(Math.cos(angle), Math.sin(angle)).scale(80),
        update() {
          this.pos = this.pos.add(this.vel.scale(k.dt()));
          this.vel.y += 200 * k.dt();
        }
      }
    ]);
  }
}

// ============================================
// SCREEN SHAKE
// ============================================
function addScreenShake(amount) {
  screenShake = Math.min(screenShake + amount, 15);
}

// ============================================
// TITLE SCENE
// ============================================
k.scene("title", () => {
  // Animated background particles
  for (let i = 0; i < 50; i++) {
    k.add([
      k.circle(1 + Math.random() * 2),
      k.pos(Math.random() * k.width(), Math.random() * k.height()),
      k.color(100 + Math.random() * 100, 120 + Math.random() * 80, 180 + Math.random() * 75),
      k.opacity(0.3 + Math.random() * 0.3),
      k.z(-1),
      {
        speed: 5 + Math.random() * 15,
        update() {
          this.pos.y -= this.speed * k.dt();
          if (this.pos.y < -10) {
            this.pos.y = k.height() + 10;
            this.pos.x = Math.random() * k.width();
          }
        }
      }
    ]);
  }

  // Title with glow effect
  for (let i = 3; i >= 0; i--) {
    k.add([
      k.text("FROSTFALL", { size: 36 + i * 4 }),
      k.pos(k.width() / 2, k.height() / 2 - 70),
      k.anchor("center"),
      k.color(100, 150, 255),
      k.opacity(i === 0 ? 1 : 0.1),
      k.z(10 - i)
    ]);
  }

  k.add([
    k.text("A 2D Skyrim Demake", { size: 14 }),
    k.pos(k.width() / 2, k.height() / 2 - 25),
    k.anchor("center"),
    k.color(150, 160, 200)
  ]);

  k.add([
    k.text("WASD: Move | SHIFT: Sprint | SPACE: Attack", { size: 9 }),
    k.pos(k.width() / 2, k.height() / 2 + 15),
    k.anchor("center"),
    k.color(120, 130, 160)
  ]);

  k.add([
    k.text("E: Interact | I: Inventory | Q: Use Potion", { size: 9 }),
    k.pos(k.width() / 2, k.height() / 2 + 32),
    k.anchor("center"),
    k.color(120, 130, 160)
  ]);

  // Pulsing start text
  const startText = k.add([
    k.text("[ PRESS SPACE TO BEGIN ]", { size: 12 }),
    k.pos(k.width() / 2, k.height() / 2 + 80),
    k.anchor("center"),
    k.color(255, 240, 150),
    k.z(10)
  ]);

  let time = 0;
  startText.onUpdate(() => {
    time += k.dt();
    startText.opacity = 0.5 + 0.5 * Math.sin(time * 4);
  });

  k.onKeyPress("space", () => {
    audioCtx.resume();
    playSound('pickup');
    k.go("game");
  });
});

// ============================================
// GAME SCENE
// ============================================
k.scene("game", () => {
  window.gameState.started = true;

  loadZone(currentZone);

  // Player with shadow
  const playerShadow = k.add([
    k.circle(8),
    k.pos(0, 0),
    k.anchor("center"),
    k.color(0, 0, 0),
    k.opacity(0.3),
    k.z(3)
  ]);

  player = k.add([
    k.rect(14, 20),
    k.pos(zones[currentZone].width * TILE_SIZE / 2, zones[currentZone].height * TILE_SIZE / 2),
    k.anchor("center"),
    k.color(...COLORS.player),
    k.area(),
    k.z(10),
    "player",
    {
      dir: k.vec2(0, 1),
      attacking: false,
      attackAnim: 0,
      walkFrame: 0
    }
  ]);

  // Camera and shadow follow
  player.onUpdate(() => {
    // Screen shake
    const shakeX = screenShake > 0 ? k.rand(-screenShake, screenShake) : 0;
    const shakeY = screenShake > 0 ? k.rand(-screenShake, screenShake) : 0;
    k.camPos(player.pos.add(k.vec2(shakeX, shakeY)));
    screenShake *= 0.9;

    playerShadow.pos = player.pos.add(k.vec2(0, 12));

    window.gameState.player = { x: player.pos.x, y: player.pos.y };
    window.gameState.health = playerStats.hp;
  });

  // Movement
  k.onUpdate(() => {
    if (dialogueOpen || inventoryOpen || playerStats.hp <= 0) return;

    // Regenerate stamina
    if (!k.isKeyDown("shift")) {
      playerStats.stamina = Math.min(playerStats.maxStamina, playerStats.stamina + 12 * k.dt());
    }
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
        playerStats.stamina -= 6 * k.dt();
      }

      const newPos = player.pos.add(moveDir.scale(speed * k.dt()));
      const zone = zones[currentZone];

      if (newPos.x > 10 && newPos.x < zone.width * TILE_SIZE - 10 &&
          newPos.y > 10 && newPos.y < zone.height * TILE_SIZE - 10) {
        player.pos = newPos;

        // Footstep dust and sound
        stepTimer += k.dt();
        if (stepTimer > 0.2) {
          stepTimer = 0;
          if (speed === SPRINT_SPEED) {
            spawnDustTrail(player.pos);
            playSound('step', 0.1);
          }
        }
      }

      // Walking animation
      player.walkFrame += k.dt() * 10;
      const offset = Math.sin(player.walkFrame) * 1.5;
      player.pos.y += offset * 0.1;
    }

    if (attackCooldown > 0) attackCooldown -= k.dt();
    checkZoneExits();
  });

  // Attack
  k.onKeyPress("space", () => {
    if (dialogueOpen || inventoryOpen || playerStats.hp <= 0 || attackCooldown > 0) return;

    const weapon = weapons[playerStats.equipment.weapon];
    attackCooldown = weapon.speed;
    playerStats.stamina = Math.max(0, playerStats.stamina - 10);

    playSound('sword');

    // Attack visual with glow
    const attackPos = player.pos.add(player.dir.scale(weapon.range / 2 + 12));

    // Glow layer
    k.add([
      k.circle(weapon.range * 0.8),
      k.pos(attackPos),
      k.anchor("center"),
      k.color(255, 200, 100),
      k.opacity(0.3),
      k.lifespan(0.15, { fade: 0.1 }),
      k.z(9)
    ]);

    // Attack arc
    k.add([
      k.rect(weapon.range, weapon.range * 0.6),
      k.pos(attackPos),
      k.anchor("center"),
      k.color(255, 240, 180),
      k.opacity(0.6),
      k.lifespan(0.1),
      k.z(11)
    ]);

    // Spark particles
    spawnParticles(attackPos, 5, COLORS.particle, 120, 0.3);

    // Check enemy hits
    for (const enemy of enemyObjects) {
      if (enemy.exists() && enemy.hp > 0) {
        const dist = player.pos.dist(enemy.pos);
        if (dist < weapon.range + enemy.size + 5) {
          const skillMult = 1 + playerStats.skills.combat * 0.05;
          const damage = Math.floor(weapon.damage * skillMult);
          enemy.hp -= damage;

          playSound('hit');
          addScreenShake(4);
          showDamage(enemy.pos, damage);
          spawnBloodSplatter(enemy.pos);

          playerStats.xp.combat += 5;
          checkLevelUp();

          if (enemy.hp <= 0) {
            killEnemy(enemy);
          } else {
            const knockDir = enemy.pos.sub(player.pos).unit();
            enemy.pos = enemy.pos.add(knockDir.scale(25));
            enemy.hitFlash = 0.15;
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

    for (const npc of npcObjects) {
      if (npc.exists() && player.pos.dist(npc.pos) < 35) {
        dialogueOpen = true;
        currentDialogue = npc.npcData;
        playSound('pickup');

        if (npc.npcData.type === 'blacksmith' || npc.npcData.type === 'merchant') {
          if (playerStats.gold >= 50 && playerStats.equipment.weapon === 'iron_sword') {
            playerStats.gold -= 50;
            playerStats.equipment.weapon = 'steel_sword';
            showText(player.pos, "Steel Sword Acquired!", [255, 220, 100]);
            spawnGoldParticles(npc.pos);
          }
        } else if (npc.npcData.type === 'quest' || npc.npcData.type === 'wizard') {
          if (!playerStats.quests.active.includes('main_1') && !playerStats.quests.completed.includes('main_1')) {
            playerStats.quests.active.push('main_1');
            showText(player.pos, "New Quest: Bleak Falls Barrow", [100, 200, 255]);
          }
        }
        return;
      }
    }

    for (const chest of chestObjects) {
      if (chest.exists() && !chest.opened && player.pos.dist(chest.pos) < 35) {
        chest.opened = true;
        chest.color = k.rgb(80, 60, 40);
        playerStats.gold += chest.chestData.gold;
        playSound('pickup');
        spawnGoldParticles(chest.pos);
        showText(chest.pos, `+${chest.chestData.gold} Gold`, COLORS.gold);

        for (const itemId of chest.chestData.items) {
          playerStats.inventory.push(itemId);
          k.wait(0.3, () => showText(chest.pos.add(k.vec2(0, 20)), `${items[itemId].name}`, [200, 200, 220]));

          if (itemId === 'dragonstone' && playerStats.quests.active.includes('main_1')) {
            playerStats.quests.active = playerStats.quests.active.filter(q => q !== 'main_1');
            playerStats.quests.completed.push('main_1');
            playerStats.gold += quests.main_1.reward;
            playSound('levelup');
            k.wait(0.6, () => showText(player.pos, "Quest Complete! +200 Gold", [255, 215, 80], 16));
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
      playSound('pickup');
      showText(player.pos, "+50 HP", [100, 255, 100]);
      spawnParticles(player.pos, 10, [100, 255, 100], 60, 0.5);
    }
  });

  // Inventory toggle
  k.onKeyPress("i", () => {
    if (dialogueOpen) return;
    inventoryOpen = !inventoryOpen;
    playSound('pickup', 0.2);
  });

  // Enemy AI
  k.onUpdate("enemy", (enemy) => {
    if (enemy.hp <= 0 || dialogueOpen || playerStats.hp <= 0) return;

    const dist = player.pos.dist(enemy.pos);
    const enemyDef = enemies[enemy.enemyType];

    // Hit flash effect
    if (enemy.hitFlash > 0) {
      enemy.hitFlash -= k.dt();
      enemy.color = k.rgb(255, 255, 255);
    } else {
      enemy.color = k.rgb(...enemyDef.color);
    }

    // Detection and chase
    if (dist < 160) {
      enemy.state = 'chase';
      const dir = player.pos.sub(enemy.pos).unit();
      enemy.pos = enemy.pos.add(dir.scale(enemyDef.speed * k.dt()));

      if (dist < 22 && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 1;
        playerStats.hp -= enemyDef.damage;
        playSound('hit');
        addScreenShake(6);
        showDamage(player.pos, enemyDef.damage, true);

        if (playerStats.hp <= 0) {
          playSound('death');
          showText(player.pos, "YOU DIED", [200, 50, 50], 32);
          addScreenShake(15);
          k.wait(2.5, () => k.go("title"));
        }
      }
    } else {
      enemy.state = 'idle';
      // Idle wandering
      if (Math.random() < 0.01) {
        const wanderDir = k.vec2(k.rand(-1, 1), k.rand(-1, 1)).unit();
        enemy.pos = enemy.pos.add(wanderDir.scale(enemyDef.speed * 0.3 * k.dt()));
      }
    }

    if (enemy.attackCooldown > 0) enemy.attackCooldown -= k.dt();

    // Update shadow
    if (enemy.shadow) {
      enemy.shadow.pos = enemy.pos.add(k.vec2(0, enemy.size / 2 + 3));
    }
  });

  // Draw HUD
  k.onDraw(() => {
    // Top bar background with gradient effect
    k.drawRect({
      pos: k.vec2(0, 0),
      width: k.width(),
      height: 52,
      color: k.rgb(15, 18, 30),
      opacity: 0.9,
      fixed: true
    });
    k.drawRect({
      pos: k.vec2(0, 50),
      width: k.width(),
      height: 2,
      color: k.rgb(60, 80, 120),
      opacity: 0.5,
      fixed: true
    });

    // Zone name with subtle glow
    k.drawText({
      text: zones[currentZone].name.toUpperCase(),
      pos: k.vec2(k.width() / 2, 10),
      size: 12,
      anchor: "center",
      color: k.rgb(180, 190, 220),
      fixed: true
    });

    // HP bar with glow
    drawBarGlow(10, 28, 110, 12, playerStats.hp, playerStats.maxHp, COLORS.health, "HP");

    // Magicka bar
    drawBarGlow(130, 28, 80, 9, playerStats.magicka, playerStats.maxMagicka, COLORS.mana, "MP");

    // Stamina bar
    drawBarGlow(220, 28, 80, 9, playerStats.stamina, playerStats.maxStamina, COLORS.stamina, "ST");

    // Gold with icon
    k.drawText({
      text: `$ ${playerStats.gold}`,
      pos: k.vec2(k.width() - 70, 28),
      size: 13,
      color: k.rgb(...COLORS.gold),
      fixed: true
    });

    // Level with XP indicator
    const totalXp = playerStats.xp.combat + playerStats.xp.magic + playerStats.xp.stealth;
    const xpNeeded = playerStats.level * 100;
    k.drawText({
      text: `Lv.${playerStats.level}`,
      pos: k.vec2(k.width() - 70, 12),
      size: 11,
      color: k.rgb(200, 200, 220),
      fixed: true
    });

    // Mini XP bar
    k.drawRect({
      pos: k.vec2(k.width() - 70, 40),
      width: 50,
      height: 3,
      color: k.rgb(40, 40, 50),
      fixed: true
    });
    k.drawRect({
      pos: k.vec2(k.width() - 70, 40),
      width: 50 * (totalXp / xpNeeded),
      height: 3,
      color: k.rgb(...COLORS.xp),
      fixed: true
    });

    // Quest tracker
    if (playerStats.quests.active.length > 0) {
      const quest = quests[playerStats.quests.active[0]];
      k.drawRect({
        pos: k.vec2(k.width() - 140, k.height() - 40),
        width: 130,
        height: 30,
        color: k.rgb(20, 25, 40),
        opacity: 0.8,
        fixed: true,
        radius: 4
      });
      k.drawText({
        text: `Quest: ${quest.name}`,
        pos: k.vec2(k.width() - 135, k.height() - 32),
        size: 8,
        color: k.rgb(255, 220, 100),
        fixed: true
      });
    }

    // Weapon display
    k.drawRect({
      pos: k.vec2(5, k.height() - 28),
      width: 100,
      height: 22,
      color: k.rgb(25, 30, 45),
      opacity: 0.8,
      fixed: true,
      radius: 4
    });
    k.drawText({
      text: weapons[playerStats.equipment.weapon].name,
      pos: k.vec2(10, k.height() - 22),
      size: 10,
      color: k.rgb(180, 180, 200),
      fixed: true
    });

    // Potion count
    const potionCount = playerStats.inventory.filter(i => i === 'health_potion').length;
    if (potionCount > 0) {
      k.drawText({
        text: `[Q] Potion x${potionCount}`,
        pos: k.vec2(115, k.height() - 22),
        size: 9,
        color: k.rgb(150, 150, 180),
        fixed: true
      });
    }

    // Dialogue box (styled)
    if (dialogueOpen && currentDialogue) {
      k.drawRect({
        pos: k.vec2(40, k.height() - 95),
        width: k.width() - 80,
        height: 85,
        color: k.rgb(15, 20, 35),
        opacity: 0.95,
        fixed: true,
        radius: 6
      });
      k.drawRect({
        pos: k.vec2(40, k.height() - 95),
        width: k.width() - 80,
        height: 85,
        outline: { color: k.rgb(80, 100, 140), width: 2 },
        fill: false,
        fixed: true,
        radius: 6
      });
      k.drawText({
        text: currentDialogue.name,
        pos: k.vec2(55, k.height() - 85),
        size: 13,
        color: k.rgb(255, 220, 120),
        fixed: true
      });
      k.drawText({
        text: currentDialogue.dialogue,
        pos: k.vec2(55, k.height() - 65),
        size: 10,
        width: k.width() - 110,
        color: k.rgb(200, 205, 220),
        fixed: true
      });
      k.drawText({
        text: "[E] Continue",
        pos: k.vec2(k.width() - 55, k.height() - 20),
        size: 9,
        anchor: "right",
        color: k.rgb(150, 150, 170),
        fixed: true
      });
    }

    // Inventory screen (styled)
    if (inventoryOpen) {
      k.drawRect({
        pos: k.vec2(80, 55),
        width: k.width() - 160,
        height: k.height() - 110,
        color: k.rgb(20, 25, 40),
        opacity: 0.95,
        fixed: true,
        radius: 8
      });
      k.drawRect({
        pos: k.vec2(80, 55),
        width: k.width() - 160,
        height: k.height() - 110,
        outline: { color: k.rgb(70, 90, 130), width: 2 },
        fill: false,
        fixed: true,
        radius: 8
      });

      k.drawText({
        text: "INVENTORY",
        pos: k.vec2(k.width() / 2, 75),
        size: 16,
        anchor: "center",
        color: k.rgb(200, 190, 150),
        fixed: true
      });

      k.drawText({
        text: `Weapon: ${weapons[playerStats.equipment.weapon].name}`,
        pos: k.vec2(100, 105),
        size: 11,
        color: k.rgb(180, 180, 210),
        fixed: true
      });

      let y = 130;
      const itemCounts = {};
      for (const item of playerStats.inventory) {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      }
      for (const [itemId, count] of Object.entries(itemCounts)) {
        k.drawText({
          text: `${items[itemId].name} x${count}`,
          pos: k.vec2(100, y),
          size: 10,
          color: k.rgb(170, 170, 190),
          fixed: true
        });
        y += 18;
      }

      k.drawText({
        text: `Combat: ${playerStats.skills.combat}   Magic: ${playerStats.skills.magic}   Stealth: ${playerStats.skills.stealth}`,
        pos: k.vec2(100, k.height() - 80),
        size: 9,
        color: k.rgb(140, 150, 180),
        fixed: true
      });

      k.drawText({
        text: "[I] Close",
        pos: k.vec2(k.width() / 2, k.height() - 55),
        size: 10,
        anchor: "center",
        color: k.rgb(150, 150, 170),
        fixed: true
      });
    }
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================
function loadZone(zoneId) {
  const zone = zones[zoneId];

  k.destroyAll("enemy");
  k.destroyAll("npc");
  k.destroyAll("chest");
  k.destroyAll("exit_indicator");
  k.destroyAll("structure");
  k.destroyAll("tree");
  k.destroyAll("shadow");
  enemyObjects = [];
  npcObjects = [];
  chestObjects = [];

  // Zone background
  k.add([
    k.rect(zone.width * TILE_SIZE, zone.height * TILE_SIZE),
    k.pos(0, 0),
    k.color(...zone.ambientColor),
    k.z(-10)
  ]);

  // Subtle grid pattern
  for (let x = 0; x < zone.width; x++) {
    for (let y = 0; y < zone.height; y++) {
      if ((x + y) % 2 === 0) {
        k.add([
          k.rect(TILE_SIZE, TILE_SIZE),
          k.pos(x * TILE_SIZE, y * TILE_SIZE),
          k.color(zone.ambientColor[0] + 8, zone.ambientColor[1] + 8, zone.ambientColor[2] + 8),
          k.opacity(0.25),
          k.z(-9)
        ]);
      }
    }
  }

  // Structures
  if (zone.structures) {
    for (const s of zone.structures) {
      k.add([
        k.rect(s.w * TILE_SIZE, s.h * TILE_SIZE),
        k.pos(s.x * TILE_SIZE, s.y * TILE_SIZE),
        k.color(60, 50, 40),
        k.z(0),
        "structure"
      ]);
      // Roof highlight
      k.add([
        k.rect(s.w * TILE_SIZE, 4),
        k.pos(s.x * TILE_SIZE, s.y * TILE_SIZE),
        k.color(90, 70, 50),
        k.z(1)
      ]);
    }
  }

  // Trees
  if (zone.trees) {
    for (let i = 0; i < zone.trees; i++) {
      const tx = k.rand(3, zone.width - 3) * TILE_SIZE;
      const ty = k.rand(3, zone.height - 3) * TILE_SIZE;

      // Tree shadow
      k.add([
        k.circle(9),
        k.pos(tx, ty + 20),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0.25),
        k.z(1),
        "tree"
      ]);

      // Tree trunk
      k.add([
        k.rect(6, 16),
        k.pos(tx - 3, ty),
        k.color(80, 60, 40),
        k.z(2),
        "tree"
      ]);

      // Tree foliage
      k.add([
        k.circle(14),
        k.pos(tx, ty - 8),
        k.anchor("center"),
        k.color(40, 80, 50),
        k.z(3),
        "tree"
      ]);
    }
  }

  // Exit indicators
  for (const exit of zone.exits) {
    k.add([
      k.rect(exit.width * TILE_SIZE, exit.height * TILE_SIZE),
      k.pos(exit.x * TILE_SIZE, exit.y * TILE_SIZE),
      k.color(80, 180, 100),
      k.opacity(0.25),
      k.z(-5),
      "exit_indicator"
    ]);
  }

  // Spawn enemies
  if (zone.enemies) {
    for (const e of zone.enemies) {
      const enemyDef = enemies[e.type];

      // Enemy shadow
      const shadow = k.add([
        k.circle(enemyDef.size * 0.5),
        k.pos(e.x * TILE_SIZE, e.y * TILE_SIZE + enemyDef.size / 2 + 3),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0.3),
        k.z(4),
        "shadow"
      ]);

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
          size: enemyDef.size,
          state: 'idle',
          attackCooldown: 0,
          hitFlash: 0,
          shadow: shadow
        }
      ]);
      enemyObjects.push(enemy);
    }
  }

  // Spawn NPCs
  if (zone.npcs) {
    for (const n of zone.npcs) {
      // NPC shadow
      k.add([
        k.circle(6),
        k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE + 12),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.opacity(0.3),
        k.z(4)
      ]);

      const npc = k.add([
        k.rect(12, 18),
        k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE),
        k.anchor("center"),
        k.color(...COLORS.npc),
        k.z(5),
        "npc",
        { npcData: n }
      ]);

      // Name tag with background
      k.add([
        k.rect(n.name.length * 5 + 8, 12),
        k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE - 18),
        k.anchor("center"),
        k.color(20, 25, 40),
        k.opacity(0.7),
        k.z(5)
      ]);
      k.add([
        k.text(n.name, { size: 8 }),
        k.pos(n.x * TILE_SIZE, n.y * TILE_SIZE - 18),
        k.anchor("center"),
        k.color(220, 215, 180),
        k.z(6)
      ]);

      npcObjects.push(npc);
    }
  }

  // Spawn chests
  if (zone.chests) {
    for (const c of zone.chests) {
      // Chest glow
      k.add([
        k.circle(20),
        k.pos(c.x * TILE_SIZE, c.y * TILE_SIZE),
        k.anchor("center"),
        k.color(255, 200, 100),
        k.opacity(0.15),
        k.z(3)
      ]);

      const chest = k.add([
        k.rect(18, 14),
        k.pos(c.x * TILE_SIZE, c.y * TILE_SIZE),
        k.anchor("center"),
        k.color(180, 140, 80),
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
      playSound('pickup', 0.2);
      return;
    }
  }
}

function killEnemy(enemy) {
  const enemyDef = enemies[enemy.enemyType];
  playerStats.xp.combat += enemyDef.xp;

  // Death particles
  spawnParticles(enemy.pos, 15, enemyDef.color, 100, 0.6);
  addScreenShake(5);
  playSound('death', 0.4);

  const goldDrop = k.rand(enemyDef.gold[0], enemyDef.gold[1]);
  if (goldDrop > 0) {
    playerStats.gold += Math.floor(goldDrop);
    spawnGoldParticles(enemy.pos);
    showText(enemy.pos, `+${Math.floor(goldDrop)} Gold`, COLORS.gold);
  }

  checkLevelUp();
  if (enemy.shadow) enemy.shadow.destroy();
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
    playerStats.skills.combat = Math.min(10, playerStats.skills.combat + 1);

    playSound('levelup');
    addScreenShake(3);
    showText(player.pos, `LEVEL UP! Lv.${playerStats.level}`, [255, 255, 150], 18);
    spawnParticles(player.pos, 20, [255, 255, 200], 80, 0.8);
  }
}

function showDamage(pos, damage, isPlayer = false) {
  const color = isPlayer ? [255, 80, 80] : [255, 255, 120];
  k.add([
    k.text(`-${damage}`, { size: 14 }),
    k.pos(pos.add(k.vec2(k.rand(-8, 8), -12))),
    k.anchor("center"),
    k.color(...color),
    k.lifespan(0.9, { fade: 0.4 }),
    k.move(k.vec2(0, -1), 35),
    k.z(100)
  ]);
}

function showText(pos, text, color = [255, 255, 200], size = 12) {
  k.add([
    k.text(text, { size }),
    k.pos(pos.add(k.vec2(0, -25))),
    k.anchor("center"),
    k.color(...color),
    k.lifespan(1.8, { fade: 0.6 }),
    k.move(k.vec2(0, -1), 25),
    k.z(100)
  ]);
}

function drawBarGlow(x, y, width, height, current, max, color, label) {
  // Glow background
  k.drawRect({
    pos: k.vec2(x - 2, y - 2),
    width: width + 4,
    height: height + 4,
    color: k.rgb(color[0], color[1], color[2]),
    opacity: 0.15,
    fixed: true,
    radius: 3
  });

  // Background
  k.drawRect({
    pos: k.vec2(x, y),
    width: width,
    height: height,
    color: k.rgb(30, 35, 50),
    fixed: true,
    radius: 2
  });

  // Fill
  const fillWidth = Math.max(0, (current / max) * width);
  if (fillWidth > 0) {
    k.drawRect({
      pos: k.vec2(x, y),
      width: fillWidth,
      height: height,
      color: k.rgb(color[0], color[1], color[2]),
      fixed: true,
      radius: 2
    });

    // Highlight
    k.drawRect({
      pos: k.vec2(x, y),
      width: fillWidth,
      height: height / 3,
      color: k.rgb(Math.min(255, color[0] + 60), Math.min(255, color[1] + 60), Math.min(255, color[2] + 60)),
      opacity: 0.4,
      fixed: true,
      radius: 2
    });
  }

  // Label
  k.drawText({
    text: label,
    pos: k.vec2(x + 3, y - 1),
    size: 7,
    color: k.rgb(180, 180, 200),
    fixed: true
  });
}

// Start game
k.go("title");
