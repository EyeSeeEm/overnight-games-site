// FTL Clone - Canvas Version (Expanded & Polished)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;

// Colors
const COLORS = {
    uiDark: '#1a1a2e',
    uiBorder: '#3a3a5c',
    uiPanel: '#252540',
    textWhite: '#ffffff',
    textGreen: '#00ff00',
    textRed: '#ff4444',
    textBlue: '#4488ff',
    textOrange: '#ffaa00',
    textYellow: '#ffff00',
    shields: '#00ccff',
    weapons: '#ff6600',
    engines: '#ffff00',
    oxygen: '#88ff88',
    medbay: '#00ff00',
    human: '#ffcc88',
    mantis: '#44ff44',
    engi: '#ffff44',
    rockman: '#aa6644',
    zoltan: '#44ffff',
    fire: '#ff4400',
    space: '#0a0a1a',
    shipHull: '#888888',
    roomFloor: '#4a4a5a',
    roomWall: '#2a2a3a',
    breach: '#3366ff',
    ion: '#00aaff'
};

// Game State
const game = {
    state: 'title',
    paused: false,
    scrap: 50,
    fuel: 10,
    missiles: 8,
    droneParts: 2,
    sector: 1,
    beacon: 1,
    beacons: 8,
    eventText: '',
    eventChoices: []
};

// Visual Effects
let screenShake = 0;
let screenFlash = null;
let projectiles = [];
let particles = [];
let floatingTexts = [];
let animTime = 0;

// Player Ship
const playerShip = {
    hull: 30,
    maxHull: 30,
    x: 200,
    y: 280,
    rooms: [],
    systems: {
        shields: { level: 2, power: 2, maxPower: 2, damage: 0, layers: 1, maxLayers: 1, rechargeTime: 0 },
        weapons: { level: 2, power: 2, maxPower: 2, damage: 0 },
        engines: { level: 2, power: 1, maxPower: 2, damage: 0, evasion: 10 },
        oxygen: { level: 1, power: 1, maxPower: 1, damage: 0, level: 100 },
        medbay: { level: 1, power: 0, maxPower: 1, damage: 0 },
        piloting: { level: 1, power: 0, maxPower: 0, damage: 0 },
        sensors: { level: 1, power: 0, maxPower: 0, damage: 0 },
        doors: { level: 1, power: 0, maxPower: 0, damage: 0 },
        drones: { level: 0, power: 0, maxPower: 2, damage: 0 },
        teleporter: { level: 0, power: 0, maxPower: 2, damage: 0 },
        cloaking: { level: 0, power: 0, maxPower: 1, damage: 0, active: false, timer: 0 },
        hacking: { level: 0, power: 0, maxPower: 2, damage: 0 }
    },
    reactor: { current: 6, max: 10 },
    weapons: [
        { name: 'Burst Laser II', type: 'laser', power: 2, chargeTime: 12, charge: 0, shots: 3, damage: 1, powered: true, autofire: false },
        { name: 'Artemis Missile', type: 'missile', power: 1, chargeTime: 10, charge: 0, shots: 1, damage: 2, powered: false, autofire: false },
        { name: 'Ion Blast', type: 'ion', power: 1, chargeTime: 8, charge: 0, shots: 1, damage: 1, powered: false, autofire: false }
    ],
    augments: [],
    crew: [],
    fires: [],
    breaches: []
};

// Enemy Ship
let enemyShip = null;

// Enemy Templates
const ENEMY_TEMPLATES = {
    fighter: {
        name: 'Rebel Fighter',
        hull: 10, maxHull: 10,
        shields: { layers: 1, maxLayers: 1, rechargeTime: 0 },
        weapons: [{ name: 'Basic Laser', chargeTime: 10, charge: 5, shots: 1, damage: 1, type: 'laser' }],
        evasion: 15,
        scrap: 25,
        missiles: 2,
        fuel: 2
    },
    scout: {
        name: 'Pirate Scout',
        hull: 8, maxHull: 8,
        shields: { layers: 0, maxLayers: 0, rechargeTime: 0 },
        weapons: [{ name: 'Dual Laser', chargeTime: 8, charge: 3, shots: 2, damage: 1, type: 'laser' }],
        evasion: 25,
        scrap: 20,
        missiles: 1,
        fuel: 3
    },
    cruiser: {
        name: 'Rebel Cruiser',
        hull: 18, maxHull: 18,
        shields: { layers: 2, maxLayers: 2, rechargeTime: 0 },
        weapons: [
            { name: 'Heavy Laser', chargeTime: 14, charge: 5, shots: 2, damage: 2, type: 'laser' },
            { name: 'Missile', chargeTime: 12, charge: 8, shots: 1, damage: 3, type: 'missile' }
        ],
        evasion: 10,
        scrap: 40,
        missiles: 3,
        fuel: 4
    },
    drone: {
        name: 'Auto-Drone',
        hull: 6, maxHull: 6,
        shields: { layers: 1, maxLayers: 1, rechargeTime: 0 },
        weapons: [{ name: 'Ion Burst', chargeTime: 6, charge: 2, shots: 2, damage: 1, type: 'ion' }],
        evasion: 20,
        scrap: 15,
        missiles: 0,
        fuel: 1
    }
};

// Crew Races
const CREW_RACES = {
    human: { color: COLORS.human, health: 100, speed: 1, combat: 1, repair: 1, name: 'Human' },
    mantis: { color: COLORS.mantis, health: 100, speed: 1.2, combat: 1.5, repair: 0.5, name: 'Mantis' },
    engi: { color: COLORS.engi, health: 100, speed: 0.8, combat: 0.5, repair: 2, name: 'Engi' },
    rockman: { color: COLORS.rockman, health: 150, speed: 0.5, combat: 1, repair: 1, fireImmune: true, name: 'Rockman' },
    zoltan: { color: COLORS.zoltan, health: 70, speed: 1, combat: 0.7, repair: 1, power: true, name: 'Zoltan' }
};

// Crew Class
class CrewMember {
    constructor(name, race, x, y, ship) {
        const raceData = CREW_RACES[race];
        this.name = name;
        this.race = race;
        this.health = raceData.health;
        this.maxHealth = raceData.health;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.ship = ship;
        this.room = null;
        this.selected = false;
        this.skills = { piloting: 0, engines: 0, shields: 0, weapons: 0, repair: 0, combat: 0 };
        this.speed = raceData.speed;
        this.combatMod = raceData.combat;
        this.repairMod = raceData.repair;
        this.fireImmune = raceData.fireImmune || false;
        this.providePower = raceData.power || false;
    }
}

// Initialize ships
function initShips() {
    const roomSize = 50;
    playerShip.rooms = [
        { name: 'Shields', system: 'shields', x: 120, y: 250, w: roomSize, h: roomSize * 2, oxygen: 100, fire: false, breach: false },
        { name: 'Weapons', system: 'weapons', x: 170, y: 300, w: roomSize * 2, h: roomSize, oxygen: 100, fire: false, breach: false },
        { name: 'Cockpit', system: 'piloting', x: 320, y: 275, w: roomSize, h: roomSize, oxygen: 100, fire: false, breach: false },
        { name: 'Engines', system: 'engines', x: 70, y: 300, w: roomSize, h: roomSize, oxygen: 100, fire: false, breach: false },
        { name: 'Oxygen', system: 'oxygen', x: 220, y: 250, w: roomSize, h: roomSize, oxygen: 100, fire: false, breach: false },
        { name: 'Medbay', system: 'medbay', x: 170, y: 350, w: roomSize, h: roomSize, oxygen: 100, fire: false, breach: false },
        { name: 'Sensors', system: 'sensors', x: 270, y: 300, w: roomSize, h: roomSize, oxygen: 100, fire: false, breach: false },
        { name: 'Doors', system: 'doors', x: 270, y: 250, w: roomSize, h: roomSize, oxygen: 100, fire: false, breach: false }
    ];

    playerShip.crew = [
        new CrewMember('Captain', 'human', 330, 290, 'player'),
        new CrewMember('Engineer', 'engi', 130, 280, 'player'),
        new CrewMember('Gunner', 'mantis', 200, 320, 'player')
    ];

    playerShip.crew[0].room = 'piloting';
    playerShip.crew[1].room = 'shields';
    playerShip.crew[2].room = 'weapons';

    spawnEnemy('fighter');
}

function spawnEnemy(type) {
    const template = ENEMY_TEMPLATES[type];
    enemyShip = {
        ...template,
        hull: template.maxHull,
        shields: { ...template.shields },
        weapons: template.weapons.map(w => ({ ...w, charge: Math.random() * w.chargeTime * 0.5 })),
        x: 900, y: 100,
        rooms: [
            { name: 'Shields', x: 880, y: 120, w: 40, h: 60 },
            { name: 'Weapons', x: 920, y: 150, w: 60, h: 40 },
            { name: 'Cockpit', x: 980, y: 130, w: 40, h: 40 },
            { name: 'Engines', x: 850, y: 150, w: 40, h: 40 }
        ]
    };
}

// Input
let selectedCrew = null;
let targetingMode = false;
let targetingWeapon = null;
let mouseX = 0, mouseY = 0;

canvas.addEventListener('click', handleClick);
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
document.addEventListener('keydown', handleKeydown);

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.state === 'title') {
        game.state = 'combat';
        return;
    }

    if (game.state === 'event') {
        handleEventClick(x, y);
        return;
    }

    if (game.state === 'map') {
        handleMapClick(x, y);
        return;
    }

    if (game.state === 'combat') {
        if (targetingMode && targetingWeapon !== null) {
            for (const room of enemyShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    fireWeapon(targetingWeapon, room);
                    targetingMode = false;
                    targetingWeapon = null;
                    return;
                }
            }
        }

        for (const crew of playerShip.crew) {
            const cx = crew.x, cy = crew.y;
            if (x >= cx - 15 && x <= cx + 15 && y >= cy - 15 && y <= cy + 15) {
                if (selectedCrew === crew) {
                    selectedCrew = null;
                } else {
                    selectedCrew = crew;
                    playerShip.crew.forEach(c => c.selected = false);
                    crew.selected = true;
                }
                return;
            }
        }

        if (selectedCrew) {
            for (const room of playerShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    selectedCrew.targetX = room.x + room.w / 2;
                    selectedCrew.targetY = room.y + room.h / 2;
                    selectedCrew.room = room.system;
                    return;
                }
            }
        }

        const weaponBarY = 620;
        for (let i = 0; i < playerShip.weapons.length; i++) {
            const wx = 400 + i * 120;
            if (x >= wx && x <= wx + 110 && y >= weaponBarY && y <= weaponBarY + 60) {
                const weapon = playerShip.weapons[i];
                if (weapon.powered && weapon.charge >= weapon.chargeTime) {
                    targetingMode = true;
                    targetingWeapon = i;
                }
                return;
            }
        }

        checkPowerBarClick(x, y);
    }

    if (game.state === 'gameover' || game.state === 'victory') {
        if (game.state === 'victory') {
            game.beacon++;
            if (game.beacon > game.beacons) {
                game.sector++;
                game.beacon = 1;
            }
            const types = ['fighter', 'scout', 'cruiser', 'drone'];
            spawnEnemy(types[Math.floor(Math.random() * types.length)]);
            game.state = 'combat';
        } else {
            resetGame();
        }
    }
}

function handleEventClick(x, y) {
    for (let i = 0; i < game.eventChoices.length; i++) {
        const cy = 350 + i * 50;
        if (x >= 400 && x <= 880 && y >= cy && y <= cy + 40) {
            resolveEvent(i);
            return;
        }
    }
}

function handleMapClick(x, y) {
    // Map click handling (simplified)
    game.state = 'combat';
}

function handleKeydown(e) {
    if (e.code === 'Space') {
        game.paused = !game.paused;
    }
    if (e.code === 'Escape') {
        targetingMode = false;
        targetingWeapon = null;
        selectedCrew = null;
        playerShip.crew.forEach(c => c.selected = false);
    }
    if (e.code === 'KeyM' && game.state === 'combat') {
        game.state = 'map';
    }
}

function checkPowerBarClick(x, y) {
    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const startY = 60;

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const buttonY = startY + i * 35;

        if (x >= 100 && x <= 115 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power > 0) {
                sys.power--;
                playerShip.reactor.current++;
            }
            return;
        }

        if (x >= 170 && x <= 185 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power < sys.maxPower && playerShip.reactor.current > 0) {
                sys.power++;
                playerShip.reactor.current--;
                updateShieldLayers();
            }
            return;
        }
    }
}

function updateShieldLayers() {
    const shields = playerShip.systems.shields;
    shields.maxLayers = Math.floor(shields.power / 2);
}

function fireWeapon(weaponIndex, targetRoom) {
    const weapon = playerShip.weapons[weaponIndex];
    if (!weapon.powered || weapon.charge < weapon.chargeTime) return;

    weapon.charge = 0;

    if (weapon.type === 'missile') {
        if (game.missiles <= 0) return;
        game.missiles--;
    }

    for (let i = 0; i < weapon.shots; i++) {
        const startX = 380;
        const startY = 310;
        const targetX = targetRoom.x + targetRoom.w / 2;
        const targetY = targetRoom.y + targetRoom.h / 2;

        projectiles.push({
            x: startX,
            y: startY,
            targetX,
            targetY,
            speed: weapon.type === 'missile' ? 4 : 8,
            type: weapon.type,
            damage: weapon.damage,
            color: weapon.type === 'ion' ? COLORS.ion : weapon.type === 'missile' ? COLORS.weapons : COLORS.textGreen,
            delay: i * 200
        });
    }
}

function addCombatLog(message, color = COLORS.textWhite) {
    combatLog.unshift({ text: message, time: 120, color });
    if (combatLog.length > 5) combatLog.pop();
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 60, startY: y });
}

function addParticle(x, y, color, vx = 0, vy = 0) {
    particles.push({ x, y, color, vx: vx + (Math.random() - 0.5) * 3, vy: vy + (Math.random() - 0.5) * 3, life: 30 });
}

function triggerScreenShake(intensity) {
    screenShake = intensity;
}

function triggerScreenFlash(color) {
    screenFlash = { color, alpha: 0.4 };
}

// Events
function triggerRandomEvent() {
    const events = [
        {
            text: 'You arrive at a distress beacon. A damaged ship floats nearby.',
            choices: [
                { text: 'Help them', action: 'help_ship' },
                { text: 'Ignore and move on', action: 'ignore' }
            ]
        },
        {
            text: 'A merchant ship hails you, offering to trade.',
            choices: [
                { text: 'Trade (20 scrap for 2 fuel)', action: 'trade_fuel' },
                { text: 'Trade (30 scrap for 3 missiles)', action: 'trade_missiles' },
                { text: 'Decline', action: 'ignore' }
            ]
        },
        {
            text: 'You detect an asteroid field with valuable minerals.',
            choices: [
                { text: 'Mine the asteroids', action: 'mine' },
                { text: 'Too dangerous, leave', action: 'ignore' }
            ]
        }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    game.eventText = event.text;
    game.eventChoices = event.choices;
    game.state = 'event';
}

function resolveEvent(choiceIndex) {
    const action = game.eventChoices[choiceIndex].action;

    switch (action) {
        case 'help_ship':
            if (Math.random() < 0.6) {
                game.scrap += 15;
                addCombatLog('Received 15 scrap as thanks!', COLORS.textGreen);
            } else {
                playerShip.hull -= 5;
                addCombatLog("It was a trap! -5 hull", COLORS.textRed);
            }
            break;
        case 'trade_fuel':
            if (game.scrap >= 20) {
                game.scrap -= 20;
                game.fuel += 2;
                addCombatLog('Traded for fuel', COLORS.textBlue);
            }
            break;
        case 'trade_missiles':
            if (game.scrap >= 30) {
                game.scrap -= 30;
                game.missiles += 3;
                addCombatLog('Traded for missiles', COLORS.textOrange);
            }
            break;
        case 'mine':
            if (Math.random() < 0.7) {
                game.scrap += 20;
                addCombatLog('Mined 20 scrap!', COLORS.textGreen);
            } else {
                playerShip.hull -= 8;
                addCombatLog('Asteroid collision! -8 hull', COLORS.textRed);
                triggerScreenShake(10);
            }
            break;
    }

    game.state = 'combat';
}

let combatLog = [];

// Update game logic
function update() {
    animTime += 1/60;

    if (game.paused || game.state !== 'combat') return;

    // Update crew positions
    for (const crew of playerShip.crew) {
        const raceData = CREW_RACES[crew.race];
        const dx = crew.targetX - crew.x;
        const dy = crew.targetY - crew.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
            const speed = 2 * raceData.speed;
            crew.x += (dx / dist) * speed;
            crew.y += (dy / dist) * speed;
        }
    }

    // Medbay healing
    if (playerShip.systems.medbay.power > 0) {
        for (const crew of playerShip.crew) {
            if (crew.room === 'medbay' && crew.health < crew.maxHealth) {
                crew.health = Math.min(crew.maxHealth, crew.health + 0.5);
            }
        }
    }

    // Fire damage and spread
    for (const room of playerShip.rooms) {
        if (room.fire) {
            // Damage crew
            for (const crew of playerShip.crew) {
                if (crew.room === room.system && !crew.fireImmune) {
                    crew.health -= 0.3;
                }
            }
            // Damage system
            const sys = playerShip.systems[room.system];
            if (sys && sys.damage < sys.maxPower) {
                sys.damage += 0.01;
            }
            // Random spread
            if (Math.random() < 0.001) {
                const adjRooms = playerShip.rooms.filter(r => r !== room && Math.abs(r.x - room.x) < 100);
                if (adjRooms.length > 0) {
                    adjRooms[Math.floor(Math.random() * adjRooms.length)].fire = true;
                }
            }
        }
        // Breach reduces oxygen
        if (room.breach) {
            room.oxygen = Math.max(0, room.oxygen - 0.5);
        }
    }

    // Crew repairs
    for (const crew of playerShip.crew) {
        if (crew.room) {
            const room = playerShip.rooms.find(r => r.system === crew.room);
            if (room) {
                // Repair fire
                if (room.fire && Math.random() < 0.02 * crew.repairMod) {
                    room.fire = false;
                    addCombatLog(`${crew.name} extinguished fire!`, COLORS.textBlue);
                }
                // Repair breach
                if (room.breach && Math.random() < 0.01 * crew.repairMod) {
                    room.breach = false;
                    addCombatLog(`${crew.name} sealed breach!`, COLORS.textBlue);
                }
                // Repair system
                const sys = playerShip.systems[crew.room];
                if (sys && sys.damage > 0) {
                    sys.damage = Math.max(0, sys.damage - 0.02 * crew.repairMod);
                }
            }
        }
    }

    // Update shield recharge
    const shields = playerShip.systems.shields;
    if (shields.power >= 2 && shields.layers < shields.maxLayers) {
        shields.rechargeTime += 1 / 60;
        if (shields.rechargeTime >= 2) {
            shields.layers++;
            shields.rechargeTime = 0;
        }
    }

    // Update enemy shields
    if (enemyShip.shields.layers < enemyShip.shields.maxLayers) {
        enemyShip.shields.rechargeTime += 1 / 60;
        if (enemyShip.shields.rechargeTime >= 2.5) {
            enemyShip.shields.layers++;
            enemyShip.shields.rechargeTime = 0;
        }
    }

    // Update weapon charges
    for (const weapon of playerShip.weapons) {
        if (weapon.powered && weapon.charge < weapon.chargeTime) {
            weapon.charge += 1 / 60;
        }
    }

    // Enemy AI - fire weapons
    for (const weapon of enemyShip.weapons) {
        weapon.charge += 1 / 60;
        if (weapon.charge >= weapon.chargeTime) {
            weapon.charge = 0;
            enemyFire(weapon);
        }
    }

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.delay > 0) {
            p.delay -= 16;
            continue;
        }

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
            // Hit!
            projectileHit(p);
            projectiles.splice(i, 1);
        } else {
            p.x += (dx / dist) * p.speed;
            p.y += (dy / dist) * p.speed;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life--;
        ft.y = ft.startY - (60 - ft.life) * 0.5;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Update screen shake
    if (screenShake > 0) {
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    // Update combat log
    combatLog = combatLog.filter(log => {
        log.time--;
        return log.time > 0;
    });

    // Check for dead crew
    playerShip.crew = playerShip.crew.filter(c => {
        if (c.health <= 0) {
            addCombatLog(`${c.name} has died!`, COLORS.textRed);
            return false;
        }
        return true;
    });

    // Check game over
    if (playerShip.hull <= 0) {
        game.state = 'gameover';
    }
}

function projectileHit(p) {
    // Create impact particles
    for (let i = 0; i < 8; i++) {
        addParticle(p.targetX, p.targetY, p.color);
    }

    // Check evasion
    if (Math.random() * 100 < enemyShip.evasion) {
        addCombatLog('MISS', COLORS.textBlue);
        addFloatingText(p.targetX, p.targetY, 'MISS', COLORS.textBlue);
        return;
    }

    // Ion damage
    if (p.type === 'ion') {
        if (enemyShip.shields.layers > 0) {
            enemyShip.shields.layers--;
            enemyShip.shields.rechargeTime = 0;
        }
        addCombatLog('Ion hit - shields disabled', COLORS.ion);
        addFloatingText(p.targetX, p.targetY, 'ION', COLORS.ion);
        return;
    }

    // Check shields (missiles bypass)
    if (p.type !== 'missile' && enemyShip.shields.layers > 0) {
        enemyShip.shields.layers--;
        enemyShip.shields.rechargeTime = 0;
        addCombatLog('Shield hit', COLORS.shields);
        addFloatingText(p.targetX, p.targetY, 'SHIELD', COLORS.shields);
        return;
    }

    // Deal damage
    enemyShip.hull -= p.damage;
    addCombatLog(`Hit! ${p.damage} damage`, COLORS.textRed);
    addFloatingText(p.targetX, p.targetY, `-${p.damage}`, COLORS.textRed);
    triggerScreenShake(3);

    // Check victory
    if (enemyShip.hull <= 0) {
        game.state = 'victory';
        game.scrap += enemyShip.scrap;
        game.missiles += enemyShip.missiles;
        game.fuel += enemyShip.fuel;
        triggerScreenFlash(COLORS.textGreen);
        for (let i = 0; i < 30; i++) {
            addParticle(enemyShip.x + 70, enemyShip.y + 60, COLORS.weapons);
        }
    }
}

function enemyFire(weapon) {
    const evasion = playerShip.systems.engines.power > 0 ? playerShip.systems.engines.evasion : 0;

    // Create projectile visual from enemy to player
    const startX = enemyShip.x - 50;
    const startY = enemyShip.y + 60;
    const targetRoom = playerShip.rooms[Math.floor(Math.random() * playerShip.rooms.length)];
    const targetX = targetRoom.x + targetRoom.w / 2;
    const targetY = targetRoom.y + targetRoom.h / 2;

    projectiles.push({
        x: startX,
        y: startY,
        targetX,
        targetY,
        speed: 6,
        type: weapon.type || 'laser',
        damage: weapon.damage,
        color: COLORS.textRed,
        delay: 0,
        fromEnemy: true,
        targetRoom
    });
}

function enemyProjectileHit(p) {
    // Impact particles
    for (let i = 0; i < 6; i++) {
        addParticle(p.targetX, p.targetY, COLORS.textRed);
    }

    // Check evasion
    const evasion = playerShip.systems.engines.power > 0 ? playerShip.systems.engines.evasion : 0;
    if (Math.random() * 100 < evasion) {
        addCombatLog('Enemy MISS', COLORS.textBlue);
        addFloatingText(p.targetX, p.targetY, 'MISS', COLORS.textBlue);
        return;
    }

    // Check shields
    const shields = playerShip.systems.shields;
    if (shields.layers > 0 && p.type !== 'missile') {
        shields.layers--;
        shields.rechargeTime = 0;
        addCombatLog('Shields absorb hit', COLORS.shields);
        addFloatingText(p.targetX, p.targetY, 'SHIELD', COLORS.shields);
        return;
    }

    // Deal damage
    playerShip.hull -= p.damage;
    addCombatLog(`Hull hit! -${p.damage}`, COLORS.textRed);
    addFloatingText(p.targetX, p.targetY, `-${p.damage}`, COLORS.textRed);
    triggerScreenShake(5);
    triggerScreenFlash(COLORS.textRed);

    // Chance to cause fire or breach
    if (p.targetRoom && Math.random() < 0.15) {
        if (Math.random() < 0.5) {
            p.targetRoom.fire = true;
            addCombatLog('Fire started!', COLORS.fire);
        } else {
            p.targetRoom.breach = true;
            addCombatLog('Hull breach!', COLORS.breach);
        }
    }

    if (playerShip.hull <= 0) {
        game.state = 'gameover';
    }
}

function resetGame() {
    playerShip.hull = playerShip.maxHull;
    playerShip.systems.shields.layers = 1;
    game.state = 'title';
    game.scrap = 50;
    game.fuel = 10;
    game.missiles = 8;
    game.sector = 1;
    game.beacon = 1;
    combatLog = [];
    projectiles = [];
    particles = [];
    floatingTexts = [];

    for (const weapon of playerShip.weapons) {
        weapon.charge = 0;
    }
    for (const room of playerShip.rooms) {
        room.fire = false;
        room.breach = false;
        room.oxygen = 100;
    }

    playerShip.crew = [
        new CrewMember('Captain', 'human', 330, 290, 'player'),
        new CrewMember('Engineer', 'engi', 130, 280, 'player'),
        new CrewMember('Gunner', 'mantis', 200, 320, 'player')
    ];

    spawnEnemy('fighter');
}

// Drawing functions
function draw() {
    // Apply screen shake
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }

    ctx.fillStyle = COLORS.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'title') {
        drawTitleScreen();
        ctx.restore();
        return;
    }

    if (game.state === 'event') {
        drawEventScreen();
        ctx.restore();
        return;
    }

    if (game.state === 'map') {
        drawMapScreen();
        ctx.restore();
        return;
    }

    drawStarfield();
    drawPlayerShip();
    drawEnemyShip();
    drawProjectiles();
    drawParticles();
    drawFloatingTexts();

    drawTopBar();
    drawCrewList();
    drawWeaponBar();
    drawSystemPanel();
    drawTargetPanel();
    drawCombatLog();

    if (game.paused) {
        drawPauseOverlay();
    }

    if (targetingMode) {
        drawTargetingCursor();
    }

    if (game.state === 'gameover') {
        drawGameOver();
    } else if (game.state === 'victory') {
        drawVictory();
    }

    // Screen flash
    if (screenFlash) {
        ctx.fillStyle = screenFlash.color;
        ctx.globalAlpha = screenFlash.alpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        screenFlash.alpha -= 0.03;
        if (screenFlash.alpha <= 0) screenFlash = null;
    }

    ctx.restore();
}

function drawStarfield() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 137 + animTime * 10) % canvas.width;
        const y = (i * 91) % canvas.height;
        const size = (i % 3) + 1;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Nebula
    const gradient = ctx.createRadialGradient(1100, 500, 50, 1100, 500, 150);
    gradient.addColorStop(0, '#663333');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(950, 350, 300, 300);
}

function drawPlayerShip() {
    // Shield bubble with animation
    if (playerShip.systems.shields.layers > 0) {
        ctx.strokeStyle = COLORS.shields;
        ctx.lineWidth = 3;
        const pulse = 1 + Math.sin(animTime * 3) * 0.03;
        ctx.globalAlpha = 0.4 + Math.sin(animTime * 2) * 0.1;
        ctx.beginPath();
        ctx.ellipse(220, 310, 170 * pulse, 100 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (playerShip.systems.shields.layers > 1) {
            ctx.beginPath();
            ctx.ellipse(220, 310, 180 * pulse, 110 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // Ship hull outline
    ctx.fillStyle = COLORS.shipHull;
    ctx.beginPath();
    ctx.moveTo(60, 300);
    ctx.lineTo(120, 240);
    ctx.lineTo(320, 240);
    ctx.lineTo(380, 280);
    ctx.lineTo(380, 340);
    ctx.lineTo(320, 380);
    ctx.lineTo(120, 380);
    ctx.lineTo(60, 320);
    ctx.closePath();
    ctx.fill();

    // Engine glow
    if (playerShip.systems.engines.power > 0) {
        const glowSize = 10 + Math.sin(animTime * 10) * 3;
        ctx.fillStyle = COLORS.engines;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(55, 310, glowSize, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Rooms
    for (const room of playerShip.rooms) {
        // Room floor with oxygen tint
        const oxygenTint = room.oxygen < 50 ? `rgba(100, 50, 50, ${(100 - room.oxygen) / 200})` : null;
        ctx.fillStyle = COLORS.roomFloor;
        ctx.fillRect(room.x, room.y, room.w, room.h);
        if (oxygenTint) {
            ctx.fillStyle = oxygenTint;
            ctx.fillRect(room.x, room.y, room.w, room.h);
        }

        // Fire
        if (room.fire) {
            ctx.fillStyle = COLORS.fire;
            ctx.globalAlpha = 0.5 + Math.sin(animTime * 10) * 0.2;
            ctx.fillRect(room.x + 5, room.y + 5, room.w - 10, room.h - 10);
            ctx.globalAlpha = 1;
            // Fire particles
            if (Math.random() < 0.1) {
                addParticle(room.x + room.w / 2, room.y + room.h / 2, COLORS.fire, 0, -2);
            }
        }

        // Breach
        if (room.breach) {
            ctx.strokeStyle = COLORS.breach;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(room.x + 2, room.y + 2, room.w - 4, room.h - 4);
            ctx.setLineDash([]);
        }

        // Room border
        ctx.strokeStyle = COLORS.roomWall;
        ctx.lineWidth = 2;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        // System icon
        const sys = playerShip.systems[room.system];
        if (sys) {
            const iconColor = getSystemColor(room.system);
            ctx.fillStyle = sys.damage > 0 ? COLORS.textRed : iconColor;
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(room.system.charAt(0).toUpperCase(), room.x + room.w / 2, room.y + 15);

            // Damage sparks
            if (sys.damage > 0 && Math.random() < 0.05) {
                addParticle(room.x + room.w / 2, room.y + room.h / 2, COLORS.textYellow);
            }
        }
    }

    // Draw crew
    for (const crew of playerShip.crew) {
        drawCrewMember(crew);
    }
}

function drawCrewMember(crew) {
    const raceData = CREW_RACES[crew.race];
    const color = crew.selected ? COLORS.textYellow : raceData.color;

    // Idle animation
    const bob = Math.sin(animTime * 3 + crew.x * 0.1) * 1;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(crew.x, crew.y + bob, 10, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(crew.x - 12, crew.y + 12, 24, 4);
    ctx.fillStyle = crew.health > 50 ? COLORS.textGreen : COLORS.textRed;
    ctx.fillRect(crew.x - 12, crew.y + 12, 24 * (crew.health / crew.maxHealth), 4);

    // Selection ring
    if (crew.selected) {
        ctx.strokeStyle = COLORS.textYellow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(crew.x, crew.y + bob, 14, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Race indicator
    ctx.fillStyle = raceData.color;
    ctx.font = '8px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(raceData.name.charAt(0), crew.x, crew.y - 15);
}

function drawEnemyShip() {
    if (!enemyShip) return;

    // Shield bubble
    if (enemyShip.shields.layers > 0) {
        ctx.strokeStyle = COLORS.shields;
        ctx.lineWidth = 2;
        const pulse = 1 + Math.sin(animTime * 3) * 0.03;
        ctx.globalAlpha = 0.4 + Math.sin(animTime * 2) * 0.1;
        ctx.beginPath();
        ctx.ellipse(930, 160, 100 * pulse, 60 * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Ship hull
    ctx.fillStyle = '#556655';
    ctx.beginPath();
    ctx.moveTo(840, 160);
    ctx.lineTo(880, 100);
    ctx.lineTo(1000, 100);
    ctx.lineTo(1040, 140);
    ctx.lineTo(1040, 180);
    ctx.lineTo(1000, 220);
    ctx.lineTo(880, 220);
    ctx.lineTo(840, 160);
    ctx.closePath();
    ctx.fill();

    // Engine glow
    ctx.fillStyle = COLORS.engines;
    ctx.globalAlpha = 0.5 + Math.sin(animTime * 8) * 0.2;
    ctx.beginPath();
    ctx.ellipse(1045, 160, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Rooms
    for (const room of enemyShip.rooms) {
        ctx.fillStyle = '#4a5a4a';
        ctx.fillRect(room.x, room.y, room.w, room.h);
        ctx.strokeStyle = '#3a4a3a';
        ctx.lineWidth = 1;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        if (targetingMode) {
            ctx.strokeStyle = COLORS.textRed;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);
            ctx.setLineDash([]);
        }
    }
}

function drawProjectiles() {
    for (const p of projectiles) {
        if (p.delay > 0) continue;

        ctx.fillStyle = p.color;
        if (p.type === 'missile') {
            // Missile shape
            ctx.beginPath();
            const angle = Math.atan2(p.targetY - p.y, p.targetX - p.x);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);
            ctx.fillRect(-8, -3, 16, 6);
            ctx.restore();
            // Trail
            addParticle(p.x, p.y, COLORS.weapons);
        } else if (p.type === 'ion') {
            // Ion ball
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5 + Math.sin(animTime * 20) * 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Laser beam
            ctx.fillRect(p.x - 10, p.y - 2, 20, 4);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * (p.life / 30), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
    for (const ft of floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 60;
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
}

function drawTopBar() {
    // Hull bar
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(10, 10, 250, 25);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 250, 25);

    ctx.fillStyle = COLORS.textGreen;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('HULL', 15, 27);

    for (let i = 0; i < 30; i++) {
        const filled = i < playerShip.hull;
        ctx.fillStyle = filled ? COLORS.textGreen : '#333333';
        ctx.fillRect(60 + i * 6, 14, 4, 17);
    }

    // Shield indicator
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(10, 40, 180, 20);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(10, 40, 180, 20);

    ctx.fillStyle = COLORS.shields;
    ctx.font = '12px Courier New';
    ctx.fillText('SHIELDS', 15, 54);

    const shields = playerShip.systems.shields;
    for (let i = 0; i < shields.maxLayers; i++) {
        ctx.fillStyle = i < shields.layers ? COLORS.shields : '#333333';
        ctx.beginPath();
        ctx.arc(100 + i * 25, 50, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Resources
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(270, 10, 200, 25);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(270, 10, 200, 25);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`Scrap: ${game.scrap}`, 310, 27);
    ctx.fillStyle = COLORS.textOrange;
    ctx.fillText(`Missiles: ${game.missiles}`, 385, 27);
    ctx.fillStyle = COLORS.textBlue;
    ctx.fillText(`Fuel: ${game.fuel}`, 450, 27);

    // Sector/Beacon
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(490, 10, 120, 25);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(490, 10, 120, 25);
    ctx.fillStyle = COLORS.textYellow;
    ctx.fillText(`Sector ${game.sector} - ${game.beacon}/${game.beacons}`, 550, 27);
}

function drawCrewList() {
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(10, 100, 90, 180);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 100, 90, 180);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';

    for (let i = 0; i < playerShip.crew.length; i++) {
        const crew = playerShip.crew[i];
        const y = 120 + i * 50;
        const raceData = CREW_RACES[crew.race];

        ctx.fillStyle = crew.selected ? COLORS.textYellow : raceData.color;
        ctx.beginPath();
        ctx.arc(25, y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.textWhite;
        ctx.fillText(crew.name, 40, y + 4);
        ctx.fillStyle = '#888888';
        ctx.fillText(raceData.name, 40, y + 14);

        ctx.fillStyle = '#333333';
        ctx.fillRect(40, y + 18, 50, 6);
        ctx.fillStyle = crew.health > 50 ? COLORS.textGreen : COLORS.textRed;
        ctx.fillRect(40, y + 18, 50 * (crew.health / crew.maxHealth), 6);
    }
}

function drawWeaponBar() {
    const y = 620;

    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(350, y - 10, 400, 80);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(350, y - 10, 400, 80);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('WEAPONS', 550, y + 5);

    for (let i = 0; i < playerShip.weapons.length; i++) {
        const weapon = playerShip.weapons[i];
        const x = 400 + i * 120;

        ctx.fillStyle = weapon.powered ? '#2a3a2a' : '#2a2a2a';
        ctx.fillRect(x, y + 10, 110, 50);

        const ready = weapon.charge >= weapon.chargeTime;
        ctx.strokeStyle = ready ? COLORS.textGreen : COLORS.uiBorder;
        ctx.lineWidth = ready ? 2 : 1;
        ctx.strokeRect(x, y + 10, 110, 50);

        ctx.fillStyle = weapon.powered ? COLORS.textWhite : '#666666';
        ctx.font = '9px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(weapon.name, x + 5, y + 25);

        // Type indicator
        ctx.fillStyle = weapon.type === 'missile' ? COLORS.textOrange : weapon.type === 'ion' ? COLORS.ion : COLORS.textGreen;
        ctx.fillText(weapon.type.toUpperCase(), x + 5, y + 35);

        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 5, y + 42, 100, 8);
        ctx.fillStyle = ready ? COLORS.textGreen : COLORS.textOrange;
        ctx.fillRect(x + 5, y + 42, 100 * Math.min(1, weapon.charge / weapon.chargeTime), 8);

        ctx.fillStyle = weapon.powered ? COLORS.textGreen : '#444444';
        ctx.fillRect(x + 5, y + 53, 8, 5);
    }
}

function drawSystemPanel() {
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(10, 55, 200, 200);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 55, 200, 200);

    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const startY = 60;

    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const y = startY + i * 35;

        ctx.fillStyle = getSystemColor(systems[i]);
        ctx.fillText(systems[i].toUpperCase(), 15, y + 15);

        ctx.fillStyle = sys.power > 0 ? COLORS.textRed : '#333333';
        ctx.fillRect(100, y, 15, 20);
        ctx.fillStyle = COLORS.textWhite;
        ctx.textAlign = 'center';
        ctx.fillText('-', 107, y + 15);

        ctx.fillStyle = COLORS.textWhite;
        ctx.fillText(`${sys.power}/${sys.maxPower}`, 142, y + 15);

        ctx.fillStyle = sys.power < sys.maxPower && playerShip.reactor.current > 0 ? COLORS.textGreen : '#333333';
        ctx.fillRect(170, y, 15, 20);
        ctx.fillStyle = COLORS.textWhite;
        ctx.fillText('+', 177, y + 15);

        ctx.textAlign = 'left';
    }

    ctx.fillStyle = COLORS.textYellow;
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(`REACTOR: ${playerShip.reactor.current}/${playerShip.reactor.max}`, 15, 245);
}

function drawTargetPanel() {
    if (!enemyShip) return;

    const x = 1050, y = 70;

    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(x, y, 220, 200);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 220, 200);

    ctx.fillStyle = COLORS.textRed;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET', x + 110, y + 20);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '12px Courier New';
    ctx.fillText(enemyShip.name, x + 110, y + 40);

    ctx.fillStyle = COLORS.textGreen;
    ctx.textAlign = 'left';
    ctx.fillText('HULL', x + 10, y + 65);

    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 60, y + 55, 150, 15);
    ctx.fillStyle = enemyShip.hull > enemyShip.maxHull * 0.3 ? COLORS.textGreen : COLORS.textRed;
    ctx.fillRect(x + 60, y + 55, 150 * (enemyShip.hull / enemyShip.maxHull), 15);

    ctx.fillStyle = COLORS.shields;
    ctx.fillText('SHIELDS', x + 10, y + 90);

    for (let i = 0; i < enemyShip.shields.maxLayers; i++) {
        ctx.fillStyle = i < enemyShip.shields.layers ? COLORS.shields : '#333333';
        ctx.beginPath();
        ctx.arc(x + 100 + i * 25, y + 85, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = COLORS.textOrange;
    ctx.fillText(`EVASION: ${enemyShip.evasion}%`, x + 10, y + 115);

    // Mini ship preview
    ctx.fillStyle = '#556655';
    ctx.fillRect(x + 50, y + 125, 120, 50);

    ctx.fillStyle = COLORS.textRed;
    ctx.textAlign = 'center';
    ctx.fillText('HOSTILE', x + 110, y + 190);
}

function drawCombatLog() {
    const x = 780, y = 620;

    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(x, y - 10, 200, 80);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(x, y - 10, 200, 80);

    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';

    for (let i = 0; i < combatLog.length; i++) {
        const log = combatLog[i];
        ctx.fillStyle = log.color;
        ctx.globalAlpha = log.time / 120;
        ctx.fillText(log.text, x + 10, y + 10 + i * 14);
    }
    ctx.globalAlpha = 1;
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '18px Courier New';
    ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 40);
}

function drawTargetingCursor() {
    ctx.strokeStyle = COLORS.textRed;
    ctx.lineWidth = 2;

    const pulse = 1 + Math.sin(animTime * 10) * 0.1;
    ctx.setLineDash([5, 5]);

    for (const room of enemyShip.rooms) {
        ctx.strokeRect(room.x - 3 * pulse, room.y - 3 * pulse, (room.w + 6) * pulse, (room.h + 6) * pulse);
    }

    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.textRed;
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT TARGET ROOM', 930, 250);
}

function drawTitleScreen() {
    ctx.fillStyle = COLORS.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStarfield();

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 72px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FTL', canvas.width / 2, 260);

    ctx.font = '28px Courier New';
    ctx.fillText('FASTER THAN LIGHT', canvas.width / 2, 310);

    ctx.fillStyle = COLORS.textGreen;
    ctx.font = '20px Courier New';
    ctx.fillText('Click to Start', canvas.width / 2, 420);

    ctx.fillStyle = COLORS.textBlue;
    ctx.font = '14px Courier New';
    ctx.fillText('SPACE: Pause | Click weapons to fire | Click crew then rooms to move', canvas.width / 2, 520);
    ctx.fillText('ESC: Cancel | M: Map (placeholder)', canvas.width / 2, 545);
}

function drawEventScreen() {
    ctx.fillStyle = COLORS.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStarfield();

    ctx.fillStyle = COLORS.uiPanel;
    ctx.fillRect(300, 150, 680, 400);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(300, 150, 680, 400);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '18px Courier New';
    ctx.textAlign = 'center';
    const lines = game.eventText.match(/.{1,60}(\s|$)/g) || [game.eventText];
    lines.forEach((line, i) => {
        ctx.fillText(line.trim(), 640, 220 + i * 25);
    });

    for (let i = 0; i < game.eventChoices.length; i++) {
        const cy = 350 + i * 50;
        ctx.fillStyle = COLORS.uiDark;
        ctx.fillRect(400, cy, 480, 40);
        ctx.strokeStyle = COLORS.textGreen;
        ctx.strokeRect(400, cy, 480, 40);

        ctx.fillStyle = COLORS.textGreen;
        ctx.font = '14px Courier New';
        ctx.fillText(`${i + 1}. ${game.eventChoices[i].text}`, 640, cy + 25);
    }
}

function drawMapScreen() {
    ctx.fillStyle = COLORS.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStarfield();

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`SECTOR ${game.sector} MAP`, canvas.width / 2, 100);

    // Simple beacon display
    for (let i = 0; i < game.beacons; i++) {
        const x = 200 + i * 100;
        const y = 300 + Math.sin(i * 0.8) * 50;
        ctx.fillStyle = i < game.beacon ? COLORS.textGreen : i === game.beacon ? COLORS.textYellow : '#444444';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        if (i < game.beacons - 1) {
            ctx.strokeStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(x + 15, y);
            ctx.lineTo(x + 85, 300 + Math.sin((i + 1) * 0.8) * 50);
            ctx.stroke();
        }
    }

    ctx.fillStyle = COLORS.textBlue;
    ctx.font = '14px Courier New';
    ctx.fillText('Click to return to combat', canvas.width / 2, 500);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.textRed;
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP DESTROYED', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '20px Courier New';
    ctx.fillText(`Reached Sector ${game.sector}, Beacon ${game.beacon}`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '18px Courier New';
    ctx.fillText('Click to try again', canvas.width / 2, canvas.height / 2 + 70);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.textGreen;
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ENEMY DESTROYED', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = COLORS.textYellow;
    ctx.font = '24px Courier New';
    ctx.fillText(`+${enemyShip.scrap} Scrap`, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = COLORS.textOrange;
    ctx.fillText(`+${enemyShip.missiles} Missiles`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillStyle = COLORS.textBlue;
    ctx.fillText(`+${enemyShip.fuel} Fuel`, canvas.width / 2, canvas.height / 2 + 60);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '18px Courier New';
    ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 110);
}

function getSystemColor(system) {
    const colors = {
        shields: COLORS.shields,
        weapons: COLORS.weapons,
        engines: COLORS.engines,
        oxygen: COLORS.oxygen,
        medbay: COLORS.medbay,
        piloting: COLORS.textWhite,
        sensors: COLORS.textBlue,
        doors: COLORS.textOrange
    };
    return colors[system] || COLORS.textWhite;
}

// Update projectile logic to handle enemy projectiles
const originalUpdate = update;
update = function() {
    originalUpdate();

    // Handle enemy projectiles separately
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.fromEnemy && p.delay <= 0) {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) {
                enemyProjectileHit(p);
                projectiles.splice(i, 1);
            }
        }
    }
};

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start
initShips();
gameLoop();
