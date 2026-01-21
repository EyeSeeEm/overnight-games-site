// Quasimorph Clone - Turn-based tactical horror roguelike
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const VIEW_WIDTH = 25;
const VIEW_HEIGHT = 18;
const VISION_RANGE = 6;

// Game state
let state = 'menu'; // menu, playing, enemyTurn, gameover, victory
let turn = 0;
let corruption = 0;
let score = 0;
let floatingTexts = [];

// Map
let map = [];
let visible = [];
let explored = [];

// Rooms
let rooms = [];
let extractionPoint = { x: 0, y: 0 };

// Player
const player = {
    x: 0, y: 0,
    hp: 100, maxHp: 100,
    ap: 2, maxAp: 2,
    stance: 'walk', // walk, run
    bleeding: false,
    weapons: [],
    currentWeapon: 0,
    inventory: [],
    inventorySize: 6
};

// Weapons data
const WEAPON_DATA = {
    knife: { name: 'Knife', apCost: 1, range: 1, accuracy: 90, damage: [20, 30], durability: 999, silent: true, ammoType: null },
    pistol: { name: 'Pistol', apCost: 1, range: 6, accuracy: 75, damage: [15, 20], durability: 30, silent: false, ammoType: '9mm' },
    smg: { name: 'SMG', apCost: 1, range: 5, accuracy: 60, damage: [10, 15], durability: 25, silent: false, ammoType: '9mm', burst: 3 },
    shotgun: { name: 'Shotgun', apCost: 2, range: 3, accuracy: 80, damage: [25, 40], durability: 20, silent: false, ammoType: '12g' }
};

// Enemies
let enemies = [];

// Enemy data
const ENEMY_DATA = {
    guard: { name: 'Guard', hp: 50, ap: 2, damage: [8, 12], range: 5, color: '#6a8a6a', behavior: 'patrol' },
    soldier: { name: 'Soldier', hp: 75, ap: 2, damage: [12, 18], range: 5, color: '#4a6a8a', behavior: 'aggressive' },
    possessed: { name: 'Possessed', hp: 80, ap: 3, damage: [15, 25], range: 1, color: '#8a4a6a', behavior: 'charge' },
    bloater: { name: 'Bloater', hp: 150, ap: 1, damage: [30, 50], range: 2, color: '#6a4a8a', behavior: 'slow', explodes: true },
    stalker: { name: 'Stalker', hp: 60, ap: 4, damage: [10, 20], range: 1, color: '#4a4a4a', behavior: 'ambush' }
};

// Items data
const ITEM_DATA = {
    bandage: { name: 'Bandage', type: 'heal', value: 10, stopBleed: true },
    medkit: { name: 'Medkit', type: 'heal', value: 30 },
    cigarettes: { name: 'Cigarettes', type: 'corruption', value: -25 },
    frag: { name: 'Frag Grenade', type: 'grenade', damage: 40, radius: 2 },
    ammo9mm: { name: '9mm Ammo', type: 'ammo', ammoType: '9mm', amount: 12 },
    ammo12g: { name: '12g Shells', type: 'ammo', ammoType: '12g', amount: 6 }
};

// Camera
let camera = { x: 0, y: 0 };

// Input
let keys = {};
let targetMode = false;
let targetX = 0, targetY = 0;

// Generate procedural station
function generateMap() {
    map = [];
    visible = [];
    explored = [];
    rooms = [];
    enemies = [];

    // Initialize map with walls
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        visible[y] = [];
        explored[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = { type: 'wall', item: null };
            visible[y][x] = false;
            explored[y][x] = false;
        }
    }

    // Generate rooms
    const numRooms = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numRooms; i++) {
        const roomW = 4 + Math.floor(Math.random() * 5);
        const roomH = 4 + Math.floor(Math.random() * 4);
        const roomX = 2 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 4));
        const roomY = 2 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 4));

        // Check overlap
        let overlaps = false;
        for (const room of rooms) {
            if (roomX < room.x + room.w + 2 && roomX + roomW + 2 > room.x &&
                roomY < room.y + room.h + 2 && roomY + roomH + 2 > room.y) {
                overlaps = true;
                break;
            }
        }
        if (overlaps) continue;

        // Carve room
        const roomType = ['storage', 'barracks', 'medical', 'armory'][Math.floor(Math.random() * 4)];
        for (let y = roomY; y < roomY + roomH; y++) {
            for (let x = roomX; x < roomX + roomW; x++) {
                map[y][x] = { type: 'floor', item: null, roomType };
            }
        }

        rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH, type: roomType, connected: false });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        // L-shaped corridor
        let cx = x1, cy = y1;
        while (cx !== x2) {
            if (map[cy] && map[cy][cx]) map[cy][cx] = { type: 'floor', item: null };
            cx += cx < x2 ? 1 : -1;
        }
        while (cy !== y2) {
            if (map[cy] && map[cy][cx]) map[cy][cx] = { type: 'floor', item: null };
            cy += cy < y2 ? 1 : -1;
        }
    }

    // Place player in first room
    player.x = Math.floor(rooms[0].x + rooms[0].w / 2);
    player.y = Math.floor(rooms[0].y + rooms[0].h / 2);

    // Place extraction in last room
    const lastRoom = rooms[rooms.length - 1];
    extractionPoint.x = Math.floor(lastRoom.x + lastRoom.w / 2);
    extractionPoint.y = Math.floor(lastRoom.y + lastRoom.h / 2);
    map[extractionPoint.y][extractionPoint.x] = { type: 'extraction', item: null };

    // Populate rooms with items and enemies
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];

        // Spawn enemies
        const numEnemies = 1 + Math.floor(Math.random() * 2);
        for (let e = 0; e < numEnemies; e++) {
            const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[ey][ex].type === 'floor') {
                const types = ['guard', 'soldier'];
                const type = types[Math.floor(Math.random() * types.length)];
                const data = ENEMY_DATA[type];
                enemies.push({
                    x: ex, y: ey,
                    type,
                    name: data.name,
                    hp: data.hp, maxHp: data.hp,
                    ap: data.ap, maxAp: data.ap,
                    damage: data.damage,
                    range: data.range,
                    color: data.color,
                    behavior: data.behavior,
                    state: 'idle',
                    alerted: false,
                    attacking: false,
                    attackTimer: 0
                });
            }
        }

        // Spawn items based on room type
        const numItems = 1 + Math.floor(Math.random() * 2);
        for (let it = 0; it < numItems; it++) {
            const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[iy][ix].type === 'floor' && !map[iy][ix].item) {
                let itemType;
                if (room.type === 'medical') {
                    itemType = Math.random() < 0.5 ? 'medkit' : 'bandage';
                } else if (room.type === 'armory') {
                    const weapons = ['pistol', 'smg', 'shotgun'];
                    if (Math.random() < 0.6) {
                        itemType = Math.random() < 0.5 ? 'ammo9mm' : 'ammo12g';
                    } else {
                        itemType = 'weapon:' + weapons[Math.floor(Math.random() * weapons.length)];
                    }
                } else if (room.type === 'storage') {
                    const items = ['cigarettes', 'bandage', 'ammo9mm'];
                    itemType = items[Math.floor(Math.random() * items.length)];
                } else {
                    const items = ['bandage', 'cigarettes', 'ammo9mm'];
                    itemType = items[Math.floor(Math.random() * items.length)];
                }
                map[iy][ix].item = itemType;
            }
        }
    }

    // Give player starting gear
    player.weapons = [
        { ...WEAPON_DATA.knife, currentDurability: 999 }
    ];
    player.currentWeapon = 0;
    player.inventory = [
        { type: 'bandage', ...ITEM_DATA.bandage }
    ];

    // Reset stats
    player.hp = player.maxHp;
    player.ap = player.maxAp;
    player.bleeding = false;
    corruption = 0;
    turn = 0;
    score = 0;

    updateVisibility();
}

// Shadowcasting visibility
function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            visible[y][x] = false;
        }
    }

    // Player's tile is always visible
    visible[player.y][player.x] = true;
    explored[player.y][player.x] = true;

    // Cast rays in all directions
    const numRays = 360;
    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        castRay(angle);
    }
}

function castRay(angle) {
    let x = player.x + 0.5;
    let y = player.y + 0.5;
    const dx = Math.cos(angle) * 0.1;
    const dy = Math.sin(angle) * 0.1;

    for (let i = 0; i < VISION_RANGE * 10; i++) {
        x += dx;
        y += dy;
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) break;

        visible[tileY][tileX] = true;
        explored[tileY][tileX] = true;

        if (map[tileY][tileX].type === 'wall') break;

        const dist = Math.sqrt((tileX - player.x) ** 2 + (tileY - player.y) ** 2);
        if (dist > VISION_RANGE) break;
    }
}

// Player actions
function movePlayer(dx, dy) {
    if (player.ap < 1) {
        addFloatingText(player.x, player.y, 'No AP!', '#f44');
        return false;
    }

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) return false;
    if (map[ny][nx].type === 'wall') return false;

    // Check for enemy
    const enemy = enemies.find(e => e.x === nx && e.y === ny);
    if (enemy) {
        attackEnemy(enemy);
        return true;
    }

    player.x = nx;
    player.y = ny;
    player.ap--;

    // Check for item pickup
    if (map[ny][nx].item) {
        pickupItem(nx, ny);
    }

    // Check extraction
    if (map[ny][nx].type === 'extraction') {
        extract();
        return true;
    }

    updateVisibility();
    checkTurnEnd();
    return true;
}

function attackEnemy(enemy) {
    const weapon = player.weapons[player.currentWeapon];
    if (player.ap < weapon.apCost) {
        addFloatingText(player.x, player.y, 'No AP!', '#f44');
        return;
    }

    const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    if (dist > weapon.range) {
        addFloatingText(player.x, player.y, 'Out of range!', '#f44');
        return;
    }

    player.ap -= weapon.apCost;

    // Check hit
    const roll = Math.random() * 100;
    if (roll < weapon.accuracy) {
        const damage = weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1));
        const finalDamage = weapon.burst ? damage * weapon.burst : damage;
        enemy.hp -= finalDamage;
        addFloatingText(enemy.x, enemy.y, `-${finalDamage}`, '#f44');

        if (enemy.hp <= 0) {
            killEnemy(enemy);
        } else {
            enemy.alerted = true;
        }
    } else {
        addFloatingText(enemy.x, enemy.y, 'Miss!', '#888');
    }

    // Weapon durability
    weapon.currentDurability--;
    if (weapon.currentDurability <= 0 && weapon.durability < 999) {
        addFloatingText(player.x, player.y, 'Weapon jammed!', '#fa0');
    }

    // Alert nearby enemies
    if (!weapon.silent) {
        enemies.forEach(e => {
            const d = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
            if (d < 10) e.alerted = true;
        });
    }

    checkTurnEnd();
}

function killEnemy(enemy) {
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) {
        enemies.splice(idx, 1);
        score += enemy.maxHp;

        // Bloater explodes
        if (enemy.explodes) {
            const radius = 2;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const ex = enemy.x + dx;
                    const ey = enemy.y + dy;
                    if (ex === player.x && ey === player.y) {
                        player.hp -= 30;
                        addFloatingText(player.x, player.y, '-30', '#f44');
                    }
                }
            }
        }
    }
}

function pickupItem(x, y) {
    const itemId = map[y][x].item;
    if (!itemId) return;

    if (itemId.startsWith('weapon:')) {
        const weaponType = itemId.split(':')[1];
        if (player.weapons.length < 2) {
            player.weapons.push({ ...WEAPON_DATA[weaponType], currentDurability: WEAPON_DATA[weaponType].durability });
            addFloatingText(x, y, `+${WEAPON_DATA[weaponType].name}`, '#4f4');
            map[y][x].item = null;
        } else {
            addFloatingText(x, y, 'Weapon slots full!', '#fa0');
        }
    } else if (ITEM_DATA[itemId]) {
        if (player.inventory.length < player.inventorySize) {
            player.inventory.push({ type: itemId, ...ITEM_DATA[itemId] });
            addFloatingText(x, y, `+${ITEM_DATA[itemId].name}`, '#4f4');
            map[y][x].item = null;
        } else {
            addFloatingText(x, y, 'Inventory full!', '#fa0');
        }
    }
}

function useItem(index) {
    if (index >= player.inventory.length) return;
    if (player.ap < 1) {
        addFloatingText(player.x, player.y, 'No AP!', '#f44');
        return;
    }

    const item = player.inventory[index];
    player.ap--;

    if (item.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + item.value);
        if (item.stopBleed) player.bleeding = false;
        addFloatingText(player.x, player.y, `+${item.value} HP`, '#4f4');
    } else if (item.type === 'corruption') {
        corruption = Math.max(0, corruption + item.value);
        addFloatingText(player.x, player.y, `${item.value} Corruption`, '#84f');
    }

    player.inventory.splice(index, 1);
    checkTurnEnd();
}

function reloadWeapon() {
    const weapon = player.weapons[player.currentWeapon];
    if (!weapon.ammoType) {
        addFloatingText(player.x, player.y, 'No ammo needed', '#888');
        return;
    }
    if (player.ap < 1) {
        addFloatingText(player.x, player.y, 'No AP!', '#f44');
        return;
    }

    const ammoIdx = player.inventory.findIndex(i => i.type === 'ammo' && i.ammoType === weapon.ammoType);
    if (ammoIdx < 0) {
        addFloatingText(player.x, player.y, 'No ammo!', '#f44');
        return;
    }

    weapon.currentDurability = weapon.durability;
    player.inventory.splice(ammoIdx, 1);
    player.ap--;
    addFloatingText(player.x, player.y, 'Reloaded!', '#4f4');
    checkTurnEnd();
}

function checkTurnEnd() {
    if (player.ap <= 0) {
        endPlayerTurn();
    }
}

function endPlayerTurn() {
    state = 'enemyTurn';
    turn++;
    corruption += 10 + Math.floor(turn / 5) * 2;

    // Check corruption thresholds for enemy transformation
    if (corruption >= 200 && Math.random() < getTransformChance()) {
        transformRandomEnemy();
    }

    // Bleeding damage
    if (player.bleeding) {
        player.hp--;
        addFloatingText(player.x, player.y, '-1 (bleed)', '#a44');
    }

    if (player.hp <= 0) {
        state = 'gameover';
        return;
    }

    // Process enemy turns with delay for visibility
    processEnemyTurns();
}

function getTransformChance() {
    if (corruption < 200) return 0;
    if (corruption < 400) return 0.1;
    if (corruption < 600) return 0.25;
    if (corruption < 800) return 0.5;
    return 1.0;
}

function transformRandomEnemy() {
    const humanEnemies = enemies.filter(e => e.type === 'guard' || e.type === 'soldier');
    if (humanEnemies.length === 0) return;

    const enemy = humanEnemies[Math.floor(Math.random() * humanEnemies.length)];
    const types = ['possessed', 'bloater', 'stalker'];
    const newType = types[Math.floor(Math.random() * types.length)];
    const data = ENEMY_DATA[newType];

    enemy.type = newType;
    enemy.name = data.name;
    enemy.hp = data.hp;
    enemy.maxHp = data.hp;
    enemy.ap = data.ap;
    enemy.maxAp = data.ap;
    enemy.damage = data.damage;
    enemy.range = data.range;
    enemy.color = data.color;
    enemy.behavior = data.behavior;
    enemy.explodes = data.explodes || false;
    enemy.alerted = true;

    addFloatingText(enemy.x, enemy.y, 'TRANSFORMED!', '#f0f');
}

let enemyTurnIndex = 0;
let enemyTurnTimer = 0;

function processEnemyTurns() {
    enemyTurnIndex = 0;
    enemyTurnTimer = 0;
}

function updateEnemyTurns(dt) {
    if (state !== 'enemyTurn') return;

    enemyTurnTimer += dt;
    if (enemyTurnTimer < 0.3) return;
    enemyTurnTimer = 0;

    if (enemyTurnIndex >= enemies.length) {
        // All enemies done
        player.ap = player.stance === 'run' ? 3 : 2;
        state = 'playing';
        updateVisibility();
        return;
    }

    const enemy = enemies[enemyTurnIndex];
    processEnemyTurn(enemy);
    enemyTurnIndex++;
}

function processEnemyTurn(enemy) {
    enemy.ap = enemy.maxAp;
    enemy.attacking = false;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    // Check if can see player
    const canSee = visible[enemy.y] && visible[enemy.y][enemy.x];
    if (canSee) enemy.alerted = true;

    if (!enemy.alerted) return;

    // AI behavior
    while (enemy.ap > 0) {
        const currentDist = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);

        if (currentDist <= enemy.range) {
            // Attack
            enemyAttack(enemy);
            enemy.ap = 0;
        } else {
            // Move toward player
            const moveX = Math.sign(player.x - enemy.x);
            const moveY = Math.sign(player.y - enemy.y);

            let moved = false;
            // Try X first, then Y
            if (moveX !== 0) {
                const nx = enemy.x + moveX;
                if (canMoveTo(nx, enemy.y)) {
                    enemy.x = nx;
                    enemy.ap--;
                    moved = true;
                }
            }
            if (!moved && moveY !== 0) {
                const ny = enemy.y + moveY;
                if (canMoveTo(enemy.x, ny)) {
                    enemy.y = ny;
                    enemy.ap--;
                    moved = true;
                }
            }
            if (!moved) {
                enemy.ap = 0; // Stuck
            }
        }
    }
}

function canMoveTo(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    if (map[y][x].type === 'wall') return false;
    if (enemies.some(e => e.x === x && e.y === y)) return false;
    if (player.x === x && player.y === y) return false;
    return true;
}

function enemyAttack(enemy) {
    enemy.attacking = true;
    enemy.attackTimer = 0.5;

    const roll = Math.random() * 100;
    if (roll < 70) { // 70% hit chance
        const damage = enemy.damage[0] + Math.floor(Math.random() * (enemy.damage[1] - enemy.damage[0] + 1));
        player.hp -= damage;
        addFloatingText(player.x, player.y, `-${damage}`, '#f44');

        // Chance to cause bleeding
        if (Math.random() < 0.2) {
            player.bleeding = true;
            addFloatingText(player.x, player.y, 'Bleeding!', '#a44');
        }

        if (player.hp <= 0) {
            state = 'gameover';
        }
    } else {
        addFloatingText(player.x, player.y, 'Dodged!', '#4f4');
    }
}

function extract() {
    state = 'victory';
    score += player.hp * 10;
    score += player.inventory.length * 50;
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE,
        text,
        color,
        life: 1.5,
        vy: -30
    });
}

// Rendering
function render() {
    // Calculate corruption visual effects
    const corruptionLevel = Math.floor(corruption / 200);
    let bgColor = '#0a0a12';
    if (corruptionLevel >= 2) bgColor = '#120a0a';
    if (corruptionLevel >= 3) bgColor = '#1a0808';
    if (corruptionLevel >= 4) bgColor = '#200606';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === 'menu') {
        renderMenu();
    } else if (state === 'gameover') {
        renderGameOver();
    } else if (state === 'victory') {
        renderVictory();
    } else {
        renderGame();
    }
}

function renderMenu() {
    ctx.fillStyle = '#c44';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QUASIMORPH', canvas.width / 2, 180);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('Turn-based Tactical Horror', canvas.width / 2, 220);

    ctx.fillStyle = '#8af';
    ctx.font = '20px monospace';
    ctx.fillText('Press ENTER to Deploy', canvas.width / 2, 350);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('WASD/Arrows: Move | SPACE: Attack | R: Reload | 1-6: Use Item', canvas.width / 2, 450);
    ctx.fillText('ENTER: End Turn | TAB: Switch Weapon', canvas.width / 2, 475);
}

function renderGame() {
    // Update camera
    camera.x = player.x - Math.floor(VIEW_WIDTH / 2);
    camera.y = player.y - Math.floor(VIEW_HEIGHT / 2);
    camera.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, camera.y));

    const offsetX = 0;
    const offsetY = 50;

    // Draw tiles
    for (let y = camera.y; y < camera.y + VIEW_HEIGHT && y < MAP_HEIGHT; y++) {
        for (let x = camera.x; x < camera.x + VIEW_WIDTH && x < MAP_WIDTH; x++) {
            const screenX = (x - camera.x) * TILE_SIZE + offsetX;
            const screenY = (y - camera.y) * TILE_SIZE + offsetY;

            if (!explored[y][x]) {
                ctx.fillStyle = '#000';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                continue;
            }

            const tile = map[y][x];
            const isVisible = visible[y][x];
            const alpha = isVisible ? 1 : 0.4;

            // Floor/wall
            if (tile.type === 'wall') {
                ctx.fillStyle = `rgba(40, 50, 60, ${alpha})`;
            } else if (tile.type === 'extraction') {
                ctx.fillStyle = `rgba(40, 120, 40, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(30, 35, 45, ${alpha})`;
            }
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Grid
            ctx.strokeStyle = `rgba(20, 25, 35, ${alpha})`;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Items
            if (tile.item && isVisible) {
                ctx.fillStyle = tile.item.startsWith('weapon') ? '#fa0' : '#4af';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (!visible[enemy.y] || !visible[enemy.y][enemy.x]) continue;

        const screenX = (enemy.x - camera.x) * TILE_SIZE + offsetX;
        const screenY = (enemy.y - camera.y) * TILE_SIZE + offsetY;

        // Attack flash
        if (enemy.attacking && enemy.attackTimer > 0) {
            ctx.fillStyle = '#f00';
            ctx.fillRect(screenX - 4, screenY - 4, TILE_SIZE + 8, TILE_SIZE + 8);
        }

        ctx.fillStyle = enemy.color;
        ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // HP bar
        const hpPct = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#400';
        ctx.fillRect(screenX, screenY - 6, TILE_SIZE, 4);
        ctx.fillStyle = hpPct > 0.5 ? '#4a4' : (hpPct > 0.25 ? '#aa4' : '#a44');
        ctx.fillRect(screenX, screenY - 6, TILE_SIZE * hpPct, 4);
    }

    // Draw player
    const playerScreenX = (player.x - camera.x) * TILE_SIZE + offsetX;
    const playerScreenY = (player.y - camera.y) * TILE_SIZE + offsetY;

    ctx.fillStyle = '#4af';
    ctx.fillRect(playerScreenX + 2, playerScreenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    // Bleeding indicator
    if (player.bleeding) {
        ctx.strokeStyle = '#a44';
        ctx.lineWidth = 2;
        ctx.strokeRect(playerScreenX + 2, playerScreenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }

    // Draw floating texts
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    for (const ft of floatingTexts) {
        const screenX = ft.x - camera.x * TILE_SIZE + offsetX;
        const screenY = ft.y - camera.y * TILE_SIZE + offsetY;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillText(ft.text, screenX, screenY);
    }
    ctx.globalAlpha = 1;

    // Draw HUD
    renderHUD();

    // Enemy turn indicator
    if (state === 'enemyTurn') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width / 2 - 100, 60, 200, 40);
        ctx.strokeStyle = '#f44';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 100, 60, 200, 40);
        ctx.fillStyle = '#f44';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ENEMY TURN', canvas.width / 2, 87);
    }
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, 45);

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';

    // Corruption
    const corruptionLevel = Math.floor(corruption / 200);
    const corruptionLabels = ['Normal', 'Unease', 'Spreading', 'Critical', 'Rapture', 'BREACH'];
    const corruptionColors = ['#4a4', '#aa4', '#a84', '#a44', '#f4f', '#f00'];

    ctx.fillStyle = '#888';
    ctx.fillText(`Turn: ${turn}`, 15, 18);

    ctx.fillStyle = corruptionColors[Math.min(corruptionLevel, 5)];
    ctx.fillText(`Corruption: ${corruption} (${corruptionLabels[Math.min(corruptionLevel, 5)]})`, 15, 36);

    // HP
    ctx.fillStyle = '#888';
    ctx.fillText('HP:', 250, 18);
    ctx.fillStyle = '#400';
    ctx.fillRect(280, 6, 100, 16);
    ctx.fillStyle = player.hp > 50 ? '#4a4' : (player.hp > 25 ? '#aa4' : '#a44');
    ctx.fillRect(280, 6, (player.hp / player.maxHp) * 100, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${player.hp}/${player.maxHp}`, 285, 18);

    // AP
    ctx.fillStyle = '#888';
    ctx.fillText('AP:', 250, 36);
    for (let i = 0; i < player.maxAp; i++) {
        ctx.fillStyle = i < player.ap ? '#48f' : '#234';
        ctx.fillRect(280 + i * 25, 24, 20, 14);
    }

    // Weapon
    const weapon = player.weapons[player.currentWeapon];
    ctx.fillStyle = '#fa0';
    ctx.textAlign = 'right';
    ctx.fillText(`[${player.currentWeapon + 1}] ${weapon.name}`, canvas.width - 15, 18);
    if (weapon.durability < 999) {
        ctx.fillStyle = weapon.currentDurability > 10 ? '#888' : '#a44';
        ctx.fillText(`Dur: ${weapon.currentDurability}/${weapon.durability}`, canvas.width - 15, 36);
    }

    // Bottom bar - Inventory
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.fillText('Inventory:', 15, canvas.height - 20);

    for (let i = 0; i < player.inventorySize; i++) {
        const x = 100 + i * 60;
        ctx.fillStyle = i < player.inventory.length ? '#234' : '#111';
        ctx.fillRect(x, canvas.height - 35, 55, 30);
        ctx.strokeStyle = '#444';
        ctx.strokeRect(x, canvas.height - 35, 55, 30);

        if (i < player.inventory.length) {
            ctx.fillStyle = '#8af';
            ctx.font = '10px monospace';
            ctx.fillText(player.inventory[i].name.slice(0, 7), x + 3, canvas.height - 15);
        }
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText(`[${i + 1}]`, x + 3, canvas.height - 25);
    }

    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px monospace';
    ctx.fillText(`Score: ${score}`, canvas.width - 15, canvas.height - 20);
}

function renderGameOver() {
    ctx.fillStyle = '#400';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLONE LOST', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText(`Survived ${turn} turns`, canvas.width / 2, 280);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 320);

    ctx.fillStyle = '#8af';
    ctx.font = '18px monospace';
    ctx.fillText('Press ENTER to try again', canvas.width / 2, 420);
}

function renderVictory() {
    ctx.fillStyle = '#041';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText(`Completed in ${turn} turns`, canvas.width / 2, 280);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 320);

    ctx.fillStyle = '#8af';
    ctx.font = '18px monospace';
    ctx.fillText('Press ENTER to deploy again', canvas.width / 2, 420);
}

// Update
function update(dt) {
    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // Update enemy attack timers
    for (const enemy of enemies) {
        if (enemy.attackTimer > 0) {
            enemy.attackTimer -= dt;
        }
    }

    // Process enemy turns
    updateEnemyTurns(dt);
}

// Input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (state === 'menu') {
        if (e.key === 'Enter') {
            generateMap();
            state = 'playing';
        }
    } else if (state === 'playing') {
        // Movement
        if (e.key === 'w' || e.key === 'ArrowUp') movePlayer(0, -1);
        else if (e.key === 's' || e.key === 'ArrowDown') movePlayer(0, 1);
        else if (e.key === 'a' || e.key === 'ArrowLeft') movePlayer(-1, 0);
        else if (e.key === 'd' || e.key === 'ArrowRight') movePlayer(1, 0);
        // End turn
        else if (e.key === 'Enter') endPlayerTurn();
        // Reload
        else if (e.key === 'r') reloadWeapon();
        // Switch weapon
        else if (e.key === 'Tab') {
            e.preventDefault();
            player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
        }
        // Use items
        else if (e.key >= '1' && e.key <= '6') {
            useItem(parseInt(e.key) - 1);
        }
    } else if (state === 'gameover' || state === 'victory') {
        if (e.key === 'Enter') {
            generateMap();
            state = 'playing';
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

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
