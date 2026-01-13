// System Shock 2D - Whispers of M.A.R.I.A.
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const PLAYER_SPEED = 150;
const SPRINT_SPEED = 250;
const VISION_RANGE = 300;
const VISION_ANGLE = Math.PI / 2; // 90 degrees

// Game state
let gameState = 'menu';
let gamePaused = true;
let currentDeck = 1;

// Player
const player = {
    x: 200, y: 200,
    width: 20, height: 20,
    angle: 0,
    health: 100, maxHealth: 100,
    energy: 100, maxEnergy: 100,
    speed: PLAYER_SPEED,
    weapon: null,
    ammo: 48,
    magazine: 12,
    magazineSize: 12,
    reloading: false,
    reloadTime: 0,
    attackCooldown: 0,
    dodgeCooldown: 0,
    flashlightOn: true,
    skills: {
        firearms: 1,
        hacking: 1,
        stealth: 1,
        endurance: 1
    },
    cyberModules: 0,
    inventory: []
};

// Weapons
const WEAPONS = {
    wrench: { name: 'Wrench', damage: 15, cooldown: 400, range: 40, type: 'melee', infinite: true },
    pistol: { name: 'Pistol', damage: 12, cooldown: 300, range: 400, type: 'ranged', magazineSize: 12, reloadTime: 1500 },
    shotgun: { name: 'Shotgun', damage: 8, pellets: 6, cooldown: 800, range: 200, type: 'ranged', magazineSize: 6, reloadTime: 2500 },
    laser: { name: 'Laser Pistol', damage: 20, cooldown: 400, range: 350, type: 'energy', magazineSize: 20, reloadTime: 0 }
};

// Enemy types
const ENEMY_TYPES = {
    drone: { name: 'Cyborg Drone', hp: 30, damage: 10, speed: 80, range: 40, color: '#4a4', size: 22, drops: 'bullets' },
    soldier: { name: 'Cyborg Soldier', hp: 60, damage: 15, speed: 100, range: 200, color: '#484', size: 26, ranged: true, drops: 'medkit' },
    assassin: { name: 'Cyborg Assassin', hp: 40, damage: 25, speed: 150, range: 40, color: '#262', size: 20, cloaks: true, drops: 'energy' },
    heavy: { name: 'Cyborg Heavy', hp: 120, damage: 20, speed: 60, range: 150, color: '#2a2', size: 32, armor: 15, drops: 'shells' }
};

// Map and entities
let map = [];
let enemies = [];
let items = [];
let bullets = [];
let particles = [];
let doors = [];

// Camera
let cameraX = 0, cameraY = 0;

// Input
const keys = {};
let mouseX = 400, mouseY = 300;
let mouseDown = false;

// Stats
let stats = {
    enemiesKilled: 0,
    roomsExplored: 0,
    cyberModulesCollected: 0,
    damageDealt: 0,
    damageTaken: 0
};

// M.A.R.I.A. messages
const MARIA_MESSAGES = [
    "You're awake. Fascinating.",
    "The others joined willingly. Why do you resist?",
    "I've watched your progress with interest.",
    "Every step brings you closer to perfection.",
    "Do you think you can stop me?"
];
let mariaMessageTimer = 0;

// Initialize map
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Create walls around edges
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                map[y][x] = { type: 'wall', visible: false, explored: false };
            } else {
                map[y][x] = { type: 'floor', visible: false, explored: false };
            }
        }
    }

    // Generate rooms and corridors
    const rooms = [];
    for (let i = 0; i < 8; i++) {
        const roomW = 5 + Math.floor(Math.random() * 6);
        const roomH = 4 + Math.floor(Math.random() * 5);
        const roomX = 2 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 4));
        const roomY = 2 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 4));

        // Create room
        for (let ry = roomY; ry < roomY + roomH; ry++) {
            for (let rx = roomX; rx < roomX + roomW; rx++) {
                if (rx > 0 && rx < MAP_WIDTH - 1 && ry > 0 && ry < MAP_HEIGHT - 1) {
                    map[ry][rx] = { type: 'floor', visible: false, explored: false };
                }
            }
        }

        // Add walls around room
        for (let ry = roomY - 1; ry <= roomY + roomH; ry++) {
            for (let rx = roomX - 1; rx <= roomX + roomW; rx++) {
                if (rx >= 0 && rx < MAP_WIDTH && ry >= 0 && ry < MAP_HEIGHT) {
                    if (ry === roomY - 1 || ry === roomY + roomH || rx === roomX - 1 || rx === roomX + roomW) {
                        if (map[ry][rx].type !== 'floor') {
                            map[ry][rx] = { type: 'wall', visible: false, explored: false };
                        }
                    }
                }
            }
        }

        rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH });
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        // Horizontal corridor
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (y1 > 0 && y1 < MAP_HEIGHT - 1) {
                map[y1][x] = { type: 'floor', visible: false, explored: false };
            }
        }
        // Vertical corridor
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (x2 > 0 && x2 < MAP_WIDTH - 1) {
                map[y][x2] = { type: 'floor', visible: false, explored: false };
            }
        }
    }

    return rooms;
}

// Spawn enemies
function spawnEnemies(rooms) {
    enemies = [];

    const enemyCount = 5 + currentDeck * 2;
    const types = Object.keys(ENEMY_TYPES);

    for (let i = 0; i < enemyCount; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        const type = types[Math.min(Math.floor(Math.random() * (currentDeck + 1)), types.length - 1)];
        const def = ENEMY_TYPES[type];

        enemies.push({
            type,
            x: (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE,
            y: (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE,
            hp: def.hp,
            maxHp: def.hp,
            damage: def.damage,
            speed: def.speed,
            range: def.range,
            color: def.color,
            size: def.size,
            armor: def.armor || 0,
            ranged: def.ranged || false,
            cloaks: def.cloaks || false,
            drops: def.drops,
            state: 'patrol',
            attackCooldown: 0,
            patrolTarget: { x: 0, y: 0 },
            cloaked: false,
            angle: Math.random() * Math.PI * 2
        });
    }
}

// Spawn items
function spawnItems(rooms) {
    items = [];

    for (const room of rooms) {
        if (Math.random() < 0.5) {
            items.push({
                type: ['medkit', 'bullets', 'energy', 'cybermodule'][Math.floor(Math.random() * 4)],
                x: (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE,
                y: (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE
            });
        }
    }
}

// Initialize game
function initGame() {
    const rooms = generateMap();
    spawnEnemies(rooms);
    spawnItems(rooms);

    // Reset player
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.weapon = WEAPONS.pistol;
    player.ammo = 48;
    player.magazine = 12;
    player.reloading = false;
    player.attackCooldown = 0;
    player.dodgeCooldown = 0;

    // Place player in first room
    player.x = (rooms[0].x + rooms[0].w / 2) * TILE_SIZE;
    player.y = (rooms[0].y + rooms[0].h / 2) * TILE_SIZE;

    bullets = [];
    particles = [];

    stats = {
        enemiesKilled: 0,
        roomsExplored: 0,
        cyberModulesCollected: 0,
        damageDealt: 0,
        damageTaken: 0
    };

    mariaMessageTimer = 5000;
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Tab') e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// UI buttons
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('menu-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('gameover-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('victory-restart-btn').addEventListener('click', () => {
    document.getElementById('victory-overlay').classList.add('hidden');
    currentDeck++;
    if (currentDeck > 5) currentDeck = 1;
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

// Update visibility (proper vision cone)
function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x].visible = false;
        }
    }

    // Cast rays for vision cone
    const rayCount = 100;
    const halfAngle = VISION_ANGLE / 2;

    for (let i = 0; i < rayCount; i++) {
        const rayAngle = player.angle - halfAngle + (VISION_ANGLE * i / rayCount);
        castRay(rayAngle);
    }

    // Always see immediate surroundings
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const tx = px + dx;
            const ty = py + dy;
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                map[ty][tx].visible = true;
                map[ty][tx].explored = true;
            }
        }
    }
}

function castRay(angle) {
    const step = TILE_SIZE / 4;
    let dist = 0;
    const maxDist = player.flashlightOn ? VISION_RANGE : VISION_RANGE * 0.4;

    while (dist < maxDist) {
        const rx = player.x + Math.cos(angle) * dist;
        const ry = player.y + Math.sin(angle) * dist;

        const tx = Math.floor(rx / TILE_SIZE);
        const ty = Math.floor(ry / TILE_SIZE);

        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;

        map[ty][tx].visible = true;
        map[ty][tx].explored = true;

        if (map[ty][tx].type === 'wall') break;

        dist += step;
    }
}

// Check collision
function checkCollision(x, y, width, height) {
    const left = Math.floor((x - width / 2) / TILE_SIZE);
    const right = Math.floor((x + width / 2) / TILE_SIZE);
    const top = Math.floor((y - height / 2) / TILE_SIZE);
    const bottom = Math.floor((y + height / 2) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
            if (map[ty][tx].type === 'wall') return true;
        }
    }
    return false;
}

// Game update
function update(dt) {
    if (gameState !== 'playing' || gamePaused) return;

    // Energy regen
    player.energy = Math.min(player.maxEnergy, player.energy + 2 * dt / 1000);

    // Flashlight energy drain
    if (player.flashlightOn) {
        player.energy = Math.max(0, player.energy - 1 * dt / 1000);
        if (player.energy <= 0) player.flashlightOn = false;
    }

    // Movement
    let dx = 0, dy = 0;
    let sprinting = keys['shift'] && player.energy > 5;

    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;

        const speed = sprinting ? SPRINT_SPEED : PLAYER_SPEED;
        if (sprinting) player.energy -= 5 * dt / 1000;

        const newX = player.x + dx * speed * dt / 1000;
        const newY = player.y + dy * speed * dt / 1000;

        if (!checkCollision(newX, player.y, player.width, player.height)) player.x = newX;
        if (!checkCollision(player.x, newY, player.width, player.height)) player.y = newY;
    }

    // Aim at mouse
    const worldMouseX = mouseX + cameraX;
    const worldMouseY = mouseY + cameraY;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.dodgeCooldown > 0) player.dodgeCooldown -= dt;

    // Reload
    if (player.reloading) {
        player.reloadTime -= dt;
        if (player.reloadTime <= 0) {
            player.reloading = false;
            const needed = player.weapon.magazineSize - player.magazine;
            const toLoad = Math.min(needed, player.ammo);
            player.magazine += toLoad;
            player.ammo -= toLoad;
        }
    }

    // Manual reload
    if (keys['r'] && !player.reloading && player.magazine < player.weapon.magazineSize && player.ammo > 0) {
        player.reloading = true;
        player.reloadTime = player.weapon.reloadTime;
    }

    // Shoot
    if (mouseDown && player.attackCooldown <= 0 && !player.reloading) {
        shoot();
    }

    // Dodge
    if (keys[' '] && player.dodgeCooldown <= 0 && player.energy >= 15) {
        keys[' '] = false;
        player.energy -= 15;
        player.dodgeCooldown = 1000;
        // Quick dash in movement direction
        const dashDist = 80;
        if (dx !== 0 || dy !== 0) {
            const dashX = player.x + dx * dashDist;
            const dashY = player.y + dy * dashDist;
            if (!checkCollision(dashX, dashY, player.width, player.height)) {
                player.x = dashX;
                player.y = dashY;
            }
        }
    }

    // Flashlight toggle
    if (keys['f']) {
        keys['f'] = false;
        player.flashlightOn = !player.flashlightOn;
    }

    // Quick heal
    if (keys['q'] && player.health < player.maxHealth) {
        keys['q'] = false;
        // Use medkit from inventory
        const idx = player.inventory.findIndex(i => i === 'medkit');
        if (idx >= 0) {
            player.inventory.splice(idx, 1);
            player.health = Math.min(player.maxHealth, player.health + 50);
        }
    }

    // Update enemies
    updateEnemies(dt);

    // Update bullets
    updateBullets(dt);

    // Update particles
    particles = particles.filter(p => {
        p.life -= dt;
        p.x += p.vx * dt / 1000;
        p.y += p.vy * dt / 1000;
        return p.life > 0;
    });

    // Pickup items
    pickupItems();

    // Update visibility
    updateVisibility();

    // Update camera
    updateCamera();

    // Update HUD
    updateHUD();

    // M.A.R.I.A. messages
    if (mariaMessageTimer > 0) {
        mariaMessageTimer -= dt;
        if (mariaMessageTimer <= 0) {
            showMariaMessage(MARIA_MESSAGES[Math.floor(Math.random() * MARIA_MESSAGES.length)]);
            mariaMessageTimer = 30000 + Math.random() * 30000;
        }
    }

    // Check win condition (all enemies dead)
    if (enemies.length === 0) {
        victory();
    }
}

function shoot() {
    const weapon = player.weapon;

    if (weapon.type === 'ranged' && player.magazine <= 0) {
        // Auto reload
        if (player.ammo > 0) {
            player.reloading = true;
            player.reloadTime = weapon.reloadTime;
        }
        return;
    }

    player.attackCooldown = weapon.cooldown;

    if (weapon.type === 'melee') {
        // Melee attack
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < weapon.range + enemy.size / 2) {
                const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                let angleDiff = angleToEnemy - player.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < Math.PI / 2) {
                    const dmg = Math.max(1, weapon.damage - enemy.armor);
                    enemy.hp -= dmg;
                    stats.damageDealt += dmg;
                    spawnParticles(enemy.x, enemy.y, '#f00', 5);
                }
            }
        }
        spawnParticles(player.x + Math.cos(player.angle) * 30, player.y + Math.sin(player.angle) * 30, '#fff', 3);
    } else {
        // Ranged attack
        if (weapon.type === 'ranged') player.magazine--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = pellets > 1 ? (Math.random() - 0.5) * 0.3 : 0;
            bullets.push({
                x: player.x,
                y: player.y,
                angle: player.angle + spread,
                speed: 600,
                damage: weapon.damage,
                range: weapon.range,
                traveled: 0,
                fromPlayer: true
            });
        }

        spawnParticles(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, '#ff0', 3);
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        // Cooldown
        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

        // Cloaking
        if (enemy.cloaks) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            enemy.cloaked = dist > 150;
        }

        // Detection
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const canSee = dist < 300 && isInEnemyVision(enemy);

        if (canSee) {
            enemy.state = 'chase';
        } else if (enemy.state === 'chase' && dist > 400) {
            enemy.state = 'patrol';
        }

        // Movement
        if (enemy.state === 'chase') {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.angle = angle;

            if (enemy.ranged) {
                // Keep distance
                if (dist > 200) {
                    enemy.x += Math.cos(angle) * enemy.speed * dt / 1000;
                    enemy.y += Math.sin(angle) * enemy.speed * dt / 1000;
                } else if (dist < 100) {
                    enemy.x -= Math.cos(angle) * enemy.speed * dt / 1000;
                    enemy.y -= Math.sin(angle) * enemy.speed * dt / 1000;
                }
            } else {
                // Chase
                if (dist > enemy.range * 0.8) {
                    enemy.x += Math.cos(angle) * enemy.speed * dt / 1000;
                    enemy.y += Math.sin(angle) * enemy.speed * dt / 1000;
                }
            }

            // Attack
            if (enemy.attackCooldown <= 0) {
                if (enemy.ranged && dist < 300) {
                    // Ranged attack
                    bullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        angle: Math.atan2(player.y - enemy.y, player.x - enemy.x),
                        speed: 400,
                        damage: enemy.damage,
                        range: enemy.range,
                        traveled: 0,
                        fromPlayer: false
                    });
                    enemy.attackCooldown = 1500;
                } else if (!enemy.ranged && dist < enemy.range + player.width / 2) {
                    // Melee attack
                    player.health -= enemy.damage;
                    stats.damageTaken += enemy.damage;
                    enemy.attackCooldown = 1000;
                    spawnParticles(player.x, player.y, '#f00', 8);

                    if (player.health <= 0) {
                        gameOver();
                    }
                }
            }
        } else {
            // Patrol
            if (!enemy.patrolTarget || Math.hypot(enemy.patrolTarget.x - enemy.x, enemy.patrolTarget.y - enemy.y) < 20) {
                enemy.patrolTarget = {
                    x: enemy.x + (Math.random() - 0.5) * 200,
                    y: enemy.y + (Math.random() - 0.5) * 200
                };
            }
            const angle = Math.atan2(enemy.patrolTarget.y - enemy.y, enemy.patrolTarget.x - enemy.x);
            enemy.x += Math.cos(angle) * enemy.speed * 0.3 * dt / 1000;
            enemy.y += Math.sin(angle) * enemy.speed * 0.3 * dt / 1000;
            enemy.angle = angle;
        }
    }

    // Remove dead enemies
    enemies = enemies.filter(e => {
        if (e.hp <= 0) {
            stats.enemiesKilled++;
            // Drop item
            if (e.drops) {
                items.push({ type: e.drops, x: e.x, y: e.y });
            }
            items.push({ type: 'cybermodule', x: e.x + 10, y: e.y });
            spawnParticles(e.x, e.y, e.color, 15);
            return false;
        }
        return true;
    });
}

function isInEnemyVision(enemy) {
    const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    let angleDiff = angleToPlayer - enemy.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    return Math.abs(angleDiff) < Math.PI / 3; // 60 degree cone
}

function updateBullets(dt) {
    bullets = bullets.filter(bullet => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed * dt / 1000;
        bullet.y += Math.sin(bullet.angle) * bullet.speed * dt / 1000;
        bullet.traveled += bullet.speed * dt / 1000;

        // Wall collision
        const tx = Math.floor(bullet.x / TILE_SIZE);
        const ty = Math.floor(bullet.y / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT || map[ty][tx].type === 'wall') {
            spawnParticles(bullet.x, bullet.y, '#ff0', 3);
            return false;
        }

        // Range check
        if (bullet.traveled > bullet.range) return false;

        // Hit detection
        if (bullet.fromPlayer) {
            for (const enemy of enemies) {
                const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                if (dist < enemy.size / 2 + 5) {
                    const dmg = Math.max(1, bullet.damage * (1 + player.skills.firearms * 0.05) - enemy.armor);
                    enemy.hp -= dmg;
                    stats.damageDealt += dmg;
                    spawnParticles(bullet.x, bullet.y, '#f00', 5);
                    return false;
                }
            }
        } else {
            const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (dist < player.width / 2 + 5) {
                player.health -= bullet.damage;
                stats.damageTaken += bullet.damage;
                spawnParticles(player.x, player.y, '#f00', 8);
                if (player.health <= 0) gameOver();
                return false;
            }
        }

        return true;
    });
}

function pickupItems() {
    items = items.filter(item => {
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 25) {
            switch (item.type) {
                case 'medkit':
                    player.inventory.push('medkit');
                    break;
                case 'bullets':
                    player.ammo += 12;
                    break;
                case 'shells':
                    player.ammo += 6;
                    break;
                case 'energy':
                    player.energy = Math.min(player.maxEnergy, player.energy + 30);
                    break;
                case 'cybermodule':
                    player.cyberModules += 10;
                    stats.cyberModulesCollected += 10;
                    break;
            }
            return false;
        }
        return true;
    });
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 200 + Math.random() * 200,
            size: 2 + Math.random() * 3
        });
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    cameraX += (targetX - cameraX) * 0.1;
    cameraY += (targetY - cameraY) * 0.1;

    cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, cameraY));
}

function updateHUD() {
    document.getElementById('health-fill').style.width = `${(player.health / player.maxHealth) * 100}%`;
    document.getElementById('energy-fill').style.width = `${(player.energy / player.maxEnergy) * 100}%`;
    document.getElementById('weapon-display').textContent = player.weapon.name.toUpperCase();
    document.getElementById('ammo-display').textContent = `${player.magazine} / ${player.ammo}`;
    document.getElementById('deck-display').innerHTML = `DECK ${currentDeck}<br>${['ENGINEERING', 'OPERATIONS', 'RESEARCH', 'COMMAND', 'BRIDGE'][currentDeck - 1]}`;
    document.getElementById('skills-display').innerHTML = `FIREARMS: ${player.skills.firearms}<br>HACKING: ${player.skills.hacking}<br>STEALTH: ${player.skills.stealth}`;
}

function showMariaMessage(text) {
    const el = document.getElementById('maria-message');
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 4000);
}

function gameOver() {
    gameState = 'gameover';
    gamePaused = true;
    document.getElementById('fail-stats').innerHTML = `
        Enemies Killed: ${stats.enemiesKilled}<br>
        Damage Dealt: ${Math.floor(stats.damageDealt)}<br>
        Cyber Modules: ${stats.cyberModulesCollected}
    `;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

function victory() {
    gameState = 'victory';
    gamePaused = true;
    document.getElementById('victory-stats').innerHTML = `
        Deck ${currentDeck} Cleared!<br><br>
        Enemies Killed: ${stats.enemiesKilled}<br>
        Damage Dealt: ${Math.floor(stats.damageDealt)}<br>
        Cyber Modules: ${stats.cyberModulesCollected}
    `;
    document.getElementById('victory-overlay').classList.remove('hidden');
}

// Rendering
function render() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') return;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile.visible) {
                if (tile.type === 'wall') {
                    ctx.fillStyle = '#2a2a3a';
                } else {
                    ctx.fillStyle = '#1a1a2a';
                }
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Grid lines
                ctx.strokeStyle = '#252530';
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile.explored) {
                ctx.fillStyle = tile.type === 'wall' ? '#151520' : '#0a0a12';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw items
    for (const item of items) {
        const tx = Math.floor(item.x / TILE_SIZE);
        const ty = Math.floor(item.y / TILE_SIZE);
        if (map[ty] && map[ty][tx] && map[ty][tx].visible) {
            switch (item.type) {
                case 'medkit': ctx.fillStyle = '#f44'; break;
                case 'bullets': ctx.fillStyle = '#ff0'; break;
                case 'shells': ctx.fillStyle = '#fa0'; break;
                case 'energy': ctx.fillStyle = '#44f'; break;
                case 'cybermodule': ctx.fillStyle = '#0ff'; break;
                default: ctx.fillStyle = '#fff';
            }
            ctx.beginPath();
            ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw enemies
    for (const enemy of enemies) {
        const tx = Math.floor(enemy.x / TILE_SIZE);
        const ty = Math.floor(enemy.y / TILE_SIZE);
        if (map[ty] && map[ty][tx] && map[ty][tx].visible && !enemy.cloaked) {
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Direction indicator
            ctx.strokeStyle = '#f00';
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(enemy.x + Math.cos(enemy.angle) * enemy.size, enemy.y + Math.sin(enemy.angle) * enemy.size);
            ctx.stroke();

            // HP bar
            const hpPercent = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#f00';
            ctx.fillRect(enemy.x - 12, enemy.y - enemy.size / 2 - 8, 24 * hpPercent, 4);
        }
    }

    // Draw bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.fromPlayer ? '#0ff' : '#f00';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 400;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw player
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Player direction
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 25, player.y + Math.sin(player.angle) * 25);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Vision cone (debug overlay)
    if (player.flashlightOn) {
        ctx.fillStyle = 'rgba(255, 255, 200, 0.05)';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, VISION_RANGE, player.angle - VISION_ANGLE / 2, player.angle + VISION_ANGLE / 2);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // Render minimap
    renderMinimap();
}

function renderMinimap() {
    minimapCtx.fillStyle = 'rgba(0, 10, 20, 0.9)';
    minimapCtx.fillRect(0, 0, 120, 120);

    const scale = 3;
    const offsetX = 60 - (player.x / TILE_SIZE) * scale;
    const offsetY = 60 - (player.y / TILE_SIZE) * scale;

    // Draw explored tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x].explored) {
                minimapCtx.fillStyle = map[y][x].type === 'wall' ? '#446' : '#224';
                minimapCtx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    }

    // Draw enemies (if visible)
    for (const enemy of enemies) {
        const tx = Math.floor(enemy.x / TILE_SIZE);
        const ty = Math.floor(enemy.y / TILE_SIZE);
        if (map[ty] && map[ty][tx] && map[ty][tx].visible) {
            minimapCtx.fillStyle = '#f00';
            minimapCtx.fillRect(offsetX + (enemy.x / TILE_SIZE) * scale - 1, offsetY + (enemy.y / TILE_SIZE) * scale - 1, 3, 3);
        }
    }

    // Draw player
    minimapCtx.fillStyle = '#0ff';
    minimapCtx.fillRect(58, 58, 4, 4);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!gamePaused) {
        update(dt);
    }
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// V2 Harness - Time-Accelerated Execution
let totalGameTime = 0;
let debugLogs = [];

window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: async function({ keys: keyList = [], duration = 500, screenshot = false, click = null, mouse = null }) {
        const startReal = performance.now();
        debugLogs = [];

        // Set keys
        if (keyList) {
            for (const key of keyList) {
                keys[key.toLowerCase()] = true;
            }
        }

        // Handle mouse/click (in screen coords)
        if (click) {
            mouseX = click.x;
            mouseY = click.y;
            mouseDown = true;
        }
        if (mouse) {
            mouseX = mouse.x;
            mouseY = mouse.y;
        }

        // Run physics ticks (TIME-ACCELERATED)
        const dt = 16;
        const ticks = Math.ceil(duration / dt);
        const startHP = player ? player.health : 0;
        const startEnemies = enemies.length;

        for (let i = 0; i < ticks; i++) {
            if (gameState === 'gameover' || gameState === 'victory') {
                debugLogs.push(`[${totalGameTime}ms] Game ended: ${gameState}`);
                break;
            }

            if (gameState === 'playing') {
                update(dt);
                totalGameTime += dt;
            }
        }

        // Track events
        if (player && player.health < startHP) {
            debugLogs.push(`[${totalGameTime}ms] Took damage: ${startHP} -> ${player.health}`);
        }
        const endEnemies = enemies.length;
        if (endEnemies < startEnemies) {
            debugLogs.push(`[${totalGameTime}ms] Killed ${startEnemies - endEnemies} enemies`);
        }

        // Clear inputs
        if (keyList) {
            for (const key of keyList) {
                keys[key.toLowerCase()] = false;
            }
        }
        mouseDown = false;

        // Render
        render();

        let screenshotData = null;
        if (screenshot) {
            screenshotData = canvas.toDataURL('image/png');
        }

        return {
            screenshot: screenshotData,
            logs: [...debugLogs],
            state: window.harness.getState(),
            realTime: performance.now() - startReal
        };
    },

    getState: () => ({
        gameState,
        currentDeck,
        player: {
            x: player.x,
            y: player.y,
            health: player.health,
            maxHealth: player.maxHealth,
            energy: player.energy,
            ammo: player.ammo,
            magazine: player.magazine,
            weapon: player.weapon.name
        },
        enemies: enemies.map(e => ({
            type: e.type,
            x: e.x,
            y: e.y,
            hp: e.hp,
            visible: map[Math.floor(e.y / TILE_SIZE)]?.[Math.floor(e.x / TILE_SIZE)]?.visible || false
        })),
        items: items.map(i => ({ type: i.type, x: i.x, y: i.y })),
        stats,
        camera: { x: cameraX, y: cameraY }
    }),

    getPhase: () => gameState,

    debug: {
        setHealth: (hp) => { player.health = hp; },
        forceStart: () => {
            document.getElementById('menu-overlay').classList.add('hidden');
            document.getElementById('gameover-overlay').classList.add('hidden');
            document.getElementById('victory-overlay').classList.add('hidden');
            gameState = 'playing';
            gamePaused = false;
            initGame();
        },
        clearEnemies: () => { enemies = []; },
        giveAmmo: (amount) => { player.ammo += amount; }
    },

    version: '2.0'
};
