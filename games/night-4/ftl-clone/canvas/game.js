// FTL Clone - Faster Than Light Canvas Implementation
// Real-time with pause spaceship roguelike

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Colors
const COLORS = {
    BG: '#0a0a14',
    UI_DARK: '#1a1a2e',
    UI_BORDER: '#3a3a5c',
    UI_PANEL: '#141428',
    TEXT_WHITE: '#ffffff',
    TEXT_GREEN: '#00ff00',
    TEXT_RED: '#ff4444',
    TEXT_BLUE: '#4488ff',
    TEXT_ORANGE: '#ffaa00',
    SHIELDS: '#00ccff',
    WEAPONS: '#ff6600',
    ENGINES: '#ffff00',
    OXYGEN: '#88ff88',
    MEDBAY: '#00ff00',
    CREW_HUMAN: '#ffcc88',
    CREW_SELECTED: '#ffffff',
    FIRE: '#ff4400',
    HULL: '#666666',
    ROOM_FLOOR: '#2a2a3a',
    ROOM_WALL: '#4a4a5a',
    DOOR: '#5a5a6a',
    ENEMY: '#aa4444'
};

// Game state
const game = {
    state: 'menu', // menu, combat, map, event, paused, gameover, victory
    paused: false,
    fuel: 16,
    missiles: 8,
    droneParts: 4,
    scrap: 30,
    sector: 1,
    beacons: [],
    currentBeacon: 0,
    rebelFleet: 0,
    combatTimer: 0,
    currentEvent: null,
    // Stats
    stats: {
        beaconsVisited: 0,
        combatsWon: 0,
        scrapCollected: 0,
        damageDealt: 0,
        damageTaken: 0
    }
};

// Event templates
const EVENTS = [
    { title: 'Abandoned Station', text: 'You find an abandoned station. Scavengers have picked it clean, but you find some useful supplies.', reward: 'scrap', amount: 15 },
    { title: 'Distress Signal', text: 'A ship broadcasts a distress signal. You help repair their hull and they reward you with fuel.', reward: 'fuel', amount: 3 },
    { title: 'Merchant', text: 'A friendly merchant offers you supplies at a discount.', reward: 'scrap', amount: 25 },
    { title: 'Supply Cache', text: 'Hidden among the asteroids, you find a supply cache with missiles.', reward: 'missiles', amount: 4 },
    { title: 'Peaceful Sector', text: 'Nothing of interest at this beacon. You rest and perform minor repairs.', reward: 'hull', amount: 5 },
    { title: 'Store', text: 'You dock at a store and purchase supplies.', reward: 'store', amount: 0 }
];

// Player ship
const playerShip = {
    hull: 30,
    maxHull: 30,
    reactor: 8,
    usedPower: 0,
    shields: { level: 2, power: 2, layers: 1, maxLayers: 1, recharge: 0 },
    weapons: { level: 3, power: 2, slots: [] },
    engines: { level: 2, power: 1, evasion: 15 },
    oxygen: { level: 1, power: 1, rate: 100 },
    medbay: { level: 1, power: 1, healRate: 6.4 },
    piloting: { level: 1, manned: false },
    doors: { level: 1 },
    rooms: [],
    crew: [],
    ftlCharge: 0,
    ftlReady: false
};

// Enemy ship
let enemyShip = null;

// Weapons database
const WEAPONS = {
    basicLaser: { name: 'Basic Laser', power: 1, charge: 10, maxCharge: 10, shots: 1, damage: 1, fireChance: 0.1 },
    burstLaser: { name: 'Burst Laser II', power: 2, charge: 12, maxCharge: 12, shots: 3, damage: 1, fireChance: 0.1 },
    missile: { name: 'Artemis Missile', power: 1, charge: 10, maxCharge: 10, shots: 1, damage: 2, piercing: true, usesMissile: true },
    ionBlast: { name: 'Ion Blast', power: 1, charge: 8, maxCharge: 8, shots: 1, damage: 1, ion: true }
};

// Initialize player weapons
playerShip.weapons.slots = [
    { ...WEAPONS.basicLaser, charging: 0, ready: false },
    { ...WEAPONS.burstLaser, charging: 0, ready: false }
];

// Room layouts for player ship
function initPlayerRooms() {
    const ROOM_SIZE = 60;
    playerShip.rooms = [
        { id: 'shields', x: 80, y: 200, w: ROOM_SIZE * 2, h: ROOM_SIZE, system: 'shields', oxygen: 100, fire: 0, breach: false },
        { id: 'weapons', x: 80, y: 280, w: ROOM_SIZE * 2, h: ROOM_SIZE, system: 'weapons', oxygen: 100, fire: 0, breach: false },
        { id: 'piloting', x: 340, y: 240, w: ROOM_SIZE, h: ROOM_SIZE, system: 'piloting', oxygen: 100, fire: 0, breach: false },
        { id: 'engines', x: 20, y: 240, w: ROOM_SIZE, h: ROOM_SIZE, system: 'engines', oxygen: 100, fire: 0, breach: false },
        { id: 'medbay', x: 200, y: 200, w: ROOM_SIZE, h: ROOM_SIZE, system: 'medbay', oxygen: 100, fire: 0, breach: false },
        { id: 'oxygen', x: 200, y: 280, w: ROOM_SIZE, h: ROOM_SIZE, system: 'oxygen', oxygen: 100, fire: 0, breach: false },
        { id: 'doors', x: 280, y: 240, w: ROOM_SIZE, h: ROOM_SIZE, system: 'doors', oxygen: 100, fire: 0, breach: false }
    ];
}

// Initialize crew
function initCrew() {
    playerShip.crew = [
        { id: 1, name: 'Captain', hp: 100, maxHp: 100, x: 360, y: 260, room: 'piloting', selected: false, skill: { piloting: 1, weapons: 0, shields: 0, engines: 0 } },
        { id: 2, name: 'Engineer', hp: 100, maxHp: 100, x: 40, y: 260, room: 'engines', selected: false, skill: { piloting: 0, weapons: 0, shields: 0, engines: 1 } },
        { id: 3, name: 'Gunner', hp: 100, maxHp: 100, x: 100, y: 300, room: 'weapons', selected: false, skill: { piloting: 0, weapons: 1, shields: 0, engines: 0 } }
    ];
}

// Generate enemy ship
function generateEnemy(difficulty) {
    const baseHull = 10 + difficulty * 5;
    const shields = Math.min(4, Math.floor(difficulty / 2));

    enemyShip = {
        hull: baseHull,
        maxHull: baseHull,
        shields: { level: shields + 1, power: shields, layers: shields, maxLayers: shields, recharge: 0 },
        weapons: { slots: [] },
        evasion: 10 + difficulty * 5,
        x: 600,
        y: 150,
        w: 200,
        h: 150,
        rooms: [
            { id: 'bridge', x: 700, y: 180, w: 60, h: 60, system: 'piloting', oxygen: 100 },
            { id: 'weapons', x: 620, y: 180, w: 60, h: 60, system: 'weapons', oxygen: 100 },
            { id: 'shields', x: 700, y: 250, w: 60, h: 60, system: 'shields', oxygen: 100 },
            { id: 'engines', x: 620, y: 250, w: 60, h: 60, system: 'engines', oxygen: 100 }
        ],
        aiTimer: 0
    };

    // Add weapons based on difficulty
    if (difficulty >= 1) {
        enemyShip.weapons.slots.push({ ...WEAPONS.basicLaser, charging: 0, ready: false });
    }
    if (difficulty >= 3) {
        enemyShip.weapons.slots.push({ ...WEAPONS.basicLaser, charging: 0, ready: false });
    }
    if (difficulty >= 5) {
        enemyShip.weapons.slots.push({ ...WEAPONS.missile, charging: 0, ready: false });
    }
}

// Generate sector map
function generateSectorMap() {
    game.beacons = [];
    const numBeacons = 8 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numBeacons; i++) {
        const beacon = {
            id: i,
            x: 100 + Math.random() * (WIDTH - 300),
            y: 100 + Math.random() * (HEIGHT - 300),
            type: Math.random() < 0.3 ? 'store' : (Math.random() < 0.5 ? 'combat' : 'event'),
            visited: false,
            connected: []
        };
        game.beacons.push(beacon);
    }

    // Add exit beacon
    game.beacons.push({
        id: numBeacons,
        x: WIDTH - 150,
        y: HEIGHT / 2,
        type: 'exit',
        visited: false,
        connected: []
    });

    // Connect beacons
    game.beacons.forEach((beacon, i) => {
        game.beacons.forEach((other, j) => {
            if (i !== j) {
                const dist = Math.hypot(beacon.x - other.x, beacon.y - other.y);
                if (dist < 200) {
                    beacon.connected.push(j);
                }
            }
        });
    });

    game.currentBeacon = 0;
    game.beacons[0].visited = true;
    game.rebelFleet = 0;
}

// Input handling
let mouseX = 0, mouseY = 0;
let selectedCrew = null;
let targetingWeapon = null;

// Visual effects
const projectiles = [];
const floatingTexts = [];
const muzzleFlashes = [];

// Starfield
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * 1024,
        y: Math.random() * 768,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2
    });
}

function renderStarfield() {
    stars.forEach(star => {
        star.twinkle += 0.02;
        const alpha = star.brightness + Math.sin(star.twinkle) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function addProjectile(x, y, targetX, targetY, color, piercing) {
    projectiles.push({
        x, y, targetX, targetY, color, piercing,
        speed: 400,
        trail: []
    });
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        life: 1.5,
        vy: -30
    });
}

function addMuzzleFlash(x, y, color) {
    muzzleFlashes.push({
        x, y, color,
        life: 0.15,
        size: 20 + Math.random() * 10
    });
}

// Screen shake
let screenShake = { x: 0, y: 0, duration: 0, intensity: 0 };

function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

// Damage flash
let damageFlash = 0;
let enemyDamageFlash = 0;

function triggerDamageFlash() {
    damageFlash = 0.4;
}

function triggerEnemyDamageFlash() {
    enemyDamageFlash = 0.3;
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', handleClick);
document.addEventListener('keydown', handleKeydown);

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.state === 'menu') {
        // Start game button
        if (x > WIDTH/2 - 100 && x < WIDTH/2 + 100 && y > HEIGHT/2 && y < HEIGHT/2 + 50) {
            startGame();
        }
        return;
    }

    if (game.state === 'map') {
        // Click on beacon to jump
        for (const beacon of game.beacons) {
            const dist = Math.hypot(x - beacon.x, y - beacon.y);
            if (dist < 20) {
                if (game.beacons[game.currentBeacon].connected.includes(beacon.id) && game.fuel > 0) {
                    jumpToBeacon(beacon.id);
                }
                return;
            }
        }
        return;
    }

    if (game.state === 'combat') {
        // Handle combat clicks
        if (targetingWeapon !== null) {
            // Target enemy room
            for (const room of enemyShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    fireWeapon(targetingWeapon, room);
                    targetingWeapon = null;
                    return;
                }
            }
            // Target enemy hull
            if (x >= enemyShip.x && x <= enemyShip.x + enemyShip.w && y >= enemyShip.y && y <= enemyShip.y + enemyShip.h) {
                fireWeapon(targetingWeapon, null);
                targetingWeapon = null;
                return;
            }
            targetingWeapon = null;
            return;
        }

        // Select crew
        for (const crew of playerShip.crew) {
            const dist = Math.hypot(x - crew.x, y - crew.y);
            if (dist < 15) {
                playerShip.crew.forEach(c => c.selected = false);
                crew.selected = true;
                selectedCrew = crew;
                return;
            }
        }

        // Move selected crew to room
        if (selectedCrew) {
            for (const room of playerShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    selectedCrew.targetX = room.x + room.w/2;
                    selectedCrew.targetY = room.y + room.h/2;
                    selectedCrew.targetRoom = room.id;
                    return;
                }
            }
        }

        // Click weapon to start targeting
        const weaponY = HEIGHT - 100;
        playerShip.weapons.slots.forEach((weapon, i) => {
            const wx = 200 + i * 120;
            if (x >= wx && x <= wx + 100 && y >= weaponY && y <= weaponY + 40) {
                if (weapon.ready) {
                    targetingWeapon = i;
                }
            }
        });

        // Power buttons (simplified - click on system names)
        const powerY = HEIGHT - 180;
        const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
        systems.forEach((sys, i) => {
            const px = 20 + i * 100;
            if (x >= px && x <= px + 90 && y >= powerY && y <= powerY + 60) {
                if (e.shiftKey) {
                    // Remove power
                    if (playerShip[sys].power > 0) {
                        playerShip[sys].power--;
                        updatePowerUsage();
                    }
                } else {
                    // Add power
                    if (playerShip.usedPower < playerShip.reactor && playerShip[sys].power < playerShip[sys].level) {
                        playerShip[sys].power++;
                        updatePowerUsage();
                    }
                }
            }
        });

        // FTL button
        if (x >= WIDTH - 120 && x <= WIDTH - 20 && y >= 20 && y <= 60) {
            if (playerShip.ftlReady) {
                endCombat(true);
            }
        }

        return;
    }

    if (game.state === 'event') {
        // Handle event choices
        // Simplified - click anywhere to continue
        game.state = 'map';
        return;
    }
}

function handleKeydown(e) {
    if (e.key === ' ' || e.key === 'Escape') {
        if (game.state === 'combat') {
            game.paused = !game.paused;
        }
    }

    if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (game.state === 'combat' && idx < playerShip.weapons.slots.length) {
            const weapon = playerShip.weapons.slots[idx];
            if (weapon.ready) {
                targetingWeapon = idx;
            }
        }
    }

    // Power shortcuts - Q/A: Shields, W/S: Weapons, E/D: Engines, R/F: O2, T/G: Medbay
    if (game.state === 'combat') {
        const powerKeys = {
            'q': { sys: 'shields', add: true }, 'a': { sys: 'shields', add: false },
            'w': { sys: 'weapons', add: true }, 's': { sys: 'weapons', add: false },
            'e': { sys: 'engines', add: true }, 'd': { sys: 'engines', add: false },
            'r': { sys: 'oxygen', add: true }, 'f': { sys: 'oxygen', add: false },
            't': { sys: 'medbay', add: true }, 'g': { sys: 'medbay', add: false }
        };

        const action = powerKeys[e.key.toLowerCase()];
        if (action) {
            const sys = playerShip[action.sys];
            if (action.add) {
                if (playerShip.usedPower < playerShip.reactor && sys.power < sys.level) {
                    sys.power++;
                    updatePowerUsage();
                }
            } else {
                if (sys.power > 0) {
                    sys.power--;
                    updatePowerUsage();
                }
            }
        }
    }
}

function updatePowerUsage() {
    playerShip.usedPower = playerShip.shields.power + playerShip.weapons.power +
                           playerShip.engines.power + playerShip.oxygen.power + playerShip.medbay.power;

    // Update shield layers based on power
    playerShip.shields.maxLayers = Math.floor(playerShip.shields.power / 2);
    if (playerShip.shields.layers > playerShip.shields.maxLayers) {
        playerShip.shields.layers = playerShip.shields.maxLayers;
    }

    // Update evasion based on engine power
    if (playerShip.engines.power > 0 && playerShip.piloting.manned) {
        playerShip.engines.evasion = 5 + playerShip.engines.power * 5;
    } else {
        playerShip.engines.evasion = 0;
    }
}

function startGame() {
    game.state = 'map';
    game.sector = 1;
    game.fuel = 16;
    game.missiles = 8;
    game.scrap = 30;

    // Reset stats
    game.stats = {
        beaconsVisited: 0,
        combatsWon: 0,
        scrapCollected: 0,
        damageDealt: 0,
        damageTaken: 0
    };

    initPlayerRooms();
    initCrew();
    generateSectorMap();

    playerShip.hull = playerShip.maxHull;
    updatePowerUsage();
}

function jumpToBeacon(beaconId) {
    game.fuel--;
    game.currentBeacon = beaconId;
    game.beacons[beaconId].visited = true;
    game.stats.beaconsVisited++;

    const beacon = game.beacons[beaconId];

    if (beacon.type === 'exit') {
        // Go to next sector
        game.sector++;
        if (game.sector > 8) {
            game.state = 'victory';
        } else {
            generateSectorMap();
        }
    } else if (beacon.type === 'combat') {
        startCombat();
    } else if (beacon.type === 'store') {
        // Store event
        game.currentEvent = EVENTS[5]; // Store event
        const heal = 5 + Math.floor(Math.random() * 5);
        playerShip.hull = Math.min(playerShip.maxHull, playerShip.hull + heal);
        game.scrap += 10 + Math.floor(Math.random() * 20);
        game.currentEvent = { ...EVENTS[5], extraText: `+${heal} Hull, +Scrap` };
        game.state = 'event';
    } else {
        // Random event
        const roll = Math.random();
        if (roll < 0.3) {
            startCombat();
        } else {
            // Pick random non-combat event
            const eventIdx = Math.floor(Math.random() * 5);
            const event = EVENTS[eventIdx];
            game.currentEvent = { ...event };

            // Apply reward
            switch (event.reward) {
                case 'scrap':
                    game.scrap += event.amount + Math.floor(Math.random() * 10);
                    game.currentEvent.extraText = `+${event.amount} Scrap`;
                    break;
                case 'fuel':
                    game.fuel += event.amount;
                    game.currentEvent.extraText = `+${event.amount} Fuel`;
                    break;
                case 'missiles':
                    game.missiles += event.amount;
                    game.currentEvent.extraText = `+${event.amount} Missiles`;
                    break;
                case 'hull':
                    playerShip.hull = Math.min(playerShip.maxHull, playerShip.hull + event.amount);
                    game.currentEvent.extraText = `+${event.amount} Hull`;
                    break;
            }
            game.state = 'event';
        }
    }

    // Advance rebel fleet
    game.rebelFleet = Math.min(WIDTH - 200, game.rebelFleet + 30);
}

function startCombat() {
    game.state = 'combat';
    game.paused = false;
    game.combatTimer = 0;

    generateEnemy(game.sector);

    // Reset weapons
    playerShip.weapons.slots.forEach(w => {
        w.charging = 0;
        w.ready = false;
    });

    playerShip.ftlCharge = 0;
    playerShip.ftlReady = false;
}

function fireWeapon(weaponIdx, targetRoom) {
    const weapon = playerShip.weapons.slots[weaponIdx];
    if (!weapon.ready) return;

    if (weapon.usesMissile && game.missiles <= 0) return;
    if (weapon.usesMissile) game.missiles--;

    weapon.ready = false;
    weapon.charging = 0;

    // Get weapon source position (from weapons room)
    const weaponRoom = playerShip.rooms.find(r => r.system === 'weapons');
    const startX = weaponRoom.x + weaponRoom.w;
    const startY = weaponRoom.y + weaponRoom.h / 2;

    // Get target position
    let targetX = enemyShip.x + enemyShip.w / 2;
    let targetY = enemyShip.y + enemyShip.h / 2;
    if (targetRoom) {
        targetX = targetRoom.x + targetRoom.w / 2;
        targetY = targetRoom.y + targetRoom.h / 2;
    }

    // Fire shots with visual projectiles
    for (let i = 0; i < weapon.shots; i++) {
        setTimeout(() => {
            // Add slight offset for multiple shots
            const offsetY = (i - (weapon.shots - 1) / 2) * 10;
            const projColor = weapon.ion ? COLORS.SHIELDS : (weapon.usesMissile ? COLORS.TEXT_RED : COLORS.WEAPONS);
            addProjectile(startX, startY + offsetY, targetX + (Math.random() - 0.5) * 20, targetY + offsetY, projColor, weapon.piercing);
            addMuzzleFlash(startX, startY + offsetY, projColor);

            // Delayed hit resolution
            setTimeout(() => {
                if (!enemyShip) return;

                // Check evasion
                if (!weapon.piercing && Math.random() * 100 < enemyShip.evasion) {
                    addFloatingText(targetX, targetY, 'MISS', COLORS.TEXT_WHITE);
                    return;
                }

                // Check shields
                if (!weapon.piercing && enemyShip.shields.layers > 0) {
                    enemyShip.shields.layers--;
                    enemyShip.shields.recharge = 0;
                    addFloatingText(targetX, targetY, 'SHIELD', COLORS.SHIELDS);
                    if (weapon.ion) {
                        addFloatingText(targetX, targetY - 20, 'ION', COLORS.SHIELDS);
                    }
                    return;
                }

                // Deal damage
                enemyShip.hull -= weapon.damage;
                game.stats.damageDealt += weapon.damage;
                addFloatingText(targetX, targetY, `-${weapon.damage}`, COLORS.TEXT_RED);
                triggerEnemyDamageFlash();

                // Fire chance
                if (Math.random() < weapon.fireChance && targetRoom) {
                    addFloatingText(targetX, targetY - 20, 'FIRE!', COLORS.FIRE);
                }

                // Check victory
                if (enemyShip.hull <= 0) {
                    addFloatingText(targetX, targetY, 'DESTROYED', COLORS.TEXT_GREEN);
                    setTimeout(() => endCombat(true), 500);
                }
            }, 400);
        }, i * 200);
    }
}

function endCombat(victory) {
    if (victory) {
        game.stats.combatsWon++;
        // Rewards
        const scrapReward = 15 + Math.floor(Math.random() * 20) + game.sector * 5;
        game.scrap += scrapReward;
        game.stats.scrapCollected += scrapReward;
        game.fuel += Math.floor(Math.random() * 3);
        if (Math.random() < 0.3) {
            game.missiles += 2;
        }
    }

    enemyShip = null;
    game.state = 'map';
}

// Update loop
function update(dt) {
    if (game.state === 'combat' && !game.paused) {
        game.combatTimer += dt;

        // Update crew movement
        playerShip.crew.forEach(crew => {
            if (crew.targetX !== undefined) {
                const dx = crew.targetX - crew.x;
                const dy = crew.targetY - crew.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 5) {
                    crew.x += (dx / dist) * 100 * dt;
                    crew.y += (dy / dist) * 100 * dt;
                } else {
                    crew.x = crew.targetX;
                    crew.y = crew.targetY;
                    crew.room = crew.targetRoom;
                    delete crew.targetX;
                    delete crew.targetY;
                    delete crew.targetRoom;
                }
            }
        });

        // Check piloting manned
        playerShip.piloting.manned = playerShip.crew.some(c => c.room === 'piloting');
        updatePowerUsage();

        // Update player weapons
        playerShip.weapons.slots.forEach((weapon, i) => {
            if (i < playerShip.weapons.power) {
                if (!weapon.ready) {
                    weapon.charging += dt;
                    if (weapon.charging >= weapon.maxCharge) {
                        weapon.ready = true;
                        weapon.charging = weapon.maxCharge;
                    }
                }
            }
        });

        // Update player shields
        if (playerShip.shields.power > 0 && playerShip.shields.layers < playerShip.shields.maxLayers) {
            playerShip.shields.recharge += dt;
            if (playerShip.shields.recharge >= 2) {
                playerShip.shields.layers++;
                playerShip.shields.recharge = 0;
            }
        }

        // Update FTL charge
        if (playerShip.engines.power > 0) {
            playerShip.ftlCharge += dt * (0.5 + playerShip.engines.power * 0.2);
            if (playerShip.ftlCharge >= 15) {
                playerShip.ftlReady = true;
                playerShip.ftlCharge = 15;
            }
        }

        // Update medbay
        if (playerShip.medbay.power > 0) {
            playerShip.crew.forEach(crew => {
                if (crew.room === 'medbay' && crew.hp < crew.maxHp) {
                    crew.hp = Math.min(crew.maxHp, crew.hp + playerShip.medbay.healRate * dt);
                }
            });
        }

        // Enemy AI
        if (enemyShip) {
            // Recharge shields
            if (enemyShip.shields.layers < enemyShip.shields.maxLayers) {
                enemyShip.shields.recharge += dt;
                if (enemyShip.shields.recharge >= 2.5) {
                    enemyShip.shields.layers++;
                    enemyShip.shields.recharge = 0;
                }
            }

            // Charge and fire weapons
            enemyShip.weapons.slots.forEach(weapon => {
                if (!weapon.ready) {
                    weapon.charging += dt;
                    if (weapon.charging >= weapon.maxCharge) {
                        weapon.ready = true;
                    }
                } else {
                    // Fire at player
                    enemyFireWeapon(weapon);
                }
            });
        }
    }

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
            projectiles.splice(i, 1);
        } else {
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 8) p.trail.shift();
            p.x += (dx / dist) * p.speed * dt;
            p.y += (dy / dist) * p.speed * dt;
        }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy * dt;
        t.life -= dt;
        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // Update muzzle flashes
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        const f = muzzleFlashes[i];
        f.life -= dt;
        if (f.life <= 0) {
            muzzleFlashes.splice(i, 1);
        }
    }

    // Update screen shake
    updateScreenShake(dt);

    // Update damage flash
    if (damageFlash > 0) {
        damageFlash -= dt * 2;
    }
    if (enemyDamageFlash > 0) {
        enemyDamageFlash -= dt * 2;
    }

    // Fire spread (simplified)
    if (game.state === 'combat') {
        playerShip.rooms.forEach(room => {
            if (room.fire > 0) {
                room.fire = Math.max(0, room.fire - dt * 2); // Fire slowly dies
            }
        });
    }
}

function enemyFireWeapon(weapon) {
    weapon.ready = false;
    weapon.charging = 0;

    // Get enemy weapon position
    const startX = enemyShip.x;
    const startY = enemyShip.y + enemyShip.h / 2;

    // Target random player room
    const targetRoom = playerShip.rooms[Math.floor(Math.random() * playerShip.rooms.length)];
    const targetX = targetRoom.x + targetRoom.w / 2;
    const targetY = targetRoom.y + targetRoom.h / 2;

    for (let i = 0; i < weapon.shots; i++) {
        setTimeout(() => {
            // Add projectile visual
            const offsetY = (i - (weapon.shots - 1) / 2) * 10;
            const projColor = weapon.usesMissile ? COLORS.TEXT_RED : COLORS.ENEMY;
            addProjectile(startX, startY + offsetY, targetX, targetY + offsetY, projColor, weapon.piercing);
            addMuzzleFlash(startX, startY + offsetY, projColor);

            // Delayed hit resolution
            setTimeout(() => {
                // Check player evasion
                if (!weapon.piercing && Math.random() * 100 < playerShip.engines.evasion) {
                    addFloatingText(targetX, targetY, 'EVADE', COLORS.TEXT_GREEN);
                    return;
                }

                // Check shields
                if (!weapon.piercing && playerShip.shields.layers > 0) {
                    playerShip.shields.layers--;
                    playerShip.shields.recharge = 0;
                    addFloatingText(targetX, targetY, 'SHIELD', COLORS.SHIELDS);
                    return;
                }

                // Deal damage
                playerShip.hull -= weapon.damage;
                game.stats.damageTaken += weapon.damage;
                addFloatingText(targetX, targetY, `-${weapon.damage}`, COLORS.TEXT_RED);
                triggerScreenShake(8, 0.3);
                triggerDamageFlash();

                // Random room damage (simplified)
                if (Math.random() < weapon.fireChance) {
                    targetRoom.fire = Math.min(100, targetRoom.fire + 20);
                    addFloatingText(targetX, targetY - 20, 'FIRE!', COLORS.FIRE);
                }

                // Check game over
                if (playerShip.hull <= 0) {
                    addFloatingText(WIDTH / 2, HEIGHT / 2, 'SHIP DESTROYED', COLORS.TEXT_RED);
                    triggerScreenShake(20, 1.0);
                    setTimeout(() => { game.state = 'gameover'; }, 1000);
                }
            }, 400);
        }, i * 200);
    }
}

// Render functions
function render() {
    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (game.state === 'menu') {
        renderMenu();
    } else if (game.state === 'map') {
        renderMap();
    } else if (game.state === 'combat') {
        renderCombat();
    } else if (game.state === 'event') {
        renderEvent();
    } else if (game.state === 'gameover') {
        renderGameOver();
    } else if (game.state === 'victory') {
        renderVictory();
    }

    // Damage flash overlay
    if (damageFlash > 0 && game.state === 'combat') {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Low hull warning vignette
    if (game.state === 'combat' && playerShip.hull / playerShip.maxHull < 0.3) {
        const pulse = 0.2 + Math.sin(Date.now() / 200) * 0.1;
        const gradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, HEIGHT/3, WIDTH/2, HEIGHT/2, HEIGHT);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${pulse})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    ctx.restore(); // Reset screen shake transform
}

function renderMenu() {
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FTL CLONE', WIDTH/2, HEIGHT/3);

    ctx.font = '16px monospace';
    ctx.fillText('Faster Than Light - Canvas Edition', WIDTH/2, HEIGHT/3 + 40);

    // Start button
    ctx.fillStyle = COLORS.UI_DARK;
    ctx.fillRect(WIDTH/2 - 100, HEIGHT/2, 200, 50);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(WIDTH/2 - 100, HEIGHT/2, 200, 50);

    ctx.fillStyle = COLORS.TEXT_GREEN;
    ctx.font = '20px monospace';
    ctx.fillText('START GAME', WIDTH/2, HEIGHT/2 + 32);

    ctx.fillStyle = COLORS.TEXT_BLUE;
    ctx.font = '14px monospace';
    ctx.fillText('Space to Pause | 1-4 to Select Weapons', WIDTH/2, HEIGHT - 100);
    ctx.fillText('Click Rooms to Move Crew | Click to Target', WIDTH/2, HEIGHT - 80);
}

function renderMap() {
    // Starfield background
    renderStarfield();

    // Sector title
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Sector ${game.sector}`, 20, 30);

    // Resources
    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.TEXT_ORANGE;
    ctx.fillText(`Fuel: ${game.fuel}`, 20, 60);
    ctx.fillStyle = COLORS.TEXT_RED;
    ctx.fillText(`Missiles: ${game.missiles}`, 120, 60);
    ctx.fillStyle = COLORS.TEXT_GREEN;
    ctx.fillText(`Scrap: ${game.scrap}`, 240, 60);
    ctx.fillStyle = COLORS.SHIELDS;
    ctx.fillText(`Hull: ${playerShip.hull}/${playerShip.maxHull}`, 360, 60);

    // Rebel fleet progress
    ctx.fillStyle = COLORS.TEXT_RED;
    ctx.fillRect(0, HEIGHT - 30, game.rebelFleet, 30);
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '12px monospace';
    ctx.fillText('REBEL FLEET', 10, HEIGHT - 10);

    // Draw beacon connections
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 1;
    game.beacons.forEach(beacon => {
        beacon.connected.forEach(connId => {
            const other = game.beacons[connId];
            ctx.beginPath();
            ctx.moveTo(beacon.x, beacon.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
        });
    });

    // Draw beacons
    game.beacons.forEach((beacon, i) => {
        let color = COLORS.UI_BORDER;
        if (beacon.visited) color = COLORS.TEXT_BLUE;
        if (i === game.currentBeacon) color = COLORS.TEXT_GREEN;
        if (beacon.type === 'exit') color = COLORS.ENGINES;
        if (beacon.x < game.rebelFleet) color = COLORS.TEXT_RED;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(beacon.x, beacon.y, beacon.type === 'exit' ? 15 : 10, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        if (beacon.type === 'store') ctx.fillText('STORE', beacon.x, beacon.y + 25);
        if (beacon.type === 'exit') ctx.fillText('EXIT', beacon.x, beacon.y + 30);

        // Hover tooltip
        const dist = Math.hypot(mouseX - beacon.x, mouseY - beacon.y);
        if (dist < 20 && i !== game.currentBeacon) {
            // Check if connected
            const current = game.beacons[game.currentBeacon];
            const isConnected = current.connected.includes(i);

            ctx.fillStyle = COLORS.UI_PANEL;
            ctx.fillRect(beacon.x + 15, beacon.y - 40, 100, 50);
            ctx.strokeStyle = isConnected ? COLORS.TEXT_GREEN : COLORS.TEXT_RED;
            ctx.lineWidth = 2;
            ctx.strokeRect(beacon.x + 15, beacon.y - 40, 100, 50);

            ctx.fillStyle = COLORS.TEXT_WHITE;
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(beacon.type.toUpperCase(), beacon.x + 20, beacon.y - 25);
            ctx.fillText(beacon.visited ? 'VISITED' : 'UNEXPLORED', beacon.x + 20, beacon.y - 12);
            ctx.fillStyle = isConnected ? COLORS.TEXT_GREEN : COLORS.TEXT_RED;
            ctx.fillText(isConnected ? 'CAN JUMP' : 'TOO FAR', beacon.x + 20, beacon.y + 2);
        }
    });

    // Jump instruction
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click a connected beacon to jump', WIDTH/2, HEIGHT - 60);
}

function renderCombat() {
    // Starfield background
    renderStarfield();

    // Draw player ship outline
    ctx.fillStyle = COLORS.HULL;
    ctx.fillRect(15, 180, 400, 180);

    // Draw player rooms
    playerShip.rooms.forEach(room => {
        ctx.fillStyle = COLORS.ROOM_FLOOR;
        ctx.fillRect(room.x, room.y, room.w, room.h);
        ctx.strokeStyle = COLORS.ROOM_WALL;
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        // System icon/label
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(room.system.toUpperCase(), room.x + room.w/2, room.y + 12);

        // Fire indicator
        if (room.fire > 0) {
            // Flickering fire effect
            const fireIntensity = room.fire / 100;
            const flicker = 0.8 + Math.sin(Date.now() / 100) * 0.2;
            ctx.fillStyle = `rgba(255, 68, 0, ${fireIntensity * flicker})`;
            ctx.fillRect(room.x, room.y, room.w, room.h);

            // Fire particles
            for (let f = 0; f < room.fire / 20; f++) {
                const fx = room.x + Math.random() * room.w;
                const fy = room.y + Math.random() * room.h;
                const fsize = 3 + Math.random() * 4;
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.5 + Math.random() * 0.5})`;
                ctx.beginPath();
                ctx.arc(fx, fy, fsize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Fire warning text
            ctx.fillStyle = COLORS.TEXT_RED;
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FIRE', room.x + room.w/2, room.y + room.h - 5);
        }
    });

    // Draw crew
    playerShip.crew.forEach(crew => {
        // Movement line if crew is moving
        if (crew.targetX !== undefined) {
            ctx.strokeStyle = COLORS.TEXT_WHITE;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(crew.x, crew.y);
            ctx.lineTo(crew.targetX, crew.targetY);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Crew body
        ctx.fillStyle = crew.selected ? COLORS.CREW_SELECTED : COLORS.CREW_HUMAN;
        ctx.beginPath();
        ctx.arc(crew.x, crew.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Selection ring
        if (crew.selected) {
            ctx.strokeStyle = COLORS.TEXT_GREEN;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(crew.x, crew.y, 15, 0, Math.PI * 2);
            ctx.stroke();
        }

        // HP bar background
        ctx.fillStyle = COLORS.UI_DARK;
        ctx.fillRect(crew.x - 12, crew.y - 22, 24, 6);

        // HP bar fill
        const hpPct = crew.hp / crew.maxHp;
        const hpColor = hpPct > 0.6 ? COLORS.TEXT_GREEN : (hpPct > 0.3 ? COLORS.TEXT_ORANGE : COLORS.TEXT_RED);
        ctx.fillStyle = hpColor;
        ctx.fillRect(crew.x - 11, crew.y - 21, 22 * hpPct, 4);

        // Crew name
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(crew.name.charAt(0), crew.x, crew.y + 4);
    });

    // Draw player shields
    if (playerShip.shields.layers > 0) {
        ctx.strokeStyle = COLORS.SHIELDS;
        ctx.lineWidth = 3;
        for (let i = 0; i < playerShip.shields.layers; i++) {
            ctx.beginPath();
            ctx.ellipse(215, 270, 210 + i * 10, 100 + i * 5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Draw enemy ship
    if (enemyShip) {
        ctx.fillStyle = COLORS.ENEMY;
        ctx.fillRect(enemyShip.x, enemyShip.y, enemyShip.w, enemyShip.h);

        // Enemy rooms
        enemyShip.rooms.forEach(room => {
            ctx.fillStyle = COLORS.ROOM_FLOOR;
            ctx.fillRect(room.x, room.y, room.w, room.h);
            ctx.strokeStyle = COLORS.ROOM_WALL;
            ctx.lineWidth = 1;
            ctx.strokeRect(room.x, room.y, room.w, room.h);
        });

        // Enemy shields
        if (enemyShip.shields.layers > 0) {
            ctx.strokeStyle = COLORS.SHIELDS;
            ctx.lineWidth = 2;
            for (let i = 0; i < enemyShip.shields.layers; i++) {
                ctx.beginPath();
                ctx.ellipse(enemyShip.x + enemyShip.w/2, enemyShip.y + enemyShip.h/2,
                           enemyShip.w/2 + 15 + i * 10, enemyShip.h/2 + 15 + i * 5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Enemy hull bar
        ctx.fillStyle = COLORS.TEXT_RED;
        ctx.fillRect(enemyShip.x, enemyShip.y - 20, enemyShip.w * (enemyShip.hull / enemyShip.maxHull), 10);
        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.strokeRect(enemyShip.x, enemyShip.y - 20, enemyShip.w, 10);

        // Enemy damage flash
        if (enemyDamageFlash > 0) {
            ctx.fillStyle = `rgba(255, 100, 100, ${enemyDamageFlash})`;
            ctx.fillRect(enemyShip.x, enemyShip.y, enemyShip.w, enemyShip.h);
        }
    }

    // HUD
    renderCombatHUD();

    // Paused overlay
    if (game.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', WIDTH/2, 120);

        // Controls help panel
        ctx.fillStyle = COLORS.UI_PANEL;
        ctx.fillRect(WIDTH/4, 150, WIDTH/2, 400);
        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(WIDTH/4, 150, WIDTH/2, 400);

        ctx.fillStyle = COLORS.TEXT_ORANGE;
        ctx.font = '16px monospace';
        ctx.fillText('CONTROLS', WIDTH/2, 180);

        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        const cx = WIDTH/4 + 30;
        let cy = 210;
        const controls = [
            'SPACE / ESC - Pause/Unpause',
            '1-4 - Select Weapon',
            'Click Enemy - Target Weapon',
            'Click Crew - Select Crew',
            'Click Room - Move Crew',
            '',
            'POWER SHORTCUTS:',
            'Q/A - Shields +/-',
            'W/S - Weapons +/-',
            'E/D - Engines +/-',
            'R/F - Oxygen +/-',
            'T/G - Medbay +/-'
        ];
        controls.forEach(line => {
            ctx.fillText(line, cx, cy);
            cy += 22;
        });

        ctx.fillStyle = COLORS.TEXT_GREEN;
        ctx.textAlign = 'center';
        ctx.font = '14px monospace';
        ctx.fillText('Press SPACE to resume', WIDTH/2, 530);
    }

    // Draw muzzle flashes
    muzzleFlashes.forEach(f => {
        const alpha = f.life / 0.15;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;

        // Main flash
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * alpha * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    });

    // Draw projectiles
    projectiles.forEach(p => {
        // Trail
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        p.trail.forEach((t, i) => {
            ctx.globalAlpha = i / p.trail.length * 0.5;
            if (i === 0) ctx.moveTo(t.x, t.y);
            else ctx.lineTo(t.x, t.y);
        });
        ctx.globalAlpha = 1;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Projectile head
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.piercing ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw floating texts
    floatingTexts.forEach(t => {
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.fillStyle = t.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
        ctx.globalAlpha = 1;
    });

    // Targeting cursor
    if (targetingWeapon !== null) {
        ctx.strokeStyle = COLORS.TEXT_RED;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function renderCombatHUD() {
    // Top bar
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, 0, WIDTH, 70);

    // Hull
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Hull: ${playerShip.hull}/${playerShip.maxHull}`, 20, 25);

    // Resources
    ctx.fillStyle = COLORS.TEXT_ORANGE;
    ctx.fillText(`Fuel: ${game.fuel}`, 150, 25);
    ctx.fillStyle = COLORS.TEXT_RED;
    ctx.fillText(`Missiles: ${game.missiles}`, 250, 25);

    // Shields display
    ctx.fillStyle = COLORS.SHIELDS;
    ctx.fillText(`Shields: ${playerShip.shields.layers}/${playerShip.shields.maxLayers}`, 20, 50);

    // Shield recharge bar (if charging)
    if (playerShip.shields.layers < playerShip.shields.maxLayers && playerShip.shields.power > 0) {
        ctx.fillStyle = COLORS.UI_DARK;
        ctx.fillRect(20, 55, 80, 6);
        ctx.fillStyle = COLORS.SHIELDS;
        ctx.fillRect(20, 55, 80 * (playerShip.shields.recharge / 2), 6);
    }

    // Evasion
    ctx.fillStyle = COLORS.ENGINES;
    ctx.fillText(`Evasion: ${playerShip.engines.evasion}%`, 150, 50);

    // Combat timer
    const combatTime = Math.floor(game.combatTimer);
    const mins = Math.floor(combatTime / 60);
    const secs = combatTime % 60;
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, 280, 50);

    // FTL
    if (playerShip.ftlReady) {
        // Pulsing glow when ready
        const ftlPulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
        ctx.shadowColor = COLORS.TEXT_GREEN;
        ctx.shadowBlur = 15 * ftlPulse;
    }
    ctx.fillStyle = playerShip.ftlReady ? COLORS.TEXT_GREEN : COLORS.TEXT_BLUE;
    ctx.fillRect(WIDTH - 120, 20, 100 * (playerShip.ftlCharge / 15), 20);
    ctx.strokeStyle = playerShip.ftlReady ? COLORS.TEXT_GREEN : COLORS.UI_BORDER;
    ctx.lineWidth = playerShip.ftlReady ? 2 : 1;
    ctx.strokeRect(WIDTH - 120, 20, 100, 20);
    ctx.shadowBlur = 0;
    ctx.fillStyle = playerShip.ftlReady ? COLORS.TEXT_GREEN : COLORS.TEXT_WHITE;
    ctx.font = playerShip.ftlReady ? 'bold 12px monospace' : '12px monospace';
    ctx.fillText(playerShip.ftlReady ? 'FTL READY!' : 'Charging...', WIDTH - 120, 55);

    // Bottom panel - Power
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, HEIGHT - 200, WIDTH, 200);

    // Power bars
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '12px monospace';
    ctx.fillText(`Reactor: ${playerShip.usedPower}/${playerShip.reactor}`, 20, HEIGHT - 185);

    const systems = [
        { name: 'Shields', sys: 'shields', color: COLORS.SHIELDS },
        { name: 'Weapons', sys: 'weapons', color: COLORS.WEAPONS },
        { name: 'Engines', sys: 'engines', color: COLORS.ENGINES },
        { name: 'O2', sys: 'oxygen', color: COLORS.OXYGEN },
        { name: 'Medbay', sys: 'medbay', color: COLORS.MEDBAY }
    ];

    systems.forEach((s, i) => {
        const x = 20 + i * 100;
        const y = HEIGHT - 160;

        ctx.fillStyle = COLORS.UI_DARK;
        ctx.fillRect(x, y, 90, 50);
        ctx.strokeStyle = s.color;
        ctx.strokeRect(x, y, 90, 50);

        ctx.fillStyle = s.color;
        ctx.font = '10px monospace';
        ctx.fillText(s.name, x + 5, y + 15);

        // Power pips
        for (let p = 0; p < playerShip[s.sys].level; p++) {
            ctx.fillStyle = p < playerShip[s.sys].power ? s.color : COLORS.UI_DARK;
            ctx.fillRect(x + 5 + p * 10, y + 25, 8, 15);
        }

        // +/- indicators
        ctx.fillStyle = playerShip.usedPower < playerShip.reactor && playerShip[s.sys].power < playerShip[s.sys].level ? COLORS.TEXT_GREEN : COLORS.UI_BORDER;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('+', x + 88, y + 48);

        ctx.fillStyle = playerShip[s.sys].power > 0 ? COLORS.TEXT_RED : COLORS.UI_BORDER;
        ctx.fillText('-', x + 75, y + 48);
    });

    // Weapons panel
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '12px monospace';
    ctx.fillText('WEAPONS (1-4 to select)', 200, HEIGHT - 120);

    playerShip.weapons.slots.forEach((weapon, i) => {
        const wx = 200 + i * 120;
        const wy = HEIGHT - 100;
        const active = i < playerShip.weapons.power;

        // Glow effect for ready weapons
        if (weapon.ready && active) {
            const glowPulse = 0.3 + Math.sin(Date.now() / 150) * 0.2;
            ctx.shadowColor = COLORS.TEXT_GREEN;
            ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(0, 255, 0, ${glowPulse})`;
            ctx.fillRect(wx - 2, wy - 2, 114, 44);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = COLORS.UI_DARK;
        ctx.fillRect(wx, wy, 110, 40);

        ctx.strokeStyle = weapon.ready && active ? COLORS.TEXT_GREEN : (active ? COLORS.WEAPONS : COLORS.UI_BORDER);
        ctx.lineWidth = weapon.ready && active ? 3 : 1;
        ctx.strokeRect(wx, wy, 110, 40);

        ctx.fillStyle = active ? COLORS.TEXT_WHITE : COLORS.UI_BORDER;
        ctx.font = '10px monospace';
        ctx.fillText(weapon.name, wx + 5, wy + 15);

        // Charge bar
        if (active && !weapon.ready) {
            ctx.fillStyle = COLORS.WEAPONS;
            ctx.fillRect(wx + 5, wy + 25, 100 * (weapon.charging / weapon.maxCharge), 8);
        } else if (weapon.ready && active) {
            ctx.fillStyle = COLORS.TEXT_GREEN;
            ctx.fillRect(wx + 5, wy + 25, 100, 8);
        }

        // Targeting indicator
        if (targetingWeapon === i) {
            ctx.strokeStyle = COLORS.TEXT_RED;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(wx - 4, wy - 4, 118, 48);
            ctx.setLineDash([]);
        }
    });
}

function renderEvent() {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Event panel
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(WIDTH/4, HEIGHT/4, WIDTH/2, HEIGHT/2);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 3;
    ctx.strokeRect(WIDTH/4, HEIGHT/4, WIDTH/2, HEIGHT/2);

    if (game.currentEvent) {
        // Title
        ctx.fillStyle = COLORS.TEXT_ORANGE;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(game.currentEvent.title, WIDTH/2, HEIGHT/4 + 40);

        // Event text - word wrap
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '14px monospace';
        const words = game.currentEvent.text.split(' ');
        let line = '';
        let y = HEIGHT/4 + 80;
        const maxWidth = WIDTH/2 - 60;

        for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth) {
                ctx.fillText(line, WIDTH/2, y);
                line = word + ' ';
                y += 22;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, WIDTH/2, y);

        // Reward text
        if (game.currentEvent.extraText) {
            ctx.fillStyle = COLORS.TEXT_GREEN;
            ctx.font = 'bold 18px monospace';
            ctx.fillText(game.currentEvent.extraText, WIDTH/2, HEIGHT/4 + HEIGHT/4 + 40);
        }
    } else {
        ctx.fillStyle = COLORS.TEXT_WHITE;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Nothing of interest here.', WIDTH/2, HEIGHT/2);
    }

    // Continue button
    ctx.fillStyle = COLORS.UI_DARK;
    ctx.fillRect(WIDTH/2 - 80, HEIGHT/4 + HEIGHT/2 - 60, 160, 40);
    ctx.strokeStyle = COLORS.TEXT_GREEN;
    ctx.lineWidth = 2;
    ctx.strokeRect(WIDTH/2 - 80, HEIGHT/4 + HEIGHT/2 - 60, 160, 40);

    ctx.fillStyle = COLORS.TEXT_GREEN;
    ctx.font = '14px monospace';
    ctx.fillText('CONTINUE', WIDTH/2, HEIGHT/4 + HEIGHT/2 - 35);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLORS.TEXT_RED;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP DESTROYED', WIDTH/2, HEIGHT/4);

    // Stats panel
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(WIDTH/4, HEIGHT/3, WIDTH/2, HEIGHT/2);
    ctx.strokeStyle = COLORS.TEXT_RED;
    ctx.lineWidth = 3;
    ctx.strokeRect(WIDTH/4, HEIGHT/3, WIDTH/2, HEIGHT/2);

    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    const sx = WIDTH/4 + 30;
    let sy = HEIGHT/3 + 40;

    ctx.fillText(`SECTOR REACHED: ${game.sector}`, sx, sy); sy += 30;
    ctx.fillText(`BEACONS VISITED: ${game.stats.beaconsVisited}`, sx, sy); sy += 30;
    ctx.fillText(`COMBATS WON: ${game.stats.combatsWon}`, sx, sy); sy += 30;
    ctx.fillText(`DAMAGE DEALT: ${game.stats.damageDealt}`, sx, sy); sy += 30;
    ctx.fillText(`DAMAGE TAKEN: ${game.stats.damageTaken}`, sx, sy); sy += 30;
    ctx.fillText(`SCRAP COLLECTED: ${game.stats.scrapCollected}`, sx, sy); sy += 30;

    // Rating
    let rating = 'ROOKIE';
    if (game.sector >= 4) rating = 'CAPTAIN';
    if (game.sector >= 6) rating = 'COMMANDER';
    if (game.stats.combatsWon >= 5) rating = 'VETERAN';

    ctx.fillStyle = COLORS.TEXT_ORANGE;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`RATING: ${rating}`, WIDTH/2, HEIGHT/3 + HEIGHT/2 - 40);

    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '14px monospace';
    ctx.fillText('Press F5 to play again', WIDTH/2, HEIGHT - 50);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 30, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Victory particles
    const time = Date.now() / 1000;
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2 + time;
        const dist = 150 + Math.sin(time * 2 + i) * 30;
        const px = WIDTH/2 + Math.cos(angle) * dist;
        const py = HEIGHT/3 + Math.sin(angle) * dist * 0.5;
        ctx.fillStyle = `rgba(0, 255, 0, ${0.3 + Math.sin(time + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(px, py, 4 + Math.sin(time * 3 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = COLORS.TEXT_GREEN;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH/2, HEIGHT/4);

    // Stats panel
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(WIDTH/4, HEIGHT/3, WIDTH/2, HEIGHT/2);
    ctx.strokeStyle = COLORS.TEXT_GREEN;
    ctx.lineWidth = 3;
    ctx.strokeRect(WIDTH/4, HEIGHT/3, WIDTH/2, HEIGHT/2);

    ctx.fillStyle = COLORS.TEXT_GREEN;
    ctx.font = '18px monospace';
    ctx.fillText('DATA DELIVERED TO FEDERATION', WIDTH/2, HEIGHT/3 + 40);

    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const sx = WIDTH/4 + 30;
    let sy = HEIGHT/3 + 80;

    ctx.fillText(`BEACONS VISITED: ${game.stats.beaconsVisited}`, sx, sy); sy += 25;
    ctx.fillText(`COMBATS WON: ${game.stats.combatsWon}`, sx, sy); sy += 25;
    ctx.fillText(`DAMAGE DEALT: ${game.stats.damageDealt}`, sx, sy); sy += 25;
    ctx.fillText(`DAMAGE TAKEN: ${game.stats.damageTaken}`, sx, sy); sy += 25;
    ctx.fillText(`SCRAP COLLECTED: ${game.stats.scrapCollected}`, sx, sy); sy += 25;
    ctx.fillText(`HULL REMAINING: ${playerShip.hull}/${playerShip.maxHull}`, sx, sy); sy += 25;

    // Rank
    let rank = 'ENSIGN';
    const score = game.stats.combatsWon * 100 + game.stats.scrapCollected + (playerShip.hull * 5);
    if (score > 500) rank = 'LIEUTENANT';
    if (score > 1000) rank = 'COMMANDER';
    if (score > 1500) rank = 'CAPTAIN';
    if (score > 2000) rank = 'ADMIRAL';

    ctx.fillStyle = COLORS.TEXT_GREEN;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FINAL RANK: ${rank}`, WIDTH/2, HEIGHT/3 + HEIGHT/2 - 40);

    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.font = '14px monospace';
    ctx.fillText('Press F5 to play again', WIDTH/2, HEIGHT - 50);
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
