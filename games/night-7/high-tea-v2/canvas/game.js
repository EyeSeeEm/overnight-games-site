// High Tea - Trading Strategy Game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game State
const GameState = { MENU: 0, PLAYING: 1, PAUSED: 2, EVENT: 3, VICTORY: 4, GAME_OVER: 5 };
let state = GameState.MENU;
let lastTime = 0;
let deltaTime = 0;
let gameSpeed = 1;

// Time
let currentYear = 1830;
let monthProgress = 0;
const MONTH_DURATION = 5; // seconds per month
let clipperTimer = 0;
const CLIPPER_INTERVAL = 60; // seconds between clippers

// Resources
let silver = 500;
let opium = 0;
let tea = 0;
let bribeCards = 0;
let totalOpiumSold = 0;
let totalTeaShipped = 0;
let totalFinesPaid = 0;

// Britain mood
let mood = 80;

// Quotas per year
const quotas = {
    1830: 60, 1831: 90, 1832: 120, 1833: 180, 1834: 250,
    1835: 320, 1836: 400, 1837: 500, 1838: 580, 1839: 660
};

// Prices
let opiumPrice = 25;
let teaPrice = 18;

// Ships
const MAX_SHIPS = 6;
let ships = [{ available: true, x: 0, y: 0, target: null, returning: false, cargo: 0, timer: 0 }];

// Ports
const ports = [
    { name: 'Lintin', x: 200, y: 250, risk: 1, baseRisk: 1 },
    { name: 'Whampoa', x: 350, y: 180, risk: 1.5, baseRisk: 1.5 },
    { name: 'Canton', x: 500, y: 220, risk: 2, baseRisk: 2 },
    { name: 'Macao', x: 280, y: 380, risk: 1.5, baseRisk: 1.5 },
    { name: 'Bocca Tigris', x: 600, y: 320, risk: 2.5, baseRisk: 2.5 }
];

// Offers
let offers = [];
let offerTimer = 0;
const OFFER_SPAWN_RATE = 8; // seconds - slower as per feedback
const OFFER_DURATION = 15; // seconds - longer duration

// Animations
let animations = [];
let notifications = [];

// Events
const historicalEvents = {
    1832: { title: 'Orders Drying Up', message: 'Chinese merchants are becoming cautious. Offers will be scarce for a while.' },
    1833: { title: 'Dealing Houses Merge', message: 'Bengal trading houses have consolidated. Opium prices soar!' },
    1836: { title: 'Commissioner Lin Appointed', message: 'Emperor Daoguang appoints Lin Zexu to end the opium trade. Risk increases!' },
    1839: { title: 'Lin Demands Surrender', message: 'Lin Zexu demands all foreign opium be surrendered. War is imminent!' }
};
let currentEvent = null;
let shownEvents = new Set();

// Input
const mouse = { x: 0, y: 0, down: false, clicked: false };

// Buttons
const buttons = {
    opium5: { x: 30, y: 180, w: 40, h: 25 },
    opium10: { x: 75, y: 180, w: 40, h: 25 },
    opium15: { x: 120, y: 180, w: 40, h: 25 },
    tea5: { x: 30, y: 300, w: 40, h: 25 },
    tea10: { x: 75, y: 300, w: 40, h: 25 },
    tea15: { x: 120, y: 300, w: 40, h: 25 },
    speed1: { x: 680, y: 560, w: 35, h: 25 },
    speed2: { x: 720, y: 560, w: 35, h: 25 },
    speed3: { x: 760, y: 560, w: 35, h: 25 }
};

function init() {
    setupInput();
}

function setupInput() {
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', () => {
        mouse.down = true;
        mouse.clicked = true;
    });

    canvas.addEventListener('mouseup', () => {
        mouse.down = false;
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if (state === GameState.PLAYING) state = GameState.PAUSED;
            else if (state === GameState.PAUSED) state = GameState.PLAYING;
        }
        if (e.key === '1') gameSpeed = 1;
        if (e.key === '2') gameSpeed = 2;
        if (e.key === '3') gameSpeed = 3;
    });
}

function resetGame() {
    currentYear = 1830;
    monthProgress = 0;
    clipperTimer = CLIPPER_INTERVAL;
    silver = 500;
    opium = 0;
    tea = 0;
    bribeCards = 0;
    mood = 80;
    totalOpiumSold = 0;
    totalTeaShipped = 0;
    totalFinesPaid = 0;
    ships = [{ available: true, x: 150, y: 450, target: null, returning: false, cargo: 0, timer: 0 }];
    offers = [];
    animations = [];
    notifications = [];
    shownEvents = new Set();
    ports.forEach(p => p.risk = p.baseRisk);
    updatePrices();
}

function updatePrices() {
    // Opium prices
    if (currentYear <= 1832) {
        opiumPrice = 20 + Math.floor(Math.random() * 15);
    } else if (currentYear <= 1834) {
        opiumPrice = 50 + Math.floor(Math.random() * 25);
    } else {
        opiumPrice = 80 + Math.floor(Math.random() * 40);
    }

    // Tea prices
    if (currentYear <= 1833) {
        teaPrice = 15 + Math.floor(Math.random() * 12);
    } else if (currentYear <= 1836) {
        teaPrice = 28 + Math.floor(Math.random() * 20);
    } else {
        teaPrice = 50 + Math.floor(Math.random() * 35);
    }
}

function update(dt) {
    if (state !== GameState.PLAYING) return;

    dt *= gameSpeed;

    // Time progression
    monthProgress += dt;
    if (monthProgress >= MONTH_DURATION) {
        monthProgress = 0;
        advanceMonth();
    }

    // Clipper timer
    clipperTimer -= dt;
    if (clipperTimer <= 0) {
        arriveClipper();
        clipperTimer = CLIPPER_INTERVAL;
    }

    // Mood decay
    if (mood < 100) {
        mood = Math.min(100, mood + 0.1 * dt);
    }

    // Spawn offers
    offerTimer -= dt;
    if (offerTimer <= 0) {
        spawnOffer();
        offerTimer = OFFER_SPAWN_RATE + Math.random() * 3;
    }

    // Update offers
    offers = offers.filter(o => {
        o.timer -= dt;
        return o.timer > 0;
    });

    // Update ships
    ships.forEach(ship => {
        if (!ship.available && ship.target) {
            ship.timer -= dt;

            // Animate ship position
            const targetX = ship.returning ? 150 : ship.target.x;
            const targetY = ship.returning ? 450 : ship.target.y;
            const dx = targetX - ship.x;
            const dy = targetY - ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                ship.x += (dx / dist) * 100 * dt;
                ship.y += (dy / dist) * 100 * dt;
            }

            if (ship.timer <= 0) {
                if (ship.returning) {
                    // Ship returned
                    ship.available = true;
                    ship.target = null;
                    ship.returning = false;
                    ship.x = 150;
                    ship.y = 450;
                } else {
                    // Arrived at port - risk check
                    completeTradeRoll(ship);
                }
            }
        }
    });

    // Update animations
    animations = animations.filter(a => {
        a.timer -= dt;
        a.y -= 30 * dt;
        return a.timer > 0;
    });

    // Update notifications
    notifications = notifications.filter(n => {
        n.timer -= dt;
        return n.timer > 0;
    });

    // Check lose conditions
    if (mood <= 0) {
        state = GameState.GAME_OVER;
    }
    if (silver <= 0 && opium === 0 && tea === 0 && ships.every(s => s.available)) {
        // Give emergency funds to prevent softlock
        silver = 100;
        addNotification('Emergency funds received!', '#4f4');
    }

    mouse.clicked = false;
}

function advanceMonth() {
    // Check for year change
    const oldYear = currentYear;

    // 12 months per year
    if (Math.random() < 0.0833) { // ~once per 12 months
        currentYear++;
        if (currentYear > 1839) {
            // Victory check
            state = GameState.VICTORY;
            return;
        }

        // Check for historical events
        if (historicalEvents[currentYear] && !shownEvents.has(currentYear)) {
            currentEvent = historicalEvents[currentYear];
            shownEvents.add(currentYear);
            state = GameState.EVENT;

            // Apply event effects
            if (currentYear === 1836) {
                ports.forEach(p => p.risk += 1);
            }
        }

        updatePrices();
    }

    // Decay port risk
    ports.forEach(p => {
        p.risk = Math.max(p.baseRisk, p.risk - 0.1);
    });

    // Random bribe card
    if (currentYear >= 1833 && Math.random() < 0.1) {
        bribeCards = Math.min(1, bribeCards + 1);
        addNotification('Bribe card acquired!', '#ffd700');
    }
}

function arriveClipper() {
    const quota = quotas[currentYear];
    const shipped = Math.min(tea, quota);

    if (shipped >= quota) {
        // Met quota
        mood = Math.min(100, mood + 15);
        addNotification(`Quota met! +1 Ship`, '#4f4');
        totalTeaShipped += shipped;
        tea -= shipped;

        // Add new ship
        if (ships.length < MAX_SHIPS) {
            ships.push({ available: true, x: 150, y: 450, target: null, returning: false, cargo: 0, timer: 0 });
        }
    } else if (shipped > 0) {
        // Partial shipment
        const shortfall = (quota - shipped) / quota;
        mood = Math.max(0, mood - Math.floor(shortfall * 20));
        totalTeaShipped += shipped;
        tea -= shipped;
        addNotification(`Shipped ${shipped}/${quota} tea. Mood -${Math.floor(shortfall * 20)}`, '#f84');
    } else {
        // No tea
        mood = Math.max(0, mood - 20);
        addNotification('No tea shipped! Mood -20', '#f44');
    }
}

function spawnOffer() {
    const port = ports[Math.floor(Math.random() * ports.length)];

    // Check if port already has an offer
    if (offers.some(o => o.port === port)) return;

    // Calculate offer based on port risk and year
    const baseQuantity = 10 + Math.floor(Math.random() * 20);
    const quantity = Math.floor(baseQuantity * (1 + port.risk * 0.2));
    const basePrice = opiumPrice + Math.floor(Math.random() * 20);
    const price = Math.floor(basePrice * (1 + port.risk * 0.15));

    offers.push({
        port,
        quantity,
        price,
        timer: OFFER_DURATION
    });
}

function completeTradeRoll(ship) {
    const port = ship.target;
    const cargo = ship.cargo;
    const value = ship.value;

    // Reduced early game risk (first 2 years near-zero capture)
    let captureChance = 0;
    if (currentYear <= 1831) {
        captureChance = 0.02 * port.risk; // Very low early game
    } else {
        captureChance = 0.05 + (port.risk - 1) * 0.1;
    }

    // Increase port risk
    port.risk = Math.min(5, port.risk + 0.3);

    if (Math.random() < captureChance) {
        // Captured!
        const roll = Math.random();
        if (roll < 0.6) {
            // Escaped - get partial value
            const escaped = Math.floor(value * 0.3);
            silver += escaped;
            addAnimation(ship.x, ship.y, `Escaped! +${escaped}`, '#ff8');
            addNotification('Ship escaped but lost most cargo!', '#f84');
        } else if (roll < 0.8) {
            // Bribed
            const fine = Math.floor(value * 0.25);
            silver += value - fine;
            totalFinesPaid += fine;
            addAnimation(ship.x, ship.y, `Fined ${fine}`, '#f84');
            addNotification('Bribed officials, fined ' + fine, '#f84');
        } else if (roll < 0.95) {
            // Confiscated
            addAnimation(ship.x, ship.y, 'Confiscated!', '#f44');
            addNotification('Cargo confiscated!', '#f44');
        } else {
            // Ship captured!
            if (ships.length > 1) {
                const idx = ships.indexOf(ship);
                ships.splice(idx, 1);
                addNotification('SHIP CAPTURED!', '#f44');
                return; // Ship is gone
            } else {
                // Can't lose last ship - downgrade to confiscation
                addAnimation(ship.x, ship.y, 'Confiscated!', '#f44');
                addNotification('Narrow escape! Cargo confiscated.', '#f44');
            }
        }
    } else {
        // Success!
        silver += value;
        totalOpiumSold += cargo;
        addAnimation(ship.x, ship.y, `+${value} Silver`, '#4f4');
    }

    // Ship returns
    ship.returning = true;
    ship.timer = 2;
}

function addAnimation(x, y, text, color) {
    animations.push({ x, y, text, color, timer: 2 });
}

function addNotification(text, color) {
    notifications.push({ text, color, timer: 4 });
}

function handleClick() {
    if (state === GameState.MENU) {
        resetGame();
        state = GameState.PLAYING;
        return;
    }

    if (state === GameState.EVENT) {
        state = GameState.PLAYING;
        currentEvent = null;
        return;
    }

    if (state === GameState.VICTORY || state === GameState.GAME_OVER) {
        state = GameState.MENU;
        return;
    }

    if (state !== GameState.PLAYING) return;

    // Check buy buttons
    if (clickInButton(buttons.opium5) && silver >= opiumPrice * 5) {
        buyOpium(5);
    } else if (clickInButton(buttons.opium10) && silver >= opiumPrice * 10) {
        buyOpium(10);
    } else if (clickInButton(buttons.opium15) && silver >= opiumPrice * 15) {
        buyOpium(15);
    } else if (clickInButton(buttons.tea5) && silver >= teaPrice * 5) {
        buyTea(5);
    } else if (clickInButton(buttons.tea10) && silver >= teaPrice * 10) {
        buyTea(10);
    } else if (clickInButton(buttons.tea15) && silver >= teaPrice * 15) {
        buyTea(15);
    }

    // Speed buttons
    if (clickInButton(buttons.speed1)) gameSpeed = 1;
    if (clickInButton(buttons.speed2)) gameSpeed = 2;
    if (clickInButton(buttons.speed3)) gameSpeed = 3;

    // Check offer clicks
    offers.forEach(offer => {
        const ox = offer.port.x - 40;
        const oy = offer.port.y - 60;
        if (mouse.x > ox && mouse.x < ox + 80 && mouse.y > oy && mouse.y < oy + 50) {
            acceptOffer(offer);
        }
    });
}

function clickInButton(btn) {
    return mouse.x > btn.x && mouse.x < btn.x + btn.w &&
           mouse.y > btn.y && mouse.y < btn.y + btn.h;
}

function buyOpium(amount) {
    const cost = opiumPrice * amount;
    if (silver >= cost) {
        silver -= cost;
        opium += amount;
        addAnimation(100, 160, `-${cost}`, '#f44');
    }
}

function buyTea(amount) {
    const cost = teaPrice * amount;
    if (silver >= cost) {
        silver -= cost;
        tea += amount;
        addAnimation(100, 280, `-${cost}`, '#f44');
    }
}

function acceptOffer(offer) {
    // Find available ship
    const ship = ships.find(s => s.available);
    if (!ship) {
        addNotification('No ships available!', '#f44');
        return;
    }

    // Check if we have enough opium
    if (opium < offer.quantity) {
        addNotification('Not enough opium!', '#f44');
        return;
    }

    // Send ship
    opium -= offer.quantity;
    ship.available = false;
    ship.target = offer.port;
    ship.cargo = offer.quantity;
    ship.value = offer.quantity * offer.price;
    ship.timer = 3; // Travel time
    ship.returning = false;

    // Remove offer
    const idx = offers.indexOf(offer);
    if (idx >= 0) offers.splice(idx, 1);

    addNotification(`Ship sent to ${offer.port.name}`, '#4af');
}

function render() {
    // Background
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === GameState.MENU) {
        renderMenu();
        return;
    }

    // Map area
    ctx.fillStyle = '#8cb4d4';
    ctx.fillRect(170, 100, 460, 350);

    // Land masses
    ctx.fillStyle = '#7a9b65';
    ctx.beginPath();
    ctx.moveTo(170, 100);
    ctx.lineTo(300, 100);
    ctx.lineTo(250, 180);
    ctx.lineTo(170, 150);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(450, 100);
    ctx.lineTo(630, 100);
    ctx.lineTo(630, 200);
    ctx.lineTo(550, 250);
    ctx.lineTo(480, 180);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(170, 350);
    ctx.lineTo(350, 300);
    ctx.lineTo(400, 380);
    ctx.lineTo(170, 450);
    ctx.fill();

    // Ports
    ports.forEach(port => {
        // Port marker
        ctx.fillStyle = '#4a3020';
        ctx.beginPath();
        ctx.arc(port.x, port.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Port name
        ctx.fillStyle = '#fff';
        ctx.font = '10px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y + 25);

        // Risk indicator
        const riskBars = Math.min(5, Math.floor(port.risk));
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i < riskBars ? (i >= 3 ? '#f44' : '#fa0') : '#555';
            ctx.fillRect(port.x - 15 + i * 7, port.y - 25, 5, 8);
        }
    });

    // Offers
    offers.forEach(offer => {
        const x = offer.port.x - 40;
        const y = offer.port.y - 70;

        // Bubble
        ctx.fillStyle = 'rgba(255,255,240,0.95)';
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, 80, 55, 5);
        ctx.fill();
        ctx.stroke();

        // Content
        ctx.fillStyle = '#333';
        ctx.font = 'bold 11px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`${offer.quantity} chests`, x + 40, y + 15);
        ctx.fillText(`@ ${offer.price} silver`, x + 40, y + 30);

        // Timer bar
        const timerPercent = offer.timer / OFFER_DURATION;
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x + 5, y + 40, 70, 6);
        ctx.fillStyle = timerPercent > 0.3 ? '#4a4' : '#a44';
        ctx.fillRect(x + 5, y + 40, 70 * timerPercent, 6);
    });

    // Ships
    ships.forEach((ship, i) => {
        if (ship.available) {
            // Docked ships
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.moveTo(150 + i * 30, 460);
            ctx.lineTo(145 + i * 30, 475);
            ctx.lineTo(165 + i * 30, 475);
            ctx.lineTo(160 + i * 30, 460);
            ctx.fill();

            // Sail
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(152 + i * 30, 445);
            ctx.lineTo(152 + i * 30, 460);
            ctx.lineTo(162 + i * 30, 455);
            ctx.fill();
        } else {
            // Sailing ship
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.moveTo(ship.x, ship.y);
            ctx.lineTo(ship.x - 8, ship.y + 12);
            ctx.lineTo(ship.x + 12, ship.y + 12);
            ctx.lineTo(ship.x + 8, ship.y);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(ship.x, ship.y - 15);
            ctx.lineTo(ship.x, ship.y);
            ctx.lineTo(ship.x + 10, ship.y - 5);
            ctx.fill();
        }
    });

    // Left panel - Opium
    ctx.fillStyle = '#f5f0e0';
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, 110, 145, 110, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a3020';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY OPIUM', 92, 130);

    ctx.font = '12px Georgia';
    ctx.fillText(`Price: ${opiumPrice} silver`, 92, 150);
    ctx.fillText(`Stock: ${opium} chests`, 92, 168);

    // Buy buttons
    drawButton(buttons.opium5, '5', silver >= opiumPrice * 5);
    drawButton(buttons.opium10, '10', silver >= opiumPrice * 10);
    drawButton(buttons.opium15, '15', silver >= opiumPrice * 15);

    // Left panel - Tea
    ctx.fillStyle = '#f5f0e0';
    ctx.beginPath();
    ctx.roundRect(20, 230, 145, 110, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a3020';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText('BUY TEA', 92, 250);

    ctx.font = '12px Georgia';
    ctx.fillText(`Price: ${teaPrice} silver`, 92, 270);
    ctx.fillText(`Stock: ${tea} chests`, 92, 288);

    drawButton(buttons.tea5, '5', silver >= teaPrice * 5);
    drawButton(buttons.tea10, '10', silver >= teaPrice * 10);
    drawButton(buttons.tea15, '15', silver >= teaPrice * 15);

    // Fleet panel
    ctx.fillStyle = '#f5f0e0';
    ctx.beginPath();
    ctx.roundRect(20, 350, 145, 80, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4a3020';
    ctx.font = 'bold 14px Georgia';
    ctx.fillText(`SHIPS: ${ships.filter(s => s.available).length}/${ships.length}`, 92, 370);

    ctx.font = '12px Georgia';
    ctx.fillText(`Bribe Cards: ${bribeCards}`, 92, 395);

    // Top bar
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, canvas.width, 40);

    // Year
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Year: ${currentYear}`, 20, 28);

    // Mood bar
    ctx.fillStyle = '#333';
    ctx.fillRect(200, 12, 150, 20);
    const moodColor = mood > 60 ? '#4a4' : mood > 30 ? '#aa4' : '#a44';
    ctx.fillStyle = moodColor;
    ctx.fillRect(200, 12, 150 * (mood / 100), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(200, 12, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Britain: ${Math.floor(mood)}%`, 275, 26);

    // Silver
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`Silver: ${silver}`, canvas.width - 20, 28);

    // Bottom panel - Clipper
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 460, canvas.width, 140);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`TEA CLIPPER ARRIVING IN: ${Math.ceil(clipperTimer)}s`, canvas.width / 2, 490);

    const quota = quotas[currentYear];
    ctx.font = '12px Georgia';
    ctx.fillText(`Quota: ${quota} chests | Your Tea: ${tea} chests`, canvas.width / 2, 515);

    // Quota progress bar
    const quotaPercent = Math.min(1, tea / quota);
    ctx.fillStyle = '#333';
    ctx.fillRect(250, 525, 300, 15);
    ctx.fillStyle = quotaPercent >= 1 ? '#4a4' : '#886';
    ctx.fillRect(250, 525, 300 * quotaPercent, 15);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(250, 525, 300, 15);

    // Speed controls
    ctx.fillStyle = '#fff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Speed:', 640, 578);

    drawButton(buttons.speed1, '1x', true, gameSpeed === 1);
    drawButton(buttons.speed2, '2x', true, gameSpeed === 2);
    drawButton(buttons.speed3, '3x', true, gameSpeed === 3);

    // Animations
    animations.forEach(a => {
        ctx.fillStyle = a.color;
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.globalAlpha = a.timer / 2;
        ctx.fillText(a.text, a.x, a.y);
        ctx.globalAlpha = 1;
    });

    // Notifications
    notifications.forEach((n, i) => {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(canvas.width / 2 - 150, 50 + i * 30, 300, 25);
        ctx.fillStyle = n.color;
        ctx.font = '12px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(n.text, canvas.width / 2, 67 + i * 30);
    });

    // Event overlay
    if (state === GameState.EVENT && currentEvent) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f5f0e0';
        ctx.beginPath();
        ctx.roundRect(150, 180, 500, 200, 10);
        ctx.fill();

        ctx.fillStyle = '#4a3020';
        ctx.font = 'bold 24px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(currentEvent.title, canvas.width / 2, 230);

        ctx.font = '14px Georgia';
        wrapText(ctx, currentEvent.message, canvas.width / 2, 280, 450, 20);

        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.roundRect(350, 340, 100, 30, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Georgia';
        ctx.fillText('Continue', 400, 360);
    }

    // Victory
    if (state === GameState.VICTORY) {
        ctx.fillStyle = 'rgba(0,50,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width / 2, 100);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Georgia';
        ctx.fillText('You survived the opium trade era.', canvas.width / 2, 150);

        ctx.font = '14px Georgia';
        ctx.fillText(`Total Opium Sold: ${totalOpiumSold} chests`, canvas.width / 2, 220);
        ctx.fillText(`Total Tea Shipped: ${totalTeaShipped} chests`, canvas.width / 2, 250);
        ctx.fillText(`Total Fines Paid: ${totalFinesPaid} silver`, canvas.width / 2, 280);

        const addictions = Math.floor(totalOpiumSold * 12.5);
        ctx.fillStyle = '#f44';
        ctx.fillText(`Estimated Chinese Addicted: ${addictions.toLocaleString()}`, canvas.width / 2, 330);

        ctx.fillStyle = '#aaa';
        ctx.font = '12px Georgia';
        wrapText(ctx, 'Your trading contributed to the conditions that sparked the First Opium War (1839-1842).', canvas.width / 2, 380, 500, 18);

        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 18px Georgia';
        ctx.fillText('Click to return to menu', canvas.width / 2, 450);
    }

    // Game Over
    if (state === GameState.GAME_OVER) {
        ctx.fillStyle = 'rgba(50,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f44';
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, 200);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Georgia';
        if (mood <= 0) {
            ctx.fillText('Britain has lost patience. You are ruined.', canvas.width / 2, 280);
        } else if (ships.length === 0) {
            ctx.fillText('Your fleet is lost. Your empire collapses.', canvas.width / 2, 280);
        } else {
            ctx.fillText('You have gone bankrupt.', canvas.width / 2, 280);
        }

        ctx.font = '14px Georgia';
        ctx.fillText(`Survived until: ${currentYear}`, canvas.width / 2, 340);

        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 18px Georgia';
        ctx.fillText('Click to return to menu', canvas.width / 2, 420);
    }

    // Paused
    if (state === GameState.PAUSED) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        ctx.font = '18px Georgia';
        ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 40);
    }
}

function renderMenu() {
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('HIGH TEA', canvas.width / 2, 120);

    ctx.fillStyle = '#c4a080';
    ctx.font = '18px Georgia';
    ctx.fillText('A Historical Trading Strategy Game', canvas.width / 2, 160);

    // Description
    ctx.fillStyle = '#a89070';
    ctx.font = '14px Georgia';
    wrapText(ctx, 'The year is 1830. Britain is addicted to tea, but China only accepts silver. Your solution? Trade opium.', canvas.width / 2, 220, 500, 20);

    // Instructions
    ctx.fillStyle = '#8a7060';
    ctx.font = '12px Georgia';
    const instructions = [
        '- Buy opium from Bengal',
        '- Sell it at Chinese ports for silver',
        '- Buy tea with your profits',
        '- Ship tea to Britain to meet quotas',
        '- Survive 9 years until 1839'
    ];
    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 300 + i * 25);
    });

    // Controls
    ctx.fillStyle = '#6a5040';
    ctx.fillText('Controls: Click to interact | 1/2/3 for speed | ESC to pause', canvas.width / 2, 460);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Georgia';
    ctx.fillText('Click to Start', canvas.width / 2, 530);
}

function drawButton(btn, text, enabled, selected = false) {
    ctx.fillStyle = selected ? '#4a8' : enabled ? '#8b4513' : '#555';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 3);
    ctx.fill();

    ctx.fillStyle = enabled ? '#fff' : '#888';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 4);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

function gameLoop(time) {
    deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (mouse.clicked) {
        handleClick();
        mouse.clicked = false;
    }

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
init();
requestAnimationFrame(gameLoop);
