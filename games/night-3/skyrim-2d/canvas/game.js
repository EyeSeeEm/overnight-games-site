// Frostfall: Skyrim 2D - Canvas Implementation
// Top-down action RPG

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 50;
const CAMERA_ZOOM = 1.5; // Zoom in for better visibility

// Colors - Dark fantasy palette (Stoneshard inspired)
const COLORS = {
    // Terrain
    GRASS_LIGHT: '#5a7a3a',
    GRASS: '#4a6a2a',
    GRASS_DARK: '#3a5a1a',
    GRASS_DARKER: '#2a4a0a',
    DIRT: '#6a5a4a',
    DIRT_DARK: '#5a4a3a',
    STONE: '#5a5a5a',
    STONE_LIGHT: '#7a7a7a',
    STONE_DARK: '#3a3a3a',
    SNOW: '#dde8e8',
    SNOW_DARK: '#bbd0d0',
    WATER: '#3a5a7a',
    WATER_DARK: '#2a4a6a',
    WOOD: '#8a6a4a',
    WOOD_DARK: '#5a4030',
    // Trees
    TREE_LIGHT: '#4a7a3a',
    TREE_MID: '#3a6a2a',
    TREE_DARK: '#2a5a1a',
    TREE_TRUNK: '#4a3a2a',
    // Characters
    PLAYER: '#5588bb',
    ENEMY: '#aa4444',
    NPC: '#66aa55',
    SKIN: '#e8c8a8',
    // UI
    UI_BG: '#12141a',
    UI_PANEL: '#1a1c24',
    UI_BORDER: '#3a3c44',
    UI_BORDER_LIGHT: '#5a5c64',
    HEALTH: '#aa3333',
    HEALTH_BG: '#331111',
    MANA: '#3355aa',
    MANA_BG: '#111133',
    STAMINA: '#55aa44',
    STAMINA_BG: '#113311',
    GOLD: '#d4aa44',
    // Effects
    SHADOW: 'rgba(0,0,0,0.3)'
};

// Terrain
const TERRAIN = {
    GRASS: 0, DIRT: 1, STONE: 2, WATER: 3, SNOW: 4, WALL: 5, TREE: 6, ROCK: 7,
    BUILDING: 8, ROOF: 9, BUSH: 10, FLOWER: 11, PATH: 12, FENCE: 13,
    FARMLAND: 14, HAY: 15, CAMPFIRE: 16
};

// Decoration layer for additional details
let decorations = [];

// Particle system for snow/ambient
let particles = [];
const MAX_PARTICLES = 50;

function updateParticles() {
    // Only create snow particles if camera is in snowy area
    if (game.camera.y < 12 * TILE_SIZE && particles.length < MAX_PARTICLES) {
        if (Math.random() < 0.3) {
            particles.push({
                x: game.camera.x + Math.random() * canvas.width,
                y: game.camera.y - 10,
                speed: 20 + Math.random() * 30,
                drift: (Math.random() - 0.5) * 20,
                size: 1 + Math.random() * 2
            });
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.speed * 0.016;
        p.x += p.drift * 0.016;

        // Remove if off screen
        if (p.y > game.camera.y + canvas.height + 20) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const p of particles) {
        const screenX = p.x - game.camera.x;
        const screenY = p.y - game.camera.y;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game state
const game = {
    state: 'playing',
    camera: { x: 0, y: 0 },
    tick: 0,
    currentZone: 'village',
    quests: [],
    dialogueActive: false,
    dialogueText: '',
    interactTarget: null
};

// Player
const player = {
    x: 400, y: 400,
    width: 14, height: 14,
    speed: 80,
    facing: 2, // 0=up, 1=right, 2=down, 3=left
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    stamina: 100, maxStamina: 100,
    level: 1, xp: 0, xpToNext: 100,
    gold: 50,
    damage: 10,
    armor: 5,
    attacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    inventory: ['Iron Sword', 'Health Potion', 'Health Potion'],
    equipped: { weapon: 'Iron Sword', armor: null },
    skills: { combat: 1, magic: 1, stealth: 1 }
};

// Enemies
let enemies = [];
let npcs = [];
let items = [];
let map = [];

// Generate world
function generateWorld() {
    map = [];
    decorations = [];

    // First pass: base terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Grass variations
            const grassVar = Math.random();
            let variant = grassVar < 0.4 ? 0 : grassVar < 0.7 ? 1 : grassVar < 0.9 ? 2 : 3;
            map[y][x] = { terrain: TERRAIN.GRASS, variant: variant };
        }
    }

    // Edge walls
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[0][x] = { terrain: TERRAIN.WALL, variant: 0 };
        map[MAP_HEIGHT - 1][x] = { terrain: TERRAIN.WALL, variant: 0 };
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y][0] = { terrain: TERRAIN.WALL, variant: 0 };
        map[y][MAP_WIDTH - 1] = { terrain: TERRAIN.WALL, variant: 0 };
    }

    // Village center - dirt area
    for (let y = 20; y <= 30; y++) {
        for (let x = 20; x <= 30; x++) {
            map[y][x] = { terrain: TERRAIN.DIRT, variant: Math.floor(Math.random() * 3) };
        }
    }

    // Main paths
    for (let i = 15; i <= 35; i++) {
        map[25][i] = { terrain: TERRAIN.PATH, variant: 0 }; // Horizontal
        map[i][25] = { terrain: TERRAIN.PATH, variant: 1 }; // Vertical
    }

    // Buildings (3x3 structures with roofs)
    const buildings = [
        { x: 21, y: 21, w: 3, h: 3, type: 'inn' },
        { x: 27, y: 21, w: 3, h: 3, type: 'smith' },
        { x: 21, y: 27, w: 3, h: 3, type: 'shop' },
        { x: 27, y: 27, w: 2, h: 2, type: 'house' }
    ];

    for (const b of buildings) {
        for (let dy = 0; dy < b.h; dy++) {
            for (let dx = 0; dx < b.w; dx++) {
                if (dy === 0) {
                    map[b.y + dy][b.x + dx] = { terrain: TERRAIN.ROOF, variant: b.type === 'inn' ? 1 : 0 };
                } else {
                    map[b.y + dy][b.x + dx] = { terrain: TERRAIN.BUILDING, variant: dx === 1 && dy === b.h - 1 ? 1 : 0 };
                }
            }
        }
    }

    // River
    for (let y = 8; y <= 42; y++) {
        const wobble = Math.floor(Math.sin(y * 0.3) * 1.5);
        for (let wx = 0; wx < 3; wx++) {
            const rx = 37 + wobble + wx;
            if (rx > 0 && rx < MAP_WIDTH - 1) {
                map[y][rx] = { terrain: TERRAIN.WATER, variant: wx === 1 ? 0 : 1 };
            }
        }
    }

    // Northern snowy/dungeon area
    for (let y = 1; y < 12; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (map[y][x].terrain === TERRAIN.GRASS) {
                map[y][x] = { terrain: TERRAIN.SNOW, variant: Math.floor(Math.random() * 2) };
            }
        }
    }

    // Dungeon entrance
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
            map[7 + dy][8 + dx] = { terrain: TERRAIN.STONE, variant: 2 };
        }
    }
    map[9][9] = { terrain: TERRAIN.STONE, variant: 3 }; // Entrance door

    // Scatter trees in forests (away from village) - DENSE FORESTS
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            if (map[y][x].terrain === TERRAIN.GRASS || map[y][x].terrain === TERRAIN.SNOW) {
                // Much denser trees farther from village
                const distFromVillage = Math.abs(x - 25) + Math.abs(y - 25);
                const treeChance = distFromVillage > 18 ? 0.35 : distFromVillage > 14 ? 0.25 : distFromVillage > 10 ? 0.12 : 0.03;

                if (Math.random() < treeChance) {
                    map[y][x].terrain = TERRAIN.TREE;
                    map[y][x].variant = Math.floor(Math.random() * 3);
                } else if (Math.random() < 0.03) {
                    map[y][x].terrain = TERRAIN.ROCK;
                    map[y][x].variant = Math.floor(Math.random() * 2);
                } else if (Math.random() < 0.06 && map[y][x].terrain === TERRAIN.GRASS && distFromVillage > 8) {
                    map[y][x].terrain = TERRAIN.BUSH;
                    map[y][x].variant = Math.floor(Math.random() * 2);
                } else if (Math.random() < 0.03 && map[y][x].terrain === TERRAIN.GRASS) {
                    map[y][x].terrain = TERRAIN.FLOWER;
                    map[y][x].variant = Math.floor(Math.random() * 3);
                }
            }
        }
    }

    // Add fences around some areas
    for (let x = 19; x <= 31; x++) {
        if (map[19][x].terrain === TERRAIN.GRASS || map[19][x].terrain === TERRAIN.DIRT) {
            map[19][x] = { terrain: TERRAIN.FENCE, variant: 0 };
        }
        if (map[31][x].terrain === TERRAIN.GRASS || map[31][x].terrain === TERRAIN.DIRT) {
            map[31][x] = { terrain: TERRAIN.FENCE, variant: 0 };
        }
    }

    // Add farmland south of village
    for (let y = 32; y <= 38; y++) {
        for (let x = 18; x <= 32; x++) {
            if (map[y][x].terrain === TERRAIN.GRASS) {
                map[y][x] = { terrain: TERRAIN.FARMLAND, variant: (x + y) % 2 };
            }
        }
    }

    // Add farmland west of village too
    for (let y = 22; y <= 28; y++) {
        for (let x = 14; x <= 18; x++) {
            if (map[y][x].terrain === TERRAIN.GRASS) {
                map[y][x] = { terrain: TERRAIN.FARMLAND, variant: (x + y) % 2 };
            }
        }
    }

    // Add hay bales
    map[33][20] = { terrain: TERRAIN.HAY, variant: 0 };
    map[33][30] = { terrain: TERRAIN.HAY, variant: 1 };
    map[26][16] = { terrain: TERRAIN.HAY, variant: 0 };

    // Add campfire in village center
    map[25][24] = { terrain: TERRAIN.CAMPFIRE, variant: 0 };
}

// Spawn entities
function spawnEntities() {
    enemies = [];
    npcs = [];
    items = [];

    // Enemies
    const enemyPositions = [
        { x: 12, y: 30, type: 'bandit' },
        { x: 15, y: 35, type: 'bandit' },
        { x: 40, y: 25, type: 'wolf' },
        { x: 42, y: 28, type: 'wolf' },
        { x: 10, y: 8, type: 'draugr' },
        { x: 12, y: 6, type: 'draugr' }
    ];

    for (const pos of enemyPositions) {
        enemies.push(createEnemy(pos.x * TILE_SIZE, pos.y * TILE_SIZE, pos.type));
    }

    // NPCs
    npcs.push({
        x: 24 * TILE_SIZE, y: 24 * TILE_SIZE,
        name: 'Innkeeper', type: 'merchant',
        dialogue: 'Welcome to Frostfall! Would you like to rest?',
        quest: null
    });

    npcs.push({
        x: 26 * TILE_SIZE, y: 23 * TILE_SIZE,
        name: 'Guard Captain', type: 'questgiver',
        dialogue: 'Bandits have been attacking travelers. Can you help?',
        quest: { id: 'kill_bandits', name: 'Clear the Bandits', target: 'bandit', count: 2, current: 0, reward: 100 }
    });

    npcs.push({
        x: 22 * TILE_SIZE, y: 26 * TILE_SIZE,
        name: 'Blacksmith', type: 'merchant',
        dialogue: 'Need weapons? I have the finest steel!',
        quest: null
    });

    // Items
    items.push({ x: 15 * TILE_SIZE, y: 20 * TILE_SIZE, type: 'gold', amount: 25 });
    items.push({ x: 30 * TILE_SIZE, y: 15 * TILE_SIZE, type: 'potion', name: 'Health Potion' });
    items.push({ x: 10 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'weapon', name: 'Steel Sword', damage: 15 });
}

function createEnemy(x, y, type) {
    const stats = {
        bandit: { hp: 40, damage: 8, speed: 50, color: '#aa6644', loot: 15 },
        wolf: { hp: 25, damage: 6, speed: 70, color: '#888888', loot: 0 },
        draugr: { hp: 60, damage: 12, speed: 40, color: '#446666', loot: 25 }
    };

    const s = stats[type];
    return {
        x, y, type,
        hp: s.hp, maxHp: s.hp,
        damage: s.damage, speed: s.speed, color: s.color, loot: s.loot,
        state: 'idle',
        target: null,
        attackCooldown: 0,
        pathTimer: 0,
        facing: 2
    };
}

// Update player
function updatePlayer(dt) {
    let dx = 0, dy = 0;
    const speed = keys.shift ? player.speed * 1.5 : player.speed;

    if (keys.w || keys.arrowup) { dy = -1; player.facing = 0; }
    if (keys.s || keys.arrowdown) { dy = 1; player.facing = 2; }
    if (keys.a || keys.arrowleft) { dx = -1; player.facing = 3; }
    if (keys.d || keys.arrowright) { dx = 1; player.facing = 1; }

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        // Move player with circular collision and sliding
        let newX = player.x + dx * speed * dt;
        let newY = player.y + dy * speed * dt;

        // Use circular collider centered on player
        const playerRadius = 6; // Smaller than player.width/2 for easier navigation
        const centerX = newX + player.width / 2;
        const centerY = newY + player.height / 2;

        const collision = canMoveCircular(centerX, centerY, playerRadius);
        if (collision.blocked) {
            // Apply push-out for sliding effect
            newX += collision.pushX;
            newY += collision.pushY;
        }

        // Final bounds check
        newX = Math.max(playerRadius, Math.min(MAP_WIDTH * TILE_SIZE - playerRadius - player.width, newX));
        newY = Math.max(playerRadius, Math.min(MAP_HEIGHT * TILE_SIZE - playerRadius - player.height, newY));

        player.x = newX;
        player.y = newY;

        // Stamina drain while sprinting
        if (keys.shift && player.stamina > 0) {
            player.stamina -= 5 * dt;
        }
    }

    // Stamina regen
    if (!keys.shift && player.stamina < player.maxStamina) {
        player.stamina = Math.min(player.maxStamina, player.stamina + 10 * dt);
    }

    // Attack
    if (player.attacking) {
        player.attackTimer -= dt;
        if (player.attackTimer <= 0) {
            player.attacking = false;
        }
    }

    if (player.attackCooldown > 0) {
        player.attackCooldown -= dt;
    }

    // Update camera (with zoom - smaller viewport means zoomed in)
    const viewWidth = canvas.width / CAMERA_ZOOM;
    const viewHeight = canvas.height / CAMERA_ZOOM;
    game.camera.x = player.x - viewWidth / 2;
    game.camera.y = player.y - viewHeight / 2;
    game.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - viewWidth, game.camera.x));
    game.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - viewHeight, game.camera.y));
}

// Circular collision check with push-out for sliding
function canMoveCircular(cx, cy, radius) {
    // Check center tile and surrounding tiles
    const checkRadius = Math.ceil(radius / TILE_SIZE) + 1;
    const centerTileX = Math.floor(cx / TILE_SIZE);
    const centerTileY = Math.floor(cy / TILE_SIZE);

    for (let ty = centerTileY - checkRadius; ty <= centerTileY + checkRadius; ty++) {
        for (let tx = centerTileX - checkRadius; tx <= centerTileX + checkRadius; tx++) {
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
                // Check distance to map boundary
                const nearestX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE, cx));
                const nearestY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE, cy));
                if (Math.hypot(cx - nearestX, cy - nearestY) < radius) {
                    return { blocked: true, pushX: 0, pushY: 0 };
                }
                continue;
            }

            const t = map[ty][tx].terrain;
            if (t === TERRAIN.WALL || t === TERRAIN.WATER || t === TERRAIN.TREE ||
                t === TERRAIN.ROCK || t === TERRAIN.BUILDING || t === TERRAIN.ROOF || t === TERRAIN.FENCE) {
                // Tile rectangle
                const tileLeft = tx * TILE_SIZE;
                const tileRight = (tx + 1) * TILE_SIZE;
                const tileTop = ty * TILE_SIZE;
                const tileBottom = (ty + 1) * TILE_SIZE;

                // Find nearest point on tile to circle center
                const nearestX = Math.max(tileLeft, Math.min(tileRight, cx));
                const nearestY = Math.max(tileTop, Math.min(tileBottom, cy));

                const dist = Math.hypot(cx - nearestX, cy - nearestY);
                if (dist < radius) {
                    // Calculate push direction
                    const overlap = radius - dist;
                    if (dist > 0) {
                        const pushX = (cx - nearestX) / dist * overlap;
                        const pushY = (cy - nearestY) / dist * overlap;
                        return { blocked: true, pushX, pushY };
                    } else {
                        // Circle center inside tile, push out in most open direction
                        return { blocked: true, pushX: 0, pushY: -overlap };
                    }
                }
            }
        }
    }

    return { blocked: false, pushX: 0, pushY: 0 };
}

// Legacy function for enemies (keep rectangular)
function canMove(x, y, w, h) {
    const tiles = [
        { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) },
        { x: Math.floor((x + w) / TILE_SIZE), y: Math.floor(y / TILE_SIZE) },
        { x: Math.floor(x / TILE_SIZE), y: Math.floor((y + h) / TILE_SIZE) },
        { x: Math.floor((x + w) / TILE_SIZE), y: Math.floor((y + h) / TILE_SIZE) }
    ];

    for (const tile of tiles) {
        if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) return false;
        const t = map[tile.y][tile.x].terrain;
        if (t === TERRAIN.WALL || t === TERRAIN.WATER || t === TERRAIN.TREE ||
            t === TERRAIN.ROCK || t === TERRAIN.BUILDING || t === TERRAIN.ROOF || t === TERRAIN.FENCE) {
            return false;
        }
    }

    return true;
}

// Attack
function playerAttack() {
    if (player.attackCooldown > 0 || player.attacking) return;

    player.attacking = true;
    player.attackTimer = 0.3;
    player.attackCooldown = 0.5;

    // Find enemies in attack range
    const attackRange = 24;
    const attackAngle = Math.PI / 2;

    const angles = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI]; // up, right, down, left
    const facingAngle = angles[player.facing];

    for (const enemy of enemies) {
        const dx = (enemy.x + 7) - (player.x + 7);
        const dy = (enemy.y + 7) - (player.y + 7);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < attackRange) {
            const angle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angle - facingAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (angleDiff < attackAngle / 2) {
                // Hit!
                const damage = player.damage + Math.floor(player.skills.combat * 0.5);
                enemy.hp -= damage;
                showDamageNumber(enemy.x, enemy.y, damage);

                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }
            }
        }
    }
}

let damageNumbers = [];
function showDamageNumber(x, y, amount) {
    damageNumbers.push({ x, y, amount, timer: 1 });
}

function killEnemy(enemy) {
    // Drop loot
    if (enemy.loot > 0) {
        items.push({ x: enemy.x, y: enemy.y, type: 'gold', amount: enemy.loot });
    }

    // XP
    player.xp += 20;
    if (player.xp >= player.xpToNext) {
        levelUp();
    }

    // Quest progress
    for (const quest of game.quests) {
        if (quest.target === enemy.type && quest.current < quest.count) {
            quest.current++;
            showMessage(`Quest progress: ${quest.current}/${quest.count}`);
        }
    }

    // Remove enemy
    enemies = enemies.filter(e => e !== enemy);
}

function levelUp() {
    player.level++;
    player.xp = 0;
    player.xpToNext = player.level * 100;
    player.maxHp += 10;
    player.hp = player.maxHp;
    player.damage += 2;
    showMessage(`Level Up! You are now level ${player.level}`);
}

let messageText = '';
let messageTimer = 0;
function showMessage(text) {
    messageText = text;
    messageTimer = 3;
}

// Update enemies
function updateEnemies(dt) {
    for (const enemy of enemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);

        if (enemy.state === 'idle' && dist < 100) {
            enemy.state = 'chase';
            enemy.target = player;
        }

        if (enemy.state === 'chase') {
            if (dist > 200) {
                enemy.state = 'idle';
            } else if (dist < 20) {
                // Attack player
                enemy.attackCooldown -= dt;
                if (enemy.attackCooldown <= 0) {
                    player.hp -= Math.max(1, enemy.damage - player.armor);
                    showDamageNumber(player.x, player.y, enemy.damage);
                    enemy.attackCooldown = 1;

                    if (player.hp <= 0) {
                        game.state = 'gameover';
                    }
                }
            } else {
                // Move toward player
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const len = Math.sqrt(dx * dx + dy * dy);

                const newX = enemy.x + (dx / len) * enemy.speed * dt;
                const newY = enemy.y + (dy / len) * enemy.speed * dt;

                if (canMove(newX, enemy.y, 14, 14)) enemy.x = newX;
                if (canMove(enemy.x, newY, 14, 14)) enemy.y = newY;

                enemy.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
            }
        }
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Draw functions
function draw() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera zoom for game world rendering
    ctx.save();
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

    drawMap();
    drawItems();
    drawEntities();
    drawPlayer();
    drawDamageNumbers();

    ctx.restore(); // Restore to draw UI at normal scale

    drawUI();

    if (game.dialogueActive) {
        drawDialogue();
    }

    if (game.state === 'gameover') {
        drawGameOver();
    }
}

function drawMap() {
    const viewWidth = canvas.width / CAMERA_ZOOM;
    const viewHeight = canvas.height / CAMERA_ZOOM;
    const startX = Math.floor(game.camera.x / TILE_SIZE);
    const startY = Math.floor(game.camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(viewWidth / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(viewHeight / TILE_SIZE) + 2);

    // First pass: ground tiles
    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = Math.floor(x * TILE_SIZE - game.camera.x);
            const screenY = Math.floor(y * TILE_SIZE - game.camera.y);

            drawTile(tile, screenX, screenY, x, y);
        }
    }

    // Second pass: tall objects (trees, buildings) drawn with depth
    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = Math.floor(x * TILE_SIZE - game.camera.x);
            const screenY = Math.floor(y * TILE_SIZE - game.camera.y);

            if (tile.terrain === TERRAIN.TREE) {
                drawTree(screenX, screenY, tile.variant);
            }
        }
    }
}

function drawTile(tile, screenX, screenY, tileX, tileY) {
    const t = tile.terrain;
    const v = tile.variant;

    switch (t) {
        case TERRAIN.GRASS:
            // Varied grass colors
            const grassColors = [COLORS.GRASS, COLORS.GRASS_DARK, COLORS.GRASS_LIGHT, COLORS.GRASS_DARKER];
            ctx.fillStyle = grassColors[v] || COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Grass detail - tufts
            const tuftSeed = (tileX * 17 + tileY * 31) % 7;
            if (tuftSeed === 0) {
                ctx.fillStyle = COLORS.GRASS_DARK;
                ctx.fillRect(screenX + 2, screenY + 10, 2, 5);
                ctx.fillRect(screenX + 4, screenY + 9, 1, 6);
                ctx.fillRect(screenX + 6, screenY + 11, 2, 4);
            } else if (tuftSeed === 1) {
                ctx.fillStyle = COLORS.GRASS_DARKER;
                ctx.fillRect(screenX + 9, screenY + 8, 2, 6);
                ctx.fillRect(screenX + 11, screenY + 9, 1, 5);
                ctx.fillRect(screenX + 13, screenY + 10, 2, 4);
            } else if (tuftSeed === 2) {
                // Small stones
                ctx.fillStyle = '#5a5a5a';
                ctx.fillRect(screenX + 5, screenY + 11, 3, 2);
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(screenX + 11, screenY + 13, 2, 2);
            } else if (tuftSeed === 3) {
                // Dirt patch
                ctx.fillStyle = COLORS.DIRT_DARK;
                ctx.fillRect(screenX + 4, screenY + 6, 5, 4);
            }
            break;

        case TERRAIN.DIRT:
            ctx.fillStyle = v === 0 ? COLORS.DIRT : v === 1 ? COLORS.DIRT_DARK : '#7a6a5a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Dirt texture
            ctx.fillStyle = COLORS.DIRT_DARK;
            ctx.fillRect(screenX + 3, screenY + 5, 2, 2);
            ctx.fillRect(screenX + 10, screenY + 12, 2, 2);
            break;

        case TERRAIN.PATH:
            ctx.fillStyle = COLORS.STONE;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.STONE_LIGHT;
            ctx.fillRect(screenX + 2, screenY + 2, 4, 4);
            ctx.fillRect(screenX + 10, screenY + 8, 4, 4);
            ctx.fillStyle = COLORS.STONE_DARK;
            ctx.fillRect(screenX + 8, screenY + 2, 3, 3);
            break;

        case TERRAIN.STONE:
            if (v === 2) {
                // Dungeon floor
                ctx.fillStyle = COLORS.STONE_DARK;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.STONE;
                ctx.fillRect(screenX + 1, screenY + 1, 6, 6);
                ctx.fillRect(screenX + 9, screenY + 9, 6, 6);
            } else if (v === 3) {
                // Dungeon entrance
                ctx.fillStyle = COLORS.STONE_DARK;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(screenX + 3, screenY + 3, 10, 10);
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX + 4, screenY + 8, 8, 2);
            } else {
                ctx.fillStyle = COLORS.STONE;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
            break;

        case TERRAIN.WATER:
            ctx.fillStyle = v === 0 ? COLORS.WATER : COLORS.WATER_DARK;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Animated water waves
            const wave1 = Math.sin((game.tick * 0.08) + tileX * 0.5 + tileY * 0.3);
            const wave2 = Math.sin((game.tick * 0.05) + tileX * 0.3 - tileY * 0.2);
            if (wave1 > 0.3) {
                ctx.fillStyle = 'rgba(100,150,200,0.25)';
                ctx.fillRect(screenX + 2, screenY + 4, 8, 2);
            }
            if (wave2 > 0.4) {
                ctx.fillStyle = 'rgba(80,130,180,0.2)';
                ctx.fillRect(screenX + 6, screenY + 10, 6, 2);
            }
            // Water sparkle
            if ((tileX * 13 + tileY * 7) % 11 === Math.floor(game.tick / 30) % 11) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(screenX + 7, screenY + 3, 2, 2);
            }
            break;

        case TERRAIN.SNOW:
            ctx.fillStyle = v === 0 ? COLORS.SNOW : COLORS.SNOW_DARK;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Snow sparkle
            if ((tileX * 7 + tileY * 11) % 5 === 0) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(screenX + 5, screenY + 5, 2, 2);
            }
            break;

        case TERRAIN.WALL:
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
            break;

        case TERRAIN.BUILDING:
            // Wood wall
            ctx.fillStyle = COLORS.WOOD_DARK;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.WOOD;
            ctx.fillRect(screenX + 1, screenY + 2, TILE_SIZE - 2, 4);
            ctx.fillRect(screenX + 1, screenY + 10, TILE_SIZE - 2, 4);
            // Door
            if (v === 1) {
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(screenX + 4, screenY + 2, 8, 14);
                ctx.fillStyle = COLORS.GOLD;
                ctx.fillRect(screenX + 10, screenY + 8, 2, 2);
            }
            break;

        case TERRAIN.ROOF:
            // Slanted roof
            ctx.fillStyle = v === 1 ? '#7a5040' : '#6a4535';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = v === 1 ? '#8a6050' : '#7a5545';
            ctx.fillRect(screenX, screenY + 4, TILE_SIZE, 4);
            ctx.fillRect(screenX, screenY + 12, TILE_SIZE, 4);
            break;

        case TERRAIN.BUSH:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Bush
            ctx.fillStyle = COLORS.TREE_DARK;
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 10, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.TREE_MID;
            ctx.beginPath();
            ctx.arc(screenX + 6, screenY + 8, 4, 0, Math.PI * 2);
            ctx.fill();
            break;

        case TERRAIN.FLOWER:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Flower
            const flowerColors = ['#dd6666', '#dddd66', '#6666dd'];
            ctx.fillStyle = COLORS.TREE_DARK;
            ctx.fillRect(screenX + 7, screenY + 8, 2, 6);
            ctx.fillStyle = flowerColors[v];
            ctx.fillRect(screenX + 5, screenY + 5, 6, 4);
            ctx.fillStyle = '#ffff88';
            ctx.fillRect(screenX + 7, screenY + 6, 2, 2);
            break;

        case TERRAIN.FENCE:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Fence post
            ctx.fillStyle = COLORS.WOOD_DARK;
            ctx.fillRect(screenX, screenY + 6, TILE_SIZE, 4);
            ctx.fillStyle = COLORS.WOOD;
            ctx.fillRect(screenX + 2, screenY + 4, 2, 8);
            ctx.fillRect(screenX + 12, screenY + 4, 2, 8);
            break;

        case TERRAIN.ROCK:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Rock
            ctx.fillStyle = COLORS.STONE;
            ctx.beginPath();
            ctx.moveTo(screenX + 2, screenY + 14);
            ctx.lineTo(screenX + 4, screenY + 6);
            ctx.lineTo(screenX + 12, screenY + 6);
            ctx.lineTo(screenX + 14, screenY + 14);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = COLORS.STONE_LIGHT;
            ctx.fillRect(screenX + 5, screenY + 8, 4, 3);
            break;

        case TERRAIN.TREE:
            // Just draw grass base, tree is drawn in second pass
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;

        case TERRAIN.FARMLAND:
            // Tilled soil rows
            ctx.fillStyle = v === 0 ? '#4a3a2a' : '#5a4a3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Furrows
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(screenX, screenY + 2, TILE_SIZE, 2);
            ctx.fillRect(screenX, screenY + 8, TILE_SIZE, 2);
            ctx.fillRect(screenX, screenY + 14, TILE_SIZE, 2);
            // Some crops
            if ((tileX * 3 + tileY * 7) % 4 === 0) {
                ctx.fillStyle = '#5a8a4a';
                ctx.fillRect(screenX + 4, screenY + 4, 3, 4);
                ctx.fillRect(screenX + 10, screenY + 10, 3, 4);
            }
            break;

        case TERRAIN.HAY:
            // Draw dirt beneath
            ctx.fillStyle = COLORS.DIRT;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Hay bale
            ctx.fillStyle = '#c4a444';
            ctx.fillRect(screenX + 2, screenY + 4, 12, 10);
            ctx.fillStyle = '#d4b454';
            ctx.fillRect(screenX + 3, screenY + 5, 10, 4);
            // Hay strands
            ctx.fillStyle = '#e4c464';
            ctx.fillRect(screenX + 4, screenY + 2, 2, 4);
            ctx.fillRect(screenX + 10, screenY + 3, 2, 3);
            break;

        case TERRAIN.CAMPFIRE:
            // Draw dirt beneath
            ctx.fillStyle = COLORS.DIRT;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Stone ring
            ctx.fillStyle = COLORS.STONE;
            ctx.fillRect(screenX + 2, screenY + 10, 12, 4);
            ctx.fillRect(screenX + 4, screenY + 8, 8, 2);
            // Fire
            const flicker = Math.sin(game.tick * 0.2) * 2;
            ctx.fillStyle = '#ff6622';
            ctx.beginPath();
            ctx.moveTo(screenX + 8, screenY + 2 + flicker);
            ctx.lineTo(screenX + 12, screenY + 10);
            ctx.lineTo(screenX + 4, screenY + 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.moveTo(screenX + 8, screenY + 4 + flicker);
            ctx.lineTo(screenX + 10, screenY + 9);
            ctx.lineTo(screenX + 6, screenY + 9);
            ctx.closePath();
            ctx.fill();
            // Glow effect
            ctx.fillStyle = 'rgba(255,100,0,0.15)';
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 8, 12, 0, Math.PI * 2);
            ctx.fill();
            // Logs
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX + 3, screenY + 11, 4, 2);
            ctx.fillRect(screenX + 9, screenY + 11, 4, 2);
            break;

        default:
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

function drawTree(screenX, screenY, variant) {
    const size = variant === 2 ? 1.4 : variant === 1 ? 1.2 : 1.0;
    const trunkColor = variant === 2 ? '#5a4030' : '#4a3525';

    // Shadow
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(screenX + 8, screenY + 15, 7 * size, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk - more prominent
    ctx.fillStyle = trunkColor;
    ctx.fillRect(screenX + 5, screenY + 6, 6, 10);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(screenX + 5, screenY + 6, 2, 10); // Dark side

    // Pine tree layers - fuller
    ctx.fillStyle = COLORS.TREE_DARK;
    // Bottom layer
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY - 2 * size);
    ctx.lineTo(screenX + 16, screenY + 12);
    ctx.lineTo(screenX, screenY + 12);
    ctx.closePath();
    ctx.fill();

    // Middle layer
    ctx.fillStyle = COLORS.TREE_MID;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY - 6 * size);
    ctx.lineTo(screenX + 14, screenY + 6);
    ctx.lineTo(screenX + 2, screenY + 6);
    ctx.closePath();
    ctx.fill();

    // Top layer
    ctx.fillStyle = COLORS.TREE_LIGHT;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY - 10 * size);
    ctx.lineTo(screenX + 12, screenY);
    ctx.lineTo(screenX + 4, screenY);
    ctx.closePath();
    ctx.fill();

    // Tree detail - small branches
    ctx.fillStyle = COLORS.TREE_DARK;
    ctx.fillRect(screenX + 2, screenY + 3, 3, 2);
    ctx.fillRect(screenX + 11, screenY + 5, 3, 2);

    // Snow on tree if in snowy area
    if (screenY + game.camera.y < 12 * TILE_SIZE) {
        ctx.fillStyle = COLORS.SNOW;
        ctx.fillRect(screenX + 5, screenY - 8 * size, 6, 3);
        ctx.fillRect(screenX + 3, screenY - 2, 4, 2);
        ctx.fillRect(screenX + 10, screenY + 2, 4, 2);
        ctx.fillRect(screenX + 1, screenY + 8, 3, 2);
    }
}

function drawItems() {
    for (const item of items) {
        const screenX = item.x - game.camera.x;
        const screenY = item.y - game.camera.y;

        if (item.type === 'gold') {
            ctx.fillStyle = COLORS.GOLD;
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 8, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'potion') {
            ctx.fillStyle = '#cc4466';
            ctx.fillRect(screenX + 5, screenY + 3, 6, 10);
            ctx.fillStyle = '#aa2244';
            ctx.fillRect(screenX + 6, screenY + 0, 4, 4);
        } else if (item.type === 'weapon') {
            ctx.fillStyle = '#aaaaaa';
            ctx.fillRect(screenX + 7, screenY + 2, 2, 12);
            ctx.fillStyle = '#664422';
            ctx.fillRect(screenX + 5, screenY + 12, 6, 3);
        }
    }
}

function drawEntities() {
    // NPCs
    for (const npc of npcs) {
        const screenX = npc.x - game.camera.x;
        const screenY = npc.y - game.camera.y;

        // Shadow
        ctx.fillStyle = COLORS.SHADOW;
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 14, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyColor = npc.type === 'merchant' ? '#6a5a4a' : npc.type === 'questgiver' ? '#4a5a6a' : COLORS.NPC;
        ctx.fillStyle = bodyColor;
        ctx.fillRect(screenX + 4, screenY + 4, 8, 10);

        // Clothes detail
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX + 6, screenY + 8, 4, 1);

        // Head
        ctx.fillStyle = COLORS.SKIN;
        ctx.fillRect(screenX + 5, screenY - 1, 6, 6);

        // Hair
        ctx.fillStyle = '#3a3020';
        ctx.fillRect(screenX + 5, screenY - 2, 6, 3);

        // Quest marker
        if (npc.quest && !game.quests.some(q => q.id === npc.quest.id)) {
            ctx.fillStyle = COLORS.GOLD;
            ctx.font = 'bold 14px Arial';
            ctx.fillText('!', screenX + 5, screenY - 8);
        }

        // Name on hover (if close)
        const distToPlayer = distance(player.x, player.y, npc.x, npc.y);
        if (distToPlayer < 40) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(screenX - 10, screenY - 20, ctx.measureText(npc.name).width + 8, 12);
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.fillText(npc.name, screenX - 6, screenY - 11);
        }
    }

    // Enemies
    for (const enemy of enemies) {
        const screenX = enemy.x - game.camera.x;
        const screenY = enemy.y - game.camera.y;

        // Shadow
        ctx.fillStyle = COLORS.SHADOW;
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 14, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (enemy.type === 'wolf') {
            // Wolf body
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(screenX + 2, screenY + 6, 12, 6);
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(screenX + 3, screenY + 8, 10, 4);
            // Wolf head
            ctx.fillStyle = '#7a7a7a';
            ctx.fillRect(screenX + 10, screenY + 4, 5, 5);
            // Ears
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(screenX + 10, screenY + 2, 2, 3);
            ctx.fillRect(screenX + 13, screenY + 2, 2, 3);
            // Eye
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(screenX + 13, screenY + 5, 1, 1);
        } else if (enemy.type === 'draugr') {
            // Draugr - undead warrior
            ctx.fillStyle = '#4a5a5a';
            ctx.fillRect(screenX + 4, screenY + 4, 8, 10);
            // Tattered armor
            ctx.fillStyle = '#3a4a4a';
            ctx.fillRect(screenX + 5, screenY + 6, 6, 4);
            // Skull face
            ctx.fillStyle = '#6a7a7a';
            ctx.fillRect(screenX + 5, screenY - 1, 6, 6);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX + 6, screenY + 1, 2, 2);
            ctx.fillRect(screenX + 9, screenY + 1, 2, 2);
            // Glowing eyes
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(screenX + 6, screenY + 1, 1, 1);
            ctx.fillRect(screenX + 9, screenY + 1, 1, 1);
        } else {
            // Bandit
            ctx.fillStyle = '#7a5a4a';
            ctx.fillRect(screenX + 4, screenY + 4, 8, 10);
            // Leather armor
            ctx.fillStyle = '#5a4030';
            ctx.fillRect(screenX + 5, screenY + 6, 6, 6);
            // Head
            ctx.fillStyle = '#d8b8a0';
            ctx.fillRect(screenX + 5, screenY - 1, 6, 6);
            // Hood
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(screenX + 4, screenY - 2, 8, 4);
        }

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = COLORS.HEALTH_BG;
            ctx.fillRect(screenX, screenY - 6, 16, 4);
            ctx.fillStyle = COLORS.HEALTH;
            ctx.fillRect(screenX, screenY - 6, 16 * (enemy.hp / enemy.maxHp), 4);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(screenX, screenY - 6, 16, 4);
        }

        // Alert indicator
        if (enemy.state === 'chase') {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('!', screenX + 6, screenY - 10);
        }
    }
}

function drawPlayer() {
    const screenX = player.x - game.camera.x;
    const screenY = player.y - game.camera.y;

    // Shadow
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(screenX + 8, screenY + 14, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - armor/clothes
    ctx.fillStyle = '#5577aa'; // Blue tunic
    ctx.fillRect(screenX + 4, screenY + 4, 8, 10);

    // Armor detail
    ctx.fillStyle = '#4466aa';
    ctx.fillRect(screenX + 5, screenY + 6, 6, 4);

    // Belt
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(screenX + 4, screenY + 10, 8, 2);

    // Head
    ctx.fillStyle = COLORS.SKIN;
    ctx.fillRect(screenX + 5, screenY - 1, 6, 6);

    // Hair
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(screenX + 5, screenY - 2, 6, 3);

    // Eyes (based on facing)
    ctx.fillStyle = '#222';
    if (player.facing === 0) { // Up
        // Show back of head
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(screenX + 5, screenY, 6, 4);
    } else if (player.facing === 2) { // Down
        ctx.fillRect(screenX + 6, screenY + 1, 1, 1);
        ctx.fillRect(screenX + 9, screenY + 1, 1, 1);
    } else {
        // Side view
        const eyeX = player.facing === 1 ? screenX + 9 : screenX + 6;
        ctx.fillRect(eyeX, screenY + 1, 1, 1);
    }

    // Weapon swing
    if (player.attacking) {
        ctx.fillStyle = '#aaa';
        ctx.save();
        ctx.translate(screenX + 8, screenY + 8);
        const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
        ctx.rotate(angles[player.facing] + Math.sin(player.attackTimer * 20) * 0.8);

        // Sword
        ctx.fillStyle = '#888';
        ctx.fillRect(-2, -18, 3, 16);
        // Sword hilt
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(-3, -3, 5, 4);
        // Crossguard
        ctx.fillStyle = '#666';
        ctx.fillRect(-4, -4, 7, 2);

        ctx.restore();
    } else {
        // Show sword at side when not attacking
        ctx.fillStyle = '#888';
        const swordOffsets = [
            { x: 12, y: 2, r: 0.3 },     // Up
            { x: 12, y: 6, r: 0.5 },      // Right
            { x: 0, y: 6, r: -0.5 },      // Down
            { x: 0, y: 6, r: -0.5 }       // Left
        ];
        const so = swordOffsets[player.facing];
        ctx.save();
        ctx.translate(screenX + so.x, screenY + so.y);
        ctx.rotate(so.r);
        ctx.fillRect(0, 0, 2, 10);
        ctx.restore();
    }
}

function drawDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        const screenX = dn.x - game.camera.x;
        const screenY = dn.y - game.camera.y - (1 - dn.timer) * 20;

        ctx.fillStyle = `rgba(255, 100, 100, ${dn.timer})`;
        ctx.font = 'bold 12px Arial';
        ctx.fillText(dn.amount.toString(), screenX, screenY);

        dn.timer -= 0.03;
        if (dn.timer <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function drawUI() {
    // Bottom panel (Stoneshard style)
    const panelHeight = 70;
    const panelY = canvas.height - panelHeight;

    // Dark panel background
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, panelY, canvas.width, panelHeight);

    // Panel top border
    ctx.fillStyle = COLORS.UI_BORDER;
    ctx.fillRect(0, panelY, canvas.width, 2);
    ctx.fillStyle = COLORS.UI_BORDER_LIGHT;
    ctx.fillRect(0, panelY + 2, canvas.width, 1);

    // Left section: Bars
    const barX = 15;
    const barWidth = 120;
    const barHeight = 14;

    // Health bar
    ctx.fillStyle = COLORS.HEALTH_BG;
    ctx.fillRect(barX, panelY + 10, barWidth, barHeight);
    ctx.fillStyle = COLORS.HEALTH;
    ctx.fillRect(barX, panelY + 10, barWidth * (player.hp / player.maxHp), barHeight);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(barX, panelY + 10, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, barX + 40, panelY + 21);

    // Mana bar
    ctx.fillStyle = COLORS.MANA_BG;
    ctx.fillRect(barX, panelY + 28, barWidth, barHeight);
    ctx.fillStyle = COLORS.MANA;
    ctx.fillRect(barX, panelY + 28, barWidth * (player.mp / player.maxMp), barHeight);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(barX, panelY + 28, barWidth, barHeight);
    ctx.fillText(`${Math.floor(player.mp)}/${player.maxMp}`, barX + 40, panelY + 39);

    // Stamina bar
    ctx.fillStyle = COLORS.STAMINA_BG;
    ctx.fillRect(barX, panelY + 46, barWidth, barHeight);
    ctx.fillStyle = COLORS.STAMINA;
    ctx.fillRect(barX, panelY + 46, barWidth * (player.stamina / player.maxStamina), barHeight);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(barX, panelY + 46, barWidth, barHeight);

    // Center section: Inventory slots
    const slotSize = 28;
    const slotStartX = canvas.width / 2 - (slotSize * 4);
    for (let i = 0; i < 8; i++) {
        const sx = slotStartX + i * (slotSize + 4);
        ctx.fillStyle = COLORS.UI_BG;
        ctx.fillRect(sx, panelY + 20, slotSize, slotSize);
        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.strokeRect(sx, panelY + 20, slotSize, slotSize);

        // Show quick slot numbers
        if (i < 3) {
            ctx.fillStyle = '#888';
            ctx.font = '9px Arial';
            ctx.fillText(`${i + 1}`, sx + 2, panelY + 30);
        }

        // Show inventory item icon
        if (i < player.inventory.length) {
            const item = player.inventory[i];
            if (item.includes('Potion')) {
                ctx.fillStyle = '#cc4466';
                ctx.fillRect(sx + 8, panelY + 26, 12, 14);
                ctx.fillStyle = '#aa2244';
                ctx.fillRect(sx + 10, panelY + 23, 8, 4);
            } else if (item.includes('Sword')) {
                ctx.fillStyle = '#aaa';
                ctx.fillRect(sx + 12, panelY + 24, 4, 18);
                ctx.fillStyle = '#664422';
                ctx.fillRect(sx + 10, panelY + 38, 8, 4);
            }
        }
    }

    // Right section: Stats
    const statsX = canvas.width - 110;
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(statsX, panelY + 8, 100, 54);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(statsX, panelY + 8, 100, 54);

    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`Level ${player.level}`, statsX + 10, panelY + 24);

    ctx.font = '10px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText(`XP: ${player.xp}/${player.xpToNext}`, statsX + 10, panelY + 38);

    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText(`Gold: ${player.gold}`, statsX + 10, panelY + 52);

    // Top UI: Quest tracker
    if (game.quests.length > 0) {
        ctx.fillStyle = 'rgba(18,20,26,0.9)';
        ctx.fillRect(10, 10, 200, 25 + game.quests.length * 18);
        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.strokeRect(10, 10, 200, 25 + game.quests.length * 18);

        ctx.fillStyle = COLORS.GOLD;
        ctx.font = 'bold 11px Arial';
        ctx.fillText('ACTIVE QUESTS', 20, 26);

        ctx.fillStyle = '#ccc';
        ctx.font = '10px Arial';
        for (let i = 0; i < game.quests.length; i++) {
            const q = game.quests[i];
            const complete = q.current >= q.count;
            ctx.fillStyle = complete ? '#4a4' : '#ccc';
            ctx.fillText(`${complete ? '✓' : '○'} ${q.name}: ${q.current}/${q.count}`, 20, 42 + i * 18);
        }
    }

    // Top center: Minimap frame (optional)
    const minimapSize = 60;
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(canvas.width / 2 - minimapSize / 2, 10, minimapSize, minimapSize);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(canvas.width / 2 - minimapSize / 2, 10, minimapSize, minimapSize);

    // Draw minimap
    const mmScale = minimapSize / (MAP_WIDTH * TILE_SIZE);
    const mmX = canvas.width / 2 - minimapSize / 2;
    const mmY = 10;
    ctx.fillStyle = COLORS.GRASS_DARK;
    ctx.fillRect(mmX + 1, mmY + 1, minimapSize - 2, minimapSize - 2);

    // Player position on minimap
    ctx.fillStyle = '#fff';
    ctx.fillRect(mmX + player.x * mmScale, mmY + player.y * mmScale, 3, 3);

    // Quest target markers on minimap and screen arrow
    for (const quest of game.quests) {
        if (quest.current >= quest.count) continue; // Quest complete

        // Find enemies matching quest target
        for (const enemy of enemies) {
            if (enemy.type === quest.target) {
                // Draw on minimap (yellow dot)
                ctx.fillStyle = COLORS.GOLD;
                ctx.fillRect(mmX + enemy.x * mmScale - 1, mmY + enemy.y * mmScale - 1, 4, 4);
            }
        }
    }

    // Draw arrow pointing to nearest quest target (edge of screen indicator)
    drawQuestArrow();

    // Message popup
    if (messageTimer > 0) {
        const msgWidth = ctx.measureText(messageText).width + 40;
        ctx.fillStyle = 'rgba(18,20,26,0.95)';
        ctx.fillRect(canvas.width / 2 - msgWidth / 2, 80, msgWidth, 30);
        ctx.strokeStyle = COLORS.GOLD;
        ctx.strokeRect(canvas.width / 2 - msgWidth / 2, 80, msgWidth, 30);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(messageText, canvas.width / 2, 100);
        ctx.textAlign = 'left';
        messageTimer -= 0.016;
    }

    // Controls hint (subtle)
    ctx.fillStyle = '#444';
    ctx.font = '9px Arial';
    ctx.fillText('WASD: Move | Space: Attack | E: Interact', 145, panelY + 62);
}

// Quest arrow indicator pointing toward nearest quest target
function drawQuestArrow() {
    if (game.quests.length === 0) return;

    let nearestTarget = null;
    let nearestDist = Infinity;

    // Find nearest quest target enemy
    for (const quest of game.quests) {
        if (quest.current >= quest.count) continue;

        for (const enemy of enemies) {
            if (enemy.type === quest.target) {
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestTarget = enemy;
                }
            }
        }
    }

    if (!nearestTarget) return;

    // Check if target is off screen
    const viewWidth = canvas.width / CAMERA_ZOOM;
    const viewHeight = canvas.height / CAMERA_ZOOM;
    const screenX = (nearestTarget.x - game.camera.x) * CAMERA_ZOOM;
    const screenY = (nearestTarget.y - game.camera.y) * CAMERA_ZOOM;

    // If on screen, don't show arrow
    if (screenX > 50 && screenX < canvas.width - 50 &&
        screenY > 100 && screenY < canvas.height - 150) {
        return;
    }

    // Calculate arrow position at edge of screen
    const angle = Math.atan2(nearestTarget.y - player.y, nearestTarget.x - player.x);
    const arrowDist = 120;
    const centerX = canvas.width / 2;
    const centerY = (canvas.height - 70) / 2; // Account for UI panel

    let arrowX = centerX + Math.cos(angle) * arrowDist;
    let arrowY = centerY + Math.sin(angle) * arrowDist;

    // Clamp to screen edges
    arrowX = Math.max(40, Math.min(canvas.width - 40, arrowX));
    arrowY = Math.max(100, Math.min(canvas.height - 130, arrowY));

    // Draw arrow
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);

    // Arrow shape
    ctx.fillStyle = COLORS.GOLD;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();

    // Arrow outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Distance indicator
    const distText = Math.floor(nearestDist / TILE_SIZE) + 'm';
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(distText, arrowX, arrowY + 25);
    ctx.textAlign = 'left';
}

function drawDialogue() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(50, canvas.height - 150, canvas.width - 100, 120);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(50, canvas.height - 150, canvas.width - 100, 120);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(game.interactTarget?.name || 'NPC', 70, canvas.height - 125);

    ctx.font = '12px Arial';
    const lines = wrapText(game.dialogueText, canvas.width - 140);
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 70, canvas.height - 105 + i * 16);
    }

    ctx.fillStyle = '#888';
    ctx.fillText('Press E to close', canvas.width - 160, canvas.height - 40);
}

function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';
}

// Input
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (game.state === 'gameover' && e.key.toLowerCase() === 'r') {
        initGame();
        return;
    }

    if (e.key === ' ') {
        e.preventDefault();
        if (!game.dialogueActive) {
            playerAttack();
        }
    }

    if (e.key.toLowerCase() === 'e') {
        if (game.dialogueActive) {
            game.dialogueActive = false;
            // Accept quest if available
            if (game.interactTarget?.quest && !game.quests.some(q => q.id === game.interactTarget.quest.id)) {
                game.quests.push({ ...game.interactTarget.quest });
                showMessage(`Quest accepted: ${game.interactTarget.quest.name}`);
            }
        } else {
            interact();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function interact() {
    // Check NPCs
    for (const npc of npcs) {
        if (distance(player.x, player.y, npc.x, npc.y) < 30) {
            game.dialogueActive = true;
            game.dialogueText = npc.dialogue;
            game.interactTarget = npc;
            return;
        }
    }

    // Check items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (distance(player.x, player.y, item.x, item.y) < 24) {
            if (item.type === 'gold') {
                player.gold += item.amount;
                showMessage(`Picked up ${item.amount} gold`);
            } else if (item.type === 'potion') {
                player.inventory.push(item.name);
                showMessage(`Picked up ${item.name}`);
            } else if (item.type === 'weapon') {
                player.inventory.push(item.name);
                player.damage = item.damage;
                showMessage(`Equipped ${item.name}!`);
            }
            items.splice(i, 1);
            return;
        }
    }
}

// Initialize
function initGame() {
    generateWorld();
    spawnEntities();

    player.x = 25 * TILE_SIZE;
    player.y = 25 * TILE_SIZE;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.stamina = player.maxStamina;
    player.level = 1;
    player.xp = 0;
    player.gold = 50;
    player.damage = 10;

    game.state = 'playing';
    game.quests = [];
    game.dialogueActive = false;
    damageNumbers = [];
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (game.state === 'playing' && !game.dialogueActive) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateParticles();
        game.tick++;
    }

    draw();
    drawParticles();
    requestAnimationFrame(gameLoop);
}

// Expose for testing
window.gameState = game;
window.player = player;
Object.defineProperty(window, 'enemies', { get: () => enemies });

initGame();
requestAnimationFrame(gameLoop);
