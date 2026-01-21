// High Tea - PixiJS
// Historical trading strategy game about British opium trade

const app = new PIXI.Application({
    width: 900,
    height: 650,
    backgroundColor: 0x1a1510,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Game constants
const PORTS = [
    { name: 'Lintin Island', x: 320, y: 200, risk: 1, baseOffer: 10 },
    { name: 'Whampoa', x: 480, y: 280, risk: 2, baseOffer: 15 },
    { name: 'Canton', x: 550, y: 180, risk: 3, baseOffer: 25 },
    { name: 'Macao', x: 280, y: 350, risk: 2, baseOffer: 15 },
    { name: 'Bocca Tigris', x: 420, y: 380, risk: 4, baseOffer: 35 }
];

// Game state
const gameState = {
    phase: 'menu', // menu, playing, paused, gameover, victory
    year: 1830,
    month: 1,
    maxYear: 1839,
    silver: 500,
    opium: 0,
    tea: 0,
    ships: 1,
    maxShips: 6,
    shipsAvailable: 1,
    brideCards: 0,
    mood: 80,
    quota: 60,
    teaShipped: 0,
    clipperTimer: 60,
    clipperInterval: 60,
    timeSpeed: 1,
    totalOpiumSold: 0,
    totalTeaShipped: 0,
    totalSilverEarned: 0
};

// Prices
const prices = {
    opium: 25,
    tea: 18
};

// Active port offers
const portOffers = [];

// Active ships en route
const shipsEnRoute = [];

// Containers
const mapContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();
const offerContainer = new PIXI.Container();
const shipContainer = new PIXI.Container();
const notificationContainer = new PIXI.Container();

app.stage.addChild(mapContainer);
app.stage.addChild(shipContainer);
app.stage.addChild(offerContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(notificationContainer);
app.stage.addChild(menuContainer);

// Draw map background
function drawMap() {
    // Sea background
    const sea = new PIXI.Graphics();
    sea.beginFill(0x2a4a5a);
    sea.drawRect(200, 100, 500, 400);
    sea.endFill();
    mapContainer.addChild(sea);

    // Land masses
    const land = new PIXI.Graphics();
    land.beginFill(0x5a4a30);
    // Main China coast
    land.moveTo(200, 100);
    land.lineTo(700, 100);
    land.lineTo(700, 150);
    land.lineTo(600, 180);
    land.lineTo(550, 150);
    land.lineTo(500, 170);
    land.lineTo(400, 140);
    land.lineTo(300, 160);
    land.lineTo(200, 140);
    land.closePath();
    // Delta area
    land.moveTo(500, 250);
    land.lineTo(580, 220);
    land.lineTo(620, 280);
    land.lineTo(550, 320);
    land.lineTo(480, 280);
    land.closePath();
    land.endFill();
    mapContainer.addChild(land);

    // Title
    const mapTitle = new PIXI.Text('Pearl River Delta', {
        fontSize: 20, fill: 0xd4c4a0, fontStyle: 'italic'
    });
    mapTitle.x = 380;
    mapTitle.y = 105;
    mapContainer.addChild(mapTitle);

    // Draw ports
    PORTS.forEach(port => {
        const portG = new PIXI.Graphics();
        portG.beginFill(0x804020);
        portG.drawCircle(port.x, port.y, 15);
        portG.endFill();
        portG.beginFill(0xc0a060);
        portG.drawCircle(port.x, port.y, 10);
        portG.endFill();
        mapContainer.addChild(portG);

        const label = new PIXI.Text(port.name, {
            fontSize: 12, fill: 0xd4c4a0
        });
        label.x = port.x - label.width / 2;
        label.y = port.y + 18;
        mapContainer.addChild(label);

        // Risk indicator
        const riskLabel = new PIXI.Text('Risk: ' + '\u2605'.repeat(port.risk), {
            fontSize: 10, fill: port.risk >= 3 ? 0xFF6060 : 0xFFFF80
        });
        riskLabel.x = port.x - riskLabel.width / 2;
        riskLabel.y = port.y + 32;
        mapContainer.addChild(riskLabel);
    });
}

// Create UI panels
const uiElements = {};

function createUI() {
    // Top bar
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x1a1510, 0.9);
    topBar.drawRect(0, 0, 900, 50);
    topBar.endFill();
    uiContainer.addChild(topBar);

    // Year
    uiElements.year = new PIXI.Text('Year: 1830', { fontSize: 18, fill: 0xFFFFFF });
    uiElements.year.x = 20;
    uiElements.year.y = 15;
    uiContainer.addChild(uiElements.year);

    // Silver
    uiElements.silver = new PIXI.Text('Silver: 500', { fontSize: 18, fill: 0xFFD700 });
    uiElements.silver.x = 150;
    uiElements.silver.y = 15;
    uiContainer.addChild(uiElements.silver);

    // Mood bar
    const moodLabel = new PIXI.Text('Britain\'s Mood:', { fontSize: 14, fill: 0xFFFFFF });
    moodLabel.x = 300;
    moodLabel.y = 8;
    uiContainer.addChild(moodLabel);

    uiElements.moodBar = new PIXI.Graphics();
    uiElements.moodBar.x = 420;
    uiElements.moodBar.y = 10;
    uiContainer.addChild(uiElements.moodBar);

    // Ships
    uiElements.ships = new PIXI.Text('Ships: 1/1', { fontSize: 18, fill: 0x80C0FF });
    uiElements.ships.x = 600;
    uiElements.ships.y = 15;
    uiContainer.addChild(uiElements.ships);

    // Speed control
    const speedBtn = new PIXI.Text('[1x]', { fontSize: 16, fill: 0x80FF80 });
    speedBtn.x = 750;
    speedBtn.y = 15;
    speedBtn.eventMode = 'static';
    speedBtn.cursor = 'pointer';
    speedBtn.on('pointerdown', cycleSpeed);
    uiContainer.addChild(speedBtn);
    uiElements.speedBtn = speedBtn;

    // Left panel - Buy Opium
    const opiumPanel = new PIXI.Graphics();
    opiumPanel.beginFill(0x3a2820);
    opiumPanel.drawRoundedRect(10, 100, 180, 160, 10);
    opiumPanel.endFill();
    uiContainer.addChild(opiumPanel);

    const opiumTitle = new PIXI.Text('BUY OPIUM', { fontSize: 16, fill: 0xE0C080, fontWeight: 'bold' });
    opiumTitle.x = 50;
    opiumTitle.y = 110;
    uiContainer.addChild(opiumTitle);

    uiElements.opiumPrice = new PIXI.Text('Price: 25/chest', { fontSize: 14, fill: 0xFFFFFF });
    uiElements.opiumPrice.x = 30;
    uiElements.opiumPrice.y = 135;
    uiContainer.addChild(uiElements.opiumPrice);

    uiElements.opiumStock = new PIXI.Text('Stock: 0', { fontSize: 14, fill: 0xC080FF });
    uiElements.opiumStock.x = 30;
    uiElements.opiumStock.y = 155;
    uiContainer.addChild(uiElements.opiumStock);

    // Buy buttons
    [5, 10, 15].forEach((amount, i) => {
        const btn = createButton(`+${amount}`, 25 + i * 55, 185, () => buyOpium(amount));
        uiContainer.addChild(btn);
    });

    // Left panel - Buy Tea
    const teaPanel = new PIXI.Graphics();
    teaPanel.beginFill(0x203820);
    teaPanel.drawRoundedRect(10, 280, 180, 160, 10);
    teaPanel.endFill();
    uiContainer.addChild(teaPanel);

    const teaTitle = new PIXI.Text('BUY TEA', { fontSize: 16, fill: 0x80E080, fontWeight: 'bold' });
    teaTitle.x = 60;
    teaTitle.y = 290;
    uiContainer.addChild(teaTitle);

    uiElements.teaPrice = new PIXI.Text('Price: 18/chest', { fontSize: 14, fill: 0xFFFFFF });
    uiElements.teaPrice.x = 30;
    uiElements.teaPrice.y = 315;
    uiContainer.addChild(uiElements.teaPrice);

    uiElements.teaStock = new PIXI.Text('Stock: 0', { fontSize: 14, fill: 0x80FF80 });
    uiElements.teaStock.x = 30;
    uiElements.teaStock.y = 335;
    uiContainer.addChild(uiElements.teaStock);

    // Buy buttons
    [5, 10, 15].forEach((amount, i) => {
        const btn = createButton(`+${amount}`, 25 + i * 55, 365, () => buyTea(amount));
        uiContainer.addChild(btn);
    });

    // Bottom panel - Clipper status
    const clipperPanel = new PIXI.Graphics();
    clipperPanel.beginFill(0x202840);
    clipperPanel.drawRoundedRect(200, 520, 500, 80, 10);
    clipperPanel.endFill();
    uiContainer.addChild(clipperPanel);

    const clipperTitle = new PIXI.Text('TEA CLIPPER TO BRITAIN', { fontSize: 16, fill: 0x80C0FF, fontWeight: 'bold' });
    clipperTitle.x = 350;
    clipperTitle.y = 530;
    uiContainer.addChild(clipperTitle);

    uiElements.clipperTimer = new PIXI.Text('Arriving in: 60s', { fontSize: 14, fill: 0xFFFFFF });
    uiElements.clipperTimer.x = 220;
    uiElements.clipperTimer.y = 555;
    uiContainer.addChild(uiElements.clipperTimer);

    uiElements.quota = new PIXI.Text('Quota: 60 chests', { fontSize: 14, fill: 0xFFFF80 });
    uiElements.quota.x = 380;
    uiElements.quota.y = 555;
    uiContainer.addChild(uiElements.quota);

    uiElements.teaReady = new PIXI.Text('Your tea: 0 chests', { fontSize: 14, fill: 0x80FF80 });
    uiElements.teaReady.x = 550;
    uiElements.teaReady.y = 555;
    uiContainer.addChild(uiElements.teaReady);

    // Progress bar
    uiElements.clipperBar = new PIXI.Graphics();
    uiElements.clipperBar.x = 220;
    uiElements.clipperBar.y = 580;
    uiContainer.addChild(uiElements.clipperBar);

    // News ticker
    uiElements.news = new PIXI.Text('Trade winds favor your enterprise...', {
        fontSize: 14, fill: 0xC0C0C0, fontStyle: 'italic'
    });
    uiElements.news.x = 10;
    uiElements.news.y = 620;
    uiContainer.addChild(uiElements.news);
}

function createButton(text, x, y, onClick) {
    const btn = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x604030);
    bg.drawRoundedRect(0, 0, 45, 30, 5);
    bg.endFill();
    btn.addChild(bg);

    const label = new PIXI.Text(text, { fontSize: 14, fill: 0xFFFFFF });
    label.x = 22 - label.width / 2;
    label.y = 6;
    btn.addChild(label);

    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => bg.tint = 0xCCCCCC);
    btn.on('pointerout', () => bg.tint = 0xFFFFFF);

    return btn;
}

// Buy opium
function buyOpium(amount) {
    const cost = amount * prices.opium;
    if (gameState.silver >= cost) {
        gameState.silver -= cost;
        gameState.opium += amount;
        showNotification(`Bought ${amount} opium for ${cost} silver`);
        // Price increases slightly
        prices.opium = Math.min(120, prices.opium + Math.floor(amount * 0.2));
    } else {
        showNotification('Not enough silver!', 0xFF4040);
    }
}

// Buy tea
function buyTea(amount) {
    const cost = amount * prices.tea;
    if (gameState.silver >= cost) {
        gameState.silver -= cost;
        gameState.tea += amount;
        showNotification(`Bought ${amount} tea for ${cost} silver`);
        prices.tea = Math.min(80, prices.tea + Math.floor(amount * 0.1));
    } else {
        showNotification('Not enough silver!', 0xFF4040);
    }
}

// Cycle speed
function cycleSpeed() {
    gameState.timeSpeed = gameState.timeSpeed === 1 ? 2 : gameState.timeSpeed === 2 ? 3 : 1;
    uiElements.speedBtn.text = `[${gameState.timeSpeed}x]`;
}

// Show notification
function showNotification(text, color = 0xFFFFFF) {
    const notif = new PIXI.Text(text, { fontSize: 16, fill: color, fontWeight: 'bold' });
    notif.x = 450 - notif.width / 2;
    notif.y = 480;
    notif.alpha = 1;
    notificationContainer.addChild(notif);

    const fadeOut = () => {
        notif.alpha -= 0.02;
        notif.y -= 0.5;
        if (notif.alpha <= 0) {
            notificationContainer.removeChild(notif);
        } else {
            requestAnimationFrame(fadeOut);
        }
    };
    setTimeout(fadeOut, 1000);
}

// Create port offer
function createOffer(port) {
    // Check if port already has an offer
    if (portOffers.some(o => o.port === port)) return;

    const yearMod = (gameState.year - 1830) * 0.1;
    const quantity = Math.floor(port.baseOffer * (0.8 + Math.random() * 0.4) * (1 + yearMod));
    const pricePerChest = Math.floor(40 + Math.random() * 30 + yearMod * 20);

    const offer = {
        port,
        quantity,
        price: pricePerChest,
        totalValue: quantity * pricePerChest,
        timer: 12 + Math.random() * 8, // 12-20 seconds (slowed down per feedback)
        sprite: new PIXI.Container()
    };

    // Draw offer bubble
    const bg = new PIXI.Graphics();
    bg.beginFill(0xF0E0C0);
    bg.drawRoundedRect(0, 0, 90, 70, 8);
    bg.endFill();
    offer.sprite.addChild(bg);

    const qtyText = new PIXI.Text(`${quantity} chests`, { fontSize: 12, fill: 0x000000 });
    qtyText.x = 45 - qtyText.width / 2;
    qtyText.y = 8;
    offer.sprite.addChild(qtyText);

    const priceText = new PIXI.Text(`@ ${pricePerChest} silver`, { fontSize: 11, fill: 0x404040 });
    priceText.x = 45 - priceText.width / 2;
    priceText.y = 25;
    offer.sprite.addChild(priceText);

    const acceptBtn = new PIXI.Graphics();
    acceptBtn.beginFill(0x40A040);
    acceptBtn.drawRoundedRect(10, 45, 70, 20, 4);
    acceptBtn.endFill();
    offer.sprite.addChild(acceptBtn);

    const acceptText = new PIXI.Text('ACCEPT', { fontSize: 11, fill: 0xFFFFFF });
    acceptText.x = 25;
    acceptText.y = 47;
    offer.sprite.addChild(acceptText);

    offer.sprite.x = port.x - 45;
    offer.sprite.y = port.y - 90;
    offer.sprite.eventMode = 'static';
    offer.sprite.cursor = 'pointer';
    offer.sprite.on('pointerdown', () => acceptOffer(offer));

    offerContainer.addChild(offer.sprite);
    portOffers.push(offer);
}

// Accept offer
function acceptOffer(offer) {
    if (gameState.shipsAvailable <= 0) {
        showNotification('No ships available!', 0xFF4040);
        return;
    }
    if (gameState.opium < offer.quantity) {
        showNotification('Not enough opium!', 0xFF4040);
        return;
    }

    // Remove opium
    gameState.opium -= offer.quantity;
    gameState.shipsAvailable--;

    // Create ship en route
    const ship = {
        offer,
        x: 150,
        y: 400,
        targetX: offer.port.x,
        targetY: offer.port.y,
        state: 'sailing', // sailing, returning
        progress: 0,
        sprite: new PIXI.Graphics()
    };

    ship.sprite.beginFill(0xC0A080);
    ship.sprite.moveTo(0, -8);
    ship.sprite.lineTo(12, 0);
    ship.sprite.lineTo(0, 8);
    ship.sprite.lineTo(-12, 0);
    ship.sprite.closePath();
    ship.sprite.endFill();
    ship.sprite.x = ship.x;
    ship.sprite.y = ship.y;

    shipContainer.addChild(ship.sprite);
    shipsEnRoute.push(ship);

    // Remove offer
    removeOffer(offer);

    showNotification(`Ship sailing to ${offer.port.name}...`);
}

// Remove offer
function removeOffer(offer) {
    offerContainer.removeChild(offer.sprite);
    const idx = portOffers.indexOf(offer);
    if (idx >= 0) portOffers.splice(idx, 1);
}

// Process ship arrival
function processShipArrival(ship) {
    const port = ship.offer.port;
    const yearMod = (gameState.year - 1830);

    // Calculate capture chance (reduced in early game per feedback)
    let captureChance = port.risk * 0.05;
    if (yearMod < 2) captureChance *= 0.2; // 80% reduction in early game
    captureChance += yearMod * 0.02;

    const roll = Math.random();

    if (roll < captureChance) {
        // Captured!
        const outcome = Math.random();
        if (outcome < 0.6) {
            // Escaped - no sale but ship returns (per feedback: always get something)
            const partialSilver = Math.floor(ship.offer.totalValue * 0.2);
            gameState.silver += partialSilver;
            showNotification(`Ship escaped! Salvaged ${partialSilver} silver`, 0xFFFF80);
        } else if (outcome < 0.85) {
            // Fined
            const fine = Math.floor(ship.offer.totalValue * 0.3);
            const earned = ship.offer.totalValue - fine;
            gameState.silver += earned;
            gameState.totalSilverEarned += earned;
            gameState.totalOpiumSold += ship.offer.quantity;
            showNotification(`Fined! Earned ${earned} silver`, 0xFFAA00);
        } else {
            // Confiscated - lost cargo
            showNotification('Cargo confiscated!', 0xFF4040);
        }
    } else {
        // Success!
        gameState.silver += ship.offer.totalValue;
        gameState.totalSilverEarned += ship.offer.totalValue;
        gameState.totalOpiumSold += ship.offer.quantity;
        showNotification(`Trade successful! +${ship.offer.totalValue} silver`, 0x40FF40);
    }

    // Ship returns
    ship.state = 'returning';
    ship.progress = 0;
    ship.targetX = 150;
    ship.targetY = 400;
}

// Ship arrives home
function shipArrivesHome(ship) {
    gameState.shipsAvailable++;
    shipContainer.removeChild(ship.sprite);
    const idx = shipsEnRoute.indexOf(ship);
    if (idx >= 0) shipsEnRoute.splice(idx, 1);
}

// Clipper arrives
function clipperArrives() {
    const shipped = Math.min(gameState.tea, gameState.quota);
    gameState.tea -= shipped;
    gameState.teaShipped = shipped;
    gameState.totalTeaShipped += shipped;

    if (shipped >= gameState.quota) {
        // Met quota!
        gameState.mood = Math.min(100, gameState.mood + 15);
        gameState.ships = Math.min(gameState.maxShips, gameState.ships + 1);
        gameState.shipsAvailable++;
        showNotification(`Quota met! +1 Ship!`, 0x40FF40);
    } else if (shipped > 0) {
        // Partial
        const penalty = Math.floor((gameState.quota - shipped) / gameState.quota * 20);
        gameState.mood = Math.max(0, gameState.mood - penalty);
        showNotification(`Only shipped ${shipped}/${gameState.quota}. Britain disappointed.`, 0xFFAA00);
    } else {
        // Nothing shipped
        gameState.mood = Math.max(0, gameState.mood - 25);
        showNotification('No tea shipped! Britain furious!', 0xFF4040);
    }

    // Advance year
    advanceYear();

    // Reset clipper
    gameState.clipperTimer = gameState.clipperInterval;
}

// Advance year
function advanceYear() {
    gameState.year++;

    if (gameState.year > gameState.maxYear) {
        showVictory();
        return;
    }

    // Update quota
    const quotas = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];
    gameState.quota = quotas[gameState.year - 1830] || 660;

    // Update prices
    updatePrices();

    // News event
    triggerYearEvent();
}

// Update prices
function updatePrices() {
    const yearIdx = gameState.year - 1830;

    if (yearIdx < 3) {
        prices.opium = 20 + Math.floor(Math.random() * 15);
        prices.tea = 15 + Math.floor(Math.random() * 10);
    } else if (yearIdx < 6) {
        prices.opium = 50 + Math.floor(Math.random() * 30);
        prices.tea = 25 + Math.floor(Math.random() * 20);
    } else {
        prices.opium = 80 + Math.floor(Math.random() * 40);
        prices.tea = 50 + Math.floor(Math.random() * 30);
    }
}

// Trigger year event
function triggerYearEvent() {
    const events = {
        1832: 'Orders drying up... Chinese merchants becoming cautious.',
        1833: 'Dealing houses merge! Opium prices spike!',
        1835: 'Rumors of crackdown spread through the delta...',
        1836: 'Commissioner Lin appointed! Risk increases!',
        1838: 'Lin Zexu arrives in Canton. Tensions escalate.',
        1839: 'Lin demands opium surrender. War is imminent!'
    };

    if (events[gameState.year]) {
        uiElements.news.text = events[gameState.year];

        // Special effects
        if (gameState.year >= 1836) {
            PORTS.forEach(p => p.risk = Math.min(5, p.risk + 1));
        }
    }
}

// Update UI
function updateUI() {
    uiElements.year.text = `Year: ${gameState.year}`;
    uiElements.silver.text = `Silver: ${gameState.silver}`;
    uiElements.ships.text = `Ships: ${gameState.shipsAvailable}/${gameState.ships}`;

    uiElements.opiumPrice.text = `Price: ${prices.opium}/chest`;
    uiElements.opiumStock.text = `Stock: ${gameState.opium}`;

    uiElements.teaPrice.text = `Price: ${prices.tea}/chest`;
    uiElements.teaStock.text = `Stock: ${gameState.tea}`;

    uiElements.clipperTimer.text = `Arriving in: ${Math.ceil(gameState.clipperTimer)}s`;
    uiElements.quota.text = `Quota: ${gameState.quota} chests`;
    uiElements.teaReady.text = `Your tea: ${gameState.tea} chests`;

    // Mood bar
    uiElements.moodBar.clear();
    uiElements.moodBar.beginFill(0x404040);
    uiElements.moodBar.drawRect(0, 0, 150, 20);
    uiElements.moodBar.endFill();
    const moodColor = gameState.mood > 60 ? 0x40C040 : gameState.mood > 30 ? 0xC0C040 : 0xC04040;
    uiElements.moodBar.beginFill(moodColor);
    uiElements.moodBar.drawRect(0, 0, gameState.mood * 1.5, 20);
    uiElements.moodBar.endFill();

    // Clipper progress bar
    uiElements.clipperBar.clear();
    uiElements.clipperBar.beginFill(0x404040);
    uiElements.clipperBar.drawRect(0, 0, 460, 10);
    uiElements.clipperBar.endFill();
    const progress = 1 - (gameState.clipperTimer / gameState.clipperInterval);
    uiElements.clipperBar.beginFill(0x4080C0);
    uiElements.clipperBar.drawRect(0, 0, 460 * progress, 10);
    uiElements.clipperBar.endFill();
}

// Create menu
function createMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1510, 0.95);
    bg.drawRect(0, 0, 900, 650);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('HIGH TEA', { fontSize: 64, fill: 0xD4A060, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 450;
    title.y = 150;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('The British Opium Trade, 1830-1839', {
        fontSize: 24, fill: 0xA08060, fontStyle: 'italic'
    });
    subtitle.anchor.set(0.5);
    subtitle.x = 450;
    subtitle.y = 220;
    menuContainer.addChild(subtitle);

    const desc = new PIXI.Text(
        'Britain craves tea, but China only accepts silver.\n' +
        'Your solution? Sell opium.\n\n' +
        'Buy opium from Bengal. Sell it at Chinese ports.\n' +
        'Use the silver to buy tea for Britain.\n' +
        'Meet your quotas. Avoid the authorities.\n' +
        'Survive 9 years to win.',
        { fontSize: 16, fill: 0xC0C0C0, align: 'center', lineHeight: 24 }
    );
    desc.anchor.set(0.5);
    desc.x = 450;
    desc.y = 380;
    menuContainer.addChild(desc);

    const start = new PIXI.Text('[ Click to Begin Trading ]', { fontSize: 28, fill: 0xD4A060 });
    start.anchor.set(0.5);
    start.x = 450;
    start.y = 550;
    start.eventMode = 'static';
    start.cursor = 'pointer';
    start.on('pointerdown', startGame);
    menuContainer.addChild(start);
}

function startGame() {
    gameState.phase = 'playing';
    gameState.year = 1830;
    gameState.silver = 500;
    gameState.opium = 0;
    gameState.tea = 0;
    gameState.ships = 1;
    gameState.shipsAvailable = 1;
    gameState.mood = 80;
    gameState.quota = 60;
    gameState.clipperTimer = 60;
    gameState.totalOpiumSold = 0;
    gameState.totalTeaShipped = 0;
    gameState.totalSilverEarned = 0;
    prices.opium = 25;
    prices.tea = 18;

    menuContainer.visible = false;
}

function showGameOver() {
    gameState.phase = 'gameover';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x200000, 0.95);
    bg.drawRect(0, 0, 900, 650);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('TRADING EMPIRE COLLAPSED', {
        fontSize: 48, fill: 0xFF4040, fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.x = 450;
    title.y = 200;
    menuContainer.addChild(title);

    const reason = gameState.mood <= 0 ? 'Britain lost patience with you.' :
        gameState.silver <= 0 ? 'You went bankrupt.' : 'Your fleet was lost.';

    const stats = new PIXI.Text(
        `${reason}\n\n` +
        `Year: ${gameState.year}\n` +
        `Total Opium Sold: ${gameState.totalOpiumSold} chests\n` +
        `Estimated Addictions: ${Math.floor(gameState.totalOpiumSold * 15)}`,
        { fontSize: 20, fill: 0xFFFFFF, align: 'center', lineHeight: 28 }
    );
    stats.anchor.set(0.5);
    stats.x = 450;
    stats.y = 350;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Try Again ]', { fontSize: 24, fill: 0xFF8080 });
    restart.anchor.set(0.5);
    restart.x = 450;
    restart.y = 500;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

function showVictory() {
    gameState.phase = 'victory';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x102010, 0.95);
    bg.drawRect(0, 0, 900, 650);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('TRADING EMPIRE COMPLETE', {
        fontSize: 48, fill: 0xD4A060, fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.x = 450;
    title.y = 120;
    menuContainer.addChild(title);

    const addictions = Math.floor(gameState.totalOpiumSold * 15);

    const stats = new PIXI.Text(
        `You survived the opium trade through 1839.\n\n` +
        `Total Tea Shipped: ${gameState.totalTeaShipped} chests\n` +
        `Total Opium Sold: ${gameState.totalOpiumSold} chests\n` +
        `Total Silver Earned: ${gameState.totalSilverEarned}\n\n` +
        `Estimated Chinese Addicted: ${addictions.toLocaleString()}`,
        { fontSize: 18, fill: 0xFFFFFF, align: 'center', lineHeight: 26 }
    );
    stats.anchor.set(0.5);
    stats.x = 450;
    stats.y = 280;
    menuContainer.addChild(stats);

    const historical = new PIXI.Text(
        'Historical Note:\n' +
        'The First Opium War (1839-1842) began shortly after.\n' +
        "Britain's victory forced China to cede Hong Kong\n" +
        'and pay $21 million in reparations.',
        { fontSize: 14, fill: 0xA0A0A0, align: 'center', fontStyle: 'italic', lineHeight: 22 }
    );
    historical.anchor.set(0.5);
    historical.x = 450;
    historical.y = 450;
    menuContainer.addChild(historical);

    const restart = new PIXI.Text('[ Click to Play Again ]', { fontSize: 24, fill: 0x80C080 });
    restart.anchor.set(0.5);
    restart.x = 450;
    restart.y = 550;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

// Initialize
drawMap();
createUI();
createMenu();

// Game loop
let offerTimer = 0;

app.ticker.add((delta) => {
    if (gameState.phase !== 'playing') return;

    const dt = (delta / 60) * gameState.timeSpeed;

    // Clipper countdown
    gameState.clipperTimer -= dt;
    if (gameState.clipperTimer <= 0) {
        clipperArrives();
    }

    // Offer spawning
    offerTimer -= dt;
    if (offerTimer <= 0) {
        const port = PORTS[Math.floor(Math.random() * PORTS.length)];
        createOffer(port);
        offerTimer = 5 + Math.random() * 5; // 5-10 seconds (slowed per feedback)
    }

    // Update offer timers
    for (let i = portOffers.length - 1; i >= 0; i--) {
        portOffers[i].timer -= dt;
        if (portOffers[i].timer <= 0) {
            removeOffer(portOffers[i]);
        }
    }

    // Update ships
    for (const ship of shipsEnRoute) {
        ship.progress += dt * 0.3;

        if (ship.state === 'sailing') {
            const t = Math.min(1, ship.progress);
            ship.sprite.x = ship.x + (ship.targetX - ship.x) * t;
            ship.sprite.y = ship.y + (ship.targetY - ship.y) * t;

            if (ship.progress >= 1) {
                processShipArrival(ship);
            }
        } else if (ship.state === 'returning') {
            const t = Math.min(1, ship.progress);
            const startX = ship.offer.port.x;
            const startY = ship.offer.port.y;
            ship.sprite.x = startX + (ship.targetX - startX) * t;
            ship.sprite.y = startY + (ship.targetY - startY) * t;

            if (ship.progress >= 1) {
                shipArrivesHome(ship);
            }
        }
    }

    // Check lose conditions
    if (gameState.mood <= 0) {
        showGameOver();
    }
    if (gameState.silver <= 0 && gameState.opium === 0 && gameState.tea === 0) {
        showGameOver();
    }
    if (gameState.ships <= 0) {
        showGameOver();
    }

    // Natural mood recovery
    if (gameState.mood > 50) {
        gameState.mood = Math.min(100, gameState.mood + dt * 0.05);
    }

    updateUI();
});

console.log('High Tea loaded!');
