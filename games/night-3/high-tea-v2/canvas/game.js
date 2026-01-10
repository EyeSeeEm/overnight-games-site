// High Tea Clone - Canvas Version
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;

// Colors - vintage/sepia palette
const COLORS = {
    sea: '#4a8a8a',
    seaLight: '#5a9a9a',
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
    button: '#d4c0a0',
    buttonHover: '#e8d8b8',
    offer: '#ffffff',
    ship: '#8b4513'
};

// Game state
const game = {
    year: 1830,
    month: 1,
    silver: 500,
    opium: 0,
    tea: 0,
    ships: 1,
    maxShips: 6,
    mood: 100,
    quota: 60,
    teaShipped: 0,
    quotaTimer: 120, // seconds until clipper arrives
    paused: false,
    gameOver: false,
    message: '',
    messageTimer: 0
};

// Prices (vary by year)
let opiumPrice = 25;
let teaPrice = 15;

// Ports
const ports = [
    { name: 'Lintin Island', x: 650, y: 150, risk: 1, basePrice: 1.0 },
    { name: 'Whampoa', x: 700, y: 280, risk: 2, basePrice: 1.1 },
    { name: 'Canton', x: 580, y: 220, risk: 3, basePrice: 1.25 },
    { name: 'Macao', x: 550, y: 450, risk: 2, basePrice: 1.15 },
    { name: 'Bocca Tigris', x: 750, y: 380, risk: 4, basePrice: 1.4 }
];

// Active offers on ports
let offers = [];

// Ships in transit
let ships = [];

// Input
const mouse = { x: 0, y: 0, clicked: false };
let hoveredButton = null;

// Buttons
const buttons = {
    buyOpium5: { x: 30, y: 300, w: 45, h: 30, text: '5', action: () => buyOpium(5) },
    buyOpium15: { x: 85, y: 300, w: 45, h: 30, text: '15', action: () => buyOpium(15) },
    buyOpium30: { x: 140, y: 300, w: 45, h: 30, text: '30', action: () => buyOpium(30) },
    buyTea5: { x: 30, y: 420, w: 45, h: 30, text: '5', action: () => buyTea(5) },
    buyTea15: { x: 85, y: 420, w: 45, h: 30, text: '15', action: () => buyTea(15) },
    buyTea30: { x: 140, y: 420, w: 45, h: 30, text: '30', action: () => buyTea(30) }
};

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
}

// Spawn a new port offer
function spawnOffer() {
    if (offers.length >= 3) return;

    // Pick random port without existing offer
    const availablePorts = ports.filter(p => !offers.find(o => o.port === p));
    if (availablePorts.length === 0) return;

    const port = availablePorts[Math.floor(Math.random() * availablePorts.length)];
    const quantity = 10 + Math.floor(Math.random() * 30) + Math.floor(game.year - 1830) * 5;
    const pricePerChest = Math.round(40 * port.basePrice * (0.9 + Math.random() * 0.3));

    offers.push({
        port,
        quantity,
        price: pricePerChest,
        timer: 10 + Math.random() * 8, // Expires in 10-18 seconds
        animY: 0
    });
}

// Buy opium
function buyOpium(amount) {
    const cost = amount * opiumPrice;
    if (game.silver >= cost) {
        game.silver -= cost;
        game.opium += amount;
        showMessage(`Bought ${amount} opium chests`);
    } else {
        showMessage('Not enough silver!');
    }
}

// Buy tea
function buyTea(amount) {
    const cost = amount * teaPrice;
    if (game.silver >= cost) {
        game.silver -= cost;
        game.tea += amount;
        showMessage(`Bought ${amount} tea chests`);
    } else {
        showMessage('Not enough silver!');
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

    // Send ship
    game.opium -= offer.quantity;
    ships.push({
        x: 300,
        y: 550,
        targetX: offer.port.x,
        targetY: offer.port.y,
        returning: false,
        cargo: offer.quantity,
        value: offer.quantity * offer.price,
        risk: offer.port.risk,
        port: offer.port
    });

    // Remove offer
    offers = offers.filter(o => o !== offer);
    showMessage(`Ship sent to ${offer.port.name}`);
}

// Show message
function showMessage(msg) {
    game.message = msg;
    game.messageTimer = 3;
}

// Handle click
function handleClick(e) {
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
        game.quotaTimer = 120;
        game.gameOver = false;
        offers = [];
        ships = [];
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
        if (mouse.x >= ox - 50 && mouse.x <= ox + 50 &&
            mouse.y >= oy - 30 && mouse.y <= oy + 30) {
            acceptOffer(offer);
            return;
        }
    }
}

// Update game logic
function update(dt) {
    if (game.gameOver) return;

    // Update offer timers
    for (let i = offers.length - 1; i >= 0; i--) {
        offers[i].timer -= dt;
        offers[i].animY += dt * 3;
        if (offers[i].timer <= 0) {
            offers.splice(i, 1);
        }
    }

    // Spawn new offers
    if (Math.random() < dt * 0.3) {
        spawnOffer();
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

        if (dist > 5) {
            ship.x += (dx / dist) * speed * dt;
            ship.y += (dy / dist) * speed * dt;
        } else if (!ship.returning) {
            // Arrived at port - risk check
            const riskChance = ship.risk * 0.1;
            if (Math.random() < riskChance) {
                // Caught!
                if (Math.random() < 0.3) {
                    // Ship captured
                    showMessage(`Ship captured at ${ship.port.name}!`);
                    ships.splice(i, 1);
                    game.ships--;
                    if (game.ships <= 0) {
                        game.gameOver = true;
                        game.message = 'All ships lost! Game Over.';
                    }
                    continue;
                } else {
                    // Just fined
                    const fine = Math.floor(ship.value * 0.3);
                    ship.value -= fine;
                    showMessage(`Fined ${fine} silver at ${ship.port.name}`);
                }
            }
            ship.returning = true;
        } else {
            // Returned home
            game.silver += ship.value;
            showMessage(`Ship returned with ${ship.value} silver`);
            ships.splice(i, 1);
        }
    }

    // Quota timer
    game.quotaTimer -= dt;
    if (game.quotaTimer <= 0) {
        // Clipper arrives - ship tea
        const shipped = Math.min(game.tea, game.quota);
        game.tea -= shipped;
        game.teaShipped += shipped;

        if (shipped >= game.quota) {
            // Met quota
            game.mood = Math.min(100, game.mood + 15);
            game.ships = Math.min(game.maxShips, game.ships + 1);
            showMessage(`Quota met! +1 ship. Britain is pleased.`);
        } else {
            // Failed quota
            const shortfall = game.quota - shipped;
            game.mood -= 20 + Math.floor(shortfall / 10) * 5;
            showMessage(`Quota missed by ${shortfall}! Britain is angry.`);
        }

        // Next year
        advanceYear();
    }

    // Mood decay
    game.mood -= dt * 0.5;
    if (game.mood <= 0) {
        game.gameOver = true;
        game.message = "Britain's patience has run out. Game Over.";
    }

    // Message timer
    if (game.messageTimer > 0) {
        game.messageTimer -= dt;
    }
}

// Advance to next year
function advanceYear() {
    game.year++;
    if (game.year > 1839) {
        // Victory!
        game.gameOver = true;
        game.message = `Victory! Shipped ${game.teaShipped} tea. The Opium War begins...`;
        return;
    }

    // Update quota and timer
    const quotas = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];
    game.quota = quotas[game.year - 1830] || 660;
    game.quotaTimer = 120;

    updatePrices();
    showMessage(`Year ${game.year} begins. Quota: ${game.quota} tea`);
}

// Drawing
function draw() {
    // Clear
    ctx.fillStyle = COLORS.sea;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map
    drawMap();

    // Draw ships
    ships.forEach(drawShip);

    // Draw offers
    offers.forEach(drawOffer);

    // Draw ports
    ports.forEach(drawPort);

    // Draw left panel
    drawLeftPanel();

    // Draw top bar
    drawTopBar();

    // Draw bottom quota panel
    drawQuotaPanel();

    // Draw message
    if (game.messageTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(250, 250, 400, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, 450, 280);
    }

    // Game over
    if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '20px Georgia';
        ctx.fillText(`Tea Shipped: ${game.teaShipped} chests`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(`Silver: ${game.silver}`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 100);
    }
}

function drawMap() {
    // Sea wave pattern
    ctx.fillStyle = COLORS.seaLight;
    for (let y = 0; y < canvas.height; y += 30) {
        for (let x = 200; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.arc(x + Math.sin(y * 0.1 + game.quotaTimer * 0.5) * 10, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Main land mass (simplified Pearl River Delta)
    ctx.fillStyle = COLORS.land;

    // Top land
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
    ctx.beginPath();
    ctx.moveTo(450, 150);
    ctx.quadraticCurveTo(500, 200, 480, 280);
    ctx.quadraticCurveTo(520, 350, 500, 400);
    ctx.lineTo(400, 380);
    ctx.quadraticCurveTo(380, 300, 400, 220);
    ctx.closePath();
    ctx.fill();

    // Macao peninsula
    ctx.beginPath();
    ctx.moveTo(450, 400);
    ctx.quadraticCurveTo(500, 450, 520, 520);
    ctx.lineTo(580, 600);
    ctx.lineTo(400, 600);
    ctx.lineTo(420, 480);
    ctx.closePath();
    ctx.fill();

    // Right land
    ctx.beginPath();
    ctx.moveTo(750, 200);
    ctx.lineTo(850, 250);
    ctx.lineTo(900, 300);
    ctx.lineTo(900, 200);
    ctx.lineTo(820, 150);
    ctx.closePath();
    ctx.fill();

    // Land shadows
    ctx.fillStyle = COLORS.landDark;
    ctx.beginPath();
    ctx.moveTo(450, 160);
    ctx.lineTo(420, 200);
    ctx.lineTo(430, 250);
    ctx.lineTo(470, 250);
    ctx.lineTo(490, 180);
    ctx.closePath();
    ctx.fill();
}

function drawPort(port) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(port.x, port.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = '11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(port.name, port.x, port.y + 22);
}

function drawOffer(offer) {
    const x = offer.port.x;
    const y = offer.port.y - 50 + Math.sin(offer.animY) * 3;

    // Bubble background
    ctx.fillStyle = COLORS.offer;
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x - 55, y - 35, 110, 65, 8);
    ctx.fill();
    ctx.stroke();

    // Arrow pointing down
    ctx.fillStyle = COLORS.offer;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 30);
    ctx.lineTo(x, y + 40);
    ctx.lineTo(x + 8, y + 30);
    ctx.fill();

    // Content
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`${offer.quantity} CHESTS`, x, y - 15);

    ctx.font = '12px Georgia';
    ctx.fillText(`${offer.price} silver/chest`, x, y + 5);

    // Risk stars
    const riskX = x - 15;
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < offer.port.risk ? '#ffd700' : '#cccccc';
        ctx.font = '10px Georgia';
        ctx.fillText('★', riskX + i * 10, y + 22);
    }

    // Timer bar
    const timerWidth = Math.max(0, (offer.timer / 18) * 80);
    ctx.fillStyle = offer.timer < 5 ? COLORS.danger : COLORS.tea;
    ctx.fillRect(x - 40, y - 30, timerWidth, 4);
}

function drawShip(ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // Calculate angle
    const tx = ship.returning ? 300 : ship.targetX;
    const ty = ship.returning ? 550 : ship.targetY;
    const angle = Math.atan2(ty - ship.y, tx - ship.x);
    ctx.rotate(angle);

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
    ctx.fillRect(-5, -10, 2, 20);
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(8, 0);
    ctx.lineTo(-4, 8);
    ctx.fill();

    ctx.restore();
}

function drawLeftPanel() {
    // Panel background
    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(0, 0, 210, canvas.height);

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 210, canvas.height);

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', 105, 35);

    // Silver
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.silver;
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${game.silver}`, 50, 75);
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '12px Georgia';
    ctx.fillText('SILVER COINS', 50, 92);

    // Opium
    ctx.fillStyle = COLORS.opium;
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${game.opium}`, 50, 130);
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '12px Georgia';
    ctx.fillText('OPIUM CHESTS', 50, 147);

    // Tea
    ctx.fillStyle = COLORS.tea;
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(`${game.tea}`, 50, 185);
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '12px Georgia';
    ctx.fillText('TEA CHESTS', 50, 202);

    // Divider
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 220);
    ctx.lineTo(190, 220);
    ctx.stroke();

    // Buy Opium section
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY OPIUM', 105, 250);

    ctx.fillStyle = COLORS.opium;
    ctx.font = '14px Georgia';
    ctx.fillText(`${opiumPrice} silver/chest`, 105, 275);

    // Opium buttons
    drawButton(buttons.buyOpium5);
    drawButton(buttons.buyOpium15);
    drawButton(buttons.buyOpium30);

    // Divider
    ctx.beginPath();
    ctx.moveTo(20, 350);
    ctx.lineTo(190, 350);
    ctx.stroke();

    // Buy Tea section
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('BUY TEA', 105, 375);

    ctx.fillStyle = COLORS.tea;
    ctx.font = '14px Georgia';
    ctx.fillText(`${teaPrice} silver/chest`, 105, 397);

    // Tea buttons
    drawButton(buttons.buyTea5);
    drawButton(buttons.buyTea15);
    drawButton(buttons.buyTea30);

    // Divider
    ctx.beginPath();
    ctx.moveTo(20, 470);
    ctx.lineTo(190, 470);
    ctx.stroke();

    // Ships
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('SHIPS', 30, 500);

    const availableShips = game.ships - ships.length;
    ctx.font = '20px Georgia';
    for (let i = 0; i < game.ships; i++) {
        ctx.fillStyle = i < availableShips ? COLORS.ship : '#aaaaaa';
        ctx.fillText('⛵', 30 + i * 28, 530);
    }
}

function drawButton(btn) {
    const isHovered = mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
                      mouse.y >= btn.y && mouse.y <= btn.y + btn.h;

    ctx.fillStyle = isHovered ? COLORS.buttonHover : COLORS.button;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 1;
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(210, 0, canvas.width - 210, 50);

    // Year
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`${game.year}`, 230, 32);

    // Timeline dots
    const dotX = 350;
    for (let y = 1830; y <= 1839; y++) {
        const x = dotX + (y - 1830) * 30;
        ctx.fillStyle = y <= game.year ? '#ffffff' : '#555555';
        ctx.beginPath();
        ctx.arc(x, 25, y === game.year ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.font = '10px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('1830', 350, 45);
    ctx.fillText('1839', 620, 45);

    // Mood meter
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText("BRITAIN'S MOOD", canvas.width - 20, 18);

    // Mood bar
    const moodWidth = 150;
    ctx.fillStyle = '#333333';
    ctx.fillRect(canvas.width - moodWidth - 20, 25, moodWidth, 15);

    const moodColor = game.mood > 50 ? COLORS.tea : (game.mood > 25 ? '#ffaa00' : COLORS.danger);
    ctx.fillStyle = moodColor;
    ctx.fillRect(canvas.width - moodWidth - 20, 25, moodWidth * (game.mood / 100), 15);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(canvas.width - moodWidth - 20, 25, moodWidth, 15);
}

function drawQuotaPanel() {
    // Background
    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(250, canvas.height - 80, 300, 70);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(250, canvas.height - 80, 300, 70);

    // Tea clipper icon
    ctx.font = '24px Georgia';
    ctx.fillText('⛵', 265, canvas.height - 40);

    // Quota text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`TEA ORDER: ${game.quota} chests`, 300, canvas.height - 55);

    ctx.font = '12px Georgia';
    ctx.fillText(`Your tea: ${game.tea} chests`, 300, canvas.height - 35);

    // Timer
    const minutes = Math.floor(game.quotaTimer / 60);
    const seconds = Math.floor(game.quotaTimer % 60);
    ctx.fillStyle = game.quotaTimer < 30 ? COLORS.danger : COLORS.text;
    ctx.font = 'bold 18px Georgia';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 480, canvas.height - 40);
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
