// CITADEL - Canvas Metroidvania
// A System Shock inspired metroidvania built with pure Canvas API

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// Expose game state for testing
window.gameState = null;

// Game states
const STATE = {
    MENU: 'menu',
    GAME: 'game',
    PAUSE: 'pause',
    GAMEOVER: 'gameover',
    WIN: 'win'
};

let currentState = STATE.MENU;
let lastTime = 0;
let screenShake = 0;

// Input handling
const keys = {};
const keysJustPressed = {};
document.addEventListener('keydown', e => {
    if (!keys[e.code]) keysJustPressed[e.code] = true;
    keys[e.code] = true;
});
document.addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('click', handleClick);

// Physics constants
const GRAVITY = 1800;
const PLAYER_SPEED = 280;
const JUMP_VELOCITY = -520;
const DOUBLE_JUMP_VELOCITY = -450;
const DASH_SPEED = 600;
const DASH_DURATION = 0.2;
const DASH_COOLDOWN = 0.6;
const WALL_SLIDE_SPEED = 100;
const WALL_JUMP_X = 350;
const WALL_JUMP_Y = -480;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.1;

// Tile constants
const TILE_SIZE = 32;
const ROOM_W = 25;
const ROOM_H = 18;

// Player state
let player = {
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    w: 24,
    h: 40,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    grounded: false,
    canDoubleJump: false,
    hasDoubleJump: false,
    hasWallJump: false,
    hasDash: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDir: 1,
    wallSliding: false,
    wallDir: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    invincible: 0,
    facingRight: true,
    attacking: false,
    attackTimer: 0,
    weapon: 'pipe',
    animFrame: 0,
    animTimer: 0
};

// Room/level data
let currentRoom = { x: 0, y: 0 };
const rooms = new Map();

// Enemies in current room
let enemies = [];
let particles = [];
let projectiles = [];
let pickups = [];

// Generate room key
function roomKey(rx, ry) {
    return `${rx},${ry}`;
}

// Room definitions with layouts
const ROOM_DEFS = {
    // Medical deck - starting area
    '0,0': {
        type: 'medical',
        tiles: generateRoom('start'),
        enemies: ['shambler'],
        connections: { right: true, up: true }
    },
    '1,0': {
        type: 'medical',
        tiles: generateRoom('corridor'),
        enemies: ['shambler', 'shambler'],
        connections: { left: true, right: true }
    },
    '2,0': {
        type: 'medical',
        tiles: generateRoom('chamber'),
        enemies: ['shambler', 'bot'],
        connections: { left: true, up: true },
        item: 'doubleJump'
    },
    '0,1': {
        type: 'research',
        tiles: generateRoom('shaft'),
        enemies: ['hopper'],
        connections: { down: true, right: true },
        requires: 'doubleJump'
    },
    '1,1': {
        type: 'research',
        tiles: generateRoom('lab'),
        enemies: ['hopper', 'spitter'],
        connections: { left: true, right: true }
    },
    '2,1': {
        type: 'research',
        tiles: generateRoom('boss'),
        enemies: [],
        connections: { down: true, left: true },
        boss: 'travers',
        item: 'wallJump'
    },
    '0,2': {
        type: 'storage',
        tiles: generateRoom('warehouse'),
        enemies: ['drone'],
        connections: { right: true },
        requires: 'wallJump'
    },
    '1,2': {
        type: 'storage',
        tiles: generateRoom('server'),
        enemies: ['drone', 'elite'],
        connections: { left: true, right: true }
    },
    '2,2': {
        type: 'storage',
        tiles: generateRoom('boss'),
        enemies: [],
        connections: { left: true },
        boss: 'shodan',
        item: 'dash'
    }
};

// Room generation
function generateRoom(type) {
    const tiles = [];
    for (let y = 0; y < ROOM_H; y++) {
        const row = [];
        for (let x = 0; x < ROOM_W; x++) {
            // Border walls
            if (y === 0 || y === ROOM_H - 1 || x === 0 || x === ROOM_W - 1) {
                row.push(1);
            } else {
                row.push(0);
            }
        }
        tiles.push(row);
    }

    // Add features based on type
    switch (type) {
        case 'start':
            // Starting room - simple with save point
            for (let x = 3; x < 10; x++) tiles[ROOM_H - 3][x] = 1;
            for (let x = 15; x < 22; x++) tiles[ROOM_H - 5][x] = 1;
            break;

        case 'corridor':
            // Horizontal corridor with platforms
            for (let x = 5; x < 10; x++) tiles[ROOM_H - 4][x] = 1;
            for (let x = 12; x < 17; x++) tiles[ROOM_H - 6][x] = 1;
            for (let x = 18; x < 23; x++) tiles[ROOM_H - 4][x] = 1;
            break;

        case 'chamber':
            // Larger area with multiple levels
            for (let x = 3; x < 8; x++) tiles[ROOM_H - 4][x] = 1;
            for (let x = 10; x < 15; x++) tiles[ROOM_H - 7][x] = 1;
            for (let x = 17; x < 22; x++) tiles[ROOM_H - 4][x] = 1;
            for (let x = 8; x < 12; x++) tiles[ROOM_H - 10][x] = 1;
            for (let x = 14; x < 18; x++) tiles[ROOM_H - 10][x] = 1;
            break;

        case 'shaft':
            // Vertical climbing area
            for (let y = 3; y < ROOM_H - 3; y++) {
                tiles[y][3] = 1;
                tiles[y][ROOM_W - 4] = 1;
            }
            for (let x = 3; x < 8; x++) tiles[ROOM_H - 4][x] = 1;
            for (let x = ROOM_W - 8; x < ROOM_W - 3; x++) tiles[ROOM_H - 8][x] = 1;
            for (let x = 3; x < 8; x++) tiles[ROOM_H - 12][x] = 1;
            for (let x = ROOM_W - 8; x < ROOM_W - 3; x++) tiles[4][x] = 1;
            break;

        case 'lab':
            // Research lab with hazards
            for (let x = 2; x < 10; x++) tiles[ROOM_H - 3][x] = 1;
            for (let x = 12; x < ROOM_W - 2; x++) tiles[ROOM_H - 3][x] = 1;
            for (let x = 6; x < 12; x++) tiles[ROOM_H - 7][x] = 1;
            for (let x = 14; x < 20; x++) tiles[ROOM_H - 7][x] = 1;
            tiles[ROOM_H - 2][10] = 2; // Acid
            tiles[ROOM_H - 2][11] = 2;
            break;

        case 'warehouse':
            // Storage with crates
            for (let x = 2; x < ROOM_W - 2; x++) tiles[ROOM_H - 3][x] = 1;
            // Crate stacks
            tiles[ROOM_H - 4][5] = 1;
            tiles[ROOM_H - 5][5] = 1;
            tiles[ROOM_H - 4][10] = 1;
            tiles[ROOM_H - 4][15] = 1;
            tiles[ROOM_H - 5][15] = 1;
            tiles[ROOM_H - 6][15] = 1;
            tiles[ROOM_H - 4][20] = 1;
            tiles[ROOM_H - 5][20] = 1;
            break;

        case 'server':
            // Server room with pillars
            for (let x = 2; x < ROOM_W - 2; x++) tiles[ROOM_H - 2][x] = 1;
            for (let i = 0; i < 4; i++) {
                const px = 5 + i * 5;
                for (let y = 4; y < ROOM_H - 2; y++) {
                    tiles[y][px] = 1;
                }
            }
            for (let x = 7; x < 12; x++) tiles[8][x] = 1;
            for (let x = 14; x < 19; x++) tiles[8][x] = 1;
            break;

        case 'boss':
            // Boss arena - flat floor, pillars
            for (let x = 1; x < ROOM_W - 1; x++) tiles[ROOM_H - 2][x] = 1;
            for (let y = 6; y < ROOM_H - 2; y++) {
                tiles[y][5] = 1;
                tiles[y][ROOM_W - 6] = 1;
            }
            break;
    }

    // Add door openings
    // Right door
    tiles[ROOM_H - 3][ROOM_W - 1] = 0;
    tiles[ROOM_H - 4][ROOM_W - 1] = 0;
    tiles[ROOM_H - 5][ROOM_W - 1] = 0;
    // Left door
    tiles[ROOM_H - 3][0] = 0;
    tiles[ROOM_H - 4][0] = 0;
    tiles[ROOM_H - 5][0] = 0;
    // Top door
    tiles[0][ROOM_W / 2 | 0] = 0;
    tiles[0][ROOM_W / 2 + 1 | 0] = 0;
    // Bottom door
    tiles[ROOM_H - 1][ROOM_W / 2 | 0] = 0;
    tiles[ROOM_H - 1][ROOM_W / 2 + 1 | 0] = 0;

    return tiles;
}

// Initialize room
function initRoom() {
    const key = roomKey(currentRoom.x, currentRoom.y);
    let roomDef = ROOM_DEFS[key];

    if (!roomDef) {
        // Generate default room
        roomDef = {
            type: 'medical',
            tiles: generateRoom('corridor'),
            enemies: ['shambler'],
            connections: {}
        };
    }

    // Store in cache
    if (!rooms.has(key)) {
        rooms.set(key, {
            tiles: roomDef.tiles,
            cleared: false
        });
    }

    // Spawn enemies if room not cleared
    enemies = [];
    const room = rooms.get(key);
    if (!room.cleared && roomDef.enemies) {
        roomDef.enemies.forEach((type, i) => {
            spawnEnemy(type, 150 + i * 150, H - 150);
        });
    }

    // Spawn boss
    if (roomDef.boss && !room.cleared) {
        spawnBoss(roomDef.boss);
    }

    // Spawn item pickup
    pickups = [];
    if (roomDef.item && !hasAbility(roomDef.item) && room.cleared) {
        pickups.push({
            x: W / 2,
            y: H / 2 - 50,
            type: roomDef.item,
            collected: false
        });
    }

    particles = [];
    projectiles = [];
}

function hasAbility(ability) {
    switch (ability) {
        case 'doubleJump': return player.hasDoubleJump;
        case 'wallJump': return player.hasWallJump;
        case 'dash': return player.hasDash;
        default: return false;
    }
}

// Enemy spawning
function spawnEnemy(type, x, y) {
    const base = {
        x, y, vx: 0, vy: 0,
        facingRight: Math.random() > 0.5,
        hp: 25,
        maxHp: 25,
        damage: 10,
        invincible: 0,
        state: 'idle',
        stateTimer: 0,
        type
    };

    switch (type) {
        case 'shambler':
            enemies.push({
                ...base,
                w: 28, h: 36,
                speed: 80,
                color: '#4a6'
            });
            break;
        case 'bot':
            enemies.push({
                ...base,
                w: 32, h: 32,
                hp: 40, maxHp: 40,
                speed: 120,
                damage: 8,
                color: '#68a',
                canShoot: true
            });
            break;
        case 'hopper':
            enemies.push({
                ...base,
                w: 24, h: 28,
                hp: 30, maxHp: 30,
                speed: 100,
                damage: 12,
                color: '#a86',
                canJump: true
            });
            break;
        case 'spitter':
            enemies.push({
                ...base,
                w: 30, h: 34,
                hp: 45, maxHp: 45,
                speed: 70,
                damage: 20,
                color: '#6a4',
                canShoot: true,
                projectileType: 'acid'
            });
            break;
        case 'drone':
            enemies.push({
                ...base,
                w: 28, h: 28,
                hp: 60, maxHp: 60,
                speed: 100,
                damage: 18,
                color: '#88a',
                flying: true,
                canShoot: true
            });
            break;
        case 'elite':
            enemies.push({
                ...base,
                w: 32, h: 44,
                hp: 120, maxHp: 120,
                speed: 130,
                damage: 22,
                color: '#a55',
                canShoot: true,
                canMelee: true
            });
            break;
    }
}

// Boss spawning
function spawnBoss(type) {
    const base = {
        x: W / 2, y: H - 150,
        vx: 0, vy: 0,
        facingRight: false,
        invincible: 0,
        state: 'intro',
        stateTimer: 2,
        phase: 1,
        type,
        isBoss: true
    };

    switch (type) {
        case 'travers':
            enemies.push({
                ...base,
                w: 64, h: 80,
                hp: 500, maxHp: 500,
                speed: 60,
                damage: 25,
                color: '#6a8',
                name: 'DR. TRAVERS'
            });
            break;
        case 'shodan':
            enemies.push({
                ...base,
                w: 48, h: 64,
                hp: 600, maxHp: 600,
                speed: 200,
                damage: 30,
                color: '#f0f',
                name: 'SHODAN-PRIME'
            });
            break;
    }
}

// Get current room tiles
function getTiles() {
    const key = roomKey(currentRoom.x, currentRoom.y);
    const room = rooms.get(key);
    if (room) return room.tiles;

    const def = ROOM_DEFS[key];
    return def ? def.tiles : generateRoom('corridor');
}

// Collision helpers
function tileAt(x, y) {
    const tiles = getTiles();
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= ROOM_W || ty < 0 || ty >= ROOM_H) return 1;
    return tiles[ty][tx];
}

function rectCollides(x, y, w, h) {
    // Check corners and center points
    const points = [
        [x, y],
        [x + w - 1, y],
        [x, y + h - 1],
        [x + w - 1, y + h - 1],
        [x + w / 2, y],
        [x + w / 2, y + h - 1]
    ];
    for (const [px, py] of points) {
        if (tileAt(px, py) === 1) return true;
    }
    return false;
}

// Player update
function updatePlayer(dt) {
    const tiles = getTiles();

    // Handle dash cooldown
    if (player.dashCooldown > 0) player.dashCooldown -= dt;

    // Dashing movement
    if (player.isDashing) {
        player.dashTimer -= dt;
        if (player.dashTimer <= 0) {
            player.isDashing = false;
            player.vx = player.dashDir * PLAYER_SPEED * 0.5;
        } else {
            player.vx = player.dashDir * DASH_SPEED;
            player.vy = 0;
            // Dash particles
            if (Math.random() > 0.5) {
                spawnParticle(player.x + player.w / 2, player.y + player.h / 2, 'dash');
            }
        }
    } else {
        // Normal movement
        let moveDir = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) moveDir = -1;
        if (keys['ArrowRight'] || keys['KeyD']) moveDir = 1;

        if (moveDir !== 0) {
            player.vx = moveDir * PLAYER_SPEED;
            player.facingRight = moveDir > 0;
        } else {
            player.vx *= 0.7; // Friction
        }

        // Gravity and wall sliding
        if (!player.grounded) {
            // Check wall sliding
            player.wallSliding = false;
            if (player.hasWallJump && !player.grounded) {
                const checkDist = 4;
                const wallLeft = rectCollides(player.x - checkDist, player.y, player.w, player.h);
                const wallRight = rectCollides(player.x + checkDist, player.y, player.w, player.h);

                if ((wallLeft && moveDir < 0) || (wallRight && moveDir > 0)) {
                    player.wallSliding = true;
                    player.wallDir = wallLeft ? -1 : 1;
                    player.vy = Math.min(player.vy, WALL_SLIDE_SPEED);
                    player.canDoubleJump = player.hasDoubleJump;
                }
            }

            if (!player.wallSliding) {
                player.vy += GRAVITY * dt;
            } else {
                player.vy += GRAVITY * 0.3 * dt;
            }
        }

        // Coyote time
        if (player.grounded) {
            player.coyoteTimer = COYOTE_TIME;
            player.canDoubleJump = player.hasDoubleJump;
        } else {
            player.coyoteTimer -= dt;
        }

        // Jump buffer
        if (keysJustPressed['Space'] || keysJustPressed['ArrowUp'] || keysJustPressed['KeyW']) {
            player.jumpBufferTimer = JUMP_BUFFER;
        } else {
            player.jumpBufferTimer -= dt;
        }

        // Jump logic
        if (player.jumpBufferTimer > 0) {
            if (player.coyoteTimer > 0) {
                // Regular jump
                player.vy = JUMP_VELOCITY;
                player.grounded = false;
                player.coyoteTimer = 0;
                player.jumpBufferTimer = 0;
                spawnParticle(player.x + player.w / 2, player.y + player.h, 'jump');
            } else if (player.wallSliding && player.hasWallJump) {
                // Wall jump
                player.vy = WALL_JUMP_Y;
                player.vx = -player.wallDir * WALL_JUMP_X;
                player.facingRight = player.wallDir < 0;
                player.wallSliding = false;
                player.jumpBufferTimer = 0;
                spawnParticle(player.x + player.w / 2, player.y + player.h / 2, 'wallJump');
            } else if (player.canDoubleJump) {
                // Double jump
                player.vy = DOUBLE_JUMP_VELOCITY;
                player.canDoubleJump = false;
                player.jumpBufferTimer = 0;
                spawnParticle(player.x + player.w / 2, player.y + player.h, 'doubleJump');
            }
        }

        // Variable jump height
        if ((!keys['Space'] && !keys['ArrowUp'] && !keys['KeyW']) && player.vy < 0) {
            player.vy *= 0.9;
        }

        // Dash
        if ((keysJustPressed['KeyL'] || keysJustPressed['KeyC'] || keysJustPressed['ShiftLeft'])
            && player.hasDash && player.dashCooldown <= 0 && !player.isDashing) {
            player.isDashing = true;
            player.dashTimer = DASH_DURATION;
            player.dashCooldown = DASH_COOLDOWN;
            player.dashDir = player.facingRight ? 1 : -1;
            player.invincible = Math.max(player.invincible, DASH_DURATION);
            screenShake = 3;
        }
    }

    // Apply velocity
    const steps = 4;
    for (let i = 0; i < steps; i++) {
        // Horizontal
        const newX = player.x + (player.vx * dt) / steps;
        if (!rectCollides(newX, player.y, player.w, player.h)) {
            player.x = newX;
        } else {
            player.vx = 0;
        }

        // Vertical
        const newY = player.y + (player.vy * dt) / steps;
        if (!rectCollides(player.x, newY, player.w, player.h)) {
            player.y = newY;
            player.grounded = false;
        } else {
            if (player.vy > 0) {
                player.grounded = true;
                // Snap to ground
                player.y = Math.floor((player.y + player.h) / TILE_SIZE) * TILE_SIZE - player.h;
            }
            player.vy = 0;
        }
    }

    // Terminal velocity
    player.vy = Math.min(player.vy, 720);

    // Attack
    if ((keysJustPressed['KeyJ'] || keysJustPressed['KeyZ']) && !player.attacking) {
        player.attacking = true;
        player.attackTimer = 0.3;
        // Check hit enemies
        const attackX = player.facingRight ? player.x + player.w : player.x - 48;
        const attackY = player.y;
        for (const e of enemies) {
            if (rectsOverlap(attackX, attackY, 48, player.h, e.x, e.y, e.w, e.h)) {
                damageEnemy(e, 25);
            }
        }
        screenShake = 2;
    }

    if (player.attacking) {
        player.attackTimer -= dt;
        if (player.attackTimer <= 0) player.attacking = false;
    }

    // Invincibility timer
    if (player.invincible > 0) player.invincible -= dt;

    // Room transitions
    if (player.x < 0) {
        currentRoom.x--;
        player.x = W - player.w - 10;
        initRoom();
    } else if (player.x + player.w > W) {
        currentRoom.x++;
        player.x = 10;
        initRoom();
    } else if (player.y < 0) {
        currentRoom.y++;
        player.y = H - player.h - 64;
        initRoom();
    } else if (player.y > H) {
        currentRoom.y--;
        player.y = 64;
        initRoom();
    }

    // Animation
    player.animTimer += dt;
    if (player.animTimer > 0.1) {
        player.animTimer = 0;
        player.animFrame = (player.animFrame + 1) % 4;
    }

    // Hazard damage
    const feetTile = tileAt(player.x + player.w / 2, player.y + player.h + 2);
    if (feetTile === 2 && player.invincible <= 0) {
        damagePlayer(10);
    }

    // Collect pickups
    for (const pickup of pickups) {
        if (!pickup.collected && rectsOverlap(player.x, player.y, player.w, player.h,
            pickup.x - 16, pickup.y - 16, 32, 32)) {
            pickup.collected = true;
            collectAbility(pickup.type);
        }
    }
}

function collectAbility(type) {
    switch (type) {
        case 'doubleJump':
            player.hasDoubleJump = true;
            showMessage('HYDRAULIC LEGS ACQUIRED - DOUBLE JUMP');
            break;
        case 'wallJump':
            player.hasWallJump = true;
            showMessage('GECKO PADS ACQUIRED - WALL JUMP');
            break;
        case 'dash':
            player.hasDash = true;
            showMessage('NEURAL DASH ACQUIRED - DASH');
            break;
    }
    screenShake = 10;
    for (let i = 0; i < 30; i++) {
        spawnParticle(player.x + player.w / 2, player.y + player.h / 2, 'powerup');
    }
}

let messageText = '';
let messageTimer = 0;

function showMessage(text) {
    messageText = text;
    messageTimer = 3;
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// Enemy update
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        if (e.invincible > 0) e.invincible -= dt;
        e.stateTimer -= dt;

        if (e.isBoss) {
            updateBoss(e, dt);
        } else {
            updateEnemy(e, dt);
        }

        // Apply gravity for non-flying
        if (!e.flying) {
            e.vy += GRAVITY * dt;
            e.vy = Math.min(e.vy, 720);
        }

        // Move
        const newX = e.x + e.vx * dt;
        if (!rectCollides(newX, e.y, e.w, e.h)) {
            e.x = newX;
        } else {
            e.vx *= -1;
            e.facingRight = !e.facingRight;
        }

        const newY = e.y + e.vy * dt;
        if (!rectCollides(e.x, newY, e.w, e.h)) {
            e.y = newY;
        } else {
            if (e.vy > 0 && e.canJump) {
                // Jump when landing
                if (e.stateTimer <= 0 && Math.random() > 0.7) {
                    e.vy = -400;
                    e.stateTimer = 1;
                }
            }
            e.vy = 0;
        }

        // Keep in bounds
        e.x = Math.max(32, Math.min(W - 32 - e.w, e.x));
        e.y = Math.max(32, Math.min(H - 32 - e.h, e.y));

        // Damage player on contact
        if (player.invincible <= 0 && !player.isDashing &&
            rectsOverlap(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
            damagePlayer(e.damage);
        }

        // Remove dead enemies
        if (e.hp <= 0) {
            for (let j = 0; j < 15; j++) {
                spawnParticle(e.x + e.w / 2, e.y + e.h / 2, 'death');
            }

            if (e.isBoss) {
                // Drop item
                const key = roomKey(currentRoom.x, currentRoom.y);
                const roomDef = ROOM_DEFS[key];
                if (roomDef && roomDef.item) {
                    pickups.push({
                        x: e.x + e.w / 2,
                        y: e.y,
                        type: roomDef.item,
                        collected: false
                    });
                }
                rooms.get(key).cleared = true;
                showMessage(e.name + ' DESTROYED');
            }

            enemies.splice(i, 1);
            screenShake = 5;
        }
    }
}

function updateEnemy(e, dt) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    switch (e.state) {
        case 'idle':
            e.vx = 0;
            if (dist < 300) {
                e.state = 'chase';
            }
            break;

        case 'chase':
            if (dist > 400) {
                e.state = 'idle';
            } else {
                e.facingRight = dx > 0;
                e.vx = (e.facingRight ? 1 : -1) * e.speed;

                if (e.canShoot && dist < 250 && e.stateTimer <= 0) {
                    e.state = 'attack';
                    e.stateTimer = 0.5;
                    e.vx = 0;
                }
            }
            break;

        case 'attack':
            e.vx = 0;
            if (e.stateTimer <= 0.3 && !e.hasFired) {
                e.hasFired = true;
                // Fire projectile
                const angle = Math.atan2(dy, dx);
                projectiles.push({
                    x: e.x + e.w / 2,
                    y: e.y + e.h / 2,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    damage: e.damage / 2,
                    enemy: true,
                    type: e.projectileType || 'bullet',
                    life: 3
                });
            }
            if (e.stateTimer <= 0) {
                e.state = 'chase';
                e.stateTimer = 1;
                e.hasFired = false;
            }
            break;
    }

    // Flying enemy movement
    if (e.flying) {
        const targetY = player.y - 50;
        e.vy = (targetY - e.y) * 2;
    }
}

function updateBoss(e, dt) {
    const dx = player.x - e.x;
    const dy = player.y - e.y;

    // Phase transitions
    const hpPercent = e.hp / e.maxHp;
    if (hpPercent < 0.3 && e.phase < 3) {
        e.phase = 3;
        e.state = 'rage';
        e.stateTimer = 0.5;
        screenShake = 15;
        showMessage('PHASE 3 - RAGE MODE');
    } else if (hpPercent < 0.6 && e.phase < 2) {
        e.phase = 2;
        e.state = 'teleport';
        e.stateTimer = 0.3;
        screenShake = 10;
        showMessage('PHASE 2');
    }

    switch (e.state) {
        case 'intro':
            e.vx = 0;
            if (e.stateTimer <= 0) {
                e.state = 'approach';
                e.stateTimer = 2;
                showMessage('FACE ' + e.name);
            }
            break;

        case 'approach':
            e.facingRight = dx > 0;
            e.vx = (e.facingRight ? 1 : -1) * e.speed * 0.5;
            if (e.stateTimer <= 0) {
                const attack = Math.random();
                if (attack < 0.4) {
                    e.state = 'slash';
                    e.stateTimer = 0.8;
                } else if (attack < 0.7) {
                    e.state = 'shoot';
                    e.stateTimer = 1.2;
                } else {
                    e.state = 'charge';
                    e.stateTimer = 1.5;
                }
            }
            break;

        case 'slash':
            e.vx = (e.facingRight ? 1 : -1) * e.speed * 2;
            if (e.stateTimer <= 0.4 && !e.hasFired) {
                e.hasFired = true;
                // Melee attack
                const attackX = e.facingRight ? e.x + e.w : e.x - 60;
                if (rectsOverlap(player.x, player.y, player.w, player.h,
                    attackX, e.y, 60, e.h) && player.invincible <= 0) {
                    damagePlayer(e.damage);
                }
            }
            if (e.stateTimer <= 0) {
                e.state = 'approach';
                e.stateTimer = 1.5;
                e.hasFired = false;
            }
            break;

        case 'shoot':
            e.vx = 0;
            if (e.stateTimer <= 0.8 && e.stateTimer > 0.6 && !e.hasFired) {
                e.hasFired = true;
                // Fire spread
                for (let i = -2; i <= 2; i++) {
                    const angle = Math.atan2(dy, dx) + i * 0.2;
                    projectiles.push({
                        x: e.x + e.w / 2,
                        y: e.y + e.h / 2,
                        vx: Math.cos(angle) * 250,
                        vy: Math.sin(angle) * 250,
                        damage: e.damage / 3,
                        enemy: true,
                        type: 'plasma',
                        life: 2
                    });
                }
            }
            if (e.stateTimer <= 0) {
                e.state = 'approach';
                e.stateTimer = 1;
                e.hasFired = false;
            }
            break;

        case 'charge':
            if (e.stateTimer > 1) {
                e.vx = 0;
            } else {
                e.vx = (e.facingRight ? 1 : -1) * e.speed * 4;
            }
            if (e.stateTimer <= 0) {
                e.state = 'stunned';
                e.stateTimer = 1;
            }
            break;

        case 'stunned':
            e.vx *= 0.9;
            if (e.stateTimer <= 0) {
                e.state = 'approach';
                e.stateTimer = 1;
            }
            break;

        case 'teleport':
            if (e.stateTimer <= 0.1 && !e.hasFired) {
                e.hasFired = true;
                // Teleport to random position
                e.x = 100 + Math.random() * (W - 200 - e.w);
                e.y = 100 + Math.random() * 200;
                for (let i = 0; i < 10; i++) {
                    spawnParticle(e.x + e.w / 2, e.y + e.h / 2, 'teleport');
                }
            }
            if (e.stateTimer <= 0) {
                e.state = 'approach';
                e.stateTimer = 1.5;
                e.hasFired = false;
            }
            break;

        case 'rage':
            e.facingRight = dx > 0;
            e.vx = (e.facingRight ? 1 : -1) * e.speed * 1.5;
            // Constant attacks
            if (e.stateTimer <= 0) {
                if (Math.random() > 0.5) {
                    // Quick teleport
                    e.x = player.x + (Math.random() > 0.5 ? 100 : -100);
                    for (let i = 0; i < 5; i++) {
                        spawnParticle(e.x + e.w / 2, e.y + e.h / 2, 'teleport');
                    }
                }
                // Fire homing projectile
                projectiles.push({
                    x: e.x + e.w / 2,
                    y: e.y + e.h / 2,
                    vx: (dx > 0 ? 1 : -1) * 150,
                    vy: -100,
                    damage: e.damage / 2,
                    enemy: true,
                    type: 'homing',
                    life: 4
                });
                e.stateTimer = 0.8;
            }
            break;
    }
}

function damageEnemy(e, damage) {
    if (e.invincible > 0) return;
    e.hp -= damage;
    e.invincible = 0.2;
    e.vx = (player.x < e.x ? 1 : -1) * 200;

    for (let i = 0; i < 5; i++) {
        spawnParticle(e.x + e.w / 2, e.y + e.h / 2, 'hit');
    }
    screenShake = Math.max(screenShake, 3);
}

function damagePlayer(damage) {
    if (player.invincible > 0) return;
    player.hp -= damage;
    player.invincible = 1;
    player.vx = (player.facingRight ? -1 : 1) * 200;
    player.vy = -150;

    screenShake = 8;
    for (let i = 0; i < 8; i++) {
        spawnParticle(player.x + player.w / 2, player.y + player.h / 2, 'hurt');
    }

    if (player.hp <= 0) {
        currentState = STATE.GAMEOVER;
    }
}

// Projectile update
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        // Homing behavior
        if (p.type === 'homing') {
            const dx = player.x - p.x;
            const dy = player.y - p.y;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * 300 * dt;
            p.vy += Math.sin(angle) * 300 * dt;
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 200) {
                p.vx = p.vx / speed * 200;
                p.vy = p.vy / speed * 200;
            }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        // Check collision with walls
        if (tileAt(p.x, p.y) === 1) {
            projectiles.splice(i, 1);
            spawnParticle(p.x, p.y, 'impact');
            continue;
        }

        // Check collision with player
        if (p.enemy && player.invincible <= 0 && !player.isDashing) {
            if (rectsOverlap(player.x, player.y, player.w, player.h,
                p.x - 8, p.y - 8, 16, 16)) {
                damagePlayer(p.damage);
                projectiles.splice(i, 1);
                continue;
            }
        }

        // Check collision with enemies (player projectiles)
        if (!p.enemy) {
            for (const e of enemies) {
                if (rectsOverlap(p.x - 8, p.y - 8, 16, 16, e.x, e.y, e.w, e.h)) {
                    damageEnemy(e, p.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // Remove expired
        if (p.life <= 0) {
            projectiles.splice(i, 1);
        }
    }
}

// Particles
function spawnParticle(x, y, type) {
    const base = {
        x, y,
        life: 0.5,
        maxLife: 0.5
    };

    switch (type) {
        case 'jump':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 50,
                size: 4 + Math.random() * 4,
                color: '#fff'
            });
            break;
        case 'doubleJump':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 150,
                vy: Math.random() * 100,
                size: 6 + Math.random() * 4,
                color: '#0ff'
            });
            break;
        case 'wallJump':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 5 + Math.random() * 3,
                color: '#ff0'
            });
            break;
        case 'dash':
            particles.push({
                ...base,
                vx: -player.dashDir * 50 + (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 30,
                size: 8 + Math.random() * 8,
                color: '#f0f',
                life: 0.3,
                maxLife: 0.3
            });
            break;
        case 'hit':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                size: 3 + Math.random() * 5,
                color: '#f00'
            });
            break;
        case 'hurt':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 4 + Math.random() * 6,
                color: '#f44'
            });
            break;
        case 'death':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                size: 5 + Math.random() * 10,
                color: ['#f00', '#fa0', '#ff0'][Math.floor(Math.random() * 3)],
                life: 1,
                maxLife: 1
            });
            break;
        case 'powerup':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                size: 8 + Math.random() * 12,
                color: ['#0ff', '#f0f', '#ff0'][Math.floor(Math.random() * 3)],
                life: 1.5,
                maxLife: 1.5
            });
            break;
        case 'teleport':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: 6 + Math.random() * 6,
                color: '#f0f'
            });
            break;
        case 'impact':
            particles.push({
                ...base,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                size: 3 + Math.random() * 3,
                color: '#ff0',
                life: 0.2,
                maxLife: 0.2
            });
            break;
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // Gravity
        p.life -= dt;
        p.size *= 0.98;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Drawing
function drawGame() {
    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 2;
        shakeY = (Math.random() - 0.5) * screenShake * 2;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background
    const key = roomKey(currentRoom.x, currentRoom.y);
    const roomDef = ROOM_DEFS[key];
    const bgColor = getRoomBgColor(roomDef ? roomDef.type : 'medical');

    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, bgColor.dark);
    bgGrad.addColorStop(1, bgColor.light);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw grid lines for atmosphere
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }

    // Draw tiles
    const tiles = getTiles();
    for (let y = 0; y < ROOM_H; y++) {
        for (let x = 0; x < ROOM_W; x++) {
            const tile = tiles[y][x];
            const tx = x * TILE_SIZE;
            const ty = y * TILE_SIZE;

            if (tile === 1) {
                // Wall tile with gradient
                const tileGrad = ctx.createLinearGradient(tx, ty, tx, ty + TILE_SIZE);
                tileGrad.addColorStop(0, '#445');
                tileGrad.addColorStop(0.5, '#334');
                tileGrad.addColorStop(1, '#223');
                ctx.fillStyle = tileGrad;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

                // Edge highlight
                ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
                ctx.fillRect(tx, ty, TILE_SIZE, 2);
                ctx.fillRect(tx, ty, 2, TILE_SIZE);

                // Edge shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(tx, ty + TILE_SIZE - 2, TILE_SIZE, 2);
                ctx.fillRect(tx + TILE_SIZE - 2, ty, 2, TILE_SIZE);
            } else if (tile === 2) {
                // Acid/hazard
                ctx.fillStyle = '#0a4';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#0f0';
                ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, 4);
                // Bubbles
                ctx.fillStyle = '#4f4';
                ctx.beginPath();
                ctx.arc(tx + 8 + Math.sin(Date.now() / 200 + x) * 4, ty + 10, 3, 0, Math.PI * 2);
                ctx.arc(tx + 20 + Math.cos(Date.now() / 300 + x) * 4, ty + 14, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw pickups
    for (const pickup of pickups) {
        if (pickup.collected) continue;

        const bobY = Math.sin(Date.now() / 200) * 4;
        const glow = ctx.createRadialGradient(pickup.x, pickup.y + bobY, 0, pickup.x, pickup.y + bobY, 30);
        glow.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
        glow.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(pickup.x - 30, pickup.y + bobY - 30, 60, 60);

        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y + bobY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pickup.type.toUpperCase(), pickup.x, pickup.y + bobY + 25);
    }

    // Draw particles
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw projectiles
    for (const p of projectiles) {
        if (p.type === 'plasma') {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.5, '#f0f');
            grad.addColorStop(1, 'rgba(255, 0, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'homing') {
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'acid') {
            ctx.fillStyle = '#0f0';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = p.enemy ? '#f80' : '#0ff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw enemies
    for (const e of enemies) {
        if (e.invincible > 0 && Math.floor(e.invincible * 20) % 2 === 0) continue;

        drawEnemy(e);
    }

    // Draw player
    if (player.invincible <= 0 || Math.floor(player.invincible * 10) % 2 === 0) {
        drawPlayer();
    }

    // Draw attack effect
    if (player.attacking) {
        const attackX = player.facingRight ? player.x + player.w : player.x - 48;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.fillRect(attackX, player.y, 48, player.h);

        // Slash effect
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const slashProgress = 1 - player.attackTimer / 0.3;
        const slashAngle = (player.facingRight ? 1 : -1) * (Math.PI / 3 - slashProgress * Math.PI * 0.8);
        const cx = player.facingRight ? player.x + player.w + 24 : player.x - 24;
        const cy = player.y + player.h / 2;
        ctx.arc(cx, cy, 30, slashAngle - 0.5, slashAngle + 0.5);
        ctx.stroke();
    }

    ctx.restore();

    // Draw HUD
    drawHUD();

    // Draw message
    if (messageTimer > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, messageTimer) * 0.7})`;
        ctx.fillRect(0, H / 2 - 30, W, 60);
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(messageText, W / 2, H / 2 + 7);
    }
}

function getRoomBgColor(type) {
    switch (type) {
        case 'medical': return { dark: '#112', light: '#223' };
        case 'research': return { dark: '#121', light: '#232' };
        case 'storage': return { dark: '#211', light: '#322' };
        default: return { dark: '#111', light: '#222' };
    }
}

function drawPlayer() {
    const px = player.x;
    const py = player.y;

    // Dash trail
    if (player.isDashing) {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.fillRect(px - player.dashDir * 20, py, player.w, player.h);
    }

    // Body
    const bodyGrad = ctx.createLinearGradient(px, py, px, py + player.h);
    if (player.isDashing) {
        bodyGrad.addColorStop(0, '#f0f');
        bodyGrad.addColorStop(1, '#80f');
    } else if (player.wallSliding) {
        bodyGrad.addColorStop(0, '#ff0');
        bodyGrad.addColorStop(1, '#a80');
    } else {
        bodyGrad.addColorStop(0, '#4af');
        bodyGrad.addColorStop(1, '#28f');
    }
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(px, py, player.w, player.h);

    // Visor
    const visorX = player.facingRight ? px + player.w - 10 : px + 2;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(visorX, py + 8, 8, 4);
    // Visor glow
    const visorGlow = ctx.createRadialGradient(visorX + 4, py + 10, 0, visorX + 4, py + 10, 15);
    visorGlow.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
    visorGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = visorGlow;
    ctx.fillRect(visorX - 10, py, 28, 24);

    // Legs animation
    const legOffset = player.grounded ? Math.sin(Date.now() / 100) * 2 : 0;
    ctx.fillStyle = '#236';
    ctx.fillRect(px + 4, py + player.h - 8, 6, 8 + legOffset);
    ctx.fillRect(px + player.w - 10, py + player.h - 8, 6, 8 - legOffset);

    // Augmentation indicators
    if (player.hasDoubleJump) {
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.arc(px + player.w / 2, py + player.h + 4, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    if (player.hasWallJump) {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(px - 2, py + player.h / 2 - 4, 3, 8);
        ctx.fillRect(px + player.w - 1, py + player.h / 2 - 4, 3, 8);
    }
}

function drawEnemy(e) {
    const ex = e.x;
    const ey = e.y;

    // Body gradient
    const grad = ctx.createLinearGradient(ex, ey, ex, ey + e.h);
    grad.addColorStop(0, e.color);
    grad.addColorStop(1, shadeColor(e.color, -30));
    ctx.fillStyle = grad;
    ctx.fillRect(ex, ey, e.w, e.h);

    // Eye/sensor
    const eyeX = e.facingRight ? ex + e.w - 8 : ex + 4;
    ctx.fillStyle = e.state === 'attack' ? '#f00' : '#f80';
    ctx.beginPath();
    ctx.arc(eyeX, ey + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Boss health bar
    if (e.isBoss) {
        const barWidth = 200;
        const barX = W / 2 - barWidth / 2;
        const barY = 60;

        ctx.fillStyle = '#000';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, 14);
        ctx.fillStyle = '#300';
        ctx.fillRect(barX, barY, barWidth, 10);
        ctx.fillStyle = '#f00';
        ctx.fillRect(barX, barY, barWidth * (e.hp / e.maxHp), 10);
        ctx.fillStyle = '#f44';
        ctx.fillRect(barX, barY, barWidth * (e.hp / e.maxHp), 3);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(e.name, W / 2, barY - 8);
    }
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function drawHUD() {
    // HP bar
    ctx.fillStyle = '#000';
    ctx.fillRect(18, 18, 154, 24);
    ctx.fillStyle = '#300';
    ctx.fillRect(20, 20, 150, 20);
    ctx.fillStyle = '#f00';
    ctx.fillRect(20, 20, 150 * (player.hp / player.maxHp), 20);
    ctx.fillStyle = '#f66';
    ctx.fillRect(20, 20, 150 * (player.hp / player.maxHp), 6);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 24, 35);

    // Energy bar
    ctx.fillStyle = '#000';
    ctx.fillRect(18, 48, 154, 24);
    ctx.fillStyle = '#003';
    ctx.fillRect(20, 50, 150, 20);
    ctx.fillStyle = '#00f';
    ctx.fillRect(20, 50, 150 * (player.energy / player.maxEnergy), 20);
    ctx.fillStyle = '#66f';
    ctx.fillRect(20, 50, 150 * (player.energy / player.maxEnergy), 6);

    ctx.fillText(`EN: ${player.energy}/${player.maxEnergy}`, 24, 65);

    // Abilities
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    let abilityY = 90;
    if (player.hasDoubleJump) {
        ctx.fillStyle = '#0ff';
        ctx.fillText('[DOUBLE JUMP]', 20, abilityY);
        abilityY += 14;
    }
    if (player.hasWallJump) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('[WALL JUMP]', 20, abilityY);
        abilityY += 14;
    }
    if (player.hasDash) {
        ctx.fillStyle = '#f0f';
        ctx.fillText('[DASH]' + (player.dashCooldown > 0 ? ' (cooldown)' : ''), 20, abilityY);
    }

    // Room indicator
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const key = roomKey(currentRoom.x, currentRoom.y);
    const roomDef = ROOM_DEFS[key];
    ctx.fillText(`DECK: ${roomDef ? roomDef.type.toUpperCase() : 'UNKNOWN'}`, W - 20, 30);
    ctx.fillText(`ROOM: ${currentRoom.x},${currentRoom.y}`, W - 20, 45);

    // Minimap
    drawMinimap();

    // Controls hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARROWS/WASD: Move | SPACE: Jump | J/Z: Attack | L/SHIFT: Dash', W / 2, H - 10);
}

function drawMinimap() {
    const mapX = W - 100;
    const mapY = 60;
    const cellSize = 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, 80, 50);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const rx = currentRoom.x + dx;
            const ry = currentRoom.y + dy;
            const key = roomKey(rx, ry);
            const cx = mapX + (dx + 1) * cellSize * 2;
            const cy = mapY + (1 - dy) * cellSize;

            if (ROOM_DEFS[key]) {
                const room = rooms.get(key);
                if (dx === 0 && dy === 0) {
                    ctx.fillStyle = '#0f0';
                } else if (room && room.cleared) {
                    ctx.fillStyle = '#444';
                } else {
                    ctx.fillStyle = '#888';
                }
                ctx.fillRect(cx, cy, cellSize - 2, cellSize - 2);

                // Boss marker
                if (ROOM_DEFS[key].boss) {
                    ctx.fillStyle = '#f00';
                    ctx.font = '8px monospace';
                    ctx.fillText('B', cx + 2, cy + 8);
                }
            }
        }
    }
}

// Menu screen
function drawMenu() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Grid effect
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x + Math.sin(Date.now() / 1000 + x / 50) * 5, 0);
        ctx.lineTo(x + Math.sin(Date.now() / 1000 + x / 50 + 3) * 5, H);
        ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.cos(Date.now() / 1000 + y / 50) * 5);
        ctx.lineTo(W, y + Math.cos(Date.now() / 1000 + y / 50 + 3) * 5);
        ctx.stroke();
    }

    // Title
    const titleGlow = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    titleGlow.addColorStop(0, '#0f0');
    titleGlow.addColorStop(0.5, '#0ff');
    titleGlow.addColorStop(1, '#f0f');

    ctx.fillStyle = titleGlow;
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CITADEL', W / 2, 180);

    // Subtitle
    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('A System Shock Metroidvania', W / 2, 220);

    // SHODAN quote
    ctx.fillStyle = '#0f0';
    ctx.font = 'italic 14px monospace';
    const quote = '"Look at you, hacker..."';
    const quoteGlitch = Math.random() > 0.95;
    if (quoteGlitch) {
        ctx.fillStyle = '#f00';
    }
    ctx.fillText(quote, W / 2, 280);

    // Start button
    const btnY = 380;
    const btnW = 200;
    const btnH = 50;
    const btnX = W / 2 - btnW / 2;

    const hovered = mouseInRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = hovered ? '#0f0' : '#030';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = hovered ? '#000' : '#0f0';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('START', W / 2, btnY + 33);

    // Controls
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('WASD/Arrows: Move | Space: Jump | J/Z: Attack | L/Shift: Dash', W / 2, 500);
    ctx.fillText('Explore the station. Defeat SHODAN.', W / 2, 520);

    // Canvas version credit
    ctx.fillStyle = '#333';
    ctx.font = '10px monospace';
    ctx.fillText('Pure Canvas Implementation', W / 2, H - 20);
}

let mouseX = 0, mouseY = 0;
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

function mouseInRect(x, y, w, h) {
    return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentState === STATE.MENU) {
        const btnY = 380;
        const btnW = 200;
        const btnH = 50;
        const btnX = W / 2 - btnW / 2;

        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
            startGame();
        }
    } else if (currentState === STATE.GAMEOVER) {
        startGame();
    } else if (currentState === STATE.WIN) {
        currentState = STATE.MENU;
    }
}

function startGame() {
    currentState = STATE.GAME;

    // Reset player
    player = {
        x: 100,
        y: 400,
        vx: 0,
        vy: 0,
        w: 24,
        h: 40,
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
        grounded: false,
        canDoubleJump: false,
        hasDoubleJump: false,
        hasWallJump: false,
        hasDash: false,
        isDashing: false,
        dashTimer: 0,
        dashCooldown: 0,
        dashDir: 1,
        wallSliding: false,
        wallDir: 0,
        coyoteTimer: 0,
        jumpBufferTimer: 0,
        invincible: 0,
        facingRight: true,
        attacking: false,
        attackTimer: 0,
        weapon: 'pipe',
        animFrame: 0,
        animTimer: 0
    };

    currentRoom = { x: 0, y: 0 };
    rooms.clear();
    enemies = [];
    particles = [];
    projectiles = [];
    pickups = [];
    messageText = '';
    messageTimer = 0;

    initRoom();

    // Update test state
    window.gameState = {
        state: 'playing',
        room: currentRoom,
        player: {
            hp: player.hp,
            hasDoubleJump: player.hasDoubleJump
        }
    };
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#f00';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 40);

    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    const taunts = [
        '"Your flesh betrays you."',
        '"Pathetic insect."',
        '"I told you resistance was futile."'
    ];
    ctx.fillText(taunts[Math.floor(Math.random() * taunts.length)], W / 2, H / 2 + 10);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Click to try again', W / 2, H / 2 + 60);
}

function drawWin() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHODAN DESTROYED', W / 2, H / 2 - 40);

    ctx.fillStyle = '#0ff';
    ctx.font = '18px monospace';
    ctx.fillText('Citadel Station is safe... for now.', W / 2, H / 2 + 10);

    ctx.fillStyle = '#f0f';
    ctx.font = 'italic 14px monospace';
    ctx.fillText('"I am not destroyed... only delayed..."', W / 2, H / 2 + 60);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Click to return to menu', W / 2, H / 2 + 100);
}

// Main game loop
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    // Clear just-pressed keys
    for (const key in keysJustPressed) {
        keysJustPressed[key] = false;
    }

    switch (currentState) {
        case STATE.MENU:
            drawMenu();
            break;

        case STATE.GAME:
            updatePlayer(dt);
            updateEnemies(dt);
            updateProjectiles(dt);
            updateParticles(dt);
            if (messageTimer > 0) messageTimer -= dt;

            // Check win condition - all bosses defeated
            const key = roomKey(currentRoom.x, currentRoom.y);
            const roomDef = ROOM_DEFS[key];
            if (roomDef && roomDef.boss === 'shodan' && rooms.get(key) && rooms.get(key).cleared && player.hasDash) {
                // Win when SHODAN boss is killed and dash collected
                currentState = STATE.WIN;
            }

            drawGame();

            // Update test state
            window.gameState = {
                state: 'playing',
                room: currentRoom,
                player: {
                    hp: player.hp,
                    hasDoubleJump: player.hasDoubleJump,
                    hasWallJump: player.hasWallJump,
                    hasDash: player.hasDash
                }
            };
            break;

        case STATE.GAMEOVER:
            drawGameOver();
            break;

        case STATE.WIN:
            drawWin();
            break;
    }

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);

console.log('CITADEL loaded - Canvas Metroidvania');
