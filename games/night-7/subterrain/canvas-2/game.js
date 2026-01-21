// Isolation Protocol - Subterrain Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'title'; // title, playing, inventory, crafting, gameover, victory
let gameTime = 0; // In game minutes
let globalInfection = 0; // 0-100%
let screenShake = 0;

// Player
const player = {
    x: 400, y: 300,
    width: 28, height: 28,
    speed: 3,
    hp: 100, maxHp: 100,
    hunger: 0, // 0-100, higher is worse
    infection: 0, // 0-100, personal infection
    stamina: 100, maxStamina: 100,
    facing: 0, // Angle toward mouse
    attacking: false, attackCooldown: 0,
    dodging: false, dodgeCooldown: 0, dodgeTimer: 0, dodgeDir: {x: 0, y: 0},
    invincible: 0,
    weapon: 'fists',
    inventory: [],
    maxInventory: 20,
    hasKeycard: false,
    hasTier2: false
};

// Items data
const itemData = {
    food: { name: 'Canned Food', type: 'consumable', effect: 'hunger', value: -30, stack: 5 },
    medkit: { name: 'Medkit', type: 'consumable', effect: 'health', value: 30, stack: 3 },
    antidote: { name: 'Antidote', type: 'consumable', effect: 'infection', value: -30, stack: 3 },
    scrap: { name: 'Scrap Metal', type: 'material', stack: 10 },
    chemicals: { name: 'Chemicals', type: 'material', stack: 10 },
    cloth: { name: 'Cloth', type: 'material', stack: 10 },
    electronics: { name: 'Electronics', type: 'material', stack: 10 },
    pistol: { name: 'Pistol', type: 'weapon', damage: 15, stack: 1 },
    ammo: { name: 'Pistol Ammo', type: 'ammo', stack: 30 },
    shiv: { name: 'Shiv', type: 'weapon', damage: 10, stack: 1 },
    pipeclub: { name: 'Pipe Club', type: 'weapon', damage: 20, stack: 1 },
    keycard: { name: 'Red Keycard', type: 'key', stack: 1 },
    datachip: { name: 'Data Chip', type: 'key', stack: 1 }
};

// Crafting recipes
const recipes = {
    shiv: { name: 'Shiv', materials: { scrap: 2 }, tier: 1 },
    pipeclub: { name: 'Pipe Club', materials: { scrap: 3 }, tier: 1 },
    bandage: { name: 'Bandage', materials: { cloth: 2 }, tier: 1 },
    pistol: { name: 'Pistol', materials: { scrap: 5, electronics: 2 }, tier: 2 },
    ammo: { name: 'Ammo x10', materials: { scrap: 2, chemicals: 1 }, tier: 2 },
    antidote: { name: 'Antidote', materials: { chemicals: 3 }, tier: 2 }
};

// Areas/Rooms - persist state
const areas = {
    hub: {
        name: 'Central Hub',
        type: 'hub',
        powerCost: 0,
        powered: true,
        enemies: [],
        loot: [],
        cleared: true,
        visited: true,
        connections: { north: 'escape', south: 'storage', east: 'medical', west: 'research' }
    },
    storage: {
        name: 'Storage Wing',
        type: 'sector',
        powerCost: 100,
        powered: false,
        enemies: [],
        loot: [],
        cleared: false,
        visited: false,
        connections: { north: 'hub' }
    },
    medical: {
        name: 'Medical Bay',
        type: 'sector',
        powerCost: 150,
        powered: false,
        enemies: [],
        loot: [],
        cleared: false,
        visited: false,
        connections: { west: 'hub' }
    },
    research: {
        name: 'Research Lab',
        type: 'sector',
        powerCost: 200,
        powered: false,
        enemies: [],
        loot: [],
        cleared: false,
        visited: false,
        connections: { east: 'hub' }
    },
    escape: {
        name: 'Escape Pod',
        type: 'escape',
        powerCost: 300,
        powered: false,
        enemies: [],
        loot: [],
        cleared: false,
        visited: false,
        connections: { south: 'hub' }
    }
};

let currentArea = 'hub';
let powerBudget = 500;
let usedPower = 0;

// Enemies
let enemies = [];
let bullets = [];
let particles = [];
let bloodPools = [];
let lootItems = [];

// Input
const keys = {};
let mouse = { x: 0, y: 0, down: false };

// Initialize
function init() {
    // Starting inventory
    addItem('food', 2);
    addItem('scrap', 3);

    // Generate initial areas
    generateAreaContent('storage');
    generateAreaContent('medical');
    generateAreaContent('research');
    generateAreaContent('escape');

    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (gameState === 'title' && e.key === ' ') {
            gameState = 'playing';
        } else if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
            location.reload();
        } else if (gameState === 'playing') {
            if (e.key === 'Tab') {
                e.preventDefault();
                gameState = 'inventory';
            } else if (e.key === 'c') {
                gameState = 'crafting';
            }
        } else if (gameState === 'inventory' || gameState === 'crafting') {
            if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'c') {
                gameState = 'playing';
            } else if (e.key >= '1' && e.key <= '9') {
                const idx = parseInt(e.key) - 1;
                if (gameState === 'inventory') {
                    useInventoryItem(idx);
                } else if (gameState === 'crafting') {
                    craftItem(idx);
                }
            }
        }
    });
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', e => {
        mouse.down = true;
        if (gameState === 'playing' && e.button === 0) playerAttack();
        if (e.button === 2) startDodge();
    });
    canvas.addEventListener('mouseup', () => mouse.down = false);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    requestAnimationFrame(gameLoop);
}

function generateAreaContent(areaId) {
    const area = areas[areaId];

    // Generate enemies
    if (areaId === 'storage') {
        for (let i = 0; i < 4; i++) {
            area.enemies.push(createEnemy('shambler', 150 + Math.random() * 500, 150 + Math.random() * 300));
        }
        area.enemies.push(createEnemy('crawler', 400, 200));
    } else if (areaId === 'medical') {
        for (let i = 0; i < 3; i++) {
            area.enemies.push(createEnemy('shambler', 150 + Math.random() * 500, 150 + Math.random() * 300));
        }
        area.enemies.push(createEnemy('spitter', 300, 200));
        area.enemies.push(createEnemy('spitter', 500, 250));
    } else if (areaId === 'research') {
        for (let i = 0; i < 3; i++) {
            area.enemies.push(createEnemy('crawler', 150 + Math.random() * 500, 150 + Math.random() * 300));
        }
        area.enemies.push(createEnemy('spitter', 400, 200));
        area.enemies.push(createEnemy('brute', 300, 250));
    } else if (areaId === 'escape') {
        for (let i = 0; i < 3; i++) {
            area.enemies.push(createEnemy('shambler', 150 + Math.random() * 500, 150 + Math.random() * 300));
        }
        area.enemies.push(createEnemy('brute', 400, 200));
        area.enemies.push(createEnemy('brute', 300, 300));
    }

    // Generate loot
    if (areaId === 'storage') {
        area.loot = [
            { x: 150, y: 150, item: 'food' },
            { x: 200, y: 200, item: 'food' },
            { x: 400, y: 150, item: 'scrap' },
            { x: 500, y: 300, item: 'scrap' },
            { x: 600, y: 200, item: 'cloth' },
            { x: 350, y: 400, item: 'chemicals' }
        ];
    } else if (areaId === 'medical') {
        area.loot = [
            { x: 200, y: 150, item: 'medkit' },
            { x: 400, y: 200, item: 'medkit' },
            { x: 500, y: 350, item: 'antidote' },
            { x: 300, y: 300, item: 'chemicals' }
        ];
    } else if (areaId === 'research') {
        area.loot = [
            { x: 200, y: 150, item: 'electronics' },
            { x: 400, y: 200, item: 'electronics' },
            { x: 500, y: 350, item: 'scrap' },
            { x: 600, y: 250, item: 'keycard' },
            { x: 300, y: 300, item: 'datachip' }
        ];
    }
}

function createEnemy(type, x, y) {
    const templates = {
        shambler: { name: 'Shambler', hp: 30, damage: 10, speed: 1, size: 28, color: '#4a3', attackRate: 90, infectionGain: 5 },
        crawler: { name: 'Crawler', hp: 20, damage: 8, speed: 2.5, size: 22, color: '#884', attackRate: 60, infectionGain: 5 },
        spitter: { name: 'Spitter', hp: 25, damage: 15, speed: 0.8, size: 26, color: '#484', attackRate: 150, ranged: true, infectionGain: 10 },
        brute: { name: 'Brute', hp: 80, damage: 25, speed: 0.6, size: 40, color: '#644', attackRate: 120, infectionGain: 8 }
    };

    const t = templates[type];
    return {
        x, y, type,
        ...t,
        maxHp: t.hp,
        attackCooldown: 0,
        state: 'idle',
        hitFlash: 0,
        target: null,
        chargeTimer: 0
    };
}

function addItem(itemId, count = 1) {
    const data = itemData[itemId];
    const existing = player.inventory.find(i => i.id === itemId && i.count < data.stack);
    if (existing) {
        existing.count = Math.min(data.stack, existing.count + count);
    } else if (player.inventory.length < player.maxInventory) {
        player.inventory.push({ id: itemId, count });
    }
}

function hasItem(itemId, count = 1) {
    const item = player.inventory.find(i => i.id === itemId);
    return item && item.count >= count;
}

function removeItem(itemId, count = 1) {
    const item = player.inventory.find(i => i.id === itemId);
    if (item) {
        item.count -= count;
        if (item.count <= 0) {
            player.inventory = player.inventory.filter(i => i !== item);
        }
    }
}

function useInventoryItem(idx) {
    if (idx >= player.inventory.length) return;

    const item = player.inventory[idx];
    const data = itemData[item.id];

    if (data.type === 'consumable') {
        if (data.effect === 'hunger') {
            player.hunger = Math.max(0, player.hunger + data.value);
        } else if (data.effect === 'health') {
            player.hp = Math.min(player.maxHp, player.hp + data.value);
        } else if (data.effect === 'infection') {
            player.infection = Math.max(0, player.infection + data.value);
        }
        removeItem(item.id, 1);
    } else if (data.type === 'weapon') {
        player.weapon = item.id;
    }
}

function craftItem(idx) {
    const recipeKeys = Object.keys(recipes).filter(k => recipes[k].tier <= (player.hasTier2 ? 2 : 1));
    if (idx >= recipeKeys.length) return;

    const recipeId = recipeKeys[idx];
    const recipe = recipes[recipeId];

    // Check materials
    for (const [mat, count] of Object.entries(recipe.materials)) {
        if (!hasItem(mat, count)) return;
    }

    // Consume materials
    for (const [mat, count] of Object.entries(recipe.materials)) {
        removeItem(mat, count);
    }

    // Add crafted item
    if (recipeId === 'ammo') {
        addItem('ammo', 10);
    } else {
        addItem(recipeId, 1);
    }

    // Time passes
    gameTime += 10;
}

function startDodge() {
    if (player.dodgeCooldown > 0 || player.stamina < 20) return;

    let dx = 0, dy = 0;
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;

    if (dx === 0 && dy === 0) {
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
    } else {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;
    }

    player.dodging = true;
    player.dodgeDir = { x: dx, y: dy };
    player.dodgeTimer = 10;
    player.dodgeCooldown = 90;
    player.invincible = 15;
    player.stamina -= 20;
}

function playerAttack() {
    if (player.attackCooldown > 0 || player.stamina < 10) return;

    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    player.attackCooldown = 30;
    player.stamina -= 10;
    player.attacking = true;
    setTimeout(() => player.attacking = false, 150);

    const weaponDamage = {
        fists: 5,
        shiv: 10,
        pipeclub: 20,
        pistol: 15
    };

    const damage = weaponDamage[player.weapon] || 5;

    if (player.weapon === 'pistol') {
        if (hasItem('ammo')) {
            removeItem('ammo', 1);
            bullets.push({
                x: player.x, y: player.y,
                vx: nx * 15, vy: ny * 15,
                damage, friendly: true, life: 60
            });
            screenShake = 5;
            // Muzzle flash
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: player.x + nx * 20, y: player.y + ny * 20,
                    vx: nx * 3 + (Math.random() - 0.5) * 2,
                    vy: ny * 3 + (Math.random() - 0.5) * 2,
                    life: 10, color: '#ff8', size: 4
                });
            }
        }
    } else {
        // Melee attack
        const range = player.weapon === 'pipeclub' ? 45 : 35;
        for (const enemy of enemies) {
            const ex = enemy.x - player.x;
            const ey = enemy.y - player.y;
            const edist = Math.sqrt(ex * ex + ey * ey);

            if (edist < range + enemy.size / 2) {
                dealDamageToEnemy(enemy, damage, nx, ny);
            }
        }

        // Swing particle
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: player.x + nx * 25 + (Math.random() - 0.5) * 20,
                y: player.y + ny * 25 + (Math.random() - 0.5) * 20,
                vx: nx * 2, vy: ny * 2,
                life: 15, color: '#fff', size: 4
            });
        }
        screenShake = 3;
    }
}

function dealDamageToEnemy(enemy, damage, nx, ny) {
    enemy.hp -= damage;
    enemy.hitFlash = 10;
    enemy.x += nx * 10;
    enemy.y += ny * 10;

    // Hit particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 20, color: '#f44', size: 4
        });
    }

    if (enemy.hp <= 0) {
        // Blood pool (static)
        bloodPools.push({ x: enemy.x, y: enemy.y, size: enemy.size * 1.5 });
    }
}

// Update
function update() {
    if (gameState !== 'playing') return;

    // Screen shake decay
    if (screenShake > 0) screenShake *= 0.9;

    // Time passes (1 real second = 1 game minute simplified)
    gameTime += 0.016; // ~60fps, so this is roughly 1 min per real second

    // Global infection rises
    globalInfection += 0.001; // About 6% per real minute
    if (globalInfection >= 100) {
        gameState = 'gameover';
        return;
    }

    // Hunger increases
    player.hunger += 0.002;
    if (player.hunger >= 100) {
        player.hp -= 0.1;
    } else if (player.hunger >= 75) {
        player.hp -= 0.02;
    }

    // Personal infection effects
    if (player.infection >= 75) {
        player.hp -= 0.03;
    }

    // In unpowered sector, infection rises
    const area = areas[currentArea];
    if (!area.powered && area.type !== 'hub') {
        player.infection += 0.008;
    }

    // Check death
    if (player.hp <= 0 || player.infection >= 100) {
        gameState = 'gameover';
        return;
    }

    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.dodgeCooldown > 0) player.dodgeCooldown--;
    if (player.invincible > 0) player.invincible--;

    // Stamina regen
    if (player.stamina < player.maxStamina) {
        player.stamina += 0.15;
    }

    // Dodge movement
    if (player.dodging) {
        player.x += player.dodgeDir.x * 10;
        player.y += player.dodgeDir.y * 10;
        player.dodgeTimer--;
        if (player.dodgeTimer <= 0) player.dodging = false;
    } else {
        // Normal movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; dy *= 0.707;
        }

        let speed = player.speed;
        if (player.hunger >= 75) speed *= 0.75;
        else if (player.hunger >= 50) speed *= 0.9;

        player.x += dx * speed;
        player.y += dy * speed;
    }

    // Face toward mouse
    player.facing = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Bounds
    player.x = Math.max(30, Math.min(770, player.x));
    player.y = Math.max(80, Math.min(550, player.y));

    // Load current area's state
    enemies = area.enemies;
    lootItems = area.loot;

    // Check area transitions
    const connections = area.connections;
    if (player.y < 85 && connections.north) {
        transitionToArea(connections.north, 'north');
    } else if (player.y > 545 && connections.south) {
        transitionToArea(connections.south, 'south');
    } else if (player.x < 35 && connections.west) {
        transitionToArea(connections.west, 'west');
    } else if (player.x > 765 && connections.east) {
        transitionToArea(connections.east, 'east');
    }

    // Pickup loot
    for (let i = lootItems.length - 1; i >= 0; i--) {
        const loot = lootItems[i];
        if (Math.abs(player.x - loot.x) < 30 && Math.abs(player.y - loot.y) < 30) {
            if (loot.item === 'keycard') {
                player.hasKeycard = true;
            } else if (loot.item === 'datachip') {
                player.hasTier2 = true;
            } else {
                addItem(loot.item, 1);
            }
            lootItems.splice(i, 1);
        }
    }

    // Victory condition check
    if (currentArea === 'escape' && area.powered && player.hasKeycard) {
        if (player.x > 350 && player.x < 450 && player.y > 150 && player.y < 250) {
            gameState = 'victory';
            return;
        }
    }

    // Update enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (enemy.hitFlash > 0) enemy.hitFlash--;
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // AI
        if (dist < 250) {
            enemy.state = 'chase';

            if (enemy.ranged) {
                // Stay at distance
                if (dist < 100) {
                    enemy.x -= (dx / dist) * enemy.speed;
                    enemy.y -= (dy / dist) * enemy.speed;
                } else if (dist > 150) {
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                }

                // Ranged attack
                if (enemy.attackCooldown <= 0) {
                    enemy.attackCooldown = enemy.attackRate;
                    bullets.push({
                        x: enemy.x, y: enemy.y,
                        vx: (dx / dist) * 5, vy: (dy / dist) * 5,
                        damage: enemy.damage, friendly: false, life: 100,
                        acid: true
                    });
                }
            } else {
                // Chase
                if (dist > 25) {
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                } else if (enemy.attackCooldown <= 0 && player.invincible <= 0) {
                    // Melee attack
                    enemy.attackCooldown = enemy.attackRate;
                    playerTakeDamage(enemy.damage, enemy.infectionGain);
                }
            }
        } else {
            enemy.state = 'idle';
        }

        // Bounds
        enemy.x = Math.max(30, Math.min(770, enemy.x));
        enemy.y = Math.max(80, Math.min(550, enemy.y));
    }

    // Remove dead enemies (persist in area)
    area.enemies = enemies.filter(e => e.hp > 0);
    enemies = area.enemies;

    // Update bullets
    for (const bullet of bullets) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        if (bullet.friendly) {
            // Check enemy hit
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                if (Math.abs(bullet.x - enemy.x) < enemy.size / 2 + 5 &&
                    Math.abs(bullet.y - enemy.y) < enemy.size / 2 + 5) {
                    dealDamageToEnemy(enemy, bullet.damage, bullet.vx / 15, bullet.vy / 15);
                    bullet.life = 0;
                }
            }
        } else {
            // Check player hit
            if (player.invincible <= 0 &&
                Math.abs(bullet.x - player.x) < 15 &&
                Math.abs(bullet.y - player.y) < 15) {
                playerTakeDamage(bullet.damage, bullet.acid ? 10 : 0);
                bullet.life = 0;
            }
        }
    }
    bullets = bullets.filter(b => b.life > 0 && b.x > 0 && b.x < 800 && b.y > 50 && b.y < 600);

    // Update particles
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);

    // E to interact
    if (keys['e']) {
        keys['e'] = false;

        // Power toggle in hub
        if (currentArea === 'hub') {
            // Toggle nearest sector power
            const sectors = ['storage', 'medical', 'research', 'escape'];
            for (const sectorId of sectors) {
                const sector = areas[sectorId];
                if (!sector.powered && usedPower + sector.powerCost <= powerBudget) {
                    sector.powered = true;
                    usedPower += sector.powerCost;
                    break;
                }
            }
        }
    }
}

function transitionToArea(targetArea, direction) {
    // Save current area state
    areas[currentArea].enemies = enemies;
    areas[currentArea].loot = lootItems;

    currentArea = targetArea;
    areas[currentArea].visited = true;

    // Position based on entry direction
    if (direction === 'north') player.y = 520;
    else if (direction === 'south') player.y = 100;
    else if (direction === 'east') player.x = 50;
    else if (direction === 'west') player.x = 750;

    // Load new area
    enemies = areas[currentArea].enemies;
    lootItems = areas[currentArea].loot;
    bullets = [];
}

function playerTakeDamage(damage, infectionGain) {
    player.hp -= damage;
    player.infection += infectionGain;
    player.invincible = 60;
    screenShake = 10;

    // Hit particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20, color: '#f44', size: 4
        });
    }
}

// Draw
function draw() {
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake * 2,
            (Math.random() - 0.5) * screenShake * 2
        );
    }

    const area = areas[currentArea];

    // Background
    ctx.fillStyle = area.powered ? '#1a1a2a' : '#0a0a12';
    ctx.fillRect(0, 0, 800, 600);

    // Grid
    ctx.strokeStyle = area.powered ? '#222238' : '#151520';
    for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 70);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    for (let y = 70; y < 600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }

    // Doors/exits
    ctx.fillStyle = '#4a4';
    if (area.connections.north) ctx.fillRect(370, 70, 60, 15);
    if (area.connections.south) ctx.fillRect(370, 545, 60, 15);
    if (area.connections.west) ctx.fillRect(15, 280, 15, 60);
    if (area.connections.east) ctx.fillRect(770, 280, 15, 60);

    // Escape pod
    if (currentArea === 'escape' && area.powered) {
        ctx.fillStyle = '#48f';
        ctx.fillRect(350, 150, 100, 100);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPE POD', 400, 205);
        if (player.hasKeycard) {
            ctx.fillStyle = '#4f4';
            ctx.fillText('ACCESS GRANTED', 400, 225);
        } else {
            ctx.fillStyle = '#f44';
            ctx.fillText('KEYCARD REQUIRED', 400, 225);
        }
    }

    // Blood pools (static)
    ctx.fillStyle = 'rgba(80, 20, 20, 0.6)';
    for (const pool of bloodPools) {
        ctx.beginPath();
        ctx.arc(pool.x, pool.y, pool.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Loot
    for (const loot of lootItems) {
        const data = itemData[loot.item];
        ctx.fillStyle = loot.item === 'keycard' ? '#f44' : loot.item === 'datachip' ? '#4ff' : '#ff8';
        ctx.fillRect(loot.x - 8, loot.y - 8, 16, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(data?.name || loot.item, loot.x, loot.y + 22);
    }

    // Bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.friendly ? '#ff8' : (bullet.acid ? '#4f4' : '#f44');
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : enemy.color;
        ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x - 5, enemy.y - 5, 4, 4);
        ctx.fillRect(enemy.x + 1, enemy.y - 5, 4, 4);

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = '#400';
            ctx.fillRect(enemy.x - 15, enemy.y - enemy.size / 2 - 8, 30, 4);
            ctx.fillStyle = '#f44';
            ctx.fillRect(enemy.x - 15, enemy.y - enemy.size / 2 - 8, 30 * (enemy.hp / enemy.maxHp), 4);
        }
    }

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Player
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = player.dodging ? '#88f' : '#4a8';
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

    // Player facing direction (weapon aim)
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.facing) * 25, player.y + Math.sin(player.facing) * 25);
    ctx.stroke();

    if (player.attacking) {
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.arc(player.x + Math.cos(player.facing) * 30, player.y + Math.sin(player.facing) * 30, 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Screen tint for infection
    if (player.infection >= 25) {
        ctx.fillStyle = `rgba(0, 100, 0, ${Math.min(0.3, (player.infection - 25) / 150)})`;
        ctx.fillRect(0, 0, 800, 600);
    }

    ctx.restore();

    // HUD
    drawHUD();

    // Overlays
    if (gameState === 'title') drawTitle();
    else if (gameState === 'inventory') drawInventory();
    else if (gameState === 'crafting') drawCrafting();
    else if (gameState === 'gameover') drawGameOver();
    else if (gameState === 'victory') drawVictory();
}

function drawHUD() {
    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 65);

    // Health
    ctx.fillStyle = '#400';
    ctx.fillRect(10, 10, 150, 16);
    ctx.fillStyle = '#f44';
    ctx.fillRect(10, 10, 150 * (player.hp / player.maxHp), 16);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 150, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`, 85, 22);

    // Hunger
    ctx.fillStyle = '#420';
    ctx.fillRect(10, 30, 100, 10);
    ctx.fillStyle = '#f84';
    ctx.fillRect(10, 30, player.hunger, 10);
    ctx.strokeRect(10, 30, 100, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Hunger', 115, 39);

    // Infection (personal)
    ctx.fillStyle = '#040';
    ctx.fillRect(10, 44, 100, 10);
    ctx.fillStyle = '#4f4';
    ctx.fillRect(10, 44, player.infection, 10);
    ctx.strokeRect(10, 44, 100, 10);
    ctx.fillText('Infection', 115, 53);

    // Global infection
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Global: ${globalInfection.toFixed(1)}%`, 790, 25);

    // Area name
    ctx.textAlign = 'center';
    ctx.fillText(areas[currentArea].name, 400, 20);
    ctx.fillStyle = areas[currentArea].powered ? '#4f4' : '#f44';
    ctx.font = '11px Arial';
    ctx.fillText(areas[currentArea].powered ? 'POWERED' : 'NO POWER', 400, 35);

    // Power budget
    ctx.fillStyle = '#ff8';
    ctx.textAlign = 'left';
    ctx.fillText(`Power: ${usedPower}/${powerBudget}`, 200, 55);

    // Weapon
    ctx.fillStyle = '#8cf';
    ctx.textAlign = 'right';
    ctx.fillText(`Weapon: ${player.weapon}`, 790, 45);

    // Ammo
    if (player.weapon === 'pistol') {
        const ammoItem = player.inventory.find(i => i.id === 'ammo');
        ctx.fillText(`Ammo: ${ammoItem?.count || 0}`, 790, 60);
    }

    // Keycard
    if (player.hasKeycard) {
        ctx.fillStyle = '#f44';
        ctx.fillText('RED KEYCARD', 600, 25);
    }

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | Click: Attack | Right-Click: Dodge | Tab: Inventory | C: Craft | E: Interact', 400, 590);
}

function drawTitle() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4a8';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ISOLATION PROTOCOL', 400, 180);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Survival Horror - Subterrain Clone', 400, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('Survive the infected facility. Escape before it\'s too late.', 400, 280);

    ctx.fillStyle = '#f84';
    ctx.fillText('Objectives:', 400, 330);
    ctx.fillStyle = '#fff';
    ctx.fillText('1. Find the Red Keycard in Research Lab', 400, 355);
    ctx.fillText('2. Power the Escape Pod sector', 400, 375);
    ctx.fillText('3. Reach the Escape Pod before global infection hits 100%', 400, 395);

    ctx.fillStyle = '#ff0';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Begin', 400, 480);
}

function drawInventory() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(100, 80, 600, 450);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(100, 80, 600, 450);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', 400, 115);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        const data = itemData[item.id];
        const y = 150 + i * 30;

        ctx.fillStyle = '#ff8';
        ctx.fillText(`[${i + 1}]`, 130, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${data.name} x${item.count}`, 170, y);

        if (data.type === 'consumable') {
            ctx.fillStyle = '#4f4';
            ctx.fillText('(Use)', 400, y);
        } else if (data.type === 'weapon') {
            ctx.fillStyle = '#48f';
            ctx.fillText('(Equip)', 400, y);
        }
    }

    if (player.inventory.length === 0) {
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('Empty', 400, 200);
    }

    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Press number key to use/equip item | TAB to close', 400, 510);
}

function drawCrafting() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(100, 80, 600, 450);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(100, 80, 600, 450);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CRAFTING', 400, 115);

    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    const recipeKeys = Object.keys(recipes).filter(k => recipes[k].tier <= (player.hasTier2 ? 2 : 1));

    for (let i = 0; i < recipeKeys.length; i++) {
        const recipeId = recipeKeys[i];
        const recipe = recipes[recipeId];
        const y = 150 + i * 35;

        // Check if can craft
        let canCraft = true;
        let matText = '';
        for (const [mat, count] of Object.entries(recipe.materials)) {
            const has = player.inventory.find(it => it.id === mat)?.count || 0;
            if (has < count) canCraft = false;
            matText += `${itemData[mat].name}: ${has}/${count}  `;
        }

        ctx.fillStyle = '#ff8';
        ctx.fillText(`[${i + 1}]`, 130, y);
        ctx.fillStyle = canCraft ? '#4f4' : '#844';
        ctx.fillText(recipe.name, 170, y);
        ctx.fillStyle = '#888';
        ctx.font = '11px Arial';
        ctx.fillText(matText, 300, y);
        ctx.font = '14px Arial';
    }

    // Materials on hand
    ctx.fillStyle = '#8cf';
    ctx.fillText('Materials:', 130, 380);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    const mats = ['scrap', 'cloth', 'chemicals', 'electronics'];
    let matY = 400;
    for (const mat of mats) {
        const count = player.inventory.find(i => i.id === mat)?.count || 0;
        ctx.fillText(`${itemData[mat].name}: ${count}`, 150, matY);
        matY += 20;
    }

    if (!player.hasTier2) {
        ctx.fillStyle = '#f84';
        ctx.textAlign = 'center';
        ctx.fillText('Find Data Chip to unlock Tier 2 recipes', 400, 480);
    }

    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Press number key to craft | C to close', 400, 510);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(50,0,0,0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';

    if (player.hp <= 0) {
        ctx.fillText('YOU DIED', 400, 250);
    } else if (player.infection >= 100) {
        ctx.fillText('INFECTED', 400, 250);
        ctx.fillStyle = '#4a4';
        ctx.font = '20px Arial';
        ctx.fillText('The infection has consumed you.', 400, 300);
    } else {
        ctx.fillText('FACILITY LOST', 400, 250);
        ctx.fillStyle = '#888';
        ctx.font = '20px Arial';
        ctx.fillText('Global infection reached 100%', 400, 300);
    }

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to try again', 400, 400);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,30,50,0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4ff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('You made it out alive!', 400, 260);

    ctx.fillStyle = '#ff8';
    ctx.font = '16px Arial';
    ctx.fillText(`Global Infection: ${globalInfection.toFixed(1)}%`, 400, 320);
    ctx.fillText(`Personal Infection: ${player.infection.toFixed(1)}%`, 400, 350);

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to play again', 400, 430);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
