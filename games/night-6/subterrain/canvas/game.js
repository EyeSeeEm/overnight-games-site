// Isolation Protocol - Subterrain Clone
// Survival Horror with meters, infection, sectors

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const PLAYER_SPEED = 150;
const ATTACK_COOLDOWN = 500;

// Survival meter decay rates (per game minute = per real second)
const HUNGER_DECAY = 0.1;
const THIRST_DECAY = 0.2;
const FATIGUE_DECAY = 0.067;
const GLOBAL_INFECTION_RATE = 0.1;

// Game state
let gameState = 'menu'; // menu, playing, gameover, victory
let gamePaused = true;
let gameTime = 0; // in game minutes
let realTime = 0;
let globalInfection = 0;

// Player state
const player = {
    x: 240, y: 240,
    width: 24, height: 24,
    speed: PLAYER_SPEED,
    angle: 0,
    health: 100,
    maxHealth: 100,
    hunger: 0,
    thirst: 0,
    fatigue: 0,
    infection: 0,
    stamina: 100,
    maxStamina: 100,
    attackCooldown: 0,
    weapon: { name: 'Fists', damage: 5, speed: 500, range: 40, type: 'melee' },
    inventory: [],
    maxInventory: 20,
    quickSlots: [null, null, null],
    hasRedKeycard: false
};

// Sector definitions
const SECTORS = {
    hub: {
        name: 'Central Hub',
        powerCost: 0,
        powered: true,
        width: 15, height: 15,
        safe: true,
        exits: { south: 'storage', east: 'medical', west: 'research', north: 'escape' },
        spawnEnemies: [],
        containers: [],
        interactables: ['workbench', 'bed', 'storage', 'powerPanel']
    },
    storage: {
        name: 'Storage Wing',
        powerCost: 100,
        powered: false,
        width: 20, height: 20,
        safe: false,
        exits: { north: 'hub' },
        spawnEnemies: ['shambler', 'shambler', 'shambler', 'crawler', 'crawler'],
        containers: Array(10).fill('container'),
        interactables: ['workbench']
    },
    medical: {
        name: 'Medical Bay',
        powerCost: 150,
        powered: false,
        width: 20, height: 20,
        safe: false,
        exits: { west: 'hub' },
        spawnEnemies: ['shambler', 'shambler', 'spitter', 'spitter', 'spitter'],
        containers: Array(6).fill('medical_container'),
        interactables: ['medicalStation']
    },
    research: {
        name: 'Research Lab',
        powerCost: 200,
        powered: false,
        width: 25, height: 25,
        safe: false,
        exits: { east: 'hub' },
        spawnEnemies: ['crawler', 'crawler', 'crawler', 'spitter', 'spitter', 'brute'],
        containers: Array(6).fill('tech_container'),
        interactables: ['researchTerminal'],
        hasKeycard: true
    },
    escape: {
        name: 'Escape Pod',
        powerCost: 300,
        powered: false,
        width: 15, height: 15,
        safe: false,
        exits: { south: 'hub' },
        spawnEnemies: ['shambler', 'crawler', 'spitter', 'brute', 'brute'],
        containers: [],
        interactables: ['escapePod']
    }
};

// Current sector state
let currentSector = 'hub';
let sectorStates = {}; // Persisted sector states
let enemies = [];
let items = [];
let containers = [];
let interactables = [];
let particles = [];

// Power system
let powerCapacity = 500;
let powerUsed = 0;

// Camera
let cameraX = 0, cameraY = 0;

// Input
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Messages
let messages = [];

// Item definitions
const ITEM_DEFS = {
    food: { name: 'Canned Food', effect: { hunger: -30 }, stackable: true, maxStack: 5 },
    water: { name: 'Water Bottle', effect: { thirst: -40 }, stackable: true, maxStack: 5 },
    mre: { name: 'MRE Pack', effect: { hunger: -50, thirst: -20 }, stackable: true, maxStack: 3 },
    medkit: { name: 'Medkit', effect: { health: 30 }, stackable: true, maxStack: 3 },
    antidote: { name: 'Antidote', effect: { infection: -30 }, stackable: true, maxStack: 3 },
    scrap: { name: 'Scrap Metal', crafting: true, stackable: true, maxStack: 10 },
    cloth: { name: 'Cloth', crafting: true, stackable: true, maxStack: 10 },
    chemicals: { name: 'Chemicals', crafting: true, stackable: true, maxStack: 10 },
    electronics: { name: 'Electronics', crafting: true, stackable: true, maxStack: 10 },
    shiv: { name: 'Shiv', weapon: { damage: 10, speed: 400, range: 45, type: 'melee' } },
    pipeClub: { name: 'Pipe Club', weapon: { damage: 20, speed: 1000, range: 50, type: 'melee' } },
    redKeycard: { name: 'Red Keycard', key: true }
};

// Enemy definitions
const ENEMY_DEFS = {
    shambler: { name: 'Shambler', hp: 30, damage: 10, speed: 0.5, attackRate: 1500, infection: 5, color: '#4a3', size: 28 },
    crawler: { name: 'Crawler', hp: 20, damage: 8, speed: 1.2, attackRate: 1000, infection: 5, color: '#363', size: 20 },
    spitter: { name: 'Spitter', hp: 25, damage: 15, speed: 0.4, attackRate: 2500, infection: 10, color: '#6a3', size: 24, ranged: true },
    brute: { name: 'Brute', hp: 80, damage: 25, speed: 0.3, attackRate: 2000, infection: 8, color: '#282', size: 40 },
    cocoon: { name: 'Cocoon', hp: 50, damage: 0, speed: 0, attackRate: 0, infection: 1, color: '#252', size: 36, stationary: true }
};

// Initialize sector states
function initSectorStates() {
    for (const key in SECTORS) {
        const sector = SECTORS[key];
        sectorStates[key] = {
            enemies: [],
            items: [],
            containers: [],
            cleared: false,
            visited: false
        };
    }
}

// Generate sector content
function generateSector(sectorKey) {
    const sector = SECTORS[sectorKey];
    const state = sectorStates[sectorKey];

    enemies = [];
    items = [];
    containers = [];
    interactables = [];

    const worldW = sector.width * TILE_SIZE;
    const worldH = sector.height * TILE_SIZE;

    // If already visited, restore state
    if (state.visited) {
        enemies = state.enemies.filter(e => e.hp > 0).map(e => ({...e}));
        items = state.items.map(i => ({...i}));
        containers = state.containers.map(c => ({...c}));
    } else {
        // First visit - generate
        state.visited = true;

        // Spawn enemies
        if (!sector.safe) {
            sector.spawnEnemies.forEach((type, i) => {
                const def = ENEMY_DEFS[type];
                const x = TILE_SIZE * 2 + Math.random() * (worldW - TILE_SIZE * 4);
                const y = TILE_SIZE * 2 + Math.random() * (worldH - TILE_SIZE * 4);
                enemies.push({
                    type,
                    x, y,
                    hp: def.hp,
                    maxHp: def.hp,
                    damage: def.damage,
                    speed: def.speed * PLAYER_SPEED,
                    attackRate: def.attackRate,
                    infection: def.infection,
                    color: def.color,
                    size: def.size,
                    ranged: def.ranged || false,
                    stationary: def.stationary || false,
                    attackCooldown: 0,
                    state: 'idle',
                    targetX: x,
                    targetY: y
                });
            });
        }

        // Spawn containers
        sector.containers.forEach((type, i) => {
            const x = TILE_SIZE * 2 + Math.random() * (worldW - TILE_SIZE * 4);
            const y = TILE_SIZE * 2 + Math.random() * (worldH - TILE_SIZE * 4);
            const loot = generateLoot(type);
            containers.push({
                x, y,
                width: 32, height: 32,
                type,
                looted: false,
                loot
            });
        });

        // Red keycard in research
        if (sector.hasKeycard) {
            items.push({
                type: 'redKeycard',
                x: worldW / 2,
                y: worldH / 2
            });
        }
    }

    // Generate interactables
    if (sector.interactables) {
        sector.interactables.forEach((type, i) => {
            let x, y;
            switch (type) {
                case 'workbench':
                    x = TILE_SIZE * 2; y = TILE_SIZE * 2;
                    break;
                case 'bed':
                    x = TILE_SIZE * 4; y = TILE_SIZE * 2;
                    break;
                case 'storage':
                    x = TILE_SIZE * 6; y = TILE_SIZE * 2;
                    break;
                case 'powerPanel':
                    x = TILE_SIZE * 8; y = TILE_SIZE * 2;
                    break;
                case 'medicalStation':
                    x = worldW / 2; y = TILE_SIZE * 2;
                    break;
                case 'researchTerminal':
                    x = worldW / 2; y = TILE_SIZE * 2;
                    break;
                case 'escapePod':
                    x = worldW / 2; y = worldH / 2;
                    break;
                default:
                    x = TILE_SIZE * 2 + i * TILE_SIZE * 2;
                    y = TILE_SIZE * 2;
            }
            interactables.push({ type, x, y, width: 40, height: 40 });
        });
    }
}

function generateLoot(containerType) {
    const loot = [];
    const rand = Math.random();

    if (containerType === 'container') {
        if (rand < 0.4) loot.push({ type: 'food', count: 1 + Math.floor(Math.random() * 2) });
        if (rand < 0.3) loot.push({ type: 'water', count: 1 + Math.floor(Math.random() * 2) });
        if (rand < 0.5) loot.push({ type: 'scrap', count: 1 + Math.floor(Math.random() * 3) });
        if (rand < 0.2) loot.push({ type: 'cloth', count: 1 + Math.floor(Math.random() * 2) });
    } else if (containerType === 'medical_container') {
        if (rand < 0.5) loot.push({ type: 'medkit', count: 1 });
        if (rand < 0.3) loot.push({ type: 'antidote', count: 1 });
        if (rand < 0.4) loot.push({ type: 'chemicals', count: 1 + Math.floor(Math.random() * 2) });
    } else if (containerType === 'tech_container') {
        if (rand < 0.5) loot.push({ type: 'electronics', count: 1 });
        if (rand < 0.3) loot.push({ type: 'scrap', count: 2 + Math.floor(Math.random() * 3) });
    }

    return loot;
}

function saveSectorState() {
    sectorStates[currentSector].enemies = enemies.map(e => ({...e}));
    sectorStates[currentSector].items = items.map(i => ({...i}));
    sectorStates[currentSector].containers = containers.map(c => ({...c}));
}

function transitionToSector(newSector, fromDirection) {
    saveSectorState();
    currentSector = newSector;
    generateSector(newSector);

    const sector = SECTORS[newSector];
    const worldW = sector.width * TILE_SIZE;
    const worldH = sector.height * TILE_SIZE;

    // Spawn player based on entry direction
    switch (fromDirection) {
        case 'north':
            player.x = worldW / 2;
            player.y = worldH - TILE_SIZE * 2;
            break;
        case 'south':
            player.x = worldW / 2;
            player.y = TILE_SIZE * 2;
            break;
        case 'east':
            player.x = TILE_SIZE * 2;
            player.y = worldH / 2;
            break;
        case 'west':
            player.x = worldW - TILE_SIZE * 2;
            player.y = worldH / 2;
            break;
    }

    showMessage(`Entered ${sector.name}`);
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Tab') {
        e.preventDefault();
        toggleInventory();
    }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) mouseDown = true;
});
canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouseDown = false;
});

// UI buttons
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('victory-restart-btn').addEventListener('click', restartGame);

function startGame() {
    document.getElementById('menu-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
}

function restartGame() {
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
}

function initGame() {
    // Reset player
    player.health = 100;
    player.hunger = 0;
    player.thirst = 0;
    player.fatigue = 0;
    player.infection = 0;
    player.stamina = 100;
    player.attackCooldown = 0;
    player.weapon = { name: 'Fists', damage: 5, speed: 500, range: 40, type: 'melee' };
    player.inventory = [
        { type: 'food', count: 2 },
        { type: 'water', count: 2 },
        { type: 'shiv', count: 1 }
    ];
    player.hasRedKeycard = false;

    // Reset time
    gameTime = 0;
    realTime = 0;
    globalInfection = 0;

    // Reset power
    powerUsed = 0;
    for (const key in SECTORS) {
        SECTORS[key].powered = key === 'hub';
    }

    // Reset sectors
    initSectorStates();

    // Start in hub
    currentSector = 'hub';
    generateSector('hub');
    player.x = SECTORS.hub.width * TILE_SIZE / 2;
    player.y = SECTORS.hub.height * TILE_SIZE / 2;

    messages = [];
    showMessage('Wake up. Find the escape pod.');
}

let showingInventory = false;
function toggleInventory() {
    showingInventory = !showingInventory;
    const overlay = document.getElementById('inventory-overlay');
    if (showingInventory) {
        overlay.classList.remove('hidden');
        renderInventory();
    } else {
        overlay.classList.add('hidden');
    }
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    for (let i = 0; i < player.maxInventory; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';

        if (player.inventory[i]) {
            const item = player.inventory[i];
            const def = ITEM_DEFS[item.type];
            slot.textContent = def.name.substring(0, 4);
            if (item.count > 1) slot.textContent += ` x${item.count}`;
            slot.onclick = () => selectInventoryItem(i);
        }

        grid.appendChild(slot);
    }
}

let selectedInvItem = -1;
function selectInventoryItem(index) {
    selectedInvItem = index;
    const item = player.inventory[index];
    if (!item) return;

    const def = ITEM_DEFS[item.type];
    let info = `<b>${def.name}</b>`;
    if (def.effect) {
        info += '<br>Press E to use';
    }
    if (def.weapon) {
        info += `<br>Damage: ${def.weapon.damage}`;
    }
    document.getElementById('item-info').innerHTML = info;
}

function useItem(index) {
    const item = player.inventory[index];
    if (!item) return false;

    const def = ITEM_DEFS[item.type];

    if (def.effect) {
        if (def.effect.health) player.health = Math.min(player.maxHealth, player.health + def.effect.health);
        if (def.effect.hunger) player.hunger = Math.max(0, player.hunger + def.effect.hunger);
        if (def.effect.thirst) player.thirst = Math.max(0, player.thirst + def.effect.thirst);
        if (def.effect.infection) player.infection = Math.max(0, player.infection + def.effect.infection);

        item.count--;
        if (item.count <= 0) player.inventory.splice(index, 1);
        showMessage(`Used ${def.name}`);
        return true;
    }

    if (def.weapon) {
        player.weapon = { name: def.name, ...def.weapon };
        showMessage(`Equipped ${def.name}`);
        return true;
    }

    if (def.key && item.type === 'redKeycard') {
        player.hasRedKeycard = true;
        showMessage('Picked up Red Keycard!');
        return true;
    }

    return false;
}

function addToInventory(type, count = 1) {
    const def = ITEM_DEFS[type];

    // Check for existing stack
    if (def.stackable) {
        for (const item of player.inventory) {
            if (item.type === type && item.count < def.maxStack) {
                const add = Math.min(count, def.maxStack - item.count);
                item.count += add;
                count -= add;
                if (count <= 0) return true;
            }
        }
    }

    // Add new slots
    while (count > 0 && player.inventory.length < player.maxInventory) {
        const add = def.stackable ? Math.min(count, def.maxStack) : 1;
        player.inventory.push({ type, count: add });
        count -= add;
    }

    return count <= 0;
}

function showMessage(text) {
    messages.push({ text, time: 3000 });
    const el = document.getElementById('messages');
    el.innerHTML = messages.map(m => `<div class="message">${m.text}</div>`).join('');
}

function updateMessages(dt) {
    messages = messages.filter(m => {
        m.time -= dt;
        return m.time > 0;
    });
}

// Game update
function update(dt) {
    if (gameState !== 'playing' || gamePaused) return;

    const sector = SECTORS[currentSector];
    const worldW = sector.width * TILE_SIZE;
    const worldH = sector.height * TILE_SIZE;

    // Update time (1 real second = 1 game minute)
    realTime += dt / 1000;
    gameTime = Math.floor(realTime);

    // Global infection
    globalInfection += GLOBAL_INFECTION_RATE * dt / 1000;
    if (globalInfection >= 100) {
        gameOver('The facility is lost. No one escapes.');
        return;
    }

    // Survival meter decay
    player.hunger += HUNGER_DECAY * dt / 1000;
    player.thirst += THIRST_DECAY * dt / 1000;
    player.fatigue += FATIGUE_DECAY * dt / 1000;

    // Infection in unpowered sectors
    if (!sector.powered && !sector.safe) {
        player.infection += 0.5 * dt / 1000;
    }

    // Meter effects
    if (player.hunger >= 75 || player.thirst >= 75) {
        player.health -= 1 * dt / 1000;
    }
    if (player.infection >= 75) {
        player.health -= 2 * dt / 1000;
    }

    // Clamp meters
    player.hunger = Math.min(100, player.hunger);
    player.thirst = Math.min(100, player.thirst);
    player.fatigue = Math.min(100, player.fatigue);
    player.infection = Math.min(100, player.infection);

    // Death checks
    if (player.health <= 0) {
        gameOver('You died.');
        return;
    }
    if (player.infection >= 100) {
        gameOver('The infection has consumed you.');
        return;
    }

    // Movement speed modifiers
    let speedMod = 1;
    if (player.hunger >= 75) speedMod *= 0.75;
    else if (player.hunger >= 50) speedMod *= 0.9;
    if (player.fatigue >= 75) speedMod *= 0.8;

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;

        const newX = player.x + dx * player.speed * speedMod * dt / 1000;
        const newY = player.y + dy * player.speed * speedMod * dt / 1000;

        // Wall collision
        if (newX > player.width / 2 && newX < worldW - player.width / 2) player.x = newX;
        if (newY > player.height / 2 && newY < worldH - player.height / 2) player.y = newY;
    }

    // Player angle (look at mouse)
    const worldMouseX = mouseX + cameraX;
    const worldMouseY = mouseY + cameraY;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Attack cooldown
    if (player.attackCooldown > 0) player.attackCooldown -= dt;

    // Attack
    if (mouseDown && player.attackCooldown <= 0) {
        attack();
    }

    // Interact with E key
    if (keys['e']) {
        keys['e'] = false;
        interact();
    }

    // Quick slots
    if (keys['1'] && player.inventory[0]) { useItem(0); keys['1'] = false; }
    if (keys['2'] && player.inventory[1]) { useItem(1); keys['2'] = false; }
    if (keys['3'] && player.inventory[2]) { useItem(2); keys['3'] = false; }

    // Update enemies
    updateEnemies(dt);

    // Check sector exits
    checkSectorExits();

    // Pickup items
    pickupItems();

    // Update particles
    particles = particles.filter(p => {
        p.life -= dt;
        p.x += p.vx * dt / 1000;
        p.y += p.vy * dt / 1000;
        p.vx *= 0.98;
        p.vy *= 0.98;
        return p.life > 0;
    });

    // Update camera
    updateCamera();

    // Update messages
    updateMessages(dt);

    // Update HUD
    updateHUD();
}

function attack() {
    player.attackCooldown = player.weapon.speed;

    const attackDist = player.weapon.range;

    for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < attackDist + enemy.size / 2 + 10) {
            const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            let angleDiff = angleToEnemy - player.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) < Math.PI / 2) {
                // Calculate damage with fatigue penalty
                let damage = player.weapon.damage;
                if (player.fatigue >= 75) damage *= 0.6;
                else if (player.fatigue >= 50) damage *= 0.8;

                enemy.hp -= damage;
                spawnParticles(enemy.x, enemy.y, '#f00', 5);

                if (enemy.hp <= 0) {
                    spawnParticles(enemy.x, enemy.y, '#800', 15);
                    showMessage(`Killed ${ENEMY_DEFS[enemy.type].name}`);
                }
            }
        }
    }

    // Spawn attack effect
    spawnParticles(
        player.x + Math.cos(player.angle) * 30,
        player.y + Math.sin(player.angle) * 30,
        '#ff0', 3
    );
}

function updateEnemies(dt) {
    // Apply global infection scaling
    const hpScale = globalInfection < 25 ? 1 : globalInfection < 50 ? 1.25 : globalInfection < 75 ? 1.5 : 2;
    const dmgScale = globalInfection < 25 ? 1 : globalInfection < 50 ? 1.1 : globalInfection < 75 ? 1.25 : 1.5;

    enemies = enemies.filter(e => e.hp > 0);

    for (const enemy of enemies) {
        if (enemy.stationary) continue;

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const detectionRange = 200;

        // State machine
        if (dist < detectionRange) {
            enemy.state = 'chase';
            enemy.targetX = player.x;
            enemy.targetY = player.y;
        } else if (enemy.state === 'chase' && dist > detectionRange * 1.5) {
            enemy.state = 'idle';
        }

        // Movement
        if (enemy.state === 'chase' && !enemy.ranged) {
            const angle = Math.atan2(enemy.targetY - enemy.y, enemy.targetX - enemy.x);
            enemy.x += Math.cos(angle) * enemy.speed * dt / 1000;
            enemy.y += Math.sin(angle) * enemy.speed * dt / 1000;
        } else if (enemy.state === 'chase' && enemy.ranged) {
            // Spitter keeps distance
            if (dist < 100) {
                const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                enemy.x += Math.cos(angle) * enemy.speed * dt / 1000;
                enemy.y += Math.sin(angle) * enemy.speed * dt / 1000;
            } else if (dist > 200) {
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                enemy.x += Math.cos(angle) * enemy.speed * dt / 1000;
                enemy.y += Math.sin(angle) * enemy.speed * dt / 1000;
            }
        }

        // Attack
        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

        if (dist < 40 && enemy.attackCooldown <= 0 && !enemy.ranged) {
            enemy.attackCooldown = enemy.attackRate;
            player.health -= enemy.damage * dmgScale;
            player.infection += enemy.infection;
            spawnParticles(player.x, player.y, '#f00', 5);
            showMessage(`Hit by ${ENEMY_DEFS[enemy.type].name}!`);
        }

        // Ranged attack
        if (enemy.ranged && dist < 250 && dist > 50 && enemy.attackCooldown <= 0) {
            enemy.attackCooldown = enemy.attackRate;
            // Simplified ranged - instant hit with chance to dodge
            if (Math.random() < 0.6) {
                player.health -= enemy.damage * dmgScale;
                player.infection += enemy.infection;
                spawnParticles(player.x, player.y, '#0f0', 5);
                showMessage('Hit by acid!');
            }
        }
    }
}

function checkSectorExits() {
    const sector = SECTORS[currentSector];
    const worldW = sector.width * TILE_SIZE;
    const worldH = sector.height * TILE_SIZE;

    // Check each exit
    if (sector.exits) {
        if (sector.exits.north && player.y < TILE_SIZE) {
            const target = sector.exits.north;
            if (canEnterSector(target)) {
                transitionToSector(target, 'south');
            } else {
                player.y = TILE_SIZE;
            }
        }
        if (sector.exits.south && player.y > worldH - TILE_SIZE) {
            const target = sector.exits.south;
            if (canEnterSector(target)) {
                transitionToSector(target, 'north');
            } else {
                player.y = worldH - TILE_SIZE;
            }
        }
        if (sector.exits.east && player.x > worldW - TILE_SIZE) {
            const target = sector.exits.east;
            if (canEnterSector(target)) {
                transitionToSector(target, 'west');
            } else {
                player.x = worldW - TILE_SIZE;
            }
        }
        if (sector.exits.west && player.x < TILE_SIZE) {
            const target = sector.exits.west;
            if (canEnterSector(target)) {
                transitionToSector(target, 'east');
            } else {
                player.x = TILE_SIZE;
            }
        }
    }
}

function canEnterSector(sectorKey) {
    // Escape pod requires keycard
    if (sectorKey === 'escape' && !player.hasRedKeycard) {
        showMessage('Requires Red Keycard');
        return false;
    }
    return true;
}

function pickupItems() {
    items = items.filter(item => {
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 30) {
            if (item.type === 'redKeycard') {
                player.hasRedKeycard = true;
                showMessage('Picked up Red Keycard!');
                return false;
            }
            if (addToInventory(item.type, 1)) {
                const def = ITEM_DEFS[item.type];
                showMessage(`Picked up ${def.name}`);
                return false;
            }
        }
        return true;
    });
}

function interact() {
    // Check containers
    for (const container of containers) {
        const dist = Math.hypot(container.x - player.x, container.y - player.y);
        if (dist < 50 && !container.looted) {
            container.looted = true;
            for (const loot of container.loot) {
                addToInventory(loot.type, loot.count);
                showMessage(`Found ${ITEM_DEFS[loot.type].name} x${loot.count}`);
            }
            return;
        }
    }

    // Check interactables
    for (const inter of interactables) {
        const dist = Math.hypot(inter.x - player.x, inter.y - player.y);
        if (dist < 50) {
            switch (inter.type) {
                case 'workbench':
                    showMessage('Workbench (crafting not yet implemented)');
                    break;
                case 'bed':
                    player.fatigue = Math.max(0, player.fatigue - 30);
                    gameTime += 60; // 1 hour passes
                    showMessage('Rested. Fatigue reduced.');
                    break;
                case 'medicalStation':
                    if (SECTORS.medical.powered) {
                        player.health = Math.min(player.maxHealth, player.health + 20);
                        showMessage('Used Medical Station');
                    } else {
                        showMessage('Medical Station requires power');
                    }
                    break;
                case 'escapePod':
                    if (SECTORS.escape.powered) {
                        victory();
                    } else {
                        showMessage('Escape Pod requires power');
                    }
                    break;
                case 'powerPanel':
                    togglePowerPanel();
                    break;
            }
            return;
        }
    }

    // Use selected inventory item
    if (selectedInvItem >= 0 && player.inventory[selectedInvItem]) {
        useItem(selectedInvItem);
    }
}

function togglePowerPanel() {
    // Simple power toggle for now - cycle through sectors
    const sectors = ['storage', 'medical', 'research', 'escape'];
    let found = false;

    for (const key of sectors) {
        if (!SECTORS[key].powered && powerUsed + SECTORS[key].powerCost <= powerCapacity) {
            SECTORS[key].powered = true;
            powerUsed += SECTORS[key].powerCost;
            showMessage(`Powered ${SECTORS[key].name}`);
            found = true;
            break;
        }
    }

    if (!found) {
        // Try unpowering something
        for (const key of sectors) {
            if (SECTORS[key].powered) {
                SECTORS[key].powered = false;
                powerUsed -= SECTORS[key].powerCost;
                showMessage(`Unpowered ${SECTORS[key].name}`);
                break;
            }
        }
    }
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 300 + Math.random() * 200,
            size: 2 + Math.random() * 3
        });
    }
}

function updateCamera() {
    const sector = SECTORS[currentSector];
    const worldW = sector.width * TILE_SIZE;
    const worldH = sector.height * TILE_SIZE;

    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    cameraX += (targetX - cameraX) * 0.1;
    cameraY += (targetY - cameraY) * 0.1;

    cameraX = Math.max(0, Math.min(worldW - canvas.width, cameraX));
    cameraY = Math.max(0, Math.min(worldH - canvas.height, cameraY));
}

function updateHUD() {
    document.getElementById('health-fill').style.width = `${player.health}%`;
    document.getElementById('health-value').textContent = Math.floor(player.health);

    document.getElementById('hunger-fill').style.width = `${player.hunger}%`;
    document.getElementById('hunger-value').textContent = Math.floor(player.hunger);

    document.getElementById('thirst-fill').style.width = `${player.thirst}%`;
    document.getElementById('thirst-value').textContent = Math.floor(player.thirst);

    document.getElementById('fatigue-fill').style.width = `${player.fatigue}%`;
    document.getElementById('fatigue-value').textContent = Math.floor(player.fatigue);

    document.getElementById('infection-fill').style.width = `${player.infection}%`;
    document.getElementById('infection-value').textContent = Math.floor(player.infection);

    document.getElementById('global-infection').textContent = `GLOBAL: ${Math.floor(globalInfection)}%`;

    const hours = Math.floor(gameTime / 60);
    const mins = gameTime % 60;
    document.getElementById('time-display').textContent =
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    document.getElementById('power-display').textContent = `POWER: ${powerCapacity - powerUsed}/${powerCapacity}`;
    document.getElementById('sector-name').textContent = SECTORS[currentSector].name.toUpperCase();

    // Quick slots
    for (let i = 0; i < 3; i++) {
        const item = player.inventory[i];
        const el = document.getElementById(`slot-${i + 1}-item`);
        if (item) {
            el.textContent = ITEM_DEFS[item.type].name.substring(0, 4);
        } else {
            el.textContent = '-';
        }
    }
}

function gameOver(reason) {
    gameState = 'gameover';
    gamePaused = true;
    document.getElementById('death-reason').textContent = reason;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

function victory() {
    gameState = 'victory';
    gamePaused = true;
    const stats = `Time: ${Math.floor(gameTime / 60)}h ${gameTime % 60}m | Global Infection: ${Math.floor(globalInfection)}%`;
    document.getElementById('victory-stats').textContent = stats;
    document.getElementById('victory-overlay').classList.remove('hidden');
}

// Rendering
function render() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') return;

    const sector = SECTORS[currentSector];
    const worldW = sector.width * TILE_SIZE;
    const worldH = sector.height * TILE_SIZE;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw floor
    const powered = sector.powered;
    ctx.fillStyle = powered ? '#1a1a2a' : '#0a0a15';
    ctx.fillRect(0, 0, worldW, worldH);

    // Draw grid
    ctx.strokeStyle = powered ? '#222' : '#111';
    ctx.lineWidth = 1;
    for (let x = 0; x <= worldW; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, worldH);
        ctx.stroke();
    }
    for (let y = 0; y <= worldH; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldW, y);
        ctx.stroke();
    }

    // Draw walls
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, worldW, TILE_SIZE / 2);
    ctx.fillRect(0, worldH - TILE_SIZE / 2, worldW, TILE_SIZE / 2);
    ctx.fillRect(0, 0, TILE_SIZE / 2, worldH);
    ctx.fillRect(worldW - TILE_SIZE / 2, 0, TILE_SIZE / 2, worldH);

    // Draw exits
    ctx.fillStyle = '#060';
    if (sector.exits) {
        if (sector.exits.north) {
            ctx.fillRect(worldW / 2 - 30, 0, 60, TILE_SIZE / 2);
            ctx.fillStyle = '#0f0';
            ctx.font = '10px monospace';
            ctx.fillText('EXIT', worldW / 2 - 15, 12);
            ctx.fillStyle = '#060';
        }
        if (sector.exits.south) {
            ctx.fillRect(worldW / 2 - 30, worldH - TILE_SIZE / 2, 60, TILE_SIZE / 2);
        }
        if (sector.exits.east) {
            ctx.fillRect(worldW - TILE_SIZE / 2, worldH / 2 - 30, TILE_SIZE / 2, 60);
        }
        if (sector.exits.west) {
            ctx.fillRect(0, worldH / 2 - 30, TILE_SIZE / 2, 60);
        }
    }

    // Draw containers
    for (const container of containers) {
        ctx.fillStyle = container.looted ? '#333' : '#654';
        ctx.fillRect(container.x - 16, container.y - 16, 32, 32);
        if (!container.looted) {
            ctx.strokeStyle = '#a86';
            ctx.strokeRect(container.x - 16, container.y - 16, 32, 32);
        }
    }

    // Draw interactables
    for (const inter of interactables) {
        switch (inter.type) {
            case 'workbench':
                ctx.fillStyle = '#555';
                ctx.fillRect(inter.x - 20, inter.y - 20, 40, 40);
                ctx.fillStyle = '#888';
                ctx.font = '8px monospace';
                ctx.fillText('WORK', inter.x - 12, inter.y + 3);
                break;
            case 'bed':
                ctx.fillStyle = '#445';
                ctx.fillRect(inter.x - 20, inter.y - 20, 40, 40);
                ctx.fillStyle = '#668';
                ctx.fillText('BED', inter.x - 10, inter.y + 3);
                break;
            case 'powerPanel':
                ctx.fillStyle = '#553';
                ctx.fillRect(inter.x - 20, inter.y - 20, 40, 40);
                ctx.fillStyle = '#ff0';
                ctx.fillText('PWR', inter.x - 10, inter.y + 3);
                break;
            case 'medicalStation':
                ctx.fillStyle = '#355';
                ctx.fillRect(inter.x - 20, inter.y - 20, 40, 40);
                ctx.fillStyle = '#0ff';
                ctx.fillText('MED', inter.x - 10, inter.y + 3);
                break;
            case 'escapePod':
                ctx.fillStyle = '#353';
                ctx.fillRect(inter.x - 25, inter.y - 25, 50, 50);
                ctx.fillStyle = '#0f0';
                ctx.font = '10px monospace';
                ctx.fillText('ESCAPE', inter.x - 20, inter.y + 3);
                break;
        }
    }

    // Draw items
    for (const item of items) {
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '8px monospace';
        ctx.fillText('K', item.x - 3, item.y + 3);
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.size / 2 - 8, 30 * hpPercent, 4);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(enemy.x - 15, enemy.y - enemy.size / 2 - 8, 30, 4);
    }

    // Draw player
    ctx.fillStyle = '#08f';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    ctx.strokeStyle = '#0af';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + Math.cos(player.angle) * 25,
        player.y + Math.sin(player.angle) * 25
    );
    ctx.stroke();

    // Draw particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 500;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Darkness overlay for unpowered sectors
    if (!powered) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Infection screen effect
    if (player.infection >= 25) {
        ctx.strokeStyle = `rgba(0, 255, 0, ${player.infection / 300})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!gamePaused) {
        update(dt);
    }
    render();

    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);

// Harness interface for playtesting
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: async (action, durationMs) => {
        gamePaused = false;

        if (action.keys) {
            for (const key of action.keys) {
                keys[key.toLowerCase()] = true;
            }
        }
        if (action.click) {
            mouseX = action.click.x;
            mouseY = action.click.y;
            mouseDown = true;
        }

        await new Promise(r => setTimeout(r, durationMs));

        if (action.keys) {
            for (const key of action.keys) {
                keys[key.toLowerCase()] = false;
            }
        }
        mouseDown = false;
        gamePaused = true;
    },

    getState: () => ({
        gameState,
        gameTime,
        globalInfection,
        currentSector,
        sectorPowered: SECTORS[currentSector].powered,
        player: {
            x: player.x,
            y: player.y,
            health: player.health,
            hunger: player.hunger,
            thirst: player.thirst,
            fatigue: player.fatigue,
            infection: player.infection,
            hasKeycard: player.hasRedKeycard,
            weapon: player.weapon.name,
            inventoryCount: player.inventory.length
        },
        enemies: enemies.filter(e => e.hp > 0).map(e => ({
            type: e.type,
            x: e.x,
            y: e.y,
            hp: e.hp,
            state: e.state
        })),
        items: items.map(i => ({ type: i.type, x: i.x, y: i.y })),
        containers: containers.filter(c => !c.looted).length,
        camera: { x: cameraX, y: cameraY },
        power: { used: powerUsed, capacity: powerCapacity },
        stats: {
            enemiesKilled: 0, // Would track separately
            sectorsVisited: Object.values(sectorStates).filter(s => s.visited).length
        }
    }),

    getPhase: () => gameState,

    debug: {
        setHealth: (hp) => { player.health = hp; },
        forceStart: () => {
            if (gameState === 'menu') {
                startGame();
            } else {
                restartGame();
            }
        },
        clearEnemies: () => { enemies = []; },
        teleport: (sector) => {
            if (SECTORS[sector]) {
                transitionToSector(sector, 'south');
            }
        },
        giveKeycard: () => { player.hasRedKeycard = true; },
        powerAll: () => {
            for (const key in SECTORS) {
                SECTORS[key].powered = true;
            }
        }
    }
};
