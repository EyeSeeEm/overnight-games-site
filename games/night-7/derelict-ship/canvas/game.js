// Derelict - 2D Survival Horror with Vision Cone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game states
let gameState = 'menu'; // menu, playing, space, gameover, victory
let currentShip = 1;
const MAX_SHIPS = 3;

// Player
const player = {
    x: 400, y: 300,
    size: 24,
    speed: 120, runSpeed: 200,
    hp: 100, maxHp: 100,
    o2: 100, maxO2: 100,
    angle: 0,
    running: false,
    flashlight: true,
    flashlightBattery: 60,
    weapon: null,
    inventory: [],
    ammo: { '9mm': 0, shells: 0 }
};

// Escape pod (space mode)
const escapePod = {
    x: 400, y: 300,
    angle: 0,
    speed: 150
};

// Weapons
const WEAPONS = {
    Pipe: { type: 'melee', damage: 20, cooldown: 0.6, durability: 15 },
    Pistol: { type: 'ranged', damage: 25, cooldown: 0.5, ammoType: '9mm', magSize: 12, mag: 12 },
    Shotgun: { type: 'ranged', damage: 40, cooldown: 1.0, ammoType: 'shells', magSize: 6, mag: 6, pellets: 5 },
    SMG: { type: 'ranged', damage: 15, cooldown: 0.2, ammoType: '9mm', magSize: 30, mag: 30 }
};

// Enemies
const ENEMY_TYPES = {
    crawler: { hp: 30, damage: 15, speed: 80, size: 24, color: '#44AA44' },
    shambler: { hp: 60, damage: 25, speed: 50, size: 32, color: '#AA6644' },
    stalker: { hp: 45, damage: 20, speed: 150, size: 28, color: '#666688' },
    boss: { hp: 150, damage: 35, speed: 80, size: 64, color: '#FF4444', isBoss: true }
};

// Ship data
let rooms = [];
let doors = [];
let enemies = [];
let items = [];
let projectiles = [];
let particles = [];

// Derelict ships in space
let derelicts = [];

// Input
const keys = {};
const mouse = { x: 400, y: 300 };

// Timers
let o2Timer = 0;
let attackCooldown = 0;
let o2WarningShown = 0;

// Colors
const COLORS = {
    floor: '#2A2A35',
    wall: '#1A1A22',
    door: '#444455',
    player: '#AADDFF',
    o2: '#44AAFF',
    hp: '#FF4444'
};

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (gameState === 'menu' && e.key === ' ') {
        startGame();
    }
    if (gameState === 'playing' && e.key === 'f') {
        player.flashlight = !player.flashlight;
    }
    if (gameState === 'playing' && e.key === 'e') {
        interact();
    }
    if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
        gameState = 'menu';
    }
});

document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0 && gameState === 'playing') attack();
});

// Start game
function startGame() {
    resetPlayer();
    currentShip = 1;
    generateShip(currentShip);
    gameState = 'playing';
}

function resetPlayer() {
    player.hp = 100;
    player.o2 = 100;
    player.flashlight = true;
    player.flashlightBattery = 60;
    player.weapon = { ...WEAPONS.Pipe, name: 'Pipe' };
    player.inventory = [];
    player.ammo = { '9mm': 0, shells: 0 };
}

// Generate ship layout
function generateShip(shipNum) {
    rooms = [];
    doors = [];
    enemies = [];
    items = [];
    projectiles = [];

    // Ship complexity based on number
    const roomCount = 4 + shipNum * 2;

    // Generate rooms in a line with branches
    let x = 100, y = 200;

    for (let i = 0; i < roomCount; i++) {
        const width = 150 + Math.random() * 100;
        const height = 120 + Math.random() * 80;

        rooms.push({
            x, y, width, height,
            explored: i === 0,
            isLifeSupport: i === Math.floor(roomCount / 2),
            isExit: i === roomCount - 1
        });

        // Door to next room
        if (i < roomCount - 1) {
            doors.push({
                x: x + width - 10,
                y: y + height / 2 - 20,
                width: 20,
                height: 40,
                open: false,
                toRoom: i + 1
            });
        }

        x += width + 30;
    }

    // Place player in first room
    player.x = rooms[0].x + 50;
    player.y = rooms[0].y + rooms[0].height / 2;

    // Spawn enemies based on ship
    spawnEnemies(shipNum);

    // Place items
    placeItems(shipNum);
}

function spawnEnemies(shipNum) {
    const enemyConfigs = [
        { crawler: 2, shambler: 0, stalker: 0 }, // Ship 1
        { crawler: 2, shambler: 3, stalker: 0 }, // Ship 2
        { crawler: 0, shambler: 3, stalker: 3 }  // Ship 3
    ];

    const config = enemyConfigs[shipNum - 1];

    // Spawn crawlers
    for (let i = 0; i < config.crawler; i++) {
        spawnEnemy('crawler', shipNum);
    }
    for (let i = 0; i < config.shambler; i++) {
        spawnEnemy('shambler', shipNum);
    }
    for (let i = 0; i < config.stalker; i++) {
        spawnEnemy('stalker', shipNum);
    }

    // Boss on final ship
    if (shipNum === MAX_SHIPS) {
        const lastRoom = rooms[rooms.length - 1];
        enemies.push({
            ...ENEMY_TYPES.boss,
            type: 'boss',
            x: lastRoom.x + lastRoom.width / 2,
            y: lastRoom.y + lastRoom.height / 2,
            hp: ENEMY_TYPES.boss.hp,
            maxHp: ENEMY_TYPES.boss.hp,
            spawnedAdds: false
        });
    }
}

function spawnEnemy(type, shipNum) {
    const template = ENEMY_TYPES[type];
    // Pick a room (not first, not last unless it's the boss room)
    const roomIdx = 1 + Math.floor(Math.random() * (rooms.length - 2));
    const room = rooms[roomIdx];

    enemies.push({
        ...template,
        type,
        x: room.x + 50 + Math.random() * (room.width - 100),
        y: room.y + 50 + Math.random() * (room.height - 100),
        hp: template.hp,
        maxHp: template.hp,
        state: 'patrol',
        patrolDir: Math.random() * Math.PI * 2,
        lastSeen: null
    });
}

function placeItems(shipNum) {
    // O2 canisters
    const o2Count = 3 + shipNum;
    for (let i = 0; i < o2Count; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        items.push({
            type: 'o2',
            value: Math.random() < 0.7 ? 25 : 50,
            x: room.x + 30 + Math.random() * (room.width - 60),
            y: room.y + 30 + Math.random() * (room.height - 60)
        });
    }

    // Medkits
    const medkitCount = 2 + Math.floor(shipNum / 2);
    for (let i = 0; i < medkitCount; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        items.push({
            type: 'medkit',
            value: Math.random() < 0.7 ? 30 : 60,
            x: room.x + 30 + Math.random() * (room.width - 60),
            y: room.y + 30 + Math.random() * (room.height - 60)
        });
    }

    // Weapons and ammo
    if (shipNum === 1) {
        // Pistol on ship 1
        const room = rooms[Math.floor(rooms.length / 2)];
        items.push({ type: 'weapon', name: 'Pistol', x: room.x + room.width / 2, y: room.y + room.height / 2 });
        items.push({ type: 'ammo', ammoType: '9mm', value: 24, x: room.x + room.width / 2 + 30, y: room.y + room.height / 2 });
    } else if (shipNum === 2) {
        // Shotgun on ship 2
        const room = rooms[Math.floor(rooms.length / 2)];
        items.push({ type: 'weapon', name: 'Shotgun', x: room.x + room.width / 2, y: room.y + room.height / 2 });
        items.push({ type: 'ammo', ammoType: 'shells', value: 12, x: room.x + room.width / 2 + 30, y: room.y + room.height / 2 });
    } else if (shipNum === 3) {
        // SMG on ship 3
        const room = rooms[Math.floor(rooms.length / 2)];
        items.push({ type: 'weapon', name: 'SMG', x: room.x + room.width / 2, y: room.y + room.height / 2 });
        items.push({ type: 'ammo', ammoType: '9mm', value: 60, x: room.x + room.width / 2 + 30, y: room.y + room.height / 2 });
    }
}

// Start space mode
function startSpaceMode() {
    gameState = 'space';

    // Generate derelict positions
    derelicts = [];
    for (let i = currentShip; i <= MAX_SHIPS; i++) {
        derelicts.push({
            x: 200 + (i - currentShip) * 250,
            y: 200 + Math.random() * 200,
            shipNum: i,
            docked: i === currentShip
        });
    }

    escapePod.x = derelicts[0].x;
    escapePod.y = derelicts[0].y + 80;
}

// Attack
function attack() {
    if (attackCooldown > 0) return;
    if (!player.weapon) return;

    const weapon = player.weapon;
    attackCooldown = weapon.cooldown;

    // O2 cost for combat
    player.o2 = Math.max(0, player.o2 - 2);

    if (weapon.type === 'melee') {
        // Melee attack
        const reach = 50;
        enemies.forEach(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angle - player.angle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (dist < reach + e.size / 2 && angleDiff < 0.8) {
                damageEnemy(e, weapon.damage);
            }
        });

        // Visual
        particles.push({
            x: player.x + Math.cos(player.angle) * 30,
            y: player.y + Math.sin(player.angle) * 30,
            type: 'slash',
            angle: player.angle,
            life: 0.15
        });

        // Durability
        weapon.durability--;
        if (weapon.durability <= 0) {
            player.weapon = null;
        }
    } else {
        // Ranged attack
        if (weapon.mag <= 0) {
            // Reload
            const needed = weapon.magSize - weapon.mag;
            const available = player.ammo[weapon.ammoType] || 0;
            const reload = Math.min(needed, available);
            weapon.mag += reload;
            player.ammo[weapon.ammoType] -= reload;
            return;
        }

        weapon.mag--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = pellets > 1 ? (Math.random() - 0.5) * 0.4 : 0;
            const angle = player.angle + spread;

            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 500,
                vy: Math.sin(angle) * 500,
                damage: weapon.damage,
                owner: 'player'
            });
        }
    }
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;
    enemy.state = 'alert';
    enemy.lastSeen = { x: player.x, y: player.y };

    // Hit particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.3,
            color: enemy.color
        });
    }

    // Boss spawns adds at 50%
    if (enemy.isBoss && !enemy.spawnedAdds && enemy.hp < enemy.maxHp / 2) {
        enemy.spawnedAdds = true;
        for (let i = 0; i < 2; i++) {
            enemies.push({
                ...ENEMY_TYPES.crawler,
                type: 'crawler',
                x: enemy.x + (Math.random() - 0.5) * 100,
                y: enemy.y + (Math.random() - 0.5) * 100,
                hp: ENEMY_TYPES.crawler.hp,
                maxHp: ENEMY_TYPES.crawler.hp,
                state: 'alert',
                lastSeen: { x: player.x, y: player.y }
            });
        }
    }

    if (enemy.hp <= 0) {
        const idx = enemies.indexOf(enemy);
        if (idx >= 0) enemies.splice(idx, 1);
    }
}

// Interact
function interact() {
    // Check doors
    for (const door of doors) {
        const dx = player.x - (door.x + door.width / 2);
        const dy = player.y - (door.y + door.height / 2);
        if (Math.abs(dx) < 40 && Math.abs(dy) < 40) {
            door.open = !door.open;
            if (door.toRoom !== undefined) {
                rooms[door.toRoom].explored = true;
            }
            return;
        }
    }

    // Check items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        if (dx * dx + dy * dy < 40 * 40) {
            pickupItem(item);
            items.splice(i, 1);
            return;
        }
    }

    // Check exit
    const exitRoom = rooms.find(r => r.isExit);
    if (exitRoom) {
        const dx = player.x - (exitRoom.x + exitRoom.width - 30);
        const dy = player.y - (exitRoom.y + exitRoom.height / 2);
        if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
            // Must defeat boss on final ship
            if (currentShip === MAX_SHIPS) {
                const bossAlive = enemies.some(e => e.isBoss);
                if (!bossAlive) {
                    gameState = 'victory';
                }
            } else {
                startSpaceMode();
            }
        }
    }
}

function pickupItem(item) {
    if (item.type === 'o2') {
        player.o2 = Math.min(player.maxO2, player.o2 + item.value);
    } else if (item.type === 'medkit') {
        player.hp = Math.min(player.maxHp, player.hp + item.value);
    } else if (item.type === 'weapon') {
        player.weapon = { ...WEAPONS[item.name], name: item.name };
    } else if (item.type === 'ammo') {
        player.ammo[item.ammoType] = (player.ammo[item.ammoType] || 0) + item.value;
    }
}

// Update functions
function update(dt) {
    if (gameState === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateParticles(dt);
        updateO2(dt);
        updateFlashlight(dt);
        attackCooldown = Math.max(0, attackCooldown - dt);

        if (player.hp <= 0 || player.o2 <= 0) {
            gameState = 'gameover';
        }
    } else if (gameState === 'space') {
        updateSpaceMode(dt);
    }
}

function updatePlayer(dt) {
    // Face mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Movement
    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    player.running = keys['shift'];
    const speed = (player.running ? player.runSpeed : player.speed) * dt;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;

        const newX = player.x + dx * speed;
        const newY = player.y + dy * speed;

        // Collision with walls/doors
        if (!collidesWithWalls(newX, player.y, player.size / 2)) player.x = newX;
        if (!collidesWithWalls(player.x, newY, player.size / 2)) player.y = newY;
    }
}

function collidesWithWalls(x, y, radius) {
    // Check room boundaries
    let inRoom = false;
    for (const room of rooms) {
        if (x > room.x + radius && x < room.x + room.width - radius &&
            y > room.y + radius && y < room.y + room.height - radius) {
            inRoom = true;
            break;
        }
    }

    // Check if in doorway
    if (!inRoom) {
        for (const door of doors) {
            if (door.open) {
                if (x > door.x - radius && x < door.x + door.width + radius &&
                    y > door.y - radius && y < door.y + door.height + radius) {
                    return false; // In open doorway
                }
            }
        }
    }

    return !inRoom;
}

function updateEnemies(dt) {
    enemies.forEach(e => {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detection
        const canSee = dist < 250 && isInVisionCone(e.x, e.y);
        const canHear = dist < (player.running ? 200 : 100);

        if (canSee || canHear) {
            e.state = 'alert';
            e.lastSeen = { x: player.x, y: player.y };
        }

        // Behavior
        if (e.state === 'alert' && e.lastSeen) {
            // Move toward last seen position
            const targetDx = e.lastSeen.x - e.x;
            const targetDy = e.lastSeen.y - e.y;
            const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

            if (targetDist > 20) {
                e.x += (targetDx / targetDist) * e.speed * dt;
                e.y += (targetDy / targetDist) * e.speed * dt;
            } else if (!canSee && !canHear) {
                e.state = 'patrol';
            }

            // Attack if close
            if (dist < e.size / 2 + player.size / 2 + 10) {
                player.hp -= e.damage * dt;
            }
        } else if (e.state === 'patrol') {
            // Patrol randomly
            e.x += Math.cos(e.patrolDir) * e.speed * 0.3 * dt;
            e.y += Math.sin(e.patrolDir) * e.speed * 0.3 * dt;

            if (Math.random() < 0.02) {
                e.patrolDir = Math.random() * Math.PI * 2;
            }
        }

        // Keep in bounds
        for (const room of rooms) {
            if (e.x > room.x && e.x < room.x + room.width &&
                e.y > room.y && e.y < room.y + room.height) {
                e.x = Math.max(room.x + e.size, Math.min(room.x + room.width - e.size, e.x));
                e.y = Math.max(room.y + e.size, Math.min(room.y + room.height - e.size, e.y));
                break;
            }
        }
    });
}

function updateProjectiles(dt) {
    projectiles = projectiles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Hit enemies
        if (p.owner === 'player') {
            for (const e of enemies) {
                const dx = p.x - e.x;
                const dy = p.y - e.y;
                if (dx * dx + dy * dy < (e.size / 2 + 5) ** 2) {
                    damageEnemy(e, p.damage);
                    return false;
                }
            }
        }

        // Out of bounds
        let inRoom = false;
        for (const room of rooms) {
            if (p.x > room.x && p.x < room.x + room.width &&
                p.y > room.y && p.y < room.y + room.height) {
                inRoom = true;
                break;
            }
        }

        return inRoom;
    });
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        if (p.vx !== undefined) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
        p.life -= dt;
        return p.life > 0;
    });
}

function updateO2(dt) {
    o2Timer += dt;

    let drainRate;
    if (keys['w'] || keys['a'] || keys['s'] || keys['d']) {
        drainRate = player.running ? 0.75 : 1.5;
    } else {
        drainRate = 2;
    }

    if (o2Timer >= drainRate) {
        o2Timer = 0;
        player.o2 = Math.max(0, player.o2 - 1);
    }

    // Life support room bonus
    for (const room of rooms) {
        if (room.isLifeSupport &&
            player.x > room.x && player.x < room.x + room.width &&
            player.y > room.y && player.y < room.y + room.height) {
            player.o2 = Math.min(player.maxO2, player.o2 + 5 * dt);
        }
    }
}

function updateFlashlight(dt) {
    if (player.flashlight) {
        player.flashlightBattery = Math.max(0, player.flashlightBattery - dt);
        if (player.flashlightBattery <= 0) player.flashlight = false;
    } else {
        player.flashlightBattery = Math.min(60, player.flashlightBattery + dt * 0.5);
    }
}

function updateSpaceMode(dt) {
    // Control escape pod
    escapePod.angle = Math.atan2(mouse.y - escapePod.y, mouse.x - escapePod.x);

    let dx = 0, dy = 0;
    if (keys['w']) dy -= 1;
    if (keys['s']) dy += 1;
    if (keys['a']) dx -= 1;
    if (keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        escapePod.x += (dx / len) * escapePod.speed * dt;
        escapePod.y += (dy / len) * escapePod.speed * dt;
    }

    // Keep in bounds
    escapePod.x = Math.max(50, Math.min(750, escapePod.x));
    escapePod.y = Math.max(50, Math.min(550, escapePod.y));

    // Check docking with derelicts
    if (keys['e']) {
        for (const d of derelicts) {
            const ddx = escapePod.x - d.x;
            const ddy = escapePod.y - d.y;
            if (ddx * ddx + ddy * ddy < 80 * 80) {
                currentShip = d.shipNum;
                generateShip(currentShip);
                gameState = 'playing';
                return;
            }
        }
    }
}

// Vision cone check
function isInVisionCone(x, y) {
    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    let angleDiff = Math.abs(angle - player.angle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    // 90 degree cone = 45 degrees each side
    return angleDiff < Math.PI / 4 && dist < 300;
}

// Render functions
function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        renderMenu();
    } else if (gameState === 'playing') {
        renderShip();
        renderVisionCone();
        renderHUD();
    } else if (gameState === 'space') {
        renderSpace();
    } else if (gameState === 'gameover') {
        renderGameOver();
    } else if (gameState === 'victory') {
        renderVictory();
    }
}

function renderShip() {
    // Draw rooms
    rooms.forEach(room => {
        // Floor
        ctx.fillStyle = room.isLifeSupport ? '#2A3A2A' : COLORS.floor;
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Walls
        ctx.strokeStyle = COLORS.wall;
        ctx.lineWidth = 8;
        ctx.strokeRect(room.x, room.y, room.width, room.height);

        // Life support indicator
        if (room.isLifeSupport) {
            ctx.fillStyle = '#44FF44';
            ctx.font = '12px monospace';
            ctx.fillText('LIFE SUPPORT', room.x + 10, room.y + 20);
        }

        // Exit indicator
        if (room.isExit) {
            ctx.fillStyle = '#FFFF44';
            ctx.fillText('EXIT [E]', room.x + room.width - 60, room.y + room.height / 2);
        }
    });

    // Doors
    doors.forEach(door => {
        ctx.fillStyle = door.open ? '#333344' : COLORS.door;
        ctx.fillRect(door.x, door.y, door.width, door.height);
    });

    // Items (only if visible)
    items.forEach(item => {
        if (!isInVisionCone(item.x, item.y)) return;

        if (item.type === 'o2') {
            ctx.fillStyle = '#44AAFF';
        } else if (item.type === 'medkit') {
            ctx.fillStyle = '#FF4444';
        } else if (item.type === 'weapon') {
            ctx.fillStyle = '#FFFF44';
        } else if (item.type === 'ammo') {
            ctx.fillStyle = '#FFAA44';
        }
        ctx.beginPath();
        ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies (only if in vision cone)
    enemies.forEach(e => {
        if (!isInVisionCone(e.x, e.y)) return;

        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Boss HP bar
        if (e.isBoss) {
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - 40, e.y - e.size / 2 - 15, 80, 8);
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(e.x - 40, e.y - e.size / 2 - 15, 80 * (e.hp / e.maxHp), 8);
        }
    });

    // Projectiles
    projectiles.forEach(p => {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.fillStyle = '#FFF';
    ctx.fillRect(player.size / 2 - 5, -3, 10, 6);

    ctx.restore();

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life * 2;
        if (p.type === 'slash') {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 40, p.angle - 0.5, p.angle + 0.5);
            ctx.stroke();
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        }
    });
    ctx.globalAlpha = 1;
}

function renderVisionCone() {
    // Dark overlay outside vision cone
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Create clipping path for visible area
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.moveTo(player.x, player.y);

    const range = player.flashlight ? 300 : 150;
    const rays = 60;
    const halfAngle = Math.PI / 4; // 45 degrees

    for (let i = 0; i <= rays; i++) {
        const rayAngle = player.angle - halfAngle + (halfAngle * 2 * i / rays);
        const rayDist = castRay(player.x, player.y, rayAngle, range);
        const x = player.x + Math.cos(rayAngle) * rayDist;
        const y = player.y + Math.sin(rayAngle) * rayDist;
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fill('evenodd');

    ctx.restore();

    // O2 warning pulse
    if (player.o2 < 20) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + Math.sin(Date.now() / 200) * 0.1})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function castRay(x, y, angle, maxDist) {
    const step = 5;
    let dist = 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    while (dist < maxDist) {
        const checkX = x + dx * dist;
        const checkY = y + dy * dist;

        // Check if in any room
        let inRoom = false;
        for (const room of rooms) {
            if (checkX >= room.x && checkX <= room.x + room.width &&
                checkY >= room.y && checkY <= room.y + room.height) {
                inRoom = true;
                break;
            }
        }

        // Check doorways
        if (!inRoom) {
            for (const door of doors) {
                if (door.open &&
                    checkX >= door.x && checkX <= door.x + door.width &&
                    checkY >= door.y && checkY <= door.y + door.height) {
                    inRoom = true;
                    break;
                }
            }
        }

        if (!inRoom) return dist;
        dist += step;
    }

    return maxDist;
}

function renderHUD() {
    // O2 bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = player.o2 < 20 ? '#FF4444' : COLORS.o2;
    ctx.fillRect(20, 20, 200 * (player.o2 / player.maxO2), 20);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px monospace';
    ctx.fillText(`O2: ${Math.ceil(player.o2)}`, 25, 35);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 45, 200, 20);
    ctx.fillStyle = COLORS.hp;
    ctx.fillRect(20, 45, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(20, 45, 200, 20);
    ctx.fillText(`HP: ${Math.ceil(player.hp)}`, 25, 60);

    // Weapon info
    if (player.weapon) {
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Weapon: ${player.weapon.name}`, 20, 90);
        if (player.weapon.type === 'ranged') {
            ctx.fillText(`Ammo: ${player.weapon.mag}/${player.weapon.magSize} | ${player.ammo[player.weapon.ammoType] || 0}`, 20, 105);
        } else {
            ctx.fillText(`Durability: ${player.weapon.durability}`, 20, 105);
        }
    }

    // Flashlight
    ctx.fillStyle = player.flashlight ? '#FFFF44' : '#666';
    ctx.fillText(`Flashlight [F]: ${player.flashlight ? 'ON' : 'OFF'}`, 20, 130);
    ctx.fillStyle = '#333';
    ctx.fillRect(150, 120, 60, 10);
    ctx.fillStyle = '#FFFF44';
    ctx.fillRect(150, 120, 60 * (player.flashlightBattery / 60), 10);

    // Ship indicator
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Ship ${currentShip}/${MAX_SHIPS}`, canvas.width - 20, 30);

    // Controls
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WASD: Move | Shift: Run | E: Interact | LMB: Attack', 20, canvas.height - 15);
}

function renderSpace() {
    // Stars background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`;
        ctx.fillRect((i * 73) % canvas.width, (i * 47) % canvas.height, 2, 2);
    }

    // Derelict ships
    derelicts.forEach(d => {
        ctx.fillStyle = '#444';
        ctx.fillRect(d.x - 40, d.y - 20, 80, 40);
        ctx.fillStyle = d.shipNum === currentShip + 1 ? '#FFFF44' : '#888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Ship ${d.shipNum}`, d.x, d.y - 30);
        ctx.fillText('[E to dock]', d.x, d.y + 50);
    });

    // Escape pod
    ctx.save();
    ctx.translate(escapePod.x, escapePod.y);
    ctx.rotate(escapePod.angle);
    ctx.fillStyle = '#88AAFF';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE MODE - Navigate to next derelict', canvas.width / 2, 30);
    ctx.fillText('WASD to move, E to dock', canvas.width / 2, 50);
}

function renderMenu() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4488FF';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DERELICT', canvas.width / 2, 200);

    ctx.fillStyle = '#666';
    ctx.font = '16px monospace';
    ctx.fillText('Survive. Escape. Breathe.', canvas.width / 2, 250);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText('WASD - Move', canvas.width / 2, 350);
    ctx.fillText('Mouse - Aim', canvas.width / 2, 380);
    ctx.fillText('LMB - Attack', canvas.width / 2, 410);
    ctx.fillText('E - Interact | F - Flashlight', canvas.width / 2, 440);

    ctx.fillStyle = '#FF4444';
    ctx.fillText('Your oxygen is constantly draining!', canvas.width / 2, 490);

    ctx.fillStyle = '#FFFF44';
    ctx.font = '24px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 550);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FF4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';

    if (player.o2 <= 0) {
        ctx.fillText('SUFFOCATED', canvas.width / 2, 250);
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('Your lungs burned for oxygen that never came.', canvas.width / 2, 300);
    } else {
        ctx.fillText('KILLED', canvas.width / 2, 250);
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('Your body joins the ship\'s other victims.', canvas.width / 2, 300);
    }

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText(`Reached Ship ${currentShip}/${MAX_SHIPS}`, canvas.width / 2, 380);
    ctx.fillText('Press SPACE to return to menu', canvas.width / 2, 450);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44FF44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, 250);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('You escaped the derelict fleet.', canvas.width / 2, 300);
    ctx.fillText('The cold of space has never felt so warm.', canvas.width / 2, 330);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText('Press SPACE to return to menu', canvas.width / 2, 450);
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

requestAnimationFrame(gameLoop);
