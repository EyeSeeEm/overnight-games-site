// Frostfall - 2D Skyrim Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_W = 80;
const MAP_H = 60;

// Game state
let state = 'menu'; // menu, playing, inventory, shop, dialogue, dungeon, victory
let currentZone = 'village';
let dungeonLevel = 0;
let screenShake = 0;
let damageFlash = 0;

// Player
const player = {
    x: 400, y: 300,
    hp: 100, maxHp: 100,
    stamina: 100, maxStamina: 100,
    level: 1,
    xp: 0,
    xpToLevel: 100,
    gold: 50,
    damage: 10,
    armor: 0,
    attackCooldown: 0,
    invincible: 0,
    equipment: {
        weapon: null,
        body: null,
        head: null,
        ring: null
    },
    inventory: [],
    perks: []
};

// Weapons and armor
const WEAPONS = {
    ironSword: { name: 'Iron Sword', damage: 8, price: 50 },
    steelSword: { name: 'Steel Sword', damage: 12, price: 120 },
    ironGreatsword: { name: 'Iron Greatsword', damage: 15, price: 80 },
    steelGreatsword: { name: 'Steel Greatsword', damage: 22, price: 180 }
};

const ARMOR = {
    leather: { name: 'Leather Armor', armor: 10, price: 40, slot: 'body' },
    iron: { name: 'Iron Armor', armor: 20, price: 100, slot: 'body' },
    steel: { name: 'Steel Armor', armor: 30, price: 200, slot: 'body' },
    leatherHelm: { name: 'Leather Helm', armor: 5, price: 20, slot: 'head' },
    ironHelm: { name: 'Iron Helm', armor: 10, price: 50, slot: 'head' }
};

// Quests
const quests = [
    { id: 'banditCamp', name: 'Clear Forest Dungeon', target: 'forestBoss', completed: false, reward: 100 },
    { id: 'snowDungeon', name: 'Clear Snow Dungeon', target: 'snowBoss', completed: false, reward: 150 },
    { id: 'mountainDungeon', name: 'Clear Mountain Dungeon', target: 'mountainBoss', completed: false, reward: 200 }
];

// Enemies
let enemies = [];

// NPCs
const npcs = [];

// Camera
const camera = { x: 0, y: 0 };

// Map data
let map = [];
let dungeonMap = [];

// Zones data
const zones = {
    village: { enemies: [], color: '#3a5a3a', name: 'Riverwood Village' },
    forest: { enemies: ['wolf', 'bandit'], color: '#2a4a2a', name: 'Pine Forest' },
    snow: { enemies: ['frostWolf', 'draugr'], color: '#a0b0c0', name: 'Frozen Wastes' },
    mountain: { enemies: ['bear', 'troll'], color: '#5a5a5a', name: 'Grey Mountains' }
};

// Enemy types
const ENEMY_DATA = {
    wolf: { name: 'Wolf', hp: 25, damage: 6, speed: 2.5, color: '#6a6a6a', xp: 15, gold: [0, 5] },
    bandit: { name: 'Bandit', hp: 40, damage: 8, speed: 1.8, color: '#8a6a4a', xp: 25, gold: [5, 15] },
    banditChief: { name: 'Bandit Chief', hp: 80, damage: 15, speed: 1.5, color: '#6a4a2a', xp: 80, gold: [25, 50], boss: true },
    frostWolf: { name: 'Frost Wolf', hp: 35, damage: 8, speed: 2.2, color: '#8ac8ff', xp: 20, gold: [0, 8] },
    draugr: { name: 'Draugr', hp: 50, damage: 10, speed: 1.5, color: '#4a6a6a', xp: 30, gold: [5, 20] },
    draugrWight: { name: 'Draugr Wight', hp: 100, damage: 18, speed: 1.3, color: '#2a5a5a', xp: 120, gold: [40, 80], boss: true },
    bear: { name: 'Bear', hp: 60, damage: 12, speed: 1.6, color: '#5a4030', xp: 40, gold: [0, 10] },
    troll: { name: 'Troll', hp: 80, damage: 15, speed: 1.4, color: '#506050', xp: 50, gold: [10, 25] },
    giant: { name: 'Giant', hp: 150, damage: 25, speed: 1.0, color: '#7a8a7a', xp: 200, gold: [100, 150], boss: true }
};

// Zone transitions
const zonePortals = [];

// Current shop NPC
let currentNPC = null;
let dialogueText = '';
let dialogueOptions = [];

// Input
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Generate world
function generateWorld() {
    // Generate overworld map
    map = [];
    for (let y = 0; y < MAP_H; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_W; x++) {
            // Default grass
            let tile = 'grass';

            // Village center
            if (x >= 35 && x <= 45 && y >= 25 && y <= 35) {
                tile = 'path';
            }

            // Buildings in village
            if ((x === 37 && y === 27) || (x === 43 && y === 27) || (x === 40 && y === 32)) {
                tile = 'building';
            }

            // Forest (left side)
            if (x < 25) tile = 'forest';

            // Snow (top)
            if (y < 18) tile = 'snow';

            // Mountain (right)
            if (x > 55) tile = 'mountain';

            // Water/rivers
            if ((x >= 30 && x <= 32 && y >= 15 && y <= 45)) {
                tile = 'water';
            }

            // Dungeon entrances
            if (x === 10 && y === 40) tile = 'dungeon_forest';
            if (x === 40 && y === 8) tile = 'dungeon_snow';
            if (x === 70 && y === 40) tile = 'dungeon_mountain';

            map[y][x] = tile;
        }
    }

    // Add NPCs
    npcs.length = 0;
    npcs.push({ x: 37 * TILE_SIZE + 16, y: 28 * TILE_SIZE + 16, name: 'Alvor', type: 'smith' });
    npcs.push({ x: 43 * TILE_SIZE + 16, y: 28 * TILE_SIZE + 16, name: 'Lucan', type: 'shop' });
    npcs.push({ x: 40 * TILE_SIZE + 16, y: 33 * TILE_SIZE + 16, name: 'Jarl', type: 'quest' });

    // Zone portals/markers
    zonePortals.length = 0;
    zonePortals.push({ x: 15 * TILE_SIZE, y: 30 * TILE_SIZE, zone: 'forest', label: 'Pine Forest' });
    zonePortals.push({ x: 40 * TILE_SIZE, y: 12 * TILE_SIZE, zone: 'snow', label: 'Frozen Wastes' });
    zonePortals.push({ x: 60 * TILE_SIZE, y: 30 * TILE_SIZE, zone: 'mountain', label: 'Grey Mountains' });

    // Position player
    player.x = 40 * TILE_SIZE;
    player.y = 30 * TILE_SIZE;

    spawnEnemies();
}

function spawnEnemies() {
    enemies = [];

    if (currentZone === 'village') return;

    if (state === 'dungeon') {
        // Spawn dungeon enemies
        const dungeonEnemies = {
            forest: ['bandit', 'bandit', 'banditChief'],
            snow: ['draugr', 'draugr', 'draugrWight'],
            mountain: ['troll', 'bear', 'giant']
        };

        const types = dungeonEnemies[currentZone];
        for (let i = 0; i < 8; i++) {
            const type = i < 6 ? types[Math.floor(Math.random() * 2)] : types[2];
            const data = ENEMY_DATA[type];
            enemies.push({
                x: 100 + Math.random() * 400,
                y: 100 + Math.random() * 300,
                type,
                ...data,
                maxHp: data.hp,
                vx: 0, vy: 0,
                state: 'idle',
                hitTimer: 0
            });
        }
    } else {
        // Overworld enemies
        const zoneData = zones[currentZone];
        for (let i = 0; i < 6; i++) {
            const type = zoneData.enemies[Math.floor(Math.random() * zoneData.enemies.length)];
            const data = ENEMY_DATA[type];
            let x, y;
            do {
                x = Math.random() * MAP_W * TILE_SIZE;
                y = Math.random() * MAP_H * TILE_SIZE;
            } while (Math.abs(x - player.x) < 200 && Math.abs(y - player.y) < 200);

            enemies.push({
                x, y,
                type,
                ...data,
                maxHp: data.hp,
                vx: 0, vy: 0,
                state: 'idle',
                hitTimer: 0
            });
        }
    }
}

function generateDungeon() {
    dungeonMap = [];
    for (let y = 0; y < 20; y++) {
        dungeonMap[y] = [];
        for (let x = 0; x < 25; x++) {
            let tile = 'floor';
            // Walls
            if (x === 0 || x === 24 || y === 0 || y === 19) tile = 'wall';
            // Pillars
            if ((x % 5 === 2 && y % 4 === 2) && x > 0 && x < 24) tile = 'pillar';
            dungeonMap[y][x] = tile;
        }
    }
    // Exit
    dungeonMap[19][12] = 'exit';

    player.x = 12 * TILE_SIZE;
    player.y = 2 * TILE_SIZE;
}

// Update
function update(dt) {
    if (state !== 'playing' && state !== 'dungeon') return;

    // Screen shake decay
    screenShake *= 0.9;
    damageFlash *= 0.9;

    updatePlayer(dt);
    updateEnemies(dt);
    checkCollisions();

    // Check quest completion
    checkQuests();
}

function updatePlayer(dt) {
    const speed = 150;
    let dx = 0, dy = 0;

    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Sprint
    let finalSpeed = speed;
    if (keys['shift'] && player.stamina > 0 && (dx !== 0 || dy !== 0)) {
        finalSpeed = speed * 1.5;
        player.stamina -= 15 * dt;
    } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 10 * dt);
    }

    const nx = player.x + dx * finalSpeed * dt;
    const ny = player.y + dy * finalSpeed * dt;

    // Collision check
    if (!isBlocked(nx, player.y)) player.x = nx;
    if (!isBlocked(player.x, ny)) player.y = ny;

    // Clamp to map
    if (state === 'dungeon') {
        player.x = Math.max(TILE_SIZE, Math.min(23 * TILE_SIZE, player.x));
        player.y = Math.max(TILE_SIZE, Math.min(18 * TILE_SIZE, player.y));
    } else {
        player.x = Math.max(0, Math.min(MAP_W * TILE_SIZE - 16, player.x));
        player.y = Math.max(0, Math.min(MAP_H * TILE_SIZE - 16, player.y));
    }

    // Attack cooldown
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.invincible = Math.max(0, player.invincible - dt);

    // Attack on click
    if (mouseDown && player.attackCooldown <= 0) {
        attack();
    }

    // Check zone transitions
    if (state === 'playing') {
        checkZoneTransitions();
    }

    // Check dungeon exit
    if (state === 'dungeon') {
        const tx = Math.floor(player.x / TILE_SIZE);
        const ty = Math.floor(player.y / TILE_SIZE);
        if (dungeonMap[ty] && dungeonMap[ty][tx] === 'exit') {
            exitDungeon();
        }
    }
}

function isBlocked(x, y) {
    if (state === 'dungeon') {
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (!dungeonMap[ty] || !dungeonMap[ty][tx]) return true;
        return dungeonMap[ty][tx] === 'wall' || dungeonMap[ty][tx] === 'pillar';
    } else {
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (!map[ty] || !map[ty][tx]) return true;
        return map[ty][tx] === 'water' || map[ty][tx] === 'building';
    }
}

function attack() {
    player.attackCooldown = 0.4;
    player.stamina = Math.max(0, player.stamina - 10);

    const damage = player.damage + (player.equipment.weapon ? player.equipment.weapon.damage : 0);

    // Find enemies in range
    for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
            enemy.hp -= damage;
            enemy.hitTimer = 0.2;
            enemy.vx = dx / dist * 100;
            enemy.vy = dy / dist * 100;

            if (enemy.hp <= 0) {
                killEnemy(enemy);
            }
        }
    }
}

function killEnemy(enemy) {
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) {
        enemies.splice(idx, 1);

        // Grant XP and gold
        player.xp += enemy.xp;
        const goldDrop = enemy.gold[0] + Math.floor(Math.random() * (enemy.gold[1] - enemy.gold[0] + 1));
        player.gold += goldDrop;

        // Check level up
        while (player.xp >= player.xpToLevel) {
            player.xp -= player.xpToLevel;
            player.level++;
            player.maxHp += 10;
            player.hp = player.maxHp;
            player.damage += 2;
            player.xpToLevel = Math.floor(player.xpToLevel * 1.5);
        }

        // Check if boss killed
        if (enemy.boss) {
            const questMap = {
                banditChief: 'banditCamp',
                draugrWight: 'snowDungeon',
                giant: 'mountainDungeon'
            };
            const questId = questMap[enemy.type];
            const quest = quests.find(q => q.id === questId);
            if (quest && !quest.completed) {
                quest.completed = true;
                player.gold += quest.reward;
            }
        }
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);

        // Apply knockback
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
        enemy.vx *= 0.9;
        enemy.vy *= 0.9;

        // AI
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300 && dist > 30) {
            // Chase
            enemy.x += (dx / dist) * enemy.speed * 60 * dt;
            enemy.y += (dy / dist) * enemy.speed * 60 * dt;
        }

        // Attack
        if (dist < 30 && player.invincible <= 0) {
            const armor = player.armor +
                (player.equipment.body ? player.equipment.body.armor : 0) +
                (player.equipment.head ? player.equipment.head.armor : 0);
            const damage = Math.max(1, enemy.damage - armor / 2);
            player.hp -= damage;
            player.invincible = 0.5;
            screenShake = 10;
            damageFlash = 1;

            if (player.hp <= 0) {
                state = 'menu';
                alert('You died! Press OK to restart.');
                resetGame();
            }
        }
    }
}

function checkCollisions() {
    // Check NPC interaction
    if (keys['e']) {
        for (const npc of npcs) {
            const dx = npc.x - player.x;
            const dy = npc.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                interactNPC(npc);
                keys['e'] = false;
                break;
            }
        }

        // Check dungeon entrance
        const tx = Math.floor(player.x / TILE_SIZE);
        const ty = Math.floor(player.y / TILE_SIZE);
        if (map[ty] && map[ty][tx]) {
            const tile = map[ty][tx];
            if (tile.startsWith('dungeon_')) {
                const zone = tile.replace('dungeon_', '');
                enterDungeon(zone);
                keys['e'] = false;
            }
        }
    }
}

function checkZoneTransitions() {
    const tx = Math.floor(player.x / TILE_SIZE);
    const ty = Math.floor(player.y / TILE_SIZE);
    const tile = map[ty] ? map[ty][tx] : 'grass';

    let newZone = 'village';
    if (tile === 'forest' || (tx < 25 && tile !== 'path')) newZone = 'forest';
    else if (tile === 'snow' || ty < 18) newZone = 'snow';
    else if (tile === 'mountain' || tx > 55) newZone = 'mountain';
    else if (tx >= 33 && tx <= 47 && ty >= 23 && ty <= 37) newZone = 'village';

    if (newZone !== currentZone) {
        currentZone = newZone;
        if (newZone !== 'village') {
            spawnEnemies();
        } else {
            enemies = [];
        }
    }
}

function interactNPC(npc) {
    currentNPC = npc;

    if (npc.type === 'smith') {
        dialogueText = `Welcome to my forge, friend. Need some weapons or armor?`;
        dialogueOptions = [
            { text: 'Buy Iron Sword (50g)', action: () => buyItem('weapon', WEAPONS.ironSword) },
            { text: 'Buy Steel Sword (120g)', action: () => buyItem('weapon', WEAPONS.steelSword) },
            { text: 'Buy Leather Armor (40g)', action: () => buyItem('armor', ARMOR.leather) },
            { text: 'Buy Iron Armor (100g)', action: () => buyItem('armor', ARMOR.iron) },
            { text: 'Leave', action: () => { state = 'playing'; } }
        ];
        state = 'dialogue';
    } else if (npc.type === 'shop') {
        dialogueText = `Looking for potions and supplies?`;
        dialogueOptions = [
            { text: 'Buy Health Potion (30g)', action: () => buyPotion() },
            { text: 'Leave', action: () => { state = 'playing'; } }
        ];
        state = 'dialogue';
    } else if (npc.type === 'quest') {
        const activeQuest = quests.find(q => !q.completed);
        if (activeQuest) {
            dialogueText = `The land needs your help! ${activeQuest.name}. Clear the dungeon to earn ${activeQuest.reward} gold.`;
        } else {
            dialogueText = `You've cleared all the dungeons! You are the true Dragonborn!`;
        }
        dialogueOptions = [
            { text: 'I will do it!', action: () => { state = 'playing'; } }
        ];
        state = 'dialogue';
    }
}

function buyItem(type, item) {
    if (player.gold >= item.price) {
        player.gold -= item.price;
        if (type === 'weapon') {
            player.equipment.weapon = item;
        } else {
            const slot = item.slot || 'body';
            player.equipment[slot] = item;
        }
    }
}

function buyPotion() {
    if (player.gold >= 30) {
        player.gold -= 30;
        player.hp = Math.min(player.maxHp, player.hp + 50);
    }
}

function enterDungeon(zone) {
    currentZone = zone;
    state = 'dungeon';
    generateDungeon();
    spawnEnemies();
}

function exitDungeon() {
    state = 'playing';
    currentZone = 'village';
    player.x = 40 * TILE_SIZE;
    player.y = 30 * TILE_SIZE;
    enemies = [];
}

function checkQuests() {
    const allComplete = quests.every(q => q.completed);
    if (allComplete && state !== 'victory') {
        state = 'victory';
    }
}

function resetGame() {
    player.hp = 100;
    player.maxHp = 100;
    player.stamina = 100;
    player.level = 1;
    player.xp = 0;
    player.xpToLevel = 100;
    player.gold = 50;
    player.damage = 10;
    player.equipment = { weapon: null, body: null, head: null, ring: null };
    quests.forEach(q => q.completed = false);
    currentZone = 'village';
    generateWorld();
    state = 'menu';
}

// Render
function render() {
    // Apply screen shake
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }

    // Damage flash
    if (damageFlash > 0.1) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (state === 'menu') {
        renderMenu();
    } else if (state === 'dialogue') {
        renderGame();
        renderDialogue();
    } else if (state === 'victory') {
        renderVictory();
    } else {
        renderGame();
    }

    ctx.restore();
}

function renderMenu() {
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mountains background
    ctx.fillStyle = '#2a3a4a';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(150, 150);
    ctx.lineTo(300, 280);
    ctx.lineTo(450, 120);
    ctx.lineTo(640, 250);
    ctx.lineTo(640, 480);
    ctx.lineTo(0, 480);
    ctx.fill();

    ctx.fillStyle = '#d4a060';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('FROSTFALL', canvas.width / 2, 150);

    ctx.fillStyle = '#8ac';
    ctx.font = '18px Georgia';
    ctx.fillText('A 2D Skyrim Adventure', canvas.width / 2, 190);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Georgia';
    ctx.fillText('Press ENTER to Begin', canvas.width / 2, 320);

    ctx.fillStyle = '#888';
    ctx.font = '14px Georgia';
    ctx.fillText('WASD: Move | Click: Attack | E: Interact | Shift: Sprint', canvas.width / 2, 420);
    ctx.fillText('Clear all 3 dungeons to become the Dragonborn!', canvas.width / 2, 445);
}

function renderGame() {
    // Update camera
    if (state === 'dungeon') {
        camera.x = 0;
        camera.y = 0;
    } else {
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;
        camera.x = Math.max(0, Math.min(MAP_W * TILE_SIZE - canvas.width, camera.x));
        camera.y = Math.max(0, Math.min(MAP_H * TILE_SIZE - canvas.height, camera.y));
    }

    // Background
    const zoneColor = zones[currentZone]?.color || '#2a3a2a';
    ctx.fillStyle = zoneColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map
    if (state === 'dungeon') {
        renderDungeon();
    } else {
        renderOverworld();
    }

    // Draw enemies
    for (const enemy of enemies) {
        const sx = enemy.x - camera.x;
        const sy = enemy.y - camera.y;

        if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) continue;

        // Hit flash
        ctx.fillStyle = enemy.hitTimer > 0 ? '#fff' : enemy.color;
        ctx.fillRect(sx - 12, sy - 12, 24, 24);

        // HP bar
        const hpPct = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#400';
        ctx.fillRect(sx - 15, sy - 22, 30, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#4a4' : (hpPct > 0.25 ? '#aa4' : '#a44');
        ctx.fillRect(sx - 15, sy - 22, 30 * hpPct, 4);

        // Boss indicator
        if (enemy.boss) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx - 14, sy - 14, 28, 28);
        }
    }

    // Draw NPCs
    if (state !== 'dungeon') {
        for (const npc of npcs) {
            const sx = npc.x - camera.x;
            const sy = npc.y - camera.y;

            ctx.fillStyle = '#4a8aaa';
            ctx.fillRect(sx - 10, sy - 12, 20, 24);

            // Name
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, sx, sy - 18);
        }
    }

    // Draw player
    const px = player.x - camera.x;
    const py = player.y - camera.y;

    ctx.fillStyle = player.invincible > 0 && Math.floor(player.invincible * 10) % 2 ? '#aaa' : '#4a6aaa';
    ctx.fillRect(px - 10, py - 12, 20, 24);

    // Attack indicator
    if (player.attackCooldown > 0.2) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 40, 0, Math.PI * 2);
        ctx.stroke();
    }

    // HUD
    renderHUD();
}

function renderOverworld() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(MAP_W, startX + Math.ceil(canvas.width / TILE_SIZE) + 1);
    const endY = Math.min(MAP_H, startY + Math.ceil(canvas.height / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            if (!map[y] || !map[y][x]) continue;

            const tile = map[y][x];
            const sx = x * TILE_SIZE - camera.x;
            const sy = y * TILE_SIZE - camera.y;

            const colors = {
                grass: '#3a6a3a',
                path: '#8a7a6a',
                forest: '#1a4a2a',
                snow: '#c0d0e0',
                mountain: '#6a6a6a',
                water: '#2a4a8a',
                building: '#5a4a3a',
                dungeon_forest: '#4a2a2a',
                dungeon_snow: '#2a4a6a',
                dungeon_mountain: '#3a3a3a'
            };

            ctx.fillStyle = colors[tile] || '#3a6a3a';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

            // Dungeon entrance marker
            if (tile.startsWith('dungeon_')) {
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('D', sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 + 7);
            }
        }
    }

    // Zone markers
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (const portal of zonePortals) {
        const sx = portal.x - camera.x;
        const sy = portal.y - camera.y;
        if (sx > -100 && sx < canvas.width + 100 && sy > -100 && sy < canvas.height + 100) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(portal.label, sx, sy - 10);
            ctx.fillStyle = '#ffd700';
            ctx.fillText('>>>', sx, sy + 5);
        }
    }
}

function renderDungeon() {
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 25; x++) {
            const tile = dungeonMap[y][x];
            const sx = x * TILE_SIZE;
            const sy = y * TILE_SIZE;

            const colors = {
                floor: '#3a3a4a',
                wall: '#2a2a3a',
                pillar: '#4a4a5a',
                exit: '#4a6a4a'
            };

            ctx.fillStyle = colors[tile] || '#3a3a4a';
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

            if (tile === 'exit') {
                ctx.fillStyle = '#8f8';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('EXIT', sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 + 4);
            }
        }
    }
}

function renderHUD() {
    // Health bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, 10, 200, 50);

    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP', 15, 26);

    ctx.fillStyle = '#400';
    ctx.fillRect(35, 14, 160, 14);
    ctx.fillStyle = player.hp > player.maxHp * 0.5 ? '#a44' : '#f44';
    ctx.fillRect(35, 14, (player.hp / player.maxHp) * 160, 14);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, 100, 26);

    // Stamina bar
    ctx.fillStyle = '#888';
    ctx.fillText('ST', 15, 44);
    ctx.fillStyle = '#240';
    ctx.fillRect(35, 32, 160, 14);
    ctx.fillStyle = '#4a4';
    ctx.fillRect(35, 32, (player.stamina / player.maxStamina) * 160, 14);

    // Stats
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width - 130, 10, 120, 70);

    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Gold: ${player.gold}`, canvas.width - 125, 28);

    ctx.fillStyle = '#8af';
    ctx.fillText(`Level: ${player.level}`, canvas.width - 125, 46);

    ctx.fillStyle = '#888';
    ctx.fillText(`XP: ${player.xp}/${player.xpToLevel}`, canvas.width - 125, 64);

    // Zone name
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width / 2 - 80, 10, 160, 25);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(zones[currentZone]?.name || currentZone, canvas.width / 2, 28);

    // Equipment
    ctx.textAlign = 'left';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#aaa';
    const weapon = player.equipment.weapon;
    const armor = player.equipment.body;
    ctx.fillText(`Weapon: ${weapon ? weapon.name : 'Fists'}`, 15, canvas.height - 30);
    ctx.fillText(`Armor: ${armor ? armor.name : 'None'}`, 15, canvas.height - 15);

    // Quest tracker
    const activeQuest = quests.find(q => !q.completed);
    if (activeQuest) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, 70, 180, 25);
        ctx.fillStyle = '#fa0';
        ctx.font = '11px Arial';
        ctx.fillText(`Quest: ${activeQuest.name}`, 15, 87);
    }

    // Controls hint
    if (state === 'playing') {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('[E] Interact with NPCs | [D] for Dungeon entrances', canvas.width / 2, canvas.height - 10);
    }
}

function renderDialogue() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(50, canvas.height - 200, canvas.width - 100, 180);
    ctx.strokeStyle = '#8a7a6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, canvas.height - 200, canvas.width - 100, 180);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(currentNPC?.name || 'NPC', 70, canvas.height - 175);

    ctx.fillStyle = '#ddd';
    ctx.font = '14px Georgia';
    ctx.fillText(dialogueText, 70, canvas.height - 150);

    ctx.font = '14px Arial';
    for (let i = 0; i < dialogueOptions.length; i++) {
        const opt = dialogueOptions[i];
        ctx.fillStyle = '#8af';
        ctx.fillText(`[${i + 1}] ${opt.text}`, 70, canvas.height - 110 + i * 22);
    }
}

function renderVictory() {
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('DRAGONBORN!', canvas.width / 2, 150);

    ctx.fillStyle = '#8f8';
    ctx.font = '24px Georgia';
    ctx.fillText('You have cleared all dungeons!', canvas.width / 2, 220);

    ctx.fillStyle = '#d4a060';
    ctx.font = '18px Georgia';
    ctx.fillText(`Final Level: ${player.level}`, canvas.width / 2, 280);
    ctx.fillText(`Gold Earned: ${player.gold}`, canvas.width / 2, 310);

    ctx.fillStyle = '#ffd700';
    ctx.font = '20px Georgia';
    ctx.fillText('Press ENTER to play again', canvas.width / 2, 400);
}

// Input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (state === 'menu' && e.key === 'Enter') {
        generateWorld();
        state = 'playing';
    } else if (state === 'victory' && e.key === 'Enter') {
        resetGame();
        generateWorld();
        state = 'playing';
    } else if (state === 'dialogue') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= dialogueOptions.length) {
            dialogueOptions[num - 1].action();
        }
    } else if (state === 'playing' || state === 'dungeon') {
        if (e.key === 'Tab') {
            e.preventDefault();
            // Simple inventory display
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouseDown = true);
canvas.addEventListener('mouseup', () => mouseDown = false);

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
