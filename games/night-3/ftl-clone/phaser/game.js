// FTL Clone - Phaser Version
const config = {
    type: Phaser.CANVAS,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Colors
const COLORS = {
    uiDark: 0x1a1a2e,
    uiBorder: 0x3a3a5c,
    uiPanel: 0x252540,
    textWhite: 0xffffff,
    textGreen: 0x00ff00,
    textRed: 0xff4444,
    textBlue: 0x4488ff,
    textOrange: 0xffaa00,
    textYellow: 0xffff00,
    shields: 0x00ccff,
    weapons: 0xff6600,
    engines: 0xffff00,
    oxygen: 0x88ff88,
    medbay: 0x00ff00,
    human: 0xffcc88,
    shipHull: 0x888888,
    roomFloor: 0x4a4a5a,
    roomWall: 0x2a2a3a
};

// Game State
let gameState = {
    state: 'combat',
    paused: false,
    scrap: 50,
    fuel: 10,
    missiles: 8
};

// Player Ship
let playerShip = {
    hull: 30,
    maxHull: 30,
    rooms: [],
    systems: {
        shields: { level: 2, power: 2, maxPower: 2, damage: 0, layers: 1, maxLayers: 1, rechargeTime: 0 },
        weapons: { level: 2, power: 2, maxPower: 2, damage: 0 },
        engines: { level: 2, power: 1, maxPower: 2, damage: 0, evasion: 10 },
        oxygen: { level: 1, power: 1, maxPower: 1, damage: 0 },
        medbay: { level: 1, power: 0, maxPower: 1, damage: 0 }
    },
    reactor: { current: 6, max: 8 },
    weapons: [
        { name: 'Burst Laser II', type: 'laser', power: 2, chargeTime: 12, charge: 0, shots: 3, damage: 1, powered: true },
        { name: 'Artemis Missile', type: 'missile', power: 1, chargeTime: 10, charge: 0, shots: 1, damage: 2, powered: false }
    ],
    crew: []
};

// Enemy Ship
let enemyShip = {
    name: 'Rebel Fighter',
    hull: 10,
    maxHull: 10,
    shields: { layers: 1, maxLayers: 1, rechargeTime: 0 },
    weapons: [{ name: 'Basic Laser', chargeTime: 10, charge: 5, shots: 1, damage: 1 }],
    evasion: 15,
    rooms: []
};

// Crew class
class CrewMember {
    constructor(name, race, x, y) {
        this.name = name;
        this.race = race;
        this.health = 100;
        this.maxHealth = 100;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.selected = false;
        this.room = null;
    }
}

let graphics;
let scene;
let selectedCrew = null;
let targetingMode = false;
let targetingWeapon = null;
let combatLog = [];

function preload() {}

function create() {
    scene = this;
    graphics = this.add.graphics();

    initShips();

    this.input.on('pointerdown', handleClick);
    this.input.keyboard.on('keydown-SPACE', () => { gameState.paused = !gameState.paused; });
    this.input.keyboard.on('keydown-ESC', () => {
        targetingMode = false;
        targetingWeapon = null;
        selectedCrew = null;
        playerShip.crew.forEach(c => c.selected = false);
    });
}

function update() {
    graphics.clear();

    if (gameState.state === 'title') {
        drawTitleScreen();
        return;
    }

    if (!gameState.paused && gameState.state === 'combat') {
        updateGame();
    }

    drawStarfield();
    drawPlayerShip();
    drawEnemyShip();
    drawTopBar();
    drawCrewList();
    drawWeaponBar();
    drawSystemPanel();
    drawTargetPanel();
    drawCombatLog();

    if (gameState.paused) drawPauseOverlay();
    if (targetingMode) drawTargetingCursor();
    if (gameState.state === 'gameover') drawGameOver();
    if (gameState.state === 'victory') drawVictory();
}

function initShips() {
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

    enemyShip.rooms = [
        { name: 'Shields', x: 880, y: 120, w: 40, h: 60 },
        { name: 'Weapons', x: 920, y: 150, w: 60, h: 40 },
        { name: 'Cockpit', x: 980, y: 130, w: 40, h: 40 },
        { name: 'Engines', x: 850, y: 150, w: 40, h: 40 }
    ];

    playerShip.crew = [
        new CrewMember('Captain', 'human', 330, 290),
        new CrewMember('Engineer', 'human', 130, 280),
        new CrewMember('Gunner', 'human', 200, 320)
    ];
    playerShip.crew[0].room = 'piloting';
    playerShip.crew[1].room = 'shields';
    playerShip.crew[2].room = 'weapons';
}

function updateGame() {
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

    // Enemy AI
    for (const weapon of enemyShip.weapons) {
        weapon.charge += 1 / 60;
        if (weapon.charge >= weapon.chargeTime) {
            weapon.charge = 0;
            enemyFire(weapon);
        }
    }

    // Update combat log
    combatLog = combatLog.filter(log => { log.time--; return log.time > 0; });
}

function handleClick(pointer) {
    const x = pointer.x, y = pointer.y;

    if (gameState.state === 'title') { gameState.state = 'combat'; return; }

    if (gameState.state === 'combat') {
        // Weapon targeting
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

        // Crew selection
        for (const crew of playerShip.crew) {
            if (x >= crew.x - 15 && x <= crew.x + 15 && y >= crew.y - 15 && y <= crew.y + 15) {
                if (selectedCrew === crew) selectedCrew = null;
                else {
                    selectedCrew = crew;
                    playerShip.crew.forEach(c => c.selected = false);
                    crew.selected = true;
                }
                return;
            }
        }

        // Move crew to room
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

        // Weapon bar clicks
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

        // System power clicks
        checkPowerBarClick(x, y);
    }

    if (gameState.state === 'gameover' || gameState.state === 'victory') resetGame();
}

function checkPowerBarClick(x, y) {
    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const startY = 60;

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const buttonY = startY + i * 35;

        if (x >= 100 && x <= 115 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power > 0) { sys.power--; playerShip.reactor.current++; }
            return;
        }
        if (x >= 170 && x <= 185 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power < sys.maxPower && playerShip.reactor.current > 0) {
                sys.power++;
                playerShip.reactor.current--;
                if (systems[i] === 'shields') playerShip.systems.shields.maxLayers = Math.floor(sys.power / 2);
            }
            return;
        }
    }
}

function fireWeapon(weaponIndex, targetRoom) {
    const weapon = playerShip.weapons[weaponIndex];
    if (!weapon.powered || weapon.charge < weapon.chargeTime) return;
    weapon.charge = 0;

    if (weapon.type === 'missile') {
        if (gameState.missiles <= 0) return;
        gameState.missiles--;
    }

    for (let i = 0; i < weapon.shots; i++) {
        scene.time.delayedCall(i * 200, () => {
            if (Math.random() * 100 < enemyShip.evasion) { addCombatLog('MISS'); return; }
            if (weapon.type !== 'missile' && enemyShip.shields.layers > 0) {
                enemyShip.shields.layers--;
                addCombatLog('Shield hit');
                return;
            }
            enemyShip.hull -= weapon.damage;
            addCombatLog(`Hit! ${weapon.damage} damage`);
            if (enemyShip.hull <= 0) { gameState.state = 'victory'; gameState.scrap += 25; }
        });
    }
}

function enemyFire(weapon) {
    const evasion = playerShip.systems.engines.power > 0 ? playerShip.systems.engines.evasion : 0;
    if (Math.random() * 100 < evasion) { addCombatLog('Enemy MISS'); return; }

    const shields = playerShip.systems.shields;
    if (shields.layers > 0) { shields.layers--; addCombatLog('Shields absorb hit'); return; }

    playerShip.hull -= weapon.damage;
    addCombatLog(`Hull hit! -${weapon.damage}`);
    if (playerShip.hull <= 0) gameState.state = 'gameover';
}

function addCombatLog(message) {
    combatLog.unshift({ text: message, time: 120 });
    if (combatLog.length > 5) combatLog.pop();
}

function resetGame() {
    playerShip.hull = playerShip.maxHull;
    playerShip.systems.shields.layers = 1;
    enemyShip.hull = enemyShip.maxHull;
    enemyShip.shields.layers = 1;
    gameState.state = 'combat';
    gameState.scrap = 50;
    combatLog = [];
    playerShip.weapons.forEach(w => w.charge = 0);
    enemyShip.weapons.forEach(w => w.charge = 0);
}

// Drawing functions
function drawStarfield() {
    graphics.fillStyle(0xffffff);
    for (let i = 0; i < 100; i++) {
        const x = (i * 137 + scene.time.now * 0.01) % 1280;
        const y = (i * 91) % 720;
        graphics.globalAlpha = 0.3 + (i % 5) * 0.1;
        graphics.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
    }
    graphics.globalAlpha = 1;

    // Planet
    graphics.fillStyle(0x663333, 0.5);
    graphics.fillCircle(1100, 500, 100);
}

function drawPlayerShip() {
    // Shield bubble
    if (playerShip.systems.shields.layers > 0) {
        graphics.lineStyle(3, COLORS.shields, 0.5);
        graphics.strokeEllipse(220, 310, 340, 200);
        if (playerShip.systems.shields.layers > 1) graphics.strokeEllipse(220, 310, 360, 220);
    }

    // Ship hull
    graphics.fillStyle(COLORS.shipHull);
    graphics.beginPath();
    graphics.moveTo(60, 300);
    graphics.lineTo(120, 240);
    graphics.lineTo(320, 240);
    graphics.lineTo(380, 280);
    graphics.lineTo(380, 340);
    graphics.lineTo(320, 380);
    graphics.lineTo(120, 380);
    graphics.lineTo(60, 320);
    graphics.closePath();
    graphics.fillPath();

    // Rooms
    for (const room of playerShip.rooms) {
        graphics.fillStyle(COLORS.roomFloor);
        graphics.fillRect(room.x, room.y, room.w, room.h);
        graphics.lineStyle(2, COLORS.roomWall);
        graphics.strokeRect(room.x, room.y, room.w, room.h);
    }

    // Crew
    for (const crew of playerShip.crew) {
        graphics.fillStyle(crew.selected ? COLORS.textYellow : COLORS.human);
        graphics.fillCircle(crew.x, crew.y, 10);
        graphics.fillStyle(0x333333);
        graphics.fillRect(crew.x - 12, crew.y + 12, 24, 4);
        graphics.fillStyle(COLORS.textGreen);
        graphics.fillRect(crew.x - 12, crew.y + 12, 24 * (crew.health / crew.maxHealth), 4);
        if (crew.selected) {
            graphics.lineStyle(2, COLORS.textYellow);
            graphics.strokeCircle(crew.x, crew.y, 14);
        }
    }
}

function drawEnemyShip() {
    if (enemyShip.shields.layers > 0) {
        graphics.lineStyle(2, COLORS.shields, 0.5);
        graphics.strokeEllipse(930, 160, 200, 120);
    }

    graphics.fillStyle(0x556655);
    graphics.beginPath();
    graphics.moveTo(840, 160);
    graphics.lineTo(880, 100);
    graphics.lineTo(1000, 100);
    graphics.lineTo(1040, 140);
    graphics.lineTo(1040, 180);
    graphics.lineTo(1000, 220);
    graphics.lineTo(880, 220);
    graphics.closePath();
    graphics.fillPath();

    for (const room of enemyShip.rooms) {
        graphics.fillStyle(0x4a5a4a);
        graphics.fillRect(room.x, room.y, room.w, room.h);
        if (targetingMode) {
            graphics.lineStyle(2, COLORS.textRed);
            graphics.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);
        }
    }
}

function drawTopBar() {
    // Hull bar
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 10, 250, 25);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(10, 10, 250, 25);

    const hullText = scene.add.text(15, 17, 'HULL', { fontFamily: 'Courier New', fontSize: '14px', color: '#00ff00' });
    scene.time.delayedCall(16, () => hullText.destroy());

    for (let i = 0; i < 30; i++) {
        graphics.fillStyle(i < playerShip.hull ? COLORS.textGreen : 0x333333);
        graphics.fillRect(60 + i * 6, 14, 4, 17);
    }

    // Shields
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 40, 180, 20);
    const shieldText = scene.add.text(15, 44, 'SHIELDS', { fontFamily: 'Courier New', fontSize: '12px', color: '#00ccff' });
    scene.time.delayedCall(16, () => shieldText.destroy());

    for (let i = 0; i < playerShip.systems.shields.maxLayers; i++) {
        graphics.fillStyle(i < playerShip.systems.shields.layers ? COLORS.shields : 0x333333);
        graphics.fillCircle(100 + i * 25, 50, 8);
    }

    // Scrap
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(450, 10, 80, 25);
    const scrapText = scene.add.text(490, 17, `⚙ ${gameState.scrap}`, { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff' });
    scrapText.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => scrapText.destroy());

    // Jump button
    graphics.fillStyle(COLORS.textGreen);
    graphics.fillRect(560, 10, 80, 25);
    const jumpText = scene.add.text(600, 17, 'JUMP', { fontFamily: 'Courier New', fontSize: '12px', color: '#1a1a2e' });
    jumpText.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => jumpText.destroy());

    // Missiles
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(660, 10, 60, 25);
    const missileText = scene.add.text(690, 17, `🚀 ${gameState.missiles}`, { fontFamily: 'Courier New', fontSize: '14px', color: '#ffaa00' });
    missileText.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => missileText.destroy());
}

function drawCrewList() {
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 100, 90, 150);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(10, 100, 90, 150);

    for (let i = 0; i < playerShip.crew.length; i++) {
        const crew = playerShip.crew[i];
        const y = 120 + i * 45;
        graphics.fillStyle(crew.selected ? COLORS.textYellow : COLORS.human);
        graphics.fillCircle(25, y, 8);

        const nameText = scene.add.text(40, y - 4, crew.name, { fontFamily: 'Courier New', fontSize: '10px', color: '#ffffff' });
        scene.time.delayedCall(16, () => nameText.destroy());

        graphics.fillStyle(0x333333);
        graphics.fillRect(40, y + 8, 50, 6);
        graphics.fillStyle(COLORS.textGreen);
        graphics.fillRect(40, y + 8, 50 * (crew.health / crew.maxHealth), 6);
    }
}

function drawWeaponBar() {
    const y = 620;
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(350, y - 10, 350, 80);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(350, y - 10, 350, 80);

    const weaponsLabel = scene.add.text(525, y, 'WEAPONS', { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });
    weaponsLabel.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => weaponsLabel.destroy());

    for (let i = 0; i < playerShip.weapons.length; i++) {
        const weapon = playerShip.weapons[i];
        const x = 400 + i * 150;

        graphics.fillStyle(weapon.powered ? 0x2a3a2a : 0x2a2a2a);
        graphics.fillRect(x, y + 10, 140, 50);
        graphics.lineStyle(weapon.charge >= weapon.chargeTime ? 2 : 1, weapon.charge >= weapon.chargeTime ? COLORS.textGreen : COLORS.uiBorder);
        graphics.strokeRect(x, y + 10, 140, 50);

        const weaponName = scene.add.text(x + 5, y + 18, weapon.name, { fontFamily: 'Courier New', fontSize: '10px', color: weapon.powered ? '#ffffff' : '#666666' });
        scene.time.delayedCall(16, () => weaponName.destroy());

        graphics.fillStyle(0x333333);
        graphics.fillRect(x + 5, y + 35, 130, 10);
        graphics.fillStyle(weapon.charge >= weapon.chargeTime ? COLORS.textGreen : COLORS.textOrange);
        graphics.fillRect(x + 5, y + 35, 130 * Math.min(1, weapon.charge / weapon.chargeTime), 10);

        graphics.fillStyle(weapon.powered ? COLORS.textGreen : 0x666666);
        graphics.fillRect(x + 5, y + 50, 10, 5);
    }
}

function drawSystemPanel() {
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 55, 200, 200);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(10, 55, 200, 200);

    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const colors = [COLORS.shields, COLORS.weapons, COLORS.engines, COLORS.oxygen, COLORS.medbay];

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const y = 60 + i * 35;

        const sysLabel = scene.add.text(15, y + 5, systems[i].toUpperCase(), { fontFamily: 'Courier New', fontSize: '11px', color: '#' + colors[i].toString(16).padStart(6, '0') });
        scene.time.delayedCall(16, () => sysLabel.destroy());

        graphics.fillStyle(sys.power > 0 ? COLORS.textRed : 0x333333);
        graphics.fillRect(100, y, 15, 20);
        graphics.fillStyle(sys.power < sys.maxPower && playerShip.reactor.current > 0 ? COLORS.textGreen : 0x333333);
        graphics.fillRect(170, y, 15, 20);

        const minusText = scene.add.text(107, y + 5, '-', { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff' });
        minusText.setOrigin(0.5, 0);
        const plusText = scene.add.text(177, y + 5, '+', { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff' });
        plusText.setOrigin(0.5, 0);
        const powerText = scene.add.text(142, y + 5, `${sys.power}/${sys.maxPower}`, { fontFamily: 'Courier New', fontSize: '11px', color: '#ffffff' });
        powerText.setOrigin(0.5, 0);
        scene.time.delayedCall(16, () => { minusText.destroy(); plusText.destroy(); powerText.destroy(); });
    }

    const reactorText = scene.add.text(15, 240, `REACTOR: ${playerShip.reactor.current}/${playerShip.reactor.max}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffff00' });
    scene.time.delayedCall(16, () => reactorText.destroy());
}

function drawTargetPanel() {
    const x = 1050, y = 70;
    graphics.fillStyle(COLORS.uiPanel);
    graphics.fillRect(x, y, 220, 200);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(x, y, 220, 200);

    const targetLabel = scene.add.text(x + 110, y + 12, 'TARGET', { fontFamily: 'Courier New', fontSize: '14px', color: '#ff4444' });
    targetLabel.setOrigin(0.5, 0);
    const enemyName = scene.add.text(x + 110, y + 32, enemyShip.name, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });
    enemyName.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => { targetLabel.destroy(); enemyName.destroy(); });

    const hullLabel = scene.add.text(x + 10, y + 55, 'HULL', { fontFamily: 'Courier New', fontSize: '12px', color: '#00ff00' });
    scene.time.delayedCall(16, () => hullLabel.destroy());
    graphics.fillStyle(0x333333);
    graphics.fillRect(x + 60, y + 55, 150, 15);
    graphics.fillStyle(COLORS.textGreen);
    graphics.fillRect(x + 60, y + 55, 150 * (enemyShip.hull / enemyShip.maxHull), 15);

    const shieldsLabel = scene.add.text(x + 10, y + 80, 'SHIELDS', { fontFamily: 'Courier New', fontSize: '12px', color: '#00ccff' });
    scene.time.delayedCall(16, () => shieldsLabel.destroy());
    for (let i = 0; i < enemyShip.shields.maxLayers; i++) {
        graphics.fillStyle(i < enemyShip.shields.layers ? COLORS.shields : 0x333333);
        graphics.fillCircle(x + 100 + i * 25, y + 85, 8);
    }

    graphics.fillStyle(0x556655);
    graphics.fillRect(x + 50, y + 110, 120, 60);

    const relationText = scene.add.text(x + 110, y + 182, 'Relationship: Hostile', { fontFamily: 'Courier New', fontSize: '12px', color: '#ff4444' });
    relationText.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => relationText.destroy());
}

function drawCombatLog() {
    const x = 750, y = 620;
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(x, y - 10, 200, 80);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(x, y - 10, 200, 80);

    for (let i = 0; i < combatLog.length; i++) {
        const log = combatLog[i];
        const color = log.text.includes('MISS') ? '#4488ff' : log.text.includes('hit') || log.text.includes('Hull') ? '#ff4444' : '#ffffff';
        const logText = scene.add.text(x + 10, y + i * 14, log.text, { fontFamily: 'Courier New', fontSize: '11px', color: color });
        logText.setAlpha(log.time / 120);
        scene.time.delayedCall(16, () => logText.destroy());
    }
}

function drawPauseOverlay() {
    graphics.fillStyle(0x000000, 0.5);
    graphics.fillRect(0, 0, 1280, 720);
    const pauseText = scene.add.text(640, 360, 'PAUSED', { fontFamily: 'Courier New', fontSize: '48px', color: '#ffffff' });
    pauseText.setOrigin(0.5, 0.5);
    const resumeText = scene.add.text(640, 400, 'Press SPACE to resume', { fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff' });
    resumeText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => { pauseText.destroy(); resumeText.destroy(); });
}

function drawTargetingCursor() {
    graphics.lineStyle(2, COLORS.textRed);
    for (const room of enemyShip.rooms) {
        graphics.strokeRect(room.x - 3, room.y - 3, room.w + 6, room.h + 6);
    }
    const targetText = scene.add.text(930, 250, 'SELECT TARGET ROOM', { fontFamily: 'Courier New', fontSize: '14px', color: '#ff4444' });
    targetText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => targetText.destroy());
}

function drawTitleScreen() {
    drawStarfield();
    const title = scene.add.text(640, 280, 'FTL', { fontFamily: 'Courier New', fontSize: '64px', color: '#ffffff' });
    title.setOrigin(0.5, 0.5);
    const subtitle = scene.add.text(640, 330, 'FASTER THAN LIGHT', { fontFamily: 'Courier New', fontSize: '24px', color: '#ffffff' });
    subtitle.setOrigin(0.5, 0.5);
    const startText = scene.add.text(640, 450, 'Click to Start', { fontFamily: 'Courier New', fontSize: '18px', color: '#00ff00' });
    startText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => { title.destroy(); subtitle.destroy(); startText.destroy(); });
}

function drawGameOver() {
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, 1280, 720);
    const gameOverText = scene.add.text(640, 360, 'SHIP DESTROYED', { fontFamily: 'Courier New', fontSize: '48px', color: '#ff4444' });
    gameOverText.setOrigin(0.5, 0.5);
    const retryText = scene.add.text(640, 410, 'Click to try again', { fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff' });
    retryText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => { gameOverText.destroy(); retryText.destroy(); });
}

function drawVictory() {
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, 1280, 720);
    const victoryText = scene.add.text(640, 330, 'ENEMY DESTROYED', { fontFamily: 'Courier New', fontSize: '48px', color: '#00ff00' });
    victoryText.setOrigin(0.5, 0.5);
    const scrapText = scene.add.text(640, 380, '+25 Scrap', { fontFamily: 'Courier New', fontSize: '24px', color: '#ffff00' });
    scrapText.setOrigin(0.5, 0.5);
    const continueText = scene.add.text(640, 430, 'Click to continue', { fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff' });
    continueText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => { victoryText.destroy(); scrapText.destroy(); continueText.destroy(); });
}
