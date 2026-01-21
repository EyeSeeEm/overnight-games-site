// Isolation Protocol - Survival Horror (Subterrain Clone)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const ROOM_W = 20;
const ROOM_H = 15;

// Game state
let state = 'menu'; // menu, playing, inventory, crafting, gameover, victory
let gameTime = 0; // in game minutes
let globalInfection = 0; // 0-100
let screenShake = 0;

// Player
const player = {
    x: 320, y: 240,
    hp: 100, maxHp: 100,
    hunger: 0, // 0-100, higher is worse
    infection: 0, // 0-100, personal infection
    attackCooldown: 0,
    invincible: 0,
    currentWeapon: 0,
    ammo: 12,
    maxAmmo: 12,
    inventory: [],
    inventorySize: 20
};

// Weapons
const WEAPONS = [
    { name: 'Fists', damage: 5, range: 40, cooldown: 0.5, melee: true },
    { name: 'Shiv', damage: 10, range: 45, cooldown: 0.4, melee: true },
    { name: 'Pistol', damage: 15, range: 300, cooldown: 0.5, melee: false }
];

// Items
const ITEMS = {
    food: { name: 'Canned Food', type: 'consumable', effect: { hunger: -30 } },
    medkit: { name: 'Medkit', type: 'consumable', effect: { hp: 30 } },
    antidote: { name: 'Antidote', type: 'consumable', effect: { infection: -30 } },
    scrap: { name: 'Scrap Metal', type: 'material' },
    chemicals: { name: 'Chemicals', type: 'material' },
    ammo: { name: 'Pistol Ammo', type: 'ammo', amount: 6 },
    keycard: { name: 'Red Keycard', type: 'key', color: 'red' }
};

// Sectors
const SECTORS = {
    hub: { name: 'Central Hub', powerCost: 0, powered: true, color: '#1a2a1a' },
    storage: { name: 'Storage Wing', powerCost: 100, powered: false, color: '#2a2a1a' },
    medical: { name: 'Medical Bay', powerCost: 150, powered: false, color: '#1a2a2a' },
    research: { name: 'Research Lab', powerCost: 200, powered: false, color: '#2a1a2a' },
    escape: { name: 'Escape Pod', powerCost: 300, powered: false, color: '#1a1a2a' }
};

// Room states - persist between visits
const roomStates = {};

// Current room
let currentSector = 'hub';
let enemies = [];
let items = [];
let projectiles = [];

// Power
let totalPower = 500;
let usedPower = 0;

// Camera
const camera = { x: 0, y: 0 };

// Input
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Initialize room
function initRoom(sector) {
    currentSector = sector;

    // Check if room was visited before
    if (roomStates[sector]) {
        // Restore state
        enemies = roomStates[sector].enemies.map(e => ({ ...e }));
        items = roomStates[sector].items.map(i => ({ ...i }));
        return;
    }

    // Generate new room
    enemies = [];
    items = [];

    const sectorData = SECTORS[sector];

    // Spawn enemies based on sector
    if (sector === 'storage') {
        spawnEnemy('shambler', 200, 150);
        spawnEnemy('shambler', 450, 200);
        spawnEnemy('crawler', 300, 350);
        spawnItem('food', 100, 100);
        spawnItem('food', 500, 400);
        spawnItem('scrap', 350, 150);
        spawnItem('ammo', 400, 300);
    } else if (sector === 'medical') {
        spawnEnemy('shambler', 250, 200);
        spawnEnemy('spitter', 400, 250);
        spawnEnemy('crawler', 300, 350);
        spawnItem('medkit', 150, 100);
        spawnItem('medkit', 500, 150);
        spawnItem('antidote', 300, 400);
        spawnItem('chemicals', 450, 350);
    } else if (sector === 'research') {
        spawnEnemy('crawler', 200, 150);
        spawnEnemy('spitter', 400, 200);
        spawnEnemy('brute', 300, 300);
        spawnItem('scrap', 150, 150);
        spawnItem('chemicals', 450, 100);
        spawnItem('keycard', 300, 200);
    } else if (sector === 'escape') {
        spawnEnemy('brute', 250, 200);
        spawnEnemy('brute', 400, 200);
        spawnEnemy('shambler', 300, 350);
        spawnEnemy('spitter', 350, 350);
    } else if (sector === 'hub') {
        // Safe zone - starting items
        spawnItem('food', 150, 200);
        spawnItem('food', 200, 200);
    }

    // Save initial state
    saveRoomState();
}

function saveRoomState() {
    roomStates[currentSector] = {
        enemies: enemies.map(e => ({ ...e })),
        items: items.map(i => ({ ...i }))
    };
}

function spawnEnemy(type, x, y) {
    const data = {
        shambler: { hp: 30, damage: 10, speed: 50, color: '#6a4a4a', infection: 5 },
        crawler: { hp: 20, damage: 8, speed: 120, color: '#4a6a4a', infection: 5 },
        spitter: { hp: 25, damage: 15, speed: 40, color: '#6a6a2a', infection: 10, ranged: true },
        brute: { hp: 80, damage: 25, speed: 30, color: '#8a4a4a', infection: 8 }
    };

    const d = data[type];
    enemies.push({
        x, y,
        type,
        hp: d.hp * (1 + globalInfection / 100),
        maxHp: d.hp * (1 + globalInfection / 100),
        damage: d.damage,
        speed: d.speed,
        color: d.color,
        infection: d.infection,
        ranged: d.ranged || false,
        attackCooldown: 0,
        hitTimer: 0
    });
}

function spawnItem(type, x, y) {
    items.push({ x, y, type, ...ITEMS[type] });
}

// Update
function update(dt) {
    if (state !== 'playing') return;

    // Game time (1 real second = 1 game minute)
    gameTime += dt * 60;

    // Global infection rises
    globalInfection = Math.min(100, globalInfection + 0.1 * dt);

    // Hunger increases
    player.hunger = Math.min(100, player.hunger + 0.1 * dt);

    // Hunger effects
    if (player.hunger >= 75) {
        player.hp -= 1 * dt; // Health drains
    }

    // Personal infection in unpowered sector
    if (!SECTORS[currentSector].powered && currentSector !== 'hub') {
        player.infection = Math.min(100, player.infection + 0.5 * dt);
    }

    // Infection effects
    if (player.infection >= 75) {
        player.hp -= 2 * dt;
    }

    // Check death
    if (player.hp <= 0 || player.infection >= 100) {
        state = 'gameover';
        return;
    }

    // Check global infection game over
    if (globalInfection >= 100) {
        state = 'gameover';
        return;
    }

    // Screen shake decay
    screenShake *= 0.9;

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    checkCollisions();
}

function updatePlayer(dt) {
    const speed = player.hunger >= 50 ? 120 : 150;

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.x += dx * speed * dt;
    player.y += dy * speed * dt;

    // Clamp to room
    player.x = Math.max(30, Math.min(ROOM_W * TILE_SIZE - 30, player.x));
    player.y = Math.max(30, Math.min(ROOM_H * TILE_SIZE - 30, player.y));

    // Cooldowns
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    player.invincible = Math.max(0, player.invincible - dt);

    // Attack
    if (mouseDown && player.attackCooldown <= 0) {
        attack();
    }

    // Check room transitions
    checkRoomTransition();

    // Check item pickup (E key)
    if (keys['e']) {
        pickupItems();
        keys['e'] = false;
    }

    // Check escape pod
    if (currentSector === 'escape' && SECTORS.escape.powered && hasKeycard()) {
        // Check if near center for escape
        const cx = ROOM_W * TILE_SIZE / 2;
        const cy = ROOM_H * TILE_SIZE / 2;
        if (Math.hypot(player.x - cx, player.y - cy) < 50 && enemies.length === 0) {
            state = 'victory';
        }
    }
}

function hasKeycard() {
    return player.inventory.some(i => i.type === 'key' && i.color === 'red');
}

function attack() {
    const weapon = WEAPONS[player.currentWeapon];
    player.attackCooldown = weapon.cooldown;

    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

    if (weapon.melee) {
        // Melee attack - check enemies in arc
        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.hypot(dx, dy);
            const enemyAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(enemyAngle - angle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (dist < weapon.range && angleDiff < Math.PI / 3) {
                damageEnemy(enemy, weapon.damage);
            }
        }
        screenShake = 3;
    } else {
        // Ranged attack
        if (player.ammo > 0) {
            player.ammo--;
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                damage: weapon.damage,
                fromPlayer: true
            });
            screenShake = 5;
        }
    }
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    enemy.hitTimer = 0.2;

    if (enemy.hp <= 0) {
        const idx = enemies.indexOf(enemy);
        if (idx >= 0) {
            enemies.splice(idx, 1);
            saveRoomState();
        }
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
        enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 30) {
            // Move toward player
            const moveSpeed = enemy.ranged && dist < 150 ? -enemy.speed : enemy.speed;
            enemy.x += (dx / dist) * moveSpeed * dt;
            enemy.y += (dy / dist) * moveSpeed * dt;
        }

        // Clamp
        enemy.x = Math.max(20, Math.min(ROOM_W * TILE_SIZE - 20, enemy.x));
        enemy.y = Math.max(20, Math.min(ROOM_H * TILE_SIZE - 20, enemy.y));

        // Attack
        if (enemy.ranged && dist < 250 && dist > 100 && enemy.attackCooldown <= 0) {
            enemy.attackCooldown = 2.5;
            const angle = Math.atan2(dy, dx);
            projectiles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                damage: enemy.damage,
                fromPlayer: false,
                infection: enemy.infection
            });
        } else if (!enemy.ranged && dist < 30 && enemy.attackCooldown <= 0 && player.invincible <= 0) {
            enemy.attackCooldown = 1.5;
            player.hp -= enemy.damage;
            player.infection = Math.min(100, player.infection + enemy.infection);
            player.invincible = 0.5;
            screenShake = 10;
        }
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Out of bounds
        if (p.x < 0 || p.x > ROOM_W * TILE_SIZE || p.y < 0 || p.y > ROOM_H * TILE_SIZE) {
            projectiles.splice(i, 1);
            continue;
        }

        // Hit detection
        if (p.fromPlayer) {
            for (const enemy of enemies) {
                if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < 20) {
                    damageEnemy(enemy, p.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            if (Math.hypot(p.x - player.x, p.y - player.y) < 15 && player.invincible <= 0) {
                player.hp -= p.damage;
                if (p.infection) {
                    player.infection = Math.min(100, player.infection + p.infection);
                }
                player.invincible = 0.5;
                screenShake = 8;
                projectiles.splice(i, 1);
            }
        }
    }
}

function checkCollisions() {
    // Auto-collect nearby items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 40) {
            // Highlight for pickup
            item.highlight = true;
        } else {
            item.highlight = false;
        }
    }
}

function pickupItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.hypot(item.x - player.x, item.y - player.y);

        if (dist < 40) {
            if (item.type === 'ammo') {
                player.ammo = Math.min(player.maxAmmo, player.ammo + item.amount);
                items.splice(i, 1);
            } else if (player.inventory.length < player.inventorySize) {
                player.inventory.push({ ...item });
                items.splice(i, 1);
            }
            saveRoomState();
        }
    }
}

function useItem(index) {
    if (index >= player.inventory.length) return;

    const item = player.inventory[index];
    if (item.type !== 'consumable') return;

    if (item.effect.hp) {
        player.hp = Math.min(player.maxHp, player.hp + item.effect.hp);
    }
    if (item.effect.hunger) {
        player.hunger = Math.max(0, player.hunger + item.effect.hunger);
    }
    if (item.effect.infection) {
        player.infection = Math.max(0, player.infection + item.effect.infection);
    }

    player.inventory.splice(index, 1);
}

function checkRoomTransition() {
    const margin = 20;
    let newSector = null;
    let newX = player.x;
    let newY = player.y;

    // Check transitions based on current sector
    if (currentSector === 'hub') {
        if (player.y < margin) { newSector = 'escape'; newY = ROOM_H * TILE_SIZE - 50; }
        if (player.y > ROOM_H * TILE_SIZE - margin) { newSector = 'storage'; newY = 50; }
        if (player.x < margin) { newSector = 'research'; newX = ROOM_W * TILE_SIZE - 50; }
        if (player.x > ROOM_W * TILE_SIZE - margin) { newSector = 'medical'; newX = 50; }
    } else if (currentSector === 'storage') {
        if (player.y < margin) { newSector = 'hub'; newY = ROOM_H * TILE_SIZE - 50; }
    } else if (currentSector === 'medical') {
        if (player.x < margin) { newSector = 'hub'; newX = ROOM_W * TILE_SIZE - 50; }
    } else if (currentSector === 'research') {
        if (player.x > ROOM_W * TILE_SIZE - margin) { newSector = 'hub'; newX = 50; }
    } else if (currentSector === 'escape') {
        if (player.y > ROOM_H * TILE_SIZE - margin) { newSector = 'hub'; newY = 50; }
    }

    if (newSector) {
        saveRoomState();
        player.x = newX;
        player.y = newY;
        initRoom(newSector);
    }
}

function togglePower(sector) {
    if (sector === 'hub') return;

    const s = SECTORS[sector];
    if (s.powered) {
        s.powered = false;
        usedPower -= s.powerCost;
    } else {
        if (usedPower + s.powerCost <= totalPower) {
            s.powered = true;
            usedPower += s.powerCost;
        }
    }
}

// Render
function render() {
    ctx.save();

    // Screen shake
    if (screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }

    ctx.fillStyle = '#0a0808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === 'menu') {
        renderMenu();
    } else if (state === 'gameover') {
        renderGameOver();
    } else if (state === 'victory') {
        renderVictory();
    } else if (state === 'inventory') {
        renderGame();
        renderInventory();
    } else {
        renderGame();
    }

    ctx.restore();
}

function renderMenu() {
    ctx.fillStyle = '#8a2a2a';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ISOLATION PROTOCOL', canvas.width / 2, 150);

    ctx.fillStyle = '#666';
    ctx.font = '18px Arial';
    ctx.fillText('Survival Horror', canvas.width / 2, 190);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to Begin', canvas.width / 2, 350);

    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('WASD: Move | CLICK: Attack | E: Pickup | TAB: Inventory', canvas.width / 2, 450);
    ctx.fillText('Find the RED KEYCARD and escape before infection reaches 100%!', canvas.width / 2, 475);
    ctx.fillText('P: Toggle power panels in HUB', canvas.width / 2, 495);
}

function renderGame() {
    // Room background
    const sectorData = SECTORS[currentSector];
    ctx.fillStyle = sectorData.powered || currentSector === 'hub' ? sectorData.color : '#0a0505';
    ctx.fillRect(0, 0, ROOM_W * TILE_SIZE, ROOM_H * TILE_SIZE);

    // Grid
    ctx.strokeStyle = sectorData.powered || currentSector === 'hub' ? '#1a1a1a' : '#0a0808';
    for (let x = 0; x <= ROOM_W; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE, 0);
        ctx.lineTo(x * TILE_SIZE, ROOM_H * TILE_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= ROOM_H; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE);
        ctx.lineTo(ROOM_W * TILE_SIZE, y * TILE_SIZE);
        ctx.stroke();
    }

    // Door indicators
    ctx.fillStyle = '#4a4a4a';
    if (currentSector === 'hub') {
        ctx.fillRect(ROOM_W * TILE_SIZE / 2 - 20, 0, 40, 10); // North - escape
        ctx.fillRect(ROOM_W * TILE_SIZE / 2 - 20, ROOM_H * TILE_SIZE - 10, 40, 10); // South - storage
        ctx.fillRect(0, ROOM_H * TILE_SIZE / 2 - 20, 10, 40); // West - research
        ctx.fillRect(ROOM_W * TILE_SIZE - 10, ROOM_H * TILE_SIZE / 2 - 20, 10, 40); // East - medical
    } else if (currentSector === 'storage') {
        ctx.fillRect(ROOM_W * TILE_SIZE / 2 - 20, 0, 40, 10); // North - hub
    } else if (currentSector === 'medical') {
        ctx.fillRect(0, ROOM_H * TILE_SIZE / 2 - 20, 10, 40); // West - hub
    } else if (currentSector === 'research') {
        ctx.fillRect(ROOM_W * TILE_SIZE - 10, ROOM_H * TILE_SIZE / 2 - 20, 10, 40); // East - hub
    } else if (currentSector === 'escape') {
        ctx.fillRect(ROOM_W * TILE_SIZE / 2 - 20, ROOM_H * TILE_SIZE - 10, 40, 10); // South - hub

        // Escape pod
        if (SECTORS.escape.powered && hasKeycard() && enemies.length === 0) {
            ctx.fillStyle = '#4a8a4a';
            ctx.beginPath();
            ctx.arc(ROOM_W * TILE_SIZE / 2, ROOM_H * TILE_SIZE / 2, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPE', ROOM_W * TILE_SIZE / 2, ROOM_H * TILE_SIZE / 2 + 4);
        }
    }

    // Items
    for (const item of items) {
        ctx.fillStyle = item.highlight ? '#ffd700' : '#8a8a4a';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
        ctx.fill();

        if (item.highlight) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('[E] ' + item.name, item.x, item.y - 18);
        }
    }

    // Enemies
    for (const enemy of enemies) {
        ctx.fillStyle = enemy.hitTimer > 0 ? '#fff' : enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#400';
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
        ctx.fillStyle = '#a44';
        ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.hp / enemy.maxHp), 4);
    }

    // Projectiles
    for (const p of projectiles) {
        ctx.fillStyle = p.fromPlayer ? '#4af' : '#f84';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player
    ctx.fillStyle = player.invincible > 0 && Math.floor(player.invincible * 10) % 2 ? '#888' : '#4a8aaa';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Aim line
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(angle) * 50, player.y + Math.sin(angle) * 50);
    ctx.stroke();

    // HUD
    renderHUD();
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, ROOM_H * TILE_SIZE, canvas.width, canvas.height - ROOM_H * TILE_SIZE);

    // Health
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP', 10, ROOM_H * TILE_SIZE + 20);
    ctx.fillStyle = '#400';
    ctx.fillRect(30, ROOM_H * TILE_SIZE + 10, 100, 14);
    ctx.fillStyle = player.hp > 50 ? '#a44' : '#f44';
    ctx.fillRect(30, ROOM_H * TILE_SIZE + 10, player.hp, 14);

    // Hunger
    ctx.fillStyle = '#888';
    ctx.fillText('Hunger', 10, ROOM_H * TILE_SIZE + 42);
    ctx.fillStyle = '#420';
    ctx.fillRect(60, ROOM_H * TILE_SIZE + 32, 70, 12);
    ctx.fillStyle = player.hunger > 50 ? '#a82' : '#862';
    ctx.fillRect(60, ROOM_H * TILE_SIZE + 32, player.hunger * 0.7, 12);

    // Personal Infection
    ctx.fillStyle = '#888';
    ctx.fillText('Infection', 10, ROOM_H * TILE_SIZE + 62);
    ctx.fillStyle = '#042';
    ctx.fillRect(70, ROOM_H * TILE_SIZE + 52, 60, 12);
    ctx.fillStyle = player.infection > 50 ? '#4a8' : '#284';
    ctx.fillRect(70, ROOM_H * TILE_SIZE + 52, player.infection * 0.6, 12);

    // Weapon & Ammo
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(WEAPONS[player.currentWeapon].name, 250, ROOM_H * TILE_SIZE + 25);
    if (player.currentWeapon === 2) {
        ctx.fillStyle = player.ammo > 0 ? '#4af' : '#f44';
        ctx.fillText(`Ammo: ${player.ammo}/${player.maxAmmo}`, 250, ROOM_H * TILE_SIZE + 45);
    }

    // Sector name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(SECTORS[currentSector].name, 400, ROOM_H * TILE_SIZE + 25);

    const powered = SECTORS[currentSector].powered || currentSector === 'hub';
    ctx.fillStyle = powered ? '#4a4' : '#a44';
    ctx.font = '12px Arial';
    ctx.fillText(powered ? 'POWERED' : 'UNPOWERED', 400, ROOM_H * TILE_SIZE + 45);

    // Global infection
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText('Global Infection', canvas.width - 10, ROOM_H * TILE_SIZE + 20);
    ctx.fillStyle = '#040';
    ctx.fillRect(canvas.width - 110, ROOM_H * TILE_SIZE + 28, 100, 16);
    ctx.fillStyle = globalInfection > 75 ? '#f44' : (globalInfection > 50 ? '#fa4' : '#4a4');
    ctx.fillRect(canvas.width - 110, ROOM_H * TILE_SIZE + 28, globalInfection, 16);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(globalInfection)}%`, canvas.width - 60, ROOM_H * TILE_SIZE + 41);

    // Power
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Power: ${usedPower}/${totalPower}`, canvas.width - 10, ROOM_H * TILE_SIZE + 62);

    // Inventory hint
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('[TAB] Inventory | [1-3] Switch Weapon | [P] Power (in Hub)', 150, ROOM_H * TILE_SIZE + 65);
}

function renderInventory() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(100, 50, 600, 400);
    ctx.strokeStyle = '#4a4a4a';
    ctx.strokeRect(100, 50, 600, 400);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', 400, 90);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        const x = 120 + (i % 5) * 115;
        const y = 120 + Math.floor(i / 5) * 60;

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x, y, 100, 50);
        ctx.strokeStyle = '#4a4a4a';
        ctx.strokeRect(x, y, 100, 50);

        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.fillText(item.name, x + 5, y + 20);
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.fillText(`[${i + 1}] Use`, x + 5, y + 40);
    }

    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press number key to use item | TAB to close', 400, 420);

    // Power panel in hub
    if (currentSector === 'hub') {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('POWER CONTROL [P to toggle]', 400, 330);

        ctx.font = '12px Arial';
        let py = 350;
        for (const [key, sector] of Object.entries(SECTORS)) {
            if (key === 'hub') continue;
            ctx.fillStyle = sector.powered ? '#4a4' : '#888';
            ctx.fillText(`${sector.name}: ${sector.powerCost} units - ${sector.powered ? 'ON' : 'OFF'}`, 250, py);
            py += 18;
        }
    }
}

function renderGameOver() {
    ctx.fillStyle = '#200808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';

    if (player.infection >= 100) {
        ctx.fillText('INFECTED', canvas.width / 2, 200);
    } else if (globalInfection >= 100) {
        ctx.fillText('FACILITY LOST', canvas.width / 2, 200);
    } else {
        ctx.fillText('YOU DIED', canvas.width / 2, 200);
    }

    ctx.fillStyle = '#888';
    ctx.font = '20px Arial';
    ctx.fillText(`Survived: ${Math.floor(gameTime)} minutes`, canvas.width / 2, 280);
    ctx.fillText(`Global Infection: ${Math.floor(globalInfection)}%`, canvas.width / 2, 320);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to try again', canvas.width / 2, 420);
}

function renderVictory() {
    ctx.fillStyle = '#082008';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${Math.floor(gameTime)} minutes`, canvas.width / 2, 280);
    ctx.fillText(`Global Infection: ${Math.floor(globalInfection)}%`, canvas.width / 2, 320);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to play again', canvas.width / 2, 420);
}

// Input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (state === 'menu' && e.key === 'Enter') {
        // Reset game
        player.hp = 100;
        player.hunger = 0;
        player.infection = 0;
        player.ammo = 12;
        player.inventory = [];
        player.currentWeapon = 0;
        globalInfection = 0;
        gameTime = 0;
        usedPower = 0;

        for (const key in SECTORS) {
            if (key !== 'hub') SECTORS[key].powered = false;
        }

        for (const key in roomStates) {
            delete roomStates[key];
        }

        player.x = 320;
        player.y = 240;
        initRoom('hub');
        state = 'playing';
    } else if ((state === 'gameover' || state === 'victory') && e.key === 'Enter') {
        state = 'menu';
    } else if (state === 'playing' || state === 'inventory') {
        if (e.key === 'Tab') {
            e.preventDefault();
            state = state === 'inventory' ? 'playing' : 'inventory';
        }

        // Weapon switch
        if (e.key === '1') player.currentWeapon = 0;
        if (e.key === '2' && player.inventory.some(i => i.name === 'Shiv')) player.currentWeapon = 1;
        if (e.key === '3' && player.inventory.some(i => i.name === 'Pistol')) player.currentWeapon = 2;

        // Use inventory item
        if (state === 'inventory' && e.key >= '1' && e.key <= '9') {
            useItem(parseInt(e.key) - 1);
        }

        // Power toggle in hub
        if (e.key === 'p' && currentSector === 'hub') {
            // Cycle through sectors
            const sectors = ['storage', 'medical', 'research', 'escape'];
            for (const s of sectors) {
                if (!SECTORS[s].powered && usedPower + SECTORS[s].powerCost <= totalPower) {
                    togglePower(s);
                    break;
                }
            }
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
