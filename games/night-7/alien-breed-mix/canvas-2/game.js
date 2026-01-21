// Station Breach - Twin-Stick Shooter
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const messageDiv = document.getElementById('message');

// Constants
const TILE_SIZE = 32;
const PLAYER_SPEED = 180;
const SPRINT_SPEED = 270;

// Game state
let gameState = 'playing';
let currentLevel = 1;
let screenShake = { x: 0, y: 0, duration: 0 };
let floatingTexts = [];
let lastAmmoWarning = 0;

// Input
const keys = {};
let mouse = { x: 0, y: 0, down: false };

// Player
const player = {
    x: 400, y: 300,
    width: 32, height: 32,
    hp: 100, maxHp: 100,
    speed: PLAYER_SPEED,
    angle: 0,
    weapons: [
        { name: 'Pistol', damage: 15, fireRate: 250, magSize: 12, mag: 12, reserve: Infinity, reloadTime: 950, spread: 3, speed: 800, range: 500, shake: 2 },
    ],
    currentWeapon: 0,
    lastShot: 0,
    reloading: false,
    reloadStart: 0,
    keycards: [],
    sprinting: false,
    stamina: 100
};

// Bullets
let bullets = [];
let enemyBullets = [];

// Enemies
let enemies = [];

// Pickups
let pickups = [];

// Level data
let rooms = [];
let doors = [];
let currentRoom = null;

// Camera
const camera = { x: 0, y: 0, targetX: 0, targetY: 0 };

// Level generation
function generateLevel(levelNum) {
    rooms = [];
    doors = [];
    enemies = [];
    pickups = [];
    bullets = [];
    enemyBullets = [];

    const configs = [
        { roomCount: 8, enemyTypes: ['drone'], keycardRoom: 4 },
        { roomCount: 10, enemyTypes: ['drone', 'brute'], keycardRoom: 6 },
        { roomCount: 8, enemyTypes: ['drone', 'brute'], keycardRoom: 5, hasBoss: true }
    ];

    const config = configs[levelNum - 1];
    const roomWidth = 400;
    const roomHeight = 300;

    // Create rooms in a branching path
    let lastX = 0, lastY = 0;

    for (let i = 0; i < config.roomCount; i++) {
        const room = {
            id: i,
            x: lastX,
            y: lastY,
            width: roomWidth + Math.random() * 100,
            height: roomHeight + Math.random() * 80,
            cleared: i === 0, // Start room is cleared
            entered: i === 0,
            walls: [],
            obstacles: []
        };

        // Add walls
        room.walls = [
            { x: room.x, y: room.y, w: room.width, h: 16, type: 'wall' },
            { x: room.x, y: room.y + room.height - 16, w: room.width, h: 16, type: 'wall' },
            { x: room.x, y: room.y, w: 16, h: room.height, type: 'wall' },
            { x: room.x + room.width - 16, y: room.y, w: 16, h: room.height, type: 'wall' }
        ];

        // Add obstacles
        const obstacleCount = 2 + Math.floor(Math.random() * 3);
        for (let o = 0; o < obstacleCount; o++) {
            room.obstacles.push({
                x: room.x + 50 + Math.random() * (room.width - 100),
                y: room.y + 50 + Math.random() * (room.height - 100),
                w: 32,
                h: 32,
                type: Math.random() > 0.7 ? 'barrel' : 'crate',
                hp: 20
            });
        }

        rooms.push(room);

        // Connect rooms with doors
        if (i > 0) {
            const prevRoom = rooms[i - 1];
            const isKeycardDoor = i === config.keycardRoom;

            doors.push({
                x: prevRoom.x + prevRoom.width - 16,
                y: prevRoom.y + prevRoom.height / 2 - 24,
                w: 32,
                h: 48,
                toRoom: i,
                fromRoom: i - 1,
                locked: isKeycardDoor,
                keycard: isKeycardDoor ? 'blue' : null,
                open: false
            });
        }

        // Next room position
        lastX += room.width - 16;
        if (Math.random() > 0.6) {
            lastY += (Math.random() > 0.5 ? 1 : -1) * 100;
        }
    }

    // Place player in first room
    player.x = rooms[0].x + rooms[0].width / 2;
    player.y = rooms[0].y + rooms[0].height / 2;
    currentRoom = rooms[0];

    // Place keycard in room before keycard door
    const keycardRoomIdx = config.keycardRoom - 1;
    if (keycardRoomIdx > 0 && keycardRoomIdx < rooms.length) {
        const kr = rooms[keycardRoomIdx];
        pickups.push({
            x: kr.x + kr.width / 2,
            y: kr.y + kr.height / 2,
            type: 'keycard',
            keycard: 'blue'
        });
    }

    // Add weapons on certain levels
    if (levelNum === 1 && rooms.length > 2) {
        const r = rooms[2];
        pickups.push({
            x: r.x + r.width / 2 + 30,
            y: r.y + r.height / 2,
            type: 'weapon',
            weapon: { name: 'Shotgun', damage: 8, pellets: 6, fireRate: 800, magSize: 8, mag: 8, reserve: 24, reloadTime: 2250, spread: 25, speed: 600, range: 250, shake: 6 }
        });
    }
    if (levelNum >= 2 && rooms.length > 3) {
        const r = rooms[3];
        pickups.push({
            x: r.x + r.width / 2,
            y: r.y + r.height / 2 + 30,
            type: 'weapon',
            weapon: { name: 'Rifle', damage: 20, fireRate: 150, magSize: 30, mag: 30, reserve: 90, reloadTime: 1750, spread: 5, speed: 850, range: 600, shake: 2 }
        });
    }

    // Add health/ammo pickups in some rooms
    for (let i = 2; i < rooms.length; i += 2) {
        const r = rooms[i];
        if (Math.random() > 0.4) {
            pickups.push({
                x: r.x + 80 + Math.random() * 100,
                y: r.y + 80 + Math.random() * 60,
                type: Math.random() > 0.5 ? 'health' : 'ammo'
            });
        }
    }

    // Place exit in last room
    const lastRoom = rooms[rooms.length - 1];
    if (config.hasBoss) {
        // Boss room
        pickups.push({
            x: lastRoom.x + lastRoom.width - 60,
            y: lastRoom.y + lastRoom.height / 2,
            type: 'exit'
        });
    } else {
        pickups.push({
            x: lastRoom.x + lastRoom.width - 60,
            y: lastRoom.y + lastRoom.height / 2,
            type: 'exit'
        });
    }
}

function spawnEnemiesInRoom(room, levelNum) {
    if (room.cleared || room.id === 0) return;

    const configs = [
        { types: ['drone'], count: [3, 5] },
        { types: ['drone', 'drone', 'brute'], count: [4, 7] },
        { types: ['drone', 'drone', 'brute', 'brute'], count: [5, 8] }
    ];

    const config = configs[levelNum - 1];
    const count = config.count[0] + Math.floor(Math.random() * (config.count[1] - config.count[0]));

    // Boss in last room of level 3
    if (levelNum === 3 && room.id === rooms.length - 1) {
        enemies.push(createEnemy('queen', room.x + room.width / 2, room.y + room.height / 2));
        return;
    }

    for (let i = 0; i < count; i++) {
        const type = config.types[Math.floor(Math.random() * config.types.length)];
        const ex = room.x + 50 + Math.random() * (room.width - 100);
        const ey = room.y + 50 + Math.random() * (room.height - 100);
        enemies.push(createEnemy(type, ex, ey));
    }
}

function createEnemy(type, x, y) {
    const templates = {
        drone: { hp: 20, maxHp: 20, damage: 10, speed: 120, size: 24, color: '#44ff44', attackCooldown: 1000, detectionRange: 300 },
        brute: { hp: 100, maxHp: 100, damage: 30, speed: 60, size: 48, color: '#ff4444', attackCooldown: 1500, detectionRange: 250, chargeSpeed: 250 },
        queen: { hp: 500, maxHp: 500, damage: 40, speed: 80, size: 96, color: '#ff00ff', attackCooldown: 2000, detectionRange: 500, phase: 1 }
    };

    return {
        x, y,
        type,
        ...templates[type],
        angle: 0,
        lastAttack: 0,
        state: 'idle',
        chargeDir: null,
        chargeDuration: 0
    };
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r' && !player.reloading) startReload();
    if (e.key === ' ') interactWithNearby();
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

function interactWithNearby() {
    // Check doors
    for (const door of doors) {
        const dx = player.x - (door.x + door.w / 2);
        const dy = player.y - (door.y + door.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) {
            if (door.locked) {
                if (player.keycards.includes(door.keycard)) {
                    door.locked = false;
                    door.open = true;
                    addFloatingText(door.x, door.y, 'Door Unlocked!', '#00ff00');
                } else {
                    addFloatingText(door.x, door.y, 'Need ' + door.keycard + ' keycard', '#ff0000');
                }
            } else {
                door.open = true;
            }
        }
    }
}

function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    if (weapon.mag < weapon.magSize && weapon.reserve > 0) {
        player.reloading = true;
        player.reloadStart = Date.now();
    }
}

function shoot() {
    if (player.reloading) return;

    const weapon = player.weapons[player.currentWeapon];
    const now = Date.now();

    if (now - player.lastShot < weapon.fireRate) return;

    if (weapon.mag <= 0) {
        if (weapon.reserve > 0) {
            startReload();
        } else if (now - lastAmmoWarning > 1000) {
            addFloatingText(player.x, player.y - 30, 'Out of ammo!', '#ff0000');
            lastAmmoWarning = now;
        }
        return;
    }

    player.lastShot = now;
    weapon.mag--;

    // Screen shake
    screenShake.duration = 50;
    screenShake.x = (Math.random() - 0.5) * weapon.shake;
    screenShake.y = (Math.random() - 0.5) * weapon.shake;

    // Calculate angle to mouse (world coords)
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    const baseAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spreadRad = (weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
        const angle = baseAngle + spreadRad;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            damage: weapon.damage,
            range: weapon.range,
            traveled: 0
        });
    }
}

function update(dt) {
    if (gameState !== 'playing') return;

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Sprint
    player.sprinting = keys['shift'] && player.stamina > 0;
    if (player.sprinting && (dx !== 0 || dy !== 0)) {
        player.stamina = Math.max(0, player.stamina - 25 * dt);
    } else {
        player.stamina = Math.min(100, player.stamina + 20 * dt);
    }

    const speed = player.sprinting ? SPRINT_SPEED : PLAYER_SPEED;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        const newX = player.x + dx * speed * dt;
        const newY = player.y + dy * speed * dt;

        if (!checkWallCollision(newX, player.y, player.width)) player.x = newX;
        if (!checkWallCollision(player.x, newY, player.height)) player.y = newY;
    }

    // Player angle to mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Shooting
    if (mouse.down) shoot();

    // Reloading
    if (player.reloading) {
        const weapon = player.weapons[player.currentWeapon];
        if (Date.now() - player.reloadStart >= weapon.reloadTime) {
            const needed = weapon.magSize - weapon.mag;
            const available = Math.min(needed, weapon.reserve);
            weapon.mag += available;
            if (weapon.reserve !== Infinity) weapon.reserve -= available;
            player.reloading = false;
        }
    }

    // Check room entry
    for (const room of rooms) {
        if (!room.entered && pointInRoom(player.x, player.y, room)) {
            room.entered = true;
            spawnEnemiesInRoom(room, currentLevel);
            currentRoom = room;
        }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += Math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt;

        // Wall collision
        if (checkWallCollision(b.x, b.y, 4)) {
            bullets.splice(i, 1);
            continue;
        }

        // Range limit
        if (b.traveled > b.range) {
            bullets.splice(i, 1);
            continue;
        }

        // Enemy hit
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
            if (dist < e.size / 2) {
                e.hp -= b.damage;
                bullets.splice(i, 1);

                // Knockback (except brute)
                if (e.type !== 'brute' && e.type !== 'queen') {
                    const kb = 50;
                    const angle = Math.atan2(b.vy, b.vx);
                    e.x += Math.cos(angle) * kb;
                    e.y += Math.sin(angle) * kb;
                }

                if (e.hp <= 0) {
                    // Drop loot
                    if (Math.random() < 0.2) {
                        pickups.push({ x: e.x, y: e.y, type: 'ammo' });
                    } else if (Math.random() < 0.1) {
                        pickups.push({ x: e.x, y: e.y, type: 'health' });
                    }

                    if (e.type === 'queen') {
                        showMessage('QUEEN DEFEATED!\nFind the escape pod!', '#00ff00');
                    }

                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        if (b.life <= 0 || checkWallCollision(b.x, b.y, 4)) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Player hit
        const dist = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
        if (dist < 20) {
            player.hp -= b.damage;
            enemyBullets.splice(i, 1);
            if (player.hp <= 0) {
                gameState = 'dead';
                showMessage('MISSION FAILED\n\nPress R to restart', '#ff0000');
            }
        }
    }

    // Update enemies
    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        e.angle = Math.atan2(dy, dx);

        if (e.type === 'queen') {
            updateQueen(e, dt, dist, dx, dy);
        } else if (e.type === 'brute') {
            updateBrute(e, dt, dist, dx, dy);
        } else {
            // Drone - simple chase
            if (dist < e.detectionRange && dist > e.size) {
                e.x += (dx / dist) * e.speed * dt;
                e.y += (dy / dist) * e.speed * dt;
            }

            // Melee attack
            if (dist < e.size && Date.now() - e.lastAttack > e.attackCooldown) {
                player.hp -= e.damage;
                e.lastAttack = Date.now();
                addFloatingText(player.x, player.y - 20, '-' + e.damage, '#ff0000');
                if (player.hp <= 0) {
                    gameState = 'dead';
                    showMessage('MISSION FAILED\n\nPress R to restart', '#ff0000');
                }
            }
        }

        // Wall collision for enemies
        if (checkWallCollision(e.x, e.y, e.size / 2)) {
            e.x -= (dx / dist) * e.speed * dt;
            e.y -= (dy / dist) * e.speed * dt;
        }
    }

    // Check room cleared
    if (currentRoom) {
        const roomEnemies = enemies.filter(e => pointInRoom(e.x, e.y, currentRoom));
        if (roomEnemies.length === 0 && currentRoom.entered) {
            currentRoom.cleared = true;
        }
    }

    // Pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);

        if (dist < 40) {
            if (p.type === 'health') {
                const heal = Math.min(25, player.maxHp - player.hp);
                player.hp += heal;
                addFloatingText(p.x, p.y, '+' + heal + ' HP', '#00ff00');
                pickups.splice(i, 1);
            } else if (p.type === 'ammo') {
                const weapon = player.weapons[player.currentWeapon];
                if (weapon.reserve !== Infinity) {
                    weapon.reserve += 15;
                    addFloatingText(p.x, p.y, '+15 Ammo', '#ffff00');
                }
                pickups.splice(i, 1);
            } else if (p.type === 'keycard') {
                if (!player.keycards.includes(p.keycard)) {
                    player.keycards.push(p.keycard);
                    addFloatingText(p.x, p.y, p.keycard.toUpperCase() + ' KEYCARD', '#00aaff');
                }
                pickups.splice(i, 1);
            } else if (p.type === 'weapon') {
                player.weapons.push(p.weapon);
                addFloatingText(p.x, p.y, 'Got ' + p.weapon.name + '!', '#ffaa00');
                pickups.splice(i, 1);
            } else if (p.type === 'exit') {
                if (currentLevel < 3) {
                    currentLevel++;
                    generateLevel(currentLevel);
                    showMessage('LEVEL ' + currentLevel, '#00ff00', 1500);
                } else {
                    gameState = 'won';
                    showMessage('ESCAPED!\n\nYou survived Station Breach!', '#00ff00');
                }
            }
        }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y -= 30 * dt;
        floatingTexts[i].life -= dt;
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    // Screen shake decay
    if (screenShake.duration > 0) {
        screenShake.duration -= dt * 1000;
        if (screenShake.duration <= 0) {
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }

    // Camera follow
    camera.targetX = player.x - canvas.width / 2;
    camera.targetY = player.y - canvas.height / 2;
    camera.x += (camera.targetX - camera.x) * 0.1;
    camera.y += (camera.targetY - camera.y) * 0.1;

    // Weapon switch
    if (keys['q']) {
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
        keys['q'] = false;
    }
}

function updateBrute(e, dt, dist, dx, dy) {
    if (e.state === 'charging') {
        e.x += e.chargeDir.x * e.chargeSpeed * dt;
        e.y += e.chargeDir.y * e.chargeSpeed * dt;
        e.chargeDuration -= dt;

        // Hit player during charge
        if (dist < e.size && Date.now() - e.lastAttack > 500) {
            player.hp -= e.damage;
            e.lastAttack = Date.now();
            addFloatingText(player.x, player.y - 20, '-' + e.damage, '#ff0000');
        }

        if (e.chargeDuration <= 0 || checkWallCollision(e.x, e.y, e.size / 2)) {
            e.state = 'stunned';
            e.stunDuration = 1;
        }
    } else if (e.state === 'stunned') {
        e.stunDuration -= dt;
        if (e.stunDuration <= 0) e.state = 'idle';
    } else {
        // Chase or prepare charge
        if (dist < 200 && dist > e.size) {
            if (Math.random() < 0.01) {
                e.state = 'charging';
                e.chargeDir = { x: dx / dist, y: dy / dist };
                e.chargeDuration = 1.5;
            }
        }
        if (dist < e.detectionRange && dist > e.size) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
        }
    }
}

function updateQueen(e, dt, dist, dx, dy) {
    const phase = e.hp < e.maxHp / 2 ? 2 : 1;
    e.phase = phase;

    if (e.state === 'charging') {
        e.x += e.chargeDir.x * 150 * dt;
        e.y += e.chargeDir.y * 150 * dt;
        e.chargeDuration -= dt;

        if (dist < e.size) {
            player.hp -= 40;
            addFloatingText(player.x, player.y - 20, '-40', '#ff0000');
            e.state = 'idle';
        }

        if (e.chargeDuration <= 0 || checkWallCollision(e.x, e.y, e.size / 2)) {
            e.state = 'idle';
        }
    } else {
        // Move toward player
        if (dist > e.size) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
        }

        // Attacks
        const cooldown = phase === 2 ? e.attackCooldown * 0.7 : e.attackCooldown;
        if (Date.now() - e.lastAttack > cooldown) {
            const attack = Math.random();

            if (attack < 0.3 && phase === 2) {
                // Charge attack (phase 2)
                e.state = 'charging';
                e.chargeDir = { x: dx / dist, y: dy / dist };
                e.chargeDuration = 1.5;
            } else if (attack < 0.6) {
                // Acid spit
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const angle = Math.atan2(player.y - e.y, player.x - e.x);
                        enemyBullets.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(angle) * 300,
                            vy: Math.sin(angle) * 300,
                            damage: 15,
                            life: 2,
                            color: '#00ff00'
                        });
                    }, i * 200);
                }
            } else if (attack < 0.8) {
                // Spawn drones
                const spawnCount = phase === 2 ? 4 : 2;
                for (let i = 0; i < spawnCount; i++) {
                    const angle = (i / spawnCount) * Math.PI * 2;
                    enemies.push(createEnemy('drone', e.x + Math.cos(angle) * 80, e.y + Math.sin(angle) * 80));
                }
            } else if (dist < 80) {
                // Melee swipe
                player.hp -= phase === 2 ? 35 : 25;
                addFloatingText(player.x, player.y - 20, '-' + (phase === 2 ? 35 : 25), '#ff0000');
            }

            e.lastAttack = Date.now();
        }
    }

    if (player.hp <= 0) {
        gameState = 'dead';
        showMessage('MISSION FAILED\n\nPress R to restart', '#ff0000');
    }
}

function checkWallCollision(x, y, size) {
    for (const room of rooms) {
        for (const wall of room.walls) {
            if (x + size > wall.x && x - size < wall.x + wall.w &&
                y + size > wall.y && y - size < wall.y + wall.h) {
                return true;
            }
        }
        for (const obs of room.obstacles) {
            if (obs.hp > 0 &&
                x + size > obs.x && x - size < obs.x + obs.w &&
                y + size > obs.y && y - size < obs.y + obs.h) {
                return true;
            }
        }
    }

    // Check closed doors
    for (const door of doors) {
        if (!door.open) {
            if (x + size > door.x && x - size < door.x + door.w &&
                y + size > door.y && y - size < door.y + door.h) {
                return true;
            }
        }
    }

    return false;
}

function pointInRoom(x, y, room) {
    return x > room.x && x < room.x + room.width && y > room.y && y < room.y + room.height;
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.5 });
}

function showMessage(text, color, duration = 0) {
    messageDiv.innerText = text;
    messageDiv.style.color = color;
    messageDiv.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => messageDiv.style.display = 'none', duration);
    }
}

function render() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

    // Draw rooms
    for (const room of rooms) {
        // Floor
        ctx.fillStyle = room.cleared ? '#1a1a2e' : '#0d0d1a';
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Grid pattern
        ctx.strokeStyle = '#222233';
        ctx.lineWidth = 1;
        for (let x = room.x; x < room.x + room.width; x += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, room.y);
            ctx.lineTo(x, room.y + room.height);
            ctx.stroke();
        }
        for (let y = room.y; y < room.y + room.height; y += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(room.x, y);
            ctx.lineTo(room.x + room.width, y);
            ctx.stroke();
        }

        // Walls
        ctx.fillStyle = '#4a4a5a';
        for (const wall of room.walls) {
            ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        }

        // Obstacles
        for (const obs of room.obstacles) {
            if (obs.hp > 0) {
                ctx.fillStyle = obs.type === 'barrel' ? '#cc4400' : '#666644';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                if (obs.type === 'barrel') {
                    ctx.fillStyle = '#ff8800';
                    ctx.beginPath();
                    ctx.arc(obs.x + obs.w / 2, obs.y + obs.h / 2, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    // Draw doors
    for (const door of doors) {
        if (door.open) {
            ctx.fillStyle = '#333';
        } else if (door.locked) {
            ctx.fillStyle = '#0088ff';
        } else {
            ctx.fillStyle = '#666';
        }
        ctx.fillRect(door.x, door.y, door.w, door.h);

        // Door prompt
        const dx = player.x - (door.x + door.w / 2);
        const dy = player.y - (door.y + door.h / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 60 && !door.open) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE to open', door.x + door.w / 2, door.y - 10);
        }
    }

    // Draw pickups
    for (const p of pickups) {
        if (p.type === 'health') {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
            ctx.fillStyle = '#fff';
            ctx.fillRect(p.x - 2, p.y - 8, 4, 16);
            ctx.fillRect(p.x - 8, p.y - 2, 16, 4);
        } else if (p.type === 'ammo') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(p.x - 8, p.y - 12, 16, 24);
        } else if (p.type === 'keycard') {
            ctx.fillStyle = '#0088ff';
            ctx.fillRect(p.x - 15, p.y - 10, 30, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('KEY', p.x, p.y + 4);
        } else if (p.type === 'weapon') {
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(p.x - 20, p.y - 8, 40, 16);
        } else if (p.type === 'exit') {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', p.x, p.y + 5);
        }
    }

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    for (const b of bullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemy bullets
    for (const b of enemyBullets) {
        ctx.fillStyle = b.color || '#ff0000';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies
    for (const e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);

        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.size / 4, -3, e.size / 3, 6);

        ctx.restore();

        // Health bar for brutes and queen
        if (e.type !== 'drone') {
            const barWidth = e.size;
            const barHeight = 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - barWidth / 2, e.y - e.size / 2 - 15, barWidth, barHeight);
            ctx.fillStyle = e.type === 'queen' ? '#ff00ff' : '#ff0000';
            ctx.fillRect(e.x - barWidth / 2, e.y - e.size / 2 - 15, barWidth * (e.hp / e.maxHp), barHeight);
        }
    }

    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Body
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Gun
    ctx.fillStyle = '#888';
    ctx.fillRect(10, -4, 20, 8);

    // Muzzle flash
    if (Date.now() - player.lastShot < 50) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(35, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Draw flashlight cone (vision)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 350, player.angle - Math.PI / 3, player.angle + Math.PI / 3);
    ctx.lineTo(player.x, player.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Ambient light around player
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 150);
    gradient.addColorStop(0, 'rgba(50,50,80,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Floating texts
    for (const ft of floatingTexts) {
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // HUD
    renderHUD();
}

function renderHUD() {
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(10, 10, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP: ' + Math.ceil(player.hp) + '/' + player.maxHp, 15, 25);

    // Stamina bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 150, 10);
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(10, 35, 150 * (player.stamina / 100), 10);

    // Weapon info
    const weapon = player.weapons[player.currentWeapon];
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(weapon.name, 10, 70);

    if (player.reloading) {
        const progress = (Date.now() - player.reloadStart) / weapon.reloadTime;
        ctx.fillText('RELOADING...', 10, 90);
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 95, 100, 8);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(10, 95, 100 * progress, 8);
    } else {
        const reserveText = weapon.reserve === Infinity ? '∞' : weapon.reserve;
        ctx.fillText(weapon.mag + '/' + weapon.magSize + ' | ' + reserveText, 10, 90);
    }

    // Keycards
    ctx.fillText('Keycards:', 10, 120);
    if (player.keycards.length === 0) {
        ctx.fillStyle = '#666';
        ctx.fillText('None', 100, 120);
    } else {
        for (let i = 0; i < player.keycards.length; i++) {
            ctx.fillStyle = player.keycards[i] === 'blue' ? '#0088ff' : '#ffff00';
            ctx.fillRect(100 + i * 30, 108, 20, 14);
        }
    }

    // Level indicator
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('LEVEL ' + currentLevel, canvas.width - 10, 25);

    // Mini-map
    const mapX = canvas.width - 160;
    const mapY = 40;
    const mapScale = 0.15;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mapX, mapY, 150, 120);

    for (const room of rooms) {
        ctx.fillStyle = room.entered ? (room.cleared ? '#2a2a4e' : '#4a2a2a') : '#1a1a1a';
        ctx.fillRect(
            mapX + (room.x - rooms[0].x) * mapScale,
            mapY + (room.y - rooms[0].y + 200) * mapScale,
            room.width * mapScale,
            room.height * mapScale
        );
    }

    // Player on minimap
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(
        mapX + (player.x - rooms[0].x) * mapScale,
        mapY + (player.y - rooms[0].y + 200) * mapScale,
        4, 0, Math.PI * 2
    );
    ctx.fill();

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WASD: Move | Mouse: Aim | LMB: Shoot | R: Reload | Q: Switch | SPACE: Interact', 10, canvas.height - 10);
}

// Restart
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r' && gameState === 'dead') {
        currentLevel = 1;
        player.hp = player.maxHp;
        player.weapons = [
            { name: 'Pistol', damage: 15, fireRate: 250, magSize: 12, mag: 12, reserve: Infinity, reloadTime: 950, spread: 3, speed: 800, range: 500, shake: 2 }
        ];
        player.currentWeapon = 0;
        player.keycards = [];
        gameState = 'playing';
        messageDiv.style.display = 'none';
        generateLevel(1);
    }
});

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
generateLevel(1);
showMessage('STATION BREACH\n\nWASD to move, Mouse to aim\nFind keycards, reach the exit\n\nClick to start', '#00ff00');
canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        messageDiv.style.display = 'none';
    }
}, { once: true });

requestAnimationFrame(gameLoop);
