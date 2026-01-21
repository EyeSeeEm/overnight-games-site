// Bullet Descent - Enter the Gungeon Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 24;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 9;

// Game state
const GameState = { MENU: 0, PLAYING: 1, PAUSED: 2, BOSS: 3, SHOP: 4, VICTORY: 5, GAME_OVER: 6 };
let state = GameState.MENU;
let lastTime = 0;
let deltaTime = 0;

// Floor data
const floorNames = ['Keep of the Lead Lord', 'Gungeon Proper', 'The Forge'];
let currentFloor = 0;
let rooms = [];
let currentRoom = 0;
let roomCleared = false;

// Player
const player = {
    x: 400, y: 300,
    width: 20, height: 24,
    speed: 150,
    hp: 6, maxHp: 6,
    armor: 1,
    blanks: 2,
    keys: 1,
    shells: 0,
    weapons: [],
    currentWeapon: 0,
    dodging: false,
    dodgeTime: 0,
    dodgeDuration: 0.5,
    iFrames: 0,
    dodgeDir: { x: 0, y: 0 },
    invincible: false,
    reloading: false,
    reloadTime: 0,
    fireTimer: 0
};

// Weapons database
const weaponData = {
    pistol: { name: 'Marine Pistol', damage: 5, fireRate: 4, magSize: 12, ammo: Infinity, spread: 0.05, bulletSpeed: 400, tier: 'D', auto: false },
    m1911: { name: 'M1911', damage: 7, fireRate: 5, magSize: 10, ammo: 80, spread: 0.03, bulletSpeed: 420, tier: 'C', auto: false },
    shotgun: { name: 'Shotgun', damage: 4, fireRate: 1.5, magSize: 8, ammo: 40, spread: 0.3, bulletSpeed: 350, pellets: 6, tier: 'C', auto: false },
    ak47: { name: 'AK-47', damage: 6, fireRate: 8, magSize: 30, ammo: 150, spread: 0.12, bulletSpeed: 380, tier: 'B', auto: true },
    railgun: { name: 'Railgun', damage: 50, fireRate: 0.5, magSize: 3, ammo: 15, spread: 0, bulletSpeed: 800, tier: 'B', auto: false, pierce: true },
    demonHead: { name: 'Demon Head', damage: 15, fireRate: 2, magSize: 6, ammo: 30, spread: 0.1, bulletSpeed: 300, tier: 'B', auto: false, homing: true }
};

// Enemy types
const enemyTypes = {
    bulletKin: { hp: 15, speed: 60, damage: 1, fireRate: 1.5, color: '#c4a035', width: 18, height: 22, pattern: 'single' },
    bandanaBullet: { hp: 15, speed: 55, damage: 1, fireRate: 1.2, color: '#c45535', width: 18, height: 22, pattern: 'spread3' },
    shotgunKin: { hp: 25, speed: 45, damage: 1, fireRate: 0.8, color: '#3565c4', width: 20, height: 24, pattern: 'spread6' },
    veteranBullet: { hp: 20, speed: 70, damage: 1, fireRate: 2, color: '#35c465', width: 18, height: 22, pattern: 'burst' },
    blobuloid: { hp: 20, speed: 40, damage: 1, fireRate: 0, color: '#65c435', width: 16, height: 16, pattern: 'none', splits: true },
    // Floor 2
    gunNut: { hp: 50, speed: 35, damage: 1.5, fireRate: 0, color: '#808080', width: 24, height: 26, pattern: 'none', melee: true, shield: true },
    gunjurer: { hp: 40, speed: 30, damage: 1, fireRate: 0.5, color: '#a040a0', width: 20, height: 24, pattern: 'ring', spawns: true },
    pinhead: { hp: 30, speed: 50, damage: 2, fireRate: 0.7, color: '#c08040', width: 18, height: 22, pattern: 'grenade' },
    // Floor 3
    forgeKnight: { hp: 60, speed: 50, damage: 1.5, fireRate: 1, color: '#ff6040', width: 22, height: 26, pattern: 'fire' },
    leadCube: { hp: 80, speed: 25, damage: 2, fireRate: 0, color: '#505050', width: 28, height: 28, pattern: 'none', rolling: true }
};

// Bosses
const bossData = {
    bulletKing: { name: 'Bullet King', hp: 600, color: '#ffd700', width: 48, height: 56, patterns: ['spin', 'burst', 'spread'] },
    beholster: { name: 'Beholster', hp: 800, color: '#9040c0', width: 56, height: 56, patterns: ['tentacles', 'beam', 'ring'] },
    dragun: { name: 'High Dragun', hp: 1500, color: '#ff4040', width: 80, height: 72, patterns: ['fire', 'rockets', 'storm'] }
};

// Game entities
let enemies = [];
let bullets = [];
let enemyBullets = [];
let pickups = [];
let objects = [];
let boss = null;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Initialize
function init() {
    setupInput();
    player.weapons.push(createWeapon('pistol'));
}

function createWeapon(type) {
    const data = weaponData[type];
    return {
        type,
        name: data.name,
        damage: data.damage,
        fireRate: data.fireRate,
        magSize: data.magSize,
        mag: data.magSize,
        ammo: data.ammo,
        spread: data.spread,
        bulletSpeed: data.bulletSpeed,
        tier: data.tier,
        auto: data.auto,
        pellets: data.pellets || 1,
        pierce: data.pierce || false,
        homing: data.homing || false
    };
}

function resetGame() {
    player.x = 400;
    player.y = 300;
    player.hp = 6;
    player.maxHp = 6;
    player.armor = 1;
    player.blanks = 2;
    player.keys = 1;
    player.shells = 0;
    player.weapons = [createWeapon('pistol')];
    player.currentWeapon = 0;
    player.dodging = false;
    player.invincible = false;

    currentFloor = 0;
    generateFloor();
    state = GameState.PLAYING;
}

function generateFloor() {
    rooms = [];
    const roomCount = 6 + currentFloor * 2;

    // Generate room layout
    for (let i = 0; i < roomCount; i++) {
        const room = {
            type: i === 0 ? 'start' : i === roomCount - 1 ? 'boss' :
                  i === Math.floor(roomCount / 2) ? 'shop' :
                  i === Math.floor(roomCount / 3) ? 'treasure' : 'combat',
            cleared: i === 0,
            enemies: [],
            objects: [],
            doors: { north: i > 0, south: i < roomCount - 1, east: false, west: false }
        };

        if (room.type === 'combat') {
            generateRoomEnemies(room);
        }
        generateRoomObjects(room);

        rooms.push(room);
    }

    currentRoom = 0;
    loadRoom(0);
}

function generateRoomEnemies(room) {
    const count = 3 + Math.floor(Math.random() * 3) + currentFloor;
    const types = getFloorEnemies();

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        room.enemies.push({
            type,
            x: 100 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 200),
            y: 80 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 160)
        });
    }
}

function getFloorEnemies() {
    if (currentFloor === 0) return ['bulletKin', 'bandanaBullet', 'shotgunKin', 'blobuloid'];
    if (currentFloor === 1) return ['veteranBullet', 'gunNut', 'gunjurer', 'pinhead', 'shotgunKin'];
    return ['forgeKnight', 'leadCube', 'veteranBullet', 'gunNut'];
}

function generateRoomObjects(room) {
    // Add tables and cover
    const objectCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < objectCount; i++) {
        const type = Math.random() < 0.5 ? 'table' : Math.random() < 0.7 ? 'crate' : 'barrel';
        room.objects.push({
            type,
            x: 60 + Math.random() * (ROOM_WIDTH * TILE_SIZE - 120),
            y: 60 + Math.random() * (ROOM_HEIGHT * TILE_SIZE - 120),
            flipped: false,
            hp: type === 'barrel' ? 10 : type === 'crate' ? 20 : 50
        });
    }
}

function loadRoom(index) {
    currentRoom = index;
    const room = rooms[index];

    enemies = [];
    objects = [];
    pickups = [];
    bullets = [];
    enemyBullets = [];
    boss = null;

    // Load enemies
    if (!room.cleared && room.type === 'combat') {
        room.enemies.forEach(e => {
            const data = enemyTypes[e.type];
            enemies.push({
                ...data,
                type: e.type,
                x: e.x,
                y: e.y,
                hp: data.hp,
                maxHp: data.hp,
                fireTimer: Math.random() * 2,
                stunned: 0
            });
        });
    }

    // Load objects
    room.objects.forEach(o => {
        objects.push({ ...o });
    });

    // Boss room
    if (room.type === 'boss' && !room.cleared) {
        const bossType = currentFloor === 0 ? 'bulletKing' : currentFloor === 1 ? 'beholster' : 'dragun';
        const data = bossData[bossType];
        boss = {
            ...data,
            type: bossType,
            x: ROOM_WIDTH * TILE_SIZE / 2,
            y: 100,
            hp: data.hp,
            maxHp: data.hp,
            phase: 0,
            patternTimer: 0,
            currentPattern: 0,
            fireTimer: 0
        };
        state = GameState.BOSS;
    }

    // Shop room
    if (room.type === 'shop') {
        generateShopItems();
    }

    // Treasure room
    if (room.type === 'treasure' && !room.cleared) {
        pickups.push({
            type: 'chest',
            x: ROOM_WIDTH * TILE_SIZE / 2,
            y: ROOM_HEIGHT * TILE_SIZE / 2,
            tier: Math.random() < 0.3 ? 'green' : Math.random() < 0.6 ? 'blue' : 'brown',
            locked: true
        });
    }

    // Center player
    player.x = ROOM_WIDTH * TILE_SIZE / 2;
    player.y = ROOM_HEIGHT * TILE_SIZE - 60;

    roomCleared = room.cleared;
}

function generateShopItems() {
    const items = [
        { type: 'heart', x: 150, y: 150, price: 20 },
        { type: 'armor', x: 250, y: 150, price: 25 },
        { type: 'blank', x: 350, y: 150, price: 15 },
        { type: 'key', x: 200, y: 220, price: 25 },
        { type: 'ammo', x: 300, y: 220, price: 30 }
    ];

    items.forEach(item => pickups.push({ ...item, shop: true }));
}

function setupInput() {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;

        if (e.key === 'Escape') {
            if (state === GameState.PLAYING || state === GameState.BOSS) {
                state = GameState.PAUSED;
            } else if (state === GameState.PAUSED) {
                state = GameState.PLAYING;
            }
        }

        // Weapon switch
        if (e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key) - 1;
            if (index < player.weapons.length) {
                player.currentWeapon = index;
            }
        }

        // Reload
        if (e.key.toLowerCase() === 'r' && !player.reloading) {
            startReload();
        }

        // Use blank
        if (e.key === 'q' && player.blanks > 0) {
            useBlank();
        }

        // Interact
        if (e.key.toLowerCase() === 'e') {
            interact();
        }
    });

    window.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', e => {
        mouse.down = true;
        if (state === GameState.MENU) {
            resetGame();
        } else if (state === GameState.VICTORY || state === GameState.GAME_OVER) {
            state = GameState.MENU;
        }
    });

    canvas.addEventListener('mouseup', () => {
        mouse.down = false;
    });

    canvas.addEventListener('wheel', e => {
        if (player.weapons.length > 1) {
            player.currentWeapon = (player.currentWeapon + (e.deltaY > 0 ? 1 : -1) + player.weapons.length) % player.weapons.length;
        }
    });
}

function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    if (weapon.mag < weapon.magSize && weapon.ammo > 0) {
        player.reloading = true;
        player.reloadTime = 1;
    }
}

function useBlank() {
    player.blanks--;
    enemyBullets = [];

    // Stun enemies
    enemies.forEach(e => e.stunned = 1);
    if (boss) boss.stunned = 0.5;
}

function interact() {
    // Flip tables
    objects.forEach(obj => {
        if (obj.type === 'table' && !obj.flipped) {
            const dx = obj.x - player.x;
            const dy = obj.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 40) {
                obj.flipped = true;
            }
        }
    });

    // Open chests / buy items
    pickups.forEach((p, i) => {
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
            if (p.type === 'chest') {
                if (p.locked && player.keys > 0) {
                    player.keys--;
                    p.locked = false;
                    // Spawn weapon
                    const weapons = ['m1911', 'shotgun', 'ak47'];
                    if (p.tier === 'green') weapons.push('railgun', 'demonHead');
                    const newWeapon = weapons[Math.floor(Math.random() * weapons.length)];
                    player.weapons.push(createWeapon(newWeapon));
                    pickups.splice(i, 1);
                }
            } else if (p.shop && p.price <= player.shells) {
                player.shells -= p.price;
                applyPickup(p);
                pickups.splice(i, 1);
            }
        }
    });
}

function applyPickup(pickup) {
    switch (pickup.type) {
        case 'heart':
            player.hp = Math.min(player.maxHp, player.hp + 2);
            break;
        case 'armor':
            player.armor++;
            break;
        case 'blank':
            player.blanks++;
            break;
        case 'key':
            player.keys++;
            break;
        case 'ammo':
            player.weapons.forEach(w => {
                if (w.ammo !== Infinity) {
                    w.ammo += Math.floor(w.magSize * 0.5);
                }
            });
            break;
        case 'shell':
            player.shells += pickup.amount || 5;
            break;
    }
}

function update(dt) {
    if (state === GameState.MENU || state === GameState.PAUSED ||
        state === GameState.VICTORY || state === GameState.GAME_OVER) {
        return;
    }

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    if (boss) updateBoss(dt);
    updatePickups(dt);
    checkRoomClear();
}

function updatePlayer(dt) {
    // Dodge roll
    if (player.dodging) {
        player.dodgeTime -= dt;
        player.x += player.dodgeDir.x * 300 * dt;
        player.y += player.dodgeDir.y * 300 * dt;

        // I-frames for first half of dodge
        if (player.dodgeTime > player.dodgeDuration * 0.5) {
            player.invincible = true;
        } else {
            player.invincible = false;
        }

        if (player.dodgeTime <= 0) {
            player.dodging = false;
            player.invincible = false;
        }
    } else {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const newX = player.x + dx * player.speed * dt;
        const newY = player.y + dy * player.speed * dt;

        if (!collidesWithObjects(newX, player.y, player.width, player.height)) {
            player.x = newX;
        }
        if (!collidesWithObjects(player.x, newY, player.width, player.height)) {
            player.y = newY;
        }

        // Bounds
        player.x = Math.max(30, Math.min(ROOM_WIDTH * TILE_SIZE - 30, player.x));
        player.y = Math.max(30, Math.min(ROOM_HEIGHT * TILE_SIZE - 30, player.y));

        // Start dodge roll
        if ((keys[' '] || keys['shift']) && (dx !== 0 || dy !== 0)) {
            player.dodging = true;
            player.dodgeTime = player.dodgeDuration;
            player.dodgeDir = { x: dx, y: dy };
            keys[' '] = false;
            keys['shift'] = false;
        }
    }

    // Shooting
    player.fireTimer -= dt;
    if (player.reloading) {
        player.reloadTime -= dt;
        if (player.reloadTime <= 0) {
            player.reloading = false;
            const weapon = player.weapons[player.currentWeapon];
            const needed = weapon.magSize - weapon.mag;
            const available = weapon.ammo === Infinity ? needed : Math.min(needed, weapon.ammo);
            weapon.mag += available;
            if (weapon.ammo !== Infinity) weapon.ammo -= available;
        }
    } else if (mouse.down && player.fireTimer <= 0 && !player.dodging) {
        const weapon = player.weapons[player.currentWeapon];
        if (weapon.mag > 0) {
            fireWeapon(weapon);
            player.fireTimer = 1 / weapon.fireRate;
        } else if (weapon.ammo > 0 || weapon.ammo === Infinity) {
            startReload();
        }
    }

    // I-frames countdown
    if (player.iFrames > 0) {
        player.iFrames -= dt;
        player.invincible = true;
    } else if (!player.dodging) {
        player.invincible = false;
    }
}

function fireWeapon(weapon) {
    weapon.mag--;

    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    for (let i = 0; i < weapon.pellets; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * weapon.spread;
        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(spreadAngle) * weapon.bulletSpeed,
            vy: Math.sin(spreadAngle) * weapon.bulletSpeed,
            damage: weapon.damage,
            pierce: weapon.pierce,
            homing: weapon.homing,
            pierced: []
        });
    }
}

function collidesWithObjects(x, y, w, h) {
    for (const obj of objects) {
        if (obj.type === 'table' && !obj.flipped) continue;
        const ox = obj.x - 15;
        const oy = obj.y - 15;
        const ow = 30;
        const oh = obj.flipped ? 15 : 30;

        if (x - w/2 < ox + ow && x + w/2 > ox && y - h/2 < oy + oh && y + h/2 > oy) {
            return true;
        }
    }
    return false;
}

function updateBullets(dt) {
    // Player bullets
    bullets = bullets.filter(b => {
        if (b.homing && enemies.length > 0) {
            // Find closest enemy
            let closest = null;
            let minDist = Infinity;
            enemies.forEach(e => {
                const dx = e.x - b.x;
                const dy = e.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });
            if (closest) {
                const angle = Math.atan2(closest.y - b.y, closest.x - b.x);
                const currentAngle = Math.atan2(b.vy, b.vx);
                const turnSpeed = 3 * dt;
                let diff = angle - currentAngle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.vx = Math.cos(newAngle) * speed;
                b.vy = Math.sin(newAngle) * speed;
            }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Check enemy hits
        let hit = false;
        enemies.forEach((e, i) => {
            if (b.pierced.includes(i)) return;
            const dx = e.x - b.x;
            const dy = e.y - b.y;
            if (Math.abs(dx) < e.width/2 + 5 && Math.abs(dy) < e.height/2 + 5) {
                e.hp -= b.damage;
                if (b.pierce) {
                    b.pierced.push(i);
                } else {
                    hit = true;
                }

                if (e.hp <= 0) {
                    // Drop shells
                    pickups.push({ type: 'shell', x: e.x, y: e.y, amount: Math.floor(Math.random() * 3) + 1 });

                    // Blobuloid splits
                    if (e.splits) {
                        for (let j = 0; j < 2; j++) {
                            enemies.push({
                                ...enemyTypes.blobuloid,
                                type: 'blobuloid',
                                x: e.x + (j === 0 ? -20 : 20),
                                y: e.y,
                                hp: 8,
                                maxHp: 8,
                                width: 12,
                                height: 12,
                                splits: false,
                                fireTimer: 1
                            });
                        }
                    }
                }
            }
        });

        // Boss hit
        if (boss) {
            const dx = boss.x - b.x;
            const dy = boss.y - b.y;
            if (Math.abs(dx) < boss.width/2 && Math.abs(dy) < boss.height/2) {
                boss.hp -= b.damage;
                hit = true;
            }
        }

        // Object hit
        objects.forEach(obj => {
            if (obj.hp > 0) {
                const dx = obj.x - b.x;
                const dy = obj.y - b.y;
                if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                    obj.hp -= b.damage;
                    hit = true;

                    if (obj.hp <= 0 && obj.type === 'barrel') {
                        // Explosion damage to enemies
                        enemies.forEach(e => {
                            const edx = e.x - obj.x;
                            const edy = e.y - obj.y;
                            if (Math.sqrt(edx*edx + edy*edy) < 60) {
                                e.hp -= 20;
                            }
                        });
                    }
                }
            }
        });

        // Remove destroyed objects
        objects = objects.filter(o => o.hp > 0);

        // Bounds check
        if (b.x < 0 || b.x > ROOM_WIDTH * TILE_SIZE || b.y < 0 || b.y > ROOM_HEIGHT * TILE_SIZE) {
            return false;
        }

        return !hit;
    });

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);

    // Enemy bullets
    enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Check player hit
        if (!player.invincible) {
            const dx = player.x - b.x;
            const dy = player.y - b.y;
            if (Math.abs(dx) < player.width/2 + 5 && Math.abs(dy) < player.height/2 + 5) {
                damagePlayer(b.damage);
                return false;
            }
        }

        // Check flipped table blocks
        for (const obj of objects) {
            if (obj.type === 'table' && obj.flipped) {
                const dx = obj.x - b.x;
                const dy = obj.y - b.y;
                if (Math.abs(dx) < 20 && Math.abs(dy) < 10) {
                    return false;
                }
            }
        }

        return b.x > 0 && b.x < ROOM_WIDTH * TILE_SIZE && b.y > 0 && b.y < ROOM_HEIGHT * TILE_SIZE;
    });
}

function damagePlayer(damage) {
    if (player.armor > 0) {
        player.armor--;
    } else {
        player.hp -= damage;
    }
    player.iFrames = 1;

    if (player.hp <= 0) {
        state = GameState.GAME_OVER;
    }
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        if (enemy.stunned > 0) {
            enemy.stunned -= dt;
            return;
        }

        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 50 && !enemy.melee) {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
        } else if (enemy.melee && dist > 30) {
            enemy.x += (dx / dist) * enemy.speed * 1.5 * dt;
            enemy.y += (dy / dist) * enemy.speed * 1.5 * dt;
        }

        // Fire
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0 && enemy.fireRate > 0) {
            enemy.fireTimer = 1 / enemy.fireRate + Math.random() * 0.5;
            fireEnemyPattern(enemy, dx, dy, dist);
        }

        // Melee damage
        if (enemy.melee && dist < 35 && !player.invincible) {
            damagePlayer(enemy.damage);
        }
    });
}

function fireEnemyPattern(enemy, dx, dy, dist) {
    const angle = Math.atan2(dy, dx);
    const bulletSpeed = 150;

    switch (enemy.pattern) {
        case 'single':
            enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * bulletSpeed, vy: Math.sin(angle) * bulletSpeed, damage: enemy.damage });
            break;
        case 'spread3':
            for (let i = -1; i <= 1; i++) {
                const a = angle + i * 0.2;
                enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, damage: enemy.damage });
            }
            break;
        case 'spread6':
            for (let i = -2; i <= 2; i++) {
                const a = angle + i * 0.15;
                enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * bulletSpeed * 0.8, vy: Math.sin(a) * bulletSpeed * 0.8, damage: enemy.damage });
            }
            break;
        case 'burst':
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (enemy.hp > 0) {
                        enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * bulletSpeed * 1.2, vy: Math.sin(angle) * bulletSpeed * 1.2, damage: enemy.damage });
                    }
                }, i * 100);
            }
            break;
        case 'ring':
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i;
                enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * bulletSpeed * 0.7, vy: Math.sin(a) * bulletSpeed * 0.7, damage: enemy.damage });
            }
            break;
        case 'fire':
            for (let i = -1; i <= 1; i++) {
                const a = angle + i * 0.3;
                enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, damage: enemy.damage, fire: true });
            }
            break;
    }
}

function updateBoss(dt) {
    if (!boss) return;

    if (boss.stunned > 0) {
        boss.stunned -= dt;
        return;
    }

    boss.patternTimer -= dt;
    boss.fireTimer -= dt;

    // Change pattern
    if (boss.patternTimer <= 0) {
        boss.currentPattern = (boss.currentPattern + 1) % boss.patterns.length;
        boss.patternTimer = 3 + Math.random() * 2;
    }

    // Move
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 100) {
        boss.x += (dx / dist) * 40 * dt;
        boss.y += (dy / dist) * 40 * dt;
    }

    // Attack patterns
    if (boss.fireTimer <= 0) {
        boss.fireTimer = 0.3;
        const angle = Math.atan2(dy, dx);
        const pattern = boss.patterns[boss.currentPattern];

        switch (pattern) {
            case 'spin':
                for (let i = 0; i < 12; i++) {
                    const a = (Math.PI * 2 / 12) * i + Date.now() / 500;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, damage: 1 });
                }
                break;
            case 'burst':
                for (let i = 0; i < 16; i++) {
                    const a = (Math.PI * 2 / 16) * i;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, damage: 1 });
                }
                break;
            case 'spread':
                for (let i = -3; i <= 3; i++) {
                    const a = angle + i * 0.15;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, damage: 1 });
                }
                break;
            case 'tentacles':
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 / 6) * i;
                    for (let j = 0; j < 3; j++) {
                        setTimeout(() => {
                            if (boss && boss.hp > 0) {
                                enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * (100 + j * 30), vy: Math.sin(a) * (100 + j * 30), damage: 1 });
                            }
                        }, j * 100);
                    }
                }
                break;
            case 'beam':
                for (let i = 0; i < 20; i++) {
                    const a = angle + (i - 10) * 0.03;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, damage: 1 });
                }
                boss.fireTimer = 1.5;
                break;
            case 'ring':
                for (let ring = 0; ring < 2; ring++) {
                    setTimeout(() => {
                        if (boss && boss.hp > 0) {
                            for (let i = 0; i < 16; i++) {
                                const a = (Math.PI * 2 / 16) * i + ring * 0.1;
                                enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, damage: 1 });
                            }
                        }
                    }, ring * 200);
                }
                break;
            case 'fire':
                for (let i = -4; i <= 4; i++) {
                    const a = angle + i * 0.1;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, damage: 1, fire: true });
                }
                break;
            case 'rockets':
                for (let i = 0; i < 4; i++) {
                    const a = angle + (i - 1.5) * 0.3;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, damage: 2, homing: true, speed: 100 });
                }
                boss.fireTimer = 1;
                break;
            case 'storm':
                for (let i = 0; i < 24; i++) {
                    const a = (Math.PI * 2 / 24) * i;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 100, vy: Math.sin(a) * 100, damage: 1 });
                }
                break;
        }
    }

    // Boss death
    if (boss.hp <= 0) {
        rooms[currentRoom].cleared = true;
        boss = null;
        state = GameState.PLAYING;

        // Drop reward
        pickups.push({ type: 'heart', x: ROOM_WIDTH * TILE_SIZE / 2, y: ROOM_HEIGHT * TILE_SIZE / 2 });

        // Check floor completion
        if (currentRoom === rooms.length - 1) {
            if (currentFloor < 2) {
                currentFloor++;
                generateFloor();
            } else {
                state = GameState.VICTORY;
            }
        }
    }
}

function updatePickups(dt) {
    pickups.forEach((p, i) => {
        if (p.shop) return;

        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30 && p.type !== 'chest') {
            applyPickup(p);
            pickups.splice(i, 1);
        }
    });
}

function checkRoomClear() {
    const room = rooms[currentRoom];
    if (room.type === 'combat' && !room.cleared && enemies.length === 0) {
        room.cleared = true;
        roomCleared = true;

        // Spawn rewards
        if (Math.random() < 0.3) {
            pickups.push({ type: 'heart', x: ROOM_WIDTH * TILE_SIZE / 2, y: ROOM_HEIGHT * TILE_SIZE / 2 });
        }
    }
}

function render() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === GameState.MENU) {
        renderMenu();
        return;
    }

    // Draw room
    renderRoom();

    // Draw objects
    objects.forEach(obj => {
        if (obj.type === 'table') {
            ctx.fillStyle = obj.flipped ? '#654321' : '#8b4513';
            if (obj.flipped) {
                ctx.fillRect(obj.x - 20, obj.y - 8, 40, 16);
            } else {
                ctx.fillRect(obj.x - 15, obj.y - 15, 30, 30);
            }
        } else if (obj.type === 'crate') {
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(obj.x - 12, obj.y - 12, 24, 24);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(obj.x - 12, obj.y - 12, 24, 24);
        } else if (obj.type === 'barrel') {
            ctx.fillStyle = '#8b0000';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff4500';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', obj.x, obj.y + 4);
        }
    });

    // Draw pickups
    pickups.forEach(p => {
        if (p.type === 'chest') {
            ctx.fillStyle = p.tier === 'green' ? '#228b22' : p.tier === 'blue' ? '#4169e1' : '#8b4513';
            ctx.fillRect(p.x - 15, p.y - 10, 30, 20);
            if (p.locked) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(p.x - 4, p.y - 5, 8, 10);
            }
        } else if (p.type === 'heart') {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(p.x - 5, p.y - 3, 6, 0, Math.PI * 2);
            ctx.arc(p.x + 5, p.y - 3, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(p.x - 11, p.y);
            ctx.lineTo(p.x, p.y + 12);
            ctx.lineTo(p.x + 11, p.y);
            ctx.fill();
        } else if (p.type === 'shell') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.shop) {
            // Shop item
            ctx.fillStyle = '#333';
            ctx.fillRect(p.x - 20, p.y - 20, 40, 40);
            ctx.fillStyle = p.type === 'heart' ? '#ff4444' :
                           p.type === 'armor' ? '#4488ff' :
                           p.type === 'blank' ? '#ff8844' :
                           p.type === 'key' ? '#ffd700' : '#44ff44';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(p.type === 'heart' ? '\u2665' :
                        p.type === 'armor' ? '\u26E8' :
                        p.type === 'blank' ? '\u25CE' :
                        p.type === 'key' ? '\u26BF' : '\u25A0', p.x, p.y + 7);
            ctx.fillStyle = '#ffd700';
            ctx.font = '10px Arial';
            ctx.fillText(`$${p.price}`, p.x, p.y + 30);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        // Bullet-themed body
        ctx.fillStyle = enemy.color;

        // Bullet shape
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - enemy.height/4, enemy.width/2, Math.PI, 0);
        ctx.rect(enemy.x - enemy.width/2, enemy.y - enemy.height/4, enemy.width, enemy.height * 0.6);
        ctx.fill();

        // Metallic band
        ctx.fillStyle = '#c0a030';
        ctx.fillRect(enemy.x - enemy.width/2, enemy.y + enemy.height/6, enemy.width, 4);

        // Face
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x - 4, enemy.y - 3, 3, 3);
        ctx.fillRect(enemy.x + 1, enemy.y - 3, 3, 3);

        // Angry expression
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x - 4, enemy.y - 6);
        ctx.lineTo(enemy.x - 1, enemy.y - 4);
        ctx.moveTo(enemy.x + 4, enemy.y - 6);
        ctx.lineTo(enemy.x + 1, enemy.y - 4);
        ctx.stroke();

        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height/2 - 10, 30, 4);
        ctx.fillStyle = '#f44';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.height/2 - 10, 30 * hpPercent, 4);
    });

    // Draw boss
    if (boss) {
        // Boss body
        ctx.fillStyle = boss.color;

        if (boss.type === 'bulletKing') {
            // Giant bullet with crown
            ctx.beginPath();
            ctx.arc(boss.x, boss.y - 10, boss.width/2, Math.PI, 0);
            ctx.rect(boss.x - boss.width/2, boss.y - 10, boss.width, boss.height * 0.7);
            ctx.fill();

            // Crown
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(boss.x - 20, boss.y - boss.height/2);
            ctx.lineTo(boss.x - 25, boss.y - boss.height/2 - 20);
            ctx.lineTo(boss.x - 10, boss.y - boss.height/2 - 10);
            ctx.lineTo(boss.x, boss.y - boss.height/2 - 25);
            ctx.lineTo(boss.x + 10, boss.y - boss.height/2 - 10);
            ctx.lineTo(boss.x + 25, boss.y - boss.height/2 - 20);
            ctx.lineTo(boss.x + 20, boss.y - boss.height/2);
            ctx.fill();
        } else if (boss.type === 'beholster') {
            // Giant eye
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.width/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.width/3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.width/6, 0, Math.PI * 2);
            ctx.fill();

            // Tentacles
            ctx.strokeStyle = boss.color;
            ctx.lineWidth = 6;
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 / 6) * i + Date.now() / 1000;
                ctx.beginPath();
                ctx.moveTo(boss.x, boss.y);
                ctx.lineTo(boss.x + Math.cos(a) * 50, boss.y + Math.sin(a) * 50);
                ctx.stroke();
            }
        } else if (boss.type === 'dragun') {
            // Dragon head
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.width/2, 0, Math.PI * 2);
            ctx.fill();

            // Horns
            ctx.beginPath();
            ctx.moveTo(boss.x - 30, boss.y - 20);
            ctx.lineTo(boss.x - 50, boss.y - 50);
            ctx.lineTo(boss.x - 20, boss.y - 30);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(boss.x + 30, boss.y - 20);
            ctx.lineTo(boss.x + 50, boss.y - 50);
            ctx.lineTo(boss.x + 20, boss.y - 30);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(boss.x - 15, boss.y - 10, 10, 0, Math.PI * 2);
            ctx.arc(boss.x + 15, boss.y - 10, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(boss.x - 15, boss.y - 10, 5, 0, Math.PI * 2);
            ctx.arc(boss.x + 15, boss.y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // HP bar
        const hpPercent = boss.hp / boss.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width/2 - 150, 20, 300, 20);
        ctx.fillStyle = '#f44';
        ctx.fillRect(canvas.width/2 - 150, 20, 300 * hpPercent, 20);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, canvas.width/2, 35);
    }

    // Draw bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemy bullets
    enemyBullets.forEach(b => {
        ctx.fillStyle = b.fire ? '#ff4400' : '#ff4444';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw player
    if (!player.invincible || Math.floor(Date.now() / 100) % 2) {
        // Body
        ctx.fillStyle = player.dodging ? '#666' : '#4488ff';
        ctx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);

        // Visor
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x - 6, player.y - player.height/2 + 4, 12, 6);

        // Gun arm pointing at mouse
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(player.x + Math.cos(angle) * 20, player.y + Math.sin(angle) * 20);
        ctx.stroke();
    }

    // HUD
    renderHUD();

    // Pause overlay
    if (state === GameState.PAUSED) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
        ctx.font = '18px Arial';
        ctx.fillText('Press ESC to resume', canvas.width/2, canvas.height/2 + 40);
    }

    // Victory
    if (state === GameState.VICTORY) {
        ctx.fillStyle = 'rgba(0,50,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText('You defeated the High Dragun!', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Click to return to menu', canvas.width/2, canvas.height/2 + 60);
    }

    // Game Over
    if (state === GameState.GAME_OVER) {
        ctx.fillStyle = 'rgba(50,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f44';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText(`Reached Floor ${currentFloor + 1}: ${floorNames[currentFloor]}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Click to return to menu', canvas.width/2, canvas.height/2 + 60);
    }
}

function renderMenu() {
    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BULLET DESCENT', canvas.width/2, 120);

    // Bullet character
    ctx.fillStyle = '#c4a035';
    ctx.beginPath();
    ctx.arc(canvas.width/2, 250, 40, Math.PI, 0);
    ctx.rect(canvas.width/2 - 40, 250, 80, 60);
    ctx.fill();

    ctx.fillStyle = '#c0a030';
    ctx.fillRect(canvas.width/2 - 40, 290, 80, 8);

    ctx.fillStyle = '#000';
    ctx.fillRect(canvas.width/2 - 15, 255, 10, 10);
    ctx.fillRect(canvas.width/2 + 5, 255, 10, 10);

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '18px Arial';
    ctx.fillText('WASD - Move', canvas.width/2, 380);
    ctx.fillText('Mouse - Aim & Shoot', canvas.width/2, 410);
    ctx.fillText('Space/Shift - Dodge Roll', canvas.width/2, 440);
    ctx.fillText('Q - Use Blank  |  R - Reload  |  E - Interact', canvas.width/2, 470);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Click to Start', canvas.width/2, 540);
}

function renderRoom() {
    // Floor tiles
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const isWall = x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1;
            ctx.fillStyle = isWall ? '#333' : '#2a2a3e';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (!isWall && (x + y) % 2 === 0) {
                ctx.fillStyle = '#252535';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Doors
    if (rooms.length === 0) return;
    const room = rooms[currentRoom];
    if (!room) return;
    ctx.fillStyle = room.cleared || room.type !== 'combat' ? '#4a4a5a' : '#2a2a3a';

    if (room.doors.north && currentRoom > 0) {
        ctx.fillRect((ROOM_WIDTH/2 - 1) * TILE_SIZE, 0, TILE_SIZE * 2, TILE_SIZE);
        if (room.cleared || room.type !== 'combat') {
            // Door indicator
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(ROOM_WIDTH/2 * TILE_SIZE, 5);
            ctx.lineTo(ROOM_WIDTH/2 * TILE_SIZE - 10, 20);
            ctx.lineTo(ROOM_WIDTH/2 * TILE_SIZE + 10, 20);
            ctx.fill();
        }
    }

    if (room.doors.south && currentRoom < rooms.length - 1) {
        ctx.fillStyle = room.cleared || room.type !== 'combat' ? '#4a4a5a' : '#2a2a3a';
        ctx.fillRect((ROOM_WIDTH/2 - 1) * TILE_SIZE, (ROOM_HEIGHT - 1) * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE);
    }

    // Room type indicator
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const roomLabel = room.type === 'shop' ? 'SHOP' : room.type === 'treasure' ? 'TREASURE' :
                      room.type === 'boss' ? 'BOSS' : room.type === 'start' ? 'START' : '';
    if (roomLabel) ctx.fillText(roomLabel, 10, canvas.height - 10);
}

function renderHUD() {
    // Background panel
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillRect(0, 0, canvas.width, 50);

    // Top bar: Floor info
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Floor ${currentFloor + 1}: ${floorNames[currentFloor]}`, canvas.width/2, 30);

    // Room progress
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`Room ${currentRoom + 1}/${rooms.length}`, canvas.width/2, 45);

    // Bottom bar
    ctx.textAlign = 'left';

    // Health
    ctx.fillStyle = '#f44';
    for (let i = 0; i < Math.ceil(player.maxHp / 2); i++) {
        const full = player.hp >= (i + 1) * 2;
        const half = player.hp === i * 2 + 1;
        ctx.font = '20px Arial';
        ctx.fillText(full ? '\u2665' : half ? '\u2661' : '\u2661', 10 + i * 25, canvas.height - 20);
        if (!full && !half) ctx.fillStyle = '#444';
        if (half) ctx.fillStyle = '#f44';
    }

    // Armor
    ctx.fillStyle = '#48f';
    for (let i = 0; i < player.armor; i++) {
        ctx.fillText('\u2726', 10 + Math.ceil(player.maxHp/2) * 25 + i * 20, canvas.height - 20);
    }

    // Blanks
    ctx.fillStyle = '#f84';
    ctx.fillText(`\u25CE x${player.blanks}`, 200, canvas.height - 20);

    // Keys
    ctx.fillStyle = '#fd0';
    ctx.fillText(`\u26BF x${player.keys}`, 280, canvas.height - 20);

    // Shells
    ctx.fillStyle = '#fd0';
    ctx.fillText(`$${player.shells}`, 360, canvas.height - 20);

    // Current weapon
    const weapon = player.weapons[player.currentWeapon];
    if (!weapon) return;
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(weapon.name, canvas.width - 10, canvas.height - 30);

    // Ammo
    ctx.fillStyle = player.reloading ? '#f84' : '#4f4';
    const ammoText = weapon.ammo === Infinity ? `${weapon.mag}/\u221E` : `${weapon.mag}/${weapon.ammo}`;
    ctx.fillText(player.reloading ? 'RELOADING...' : ammoText, canvas.width - 10, canvas.height - 12);

    // Weapon tier
    ctx.fillStyle = weapon.tier === 'D' ? '#8b4513' : weapon.tier === 'C' ? '#4169e1' : '#228b22';
    ctx.fillText(`[${weapon.tier}]`, canvas.width - 120, canvas.height - 30);

    // Mini map
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvas.width - 110, 5, 100, 40);

    for (let i = 0; i < rooms.length; i++) {
        const rx = canvas.width - 105 + (i % 6) * 15;
        const ry = 10 + Math.floor(i / 6) * 15;
        ctx.fillStyle = i === currentRoom ? '#4f4' : rooms[i].cleared ? '#666' : '#333';
        ctx.fillRect(rx, ry, 12, 12);

        if (rooms[i].type === 'boss') {
            ctx.fillStyle = '#f44';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('B', rx + 6, ry + 9);
        } else if (rooms[i].type === 'shop') {
            ctx.fillStyle = '#fd0';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('$', rx + 6, ry + 9);
        } else if (rooms[i].type === 'treasure') {
            ctx.fillStyle = '#4af';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('T', rx + 6, ry + 9);
        }
    }

    ctx.textAlign = 'left';
}

// Room transitions
function checkRoomTransition() {
    if (rooms.length === 0) return;
    const room = rooms[currentRoom];
    if (!room) return;
    if (!room.cleared && room.type === 'combat') return;

    // North door
    if (player.y < 20 && currentRoom > 0) {
        loadRoom(currentRoom - 1);
        player.y = ROOM_HEIGHT * TILE_SIZE - 50;
    }
    // South door
    if (player.y > ROOM_HEIGHT * TILE_SIZE - 20 && currentRoom < rooms.length - 1) {
        loadRoom(currentRoom + 1);
        player.y = 50;
    }
}

function gameLoop(time) {
    deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    update(deltaTime);
    checkRoomTransition();
    render();

    requestAnimationFrame(gameLoop);
}

// Start
init();
requestAnimationFrame(gameLoop);
