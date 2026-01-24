// Frostfall - A 2D Skyrim Demake
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== CONSTANTS ====================
const TILE_SIZE = 16;
const SCALE = 3;
const VIEW_WIDTH = 60;
const VIEW_HEIGHT = 34;
const WORLD_WIDTH = 200;
const WORLD_HEIGHT = 200;

// Colors - Nordic fantasy palette
const COLORS = {
    // UI
    uiBg: '#1a1a2a',
    uiBorder: '#3a3a5a',
    uiText: '#e0d0b0',
    uiTextDim: '#8a8a7a',
    healthBar: '#8a2020',
    healthBarBg: '#2a1515',
    manaBar: '#2040a0',
    manaBarBg: '#151525',
    staminaBar: '#20802a',
    staminaBarBg: '#152015',
    // Tiles - Forest
    grass1: '#2a4a2a',
    grass2: '#254525',
    grass3: '#2f4f2f',
    dirt: '#4a3a2a',
    path: '#5a4a3a',
    water: '#2040a0',
    waterDeep: '#102060',
    tree1: '#1a3a1a',
    tree2: '#153515',
    // Tiles - Snow
    snow1: '#d0d8e0',
    snow2: '#c0c8d0',
    snow3: '#b0b8c0',
    ice: '#8090b0',
    // Tiles - Mountain
    rock1: '#5a5a6a',
    rock2: '#4a4a5a',
    mountain: '#6a6a7a',
    // Buildings
    woodWall: '#5a4030',
    woodDark: '#3a2820',
    woodLight: '#6a5040',
    stoneWall: '#5a5a5a',
    roof: '#4a3020',
    // Characters
    player: '#6080a0',
    playerArmor: '#4a6080',
    npc: '#907050',
    enemy: '#804040',
    enemyUndead: '#506080'
};

// Game states
const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    INVENTORY: 'inventory',
    DIALOGUE: 'dialogue',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// Tile types
const TILE = {
    GRASS: 0,
    DIRT: 1,
    PATH: 2,
    WATER: 3,
    TREE: 4,
    ROCK: 5,
    SNOW: 6,
    ICE: 7,
    MOUNTAIN: 8,
    WALL: 9,
    FLOOR: 10,
    DOOR: 11
};

// Biome types
const BIOME = {
    FOREST: 'forest',
    SNOW: 'snow',
    MOUNTAIN: 'mountain',
    VILLAGE: 'village'
};

// ==================== GAME STATE ====================
let game = {
    state: STATE.MENU,
    time: 0,
    dayTime: 0.5, // 0-1, noon = 0.5
    player: null,
    camera: { x: 0, y: 0 },
    world: [],
    biomeMap: [],
    entities: [],
    npcs: [],
    items: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    buildings: [],
    quests: [],
    activeQuest: null,
    dialogueState: null,
    showDebug: false,
    keys: {},
    mouse: { x: 0, y: 0, down: false, rightDown: false },
    screenShake: 0,
    damageFlash: 0
};

// ==================== PLAYER ====================
function createPlayer(x, y) {
    return {
        x, y,
        vx: 0, vy: 0,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        stamina: 100,
        maxStamina: 100,
        gold: 50,
        level: 1,
        xp: 0,
        xpToLevel: 100,
        combatSkill: 1,
        facing: { x: 0, y: 1 },
        attacking: false,
        attackTimer: 0,
        attackCooldown: 0,
        dodgeTimer: 0,
        dodgeCooldown: 0,
        invincible: 0,
        sprinting: false,
        equipment: {
            weapon: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 24, type: 'sword' },
            body: { name: 'Leather Armor', armor: 15 },
            head: null,
            ring: null
        },
        inventory: [
            { type: 'potion_health', name: 'Health Potion', quantity: 2 },
            { type: 'potion_stamina', name: 'Stamina Potion', quantity: 1 }
        ],
        perks: [],
        width: 12,
        height: 12
    };
}

// ==================== WORLD GENERATION ====================
function generateWorld() {
    // Initialize world
    game.world = Array(WORLD_HEIGHT).fill(null).map(() => Array(WORLD_WIDTH).fill(TILE.GRASS));
    game.biomeMap = Array(WORLD_HEIGHT).fill(null).map(() => Array(WORLD_WIDTH).fill(BIOME.FOREST));

    // Generate biome regions
    generateBiomes();

    // Fill tiles based on biomes
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const biome = game.biomeMap[y][x];
            game.world[y][x] = generateTileForBiome(biome, x, y);
        }
    }

    // Generate villages/towns
    generateTowns();

    // Generate paths between towns
    generatePaths();

    // Generate dungeons entrances
    generateDungeonEntrances();

    // Spawn entities
    spawnWorldEntities();

    // Place player in starting village
    const startVillage = game.buildings.find(b => b.type === 'village');
    if (startVillage) {
        game.player = createPlayer(startVillage.x * TILE_SIZE, startVillage.y * TILE_SIZE);
    } else {
        game.player = createPlayer(WORLD_WIDTH * TILE_SIZE / 2, WORLD_HEIGHT * TILE_SIZE / 2);
    }

    // Add starting quest
    addQuest({
        id: 'main_01',
        title: 'Escape Helgen',
        description: 'Find your way to the nearest village.',
        objective: 'Reach Riverwood',
        completed: false,
        reward: { gold: 50, xp: 50 }
    });
}

function generateBiomes() {
    // Forest in center-south
    // Snow in north
    // Mountains in west
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Distance from edges
            const northness = 1 - (y / WORLD_HEIGHT);
            const westness = 1 - (x / WORLD_WIDTH);

            // Noise for variation
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.2;

            if (northness > 0.6 + noise) {
                game.biomeMap[y][x] = BIOME.SNOW;
            } else if (westness > 0.7 + noise) {
                game.biomeMap[y][x] = BIOME.MOUNTAIN;
            } else {
                game.biomeMap[y][x] = BIOME.FOREST;
            }
        }
    }
}

function generateTileForBiome(biome, x, y) {
    const noise = seededRandom(x * 1000 + y);
    const noise2 = seededRandom(x * 2000 + y * 3);

    switch (biome) {
        case BIOME.FOREST:
            if (noise < 0.15) return TILE.TREE;
            if (noise < 0.2) return TILE.ROCK;
            if (noise2 < 0.05) return TILE.WATER;
            return TILE.GRASS;

        case BIOME.SNOW:
            if (noise < 0.1) return TILE.TREE;
            if (noise < 0.15) return TILE.ROCK;
            if (noise2 < 0.03) return TILE.ICE;
            return TILE.SNOW;

        case BIOME.MOUNTAIN:
            if (noise < 0.4) return TILE.ROCK;
            if (noise < 0.5) return TILE.MOUNTAIN;
            return TILE.GRASS;

        default:
            return TILE.GRASS;
    }
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateTowns() {
    // Generate several towns/villages
    const townLocations = [
        { name: 'Riverwood', x: 100, y: 150, size: 'small', biome: BIOME.FOREST },
        { name: 'Whiterun', x: 100, y: 100, size: 'large', biome: BIOME.FOREST },
        { name: 'Falkreath', x: 150, y: 170, size: 'small', biome: BIOME.FOREST },
        { name: 'Winterhold', x: 120, y: 30, size: 'medium', biome: BIOME.SNOW },
        { name: 'Dawnstar', x: 80, y: 40, size: 'small', biome: BIOME.SNOW },
        { name: 'Markarth', x: 30, y: 100, size: 'medium', biome: BIOME.MOUNTAIN }
    ];

    for (const town of townLocations) {
        generateTown(town);
    }
}

function generateTown(townData) {
    const { name, x, y, size, biome } = townData;
    const buildingCount = size === 'large' ? 8 : size === 'medium' ? 5 : 3;

    // Clear area for town
    const townRadius = buildingCount * 3;
    for (let dy = -townRadius; dy <= townRadius; dy++) {
        for (let dx = -townRadius; dx <= townRadius; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                if (Math.abs(dx) + Math.abs(dy) < townRadius) {
                    game.world[ty][tx] = TILE.DIRT;
                    game.biomeMap[ty][tx] = BIOME.VILLAGE;
                }
            }
        }
    }

    // Add town marker
    game.buildings.push({
        type: 'village',
        name: name,
        x: x,
        y: y,
        radius: townRadius
    });

    // Generate buildings
    const buildingTypes = ['house', 'shop', 'inn', 'blacksmith', 'temple'];
    for (let i = 0; i < buildingCount; i++) {
        const angle = (i / buildingCount) * Math.PI * 2;
        const dist = townRadius * 0.5 + Math.random() * townRadius * 0.3;
        const bx = Math.floor(x + Math.cos(angle) * dist);
        const by = Math.floor(y + Math.sin(angle) * dist);

        const buildingType = buildingTypes[i % buildingTypes.length];
        createBuilding(bx, by, buildingType, name);
    }

    // Add NPCs
    spawnTownNPCs(x, y, name);
}

function createBuilding(x, y, type, townName) {
    const width = type === 'inn' ? 5 : 4;
    const height = type === 'inn' ? 4 : 3;

    // Place building tiles
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                if (dy === 0 || dy === height - 1 || dx === 0 || dx === width - 1) {
                    game.world[ty][tx] = TILE.WALL;
                } else {
                    game.world[ty][tx] = TILE.FLOOR;
                }
            }
        }
    }

    // Add door
    game.world[y + height - 1][x + Math.floor(width / 2)] = TILE.DOOR;

    game.buildings.push({
        type: type,
        x: x,
        y: y,
        width: width,
        height: height,
        town: townName
    });
}

function spawnTownNPCs(townX, townY, townName) {
    const npcTypes = [
        { type: 'blacksmith', name: 'Alvor', dialogue: 'Welcome, traveler. Need weapons or armor?' },
        { type: 'merchant', name: 'Lucan', dialogue: 'Looking to buy or sell?' },
        { type: 'innkeeper', name: 'Delphine', dialogue: 'Need a room? Or perhaps some food?' },
        { type: 'guard', name: 'Guard', dialogue: 'Let me guess... someone stole your sweetroll?' },
        { type: 'quest_giver', name: 'Jarl', dialogue: 'Ah, a new face. We have need of capable warriors.' }
    ];

    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        const npcData = npcTypes[i % npcTypes.length];
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 5;
        const nx = townX + Math.cos(angle) * dist;
        const ny = townY + Math.sin(angle) * dist;

        game.npcs.push({
            x: nx * TILE_SIZE,
            y: ny * TILE_SIZE,
            type: npcData.type,
            name: `${npcData.name} (${townName})`,
            dialogue: npcData.dialogue,
            town: townName,
            facing: { x: 0, y: 1 },
            width: 12,
            height: 12
        });
    }
}

function generatePaths() {
    // Connect towns with paths
    const towns = game.buildings.filter(b => b.type === 'village');

    for (let i = 0; i < towns.length - 1; i++) {
        const town1 = towns[i];
        const town2 = towns[i + 1];
        createPath(town1.x, town1.y, town2.x, town2.y);
    }
}

function createPath(x1, y1, x2, y2) {
    let x = x1, y = y1;

    while (Math.abs(x - x2) > 1 || Math.abs(y - y2) > 1) {
        if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            game.world[y][x] = TILE.PATH;
            // Path width
            if (x > 0) game.world[y][x - 1] = TILE.PATH;
            if (x < WORLD_WIDTH - 1) game.world[y][x + 1] = TILE.PATH;
        }

        // Move towards target with some randomness
        if (Math.abs(x - x2) > Math.abs(y - y2)) {
            x += Math.sign(x2 - x);
        } else {
            y += Math.sign(y2 - y);
        }

        // Add some curves
        if (Math.random() < 0.2) {
            if (Math.random() < 0.5 && Math.abs(x - x2) > 2) x += Math.sign(x2 - x);
            else if (Math.abs(y - y2) > 2) y += Math.sign(y2 - y);
        }
    }
}

function generateDungeonEntrances() {
    const dungeons = [
        { name: 'Embershard Mine', x: 120, y: 160, enemies: 'bandits' },
        { name: 'Bleak Falls Barrow', x: 90, y: 120, enemies: 'draugr' },
        { name: 'Frost Cave', x: 100, y: 50, enemies: 'frost_creatures' }
    ];

    for (const dungeon of dungeons) {
        // Mark entrance
        if (dungeon.x >= 0 && dungeon.x < WORLD_WIDTH && dungeon.y >= 0 && dungeon.y < WORLD_HEIGHT) {
            game.world[dungeon.y][dungeon.x] = TILE.ROCK;
            game.buildings.push({
                type: 'dungeon',
                name: dungeon.name,
                x: dungeon.x,
                y: dungeon.y,
                enemies: dungeon.enemies
            });
        }
    }
}

function spawnWorldEntities() {
    // Spawn enemies in wilderness
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * WORLD_WIDTH);
        const y = Math.floor(Math.random() * WORLD_HEIGHT);
        const biome = game.biomeMap[y][x];

        if (biome !== BIOME.VILLAGE && isWalkable(x, y)) {
            spawnEnemy(x * TILE_SIZE, y * TILE_SIZE, biome);
        }
    }

    // Spawn items/loot
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * WORLD_WIDTH);
        const y = Math.floor(Math.random() * WORLD_HEIGHT);

        if (isWalkable(x, y)) {
            const types = ['gold', 'potion_health', 'weapon', 'armor'];
            game.items.push({
                x: x * TILE_SIZE,
                y: y * TILE_SIZE,
                type: types[Math.floor(Math.random() * types.length)],
                value: 10 + Math.floor(Math.random() * 40)
            });
        }
    }
}

function spawnEnemy(x, y, biome) {
    let enemyType;

    switch (biome) {
        case BIOME.FOREST:
            enemyType = Math.random() < 0.5 ? 'wolf' : 'bandit';
            break;
        case BIOME.SNOW:
            enemyType = Math.random() < 0.5 ? 'frost_wolf' : 'draugr';
            break;
        case BIOME.MOUNTAIN:
            enemyType = Math.random() < 0.3 ? 'bear' : 'troll';
            break;
        default:
            enemyType = 'wolf';
    }

    const templates = {
        wolf: { name: 'Wolf', hp: 25, damage: 6, speed: 60, color: '#6a5a4a', xp: 20 },
        bandit: { name: 'Bandit', hp: 40, damage: 8, speed: 40, color: '#5a4a3a', xp: 35 },
        frost_wolf: { name: 'Frost Wolf', hp: 35, damage: 8, speed: 55, color: '#8090a0', xp: 30 },
        draugr: { name: 'Draugr', hp: 50, damage: 10, speed: 30, color: '#506070', xp: 45 },
        bear: { name: 'Bear', hp: 60, damage: 12, speed: 35, color: '#5a4a3a', xp: 50 },
        troll: { name: 'Troll', hp: 80, damage: 15, speed: 25, color: '#4a5a4a', xp: 70 }
    };

    const template = templates[enemyType];

    game.entities.push({
        x, y,
        vx: 0, vy: 0,
        type: enemyType,
        name: template.name,
        hp: template.hp,
        maxHp: template.hp,
        damage: template.damage,
        speed: template.speed,
        color: template.color,
        xp: template.xp,
        facing: { x: 0, y: 1 },
        state: 'idle',
        target: null,
        attackCooldown: 0,
        width: 12,
        height: 12
    });
}

function isWalkable(tileX, tileY) {
    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return false;
    const tile = game.world[tileY][tileX];
    return tile !== TILE.WATER && tile !== TILE.WALL && tile !== TILE.TREE &&
           tile !== TILE.ROCK && tile !== TILE.MOUNTAIN && tile !== TILE.ICE;
}

function isWalkablePixel(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    return isWalkable(tileX, tileY);
}

// ==================== QUESTS ====================
function addQuest(quest) {
    game.quests.push(quest);
    if (!game.activeQuest) {
        game.activeQuest = quest;
    }
    showFloatingText(game.player.x, game.player.y - 20, `New Quest: ${quest.title}`, '#ffff00');
}

function completeQuest(questId) {
    const quest = game.quests.find(q => q.id === questId);
    if (quest && !quest.completed) {
        quest.completed = true;
        if (quest.reward) {
            if (quest.reward.gold) game.player.gold += quest.reward.gold;
            if (quest.reward.xp) gainXP(quest.reward.xp);
        }
        showFloatingText(game.player.x, game.player.y - 20, `Quest Complete!`, '#00ff00');

        // Set next active quest
        game.activeQuest = game.quests.find(q => !q.completed) || null;
    }
}

// ==================== PLAYER CONTROLS ====================
function updatePlayer(dt) {
    const p = game.player;

    // Movement
    let dx = 0, dy = 0;
    if (game.keys['KeyW'] || game.keys['ArrowUp']) dy -= 1;
    if (game.keys['KeyS'] || game.keys['ArrowDown']) dy += 1;
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) dx -= 1;
    if (game.keys['KeyD'] || game.keys['ArrowRight']) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Update facing direction
    if (dx !== 0 || dy !== 0) {
        p.facing = { x: Math.sign(dx), y: Math.sign(dy) };
    }

    // Sprint
    p.sprinting = game.keys['ShiftLeft'] && p.stamina > 0 && (dx !== 0 || dy !== 0);
    const speed = p.sprinting ? 140 : 80;

    if (p.sprinting) {
        p.stamina -= 5 * dt;
        if (p.stamina < 0) p.stamina = 0;
    }

    // Apply velocity
    p.vx = dx * speed;
    p.vy = dy * speed;

    // Collision check
    const newX = p.x + p.vx * dt;
    const newY = p.y + p.vy * dt;

    if (isWalkablePixel(newX, p.y) && isWalkablePixel(newX + p.width, p.y)) {
        p.x = newX;
    }
    if (isWalkablePixel(p.x, newY) && isWalkablePixel(p.x, newY + p.height)) {
        p.y = newY;
    }

    // Keep in bounds
    p.x = Math.max(0, Math.min((WORLD_WIDTH - 1) * TILE_SIZE, p.x));
    p.y = Math.max(0, Math.min((WORLD_HEIGHT - 1) * TILE_SIZE, p.y));

    // Attacking
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.attacking && p.attackTimer > 0) {
        p.attackTimer -= dt;
        if (p.attackTimer <= 0) {
            p.attacking = false;
        }
    }

    // Dodge cooldown
    if (p.dodgeCooldown > 0) p.dodgeCooldown -= dt;

    // Dodge roll
    if (p.dodgeTimer > 0) {
        p.dodgeTimer -= dt;
        p.x += p.facing.x * 200 * dt;
        p.y += p.facing.y * 200 * dt;
    }

    // Invincibility frames
    if (p.invincible > 0) p.invincible -= dt;

    // Regeneration (out of combat)
    if (!p.attacking && p.attackCooldown <= 0) {
        p.stamina = Math.min(p.maxStamina, p.stamina + 10 * dt);
        p.mp = Math.min(p.maxMp, p.mp + 2 * dt);
    }

    // Check for quest completion (reaching village)
    const tileX = Math.floor(p.x / TILE_SIZE);
    const tileY = Math.floor(p.y / TILE_SIZE);
    if (game.biomeMap[tileY] && game.biomeMap[tileY][tileX] === BIOME.VILLAGE) {
        if (game.activeQuest && game.activeQuest.id === 'main_01') {
            completeQuest('main_01');
            // Add next quest
            addQuest({
                id: 'main_02',
                title: 'Meet the Jarl',
                description: 'Speak with the Jarl about the dragon threat.',
                objective: 'Find and speak to the Jarl',
                completed: false,
                reward: { gold: 100, xp: 75 }
            });
        }
    }
}

function playerAttack() {
    const p = game.player;
    if (p.attackCooldown > 0 || p.attacking) return;
    if (p.stamina < 10) {
        showFloatingText(p.x, p.y - 10, 'Not enough stamina!', '#ff6666');
        return;
    }

    p.attacking = true;
    p.attackTimer = p.equipment.weapon.speed;
    p.attackCooldown = p.equipment.weapon.speed + 0.2;
    p.stamina -= 10;

    // Calculate attack hitbox
    const range = p.equipment.weapon.range;
    const attackX = p.x + p.width / 2 + p.facing.x * range / 2;
    const attackY = p.y + p.height / 2 + p.facing.y * range / 2;

    // Check for enemy hits
    for (const enemy of game.entities) {
        if (enemy.hp <= 0) continue;

        const dist = Math.sqrt(
            Math.pow(enemy.x + enemy.width / 2 - attackX, 2) +
            Math.pow(enemy.y + enemy.height / 2 - attackY, 2)
        );

        if (dist < range) {
            // Calculate damage
            let damage = p.equipment.weapon.damage;
            damage *= (1 + p.combatSkill * 0.05); // Skill bonus
            damage = Math.floor(damage);

            enemy.hp -= damage;
            showFloatingText(enemy.x, enemy.y - 10, `-${damage}`, '#ff4444');
            addParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 'blood');

            // Combat XP
            gainCombatXP(damage);

            // Knockback
            enemy.x += p.facing.x * 10;
            enemy.y += p.facing.y * 10;

            if (enemy.hp <= 0) {
                killEnemy(enemy);
            } else {
                // Aggro
                enemy.state = 'chase';
                enemy.target = p;
            }
        }
    }
}

function playerDodge() {
    const p = game.player;
    if (p.dodgeCooldown > 0 || p.stamina < 20) return;

    p.dodgeTimer = 0.3;
    p.dodgeCooldown = 0.8;
    p.stamina -= 20;
    p.invincible = 0.3;
}

function killEnemy(enemy) {
    // Award XP
    gainXP(enemy.xp);
    showFloatingText(enemy.x, enemy.y - 20, `+${enemy.xp} XP`, '#ffff00');

    // Drop loot
    if (Math.random() < 0.4) {
        const goldDrop = 5 + Math.floor(Math.random() * 15);
        game.player.gold += goldDrop;
        showFloatingText(enemy.x, enemy.y - 30, `+${goldDrop} Gold`, '#ffdd00');
    }
}

function gainCombatXP(damage) {
    const xpGain = Math.ceil(damage * 0.5);
    game.player.combatSkill += xpGain * 0.01;
    if (game.player.combatSkill > 10) game.player.combatSkill = 10;
}

function gainXP(amount) {
    game.player.xp += amount;
    while (game.player.xp >= game.player.xpToLevel) {
        levelUp();
    }
}

function levelUp() {
    game.player.xp -= game.player.xpToLevel;
    game.player.level++;
    game.player.xpToLevel = Math.floor(game.player.xpToLevel * 1.5);
    game.player.maxHp += 10;
    game.player.hp = game.player.maxHp;
    game.player.maxMp += 5;
    game.player.mp = game.player.maxMp;

    showFloatingText(game.player.x, game.player.y - 30, `LEVEL UP! (${game.player.level})`, '#00ffff');
}

function damagePlayer(amount) {
    if (game.player.invincible > 0) return;

    // Apply armor reduction
    const armor = (game.player.equipment.body?.armor || 0) + (game.player.equipment.head?.armor || 0);
    const reducedDamage = Math.max(1, amount - Math.floor(armor / 2));

    game.player.hp -= reducedDamage;
    showFloatingText(game.player.x, game.player.y - 10, `-${reducedDamage}`, '#ff0000');

    // Visual feedback
    game.damageFlash = 0.2;
    game.screenShake = 5;
    game.player.invincible = 0.5;

    if (game.player.hp <= 0) {
        gameOver();
    }
}

function gameOver() {
    game.state = STATE.GAME_OVER;
}

// ==================== ENEMY AI ====================
function updateEntities(dt) {
    for (const entity of game.entities) {
        if (entity.hp <= 0) continue;

        // Cooldowns
        if (entity.attackCooldown > 0) entity.attackCooldown -= dt;

        // Calculate distance to player
        const dx = game.player.x - entity.x;
        const dy = game.player.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // State machine
        switch (entity.state) {
            case 'idle':
                // Detect player
                if (dist < 100) {
                    entity.state = 'chase';
                    entity.target = game.player;
                } else {
                    // Random wandering
                    if (Math.random() < 0.01) {
                        entity.vx = (Math.random() - 0.5) * entity.speed;
                        entity.vy = (Math.random() - 0.5) * entity.speed;
                    }
                    if (Math.random() < 0.02) {
                        entity.vx = 0;
                        entity.vy = 0;
                    }
                }
                break;

            case 'chase':
                // Move toward player
                if (dist > 0) {
                    entity.vx = (dx / dist) * entity.speed;
                    entity.vy = (dy / dist) * entity.speed;
                    entity.facing = { x: Math.sign(dx), y: Math.sign(dy) };
                }

                // Attack if close
                if (dist < 20 && entity.attackCooldown <= 0) {
                    entity.state = 'attack';
                    entity.attackCooldown = 1.0;
                }

                // Lose interest if too far
                if (dist > 200) {
                    entity.state = 'idle';
                    entity.target = null;
                }
                break;

            case 'attack':
                entity.vx = 0;
                entity.vy = 0;
                // Deal damage to player
                damagePlayer(entity.damage);
                entity.state = 'chase';
                break;
        }

        // Apply movement
        const newX = entity.x + entity.vx * dt;
        const newY = entity.y + entity.vy * dt;

        if (isWalkablePixel(newX, entity.y)) entity.x = newX;
        if (isWalkablePixel(entity.x, newY)) entity.y = newY;
    }
}

// ==================== ITEMS ====================
function checkItemPickup() {
    const p = game.player;
    for (let i = game.items.length - 1; i >= 0; i--) {
        const item = game.items[i];
        const dist = Math.sqrt(
            Math.pow(p.x + p.width / 2 - item.x, 2) +
            Math.pow(p.y + p.height / 2 - item.y, 2)
        );

        if (dist < 20) {
            pickupItem(item, i);
        }
    }
}

function pickupItem(item, index) {
    switch (item.type) {
        case 'gold':
            game.player.gold += item.value;
            showFloatingText(item.x, item.y - 10, `+${item.value} Gold`, '#ffdd00');
            break;
        case 'potion_health':
            addToInventory({ type: 'potion_health', name: 'Health Potion', quantity: 1 });
            showFloatingText(item.x, item.y - 10, '+Health Potion', '#ff6666');
            break;
        case 'weapon':
            showFloatingText(item.x, item.y - 10, '+Weapon', '#aaaaff');
            break;
        case 'armor':
            showFloatingText(item.x, item.y - 10, '+Armor', '#aaffaa');
            break;
    }
    game.items.splice(index, 1);
}

function addToInventory(item) {
    const existing = game.player.inventory.find(i => i.type === item.type);
    if (existing) {
        existing.quantity += item.quantity;
    } else {
        game.player.inventory.push(item);
    }
}

function useItem(index) {
    const item = game.player.inventory[index];
    if (!item || item.quantity <= 0) return;

    switch (item.type) {
        case 'potion_health':
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + 50);
            showFloatingText(game.player.x, game.player.y - 10, '+50 HP', '#ff6666');
            break;
        case 'potion_stamina':
            game.player.stamina = Math.min(game.player.maxStamina, game.player.stamina + 50);
            showFloatingText(game.player.x, game.player.y - 10, '+50 Stamina', '#66ff66');
            break;
    }

    item.quantity--;
    if (item.quantity <= 0) {
        game.player.inventory.splice(index, 1);
    }
}

// ==================== PARTICLES & EFFECTS ====================
function addParticle(x, y, type) {
    game.particles.push({
        x, y, type,
        life: 30,
        maxLife: 30
    });
}

function showFloatingText(x, y, text, color) {
    game.floatingTexts.push({
        x, y, text, color,
        offsetY: 0,
        life: 90
    });
}

function updateParticles(dt) {
    game.particles = game.particles.filter(p => {
        p.life--;
        return p.life > 0;
    });

    game.floatingTexts = game.floatingTexts.filter(t => {
        t.life--;
        t.offsetY -= 0.5;
        return t.life > 0;
    });

    if (game.screenShake > 0) game.screenShake -= dt * 20;
    if (game.damageFlash > 0) game.damageFlash -= dt;
}

// ==================== CAMERA ====================
function updateCamera() {
    const targetX = game.player.x - (VIEW_WIDTH * TILE_SIZE * SCALE) / 2 / SCALE + game.player.width / 2;
    const targetY = game.player.y - (VIEW_HEIGHT * TILE_SIZE * SCALE) / 2 / SCALE + game.player.height / 2;

    // Smooth camera
    game.camera.x += (targetX - game.camera.x) * 0.1;
    game.camera.y += (targetY - game.camera.y) * 0.1;

    // Clamp camera
    game.camera.x = Math.max(0, Math.min((WORLD_WIDTH - VIEW_WIDTH) * TILE_SIZE, game.camera.x));
    game.camera.y = Math.max(0, Math.min((WORLD_HEIGHT - VIEW_HEIGHT) * TILE_SIZE, game.camera.y));
}

// ==================== RENDERING ====================
function render() {
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === STATE.MENU) {
        renderMenu();
        return;
    }

    if (game.state === STATE.GAME_OVER) {
        renderGameOver();
        return;
    }

    // Apply screen shake
    ctx.save();
    if (game.screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * game.screenShake,
            (Math.random() - 0.5) * game.screenShake
        );
    }

    // Scale for pixel art
    ctx.scale(SCALE, SCALE);

    // Render world
    renderWorld();

    // Render items
    renderItems();

    // Render entities
    renderEntities();

    // Render NPCs
    renderNPCs();

    // Render player
    renderPlayer();

    // Render particles
    renderParticles();

    // Render floating texts
    renderFloatingTexts();

    ctx.restore();

    // Damage flash overlay
    if (game.damageFlash > 0) {
        ctx.fillStyle = `rgba(255,0,0,${game.damageFlash * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render UI (not scaled)
    renderUI();

    // Debug overlay
    if (game.showDebug) {
        renderDebugOverlay();
    }
}

function renderWorld() {
    const startTileX = Math.floor(game.camera.x / TILE_SIZE);
    const startTileY = Math.floor(game.camera.y / TILE_SIZE);
    const endTileX = startTileX + VIEW_WIDTH + 1;
    const endTileY = startTileY + VIEW_HEIGHT + 1;

    for (let y = startTileY; y < endTileY; y++) {
        for (let x = startTileX; x < endTileX; x++) {
            if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;

            const screenX = x * TILE_SIZE - game.camera.x;
            const screenY = y * TILE_SIZE - game.camera.y;
            const tile = game.world[y][x];
            const biome = game.biomeMap[y][x];

            renderTile(screenX, screenY, tile, biome, x, y);
        }
    }

    // Render town markers
    for (const building of game.buildings) {
        if (building.type === 'village') {
            const screenX = building.x * TILE_SIZE - game.camera.x;
            const screenY = building.y * TILE_SIZE - game.camera.y;

            // Town name label
            ctx.fillStyle = '#ffffff';
            ctx.font = '4px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(building.name, screenX, screenY - 8);
        }
    }
}

function renderTile(x, y, tile, biome, tileX, tileY) {
    const noise = seededRandom(tileX * 1000 + tileY);

    switch (tile) {
        case TILE.GRASS:
            ctx.fillStyle = noise < 0.33 ? COLORS.grass1 : noise < 0.66 ? COLORS.grass2 : COLORS.grass3;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Grass details
            if (noise < 0.1) {
                ctx.fillStyle = '#3a5a3a';
                ctx.fillRect(x + 4, y + 4, 2, 4);
            }
            break;

        case TILE.DIRT:
            ctx.fillStyle = COLORS.dirt;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;

        case TILE.PATH:
            ctx.fillStyle = COLORS.path;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Path stones
            if (noise < 0.2) {
                ctx.fillStyle = '#6a5a4a';
                ctx.fillRect(x + 3, y + 3, 4, 3);
            }
            break;

        case TILE.WATER:
            const waterTime = Math.sin(game.time * 2 + tileX + tileY) * 0.1;
            ctx.fillStyle = noise < 0.5 + waterTime ? COLORS.water : COLORS.waterDeep;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;

        case TILE.TREE:
            // Ground
            ctx.fillStyle = biome === BIOME.SNOW ? COLORS.snow1 : COLORS.grass1;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Trunk
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(x + 6, y + 8, 4, 8);
            // Canopy
            ctx.fillStyle = biome === BIOME.SNOW ? '#2a4a3a' : COLORS.tree1;
            ctx.fillRect(x + 2, y + 2, 12, 8);
            ctx.fillStyle = biome === BIOME.SNOW ? '#3a5a4a' : COLORS.tree2;
            ctx.fillRect(x + 4, y, 8, 6);
            break;

        case TILE.ROCK:
            ctx.fillStyle = biome === BIOME.SNOW ? COLORS.snow1 : COLORS.grass1;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.rock1;
            ctx.fillRect(x + 3, y + 4, 10, 8);
            ctx.fillStyle = COLORS.rock2;
            ctx.fillRect(x + 4, y + 5, 8, 6);
            break;

        case TILE.SNOW:
            ctx.fillStyle = noise < 0.33 ? COLORS.snow1 : noise < 0.66 ? COLORS.snow2 : COLORS.snow3;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;

        case TILE.ICE:
            ctx.fillStyle = COLORS.ice;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x + 2, y + 2, 4, 2);
            break;

        case TILE.MOUNTAIN:
            ctx.fillStyle = COLORS.mountain;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#7a7a8a';
            ctx.beginPath();
            ctx.moveTo(x + 8, y);
            ctx.lineTo(x + 14, y + 12);
            ctx.lineTo(x + 2, y + 12);
            ctx.closePath();
            ctx.fill();
            // Snow cap
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 6, y, 4, 3);
            break;

        case TILE.WALL:
            ctx.fillStyle = COLORS.woodWall;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.woodDark;
            ctx.fillRect(x, y, TILE_SIZE, 2);
            ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
            break;

        case TILE.FLOOR:
            ctx.fillStyle = COLORS.woodLight;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = COLORS.woodDark;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            break;

        case TILE.DOOR:
            ctx.fillStyle = COLORS.woodLight;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.woodDark;
            ctx.fillRect(x + 4, y + 2, 8, 12);
            ctx.fillStyle = '#aa8844';
            ctx.fillRect(x + 10, y + 7, 2, 2);
            break;

        default:
            ctx.fillStyle = '#202020';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
}

function renderItems() {
    for (const item of game.items) {
        const screenX = item.x - game.camera.x;
        const screenY = item.y - game.camera.y;

        if (screenX < -TILE_SIZE || screenX > VIEW_WIDTH * TILE_SIZE ||
            screenY < -TILE_SIZE || screenY > VIEW_HEIGHT * TILE_SIZE) continue;

        const pulse = Math.sin(game.time * 4) * 0.2 + 0.8;

        switch (item.type) {
            case 'gold':
                ctx.fillStyle = `rgba(255,220,0,${pulse})`;
                ctx.beginPath();
                ctx.arc(screenX + 4, screenY + 4, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'potion_health':
                ctx.fillStyle = `rgba(255,60,60,${pulse})`;
                ctx.fillRect(screenX, screenY, 6, 8);
                break;
            default:
                ctx.fillStyle = `rgba(150,150,150,${pulse})`;
                ctx.fillRect(screenX, screenY, 8, 8);
        }
    }
}

function renderEntities() {
    for (const entity of game.entities) {
        if (entity.hp <= 0) continue;

        const screenX = entity.x - game.camera.x;
        const screenY = entity.y - game.camera.y;

        if (screenX < -TILE_SIZE * 2 || screenX > VIEW_WIDTH * TILE_SIZE ||
            screenY < -TILE_SIZE * 2 || screenY > VIEW_HEIGHT * TILE_SIZE) continue;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(screenX + 1, screenY + entity.height - 2, entity.width - 2, 3);

        // Body
        ctx.fillStyle = entity.color;
        ctx.fillRect(screenX, screenY, entity.width, entity.height);

        // Eyes
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(screenX + 2, screenY + 3, 2, 2);
        ctx.fillRect(screenX + entity.width - 4, screenY + 3, 2, 2);

        // Health bar
        const hpPercent = entity.hp / entity.maxHp;
        ctx.fillStyle = '#200000';
        ctx.fillRect(screenX - 2, screenY - 5, entity.width + 4, 3);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(screenX - 1, screenY - 4, (entity.width + 2) * hpPercent, 2);
    }
}

function renderNPCs() {
    for (const npc of game.npcs) {
        const screenX = npc.x - game.camera.x;
        const screenY = npc.y - game.camera.y;

        if (screenX < -TILE_SIZE * 2 || screenX > VIEW_WIDTH * TILE_SIZE ||
            screenY < -TILE_SIZE * 2 || screenY > VIEW_HEIGHT * TILE_SIZE) continue;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(screenX + 1, screenY + npc.height - 2, npc.width - 2, 3);

        // Body
        ctx.fillStyle = COLORS.npc;
        ctx.fillRect(screenX + 2, screenY + 4, npc.width - 4, npc.height - 4);

        // Head
        ctx.fillStyle = '#c0a080';
        ctx.fillRect(screenX + 3, screenY, npc.width - 6, 6);

        // Interaction indicator
        const dist = Math.sqrt(
            Math.pow(game.player.x - npc.x, 2) +
            Math.pow(game.player.y - npc.y, 2)
        );
        if (dist < 30) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '4px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('[E]', screenX + npc.width / 2, screenY - 8);
        }
    }
}

function renderPlayer() {
    const p = game.player;
    const screenX = p.x - game.camera.x;
    const screenY = p.y - game.camera.y;

    // Flash when invincible
    if (p.invincible > 0 && Math.floor(game.time * 10) % 2 === 0) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(screenX + 1, screenY + p.height - 2, p.width - 2, 4);

    // Legs
    ctx.fillStyle = '#3a4050';
    ctx.fillRect(screenX + 2, screenY + 8, 3, 5);
    ctx.fillRect(screenX + p.width - 5, screenY + 8, 3, 5);

    // Body
    ctx.fillStyle = COLORS.playerArmor;
    ctx.fillRect(screenX + 1, screenY + 3, p.width - 2, 7);

    // Head
    ctx.fillStyle = '#c0a080';
    ctx.fillRect(screenX + 3, screenY, p.width - 6, 5);

    // Helmet
    ctx.fillStyle = '#5a6070';
    ctx.fillRect(screenX + 2, screenY - 1, p.width - 4, 3);

    // Attack animation
    if (p.attacking) {
        ctx.fillStyle = '#808080';
        const weaponX = screenX + p.width / 2 + p.facing.x * 10;
        const weaponY = screenY + p.height / 2 + p.facing.y * 10;
        ctx.fillRect(weaponX - 2, weaponY - 6, 4, 12);
    }
}

function renderParticles() {
    for (const p of game.particles) {
        const screenX = p.x - game.camera.x;
        const screenY = p.y - game.camera.y;
        const alpha = p.life / p.maxLife;

        switch (p.type) {
            case 'blood':
                ctx.fillStyle = `rgba(150,30,30,${alpha})`;
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(
                        screenX + (Math.random() - 0.5) * 10,
                        screenY + (Math.random() - 0.5) * 10,
                        2, 2
                    );
                }
                break;
        }
    }
}

function renderFloatingTexts() {
    for (const t of game.floatingTexts) {
        const screenX = t.x - game.camera.x;
        const screenY = t.y - game.camera.y + t.offsetY;

        ctx.fillStyle = t.color;
        ctx.font = 'bold 4px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = t.life / 90;
        ctx.fillText(t.text, screenX, screenY);
        ctx.globalAlpha = 1;
    }
}

function renderUI() {
    const barWidth = 180;
    const barHeight = 14;
    const barY = canvas.height - 50;

    // Health bar
    ctx.fillStyle = COLORS.healthBarBg;
    ctx.fillRect(20, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.healthBar;
    const hpPercent = game.player.hp / game.player.maxHp;
    ctx.fillRect(20, barY, barWidth * hpPercent, barHeight);
    ctx.strokeStyle = '#3a2020';
    ctx.strokeRect(20, barY, barWidth, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(game.player.hp)}/${game.player.maxHp}`, 20 + barWidth / 2, barY + 11);

    // Mana bar
    ctx.fillStyle = COLORS.manaBarBg;
    ctx.fillRect(210, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.manaBar;
    const mpPercent = game.player.mp / game.player.maxMp;
    ctx.fillRect(210, barY, barWidth * mpPercent, barHeight);
    ctx.strokeStyle = '#202040';
    ctx.strokeRect(210, barY, barWidth, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.floor(game.player.mp)}/${game.player.maxMp}`, 210 + barWidth / 2, barY + 11);

    // Stamina bar
    ctx.fillStyle = COLORS.staminaBarBg;
    ctx.fillRect(400, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.staminaBar;
    const staminaPercent = game.player.stamina / game.player.maxStamina;
    ctx.fillRect(400, barY, barWidth * staminaPercent, barHeight);
    ctx.strokeStyle = '#203020';
    ctx.strokeRect(400, barY, barWidth, barHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.floor(game.player.stamina)}/${game.player.maxStamina}`, 400 + barWidth / 2, barY + 11);

    // Quick slots
    const slotSize = 36;
    const slotY = canvas.height - 45;
    const slotStartX = canvas.width - 200;
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(slotStartX + i * (slotSize + 4), slotY, slotSize, slotSize);
        ctx.strokeStyle = '#3a3a5a';
        ctx.strokeRect(slotStartX + i * (slotSize + 4), slotY, slotSize, slotSize);

        // Item in slot
        const item = game.player.inventory[i];
        if (item) {
            ctx.fillStyle = item.type === 'potion_health' ? '#ff6666' : '#66ff66';
            ctx.fillRect(slotStartX + i * (slotSize + 4) + 8, slotY + 8, 20, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px sans-serif';
            ctx.fillText(`${item.quantity}`, slotStartX + i * (slotSize + 4) + 28, slotY + 32);
        }

        // Slot number
        ctx.fillStyle = '#888888';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${i + 1}`, slotStartX + i * (slotSize + 4) + 4, slotY + 12);
    }

    // Gold
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 14px "Times New Roman"';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${game.player.gold}`, canvas.width - 20, 30);

    // Level/XP
    ctx.fillStyle = '#aaaaff';
    ctx.fillText(`Level ${game.player.level}`, canvas.width - 20, 50);
    ctx.font = '12px "Times New Roman"';
    ctx.fillStyle = '#888888';
    ctx.fillText(`XP: ${game.player.xp}/${game.player.xpToLevel}`, canvas.width - 20, 68);

    // Active quest
    if (game.activeQuest) {
        ctx.fillStyle = 'rgba(26,26,42,0.8)';
        ctx.fillRect(10, 10, 250, 50);
        ctx.strokeStyle = '#3a3a5a';
        ctx.strokeRect(10, 10, 250, 50);

        ctx.fillStyle = '#ffff88';
        ctx.font = 'bold 12px "Times New Roman"';
        ctx.textAlign = 'left';
        ctx.fillText(game.activeQuest.title, 20, 28);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '11px "Times New Roman"';
        ctx.fillText(game.activeQuest.objective, 20, 48);
    }

    // Controls hint
    ctx.fillStyle = '#666666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WASD: Move | Click: Attack | Shift: Sprint | Space: Dodge | 1-3: Items | Q: Debug', 20, canvas.height - 10);
}

function renderDebugOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 70, 200, 180);

    ctx.fillStyle = '#00ff00';
    ctx.font = '11px "Courier New"';
    ctx.textAlign = 'left';

    const lines = [
        `=== DEBUG (Q) ===`,
        `State: ${game.state}`,
        `Player: ${Math.floor(game.player.x)}, ${Math.floor(game.player.y)}`,
        `HP: ${Math.floor(game.player.hp)}/${game.player.maxHp}`,
        `Level: ${game.player.level}`,
        `Combat Skill: ${game.player.combatSkill.toFixed(1)}`,
        `Entities: ${game.entities.filter(e => e.hp > 0).length}`,
        `NPCs: ${game.npcs.length}`,
        `Items: ${game.items.length}`,
        `Quests: ${game.quests.length}`,
        `FPS: ${Math.round(1000 / 16)}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 18, 88 + i * 14);
    });
}

function renderMenu() {
    // Background
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mountains background
    ctx.fillStyle = '#1a2030';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(200, 150);
    ctx.lineTo(400, 250);
    ctx.lineTo(600, 100);
    ctx.lineTo(800, 200);
    ctx.lineTo(canvas.width, 180);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Title
    ctx.fillStyle = '#d0c0a0';
    ctx.font = 'bold 72px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.fillText('FROSTFALL', canvas.width / 2, 180);

    ctx.font = '24px "Times New Roman"';
    ctx.fillStyle = '#8a8a7a';
    ctx.fillText('A 2D Skyrim Demake', canvas.width / 2, 220);

    // Instructions
    ctx.font = '16px "Times New Roman"';
    ctx.fillStyle = '#6a6a5a';
    const instructions = [
        'WASD - Move',
        'Left Click - Attack',
        'Shift - Sprint',
        'Space - Dodge Roll',
        '1/2/3 - Use Items',
        'E - Interact',
        'Q - Debug Overlay',
        '',
        'Press SPACE to begin'
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 300 + i * 24);
    });
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(20,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#aa4444';
    ctx.font = 'bold 64px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, 200);

    ctx.fillStyle = '#886666';
    ctx.font = '24px "Times New Roman"';
    ctx.fillText(`Level ${game.player.level} | Gold: ${game.player.gold}`, canvas.width / 2, 280);

    ctx.fillStyle = '#666666';
    ctx.font = '16px "Times New Roman"';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, 350);
}

// ==================== INPUT ====================
function handleKeyDown(e) {
    game.keys[e.code] = true;

    if (game.state === STATE.MENU) {
        if (e.code === 'Space') {
            startGame();
        }
        return;
    }

    if (game.state === STATE.GAME_OVER) {
        if (e.code === 'Space') {
            game.state = STATE.MENU;
        }
        return;
    }

    if (game.state === STATE.PLAYING) {
        switch (e.code) {
            case 'Space':
                playerDodge();
                break;
            case 'Digit1':
                useItem(0);
                break;
            case 'Digit2':
                useItem(1);
                break;
            case 'Digit3':
                useItem(2);
                break;
            case 'KeyQ':
                game.showDebug = !game.showDebug;
                break;
            case 'KeyE':
                interactWithNPC();
                break;
        }
    }
}

function handleKeyUp(e) {
    game.keys[e.code] = false;
}

function handleMouseDown(e) {
    if (e.button === 0) {
        game.mouse.down = true;
        if (game.state === STATE.PLAYING) {
            playerAttack();
        }
    } else if (e.button === 2) {
        game.mouse.rightDown = true;
    }
}

function handleMouseUp(e) {
    if (e.button === 0) game.mouse.down = false;
    else if (e.button === 2) game.mouse.rightDown = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
}

function interactWithNPC() {
    const p = game.player;
    for (const npc of game.npcs) {
        const dist = Math.sqrt(
            Math.pow(p.x - npc.x, 2) +
            Math.pow(p.y - npc.y, 2)
        );
        if (dist < 30) {
            showFloatingText(npc.x, npc.y - 20, npc.dialogue, '#ffffff');

            // Complete quest if talking to Jarl
            if (npc.type === 'quest_giver' && game.activeQuest && game.activeQuest.id === 'main_02') {
                completeQuest('main_02');
                addQuest({
                    id: 'main_03',
                    title: 'Clear the Mines',
                    description: 'Bandits have taken over the nearby mine.',
                    objective: 'Defeat 5 enemies',
                    completed: false,
                    target: 5,
                    progress: 0,
                    reward: { gold: 200, xp: 150 }
                });
            }
            return;
        }
    }
}

// ==================== MAIN LOOP ====================
function startGame() {
    game.state = STATE.PLAYING;
    game.time = 0;
    generateWorld();
}

function update(dt) {
    if (game.state !== STATE.PLAYING) return;

    game.time += dt;
    game.dayTime = (game.time * 0.01) % 1;

    updatePlayer(dt);
    updateEntities(dt);
    checkItemPickup();
    updateParticles(dt);
    updateCamera();

    // Check combat quest progress
    if (game.activeQuest && game.activeQuest.id === 'main_03') {
        const deadEnemies = game.entities.filter(e => e.hp <= 0).length;
        game.activeQuest.progress = deadEnemies;
        if (deadEnemies >= game.activeQuest.target) {
            completeQuest('main_03');
        }
    }
}

let lastTime = 0;
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    update(dt);
    render();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Start
requestAnimationFrame(gameLoop);
