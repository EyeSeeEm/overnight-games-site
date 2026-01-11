// FTL Clone - Space Roguelike
// Built with LittleJS

'use strict';

// Game constants
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;

// Colors
const COLORS = {
    UI_DARK: new Color(0.1, 0.1, 0.18),
    UI_BORDER: new Color(0.23, 0.23, 0.36),
    TEXT_WHITE: new Color(1, 1, 1),
    TEXT_GREEN: new Color(0, 1, 0),
    TEXT_RED: new Color(1, 0.27, 0.27),
    TEXT_BLUE: new Color(0.27, 0.53, 1),
    TEXT_ORANGE: new Color(1, 0.67, 0),
    SHIELDS: new Color(0, 0.8, 1),
    WEAPONS: new Color(1, 0.4, 0),
    ENGINES: new Color(1, 1, 0),
    OXYGEN: new Color(0.53, 1, 0.53),
    MEDBAY: new Color(0, 1, 0),
    CREW_HUMAN: new Color(1, 0.8, 0.53),
    FIRE: new Color(1, 0.27, 0),
    HULL: new Color(0.4, 0.4, 0.5)
};

// Game state
let gameState = 'map'; // 'map', 'combat', 'event', 'store', 'paused'
let previousState = 'map';
let playerShip = null;
let enemyShip = null;
let sectorMap = null;
let currentBeacon = 0;
let sector = 1;

// Resources
let scrap = 30;
let fuel = 16;
let missiles = 8;
let droneParts = 2;

// Combat state
let weapons = [];
let selectedWeapon = null;
let targetRoom = null;
let combatLog = [];

// Ship class
class Ship {
    constructor(x, y, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.isEnemy = isEnemy;
        this.hull = isEnemy ? 8 : 30;
        this.maxHull = this.hull;
        this.rooms = [];
        this.crew = [];
        this.reactor = isEnemy ? 8 : 8;
        this.maxReactor = this.reactor;

        // Systems
        this.systems = {
            shields: { level: 2, power: 2, maxPower: 2, damage: 0 },
            weapons: { level: 2, power: 2, maxPower: 2, damage: 0 },
            engines: { level: 2, power: 1, maxPower: 2, damage: 0 },
            oxygen: { level: 1, power: 1, maxPower: 1, damage: 0 },
            medbay: { level: 1, power: 0, maxPower: 1, damage: 0 },
            piloting: { level: 1, power: 0, maxPower: 0, damage: 0 }
        };

        // Shield state
        this.shieldLayers = 1;
        this.maxShieldLayers = 1;
        this.shieldRecharge = 0;

        // Evasion
        this.evasion = 15;

        // Weapons
        this.weapons = [];

        this.createRooms();
        if (!isEnemy) {
            this.createCrew();
            this.addWeapon('burstLaser');
            this.addWeapon('artemis');
        } else {
            this.addWeapon('basicLaser');
            if (sector >= 2) this.addWeapon('basicLaser');
        }
    }

    createRooms() {
        const roomData = this.isEnemy ? [
            { name: 'shields', x: 0, y: 0, w: 2, h: 2, system: 'shields' },
            { name: 'weapons', x: 2, y: 0, w: 2, h: 1, system: 'weapons' },
            { name: 'engines', x: 2, y: 1, w: 2, h: 1, system: 'engines' },
            { name: 'piloting', x: 4, y: 0, w: 1, h: 2, system: 'piloting' }
        ] : [
            { name: 'shields', x: 0, y: 1, w: 2, h: 2, system: 'shields' },
            { name: 'weapons', x: 2, y: 0, w: 2, h: 2, system: 'weapons' },
            { name: 'engines', x: 4, y: 2, w: 2, h: 1, system: 'engines' },
            { name: 'oxygen', x: 4, y: 1, w: 1, h: 1, system: 'oxygen' },
            { name: 'medbay', x: 5, y: 1, w: 1, h: 1, system: 'medbay' },
            { name: 'piloting', x: 6, y: 1, w: 1, h: 2, system: 'piloting' },
            { name: 'hallway', x: 2, y: 2, w: 2, h: 1, system: null },
            { name: 'door', x: 4, y: 0, w: 1, h: 1, system: null }
        ];

        roomData.forEach(r => {
            this.rooms.push({
                ...r,
                worldX: this.x + r.x * TILE_SIZE,
                worldY: this.y + r.y * TILE_SIZE,
                worldW: r.w * TILE_SIZE,
                worldH: r.h * TILE_SIZE,
                fire: 0,
                breach: false,
                oxygen: 100
            });
        });
    }

    createCrew() {
        // Start with 3 crew
        this.crew.push({ name: 'Captain', room: 'piloting', hp: 100, maxHp: 100, skill: 1 });
        this.crew.push({ name: 'Engineer', room: 'engines', hp: 100, maxHp: 100, skill: 1 });
        this.crew.push({ name: 'Gunner', room: 'weapons', hp: 100, maxHp: 100, skill: 1 });
    }

    addWeapon(type) {
        const weaponTypes = {
            basicLaser: { name: 'Basic Laser', power: 1, chargeTime: 10, damage: 1, shots: 1, type: 'laser' },
            burstLaser: { name: 'Burst Laser I', power: 2, chargeTime: 11, damage: 1, shots: 2, type: 'laser' },
            artemis: { name: 'Artemis', power: 1, chargeTime: 11, damage: 2, shots: 1, type: 'missile', missilesCost: 1 }
        };

        const w = { ...weaponTypes[type], charge: 0, powered: true, target: null };
        this.weapons.push(w);
    }

    getRoom(name) {
        return this.rooms.find(r => r.name === name);
    }

    getRoomAtPoint(px, py) {
        return this.rooms.find(r =>
            px >= r.worldX && px < r.worldX + r.worldW &&
            py >= r.worldY && py < r.worldY + r.worldH
        );
    }

    update(dt) {
        // Update shields
        if (this.systems.shields.power > 0 && this.shieldLayers < this.maxShieldLayers) {
            this.shieldRecharge += dt;
            if (this.shieldRecharge >= 2) {
                this.shieldLayers++;
                this.shieldRecharge = 0;
            }
        }

        // Calculate max shield layers based on power
        this.maxShieldLayers = Math.floor(this.systems.shields.power / 2);

        // Calculate evasion
        const pilotRoom = this.getRoom('piloting');
        const pilotCrew = this.crew.find(c => c.room === 'piloting');
        const engineRoom = this.getRoom('engines');
        const engineCrew = this.crew.find(c => c.room === 'engines');

        if (pilotCrew && this.systems.engines.power > 0) {
            this.evasion = 5 + this.systems.engines.power * 5;
            if (pilotCrew) this.evasion += 5;
            if (engineCrew) this.evasion += 5;
        } else {
            this.evasion = 0;
        }

        // Update weapons
        this.weapons.forEach(w => {
            if (w.powered && w.charge < w.chargeTime) {
                w.charge += dt;
                // Weapons crew bonus
                const weaponsCrew = this.crew.find(c => c.room === 'weapons');
                if (weaponsCrew) w.charge += dt * 0.1;
            }
        });

        // Heal crew in medbay
        if (this.systems.medbay.power > 0) {
            const medbayRoom = this.getRoom('medbay');
            this.crew.forEach(c => {
                if (c.room === 'medbay' && c.hp < c.maxHp) {
                    c.hp = Math.min(c.maxHp, c.hp + dt * 5 * this.systems.medbay.power);
                }
            });
        }
    }

    takeDamage(damage, room, type = 'laser') {
        // Check shields
        if (type !== 'missile' && this.shieldLayers > 0) {
            this.shieldLayers--;
            this.shieldRecharge = 0;
            addCombatLog(`${this.isEnemy ? 'Enemy' : 'Player'} shields absorb hit`);
            return;
        }

        // Check evasion
        if (Math.random() * 100 < this.evasion) {
            addCombatLog(`${this.isEnemy ? 'Enemy' : 'Player'} evades!`);
            return;
        }

        // Apply damage
        this.hull -= damage;
        addCombatLog(`${this.isEnemy ? 'Enemy' : 'Player'} takes ${damage} damage`);

        // Damage system in room
        if (room && room.system && this.systems[room.system]) {
            this.systems[room.system].damage = Math.min(
                this.systems[room.system].level,
                this.systems[room.system].damage + 1
            );
        }

        // Random fire chance
        if (room && Math.random() < 0.1) {
            room.fire = Math.min(3, room.fire + 1);
        }
    }

    draw() {
        // Draw rooms
        this.rooms.forEach(room => {
            // Room background
            const alpha = room.system ? 0.8 : 0.5;
            let roomColor = COLORS.HULL;
            if (room.system && this.systems[room.system]) {
                const colors = {
                    shields: COLORS.SHIELDS,
                    weapons: COLORS.WEAPONS,
                    engines: COLORS.ENGINES,
                    oxygen: COLORS.OXYGEN,
                    medbay: COLORS.MEDBAY,
                    piloting: COLORS.TEXT_BLUE
                };
                roomColor = colors[room.system] || COLORS.HULL;
            }

            drawRect(
                vec2(room.worldX + room.worldW/2, room.worldY + room.worldH/2),
                vec2(room.worldW - 2, room.worldH - 2),
                roomColor.scale(alpha)
            );

            // Room border
            drawRect(
                vec2(room.worldX + room.worldW/2, room.worldY + room.worldH/2),
                vec2(room.worldW, room.worldH),
                new Color(0,0,0,0),
                COLORS.UI_BORDER
            );

            // Fire
            if (room.fire > 0) {
                drawRect(
                    vec2(room.worldX + room.worldW/2, room.worldY + room.worldH/2),
                    vec2(room.worldW - 4, room.worldH - 4),
                    COLORS.FIRE.scale(0.5 + room.fire * 0.15)
                );
            }

            // System damage indicator
            if (room.system && this.systems[room.system] && this.systems[room.system].damage > 0) {
                const dmg = this.systems[room.system].damage;
                for (let i = 0; i < dmg; i++) {
                    drawRect(
                        vec2(room.worldX + 8 + i * 8, room.worldY + 8),
                        vec2(6, 6),
                        COLORS.TEXT_RED
                    );
                }
            }
        });

        // Draw crew
        this.crew.forEach(c => {
            const room = this.getRoom(c.room);
            if (room) {
                const cx = room.worldX + room.worldW/2;
                const cy = room.worldY + room.worldH/2;

                // Body
                drawRect(vec2(cx, cy), vec2(12, 16), COLORS.CREW_HUMAN);
                // Head
                drawRect(vec2(cx, cy - 10), vec2(8, 8), COLORS.CREW_HUMAN);

                // Health bar if damaged
                if (c.hp < c.maxHp) {
                    drawRect(vec2(cx, cy + 14), vec2(16, 3), COLORS.TEXT_RED);
                    drawRect(vec2(cx - 8 + (c.hp/c.maxHp) * 8, cy + 14), vec2(16 * c.hp/c.maxHp, 3), COLORS.TEXT_GREEN);
                }
            }
        });

        // Draw shields
        if (this.shieldLayers > 0) {
            const shipCenter = vec2(
                this.x + 3.5 * TILE_SIZE,
                this.y + 1.5 * TILE_SIZE
            );
            for (let i = 0; i < this.shieldLayers; i++) {
                const radius = 100 + i * 15;
                drawRect(
                    shipCenter,
                    vec2(radius * 2, radius * 1.5),
                    new Color(0, 0.8, 1, 0.1),
                    COLORS.SHIELDS.scale(0.5)
                );
            }
        }
    }
}

// Weapon types database
const WEAPON_DB = {
    basicLaser: { name: 'Basic Laser', power: 1, chargeTime: 10, damage: 1, shots: 1, type: 'laser' },
    burstLaser: { name: 'Burst Laser I', power: 2, chargeTime: 11, damage: 1, shots: 2, type: 'laser' },
    artemis: { name: 'Artemis', power: 1, chargeTime: 11, damage: 2, shots: 1, type: 'missile', missilesCost: 1 }
};

// Sector map
class SectorMap {
    constructor() {
        this.beacons = [];
        this.connections = [];
        this.exitBeacon = -1;
        this.generateMap();
    }

    generateMap() {
        // Generate 12-15 beacons
        const beaconCount = 12 + Math.floor(Math.random() * 4);

        for (let i = 0; i < beaconCount; i++) {
            const col = Math.floor(i / 3);
            const row = i % 3;
            this.beacons.push({
                id: i,
                x: 150 + col * 120 + (Math.random() - 0.5) * 60,
                y: 250 + row * 120 + (Math.random() - 0.5) * 40,
                visited: i === 0,
                type: this.randomBeaconType(),
                hasStore: Math.random() < 0.15,
                isExit: false
            });
        }

        // Mark last beacon as exit
        this.exitBeacon = beaconCount - 1;
        this.beacons[this.exitBeacon].isExit = true;
        this.beacons[this.exitBeacon].type = 'exit';

        // Create connections
        for (let i = 0; i < beaconCount - 1; i++) {
            // Connect to next beacons
            const nextOptions = [i + 1, i + 2, i + 3].filter(n => n < beaconCount);
            nextOptions.forEach(n => {
                if (Math.random() < 0.6) {
                    this.connections.push([i, n]);
                }
            });
            // Ensure at least one connection forward
            if (!this.connections.some(c => c[0] === i)) {
                const next = Math.min(i + 1, beaconCount - 1);
                this.connections.push([i, next]);
            }
        }
    }

    randomBeaconType() {
        const types = ['empty', 'combat', 'combat', 'combat', 'event', 'event', 'distress', 'nebula'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getConnected(beaconId) {
        return this.connections
            .filter(c => c[0] === beaconId || c[1] === beaconId)
            .map(c => c[0] === beaconId ? c[1] : c[0])
            .filter(id => id > beaconId); // Can only go forward
    }

    draw() {
        // Draw title
        drawTextScreen(`SECTOR ${sector}`, vec2(640, 50), 32, COLORS.TEXT_WHITE);
        drawTextScreen('Select a beacon to jump to', vec2(640, 90), 16, COLORS.TEXT_BLUE);

        // Draw connections
        this.connections.forEach(([a, b]) => {
            const ba = this.beacons[a];
            const bb = this.beacons[b];
            // Draw line using thin rectangle
            const dx = bb.x - ba.x;
            const dy = bb.y - ba.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx);
            drawRect(
                vec2((ba.x + bb.x)/2, (ba.y + bb.y)/2),
                vec2(len, 2),
                COLORS.UI_BORDER,
                undefined,
                angle
            );
        });

        // Draw beacons
        this.beacons.forEach((b, i) => {
            let color = COLORS.UI_BORDER;
            if (b.visited) color = COLORS.TEXT_GREEN;
            if (i === currentBeacon) color = COLORS.TEXT_BLUE;
            if (b.isExit) color = COLORS.TEXT_ORANGE;

            // Beacon circle
            drawRect(vec2(b.x, b.y), vec2(20, 20), color);

            // Store indicator
            if (b.hasStore) {
                drawRect(vec2(b.x, b.y - 15), vec2(8, 8), COLORS.TEXT_ORANGE);
            }

            // Type indicator for unvisited
            if (!b.visited && i !== currentBeacon) {
                const typeColors = {
                    combat: COLORS.TEXT_RED,
                    event: COLORS.TEXT_BLUE,
                    distress: COLORS.TEXT_ORANGE,
                    nebula: new Color(0.5, 0.3, 0.8),
                    empty: COLORS.UI_BORDER,
                    exit: COLORS.TEXT_GREEN
                };
                drawRect(vec2(b.x, b.y + 15), vec2(6, 6), typeColors[b.type] || COLORS.UI_BORDER);
            }
        });

        // Current position marker
        const current = this.beacons[currentBeacon];
        drawRect(vec2(current.x, current.y), vec2(28, 28), new Color(0,0,0,0), COLORS.TEXT_WHITE);

        // Draw available jumps
        const connected = this.getConnected(currentBeacon);
        connected.forEach(id => {
            const b = this.beacons[id];
            drawRect(vec2(b.x, b.y), vec2(24, 24), new Color(0,0,0,0), COLORS.TEXT_GREEN);
        });

        // Resources display
        drawTextScreen(`Scrap: ${scrap}`, vec2(100, 650), 16, COLORS.TEXT_ORANGE);
        drawTextScreen(`Fuel: ${fuel}`, vec2(250, 650), 16, COLORS.TEXT_BLUE);
        drawTextScreen(`Missiles: ${missiles}`, vec2(400, 650), 16, COLORS.TEXT_RED);
        drawTextScreen(`Hull: ${playerShip.hull}/${playerShip.maxHull}`, vec2(550, 650), 16, COLORS.TEXT_GREEN);
    }
}

// Combat log
function addCombatLog(msg) {
    combatLog.unshift(msg);
    if (combatLog.length > 5) combatLog.pop();
}

// Event data
const EVENTS = [
    {
        title: 'Distress Signal',
        text: 'You receive a distress signal from a damaged ship. Do you investigate?',
        options: [
            { text: 'Help them', result: () => { scrap += 15; return 'They reward you with 15 scrap.'; } },
            { text: 'Ignore it', result: () => { return 'You continue on your way.'; } }
        ]
    },
    {
        title: 'Abandoned Station',
        text: 'You find an abandoned space station. Search it?',
        options: [
            { text: 'Search carefully', result: () => {
                if (Math.random() < 0.7) { scrap += 20; fuel += 3; return 'Found 20 scrap and 3 fuel!'; }
                else { playerShip.hull -= 5; return 'Trap! Lost 5 hull.'; }
            }},
            { text: 'Leave', result: () => { return 'Better safe than sorry.'; } }
        ]
    },
    {
        title: 'Merchant',
        text: 'A friendly merchant offers supplies.',
        options: [
            { text: 'Buy fuel (5 scrap)', result: () => {
                if (scrap >= 5) { scrap -= 5; fuel += 3; return 'Bought 3 fuel.'; }
                return 'Not enough scrap!';
            }},
            { text: 'Buy missiles (6 scrap)', result: () => {
                if (scrap >= 6) { scrap -= 6; missiles += 2; return 'Bought 2 missiles.'; }
                return 'Not enough scrap!';
            }},
            { text: 'Leave', result: () => { return 'Maybe next time.'; } }
        ]
    }
];

let currentEvent = null;
let eventResult = null;

// Draw functions
function drawCombat() {
    // Draw player ship
    playerShip.draw();

    // Draw enemy ship
    if (enemyShip) {
        enemyShip.draw();
    }

    // Draw weapon charge bars
    let wy = 600;
    playerShip.weapons.forEach((w, i) => {
        const chargePercent = Math.min(1, w.charge / w.chargeTime);
        const barWidth = 150;

        // Background
        drawRect(vec2(100, wy), vec2(barWidth, 20), COLORS.UI_DARK);
        // Charge
        drawRect(vec2(100 - barWidth/2 + chargePercent * barWidth/2, wy),
            vec2(chargePercent * barWidth, 18),
            chargePercent >= 1 ? COLORS.TEXT_GREEN : COLORS.TEXT_ORANGE);
        // Name
        drawTextScreen(w.name, vec2(100, wy), 12, COLORS.TEXT_WHITE);

        // Selection highlight
        if (selectedWeapon === i && w.charge >= w.chargeTime) {
            drawRect(vec2(100, wy), vec2(barWidth + 4, 24), new Color(0,0,0,0), COLORS.TEXT_GREEN);
        }

        wy -= 30;
    });

    // Draw combat log
    combatLog.forEach((msg, i) => {
        drawTextScreen(msg, vec2(640, 650 - i * 18), 14, COLORS.TEXT_WHITE.scale(1 - i * 0.15));
    });

    // Draw hull bars
    drawTextScreen(`Your Hull: ${Math.ceil(playerShip.hull)}/${playerShip.maxHull}`, vec2(200, 30), 16, COLORS.TEXT_GREEN);
    if (enemyShip) {
        drawTextScreen(`Enemy Hull: ${Math.ceil(enemyShip.hull)}/${enemyShip.maxHull}`, vec2(1000, 30), 16, COLORS.TEXT_RED);
    }

    // Instructions
    drawTextScreen('Click weapon to select, click enemy room to fire | SPACE to pause', vec2(640, 700), 14, COLORS.TEXT_BLUE);
}

function drawEvent() {
    if (!currentEvent) return;

    // Event box
    drawRect(vec2(640, 360), vec2(600, 400), COLORS.UI_DARK, COLORS.UI_BORDER);

    // Title
    drawTextScreen(currentEvent.title, vec2(640, 200), 24, COLORS.TEXT_ORANGE);

    // Text
    drawTextScreen(currentEvent.text, vec2(640, 280), 16, COLORS.TEXT_WHITE);

    // Options or result
    if (eventResult) {
        drawTextScreen(eventResult, vec2(640, 380), 18, COLORS.TEXT_GREEN);
        drawTextScreen('Click to continue', vec2(640, 450), 14, COLORS.TEXT_BLUE);
    } else {
        currentEvent.options.forEach((opt, i) => {
            const y = 350 + i * 50;
            drawRect(vec2(640, y), vec2(400, 40), COLORS.UI_BORDER);
            drawTextScreen(opt.text, vec2(640, y), 16, COLORS.TEXT_WHITE);
        });
    }
}

function drawUI() {
    // Top bar
    drawRect(vec2(640, 15), vec2(1280, 30), COLORS.UI_DARK);

    // Power bar
    if (gameState === 'combat') {
        let px = 50;
        Object.entries(playerShip.systems).forEach(([name, sys]) => {
            if (sys.maxPower > 0) {
                // System name
                drawTextScreen(name.substring(0, 4).toUpperCase(), vec2(px, 15), 10, COLORS.TEXT_WHITE);
                // Power indicators
                for (let i = 0; i < sys.level; i++) {
                    const powered = i < sys.power;
                    const damaged = i >= sys.level - sys.damage;
                    let col = powered ? COLORS.TEXT_GREEN : COLORS.UI_BORDER;
                    if (damaged) col = COLORS.TEXT_RED;
                    drawRect(vec2(px + 35 + i * 10, 15), vec2(8, 16), col);
                }
                px += 100;
            }
        });
    }
}

function drawPaused() {
    drawRect(vec2(640, 360), vec2(300, 150), COLORS.UI_DARK, COLORS.UI_BORDER);
    drawTextScreen('PAUSED', vec2(640, 320), 32, COLORS.TEXT_ORANGE);
    drawTextScreen('Press SPACE to resume', vec2(640, 380), 16, COLORS.TEXT_BLUE);
}

// Game initialization
function gameInit() {
    // Set up canvas
    setCanvasFixedSize(vec2(GAME_WIDTH, GAME_HEIGHT));
    setCameraPos(vec2(GAME_WIDTH/2, GAME_HEIGHT/2));
    setCameraScale(1);

    // Create player ship
    playerShip = new Ship(50, 250, false);

    // Create sector map
    sectorMap = new SectorMap();
}

// Game update
function gameUpdate() {
    if (gameState === 'paused') {
        if (keyWasPressed('Space')) {
            gameState = previousState;
        }
        return;
    }

    if (keyWasPressed('Space') && gameState === 'combat') {
        previousState = gameState;
        gameState = 'paused';
        return;
    }

    if (gameState === 'map') {
        // Handle beacon clicks - use mousePosScreen for screen coordinates
        if (mouseWasPressed(0)) {
            const connected = sectorMap.getConnected(currentBeacon);
            // LittleJS mousePosScreen gives screen pixel coords
            const mx = mousePosScreen.x;
            const my = mousePosScreen.y;
            connected.forEach(id => {
                const b = sectorMap.beacons[id];
                const dist = Math.hypot(mx - b.x, my - b.y);
                if (dist < 30 && fuel > 0) {
                    fuel--;
                    currentBeacon = id;
                    b.visited = true;

                    // Handle beacon type
                    if (b.isExit) {
                        sector++;
                        if (sector > 8) {
                            // Win!
                            addCombatLog('Victory! You reached the Federation!');
                        } else {
                            sectorMap = new SectorMap();
                            currentBeacon = 0;
                        }
                    } else if (b.type === 'combat') {
                        startCombat();
                    } else if (b.type === 'event' || b.type === 'distress') {
                        currentEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
                        eventResult = null;
                        gameState = 'event';
                    } else if (b.hasStore) {
                        // Store - simple event
                        currentEvent = EVENTS[2]; // Merchant
                        eventResult = null;
                        gameState = 'event';
                    }
                }
            });
        }
    }

    if (gameState === 'combat') {
        // Update ships
        playerShip.update(1/60);
        if (enemyShip) {
            enemyShip.update(1/60);

            // Enemy AI - fire when ready
            enemyShip.weapons.forEach(w => {
                if (w.charge >= w.chargeTime && Math.random() < 0.02) {
                    // Fire at random player room
                    const targetRoom = playerShip.rooms[Math.floor(Math.random() * playerShip.rooms.length)];
                    for (let s = 0; s < w.shots; s++) {
                        playerShip.takeDamage(w.damage, targetRoom, w.type);
                    }
                    w.charge = 0;
                    addCombatLog(`Enemy fires ${w.name}!`);
                }
            });

            // Check victory
            if (enemyShip.hull <= 0) {
                addCombatLog('Enemy destroyed!');
                scrap += 15 + Math.floor(Math.random() * 20);
                if (Math.random() < 0.3) fuel += 2;
                if (Math.random() < 0.2) missiles += 1;
                enemyShip = null;
                gameState = 'map';
            }
        }

        // Check defeat
        if (playerShip.hull <= 0) {
            addCombatLog('Your ship is destroyed!');
            // Game over
            gameState = 'gameover';
        }

        // Weapon selection
        if (mouseWasPressed(0)) {
            // Use screen coordinates
            const mx = mousePosScreen.x;
            const my = mousePosScreen.y;

            // Check weapon clicks
            let wy = 600;
            playerShip.weapons.forEach((w, i) => {
                if (mx > 25 && mx < 175 &&
                    my > wy - 15 && my < wy + 15) {
                    if (w.charge >= w.chargeTime) {
                        selectedWeapon = i;
                    }
                }
                wy -= 30;
            });

            // Check enemy room clicks
            if (selectedWeapon !== null && enemyShip) {
                const w = playerShip.weapons[selectedWeapon];
                const room = enemyShip.getRoomAtPoint(mx, my);
                if (room) {
                    // Fire weapon
                    if (w.type === 'missile') {
                        if (missiles > 0) {
                            missiles--;
                        } else {
                            addCombatLog('No missiles!');
                            return;
                        }
                    }

                    for (let s = 0; s < w.shots; s++) {
                        enemyShip.takeDamage(w.damage, room, w.type);
                    }
                    w.charge = 0;
                    selectedWeapon = null;
                    addCombatLog(`Fired ${w.name} at ${room.name}!`);
                }
            }
        }
    }

    if (gameState === 'event') {
        if (mouseWasPressed(0)) {
            const mx = mousePosScreen.x;
            const my = mousePosScreen.y;

            if (eventResult) {
                // Continue
                gameState = 'map';
                currentEvent = null;
                eventResult = null;
            } else if (currentEvent) {
                // Check option clicks
                currentEvent.options.forEach((opt, i) => {
                    const y = 350 + i * 50;
                    if (mx > 440 && mx < 840 &&
                        my > y - 20 && my < y + 20) {
                        eventResult = opt.result();
                    }
                });
            }
        }
    }
}

function startCombat() {
    enemyShip = new Ship(800, 100, true);
    enemyShip.hull = 6 + sector * 2;
    enemyShip.maxHull = enemyShip.hull;
    gameState = 'combat';
    combatLog = [];
    addCombatLog('Combat started!');
    selectedWeapon = null;
}

// Game render
function gameRender() {
    // Clear background
    drawRect(vec2(640, 360), vec2(1280, 720), COLORS.UI_DARK);

    if (gameState === 'map') {
        sectorMap.draw();
    } else if (gameState === 'combat') {
        drawCombat();
    } else if (gameState === 'event') {
        drawEvent();
    } else if (gameState === 'gameover') {
        drawRect(vec2(640, 360), vec2(400, 200), COLORS.UI_DARK, COLORS.UI_BORDER);
        drawTextScreen('GAME OVER', vec2(640, 320), 36, COLORS.TEXT_RED);
        drawTextScreen(`Reached Sector ${sector}`, vec2(640, 380), 18, COLORS.TEXT_WHITE);
        drawTextScreen('Refresh to restart', vec2(640, 420), 14, COLORS.TEXT_BLUE);
    }

    drawUI();

    if (gameState === 'paused') {
        drawPaused();
    }
}

// Game render post (unused)
function gameRenderPost() {}

// Start engine
engineInit(gameInit, gameUpdate, gameRenderPost, gameRender, ['']);
