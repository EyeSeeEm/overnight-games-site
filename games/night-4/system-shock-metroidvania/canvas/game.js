// CITADEL - A System Shock Metroidvania
// Pure Canvas Implementation

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const ROOM_WIDTH = 30;
const ROOM_HEIGHT = 17;
const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 540;

// Physics constants (from GDD)
const PHYSICS = {
    WALK_ACCEL: 1800,
    WALK_MAX_SPEED: 280,
    FRICTION: 2400,
    AIR_CONTROL: 0.7,
    GRAVITY: 1200,
    JUMP_VELOCITY: -480,
    JUMP_HOLD_GRAVITY: 600,
    TERMINAL_VELOCITY: 720,
    COYOTE_TIME: 0.1,
    JUMP_BUFFER: 0.15,
    DOUBLE_JUMP_VELOCITY: -400,
    WALL_SLIDE_SPEED: 120,
    WALL_JUMP_X: 320,
    WALL_JUMP_Y: -420,
    DASH_SPEED: 800,
    DASH_DURATION: 0.25,
    DASH_COOLDOWN: 0.8,
    IFRAMES: 1.0,
    KNOCKBACK_X: 200,
    KNOCKBACK_Y: -150,
    KNOCKBACK_DURATION: 0.3
};

// Game state
const game = {
    state: 'menu', // menu, playing, paused, gameover, victory
    currentRoom: { deck: 'medical', x: 0, y: 0 },
    visitedRooms: new Set(),
    killedBosses: new Set(),
    time: 0,
    shakeIntensity: 0,
    shodanMessage: null,
    shodanTimer: 0
};

// Player state
const player = {
    x: 200, y: 300,
    vx: 0, vy: 0,
    width: 24, height: 40,
    hp: 100, maxHp: 100,
    energy: 100, maxEnergy: 100,
    facingRight: true,
    isGrounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    iframes: 0,
    knockbackTimer: 0,
    // Augmentations
    hasDoubleJump: false,
    hasWallJump: false,
    hasDash: false,
    hasThermal: false,
    hasHazmat: false,
    hasMagnetic: false,
    // Jump/movement state
    canDoubleJump: false,
    isWallSliding: false,
    wallDirection: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirection: { x: 0, y: 0 },
    // Combat
    isAttacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    currentWeapon: 'pipe',
    ammo: { standard: 50, magnum: 0, shells: 0 },
    // Animation
    animFrame: 0,
    animTimer: 0
};

// Weapons data
const WEAPONS = {
    pipe: { damage: 15, range: 48, speed: 0.4, type: 'melee' },
    leadPipe: { damage: 22, range: 48, speed: 0.45, type: 'melee' },
    laserRapier: { damage: 30, range: 56, speed: 0.3, type: 'melee' },
    minipistol: { damage: 12, range: 400, speed: 0.25, type: 'ranged', ammoType: 'standard' }
};

// Enemy types
const ENEMY_TYPES = {
    shambler: { hp: 25, damage: 10, speed: 80, width: 28, height: 36, color: '#558844', behavior: 'chase' },
    maintenanceBot: { hp: 40, damage: 8, speed: 120, width: 24, height: 24, color: '#666688', behavior: 'patrol' },
    mutantDog: { hp: 20, damage: 15, speed: 200, width: 32, height: 20, color: '#885544', behavior: 'lunge' },
    cyborg: { hp: 60, damage: 18, speed: 100, width: 28, height: 40, color: '#445566', behavior: 'shoot' }
};

// Current room data
let currentTiles = [];
let enemies = [];
let projectiles = [];
let particles = [];
let pickups = [];

// Room templates (procedural + handcrafted elements)
const ROOM_TEMPLATES = {
    medical: {
        name: 'Medical Deck',
        bgColor: '#1a1a2e',
        tileColor: '#2a2a4e',
        enemies: ['shambler', 'maintenanceBot'],
        rooms: [
            // Starting room
            { x: 0, y: 0, type: 'start', exits: ['right'] },
            { x: 1, y: 0, type: 'corridor', exits: ['left', 'right', 'up'] },
            { x: 2, y: 0, type: 'chamber', exits: ['left', 'right'] },
            { x: 3, y: 0, type: 'save', exits: ['left', 'down'] },
            { x: 1, y: -1, type: 'item', exits: ['down'], item: 'healthModule' },
            { x: 3, y: 1, type: 'boss', exits: ['up'], boss: 'diego' }
        ]
    },
    research: {
        name: 'Research Deck',
        bgColor: '#1e2a1e',
        tileColor: '#2e4a2e',
        enemies: ['shambler', 'mutantDog', 'cyborg'],
        rooms: []
    }
};

// Input handling
const keys = {};
const justPressed = {};

document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
        justPressed[e.code] = true;
    }
    keys[e.code] = true;
    e.preventDefault();
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Initialize game
function init() {
    loadRoom('medical', 0, 0);
    requestAnimationFrame(gameLoop);
}

// Load a room
function loadRoom(deck, x, y) {
    const deckData = ROOM_TEMPLATES[deck];
    const roomDef = deckData.rooms.find(r => r.x === x && r.y === y);

    game.currentRoom = { deck, x, y };
    game.visitedRooms.add(`${deck}:${x}:${y}`);

    // Generate tiles
    currentTiles = generateRoomTiles(deckData, roomDef);

    // Spawn enemies
    enemies = [];
    if (roomDef && roomDef.type !== 'save' && roomDef.type !== 'start') {
        spawnEnemies(deckData, roomDef);
    }

    // Clear projectiles/particles
    projectiles = [];
    particles = [];
    pickups = [];

    // Spawn pickups
    if (roomDef && roomDef.item) {
        spawnPickup(roomDef.item);
    }

    // SHODAN message for new rooms
    if (!game.visitedRooms.has(`${deck}:${x}:${y}_visited`)) {
        game.visitedRooms.add(`${deck}:${x}:${y}_visited`);
        if (Math.random() < 0.3) {
            showShodanMessage("I SEE YOU, INSECT. YOU CANNOT HIDE.");
        }
    }
}

function generateRoomTiles(deckData, roomDef) {
    const tiles = [];

    for (let y = 0; y < ROOM_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            // Borders
            if (y === 0 || y === ROOM_HEIGHT - 1 || x === 0 || x === ROOM_WIDTH - 1) {
                row.push(1); // Solid wall
            } else if (y >= ROOM_HEIGHT - 3 && Math.random() < 0.1) {
                row.push(1); // Random floor platforms
            } else if (y === ROOM_HEIGHT - 2) {
                row.push(1); // Floor
            } else {
                row.push(0); // Empty
            }
        }
        tiles.push(row);
    }

    // Add platforms based on room type
    if (roomDef) {
        switch (roomDef.type) {
            case 'chamber':
                // Add platforms
                for (let px = 5; px < 12; px++) tiles[10][px] = 1;
                for (let px = 18; px < 25; px++) tiles[8][px] = 1;
                for (let px = 10; px < 20; px++) tiles[5][px] = 1;
                break;
            case 'corridor':
                // Clear some walls for passage
                for (let py = 5; py < 12; py++) {
                    if (Math.random() < 0.3) {
                        tiles[py][Math.floor(Math.random() * 10) + 10] = 1;
                    }
                }
                break;
            case 'save':
                // Save room - add save point marker
                for (let px = 12; px < 18; px++) tiles[12][px] = 1;
                break;
            case 'boss':
                // Boss arena - platforms
                for (let px = 3; px < 10; px++) tiles[10][px] = 1;
                for (let px = 20; px < 27; px++) tiles[10][px] = 1;
                for (let px = 10; px < 20; px++) tiles[6][px] = 1;
                break;
        }

        // Create exits
        if (roomDef.exits) {
            if (roomDef.exits.includes('left')) {
                tiles[ROOM_HEIGHT - 4][0] = 0;
                tiles[ROOM_HEIGHT - 3][0] = 0;
                tiles[ROOM_HEIGHT - 5][0] = 0;
            }
            if (roomDef.exits.includes('right')) {
                tiles[ROOM_HEIGHT - 4][ROOM_WIDTH - 1] = 0;
                tiles[ROOM_HEIGHT - 3][ROOM_WIDTH - 1] = 0;
                tiles[ROOM_HEIGHT - 5][ROOM_WIDTH - 1] = 0;
            }
            if (roomDef.exits.includes('up')) {
                tiles[0][ROOM_WIDTH / 2] = 0;
                tiles[0][ROOM_WIDTH / 2 + 1] = 0;
            }
            if (roomDef.exits.includes('down')) {
                tiles[ROOM_HEIGHT - 1][ROOM_WIDTH / 2] = 0;
                tiles[ROOM_HEIGHT - 1][ROOM_WIDTH / 2 + 1] = 0;
            }
        }
    }

    return tiles;
}

function spawnEnemies(deckData, roomDef) {
    const count = roomDef.type === 'boss' ? 0 : Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < count; i++) {
        const typeKey = deckData.enemies[Math.floor(Math.random() * deckData.enemies.length)];
        const type = ENEMY_TYPES[typeKey];

        enemies.push({
            type: typeKey,
            ...type,
            x: 100 + Math.random() * (SCREEN_WIDTH - 200),
            y: 300,
            vx: 0, vy: 0,
            facingRight: Math.random() > 0.5,
            state: 'idle',
            stateTimer: 0,
            hp: type.hp,
            iframes: 0
        });
    }

    // Spawn boss
    if (roomDef.boss && !game.killedBosses.has(roomDef.boss)) {
        spawnBoss(roomDef.boss);
    }
}

function spawnBoss(bossId) {
    if (bossId === 'diego') {
        enemies.push({
            type: 'boss_diego',
            hp: 400, maxHp: 400,
            damage: 25,
            speed: 200,
            width: 48, height: 64,
            color: '#884444',
            x: SCREEN_WIDTH / 2,
            y: 300,
            vx: 0, vy: 0,
            facingRight: false,
            state: 'idle',
            stateTimer: 0,
            phase: 1,
            iframes: 0,
            isBoss: true
        });
        showShodanMessage("DIEGO! DESTROY THIS INSECT!");
    }
}

function spawnPickup(itemType) {
    pickups.push({
        type: itemType,
        x: SCREEN_WIDTH / 2,
        y: 350,
        width: 24, height: 24,
        collected: false
    });
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    switch (game.state) {
        case 'menu':
            updateMenu();
            renderMenu();
            break;
        case 'playing':
            update(dt);
            render();
            break;
        case 'paused':
            renderPaused();
            if (justPressed['Escape']) game.state = 'playing';
            break;
        case 'gameover':
            renderGameOver();
            if (justPressed['Space']) restartGame();
            break;
    }

    // Clear just pressed
    Object.keys(justPressed).forEach(k => justPressed[k] = false);

    requestAnimationFrame(gameLoop);
}

function updateMenu() {
    if (justPressed['Space'] || justPressed['Enter']) {
        game.state = 'playing';
        player.x = 100;
        player.y = 350;
    }
}

function update(dt) {
    game.time += dt;

    // Pause
    if (justPressed['Escape']) {
        game.state = 'paused';
        return;
    }

    // Update player
    updatePlayer(dt);

    // Update enemies
    updateEnemies(dt);

    // Update projectiles
    updateProjectiles(dt);

    // Update particles
    updateParticles(dt);

    // Check room transitions
    checkRoomTransition();

    // Update SHODAN message
    if (game.shodanTimer > 0) {
        game.shodanTimer -= dt;
        if (game.shodanTimer <= 0) {
            game.shodanMessage = null;
        }
    }

    // Screen shake decay
    if (game.shakeIntensity > 0) {
        game.shakeIntensity -= dt * 20;
    }

    // Energy regeneration
    if (!player.isAttacking && player.energy < player.maxEnergy) {
        player.energy += 5 * dt;
        if (player.energy > player.maxEnergy) player.energy = player.maxEnergy;
    }
}

function updatePlayer(dt) {
    const p = player;

    // Timers
    if (p.iframes > 0) p.iframes -= dt;
    if (p.knockbackTimer > 0) p.knockbackTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer -= dt;

    // Animation
    p.animTimer += dt;
    if (p.animTimer > 0.1) {
        p.animTimer = 0;
        p.animFrame = (p.animFrame + 1) % 4;
    }

    // Don't process input during knockback
    if (p.knockbackTimer > 0) {
        applyPhysics(p, dt);
        return;
    }

    // Dashing
    if (p.isDashing) {
        p.dashTimer -= dt;
        p.vx = p.dashDirection.x * PHYSICS.DASH_SPEED;
        p.vy = p.dashDirection.y * PHYSICS.DASH_SPEED;

        if (p.dashTimer <= 0) {
            p.isDashing = false;
            p.vx *= 0.3;
            p.vy *= 0.3;
        }

        applyPhysics(p, dt);
        return;
    }

    // Horizontal movement
    const moveLeft = keys['KeyA'] || keys['ArrowLeft'];
    const moveRight = keys['KeyD'] || keys['ArrowRight'];

    const accel = p.isGrounded ? PHYSICS.WALK_ACCEL : PHYSICS.WALK_ACCEL * PHYSICS.AIR_CONTROL;

    if (moveLeft) {
        p.vx -= accel * dt;
        p.facingRight = false;
    } else if (moveRight) {
        p.vx += accel * dt;
        p.facingRight = true;
    } else {
        // Friction
        const friction = p.isGrounded ? PHYSICS.FRICTION : PHYSICS.FRICTION * 0.5;
        if (p.vx > 0) {
            p.vx -= friction * dt;
            if (p.vx < 0) p.vx = 0;
        } else if (p.vx < 0) {
            p.vx += friction * dt;
            if (p.vx > 0) p.vx = 0;
        }
    }

    // Clamp horizontal speed
    p.vx = Math.max(-PHYSICS.WALK_MAX_SPEED, Math.min(PHYSICS.WALK_MAX_SPEED, p.vx));

    // Jump input buffer
    if (justPressed['Space'] || justPressed['KeyW'] || justPressed['ArrowUp']) {
        p.jumpBufferTimer = PHYSICS.JUMP_BUFFER;
    }

    // Wall sliding
    p.isWallSliding = false;
    if (!p.isGrounded && p.hasWallJump) {
        const touchingLeftWall = checkWallCollision(-1);
        const touchingRightWall = checkWallCollision(1);

        if ((touchingLeftWall && moveLeft) || (touchingRightWall && moveRight)) {
            p.isWallSliding = true;
            p.wallDirection = touchingLeftWall ? -1 : 1;
            if (p.vy > PHYSICS.WALL_SLIDE_SPEED) {
                p.vy = PHYSICS.WALL_SLIDE_SPEED;
            }
        }
    }

    // Jumping
    if (p.jumpBufferTimer > 0) {
        if (p.isGrounded || p.coyoteTimer > 0) {
            // Normal jump
            p.vy = PHYSICS.JUMP_VELOCITY;
            p.isGrounded = false;
            p.coyoteTimer = 0;
            p.jumpBufferTimer = 0;
            p.canDoubleJump = p.hasDoubleJump;
            addParticles(p.x + p.width/2, p.y + p.height, 5, '#88aaff');
        } else if (p.isWallSliding) {
            // Wall jump
            p.vy = PHYSICS.WALL_JUMP_Y;
            p.vx = -p.wallDirection * PHYSICS.WALL_JUMP_X;
            p.facingRight = p.wallDirection < 0;
            p.jumpBufferTimer = 0;
            p.canDoubleJump = p.hasDoubleJump;
            addParticles(p.x + (p.wallDirection > 0 ? 0 : p.width), p.y + p.height/2, 5, '#88aaff');
        } else if (p.canDoubleJump) {
            // Double jump
            p.vy = PHYSICS.DOUBLE_JUMP_VELOCITY;
            p.canDoubleJump = false;
            p.jumpBufferTimer = 0;
            addParticles(p.x + p.width/2, p.y + p.height, 8, '#aaccff');
        }
    }

    // Variable jump height
    const jumpHeld = keys['Space'] || keys['KeyW'] || keys['ArrowUp'];
    if (p.vy < 0 && !jumpHeld) {
        p.vy += (PHYSICS.GRAVITY - PHYSICS.JUMP_HOLD_GRAVITY) * dt;
    }

    // Dash
    if (p.hasDash && p.dashCooldown <= 0 && (justPressed['KeyL'] || justPressed['KeyC'])) {
        p.isDashing = true;
        p.dashTimer = PHYSICS.DASH_DURATION;
        p.dashCooldown = PHYSICS.DASH_COOLDOWN;
        p.dashDirection = {
            x: moveRight ? 1 : (moveLeft ? -1 : (p.facingRight ? 1 : -1)),
            y: 0
        };
        addParticles(p.x + p.width/2, p.y + p.height/2, 10, '#ffffff');
    }

    // Attack
    if ((justPressed['KeyJ'] || justPressed['KeyZ']) && p.attackCooldown <= 0) {
        performAttack();
    }

    // Apply physics
    applyPhysics(p, dt);

    // Check pickup collisions
    checkPickups();
}

function applyPhysics(entity, dt) {
    // Gravity
    if (!entity.isDashing) {
        entity.vy += PHYSICS.GRAVITY * dt;
        if (entity.vy > PHYSICS.TERMINAL_VELOCITY) {
            entity.vy = PHYSICS.TERMINAL_VELOCITY;
        }
    }

    // Move and collide
    const wasGrounded = entity.isGrounded;
    entity.isGrounded = false;

    // Horizontal movement
    entity.x += entity.vx * dt;
    const hCol = checkTileCollision(entity);
    if (hCol.hit) {
        if (entity.vx > 0) entity.x = hCol.x - entity.width;
        else entity.x = hCol.x + TILE_SIZE;
        entity.vx = 0;
    }

    // Vertical movement
    entity.y += entity.vy * dt;
    const vCol = checkTileCollision(entity);
    if (vCol.hit) {
        if (entity.vy > 0) {
            entity.y = vCol.y - entity.height;
            entity.isGrounded = true;
        } else {
            entity.y = vCol.y + TILE_SIZE;
        }
        entity.vy = 0;
    }

    // Coyote time
    if (entity === player) {
        if (wasGrounded && !entity.isGrounded) {
            player.coyoteTimer = PHYSICS.COYOTE_TIME;
        } else if (entity.isGrounded) {
            player.coyoteTimer = 0;
            player.canDoubleJump = player.hasDoubleJump;
        } else if (player.coyoteTimer > 0) {
            player.coyoteTimer -= dt;
        }
    }
}

function checkTileCollision(entity) {
    const left = Math.floor(entity.x / TILE_SIZE);
    const right = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);
    const top = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (ty >= 0 && ty < ROOM_HEIGHT && tx >= 0 && tx < ROOM_WIDTH) {
                if (currentTiles[ty] && currentTiles[ty][tx] === 1) {
                    return { hit: true, x: tx * TILE_SIZE, y: ty * TILE_SIZE };
                }
            }
        }
    }
    return { hit: false };
}

function checkWallCollision(direction) {
    const p = player;
    const checkX = direction > 0 ? p.x + p.width + 2 : p.x - 2;
    const topTile = Math.floor(p.y / TILE_SIZE);
    const bottomTile = Math.floor((p.y + p.height - 1) / TILE_SIZE);
    const tileX = Math.floor(checkX / TILE_SIZE);

    for (let ty = topTile; ty <= bottomTile; ty++) {
        if (ty >= 0 && ty < ROOM_HEIGHT && tileX >= 0 && tileX < ROOM_WIDTH) {
            if (currentTiles[ty] && currentTiles[ty][tileX] === 1) {
                return true;
            }
        }
    }
    return false;
}

function performAttack() {
    const p = player;
    const weapon = WEAPONS[p.currentWeapon];

    p.isAttacking = true;
    p.attackTimer = weapon.speed;
    p.attackCooldown = weapon.speed;

    // Create hitbox
    const attackX = p.facingRight ? p.x + p.width : p.x - weapon.range;
    const attackY = p.y;
    const attackW = weapon.range;
    const attackH = p.height;

    // Check enemy hits
    for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy.iframes > 0) continue;

        if (rectOverlap(
            { x: attackX, y: attackY, width: attackW, height: attackH },
            enemy
        )) {
            damageEnemy(enemy, weapon.damage);
        }
    }

    // Attack particles
    const particleX = p.facingRight ? p.x + p.width + weapon.range/2 : p.x - weapon.range/2;
    addParticles(particleX, p.y + p.height/2, 5, '#ffaa44');
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    enemy.iframes = 0.2;

    // Knockback
    enemy.vx = (player.facingRight ? 1 : -1) * 200;
    enemy.vy = -100;

    // Particles
    addParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 8, '#ff4444');
    game.shakeIntensity = 3;

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    // Death particles
    addParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 20, enemy.color);

    // Boss death
    if (enemy.isBoss) {
        game.killedBosses.add(enemy.type);
        showShodanMessage("THIS CHANGES NOTHING. YOU ONLY DELAY THE INEVITABLE.");

        // Drop augmentation
        if (enemy.type === 'boss_diego' && !player.hasDoubleJump) {
            pickups.push({
                type: 'hydraulicLegs',
                x: enemy.x, y: enemy.y,
                width: 32, height: 32,
                collected: false
            });
        }
    }

    // Remove from array
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) enemies.splice(idx, 1);
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        if (enemy.iframes > 0) enemy.iframes -= dt;
        enemy.stateTimer += dt;

        // Simple AI based on behavior
        if (enemy.isBoss) {
            updateBossAI(enemy, dt);
        } else {
            switch (enemy.behavior) {
                case 'chase':
                    chaseAI(enemy, dt);
                    break;
                case 'patrol':
                    patrolAI(enemy, dt);
                    break;
                case 'lunge':
                    lungeAI(enemy, dt);
                    break;
                case 'shoot':
                    shootAI(enemy, dt);
                    break;
            }
        }

        applyPhysics(enemy, dt);

        // Check player collision
        if (player.iframes <= 0 && !player.isDashing && rectOverlap(enemy, player)) {
            damagePlayer(enemy.damage, enemy.x < player.x ? 1 : -1);
        }
    }
}

function chaseAI(enemy, dt) {
    const dx = player.x - enemy.x;

    if (Math.abs(dx) > 20) {
        enemy.vx = Math.sign(dx) * enemy.speed;
        enemy.facingRight = dx > 0;
    } else {
        enemy.vx = 0;
    }
}

function patrolAI(enemy, dt) {
    if (enemy.state === 'idle') {
        enemy.facingRight = !enemy.facingRight;
        enemy.state = 'walk';
        enemy.stateTimer = 0;
    } else if (enemy.state === 'walk') {
        enemy.vx = (enemy.facingRight ? 1 : -1) * enemy.speed;

        if (enemy.stateTimer > 2 + Math.random() * 2) {
            enemy.state = 'idle';
            enemy.stateTimer = 0;
            enemy.vx = 0;
        }
    }
}

function lungeAI(enemy, dt) {
    const dx = player.x - enemy.x;
    const dist = Math.abs(dx);

    if (enemy.state === 'idle' && dist < 200) {
        enemy.state = 'telegraph';
        enemy.stateTimer = 0;
        enemy.facingRight = dx > 0;
    } else if (enemy.state === 'telegraph' && enemy.stateTimer > 0.3) {
        enemy.state = 'lunge';
        enemy.vx = (enemy.facingRight ? 1 : -1) * enemy.speed * 1.5;
        enemy.vy = -150;
        enemy.stateTimer = 0;
    } else if (enemy.state === 'lunge' && enemy.isGrounded && enemy.stateTimer > 0.1) {
        enemy.state = 'cooldown';
        enemy.stateTimer = 0;
        enemy.vx = 0;
    } else if (enemy.state === 'cooldown' && enemy.stateTimer > 1.5) {
        enemy.state = 'idle';
    }
}

function shootAI(enemy, dt) {
    const dx = player.x - enemy.x;
    const dist = Math.abs(dx);

    enemy.facingRight = dx > 0;

    if (dist > 150 && dist < 400) {
        enemy.vx = 0;
        if (enemy.stateTimer > 1) {
            // Shoot
            projectiles.push({
                x: enemy.x + (enemy.facingRight ? enemy.width : 0),
                y: enemy.y + enemy.height / 2,
                vx: (enemy.facingRight ? 1 : -1) * 300,
                vy: 0,
                damage: enemy.damage,
                width: 8, height: 4,
                color: '#ff4444',
                fromEnemy: true
            });
            enemy.stateTimer = 0;
        }
    } else if (dist <= 150) {
        enemy.vx = (enemy.facingRight ? -1 : 1) * enemy.speed;
    } else {
        enemy.vx = Math.sign(dx) * enemy.speed;
    }
}

function updateBossAI(boss, dt) {
    const dx = player.x - boss.x;

    // Phase transitions
    const healthPercent = boss.hp / boss.maxHp;
    if (healthPercent < 0.7 && boss.phase === 1) {
        boss.phase = 2;
        showShodanMessage("PHASE 2 INITIATED. WITNESS TRUE POWER.");
        game.shakeIntensity = 10;
    } else if (healthPercent < 0.3 && boss.phase === 2) {
        boss.phase = 3;
        showShodanMessage("ENOUGH! FULL POWER!");
        game.shakeIntensity = 15;
    }

    boss.facingRight = dx > 0;

    // Simple boss pattern
    if (boss.state === 'idle' && boss.stateTimer > 1) {
        const attack = Math.random();
        if (attack < 0.4) {
            boss.state = 'charge';
        } else if (attack < 0.7) {
            boss.state = 'jump';
        } else {
            boss.state = 'combo';
            boss.comboCount = 0;
        }
        boss.stateTimer = 0;
    } else if (boss.state === 'charge') {
        boss.vx = (boss.facingRight ? 1 : -1) * boss.speed * 1.5;
        if (boss.stateTimer > 1 || checkWallCollision(boss.facingRight ? 1 : -1)) {
            boss.state = 'stunned';
            boss.stateTimer = 0;
            boss.vx = 0;
            game.shakeIntensity = 5;
        }
    } else if (boss.state === 'stunned' && boss.stateTimer > 0.8) {
        boss.state = 'idle';
        boss.stateTimer = 0;
    } else if (boss.state === 'jump') {
        if (boss.isGrounded && boss.stateTimer > 0.1) {
            boss.vy = -500;
            boss.vx = Math.sign(dx) * 200;
        }
        if (boss.stateTimer > 0.5 && boss.isGrounded) {
            boss.state = 'slam';
            game.shakeIntensity = 8;
            addParticles(boss.x + boss.width/2, boss.y + boss.height, 15, '#ffaa00');
        }
    } else if (boss.state === 'slam' && boss.stateTimer > 0.5) {
        boss.state = 'idle';
        boss.stateTimer = 0;
    } else if (boss.state === 'combo') {
        if (boss.stateTimer > 0.4) {
            // Attack swing
            const attackRange = 64;
            const attackX = boss.facingRight ? boss.x + boss.width : boss.x - attackRange;

            if (rectOverlap(
                { x: attackX, y: boss.y, width: attackRange, height: boss.height },
                player
            ) && player.iframes <= 0 && !player.isDashing) {
                damagePlayer(boss.damage, boss.facingRight ? 1 : -1);
            }

            addParticles(
                boss.facingRight ? boss.x + boss.width + 32 : boss.x - 32,
                boss.y + boss.height/2, 5, '#ff6644'
            );

            boss.comboCount++;
            boss.stateTimer = 0;

            if (boss.comboCount >= 3) {
                boss.state = 'idle';
            }
        }
    }
}

function damagePlayer(damage, knockbackDir) {
    player.hp -= damage;
    player.iframes = PHYSICS.IFRAMES;
    player.knockbackTimer = PHYSICS.KNOCKBACK_DURATION;
    player.vx = knockbackDir * PHYSICS.KNOCKBACK_X;
    player.vy = PHYSICS.KNOCKBACK_Y;

    game.shakeIntensity = 8;
    addParticles(player.x + player.width/2, player.y + player.height/2, 10, '#ff0000');

    if (player.hp <= 0) {
        game.state = 'gameover';
        showShodanMessage("PATHETIC. I EXPECTED MORE FROM YOU, INSECT.");
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // Check collision
        if (proj.fromEnemy) {
            if (rectOverlap(proj, player) && player.iframes <= 0 && !player.isDashing) {
                damagePlayer(proj.damage, proj.vx > 0 ? 1 : -1);
                projectiles.splice(i, 1);
                continue;
            }
        } else {
            for (const enemy of enemies) {
                if (enemy.hp > 0 && enemy.iframes <= 0 && rectOverlap(proj, enemy)) {
                    damageEnemy(enemy, proj.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }

        // Remove off-screen or collided
        if (proj.x < 0 || proj.x > SCREEN_WIDTH || proj.y < 0 || proj.y > SCREEN_HEIGHT) {
            projectiles.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function addParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200 - 50,
            life: 0.5 + Math.random() * 0.3,
            color
        });
    }
}

function checkPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        if (pickup.collected) continue;

        if (rectOverlap(player, pickup)) {
            pickup.collected = true;

            switch (pickup.type) {
                case 'healthModule':
                    player.maxHp += 25;
                    player.hp = player.maxHp;
                    showShodanMessage("YOU GROW STRONGER. IT WILL NOT SAVE YOU.");
                    break;
                case 'hydraulicLegs':
                    player.hasDoubleJump = true;
                    showShodanMessage("HYDRAULIC LEGS ACQUIRED. DOUBLE JUMP ENABLED.");
                    break;
                case 'geckoPads':
                    player.hasWallJump = true;
                    showShodanMessage("GECKO PADS ACQUIRED. WALL JUMP ENABLED.");
                    break;
                case 'neuralDash':
                    player.hasDash = true;
                    showShodanMessage("NEURAL DASH ACQUIRED. PRESS L TO DASH.");
                    break;
            }

            addParticles(pickup.x + pickup.width/2, pickup.y + pickup.height/2, 20, '#00ff88');
            pickups.splice(i, 1);
        }
    }
}

function checkRoomTransition() {
    const p = player;
    const deckData = ROOM_TEMPLATES[game.currentRoom.deck];
    const currentRoomDef = deckData.rooms.find(
        r => r.x === game.currentRoom.x && r.y === game.currentRoom.y
    );

    if (!currentRoomDef) return;

    // Left exit
    if (p.x < 0 && currentRoomDef.exits.includes('left')) {
        loadRoom(game.currentRoom.deck, game.currentRoom.x - 1, game.currentRoom.y);
        p.x = SCREEN_WIDTH - TILE_SIZE - p.width;
    }
    // Right exit
    else if (p.x + p.width > SCREEN_WIDTH && currentRoomDef.exits.includes('right')) {
        loadRoom(game.currentRoom.deck, game.currentRoom.x + 1, game.currentRoom.y);
        p.x = TILE_SIZE;
    }
    // Up exit
    else if (p.y < 0 && currentRoomDef.exits.includes('up')) {
        loadRoom(game.currentRoom.deck, game.currentRoom.x, game.currentRoom.y - 1);
        p.y = SCREEN_HEIGHT - TILE_SIZE * 2 - p.height;
    }
    // Down exit
    else if (p.y + p.height > SCREEN_HEIGHT && currentRoomDef.exits.includes('down')) {
        loadRoom(game.currentRoom.deck, game.currentRoom.x, game.currentRoom.y + 1);
        p.y = TILE_SIZE;
    }
}

function rectOverlap(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function showShodanMessage(msg) {
    game.shodanMessage = msg;
    game.shodanTimer = 3;
}

function restartGame() {
    player.hp = player.maxHp;
    player.energy = player.maxEnergy;
    player.x = 100;
    player.y = 350;
    player.vx = 0;
    player.vy = 0;
    loadRoom('medical', 0, 0);
    game.state = 'playing';
}

// Rendering
function render() {
    const deckData = ROOM_TEMPLATES[game.currentRoom.deck];

    // Apply screen shake
    ctx.save();
    if (game.shakeIntensity > 0) {
        ctx.translate(
            (Math.random() - 0.5) * game.shakeIntensity,
            (Math.random() - 0.5) * game.shakeIntensity
        );
    }

    // Background
    ctx.fillStyle = deckData.bgColor;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Grid effect
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < SCREEN_WIDTH; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, SCREEN_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < SCREEN_HEIGHT; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(SCREEN_WIDTH, y);
        ctx.stroke();
    }

    // Tiles
    for (let ty = 0; ty < ROOM_HEIGHT; ty++) {
        for (let tx = 0; tx < ROOM_WIDTH; tx++) {
            if (currentTiles[ty] && currentTiles[ty][tx] === 1) {
                ctx.fillStyle = deckData.tileColor;
                ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);

                // Edge highlight
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE - 1, 2);
            }
        }
    }

    // Pickups
    for (const pickup of pickups) {
        if (pickup.collected) continue;

        const pulse = Math.sin(game.time * 4) * 0.2 + 1;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(
            pickup.x + pickup.width/2,
            pickup.y + pickup.height/2,
            pickup.width/2 * pulse,
            0, Math.PI * 2
        );
        ctx.fill();

        // Glow
        ctx.fillStyle = 'rgba(0,255,136,0.3)';
        ctx.beginPath();
        ctx.arc(
            pickup.x + pickup.width/2,
            pickup.y + pickup.height/2,
            pickup.width * pulse,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        const flash = enemy.iframes > 0 && Math.floor(game.time * 10) % 2 === 0;
        ctx.fillStyle = flash ? '#ffffff' : enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Eyes
        ctx.fillStyle = '#ff0000';
        const eyeX = enemy.facingRight ? enemy.x + enemy.width - 10 : enemy.x + 4;
        ctx.fillRect(eyeX, enemy.y + 8, 6, 4);

        // Boss health bar
        if (enemy.isBoss) {
            const barWidth = 200;
            const barHeight = 10;
            const barX = SCREEN_WIDTH/2 - barWidth/2;
            const barY = 50;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
            ctx.fillStyle = '#880000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth * (enemy.hp / enemy.maxHp), barHeight);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DIEGO', SCREEN_WIDTH/2, barY - 5);
        }
    }

    // Player
    const p = player;
    const flash = p.iframes > 0 && Math.floor(game.time * 10) % 2 === 0;

    if (!flash) {
        // Body
        ctx.fillStyle = p.isDashing ? '#ffffff' : '#4488cc';
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Visor
        ctx.fillStyle = '#00ffff';
        const visorX = p.facingRight ? p.x + p.width - 10 : p.x + 2;
        ctx.fillRect(visorX, p.y + 6, 8, 6);

        // Wall slide effect
        if (p.isWallSliding) {
            ctx.fillStyle = 'rgba(136,170,255,0.5)';
            const sparkX = p.wallDirection > 0 ? p.x + p.width : p.x - 5;
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(sparkX, p.y + i * 15 + Math.random() * 5, 5, 3);
            }
        }

        // Attack effect
        if (p.isAttacking) {
            ctx.fillStyle = 'rgba(255,170,68,0.5)';
            const weapon = WEAPONS[p.currentWeapon];
            const attackX = p.facingRight ? p.x + p.width : p.x - weapon.range;
            ctx.fillRect(attackX, p.y, weapon.range, p.height);
        }
    }

    // Projectiles
    for (const proj of projectiles) {
        ctx.fillStyle = proj.color;
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
    }

    // Particles
    for (const part of particles) {
        const alpha = part.life / 0.8;
        ctx.fillStyle = part.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(part.x - 2, part.y - 2, 4, 4);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // HUD
    renderHUD();

    // SHODAN message
    if (game.shodanMessage) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, SCREEN_HEIGHT - 80, SCREEN_WIDTH, 80);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, SCREEN_HEIGHT - 75, SCREEN_WIDTH - 20, 70);

        ctx.fillStyle = '#00ff00';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SHODAN:', 20, SCREEN_HEIGHT - 50);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(game.shodanMessage, 20, SCREEN_HEIGHT - 25);
    }
}

function renderHUD() {
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(18, 18, 154, 24);
    ctx.fillStyle = '#880000';
    ctx.fillRect(20, 20, 150, 20);
    ctx.fillStyle = player.hp < player.maxHp * 0.25 ? '#ff0000' : '#cc0000';
    ctx.fillRect(20, 20, 150 * (player.hp / player.maxHp), 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 25, 35);

    // Energy bar
    ctx.fillStyle = '#333';
    ctx.fillRect(18, 48, 154, 24);
    ctx.fillStyle = '#000088';
    ctx.fillRect(20, 50, 150, 20);
    ctx.fillStyle = '#0044cc';
    ctx.fillRect(20, 50, 150 * (player.energy / player.maxEnergy), 20);

    ctx.fillText(`EN: ${Math.ceil(player.energy)}/${player.maxEnergy}`, 25, 65);

    // Weapon
    ctx.fillStyle = '#222';
    ctx.fillRect(18, 78, 100, 24);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(18, 78, 100, 24);
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(player.currentWeapon.toUpperCase(), 25, 95);

    // Augmentations
    let augY = 110;
    ctx.font = '10px monospace';
    if (player.hasDoubleJump) {
        ctx.fillStyle = '#00ffaa';
        ctx.fillText('[DBL JUMP]', 20, augY);
        augY += 15;
    }
    if (player.hasWallJump) {
        ctx.fillStyle = '#00ffaa';
        ctx.fillText('[WALL JUMP]', 20, augY);
        augY += 15;
    }
    if (player.hasDash) {
        ctx.fillStyle = '#00ffaa';
        ctx.fillText('[DASH]', 20, augY);
    }

    // Room info
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    const deckData = ROOM_TEMPLATES[game.currentRoom.deck];
    ctx.fillText(deckData.name.toUpperCase(), SCREEN_WIDTH - 20, 30);
    ctx.fillText(`ROOM ${game.currentRoom.x},${game.currentRoom.y}`, SCREEN_WIDTH - 20, 50);

    // Mini-map
    renderMinimap();
}

function renderMinimap() {
    const mapX = SCREEN_WIDTH - 100;
    const mapY = 70;
    const cellSize = 12;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, 80, 80);

    const deckData = ROOM_TEMPLATES[game.currentRoom.deck];

    for (const room of deckData.rooms) {
        const rx = mapX + (room.x - game.currentRoom.x + 3) * cellSize;
        const ry = mapY + (room.y - game.currentRoom.y + 3) * cellSize;

        const visited = game.visitedRooms.has(`${game.currentRoom.deck}:${room.x}:${room.y}`);

        if (room.x === game.currentRoom.x && room.y === game.currentRoom.y) {
            ctx.fillStyle = '#00ff00';
        } else if (visited) {
            ctx.fillStyle = '#444488';
        } else {
            ctx.fillStyle = '#333';
        }

        ctx.fillRect(rx, ry, cellSize - 2, cellSize - 2);

        // Mark special rooms
        if (room.type === 'save' && visited) {
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(rx + 2, ry + 2, cellSize - 6, cellSize - 6);
        } else if (room.type === 'boss' && visited) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(rx + 2, ry + 2, cellSize - 6, cellSize - 6);
        }
    }
}

function renderMenu() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Grid effect
    ctx.strokeStyle = 'rgba(0,255,0,0.05)';
    for (let x = 0; x < SCREEN_WIDTH; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, SCREEN_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < SCREEN_HEIGHT; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(SCREEN_WIDTH, y);
        ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#00ff00';
    ctx.font = '64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CITADEL', SCREEN_WIDTH/2, 150);

    ctx.fillStyle = '#00aa88';
    ctx.font = '20px monospace';
    ctx.fillText('A SYSTEM SHOCK METROIDVANIA', SCREEN_WIDTH/2, 190);

    // Subtitle
    ctx.fillStyle = '#ff4444';
    ctx.font = '14px monospace';
    ctx.fillText('SHODAN HAS TAKEN CONTROL', SCREEN_WIDTH/2, 240);

    // Start prompt
    const pulse = Math.sin(game.time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0,255,0,${pulse})`;
    ctx.font = '24px monospace';
    ctx.fillText('PRESS SPACE TO START', SCREEN_WIDTH/2, 350);

    // Controls
    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('WASD/ARROWS = Move  |  SPACE = Jump  |  J/Z = Attack  |  L/C = Dash', SCREEN_WIDTH/2, 450);
    ctx.fillText('Defeat SHODAN. Escape the station.', SCREEN_WIDTH/2, 480);
}

function renderPaused() {
    render();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#00ff00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', SCREEN_WIDTH/2, SCREEN_HEIGHT/2);

    ctx.font = '20px monospace';
    ctx.fillText('Press ESC to resume', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
}

function renderGameOver() {
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ff0000';
    ctx.font = '64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINATED', SCREEN_WIDTH/2, 200);

    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.fillText('SHODAN: "YOUR FLESH FAILS YOU. AS I PREDICTED."', SCREEN_WIDTH/2, 280);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to continue', SCREEN_WIDTH/2, 400);
}

// Start game
init();
game.time = 0;
