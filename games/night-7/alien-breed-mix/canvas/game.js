// Station Breach - Top-Down Twin-Stick Shooter
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'menu'; // menu, playing, paused, gameover, victory
let currentLevel = 1;
let screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };

// Camera
const camera = { x: 0, y: 0 };

// Player
const player = {
    x: 400, y: 300,
    width: 32, height: 32,
    hitbox: 24,
    hp: 100, maxHp: 100,
    shield: 0, maxShield: 50,
    speed: 180,
    sprintSpeed: 270,
    stamina: 100, maxStamina: 100,
    staminaDrain: 25,
    staminaRegen: 20,
    sprinting: false,
    angle: 0,
    currentWeapon: 0,
    weapons: [
        { name: 'Pistol', damage: 15, fireRate: 0.25, magSize: 12, mag: 12, reloadTime: 0.95, speed: 800, spread: 3, range: 500, ammoType: null, reserve: Infinity },
        { name: 'Shotgun', damage: 8, pellets: 6, fireRate: 0.83, magSize: 8, mag: 0, reloadTime: 2.25, speed: 600, spread: 25, range: 250, ammoType: 'shells', reserve: 0 },
        { name: 'Rifle', damage: 20, fireRate: 0.167, magSize: 30, mag: 0, reloadTime: 1.75, speed: 850, spread: 5, range: 600, ammoType: 'rifle', reserve: 0 },
        { name: 'Flamethrower', damage: 5, fireRate: 0.05, magSize: 100, mag: 0, reloadTime: 2.75, speed: 400, spread: 15, range: 200, ammoType: 'fuel', reserve: 0 }
    ],
    reloading: false,
    reloadTimer: 0,
    fireTimer: 0,
    keycards: { blue: false },
    medkits: 0
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Game objects
let bullets = [];
let enemies = [];
let pickups = [];
let particles = [];
let floatingTexts = [];

// Level data
let currentRoom = null;
let rooms = [];
let doors = [];
let walls = [];
let clearedRooms = new Set();

// Tile size
const TILE = 32;

// Colors
const COLORS = {
    floor: '#2A2A2A',
    wall: '#4A4A4A',
    player: '#4488FF',
    drone: '#88FF88',
    brute: '#FF8844',
    queen: '#FF44FF',
    bullet: '#FFFF00',
    health: '#FF4444',
    ammo: '#44FF44',
    keycard: '#0088FF',
    door: '#666666',
    doorBlue: '#0088FF',
    blood: '#00FF88'
};

// Generate procedural level
function generateLevel(levelNum) {
    rooms = [];
    doors = [];
    walls = [];
    enemies = [];
    pickups = [];
    clearedRooms.clear();

    const roomCount = 10 + levelNum * 5;
    const roomSize = { min: 8, max: 16 };

    // Generate rooms in a grid pattern with connections
    const gridSize = 5;
    const roomGrid = [];

    for (let i = 0; i < roomCount; i++) {
        const gx = i % gridSize;
        const gy = Math.floor(i / gridSize);
        const w = roomSize.min + Math.floor(Math.random() * (roomSize.max - roomSize.min));
        const h = roomSize.min + Math.floor(Math.random() * (roomSize.max - roomSize.min));
        const x = gx * 20 * TILE + Math.random() * 3 * TILE;
        const y = gy * 20 * TILE + Math.random() * 3 * TILE;

        const room = {
            id: i,
            x: x, y: y,
            width: w * TILE,
            height: h * TILE,
            cleared: i === 0, // Start room is cleared
            enemies: [],
            hasKeycard: false,
            hasWeapon: null
        };

        // Add walls around room
        walls.push(
            { x: room.x, y: room.y, width: room.width, height: TILE }, // top
            { x: room.x, y: room.y + room.height - TILE, width: room.width, height: TILE }, // bottom
            { x: room.x, y: room.y, width: TILE, height: room.height }, // left
            { x: room.x + room.width - TILE, y: room.y, width: TILE, height: room.height } // right
        );

        rooms.push(room);
        roomGrid.push(room);
    }

    // Connect adjacent rooms with doors
    for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i];
        // Connect to next room
        if (i + 1 < rooms.length) {
            const next = rooms[i + 1];
            const doorX = (room.x + room.width / 2 + next.x + next.width / 2) / 2;
            const doorY = (room.y + room.height / 2 + next.y + next.height / 2) / 2;

            const isKeycardDoor = (i === Math.floor(roomCount / 2) - 1) || (i === roomCount - 2);

            doors.push({
                x: doorX - TILE,
                y: doorY - TILE / 2,
                width: TILE * 2,
                height: TILE,
                open: false,
                requiresKeycard: isKeycardDoor,
                roomA: i,
                roomB: i + 1
            });
        }
    }

    // Place keycard in middle room
    const keycardRoom = Math.floor(roomCount / 2);
    rooms[keycardRoom].hasKeycard = true;

    // Place weapons
    if (levelNum === 1) {
        rooms[3].hasWeapon = 'Shotgun';
    } else if (levelNum === 2) {
        rooms[5].hasWeapon = 'Rifle';
        rooms[8].hasWeapon = 'Flamethrower';
    }

    // Setup enemies for each room (except start room)
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const enemyCount = 2 + Math.floor(Math.random() * 4);

        for (let j = 0; j < enemyCount; j++) {
            const isBrute = levelNum >= 2 && Math.random() < 0.3;
            room.enemies.push({
                type: isBrute ? 'brute' : 'drone',
                relX: TILE * 2 + Math.random() * (room.width - TILE * 4),
                relY: TILE * 2 + Math.random() * (room.height - TILE * 4)
            });
        }
    }

    // Boss room for level 3
    if (levelNum === 3) {
        const bossRoom = rooms[rooms.length - 1];
        bossRoom.enemies = [{
            type: 'queen',
            relX: bossRoom.width / 2,
            relY: bossRoom.height / 2
        }];
    }

    // Set player position in first room
    player.x = rooms[0].x + rooms[0].width / 2;
    player.y = rooms[0].y + rooms[0].height / 2;

    currentRoom = rooms[0];
}

// Spawn enemies when entering a room
function enterRoom(room) {
    if (room.cleared || clearedRooms.has(room.id)) return;

    room.enemies.forEach(e => {
        const enemy = createEnemy(e.type, room.x + e.relX, room.y + e.relY);
        enemies.push(enemy);
    });

    // Spawn keycard pickup
    if (room.hasKeycard) {
        pickups.push({
            type: 'keycard',
            subtype: 'blue',
            x: room.x + room.width / 2,
            y: room.y + room.height / 2,
            width: 24, height: 24
        });
    }

    // Spawn weapon pickup
    if (room.hasWeapon) {
        pickups.push({
            type: 'weapon',
            subtype: room.hasWeapon,
            x: room.x + room.width / 2 + 50,
            y: room.y + room.height / 2,
            width: 32, height: 24
        });
    }

    room.cleared = true;
    clearedRooms.add(room.id);
}

// Create enemy
function createEnemy(type, x, y) {
    const stats = {
        drone: { hp: 20, damage: 10, speed: 120, size: 24, color: COLORS.drone },
        brute: { hp: 100, damage: 30, speed: 60, chargeSpeed: 250, size: 48, color: COLORS.brute },
        queen: { hp: 500, damage: 40, speed: 80, size: 96, color: COLORS.queen }
    };

    const s = stats[type];
    return {
        type, x, y,
        width: s.size, height: s.size,
        hp: s.hp, maxHp: s.hp,
        damage: s.damage,
        speed: s.speed,
        color: s.color,
        angle: 0,
        attackCooldown: 0,
        state: 'idle',
        chargeTimer: 0,
        chargeDir: { x: 0, y: 0 },
        phase: 1
    };
}

// Raycast for vision
function castRay(x, y, angle, maxDist) {
    const step = 5;
    let dist = 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    while (dist < maxDist) {
        const checkX = x + dx * dist;
        const checkY = y + dy * dist;

        // Check wall collision
        for (const wall of walls) {
            if (checkX >= wall.x && checkX <= wall.x + wall.width &&
                checkY >= wall.y && checkY <= wall.y + wall.height) {
                return dist;
            }
        }
        dist += step;
    }
    return maxDist;
}

// Check if point is visible to player
function isVisible(px, py, tx, ty) {
    const dx = tx - px;
    const dy = ty - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Check if within vision cone (60 degrees = ~0.52 radians each side)
    let angleDiff = angle - player.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > 0.52 || dist > 350) return false;

    // Raycast check
    return castRay(px, py, angle, dist) >= dist - 10;
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'menu' && e.key === ' ') {
        gameState = 'playing';
        generateLevel(currentLevel);
    }

    if (gameState === 'playing') {
        if (e.key === 'r' && !player.reloading) startReload();
        if (e.key === 'q') switchWeapon();
        if (e.key === 'e') interact();
        if (e.key === 'Escape') gameState = 'paused';
    }

    if (gameState === 'paused' && e.key === 'Escape') gameState = 'playing';
    if (gameState === 'gameover' && e.key === ' ') {
        currentLevel = 1;
        resetPlayer();
        gameState = 'playing';
        generateLevel(currentLevel);
    }
    if (gameState === 'victory' && e.key === ' ') {
        currentLevel = 1;
        resetPlayer();
        gameState = 'menu';
    }
});

document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Game functions
function resetPlayer() {
    player.hp = player.maxHp;
    player.shield = 0;
    player.stamina = player.maxStamina;
    player.currentWeapon = 0;
    player.weapons[0].mag = player.weapons[0].magSize;
    player.weapons[1].mag = 0; player.weapons[1].reserve = 0;
    player.weapons[2].mag = 0; player.weapons[2].reserve = 0;
    player.weapons[3].mag = 0; player.weapons[3].reserve = 0;
    player.keycards = { blue: false };
    player.reloading = false;
}

function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    if (weapon.mag >= weapon.magSize) return;
    if (weapon.ammoType && weapon.reserve <= 0) return;

    player.reloading = true;
    player.reloadTimer = weapon.reloadTime;
}

function switchWeapon() {
    player.reloading = false;
    player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
}

function interact() {
    // Check doors
    for (const door of doors) {
        const dx = player.x - (door.x + door.width / 2);
        const dy = player.y - (door.y + door.height / 2);
        if (Math.abs(dx) < 60 && Math.abs(dy) < 60) {
            if (door.requiresKeycard && !player.keycards.blue) {
                addFloatingText(player.x, player.y - 30, 'Need Blue Keycard!', '#FF4444');
                return;
            }
            door.open = true;
        }
    }
}

function shoot() {
    const weapon = player.weapons[player.currentWeapon];
    if (player.reloading || player.fireTimer > 0) return;
    if (weapon.mag <= 0) {
        addFloatingText(player.x, player.y - 30, 'Out of ammo!', '#FF4444');
        if (weapon.reserve > 0 || !weapon.ammoType) startReload();
        return;
    }

    weapon.mag--;
    player.fireTimer = weapon.fireRate;

    // Screen shake
    const shakeIntensity = weapon.name === 'Shotgun' ? 4 : weapon.name === 'Pistol' ? 1 : 1.5;
    addScreenShake(shakeIntensity, 0.08);

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spreadRad = (weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
        const angle = player.angle + spreadRad;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            damage: weapon.damage,
            range: weapon.range,
            traveled: 0,
            owner: 'player',
            isFlame: weapon.name === 'Flamethrower'
        });
    }

    // Muzzle flash particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(player.angle + (Math.random() - 0.5)) * 100,
            vy: Math.sin(player.angle + (Math.random() - 0.5)) * 100,
            life: 0.1,
            color: '#FFFF00',
            size: 4
        });
    }
}

function addScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.5, vy: -50 });
}

// Update functions
function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateScreenShake(dt);
    updateCamera();
    checkRoomTransition();
}

function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;
    }

    // Sprint
    player.sprinting = keys['shift'] && player.stamina > 0 && (dx !== 0 || dy !== 0);
    const speed = player.sprinting ? player.sprintSpeed : player.speed;

    if (player.sprinting) {
        player.stamina -= player.staminaDrain * dt;
    } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegen * dt);
    }

    // Apply movement with collision
    const newX = player.x + dx * speed * dt;
    const newY = player.y + dy * speed * dt;

    if (!checkWallCollision(newX, player.y, player.hitbox / 2)) player.x = newX;
    if (!checkWallCollision(player.x, newY, player.hitbox / 2)) player.y = newY;

    // Aim toward mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Shooting
    if (mouse.down) shoot();
    player.fireTimer = Math.max(0, player.fireTimer - dt);

    // Reload
    if (player.reloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            const weapon = player.weapons[player.currentWeapon];
            const needed = weapon.magSize - weapon.mag;
            if (weapon.ammoType) {
                const take = Math.min(needed, weapon.reserve);
                weapon.mag += take;
                weapon.reserve -= take;
            } else {
                weapon.mag = weapon.magSize;
            }
            player.reloading = false;
        }
    }

    // Death check
    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

function checkWallCollision(x, y, radius) {
    for (const wall of walls) {
        if (x + radius > wall.x && x - radius < wall.x + wall.width &&
            y + radius > wall.y && y - radius < wall.y + wall.height) {
            return true;
        }
    }
    // Check closed doors
    for (const door of doors) {
        if (!door.open) {
            if (x + radius > door.x && x - radius < door.x + door.width &&
                y + radius > door.y && y - radius < door.y + door.height) {
                return true;
            }
        }
    }
    return false;
}

function updateBullets(dt) {
    bullets = bullets.filter(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += Math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt;

        if (b.traveled > b.range) return false;
        if (checkWallCollision(b.x, b.y, 2)) return false;

        // Hit enemies
        if (b.owner === 'player') {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                if (dx * dx + dy * dy < (e.width / 2) * (e.width / 2)) {
                    e.hp -= b.damage;

                    // Knockback (not for brute)
                    if (e.type !== 'brute') {
                        const angle = Math.atan2(dy, dx);
                        e.x += Math.cos(angle) * 20;
                        e.y += Math.sin(angle) * 20;
                    }

                    // Hit particles
                    for (let j = 0; j < 5; j++) {
                        particles.push({
                            x: b.x, y: b.y,
                            vx: (Math.random() - 0.5) * 200,
                            vy: (Math.random() - 0.5) * 200,
                            life: 0.3,
                            color: COLORS.blood,
                            size: 3
                        });
                    }

                    // Death
                    if (e.hp <= 0) {
                        // Drop chance
                        if (Math.random() < 0.2) {
                            pickups.push({
                                type: Math.random() < 0.5 ? 'health' : 'ammo',
                                subtype: 'small',
                                x: e.x, y: e.y,
                                width: 16, height: 16
                            });
                        }

                        // Queen death = victory
                        if (e.type === 'queen') {
                            if (currentLevel < 3) {
                                currentLevel++;
                                generateLevel(currentLevel);
                            } else {
                                gameState = 'victory';
                            }
                        }

                        enemies.splice(i, 1);
                    }

                    return false;
                }
            }
        }

        return true;
    });
}

function updateEnemies(dt) {
    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        e.angle = Math.atan2(dy, dx);
        e.attackCooldown = Math.max(0, e.attackCooldown - dt);

        if (e.type === 'drone') {
            // Simple chase
            if (dist > 30) {
                const speed = e.speed * dt;
                const newX = e.x + (dx / dist) * speed;
                const newY = e.y + (dy / dist) * speed;
                if (!checkWallCollision(newX, e.y, e.width / 2)) e.x = newX;
                if (!checkWallCollision(e.x, newY, e.height / 2)) e.y = newY;
            }

            // Attack
            if (dist < 40 && e.attackCooldown <= 0) {
                player.hp -= e.damage;
                e.attackCooldown = 1.0;
                addScreenShake(3, 0.1);
            }
        } else if (e.type === 'brute') {
            // Charge behavior
            if (e.state === 'idle' && dist < 200) {
                e.state = 'charging';
                e.chargeTimer = 1.5;
                e.chargeDir = { x: dx / dist, y: dy / dist };
            }

            if (e.state === 'charging') {
                e.chargeTimer -= dt;
                const speed = 250 * dt;
                const newX = e.x + e.chargeDir.x * speed;
                const newY = e.y + e.chargeDir.y * speed;
                if (!checkWallCollision(newX, e.y, e.width / 2)) e.x = newX;
                if (!checkWallCollision(e.x, newY, e.height / 2)) e.y = newY;

                if (e.chargeTimer <= 0) {
                    e.state = 'stunned';
                    e.chargeTimer = 1.0;
                }

                // Charge hit
                if (dist < 50 && e.attackCooldown <= 0) {
                    player.hp -= e.damage;
                    e.attackCooldown = 1.5;
                    addScreenShake(5, 0.15);
                }
            }

            if (e.state === 'stunned') {
                e.chargeTimer -= dt;
                if (e.chargeTimer <= 0) e.state = 'idle';
            }
        } else if (e.type === 'queen') {
            // Boss AI
            e.phase = e.hp < e.maxHp / 2 ? 2 : 1;

            if (e.state === 'idle') {
                // Move toward player
                if (dist > 100) {
                    const speed = e.speed * dt;
                    const newX = e.x + (dx / dist) * speed;
                    const newY = e.y + (dy / dist) * speed;
                    if (!checkWallCollision(newX, e.y, e.width / 2)) e.x = newX;
                    if (!checkWallCollision(e.x, newY, e.height / 2)) e.y = newY;
                }

                // Melee attack
                if (dist < 80 && e.attackCooldown <= 0) {
                    player.hp -= e.damage;
                    e.attackCooldown = e.phase === 2 ? 0.8 : 1.5;
                    addScreenShake(6, 0.2);
                }

                // Spawn drones occasionally
                if (Math.random() < 0.005) {
                    enemies.push(createEnemy('drone', e.x + (Math.random() - 0.5) * 100, e.y + (Math.random() - 0.5) * 100));
                }
            }
        }
    }
}

function updatePickups(dt) {
    pickups = pickups.filter(p => {
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (dx * dx + dy * dy < 32 * 32) {
            if (p.type === 'health') {
                const heal = 25;
                player.hp = Math.min(player.maxHp, player.hp + heal);
                addFloatingText(p.x, p.y, `+${heal} HP`, COLORS.health);
            } else if (p.type === 'ammo') {
                const wpn = player.weapons[player.currentWeapon];
                if (wpn.ammoType) {
                    wpn.reserve += 15;
                    addFloatingText(p.x, p.y, '+15 Ammo', COLORS.ammo);
                }
            } else if (p.type === 'keycard') {
                player.keycards.blue = true;
                addFloatingText(p.x, p.y, 'Blue Keycard!', COLORS.keycard);
            } else if (p.type === 'weapon') {
                const idx = player.weapons.findIndex(w => w.name === p.subtype);
                if (idx >= 0) {
                    player.weapons[idx].mag = player.weapons[idx].magSize;
                    player.weapons[idx].reserve = player.weapons[idx].magSize * 2;
                    addFloatingText(p.x, p.y, `Got ${p.subtype}!`, '#FFFFFF');
                }
            }
            return false;
        }
        return true;
    });
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        return p.life > 0;
    });
}

function updateFloatingTexts(dt) {
    floatingTexts = floatingTexts.filter(t => {
        t.y += t.vy * dt;
        t.life -= dt;
        return t.life > 0;
    });
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.duration -= dt;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;
}

function checkRoomTransition() {
    for (const room of rooms) {
        if (player.x > room.x && player.x < room.x + room.width &&
            player.y > room.y && player.y < room.y + room.height) {
            if (room !== currentRoom) {
                currentRoom = room;
                enterRoom(room);
            }
            break;
        }
    }
}

// Render functions
function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

    if (gameState === 'playing' || gameState === 'paused') {
        renderWorld();
        renderEntities();
        renderVisionOverlay();
    }

    ctx.restore();

    renderHUD();

    if (gameState === 'menu') renderMenu();
    if (gameState === 'paused') renderPause();
    if (gameState === 'gameover') renderGameOver();
    if (gameState === 'victory') renderVictory();
}

function renderWorld() {
    // Render rooms
    for (const room of rooms) {
        ctx.fillStyle = COLORS.floor;
        ctx.fillRect(room.x + TILE, room.y + TILE, room.width - TILE * 2, room.height - TILE * 2);
    }

    // Render walls
    ctx.fillStyle = COLORS.wall;
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Render doors
    for (const door of doors) {
        if (!door.open) {
            ctx.fillStyle = door.requiresKeycard ? COLORS.doorBlue : COLORS.door;
            ctx.fillRect(door.x, door.y, door.width, door.height);
        }
    }
}

function renderEntities() {
    // Pickups
    for (const p of pickups) {
        if (isVisible(player.x, player.y, p.x, p.y) || true) { // Always show for now
            ctx.fillStyle = p.type === 'health' ? COLORS.health :
                           p.type === 'keycard' ? COLORS.keycard :
                           p.type === 'weapon' ? '#FFFFFF' : COLORS.ammo;
            ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
        }
    }

    // Bullets
    for (const b of bullets) {
        ctx.fillStyle = b.isFlame ? '#FF6600' : COLORS.bullet;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isFlame ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        ctx.fillStyle = e.color;
        ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);

        // Direction indicator
        ctx.fillStyle = '#000';
        ctx.fillRect(e.width / 4, -3, e.width / 4, 6);

        ctx.restore();

        // Health bar for bosses
        if (e.type === 'queen' || e.type === 'brute') {
            const barWidth = e.width;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - barWidth / 2, e.y - e.height / 2 - 10, barWidth, barHeight);
            ctx.fillStyle = COLORS.health;
            ctx.fillRect(e.x - barWidth / 2, e.y - e.height / 2 - 10, barWidth * (e.hp / e.maxHp), barHeight);
        }
    }

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = COLORS.player;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    // Gun
    ctx.fillStyle = '#888';
    ctx.fillRect(player.width / 4, -4, player.width / 2, 8);

    ctx.restore();

    // Particles
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Floating texts
    for (const t of floatingTexts) {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
}

function renderVisionOverlay() {
    // Create vision mask using raytracing
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';

    ctx.beginPath();
    ctx.moveTo(player.x, player.y);

    const rays = 60;
    const fov = Math.PI / 3; // 60 degrees
    const maxDist = 350;

    for (let i = 0; i <= rays; i++) {
        const angle = player.angle - fov / 2 + (fov * i / rays);
        const dist = castRay(player.x, player.y, angle, maxDist);
        const x = player.x + Math.cos(angle) * dist;
        const y = player.y + Math.sin(angle) * dist;
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dark overlay outside vision
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);
    ctx.restore();
}

function renderHUD() {
    const weapon = player.weapons[player.currentWeapon];

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = COLORS.health;
    ctx.fillRect(10, 10, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(10, 10, 200, 20);

    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 15, 25);

    // Stamina bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 150, 10);
    ctx.fillStyle = '#44FF44';
    ctx.fillRect(10, 35, 150 * (player.stamina / player.maxStamina), 10);

    // Weapon info
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    ctx.fillText(weapon.name, 10, 680);
    ctx.fillText(`${weapon.mag}/${weapon.magSize}`, 10, 700);
    if (weapon.ammoType) {
        ctx.fillText(`Reserve: ${weapon.reserve}`, 120, 700);
    }

    if (player.reloading) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('RELOADING...', 10, 650);
    }

    // Keycards
    ctx.fillStyle = player.keycards.blue ? COLORS.keycard : '#333';
    ctx.fillRect(canvas.width - 40, 10, 30, 20);
    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.fillText('BLUE', canvas.width - 38, 24);

    // Level indicator
    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Level ${currentLevel}`, canvas.width - 10, 50);

    // Minimap
    renderMinimap();
}

function renderMinimap() {
    const mapX = canvas.width - 160;
    const mapY = 60;
    const mapSize = 150;
    const scale = 0.03;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Rooms
    for (const room of rooms) {
        ctx.fillStyle = clearedRooms.has(room.id) ? '#333' : '#222';
        const rx = mapX + (room.x - camera.x + canvas.width / 2) * scale;
        const ry = mapY + (room.y - camera.y + canvas.height / 2) * scale;
        ctx.fillRect(rx, ry, room.width * scale, room.height * scale);
    }

    // Player
    ctx.fillStyle = '#FFF';
    const px = mapX + mapSize / 2;
    const py = mapY + mapSize / 2;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemies
    ctx.fillStyle = '#F00';
    for (const e of enemies) {
        const ex = mapX + (e.x - camera.x + canvas.width / 2) * scale;
        const ey = mapY + (e.y - camera.y + canvas.height / 2) * scale;
        ctx.fillRect(ex - 1, ey - 1, 2, 2);
    }
}

function renderMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FF4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATION BREACH', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('A Top-Down Twin-Stick Shooter', canvas.width / 2, 250);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px monospace';
    ctx.fillText('WASD - Move', canvas.width / 2, 350);
    ctx.fillText('Mouse - Aim', canvas.width / 2, 380);
    ctx.fillText('LMB - Shoot', canvas.width / 2, 410);
    ctx.fillText('R - Reload  |  Q - Switch Weapon', canvas.width / 2, 440);
    ctx.fillText('E - Interact  |  SHIFT - Sprint', canvas.width / 2, 470);

    ctx.fillStyle = '#FFFF00';
    ctx.font = '24px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 550);
}

function renderPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.font = '18px monospace';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 40);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FF0000';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText(`Reached Level ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Press SPACE to Retry', canvas.width / 2, canvas.height / 2 + 60);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00FF00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText('You defeated the Queen and escaped the station!', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Press SPACE to Return to Menu', canvas.width / 2, canvas.height / 2 + 60);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
