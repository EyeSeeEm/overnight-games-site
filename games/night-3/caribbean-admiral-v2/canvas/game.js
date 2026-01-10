// Caribbean Admiral v2 - Canvas Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 720;

// Game States
const STATE = {
    TITLE: 'title',
    MAP: 'map',
    PORT: 'port',
    COMBAT: 'combat',
    SHIP_YARD: 'shipyard',
    MARKET: 'market',
    FLEET: 'fleet'
};

let gameState = STATE.TITLE;
let lastTime = 0;

// Ship Types
const SHIP_TYPES = {
    sloop: { name: 'Sloop', hull: 100, sails: 40, crew: 10, cargo: 20, damage: 15, cost: 0 },
    schooner: { name: 'Schooner', hull: 150, sails: 50, crew: 15, cargo: 40, damage: 20, cost: 1000 },
    cutter: { name: 'Cutter', hull: 180, sails: 45, crew: 20, cargo: 25, damage: 30, cost: 800 },
    brigantine: { name: 'Brigantine', hull: 250, sails: 60, crew: 25, cargo: 80, damage: 35, cost: 2500 },
    brig: { name: 'Brig', hull: 280, sails: 55, crew: 30, cargo: 60, damage: 45, cost: 3000 },
    corvette: { name: 'Corvette', hull: 350, sails: 50, crew: 40, cargo: 35, damage: 60, cost: 4000 },
    frigate: { name: 'Frigate', hull: 400, sails: 55, crew: 50, cargo: 40, damage: 75, cost: 5000 },
    galleon: { name: 'Galleon', hull: 500, sails: 65, crew: 40, cargo: 150, damage: 55, cost: 8000 },
    manOWar: { name: "Man-o'-War", hull: 600, sails: 60, crew: 70, cargo: 50, damage: 100, cost: 12000 },
    shipOfLine: { name: 'Ship of the Line', hull: 800, sails: 65, crew: 100, cargo: 60, damage: 150, cost: 25000 },
    flagship: { name: 'Flagship', hull: 1000, sails: 80, crew: 150, cargo: 100, damage: 200, cost: 50000 }
};

// Trade Goods
const GOODS = {
    rice: { name: 'Rice', buyLow: 27, buyHigh: 45, sellLow: 45, sellHigh: 72 },
    corn: { name: 'Corn', buyLow: 66, buyHigh: 100, sellLow: 100, sellHigh: 144 },
    bananas: { name: 'Bananas', buyLow: 200, buyHigh: 250, sellLow: 250, sellHigh: 300 },
    ore: { name: 'Ore', buyLow: 304, buyHigh: 400, sellLow: 400, sellHigh: 480 },
    coffee: { name: 'Coffee', buyLow: 1280, buyHigh: 1600, sellLow: 1600, sellHigh: 1920 },
    rum: { name: 'Rum', buyLow: 3725, buyHigh: 4400, sellLow: 4400, sellHigh: 5016 },
    silver: { name: 'Silver', buyLow: 9600, buyHigh: 12000, sellLow: 12000, sellHigh: 14400 },
    gunpowder: { name: 'Gunpowder', buyLow: 14755, buyHigh: 19000, sellLow: 19000, sellHigh: 24000 }
};

// Ports
const PORTS = [
    { name: 'Trinidad', x: 950, y: 580, liberated: true, bossFleet: null },
    { name: 'Grenada', x: 1050, y: 520, liberated: false, bossFleet: ['sloop', 'sloop'] },
    { name: 'Caracas', x: 900, y: 480, liberated: false, bossFleet: ['sloop', 'sloop', 'sloop'] },
    { name: 'Bridgetown', x: 1100, y: 420, liberated: false, bossFleet: ['cutter', 'cutter'] },
    { name: 'Maracaibo', x: 700, y: 380, liberated: false, bossFleet: ['brig', 'brig'] },
    { name: 'Port Royal', x: 600, y: 320, liberated: false, bossFleet: ['frigate', 'frigate'] },
    { name: 'Cartagena', x: 450, y: 400, liberated: false, bossFleet: ['frigate', 'frigate', 'frigate'] },
    { name: 'Kingston', x: 580, y: 260, liberated: false, bossFleet: ['manOWar', 'manOWar'] },
    { name: 'Havana', x: 400, y: 200, liberated: false, bossFleet: ['manOWar', 'manOWar', 'manOWar'] },
    { name: 'Nassau', x: 650, y: 150, liberated: false, bossFleet: ['shipOfLine', 'shipOfLine', 'shipOfLine'] }
];

// Game Data
let game = {
    day: 1,
    gold: 1000,
    warPoints: 0,
    fleet: [],
    cargo: {},
    currentPort: 0,
    playerPos: { x: 950, y: 620 },
    targetPort: null,
    traveling: false,
    combatState: null,
    selectedShip: 0,
    selectedAttack: null,
    message: '',
    messageTimer: 0
};

// Initialize game
function initGame() {
    game = {
        day: 1,
        gold: 1000,
        warPoints: 0,
        fleet: [createShip('sloop')],
        cargo: { rice: 0, corn: 0, bananas: 0, ore: 0, coffee: 0, rum: 0, silver: 0, gunpowder: 0 },
        currentPort: 0,
        playerPos: { x: PORTS[0].x, y: PORTS[0].y + 40 },
        targetPort: null,
        traveling: false,
        combatState: null,
        selectedShip: 0,
        selectedAttack: null,
        message: '',
        messageTimer: 0
    };
}

function createShip(type) {
    const base = SHIP_TYPES[type];
    return {
        type: type,
        name: base.name,
        hull: base.hull,
        maxHull: base.hull,
        sails: base.sails,
        maxSails: base.sails,
        crew: base.crew,
        maxCrew: base.crew,
        cargo: base.cargo,
        damage: base.damage,
        ap: base.sails,
        maxAp: base.sails,
        upgrades: { hull: 0, sails: 0, crew: 0, cargo: 0, damage: 0 }
    };
}

// Attack Types
const ATTACKS = {
    hull: { name: 'Hull Shot', apCost: 25, hullMult: 1.0, sailMult: 0.1, crewMult: 0.1 },
    sail: { name: 'Sail Shot', apCost: 25, hullMult: 0.1, sailMult: 1.0, crewMult: 0.1 },
    crew: { name: 'Crew Shot', apCost: 25, hullMult: 0.5, sailMult: 0.25, crewMult: 1.0 },
    quick: { name: 'Quick Shot', apCost: 15, hullMult: 0.4, sailMult: 0.4, crewMult: 0.4 },
    board: { name: 'Board', apCost: 35, special: true }
};

// Drawing Functions
function drawGradientSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#b0e0e6');
    gradient.addColorStop(1, '#e0f7fa');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
}

function drawOcean(yStart) {
    const gradient = ctx.createLinearGradient(0, yStart, 0, canvas.height);
    gradient.addColorStop(0, '#2090b0');
    gradient.addColorStop(0.5, '#186080');
    gradient.addColorStop(1, '#104050');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, yStart, canvas.width, canvas.height - yStart);
}

function drawWoodenPanel(x, y, w, h, dark = false) {
    // Panel background
    ctx.fillStyle = dark ? '#5c4033' : '#8b6914';
    ctx.fillRect(x, y, w, h);

    // Wood grain lines
    ctx.strokeStyle = dark ? '#4a3020' : '#6b5010';
    ctx.lineWidth = 1;
    for (let i = 0; i < h; i += 8) {
        ctx.beginPath();
        ctx.moveTo(x, y + i);
        ctx.lineTo(x + w, y + i + Math.sin(i * 0.1) * 3);
        ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#3a2010';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
}

function drawRibbon(x, y, w, h, text) {
    // Ribbon shape
    ctx.fillStyle = '#c41e3a';
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x + w + 20, y);
    ctx.lineTo(x + w + 10, y + h/2);
    ctx.lineTo(x + w + 20, y + h);
    ctx.lineTo(x - 20, y + h);
    ctx.lineTo(x - 10, y + h/2);
    ctx.closePath();
    ctx.fill();

    // Darker edge
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(x, y + h - 5, w, 5);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w/2, y + h/2 + 8);
}

function drawButton(x, y, w, h, text, hover = false) {
    drawWoodenPanel(x, y, w, h, hover);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w/2, y + h/2 + 6);
}

function drawShip(x, y, scale = 1, flipped = false, shipType = 'sloop') {
    ctx.save();
    ctx.translate(x, y);
    if (flipped) ctx.scale(-1, 1);
    ctx.scale(scale, scale);

    // Determine ship size based on type
    const largeShips = ['galleon', 'manOWar', 'shipOfLine', 'flagship'];
    const medShips = ['brigantine', 'brig', 'corvette', 'frigate'];
    const isLarge = largeShips.includes(shipType);
    const isMed = medShips.includes(shipType);
    const hullWidth = isLarge ? 70 : (isMed ? 55 : 40);
    const numMasts = isLarge ? 3 : (isMed ? 2 : 1);

    // Hull - curved boat shape
    ctx.fillStyle = '#5d3a1a';
    ctx.beginPath();
    ctx.moveTo(-hullWidth, 5);
    ctx.quadraticCurveTo(-hullWidth - 10, 25, -hullWidth + 15, 35);
    ctx.lineTo(hullWidth - 15, 35);
    ctx.quadraticCurveTo(hullWidth + 10, 25, hullWidth, 5);
    ctx.lineTo(hullWidth + 15, -5);
    ctx.quadraticCurveTo(hullWidth + 20, -15, hullWidth + 10, -20);
    ctx.lineTo(-hullWidth - 5, -20);
    ctx.quadraticCurveTo(-hullWidth - 10, -10, -hullWidth, 5);
    ctx.closePath();
    ctx.fill();

    // Hull stripes
    ctx.strokeStyle = '#4a2c10';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#7d5030';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-hullWidth + 5, -10 + i * 12);
        ctx.lineTo(hullWidth, -10 + i * 12);
        ctx.stroke();
    }

    // Deck
    ctx.fillStyle = '#8b6340';
    ctx.fillRect(-hullWidth + 5, -20, hullWidth * 2 - 10, 8);

    // Railing
    ctx.strokeStyle = '#4a2c10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-hullWidth + 5, -20);
    ctx.lineTo(hullWidth - 5, -20);
    ctx.stroke();

    // Masts and sails
    const mastPositions = numMasts === 3 ? [-30, 5, 40] : (numMasts === 2 ? [-15, 25] : [5]);
    const sailHeights = numMasts === 3 ? [90, 100, 80] : (numMasts === 2 ? [85, 75] : [70]);

    mastPositions.forEach((mx, i) => {
        const sh = sailHeights[i];

        // Mast
        ctx.fillStyle = '#4a2c10';
        ctx.fillRect(mx - 3, -20 - sh, 6, sh + 5);

        // Cross beam
        ctx.fillRect(mx - 25, -15 - sh * 0.8, 50, 4);
        if (numMasts > 1) {
            ctx.fillRect(mx - 20, -15 - sh * 0.5, 40, 3);
        }

        // Main sail
        ctx.fillStyle = '#f5f5dc';
        ctx.beginPath();
        ctx.moveTo(mx - 22, -12 - sh * 0.8);
        ctx.quadraticCurveTo(mx + 25, -sh * 0.6, mx + 22, -12 - sh * 0.8);
        ctx.lineTo(mx + 18, -20 - sh * 0.5);
        ctx.quadraticCurveTo(mx + 18, -sh * 0.55, mx - 18, -20 - sh * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sail stripes (red/white)
        ctx.fillStyle = '#c41e3a';
        const stripeY = -sh * 0.65;
        ctx.beginPath();
        ctx.moveTo(mx - 18, stripeY);
        ctx.quadraticCurveTo(mx + 15, stripeY + 8, mx + 18, stripeY);
        ctx.lineTo(mx + 16, stripeY + 10);
        ctx.quadraticCurveTo(mx + 12, stripeY + 18, mx - 16, stripeY + 10);
        ctx.closePath();
        ctx.fill();

        // Rigging lines
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(mx, -20 - sh);
        ctx.lineTo(-hullWidth, 0);
        ctx.moveTo(mx, -20 - sh);
        ctx.lineTo(hullWidth, 0);
        ctx.stroke();
    });

    // Flag on main mast
    const mainMast = mastPositions[Math.floor(mastPositions.length / 2)];
    const mainHeight = sailHeights[Math.floor(sailHeights.length / 2)];
    ctx.fillStyle = '#c41e3a';
    ctx.beginPath();
    ctx.moveTo(mainMast, -25 - mainHeight);
    ctx.lineTo(mainMast + 25, -20 - mainHeight);
    ctx.lineTo(mainMast, -15 - mainHeight);
    ctx.closePath();
    ctx.fill();

    // Crew figures on deck (small circles)
    ctx.fillStyle = '#d4a574';
    const crewCount = isLarge ? 5 : (isMed ? 3 : 2);
    for (let i = 0; i < crewCount; i++) {
        const cx = -hullWidth + 20 + i * (hullWidth * 2 - 40) / (crewCount);
        ctx.beginPath();
        ctx.arc(cx, -24, 4, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(cx - 2, -20, 4, 6);
        ctx.fillStyle = '#d4a574';
    }

    // Bowsprit (front pointing pole)
    ctx.fillStyle = '#4a2c10';
    ctx.save();
    ctx.translate(hullWidth + 5, -15);
    ctx.rotate(-0.3);
    ctx.fillRect(0, -2, 30, 4);
    ctx.restore();

    ctx.restore();
}

function drawPirateFlag(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Pole
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(-2, -40, 4, 50);

    // Flag
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(2, -38, 30, 20);

    // Skull
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(17, -28, 6, 0, Math.PI * 2);
    ctx.fill();

    // Crossbones
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -20);
    ctx.lineTo(26, -36);
    ctx.moveTo(26, -20);
    ctx.lineTo(8, -36);
    ctx.stroke();

    ctx.restore();
}

function drawHeartBar(x, y, current, max, width = 100) {
    const hearts = 5;
    const heartSize = width / hearts;
    const ratio = current / max;
    const fullHearts = Math.floor(ratio * hearts);
    const partialHeart = (ratio * hearts) - fullHearts;

    for (let i = 0; i < hearts; i++) {
        const hx = x + i * heartSize;

        // Empty heart
        ctx.fillStyle = '#555';
        drawHeart(hx, y, heartSize * 0.8);

        // Filled heart
        if (i < fullHearts) {
            ctx.fillStyle = '#ff4444';
            drawHeart(hx, y, heartSize * 0.8);
        } else if (i === fullHearts && partialHeart > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(hx, y - heartSize, heartSize * partialHeart, heartSize * 2);
            ctx.clip();
            ctx.fillStyle = '#ff4444';
            drawHeart(hx, y, heartSize * 0.8);
            ctx.restore();
        }
    }
}

function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x + size/2, y + size/4);
    ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
    ctx.bezierCurveTo(x, y + size/2, x + size/2, y + size * 0.8, x + size/2, y + size * 0.8);
    ctx.bezierCurveTo(x + size/2, y + size * 0.8, x + size, y + size/2, x + size, y + size/4);
    ctx.bezierCurveTo(x + size, y, x + size/2, y, x + size/2, y + size/4);
    ctx.fill();
}

// Title Screen
function drawTitleScreen() {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
    skyGrad.addColorStop(0, '#ffd89b');
    skyGrad.addColorStop(0.5, '#87ceeb');
    skyGrad.addColorStop(1, '#b0e0e6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ocean
    drawOcean(canvas.height * 0.5);

    // Lighthouse
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(100, 400);
    ctx.lineTo(130, 200);
    ctx.lineTo(170, 200);
    ctx.lineTo(200, 400);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c41e3a';
    ctx.beginPath();
    ctx.moveTo(120, 200);
    ctx.lineTo(140, 150);
    ctx.lineTo(160, 150);
    ctx.lineTo(180, 200);
    ctx.closePath();
    ctx.fill();

    // Cliffs
    ctx.fillStyle = '#c2a060';
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(50, 350);
    ctx.lineTo(150, 380);
    ctx.lineTo(250, 340);
    ctx.lineTo(350, 400);
    ctx.lineTo(350, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Ships in harbor
    drawShip(300, 480, 0.8);
    drawShip(1100, 500, 0.6, true);

    // Title ribbon
    drawRibbon(canvas.width/2 - 200, 50, 400, 60, 'Caribbean Admiral');

    // Menu panel
    const menuX = canvas.width - 350;
    const menuY = 150;

    // Wooden sign with rope
    drawWoodenPanel(menuX, menuY, 280, 350);

    // Rope decoration
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(menuX + 50, menuY - 30);
    ctx.quadraticCurveTo(menuX + 140, menuY - 50, menuX + 230, menuY - 30);
    ctx.stroke();

    // Menu buttons
    const buttons = [
        { text: 'PLAY', y: menuY + 50 },
        { text: 'Continue', y: menuY + 120 },
        { text: 'Credits', y: menuY + 190 }
    ];

    buttons.forEach((btn, i) => {
        const hover = isMouseOver(menuX + 40, btn.y, 200, 50);
        drawButton(menuX + 40, btn.y, 200, 50, btn.text, hover);
    });
}

// Map Screen
function drawMapScreen() {
    // Parchment background
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ocean areas
    ctx.fillStyle = '#5090b0';
    ctx.fillRect(200, 100, canvas.width - 250, canvas.height - 150);

    // Land masses (simplified Caribbean)
    ctx.fillStyle = '#c2a060';

    // Central America
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(350, 150);
    ctx.lineTo(400, 280);
    ctx.lineTo(350, 450);
    ctx.lineTo(200, 500);
    ctx.closePath();
    ctx.fill();

    // South America coast
    ctx.beginPath();
    ctx.moveTo(600, 550);
    ctx.lineTo(800, 500);
    ctx.lineTo(1000, 550);
    ctx.lineTo(1150, 480);
    ctx.lineTo(1200, 550);
    ctx.lineTo(1200, 720);
    ctx.lineTo(600, 720);
    ctx.closePath();
    ctx.fill();

    // Cuba
    ctx.beginPath();
    ctx.ellipse(500, 180, 120, 30, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Hispaniola
    ctx.beginPath();
    ctx.ellipse(680, 220, 60, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw ports
    PORTS.forEach((port, i) => {
        // Port marker
        ctx.fillStyle = port.liberated ? '#228b22' : '#c41e3a';
        ctx.beginPath();
        ctx.arc(port.x, port.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Port name
        ctx.fillStyle = '#000';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y - 20);

        // Pirate flag if not liberated
        if (!port.liberated) {
            drawPirateFlag(port.x + 15, port.y - 5, 0.6);
        }
    });

    // Player ship on map
    ctx.save();
    ctx.translate(game.playerPos.x, game.playerPos.y);
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(0, -20);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(10, -8);
    ctx.lineTo(0, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // UI Header
    drawWoodenPanel(0, 0, canvas.width, 60);
    drawRibbon(canvas.width/2 - 100, 10, 200, 40, 'Global Map');

    // Stats
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Cargo: ${getTotalCargo()}/${getFleetCargo()}`, 20, 38);

    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width - 150, 38);
    ctx.fillText(`WP: ${game.warPoints}`, canvas.width - 20, 38);

    // Day counter
    ctx.textAlign = 'left';
    ctx.fillText(`Day: ${game.day}`, 20, canvas.height - 20);

    // Compass rose
    drawCompass(canvas.width - 80, 150, 50);

    // Instructions
    ctx.fillStyle = '#000';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click a port to travel', canvas.width/2, canvas.height - 20);

    // Return to port button
    if (game.currentPort !== null) {
        const btnX = canvas.width - 180;
        const btnY = canvas.height - 80;
        drawButton(btnX, btnY, 160, 40, 'Enter Port');
    }
}

function drawCompass(x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Background
    ctx.fillStyle = '#d4c4a8';
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Points
    const points = ['N', 'E', 'S', 'W'];
    ctx.fillStyle = '#4a2c10';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';

    points.forEach((p, i) => {
        const angle = i * Math.PI / 2 - Math.PI / 2;
        const px = Math.cos(angle) * (size - 15);
        const py = Math.sin(angle) * (size - 15);
        ctx.fillText(p, px, py + 5);
    });

    // Star
    ctx.fillStyle = '#c41e3a';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4 - Math.PI / 2;
        const r = i % 2 === 0 ? size * 0.6 : size * 0.25;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Port Screen
function drawPortScreen() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#e0f7fa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 300);

    // Town background
    ctx.fillStyle = '#c2a060';
    ctx.fillRect(0, 200, canvas.width, 150);

    // Buildings
    const buildings = [
        { x: 100, w: 80, h: 100, color: '#deb887' },
        { x: 200, w: 100, h: 130, color: '#f5f5dc' },
        { x: 320, w: 70, h: 90, color: '#d2b48c' },
        { x: 450, w: 120, h: 140, color: '#f5deb3' },
        { x: 600, w: 90, h: 110, color: '#deb887' },
        { x: 750, w: 110, h: 120, color: '#f5f5dc' },
        { x: 900, w: 80, h: 95, color: '#d2b48c' },
        { x: 1000, w: 100, h: 115, color: '#f5deb3' },
        { x: 1120, w: 90, h: 100, color: '#deb887' }
    ];

    buildings.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, 280 - b.h, b.w, b.h);

        // Roof
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(b.x - 5, 280 - b.h);
        ctx.lineTo(b.x + b.w/2, 280 - b.h - 30);
        ctx.lineTo(b.x + b.w + 5, 280 - b.h);
        ctx.closePath();
        ctx.fill();

        // Windows
        ctx.fillStyle = '#4682b4';
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.fillRect(b.x + 15 + i * 35, 280 - b.h + 20 + j * 30, 15, 20);
            }
        }
    });

    // Dock
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, 280, canvas.width, 40);

    // Dock posts
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(i * 140 + 50, 280, 20, 60);
    }

    // Water
    drawOcean(320);

    // Ships in harbor
    game.fleet.forEach((ship, i) => {
        drawShip(200 + i * 200, 450, 0.7, false, ship.type);
    });

    // Palm trees
    drawPalmTree(50, 270, 0.8);
    drawPalmTree(1200, 270, 0.8);

    // UI Header
    drawWoodenPanel(0, 0, canvas.width, 60);
    const port = PORTS[game.currentPort];
    drawRibbon(canvas.width/2 - 100, 10, 200, 40, port.name);

    // Stats
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Cargo: ${getTotalCargo()}/${getFleetCargo()}`, 20, 38);
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width - 150, 38);
    ctx.fillText(`WP: ${game.warPoints}`, canvas.width - 20, 38);

    // Port menu buttons
    const menuButtons = [
        { text: 'Ship Yard', state: STATE.SHIP_YARD, x: 50 },
        { text: 'Market', state: STATE.MARKET, x: 200 },
        { text: 'Fleet', state: STATE.FLEET, x: 350 },
        { text: 'Repair', action: 'repair', x: 500 },
        { text: 'Map', state: STATE.MAP, x: 1130 }
    ];

    menuButtons.forEach(btn => {
        const hover = isMouseOver(btn.x, canvas.height - 70, 120, 50);
        drawButton(btn.x, canvas.height - 70, 120, 50, btn.text, hover);
    });

    // Liberation button if port not liberated
    if (!port.liberated) {
        const hover = isMouseOver(650, canvas.height - 70, 150, 50);
        drawButton(650, canvas.height - 70, 150, 50, 'Liberate Port!', hover);
    }
}

function drawPalmTree(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Trunk
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-10, -50, -5, -100);
    ctx.lineTo(5, -100);
    ctx.quadraticCurveTo(10, -50, 8, 0);
    ctx.closePath();
    ctx.fill();

    // Fronds
    ctx.fillStyle = '#228b22';
    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.translate(0, -100);
        ctx.rotate((i - 2.5) * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(30, -20, 60, 10);
        ctx.quadraticCurveTo(30, 0, 0, 0);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

// Combat Screen
function drawCombatScreen() {
    // Sky gradient (sunset feel)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
    skyGrad.addColorStop(0, '#ffd89b');
    skyGrad.addColorStop(0.5, '#87ceeb');
    skyGrad.addColorStop(1, '#b0e0e6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ocean
    drawOcean(canvas.height * 0.35);

    const combat = game.combatState;
    if (!combat) return;

    // Draw player ships (left side)
    game.fleet.forEach((ship, i) => {
        const x = 150;
        const y = 200 + i * 150;

        // Selection highlight
        if (game.selectedShip === i && combat.turn === 'player') {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(x, y, 80, 0, Math.PI * 2);
            ctx.fill();
        }

        drawShip(x, y, 0.9, false, ship.type);

        // Ship stats
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'left';
        ctx.fillText(`AP: ${ship.ap}`, x - 60, y - 70);

        // Health bar
        drawHeartBar(x - 60, y + 50, ship.hull, ship.maxHull, 100);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${ship.hull}`, x + 50, y + 70);
    });

    // Draw enemy ships (right side)
    combat.enemies.forEach((enemy, i) => {
        const x = canvas.width - 200;
        const y = 200 + i * 150;

        // Target reticle if selected
        if (game.selectedAttack && combat.targetEnemy === i) {
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 70, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshairs
            ctx.beginPath();
            ctx.moveTo(x - 80, y);
            ctx.lineTo(x - 50, y);
            ctx.moveTo(x + 50, y);
            ctx.lineTo(x + 80, y);
            ctx.moveTo(x, y - 80);
            ctx.lineTo(x, y - 50);
            ctx.moveTo(x, y + 50);
            ctx.lineTo(x, y + 80);
            ctx.stroke();
        }

        drawShip(x, y, 0.9, true, enemy.type);

        // Enemy stats
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'right';
        ctx.fillText(`AP: ${enemy.ap}`, x + 60, y - 70);

        // Health bar
        drawHeartBar(x - 40, y + 50, enemy.hull, enemy.maxHull, 100);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(`${enemy.hull}`, x + 70, y + 70);
    });

    // Cannonballs animation
    combat.projectiles.forEach(proj => {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    // Combat UI panel
    drawWoodenPanel(0, canvas.height - 120, canvas.width, 120);

    // Attack buttons
    const attacks = ['hull', 'sail', 'crew', 'quick', 'board'];
    const attackLabels = ['Hull Shot', 'Sail Shot', 'Crew Shot', 'Quick Shot', 'Board'];
    const attackCosts = [25, 25, 25, 15, 35];

    attacks.forEach((atk, i) => {
        const btnX = 50 + i * 150;
        const btnY = canvas.height - 100;
        const selected = game.selectedAttack === atk;
        const canAfford = game.fleet[game.selectedShip]?.ap >= attackCosts[i];

        ctx.fillStyle = selected ? '#4a7c4a' : (canAfford ? '#5c4033' : '#3a3a3a');
        ctx.fillRect(btnX, btnY, 130, 40);
        ctx.strokeStyle = selected ? '#8f8' : '#3a2010';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, 130, 40);

        ctx.fillStyle = canAfford ? '#fff' : '#888';
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.fillText(attackLabels[i], btnX + 65, btnY + 18);
        ctx.font = '12px serif';
        ctx.fillText(`${attackCosts[i]} AP`, btnX + 65, btnY + 34);
    });

    // Selected ship info
    const selectedShip = game.fleet[game.selectedShip];
    if (selectedShip) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${selectedShip.name} | AP: ${selectedShip.ap}/${selectedShip.maxAp}`, 50, canvas.height - 40);
    }

    // Turn indicator
    ctx.fillStyle = combat.turn === 'player' ? '#4a7c4a' : '#c41e3a';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'right';
    ctx.fillText(combat.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN', canvas.width - 50, canvas.height - 40);

    // End turn button
    if (combat.turn === 'player') {
        const hover = isMouseOver(canvas.width - 200, canvas.height - 100, 150, 40);
        drawButton(canvas.width - 200, canvas.height - 100, 150, 40, 'End Turn', hover);
    }

    // Combat message
    if (combat.message) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width/2 - 200, 20, 400, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.fillText(combat.message, canvas.width/2, 48);
    }
}

// Ship Yard Screen
function drawShipYardScreen() {
    drawPortBackground();

    drawWoodenPanel(0, 0, canvas.width, 60);
    drawRibbon(canvas.width/2 - 80, 10, 160, 40, 'Ship Yard');

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width - 20, 38);
    ctx.fillText(`WP: ${game.warPoints}`, canvas.width - 150, 38);

    // Available ships to buy
    const availableShips = ['sloop', 'schooner', 'cutter', 'brigantine', 'brig', 'corvette', 'frigate'];

    let yOffset = 80;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'left';
    ctx.fillText('Buy Ships:', 50, yOffset);

    yOffset += 30;
    availableShips.forEach((type, i) => {
        const ship = SHIP_TYPES[type];
        const y = yOffset + i * 45;
        const canAfford = game.gold >= ship.cost && game.fleet.length < 5;

        const hover = isMouseOver(50, y, 400, 40);
        ctx.fillStyle = hover && canAfford ? '#5c4033' : '#3a3020';
        ctx.fillRect(50, y, 400, 40);
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y, 400, 40);

        ctx.fillStyle = canAfford ? '#fff' : '#888';
        ctx.font = '16px serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${ship.name} - ${ship.cost} gold`, 60, y + 26);
        ctx.textAlign = 'right';
        ctx.fillText(`HP:${ship.hull} Sails:${ship.sails} Dmg:${ship.damage}`, 440, y + 26);
    });

    // Current fleet for upgrades
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'left';
    ctx.fillText('Upgrade Fleet:', 500, 80);

    game.fleet.forEach((ship, i) => {
        const y = 110 + i * 100;
        drawWoodenPanel(500, y, 730, 90);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'left';
        ctx.fillText(ship.name, 520, y + 25);

        // Stats
        const stats = ['hull', 'sails', 'crew', 'cargo', 'damage'];
        const statLabels = ['Hull', 'Sails', 'Crew', 'Cargo', 'Damage'];
        const wpCosts = [10, 15, 8, 5, 20];

        stats.forEach((stat, j) => {
            const sx = 520 + j * 140;
            const level = ship.upgrades[stat];
            const canUpgrade = level < 5 && game.warPoints >= wpCosts[j];

            ctx.fillStyle = '#ddd';
            ctx.font = '12px serif';
            ctx.fillText(`${statLabels[j]}: Lv${level}`, sx, y + 50);

            if (level < 5) {
                const hover = isMouseOver(sx, y + 55, 60, 25);
                ctx.fillStyle = hover && canUpgrade ? '#4a7c4a' : (canUpgrade ? '#5c4033' : '#333');
                ctx.fillRect(sx, y + 55, 60, 25);
                ctx.fillStyle = canUpgrade ? '#fff' : '#666';
                ctx.font = '11px serif';
                ctx.fillText(`+${wpCosts[j]}WP`, sx + 5, y + 72);
            }
        });
    });

    // Back button
    const hover = isMouseOver(50, canvas.height - 70, 120, 50);
    drawButton(50, canvas.height - 70, 120, 50, 'Back', hover);
}

// Market Screen
function drawMarketScreen() {
    drawPortBackground();

    drawWoodenPanel(0, 0, canvas.width, 60);
    drawRibbon(canvas.width/2 - 60, 10, 120, 40, 'Market');

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Cargo: ${getTotalCargo()}/${getFleetCargo()}`, 20, 38);
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width - 20, 38);

    // Trade goods
    const goods = Object.keys(GOODS);
    const port = PORTS[game.currentPort];

    goods.forEach((good, i) => {
        const goodData = GOODS[good];
        const y = 80 + i * 75;

        // Price variation per port
        const priceVariation = ((port.name.charCodeAt(0) + i) % 3) - 1; // -1, 0, or 1
        const buyPrice = priceVariation < 0 ? goodData.buyLow : goodData.buyHigh;
        const sellPrice = priceVariation > 0 ? goodData.sellHigh : goodData.sellLow;

        drawWoodenPanel(50, y, canvas.width - 100, 65);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'left';
        ctx.fillText(goodData.name, 70, y + 25);
        ctx.font = '14px serif';
        ctx.fillText(`Owned: ${game.cargo[good]}`, 70, y + 50);

        // Price indicators
        ctx.fillStyle = priceVariation < 0 ? '#4a7c4a' : '#c41e3a';
        ctx.fillText(`Buy: ${buyPrice}`, 250, y + 38);

        ctx.fillStyle = priceVariation > 0 ? '#4a7c4a' : '#c41e3a';
        ctx.fillText(`Sell: ${sellPrice}`, 400, y + 38);

        // Buy/Sell buttons
        const canBuy = game.gold >= buyPrice && getTotalCargo() < getFleetCargo();
        const canSell = game.cargo[good] > 0;

        // Buy buttons
        [1, 10].forEach((amt, j) => {
            const bx = 550 + j * 80;
            const hover = isMouseOver(bx, y + 15, 70, 35);
            ctx.fillStyle = hover && canBuy ? '#4a7c4a' : (canBuy ? '#5c4033' : '#333');
            ctx.fillRect(bx, y + 15, 70, 35);
            ctx.fillStyle = canBuy ? '#fff' : '#666';
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Buy ${amt}`, bx + 35, y + 38);
        });

        // Sell buttons
        [1, 10].forEach((amt, j) => {
            const sx = 720 + j * 80;
            const hover = isMouseOver(sx, y + 15, 70, 35);
            ctx.fillStyle = hover && canSell ? '#4a7c4a' : (canSell ? '#5c4033' : '#333');
            ctx.fillRect(sx, y + 15, 70, 35);
            ctx.fillStyle = canSell ? '#fff' : '#666';
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Sell ${amt}`, sx + 35, y + 38);
        });
    });

    // Back button
    const hover = isMouseOver(50, canvas.height - 70, 120, 50);
    drawButton(50, canvas.height - 70, 120, 50, 'Back', hover);
}

// Fleet Screen
function drawFleetScreen() {
    drawPortBackground();

    drawWoodenPanel(0, 0, canvas.width, 60);
    drawRibbon(canvas.width/2 - 50, 10, 100, 40, 'Fleet');

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width - 150, 38);
    ctx.fillText(`WP: ${game.warPoints}`, canvas.width - 20, 38);

    // Fleet ships
    game.fleet.forEach((ship, i) => {
        const y = 80 + i * 120;
        drawWoodenPanel(50, y, canvas.width - 100, 110);

        // Ship visual
        drawShip(150, y + 55, 0.6, false, ship.type);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'left';
        ctx.fillText(ship.name, 250, y + 30);

        // Stats
        ctx.font = '14px serif';
        ctx.fillText(`Hull: ${ship.hull}/${ship.maxHull}`, 250, y + 55);
        ctx.fillText(`Sails/AP: ${ship.sails}/${ship.maxSails}`, 400, y + 55);
        ctx.fillText(`Crew: ${ship.crew}/${ship.maxCrew}`, 550, y + 55);
        ctx.fillText(`Cargo: ${ship.cargo}`, 700, y + 55);
        ctx.fillText(`Damage: ${ship.damage}`, 850, y + 55);

        // Health bar
        drawHeartBar(250, y + 70, ship.hull, ship.maxHull, 150);

        // Repair button
        const repairCost = Math.floor((ship.maxHull - ship.hull) / 2);
        if (ship.hull < ship.maxHull) {
            const hover = isMouseOver(1000, y + 30, 120, 40);
            ctx.fillStyle = hover ? '#4a7c4a' : '#5c4033';
            ctx.fillRect(1000, y + 30, 120, 40);
            ctx.fillStyle = game.gold >= repairCost ? '#fff' : '#888';
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Repair`, 1060, y + 48);
            ctx.fillText(`${repairCost}g`, 1060, y + 64);
        }
    });

    // Back button
    const hover = isMouseOver(50, canvas.height - 70, 120, 50);
    drawButton(50, canvas.height - 70, 120, 50, 'Back', hover);
}

function drawPortBackground() {
    ctx.fillStyle = '#5090b0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative frame
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
}

// Utility functions
function getTotalCargo() {
    return Object.values(game.cargo).reduce((a, b) => a + b, 0);
}

function getFleetCargo() {
    return game.fleet.reduce((a, s) => a + s.cargo, 0);
}

function isMouseOver(x, y, w, h) {
    return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

// Combat functions
function startCombat(enemies, isLiberation = false) {
    game.combatState = {
        enemies: enemies.map(type => createShip(type)),
        turn: 'player',
        targetEnemy: 0,
        projectiles: [],
        message: 'Select a ship and attack!',
        isLiberation: isLiberation,
        liberationPort: isLiberation ? game.currentPort : null
    };

    // Reset AP for player ships
    game.fleet.forEach(ship => {
        ship.ap = ship.maxAp;
    });

    game.selectedShip = 0;
    game.selectedAttack = null;
    gameState = STATE.COMBAT;
}

function performAttack(attackType) {
    const combat = game.combatState;
    const attacker = game.fleet[game.selectedShip];
    const target = combat.enemies[combat.targetEnemy];
    const attack = ATTACKS[attackType];

    if (attacker.ap < attack.apCost) {
        combat.message = 'Not enough AP!';
        return;
    }

    attacker.ap -= attack.apCost;

    if (attackType === 'board') {
        // Boarding attempt
        const ratio = attacker.crew / target.crew;
        let successChance = 0.1;
        if (ratio >= 2) successChance = 0.95;
        else if (ratio >= 1.5) successChance = 0.75;
        else if (ratio >= 1) successChance = 0.5;
        else if (ratio >= 0.5) successChance = 0.3;

        if (Math.random() < successChance) {
            combat.message = `Boarding successful! ${target.name} captured!`;
            target.hull = 0;
            // Could add ship to fleet here
        } else {
            combat.message = 'Boarding failed!';
            attacker.crew = Math.floor(attacker.crew * 0.8);
        }
    } else {
        // Ranged attack
        const baseDamage = attacker.damage;
        const randomMult = 0.9 + Math.random() * 0.2;

        const hullDamage = Math.floor(baseDamage * attack.hullMult * randomMult);
        const sailDamage = Math.floor(baseDamage * attack.sailMult * randomMult);
        const crewDamage = Math.floor(baseDamage * attack.crewMult * randomMult);

        target.hull = Math.max(0, target.hull - hullDamage);
        target.sails = Math.max(0, target.sails - sailDamage);
        target.ap = Math.max(0, target.ap - sailDamage);
        target.crew = Math.max(0, target.crew - crewDamage);

        combat.message = `${attack.name}! ${hullDamage} hull damage!`;

        // Add projectile animation
        const startX = 200;
        const startY = 200 + game.selectedShip * 150;
        const endX = canvas.width - 200;
        const endY = 200 + combat.targetEnemy * 150;

        combat.projectiles.push({
            x: startX, y: startY,
            targetX: endX, targetY: endY,
            speed: 15
        });
    }

    // Check if target destroyed
    if (target.hull <= 0) {
        combat.message = `${target.name} destroyed!`;
        game.gold += Math.floor(100 + Math.random() * 200);
        game.warPoints += Math.floor(5 + Math.random() * 10);
    }

    game.selectedAttack = null;

    // Check combat end
    checkCombatEnd();
}

function enemyTurn() {
    const combat = game.combatState;
    combat.turn = 'enemy';
    combat.message = 'Enemy is attacking...';

    setTimeout(() => {
        combat.enemies.forEach(enemy => {
            if (enemy.hull <= 0 || enemy.ap < 15) return;

            // Find target (lowest HP player ship)
            let targetIdx = 0;
            let lowestHP = Infinity;
            game.fleet.forEach((ship, i) => {
                if (ship.hull > 0 && ship.hull < lowestHP) {
                    lowestHP = ship.hull;
                    targetIdx = i;
                }
            });

            const target = game.fleet[targetIdx];
            if (!target || target.hull <= 0) return;

            // Use quick shot for efficiency
            const damage = Math.floor(enemy.damage * 0.4 * (0.9 + Math.random() * 0.2));
            target.hull = Math.max(0, target.hull - damage);
            enemy.ap -= 15;

            combat.message = `Enemy deals ${damage} damage!`;

            // Add projectile
            const startX = canvas.width - 200;
            const startY = 200 + combat.enemies.indexOf(enemy) * 150;
            const endX = 200;
            const endY = 200 + targetIdx * 150;

            combat.projectiles.push({
                x: startX, y: startY,
                targetX: endX, targetY: endY,
                speed: 15
            });
        });

        // Check combat end
        if (!checkCombatEnd()) {
            // Reset player AP for next turn
            game.fleet.forEach(ship => {
                if (ship.hull > 0) ship.ap = ship.maxAp;
            });
            combat.turn = 'player';
            combat.message = 'Your turn!';
        }
    }, 1000);
}

function checkCombatEnd() {
    const combat = game.combatState;

    // Check if all enemies defeated
    const enemiesAlive = combat.enemies.filter(e => e.hull > 0).length;
    if (enemiesAlive === 0) {
        setTimeout(() => {
            // Handle port liberation
            if (combat.isLiberation && combat.liberationPort !== null) {
                PORTS[combat.liberationPort].liberated = true;
                game.gold += 2000 + combat.liberationPort * 500;
                game.warPoints += 50 + combat.liberationPort * 20;
                showMessage(`${PORTS[combat.liberationPort].name} liberated!`);
            } else {
                showMessage('Victory! Enemies defeated!');
            }
            game.combatState = null;
            gameState = STATE.PORT;
        }, 1500);
        return true;
    }

    // Check if all player ships defeated
    const playerAlive = game.fleet.filter(s => s.hull > 0).length;
    if (playerAlive === 0) {
        setTimeout(() => {
            game.combatState = null;
            gameState = STATE.PORT;
            showMessage('Defeat! Fleet destroyed!');
            // Respawn with starter ship
            game.fleet = [createShip('sloop')];
            game.gold = Math.floor(game.gold * 0.5);
        }, 1500);
        return true;
    }

    return false;
}

function showMessage(msg) {
    game.message = msg;
    game.messageTimer = 180;
}

// Input handling
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    handleClick(x, y);
});

function handleClick(x, y) {
    switch (gameState) {
        case STATE.TITLE:
            handleTitleClick(x, y);
            break;
        case STATE.MAP:
            handleMapClick(x, y);
            break;
        case STATE.PORT:
            handlePortClick(x, y);
            break;
        case STATE.COMBAT:
            handleCombatClick(x, y);
            break;
        case STATE.SHIP_YARD:
            handleShipYardClick(x, y);
            break;
        case STATE.MARKET:
            handleMarketClick(x, y);
            break;
        case STATE.FLEET:
            handleFleetClick(x, y);
            break;
    }
}

function handleTitleClick(x, y) {
    const menuX = canvas.width - 350;

    // Play button
    if (x >= menuX + 40 && x <= menuX + 240 && y >= 200 && y <= 250) {
        initGame();
        gameState = STATE.PORT;
    }
}

function handleMapClick(x, y) {
    // Check port clicks
    PORTS.forEach((port, i) => {
        const dist = Math.hypot(x - port.x, y - port.y);
        if (dist < 20) {
            game.targetPort = i;
            game.traveling = true;
        }
    });

    // Enter port button
    if (x >= canvas.width - 180 && x <= canvas.width - 20 && y >= canvas.height - 80 && y <= canvas.height - 40) {
        if (game.currentPort !== null) {
            gameState = STATE.PORT;
        }
    }
}

function handlePortClick(x, y) {
    const port = PORTS[game.currentPort];

    // Ship Yard
    if (x >= 50 && x <= 170 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.SHIP_YARD;
    }
    // Market
    if (x >= 200 && x <= 320 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.MARKET;
    }
    // Fleet
    if (x >= 350 && x <= 470 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.FLEET;
    }
    // Repair
    if (x >= 500 && x <= 620 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        game.fleet.forEach(ship => {
            const cost = Math.floor((ship.maxHull - ship.hull) / 2);
            if (game.gold >= cost) {
                game.gold -= cost;
                ship.hull = ship.maxHull;
            }
        });
    }
    // Liberate
    if (x >= 650 && x <= 800 && y >= canvas.height - 70 && y <= canvas.height - 20 && !port.liberated) {
        startCombat(port.bossFleet, true);
    }
    // Map
    if (x >= 1130 && x <= 1250 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.MAP;
    }
}

function handleCombatClick(x, y) {
    const combat = game.combatState;
    if (!combat || combat.turn !== 'player') return;

    // Ship selection (left side)
    game.fleet.forEach((ship, i) => {
        if (ship.hull > 0) {
            const shipX = 150;
            const shipY = 200 + i * 150;
            if (Math.hypot(x - shipX, y - shipY) < 70) {
                game.selectedShip = i;
            }
        }
    });

    // Enemy selection (right side)
    combat.enemies.forEach((enemy, i) => {
        if (enemy.hull > 0) {
            const enemyX = canvas.width - 200;
            const enemyY = 200 + i * 150;
            if (Math.hypot(x - enemyX, y - enemyY) < 70) {
                combat.targetEnemy = i;
                if (game.selectedAttack) {
                    performAttack(game.selectedAttack);
                }
            }
        }
    });

    // Attack buttons
    const attacks = ['hull', 'sail', 'crew', 'quick', 'board'];
    attacks.forEach((atk, i) => {
        const btnX = 50 + i * 150;
        const btnY = canvas.height - 100;
        if (x >= btnX && x <= btnX + 130 && y >= btnY && y <= btnY + 40) {
            game.selectedAttack = atk;
        }
    });

    // End turn button
    if (x >= canvas.width - 200 && x <= canvas.width - 50 && y >= canvas.height - 100 && y <= canvas.height - 60) {
        enemyTurn();
    }
}

function handleShipYardClick(x, y) {
    // Back button
    if (x >= 50 && x <= 170 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.PORT;
        return;
    }

    // Buy ships
    const availableShips = ['sloop', 'schooner', 'cutter', 'brigantine', 'brig', 'corvette', 'frigate'];
    availableShips.forEach((type, i) => {
        const ship = SHIP_TYPES[type];
        const btnY = 110 + i * 45;
        if (x >= 50 && x <= 450 && y >= btnY && y <= btnY + 40) {
            if (game.gold >= ship.cost && game.fleet.length < 5) {
                game.gold -= ship.cost;
                game.fleet.push(createShip(type));
            }
        }
    });

    // Upgrade ships
    const stats = ['hull', 'sails', 'crew', 'cargo', 'damage'];
    const wpCosts = [10, 15, 8, 5, 20];

    game.fleet.forEach((ship, i) => {
        const shipY = 110 + i * 100;
        stats.forEach((stat, j) => {
            const sx = 520 + j * 140;
            if (x >= sx && x <= sx + 60 && y >= shipY + 55 && y <= shipY + 80) {
                const level = ship.upgrades[stat];
                if (level < 5 && game.warPoints >= wpCosts[j]) {
                    game.warPoints -= wpCosts[j];
                    ship.upgrades[stat]++;
                    applyUpgrade(ship, stat);
                }
            }
        });
    });
}

function applyUpgrade(ship, stat) {
    const level = ship.upgrades[stat];
    const baseShip = SHIP_TYPES[ship.type];
    const multipliers = [1.2, 1.4, 1.6, 1.8, 2.0];
    const mult = multipliers[level - 1];

    switch (stat) {
        case 'hull':
            ship.maxHull = Math.floor(baseShip.hull * mult);
            ship.hull = ship.maxHull;
            break;
        case 'sails':
            ship.maxSails = Math.floor(baseShip.sails * (1 + level * 0.1));
            ship.sails = ship.maxSails;
            ship.maxAp = ship.maxSails;
            break;
        case 'crew':
            ship.maxCrew = Math.floor(baseShip.crew * mult);
            ship.crew = ship.maxCrew;
            break;
        case 'cargo':
            ship.cargo = Math.floor(baseShip.cargo * (1 + level * 0.25));
            break;
        case 'damage':
            ship.damage = Math.floor(baseShip.damage * (1 + level * 0.15));
            break;
    }
}

function handleMarketClick(x, y) {
    // Back button
    if (x >= 50 && x <= 170 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.PORT;
        return;
    }

    const goods = Object.keys(GOODS);
    const port = PORTS[game.currentPort];

    goods.forEach((good, i) => {
        const goodData = GOODS[good];
        const btnY = 80 + i * 75;

        const priceVariation = ((port.name.charCodeAt(0) + i) % 3) - 1;
        const buyPrice = priceVariation < 0 ? goodData.buyLow : goodData.buyHigh;
        const sellPrice = priceVariation > 0 ? goodData.sellHigh : goodData.sellLow;

        // Buy 1
        if (x >= 550 && x <= 620 && y >= btnY + 15 && y <= btnY + 50) {
            if (game.gold >= buyPrice && getTotalCargo() < getFleetCargo()) {
                game.gold -= buyPrice;
                game.cargo[good]++;
                game.day++;
            }
        }
        // Buy 10
        if (x >= 630 && x <= 700 && y >= btnY + 15 && y <= btnY + 50) {
            const amt = Math.min(10, getFleetCargo() - getTotalCargo(), Math.floor(game.gold / buyPrice));
            if (amt > 0) {
                game.gold -= buyPrice * amt;
                game.cargo[good] += amt;
                game.day++;
            }
        }
        // Sell 1
        if (x >= 720 && x <= 790 && y >= btnY + 15 && y <= btnY + 50) {
            if (game.cargo[good] > 0) {
                game.gold += sellPrice;
                game.cargo[good]--;
                game.day++;
            }
        }
        // Sell 10
        if (x >= 800 && x <= 870 && y >= btnY + 15 && y <= btnY + 50) {
            const amt = Math.min(10, game.cargo[good]);
            if (amt > 0) {
                game.gold += sellPrice * amt;
                game.cargo[good] -= amt;
                game.day++;
            }
        }
    });
}

function handleFleetClick(x, y) {
    // Back button
    if (x >= 50 && x <= 170 && y >= canvas.height - 70 && y <= canvas.height - 20) {
        gameState = STATE.PORT;
        return;
    }

    // Repair buttons
    game.fleet.forEach((ship, i) => {
        const btnY = 80 + i * 120;
        if (x >= 1000 && x <= 1120 && y >= btnY + 30 && y <= btnY + 70) {
            const cost = Math.floor((ship.maxHull - ship.hull) / 2);
            if (game.gold >= cost && ship.hull < ship.maxHull) {
                game.gold -= cost;
                ship.hull = ship.maxHull;
                game.day++;
            }
        }
    });
}

// Map travel
function updateTravel(dt) {
    if (!game.traveling || game.targetPort === null) return;

    const target = PORTS[game.targetPort];
    const dx = target.x - game.playerPos.x;
    const dy = target.y - game.playerPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 5) {
        game.playerPos.x = target.x;
        game.playerPos.y = target.y + 40;
        game.currentPort = game.targetPort;
        game.traveling = false;
        game.targetPort = null;
        game.day++;

        // Random encounter chance
        if (Math.random() < 0.15) {
            const enemyTypes = ['sloop', 'sloop', 'cutter'];
            startCombat(enemyTypes.slice(0, 1 + Math.floor(Math.random() * 2)));
        }
    } else {
        const speed = 3;
        game.playerPos.x += (dx / dist) * speed;
        game.playerPos.y += (dy / dist) * speed;
    }
}

// Update projectiles
function updateProjectiles(dt) {
    if (!game.combatState) return;

    game.combatState.projectiles = game.combatState.projectiles.filter(proj => {
        const dx = proj.targetX - proj.x;
        const dy = proj.targetY - proj.y;
        const dist = Math.hypot(dx, dy);

        if (dist < proj.speed) {
            return false;
        }

        proj.x += (dx / dist) * proj.speed;
        proj.y += (dy / dist) * proj.speed;
        return true;
    });
}

// Main game loop
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#1a3050';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update
    updateTravel(dt);
    updateProjectiles(dt);

    if (game.messageTimer > 0) {
        game.messageTimer--;
    }

    // Draw based on state
    switch (gameState) {
        case STATE.TITLE:
            drawTitleScreen();
            break;
        case STATE.MAP:
            drawMapScreen();
            break;
        case STATE.PORT:
            drawPortScreen();
            break;
        case STATE.COMBAT:
            drawCombatScreen();
            break;
        case STATE.SHIP_YARD:
            drawShipYardScreen();
            break;
        case STATE.MARKET:
            drawMarketScreen();
            break;
        case STATE.FLEET:
            drawFleetScreen();
            break;
    }

    // Global message overlay
    if (game.messageTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 30, 400, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, canvas.width/2, canvas.height/2 + 8);
    }

    requestAnimationFrame(gameLoop);
}

// Start game
requestAnimationFrame(gameLoop);
