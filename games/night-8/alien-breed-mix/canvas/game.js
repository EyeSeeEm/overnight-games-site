// Station Breach - Alien Breed Clone
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const TILE_SIZE = 32;
const VIEWPORT_W = canvas.width;
const VIEWPORT_H = canvas.height;
const TILES_X = 40;
const TILES_Y = 25;

// Refine 2-3: Colors matching Alien Breed style more closely
const COLORS = {
    floor: '#3A3530',        // Brown-gray industrial
    floorTile: '#454038',    // Slightly lighter tiles
    wall: '#5A5550',         // Metallic gray walls
    wallDark: '#3A3530',
    wallHighlight: '#6A6560',
    door: '#606060',
    doorBlue: '#0088FF',
    player: '#8B7355',       // Tan/olive like classic
    playerHighlight: '#A08060',
    drone: '#0a0a0a',        // Very dark black aliens
    droneHighlight: '#1a1a1a',
    brute: '#151515',        // Dark black brutes
    bruteHighlight: '#252525',
    queen: '#0a0510',        // Dark purple-black queen
    queenHighlight: '#1a1520',
    bullet: '#FFAA00',
    muzzleFlash: '#FF6600',
    health: '#FF4444',
    healthBg: '#440000',
    shield: '#4488FF',
    ammo: '#FFDD00',
    ammoBg: '#444400',
    keycard: '#0088FF',
    bloodAlien: '#00FF88',
    bloodHuman: '#CC0000',
    terminal: '#00FFFF',
    warning: '#FF8800',
    darkness: 'rgba(0,0,0,0.97)',  // Refine 13: Darker atmosphere
    visionCone: 'rgba(255,255,200,0.02)'  // Subtler flashlight
};

// Game State
const GameState = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    VICTORY: 4
};

let gameState = GameState.MENU;
let currentLevel = 1;
let showDebug = false;

// Input tracking
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Camera
const camera = { x: 0, y: 0, targetX: 0, targetY: 0, shake: 0, shakeIntensity: 0 };

// Player
const player = {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 180,
    sprintSpeed: 270,
    sprinting: false,
    hp: 100,
    maxHp: 100,
    shield: 0,
    maxShield: 50,
    stamina: 100,
    maxStamina: 100,
    width: 32,
    height: 32,
    hitboxSize: 24,
    weapons: [],
    currentWeapon: 0,
    ammo: { shells: 24, rifle: 90, fuel: 200 },
    maxAmmo: { shells: 64, rifle: 180, fuel: 300 },
    keycards: { blue: false },
    medkits: 0,
    credits: 0,
    fireTimer: 0,
    reloading: false,
    reloadTimer: 0,
    interactCooldown: 0,
    switchCooldown: 0,
    lastAmmoWarning: 0,
    invulnerable: 0,
    dashCooldown: 0,     // Expand 15: Dash ability
    dashing: false,
    dashDir: { x: 0, y: 0 },
    hurtFlash: 0         // Polish 2: Hurt screen flash
};

// Weapons data
const weaponData = {
    pistol: {
        name: 'Pistol',
        damage: 15,
        fireRate: 0.25,
        magSize: 12,
        reloadTime: 0.95,
        projectileSpeed: 800,
        spread: 3,
        range: 500,
        ammoType: null,
        shakeIntensity: 2,
        shakeDuration: 0.05,
        knockback: 50
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
        shakeIntensity: 4,
        shakeDuration: 0.15,
        knockback: 100
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
        shakeIntensity: 3,
        shakeDuration: 0.08,
        knockback: 75
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
        shakeIntensity: 0.5,
        shakeDuration: 0.02,
        knockback: 20,
        isFlame: true
    }
};

// Entity arrays
let enemies = [];
let projectiles = [];
let particles = [];
let pickups = [];
let doors = [];
let walls = [];
let floatingTexts = [];
let barrels = [];       // Expand 1: Explosive barrels
let crates = [];        // Expand 2: Destructible crates
let corpses = [];       // Expand 5: Enemy corpses
let bloodPools = [];    // Expand 4: Persistent blood
let shellCasings = [];  // Expand 3: Shell casings
let decorations = [];   // Expand 9: Room decorations

// Player stats tracking
let killCount = 0;      // Expand 20: Kill counter
let totalScore = 0;     // Expand 11: Score system

// Level data
let levelData = null;
let rooms = [];
let clearedRooms = new Set();

// Timing
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0;

// Level generation
function generateLevel(levelNum) {
    walls = [];
    doors = [];
    pickups = [];
    enemies = [];
    rooms = [];
    clearedRooms = new Set();
    barrels = [];
    crates = [];
    corpses = [];
    bloodPools = [];
    shellCasings = [];
    decorations = [];
    killCount = 0;
    totalScore = 0;

    const mapW = 60;
    const mapH = 45;
    const map = Array(mapH).fill().map(() => Array(mapW).fill(1));

    // Room templates
    const roomCount = 10 + levelNum * 3;
    let roomId = 0;

    // Generate rooms
    for (let i = 0; i < roomCount; i++) {
        const roomW = 6 + Math.floor(Math.random() * 6);
        const roomH = 6 + Math.floor(Math.random() * 6);
        const roomX = 2 + Math.floor(Math.random() * (mapW - roomW - 4));
        const roomY = 2 + Math.floor(Math.random() * (mapH - roomH - 4));

        const room = {
            id: roomId++,
            x: roomX,
            y: roomY,
            w: roomW,
            h: roomH,
            centerX: (roomX + roomW / 2) * TILE_SIZE,
            centerY: (roomY + roomH / 2) * TILE_SIZE,
            enemies: [],
            hasKeycard: false,
            hasWeapon: null,
            cleared: false
        };
        rooms.push(room);

        // Carve room
        for (let y = roomY; y < roomY + roomH; y++) {
            for (let x = roomX; x < roomX + roomW; x++) {
                if (y >= 0 && y < mapH && x >= 0 && x < mapW) {
                    map[y][x] = 0;
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];

        let cx = Math.floor(r1.x + r1.w / 2);
        let cy = Math.floor(r1.y + r1.h / 2);
        const tx = Math.floor(r2.x + r2.w / 2);
        const ty = Math.floor(r2.y + r2.h / 2);

        // Horizontal then vertical
        while (cx !== tx) {
            if (cx >= 0 && cx < mapW && cy >= 0 && cy < mapH) {
                map[cy][cx] = 0;
                if (cy + 1 < mapH) map[cy + 1][cx] = 0;
            }
            cx += cx < tx ? 1 : -1;
        }
        while (cy !== ty) {
            if (cx >= 0 && cx < mapW && cy >= 0 && cy < mapH) {
                map[cy][cx] = 0;
                if (cx + 1 < mapW) map[cy][cx + 1] = 0;
            }
            cy += cy < ty ? 1 : -1;
        }
    }

    // Build walls from map
    for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
            if (map[y][x] === 1) {
                // Check if wall borders a floor tile
                let isVisible = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < mapH && nx >= 0 && nx < mapW && map[ny][nx] === 0) {
                            isVisible = true;
                        }
                    }
                }
                if (isVisible) {
                    walls.push({
                        x: x * TILE_SIZE,
                        y: y * TILE_SIZE,
                        w: TILE_SIZE,
                        h: TILE_SIZE
                    });
                }
            }
        }
    }

    // Place player in first room (always empty)
    const startRoom = rooms[0];
    player.x = startRoom.centerX;
    player.y = startRoom.centerY;
    clearedRooms.add(startRoom.id);
    startRoom.cleared = true;

    // Place keycard in a middle room
    const keycardRoomIndex = Math.floor(rooms.length * 0.6);
    rooms[keycardRoomIndex].hasKeycard = true;

    // Place weapons based on level
    if (levelNum === 1 && rooms.length > 3) {
        rooms[3].hasWeapon = 'shotgun';
    }
    if (levelNum >= 2 && rooms.length > 5) {
        rooms[5].hasWeapon = 'rifle';
    }
    if (levelNum >= 2 && rooms.length > 7) {
        rooms[7].hasWeapon = 'flamethrower';
    }

    // Set up enemy spawns for each room (except start)
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const enemyCount = 3 + Math.floor(Math.random() * 3) + levelNum;

        for (let j = 0; j < enemyCount; j++) {
            let type = 'drone';
            if (levelNum >= 2 && Math.random() < 0.3) type = 'brute';
            if (levelNum >= 3 && Math.random() < 0.4) type = 'brute';

            room.enemies.push({
                type: type,
                offsetX: (Math.random() - 0.5) * (room.w - 2) * TILE_SIZE,
                offsetY: (Math.random() - 0.5) * (room.h - 2) * TILE_SIZE
            });
        }
    }

    // Place exit door at last room
    const exitRoom = rooms[rooms.length - 1];
    doors.push({
        x: exitRoom.centerX,
        y: exitRoom.centerY - exitRoom.h * TILE_SIZE / 2,
        w: 64,
        h: 32,
        type: 'blue',
        open: false,
        isExit: true
    });

    // Add Queen boss in level 3
    if (levelNum === 3) {
        const bossRoom = rooms[rooms.length - 1];
        bossRoom.enemies = [{ type: 'queen', offsetX: 0, offsetY: 0 }];
    }

    // Place some pickups in random rooms
    for (let i = 2; i < rooms.length; i += 2) {
        const room = rooms[i];
        if (!room.hasKeycard && !room.hasWeapon) {
            const roll = Math.random();
            if (roll < 0.3) {
                pickups.push({
                    x: room.centerX + (Math.random() - 0.5) * 50,
                    y: room.centerY + (Math.random() - 0.5) * 50,
                    type: 'health',
                    amount: 25
                });
            } else if (roll < 0.5) {
                const ammoTypes = ['shells', 'rifle', 'fuel'];
                pickups.push({
                    x: room.centerX + (Math.random() - 0.5) * 50,
                    y: room.centerY + (Math.random() - 0.5) * 50,
                    type: 'ammo',
                    ammoType: ammoTypes[Math.floor(Math.random() * ammoTypes.length)],
                    amount: 20
                });
            } else if (roll < 0.6) {
                // Expand 7: Shield pickup
                pickups.push({
                    x: room.centerX + (Math.random() - 0.5) * 50,
                    y: room.centerY + (Math.random() - 0.5) * 50,
                    type: 'shield',
                    amount: 25
                });
            } else if (roll < 0.7) {
                // Expand 8: Medkit pickup
                pickups.push({
                    x: room.centerX + (Math.random() - 0.5) * 50,
                    y: room.centerY + (Math.random() - 0.5) * 50,
                    type: 'medkit'
                });
            }
        }
    }

    // Expand 1: Place explosive barrels in some rooms
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        if (Math.random() < 0.4) {
            const count = 1 + Math.floor(Math.random() * 2);
            for (let j = 0; j < count; j++) {
                barrels.push({
                    x: room.centerX + (Math.random() - 0.5) * (room.w - 3) * TILE_SIZE,
                    y: room.centerY + (Math.random() - 0.5) * (room.h - 3) * TILE_SIZE,
                    hp: 30,
                    radius: 16
                });
            }
        }
    }

    // Expand 2: Place destructible crates in some rooms
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        if (Math.random() < 0.5) {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < count; j++) {
                crates.push({
                    x: room.centerX + (Math.random() - 0.5) * (room.w - 3) * TILE_SIZE,
                    y: room.centerY + (Math.random() - 0.5) * (room.h - 3) * TILE_SIZE,
                    hp: 20,
                    size: 24
                });
            }
        }
    }

    // Expand 9 + Refine 19: Add more decorations like reference
    for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        const rx = room.x * TILE_SIZE;
        const ry = room.y * TILE_SIZE;
        const rw = room.w * TILE_SIZE;
        const rh = room.h * TILE_SIZE;

        // Add corner pipes
        if (Math.random() < 0.7) {
            decorations.push({ type: 'pipe', x: rx + 16, y: ry + 16, vertical: true });
            decorations.push({ type: 'pipe', x: rx + rw - 16, y: ry + 16, vertical: true });
        }

        // Add large fans (vents) - more frequent like reference
        if (Math.random() < 0.6) {
            decorations.push({ type: 'vent', x: rx + rw / 2, y: ry + 40 });
        }
        if (Math.random() < 0.4 && rw > 200) {
            // Add second fan for larger rooms
            decorations.push({ type: 'vent', x: rx + 60, y: ry + rh / 2 });
        }
        if (Math.random() < 0.4 && rw > 200) {
            // Add third fan opposite corner
            decorations.push({ type: 'vent', x: rx + rw - 60, y: ry + rh / 2 });
        }

        // Add warning stripes near doors/edges
        if (Math.random() < 0.4) {
            decorations.push({ type: 'warning', x: rx + 32, y: ry + rh - 32, w: 64 });
        }

        // Add terminal in some rooms (Expand 6)
        if (Math.random() < 0.25 && i > 0) {
            decorations.push({
                type: 'terminal',
                x: rx + 32 + Math.random() * (rw - 64),
                y: ry + 32,
                interacted: false
            });
        }
    }

    levelData = { map, mapW, mapH };
}

// Check if player is in a room
function getPlayerRoom() {
    for (const room of rooms) {
        const rx = room.x * TILE_SIZE;
        const ry = room.y * TILE_SIZE;
        const rw = room.w * TILE_SIZE;
        const rh = room.h * TILE_SIZE;

        if (player.x >= rx && player.x < rx + rw &&
            player.y >= ry && player.y < ry + rh) {
            return room;
        }
    }
    return null;
}

// Spawn enemies when entering a room
function checkRoomEntry() {
    const room = getPlayerRoom();
    if (room && !clearedRooms.has(room.id)) {
        clearedRooms.add(room.id);

        // Expand 14: Room entry notification
        const roomNames = ['STORAGE', 'CARGO', 'MAINTENANCE', 'CONTROL', 'ARMORY', 'MESS HALL', 'QUARTERS', 'LAB', 'REACTOR', 'BRIDGE'];
        const roomName = roomNames[room.id % roomNames.length];
        spawnFloatingText(player.x, player.y - 60, `ENTERING: ${roomName}`, '#AAAAAA');

        // Spawn enemies with effect
        for (const e of room.enemies) {
            const ex = room.centerX + e.offsetX;
            const ey = room.centerY + e.offsetY;
            spawnEnemy(e.type, ex, ey);

            // Polish 7: Enemy spawn particles
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: ex,
                    y: ey,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    size: 3 + Math.random() * 3,
                    color: '#00FF88',
                    life: 0.5,
                    type: 'spawn'
                });
            }
        }

        // Spawn keycard if room has it
        if (room.hasKeycard) {
            pickups.push({
                x: room.centerX,
                y: room.centerY,
                type: 'keycard',
                keyType: 'blue'
            });
        }

        // Spawn weapon if room has it
        if (room.hasWeapon) {
            pickups.push({
                x: room.centerX + 30,
                y: room.centerY,
                type: 'weapon',
                weaponType: room.hasWeapon
            });
        }
    }
}

// Spawn enemy
function spawnEnemy(type, x, y) {
    const enemy = {
        type: type,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        attackCooldown: 0,
        state: 'idle',
        stateTimer: 0,
        stunned: 0,
        alerted: false,      // Expand 13: Alert state
        alertTimer: 0        // Expand 13: Alert indicator timer
    };

    switch (type) {
        case 'drone':
            // Refine 6: Bigger spider aliens like reference
            enemy.hp = 20;
            enemy.maxHp = 20;
            enemy.damage = 10;
            enemy.speed = 120;
            enemy.size = 40;  // Bigger to match reference spiders
            enemy.detectRange = 300;
            break;
        case 'brute':
            enemy.hp = 100;
            enemy.maxHp = 100;
            enemy.damage = 30;
            enemy.speed = 60;
            enemy.chargeSpeed = 250;
            enemy.size = 48;
            enemy.detectRange = 250;
            enemy.charging = false;
            break;
        case 'queen':
            enemy.hp = 500;
            enemy.maxHp = 500;
            enemy.damage = 25;
            enemy.speed = 80;
            enemy.chargeSpeed = 150;
            enemy.size = 96;
            enemy.detectRange = 600;
            enemy.phase = 1;
            enemy.summonTimer = 20;
            break;
    }

    enemies.push(enemy);
}

// Initialize player weapons
function initPlayer() {
    player.hp = player.maxHp;
    player.shield = 0;
    player.stamina = player.maxStamina;
    player.weapons = [
        { type: 'pistol', mag: 12, maxMag: 12 }
    ];
    player.currentWeapon = 0;
    player.keycards = { blue: false };
    player.ammo = { shells: 24, rifle: 90, fuel: 200 };
    player.medkits = 1;
    player.credits = 0;
    player.invulnerable = 0;
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;

    if (e.key === 'q' && gameState === GameState.PLAYING) {
        showDebug = !showDebug;
    }
    if (e.key === 'Escape') {
        if (gameState === GameState.PLAYING) {
            gameState = GameState.PAUSED;
        } else if (gameState === GameState.PAUSED) {
            gameState = GameState.PLAYING;
        }
    }
    if ((e.key === ' ' || e.key === 'Enter') && gameState === GameState.MENU) {
        startGame();
    }
    if (e.key === 'r' && gameState === GameState.PLAYING) {
        tryReload();
    }
    if (e.key === 'h' && gameState === GameState.PLAYING) {
        useMedkit();
    }
    if (e.key === 'Tab') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    if (gameState === GameState.MENU) {
        startGame();
    }
});

canvas.addEventListener('mouseup', () => {
    mouse.down = false;
});

canvas.addEventListener('wheel', (e) => {
    if (gameState === GameState.PLAYING && player.switchCooldown <= 0) {
        player.currentWeapon += e.deltaY > 0 ? 1 : -1;
        if (player.currentWeapon < 0) player.currentWeapon = player.weapons.length - 1;
        if (player.currentWeapon >= player.weapons.length) player.currentWeapon = 0;
        player.switchCooldown = 0.2;
        player.reloading = false;
        // Polish 5: Weapon switch feedback
        const wData = weaponData[player.weapons[player.currentWeapon].type];
        spawnFloatingText(player.x, player.y - 40, wData.name.toUpperCase(), '#FFFFFF');
    }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Start game
function startGame() {
    gameState = GameState.PLAYING;
    currentLevel = 1;
    gameTime = 0;
    initPlayer();
    generateLevel(currentLevel);
}

// Try to reload
function tryReload() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];

    if (player.reloading) return;
    if (weapon.mag >= data.magSize) return;

    if (data.ammoType === null) {
        // Pistol has infinite ammo
        player.reloading = true;
        player.reloadTimer = data.reloadTime;
    } else if (player.ammo[data.ammoType] > 0) {
        player.reloading = true;
        player.reloadTimer = data.reloadTime;
    }
}

// Finish reload
function finishReload() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];

    if (data.ammoType === null) {
        weapon.mag = data.magSize;
    } else {
        const needed = data.magSize - weapon.mag;
        const available = player.ammo[data.ammoType];
        const toLoad = Math.min(needed, available);
        weapon.mag += toLoad;
        player.ammo[data.ammoType] -= toLoad;
    }

    player.reloading = false;
}

// Use medkit
function useMedkit() {
    if (player.medkits > 0 && player.hp < player.maxHp) {
        player.medkits--;
        player.hp = Math.min(player.maxHp, player.hp + 50);
        spawnFloatingText(player.x, player.y - 20, '+50 HP', '#FF4444');
    }
}

// Spawn floating text
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.5,
        vy: -40
    });
}

// Fire weapon
function fireWeapon() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon.type];

    if (player.reloading) return;
    if (player.fireTimer > 0) return;

    if (weapon.mag <= 0) {
        // Out of ammo message (rate limited)
        if (gameTime - player.lastAmmoWarning > 1) {
            spawnFloatingText(player.x, player.y - 30, 'NO AMMO!', '#FF0000');
            player.lastAmmoWarning = gameTime;
        }
        return;
    }

    weapon.mag--;
    player.fireTimer = data.fireRate;

    // Screen shake
    camera.shake = data.shakeDuration;
    camera.shakeIntensity = data.shakeIntensity;

    // Muzzle flash particle - Refine 11: Bigger orange flash like reference
    const flashDist = 24;
    particles.push({
        x: player.x + Math.cos(player.angle) * flashDist,
        y: player.y + Math.sin(player.angle) * flashDist,
        size: 28,  // Bigger flash
        color: '#FF8800',  // Orange
        life: 0.08,
        type: 'flash'
    });
    // Extra inner bright yellow flash
    particles.push({
        x: player.x + Math.cos(player.angle) * flashDist,
        y: player.y + Math.sin(player.angle) * flashDist,
        size: 14,
        color: '#FFFF00',  // Yellow center
        life: 0.06,
        type: 'flash'
    });

    // Spawn projectiles
    const pellets = data.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spreadRad = (data.spread * (Math.random() - 0.5) * 2) * Math.PI / 180;
        const angle = player.angle + spreadRad;

        projectiles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(angle) * data.projectileSpeed,
            vy: Math.sin(angle) * data.projectileSpeed,
            damage: data.damage,
            range: data.range,
            traveled: 0,
            isFlame: data.isFlame || false,
            knockback: data.knockback,
            owner: 'player'
        });
    }

    // Expand 3: Spawn shell casing
    if (!data.isFlame) {
        const casingAngle = player.angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        shellCasings.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(casingAngle) * (50 + Math.random() * 30),
            vy: Math.sin(casingAngle) * (50 + Math.random() * 30),
            angle: Math.random() * Math.PI * 2,
            life: 3 + Math.random() * 2
        });
    }

    // Auto-reload when empty
    if (weapon.mag <= 0) {
        tryReload();
    }
}

// Update player
function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Sprint
    player.sprinting = keys['shift'] && player.stamina > 0 && (dx !== 0 || dy !== 0);
    const speed = player.sprinting ? player.sprintSpeed : player.speed;

    if (player.sprinting) {
        player.stamina -= 25 * dt;
        if (player.stamina < 0) player.stamina = 0;
    } else if (dx === 0 && dy === 0) {
        player.stamina += 20 * dt;
        if (player.stamina > player.maxStamina) player.stamina = player.maxStamina;
    }

    // Apply movement
    const newX = player.x + dx * speed * dt;
    const newY = player.y + dy * speed * dt;

    // Collision check
    if (!checkWallCollision(newX, player.y, player.hitboxSize / 2)) {
        player.x = newX;
    }
    if (!checkWallCollision(player.x, newY, player.hitboxSize / 2)) {
        player.y = newY;
    }

    // Expand 18: Footstep particles when moving
    if ((dx !== 0 || dy !== 0) && Math.random() < 0.1) {
        particles.push({
            x: player.x + (Math.random() - 0.5) * 10,
            y: player.y + 8,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            size: 2,
            color: player.sprinting ? '#555' : '#333',
            life: 0.3,
            type: 'footstep'
        });
    }

    // Aim at mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Timers
    if (player.fireTimer > 0) player.fireTimer -= dt;
    if (player.interactCooldown > 0) player.interactCooldown -= dt;
    if (player.switchCooldown > 0) player.switchCooldown -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.hurtFlash > 0) player.hurtFlash -= dt;

    // Expand 15: Dash ability (Space when not shooting)
    if ((keys['Space'] || keys[' ']) && !mouse.down && player.dashCooldown <= 0 && player.stamina >= 30 && (dx !== 0 || dy !== 0)) {
        player.dashing = true;
        player.dashCooldown = 1.5;
        player.stamina -= 30;
        player.invulnerable = 0.2;
        player.dashDir = { x: dx, y: dy };
        // Dash particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: player.x,
                y: player.y,
                vx: -dx * 50 + (Math.random() - 0.5) * 30,
                vy: -dy * 50 + (Math.random() - 0.5) * 30,
                size: 4,
                color: '#00FFFF',
                life: 0.3,
                type: 'dash'
            });
        }
    }

    // Handle dash movement
    if (player.dashing) {
        const dashSpeed = 500;
        const newDashX = player.x + player.dashDir.x * dashSpeed * dt;
        const newDashY = player.y + player.dashDir.y * dashSpeed * dt;
        if (!checkWallCollision(newDashX, player.y, player.hitboxSize / 2)) {
            player.x = newDashX;
        } else {
            player.dashing = false;
        }
        if (!checkWallCollision(player.x, newDashY, player.hitboxSize / 2)) {
            player.y = newDashY;
        } else {
            player.dashing = false;
        }
        player.dashCooldown -= dt * 5; // Dash lasts very short
        if (player.dashCooldown < 1.3) {
            player.dashing = false;
        }
    }

    // Reloading
    if (player.reloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            finishReload();
        }
    }

    // Shooting
    if (mouse.down || keys[' ']) {
        fireWeapon();
    }

    // Weapon switch with Q
    if (keys['q'] && player.weapons.length > 1 && player.switchCooldown <= 0) {
        // Q is used for debug, use number keys or scroll
    }

    // Interact with E or Space for doors
    if ((keys['e'] || keys[' ']) && player.interactCooldown <= 0) {
        checkInteraction();
        player.interactCooldown = 0.3;
    }

    // Check room entry
    checkRoomEntry();

    // Collect pickups
    collectPickups();
}

// Check wall collision
function checkWallCollision(x, y, radius) {
    for (const wall of walls) {
        const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
        const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));
        const distX = x - closestX;
        const distY = y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < radius) {
            return true;
        }
    }
    return false;
}

// Check line of sight
function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / 16);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;

        for (const wall of walls) {
            if (x >= wall.x && x <= wall.x + wall.w &&
                y >= wall.y && y <= wall.y + wall.h) {
                return false;
            }
        }
    }
    return true;
}

// Check interaction
function checkInteraction() {
    // Check doors
    for (const door of doors) {
        const dist = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2);
        if (dist < 60) {
            if (door.type === 'blue' && !player.keycards.blue) {
                spawnFloatingText(player.x, player.y - 30, 'NEED BLUE KEYCARD', '#0088FF');
                return;
            }
            if (!door.open) {
                door.open = true;
                if (door.isExit) {
                    nextLevel();
                }
            }
        }
    }
}

// Collect pickups
function collectPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);

        if (dist < 32) {
            switch (p.type) {
                case 'health':
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.maxHp, player.hp + p.amount);
                        spawnFloatingText(p.x, p.y, `+${p.amount} HP`, '#FF4444');
                        pickups.splice(i, 1);
                    }
                    break;
                case 'ammo':
                    if (player.ammo[p.ammoType] < player.maxAmmo[p.ammoType]) {
                        player.ammo[p.ammoType] = Math.min(
                            player.maxAmmo[p.ammoType],
                            player.ammo[p.ammoType] + p.amount
                        );
                        spawnFloatingText(p.x, p.y, `+${p.amount} ${p.ammoType.toUpperCase()}`, '#FFDD00');
                        pickups.splice(i, 1);
                    }
                    break;
                case 'keycard':
                    player.keycards[p.keyType] = true;
                    spawnFloatingText(p.x, p.y, `${p.keyType.toUpperCase()} KEYCARD`, '#0088FF');
                    pickups.splice(i, 1);
                    break;
                case 'weapon':
                    // Check if already have weapon
                    const hasWeapon = player.weapons.some(w => w.type === p.weaponType);
                    if (!hasWeapon) {
                        const wData = weaponData[p.weaponType];
                        player.weapons.push({
                            type: p.weaponType,
                            mag: wData.magSize,
                            maxMag: wData.magSize
                        });
                        spawnFloatingText(p.x, p.y, `${wData.name.toUpperCase()}`, '#00FF00');
                        pickups.splice(i, 1);
                    }
                    break;
                case 'medkit':
                    player.medkits++;
                    spawnFloatingText(p.x, p.y, '+1 MEDKIT', '#FF8888');
                    pickups.splice(i, 1);
                    break;
                case 'shield':
                    // Expand 7: Shield pickup
                    if (player.shield < player.maxShield) {
                        player.shield = Math.min(player.maxShield, player.shield + p.amount);
                        spawnFloatingText(p.x, p.y, `+${p.amount} SHIELD`, '#4488FF');
                        pickups.splice(i, 1);
                    }
                    break;
                case 'credits':
                    // Expand 17: Credits pickup
                    player.credits += p.amount;
                    spawnFloatingText(p.x, p.y, `+${p.amount} CR`, '#FFD700');
                    pickups.splice(i, 1);
                    break;
            }
        }
    }
}

// Next level
function nextLevel() {
    currentLevel++;
    if (currentLevel > 3) {
        gameState = GameState.VICTORY;
    } else {
        generateLevel(currentLevel);
        spawnFloatingText(player.x, player.y - 50, `LEVEL ${currentLevel}`, '#00FF00');
    }
}

// Update enemies
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        if (e.stunned > 0) {
            e.stunned -= dt;
            continue;
        }

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const canSee = dist < e.detectRange && hasLineOfSight(e.x, e.y, player.x, player.y);

        // Expand 13: Alert state tracking
        if (canSee && !e.alerted) {
            e.alerted = true;
            e.alertTimer = 1.0; // Show alert for 1 second
        }
        if (e.alertTimer > 0) {
            e.alertTimer -= dt;
        }

        // Face player if can see
        if (canSee) {
            e.angle = Math.atan2(dy, dx);
        }

        e.attackCooldown -= dt;

        switch (e.type) {
            case 'drone':
                if (canSee) {
                    // Move toward player
                    const moveX = Math.cos(e.angle) * e.speed * dt;
                    const moveY = Math.sin(e.angle) * e.speed * dt;

                    if (!checkWallCollision(e.x + moveX, e.y, e.size / 2)) {
                        e.x += moveX;
                    }
                    if (!checkWallCollision(e.x, e.y + moveY, e.size / 2)) {
                        e.y += moveY;
                    }

                    // Attack if close
                    if (dist < 40 && e.attackCooldown <= 0) {
                        damagePlayer(e.damage);
                        e.attackCooldown = 1.0;
                    }
                }
                break;

            case 'brute':
                if (canSee) {
                    if (e.charging) {
                        // Continue charge
                        e.x += e.vx * dt;
                        e.y += e.vy * dt;
                        e.stateTimer -= dt;

                        // Hit player during charge
                        if (dist < e.size / 2 + 16 && e.attackCooldown <= 0) {
                            damagePlayer(e.damage);
                            e.attackCooldown = 1.0;
                        }

                        // Hit wall
                        if (checkWallCollision(e.x, e.y, e.size / 2)) {
                            e.charging = false;
                            e.stunned = 1.0;
                            e.vx = 0;
                            e.vy = 0;
                        }

                        if (e.stateTimer <= 0) {
                            e.charging = false;
                            e.stunned = 1.0;
                            e.vx = 0;
                            e.vy = 0;
                        }
                    } else {
                        // Move slowly toward player
                        if (dist > 200) {
                            const moveX = Math.cos(e.angle) * e.speed * dt;
                            const moveY = Math.sin(e.angle) * e.speed * dt;

                            if (!checkWallCollision(e.x + moveX, e.y, e.size / 2)) {
                                e.x += moveX;
                            }
                            if (!checkWallCollision(e.x, e.y + moveY, e.size / 2)) {
                                e.y += moveY;
                            }
                        }

                        // Start charge if player in range for a bit
                        e.stateTimer += dt;
                        if (dist < 200 && e.stateTimer > 1.0) {
                            e.charging = true;
                            e.stateTimer = 1.5;
                            e.vx = Math.cos(e.angle) * e.chargeSpeed;
                            e.vy = Math.sin(e.angle) * e.chargeSpeed;
                        }
                    }
                }
                break;

            case 'queen':
                if (canSee) {
                    // Phase check
                    if (e.hp <= e.maxHp * 0.5 && e.phase === 1) {
                        e.phase = 2;
                        spawnFloatingText(e.x, e.y - 50, 'QUEEN ENRAGED!', '#FF0000');
                    }

                    // Summon drones
                    e.summonTimer -= dt;
                    if (e.summonTimer <= 0) {
                        e.summonTimer = e.phase === 2 ? 15 : 20;
                        const count = e.phase === 2 ? 4 : 3;
                        for (let j = 0; j < count; j++) {
                            const spawnAngle = Math.random() * Math.PI * 2;
                            spawnEnemy('drone', e.x + Math.cos(spawnAngle) * 80, e.y + Math.sin(spawnAngle) * 80);
                        }
                    }

                    // Move toward player
                    const speed = e.phase === 2 ? e.speed * 1.3 : e.speed;
                    const moveX = Math.cos(e.angle) * speed * dt;
                    const moveY = Math.sin(e.angle) * speed * dt;

                    if (!checkWallCollision(e.x + moveX, e.y, e.size / 2)) {
                        e.x += moveX;
                    }
                    if (!checkWallCollision(e.x, e.y + moveY, e.size / 2)) {
                        e.y += moveY;
                    }

                    // Attack
                    const attackRange = 80;
                    if (dist < attackRange && e.attackCooldown <= 0) {
                        const damage = e.phase === 2 ? 35 : 25;
                        damagePlayer(damage);
                        e.attackCooldown = e.phase === 2 ? 0.8 : 1.5;
                    }
                }
                break;
        }

        // Remove dead enemies
        if (e.hp <= 0) {
            // Expand 20: Increment kill count
            killCount++;

            // Expand 11: Add score based on enemy type
            let scoreValue = 0;
            switch (e.type) {
                case 'drone': scoreValue = 100; break;
                case 'brute': scoreValue = 250; break;
                case 'queen': scoreValue = 1000; break;
            }
            totalScore += scoreValue;
            spawnFloatingText(e.x, e.y - 30, `+${scoreValue}`, '#FFD700');

            // Death effects
            for (let j = 0; j < 10; j++) {
                particles.push({
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200,
                    size: 4 + Math.random() * 4,
                    color: COLORS.bloodAlien,
                    life: 0.5 + Math.random() * 0.5,
                    type: 'blood'
                });
            }

            // Expand 4: Create blood pool
            bloodPools.push({
                x: e.x,
                y: e.y,
                size: e.size * 0.8 + Math.random() * 10,
                alpha: 0.7
            });

            // Expand 5: Create corpse
            corpses.push({
                x: e.x,
                y: e.y,
                type: e.type,
                angle: e.angle,
                size: e.size,
                alpha: 1
            });

            // Drop loot
            if (e.type === 'drone' && Math.random() < 0.3) {
                pickups.push({
                    x: e.x,
                    y: e.y,
                    type: Math.random() < 0.5 ? 'health' : 'ammo',
                    amount: 15,
                    ammoType: ['shells', 'rifle', 'fuel'][Math.floor(Math.random() * 3)]
                });
            }
            if (e.type === 'brute' && Math.random() < 0.5) {
                pickups.push({
                    x: e.x,
                    y: e.y,
                    type: 'health',
                    amount: 30
                });
            }

            // Expand 17: Credits drop
            if (Math.random() < 0.25) {
                pickups.push({
                    x: e.x + (Math.random() - 0.5) * 20,
                    y: e.y + (Math.random() - 0.5) * 20,
                    type: 'credits',
                    amount: e.type === 'drone' ? 10 : e.type === 'brute' ? 25 : 100
                });
            }
            if (e.type === 'queen') {
                // Queen drops nothing, just unlocks exit
                spawnFloatingText(e.x, e.y - 50, 'QUEEN DEFEATED!', '#FFD700');
            }

            enemies.splice(i, 1);
        }
    }
}

// Damage player
function damagePlayer(amount) {
    if (player.invulnerable > 0) return;

    // Shield absorbs first
    if (player.shield > 0) {
        const shieldDamage = Math.min(player.shield, amount);
        player.shield -= shieldDamage;
        amount -= shieldDamage;
    }

    player.hp -= amount;
    player.invulnerable = 0.5;
    player.hurtFlash = 0.3; // Polish 2: Hurt screen flash

    // Screen shake on damage
    camera.shake = 0.2;
    camera.shakeIntensity = 5;

    // Blood particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            size: 3 + Math.random() * 3,
            color: COLORS.bloodHuman,
            life: 0.3 + Math.random() * 0.3,
            type: 'blood'
        });
    }

    if (player.hp <= 0) {
        player.hp = 0;
        gameState = GameState.GAME_OVER;
    }
}

// Update projectiles
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.traveled += Math.sqrt(p.vx * p.vx + p.vy * p.vy) * dt;

        // Check wall collision
        if (checkWallCollision(p.x, p.y, 2)) {
            // Sparks
            for (let j = 0; j < 5; j++) {
                particles.push({
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    size: 2,
                    color: '#FFAA00',
                    life: 0.2,
                    type: 'spark'
                });
            }
            projectiles.splice(i, 1);
            continue;
        }

        // Check range
        if (p.traveled > p.range) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check enemy collision
        if (p.owner === 'player') {
            let hit = false;
            for (const e of enemies) {
                const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
                if (dist < e.size / 2 + 4) {
                    // Expand 16: Critical hit chance (15%)
                    let damage = p.damage;
                    const isCrit = Math.random() < 0.15;
                    if (isCrit) {
                        damage = Math.floor(damage * 2);
                        spawnFloatingText(e.x, e.y - 20, 'CRIT!', '#FF00FF');
                    }
                    e.hp -= damage;

                    // Knockback (not for brute)
                    if (e.type !== 'brute' && p.knockback) {
                        const angle = Math.atan2(p.vy, p.vx);
                        e.x += Math.cos(angle) * p.knockback * 0.1;
                        e.y += Math.sin(angle) * p.knockback * 0.1;
                    }

                    // Hit particles
                    for (let j = 0; j < 3; j++) {
                        particles.push({
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            size: 3,
                            color: COLORS.bloodAlien,
                            life: 0.3,
                            type: 'blood'
                        });
                    }

                    hit = true;
                    break;
                }
            }

            // Expand 1: Check barrel collision
            if (!hit) {
                for (const b of barrels) {
                    const dist = Math.sqrt((p.x - b.x) ** 2 + (p.y - b.y) ** 2);
                    if (dist < b.radius + 4) {
                        b.hp -= p.damage;
                        hit = true;
                        break;
                    }
                }
            }

            // Expand 2: Check crate collision
            if (!hit) {
                for (const c of crates) {
                    const dist = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
                    if (dist < c.size / 2 + 4) {
                        c.hp -= p.damage;
                        // Wood debris
                        particles.push({
                            x: p.x,
                            y: p.y,
                            vx: (Math.random() - 0.5) * 50,
                            vy: (Math.random() - 0.5) * 50,
                            size: 2,
                            color: '#8B4513',
                            life: 0.2,
                            type: 'debris'
                        });
                        hit = true;
                        break;
                    }
                }
            }

            if (hit) {
                projectiles.splice(i, 1);
            }
        }
    }
}

// Update particles
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        if (p.vx !== undefined) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
    }
}

// Update floating texts
function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.life -= dt;
        t.y += t.vy * dt;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

// Expand 3: Update shell casings
function updateShellCasings(dt) {
    for (let i = shellCasings.length - 1; i >= 0; i--) {
        const c = shellCasings[i];
        c.life -= dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vx *= 0.9;
        c.vy *= 0.9;
        c.angle += 5 * dt;

        if (c.life <= 0) {
            shellCasings.splice(i, 1);
        }
    }
}

// Expand 1: Update barrels (check for damage)
function updateBarrels(dt) {
    for (let i = barrels.length - 1; i >= 0; i--) {
        const b = barrels[i];
        if (b.hp <= 0) {
            explodeBarrel(b);
            barrels.splice(i, 1);
        }
    }
}

// Expand 1: Barrel explosion
function explodeBarrel(barrel) {
    const explosionRadius = 80;
    const explosionDamage = 80;

    // Visual explosion
    for (let j = 0; j < 20; j++) {
        particles.push({
            x: barrel.x,
            y: barrel.y,
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            size: 6 + Math.random() * 8,
            color: j < 10 ? '#FF6600' : '#FFAA00',
            life: 0.3 + Math.random() * 0.4,
            type: 'explosion'
        });
    }

    // Screen shake
    camera.shake = 0.3;
    camera.shakeIntensity = 8;

    // Damage enemies
    for (const e of enemies) {
        const dist = Math.sqrt((e.x - barrel.x) ** 2 + (e.y - barrel.y) ** 2);
        if (dist < explosionRadius) {
            const damage = explosionDamage * (1 - dist / explosionRadius);
            e.hp -= damage;
        }
    }

    // Damage player
    const playerDist = Math.sqrt((player.x - barrel.x) ** 2 + (player.y - barrel.y) ** 2);
    if (playerDist < explosionRadius) {
        const damage = Math.floor(explosionDamage * (1 - playerDist / explosionRadius) * 0.5);
        damagePlayer(damage);
    }

    // Chain reaction to other barrels
    for (const other of barrels) {
        if (other !== barrel) {
            const dist = Math.sqrt((other.x - barrel.x) ** 2 + (other.y - barrel.y) ** 2);
            if (dist < explosionRadius) {
                other.hp -= 50;
            }
        }
    }

    // Floating text
    spawnFloatingText(barrel.x, barrel.y - 20, 'BOOM!', '#FF6600');
}

// Expand 2: Update crates
function updateCrates(dt) {
    for (let i = crates.length - 1; i >= 0; i--) {
        const c = crates[i];
        if (c.hp <= 0) {
            // Spawn debris particles
            for (let j = 0; j < 8; j++) {
                particles.push({
                    x: c.x,
                    y: c.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    size: 3 + Math.random() * 3,
                    color: '#8B4513',
                    life: 0.3 + Math.random() * 0.3,
                    type: 'debris'
                });
            }

            // Maybe drop item
            if (Math.random() < 0.3) {
                const roll = Math.random();
                if (roll < 0.5) {
                    pickups.push({ x: c.x, y: c.y, type: 'health', amount: 10 });
                } else {
                    pickups.push({ x: c.x, y: c.y, type: 'ammo', ammoType: 'shells', amount: 8 });
                }
            }

            crates.splice(i, 1);
        }
    }
}

// Update camera
function updateCamera(dt) {
    camera.targetX = player.x - VIEWPORT_W / 2;
    camera.targetY = player.y - VIEWPORT_H / 2;

    // Polish 4: Smoother camera with adjustable lerp
    const lerpSpeed = player.sprinting ? 0.15 : 0.08;
    camera.x += (camera.targetX - camera.x) * lerpSpeed;
    camera.y += (camera.targetY - camera.y) * lerpSpeed;

    // Screen shake
    if (camera.shake > 0) {
        camera.shake -= dt;
    }
}

// Draw functions
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    if (gameState === GameState.MENU) {
        drawMenu();
        return;
    }

    if (gameState === GameState.PAUSED) {
        drawGame();
        drawPauseMenu();
        return;
    }

    if (gameState === GameState.GAME_OVER) {
        drawGame();
        drawGameOver();
        return;
    }

    if (gameState === GameState.VICTORY) {
        drawGame();
        drawVictory();
        return;
    }

    drawGame();
}

function drawGame() {
    ctx.save();

    // Apply camera
    let offsetX = -camera.x;
    let offsetY = -camera.y;

    // Screen shake
    if (camera.shake > 0) {
        offsetX += (Math.random() - 0.5) * camera.shakeIntensity * 2;
        offsetY += (Math.random() - 0.5) * camera.shakeIntensity * 2;
    }

    ctx.translate(offsetX, offsetY);

    // Draw floor
    drawFloor();

    // Expand 4: Draw blood pools (under everything)
    drawBloodPools();

    // Expand 3: Draw shell casings
    drawShellCasings();

    // Expand 9: Draw decorations
    drawDecorations();

    // Draw walls
    drawWalls();

    // Expand 1: Draw barrels
    drawBarrels();

    // Expand 2: Draw crates
    drawCrates();

    // Expand 5: Draw corpses
    drawCorpses();

    // Draw doors
    drawDoors();

    // Draw pickups
    drawPickups();

    // Draw enemies
    drawEnemies();

    // Draw player
    drawPlayer();

    // Draw projectiles
    drawProjectiles();

    // Draw particles
    drawParticles();

    // Draw floating texts
    drawFloatingTexts();

    // Draw vision overlay (darkness outside vision cone)
    drawVisionOverlay();

    ctx.restore();

    // Draw HUD
    drawHUD();

    // Draw debug
    if (showDebug) {
        drawDebug();
    }
}

function drawFloor() {
    const startX = Math.floor(camera.x / TILE_SIZE) - 1;
    const startY = Math.floor(camera.y / TILE_SIZE) - 1;
    const endX = startX + Math.ceil(VIEWPORT_W / TILE_SIZE) + 2;
    const endY = startY + Math.ceil(VIEWPORT_H / TILE_SIZE) + 2;

    // Expand 12: Level-based floor colors
    let floorColor1, floorColor2, lineColor;
    switch (currentLevel) {
        case 1: // Cargo Bay - industrial gray/orange
            floorColor1 = '#2A2A2A';
            floorColor2 = '#353535';
            lineColor = '#222';
            break;
        case 2: // Engineering - red emergency lighting
            floorColor1 = '#2A2020';
            floorColor2 = '#352828';
            lineColor = '#201818';
            break;
        case 3: // Queen's Lair - organic purple/green
            floorColor1 = '#1A1A2A';
            floorColor2 = '#252535';
            lineColor = '#151520';
            break;
        default:
            floorColor1 = COLORS.floor;
            floorColor2 = COLORS.floorTile;
            lineColor = '#222';
    }

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            const isOdd = (x + y) % 2 === 0;

            // Refine 4: Metal grating floor pattern
            ctx.fillStyle = isOdd ? floorColor1 : floorColor2;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Grating lines (horizontal)
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(px + 4, py + 6 + i * 6);
                ctx.lineTo(px + TILE_SIZE - 4, py + 6 + i * 6);
                ctx.stroke();
            }

            // Grating border
            ctx.strokeStyle = isOdd ? '#2a2520' : '#353028';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Corner rivets
            ctx.fillStyle = '#555550';
            ctx.beginPath();
            ctx.arc(px + 4, py + 4, 2, 0, Math.PI * 2);
            ctx.arc(px + TILE_SIZE - 4, py + 4, 2, 0, Math.PI * 2);
            ctx.arc(px + 4, py + TILE_SIZE - 4, 2, 0, Math.PI * 2);
            ctx.arc(px + TILE_SIZE - 4, py + TILE_SIZE - 4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Expand 4: Draw blood pools
function drawBloodPools() {
    for (const pool of bloodPools) {
        if (pool.x < camera.x - 100 || pool.x > camera.x + VIEWPORT_W + 100) continue;
        if (pool.y < camera.y - 100 || pool.y > camera.y + VIEWPORT_H + 100) continue;

        ctx.globalAlpha = pool.alpha * 0.5;
        ctx.fillStyle = COLORS.bloodAlien;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.size, pool.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Expand 3: Draw shell casings
function drawShellCasings() {
    ctx.fillStyle = '#C4A000';
    for (const c of shellCasings) {
        if (c.x < camera.x - 50 || c.x > camera.x + VIEWPORT_W + 50) continue;
        if (c.y < camera.y - 50 || c.y > camera.y + VIEWPORT_H + 50) continue;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.globalAlpha = Math.min(1, c.life);
        ctx.fillRect(-3, -1.5, 6, 3);
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

// Expand 9: Draw decorations
function drawDecorations() {
    for (const d of decorations) {
        if (d.x < camera.x - 100 || d.x > camera.x + VIEWPORT_W + 100) continue;
        if (d.y < camera.y - 100 || d.y > camera.y + VIEWPORT_H + 100) continue;

        switch (d.type) {
            case 'pipe':
                // Refine 20: Industrial pipe with joints
                ctx.fillStyle = '#444';
                ctx.fillRect(d.x - 6, d.y, 12, 64);
                // Pipe highlight
                ctx.fillStyle = '#666';
                ctx.fillRect(d.x - 4, d.y, 3, 64);
                // Pipe joints
                ctx.fillStyle = '#555';
                ctx.fillRect(d.x - 8, d.y, 16, 6);
                ctx.fillRect(d.x - 8, d.y + 30, 16, 6);
                ctx.fillRect(d.x - 8, d.y + 58, 16, 6);
                break;

            case 'vent':
                // Refine 8: Large industrial fan like reference
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 24, 0, Math.PI * 2);
                ctx.fill();
                // Fan blades
                ctx.strokeStyle = '#444';
                ctx.lineWidth = 4;
                const fanAngle = gameTime * 3;
                for (let i = 0; i < 4; i++) {
                    const angle = fanAngle + (i * Math.PI / 2);
                    ctx.beginPath();
                    ctx.moveTo(d.x, d.y);
                    ctx.lineTo(d.x + Math.cos(angle) * 18, d.y + Math.sin(angle) * 18);
                    ctx.stroke();
                }
                // Center hub
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
                ctx.fill();
                // Outer ring
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 24, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'warning':
                // Refine 9: Diagonal warning stripes like reference
                ctx.save();
                ctx.beginPath();
                ctx.rect(d.x, d.y, d.w, 16);
                ctx.clip();
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(d.x, d.y, d.w, 16);
                // Diagonal stripes
                for (let i = -2; i < d.w / 8 + 2; i++) {
                    ctx.fillStyle = '#FF6600';
                    ctx.beginPath();
                    ctx.moveTo(d.x + i * 12, d.y);
                    ctx.lineTo(d.x + i * 12 + 6, d.y);
                    ctx.lineTo(d.x + i * 12 + 6 + 16, d.y + 16);
                    ctx.lineTo(d.x + i * 12 + 16, d.y + 16);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();
                break;

            case 'terminal':
                // Computer terminal
                ctx.fillStyle = '#333';
                ctx.fillRect(d.x - 12, d.y - 8, 24, 16);
                ctx.fillStyle = d.interacted ? '#444' : COLORS.terminal;
                ctx.fillRect(d.x - 10, d.y - 6, 20, 12);
                // Screen glow
                if (!d.interacted) {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, 20, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
}

// Expand 1: Draw barrels
function drawBarrels() {
    for (const b of barrels) {
        if (b.x < camera.x - 50 || b.x > camera.x + VIEWPORT_W + 50) continue;
        if (b.y < camera.y - 50 || b.y > camera.y + VIEWPORT_H + 50) continue;

        // Barrel body
        ctx.fillStyle = '#AA0000';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#CC2222';
        ctx.beginPath();
        ctx.arc(b.x - 4, b.y - 4, b.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Warning symbol
        ctx.fillStyle = '#FFAA00';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', b.x, b.y + 4);

        // Damage indicator
        if (b.hp < 30) {
            ctx.strokeStyle = `rgba(255, 100, 0, ${0.5 + Math.sin(gameTime * 10) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Expand 2: Draw crates
function drawCrates() {
    // Refine 18: Industrial metal crates like reference
    for (const c of crates) {
        if (c.x < camera.x - 50 || c.x > camera.x + VIEWPORT_W + 50) continue;
        if (c.y < camera.y - 50 || c.y > camera.y + VIEWPORT_H + 50) continue;

        const x = c.x - c.size / 2;
        const y = c.y - c.size / 2;

        // Metal crate body
        ctx.fillStyle = '#4a4540';
        ctx.fillRect(x, y, c.size, c.size);

        // Top highlight
        ctx.fillStyle = '#5a5550';
        ctx.fillRect(x, y, c.size, 3);
        ctx.fillRect(x, y, 3, c.size);

        // Bottom shadow
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(x, y + c.size - 3, c.size, 3);
        ctx.fillRect(x + c.size - 3, y, 3, c.size);

        // X straps
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + c.size - 4, y + c.size - 4);
        ctx.moveTo(x + c.size - 4, y + 4);
        ctx.lineTo(x + 4, y + c.size - 4);
        ctx.stroke();

        // Corner rivets
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.arc(x + 5, y + 5, 2, 0, Math.PI * 2);
        ctx.arc(x + c.size - 5, y + 5, 2, 0, Math.PI * 2);
        ctx.arc(x + 5, y + c.size - 5, 2, 0, Math.PI * 2);
        ctx.arc(x + c.size - 5, y + c.size - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Expand 5: Draw corpses
function drawCorpses() {
    for (const c of corpses) {
        if (c.x < camera.x - 100 || c.x > camera.x + VIEWPORT_W + 100) continue;
        if (c.y < camera.y - 100 || c.y > camera.y + VIEWPORT_H + 100) continue;

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.globalAlpha = c.alpha * 0.6;

        // Draw dead enemy (darker, flattened)
        switch (c.type) {
            case 'drone':
                ctx.fillStyle = '#0a0a15';
                ctx.beginPath();
                ctx.ellipse(0, 0, c.size / 2, c.size / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'brute':
                ctx.fillStyle = '#1a0a0a';
                ctx.beginPath();
                ctx.ellipse(0, 0, c.size / 2, c.size / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'queen':
                ctx.fillStyle = '#150a1a';
                ctx.beginPath();
                ctx.ellipse(0, 0, c.size / 2, c.size / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

function drawWalls() {
    // Refine 7: Industrial wall textures with panels and rivets
    for (const wall of walls) {
        // Check if in viewport
        if (wall.x + wall.w < camera.x || wall.x > camera.x + VIEWPORT_W) continue;
        if (wall.y + wall.h < camera.y || wall.y > camera.y + VIEWPORT_H) continue;

        // Main wall color
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Industrial panel pattern
        const panelSize = 32;
        for (let px = wall.x; px < wall.x + wall.w; px += panelSize) {
            for (let py = wall.y; py < wall.y + wall.h; py += panelSize) {
                // Panel border
                ctx.strokeStyle = '#3a3530';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 2, py + 2, panelSize - 4, panelSize - 4);

                // Corner rivets
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(px + 5, py + 5, 2, 0, Math.PI * 2);
                ctx.arc(px + panelSize - 5, py + 5, 2, 0, Math.PI * 2);
                ctx.arc(px + 5, py + panelSize - 5, 2, 0, Math.PI * 2);
                ctx.arc(px + panelSize - 5, py + panelSize - 5, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Top highlight
        ctx.fillStyle = COLORS.wallHighlight;
        ctx.fillRect(wall.x, wall.y, wall.w, 3);

        // Bottom shadow
        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(wall.x, wall.y + wall.h - 3, wall.w, 3);

        // Border
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
}

function drawDoors() {
    for (const door of doors) {
        if (door.open) continue;

        // Refine 10: Warning stripes around doors like reference
        const stripeWidth = 8;
        ctx.save();
        if (door.w > door.h) {
            // Horizontal door - stripes above and below
            for (let i = -4; i < door.w / 6 + 4; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#FF6600' : '#1a1a1a';
                ctx.fillRect(door.x - door.w / 2 + i * 6, door.y - door.h / 2 - stripeWidth, 6, stripeWidth);
                ctx.fillRect(door.x - door.w / 2 + i * 6, door.y + door.h / 2, 6, stripeWidth);
            }
        } else {
            // Vertical door - stripes left and right
            for (let i = -4; i < door.h / 6 + 4; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#FF6600' : '#1a1a1a';
                ctx.fillRect(door.x - door.w / 2 - stripeWidth, door.y - door.h / 2 + i * 6, stripeWidth, 6);
                ctx.fillRect(door.x + door.w / 2, door.y - door.h / 2 + i * 6, stripeWidth, 6);
            }
        }
        ctx.restore();

        ctx.fillStyle = door.type === 'blue' ? COLORS.doorBlue : COLORS.door;
        ctx.fillRect(door.x - door.w / 2, door.y - door.h / 2, door.w, door.h);

        // Door frame
        ctx.strokeStyle = door.type === 'blue' ? '#00AAFF' : '#777';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x - door.w / 2, door.y - door.h / 2, door.w, door.h);

        // Interaction prompt
        const dist = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2);
        if (dist < 80) {
            ctx.fillStyle = '#FFF';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            if (door.type === 'blue' && !player.keycards.blue) {
                ctx.fillText('NEED BLUE KEYCARD', door.x, door.y - 30);
            } else {
                ctx.fillText('SPACE/E to open', door.x, door.y - 30);
            }
        }
    }
}

function drawPickups() {
    for (const p of pickups) {
        // Check if in viewport
        if (p.x < camera.x - 50 || p.x > camera.x + VIEWPORT_W + 50) continue;
        if (p.y < camera.y - 50 || p.y > camera.y + VIEWPORT_H + 50) continue;

        const pulse = Math.sin(gameTime * 4) * 0.2 + 0.8;

        switch (p.type) {
            case 'health':
                ctx.fillStyle = `rgba(255, 68, 68, ${pulse})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('+', p.x, p.y + 5);
                break;

            case 'ammo':
                ctx.fillStyle = `rgba(255, 221, 0, ${pulse})`;
                ctx.fillRect(p.x - 8, p.y - 6, 16, 12);
                ctx.strokeStyle = '#AA8800';
                ctx.lineWidth = 1;
                ctx.strokeRect(p.x - 8, p.y - 6, 16, 12);
                break;

            case 'keycard':
                ctx.fillStyle = `rgba(0, 136, 255, ${pulse})`;
                ctx.fillRect(p.x - 12, p.y - 8, 24, 16);
                ctx.strokeStyle = '#00CCFF';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - 12, p.y - 8, 24, 16);
                ctx.fillStyle = '#FFF';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('KEY', p.x, p.y + 4);
                break;

            case 'weapon':
                ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
                ctx.fillRect(p.x - 16, p.y - 8, 32, 16);
                ctx.strokeStyle = '#00AA00';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - 16, p.y - 8, 32, 16);
                ctx.fillStyle = '#000';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.weaponType.toUpperCase().substring(0, 4), p.x, p.y + 3);
                break;

            case 'medkit':
                ctx.fillStyle = `rgba(255, 100, 100, ${pulse})`;
                ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(p.x - 6, p.y - 2, 12, 4);
                ctx.fillRect(p.x - 2, p.y - 6, 4, 12);
                break;

            case 'shield':
                // Expand 7: Shield pickup
                ctx.fillStyle = `rgba(68, 136, 255, ${pulse})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - 12);
                ctx.lineTo(p.x + 10, p.y - 4);
                ctx.lineTo(p.x + 10, p.y + 6);
                ctx.lineTo(p.x, p.y + 12);
                ctx.lineTo(p.x - 10, p.y + 6);
                ctx.lineTo(p.x - 10, p.y - 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#00AAFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'credits':
                // Expand 17: Credits pickup
                ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#AA8800';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('$', p.x, p.y + 4);
                break;
        }

        // E to pickup prompt
        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
        if (dist < 50) {
            ctx.fillStyle = '#FFF';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('E to pickup', p.x, p.y - 20);
        }
    }
}

function drawEnemies() {
    for (const e of enemies) {
        // Check if in viewport
        if (e.x < camera.x - 100 || e.x > camera.x + VIEWPORT_W + 100) continue;
        if (e.y < camera.y - 100 || e.y > camera.y + VIEWPORT_H + 100) continue;

        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        let mainColor, highlightColor;

        switch (e.type) {
            case 'drone':
                // Refine 5: More authentic black spider alien
                mainColor = '#000000';
                highlightColor = '#1a1a1a';

                // Spider legs (8 legs like reference)
                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = 3;
                for (let i = 0; i < 4; i++) {
                    const legAngle = (i - 1.5) * 0.6;
                    // Left legs
                    ctx.beginPath();
                    ctx.moveTo(-4, 0);
                    ctx.quadraticCurveTo(-8, -6, -12 - i * 2, -10 - i * 3);
                    ctx.stroke();
                    // Right legs
                    ctx.beginPath();
                    ctx.moveTo(-4, 0);
                    ctx.quadraticCurveTo(-8, 6, -12 - i * 2, 10 + i * 3);
                    ctx.stroke();
                }

                // Main body (dark oval)
                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, e.size / 2 - 2, e.size / 2.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Body segments
                ctx.fillStyle = highlightColor;
                ctx.beginPath();
                ctx.ellipse(-6, 0, 6, 5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Mandibles
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(10, -2);
                ctx.lineTo(14, -4);
                ctx.moveTo(10, 2);
                ctx.lineTo(14, 4);
                ctx.stroke();

                // Eyes (glowing red)
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(8, -3, 2, 0, Math.PI * 2);
                ctx.arc(8, 3, 2, 0, Math.PI * 2);
                ctx.fill();
                // Eye glow
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(8, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'brute':
                // Refine 17: Large armored spider-like brute
                mainColor = '#050505';
                highlightColor = '#151515';
                // Thick spider legs (6 legs)
                ctx.strokeStyle = '#0a0a0a';
                ctx.lineWidth = 5;
                for (let i = 0; i < 3; i++) {
                    const legAngle = (i - 1) * 0.5;
                    // Left legs
                    ctx.beginPath();
                    ctx.moveTo(-8, 0);
                    ctx.quadraticCurveTo(-16, -12 + i * 4, -24 - i * 4, -16 + i * 8);
                    ctx.stroke();
                    // Right legs
                    ctx.beginPath();
                    ctx.moveTo(-8, 0);
                    ctx.quadraticCurveTo(-16, 12 - i * 4, -24 - i * 4, 16 - i * 8);
                    ctx.stroke();
                }
                // Large armored body
                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, e.size / 2, e.size / 2.3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Body segments/armor plating
                ctx.fillStyle = highlightColor;
                ctx.beginPath();
                ctx.ellipse(-10, 0, 12, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(8, 0, 8, 7, 0, 0, Math.PI * 2);
                ctx.fill();
                // Large mandibles
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(20, -5);
                ctx.lineTo(28, -10);
                ctx.moveTo(20, 5);
                ctx.lineTo(28, 10);
                ctx.stroke();
                // Glowing red eyes
                ctx.fillStyle = '#FF0000';
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(16, -6, 4, 0, Math.PI * 2);
                ctx.arc(16, 6, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Charging indicator
                if (e.charging) {
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0, 0, e.size / 2 + 8, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;

            case 'queen':
                mainColor = COLORS.queen;
                highlightColor = COLORS.queenHighlight;
                // Massive body
                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, e.size / 2, e.size / 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                // Crown-like protrusions
                ctx.fillStyle = highlightColor;
                for (let i = 0; i < 5; i++) {
                    const crownAngle = (i - 2) * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(35 + Math.cos(crownAngle) * 15, Math.sin(crownAngle) * 30);
                    ctx.lineTo(25 + Math.cos(crownAngle) * 10, Math.sin(crownAngle) * 20);
                    ctx.closePath();
                    ctx.fill();
                }
                // Multiple eyes
                ctx.fillStyle = '#FF00FF';
                for (let i = 0; i < 6; i++) {
                    const eyeAngle = (i - 2.5) * 0.25;
                    ctx.beginPath();
                    ctx.arc(30 + Math.cos(eyeAngle) * 5, Math.sin(eyeAngle) * 15, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Phase 2 glow
                if (e.phase === 2) {
                    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, e.size / 2 + 10, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
        }

        ctx.restore();

        // Health bar
        if (e.hp < e.maxHp) {
            const barW = e.size;
            const barH = 4;
            ctx.fillStyle = '#440000';
            ctx.fillRect(e.x - barW / 2, e.y - e.size / 2 - 10, barW, barH);
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(e.x - barW / 2, e.y - e.size / 2 - 10, barW * (e.hp / e.maxHp), barH);
        }

        // Expand 13: Alert indicator
        if (e.alertTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 0, ${e.alertTimer})`;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', e.x, e.y - e.size / 2 - 18);
        }
    }
}

function drawPlayer() {
    // Refine 12: More armored soldier sprite like reference
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Invulnerability flash
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Dash effect
    if (player.dashing) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Legs (back)
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(-10, 8, 5, 6);
    ctx.fillRect(-10, -14, 5, 6);

    // Body (space suit/armor)
    ctx.fillStyle = '#6b5b4b';  // Olive/tan body armor
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armor highlights
    ctx.fillStyle = '#7a6a5a';
    ctx.beginPath();
    ctx.ellipse(2, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#5a5040';
    ctx.beginPath();
    ctx.arc(6, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    // Visor
    ctx.fillStyle = '#334455';
    ctx.beginPath();
    ctx.arc(8, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Expand 19: Different weapon visuals
    const weapon = player.weapons[player.currentWeapon];
    switch (weapon.type) {
        case 'pistol':
            ctx.fillStyle = '#444';
            ctx.fillRect(10, -2, 10, 4);
            break;
        case 'shotgun':
            ctx.fillStyle = '#333';
            ctx.fillRect(8, -3, 16, 6);
            ctx.fillStyle = '#555';
            ctx.fillRect(8, -2, 14, 2);
            break;
        case 'rifle':
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(6, -2, 20, 4);
            ctx.fillRect(10, -4, 6, 8);
            break;
        case 'flamethrower':
            ctx.fillStyle = '#444';
            ctx.fillRect(8, -4, 14, 8);
            ctx.fillStyle = '#FF6600';
            ctx.fillRect(20, -2, 4, 4);
            break;
    }

    ctx.restore();
}

function drawProjectiles() {
    for (const p of projectiles) {
        if (p.isFlame) {
            // Flame projectile - Polish 6: Better flame visuals
            const alpha = Math.min(1, (p.range - p.traveled) / p.range);
            // Inner flame (white-yellow)
            ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
            // Outer flame (orange-red)
            ctx.fillStyle = `rgba(255, ${80 + Math.random() * 70}, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
            // Smoke trail
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(p.x - p.vx * 0.03, p.y - p.vy * 0.03, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Polish 6: Improved bullet with glow
            // Outer glow
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Bullet core
            ctx.fillStyle = COLORS.bullet;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Improved bullet trail
            const trailLen = 0.04;
            const trailX = p.x - (p.vx * trailLen);
            const trailY = p.y - (p.vy * trailLen);
            const gradient = ctx.createLinearGradient(p.x, p.y, trailX, trailY);
            gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        const alpha = p.life;

        if (p.type === 'flash') {
            ctx.fillStyle = COLORS.muzzleFlash;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

function drawFloatingTexts() {
    // Polish 11: Improved floating text with scale and shadow
    for (const t of floatingTexts) {
        ctx.globalAlpha = Math.min(1, t.life * 1.5);

        // Scale effect (starts big, shrinks to normal)
        const scale = 1 + Math.max(0, (1.5 - t.life) * 0.3);

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(scale, scale);

        // Shadow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, 1, 1);

        // Main text
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, 0, 0);

        ctx.restore();
        ctx.globalAlpha = 1;
    }
}

function drawVisionOverlay() {
    // Polish 8: Improved vision cone with subtle flicker
    const flicker = 1 + Math.sin(gameTime * 3) * 0.02 + Math.random() * 0.01;
    const visionRange = 350 * flicker;
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 40,
        player.x, player.y, visionRange
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
    gradient.addColorStop(0.85, 'rgba(0,0,0,0.75)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)');

    // Draw darkness overlay
    ctx.fillStyle = gradient;
    ctx.fillRect(camera.x, camera.y, VIEWPORT_W, VIEWPORT_H);

    // Additional directional cone (flashlight)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Flashlight beam
    const beamRange = visionRange * 1.2;
    const coneGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, beamRange);
    const flickerIntensity = 0.08 + Math.sin(gameTime * 5) * 0.02;
    coneGradient.addColorStop(0, `rgba(255,255,220,${flickerIntensity})`);
    coneGradient.addColorStop(0.5, `rgba(255,255,200,${flickerIntensity * 0.5})`);
    coneGradient.addColorStop(1, 'rgba(255,255,200,0)');

    ctx.fillStyle = coneGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, beamRange, -Math.PI / 6, Math.PI / 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawHUD() {
    // Refine 1: Classic Alien Breed style HUD at top
    const hudY = 8;

    // Top bar background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, VIEWPORT_W, 35);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 35);
    ctx.lineTo(VIEWPORT_W, 35);
    ctx.stroke();

    // 1UP / Score section
    ctx.fillStyle = '#888';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1UP', 10, hudY + 14);
    ctx.fillStyle = '#FFF';
    ctx.fillText(totalScore.toString().padStart(6, '0'), 10, hudY + 28);

    // LIVES section (health bar - green)
    ctx.fillStyle = '#888';
    ctx.fillText('LIVES', 130, hudY + 14);
    ctx.fillStyle = '#003300';
    ctx.fillRect(130, hudY + 18, 120, 10);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(130, hudY + 18, 120 * (player.hp / player.maxHp), 10);

    // AMMO section (yellow bar)
    const weapon = player.weapons[player.currentWeapon];
    const wData = weaponData[weapon.type];
    ctx.fillStyle = '#888';
    ctx.fillText('AMMO', 280, hudY + 14);
    ctx.fillStyle = '#333300';
    ctx.fillRect(280, hudY + 18, 120, 10);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(280, hudY + 18, 120 * (weapon.mag / wData.magSize), 10);

    // KEYS section
    ctx.fillStyle = '#888';
    ctx.fillText('KEYS', 430, hudY + 14);
    // Blue key indicator
    ctx.fillStyle = player.keycards.blue ? '#0088FF' : '#333';
    ctx.fillRect(430, hudY + 18, 16, 10);

    // Level indicator on right side
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText(`LV${currentLevel}`, VIEWPORT_W - 10, hudY + 20);

    // Polish 9: Improved health bar with gradient
    const healthBarW = 200;
    const healthBarH = 20;
    const healthX = 20;
    const healthY = 45;
    const healthPercent = player.hp / player.maxHp;

    // Background
    ctx.fillStyle = COLORS.healthBg;
    ctx.fillRect(healthX, healthY, healthBarW, healthBarH);

    // Health gradient based on amount
    let healthColor;
    if (healthPercent > 0.5) {
        healthColor = '#00CC00';
    } else if (healthPercent > 0.25) {
        healthColor = '#FFAA00';
    } else {
        // Pulsing red when critical
        const pulse = Math.sin(gameTime * 8) * 0.3 + 0.7;
        healthColor = `rgb(${Math.floor(255 * pulse)}, 0, 0)`;
    }
    ctx.fillStyle = healthColor;
    ctx.fillRect(healthX, healthY, healthBarW * healthPercent, healthBarH);

    // Highlight on top
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(healthX, healthY, healthBarW * healthPercent, healthBarH / 3);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthX, healthY, healthBarW, healthBarH);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, healthX + 5, healthY + 15);

    // Shield bar (if any)
    if (player.shield > 0) {
        ctx.fillStyle = '#000044';
        ctx.fillRect(healthX, healthY + 25, 150, 15);
        ctx.fillStyle = COLORS.shield;
        ctx.fillRect(healthX, healthY + 25, 150 * (player.shield / player.maxShield), 15);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthX, healthY + 25, 150, 15);
    }

    // Stamina bar - Polish 15: Improved stamina display
    ctx.fillStyle = '#333';
    ctx.fillRect(healthX, healthY + 45, 100, 8);
    const staminaPercent = player.stamina / player.maxStamina;
    ctx.fillStyle = staminaPercent < 0.3 ? '#FF8800' : '#00AA00';
    ctx.fillRect(healthX, healthY + 45, 100 * staminaPercent, 8);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('STAMINA', healthX + 105, healthY + 53);

    // Polish 14: Dash cooldown indicator
    if (player.dashCooldown > 0) {
        ctx.fillStyle = '#00FFFF';
        ctx.font = '10px monospace';
        ctx.fillText(`DASH: ${player.dashCooldown.toFixed(1)}s`, healthX, healthY + 65);
    } else if (player.stamina >= 30) {
        ctx.fillStyle = '#00FFFF';
        ctx.font = '10px monospace';
        ctx.fillText('DASH READY', healthX, healthY + 65);
    }

    // Weapon info (reuse weapon/wData from top HUD section)

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(wData.name.toUpperCase(), 20, VIEWPORT_H - 50);

    ctx.font = '14px monospace';
    if (player.reloading) {
        // Polish 10: Reload progress bar
        ctx.fillStyle = '#FFAA00';
        ctx.fillText('RELOADING...', 20, VIEWPORT_H - 30);
        const reloadProgress = 1 - (player.reloadTimer / wData.reloadTime);
        ctx.fillStyle = '#333';
        ctx.fillRect(20, VIEWPORT_H - 18, 100, 6);
        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(20, VIEWPORT_H - 18, 100 * reloadProgress, 6);
    } else {
        // Polish 10: Ammo with color warning
        const lowAmmo = weapon.mag <= Math.floor(wData.magSize * 0.25);
        const criticalAmmo = weapon.mag <= Math.floor(wData.magSize * 0.1);
        if (criticalAmmo) {
            ctx.fillStyle = `rgb(255, ${Math.floor(100 + Math.sin(gameTime * 10) * 50)}, 100)`;
        } else if (lowAmmo) {
            ctx.fillStyle = '#FF8800';
        } else {
            ctx.fillStyle = '#FFF';
        }
        const ammoText = wData.ammoType ?
            `${weapon.mag}/${wData.magSize} | ${player.ammo[wData.ammoType]}` :
            `${weapon.mag}/${wData.magSize} | INF`;
        ctx.fillText(ammoText, 20, VIEWPORT_H - 30);

        // Ammo bar visual
        ctx.fillStyle = '#333';
        ctx.fillRect(20, VIEWPORT_H - 18, 100, 4);
        ctx.fillStyle = lowAmmo ? '#FF4444' : '#00AAFF';
        ctx.fillRect(20, VIEWPORT_H - 18, 100 * (weapon.mag / wData.magSize), 4);
    }

    // Keycards
    const keycardX = VIEWPORT_W - 100;
    const keycardY = VIEWPORT_H - 50;

    ctx.fillStyle = player.keycards.blue ? COLORS.keycard : '#333';
    ctx.fillRect(keycardX, keycardY, 24, 16);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(keycardX, keycardY, 24, 16);
    ctx.fillStyle = '#FFF';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BLUE', keycardX + 12, keycardY + 11);

    // Level indicator
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${currentLevel}`, VIEWPORT_W - 20, 30);

    // Medkits
    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`MEDKITS: ${player.medkits}`, VIEWPORT_W - 20, 50);

    // Expand 11: Score display
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`SCORE: ${totalScore}`, VIEWPORT_W - 20, 70);

    // Expand 20: Kill count
    ctx.fillStyle = '#FF4444';
    ctx.font = '12px monospace';
    ctx.fillText(`KILLS: ${killCount}`, VIEWPORT_W - 20, 90);

    // Expand 17: Credits display
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.fillText(`CREDITS: ${player.credits}`, VIEWPORT_W - 20, 110);

    // Minimap
    drawMinimap();

    // Polish 2: Hurt screen flash
    if (player.hurtFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${player.hurtFlash * 0.5})`;
        ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
    }

    // Polish 3: Low health warning
    if (player.hp <= 30 && player.hp > 0) {
        const pulse = Math.sin(gameTime * 6) * 0.15 + 0.15;
        ctx.strokeStyle = `rgba(255, 0, 0, ${pulse})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, VIEWPORT_W - 10, VIEWPORT_H - 10);
    }
}

function drawMinimap() {
    // Polish 1: Fixed minimap position to avoid HUD overlap
    const mapW = 150;
    const mapH = 100;
    const mapX = VIEWPORT_W - mapW - 20;
    const mapY = 130;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Calculate scale
    if (!levelData) return;
    const scaleX = mapW / (levelData.mapW * TILE_SIZE);
    const scaleY = mapH / (levelData.mapH * TILE_SIZE);
    const scale = Math.min(scaleX, scaleY) * 0.8;

    // Draw rooms
    for (const room of rooms) {
        const rx = mapX + 10 + room.x * TILE_SIZE * scale;
        const ry = mapY + 10 + room.y * TILE_SIZE * scale;
        const rw = room.w * TILE_SIZE * scale;
        const rh = room.h * TILE_SIZE * scale;

        if (clearedRooms.has(room.id)) {
            ctx.fillStyle = '#333';
        } else {
            ctx.fillStyle = '#111';
        }
        ctx.fillRect(rx, ry, rw, rh);
    }

    // Draw player
    const px = mapX + 10 + player.x * scale;
    const py = mapY + 10 + player.y * scale;
    ctx.fillStyle = '#0F0';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemies as red dots
    for (const e of enemies) {
        const ex = mapX + 10 + e.x * scale;
        const ey = mapY + 10 + e.y * scale;
        ctx.fillStyle = e.type === 'queen' ? '#FF00FF' : '#F00';
        ctx.beginPath();
        ctx.arc(ex, ey, e.type === 'queen' ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawDebug() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 80, 250, 200);

    ctx.fillStyle = '#0F0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const lines = [
        `DEBUG OVERLAY (Q to toggle)`,
        `------------------------`,
        `Player X: ${player.x.toFixed(0)}`,
        `Player Y: ${player.y.toFixed(0)}`,
        `Player HP: ${player.hp}/${player.maxHp}`,
        `Shield: ${player.shield}/${player.maxShield}`,
        `Stamina: ${player.stamina.toFixed(0)}`,
        `Current Level: ${currentLevel}`,
        `Enemies: ${enemies.length}`,
        `Kills: ${killCount}`,
        `Projectiles: ${projectiles.length}`,
        `Barrels: ${barrels.length}`,
        `Crates: ${crates.length}`,
        `Game State: ${['MENU','PLAYING','PAUSED','GAME_OVER','VICTORY'][gameState]}`,
        `Rooms Cleared: ${clearedRooms.size}/${rooms.length}`,
        `Has Blue Key: ${player.keycards.blue}`,
        `FPS: ${(1 / deltaTime).toFixed(0)}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 95 + i * 14);
    });
}

function drawMenu() {
    // Polish 12: Improved menu with animated background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Animated grid lines
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        const offset = (time * 20 + i * 50) % VIEWPORT_H;
        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(VIEWPORT_W, offset);
        ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
        const offset = (time * 15 + i * 50) % VIEWPORT_W;
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, VIEWPORT_H);
        ctx.stroke();
    }

    // Vignette effect
    const vignette = ctx.createRadialGradient(VIEWPORT_W/2, VIEWPORT_H/2, 200, VIEWPORT_W/2, VIEWPORT_H/2, VIEWPORT_W);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Title glow
    ctx.shadowColor = '#FF4444';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATION BREACH', VIEWPORT_W / 2, VIEWPORT_H / 3);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText('A Top-Down Survival Horror Shooter', VIEWPORT_W / 2, VIEWPORT_H / 3 + 40);

    // Pulsing start prompt
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.font = '24px monospace';
    ctx.fillText('CLICK OR PRESS SPACE TO START', VIEWPORT_W / 2, VIEWPORT_H / 2 + 50);

    // Controls info with box
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(VIEWPORT_W/2 - 400, VIEWPORT_H - 120, 800, 80);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(VIEWPORT_W/2 - 400, VIEWPORT_H - 120, 800, 80);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('WASD - Move | Mouse - Aim | LMB - Shoot | R - Reload | Space - Dash', VIEWPORT_W / 2, VIEWPORT_H - 90);
    ctx.fillText('E - Interact | Shift - Sprint | Q - Debug | Scroll - Switch Weapon', VIEWPORT_W / 2, VIEWPORT_H - 70);
    ctx.fillText('H - Use Medkit | ESC - Pause', VIEWPORT_W / 2, VIEWPORT_H - 50);
}

function drawPauseMenu() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEWPORT_W / 2, VIEWPORT_H / 2 - 30);

    ctx.font = '20px monospace';
    ctx.fillText('Press ESC to resume', VIEWPORT_W / 2, VIEWPORT_H / 2 + 30);
}

function drawGameOver() {
    // Polish 13: Improved game over screen
    ctx.fillStyle = 'rgba(20,0,0,0.9)';
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Vignette
    const vignette = ctx.createRadialGradient(VIEWPORT_W/2, VIEWPORT_H/2, 100, VIEWPORT_W/2, VIEWPORT_H/2, VIEWPORT_W);
    vignette.addColorStop(0, 'rgba(80,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Title with glow
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', VIEWPORT_W / 2, VIEWPORT_H / 2 - 80);
    ctx.shadowBlur = 0;

    // Stats box
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(VIEWPORT_W/2 - 200, VIEWPORT_H/2 - 30, 400, 120);
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(VIEWPORT_W/2 - 200, VIEWPORT_H/2 - 30, 400, 120);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText(`Level Reached: ${currentLevel}`, VIEWPORT_W / 2, VIEWPORT_H / 2);
    ctx.fillText(`Time: ${Math.floor(gameTime / 60)}:${(Math.floor(gameTime) % 60).toString().padStart(2, '0')}`, VIEWPORT_W / 2, VIEWPORT_H / 2 + 30);
    ctx.fillText(`Kills: ${killCount}  |  Score: ${totalScore}`, VIEWPORT_W / 2, VIEWPORT_H / 2 + 60);

    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.font = '20px monospace';
    ctx.fillText('Click or press SPACE to try again', VIEWPORT_W / 2, VIEWPORT_H / 2 + 140);

    // Allow restart
    if (mouse.down || keys[' ']) {
        startGame();
    }
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', VIEWPORT_W / 2, VIEWPORT_H / 2 - 50);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px monospace';
    ctx.fillText('You escaped the station!', VIEWPORT_W / 2, VIEWPORT_H / 2 + 20);
    ctx.fillText(`Total Time: ${Math.floor(gameTime / 60)}:${(Math.floor(gameTime) % 60).toString().padStart(2, '0')}`, VIEWPORT_W / 2, VIEWPORT_H / 2 + 50);

    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('Click or press SPACE to play again', VIEWPORT_W / 2, VIEWPORT_H / 2 + 120);

    // Allow restart
    if (mouse.down || keys[' ']) {
        startGame();
    }
}

// Main game loop
function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === GameState.PLAYING) {
        gameTime += deltaTime;

        updatePlayer(deltaTime);
        updateEnemies(deltaTime);
        updateProjectiles(deltaTime);
        updateParticles(deltaTime);
        updateFloatingTexts(deltaTime);
        updateShellCasings(deltaTime);
        updateBarrels(deltaTime);
        updateCrates(deltaTime);
        updateCamera(deltaTime);
    }

    draw();

    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
