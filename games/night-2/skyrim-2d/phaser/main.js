// Frostfall - A 2D Skyrim Demake (Canvas implementation)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const WIDTH = 640;
const HEIGHT = 480;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Game state
const game = {
  screen: 'title', // title, game, inventory, dialogue, gameover
  zone: 'riverwood', // riverwood, forest, mine, whiterun
  player: {
    x: 300, y: 300,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    magicka: 50, maxMagicka: 50,
    stamina: 100, maxStamina: 100,
    gold: 50,
    level: 1,
    xp: { combat: 0, magic: 0, stealth: 0 },
    skills: { combat: 1, magic: 1, stealth: 1 },
    perks: [],
    equipment: {
      weapon: { name: 'Iron Sword', damage: 8, type: 'melee' },
      armor: { name: 'Leather Armor', defense: 15 }
    },
    inventory: [
      { name: 'Health Potion', type: 'potion', effect: 'hp', amount: 25, count: 3 }
    ],
    facing: 'down',
    attacking: false,
    attackTimer: 0,
    invincible: 0
  },
  enemies: [],
  npcs: [],
  items: [],
  projectiles: [],
  particles: [],
  quests: {
    active: [{ id: 'main1', name: 'Reach Riverwood', stage: 1, desc: 'Find the village of Riverwood' }],
    completed: []
  },
  dialogue: null,
  camera: { x: 0, y: 0 },
  keys: {},
  mouse: { x: 0, y: 0, clicked: false },
  messages: [],
  time: 0
};

// Expose for testing
window.gameState = game;

// Zone data
const ZONES = {
  riverwood: {
    width: 800, height: 600,
    color: '#3a5c3a',
    npcs: [
      { id: 'alvor', name: 'Alvor', x: 200, y: 150, dialogue: [
        { text: 'Welcome to Riverwood, traveler. I\'m Alvor, the blacksmith.', responses: [
          { text: 'I need supplies.', action: 'shop' },
          { text: 'Any work available?', action: 'quest' },
          { text: 'Goodbye.', action: 'close' }
        ]}
      ]},
      { id: 'lucan', name: 'Lucan', x: 400, y: 200, dialogue: [
        { text: 'Welcome to the Riverwood Trader!', responses: [
          { text: 'What do you sell?', action: 'shop' },
          { text: 'Goodbye.', action: 'close' }
        ]}
      ]}
    ],
    enemies: [],
    exits: [
      { x: 750, y: 300, w: 50, h: 100, to: 'forest', spawn: { x: 50, y: 300 } }
    ]
  },
  forest: {
    width: 1000, height: 800,
    color: '#2d4a2d',
    npcs: [],
    enemies: [
      { type: 'wolf', x: 300, y: 200 },
      { type: 'wolf', x: 500, y: 400 },
      { type: 'wolf', x: 700, y: 300 },
      { type: 'bandit', x: 800, y: 600 }
    ],
    exits: [
      { x: 0, y: 250, w: 50, h: 100, to: 'riverwood', spawn: { x: 700, y: 300 } },
      { x: 950, y: 350, w: 50, h: 100, to: 'mine', spawn: { x: 50, y: 300 } }
    ]
  },
  mine: {
    width: 600, height: 500,
    color: '#2a2a3a',
    npcs: [],
    enemies: [
      { type: 'bandit', x: 200, y: 200 },
      { type: 'bandit', x: 300, y: 350 },
      { type: 'bandit', x: 450, y: 250 },
      { type: 'banditchief', x: 500, y: 400 }
    ],
    exits: [
      { x: 0, y: 250, w: 50, h: 100, to: 'forest', spawn: { x: 900, y: 350 } }
    ]
  }
};

// Enemy types
const ENEMY_TYPES = {
  wolf: { hp: 25, damage: 6, speed: 100, range: 30, color: '#666', size: 14, xp: 15 },
  bandit: { hp: 40, damage: 8, speed: 60, range: 25, color: '#8B4513', size: 16, xp: 25 },
  banditchief: { hp: 80, damage: 15, speed: 50, range: 30, color: '#CD853F', size: 20, xp: 75 },
  draugr: { hp: 50, damage: 10, speed: 40, range: 25, color: '#4a5568', size: 18, xp: 35 }
};

// Input
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;
  if (game.screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
    startGame();
  }
  if (game.screen === 'gameover' && e.key === 'Enter') {
    resetGame();
  }
  if (e.key === 'Tab' && game.screen === 'game') {
    e.preventDefault();
    game.screen = 'inventory';
  } else if (e.key === 'Tab' && game.screen === 'inventory') {
    e.preventDefault();
    game.screen = 'game';
  }
  if (e.key === 'Escape') {
    if (game.screen === 'inventory' || game.screen === 'dialogue') {
      game.screen = 'game';
      game.dialogue = null;
    }
  }
  // Use potion with 1 key
  if (e.key === '1' && game.screen === 'game') {
    usePotion();
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = e.clientX - rect.left;
  game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
  game.mouse.clicked = true;
});

function startGame() {
  game.screen = 'game';
  loadZone('riverwood');
}

function resetGame() {
  game.player = {
    x: 300, y: 300,
    vx: 0, vy: 0,
    hp: 100, maxHp: 100,
    magicka: 50, maxMagicka: 50,
    stamina: 100, maxStamina: 100,
    gold: 50,
    level: 1,
    xp: { combat: 0, magic: 0, stealth: 0 },
    skills: { combat: 1, magic: 1, stealth: 1 },
    perks: [],
    equipment: {
      weapon: { name: 'Iron Sword', damage: 8, type: 'melee' },
      armor: { name: 'Leather Armor', defense: 15 }
    },
    inventory: [
      { name: 'Health Potion', type: 'potion', effect: 'hp', amount: 25, count: 3 }
    ],
    facing: 'down',
    attacking: false,
    attackTimer: 0,
    invincible: 0
  };
  game.quests = {
    active: [{ id: 'main1', name: 'Reach Riverwood', stage: 1, desc: 'Find the village of Riverwood' }],
    completed: []
  };
  game.screen = 'title';
}

function loadZone(zoneName) {
  game.zone = zoneName;
  const zone = ZONES[zoneName];

  // Spawn enemies
  game.enemies = [];
  for (const e of zone.enemies) {
    const type = ENEMY_TYPES[e.type];
    game.enemies.push({
      type: e.type,
      x: e.x, y: e.y,
      hp: type.hp, maxHp: type.hp,
      damage: type.damage,
      speed: type.speed,
      range: type.range,
      color: type.color,
      size: type.size,
      xp: type.xp,
      state: 'idle',
      target: null,
      attackCooldown: 0
    });
  }

  // Spawn NPCs
  game.npcs = zone.npcs.map(n => ({ ...n }));

  // Spawn items (random loot)
  game.items = [];
  if (Math.random() < 0.5) {
    game.items.push({
      x: Math.random() * (zone.width - 100) + 50,
      y: Math.random() * (zone.height - 100) + 50,
      type: 'gold',
      amount: Math.floor(Math.random() * 20) + 5
    });
  }

  addMessage(`Entered ${zoneName.charAt(0).toUpperCase() + zoneName.slice(1)}`);
}

function usePotion() {
  const p = game.player;
  const potion = p.inventory.find(i => i.type === 'potion' && i.count > 0);
  if (potion) {
    if (potion.effect === 'hp') {
      p.hp = Math.min(p.maxHp, p.hp + potion.amount);
      addMessage(`Used ${potion.name}, +${potion.amount} HP`);
    }
    potion.count--;
    if (potion.count <= 0) {
      p.inventory = p.inventory.filter(i => i !== potion);
    }
  }
}

function addMessage(text) {
  game.messages.push({ text, life: 3 });
}

// Update
function update(dt) {
  game.time += dt;

  if (game.screen === 'game') {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    checkZoneExits();
    checkItemPickup();
    checkNPCInteraction();
  }

  // Messages
  game.messages = game.messages.filter(m => {
    m.life -= dt;
    return m.life > 0;
  });

  game.mouse.clicked = false;
}

function updatePlayer(dt) {
  const p = game.player;
  const speed = game.keys['shift'] && p.stamina > 0 ? 140 : 80;

  // Movement
  p.vx = 0;
  p.vy = 0;

  if (game.keys['w'] || game.keys['arrowup']) { p.vy = -speed; p.facing = 'up'; }
  if (game.keys['s'] || game.keys['arrowdown']) { p.vy = speed; p.facing = 'down'; }
  if (game.keys['a'] || game.keys['arrowleft']) { p.vx = -speed; p.facing = 'left'; }
  if (game.keys['d'] || game.keys['arrowright']) { p.vx = speed; p.facing = 'right'; }

  // Normalize diagonal
  if (p.vx !== 0 && p.vy !== 0) {
    p.vx *= 0.707;
    p.vy *= 0.707;
  }

  // Sprint stamina
  if (game.keys['shift'] && (p.vx !== 0 || p.vy !== 0)) {
    p.stamina -= 5 * dt;
  } else {
    p.stamina = Math.min(p.maxStamina, p.stamina + 10 * dt);
  }

  // Apply movement
  const zone = ZONES[game.zone];
  p.x = Math.max(16, Math.min(zone.width - 16, p.x + p.vx * dt));
  p.y = Math.max(16, Math.min(zone.height - 16, p.y + p.vy * dt));

  // Attack
  if (p.attackTimer > 0) {
    p.attackTimer -= dt;
    if (p.attackTimer <= 0) p.attacking = false;
  }

  if (game.mouse.clicked && !p.attacking && p.stamina >= 10) {
    p.attacking = true;
    p.attackTimer = 0.3;
    p.stamina -= 10;

    // Calculate attack direction
    const worldMouseX = game.mouse.x + game.camera.x;
    const worldMouseY = game.mouse.y + game.camera.y;
    const angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    // Check hits
    const weapon = p.equipment.weapon;
    const range = weapon.type === 'melee' ? 40 : 200;

    for (const enemy of game.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const enemyAngle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angle - enemyAngle);

      if (dist < range && angleDiff < Math.PI / 3) {
        // Hit!
        const skillMult = 1 + p.skills.combat * 0.05;
        const damage = Math.floor(weapon.damage * skillMult);
        enemy.hp -= damage;

        addParticles(enemy.x, enemy.y, '#f00', 5);
        addMessage(`Hit ${enemy.type} for ${damage}!`);

        // Gain combat XP
        p.xp.combat += damage;
        checkLevelUp();

        if (enemy.hp <= 0) {
          // Enemy death
          p.gold += Math.floor(Math.random() * 15) + 5;
          addMessage(`${enemy.type} defeated! +${enemy.xp} XP`);

          // Drop loot
          if (Math.random() < 0.3) {
            game.items.push({
              x: enemy.x, y: enemy.y,
              type: 'potion',
              item: { name: 'Health Potion', type: 'potion', effect: 'hp', amount: 25, count: 1 }
            });
          }
        }
      }
    }
  }

  // Invincibility frames
  if (p.invincible > 0) p.invincible -= dt;

  // Camera
  game.camera.x = Math.max(0, Math.min(zone.width - WIDTH, p.x - WIDTH / 2));
  game.camera.y = Math.max(0, Math.min(zone.height - HEIGHT, p.y - HEIGHT / 2));
}

function updateEnemies(dt) {
  const p = game.player;

  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;

    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Detection
    if (dist < 150) {
      enemy.state = 'chase';
      enemy.target = { x: p.x, y: p.y };
    } else if (dist > 250) {
      enemy.state = 'idle';
    }

    // Movement
    if (enemy.state === 'chase' && dist > enemy.range) {
      const speed = enemy.speed * dt;
      enemy.x += (dx / dist) * speed;
      enemy.y += (dy / dist) * speed;
    }

    // Attack
    if (enemy.attackCooldown > 0) {
      enemy.attackCooldown -= dt;
    } else if (dist < enemy.range && enemy.state === 'chase') {
      // Attack player
      if (p.invincible <= 0) {
        const defense = p.equipment.armor?.defense || 0;
        const damage = Math.max(1, enemy.damage - Math.floor(defense / 4));
        p.hp -= damage;
        p.invincible = 0.5;
        addMessage(`${enemy.type} hit you for ${damage}!`);
        addParticles(p.x, p.y, '#ff0', 5);

        if (p.hp <= 0) {
          game.screen = 'gameover';
        }
      }
      enemy.attackCooldown = 1;
    }
  }
}

function updateProjectiles(dt) {
  game.projectiles = game.projectiles.filter(proj => {
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;
    return proj.life > 0;
  });
}

function updateParticles(dt) {
  game.particles = game.particles.filter(part => {
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.life -= dt;
    return part.life > 0;
  });
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 100,
      vy: (Math.random() - 0.5) * 100,
      color,
      life: 0.5
    });
  }
}

function checkZoneExits() {
  const zone = ZONES[game.zone];
  const p = game.player;

  for (const exit of zone.exits) {
    if (p.x >= exit.x && p.x <= exit.x + exit.w &&
        p.y >= exit.y && p.y <= exit.y + exit.h) {
      p.x = exit.spawn.x;
      p.y = exit.spawn.y;
      loadZone(exit.to);
      break;
    }
  }
}

function checkItemPickup() {
  const p = game.player;

  for (let i = game.items.length - 1; i >= 0; i--) {
    const item = game.items[i];
    const dx = p.x - item.x;
    const dy = p.y - item.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      if (item.type === 'gold') {
        p.gold += item.amount;
        addMessage(`+${item.amount} gold`);
      } else if (item.type === 'potion') {
        // Add to inventory
        const existing = p.inventory.find(i => i.name === item.item.name);
        if (existing) {
          existing.count++;
        } else {
          p.inventory.push({ ...item.item });
        }
        addMessage(`Picked up ${item.item.name}`);
      }
      game.items.splice(i, 1);
    }
  }
}

function checkNPCInteraction() {
  if (!game.keys['e']) return;
  game.keys['e'] = false;

  const p = game.player;
  for (const npc of game.npcs) {
    const dx = p.x - npc.x;
    const dy = p.y - npc.y;
    if (Math.sqrt(dx * dx + dy * dy) < 40) {
      // Start dialogue
      game.dialogue = {
        npc: npc.name,
        text: npc.dialogue[0].text,
        responses: npc.dialogue[0].responses
      };
      game.screen = 'dialogue';
      break;
    }
  }
}

function checkLevelUp() {
  const p = game.player;
  const xpNeeded = 100 * p.level;

  // Check each skill
  for (const skill of ['combat', 'magic', 'stealth']) {
    while (p.xp[skill] >= xpNeeded && p.skills[skill] < 10) {
      p.xp[skill] -= xpNeeded;
      p.skills[skill]++;
      addMessage(`${skill.charAt(0).toUpperCase() + skill.slice(1)} skill increased to ${p.skills[skill]}!`);
    }
  }

  // Character level is average of skills
  const avgSkill = Math.floor((p.skills.combat + p.skills.magic + p.skills.stealth) / 3);
  if (avgSkill > p.level) {
    p.level = avgSkill;
    p.maxHp += 10;
    p.maxMagicka += 5;
    p.maxStamina += 5;
    p.hp = p.maxHp;
    p.magicka = p.maxMagicka;
    p.stamina = p.maxStamina;
    addMessage(`Level up! Now level ${p.level}`);
  }
}

// Render
function render() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  switch (game.screen) {
    case 'title': renderTitle(); break;
    case 'game': renderGame(); break;
    case 'inventory': renderInventory(); break;
    case 'dialogue': renderDialogue(); break;
    case 'gameover': renderGameOver(); break;
  }
}

function renderTitle() {
  // Background mountains
  ctx.fillStyle = '#2a3a4a';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(160, 180);
  ctx.lineTo(320, 280);
  ctx.lineTo(480, 150);
  ctx.lineTo(640, 250);
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.fill();

  // Snow caps
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(140, 200);
  ctx.lineTo(160, 180);
  ctx.lineTo(180, 200);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(460, 170);
  ctx.lineTo(480, 150);
  ctx.lineTo(500, 170);
  ctx.fill();

  // Title
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 42px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('FROSTFALL', WIDTH/2, 100);

  ctx.fillStyle = '#aaa';
  ctx.font = '18px Georgia';
  ctx.fillText('A 2D Skyrim Demake', WIDTH/2, 140);

  ctx.fillStyle = '#fff';
  ctx.font = '16px Georgia';
  ctx.fillText('Press ENTER to Begin', WIDTH/2, 350);

  ctx.fillStyle = '#888';
  ctx.font = '12px Georgia';
  ctx.fillText('WASD: Move | Click: Attack | Shift: Sprint | E: Interact | Tab: Inventory', WIDTH/2, 420);
  ctx.fillText('1: Use Health Potion', WIDTH/2, 440);
}

function renderGame() {
  const zone = ZONES[game.zone];
  const cam = game.camera;

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Background
  ctx.fillStyle = zone.color;
  ctx.fillRect(0, 0, zone.width, zone.height);

  // Grid for visual texture
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  for (let x = 0; x < zone.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, zone.height);
    ctx.stroke();
  }
  for (let y = 0; y < zone.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(zone.width, y);
    ctx.stroke();
  }

  // Exits
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  for (const exit of zone.exits) {
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(exit.to, exit.x + exit.w/2, exit.y + exit.h/2);
  }

  // Items
  for (const item of game.items) {
    if (item.type === 'gold') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'potion') {
      ctx.fillStyle = '#f00';
      ctx.fillRect(item.x - 5, item.y - 8, 10, 16);
    }
  }

  // NPCs
  for (const npc of game.npcs) {
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(npc.x - 10, npc.y - 15, 20, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, npc.x, npc.y - 20);
  }

  // Enemies
  for (const enemy of game.enemies) {
    if (enemy.hp <= 0) continue;

    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    ctx.fillStyle = '#300';
    ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 8, 30, 4);
    ctx.fillStyle = '#f00';
    ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 8, 30 * (enemy.hp / enemy.maxHp), 4);
  }

  // Player
  const p = game.player;
  const flash = p.invincible > 0 && Math.floor(game.time * 10) % 2;

  if (!flash) {
    // Body
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(p.x - 8, p.y - 12, 16, 24);

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(p.x - 6, p.y - 18, 12, 10);

    // Weapon swing effect
    if (p.attacking) {
      const worldMouseX = game.mouse.x + cam.x;
      const worldMouseY = game.mouse.y + cam.y;
      const angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(angle) * 35, p.y + Math.sin(angle) * 35);
      ctx.stroke();
    }
  }

  // Particles
  for (const part of game.particles) {
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.life * 2;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // HUD
  renderHUD();
}

function renderHUD() {
  const p = game.player;

  // Health bar
  ctx.fillStyle = '#300';
  ctx.fillRect(10, 10, 150, 16);
  ctx.fillStyle = '#f00';
  ctx.fillRect(10, 10, 150 * (p.hp / p.maxHp), 16);
  ctx.fillStyle = '#fff';
  ctx.font = '10px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`HP: ${Math.floor(p.hp)}/${p.maxHp}`, 15, 22);

  // Magicka bar
  ctx.fillStyle = '#006';
  ctx.fillRect(10, 30, 100, 12);
  ctx.fillStyle = '#00f';
  ctx.fillRect(10, 30, 100 * (p.magicka / p.maxMagicka), 12);
  ctx.fillText(`MP: ${Math.floor(p.magicka)}/${p.maxMagicka}`, 15, 40);

  // Stamina bar
  ctx.fillStyle = '#030';
  ctx.fillRect(10, 46, 100, 12);
  ctx.fillStyle = '#0f0';
  ctx.fillRect(10, 46, 100 * (p.stamina / p.maxStamina), 12);
  ctx.fillText(`ST: ${Math.floor(p.stamina)}/${p.maxStamina}`, 15, 56);

  // Gold
  ctx.fillStyle = '#ffd700';
  ctx.font = '14px Georgia';
  ctx.fillText(`Gold: ${p.gold}`, 10, 80);

  // Level
  ctx.fillStyle = '#fff';
  ctx.fillText(`Level ${p.level}`, 10, 100);

  // Active quest
  if (game.quests.active.length > 0) {
    const quest = game.quests.active[0];
    ctx.fillStyle = '#d4af37';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(quest.name, WIDTH - 10, 20);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Georgia';
    ctx.fillText(quest.desc, WIDTH - 10, 35);
  }

  // Quick slot
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(WIDTH/2 - 20, HEIGHT - 40, 40, 30);
  ctx.fillStyle = '#fff';
  ctx.font = '10px Georgia';
  ctx.textAlign = 'center';
  const potion = p.inventory.find(i => i.type === 'potion');
  ctx.fillText('[1] Potion', WIDTH/2, HEIGHT - 28);
  ctx.fillText(potion ? `x${potion.count}` : 'x0', WIDTH/2, HEIGHT - 15);

  // Messages
  ctx.textAlign = 'center';
  let msgY = 130;
  for (const msg of game.messages) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, msg.life)})`;
    ctx.font = '14px Georgia';
    ctx.fillText(msg.text, WIDTH/2, msgY);
    msgY += 20;
  }

  // Controls hint
  ctx.fillStyle = '#666';
  ctx.font = '10px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('E: Interact | Tab: Inventory', 10, HEIGHT - 10);
}

function renderInventory() {
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const p = game.player;

  // Title
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 24px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('INVENTORY', WIDTH/2, 40);

  // Stats
  ctx.fillStyle = '#fff';
  ctx.font = '14px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(`Level: ${p.level}`, 50, 80);
  ctx.fillText(`Gold: ${p.gold}`, 50, 100);

  // Skills
  ctx.fillText('Skills:', 50, 140);
  ctx.fillText(`  Combat: ${p.skills.combat}`, 50, 160);
  ctx.fillText(`  Magic: ${p.skills.magic}`, 50, 180);
  ctx.fillText(`  Stealth: ${p.skills.stealth}`, 50, 200);

  // Equipment
  ctx.fillText('Equipment:', 250, 80);
  ctx.fillText(`  Weapon: ${p.equipment.weapon?.name || 'None'}`, 250, 100);
  ctx.fillText(`  Armor: ${p.equipment.armor?.name || 'None'}`, 250, 120);

  // Inventory items
  ctx.fillText('Items:', 250, 160);
  let y = 180;
  for (const item of p.inventory) {
    ctx.fillText(`  ${item.name} x${item.count}`, 250, y);
    y += 20;
  }

  // Quests
  ctx.fillText('Quests:', 450, 80);
  y = 100;
  for (const quest of game.quests.active) {
    ctx.fillStyle = '#d4af37';
    ctx.fillText(`  ${quest.name}`, 450, y);
    ctx.fillStyle = '#888';
    ctx.fillText(`    ${quest.desc}`, 450, y + 15);
    y += 40;
  }

  // Close hint
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText('Press TAB or ESC to close', WIDTH/2, HEIGHT - 30);
}

function renderDialogue() {
  // Darken game
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Dialogue box
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(50, HEIGHT - 200, WIDTH - 100, 150);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, HEIGHT - 200, WIDTH - 100, 150);

  const d = game.dialogue;
  if (!d) return;

  // NPC name
  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 16px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText(d.npc, 70, HEIGHT - 175);

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = '14px Georgia';
  ctx.fillText(d.text, 70, HEIGHT - 150);

  // Responses
  ctx.fillStyle = '#aaa';
  let y = HEIGHT - 110;
  for (let i = 0; i < d.responses.length; i++) {
    ctx.fillText(`[${i + 1}] ${d.responses[i].text}`, 70, y);
    y += 25;

    // Check key press
    if (game.keys[(i + 1).toString()]) {
      game.keys[(i + 1).toString()] = false;
      const action = d.responses[i].action;
      if (action === 'close') {
        game.screen = 'game';
        game.dialogue = null;
      }
      // Could add shop/quest actions here
    }
  }
}

function renderGameOver() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#8B0000';
  ctx.font = 'bold 48px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('YOU DIED', WIDTH/2, 200);

  ctx.fillStyle = '#888';
  ctx.font = '16px Georgia';
  ctx.fillText(`Reached Level ${game.player.level}`, WIDTH/2, 280);
  ctx.fillText(`Gold Collected: ${game.player.gold}`, WIDTH/2, 310);

  ctx.fillStyle = '#fff';
  ctx.font = '18px Georgia';
  ctx.fillText('Press ENTER to try again', WIDTH/2, 400);
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
console.log('Frostfall initialized! Press ENTER to begin.');
