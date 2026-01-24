// Bullets of the Damned - Enter the Gungeon Clone
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants (smaller tiles per feedback)
const TILE_SIZE = 24; // 50% smaller than typical 48px
const PLAYER_SIZE = 20;

// Game state
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    BOSS: 'boss',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    FLOOR_TRANSITION: 'floor_transition'
};

// Floor definitions
const FLOORS = [
    { name: 'Keep of the Lead Lord', rooms: 7, enemyTypes: ['bulletKin', 'bandanaBullet', 'shotgunKin'], bossType: 'bulletKing', theme: '#3a3a4a' },
    { name: 'Gungeon Proper', rooms: 9, enemyTypes: ['veteranBullet', 'shotgunKin', 'gunNut'], bossType: 'beholster', theme: '#2a3a4a' },
    { name: 'The Forge', rooms: 8, enemyTypes: ['forgeBullet', 'ironMaiden', 'gunCultist'], bossType: 'highDragun', theme: '#4a2a2a' }
];

// Weapon definitions
const WEAPONS = {
    marineSidearm: { name: 'Marine Sidearm', damage: 8, fireRate: 0.25, magSize: 15, reloadTime: 1.0, spread: 0.05, ammo: Infinity, auto: false, color: '#cccccc' },
    m1911: { name: 'M1911', damage: 10, fireRate: 0.2, magSize: 10, reloadTime: 1.2, spread: 0.03, ammo: 80, auto: false, color: '#888888' },
    shotgun: { name: 'Shotgun', damage: 5, fireRate: 0.7, magSize: 8, reloadTime: 1.8, spread: 0.2, pellets: 6, ammo: 50, auto: false, color: '#aa7744' },
    ak47: { name: 'AK-47', damage: 6, fireRate: 0.1, magSize: 30, reloadTime: 2.0, spread: 0.1, ammo: 200, auto: true, color: '#665544' },
    demonHead: { name: 'Demon Head', damage: 20, fireRate: 0.8, magSize: 6, reloadTime: 2.5, spread: 0.05, ammo: 40, auto: false, homing: true, color: '#aa2222' },
    railgun: { name: 'Railgun', damage: 60, fireRate: 1.5, magSize: 3, reloadTime: 3.0, spread: 0, ammo: 15, auto: false, pierce: true, color: '#4488ff' }
};

// Enemy definitions (bullet-themed per feedback)
const ENEMY_TYPES = {
    bulletKin: { hp: 15, damage: 1, speed: 60, fireRate: 2.0, color: '#cc8844', size: 18, name: 'Bullet Kin' },
    bandanaBullet: { hp: 15, damage: 1, speed: 55, fireRate: 1.5, spread: true, color: '#cc4444', size: 18, name: 'Bandana Bullet' },
    shotgunKin: { hp: 25, damage: 1, speed: 50, fireRate: 2.5, pellets: 6, color: '#884422', size: 22, name: 'Shotgun Kin' },
    veteranBullet: { hp: 20, damage: 1, speed: 70, fireRate: 1.0, color: '#666644', size: 18, name: 'Veteran Bullet' },
    gunNut: { hp: 50, damage: 1, speed: 45, fireRate: 1.5, armor: true, color: '#445566', size: 26, name: 'Gun Nut' },
    forgeBullet: { hp: 30, damage: 1, speed: 65, fireRate: 1.2, fire: true, color: '#ff6644', size: 20, name: 'Forge Bullet' },
    ironMaiden: { hp: 60, damage: 1, speed: 35, fireRate: 2.0, color: '#556677', size: 28, name: 'Iron Maiden' },
    gunCultist: { hp: 50, damage: 1, speed: 50, fireRate: 0.8, summon: true, color: '#664488', size: 24, name: 'Gun Cultist' }
};

// Boss definitions
const BOSSES = {
    bulletKing: { hp: 600, damage: 1, speed: 40, color: '#ffcc44', size: 48, name: 'Bullet King', phases: 3 },
    beholster: { hp: 800, damage: 1, speed: 50, color: '#ff4488', size: 56, name: 'Beholster', phases: 3 },
    highDragun: { hp: 1200, damage: 1, speed: 60, color: '#ff2222', size: 72, name: 'High Dragun', phases: 4 }
};

// Game object
const game = {
    state: GameState.MENU,
    currentFloor: 0,
    currentRoom: 0,
    debugMode: false,

    // Player
    player: {
        x: 400, y: 300,
        vx: 0, vy: 0,
        angle: 0,
        hp: 6, maxHp: 6, // 3 hearts
        armor: 1,
        speed: 150,
        weapons: ['marineSidearm'],
        currentWeapon: 0,
        ammo: {},
        currentMag: 15,
        reloading: false,
        reloadTimer: 0,
        fireCooldown: 0,
        blanks: 2,
        keys: 1,
        shells: 0,
        rolling: false,
        rollTimer: 0,
        rollDir: { x: 0, y: 0 },
        invincible: false,
        invincibleTimer: 0
    },

    // Current room data
    room: {
        width: 0,
        height: 0,
        tiles: [],
        enemies: [],
        bullets: [],
        playerBullets: [],
        pickups: [],
        objects: [],
        doors: [],
        cleared: false
    },

    // Floor data
    floor: {
        rooms: [],
        currentRoomIndex: 0,
        cleared: []
    },

    // Boss
    boss: null,

    // Input
    keys: {},
    mouse: { x: 0, y: 0, down: false },

    // Stats
    stats: {
        enemiesKilled: 0,
        roomsCleared: 0,
        shotsFired: 0,
        damageDealt: 0,
        startTime: 0
    },

    // Particles
    particles: [],
    floatingTexts: []
};

// Initialize
function init() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    game.stats.startTime = Date.now();
    requestAnimationFrame(gameLoop);
}

// Input handlers
function handleKeyDown(e) {
    game.keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'q' && !e.repeat) {
        if (game.state === GameState.PLAYING || game.state === GameState.BOSS) {
            useBlank();
        }
    }

    if (e.key.toLowerCase() === 'tab') {
        e.preventDefault();
        game.debugMode = !game.debugMode;
    }

    if (e.key === ' ' && !e.repeat) {
        if (game.state === GameState.MENU) {
            startGame();
        } else if (game.state === GameState.PLAYING || game.state === GameState.BOSS) {
            startDodgeRoll();
        } else if (game.state === GameState.GAME_OVER || game.state === GameState.VICTORY) {
            resetGame();
        } else if (game.state === GameState.FLOOR_TRANSITION) {
            nextFloor();
        }
    }

    if (e.key.toLowerCase() === 'r' && !e.repeat) {
        startReload();
    }

    if (e.key.toLowerCase() === 'e' && !e.repeat) {
        interact();
    }

    // Weapon switching
    if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (idx < game.player.weapons.length) {
            switchWeapon(idx);
        }
    }
}

function handleKeyUp(e) {
    game.keys[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
}

function handleMouseDown(e) {
    if (e.button === 0) game.mouse.down = true;
}

function handleMouseUp(e) {
    if (e.button === 0) game.mouse.down = false;
}

// Game management
function startGame() {
    game.state = GameState.PLAYING;
    game.currentFloor = 0;
    generateFloor();
}

function resetGame() {
    game.state = GameState.MENU;
    game.currentFloor = 0;
    game.player.hp = 6;
    game.player.armor = 1;
    game.player.blanks = 2;
    game.player.keys = 1;
    game.player.shells = 0;
    game.player.weapons = ['marineSidearm'];
    game.player.currentWeapon = 0;
    game.player.ammo = {};
    game.stats = { enemiesKilled: 0, roomsCleared: 0, shotsFired: 0, damageDealt: 0, startTime: Date.now() };
}

function generateFloor() {
    const floorDef = FLOORS[game.currentFloor];
    game.floor = {
        rooms: [],
        currentRoomIndex: 0,
        cleared: []
    };

    // Generate rooms for this floor
    const numRooms = floorDef.rooms;
    for (let i = 0; i < numRooms; i++) {
        const roomType = i === 0 ? 'start' : (i === numRooms - 1 ? 'boss' : (i === 1 ? 'shop' : (i === 2 ? 'chest' : 'combat')));
        game.floor.rooms.push({
            type: roomType,
            cleared: roomType === 'start' || roomType === 'shop' || roomType === 'chest',
            enemyTypes: floorDef.enemyTypes,
            theme: floorDef.theme
        });
        game.floor.cleared.push(roomType !== 'combat' && roomType !== 'boss');
    }

    loadRoom(0);
}

function loadRoom(roomIndex) {
    game.floor.currentRoomIndex = roomIndex;
    const roomDef = game.floor.rooms[roomIndex];

    // Room size (larger rooms)
    const roomW = 20 + Math.floor(Math.random() * 8);
    const roomH = 15 + Math.floor(Math.random() * 5);

    game.room = {
        width: roomW,
        height: roomH,
        tiles: [],
        enemies: [],
        bullets: [],
        playerBullets: [],
        pickups: [],
        objects: [],
        doors: [],
        cleared: game.floor.cleared[roomIndex],
        type: roomDef.type
    };

    // Generate floor tiles
    for (let y = 0; y < roomH; y++) {
        game.room.tiles[y] = [];
        for (let x = 0; x < roomW; x++) {
            const isWall = x === 0 || x === roomW - 1 || y === 0 || y === roomH - 1;
            game.room.tiles[y][x] = isWall ? 1 : 0;
        }
    }

    // Add doors
    if (roomIndex > 0) {
        // Left door (back)
        game.room.doors.push({ x: 0, y: Math.floor(roomH / 2), dir: 'left', toRoom: roomIndex - 1 });
        game.room.tiles[Math.floor(roomH / 2)][0] = 2;
    }
    if (roomIndex < game.floor.rooms.length - 1) {
        // Right door (forward)
        game.room.doors.push({ x: roomW - 1, y: Math.floor(roomH / 2), dir: 'right', toRoom: roomIndex + 1 });
        game.room.tiles[Math.floor(roomH / 2)][roomW - 1] = 2;
    }

    // Place player
    game.player.x = TILE_SIZE * 3;
    game.player.y = (roomH / 2) * TILE_SIZE;

    // Add cover objects (per feedback)
    addCoverObjects(roomDef.type, roomW, roomH);

    // Spawn enemies for combat rooms
    if (roomDef.type === 'combat' && !game.floor.cleared[roomIndex]) {
        const enemyCount = 3 + Math.floor(Math.random() * 4) + game.currentFloor;
        for (let i = 0; i < enemyCount; i++) {
            const typeKey = roomDef.enemyTypes[Math.floor(Math.random() * roomDef.enemyTypes.length)];
            spawnEnemy(typeKey, roomW, roomH);
        }
    }

    // Boss room
    if (roomDef.type === 'boss' && !game.floor.cleared[roomIndex]) {
        game.state = GameState.BOSS;
        spawnBoss();
    }

    // Chest room
    if (roomDef.type === 'chest') {
        game.room.pickups.push({
            type: 'chest',
            x: (roomW / 2) * TILE_SIZE,
            y: (roomH / 2) * TILE_SIZE,
            tier: Math.min(game.currentFloor, 2)
        });
    }

    // Shop room
    if (roomDef.type === 'shop') {
        const shopItems = ['heart', 'blank', 'key', 'ammo'];
        shopItems.forEach((item, i) => {
            game.room.pickups.push({
                type: 'shop_' + item,
                x: (roomW / 2 - 2 + i * 2) * TILE_SIZE,
                y: (roomH / 2) * TILE_SIZE,
                price: item === 'heart' ? 20 : (item === 'blank' ? 15 : (item === 'key' ? 25 : 30))
            });
        });
    }
}

function addCoverObjects(roomType, roomW, roomH) {
    if (roomType === 'start' || roomType === 'boss') return;

    const objectCount = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < objectCount; i++) {
        const objType = ['pillar', 'barrel', 'table', 'crate'][Math.floor(Math.random() * 4)];
        const x = (2 + Math.floor(Math.random() * (roomW - 4))) * TILE_SIZE;
        const y = (2 + Math.floor(Math.random() * (roomH - 4))) * TILE_SIZE;

        // Don't place too close to doors
        const nearDoor = game.room.doors.some(d => Math.hypot(d.x * TILE_SIZE - x, d.y * TILE_SIZE - y) < TILE_SIZE * 3);
        if (nearDoor) continue;

        game.room.objects.push({
            type: objType,
            x: x,
            y: y,
            hp: objType === 'pillar' ? Infinity : (objType === 'barrel' ? 15 : 30),
            flipped: false,
            destroyed: false
        });
    }
}

function spawnEnemy(typeKey, roomW, roomH) {
    const type = ENEMY_TYPES[typeKey];
    const x = (3 + Math.floor(Math.random() * (roomW - 6))) * TILE_SIZE;
    const y = (3 + Math.floor(Math.random() * (roomH - 6))) * TILE_SIZE;

    game.room.enemies.push({
        type: typeKey,
        x: x,
        y: y,
        hp: type.hp,
        maxHp: type.hp,
        damage: type.damage,
        speed: type.speed,
        fireRate: type.fireRate,
        fireCooldown: Math.random() * type.fireRate,
        color: type.color,
        size: type.size,
        name: type.name,
        facing: 0,
        state: 'idle'
    });
}

function spawnBoss() {
    const bossKey = FLOORS[game.currentFloor].bossType;
    const bossDef = BOSSES[bossKey];

    game.boss = {
        type: bossKey,
        x: game.room.width * TILE_SIZE / 2,
        y: game.room.height * TILE_SIZE / 3,
        hp: bossDef.hp,
        maxHp: bossDef.hp,
        damage: bossDef.damage,
        speed: bossDef.speed,
        color: bossDef.color,
        size: bossDef.size,
        name: bossDef.name,
        phase: 1,
        maxPhase: bossDef.phases,
        attackTimer: 0,
        attackPattern: 0,
        invincible: false
    };
}

// Combat
function shoot() {
    if (game.player.rolling || game.player.reloading) return;
    if (game.player.fireCooldown > 0) return;

    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    // Check ammo
    if (game.player.currentMag <= 0) {
        startReload();
        return;
    }

    game.player.currentMag--;
    game.player.fireCooldown = weapon.fireRate;
    game.stats.shotsFired++;

    // Calculate direction toward mouse (CRITICAL - must aim at cursor)
    const dx = game.mouse.x - game.player.x;
    const dy = game.mouse.y - game.player.y;
    const angle = Math.atan2(dy, dx);

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread * 2;
        const bulletAngle = angle + spread;

        game.room.playerBullets.push({
            x: game.player.x + Math.cos(angle) * 15,
            y: game.player.y + Math.sin(angle) * 15,
            vx: Math.cos(bulletAngle) * 500,
            vy: Math.sin(bulletAngle) * 500,
            damage: weapon.damage,
            pierce: weapon.pierce || false,
            homing: weapon.homing || false,
            color: weapon.color,
            life: 2
        });
    }

    // Muzzle flash
    addParticle(game.player.x + Math.cos(angle) * 20, game.player.y + Math.sin(angle) * 20, 'muzzle');
}

function startReload() {
    if (game.player.reloading) return;

    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (weapon.ammo === Infinity) {
        game.player.currentMag = weapon.magSize;
        addFloatingText(game.player.x, game.player.y - 30, 'RELOADED', '#44ff44');
        return;
    }

    const ammoNeeded = weapon.magSize - game.player.currentMag;
    const ammoAvailable = game.player.ammo[weaponKey] || 0;

    if (ammoAvailable <= 0 && weapon.ammo !== Infinity) {
        addFloatingText(game.player.x, game.player.y - 30, 'NO AMMO', '#ff4444');
        return;
    }

    game.player.reloading = true;
    game.player.reloadTimer = weapon.reloadTime;
}

function finishReload() {
    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (weapon.ammo === Infinity) {
        game.player.currentMag = weapon.magSize;
    } else {
        const ammoNeeded = weapon.magSize - game.player.currentMag;
        const ammoAvailable = game.player.ammo[weaponKey] || 0;
        const reload = Math.min(ammoNeeded, ammoAvailable);
        game.player.ammo[weaponKey] -= reload;
        game.player.currentMag += reload;
    }

    game.player.reloading = false;
    addFloatingText(game.player.x, game.player.y - 30, 'RELOADED', '#44ff44');
}

function switchWeapon(idx) {
    if (idx >= game.player.weapons.length) return;
    game.player.currentWeapon = idx;
    game.player.reloading = false;

    const weaponKey = game.player.weapons[idx];
    const weapon = WEAPONS[weaponKey];
    game.player.currentMag = Math.min(game.player.currentMag, weapon.magSize);

    addFloatingText(game.player.x, game.player.y - 30, weapon.name, '#ffff44');
}

function startDodgeRoll() {
    if (game.player.rolling) return;

    // Get roll direction from movement input
    let dx = 0, dy = 0;
    if (game.keys['w']) dy -= 1;
    if (game.keys['s']) dy += 1;
    if (game.keys['a']) dx -= 1;
    if (game.keys['d']) dx += 1;

    // If no direction input, roll toward mouse
    if (dx === 0 && dy === 0) {
        dx = game.mouse.x - game.player.x;
        dy = game.mouse.y - game.player.y;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
        game.player.rollDir = { x: dx / len, y: dy / len };
        game.player.rolling = true;
        game.player.rollTimer = 0.5;
        game.player.invincible = true;
        game.player.invincibleTimer = 0.35; // I-frames for first half of roll
    }
}

function useBlank() {
    if (game.player.blanks <= 0) return;

    game.player.blanks--;

    // Clear all enemy bullets
    game.room.bullets = [];

    // Stun nearby enemies
    game.room.enemies.forEach(enemy => {
        const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
        if (dist < 150) {
            enemy.fireCooldown = 2;
        }
    });

    // Visual effect
    addParticle(game.player.x, game.player.y, 'blank');
    addFloatingText(game.player.x, game.player.y - 40, 'BLANK!', '#4488ff');
}

function interact() {
    // Check for flippable tables
    game.room.objects.forEach(obj => {
        if (obj.type === 'table' && !obj.flipped && !obj.destroyed) {
            const dist = Math.hypot(obj.x - game.player.x, obj.y - game.player.y);
            if (dist < TILE_SIZE * 2) {
                obj.flipped = true;
                addFloatingText(obj.x, obj.y - 20, 'FLIPPED!', '#ffaa00');
            }
        }
    });

    // Check for doors
    game.room.doors.forEach(door => {
        const doorX = door.x * TILE_SIZE;
        const doorY = door.y * TILE_SIZE;
        const dist = Math.hypot(doorX - game.player.x, doorY - game.player.y);

        if (dist < TILE_SIZE * 2 && game.room.cleared) {
            loadRoom(door.toRoom);
        }
    });

    // Check for chests
    game.room.pickups.forEach(pickup => {
        if (pickup.type === 'chest') {
            const dist = Math.hypot(pickup.x - game.player.x, pickup.y - game.player.y);
            if (dist < TILE_SIZE * 2 && game.player.keys > 0) {
                game.player.keys--;
                pickup.type = 'opened';

                // Give random weapon
                const weaponKeys = Object.keys(WEAPONS).filter(k => k !== 'marineSidearm');
                const newWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
                game.player.weapons.push(newWeapon);
                game.player.ammo[newWeapon] = WEAPONS[newWeapon].ammo;

                addFloatingText(pickup.x, pickup.y - 30, 'GOT ' + WEAPONS[newWeapon].name.toUpperCase() + '!', '#ffff44');
            }
        }
    });

    // Check for shop items
    game.room.pickups.forEach(pickup => {
        if (pickup.type.startsWith('shop_')) {
            const dist = Math.hypot(pickup.x - game.player.x, pickup.y - game.player.y);
            if (dist < TILE_SIZE * 2 && game.player.shells >= pickup.price) {
                game.player.shells -= pickup.price;
                const itemType = pickup.type.replace('shop_', '');

                if (itemType === 'heart') {
                    game.player.hp = Math.min(game.player.maxHp, game.player.hp + 2);
                } else if (itemType === 'blank') {
                    game.player.blanks++;
                } else if (itemType === 'key') {
                    game.player.keys++;
                } else if (itemType === 'ammo') {
                    const weaponKey = game.player.weapons[game.player.currentWeapon];
                    if (WEAPONS[weaponKey].ammo !== Infinity) {
                        game.player.ammo[weaponKey] = (game.player.ammo[weaponKey] || 0) + 20;
                    }
                }

                pickup.type = 'sold';
                addFloatingText(pickup.x, pickup.y - 30, 'PURCHASED!', '#44ff44');
            }
        }
    });
}

function damagePlayer(amount) {
    if (game.player.invincible) return;

    // Armor blocks first
    if (game.player.armor > 0) {
        game.player.armor--;
        addFloatingText(game.player.x, game.player.y - 20, 'ARMOR BLOCKED', '#4488ff');
    } else {
        game.player.hp -= amount;
        addFloatingText(game.player.x, game.player.y - 20, '-' + amount, '#ff4444');
    }

    game.player.invincible = true;
    game.player.invincibleTimer = 1.0;

    if (game.player.hp <= 0) {
        game.state = GameState.GAME_OVER;
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (game.state === GameState.PLAYING || game.state === GameState.BOSS) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateBoss(dt);
        updateBullets(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateFloatingTexts(dt);
        checkRoomCleared();
    }
}

function updatePlayer(dt) {
    // Update angle to face mouse
    game.player.angle = Math.atan2(game.mouse.y - game.player.y, game.mouse.x - game.player.x);

    // Movement
    if (!game.player.rolling) {
        let dx = 0, dy = 0;
        if (game.keys['w']) dy -= 1;
        if (game.keys['s']) dy += 1;
        if (game.keys['a']) dx -= 1;
        if (game.keys['d']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            const newX = game.player.x + dx * game.player.speed * dt;
            const newY = game.player.y + dy * game.player.speed * dt;

            if (!collidesWithWalls(newX, game.player.y)) game.player.x = newX;
            if (!collidesWithWalls(game.player.x, newY)) game.player.y = newY;
        }
    } else {
        // Rolling movement
        const rollSpeed = game.player.speed * 2.5;
        const newX = game.player.x + game.player.rollDir.x * rollSpeed * dt;
        const newY = game.player.y + game.player.rollDir.y * rollSpeed * dt;

        if (!collidesWithWalls(newX, game.player.y)) game.player.x = newX;
        if (!collidesWithWalls(game.player.x, newY)) game.player.y = newY;

        game.player.rollTimer -= dt;
        if (game.player.rollTimer <= 0) {
            game.player.rolling = false;
        }
    }

    // Invincibility timer
    if (game.player.invincibleTimer > 0) {
        game.player.invincibleTimer -= dt;
        if (game.player.invincibleTimer <= 0) {
            game.player.invincible = false;
        }
    }

    // Fire cooldown
    if (game.player.fireCooldown > 0) {
        game.player.fireCooldown -= dt;
    }

    // Reload
    if (game.player.reloading) {
        game.player.reloadTimer -= dt;
        if (game.player.reloadTimer <= 0) {
            finishReload();
        }
    }

    // Shooting (auto weapons)
    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];
    if (game.mouse.down && (weapon.auto || game.player.fireCooldown <= 0)) {
        shoot();
    }
}

function updateEnemies(dt) {
    game.room.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const type = ENEMY_TYPES[enemy.type];
        const distToPlayer = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);

        // Face player
        enemy.facing = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);

        // Move toward player if far, otherwise strafe
        if (distToPlayer > 150) {
            const moveAngle = enemy.facing;
            enemy.x += Math.cos(moveAngle) * enemy.speed * dt;
            enemy.y += Math.sin(moveAngle) * enemy.speed * dt;
        } else {
            // Strafe
            const strafeAngle = enemy.facing + Math.PI / 2 * (Math.sin(Date.now() / 1000 + enemy.x) > 0 ? 1 : -1);
            enemy.x += Math.cos(strafeAngle) * enemy.speed * 0.5 * dt;
            enemy.y += Math.sin(strafeAngle) * enemy.speed * 0.5 * dt;
        }

        // Keep in bounds
        enemy.x = Math.max(TILE_SIZE * 1.5, Math.min((game.room.width - 1.5) * TILE_SIZE, enemy.x));
        enemy.y = Math.max(TILE_SIZE * 1.5, Math.min((game.room.height - 1.5) * TILE_SIZE, enemy.y));

        // Shooting
        enemy.fireCooldown -= dt;
        if (enemy.fireCooldown <= 0 && distToPlayer < 400) {
            enemy.fireCooldown = enemy.fireRate;
            enemyShoot(enemy);
        }

        // Contact damage
        if (distToPlayer < enemy.size / 2 + PLAYER_SIZE / 2) {
            damagePlayer(enemy.damage);
        }
    });

    // Remove dead enemies
    game.room.enemies = game.room.enemies.filter(e => {
        if (e.hp <= 0) {
            // Drop shells
            game.player.shells += 1 + Math.floor(Math.random() * 3);
            game.stats.enemiesKilled++;

            // Chance to drop pickup
            if (Math.random() < 0.15) {
                game.room.pickups.push({
                    type: Math.random() < 0.5 ? 'heart' : 'ammo',
                    x: e.x,
                    y: e.y
                });
            }

            addParticle(e.x, e.y, 'death');
            return false;
        }
        return true;
    });
}

function enemyShoot(enemy) {
    const type = ENEMY_TYPES[enemy.type];
    const pellets = type.pellets || 1;
    const spreadAngle = type.spread ? 0.3 : 0;

    for (let i = 0; i < pellets; i++) {
        const angle = enemy.facing + (pellets > 1 ? (i - (pellets - 1) / 2) * 0.15 : 0) + (Math.random() - 0.5) * spreadAngle;
        game.room.bullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 200,
            vy: Math.sin(angle) * 200,
            damage: enemy.damage,
            color: '#ff8844',
            size: 6
        });
    }
}

function updateBoss(dt) {
    if (!game.boss || game.boss.hp <= 0) return;

    const boss = game.boss;
    const distToPlayer = Math.hypot(game.player.x - boss.x, game.player.y - boss.y);

    // Boss movement
    const targetAngle = Math.atan2(game.player.y - boss.y, game.player.x - boss.x);
    boss.x += Math.cos(targetAngle) * boss.speed * 0.5 * dt;
    boss.y += Math.sin(targetAngle) * boss.speed * 0.5 * dt;

    // Keep in arena
    boss.x = Math.max(TILE_SIZE * 3, Math.min((game.room.width - 3) * TILE_SIZE, boss.x));
    boss.y = Math.max(TILE_SIZE * 3, Math.min((game.room.height - 3) * TILE_SIZE, boss.y));

    // Attack patterns
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
        bossAttack(boss);
        boss.attackTimer = 1.5 - (boss.phase - 1) * 0.2;
        boss.attackPattern = (boss.attackPattern + 1) % 4;
    }

    // Phase transitions
    const hpPercent = boss.hp / boss.maxHp;
    if (hpPercent < 0.66 && boss.phase === 1) {
        boss.phase = 2;
        addFloatingText(boss.x, boss.y - 50, 'PHASE 2!', '#ff4444');
    } else if (hpPercent < 0.33 && boss.phase === 2) {
        boss.phase = 3;
        addFloatingText(boss.x, boss.y - 50, 'FINAL PHASE!', '#ff0000');
    }

    // Contact damage
    if (distToPlayer < boss.size / 2 + PLAYER_SIZE / 2) {
        damagePlayer(boss.damage);
    }

    // Check boss death
    if (boss.hp <= 0) {
        game.boss = null;
        game.room.cleared = true;
        game.floor.cleared[game.floor.currentRoomIndex] = true;

        // Drop rewards
        game.player.shells += 50 + game.currentFloor * 25;

        // Floor cleared
        if (game.currentFloor < FLOORS.length - 1) {
            game.state = GameState.FLOOR_TRANSITION;
        } else {
            game.state = GameState.VICTORY;
        }

        addFloatingText(boss.x, boss.y, boss.name + ' DEFEATED!', '#ffff00');
    }
}

function bossAttack(boss) {
    const angleToPlayer = Math.atan2(game.player.y - boss.y, game.player.x - boss.x);

    switch (boss.attackPattern) {
        case 0: // Spiral
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + Date.now() / 500;
                game.room.bullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    damage: boss.damage, color: '#ffaa00', size: 8
                });
            }
            break;

        case 1: // Aimed burst
            for (let i = 0; i < 5; i++) {
                const angle = angleToPlayer + (i - 2) * 0.15;
                game.room.bullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(angle) * 250,
                    vy: Math.sin(angle) * 250,
                    damage: boss.damage, color: '#ff4444', size: 10
                });
            }
            break;

        case 2: // Ring
            const ringCount = 16 + boss.phase * 4;
            for (let i = 0; i < ringCount; i++) {
                const angle = (i / ringCount) * Math.PI * 2;
                game.room.bullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(angle) * 180,
                    vy: Math.sin(angle) * 180,
                    damage: boss.damage, color: '#ff8800', size: 8
                });
            }
            break;

        case 3: // Shotgun blast
            for (let i = 0; i < 8 + boss.phase * 2; i++) {
                const angle = angleToPlayer + (Math.random() - 0.5) * 0.6;
                const speed = 200 + Math.random() * 100;
                game.room.bullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    damage: boss.damage, color: '#ffcc00', size: 7
                });
            }
            break;
    }
}

function updateBullets(dt) {
    // Player bullets
    game.room.playerBullets.forEach(bullet => {
        // Homing
        if (bullet.homing) {
            let closestEnemy = null;
            let closestDist = Infinity;
            game.room.enemies.forEach(e => {
                const dist = Math.hypot(e.x - bullet.x, e.y - bullet.y);
                if (dist < closestDist && e.hp > 0) {
                    closestDist = dist;
                    closestEnemy = e;
                }
            });
            if (closestEnemy && closestDist < 200) {
                const targetAngle = Math.atan2(closestEnemy.y - bullet.y, closestEnemy.x - bullet.x);
                const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                const newAngle = currentAngle + (targetAngle - currentAngle) * 0.1;
                const speed = Math.hypot(bullet.vx, bullet.vy);
                bullet.vx = Math.cos(newAngle) * speed;
                bullet.vy = Math.sin(newAngle) * speed;
            }
        }

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        // Hit enemies
        game.room.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                if (dist < enemy.size / 2 + 4) {
                    enemy.hp -= bullet.damage;
                    game.stats.damageDealt += bullet.damage;
                    if (!bullet.pierce) bullet.life = 0;
                    addParticle(bullet.x, bullet.y, 'hit');
                    addFloatingText(enemy.x, enemy.y - 15, '-' + bullet.damage, '#ffff00');
                }
            }
        });

        // Hit boss
        if (game.boss && game.boss.hp > 0) {
            const dist = Math.hypot(bullet.x - game.boss.x, bullet.y - game.boss.y);
            if (dist < game.boss.size / 2 + 4) {
                game.boss.hp -= bullet.damage;
                game.stats.damageDealt += bullet.damage;
                if (!bullet.pierce) bullet.life = 0;
                addParticle(bullet.x, bullet.y, 'hit');
                addFloatingText(game.boss.x, game.boss.y - 30, '-' + bullet.damage, '#ffff00');
            }
        }

        // Hit walls
        if (collidesWithWalls(bullet.x, bullet.y)) {
            bullet.life = 0;
        }
    });

    // Enemy bullets
    game.room.bullets.forEach(bullet => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        // Hit player
        const distToPlayer = Math.hypot(bullet.x - game.player.x, bullet.y - game.player.y);
        if (distToPlayer < PLAYER_SIZE / 2 + bullet.size / 2) {
            damagePlayer(bullet.damage);
            bullet.vx = 0;
            bullet.vy = 0;
        }

        // Hit cover
        game.room.objects.forEach(obj => {
            if (obj.destroyed) return;
            if (obj.flipped || obj.type === 'pillar' || obj.type === 'barrel' || obj.type === 'crate') {
                const dist = Math.hypot(bullet.x - obj.x, bullet.y - obj.y);
                if (dist < TILE_SIZE / 2 + bullet.size / 2) {
                    bullet.vx = 0;
                    bullet.vy = 0;
                    if (obj.hp !== Infinity) {
                        obj.hp -= 5;
                        if (obj.hp <= 0) {
                            obj.destroyed = true;
                            if (obj.type === 'barrel') {
                                // Explode
                                game.room.enemies.forEach(e => {
                                    const eDist = Math.hypot(e.x - obj.x, e.y - obj.y);
                                    if (eDist < TILE_SIZE * 3) {
                                        e.hp -= 30;
                                    }
                                });
                                addParticle(obj.x, obj.y, 'explosion');
                            }
                        }
                    }
                }
            }
        });

        // Hit walls
        if (collidesWithWalls(bullet.x, bullet.y)) {
            bullet.vx = 0;
            bullet.vy = 0;
        }
    });

    // Remove dead bullets
    game.room.playerBullets = game.room.playerBullets.filter(b => b.life > 0);
    game.room.bullets = game.room.bullets.filter(b => b.vx !== 0 || b.vy !== 0);
}

function updatePickups(dt) {
    game.room.pickups.forEach(pickup => {
        if (pickup.type === 'sold' || pickup.type === 'opened') return;

        const dist = Math.hypot(pickup.x - game.player.x, pickup.y - game.player.y);
        if (dist < TILE_SIZE && !pickup.type.startsWith('shop_') && pickup.type !== 'chest') {
            if (pickup.type === 'heart') {
                game.player.hp = Math.min(game.player.maxHp, game.player.hp + 1);
                addFloatingText(pickup.x, pickup.y - 20, '+1 HP', '#ff4444');
            } else if (pickup.type === 'ammo') {
                const weaponKey = game.player.weapons[game.player.currentWeapon];
                if (WEAPONS[weaponKey].ammo !== Infinity) {
                    game.player.ammo[weaponKey] = (game.player.ammo[weaponKey] || 0) + 10;
                }
                addFloatingText(pickup.x, pickup.y - 20, '+AMMO', '#ffaa00');
            } else if (pickup.type === 'shell') {
                game.player.shells += 5;
                addFloatingText(pickup.x, pickup.y - 20, '+5 SHELLS', '#ffff00');
            }
            pickup.type = 'collected';
        }
    });

    game.room.pickups = game.room.pickups.filter(p => p.type !== 'collected');
}

function updateParticles(dt) {
    game.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
    });
    game.particles = game.particles.filter(p => p.life > 0);
}

function updateFloatingTexts(dt) {
    game.floatingTexts.forEach(t => {
        t.y -= 30 * dt;
        t.life -= dt;
    });
    game.floatingTexts = game.floatingTexts.filter(t => t.life > 0);
}

function checkRoomCleared() {
    if (game.room.cleared) return;
    if (game.room.type !== 'combat') return;

    if (game.room.enemies.length === 0) {
        game.room.cleared = true;
        game.floor.cleared[game.floor.currentRoomIndex] = true;
        game.stats.roomsCleared++;
        addFloatingText(game.player.x, game.player.y - 50, 'ROOM CLEARED!', '#44ff44');

        // Bonus drops
        if (Math.random() < 0.3) {
            game.room.pickups.push({
                type: Math.random() < 0.5 ? 'heart' : 'ammo',
                x: game.room.width * TILE_SIZE / 2,
                y: game.room.height * TILE_SIZE / 2
            });
        }
    }
}

function nextFloor() {
    game.currentFloor++;
    game.player.blanks = 2; // Refresh blanks
    game.state = GameState.PLAYING;
    generateFloor();
}

// Helpers
function collidesWithWalls(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileX < 0 || tileX >= game.room.width || tileY < 0 || tileY >= game.room.height) {
        return true;
    }

    const tile = game.room.tiles[tileY]?.[tileX];
    return tile === 1;
}

function addParticle(x, y, type) {
    const count = type === 'blank' ? 30 : (type === 'explosion' ? 20 : (type === 'death' ? 15 : 5));
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 'blank' ? 300 : (type === 'explosion' ? 200 : 100);
        game.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed * Math.random(),
            vy: Math.sin(angle) * speed * Math.random(),
            color: type === 'muzzle' ? '#ffff44' : (type === 'blank' ? '#4488ff' : (type === 'explosion' ? '#ff8844' : '#cc8844')),
            life: type === 'blank' ? 0.5 : 0.3,
            size: type === 'blank' ? 4 : 3
        });
    }
}

function addFloatingText(x, y, text, color) {
    game.floatingTexts.push({ x, y, text, color, life: 1.5 });
}

// Rendering
function render() {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === GameState.MENU) {
        renderMenu();
    } else if (game.state === GameState.PLAYING || game.state === GameState.BOSS) {
        renderGame();
    } else if (game.state === GameState.FLOOR_TRANSITION) {
        renderFloorTransition();
    } else if (game.state === GameState.GAME_OVER) {
        renderGameOver();
    } else if (game.state === GameState.VICTORY) {
        renderVictory();
    }

    if (game.debugMode && (game.state === GameState.PLAYING || game.state === GameState.BOSS)) {
        renderDebug();
    }
}

function renderMenu() {
    // Title
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BULLETS OF THE DAMNED', canvas.width / 2, 150);

    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('An Enter the Gungeon Clone', canvas.width / 2, 190);

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim (bullets go to cursor)',
        'Left Click - Shoot',
        'Space - Dodge Roll (i-frames)',
        'Q - Use Blank (clears bullets)',
        'R - Reload',
        'E - Interact (flip tables, open doors)',
        '1-9 - Switch Weapons',
        'Tab - Debug overlay'
    ];
    instructions.forEach((text, i) => {
        ctx.fillText(text, canvas.width / 2, 280 + i * 26);
    });

    // Start
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Enter the Gungeon', canvas.width / 2, 550);
}

function renderGame() {
    // Camera offset
    const camX = canvas.width / 2 - game.player.x;
    const camY = canvas.height / 2 - game.player.y;

    ctx.save();
    ctx.translate(camX, camY);

    // Floor tiles
    const floorDef = FLOORS[game.currentFloor];
    for (let y = 0; y < game.room.height; y++) {
        for (let x = 0; x < game.room.width; x++) {
            const tile = game.room.tiles[y][x];
            if (tile === 1) {
                ctx.fillStyle = '#2a2a3a';
            } else if (tile === 2) {
                ctx.fillStyle = game.room.cleared ? '#3a5a3a' : '#5a3a3a';
            } else {
                // Checkerboard floor
                ctx.fillStyle = (x + y) % 2 === 0 ? '#1a1a2a' : '#1e1e2e';
            }
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            // Wall detail
            if (tile === 1) {
                ctx.strokeStyle = '#3a3a4a';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Cover objects
    game.room.objects.forEach(obj => {
        if (obj.destroyed) return;

        if (obj.type === 'pillar') {
            ctx.fillStyle = '#4a4a5a';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, TILE_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#5a5a6a';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (obj.type === 'barrel') {
            ctx.fillStyle = '#884422';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, TILE_SIZE / 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Explosive icon
            ctx.fillStyle = '#ffaa00';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', obj.x, obj.y + 4);
        } else if (obj.type === 'crate') {
            ctx.fillStyle = '#665544';
            ctx.fillRect(obj.x - TILE_SIZE / 2.5, obj.y - TILE_SIZE / 2.5, TILE_SIZE / 1.25, TILE_SIZE / 1.25);
            ctx.strokeStyle = '#554433';
            ctx.lineWidth = 2;
            ctx.strokeRect(obj.x - TILE_SIZE / 2.5, obj.y - TILE_SIZE / 2.5, TILE_SIZE / 1.25, TILE_SIZE / 1.25);
        } else if (obj.type === 'table') {
            if (obj.flipped) {
                ctx.fillStyle = '#554433';
                ctx.fillRect(obj.x - TILE_SIZE / 1.5, obj.y - 4, TILE_SIZE * 1.3, 8);
                ctx.strokeStyle = '#443322';
                ctx.lineWidth = 2;
                ctx.strokeRect(obj.x - TILE_SIZE / 1.5, obj.y - 4, TILE_SIZE * 1.3, 8);
            } else {
                ctx.fillStyle = '#665544';
                ctx.fillRect(obj.x - TILE_SIZE / 2, obj.y - TILE_SIZE / 3, TILE_SIZE, TILE_SIZE / 1.5);
                ctx.strokeStyle = '#554433';
                ctx.lineWidth = 1;
                ctx.strokeRect(obj.x - TILE_SIZE / 2, obj.y - TILE_SIZE / 3, TILE_SIZE, TILE_SIZE / 1.5);
            }
        }
    });

    // Pickups
    game.room.pickups.forEach(pickup => {
        if (pickup.type === 'collected' || pickup.type === 'sold' || pickup.type === 'opened') return;

        if (pickup.type === 'heart') {
            ctx.fillStyle = '#ff4444';
            drawHeart(pickup.x, pickup.y, 8);
        } else if (pickup.type === 'ammo') {
            ctx.fillStyle = '#ffaa44';
            ctx.fillRect(pickup.x - 6, pickup.y - 4, 12, 8);
            ctx.fillStyle = '#cc8833';
            ctx.fillRect(pickup.x - 4, pickup.y - 6, 8, 12);
        } else if (pickup.type === 'chest') {
            const colors = ['#884422', '#4444aa', '#44aa44'];
            ctx.fillStyle = colors[pickup.tier] || '#884422';
            ctx.fillRect(pickup.x - 15, pickup.y - 10, 30, 20);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(pickup.x - 3, pickup.y - 5, 6, 10);
        } else if (pickup.type.startsWith('shop_')) {
            ctx.fillStyle = '#333344';
            ctx.fillRect(pickup.x - 15, pickup.y - 20, 30, 40);
            ctx.fillStyle = '#ffff44';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(pickup.type.replace('shop_', '').toUpperCase(), pickup.x, pickup.y - 5);
            ctx.fillText('$' + pickup.price, pickup.x, pickup.y + 15);
        }
    });

    // Enemy bullets
    game.room.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();

        // Bullet glow
        ctx.fillStyle = 'rgba(255, 136, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size + 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies (bullet-themed per feedback)
    game.room.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        // Bullet body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Bullet casing (top)
        ctx.fillStyle = '#cc9944';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - enemy.size / 4, enemy.size / 3, Math.PI, 0);
        ctx.fill();

        // Angry face
        ctx.fillStyle = '#222222';
        const eyeOffset = enemy.size / 6;
        ctx.beginPath();
        ctx.arc(enemy.x - eyeOffset, enemy.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(enemy.x + eyeOffset, enemy.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x - eyeOffset - 4, enemy.y - 6);
        ctx.lineTo(enemy.x - eyeOffset + 2, enemy.y - 8);
        ctx.moveTo(enemy.x + eyeOffset + 4, enemy.y - 6);
        ctx.lineTo(enemy.x + eyeOffset - 2, enemy.y - 8);
        ctx.stroke();

        // Mouth
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y + 4, 4, 0, Math.PI);
        ctx.stroke();

        // Health bar
        const barWidth = enemy.size;
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#440000';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 10, barWidth, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : (hpPercent > 0.25 ? '#ffaa00' : '#ff4444');
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 10, barWidth * hpPercent, 4);
    });

    // Boss
    if (game.boss && game.boss.hp > 0) {
        const boss = game.boss;

        // Boss body (giant bullet)
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Boss casing (crown)
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        const crownY = boss.y - boss.size / 2.5;
        ctx.moveTo(boss.x - boss.size / 2.5, crownY);
        ctx.lineTo(boss.x - boss.size / 3.5, crownY - 15);
        ctx.lineTo(boss.x - boss.size / 6, crownY);
        ctx.lineTo(boss.x, crownY - 20);
        ctx.lineTo(boss.x + boss.size / 6, crownY);
        ctx.lineTo(boss.x + boss.size / 3.5, crownY - 15);
        ctx.lineTo(boss.x + boss.size / 2.5, crownY);
        ctx.closePath();
        ctx.fill();

        // Boss face
        ctx.fillStyle = '#000000';
        const bossEyeOffset = boss.size / 5;
        ctx.beginPath();
        ctx.arc(boss.x - bossEyeOffset, boss.y - 5, 6, 0, Math.PI * 2);
        ctx.arc(boss.x + bossEyeOffset, boss.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Red eyes glow
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(boss.x - bossEyeOffset, boss.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(boss.x + bossEyeOffset, boss.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Boss mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y + 10, 12, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Boss name
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name.toUpperCase(), boss.x, boss.y - boss.size / 2 - 30);
    }

    // Player bullets
    game.room.playerBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02);
        ctx.stroke();
    });

    // Particles
    game.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    renderPlayer();

    // Floating texts
    game.floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life / 1.5;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // HUD
    renderHUD();
}

function renderPlayer() {
    const p = game.player;

    // Roll effect
    if (p.rolling) {
        ctx.globalAlpha = 0.5;
    }

    // Invincibility flash
    if (p.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.3;
    }

    // Body
    ctx.fillStyle = '#44aa44';
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#338833';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 3, PLAYER_SIZE / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#88ccff';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.angle) * 5, p.y + Math.sin(p.angle) * 5 - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Gun
    const gunX = p.x + Math.cos(p.angle) * 15;
    const gunY = p.y + Math.sin(p.angle) * 15;
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * 8, p.y + Math.sin(p.angle) * 8);
    ctx.lineTo(gunX, gunY);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
    ctx.bezierCurveTo(x - size, y + size, x, y + size * 1.5, x, y + size * 1.5);
    ctx.bezierCurveTo(x, y + size * 1.5, x + size, y + size, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
    ctx.fill();
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 45);

    // Health hearts
    const heartSize = 12;
    for (let i = 0; i < game.player.maxHp / 2; i++) {
        const hx = 20 + i * 28;
        const hy = 22;
        if (game.player.hp >= (i + 1) * 2) {
            ctx.fillStyle = '#ff4444';
        } else if (game.player.hp >= i * 2 + 1) {
            ctx.fillStyle = '#ff8888';
        } else {
            ctx.fillStyle = '#444444';
        }
        drawHeart(hx, hy, heartSize);
    }

    // Armor
    ctx.fillStyle = '#4488ff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i < game.player.armor; i++) {
        ctx.fillText('\u2605', 120 + i * 18, 27); // Star for armor
    }

    // Blanks
    ctx.fillStyle = '#4488ff';
    ctx.font = '14px Arial';
    ctx.fillText('BLANK x' + game.player.blanks, 180, 27);

    // Keys
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('KEY x' + game.player.keys, 280, 27);

    // Shells (currency)
    ctx.fillStyle = '#ffff44';
    ctx.fillText('$' + game.player.shells, 370, 27);

    // Floor name
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(FLOORS[game.currentFloor].name + ' - Room ' + (game.floor.currentRoomIndex + 1) + '/' + game.floor.rooms.length, canvas.width / 2, 27);

    // Weapon info (right side)
    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(weapon.name, canvas.width - 20, 18);

    ctx.fillStyle = weapon.ammo === Infinity ? '#44ff44' : '#ffaa00';
    ctx.font = '12px Arial';
    const ammoText = weapon.ammo === Infinity ? game.player.currentMag + '/' + weapon.magSize + ' (\u221E)' :
        game.player.currentMag + '/' + weapon.magSize + ' [' + (game.player.ammo[weaponKey] || 0) + ']';
    ctx.fillText(ammoText, canvas.width - 20, 35);

    // Reload indicator
    if (game.player.reloading) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING...', canvas.width / 2, canvas.height / 2 + 60);
    }

    // Boss health bar
    if (game.boss && game.boss.hp > 0) {
        const barWidth = 400;
        const barHeight = 20;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 50;

        ctx.fillStyle = '#222222';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpPercent = game.boss.hp / game.boss.maxHp;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.boss.name + ' - Phase ' + game.boss.phase, canvas.width / 2, barY - 5);
    }

    // Door prompts
    if (game.room.cleared) {
        game.room.doors.forEach(door => {
            const doorX = door.x * TILE_SIZE;
            const doorY = door.y * TILE_SIZE;
            const dist = Math.hypot(doorX - game.player.x, doorY - game.player.y);
            if (dist < TILE_SIZE * 3) {
                ctx.fillStyle = '#44ff44';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('[E] Enter ' + (door.toRoom === game.floor.rooms.length - 1 ? 'BOSS ROOM' : 'Next Room'),
                    canvas.width / 2, canvas.height - 80);
            }
        });
    }

    // Room locked message
    if (!game.room.cleared && game.room.type === 'combat') {
        ctx.fillStyle = '#ff4444';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DEFEAT ALL ENEMIES TO UNLOCK DOORS', canvas.width / 2, canvas.height - 80);
    }
}

function renderFloorTransition() {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(FLOORS[game.currentFloor].name + ' CLEARED!', canvas.width / 2, 200);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText('Enemies Killed: ' + game.stats.enemiesKilled, canvas.width / 2, 300);
    ctx.fillText('Rooms Cleared: ' + game.stats.roomsCleared, canvas.width / 2, 340);
    ctx.fillText('Shells Collected: ' + game.player.shells, canvas.width / 2, 380);

    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Continue to ' + FLOORS[game.currentFloor + 1].name, canvas.width / 2, 500);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 200);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText('Floor Reached: ' + FLOORS[game.currentFloor].name, canvas.width / 2, 300);
    ctx.fillText('Enemies Killed: ' + game.stats.enemiesKilled, canvas.width / 2, 340);
    ctx.fillText('Damage Dealt: ' + game.stats.damageDealt, canvas.width / 2, 380);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Try Again', canvas.width / 2, 500);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 150);

    ctx.fillStyle = '#44ff44';
    ctx.font = '24px Arial';
    ctx.fillText('You Have Conquered the Gungeon!', canvas.width / 2, 220);

    const elapsed = Math.floor((Date.now() - game.stats.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText('Time: ' + minutes + ':' + seconds.toString().padStart(2, '0'), canvas.width / 2, 300);
    ctx.fillText('Enemies Killed: ' + game.stats.enemiesKilled, canvas.width / 2, 340);
    ctx.fillText('Rooms Cleared: ' + game.stats.roomsCleared, canvas.width / 2, 380);
    ctx.fillText('Damage Dealt: ' + game.stats.damageDealt, canvas.width / 2, 420);
    ctx.fillText('Shells Collected: ' + game.player.shells, canvas.width / 2, 460);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Play Again', canvas.width / 2, 550);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 50, 220, 300);

    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const p = game.player;
    const info = [
        '=== DEBUG (Tab toggle) ===',
        'State: ' + game.state,
        'Floor: ' + (game.currentFloor + 1) + '/' + FLOORS.length,
        'Room: ' + (game.floor.currentRoomIndex + 1) + '/' + game.floor.rooms.length,
        'Room Type: ' + game.room.type,
        'Player X: ' + Math.floor(p.x),
        'Player Y: ' + Math.floor(p.y),
        'HP: ' + p.hp + '/' + p.maxHp,
        'Armor: ' + p.armor,
        'Blanks: ' + p.blanks,
        'Keys: ' + p.keys,
        'Shells: ' + p.shells,
        'Rolling: ' + p.rolling,
        'Invincible: ' + p.invincible,
        'Weapon: ' + WEAPONS[p.weapons[p.currentWeapon]].name,
        'Mag: ' + p.currentMag,
        'Enemies: ' + game.room.enemies.length,
        'Bullets: ' + game.room.bullets.length,
        'Player Bullets: ' + game.room.playerBullets.length,
        'Room Cleared: ' + game.room.cleared,
        'FPS: ' + Math.round(1000 / 16)
    ];

    info.forEach((text, i) => {
        ctx.fillText(text, 20, 68 + i * 14);
    });
}

// Start
init();
