// DERELICT - Survival Horror Clone
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Colors matching reference style
const COLORS = {
    BG: '#0a0808',
    FLOOR: '#2a2a2a',
    FLOOR_ALT: '#252525',
    WALL: '#1a1a1a',
    WALL_LIGHT: '#3a3a3a',
    DOOR: '#4a4040',
    PLAYER: '#6a8a8a',
    CRAWLER: '#8a6a4a',
    SHAMBLER: '#6a8a6a',
    BLOOD: '#6a2020',
    O2_ITEM: '#4080cc',
    MEDKIT: '#40aa60',
    HAZARD: '#aa4040',
    TEXT: '#cccccc',
    O2_BAR: '#4080cc',
    HP_BAR: '#cc4040',
    WARNING: '#cc6040'
};

// Game state
const game = {
    state: 'playing',
    sector: 1,
    time: 0,
    integrity: 100,
    messages: [],
    startTime: Date.now()
};

// Spaceship escape phase
const spaceship = {
    x: 100,
    y: GAME_HEIGHT / 2,
    speed: 200,
    hp: 3,
    distance: 0,
    targetDistance: 1000,
    asteroids: [],
    stars: [],
    spawnTimer: 0
};

// Stats tracking
const stats = {
    killCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    critCount: 0,
    itemsPickedUp: 0,
    attacksMade: 0
};


// Visual effects
let damageFlashAlpha = 0;
let lowHealthPulse = 0;
let screenShake = { x: 0, y: 0, intensity: 0 };
let floatingTexts = [];
let particles = [];

// Debug mode
let debugMode = false;

// Player
const player = {
    x: 400,
    y: 400,
    angle: 0,
    speed: 120,
    runSpeed: 200,
    radius: 12,
    hp: 100,
    maxHp: 100,
    o2: 100,
    maxO2: 100,
    flashlightOn: true,
    flashlightBattery: 60,
    maxFlashlightBattery: 60,
    isRunning: false,
    weapon: 'pipe',
    lastAttack: 0,
    attackCooldown: 600,
    inventory: ['pipe'], // Start with pipe
    grenades: 0,
    flares: 0,
    stimpackTimer: 0
};

// Weapons
const weapons = {
    // Melee
    pipe: { damage: 20, range: 45, speed: 1.0, durability: 15, type: 'melee' },
    wrench: { damage: 25, range: 50, speed: 0.8, durability: 25, type: 'melee' },
    fireAxe: { damage: 40, range: 55, speed: 0.6, durability: 20, type: 'melee' },
    stunBaton: { damage: 15, range: 40, speed: 1.2, durability: 30, type: 'melee', stun: 2 },
    // Ranged
    pistol: { damage: 25, range: 400, speed: 2.0, ammoType: '9mm', magSize: 12, type: 'ranged' },
    revolver: { damage: 45, range: 450, speed: 0.8, ammoType: '.44', magSize: 6, type: 'ranged' },
    crossbow: { damage: 35, range: 500, speed: 0.5, ammoType: 'bolts', magSize: 1, type: 'ranged', silent: true }
};

// Ammo
const ammo = {
    '9mm': 0,
    '.44': 0,
    'bolts': 0
};

// Projectiles
let projectiles = [];

// Enemies
let enemies = [];
const enemyTypes = {
    crawler: { hp: 30, damage: 15, speed: 80, range: 250, color: COLORS.CRAWLER, size: 14 },
    shambler: { hp: 60, damage: 25, speed: 50, range: 200, color: COLORS.SHAMBLER, size: 16 },
    stalker: { hp: 45, damage: 20, speed: 150, range: 350, color: '#4a4a6a', size: 12, invisible: true },
    bloater: { hp: 100, damage: 10, speed: 40, range: 150, color: '#6a6a4a', size: 20, explodes: true },
    hunter: { hp: 80, damage: 35, speed: 180, range: 500, color: '#8a4a4a', size: 18, persistent: true },
    mimic: { hp: 50, damage: 30, speed: 100, range: 80, color: '#5a5a5a', size: 14, disguised: true }
};

// Map and objects
let map = [];
let doors = [];
let items = [];
let bloodStains = [];
let corpses = [];

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Camera
const camera = { x: 0, y: 0 };

// O2 drain rates (per second)
const O2_DRAIN = {
    idle: 0.5,
    walking: 0.67,
    running: 1.33,
    combat: 2
};

// Initialize
function init() {
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnItems();
    setupInput();
    addMessage("SYSTEM: Wake up. Your oxygen is depleting.");
    addMessage("SYSTEM: Find the escape pod. Survive.");
    requestAnimationFrame(gameLoop);
}

function generateMap() {
    // Initialize with walls
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = 1;
        }
    }

    // Generate rooms
    const rooms = [];
    const numRooms = 12 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numRooms; i++) {
        const w = 4 + Math.floor(Math.random() * 5);
        const h = 4 + Math.floor(Math.random() * 4);
        const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
        const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

        // Carve room
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                map[ry][rx] = 0;
            }
        }

        rooms.push({ x: x + w/2, y: y + h/2, w, h });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const prev = rooms[i - 1];
        const curr = rooms[i];

        let cx = Math.floor(prev.x);
        let cy = Math.floor(prev.y);
        const tx = Math.floor(curr.x);
        const ty = Math.floor(curr.y);

        while (cx !== tx) {
            if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) {
                map[cy][cx] = 0;
            }
            cx += cx < tx ? 1 : -1;
        }
        while (cy !== ty) {
            if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) {
                map[cy][cx] = 0;
            }
            cy += cy < ty ? 1 : -1;
        }
    }

    // Add doors
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            if (map[y][x] === 0) {
                const horizontal = map[y][x-1] === 1 && map[y][x+1] === 1;
                const vertical = map[y-1][x] === 1 && map[y+1][x] === 1;

                if ((horizontal || vertical) && Math.random() < 0.1) {
                    doors.push({
                        x: x * TILE_SIZE + TILE_SIZE/2,
                        y: y * TILE_SIZE + TILE_SIZE/2,
                        open: false,
                        locked: Math.random() < 0.2,
                        tx: x,
                        ty: y
                    });
                }
            }
        }
    }

    // Mark exit
    const lastRoom = rooms[rooms.length - 1];
    game.exitX = Math.floor(lastRoom.x) * TILE_SIZE;
    game.exitY = Math.floor(lastRoom.y) * TILE_SIZE;

    // Add blood stains for atmosphere
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x] === 0) {
            bloodStains.push({
                x: x * TILE_SIZE + Math.random() * TILE_SIZE,
                y: y * TILE_SIZE + Math.random() * TILE_SIZE,
                size: 5 + Math.random() * 15
            });
        }
    }
}

function spawnPlayer() {
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            if (map[y][x] === 0) {
                player.x = x * TILE_SIZE + TILE_SIZE / 2;
                player.y = y * TILE_SIZE + TILE_SIZE / 2;
                return;
            }
        }
    }
}

function spawnEnemies() {
    enemies = [];
    const count = 6 + game.sector * 2;

    // Enemy type weights based on sector
    const getEnemyType = () => {
        const roll = Math.random();
        if (game.sector >= 5 && roll < 0.15) return 'hunter';
        if (game.sector >= 4 && roll < 0.2) return 'bloater';
        if (game.sector >= 3 && roll < 0.25) return 'stalker';
        if (game.sector >= 6 && roll < 0.1) return 'mimic';
        return roll < 0.7 ? 'crawler' : 'shambler';
    };

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);

            if (map[y][x] === 0) {
                const dist = Math.hypot(x * TILE_SIZE - player.x, y * TILE_SIZE - player.y);
                if (dist > 250) {
                    const type = getEnemyType();
                    const data = enemyTypes[type];

                    enemies.push({
                        x: x * TILE_SIZE + TILE_SIZE / 2,
                        y: y * TILE_SIZE + TILE_SIZE / 2,
                        type: type,
                        hp: data.hp,
                        maxHp: data.hp,
                        speed: data.speed,
                        damage: data.damage,
                        range: data.range,
                        color: data.color,
                        size: data.size,
                        state: data.disguised ? 'disguised' : 'patrol',
                        angle: Math.random() * Math.PI * 2,
                        alertTimer: 0,
                        lastAttack: 0,
                        patrolTarget: null,
                        invisible: data.invisible || false,
                        isMoving: false,
                        stunTimer: 0,
                        explodes: data.explodes || false,
                        persistent: data.persistent || false,
                        disguised: data.disguised || false
                    });
                    break;
                }
            }
            attempts++;
        }
    }
}

function spawnItems() {
    items = [];
    const count = 8 + game.sector;

    const itemTypes = [
        { type: 'o2_small', name: 'O2 Canister (S)', color: COLORS.O2_BAR, o2: 25, weight: 25 },
        { type: 'o2_large', name: 'O2 Canister (L)', color: COLORS.O2_BAR, o2: 50, weight: 10 },
        { type: 'medkit_small', name: 'Medkit (S)', color: COLORS.MEDKIT, hp: 30, weight: 20 },
        { type: 'medkit_large', name: 'Medkit (L)', color: COLORS.MEDKIT, hp: 60, weight: 8 },
        { type: 'ammo_9mm', name: '9mm Ammo', color: '#aa8844', ammo: { type: '9mm', amount: 12 }, weight: 15 },
        { type: 'ammo_44', name: '.44 Ammo', color: '#aa6644', ammo: { type: '.44', amount: 6 }, weight: 8 },
        { type: 'ammo_bolts', name: 'Crossbow Bolts', color: '#8888aa', ammo: { type: 'bolts', amount: 4 }, weight: 5 },
        { type: 'stimpack', name: 'Stimpack', color: '#44aaaa', stimpack: true, weight: 3 },
        { type: 'flare', name: 'Flare', color: '#ff8844', flare: true, weight: 5 },
        { type: 'frag', name: 'Frag Grenade', color: '#886644', grenade: true, weight: 2 }
    ];

    // Weighted selection
    const totalWeight = itemTypes.reduce((sum, it) => sum + it.weight, 0);
    const selectItem = () => {
        let roll = Math.random() * totalWeight;
        for (const it of itemTypes) {
            roll -= it.weight;
            if (roll <= 0) return it;
        }
        return itemTypes[0];
    };

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);

            if (map[y][x] === 0) {
                const itemData = selectItem();
                items.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    type: itemData.type,
                    name: itemData.name,
                    color: itemData.color,
                    o2: itemData.o2,
                    hp: itemData.hp,
                    ammo: itemData.ammo,
                    stimpack: itemData.stimpack,
                    flare: itemData.flare,
                    grenade: itemData.grenade
                });
                break;
            }
            attempts++;
        }
    }

    // Spawn weapon pickup in first few rooms (rare)
    if (Math.random() < 0.3) {
        const weaponTypes = ['pistol', 'crossbow', 'fireAxe'];
        const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (map[y][x] === 0) {
                items.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    type: 'weapon',
                    name: weaponType.charAt(0).toUpperCase() + weaponType.slice(1),
                    color: '#aaaaaa',
                    weapon: weaponType
                });
                break;
            }
        }
    }
}

function setupInput() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'f') player.flashlightOn = !player.flashlightOn;
        if (e.key === 'e') interact();
        if (e.key === 'q') debugMode = !debugMode;
        if (e.key === 'r') reload();
        if (e.key === 'g') throwGrenade();
        // Weapon switching 1-4
        if (e.key === '1' && player.inventory.includes('pipe')) player.weapon = 'pipe';
        if (e.key === '2' && player.inventory.includes('wrench')) player.weapon = 'wrench';
        if (e.key === '3' && player.inventory.includes('pistol')) player.weapon = 'pistol';
        if (e.key === '4' && player.inventory.includes('crossbow')) player.weapon = 'crossbow';
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            mouse.down = true;
            attack();
        }
    });

    canvas.addEventListener('mouseup', () => mouse.down = false);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function addMessage(text) {
    game.messages.unshift({ text, time: game.time });
    if (game.messages.length > 4) game.messages.pop();
}

let lastTime = 0;
function gameLoop(currentTime) {
    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (game.state === 'playing') {
        update(delta);
    } else if (game.state === 'spaceship') {
        updateSpaceship(delta);
    }

    render();
    requestAnimationFrame(gameLoop);
}

function update(delta) {
    game.time += delta;

    updatePlayer(delta);
    updateEnemies(delta);
    updateProjectiles(delta);
    updateVisualEffects(delta);
    updateFloatingTexts(delta);
    updateParticles(delta);

    // Ship integrity decay
    game.integrity = Math.max(0, game.integrity - 0.02 * delta);
    if (game.integrity <= 0) {
        game.state = 'gameover';
        addMessage("The ship tears itself apart around you.");
    }

    // Escape pod reached - start spaceship phase
    const distToExit = Math.hypot(player.x - game.exitX, player.y - game.exitY);
    if (distToExit < 40) {
        game.state = 'spaceship';
        initSpaceship();
        addMessage("ESCAPED! Launching escape pod...");
    }

    // Death checks
    if (player.o2 <= 0) {
        game.state = 'gameover';
        addMessage("Your lungs burned for oxygen that never came.");
    }
    if (player.hp <= 0) {
        game.state = 'gameover';
        addMessage("Your body joins the ship's other victims.");
    }
}

function updatePlayer(delta) {
    // Stimpack timer
    if (player.stimpackTimer > 0) {
        player.stimpackTimer -= delta;
    }

    // Aim angle
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Movement
    player.isRunning = keys['shift'];
    const stimBonus = player.stimpackTimer > 0 ? 1.5 : 1.0;
    const speed = (player.isRunning ? player.runSpeed : player.speed) * stimBonus;

    let dx = 0, dy = 0;
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;

    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        const newX = player.x + dx * speed * delta;
        const newY = player.y + dy * speed * delta;

        if (!checkCollision(newX, player.y, player.radius)) player.x = newX;
        if (!checkCollision(player.x, newY, player.radius)) player.y = newY;
    }

    // O2 drain
    let drainRate = O2_DRAIN.idle;
    if (isMoving) {
        drainRate = player.isRunning ? O2_DRAIN.running : O2_DRAIN.walking;
    }
    player.o2 = Math.max(0, player.o2 - drainRate * delta);

    // Flashlight battery
    if (player.flashlightOn) {
        player.flashlightBattery = Math.max(0, player.flashlightBattery - delta);
        if (player.flashlightBattery <= 0) {
            player.flashlightOn = false;
        }
    } else {
        player.flashlightBattery = Math.min(player.maxFlashlightBattery, player.flashlightBattery + 0.5 * delta);
    }

    // Camera
    camera.x = player.x - GAME_WIDTH / 2;
    camera.y = player.y - GAME_HEIGHT / 2;
}

function checkCollision(x, y, radius) {
    const minTX = Math.floor((x - radius) / TILE_SIZE);
    const maxTX = Math.floor((x + radius) / TILE_SIZE);
    const minTY = Math.floor((y - radius) / TILE_SIZE);
    const maxTY = Math.floor((y + radius) / TILE_SIZE);

    for (let ty = minTY; ty <= maxTY; ty++) {
        for (let tx = minTX; tx <= maxTX; tx++) {
            if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH) return true;
            if (map[ty][tx] === 1) return true;
        }
    }

    for (const door of doors) {
        if (!door.open) {
            const dist = Math.hypot(x - door.x, y - door.y);
            if (dist < radius + 16) return true;
        }
    }

    return false;
}

function attack() {
    const now = performance.now();
    const weapon = weapons[player.weapon];
    const cooldown = player.attackCooldown / weapon.speed;
    if (now - player.lastAttack < cooldown) return;

    player.lastAttack = now;
    player.o2 = Math.max(0, player.o2 - 2); // Combat O2 cost
    stats.attacksMade++;

    if (weapon.type === 'ranged') {
        // Ranged attack - fire projectile
        const ammoType = weapon.ammoType;
        if (ammo[ammoType] <= 0) {
            addMessage("Out of ammo!");
            return;
        }
        ammo[ammoType]--;

        const speed = 500;
        projectiles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(player.angle) * speed,
            vy: Math.sin(player.angle) * speed,
            type: 'bullet',
            damage: weapon.damage,
            fromPlayer: true,
            range: weapon.range,
            distTraveled: 0,
            silent: weapon.silent || false
        });

        // Muzzle flash
        particles.push({
            x: player.x + Math.cos(player.angle) * 25,
            y: player.y + Math.sin(player.angle) * 25,
            vx: Math.cos(player.angle) * 50,
            vy: Math.sin(player.angle) * 50,
            life: 0.08,
            maxLife: 0.08,
            color: '#ffff44',
            size: 8
        });

        if (!weapon.silent) {
            // Alert nearby enemies
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < 400) {
                    enemy.state = 'alert';
                    enemy.alertTimer = 10;
                }
            }
        }
    } else {
        // Melee attack
        const attackX = player.x + Math.cos(player.angle) * weapon.range;
        const attackY = player.y + Math.sin(player.angle) * weapon.range;

        // Attack visual effect
        particles.push({
            x: attackX,
            y: attackY,
            vx: 0,
            vy: 0,
            life: 0.1,
            maxLife: 0.1,
            color: '#ffffff',
            size: 15
        });

        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.hypot(attackX - enemy.x, attackY - enemy.y);
            if (dist < enemy.size + 20) {
                damageEnemy(enemy, weapon.damage);
                // Stun if weapon has stun property
                if (weapon.stun) {
                    enemy.stunTimer = weapon.stun;
                    createFloatingText(enemy.x, enemy.y - 30, 'STUNNED', '#44aaff', 12);
                }
            }
        }
    }
}

function damageEnemy(enemy, damage) {
    // Critical hit system (15% chance, 2x damage)
    const isCrit = Math.random() < 0.15;
    if (isCrit) {
        damage *= 2;
        stats.critCount++;
    }

    enemy.hp -= damage;
    enemy.state = 'alert';
    enemy.alertTimer = 10;

    stats.totalDamageDealt += damage;

    // Floating damage number
    createFloatingText(
        enemy.x, enemy.y - 20,
        damage.toString() + (isCrit ? '!' : ''),
        isCrit ? '#ffff00' : '#ff4444',
        isCrit ? 18 : 14
    );

    // Screen shake
    triggerScreenShake(isCrit ? 6 : 3);

    // Blood splash (more for crits)
    const bloodCount = isCrit ? 6 : 3;
    for (let i = 0; i < bloodCount; i++) {
        bloodStains.push({
            x: enemy.x + (Math.random() - 0.5) * 30,
            y: enemy.y + (Math.random() - 0.5) * 30,
            size: 3 + Math.random() * 8
        });
        // Blood particles
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.5,
            maxLife: 0.5,
            color: COLORS.BLOOD,
            size: 4
        });
    }

    if (enemy.hp <= 0) {
        killEnemy(enemy, isCrit);
    }
}

function killEnemy(enemy, wasCrit) {
    stats.killCount++;

    // Bloater explosion on death
    if (enemy.explodes) {
        explode(enemy.x, enemy.y, 40, 100, false);
        addMessage("BLOATER EXPLODED!");
    }

    // Death burst particles
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 80,
            life: 0.6,
            maxLife: 0.6,
            color: enemy.color,
            size: 5
        });
    }

    triggerScreenShake(8);
    corpses.push({ x: enemy.x, y: enemy.y, type: enemy.type, color: enemy.color });

    // Hunter drops better loot
    if (enemy.type === 'hunter' && Math.random() < 0.5) {
        items.push({
            x: enemy.x,
            y: enemy.y,
            type: 'medkit_large',
            name: 'Medkit (L)',
            color: COLORS.MEDKIT,
            hp: 60
        });
    }

    addMessage("Enemy killed." + (wasCrit ? " CRITICAL!" : ""));
}

function interact() {
    // Doors
    for (const door of doors) {
        const dist = Math.hypot(player.x - door.x, player.y - door.y);
        if (dist < 50) {
            if (door.locked) {
                addMessage("Door is locked.");
            } else {
                door.open = !door.open;
            }
            return;
        }
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < 40) {
            pickupItem(item, i);
            return;
        }
    }
}

function pickupItem(item, index) {
    stats.itemsPickedUp++;

    if (item.o2) {
        player.o2 = Math.min(player.maxO2, player.o2 + item.o2);
        addMessage("Used: " + item.name + " (+" + item.o2 + " O2)");
        createFloatingText(item.x, item.y - 20, '+' + item.o2 + ' O2', '#4080cc', 14);
        spawnPickupParticles(item.x, item.y, '#4080cc');
    } else if (item.hp) {
        player.hp = Math.min(player.maxHp, player.hp + item.hp);
        addMessage("Used: " + item.name + " (+" + item.hp + " HP)");
        createFloatingText(item.x, item.y - 20, '+' + item.hp + ' HP', '#40aa60', 14);
        spawnPickupParticles(item.x, item.y, '#40aa60');
    } else if (item.ammo) {
        ammo[item.ammo.type] += item.ammo.amount;
        addMessage("Picked up: " + item.name + " (+" + item.ammo.amount + ")");
        createFloatingText(item.x, item.y - 20, '+' + item.ammo.amount + ' ammo', '#aa8844', 14);
        spawnPickupParticles(item.x, item.y, '#aa8844');
    } else if (item.weapon) {
        if (!player.inventory.includes(item.weapon)) {
            player.inventory.push(item.weapon);
            player.weapon = item.weapon;
            addMessage("Acquired: " + item.name);
            createFloatingText(item.x, item.y - 20, 'NEW WEAPON!', '#ffaa00', 16);
            spawnPickupParticles(item.x, item.y, '#ffaa00');
        } else {
            addMessage("Already have " + item.name);
            return; // Don't remove item
        }
    } else if (item.stimpack) {
        player.stimpackTimer = 15; // 15 seconds of speed boost
        addMessage("Used: Stimpack (+50% speed for 15s)");
        createFloatingText(item.x, item.y - 20, 'SPEED BOOST!', '#44aaaa', 14);
        spawnPickupParticles(item.x, item.y, '#44aaaa');
    } else if (item.flare) {
        player.flares = (player.flares || 0) + 1;
        addMessage("Picked up: Flare (Press V to use)");
        createFloatingText(item.x, item.y - 20, '+1 FLARE', '#ff8844', 14);
        spawnPickupParticles(item.x, item.y, '#ff8844');
    } else if (item.grenade) {
        player.grenades = (player.grenades || 0) + 1;
        addMessage("Picked up: Frag Grenade (Press G to throw)");
        createFloatingText(item.x, item.y - 20, '+1 GRENADE', '#886644', 14);
        spawnPickupParticles(item.x, item.y, '#886644');
    }

    // Pickup sparkle
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particles.push({
            x: item.x,
            y: item.y,
            vx: Math.cos(angle) * 50,
            vy: Math.sin(angle) * 50,
            life: 0.4,
            maxLife: 0.4,
            color: '#ffff80',
            size: 3
        });
    }

    items.splice(index, 1);
}

function spawnPickupParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 30,
            vy: -40 - Math.random() * 30,
            life: 0.6,
            maxLife: 0.6,
            color: color,
            size: 4
        });
    }
}

function reload() {
    const weapon = weapons[player.weapon];
    if (weapon && weapon.type === 'ranged') {
        addMessage("Reloading...");
    }
}

function throwGrenade() {
    if (!player.grenades || player.grenades <= 0) {
        addMessage("No grenades!");
        return;
    }
    player.grenades--;

    const angle = player.angle;
    const speed = 300;
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 'grenade',
        damage: 60,
        radius: 120,
        fuseTime: 2.0,
        fromPlayer: true
    });
    addMessage("Grenade thrown!");
}

function updateEnemies(delta) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        // Stun check
        if (enemy.stunTimer > 0) {
            enemy.stunTimer -= delta;
            continue;
        }

        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // Check if enemy can see player
        const canSee = distToPlayer < enemy.range;
        const canHear = player.isRunning && distToPlayer < enemy.range * 1.5;

        // Stalker invisibility tracking
        enemy.isMoving = false;

        // Mimic handling - disguised state
        if (enemy.disguised && enemy.state === 'disguised') {
            if (distToPlayer < 80) {
                enemy.state = 'chase';
                enemy.disguised = false;
                addMessage("IT'S A MIMIC!");
                triggerScreenShake(5);
            }
            continue; // Don't move while disguised
        }

        switch (enemy.state) {
            case 'patrol':
                if (canSee || canHear) {
                    enemy.state = 'chase';
                    if (enemy.type !== 'stalker') { // Stalkers are silent
                        addMessage("Something noticed you...");
                    }
                } else {
                    if (!enemy.patrolTarget || Math.random() < 0.005) {
                        enemy.patrolTarget = {
                            x: enemy.x + (Math.random() - 0.5) * 150,
                            y: enemy.y + (Math.random() - 0.5) * 150
                        };
                    }
                    moveEnemy(enemy, enemy.patrolTarget.x, enemy.patrolTarget.y, delta * 0.5);
                }
                break;

            case 'chase':
            case 'alert':
                if (distToPlayer < 40) {
                    // Attack
                    const now = performance.now();
                    const attackRate = enemy.type === 'stalker' ? 800 : 1200;
                    if (now - enemy.lastAttack > attackRate) {
                        enemy.lastAttack = now;
                        damagePlayer(enemy.damage);
                        addMessage("Attacked! -" + enemy.damage + " HP");
                    }
                } else if (distToPlayer < enemy.range * 1.5 || enemy.persistent) {
                    // Hunters (persistent) never give up
                    moveEnemy(enemy, player.x, player.y, delta);
                    enemy.isMoving = true;
                } else {
                    enemy.alertTimer -= delta;
                    if (enemy.alertTimer <= 0 && !enemy.persistent) {
                        enemy.state = 'patrol';
                    }
                }
                break;
        }
    }

    // Remove dead enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
            enemies.splice(i, 1);
        }
    }
}

function moveEnemy(enemy, targetX, targetY, delta) {
    const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    enemy.angle = angle;

    const newX = enemy.x + Math.cos(angle) * enemy.speed * delta;
    const newY = enemy.y + Math.sin(angle) * enemy.speed * delta;

    if (!checkCollision(newX, enemy.y, enemy.size)) enemy.x = newX;
    if (!checkCollision(enemy.x, newY, enemy.size)) enemy.y = newY;
}

// Helper functions for visual effects
function damagePlayer(damage) {
    player.hp -= damage;
    stats.totalDamageTaken += damage;

    // Damage flash
    damageFlashAlpha = 0.4;

    // Screen shake
    triggerScreenShake(5);

    // Blood particles
    for (let i = 0; i < 4; i++) {
        bloodStains.push({
            x: player.x + (Math.random() - 0.5) * 30,
            y: player.y + (Math.random() - 0.5) * 30,
            size: 4 + Math.random() * 8
        });
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.4,
            maxLife: 0.4,
            color: COLORS.BLOOD,
            size: 5
        });
    }

    // Floating damage text
    createFloatingText(player.x, player.y - 30, '-' + damage, '#ff4444', 14);
}

function createFloatingText(x, y, text, color, size) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        life: 1.0,
        maxLife: 1.0,
        vy: -30
    });
}

function triggerScreenShake(intensity) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

function updateVisualEffects(delta) {
    // Damage flash decay
    if (damageFlashAlpha > 0) {
        damageFlashAlpha = Math.max(0, damageFlashAlpha - delta * 2);
    }

    // Low health pulsing
    if (player.hp < 30) {
        lowHealthPulse += delta * 4;
    }

    // Screen shake decay
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity = Math.max(0, screenShake.intensity - delta * 30);
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }

}

function updateFloatingTexts(delta) {
    floatingTexts = floatingTexts.filter(ft => {
        ft.life -= delta;
        ft.y += ft.vy * delta;
        return ft.life > 0;
    });
}

function updateParticles(delta) {
    particles = particles.filter(p => {
        p.life -= delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        return p.life > 0;
    });
}

function updateProjectiles(delta) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        // Move projectile
        const moveX = proj.vx * delta;
        const moveY = proj.vy * delta;
        proj.x += moveX;
        proj.y += moveY;
        proj.distTraveled = (proj.distTraveled || 0) + Math.hypot(moveX, moveY);

        // Grenade handling
        if (proj.type === 'grenade') {
            proj.fuseTime -= delta;
            proj.vx *= 0.95; // Slow down
            proj.vy *= 0.95;

            if (proj.fuseTime <= 0) {
                // Explode!
                explode(proj.x, proj.y, proj.damage, proj.radius, proj.fromPlayer);
                projectiles.splice(i, 1);
                continue;
            }
        }

        // Check wall collision
        const tx = Math.floor(proj.x / TILE_SIZE);
        const ty = Math.floor(proj.y / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT || map[ty][tx] === 1) {
            // Hit wall - spawn sparks
            for (let j = 0; j < 3; j++) {
                particles.push({
                    x: proj.x,
                    y: proj.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 0.2,
                    maxLife: 0.2,
                    color: '#ffaa44',
                    size: 2
                });
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Check range limit
        if (proj.range && proj.distTraveled > proj.range) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check enemy collision (player projectiles)
        if (proj.fromPlayer && proj.type === 'bullet') {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                if (dist < enemy.size + 5) {
                    damageEnemy(enemy, proj.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // Check player collision (enemy projectiles)
        if (!proj.fromPlayer) {
            const dist = Math.hypot(proj.x - player.x, proj.y - player.y);
            if (dist < player.radius + 5) {
                damagePlayer(proj.damage);
                projectiles.splice(i, 1);
            }
        }
    }
}

function explode(x, y, damage, radius, fromPlayer) {
    // Visual explosion
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 100 + Math.random() * 100;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5,
            maxLife: 0.5,
            color: i % 2 === 0 ? '#ff8844' : '#ffaa00',
            size: 6
        });
    }

    triggerScreenShake(15);

    // Damage enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.hypot(x - enemy.x, y - enemy.y);
        if (dist < radius) {
            const falloff = 1 - (dist / radius);
            damageEnemy(enemy, Math.floor(damage * falloff));
        }
    }

    // Damage player if from enemy
    if (!fromPlayer) {
        const distToPlayer = Math.hypot(x - player.x, y - player.y);
        if (distToPlayer < radius) {
            const falloff = 1 - (distToPlayer / radius);
            damagePlayer(Math.floor(damage * falloff));
        }
    }
}

function render() {
    // Handle spaceship phase rendering separately
    if (game.state === 'spaceship') {
        renderSpaceship();
        return;
    }

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    // Apply screen shake
    ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

    // Render map
    renderMap();

    // Blood stains
    ctx.fillStyle = COLORS.BLOOD;
    for (const blood of bloodStains) {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(blood.x, blood.y, blood.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Items
    for (const item of items) {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x - 8, item.y - 8, 16, 16);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(item.x - 8, item.y - 8, 16, 16);
    }

    // Doors
    for (const door of doors) {
        if (!door.open) {
            ctx.fillStyle = door.locked ? '#6a4040' : COLORS.DOOR;
            ctx.fillRect(door.x - 16, door.y - 16, 32, 32);
        }
    }

    // Corpses
    for (const corpse of corpses) {
        ctx.fillStyle = corpse.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(corpse.x, corpse.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Enemies - always render, lighting handles visibility
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        // Stalker invisibility - only visible when moving
        if (enemy.invisible && !enemy.isMoving && enemy.state === 'patrol') {
            ctx.globalAlpha = 0.1;
        } else if (enemy.invisible && !enemy.isMoving) {
            ctx.globalAlpha = 0.3;
        }

        // Mimic disguised as item
        if (enemy.disguised && enemy.state === 'disguised') {
            ctx.fillStyle = COLORS.O2_BAR;
            ctx.fillRect(enemy.x - 8, enemy.y - 8, 16, 16);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(enemy.x - 8, enemy.y - 8, 16, 16);
            ctx.globalAlpha = 1;
            continue;
        }

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        // Enemy body with bright outline for visibility
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.fillStyle = enemy.color;

        if (enemy.type === 'crawler') {
            ctx.fillRect(-enemy.size, -enemy.size * 0.5, enemy.size * 2, enemy.size);
            ctx.strokeRect(-enemy.size, -enemy.size * 0.5, enemy.size * 2, enemy.size);
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(-enemy.size * 0.4, -enemy.size * 0.1, 3, 0, Math.PI * 2);
            ctx.arc(enemy.size * 0.4, -enemy.size * 0.1, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === 'stalker') {
            // Thin, elongated stalker
            ctx.fillRect(-enemy.size * 0.5, -enemy.size, enemy.size, enemy.size * 2);
            ctx.strokeRect(-enemy.size * 0.5, -enemy.size, enemy.size, enemy.size * 2);
            ctx.fillStyle = '#aa44ff'; // Purple eyes
            ctx.beginPath();
            ctx.arc(0, -enemy.size * 0.5, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === 'bloater') {
            // Bloated, swollen shape
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Pustules
            ctx.fillStyle = '#aaaa44';
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * enemy.size * 0.5, Math.sin(angle) * enemy.size * 0.5, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (enemy.type === 'hunter') {
            // Large, muscular hunter
            ctx.fillRect(-enemy.size, -enemy.size * 0.8, enemy.size * 2, enemy.size * 1.6);
            ctx.strokeRect(-enemy.size, -enemy.size * 0.8, enemy.size * 2, enemy.size * 1.6);
            ctx.fillStyle = '#ff0000'; // Bright red eyes
            ctx.beginPath();
            ctx.arc(-enemy.size * 0.5, -enemy.size * 0.3, 4, 0, Math.PI * 2);
            ctx.arc(enemy.size * 0.5, -enemy.size * 0.3, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Shambler (default)
            ctx.fillRect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2);
            ctx.strokeRect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2);
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(-enemy.size * 0.4, -enemy.size * 0.4, 4, 0, Math.PI * 2);
            ctx.arc(enemy.size * 0.4, -enemy.size * 0.4, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1;

        // Stun indicator
        if (enemy.stunTimer > 0) {
            ctx.fillStyle = '#44aaff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('*STUNNED*', enemy.x, enemy.y - enemy.size - 15);
            ctx.textAlign = 'left';
        }

        // Health bar (always visible for damaged enemies)
        if (enemy.hp < enemy.maxHp) {
            const barW = enemy.size * 2;
            ctx.fillStyle = '#400000';
            ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size - 10, barW, 5);
            ctx.fillStyle = COLORS.HP_BAR;
            ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size - 10, barW * (enemy.hp / enemy.maxHp), 5);
        }
    }

    // Projectiles
    for (const proj of projectiles) {
        if (proj.type === 'bullet') {
            ctx.fillStyle = '#ffff44';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'grenade') {
            ctx.fillStyle = '#886644';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#aa8866';
            ctx.stroke();
            // Fuse spark
            if (proj.fuseTime < 1) {
                ctx.fillStyle = '#ff4400';
                ctx.beginPath();
                ctx.arc(proj.x, proj.y - 8, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(-10, -8, 20, 16);

    // Visor
    ctx.fillStyle = '#40aa60';
    ctx.fillRect(5, -3, 6, 6);

    // Weapon
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(10, -2, 10, 4);

    ctx.restore();

    // Exit marker
    ctx.fillStyle = '#40aa40';
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(game.time * 3);
    ctx.fillRect(game.exitX - 20, game.exitY - 20, 40, 40);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#60cc60';
    ctx.font = '10px monospace';
    ctx.fillText('ESCAPE', game.exitX - 20, game.exitY + 4);

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating texts (world space)
    for (const ft of floatingTexts) {
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    // Vision cone / darkness
    renderLighting();

    ctx.restore();

    // UI
    renderUI();
}

function renderMap() {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(MAP_WIDTH, Math.ceil((camera.x + GAME_WIDTH) / TILE_SIZE) + 1);
    const endY = Math.min(MAP_HEIGHT, Math.ceil((camera.y + GAME_HEIGHT) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile === 0) {
                ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.FLOOR : COLORS.FLOOR_ALT;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Grid pattern
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.WALL_LIGHT;
                ctx.fillRect(px, py, TILE_SIZE, 3);
                ctx.fillRect(px, py, 3, TILE_SIZE);
            }
        }
    }
}

function isInVisionCone(x, y) {
    const dist = Math.hypot(x - player.x, y - player.y);
    const angle = Math.atan2(y - player.y, x - player.x);
    const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

    // Sync with renderLighting values
    const maxRange = player.flashlightOn ? 600 : 180;
    const coneAngle = Math.PI / 2.5; // ~72 degrees half-angle

    return dist < maxRange && angleDiff < coneAngle;
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function renderMinimap() {
    const mapX = GAME_WIDTH - 120;
    const mapY = GAME_HEIGHT - 120;
    const mapSize = 100;
    const scale = mapSize / (MAP_WIDTH * TILE_SIZE);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);

    // Draw map tiles (simplified)
    ctx.fillStyle = '#333333';
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x] === 0) {
                const px = mapX + x * TILE_SIZE * scale;
                const py = mapY + y * TILE_SIZE * scale;
                ctx.fillRect(px, py, TILE_SIZE * scale, TILE_SIZE * scale);
            }
        }
    }

    // Draw enemies
    ctx.fillStyle = '#ff4444';
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const ex = mapX + enemy.x * scale;
        const ey = mapY + enemy.y * scale;
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
    }

    // Draw items
    ctx.fillStyle = '#44ff44';
    for (const item of items) {
        const ix = mapX + item.x * scale;
        const iy = mapY + item.y * scale;
        ctx.fillRect(ix - 1, iy - 1, 2, 2);
    }

    // Draw exit
    ctx.fillStyle = '#44ff44';
    const exitX = mapX + game.exitX * scale;
    const exitY = mapY + game.exitY * scale;
    ctx.fillRect(exitX - 3, exitY - 3, 6, 6);

    // Draw player
    ctx.fillStyle = '#4488ff';
    const px = mapX + player.x * scale;
    const py = mapY + player.y * scale;
    ctx.fillRect(px - 2, py - 2, 5, 5);

    // Draw vision cone direction
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(player.angle) * 10, py + Math.sin(player.angle) * 10);
    ctx.stroke();

    // Border
    ctx.strokeStyle = '#666666';
    ctx.strokeRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);

    // Label
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.fillText('MINIMAP', mapX, mapY - 10);
}

// Create offscreen canvas for lighting (created once, reused)
let lightingCanvas = null;
let lightingCtx = null;

function renderLighting() {
    // CORRECT approach: Draw darkness OUTSIDE the vision cone
    // Vision cone area should be VISIBLE (bright), outside should be DARK
    // Using offscreen canvas to avoid destination-out issues

    const coneLength = player.flashlightOn ? 600 : 180;
    const coneAngle = Math.PI / 2.5; // ~72 degrees half-angle
    const ambientRadius = player.flashlightOn ? 180 : 120;

    // Create offscreen canvas if needed
    if (!lightingCanvas) {
        lightingCanvas = document.createElement('canvas');
        lightingCanvas.width = GAME_WIDTH;
        lightingCanvas.height = GAME_HEIGHT;
        lightingCtx = lightingCanvas.getContext('2d');
    }

    // Clear the lighting canvas
    lightingCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Step 1: Fill with darkness on the offscreen canvas
    lightingCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    lightingCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Step 2: Cut out the vision cone (makes it visible/bright)
    lightingCtx.globalCompositeOperation = 'destination-out';

    // Convert world coordinates to screen coordinates for the offscreen canvas
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Draw the visible cone area - this will REMOVE darkness from the cone
    lightingCtx.beginPath();
    lightingCtx.moveTo(screenX, screenY);
    lightingCtx.arc(screenX, screenY, coneLength, player.angle - coneAngle, player.angle + coneAngle);
    lightingCtx.closePath();

    // Use gradient for smooth falloff
    const coneGradient = lightingCtx.createRadialGradient(screenX, screenY, 0, screenX, screenY, coneLength);
    coneGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coneGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)');
    coneGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    lightingCtx.fillStyle = coneGradient;
    lightingCtx.fill();

    // Draw ambient circle around player (always visible)
    lightingCtx.beginPath();
    lightingCtx.arc(screenX, screenY, ambientRadius, 0, Math.PI * 2);
    const ambientGradient = lightingCtx.createRadialGradient(screenX, screenY, 0, screenX, screenY, ambientRadius);
    ambientGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    ambientGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
    ambientGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    lightingCtx.fillStyle = ambientGradient;
    lightingCtx.fill();

    // Reset composite operation
    lightingCtx.globalCompositeOperation = 'source-over';

    // Step 3: Draw the lighting overlay onto the main canvas
    ctx.drawImage(lightingCanvas, camera.x, camera.y);
}

function renderUI() {
    // O2 Bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 15, 204, 24);
    ctx.fillStyle = COLORS.O2_BAR;
    ctx.fillRect(17, 17, 200 * (player.o2 / player.maxO2), 20);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('O2: ' + Math.floor(player.o2) + '/' + player.maxO2, 20, 32);

    // HP Bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 45, 204, 24);
    ctx.fillStyle = COLORS.HP_BAR;
    ctx.fillRect(17, 47, 200 * (player.hp / player.maxHp), 20);
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText('HP: ' + Math.floor(player.hp) + '/' + player.maxHp, 20, 62);

    // Flashlight battery
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 75, 104, 14);
    ctx.fillStyle = player.flashlightOn ? '#cccc40' : '#606060';
    ctx.fillRect(17, 77, 100 * (player.flashlightBattery / player.maxFlashlightBattery), 10);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '10px monospace';
    ctx.fillText('LIGHT: ' + (player.flashlightOn ? 'ON' : 'OFF'), 20, 86);

    // Weapon info
    const weapon = weapons[player.weapon];
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 95, 150, 35);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '12px monospace';
    ctx.fillText('WEAPON: ' + player.weapon.toUpperCase(), 20, 108);
    if (weapon.type === 'ranged') {
        const ammoCount = ammo[weapon.ammoType] || 0;
        ctx.fillText('AMMO: ' + ammoCount + ' ' + weapon.ammoType, 20, 122);
    } else {
        ctx.fillText('DMG: ' + weapon.damage, 20, 122);
    }

    // Grenades/Flares
    if (player.grenades > 0 || player.flares > 0) {
        ctx.fillStyle = '#886644';
        ctx.fillText('GRENADES: ' + (player.grenades || 0), 20, 145);
        ctx.fillStyle = '#ff8844';
        ctx.fillText('FLARES: ' + (player.flares || 0), 100, 145);
    }

    // Stimpack effect
    if (player.stimpackTimer > 0) {
        ctx.fillStyle = '#44aaaa';
        ctx.fillText('SPEED BOOST: ' + Math.floor(player.stimpackTimer) + 's', 20, 160);
    }

    // Minimap
    renderMinimap();

    // Ship integrity
    ctx.fillStyle = '#000000';
    ctx.fillRect(GAME_WIDTH - 220, 15, 204, 24);
    ctx.fillStyle = game.integrity < 30 ? COLORS.WARNING : '#4a6a8a';
    ctx.fillRect(GAME_WIDTH - 218, 17, 200 * (game.integrity / 100), 20);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('INTEGRITY: ' + Math.floor(game.integrity) + '%', GAME_WIDTH - 215, 32);

    // Sector
    ctx.fillText('SECTOR: ' + game.sector, GAME_WIDTH - 215, 55);

    // Messages
    ctx.font = '12px monospace';
    for (let i = 0; i < game.messages.length; i++) {
        const msg = game.messages[i];
        const alpha = Math.max(0, 1 - (game.time - msg.time) / 8);
        ctx.fillStyle = `rgba(100, 180, 100, ${alpha})`;
        ctx.fillText(msg.text, 20, GAME_HEIGHT - 80 + i * 16);
    }

    // Low O2 warning
    if (player.o2 < 30) {
        ctx.fillStyle = `rgba(200, 60, 60, ${0.5 + 0.3 * Math.sin(game.time * 5)})`;
        ctx.font = '20px monospace';
        ctx.fillText('LOW OXYGEN', GAME_WIDTH / 2 - 70, GAME_HEIGHT - 30);
    }

    // Crosshair
    ctx.strokeStyle = '#80ff80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 8, mouse.y);
    ctx.lineTo(mouse.x - 3, mouse.y);
    ctx.moveTo(mouse.x + 3, mouse.y);
    ctx.lineTo(mouse.x + 8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 8);
    ctx.lineTo(mouse.x, mouse.y - 3);
    ctx.moveTo(mouse.x, mouse.y + 3);
    ctx.lineTo(mouse.x, mouse.y + 8);
    ctx.stroke();

    // Damage flash overlay
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(200, 0, 0, ${damageFlashAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Low health vignette
    if (player.hp < 30) {
        const pulseAlpha = 0.15 + Math.sin(lowHealthPulse) * 0.1;
        ctx.fillStyle = `rgba(100, 0, 0, ${pulseAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Debug overlay
    if (debugMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(GAME_WIDTH - 200, 80, 190, 220);
        ctx.fillStyle = '#00ff00';
        ctx.font = '11px monospace';
        const lines = [
            `KILLS: ${stats.killCount}`,
            `DMG DEALT: ${stats.totalDamageDealt}`,
            `DMG TAKEN: ${stats.totalDamageTaken}`,
            `CRITS: ${stats.critCount}`,
            `ITEMS: ${stats.itemsPickedUp}`,
            `ATTACKS: ${stats.attacksMade}`,
            `---`,
            `HP: ${Math.floor(player.hp)}`,
            `O2: ${Math.floor(player.o2)}`,
            `INTEGRITY: ${Math.floor(game.integrity)}%`,
            `ENEMIES: ${enemies.filter(e => e.hp > 0).length}`,
            `TIME: ${Math.floor(game.time)}s`
        ];
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], GAME_WIDTH - 190, 95 + i * 14);
        }
    }

    // Game over / Victory (Enhanced)
    if (game.state === 'gameover') {
        const timeSurvived = Math.floor((Date.now() - game.startTime) / 1000);

        // Performance rating
        let rating = 'LOST';
        let ratingColor = COLORS.HP_BAR;
        if (stats.killCount >= 2 && timeSurvived >= 30) { rating = 'SURVIVOR'; ratingColor = '#aaaa40'; }
        if (stats.killCount >= 4 && stats.totalDamageDealt > 100) { rating = 'FIGHTER'; ratingColor = '#40aa60'; }
        if (stats.killCount >= 6 && stats.critCount >= 2) { rating = 'WARRIOR'; ratingColor = '#40aaff'; }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = COLORS.HP_BAR;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH/2, 100);

        ctx.fillStyle = ratingColor;
        ctx.font = '28px monospace';
        ctx.fillText(`RATING: ${rating}`, GAME_WIDTH/2, 150);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const statsLines = [
            `TIME SURVIVED: ${Math.floor(timeSurvived / 60)}:${(timeSurvived % 60).toString().padStart(2, '0')}`,
            ``,
            `KILLS: ${stats.killCount}`,
            `DAMAGE DEALT: ${stats.totalDamageDealt}`,
            `DAMAGE TAKEN: ${stats.totalDamageTaken}`,
            `CRITICAL HITS: ${stats.critCount}`,
            `ATTACKS MADE: ${stats.attacksMade}`,
            `ITEMS USED: ${stats.itemsPickedUp}`,
            ``,
            `"${game.messages[0]?.text || 'The darkness consumed you.'}"`
        ];
        for (let i = 0; i < statsLines.length; i++) {
            ctx.fillText(statsLines[i], GAME_WIDTH/2, 200 + i * 24);
        }
        ctx.textAlign = 'left';

    } else if (game.state === 'victory') {
        const timeElapsed = Math.floor((Date.now() - game.startTime) / 1000);

        // Efficiency rating
        let rating = 'D';
        let ratingColor = '#cc4040';
        if (stats.killCount >= 3 && timeElapsed < 300) { rating = 'C'; ratingColor = '#aaaa40'; }
        if (stats.killCount >= 5 && timeElapsed < 180) { rating = 'B'; ratingColor = '#40aa60'; }
        if (stats.killCount >= 7 && timeElapsed < 120 && stats.critCount >= 3) { rating = 'A'; ratingColor = '#40aaff'; }
        if (stats.killCount >= 8 && timeElapsed < 90 && stats.critCount >= 5) { rating = 'S'; ratingColor = '#ffaa00'; }

        ctx.fillStyle = 'rgba(0, 30, 0, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = COLORS.MEDKIT;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPED!', GAME_WIDTH/2, 100);

        ctx.fillStyle = ratingColor;
        ctx.font = '36px monospace';
        ctx.fillText(`EFFICIENCY: ${rating}`, GAME_WIDTH/2, 155);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const victoryStatsLines = [
            `TIME ELAPSED: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
            ``,
            `KILLS: ${stats.killCount}`,
            `DAMAGE DEALT: ${stats.totalDamageDealt}`,
            `DAMAGE TAKEN: ${stats.totalDamageTaken}`,
            `CRITICAL HITS: ${stats.critCount}`,
            `ATTACKS MADE: ${stats.attacksMade}`,
            `ITEMS USED: ${stats.itemsPickedUp}`,
            `INTEGRITY REMAINING: ${Math.floor(game.integrity)}%`,
            ``,
            `"You escaped the derelict ship!"`
        ];
        for (let i = 0; i < victoryStatsLines.length; i++) {
            ctx.fillText(victoryStatsLines[i], GAME_WIDTH/2, 200 + i * 24);
        }
        ctx.textAlign = 'left';
    }
}

// ===============================
// SPACESHIP ESCAPE PHASE
// ===============================

function initSpaceship() {
    spaceship.x = 100;
    spaceship.y = GAME_HEIGHT / 2;
    spaceship.hp = 3;
    spaceship.distance = 0;
    spaceship.asteroids = [];
    spaceship.spawnTimer = 0;

    // Initialize stars
    spaceship.stars = [];
    for (let i = 0; i < 100; i++) {
        spaceship.stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            speed: 50 + Math.random() * 150,
            size: 1 + Math.random() * 2
        });
    }
}

function updateSpaceship(delta) {
    game.time += delta;

    // Ship movement (WASD)
    if (keys['w'] && spaceship.y > 30) spaceship.y -= spaceship.speed * delta;
    if (keys['s'] && spaceship.y < GAME_HEIGHT - 30) spaceship.y += spaceship.speed * delta;
    if (keys['a'] && spaceship.x > 30) spaceship.x -= spaceship.speed * 0.5 * delta;
    if (keys['d'] && spaceship.x < GAME_WIDTH - 100) spaceship.x += spaceship.speed * 0.5 * delta;

    // Progress distance
    spaceship.distance += 100 * delta;

    // Spawn asteroids
    spaceship.spawnTimer -= delta;
    if (spaceship.spawnTimer <= 0) {
        spaceship.spawnTimer = 0.3 + Math.random() * 0.5;
        spaceship.asteroids.push({
            x: GAME_WIDTH + 50,
            y: Math.random() * GAME_HEIGHT,
            speed: 150 + Math.random() * 200,
            size: 15 + Math.random() * 30,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 3
        });
    }

    // Update asteroids
    for (const ast of spaceship.asteroids) {
        ast.x -= ast.speed * delta;
        ast.rotation += ast.rotSpeed * delta;

        // Collision check
        const dist = Math.hypot(ast.x - spaceship.x, ast.y - spaceship.y);
        if (dist < ast.size + 15 && !ast.hit) {
            ast.hit = true;
            spaceship.hp--;
            triggerScreenShake(10);
            damageFlashAlpha = 0.5;

            if (spaceship.hp <= 0) {
                game.state = 'gameover';
                addMessage("Your escape pod was destroyed by debris.");
            }
        }
    }

    // Remove off-screen asteroids
    spaceship.asteroids = spaceship.asteroids.filter(a => a.x > -50);

    // Update stars (parallax)
    for (const star of spaceship.stars) {
        star.x -= star.speed * delta;
        if (star.x < 0) {
            star.x = GAME_WIDTH;
            star.y = Math.random() * GAME_HEIGHT;
        }
    }

    // Victory condition - reached safe distance
    if (spaceship.distance >= spaceship.targetDistance) {
        game.state = 'victory';
        addMessage("You escaped to safety!");
    }

    updateVisualEffects(delta);
}

function renderSpaceship() {
    // Black space background
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars (parallax)
    ctx.fillStyle = '#ffffff';
    for (const star of spaceship.stars) {
        ctx.globalAlpha = 0.3 + (star.size / 3) * 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Derelict ship in background (shrinking)
    const shipScale = Math.max(0, 1 - spaceship.distance / 300);
    if (shipScale > 0) {
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = shipScale;
        ctx.fillRect(
            -50 - spaceship.distance * 0.3,
            GAME_HEIGHT / 2 - 100 * shipScale,
            200 * shipScale,
            200 * shipScale
        );
        ctx.globalAlpha = 1;
    }

    // Asteroids
    ctx.fillStyle = '#5a5a5a';
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    for (const ast of spaceship.asteroids) {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);

        // Irregular asteroid shape
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const r = ast.size * (0.7 + Math.sin(i * 3) * 0.3);
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // Escape pod (player ship)
    ctx.save();
    ctx.translate(spaceship.x, spaceship.y);

    // Ship body
    ctx.fillStyle = '#6a8a8a';
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(-15, -15);
    ctx.lineTo(-20, -10);
    ctx.lineTo(-20, 10);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8ab0b0';
    ctx.stroke();

    // Engine glow
    ctx.fillStyle = '#ff8844';
    ctx.beginPath();
    ctx.moveTo(-20, -8);
    ctx.lineTo(-35 - Math.random() * 10, 0);
    ctx.lineTo(-20, 8);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#40aa60';
    ctx.beginPath();
    ctx.arc(10, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // UI - Progress bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(GAME_WIDTH / 2 - 200, 20, 400, 20);
    ctx.fillStyle = '#4080cc';
    ctx.fillRect(GAME_WIDTH / 2 - 198, 22, 396 * (spaceship.distance / spaceship.targetDistance), 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPE PROGRESS', GAME_WIDTH / 2, 35);
    ctx.textAlign = 'left';

    // HP display
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('HULL: ', 20, 30);
    for (let i = 0; i < spaceship.hp; i++) {
        ctx.fillStyle = '#40aa60';
        ctx.fillRect(70 + i * 25, 18, 20, 16);
    }
    for (let i = spaceship.hp; i < 3; i++) {
        ctx.fillStyle = '#400000';
        ctx.fillRect(70 + i * 25, 18, 20, 16);
    }

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText('WASD to dodge asteroids!', 20, GAME_HEIGHT - 20);

    // Damage flash
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(200, 0, 0, ${damageFlashAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

// Start
init();
