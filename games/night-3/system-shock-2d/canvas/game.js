// WHISPERS OF M.A.R.I.A. - System Shock 2D Clone
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Colors matching reference style
const COLORS = {
    BG: '#000000',
    FLOOR: '#4a4238',
    FLOOR_ALT: '#3a3228',
    WALL: '#2a2520',
    WALL_LIGHT: '#5a4a40',
    DOOR: '#6a5a50',
    TERMINAL: '#2a4a3a',
    TERMINAL_SCREEN: '#40aa60',
    PLAYER: '#6a8a8a',
    CYBORG: '#7a6050',
    CYBORG_EYE: '#ff3030',
    BULLET: '#ffff80',
    LASER: '#80ffff',
    HEALTH_BAR: '#cc4040',
    ENERGY_BAR: '#4080cc',
    TEXT: '#ffffff',
    TEXT_GREEN: '#60cc80',
    TEXT_RED: '#cc6060',
    TEXT_CYAN: '#60cccc',
    FLASHLIGHT: 'rgba(255, 240, 200, 0.15)',
    DARKNESS: 'rgba(0, 0, 0, 0.55)'
};

// Game state
const game = {
    state: 'playing', // menu, playing, hacking, inventory, gameover, victory
    deck: 1,
    time: 0,
    score: 0,
    messages: []
};

// Stats tracking
const stats = {
    killCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    critCount: 0,
    terminalsHacked: 0,
    itemsPickedUp: 0,
    shotsFired: 0,
    shotsHit: 0,
    maxKillStreak: 0
};

// Kill streak system
let killStreak = 0;
let killStreakTimer = 0;

// Visual effects
let damageFlashAlpha = 0;
let lowHealthPulse = 0;
let screenShake = { x: 0, y: 0, intensity: 0 };

// Floating texts
let floatingTexts = [];

// Debug mode
let debugMode = false;

// Player
const player = {
    x: 400,
    y: 400,
    angle: 0,
    speed: 150,
    sprintSpeed: 250,
    radius: 12,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    isSprinting: false,
    isCrouching: false,
    flashlightOn: true,
    weapon: 'pistol',
    ammo: { bullets: 48, shells: 0, energy: 0 },
    magazine: 12,
    maxMagazine: 12,
    reloading: false,
    reloadTime: 0,
    lastShot: 0,
    fireRate: 300, // ms
    inventory: [],
    keycards: []
};

// Weapons data
const weapons = {
    wrench: { damage: 15, range: 40, fireRate: 400, ammoType: null, magazineSize: null, melee: true },
    pistol: { damage: 12, range: 400, fireRate: 300, ammoType: 'bullets', magazineSize: 12, melee: false },
    shotgun: { damage: 8, pellets: 6, range: 200, fireRate: 800, ammoType: 'shells', magazineSize: 6, melee: false }
};

// Enemies
let enemies = [];
const enemyTypes = {
    cyborgDrone: { hp: 30, speed: 80, damage: 10, range: 30, color: COLORS.CYBORG, size: 14, behavior: 'patrol' },
    cyborgSoldier: { hp: 60, speed: 100, damage: 15, range: 200, color: '#8a6050', size: 16, behavior: 'ranged' },
    maintenanceBot: { hp: 40, speed: 60, damage: 10, range: 150, color: '#5a6a7a', size: 18, behavior: 'patrol' }
};

// Bullets
let bullets = [];
let particles = [];

// Map
let map = [];
let doors = [];
let terminals = [];
let items = [];
let corpses = [];

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false, rightDown: false };

// Camera
const camera = { x: 0, y: 0 };

// Initialize game
function init() {
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnItems();

    // Event listeners
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        if (e.key === 'r' && !player.reloading) reload();
        if (e.key === 'f') player.flashlightOn = !player.flashlightOn;
        if (e.key === 'e') interact();
        if (e.key === 'q') debugMode = !debugMode;
        if (e.key >= '1' && e.key <= '4') selectWeapon(parseInt(e.key) - 1);
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
            shoot();
        } else if (e.button === 2) {
            mouse.rightDown = true;
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) mouse.down = false;
        else if (e.button === 2) mouse.rightDown = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    addMessage("SYSTEM: Welcome to Von Braun. M.A.R.I.A. is watching.");

    requestAnimationFrame(gameLoop);
}

function generateMap() {
    // Initialize map with walls
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = 1; // wall
        }
    }

    // Create rooms
    const rooms = [];
    const numRooms = 8 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numRooms; i++) {
        const roomW = 5 + Math.floor(Math.random() * 6);
        const roomH = 4 + Math.floor(Math.random() * 5);
        const roomX = 1 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 2));
        const roomY = 1 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 2));

        // Carve room
        for (let y = roomY; y < roomY + roomH; y++) {
            for (let x = roomX; x < roomX + roomW; x++) {
                map[y][x] = 0; // floor
            }
        }

        rooms.push({ x: roomX + roomW/2, y: roomY + roomH/2, w: roomW, h: roomH });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const prev = rooms[i - 1];
        const curr = rooms[i];

        // Horizontal then vertical
        let x = Math.floor(prev.x);
        let y = Math.floor(prev.y);
        const targetX = Math.floor(curr.x);
        const targetY = Math.floor(curr.y);

        while (x !== targetX) {
            if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                map[y][x] = 0;
                if (y > 0) map[y-1][x] = 0;
            }
            x += x < targetX ? 1 : -1;
        }
        while (y !== targetY) {
            if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                map[y][x] = 0;
                if (x > 0) map[y][x-1] = 0;
            }
            y += y < targetY ? 1 : -1;
        }
    }

    // Add doors at corridor entrances
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            if (map[y][x] === 0) {
                // Check for door-worthy position (narrow passage)
                const isHorizontalPassage = map[y][x-1] === 1 && map[y][x+1] === 1 &&
                                           map[y-1][x] === 0 && map[y+1][x] === 0;
                const isVerticalPassage = map[y-1][x] === 1 && map[y+1][x] === 1 &&
                                         map[y][x-1] === 0 && map[y][x+1] === 0;

                if ((isHorizontalPassage || isVerticalPassage) && Math.random() < 0.2) {
                    doors.push({ x: x * TILE_SIZE + TILE_SIZE/2, y: y * TILE_SIZE + TILE_SIZE/2,
                                open: false, locked: Math.random() < 0.3, keycard: 'yellow' });
                }
            }
        }
    }

    // Add terminals
    for (const room of rooms) {
        if (Math.random() < 0.5) {
            const tx = Math.floor(room.x - room.w/2 + 1);
            const ty = Math.floor(room.y - room.h/2 + 1);
            terminals.push({
                x: tx * TILE_SIZE + TILE_SIZE/2,
                y: ty * TILE_SIZE + TILE_SIZE/2,
                hacked: false,
                difficulty: 'medium',
                type: Math.random() < 0.5 ? 'security' : 'data'
            });
        }
    }

    // Mark exit
    const lastRoom = rooms[rooms.length - 1];
    game.exitX = Math.floor(lastRoom.x) * TILE_SIZE;
    game.exitY = Math.floor(lastRoom.y) * TILE_SIZE;
}

function spawnPlayer() {
    // Find first room
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
    const enemyCount = 5 + game.deck * 3;

    for (let i = 0; i < enemyCount; i++) {
        let attempts = 0;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);

            if (map[y][x] === 0) {
                const dist = Math.hypot(x * TILE_SIZE - player.x, y * TILE_SIZE - player.y);
                if (dist > 200) {
                    const types = ['cyborgDrone', 'cyborgDrone', 'cyborgSoldier', 'maintenanceBot'];
                    const type = types[Math.floor(Math.random() * types.length)];
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
                        behavior: data.behavior,
                        state: 'patrol',
                        angle: Math.random() * Math.PI * 2,
                        patrolTarget: null,
                        alertTimer: 0,
                        lastAttack: 0,
                        lastSeen: { x: 0, y: 0 }
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
    const itemCount = 10 + game.deck * 2;

    const itemTypes = [
        { type: 'medpatch', name: 'medkit25', color: COLORS.TEXT_GREEN, heal: 25 },
        { type: 'bullets', name: 'bullets 20x', color: COLORS.TEXT, ammo: 20, ammoType: 'bullets' },
        { type: 'shells', name: 'shells 8x', color: COLORS.TEXT, ammo: 8, ammoType: 'shells' },
        { type: 'energy', name: 'energy cell', color: COLORS.TEXT_CYAN, energy: 50 }
    ];

    for (let i = 0; i < itemCount; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);

            if (map[y][x] === 0) {
                const itemData = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                items.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    ...itemData
                });
                break;
            }
            attempts++;
        }
    }
}

function addMessage(text) {
    game.messages.unshift({ text, time: game.time });
    if (game.messages.length > 5) game.messages.pop();
}

let lastTime = 0;
function gameLoop(currentTime) {
    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (game.state === 'playing') {
        update(delta);
    }

    render();
    requestAnimationFrame(gameLoop);
}

function update(delta) {
    game.time += delta;

    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateParticles(delta);
    updateVisualEffects(delta);
    updateFloatingTexts(delta);
    updateKillStreak(delta);

    // Energy regeneration
    if (player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + 2 * delta);
    }

    // Flashlight energy cost
    if (player.flashlightOn) {
        player.energy = Math.max(0, player.energy - 1 * delta);
        if (player.energy <= 0) player.flashlightOn = false;
    }

    // Check victory
    const distToExit = Math.hypot(player.x - game.exitX, player.y - game.exitY);
    if (distToExit < 40 && enemies.length === 0) {
        game.state = 'victory';
        addMessage("SYSTEM: Deck " + game.deck + " cleared. Proceeding to elevator.");
    }

    // Check death
    if (player.hp <= 0) {
        game.state = 'gameover';
    }
}

function updatePlayer(delta) {
    // Calculate aim angle
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Sprint
    player.isSprinting = keys['shift'] && player.energy > 0;
    player.isCrouching = keys['control'];

    const speed = player.isCrouching ? player.speed * 0.5 :
                  player.isSprinting ? player.sprintSpeed : player.speed;

    if (player.isSprinting) {
        player.energy = Math.max(0, player.energy - 5 * delta);
    }

    // Movement
    let dx = 0, dy = 0;
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        const newX = player.x + dx * speed * delta;
        const newY = player.y + dy * speed * delta;

        if (!checkCollision(newX, player.y, player.radius)) player.x = newX;
        if (!checkCollision(player.x, newY, player.radius)) player.y = newY;
    }

    // Reloading
    if (player.reloading) {
        player.reloadTime -= delta * 1000;
        if (player.reloadTime <= 0) {
            player.reloading = false;
            const weapon = weapons[player.weapon];
            if (weapon.ammoType) {
                const needed = weapon.magazineSize - player.magazine;
                const available = Math.min(needed, player.ammo[weapon.ammoType]);
                player.magazine += available;
                player.ammo[weapon.ammoType] -= available;
            }
        }
    }

    // Auto-fire
    if (mouse.down && !player.reloading) {
        shoot();
    }

    // Update camera
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

    // Check closed doors
    for (const door of doors) {
        if (!door.open) {
            const dist = Math.hypot(x - door.x, y - door.y);
            if (dist < radius + 16) return true;
        }
    }

    return false;
}

function shoot() {
    const now = performance.now();
    const weapon = weapons[player.weapon];

    if (now - player.lastShot < weapon.fireRate) return;

    if (weapon.melee) {
        // Melee attack
        player.lastShot = now;
        const attackX = player.x + Math.cos(player.angle) * weapon.range;
        const attackY = player.y + Math.sin(player.angle) * weapon.range;

        for (const enemy of enemies) {
            const dist = Math.hypot(attackX - enemy.x, attackY - enemy.y);
            if (dist < enemy.size + 20) {
                damageEnemy(enemy, weapon.damage);
            }
        }

        // Visual effect
        particles.push({
            x: attackX, y: attackY,
            vx: 0, vy: 0,
            life: 0.1,
            color: '#ffffff',
            size: 15
        });
    } else {
        // Ranged attack
        if (player.magazine <= 0) {
            reload();
            return;
        }

        player.magazine--;
        player.lastShot = now;
        stats.shotsFired++;

        if (weapon.pellets) {
            // Shotgun spread
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = (Math.random() - 0.5) * 0.4;
                const angle = player.angle + spread;
                bullets.push({
                    x: player.x + Math.cos(player.angle) * 20,
                    y: player.y + Math.sin(player.angle) * 20,
                    vx: Math.cos(angle) * 500,
                    vy: Math.sin(angle) * 500,
                    damage: weapon.damage,
                    range: weapon.range,
                    traveled: 0,
                    owner: 'player',
                    color: COLORS.BULLET
                });
            }
        } else {
            // Single bullet
            bullets.push({
                x: player.x + Math.cos(player.angle) * 20,
                y: player.y + Math.sin(player.angle) * 20,
                vx: Math.cos(player.angle) * 600,
                vy: Math.sin(player.angle) * 600,
                damage: weapon.damage,
                range: weapon.range,
                traveled: 0,
                owner: 'player',
                color: COLORS.BULLET
            });
        }

        // Muzzle flash
        particles.push({
            x: player.x + Math.cos(player.angle) * 25,
            y: player.y + Math.sin(player.angle) * 25,
            vx: 0, vy: 0,
            life: 0.05,
            color: '#ffff80',
            size: 12
        });
    }
}

function reload() {
    const weapon = weapons[player.weapon];
    if (!weapon.ammoType) return;
    if (player.magazine >= weapon.magazineSize) return;
    if (player.ammo[weapon.ammoType] <= 0) return;

    player.reloading = true;
    player.reloadTime = 1500;
    addMessage("Reloading...");
}

function selectWeapon(index) {
    const weaponList = ['wrench', 'pistol', 'shotgun'];
    if (index < weaponList.length) {
        player.weapon = weaponList[index];
        player.reloading = false;
        const w = weapons[player.weapon];
        if (w.magazineSize) player.magazine = Math.min(player.magazine, w.magazineSize);
        addMessage("Equipped: " + player.weapon);
    }
}

function interact() {
    // Check doors
    for (const door of doors) {
        const dist = Math.hypot(player.x - door.x, player.y - door.y);
        if (dist < 50) {
            if (door.locked) {
                if (player.keycards.includes(door.keycard)) {
                    door.locked = false;
                    door.open = true;
                    addMessage("Door unlocked with " + door.keycard + " keycard.");
                } else {
                    addMessage("Door locked. Requires " + door.keycard + " keycard.");
                }
            } else {
                door.open = !door.open;
            }
            return;
        }
    }

    // Check terminals
    for (const terminal of terminals) {
        const dist = Math.hypot(player.x - terminal.x, player.y - terminal.y);
        if (dist < 50 && !terminal.hacked) {
            addMessage("M.A.R.I.A.: Ah, you wish to access my systems? How... predictable.");
            terminal.hacked = true;
            game.score += 100;
            stats.terminalsHacked++;
            createFloatingText(terminal.x, terminal.y - 30, 'HACKED +100', '#40ff40', 14);
            // Data particles
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: terminal.x, y: terminal.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: -30 - Math.random() * 50,
                    life: 0.8,
                    color: '#40aa60',
                    size: 3
                });
            }
            return;
        }
    }

    // Check items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < 40) {
            pickupItem(item, i);
            return;
        }
    }

    // Check corpses
    for (let i = corpses.length - 1; i >= 0; i--) {
        const corpse = corpses[i];
        const dist = Math.hypot(player.x - corpse.x, player.y - corpse.y);
        if (dist < 40 && !corpse.looted) {
            corpse.looted = true;
            const loot = Math.random();
            if (loot < 0.5) {
                player.ammo.bullets += 10;
                addMessage("Found: bullets 10x");
            } else {
                player.hp = Math.min(player.maxHp, player.hp + 15);
                addMessage("Found: medpatch");
            }
            return;
        }
    }
}

function pickupItem(item, index) {
    stats.itemsPickedUp++;

    if (item.heal) {
        player.hp = Math.min(player.maxHp, player.hp + item.heal);
        addMessage("Used: " + item.name);
        createFloatingText(item.x, item.y - 20, '+' + item.heal + ' HP', '#40ff40', 14);
        // Healing particles
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: player.x + Math.cos(angle) * 20,
                y: player.y + Math.sin(angle) * 20,
                vx: 0, vy: -30 - Math.random() * 20,
                life: 0.6,
                color: '#40ff40',
                size: 4
            });
        }
    } else if (item.ammo) {
        player.ammo[item.ammoType] += item.ammo;
        addMessage("Picked up: " + item.name);
        createFloatingText(item.x, item.y - 20, '+AMMO', '#ffff40', 12);
    } else if (item.energy) {
        player.energy = Math.min(player.maxEnergy, player.energy + item.energy);
        addMessage("Picked up: " + item.name);
        createFloatingText(item.x, item.y - 20, '+' + item.energy + ' ENERGY', '#40ffff', 12);
    }

    // Pickup sparkle
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        particles.push({
            x: item.x, y: item.y,
            vx: Math.cos(angle) * 40,
            vy: Math.sin(angle) * 40,
            life: 0.3,
            color: '#ffff80',
            size: 3
        });
    }

    items.splice(index, 1);
}

function updateEnemies(delta) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // Check if can see player (within flashlight cone or close)
        const canSee = canEnemySeePlayer(enemy);

        // State machine
        switch (enemy.state) {
            case 'patrol':
                if (canSee && distToPlayer < 250) {
                    enemy.state = 'chase';
                    enemy.lastSeen = { x: player.x, y: player.y };
                    addMessage("M.A.R.I.A.: Target acquired. Engaging.");
                } else {
                    // Random patrol
                    if (!enemy.patrolTarget || Math.random() < 0.01) {
                        const tx = enemy.x + (Math.random() - 0.5) * 200;
                        const ty = enemy.y + (Math.random() - 0.5) * 200;
                        enemy.patrolTarget = { x: tx, y: ty };
                    }
                    moveEnemy(enemy, enemy.patrolTarget.x, enemy.patrolTarget.y, delta);
                }
                break;

            case 'chase':
                if (canSee) {
                    enemy.lastSeen = { x: player.x, y: player.y };
                    enemy.alertTimer = 5;
                }

                if (distToPlayer < enemy.range && canSee) {
                    // Attack
                    enemy.state = 'attack';
                } else if (enemy.alertTimer > 0) {
                    moveEnemy(enemy, enemy.lastSeen.x, enemy.lastSeen.y, delta);
                    enemy.alertTimer -= delta;
                } else {
                    enemy.state = 'patrol';
                }
                break;

            case 'attack':
                enemy.angle = angleToPlayer;

                const now = performance.now();
                if (now - enemy.lastAttack > 1000) {
                    enemy.lastAttack = now;

                    if (enemy.behavior === 'ranged' && distToPlayer > 50) {
                        // Ranged attack
                        bullets.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: Math.cos(angleToPlayer) * 300,
                            vy: Math.sin(angleToPlayer) * 300,
                            damage: enemy.damage,
                            range: enemy.range,
                            traveled: 0,
                            owner: 'enemy',
                            color: COLORS.LASER
                        });
                    } else if (distToPlayer < enemy.range + 20) {
                        // Melee attack
                        damagePlayer(enemy.damage);
                        addMessage("Cyborg attacks! -" + enemy.damage + " HP");
                    }
                }

                if (distToPlayer > enemy.range * 1.5 || !canSee) {
                    enemy.state = 'chase';
                }
                break;
        }
    }
}

function canEnemySeePlayer(enemy) {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const angleDiff = Math.abs(normalizeAngle(angle - enemy.angle));

    // Detection range varies by player's flashlight and crouching
    let detectionRange = 200;
    if (!player.flashlightOn) detectionRange = 80;
    if (player.isCrouching) detectionRange *= 0.6;

    // Check line of sight
    if (dist < detectionRange && angleDiff < Math.PI / 2) {
        return hasLineOfSight(enemy.x, enemy.y, player.x, player.y);
    }

    // Always detect if very close
    return dist < 50;
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist / TILE_SIZE);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);

        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
            if (map[ty][tx] === 1) return false;
        }
    }
    return true;
}

function moveEnemy(enemy, targetX, targetY, delta) {
    const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    enemy.angle = angle;

    const newX = enemy.x + Math.cos(angle) * enemy.speed * delta;
    const newY = enemy.y + Math.sin(angle) * enemy.speed * delta;

    if (!checkCollision(newX, enemy.y, enemy.size)) enemy.x = newX;
    if (!checkCollision(enemy.x, newY, enemy.size)) enemy.y = newY;
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function damageEnemy(enemy, damage) {
    // Critical hit system (15% chance, 2x damage)
    const isCrit = Math.random() < 0.15;
    if (isCrit) {
        damage *= 2;
        stats.critCount++;
    }

    enemy.hp -= damage;
    enemy.state = 'chase';
    enemy.lastSeen = { x: player.x, y: player.y };
    enemy.alertTimer = 5;

    stats.totalDamageDealt += damage;
    stats.shotsHit++;

    // Floating damage number
    createFloatingText(
        enemy.x, enemy.y - 20,
        damage.toString() + (isCrit ? '!' : ''),
        isCrit ? '#ffff00' : '#ff4444',
        isCrit ? 18 : 14
    );

    // Screen shake
    triggerScreenShake(isCrit ? 6 : 3);

    // Blood particle (more for crits)
    const particleCount = isCrit ? 5 : 1;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 0.4,
            color: '#aa4040',
            size: 6 + Math.random() * 4
        });
    }

    if (enemy.hp <= 0) {
        killEnemy(enemy, isCrit);
    }
}

function killEnemy(enemy, wasCrit) {
    stats.killCount++;

    // Kill streak
    killStreak++;
    killStreakTimer = 3; // 3 seconds
    if (killStreak > stats.maxKillStreak) {
        stats.maxKillStreak = killStreak;
    }

    // Kill streak messages
    if (killStreak >= 3) {
        const streakMessages = { 3: 'TRIPLE KILL!', 4: 'QUAD KILL!', 5: 'RAMPAGE!', 6: 'MASSACRE!' };
        const msg = streakMessages[Math.min(killStreak, 6)] || 'UNSTOPPABLE!';
        createFloatingText(player.x, player.y - 60, msg, '#ffaa00', 22);
    }

    // Death burst particles
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 80,
            life: 0.5,
            color: '#aa4040',
            size: 5
        });
    }
    triggerScreenShake(8);

    corpses.push({ x: enemy.x, y: enemy.y, type: enemy.type, looted: false, color: enemy.color });
    game.score += wasCrit ? 75 : 50;
    addMessage("Enemy destroyed. +" + (wasCrit ? 75 : 50) + " points");
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        const prevX = bullet.x;
        const prevY = bullet.y;

        bullet.x += bullet.vx * delta;
        bullet.y += bullet.vy * delta;
        bullet.traveled += Math.hypot(bullet.vx * delta, bullet.vy * delta);

        // Check wall collision
        const tx = Math.floor(bullet.x / TILE_SIZE);
        const ty = Math.floor(bullet.y / TILE_SIZE);
        if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH || map[ty][tx] === 1) {
            bullets.splice(i, 1);
            continue;
        }

        // Check range
        if (bullet.traveled > bullet.range) {
            bullets.splice(i, 1);
            continue;
        }

        // Check hits
        if (bullet.owner === 'player') {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                if (dist < enemy.size + 5) {
                    damageEnemy(enemy, bullet.damage);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (dist < player.radius + 5) {
                damagePlayer(bullet.damage);
                addMessage("Hit! -" + bullet.damage + " HP");
                bullets.splice(i, 1);
            }
        }
    }
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        if (p.life <= 0) particles.splice(i, 1);
    }
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
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.3,
            color: '#ff4040',
            size: 6
        });
    }

    // Floating damage text
    createFloatingText(player.x, player.y - 30, '-' + damage, '#ff4444', 14);
}

function createFloatingText(x, y, text, color, size) {
    floatingTexts.push({
        x, y,
        text,
        color,
        size,
        life: 1,
        maxLife: 1,
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
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= delta;
        ft.y += ft.vy * delta;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function updateKillStreak(delta) {
    if (killStreakTimer > 0) {
        killStreakTimer -= delta;
        if (killStreakTimer <= 0) {
            killStreak = 0;
        }
    }
}

function render() {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    // Apply screen shake
    ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

    // Render map
    renderMap();

    // Render items
    for (const item of items) {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x - 6, item.y - 6, 12, 12);
    }

    // Render doors
    for (const door of doors) {
        if (!door.open) {
            ctx.fillStyle = door.locked ? '#8a5040' : COLORS.DOOR;
            ctx.fillRect(door.x - 16, door.y - 16, 32, 32);
            ctx.fillStyle = '#3a3028';
            ctx.fillRect(door.x - 12, door.y - 12, 24, 24);
        }
    }

    // Render terminals
    for (const terminal of terminals) {
        ctx.fillStyle = COLORS.TERMINAL;
        ctx.fillRect(terminal.x - 14, terminal.y - 14, 28, 28);
        ctx.fillStyle = terminal.hacked ? '#306030' : COLORS.TERMINAL_SCREEN;
        ctx.fillRect(terminal.x - 10, terminal.y - 10, 20, 12);
    }

    // Render corpses
    for (const corpse of corpses) {
        ctx.fillStyle = corpse.looted ? '#3a3028' : corpse.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(corpse.x, corpse.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Render enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.size, -enemy.size * 0.7, enemy.size * 2, enemy.size * 1.4);

        // Eye
        ctx.fillStyle = COLORS.CYBORG_EYE;
        ctx.beginPath();
        ctx.arc(enemy.size * 0.5, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            const barWidth = enemy.size * 2;
            ctx.fillStyle = '#400000';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 8, barWidth, 4);
            ctx.fillStyle = COLORS.HEALTH_BAR;
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 8, barWidth * (enemy.hp / enemy.maxHp), 4);
        }
    }

    // Render player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(-10, -8, 20, 16);

    // Visor
    ctx.fillStyle = '#40aa60';
    ctx.fillRect(5, -4, 8, 8);

    // Weapon
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(12, -2, 12, 4);

    ctx.restore();

    // Render bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Exit marker
    ctx.fillStyle = '#40aa40';
    ctx.fillRect(game.exitX - 20, game.exitY - 20, 40, 40);
    ctx.fillStyle = '#60cc60';
    ctx.font = '12px monospace';
    ctx.fillText('EXIT', game.exitX - 14, game.exitY + 4);

    // Render flashlight cone / darkness overlay
    renderLighting();

    // Render floating texts (in world space)
    for (const ft of floatingTexts) {
        ctx.save();
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }

    ctx.restore();

    // Visual effects overlays (screen space)
    // Damage flash
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlashAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Low health vignette
    if (player.hp < 30) {
        const pulseAlpha = 0.15 + Math.sin(lowHealthPulse) * 0.1;
        ctx.fillStyle = `rgba(100, 0, 0, ${pulseAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Kill streak display
    if (killStreak >= 2) {
        ctx.save();
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.textAlign = 'center';
        ctx.fillText(`${killStreak}x STREAK`, GAME_WIDTH / 2, 80);
        ctx.restore();
    }

    // Render UI
    renderUI();

    // Debug overlay
    if (debugMode) {
        renderDebugOverlay();
    }
}

function renderDebugOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(GAME_WIDTH - 200, 40, 190, 250);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#00ff00';
    const lines = [
        `KILLS: ${stats.killCount}`,
        `DMG DEALT: ${stats.totalDamageDealt}`,
        `DMG TAKEN: ${stats.totalDamageTaken}`,
        `CRITS: ${stats.critCount}`,
        `TERMINALS: ${stats.terminalsHacked}`,
        `ITEMS: ${stats.itemsPickedUp}`,
        `SHOTS: ${stats.shotsFired}`,
        `HITS: ${stats.shotsHit}`,
        `ACCURACY: ${stats.shotsFired > 0 ? Math.round(stats.shotsHit / stats.shotsFired * 100) : 0}%`,
        `MAX STREAK: ${stats.maxKillStreak}`,
        `STREAK: ${killStreak}`,
        `---`,
        `HP: ${Math.floor(player.hp)}`,
        `ENERGY: ${Math.floor(player.energy)}`,
        `AMMO: ${player.magazine}/${player.ammo.bullets}`,
        `ENEMIES: ${enemies.filter(e => e.hp > 0).length}`,
        `SCORE: ${game.score}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, GAME_WIDTH - 190, 55 + i * 14);
    });
    ctx.restore();
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
                // Floor with pattern
                ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.FLOOR : COLORS.FLOOR_ALT;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Grid lines
                ctx.strokeStyle = '#2a2218';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            } else {
                // Wall
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.WALL_LIGHT;
                ctx.fillRect(px, py, TILE_SIZE, 4);
                ctx.fillRect(px, py, 4, TILE_SIZE);
            }
        }
    }
}

function castRay(startX, startY, angle, maxDist) {
    // Cast a ray and return distance to wall
    const stepSize = 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let d = 0; d < maxDist; d += stepSize) {
        const x = startX + cos * d;
        const y = startY + sin * d;
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);

        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
            return d;
        }
        if (map[ty][tx] === 1) {
            return d;
        }
    }
    return maxDist;
}

function renderLighting() {
    // Create darkness overlay
    ctx.fillStyle = COLORS.DARKNESS;
    ctx.fillRect(camera.x, camera.y, GAME_WIDTH, GAME_HEIGHT);

    // Cut out flashlight cone with raycasting (walls block light)
    if (player.flashlightOn) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        const coneLength = 500;
        const coneWidth = Math.PI / 2.5; // 72 degrees
        const rayCount = 60; // Number of rays to cast
        const startAngle = player.angle - coneWidth / 2;
        const angleStep = coneWidth / rayCount;

        // Build cone polygon with raycasting
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);

        for (let i = 0; i <= rayCount; i++) {
            const rayAngle = startAngle + angleStep * i;
            const dist = castRay(player.x, player.y, rayAngle, coneLength);
            const px = player.x + Math.cos(rayAngle) * dist;
            const py = player.y + Math.sin(rayAngle) * dist;
            ctx.lineTo(px, py);
        }

        ctx.closePath();

        // Gradient for soft edge
        const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, coneLength);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.7, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();

        // Larger ambient light around player
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const ambientGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 150);
        ambientGradient.addColorStop(0, 'rgba(255,255,255,0.7)');
        ambientGradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
        ambientGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = ambientGradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else {
        // Larger ambient light when flashlight off
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const ambientGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 100);
        ambientGradient.addColorStop(0, 'rgba(255,255,255,0.5)');
        ambientGradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        ambientGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = ambientGradient;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function renderUI() {
    // Left side - Inventory list (like reference)
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';

    // Weapon list
    const weaponList = ['wrench', 'pistol', 'shotgun'];
    let y = 30;
    for (let i = 0; i < weaponList.length; i++) {
        const w = weaponList[i];
        if (player.weapon === w) {
            ctx.fillStyle = '#000';
            ctx.fillRect(10, y - 12, ctx.measureText(w).width + 6, 16);
            ctx.fillStyle = COLORS.TEXT;
        }
        ctx.fillText(w, 13, y);
        y += 18;
    }

    y += 10;

    // Items in inventory display (green for consumables, red for explosives)
    ctx.fillStyle = COLORS.TEXT_GREEN;
    if (player.ammo.bullets > 0) {
        ctx.fillText('bullets ' + player.ammo.bullets + 'x', 13, y);
        y += 18;
    }
    if (player.ammo.shells > 0) {
        ctx.fillText('shells ' + player.ammo.shells + 'x', 13, y);
        y += 18;
    }

    // Bottom left - stats
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '16px monospace';

    const weapon = weapons[player.weapon];
    if (weapon.ammoType) {
        ctx.fillText('ammo  =' + player.magazine + '/' + player.ammo[weapon.ammoType], 13, GAME_HEIGHT - 80);
    }
    ctx.fillText('health=' + Math.floor(player.hp) + '/' + player.maxHp, 13, GAME_HEIGHT - 55);
    ctx.fillText('energy=' + Math.floor(player.energy) + '/' + player.maxEnergy, 13, GAME_HEIGHT - 30);

    // Weapon description
    ctx.font = '14px monospace';
    let desc = '';
    if (player.weapon === 'wrench') desc = 'Standard maintenance tool.';
    else if (player.weapon === 'pistol') desc = '9mm semi-automatic pistol.';
    else if (player.weapon === 'shotgun') desc = 'Pump-action shotgun. Good against groups.';
    ctx.fillText(desc, 13, GAME_HEIGHT - 10);

    // Top right - deck info
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('DECK ' + game.deck + ': Engineering', GAME_WIDTH - 180, 25);

    // Messages
    ctx.font = '12px monospace';
    for (let i = 0; i < game.messages.length; i++) {
        const msg = game.messages[i];
        const alpha = Math.max(0, 1 - (game.time - msg.time) / 5);
        ctx.fillStyle = `rgba(100, 200, 120, ${alpha})`;
        ctx.fillText(msg.text, GAME_WIDTH - 400, GAME_HEIGHT - 80 + i * 15);
    }

    // Reloading indicator
    if (player.reloading) {
        ctx.fillStyle = COLORS.TEXT_CYAN;
        ctx.fillText('RELOADING...', GAME_WIDTH / 2 - 50, GAME_HEIGHT / 2 + 50);
    }

    // Crosshair
    ctx.strokeStyle = '#80ff80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 10, mouse.y);
    ctx.lineTo(mouse.x - 4, mouse.y);
    ctx.moveTo(mouse.x + 4, mouse.y);
    ctx.lineTo(mouse.x + 10, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 10);
    ctx.lineTo(mouse.x, mouse.y - 4);
    ctx.moveTo(mouse.x, mouse.y + 4);
    ctx.lineTo(mouse.x, mouse.y + 10);
    ctx.stroke();

    // Game over / Victory screens
    if (game.state === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Calculate performance rating
        let rating = 'FAILURE';
        const score = stats.killCount * 10 + stats.terminalsHacked * 20 - stats.totalDamageTaken;
        if (score >= 100) rating = 'COMMENDABLE';
        else if (score >= 50) rating = 'ACCEPTABLE';
        else if (score >= 20) rating = 'POOR';

        ctx.fillStyle = COLORS.TEXT_RED;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM FAILURE', GAME_WIDTH/2, GAME_HEIGHT/2 - 100);

        ctx.font = '20px monospace';
        ctx.fillStyle = COLORS.TEXT;
        ctx.fillText('M.A.R.I.A.: "You were never going to win."', GAME_WIDTH/2, GAME_HEIGHT/2 - 60);

        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`Performance Rating: ${rating}`, GAME_WIDTH/2, GAME_HEIGHT/2 - 25);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#888888';
        const statsLines = [
            `Kills: ${stats.killCount}  |  Crits: ${stats.critCount}  |  Max Streak: ${stats.maxKillStreak}`,
            `Damage Dealt: ${stats.totalDamageDealt}  |  Damage Taken: ${stats.totalDamageTaken}`,
            `Terminals: ${stats.terminalsHacked}  |  Items: ${stats.itemsPickedUp}`,
            `Shots: ${stats.shotsFired}  |  Accuracy: ${stats.shotsFired > 0 ? Math.round(stats.shotsHit / stats.shotsFired * 100) : 0}%`,
            `Score: ${game.score}  |  Time: ${Math.floor(game.time)}s`
        ];
        statsLines.forEach((line, i) => {
            ctx.fillText(line, GAME_WIDTH/2, GAME_HEIGHT/2 + 10 + i * 20);
        });

        ctx.fillStyle = '#666666';
        ctx.fillText('Press R to restart', GAME_WIDTH/2, GAME_HEIGHT/2 + 130);
        ctx.textAlign = 'left';
    } else if (game.state === 'victory') {
        ctx.fillStyle = 'rgba(0, 40, 0, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Calculate efficiency rating
        const efficiency = (100 - stats.totalDamageTaken) + stats.killCount * 5 + stats.terminalsHacked * 10;
        let rating = 'D';
        if (efficiency >= 150) rating = 'S';
        else if (efficiency >= 120) rating = 'A';
        else if (efficiency >= 90) rating = 'B';
        else if (efficiency >= 60) rating = 'C';

        ctx.fillStyle = COLORS.TEXT_GREEN;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DECK CLEARED', GAME_WIDTH/2, GAME_HEIGHT/2 - 100);

        ctx.fillStyle = '#ffff00';
        ctx.font = '24px monospace';
        ctx.fillText(`Efficiency Rating: ${rating}`, GAME_WIDTH/2, GAME_HEIGHT/2 - 55);

        ctx.font = '20px monospace';
        ctx.fillStyle = COLORS.TEXT;
        ctx.fillText('M.A.R.I.A.: "You may have won this battle..."', GAME_WIDTH/2, GAME_HEIGHT/2 - 25);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#88aa88';
        const statsLines = [
            `Kills: ${stats.killCount}  |  Crits: ${stats.critCount}  |  Max Streak: ${stats.maxKillStreak}`,
            `Damage Dealt: ${stats.totalDamageDealt}  |  Damage Taken: ${stats.totalDamageTaken}`,
            `Terminals: ${stats.terminalsHacked}  |  Items: ${stats.itemsPickedUp}`,
            `Shots: ${stats.shotsFired}  |  Accuracy: ${stats.shotsFired > 0 ? Math.round(stats.shotsHit / stats.shotsFired * 100) : 0}%`,
            `Final HP: ${Math.floor(player.hp)}  |  Final Energy: ${Math.floor(player.energy)}`,
            `Score: ${game.score}  |  Time: ${Math.floor(game.time)}s`
        ];
        statsLines.forEach((line, i) => {
            ctx.fillText(line, GAME_WIDTH/2, GAME_HEIGHT/2 + 10 + i * 20);
        });

        ctx.fillStyle = '#666666';
        ctx.fillText('Press SPACE to continue', GAME_WIDTH/2, GAME_HEIGHT/2 + 150);
        ctx.textAlign = 'left';
    }
}

// Remove dead enemies from array
setInterval(() => {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
            enemies.splice(i, 1);
        }
    }
}, 1000);

// Start game
init();
