// High Tea Clone - Canvas Version (Expanded)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;

// Colors - vintage/sepia palette
const COLORS = {
    sea: '#4a8a8a',
    seaLight: '#5a9a9a',
    seaDark: '#3a7a7a',
    land: '#c4a060',
    landDark: '#a08040',
    landLight: '#d4b070',
    panelBg: '#f4e8d0',
    panelBorder: '#a08050',
    text: '#3a2a1a',
    textLight: '#6a5a4a',
    silver: '#708090',
    opium: '#804020',
    tea: '#408040',
    highlight: '#ffd700',
    danger: '#c04040',
    warning: '#ff8800',
    button: '#d4c0a0',
    buttonHover: '#e8d8b8',
    offer: '#ffffff',
    ship: '#8b4513',
    bribe: '#9932cc'
};

// Tutorial system
const tutorial = {
    active: true,
    step: 0,
    steps: [
        {
            message: "Welcome to High Tea! Britain needs TEA, and you'll get it by trading OPIUM.",
            highlight: null,
            waitFor: 'click'
        },
        {
            message: "Step 1: Buy OPIUM with your silver. Click the '15' button to buy 15 chests.",
            highlight: 'buyOpium15',
            waitFor: 'buyOpium'
        },
        {
            message: "Great! Now sell your opium at a port. Click one of the trade offers on the map.",
            highlight: 'offers',
            waitFor: 'acceptOffer'
        },
        {
            message: "Your ship is sailing! Wait for it to return with silver...",
            highlight: null,
            waitFor: 'shipReturn'
        },
        {
            message: "Excellent! You earned silver. Now buy TEA - click '15' under Buy Tea.",
            highlight: 'buyTea15',
            waitFor: 'buyTea'
        },
        {
            message: "Perfect! Your tea will be shipped when the clipper arrives (see timer bottom).",
            highlight: 'quota',
            waitFor: 'click'
        },
        {
            message: "Tutorial complete! Keep trading: Buy Opium → Sell at Ports → Buy Tea → Ship to Britain!",
            highlight: 'tutorialEnd',
            waitFor: 'click'
        }
    ],
    advance: function(trigger) {
        if (!this.active) return;
        const currentStep = this.steps[this.step];
        if (currentStep && currentStep.waitFor === trigger) {
            this.step++;
            if (this.step >= this.steps.length) {
                this.active = false;
            }
        }
    }
};

// Game state
const game = {
    year: 1830,
    month: 1,
    silver: 500,
    opium: 15, // Start with some opium for immediate action
    tea: 0,
    ships: 1,
    maxShips: 6,
    mood: 100,
    quota: 50,  // Rebalanced starting quota
    teaShipped: 0,
    totalTeaShipped: 0,
    totalOpiumSold: 0,
    quotaTimer: 120,
    paused: false,
    gameOver: false,
    victory: false,
    message: '',
    messageTimer: 0,
    bribeCards: 0,
    finesPaid: 0,
    shipsLost: 0,
    screenShake: 0,
    screenFlash: null,
    flashAlpha: 0,
    waveOffset: 0,
    particles: [],
    floatingTexts: [],
    eventQueue: [],
    currentEvent: null,
    newsMessage: "Welcome to the Pearl River Delta...",
    newsTimer: 10
};

// Historical events
const HISTORICAL_EVENTS = {
    1832: {
        title: "Orders Drying Up",
        message: "Chinese merchants are becoming cautious. Trade offers less frequent.",
        effect: () => { /* Handled in spawn rate */ }
    },
    1833: {
        title: "Dealing Houses Merge",
        message: "The Bengal trading houses have consolidated. Opium prices soar!",
        effect: () => { game.newsMessage = "Opium prices have spiked dramatically!"; }
    },
    1836: {
        title: "Commissioner Lin Appointed",
        message: "Emperor Daoguang appoints Lin Zexu to end the opium trade. Risk levels increase.",
        effect: () => {
            ports.forEach(p => p.risk = Math.min(5, p.risk + 1));
            game.newsMessage = "Authorities are cracking down on opium trade!";
        }
    },
    1838: {
        title: "Lin Arrives in Canton",
        message: "Commissioner Lin has arrived. The noose tightens around foreign traders.",
        effect: () => {
            ports.forEach(p => p.risk = Math.min(5, p.risk + 1));
        }
    },
    1839: {
        title: "Final Warning",
        message: "Lin Zexu demands all foreign opium be surrendered. War is imminent.",
        effect: () => { game.newsMessage = "Final year - ship your tea quota!"; }
    }
};

// Prices (vary by year)
let opiumPrice = 25;
let teaPrice = 15;

// Ports
const ports = [
    { name: 'Lintin Island', x: 650, y: 150, risk: 1, baseRisk: 1, basePrice: 1.0, pulsePhase: 0 },
    { name: 'Whampoa', x: 700, y: 280, risk: 2, baseRisk: 2, basePrice: 1.1, pulsePhase: 1 },
    { name: 'Canton', x: 580, y: 220, risk: 3, baseRisk: 3, basePrice: 1.25, pulsePhase: 2 },
    { name: 'Macao', x: 550, y: 450, risk: 2, baseRisk: 2, basePrice: 1.15, pulsePhase: 3 },
    { name: 'Bocca Tigris', x: 750, y: 380, risk: 4, baseRisk: 4, basePrice: 1.4, pulsePhase: 4 },
    { name: 'Hong Kong', x: 820, y: 320, risk: 3, baseRisk: 3, basePrice: 1.3, pulsePhase: 5, unlocked: false }
];

// Active offers on ports
let offers = [];

// Ships in transit
let ships = [];

// Input
const mouse = { x: 0, y: 0, clicked: false };
let hoveredOffer = null;

// Buttons
const buttons = {
    buyOpium5: { x: 30, y: 300, w: 45, h: 30, text: '5', action: () => buyOpium(5) },
    buyOpium15: { x: 85, y: 300, w: 45, h: 30, text: '15', action: () => buyOpium(15) },
    buyOpium30: { x: 140, y: 300, w: 45, h: 30, text: '30', action: () => buyOpium(30) },
    buyTea5: { x: 30, y: 420, w: 45, h: 30, text: '5', action: () => buyTea(5) },
    buyTea15: { x: 85, y: 420, w: 45, h: 30, text: '15', action: () => buyTea(15) },
    buyTea30: { x: 140, y: 420, w: 45, h: 30, text: '30', action: () => buyTea(30) },
    shipEarly: { x: 560, y: 530, w: 100, h: 35, text: 'SHIP NOW', action: () => shipTeaEarly() }
};

// Ship tea early for bonus
function shipTeaEarly() {
    if (game.tea < game.quota) {
        showMessage('Need more tea to meet quota!');
        screenFlash(COLORS.danger, 0.3);
        return;
    }

    // Calculate bonus based on time remaining
    const timeBonus = Math.floor(game.quotaTimer / 10); // Up to +12 mood bonus for shipping early
    const excessBonus = game.tea > game.quota * 1.2 ? 10 : (game.tea > game.quota ? 5 : 0);

    game.tea -= game.quota;
    game.teaShipped = game.quota;
    game.totalTeaShipped += game.quota;

    // Mood bonus for early shipment
    const moodGain = 15 + timeBonus + excessBonus;
    game.mood = Math.min(100, game.mood + moodGain);

    // Bonus ship for early delivery
    game.ships = Math.min(game.maxShips, game.ships + 1);

    showMessage(`Quota met early! +${moodGain} mood, +1 ship!`);
    screenFlash(COLORS.tea, 0.4);
    spawnParticles(450, 540, COLORS.tea, 25);
    spawnParticles(450, 540, COLORS.highlight, 15);

    // Advance to next year
    advanceYear();
}

// Initialize
function init() {
    updatePrices();
    spawnOffer();

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('click', handleClick);

    requestAnimationFrame(gameLoop);
}

// Update prices based on year
function updatePrices() {
    const yearMod = 1 + (game.year - 1830) * 0.08;
    const randomNoise = 0.9 + Math.random() * 0.2;

    opiumPrice = Math.round(20 * yearMod * randomNoise);
    if (game.year >= 1833) opiumPrice = Math.round(opiumPrice * 1.5); // Dealing house merger

    teaPrice = Math.round(12 * yearMod * randomNoise);

    // Unlock Hong Kong in 1836
    if (game.year >= 1836) {
        ports[5].unlocked = true;
    }
}

// Spawn a new port offer
function spawnOffer() {
    if (offers.length >= 4) return;

    // Pick random port without existing offer
    const availablePorts = ports.filter(p =>
        !offers.find(o => o.port === p) &&
        (p.unlocked !== false)
    );
    if (availablePorts.length === 0) return;

    const port = availablePorts[Math.floor(Math.random() * availablePorts.length)];
    const quantity = 10 + Math.floor(Math.random() * 30) + Math.floor(game.year - 1830) * 5;
    const pricePerChest = Math.round(40 * port.basePrice * (0.9 + Math.random() * 0.3));

    offers.push({
        port,
        quantity,
        price: pricePerChest,
        timer: 12 + Math.random() * 8, // Expires in 12-20 seconds
        animY: 0,
        spawnAnim: 1.0 // Spawn animation scale
    });
}

// Buy opium
function buyOpium(amount) {
    const cost = amount * opiumPrice;
    if (game.silver >= cost) {
        game.silver -= cost;
        game.opium += amount;
        showMessage(`Bought ${amount} opium chests`);
        spawnFloatingText(`-${cost}`, 100, 75, COLORS.danger);
        spawnParticles(100, 130, COLORS.opium, 5);
        tutorial.advance('buyOpium');
    } else {
        showMessage('Not enough silver!');
        screenFlash(COLORS.danger, 0.3);
    }
}

// Buy tea
function buyTea(amount) {
    const cost = amount * teaPrice;
    if (game.silver >= cost) {
        game.silver -= cost;
        game.tea += amount;
        showMessage(`Bought ${amount} tea chests`);
        spawnFloatingText(`-${cost}`, 100, 75, COLORS.danger);
        spawnParticles(100, 185, COLORS.tea, 5);
        tutorial.advance('buyTea');
    } else {
        showMessage('Not enough silver!');
        screenFlash(COLORS.danger, 0.3);
    }
}

// Accept offer
function acceptOffer(offer) {
    // Check if we have opium and available ships
    const availableShips = game.ships - ships.length;
    if (availableShips <= 0) {
        showMessage('No ships available!');
        return;
    }
    if (game.opium < offer.quantity) {
        showMessage('Not enough opium!');
        return;
    }

    // Warning if risking last ship at high risk port
    if (game.ships === 1 && offer.port.risk >= 3) {
        showMessage('WARNING: High risk with only 1 ship!');
    }

    // Send ship
    game.opium -= offer.quantity;
    const shipValue = offer.quantity * offer.price;

    ships.push({
        x: 300,
        y: 550,
        targetX: offer.port.x,
        targetY: offer.port.y,
        returning: false,
        cargo: offer.quantity,
        value: shipValue,
        risk: offer.port.risk,
        port: offer.port,
        trail: []
    });

    game.totalOpiumSold += offer.quantity;
    tutorial.advance('acceptOffer');

    // Remove offer
    offers = offers.filter(o => o !== offer);
    showMessage(`Ship sent to ${offer.port.name}`);
}

// Ship encounter (when arriving at port)
function handleShipArrival(ship, index) {
    // Year 1 (1830) - NO fines or confiscations at all (learning year)
    if (game.year === 1830) {
        ship.returning = true;
        ship.port.risk = Math.min(5, ship.port.risk + 0.2);
        return false;
    }

    // Calculate risk based on port risk and year progression
    // Risk increases VERY slightly each year after year 1
    const yearPenalty = (game.year - 1830) * 0.01; // +1% per year
    const riskChance = ship.risk * 0.08 + yearPenalty; // Base 8% per risk level

    if (Math.random() < riskChance) {
        // Caught! Determine outcome
        const roll = Math.random();

        // Capture chance increases slightly each year
        const captureChance = 0.03 + (game.year - 1830) * 0.005; // 3% base, +0.5% per year
        const confiscateChance = captureChance + 0.10 + (game.year - 1830) * 0.01; // 10% base
        const fineChance = confiscateChance + 0.15 + (game.year - 1830) * 0.01; // 15% base

        if (roll < captureChance) {
            // Ship captured
            if (game.bribeCards > 0) {
                // Offer to use bribe card
                game.currentEvent = {
                    title: "YOUR SHIP HAS BEEN CAUGHT!",
                    message: `Captain Zhang offers to help... for a small consideration.`,
                    choices: [
                        { text: "USE BRIBE CARD", action: () => {
                            game.bribeCards--;
                            ship.returning = true;
                            showMessage("Bribe accepted. Ship escapes.");
                            game.currentEvent = null;
                        }},
                        { text: "ACCEPT FATE", action: () => {
                            captureShip(ship, index);
                            game.currentEvent = null;
                        }}
                    ]
                };
                return true; // Don't process further
            }
            captureShip(ship, index);
            return true;
        } else if (roll < confiscateChance) {
            // Confiscated - lose cargo, keep ship
            showMessage(`Cargo confiscated at ${ship.port.name}!`);
            ship.value = 0;
            screenFlash(COLORS.warning, 0.5);
            ship.returning = true;
        } else if (roll < fineChance) {
            // Fined - scales slightly with year
            const finePercent = 0.08 + (game.year - 1830) * 0.01; // 8% base, +1% per year
            const fine = Math.floor(ship.value * finePercent);
            ship.value -= fine;
            game.finesPaid += fine;
            showMessage(`Fined ${fine} silver at ${ship.port.name}`);
            screenFlash(COLORS.warning, 0.3);
            ship.returning = true;
        } else {
            // Escaped - no sale, no penalty
            showMessage(`Ship escaped authorities at ${ship.port.name}. No sale.`);
            ship.value = 0;
            ship.returning = true;
        }
    } else {
        // Success!
        ship.returning = true;
        // Increase port risk
        ship.port.risk = Math.min(5, ship.port.risk + 0.3);
        if (ship.cargo >= 30) ship.port.risk = Math.min(5, ship.port.risk + 0.5);
    }

    return false;
}

function captureShip(ship, index) {
    showMessage(`Ship CAPTURED at ${ship.port.name}!`);
    screenShake(15);
    screenFlash(COLORS.danger, 0.7);
    spawnParticles(ship.x, ship.y, COLORS.danger, 20);
    ships.splice(index, 1);
    game.ships--;
    game.shipsLost++;

    if (game.ships <= 0) {
        game.gameOver = true;
        game.message = 'All ships lost! Your trading empire collapses.';
    }
}

// Show message
function showMessage(msg) {
    game.message = msg;
    game.messageTimer = 3;
}

// Screen effects
function screenShake(amount) {
    game.screenShake = Math.max(game.screenShake, amount);
}

function screenFlash(color, alpha) {
    game.screenFlash = color;
    game.flashAlpha = alpha;
}

// Particles
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100 - 50,
            color,
            life: 1.0,
            size: 3 + Math.random() * 3
        });
    }
}

function spawnFloatingText(text, x, y, color) {
    game.floatingTexts.push({
        text, x, y,
        vy: -40,
        life: 1.5,
        color
    });
}

// Handle click
function handleClick(e) {
    // Tutorial click-to-advance
    if (tutorial.active) {
        const currentStep = tutorial.steps[tutorial.step];
        if (currentStep && currentStep.waitFor === 'click') {
            tutorial.advance('click');
            return;
        }
    }

    if (game.currentEvent) {
        // Check event choices
        const choiceY = 300;
        const choiceWidth = 150;
        for (let i = 0; i < game.currentEvent.choices.length; i++) {
            const cx = 450 - (game.currentEvent.choices.length - 1) * 90 + i * 180 - choiceWidth / 2;
            if (mouse.x >= cx && mouse.x <= cx + choiceWidth &&
                mouse.y >= choiceY && mouse.y <= choiceY + 40) {
                game.currentEvent.choices[i].action();
                return;
            }
        }
        return;
    }

    if (game.gameOver) {
        // Restart
        game.year = 1830;
        game.month = 1;
        game.silver = 500;
        game.opium = 0;
        game.tea = 0;
        game.ships = 1;
        game.mood = 100;
        game.quota = 60;
        game.teaShipped = 0;
        game.totalTeaShipped = 0;
        game.totalOpiumSold = 0;
        game.quotaTimer = 120;
        game.gameOver = false;
        game.victory = false;
        game.bribeCards = 0;
        game.finesPaid = 0;
        game.shipsLost = 0;
        offers = [];
        ships = [];
        ports.forEach(p => { p.risk = p.baseRisk; p.unlocked = p.unlocked === undefined ? true : false; });
        updatePrices();
        return;
    }

    // Check buttons
    for (const [name, btn] of Object.entries(buttons)) {
        if (mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
            mouse.y >= btn.y && mouse.y <= btn.y + btn.h) {
            btn.action();
            return;
        }
    }

    // Check offers
    for (const offer of offers) {
        const ox = offer.port.x;
        const oy = offer.port.y - 50 + Math.sin(offer.animY) * 3;
        if (mouse.x >= ox - 55 && mouse.x <= ox + 55 &&
            mouse.y >= oy - 35 && mouse.y <= oy + 30) {
            acceptOffer(offer);
            return;
        }
    }
}

// Update game logic
function update(dt) {
    if (game.gameOver || game.currentEvent) return;

    // Wave animation
    game.waveOffset += dt * 0.5;

    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        p.life -= dt;
        if (p.life <= 0) game.particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
        const t = game.floatingTexts[i];
        t.y += t.vy * dt;
        t.life -= dt;
        if (t.life <= 0) game.floatingTexts.splice(i, 1);
    }

    // Screen shake decay
    if (game.screenShake > 0) {
        game.screenShake *= 0.9;
        if (game.screenShake < 0.5) game.screenShake = 0;
    }

    // Flash decay
    if (game.flashAlpha > 0) {
        game.flashAlpha -= dt * 2;
        if (game.flashAlpha < 0) game.flashAlpha = 0;
    }

    // Port risk decay
    ports.forEach(p => {
        if (p.risk > p.baseRisk) {
            p.risk = Math.max(p.baseRisk, p.risk - dt * 0.02);
        }
    });

    // Update offer timers and animations
    hoveredOffer = null;
    for (let i = offers.length - 1; i >= 0; i--) {
        const offer = offers[i];
        offer.timer -= dt;
        offer.animY += dt * 3;
        if (offer.spawnAnim > 0) offer.spawnAnim -= dt * 3;

        // Check hover
        const ox = offer.port.x;
        const oy = offer.port.y - 50 + Math.sin(offer.animY) * 3;
        if (mouse.x >= ox - 55 && mouse.x <= ox + 55 &&
            mouse.y >= oy - 35 && mouse.y <= oy + 30) {
            hoveredOffer = offer;
        }

        if (offer.timer <= 0) {
            offers.splice(i, 1);
        }
    }

    // Spawn new offers (less frequent in 1832)
    let spawnRate = 0.3;
    if (game.year === 1832) spawnRate = 0.15;
    if (Math.random() < dt * spawnRate) {
        spawnOffer();
    }

    // Random bribe card chance
    if (game.year >= 1833 && game.bribeCards < 1 && Math.random() < dt * 0.01) {
        game.bribeCards = 1;
        showMessage('A corrupt official offers his services...');
        spawnParticles(105, 560, COLORS.bribe, 10);
    }

    // Update ships
    for (let i = ships.length - 1; i >= 0; i--) {
        const ship = ships[i];
        const tx = ship.returning ? 300 : ship.targetX;
        const ty = ship.returning ? 550 : ship.targetY;

        const dx = tx - ship.x;
        const dy = ty - ship.y;
        const dist = Math.hypot(dx, dy);
        const speed = 80;

        // Add to trail
        if (ship.trail.length === 0 ||
            Math.hypot(ship.trail[ship.trail.length - 1].x - ship.x, ship.trail[ship.trail.length - 1].y - ship.y) > 15) {
            ship.trail.push({ x: ship.x, y: ship.y, alpha: 1.0 });
            if (ship.trail.length > 10) ship.trail.shift();
        }

        // Fade trail
        ship.trail.forEach(t => t.alpha -= dt);

        if (dist > 5) {
            ship.x += (dx / dist) * speed * dt;
            ship.y += (dy / dist) * speed * dt;
        } else if (!ship.returning) {
            // Arrived at port - risk check
            const eventTriggered = handleShipArrival(ship, i);
            if (eventTriggered) continue;
        } else {
            // Returned home
            if (ship.value > 0) {
                game.silver += ship.value;
                showMessage(`Ship returned with ${ship.value} silver`);
                spawnFloatingText(`+${ship.value}`, 100, 75, COLORS.tea);
                spawnParticles(300, 550, COLORS.highlight, 8);
                tutorial.advance('shipReturn');
            }
            ships.splice(i, 1);
        }
    }

    // Quota timer
    game.quotaTimer -= dt;
    if (game.quotaTimer <= 0) {
        // Clipper arrives - ship tea
        const shipped = Math.min(game.tea, game.quota);
        game.tea -= shipped;
        game.teaShipped = shipped;
        game.totalTeaShipped += shipped;

        if (shipped >= game.quota) {
            // Met quota
            game.mood = Math.min(100, game.mood + 15);
            if (shipped >= game.quota * 1.2) game.mood = Math.min(100, game.mood + 10); // Bonus for exceeding
            game.ships = Math.min(game.maxShips, game.ships + 1);
            showMessage(`Quota met! +1 ship. Britain is pleased.`);
            screenFlash(COLORS.tea, 0.3);
            spawnParticles(400, 560, COLORS.tea, 20);
        } else {
            // Failed quota
            const shortfall = game.quota - shipped;
            const penalty = 20 + Math.floor(shortfall / 10) * 3;
            game.mood -= penalty;
            showMessage(`Quota missed by ${shortfall}! Mood -${penalty}`);
            screenFlash(COLORS.danger, 0.4);
        }

        // Next year
        advanceYear();
    }

    // Mood decay (slower)
    game.mood -= dt * 0.3;
    if (game.mood <= 0) {
        game.gameOver = true;
        game.message = "Britain's patience has run out. You are ruined.";
    }

    // News timer
    game.newsTimer -= dt;
    if (game.newsTimer <= 0) {
        game.newsTimer = 15 + Math.random() * 10;
        // Random news
        const newsItems = [
            "Prices remain volatile in the Delta...",
            "Traders report high demand at inner ports...",
            "Authorities patrol the waters near Canton...",
            "Bengal supplies continue to flow...",
            "Tea shipments keep Britain satisfied...",
            "The opium trade flourishes despite risks..."
        ];
        game.newsMessage = newsItems[Math.floor(Math.random() * newsItems.length)];
    }

    // Message timer
    if (game.messageTimer > 0) {
        game.messageTimer -= dt;
    }
}

// Advance to next year
function advanceYear() {
    game.year++;

    // Check for historical event
    if (HISTORICAL_EVENTS[game.year]) {
        const event = HISTORICAL_EVENTS[game.year];
        game.currentEvent = {
            title: event.title,
            message: event.message,
            choices: [{ text: "UNDERSTOOD", action: () => {
                event.effect();
                game.currentEvent = null;
            }}]
        };
    }

    if (game.year > 1839) {
        // Victory!
        game.gameOver = true;
        game.victory = true;
        const addictions = Math.round(game.totalOpiumSold * 3.5);
        game.message = `Victory! You survived the trade.`;
        return;
    }

    // RESET player resources each year (fresh start to maintain difficulty)
    // Keep ships as a reward, but reset trading goods
    const yearIndex = game.year - 1830;
    const startingSilver = [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400];
    const startingOpium = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

    game.silver = startingSilver[yearIndex] || 1400;
    game.opium = startingOpium[yearIndex] || 60;
    game.tea = 0;  // Always start year with no tea

    // Update quota and timer - rebalanced for difficulty
    // Quotas scale progressively but reasonably
    const quotas = [50, 70, 90, 110, 140, 170, 200, 240, 280, 320];
    game.quota = quotas[yearIndex] || 320;
    game.quotaTimer = 120;

    updatePrices();
    if (!game.currentEvent) {
        showMessage(`Year ${game.year} begins. Silver: ${game.silver}, Quota: ${game.quota} tea`);
    }
}

// Drawing
function draw() {
    ctx.save();

    // Apply screen shake
    if (game.screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * game.screenShake,
            (Math.random() - 0.5) * game.screenShake
        );
    }

    // Clear
    ctx.fillStyle = COLORS.sea;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map
    drawMap();

    // Draw ship trails
    ships.forEach(ship => {
        ship.trail.forEach(t => {
            if (t.alpha > 0) {
                ctx.fillStyle = `rgba(139, 69, 19, ${t.alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    });

    // Draw ships
    ships.forEach(drawShip);

    // Draw ports
    ports.forEach(drawPort);

    // Draw offers
    offers.forEach(drawOffer);

    // Draw left panel
    drawLeftPanel();

    // Draw top bar
    drawTopBar();

    // Draw bottom quota panel
    drawQuotaPanel();

    // Draw news ticker
    drawNewsTicker();

    // Draw particles
    game.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw floating texts
    game.floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = Math.min(1, t.life);
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    // Draw message
    if (game.messageTimer > 0 && !game.currentEvent) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(250, 250, 400, 50);
        ctx.strokeStyle = COLORS.highlight;
        ctx.lineWidth = 2;
        ctx.strokeRect(250, 250, 400, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, 450, 280);
    }

    // Draw event popup
    if (game.currentEvent) {
        drawEventPopup();
    }

    // Screen flash
    if (game.flashAlpha > 0) {
        ctx.fillStyle = game.screenFlash;
        ctx.globalAlpha = game.flashAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Draw tutorial overlay
    if (tutorial.active && tutorial.step < tutorial.steps.length) {
        drawTutorial();
    }

    // Game over / Victory
    if (game.gameOver) {
        drawEndScreen();
    }
}

// Draw tutorial overlay
function drawTutorial() {
    const step = tutorial.steps[tutorial.step];
    if (!step) return;

    // Draw overlay excluding highlighted areas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';

    if (step.highlight === 'buyOpium15') {
        // Draw overlay around the left panel upper section
        ctx.fillRect(210, 0, canvas.width - 210, canvas.height); // Right side
        ctx.fillRect(0, 350, 210, canvas.height - 350); // Below opium section
        // Highlight buyOpium15 button (x:85, y:300, w:45, h:30)
        ctx.strokeStyle = COLORS.highlight;
        ctx.lineWidth = 4;
        ctx.strokeRect(83, 298, 49, 34);
    } else if (step.highlight === 'buyTea15') {
        // Draw overlay except tea section
        ctx.fillRect(210, 0, canvas.width - 210, canvas.height); // Right side
        ctx.fillRect(0, 0, 210, 340); // Above tea section
        ctx.fillRect(0, 520, 210, canvas.height - 520); // Below tea section
        // Highlight buyTea15 button (x:85, y:420, w:45, h:30)
        ctx.strokeStyle = COLORS.highlight;
        ctx.lineWidth = 4;
        ctx.strokeRect(83, 418, 49, 34);
    } else if (step.highlight === 'offers') {
        // Draw overlay except the map area
        ctx.fillRect(0, 0, 210, canvas.height); // Left panel
        ctx.fillRect(210, 0, canvas.width - 210, 100); // Top strip
        ctx.fillRect(210, 580, canvas.width - 210, 20); // Bottom strip
    } else if (step.highlight === 'quota') {
        // Draw overlay except quota panel
        ctx.fillRect(0, 0, canvas.width, 560); // Above quota
        ctx.fillRect(0, 560, 430, 80); // Left of quota
        ctx.fillRect(760, 560, canvas.width - 760, 80); // Right of quota
        // Highlight quota panel
        ctx.strokeStyle = COLORS.highlight;
        ctx.lineWidth = 4;
        ctx.strokeRect(435, 568, 305, 60);
    } else if (step.highlight === 'tutorialEnd') {
        // Final step - show overlay with clear continue button
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Full overlay for steps with no highlight
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw tutorial message box
    const boxWidth = 500;
    const boxHeight = 80;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = 30;

    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Message text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Word wrap message
    const words = step.message.split(' ');
    let line = '';
    let y = boxY + 30;
    const maxWidth = boxWidth - 40;

    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), boxX + boxWidth / 2, y);
            line = word + ' ';
            y += 22;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), boxX + boxWidth / 2, y);

    // "Click to continue" for click steps - draw a proper button
    if (step.waitFor === 'click') {
        // Draw a clear, visible button
        const btnWidth = 180;
        const btnHeight = 40;
        const btnX = boxX + boxWidth / 2 - btnWidth / 2;
        const btnY = boxY + boxHeight + 20;

        // Button shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(btnX + 3, btnY + 3, btnWidth, btnHeight);

        // Button background
        ctx.fillStyle = COLORS.highlight;
        ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

        // Button border
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 3;
        ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

        // Button text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Georgia';
        ctx.fillText('CONTINUE', boxX + boxWidth / 2, btnY + btnHeight / 2 + 6);

        // Make the button glow/pulse for visibility
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX - 2, btnY - 2, btnWidth + 4, btnHeight + 4);
    }
}

function drawMap() {
    // Animated sea waves
    for (let y = 0; y < canvas.height; y += 25) {
        for (let x = 210; x < canvas.width; x += 40) {
            const waveX = x + Math.sin(y * 0.08 + game.waveOffset * 2) * 8;
            const waveY = y + Math.cos(x * 0.05 + game.waveOffset) * 3;
            ctx.fillStyle = (x + y) % 80 < 40 ? COLORS.seaLight : COLORS.seaDark;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.ellipse(waveX, waveY, 4, 2, game.waveOffset, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // Main land mass (simplified Pearl River Delta)
    ctx.fillStyle = COLORS.land;

    // Top land with shadow
    ctx.fillStyle = COLORS.landDark;
    ctx.beginPath();
    ctx.moveTo(400, 5);
    ctx.lineTo(500, 85);
    ctx.lineTo(600, 105);
    ctx.lineTo(700, 85);
    ctx.lineTo(800, 125);
    ctx.lineTo(900, 105);
    ctx.lineTo(900, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.land;
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(500, 80);
    ctx.lineTo(600, 100);
    ctx.lineTo(700, 80);
    ctx.lineTo(800, 120);
    ctx.lineTo(900, 100);
    ctx.lineTo(900, 0);
    ctx.closePath();
    ctx.fill();

    // Middle peninsula
    ctx.fillStyle = COLORS.landDark;
    ctx.beginPath();
    ctx.moveTo(455, 155);
    ctx.quadraticCurveTo(505, 205, 485, 285);
    ctx.quadraticCurveTo(525, 355, 505, 405);
    ctx.lineTo(405, 385);
    ctx.quadraticCurveTo(385, 305, 405, 225);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.land;
    ctx.beginPath();
    ctx.moveTo(450, 150);
    ctx.quadraticCurveTo(500, 200, 480, 280);
    ctx.quadraticCurveTo(520, 350, 500, 400);
    ctx.lineTo(400, 380);
    ctx.quadraticCurveTo(380, 300, 400, 220);
    ctx.closePath();
    ctx.fill();

    // Macao peninsula
    ctx.fillStyle = COLORS.landDark;
    ctx.beginPath();
    ctx.moveTo(455, 405);
    ctx.quadraticCurveTo(505, 455, 525, 525);
    ctx.lineTo(585, 600);
    ctx.lineTo(405, 600);
    ctx.lineTo(425, 485);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.land;
    ctx.beginPath();
    ctx.moveTo(450, 400);
    ctx.quadraticCurveTo(500, 450, 520, 520);
    ctx.lineTo(580, 600);
    ctx.lineTo(400, 600);
    ctx.lineTo(420, 480);
    ctx.closePath();
    ctx.fill();

    // Right land
    ctx.fillStyle = COLORS.landDark;
    ctx.beginPath();
    ctx.moveTo(755, 205);
    ctx.lineTo(855, 255);
    ctx.lineTo(900, 305);
    ctx.lineTo(900, 205);
    ctx.lineTo(825, 155);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.land;
    ctx.beginPath();
    ctx.moveTo(750, 200);
    ctx.lineTo(850, 250);
    ctx.lineTo(900, 300);
    ctx.lineTo(900, 200);
    ctx.lineTo(820, 150);
    ctx.closePath();
    ctx.fill();

    // Land highlights
    ctx.fillStyle = COLORS.landLight;
    ctx.beginPath();
    ctx.moveTo(460, 165);
    ctx.lineTo(480, 200);
    ctx.lineTo(465, 230);
    ctx.lineTo(445, 200);
    ctx.closePath();
    ctx.fill();
}

function drawPort(port) {
    if (port.unlocked === false) return;

    const hasOffer = offers.find(o => o.port === port);
    const pulseSize = Math.sin(Date.now() * 0.003 + port.pulsePhase) * 2;

    // Risk glow
    if (port.risk >= 3) {
        ctx.fillStyle = port.risk >= 4 ? 'rgba(192, 64, 64, 0.3)' : 'rgba(255, 136, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(port.x, port.y, 20 + pulseSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Port marker
    ctx.fillStyle = hasOffer ? COLORS.highlight : '#ffffff';
    ctx.beginPath();
    ctx.arc(port.x, port.y, 8 + (hasOffer ? pulseSize : 0), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Port name
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(port.name, port.x, port.y + 22);

    // Risk indicator
    const riskColors = ['#00aa00', '#88aa00', '#ffaa00', '#ff6600', '#ff0000'];
    ctx.fillStyle = riskColors[Math.floor(port.risk) - 1] || riskColors[0];
    ctx.beginPath();
    ctx.arc(port.x + 12, port.y - 12, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawOffer(offer) {
    const x = offer.port.x;
    const y = offer.port.y - 55 + Math.sin(offer.animY) * 3;
    const scale = 1 - Math.max(0, offer.spawnAnim);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);

    const isHovered = hoveredOffer === offer;

    // Bubble background with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x - 52, y - 32, 110, 65, 8);
    ctx.fill();

    ctx.fillStyle = isHovered ? '#fffff8' : COLORS.offer;
    ctx.strokeStyle = isHovered ? COLORS.highlight : COLORS.panelBorder;
    ctx.lineWidth = isHovered ? 3 : 2;

    ctx.beginPath();
    ctx.roundRect(x - 55, y - 35, 110, 65, 8);
    ctx.fill();
    ctx.stroke();

    // Arrow pointing down
    ctx.fillStyle = isHovered ? '#fffff8' : COLORS.offer;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 30);
    ctx.lineTo(x, y + 42);
    ctx.lineTo(x + 8, y + 30);
    ctx.fill();

    // Content
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`${offer.quantity} CHESTS`, x, y - 15);

    ctx.fillStyle = COLORS.tea;
    ctx.font = 'bold 13px Georgia';
    ctx.fillText(`${offer.price} silver/ea`, x, y + 5);

    // Total value
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '10px Georgia';
    ctx.fillText(`Total: ${offer.quantity * offer.price}`, x, y + 18);

    // Timer bar
    const timerWidth = Math.max(0, (offer.timer / 20) * 80);
    ctx.fillStyle = offer.timer < 5 ? COLORS.danger : COLORS.tea;
    ctx.fillRect(x - 40, y - 30, timerWidth, 4);

    ctx.restore();
}

function drawShip(ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // Calculate angle
    const tx = ship.returning ? 300 : ship.targetX;
    const ty = ship.returning ? 550 : ship.targetY;
    const angle = Math.atan2(ty - ship.y, tx - ship.x);
    ctx.rotate(angle);

    // Ship shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(2, 8, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ship body
    ctx.fillStyle = COLORS.ship;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -6);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();

    // Sail
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -12, 2, 24);

    // Animated sail
    const sailBillow = Math.sin(Date.now() * 0.005) * 2;
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.quadraticCurveTo(4 + sailBillow, 0, -4, 10);
    ctx.fill();

    ctx.restore();
}

function drawLeftPanel() {
    // Panel background with shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(5, 5, 210, canvas.height - 10);

    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(0, 0, 210, canvas.height);

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 210, canvas.height);

    // Title with decorative line
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', 105, 35);

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 45);
    ctx.lineTo(180, 45);
    ctx.stroke();

    // Silver
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.silver;
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${game.silver}`, 50, 80);
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '11px Georgia';
    ctx.fillText('SILVER COINS', 50, 95);

    // Opium
    ctx.fillStyle = COLORS.opium;
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${game.opium}`, 50, 130);
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '11px Georgia';
    ctx.fillText('OPIUM CHESTS', 50, 145);

    // Tea
    ctx.fillStyle = COLORS.tea;
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${game.tea}`, 50, 180);
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '11px Georgia';
    ctx.fillText('TEA CHESTS', 50, 195);

    // Divider
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.beginPath();
    ctx.moveTo(20, 215);
    ctx.lineTo(190, 215);
    ctx.stroke();

    // Buy Opium section
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY OPIUM', 105, 240);

    ctx.fillStyle = COLORS.opium;
    ctx.font = '13px Georgia';
    ctx.fillText(`${opiumPrice} silver/chest`, 105, 260);

    // Opium buttons
    drawButton(buttons.buyOpium5);
    drawButton(buttons.buyOpium15);
    drawButton(buttons.buyOpium30);

    // Divider
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.beginPath();
    ctx.moveTo(20, 345);
    ctx.lineTo(190, 345);
    ctx.stroke();

    // Buy Tea section
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY TEA', 105, 370);

    ctx.fillStyle = COLORS.tea;
    ctx.font = '13px Georgia';
    ctx.fillText(`${teaPrice} silver/chest`, 105, 390);

    // Tea buttons
    drawButton(buttons.buyTea5);
    drawButton(buttons.buyTea15);
    drawButton(buttons.buyTea30);

    // Divider
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.beginPath();
    ctx.moveTo(20, 465);
    ctx.lineTo(190, 465);
    ctx.stroke();

    // Ships
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('FLEET', 30, 490);

    const availableShips = game.ships - ships.length;
    ctx.font = '18px Georgia';
    for (let i = 0; i < game.ships; i++) {
        ctx.fillStyle = i < availableShips ? COLORS.ship : '#aaaaaa';
        ctx.fillText('⛵', 30 + i * 26, 515);
    }

    // Bribe card
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.beginPath();
    ctx.moveTo(20, 535);
    ctx.lineTo(190, 535);
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px Georgia';
    ctx.fillText('BRIBE CARDS', 30, 560);

    ctx.fillStyle = game.bribeCards > 0 ? COLORS.bribe : '#aaaaaa';
    ctx.font = 'bold 20px Georgia';
    ctx.fillText(game.bribeCards > 0 ? '🎴' : '-', 150, 565);
}

function drawButton(btn) {
    const isHovered = mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
                      mouse.y >= btn.y && mouse.y <= btn.y + btn.h;

    // Shadow
    if (isHovered) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(btn.x + 2, btn.y + 2, btn.w, btn.h);
    }

    ctx.fillStyle = isHovered ? COLORS.buttonHover : COLORS.button;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.textBaseline = 'alphabetic';
}

function drawTopBar() {
    // Background
    ctx.fillStyle = 'rgba(30, 20, 10, 0.85)';
    ctx.fillRect(210, 0, canvas.width - 210, 55);

    // Year
    ctx.fillStyle = COLORS.highlight;
    ctx.font = 'bold 22px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`${game.year}`, 230, 35);

    // Timeline dots
    const dotX = 340;
    for (let y = 1830; y <= 1839; y++) {
        const x = dotX + (y - 1830) * 28;
        ctx.fillStyle = y < game.year ? COLORS.tea : (y === game.year ? COLORS.highlight : '#444444');
        ctx.beginPath();
        ctx.arc(x, 28, y === game.year ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();

        if (y === game.year) {
            ctx.strokeStyle = COLORS.highlight;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    ctx.font = '9px Georgia';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.fillText('1830', 340, 48);
    ctx.fillText('1839', 592, 48);

    // Mood meter
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText("BRITAIN'S MOOD", canvas.width - 20, 16);

    // Mood bar
    const moodWidth = 150;
    ctx.fillStyle = '#222222';
    ctx.fillRect(canvas.width - moodWidth - 20, 24, moodWidth, 18);

    const moodColor = game.mood > 60 ? COLORS.tea : (game.mood > 30 ? COLORS.warning : COLORS.danger);
    ctx.fillStyle = moodColor;
    ctx.fillRect(canvas.width - moodWidth - 20, 24, moodWidth * (game.mood / 100), 18);

    // Mood percentage
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(game.mood)}%`, canvas.width - moodWidth / 2 - 20, 37);

    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - moodWidth - 20, 24, moodWidth, 18);
}

function drawQuotaPanel() {
    // Wider background with shadow to fit SHIP NOW button
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(225, canvas.height - 77, 450, 70);

    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(220, canvas.height - 80, 450, 70);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(220, canvas.height - 80, 450, 70);

    // Tea clipper icon
    ctx.font = '26px Georgia';
    ctx.fillText('⛵', 235, canvas.height - 38);

    // Quota text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`TEA ORDER: ${game.quota} chests`, 270, canvas.height - 55);

    // Progress bar
    const progress = Math.min(1, game.tea / game.quota);
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(270, canvas.height - 48, 150, 12);
    ctx.fillStyle = progress >= 1 ? COLORS.tea : COLORS.warning;
    ctx.fillRect(270, canvas.height - 48, 150 * progress, 12);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.strokeRect(270, canvas.height - 48, 150, 12);

    ctx.font = '11px Georgia';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`${game.tea} / ${game.quota}`, 430, canvas.height - 39);

    // Timer
    const minutes = Math.floor(game.quotaTimer / 60);
    const seconds = Math.floor(game.quotaTimer % 60);
    const timerUrgent = game.quotaTimer < 30;
    ctx.fillStyle = timerUrgent ? COLORS.danger : COLORS.text;
    ctx.font = `bold ${timerUrgent ? '20' : '18'}px Georgia`;
    ctx.textAlign = 'left';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 270, canvas.height - 20);

    // SHIP NOW button - only show if have enough tea
    const canShip = game.tea >= game.quota;
    const btn = buttons.shipEarly;
    const isHovered = mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
                      mouse.y >= btn.y && mouse.y <= btn.y + btn.h;

    // Button shadow
    if (isHovered && canShip) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(btn.x + 2, btn.y + 2, btn.w, btn.h);
    }

    // Button background - green if can ship, gray if not
    ctx.fillStyle = canShip ? (isHovered ? '#55cc55' : COLORS.tea) : '#888888';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    ctx.strokeStyle = canShip ? '#228822' : '#555555';
    ctx.lineWidth = isHovered && canShip ? 3 : 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // Button text
    ctx.fillStyle = canShip ? '#ffffff' : '#aaaaaa';
    ctx.font = 'bold 13px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.textBaseline = 'alphabetic';

    // Bonus indicator
    if (canShip) {
        const timeBonus = Math.floor(game.quotaTimer / 10);
        ctx.fillStyle = COLORS.highlight;
        ctx.font = '10px Georgia';
        ctx.fillText(`+${15 + timeBonus} mood`, btn.x + btn.w / 2, btn.y - 5);
    }

    if (timerUrgent && Math.sin(Date.now() * 0.01) > 0) {
        ctx.fillStyle = COLORS.danger;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(220, canvas.height - 80, 450, 70);
        ctx.globalAlpha = 1;
    }
}

function drawNewsTicker() {
    ctx.fillStyle = 'rgba(30, 20, 10, 0.9)';
    ctx.fillRect(210, canvas.height - 25, canvas.width - 210, 25);

    ctx.fillStyle = '#ccccaa';
    ctx.font = 'italic 12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`📜 ${game.newsMessage}`, 220, canvas.height - 8);
}

function drawEventPopup() {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Popup box
    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(250, 150, 400, 200);
    ctx.strokeStyle = COLORS.highlight;
    ctx.lineWidth = 3;
    ctx.strokeRect(250, 150, 400, 200);

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(game.currentEvent.title, 450, 190);

    // Message
    ctx.font = '14px Georgia';
    ctx.fillStyle = COLORS.textLight;
    const words = game.currentEvent.message.split(' ');
    let line = '';
    let y = 220;
    for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 360) {
            ctx.fillText(line, 450, y);
            line = word + ' ';
            y += 20;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 450, y);

    // Choices
    const choiceY = 300;
    const choiceWidth = 150;
    for (let i = 0; i < game.currentEvent.choices.length; i++) {
        const cx = 450 - (game.currentEvent.choices.length - 1) * 90 + i * 180 - choiceWidth / 2;
        const isHovered = mouse.x >= cx && mouse.x <= cx + choiceWidth &&
                          mouse.y >= choiceY && mouse.y <= choiceY + 40;

        ctx.fillStyle = isHovered ? COLORS.buttonHover : COLORS.button;
        ctx.fillRect(cx, choiceY, choiceWidth, 40);
        ctx.strokeStyle = COLORS.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, choiceY, choiceWidth, 40);

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 12px Georgia';
        ctx.fillText(game.currentEvent.choices[i].text, cx + choiceWidth / 2, choiceY + 25);
    }
}

function drawEndScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.victory) {
        // Victory screen with full stats
        ctx.fillStyle = COLORS.highlight;
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width / 2, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Georgia';
        ctx.fillText('You survived the opium trade until the war began.', canvas.width / 2, 120);

        // Stats panel
        ctx.fillStyle = COLORS.panelBg;
        ctx.fillRect(250, 150, 400, 300);
        ctx.strokeStyle = COLORS.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(250, 150, 400, 300);

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'left';

        const stats = [
            [`Tea Shipped:`, `${game.totalTeaShipped} chests`],
            [`Opium Sold:`, `${game.totalOpiumSold} chests`],
            [`Silver Remaining:`, `${game.silver}`],
            [`Ships Owned:`, `${game.ships}`],
            [`Ships Lost:`, `${game.shipsLost}`],
            [`Fines Paid:`, `${game.finesPaid} silver`],
            [`Chinese Addicted:`, `~${Math.round(game.totalOpiumSold * 3.5).toLocaleString()}`]
        ];

        let sy = 190;
        for (const [label, value] of stats) {
            ctx.fillStyle = COLORS.textLight;
            ctx.fillText(label, 280, sy);
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = 'right';
            ctx.fillText(value, 620, sy);
            ctx.textAlign = 'left';
            sy += 32;
        }

        // Historical note
        ctx.fillStyle = COLORS.textLight;
        ctx.font = 'italic 11px Georgia';
        ctx.textAlign = 'center';
        const note = "Your trading contributed to the opium crisis. The First Opium War (1839-1842) resulted from conflicts like these.";
        ctx.fillText(note, canvas.width / 2, 480);

        // Score
        const score = game.totalTeaShipped * 10 + game.silver + game.ships * 500 - Math.round(game.totalOpiumSold * 3.5) * 2;
        ctx.fillStyle = COLORS.highlight;
        ctx.font = 'bold 24px Georgia';
        ctx.fillText(`SCORE: ${score}`, canvas.width / 2, 520);
    } else {
        // Game over
        ctx.fillStyle = COLORS.danger;
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Georgia';
        ctx.fillText(game.message, canvas.width / 2, canvas.height / 2);

        ctx.font = '16px Georgia';
        ctx.fillText(`Tea Shipped: ${game.totalTeaShipped} chests`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText(`Year: ${game.year}`, canvas.width / 2, canvas.height / 2 + 80);
    }

    ctx.fillStyle = '#888888';
    ctx.font = '14px Georgia';
    ctx.fillText('Click to play again', canvas.width / 2, canvas.height - 40);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Expose for testing
window.game = game;

// Start
init();
