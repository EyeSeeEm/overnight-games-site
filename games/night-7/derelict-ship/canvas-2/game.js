// DERELICT - Survival Horror with Vision Cone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const VISION_RANGE = 300;
const VISION_ANGLE = Math.PI / 2; // 90 degrees

// Game state
let gameState = 'ship'; // ship, space, victory, gameover
let currentShip = 1;
let totalShips = 3;

// Mouse position
let mouse = { x: 400, y: 300 };

// Player
const player = {
    x: 200, y: 200,
    width: 28, height: 28,
    speed: 120,
    runSpeed: 200,
    hp: 100, maxHp: 100,
    o2: 100, maxO2: 100,
    angle: 0,
    weapon: 'pipe',
    ammo: { '9mm': 0, shells: 0 },
    inventory: [],
    lastAttack: 0,
    flashlight: true
};

// Weapons
const weapons = {
    pipe: { damage: 20, cooldown: 600, range: 50, type: 'melee' },
    pistol: { damage: 25, cooldown: 500, range: 300, type: 'ranged', ammoType: '9mm' },
    shotgun: { damage: 40, cooldown: 1000, range: 200, type: 'ranged', ammoType: 'shells', pellets: 5 },
    smg: { damage: 15, cooldown: 200, range: 280, type: 'ranged', ammoType: '9mm' }
};

// Enemies
let enemies = [];

// Projectiles
let projectiles = [];

// Current ship data
let rooms = [];
let walls = [];
let doors = [];
let items = [];
let escapePod = null;

// Space mode data
let spaceShips = [];
let playerShip = { x: 400, y: 300, vx: 0, vy: 0, angle: 0 };

// Input
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e') interact();
    if (e.key === '1' && player.inventory.length > 0) useItem(0);
    if (e.key === '2' && player.inventory.length > 1) useItem(1);
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('click', attack);

// Generate ship layout
function generateShip(shipNum) {
    rooms = [];
    walls = [];
    doors = [];
    items = [];
    enemies = [];
    escapePod = null;

    const roomCount = 4 + shipNum * 2;
    const roomWidth = 200;
    const roomHeight = 150;

    // Create rooms in a path
    let lastX = 100, lastY = 100;

    for (let i = 0; i < roomCount; i++) {
        const room = {
            x: lastX, y: lastY,
            width: roomWidth + Math.random() * 50,
            height: roomHeight + Math.random() * 50,
            explored: false
        };
        rooms.push(room);

        // Add walls
        walls.push(
            { x: room.x, y: room.y, w: room.width, h: 16 },
            { x: room.x, y: room.y + room.height - 16, w: room.width, h: 16 },
            { x: room.x, y: room.y, w: 16, h: room.height },
            { x: room.x + room.width - 16, y: room.y, w: 16, h: room.height }
        );

        // Add door to next room
        if (i < roomCount - 1) {
            doors.push({
                x: room.x + room.width - 20,
                y: room.y + room.height / 2 - 24,
                w: 24, h: 48,
                open: false,
                toRoom: i + 1
            });
        }

        // Move to next room position
        lastX += room.width - 32;
        if (i % 2 === 0) lastY += (Math.random() > 0.5 ? 80 : -80);
    }

    // Add items
    for (let i = 1; i < roomCount; i++) {
        const r = rooms[i];
        if (Math.random() < 0.7) {
            items.push({
                x: r.x + 40 + Math.random() * (r.width - 80),
                y: r.y + 40 + Math.random() * (r.height - 80),
                type: Math.random() < 0.6 ? 'o2_small' : (Math.random() < 0.7 ? 'medkit' : 'ammo')
            });
        }
    }

    // Add weapons
    if (shipNum === 1) {
        const r = rooms[2];
        items.push({ x: r.x + r.width / 2, y: r.y + r.height / 2, type: 'pistol' });
    } else if (shipNum === 2) {
        const r = rooms[3];
        items.push({ x: r.x + r.width / 2, y: r.y + r.height / 2, type: 'shotgun' });
    } else if (shipNum === 3) {
        const r = rooms[2];
        items.push({ x: r.x + r.width / 2, y: r.y + r.height / 2, type: 'smg' });
    }

    // Add enemies
    const enemyTypes = ['crawler', 'shambler', 'stalker'];
    const enemyCount = shipNum + 2;

    for (let i = 0; i < enemyCount; i++) {
        const roomIdx = 2 + Math.floor(Math.random() * (roomCount - 2));
        const r = rooms[roomIdx];
        const type = enemyTypes[Math.min(i % 3, shipNum - 1)];
        enemies.push(createEnemy(type, r.x + r.width / 2, r.y + r.height / 2));
    }

    // Boss on final ship
    if (shipNum === 3) {
        const bossRoom = rooms[roomCount - 1];
        enemies.push(createEnemy('boss', bossRoom.x + bossRoom.width / 2, bossRoom.y + bossRoom.height / 2));
    }

    // Escape pod in last room
    const lastRoom = rooms[roomCount - 1];
    escapePod = {
        x: lastRoom.x + lastRoom.width - 60,
        y: lastRoom.y + lastRoom.height / 2,
        active: shipNum < 3 || enemies.filter(e => e.type === 'boss').length === 0
    };

    // Player start
    player.x = rooms[0].x + rooms[0].width / 2;
    player.y = rooms[0].y + rooms[0].height / 2;
}

function createEnemy(type, x, y) {
    const templates = {
        crawler: { hp: 30, maxHp: 30, damage: 15, speed: 80, radius: 14, color: '#4a6' },
        shambler: { hp: 60, maxHp: 60, damage: 25, speed: 50, radius: 18, color: '#648' },
        stalker: { hp: 45, maxHp: 45, damage: 20, speed: 150, radius: 14, color: '#446' },
        boss: { hp: 150, maxHp: 150, damage: 35, speed: 80, radius: 40, color: '#844' }
    };
    const t = templates[type];
    return { x, y, type, ...t, lastAttack: 0, state: 'idle', detectionRange: 250 };
}

// Generate space mode
function generateSpace() {
    spaceShips = [];

    // Current ship (just left)
    spaceShips.push({
        x: 200, y: 300,
        type: 'derelict',
        shipNum: currentShip,
        explored: true
    });

    // Next ship
    if (currentShip < totalShips) {
        spaceShips.push({
            x: 600, y: 300,
            type: 'derelict',
            shipNum: currentShip + 1,
            explored: false
        });
    }

    playerShip.x = 250;
    playerShip.y = 300;
    playerShip.vx = 0;
    playerShip.vy = 0;
}

// Update
function update(dt) {
    if (gameState === 'ship') {
        updateShipMode(dt);
    } else if (gameState === 'space') {
        updateSpaceMode(dt);
    }
}

function updateShipMode(dt) {
    // O2 drain
    const isRunning = keys['shift'];
    const isMoving = keys['w'] || keys['s'] || keys['a'] || keys['d'];

    if (isRunning && isMoving) {
        player.o2 -= dt * 1.33; // 1 per 0.75s
    } else if (isMoving) {
        player.o2 -= dt * 0.67; // 1 per 1.5s
    } else {
        player.o2 -= dt * 0.5; // 1 per 2s
    }

    if (player.o2 <= 0) {
        player.o2 = 0;
        gameState = 'gameover';
        return;
    }

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        const speed = isRunning ? player.runSpeed : player.speed;
        const newX = player.x + (dx / len) * speed * dt;
        const newY = player.y + (dy / len) * speed * dt;

        if (!checkWallCollision(newX, player.y, player.width / 2)) player.x = newX;
        if (!checkWallCollision(player.x, newY, player.height / 2)) player.y = newY;
    }

    // Player angle towards mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || checkWallCollision(p.x, p.y, 4)) {
            projectiles.splice(i, 1);
            continue;
        }

        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
            if (dist < e.radius + 6) {
                e.hp -= p.damage;
                projectiles.splice(i, 1);

                if (e.hp <= 0) {
                    enemies.splice(j, 1);
                    // Boss drops make escape pod active
                    if (e.type === 'boss' && escapePod) {
                        escapePod.active = true;
                    }
                }
                break;
            }
        }
    }

    // Update enemies
    for (const e of enemies) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detection
        if (dist < e.detectionRange) {
            e.state = 'chase';
        }

        if (e.state === 'chase' && dist > e.radius + 20) {
            // Move towards player
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;

            // Wall collision
            if (checkWallCollision(e.x, e.y, e.radius)) {
                e.x -= (dx / dist) * e.speed * dt;
                e.y -= (dy / dist) * e.speed * dt;
            }
        }

        // Attack
        if (dist < e.radius + 20 && Date.now() - e.lastAttack > 1200) {
            player.hp -= e.damage;
            e.lastAttack = Date.now();

            if (player.hp <= 0) {
                player.hp = 0;
                gameState = 'gameover';
            }
        }
    }

    // Item pickup
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
        if (dist < 40) {
            pickupItem(item);
            items.splice(i, 1);
        }
    }

    // Mark rooms as explored
    for (const room of rooms) {
        if (player.x > room.x && player.x < room.x + room.width &&
            player.y > room.y && player.y < room.y + room.height) {
            room.explored = true;
        }
    }
}

function updateSpaceMode(dt) {
    // Ship controls
    if (keys['w']) {
        playerShip.vx += Math.cos(playerShip.angle) * 200 * dt;
        playerShip.vy += Math.sin(playerShip.angle) * 200 * dt;
    }
    if (keys['a']) playerShip.angle -= 3 * dt;
    if (keys['d']) playerShip.angle += 3 * dt;

    // Friction
    playerShip.vx *= 0.98;
    playerShip.vy *= 0.98;

    playerShip.x += playerShip.vx * dt;
    playerShip.y += playerShip.vy * dt;

    // Bounds
    playerShip.x = Math.max(50, Math.min(750, playerShip.x));
    playerShip.y = Math.max(50, Math.min(550, playerShip.y));

    // Check docking
    for (const ship of spaceShips) {
        const dist = Math.sqrt((playerShip.x - ship.x) ** 2 + (playerShip.y - ship.y) ** 2);
        if (dist < 60 && keys['e']) {
            if (ship.shipNum > currentShip) {
                currentShip = ship.shipNum;
                generateShip(currentShip);
                gameState = 'ship';
            }
        }
    }
}

function checkWallCollision(x, y, radius) {
    for (const wall of walls) {
        if (x + radius > wall.x && x - radius < wall.x + wall.w &&
            y + radius > wall.y && y - radius < wall.y + wall.h) {
            return true;
        }
    }

    // Closed doors
    for (const door of doors) {
        if (!door.open &&
            x + radius > door.x && x - radius < door.x + door.w &&
            y + radius > door.y && y - radius < door.y + door.h) {
            return true;
        }
    }

    return false;
}

function interact() {
    if (gameState === 'ship') {
        // Doors
        for (const door of doors) {
            const dist = Math.sqrt((player.x - (door.x + door.w / 2)) ** 2 + (player.y - (door.y + door.h / 2)) ** 2);
            if (dist < 50) {
                door.open = !door.open;
            }
        }

        // Escape pod
        if (escapePod && escapePod.active) {
            const dist = Math.sqrt((player.x - escapePod.x) ** 2 + (player.y - escapePod.y) ** 2);
            if (dist < 50) {
                if (currentShip >= totalShips) {
                    gameState = 'victory';
                } else {
                    generateSpace();
                    gameState = 'space';
                }
            }
        }
    }
}

function attack() {
    if (gameState !== 'ship') return;

    const weapon = weapons[player.weapon];
    const now = Date.now();

    if (now - player.lastAttack < weapon.cooldown) return;

    if (weapon.type === 'ranged') {
        if (player.ammo[weapon.ammoType] <= 0) return;
        player.ammo[weapon.ammoType]--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = pellets > 1 ? (Math.random() - 0.5) * 0.4 : 0;
            const angle = player.angle + spread;
            projectiles.push({
                x: player.x + Math.cos(player.angle) * 20,
                y: player.y + Math.sin(player.angle) * 20,
                vx: Math.cos(angle) * 500,
                vy: Math.sin(angle) * 500,
                damage: weapon.damage,
                life: weapon.range / 500
            });
        }
    } else {
        // Melee
        player.o2 -= 2; // Combat drain

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const dist = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
            if (dist < weapon.range + e.radius) {
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                const diff = Math.abs(normalizeAngle(angle - player.angle));
                if (diff < Math.PI / 3) {
                    e.hp -= weapon.damage;
                    if (e.hp <= 0) {
                        enemies.splice(i, 1);
                        if (e.type === 'boss' && escapePod) {
                            escapePod.active = true;
                        }
                    }
                }
            }
        }
    }

    player.lastAttack = now;
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function pickupItem(item) {
    switch (item.type) {
        case 'o2_small': player.o2 = Math.min(player.maxO2, player.o2 + 25); break;
        case 'o2_large': player.o2 = Math.min(player.maxO2, player.o2 + 50); break;
        case 'medkit': player.hp = Math.min(player.maxHp, player.hp + 30); break;
        case 'ammo':
            player.ammo['9mm'] += 12;
            player.ammo['shells'] += 4;
            break;
        case 'pistol': player.weapon = 'pistol'; player.ammo['9mm'] += 12; break;
        case 'shotgun': player.weapon = 'shotgun'; player.ammo['shells'] += 8; break;
        case 'smg': player.weapon = 'smg'; player.ammo['9mm'] += 30; break;
    }
}

function useItem(index) {
    if (index < player.inventory.length) {
        const item = player.inventory[index];
        pickupItem({ type: item });
        player.inventory.splice(index, 1);
    }
}

// Check if point is in vision cone
function isInVision(px, py) {
    const dx = px - player.x;
    const dy = py - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > VISION_RANGE) return false;

    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(normalizeAngle(angle - player.angle));

    if (diff > VISION_ANGLE / 2) return false;

    // Raycast for wall blocking
    const steps = Math.floor(dist / 10);
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const checkX = player.x + dx * t;
        const checkY = player.y + dy * t;
        if (checkWallCollisionPoint(checkX, checkY)) return false;
    }

    return true;
}

function checkWallCollisionPoint(x, y) {
    for (const wall of walls) {
        if (x > wall.x && x < wall.x + wall.w &&
            y > wall.y && y < wall.y + wall.h) {
            return true;
        }
    }
    return false;
}

// Render
function render() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'ship') {
        renderShipMode();
    } else if (gameState === 'space') {
        renderSpaceMode();
    } else if (gameState === 'victory') {
        renderVictory();
    } else if (gameState === 'gameover') {
        renderGameOver();
    }
}

function renderShipMode() {
    // Draw rooms (floors)
    for (const room of rooms) {
        ctx.fillStyle = '#1a1a25';
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Grid lines
        ctx.strokeStyle = '#252530';
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
    }

    // Draw walls
    ctx.fillStyle = '#333340';
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    // Draw doors
    for (const door of doors) {
        ctx.fillStyle = door.open ? '#2a3a2a' : '#4a3a2a';
        ctx.fillRect(door.x, door.y, door.w, door.h);
    }

    // Draw escape pod
    if (escapePod) {
        ctx.fillStyle = escapePod.active ? '#2a4a2a' : '#4a2a2a';
        ctx.beginPath();
        ctx.arc(escapePod.x, escapePod.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POD', escapePod.x, escapePod.y + 4);
    }

    // Draw items (only in vision)
    for (const item of items) {
        if (isInVision(item.x, item.y)) {
            switch (item.type) {
                case 'o2_small':
                case 'o2_large':
                    ctx.fillStyle = '#4af';
                    break;
                case 'medkit':
                    ctx.fillStyle = '#f44';
                    break;
                case 'ammo':
                    ctx.fillStyle = '#ff0';
                    break;
                default:
                    ctx.fillStyle = '#fa0';
            }
            ctx.beginPath();
            ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw enemies (only in vision)
    for (const e of enemies) {
        if (isInVision(e.x, e.y)) {
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#f00';
            const eyeAngle = Math.atan2(player.y - e.y, player.x - e.x);
            ctx.beginPath();
            ctx.arc(e.x + Math.cos(eyeAngle) * e.radius * 0.4, e.y + Math.sin(eyeAngle) * e.radius * 0.4, 4, 0, Math.PI * 2);
            ctx.fill();

            // HP bar for boss
            if (e.type === 'boss') {
                ctx.fillStyle = '#333';
                ctx.fillRect(e.x - 30, e.y - e.radius - 15, 60, 8);
                ctx.fillStyle = '#f44';
                ctx.fillRect(e.x - 30, e.y - e.radius - 15, 60 * (e.hp / e.maxHp), 8);
            }
        }
    }

    // Draw projectiles
    ctx.fillStyle = '#ff0';
    for (const p of projectiles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = '#6a8';
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(8, -3, 10, 6);

    ctx.restore();

    // Vision cone overlay (darkness outside cone)
    ctx.save();

    // Create clipping path for everything OUTSIDE vision cone
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);

    // Cut out vision cone
    ctx.moveTo(player.x, player.y);
    const startAngle = player.angle - VISION_ANGLE / 2;
    const endAngle = player.angle + VISION_ANGLE / 2;
    ctx.arc(player.x, player.y, VISION_RANGE, startAngle, endAngle);
    ctx.lineTo(player.x, player.y);

    ctx.clip('evenodd');

    // Draw darkness
    ctx.fillStyle = 'rgba(0,0,10,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();

    // Vision cone edge glow
    ctx.strokeStyle = 'rgba(100,150,200,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, VISION_RANGE, startAngle, endAngle);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();

    // HUD
    renderHUD();
}

function renderSpaceMode() {
    // Stars background
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 73 + 17) % canvas.width;
        const y = (i * 97 + 31) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }

    // Draw ships
    for (const ship of spaceShips) {
        ctx.fillStyle = ship.explored ? '#444' : '#666';
        ctx.fillRect(ship.x - 40, ship.y - 25, 80, 50);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Ship ${ship.shipNum}`, ship.x, ship.y + 5);

        if (!ship.explored) {
            ctx.fillStyle = '#4f4';
            ctx.fillText('Press E to dock', ship.x, ship.y + 20);
        }
    }

    // Draw player ship
    ctx.save();
    ctx.translate(playerShip.x, playerShip.y);
    ctx.rotate(playerShip.angle);

    ctx.fillStyle = '#6a8';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();

    // Thruster
    if (keys['w']) {
        ctx.fillStyle = '#f80';
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-25, 0);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SPACE MODE - W to thrust, A/D to turn, E to dock', 10, 30);
    ctx.fillText(`Ship ${currentShip}/${totalShips}`, 10, 55);
}

function renderHUD() {
    // O2 bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 150, 20);
    const o2Color = player.o2 < 20 ? '#f44' : '#4af';
    ctx.fillStyle = o2Color;
    ctx.fillRect(10, 10, 150 * (player.o2 / player.maxO2), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`O2: ${Math.ceil(player.o2)}`, 15, 25);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 150, 20);
    ctx.fillStyle = '#f44';
    ctx.fillRect(10, 35, 150 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 35, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}`, 15, 50);

    // Weapon and ammo
    ctx.fillText(`Weapon: ${player.weapon.toUpperCase()}`, 10, 80);
    if (player.weapon !== 'pipe') {
        const ammoType = weapons[player.weapon].ammoType;
        ctx.fillText(`Ammo: ${player.ammo[ammoType]}`, 10, 100);
    }

    // Ship indicator
    ctx.textAlign = 'right';
    ctx.fillText(`Ship ${currentShip}/${totalShips}`, 790, 25);

    // Low O2 warning
    if (player.o2 < 20) {
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f44';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LOW OXYGEN!', 400, 570);
    }

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | Mouse: Aim | Click: Attack | E: Interact | Shift: Run', 400, 590);
}

function renderVictory() {
    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('You survived the derelict ships!', 400, 320);
    ctx.fillText('Press R to play again', 400, 400);
}

function renderGameOver() {
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    if (player.o2 <= 0) {
        ctx.fillText('Your lungs burned for oxygen that never came.', 400, 320);
    } else {
        ctx.fillText('Your body joins the ships other victims.', 400, 320);
    }
    ctx.fillText('Press R to try again', 400, 400);
}

// Restart
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r' && (gameState === 'gameover' || gameState === 'victory')) {
        currentShip = 1;
        player.hp = player.maxHp;
        player.o2 = player.maxO2;
        player.weapon = 'pipe';
        player.ammo = { '9mm': 0, shells: 0 };
        player.inventory = [];
        generateShip(1);
        gameState = 'ship';
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
generateShip(1);
requestAnimationFrame(gameLoop);
