// High Tea - Historical Trading Strategy Game
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== CONSTANTS ====================
const COLORS = {
    paper: '#f4e4c1',
    paperDark: '#d4c4a1',
    sepia: '#8b6914',
    brown: '#4a3520',
    darkBrown: '#2a1f1a',
    ocean: '#3a5a6a',
    oceanLight: '#4a7a8a',
    land: '#6a8a5a',
    port: '#8a6a4a',
    red: '#aa3333',
    green: '#338833',
    gold: '#d4a020',
    purple: '#6a3a6a',
    tea: '#5a8a5a',
    opium: '#7a5a8a'
};

// Port definitions
const PORTS = [
    { name: 'Lintin', x: 300, y: 320, risk: 1, baseOffer: 8, maxOffer: 15 },
    { name: 'Whampoa', x: 480, y: 280, risk: 2, baseOffer: 12, maxOffer: 22 },
    { name: 'Canton', x: 580, y: 220, risk: 3, baseOffer: 18, maxOffer: 32 },
    { name: 'Macao', x: 350, y: 420, risk: 2, baseOffer: 10, maxOffer: 25 },
    { name: 'Bocca Tigris', x: 500, y: 380, risk: 4, baseOffer: 22, maxOffer: 40 }
];

// Year quotas
const QUOTAS = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];

// ==================== GAME STATE ====================
const game = {
    state: 'menu', // menu, playing, paused, gameover, victory
    year: 1830,
    month: 1,
    time: 0,
    timeScale: 1,
    debugMode: false,

    // Resources
    silver: 500,
    opium: 0,
    tea: 0,

    // Prices
    opiumPrice: 20,
    teaPrice: 15,

    // Ships
    ships: 1,
    maxShips: 6,
    activeShips: [],

    // Britain
    mood: 80,
    quota: 60,
    teaShipped: 0,

    // Trading
    offers: [],
    offerSpawnTimer: 0,
    clipperTimer: 45,

    // Stats
    totalOpiumSold: 0,
    totalTeaShipped: 0,
    totalSilverEarned: 0,
    shipsLost: 0,
    finesPaid: 0,

    // Bribe card
    hasBribeCard: false
};

// ==================== INPUT ====================
const mouse = { x: 0, y: 0, clicked: false };

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', e => {
    mouse.clicked = true;
});

document.addEventListener('keydown', e => {
    if (e.key === 'q' || e.key === 'Q') game.debugMode = !game.debugMode;
    if (e.key === ' ' && game.state === 'menu') startGame();
    if (e.key === ' ' && game.state === 'gameover') startGame();
    if (e.key === '1') game.timeScale = 1;
    if (e.key === '2') game.timeScale = 2;
    if (e.key === '3') game.timeScale = 3;
    if (e.key === 'p' && game.state === 'playing') game.state = 'paused';
    else if (e.key === 'p' && game.state === 'paused') game.state = 'playing';
});

// ==================== GAME FUNCTIONS ====================
function startGame() {
    game.state = 'playing';
    game.year = 1830;
    game.month = 1;
    game.time = 0;
    game.silver = 500;
    game.opium = 0;
    game.tea = 0;
    game.ships = 1;
    game.activeShips = [];
    game.mood = 80;
    game.quota = QUOTAS[0];
    game.teaShipped = 0;
    game.offers = [];
    game.offerSpawnTimer = 0;
    game.clipperTimer = 45;
    game.opiumPrice = 20;
    game.teaPrice = 15;
    game.totalOpiumSold = 0;
    game.totalTeaShipped = 0;
    game.totalSilverEarned = 0;
    game.shipsLost = 0;
    game.finesPaid = 0;
    game.hasBribeCard = false;
    game.timeScale = 1;
}

function getAvailableShips() {
    return game.ships - game.activeShips.length;
}

function spawnOffer() {
    if (game.offers.length >= 3) return;

    const port = PORTS[Math.floor(Math.random() * PORTS.length)];
    const yearFactor = (game.year - 1830) * 0.1;

    // Calculate offer
    const quantity = port.baseOffer + Math.floor(Math.random() * (port.maxOffer - port.baseOffer));
    const priceBase = 40 + yearFactor * 30;
    const priceVariation = (Math.random() - 0.3) * 20;
    const price = Math.round(priceBase + priceVariation + port.risk * 5);

    game.offers.push({
        port: port,
        quantity: quantity,
        price: price,
        timer: 12 + Math.random() * 8, // 12-20 seconds, slower per feedback
        x: port.x + (Math.random() - 0.5) * 40,
        y: port.y - 50
    });
}

function acceptOffer(offer) {
    if (getAvailableShips() <= 0) return;
    if (game.opium < offer.quantity) return;

    // Deduct opium
    game.opium -= offer.quantity;

    // Create ship mission
    game.activeShips.push({
        target: offer.port,
        quantity: offer.quantity,
        price: offer.price,
        progress: 0,
        returning: false,
        x: 200,
        y: 500
    });

    // Remove offer
    const idx = game.offers.indexOf(offer);
    if (idx >= 0) game.offers.splice(idx, 1);
}

function resolveShipMission(ship) {
    const port = ship.target;
    const yearIndex = game.year - 1830;

    // Risk calculation - reduced for early game per feedback
    let captureChance = 0.05 + (port.risk - 1) * 0.05;
    if (yearIndex < 2) captureChance = 0.01; // Nearly zero in first 2 years

    // Add year escalation
    captureChance += yearIndex * 0.02;
    captureChance = Math.min(captureChance, 0.4);

    const roll = Math.random();

    if (roll < captureChance) {
        // Capture outcomes
        const outcome = Math.random();
        if (outcome < 0.6) {
            // Escaped - per feedback, still get partial payment
            const partialSilver = Math.floor(ship.quantity * ship.price * 0.3);
            game.silver += partialSilver;
            game.totalSilverEarned += partialSilver;
            showNotification(`Ship escaped! Recovered ${partialSilver} silver.`, COLORS.gold);
        } else if (outcome < 0.8) {
            // Fined
            const fine = Math.floor(ship.quantity * ship.price * 0.25);
            game.finesPaid += fine;
            // Still get some silver minus fine
            const earned = Math.floor(ship.quantity * ship.price * 0.5);
            game.silver += earned;
            game.totalSilverEarned += earned;
            showNotification(`Ship fined! Earned ${earned} silver after ${fine} fine.`, COLORS.gold);
        } else if (outcome < 0.95) {
            // Confiscated
            showNotification('Cargo confiscated! Ship returns empty.', COLORS.red);
        } else {
            // Ship captured - but only if not last ship
            if (game.ships > 1) {
                game.ships--;
                game.shipsLost++;
                showNotification('SHIP CAPTURED! Lost a vessel.', COLORS.red);
            } else {
                // Can't lose last ship - downgrade to confiscation
                showNotification('Cargo confiscated! (Last ship protected)', COLORS.red);
            }
        }
    } else {
        // Success!
        const earned = ship.quantity * ship.price;
        game.silver += earned;
        game.totalSilverEarned += earned;
        game.totalOpiumSold += ship.quantity;
        showNotification(`Trade success! +${earned} silver`, COLORS.green);
    }
}

function buyOpium(amount) {
    const cost = amount * game.opiumPrice;
    if (game.silver >= cost) {
        game.silver -= cost;
        game.opium += amount;
        showNotification(`Bought ${amount} opium for ${cost} silver`, COLORS.opium);
    }
}

function buyTea(amount) {
    const cost = amount * game.teaPrice;
    if (game.silver >= cost) {
        game.silver -= cost;
        game.tea += amount;
        showNotification(`Bought ${amount} tea for ${cost} silver`, COLORS.tea);
    }
}

function shipTea() {
    if (game.clipperTimer > 0) return;

    const toShip = Math.min(game.tea, game.quota - game.teaShipped);
    if (toShip > 0) {
        game.tea -= toShip;
        game.teaShipped += toShip;
        game.totalTeaShipped += toShip;
        showNotification(`Shipped ${toShip} tea to Britain!`, COLORS.tea);
    }

    // Check if quota met
    if (game.teaShipped >= game.quota) {
        game.mood = Math.min(100, game.mood + 15);
        game.ships = Math.min(game.maxShips, game.ships + 1);
        showNotification('QUOTA MET! +1 Ship, Mood +15', COLORS.green);
        advanceYear();
    } else {
        // Missed quota
        const deficit = game.quota - game.teaShipped;
        const moodLoss = Math.ceil(deficit / 10) * 3;
        game.mood -= moodLoss;
        showNotification(`Quota short by ${deficit}! Mood -${moodLoss}`, COLORS.red);
        advanceYear();
    }
}

function advanceYear() {
    game.year++;
    game.teaShipped = 0;
    game.clipperTimer = 45;

    if (game.year > 1839) {
        game.state = 'victory';
        return;
    }

    game.quota = QUOTAS[game.year - 1830];

    // Update prices
    const yearIndex = game.year - 1830;
    if (yearIndex < 3) {
        game.opiumPrice = 15 + Math.floor(Math.random() * 20);
        game.teaPrice = 12 + Math.floor(Math.random() * 13);
    } else if (yearIndex < 6) {
        game.opiumPrice = 45 + Math.floor(Math.random() * 25);
        game.teaPrice = 25 + Math.floor(Math.random() * 20);
    } else {
        game.opiumPrice = 70 + Math.floor(Math.random() * 50);
        game.teaPrice = 45 + Math.floor(Math.random() * 35);
    }

    // Random bribe card chance
    if (yearIndex >= 3 && !game.hasBribeCard && Math.random() < 0.3) {
        game.hasBribeCard = true;
        showNotification('Corrupt official offers assistance! (Bribe card obtained)', COLORS.gold);
    }

    showNotification(`Year ${game.year} begins. Quota: ${game.quota} tea`, COLORS.paper);
}

// Notifications
let notifications = [];
function showNotification(text, color) {
    notifications.push({
        text: text,
        color: color,
        timer: 3,
        y: canvas.height - 60 - notifications.length * 25
    });
}

// ==================== UPDATE ====================
function update(dt) {
    if (game.state !== 'playing') return;

    const scaledDt = dt * game.timeScale;
    game.time += scaledDt;

    // Spawn offers
    game.offerSpawnTimer -= scaledDt;
    if (game.offerSpawnTimer <= 0) {
        spawnOffer();
        game.offerSpawnTimer = 4 + Math.random() * 4; // Slower spawning per feedback
    }

    // Update offers
    for (let i = game.offers.length - 1; i >= 0; i--) {
        game.offers[i].timer -= scaledDt;
        if (game.offers[i].timer <= 0) {
            game.offers.splice(i, 1);
        }
    }

    // Update ships
    for (let i = game.activeShips.length - 1; i >= 0; i--) {
        const ship = game.activeShips[i];
        ship.progress += scaledDt * 0.3;

        if (!ship.returning && ship.progress >= 1) {
            // Arrived at port
            resolveShipMission(ship);
            ship.returning = true;
            ship.progress = 0;
        } else if (ship.returning && ship.progress >= 1) {
            // Returned home
            game.activeShips.splice(i, 1);
        }

        // Update position
        if (!ship.returning) {
            ship.x = 200 + (ship.target.x - 200) * ship.progress;
            ship.y = 500 + (ship.target.y - 500) * ship.progress;
        } else {
            ship.x = ship.target.x + (200 - ship.target.x) * ship.progress;
            ship.y = ship.target.y + (500 - ship.target.y) * ship.progress;
        }
    }

    // Update clipper timer
    game.clipperTimer -= scaledDt;
    if (game.clipperTimer <= 0) {
        shipTea();
    }

    // Check lose conditions
    if (game.mood <= 0) {
        game.state = 'gameover';
    }
    if (game.silver <= 0 && game.opium <= 0 && game.tea <= 0 && game.activeShips.length === 0) {
        // Softlock prevention - give emergency funds
        game.silver = 100;
        showNotification('Emergency loan received! +100 silver', COLORS.gold);
    }

    // Update notifications
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].timer -= dt;
        if (notifications[i].timer <= 0) {
            notifications.splice(i, 1);
        }
    }

    // Handle clicks
    if (mouse.clicked) {
        handleClick();
        mouse.clicked = false;
    }
}

function handleClick() {
    // Check offer clicks
    for (const offer of game.offers) {
        const dist = Math.sqrt((mouse.x - offer.x) ** 2 + (mouse.y - offer.y) ** 2);
        if (dist < 40) {
            acceptOffer(offer);
            return;
        }
    }

    // Check buy buttons
    // Opium buttons (left panel)
    if (mouse.x >= 20 && mouse.x <= 160) {
        if (mouse.y >= 220 && mouse.y <= 245) buyOpium(5);
        else if (mouse.y >= 250 && mouse.y <= 275) buyOpium(10);
        else if (mouse.y >= 280 && mouse.y <= 305) buyOpium(15);
    }

    // Tea buttons (left panel)
    if (mouse.x >= 20 && mouse.x <= 160) {
        if (mouse.y >= 400 && mouse.y <= 425) buyTea(5);
        else if (mouse.y >= 430 && mouse.y <= 455) buyTea(10);
        else if (mouse.y >= 460 && mouse.y <= 485) buyTea(15);
    }

    // Time scale buttons
    if (mouse.y >= 610 && mouse.y <= 635) {
        if (mouse.x >= 20 && mouse.x <= 50) game.timeScale = 1;
        else if (mouse.x >= 55 && mouse.x <= 85) game.timeScale = 2;
        else if (mouse.x >= 90 && mouse.x <= 120) game.timeScale = 3;
    }

    // Menu click
    if (game.state === 'menu' && mouse.y > 400) {
        startGame();
    }
}

// ==================== RENDER ====================
function render() {
    // Paper background
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        renderMenu();
        return;
    }

    renderHeader();
    renderLeftPanel();
    renderMap();
    renderBottomPanel();
    renderNotifications();

    if (game.debugMode) renderDebug();
    if (game.state === 'paused') renderPaused();
    if (game.state === 'gameover') renderGameOver();
    if (game.state === 'victory') renderVictory();
}

function renderMenu() {
    // Title
    ctx.fillStyle = COLORS.brown;
    ctx.font = 'bold 64px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('HIGH TEA', canvas.width / 2, 180);

    ctx.font = '24px Georgia';
    ctx.fillStyle = COLORS.sepia;
    ctx.fillText('A Trading Strategy Game', canvas.width / 2, 230);

    // Historical context
    ctx.font = '16px Georgia';
    ctx.fillStyle = COLORS.brown;
    const lines = [
        'The year is 1830. Britain is addicted to tea,',
        'but China only accepts silver in trade.',
        '',
        'Your solution? Sell opium from Bengal to Chinese ports,',
        'use the silver to buy tea, and ship it to Britain.',
        '',
        'Can you satisfy Britain\'s insatiable demand',
        'while evading Chinese authorities?'
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 300 + i * 24);
    });

    // Start prompt
    ctx.font = '28px Georgia';
    ctx.fillStyle = COLORS.sepia;
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click or Press SPACE to Begin', canvas.width / 2, 550);
    ctx.globalAlpha = 1;

    // Controls
    ctx.font = '14px Georgia';
    ctx.fillStyle = COLORS.brown;
    ctx.fillText('Q - Debug | P - Pause | 1/2/3 - Time Speed', canvas.width / 2, 600);
}

function renderHeader() {
    // Header bar
    ctx.fillStyle = COLORS.sepia;
    ctx.fillRect(0, 0, canvas.width, 50);

    ctx.fillStyle = COLORS.paper;
    ctx.font = 'bold 20px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Year: ${game.year}`, 20, 32);

    // Mood meter
    ctx.fillStyle = COLORS.paper;
    ctx.fillText('Britain:', 180, 32);

    ctx.fillStyle = COLORS.darkBrown;
    ctx.fillRect(270, 15, 150, 25);

    const moodColor = game.mood > 60 ? COLORS.green : game.mood > 30 ? COLORS.gold : COLORS.red;
    ctx.fillStyle = moodColor;
    ctx.fillRect(272, 17, (game.mood / 100) * 146, 21);

    ctx.fillStyle = COLORS.paper;
    ctx.font = '14px Georgia';
    ctx.fillText(`${game.mood}%`, 345, 33);

    // Silver
    ctx.font = 'bold 20px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`Silver: ${game.silver}`, canvas.width - 20, 32);

    // Time scale
    ctx.textAlign = 'left';
    ctx.font = '14px Georgia';
    ctx.fillText(`Speed: ${game.timeScale}x`, 500, 32);
}

function renderLeftPanel() {
    // Panel background
    ctx.fillStyle = COLORS.paperDark;
    ctx.fillRect(10, 60, 170, 540);
    ctx.strokeStyle = COLORS.sepia;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 60, 170, 540);

    // Opium section
    ctx.fillStyle = COLORS.opium;
    ctx.fillRect(15, 65, 160, 30);
    ctx.fillStyle = COLORS.paper;
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY OPIUM', 95, 87);

    ctx.fillStyle = COLORS.brown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Price: ${game.opiumPrice} silver`, 25, 120);
    ctx.fillText(`Stock: ${game.opium} chests`, 25, 145);

    // Opium buttons
    drawButton(25, 170, 50, 25, '5', game.silver >= 5 * game.opiumPrice);
    drawButton(80, 170, 50, 25, '10', game.silver >= 10 * game.opiumPrice);
    drawButton(135, 170, 35, 25, '15', game.silver >= 15 * game.opiumPrice);

    ctx.fillStyle = COLORS.brown;
    ctx.font = '12px Georgia';
    ctx.fillText(`${5 * game.opiumPrice}`, 35, 212);
    ctx.fillText(`${10 * game.opiumPrice}`, 90, 212);
    ctx.fillText(`${15 * game.opiumPrice}`, 138, 212);

    // Tea section
    ctx.fillStyle = COLORS.tea;
    ctx.fillRect(15, 240, 160, 30);
    ctx.fillStyle = COLORS.paper;
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY TEA', 95, 262);

    ctx.fillStyle = COLORS.brown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Price: ${game.teaPrice} silver`, 25, 295);
    ctx.fillText(`Stock: ${game.tea} chests`, 25, 320);

    // Tea buttons
    drawButton(25, 345, 50, 25, '5', game.silver >= 5 * game.teaPrice);
    drawButton(80, 345, 50, 25, '10', game.silver >= 10 * game.teaPrice);
    drawButton(135, 345, 35, 25, '15', game.silver >= 15 * game.teaPrice);

    ctx.fillStyle = COLORS.brown;
    ctx.font = '12px Georgia';
    ctx.fillText(`${5 * game.teaPrice}`, 35, 387);
    ctx.fillText(`${10 * game.teaPrice}`, 90, 387);
    ctx.fillText(`${15 * game.teaPrice}`, 138, 387);

    // Ships section
    ctx.fillStyle = COLORS.sepia;
    ctx.fillRect(15, 415, 160, 30);
    ctx.fillStyle = COLORS.paper;
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('FLEET', 95, 437);

    ctx.fillStyle = COLORS.brown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Ships: ${getAvailableShips()}/${game.ships}`, 25, 470);

    // Draw ship icons
    for (let i = 0; i < game.ships; i++) {
        const isActive = i >= getAvailableShips();
        ctx.fillStyle = isActive ? COLORS.ocean : COLORS.sepia;
        ctx.font = '20px Georgia';
        ctx.fillText('⛵', 25 + i * 25, 500);
    }

    // Bribe card
    if (game.hasBribeCard) {
        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(25, 520, 140, 30);
        ctx.fillStyle = COLORS.brown;
        ctx.font = '12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('BRIBE CARD: 1', 95, 540);
    }
}

function drawButton(x, y, w, h, text, enabled) {
    ctx.fillStyle = enabled ? COLORS.sepia : '#888888';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLORS.paper;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + 17);
}

function renderMap() {
    // Map area
    ctx.fillStyle = COLORS.ocean;
    ctx.fillRect(190, 60, 500, 430);

    // Land masses
    ctx.fillStyle = COLORS.land;
    ctx.beginPath();
    ctx.moveTo(450, 60);
    ctx.lineTo(690, 60);
    ctx.lineTo(690, 200);
    ctx.lineTo(600, 250);
    ctx.lineTo(550, 220);
    ctx.lineTo(500, 260);
    ctx.lineTo(450, 200);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(280, 380);
    ctx.lineTo(380, 340);
    ctx.lineTo(400, 400);
    ctx.lineTo(350, 480);
    ctx.lineTo(280, 450);
    ctx.closePath();
    ctx.fill();

    // Title
    ctx.fillStyle = COLORS.brown;
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PEARL RIVER DELTA', 440, 85);

    // Ports
    PORTS.forEach(port => {
        // Port circle
        ctx.fillStyle = COLORS.port;
        ctx.beginPath();
        ctx.arc(port.x, port.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.paper;
        ctx.font = '12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y + 30);

        // Risk indicator
        ctx.fillStyle = COLORS.brown;
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i < port.risk ? COLORS.red : '#aaaaaa';
            ctx.fillRect(port.x - 15 + i * 7, port.y + 35, 5, 8);
        }
    });

    // Draw offers
    game.offers.forEach(offer => {
        const x = offer.x;
        const y = offer.y;

        // Bubble
        ctx.fillStyle = COLORS.paper;
        ctx.beginPath();
        ctx.ellipse(x, y, 45, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.sepia;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Timer bar
        const timerWidth = (offer.timer / 20) * 70;
        ctx.fillStyle = offer.timer < 5 ? COLORS.red : COLORS.green;
        ctx.fillRect(x - 35, y + 25, timerWidth, 4);

        // Text
        ctx.fillStyle = COLORS.brown;
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`${offer.quantity} chests`, x, y - 8);
        ctx.fillText(`@${offer.price} silver`, x, y + 8);

        // Highlight if hoverable
        const dist = Math.sqrt((mouse.x - x) ** 2 + (mouse.y - y) ** 2);
        if (dist < 40 && getAvailableShips() > 0 && game.opium >= offer.quantity) {
            ctx.strokeStyle = COLORS.green;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    // Draw ships
    game.activeShips.forEach(ship => {
        ctx.fillStyle = COLORS.sepia;
        ctx.font = '24px Georgia';
        ctx.fillText('⛵', ship.x - 12, ship.y + 8);
    });

    // Your port
    ctx.fillStyle = COLORS.sepia;
    ctx.beginPath();
    ctx.arc(200, 500, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.paper;
    ctx.font = '10px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR', 200, 498);
    ctx.fillText('PORT', 200, 510);
}

function renderBottomPanel() {
    // Quota panel
    ctx.fillStyle = COLORS.paperDark;
    ctx.fillRect(700, 60, 190, 200);
    ctx.strokeStyle = COLORS.sepia;
    ctx.lineWidth = 2;
    ctx.strokeRect(700, 60, 190, 200);

    ctx.fillStyle = COLORS.tea;
    ctx.fillRect(705, 65, 180, 30);
    ctx.fillStyle = COLORS.paper;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('TEA CLIPPER', 795, 87);

    ctx.fillStyle = COLORS.brown;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Arriving in: ${Math.ceil(game.clipperTimer)}s`, 715, 120);
    ctx.fillText(`Quota: ${game.quota} chests`, 715, 145);
    ctx.fillText(`Your tea: ${game.tea} chests`, 715, 170);
    ctx.fillText(`Shipped: ${game.teaShipped}/${game.quota}`, 715, 195);

    // Progress bar
    ctx.fillStyle = COLORS.darkBrown;
    ctx.fillRect(715, 210, 160, 20);
    const progress = Math.min(1, game.teaShipped / game.quota);
    ctx.fillStyle = progress >= 1 ? COLORS.green : COLORS.tea;
    ctx.fillRect(717, 212, progress * 156, 16);

    // Time scale buttons
    ctx.fillStyle = COLORS.brown;
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Speed:', 700, 285);

    for (let i = 1; i <= 3; i++) {
        ctx.fillStyle = game.timeScale === i ? COLORS.green : COLORS.sepia;
        ctx.fillRect(750 + (i - 1) * 45, 270, 40, 25);
        ctx.fillStyle = COLORS.paper;
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`${i}x`, 770 + (i - 1) * 45, 288);
    }

    // News ticker
    ctx.fillStyle = COLORS.sepia;
    ctx.fillRect(190, 500, 500, 90);
    ctx.fillStyle = COLORS.paper;
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';

    const news = getNewsMessage();
    ctx.fillText(news, 200, 530);

    // Instructions
    ctx.font = '12px Georgia';
    ctx.fillText('Click offers on map to send ships. Buy opium first!', 200, 560);
    ctx.fillText('Ship tea to Britain before the clipper arrives.', 200, 580);
}

function getNewsMessage() {
    const yearIndex = game.year - 1830;
    if (yearIndex === 0) return 'Welcome, merchant. Britain needs tea!';
    if (yearIndex === 2) return '"Orders drying up" - Chinese merchants cautious...';
    if (yearIndex === 3) return '"Dealing houses merge" - Opium prices spike!';
    if (yearIndex === 6) return '"Lin Zexu appointed" - Enforcement intensifies!';
    if (yearIndex === 9) return '"Lin demands surrender" - War is imminent!';
    return `Trade continues in the Pearl River Delta...`;
}

function renderNotifications() {
    notifications.forEach((notif, i) => {
        ctx.fillStyle = notif.color;
        ctx.globalAlpha = Math.min(1, notif.timer);
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(notif.text, canvas.width / 2, notif.y);
    });
    ctx.globalAlpha = 1;
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(canvas.width - 220, 320, 210, 170);

    ctx.fillStyle = '#00ff88';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const info = [
        'DEBUG (Q)',
        '---',
        `Year: ${game.year} Month: ${game.month}`,
        `Silver: ${game.silver}`,
        `Opium: ${game.opium}`,
        `Tea: ${game.tea}`,
        `Ships: ${getAvailableShips()}/${game.ships}`,
        `Mood: ${game.mood}%`,
        `Offers: ${game.offers.length}`,
        `Active ships: ${game.activeShips.length}`,
        `Time scale: ${game.timeScale}x`
    ];

    info.forEach((line, i) => {
        ctx.fillText(line, canvas.width - 210, 335 + i * 14);
    });
}

function renderPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.paper;
    ctx.font = '48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '20px Georgia';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 50);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.red;
    ctx.font = '48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 200);

    ctx.fillStyle = COLORS.paper;
    ctx.font = '20px Georgia';
    ctx.fillText(`Britain has lost patience with your trading.`, canvas.width / 2, 280);

    ctx.font = '16px Georgia';
    ctx.fillText(`Years survived: ${game.year - 1830}`, canvas.width / 2, 340);
    ctx.fillText(`Opium sold: ${game.totalOpiumSold} chests`, canvas.width / 2, 370);
    ctx.fillText(`Tea shipped: ${game.totalTeaShipped} chests`, canvas.width / 2, 400);
    ctx.fillText(`Silver earned: ${game.totalSilverEarned}`, canvas.width / 2, 430);

    ctx.font = '20px Georgia';
    ctx.fillText('Press SPACE to try again', canvas.width / 2, 520);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.gold;
    ctx.font = '48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 150);

    ctx.fillStyle = COLORS.paper;
    ctx.font = '18px Georgia';
    ctx.fillText('You survived all 9 years of the Opium Trade.', canvas.width / 2, 210);

    ctx.font = '16px Georgia';
    ctx.fillText(`Total opium sold: ${game.totalOpiumSold} chests`, canvas.width / 2, 280);
    ctx.fillText(`Total tea shipped: ${game.totalTeaShipped} chests`, canvas.width / 2, 310);
    ctx.fillText(`Total silver earned: ${game.totalSilverEarned}`, canvas.width / 2, 340);
    ctx.fillText(`Ships lost: ${game.shipsLost}`, canvas.width / 2, 370);
    ctx.fillText(`Fines paid: ${game.finesPaid}`, canvas.width / 2, 400);

    // Historical note
    const addictions = Math.floor(game.totalOpiumSold * 5);
    ctx.fillStyle = COLORS.red;
    ctx.font = '14px Georgia';
    ctx.fillText(`Estimated Chinese addicted: ${addictions.toLocaleString()}`, canvas.width / 2, 450);

    ctx.fillStyle = COLORS.paper;
    ctx.font = '12px Georgia';
    const note = 'The First Opium War (1839-1842) would soon follow, forcing China to cede Hong Kong.';
    ctx.fillText(note, canvas.width / 2, 490);

    ctx.font = '20px Georgia';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, 560);
}

// ==================== GAME LOOP ====================
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
