// Station Breach - Alien Breed Clone
// Top-Down Twin-Stick Shooter with Survival Horror Elements

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

let currentState = GameState.MENU;
let debugMode = false;
let frameCount = 0;
let lastFps = 60;
let fpsTimer = 0;

// Input state
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Screen shake
let screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };

// Floating text popups
let floatingTexts = [];

// Player
const player = {
    x: 0,
    y: 0,
    angle: 0,
    health: 100,
    maxHealth: 100,
    speed: 180,
    sprintSpeed: 270,
    stamina: 100,
    maxStamina: 100,
    radius: 16,
    pickupRadius: 32,
    currentWeapon: 0,
    weapons: [],
    ammo: { shells: 24, rifle: 90, fuel: 200 },
    maxAmmo: { shells: 64, rifle: 180, fuel: 300 },
    keycards: { blue: false },
    credits: 0,
    reloadTimer: 0,
    lastOutOfAmmoMsg: 0,
    invincibleTimer: 0
};

// Weapons data
const weaponData = {
    pistol: {
        name: 'Pistol',
        damage: 15,
        fireRate: 0.25,
        magSize: 12,
        reloadTime: 1.2,
        projectileSpeed: 800,
        spread: 3,
        range: 500,
        infiniteAmmo: true,
        shake: { intensity: 2, duration: 0.05 },
        color: '#FFD700'
    },
    shotgun: {
        name: 'Shotgun',
        damage: 8,
        pellets: 6,
        fireRate: 0.833,
        magSize: 8,
        reloadTime: 2.25,
        projectileSpeed: 600,
        spread: 25,
        range: 250,
        ammoType: 'shells',
        shake: { intensity: 8, duration: 0.15 },
        color: '#FF6600'
    },
    rifle: {
        name: 'Rifle',
        damage: 20,
        fireRate: 0.167,
        magSize: 30,
        reloadTime: 1.75,
        projectileSpeed: 850,
        spread: 5,
        range: 600,
        ammoType: 'rifle',
        shake: { intensity: 3, duration: 0.08 },
        color: '#00FF00'
    },
    flamethrower: {
        name: 'Flamethrower',
        damage: 5,
        fireRate: 0.05,
        magSize: 100,
        reloadTime: 2.75,
        projectileSpeed: 400,
        spread: 15,
        range: 200,
        ammoType: 'fuel',
        isFlame: true,
        shake: { intensity: 1, duration: 0.02 },
        color: '#FF4400'
    }
};

// Projectiles
let projectiles = [];
let enemyProjectiles = [];

// Particles
let particles = [];

// Enemies
let enemies = [];

// Items/Pickups
let items = [];

// Level data
let currentLevel = 0;
let levels = [];
let currentRoom = null;
let rooms = [];
let clearedRooms = new Set();

// Camera
const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    lerp: 0.1
};

// Vision raycasting
const VISION_ANGLE = Math.PI / 3; // 60 degrees
const VISION_RANGE = 350;
const RAY_COUNT = 120;

// Initialize game
function init() {
    // Set up player weapons (start with pistol)
    player.weapons = [{
        type: 'pistol',
        currentMag: 12
    }];

    // Generate levels
    generateLevel(0);

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'q' && currentState === GameState.PLAYING) {
        debugMode = !debugMode;
    }

    if (e.key === 'Escape') {
        if (currentState === GameState.PLAYING) {
            currentState = GameState.PAUSED;
        } else if (currentState === GameState.PAUSED) {
            currentState = GameState.PLAYING;
        }
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if (currentState === GameState.MENU) {
            currentState = GameState.PLAYING;
        } else if (currentState === GameState.GAME_OVER || currentState === GameState.VICTORY) {
            resetGame();
            currentState = GameState.PLAYING;
        }
    }

    // Weapon switching
    if (e.key.toLowerCase() === 'tab' && currentState === GameState.PLAYING) {
        e.preventDefault();
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
    }

    // Reload
    if (e.key.toLowerCase() === 'r' && currentState === GameState.PLAYING) {
        startReload();
    }

    // Interact (Space for doors)
    if (e.key === ' ' && currentState === GameState.PLAYING) {
        interact();
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
}

function handleMouseDown(e) {
    if (e.button === 0) mouse.down = true;
}

function handleMouseUp(e) {
    if (e.button === 0) mouse.down = false;
}

// Level Generation
function generateLevel(levelIndex) {
    rooms = [];
    enemies = [];
    items = [];
    projectiles = [];
    enemyProjectiles = [];
    particles = [];

    const levelConfigs = [
        { name: 'Cargo Bay', roomCount: 15, theme: 'industrial', enemies: { drone: 1.0 }, totalEnemies: 30 },
        { name: 'Engineering', roomCount: 20, theme: 'machinery', enemies: { drone: 0.7, brute: 0.3 }, totalEnemies: 45 },
        { name: "Queen's Lair", roomCount: 15, theme: 'organic', enemies: { drone: 0.6, brute: 0.4 }, totalEnemies: 40, hasBoss: true }
    ];

    const config = levelConfigs[levelIndex] || levelConfigs[0];

    // Generate room layout
    const gridSize = 7;
    const roomGrid = [];
    for (let i = 0; i < gridSize * gridSize; i++) {
        roomGrid.push(null);
    }

    // Start room at center
    const startIdx = Math.floor(gridSize / 2) * gridSize + Math.floor(gridSize / 2);
    roomGrid[startIdx] = { type: 'start', index: 0 };

    // Generate connected rooms using random walk
    let currentIdx = startIdx;
    let roomsGenerated = 1;
    const directions = [-1, 1, -gridSize, gridSize];

    while (roomsGenerated < config.roomCount) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newIdx = currentIdx + dir;

        // Check bounds
        if (newIdx < 0 || newIdx >= gridSize * gridSize) continue;
        if (dir === -1 && currentIdx % gridSize === 0) continue;
        if (dir === 1 && currentIdx % gridSize === gridSize - 1) continue;

        if (!roomGrid[newIdx]) {
            const roomType = roomsGenerated === config.roomCount - 1 ? 'exit' :
                           roomsGenerated === Math.floor(config.roomCount / 2) ? 'keycard' : 'normal';
            roomGrid[newIdx] = { type: roomType, index: roomsGenerated };
            roomsGenerated++;
        }
        currentIdx = newIdx;
    }

    // Create actual rooms
    for (let i = 0; i < gridSize * gridSize; i++) {
        if (!roomGrid[i]) continue;

        const gridX = i % gridSize;
        const gridY = Math.floor(i / gridSize);

        const roomWidth = 12 + Math.floor(Math.random() * 5); // 12-16 tiles
        const roomHeight = 10 + Math.floor(Math.random() * 5); // 10-14 tiles

        const room = {
            id: roomGrid[i].index,
            type: roomGrid[i].type,
            x: gridX * 20 * TILE_SIZE,
            y: gridY * 20 * TILE_SIZE,
            width: roomWidth * TILE_SIZE,
            height: roomHeight * TILE_SIZE,
            tiles: [],
            doors: [],
            cleared: roomGrid[i].type === 'start',
            theme: config.theme,
            label: getRoomLabel(roomGrid[i].type, roomGrid[i].index)
        };

        // Generate room tiles
        generateRoomTiles(room, roomWidth, roomHeight);

        // Find adjacent rooms and add doors
        for (const dir of directions) {
            const adjIdx = i + dir;
            if (adjIdx >= 0 && adjIdx < gridSize * gridSize && roomGrid[adjIdx]) {
                // Check bounds for horizontal movement
                if (dir === -1 && i % gridSize === 0) continue;
                if (dir === 1 && i % gridSize === gridSize - 1) continue;

                const doorX = dir === -1 ? room.x : dir === 1 ? room.x + room.width - TILE_SIZE : room.x + room.width / 2;
                const doorY = dir === -gridSize ? room.y : dir === gridSize ? room.y + room.height - TILE_SIZE : room.y + room.height / 2;

                const requiresKeycard = (room.type === 'exit' || roomGrid[adjIdx].type === 'exit');

                room.doors.push({
                    x: doorX,
                    y: doorY,
                    targetRoom: roomGrid[adjIdx].index,
                    direction: dir,
                    requiresKeycard: requiresKeycard,
                    open: false
                });
            }
        }

        // Add enemies (not in start room)
        if (room.type !== 'start') {
            const enemyCount = 3 + Math.floor(Math.random() * 5);
            for (let e = 0; e < enemyCount; e++) {
                const type = Math.random() < config.enemies.drone ? 'drone' : 'brute';
                room.enemies = room.enemies || [];
                room.enemies.push({
                    type: type,
                    x: room.x + TILE_SIZE * 2 + Math.random() * (room.width - TILE_SIZE * 4),
                    y: room.y + TILE_SIZE * 2 + Math.random() * (room.height - TILE_SIZE * 4)
                });
            }
        }

        // Add items
        if (room.type === 'keycard') {
            items.push({
                type: 'keycard',
                keyType: 'blue',
                x: room.x + room.width / 2,
                y: room.y + room.height / 2,
                room: room.id
            });
        }

        // Random pickups
        if (Math.random() < 0.4 && room.type !== 'start') {
            const pickupType = Math.random() < 0.6 ? 'ammo' : 'health';
            items.push({
                type: pickupType,
                x: room.x + TILE_SIZE * 2 + Math.random() * (room.width - TILE_SIZE * 4),
                y: room.y + TILE_SIZE * 2 + Math.random() * (room.height - TILE_SIZE * 4),
                room: room.id
            });
        }

        // Weapon pickups
        if (levelIndex === 0 && room.id === 3 && player.weapons.length === 1) {
            items.push({
                type: 'weapon',
                weaponType: 'shotgun',
                x: room.x + room.width / 2,
                y: room.y + room.height / 2,
                room: room.id
            });
        }
        if (levelIndex === 1 && room.id === 5) {
            items.push({
                type: 'weapon',
                weaponType: 'rifle',
                x: room.x + room.width / 2,
                y: room.y + room.height / 2,
                room: room.id
            });
        }
        if (levelIndex === 1 && room.id === 10) {
            items.push({
                type: 'weapon',
                weaponType: 'flamethrower',
                x: room.x + room.width / 2 + 50,
                y: room.y + room.height / 2,
                room: room.id
            });
        }

        // Add explosive barrels (random placement)
        if (Math.random() < 0.5 && room.type !== 'start') {
            const barrelCount = 1 + Math.floor(Math.random() * 2);
            for (let b = 0; b < barrelCount; b++) {
                items.push({
                    type: 'barrel',
                    x: room.x + TILE_SIZE * 2 + Math.random() * (room.width - TILE_SIZE * 4),
                    y: room.y + TILE_SIZE * 2 + Math.random() * (room.height - TILE_SIZE * 4),
                    room: room.id,
                    hp: 20
                });
            }
        }

        // Boss room on level 3
        if (levelIndex === 2 && room.type === 'exit') {
            room.isBossRoom = true;
            room.enemies = room.enemies || [];
            room.enemies.push({
                type: 'queen',
                x: room.x + room.width / 2,
                y: room.y + room.height / 2
            });
        }

        rooms.push(room);
    }

    // Sort rooms by index
    rooms.sort((a, b) => a.id - b.id);

    // Place player in start room
    const startRoom = rooms.find(r => r.type === 'start');
    if (startRoom) {
        player.x = startRoom.x + startRoom.width / 2;
        player.y = startRoom.y + startRoom.height / 2;
        currentRoom = startRoom;
    }

    currentLevel = levelIndex;
    clearedRooms = new Set([0]); // Start room is cleared
}

function getRoomLabel(type, index) {
    const labels = ['CARGO', 'STORAGE', 'MAINT', 'BAY', 'DUCT', 'SECTOR'];
    if (type === 'start') return 'START';
    if (type === 'exit') return 'EXIT';
    if (type === 'keycard') return 'SECURITY';
    return labels[index % labels.length] + ' ' + (index + 1);
}

function generateRoomTiles(room, width, height) {
    room.tiles = [];
    room.walls = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const worldX = room.x + x * TILE_SIZE;
            const worldY = room.y + y * TILE_SIZE;

            // Walls on edges
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                room.walls.push({ x: worldX, y: worldY, w: TILE_SIZE, h: TILE_SIZE });
                room.tiles.push({ x: worldX, y: worldY, type: 'wall' });
            } else {
                room.tiles.push({ x: worldX, y: worldY, type: 'floor' });
            }
        }
    }

    // Add some obstacles/crates
    const obstacleCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < obstacleCount; i++) {
        const ox = 2 + Math.floor(Math.random() * (width - 4));
        const oy = 2 + Math.floor(Math.random() * (height - 4));
        const worldX = room.x + ox * TILE_SIZE;
        const worldY = room.y + oy * TILE_SIZE;
        room.walls.push({ x: worldX, y: worldY, w: TILE_SIZE, h: TILE_SIZE, destructible: true, hp: 20 });
    }
}

function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];

    if (weapon.currentMag === data.magSize) return;
    if (player.reloadTimer > 0) return;

    if (!data.infiniteAmmo) {
        const ammoType = data.ammoType;
        if (player.ammo[ammoType] <= 0) return;
    }

    player.reloadTimer = data.reloadTime;
}

function finishReload() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];

    if (data.infiniteAmmo) {
        weapon.currentMag = data.magSize;
    } else {
        const ammoType = data.ammoType;
        const needed = data.magSize - weapon.currentMag;
        const available = Math.min(needed, player.ammo[ammoType]);
        weapon.currentMag += available;
        player.ammo[ammoType] -= available;
    }
}

function interact() {
    // Check for doors
    for (const room of rooms) {
        for (const door of room.doors) {
            const dx = player.x - door.x;
            const dy = player.y - door.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                if (door.requiresKeycard && !player.keycards.blue) {
                    addFloatingText(player.x, player.y - 30, 'Need Blue Keycard!', '#FF4444');
                    return;
                }
                door.open = true;

                // Move to adjacent room
                const targetRoom = rooms.find(r => r.id === door.targetRoom);
                if (targetRoom) {
                    // Check if this is the exit door to next level
                    if (targetRoom.type === 'exit' && clearedRooms.has(targetRoom.id)) {
                        nextLevel();
                        return;
                    }

                    enterRoom(targetRoom);
                }
            }
        }
    }
}

function enterRoom(room) {
    currentRoom = room;

    // Spawn enemies if room not cleared
    if (!clearedRooms.has(room.id) && room.enemies) {
        for (const enemyData of room.enemies) {
            spawnEnemy(enemyData.type, enemyData.x, enemyData.y);
        }
        room.enemies = []; // Clear spawn data
    }
}

function spawnEnemy(type, x, y) {
    const enemyStats = {
        drone: { hp: 20, damage: 10, speed: 120, radius: 10, color: '#222', detectionRange: 300 },
        brute: { hp: 100, damage: 30, speed: 60, radius: 20, color: '#442', detectionRange: 250, chargeSpeed: 250 },
        queen: { hp: 500, damage: 40, speed: 80, radius: 40, color: '#440044', detectionRange: 400, chargeSpeed: 150 }
    };

    const stats = enemyStats[type];
    enemies.push({
        type: type,
        x: x,
        y: y,
        hp: stats.hp,
        maxHp: stats.hp,
        damage: stats.damage,
        speed: stats.speed,
        radius: stats.radius,
        color: stats.color,
        detectionRange: stats.detectionRange,
        chargeSpeed: stats.chargeSpeed,
        angle: Math.random() * Math.PI * 2,
        state: 'idle',
        attackCooldown: 0,
        chargeTimer: 0,
        stunTimer: 0
    });
}

function nextLevel() {
    if (currentLevel >= 2) {
        // Check if boss is defeated
        const bossAlive = enemies.some(e => e.type === 'queen');
        if (!bossAlive) {
            currentState = GameState.VICTORY;
        }
        return;
    }

    // Reset keycard for next level
    player.keycards.blue = false;
    generateLevel(currentLevel + 1);
}

function resetGame() {
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.keycards = { blue: false };
    player.weapons = [{ type: 'pistol', currentMag: 12 }];
    player.currentWeapon = 0;
    player.ammo = { shells: 24, rifle: 90, fuel: 200 };
    player.credits = 0;

    generateLevel(0);
}

// Update functions
let lastTime = 0;
let shootTimer = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    frameCount++;

    // FPS calculation
    fpsTimer += dt;
    if (fpsTimer >= 1) {
        lastFps = Math.round(frameCount / fpsTimer);
        frameCount = 0;
        fpsTimer = 0;
    }

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (currentState !== GameState.PLAYING) return;

    updatePlayer(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateScreenShake(dt);
    updateCamera(dt);
    checkCollisions();
    checkPickups();
    checkRoomCleared();
}

function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Sprint
    let speed = player.speed;
    if (keys['shift'] && player.stamina > 0 && (dx !== 0 || dy !== 0)) {
        speed = player.sprintSpeed;
        player.stamina -= 25 * dt;
    } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 20 * dt);
    }

    const newX = player.x + dx * speed * dt;
    const newY = player.y + dy * speed * dt;

    // Collision check with walls
    if (!checkWallCollision(newX, player.y, player.radius)) {
        player.x = newX;
    }
    if (!checkWallCollision(player.x, newY, player.radius)) {
        player.y = newY;
    }

    // Aim at mouse (convert screen mouse to world position)
    const worldMouseX = mouse.x - canvas.width / 2 + camera.x;
    const worldMouseY = mouse.y - canvas.height / 2 + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Shooting
    shootTimer -= dt;
    if (player.reloadTimer > 0) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            finishReload();
        }
    } else if (mouse.down && shootTimer <= 0) {
        shoot();
    }

    // Invincibility timer
    if (player.invincibleTimer > 0) {
        player.invincibleTimer -= dt;
    }
}

function checkWallCollision(x, y, radius) {
    if (!currentRoom) return false;

    // Check room walls
    for (const wall of currentRoom.walls) {
        if (circleRectCollision(x, y, radius, wall.x, wall.y, wall.w, wall.h)) {
            return true;
        }
    }

    // Check room boundaries
    if (x - radius < currentRoom.x || x + radius > currentRoom.x + currentRoom.width ||
        y - radius < currentRoom.y || y + radius > currentRoom.y + currentRoom.height) {
        return true;
    }

    return false;
}

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
}

function shoot() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];

    if (weapon.currentMag <= 0) {
        // Out of ammo message - once per second
        if (Date.now() - player.lastOutOfAmmoMsg > 1000) {
            addFloatingText(player.x, player.y - 30, 'Out of ammo! [R] to reload', '#FF6666');
            player.lastOutOfAmmoMsg = Date.now();
        }
        return;
    }

    weapon.currentMag--;
    shootTimer = data.fireRate;

    // Screen shake
    screenShake.intensity = data.shake.intensity * 0.5; // Reduced by 50%
    screenShake.duration = data.shake.duration;

    // Muzzle flash particle
    const muzzleDist = 24;
    particles.push({
        x: player.x + Math.cos(player.angle) * muzzleDist,
        y: player.y + Math.sin(player.angle) * muzzleDist,
        type: 'muzzle',
        life: 0.05,
        color: data.color
    });

    // Fire projectiles
    const pelletCount = data.pellets || 1;
    for (let i = 0; i < pelletCount; i++) {
        const spreadRad = (data.spread * Math.PI / 180) * (Math.random() - 0.5);
        const angle = player.angle + spreadRad;

        projectiles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(angle) * data.projectileSpeed,
            vy: Math.sin(angle) * data.projectileSpeed,
            damage: data.damage,
            range: data.range,
            traveled: 0,
            color: data.color,
            isFlame: data.isFlame
        });
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const oldX = p.x, oldY = p.y;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.traveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;

        // Check range
        if (p.traveled > p.range) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check wall collision
        if (checkWallCollision(p.x, p.y, 2)) {
            // Spawn hit particles
            for (let j = 0; j < 5; j++) {
                particles.push({
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200,
                    life: 0.3,
                    type: 'spark',
                    color: '#FFD700'
                });
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Check enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < e.radius + 4) {
                e.hp -= p.damage;

                // Knockback (except brutes)
                if (e.type !== 'brute') {
                    const knockback = 50 + p.damage * 2;
                    e.x += (dx / dist) * knockback * dt * 10;
                    e.y += (dy / dist) * knockback * dt * 10;
                }

                // Blood particles
                for (let k = 0; k < 8; k++) {
                    particles.push({
                        x: e.x,
                        y: e.y,
                        vx: (Math.random() - 0.5) * 150 + dx * 2,
                        vy: (Math.random() - 0.5) * 150 + dy * 2,
                        life: 0.5,
                        type: 'blood',
                        color: '#00FF88' // Alien blood
                    });
                }

                // Check if dead
                if (e.hp <= 0) {
                    // Drop loot
                    const dropRoll = Math.random();
                    if (e.type === 'drone' && dropRoll < 0.2) {
                        items.push({ type: 'ammo', x: e.x, y: e.y, room: currentRoom.id });
                    } else if (e.type === 'brute' && dropRoll < 0.4) {
                        items.push({ type: 'ammo', x: e.x, y: e.y, room: currentRoom.id });
                    }
                    if ((e.type === 'drone' && dropRoll < 0.1) || (e.type === 'brute' && dropRoll < 0.3)) {
                        items.push({ type: 'health', x: e.x, y: e.y, room: currentRoom.id });
                    }

                    enemies.splice(j, 1);
                    player.credits += e.type === 'drone' ? 10 : 25;
                }

                if (!p.isFlame) {
                    projectiles.splice(i, 1);
                }
                break;
            }
        }

        // Check barrel collision
        for (let j = items.length - 1; j >= 0; j--) {
            const item = items[j];
            if (item.type !== 'barrel') continue;

            const dx = p.x - item.x;
            const dy = p.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 16) {
                item.hp -= p.damage;

                // Spark particles
                for (let k = 0; k < 3; k++) {
                    particles.push({
                        x: item.x,
                        y: item.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.2,
                        type: 'spark',
                        color: '#FF8800'
                    });
                }

                // Barrel explodes
                if (item.hp <= 0) {
                    explodeBarrel(item.x, item.y);
                    items.splice(j, 1);
                }

                if (!p.isFlame) {
                    projectiles.splice(i, 1);
                }
                break;
            }
        }
    }

    // Enemy projectiles
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.traveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;

        if (p.traveled > 500 || checkWallCollision(p.x, p.y, 2)) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // Check player collision
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < player.radius + 4) {
            damagePlayer(p.damage);
            enemyProjectiles.splice(i, 1);
        }
    }
}

function updateEnemies(dt) {
    for (const e of enemies) {
        if (e.stunTimer > 0) {
            e.stunTimer -= dt;
            continue;
        }

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Update angle to face player
        if (dist < e.detectionRange) {
            e.angle = Math.atan2(dy, dx);
            e.state = 'chasing';
        }

        // Movement
        if (e.state === 'chasing') {
            let speed = e.speed;

            // Brute charge
            if (e.type === 'brute' && dist < 200) {
                e.chargeTimer += dt;
                if (e.chargeTimer > 1) {
                    e.state = 'charging';
                    e.chargeTimer = 0;
                }
            }

            if (e.state === 'charging') {
                speed = e.chargeSpeed;
                e.chargeTimer += dt;
                if (e.chargeTimer > 1.5) {
                    e.state = 'chasing';
                    e.chargeTimer = 0;
                    e.stunTimer = 1;
                }
            }

            if (dist > e.radius + player.radius + 5) {
                const moveX = (dx / dist) * speed * dt;
                const moveY = (dy / dist) * speed * dt;

                // Smooth wall sliding
                if (!checkWallCollision(e.x + moveX, e.y, e.radius)) {
                    e.x += moveX;
                }
                if (!checkWallCollision(e.x, e.y + moveY, e.radius)) {
                    e.y += moveY;
                }
            }
        }

        // Attack
        e.attackCooldown -= dt;
        if (dist < e.radius + player.radius + 10 && e.attackCooldown <= 0) {
            damagePlayer(e.damage);
            e.attackCooldown = 1;
        }
    }
}

function explodeBarrel(x, y) {
    const explosionRadius = 100;
    const explosionDamage = 80;

    // Screen shake
    screenShake.intensity = 12;
    screenShake.duration = 0.3;

    // Explosion particles
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 300;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.5,
            type: 'explosion',
            color: ['#FF4400', '#FF8800', '#FFCC00', '#FF0000'][Math.floor(Math.random() * 4)]
        });
    }

    // Fire particles
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * explosionRadius * 0.5;
        particles.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 50,
            vy: -50 - Math.random() * 100,
            life: 0.3 + Math.random() * 0.4,
            type: 'fire',
            color: '#FF6600'
        });
    }

    // Damage enemies in radius
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx = e.x - x;
        const dy = e.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < explosionRadius) {
            const damage = explosionDamage * (1 - dist / explosionRadius);
            e.hp -= damage;

            // Knockback
            if (dist > 0) {
                e.x += (dx / dist) * 80;
                e.y += (dy / dist) * 80;
            }

            if (e.hp <= 0) {
                enemies.splice(i, 1);
                player.credits += e.type === 'drone' ? 10 : 25;
            }
        }
    }

    // Damage player if in radius
    const pdx = player.x - x;
    const pdy = player.y - y;
    const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pDist < explosionRadius) {
        const damage = explosionDamage * (1 - pDist / explosionRadius) * 0.5;
        damagePlayer(Math.floor(damage));
    }

    // Chain reaction - explode nearby barrels
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.type !== 'barrel') continue;

        const bdx = item.x - x;
        const bdy = item.y - y;
        const bDist = Math.sqrt(bdx * bdx + bdy * bdy);

        if (bDist < explosionRadius && bDist > 0) {
            item.hp = 0;
            // Delay chain explosion slightly
            setTimeout(() => {
                const idx = items.indexOf(item);
                if (idx > -1) {
                    items.splice(idx, 1);
                    explodeBarrel(item.x, item.y);
                }
            }, 100);
        }
    }

    addFloatingText(x, y - 20, 'BOOM!', '#FF4400');
}

function damagePlayer(amount) {
    if (player.invincibleTimer > 0) return;

    player.health -= amount;
    player.invincibleTimer = 0.5;

    // Screen shake
    screenShake.intensity = 5;
    screenShake.duration = 0.2;

    // Blood particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.5,
            type: 'blood',
            color: '#CC0000'
        });
    }

    if (player.health <= 0) {
        currentState = GameState.GAME_OVER;
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;

        if (p.vx !== undefined) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= dt;
        ft.y -= 30 * dt;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.5 });
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

function updateCamera(dt) {
    camera.targetX = player.x;
    camera.targetY = player.y;
    camera.x += (camera.targetX - camera.x) * camera.lerp;
    camera.y += (camera.targetY - camera.y) * camera.lerp;
}

function checkCollisions() {
    // Already handled in updateProjectiles and updateEnemies
}

function checkPickups() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.pickupRadius) {
            let pickedUp = false;

            switch (item.type) {
                case 'health':
                    if (player.health < player.maxHealth) {
                        player.health = Math.min(player.maxHealth, player.health + 25);
                        addFloatingText(item.x, item.y, '+25 Health', '#FF4444');
                        pickedUp = true;
                    }
                    break;

                case 'ammo':
                    // Add random ammo
                    const ammoTypes = Object.keys(player.ammo);
                    const aType = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                    const amounts = { shells: 8, rifle: 30, fuel: 50 };
                    if (player.ammo[aType] < player.maxAmmo[aType]) {
                        player.ammo[aType] = Math.min(player.maxAmmo[aType], player.ammo[aType] + amounts[aType]);
                        addFloatingText(item.x, item.y, `+${amounts[aType]} ${aType}`, '#FFDD00');
                        pickedUp = true;
                    }
                    break;

                case 'keycard':
                    player.keycards[item.keyType] = true;
                    addFloatingText(item.x, item.y, 'Blue Keycard!', '#0088FF');
                    pickedUp = true;
                    break;

                case 'weapon':
                    if (!player.weapons.find(w => w.type === item.weaponType)) {
                        player.weapons.push({
                            type: item.weaponType,
                            currentMag: weaponData[item.weaponType].magSize
                        });
                        addFloatingText(item.x, item.y, `${weaponData[item.weaponType].name}!`, '#00FFFF');
                        pickedUp = true;
                    }
                    break;
            }

            if (pickedUp) {
                items.splice(i, 1);
            }
        }
    }
}

function checkRoomCleared() {
    if (!currentRoom) return;

    // Check if all enemies in current room are dead
    const roomEnemies = enemies.filter(e => {
        return e.x >= currentRoom.x && e.x <= currentRoom.x + currentRoom.width &&
               e.y >= currentRoom.y && e.y <= currentRoom.y + currentRoom.height;
    });

    if (roomEnemies.length === 0 && !clearedRooms.has(currentRoom.id)) {
        clearedRooms.add(currentRoom.id);
        currentRoom.cleared = true;
        addFloatingText(player.x, player.y - 50, 'Room Cleared!', '#00FF00');
    }
}

// Rendering
function render() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentState === GameState.MENU) {
        renderMenu();
        return;
    }

    if (currentState === GameState.PAUSED) {
        renderGame();
        renderPauseMenu();
        return;
    }

    if (currentState === GameState.GAME_OVER) {
        renderGame();
        renderGameOver();
        return;
    }

    if (currentState === GameState.VICTORY) {
        renderGame();
        renderVictory();
        return;
    }

    renderGame();
}

function renderGame() {
    ctx.save();

    // Apply camera transform with screen shake
    ctx.translate(
        canvas.width / 2 - camera.x + screenShake.x,
        canvas.height / 2 - camera.y + screenShake.y
    );

    // Render visible rooms and create vision mask
    renderRooms();
    renderItems();
    renderEnemies();
    renderProjectiles();
    renderParticles();
    renderPlayer();
    renderFloatingTexts();

    // Apply vision darkness overlay
    renderVisionOverlay();

    ctx.restore();

    // Render HUD (screen space)
    renderHUD();

    if (debugMode) {
        renderDebugOverlay();
    }
}

function renderRooms() {
    for (const room of rooms) {
        // Only render rooms near player
        const dx = player.x - (room.x + room.width / 2);
        const dy = player.y - (room.y + room.height / 2);
        if (Math.abs(dx) > 800 || Math.abs(dy) > 600) continue;

        // Floor - Metallic industrial style like Alien Breed
        for (const tile of room.tiles) {
            if (tile.type === 'floor') {
                const tx = Math.floor(tile.x / TILE_SIZE);
                const ty = Math.floor(tile.y / TILE_SIZE);

                // Base floor - brownish gray metallic
                const baseColor = room.theme === 'organic' ? '#1A1520' :
                                  room.theme === 'machinery' ? '#2A2828' : '#2E2A26';
                ctx.fillStyle = baseColor;
                ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);

                // Metal plate pattern
                const plateMargin = 2;
                const plateColor = room.theme === 'organic' ? '#252030' :
                                   room.theme === 'machinery' ? '#383634' : '#3A3632';
                ctx.fillStyle = plateColor;
                ctx.fillRect(tile.x + plateMargin, tile.y + plateMargin,
                            TILE_SIZE - plateMargin * 2, TILE_SIZE - plateMargin * 2);

                // Rivets at corners
                ctx.fillStyle = '#1A1816';
                const rivetSize = 3;
                ctx.beginPath();
                ctx.arc(tile.x + 5, tile.y + 5, rivetSize, 0, Math.PI * 2);
                ctx.arc(tile.x + TILE_SIZE - 5, tile.y + 5, rivetSize, 0, Math.PI * 2);
                ctx.arc(tile.x + 5, tile.y + TILE_SIZE - 5, rivetSize, 0, Math.PI * 2);
                ctx.arc(tile.x + TILE_SIZE - 5, tile.y + TILE_SIZE - 5, rivetSize, 0, Math.PI * 2);
                ctx.fill();

                // Occasional floor detail (grate, vent, etc.)
                if ((tx + ty * 3) % 7 === 0) {
                    ctx.strokeStyle = '#222018';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 4; i++) {
                        ctx.beginPath();
                        ctx.moveTo(tile.x + 8, tile.y + 8 + i * 5);
                        ctx.lineTo(tile.x + TILE_SIZE - 8, tile.y + 8 + i * 5);
                        ctx.stroke();
                    }
                }
            }
        }

        // Walls - Industrial metal panels
        for (const wall of room.walls) {
            if (wall.destructible) {
                // Crate - orange/brown with metal bands
                ctx.fillStyle = '#6A4A20';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // Metal bands
                ctx.fillStyle = '#4A3210';
                ctx.fillRect(wall.x, wall.y + 4, wall.w, 4);
                ctx.fillRect(wall.x, wall.y + wall.h - 8, wall.w, 4);
                ctx.fillRect(wall.x + 4, wall.y, 4, wall.h);
                ctx.fillRect(wall.x + wall.w - 8, wall.y, 4, wall.h);

                // Highlight
                ctx.fillStyle = '#8A6A40';
                ctx.fillRect(wall.x + 8, wall.y + 8, wall.w - 16, 2);
            } else {
                // Wall - dark gray metal with panel detail
                ctx.fillStyle = '#4A4846';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // Inner panel
                ctx.fillStyle = '#3A3836';
                ctx.fillRect(wall.x + 3, wall.y + 3, wall.w - 6, wall.h - 6);

                // Panel lines
                ctx.strokeStyle = '#2A2826';
                ctx.lineWidth = 1;
                ctx.strokeRect(wall.x + 6, wall.y + 6, wall.w - 12, wall.h - 12);

                // Occasional warning stripes
                const wx = Math.floor(wall.x / TILE_SIZE);
                const wy = Math.floor(wall.y / TILE_SIZE);
                if ((wx + wy) % 5 === 0) {
                    ctx.fillStyle = '#FF8800';
                    ctx.fillRect(wall.x + 2, wall.y + wall.h - 6, 8, 4);
                    ctx.fillRect(wall.x + 14, wall.y + wall.h - 6, 8, 4);
                }
            }
        }

        // Room label - sci-fi style
        ctx.fillStyle = '#556';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(room.label, room.x + 8, room.y + 18);

        // Underline
        ctx.fillStyle = '#334';
        ctx.fillRect(room.x + 8, room.y + 20, room.label.length * 6, 1);

        // Doors - heavy blast doors
        for (const door of room.doors) {
            const isVertical = door.direction === -1 || door.direction === 1;

            // Door frame
            ctx.fillStyle = '#333';
            if (isVertical) {
                ctx.fillRect(door.x - 8, door.y - TILE_SIZE - 4, 16, TILE_SIZE * 2 + 8);
            } else {
                ctx.fillRect(door.x - TILE_SIZE - 4, door.y - 8, TILE_SIZE * 2 + 8, 16);
            }

            // Door itself
            if (door.open) {
                ctx.fillStyle = '#1A1A1A';
            } else if (door.requiresKeycard) {
                ctx.fillStyle = '#0066CC';
            } else {
                ctx.fillStyle = '#666';
            }

            if (isVertical) {
                ctx.fillRect(door.x - 5, door.y - TILE_SIZE, 10, TILE_SIZE * 2);
                // Door panels
                if (!door.open) {
                    ctx.fillStyle = door.requiresKeycard ? '#0088FF' : '#888';
                    ctx.fillRect(door.x - 3, door.y - TILE_SIZE + 4, 6, TILE_SIZE - 8);
                    ctx.fillRect(door.x - 3, door.y + 4, 6, TILE_SIZE - 8);
                }
            } else {
                ctx.fillRect(door.x - TILE_SIZE, door.y - 5, TILE_SIZE * 2, 10);
                if (!door.open) {
                    ctx.fillStyle = door.requiresKeycard ? '#0088FF' : '#888';
                    ctx.fillRect(door.x - TILE_SIZE + 4, door.y - 3, TILE_SIZE - 8, 6);
                    ctx.fillRect(door.x + 4, door.y - 3, TILE_SIZE - 8, 6);
                }
            }

            // Keycard indicator light
            if (door.requiresKeycard && !door.open) {
                ctx.fillStyle = player.keycards.blue ? '#00FF00' : '#FF0000';
                ctx.beginPath();
                ctx.arc(door.x, door.y - (isVertical ? TILE_SIZE + 8 : 12), 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Door interaction prompt
            const pdx = player.x - door.x;
            const pdy = player.y - door.y;
            if (Math.sqrt(pdx * pdx + pdy * pdy) < 60 && !door.open) {
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 11px monospace';
                ctx.textAlign = 'center';
                const promptText = door.requiresKeycard && !player.keycards.blue ?
                    'NEED KEYCARD' : '[SPACE] OPEN';
                ctx.fillText(promptText, door.x, door.y - 25);
                ctx.textAlign = 'left';
            }
        }
    }
}

function renderItems() {
    for (const item of items) {
        let color, size = 12;

        switch (item.type) {
            case 'health':
                color = '#FF4444';
                // Cross shape with white outline
                ctx.fillStyle = '#FFF';
                ctx.fillRect(item.x - 5, item.y - 13, 10, 26);
                ctx.fillRect(item.x - 13, item.y - 5, 26, 10);
                ctx.fillStyle = color;
                ctx.fillRect(item.x - 4, item.y - 12, 8, 24);
                ctx.fillRect(item.x - 12, item.y - 4, 24, 8);
                continue;

            case 'ammo':
                color = '#FFDD00';
                ctx.fillStyle = '#886600';
                ctx.fillRect(item.x - 9, item.y - 7, 18, 14);
                ctx.fillStyle = color;
                ctx.fillRect(item.x - 8, item.y - 6, 16, 12);
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(item.x - 6, item.y - 4, 4, 8);
                ctx.fillRect(item.x + 2, item.y - 4, 4, 8);
                continue;

            case 'keycard':
                color = '#0088FF';
                ctx.fillStyle = '#004488';
                ctx.fillRect(item.x - 16, item.y - 11, 32, 22);
                ctx.fillStyle = color;
                ctx.fillRect(item.x - 15, item.y - 10, 30, 20);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(item.x - 12, item.y - 4, 8, 8);
                // Chip pattern
                ctx.fillStyle = '#0066AA';
                ctx.fillRect(item.x + 2, item.y - 6, 10, 12);
                continue;

            case 'weapon':
                color = '#00FFFF';
                ctx.fillStyle = '#006666';
                ctx.fillRect(item.x - 21, item.y - 7, 42, 14);
                ctx.fillStyle = color;
                ctx.fillRect(item.x - 20, item.y - 6, 40, 12);
                ctx.fillStyle = '#008888';
                ctx.fillRect(item.x + 10, item.y - 4, 8, 8);
                // Glow effect
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(item.x, item.y, 25, 0, Math.PI * 2);
                ctx.fill();
                continue;

            case 'barrel':
                // Explosive barrel - red with warning
                ctx.fillStyle = '#660000';
                ctx.beginPath();
                ctx.ellipse(item.x, item.y + 2, 14, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#AA2200';
                ctx.fillRect(item.x - 12, item.y - 16, 24, 20);

                ctx.fillStyle = '#CC3300';
                ctx.fillRect(item.x - 10, item.y - 14, 20, 16);

                // Top
                ctx.fillStyle = '#882200';
                ctx.beginPath();
                ctx.ellipse(item.x, item.y - 16, 10, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Warning symbol
                ctx.fillStyle = '#FFCC00';
                ctx.beginPath();
                ctx.moveTo(item.x, item.y - 12);
                ctx.lineTo(item.x - 6, item.y - 2);
                ctx.lineTo(item.x + 6, item.y - 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.fillRect(item.x - 1, item.y - 9, 2, 4);
                ctx.fillRect(item.x - 1, item.y - 4, 2, 2);

                // Health bar if damaged
                if (item.hp < 20) {
                    ctx.fillStyle = '#400';
                    ctx.fillRect(item.x - 12, item.y - 24, 24, 4);
                    ctx.fillStyle = '#F80';
                    ctx.fillRect(item.x - 12, item.y - 24, 24 * (item.hp / 20), 4);
                }
                continue;
        }
    }
}

function renderEnemies() {
    for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        const animOffset = Math.sin(frameCount * 0.2) * 2; // Leg animation

        if (e.type === 'drone') {
            // Spider-like alien - black with multiple legs like reference
            // Legs first (behind body)
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // 8 legs - 4 on each side
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 4; i++) {
                    const baseAngle = (i / 4) * 0.8 - 0.2;
                    const legAngle = baseAngle * Math.PI * side;
                    const legWave = Math.sin(frameCount * 0.3 + i + side) * 3;

                    // First segment
                    const midX = Math.cos(legAngle + Math.PI/2 * side) * (e.radius * 0.8);
                    const midY = Math.sin(legAngle + Math.PI/2 * side) * (e.radius * 0.6) + legWave;

                    // Second segment (tip)
                    const tipX = midX + Math.cos(legAngle + Math.PI/3 * side) * (e.radius * 0.8);
                    const tipY = midY + Math.sin(legAngle + Math.PI/3 * side) * (e.radius * 0.5);

                    ctx.beginPath();
                    ctx.moveTo(0, side * 3);
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(tipX, tipY);
                    ctx.stroke();
                }
            }

            // Body - glossy black
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius, e.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body shine
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(-e.radius * 0.2, -e.radius * 0.2, e.radius * 0.4, e.radius * 0.25, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Head segment
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.ellipse(e.radius * 0.6, 0, e.radius * 0.5, e.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Mandibles
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.9, -2);
            ctx.lineTo(e.radius * 1.3, -4);
            ctx.moveTo(e.radius * 0.9, 2);
            ctx.lineTo(e.radius * 1.3, 4);
            ctx.stroke();

            // Glowing red eyes
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(e.radius * 0.7, -3, 2, 0, Math.PI * 2);
            ctx.arc(e.radius * 0.7, 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

        } else if (e.type === 'brute') {
            // Larger armored alien - tank type
            // Thick legs
            ctx.strokeStyle = '#1A1008';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';

            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 3; i++) {
                    const legAngle = ((i / 3) * 0.6 - 0.1) * Math.PI * side;
                    const legWave = Math.sin(frameCount * 0.15 + i) * 2;

                    const midX = Math.cos(legAngle + Math.PI/2 * side) * (e.radius * 0.7);
                    const midY = Math.sin(legAngle + Math.PI/2 * side) * (e.radius * 0.5) + legWave;
                    const tipX = midX + Math.cos(legAngle + Math.PI/4 * side) * (e.radius * 0.6);
                    const tipY = midY + Math.sin(legAngle + Math.PI/4 * side) * (e.radius * 0.4);

                    ctx.beginPath();
                    ctx.moveTo(0, side * 5);
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(tipX, tipY);
                    ctx.stroke();
                }
            }

            // Armored body
            ctx.fillStyle = '#2A1808';
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius, e.radius * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();

            // Armor plates
            ctx.fillStyle = '#3A2818';
            ctx.beginPath();
            ctx.ellipse(-e.radius * 0.2, 0, e.radius * 0.6, e.radius * 0.5, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Carapace ridges
            ctx.strokeStyle = '#1A0800';
            ctx.lineWidth = 2;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.ellipse(0, i * 5, e.radius * 0.8, e.radius * 0.1, 0, Math.PI * 0.8, Math.PI * 0.2, true);
                ctx.stroke();
            }

            // Massive head
            ctx.fillStyle = '#2A1A0A';
            ctx.beginPath();
            ctx.ellipse(e.radius * 0.5, 0, e.radius * 0.6, e.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Large mandibles
            ctx.fillStyle = '#1A0A00';
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.9, -8);
            ctx.lineTo(e.radius * 1.5, -12);
            ctx.lineTo(e.radius * 1.4, -5);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.9, 8);
            ctx.lineTo(e.radius * 1.5, 12);
            ctx.lineTo(e.radius * 1.4, 5);
            ctx.closePath();
            ctx.fill();

            // Glowing eyes
            ctx.fillStyle = '#FF4400';
            ctx.shadowColor = '#FF4400';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(e.radius * 0.6, -8, 4, 0, Math.PI * 2);
            ctx.arc(e.radius * 0.6, 8, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

        } else if (e.type === 'queen') {
            // Boss - massive alien queen
            // Many legs
            ctx.strokeStyle = '#220022';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';

            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 5; i++) {
                    const legAngle = ((i / 5) * 0.7 - 0.15) * Math.PI * side;
                    const legWave = Math.sin(frameCount * 0.1 + i * 0.5) * 4;

                    const midX = Math.cos(legAngle + Math.PI/2 * side) * (e.radius * 0.8);
                    const midY = Math.sin(legAngle + Math.PI/2 * side) * (e.radius * 0.6) + legWave;
                    const tipX = midX + Math.cos(legAngle + Math.PI/3 * side) * (e.radius * 0.7);
                    const tipY = midY + Math.sin(legAngle + Math.PI/3 * side) * (e.radius * 0.5);

                    ctx.beginPath();
                    ctx.moveTo(0, side * 8);
                    ctx.lineTo(midX, midY);
                    ctx.lineTo(tipX, tipY);
                    ctx.stroke();
                }
            }

            // Massive body
            ctx.fillStyle = '#330033';
            ctx.beginPath();
            ctx.ellipse(0, 0, e.radius, e.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Egg sac (abdomen)
            ctx.fillStyle = '#2A002A';
            ctx.beginPath();
            ctx.ellipse(-e.radius * 0.5, 0, e.radius * 0.7, e.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pulsing patterns on body
            ctx.fillStyle = `rgba(100, 0, 100, ${0.3 + Math.sin(frameCount * 0.1) * 0.2})`;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(-e.radius * 0.3 + Math.random() * 10, (i - 2) * 12, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Crown/head crest
            ctx.fillStyle = '#440044';
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.3, -e.radius * 0.6);
            ctx.lineTo(e.radius * 0.8, -e.radius * 1.2);
            ctx.lineTo(e.radius * 0.6, -e.radius * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(e.radius * 0.3, e.radius * 0.6);
            ctx.lineTo(e.radius * 0.8, e.radius * 1.2);
            ctx.lineTo(e.radius * 0.6, e.radius * 0.4);
            ctx.closePath();
            ctx.fill();

            // Head
            ctx.fillStyle = '#3A003A';
            ctx.beginPath();
            ctx.ellipse(e.radius * 0.5, 0, e.radius * 0.5, e.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Multiple glowing eyes
            ctx.fillStyle = '#FF00FF';
            ctx.shadowColor = '#FF00FF';
            ctx.shadowBlur = 12;
            for (let i = 0; i < 6; i++) {
                const eyeAngle = (i / 6) * Math.PI * 0.8 - Math.PI * 0.4;
                const eyeX = e.radius * 0.5 + Math.cos(eyeAngle) * e.radius * 0.3;
                const eyeY = Math.sin(eyeAngle) * e.radius * 0.25;
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        ctx.restore();

        // Health bar for damaged enemies
        if (e.hp < e.maxHp) {
            const barWidth = e.radius * 2;
            const barHeight = 4;
            ctx.fillStyle = '#400';
            ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth, barHeight);
            ctx.fillStyle = e.type === 'queen' ? '#F0F' : '#F00';
            ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 12, barWidth * (e.hp / e.maxHp), barHeight);

            // Boss name
            if (e.type === 'queen') {
                ctx.fillStyle = '#F0F';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('QUEEN', e.x, e.y - e.radius - 18);
                ctx.textAlign = 'left';
            }
        }
    }
}

function renderProjectiles() {
    for (const p of projectiles) {
        if (p.isFlame) {
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.8)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            const trailLen = 20;
            const trailX = p.x - (p.vx / Math.sqrt(p.vx * p.vx + p.vy * p.vy)) * trailLen;
            const trailY = p.y - (p.vy / Math.sqrt(p.vx * p.vx + p.vy * p.vy)) * trailLen;

            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
        }
    }

    for (const p of enemyProjectiles) {
        ctx.fillStyle = '#00FF88';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = Math.min(1, p.life / 0.5);

        if (p.type === 'muzzle') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10 * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'spark') {
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'blood') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (p.type === 'explosion') {
            // Explosion particles - large fiery chunks
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 + alpha * 6, 0, Math.PI * 2);
            ctx.fill();
            // Glow effect
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8 + alpha * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (p.type === 'fire') {
            // Rising fire particles
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + alpha * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Flash when invincible
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(2, 2, player.radius + 2, player.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack/jetpack
    ctx.fillStyle = '#2A5A2A';
    ctx.fillRect(-player.radius * 0.8, -6, player.radius * 0.5, 12);
    ctx.fillStyle = '#1A4A1A';
    ctx.fillRect(-player.radius * 0.75, -4, player.radius * 0.3, 8);

    // Body (green armored suit like reference)
    ctx.fillStyle = '#3A7A3A';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Armor highlight
    ctx.fillStyle = '#4A9A4A';
    ctx.beginPath();
    ctx.arc(-player.radius * 0.2, -player.radius * 0.2, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder pads
    ctx.fillStyle = '#2A6A2A';
    ctx.beginPath();
    ctx.ellipse(-2, -player.radius * 0.7, player.radius * 0.4, player.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2, player.radius * 0.7, player.radius * 0.4, player.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#3A8A3A';
    ctx.beginPath();
    ctx.ellipse(player.radius * 0.3, 0, player.radius * 0.6, player.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helmet visor (yellow/orange like reference)
    ctx.fillStyle = '#DDAA33';
    ctx.beginPath();
    ctx.ellipse(player.radius * 0.5, 0, player.radius * 0.35, player.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Visor shine
    ctx.fillStyle = '#FFCC66';
    ctx.beginPath();
    ctx.ellipse(player.radius * 0.4, -player.radius * 0.1, player.radius * 0.15, player.radius * 0.08, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Gun arm
    const weapon = player.weapons[player.currentWeapon];
    const weaponType = weapon.type;

    // Arm
    ctx.fillStyle = '#2A6A2A';
    ctx.fillRect(player.radius * 0.2, -4, player.radius * 0.6, 8);

    // Weapon
    if (weaponType === 'pistol') {
        ctx.fillStyle = '#444';
        ctx.fillRect(player.radius * 0.7, -3, player.radius * 0.8, 6);
        ctx.fillStyle = '#333';
        ctx.fillRect(player.radius * 1.3, -2, player.radius * 0.3, 4);
    } else if (weaponType === 'shotgun') {
        ctx.fillStyle = '#553322';
        ctx.fillRect(player.radius * 0.6, -4, player.radius * 1.2, 8);
        ctx.fillStyle = '#444';
        ctx.fillRect(player.radius * 1.5, -3, player.radius * 0.4, 6);
    } else if (weaponType === 'rifle') {
        ctx.fillStyle = '#444';
        ctx.fillRect(player.radius * 0.6, -3, player.radius * 1.4, 6);
        ctx.fillStyle = '#333';
        ctx.fillRect(player.radius * 0.8, -5, player.radius * 0.3, 10);
        ctx.fillRect(player.radius * 1.8, -2, player.radius * 0.3, 4);
    } else if (weaponType === 'flamethrower') {
        ctx.fillStyle = '#555';
        ctx.fillRect(player.radius * 0.5, -5, player.radius * 1.0, 10);
        ctx.fillStyle = '#666';
        ctx.fillRect(player.radius * 1.3, -4, player.radius * 0.5, 8);
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(player.radius * 1.7, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
}

function renderVisionOverlay() {
    // Create darkness overlay with raycasted vision
    ctx.save();

    // Draw dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.rect(player.x - 500, player.y - 500, 1000, 1000);

    // Cut out vision cone using raycasting
    ctx.moveTo(player.x, player.y);

    const startAngle = player.angle - VISION_ANGLE / 2;
    const endAngle = player.angle + VISION_ANGLE / 2;

    for (let i = 0; i <= RAY_COUNT; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / RAY_COUNT);
        const rayDist = castRay(player.x, player.y, angle, VISION_RANGE);

        const rayX = player.x + Math.cos(angle) * rayDist;
        const rayY = player.y + Math.sin(angle) * rayDist;
        ctx.lineTo(rayX, rayY);
    }

    ctx.closePath();
    ctx.fill('evenodd');

    ctx.restore();
}

function castRay(startX, startY, angle, maxDist) {
    const stepSize = 8;
    let dist = 0;

    while (dist < maxDist) {
        const x = startX + Math.cos(angle) * dist;
        const y = startY + Math.sin(angle) * dist;

        // Check walls
        if (currentRoom) {
            for (const wall of currentRoom.walls) {
                if (x >= wall.x && x <= wall.x + wall.w && y >= wall.y && y <= wall.y + wall.h) {
                    return dist;
                }
            }
        }

        dist += stepSize;
    }

    return maxDist;
}

function renderFloatingTexts() {
    for (const ft of floatingTexts) {
        const alpha = ft.life / 1.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
}

function renderHUD() {
    const hudY = 15;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 50);
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Score / 1UP
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('1UP', 20, hudY + 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(player.credits.toString(), 20, hudY + 25);

    // LIVES (health bar)
    ctx.fillStyle = '#FFF';
    ctx.fillText('LIVES', 100, hudY + 5);
    ctx.fillStyle = '#400';
    ctx.fillRect(100, hudY + 10, 150, 15);
    ctx.fillStyle = '#F44';
    ctx.fillRect(100, hudY + 10, 150 * (player.health / player.maxHealth), 15);

    // AMMO bar
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];
    ctx.fillStyle = '#FFF';
    ctx.fillText('AMMO', 280, hudY + 5);
    ctx.fillStyle = '#440';
    ctx.fillRect(280, hudY + 10, 150, 15);
    ctx.fillStyle = '#FF0';
    ctx.fillRect(280, hudY + 10, 150 * (weapon.currentMag / data.magSize), 15);

    // Ammo text
    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    let ammoText = `${weapon.currentMag}/${data.magSize}`;
    if (!data.infiniteAmmo) {
        ammoText += ` | ${player.ammo[data.ammoType]}`;
    }
    ctx.fillText(ammoText, 440, hudY + 22);

    // KEYS
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('KEYS', canvas.width - 120, hudY + 5);
    ctx.fillStyle = player.keycards.blue ? '#0088FF' : '#333';
    ctx.fillRect(canvas.width - 120, hudY + 10, 20, 15);

    // Bottom HUD - Weapon info
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(data.name.toUpperCase(), 20, canvas.height - 40);

    // Weapon icon
    ctx.fillStyle = data.color;
    ctx.fillRect(20, canvas.height - 35, 50, 15);

    // Reload indicator
    if (player.reloadTimer > 0) {
        ctx.fillStyle = '#FF8800';
        ctx.fillText('RELOADING...', 90, canvas.height - 20);
        ctx.fillStyle = '#440';
        ctx.fillRect(90, canvas.height - 15, 100, 8);
        ctx.fillStyle = '#FF8800';
        ctx.fillRect(90, canvas.height - 15, 100 * (1 - player.reloadTimer / data.reloadTime), 8);
    }

    // Level indicator
    const levelNames = ['CARGO BAY', 'ENGINEERING', "QUEEN'S LAIR"];
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`LEVEL ${currentLevel + 1}: ${levelNames[currentLevel]}`, canvas.width / 2 - 80, canvas.height - 40);

    // Minimap
    renderMinimap();
}

function renderMinimap() {
    const mapSize = 150;
    const mapX = canvas.width - mapSize - 20;
    const mapY = 60;
    const scale = 0.015;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Get center offset
    const centerX = player.x * scale;
    const centerY = player.y * scale;

    for (const room of rooms) {
        const rx = mapX + mapSize / 2 + (room.x + room.width / 2) * scale - centerX;
        const ry = mapY + mapSize / 2 + (room.y + room.height / 2) * scale - centerY;
        const rw = room.width * scale;
        const rh = room.height * scale;

        // Only show explored rooms
        if (clearedRooms.has(room.id) || room.id === currentRoom?.id) {
            ctx.fillStyle = clearedRooms.has(room.id) ? '#333' : '#222';
            ctx.fillRect(rx - rw / 2, ry - rh / 2, rw, rh);

            // Exit marker
            if (room.type === 'exit') {
                ctx.fillStyle = '#0088FF';
                ctx.fillRect(rx - 3, ry - 3, 6, 6);
            }
        }
    }

    // Player marker
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(mapX + mapSize / 2 + 5, mapY + mapSize / 2);
    ctx.lineTo(mapX + mapSize / 2 - 3, mapY + mapSize / 2 - 4);
    ctx.lineTo(mapX + mapSize / 2 - 3, mapY + mapSize / 2 + 4);
    ctx.closePath();
    ctx.fill();

    // Enemies in current room
    ctx.fillStyle = '#F00';
    for (const e of enemies) {
        const ex = mapX + mapSize / 2 + e.x * scale - centerX;
        const ey = mapY + mapSize / 2 + e.y * scale - centerY;
        if (ex > mapX && ex < mapX + mapSize && ey > mapY && ey < mapY + mapSize) {
            ctx.beginPath();
            ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderDebugOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 60, 220, 180);

    ctx.fillStyle = '#0F0';
    ctx.font = '12px monospace';

    const lines = [
        `FPS: ${lastFps}`,
        `Position: (${Math.round(player.x)}, ${Math.round(player.y)})`,
        `Health: ${player.health}/${player.maxHealth}`,
        `Stamina: ${Math.round(player.stamina)}/${player.maxStamina}`,
        `Enemies: ${enemies.length}`,
        `Room: ${currentRoom?.label || 'None'}`,
        `Rooms Cleared: ${clearedRooms.size}/${rooms.length}`,
        `Level: ${currentLevel + 1}`,
        `Weapon: ${weaponData[player.weapons[player.currentWeapon].type].name}`,
        `Game State: ${currentState}`,
        `Keycard: ${player.keycards.blue ? 'YES' : 'NO'}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 80 + i * 15);
    });
}

function renderMenu() {
    // Dark background with alien face hint
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#888';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATION BREACH', canvas.width / 2, 200);

    ctx.fillStyle = '#666';
    ctx.font = '18px monospace';
    ctx.fillText('An Alien Breed Tribute', canvas.width / 2, 240);

    // Loading text
    ctx.fillStyle = '#444';
    ctx.font = '24px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 400);

    // Controls
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText('WASD - Move | Mouse - Aim | LMB - Shoot | R - Reload', canvas.width / 2, 500);
    ctx.fillText('SPACE - Interact | TAB - Switch Weapon | Q - Debug', canvas.width / 2, 525);

    ctx.textAlign = 'left';
}

function renderPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = '18px monospace';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F44';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText(`Credits Earned: ${player.credits}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Level Reached: ${currentLevel + 1}`, canvas.width / 2, canvas.height / 2 + 30);

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 80);
    ctx.textAlign = 'left';
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4F4';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText(`Final Score: ${player.credits}`, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to Play Again', canvas.width / 2, canvas.height / 2 + 60);
    ctx.textAlign = 'left';
}

// Start the game
init();
