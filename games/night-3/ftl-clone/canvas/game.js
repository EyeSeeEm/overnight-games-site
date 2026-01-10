// FTL Clone - Canvas Version
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
    fire: '#ff4400',
    space: '#0a0a1a',
    shipHull: '#888888',
    roomFloor: '#4a4a5a',
    roomWall: '#2a2a3a'
};

// Game State
const game = {
    state: 'combat', // title, map, combat, event, gameover, victory
    paused: false,
    scrap: 50,
    fuel: 10,
    missiles: 8,
    droneParts: 2,
    sector: 1,
    beacon: 1
};

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
        oxygen: { level: 1, power: 1, maxPower: 1, damage: 0 },
        medbay: { level: 1, power: 0, maxPower: 1, damage: 0 },
        piloting: { level: 1, power: 0, maxPower: 0, damage: 0 },
        sensors: { level: 1, power: 0, maxPower: 0, damage: 0 },
        doors: { level: 1, power: 0, maxPower: 0, damage: 0 }
    },
    reactor: { current: 6, max: 8 },
    weapons: [
        { name: 'Burst Laser II', type: 'laser', power: 2, chargeTime: 12, charge: 0, shots: 3, damage: 1, powered: true },
        { name: 'Artemis Missile', type: 'missile', power: 1, chargeTime: 10, charge: 0, shots: 1, damage: 2, powered: false }
    ],
    crew: []
};

// Enemy Ship
const enemyShip = {
    name: 'Rebel Fighter',
    hull: 10,
    maxHull: 10,
    x: 900,
    y: 100,
    shields: { layers: 1, maxLayers: 1, rechargeTime: 0 },
    weapons: [
        { name: 'Basic Laser', chargeTime: 10, charge: 5, shots: 1, damage: 1 }
    ],
    evasion: 15,
    rooms: []
};

// Crew
class CrewMember {
    constructor(name, race, x, y, ship) {
        this.name = name;
        this.race = race;
        this.health = 100;
        this.maxHealth = 100;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.ship = ship;
        this.room = null;
        this.selected = false;
        this.skills = { piloting: 0, engines: 0, shields: 0, weapons: 0 };
    }
}

// Initialize ships
function initShips() {
    // Player ship rooms (simplified layout)
    const roomSize = 50;
    playerShip.rooms = [
        { name: 'Shields', system: 'shields', x: 120, y: 250, w: roomSize, h: roomSize * 2 },
        { name: 'Weapons', system: 'weapons', x: 170, y: 300, w: roomSize * 2, h: roomSize },
        { name: 'Cockpit', system: 'piloting', x: 320, y: 275, w: roomSize, h: roomSize },
        { name: 'Engines', system: 'engines', x: 70, y: 300, w: roomSize, h: roomSize },
        { name: 'Oxygen', system: 'oxygen', x: 220, y: 250, w: roomSize, h: roomSize },
        { name: 'Medbay', system: 'medbay', x: 170, y: 350, w: roomSize, h: roomSize },
        { name: 'Sensors', system: 'sensors', x: 270, y: 300, w: roomSize, h: roomSize },
        { name: 'Doors', system: 'doors', x: 270, y: 250, w: roomSize, h: roomSize }
    ];

    // Enemy ship rooms
    enemyShip.rooms = [
        { name: 'Shields', x: 880, y: 120, w: 40, h: 60 },
        { name: 'Weapons', x: 920, y: 150, w: 60, h: 40 },
        { name: 'Cockpit', x: 980, y: 130, w: 40, h: 40 },
        { name: 'Engines', x: 850, y: 150, w: 40, h: 40 }
    ];

    // Create player crew
    playerShip.crew = [
        new CrewMember('Captain', 'human', 330, 290, 'player'),
        new CrewMember('Engineer', 'human', 130, 280, 'player'),
        new CrewMember('Gunner', 'human', 200, 320, 'player')
    ];

    // Assign initial positions
    playerShip.crew[0].room = 'piloting';
    playerShip.crew[1].room = 'shields';
    playerShip.crew[2].room = 'weapons';
}

// Input
let selectedCrew = null;
let targetingMode = false;
let targetingWeapon = null;

canvas.addEventListener('click', handleClick);
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
document.addEventListener('keydown', handleKeydown);

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.state === 'title') {
        game.state = 'combat';
        return;
    }

    if (game.state === 'combat') {
        // Check weapon targeting
        if (targetingMode && targetingWeapon !== null) {
            // Check if clicking on enemy ship rooms
            for (const room of enemyShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    fireWeapon(targetingWeapon, room);
                    targetingMode = false;
                    targetingWeapon = null;
                    return;
                }
            }
        }

        // Check crew selection
        for (const crew of playerShip.crew) {
            const cx = crew.x;
            const cy = crew.y;
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

        // Move selected crew to room
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

        // Check weapon bar clicks
        const weaponBarY = 620;
        for (let i = 0; i < playerShip.weapons.length; i++) {
            const wx = 400 + i * 150;
            if (x >= wx && x <= wx + 140 && y >= weaponBarY && y <= weaponBarY + 60) {
                const weapon = playerShip.weapons[i];
                if (weapon.powered && weapon.charge >= weapon.chargeTime) {
                    targetingMode = true;
                    targetingWeapon = i;
                }
                return;
            }
        }

        // Check power bar clicks (system power adjustment)
        checkPowerBarClick(x, y);
    }

    if (game.state === 'gameover' || game.state === 'victory') {
        resetGame();
    }
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
}

function checkPowerBarClick(x, y) {
    // System power buttons (left side)
    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const startY = 60;

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const buttonY = startY + i * 35;

        // Minus button
        if (x >= 100 && x <= 115 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power > 0) {
                sys.power--;
                playerShip.reactor.current++;
            }
            return;
        }

        // Plus button
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

    // Use missiles if needed
    if (weapon.type === 'missile') {
        if (game.missiles <= 0) return;
        game.missiles--;
    }

    // Fire shots
    for (let i = 0; i < weapon.shots; i++) {
        setTimeout(() => {
            // Check evasion
            if (Math.random() * 100 < enemyShip.evasion) {
                addCombatLog('MISS');
                return;
            }

            // Check shields (missiles bypass)
            if (weapon.type !== 'missile' && enemyShip.shields.layers > 0) {
                enemyShip.shields.layers--;
                enemyShip.shields.rechargeTime = 0;
                addCombatLog('Shield hit');
                return;
            }

            // Deal damage
            enemyShip.hull -= weapon.damage;
            addCombatLog(`Hit! ${weapon.damage} damage`);

            // Check victory
            if (enemyShip.hull <= 0) {
                game.state = 'victory';
                game.scrap += 25;
            }
        }, i * 200);
    }
}

let combatLog = [];
function addCombatLog(message) {
    combatLog.unshift({ text: message, time: 120 });
    if (combatLog.length > 5) combatLog.pop();
}

// Update game logic
function update() {
    if (game.paused || game.state !== 'combat') return;

    // Update crew positions
    for (const crew of playerShip.crew) {
        const dx = crew.targetX - crew.x;
        const dy = crew.targetY - crew.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2) {
            crew.x += (dx / dist) * 2;
            crew.y += (dy / dist) * 2;
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

    // Update combat log
    combatLog = combatLog.filter(log => {
        log.time--;
        return log.time > 0;
    });
}

function enemyFire(weapon) {
    // Check player evasion
    const evasion = playerShip.systems.engines.power > 0 ? playerShip.systems.engines.evasion : 0;
    if (Math.random() * 100 < evasion) {
        addCombatLog('Enemy MISS');
        return;
    }

    // Check player shields
    const shields = playerShip.systems.shields;
    if (shields.layers > 0) {
        shields.layers--;
        shields.rechargeTime = 0;
        addCombatLog('Shields absorb hit');
        return;
    }

    // Deal damage to hull
    playerShip.hull -= weapon.damage;
    addCombatLog(`Hull hit! -${weapon.damage}`);

    // Check game over
    if (playerShip.hull <= 0) {
        game.state = 'gameover';
    }
}

function resetGame() {
    playerShip.hull = playerShip.maxHull;
    playerShip.systems.shields.layers = 1;
    enemyShip.hull = enemyShip.maxHull;
    enemyShip.shields.layers = 1;
    game.state = 'combat';
    game.scrap = 50;
    combatLog = [];
    for (const weapon of playerShip.weapons) {
        weapon.charge = 0;
    }
    for (const weapon of enemyShip.weapons) {
        weapon.charge = 0;
    }
}

// Drawing functions
function draw() {
    ctx.fillStyle = COLORS.space;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'title') {
        drawTitleScreen();
        return;
    }

    // Draw space background
    drawStarfield();

    // Draw ships
    drawPlayerShip();
    drawEnemyShip();

    // Draw UI
    drawTopBar();
    drawCrewList();
    drawWeaponBar();
    drawSystemPanel();
    drawTargetPanel();
    drawCombatLog();

    // Draw pause overlay
    if (game.paused) {
        drawPauseOverlay();
    }

    // Draw targeting cursor
    if (targetingMode) {
        drawTargetingCursor();
    }

    // Draw game over / victory
    if (game.state === 'gameover') {
        drawGameOver();
    } else if (game.state === 'victory') {
        drawVictory();
    }
}

function drawStarfield() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 137 + Date.now() * 0.01) % canvas.width;
        const y = (i * 91) % canvas.height;
        const size = (i % 3) + 1;
        ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Planet/nebula
    const gradient = ctx.createRadialGradient(1100, 500, 50, 1100, 500, 150);
    gradient.addColorStop(0, '#663333');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(950, 350, 300, 300);
}

function drawPlayerShip() {
    // Shield bubble
    if (playerShip.systems.shields.layers > 0) {
        ctx.strokeStyle = COLORS.shields;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(220, 310, 170, 100, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (playerShip.systems.shields.layers > 1) {
            ctx.beginPath();
            ctx.ellipse(220, 310, 180, 110, 0, 0, Math.PI * 2);
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

    // Rooms
    for (const room of playerShip.rooms) {
        // Room floor
        ctx.fillStyle = COLORS.roomFloor;
        ctx.fillRect(room.x, room.y, room.w, room.h);

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
        }
    }

    // Draw crew
    for (const crew of playerShip.crew) {
        drawCrewMember(crew);
    }
}

function drawCrewMember(crew) {
    ctx.fillStyle = crew.selected ? COLORS.textYellow : COLORS.human;
    ctx.beginPath();
    ctx.arc(crew.x, crew.y, 10, 0, Math.PI * 2);
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
        ctx.arc(crew.x, crew.y, 14, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawEnemyShip() {
    // Shield bubble
    if (enemyShip.shields.layers > 0) {
        ctx.strokeStyle = COLORS.shields;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(930, 160, 100, 60, 0, 0, Math.PI * 2);
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

    // Rooms
    for (const room of enemyShip.rooms) {
        ctx.fillStyle = '#4a5a4a';
        ctx.fillRect(room.x, room.y, room.w, room.h);
        ctx.strokeStyle = '#3a4a3a';
        ctx.lineWidth = 1;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        // Targeting highlight
        if (targetingMode) {
            ctx.strokeStyle = COLORS.textRed;
            ctx.lineWidth = 2;
            ctx.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);
        }
    }
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

    // Hull segments
    const hullPercent = playerShip.hull / playerShip.maxHull;
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

    // Shield bubbles
    const shields = playerShip.systems.shields;
    for (let i = 0; i < shields.maxLayers; i++) {
        ctx.fillStyle = i < shields.layers ? COLORS.shields : '#333333';
        ctx.beginPath();
        ctx.arc(100 + i * 25, 50, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Scrap counter
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(450, 10, 80, 25);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(450, 10, 80, 25);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`⚙ ${game.scrap}`, 490, 27);

    // FTL Drive / Jump button
    ctx.fillStyle = COLORS.textGreen;
    ctx.fillRect(560, 10, 80, 25);
    ctx.fillStyle = COLORS.uiDark;
    ctx.font = 'bold 12px Courier New';
    ctx.fillText('JUMP', 600, 27);

    // Missiles
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(660, 10, 60, 25);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(660, 10, 60, 25);
    ctx.fillStyle = COLORS.textOrange;
    ctx.fillText(`🚀 ${game.missiles}`, 690, 27);
}

function drawCrewList() {
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(10, 100, 90, 150);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 100, 90, 150);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';

    for (let i = 0; i < playerShip.crew.length; i++) {
        const crew = playerShip.crew[i];
        const y = 120 + i * 45;

        // Icon
        ctx.fillStyle = crew.selected ? COLORS.textYellow : COLORS.human;
        ctx.beginPath();
        ctx.arc(25, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Name
        ctx.fillStyle = COLORS.textWhite;
        ctx.fillText(crew.name, 40, y + 4);

        // Health bar
        ctx.fillStyle = '#333333';
        ctx.fillRect(40, y + 8, 50, 6);
        ctx.fillStyle = COLORS.textGreen;
        ctx.fillRect(40, y + 8, 50 * (crew.health / crew.maxHealth), 6);
    }
}

function drawWeaponBar() {
    const y = 620;

    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(350, y - 10, 350, 80);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(350, y - 10, 350, 80);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('WEAPONS', 525, y + 5);

    for (let i = 0; i < playerShip.weapons.length; i++) {
        const weapon = playerShip.weapons[i];
        const x = 400 + i * 150;

        // Weapon box
        ctx.fillStyle = weapon.powered ? '#2a3a2a' : '#2a2a2a';
        ctx.fillRect(x, y + 10, 140, 50);
        ctx.strokeStyle = weapon.charge >= weapon.chargeTime ? COLORS.textGreen : COLORS.uiBorder;
        ctx.lineWidth = weapon.charge >= weapon.chargeTime ? 2 : 1;
        ctx.strokeRect(x, y + 10, 140, 50);

        // Weapon name
        ctx.fillStyle = weapon.powered ? COLORS.textWhite : '#666666';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(weapon.name, x + 5, y + 25);

        // Charge bar
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 5, y + 35, 130, 10);
        ctx.fillStyle = weapon.charge >= weapon.chargeTime ? COLORS.textGreen : COLORS.textOrange;
        ctx.fillRect(x + 5, y + 35, 130 * Math.min(1, weapon.charge / weapon.chargeTime), 10);

        // Power indicator
        ctx.fillStyle = weapon.powered ? COLORS.textGreen : '#666666';
        ctx.fillRect(x + 5, y + 50, 10, 5);
    }

    ctx.fillStyle = COLORS.textOrange;
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('AUTOFIRE', 595, y + 75);
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

        // System name
        ctx.fillStyle = getSystemColor(systems[i]);
        ctx.fillText(systems[i].toUpperCase(), 15, y + 15);

        // Minus button
        ctx.fillStyle = sys.power > 0 ? COLORS.textRed : '#333333';
        ctx.fillRect(100, y, 15, 20);
        ctx.fillStyle = COLORS.textWhite;
        ctx.textAlign = 'center';
        ctx.fillText('-', 107, y + 15);

        // Power level
        ctx.fillStyle = COLORS.textWhite;
        ctx.fillText(`${sys.power}/${sys.maxPower}`, 142, y + 15);

        // Plus button
        ctx.fillStyle = sys.power < sys.maxPower && playerShip.reactor.current > 0 ? COLORS.textGreen : '#333333';
        ctx.fillRect(170, y, 15, 20);
        ctx.fillStyle = COLORS.textWhite;
        ctx.fillText('+', 177, y + 15);

        ctx.textAlign = 'left';
    }

    // Reactor power
    ctx.fillStyle = COLORS.textYellow;
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(`REACTOR: ${playerShip.reactor.current}/${playerShip.reactor.max}`, 15, 245);
}

function drawTargetPanel() {
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

    // Enemy name
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '12px Courier New';
    ctx.fillText(enemyShip.name, x + 110, y + 40);

    // Enemy hull
    ctx.fillStyle = COLORS.textGreen;
    ctx.textAlign = 'left';
    ctx.fillText('HULL', x + 10, y + 65);

    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 60, y + 55, 150, 15);
    ctx.fillStyle = COLORS.textGreen;
    ctx.fillRect(x + 60, y + 55, 150 * (enemyShip.hull / enemyShip.maxHull), 15);

    // Enemy shields
    ctx.fillStyle = COLORS.shields;
    ctx.fillText('SHIELDS', x + 10, y + 90);

    for (let i = 0; i < enemyShip.shields.maxLayers; i++) {
        ctx.fillStyle = i < enemyShip.shields.layers ? COLORS.shields : '#333333';
        ctx.beginPath();
        ctx.arc(x + 100 + i * 25, y + 85, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Mini ship preview
    ctx.fillStyle = '#556655';
    ctx.fillRect(x + 50, y + 110, 120, 60);

    // Relationship
    ctx.fillStyle = COLORS.textRed;
    ctx.textAlign = 'center';
    ctx.fillText('Relationship: Hostile', x + 110, y + 190);
}

function drawCombatLog() {
    const x = 750, y = 620;

    ctx.fillStyle = COLORS.uiDark;
    ctx.fillRect(x, y - 10, 200, 80);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(x, y - 10, 200, 80);

    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';

    for (let i = 0; i < combatLog.length; i++) {
        const log = combatLog[i];
        ctx.fillStyle = log.text.includes('MISS') ? COLORS.textBlue :
                       log.text.includes('hit') || log.text.includes('Hull') ? COLORS.textRed : COLORS.textWhite;
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
    ctx.setLineDash([5, 5]);

    for (const room of enemyShip.rooms) {
        ctx.strokeRect(room.x - 3, room.y - 3, room.w + 6, room.h + 6);
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
    ctx.font = 'bold 64px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FTL', canvas.width / 2, 280);

    ctx.font = '24px Courier New';
    ctx.fillText('FASTER THAN LIGHT', canvas.width / 2, 330);

    ctx.fillStyle = COLORS.textGreen;
    ctx.font = '18px Courier New';
    ctx.fillText('Click to Start', canvas.width / 2, 450);

    ctx.fillStyle = COLORS.textBlue;
    ctx.font = '14px Courier New';
    ctx.fillText('SPACE to pause | Click weapons to fire | Click rooms to move crew', canvas.width / 2, 550);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.textRed;
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP DESTROYED', canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '18px Courier New';
    ctx.fillText('Click to try again', canvas.width / 2, canvas.height / 2 + 50);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.textGreen;
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ENEMY DESTROYED', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = COLORS.textYellow;
    ctx.font = '24px Courier New';
    ctx.fillText(`+25 Scrap`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = '18px Courier New';
    ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 70);
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

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start
initShips();
gameLoop();
