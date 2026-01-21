// High Tea v2 - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
const game = {
    state: 'menu', // menu, playing, gameover, victory
    year: 1830,
    month: 1,
    timeScale: 1,
    tutorial: true,
    tutorialStep: 0
};

// Resources
const resources = {
    silver: 500,
    opium: 0,
    tea: 0
};

// Fleet
const fleet = {
    ships: 1,
    maxShips: 6,
    activeShips: [] // Ships en route
};

// Britain's mood
let mood = 80;

// Bribe cards
let brideCards = 0;

// Prices
let opiumPrice = 25;
let teaPrice = 18;

// Quotas by year
const QUOTAS = {
    1830: 60, 1831: 90, 1832: 120, 1833: 180, 1834: 250,
    1835: 320, 1836: 400, 1837: 500, 1838: 580, 1839: 660
};

// Ports
const ports = [
    { name: 'Lintin Island', x: 200, y: 280, risk: 1, baseRisk: 1 },
    { name: 'Whampoa', x: 450, y: 250, risk: 2, baseRisk: 2 },
    { name: 'Canton', x: 550, y: 320, risk: 3, baseRisk: 3 },
    { name: 'Macao', x: 280, y: 380, risk: 2, baseRisk: 2 },
    { name: 'Bocca Tigris', x: 380, y: 420, risk: 4, baseRisk: 4 }
];

// Active offers
let offers = [];
let offerTimer = 0;

// Clipper
let clipperTimer = 60; // seconds until clipper arrives
let teaShipped = 0;

// Animations
let animations = [];

// Statistics
let totalOpiumSold = 0;
let totalTeaShipped = 0;
let totalSilverEarned = 0;
let shipsLost = 0;

// Historical events
const EVENTS = {
    1832: { msg: "Orders are drying up. Chinese merchants grow cautious...", effect: 'slowOffers' },
    1833: { msg: "The Bengal dealing houses have merged! Opium prices soar!", effect: 'opiumSpike' },
    1836: { msg: "Commissioner Lin Zexu has been appointed to end the opium trade!", effect: 'riskIncrease' },
    1839: { msg: "Lin demands all foreign opium be surrendered. War is imminent!", effect: 'finalYear' }
};

let currentEvent = null;
let eventTimer = 0;

// Tutorial messages
const TUTORIAL = [
    "Welcome! The year is 1830. Britain is addicted to tea.",
    "Your job: Sell opium to China to earn silver, then buy tea.",
    "Click 'BUY OPIUM' to purchase opium chests.",
    "Port offers will appear on the map. Click to send a ship!",
    "When the Tea Clipper arrives, your tea ships to Britain.",
    "Meet the quota to earn a new ship. Good luck!"
];

// Initialize
function init() {
    updatePrices();
}

// Price system
function updatePrices() {
    const yearFactor = (game.year - 1830) / 9;

    // Opium prices rise over time
    const baseOpium = 25 + yearFactor * 80;
    opiumPrice = Math.floor(baseOpium + (Math.random() - 0.5) * 20);

    if (game.year >= 1833) opiumPrice *= 1.5; // Price spike event

    // Tea prices rise too
    const baseTea = 18 + yearFactor * 50;
    teaPrice = Math.floor(baseTea + (Math.random() - 0.5) * 10);

    opiumPrice = Math.max(15, Math.min(120, opiumPrice));
    teaPrice = Math.max(12, Math.min(80, teaPrice));
}

// Port offers
function generateOffer() {
    const availablePorts = ports.filter(p => !offers.find(o => o.port === p));
    if (availablePorts.length === 0) return;

    const port = availablePorts[Math.floor(Math.random() * availablePorts.length)];
    const quantity = 5 + Math.floor(Math.random() * (15 + port.risk * 5));
    const pricePerChest = 40 + port.risk * 15 + Math.floor(Math.random() * 20);

    offers.push({
        port,
        quantity,
        price: pricePerChest,
        timer: 15 + Math.random() * 10 // Slower offers per feedback
    });
}

function acceptOffer(offer) {
    // Check if we have ships and opium
    const availableShips = fleet.ships - fleet.activeShips.length;
    if (availableShips <= 0) {
        addAnimation(400, 300, "No ships available!", '#e74c3c');
        return;
    }
    if (resources.opium < offer.quantity) {
        addAnimation(400, 300, "Not enough opium!", '#e74c3c');
        return;
    }

    // Warn if last ship and high risk
    if (availableShips === 1 && fleet.ships === 1 && offer.port.risk >= 3) {
        // Still allow but show warning
        addAnimation(400, 280, "Warning: Risking only ship!", '#f39c12');
    }

    // Send ship
    resources.opium -= offer.quantity;
    fleet.activeShips.push({
        port: offer.port,
        quantity: offer.quantity,
        value: offer.quantity * offer.price,
        travelTime: 3 + Math.random() * 2,
        returning: false
    });

    // Remove offer
    offers = offers.filter(o => o !== offer);

    // Increase port risk
    offer.port.risk = Math.min(5, offer.port.risk + 0.5);
    if (offer.quantity >= 30) offer.port.risk = Math.min(5, offer.port.risk + 0.5);

    addAnimation(offer.port.x, offer.port.y - 20, "Ship sent!", '#3498db');
}

// Ship resolution
function resolveShip(ship) {
    const captureChance = getCaptureChance(ship.port.risk);

    // Early game protection - much lower risk
    const yearProtection = game.year <= 1831 ? 0.1 : game.year <= 1832 ? 0.5 : 1;
    const finalChance = captureChance * yearProtection;

    if (Math.random() < finalChance) {
        // Caught!
        const outcome = Math.random();
        if (outcome < 0.6) {
            // Escaped - but get partial silver
            const partialValue = Math.floor(ship.value * 0.3);
            resources.silver += partialValue;
            addAnimation(400, 300, `Escaped! +${partialValue} silver`, '#f39c12');
        } else if (outcome < 0.8) {
            // Bribed/fined
            const fine = Math.floor(ship.value * 0.2);
            resources.silver += ship.value - fine;
            addAnimation(400, 300, `Fined! +${ship.value - fine} silver`, '#f39c12');
        } else if (outcome < 0.95) {
            // Cargo confiscated
            addAnimation(400, 300, "Cargo confiscated!", '#e74c3c');
        } else {
            // Ship captured
            if (fleet.ships > 1) {
                fleet.ships--;
                shipsLost++;
                addAnimation(400, 300, "Ship captured!", '#e74c3c');
            } else {
                // Last ship - give emergency silver instead
                resources.silver += 50;
                addAnimation(400, 300, "Narrow escape! +50 silver", '#f39c12');
            }
        }
    } else {
        // Success!
        resources.silver += ship.value;
        totalSilverEarned += ship.value;
        totalOpiumSold += ship.quantity;
        addAnimation(400, 300, `+${ship.value} silver!`, '#27ae60');

        // Chance for bribe card
        if (game.year >= 1833 && Math.random() < 0.1 && brideCards < 1) {
            brideCards++;
            addAnimation(400, 340, "Bribe card acquired!", '#9b59b6');
        }
    }
}

function getCaptureChance(riskLevel) {
    const chances = [0.05, 0.1, 0.2, 0.35, 0.5];
    return chances[Math.min(4, Math.floor(riskLevel) - 1)] || 0.05;
}

// Buy/sell
function buyOpium(amount) {
    const cost = amount * opiumPrice;
    if (resources.silver >= cost) {
        resources.silver -= cost;
        resources.opium += amount;
        addAnimation(100, 250, `-${cost} silver`, '#e74c3c');
        addAnimation(100, 280, `+${amount} opium`, '#9b59b6');
    }
}

function buyTea(amount) {
    const cost = amount * teaPrice;
    if (resources.silver >= cost) {
        resources.silver -= cost;
        resources.tea += amount;
        addAnimation(100, 450, `-${cost} silver`, '#e74c3c');
        addAnimation(100, 480, `+${amount} tea`, '#27ae60');
    }
}

// Clipper arrival
function clipperArrives() {
    const quota = QUOTAS[game.year];
    const shipped = Math.min(resources.tea, quota);

    resources.tea -= shipped;
    teaShipped = shipped;
    totalTeaShipped += shipped;

    if (shipped >= quota) {
        // Met quota!
        mood = Math.min(100, mood + 15);
        if (fleet.ships < fleet.maxShips) {
            fleet.ships++;
            addAnimation(400, 300, "Quota met! +1 Ship!", '#27ae60');
        } else {
            addAnimation(400, 300, "Quota met!", '#27ae60');
        }
    } else if (shipped >= quota * 0.5) {
        // Partial
        mood -= Math.floor((1 - shipped / quota) * 20);
        addAnimation(400, 300, `Partial shipment: ${shipped}/${quota}`, '#f39c12');
    } else {
        // Failed
        mood -= 20;
        addAnimation(400, 300, "Quota missed!", '#e74c3c');
    }

    // Advance year
    game.year++;
    if (game.year > 1839) {
        game.state = 'victory';
        return;
    }

    // Reset clipper timer
    clipperTimer = 60;
    teaShipped = 0;

    // Update prices
    updatePrices();

    // Check for events
    if (EVENTS[game.year]) {
        currentEvent = EVENTS[game.year];
        eventTimer = 5;
        applyEvent(currentEvent.effect);
    }

    // Risk decay
    for (const port of ports) {
        port.risk = Math.max(port.baseRisk, port.risk - 0.2);
    }
}

function applyEvent(effect) {
    if (effect === 'slowOffers') {
        // Offers will be less frequent (handled in update)
    } else if (effect === 'opiumSpike') {
        opiumPrice = Math.floor(opiumPrice * 1.5);
    } else if (effect === 'riskIncrease') {
        for (const port of ports) {
            port.risk = Math.min(5, port.risk + 1);
        }
    }
}

// Animations
function addAnimation(x, y, text, color) {
    animations.push({ x, y, text, color, alpha: 1, vy: -1 });
}

// Update
function update(dt) {
    if (game.state !== 'playing') return;

    const scaledDt = dt * game.timeScale;

    // Mood decay
    if (mood > 50) mood -= 0.01 * scaledDt;

    // Check lose conditions
    if (mood <= 0) {
        game.state = 'gameover';
        return;
    }
    if (resources.silver <= 0 && resources.opium <= 0 && resources.tea <= 0) {
        game.state = 'gameover';
        return;
    }
    if (fleet.ships <= 0) {
        game.state = 'gameover';
        return;
    }

    // Clipper timer
    clipperTimer -= scaledDt;
    if (clipperTimer <= 0) {
        clipperArrives();
    }

    // Offer generation
    offerTimer -= scaledDt;
    const offerRate = currentEvent?.effect === 'slowOffers' ? 8 : 5;
    if (offerTimer <= 0 && offers.length < 3) {
        generateOffer();
        offerTimer = offerRate + Math.random() * 4;
    }

    // Offer expiration
    for (let i = offers.length - 1; i >= 0; i--) {
        offers[i].timer -= scaledDt;
        if (offers[i].timer <= 0) {
            offers.splice(i, 1);
        }
    }

    // Ship travel
    for (let i = fleet.activeShips.length - 1; i >= 0; i--) {
        const ship = fleet.activeShips[i];
        ship.travelTime -= scaledDt;
        if (ship.travelTime <= 0) {
            if (!ship.returning) {
                resolveShip(ship);
                ship.returning = true;
                ship.travelTime = 2;
            } else {
                fleet.activeShips.splice(i, 1);
            }
        }
    }

    // Event timer
    if (eventTimer > 0) {
        eventTimer -= scaledDt;
        if (eventTimer <= 0) currentEvent = null;
    }

    // Animations
    for (let i = animations.length - 1; i >= 0; i--) {
        animations[i].y += animations[i].vy;
        animations[i].alpha -= 0.02;
        if (animations[i].alpha <= 0) {
            animations.splice(i, 1);
        }
    }

    // Tutorial
    if (game.tutorial && game.tutorialStep < TUTORIAL.length) {
        // Auto advance tutorial based on actions
        if (game.tutorialStep === 2 && resources.opium > 0) game.tutorialStep = 3;
        if (game.tutorialStep === 3 && fleet.activeShips.length > 0) game.tutorialStep = 4;
        if (game.tutorialStep === 4 && clipperTimer < 55) game.tutorialStep = 5;
    }
}

// Drawing
function draw() {
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'playing') {
        drawGame();
    } else if (game.state === 'gameover') {
        drawGame();
        drawGameOver();
    } else if (game.state === 'victory') {
        drawGame();
        drawVictory();
    }
}

function drawMenu() {
    // Title
    ctx.fillStyle = '#2c1810';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('HIGH TEA', 400, 150);

    ctx.font = '20px Georgia';
    ctx.fillText('A Historical Trading Game', 400, 190);

    // Teacup illustration
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(400, 320, 60, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(400, 320, 50, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Steam
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(380 + i * 20, 280);
        ctx.bezierCurveTo(375 + i * 20, 260, 385 + i * 20, 250, 380 + i * 20, 230);
        ctx.stroke();
    }

    ctx.fillStyle = '#2c1810';
    ctx.font = '18px Georgia';
    ctx.fillText('1830-1839: The Pearl River Delta', 400, 420);
    ctx.fillText('Trade opium for silver, buy tea for Britain', 400, 450);

    ctx.font = '24px Georgia';
    ctx.fillText('Click to Begin', 400, 520);
}

function drawGame() {
    // Map background (sea)
    ctx.fillStyle = '#6b8e9f';
    ctx.fillRect(150, 180, 500, 320);

    // Land masses
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(650, 180);
    ctx.lineTo(650, 500);
    ctx.lineTo(500, 500);
    ctx.lineTo(450, 400);
    ctx.lineTo(500, 350);
    ctx.lineTo(550, 300);
    ctx.lineTo(600, 250);
    ctx.lineTo(650, 180);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(150, 180);
    ctx.lineTo(250, 200);
    ctx.lineTo(200, 280);
    ctx.lineTo(150, 300);
    ctx.closePath();
    ctx.fill();

    // Ports
    for (const port of ports) {
        // Port circle
        ctx.fillStyle = '#c9a227';
        ctx.beginPath();
        ctx.arc(port.x, port.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Risk indicator
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        const riskBars = '█'.repeat(Math.floor(port.risk)) + '░'.repeat(5 - Math.floor(port.risk));
        ctx.fillText(riskBars, port.x, port.y + 30);

        // Port name
        ctx.fillStyle = '#2c1810';
        ctx.font = '11px Georgia';
        ctx.fillText(port.name, port.x, port.y - 20);
    }

    // Offers
    for (const offer of offers) {
        const x = offer.port.x;
        const y = offer.port.y - 50;

        // Bubble
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(x - 45, y - 30, 90, 55);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 45, y - 30, 90, 55);

        ctx.fillStyle = '#2c1810';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`${offer.quantity} chests`, x, y - 12);
        ctx.fillText(`@ ${offer.price} silver`, x, y + 2);

        // Timer bar
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x - 40, y + 12, 80, 6);
        ctx.fillStyle = offer.timer < 5 ? '#e74c3c' : '#27ae60';
        ctx.fillRect(x - 40, y + 12, 80 * (offer.timer / 20), 6);
    }

    // Ships en route
    for (const ship of fleet.activeShips) {
        const progress = ship.returning ? 1 - ship.travelTime / 2 : ship.travelTime / 4;
        const sx = 100 + (ship.port.x - 100) * (1 - progress);
        const sy = 550 + (ship.port.y - 550) * (1 - progress);

        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy);
        ctx.lineTo(sx + 10, sy);
        ctx.lineTo(sx + 5, sy - 15);
        ctx.lineTo(sx - 5, sy - 15);
        ctx.closePath();
        ctx.fill();

        // Sail
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 15);
        ctx.lineTo(sx + 8, sy - 10);
        ctx.lineTo(sx, sy - 5);
        ctx.closePath();
        ctx.fill();
    }

    // Left panel - Opium
    ctx.fillStyle = 'rgba(139, 69, 19, 0.9)';
    ctx.fillRect(10, 180, 130, 130);
    ctx.strokeStyle = '#2c1810';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 180, 130, 130);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY OPIUM', 75, 200);
    ctx.font = '12px Georgia';
    ctx.fillText(`Price: ${opiumPrice}/chest`, 75, 220);
    ctx.fillText(`Stock: ${resources.opium}`, 75, 240);

    // Buy buttons
    drawButton(25, 255, 35, 20, '5', '#9b59b6');
    drawButton(65, 255, 35, 20, '10', '#9b59b6');
    drawButton(105, 255, 35, 20, '15', '#9b59b6');

    // Left panel - Tea
    ctx.fillStyle = 'rgba(39, 174, 96, 0.9)';
    ctx.fillRect(10, 320, 130, 130);
    ctx.strokeStyle = '#2c1810';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 320, 130, 130);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText('BUY TEA', 75, 340);
    ctx.font = '12px Georgia';
    ctx.fillText(`Price: ${teaPrice}/chest`, 75, 360);
    ctx.fillText(`Stock: ${resources.tea}`, 75, 380);

    drawButton(25, 395, 35, 20, '5', '#27ae60');
    drawButton(65, 395, 35, 20, '10', '#27ae60');
    drawButton(105, 395, 35, 20, '15', '#27ae60');

    // Ships panel
    ctx.fillStyle = 'rgba(52, 73, 94, 0.9)';
    ctx.fillRect(10, 460, 130, 80);
    ctx.strokeStyle = '#2c1810';
    ctx.strokeRect(10, 460, 130, 80);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText('FLEET', 75, 480);
    ctx.font = '18px Georgia';
    const shipIcons = '⛵'.repeat(fleet.ships - fleet.activeShips.length) + '🚢'.repeat(fleet.activeShips.length);
    ctx.fillText(shipIcons, 75, 505);
    ctx.font = '12px Georgia';
    ctx.fillText(`Bribe Cards: ${brideCards}`, 75, 530);

    // Top bar
    ctx.fillStyle = 'rgba(44, 24, 16, 0.95)';
    ctx.fillRect(0, 0, 800, 50);

    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Year: ${game.year}`, 20, 32);

    // Mood bar
    ctx.fillStyle = '#333';
    ctx.fillRect(150, 15, 150, 20);
    ctx.fillStyle = mood > 50 ? '#27ae60' : mood > 25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(150, 15, 150 * (mood / 100), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Britain: ${Math.floor(mood)}%`, 225, 30);

    // Silver
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`Silver: ${resources.silver}`, 780, 32);

    // Bottom bar - Clipper
    ctx.fillStyle = 'rgba(44, 24, 16, 0.95)';
    ctx.fillRect(0, 550, 800, 50);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Tea Clipper arrives in: ${Math.ceil(clipperTimer)}s`, 400, 572);
    ctx.fillText(`Quota: ${QUOTAS[game.year]} chests | Your tea: ${resources.tea}`, 400, 590);

    // Time control
    ctx.textAlign = 'left';
    ctx.fillText('Speed:', 650, 572);
    drawButton(700, 558, 25, 20, '1x', game.timeScale === 1 ? '#27ae60' : '#555');
    drawButton(730, 558, 25, 20, '2x', game.timeScale === 2 ? '#27ae60' : '#555');
    drawButton(760, 558, 25, 20, '3x', game.timeScale === 3 ? '#27ae60' : '#555');

    // Event banner
    if (currentEvent) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.95)';
        ctx.fillRect(150, 100, 500, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(currentEvent.msg, 400, 135);
    }

    // Tutorial
    if (game.tutorial && game.tutorialStep < TUTORIAL.length) {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.95)';
        ctx.fillRect(150, 55, 500, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(TUTORIAL[game.tutorialStep], 400, 80);
    }

    // Animations
    for (const anim of animations) {
        ctx.globalAlpha = anim.alpha;
        ctx.fillStyle = anim.color;
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(anim.text, anim.x, anim.y);
    }
    ctx.globalAlpha = 1;
}

function drawButton(x, y, w, h, text, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 4);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Georgia';

    if (mood <= 0) {
        ctx.fillText('Britain has lost patience with you.', 400, 270);
    } else if (fleet.ships <= 0) {
        ctx.fillText('Your fleet has been lost.', 400, 270);
    } else {
        ctx.fillText('You have gone bankrupt.', 400, 270);
    }

    ctx.font = '16px Georgia';
    ctx.fillText(`Years survived: ${game.year - 1830}`, 400, 330);
    ctx.fillText(`Opium sold: ${totalOpiumSold} chests`, 400, 360);
    ctx.fillText(`Tea shipped: ${totalTeaShipped} chests`, 400, 390);
    ctx.fillText(`Silver earned: ${totalSilverEarned}`, 400, 420);

    ctx.font = '24px Georgia';
    ctx.fillText('Click to try again', 400, 500);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 150);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Georgia';
    ctx.fillText('You survived all 9 years of the opium trade.', 400, 200);

    // Statistics
    ctx.font = '16px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Total opium sold: ${totalOpiumSold} chests`, 250, 260);
    ctx.fillText(`Total tea shipped: ${totalTeaShipped} chests`, 250, 290);
    ctx.fillText(`Total silver earned: ${totalSilverEarned}`, 250, 320);
    ctx.fillText(`Ships lost: ${shipsLost}`, 250, 350);

    // Addiction statistic
    const addictions = Math.floor(totalOpiumSold * 50);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`Estimated Chinese addicted: ${addictions.toLocaleString()}`, 250, 400);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    const text1 = "The First Opium War (1839-1842) resulted from";
    const text2 = "conflicts just like these. Britain's victory forced China";
    const text3 = "to cede Hong Kong and open ports to foreign trade.";
    ctx.fillText(text1, 400, 460);
    ctx.fillText(text2, 400, 480);
    ctx.fillText(text3, 400, 500);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Georgia';
    ctx.fillText('Click to play again', 400, 560);
}

// Input
canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (game.state === 'menu') {
        game.state = 'playing';
        init();
        return;
    }

    if (game.state === 'gameover' || game.state === 'victory') {
        // Reset
        game.state = 'playing';
        game.year = 1830;
        game.tutorial = false;
        game.tutorialStep = 0;
        resources.silver = 500;
        resources.opium = 0;
        resources.tea = 0;
        fleet.ships = 1;
        fleet.activeShips = [];
        mood = 80;
        brideCards = 0;
        offers = [];
        clipperTimer = 60;
        teaShipped = 0;
        totalOpiumSold = 0;
        totalTeaShipped = 0;
        totalSilverEarned = 0;
        shipsLost = 0;
        for (const port of ports) port.risk = port.baseRisk;
        init();
        return;
    }

    if (game.state === 'playing') {
        // Opium buy buttons
        if (y >= 255 && y <= 275) {
            if (x >= 25 && x <= 60) buyOpium(5);
            else if (x >= 65 && x <= 100) buyOpium(10);
            else if (x >= 105 && x <= 140) buyOpium(15);
        }

        // Tea buy buttons
        if (y >= 395 && y <= 415) {
            if (x >= 25 && x <= 60) buyTea(5);
            else if (x >= 65 && x <= 100) buyTea(10);
            else if (x >= 105 && x <= 140) buyTea(15);
        }

        // Speed buttons
        if (y >= 558 && y <= 578) {
            if (x >= 700 && x <= 725) game.timeScale = 1;
            else if (x >= 730 && x <= 755) game.timeScale = 2;
            else if (x >= 760 && x <= 785) game.timeScale = 3;
        }

        // Offers
        for (const offer of offers) {
            const ox = offer.port.x;
            const oy = offer.port.y - 50;
            if (x >= ox - 45 && x <= ox + 45 && y >= oy - 30 && y <= oy + 25) {
                acceptOffer(offer);
                break;
            }
        }

        // Tutorial advance
        if (game.tutorial && game.tutorialStep < 3) {
            game.tutorialStep++;
        }
    }
});

// Game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
