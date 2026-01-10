// DERELICT - Survival Horror Clone
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Colors matching reference style
const COLORS = {
    BG: '#0a0808',
    FLOOR: '#2a2a2a',
    FLOOR_ALT: '#252525',
    WALL: '#1a1a1a',
    WALL_LIGHT: '#3a3a3a',
    DOOR: '#4a4040',
    PLAYER: '#6a8a8a',
    CRAWLER: '#5a4a3a',
    SHAMBLER: '#4a5a4a',
    BLOOD: '#6a2020',
    O2_ITEM: '#4080cc',
    MEDKIT: '#40aa60',
    HAZARD: '#aa4040',
    TEXT: '#cccccc',
    O2_BAR: '#4080cc',
    HP_BAR: '#cc4040',
    WARNING: '#cc6040'
};

// Game state
const game = {
    state: 'playing',
    sector: 1,
    time: 0,
    integrity: 100,
    messages: [],
    startTime: Date.now()
};

// Stats tracking
const stats = {
    killCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    critCount: 0,
    itemsPickedUp: 0,
    attacksMade: 0,
    maxKillStreak: 0
};

// Kill streak
let killStreak = 0;
let killStreakTimer = 0;

// Visual effects
let damageFlashAlpha = 0;
let lowHealthPulse = 0;
let screenShake = { x: 0, y: 0, intensity: 0 };
let floatingTexts = [];
let particles = [];

// Debug mode
let debugMode = false;

// Player
const player = {
    x: 400,
    y: 400,
    angle: 0,
    speed: 120,
    runSpeed: 200,
    radius: 12,
    hp: 100,
    maxHp: 100,
    o2: 100,
    maxO2: 100,
    flashlightOn: true,
    flashlightBattery: 60,
    maxFlashlightBattery: 60,
    isRunning: false,
    weapon: 'pipe',
    lastAttack: 0,
    attackCooldown: 600,
    inventory: []
};

// Weapons
const weapons = {
    pipe: { damage: 20, range: 45, speed: 1.0, durability: 15 },
    wrench: { damage: 25, range: 50, speed: 0.8, durability: 25 }
};

// Enemies
let enemies = [];
const enemyTypes = {
    crawler: { hp: 30, damage: 15, speed: 80, range: 250, color: COLORS.CRAWLER, size: 14 },
    shambler: { hp: 60, damage: 25, speed: 50, range: 200, color: COLORS.SHAMBLER, size: 16 }
};

// Map and objects
let map = [];
let doors = [];
let items = [];
let bloodStains = [];
let corpses = [];

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Camera
const camera = { x: 0, y: 0 };

// O2 drain rates (per second)
const O2_DRAIN = {
    idle: 0.5,
    walking: 0.67,
    running: 1.33,
    combat: 2
};

// Initialize
function init() {
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnItems();
    setupInput();
    addMessage("SYSTEM: Wake up. Your oxygen is depleting.");
    addMessage("SYSTEM: Find the escape pod. Survive.");
    requestAnimationFrame(gameLoop);
}

function generateMap() {
    // Initialize with walls
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = 1;
        }
    }

    // Generate rooms
    const rooms = [];
    const numRooms = 12 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numRooms; i++) {
        const w = 4 + Math.floor(Math.random() * 5);
        const h = 4 + Math.floor(Math.random() * 4);
        const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
        const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

        // Carve room
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                map[ry][rx] = 0;
            }
        }

        rooms.push({ x: x + w/2, y: y + h/2, w, h });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const prev = rooms[i - 1];
        const curr = rooms[i];

        let cx = Math.floor(prev.x);
        let cy = Math.floor(prev.y);
        const tx = Math.floor(curr.x);
        const ty = Math.floor(curr.y);

        while (cx !== tx) {
            if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) {
                map[cy][cx] = 0;
            }
            cx += cx < tx ? 1 : -1;
        }
        while (cy !== ty) {
            if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) {
                map[cy][cx] = 0;
            }
            cy += cy < ty ? 1 : -1;
        }
    }

    // Add doors
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            if (map[y][x] === 0) {
                const horizontal = map[y][x-1] === 1 && map[y][x+1] === 1;
                const vertical = map[y-1][x] === 1 && map[y+1][x] === 1;

                if ((horizontal || vertical) && Math.random() < 0.1) {
                    doors.push({
                        x: x * TILE_SIZE + TILE_SIZE/2,
                        y: y * TILE_SIZE + TILE_SIZE/2,
                        open: false,
                        locked: Math.random() < 0.2,
                        tx: x,
                        ty: y
                    });
                }
            }
        }
    }

    // Mark exit
    const lastRoom = rooms[rooms.length - 1];
    game.exitX = Math.floor(lastRoom.x) * TILE_SIZE;
    game.exitY = Math.floor(lastRoom.y) * TILE_SIZE;

    // Add blood stains for atmosphere
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x] === 0) {
            bloodStains.push({
                x: x * TILE_SIZE + Math.random() * TILE_SIZE,
                y: y * TILE_SIZE + Math.random() * TILE_SIZE,
                size: 5 + Math.random() * 15
            });
        }
    }
}

function spawnPlayer() {
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
    const count = 6 + game.sector * 2;

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        while (attempts < 100) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);

            if (map[y][x] === 0) {
                const dist = Math.hypot(x * TILE_SIZE - player.x, y * TILE_SIZE - player.y);
                if (dist > 250) {
                    const type = Math.random() < 0.7 ? 'crawler' : 'shambler';
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
                        state: 'patrol',
                        angle: Math.random() * Math.PI * 2,
                        alertTimer: 0,
                        lastAttack: 0,
                        patrolTarget: null
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
    const count = 8 + game.sector;

    const itemTypes = [
        { type: 'o2_small', name: 'O2 Canister (S)', color: COLORS.O2_BAR, o2: 25 },
        { type: 'o2_large', name: 'O2 Canister (L)', color: COLORS.O2_BAR, o2: 50 },
        { type: 'medkit_small', name: 'Medkit (S)', color: COLORS.MEDKIT, hp: 30 },
        { type: 'medkit_large', name: 'Medkit (L)', color: COLORS.MEDKIT, hp: 60 }
    ];

    for (let i = 0; i < count; i++) {
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

function setupInput() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'f') player.flashlightOn = !player.flashlightOn;
        if (e.key === 'e') interact();
        if (e.key === 'q') debugMode = !debugMode;
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
            attack();
        }
    });

    canvas.addEventListener('mouseup', () => mouse.down = false);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

function addMessage(text) {
    game.messages.unshift({ text, time: game.time });
    if (game.messages.length > 4) game.messages.pop();
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
    updateVisualEffects(delta);
    updateFloatingTexts(delta);
    updateParticles(delta);

    // Ship integrity decay
    game.integrity = Math.max(0, game.integrity - 0.02 * delta);
    if (game.integrity <= 0) {
        game.state = 'gameover';
        addMessage("The ship tears itself apart around you.");
    }

    // Victory check
    const distToExit = Math.hypot(player.x - game.exitX, player.y - game.exitY);
    if (distToExit < 40) {
        game.state = 'victory';
        addMessage("ESCAPED! You made it to the escape pod.");
    }

    // Death checks
    if (player.o2 <= 0) {
        game.state = 'gameover';
        addMessage("Your lungs burned for oxygen that never came.");
    }
    if (player.hp <= 0) {
        game.state = 'gameover';
        addMessage("Your body joins the ship's other victims.");
    }
}

function updatePlayer(delta) {
    // Aim angle
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Movement
    player.isRunning = keys['shift'];
    const speed = player.isRunning ? player.runSpeed : player.speed;

    let dx = 0, dy = 0;
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;

    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving) {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        const newX = player.x + dx * speed * delta;
        const newY = player.y + dy * speed * delta;

        if (!checkCollision(newX, player.y, player.radius)) player.x = newX;
        if (!checkCollision(player.x, newY, player.radius)) player.y = newY;
    }

    // O2 drain
    let drainRate = O2_DRAIN.idle;
    if (isMoving) {
        drainRate = player.isRunning ? O2_DRAIN.running : O2_DRAIN.walking;
    }
    player.o2 = Math.max(0, player.o2 - drainRate * delta);

    // Flashlight battery
    if (player.flashlightOn) {
        player.flashlightBattery = Math.max(0, player.flashlightBattery - delta);
        if (player.flashlightBattery <= 0) {
            player.flashlightOn = false;
        }
    } else {
        player.flashlightBattery = Math.min(player.maxFlashlightBattery, player.flashlightBattery + 0.5 * delta);
    }

    // Camera
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

    for (const door of doors) {
        if (!door.open) {
            const dist = Math.hypot(x - door.x, y - door.y);
            if (dist < radius + 16) return true;
        }
    }

    return false;
}

function attack() {
    const now = performance.now();
    if (now - player.lastAttack < player.attackCooldown) return;

    player.lastAttack = now;
    player.o2 = Math.max(0, player.o2 - 2); // Combat O2 cost
    stats.attacksMade++;

    const weapon = weapons[player.weapon];
    const attackX = player.x + Math.cos(player.angle) * weapon.range;
    const attackY = player.y + Math.sin(player.angle) * weapon.range;

    // Attack visual effect
    particles.push({
        x: attackX,
        y: attackY,
        vx: 0,
        vy: 0,
        life: 0.1,
        maxLife: 0.1,
        color: '#ffffff',
        size: 15
    });

    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.hypot(attackX - enemy.x, attackY - enemy.y);
        if (dist < enemy.size + 20) {
            damageEnemy(enemy, weapon.damage);
        }
    }
}

function damageEnemy(enemy, damage) {
    // Critical hit system (15% chance, 2x damage)
    const isCrit = Math.random() < 0.15;
    if (isCrit) {
        damage *= 2;
        stats.critCount++;
    }

    enemy.hp -= damage;
    enemy.state = 'alert';
    enemy.alertTimer = 10;

    stats.totalDamageDealt += damage;

    // Floating damage number
    createFloatingText(
        enemy.x, enemy.y - 20,
        damage.toString() + (isCrit ? '!' : ''),
        isCrit ? '#ffff00' : '#ff4444',
        isCrit ? 18 : 14
    );

    // Screen shake
    triggerScreenShake(isCrit ? 6 : 3);

    // Blood splash (more for crits)
    const bloodCount = isCrit ? 6 : 3;
    for (let i = 0; i < bloodCount; i++) {
        bloodStains.push({
            x: enemy.x + (Math.random() - 0.5) * 30,
            y: enemy.y + (Math.random() - 0.5) * 30,
            size: 3 + Math.random() * 8
        });
        // Blood particles
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.5,
            maxLife: 0.5,
            color: COLORS.BLOOD,
            size: 4
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
    killStreakTimer = 3;
    if (killStreak > stats.maxKillStreak) {
        stats.maxKillStreak = killStreak;
    }

    // Kill streak messages
    if (killStreak >= 3) {
        const streakMessages = { 3: 'TRIPLE KILL!', 4: 'QUAD KILL!', 5: 'RAMPAGE!', 6: 'MASSACRE!' };
        const msg = streakMessages[Math.min(killStreak, 6)] || 'UNSTOPPABLE!';
        createFloatingText(player.x, player.y - 50, msg, '#ffaa00', 20);
    }

    // Death burst particles
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 80,
            life: 0.6,
            maxLife: 0.6,
            color: enemy.color,
            size: 5
        });
    }

    triggerScreenShake(8);
    corpses.push({ x: enemy.x, y: enemy.y, type: enemy.type, color: enemy.color });
    addMessage("Enemy killed." + (wasCrit ? " CRITICAL!" : ""));
}

function interact() {
    // Doors
    for (const door of doors) {
        const dist = Math.hypot(player.x - door.x, player.y - door.y);
        if (dist < 50) {
            if (door.locked) {
                addMessage("Door is locked.");
            } else {
                door.open = !door.open;
            }
            return;
        }
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < 40) {
            pickupItem(item, i);
            return;
        }
    }
}

function pickupItem(item, index) {
    stats.itemsPickedUp++;

    if (item.o2) {
        player.o2 = Math.min(player.maxO2, player.o2 + item.o2);
        addMessage("Used: " + item.name + " (+" + item.o2 + " O2)");
        createFloatingText(item.x, item.y - 20, '+' + item.o2 + ' O2', '#4080cc', 14);
        // O2 particles (blue)
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: player.x + Math.cos(angle) * 20,
                y: player.y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * 30,
                vy: -40 - Math.random() * 30,
                life: 0.6,
                maxLife: 0.6,
                color: '#4080cc',
                size: 4
            });
        }
    } else if (item.hp) {
        player.hp = Math.min(player.maxHp, player.hp + item.hp);
        addMessage("Used: " + item.name + " (+" + item.hp + " HP)");
        createFloatingText(item.x, item.y - 20, '+' + item.hp + ' HP', '#40aa60', 14);
        // Healing particles (green)
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: player.x + Math.cos(angle) * 20,
                y: player.y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * 30,
                vy: -40 - Math.random() * 30,
                life: 0.6,
                maxLife: 0.6,
                color: '#40aa60',
                size: 4
            });
        }
    }

    // Pickup sparkle
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        particles.push({
            x: item.x,
            y: item.y,
            vx: Math.cos(angle) * 50,
            vy: Math.sin(angle) * 50,
            life: 0.4,
            maxLife: 0.4,
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

        // Check if enemy can see player (simplified)
        const canSee = distToPlayer < enemy.range && !player.isRunning ? true : distToPlayer < enemy.range * 1.5;

        switch (enemy.state) {
            case 'patrol':
                if (canSee && distToPlayer < enemy.range) {
                    enemy.state = 'chase';
                    addMessage("Something noticed you...");
                } else {
                    if (!enemy.patrolTarget || Math.random() < 0.005) {
                        enemy.patrolTarget = {
                            x: enemy.x + (Math.random() - 0.5) * 150,
                            y: enemy.y + (Math.random() - 0.5) * 150
                        };
                    }
                    moveEnemy(enemy, enemy.patrolTarget.x, enemy.patrolTarget.y, delta * 0.5);
                }
                break;

            case 'chase':
            case 'alert':
                if (distToPlayer < 40) {
                    // Attack
                    const now = performance.now();
                    if (now - enemy.lastAttack > 1200) {
                        enemy.lastAttack = now;
                        damagePlayer(enemy.damage);
                        addMessage("Attacked! -" + enemy.damage + " HP");
                    }
                } else if (distToPlayer < enemy.range * 1.5) {
                    moveEnemy(enemy, player.x, player.y, delta);
                } else {
                    enemy.alertTimer -= delta;
                    if (enemy.alertTimer <= 0) {
                        enemy.state = 'patrol';
                    }
                }
                break;
        }
    }

    // Remove dead enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
            enemies.splice(i, 1);
        }
    }
}

function moveEnemy(enemy, targetX, targetY, delta) {
    const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    enemy.angle = angle;

    const newX = enemy.x + Math.cos(angle) * enemy.speed * delta;
    const newY = enemy.y + Math.sin(angle) * enemy.speed * delta;

    if (!checkCollision(newX, enemy.y, enemy.size)) enemy.x = newX;
    if (!checkCollision(enemy.x, newY, enemy.size)) enemy.y = newY;
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
    for (let i = 0; i < 4; i++) {
        bloodStains.push({
            x: player.x + (Math.random() - 0.5) * 30,
            y: player.y + (Math.random() - 0.5) * 30,
            size: 4 + Math.random() * 8
        });
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.4,
            maxLife: 0.4,
            color: COLORS.BLOOD,
            size: 5
        });
    }

    // Floating damage text
    createFloatingText(player.x, player.y - 30, '-' + damage, '#ff4444', 14);
}

function createFloatingText(x, y, text, color, size) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        life: 1.0,
        maxLife: 1.0,
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

    // Kill streak timer
    if (killStreakTimer > 0) {
        killStreakTimer -= delta;
        if (killStreakTimer <= 0) {
            killStreak = 0;
        }
    }
}

function updateFloatingTexts(delta) {
    floatingTexts = floatingTexts.filter(ft => {
        ft.life -= delta;
        ft.y += ft.vy * delta;
        return ft.life > 0;
    });
}

function updateParticles(delta) {
    particles = particles.filter(p => {
        p.life -= delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        return p.life > 0;
    });
}

function render() {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    // Apply screen shake
    ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

    // Render map
    renderMap();

    // Blood stains
    ctx.fillStyle = COLORS.BLOOD;
    for (const blood of bloodStains) {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(blood.x, blood.y, blood.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Items
    for (const item of items) {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x - 8, item.y - 8, 16, 16);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(item.x - 8, item.y - 8, 16, 16);
    }

    // Doors
    for (const door of doors) {
        if (!door.open) {
            ctx.fillStyle = door.locked ? '#6a4040' : COLORS.DOOR;
            ctx.fillRect(door.x - 16, door.y - 16, 32, 32);
        }
    }

    // Corpses
    for (const corpse of corpses) {
        ctx.fillStyle = corpse.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(corpse.x, corpse.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Enemies (only render if in vision cone)
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (isInVisionCone(enemy.x, enemy.y)) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.rotate(enemy.angle);

            ctx.fillStyle = enemy.color;
            if (enemy.type === 'crawler') {
                // Low crawler
                ctx.fillRect(-enemy.size, -enemy.size * 0.5, enemy.size * 2, enemy.size);
            } else {
                // Shambler
                ctx.fillRect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2);
            }

            ctx.restore();

            // Health bar
            if (enemy.hp < enemy.maxHp) {
                const barW = enemy.size * 2;
                ctx.fillStyle = '#400000';
                ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size - 8, barW, 4);
                ctx.fillStyle = COLORS.HP_BAR;
                ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size - 8, barW * (enemy.hp / enemy.maxHp), 4);
            }
        }
    }

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(-10, -8, 20, 16);

    // Visor
    ctx.fillStyle = '#40aa60';
    ctx.fillRect(5, -3, 6, 6);

    // Weapon
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(10, -2, 10, 4);

    ctx.restore();

    // Exit marker
    ctx.fillStyle = '#40aa40';
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(game.time * 3);
    ctx.fillRect(game.exitX - 20, game.exitY - 20, 40, 40);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#60cc60';
    ctx.font = '10px monospace';
    ctx.fillText('ESCAPE', game.exitX - 20, game.exitY + 4);

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating texts (world space)
    for (const ft of floatingTexts) {
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    // Vision cone / darkness
    renderLighting();

    ctx.restore();

    // UI
    renderUI();
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
                ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.FLOOR : COLORS.FLOOR_ALT;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Grid pattern
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.WALL_LIGHT;
                ctx.fillRect(px, py, TILE_SIZE, 3);
                ctx.fillRect(px, py, 3, TILE_SIZE);
            }
        }
    }
}

function isInVisionCone(x, y) {
    const dist = Math.hypot(x - player.x, y - player.y);
    const angle = Math.atan2(y - player.y, x - player.x);
    const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

    const maxRange = player.flashlightOn ? 500 : 120;
    const coneAngle = Math.PI / 4; // 45 degrees half-angle (90 total)

    return dist < maxRange && angleDiff < coneAngle;
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function renderLighting() {
    // Reduced darkness overlay for better visibility
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(camera.x, camera.y, GAME_WIDTH, GAME_HEIGHT);

    // Cut out vision cone
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    const coneLength = player.flashlightOn ? 500 : 120;
    const coneAngle = Math.PI / 3; // Wider cone (60 degrees)

    // Create cone gradient
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, coneLength, -coneAngle, coneAngle);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coneLength);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();

    // Larger ambient light around player
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const ambientRadius = player.flashlightOn ? 150 : 100;
    const ambientGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, ambientRadius);
    ambientGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    ambientGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    ambientGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = ambientGradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, ambientRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function renderUI() {
    // O2 Bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 15, 204, 24);
    ctx.fillStyle = COLORS.O2_BAR;
    ctx.fillRect(17, 17, 200 * (player.o2 / player.maxO2), 20);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('O2: ' + Math.floor(player.o2) + '/' + player.maxO2, 20, 32);

    // HP Bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 45, 204, 24);
    ctx.fillStyle = COLORS.HP_BAR;
    ctx.fillRect(17, 47, 200 * (player.hp / player.maxHp), 20);
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText('HP: ' + Math.floor(player.hp) + '/' + player.maxHp, 20, 62);

    // Flashlight battery
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, 75, 104, 14);
    ctx.fillStyle = player.flashlightOn ? '#cccc40' : '#606060';
    ctx.fillRect(17, 77, 100 * (player.flashlightBattery / player.maxFlashlightBattery), 10);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '10px monospace';
    ctx.fillText('LIGHT: ' + (player.flashlightOn ? 'ON' : 'OFF'), 20, 86);

    // Ship integrity
    ctx.fillStyle = '#000000';
    ctx.fillRect(GAME_WIDTH - 220, 15, 204, 24);
    ctx.fillStyle = game.integrity < 30 ? COLORS.WARNING : '#4a6a8a';
    ctx.fillRect(GAME_WIDTH - 218, 17, 200 * (game.integrity / 100), 20);
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('INTEGRITY: ' + Math.floor(game.integrity) + '%', GAME_WIDTH - 215, 32);

    // Sector
    ctx.fillText('SECTOR: ' + game.sector, GAME_WIDTH - 215, 55);

    // Messages
    ctx.font = '12px monospace';
    for (let i = 0; i < game.messages.length; i++) {
        const msg = game.messages[i];
        const alpha = Math.max(0, 1 - (game.time - msg.time) / 8);
        ctx.fillStyle = `rgba(100, 180, 100, ${alpha})`;
        ctx.fillText(msg.text, 20, GAME_HEIGHT - 80 + i * 16);
    }

    // Low O2 warning
    if (player.o2 < 30) {
        ctx.fillStyle = `rgba(200, 60, 60, ${0.5 + 0.3 * Math.sin(game.time * 5)})`;
        ctx.font = '20px monospace';
        ctx.fillText('LOW OXYGEN', GAME_WIDTH / 2 - 70, GAME_HEIGHT - 30);
    }

    // Crosshair
    ctx.strokeStyle = '#80ff80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 8, mouse.y);
    ctx.lineTo(mouse.x - 3, mouse.y);
    ctx.moveTo(mouse.x + 3, mouse.y);
    ctx.lineTo(mouse.x + 8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 8);
    ctx.lineTo(mouse.x, mouse.y - 3);
    ctx.moveTo(mouse.x, mouse.y + 3);
    ctx.lineTo(mouse.x, mouse.y + 8);
    ctx.stroke();

    // Kill streak display
    if (killStreak >= 2) {
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.textAlign = 'center';
        ctx.fillText(`${killStreak}x STREAK`, GAME_WIDTH / 2, 80);
        ctx.textAlign = 'left';
    }

    // Damage flash overlay
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(200, 0, 0, ${damageFlashAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Low health vignette
    if (player.hp < 30) {
        const pulseAlpha = 0.15 + Math.sin(lowHealthPulse) * 0.1;
        ctx.fillStyle = `rgba(100, 0, 0, ${pulseAlpha})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Debug overlay
    if (debugMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(GAME_WIDTH - 200, 80, 190, 220);
        ctx.fillStyle = '#00ff00';
        ctx.font = '11px monospace';
        const lines = [
            `KILLS: ${stats.killCount}`,
            `DMG DEALT: ${stats.totalDamageDealt}`,
            `DMG TAKEN: ${stats.totalDamageTaken}`,
            `CRITS: ${stats.critCount}`,
            `ITEMS: ${stats.itemsPickedUp}`,
            `ATTACKS: ${stats.attacksMade}`,
            `MAX STREAK: ${stats.maxKillStreak}`,
            `STREAK: ${killStreak}`,
            `---`,
            `HP: ${Math.floor(player.hp)}`,
            `O2: ${Math.floor(player.o2)}`,
            `INTEGRITY: ${Math.floor(game.integrity)}%`,
            `ENEMIES: ${enemies.filter(e => e.hp > 0).length}`,
            `TIME: ${Math.floor(game.time)}s`
        ];
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], GAME_WIDTH - 190, 95 + i * 14);
        }
    }

    // Game over / Victory (Enhanced)
    if (game.state === 'gameover') {
        const timeSurvived = Math.floor((Date.now() - game.startTime) / 1000);

        // Performance rating
        let rating = 'LOST';
        let ratingColor = COLORS.HP_BAR;
        if (stats.killCount >= 2 && timeSurvived >= 30) { rating = 'SURVIVOR'; ratingColor = '#aaaa40'; }
        if (stats.killCount >= 4 && stats.totalDamageDealt > 100) { rating = 'FIGHTER'; ratingColor = '#40aa60'; }
        if (stats.killCount >= 6 && stats.critCount >= 2) { rating = 'WARRIOR'; ratingColor = '#40aaff'; }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = COLORS.HP_BAR;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH/2, 100);

        ctx.fillStyle = ratingColor;
        ctx.font = '28px monospace';
        ctx.fillText(`RATING: ${rating}`, GAME_WIDTH/2, 150);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const statsLines = [
            `TIME SURVIVED: ${Math.floor(timeSurvived / 60)}:${(timeSurvived % 60).toString().padStart(2, '0')}`,
            ``,
            `KILLS: ${stats.killCount}`,
            `DAMAGE DEALT: ${stats.totalDamageDealt}`,
            `DAMAGE TAKEN: ${stats.totalDamageTaken}`,
            `CRITICAL HITS: ${stats.critCount}`,
            `MAX KILL STREAK: ${stats.maxKillStreak}`,
            ``,
            `ATTACKS MADE: ${stats.attacksMade}`,
            `ITEMS USED: ${stats.itemsPickedUp}`,
            ``,
            `"${game.messages[0]?.text || 'The darkness consumed you.'}"`
        ];
        for (let i = 0; i < statsLines.length; i++) {
            ctx.fillText(statsLines[i], GAME_WIDTH/2, 200 + i * 24);
        }
        ctx.textAlign = 'left';

    } else if (game.state === 'victory') {
        const timeElapsed = Math.floor((Date.now() - game.startTime) / 1000);

        // Efficiency rating
        let rating = 'D';
        let ratingColor = '#cc4040';
        if (stats.killCount >= 3 && timeElapsed < 300) { rating = 'C'; ratingColor = '#aaaa40'; }
        if (stats.killCount >= 5 && timeElapsed < 180) { rating = 'B'; ratingColor = '#40aa60'; }
        if (stats.killCount >= 7 && timeElapsed < 120 && stats.critCount >= 3) { rating = 'A'; ratingColor = '#40aaff'; }
        if (stats.killCount >= 8 && timeElapsed < 90 && stats.critCount >= 5) { rating = 'S'; ratingColor = '#ffaa00'; }

        ctx.fillStyle = 'rgba(0, 30, 0, 0.9)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = COLORS.MEDKIT;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPED!', GAME_WIDTH/2, 100);

        ctx.fillStyle = ratingColor;
        ctx.font = '36px monospace';
        ctx.fillText(`EFFICIENCY: ${rating}`, GAME_WIDTH/2, 155);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const statsLines = [
            `TIME ELAPSED: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
            ``,
            `KILLS: ${stats.killCount}`,
            `DAMAGE DEALT: ${stats.totalDamageDealt}`,
            `DAMAGE TAKEN: ${stats.totalDamageTaken}`,
            `CRITICAL HITS: ${stats.critCount}`,
            `MAX KILL STREAK: ${stats.maxKillStreak}`,
            ``,
            `ATTACKS MADE: ${stats.attacksMade}`,
            `ITEMS USED: ${stats.itemsPickedUp}`,
            `INTEGRITY REMAINING: ${Math.floor(game.integrity)}%`,
            ``,
            `"You survived the derelict ship."`
        ];
        for (let i = 0; i < statsLines.length; i++) {
            ctx.fillText(statsLines[i], GAME_WIDTH/2, 200 + i * 24);
        }
        ctx.textAlign = 'left';
    }
}

// Start
init();
