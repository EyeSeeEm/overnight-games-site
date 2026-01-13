// High Tea - Trading Strategy Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'menu';
let gamePaused = true;
let gameSpeed = 1;

// Resources
let silver = 500;
let opium = 0;
let tea = 0;

// Ships
let ships = [];
let maxShips = 6;

// Ports
const PORTS = [
    { name: 'Lintin', x: 100, y: 80, risk: 1, priceBonus: 0.9 },
    { name: 'Whampoa', x: 250, y: 150, risk: 2, priceBonus: 1.0 },
    { name: 'Canton', x: 350, y: 200, risk: 3, priceBonus: 1.15 },
    { name: 'Macao', x: 150, y: 280, risk: 2, priceBonus: 1.05 },
    { name: 'Bocca Tigris', x: 400, y: 100, risk: 4, priceBonus: 1.25 }
];

// Offers
let activeOffers = [];
let offerSpawnTimer = 0;
const OFFER_SPAWN_INTERVAL = 5000; // 5 seconds base
const OFFER_DURATION = 12000; // 12 seconds

// Prices
let opiumPrice = 25;
let teaPrice = 18;
let opiumBasePrice = 25;
let teaBasePrice = 18;

// Campaign
let currentYear = 1830;
const YEARS = [
    { year: 1830, quota: 60, clipperTime: 60 },
    { year: 1831, quota: 90, clipperTime: 55 },
    { year: 1832, quota: 120, clipperTime: 55 },
    { year: 1833, quota: 180, clipperTime: 50 },
    { year: 1834, quota: 250, clipperTime: 50 },
    { year: 1835, quota: 320, clipperTime: 45 },
    { year: 1836, quota: 400, clipperTime: 45 },
    { year: 1837, quota: 500, clipperTime: 40 },
    { year: 1838, quota: 580, clipperTime: 40 },
    { year: 1839, quota: 660, clipperTime: 35 }
];
let yearIndex = 0;
let clipperTimer = 60;
let teaShippedThisYear = 0;

// Mood (Britain's satisfaction)
let mood = 80;

// Stats
let stats = {
    totalOpiumSold: 0,
    totalTeaShipped: 0,
    totalSilverEarned: 0,
    shipsLost: 0,
    tradesCompleted: 0
};

// Trade popups
let tradePopups = [];

// Initialize game
function initGame() {
    silver = 500;
    opium = 0;
    tea = 0;
    mood = 80;
    yearIndex = 0;
    currentYear = YEARS[0].year;
    clipperTimer = YEARS[0].clipperTime;
    teaShippedThisYear = 0;

    ships = [{ state: 'available', destination: null, cargo: 0, progress: 0 }];
    activeOffers = [];
    tradePopups = [];

    stats = {
        totalOpiumSold: 0,
        totalTeaShipped: 0,
        totalSilverEarned: 0,
        shipsLost: 0,
        tradesCompleted: 0
    };

    updatePrices();
    setNews('Welcome to the Pearl River Delta. Britain demands tea.');
}

// Update prices based on year and demand
function updatePrices() {
    const yearMod = 1 + (currentYear - 1830) * 0.08;
    const opiumMod = currentYear >= 1833 ? 1.5 : 1.0;

    opiumPrice = Math.round(opiumBasePrice * yearMod * opiumMod * (0.9 + Math.random() * 0.2));
    teaPrice = Math.round(teaBasePrice * yearMod * (0.9 + Math.random() * 0.2));
}

// Generate new offer
function spawnOffer() {
    if (activeOffers.length >= 3) return;

    const port = PORTS[Math.floor(Math.random() * PORTS.length)];
    const quantity = Math.floor(5 + Math.random() * 25);
    const pricePerChest = Math.round((40 + Math.random() * 40) * port.priceBonus);

    const offer = {
        id: Date.now(),
        port,
        quantity,
        pricePerChest,
        timeLeft: OFFER_DURATION,
        x: port.x,
        y: port.y
    };

    activeOffers.push(offer);
}

// Accept offer
function acceptOffer(offer) {
    // Find available ship
    const ship = ships.find(s => s.state === 'available');
    if (!ship) {
        setNews('No ships available!');
        return false;
    }

    // Check if we have enough opium
    if (opium < offer.quantity) {
        setNews('Not enough opium in stock!');
        return false;
    }

    // Send ship
    opium -= offer.quantity;
    ship.state = 'en-route';
    ship.destination = offer.port;
    ship.cargo = offer.quantity;
    ship.cargoValue = offer.quantity * offer.pricePerChest;
    ship.progress = 0;
    ship.travelTime = 3000; // 3 seconds

    // Remove offer
    activeOffers = activeOffers.filter(o => o.id !== offer.id);

    setNews(`Ship sent to ${offer.port.name} with ${offer.quantity} chests.`);
    return true;
}

// Ship arrives at destination
function shipArrives(ship) {
    const port = ship.destination;
    const riskLevel = port.risk + (currentYear >= 1836 ? 1 : 0);

    // Calculate capture chance (reduced in early years)
    let captureChance = riskLevel * 0.05;
    if (currentYear <= 1832) captureChance *= 0.2; // 80% reduction early game

    const roll = Math.random();

    if (roll < captureChance * 0.1) {
        // Ship captured (rare)
        ship.state = 'captured';
        ships = ships.filter(s => s !== ship);
        stats.shipsLost++;
        showTradePopup('SHIP CAPTURED!', `Lost ship and ${ship.cargo} chests of opium.`, false);
        setNews('DISASTER! Ship captured by authorities!');

        // Check game over
        if (ships.length === 0) {
            gameOver('All ships lost!');
        }
    } else if (roll < captureChance * 0.5) {
        // Cargo confiscated
        showTradePopup('Cargo Confiscated', `Authorities seized your opium. Ship returns empty.`, false);
        setNews('Authorities confiscated the cargo.');
        ship.state = 'available';
        ship.destination = null;
    } else if (roll < captureChance) {
        // Bribed/fined - partial payment
        const fine = Math.floor(ship.cargoValue * (0.1 + Math.random() * 0.2));
        const profit = ship.cargoValue - fine;
        silver += Math.max(profit, Math.floor(ship.cargoValue * 0.3)); // At least 30%
        stats.totalOpiumSold += ship.cargo;
        stats.totalSilverEarned += profit;
        stats.tradesCompleted++;
        showTradePopup('Bribed Officials', `Paid ${fine} silver in bribes. Profit: ${profit}`, true);
        setNews(`Bribed officials. Earned ${profit} silver.`);
        ship.state = 'available';
        ship.destination = null;
    } else {
        // Success!
        silver += ship.cargoValue;
        stats.totalOpiumSold += ship.cargo;
        stats.totalSilverEarned += ship.cargoValue;
        stats.tradesCompleted++;
        showTradePopup('Trade Successful!', `Sold ${ship.cargo} chests for ${ship.cargoValue} silver!`, true);
        setNews(`Successful trade! Earned ${ship.cargoValue} silver.`);
        ship.state = 'available';
        ship.destination = null;
    }
}

// Buy resource
function buyResource(resource, amount) {
    const price = resource === 'opium' ? opiumPrice : teaPrice;
    const cost = price * amount;

    if (silver < cost) {
        setNews('Not enough silver!');
        return false;
    }

    silver -= cost;

    if (resource === 'opium') {
        opium += amount;
        setNews(`Bought ${amount} opium for ${cost} silver.`);
    } else {
        tea += amount;
        setNews(`Bought ${amount} tea for ${cost} silver.`);
    }

    // Price spike from purchase
    if (resource === 'opium') {
        opiumPrice = Math.min(opiumPrice + Math.floor(amount * 0.2), 150);
    } else {
        teaPrice = Math.min(teaPrice + Math.floor(amount * 0.15), 100);
    }

    return true;
}

// Clipper arrives - ship tea
function clipperArrives() {
    const quota = YEARS[yearIndex].quota;
    const shipped = Math.min(tea, quota);

    if (shipped > 0) {
        tea -= shipped;
        teaShippedThisYear += shipped;
        stats.totalTeaShipped += shipped;
    }

    if (teaShippedThisYear >= quota) {
        // Met quota!
        mood = Math.min(100, mood + 15);
        showTradePopup('Quota Met!', `Shipped ${teaShippedThisYear} tea. Britain is pleased!`, true);
        setNews('Excellent! Britain\'s tea demand satisfied. New ship awarded!');

        // Award new ship
        if (ships.length < maxShips) {
            ships.push({ state: 'available', destination: null, cargo: 0, progress: 0 });
        }

        // Next year
        nextYear();
    } else if (teaShippedThisYear > 0) {
        // Partial shipment
        const shortfall = quota - teaShippedThisYear;
        mood = Math.max(0, mood - Math.floor(shortfall / quota * 30));
        showTradePopup('Partial Shipment', `Only ${teaShippedThisYear}/${quota} tea shipped. Britain is disappointed.`, false);
        setNews(`Britain disappointed. Only ${teaShippedThisYear} of ${quota} tea shipped.`);
        nextYear();
    } else {
        // No tea shipped
        mood = Math.max(0, mood - 25);
        showTradePopup('No Tea Shipped!', 'Britain is furious!', false);
        setNews('No tea shipped! Britain\'s patience wears thin.');
        nextYear();
    }

    // Check mood
    if (mood <= 0) {
        gameOver('Britain has lost all patience. Your trading license is revoked.');
    }
}

// Advance to next year
function nextYear() {
    yearIndex++;

    if (yearIndex >= YEARS.length) {
        victory();
        return;
    }

    currentYear = YEARS[yearIndex].year;
    clipperTimer = YEARS[yearIndex].clipperTime;
    teaShippedThisYear = 0;

    // Update prices for new year
    updatePrices();

    // Historical events
    if (currentYear === 1833) {
        setNews('NEWS: Trading houses merge! Opium prices soar!');
        opiumPrice = Math.floor(opiumPrice * 1.5);
    } else if (currentYear === 1836) {
        setNews('NEWS: Commissioner Lin appointed. Crackdowns increase!');
        PORTS.forEach(p => p.risk = Math.min(5, p.risk + 1));
    }
}

// Show trade popup
function showTradePopup(title, message, success) {
    tradePopups.push({
        title,
        message,
        success,
        time: 2500
    });
}

// Set news ticker
function setNews(text) {
    document.getElementById('news-ticker').textContent = text;
}

// Victory
function victory() {
    gameState = 'victory';
    gamePaused = true;
    document.getElementById('victory-stats').innerHTML = `
        Years Survived: ${currentYear - 1830 + 1}<br>
        Total Tea Shipped: ${stats.totalTeaShipped}<br>
        Total Opium Sold: ${stats.totalOpiumSold}<br>
        Silver Earned: ${stats.totalSilverEarned}<br>
        Ships Lost: ${stats.shipsLost}<br>
        Trades Completed: ${stats.tradesCompleted}<br><br>
        <em>Your trading fueled approximately ${Math.floor(stats.totalOpiumSold * 3.5)} opium addictions.</em>
    `;
    document.getElementById('victory-overlay').classList.remove('hidden');
}

// Game over
function gameOver(reason) {
    gameState = 'gameover';
    gamePaused = true;
    document.getElementById('fail-stats').innerHTML = `
        ${reason}<br><br>
        Year Reached: ${currentYear}<br>
        Tea Shipped: ${stats.totalTeaShipped}<br>
        Opium Sold: ${stats.totalOpiumSold}<br>
        Ships Lost: ${stats.shipsLost}
    `;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

// Update HUD
function updateHUD() {
    document.getElementById('year-display').textContent = currentYear;
    document.getElementById('silver-display').textContent = silver;
    document.getElementById('opium-price').textContent = opiumPrice;
    document.getElementById('tea-price').textContent = teaPrice;
    document.getElementById('opium-stock').textContent = opium;
    document.getElementById('tea-stock').textContent = tea;

    // Mood bar
    const moodFill = document.getElementById('mood-fill');
    moodFill.style.width = `${mood}%`;
    if (mood > 60) {
        moodFill.style.background = 'linear-gradient(90deg, #4a4, #6c6)';
    } else if (mood > 30) {
        moodFill.style.background = 'linear-gradient(90deg, #aa4, #cc6)';
    } else {
        moodFill.style.background = 'linear-gradient(90deg, #a44, #c66)';
    }

    // Quota
    const quota = YEARS[yearIndex].quota;
    document.getElementById('quota-current').textContent = teaShippedThisYear;
    document.getElementById('quota-target').textContent = quota;
    document.getElementById('quota-fill').style.width = `${Math.min(100, (teaShippedThisYear / quota) * 100)}%`;
    document.getElementById('timer-value').textContent = Math.ceil(clipperTimer);

    // Ships
    const shipsEl = document.getElementById('ship-icons');
    shipsEl.innerHTML = ships.map(s =>
        `<span class="ship-icon ${s.state}">${s.state === 'available' ? '⛵' : '🚢'}</span>`
    ).join('');

    // Update buy buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
        const resource = btn.dataset.resource;
        const amount = parseInt(btn.dataset.amount);
        const price = resource === 'opium' ? opiumPrice : teaPrice;
        btn.disabled = silver < price * amount;
    });
}

// Render map
function render() {
    // Clear
    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw water pattern
    ctx.fillStyle = '#2a3a4a';
    for (let i = 0; i < 20; i++) {
        const x = (i * 50 + Date.now() * 0.01) % (canvas.width + 100) - 50;
        ctx.fillRect(x, i * 20, 30, 2);
    }

    // Draw land masses
    ctx.fillStyle = '#5a4a3a';
    ctx.beginPath();
    ctx.ellipse(480, 350, 100, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(50, 100, 80, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw ports
    for (const port of PORTS) {
        // Port marker
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.arc(port.x, port.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Risk indicator
        ctx.fillStyle = port.risk >= 4 ? '#a44' : port.risk >= 2 ? '#aa4' : '#4a4';
        ctx.fillRect(port.x - 12, port.y + 20, port.risk * 5, 4);

        // Port name
        ctx.fillStyle = '#e8d4a8';
        ctx.font = '10px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y + 35);
    }

    // Draw ships en route
    for (const ship of ships) {
        if (ship.state === 'en-route' && ship.destination) {
            const startX = 50;
            const startY = 380;
            const progress = ship.progress / ship.travelTime;
            const x = startX + (ship.destination.x - startX) * progress;
            const y = startY + (ship.destination.y - startY) * progress;

            ctx.fillStyle = '#e8d4a8';
            ctx.font = '16px Arial';
            ctx.fillText('⛵', x - 8, y + 5);
        }
    }

    updateHUD();
}

// Render offers
function renderOffers() {
    // Remove old offer elements
    document.querySelectorAll('.offer-popup').forEach(el => el.remove());

    // Create new offer elements
    for (const offer of activeOffers) {
        const el = document.createElement('div');
        el.className = 'offer-popup';
        el.style.left = `${150 + offer.x}px`;
        el.style.top = `${60 + offer.y - 60}px`;
        el.innerHTML = `
            <div class="offer-port">${offer.port.name}</div>
            <div class="offer-details">${offer.quantity} chests @ ${offer.pricePerChest}/ea</div>
            <div class="offer-details">Total: ${offer.quantity * offer.pricePerChest}</div>
            <div class="offer-risk">Risk: ${'█'.repeat(offer.port.risk)}${'░'.repeat(5 - offer.port.risk)}</div>
        `;
        el.addEventListener('click', () => acceptOffer(offer));
        document.getElementById('game-container').appendChild(el);
    }
}

// Render trade popups
function renderTradePopups() {
    document.querySelectorAll('.trade-popup').forEach(el => el.remove());

    if (tradePopups.length > 0) {
        const popup = tradePopups[0];
        const el = document.createElement('div');
        el.className = `trade-popup ${popup.success ? 'trade-success' : 'trade-fail'}`;
        el.innerHTML = `<strong>${popup.title}</strong><br>${popup.message}`;
        document.getElementById('game-container').appendChild(el);
    }
}

// Game update
function update(dt) {
    if (gameState !== 'playing' || gamePaused) return;

    const scaledDt = dt * gameSpeed;

    // Update clipper timer
    clipperTimer -= scaledDt / 1000;
    if (clipperTimer <= 0) {
        clipperArrives();
    }

    // Update offer spawn
    offerSpawnTimer -= scaledDt;
    if (offerSpawnTimer <= 0) {
        offerSpawnTimer = OFFER_SPAWN_INTERVAL / gameSpeed;
        spawnOffer();
    }

    // Update offer timers
    activeOffers = activeOffers.filter(offer => {
        offer.timeLeft -= scaledDt;
        return offer.timeLeft > 0;
    });

    // Update ship progress
    for (const ship of ships) {
        if (ship.state === 'en-route') {
            ship.progress += scaledDt;
            if (ship.progress >= ship.travelTime) {
                shipArrives(ship);
            }
        }
    }

    // Update trade popups
    if (tradePopups.length > 0) {
        tradePopups[0].time -= scaledDt;
        if (tradePopups[0].time <= 0) {
            tradePopups.shift();
        }
    }

    // Mood decay
    if (mood < 50) {
        mood = Math.max(0, mood - 0.001 * scaledDt);
    }

    // Check bankruptcy
    if (silver <= 0 && opium <= 0 && tea <= 0 && ships.every(s => s.state === 'available')) {
        gameOver('Bankruptcy! You cannot afford to continue trading.');
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    render();
    renderOffers();
    renderTradePopups();

    requestAnimationFrame(gameLoop);
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('menu-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('gameover-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('victory-restart-btn').addEventListener('click', () => {
    document.getElementById('victory-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

// Buy buttons
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        buyResource(btn.dataset.resource, parseInt(btn.dataset.amount));
    });
});

// Speed controls
document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        gameSpeed = parseInt(btn.dataset.speed);
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Start game loop
requestAnimationFrame(gameLoop);

// Harness interface
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: async (action, durationMs) => {
        gamePaused = false;

        if (action.buy) {
            buyResource(action.buy.resource, action.buy.amount);
        }

        if (action.acceptOffer && activeOffers.length > 0) {
            acceptOffer(activeOffers[0]);
        }

        if (action.click) {
            // Check if clicking on offer
            for (const offer of activeOffers) {
                const offerLeft = 150 + offer.x;
                const offerTop = 60 + offer.y - 60;
                if (action.click.x >= offerLeft && action.click.x <= offerLeft + 100 &&
                    action.click.y >= offerTop && action.click.y <= offerTop + 80) {
                    acceptOffer(offer);
                    break;
                }
            }
        }

        await new Promise(r => setTimeout(r, durationMs));
        gamePaused = true;
    },

    getState: () => ({
        gameState,
        year: currentYear,
        silver,
        opium,
        tea,
        mood,
        ships: ships.map(s => ({ state: s.state, cargo: s.cargo })),
        availableShips: ships.filter(s => s.state === 'available').length,
        activeOffers: activeOffers.map(o => ({
            port: o.port.name,
            quantity: o.quantity,
            price: o.pricePerChest,
            total: o.quantity * o.pricePerChest
        })),
        clipperTimer,
        quota: YEARS[yearIndex].quota,
        teaShipped: teaShippedThisYear,
        stats,
        opiumPrice,
        teaPrice
    }),

    getPhase: () => gameState,

    debug: {
        setSilver: (amount) => { silver = amount; },
        forceStart: () => {
            document.getElementById('menu-overlay').classList.add('hidden');
            document.getElementById('gameover-overlay').classList.add('hidden');
            document.getElementById('victory-overlay').classList.add('hidden');
            gameState = 'playing';
            gamePaused = false;
            initGame();
        },
        addShip: () => {
            if (ships.length < maxShips) {
                ships.push({ state: 'available', destination: null, cargo: 0, progress: 0 });
            }
        },
        skipYear: () => { nextYear(); },
        spawnOffer: () => { spawnOffer(); }
    }
};
